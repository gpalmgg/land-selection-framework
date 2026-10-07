#!/usr/bin/env node
// Render the site's two Vercel edge functions in plain Node (no `vercel dev`, which cannot run them on this machine).
//
//   node scripts/og_harness.mjs <og|share> "<querystring>" <outfile> [--dump-text FILE]
//
//   node scripts/og_harness.mjs og ""                                  /abs/out/og-default.png
//   node scripts/og_harness.mjs og "page=deeper"                       /abs/out/og-deeper.png
//   node scripts/og_harness.mjs og "region=alentejo"                   /abs/out/og-alentejo.png
//   node scripts/og_harness.mjs og "t.water_stress=0.3&pin=galicia"    /abs/out/og-filtered.png  --dump-text /abs/out/og-filtered.txt.json
//   node scripts/og_harness.mjs share "t.solar_pv=1500"                /abs/out/share.html
//
// What it does
//   * imports <prototype>/api/og.js or api/share.js (default export = the handler) and builds a web Request for
//     https://<host>/api/og (or /share, which vercel.json rewrites to /api/share) with host and x-forwarded-proto headers
//   * answers fetch() itself and records every call. A request to the SAME ORIGIN (https://<host>/vendor/fonts/*.woff, the only
//     thing the card function fetches) is served from <prototype>/vendor/fonts on disk; any other URL is refused and reported as
//     OUTBOUND, so a font (or anything else) fetched from a third party can never go unnoticed
//   * awaits the Response and writes the body to <outfile> (PNG for og, HTML for share)
//   * --dump-text FILE (og only) writes every text node of the Satori element tree as JSON { query, kind, texts: [...] }, in reading
//     order, from lib/og-card.js cardFor(): the same function the edge function renders
//
// Exit codes: 0 ok; 2 FALLBACK (the function answered the 302 to /og.png: a font that would not load or a render error); 3 the
// response was not a PNG; 4 the response status was not 200; 5 a request left the origin (OUTBOUND); 64 usage.
//
// Env
//   PROTOTYPE_DIR   the site to render (default: the prototype/ this script lives in); it needs node_modules/@vercel/og
//   OG_HOST         host in the mock Request (default land-selection-framework.regencommunity.tools)
//   OG_FAIL_FONTS=1 make the same-origin font fetch fail (404): the run must report FALLBACK and exit 2

import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, resolve, join, normalize } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(process.env.PROTOTYPE_DIR || join(here, '..'));
const HOST = process.env.OG_HOST || 'land-selection-framework.regencommunity.tools';
const ORIGIN = `https://${HOST}`;

const argv = process.argv.slice(2);
const dumpAt = argv.indexOf('--dump-text');
let dumpFile = null;
if (dumpAt >= 0) { dumpFile = argv[dumpAt + 1]; argv.splice(dumpAt, 2); }
const [fn, qsRaw = '', outfile] = argv;
if (!['og', 'share'].includes(fn) || !outfile || (dumpAt >= 0 && (!dumpFile || fn !== 'og'))) {
  console.error('usage: node scripts/og_harness.mjs <og|share> "<querystring>" <outfile> [--dump-text FILE]   (--dump-text is for og only)');
  process.exit(64);
}
const qs = qsRaw.replace(/^\?/, '');

