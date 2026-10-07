import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import {
  copyFixtureRoot, read, readJson, cli, write, FIX,
} from './_kit.mjs';

const imp = (f) => import(`${pathToFileURL(f).href}?t=${Math.random()}`);
const snapshot = (root) => {
  const out = {};
  const walk = (d) => { for (const n of fs.readdirSync(d)) { const p = path.join(d, n); if (fs.statSync(p).isDirectory()) walk(p); else out[path.relative(root, p)] = fs.readFileSync(p, 'utf8'); } };
  walk(root);
  return out;
};
const run = (root, id, ...more) => cli('remove_region.mjs', [id, '--root', root, ...more]);

test('removes the region from every entry shape: keyed objects, array elements, GeoJSON features, files', async () => {
  const root = copyFixtureRoot();
  const r = run(root, 'beta-land');
  assert.equal(r.code, 0, r.err);
  const d = (p) => path.join(root, p);
  // array element + keyed values block in regions.js
  const reg = await imp(d('data/regions.js'));
  assert.deepEqual(reg.regions.map((x) => x.id), ['alpha', 'gamma']);
  assert.deepEqual(Object.keys(reg.values), ['alpha', 'gamma']);
  assert.equal(reg.criteria.length, 2);
  // keyed modules (double-quoted JSON-ish, hyphenated key)
  for (const [f, exp] of [['land-standing.js', 'landStanding'], ['region-depth.js', 'regionDepth'], ['reciprocity.js', 'reciprocity'], ['bioregions.js', 'bioregions'], ['legal-pathway.js', 'legalPathway'], ['context.js', 'context']]) {
    const m = await imp(d(`data/${f}`));
    assert.deepEqual(Object.keys(m[exp]), ['alpha', 'gamma'], f);
  }
  // modules with other exports keep them
  assert.equal((await imp(d('data/reciprocity.js'))).protocols.length, 1);
  assert.equal(Object.keys((await imp(d('data/bioregions.js'))).biomeNames).length, 2);
  // json
  assert.deepEqual(Object.keys(readJson(d('data/footprints.json'))), ['alpha', 'gamma']);
  assert.ok(!fs.existsSync(d('data/footprints/beta-land.geojson')));
  assert.deepEqual(readJson(d('data/processed/legal-ownership.json')).map((x) => x.region_id), ['alpha', 'gamma']);
  assert.deepEqual(readJson(d('data/processed/land-cost.json')).map((x) => x.region_id), ['alpha', 'gamma']);
  // geojson features (one-line and indented)
  assert.deepEqual(readJson(d('data/processed/legal-ownership.geojson')).features.map((x) => x.properties.region_id), ['alpha', 'gamma']);
  assert.deepEqual(readJson(d('data/processed/hospital-proximity.geojson')).features.map((x) => x.properties.region_id), ['alpha', 'gamma']);
  // the page goes, source-docs never changes, other pages stay
  assert.ok(!fs.existsSync(d('region/beta-land.html')));
  assert.ok(fs.existsSync(d('region/alpha.html')));
  assert.equal(read(d('source-docs/Overview.md')), read(path.join(FIX, 'root/source-docs/Overview.md')));
  assert.match(r.out, /Regenerate data\/v1-lookup\.js/);
});

test('comments: an attached comment that names the region goes with it, section headers and other comments stay', () => {
  const root = copyFixtureRoot();
  run(root, 'beta-land');
  const reg = read(path.join(root, 'data/regions.js'));
  assert.ok(!reg.includes('research-dossier/beta-land'));
  assert.ok(reg.includes('// ===================== Europe ====================='));
  assert.ok(reg.includes('// ===================== North America ====================='));
  assert.ok(reg.includes('// water stress: baseline value, flagged by the audit'));
  assert.ok(reg.includes('// Fixture: house format of data/regions.js'));
  const ls = read(path.join(root, 'data/land-standing.js'));
  assert.ok(ls.includes('// ===================== North America ====================='));
  assert.ok(!ls.includes('beta-land'));
});

