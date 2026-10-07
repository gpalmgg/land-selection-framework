import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
import { loadAll, REQUIRE_V2, expectedIds, idsDiff, makeAllowed, fixture, ROOT, walk } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const allowed = makeAllowed();
const planned = expectedIds();
const pass = (id, e, o = {}) => S.validateLegalEntry(id, e, { today: '2026-10-05', allowed: () => false, ...o });
const clone = (x) => JSON.parse(JSON.stringify(x));

test('legal pathway: every entry passes the schema (enums, https sources, ordered steps, no numbers/scores, no workaround phrasing)', (t) => {
  if (!D.legalPathway) { if (REQUIRE_V2) assert.fail('data/legal-pathway.js missing'); return t.skip('data/legal-pathway.js not present yet (EV-INT-LEGAL)'); }
  const errs = [];
  for (const [id, e] of Object.entries(D.legalPathway)) errs.push(...S.validateLegalEntry(id, e, { allowed }));
  assert.deepEqual(errs, []);
});

test('legal pathway: covers every region of the planned slate and agrees with legal-ownership.json', (t) => {
  if (!D.legalPathway) { if (REQUIRE_V2) assert.fail('data/legal-pathway.js missing'); return t.skip('data/legal-pathway.js not present yet (EV-INT-LEGAL)'); }
  assert.equal(idsDiff(Object.keys(D.legalPathway), planned), '', 'legalPathway keys vs planned slate');
  const lo = Object.fromEntries(D.layers['legal-ownership'].map((r) => [r.region_id, r]));
  const errs = []; for (const id of planned) errs.push(...S.legalAgreement(id, lo[id], D.legalPathway[id]));
  assert.deepEqual(errs, []);
});

test('legal pathway: the not-legal-advice constant is the exact required sentence', () => {
  assert.equal(S.LEGAL_NOT_ADVICE, 'Orientation from public sources, not legal advice. Check current law with a local professional before acting.');
});

test('validator self-test: the valid legal fixture passes; each invalid variant fails', () => {
  const ok = fixture('valid/legal-pathway.json');
  assert.deepEqual(pass('fx', ok), []);
  const variants = {
    'bad ownership enum': (e) => { e.nonResidentOwnership.status = 'maybe'; },
    'http source': (e) => { e.zoning.sourceUrl = 'http://example.org/x'; },
    'steps out of order': (e) => { e.steps[1].n = 3; },
    'single step, high confidence': (e) => { e.steps.pop(); },
    'numeric field': (e) => { e.confidenceLevel = 3; },
    'score key': (e) => { e.score = 'x'; },
    'banned phrase in a step': (e) => { e.steps[0].what = 'Use a nominee to get around the rule.'; },
    'asOf too old': (e) => { e.asOf = '2024-01-01'; },
    'low confidence without gaps': (e) => { e.confidence = 'low'; e.gaps = []; },
    'unknown status without gaps': (e) => { e.zoning.route = 'unknown'; e.gaps = []; },
    'unregistered field': (e) => { e.opinion = 'fine'; },
    'underscore key': (e) => { e._note = 'scratch'; },
  };
  for (const [name, mut] of Object.entries(variants)) { const e = clone(ok); mut(e); assert.ok(pass('fx', e).length > 0, `${name} should fail`); }
  const named = clone(ok); named.ruledOut.push('Front-owner nominee arrangements are illegal for foreigners in the restricted zone.');
  assert.ok(pass('fx', named).length > 0, 'a ruledOut entry naming a banned phrase fails without an allowlist entry');
  assert.deepEqual(pass('fx', named, { allowed: () => true }), [], '...and passes with a reasoned allowlist entry');
  assert.deepEqual(pass('fx', named, { allowed }), [], '...and passes with the reasoned entry that ships in tests/allowlist.json');
  const instruction = clone(ok); instruction.ruledOut.push('Use a nominee to hold the title.');
  assert.ok(pass('fx', instruction, { allowed }).length > 0, 'the allowlist never admits an instruction');
  const registered = clone(ok); registered.harmNote = 'Arriving here would harm the community already there.'; registered.hostBodyNote = 'The village association decides.';
  assert.deepEqual(pass('fx', registered), [], 'registered optional fields harmNote / hostBodyNote are accepted');
});

test('validator self-test: legal-ownership agreement rules', () => {
  const e = (status, direction) => ({ nonResidentOwnership: { status }, direction });
  assert.deepEqual(S.legalAgreement('x', { foreign_ownership: { allowed: 'yes' }, regulatory_direction: 'tightening' }, e('open', 'tightening')), []);
  assert.ok(S.legalAgreement('x', { foreign_ownership: { allowed: 'no' }, regulatory_direction: 'stable' }, e('open', 'stable')).length);
  assert.ok(S.legalAgreement('x', { foreign_ownership: { allowed: 'restricted' }, regulatory_direction: 'stable' }, e('open', 'stable')).length > 0, 'restricted layer vs open pathway contradicts');
  assert.deepEqual(S.legalAgreement('x', { foreign_ownership: { allowed: 'restricted' }, regulatory_direction: 'volatile' }, e('restricted', 'mixed')), []);
  assert.ok(S.legalAgreement('x', { foreign_ownership: { allowed: 'yes' }, regulatory_direction: 'loosening' }, e('open', 'tightening')).length);
});

test('validate_legal.mjs: passes a fixture with a complete opened-URL ledger, fails when a ledger line is missing (scratch dir under os.tmpdir)', () => {
  const dir = mkdtempSync(path.join(os.tmpdir(), 'lsf-legal-'));
  const ok = fixture('valid/legal-pathway.json');
  writeFileSync(path.join(dir, 'alentejo.json'), JSON.stringify(ok));
  const urls = new Set(); walk(ok, (k, v) => { if (k === 'sourceUrl') urls.add(v); });
  const ledger = [...urls].map((u) => `- ${u} opened 2026-10-04`);
  const run = (notes) => { writeFileSync(path.join(dir, 'alentejo.notes.md'), notes.join('\n')); try { execFileSync('node', [path.join(ROOT, 'scripts/evidence/validate_legal.mjs'), dir, '--ids', 'alentejo'], { stdio: 'pipe', env: { ...process.env, LSF_TODAY: '2026-10-05', NODE_NO_WARNINGS: '1' } }); return 0; } catch (e) { return e.status; } };
  assert.equal(run(ledger), 0, 'complete ledger passes');
  assert.equal(run(ledger.slice(1)), 1, 'a source missing from the ledger fails');
  assert.equal(run(ledger.map((l) => l.replace('2026-10-04', 'yesterday'))), 1, 'a ledger line without a date fails');
});
