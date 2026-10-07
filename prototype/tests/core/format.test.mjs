// lib/format.js: pure helpers moved out of src/main.js, behaviour unchanged. Baseline data (6bce1a3) for the ramps.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criteria } from '../../../upgrade-2026-10/verify/baseline-site/prototype/data/regions.js';
import { fmtVal, normalize, rampColor, textSafeColor } from '../../lib/format.js';

test('fmtVal still rounds: one decimal under 10, none above, integers with locale grouping', () => {
  assert.equal(fmtVal(1600), (1600).toLocaleString());
  assert.equal(fmtVal(0), '0');
  assert.equal(fmtVal(0.35), (0.35).toFixed(1));
  assert.equal(fmtVal(9.96), '10.0');
  assert.equal(fmtVal(12.6), '13');
  assert.equal(fmtVal(-4.25), (-4.25).toFixed(1));
  assert.equal(fmtVal(1234.5), '1235');
  assert.equal(fmtVal('n/a'), 'n/a');
  assert.equal(fmtVal(null), 'null');
  assert.equal(fmtVal(undefined), 'undefined');
});

test('normalize clamps to 0..1 and maps non-numbers to 0', () => {
  assert.equal(normalize(5, 0, 10), 0.5);
  assert.equal(normalize(-5, 0, 10), 0);
  assert.equal(normalize(50, 0, 10), 1);
  assert.equal(normalize('x', 0, 10), 0);
  assert.equal(normalize(null, 0, 10), 0);
  assert.equal(normalize(15, 10, 20), 0.5);
});

test('rampColor picks the nearest stop and never leaves the ramp', () => {
  const ramp = ['#a', '#b', '#c', '#d'];
  assert.equal(rampColor(ramp, 0), '#a');
  assert.equal(rampColor(ramp, 1), '#d');
  assert.equal(rampColor(ramp, 0.5), '#b'); // exactly halfway stays on the lower stop
  for (let t = 0; t <= 1.0001; t += 0.05) assert.ok(ramp.includes(rampColor(ramp, Math.min(1, t))), `t=${t}`);
  assert.equal(rampColor(ramp, 0.2), '#b'); // pos 0.6 -> past halfway of stop 0 -> stop 1
  assert.equal(rampColor(ramp, 0.1), '#a'); // pos 0.3 -> stop 0
});

const lum = (rgb) => {
  const f = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
};
const contrast = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);

test('textSafeColor reaches WCAG AA 4.5:1 on the paper background for every ramp stop', () => {
  const paper = [246, 242, 235];
  for (const c of criteria) for (const hex of c.ramp) {
    const out = textSafeColor(hex);
    const m = out.match(/^rgb\((\d+), (\d+), (\d+)\)$/);
    assert.ok(m, `${c.id} ${hex} -> ${out}`);
    const ratio = contrast(m.slice(1).map(Number), paper);
    assert.ok(ratio >= 4.5 || out === 'rgb(0, 0, 0)', `${c.id} ${hex} -> ${out} ratio ${ratio.toFixed(2)}`);
  }
});

test('textSafeColor leaves dark colours alone, caches, and passes through malformed input', () => {
  assert.equal(textSafeColor('#000000'), 'rgb(0, 0, 0)');
  assert.equal(textSafeColor('#1c4070'), 'rgb(28, 64, 112)');
  assert.equal(textSafeColor('#1c4070'), textSafeColor('#1c4070'));
  assert.equal(textSafeColor('x'), 'x');
  const light = textSafeColor('#f6f2eb');
  assert.notEqual(light, 'rgb(246, 242, 235)', 'a near-paper colour is darkened');
});

test('lib modules touch no page, network or storage global', () => {
  for (const f of ['format.js', 'filters.js', 'url-state.js', 'result.js']) {
    const src = readFileSync(new URL(`../../lib/${f}`, import.meta.url), 'utf8');
    assert.equal(/\b(window|document|localStorage|fetch)\b/.test(src), false, f);
  }
});
