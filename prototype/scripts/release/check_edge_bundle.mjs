#!/usr/bin/env node
// check_edge_bundle.mjs [--root DIR] [--record FILE] [--baselines FILE]
//
// Proves api/og.js and api/share.js still bundle for the Vercel edge runtime (P-EDGE):
//   npx --no-install esbuild api/og.js api/share.js --bundle --format=esm --platform=neutral --external:@vercel/og --outdir=<tmp>
// esbuild fails on a node: import or an unresolved import; the bundles are then grepped for Node-only APIs and
// compared with the pinned baseline size (+ 150,000 bytes). `--record FILE` measures the baseline bundles of --root
// (the pinned 6bce1a3 copy) and merges them into FILE instead of comparing.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Report, parseArgs, cli, PROTO, BASELINES_FILE, readJson, writeJsonMerged, fmtBytes } from './lib.mjs';

export const ENTRIES = ['api/og.js', 'api/share.js'];
export const SIZE_BUDGET = 150000;
const EDGE_CONFIG = /export\s+const\s+config\s*=\s*\{\s*runtime\s*:\s*['"]edge['"]\s*,?\s*\}/;
// process.env is available on the edge runtime and is deliberately NOT listed.
export const FORBIDDEN = [
  ['node:', /\bnode:[a-z_/]+/],
  ['require(', /\brequire\s*\(/],
  ['__dirname', /\b__dirname\b/],
  ['__filename', /\b__filename\b/],
  ['fs.readFileSync', /\bfs\s*\.\s*readFileSync\b/],
  ['process.cwd', /\bprocess\s*\.\s*cwd\b/],
];

export async function run(argv) {
  const o = parseArgs(argv, { value: ['root', 'record', 'baselines'] });
  const root = path.resolve(o.root || PROTO);
  const rep = new Report();
  const sources = {};
  for (const e of ENTRIES) {
    const f = path.join(root, e);
    if (!fs.existsSync(f)) { rep.fail(`edge-source ${e}`, `missing under ${root}`); continue; }
    sources[e] = f;
    const src = fs.readFileSync(f, 'utf8');
    rep.assert(EDGE_CONFIG.test(src), `edge-runtime ${e}`, "has export const config = { runtime: 'edge' }", "does not export config = { runtime: 'edge' }");
  }
  if (Object.keys(sources).length !== ENTRIES.length) return rep;

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lsf-edge-'));
  try {
    const args = ['--no-install', 'esbuild', ...ENTRIES, '--bundle', '--format=esm', '--platform=neutral',
      '--external:@vercel/og', `--outdir=${tmp}`, '--log-level=error', '--loader:.json=json'];
    const r = spawnSync('npx', args, { cwd: root, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
    if (r.error || r.status !== 0) {
      rep.fail('esbuild', `exit ${r.status}${r.error ? ' ' + r.error.message : ''}: ${((r.stderr || '') + (r.stdout || '')).replace(/\s+/g, ' ').trim().slice(0, 400)}`);
      return rep;
    }
    rep.pass('esbuild', `bundled ${ENTRIES.join(' and ')} for the neutral platform with only @vercel/og external`);
    const sizes = {};
    for (const e of ENTRIES) {
      const out = path.join(tmp, path.basename(e));
      if (!fs.existsSync(out)) { rep.fail(`bundle ${e}`, 'esbuild wrote no output'); continue; }
      const text = fs.readFileSync(out, 'utf8');
      sizes[e] = Buffer.byteLength(text);
      const hits = FORBIDDEN.filter(([, re]) => re.test(text)).map(([n]) => n);
      rep.assert(hits.length === 0, `edge-apis ${e}`, 'no node:, require(, __dirname, __filename, fs.readFileSync or process.cwd in the bundle', `bundle contains ${hits.join(', ')}`);
    }
    if (o.record) {
      const baseSites = { recorded_from: root };
      writeJsonMerged(path.resolve(o.record), { edge_bundle_bytes: { ...sizes }, edge_bundle_recorded_from: baseSites.recorded_from });
      for (const e of ENTRIES) if (sizes[e] !== undefined) rep.pass(`record ${e}`, `baseline bundle ${fmtBytes(sizes[e])} written to ${o.record}`);
    } else {
      const bf = path.resolve(o.baselines || BASELINES_FILE);
      let base = null;
      try { base = readJson(bf).edge_bundle_bytes; } catch { /* reported below */ }
      for (const e of ENTRIES) {
        if (sizes[e] === undefined) continue;
        if (!base || typeof base[e] !== 'number') { rep.fail(`size ${e}`, `no recorded baseline in ${bf} (run with --record on the baseline copy)`); continue; }
        const limit = base[e] + SIZE_BUDGET;
        rep.assert(sizes[e] <= limit, `size ${e}`, `${fmtBytes(sizes[e])} <= baseline ${fmtBytes(base[e])} + ${fmtBytes(SIZE_BUDGET)}`, `${fmtBytes(sizes[e])} exceeds baseline ${fmtBytes(base[e])} + ${fmtBytes(SIZE_BUDGET)} = ${fmtBytes(limit)}`);
      }
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  return rep;
}

cli(import.meta.url, 'check_edge_bundle', run);
