#!/usr/bin/env node
// The disposition ledger: nothing the re-verification found is silently dropped.
//
// Every item of every reverify/*.json (corrections, newer_vintages, unverifiable) is a row of
// evidence-out/reverify-index.json (see reverify_to_patches.mjs --index). Each integration WP owns the rows the index
// assigns to it and records one state per row in evidence-out/disposition-<WP-ID>.json.
//
//   --init <WP-ID>                  create disposition-<WP-ID>.json with one `pending` row per row owned by that WP.
//                                   Pre-filled: parked-low for low-confidence corrections, held-human-review for rows the
//                                   converter held (held-by-converter.json), `skipped (recorded only)` for dossier
//                                   markdown items (owner "recorded-only"). Re-running keeps every state already set.
//   --set <ref> <state> [detail]    set one row (the file is chosen from the index owner; --owner overrides; --dry-run checks only)
//   --check [--strict] [--owner W]  union all disposition-*.json and fail on a missing, duplicate or pending row, on a
//                                   state not allowed for the kind, on a class=claim unverifiable row that is not
//                                   rewritten | removed | marked-not-verified, and on a foreign-purchase assertion
//                                   (/non-EU|foreign|non-resident|nationality|purchase restriction|any buyer|alien/i)
//                                   that is marked-not-verified. Without --strict a WP whose file does not exist yet is
//                                   not checked (nothing to verify before --init); with --strict every row must exist.
//                                   Rows owned by "recorded-only" are implicitly `skipped (recorded only)`.
//   --check-null-decisions          every region of data/regions.js with more than 3 null cells needs a line
//                                   `NULL-DECISION <region-id>: shipped-with-nulls|dropped (reason)` in
//                                   evidence-out/integration-report-EV-INT-REGIONS.md
//   --summary                       counts per owner and state
//
// Allowed states
//   corrections     applied | superseded-by-pipeline | held-human-review | parked-low | skipped (reason)
//   newer_vintage   noted-in-basis | not-applicable (reason)
//   unverifiable    rewritten | removed | marked-not-verified | covered-by-P-CELL | no-action (reason)
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  parseArgs, resolveRoots, readJson, exists, writeJsonIfChanged, buildIndex, FOREIGN_RE, printLine, isMain,
} from './common.mjs';

export const STATES = {
  correction: ['applied', 'superseded-by-pipeline', 'held-human-review', 'parked-low', 'skipped'],
  newer_vintage: ['noted-in-basis', 'not-applicable'],
  unverifiable: ['rewritten', 'removed', 'marked-not-verified', 'covered-by-P-CELL', 'no-action'],
};
export const NEEDS_REASON = new Set(['skipped', 'not-applicable', 'no-action']);
const CLAIM_STATES = new Set(['rewritten', 'removed', 'marked-not-verified']);
export const familyOf = (kind) => (kind === 'newer_vintage' ? 'newer_vintage' : kind === 'unverifiable' ? 'unverifiable' : 'correction');

const fileFor = (OUT, owner) => path.join(OUT, `disposition-${owner}.json`);
function heldRefs(OUT) {
  const f = path.join(OUT, 'held-by-converter.json');
  if (!exists(f)) return new Set();
  try { return new Set(readJson(f).map((h) => h.ref)); } catch { return new Set(); }
}
function defaultRow(r, held) {
  const row = { ref: r.ref, kind: r.kind, class: r.class, target: r.target, state: 'pending', detail: '' };
  if (held.has(r.ref)) { row.state = 'held-human-review'; row.detail = 'held by the converter hold rule (reason asks for human review); full proposed text in held-by-converter.json'; }
  else if (r.kind === 'low') { row.state = 'parked-low'; row.detail = 'low confidence: never applied to a value (deferred-low.json)'; }
  else if (r.owner === 'recorded-only') { row.state = 'skipped'; row.detail = 'recorded only (research-dossier markdown is not served and not edited)'; }
  return row;
}

