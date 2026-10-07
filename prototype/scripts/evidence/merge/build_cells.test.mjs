import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {
  copyFixtureRoot, readJson, write, cli, FIX, tmp, copyTree, scratchUpg,
} from './_kit.mjs';
import {
  parseJsonLoose, pipelineCandidate, trajectoryFor, methodFromReason, exceeds, SPEC, CRITERIA,
} from '../build_cells.mjs';

// build_cells.mjs lives in scripts/evidence/ (one level above merge/); its test sits here so that node --test scripts/evidence/merge/ runs it
const run = (s, ...more) => cli('../build_cells.mjs', ['--root', s.root, '--out', s.out, '--upg', s.upg, '--reverify', s.rev, '--packages', path.join(FIX, 'packages'), '--retrieved', '2026-10-05', ...more]);

function setup() {
  const { upg, out, rev } = scratchUpg();
  const root = copyFixtureRoot();
  copyTree(path.join(FIX, 'stages'), out);
  const s = { upg, out, rev, root };
  assert.equal(cli('reverify_to_patches.mjs', ['--root', root, '--out', out, '--reverify', rev, '--upg', upg]).code, 0);
  return s;
}
const cells = (s, id) => readJson(path.join(s.out, id, 'cells.json'));

test('parseJsonLoose reads bare NaN and Infinity as null (the real aqueduct files carry them)', () => {
  assert.deepEqual(parseJsonLoose('{"a": NaN, "b": [Infinity, -Infinity, 1], "c": "NaN"}'), { a: null, b: [null, null, 1], c: 'NaN' });
  assert.throws(() => parseJsonLoose('{nope}'));
});

test('P-CELL (1): the canonical pipeline value is chosen when the stage succeeded and recorded footprint, method and inputs', () => {
  const s = setup();
  assert.equal(run(s).code, 0);
  const a = cells(s, 'alpha');
  assert.equal(a.provenance.climate.chosen, 'pipeline');
  assert.equal(a.cells.climate.value, 18.3);
  assert.equal(a.cells.climate.method, 'footprint-zonal');
  assert.equal(a.cells.climate.footprint, 'alpha');
  assert.equal(a.cells.climate.sourceId, 'worldclim-cmip6');
  assert.equal(a.cells.climate.retrieved, '2026-10-05');
  assert.equal(a.cells.climate.trajectory.status, 'projected');
  assert.match(a.cells.climate.audit, /pipeline footprint-zonal climate\.value: 19\.5 -> 18\.3; reverify 18/);
  assert.equal(a.cells.climate.label, null, 'the old label no longer describes the new value: left for the integration WP');
  assert.ok(a.flags.climate.includes('label-needed'));
  // water stress: local-style stage with NaN, derived trajectory, scenario code, coverage flag
  assert.equal(a.cells.water_stress.value, 1.505);
  assert.equal(a.cells.water_stress.unit, 'ratio');
  assert.equal(a.cells.water_stress.scenario, 'business-as-usual (SSP3-7.0)');
  assert.deepEqual([a.cells.water_stress.trajectory.status, a.cells.water_stress.trajectory.direction, a.cells.water_stress.trajectory.delta], ['projected', 'rising', 0.795]);
  assert.ok(a.flags.water_stress.some((f) => /coverage 0\.9161/.test(f)));
  // conflict: marker-radius count, the layer-basis mismatch is flagged, trajectory derived from the two windows
  assert.equal(a.cells.conflict.value, 44);
  assert.equal(a.cells.conflict.method, 'named-count');
  assert.equal(a.cells.conflict.footprint, 'disc-200km');
  assert.ok(a.flags.conflict.some((f) => /layer-mismatch: all events 44, deployed-layer basis 2/.test(f)));
  assert.deepEqual([a.cells.conflict.trajectory.direction, a.cells.conflict.trajectory.delta], ['rising', 44]);
  // context carries Koppen periods under their display names
  assert.deepEqual(Object.keys(a.context.koppen.periods), ['1961–1990', '2041–2070 SSP2-4.5']);
  assert.equal(a.context.koppen.periods['1961–1990'].dominant, 'Csa');
});

test('P-CELL (2): a failed stage falls back to the HIGH/MEDIUM reverify value with its method recorded; an unclassifiable method is flagged', () => {
  const s = setup();
  run(s);
  const a = cells(s, 'alpha');
  assert.equal(a.provenance.soil_carbon.chosen, 'reverify');
  assert.equal(a.cells.soil_carbon.value, 25);
  assert.equal(a.cells.soil_carbon.method, 'hand-estimate');
  assert.ok(a.flags.soil_carbon.some((f) => /method-unclassified/.test(f)));
  assert.match(a.cells.soil_carbon.audit, /2026-10 reverify alpha\/medium\/17: 20 -> 25/);
  assert.match(a.cells.soil_carbon.audit, /soil stage status "failed"/);
  assert.equal(a.provenance.soil_carbon.confidence, 'medium');
  assert.equal(methodFromReason('read as a 3x3 window at the marker').method, 'point-3x3');
  assert.equal(methodFromReason('area-weighted over the basins').method, 'footprint-zonal');
  assert.equal(methodFromReason('Census 2020 population / area').method, 'official-statistic');
});

