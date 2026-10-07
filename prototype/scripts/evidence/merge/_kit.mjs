// Test helpers for the merge toolkit tests (not a test file). Everything is copied into os.tmpdir().
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROTO = path.resolve(HERE, '..', '..', '..');
export const FIX = path.join(PROTO, 'tests/fixtures/merge');
export const REAL_REVERIFY = path.resolve(PROTO, '..', 'upgrade-2026-10/reverify');
export const script = (name) => path.join(HERE, name);

export function tmp(prefix = 'lsf-merge-') { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }
export function copyTree(src, dst) { fs.cpSync(src, dst, { recursive: true }); return dst; }
export function copyFixtureRoot() { return copyTree(path.join(FIX, 'root'), path.join(tmp(), 'root')); }
export const read = (p) => fs.readFileSync(p, 'utf8');
export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export function write(p, text) { fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, typeof text === 'string' ? text : `${JSON.stringify(text, null, 2)}\n`); }

// Run a CLI script; never throws. Returns { code, out, err }.
export function cli(name, args = [], opts = {}) {
  try {
    const out = execFileSync('node', [script(name), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, NODE_NO_WARNINGS: '1', ...(opts.env || {}) }, cwd: opts.cwd || PROTO });
    return { code: 0, out, err: '' };
  } catch (e) { return { code: e.status ?? 1, out: String(e.stdout || ''), err: String(e.stderr || '') }; }
}
// A scratch evidence-out/upgrade layout around a fixture reverify dir.
export function scratchUpg({ reverify = path.join(FIX, 'reverify') } = {}) {
  const upg = tmp('lsf-upg-');
  copyTree(reverify, path.join(upg, 'reverify'));
  fs.mkdirSync(path.join(upg, 'evidence-out'), { recursive: true });
  return { upg, out: path.join(upg, 'evidence-out'), rev: path.join(upg, 'reverify') };
}