export function loadFile(OUT, owner) {
  const f = fileFor(OUT, owner);
  if (!exists(f)) return null;
  return readJson(f);
}

// Create or refresh disposition-<owner>.json. Existing states are kept. Returns { rows, write }.
export function initDisposition(roots, owner, { dryRun = false } = {}) {
  const { OUT, REVERIFY } = roots;
  const index = buildIndex(REVERIFY).filter((r) => r.owner === owner);
  const held = heldRefs(OUT);
  const prev = new Map(((loadFile(OUT, owner) || {}).rows || []).map((r) => [r.ref, r]));
  const rows = index.map((r) => {
    const keep = prev.get(r.ref);
    const base = defaultRow(r, held);
    return keep ? { ...base, state: keep.state, detail: keep.detail ?? '' } : base;
  });
  const write = writeJsonIfChanged(fileFor(OUT, owner), { owner, rows }, { dryRun });
  return { rows, write };
}

export function setState(roots, { ref, state, detail = '', owner = null, dryRun = false }) {
  const index = buildIndex(roots.REVERIFY);
  const row = index.find((r) => r.ref === ref);
  if (!row) throw new Error(`unknown ref ${ref}`);
  const allowed = STATES[familyOf(row.kind)];
  if (!allowed.includes(state)) throw new Error(`state "${state}" is not allowed for ${row.kind} rows (${allowed.join(' | ')})`);
  if (NEEDS_REASON.has(state) && String(detail).trim().length < 3) throw new Error(`state "${state}" needs a reason`);
  const o = owner || row.owner;
  let file = loadFile(roots.OUT, o);
  if (!file && dryRun) return { ref, state, detail: String(detail) };
  if (!file) { initDisposition(roots, o); file = loadFile(roots.OUT, o); }
  const target = file.rows.find((r) => r.ref === ref);
  if (!target) throw new Error(`${ref} is not a row of disposition-${o}.json (owner per index: ${row.owner})`);
  target.state = state;
  target.detail = String(detail);
  writeJsonIfChanged(fileFor(roots.OUT, o), file, { dryRun });
  return target;
}

// Used by patch_js.mjs: record many rows at once; returns how many rows changed.
export function recordRows(roots, items) {
  const index = new Map(buildIndex(roots.REVERIFY).map((r) => [r.ref, r]));
  const byOwner = new Map();
  for (const it of items) {
    const row = index.get(it.ref);
    if (!row) continue;
    const o = row.owner;
    if (o === 'recorded-only') continue;
    (byOwner.get(o) || byOwner.set(o, []).get(o)).push(it);
  }
  let n = 0;
  for (const [owner, list] of byOwner) {
    let file = loadFile(roots.OUT, owner);
    if (!file) { initDisposition(roots, owner); file = loadFile(roots.OUT, owner); }
    let changed = false;
    for (const it of list) {
      const t = file.rows.find((r) => r.ref === it.ref);
      if (!t) continue;
      if (t.state !== it.state || t.detail !== (it.detail || '')) { t.state = it.state; t.detail = it.detail || ''; changed = true; n++; }
    }
    if (changed) writeJsonIfChanged(fileFor(roots.OUT, owner), file);
  }
  return n;
}

