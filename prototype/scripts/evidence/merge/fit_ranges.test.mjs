import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { copyFixtureRoot, read, write, cli } from './_kit.mjs';
import { fitRange, niceCeil, niceFloor, legacyStep } from './fit_ranges.mjs';

const imp = (f) => import(`${pathToFileURL(f).href}?t=${Math.random()}`);

test('nice rounding goes outward to two significant digits', () => {
  assert.equal(niceCeil(335.5), 340);
  assert.equal(niceCeil(1.727), 1.8);
  assert.equal(niceCeil(2106), 2200);
  assert.equal(niceFloor(-11.15), -12);
  assert.equal(niceFloor(0.0), 0);
  assert.equal(niceCeil(0.93), 0.93);
  assert.equal(legacyStep(0, 1), 0.01);
  assert.equal(legacyStep(0, 5), 0.1);
  assert.equal(legacyStep(0, 25), 1);
  assert.equal(legacyStep(0, 150), 10);
});

test('fitRange: contain mode never narrows and only widens the side that fails; exact mode may narrow; floorMax is honoured', () => {
  const inside = fitRange({ min: 8, max: 19.5, rangeMin: 0, rangeMax: 25 });
  assert.deepEqual(inside, { rangeMin: 0, rangeMax: 25 });
  const over = fitRange({ min: 0.015, max: 1.57, rangeMin: 0, rangeMax: 1 });
  assert.equal(over.rangeMin, 0);
  assert.ok(over.rangeMax >= 1.57 && over.rangeMax <= 2, `rangeMax ${over.rangeMax}`);
  const soil = fitRange({ min: 7, max: 305, rangeMin: 0, rangeMax: 150 });
  assert.ok(soil.rangeMax >= 305 * 1.0 && soil.rangeMax <= 340);
  const exact = fitRange({ min: 8, max: 19.5, rangeMin: 0, rangeMax: 25 }, { exact: true });
  assert.ok(exact.rangeMax < 25 && exact.rangeMax >= 19.5 + 0.1 * 11.5 - 0.1);
  assert.equal(fitRange({ min: 0, max: 1.4, rangeMin: 0, rangeMax: 1 }, { floorMax: 2 }).rangeMax, 2);
  const negative = fitRange({ min: -14, max: 1.5, rangeMin: -10, rangeMax: 5 });
  assert.ok(negative.rangeMin <= -14 && negative.rangeMax === 5);
});

test('a value is never clamped: ranges are widened to contain every value, and an explicit step keeps the old slider step', async () => {
  const root = copyFixtureRoot();
  const f = path.join(root, 'data/regions.js');
  // push a water stress value above the range and a climate value above 25
  write(f, read(f).replace("value: 0.7, unit: 'score'", "value: 1.57, unit: 'score'").replace('value: 19.5,', 'value: 26.3,'));
  const r = cli('fit_ranges.mjs', ['--root', root, '--min-max', 'water_stress=2']);
  assert.equal(r.code, 0, r.err);
  const m = await imp(f);
  const ws = m.criteria.find((c) => c.id === 'water_stress');
  const cl = m.criteria.find((c) => c.id === 'climate');
  assert.equal(ws.rangeMax, 2);
  assert.equal(ws.step, 0.01, 'old effective step (span 1 = 0.01) is written explicitly because span 2 would imply 0.1');
  assert.ok(cl.rangeMax >= 26.3);
  assert.equal(cl.step, undefined, 'span 25 -> 29 keeps the legacy step 1: no step written');
  for (const id of Object.keys(m.values)) for (const c of m.criteria) { const v = m.values[id][c.id].value; assert.ok(v >= c.rangeMin && v <= c.rangeMax, `${id} ${c.id} ${v} inside ${c.rangeMin}..${c.rangeMax}`); }
  // comments and layout around the edit survive; the step sits on its own line after rangeMax
  const text = read(f);
  assert.match(text, /rangeMax: 2,\n {4}step: 0\.01,\n {4}rangeLabel: 'score',/);
  assert.ok(text.includes('// Fixture: house format of data/regions.js'));
});

test('idempotent: a second run leaves the file byte-identical; --dry-run writes nothing', () => {
  const root = copyFixtureRoot();
  const f = path.join(root, 'data/regions.js');
  write(f, read(f).replace("value: 0.7, unit: 'score'", "value: 1.57, unit: 'score'"));
  const before = read(f);
  const dry = cli('fit_ranges.mjs', ['--root', root, '--dry-run']);
  assert.match(dry.out, /dry run, nothing written/);
  assert.equal(read(f), before);
  assert.equal(cli('fit_ranges.mjs', ['--root', root]).code, 0);
  const once = read(f);
  assert.notEqual(once, before);
  const again = cli('fit_ranges.mjs', ['--root', root]);
  assert.match(again.out, /ranges already fit: unchanged/);
  assert.equal(read(f), once);
});
