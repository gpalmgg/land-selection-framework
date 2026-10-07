// lib/result.js (now built on lib/filters.js) must equal the version that shipped at 6bce1a3 on 200 random threshold sets.
// The OLD file is read from git into a temp dir; both versions run against the BASELINE data so the data waves that
// change data/regions.js cannot move the comparison.
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROTO = path.resolve(HERE, '..', '..');
const REPO = path.resolve(PROTO, '..');
const BASE_REGIONS = path.join(REPO, 'upgrade-2026-10', 'verify', 'baseline-site', 'prototype', 'data', 'regions.js');

const baseData = await import(pathToFileURL(BASE_REGIONS).href);
const { regions, criteria, values } = baseData;

// A scratch tree: tmp/package.json (module), tmp/data/regions.js (baseline, optionally with null cells), tmp/lib/*.
function scratch(libFiles, nullCells = []) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'lsf-result-parity-'));
  writeFileSync(path.join(tmp, 'package.json'), '{"type":"module"}\n');
  mkdirSync(path.join(tmp, 'data'));
  mkdirSync(path.join(tmp, 'lib'));
  let src = readFileSync(BASE_REGIONS, 'utf8');
  if (nullCells.length) {
    const vals = JSON.parse(JSON.stringify(values));
    for (const [rid, cid] of nullCells) vals[rid][cid] = { value: null, nullReason: 'parity test' };
    // drop the original `values` export and append the modified one; regions and criteria stay as they were
    src = src.replace(/export const values = /, 'const _unusedValues = ') + `\nexport const values = ${JSON.stringify(vals)};\n`;
  }
  writeFileSync(path.join(tmp, 'data', 'regions.js'), src);
  for (const [name, content] of Object.entries(libFiles)) writeFileSync(path.join(tmp, 'lib', name), content);
  return tmp;
}

const oldResult = execFileSync('git', ['-C', REPO, 'show', '6bce1a3:prototype/lib/result.js'], { encoding: 'utf8' });
const newLib = Object.fromEntries(['result.js', 'filters.js'].map((f) => [f, readFileSync(path.join(PROTO, 'lib', f), 'utf8')]));

async function pair(nullCells) {
  const oldDir = scratch({ 'result.js': oldResult }, nullCells);
  const newDir = scratch(newLib, nullCells);
  const oldMod = await import(pathToFileURL(path.join(oldDir, 'lib', 'result.js')).href);
  const newMod = await import(pathToFileURL(path.join(newDir, 'lib', 'result.js')).href);
  return { oldMod, newMod };
}

function prng(seed) { let s = seed; return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
const step = (c) => { const span = c.rangeMax - c.rangeMin; return span <= 1 ? 0.01 : span <= 5 ? 0.1 : span <= 50 ? 1 : 10; };
function randomQuery(rand) {
  const p = new URLSearchParams();
  for (const c of criteria) {
    if (rand() < 0.5) {
      // on-grid values, plus occasional out-of-range and junk values to exercise clamping and skipping
      const raw = c.rangeMin + (rand() * 1.2 - 0.1) * (c.rangeMax - c.rangeMin);
      p.set(`t.${c.id}`, rand() < 0.05 ? 'junk' : String(+(Math.round(raw / step(c)) * step(c)).toFixed(4)));
    }
  }
  if (rand() < 0.3) p.set('t.not_a_criterion', '5');
  if (rand() < 0.5) p.set('pin', [...regions].filter(() => rand() < 0.1).map((r) => r.id).concat(rand() < 0.3 ? ['unknown-place'] : []).join(','));
  if (rand() < 0.2) p.set('utm_source', 'x');
  return p;
}
const shape = (r) => ({
  thresholds: r.thresholds,
  active: r.active.map((c) => c.id),
  matching: r.matching.map((x) => x.id),
  pins: r.pins,
  summaries: r.summaries,
  total: r.total,
  anyActive: r.anyActive,
});

async function compare(label, nullCells) {
  const { oldMod, newMod } = await pair(nullCells);
  assert.equal(typeof newMod.computeResult, 'function');
  const rand = prng(20261005);
  let differing = 0, withMatches = 0, narrowed = 0;
  for (let i = 0; i < 200; i++) {
    const q = randomQuery(rand);
    for (const continent of ['europe', 'north-america']) {
      const a = shape(oldMod.computeResult(new URLSearchParams(q), continent));
      const b = shape(newMod.computeResult(new URLSearchParams(q), continent));
      try { assert.deepEqual(b, a, `${label} #${i} ${continent} ?${q}`); } catch (e) { differing++; if (differing <= 3) console.error(e.message); }
      if (a.matching.length) withMatches++;
      if (a.matching.length < a.total) narrowed++;
    }
  }
  assert.equal(differing, 0, `${label}: new lib/result.js differs from the 6bce1a3 version in ${differing} case(s)`);
  // the random sets must actually exercise the filter, not just the all-pass case
  assert.ok(narrowed > 50, `${label}: only ${narrowed} cases narrowed the list`);
  assert.ok(withMatches > 50, `${label}: only ${withMatches} cases kept a match`);
}

test('lib/result.js equals the 6bce1a3 version on 200 random threshold sets (both continents, baseline data)', async () => {
  await compare('real data', []);
});

test('and with null cells in the data (a null cell never removes a region in either version)', async () => {
  const nulls = [];
  const rand = prng(5);
  for (const r of regions) for (const c of criteria) if (rand() < 0.08) nulls.push([r.id, c.id]);
  assert.ok(nulls.length > 5);
  await compare('null cells', nulls);
});

test('computeResult keeps its output shape', async () => {
  const { newMod } = await pair([]);
  const r = newMod.computeResult(new URLSearchParams(''), 'europe');
  assert.deepEqual(Object.keys(r).sort(), ['active', 'anyActive', 'matching', 'pins', 'summaries', 'thresholds', 'total']);
  assert.equal(r.anyActive, false);
  assert.equal(r.matching.length, r.total);
});
