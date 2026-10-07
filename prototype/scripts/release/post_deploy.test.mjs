// post_deploy_checks.sh proven against a fixture server: a good site passes, a redirecting /api/og (the failure fallback) fails,
// staged mode goes through `vercel curl` (stubbed). The script lives in the untracked upgrade folder; the tests skip without it.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { REPO } from './lib.mjs';
import { tmpdir, write } from './test-helpers.mjs';

const SCRIPT = path.join(REPO, 'upgrade-2026-10', 'verify', 'post_deploy_checks.sh');
const PORT = Number(process.env.REL_TOOLS_PORT || 8267);
const skip = fs.existsSync(SCRIPT) ? false : 'post_deploy_checks.sh not present (upgrade folder is not part of the repository)';

function png(seed) {
  const b = Buffer.alloc(30000, seed);
  Buffer.from('89504e470d0a1a0a', 'hex').copy(b, 0);
  b.writeUInt32BE(13, 8); b.write('IHDR', 12, 'latin1'); b.writeUInt32BE(1200, 16); b.writeUInt32BE(630, 20);
  return b;
}
const REGIONS_JS = `export const regions = [\n  {\n    id: 'alentejo',\n    coords: [1, 2],\n  },\n  {\n    id: 'galicia',\n    coords: [3, 4],\n  },\n];\n`;
const SITEMAP = `<urlset><url><loc>https://x.test/</loc></url><url><loc>https://x.test/deeper.html</loc></url><url><loc>https://x.test/region/alentejo.html</loc></url><url><loc>https://x.test/region/galicia.html</loc></url></urlset>`;

function serve(opts = {}) {
  const sec = opts.noHeaders ? {} : { 'x-content-type-options': 'nosniff', 'x-frame-options': 'SAMEORIGIN', 'referrer-policy': 'strict-origin-when-cross-origin', 'permissions-policy': 'camera=()' };
  const server = http.createServer((req, res) => {
    const u = new URL(req.url, 'http://localhost');
    const send = (code, type, body, extra = {}) => { res.writeHead(code, { 'content-type': type, ...sec, ...extra }); res.end(body); };
    if (u.pathname === '/api/og') {
      if (opts.redirectOg) return send(302, 'text/plain', '', { location: '/og.png' });
      const region = u.searchParams.get('region');
      return send(200, 'image/png', png(opts.identicalCards ? 7 : region === 'alentejo' ? 1 : region === 'galicia' ? 2 : 3));
    }
    if (u.pathname === '/share') return send(200, 'text/html; charset=utf-8', '<html><head><meta property="og:image" content="https://x.test/api/og?t.solar_pv=1500"></head></html>');
    if (u.pathname === '/') return send(200, 'text/html', '<html><h1>Home</h1></html>');
    if (u.pathname === '/deeper.html' || u.pathname === '/region/alentejo.html') return send(200, 'text/html', '<html></html>');
    if (u.pathname === '/sitemap.xml') return send(200, 'application/xml', opts.sitemap || SITEMAP);
    if (u.pathname === '/robots.txt') return send(200, 'text/plain', 'User-agent: *\n');
    if (u.pathname === '/data/regions.js') return send(200, 'text/javascript', REGIONS_JS);
    return send(404, 'text/plain', 'not found');
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(PORT, '127.0.0.1', () => resolve(server)); });
}
const runScript = (args, env = {}) => new Promise((resolve) => {
  const p = spawn('bash', [SCRIPT, ...args], { env: { ...process.env, ...env } });
  let out = ''; p.stdout.on('data', (d) => { out += d; }); p.stderr.on('data', (d) => { out += d; });
  p.on('close', (code) => resolve({ code, out }));
});
const withServer = async (opts, fn) => { const s = await serve(opts); try { return await fn(); } finally { await new Promise((r) => s.close(r)); } };

test('good fixture passes the baseline and static profiles', { skip }, async () => {
  await withServer({}, async () => {
    const a = await runScript(['--live', `http://127.0.0.1:${PORT}`, '--profile', 'baseline', '--new-region', 'galicia']);
    assert.equal(a.code, 0, a.out);
    assert.match(a.out, /PASS og-distinct/);
    const b = await runScript(['--live', `http://127.0.0.1:${PORT}`, '--profile', 'static']);
    assert.equal(b.code, 0, b.out);
    assert.match(b.out, /PASS sitemap-regions: 2 region pages/);
  });
});

test('failing fixture: a redirecting /api/og exits 1 and the 302 is named', { skip }, async () => {
  await withServer({ redirectOg: true }, async () => {
    const r = await runScript(['--live', `http://127.0.0.1:${PORT}`, '--profile', 'baseline', '--new-region', 'galicia']);
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL og-card default: status 302 location \/og\.png/);
  });
});

test('failing fixtures: identical cards, missing security headers, a sitemap with the wrong count', { skip }, async () => {
  await withServer({ identicalCards: true }, async () => {
    const r = await runScript(['--live', `http://127.0.0.1:${PORT}`, '--profile', 'baseline', '--new-region', 'galicia']);
    assert.equal(r.code, 1); assert.match(r.out, /FAIL og-distinct/);
  });
  await withServer({ noHeaders: true }, async () => {
    const r = await runScript(['--live', `http://127.0.0.1:${PORT}`, '--profile', 'baseline', '--new-region', 'galicia']);
    assert.equal(r.code, 1); assert.match(r.out, /FAIL security-header x-frame-options/);
  });
  await withServer({ sitemap: SITEMAP.replace('<url><loc>https://x.test/region/galicia.html</loc></url>', '') }, async () => {
    const r = await runScript(['--live', `http://127.0.0.1:${PORT}`, '--profile', 'static']);
    assert.equal(r.code, 1); assert.match(r.out, /FAIL sitemap-regions: 1 region pages in the sitemap, 2 region ids/);
  });
});

test('staged mode fetches through `vercel curl <path> --deployment <url> --` and never follows a redirect', { skip }, async () => {
  const bin = tmpdir(); const log = path.join(bin, 'calls.log');
  write(bin, 'vercel', `#!/usr/bin/env bash\necho "$@" >> "${log}"\n[ "$1" = "curl" ] || exit 9\npath="$2"; dep="$4"; shift 5\nexec curl "$@" "$dep$path"\n`);
  fs.chmodSync(path.join(bin, 'vercel'), 0o755);
  await withServer({ redirectOg: true }, async () => {
    const r = await runScript(['--staged', `http://127.0.0.1:${PORT}`, '--profile', 'baseline', '--new-region', 'galicia'], { PATH: `${bin}:${process.env.PATH}` });
    assert.equal(r.code, 1, r.out);
    assert.match(r.out, /FAIL og-card default: status 302/);
    assert.match(r.out, /PASS 200 \/:/);
  });
  const calls = fs.readFileSync(log, 'utf8');
  assert.match(calls, /^curl \/ --deployment http:\/\/127\.0\.0\.1:\d+ -- -sS /m);
  assert.doesNotMatch(calls, / -L| --location/);
});

test('argument errors exit 64 and the static profile refuses staged mode', { skip }, async () => {
  assert.equal((await runScript([])).code, 64);
  assert.equal((await runScript(['--staged', 'https://x.test', '--profile', 'static'])).code, 64);
  assert.equal((await runScript(['--live', 'https://x.test', '--profile', 'nope'])).code, 64);
});
