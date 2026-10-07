import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, baselineModule, baselineFile, readText, uncededMissing, uncededContextMissing, REQUIRE_V2, fixture } from './helpers.mjs';

const D = await loadAll();
const skipMsg = 'git cannot supply the 6bce1a3 baseline (no git history here)';

// Gustaf kept the word "unceded" unchanged (option c): every baseline occurrence survives.
for (const [label, rel, pick] of [
  ['land-standing.js', 'prototype/data/land-standing.js', (m) => m.landStanding],
  ['regions.js (blurbs, labels, criteria)', 'prototype/data/regions.js', (m) => ({ regions: m.regions, values: m.values, criteria: m.criteria })],
  ['region-depth.js', 'prototype/data/region-depth.js', (m) => m.regionDepth],
]) {
  test(`unceded: every (region id, field) of ${label} that said "unceded" at 6bce1a3 still says it`, async (t) => {
    const base = await baselineModule(rel);
    if (!base) { if (REQUIRE_V2) assert.fail(skipMsg); return t.skip(skipMsg); }
    const shipped = { 'prototype/data/land-standing.js': D.landStanding, 'prototype/data/regions.js': { regions: D.regions, values: D.values, criteria: D.criteria }, 'prototype/data/region-depth.js': D.regionDepth }[rel];
    const miss = uncededMissing(pick(base), shipped);
    assert.deepEqual(miss, [], 'wording "unceded" was kept unchanged by Gustaf (option c); restore it at:\n' + miss.join('\n'));
  });
}

test('unceded: deeper.html keeps the 80 characters around every baseline occurrence (tags stripped, whitespace normalised)', (t) => {
  const base = baselineFile('prototype/deeper.html');
  if (!base) { if (REQUIRE_V2) assert.fail(skipMsg); return t.skip(skipMsg); }
  const shipped = readText('deeper.html');
  assert.ok(shipped, 'deeper.html missing');
  const miss = uncededContextMissing(base.text, shipped);
  assert.deepEqual(miss, [], 'baseline text around "unceded" changed in deeper.html:\n' + miss.join('\n'));
});

test('validator self-test: removing "unceded" from a fixture is caught (module fields and html context); an untouched fixture passes', () => {
  const f = fixture('invalid/unceded-removed.json');
  assert.deepEqual(uncededMissing(f.baseline, f.baseline), []);
  assert.deepEqual(uncededMissing(f.baseline, f.shipped), ['landStanding.nova-scotia.territory']);
  assert.deepEqual(uncededMissing({ a: [{ id: 'x', t: 'Unceded land' }] }, { a: [{ id: 'x', t: 'unceded land, kept' }] }), [], 'case-insensitive; keyed by id inside arrays');
  assert.deepEqual(uncededContextMissing(f.baselineHtml, f.baselineHtml), []);
  assert.equal(uncededContextMissing(f.baselineHtml, f.shippedHtml).length, 1);
});
