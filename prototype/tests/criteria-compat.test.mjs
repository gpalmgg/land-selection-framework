import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { loadAll, UPG, baselineModule, criteriaCompat, REQUIRE_V2, fixture } from './helpers.mjs';

const D = await loadAll();
const changesFile = path.join(UPG, 'verify/criteria-changes.md');
const changes = existsSync(changesFile) ? readFileSync(changesFile, 'utf8') : '';

test('criteria-compat: old shared links keep their meaning (id, higherIs, unit and step of the 6bce1a3 baseline unchanged; removals/renames must be listed in verify/criteria-changes.md)', async (t) => {
  const base = await baselineModule('prototype/data/regions.js');
  if (!base) { if (REQUIRE_V2) assert.fail('git cannot supply 6bce1a3:prototype/data/regions.js'); return t.skip('git show 6bce1a3:prototype/data/regions.js unavailable (no git history here)'); }
  const errs = criteriaCompat(base.criteria, D.criteria, changes);
  assert.deepEqual(errs, [], 'a changed unit or scale needs a NEW criterion id (plan policy P-CELL):\n' + errs.join('\n'));
});

test('validator self-test: a fixture that changes a unit under an unchanged id fails; a listed rename passes; an unlisted removal fails', () => {
  const f = fixture('invalid/criteria-unit-changed.json');
  const errs = criteriaCompat(f.baseline, f.final);
  assert.ok(errs.some((e) => /unit changed/.test(e)), 'unit change under unchanged id must fail: ' + errs.join(' | '));
  assert.ok(!errs.some((e) => /step changed/.test(e)), 'explicit step 0.01 keeps the legacy slider step');
  const renamed = { baseline: f.baseline, final: [f.final[1], { ...f.final[0], id: 'water_stress_ratio' }] };
  assert.ok(criteriaCompat(renamed.baseline, renamed.final).some((e) => /removed or renamed/.test(e)), 'unlisted rename fails');
  assert.deepEqual(criteriaCompat(renamed.baseline, renamed.final, '| `water_stress` | replaced by `water_stress_ratio` |'), [], 'a listed rename passes');
  const widened = { baseline: f.baseline, final: [f.baseline[0], { ...f.baseline[1], rangeMax: 40 }] };
  assert.deepEqual(criteriaCompat(widened.baseline, widened.final), [], 'range 0..25 -> 0..40 keeps the legacy step 1');
  const stepMoved = { baseline: [f.baseline[1]], final: [{ ...f.baseline[1], rangeMax: 60 }] };
  assert.ok(criteriaCompat(stepMoved.baseline, stepMoved.final).some((e) => /step changed/.test(e)), 'widening a range so the implicit slider step changes fails unless step is set');
  const dir = { baseline: [f.baseline[1]], final: [{ ...f.baseline[1], higherIs: 'better' }] };
  assert.ok(criteriaCompat(dir.baseline, dir.final).some((e) => /higherIs/.test(e)));
});
