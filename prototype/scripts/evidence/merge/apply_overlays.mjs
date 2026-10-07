#!/usr/bin/env node
// Apply overlays: how other tracks add or change a field in a data file without owning it (evidence track, section 2.7).
//
//   upgrade-2026-10/staging/<fileKey>/<regionId>.json
//   { "regionId": "kootenays", "from": "bioregioning-track",
//     "set": { "landStanding.displacement": "...", "landStanding.vehicle": "..." },
//     "evidence": [ { "claim": "...", "sourceUrl": "https://...", "openedOn": "2026-10-04" } ] }
//
//   fileKey = regions | values | landStanding | regionDepth | legalPathway | context | layer/<layer-name>
//   `set` keys are dotted paths below the region's entry; a leading export name is accepted and dropped
//   (`landStanding.vehicle` = `vehicle`). For fileKey `values` the path starts with the criterion (`climate.label`).
//   Shallow set: the value replaces whatever the path holds (any JSON value). A path that already exists is replaced; a
//   NEW field is accepted only when it is registered in tests/schema.mjs (BASE_KEYS / EXTENSIONS), otherwise the overlay
//   entry is REJECTED, which forces the field name into the schema and the tests in one place.
//   Edits are textual (comments and layout survive); afterwards the module is re-imported and compared with the same sets
//   applied to the imported object. Idempotent (a second run changes nothing); --dry-run writes nothing.
//
//   node scripts/evidence/merge/apply_overlays.mjs [--staging DIR] [--only <fileKey>] [--region <id>] [--dry-run] [--root DIR]
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import {
  resolve, readLiteral, replaceRange, insertEntryAfter, objectEntries,
} from './jsscan.mjs';
import { jsLiteral, jsKey } from './emit_region_js.mjs';
import { loadExports, navigate, setIn } from './patch_js.mjs';
import { parseArgs, resolveRoots, readJson, exists, printLine, isMain } from './common.mjs';

const KEYED = (exp, file) => ({ file, exp, build: (id, keys) => [exp, id, ...keys] });
export const TARGETS = {
  regions: { file: 'data/regions.js', exp: 'regions', build: (id, keys) => ['regions', `[id=${id}]`, ...keys] },
  values: KEYED('values', 'data/regions.js'),
  landStanding: KEYED('landStanding', 'data/land-standing.js'),
  regionDepth: KEYED('regionDepth', 'data/region-depth.js'),
  legalPathway: KEYED('legalPathway', 'data/legal-pathway.js'),
  context: KEYED('context', 'data/context.js'),
};
export function targetFor(fileKey) {
  if (TARGETS[fileKey]) return TARGETS[fileKey];
  const m = /^layer\/([a-z0-9-]+)$/.exec(fileKey);
  if (m) return { file: `data/processed/${m[1]}.json`, exp: '$', json: true, build: (id, keys) => ['$', `[region_id=${id}]`, ...keys] };
  return null;
}

async function loadSchema(ROOT) {
  const f = path.join(ROOT, 'tests/schema.mjs');
  if (!exists(f)) return null;
  try { return await import(pathToFileURL(f).href); } catch { return null; }
}
function registered(fileKey, keys, S) {
  if (!S) return false;
  const base = S.BASE_KEYS || {};
  const ext = S.EXTENSIONS || {};
  switch (fileKey) {
    case 'landStanding': return [...(base.landStanding || []), ...(ext.landStanding || [])].includes(keys[0]);
    case 'regionDepth': return [...(base.regionDepth || []), ...(ext.regionDepth || [])].includes(keys[0]);
    case 'regions': return [...(base.regions || []), ...(ext.regions || [])].includes(keys[0]);
    case 'legalPathway': return (ext.legalPathway || []).includes(keys[0]);
    case 'values': {
      const cellKeys = new Set([...(S.CELL_REQUIRED || []), ...(S.CELL_V2_REQUIRED || []), ...(ext.cell || [])]);
      return (S.CRITERIA_IDS || []).includes(keys[0]) && keys.length === 2 && cellKeys.has(keys[1]);
    }
    default: return false; // context and layers: existing paths only
  }
}

function listOverlays(staging, onlyKey, onlyRegion) {
  const out = [];
  const keys = [...Object.keys(TARGETS)];
  const layerDir = path.join(staging, 'layer');
  if (exists(layerDir)) for (const d of fs.readdirSync(layerDir)) if (fs.statSync(path.join(layerDir, d)).isDirectory()) keys.push(`layer/${d}`);
  for (const k of keys) {
    if (onlyKey && onlyKey !== k) continue;
    const dir = path.join(staging, k);
    if (!exists(dir) || !fs.statSync(dir).isDirectory()) continue;
    for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.json')).sort()) {
      const regionId = f.replace(/\.json$/, '');
      if (onlyRegion && onlyRegion !== regionId) continue;
      out.push({ fileKey: k, regionId, file: path.join(dir, f) });
    }
  }
  return out;
}

const quoteOf = (src, rec) => { const l = readLiteral(src, rec.valStart, rec.valEnd); return l.type === 'string' ? l.quote : null; };