// ---------------------------------------------------------------------------------------------------------------
export function checkDisposition(roots, { strict = false, owner = null } = {}) {
  const { OUT, REVERIFY } = roots;
  const errors = [];
  const notes = [];
  const index = buildIndex(REVERIFY);
  const byRef = new Map(index.map((r) => [r.ref, r]));
  const files = exists(OUT) ? fs.readdirSync(OUT).filter((f) => /^disposition-.+\.json$/.test(f)).sort() : [];
  const seen = new Map(); // ref -> file
  const rowsByRef = new Map();
  const filesByOwner = new Set();
  for (const f of files) {
    let data;
    try { data = readJson(path.join(OUT, f)); } catch (e) { errors.push(`${f}: not valid JSON (${e.message})`); continue; }
    const fileOwner = data.owner || f.replace(/^disposition-|\.json$/g, '');
    filesByOwner.add(fileOwner);
    if (!Array.isArray(data.rows)) { errors.push(`${f}: no rows array`); continue; }
    for (const row of data.rows) {
      const idx = byRef.get(row.ref);
      if (!idx) { errors.push(`${f}: unknown ref ${row.ref}`); continue; }
      if (seen.has(row.ref)) { errors.push(`duplicate row for ${row.ref} (${seen.get(row.ref)} and ${f})`); continue; }
      seen.set(row.ref, f);
      if (idx.owner !== fileOwner) errors.push(`${f}: ${row.ref} belongs to ${idx.owner}, not ${fileOwner}`);
      rowsByRef.set(row.ref, { row, idx });
    }
  }

  const scope = index.filter((r) => !owner || r.owner === owner);
  for (const idx of scope) {
    const got = rowsByRef.get(idx.ref);
    if (!got) {
      if (idx.owner === 'recorded-only') continue; // implicit: skipped (recorded only)
      const ownerHasFile = filesByOwner.has(idx.owner);
      if (strict || ownerHasFile) errors.push(`${idx.ref}: no disposition row (owner ${idx.owner})`);
      continue;
    }
    const { row } = got;
    const allowed = STATES[familyOf(idx.kind)];
    if (row.state === 'pending') { errors.push(`${idx.ref}: pending (owner ${idx.owner})`); continue; }
    if (!allowed.includes(row.state)) { errors.push(`${idx.ref}: state "${row.state}" is not allowed for ${idx.kind} (${allowed.join(' | ')})`); continue; }
    if (NEEDS_REASON.has(row.state) && String(row.detail || '').trim().length < 3) errors.push(`${idx.ref}: "${row.state}" needs a reason in detail`);
    if (idx.kind === 'unverifiable') {
      if (idx.class === 'claim' && !CLAIM_STATES.has(row.state)) errors.push(`${idx.ref}: a claim (${idx.target.slice(0, 80)}) must be rewritten | removed | marked-not-verified, not "${row.state}"`);
      if (FOREIGN_RE.test(idx.target) && row.state === 'marked-not-verified') errors.push(`${idx.ref}: a foreign-purchase assertion is rewritten or removed, never kept with a marker (${idx.target.slice(0, 80)})`);
    }
  }
  if (!files.length) notes.push('no disposition-*.json files yet (nothing to check before --init)');
  return { errors, notes, checked: scope.length, files: files.length };
}

export async function nullCounts(regionsFile) {
  const mod = await import(`${pathToFileURL(regionsFile).href}?t=${Date.now()}`);
  const ids = (mod.regions || []).map((r) => r.id);
  const crit = (mod.criteria || []).map((c) => c.id);
  return ids.map((id) => {
    const cells = (mod.values || {})[id] || {};
    const nulls = (crit.length ? crit : Object.keys(cells)).filter((c) => cells[c] && cells[c].value === null).length;
    return { id, nulls };
  });
}
export async function checkNullDecisions(roots, { regionsFile, reportFile, cap = 3 } = {}) {
  const rf = regionsFile || path.join(roots.ROOT, 'data/regions.js');
  const rep = reportFile || path.join(roots.OUT, 'integration-report-EV-INT-REGIONS.md');
  const errors = [];
  const counts = await nullCounts(rf);
  const over = counts.filter((c) => c.nulls > cap);
  const text = exists(rep) ? fs.readFileSync(rep, 'utf8') : null;
  for (const c of over) {
    const re = new RegExp(`^\\s*NULL-DECISION\\s+${c.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*:\\s*(shipped-with-nulls|dropped)\\s*\\((.{3,})\\)\\s*$`, 'm');
    if (text === null) errors.push(`${c.id} has ${c.nulls} null cells and ${path.basename(rep)} does not exist`);
    else if (!re.test(text)) errors.push(`${c.id} has ${c.nulls} null cells: add a line "NULL-DECISION ${c.id}: shipped-with-nulls|dropped (reason)" to ${path.basename(rep)}`);
  }
  return { errors, over };
}

