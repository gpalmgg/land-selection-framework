#!/usr/bin/env node
// Validate staging legal-pathway entries (EV-LEGAL-EU / -NA / -NEW) against the schema in tests/schema.mjs, the
// agreement rules with data/processed/legal-ownership.json, and the opened-URL ledger in each <id>.notes.md.
//
//   node scripts/evidence/validate_legal.mjs <dir> [--ids a,b,c]
//
// <dir> holds <id>.json (the entry itself, or { "<id>": entry }) and <id>.notes.md. Every sourceUrl of an entry must appear
// in its notes.md on a line that also carries an ISO date (the day the page was opened). Exit 0 = every entry passes,
// 1 = at least one problem, 2 = usage error. Read-only: writes nothing.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateLegalEntry, legalAgreement, walk, LEGAL_NOT_ADVICE } from '../../tests/schema.mjs';
import { makeAllowed } from '../../tests/helpers.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const proto = path.resolve(here, '../..');
const args = process.argv.slice(2);
const dir = args.find((a, i) => !a.startsWith('--') && args[i - 1] !== '--ids');
const idsArg = args.indexOf('--ids') >= 0 ? args[args.indexOf('--ids') + 1] : null;
if (!dir) { console.error('usage: node scripts/evidence/validate_legal.mjs <dir> [--ids a,b,c]'); process.exit(2); }
if (!existsSync(dir)) { console.error(`validate_legal: directory not found: ${dir}`); process.exit(2); }

let ids = idsArg ? idsArg.split(',').map((s) => s.trim()).filter(Boolean) : readdirSync(dir).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
if (!ids.length) { console.error('validate_legal: no entries to validate'); process.exit(2); }

const ownership = (() => { const f = path.join(proto, 'data/processed/legal-ownership.json'); return existsSync(f) ? Object.fromEntries(JSON.parse(readFileSync(f, 'utf8')).map((r) => [r.region_id, r])) : {}; })();
const allowed = makeAllowed();
const today = process.env.LSF_TODAY || new Date().toISOString().slice(0, 10);
let problems = 0;
const report = (id, msg) => { problems++; console.log(`  x ${id}: ${msg}`); };

for (const id of ids) {
  const jf = path.join(dir, `${id}.json`), nf = path.join(dir, `${id}.notes.md`);
  console.log(`${id}`);
  if (!existsSync(jf)) { report(id, `missing ${path.basename(jf)}`); continue; }
  let raw;
  try { raw = JSON.parse(readFileSync(jf, 'utf8')); } catch (e) { report(id, `invalid JSON: ${e.message}`); continue; }
  let entry = raw;
  if (raw && typeof raw === 'object' && Object.keys(raw).length === 1 && raw[id]) entry = raw[id];
  else if (raw && typeof raw === 'object') { entry = { ...raw }; delete entry.id; delete entry.regionId; }
  for (const m of validateLegalEntry(id, entry, { today, allowed })) report(id, m);
  if (ownership[id]) for (const m of legalAgreement(id, ownership[id], entry)) report(id, m);
  // opened-URL ledger
  if (!existsSync(nf)) { report(id, `missing ${path.basename(nf)} (opened-URL ledger)`); continue; }
  const lines = readFileSync(nf, 'utf8').split('\n');
  const urls = new Set();
  walk(entry, (k, v) => { if (/^sourceUrl$/.test(k) && typeof v === 'string') urls.add(v); });
  const norm = (u) => u.replace(/\/$/, '');
  for (const u of urls) {
    const ok = lines.some((l) => l.includes(norm(u)) && /\d{4}-\d{2}-\d{2}/.test(l));
    if (!ok) report(id, `sourceUrl not in the opened-URL ledger with a date: ${u}`);
  }
  if (!urls.size) report(id, 'entry has no sourceUrl at all');
}
console.log(problems ? `\nvalidate_legal: ${problems} problem(s) in ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'}` : `\nvalidate_legal: ${ids.length} entr${ids.length === 1 ? 'y' : 'ies'} OK (${LEGAL_NOT_ADVICE.slice(0, 32)}... printed by renderers)`);
process.exit(problems ? 1 : 0);
