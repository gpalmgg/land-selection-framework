#!/usr/bin/env node
// Builds a SYNTHETIC stress site: a copy of prototype/ whose data holds more regions than the real slate, so the page can
// be tested at the size it will grow to (continent switching, the cards grid, the summary table, slider ticks).
//
//   node scripts/make_stress_site.mjs --regions 45 --out DIR [--src DIR] [--seed N]
//
//   --regions N   total regions in the output (real regions + synthetic clones); must be larger than the real count
//   --out DIR     output directory; it must sit under upgrade-2026-10/verify/scratch/ and is deleted and recreated
//   --src DIR     the site to copy (default: the prototype/ this script lives in)
//   --seed N      seed of the coordinate jitter (default 20261005)
//
// What it does
//   1. Copies the site without .venv, node_modules, data/raw (and the other build-only folders: scripts, tests, research
//      dossiers, full footprints, fetch caches, python and markdown files, .vercel).
//   2. Regenerates the slim client lookup (data/v1-lookup.js) and the region pages INTO THE COPY with the site's own generators,
//      when they are present and accept the flag (the same two steps tests/e2e/tools/scratch_site.py runs).
//   3. Extends data/regions.js (regions and values), data/land-standing.js, data/region-depth.js and every layer of
//      data/v1-lookup.js with synthetic clones of the real regions: new ids (syn-eu-01, syn-na-01, ...), alternating
//      continents, coordinates jittered inside each continent's bounding box (taken from the real regions), accents from
//      upgrade-2026-10/design/final-assets/region-accents.json, names that include a very long one and several outside
//      Latin-1. The clones are copied TEXTUALLY in the house format (the same lines, the new id), so every script and test
//      that parses these files by pattern keeps working.
//   4. Writes the SYNTHETIC banner: SYNTHETIC-STRESS-SITE.txt, a comment at the top of each extended file and one in
//      index.html. The output is never deployed and never a source of facts: every clone repeats the numbers of the real
//      region it was copied from.
//
// Nothing outside DIR is written.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(HERE, '..');
const REPO = resolve(PROTO, '..');
const SCRATCH_ROOT = join(REPO, 'upgrade-2026-10', 'verify', 'scratch');
const ACCENTS = join(REPO, 'upgrade-2026-10', 'design', 'final-assets', 'region-accents.json');

const BANNER = 'SYNTHETIC STRESS DATA: clones of real regions with invented ids, names and coordinates, built by scripts/make_stress_site.mjs for layout and performance tests only. Never deploy this folder; nothing in it is a fact about a place.';

// Names that stress the layout: one very long, the rest outside Latin-1 (macrons, Polish and Czech letters, Greek, CJK).
const SPECIAL_NAMES = [
  { name: 'Synthetic Stress Clone of the Long Atlantic Coastal Bioregion and its Many Neighbouring Upland Watersheds and Commons', short: null },
  { name: 'Ōtākaro Łąki Žemaitija Ǧabal', short: 'Ōtākaro Łąki' },
  { name: 'Σύνθετη Περιοχή Δοκιμής', short: 'Σύνθετη' },
  { name: 'テスト地域 試験流域', short: 'テスト地域' },
];

// ----------------------------------------------------------------------------------------------------------- arguments
function parseArgs(argv) {
  const a = { regions: null, out: null, src: PROTO, seed: 20261005 };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i];
    if (k === '--regions') a.regions = parseInt(argv[++i], 10);
    else if (k === '--out') a.out = argv[++i];
    else if (k === '--src') a.src = resolve(argv[++i]);
    else if (k === '--seed') a.seed = parseInt(argv[++i], 10);
    else if (k === '--help' || k === '-h') a.help = true;
    else throw new Error(`unknown argument ${k}`);
  }
  return a;
}

function fail(msg) {
  console.error(`make_stress_site: ${msg}`);
  process.exit(1);
}

function prng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

// ----------------------------------------------------------------------------------------------------------- copy
const SKIP_DIRS = new Set(['.venv', 'node_modules', 'tests', 'scripts', 'public', '.vercel', '__pycache__', '.fetch-cache', 'research-dossier', 'footprints-full', 'raw', 'aqueduct-extract']);

