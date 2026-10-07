#!/usr/bin/env node
// check_deeper_claims.mjs: every number deeper.html prints from the data equals the data (DOC-6, 2026-10).
//
//   node scripts/check_deeper_claims.mjs [--root DIR] [--file NAME] [--list]
//
// Registered claims (hand-written prose, checked here; the generated regions are checked by gen_deeper_sections.mjs --check):
//   <span data-claim="<region>.<criterion>">text</span>
//       text must equal the cell value as the site prints it: integers of 1000 or more with a thousands comma, decimals as
//       stored, a negative with U+2212. Optional attributes:
//         data-claim-field="trajectory.delta"   compare another numeric field of the cell (a dotted path under the cell)
//         data-claim-field="label"              the text must occur inside the cell's label (a number quoted from it)
//         data-claim-abs="1"                    compare the absolute value (the minus sign is written outside the span)
//   <span data-assert="all:<criterion>:lt:0">...</span>
//       a statement about every region ("all", "lt" or "gt" or "ge" or "le", a number) checked across values{}.
//   <!--f:KEY-->text<!--/f-->   a count or date fact: text must equal data/site-facts.js factValues()[KEY].
//
// Also fails on: stale hard-coded counts in the visible text (the RC 4.1 recipe), unexpanded {{...}} placeholders, the strings
// the content pass removed on purpose (a subscriber gate, "Every URL was live", the dossier files as an audit trail), and
// a missing or duplicated GEN marker pair.
//
// Exit codes: 0 ok, 1 a claim or fact differs, 2 usage error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
let root = path.resolve(HERE, '..');
let file = 'deeper.html';
let list = false;
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === '--root') root = path.resolve(argv[++i] || '');
  else if (argv[i] === '--file') file = argv[++i];
  else if (argv[i] === '--list') list = true;
  else { console.error(`usage error: unknown argument ${argv[i]}`); process.exit(2); }
}
const target = path.join(root, file);
if (!fs.existsSync(target)) { console.error(`usage error: ${target} not found`); process.exit(2); }

const { regions, values } = await import(pathToFileURL(path.join(root, 'data', 'regions.js')).href);
const { factValues } = await import(pathToFileURL(path.join(root, 'data', 'site-facts.js')).href);
const html = fs.readFileSync(target, 'utf8');
const lines = html.split('\n');
const lineOf = (index) => html.slice(0, index).split('\n').length;

const fmt = (n) => {
  if (typeof n !== 'number' || !Number.isFinite(n)) return String(n);
  if (n < 0) return '−' + fmt(-n);
  return Number.isInteger(n) ? n.toLocaleString('en-US') : String(n);
};
const attr = (tag, name) => { const m = new RegExp(`\\b${name}="([^"]*)"`).exec(tag); return m ? m[1] : null; };
const strip = (t) => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
const pathGet = (o, p) => p.split('.').reduce((a, k) => (a == null ? undefined : a[k]), o);

const problems = [];
let claims = 0, asserts = 0, factsChecked = 0;
const byRegion = {};

