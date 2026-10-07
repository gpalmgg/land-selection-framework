#!/usr/bin/env node
// Emit a new region in the exact house format of the data modules, and (optionally) insert it.
//
//   regions[] element (data/regions.js)        emitRegionObject(region)
//   values block      (data/regions.js)        emitValuesBlock(id, cells)
//   landStanding      (data/land-standing.js)  emitKeyedEntry(id, entry, { quote: '"' })
//   regionDepth       (data/region-depth.js)   emitKeyedEntry(id, entry, { quote: '"' })
//
// The Python processors (compile_per_jurisdiction.py, process_hospital_proximity.py) read data/regions.js with the
// regex  id:\s*'([^']+)',[^}]*?coords:  so a region object is written with the id first, single quotes, `coords`
// right after id / continent / name / short / country, and no `}` in between. emitRegionObject refuses text that would
// break that.
//
//   node scripts/evidence/merge/emit_region_js.mjs --package <dir> --print regions|values|standing|depth
//   node scripts/evidence/merge/emit_region_js.mjs --package <dir> --into regions|standing|depth [--root DIR] [--dry-run]
//
// --into is idempotent: if the id is already present in the target nothing is written. regions.js gets both the
// regions[] element and the values block; a new element goes after the last region of the same continent (Europe cards
// stay before North America).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  objectEntries, arrayElements, findExport, readLiteral, matchClose, replaceRange,
} from './jsscan.mjs';
import { parseArgs, resolveRoots, printLine, isMain } from './common.mjs';
import { loadRegionPackage } from './load_region_package.mjs';

const IDENT = /^[A-Za-z_$][A-Za-z0-9_$]*$/;
export const REGION_KEY_ORDER = ['id', 'continent', 'name', 'short', 'country', 'coords', 'blurb', 'accent'];
export const CELL_KEY_ORDER = ['value', 'unit', 'vintage', 'label', 'source', 'sourceUrl', 'sourceId', 'method', 'footprint', 'retrieved', 'scenario', 'trajectory', 'audit', 'license', 'outOfRange', 'nullReason'];
const TRAJ_KEY_ORDER = ['status', 'direction', 'delta', 'unit', 'basis', 'source', 'sourceUrl', 'sourceId', 'vintage'];

export function jsString(s, quote = "'") {
  let t = String(s).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  t = quote === '"' ? t.replace(/"/g, '\\"') : t.replace(/'/g, "\\'");
  return quote + t + quote;
}
export const jsKey = (k, quote = "'") => (IDENT.test(k) ? k : jsString(k, quote));

// Generic literal printer: primitives inline, arrays of primitives inline, objects one key per line.
export function jsLiteral(v, { quote = "'", indent = '', step = '  ', order = null } = {}) {
  if (v === null) return 'null';
  if (typeof v === 'string') return jsString(v, quote);
  if (typeof v === 'number') { if (!Number.isFinite(v)) throw new Error('non-finite number'); return String(v); }
  if (typeof v === 'boolean') return String(v);
  if (Array.isArray(v)) {
    if (v.every((x) => x === null || ['string', 'number', 'boolean'].includes(typeof x))) return `[${v.map((x) => jsLiteral(x, { quote })).join(', ')}]`;
    const inner = indent + step;
    return `[\n${v.map((x) => `${inner}${jsLiteral(x, { quote, indent: inner, step })},`).join('\n')}\n${indent}]`;
  }
  if (typeof v === 'object') {
    const keys = Object.keys(v);
    if (order) keys.sort((a, b) => (order.indexOf(a) < 0 ? 99 : order.indexOf(a)) - (order.indexOf(b) < 0 ? 99 : order.indexOf(b)));
    if (!keys.length) return '{}';
    const inner = indent + step;
    return `{\n${keys.map((k) => `${inner}${jsKey(k, quote)}: ${jsLiteral(v[k], { quote, indent: inner, step })},`).join('\n')}\n${indent}}`;
  }
  throw new Error(`cannot emit a ${typeof v}`);
}

export function emitRegionObject(region, { indent = '  ' } = {}) {
  const keys = REGION_KEY_ORDER.filter((k) => region[k] !== undefined);
  for (const k of ['id', 'continent', 'name', 'country', 'coords', 'blurb', 'accent']) if (region[k] === undefined) throw new Error(`region.${k} is required`);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(region.id)) throw new Error(`region id ${JSON.stringify(region.id)} is not a lowercase hyphenated id`);
  const lines = keys.map((k) => `${indent}  ${k}: ${k === 'coords' ? `[${region.coords.join(', ')}]` : jsString(region[k])},`);
  const text = `${indent}{\n${lines.join('\n')}\n${indent}},\n`;
  // the Python regex contract
  const m = /id:\s*'([^']+)',[^}]*?coords:/.exec(text);
  if (!m || m[1] !== region.id) throw new Error(`region ${region.id}: the emitted object does not satisfy the processors' regex id:\\s*'([^']+)',[^}]*?coords: (a "}" before coords?)`);
  return text;
}

