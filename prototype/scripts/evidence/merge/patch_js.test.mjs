import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {
  copyFixtureRoot, read, readJson, write, cli, scratchUpg, FIX, tmp,
} from './_kit.mjs';
import { applyOne, patchText, patchFile, verifyByImport } from './patch_js.mjs';

const P = (parts, old, nw, extra = {}) => ({ ref: `t/${parts.join('.')}`, file: 'data/regions.js', parts, old, new: nw, confidence: 'high', ...extra });
const REG = () => read(path.join(FIX, 'root/data/regions.js'));

test('patch with the right old value replaces only that value and keeps comments and layout', async () => {
  const src = REG();
  const r = applyOne(src, P(['values', 'alpha', 'climate', 'value'], '19.5', '18.0'));
  assert.equal(r.state, 'applied');
  assert.ok(r.src.includes("value: 18.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Hot, dry', // 2026-07 audit: kept"), 'the trailing comment and the rest of the line survive');
  assert.equal(r.src.length, src.length - 'value: 19.5'.length + 'value: 18.0'.length);
  assert.ok(r.src.startsWith('// Fixture: house format'), 'file header comment survives');
  assert.ok(r.src.includes('// water stress: baseline value, flagged by the audit'), 'comment between cells survives');
});

test('the right old value is matched after normalisation (numbers, typographic quotes, accents, \\\' escapes)', () => {
  const src = REG();
  assert.equal(applyOne(src, P(['values', 'alpha', 'climate', 'value'], '19.50', '18')).state, 'applied');
  assert.equal(applyOne(src, P(['values', 'alpha', 'climate', 'label'], 'Hot,  dry', 'Hot')).state, 'applied');
  const s2 = applyOne(src, P(['regions', '[id=alpha]', 'blurb'], 'It\\\'s hot in summer.', 'Summers are hot.'));
  assert.equal(s2.state, 'applied');
  assert.equal(s2.detail, 'substring');
  assert.ok(s2.src.includes("blurb: 'Dry plain with cork-oak woodland. Summers are hot.',"), 'the substring was replaced inside the original quote style');
  const s3 = applyOne(src, P(['values', 'alpha', 'climate', 'label'], 'Hôt, dry', 'Hot'));
  assert.equal(s3.state, 'applied', 'accent folding on the old-value assertion');
});

test('a wrong old value is reported stale and nothing is written', async () => {
  const dir = copyFixtureRoot();
  const f = path.join(dir, 'data/regions.js');
  const before = read(f);
  const out = await patchFile(f, [P(['values', 'alpha', 'climate', 'value'], '99', '18.0')]);
  assert.equal(out.results[0].state, 'stale');
  assert.match(out.results[0].detail, /19\.5/);
  assert.equal(out.write, 'unchanged');
  assert.equal(read(f), before);
});

test('a hyphenated id in quotes is located, and its neighbours are untouched', async () => {
  const src = REG();
  const r = applyOne(src, P(['values', 'beta-land', 'water_stress', 'label'], 'Low', 'Low (area-weighted)'));
  assert.equal(r.state, 'applied');
  const out = await patchText(src, [P(['values', 'beta-land', 'water_stress', 'label'], 'Low', 'Low (area-weighted)')], { fromDir: tmp() });
  assert.ok(out.text.includes("label: 'Low (area-weighted)'"));
  assert.ok(out.text.includes("label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' }, // one-line cell"), 'the gamma cell with the same label is untouched');
  assert.ok(out.text.includes('// Sources: data/research-dossier/beta-land/{climate,water}.md'));
});

test('a second run is a no-op (idempotent) and the file is byte-identical', async () => {
  const dir = copyFixtureRoot();
  const f = path.join(dir, 'data/regions.js');
  const patches = [P(['values', 'alpha', 'climate', 'value'], '19.5', '18.0'), P(['values', 'beta-land', 'water_stress', 'label'], 'Low', 'Low (area-weighted)')];
  const a = await patchFile(f, patches);
  assert.deepEqual(a.results.map((x) => x.state), ['applied', 'applied']);
  assert.equal(a.write, 'written');
  const once = read(f);
  const b = await patchFile(f, patches);
  assert.deepEqual(b.results.map((x) => x.state), ['noop', 'noop']);
  assert.equal(b.write, 'unchanged');
  assert.equal(read(f), once);
});

test('numbers: a numeric target needs a numeric new value, strings keep their quote style', () => {
  const src = REG();
  assert.equal(applyOne(src, P(['values', 'alpha', 'climate', 'value'], '19.5', 'warm')).state, 'unsupported');
  const r = applyOne(src, P(['values', 'alpha', 'climate', 'label'], 'Hot, dry', "Hot and dry (2041–2060 ensemble) isn't final"));
  assert.ok(r.src.includes("label: 'Hot and dry (2041–2060 ensemble) isn\\'t final'"));
});

