// lib/century.js (MC-HERO): the Century Line is pure, computed from criteria[].window, and honest about a missing window.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { centuryModel, centuryHtml, closingSentence, countWord, DEFAULT_NOW, HORIZON_YEARS } from '../../lib/century.js';
import { criteria } from '../../data/regions.js';
import { countWord as factsCountWord, buildDate } from '../../data/site-facts.js';

const SRC = readFileSync(new URL('../../lib/century.js', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');

// A fixture that does not depend on the real data: eight criteria, two projections, one single-year observation, one with no window.
const fx = [
  { id: 'a', name: 'Alpha', ramp: ['#d6e8f0', '#e8c98a', '#c97a3a', '#8a3a2a'], window: { from: 2041, to: 2060, kind: 'projection', label: '2041\u20132060' } },
  { id: 'b', name: 'Beta', ramp: ['#e6e4d8', '#9ab88a', '#3a6a4a'], window: { from: 2050, to: 2050, kind: 'projection', label: '2050' } },
  { id: 'c', name: 'Gamma', ramp: ['#eee', '#aaa'], window: { from: 2020, to: 2020, kind: 'observed', label: '2020' } },
  { id: 'd', name: 'Delta <b>', ramp: ['#d6e8f0', '#8a3a2a'], window: { from: 2001, to: 2023, kind: 'observed', label: '2001\u20132023' } },
  { id: 'e', name: 'Epsilon', ramp: ['#d6e8f0', '#8a3a2a'], window: { from: 1960, to: 2020, kind: 'observed', label: '1960\u20132020 (some undated)' } },
  { id: 'f', name: 'Zeta', ramp: ['#d6e8f0', '#8a3a2a'] },                                   // no window
  { id: 'g', name: 'Eta', ramp: ['#d6e8f0', '#8a3a2a'], window: { from: 2030, to: 2010, kind: 'observed', label: 'backwards' } },  // invalid: to < from
  { id: 'h', name: 'Theta', ramp: ['#d6e8f0', '#8a3a2a'], window: { from: 2019, to: 2024, kind: 'observed', label: '2019\u20132024' } },
];

test('exports the contract: centuryModel, centuryHtml, closingSentence, countWord', () => {
  for (const f of [centuryModel, centuryHtml, closingSentence, countWord]) assert.equal(typeof f, 'function');
  assert.equal(HORIZON_YEARS, 100);
});

test('pure: no Date, no Math.random, no DOM, no timers, no imports (comments excluded)', () => {
  assert.ok(!/\bDate\b/.test(CODE), 'Date');
  assert.ok(!/Math\.random/.test(CODE), 'Math.random');
  assert.ok(!/(^|[^.\w])(window|document|localStorage|fetch|setTimeout|requestAnimationFrame|process)\s*[.(\[]/.test(CODE), 'host globals');
  assert.ok(!/^\s*import\s/m.test(CODE), 'no imports');
});

test('one row per criterion, in declared order (no order of merit)', () => {
  const m = centuryModel(fx);
  assert.equal(m.rows.length, fx.length);
  assert.deepEqual(m.rows.map((r) => r.id), fx.map((c) => c.id));
  const html = centuryHtml(m);
  assert.equal((html.match(/class="cl-row(?: cl-nowin)?"/g) || []).length, fx.length, 'one .cl-row per criterion in the markup');
  const names = [...html.matchAll(/class="cl-name">([^<]*)(?:<small|<\/div>)/g)].map((x) => x[1]).filter(Boolean);
  assert.equal(names[0], 'Alpha');
});

test('a criterion without a (valid) window draws the hatched "window not stated" row with no bar', () => {
  const m = centuryModel(fx);
  const zeta = m.rows.find((r) => r.id === 'f'), eta = m.rows.find((r) => r.id === 'g');
  for (const r of [zeta, eta]) { assert.equal(r.stated, false); assert.equal(r.width, 0); assert.equal(r.from, null); }
  const html = centuryHtml(m);
  assert.equal((html.match(/cl-nowin/g) || []).length, 2);
  assert.equal((html.match(/window not stated/g) || []).length, 4, 'two row labels and two aria-label entries');
  const row = /<div class="cl-row cl-nowin">.*?<\/div><\/div>/.exec(html)[0];
  assert.ok(!/cl-seg/.test(row), 'a not-stated row has no bar');
  assert.ok(/cl-none/.test(row), 'it carries the hatched strip instead');
  // never guessed: no window anywhere gives all rows "not stated" and a closing sentence that says so
  const none = centuryModel(fx.map((c) => ({ id: c.id, name: c.name })));
  assert.ok(none.rows.every((r) => !r.stated));
  assert.ok(!/cl-seg/.test(centuryHtml(none)));
  assert.match(none.closing, /None of them states a data window yet\./);
});

test('role="img" with an aria-label that lists every criterion and its window in words', () => {
  const m = centuryModel(fx);
  const html = centuryHtml(m);
  assert.match(html, /^<div class="century" role="img" aria-label="/);
  for (const c of fx) assert.ok(m.ariaLabel.includes(c.name), `aria-label names ${c.name}`);
  assert.ok(m.ariaLabel.includes('Alpha 2041 to 2060, projection'));
  assert.ok(m.ariaLabel.includes('Beta 2050, projection'));
  assert.ok(m.ariaLabel.includes('Gamma 2020, observed'));
  assert.ok(m.ariaLabel.includes('Zeta window not stated'));
  assert.ok(m.ariaLabel.includes(`Now is ${m.now}`));
  assert.ok(m.ariaLabel.endsWith(m.closing), 'the closing sentence ends the label');
  assert.ok(!/<|"/.test(html.match(/aria-label="([^"]*)"/)[1].replace(/&lt;|&gt;|&quot;|&amp;/g, '')), 'the label is attribute-safe');
});

test('the same module on the real criteria: one row per criterion, every aria-label name present, every criterion has a window', () => {
  const m = centuryModel(criteria);
  assert.equal(m.rows.length, criteria.length);
  for (const c of criteria) assert.ok(m.ariaLabel.includes(c.name), c.name);
  const missing = criteria.filter((c) => !c.window).map((c) => c.id);
  assert.deepEqual(missing, [], 'EV-INT-REGIONS authors a window for every criterion');
  assert.ok(m.rows.every((r) => r.stated && r.from <= r.to));
  // the axis contains every window, so no bar is clipped
  for (const r of m.rows) { assert.ok(r.left >= 0 && r.left + r.width <= 100.01, `${r.id} inside the axis`); }
});

test('the axis always contains every window and the whole horizon; ticks are every 25 years', () => {
  const m = centuryModel(fx);
  assert.ok(m.axis.from <= 1960 && m.axis.from % 25 === 0);
  assert.ok(m.axis.to >= m.now + HORIZON_YEARS);
  for (const t of m.axis.ticks) { assert.equal(t.year % 25, 0); assert.ok(t.pct >= 2 && t.pct <= 97); }
  assert.ok(m.nowPct > 0 && m.nowPct < 100);
  assert.ok(m.horizon.pct === m.nowPct && Math.abs(m.horizon.pct + m.horizon.width - 100 * (m.horizon.to - m.axis.from) / (m.axis.to - m.axis.from)) < 0.02);
  // default axis with nothing to draw is the spec's 1995 to 2135
  const empty = centuryModel([]);
  assert.equal(empty.axis.from, 1995);
  assert.equal(empty.axis.to, 2135);
});

test('marks: observed is a solid pill in the criterion\'s own mid-stop colour, a projection is hatched, a single year is a dot', () => {
  const m = centuryModel(fx);
  const html = centuryHtml(m);
  const seg = (name) => new RegExp(`${name}<small>[^<]*</small></div><div class="cl-track"><span class="([^"]*)" style="([^"]*)"`).exec(html);
  const alpha = seg('Alpha'), beta = seg('Beta'), gamma = seg('Gamma'), delta = seg('Delta &lt;b&gt;');
  assert.match(alpha[1], /\bproj\b/); assert.ok(alpha[2].includes('--c:#c97a3a'), 'mid-stop of a 4-stop ramp');
  assert.match(beta[1], /\bproj\b/); assert.match(beta[1], /\bpt\b/); assert.ok(!/width:/.test(beta[2]), 'a dot has no width');
  assert.match(gamma[1], /\bpt\b/); assert.ok(!/\bproj\b/.test(gamma[1]));
  assert.ok(!/\bproj\b/.test(delta[1]) && !/\bpt\b/.test(delta[1])); assert.ok(delta[2].includes('--c:#8a3a2a'), 'mid-stop of a 2-stop ramp');
  assert.ok(html.includes('Delta &lt;b&gt;') && !html.includes('Delta <b>'), 'names are escaped');
  assert.ok(html.includes('2050 \u00b7 projection'), 'a projection says so in the row text');
});

test('the closing sentence is computed from the data, never typed', () => {
  const m = centuryModel(fx);
  // fixture: 8 criteria, observed 5 (c d e h + ... g is invalid) -> counts below
  assert.deepEqual(m.counts, { total: 8, observed: 4, projection: 2, unstated: 2 });
  assert.equal(m.furthest.year, 2060);
  assert.match(m.closing, /^Four of eight criteria describe the past or the present\. The furthest any of them looks is 2060, a projection\. Two state no data window yet and are drawn as such\./);
  assert.ok(m.closing.endsWith('The tool reads what it can, and says plainly where it cannot see.'));
  // the real data reproduces the design's sentence shape with the real numbers
  const real = centuryModel(criteria);
  const observed = criteria.filter((c) => c.window && c.window.kind !== 'projection').length;
  assert.ok(real.closing.startsWith(`${countWord(observed).replace(/^./, (x) => x.toUpperCase())} of ${countWord(criteria.length)} criteria describe the past or the present.`), real.closing);
  const maxTo = Math.max(...criteria.map((c) => c.window.to));
  assert.ok(real.closing.includes(`The furthest any of them looks is ${maxTo}, a projection.`), real.closing);
  // a different set of windows changes the sentence
  const other = centuryModel([{ id: 'x', name: 'X', window: { from: 2000, to: 2010, kind: 'observed', label: '2000\u20132010' } }]);
  assert.match(other.closing, /^One of one criteria describes the past or the present\. The furthest any of them reaches is 2010, an observation\./);
});

test('countWord is the same function as data/site-facts.js countWord for 0..99 and beyond', () => {
  for (let n = 0; n <= 99; n++) assert.equal(countWord(n), factsCountWord(n), String(n));
  for (const x of [-1, 100, 1.5, NaN, '3', null]) assert.equal(countWord(x), factsCountWord(x));
});

test('DEFAULT_NOW is the year of the build date (move it at the first rebuild of a new year)', () => {
  assert.equal(String(DEFAULT_NOW), String(buildDate).slice(0, 4));
});

test('opts.now moves the Now line and the horizon', () => {
  const m = centuryModel(fx, { now: 2030 });
  assert.equal(m.now, 2030);
  assert.equal(m.horizon.to, 2130);
  assert.match(centuryHtml(m), /Now \u00b7 2030/);
});

test('a hostile colour or label cannot break out of the markup', () => {
  const m = centuryModel([{ id: 'x', name: '"><script>', ramp: ['red;background:url(x)', 'javascript:alert(1)'], window: { from: 2000, to: 2001, kind: 'observed', label: '<img onerror=x>' } }]);
  const html = centuryHtml(m);
  assert.ok(!/<script|<img/.test(html));
  assert.ok(!/--c:/.test(html), 'a non-hex ramp colour is dropped, not written');
});
