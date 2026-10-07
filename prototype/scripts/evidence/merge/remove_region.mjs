#!/usr/bin/env node
// Remove one region from every data module in house format (plan policy P-DROP: a region ships only with complete,
// verified data; one that cannot is dropped). Run only by the orchestrator.
//
//   node scripts/evidence/merge/remove_region.mjs <region-id> [--root DIR] [--dry-run] [--allow-absent]
//
// What it edits (all with brace-matched edits on the source text, never a regex over a whole file):
//   data/regions.js            the regions[] element and the values block
//   data/*.js                  every other `export const X = { ... }` keyed by region ids (land-standing.js, region-depth.js,
//                              reciprocity.js, bioregions.js, legal-pathway.js, context.js, ... discovered, not listed) and
//                              every array of objects whose own id / regionId / region_id is the region
//   data/footprints.json       the keyed entry; data/footprints/<id>.geojson is deleted
//   data/processed/*.json|geojson  the per-jurisdiction records (array element with region_id, GeoJSON feature whose
//                              properties.region_id is the region): legal-ownership, land-cost, demographic-trajectory,
//                              soil-contamination, water-source-control, climate-buffering (json + geojson) and
//                              hospital-proximity.geojson
//   region/<id>.html           deleted if present
// It never touches source-docs, generated files (data/v1-lookup.js, sitemap.xml, llms.txt: regenerate them after) or
// staging modules. Every edited file is re-parsed (JSON.parse / import) before anything is written; one failure writes
// nothing. A second run finds nothing and refuses (exit 2) unless --allow-absent is given.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  objectEntries, arrayElements, exportedObjects, findExport, readLiteral, removeSpan, skipTrivia, matchClose,
} from './jsscan.mjs';
import { parseArgs, resolveRoots, printLine, isMain } from './common.mjs';

const ID_KEYS = ['id', 'regionId', 'region_id'];
const PROCESSED = ['legal-ownership', 'land-cost', 'demographic-trajectory', 'soil-contamination', 'water-source-control', 'climate-buffering'];
const SKIP_JS = /(\.staging\.js$|^v1-lookup\.js$|^sources\.js$|^layer-sources\.js$|^site-facts\.js$|^presets\.js$)/;

function literalOf(src, rec) { const l = readLiteral(src, rec.valStart, rec.valEnd); return l.type === 'string' ? l.value : null; }
function elementHasId(src, el, id, { nested = false } = {}) {
  if (src[el.valStart] !== '{') return false;
  const o = objectEntries(src, el.valStart);
  for (const e of o.entries) {
    if (ID_KEYS.includes(e.key) && literalOf(src, e) === id) return true;
    if (nested && e.key === 'properties' && src[e.valStart] === '{') {
      const p = objectEntries(src, e.valStart);
      if (p.entries.some((x) => ID_KEYS.includes(x.key) && literalOf(src, x) === id)) return true;
    }
  }
  return false;
}

// Remove from the container (object or array) that starts at `pos`. Returns { src, removed: n, what }.
function removeFromContainer(src, pos, id, opts = {}) {
  let removed = 0;
  let what = null;
  for (let guard = 0; guard < 1000; guard++) {
    let hit = -1;
    let siblings;
    if (src[pos] === '{') {
      const o = objectEntries(src, pos);
      siblings = o.entries;
      hit = siblings.findIndex((e) => e.key === id);
      if (hit >= 0) what = 'key';
    } else if (src[pos] === '[') {
      const a = arrayElements(src, pos);
      siblings = a.elements;
      hit = siblings.findIndex((e) => elementHasId(src, e, id, opts));
      if (hit >= 0) what = opts.nested ? 'feature' : 'element';
    } else break;
    if (hit < 0) break;
    src = removeSpan(src, siblings, hit, [id]);
    removed++;
  }
  return { src, removed, what };
}

function validateJs(text, fromDir) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsf-rm-'));
  try {
    const f = path.join(dir, 'm.mjs');
    fs.writeFileSync(f, text.replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_, pre, q, spec) => `${pre}${q}${pathToFileURL(path.resolve(fromDir, spec)).href}${q}`));
    return import(`${pathToFileURL(f).href}?t=${Date.now()}${Math.random()}`).finally(() => fs.rmSync(dir, { recursive: true, force: true }));
  } catch (e) { fs.rmSync(dir, { recursive: true, force: true }); throw e; }
}

