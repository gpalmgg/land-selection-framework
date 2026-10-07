import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from './check_result_files.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const f = (obj) => write(tmpdir(), 'r.json', typeof obj === 'string' ? obj : JSON.stringify(obj));

test('passing fixture: status pass with zero failures and known issues', async () => {
  const r = await run([f({ status: 'pass', suites: [{ name: 'pages', pass: 10, fail: 0, known: 3, skip: 0 }], failures: [] })]);
  assert.ok(r.ok, r.lines().join('\n'));
});

test('failing fixture: a result JSON with status fail', async () => {
  const r = await run([f({ status: 'fail', suites: [{ name: 'pages', pass: 10, fail: 2 }], failures: [{ test: 'x' }, { test: 'y' }] })]);
  assert.equal(r.ok, false);
  assert.ok(r.lines()[0].startsWith('FAIL result r.json'), r.lines().join('\n'));
});

test('failing fixtures: skipped status, hidden failures under a passing status, unreadable, missing, no files', async () => {
  assert.equal((await run([f({ status: 'skipped' })])).ok, false);
  assert.equal((await run([f({ status: 'pass', suites: [{ name: 'a', fail: 1 }] })])).ok, false);
  assert.equal((await run([f({ status: 'pass', failures: ['x'] })])).ok, false);
  assert.equal((await run([f('{ nope')])).ok, false);
  assert.equal((await run(['/nonexistent/result.json'])).ok, false);
  assert.equal((await run([])).ok, false);
});

test('one bad file among good ones fails the run and all files are reported', async () => {
  const r = await run([f({ status: 'pass' }), f({ status: 'fail' })]);
  assert.equal(r.rows.length, 2); assert.equal(r.ok, false);
});