// Apply every overlay of one data file; returns { text, results, ops }.
export async function applyToText(src, entries, { json = false, fromDir, S }) {
  const orig = await loadExports(src, { json, fromDir });
  let text = src;
  const results = [];
  const ops = [];
  for (const { fileKey, regionId, key, value, from } of entries) {
    const tgt = targetFor(fileKey);
    let keys = key.split('.');
    if (keys[0] === tgt.exp && fileKey !== 'regions' && keys.length > 1) keys = keys.slice(1);
    else if (keys[0] === 'regions' && fileKey === 'regions' && keys.length > 1) keys = keys.slice(1);
    const parts = tgt.build(regionId, keys);
    const tag = `${fileKey}/${regionId}:${key}`;
    const res = resolve(text, parts);
    if (res.found) {
      const { holder, last } = navigate(orig, parts);
      const cur = holder === undefined || holder === null ? undefined : (Array.isArray(holder) ? undefined : holder[last]);
      try { assert.deepStrictEqual(cur, value); results.push({ tag, from, state: 'noop' }); continue; } catch { /* differs: replace */ }
      const q = quoteOf(text, res.entry) || (json ? '"' : "'");
      const lit = json ? JSON.stringify(value) : jsLiteral(value, { quote: q });
      text = replaceRange(text, res.entry.valStart, res.entry.valEnd, lit);
      ops.push({ parts, value, kind: 'set' });
      results.push({ tag, from, state: 'applied', detail: 'replaced existing value' });
      continue;
    }
    // new field: parent must exist and the field must be registered
    const parent = resolve(text, parts.slice(0, -1));
    if (!parent.found) { results.push({ tag, from, state: 'unresolved', detail: `no entry for ${regionId} (missing ${JSON.stringify(parent.missing)})` }); continue; }
    if (!registered(fileKey, keys, S)) { results.push({ tag, from, state: 'rejected', detail: `"${keys.join('.')}" is a new field that is not registered in tests/schema.mjs (BASE_KEYS / EXTENSIONS): register it there first` }); continue; }
    if (text[parent.entry.valStart] !== '{') { results.push({ tag, from, state: 'unresolved', detail: 'parent is not an object literal' }); continue; }
    const sib = objectEntries(text, parent.entry.valStart).entries;
    const q = sib.map((e) => quoteOf(text, e)).find(Boolean) || (json ? '"' : "'");
    const lit = json ? JSON.stringify(value) : jsLiteral(value, { quote: q });
    text = insertEntryAfter(text, parent.entry.valStart, null, keys[keys.length - 1], lit, { keyText: json ? JSON.stringify(keys[keys.length - 1]) : jsKey(keys[keys.length - 1], q) });
    ops.push({ parts, value, kind: 'set' });
    results.push({ tag, from, state: 'applied', detail: 'added new registered field' });
  }
  if (ops.length) {
    const next = await loadExports(text, { json, fromDir });
    const expected = structuredClone(orig);
    for (const op of ops) { const { holder, last } = navigate(expected, op.parts); setIn(holder, last, op.value); }
    try { assert.deepStrictEqual(next, expected); } catch (e) { throw new Error(`verify: overlaid module differs from the independently updated object model:\n${String(e.message).slice(0, 1000)}`); }
  }
  return { text, results, ops };
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['dry-run'] });
  const roots = resolveRoots(args);
  const staging = path.resolve(args.staging && args.staging !== true ? args.staging : path.join(roots.UPG, 'staging'));
  const S = await loadSchema(roots.ROOT);
  const overlays = listOverlays(staging, args.only && args.only !== true ? args.only : null, args.region && args.region !== true ? args.region : null);
  if (!overlays.length) { printLine(`apply_overlays: no overlay files under ${staging}`); return 0; }
  const byFile = new Map();
  const problems = [];
  for (const o of overlays) {
    let j;
    try { j = readJson(o.file); } catch (e) { problems.push(`${o.file}: ${e.message}`); continue; }
    if (j.regionId !== o.regionId) { problems.push(`${o.file}: regionId "${j.regionId}" does not match the file name`); continue; }
    if (!j.set || typeof j.set !== 'object' || Array.isArray(j.set)) { problems.push(`${o.file}: "set" must be an object`); continue; }
    if (!Array.isArray(j.evidence)) problems.push(`${o.file}: warning: no "evidence" array`);
    const tgt = targetFor(o.fileKey);
    for (const [key, value] of Object.entries(j.set)) (byFile.get(tgt.file) || byFile.set(tgt.file, []).get(tgt.file)).push({ fileKey: o.fileKey, regionId: o.regionId, key, value, from: j.from });
  }
  let bad = 0;
  const all = [];
  for (const [file, entries] of byFile) {
    const abs = path.join(roots.ROOT, file);
    if (!exists(abs)) { for (const e of entries) { all.push({ tag: `${e.fileKey}/${e.regionId}:${e.key}`, state: 'unresolved', detail: `${file} does not exist` }); } continue; }
    const src = fs.readFileSync(abs, 'utf8');
    const { text, results } = await applyToText(src, entries, { json: file.endsWith('.json'), fromDir: path.dirname(abs), S });
    all.push(...results);
    if (text !== src && !args.dryRun) fs.writeFileSync(abs, text);
    const c = {};
    for (const r of results) c[r.state] = (c[r.state] || 0) + 1;
    printLine(`apply_overlays: ${file}: ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(' | ')}${text !== src ? (args.dryRun ? ' (dry run)' : ' | written') : ''}`);
  }
  for (const r of all.filter((x) => ['rejected', 'unresolved'].includes(x.state))) { printLine(`  ${r.state.padEnd(10)} ${r.tag}  ${r.detail}`); bad++; }
  for (const p of problems) { printLine(`  problem    ${p}`); if (!/warning/.test(p)) bad++; }
  return bad ? 1 : 0;
}
if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`apply_overlays: ${e.stack || e}\n`); process.exit(1); });