export async function removeRegion(id, { ROOT, dryRun = false, allowAbsent = false }) {
  const changes = []; // { file, text? , delete?, summary }
  const dataDir = path.join(ROOT, 'data');
  const rel = (p) => path.relative(ROOT, p);

  // 1. JS modules
  if (fs.existsSync(dataDir)) {
    for (const name of fs.readdirSync(dataDir).filter((f) => f.endsWith('.js')).sort()) {
      if (SKIP_JS.test(name)) continue;
      const abs = path.join(dataDir, name);
      let src = fs.readFileSync(abs, 'utf8');
      if (/^\/\/ AUTO-GENERATED/.test(src)) continue;
      const parts = [];
      let total = 0;
      for (const ex of exportedObjects(src).reverse()) { // from the end so earlier positions stay valid
        const r = removeFromContainer(src, ex.pos, id);
        if (r.removed) { src = r.src; total += r.removed; parts.push(`${ex.name} (${r.what}${r.removed > 1 ? ` x${r.removed}` : ''})`); }
      }
      if (total) changes.push({ file: abs, text: src, summary: `removed ${parts.reverse().join(', ')}`, js: true });
    }
  }
  // 2. footprints
  const fpJson = path.join(dataDir, 'footprints.json');
  if (fs.existsSync(fpJson)) {
    const src = fs.readFileSync(fpJson, 'utf8');
    const r = removeFromContainer(src, skipTrivia(src, 0), id);
    if (r.removed) changes.push({ file: fpJson, text: r.src, summary: 'removed key', json: true });
  }
  const fpGeo = path.join(dataDir, 'footprints', `${id}.geojson`);
  if (fs.existsSync(fpGeo)) changes.push({ file: fpGeo, delete: true, summary: 'deleted file' });
  // 3. per-jurisdiction processed records
  const procDir = path.join(dataDir, 'processed');
  if (fs.existsSync(procDir)) {
    const names = new Set();
    for (const n of PROCESSED) { names.add(`${n}.json`); names.add(`${n}.geojson`); }
    names.add('hospital-proximity.geojson');
    for (const f of fs.readdirSync(procDir)) {
      if (names.has(f)) continue;
      if (!/\.(json|geojson)$/.test(f)) continue;
      const st = fs.statSync(path.join(procDir, f));
      if (st.size > 2_000_000) continue;
      if (fs.readFileSync(path.join(procDir, f), 'utf8').includes('"region_id"')) names.add(f);
    }
    for (const f of [...names].sort()) {
      const abs = path.join(procDir, f);
      if (!fs.existsSync(abs)) continue;
      const src = fs.readFileSync(abs, 'utf8');
      const start = skipTrivia(src, 0);
      let r;
      if (src[start] === '[') r = removeFromContainer(src, start, id);
      else if (src[start] === '{') {
        const o = objectEntries(src, start);
        const feats = o.entries.find((e) => e.key === 'features');
        if (!feats || src[feats.valStart] !== '[') continue;
        r = removeFromContainer(src, feats.valStart, id, { nested: true });
        if (!r.removed) {
          // also accept a feature-level id
          r = removeFromContainer(src, feats.valStart, id);
        }
      } else continue;
      if (r.removed) changes.push({ file: abs, text: r.src, summary: `removed ${r.removed} ${r.what}`, json: true });
    }
  }
  // 4. region page
  const page = path.join(ROOT, 'region', `${id}.html`);
  if (fs.existsSync(page)) changes.push({ file: page, delete: true, summary: 'deleted file' });

  if (!changes.length) return { changes, absent: true, written: false };

  // validate every edited text before writing anything
  for (const c of changes) {
    if (c.text === undefined) continue;
    if (c.json) JSON.parse(c.text);
    else if (c.js) await validateJs(c.text, path.dirname(c.file));
  }
  if (!dryRun) {
    for (const c of changes) {
      if (c.delete) fs.rmSync(c.file);
      else fs.writeFileSync(c.file, c.text);
    }
  }
  return { changes: changes.map((c) => ({ file: rel(c.file), summary: c.summary })), absent: false, written: !dryRun, rel };
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['dry-run', 'allow-absent'] });
  const id = args._[0];
  if (!id) { process.stderr.write('usage: remove_region.mjs <region-id> [--root DIR] [--dry-run] [--allow-absent]\n'); return 2; }
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) { process.stderr.write(`remove_region: "${id}" is not a region id\n`); return 2; }
  const { ROOT } = resolveRoots(args);
  const r = await removeRegion(id, { ROOT, dryRun: !!args.dryRun });
  if (r.absent) {
    printLine(`remove_region: ${id} is not present under ${ROOT}: nothing to remove`);
    return args.allowAbsent ? 0 : 2;
  }
  for (const c of r.changes) printLine(`  ${c.file}: ${c.summary}`);
  printLine(`remove_region: ${id}: ${r.changes.length} file(s) ${args.dryRun ? 'would change (dry run, nothing written)' : 'changed'}. Regenerate data/v1-lookup.js, region pages, sitemap.xml and llms.txt with the generators.`);
  return 0;
}

if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`remove_region: ${e.stack || e}\n`); process.exit(1); });

export { findExport, matchClose };
