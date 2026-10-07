#!/usr/bin/env node
// gen_deeper_sections.mjs: writes the generated parts of prototype/deeper.html (DOC-6, 2026-10).
//
//   node scripts/gen_deeper_sections.mjs [--check | --write] [--root DIR] [--file NAME] [--licences FILE] [--stats] [--json OUT]
//
// What it owns
//   <!-- GEN:criteria:start --> ... <!-- GEN:criteria:end -->   the criteria grid, from criteria[] of data/regions.js
//   <!-- GEN:layers:start -->   ... <!-- GEN:layers:end -->     the map-layer list, from data/layer-sources.js
//   <!-- GEN:sources:start -->  ... <!-- GEN:sources:end -->    the bibliography, from every data module that cites a source
//   <!--f:KEY-->text<!--/f-->   a count or date fact printed from data/site-facts.js (same markers scripts/stamp_build.mjs writes)
//   <!--g:KEY-->text<!--/g-->   a fact only this generator derives (counts of qualitative filters, per-jurisdiction layers,
//                               live and local map layers, sources, licences not confirmed, the link-check line)
// Counts are static text in the file: deeper.html never reads data at runtime.
//
// Modes
//   --check   (default) read only; exit 1 when the file differs from what --write would produce, or when a generated URL has
//             no recorded link status, or a recorded status is dead / blocked.
//   --write   rewrite the file; idempotent.
//   --root    site root holding data/, lib/, src/ and the page (default: the prototype/ this script lives in); scratch sites use it.
//   --licences  the curated table (default: upgrade-2026-10/tracks/docs/data/source-licenses.json).
//   --stats   print counts and exit 0 (no file is read or written).
//   --json    also write the collected bibliography entries to OUT (for the notes).
//
// The curated table (DOC-6, upgrade-2026-10/tracks/docs/data/source-licenses.json) holds: `licences` (per registry id, wording copied
// from the provider page that was opened), `urlFixes` (old URL -> replacement, null = citation dropped), `legacyBibliography`
// (the earlier hand-written list, kept where it still backs a sentence) and `linkCheck` (status per URL and the check date).
// Nothing here scores, ranks or combines sources: an entry is a name, a link, a licence and where it is used.
//
// Exit codes: 0 ok, 1 differences or problems, 2 usage error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OWN_ROOT = path.resolve(HERE, '..');
const REPO = path.resolve(OWN_ROOT, '..');
const DEFAULT_LICENCES = path.join(REPO, 'upgrade-2026-10', 'tracks', 'docs', 'data', 'source-licenses.json');

const argv = process.argv.slice(2);
const opt = { mode: 'check', root: OWN_ROOT, file: 'deeper.html', licences: DEFAULT_LICENCES, stats: false, json: null };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--check') opt.mode = 'check';
  else if (a === '--write') opt.mode = 'write';
  else if (a === '--stats') opt.stats = true;
  else if (a === '--root') opt.root = path.resolve(argv[++i] || '');
  else if (a === '--file') opt.file = argv[++i];
  else if (a === '--licences') opt.licences = path.resolve(argv[++i] || '');
  else if (a === '--json') opt.json = path.resolve(argv[++i] || '');
  else if (a === '-h' || a === '--help') { console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('\n').slice(1, 33).map((l) => l.replace(/^\/\/ ?/, '')).join('\n')); process.exit(0); }
  else { console.error(`usage error: unknown argument ${a}`); process.exit(2); }
}

const problems = [];
const dataUrl = (rel) => pathToFileURL(path.join(opt.root, rel)).href;
const mod = (rel) => import(dataUrl(rel));

// ------------------------------------------------------------------------------------------------ data
const { regions, values, criteria } = await mod('data/regions.js');
const { landStanding } = await mod('data/land-standing.js');
const { regionDepth } = await mod('data/region-depth.js');
const { legalPathway } = await mod('data/legal-pathway.js');
const { reciprocity } = await mod('data/reciprocity.js');
const { layerSources, panelLayerSources } = await mod('data/layer-sources.js');
const { sources, sourceIdFor } = await mod('data/sources.js');
const { bioregionSources } = await mod('data/bioregions.js');
const { context } = await mod('data/context.js');
const siteFacts = await mod('data/site-facts.js');
const { QUAL_FIELDS } = await mod('lib/qual-labels.js');

