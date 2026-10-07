import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { run, parsePorcelainZ } from './check_git_scope.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const z = (...entries) => entries.join('\0') + '\0';
const check = async (out) => run(['--status-file', write(tmpdir(), 'status.z', out)]);

test('passing fixture: only allowed paths', async () => {
  const r = await check(z(' M prototype/index.html', '?? prototype/src/ui/x.js', ' M source-docs/a.md', '?? docs/new.md', ' M README.md', ' M Land Selection Framework.pdf', '?? r4-reciprocity-commentary-DRAFT.md', ' M FRAMEWORK.md', ' M CONTRIBUTING.md', ' M invitation.md'));
  assert.ok(r.ok, r.lines().join('\n'));
});

test('failing fixture: a git status listing CLAUDE.md', async () => {
  const r = await check(z(' M prototype/index.html', ' M CLAUDE.md'));
  assert.equal(r.ok, false);
  assert.ok(r.lines()[0].includes('CLAUDE.md'), r.lines().join('\n'));
});

test('failing fixtures: .gitignore, upgrade-2026-10/, a deleted source doc, a rename out of scope', async () => {
  assert.equal((await check(z(' M .gitignore'))).ok, false);
  assert.equal((await check(z('?? upgrade-2026-10/STATUS.md'))).ok, false);
  assert.equal((await check(z(' D source-docs/Land Project v1 r4 Overview.md'))).ok, false);
  assert.equal((await check(z('R  prototype/new.js', 'elsewhere/old.js'))).ok, false);
  assert.ok((await check(z('R  prototype/new.js', 'prototype/old.js'))).ok);
});

test('parsePorcelainZ keeps rename sources and paths with spaces', () => {
  assert.deepEqual(parsePorcelainZ(z('R  b.js', 'a.js', ' M x y.pdf')).map((e) => e.path), ['b.js', 'a.js', 'x y.pdf']);
});

test('works against a real repository (clean tree passes, CLAUDE.md edit fails)', async () => {
  const d = tmpdir(); const g = (...a) => spawnSync('git', ['-C', d, ...a], { encoding: 'utf8' });
  g('init', '-q'); write(d, 'prototype/a.js', '1'); write(d, 'CLAUDE.md', '1');
  g('add', '.'); g('-c', 'user.email=t@t.t', '-c', 'user.name=t', 'commit', '-qm', 'x');
  write(d, 'prototype/a.js', '2');
  assert.ok((await run(['--repo', d])).ok);
  write(d, 'CLAUDE.md', '2');
  assert.equal((await run(['--repo', d])).ok, false);
});
