import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import {
  FIX, cli, copyFixtureRoot, read, tmp, write,
} from './_kit.mjs';
import { loadRegionPackage } from './load_region_package.mjs';
import {
  emitRegionObject, emitValuesBlock, emitKeyedEntry, insertRegionIntoRegionsJs, insertKeyedEntry, jsLiteral, jsString,
} from './emit_region_js.mjs';

const PK = path.join(FIX, 'packages');
const ROOT = path.join(FIX, 'root');
const pkg = (id) => loadRegionPackage(path.join(PK, id), { ROOT });
const PY = fs.existsSync('/usr/bin/python3') ? '/usr/bin/python3' : null;

// The regex the Python processors use (compile_per_jurisdiction.py, process_hospital_proximity.py)
function pythonIds(file) {
  const code = "import re,sys;s=open(sys.argv[1]).read();print(','.join(re.findall(r\"id:\\s*'([^']+)',[^}]*?coords:\",s)))";
  return execFileSync(PY, ['-c', code, file], { encoding: 'utf8' }).trim().split(',').filter(Boolean);
}

test('emitRegionObject: house format, id first, single quotes, coords after country, parses with the Python regex', async () => {
  const p = await pkg('ship-region');
  const text = emitRegionObject(p.region);
  assert.match(text, /^ {2}\{\n {4}id: 'ship-region',\n {4}continent: 'europe',\n {4}name: 'ship region',\n {4}short: 'ship',\n {4}country: 'Fixtureland',\n {4}coords: \[-3\.5, 57\.1\],\n/);
  assert.match(text, / {4}accent: '#6a8a7a',\n {2}\},\n$/);
  assert.ok(/id:\s*'([^']+)',[^}]*?coords:/.test(text));
});

test('emitRegionObject refuses an object that would break the processors\' regex or lacks a field', async () => {
  const p = await pkg('ship-region');
  assert.throws(() => emitRegionObject({ ...p.region, name: 'Bad } name' }), /regex/);
  assert.throws(() => emitRegionObject({ ...p.region, id: 'Bad Id' }), /lowercase hyphenated/);
  const { coords, ...noCoords } = p.region;
  void coords;
  assert.throws(() => emitRegionObject(noCoords), /coords is required/);
});

test('emitValuesBlock: house format cells, v2 fields, nested trajectory, null cell with nullReason; quotes a hyphenated id', async () => {
  const p = await pkg('gap-region');
  const cells = { ...p.cells };
  cells.climate = { ...cells.climate, sourceId: 'worldclim-cmip6', method: 'footprint-zonal', footprint: 'gap-region', retrieved: '2026-10-05', trajectory: { status: 'projected', direction: 'rising', delta: 2.1, unit: '°C', basis: 'ensemble minus baseline', source: 'WorldClim', sourceUrl: 'https://example.org/w', sourceId: 'worldclim-hist', vintage: '2041–2060 vs 1970–2000' }, audit: "old -> new, it's checked" };
  const text = emitValuesBlock('gap-region', cells);
  assert.ok(text.startsWith("  'gap-region': {\n    climate: {\n      value: 11.2, unit: '°C', vintage: '2041–2060, SSP2-4.5', label: 'Cool temperate',\n"));
  assert.ok(text.includes("      sourceId: 'worldclim-cmip6',\n      method: 'footprint-zonal',\n"));
  assert.ok(text.includes("      trajectory: {\n        status: 'projected',\n        direction: 'rising',\n        delta: 2.1,\n"));
  assert.ok(text.includes("audit: 'old -> new, it\\'s checked',"));
  assert.ok(text.includes("    solar_pv: {\n      value: null, unit: 'kWh/kWp/yr',\n      nullReason: 'The Global Solar Atlas API could not be reached"));
  // it is valid JS as a module body
  const mod = `export const values = {\n${text}};\n`;
  const f = path.join(tmp(), 'v.mjs');
  fs.writeFileSync(f, mod);
  return import(`file://${f}`).then((m) => {
    assert.equal(m.values['gap-region'].climate.trajectory.delta, 2.1);
    assert.equal(m.values['gap-region'].solar_pv.value, null);
  });
});

test('emitValuesBlock refuses an unregistered cell key', () => {
  assert.throws(() => emitValuesBlock('x', { climate: { value: 1, unit: 'u', vintage: 'v', label: 'l', source: 's', sourceUrl: 'https://x.org', trend: 'up' } }), /not a registered cell field/);
});