export function emitCell(cell, { indent = '    ' } = {}) {
  const get = (k) => cell[k];
  const isNull = cell.value === null;
  const lines = [];
  const inline = ['value', 'unit', 'vintage', 'label'].filter((k) => get(k) !== undefined).map((k) => `${k}: ${jsLiteral(get(k))}`);
  lines.push(`${indent}  ${inline.join(', ')},`);
  const rest = CELL_KEY_ORDER.filter((k) => !['value', 'unit', 'vintage', 'label'].includes(k) && get(k) !== undefined);
  for (const k of rest) {
    const lit = k === 'trajectory' ? jsLiteral(get(k), { indent: `${indent}  `, order: TRAJ_KEY_ORDER }) : jsLiteral(get(k));
    lines.push(`${indent}  ${k}: ${lit},`);
  }
  for (const k of Object.keys(cell)) if (!CELL_KEY_ORDER.includes(k)) throw new Error(`cell key "${k}" is not a registered cell field`);
  void isNull;
  return lines.join('\n');
}

const CRITERIA_ORDER = ['climate', 'water_stress', 'soil_carbon', 'forest_change', 'solar_pv', 'conflict', 'regen_network', 'population'];
export function emitValuesBlock(id, cells, { indent = '  ' } = {}) {
  const out = [`${indent}${jsKey(id)}: {`];
  const order = [...CRITERIA_ORDER.filter((c) => cells[c]), ...Object.keys(cells).filter((c) => !CRITERIA_ORDER.includes(c))];
  for (const c of order) out.push(`${indent}  ${c}: {`, emitCell(cells[c], { indent: `${indent}  ` }), `${indent}  },`);
  out.push(`${indent}},`);
  return `${out.join('\n')}\n`;
}

export function emitKeyedEntry(id, entry, { quote = '"', indent = '  ' } = {}) {
  const lines = Object.keys(entry).map((k) => `${indent}  ${jsKey(k, quote)}: ${jsLiteral(entry[k], { quote, indent: `${indent}  ` })},`);
  return `${indent}${jsKey(id, quote)}: {\n${lines.join('\n')}\n${indent}},\n`;
}

// ---------------------------------------------------------------------------------------------------------------
// Insertion into module source text.
function lineStartOf(src, i) { return src.lastIndexOf('\n', i - 1) + 1; }

// Insert `text` (ends with a newline) after container entry/element `index` (or at the end when index is -1/undefined).
function insertInto(src, pos, text, afterIndex) {
  const isObj = src[pos] === '{';
  const c = isObj ? objectEntries(src, pos) : arrayElements(src, pos);
  const list = isObj ? c.entries : c.elements;
  let anchor = afterIndex === undefined || afterIndex < 0 || afterIndex >= list.length ? list.length - 1 : afterIndex;
  if (anchor < 0) { // empty container: insert after the opener line
    const nl = src.indexOf('\n', pos);
    return src.slice(0, nl + 1) + text + src.slice(nl + 1);
  }
  const rec = list[anchor];
  let s = src;
  let end = rec.comma >= 0 ? rec.comma + 1 : rec.entryEnd;
  if (rec.comma < 0) { s = replaceRange(s, rec.entryEnd, rec.entryEnd, ','); end = rec.entryEnd + 1; }
  // end of the anchor's line (a trailing same-line comment stays with its entry)
  let nl = s.indexOf('\n', end);
  if (nl < 0) nl = s.length;
  return s.slice(0, nl + 1) + text + s.slice(nl + 1);
}

function entryLiteral(src, rec) { const l = readLiteral(src, rec.valStart, rec.valEnd); return l.type === 'string' ? l.value : null; }

export function hasId(src, exportName, id) {
  const pos = findExport(src, exportName);
  if (pos < 0) return false;
  if (src[pos] === '{') return objectEntries(src, pos).entries.some((e) => e.key === id);
  return arrayElements(src, pos).elements.some((el) => {
    if (src[el.valStart] !== '{') return false;
    const e = objectEntries(src, el.valStart).entries.find((x) => x.key === 'id');
    return e && entryLiteral(src, e) === id;
  });
}

