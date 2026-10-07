// scripts/stamp_build.mjs (MC-FACTS): stamps counts, count words, dates, linework, region links, module preloads, the head block and
// cache-bust values into the static pages; --check / --write / --bump; idempotent; analytics tag exactly once. Everything runs on
// a throwaway copy of the site data under the OS temp dir (--root), never on the working tree's pages.
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { regions, criteria } from '../../data/regions.js';
import { facts, canon, factValues, site, countWord, CapWord } from '../../data/site-facts.js';
import { svg, catchment, colophonArt } from '../../lib/linework.js';
import headIndex, { INSIGHTS_TAG } from '../../scripts/stamp/head-index.mjs';

const PROTO = fileURLToPath(new URL('../../', import.meta.url));
const STAMP = join(PROTO, 'scripts', 'stamp_build.mjs');
const TAG_RE = /<script\b[^>]*src="\/_vercel\/insights\/script\.js"[^>]*><\/script>/g;
const roots = [];

test.after(() => { for (const r of roots) rmSync(r, { recursive: true, force: true }); });

function makeRoot() {
  const root = mkdtempSync(join(tmpdir(), 'mc-facts-'));
  roots.push(root);
  mkdirSync(join(root, 'data'));
  for (const f of readdirSync(join(PROTO, 'data'))) {
    if (f.endsWith('.js') && !f.includes('.staging.') && statSync(join(PROTO, 'data', f)).isFile()) cpSync(join(PROTO, 'data', f), join(root, 'data', f));
  }
  cpSync(join(PROTO, 'lib'), join(root, 'lib'), { recursive: true });
  cpSync(join(PROTO, 'src'), join(root, 'src'), { recursive: true });
  cpSync(join(PROTO, 'package.json'), join(root, 'package.json'));
  return root;
}

const run = (args, env = {}) => spawnSync(process.execPath, [STAMP, ...args], { encoding: 'utf8', env: { ...process.env, ...env } });
const read = (root, f) => readFileSync(join(root, f), 'utf8');
const write = (root, f, s) => writeFileSync(join(root, f), s);

const FIXTURE_INDEX = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <!--s:head--><!--/s-->
  <!--s:modulepreload--><!--/s-->
  <link rel="stylesheet" href="./src/styles/base.css" data-bust />
  <link rel="stylesheet" href="./src/styles/map.css?old=1&v=zzz#frag" data-bust />
  <link rel="stylesheet" href="./src/styles/other.css" />
  <script type="module" src="./src/main.js?v=usab17" data-bust></script>
</head>
<body>
<h2><!--f:RegionsWord-->X<!--/f--> regions, briefly named.</h2>
<p><!--f:regions-->0<!--/f--> regions (<!--f:regionsWord-->x<!--/f-->): <!--f:regionsEurope-->0<!--/f--> in Europe, <!--f:regionsNA-->0<!--/f--> in North America.
<!--f:CriteriaWord-->x<!--/f--> criteria (<!--f:criteria-->0<!--/f-->), <!--f:layersWord-->x<!--/f--> layers (<!--f:layers-->0<!--/f-->) across <!--f:themesWord-->x<!--/f--> themes (<!--f:themes-->0<!--/f-->).</p>
<p>Built <!--f:buildDate-->?<!--/f--> (<!--f:buildDateLong-->?<!--/f-->), <!--f:year-->?<!--/f-->, id <!--f:buildId-->?<!--/f-->. Data <!--f:dataRevision-->?<!--/f--> / <!--f:dataRevisionLong-->?<!--/f-->.</p>
<p><!--f:revision-->?<!--/f--></p>
<div class="hero-art"><!--s:art:catchment-->stale<!--/s--></div>
<nav>
  <!--s:regionlinks--><!--/s-->
