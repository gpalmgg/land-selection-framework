#!/usr/bin/env node
// Mutation check: "a suite that cannot fail is not a gate".
// Copies the shipped tree (data/, lib/, src/, api/, *.html; not raw/, .venv, node_modules) to a scratch folder under
// os.tmpdir(), applies six mutations ONE AT A TIME, runs the data suite on the copy (LSF_ROOT=<copy>, --strict so debt is
// ignored) and requires that each mutation produces a failure that the unmutated copy did not have, in the test that is
// supposed to guard it. The real tree is never written.
//
//   node tests/mutation-check.mjs          exit 0 only when every mutation is caught ("6 of 6 mutations caught")
//
// The copy runs with LSF_WAVE_ISOLATION=1 (the mutations target regions.js / land-standing.js, which no neighbour WP edits);
// set MUTATION_FULL=1 to run with every present data file instead.
import { cpSync, mkdtempSync, readFileSync, writeFileSync, rmSync, readdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import os from 'node:os';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const REAL_ROOT = path.resolve(here, '..');
const REAL_REPO = process.env.LSF_REPO || path.resolve(REAL_ROOT, '..');
const tmpBase = mkdtempSync(path.join(os.tmpdir(), 'lsf-mutation-'));
const copy = path.join(tmpBase, 'prototype');

// ---- copy the tree -------------------------------------------------------------------------------------------
const skip = /(^|\/)(raw|\.venv|node_modules|v1-exports|research-dossier|__pycache__|vendor|public|notebooks|region|tests)(\/|$)|\.(bak|png|jpg|pdf|woff2?)$/;
for (const d of ['data', 'lib', 'src', 'api']) {
  const from = path.join(REAL_ROOT, d);
  if (existsSync(from)) cpSync(from, path.join(copy, d), { recursive: true, filter: (s) => !skip.test(path.relative(REAL_ROOT, s)) });
}
for (const f of readdirSync(REAL_ROOT)) if (/\.(html|json|xml|txt)$/.test(f) && !/package-lock/.test(f)) cpSync(path.join(REAL_ROOT, f), path.join(copy, f));

// ---- text helpers --------------------------------------------------------------------------------------------
// Index of the `}` matching the `{` at `open`, skipping string literals and comments.
function matchBrace(s, open) {
  let depth = 0;
  for (let i = open; i < s.length; i++) {
    const c = s[i];
    if (c === '/' && s[i + 1] === '/') { i = s.indexOf('\n', i); if (i < 0) return -1; continue; }
    if (c === '/' && s[i + 1] === '*') { i = s.indexOf('*/', i) + 1; continue; }
    if (c === "'" || c === '"' || c === '`') { for (i++; i < s.length && s[i] !== c; i++) if (s[i] === '\\') i++; continue; }
    if (c === '{') depth++;
    else if (c === '}' && --depth === 0) return i;
  }
  return -1;
}
const entryRe = /^ {2}(['"]?)([a-z][a-z0-9-]*)\1: \{[ \t]*$/m; // a top-level region entry in land-standing.js
function firstEntry(text, prefer = 'galicia') {
  const pref = new RegExp(`^ {2}(['"]?)${prefer}\\1: \\{[ \\t]*$`, 'm');
  return text.match(pref) || text.match(entryRe);
}

// ---- the six mutations ---------------------------------------------------------------------------------------
const mutations = [
  { name: 'add a `score: 3` key to a land-standing entry', file: 'data/land-standing.js', expect: /NO scoring/i,
    apply: (t) => { const m = firstEntry(t, 'alentejo'); if (!m) return null; const at = m.index + m[0].length; return `${t.slice(0, at)}\n    score: 3,${t.slice(at)}`; } },
  { name: 'delete a land-standing entry', file: 'data/land-standing.js', expect: /land standing/i,
    apply: (t) => { const m = firstEntry(t, 'galicia'); if (!m) return null; const open = m.index + m[0].lastIndexOf('{'); const close = matchBrace(t, open); if (close < 0) return null; let end = close + 1; if (t[end] === ',') end++; return t.slice(0, m.index) + t.slice(end).replace(/^\n/, ''); } },
  { name: 'add a region with no `values`', file: 'data/regions.js', expect: /values: every region x criterion/i,
    apply: (t) => { const m = t.match(/export const regions = \[\s*\n/); if (!m) return null; const at = m.index + m[0].length; return `${t.slice(0, at)}  { id: 'zz-mutant', continent: 'europe', name: 'Mutant', country: 'Nowhere', coords: [10, 50], blurb: 'A region with no values.', accent: '#abcdef' },\n${t.slice(at)}`; } },
  { name: 'set a cell `value: null` without `nullReason`', file: 'data/regions.js', expect: /values: every region x criterion/i,
    // cells are tuples [value, label, trajectory, prior, note] inside block('<id>', { criterion: [...] }); a literal `value:` form also works
    apply: (t) => { const v = t.search(/export const values\b/); if (v < 0) return null; const re = /(^[ \t]+[a-z_]+: \[)-?\d[\d.]*(?=,)|\bvalue:\s*-?\d[\d.]*/gm; re.lastIndex = v; const m = re.exec(t); if (!m) return null; const rep = m[1] ? `${m[1]}null` : 'value: null'; return `${t.slice(0, m.index)}${rep}${t.slice(m.index + m[0].length)}`; } },
  { name: 'put the word "candidate" in a blurb', file: 'data/regions.js', expect: /banned framing/i,
    apply: (t) => { const m = t.match(/blurb:\s*(['"`])/); if (!m) return null; const at = m.index + m[0].length; return `${t.slice(0, at)}A candidate area. ${t.slice(at)}`; } },
  { name: "set a cell trajectory direction to 'better'", file: 'data/regions.js', expect: /v2 cell fields/i,
    // tuple trajectory is ['rising'|'falling'|'steady', delta]; the literal `trajectory: { direction }` form also works
    apply: (t) => { const v = t.search(/export const values\b/); if (v < 0) return null; const re = /\['(?:rising|falling|steady)'(?=,)/g; re.lastIndex = v; const m = re.exec(t); if (m) return `${t.slice(0, m.index)}['better'${t.slice(m.index + m[0].length)}`; const re2 = /\bvalue:\s*-?\d[\d.]*,/g; re2.lastIndex = v; const m2 = re2.exec(t); if (!m2) return null; const at = m2.index + m2[0].length; return `${t.slice(0, at)} trajectory: { status: 'measured', direction: 'better' },${t.slice(at)}`; } },
];

// ---- run the suite on the copy --------------------------------------------------------------------------------
function suite(label) {
  const out = path.join(tmpBase, `${label}.json`);
  const r = spawnSync('node', [path.join(here, 'run.mjs'), '--strict', '--quiet', '--json', out], {
    encoding: 'utf8', cwd: copy,
    env: { ...process.env, LSF_ROOT: copy, LSF_REPO: REAL_REPO, LSF_WAVE_ISOLATION: process.env.MUTATION_FULL === '1' ? '' : '1', NODE_NO_WARNINGS: '1', LSF_TODAY: process.env.LSF_TODAY || '' },
  });
  if (!existsSync(out)) throw new Error(`suite did not produce results for ${label}: ${r.stderr || r.stdout}`);
  return JSON.parse(readFileSync(out, 'utf8')).results.filter((x) => x.status === 'fail');
}
const sig = (f) => `${f.name}\u0000${String(f.message).split(tmpBase).join('<tmp>').replace(/\(\d+(\.\d+)?ms\)/g, '')}`;

let caught = 0;
try {
  const base = suite('baseline');
  const baseSigs = new Set(base.map(sig));
  console.log(`mutation-check: unmutated copy has ${base.length} known failing test(s) (the suite runs --strict, debt ignored); only NEW failures count`);
  for (const [i, m] of mutations.entries()) {
    const file = path.join(copy, m.file);
    const original = readFileSync(file, 'utf8');
    const mutated = m.apply(original);
    if (mutated == null || mutated === original) { console.log(`  ${i + 1}. NOT APPLIED  ${m.name}: the mutation pattern was not found in ${m.file} (update mutation-check.mjs)`); continue; }
    writeFileSync(file, mutated);
    let fails;
    try { fails = suite(`m${i + 1}`); } finally { writeFileSync(file, original); }
    const fresh = fails.filter((f) => !baseSigs.has(sig(f)));
    const hit = fresh.find((f) => m.expect.test(f.name));
    if (hit) { caught++; console.log(`  ${i + 1}. caught       ${m.name}\n       by: ${hit.name}`); }
    else console.log(`  ${i + 1}. NOT CAUGHT   ${m.name}: no new failure in a test matching ${m.expect}${fresh.length ? ` (other new failures: ${fresh.map((f) => f.name).join(' | ')})` : ''}`);
  }
} finally {
  rmSync(tmpBase, { recursive: true, force: true });
}
console.log(`\nmutation-check: ${caught} of ${mutations.length} mutations caught`);
process.exit(caught === mutations.length ? 0 : 1);
