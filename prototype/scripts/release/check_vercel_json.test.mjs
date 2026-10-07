import test from 'node:test';
import assert from 'node:assert/strict';
import { run } from './check_vercel_json.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const SEC = [['X-Content-Type-Options', 'nosniff'], ['X-Frame-Options', 'SAMEORIGIN'], ['Referrer-Policy', 'strict-origin-when-cross-origin'], ['Permissions-Policy', 'camera=()']].map(([key, value]) => ({ key, value }));
const base = (extra = []) => ({ rewrites: [{ source: '/share', destination: '/api/share' }], headers: [{ source: '/(.*)', headers: SEC }, ...extra] });
const IMM = [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }];
const file = (cfg) => write(tmpdir(), 'vercel.json', typeof cfg === 'string' ? cfg : JSON.stringify(cfg));

test('passing fixture: the baseline shape (no immutable rule) passes without --require-immutable', async () => {
  const r = await run(['--file', file(base())]);
  assert.ok(r.ok, r.lines().join('\n'));
});

test('passing fixture: both immutable rules satisfy --require-immutable (either backslash spelling)', async () => {
  const cfg = base([{ source: '/vendor/fonts/(.*)\\.woff2', headers: IMM }, { source: '/vendor/maplibre-4.7.1/(.*)', headers: IMM }]);
  assert.ok((await run(['--file', file(cfg), '--require-immutable'])).ok);
  const cfg2 = base([{ source: '/vendor/fonts/(.*)\\\\.woff2', headers: IMM }, { source: '/vendor/maplibre-4.7.1/(.*)', headers: IMM }]);
  assert.ok((await run(['--file', file(cfg2), '--require-immutable'])).ok);
});

test('failing fixture: an immutable rule on JS fails', async () => {
  const r = await run(['--file', file(base([{ source: '/src/(.*)\\.js', headers: IMM }]))]);
  assert.equal(r.ok, false);
  assert.ok(r.lines().some((l) => /^FAIL immutable-scope \/src\//.test(l)), r.lines().join('\n'));
});

test('failing fixture: --require-immutable without the rules fails; a missing header or rewrite fails', async () => {
  assert.equal((await run(['--file', file(base()), '--require-immutable'])).ok, false);
  const noHeader = base(); noHeader.headers[0].headers = SEC.slice(1);
  assert.ok((await run(['--file', file(noHeader)])).lines().some((l) => /^FAIL security-header x-content-type-options/.test(l)));
  const noRewrite = base(); noRewrite.rewrites = [];
  assert.ok((await run(['--file', file(noRewrite)])).lines().some((l) => /^FAIL rewrite \/share/.test(l)));
});

test('failing fixture: unparsable vercel.json fails', async () => {
  assert.equal((await run(['--file', file('{ nope')])).ok, false);
});
