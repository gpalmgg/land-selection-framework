#!/usr/bin/env node
// stamp_build.mjs: writes the generated parts of the static pages (counts, count words, dates, inline linework, the Century
// Line, crawlable region links, module preloads, the head block, cache-bust values) from data/site-facts.js and the data
// files. Counts and dates are never typed into a page: they are stamped. MC-FACTS, 2026-10.
//
//   node scripts/stamp_build.mjs [--root DIR] [--write | --check] [--bump] [--quiet] [--help]
//
// Markers (map-craft 4.4). A marker pair brackets the generated text; everything between the two comments is replaced:
//   <!--f:KEY-->text<!--/f-->       a text fact (see FACT KEYS below)
//   <!--s:art:catchment-->..<!--/s-->   inline SVG from lib/linework.js (fixed seeds); hero variant carries the draw-in
//   <!--s:art:colophon-->..<!--/s-->    attributes; ':draw' / ':static' after the name overrides (catchment: draw, colophon: static)
//   <!--s:century-->..<!--/s-->     static Century Line markup from lib/century.js (skipped with a note while it is absent)
//   <!--s:regionlinks-->..<!--/s--> crawlable <a href="/region/<id>.html"> list, declared order, grouped by continent
//   <!--s:modulepreload-->..<!--/s--> <link rel="modulepreload"> for the static import graph of the page's entry module
//   <!--s:head-->..<!--/s-->        title, description, canonical, JSON-LD, Open Graph, Twitter, icon, analytics tag
//                                   (template: scripts/stamp/head-<page>.mjs; index.html uses head-index.mjs)
//                                   ADOPTION: when a page carries <!--s:head-->, the head elements the template emits (title,
//                                   meta description, canonical, og:/twitter: metas, JSON-LD, icon, the insights script and the
//                                   template's own comments) are removed from the REST of <head>, so a hand-written head collapses
//                                   into the stamped one on the first --write instead of duplicating (one source of truth).
//   data-bust attribute on a <link rel=stylesheet> or <script type=module>: its href/src gets ?v=<buildId>
//
// Modes
//   --check   (default) read only; exit 1 on any difference between the pages and what the stamp would write
//   --write   rewrite the pages; idempotent (a second run changes nothing and writes nothing)
//   --bump    first write a new buildId and buildDate into data/site-facts.js, then --write. The only place the wall clock
//             is read (STAMP_NOW=<ISO> overrides it, for tests). INT-FINAL runs it once per release.
//   --root DIR  the site root (default: the prototype/ this script lives in). Data, lib and pages come from DIR; the
//             head templates always come from this script's own scripts/stamp/. Scratch sites use --root.
//
// Pages processed (those that exist in the root): index.html, deeper.html, arrive.html, host.html, terms-of-arrival.html.
// Every one must end up with the Vercel insights script exactly once (review issue F10), or the run exits 1.
//
// FACT KEYS: regions regionsWord RegionsWord regionsEurope regionsEuropeWord RegionsEuropeWord regionsNA regionsNAWord
//   RegionsNAWord criteria criteriaWord CriteriaWord layers layersWord LayersWord themes themesWord ThemesWord buildId
//   buildDate buildDateLong year dataRevision dataRevisionLong revision
//
// Exit codes: 0 ok, 1 differences or problems found, 2 usage error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OWN_ROOT = path.resolve(HERE, '..');
const TARGETS = ['index.html', 'deeper.html', 'arrive.html', 'host.html', 'terms-of-arrival.html'];
const INSIGHTS_RE = /<script\b[^>]*\bsrc="\/_vercel\/insights\/script\.js"[^>]*>\s*<\/script>/g;
const CONTINENT_LABELS = { europe: 'Europe', 'north-america': 'North America' };

const HELP = `stamp_build.mjs: write the generated parts of the static pages from data/site-facts.js and the data files.

Usage: node scripts/stamp_build.mjs [--root DIR] [--write | --check] [--bump] [--quiet] [--help]

  --check      read only (default); exit 1 when any page differs from what --write would produce
  --write      rewrite the pages; idempotent
  --bump       write a new buildId and buildDate into DIR/data/site-facts.js, then --write (reads the clock; STAMP_NOW=<ISO> overrides)
  --root DIR   site root (default: the prototype folder this script lives in)
  --quiet      print only problems
  --help       this text

Markers: <!--f:KEY-->..<!--/f--> (a fact), <!--s:NAME-->..<!--/s--> with NAME one of art:catchment, art:colophon,
century, regionlinks, modulepreload, head, and the data-bust attribute on stylesheet links and the entry module script.
See the header of this file for the full contract. Pages: ${TARGETS.join(', ')}.
`;