// ---- registered claims
for (const m of html.matchAll(/<span\b([^>]*\bdata-claim="[^"]*"[^>]*)>([\s\S]*?)<\/span>/g)) {
  claims++;
  const tag = m[1], text = strip(m[2]), ln = lineOf(m.index);
  const [rid, cid] = attr(tag, 'data-claim').split('.');
  const field = attr(tag, 'data-claim-field') || 'value';
  const abs = attr(tag, 'data-claim-abs') === '1';
  const cell = values[rid] && values[rid][cid];
  byRegion[rid] = (byRegion[rid] || 0) + 1;
  if (!cell) { problems.push(`line ${ln}: data-claim ${rid}.${cid} names no cell`); continue; }
  const v = pathGet(cell, field);
  if (field === 'label') {
    if (typeof v !== 'string' || !v.includes(text)) problems.push(`line ${ln}: "${text}" is not in the label of ${rid}.${cid} ("${v}")`);
    continue;
  }
  if (typeof v !== 'number') { problems.push(`line ${ln}: ${rid}.${cid}.${field} is not a number (${JSON.stringify(v)})`); continue; }
  const want = fmt(abs ? Math.abs(v) : v);
  if (text !== want) problems.push(`line ${ln}: ${rid}.${cid}.${field} reads "${text}" in the page but the data says ${want}`);
}

// ---- assertions across all regions
for (const m of html.matchAll(/<span\b([^>]*\bdata-assert="[^"]*"[^>]*)>/g)) {
  asserts++;
  const ln = lineOf(m.index);
  const [q, cid, op, lim] = attr(m[1], 'data-assert').split(':');
  if (q !== 'all') { problems.push(`line ${ln}: unsupported assertion ${attr(m[1], 'data-assert')}`); continue; }
  const n = Number(lim);
  const bad = regions.filter((r) => { const v = values[r.id] && values[r.id][cid] && values[r.id][cid].value; if (typeof v !== 'number') return true; return !(op === 'lt' ? v < n : op === 'gt' ? v > n : op === 'le' ? v <= n : op === 'ge' ? v >= n : false); });
  if (bad.length) problems.push(`line ${ln}: "all ${cid} ${op} ${n}" fails for ${bad.map((r) => r.id).join(', ')}`);
}

// ---- count and date facts
const FV = factValues();
for (const m of html.matchAll(/<!--f:([A-Za-z]+)-->([\s\S]*?)<!--\/f-->/g)) {
  factsChecked++;
  const key = m[1], ln = lineOf(m.index);
  if (!(key in FV)) { problems.push(`line ${ln}: unknown fact f:${key}`); continue; }
  if (m[2] !== FV[key]) problems.push(`line ${ln}: f:${key} reads "${m[2]}" but site-facts says "${FV[key]}"`);
}

// ---- visible text: stale counts and removed claims
const visible = html
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ')
  .replace(/<[^>]+>/g, ' ');
const STALE = /twenty|\b20\b|\bten\b|ten (european|regions)|all twenty|10 of 10|\b10\b regions/gi;
for (const m of visible.matchAll(STALE)) {
  const ctx = visible.slice(Math.max(0, m.index - 40), m.index + 40).replace(/\s+/g, ' ');
  problems.push(`stale count in the visible text: "${m[0]}" near "${ctx}"`);
}
for (const [re, why] of [
  [/for subscribers/i, 'the subscriber gate no longer exists'],
  [/modal promised/i, 'the modal no longer promises a deeper layer'],
  [/Every URL was live/i, 'no such claim: the page states what the link check found'],
  [/research-dossier/, 'the dossier files are not served'],
  [/\{\{[^}]*\}\}/, 'an unexpanded placeholder'],
  [/open-source|github\.com|mailto:/i, 'no repository, handle or email on the site'],
]) {
  const m = re.exec(html);
  if (m) problems.push(`line ${lineOf(m.index)}: "${m[0]}" must not appear (${why})`);
}

// ---- generated regions exist exactly once
for (const name of ['criteria', 'layers', 'sources']) {
  for (const edge of ['start', 'end']) {
    const marker = `<!-- GEN:${name}:${edge} -->`;
    const n = html.split(marker).length - 1;
    if (n !== 1) problems.push(`marker ${marker} occurs ${n} times (expected once)`);
  }
}

if (list) console.log(JSON.stringify({ claims, asserts, factsChecked, byRegion }, null, 1));
if (problems.length) {
  for (const p of problems) console.log(`check_deeper_claims: ${p}`);
  console.log(`check_deeper_claims: FAILED (${problems.length} problem(s); ${claims} claims, ${asserts} assertions, ${factsChecked} facts)`);
  process.exit(1);
}
console.log(`check_deeper_claims: ok (${claims} registered claims across ${Object.keys(byRegion).length} regions, ${asserts} assertions, ${factsChecked} count facts, ${lines.length} lines)`);
