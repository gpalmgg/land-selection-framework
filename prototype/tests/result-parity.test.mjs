import test from 'node:test';
import assert from 'node:assert/strict';
import { cpSync, mkdtempSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadAll, ROOT, prng, REQUIRE_V2 } from './helpers.mjs';

const D = await loadAll();
const { regions, criteria } = D;

// Independent reference implementation of the filter rule (written from the framework doc, not copied from lib/result.js):
// a threshold FILTERS and never scores. For a "better" criterion a region passes when value >= threshold; for every other
// kind when value <= threshold. A null / non-numeric cell never fails (and never counts as a pass either: it is just absent).
const dirOf = (c) => (c.higherIs === 'better' ? 'min' : 'max');
const defOf = (c) => (dirOf(c) === 'min' ? c.rangeMin : c.rangeMax);
function reference(values, th, continent) {
  return regions.filter((r) => r.continent === continent).filter((r) => criteria.every((c) => {
    const v = values[r.id] && values[r.id][c.id]; if (!v || typeof v.value !== 'number' || !Number.isFinite(v.value)) return true;
    return dirOf(c) === 'min' ? v.value >= th[c.id] : v.value <= th[c.id];
  })).map((r) => r.id);
}
const idsOf = (rows) => rows.map((r) => (typeof r === 'string' ? r : r.id));

// Build a scratch copy of lib/ + data/*.js whose values carry null cells, so the null rule is exercised on real code paths.
async function loadResultModule(nullCells) {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'lsf-parity-'));
  const keep = (src) => !/(\/raw|\/processed|\/v1-exports|\/research-dossier|node_modules|\.venv)(\/|$)/.test(src);
  for (const d of ['lib', 'src']) if (existsSync(path.join(ROOT, d))) cpSync(path.join(ROOT, d), path.join(tmp, d), { recursive: true, filter: keep });
  cpSync(path.join(ROOT, 'data'), path.join(tmp, 'data'), { recursive: true, filter: (s) => keep(s) && !/\.(bak)$/.test(s) });
  const vals = JSON.parse(JSON.stringify(D.values));
  for (const [rid, cid] of nullCells) vals[rid][cid] = { value: null, nullReason: 'parity test: not reproduced' };
  const orig = pathToFileURL(path.join(ROOT, 'data/regions.js')).href;
  writeFileSync(path.join(tmp, 'data/regions.js'), `export * from '${orig}';\nexport const values = ${JSON.stringify(vals)};\n`);
  const mod = await import(pathToFileURL(path.join(tmp, 'lib/result.js')).href);
  return { mod, values: vals };
}

function randomThresholds(rand) {
  const th = Object.fromEntries(criteria.map((c) => [c.id, defOf(c)]));
  for (const c of criteria) if (rand() < 0.5) { const raw = c.rangeMin + rand() * (c.rangeMax - c.rangeMin); const step = (c.step ?? ((c.rangeMax - c.rangeMin) <= 1 ? 0.01 : (c.rangeMax - c.rangeMin) <= 5 ? 0.1 : (c.rangeMax - c.rangeMin) <= 50 ? 1 : 10)); th[c.id] = +(Math.round(raw / step) * step).toFixed(4); }
  return th;
}
const toParams = (th) => { const p = new URLSearchParams(); for (const c of criteria) if (th[c.id] !== defOf(c)) p.set(`t.${c.id}`, String(th[c.id])); return p; };

async function parity(label, nullCells) {
  const { mod, values } = await loadResultModule(nullCells);
  assert.equal(typeof mod.computeResult, 'function', 'lib/result.js must export computeResult(searchParams, continent)');
  const rand = prng(20261005);
  const bad = [];
  for (let i = 0; i < 200; i++) {
    const th = randomThresholds(rand);
    for (const continent of ['europe', 'north-america']) {
      const got = idsOf(mod.computeResult(toParams(th), continent).matching), want = reference(values, th, continent);
      if (got.join(',') !== want.join(',')) bad.push(`${label} #${i} ${continent} ${JSON.stringify(Object.fromEntries(Object.entries(th).filter(([k, v]) => v !== defOf(criteria.find((c) => c.id === k)))))}: lib/result.js=[${got}] reference=[${want}]`);
    }
  }
  assert.deepEqual(bad.slice(0, 5), [], `lib/result.js computeResult disagrees with the reference filter rule in ${bad.length} case(s)`);
}

test('result parity: lib/result.js computeResult equals an independent reference filter for 200 random threshold sets over the real data', async (t) => {
  if (!existsSync(path.join(ROOT, 'lib/result.js'))) { if (REQUIRE_V2) assert.fail('lib/result.js missing'); return t.skip('lib/result.js missing'); }
  await parity('real data', []);
});

test('result parity: null cells never fail a threshold (200 random threshold sets with null cells injected)', async (t) => {
  if (!existsSync(path.join(ROOT, 'lib/result.js'))) return t.skip('lib/result.js missing');
  const cells = []; regions.forEach((r, i) => { cells.push([r.id, criteria[i % criteria.length].id]); if (i % 3 === 0) cells.push([r.id, criteria[(i + 3) % criteria.length].id]); });
  await parity('null cells', cells);
});

test('validator self-test: the reference rule filters min-type with >= and max-type with <=, and ignores null', () => {
  const c = criteria.find((x) => x.higherIs === 'better'), w = criteria.find((x) => x.higherIs !== 'better');
  const r = regions[0];
  const vals = { [r.id]: Object.fromEntries(criteria.map((k) => [k.id, { value: k.id === c.id ? 10 : k.id === w.id ? 5 : null }])) };
  const th = Object.fromEntries(criteria.map((k) => [k.id, defOf(k)]));
  const only = (v) => regions.filter((x) => x.id === r.id).length && reference({ [r.id]: vals[r.id] }, v, r.continent).includes(r.id);
  assert.equal(only({ ...th, [c.id]: 10 }), true, '>= passes at equality'); assert.equal(only({ ...th, [c.id]: 10.5 }), false);
  assert.equal(only({ ...th, [w.id]: 5 }), true, '<= passes at equality'); assert.equal(only({ ...th, [w.id]: 4.5 }), false);
});