// ---------------------------------------------------------------- args

function parseArgs(argv) {
  const a = { root: null, write: false, check: false, bump: false, quiet: false, help: false };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === '--help' || t === '-h') a.help = true;
    else if (t === '--write') a.write = true;
    else if (t === '--check') a.check = true;
    else if (t === '--bump') a.bump = true;
    else if (t === '--quiet') a.quiet = true;
    else if (t === '--root') { a.root = argv[++i]; if (!a.root) return { error: '--root needs a directory' }; }
    else if (t.startsWith('--root=')) a.root = t.slice(7);
    else return { error: `unknown argument: ${t}` };
  }
  return a;
}

// ---------------------------------------------------------------- small helpers

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const isFile = (p) => { try { return fs.statSync(p).isFile(); } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };
const importFile = (p) => import(pathToFileURL(p).href);

function lineOf(text, index) { return text.slice(0, index).split('\n').length; }

// Re-indent a block of lines to the column the opening marker sits at (empty lines stay empty).
function blockText(lines, indent) {
  return '\n' + lines.map((l) => (l ? indent + l : '')).join('\n') + '\n' + indent;
}

function bustUrl(u, id) {
  const hashAt = u.indexOf('#');
  const hash = hashAt >= 0 ? u.slice(hashAt) : '';
  const noHash = hashAt >= 0 ? u.slice(0, hashAt) : u;
  const qAt = noHash.indexOf('?');
  const base = qAt >= 0 ? noHash.slice(0, qAt) : noHash;
  const rest = qAt >= 0 ? noHash.slice(qAt + 1).split('&').filter((p) => p && !/^v=/.test(p)) : [];
  return `${base}?${['v=' + id, ...rest].join('&')}${hash}`;
}

// ---------------------------------------------------------------- the static import graph (for s:modulepreload)

const IMPORT_RE = /^[ \t]*(?:import|export)\b[^;'"`]*?\bfrom\s*['"]([^'"]+)['"]|^[ \t]*import\s*['"]([^'"]+)['"]/gm;

function resolveImport(fromFile, spec) {
  if (!spec.startsWith('./') && !spec.startsWith('../')) return null;
  const base = path.resolve(path.dirname(fromFile), spec);
  for (const c of [base, base + '.js', base + '.mjs']) if (isFile(c)) return c;
  return null;
}

/** Breadth-first list of the modules statically imported (transitively) by `entry`, entry excluded, as root-relative paths. */
export function importGraph(root, entryRel) {
  const entry = path.resolve(root, entryRel);
  if (!isFile(entry)) return null;
  const seen = new Set([entry]);
  const order = [];
  const queue = [entry];
  while (queue.length) {
    const file = queue.shift();
    const src = fs.readFileSync(file, 'utf8');
    for (const m of src.matchAll(IMPORT_RE)) {
      const dep = resolveImport(file, m[1] || m[2]);
      if (dep && !seen.has(dep)) { seen.add(dep); order.push(dep); queue.push(dep); }
    }
  }
  return order.map((f) => path.relative(root, f).split(path.sep).join('/'));
}

// ---------------------------------------------------------------- the stamp

/** Pure core: stamp one page's text. Returns { out, errors, notes, counts }. */
function stampPage(name, text, ctx) {
  const errors = [];
  const notes = [];
  const counts = { facts: 0, blocks: 0, bust: 0 };
  let out = text;

  // 1. data-bust: ?v=<buildId> on the stylesheet links and the entry module script that ask for it.
  out = out.replace(/<(?:link|script)\b[^>]*\bdata-bust\b[^>]*>/g, (tag) => {
    counts.bust++;
    return tag.replace(/\b(href|src)="([^"]*)"/, (_m, attrName, u) => `${attrName}="${bustUrl(u, ctx.values.buildId)}"`);
  });

  // 2. s: blocks
  const beforeBlocks = out;
  out = beforeBlocks.replace(/([ \t]*)<!--s:([A-Za-z0-9:_-]+)-->([\s\S]*?)<!--\/s-->/g, (whole, lead, key, _inner, offset) => {
    const line = lineOf(beforeBlocks, offset);
    const atLineStart = offset === 0 || beforeBlocks[offset - 1] === '\n';
    const indent = atLineStart ? lead : '';
    let res;
    try { res = runBlock(key, ctx, name, beforeBlocks); } catch (e) { errors.push(`${name}:${line}: <!--s:${key}--> ${e.message}`); return whole; }
    if (res === null) { notes.push(`${name}:${line}: <!--s:${key}--> skipped (${ctx.skipReason(key)})`); return whole; }
    counts.blocks++;
    const body = Array.isArray(res) ? blockText(res, indent) : res;
    return `${lead}<!--s:${key}-->${body}<!--/s-->`;
  });
  if (ctx.headLines) { out = adoptHead(out, ctx.headLines); ctx.headLines = null; }
  // a closing marker without an opener, or an opener without a closer, is an error
  const opens = (text.match(/<!--s:[A-Za-z0-9:_-]+-->/g) || []).length;
  const closes = (text.match(/<!--\/s-->/g) || []).length;
  if (opens !== closes) errors.push(`${name}: ${opens} <!--s:..--> opener(s) but ${closes} <!--/s--> closer(s)`);

  // 3. f: facts
  const beforeFacts = out;
  out = beforeFacts.replace(/<!--f:([A-Za-z0-9]+)-->([\s\S]*?)<!--\/f-->/g, (whole, key, _inner, offset) => {
    if (!(key in ctx.values)) { errors.push(`${name}:${lineOf(beforeFacts, offset)}: unknown fact key <!--f:${key}-->`); return whole; }
    counts.facts++;
    return `<!--f:${key}-->${esc(ctx.values[key])}<!--/f-->`;
  });
  const fOpens = (text.match(/<!--f:[A-Za-z0-9]+-->/g) || []).length;
  const fCloses = (text.match(/<!--\/f-->/g) || []).length;
  if (fOpens !== fCloses) errors.push(`${name}: ${fOpens} <!--f:..--> opener(s) but ${fCloses} <!--/f--> closer(s)`);

  // 4. analytics: exactly one insights script per page (F10)
  const tags = (out.match(INSIGHTS_RE) || []).length;
  if (tags !== 1) errors.push(`${name}: the Vercel insights script (/_vercel/insights/script.js) appears ${tags} times, expected exactly once`);

  return { out, errors, notes, counts };
}

