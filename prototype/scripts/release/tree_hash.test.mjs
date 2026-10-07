import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { treeHash } from './tree_hash.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const mk = () => { const d = tmpdir(); write(d, 'index.html', 'one'); write(d, 'src/a.js', 'two'); const l = write(d, '_list.txt', 'deploy list with x: 2 files\nsrc/a.js\nindex.html\n'); return { d, l }; };

test('the hash is stable, order-independent and a single hex string', () => {
  const { d, l } = mk();
  const h = treeHash(l, d);
  assert.match(h, /^[0-9a-f]{64}$/);
  assert.equal(treeHash(l, d), h);
  const l2 = write(d, '_list2.txt', 'index.html\nsrc/a.js\n');
  assert.equal(treeHash(l2, d), h);
});

test('failing fixture: a changed file, an added file or a dropped file changes the hash', () => {
  const { d, l } = mk(); const h = treeHash(l, d);
  write(d, 'src/a.js', 'two changed');
  const h2 = treeHash(l, d); assert.notEqual(h2, h);
  write(d, 'src/a.js', 'two'); assert.equal(treeHash(l, d), h);
  write(d, 'new.js', 'x'); assert.notEqual(treeHash(write(d, '_l3.txt', 'index.html\nsrc/a.js\nnew.js\n'), d), h);
  assert.notEqual(treeHash(write(d, '_l4.txt', 'index.html\n'), d), h);
});

test('CLI prints only the hash on success and exits 1 on a missing file', () => {
  const { d, l } = mk();
  const ok = spawnSync('node', [path.join(HERE, 'tree_hash.mjs'), '--list', l, '--root', d], { encoding: 'utf8' });
  assert.equal(ok.status, 0); assert.equal(ok.stdout.trim(), treeHash(l, d));
  const bad = spawnSync('node', [path.join(HERE, 'tree_hash.mjs'), '--list', write(d, '_m.txt', 'ghost.html\n'), '--root', d], { encoding: 'utf8' });
  assert.equal(bad.status, 1); assert.match(bad.stderr, /FAIL tree-hash/);
});