function copySite(src, out) {
  cpSync(src, out, {
    recursive: true,
    filter: (from) => {
      const rel = relative(src, from).split(sep);
      if (rel.some((p) => SKIP_DIRS.has(p))) return false;
      const base = rel[rel.length - 1] || '';
      if (/\.(py|pyc|md|bak)$/.test(base) || /\.test\.m?js$/.test(base) || base === '.DS_Store') return false;
      return true;
    },
  });
}

function runGenerator(src, out, script, flag, args) {
  const path = join(src, 'scripts', script);
  if (!existsSync(path)) return `${script}: skipped (not in the tree)`;
  const text = readFileSync(path, 'utf8');
  if (!text.includes(flag)) return `${script}: skipped (does not name ${flag})`;
  const r = spawnSync('node', [path, ...args], { cwd: src, encoding: 'utf8' });
  if (r.status !== 0) return `${script}: FAILED (exit ${r.status}), kept the copied file. ${String(r.stderr || r.stdout).slice(-300).trim()}`;
  return `${script}: ran`;
}

// ----------------------------------------------------------------------------------------------------------- text blocks
const lines = (t) => t.split('\n');

// The index of the line that opens `export const NAME = ` plus the index of the first line after it that is exactly `close`.
function exportSpan(text, name, close) {
  const ls = lines(text);
  const open = ls.findIndex((l) => l.startsWith(`export const ${name} = `));
  if (open < 0) throw new Error(`no "export const ${name}" found`);
  const end = ls.findIndex((l, i) => i > open && l === close);
  if (end < 0) throw new Error(`no closing "${close}" found for ${name}`);
  return { ls, open, end };
}

// One top-level entry of an object export: from the line `  KEY: ...{` or `  KEY: block(...{` (KEY bare, 'single' or "double"
// quoted) to the first following line equal to `closer` (two-space indent). Returns [startIndex, endIndex] inclusive.
function entrySpan(ls, from, to, id, opener) {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`^  (?:'${esc}'|"${esc}"|${esc}): ${opener}`);
  const start = ls.findIndex((l, i) => i > from && i < to && re.test(l));
  if (start < 0) return null;
  const closer = opener.includes('block') ? '  }),' : '  },';
  const end = ls.findIndex((l, i) => i > start && i < to && l === closer);
  if (end < 0) return null;
  return [start, end];
}

function requoteKey(line, id, newId) {
  const esc = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return line.replace(new RegExp(`^  (?:'${esc}'|"${esc}"|${esc}):`), `  '${newId}':`);
}

// ----------------------------------------------------------------------------------------------------------- the plan
async function loadModule(file) {
  return import(`${pathToFileURL(file).href}?stress=${Date.now()}`);
}

function planClones(real, total, accents, seed) {
  const need = total - real.length;
  const rand = prng(seed);
  const byContinent = {};
  real.forEach((r) => { (byContinent[r.continent] ||= []).push(r); });
  const continents = Object.keys(byContinent);
  const box = {};
  for (const c of continents) {
    const xs = byContinent[c].map((r) => r.coords[0]);
    const ys = byContinent[c].map((r) => r.coords[1]);
    box[c] = { x: [Math.min(...xs), Math.max(...xs)], y: [Math.min(...ys), Math.max(...ys)] };
  }
  const accentList = Object.values(accents);
  const counters = {};
  const clones = [];
  for (let i = 0; i < need; i++) {
    const c = continents[i % continents.length];
    counters[c] = (counters[c] || 0) + 1;
    const n = counters[c];
    const pool = byContinent[c];
    const src = pool[(n - 1) % pool.length];
    const tag = c === 'europe' ? 'eu' : c === 'north-america' ? 'na' : c.slice(0, 2);
    const id = `syn-${tag}-${String(n).padStart(2, '0')}`;
    const jitter = (v, [lo, hi]) => Math.min(hi, Math.max(lo, v + (rand() * 2 - 1) * 3));
    const coords = [
      +jitter(src.coords[0], box[c].x).toFixed(2),
      +jitter(src.coords[1], box[c].y).toFixed(2),
    ];
    const special = SPECIAL_NAMES[i] || null;
    clones.push({
      id,
      continent: c,
      source: src,
      coords,
      name: special ? special.name : `${src.name} (clone ${n})`,
      short: special ? special.short : (src.short ? `${src.short} (clone ${n})` : undefined),
      dropShort: special ? special.short === null : false,
      accent: accentList[(i * 7 + 3) % accentList.length],
    });
  }
  return clones;
}

