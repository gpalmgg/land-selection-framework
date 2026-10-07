import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {
  cli, scratchUpg, readJson, write, FIX, copyFixtureRoot, tmp, read,
} from './_kit.mjs';

// Every call runs against a scratch upgrade folder built from tests/fixtures/merge/reverify.
function env() {
  const s = scratchUpg();
  const flags = ['--root', path.join(FIX, 'root'), '--out', s.out, '--reverify', s.rev, '--upg', s.upg];
  const d = (...a) => cli('disposition.mjs', [...a, ...flags]);
  // converter output first: the held list pre-fills held-human-review
  assert.equal(cli('reverify_to_patches.mjs', flags).code, 0);
  return { ...s, flags, d };
}
const fileOf = (s, owner) => path.join(s.out, `disposition-${owner}.json`);
// Set every row of a file to an allowed state so a file can be made fully valid.
function resolveAll(s, owner) {
  const f = fileOf(s, owner);
  const j = readJson(f);
  const ok = { claim: 'rewritten', other: 'covered-by-P-CELL' };
  for (const r of j.rows) {
    if (r.state !== 'pending') continue;
    if (r.kind === 'newer_vintage') { r.state = 'noted-in-basis'; continue; }
    if (r.kind === 'unverifiable') { r.state = r.class === 'claim' ? 'rewritten' : ok.other; continue; }
    r.state = 'applied';
  }
  write(f, j);
}

test('--check with no disposition files yet passes with a note (nothing to verify before --init)', () => {
  const s = env();
  const r = s.d('--check');
  assert.equal(r.code, 0, r.err);
  assert.match(r.out, /no disposition-\*\.json files yet/);
});

test('--init creates one pending row per row the index assigns, pre-fills parked-low, held-human-review and recorded-only', () => {
  const s = env();
  const r = s.d('--init', 'EV-INT-REGIONS');
  assert.equal(r.code, 0, r.err);
  const rows = readJson(fileOf(s, 'EV-INT-REGIONS')).rows;
  const by = Object.fromEntries(rows.map((x) => [x.ref, x]));
  assert.equal(by['alpha/low/4'].state, 'parked-low');
  assert.equal(by['alpha/high/0'].state, 'pending');
  assert.equal(by['alpha/newer_vintage/0'].state, 'pending');
  const idx = readJson(path.join(s.out, 'reverify-index.json'));
  assert.deepEqual(rows.map((x) => x.ref).sort(), idx.filter((x) => x.owner === 'EV-INT-REGIONS').map((x) => x.ref).sort(), 'exactly the rows the index assigns to the WP');
  const st = readJson(path.join(s.out, 'reverify-index.json')).filter((x) => x.owner === 'EV-INT-STANDING');
  assert.ok(st.length > 0);
  s.d('--init', 'EV-INT-STANDING');
  const srows = Object.fromEntries(readJson(fileOf(s, 'EV-INT-STANDING')).rows.map((x) => [x.ref, x]));
  assert.equal(srows['alpha/medium/13'].state, 'held-human-review');
  assert.equal(srows['alpha/medium/14'].state, 'held-human-review');
  s.d('--init', 'recorded-only');
  assert.equal(readJson(fileOf(s, 'recorded-only')).rows[0].state, 'skipped');
  // re-running --init keeps every state that was set
  s.d('--set', 'alpha/high/0', 'applied', 'by test');
  s.d('--init', 'EV-INT-REGIONS');
  assert.equal(readJson(fileOf(s, 'EV-INT-REGIONS')).rows.find((x) => x.ref === 'alpha/high/0').state, 'applied');
});

test('--check fails on a fixture with a pending row', () => {
  const s = env();
  s.d('--init', 'EV-INT-REGIONS');
  const r = s.d('--check');
  assert.equal(r.code, 1);
  assert.match(r.err, /alpha\/high\/0: pending/);
});

