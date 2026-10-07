// lib/linework.js (MC-FACTS): the drawn line language is pure, deterministic ornament with fixed seeds and a size budget.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { hash, rng, network, rings, catchment, colophonArt, RIVER_RULE, REFUSAL, svg, satoriPaths } from '../../lib/linework.js';

const SRC = readFileSync(new URL('../../lib/linework.js', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
const sha = (s) => createHash('sha256').update(s).digest('hex');
const bytes = (s) => Buffer.byteLength(s, 'utf8');

test('exports the contract: hash rng network rings catchment colophonArt RIVER_RULE REFUSAL svg satoriPaths', () => {
  for (const f of [hash, rng, network, rings, catchment, colophonArt, svg, satoriPaths]) assert.equal(typeof f, 'function');
  assert.equal(typeof RIVER_RULE, 'string');
  assert.ok(RIVER_RULE.startsWith('M'));
  assert.deepEqual(Object.keys(REFUSAL).sort(), ['bar', 'gap', 'river', 'viewBox']);
});

test('pure: no Math.random, no Date, no DOM, no timers in the code (comments excluded)', () => {
  assert.ok(!/Math\.random/.test(CODE), 'Math.random');
  assert.ok(!/\bDate\b/.test(CODE), 'Date');
  assert.ok(!/\b(window|document|localStorage|fetch|setTimeout|requestAnimationFrame|process)\b/.test(CODE), 'host globals');
  assert.ok(!/^\s*import\s/m.test(CODE), 'no imports: one self-contained file for browser, Node and edge');
});

test('deterministic: the same seed gives the same bytes, a different seed a different drawing', () => {
  assert.equal(svg(catchment()), svg(catchment()));
  assert.equal(svg(catchment(), { draw: true }), svg(catchment(), { draw: true }));
  assert.equal(svg(colophonArt()), svg(colophonArt()));
  assert.deepEqual(network('catchment', { w: 600, h: 640, tribs: 8 }), network('catchment', { w: 600, h: 640, tribs: 8 }));
  assert.notDeepEqual(network('catchment', { tribs: 4 }), network('colophon', { tribs: 4 }));
  assert.equal(hash('catchment'), hash('catchment'));
  const a = rng(hash('x')), b = rng(hash('x'));
  for (let i = 0; i < 20; i++) { const v = a(); assert.equal(v, b()); assert.ok(v >= 0 && v < 1); }
});

test('pinned: the three fixed-seed drawings are byte-for-byte what MC-FACTS shipped (behaviour unchanged)', () => {
  assert.equal(sha(svg(catchment(), { draw: true })), '7a6447ff68a7f88dd27501b37df598f8ceac1ec9ae8de00526481e504032d6f5');
  assert.equal(sha(svg(catchment())), 'da346f59f87df1940c6f43b349a780b64b1bc0823f60c9614f572fdb02a7c977');
  assert.equal(sha(svg(colophonArt())), 'eebb6ff17b68118c9103473def9f1dfa163c62d58943868e640c15ae6a5f9ba0');
  assert.equal(sha(JSON.stringify(satoriPaths(catchment(), '#123456'))), '9eff47136da7526cff1eace13abaa5846beae091070b043b718be8566da11cfe');
});

test('honesty rule: the drawings take no argument, so nothing can be seeded from a region id', () => {
  assert.equal(catchment.length, 0);
  assert.equal(colophonArt.length, 0);
  assert.ok(!/regionId|region\.id|\bid\b\s*\)/.test(CODE), 'no region id in the generator code');
  // the fixed seeds named by the spec are the only seeds the two drawings use
  assert.match(CODE, /network\('catchment'/);
  assert.match(CODE, /network\('colophon'/);
});

test('the Catchment: 26 paths (8 rings, 1 divide, stem + 8 tributaries + 8 twigs)', () => {
  const art = catchment();
  assert.equal(art.rings.length, 8);
  assert.equal(art.divide.length, 1);
  assert.equal(art.network.length, 17);
  assert.equal(art.network.filter((p) => p.role === 'stem').length, 1);
  assert.equal(art.network.filter((p) => p.role === 'trib').length, 8);
  assert.equal(art.network.filter((p) => p.role === 'twig').length, 8);
  assert.equal((svg(art).match(/<path/g) || []).length, 26);
});

test('svg(): ornament markup (aria-hidden, no filters or gradients), draw attributes only when asked', () => {
  const plain = svg(catchment());
  const drawn = svg(catchment(), { draw: true });
  for (const s of [plain, drawn, svg(colophonArt())]) {
    assert.match(s, /^<svg viewBox="[^"]+" fill="none" stroke="currentColor"/);
    assert.match(s, /aria-hidden="true"/);
    assert.match(s, /focusable="false"/);
    assert.ok(!/<(filter|linearGradient|radialGradient|text|title|desc)\b|filter=|blur/i.test(s), 'no filters, gradients, labels');
    assert.equal((s.match(/<svg/g) || []).length, 1, 'a single DOM subtree');
  }
  assert.ok(!/pathLength|--i:/.test(plain));
  assert.equal((drawn.match(/pathLength="1"/g) || []).length, 26);
  assert.ok(drawn.includes('style="--i:0"') && drawn.includes('style="--i:25"'));
});

test('size budgets: Catchment at most 10.5 KB with draw attributes, colophon art at most 1.2 KB, file at most 6.0 KB raw', () => {
  assert.ok(bytes(svg(catchment(), { draw: true })) <= 10500, `catchment ${bytes(svg(catchment(), { draw: true }))} bytes`);
  assert.ok(bytes(svg(catchment())) <= 9500);
  assert.ok(bytes(svg(colophonArt())) <= 1200, `colophon ${bytes(svg(colophonArt()))} bytes`);
  assert.ok(bytes(SRC) <= 6200, `linework.js ${bytes(SRC)} bytes`);
});

test('satoriPaths(): flat <path> element objects with a literal colour, no references to CSS variables', () => {
  const paths = satoriPaths(catchment(), '#2f6f4f');
  assert.equal(paths.length, 26);
  for (const p of paths) {
    assert.equal(p.type, 'path');
    assert.equal(p.props.stroke, '#2f6f4f');
    assert.equal(p.props.fill, 'none');
    assert.ok(typeof p.props.d === 'string' && p.props.d.startsWith('M'));
    assert.ok(!/var\(/.test(JSON.stringify(p)));
  }
});

test('every coordinate is finite and inside the stated viewBox margin', () => {
  for (const [art, w, h] of [[catchment(), 600, 640], [colophonArt(), 420, 300]]) {
    const all = [...art.rings, ...art.divide, ...art.network];
    for (const p of all) {
      const nums = p.d.match(/-?\d+(?:\.\d+)?/g).map(Number);
      assert.ok(nums.every(Number.isFinite));
      assert.ok(nums.every((n) => n > -w && n < 2 * w), p.d.slice(0, 40));
    }
    assert.equal(art.viewBox, `0 0 ${w} ${h}`);
  }
});