// ----------------------------------------------------------------------------------------------------------- extenders
const q = (s) => `'${String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

function cloneRegionObject(ls, span, clone) {
  const out = ls.slice(span[0], span[1] + 1).map((l) => {
    if (/^    id: /.test(l)) return `    id: ${q(clone.id)},`;
    if (/^    name: /.test(l)) return `    name: ${q(clone.name)},`;
    if (/^    short: /.test(l)) return clone.short ? `    short: ${q(clone.short)},` : null;
    if (/^    coords: /.test(l)) return `    coords: [${clone.coords[0]}, ${clone.coords[1]}],`;
    if (/^    accent: /.test(l)) return `    accent: ${q(clone.accent)},`;
    if (/^    blurb: /.test(l)) return l.replace(/^(    blurb: ')/, '$1Synthetic stress-test clone. ');
    return l;
  }).filter((l) => l !== null);
  return out;
}

function extendRegions(text, real, clones) {
  const { ls, open, end } = exportSpan(text, 'regions', '];');
  const vOpen = ls.findIndex((l) => l.startsWith('export const values = '));
  const vEnd = ls.findIndex((l, i) => i > vOpen && l === '};');
  if (vOpen < 0 || vEnd < 0) throw new Error('no values export in regions.js');
  const objects = [];
  const blocks = [];
  for (const c of clones) {
    // region object: the `  {` line before `    id: 'X'` through the next `  },`
    const idLine = ls.findIndex((l, i) => i > open && i < end && l === `    id: '${c.source.id}',`);
    if (idLine < 0) throw new Error(`region object of ${c.source.id} not found in the house format`);
    const first = idLine - 1;
    const last = ls.findIndex((l, i) => i > idLine && l === '  },');
    objects.push(...cloneRegionObject(ls, [first, last], c));
    const span = entrySpan(ls, vOpen, vEnd, c.source.id, 'block\\(');
    if (!span) throw new Error(`values block of ${c.source.id} not found in the house format`);
    const body = ls.slice(span[0], span[1] + 1);
    body[0] = requoteKey(body[0], c.source.id, c.id);
    blocks.push(...body);
  }
  // values first (later in the file), then the regions array, so the earlier indexes stay valid
  ls.splice(vEnd, 0, ...blocks);
  ls.splice(end, 0, ...objects);
  return `// ${BANNER}\n${ls.join('\n')}`;
}

function extendKeyed(text, exportName, clones) {
  const { ls, open, end } = exportSpan(text, exportName, '};');
  const add = [];
  for (const c of clones) {
    const span = entrySpan(ls, open, end, c.source.id, '\\{\\s*$');
    if (!span) continue; // a region with no entry in this file gets none: the page treats absence as "not written up"
    const body = ls.slice(span[0], span[1] + 1);
    body[0] = requoteKey(body[0], c.source.id, c.id);
    add.push(...body);
  }
  ls.splice(end, 0, ...add);
  return `// ${BANNER}\n${ls.join('\n')}`;
}

async function extendLookup(file, clones) {
  const mod = await loadModule(file);
  const text = readFileSync(file, 'utf8');
  const header = text.split('\n').filter((l, i, all) => i < all.findIndex((x) => x.startsWith('export '))).join('\n');
  const parts = [`// ${BANNER}`, header];
  for (const [name, value] of Object.entries(mod)) {
    let v = value;
    if (name === 'v1Lookup') {
      v = JSON.parse(JSON.stringify(value));
      for (const layer of Object.keys(v)) {
        for (const c of clones) {
          const rec = v[layer][c.source.id];
          if (!rec) continue;
          const copy = JSON.parse(JSON.stringify(rec));
          if ('region_id' in copy) copy.region_id = c.id;
          v[layer][c.id] = copy;
        }
      }
    }
    parts.push(`export const ${name} = ${JSON.stringify(v, null, 2)};`);
  }
  return parts.filter((p) => p !== '').join('\n') + '\n';
}