function runBlock(key, ctx, name, pageText) {
  const parts = key.split(':');
  if (parts[0] === 'art') {
    const which = parts[1];
    const variant = parts[2];
    if (!ctx.lw) throw new Error('needs lib/linework.js in the root, which is missing');
    if (variant && variant !== 'draw' && variant !== 'static') throw new Error(`unknown art variant "${variant}" (use :draw or :static)`);
    if (which === 'catchment') return ctx.lw.svg(ctx.lw.catchment(), { draw: variant ? variant === 'draw' : true });
    if (which === 'colophon') return ctx.lw.svg(ctx.lw.colophonArt(), { draw: variant === 'draw' });
    throw new Error(`unknown art "${which}" (use catchment or colophon)`);
  }
  if (key === 'century') {
    if (!ctx.century) return null;
    const { centuryModel, centuryHtml } = ctx.century;
    if (typeof centuryModel !== 'function' || typeof centuryHtml !== 'function') throw new Error('lib/century.js must export centuryModel and centuryHtml');
    return centuryHtml(centuryModel(ctx.criteria));
  }
  if (key === 'regionlinks') return regionLinks(ctx.regions);
  if (key === 'modulepreload') {
    const entryRel = entryModuleOf(pageText) || 'src/main.js';
    const graph = importGraph(ctx.root, entryRel);
    if (!graph) throw new Error(`entry module ${entryRel} not found in the root`);
    return graph.map((f) => `<link rel="modulepreload" href="/${f}" />`);
  }
  if (key === 'head') {
    const tpl = ctx.headTemplates[path.basename(name, '.html')];
    if (!tpl) throw new Error(`no head template: scripts/stamp/head-${path.basename(name, '.html')}.mjs does not exist`);
    const lines = tpl(ctx.values, ctx.canon, ctx.site);
    const tags = lines.join('\n').match(INSIGHTS_RE) || [];
    if (tags.length !== 1) throw new Error(`the head template must emit the Vercel insights script exactly once (it emits ${tags.length})`);
    ctx.headLines = lines;
    return lines;
  }
  throw new Error('unknown block name');
}