test('first, middle and last entries all leave valid JSON and JS (comma handling)', async () => {
  for (const id of ['alpha', 'beta-land', 'gamma']) {
    const root = copyFixtureRoot();
    const r = run(root, id);
    assert.equal(r.code, 0, `${id}: ${r.err}`);
    for (const f of ['data/footprints.json', 'data/processed/legal-ownership.json', 'data/processed/land-cost.json', 'data/processed/legal-ownership.geojson', 'data/processed/hospital-proximity.geojson']) JSON.parse(read(path.join(root, f)));
    for (const f of ['regions.js', 'land-standing.js', 'reciprocity.js', 'bioregions.js']) await imp(path.join(root, 'data', f));
    const keep = ['alpha', 'beta-land', 'gamma'].filter((x) => x !== id);
    assert.deepEqual((await imp(path.join(root, 'data/regions.js'))).regions.map((x) => x.id), keep);
    assert.deepEqual(readJson(path.join(root, 'data/processed/land-cost.json')).map((x) => x.region_id), keep);
  }
});

test('removing every region in turn leaves empty but valid containers', async () => {
  const root = copyFixtureRoot();
  for (const id of ['alpha', 'beta-land', 'gamma']) assert.equal(run(root, id).code, 0);
  const reg = await imp(path.join(root, 'data/regions.js'));
  assert.deepEqual(reg.regions, []);
  assert.deepEqual(reg.values, {});
  assert.deepEqual(readJson(path.join(root, 'data/processed/legal-ownership.json')), []);
  assert.deepEqual(readJson(path.join(root, 'data/processed/hospital-proximity.geojson')).features, []);
  assert.deepEqual(readJson(path.join(root, 'data/footprints.json')), {});
});

test('--dry-run writes nothing; a second run finds nothing and refuses (exit 2), --allow-absent makes it a quiet no-op', () => {
  const root = copyFixtureRoot();
  const before = snapshot(root);
  const dry = run(root, 'beta-land', '--dry-run');
  assert.equal(dry.code, 0);
  assert.match(dry.out, /would change \(dry run, nothing written\)/);
  assert.deepEqual(snapshot(root), before);
  assert.equal(run(root, 'beta-land').code, 0);
  const after = snapshot(root);
  const again = run(root, 'beta-land');
  assert.equal(again.code, 2);
  assert.match(again.out, /not present/);
  assert.equal(run(root, 'beta-land', '--allow-absent').code, 0);
  assert.deepEqual(snapshot(root), after, 'idempotent: nothing changed');
});

test('an id that is not present is refused; an invalid id is refused; generated and staging modules are never edited', () => {
  const root = copyFixtureRoot();
  write(path.join(root, 'data/v1-lookup.js'), '// AUTO-GENERATED by scripts/gen_region_pages.mjs. Do not edit by hand.\nexport const v1Lookup = { "legal_ownership": { "beta-land": { "region_id": "beta-land" } } };\n');
  write(path.join(root, 'data/region-depth.staging.js'), "export const regionDepthStaging = { 'beta-land': { asks: 'x' } };\n");
  const gen = read(path.join(root, 'data/v1-lookup.js'));
  const stg = read(path.join(root, 'data/region-depth.staging.js'));
  assert.equal(run(root, 'no-such-region').code, 2);
  assert.equal(run(root, 'Bad Id').code, 2);
  assert.equal(run(root, 'beta-land').code, 0);
  assert.equal(read(path.join(root, 'data/v1-lookup.js')), gen);
  assert.equal(read(path.join(root, 'data/region-depth.staging.js')), stg);
});

test('one failing file writes nothing: a broken module aborts before any file is touched', () => {
  const root = copyFixtureRoot();
  // make a keyed module that cannot be re-parsed after the edit (an unbalanced brace elsewhere in the file)
  write(path.join(root, 'data/context.js'), "export const context = { 'beta-land': { koppen: { dominant: 'Cfb' } }, 'alpha': { x: 1 } };\nexport const broken = ;\n");
  const before = snapshot(root);
  const r = run(root, 'beta-land');
  assert.notEqual(r.code, 0);
  assert.deepEqual(snapshot(root), before);
});