// ---- fetch: same origin from disk, everything else refused and recorded ----------------------------------------------------
const seen = [];
globalThis.fetch = async (input) => {
  const raw = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
  let u;
  try { u = new URL(raw, ORIGIN); } catch { seen.push({ url: raw, kind: 'OUTBOUND', note: 'unparseable' }); throw new TypeError(`og_harness: bad URL ${raw}`); }
  // Bundled assets (api/og.js: new URL('../vendor/fonts/x.woff', import.meta.url)) arrive as file: URLs. On Vercel's edge
  // runtime they are part of the function bundle, not a network request; serve them from disk the same way.
  if (u.protocol === 'file:' && normalize(u.pathname).startsWith(join(PROTO, 'vendor', 'fonts') + '/')) {
    if (process.env.OG_FAIL_FONTS === '1') { seen.push({ url: u.href, kind: 'bundled', note: '404 (OG_FAIL_FONTS=1)' }); return new Response('not found', { status: 404 }); }
    const b = readFileSync(normalize(u.pathname));
    seen.push({ url: u.href, kind: 'bundled', note: `200 ${b.length} bytes from disk` });
    return new Response(b, { status: 200 });
  }
  if (u.origin !== ORIGIN) {
    seen.push({ url: u.href, kind: 'OUTBOUND', note: 'refused' });
    throw new TypeError(`og_harness: outbound fetch refused: ${u.href}`);
  }
  if (process.env.OG_FAIL_FONTS === '1' && u.pathname.startsWith('/vendor/fonts/')) {
    seen.push({ url: u.href, kind: 'same-origin', note: '404 (OG_FAIL_FONTS=1)' });
    return new Response('not found', { status: 404 });
  }
  const file = normalize(join(PROTO, u.pathname));
  if (!file.startsWith(PROTO) || !existsSync(file)) {
    seen.push({ url: u.href, kind: 'same-origin', note: '404' });
    return new Response('not found', { status: 404 });
  }
  const buf = readFileSync(file);
  seen.push({ url: u.href, kind: 'same-origin', note: `200 ${buf.length} bytes from disk` });
  return new Response(buf, { status: 200 });
};

// package.json has no "type": node prints a MODULE_TYPELESS warning when importing api/*.js; silence it.
const _emit = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w).includes('MODULE_TYPELESS') || String(a[0]?.code || a[0]).includes('MODULE_TYPELESS') ? undefined : _emit.call(process, w, ...a));

const mod = await import(pathToFileURL(join(PROTO, 'api', fn + '.js')).href);
if (mod.config?.runtime !== 'edge') console.error(`WARNING: api/${fn}.js does not export config.runtime === 'edge' (got ${JSON.stringify(mod.config)})`);

if (dumpFile) {
  const card = await import(pathToFileURL(join(PROTO, 'lib', 'og-card.js')).href);
  const { kind, tree } = card.cardFor(new URLSearchParams(qs));
  mkdirSync(dirname(resolve(dumpFile)), { recursive: true });
  writeFileSync(dumpFile, JSON.stringify({ query: qs, kind, texts: card.textNodes(tree) }, null, 1) + '\n');
  console.log(`text dump (${kind}) -> ${dumpFile}`);
}

const path = fn === 'og' ? '/api/og' : '/share';
const req = new Request(`${ORIGIN}${path}${qs ? '?' + qs : ''}`, { headers: { host: HOST, 'x-forwarded-proto': 'https' } });

const t0 = Date.now();
const res = await mod.default(req);
const ct = res.headers.get('content-type') || '';
let exit = 0;
if (res.status >= 300 && res.status < 400) {
  console.log(`FALLBACK (${res.status} -> ${res.headers.get('location')}). The function caught an error (font fetch or render) and redirected to the static card. This is NOT a rendered card.`);
  exit = 2;
} else {
  const buf = Buffer.from(await res.arrayBuffer());
  mkdirSync(dirname(resolve(outfile)), { recursive: true });
  writeFileSync(outfile, buf);
  console.log(`OK ${res.status} ${ct} ${buf.length} bytes -> ${outfile}`);
  if (res.status !== 200) exit = 4;
  else if (fn === 'og' && !ct.includes('image/png')) { console.log('WARNING: expected image/png'); exit = 3; }
}
console.log(`render ${Date.now() - t0} ms; cache-control: ${res.headers.get('cache-control')}`);
console.log('fetches: ' + (seen.length ? '\n  ' + seen.map((s) => `${s.kind} ${s.url} (${s.note})`).join('\n  ') : 'none'));
if (seen.some((s) => s.kind === 'OUTBOUND')) {
  console.log('OUTBOUND: a request left the origin (see above). Only same-origin /vendor/fonts/ is allowed.');
  exit = exit || 5;
}
process.exit(exit);