test('P-CELL (3): no pipeline value and no evidence-backed value gives null with a nullReason; a stage that did not record its footprint is not used', () => {
  const s = setup();
  run(s);
  const a = cells(s, 'alpha');
  assert.equal(a.cells.forest_change.value, null);
  assert.match(a.cells.forest_change.nullReason, /hansen stage did not record footprint/);
  assert.match(a.cells.forest_change.nullReason, /earlier midpoint is not shipped \(P-CELL\)/);
  assert.equal(a.cells.solar_pv.value, null);
  assert.match(a.cells.solar_pv.nullReason, /solar stage: no output file/);
  assert.deepEqual(a.nulls, ['forest_change', 'solar_pv', 'population', 'regen_network']);
  for (const c of a.nulls) assert.deepEqual(Object.keys(a.cells[c]).sort(), ['nullReason', 'unit', 'value']);
  // low-confidence reverify values are never used: beta-land has only a LOW value for water stress, and no stage
  const b = cells(s, 'beta-land');
  assert.equal(b.cells.water_stress.value, null);
  assert.equal(b.provenance.water_stress.chosen, 'null');
  assert.equal(b.provenance.climate.chosen, 'reverify', 'the HIGH climate value is used');
  assert.equal(b.cells.climate.value, 11);
});

test('the current regions.js value is only a cross-check column unless the integration WP names it with --accept-current', () => {
  const s = setup();
  run(s);
  const g = cells(s, 'gamma');
  assert.equal(g.provenance.water_stress.chosen, 'null', 'dossier midpoint 0.08 is not shipped');
  assert.equal(g.cells.water_stress.value, null);
  const s2 = setup();
  run(s2, '--accept-current', 'gamma:water_stress');
  const g2 = cells(s2, 'gamma');
  assert.equal(g2.provenance.water_stress.chosen, 'current-verified');
  assert.equal(g2.cells.water_stress.value, 0.08);
  assert.ok(g2.flags.water_stress.some((f) => /accepted-current/.test(f)));
});

test('a pipeline value within tolerance of the current cell keeps its label', () => {
  const s = setup();
  run(s);
  const g = cells(s, 'gamma');
  assert.equal(g.cells.climate.value, 9.1);
  assert.equal(g.cells.climate.label, 'Cold continental');
  assert.ok(!(g.flags.climate || []).includes('label-needed'));
});

test('a new region (package, no current cell) takes the verified package values with the criterion defaults recorded', () => {
  const s = setup();
  run(s);
  const p = cells(s, 'ship-region');
  assert.deepEqual(p.nulls, []);
  assert.ok(CRITERIA.every((c) => p.provenance[c].chosen === 'package'));
  assert.equal(p.cells.climate.value, 11.2);
  assert.equal(p.cells.climate.method, SPEC.climate.method);
  assert.equal(p.cells.regen_network.footprint, 'disc-100km');
  assert.ok(p.flags.climate.includes('method-assumed-from-criterion'));
  assert.match(p.cells.climate.audit, /package ship-region verified value 11\.2/);
  const gap = cells(s, 'gap-region');
  assert.equal(gap.cells.solar_pv.value, null, 'a package null stays null');
});

test('crosscheck uses the track tolerances and lists only the differences that exceed them', () => {
  const s = setup();
  run(s);
  const cc = readJson(path.join(s.out, 'crosscheck.json'));
  const row = (r, c) => cc.rows.find((x) => x.region === r && x.criterion === c);
  assert.deepEqual(row('alpha', 'climate').exceeds, ['current'], '18.3 vs 19.5 exceeds 0.5 C; vs reverify 18 does not');
  assert.deepEqual(row('alpha', 'water_stress').exceeds, ['current'], '1.505 vs 0.7 exceeds max(0.05, 25 percent); vs reverify 1.5 does not');
  assert.equal(row('alpha', 'conflict').source, 'pipeline');
  const md = fs.readFileSync(path.join(s.out, 'crosscheck.md'), 'utf8');
  assert.match(md, /\| alpha \| climate \| 18\.3 \| 19\.5 \| 18 \|/);
  assert.equal(exceeds('climate', 18.3, 18.7), false);
  assert.equal(exceeds('climate', 18.3, 18.9), true);
  assert.equal(exceeds('conflict', 0, 1), true);
  assert.equal(exceeds('solar_pv', 1000, 1049), false);
  assert.equal(exceeds('solar_pv', 1000, 1051), true);
  assert.equal(exceeds('water_stress', 0.1, 0.14), false, 'absolute floor of 0.05');
  assert.equal(exceeds('soil_carbon', 100, 114), false);
  assert.equal(exceeds('soil_carbon', 100, 116), true);
});