const LIC = JSON.parse(fs.readFileSync(opt.licences, 'utf8'));
const OFFICIAL_LABEL = LIC.officialLabel || 'official publication, reuse terms per the publisher';
const NOT_CONFIRMED = LIC.notConfirmedLabel || 'licence not confirmed';
const CHECKED_ON = LIC.retrievedOn;
const LINKS = LIC.linkCheck || {};

const regionById = new Map(regions.map((r, i) => [r.id, { ...r, idx: i }]));
const shortName = (id) => { const r = regionById.get(id); return r ? (r.short || r.name) : id; };
const fv = siteFacts.factValues();
const countWord = siteFacts.countWord;

// ------------------------------------------------------------------------------------------------ helpers
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const unesc = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
const cleanUrl = (u) => String(u).trim().replace(/[.,;:!?)\]]+$/, '');

function readText(file) { return fs.readFileSync(file, 'utf8'); }

// ------------------------------------------------------------------------------------------------ small derived facts
const V1_STEMS = ['land-cost', 'legal-ownership', 'hospital-proximity', 'demographic-trajectory', 'soil-contamination', 'water-source-control', 'climate-buffering'];
const v1Present = V1_STEMS.filter((s) => ['.json', '.geojson'].some((e) => fs.existsSync(path.join(opt.root, 'data', 'processed', s + e))));
const qualFile = path.join(opt.root, 'src', 'config', 'qual-filters.js');
const qualIds = fs.existsSync(qualFile) ? [...readText(qualFile).matchAll(/^\s*id:\s*'([a-z_]+)'/gm)].map((m) => m[1]) : [];
const qualLabels = qualIds.map((id) => (QUAL_FIELDS[id] ? QUAL_FIELDS[id].label : id));
const joinList = (a) => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const panel = panelLayerSources().filter((l) => l.role !== 'context');
const layersLocal = panel.filter((l) => l.kind === 'geojson');
const layersLive = panel.filter((l) => l.kind !== 'geojson');
const notThereCount = Object.values(reciprocity).filter((r) => r && r.notThere).length;

// ------------------------------------------------------------------------------------------------ bibliography collection
const GROUPS = [
  ['climate', 'Climate trajectory'],
  ['water_stress', 'Water stress'],
  ['soil_carbon', 'Soil organic carbon'],
  ['forest_change', 'Forest cover trajectory and habitat'],
  ['solar_pv', 'Solar PV potential and energy'],
  ['conflict', 'Conflict proximity and institutional context'],
  ['regen_network', 'Regenerative network density'],
  ['population', 'Population density and accessibility'],
  ['law', 'Law, tenure and land price'],
  ['territory', 'Land standing, territory and reciprocity'],
  ['bio', 'Bioregions and climate zones'],
  ['layers', 'Map layers'],
];
const GROUP_RANK = new Map(GROUPS.map(([k], i) => [k, i]));
const VIA_RANK = { criterion: 0, cell: 1, registry: 1, layer: 2, bio: 3, legacy: 4, v1: 5, legal: 6, standing: 7, depth: 8, recip: 9 };
const URL_FIX = LIC.urlFixes || {};
const entries = new Map();
const dropped = [];

function fixUrl(raw) {
  let u = cleanUrl(raw);
  if (!/^https?:\/\//i.test(u)) return null;
  if (Object.prototype.hasOwnProperty.call(URL_FIX, u)) {
    if (URL_FIX[u] === null) { dropped.push(u); return null; }
    u = cleanUrl(URL_FIX[u]);
  }
  return u;
}

function addHit({ url, name, nameRank = 5, group, via, regionId = null, use = null, sourceId = null, version = null }) {
  const u = url ? fixUrl(url) : null;
  if (!u) return;
  const key = u.replace(/\/$/, '');
  let e = entries.get(key);
  if (!e) { e = { key, url: u, names: [], hits: [], uses: new Map(), regions: new Set(), ids: new Set(), versions: new Set() }; entries.set(key, e); }
  if (name) e.names.push({ text: name, rank: nameRank });
  e.hits.push({ group, via });
  if (use) { if (!e.uses.has(use)) e.uses.set(use, new Set()); if (regionId) e.uses.get(use).add(regionId); }
  if (regionId) e.regions.add(regionId);
  if (sourceId) e.ids.add(sourceId);
  if (version) e.versions.add(version);
}

// For a free-text citation that may name several sources ("A; B") and carries one URL: the segment that shares the most
// words with the URL; when nothing overlaps and there are several segments, a neutral host label.
function splitOutsideParens(raw) {
  const out = []; let depth = 0, cur = '';
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (ch === '(') depth++; else if (ch === ')') depth = Math.max(0, depth - 1);
    if (ch === ';' && depth === 0 && raw[i + 1] === ' ') { out.push(cur.trim()); cur = ''; i++; continue; }
    cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out.filter(Boolean);
}
function nameFor(text, url) {
  const raw = String(text || '').replace(/\s+/g, ' ').trim();
  if (!raw) return null;
  const segs = splitOutsideParens(raw);
  if (segs.length <= 1) return segs[0] || raw;
  let host = '', pth = '';
  try { const x = new URL(url); host = x.hostname.replace(/^www\./, ''); pth = x.pathname; } catch { /* ignore */ }
  const toks = new Set((host + ' ' + pth).toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4));
  let best = null, bestScore = 0;
  for (const sg of segs) {
    const sc = sg.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length >= 4 && toks.has(t)).length;
    if (sc > bestScore) { best = sg; bestScore = sc; }
  }
  return best || segs[0];
}

