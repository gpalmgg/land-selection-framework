import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { run, nameRegex } from './check_contact_free.mjs';
import { tmpdir, write, MAILTO, PHONE, addr } from './test-helpers.mjs';

const HASH = 'abcdef0123456789abcdef0123456789';

function env(files) {
  const d = tmpdir();
  for (const [rel, text] of Object.entries(files)) write(d, rel, text);
  const forms = write(d, '_forms.json', JSON.stringify({ forms: [{ action: `https://formsubmit.co/ajax/${HASH}` }] }));
  const excluded = write(d, '_excluded.txt', "Xyzzyland\nZorp\nWibble Test\nQux'i Test\n");
  return { d, forms, excluded };
}
const go = (e, extra = ['--handle', 'someone-testhandle']) => run(['--paths', ...Object.keys(e.files || {}), '--root', e.d, '--forms', e.forms, '--excluded', e.excluded, ...extra]);
const scan = async (files, extra) => { const e = env(files); e.files = files; return go(e, extra); };

test('passing fixture: clean pages and the FormSubmit endpoint with the baseline hash', async () => {
  const r = await scan({ 'index.html': `<form action="https://formsubmit.co/ajax/${HASH}"><a href="/deeper.html">deeper</a> 2x logo${'@'}2x.png</form>`, 'a.js': 'export const x = 1;' });
  assert.ok(r.ok, r.lines().join('\n'));
});

test('failing fixture: an email address', async () => {
  const r = await scan({ 'a.html': `<p>write to ${addr('someone', 'example.org')}</p>` });
  assert.ok(r.lines().some((l) => /^FAIL contact-free: a\.html:1 email address/.test(l)), r.lines().join('\n'));
});

test('failing fixtures: mail link, phone link, vercel.app, internal path, instagram, substack, github handle', async () => {
  for (const [text, label] of [[`<a href="${MAILTO}x">m</a>`, MAILTO], [`<a href="${PHONE}1">t</a>`, PHONE], ['https://land.vercel.app/x', 'vercel.app'], ['/x/upgrade-2026-10/y', 'upgrade-2026-10'],
    ['https://www.instagram.com/foo', 'instagram.com/'], ['https://foo.substack.com/', 'substack.com'], ['see github.com/someone-testhandle/repo', 'GitHub handle']]) {
    const r = await scan({ 'a.html': text });
    assert.ok(r.lines().some((l) => l.startsWith('FAIL') && l.includes(label)), `${label}: ${r.lines().join('\n')}`);
  }
});

test('failing fixture: a FormSubmit URL with another token or an email fails', async () => {
  const r = await scan({ 'a.html': '<form action="https://formsubmit.co/ajax/ffffffffffffffffffffffffffffffff">' });
  assert.ok(r.lines().some((l) => /^FAIL contact-free: .*formsubmit endpoint/.test(l)), r.lines().join('\n'));
  const r2 = await scan({ 'a.html': `<form action="https://formsubmit.co/${addr('someone', 'example.org')}">` });
  assert.equal(r2.ok, false);
});

test('failing fixture: a page naming an excluded region fails; ordinary words and the plain spelling behave', async () => {
  const r = await scan({ 'region/x.html': '<p>The valley of Xyzzyland is lovely.</p>' });
  assert.ok(r.lines().some((l) => /^FAIL contact-free: region\/x\.html names an excluded region \(Xyzzyland\)/.test(l)), r.lines().join('\n'));
  assert.ok((await scan({ 'a.html': '<p>do not zorp the rules</p>' })).ok, 'lower-case zorp is not the excluded name Zorp');
  assert.equal((await scan({ 'a.html': '<p>a house in Zorp, Oregon</p>' })).ok, false);
  assert.equal((await scan({ 'a.html': '<p>the Wibble Test belt</p>' })).ok, false);
  assert.equal((await scan({ 'a.html': '<p>Qux’i Test</p>' })).ok, false);
  assert.ok(nameRegex('Fable belt').test('the FABLE BELT'));
});

test('failing fixture: a missing excluded list or a missing path fails loudly', async () => {
  const e = env({ 'a.html': 'x' });
  const r = await run(['--paths', 'a.html', 'nope.html', '--root', e.d, '--forms', e.forms, '--excluded', path.join(e.d, 'absent.txt'), '--handle', 'zzz-none']);
  assert.ok(r.lines().some((l) => /^FAIL excluded-regions/.test(l)));
  assert.ok(r.lines().some((l) => /^FAIL path: nope\.html/.test(l)));
});

test('--list reads a deploy list and skips vendor/maplibre and vendor/fonts', async () => {
  const e = env({ 'index.html': 'ok', 'vendor/maplibre-4.7.1/maplibre-gl.js': `${addr('a', 'b.example')} ${MAILTO}x`, 'vendor/fonts/fonts.css': `${PHONE}1` });
  const list = write(e.d, '_list.txt', 'deploy list with x: 3 files\nindex.html\nvendor/maplibre-4.7.1/maplibre-gl.js\nvendor/fonts/fonts.css\n');
  const r = await run(['--list', list, '--root', e.d, '--forms', e.forms, '--excluded', e.excluded, '--handle', 'zzz-none']);
  assert.ok(r.ok, r.lines().join('\n'));
});

test('the GitHub handle is read from git remote origin at run time', async () => {
  const e = env({ 'a.html': 'visit gh-handle-under-test today' });
  const g = (...a) => spawnSync('git', ['-C', e.d, ...a], { encoding: 'utf8' });
  g('init', '-q'); g('remote', 'add', 'origin', 'https://github.com/gh-handle-under-test/repo.git');
  const r = await run(['--paths', 'a.html', '--root', e.d, '--forms', e.forms, '--excluded', e.excluded]);
  assert.ok(r.lines().some((l) => /^FAIL contact-free: a\.html:1 GitHub handle/.test(l)), r.lines().join('\n'));
});

test('an allow: line tolerates one name in one file (or folder) and nothing else', async () => {
  const e = env({ 'data/processed/labels.json': '{"label":"Xyzzyland forests"}', 'region/x.html': '<p>Xyzzyland</p>', 'data/processed/other/a.json': 'Xyzzyland' });
  const ex = write(e.d, '_ex2.txt', '# header\nXyzzyland\nallow: Xyzzyland @ data/processed/labels.json\nallow: xyzzyland @ data/processed/other/\n');
  const r = await run(['--paths', 'data', 'region', '--root', e.d, '--forms', e.forms, '--excluded', ex, '--handle', 'zzz-none']);
  const lines = r.lines();
  assert.equal(r.ok, false);
  assert.ok(lines.some((l) => /^FAIL contact-free: region\/x\.html names an excluded region/.test(l)));
  assert.ok(!lines.some((l) => /data\/processed/.test(l)), lines.join('\n'));
  const r2 = await run(['--paths', 'data', '--root', e.d, '--forms', e.forms, '--excluded', ex, '--handle', 'zzz-none']);
  assert.ok(r2.ok, r2.lines().join('\n'));
  assert.match(r2.lines()[0], /2 listed allow: exceptions applied/);
});
