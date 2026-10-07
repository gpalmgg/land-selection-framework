// lib/filters.js: thresholds filter, they never score. Runs on the BASELINE data (6bce1a3) so the data waves
// that change data/regions.js cannot move these results.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regions, values, criteria } from '../../../upgrade-2026-10/verify/baseline-site/prototype/data/regions.js';
import { v1Lookup } from '../../../upgrade-2026-10/verify/baseline-site/prototype/data/v1-lookup.js';
import {
  thresholdDirection, thresholdDefault, thresholdStep, clampThreshold,
  cellState, failReasons, regionPasses, anyFilterActive, activeRegions,
} from '../../lib/filters.js';

// The four qualitative filters exactly as src/config/qual-filters.js defines them, over the baseline lookup.
const qualFilters = [
  { id: 'foreign_ownership', options: ['any', 'yes', 'restricted', 'no'], pick: (rid) => v1Lookup.legal_ownership?.[rid]?.foreign_ownership?.allowed },
  { id: 'affordability_band', options: ['any', 'cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'], pick: (rid) => v1Lookup.land_cost?.[rid]?.affordability_band },
  { id: 'buffering_strength', options: ['any', 'very_low', 'low', 'moderate', 'high', 'very_high'], pick: (rid) => v1Lookup.climate_buffering?.[rid]?.buffering_strength },
  { id: 'regulatory_direction', options: ['any', 'stable', 'tightening', 'loosening', 'volatile'], pick: (rid) => v1Lookup.legal_ownership?.[rid]?.regulatory_direction },
];
const data = { regions, values, criteria, qualFilters };
const freshState = (continent = 'europe') => ({
  continent,
  thresholds: Object.fromEntries(criteria.map((c) => [c.id, thresholdDefault(c)])),
  qualFilters: Object.fromEntries(qualFilters.map((q) => [q.id, 'any'])),
});
const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));

test('baseline data has the shape these tests rely on', () => {
  assert.ok(regions.length >= 20 && criteria.length >= 6);
  assert.ok(criteria.some((c) => c.higherIs === 'better'), 'at least one floor criterion');
  assert.ok(criteria.some((c) => c.higherIs !== 'better'), 'at least one ceiling criterion');
});

test('direction, default, step and clamp per criterion', () => {
  for (const c of criteria) {
    const floor = c.higherIs === 'better';
    assert.equal(thresholdDirection(c.higherIs), floor ? 'min' : 'max', c.id);
    assert.equal(thresholdDefault(c), floor ? c.rangeMin : c.rangeMax, `${c.id} default is the permissive end`);
    const span = c.rangeMax - c.rangeMin;
    assert.equal(thresholdStep(c), span <= 1 ? 0.01 : span <= 5 ? 0.1 : span <= 50 ? 1 : 10, `${c.id} step`);
    assert.equal(clampThreshold(c, c.rangeMin - 1000), c.rangeMin);
    assert.equal(clampThreshold(c, c.rangeMax + 1000), c.rangeMax);
    const mid = (c.rangeMin + c.rangeMax) / 2;
    assert.equal(clampThreshold(c, mid), mid);
  }
});

test('step values the legacy links relied on', () => {
  assert.equal(thresholdStep({ rangeMin: 0, rangeMax: 1 }), 0.01);
  assert.equal(thresholdStep({ rangeMin: 0, rangeMax: 5 }), 0.1);
  assert.equal(thresholdStep({ rangeMin: 0, rangeMax: 50 }), 1);
  assert.equal(thresholdStep({ rangeMin: 800, rangeMax: 2000 }), 10);
});

test('defaults pass every region on every continent', () => {
  const st = freshState();
  for (const r of regions) assert.equal(regionPasses(r.id, st, data), true, r.id);
  assert.equal(anyFilterActive(st, data), false);
  for (const r of regions) assert.deepEqual(failReasons(r.id, st, data), []);
});

test("'better' is a floor, every other kind is a ceiling", () => {
  for (const c of criteria) {
    const r = regions.find((x) => typeof values[x.id][c.id]?.value === 'number');
    const v = values[r.id][c.id].value;
    const st = freshState();
    st.thresholds[c.id] = v; // exactly the region's own figure: meets it
    assert.equal(cellState(r.id, c.id, st, data), 'within', `${c.id} equal to threshold is within`);
    const stricter = c.higherIs === 'better' ? v + 0.5 : v - 0.5;
    st.thresholds[c.id] = stricter;
    assert.equal(cellState(r.id, c.id, st, data), 'outside', `${c.id} stricter than the figure is outside`);
    assert.equal(regionPasses(r.id, st, data), false);
    const fr = failReasons(r.id, st, data);
    assert.equal(fr.length, 1);
    assert.deepEqual(fr[0], { kind: 'threshold', critId: c.id, value: v, threshold: stricter, direction: c.higherIs === 'better' ? 'min' : 'max' });
  }
});

