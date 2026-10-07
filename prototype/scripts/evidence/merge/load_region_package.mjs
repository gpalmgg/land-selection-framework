#!/usr/bin/env node
// Load and validate one region research package (upgrade-2026-10/regions/<id>/).
//
// Package contract (from the region-research workflow):
//   data.json        { region: {...}, values: { <criterion>: cell }, extras: {...}, notes: [...] }
//   standing.json    the Land standing entry (flat, or keyed by the region id; underscore keys are metadata)
//   depth.json       the region depth entry (same two shapes; may carry caseLinks / _caseStudyLinks)
//   dossier/*.md     research notes (not served)
//   standing-notes.md, verify.md
//
// A package is READY only when verify.md's first line carries a verdict:
//   /^\W*(?:verdict:?\s*)?(ship-with-gaps|ship|drop)\b/i
//   ship | ship-with-gaps -> loaded and validated
//   drop                  -> { skipped: 'drop' }
//   no verify.md, or no verdict on its first line -> { skipped: 'no verdict' } (not ready; reported, never loaded)
//
// The loader cleans what the integration step must not copy (underscore-prefixed keys, cell keys that are not in the
// cell schema) and reports each strip as a warning; it never invents a value. A null cell needs a reason
// (`nullReason`, or a package-level `reason` that is normalised to `nullReason`): policy P-CELL.
//
//   node scripts/evidence/merge/load_region_package.mjs [--regions DIR] [--id <id>] [--json]
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs, resolveRoots, readJson, exists, printLine, isMain } from './common.mjs';

export const VERDICT_RE = /^\W*(?:verdict:?\s*)?(ship-with-gaps|ship|drop)\b/i;

const FALLBACK = {
  CONTINENTS: ['europe', 'north-america'],
  CRITERIA_IDS: ['climate', 'water_stress', 'soil_carbon', 'forest_change', 'solar_pv', 'conflict', 'regen_network', 'population'],
  CELL_REQUIRED: ['value', 'unit', 'vintage', 'label', 'source', 'sourceUrl'],
  CELL_V2_REQUIRED: ['sourceId', 'method', 'footprint', 'retrieved', 'trajectory'],
  EXTENSIONS: { cell: ['scenario', 'license', 'outOfRange', 'nullReason', 'audit'] },
  BASE_KEYS: { regions: ['id', 'continent', 'name', 'short', 'country', 'coords', 'blurb', 'accent'], landStanding: ['territory', 'tenure', 'entry', 'obligation', 'source', 'sourceUrl'], regionDepth: ['asks', 'source', 'sourceUrl'] },
  EXT_LS: ['sources', 'territorySource', 'territorySourceUrl'],
  EXT_RD: ['caseStudy', 'caseLinks'],
};
async function loadSchema(ROOT) {
  const f = path.join(ROOT, 'tests/schema.mjs');
  if (!exists(f)) return FALLBACK;
  try {
    const s = await import(pathToFileURL(f).href);
    return {
      CONTINENTS: s.CONTINENTS, CRITERIA_IDS: s.CRITERIA_IDS, CELL_REQUIRED: s.CELL_REQUIRED, CELL_V2_REQUIRED: s.CELL_V2_REQUIRED,
      EXTENSIONS: s.EXTENSIONS, BASE_KEYS: s.BASE_KEYS, EXT_LS: s.EXTENSIONS.landStanding, EXT_RD: s.EXTENSIONS.regionDepth,
    };
  } catch { return FALLBACK; }
}

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const isStr = (s, min = 1) => typeof s === 'string' && s.trim().length >= min;
const isUrl = (s) => typeof s === 'string' && /^https?:\/\/[^\s]+\.[^\s]+/.test(s);

export function parseVerdict(dir) {
  const f = path.join(dir, 'verify.md');
  if (!exists(f)) return { verdict: null, why: 'no verify.md' };
  const first = fs.readFileSync(f, 'utf8').split(/\r?\n/, 1)[0] || '';
  const m = VERDICT_RE.exec(first);
  if (!m) return { verdict: null, why: `first line of verify.md has no verdict: ${JSON.stringify(first.slice(0, 60))}` };
  return { verdict: m[1].toLowerCase(), why: null };
}

