import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { run, extractRefs, resolveRef } from './check_deploy_set.mjs';
import { tmpdir, write, MAILTO } from './test-helpers.mjs';

function site(extra = {}) {
  const d = tmpdir();
  write(d, 'index.html', '<link rel="stylesheet" href="/src/a.css"><script type="module" src="/src/main.js"></script><a href="/deeper.html#x">d</a><img src="/img/p.png" srcset="/img/p.png 1x, /img/p2.png 2x"><script defer src="/_vercel/insights/script.js"></script><a href="/share?x=1">s</a>');
  write(d, 'deeper.html', '<h1>d</h1>');
  write(d, 'src/a.css', '@import "./b.css"; body { background: url("../img/p.png"); } .x { background: url(data:image/png;base64,AAA); }');
  write(d, 'src/b.css', 'a { color: red }');
  write(d, 'src/main.js', "import { x } from './util.js';\nconst m = () => import('./lazy.js');\nconst computed = `${base}/data.json`;\nfetch('/api/og');\nexport { x };");
  write(d, 'src/util.js', 'export const x = 1;'); write(d, 'src/lazy.js', 'export default 2;');
  write(d, 'img/p.png', 'png'); write(d, 'img/p2.png', 'png2');
  for (const [k, v] of Object.entries(extra)) write(d, k, v);
  return d;
}
const listOf = (d, drop = []) => {
  const files = []; const rec = (dir, rel) => { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const r = rel ? `${rel}/${e.name}` : e.name; e.isDirectory() ? rec(path.join(dir, e.name), r) : files.push(r); } };
  rec(d, ''); return write(d, '_list.txt', 'deploy list with x: n files\n' + files.filter((f) => f !== '_list.txt' && !drop.includes(f)).join('\n') + '\n');
};
const base = (d, total, count = 10) => write(d, '_base.json', JSON.stringify({ deploy: { file_count: count, total_bytes: total, files_over_10mb: [] } }));

test('passing fixture: references resolve, no forbidden path, within the baseline', async () => {
  const d = site(); const l = listOf(d);
  const r = await run(['--list', l, '--root', d, '--baseline', base(d, 1000)]);
  assert.ok(r.ok, r.lines().join('\n'));
});

test('failing fixture: a deploy list containing tests/ (and other forbidden paths) fails', async () => {
  const d = site({ 'tests/e2e/run.py': 'x', 'scripts/gen.mjs': 'x', 'notes.md': 'x', 'data/raw/a.tif': 'x', 'data/regions-na.staging.js': 'x' });
  const r = await run(['--list', listOf(d), '--root', d, '--baseline', base(d, 1000)]);
  assert.equal(r.ok, false);
  assert.ok(r.lines().some((l) => /^FAIL forbidden-paths:.*tests\/e2e\/run\.py \(tests\/\)/.test(l) && /scripts\/gen\.mjs/.test(l) && /notes\.md/.test(l) && /staging/.test(l)), r.lines().join('\n'));
});

test('failing fixture: a referenced file missing from the list fails (href, src, srcset, url(), @import, import, import())', async () => {
  const d = site();
  const r = await run(['--list', listOf(d, ['src/b.css', 'img/p2.png', 'src/lazy.js', 'src/util.js', 'deeper.html']), '--root', d, '--baseline', base(d, 1000)]);
  const line = r.lines().find((l) => /^FAIL references/.test(l)) || '';
  for (const f of ['b.css', 'p2.png', 'lazy.js', 'util.js', 'deeper.html']) assert.ok(line.includes(f), `${f} in ${line}`);
});

test('failing fixture: size rules (file over 10 MB, total over baseline + 25 MB)', async () => {
  const d = site();
  fs.writeFileSync(path.join(d, 'big.bin'), Buffer.alloc(11 * 1024 * 1024));
  const r = await run(['--list', listOf(d), '--root', d, '--baseline', base(d, 1000)]);
  assert.ok(r.lines().some((l) => /^FAIL file-size/.test(l) && /big\.bin/.test(l)), r.lines().join('\n'));
  const d2 = site(); fs.writeFileSync(path.join(d2, 'bulk.bin'), Buffer.alloc(9 * 1024 * 1024)); fs.writeFileSync(path.join(d2, 'bulk2.bin'), Buffer.alloc(9 * 1024 * 1024)); fs.writeFileSync(path.join(d2, 'bulk3.bin'), Buffer.alloc(9 * 1024 * 1024));
  const r2 = await run(['--list', listOf(d2), '--root', d2, '--baseline', base(d2, 1000)]);
  assert.ok(r2.lines().some((l) => /^FAIL total-size/.test(l)), r2.lines().join('\n'));
});

test('--record measures the baseline; a baseline-listed big file is tolerated', async () => {
  const d = site(); fs.writeFileSync(path.join(d, 'big.bin'), Buffer.alloc(11 * 1024 * 1024)); const l = listOf(d);
  const rec = path.join(d, '_rec.json');
  const r = await run(['--list', l, '--root', d, '--record', rec]);
  assert.ok(r.ok, r.lines().join('\n'));
  const j = JSON.parse(fs.readFileSync(rec, 'utf8'));
  assert.equal(j.deploy.files_over_10mb[0].path, 'big.bin');
  const r2 = await run(['--list', l, '--root', d, '--baseline', rec]);
  assert.ok(r2.ok, r2.lines().join('\n'));
});

test('extractRefs ignores computed and external specifiers; resolveRef handles relative paths', () => {
  const refs = extractRefs(`<a href="https://x.test/a">a</a><img src="/a/\${x}.png"><a href="${MAILTO}x">m</a><a href="#top">t</a><a href="./rel.html">r</a><img src="/ok.png">`, 'html').map((r) => r.ref);
  assert.deepEqual(refs, ['./rel.html', '/ok.png']);
  assert.equal(resolveRef('../img/p.png', 'src/a.css'), '/img/p.png');
  assert.equal(resolveRef('/x/y.js', 'src/a.js'), '/x/y.js');
});