function entryModuleOf(text) {
  const m = /<script\b[^>]*\btype="module"[^>]*\bsrc="([^"?#]+)[^"]*"[^>]*>/.exec(text);
  if (!m) return null;
  return m[1].replace(/^\.\//, '').replace(/^\//, '');
}

// ---------------------------------------------------------------- head adoption

const HEAD_ELEMENT_RES = [
  { re: /[ \t]*<title\b[^>]*>[\s\S]*?<\/title>[ \t]*\n?/g, key: () => 'title' },
  { re: /[ \t]*<meta\b[^>]*>[ \t]*\n?/g, key: (t) => { const m = /\b(name|property)="([^"]*)"/.exec(t); return m ? `meta:${m[1]}:${m[2]}` : null; } },
  { re: /[ \t]*<link\b[^>]*>[ \t]*\n?/g, key: (t) => { const m = /\brel="(canonical|icon)"/.exec(t); return m ? `link:${m[1]}` : null; } },
  { re: /[ \t]*<script\b[^>]*type="application\/ld\+json"[^>]*>[\s\S]*?<\/script>[ \t]*\n?/g, key: () => 'ldjson' },
  { re: /[ \t]*<script\b[^>]*\bsrc="\/_vercel\/insights\/script\.js"[^>]*>\s*<\/script>[ \t]*\n?/g, key: () => 'insights' },
];

function headKeys(lines) {
  const text = lines.join('\n');
  const keys = new Set();
  for (const { re, key } of HEAD_ELEMENT_RES) for (const m of text.matchAll(re)) { const k = key(m[0]); if (k) keys.add(k); }
  return keys;
}

/** Removes, from <head> outside the s:head block, the elements the head template emits (see ADOPTION in the header). */
function adoptHead(out, lines) {
  const open = out.indexOf('<!--s:head-->');
  const close = out.indexOf('<!--/s-->', open);
  const headEnd = out.indexOf('</head>');
  if (open < 0 || close < 0 || headEnd < 0) return out;
  const keys = headKeys(lines);
  const comments = new Set(lines.filter((l) => /^<!--.*-->$/.test(l.trim())).map((l) => l.trim()));
  const clean = (chunk) => {
    let c = chunk;
    let removed = false;
    for (const { re, key } of HEAD_ELEMENT_RES) {
      c = c.replace(re, (m) => { const k = key(m); if (k && keys.has(k)) { removed = true; return ''; } return m; });
    }
    c = c.replace(/^[ \t]*(<!--.*?-->)[ \t]*\n?/gm, (m, cm) => { if (comments.has(cm)) { removed = true; return ''; } return m; });
    if (removed) c = c.replace(/\n[ \t]*\n(?:[ \t]*\n)+/g, '\n\n');
    return c;
  };
  const closeEnd = close + '<!--/s-->'.length;
  const before = clean(out.slice(0, open));
  const mid = out.slice(open, closeEnd);
  const afterHead = headEnd > closeEnd ? clean(out.slice(closeEnd, headEnd)) : out.slice(closeEnd, headEnd);
  return before + mid + afterHead + out.slice(headEnd);
}

function regionLinks(regions) {
  const groups = new Map();
  for (const r of regions) {
    if (!groups.has(r.continent)) groups.set(r.continent, []);
    groups.get(r.continent).push(r);
  }
  const lines = ['<div class="region-links">'];
  for (const [continent, list] of groups) {
    const label = CONTINENT_LABELS[continent] || continent.replace(/(^|-)([a-z])/g, (_m, s, c) => (s ? ' ' : '') + c.toUpperCase());
    lines.push(`  <p class="region-links-h">${esc(label)}</p>`);
    lines.push('  <ul>');
    for (const r of list) lines.push(`    <li><a href="/region/${escAttr(r.id)}.html">${esc(r.name)}</a></li>`);
    lines.push('  </ul>');
  }
  lines.push('</div>');
  return lines;
}

// ---------------------------------------------------------------- bump

function pad(n, w = 2) { return String(n).padStart(w, '0'); }

function bumpValues() {
  const now = process.env.STAMP_NOW ? new Date(process.env.STAMP_NOW) : new Date();
  if (Number.isNaN(now.getTime())) throw new Error(`STAMP_NOW is not a valid date: ${process.env.STAMP_NOW}`);
  const y = now.getUTCFullYear(), mo = pad(now.getUTCMonth() + 1), d = pad(now.getUTCDate());
  return {
    buildDate: `${y}-${mo}-${d}`,
    buildId: `b${y}${mo}${d}${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`,
  };
}

function bumpFile(file, v) {
  const src = fs.readFileSync(file, 'utf8');
  const idRe = /^(export const buildId = ')[^']*(';)/m;
  const dateRe = /^(export const buildDate = ')[^']*(';)/m;
  if (!idRe.test(src) || !dateRe.test(src)) throw new Error(`${file}: the buildId / buildDate lines are not in the expected shape`);
  const next = src.replace(idRe, `$1${v.buildId}$2`).replace(dateRe, `$1${v.buildDate}$2`);
  if (next !== src) fs.writeFileSync(file, next);
}

// ---------------------------------------------------------------- main

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.error) { console.error(`stamp_build: ${args.error}\n`); console.error(HELP); return 2; }
  if (args.help) { process.stdout.write(HELP); return 0; }
  if (args.bump && args.check) { console.error('stamp_build: --bump writes files; it cannot be combined with --check'); return 2; }
  if (args.write && args.check) { console.error('stamp_build: --write and --check are exclusive'); return 2; }
  const write = args.write || args.bump;
  const root = path.resolve(args.root || OWN_ROOT);
  if (!isDir(root)) { console.error(`stamp_build: root is not a directory: ${root}`); return 2; }
  const say = (s) => { if (!args.quiet) console.log(s); };

  const factsFile = path.join(root, 'data', 'site-facts.js');
  if (!isFile(factsFile)) { console.error(`stamp_build: ${factsFile} not found`); return 2; }
  const sf = await importFile(factsFile);
  const regionsMod = await importFile(path.join(root, 'data', 'regions.js'));

  let override = {};
  if (args.bump) {
    override = bumpValues();
    bumpFile(factsFile, override);
    say(`bump: buildId ${override.buildId}, buildDate ${override.buildDate} -> ${path.relative(process.cwd(), factsFile) || factsFile}`);
  }

  // optional modules of the root
  const lwFile = path.join(root, 'lib', 'linework.js');
  const centuryFile = path.join(root, 'lib', 'century.js');
  const lw = isFile(lwFile) ? await importFile(lwFile) : null;
  const century = isFile(centuryFile) ? await importFile(centuryFile) : null;

  // head templates (the tool's own: scripts/stamp/head-<page>.mjs)
  const headTemplates = {};
  const stampDir = path.join(HERE, 'stamp');
  if (isDir(stampDir)) {
    for (const f of fs.readdirSync(stampDir)) {
      const m = /^head-([a-z0-9-]+)\.mjs$/.exec(f);
      if (m) headTemplates[m[1]] = (await importFile(path.join(stampDir, f))).default;
    }
  }

  const ctx = {
    root,
    values: sf.factValues(override),
    canon: sf.canon,
    site: sf.site,
    regions: regionsMod.regions,
    criteria: regionsMod.criteria,
    lw,
    century,
    headTemplates,
    skipReason: (key) => (key === 'century' ? 'lib/century.js does not exist yet; MC-HERO creates it' : 'unavailable'),
  };

  let problems = 0;
  let differs = 0;
  let seen = 0;
  for (const name of TARGETS) {
    const file = path.join(root, name);
    if (!isFile(file)) continue;
    seen++;
    const text = fs.readFileSync(file, 'utf8');
    const r = stampPage(name, text, ctx);
    for (const n of r.notes) say(`note: ${n}`);
    for (const e of r.errors) { console.error(`PROBLEM ${e}`); problems++; }
    const changed = r.out !== text;
    const hadErrors = r.errors.some((e) => !e.includes('insights script'));
    if (changed) {
      differs++;
      if (write && !hadErrors) { fs.writeFileSync(file, r.out); say(`${name}: written (${r.counts.facts} facts, ${r.counts.blocks} blocks, ${r.counts.bust} cache-bust)`); }
      else if (!write) {
        const a = text.split('\n'), b = r.out.split('\n');
        let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
        console.error(`DIFF ${name}: stale from line ${i + 1} (run: node scripts/stamp_build.mjs --write${args.root ? ' --root ' + args.root : ''})`);
      }
    } else say(`${name}: up to date (${r.counts.facts} facts, ${r.counts.blocks} blocks, ${r.counts.bust} cache-bust)`);
  }
  if (!seen) { console.error('stamp_build: no page found in the root'); return 1; }
  if (problems) return 1;
  if (!write && differs) return 1;
  return 0;
}

main().then((code) => { process.exitCode = code; }, (e) => { console.error(`stamp_build: ${e && e.stack ? e.stack : e}`); process.exitCode = 1; });
