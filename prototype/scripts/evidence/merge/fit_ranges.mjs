#!/usr/bin/env node
// Fit the slider ranges of data/regions.js criteria[] to the values the file actually holds.
//
//   node scripts/evidence/merge/fit_ranges.mjs [--file data/regions.js] [--dry-run] [--exact] [--headroom 0.1]
//        [--min-max <criterion>=<n>]... [--root DIR] [--out-file REPORT.md]
//
// Rule per criterion (every non-null cell value of every region is read from the module):
//   lo = min - headroom * span, hi = max + headroom * span   (span = max - min; headroom default 10 percent)
//   a side that cannot grow is left alone: a range that starts at 0 for a non-negative quantity keeps 0
//   lo/hi are rounded OUTWARD to a nice number (two significant digits: multiples of a tenth of the leading power of ten)
//   default mode CONTAINS: a side of the existing range is replaced by the fitted bound only when a value falls outside it, so
//   no preset threshold or old shared link ends up outside the slider and nothing is narrowed. --exact uses the fitted
//   envelope on both sides even where it is narrower.
//   --min-max water_stress=2 guarantees rangeMax >= 2 (repeatable)
// A value is never clamped: the range is widened to contain it. If the slider step implied by the range
// (lib/filters.js thresholdStep: span <= 1 -> 0.01, <= 5 -> 0.1, <= 50 -> 1, else 10) would change, an explicit `step` equal
// to the OLD effective step is written so old shared links keep their meaning (tests/criteria-compat). Idempotent.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  findExport, arrayElements, objectEntries, readLiteral, replaceRange, insertEntryAfter,
} from './jsscan.mjs';
import { parseArgs, resolveRoots, printLine, writeIfChanged, isMain } from './common.mjs';

export const legacyStep = (min, max) => { const span = max - min; return span <= 1 ? 0.01 : span <= 5 ? 0.1 : span <= 50 ? 1 : 10; };
const clean = (n) => Number(n.toPrecision(12));

export function niceCeil(x) {
  if (x === 0) return 0;
  if (x < 0) return -niceFloor(-x);
  const u = 10 ** Math.floor(Math.log10(x));
  const h = u / 10;
  return clean(Math.ceil(x / h - 1e-9) * h);
}
export function niceFloor(x) {
  if (x === 0) return 0;
  if (x < 0) return -niceCeil(-x);
  const u = 10 ** Math.floor(Math.log10(x));
  const h = u / 10;
  return clean(Math.floor(x / h + 1e-9) * h);
}

// Pure: the fitted range for one criterion.
export function fitRange({ min, max, rangeMin, rangeMax }, { headroom = 0.1, exact = false, floorMax = null } = {}) {
  const span = max - min;
  let lo;
  let hi;
  const lowFixed = rangeMin === 0 && min >= 0; // a non-negative quantity anchored at 0
  lo = lowFixed ? 0 : niceFloor(min - headroom * span);
  hi = niceCeil(max + headroom * span);
  if (hi <= max) hi = clean(niceCeil(max + (span || Math.abs(max) || 1) * headroom + 1e-9));
  if (!lowFixed && lo >= min) lo = niceFloor(min - (span || Math.abs(min) || 1) * headroom - 1e-9);
  if (!exact) { // contain: only a side that fails containment takes the fitted bound
    lo = min < rangeMin ? Math.min(lo, rangeMin) : rangeMin;
    hi = max > rangeMax ? Math.max(hi, rangeMax) : rangeMax;
  }
  if (floorMax !== null) hi = Math.max(hi, floorMax);
  return { rangeMin: lo, rangeMax: hi };
}

async function loadModule(abs) {
  const src = fs.readFileSync(abs, 'utf8');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsf-fit-'));
  try {
    const f = path.join(dir, 'm.mjs');
    fs.writeFileSync(f, src);
    return await import(`${pathToFileURL(f).href}?t=${Date.now()}${Math.random()}`);
  } finally { fs.rmSync(dir, { recursive: true, force: true }); }
}

