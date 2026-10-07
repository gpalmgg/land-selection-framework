import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { run } from './check_edge_bundle.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const OK_OG = `export const config = { runtime: 'edge' };\nexport default async function handler(req) { return new Response('og ' + (process.env.X || '')); }\n`;
const OK_SHARE = `import { helper } from '../lib/helper.js';\nexport const config = { runtime: 'edge' };\nexport default async function handler(req) { return new Response(helper()); }\n`;

function site({ og = OK_OG, share = OK_SHARE } = {}) {
  const d = tmpdir();
  write(d, 'api/og.js', og); write(d, 'api/share.js', share); write(d, 'lib/helper.js', 'export const helper = () => "x";\n');
  return d;
}
function baselines(d, og = 100000, share = 100000) { return write(d, 'baselines.json', JSON.stringify({ edge_bundle_bytes: { 'api/og.js': og, 'api/share.js': share } })); }

test('passing fixture: bundles, edge config present, within the baseline budget', async () => {
  const d = site(); const b = baselines(d);
  const r = await run(['--root', d, '--baselines', b]);
  assert.ok(r.ok, r.lines().join('\n'));
  assert.ok(r.lines().some((l) => l.startsWith('PASS esbuild')));
});

test('failing fixture: a node: import fails the esbuild step', async () => {
  const d = site({ og: `import fs from 'node:fs';\nexport const config = { runtime: 'edge' };\nexport default async function h() { return new Response(fs.readFileSync('x', 'utf8')); }\n` });
  const r = await run(['--root', d, '--baselines', baselines(d)]);
  assert.equal(r.ok, false);
  assert.ok(r.lines().some((l) => /^FAIL esbuild/.test(l)), r.lines().join('\n'));
});

test('failing fixture: process.cwd and require( in the bundle are rejected, process.env is not', async () => {
  const d = site({ og: `export const config = { runtime: 'edge' };\nexport default async function h() { return new Response(String(process.cwd()) + eval('require(1)')); }\n` });
  const r = await run(['--root', d, '--baselines', baselines(d)]);
  assert.equal(r.ok, false);
  assert.ok(r.lines().some((l) => /^FAIL edge-apis api\/og\.js: bundle contains .*process\.cwd/.test(l) && /require\(/.test(l)), r.lines().join('\n'));
});

test('failing fixture: a missing edge runtime config is rejected', async () => {
  const d = site({ share: OK_SHARE.replace("export const config = { runtime: 'edge' };", "export const config = { runtime: 'nodejs' };") });
  const r = await run(['--root', d, '--baselines', baselines(d)]);
  assert.ok(r.lines().some((l) => /^FAIL edge-runtime api\/share\.js/.test(l)));
});

test('failing fixture: a bundle above baseline + 150,000 bytes is rejected', async () => {
  const d = site({ og: OK_OG + `export const big = "${'x'.repeat(200000)}";\n` });
  const r = await run(['--root', d, '--baselines', baselines(d, 1000, 100000)]);
  assert.ok(r.lines().some((l) => /^FAIL size api\/og\.js/.test(l)), r.lines().join('\n'));
});

test('--record writes the measured baseline instead of comparing', async () => {
  const d = site(); const f = path.join(d, 'rec.json');
  const r = await run(['--root', d, '--record', f]);
  assert.ok(r.ok, r.lines().join('\n'));
  const j = JSON.parse(fs.readFileSync(f, 'utf8'));
  assert.ok(j.edge_bundle_bytes['api/og.js'] > 0 && j.edge_bundle_bytes['api/share.js'] > 0);
});
