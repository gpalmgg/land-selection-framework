import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { FIX, PROTO, REAL_REVERIFY, cli, tmp, copyTree, write, readJson } from './_kit.mjs';
import { loadRegionPackage, loadAllPackages, parseVerdict, VERDICT_RE } from './load_region_package.mjs';

const PK = path.join(FIX, 'packages');
const load = (id) => loadRegionPackage(path.join(PK, id), { ROOT: path.join(FIX, 'root') });

test('verdict parsing: first line only, case-insensitive, ship-with-gaps before ship', () => {
  for (const [line, v] of [['ship', 'ship'], ['Verdict: ship', 'ship'], ['VERDICT: ship-with-gaps', 'ship-with-gaps'], ['# Verdict: DROP', 'drop'], ['**ship-with-gaps** (one cell)', 'ship-with-gaps'], ['  verdict ship', 'ship'], ['Overview: ship', null], ['shipment', null]]) {
    const m = VERDICT_RE.exec(line);
    assert.equal(m ? m[1].toLowerCase() : null, v, line);
  }
  assert.equal(parseVerdict(path.join(PK, 'no-verify-region')).verdict, null);
  assert.equal(parseVerdict(path.join(PK, 'no-verdict-region')).verdict, null);
});

test('no verdict (no verify.md, or no verdict on its first line) is skipped, not loaded', async () => {
  assert.equal((await load('no-verify-region')).skipped, 'no verdict');
  const nv = await load('no-verdict-region');
  assert.equal(nv.skipped, 'no verdict');
  assert.equal(nv.data, undefined);
  assert.equal(nv.cells, undefined);
});

test('drop is skipped with its verdict', async () => {
  const d = await load('dropped-region');
  assert.equal(d.skipped, 'drop');
  assert.equal(d.verdict, 'drop');
});

test('a ship-with-gaps package loads: the null cell keeps value null and a nullReason (package `reason` is normalised)', async () => {
  const p = await load('gap-region');
  assert.equal(p.skipped, undefined);
  assert.equal(p.verdict, 'ship-with-gaps');
  assert.equal(p.ok, true, p.errors.join('; '));
  assert.equal(p.cells.solar_pv.value, null);
  assert.match(p.cells.solar_pv.nullReason, /could not be reached/);
  assert.equal(p.cells.solar_pv.reason, undefined);
  assert.deepEqual(p.nullCells, ['solar_pv']);
});

test('the loader strips underscore keys and non-schema cell keys and reports each strip; registered keys survive', async () => {
  const p = await load('gap-region');
  assert.ok(p.stripped.includes('values.climate._audit'));
  assert.ok(p.stripped.includes('values.population.trend'));
  assert.ok(p.stripped.includes('values.population.notes'));
  assert.ok(p.stripped.includes('region._note'));
  assert.equal(p.cells.population.license, 'CC BY 4.0', 'license is a registered cell field');
  assert.equal(p.cells.population.trend, undefined);
  assert.deepEqual(Object.keys(p.region).sort(), ['accent', 'blurb', 'continent', 'coords', 'country', 'id', 'name', 'short']);
});

test('standing and depth load from both shapes (flat and keyed by the region id); _caseStudyLinks becomes caseLinks', async () => {
  const flat = await load('ship-region');
  assert.equal(flat.standing.territory, 'The people of ship-region');
  assert.equal(flat.depth.asks, 'It asks you to arrive slowly.');
  const keyed = await load('gap-region');
  assert.equal(keyed.standing.territory, 'The people of gap-region');
  assert.equal(keyed.standing._sources, undefined);
  assert.deepEqual(keyed.depth.caseLinks, [{ title: 'Case', url: 'https://example.org/case' }]);
  assert.ok(flat.dossier.includes('climate.md'));
  assert.equal(flat.hasStandingNotes, true);
});

test('an invalid ship package reports every problem and is not ok', async () => {
  const b = await load('bad-region');
  assert.equal(b.ok, false);
  const msg = b.errors.join('\n');
  assert.match(msg, /continent "asia"/);
  assert.match(msg, /coords/);
  assert.match(msg, /values\.conflict is missing/);
  assert.match(msg, /values\.climate\.value must be a finite number/);
});

test('a null cell without a reason is an error (policy P-CELL)', async () => {
  const dir = path.join(tmp(), 'nr-region');
  copyTree(path.join(PK, 'ship-region'), dir);
  const j = readJson(path.join(dir, 'data.json'));
  j.region.id = 'nr-region';
  j.values.conflict = { value: null, unit: 'events' };
  write(path.join(dir, 'data.json'), j);
  const p = await loadRegionPackage(dir, { ROOT: path.join(FIX, 'root') });
  assert.equal(p.ok, false);
  assert.match(p.errors.join('\n'), /values\.conflict: value is null but nullReason/);
});

test('a missing standing entry blocks a package (a region ships only with a verified Land standing entry)', async () => {
  const dir = path.join(tmp(), 'ns-region');
  copyTree(path.join(PK, 'ship-region'), dir);
  fs.rmSync(path.join(dir, 'standing.json'));
  const j = readJson(path.join(dir, 'data.json'));
  j.region.id = 'ns-region';
  write(path.join(dir, 'data.json'), j);
  const p = await loadRegionPackage(dir, { ROOT: path.join(FIX, 'root') });
  assert.equal(p.ok, false);
  assert.match(p.errors.join('\n'), /standing\.json is missing/);
});

test('loadAllPackages skips non-package folders; CLI exits 1 when any shipped package is invalid and prints the table', async () => {
  const all = await loadAllPackages(PK, { ROOT: path.join(FIX, 'root') });
  assert.deepEqual(all.map((p) => p.id), ['bad-region', 'dropped-region', 'gap-region', 'no-verdict-region', 'no-verify-region', 'ship-region']);
  const r = cli('load_region_package.mjs', ['--regions', PK, '--root', path.join(FIX, 'root')]);
  assert.equal(r.code, 1);
  assert.match(r.out, /dropped-region\s+skipped: drop/);
  assert.match(r.out, /gap-region\s+ship-with-gaps\s+ok/);
  const one = cli('load_region_package.mjs', ['--regions', PK, '--id', 'ship-region', '--root', path.join(FIX, 'root')]);
  assert.equal(one.code, 0, one.err);
});

test('REAL packages (upgrade-2026-10/regions): every ship or ship-with-gaps package loads and validates', { skip: !fs.existsSync(path.join(path.dirname(REAL_REVERIFY), 'regions')) && 'no regions folder' }, async () => {
  const all = await loadAllPackages(path.join(path.dirname(REAL_REVERIFY), 'regions'), { ROOT: PROTO });
  const ready = all.filter((p) => !p.skipped);
  for (const p of ready) assert.equal(p.ok, true, `${p.id}: ${(p.errors || []).join('; ')}`);
  assert.ok(ready.every((p) => ['ship', 'ship-with-gaps'].includes(p.verdict)));
});