const idFor = (text) => (text ? sourceIdFor(String(text).trim()) : null);

// 1. criteria and cells
for (const c of criteria) {
  addHit({ url: c.sourceUrl, name: c.source, nameRank: 2, group: c.id, via: 'criterion', use: `${c.name}: criterion source`, sourceId: c.sourceId });
  if (c.sourceId && sources[c.sourceId]) addHit({ url: sources[c.sourceId].url, name: sources[c.sourceId].name, nameRank: 0, group: c.id, via: 'registry', use: `${c.name}: criterion source`, sourceId: c.sourceId, version: sources[c.sourceId].version });
}
for (const [rid, cells] of Object.entries(values)) {
  for (const [cid, cell] of Object.entries(cells)) {
    const crit = criteria.find((c) => c.id === cid);
    const use = `${crit ? crit.name : cid}: values`;
    const sid = cell.sourceId || idFor(cell.source);
    addHit({ url: cell.sourceUrl, name: cell.source, nameRank: 3, group: cid, via: 'cell', regionId: rid, use, sourceId: sid });
    if (sid && sources[sid] && sources[sid].url) addHit({ url: sources[sid].url, name: sources[sid].name, nameRank: 0, group: cid, via: 'registry', regionId: rid, use, sourceId: sid, version: sources[sid].version });
    if (cell.trajectory && cell.trajectory.sourceUrl) addHit({ url: cell.trajectory.sourceUrl, name: cell.trajectory.source, nameRank: 3, group: cid, via: 'cell', regionId: rid, use: `${crit ? crit.name : cid}: trajectory field`, sourceId: idFor(cell.trajectory.source) || sid });
  }
}

// 2. land standing, region depth, reciprocity claims
for (const [rid, e] of Object.entries(landStanding)) {
  const use = 'Land standing';
  if (e.sourceUrl) addHit({ url: e.sourceUrl, name: nameFor(e.source, e.sourceUrl), nameRank: 4, group: 'territory', via: 'standing', regionId: rid, use, sourceId: idFor(e.source) });
  if (e.territorySourceUrl) addHit({ url: e.territorySourceUrl, name: nameFor(e.territorySource, e.territorySourceUrl), nameRank: 4, group: 'territory', via: 'standing', regionId: rid, use: 'Land standing (territory)' });
  for (const s of e.sources || []) addHit({ url: s.url, name: s.label, nameRank: 3, group: 'territory', via: 'standing', regionId: rid, use, sourceId: idFor(s.label) });
}
for (const [rid, e] of Object.entries(regionDepth)) {
  if (e.sourceUrl) addHit({ url: e.sourceUrl, name: nameFor(e.source, e.sourceUrl), nameRank: 4, group: 'territory', via: 'depth', regionId: rid, use: 'What living here asks', sourceId: idFor(e.source) });
}
for (const [rid, e] of Object.entries(reciprocity)) {
  for (const c of e.claims || []) addHit({ url: c.url, name: c.label, nameRank: 3, group: 'territory', via: 'recip', regionId: rid, use: 'Land standing (territory and tenure claims)' });
}