export function summary(roots) {
  const index = buildIndex(roots.REVERIFY);
  const out = {};
  const files = exists(roots.OUT) ? fs.readdirSync(roots.OUT).filter((f) => /^disposition-.+\.json$/.test(f)) : [];
  const states = new Map();
  for (const f of files) for (const r of readJson(path.join(roots.OUT, f)).rows || []) states.set(r.ref, r.state);
  for (const r of index) {
    const o = (out[r.owner] ||= { rows: 0 });
    o.rows++;
    const s = states.get(r.ref) || (r.owner === 'recorded-only' ? 'skipped' : 'missing');
    o[s] = (o[s] || 0) + 1;
  }
  return out;
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['check', 'strict', 'check-null-decisions', 'summary', 'dry-run'] });
  const roots = resolveRoots(args);
  try {
    if (args.init) {
      const owner = typeof args.init === 'string' ? args.init : args._.shift();
      if (!owner) throw new Error('--init needs a WP id');
      const { rows, write } = initDisposition(roots, owner, { dryRun: !!args.dryRun });
      const c = {};
      for (const r of rows) c[r.state] = (c[r.state] || 0) + 1;
      printLine(`disposition-${owner}.json: ${write}; ${rows.length} rows (${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ') || 'none'})`);
      return 0;
    }
    if (args.set) {
      const ref = typeof args.set === 'string' ? args.set : args._.shift();
      const state = args._.shift();
      const detail = args._.join(' ');
      if (!ref || !state) throw new Error('usage: --set <ref> <state> [detail]');
      const t = setState(roots, { ref, state, detail, owner: args.owner && args.owner !== true ? args.owner : null, dryRun: !!args.dryRun });
      printLine(`${t.ref} -> ${t.state}${t.detail ? ` (${t.detail})` : ''}${args.dryRun ? ' (dry run)' : ''}`);
      return 0;
    }
    if (args.summary) {
      for (const [o, c] of Object.entries(summary(roots))) printLine(`${o}: ${Object.entries(c).map(([k, v]) => `${k} ${v}`).join(', ')}`);
      return 0;
    }
    if (args.checkNullDecisions) {
      const r = await checkNullDecisions(roots, { regionsFile: args.regions && args.regions !== true ? args.regions : undefined, reportFile: args.report && args.report !== true ? args.report : undefined });
      if (r.errors.length) { for (const e of r.errors) process.stderr.write(`disposition: ${e}\n`); return 1; }
      printLine(`disposition: null decisions ok (${r.over.length} region(s) above the cap, each with a NULL-DECISION line)`);
      return 0;
    }
    if (args.check) {
      const r = checkDisposition(roots, { strict: !!args.strict, owner: args.owner && args.owner !== true ? args.owner : null });
      for (const n of r.notes) printLine(`disposition: ${n}`);
      if (r.errors.length) {
        for (const e of r.errors.slice(0, 60)) process.stderr.write(`disposition: ${e}\n`);
        if (r.errors.length > 60) process.stderr.write(`disposition: ... and ${r.errors.length - 60} more\n`);
        process.stderr.write(`disposition: FAIL (${r.errors.length} problem(s) over ${r.checked} rows${args.strict ? ', strict' : ''})\n`);
        return 1;
      }
      printLine(`disposition: ok (${r.checked} rows in scope, ${r.files} file(s)${args.strict ? ', strict' : ''})`);
      return 0;
    }
    throw new Error('nothing to do: use --init, --set, --check, --check-null-decisions or --summary');
  } catch (e) { process.stderr.write(`disposition: ${e.message}\n`); return 2; }
}

if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`${e.stack || e}\n`); process.exit(1); });