</nav>
<footer><!--s:art:colophon--><!--/s--></footer>
</body>
</html>
`;

function fixtureSite() {
  const root = makeRoot();
  write(root, 'index.html', FIXTURE_INDEX);
  return root;
}

test('--help names every flag and exits 0 (scratch_site.py greps --help for --root)', () => {
  const r = run(['--help']);
  assert.equal(r.status, 0);
  for (const f of ['--root', '--write', '--check', '--bump']) assert.ok(r.stdout.includes(f), f);
  assert.equal(run(['--nope']).status, 2);
  assert.equal(run(['--bump', '--check']).status, 2);
  assert.equal(run(['--root', join(tmpdir(), 'mc-facts-does-not-exist')]).status, 2);
});

test('--write stamps every marker; --check then exits 0; a second --write changes nothing (idempotent)', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--check']).status, 1, 'a fresh fixture is stale');
  const w = run(['--root', root, '--write']);
  assert.equal(w.status, 0, w.stderr);
  assert.equal(run(['--root', root, '--check']).status, 0);
  const before = read(root, 'index.html');
  const mtime = statSync(join(root, 'index.html')).mtimeMs;
  const w2 = run(['--root', root, '--write']);
  assert.equal(w2.status, 0, w2.stderr);
  assert.equal(read(root, 'index.html'), before, 'second write is a no-op');
  assert.equal(statSync(join(root, 'index.html')).mtimeMs, mtime, 'and does not even touch the file');
  assert.ok(!w2.stdout.includes('written'));
});

test('f: markers print the computed facts (counts, count words, dates)', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  const html = read(root, 'index.html');
  const v = factValues();
  const f = (k) => `<!--f:${k}-->${v[k]}<!--/f-->`;
  for (const k of ['RegionsWord', 'regions', 'regionsWord', 'regionsEurope', 'regionsNA', 'CriteriaWord', 'criteria', 'layersWord', 'layers', 'themesWord', 'themes',
    'buildDate', 'buildDateLong', 'year', 'buildId', 'dataRevision', 'dataRevisionLong']) assert.ok(html.includes(f(k)), k);
  assert.ok(html.includes(`<h2><!--f:RegionsWord-->${CapWord(regions.length)}<!--/f--> regions, briefly named.</h2>`));
  assert.ok(html.includes(`<!--f:dataRevision-->2026-10<!--/f-->`));
  assert.ok(html.includes(`<!--f:regions-->${regions.length}<!--/f-->`));
  assert.ok(html.includes(`<!--f:regionsWord-->${countWord(regions.length)}<!--/f-->`));
  assert.ok(html.includes(`<!--f:revision-->Values revised October 2026 against their cited sources; earlier shared links may match different regions.<!--/f-->`));
});

test('data-bust: ?v=<buildId> on stylesheet links and the entry module; links without the attribute are untouched', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  const html = read(root, 'index.html');
  const id = factValues().buildId;
  assert.ok(html.includes(`href="./src/styles/base.css?v=${id}" data-bust`));
  assert.ok(html.includes(`href="./src/styles/map.css?v=${id}&old=1#frag" data-bust`), 'other params and the fragment survive, v is replaced');
  assert.ok(html.includes(`src="./src/main.js?v=${id}" data-bust`));
  assert.ok(html.includes('href="./src/styles/other.css" />'));
  assert.ok(!html.includes('usab17'));
});

test('s:head: the head block carries the canon sentences, counts as words, buildDate, og:image with ?v=<buildId>, and the analytics tag once', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  const html = read(root, 'index.html');
  const v = factValues();
  assert.equal((html.match(TAG_RE) || []).length, 1);
  assert.ok(html.includes(`<link rel="canonical" href="${site.origin}/" />`));
  assert.ok(html.includes(`content="${site.origin}/api/og?v=${v.buildId}"`));
  assert.ok(html.includes(canon.descriptor));
  assert.ok(html.includes(canon.stance));
  assert.ok(html.includes(`${v.CriteriaWord} criteria, with sources, across ${v.regionsWord} regions in Europe and North America.`));
  assert.ok(html.includes(`"dateModified": "${v.buildDate}"`));
  assert.ok(!/[≤≥]/.test(html));
  assert.ok(!/The Collective/.test(html));
  const ld = /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/.exec(html);
  assert.ok(ld, 'JSON-LD present');
  const obj = JSON.parse(ld[1]);
  // MC-SEO: the head carries one @graph (a WebSite, a Dataset and an ItemList of region pages), not a single top-level CreativeWork.
  assert.ok(Array.isArray(obj['@graph']), 'JSON-LD is an @graph');
  const types = obj['@graph'].map((n) => n['@type']);
  assert.ok(types.includes('WebSite') && types.includes('Dataset'), `graph types: ${types.join(', ')}`);
  for (const n of obj['@graph'].filter((x) => x.dateModified)) assert.equal(n.dateModified, v.buildDate);
  assert.ok(obj['@graph'].some((n) => n.dateModified === v.buildDate), 'a graph node carries dateModified = buildDate');
});

test('head template: a function (values, canon, site) -> lines with the insights script exactly once, and no contact details', () => {
  const lines = headIndex(factValues(), canon, site);
  assert.ok(Array.isArray(lines) && lines.every((l) => typeof l === 'string'));
  const text = lines.join('\n');
  assert.equal((text.match(TAG_RE) || []).length, 1);
  assert.equal(lines.filter((l) => l === INSIGHTS_TAG).length, 1);
  assert.ok(!/[\w.+-]+@[\w-]+\.[\w.]+|mailto:|tel:/.test(text));
  for (const must of ['<title>', 'name="description"', 'rel="canonical"', 'application/ld+json', 'og:title', 'og:image', 'twitter:card', 'twitter:image']) assert.ok(text.includes(must), must);
  assert.equal((text.match(/<title>/g) || []).length, 1);
});

test('F10: --check fails when a page has no insights script, or two, and passes with exactly one', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  const good = read(root, 'index.html');
  // tag removed from inside the stamped block (a hand-edit): the block is stale, so --check fails; --write restores it
  write(root, 'index.html', good.replace(INSIGHTS_TAG, ''));
  const none = run(['--root', root, '--check']);
  assert.equal(none.status, 1);
  assert.match(none.stderr, /DIFF index\.html/);
  assert.equal(run(['--root', root, '--write']).status, 0);
  assert.equal(read(root, 'index.html'), good);
  // a page with no markers at all and no tag fails too
  const bare = makeRoot();
  write(bare, 'index.html', '<!doctype html><html><head><title>x</title></head><body>hello</body></html>\n');
  const r = run(['--root', bare, '--check']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /insights script/);
  // two: a literal tag in the body next to the stamped one
  write(root, 'index.html', good.replace('</body>', `${INSIGHTS_TAG}\n</body>`));
  const two = run(['--root', root, '--check']);
  assert.equal(two.status, 1);
  assert.match(two.stderr, /2 times/);
  // exactly one literal tag, no head marker: fine
  write(bare, 'index.html', `<!doctype html><html><head><title>x</title>${INSIGHTS_TAG}</head><body>hello</body></html>\n`);
  assert.equal(run(['--root', bare, '--check']).status, 0);
});

test('s:head adoption: a hand-written head collapses into the stamped block instead of duplicating', () => {
  const root = makeRoot();
  write(root, 'index.html', `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Old title</title>
  <meta name="description" content="old" />
  <link rel="canonical" href="https://example.invalid/" />
  <meta property="og:title" content="old" />
  <meta name="twitter:title" content="old" />
  <script type="application/ld+json">{"@type":"CreativeWork"}</script>
  <link rel="icon" href="/favicon.svg" />
  <meta name="theme-color" content="#fff" />
  <!--s:head--><!--/s-->
  <!-- Vercel Analytics (Hobby plan, no auth needed) -->
  <script defer src="/_vercel/insights/script.js"></script>
