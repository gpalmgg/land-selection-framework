import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import {
  copyFixtureRoot, readJson, cli, scratchUpg, REAL_REVERIFY, PROTO, tmp, copyTree, read,
} from './_kit.mjs';
import { convert, normalise, tokenisePath } from './reverify_to_patches.mjs';
import { buildIndex } from './common.mjs';

const realOk = fs.existsSync(REAL_REVERIFY) && fs.readdirSync(REAL_REVERIFY).some((f) => f.endsWith('.json'));
const realRoots = () => ({ ROOT: PROTO, REVERIFY: REAL_REVERIFY });

test('tokenisePath reads dotted, quoted-bracket, selector and index paths', () => {
  assert.deepEqual(tokenisePath("values['estonia-rural'].water_stress.label").map((t) => t.key), ['values', 'estonia-rural', 'water_stress', 'label']);
  assert.deepEqual(tokenisePath("regions[id='cascadia'].blurb").map((t) => t.key), ['regions', '[id=cascadia]', 'blurb']);
  assert.deepEqual(tokenisePath("'estonia-rural'.entry").map((t) => t.key), ['estonia-rural', 'entry']);
  assert.deepEqual(tokenisePath('land-standing.estonia-rural.entry').map((t) => t.key), ['land-standing', 'estonia-rural', 'entry']);
  assert.deepEqual(tokenisePath('x.preemption[0]').map((t) => t.key), ['x', 'preemption', '[0]']);
  assert.equal(tokenisePath('values.alpha[unclosed'), null);
});

test('fixture reverify: every shape lands in the right list and nothing is guessed', () => {
  const { rev } = scratchUpg();
  const out = convert({ ROOT: path.join(PROTO, 'tests/fixtures/merge/root'), REVERIFY: rev });
  const refs = (a) => a.map((x) => x.ref).sort();
  // held: the two items whose own reason asks for human review, never in patches
  assert.deepEqual(refs(out.held), ['alpha/medium/13', 'alpha/medium/14']);
  assert.ok(out.held.every((h) => h.state === 'held-human-review' && typeof h.proposed === 'string' && h.proposed.length > 5));
  assert.ok(!out.patches.some((p) => out.held.some((h) => h.ref === p.ref)));
  // low confidence parked, deeper handed over, dossier recorded only
  assert.deepEqual(refs(out.deferredLow), ['alpha/low/4', 'beta-land/low/2']);
  assert.deepEqual(refs(out.deeper), ['alpha/medium/10']);
  assert.ok(![...out.patches, ...out.needsHand].some((p) => p.ref === 'alpha/medium/11'), 'dossier markdown is recorded only');
  // multi-field path and a secondary-target note go to needs-hand with a reason
  const nh = Object.fromEntries(out.needsHand.map((n) => [`${n.ref}${n.secondary ? '#2' : ''}`, n.why]));
  assert.match(nh['alpha/medium/12'], /several fields/);
  assert.match(nh['alpha/medium/16#2'], /region-depth\.js/);
  // mechanical normalisation
  const byRef = Object.fromEntries(out.patches.map((p) => [p.ref, p]));
  assert.deepEqual(byRef['alpha/high/0'].parts, ['values', 'alpha', 'climate', 'value']);
  assert.equal(byRef['alpha/high/0'].numeric, true);
  assert.deepEqual(byRef['alpha/high/0'].supersede, { region: 'alpha', criterion: 'climate' });
  assert.deepEqual(byRef['alpha/medium/5'].parts, ['regions', '[id=alpha]', 'blurb']);
  assert.deepEqual(byRef['alpha/high/6'].parts, ['landStanding', 'alpha', 'tenure']);
  assert.deepEqual(byRef['alpha/medium/7'].parts, ['regionDepth', 'alpha', 'asks']);
  assert.deepEqual(byRef['beta-land/high/0'].parts, ['values', 'beta-land', 'climate', 'value']);
  // v1 lookup items are retargeted to the processed JSON
  assert.equal(byRef['alpha/medium/8'].file, 'data/processed/legal-ownership.json');
  assert.deepEqual(byRef['alpha/medium/8'].parts, ['$', '[region_id=alpha]', 'foreign_ownership', 'notes']);
  assert.equal(byRef['alpha/medium/8'].retargetedFrom, 'data/v1-lookup.js');
  assert.deepEqual(byRef['alpha/high/9'].parts, ['$', '[region_id=beta-land]', 'preemption_or_first_claim_holders']);
  assert.equal(byRef['alpha/medium/15'].file, 'data/processed/land-cost.json');
  assert.ok(Object.values(byRef).every((p) => p.confidence === 'high' || p.confidence === 'medium'));
});