// 3. legal pathway (generic walk: any object with a source text and a sourceUrl)
function walkLegal(node, rid) {
  if (Array.isArray(node)) { node.forEach((v) => walkLegal(v, rid)); return; }
  if (!node || typeof node !== 'object') return;
  if (typeof node.sourceUrl === 'string') addHit({ url: node.sourceUrl, name: nameFor(node.source, node.sourceUrl), nameRank: 4, group: 'law', via: 'legal', regionId: rid, use: 'Legal pathway', version: null });
  for (const v of Object.values(node)) if (v && typeof v === 'object') walkLegal(v, rid);
}
for (const [rid, e] of Object.entries(legalPathway)) walkLegal(e, rid);

// 4. per-jurisdiction layers (processed JSON, one record per region)
const V1_GROUP = { 'land-cost': ['law', 'Land cost layer'], 'legal-ownership': ['law', 'Legal ownership layer'], 'demographic-trajectory': ['population', 'Demographic trajectory layer'], 'soil-contamination': ['soil_carbon', 'Soil contamination layer'], 'water-source-control': ['water_stress', 'Water source control layer'], 'climate-buffering': ['climate', 'Climate buffering layer'] };
for (const [stem, [group, use]] of Object.entries(V1_GROUP)) {
  const p = path.join(opt.root, 'data', 'processed', stem + '.json');
  if (!fs.existsSync(p)) continue;
  for (const r of JSON.parse(readText(p))) {
    if (r && r.source_url) addHit({ url: r.source_url, name: nameFor(r.source, r.source_url), nameRank: 4, group, via: 'v1', regionId: r.region_id, use, sourceId: idFor(r.source) });
  }
}

// 5. map layers (the dataset page of each layer's registry entry, never a tile endpoint), bioregion datasets, context sources
for (const l of panel) {
  const s = l.sourceId ? sources[l.sourceId] : null;
  if (!s || !s.url) continue;
  addHit({ url: s.url, name: s.name, nameRank: 0, group: 'layers', via: 'layer', use: `Map layer ${l.label}`, sourceId: l.sourceId, version: l.vintage || s.version });
}
for (const [k, b] of Object.entries(bioregionSources)) {
  addHit({ url: b.url, name: b.name, nameRank: 0, group: 'bio', via: 'bio', use: k === 'hydrobasins' ? 'Bioregion analysis (drainage, not shipped as polygons)' : k === 'ecoregions' ? 'Ecoregion outlines and the "where it sits" line' : 'River lines', sourceId: k === 'ecoregions' ? 'resolve-ecoregions-2017' : k === 'rivers' ? 'natural-earth' : 'hydrobasins', version: b.vintage || null });
}
for (const [rid, c] of Object.entries(context)) {
  for (const part of Object.values(c)) {
    const s = part && part.source;
    if (s && s.url) addHit({ url: s.url, name: s.name, nameRank: 1, group: s.id === 'aqueduct-40' ? 'water_stress' : 'bio', via: s.id === 'aqueduct-40' ? 'cell' : 'bio', regionId: rid, use: s.id === 'aqueduct-40' ? 'Water context (basin detail)' : 'Climate zones (Köppen-Geiger)', sourceId: s.id, version: s.vintage || null });
  }
}

// 6. the earlier hand-written bibliography, where it still backs a case-study sentence or a research-note citation
const LEGACY_REGIONS = /(Alentejo|Connemara|Transylvania|Galicia|Asturias|Pembrokeshire|C[ée]vennes|South Tirol|Saxony-Anhalt|Estonia)/;
for (const g of LIC.legacyBibliography || []) {
  addHit({ url: g.url, name: unesc(g.name).replace(/<[^>]+>/g, ''), nameRank: 1, group: g.group, via: 'legacy', use: `Case studies and research notes: ${unesc(g.usedFor)}`, sourceId: idFor(unesc(g.name)) });
  void LEGACY_REGIONS;
}