</head>
<body>hello</body>
</html>
`);
  assert.equal(run(['--root', root, '--write']).status, 0);
  const html = read(root, 'index.html');
  assert.equal((html.match(/<title>/g) || []).length, 1);
  assert.equal((html.match(/rel="canonical"/g) || []).length, 1);
  assert.equal((html.match(/application\/ld\+json/g) || []).length, 1);
  assert.equal((html.match(/rel="icon"/g) || []).length, 1);
  assert.equal((html.match(TAG_RE) || []).length, 1);
  assert.ok(!html.includes('Old title') && !html.includes('example.invalid'));
  assert.ok(html.includes('<meta name="theme-color" content="#fff" />'), 'unrelated head elements are kept');
  assert.ok(html.includes('<meta charset="utf-8" />'));
  assert.equal(run(['--root', root, '--check']).status, 0);
});

test('s:art: inline linework from lib/linework.js (catchment draws in, colophon is static, variants override)', () => {
  const root = fixtureSite();
  write(root, 'index.html', read(root, 'index.html').replace('<footer>', '<div><!--s:art:catchment:static--><!--/s--><!--s:art:colophon:draw--><!--/s--></div><footer>'));
  assert.equal(run(['--root', root, '--write']).status, 0);
  const html = read(root, 'index.html');
  assert.ok(html.includes(`<!--s:art:catchment-->${svg(catchment(), { draw: true })}<!--/s-->`));
  assert.ok(html.includes(`<!--s:art:colophon-->${svg(colophonArt())}<!--/s-->`));
  assert.ok(html.includes(`<!--s:art:catchment:static-->${svg(catchment())}<!--/s-->`));
  assert.ok(html.includes(`<!--s:art:colophon:draw-->${svg(colophonArt(), { draw: true })}<!--/s-->`));
  assert.ok(!html.includes('>stale<'));
});

test('s:regionlinks: every region as a crawlable /region/<id>.html link, declared order, grouped by continent', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  const html = read(root, 'index.html');
  const block = /<!--s:regionlinks-->([\s\S]*?)<!--\/s-->/.exec(html)[1];
  const hrefs = [...block.matchAll(/<a href="([^"]+)">([^<]*)<\/a>/g)];
  const order = [...new Set(regions.map((r) => r.continent))];
  const expected = order.flatMap((c) => regions.filter((r) => r.continent === c));
  assert.deepEqual(hrefs.map((m) => m[1]), expected.map((r) => `/region/${r.id}.html`));
  assert.deepEqual(hrefs.map((m) => m[2]), expected.map((r) => r.name.replace(/&/g, '&amp;')));
  assert.equal(hrefs.length, facts.regions);
  assert.equal((block.match(/class="region-links-h"/g) || []).length, order.length);
  assert.ok(block.includes('>Europe<') && block.includes('>North America<'));
});

test('s:modulepreload: the static import graph of the entry module; dynamic imports and the entry itself are left out', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  const hrefs = [...read(root, 'index.html').matchAll(/<link rel="modulepreload" href="([^"]+)" \/>/g)].map((m) => m[1]);
  assert.ok(hrefs.length > 10);
  assert.equal(new Set(hrefs).size, hrefs.length, 'no duplicates');
  for (const h of hrefs) assert.ok(existsSync(join(root, h)), `${h} exists`);
  assert.ok(!hrefs.includes('/src/main.js'));
  assert.ok(hrefs.includes('/src/state.js'));
  assert.ok(hrefs.includes('/data/regions.js'));
  assert.ok(!hrefs.includes('/data/legal-pathway.js') && !hrefs.includes('/data/context.js'), 'drawer-only data is a dynamic import');

  const tiny = fixtureSite();
  mkdirSync(join(tiny, 'src', 'x'), { recursive: true });
  write(tiny, 'src/main.js', "import { a } from './x/a.js';\nimport './x/side.js';\nexport * from '../lib/format.js';\nconst lazy = () => import('./x/lazy.js');\n");
  write(tiny, 'src/x/a.js', "import { b } from './b';\nexport const a = 1;\n");
  write(tiny, 'src/x/b.js', "import { a } from './a.js';\nimport 'https://cdn.example/x.js';\nexport const b = 2;\n");
  write(tiny, 'src/x/side.js', '// import { nope } from "./nope.js";\nexport const s = 1;\n');
  write(tiny, 'src/x/lazy.js', 'export const l = 1;\n');
  assert.equal(run(['--root', tiny, '--write']).status, 0);
  const got = [...read(tiny, 'index.html').matchAll(/<link rel="modulepreload" href="([^"]+)" \/>/g)].map((m) => m[1]);
  assert.deepEqual(got, ['/src/x/a.js', '/src/x/side.js', '/lib/format.js', '/src/x/b.js'], 'breadth-first, cycles and externals ignored, dynamic import skipped');
});

test('s:century: built from lib/century.js when it exists; skipped with a note (exit 0, block untouched) while it does not', () => {
  const root = fixtureSite();
  write(root, 'index.html', read(root, 'index.html').replace('<footer>', '<section><!--s:century-->keep me<!--/s--></section><footer>'));
  assert.ok(!existsSync(join(root, 'lib', 'century.js')) || (rmSync(join(root, 'lib', 'century.js')), true));
  const skipped = run(['--root', root, '--write']);
  assert.equal(skipped.status, 0, skipped.stderr);
  assert.match(skipped.stdout, /s:century.*skipped/);
  assert.ok(read(root, 'index.html').includes('<!--s:century-->keep me<!--/s-->'));
  write(root, 'lib/century.js', 'export const centuryModel = (c) => ({ n: c.length });\nexport const centuryHtml = (m) => `<div class="century" data-rows="${m.n}"></div>`;\n');
  assert.equal(run(['--root', root, '--write']).status, 0);
  assert.ok(read(root, 'index.html').includes(`<!--s:century--><div class="century" data-rows="${criteria.length}"></div><!--/s-->`));
  assert.equal(run(['--root', root, '--check']).status, 0);
});

test('changing one region count in a scratch copy makes --check exit 1; --write repairs it', () => {
  const root = fixtureSite();
  assert.equal(run(['--root', root, '--write']).status, 0);
  assert.equal(run(['--root', root, '--check']).status, 0);
  write(root, 'data/regions.js', read(root, 'data/regions.js') + '\nregions.pop();\n');
  const c = run(['--root', root, '--check']);
  assert.equal(c.status, 1);
  assert.match(c.stderr, /DIFF index\.html/);
  assert.equal(run(['--root', root, '--write']).status, 0);
  assert.equal(run(['--root', root, '--check']).status, 0);
  assert.ok(read(root, 'index.html').includes(`<!--f:regions-->${regions.length - 1}<!--/f-->`));
  assert.ok(read(root, 'index.html').includes(`<!--f:regionsWord-->${countWord(regions.length - 1)}<!--/f-->`));
});

test('--bump --write rewrites buildId and buildDate in the ROOT only, stamps the new id; --check never reads the clock', () => {
  const root = fixtureSite();
  const realBefore = readFileSync(join(PROTO, 'data', 'site-facts.js'), 'utf8');
  assert.equal(run(['--root', root, '--write']).status, 0);
  const b = run(['--root', root, '--bump', '--write'], { STAMP_NOW: '2027-01-02T03:04:05Z' });
  assert.equal(b.status, 0, b.stderr);
  const sf = read(root, 'data/site-facts.js');
  assert.match(sf, /^export const buildId = 'b20270102030405';$/m);
  assert.match(sf, /^export const buildDate = '2027-01-02';$/m);
  const html = read(root, 'index.html');
  assert.ok(html.includes('?v=b20270102030405" data-bust'));
  assert.ok(html.includes('<!--f:buildDate-->2027-01-02<!--/f-->'));
  assert.ok(html.includes('<!--f:buildDateLong-->2 January 2027<!--/f-->'));
  assert.ok(html.includes('<!--f:year-->2027<!--/f-->'));
  assert.ok(html.includes('"dateModified": "2027-01-02"'));
  assert.ok(html.includes('api/og?v=b20270102030405'));
  assert.ok(html.includes('<!--f:dataRevision-->2026-10<!--/f-->'), 'the data revision month does not follow the build date');
  assert.equal(readFileSync(join(PROTO, 'data', 'site-facts.js'), 'utf8'), realBefore, 'the working tree is never touched');
  // --check: no clock, so a nonsense STAMP_NOW cannot matter, and the stamped result is stable
  const c = run(['--root', root, '--check'], { STAMP_NOW: 'not a date' });
  assert.equal(c.status, 0, c.stderr);
  // bump alone behaves as --bump --write; a bad clock value is a failure
  assert.equal(run(['--root', root, '--bump'], { STAMP_NOW: '2027-02-03T04:05:06Z' }).status, 0);
  assert.match(read(root, 'data/site-facts.js'), /buildId = 'b20270203040506'/);
  assert.notEqual(run(['--root', root, '--bump'], { STAMP_NOW: 'garbage' }).status, 0);
});

test('bad markers fail loudly instead of being skipped: unknown fact key, unknown block, unclosed pair', () => {
  for (const [bad, msg] of [
    ['<p><!--f:bogus-->1<!--/f--></p>', /unknown fact key <!--f:bogus-->/],
    ['<p><!--s:nonsense--><!--/s--></p>', /unknown block name/],
    ['<p><!--s:art:forest--><!--/s--></p>', /unknown art/],
    ['<p><!--s:regionlinks--> never closed</p>', /opener\(s\) but 0/],
    ['<p><!--f:regions-->1</p>', /opener\(s\) but 0/],
    ['<p><!--s:head--><!--/s--></p>', null],
  ]) {
    const root = makeRoot();
    write(root, 'index.html', `<!doctype html><html><head><title>x</title>${INSIGHTS_TAG}</head><body>${bad}</body></html>\n`);
    const w = run(['--root', root, '--write']);
    if (msg === null) { assert.equal(w.status, 1); assert.match(w.stderr, /insights script.*2 times/); continue; }
    assert.equal(w.status, 1, bad);
    assert.match(w.stderr, msg, bad);
    assert.ok(read(root, 'index.html').includes(bad.slice(3, 12)), 'the page is left as it was');
  }
});

test('every page that exists is stamped (index, deeper, arrive, host, terms-of-arrival); missing ones are ignored', () => {
  const root = fixtureSite();
  for (const n of ['deeper', 'arrive', 'host', 'terms-of-arrival']) {
    write(root, `${n}.html`, `<!doctype html><html><head><title>${n}</title>${INSIGHTS_TAG}</head><body><p><!--f:regionsWord-->?<!--/f--> regions</p><footer><!--s:art:colophon--><!--/s--></footer></body></html>\n`);
  }
  assert.equal(run(['--root', root, '--write']).status, 0);
  for (const n of ['deeper', 'arrive', 'host', 'terms-of-arrival']) {
    assert.ok(read(root, `${n}.html`).includes(`<!--f:regionsWord-->${countWord(regions.length)}<!--/f-->`), n);
    assert.ok(read(root, `${n}.html`).includes(svg(colophonArt())), n);
  }
  assert.equal(run(['--root', root, '--check']).status, 0);
  // s:head on a page without a head template is a problem, not a silent skip
  write(root, 'host.html', '<!doctype html><html><head><!--s:head--><!--/s-->' + INSIGHTS_TAG + '</head><body></body></html>\n');
  const r = run(['--root', root, '--check']);
  assert.equal(r.status, 1);
  assert.match(r.stderr, /no head template: scripts\/stamp\/head-host\.mjs/);
});