export async function fitFile(abs, opts = {}) {
  let src = fs.readFileSync(abs, 'utf8');
  const mod = await loadModule(abs);
  const diffs = [];
  const floorMax = opts.floorMax || {};
  for (const crit of mod.criteria) {
    const vals = [];
    for (const id of Object.keys(mod.values)) {
      const c = mod.values[id][crit.id];
      if (c && typeof c.value === 'number' && Number.isFinite(c.value)) vals.push(c.value);
    }
    if (!vals.length) continue;
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const next = fitRange({ min, max, rangeMin: crit.rangeMin, rangeMax: crit.rangeMax }, { ...opts, floorMax: floorMax[crit.id] ?? null });
    const oldStep = crit.step !== undefined ? crit.step : legacyStep(crit.rangeMin, crit.rangeMax);
    const newStepImplied = crit.step !== undefined ? crit.step : legacyStep(next.rangeMin, next.rangeMax);
    const needStep = crit.step === undefined && newStepImplied !== oldStep;
    const changed = next.rangeMin !== crit.rangeMin || next.rangeMax !== crit.rangeMax || needStep;
    diffs.push({ id: crit.id, values: vals.length, min, max, from: [crit.rangeMin, crit.rangeMax], to: [next.rangeMin, next.rangeMax], step: needStep ? oldStep : (crit.step ?? null), changed });
    if (!changed) continue;
    // edit text: criteria[id=...].rangeMin/rangeMax (+ step)
    const pos = findExport(src, 'criteria');
    const arr = arrayElements(src, pos);
    const el = arr.elements.find((e) => {
      const o = objectEntries(src, e.valStart);
      const idE = o.entries.find((x) => x.key === 'id');
      const l = idE && readLiteral(src, idE.valStart, idE.valEnd);
      return l && l.value === crit.id;
    });
    for (const key of ['rangeMax', 'rangeMin']) { // later offset first
      const o = objectEntries(src, el.valStart);
      const e = o.entries.find((x) => x.key === key);
      const v = key === 'rangeMin' ? next.rangeMin : next.rangeMax;
      if (e) src = replaceRange(src, e.valStart, e.valEnd, String(v));
    }
    if (needStep) {
      const el2 = arrayElements(src, findExport(src, 'criteria')).elements.find((e) => objectEntries(src, e.valStart).entries.some((x) => x.key === 'id' && readLiteral(src, x.valStart, x.valEnd).value === crit.id));
      src = insertEntryAfter(src, el2.valStart, 'rangeMax', 'step', String(oldStep));
    }
  }
  return { src, diffs };
}

export function renderDiffs(diffs) {
  const lines = ['| criterion | values | min | max | range before | range after | step |', '|---|---|---|---|---|---|---|'];
  for (const d of diffs) lines.push(`| ${d.id} | ${d.values} | ${d.min} | ${d.max} | ${d.from[0]} to ${d.from[1]} | ${d.changed ? `${d.to[0]} to ${d.to[1]}` : 'unchanged'} | ${d.step ?? ''} |`);
  return lines.join('\n');
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['dry-run', 'exact'], listFlags: ['min-max'] });
  const { ROOT } = resolveRoots(args);
  const rel = args.file && args.file !== true ? args.file : 'data/regions.js';
  const abs = path.join(ROOT, rel);
  const floorMax = {};
  for (const kv of args.minMax || []) { const [k, v] = String(kv).split('='); floorMax[k] = Number(v); }
  const { src, diffs } = await fitFile(abs, { exact: !!args.exact, headroom: args.headroom ? Number(args.headroom) : 0.1, floorMax });
  const changed = fs.readFileSync(abs, 'utf8') !== src;
  const md = renderDiffs(diffs);
  printLine(md);
  if (args.outFile && args.outFile !== true) writeIfChanged(path.resolve(args.outFile), `${md}\n`, { dryRun: !!args.dryRun });
  if (!changed) { printLine('fit_ranges: ranges already fit: unchanged'); return 0; }
  if (args.dryRun) { printLine('fit_ranges: dry run, nothing written'); return 0; }
  fs.writeFileSync(abs, src);
  printLine(`fit_ranges: ${rel} updated`);
  return 0;
}
if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`fit_ranges: ${e.stack || e}\n`); process.exit(1); });