// ------------------------------------------------------------------------------------------------ resolve entries
const OFFICIAL_HOST = /(^|\.)(gov|gov\.[a-z]{2,3}|gob\.[a-z]{2}|state\.[a-z]{2}\.us|provinz\.bz\.it|novascotia\.ca|taoscounty\.org|defmin\.fi|ym\.fi|stat\.fi|luke\.fi|maanmittauslaitos\.fi|joensuu\.fi|kuhmo\.fi|tohmajarvi\.fi|gouv\.fr|gc\.ca|europa\.eu|admin\.ch|parliament\.uk|legislation\.gov\.uk|gov\.uk|gov\.ie|gov\.wales|gov\.scot|gov\.bc\.ca|gov\.ns\.ca|gov\.on\.ca|gov\.mb\.ca|gov\.sk\.ca|gov\.ab\.ca|gov\.nl\.ca|gov\.nb\.ca|gouv\.qc\.ca|canada\.ca|irishstatutebook\.ie|oireachtas\.ie|boe\.es|diariodarepublica\.pt|dre\.pt|just\.ro|riigiteataja\.ee|finlex\.fi|normattiva\.it|gesetze-im-internet\.de|bundesnetzagentur\.de|bgr\.bund\.de|umweltbundesamt\.de|dwd\.de|ine\.es|ine\.pt|insee\.fr|cso\.ie|ons\.gov\.uk|stat\.ee|insse\.ro|inegi\.org\.mx|statcan\.gc\.ca|census\.gov|usda\.gov|noaa\.gov|epa\.ie|gsi\.ie|met\.ie|npws\.ie|tailte\.ie|udaras\.ie|seai\.ie|apambiente\.pt|ipma\.pt|dgeg\.gov\.pt|gpp\.pt|aemet\.es|brgm\.fr|ademe\.fr|meteofrance\.com|keskkonnaagentuur\.ee|maaruum\.ee|ilmateenistus\.ee|ancom\.ro|anre\.ro|ccr\.ro|meteoromania\.ro|rowater\.ro|icpdr\.org|unesco\.org|bgs\.ac\.uk|naturalresources\.wales|ofgem\.gov\.uk|sistemaelectrico-ree\.es|astat\.provincia\.bz\.it|provincia\.bz\.it|diritto\.provincia\.bz\.it|agricoltura\.provincia\.bz\.it|ambiente\.provincia\.bz\.it|wetter\.provinz\.bz\.it|astat\.provinz\.bz\.it|istat\.it|ige\.gal|sadei\.es|chcantabrico\.es|corkcoco\.ie|galway\.ie|cne\.pt|assemblee-nationale\.fr|wahlen\.sachsen-anhalt\.de|statistik\.sachsen-anhalt\.de|cevennes-parcnational\.fr|safer\.fr|pordata\.pt)$/i;
const NOT_OFFICIAL = /(^|\.)(ncbi\.nlm\.nih\.gov|nlm\.nih\.gov|nih\.gov)$/i;

function hostOf(u) { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } }

function licenceOf(e) {
  // a registry id carried by a hit (explicit or by alias) beats a host guess; the most specific confirmed one wins
  const ids = [...e.ids];
  const rank = (id) => { const l = LIC.licences[id]; return !l ? 3 : l.status === 'confirmed' ? 0 : l.status === 'official' ? 1 : 2; };
  ids.sort((a, b) => rank(a) - rank(b));
  for (const id of ids) {
    const l = LIC.licences[id];
    if (!l) continue;
    if (l.status === 'confirmed') return { label: l.licence, url: l.licenceUrl, kind: 'confirmed', id };
    if (l.status === 'official') return { label: OFFICIAL_LABEL, url: null, kind: 'official', id };
  }
  if (OFFICIAL_HOST.test(hostOf(e.url)) && !NOT_OFFICIAL.test(hostOf(e.url))) return { label: OFFICIAL_LABEL, url: null, kind: 'official', id: null };
  return { label: NOT_CONFIRMED, url: null, kind: 'not-confirmed', id: ids[0] || null };
}

const list = [...entries.values()];
for (const e of list) {
  // name: lowest rank wins; ties -> the longer text
  e.names.sort((a, b) => a.rank - b.rank || b.text.length - a.text.length);
  e.name = (e.names[0] && e.names[0].text) || hostOf(e.url);
  // group: highest-priority hit
  e.hits.sort((a, b) => VIA_RANK[a.via] - VIA_RANK[b.via] || GROUP_RANK.get(a.group) - GROUP_RANK.get(b.group));
  e.group = GROUP_RANK.has(e.hits[0].group) ? e.hits[0].group : 'law';
  e.licence = licenceOf(e);
  e.status = LINKS.byUrl ? LINKS.byUrl[e.url] : undefined;
  e.minRegion = e.regions.size ? Math.min(...[...e.regions].map((r) => (regionById.get(r) || { idx: 999 }).idx)) : -1;
}