// ----------------------------------------------------------------------------------------------------------- main
async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (a.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 23).map((l) => l.replace(/^\/\/ ?/, '')).join('\n'));
    return;
  }
  if (!Number.isInteger(a.regions) || !a.out) fail('usage: node scripts/make_stress_site.mjs --regions N --out DIR');
  const out = resolve(a.out);
  if (!out.startsWith(SCRATCH_ROOT + sep)) fail(`--out must be under ${SCRATCH_ROOT} (it is deleted and recreated)`);
  if (!existsSync(join(a.src, 'data', 'regions.js'))) fail(`${a.src} is not a site (no data/regions.js)`);

  const notes = [];
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  copySite(a.src, out);

  notes.push(runGenerator(a.src, out, 'gen_v1_lookup.mjs', '--out', ['--out', join(out, 'data', 'v1-lookup.js')]));
  notes.push(runGenerator(a.src, out, 'gen_region_pages.mjs', '--out-dir', ['--out-dir', out]));

  const regionsFile = join(out, 'data', 'regions.js');
  const realMod = await loadModule(regionsFile);
  const real = realMod.regions;
  if (a.regions <= real.length) fail(`--regions ${a.regions} must exceed the ${real.length} real regions`);
  const accents = JSON.parse(readFileSync(ACCENTS, 'utf8'));
  const clones = planClones(real, a.regions, accents, a.seed);

  writeFileSync(regionsFile, extendRegions(readFileSync(regionsFile, 'utf8'), real, clones));
  for (const [file, name] of [['land-standing.js', 'landStanding'], ['region-depth.js', 'regionDepth']]) {
    const p = join(out, 'data', file);
    if (!existsSync(p)) { notes.push(`${file}: absent, skipped`); continue; }
    writeFileSync(p, extendKeyed(readFileSync(p, 'utf8'), name, clones));
  }
  const lookup = join(out, 'data', 'v1-lookup.js');
  if (existsSync(lookup)) writeFileSync(lookup, await extendLookup(lookup, clones));
  else notes.push('v1-lookup.js: absent, skipped');

  // data/load-slim.js (the first-paint salutations and card "asks", derived from the three files extended above) must cover the clones.
  notes.push(runGenerator(a.src, out, 'gen_load_slim.mjs', '--root', ['--root', out, '--write']));

  // banner
  writeFileSync(join(out, 'SYNTHETIC-STRESS-SITE.txt'), `${BANNER}\n\nreal regions: ${real.length}\nsynthetic clones: ${clones.length}\ntotal: ${a.regions}\nclones: ${clones.map((c) => `${c.id}<-${c.source.id}`).join(', ')}\n`);
  const indexFile = join(out, 'index.html');
  if (existsSync(indexFile)) {
    const html = readFileSync(indexFile, 'utf8');
    writeFileSync(indexFile, html.replace(/<head([^>]*)>/i, `<head$1>\n<!-- ${BANNER} -->`));
  }

  // proof: the extended data parses, ids are unique and every region has a values block
  const check = await loadModule(regionsFile);
  const ids = check.regions.map((r) => r.id);
  if (new Set(ids).size !== ids.length) fail('duplicate region ids after extension');
  if (ids.length !== a.regions) fail(`expected ${a.regions} regions, found ${ids.length}`);
  const missing = ids.filter((id) => !check.values[id]);
  if (missing.length) fail(`regions without a values block: ${missing.join(', ')}`);
  const perContinent = {};
  check.regions.forEach((r) => { perContinent[r.continent] = (perContinent[r.continent] || 0) + 1; });

  console.log('SYNTHETIC STRESS SITE (never deployed)');
  console.log(`  ${out}`);
  console.log(`  ${real.length} real + ${clones.length} synthetic = ${ids.length} regions (${Object.entries(perContinent).map(([c, n]) => `${c} ${n}`).join(', ')})`);
  notes.forEach((n) => console.log(`  ${n}`));
  const size = (function total(d) { return readdirSync(d).reduce((s, f) => { const p = join(d, f); const st = statSync(p); return s + (st.isDirectory() ? total(p) : st.size); }, 0); })(out);
  console.log(`  ${(size / 1e6).toFixed(1)} MB`);
}

main().catch((e) => fail(e && e.stack ? e.stack : String(e)));
