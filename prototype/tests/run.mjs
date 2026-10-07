#!/usr/bin/env node
// Ratchet runner for the data test suite (node:test `run()` API, zero dependencies).
//
//   node tests/run.mjs                    run every tests/*.test.mjs (NOT recursive: tests/e2e and tests/core are other suites)
//   node tests/run.mjs --only a,b         only files whose name (without .test.mjs) is a or b
//   node tests/run.mjs --strict           ignore tests/debt.json (the final gate); also sets LSF_STRICT=1 (gate-mode checks)
//   node tests/run.mjs --debt FILE        alternate debt file (default tests/debt.json, or $LSF_DEBT)
//   node tests/run.mjs --json FILE        write every result as JSON (used by mutation-check.mjs)
//
// Ratchet semantics (plan decision):
//   * a failing test that is NOT in debt.json                  -> exit 1
//   * a debt entry whose test now passes                       -> WARNING only (nobody edits debt.json; --strict is the gate)
//   * a skipped test is printed with its reason, never counted as a pass
//   * --strict: every failure fails, debt ignored
// Env: LSF_ROOT, LSF_REPO, REQUIRE_V2=1, CHECK_PAGES=1, LSF_WAVE_ISOLATION=1 (treat wave-0 neighbour files as absent).
import { run } from 'node:test';
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const strict = flag('--strict');
const only = (opt('--only') || '').split(',').map((s) => s.trim()).filter(Boolean);
const debtFile = opt('--debt') || process.env.LSF_DEBT || path.join(here, 'debt.json');
const jsonOut = opt('--json');
const quiet = flag('--quiet');

process.env.NODE_NO_WARNINGS = '1'; // the data modules are typeless ESM; the reparse notice is noise
if (strict) process.env.LSF_STRICT = '1';

const all = readdirSync(here).filter((f) => f.endsWith('.test.mjs')).sort();
const names = new Map(all.map((f) => [f.replace(/\.test\.mjs$/, ''), f]));
for (const o of only) if (!names.has(o)) { console.error(`run.mjs: no test file "${o}.test.mjs" (have: ${[...names.keys()].join(', ')})`); process.exit(2); }
const files = (only.length ? only.map((o) => names.get(o)) : all).map((f) => path.join(here, f));

let debt = [];
if (!strict) {
  if (!existsSync(debtFile)) { console.error(`run.mjs: debt file ${debtFile} missing (use --strict to ignore debt)`); process.exit(2); }
  debt = JSON.parse(readFileSync(debtFile, 'utf8'));
}
const debtByName = new Map(debt.map((d) => [d.test, d]));

const results = []; // { file, name, status: pass|fail|skip, reason?, message? }
const warnings = [];
const stderrNotes = new Set();
const stream = run({ files, concurrency: files.length, cwd: path.resolve(here, '..') });
const rel = (f) => (f ? path.basename(f) : '?');
const errMessage = (e) => { if (!e) return ''; const c = e.cause && (e.cause.message || String(e.cause)); return String(c || e.message || e); };
for await (const ev of stream) {
  const d = ev.data;
  if (ev.type === 'test:pass' || ev.type === 'test:fail') {
    if (d.nesting !== 0) continue;
    if (ev.type === 'test:fail') results.push({ file: rel(d.file), name: d.name, status: 'fail', message: errMessage(d.details && d.details.error) });
    else if (d.skip) results.push({ file: rel(d.file), name: d.name, status: 'skip', reason: typeof d.skip === 'string' ? d.skip : 'skipped' });
    else results.push({ file: rel(d.file), name: d.name, status: 'pass' });
  } else if (ev.type === 'test:diagnostic') {
    if (/^WARN\b/.test(d.message)) warnings.push(`${rel(d.file)}: ${d.message}`);
  } else if (ev.type === 'test:stderr' || ev.type === 'test:stdout') {
    const m = String(d.message || '').trim();
    if (m && /WARNING|LOUD/.test(m)) stderrNotes.add(m);
  }
}

// A file that fails to load is reported by node:test as a failing "test" named after the file path; keep it as a failure.
const failing = results.filter((r) => r.status === 'fail');
const dupes = results.filter((r, i) => results.findIndex((x) => x.name === r.name) !== i);
const newFailures = strict ? failing : failing.filter((r) => !debtByName.has(r.name));
const knownFailures = strict ? [] : failing.filter((r) => debtByName.has(r.name));
const ranNames = new Set(results.map((r) => r.name));
const ranFiles = new Set(results.map((r) => r.file));
const staleDebt = strict ? [] : debt.filter((d) => results.some((r) => r.name === d.test && r.status === 'pass'));
const skippedDebt = strict ? [] : debt.filter((d) => results.some((r) => r.name === d.test && r.status === 'skip'));
const unknownDebt = strict || only.length ? [] : debt.filter((d) => !ranNames.has(d.test));
void ranFiles;

const line = (s = '') => { if (!quiet) console.log(s); };
const trim = (m) => String(m).split('\n').slice(0, 6).join('\n    ').slice(0, 900);
line(`data tests: ${results.length} run, ${results.filter((r) => r.status === 'pass').length} pass, ${failing.length} fail, ${results.filter((r) => r.status === 'skip').length} skipped${strict ? ' (STRICT: debt ignored)' : ''}${process.env.LSF_WAVE_ISOLATION === '1' ? ' (wave isolation on)' : ''}`);
if (knownFailures.length) { line(`\nKNOWN DEBT (${knownFailures.length}, tolerated until the owner WP lands):`); for (const r of knownFailures) { const d = debtByName.get(r.name); line(`  - [${r.file}] ${r.name}\n      owner: ${d.owner}${d.why ? ` | ${d.why}` : ''}`); } }
if (newFailures.length) { line(`\n${strict ? 'FAILURES' : 'NEW FAILURES (not in debt.json)'} (${newFailures.length}):`); for (const r of newFailures) line(`  x [${r.file}] ${r.name}\n    ${trim(r.message)}`); }
const skips = results.filter((r) => r.status === 'skip');
if (skips.length) { line(`\nSKIPPED (${skips.length}; a skip is not a pass):`); for (const r of skips) line(`  ~ [${r.file}] ${r.name}\n      reason: ${r.reason}`); }
const allWarn = [...warnings, ...staleDebt.map((d) => `debt entry now passes, its owner (${d.owner}) landed: "${d.test}" (debt.json is write-once; --strict is the gate)`), ...unknownDebt.map((d) => `debt entry matches no test: "${d.test}"`), ...dupes.map((r) => `duplicate test name: "${r.name}" (debt matches by name)`)];
if (allWarn.length) { line(`\nWARNINGS (${allWarn.length}):`); for (const w of allWarn) line(`  ! ${w}`); }
for (const n of stderrNotes) line(`\n${n}`);
if (skippedDebt.length) line(`\n(${skippedDebt.length} debt entr${skippedDebt.length === 1 ? 'y is' : 'ies are'} currently skipped: input not present yet)`);

if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ strict, results, warnings: allWarn }, null, 1));
const code = newFailures.length ? 1 : 0;
line(`\nresult: ${code === 0 ? 'OK' : 'FAIL'} (exit ${code})`);
process.exit(code);