test('null, missing and non-numeric cells are gaps: neither within nor outside, never a failure', () => {
  const c = criteria[0];
  const rid = regions[0].id;
  const nulled = JSON.parse(JSON.stringify(values));
  nulled[rid][c.id] = { value: null, nullReason: 'not reproduced' };
  const d2 = { ...data, values: nulled };
  const st = freshState();
  assert.equal(cellState(rid, c.id, st, d2), 'gap');
  // even at the strictest threshold a gap does not fail the region
  st.thresholds[c.id] = c.higherIs === 'better' ? c.rangeMax : c.rangeMin;
  assert.equal(cellState(rid, c.id, st, d2), 'gap');
  const others = criteria.filter((x) => x.id !== c.id);
  const onlyThis = failReasons(rid, st, d2).filter((f) => f.critId === c.id);
  assert.deepEqual(onlyThis, [], 'a gap is not a reason');
  const allDefaultOthers = { ...st, thresholds: { ...st.thresholds } };
  others.forEach((o) => { allDefaultOthers.thresholds[o.id] = thresholdDefault(o); });
  assert.equal(regionPasses(rid, allDefaultOthers, d2), true);
  // missing cell, missing row, non-numeric value, unknown criterion
  const sparse = JSON.parse(JSON.stringify(values));
  delete sparse[rid][c.id];
  assert.equal(cellState(rid, c.id, st, { ...data, values: sparse }), 'gap');
  assert.equal(cellState('no-such-region', c.id, st, data), 'gap');
  const textual = JSON.parse(JSON.stringify(values));
  textual[rid][c.id] = { value: 'n/a' };
  assert.equal(cellState(rid, c.id, st, { ...data, values: textual }), 'gap');
  assert.equal(cellState(rid, 'no_such_criterion', st, data), 'gap');
});

test('qualitative filters: any is no filter, a choice needs an exact match, a missing value does not match', () => {
  const st = freshState();
  const rid = regions.find((r) => v1Lookup.legal_ownership?.[r.id]?.foreign_ownership?.allowed)?.id;
  assert.ok(rid, 'baseline lookup has foreign ownership values');
  const got = v1Lookup.legal_ownership[rid].foreign_ownership.allowed;
  st.qualFilters.foreign_ownership = got;
  assert.equal(regionPasses(rid, st, data), true);
  assert.equal(anyFilterActive(st, data), true);
  const other = qualFilters[0].options.find((o) => o !== 'any' && o !== got);
  st.qualFilters.foreign_ownership = other;
  assert.equal(regionPasses(rid, st, data), false);
  assert.deepEqual(failReasons(rid, st, data), [{ kind: 'qual', filterId: 'foreign_ownership', want: other, got }]);
  // region without data for a chosen filter fails it
  const noData = { ...data, qualFilters: [{ id: 'foreign_ownership', options: ['any', 'yes'], pick: () => undefined }] };
  const st2 = { ...freshState(), qualFilters: { foreign_ownership: 'yes' } };
  assert.equal(regionPasses(rid, st2, noData), false);
  // numeric-only data (no qualFilters key) still works: this is what the edge functions use
  assert.equal(regionPasses(rid, freshState(), { regions, values, criteria }), true);
});

test('failReasons agrees with regionPasses over random states', () => {
  let seed = 7;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < 100; i++) {
    const st = freshState(rand() < 0.5 ? 'europe' : 'north-america');
    for (const c of criteria) if (rand() < 0.5) st.thresholds[c.id] = c.rangeMin + rand() * (c.rangeMax - c.rangeMin);
    for (const q of qualFilters) if (rand() < 0.2) st.qualFilters[q.id] = q.options[1 + Math.floor(rand() * (q.options.length - 1))];
    for (const r of regions) {
      assert.equal(failReasons(r.id, st, data).length === 0, regionPasses(r.id, st, data), `${r.id} #${i}`);
    }
  }
});

test('anyFilterActive and activeRegions', () => {
  const st = freshState();
  const c = criteria[0];
  st.thresholds[c.id] = c.higherIs === 'better' ? c.rangeMin + 1 : c.rangeMax - 1;
  assert.equal(anyFilterActive(st, data), true);
  const st2 = freshState();
  st2.qualFilters.regulatory_direction = 'stable';
  assert.equal(anyFilterActive(st2, data), true);
  const eu = activeRegions(freshState('europe'), data);
  const na = activeRegions(freshState('north-america'), data);
  assert.ok(eu.length > 0 && na.length > 0);
  assert.ok(eu.every((r) => r.continent === 'europe') && na.every((r) => r.continent === 'north-america'));
  assert.equal(eu.length + na.length, regions.length);
});

test('src/config/qual-filters.js keeps the first release ids and enum values and defines no display text', async () => {
  const { QUAL_FILTERS } = await import('../../src/config/qual-filters.js');
  assert.deepEqual(QUAL_FILTERS.map((q) => q.id), qualFilters.map((q) => q.id));
  assert.deepEqual(QUAL_FILTERS.map((q) => q.options), qualFilters.map((q) => q.options));
  for (const q of QUAL_FILTERS) {
    assert.equal(typeof q.pick, 'function');
    assert.equal('label' in q, false, `${q.id} must not carry display text`);
  }
});