test('jsString and jsLiteral escape quotes, backslashes, newlines and the line separators', () => {
  assert.equal(jsString("it's"), "'it\\'s'");
  assert.equal(jsString('a\\b'), "'a\\\\b'");
  assert.equal(jsString('x\u2028y'), "'x\\u2028y'");
  assert.equal(jsLiteral({ a: [1, 'b'], 'c-d': null }, { indent: '' }), "{\n  a: [1, 'b'],\n  'c-d': null,\n}");
  assert.throws(() => jsLiteral(Number.NaN), /non-finite/);
});

test('insertRegionIntoRegionsJs: continent-aware, regions[] and values together, output loads and the Python regex counts it', async () => {
  const root = copyFixtureRoot();
  const f = path.join(root, 'data/regions.js');
  const src = read(f);
  const p = await pkg('ship-region'); // europe
  const next = insertRegionIntoRegionsJs(src, p.region, p.cells);
  write(f, next);
  const m = await import(`file://${f}?t=${Math.random()}`);
  assert.deepEqual(m.regions.map((r) => r.id), ['alpha', 'beta-land', 'ship-region', 'gamma'], 'a Europe region goes after the last Europe region, before North America');
  assert.deepEqual(Object.keys(m.values), ['alpha', 'beta-land', 'ship-region', 'gamma']);
  assert.equal(m.values['ship-region'].climate.value, 11.2);
  assert.ok(next.includes('// ===================== North America ====================='), 'section comments survive');
  if (PY) assert.deepEqual(pythonIds(f), ['alpha', 'beta-land', 'ship-region', 'gamma']);
  // north american package goes at the end
  const g = await pkg('gap-region');
  const next2 = insertRegionIntoRegionsJs(next, g.region, g.cells);
  write(f, next2);
  const m2 = await import(`file://${f}?t=${Math.random()}`);
  assert.deepEqual(m2.regions.map((r) => r.id), ['alpha', 'beta-land', 'ship-region', 'gamma', 'gap-region']);
  // idempotent
  assert.equal(insertRegionIntoRegionsJs(next2, g.region, g.cells), next2);
  assert.equal(insertRegionIntoRegionsJs(next2, p.region, p.cells), next2);
});

test('insertKeyedEntry adds a land standing / region depth entry once, in the file style', async () => {
  const root = copyFixtureRoot();
  const f = path.join(root, 'data/land-standing.js');
  const p = await pkg('ship-region');
  const next = insertKeyedEntry(read(f), 'landStanding', p.id, p.standing);
  assert.ok(next.includes('  "ship-region": {\n    territory: "The people of ship-region",'));
  write(f, next);
  const m = await import(`file://${f}?t=${Math.random()}`);
  assert.equal(m.landStanding['ship-region'].obligation, 'Listen first');
  assert.equal(Object.keys(m.landStanding).length, 4);
  assert.equal(insertKeyedEntry(next, 'landStanding', p.id, p.standing), next);
  assert.ok(emitKeyedEntry('x', { asks: 'a' }).startsWith('  x: {\n'));
});

test('CLI: --print and --into (dry run writes nothing; a second --into is a no-op; invalid or skipped packages are refused)', () => {
  const root = copyFixtureRoot();
  const f = path.join(root, 'data/regions.js');
  const before = read(f);
  const pr = cli('emit_region_js.mjs', ['--package', path.join(PK, 'ship-region'), '--print', 'regions', '--root', root]);
  assert.equal(pr.code, 0, pr.err);
  assert.match(pr.out, /id: 'ship-region',/);
  const dry = cli('emit_region_js.mjs', ['--package', path.join(PK, 'ship-region'), '--into', 'regions', '--root', root, '--dry-run']);
  assert.match(dry.out, /would be added/);
  assert.equal(read(f), before);
  const a = cli('emit_region_js.mjs', ['--package', path.join(PK, 'ship-region'), '--into', 'regions', '--root', root]);
  assert.equal(a.code, 0, a.err);
  assert.notEqual(read(f), before);
  const once = read(f);
  const b = cli('emit_region_js.mjs', ['--package', path.join(PK, 'ship-region'), '--into', 'regions', '--root', root]);
  assert.match(b.out, /already present/);
  assert.equal(read(f), once);
  assert.equal(cli('emit_region_js.mjs', ['--package', path.join(PK, 'bad-region'), '--into', 'regions', '--root', root]).code, 3);
  assert.equal(cli('emit_region_js.mjs', ['--package', path.join(PK, 'dropped-region'), '--print', 'regions', '--root', root]).code, 3);
  const st = cli('emit_region_js.mjs', ['--package', path.join(PK, 'ship-region'), '--into', 'standing', '--root', root]);
  assert.equal(st.code, 0, st.err);
});