test('--check fails when a claim-class row is marked applied or covered-by-P-CELL (states are checked per kind and class)', () => {
  const s = env();
  s.d('--init', 'EV-INT-STANDING');
  resolveAll(s, 'EV-INT-STANDING');
  assert.equal(s.d('--check').code, 0, 'a fully resolved file passes');
  const f = fileOf(s, 'EV-INT-STANDING');
  const j = readJson(f);
  const claim = j.rows.find((r) => r.kind === 'unverifiable' && r.class === 'claim');
  claim.state = 'applied';
  write(f, j);
  const bad = s.d('--check');
  assert.equal(bad.code, 1);
  assert.match(bad.err, new RegExp(`${claim.ref}: state "applied" is not allowed for unverifiable`));
  claim.state = 'covered-by-P-CELL';
  write(f, j);
  const bad2 = s.d('--check');
  assert.equal(bad2.code, 1);
  assert.match(bad2.err, /a claim .* must be rewritten \| removed \| marked-not-verified/);
  claim.state = 'marked-not-verified';
  write(f, j);
  assert.equal(s.d('--check').code, 0, 'marked-not-verified is allowed for an ordinary claim');
});

test('--check fails on a foreign-purchase row marked-not-verified (rewritten or removed only)', () => {
  const s = env();
  s.d('--init', 'EV-INT-DEPTH');
  resolveAll(s, 'EV-INT-DEPTH');
  const f = fileOf(s, 'EV-INT-DEPTH');
  const j = readJson(f);
  const foreign = j.rows.find((r) => r.kind === 'unverifiable' && /non-EU/i.test(r.target));
  assert.ok(foreign, 'fixture has the foreign-purchase row');
  foreign.state = 'marked-not-verified';
  write(f, j);
  const r = s.d('--check');
  assert.equal(r.code, 1);
  assert.match(r.err, /foreign-purchase assertion is rewritten or removed, never kept with a marker/);
  foreign.state = 'removed';
  write(f, j);
  assert.equal(s.d('--check').code, 0);
});

test('--check fails on a duplicate row across files, an unknown ref, a row in the wrong owner file, and a missing reason', () => {
  const s = env();
  s.d('--init', 'EV-INT-REGIONS');
  s.d('--init', 'EV-INT-STANDING');
  resolveAll(s, 'EV-INT-REGIONS');
  resolveAll(s, 'EV-INT-STANDING');
  assert.equal(s.d('--check').code, 0);
  const a = readJson(fileOf(s, 'EV-INT-REGIONS'));
  const b = readJson(fileOf(s, 'EV-INT-STANDING'));
  b.rows.push({ ...a.rows[0] });
  write(fileOf(s, 'EV-INT-STANDING'), b);
  const dup = s.d('--check');
  assert.equal(dup.code, 1);
  assert.match(dup.err, /duplicate row for alpha\/high\/0|belongs to EV-INT-REGIONS/);
  b.rows.pop();
  b.rows.push({ ref: 'nowhere/high/0', kind: 'high', state: 'applied' });
  write(fileOf(s, 'EV-INT-STANDING'), b);
  assert.match(s.d('--check').err, /unknown ref nowhere\/high\/0/);
  b.rows.pop();
  write(fileOf(s, 'EV-INT-STANDING'), b);
  const a2 = readJson(fileOf(s, 'EV-INT-REGIONS'));
  a2.rows.find((r) => r.kind === 'unverifiable' && r.class !== 'claim').state = 'no-action';
  write(fileOf(s, 'EV-INT-REGIONS'), a2);
  assert.match(s.d('--check').err, /"no-action" needs a reason/);
});

test('--check --strict fails on a missing row; --owner narrows the scope; recorded-only rows are implicit', () => {
  const s = env();
  s.d('--init', 'EV-INT-REGIONS');
  resolveAll(s, 'EV-INT-REGIONS');
  assert.equal(s.d('--check').code, 0, 'non-strict ignores owners that have not started');
  const strict = s.d('--check', '--strict');
  assert.equal(strict.code, 1);
  assert.match(strict.err, /no disposition row \(owner EV-INT-STANDING\)/);
  assert.equal(s.d('--check', '--strict', '--owner', 'EV-INT-REGIONS').code, 0);
  assert.equal(s.d('--check', '--strict', '--owner', 'recorded-only').code, 0, 'dossier items are implicitly skipped (recorded only)');
  assert.equal(s.d('--check', '--strict', '--owner', 'EV-INT-DEPTH').code, 1);
  // a row removed from an existing file is missing even without --strict
  const f = fileOf(s, 'EV-INT-REGIONS');
  const j = readJson(f);
  j.rows.pop();
  write(f, j);
  assert.equal(s.d('--check').code, 1);
});

