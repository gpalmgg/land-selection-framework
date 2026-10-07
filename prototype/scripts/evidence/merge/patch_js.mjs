#!/usr/bin/env node
// Textual patcher for the data modules (JS object literals and JSON).
//
// It locates `values.<id>.<criterion>.<field>`, `landStanding['<id>'].<field>`, `regionDepth.<id>.<field>`,
// `regions[id=<id>].<field>` or `$[region_id=<id>].<field>` blocks in the SOURCE TEXT, asserts the current value
// equals the patch's `old` (after the same normalisation for every path), and replaces only that value. Comments,
// quote style, hyphenated keys in quotes and line breaks are preserved. After writing, the module is re-imported and
// compared against the SAME patch applied to the imported object: two independent paths must agree.
//
// Per patch the outcome is one of:
//   applied     the value was replaced
//   noop        the value already equals `new` (a second run changes nothing)
//   stale       the current value is not `old` (reported, nothing written)
//   unresolved  the path does not exist in the file (reported, nothing written)
//   unsupported the target is not a plain string/number literal (reported, nothing written)
//   superseded-by-pipeline  numeric value item whose cell has a canonical pipeline value (policy P-CELL): not applied
//
// Usage
//   node scripts/evidence/merge/patch_js.mjs [--patches F] [--file data/regions.js] [--min-confidence medium|high]
//        [--non-numeric-only | --numeric-only] [--ref <ref>]... [--pipeline-dir DIR | --no-pipeline]
//        [--no-record] [--dry-run] [--strict] [--json] [--root DIR] [--out DIR]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import {
  resolve, readLiteral, encodeString, replaceRange, arrayElements,
} from './jsscan.mjs';
import {
  parseArgs, resolveRoots, readJson, exists, sameValue, findAllCanon, canonChars, printLine, isMain,
} from './common.mjs';

const RANK = { low: 0, medium: 1, high: 2 };
const NUM_RE = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i;

export const isNumericPatch = (p) => Array.isArray(p.parts) && p.parts.length === 4 && p.parts[0] === 'values' && p.parts[3] === 'value';