// ------------------------------------------------------------------------------------------------ renderers
const regionsText = (set) => {
  if (!set.size) return '';
  if (set.size === regions.length) return `all ${fv.regionsWord} regions`;
  return [...set].sort((a, b) => regionById.get(a).idx - regionById.get(b).idx).map(shortName).join(', ');
};
function usedFor(e) {
  const parts = [];
  for (const [use, rs] of e.uses) {
    const t = regionsText(rs);
    parts.push(t ? `${use} (${t})` : use);
  }
  return parts.join('; ');
}
const shortLink = (u) => {
  try { const x = new URL(u); const p = x.pathname.replace(/\/$/, ''); const s = x.hostname.replace(/^www\./, '') + (p.length > 1 && p.length <= 44 ? p : ''); return s; } catch { return u; }
};
const statusNote = (e) => {
  const s = e.status;
  if (s === 'browser-only') return ' · opened only in a browser';
  if (s === 'other-route') return ' · opened through a reader proxy or a registry record';
  if (s === 'archive') return ' · archived copy';
  if (s === 'redirected') return ' · the link redirects';
  return '';
};

function renderCriteria() {
  const parts = [];
  criteria.forEach((c, i) => {
    const lic = LIC.licences[c.sourceId];
    const licText = lic && lic.status === 'confirmed' ? lic.licence : lic ? NOT_CONFIRMED : c.license || NOT_CONFIRMED;
    const unit = c.rangeLabel || c.unit;
    const trajectory = c.trajectoryRule ? 'Trajectory: ' + (/^None: /.test(c.trajectoryRule) ? 'none. ' + c.trajectoryRule.replace(/^None: (.)/, (m, ch) => ch.toUpperCase()) : c.trajectoryRule) : '';
    const line2 = [`Source: ${esc(c.source)}`, `licence: ${esc(licText)}`, `native unit: ${esc(c.nativeUnit)}`].join(' · ');
    parts.push(
      `          <div class="method-point" data-doc="criterion" data-criterion="${esc(c.id)}">\n` +
      `            <div class="num">${ROMAN[i] || i + 1}</div>\n` +
      `            <h4>${esc(c.name)}</h4>\n` +
      `            <p data-doc="criterion-metric">${esc(c.metric)}. Reported in <strong>${esc(unit)}</strong>${c.window ? `, window ${esc(c.window.label)}` : ''}.</p>\n` +
      `            <p data-doc="criterion-source">${line2}.</p>\n` +
      `            <p data-doc="criterion-trajectory">${esc(c.scenarioLine || '')} ${esc(trajectory)}</p>\n` +
      `            <p data-doc="criterion-number">Starter-set metric number ${esc(c.askjaNumber)} (Askja's numbering, not an order of importance).</p>\n` +
      `          </div>`);
  });
  return `        <div class="method-list" data-doc="criteria-grid">\n${parts.join('\n')}\n        </div>`;
}

const LAYER_GROUP_LABEL = { climate: 'Climate &amp; water', land: 'Land &amp; soil', energy: 'Energy', hazards: 'Hazards', human: 'People &amp; access', imagery: 'Terrain &amp; imagery' };
function renderLayers() {
  const groups = new Map();
  for (const l of panel) { if (!groups.has(l.group)) groups.set(l.group, []); groups.get(l.group).push(l); }
  const items = [];
  for (const [g, ls] of groups) {
    if (!LAYER_GROUP_LABEL[g]) throw new Error(`unknown layer group "${g}": add it to LAYER_GROUP_LABEL`);
    const names = ls.map((l) => `${esc(l.label)} \u2014 ${l.kind === 'geojson' ? 'processed file' : 'live service'}`).join('; ');
    items.push(`          <li data-doc="layer-theme"><strong>${LAYER_GROUP_LABEL[g]}</strong>: ${names}.</li>`);
  }
  return `        <ul data-doc="layer-list">\n${items.join('\n')}\n        </ul>`;
}

const notConfirmedCount = list.filter((e) => e.licence.kind === 'not-confirmed').length;

