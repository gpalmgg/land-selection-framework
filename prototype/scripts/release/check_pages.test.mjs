import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from './check_pages.mjs';
import { tmpdir, write, makeSite, regionPage } from './test-helpers.mjs';

test('passing fixture: a consistent site passes', async () => {
  const d = makeSite(tmpdir());
  const r = await run(['--root', d]);
  assert.ok(r.ok, r.lines().join('\n'));
});

test('failing fixture: a page with two insights tags fails', async () => {
  const d = makeSite(tmpdir(), ['alpha', 'beta'], { beta: { insights: 2 } });
  const r = await run(['--root', d]);
  assert.ok(r.lines().some((l) => /^FAIL insights region\/beta\.html: 2 insights/.test(l)), r.lines().join('\n'));
});

test('failing fixture: two h1, wrong canonical, missing og:image, bad JSON-LD, vercel.app, missing rail or no-review sentence', async () => {
  const d = makeSite(tmpdir(), ['alpha', 'beta', 'gamma'], { alpha: { h1: 2 }, beta: { canonical: 'https://example.test/region/other.html', ldJson: '{ nope' }, gamma: { noReview: false, extra: '<a href="https://x.vercel.app">x</a>' } });
  write(d, 'region/gamma.html', regionPage('gamma', { noReview: false, extra: '<a href="https://x.vercel.app">x</a>' }).replace(/<meta property="og:image"[^>]*>/, '').replace('Who Holds This', 'Rail'));
  const lines = (await run(['--root', d])).lines();
  for (const re of [/^FAIL h1 region\/alpha\.html/, /^FAIL canonical region\/beta\.html/, /^FAIL json-ld region\/beta\.html/, /^FAIL og:image region\/gamma\.html/, /^FAIL no-vercel\.app region\/gamma\.html/, /^FAIL rail-who-holds region\/gamma\.html/, /^FAIL no-review region\/gamma\.html/]) assert.ok(lines.some((l) => re.test(l)), String(re) + '\n' + lines.join('\n'));
});

test('failing fixture: a sitemap loc without a file, a region without a page or sitemap entry', async () => {
  const d = makeSite(tmpdir());
  write(d, 'sitemap.xml', '<urlset><url><loc>https://example.test/</loc></url><url><loc>https://example.test/region/alpha.html</loc></url><url><loc>https://example.test/region/ghost.html</loc></url></urlset>');
  write(d, 'data/regions.js', "export const regions = [\n{\n id: 'alpha',\n coords: [1,2],\n},\n{\n id: 'beta',\n coords: [1,2],\n},\n{\n id: 'delta',\n coords: [1,2],\n}];\n");
  const lines = (await run(['--root', d])).lines();
  assert.ok(lines.some((l) => /^FAIL sitemap-loc: .*ghost\.html/.test(l)), lines.join('\n'));
  assert.ok(lines.some((l) => /^FAIL region-sitemap beta/.test(l)));
  assert.ok(lines.some((l) => /^FAIL region-page delta/.test(l)));
});
