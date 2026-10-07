#!/usr/bin/env node
// Gate for the bioregioning and reciprocity data (WP BIO-8; promoted from upgrade-2026-10/tracks/bio-data/tools/).
// Run from prototype/. Exit 1 on any failure, 2 on usage or load errors.
//
//   node scripts/check_reciprocity.mjs                    structural checks over every region in data/regions.js
//   node scripts/check_reciprocity.mjs --strict           ship gate: also fails on
//                                                         - status other than 'verified', fewer than 2 first conversations
//                                                         - any `flag` field on an entry (a verified entry carries none)
//                                                         - bioregions refPoint more than 1 km from the region's coords in regions.js
//                                                         - territoryShort proper-noun warnings (a name not found in the Land standing territory text)
//   node scripts/check_reciprocity.mjs --ids a,b          restrict the per-region checks to these region ids
//   node scripts/check_reciprocity.mjs --status-report    print a per-region status table (markdown) and exit 0
//   node scripts/check_reciprocity.mjs --held FILE        human-review hold list (default upgrade-2026-10/verify/human-review-required.json
//                                                         when that file exists): rows { id, field, state, reason, shippedText, ownerWP }
//   node scripts/check_reciprocity.mjs --data-dir DIR     read regions.js, land-standing.js, bioregions.js, reciprocity.js from DIR (default prototype/data)
//   node scripts/check_reciprocity.mjs --skip-assets      do not check the processed bioregion asset files
//   node scripts/check_reciprocity.mjs --self-test        prove every check fires on a planted defect
//
// Always failures (strict or not): personal data (email, phone, handle, personal profile link), banned copy words
// (the hard rules of lint_bio_copy.mjs), a score/rank/weight-like key, a non-https url, an internal path in any url or
// source (nothing from upgrade-2026-10/ or reverify/ ever ships), a withheld field that is present, a held region whose
// territoryShort names a single party where authority is contested, and a notThere that adds a claim beyond the shipped
// Land standing sentences.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';
import { loadExports, lintText, dataStrings } from './lint_bio_copy.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROTO = path.resolve(HERE, '..');
const REPO = path.resolve(PROTO, '..');
const DEFAULT_HELD = path.join(REPO, 'upgrade-2026-10', 'verify', 'human-review-required.json');