function renderSources() {
  const out = [];
  out.push('      <div class="sources-grid" data-doc="source-list">');
  for (const [gid, gname] of GROUPS) {
    const g = list.filter((e) => e.group === gid);
    if (!g.length) continue;
    const rankOf = (e) => (e.hits.some((h) => ['criterion', 'registry', 'layer', 'bio'].includes(h.via)) ? 0 : e.regions.size ? 1 : 2);
    g.sort((a, b) => rankOf(a) - rankOf(b) || (rankOf(a) === 1 ? a.minRegion - b.minRegion : 0) || a.name.localeCompare(b.name));
    out.push('        <div class="source-group" data-doc="source-group" data-group="' + esc(gid) + '">');
    out.push(`          <h3>${esc(gname)}</h3>`);
    out.push('          <ul>');
    for (const e of g) {
      const lic = e.licence;
      const licHtml = lic.url ? `<a href="${esc(lic.url)}">${esc(lic.label)}</a>` : esc(lic.label);
      const ver = [...e.versions].filter(Boolean)[0];
      const meta = [`Licence: ${licHtml}`];
      if (ver) meta.push(`version: ${esc(ver)}`);
      meta.push(`link opened ${esc(CHECKED_ON)}${statusNote(e)}`);
      out.push('            <li data-doc="source">' +
        `<span class="src-name">${esc(e.name)}</span> <a href="${esc(e.url)}">${esc(shortLink(e.url))}</a> ` +
        `<span class="used-for">Used for: ${esc(usedFor(e))}</span> ` +
        `<span class="used-for" data-doc="licence">${meta.join(' · ')}</span></li>`);
    }
    out.push('          </ul>');
    out.push('        </div>');
  }
  out.push('      </div>');
  return out.join('\n');
}

// ------------------------------------------------------------------------------------------------ the generator's own facts
const statusCounts = {};
for (const e of list) statusCounts[e.status || 'unrecorded'] = (statusCounts[e.status || 'unrecorded'] || 0) + 1;
const sc = statusCounts;
const linkParts = [[sc.ok, 'directly'], [sc.redirected, 'after a redirect'], [sc['browser-only'], 'only in a browser'], [sc['other-route'], 'through a reader proxy or a registry record'], [sc.archive, 'as an archived copy']].filter(([n]) => n);
const linkLine = LINKS.checkedOn
  ? `${list.length} source links were opened on ${LINKS.checkedOn}: ${linkParts.map(([n, t]) => `${n} ${t}`).join(', ')}. None was dead or blocked.`
  : 'No link check has been recorded.';
const lcFirst = (t) => t.charAt(0).toLowerCase() + t.slice(1);
const capFirst = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const hasDirection = (cid) => Object.values(values).some((cells) => cells[cid] && cells[cid].trajectory && cells[cid].trajectory.direction);
const withTrajectory = criteria.filter((c) => hasDirection(c.id));
const stateOnly = criteria.filter((c) => !hasDirection(c.id));
const radiusMatch = Object.values((await mod('data/bioregions.js')).bioregions).map((b) => /within (\d+) km/.exec(b.method || '')).filter(Boolean).map((m) => m[1]);
if (new Set(radiusMatch).size !== 1) problems.push(`bioregion methods do not agree on one disc radius: ${[...new Set(radiusMatch)].join(', ') || 'none found'}`);
const reviewedMax = Object.values(reciprocity).map((r) => r && r.reviewed).filter(Boolean).sort().pop() || CHECKED_ON;
const gFacts = {
  trajectoryCount: countWord(withTrajectory.length),
  trajectoryCountCap: capFirst(countWord(withTrajectory.length)),
  trajectoryNames: joinList(withTrajectory.map((c) => lcFirst(c.name))),
  stateOnlyCount: countWord(stateOnly.length),
  stateOnlyCountCap: capFirst(countWord(stateOnly.length)),
  stateOnlyNames: joinList(stateOnly.map((c) => lcFirst(c.name))),
  layersLiveCap: capFirst(countWord(layersLive.length)),
  layersLocalCap: capFirst(countWord(layersLocal.length)),
  notThereCount: countWord(notThereCount),
  bioDiscKm: radiusMatch[0] || '',
  reviewedLong: siteFacts.longDate(reviewedMax),
  qualFilters: countWord(qualIds.length),
  qualFilterLabels: joinList(qualLabels),
  v1Layers: countWord(v1Present.length),
  layersLive: countWord(layersLive.length),
  layersLocal: countWord(layersLocal.length),
  sourcesCount: String(list.length),
  licencesNotConfirmed: String(notConfirmedCount),
  sourcesChecked: CHECKED_ON,
  linkCheckLine: linkLine,
};

