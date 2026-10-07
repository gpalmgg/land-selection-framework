import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { run, scanCss, scanJs, TABLE, FLOOR } from './check_browser_features.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const statuses = (css, ctx) => scanCss(css, ctx).map((h) => `${h.feature}:${h.status}`);

test('table matches the support floor decision: only the listed features are above the floor', () => {
  assert.deepEqual(FLOOR, { chrome: 118, safari: 17.0, firefox: 118 });
  assert.deepEqual(TABLE['light-dark()'], [123, 17.5, 120]);
  assert.deepEqual(TABLE['@property'], [85, 16.4, 128]);
});

test('failing fixture: an unguarded light-dark() fails the CLI run with file:line and versions', async () => {
  const d = tmpdir(); write(d, 'src/styles/c.css', 'a {\n  color: light-dark(#111, #eee);\n}\n');
  const r = await run(['--root', d]);
  assert.equal(r.ok, false);
  assert.ok(r.lines().some((l) => /^FAIL browser-feature light-dark\(\): src\/styles\/c\.css:2 unguarded \(Chrome 123, Safari 17\.5, Firefox 120/.test(l)), r.lines().join('\n'));
});

test('passing fixture: light-dark() guarded by @supports, by a fallback declaration, or by the tokens.css fallback block', async () => {
  assert.deepEqual(statuses('@supports (color: light-dark(#000, #fff)) { a { color: light-dark(#111, #eee); } }'), ['light-dark():guarded']);
  assert.deepEqual(statuses('a { color: #111; color: light-dark(#111, #eee); }'), ['light-dark():guarded']);
  assert.deepEqual(statuses(':root { --ink: light-dark(#111, #eee); }', { tokensFallback: true }), ['light-dark():guarded']);
  assert.deepEqual(statuses(':root { --ink: light-dark(#111, #eee); }', { tokensFallback: false }), ['light-dark():UNGUARDED']);
  assert.deepEqual(statuses('@supports not (color: light-dark(#000, #fff)) { a { color: light-dark(#111, #eee); } }'), ['light-dark():UNGUARDED']);
  const d = tmpdir();
  write(d, 'src/styles/tokens.css', ':root { --ink: light-dark(#111, #eee); }\n@supports not (color: light-dark(#000, #fff)) { :root { --ink: #111; } }\n');
  write(d, 'src/styles/other.css', 'a { color: var(--ink); }\n');
  assert.ok((await run(['--root', d])).ok);
});

test('text-wrap is progressive; dvh after vh is progressive; features at or below the floor never fail', () => {
  assert.deepEqual(statuses('h1 { text-wrap: balance; }'), ['text-wrap:progressive']);
  assert.deepEqual(statuses('a { height: 100vh; height: 100dvh; }'), ['dvh/svh/lvh:within-floor']);
  assert.deepEqual(statuses('@container (min-width: 10px) { a { color: color-mix(in srgb, red, blue); } } @layer base { a { x: y } }').sort(), ['@container:within-floor', '@layer:within-floor', 'color-mix():within-floor']);
});

test(':has(), CSS nesting and @property need @supports', () => {
  assert.deepEqual(statuses('a:has(img) { color: red; }'), [':has():UNGUARDED']);
  assert.deepEqual(statuses('@supports selector(:has(a)) { a:has(img) { color: red; } }'), [':has():guarded']);
  assert.deepEqual(statuses('.card { color: red; &:hover { color: blue; } }'), ['css nesting:UNGUARDED']);
  assert.deepEqual(statuses('.card { color: red; .inner { color: blue; } }'), ['css nesting:UNGUARDED']);
  assert.deepEqual(statuses('.card { color: red; @media (min-width: 1px) { color: blue; } }'), ['css nesting:UNGUARDED']);
  assert.deepEqual(statuses('@media (min-width: 1px) { .card { color: red; } }'), []);
  assert.deepEqual(statuses('@keyframes k { from { opacity: 0 } 50% { opacity: .5 } }'), []);
  assert.deepEqual(statuses('@property --x { syntax: "<number>"; inherits: false; initial-value: 0; }'), ['@property:UNGUARDED']);
  assert.deepEqual(statuses('@supports (color: oklch(0 0 0)) { @property --x { syntax: "<number>"; inherits: false; initial-value: 0; } }'), ['@property:guarded']);
});

test('comments, strings and url() do not confuse the walker', () => {
  assert.deepEqual(statuses('/* a:has(b) { } light-dark( */ a { content: "{ light-dark( }"; background: url(data:image/svg+xml;utf8,<svg>;</svg>); }'), []);
});

test('inline <style> and <script> blocks of html files are scanned', async () => {
  const d = tmpdir(); write(d, 'p.html', '<html><style>\na { color: light-dark(#111, #eee); }\n</style><script>const a = [1].at(0); const b = structuredClone({});</script></html>');
  const r = await run(['--root', d, '--out', path.join(d, 'out.json')]);
  assert.equal(r.ok, false);
  assert.ok(r.lines().some((l) => /^FAIL browser-feature light-dark\(\): p\.html:2 unguarded/.test(l)), r.lines().join('\n'));
  const j = JSON.parse(fs.readFileSync(path.join(d, 'out.json'), 'utf8'));
  assert.ok(j.hits.some((h) => h.feature === '.at()' && h.status === 'within-floor'));
  assert.ok(j.hits.some((h) => h.feature === 'structuredClone()'));
});

test('vendor/, data/, tests/ and scripts/ are not scanned', async () => {
  const d = tmpdir();
  for (const dir of ['vendor', 'data', 'tests', 'scripts', 'node_modules']) write(d, `${dir}/x.css`, 'a { color: light-dark(#111, #eee); }');
  write(d, 'ok.css', 'a { color: red; }');
  assert.ok((await run(['--root', d])).ok);
});

test('JS guard: a feature check on a nearby line counts', () => {
  assert.ok(scanJs('const a = x.at(0);').every((h) => h.status === 'within-floor'));
});