test('hold rule is mechanical: any reason that asks for human review is held, whichever file or confidence', () => {
  const ctx = { ids: new Set(['alpha']), fieldIndex: {}, region: 'alpha' };
  assert.equal(normalise({ file: 'prototype/data/land-standing.js', path: 'landStanding.alpha.tenure' }, ctx).ok, true);
  const { rev } = scratchUpg();
  const f = path.join(rev, 'beta-land.json');
  const j = readJson(f);
  j.corrections.push({ file: 'prototype/data/regions.js', path: 'values.beta-land.climate.label', old: 'Mild oceanic', new: 'Mild', evidence_url: 'https://x.org', reason: 'Wording is sensitive. Human review required.', confidence: 'high' });
  j.corrections.push({ file: 'prototype/data/regions.js', path: 'values.beta-land.climate.source', old: 'a', new: 'b', evidence_url: 'https://x.org', reason: 'low and needs human review', confidence: 'low' });
  fs.writeFileSync(f, JSON.stringify(j));
  const out = convert({ ROOT: path.join(PROTO, 'tests/fixtures/merge/root'), REVERIFY: rev });
  assert.ok(out.held.some((h) => h.ref === 'beta-land/high/3'));
  assert.ok(out.held.some((h) => h.ref === 'beta-land/low/4'));
  assert.ok(!out.patches.some((p) => p.ref === 'beta-land/high/3'));
  assert.ok(!out.deferredLow.some((p) => p.ref === 'beta-land/low/4'));
});

test('index: one row per item, owners by target file and keyword, class by the claim rule', () => {
  const { rev } = scratchUpg();
  const idx = buildIndex(rev);
  const items = (a) => a.length;
  const files = fs.readdirSync(rev).map((f) => readJson(path.join(rev, f)));
  assert.equal(idx.length, files.reduce((n, j) => n + items(j.corrections) + items(j.newer_vintages) + items(j.unverifiable), 0));
  assert.equal(new Set(idx.map((r) => r.ref)).size, idx.length, 'refs are unique');
  const by = Object.fromEntries(idx.map((r) => [r.ref, r]));
  assert.equal(by['alpha/high/0'].owner, 'EV-INT-REGIONS');
  assert.equal(by['alpha/high/6'].owner, 'EV-INT-STANDING');
  assert.equal(by['alpha/medium/7'].owner, 'EV-INT-DEPTH');
  assert.equal(by['alpha/medium/8'].owner, 'EV-INT-LAYERS');
  assert.equal(by['alpha/medium/10'].owner, 'DOC-6');
  assert.equal(by['alpha/medium/11'].owner, 'recorded-only');
  assert.equal(by['alpha/newer_vintage/0'].owner, 'EV-INT-REGIONS');
  assert.equal(by['alpha/unverifiable/0'].owner, 'EV-INT-STANDING');
  assert.equal(by['alpha/unverifiable/0'].class, 'claim');
  assert.equal(by['alpha/unverifiable/1'].owner, 'EV-INT-DEPTH');
  assert.equal(by['alpha/unverifiable/2'].owner, 'EV-INT-REGIONS');
  assert.equal(by['alpha/unverifiable/2'].class, 'other');
  assert.equal(by['alpha/unverifiable/3'].owner, 'EV-INT-LAYERS');
  assert.equal(by['beta-land/unverifiable/1'].class, 'other');
});

test('CLI writes the five lists and the index, and a second run changes nothing (idempotent)', () => {
  const { upg, out, rev } = scratchUpg();
  const flags = ['--root', path.join(PROTO, 'tests/fixtures/merge/root'), '--out', out, '--reverify', rev, '--upg', upg];
  const a = cli('reverify_to_patches.mjs', flags);
  assert.equal(a.code, 0, a.err);
  for (const f of ['patches.json', 'needs-hand.json', 'deferred-low.json', 'deeper-change-list.json', 'held-by-converter.json', 'reverify-index.json', 'unverifiable.json']) assert.ok(fs.existsSync(path.join(out, f)), f);
  assert.match(a.out, /patches\.json: written/);
  const b = cli('reverify_to_patches.mjs', flags);
  assert.match(b.out, /patches\.json: unchanged/);
  assert.match(b.out, /reverify-index\.json: unchanged/);
  const dry = tmp();
  const c = cli('reverify_to_patches.mjs', ['--dry-run', ...flags.map((x, i) => (flags[i - 1] === '--out' ? dry : x))]);
  assert.match(c.out, /patches\.json: dry-run/);
  assert.deepEqual(fs.readdirSync(dry), [], '--dry-run writes nothing');
  const held = readJson(path.join(out, 'held-by-converter.json'));
  assert.equal(held.length, 2);
  assert.ok(!read(path.join(out, 'patches.json')).includes('landStanding.beta-land.territory'), 'a held path never appears in patches.json');
  const unv = readJson(path.join(out, 'unverifiable.json'));
  assert.ok(unv.length > 0 && unv.every((r) => r.kind === 'unverifiable'));
});

