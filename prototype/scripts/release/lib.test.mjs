import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs, regionIds, readDeployList, Report, walk } from './lib.mjs';
import { tmpdir, write } from './test-helpers.mjs';

test('parseArgs handles values, flags, lists and positionals', () => {
  const o = parseArgs(['--root', 'x', '--paths', 'a', 'b', '--require-immutable', 'pos', '--file=f'], { value: ['root', 'file'], flag: ['require-immutable'], list: ['paths'] });
  assert.equal(o.root, 'x'); assert.equal(o.file, 'f'); assert.deepEqual(o.paths, ['a', 'b']); assert.equal(o['require-immutable'], true); assert.deepEqual(o._, ['pos']);
  assert.throws(() => parseArgs(['--nope'], {}), /unknown option/);
  assert.throws(() => parseArgs(['--root'], { value: ['root'] }), /needs a value/);
});

test('regionIds counts "id: x, ... coords:" objects only', () => {
  const text = `export const criteria = [ { id: 'solar_pv', unit: 'x', step: 1 } ];\nexport const regions = [\n  {\n    id: 'a-b',\n    continent: 'europe',\n    coords: [1,2],\n  },\n  { id: 'c', coords: [3,4] } ];`;
  assert.deepEqual(regionIds(text), ['a-b', 'c']);
});

test('Report.lines prints PASS/FAIL and ok is false when empty or failing', () => {
  const r = new Report();
  assert.equal(r.ok, false);
  r.pass('a', 'fine'); assert.equal(r.ok, true); r.fail('b', 'bad\nline'); assert.equal(r.ok, false);
  assert.deepEqual(r.lines(), ['PASS a: fine', 'FAIL b: bad line']);
});

test('readDeployList drops summary lines and keeps paths', () => {
  const d = tmpdir(); const f = write(d, 'list.txt', 'deploy list with x: 2 files\nindex.html\ndata/a.js\nUNCHANGED: same\n');
  const l = readDeployList(f, d);
  assert.deepEqual(l.files, ['data/a.js', 'index.html']); assert.equal(l.expanded, false);
});

test('readDeployList expands a summary-only file with deploy_filelist.py --list', { skip: !fs.existsSync('/usr/bin/python3') }, () => {
  const site = tmpdir(); write(site, 'index.html', '<h1>x</h1>'); write(site, 'scripts/gen.mjs', '1'); write(site, '.vercelignore', 'scripts/\n');
  const f = write(tmpdir(), 'list.txt', 'deploy list with the site\'s own .vercelignore: 2 files\nabsent: tests/\n');
  const l = readDeployList(f, site);
  assert.equal(l.expanded, true);
  assert.ok(l.files.includes('index.html')); assert.ok(!l.files.includes('scripts/gen.mjs'));
});

test('walk skips named directories', () => {
  const d = tmpdir(); write(d, 'a/x.js', ''); write(d, 'vendor/y.js', ''); write(d, 'z.css', '');
  assert.deepEqual(walk(d, { skipDirs: ['vendor'] }), ['a/x.js', 'z.css']);
  fs.rmSync(d, { recursive: true });
});