test('regions above the cap of 3 null cells are called out on stdout, dropped regions are skipped, idempotent second run', () => {
  const s = setup();
  write(path.join(s.upg, 'verify/dropped-regions.json'), { dropped: [{ id: 'gamma', reason: 'test' }] });
  const a = run(s);
  assert.equal(a.code, 0, a.err);
  assert.match(a.out, /alpha\s+\S+\s+nulls 4\s+\(above the cap of 3: report a NULL-DECISION line\)/);
  assert.ok(!fs.existsSync(path.join(s.out, 'gamma/cells.json')), 'a dropped region gets no cells');
  const before = fs.readFileSync(path.join(s.out, 'alpha/cells.json'), 'utf8');
  const b = run(s);
  assert.match(b.out, /alpha .*cells\.json unchanged/);
  assert.equal(fs.readFileSync(path.join(s.out, 'alpha/cells.json'), 'utf8'), before, 'generatedAt is kept when nothing else changed');
  const dry = tmp();
  const c = run({ ...s, out: dry }, '--dry-run');
  assert.equal(c.code, 0);
  assert.deepEqual(fs.readdirSync(dry), [], '--dry-run writes nothing');
});

test('pipelineCandidate refuses a stage without status ok, without a number, or without recorded inputs', () => {
  const ok = { status: 'ok', value: 12.34, footprint: { id: 'x' }, method: 'footprint-zonal', models_ok: ['a'] };
  assert.equal(pipelineCandidate('climate', { json: ok }).ok, true);
  assert.match(pipelineCandidate('climate', { json: { ...ok, status: 'failed', error: 'boom' } }).why, /status "failed": boom/);
  assert.match(pipelineCandidate('climate', { json: { ...ok, value: 'x' } }).why, /no number at value/);
  assert.match(pipelineCandidate('climate', { json: { ...ok, models_ok: undefined } }).why, /did not record inputs/);
  assert.match(pipelineCandidate('climate', { json: { ...ok, method: undefined } }).why, /did not record method/);
  assert.match(pipelineCandidate('climate', { error: 'no output file', json: null }).why, /no output file/);
  const regen = { status: 'ok', value: 6, footprint: { id: 'x' }, method: 'count-within-radius-of-marker', baseline: { sha256: 'abc' } };
  const c = pipelineCandidate('regen_network', { json: regen });
  assert.equal(c.ok, true);
  assert.equal(c.method, 'named-count');
  assert.equal(c.footprint, 'disc-100km');
  assert.equal(trajectoryFor('soil_carbon', { trajectory: { status: 'not_available', direction: null } }, SPEC.soil_carbon).trajectory.status, 'not_available');
  assert.ok(trajectoryFor('soil_carbon', { trajectory: { status: 'not_available', direction: null } }, SPEC.soil_carbon).trajectory.basis.length > 10, 'a missing basis is completed');
});

test('a stage with status fallback keeps its number (only a companion fell back) and says so; without a number it is unusable', () => {
  const j = { status: 'fallback', error: 'GHS-POP epoch 2030 not available', value: 48.2, footprint: { id: 'x' }, method: 'footprint-zonal', tiles: [{ tile: 'R1_C1' }], trajectory: { status: 'not_available', direction: null } };
  const c = pipelineCandidate('population', { json: j });
  assert.equal(c.ok, true);
  assert.match(c.fallbackNote, /stage status fallback: GHS-POP epoch 2030 not available/);
  const gone = pipelineCandidate('population', { json: { ...j, value: null } });
  assert.equal(gone.ok, false);
  assert.match(gone.why, /status "fallback" and no value/);
});

test('a stage trajectory is completed with the criterion defaults and its direction words are normalised to the schema words', () => {
  const t = trajectoryFor('population', { trajectory: { status: 'projected', direction: 'stable', change_pct_2020_2030: -0.4, basis: 'epoch 2030 is a projection' } }, SPEC.population);
  assert.equal(t.trajectory.direction, 'steady');
  assert.equal(t.trajectory.delta, -0.4);
  assert.equal(t.trajectory.unit, '%');
  assert.equal(t.trajectory.sourceId, 'ghsl-pop-r2023a');
  assert.ok(t.trajectory.source && t.trajectory.sourceUrl && t.trajectory.vintage);
  assert.equal(t.completed, true);
});

test('--stage-map lets the integration WP point a criterion at another number in a stage file', () => {
  const s = setup();
  write(path.join(s.out, 'gamma/solar.json'), { stage: 'solar', region: 'gamma', status: 'ok', retrieved: '2026-10-05', footprint: { id: 'gamma' }, method: 'footprint-zonal', n_points: 10, result: { mean_pvout: 1288.4 } });
  run(s);
  assert.equal(cells(s, 'gamma').cells.solar_pv.value, null);
  assert.match(cells(s, 'gamma').cells.solar_pv.nullReason, /no number at value \| pvout\.mean \| mean/);
  write(path.join(s.upg, 'stage-map.json'), { solar_pv: ['result.mean_pvout'] });
  run(s, '--stage-map', path.join(s.upg, 'stage-map.json'));
  assert.equal(cells(s, 'gamma').cells.solar_pv.value, 1288);
  assert.equal(cells(s, 'gamma').provenance.solar_pv.field, 'result.mean_pvout');
});