test('--summary and --index modes print counts and write only what they name', () => {
  const { upg, out, rev } = scratchUpg();
  const flags = ['--root', path.join(PROTO, 'tests/fixtures/merge/root'), '--out', out, '--reverify', rev, '--upg', upg];
  const s = cli('reverify_to_patches.mjs', ['--summary', ...flags]);
  assert.equal(s.code, 0);
  assert.match(s.out, /corrections \d+ = \d+ high \+ \d+ medium \+ \d+ low/);
  assert.deepEqual(fs.readdirSync(out), []);
  const i = cli('reverify_to_patches.mjs', ['--index', ...flags]);
  assert.equal(i.code, 0);
  assert.deepEqual(fs.readdirSync(out).sort(), ['reverify-index.json', 'unverifiable.json']);
});

// ---- the real re-verification files ---------------------------------------------------------------------------
test('REAL reverify files: the summary reproduces 362 = 109 + 189 + 64 and the per-target counts', { skip: !realOk && 'upgrade-2026-10/reverify not present' }, () => {
  const out = convert(realRoots());
  const C = out.counts;
  assert.equal(C.total, 362);
  assert.deepEqual([C.high, C.medium, C.low], [109, 189, 64]);
  assert.deepEqual(C.byTarget, { regions: 199, landStanding: 58, regionDepth: 36, layers: 42, deeper: 22, dossier: 5 });
  assert.equal(C.newer, 130);
  assert.equal(C.unverifiable, 143);
  assert.equal(buildIndex(REAL_REVERIFY).length, 362 + 130 + 143);
  const r = cli('reverify_to_patches.mjs', ['--summary']);
  assert.match(r.out, /corrections 362 = 109 high \+ 189 medium \+ 64 low/);
  assert.match(r.out, /regions\.js 199, land-standing\.js 58, region-depth\.js 36, v1\/processed 42, deeper\.html 22, dossier md 5/);
});

test('REAL reverify files: exactly the two Vermont items are held, none is in patches, deferred-low holds all 64 low items', { skip: !realOk && 'upgrade-2026-10/reverify not present' }, () => {
  const out = convert(realRoots());
  assert.deepEqual(out.held.map((h) => `${h.region}:${h.path}`).sort(), ['vermont:vermont.obligation', 'vermont:vermont.territory']);
  assert.ok(out.held.every((h) => h.state === 'held-human-review'));
  assert.ok(!JSON.stringify(out.patches).includes('vermont.territory') && !JSON.stringify(out.patches).includes('vermont.obligation'));
  assert.equal(out.deferredLow.length, 64);
  assert.equal(out.deeper.length, 22, 'deeper.html items (including low ones, flagged) go to the change list');
  assert.ok(out.patches.length / (out.patches.length + out.needsHand.filter((n) => !n.secondary).length) >= 0.9, 'the converter normalises the bulk of the paths mechanically');
  assert.ok(out.needsHand.every((n) => typeof n.why === 'string' && n.why.length > 5), 'every needs-hand row says why');
});

test('REAL data: every high/medium patch for the unmodified files applies (stale 0) in a scratch copy, and a second run changes nothing', { skip: !realOk && 'upgrade-2026-10/reverify not present' }, (t) => {
  const scratch = tmp('lsf-real-');
  // The reverify patches were written against the PRISTINE data files, and the live tree has since merged them (the patches then
  // read as stale). So the scratch copy is the pre-upgrade baseline commit's data folder (git archive of prototype/data at the
  // baseline in plan.json meta.env), never the working tree. Without that commit in the clone there is nothing to apply against.
  const BASELINE = '6bce1a3';
  const archive = spawnSync('git', ['-C', PROTO, 'archive', '--format=tar', BASELINE, '--', 'data'], { maxBuffer: 1 << 30 });
  if (archive.status !== 0) { t.skip(`baseline commit ${BASELINE} not available: ${String(archive.stderr || '').slice(0, 120)}`); return; }
  fs.mkdirSync(path.join(scratch, 'prototype'), { recursive: true });
  const untar = spawnSync('tar', ['-x', '-C', path.join(scratch, 'prototype')], { input: archive.stdout });
  assert.equal(untar.status, 0, String(untar.stderr));
  fs.rmSync(path.join(scratch, 'prototype/data/raw'), { recursive: true, force: true });
  const out = path.join(scratch, 'upgrade-2026-10/evidence-out');
  fs.mkdirSync(out, { recursive: true });
  const flags = ['--root', path.join(scratch, 'prototype'), '--out', out, '--reverify', REAL_REVERIFY, '--upg', path.join(scratch, 'upgrade-2026-10')];
  assert.equal(cli('reverify_to_patches.mjs', flags).code, 0);
  const dry = cli('patch_js.mjs', [...flags, '--dry-run', '--no-pipeline', '--min-confidence', 'medium']);
  assert.equal(dry.code, 0, dry.err);
  assert.match(dry.out, /stale 0 \|/);
  assert.match(dry.out, /unresolved 0 \|/);
  const real = cli('patch_js.mjs', [...flags, '--no-pipeline', '--no-record']);
  assert.equal(real.code, 0, real.err);
  const again = cli('patch_js.mjs', [...flags, '--no-pipeline', '--no-record']);
  assert.match(again.out, /patch_js total: applied 0 \|/);
});
