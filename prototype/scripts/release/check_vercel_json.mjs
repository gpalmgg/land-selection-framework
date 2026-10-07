#!/usr/bin/env node
// check_vercel_json.mjs [--root DIR] [--file F] [--require-immutable]
//
// vercel.json must keep the four security headers and the /share rewrite, and may cache `immutable` ONLY the two
// vendored, version-named trees (fonts and MapLibre 4.7.1): never JS, CSS, data or HTML (they must revalidate).
// `--require-immutable` (final site only) additionally requires both immutable rules; the baseline copy has none.
import fs from 'node:fs';
import path from 'node:path';
import { Report, parseArgs, cli, PROTO } from './lib.mjs';

const SECURITY = ['x-content-type-options', 'x-frame-options', 'referrer-policy', 'permissions-policy'];
// Compared with every backslash removed, so both `\.woff2` and the JSON-escaped `\\.woff2` spelling are accepted.
const IMMUTABLE_SOURCES = ['/vendor/fonts/(.*).woff2', '/vendor/maplibre-4.7.1/(.*)'];
const norm = (s) => String(s).replace(/\\+/g, '');

export async function run(argv) {
  const o = parseArgs(argv, { value: ['root', 'file'], flag: ['require-immutable'] });
  const file = path.resolve(o.file || path.join(o.root || PROTO, 'vercel.json'));
  const rep = new Report();
  let cfg;
  try { cfg = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { rep.fail('vercel.json parse', `${file}: ${e.message}`); return rep; }
  rep.pass('vercel.json parse', file);

  const rules = Array.isArray(cfg.headers) ? cfg.headers : [];
  const seen = new Map();
  for (const rule of rules) for (const h of rule.headers || []) {
    const k = String(h.key).toLowerCase();
    if (SECURITY.includes(k) && !seen.has(k) && String(h.value || '').trim()) seen.set(k, h.value);
  }
  for (const k of SECURITY) rep.assert(seen.has(k), `security-header ${k}`, `present: ${seen.get(k)}`, 'missing from vercel.json headers');

  const rewrites = Array.isArray(cfg.rewrites) ? cfg.rewrites : [];
  const share = rewrites.find((r) => r && r.source === '/share' && r.destination === '/api/share');
  rep.assert(!!share, 'rewrite /share', '/share -> /api/share', 'rewrite {"source": "/share", "destination": "/api/share"} is missing');

  const immutableSources = [];
  for (const rule of rules) {
    const immutable = (rule.headers || []).some((h) => /immutable/i.test(String(h.value)));
    if (!immutable) continue;
    immutableSources.push(rule.source);
    const allowed = IMMUTABLE_SOURCES.includes(norm(rule.source));
    rep.assert(allowed, `immutable-scope ${rule.source}`, 'immutable caching is limited to the vendored fonts / maplibre-4.7.1 trees',
      `immutable caching on ${rule.source}: only /vendor/fonts/(.*)\\.woff2 and /vendor/maplibre-4.7.1/(.*) may be immutable (never JS, CSS, data or HTML)`);
  }
  if (!immutableSources.length) rep.pass('immutable-scope', 'no immutable rule');
  if (o['require-immutable']) {
    for (const want of IMMUTABLE_SOURCES) {
      rep.assert(immutableSources.some((s) => norm(s) === want), `immutable-required ${want}`, 'rule present', `no immutable header rule for ${want}`);
    }
  }
  return rep;
}

cli(import.meta.url, 'check_vercel_json', run);