// ------------------------------------------------------------------------------------------------ apply to the page
function replaceRegion(html, name, body, problems) {
  const start = `<!-- GEN:${name}:start -->`;
  const end = `<!-- GEN:${name}:end -->`;
  const a = html.indexOf(start), b = html.indexOf(end);
  if (a < 0 || b < 0 || b < a) { problems.push(`marker pair GEN:${name} missing or out of order`); return html; }
  if (html.indexOf(start, a + 1) >= 0) { problems.push(`marker GEN:${name}:start occurs more than once`); return html; }
  return html.slice(0, a + start.length) + '\n' + body + '\n      ' + html.slice(b);
}

function replaceFacts(html, kind, values, problems) {
  const re = new RegExp(`<!--${kind}:([A-Za-z]+)-->([\\s\\S]*?)<!--/${kind}-->`, 'g');
  return html.replace(re, (m, key) => {
    if (!(key in values)) { problems.push(`unknown ${kind} fact "${key}"`); return m; }
    return `<!--${kind}:${key}-->${values[key]}<!--/${kind}-->`;
  });
}

function generate(html, problems) {
  let out = html;
  out = replaceRegion(out, 'criteria', renderCriteria(), problems);
  out = replaceRegion(out, 'layers', renderLayers(), problems);
  out = replaceRegion(out, 'sources', renderSources(), problems);
  out = replaceFacts(out, 'f', fv, problems);
  out = replaceFacts(out, 'g', gFacts, problems);
  return out;
}

// ------------------------------------------------------------------------------------------------ run
if (opt.stats) {
  const byGroup = {};
  for (const e of list) byGroup[e.group] = (byGroup[e.group] || 0) + 1;
  console.log(JSON.stringify({ entries: list.length, byGroup, notConfirmed: notConfirmedCount, official: list.filter((e) => e.licence.kind === 'official').length, confirmed: list.filter((e) => e.licence.kind === 'confirmed').length, droppedUrls: [...new Set(dropped)].length, v1Layers: v1Present.length, qualFilters: qualIds, layersLive: layersLive.length, layersLocal: layersLocal.length, notThereRegions: notThereCount }, null, 1));
  process.exit(0);
}
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(list.map((e) => ({ url: e.url, name: e.name, group: e.group, uses: [...e.uses.keys()], regions: [...e.regions], licence: e.licence.label, kind: e.licence.kind, status: e.status || null })), null, 1) + '\n');

const target = path.join(opt.root, opt.file);
if (!fs.existsSync(target)) { console.error(`usage error: ${target} not found`); process.exit(2); }
const before = readText(target);
const after = generate(before, problems);

// every generated URL has a recorded, live status
if (LINKS.byUrl) {
  const missing = list.filter((e) => !e.status);
  if (missing.length) problems.push(`${missing.length} generated URL(s) have no recorded link status, for example ${missing.slice(0, 3).map((e) => e.url).join(' ')}`);
  const bad = list.filter((e) => e.status === 'dead' || e.status === 'blocked');
  if (bad.length) problems.push(`${bad.length} generated URL(s) are dead or blocked: ${bad.slice(0, 3).map((e) => e.url).join(' ')}`);
} else problems.push('no linkCheck.byUrl in the licences table: run the link check and record it');

if (opt.mode === 'write') {
  if (after !== before) fs.writeFileSync(target, after);
  console.log(`gen_deeper_sections: ${after !== before ? 'wrote' : 'unchanged'} ${path.relative(REPO, target)} (${list.length} sources, ${notConfirmedCount} licence not confirmed)`);
  for (const p of problems) console.log(`problem: ${p}`);
  process.exit(problems.length ? 1 : 0);
}
let ok = true;
if (after !== before) {
  ok = false;
  const a = before.split('\n'), b = after.split('\n');
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  console.log(`gen_deeper_sections: ${opt.file} differs from the generated output (first difference at line ${i + 1}); run with --write`);
  console.log(`  file:      ${(a[i] || '').slice(0, 160)}`);
  console.log(`  generated: ${(b[i] || '').slice(0, 160)}`);
}
for (const p of problems) { ok = false; console.log(`problem: ${p}`); }
if (ok) console.log(`gen_deeper_sections: ok (${list.length} sources, ${criteria.length} criteria, ${panel.length} layers; ${notConfirmedCount} licence not confirmed)`);
process.exit(ok ? 0 : 1);