// ---------------------------------------------------------------------------------------------------------------
// One patch against one source text. Pure: returns { state, src, detail, op }.
export function applyOne(src, patch, { json = false } = {}) {
  const res = resolve(src, patch.parts);
  if (!res.found) return { state: 'unresolved', src, detail: `no ${JSON.stringify(res.missing)} at depth ${res.depth} of ${patch.parts.join(' > ')}` };
  const { valStart, valEnd } = res.entry;
  const lit = readLiteral(src, valStart, valEnd);
  const oldS = String(patch.old);
  const newS = String(patch.new);

  if (lit.type === 'string') {
    const cur = lit.value;
    if (sameValue(cur, newS) && !sameValue(cur, oldS)) return { state: 'noop', src, detail: 'already equals new' };
    if (sameValue(cur, oldS)) {
      const text = encodeString(newS, json ? '"' : lit.quote);
      return { state: 'applied', src: replaceRange(src, valStart, valEnd, text), detail: 'whole value', op: { kind: 'whole', value: newS } };
    }
    // `old` may be one sentence of a longer string: replace just that substring when it occurs exactly once.
    const oldSub = oldS.replace(/\\(['"])/g, '$1'); // dossier JSON escapes quotes
    const hits = findAllCanon(cur, oldSub);
    if (hits.length === 1) {
      const next = cur.slice(0, hits[0]) + newS + cur.slice(hits[0] + oldSub.length);
      return { state: 'applied', src: replaceRange(src, valStart, valEnd, encodeString(next, json ? '"' : lit.quote)), detail: 'substring', op: { kind: 'substring', old: oldSub, at: hits[0], new: newS } };
    }
    if (hits.length === 0 && newS && canonChars(cur).includes(canonChars(newS))) return { state: 'noop', src, detail: 'new text already present' };
    return { state: 'stale', src, detail: hits.length > 1 ? `old text occurs ${hits.length} times (ambiguous)` : `current value is ${JSON.stringify(cur.length > 120 ? `${cur.slice(0, 120)}...` : cur)}` };
  }
  if (lit.type === 'number') {
    if (sameValue(String(lit.value), newS) && !sameValue(String(lit.value), oldS)) return { state: 'noop', src, detail: 'already equals new' };
    if (!sameValue(String(lit.value), oldS)) return { state: 'stale', src, detail: `current value is ${lit.text}` };
    if (!NUM_RE.test(newS.trim())) return { state: 'unsupported', src, detail: `new value ${JSON.stringify(newS)} is not a number and the target is a number literal` };
    const text = newS.trim().replace(/^\+/, '');
    return { state: 'applied', src: replaceRange(src, valStart, valEnd, text), detail: 'number', op: { kind: 'number', value: Number(text) } };
  }
  if (lit.type === 'null') {
    if (sameValue('null', oldS)) {
      const asNum = NUM_RE.test(newS.trim()) && patch.parts[patch.parts.length - 1] === 'value';
      const text = asNum ? newS.trim() : encodeString(newS, json ? '"' : "'");
      return { state: 'applied', src: replaceRange(src, valStart, valEnd, text), detail: 'null -> value', op: { kind: 'whole', value: asNum ? Number(newS) : newS } };
    }
    return { state: 'stale', src, detail: 'current value is null' };
  }
  if (lit.type === 'array') return applyArray(src, patch, res.entry, lit, json);
  return { state: 'unsupported', src, detail: `target is a ${lit.type}, not a string, number or string-array literal` };
}

// Arrays of strings (for example preemption_or_first_claim_holders). `new` must be a JSON array of strings; `old` may be
// a JSON array or the "[a, b]" join form.
function readStringArray(src, valStart) {
  const arr = arrayElements(src, valStart);
  const out = [];
  for (const el of arr.elements) {
    const l = readLiteral(src, el.valStart, el.valEnd);
    if (l.type !== 'string') return null;
    out.push({ value: l.value, quote: l.quote });
  }
  return out;
}
function parseJsonStringArray(text) {
  try { const v = JSON.parse(text); return Array.isArray(v) && v.every((x) => typeof x === 'string') ? v : null; } catch { return null; }
}
function applyArray(src, patch, entry, lit, json) {
  const cur = readStringArray(src, entry.valStart);
  if (!cur) return { state: 'unsupported', src, detail: 'target is an array that is not made of plain string literals' };
  const curVals = cur.map((x) => x.value);
  const newArr = parseJsonStringArray(String(patch.new));
  if (!newArr) return { state: 'unsupported', src, detail: 'new value is not a JSON array of strings (list items cannot be split safely: apply by hand)' };
  const eq = (a, b) => a.length === b.length && a.every((x, i) => sameValue(x, b[i]));
  if (eq(curVals, newArr)) return { state: 'noop', src, detail: 'already equals new' };
  const oldArr = parseJsonStringArray(String(patch.old));
  const oldMatches = oldArr ? eq(curVals, oldArr) : sameValue(`[${curVals.join(', ')}]`, String(patch.old));
  if (!oldMatches) return { state: 'stale', src, detail: `current value is ${JSON.stringify(curVals).slice(0, 160)}` };
  const quote = json ? '"' : (cur[0]?.quote || "'");
  const text = `[${newArr.map((x) => encodeString(x, quote)).join(', ')}]`;
  return { state: 'applied', src: replaceRange(src, entry.valStart, entry.valEnd, text), detail: 'array', op: { kind: 'array', value: newArr } };
}

// ---------------------------------------------------------------------------------------------------------------
// Independent path: import (or JSON.parse) both texts and compare against the patch applied to the imported object.
export function absolutiseImports(text, fromDir) {
  return text.replace(/(from\s+|import\s*\(\s*)(['"])(\.{1,2}\/[^'"]+)\2/g, (_, pre, q, spec) => `${pre}${q}${pathToFileURL(path.resolve(fromDir, spec)).href}${q}`);
}
export async function loadExports(text, { json, fromDir }) {
  if (json) return { $: JSON.parse(text) };
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsf-patch-'));
  try {
    const f = path.join(dir, 'm.mjs');
    fs.writeFileSync(f, absolutiseImports(text, fromDir));
    const mod = await import(`${pathToFileURL(f).href}?t=${Date.now()}${Math.random()}`);
    return { ...mod };
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}
function step(obj, part) {
  if (obj === null || typeof obj !== 'object') return undefined;
  let m;
  if (Array.isArray(obj)) {
    if ((m = /^\[(\d+)\]$/.exec(part))) return obj[Number(m[1])];
    if ((m = /^\[([A-Za-z_$][\w$]*)=(.*)\]$/.exec(part))) { const want = m[2].replace(/^(['"])(.*)\1$/, '$2'); return obj.find((e) => e && String(e[m[1]]) === want); }
    return undefined;
  }
  return obj[part];
}
export function navigate(exportsObj, parts) {
  let cur = exportsObj[parts[0]];
  for (let i = 1; i < parts.length - 1; i++) cur = step(cur, parts[i]);
  return { holder: cur, last: parts[parts.length - 1] };
}
export function setIn(holder, last, value) {
  if (Array.isArray(holder)) {
    const m = /^\[(\d+)\]$/.exec(last);
    holder[Number(m[1])] = value;
  } else holder[last] = value;
}
export async function verifyByImport(origText, newText, appliedPatches, { json, fromDir }) {
  const a = await loadExports(origText, { json, fromDir });
  const b = await loadExports(newText, { json, fromDir });
  const expected = structuredClone(a);
  for (const { patch, op } of appliedPatches) {
    const { holder, last } = navigate(expected, patch.parts);
    if (holder === undefined || holder === null) throw new Error(`verify: cannot navigate ${patch.parts.join(' > ')} in the imported module`);
    const cur = holder[last];
    if (op.kind === 'whole' || op.kind === 'number' || op.kind === 'array') { setIn(holder, last, op.value); continue; }
    // substring: redo the replacement on the IMPORTED string, not on the scanner's decode
    const hits = findAllCanon(String(cur), op.old);
    assert.equal(hits.length, 1, `verify: substring for ${patch.ref} not unique in the imported module`);
    setIn(holder, last, String(cur).slice(0, hits[0]) + op.new + String(cur).slice(hits[0] + op.old.length));
  }
  try { assert.deepStrictEqual(b, expected); } catch (e) { throw new Error(`verify: patched module differs from the independently patched object model:\n${String(e.message).slice(0, 1200)}`); }
  return true;
}

// ---------------------------------------------------------------------------------------------------------------
// A whole file. `patches` all target this file. Returns { results, text, changed }.
export async function patchText(src, patches, { json = false, fromDir = process.cwd(), verify = true } = {}) {
  let text = src;
  const results = [];
  const applied = [];
  for (const patch of patches) {
    const r = applyOne(text, patch, { json });
    results.push({ ref: patch.ref, state: r.state, detail: r.detail, path: patch.path });
    if (r.state === 'applied') { text = r.src; applied.push({ patch, op: r.op }); }
  }
  if (verify && applied.length) await verifyByImport(src, text, applied, { json, fromDir });
  return { results, text, changed: text !== src };
}

export async function patchFile(absFile, patches, { dryRun = false, verify = true } = {}) {
  const src = fs.readFileSync(absFile, 'utf8');
  const json = absFile.endsWith('.json');
  const out = await patchText(src, patches, { json, fromDir: path.dirname(absFile), verify });
  let write = 'unchanged';
  if (out.changed) { if (dryRun) write = 'dry-run'; else { fs.writeFileSync(absFile, out.text); write = 'written'; } }
  return { ...out, write };
}

// ---------------------------------------------------------------------------------------------------------------
function pipelineValue(pipelineDir, region, criterion) {
  if (!pipelineDir) return null;
  const f = path.join(pipelineDir, region, 'cells.json');
  if (!exists(f)) return null;
  try {
    const c = readJson(f).cells?.[criterion];
    if (c && typeof c.value === 'number' && Number.isFinite(c.value)) return c.value;
  } catch { /* unreadable pipeline file = no pipeline value */ }
  return null;
}

export function selectPatches(all, o) {
  const min = RANK[o.minConfidence || 'medium'];
  return all.filter((p) => {
    if (RANK[p.confidence] === undefined || RANK[p.confidence] < min) return false;
    if (o.refs?.length && !o.refs.includes(p.ref)) return false;
    if (o.nonNumericOnly && p.numeric) return false;
    if (o.numericOnly && !p.numeric) return false;
    if (o.file) {
      const want = o.file.replace(/^prototype\//, '');
      if (p.file !== want && path.basename(p.file) !== path.basename(want)) return false;
    }
    return true;
  });
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['dry-run', 'non-numeric-only', 'numeric-only', 'no-pipeline', 'no-record', 'strict', 'json'], listFlags: ['ref'] });
  const { ROOT, OUT } = resolveRoots(args);
  const patchesFile = path.resolve(args.patches || path.join(OUT, 'patches.json'));
  if (!exists(patchesFile)) { process.stderr.write(`patch_js: ${patchesFile} not found (run reverify_to_patches.mjs first)\n`); return 2; }
  const all = readJson(patchesFile);
  const selected = selectPatches(all, { ...args, refs: args.ref });
  const pipelineDir = args.noPipeline ? null : path.resolve(args.pipelineDir || OUT);

  const byFile = new Map();
  for (const p of selected) (byFile.get(p.file) || byFile.set(p.file, []).get(p.file)).push(p);

  const summary = { files: {}, totals: { applied: 0, noop: 0, stale: 0, unresolved: 0, unsupported: 0, 'superseded-by-pipeline': 0 }, rows: [] };
  let verifyFailed = false;
  for (const [file, patches] of byFile) {
    const abs = path.join(ROOT, file);
    if (!exists(abs)) { for (const p of patches) summary.rows.push({ ref: p.ref, state: 'unresolved', detail: `${file} does not exist`, owner: p.owner }); summary.totals.unresolved += patches.length; summary.files[file] = { missing: true }; continue; }
    const work = [];
    const rows = [];
    for (const p of patches) {
      if (p.numeric && p.supersede) {
        const pv = pipelineValue(pipelineDir, p.supersede.region, p.supersede.criterion);
        if (pv !== null) { rows.push({ ref: p.ref, state: 'superseded-by-pipeline', detail: `pipeline ${pv} (reverify ${p.new})`, path: p.path, owner: p.owner }); continue; }
      }
      work.push(p);
    }
    let out;
    try { out = await patchFile(abs, work, { dryRun: !!args.dryRun }); } catch (e) { verifyFailed = true; process.stderr.write(`patch_js: ${file}: ${e.message}\n`); summary.files[file] = { error: e.message }; continue; }
    for (const r of out.results) rows.push({ ...r, owner: patches.find((x) => x.ref === r.ref)?.owner });
    const c = { applied: 0, noop: 0, stale: 0, unresolved: 0, unsupported: 0, 'superseded-by-pipeline': 0 };
    for (const r of rows) { c[r.state]++; summary.totals[r.state]++; }
    summary.files[file] = { ...c, write: out.write };
    summary.rows.push(...rows);
    printLine(`patch_js: ${file}: applied ${c.applied} | noop ${c.noop} | stale ${c.stale} | unresolved ${c.unresolved} | unsupported ${c.unsupported} | superseded-by-pipeline ${c['superseded-by-pipeline']} | ${out.write}`);
  }
  const t = summary.totals;
  printLine(`patch_js total: applied ${t.applied} | noop ${t.noop} | stale ${t.stale} | unresolved ${t.unresolved} | unsupported ${t.unsupported} | superseded-by-pipeline ${t['superseded-by-pipeline']}${args.dryRun ? ' (dry run: nothing written)' : ''}`);
  for (const r of summary.rows.filter((x) => ['stale', 'unresolved', 'unsupported'].includes(x.state))) printLine(`  ${r.state.padEnd(10)} ${r.ref}  ${r.path || ''}  ${r.detail}`);

  if (!args.dryRun && !args.noRecord) {
    const { recordRows } = await import('./disposition.mjs');
    const rec = summary.rows.filter((r) => ['applied', 'noop', 'superseded-by-pipeline'].includes(r.state) && r.owner);
    const n = recordRows(resolveRoots(args), rec.map((r) => ({ ref: r.ref, owner: r.owner, state: r.state === 'noop' ? 'applied' : r.state, detail: r.state === 'noop' ? `already present (${r.detail})` : r.detail })));
    if (n) printLine(`patch_js: recorded ${n} disposition rows`);
  }
  if (args.json) printLine(JSON.stringify(summary, null, 2));
  if (verifyFailed) return 1;
  if (args.strict && (t.stale || t.unresolved || t.unsupported)) return 1;
  return 0;
}

if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`${e.stack || e}\n`); process.exit(1); });