test('--set validates the state against the kind and demands a reason where required', () => {
  const s = env();
  s.d('--init', 'EV-INT-REGIONS');
  assert.equal(s.d('--set', 'alpha/high/0', 'rewritten').code, 2, 'rewritten is not a correction state');
  assert.equal(s.d('--set', 'alpha/newer_vintage/0', 'applied').code, 2);
  assert.equal(s.d('--set', 'alpha/high/0', 'skipped').code, 2, 'skipped needs a reason');
  assert.equal(s.d('--set', 'alpha/high/0', 'skipped', 'cell replaced by the pipeline value').code, 0);
  assert.equal(s.d('--set', 'alpha/newer_vintage/0', 'noted-in-basis').code, 0);
  assert.equal(s.d('--set', 'nowhere/high/0', 'applied').code, 2);
  const row = readJson(fileOf(s, 'EV-INT-REGIONS')).rows.find((r) => r.ref === 'alpha/high/0');
  assert.equal(row.state, 'skipped');
  assert.equal(row.detail, 'cell replaced by the pipeline value');
});

test('--summary lists rows and states per owner', () => {
  const s = env();
  s.d('--init', 'EV-INT-REGIONS');
  const r = s.d('--summary');
  assert.equal(r.code, 0);
  assert.match(r.out, /EV-INT-REGIONS: rows \d+, .*pending \d+/);
  assert.match(r.out, /recorded-only: rows 1, skipped 1/);
});

test('--check-null-decisions: a region above 3 null cells needs a NULL-DECISION line in the integration report', () => {
  const s = env();
  const root = copyFixtureRoot();
  const nullCell = (u) => `{ value: null, unit: '${u}', nullReason: 'not reproduced: the stage failed after three retries' }`;
  const regions = read(path.join(root, 'data/regions.js'))
    .replace(/export const criteria = \[[\s\S]*$/, '')
    + `export const criteria = [{ id: 'climate' }, { id: 'water_stress' }, { id: 'soil_carbon' }, { id: 'forest_change' }, { id: 'solar_pv' }];\n`;
  const withNulls = regions.replace(/gamma: \{[\s\S]*?\n  \},\n\};/, `gamma: { climate: ${nullCell('°C')}, water_stress: ${nullCell('ratio')}, soil_carbon: ${nullCell('g/kg')}, forest_change: ${nullCell('%/decade')}, solar_pv: ${nullCell('kWh')} },\n};`);
  write(path.join(root, 'data/regions.js'), withNulls);
  const report = path.join(s.out, 'integration-report-EV-INT-REGIONS.md');
  const flags = ['--root', root, '--out', s.out, '--reverify', s.rev, '--upg', s.upg];
  const run = () => cli('disposition.mjs', ['--check-null-decisions', ...flags]);
  assert.equal(run().code, 1, 'no report at all');
  assert.match(run().err, /gamma has 5 null cells/);
  write(report, '# report\n\nNULL-DECISION alpha: dropped (not relevant)\n');
  assert.equal(run().code, 1, 'a line for another region does not count');
  write(report, '# report\n\nNULL-DECISION gamma: shipped-with-nulls (the gap state is the honest state; stages failed after retries)\n');
  assert.equal(run().code, 0);
  write(report, '# report\n\nNULL-DECISION gamma: maybe (undecided)\n');
  assert.equal(run().code, 1, 'only shipped-with-nulls or dropped are decisions');
  const okRoot = cli('disposition.mjs', ['--check-null-decisions', '--root', path.join(FIX, 'root'), '--out', tmp(), '--reverify', s.rev, '--upg', s.upg]);
  assert.equal(okRoot.code, 0, 'no region above the cap: nothing to decide');
});