function stripUnderscore(obj, stripped, where) {
  const out = {};
  for (const [k, v] of Object.entries(obj || {})) {
    if (k.startsWith('_')) { stripped.push(`${where}.${k}`); continue; }
    out[k] = v;
  }
  return out;
}
// entry shapes: flat { territory, ... } or keyed { "<id>": { ... }, "_sources": ... }
function entryOf(raw, id) {
  if (!raw || typeof raw !== 'object') return { entry: null, meta: {} };
  if (raw[id] && typeof raw[id] === 'object' && !Array.isArray(raw[id])) {
    const meta = {};
    for (const [k, v] of Object.entries(raw)) if (k !== id) meta[k] = v;
    return { entry: raw[id], meta };
  }
  return { entry: raw, meta: {} };
}

export async function loadRegionPackage(dir, { ROOT = resolveRoots().ROOT, schema = null } = {}) {
  const id = path.basename(path.resolve(dir));
  const { verdict, why } = parseVerdict(dir);
  if (!verdict) return { id, dir, skipped: 'no verdict', why };
  if (verdict === 'drop') return { id, dir, skipped: 'drop', verdict };

  const S = schema || await loadSchema(ROOT);
  const errors = [];
  const warnings = [];
  const stripped = [];
  const need = (f) => path.join(dir, f);
  if (!exists(need('data.json'))) return { id, dir, verdict, errors: ['data.json is missing'], warnings, ok: false };
  let raw;
  try { raw = readJson(need('data.json')); } catch (e) { return { id, dir, verdict, errors: [`data.json is not valid JSON: ${e.message}`], warnings, ok: false }; }

  // region object
  const region = {};
  const rin = raw.region || {};
  for (const k of S.BASE_KEYS.regions) if (rin[k] !== undefined) region[k] = rin[k];
  for (const k of Object.keys(rin)) if (!S.BASE_KEYS.regions.includes(k)) stripped.push(`region.${k}`);
  if (region.id !== id) errors.push(`region.id "${region.id}" does not match the folder name "${id}"`);
  if (!S.CONTINENTS.includes(region.continent)) errors.push(`region.continent "${region.continent}" is not one of ${S.CONTINENTS.join(' | ')}`);
  for (const f of ['name', 'country', 'blurb']) if (!isStr(region[f])) errors.push(`region.${f} missing`);
  if (!(Array.isArray(region.coords) && region.coords.length === 2 && region.coords.every(isNum) && Math.abs(region.coords[0]) <= 180 && Math.abs(region.coords[1]) <= 90)) errors.push('region.coords must be [lon, lat] numbers');
  if (!/^#[0-9a-f]{6}$/i.test(String(region.accent || ''))) warnings.push('region.accent is not a #rrggbb colour (the integration step applies the accent slate)');

  // cells
  const allowedCellKeys = new Set([...S.CELL_REQUIRED, ...S.CELL_V2_REQUIRED, ...S.EXTENSIONS.cell]);
  const cells = {};
  const nullCells = [];
  const vin = raw.values || {};
  for (const c of S.CRITERIA_IDS) {
    const cin = vin[c];
    if (!cin) { errors.push(`values.${c} is missing`); continue; }
    const cell = {};
    for (const [k, v] of Object.entries(cin)) {
      if (k.startsWith('_')) { stripped.push(`values.${c}.${k}`); continue; }
      if (k === 'reason' && cin.value === null && cin.nullReason === undefined) { cell.nullReason = v; continue; }
      if (!allowedCellKeys.has(k)) { stripped.push(`values.${c}.${k}`); continue; }
      cell[k] = v;
    }
    if (cell.value === null) {
      nullCells.push(c);
      if (!isStr(cell.nullReason, 12)) errors.push(`values.${c}: value is null but nullReason (>= 12 characters) is missing`);
    } else {
      if (!isNum(cell.value)) errors.push(`values.${c}.value must be a finite number or null with a nullReason`);
      for (const f of S.CELL_REQUIRED) if (f !== 'value' && !isStr(cell[f])) errors.push(`values.${c}.${f} missing`);
      if (cell.sourceUrl !== undefined && !isUrl(cell.sourceUrl)) errors.push(`values.${c}.sourceUrl is not a URL`);
    }
    cells[c] = cell;
  }
  for (const c of Object.keys(vin)) if (!S.CRITERIA_IDS.includes(c)) { stripped.push(`values.${c}`); warnings.push(`values.${c} is not a known criterion and is ignored`); }
  if (verdict === 'ship' && nullCells.length) warnings.push(`verdict is "ship" but ${nullCells.length} cell(s) are null: ${nullCells.join(', ')}`);

  // Land standing and region depth
  let standing = null;
  let depth = null;
  let standingMeta = {};
  let depthMeta = {};
  if (exists(need('standing.json'))) {
    try {
      const { entry, meta } = entryOf(readJson(need('standing.json')), id);
      standingMeta = meta;
      const clean = stripUnderscore(entry, stripped, 'standing');
      for (const f of S.BASE_KEYS.landStanding) if (!isStr(clean[f])) errors.push(`standing.${f} missing`);
      for (const k of Object.keys(clean)) if (!S.BASE_KEYS.landStanding.includes(k) && !(S.EXT_LS || []).includes(k)) { warnings.push(`standing.${k} is not a registered land standing field and is ignored`); delete clean[k]; }
      standing = clean;
    } catch (e) { errors.push(`standing.json: ${e.message}`); }
  } else errors.push('standing.json is missing (a region ships only with a verified Land standing entry)');
  if (exists(need('depth.json'))) {
    try {
      const { entry, meta } = entryOf(readJson(need('depth.json')), id);
      depthMeta = meta;
      const underscored = Object.keys(entry).filter((k) => k.startsWith('_'));
      const caseLinks = entry.caseLinks || entry._caseStudyLinks || meta._caseStudyLinks || null;
      const clean = stripUnderscore(entry, stripped, 'depth');
      if (caseLinks && !clean.caseLinks) clean.caseLinks = caseLinks;
      for (const f of S.BASE_KEYS.regionDepth) if (!isStr(clean[f])) errors.push(`depth.${f} missing`);
      for (const k of Object.keys(clean)) if (!S.BASE_KEYS.regionDepth.includes(k) && !(S.EXT_RD || []).includes(k)) { warnings.push(`depth.${k} is not a registered region depth field and is ignored`); delete clean[k]; }
      void underscored;
      depth = clean;
    } catch (e) { errors.push(`depth.json: ${e.message}`); }
  } else errors.push('depth.json is missing');

  const dossierDir = need('dossier');
  const dossier = exists(dossierDir) ? fs.readdirSync(dossierDir).filter((f) => f.endsWith('.md')).sort() : [];
  return {
    id, dir, verdict, region, cells, extras: raw.extras || {}, notes: raw.notes || [], standing, depth, standingMeta, depthMeta,
    dossier, hasStandingNotes: exists(need('standing-notes.md')), nullCells, stripped, errors, warnings, ok: errors.length === 0,
  };
}

export async function loadAllPackages(regionsDir, opts = {}) {
  const out = [];
  if (!exists(regionsDir)) return out;
  for (const d of fs.readdirSync(regionsDir).sort()) {
    const abs = path.join(regionsDir, d);
    if (!fs.statSync(abs).isDirectory() || d === 'briefs') continue;
    if (!exists(path.join(abs, 'verify.md')) && !exists(path.join(abs, 'data.json'))) continue; // not a package folder
    out.push(await loadRegionPackage(abs, opts));
  }
  return out;
}

export async function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['json'] });
  const roots = resolveRoots(args);
  const dir = args.regions && args.regions !== true ? path.resolve(args.regions) : path.join(roots.UPG, 'regions');
  const all = args.id && args.id !== true ? [await loadRegionPackage(path.join(dir, args.id), { ROOT: roots.ROOT })] : await loadAllPackages(dir, { ROOT: roots.ROOT });
  if (args.json) { printLine(JSON.stringify(all, null, 2)); return all.some((p) => p.ok === false) ? 1 : 0; }
  let bad = 0;
  for (const p of all) {
    if (p.skipped) printLine(`${p.id.padEnd(24)} skipped: ${p.skipped}${p.why ? ` (${p.why})` : ''}`);
    else { printLine(`${p.id.padEnd(24)} ${p.verdict.padEnd(15)} ${p.ok ? 'ok' : 'INVALID'}  nulls ${p.nullCells?.length || 0}  stripped ${p.stripped?.length || 0}  warnings ${p.warnings?.length || 0}`); for (const e of p.errors || []) printLine(`    error: ${e}`); if (!p.ok) bad++; }
  }
  return bad ? 1 : 0;
}
if (isMain(import.meta.url)) run(process.argv.slice(2)).then((c) => process.exit(c), (e) => { process.stderr.write(`${e.stack || e}\n`); process.exit(1); });