const FORBIDDEN_KEYS = /(score|rank|weight|rating|stars|points|total|composite)/i;
const AUTHORITY_WORDS = /unceded|ceded|sovereign|rightful|owner|authority|title/i;
const INTERNAL_PATH = /upgrade-2026-10|reverify[\/\\]|evidence-out[\/\\]|(?:^|[\s"'(\/])\.\.\/|\btracks\/[\w-]+\/|\bprototype\/(?:data|scripts)\//i;
const INTERNAL_FILE_REF = /(?:^|[\s"'(])[\w./-]*[\w-]\.(?:md|mjs|py)(?=$|[\s)"'.,;:])/i;
const LS_FIELDS = new Set(['territory', 'tenure', 'entry', 'obligation', 'source', 'sourceUrl']);
const RECIP_FIELDS = new Set(['contested', 'trajectory', 'notThere', 'territoryShort', 'firstConversations', 'claims']);
const HELD_STATES = new Set(['withheld', 'shipped-derived', 'shipped-neutral']);
const ASSETS = ['data/processed/bioregions-europe.geojson', 'data/processed/bioregions-na.geojson', 'data/processed/bioregion-borders-europe.geojson', 'data/processed/bioregion-borders-na.geojson', 'data/processed/rivers-europe.geojson', 'data/processed/rivers-na.geojson', 'data/processed/bioregion-labels.json'];

const stripDia = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const normText = (s) => String(s).toLowerCase().replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, '-').replace(/\s+/g, ' ').trim();
const hav = (a, b) => {
  const R = 6371, rad = (d) => (d * Math.PI) / 180;
  const dLat = rad(b[1] - a[1]), dLon = rad(b[0] - a[0]);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

function walkKeys(o, p, cb) {
  if (Array.isArray(o)) o.forEach((v, i) => walkKeys(v, `${p}[${i}]`, cb));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { cb(k, v, `${p}.${k}`); walkKeys(v, `${p}.${k}`, cb); }
}
function allStrings(o, p, cb) {
  if (typeof o === 'string') cb(o, p, '');
  else if (Array.isArray(o)) o.forEach((v, i) => allStrings(v, `${p}[${i}]`, cb));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) {
    if (typeof v === 'string') cb(v, `${p}.${k}`, k); else allStrings(v, `${p}.${k}`, cb);
  }
}
const hasFlag = (e) => { let f = null; walkKeys(e, '', (k, v, p) => { if (k === 'flag' && v) f = f || p.replace(/^\./, ''); }); return f; };

// normalise a hold-list row to { id, field, state, ... }
function normHeld(raw) {
  const rows = Array.isArray(raw) ? raw : (raw && (raw.items || raw.rows || raw.held)) || [];
  return rows.map((r) => {
    let { id, field } = r;
    if (typeof id === 'string' && id.includes('.') && !field) [id, field] = id.split('.');
    else if (typeof field === 'string' && field.includes('.')) { const [a, b] = field.split('.'); if (!id || id === a) { id = a; field = b; } }
    return { ...r, id, field };
  });
}

// territoryShort names at least two proper nouns separated by a comma, 'and' or '&'
function multiParty(s) {
  const parts = String(s).split(/\s*,\s*|\s+and\s+|\s*&\s*/i).map((x) => x.trim()).filter(Boolean);
  return parts.filter((p) => /\p{Lu}[\p{L}'’-]+/u.test(p)).length >= 2;
}

// ---------------------------------------------------------------------------------------------------------------
// runChecks(data, { strict, ids }) -> { problems, warns }
// data = { regions, landStanding, bioregions, bioregionSources, reciprocity, kindLabels, protocols, held }
// ---------------------------------------------------------------------------------------------------------------
export function runChecks(data, opts = {}) {
  const { strict = false } = opts;
  const problems = [], warns = [];
  const fail = (m) => problems.push(m), warn = (m) => warns.push(m);
  const { regions, landStanding = {}, bioregions = {}, bioregionSources = {}, reciprocity = {}, kindLabels = {}, protocols = [], held = null } = data;
  const KINDS = new Set(Object.keys(kindLabels));
  const regionIds = new Set(regions.map((r) => r.id));
  let list = regions;
  if (opts.ids) {
    for (const id of opts.ids) if (!regionIds.has(id)) fail(`--ids: '${id}' is not in regions.js`);
    list = regions.filter((r) => opts.ids.includes(r.id));
  }
  const shortWarn = (m) => (strict ? fail(m) : warn(m));

  const copyHard = (text, where) => {
    for (const f of lintText(text).fails) fail(`${where}: copy rule ${f.rule} -> "${f.match}"`);
  };
  const urlHygiene = (url, where) => {
    if (typeof url !== 'string' || !/^https:\/\//.test(url)) fail(`${where}: url must be https (public source): ${JSON.stringify(url)}`);
    else {
      if (INTERNAL_PATH.test(url)) fail(`${where}: url looks like an internal path: ${url}`);
      for (const f of lintText(url, { only: ['personal-email', 'personal-profile-link', 'personal-handle'] }).fails) fail(`${where}: personal data in url (${f.rule}): ${url}`);
    }
  };

  for (const r of list) {
    const id = r.id;
    const b = bioregions[id], rc = reciprocity[id], ls = landStanding[id];
    if (!ls) fail(`${id}: no landStanding entry (ship gate)`);
    if (!b) fail(`${id}: no bioregions entry`);
    else {
      if (!b.place) fail(`${id}: bioregions.place missing`);
      if (!b.ecoregions?.length) fail(`${id}: no ecoregions`);
      for (const e of b.ecoregions || []) if (!e.id || !e.name || !e.biome) fail(`${id}: ecoregion incomplete ${JSON.stringify(e)}`);
      if (!b.watershed?.major || !b.watershed?.drainsTo || !b.watershed?.rivers?.length) fail(`${id}: watershed incomplete`);
      if (!Array.isArray(b.refPoint) || b.refPoint.length !== 2) fail(`${id}: bioregions.refPoint missing`);
      else if (Array.isArray(r.coords)) {
        const km = hav(b.refPoint, r.coords);
        if (km > 1) (strict ? fail : warn)(`${id}: bioregions.refPoint ${JSON.stringify(b.refPoint)} is ${km.toFixed(1)} km from regions.js coords ${JSON.stringify(r.coords)} (mismatch)`);
        else if (km > 0.01) warn(`${id}: bioregions.refPoint differs from regions.js coords by ${km.toFixed(2)} km`);
      }
      const hit = (s, p) => { copyHard(s, p); };
      allStrings(b, `${id}.bio`, (s, p, k) => { if (!/^(?:url|licenseUrl|download)$/.test(k) && !/^https?:\/\//.test(s)) hit(s, p); });
    }
    if (!rc) { fail(`${id}: no reciprocity entry`); continue; }

    if (strict && rc.status !== 'verified') fail(`${id}: reciprocity.status is '${rc.status}', expected 'verified'`);
    if (strict && !rc.reviewed) fail(`${id}: reciprocity.reviewed date missing`);
    const flag = hasFlag(rc);
    if (flag) (strict ? fail : warn)(`${id}: entry carries a 'flag' (${flag}); a verified entry carries none`);

    if (!rc.territoryShort || rc.territoryShort.split(/\s+/).length > 9) fail(`${id}: territoryShort missing or longer than 9 words`);
    if (ls && rc.territoryShort) {
      const caps = rc.territoryShort.match(/\b[A-ZÀ-Ý][\p{L}'’-]{3,}\b/gu) || [];
      const hay = stripDia(ls.territory || '');
      for (const w of caps) {
        const k = stripDia(w);
        if (!hay.includes(k.slice(0, Math.max(4, k.length - 2)))) shortWarn(`${id}: territoryShort word '${w}' not found in landStanding.territory`);
      }
    }
    if (!rc.firstConversations?.length) fail(`${id}: no firstConversations`);
    if (strict && (rc.firstConversations?.length || 0) < 2) fail(`${id}: fewer than 2 firstConversations`);
    for (const f of rc.firstConversations || []) {
      if (!KINDS.has(f.kind)) fail(`${id}: bad kind '${f.kind}' on ${f.name}`);
      urlHygiene(f.url, `${id}: ${f.name}`);
      if (!f.what || f.what.length > 260) fail(`${id}: ${f.name}: 'what' missing or over 260 chars`);
    }
    if (rc.notThere && (!rc.notThere.forms?.length || !rc.notThere.basis?.length)) fail(`${id}: notThere needs forms and basis`);
    for (const c of rc.claims || []) {
      if (!['territory', 'tenure', 'entry', 'obligation'].includes(c.field) || !c.url || !c.claim) fail(`${id}: bad claim ${JSON.stringify(c).slice(0, 80)}`);
    }
    if (rc.contested && !rc.contested.sources?.length) fail(`${id}: contested without sources`);
    if (rc.trajectory && !rc.trajectory.sources?.length) fail(`${id}: trajectory without sources`);

    // (b) public sources only: every url is https and no string anywhere points into the repo; labels never say 'internal'.
    walkKeys(rc, id, (k, v, p) => {
      if (FORBIDDEN_KEYS.test(k)) fail(`${p}: key looks like a score or rank`);
      if (k === 'url') urlHygiene(v, p);
    });
    allStrings(rc, id, (s, p, k) => {
      if (k !== 'url' && (INTERNAL_PATH.test(s) || INTERNAL_FILE_REF.test(s)) && !/^https?:\/\//.test(s)) fail(`${p}: internal path or file reference in shipped text: ${s.slice(0, 80)}`);
      if (/\binternal\b/i.test(s) && k !== 'url') fail(`${p}: the word 'internal' marks a note that must not ship: ${s.slice(0, 80)}`);
      copyHard(s, p);
    });
  }

  // module-wide keys, urls and copy
  for (const [name, mod] of [['bioregions', bioregions], ['reciprocity', reciprocity], ['landStanding', landStanding]]) {
    walkKeys(mod, name, (k, v, p) => { if (opts.ids && !opts.ids.some((i) => p.startsWith(`${name}.${i}`))) return; if (FORBIDDEN_KEYS.test(k)) fail(`${p}: key looks like a score or rank`); });
  }
  for (const [i, pr] of protocols.entries()) {
    urlHygiene(pr.url, `protocols[${i}] ${pr.name}`);
    allStrings(pr, `protocols[${i}]`, (s, p) => copyHard(s, p));
  }
  allStrings(kindLabels, 'kindLabels', (s, p) => copyHard(s, p));
  for (const id of Object.keys(bioregions)) if (!regionIds.has(id)) warn(`bioregions has '${id}' which is not in regions.js`);
  for (const id of Object.keys(reciprocity)) if (!regionIds.has(id)) warn(`reciprocity has '${id}' which is not in regions.js`);
  if (!opts.ids) for (const k of ['ecoregions', 'rivers', 'hydrobasins']) if (!bioregionSources[k]?.license) fail(`bioregionSources.${k}.license missing`);

  // (a) held-review rules (review issues D1, D2, D5, D11)
  if (held) {
    const rows = normHeld(held);
    const withheldContested = new Set();
    for (const row of rows) {
      const where = `held ${row.id}.${row.field}`;
      if (!row.id || !row.field) { fail(`${where}: row needs id and field`); continue; }
      if (!HELD_STATES.has(row.state)) fail(`${where}: unknown state '${row.state}'`);
      if (!regionIds.has(row.id)) { warn(`${where}: region not in regions.js (dropped?); row skipped`); continue; }
      if (opts.ids && !opts.ids.includes(row.id)) continue;
      const rc = reciprocity[row.id];
      if (!rc) { fail(`${where}: no reciprocity entry`); continue; }
      if (row.state === 'withheld') {
        if (RECIP_FIELDS.has(row.field)) {
          const v = rc[row.field];
          if (v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) fail(`${where}: withheld field is present in data/reciprocity.js (must be null or absent)`);
          if (row.field === 'contested') withheldContested.add(row.id);
        } else if (LS_FIELDS.has(row.field)) warn(`${where}: base Land standing field held; the live text stays and is not checked here`);
        else fail(`${where}: unknown field '${row.field}'`);
      }
      if (row.field === 'notThere' && row.state === 'shipped-derived') {
        const nt = rc.notThere;
        if (!nt) fail(`${where}: shipped-derived notThere is null`);
        else notThereSubset(row.id, nt, landStanding[row.id], fail);
      }
    }
    // where contested is withheld, a single-nation territoryShort would assert one authority
    for (const id of withheldContested) {
      const rc = reciprocity[id];
      if (rc && (rc.contested === null || rc.contested === undefined)) {
        if (!rc.territoryShort || !multiParty(rc.territoryShort)) fail(`${id}: contested is withheld, so territoryShort must name at least two proper nouns separated by a comma, 'and' or '&' (got ${JSON.stringify(rc.territoryShort)})`);
        if (rc.territoryShort && AUTHORITY_WORDS.test(rc.territoryShort)) fail(`${id}: territoryShort carries an authority word (${rc.territoryShort.match(AUTHORITY_WORDS)[0]}) where authority is contested`);
      }
    }
    const nm = 'ne-missouri-se-iowa';
    if (regionIds.has(nm) && (!opts.ids || opts.ids.includes(nm)) && reciprocity[nm]) {
      const nt = reciprocity[nm].notThere;
      if (!nt) fail(`${nm}: notThere must be non-null (admitted over the reciprocity judge's dissent; derived verbatim from the shipped Land standing sentences)`);
      else notThereSubset(nm, nt, landStanding[nm], fail);
    }
  }
  return { problems, warns };
}

// every clause of a notThere form must occur verbatim in the shipped Land standing entry/obligation sentences (no new claim)
function notThereSubset(id, nt, ls, fail) {
  if (!ls) { fail(`${id}: notThere cannot be checked without a landStanding entry`); return; }
  const hay = normText(`${ls.entry || ''} ${ls.obligation || ''}`);
  for (const form of nt.forms || []) {
    const clauses = String(form).split(/[.;:!?,]|\s[—–-]\s/).map((c) => normText(c).replace(/^[\s'"()]+|[\s'"()]+$/g, '')).filter(Boolean);
    if (!clauses.length) fail(`${id}: notThere form is empty`);
    for (const c of clauses) if (!hay.includes(c)) fail(`${id}: notThere clause "${c}" is not in the shipped Land standing entry or obligation (no new claim allowed)`);
  }
}

// ---------------------------------------------------------------------------------------------------------------
export function statusReport(data, opts = {}) {
  const { regions, reciprocity = {}, bioregions = {} } = data;
  const list = opts.ids ? regions.filter((r) => opts.ids.includes(r.id)) : regions;
  const rows = list.map((r) => {
    const rc = reciprocity[r.id], b = bioregions[r.id];
    if (!rc) return `| ${r.id} | MISSING | | | | | | | |`;
    const kinds = [...new Set((rc.firstConversations || []).map((f) => f.kind))].join(', ');
    return `| ${r.id} | ${rc.status || '?'} | ${rc.reviewed || ''} | ${(rc.firstConversations || []).length} (${kinds}) | ${rc.notThere ? 'yes' : 'null'} | ${rc.contested ? 'yes' : 'null'} | ${rc.trajectory ? 'yes' : 'null'} | ${(rc.claims || []).length} | ${hasFlag(rc) ? 'FLAG' : ''}${b ? '' : ' no-bioregion'} |`;
  });
  const counts = { verified: 0, other: 0, missing: 0 };
  for (const r of list) { const rc = reciprocity[r.id]; if (!rc) counts.missing++; else if (rc.status === 'verified') counts.verified++; else counts.other++; }
  return [`regions in regions.js: ${list.length}; verified: ${counts.verified}; not verified: ${counts.other}; no entry: ${counts.missing}`, '',
    '| region | status | reviewed | first conversations | notThere | contested | trajectory | claims | flags |', '|---|---|---|---|---|---|---|---|---|', ...rows].join('\n');
}

export function checkAssets(proto) {
  const problems = [];
  for (const f of ASSETS) {
    const p = path.join(proto, f);
    if (!fs.existsSync(p)) problems.push(`missing asset ${f}`);
    else { try { JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { problems.push(`asset ${f} is not valid JSON: ${e.message}`); } }
  }
  return problems;
}

export function loadData(dir) {
  const need = (f) => { const p = path.join(dir, f); if (!fs.existsSync(p)) throw new Error(`${p} not found`); return loadExports(p); };
  const r = need('regions.js'), ls = need('land-standing.js'), b = need('bioregions.js'), rc = need('reciprocity.js');
  return { regions: r.regions, landStanding: ls.landStanding, bioregions: b.bioregions, bioregionSources: b.bioregionSources, reciprocity: rc.reciprocity, kindLabels: rc.kindLabels, protocols: rc.protocols || [] };
}

function runCli(argv) {
  const args = argv.slice(2);
  if (args.includes('--self-test')) return selfTest();
  const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
  const known = new Set(['--strict', '--ids', '--status-report', '--held', '--data-dir', '--skip-assets', '--self-test']);
  for (const a of args) if (a.startsWith('--') && !known.has(a)) { console.error(`unknown option ${a}`); return 2; }
  const strict = args.includes('--strict');
  const ids = opt('--ids') ? opt('--ids').split(',').map((s) => s.trim()).filter(Boolean) : null;
  const dir = path.resolve(opt('--data-dir') || path.join(PROTO, 'data'));
  let data;
  try { data = loadData(dir); } catch (e) { console.error(`ERROR: ${e.message}`); return 2; }
  if (args.includes('--status-report')) { console.log(statusReport(data, { ids })); return 0; }
  let heldPath = opt('--held');
  const heldExplicit = Boolean(heldPath);
  if (!heldPath && fs.existsSync(DEFAULT_HELD)) heldPath = DEFAULT_HELD;
  let held = null;
  if (heldPath) {
    heldPath = path.resolve(heldPath);
    if (!fs.existsSync(heldPath)) { if (heldExplicit) { console.log(`FAIL --held file not found: ${heldPath}`); return 1; } }
    else { try { held = JSON.parse(fs.readFileSync(heldPath, 'utf8')); } catch (e) { console.log(`FAIL --held file is not valid JSON: ${e.message}`); return 1; } }
  }
  const { problems, warns } = runChecks({ ...data, held }, { strict, ids });
  if (!args.includes('--skip-assets') && !ids) problems.push(...checkAssets(path.resolve(dir, '..')));
  const checked = ids ? ids.length : data.regions.length;
  console.log(`regions checked: ${checked}; mode: ${strict ? 'strict' : 'standard'}; held list: ${held ? normHeld(held).length + ' rows' : 'none'}; problems: ${problems.length}; warnings: ${warns.length}`);
  warns.forEach((w) => console.log('WARN', w));
  problems.forEach((p) => console.log('FAIL', p));
  return problems.length ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------------------------
// Self-test: a clean synthetic dataset passes --strict; each planted defect makes the matching check fail.
// ---------------------------------------------------------------------------------------------------------------
function fixture() {
  const mkBio = (coords, place) => ({ refPoint: coords.slice(), method: 'RESOLVE Ecoregions 2017 around refPoint', place, ecoregions: [{ id: 1, name: 'Plain Forests', biome: 'Temperate Forests', share: 60 }], watershed: { major: 'Alder basin', rivers: ['Alder'], drainsTo: 'the sea' } });
  const fc = (name, kind) => ({ name, kind, url: `https://example.org/${name.toLowerCase().replace(/\s+/g, '-')}`, what: 'A public body to read first.', checked: '2026-10-04', via: 'curl+page' });
  return {
    regions: [
      { id: 'aa', coords: [10, 50] },
      { id: 'vermont', coords: [-72.6, 44] },
      { id: 'ne-missouri-se-iowa', coords: [-92, 40.5] },
    ],
    landStanding: {
      aa: { territory: 'Alder Valley commons held by the Alder people', tenure: 'Freehold', entry: 'Buy only through the village assembly', obligation: 'Hold the shared water with the neighbours' },
      vermont: { territory: 'Ndakina, the Wabanaki homeland, and the Abenaki communities of Odanak and Wolinak', tenure: 'Freehold', entry: 'Buy through the town', obligation: 'Learn whose land it is' },
      'ne-missouri-se-iowa': {
        territory: 'Sac and Fox country now farmed commons',
        tenure: 'Freehold',
        entry: 'Not as a lone buyer shopping on price: not there.',
        obligation: 'Join the neighbours in a farming country with an ageing population rather than landing as a lone buyer chasing low prices, where the honest answer is not there.',
      },
    },
    bioregions: { aa: mkBio([10, 50], 'Alder valley'), vermont: mkBio([-72.6, 44], 'Green hills'), 'ne-missouri-se-iowa': mkBio([-92, 40.5], 'Prairie edge') },
    bioregionSources: { ecoregions: { license: 'CC BY 4.0' }, rivers: { license: 'Public domain' }, hydrobasins: { license: 'Analysis only' } },
    kindLabels: { host: 'Host nation or community', regulator: 'Body that sets the rules', access: 'Land-access programme', commons: 'Commons body' },
    protocols: [{ name: 'A protocol', url: 'https://example.org/protocol', what: 'A reference text.', checked: '2026-10-04' }],
    reciprocity: {
      aa: { territoryShort: 'Alder people land', contested: null, trajectory: null, firstConversations: [fc('Alder Council', 'host'), fc('Alder Fund', 'access')], notThere: null, claims: [{ field: 'territory', claim: 'The Alder people hold the valley.', label: 'Alder page', url: 'https://example.org/alder' }], reviewed: '2026-10-05', status: 'verified' },
      vermont: { territoryShort: 'Ndakina, Wabanaki homeland', contested: null, trajectory: null, firstConversations: [fc('Ndakina Office', 'host'), fc('Hill Trust', 'access')], notThere: null, claims: [], reviewed: '2026-10-05', status: 'verified' },
      'ne-missouri-se-iowa': {
        territoryShort: 'Sac and Fox country', contested: null, trajectory: null,
        firstConversations: [fc('Prairie Commons', 'commons'), fc('Farm Fund', 'access')],
        notThere: { forms: ['Not as a lone buyer shopping on price: not there.'], basis: [{ label: 'Commons history page', url: 'https://example.org/history' }] },
        claims: [], reviewed: '2026-10-05', status: 'verified',
      },
    },
    held: [
      { id: 'vermont', field: 'contested', state: 'withheld', reason: 'human review required', shippedText: '', ownerWP: 'BIO-2' },
      { id: 'ne-missouri-se-iowa', field: 'notThere', state: 'shipped-derived', reason: 'copy discipline', shippedText: 'Not as a lone buyer shopping on price: not there.', ownerWP: 'BIO-2' },
    ],
  };
}

function selfTest() {
  let bad = 0, checks = 0;
  const ok = (c, label) => { checks++; if (!c) { bad++; console.log(`SELF-TEST FAIL: ${label}`); } };
  const clone = () => structuredClone(fixture());
  const run = (d, o = { strict: true }) => runChecks(d, o);
  const has = (r, re) => r.problems.some((p) => re.test(p));

  const base = run(clone());
  ok(base.problems.length === 0, `clean fixture must pass --strict; got: ${base.problems.join(' | ')}`);
  ok(run(clone(), { strict: false }).problems.length === 0, 'clean fixture must pass standard mode');

  // Acceptance list, one planted defect each
  let d = clone(); d.reciprocity.vermont.contested = { text: 'Disputed.', sources: [{ label: 'x', url: 'https://example.org/x' }] };
  ok(has(run(d), /vermont.*withheld field is present/), 'a withheld field present in data must fail');

  d = clone(); d.reciprocity.vermont.territoryShort = 'Wabanaki homeland';
  ok(has(run(d), /vermont.*at least two proper nouns/), 'a held id with a single-nation territoryShort must fail');
  d = clone(); d.reciprocity.vermont.territoryShort = 'Ndakina and Wabanaki unceded land';
  ok(has(run(d), /authority word \(unceded\)/), 'a territoryShort with the word unceded must fail');
  for (const w of ['ceded', 'sovereign', 'rightful', 'owner', 'authority', 'title']) {
    d = clone(); d.reciprocity.vermont.territoryShort = `Ndakina, Wabanaki ${w} land`;
    ok(has(run(d), /authority word/), `authority word '${w}' in a held territoryShort must fail`);
  }
  d = clone(); d.reciprocity['ne-missouri-se-iowa'].notThere.basis[0].url = 'upgrade-2026-10/regions/briefs/ne-missouri-se-iowa.md';
  ok(has(run(d), /url must be https|internal path/), 'an internal path in a basis URL must fail');
  d = clone(); d.reciprocity['ne-missouri-se-iowa'].notThere.basis[0].url = 'https://example.org/upgrade-2026-10/note';
  ok(has(run(d), /internal path/), 'an https URL that carries upgrade-2026-10 must fail');
  d = clone(); d.reciprocity.aa.claims[0].url = 'https://example.org/reverify/aa.md';
  ok(has(run(d), /internal path/), 'a reverify/ path in a claim URL must fail');
  d = clone(); d.reciprocity['ne-missouri-se-iowa'].notThere.forms = ['Not as a lone buyer shopping on price: not there. Cheap acreage in shrinking towns is the displacement route.'];
  ok(has(run(d), /clause .* is not in the shipped Land standing/), 'a notThere with a clause absent from the standing text must fail');
  d = clone(); d.reciprocity['ne-missouri-se-iowa'].notThere = null;
  ok(has(run(d), /notThere/), 'ne-missouri-se-iowa with a null notThere must fail');

  // Other strict gates
  d = clone(); d.reciprocity.aa.notThere = { forms: ['Arriving alone'], basis: [{ label: 'x', url: 'https://example.org/b' }], flag: 'review' };
  ok(has(run(d), /'flag'/) && !run(d, { strict: false }).problems.some((p) => /'flag'/.test(p)), 'a flag on a verified entry fails in strict mode only');
  d = clone(); d.reciprocity.aa.status = 'draft';
  ok(has(run(d), /status is 'draft'/), 'a non-verified status fails in strict mode');
  d = clone(); d.reciprocity.aa.firstConversations = d.reciprocity.aa.firstConversations.slice(0, 1);
  ok(has(run(d), /fewer than 2/), 'fewer than two first conversations fails in strict mode');
  d = clone(); d.reciprocity.aa.firstConversations[0].what = 'Write to maria@example.org for help.';
  ok(has(run(d, { strict: false }), /personal-email/), 'an email must fail (always)');
  d = clone(); d.reciprocity.aa.firstConversations[0].what = 'Ring +44 20 7946 0958 first.';
  ok(has(run(d, { strict: false }), /personal-phone/), 'a phone number must fail (always)');
  d = clone(); d.reciprocity.aa.firstConversations[0].what = 'Follow @aldercouncil for news.';
  ok(has(run(d, { strict: false }), /personal-handle/), 'a handle must fail (always)');
  d = clone(); d.reciprocity.aa.firstConversations[0].url = 'https://instagram.com/maria';
  ok(has(run(d, { strict: false }), /personal data in url/), 'a personal profile url must fail (always)');
  d = clone(); d.reciprocity.aa.score = 4;
  ok(has(run(d, { strict: false }), /key looks like a score or rank/), 'a score-like key must fail');
  d = clone(); d.reciprocity.aa.firstConversations[0].rankOrder = 1;
  ok(has(run(d, { strict: false }), /key looks like a score or rank/), 'a rank-like key must fail');
  d = clone(); d.bioregions.aa.refPoint = [10.5, 50];
  ok(has(run(d), /refPoint .*mismatch/) && !run(d, { strict: false }).problems.some((p) => /mismatch/.test(p)), 'a refPoint mismatch fails in strict mode (warns otherwise)');
  d = clone(); d.reciprocity.aa.territoryShort = 'Ostrich people land';
  ok(has(run(d), /territoryShort word 'Ostrich'/) && !run(d, { strict: false }).problems.some((p) => /Ostrich/.test(p)), 'a territoryShort proper-noun warning counts as a failure in strict mode');
  d = clone(); d.reciprocity.aa.territoryShort = 'one two three four five six seven eight nine ten';
  ok(has(run(d), /longer than 9 words/), 'a territoryShort over nine words must fail');
  d = clone(); d.reciprocity.aa.firstConversations[0].url = 'http://example.org/plain';
  ok(has(run(d), /url must be https/), 'a non-https url must fail');
  d = clone(); d.reciprocity.aa.contested = { text: 'x', sources: [{ label: 'Re-verification note (internal)', url: 'https://example.org/n' }] };
  ok(has(run(d), /'internal'/), "the word 'internal' in a source label must fail");
  d = clone(); d.reciprocity.aa.trajectory = { text: 'This is the best place.', kind: 'return', sources: [{ label: 'x', url: 'https://example.org/t' }] };
  ok(has(run(d, { strict: false }), /rank-best/), 'banned copy in a reciprocity string must fail');
  d = clone(); d.reciprocity.aa.trajectory = { text: 'Verified by the nation itself.', kind: 'return', sources: [{ label: 'x', url: 'https://example.org/t' }] };
  ok(has(run(d, { strict: false }), /claim-reviewed-by/), "'verified by the nation' in a reciprocity string must fail");
  d = clone(); delete d.reciprocity.aa;
  ok(has(run(d), /aa: no reciprocity entry/), 'a missing reciprocity entry must fail');
  d = clone(); d.reciprocity.aa.firstConversations[0].kind = 'friend';
  ok(has(run(d), /bad kind/), 'an unknown kind must fail');
  d = clone(); d.held[0].state = 'pending';
  ok(has(run(d), /unknown state/), 'an unknown held state must fail');
  d = clone(); d.held.push({ id: 'aa', field: 'trajectory', state: 'withheld' }); d.reciprocity.aa.trajectory = { text: 'x', kind: 'return', sources: [{ label: 'x', url: 'https://example.org/t' }] };
  ok(has(run(d), /aa\.trajectory.*withheld field is present/), 'any withheld reciprocity field present must fail');
  d = clone(); d.held = [{ id: 'vermont.contested', state: 'withheld' }];
  ok(run(d).problems.length === 0, 'dotted id form of a hold row is understood');
  d = clone(); d.held.push({ id: 'vermont', field: 'territory', state: 'withheld' });
  ok(run(d).problems.length === 0 && run(d).warns.some((w) => /base Land standing field held/.test(w)), 'a held base Land standing field keeps the live text and only warns');

  // --ids filters the per-region checks
  d = clone(); d.reciprocity.aa.firstConversations[0].what = 'maria@example.org';
  ok(run(d, { strict: true, ids: ['vermont'] }).problems.length === 0 && run(d, { strict: true, ids: ['aa'] }).problems.length > 0, '--ids restricts the per-region checks');
  ok(has(run(clone(), { strict: true, ids: ['nope'] }), /--ids: 'nope'/), '--ids with an unknown id fails');

  // --status-report
  const rep = statusReport(clone());
  ok(/regions in regions\.js: 3; verified: 3/.test(rep) && /\| aa \| verified \|/.test(rep) && /\| ne-missouri-se-iowa \| verified .*yes/.test(rep), 'status report lists every region with its state');

  // CLI: exit codes through a scratch data dir (regions.js, land-standing.js, bioregions.js, reciprocity.js)
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'checkrecip-'));
  try {
    const writeDir = (dir, dd) => {
      fs.mkdirSync(dir, { recursive: true });
      const j = (o) => JSON.stringify(o, null, 1);
      fs.writeFileSync(path.join(dir, 'regions.js'), `export const regions = ${j(dd.regions)};\n`);
      fs.writeFileSync(path.join(dir, 'land-standing.js'), `export const landStanding = ${j(dd.landStanding)};\n`);
      fs.writeFileSync(path.join(dir, 'bioregions.js'), `export const bioregionSources = ${j(dd.bioregionSources)};\nexport const bioregions = ${j(dd.bioregions)};\n`);
      fs.writeFileSync(path.join(dir, 'reciprocity.js'), `export const kindLabels = ${j(dd.kindLabels)};\nexport const protocols = ${j(dd.protocols)};\nexport const reciprocity = ${j(dd.reciprocity)};\n`);
    };
    const good = clone(); const heldFile = path.join(tmp, 'held.json');
    fs.writeFileSync(heldFile, JSON.stringify(good.held));
    writeDir(path.join(tmp, 'good', 'data'), good);
    const badD = clone(); badD.reciprocity.vermont.contested = { text: 'x', sources: [{ label: 'x', url: 'https://example.org/x' }] };
    writeDir(path.join(tmp, 'bad', 'data'), badD);
    const cli = (a) => spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a], { encoding: 'utf8' });
    ok(cli(['--strict', '--skip-assets', '--held', heldFile, '--data-dir', path.join(tmp, 'good', 'data')]).status === 0, 'CLI: clean data exits 0 under --strict --held');
    ok(cli(['--strict', '--skip-assets', '--held', heldFile, '--data-dir', path.join(tmp, 'bad', 'data')]).status === 1, 'CLI: a withheld field present exits 1');
    ok(cli(['--strict', '--skip-assets', '--held', path.join(tmp, 'missing.json'), '--data-dir', path.join(tmp, 'good', 'data')]).status === 1, 'CLI: an explicit --held file that is missing exits 1');
    ok(cli(['--strict', '--data-dir', path.join(tmp, 'good', 'data'), '--held', heldFile]).status === 1, 'CLI: missing asset files fail the full gate unless --skip-assets');
    const sr = cli(['--status-report', '--data-dir', path.join(tmp, 'good', 'data')]);
    ok(sr.status === 0 && /\| vermont \| verified \|/.test(sr.stdout), 'CLI: --status-report prints the table and exits 0');
    ok(cli(['--ids', 'aa', '--strict', '--skip-assets', '--held', heldFile, '--data-dir', path.join(tmp, 'good', 'data')]).status === 0, 'CLI: --ids aa exits 0 on clean data');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`check_reciprocity self-test: ${checks} checks, ${bad} failures`);
  return bad ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exit(runCli(process.argv));
