#!/usr/bin/env node
// check_result_files.mjs FILE...
//
// Every e2e / perf result JSON must say `status: "pass"` and carry no failures: no `failures`/`failed` array with entries,
// no `fail`/`failed`/`failures` count above zero (also inside `suites[]` and `results[]`). A missing or unparsable file FAILS.
import fs from 'node:fs';
import path from 'node:path';
import { Report, cli } from './lib.mjs';

function failures(node, where, out) {
  if (Array.isArray(node)) { node.forEach((v, i) => failures(v, `${where}[${i}]`, out)); return; }
  if (!node || typeof node !== 'object') return;
  for (const [k, v] of Object.entries(node)) {
    const here = where ? `${where}.${k}` : k;
    if (/^(failures|failed|errors)$/i.test(k)) {
      if (Array.isArray(v) && v.length) out.push(`${here} lists ${v.length} entr${v.length === 1 ? 'y' : 'ies'}`);
      else if (typeof v === 'number' && v > 0) out.push(`${here} = ${v}`);
    } else if (/^fail(ed|ures)?_?(count)?$/i.test(k) && typeof v === 'number' && v > 0) out.push(`${here} = ${v}`);
    else if (k === 'status' && where !== '' && typeof v === 'string' && /^(fail|failed|error)$/i.test(v)) out.push(`${here} = "${v}"`);
    else if (v && typeof v === 'object') failures(v, here, out);
  }
}

export async function run(argv) {
  const rep = new Report();
  const files = argv.filter((a) => !a.startsWith('--'));
  if (!files.length) { rep.fail('input', 'give at least one result JSON file'); return rep; }
  for (const f of files) {
    const abs = path.resolve(f);
    const label = path.basename(f);
    let j;
    try { j = JSON.parse(fs.readFileSync(abs, 'utf8')); } catch (e) { rep.fail(`result ${label}`, `cannot read ${abs}: ${e.code || e.message}`); continue; }
    const problems = [];
    if (j.status !== 'pass') problems.push(`status is ${JSON.stringify(j.status)}, want "pass"`);
    failures(j, '', problems);
    if (problems.length) rep.fail(`result ${label}`, problems.slice(0, 6).join('; '));
    else rep.pass(`result ${label}`, 'status pass, no failures');
  }
  return rep;
}

cli(import.meta.url, 'check_result_files', run);