test('JSON files: string, nested and array-of-strings values; the independent import check agrees', async () => {
  const dir = copyFixtureRoot();
  const f = path.join(dir, 'data/processed/legal-ownership.json');
  const p = (parts, old, nw) => ({ ref: parts.join('.'), file: 'data/processed/legal-ownership.json', parts: ['$', ...parts], old, new: nw, confidence: 'medium' });
  const out = await patchFile(f, [
    p(['[region_id=alpha]', 'foreign_ownership', 'notes'], 'Portugal allows foreign ownership of rural land with no nationality restriction.', 'Portugal places no nationality restriction on buying rural land.'),
    p(['[region_id=beta-land]', 'preemption_or_first_claim_holders'], '["co-owners", "lessees"]', '["co-owners","lessees","neighbouring owners"]'),
    p(['[region_id=alpha]', 'preemption_or_first_claim_holders'], '[]', '["tenant farmers"]'),
  ]);
  assert.deepEqual(out.results.map((x) => x.state), ['applied', 'applied', 'applied']);
  const j = readJson(f);
  assert.equal(j[0].foreign_ownership.notes, 'Portugal places no nationality restriction on buying rural land.');
  assert.deepEqual(j[1].preemption_or_first_claim_holders, ['co-owners', 'lessees', 'neighbouring owners']);
  assert.deepEqual(j[0].preemption_or_first_claim_holders, ['tenant farmers']);
  assert.ok(read(f).includes('"preemption_or_first_claim_holders": ["co-owners", "lessees", "neighbouring owners"],'), 'array written inline in the file style');
});

test('unresolved paths are reported and never create fields', async () => {
  const src = REG();
  const r = applyOne(src, P(['values', 'alpha', 'soil_carbon', 'value'], '20', '25'));
  assert.equal(r.state, 'unresolved');
  assert.equal(r.src, src);
});

test('verifyByImport rejects a text that differs from the independently patched object model', async () => {
  const src = REG();
  const good = applyOne(src, P(['values', 'alpha', 'climate', 'value'], '19.5', '18.0'));
  await verifyByImport(src, good.src, [{ patch: P(['values', 'alpha', 'climate', 'value'], '19.5', '18.0'), op: good.op }], { json: false, fromDir: tmp() });
  const tampered = good.src.replace('vintage: \'2041–2060 SSP2-4.5\', label: \'Hot, dry\'', 'vintage: \'tampered\', label: \'Hot, dry\'');
  await assert.rejects(verifyByImport(src, tampered, [{ patch: P(['values', 'alpha', 'climate', 'value'], '19.5', '18.0'), op: good.op }], { json: false, fromDir: tmp() }), /differs from the independently patched/);
});

test('CLI over converter output: --dry-run writes nothing, a real run applies, a second run is a no-op, dispositions are recorded', () => {
  const { upg, out, rev } = scratchUpg();
  const root = copyFixtureRoot();
  const flags = ['--root', root, '--out', out, '--reverify', rev, '--upg', upg];
  const c = cli('reverify_to_patches.mjs', flags);
  assert.equal(c.code, 0, c.err);
  const before = read(path.join(root, 'data/regions.js'));
  const dry = cli('patch_js.mjs', [...flags, '--dry-run', '--min-confidence', 'medium']);
  assert.equal(dry.code, 0, dry.err);
  assert.match(dry.out, /dry run: nothing written/);
  assert.equal(read(path.join(root, 'data/regions.js')), before);
  assert.ok(!fs.existsSync(path.join(out, 'disposition-EV-INT-REGIONS.json')), 'a dry run records nothing');
  const real = cli('patch_js.mjs', flags);
  assert.equal(real.code, 0, real.err);
  assert.notEqual(read(path.join(root, 'data/regions.js')), before);
  const second = cli('patch_js.mjs', flags);
  assert.match(second.out, /patch_js total: applied 0 \|/, second.out);
  assert.equal(read(path.join(root, 'data/regions.js')).includes('18.0, unit'), true);
  const disp = readJson(path.join(out, 'disposition-EV-INT-REGIONS.json'));
  const row = disp.rows.find((r) => r.ref === 'alpha/high/0');
  assert.equal(row.state, 'applied');
  // the source-docs file of the fixture root never changes
  assert.equal(read(path.join(root, 'source-docs/Overview.md')), read(path.join(FIX, 'root/source-docs/Overview.md')));
});

test('CLI: a numeric value item whose cell has a pipeline value is superseded-by-pipeline, not applied', () => {
  const { upg, out, rev } = scratchUpg();
  const root = copyFixtureRoot();
  const flags = ['--root', root, '--out', out, '--reverify', rev, '--upg', upg];
  assert.equal(cli('reverify_to_patches.mjs', flags).code, 0);
  write(path.join(out, 'alpha/cells.json'), { regionId: 'alpha', cells: { climate: { value: 18.3 }, water_stress: { value: null } } });
  const r = cli('patch_js.mjs', [...flags, '--pipeline-dir', out]);
  assert.equal(r.code, 0, r.err);
  const regions = read(path.join(root, 'data/regions.js'));
  assert.ok(regions.includes('value: 19.5,'), 'climate value left for the pipeline');
  assert.ok(regions.includes('value: 1.5,'), 'water stress has no pipeline value (null), so the reverify value is applied');
  const disp = readJson(path.join(out, 'disposition-EV-INT-REGIONS.json'));
  assert.equal(disp.rows.find((x) => x.ref === 'alpha/high/0').state, 'superseded-by-pipeline');
  assert.match(disp.rows.find((x) => x.ref === 'alpha/high/0').detail, /pipeline 18\.3/);
});
