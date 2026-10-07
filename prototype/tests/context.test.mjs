import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, REQUIRE_V2, expectedIds, idsDiff, fixture } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const planned = expectedIds();
const clone = (x) => JSON.parse(JSON.stringify(x));

test('context: every region present; Koppen codes in the 30-class legend, shares sum to 1 (+-0.02), four periods present, Aqueduct classes in the WRI vocabulary', (t) => {
  if (!D.context) { if (REQUIRE_V2) assert.fail('data/context.js missing'); return t.skip('data/context.js not present yet (EV-INT-CONTEXT)'); }
  assert.equal(idsDiff(Object.keys(D.context), planned), '', 'context keys vs planned slate');
  const errs = []; for (const [id, c] of Object.entries(D.context)) errs.push(...S.validateContextEntry(id, c));
  assert.deepEqual(errs, []);
});

test('validator self-test: context fixture passes; each invalid variant fails', () => {
  const ok = fixture('valid/context.json');
  assert.deepEqual(S.validateContextEntry('fx', ok), []);
  const variants = {
    'unknown Koppen code': (c) => { c.koppen.periods['1991–2020'].dominant = 'Xyz'; },
    'shares do not sum to 1': (c) => { c.koppen.periods['1991–2020'].shares = { Cfb: 0.4, Csa: 0.2 }; },
    'missing period': (c) => { delete c.koppen.periods['2071–2099 SSP2-4.5']; },
    'numeric Aqueduct class': (c) => { c.water.baselineStress.class = 3; },
    'invented Aqueduct class': (c) => { c.water.stress2050Bau.class = 'Excellent'; },
    'ratio is a string': (c) => { c.water.baselineStress.ratio = 'low'; },
  };
  for (const [name, mut] of Object.entries(variants)) { const c = clone(ok); mut(c); assert.ok(S.validateContextEntry('fx', c).length > 0, `${name} should fail`); }
  assert.equal(S.KOPPEN_CODES.length, 30);
});