// regions.js: insert the regions[] element and the values block, continent-aware. Returns the new text.
export function insertRegionIntoRegionsJs(src, region, cells) {
  if (hasId(src, 'regions', region.id) && hasId(src, 'values', region.id)) return src;
  const rPos = findExport(src, 'regions');
  const arr = arrayElements(src, rPos);
  let lastSame = -1;
  let lastSameId = null;
  arr.elements.forEach((el, i) => {
    const o = objectEntries(src, el.valStart);
    const cont = o.entries.find((e) => e.key === 'continent');
    const idE = o.entries.find((e) => e.key === 'id');
    if (cont && entryLiteral(src, cont) === region.continent) { lastSame = i; lastSameId = entryLiteral(src, idE); }
  });
  let out = src;
  // values first (it sits after regions in the file, so earlier offsets stay valid)
  if (!hasId(out, 'values', region.id)) {
    const vPos = findExport(out, 'values');
    const v = objectEntries(out, vPos);
    const after = lastSameId ? v.entries.findIndex((e) => e.key === lastSameId) : -1;
    out = insertInto(out, vPos, `\n${emitValuesBlock(region.id, cells)}`.replace(/^\n/, ''), after);
  }
  if (!hasId(out, 'regions', region.id)) {
    const rp = findExport(out, 'regions');
    out = insertInto(out, rp, emitRegionObject(region), lastSame);
  }
  return out;
}
export function insertKeyedEntry(src, exportName, id, entry, { quote = '"' } = {}) {
  if (hasId(src, exportName, id)) return src;
  const pos = findExport(src, exportName);
  if (pos < 0) throw new Error(`export ${exportName} not found`);
  return insertInto(src, pos, emitKeyedEntry(id, entry, { quote }), undefined);
}

async function validateModule(text, fromDir) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsf-emit-'));
  try {
    const f = path.join(dir, 'm.mjs');
    fs.writeFileSync(f, text.replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_, pre, q, spec) => `${pre}${q}${pathToFileURL(path.resolve(fromDir, spec)).href}${q}`));
    return await import(`${pathToFileURL(f).href}?t=${Date.now()}${Math.random()}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['dry-run'] });
  const roots = resolveRoots(args);
  if (!args.package || args.package === true) { process.stderr.write('usage: emit_region_js.mjs --package <dir> (--print regions|values|standing|depth | --into regions|standing|depth) [--root DIR] [--dry-run]\n'); return 2; }
  const pkg = await loadRegionPackage(path.resolve(args.package), { ROOT: roots.ROOT });
  if (pkg.skipped) { process.stderr.write(`emit_region_js: ${pkg.id} is skipped (${pkg.skipped})\n`); return 3; }
  if (!pkg.ok) { process.stderr.write(`emit_region_js: ${pkg.id} is invalid:\n  ${pkg.errors.join('\n  ')}\n`); return 3; }
  if (args.print) {
    const what = args.print;
    const text = what === 'regions' ? emitRegionObject(pkg.region) : what === 'values' ? emitValuesBlock(pkg.id, pkg.cells) : what === 'standing' || what === 'depth' ? emitKeyedEntry(pkg.id, what === 'standing' ? pkg.standing : pkg.depth) : null;
    if (text === null) { process.stderr.write(`emit_region_js: unknown --print ${what}\n`); return 2; }
    process.stdout.write(text);
    return 0;
  }
  if (args.into) {
    const target = args.into;
    const file = path.join(roots.ROOT, target === 'regions' ? 'data/regions.js' : target === 'standing' ? 'data/land-standing.js' : target === 'depth' ? 'data/region-depth.js' : '');
    if (!fs.existsSync(file)) { process.stderr.write(`emit_region_js: cannot insert into ${target}: ${file} not found\n`); return 2; }
    const src = fs.readFileSync(file, 'utf8');
    const next = target === 'regions' ? insertRegionIntoRegionsJs(src, pkg.region, pkg.cells)
      : target === 'standing' ? insertKeyedEntry(src, 'landStanding', pkg.id, pkg.standing)
        : insertKeyedEntry(src, 'regionDepth', pkg.id, pkg.depth);
    if (next === src) { printLine(`emit_region_js: ${pkg.id} already present in ${path.relative(roots.ROOT, file)}: unchanged`); return 0; }
    const mod = await validateModule(next, path.dirname(file));
    if (target === 'regions' && !(mod.regions.some((r) => r.id === pkg.id) && mod.values[pkg.id])) throw new Error('inserted region does not load back');
    if (args.dryRun) { printLine(`emit_region_js: ${pkg.id} would be added to ${path.relative(roots.ROOT, file)} (dry run)`); return 0; }
    fs.writeFileSync(file, next);
    printLine(`emit_region_js: ${pkg.id} added to ${path.relative(roots.ROOT, file)}`);
    return 0;
  }
  process.stderr.write('emit_region_js: use --print or --into\n');
  return 2;
}
if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`emit_region_js: ${e.stack || e}\n`); process.exit(1); });
void matchClose;
