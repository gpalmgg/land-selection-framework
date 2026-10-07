// Shared loaders and pure checkers for the data test suite. Zero dependencies (node:test + node:assert only).
// Read-only against the tree: nothing here writes outside os.tmpdir().
//
// Environment:
//   LSF_ROOT              alternate prototype/ folder (used by the mutation check)
//   LSF_REPO              alternate repo root (default: parent of ROOT; the mutation check keeps the real one)
//   REQUIRE_V2=1          every "if present then valid" becomes "must be present"
//   CHECK_PAGES=1         also check region pages + sitemap (gate only)
//   LSF_WAVE_ISOLATION=1  treat files that wave-0 neighbour WPs create as absent (see ISOLATED_FILES)
//   LSF_STRICT=1          set by `run.mjs --strict` (gate mode): drafts are checked like shipped data
//   LSF_TODAY=YYYY-MM-DD  fixed "today" for date-window checks
import { readFileSync, existsSync, readdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import os from 'node:os';
import path from 'node:path';
import * as S from './schema.mjs';

export const TESTS_DIR = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = process.env.LSF_ROOT || path.resolve(TESTS_DIR, '..');
export const REPO = process.env.LSF_REPO || path.resolve(ROOT, '..');
export const UPG = path.join(REPO, 'upgrade-2026-10');
export const REQUIRE_V2 = process.env.REQUIRE_V2 === '1';
export const ISOLATION = process.env.LSF_WAVE_ISOLATION === '1';
export const GATE = process.env.LSF_STRICT === '1';
export const BASELINE_COMMIT = '6bce1a3';
export const LAYERS = ['legal-ownership', 'land-cost', 'demographic-trajectory', 'soil-contamination', 'water-source-control', 'climate-buffering'];

// The planned slate (plan: 30 regions = 20 existing + 10 new). Declared ONCE, here. The shipped slate is
// PLANNED_IDS minus verify/dropped-regions.json (plan policy P-DROP); no test or gate types a region count.
export const EXISTING_IDS = ['alentejo', 'galicia', 'transylvania', 'connemara', 'pembrokeshire', 'cevennes', 'south-tirol', 'asturias', 'saxony-anhalt', 'estonia-rural', 'cascadia', 'vermont', 'southern-appalachians', 'driftless', 'ozarks', 'northern-new-mexico', 'nova-scotia', 'kootenays', 'quebec-eastern-townships', 'oaxaca'];
export const NEW_REGION_IDS = ['scottish-highlands', 'north-karelia-kainuu', 'millevaches', 'teruel-uplands', 'valle-maira', 'finger-lakes', 'virginia-piedmont', 'bas-saint-laurent', 'ne-missouri-se-iowa', 'downeast-maine'];
export const PLANNED_IDS = [...EXISTING_IDS, ...NEW_REGION_IDS];
export const NULL_CAP = 3; // reporting threshold per region (plan policy P-CELL)

export function droppedIds() {
  const p = path.join(UPG, 'verify/dropped-regions.json');
  if (!existsSync(p)) return [];
  try {
    const j = JSON.parse(readFileSync(p, 'utf8'));
    const rows = Array.isArray(j) ? j : (j.dropped || j.regions || j.ids || []);
    return rows.map((r) => (typeof r === 'string' ? r : r && (r.id || r.regionId))).filter(Boolean);
  } catch { return []; }
}
export const expectedIds = () => { const d = new Set(droppedIds()); return PLANNED_IDS.filter((id) => !d.has(id)); };

// Files that wave-0 neighbour WPs create. Under LSF_WAVE_ISOLATION=1 they are treated as absent so a half-written
// neighbour cannot change a verify result of this WP.
export const ISOLATED_FILES = [
  /^data\/bioregions\.js$/, /^data\/reciprocity\.js$/, /^data\/sources\.js$/, /^data\/footprints\.json$/, /^data\/footprints\//,
  /^data\/layer-sources\.js$/, /^data\/processed\/koppen/, /^data\/processed\/bioregion/, /^data\/processed\/rivers-/,
];
export const isIsolated = (rel) => ISOLATION && ISOLATED_FILES.some((re) => re.test(rel));
export const has = (rel) => !isIsolated(rel) && existsSync(path.join(ROOT, rel));

export async function loadModule(rel) {
  if (!has(rel)) return null;
  return import(pathToFileURL(path.join(ROOT, rel)).href);
}
// For modules created by other WPs: a syntax error in a half-written neighbour is reported as {error}, never thrown.
export async function loadOptional(rel) {
  if (!has(rel)) return { mod: null, error: null, absent: true };
  try { return { mod: await import(pathToFileURL(path.join(ROOT, rel)).href), error: null, absent: false }; }
  catch (e) { return { mod: null, error: `${rel}: ${e.message}`, absent: false }; }
}
export function readJson(rel) {
  if (!has(rel)) return null;
  return JSON.parse(readFileSync(path.join(ROOT, rel), 'utf8'));
}
export function readText(rel) {
  if (!has(rel)) return null;
  return readFileSync(path.join(ROOT, rel), 'utf8');
}
export function listDir(rel) {
  const p = path.join(ROOT, rel);
  return !isIsolated(rel) && existsSync(p) ? readdirSync(p) : [];
}
export async function loadAll() {
  const reg = await loadModule('data/regions.js');
  const ls = await loadModule('data/land-standing.js');
  const rd = await loadModule('data/region-depth.js');
  const v1 = await loadModule('data/v1-lookup.js');
  const opt = {};
  for (const [k, rel] of Object.entries({ legalPathway: 'data/legal-pathway.js', context: 'data/context.js', sources: 'data/sources.js', layerSources: 'data/layer-sources.js', bioregions: 'data/bioregions.js', reciprocity: 'data/reciprocity.js', presets: 'data/presets.js', siteFacts: 'data/site-facts.js' })) opt[k] = await loadOptional(rel);
  const m = (k, name) => (opt[k].mod ? opt[k].mod[name] ?? null : null);
  const loadErrors = Object.values(opt).map((o) => o.error).filter(Boolean);
  return {
    regions: reg.regions, values: reg.values, criteria: reg.criteria,
    landStanding: ls.landStanding, regionDepth: rd.regionDepth, v1Lookup: v1.v1Lookup,
    legalPathway: m('legalPathway', 'legalPathway'), context: m('context', 'context'),
    sources: m('sources', 'sources'), sourcesMod: opt.sources.mod, layerSources: m('layerSources', 'layerSources'),
    bioregions: m('bioregions', 'bioregions'), reciprocity: m('reciprocity', 'reciprocity'),
    presets: m('presets', 'PRESETS'), siteFacts: opt.siteFacts.mod, loadErrors,
    footprints: readJson('data/footprints.json'),
    layers: Object.fromEntries(LAYERS.map((l) => [l, readJson(`data/processed/${l}.json`)])),
    hospital: readJson('data/processed/hospital-proximity.geojson'),
  };
}
export const walk = S.walk;
export const isUrl = S.isUrl;
export const isNum = S.isNum;
export const idsDiff = S.idsDiff;

// Allowlist of reasoned exceptions: [{ path: 'regex', pattern: 'regex', reason }]. Lives next to the tests (never in ROOT).
export function loadAllowlist() {
  const p = path.join(TESTS_DIR, 'allowlist.json');
  return existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : [];
}
export function makeAllowed(allow = loadAllowlist()) {
  return (p, s) => allow.some((a) => new RegExp(a.path).test(p) && new RegExp(a.pattern, 'i').test(s));
}

// Dead-link list (recon/link-health.json) minus the reasoned link exceptions (evidence-out/link-exceptions*.json).
export function deadLinkSet() {
  const dead = new Set(), norm = (u) => u.replace(/\/$/, '');
  const f = path.join(UPG, 'recon/link-health.json');
  if (existsSync(f)) {
    const j = JSON.parse(readFileSync(f, 'utf8'));
    for (const r of (Array.isArray(j) ? j : (j.results || j.urls || []))) if (r && r.class === 'dead' && r.url) dead.add(norm(r.url));
  }
  const dir = path.join(UPG, 'evidence-out');
  if (existsSync(dir)) for (const n of readdirSync(dir)) if (/^link-exceptions.*\.json$/.test(n)) {
    try { const j = JSON.parse(readFileSync(path.join(dir, n), 'utf8')); for (const r of (Array.isArray(j) ? j : (j.exceptions || j.rows || []))) if (r && r.url) dead.delete(norm(r.url)); } catch { /* unreadable exception file: no exceptions from it */ }
  }
  return dead;
}

// ---------------------------------------------------------------------------------------------------------------
// Pure checkers (shared by the real-data tests and the fixture self-tests)

// Null policy (plan policy P-CELL). Returns { warn: [], fail: [] }. NEW regions above the cap FAIL, existing ones WARN.
export function nullFindings(values, criteria, ids, newIds = NEW_REGION_IDS, cap = NULL_CAP) {
  const warn = [], fail = [], nw = new Set(newIds);
  for (const id of ids) {
    const nulls = criteria.filter((c) => values[id] && values[id][c.id] && values[id][c.id].value === null).map((c) => c.id);
    if (nulls.length > cap) (nw.has(id) ? fail : warn).push(`${id} has ${nulls.length} null cells (${nulls.join(', ')}); cap ${cap}${nw.has(id) ? ': a new region above the cap is dropped (P-DROP)' : ': reported, not a licence to keep a number'}`);
  }
  return { warn, fail };
}

// Flatten a module's exports to { "path": "string" }; arrays of objects with an `id` are keyed by it.
export function flattenStrings(obj, p = '', out = {}) {
  if (typeof obj === 'string') { out[p] = obj; return out; }
  if (Array.isArray(obj)) { obj.forEach((v, i) => flattenStrings(v, `${p}[${v && typeof v === 'object' && v.id ? `id=${v.id}` : i}]`, out)); return out; }
  if (obj && typeof obj === 'object') for (const [k, v] of Object.entries(obj)) flattenStrings(v, p ? `${p}.${k}` : k, out);
  return out;
}
// Every (path) whose baseline text contains "unceded" must still contain it in the shipped module.
export function uncededMissing(baselineObj, shippedObj) {
  const b = flattenStrings(baselineObj), s = flattenStrings(shippedObj), miss = [];
  for (const [k, v] of Object.entries(b)) if (/unceded/i.test(v) && !(k in s && /unceded/i.test(s[k]))) miss.push(k);
  return miss;
}
export const normHtml = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
// The 80 characters around each baseline occurrence (tags stripped, whitespace normalised) must still appear.
export function uncededContextMissing(baselineHtml, shippedHtml, span = 80) {
  const b = normHtml(baselineHtml), s = normHtml(shippedHtml), miss = [];
  for (const m of b.matchAll(/unceded/gi)) {
    const w = b.slice(Math.max(0, m.index - span / 2), Math.min(b.length, m.index + span / 2));
    if (!s.includes(w)) miss.push(w);
  }
  return miss;
}
// criteria-compat: effective unit/step of a baseline criterion are kept under an unchanged id.
export const critUnit = (c) => (c.unit ?? c.rangeLabel);
export function critStep(c) {
  if (c.step !== undefined) return c.step;
  const span = c.rangeMax - c.rangeMin; // the legacy slider step (src/main.js thresholdStep) that old shared links relied on
  return span <= 1 ? 0.01 : span <= 5 ? 0.1 : span <= 50 ? 1 : 10;
}
export function criteriaCompat(baseline, final, changesText = '') {
  const errs = [], fin = new Map(final.map((c) => [c.id, c]));
  for (const b of baseline) {
    const f = fin.get(b.id);
    if (!f) { if (!new RegExp(`\\b${b.id}\\b`).test(changesText)) errs.push(`criterion "${b.id}" removed or renamed and not listed in verify/criteria-changes.md`); continue; }
    if (f.higherIs !== b.higherIs) errs.push(`${b.id}.higherIs changed ${b.higherIs} -> ${f.higherIs} (give the criterion a new id instead)`);
    if (critUnit(f) !== critUnit(b)) errs.push(`${b.id} unit changed "${critUnit(b)}" -> "${critUnit(f)}" under an unchanged id (rename the key instead)`);
    if (critStep(f) !== critStep(b)) errs.push(`${b.id}.step changed ${critStep(b)} -> ${critStep(f)}: old shared links would mean something else (set step explicitly)`);
  }
  return errs;
}
// hygiene: list [label, path, text] triples that leak something.
export function hygieneHits(strings) {
  const hits = [];
  for (const { where, text } of strings) {
    if (typeof text !== 'string') continue;
    for (const [label, re] of S.HYGIENE) if (re.test(text) && !(label === 'phone' && /^https?:\/\//.test(text))) hits.push(`${where}: ${label} in "${text.slice(0, 90)}"`);
  }
  return hits;
}
export function stringsOf(obj, where) {
  const out = [];
  S.walk(obj, (_k, v, p) => { if (typeof v === 'string') out.push({ where: `${where}:${p}`, text: v }); });
  return out;
}
export function underscoreKeys(obj, where) {
  const hits = [];
  S.walk(obj, (k, _v, p) => { if (/^_/.test(k)) hits.push(`${where}:${p}`); });
  return hits;
}
// Baseline file from the 6bce1a3 commit, written into os.tmpdir() so it can be imported. Returns null if git cannot supply it.
let _tmp;
export function baselineFile(relFromRepo) {
  try {
    const text = execFileSync('git', ['-C', REPO, 'show', `${BASELINE_COMMIT}:${relFromRepo}`], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'ignore'] });
    _tmp ||= mkdtempSync(path.join(os.tmpdir(), 'lsf-baseline-'));
    const out = path.join(_tmp, relFromRepo.replace(/[\\/]/g, '__').replace(/\.js$/, '.mjs'));
    writeFileSync(out, text);
    return { text, file: out };
  } catch { return null; }
}
export async function baselineModule(relFromRepo) {
  const b = baselineFile(relFromRepo);
  return b ? import(pathToFileURL(b.file).href) : null;
}
export const fixture = (rel) => JSON.parse(readFileSync(path.join(TESTS_DIR, 'fixtures', rel), 'utf8'));
// Seeded PRNG (mulberry32) so random-threshold tests are reproducible.
export function prng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
