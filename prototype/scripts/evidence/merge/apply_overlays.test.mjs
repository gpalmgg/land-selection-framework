import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  copyFixtureRoot, read, readJson, write, cli, FIX, tmp, copyTree,
} from './_kit.mjs';

const imp = (f) => import(`${pathToFileURL(f).href}?t=${Math.random()}`);
function setup() {
  const root = copyFixtureRoot();
  const staging = copyTree(path.join(FIX, 'staging'), path.join(tmp(), 'staging'));
  return { root, staging, run: (...a) => cli('apply_overlays.mjs', ['--root', root, '--staging', staging, ...a]) };
}

test('registered new field is added, existing path is replaced, unregistered field is rejected (and the run fails)', async () => {
  const s = setup();
  const r = s.run();
  assert.equal(r.code, 1, 'a rejected entry makes the run fail so it cannot go unnoticed');
  assert.match(r.out, /rejected\s+landStanding\/alpha:landStanding\.invented_field/);
  assert.match(r.out, /not registered in tests\/schema\.mjs/);
  const m = await imp(path.join(s.root, 'data/land-standing.js'));
  assert.equal(m.landStanding.alpha.displacement, 'Depopulation of the villages has left common land under-used.');
  assert.equal(m.landStanding.alpha.entry, 'Buy freehold only after meeting the village association');
  assert.equal(m.landStanding.alpha.invented_field, undefined);
  assert.equal(m.landStanding.alpha.territory, 'Alentejano montado agro-pastoral culture', 'other fields untouched');
  assert.ok(read(path.join(s.root, 'data/land-standing.js')).includes('// ===================== Europe ====================='));
});

test('overlays reach regions.js, a processed layer JSON and a nested context path', async () => {
  const s = setup();
  s.run();
  const reg = await imp(path.join(s.root, 'data/regions.js'));
  assert.equal(reg.regions.find((r) => r.id === 'beta-land').blurb, 'Atlantic hill country with blanket bog; place first.');
  assert.equal(readJson(path.join(s.root, 'data/processed/land-cost.json')).find((r) => r.region_id === 'gamma').price_notes, 'Valley land, updated note.');
  const ctx = await imp(path.join(s.root, 'data/context.js'));
  assert.equal(ctx.context.alpha.koppen.dominant, 'Csb');
});

test('idempotent: a second run changes nothing and reports noop', () => {
  const s = setup();
  s.run();
  const files = ['data/land-standing.js', 'data/regions.js', 'data/processed/land-cost.json', 'data/context.js'];
  const once = files.map((f) => read(path.join(s.root, f)));
  const again = s.run();
  assert.match(again.out, /noop/);
  assert.deepEqual(files.map((f) => read(path.join(s.root, f))), once);
});

test('--dry-run writes nothing', () => {
  const s = setup();
  const before = ['data/land-standing.js', 'data/regions.js', 'data/context.js'].map((f) => read(path.join(s.root, f)));
  const r = s.run('--dry-run');
  assert.match(r.out, /dry run/);
  assert.deepEqual(['data/land-standing.js', 'data/regions.js', 'data/context.js'].map((f) => read(path.join(s.root, f))), before);
});

test('--only and --region narrow the run; a mismatched regionId in a file is a problem', () => {
  const s = setup();
  const r = s.run('--only', 'regions');
  assert.equal(r.code, 0, r.err + r.out);
  assert.ok(!read(path.join(s.root, 'data/land-standing.js')).includes('displacement'));
  write(path.join(s.staging, 'regions/gamma.json'), { regionId: 'someone-else', set: { blurb: 'x' }, evidence: [] });
  const bad = s.run('--only', 'regions');
  assert.equal(bad.code, 1);
  assert.match(bad.out, /does not match the file name/);
});

test('a path below a region that does not exist is unresolved, never invented', () => {
  const s = setup();
  write(path.join(s.staging, 'landStanding/ghost.json'), { regionId: 'ghost', set: { 'landStanding.entry': 'x' }, evidence: [] });
  const r = s.run('--only', 'landStanding', '--region', 'ghost');
  assert.equal(r.code, 1);
  assert.match(r.out, /unresolved\s+landStanding\/ghost/);
  assert.ok(!read(path.join(s.root, 'data/land-standing.js')).includes('ghost'));
});

test('values overlay: a registered cell field is added to an existing cell, an unknown criterion field is rejected', async () => {
  const s = setup();
  write(path.join(s.staging, 'values/alpha.json'), { regionId: 'alpha', from: 'evidence-track', set: { 'climate.audit': 'old -> new; kept after review', 'climate.mood': 'x' }, evidence: [] });
  const r = s.run('--only', 'values');
  assert.equal(r.code, 1);
  assert.match(r.out, /rejected\s+values\/alpha:climate\.mood/);
  const m = await imp(path.join(s.root, 'data/regions.js'));
  assert.equal(m.values.alpha.climate.audit, 'old -> new; kept after review');
  assert.equal(m.values.alpha.climate.value, 19.5);
});
