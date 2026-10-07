#!/usr/bin/env node
// Build-time generator for the per-region pages: region/<id>.html (one static, crawlable, no-JS page per region), sitemap.xml and
// llms.txt. MC-REGION-PAGE, 2026-10: the page is an "accent world" (design 8.18) built from the shared tokens and component
// stylesheets (tokens, fonts, theme-gate, base, rail, colophon, reciprocity, ledger, way, region-page, v1-grid) and from the same
// renderers the drawer uses (lib/bio.js, lib/evidence-render.js, lib/qual-labels.js, lib/salutation.js, lib/linework.js), so the
// page and the drawer can never drift.
//
//   node scripts/gen_region_pages.mjs [--out-dir DIR | --check] [--data-root DIR] [--allow-incomplete] [--help]
//
//   (no flag)             write region/*.html, sitemap.xml and llms.txt in place (the integration step only; every other caller uses --out-dir)
//   --out-dir DIR         write the same files under DIR (same relative layout), nothing in the working tree
//   --check               generate in memory, diff against the files on disk, write nothing; exit 1 (with a unified diff head)
//                         on any difference. Meaningful only after the integration step has regenerated the tree.
//   --data-root DIR       read data/*.js, data/footprints.json and data/processed/* from DIR instead of this prototype folder
//                         (DIR has the same layout as prototype/; the tests use it to feed a deliberately incomplete fixture)
//   --allow-incomplete    DEVELOPMENT ONLY: report completeness gaps as warnings and render what exists
//   -h, --help            this text
//
// COMPLETENESS GATE (hard, no flag needed): a region ships only when its record is whole. The generator exits 1, naming the
// region and the missing piece for every gap, when a region lacks: a value (or a null with a nullReason) for every criterion, a
// Land standing entry, a region-depth entry, a bioregion entry, a reciprocity entry whose status is 'verified', a legal pathway,
// any of the seven per-jurisdiction records, a climate and water context entry, or a footprint.
//
// data/v1-lookup.js is NOT written here any more: scripts/gen_v1_lookup.mjs owns it (the client lookup is a slim file).
//
// SEARCH AND AI-ENGINE SURFACE (MC-SEO, 2026-10): every page carries ONE JSON-LD block, an @graph of a Place (name, description, geo
// from the region marker, address country, isPartOf the WebSite, the BIO place and watershed properties), a BreadcrumbList and a
// Dataset ("a reading of <region>": one PropertyValue per criterion that has a number, with unit, source and window label, the
// sources it is based on, the working group as creator with Askja named as originator, free to access). It carries no licence
// claim, no rating of any kind and no email. The meta description (160 characters at most, whole clauses only) leads with the
// Salutation. sitemap.xml lists home, deeper, every region page and arrive / host / terms-of-arrival when they exist, with lastmod
// from site-facts buildDate. llms.txt is written from the same data: the canon descriptor and stance, the key pages, every region
// with its URL and one line, how the data is dated and licensed per source, what this is not, how to cite. Canonical origin:
// data/site-facts.js site.origin. Region pages link to arrive (?region=<id>), host, deeper.html#methodology and the other regions.
//
// The page carries no JS except the Vercel insights tag. Nothing here scores, ranks, weights or sums anything: the criteria are
// listed in the data's own order, values keep their native units, source, vintage and licence, Land standing is qualitative, and
// the all-regions list is in the slate's declared order (stated on the page), never sorted.

import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

import { esc, safeUrl, ledgerRowHtml, legalPathwayHtml, contextHtml, fmtNumber } from '../lib/evidence-render.js';
import { qualLabel } from '../lib/qual-labels.js';
import { salutation, salutationLabel } from '../lib/salutation.js';
import { landStandingV2Html, placeStripHtml, waterLine } from '../lib/bio.js';
import { REFUSAL, catchment, colophonArt, svg as lineworkSvg } from '../lib/linework.js';
import { loadV1Layers, V1_LAYERS, bandMeta } from './gen_v1_lookup.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const HELP = `gen_region_pages.mjs: generate region/<id>.html and sitemap.xml from the data files.

Usage: node scripts/gen_region_pages.mjs [--out-dir DIR | --check] [--data-root DIR] [--allow-incomplete] [--help]

  (no flag)             write region/*.html, sitemap.xml and llms.txt in place (integration step only)
  --out-dir DIR         write the same files under DIR (same relative layout); nothing in the working tree changes
  --check               generate in memory, compare with the files on disk, write nothing; exit 1 on any difference
  --data-root DIR       read data/*.js, data/footprints.json and data/processed/* from DIR (default: this prototype folder)
  --allow-incomplete    development only: report completeness gaps as warnings and render what exists
  -h, --help            this text

Completeness gate: the generator exits 1, naming the region and the missing piece, when a region lacks complete values (or a null
with a nullReason), a Land standing entry, a region-depth entry, a bioregion entry, a verified reciprocity entry, a legal
pathway, any of the seven per-jurisdiction records, a climate and water context entry or a footprint.
data/v1-lookup.js is written by scripts/gen_v1_lookup.mjs, not by this script.
sitemap.xml lists arrive.html, host.html and terms-of-arrival.html when they exist (under DIR for --out-dir, else in this folder).
`;

// ---------------------------------------------------------------------------------------------------------------------------
// CLI
function parseArgs(argv) {
  const opts = { check: false, outDir: null, dataRoot: ROOT, allowIncomplete: false, help: false };
  const needValue = (flag, i) => {
    if (i + 1 >= argv.length || argv[i + 1].startsWith('--')) {
      console.error(`gen_region_pages: ${flag} needs a directory argument`);
      process.exit(2);
    }
    return argv[i + 1];
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--check') opts.check = true;
    else if (a === '--allow-incomplete') opts.allowIncomplete = true;
    else if (a === '--help' || a === '-h') opts.help = true;
    else if (a === '--out-dir') opts.outDir = resolve(needValue(a, i++));
    else if (a.startsWith('--out-dir=')) opts.outDir = resolve(a.slice('--out-dir='.length));
    else if (a === '--data-root') opts.dataRoot = resolve(needValue(a, i++));
    else if (a.startsWith('--data-root=')) opts.dataRoot = resolve(a.slice('--data-root='.length));
    else {
      console.error(`gen_region_pages: unknown argument ${a}\nusage: node scripts/gen_region_pages.mjs [--out-dir DIR | --check] [--data-root DIR] [--allow-incomplete] [--help]`);
      process.exit(2);
    }
  }
  if (opts.check && opts.outDir) {
    console.error('gen_region_pages: --check writes nothing; do not combine it with --out-dir');
    process.exit(2);
  }
  return opts;
}
const opts = parseArgs(process.argv.slice(2));
if (opts.help) { process.stdout.write(HELP); process.exit(0); }

// ---------------------------------------------------------------------------------------------------------------------------
// Data (from --data-root, default this prototype folder)
const DATA_ROOT = opts.dataRoot;
const importData = (rel) => import(pathToFileURL(join(DATA_ROOT, 'data', rel)).href);
function readJsonIf(rel, fallback) {
  const p = join(DATA_ROOT, rel);
  if (!existsSync(p)) return fallback;
  try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return fallback; }
}

const [regionsMod, depthMod, standingMod, bioMod, recipMod, legalMod, contextMod, sourcesMod, factsMod] = await Promise.all([
  importData('regions.js'), importData('region-depth.js'), importData('land-standing.js'), importData('bioregions.js'),
  importData('reciprocity.js'), importData('legal-pathway.js'), importData('context.js'), importData('sources.js'),
  importData('site-facts.js'),
]);
const { regions, values, criteria } = regionsMod;
const { regionDepth } = depthMod;
const { landStanding } = standingMod;
const { bioregions } = bioMod;
const { reciprocity, kindLabels } = recipMod;
const { legalPathway } = legalMod;
const { context } = contextMod;
const { sources } = sourcesMod;
const { facts, canon, countWord, CapWord, buildId, buildDate, dataRevision, site } = factsMod;
const footprints = readJsonIf('data/footprints.json', {});
const legend = (readJsonIf('data/processed/koppen-legend.json', null) || {}).classes || [];
const v1 = loadV1Layers(DATA_ROOT);
let affordMeta = null;
try { affordMeta = bandMeta(DATA_ROOT); } catch { affordMeta = null; }   // no band edges: the labels say the bands are relative
const QMETA = affordMeta ? { affordability_band: affordMeta } : {};

// The same data, handed to the shared renderers so a --data-root run never mixes two data sets.
const BIO_DATA = { bioregions, reciprocity, landStanding, kindLabels };
const SAL_DATA = { reciprocity, landStanding };

const SITE = site.origin;

// ---------------------------------------------------------------------------------------------------------------------------
// The completeness gate
const isStr = (s) => typeof s === 'string' && s.trim() !== '';
const isObj = (o) => !!o && typeof o === 'object' && !Array.isArray(o);

function completenessGaps() {
  const gaps = [];
  const gap = (id, piece) => gaps.push({ id, piece });
  for (const r of regions) {
    const id = r.id;
    for (const c of criteria) {
      const cell = values[id] && values[id][c.id];
      if (!isObj(cell)) { gap(id, `a value for criterion ${c.id} (no cell)`); continue; }
      if (typeof cell.value === 'number' && Number.isFinite(cell.value)) {
        if (!isStr(cell.source)) gap(id, `a source for criterion ${c.id}`);
        else if (!isStr(cell.vintage)) gap(id, `a vintage for criterion ${c.id}`);
      } else if (cell.value === null || cell.value === undefined) {
        if (!isStr(cell.nullReason)) gap(id, `a nullReason for criterion ${c.id} (the value is null)`);
      } else gap(id, `a numeric value or a null with a nullReason for criterion ${c.id}`);
    }
    if (!isObj(landStanding[id]) || !isStr(landStanding[id].territory)) gap(id, 'a Land standing entry (landStanding)');
    const depth = regionDepth[id];
    if (!isObj(depth) || (!isStr(depth.asks) && !isStr(depth.caseStudy))) gap(id, 'a region-depth entry with asks (regionDepth)');
    const bio = bioregions[id];
    if (!isObj(bio) || !isStr(bio.place) || !Array.isArray(bio.ecoregions) || !bio.ecoregions.length) gap(id, 'a bioregion entry with a place and an ecoregion (bioregions)');
    const rc = reciprocity[id];
    if (!isObj(rc)) gap(id, 'a reciprocity entry (reciprocity)');
    else if (rc.status !== 'verified') gap(id, `a verified reciprocity entry (status is ${JSON.stringify(rc.status === undefined ? null : rc.status)})`);
    if (!isObj(legalPathway[id])) gap(id, 'a legal pathway (legalPathway)');
    for (const layer of Object.keys(V1_LAYERS)) if (!isObj(v1[layer] && v1[layer][id])) gap(id, `the per-jurisdiction record ${layer} (${V1_LAYERS[layer]})`);
    if (!isObj(context[id])) gap(id, 'a climate and water context entry (context)');
    if (!isObj(footprints[id])) gap(id, 'a footprint (data/footprints.json)');
  }
  return gaps;
}
{
  const gaps = completenessGaps();
  if (gaps.length) {
    const ids = [...new Set(gaps.map((g) => g.id))];
    const label = opts.allowIncomplete ? 'WARNING (--allow-incomplete)' : 'INCOMPLETE';
    for (const g of gaps) console.error(`gen_region_pages: ${label} ${g.id}: missing ${g.piece}`);
    if (opts.allowIncomplete) console.error(`gen_region_pages: ${gaps.length} gap(s) in ${ids.length} region(s); rendering what exists (development only)`);
    else {
      console.error(`gen_region_pages: ${gaps.length} gap(s) in ${ids.length} region(s) (${ids.join(', ')}); a region ships only when its record is complete. Nothing was written.`);
      process.exit(1);
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------------
// Small helpers
const stopDot = (s) => String(s).trim().replace(/[.\s]+$/, '');
// A new-tab link: only http(s) hrefs, with the sr-only notice every external link on the site carries.
function extLink(text, url, cls) {
  const u = safeUrl(url);
  if (!u) return esc(text);
  return `<a${cls ? ` class="${cls}"` : ''} href="${esc(u)}" target="_blank" rel="noopener">${esc(text)}<span class="sr-only"> (opens in a new tab)</span></a>`;
}
const ARROW = '<svg class="arrow" aria-hidden="true" focusable="false" viewBox="0 0 16 10" width="14" height="9"><path d="M1 5h12M9 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';
const retag = (html, map) => html.replace(/<(\/?)h([1-6])\b/g, (m, slash, n) => (map[n] ? `<${slash}h${map[n]}` : m));

// First sentence of a text (for the lead of a page whose blurb leads with price).
function firstSentence(text) {
  const t = String(text || '').trim();
  const m = /^(.+?[.!?])(?:\s+(?=[A-Z"“‘])|$)/s.exec(t);
  return (m ? m[1] : t).trim();
}

// A blurb that leads with price is not allowed to open a page: the framework is not a listing of cheap land. Such a region's page
// leads with the Salutation, the place and the asks sentence instead (plan review issue C11). Decided from the data, never from an id.
const PRICE_WORDS = /affordab|cheap|price|bargain/i;

function leadParts(r) {
  const sal = salutation(r.id, { data: SAL_DATA });
  const b = bioregions[r.id] || {};
  const depth = regionDepth[r.id] || {};
  return { sal, place: isStr(b.place) ? stopDot(b.place) : '', asks1: isStr(depth.asks) ? firstSentence(depth.asks) : '' };
}
function leadByPlace(r) {
  const { sal, place, asks1 } = leadParts(r);
  const parts = [sal.text ? `Whose land: ${stopDot(sal.text)}.` : '', place ? `${place}.` : '', asks1]
    .filter((p) => isStr(p) && !PRICE_WORDS.test(p));
  return parts.join(' ');
}
const leadsWithPrice = (r) => PRICE_WORDS.test(r.blurb || '');
function lede(r) { return leadsWithPrice(r) ? leadByPlace(r) : String(r.blurb || ''); }

// Meta description (BIO-5 hook H4, MC-SEO 2026-10). Built from the Salutation, the place, the ecoregion sentence and the blurb (or,
// for a region whose blurb leads with price, the first sentence of what living there asks) as WHOLE clauses, never cut: the ladder
// below takes the first rung that fits the 160-character cap. The ecoregion sentence outranks the place label and the blurb (BIO-5),
// so a long place label is dropped before the ecoregion name is. It leads with "Whose land:" (reciprocity first) and carries no
// price word and no count. Only when the first clause alone is over the cap does it cut, at a word boundary, ending in a full stop.
function metaDescription(r, { cap = 160 } = {}) {
  const { sal, place, asks1 } = leadParts(r);
  const b = bioregions[r.id] || {};
  const eco = b.ecoregions && b.ecoregions[0] && b.ecoregions[0].name;
  const first = sal.short ? `Whose land: ${stopDot(sal.short)}.` : `${r.name}, ${r.country}.`;
  const ok = (x) => (isStr(x) && !PRICE_WORDS.test(x) ? x : '');
  const P = ok(place ? `${place}.` : '');
  const E = ok(isStr(eco) ? `In the ${stopDot(eco)}.` : '');
  const B = ok(leadsWithPrice(r) ? asks1 : firstSentence(r.blurb));
  if (first.length > cap) return cutAtWord(first, cap);
  for (const rung of [[P, E, B], [P, E], [E], [P, B], [P], [B]]) {
    if (rung.some((x) => !x)) continue;
    const text = [first, ...rung].join(' ');
    if (text.length <= cap) return text;
  }
  return first;
}
function cutAtWord(text, cap) {
  let out = '';
  for (const w of String(text).split(' ')) { const n = out ? `${out} ${w}` : w; if (n.length > cap - 1) break; out = n; }
  return `${out.replace(/[,:;.\s]+$/, '')}.`;
}

// JSON-LD extras (BIO-5 hook H5): about + Ecoregion / Watershed properties. No rating, no score, no area figure.
function jsonLdPlaceExtras(id) {
  const b = bioregions[id];
  if (!b) return {};
  const names = (b.ecoregions || []).map((e) => e && e.name).filter(isStr);
  const out = {};
  if (isStr(b.place)) out.about = { '@type': 'Place', name: stopDot(b.place) };
  const props = [];
  if (names.length) props.push({
    '@type': 'PropertyValue', name: 'Ecoregion', value: names.join('; '),
    description: "RESOLVE Ecoregions 2017 (CC BY 4.0), computed within 100 km of the region's reference point, not its footprint.",
  });
  const w = waterLine(id, { data: BIO_DATA });
  if (w) props.push({
    '@type': 'PropertyValue', name: 'Watershed', value: w,
    description: 'Named from the region dossier and checked against Natural Earth rivers.',
  });
  if (props.length) out.additionalProperty = props;
  return out;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Structured data (MC-SEO). One @graph per page: Place, BreadcrumbList, Dataset. Nothing here rates, scores, ranks or licenses
// anything: the Dataset says what was read, from where, for which window, and that it is free to read. Null cells are omitted.
const WEBSITE_ID = `${SITE}/#website`;
const websiteRef = () => ({ '@type': 'WebSite', '@id': WEBSITE_ID, name: site.name, url: `${SITE}/` });
// The creator is the group, with Askja named as originator (canon.authorship); no one else is named.
function workingGroup() {
  return {
    '@type': 'Organization',
    name: `${site.name} working group`,
    description: firstSentence(canon.authorship),
    founder: { '@type': 'Person', name: 'Askja', description: 'Originator of the framework' },
  };
}
// Display name of a cell's source: the registry's name when the cell points at it, else the printed source without a column name.
function sourceDisplay(cell) {
  const reg = cell && cell.sourceId && sources[cell.sourceId];
  return reg && isStr(reg.name) ? reg.name : readableSourceName(cell.source);
}
function datasetFor(r, canonical) {
  const measured = [];
  const basedOn = [];
  const seen = new Set();
  for (const c of criteria) {
    const cell = values[r.id] && values[r.id][c.id];
    if (!isObj(cell) || typeof cell.value !== 'number' || !Number.isFinite(cell.value)) continue;     // null cells are omitted
    const pv = { '@type': 'PropertyValue', propertyID: c.id, name: c.name, value: cell.value };
    const unit = isStr(cell.unit) ? cell.unit : (isStr(c.rangeLabel) ? c.rangeLabel : '');
    if (unit) pv.unitText = unit;
    if (isStr(cell.source)) pv.measurementTechnique = sourceDisplay(cell);
    const win = (c.window && c.window.label) || cell.vintage;
    if (isStr(win)) pv.temporalCoverage = win;
    const url = safeUrl(cell.sourceUrl);
    if (url) pv.url = url;
    measured.push(pv);
    const key = cell.sourceId || url || cell.source;
    if (isStr(cell.source) && !seen.has(key)) {
      seen.add(key);
      const ref = { '@type': 'CreativeWork', name: sourceDisplay(cell) };
      if (url) ref.url = url;
      basedOn.push(ref);
    }
  }
  const [lng, lat] = Array.isArray(r.coords) ? r.coords : [];
  const spatial = { '@type': 'Place', name: r.name };
  if (Number.isFinite(lat) && Number.isFinite(lng)) spatial.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  return {
    '@type': 'Dataset',
    '@id': `${canonical}#reading`,
    name: `A reading of ${r.name}`,
    description: `The sourced criteria for ${r.name}, ${r.country}, each with its unit, source and window. Nothing is summed.`,
    url: canonical,
    inLanguage: 'en',
    isAccessibleForFree: true,
    creator: workingGroup(),
    dateModified: buildDate,
    version: `data revision ${dataRevision.month}`,
    spatialCoverage: spatial,
    variableMeasured: measured,
    isBasedOn: basedOn,
  };
}
function regionGraph(r, canonical) {
  const [lng, lat] = Array.isArray(r.coords) ? r.coords : [];
  const place = {
    '@type': 'Place',
    '@id': `${canonical}#place`,
    name: r.name,
    description: lede(r),
    url: canonical,
    address: { '@type': 'PostalAddress', addressCountry: r.country },
    isPartOf: websiteRef(),
    ...jsonLdPlaceExtras(r.id),
  };
  if (Number.isFinite(lat) && Number.isFinite(lng)) place.geo = { '@type': 'GeoCoordinates', latitude: lat, longitude: lng };
  const crumbs = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: site.name, item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: 'Regions', item: `${SITE}/#region-grid` },
      { '@type': 'ListItem', position: 3, name: r.name, item: canonical },
    ],
  };
  return { '@context': 'https://schema.org', '@graph': [place, crumbs, datasetFor(r, canonical)] };
}

// ---------------------------------------------------------------------------------------------------------------------------
// Sections of the left column

// Salutation, large, directly above the name: "Whose land" (plus " - contested" as real text) over the short territory.
function salutationHtml(r) {
  const s = salutation(r.id, { data: SAL_DATA });
  return `<p class="salutation lg"><span class="sal-k">${esc(salutationLabel(s.contested))}</span><span class="sal-v">${esc(s.text || 'Not yet recorded')}</span></p>`;
}

function landStandingBlock(r) {
  if (!landStanding[r.id]) return '';
  return landStandingV2Html(r.id, { escape: esc, name: r.name, tagLevel: 2, data: BIO_DATA });
}

// The refusal band: the tool's stance, identical on every page (it is never a verdict on a place). Static: no animation.
function refusalBand() {
  return `<section class="refusal" aria-label="Where arriving would harm"><svg viewBox="${REFUSAL.viewBox}" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="${REFUSAL.river}" stroke-width="2.2"/><path d="${REFUSAL.gap}" stroke-width="2.2" stroke-dasharray="2 7"/><path d="${REFUSAL.bar}" stroke-width="3.2"/></svg><p>${esc(canon.refusal)}</p><small>Every region in this tool is already someone’s home. The river stops here by choice.</small></section>`;
}

function asksBlock(r) {
  const depth = regionDepth[r.id];
  if (!isObj(depth) || (!isStr(depth.asks) && !isStr(depth.caseStudy))) return '';
  const src = isStr(depth.source)
    ? `<p class="rp-asks-src">Source: ${depth.sourceUrl ? extLink(depth.source, depth.sourceUrl) : esc(depth.source)}</p>`
    : '';
  const deep = isStr(depth.caseStudy) && /^#[\w-]*$/.test(depth.caseStudy)
    ? `<a class="rp-deeplink" href="/deeper.html${esc(depth.caseStudy)}">Read the full case study${ARROW}</a>`
    : '';
  const text = isStr(depth.asks) ? `<p class="rp-asks-text">${esc(depth.asks)}</p>` : '<p class="rp-asks-text">This region has a full case study in the deeper material.</p>';
  return `<section class="rp-asks" aria-labelledby="rp-asks-t"><h2 id="rp-asks-t">What living here asks of you</h2>${text}${src}${deep}</section>`;
}

function placeBlock(r) {
  const html = placeStripHtml(r.id, { escape: esc, tagLevel: 2, data: BIO_DATA });
  return html || '';
}

function wayBlock(r) {
  const entry = legalPathway[r.id];
  if (!isObj(entry)) return '';
  const html = legalPathwayHtml(entry, { mode: 'page', idPrefix: 'way', anchor: 'way-in', regionId: r.id });
  return retag(html, { 4: 2 });
}

function contextBlock(r) {
  const entry = context[r.id];
  if (!isObj(entry)) return '';
  const html = contextHtml(entry, { mode: 'page', legend, sources, idPrefix: 'ctx' });
  return retag(html, { 4: 2, 5: 3 });
}

// ---------------------------------------------------------------------------------------------------------------------------
// The per-jurisdiction (V1) grid: "Where legal and cost questions come first". Every qualitative value is printed through
// qualLabel (never a raw enum token) as an OUTLINED NEUTRAL CHIP: shape and words, no green and no red. Filled square = yes /
// within, hollow square = no / outside, dash = not read, no shape = a plain word. A chip is never coloured by its value.
const SHAPE = { yes: 'yes', no: 'no' };
function chip(field, value, shape) {
  const label = qualLabel(field, value, QMETA);
  const sh = value === 'unknown' || !isStr(value) ? 'na' : (shape && SHAPE[shape]) || 'none';
  return `<span class="v1-chip" data-shape="${sh}">${esc(label)}</span>`;
}
const yesNoShape = (v) => (v === 'yes' ? 'yes' : v === 'no' ? 'no' : '');
const kv = (label, inner) => (inner ? `<div><dt>${esc(label)}</dt><dd>${inner}</dd></div>` : '');
const note = (text) => (isStr(text) ? ` <span class="v1-note">${esc(text)}</span>` : '');

function sourceLine(rec) {
  if (!isObj(rec) || !isStr(rec.source)) return '';
  const conf = isStr(rec.data_confidence) ? ` · ${esc(qualLabel('data_confidence', rec.data_confidence, QMETA))}` : '';
  return `<p class="v1-src">Source: ${rec.source_url ? extLink(rec.source, rec.source_url) : esc(rec.source)}${conf}</p>`;
}
const gapsLine = (rec) => (isObj(rec) && isStr(rec.gaps) ? `<p class="v1-gaps"><b>Known gaps.</b> ${esc(rec.gaps)}</p>` : '');
const card = (title, rows, foot) => `<div class="v1-card"><h3 class="v1-card-h">${esc(title)}</h3><dl class="v1-kv">${rows.join('')}</dl>${foot || ''}</div>`;

function legalCard(r) {
  const legal = v1.legal_ownership[r.id];
  if (!legal) return '';
  const fo = legal.foreign_ownership;
  const first = Array.isArray(legal.preemption_or_first_claim_holders) ? legal.preemption_or_first_claim_holders.filter(isStr) : [];
  return card('Legal and ownership', [
    fo ? kv('Foreign ownership', `${chip('foreign_ownership', fo.allowed, yesNoShape(fo.allowed))}${note(fo.notes)}`) : '',
    kv('Collective ownership path', isStr(legal.collective_ownership_path) ? esc(legal.collective_ownership_path) : ''),
    kv('Several households on one holding', legal.multi_household_residence_as_of_right ? chip('multi_household_residence_as_of_right', legal.multi_household_residence_as_of_right, yesNoShape(legal.multi_household_residence_as_of_right)) : ''),
    kv('Residency needed to buy', legal.residency_required_for_purchase ? chip('residency_required_for_purchase', legal.residency_required_for_purchase, yesNoShape(legal.residency_required_for_purchase)) : ''),
    kv('Where building is decided', isStr(legal.planning_gate_for_living) ? esc(legal.planning_gate_for_living) : ''),
    kv('First-claim holders', first.length ? first.map(esc).join('; ') : ''),
    kv('Key restriction', isStr(legal.key_legal_restriction) ? `<em>${esc(legal.key_legal_restriction)}</em>` : ''),
    kv('Legal direction', legal.regulatory_direction ? `${chip('regulatory_direction', legal.regulatory_direction)}${note(legal.regulatory_notes)}` : ''),
  ], `${sourceLine(legal)}${gapsLine(legal)}`);
}

function costCard(r) {
  const cost = v1.land_cost[r.id];
  if (!cost) return '';
  let price = '';
  if (cost.price_per_ha_low != null && cost.price_per_ha_high != null) {
    const lo = fmtNumber(cost.price_per_ha_low), hi = fmtNumber(cost.price_per_ha_high);
    price = `<span class="mono"><strong>${esc(lo === hi ? lo : `${lo}–${hi}`)} ${esc(cost.price_currency || '')} per hectare</strong></span>${cost.price_vintage ? ` <span class="v1-note">(${esc(cost.price_vintage)})</span>` : ''}`;
  }
  return card('Land cost', [
    kv('Price', price),
    kv('Price band', cost.affordability_band ? chip('affordability_band', cost.affordability_band) : ''),
    kv('Price trajectory', cost.appreciation_trajectory ? `${chip('appreciation_trajectory', cost.appreciation_trajectory)}${note(cost.appreciation_notes)}` : ''),
    kv('Detail', isStr(cost.price_notes) ? esc(cost.price_notes) : ''),
  ], `${sourceLine(cost)}${gapsLine(cost)}`);
}

function hospitalCard(r) {
  const h = v1.hospital_proximity[r.id];
  if (!h) return '';
  const near = h.nearest_hospital_km != null
    ? `<span class="mono"><strong>${esc(fmtNumber(h.nearest_hospital_km))} km</strong></span>${isStr(h.nearest_hospital_name) ? ` <span class="v1-note">${esc(h.nearest_hospital_name)}, straight line from the region centre</span>` : ' <span class="v1-note">straight line from the region centre</span>'}`
    : '';
  const proxy = typeof h.red_line_60min_proxy_passes === 'boolean'
    ? `<span class="v1-chip" data-shape="${h.red_line_60min_proxy_passes ? 'yes' : 'no'}">${h.red_line_60min_proxy_passes ? 'within 60 minutes' : 'outside 60 minutes'}</span> <span class="v1-note">a straight-line proxy, not a road time</span>`
    : '';
  return card('Hospital access', [
    kv('Nearest hospital', near),
    kv('Hospitals within 50 km', h.hospitals_within_50km != null ? `<span class="mono">${esc(String(h.hospitals_within_50km))}</span>` : ''),
    kv('Hospitals within 100 km', h.hospitals_within_100km != null ? `<span class="mono">${esc(String(h.hospitals_within_100km))}</span>` : ''),
    kv('60-minute proxy', proxy),
  ], isStr(h.proxy_caveat) ? `<p class="v1-src"><em>${esc(h.proxy_caveat)}</em></p>` : '');
}

function demographyCard(r) {
  const d = v1.demographic_trajectory[r.id];
  if (!d) return '';
  const row = (label, field, notesKey) => kv(label, d[field] ? `${chip(field, d[field])}${note(d[notesKey])}` : '');
  return card('Demographics', [
    row('Population trend', 'population_trend', 'population_trend_notes'),
    row('Median age', 'median_age_band', 'median_age_notes'),
    row('Migration', 'migration_dynamic', 'migration_notes'),
    row('Rural density', 'rural_density_signal', 'rural_density_notes'),
  ], `${sourceLine(d)}${gapsLine(d)}`);
}

function waterCard(r) {
  const w = v1.water_source_control[r.id];
  if (!w) return '';
  return card('Water source control', [
    kv('Rights regime', isStr(w.water_rights_regime) ? esc(w.water_rights_regime) : ''),
    kv('Rights holder', w.water_rights_holder_type ? chip('water_rights_holder_type', w.water_rights_holder_type) : ''),
    kv('Single-entity control', w.single_entity_control_risk ? `${chip('single_entity_control_risk', w.single_entity_control_risk)}${note(w.control_risk_notes)}` : ''),
    kv('When water is short', isStr(w.drought_priority_mechanism) ? esc(w.drought_priority_mechanism) : ''),
  ], `${sourceLine(w)}${gapsLine(w)}`);
}

function soilCard(r) {
  const s = v1.soil_contamination[r.id];
  if (!s) return '';
  const regime = isStr(s.contamination_regulatory_regime) && s.contamination_regulatory_regime !== 'unknown' ? esc(s.contamination_regulatory_regime) : '';
  return card('Soil contamination', [
    kv('Known contamination', s.known_contamination_signal ? `${chip('known_contamination_signal', s.known_contamination_signal)}${note(s.known_contamination_notes)}` : ''),
    kv('Contamination register', s.contamination_register_availability ? chip('contamination_register_availability', s.contamination_register_availability) : ''),
    kv('Due-diligence burden', s.due_diligence_burden ? chip('due_diligence_burden', s.due_diligence_burden) : ''),
    kv('Regulatory regime', regime),
  ], `${sourceLine(s)}${gapsLine(s)}`);
}

// Climate buffering: state and trajectory, the framework's two axes, as two cards.
function bufferingCards(r) {
  const cb = v1.climate_buffering[r.id];
  if (!cb) return '';
  const features = (Array.isArray(cb.primary_buffering_features) ? cb.primary_buffering_features : [])
    .map((f) => `<span class="v1-chip" data-shape="none">${esc(String(f).replace(/_/g, ' '))}</span>`).join(' ');
  const state = card('Buffering features (state)', [
    kv('Primary features', features),
    kv('Altitude range', isStr(cb.altitude_range_m) ? `<span class="mono">${esc(cb.altitude_range_m)}</span>` : (cb.altitude_range_m != null && typeof cb.altitude_range_m !== 'object' ? `<span class="mono">${esc(String(cb.altitude_range_m))}</span>` : '')),
    kv('Buffering strength', cb.buffering_strength ? chip('buffering_strength', cb.buffering_strength) : ''),
    kv('Detail', isStr(cb.buffering_notes) ? esc(cb.buffering_notes) : ''),
  ]);
  const traj = card('Trajectory under warming', [
    kv('Direction', cb.trajectory_under_warming ? `${chip('trajectory_under_warming', cb.trajectory_under_warming)}${note(cb.trajectory_notes)}` : ''),
    kv('Primary vulnerability', isStr(cb.primary_vulnerability_signal) ? `<em>${esc(cb.primary_vulnerability_signal)}</em>` : ''),
  ], `${sourceLine(cb)}${gapsLine(cb)}`);
  return `${state}${traj}`;
}

function v1Section(r) {
  const groups = [
    { label: '', cards: [legalCard(r), costCard(r)] },
    { label: 'Practical fit', cards: [hospitalCard(r), demographyCard(r)] },
    { label: 'Field reality, water and soil', cards: [waterCard(r), soilCard(r)] },
    { label: 'Climate buffering, state and trajectory', cards: [bufferingCards(r)] },
  ].filter((g) => g.cards.some(Boolean));
  if (!groups.length) return '';
  const body = groups.map((g) => `<div class="v1-set">${g.label ? `<p class="v1-group">${esc(g.label)}</p>` : ''}<div class="v1-grid">${g.cards.join('')}</div></div>`).join('');
  return `<section class="v1-section" aria-labelledby="v1-t"><h2 id="v1-t">Where legal and cost questions come first</h2><p class="v1-lead">These are the questions a community has to be able to answer in a place: who may hold the land, how a group can hold it together, and what it costs. Read them as context for a conversation with the people already there, not as a verdict on the place.</p>${body}</section>`;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Right column: the ledger of all the criteria, in the data's own order
// A dataset column name in a source string ("WRI Aqueduct 4.0 (bau50_ws_x_r)") is not something a visitor reads: the display drops
// that parenthesis and keeps the full string as the link's title. The data is untouched.
const FIELD_NAME_PAREN = /\s*\([^()]*_[^()]*\)/g;
const readableSourceName = (s) => String(s).replace(FIELD_NAME_PAREN, '').trim();
function readableCells(r) {
  const out = {};
  const full = {};
  for (const c of criteria) {
    const cell = values[r.id] && values[r.id][c.id];
    if (cell && typeof cell.source === 'string' && readableSourceName(cell.source) !== cell.source) {
      out[c.id] = { ...cell, source: readableSourceName(cell.source) };
      full[c.id] = cell.source;
    } else out[c.id] = cell;
  }
  return { cells: out, full };
}

function offersBlock(r) {
  const { cells, full } = readableCells(r);
  // One ledger row per criterion, in the data's own order. Each row keeps its place even as a gap row.
  const rows = criteria.map((c) => {
    let li = ledgerRowHtml(c, cells[c.id], sources);
    li = li.replace('<li', `<li data-criterion="${esc(c.id)}"`);
    // keep the full source string as the link's title where the display dropped a column name (same as the drawer)
    if (full[c.id]) li = li.replace(/(<div class="sb">[\s\S]*?)<a href="/, `$1<a title="${esc(full[c.id])}" href="`);
    return li;
  }).join('');
  const n = countWord(criteria.length);
  const cont = esc(r.continent);
  return `<aside class="offers" aria-labelledby="offers-t"><h2 id="offers-t" class="leaf-h">What it offers</h2><p class="offers-sub">The ${esc(n)} criteria, with sources, in native units.</p><ul class="ledger">${rows}</ul><p class="ledger-note">Each line keeps its source, vintage and licence. A row marked not yet verified keeps its place and never takes a guessed number.</p><a class="cta" href="/?c=${cont}&amp;pin=${esc(r.id)}">Pin this region and set your thresholds${ARROW}</a><p class="offers-stance">${esc(canon.stance)}</p></aside>`;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Page parts: rail, all-regions list, colophon
const RAIL = `<aside id="rct-rail" aria-label="Regen Community Tools">
  <div class="rct-wordmark">REGEN COMMUNITY TOOLS</div>
  <nav>
    <a href="https://compass.regencommunity.tools"><span class="rct-num">01 · People</span><span class="rct-nm">Community Compass</span></a>
    <a href="https://atlas.regencommunity.tools"><span class="rct-num">02 · The Field</span><span class="rct-nm">The Living Atlas</span></a>
    <a class="rct-current" href="https://land-selection-framework.regencommunity.tools" aria-current="page"><span class="rct-num">03 · The Ground</span><span class="rct-nm">Land Selection</span></a>
    <a href="https://whoholds.regencommunity.tools"><span class="rct-num">04 · The Holding</span><span class="rct-nm">Who Holds This</span></a>
    <a href="https://trail.regencommunity.tools"><span class="rct-num">05 · The Movement</span><span class="rct-nm">Nomad Trail</span></a>
    <a href="https://commons.regencommunity.tools"><span class="rct-num">00 · The Other Beginning</span><span class="rct-nm">Community Commons</span></a>
  </nav>
  <div class="rct-foot"><a href="https://regencommunity.tools">regencommunity.tools</a></div>
</aside>`;

// Every region, in the slate's declared order (stated on the page, never sorted), no thumbnails, no ordinals.
function regionsNav(current) {
  const items = regions.map((r) => (r.id === current.id
    ? `<li class="current"><span aria-current="page"><span class="rn-name">${esc(r.name)}</span><span class="rn-country">${esc(r.country)}</span></span></li>`
    : `<li><a href="/region/${esc(r.id)}.html"><span class="rn-name">${esc(r.name)}</span><span class="rn-country">${esc(r.country)}</span></a></li>`)).join('');
  return `<nav class="rp-regions" aria-labelledby="rp-regions-t"><h2 id="rp-regions-t">Every region in the tool</h2><p class="rp-regions-note">Listed in the order the data declares them. The order is not a ranking.</p><ul class="region-nav">${items}</ul></nav>`;
}

// Read on (MC-SEO): the four routes out of a region page that a crawler or a reader needs, as real links in the page text: how to
// arrive here (arrive.html with this region preselected), the page for people already here, the method, and the other regions
// (the all-regions list below). Same list styling as the all-regions list, in its own nav so that list stays a pure region list.
function readOnNav(r) {
  const items = [
    [`/arrive.html?region=${encodeURIComponent(r.id)}#region`, 'How to arrive here', `in ${r.name}`],
    ['/host.html', 'For people already here', 'who is asked, and how'],
    ['/deeper.html#methodology', 'How the criteria are read', 'the method'],
  ].map(([href, name, note]) => `<li><a href="${esc(href)}"><span class="rn-name">${esc(name)}</span><span class="rn-country">${esc(note)}</span></a></li>`).join('');
  return `<nav class="rp-readon" aria-labelledby="rp-readon-t"><h2 id="rp-readon-t">Read on</h2><ul class="region-nav">${items}</ul></nav>`;
}

function colophon() {
  const seen = new Set();
  const srcs = criteria.filter((c) => !seen.has(c.source) && seen.add(c.source))
    .map((c) => `<li>${extLink(readableSourceName(c.source), c.sourceUrl)}</li>`).join('');
  // the same wording the home page's colophon carries: the data revision month as written (2026-10)
  const revision = canon.revision.replace('{{data_revision}}', dataRevision.month);
  return `<footer class="colophon">
    <div class="art" aria-hidden="true">${lineworkSvg(colophonArt())}</div>
    <div class="container">
      <p class="frame">Opinionated about method, quiet about preference. Read the data, set your own thresholds, decide for yourself.</p>
      <div class="cols">
        <div>
          <h3>Who made this</h3>
          <p>${esc(canon.authorship)}</p>
          <p>${esc(canon.privacy)}</p>
          <p>${esc(canon.contact)}</p>
        </div>
        <div>
          <h3>How to read it</h3>
          <ul>
            <li>Thresholds filter; they never score or rank.</li>
            <li>Land standing is qualitative and never a filter.</li>
            <li>Every value carries its source and vintage.</li>
            <li>The rivers and contours drawn on this page are ornament, not surveyed. For geography, use the map and ask the people who live there.</li>
          </ul>
        </div>
        <div>
          <h3>Sources cited</h3>
          <ul id="sources-list">${srcs}</ul>
        </div>
      </div>
      <div class="notes">
        <p>${esc(canon.status)}</p>
        <p>${esc(revision)}</p>
      </div>
      <p class="stamp">prototype · open data sources, no commercial product · last updated ${esc(buildDate)}</p>
    </div>
  </footer>`;
}

// ---------------------------------------------------------------------------------------------------------------------------
// The page
const STYLES = ['tokens', 'fonts', 'theme-gate', 'base', 'rail', 'colophon', 'reciprocity', 'ledger', 'way', 'region-page', 'v1-grid'];
const INSIGHTS = '<script defer src="/_vercel/insights/script.js"></script>';

function page(r) {
  const title = `${r.name}, ${r.country} - ${site.name}`;
  const description = metaDescription(r);
  const canonical = `${SITE}/region/${r.id}.html`;
  const ogImage = `${SITE}/api/og?region=${r.id}&v=${buildId}`;
  const b = bioregions[r.id] || {};

  const jsonld = JSON.stringify(regionGraph(r, canonical)).replace(/</g, '\\u003c');

  const sheets = STYLES.map((n) => `<link rel="stylesheet" href="/src/styles/${n}.css?v=${esc(buildId)}" />`).join('\n');
  const accent = /^#[0-9a-fA-F]{3,8}$/.test(r.accent || '') ? r.accent : '#8a3a2a';

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<meta name="theme-color" content="#f6f2eb" />
<meta name="theme-color" content="#17140f" media="(prefers-color-scheme: dark)" />
<!-- Fonts self-hosted (Fraunces, Spectral, Inter; SIL OFL 1.1). The three faces used above the fold are preloaded; the URLs equal the @font-face URLs in fonts.css (?v=fv1). -->
<link rel="preload" as="font" type="font/woff2" href="/vendor/fonts/fraunces-var-latin.woff2?v=fv1" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/vendor/fonts/spectral-400-latin.woff2?v=fv1" crossorigin />
<link rel="preload" as="font" type="font/woff2" href="/vendor/fonts/inter-var-latin.woff2?v=fv1" crossorigin />
${sheets}
<script type="application/ld+json">${jsonld}</script>
${INSIGHTS}
</head>
<body>
<a class="skip-link" href="#main">Skip to main content</a>

${RAIL}

<main id="main" tabindex="-1">
  <div class="rp-wrap">
    <article class="rp" style="--region:${esc(accent)}">
      <div class="wave" aria-hidden="true"></div>
      <div class="rp-art" aria-hidden="true">${lineworkSvg(catchment())}</div>
      <div class="rp-in">
        <nav class="crumbs" aria-label="Breadcrumb"><ul><li><a href="/">${esc(site.name)}</a></li><li><a href="/#region-grid">Regions</a></li><li><span aria-current="page">${esc(r.name)}</span></li></ul></nav>
        ${salutationHtml(r)}
        <h1>${esc(r.name)}</h1>
        <div class="meta"><span class="country">${esc(r.country)}</span>${isStr(b.place) ? `<span class="place">${esc(b.place)}</span>` : ''}</div>
        <p class="rp-lede">${esc(lede(r))}</p>
        <div class="rp-grid">
          <div class="rp-main">
            ${landStandingBlock(r)}
            ${refusalBand()}
            ${asksBlock(r)}
            ${placeBlock(r)}
            ${wayBlock(r)}
            ${contextBlock(r)}
            ${v1Section(r)}
          </div>
          ${offersBlock(r)}
        </div>
      </div>
    </article>
    ${readOnNav(r)}
    ${regionsNav(r)}
  </div>
</main>

${colophon()}
</body>
</html>
`;
}

// ---------------------------------------------------------------------------------------------------------------------------
// Generate in memory first (path relative to the site root -> contents); written or compared afterwards
const files = new Map();
for (const r of regions) files.set(`region/${r.id}.html`, page(r));
const count = regions.length;

// sitemap.xml at the site root: home, deeper, the optional pages that exist, every region page. lastmod is the build date from
// site-facts (deterministic: the clock is never read here). The optional pages are hand-authored (wave 8); a page is listed only
// when its file exists under the output root (--out-dir) or, for the in-place and --check runs, in this prototype folder.
const PAGES_ROOT = opts.outDir || ROOT;
const optionalPages = ['arrive.html', 'host.html', 'terms-of-arrival.html'].filter((f) => existsSync(join(PAGES_ROOT, f)));
const urls = [`${SITE}/`, `${SITE}/deeper.html`, ...optionalPages.map((f) => `${SITE}/${f}`), ...regions.map((r) => `${SITE}/region/${r.id}.html`)];
files.set('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${buildDate}</lastmod></url>`).join('\n')}
</urlset>
`);

// llms.txt (llmstxt.org shape: H1, a blockquote summary, then sections of links). Written from the data and the canon strings only.
const CONTINENT_LABELS = { europe: 'Europe', 'north-america': 'North America' };
const continentLabel = (c) => CONTINENT_LABELS[c] || String(c).replace(/(^|-)([a-z])/g, (_m, sp, ch) => (sp ? ' ' : '') + ch.toUpperCase());
function regionLine(r) {
  const { sal, place } = leadParts(r);
  const bits = [sal.short ? `Whose land: ${stopDot(sal.short)}.` : '', place ? `${place}.` : ''].filter((x) => isStr(x) && !PRICE_WORDS.test(x));
  return bits.length ? bits.join(' ') : `${r.country}.`;
}
function llmsTxt() {
  const L = [];
  const origin = SITE;
  L.push(`# ${site.name}`, '', `> ${canon.descriptor} ${canon.stance}`, '');
  L.push(`${canon.refusal} ${firstSentence(canon.authorship)} ${canon.status}`, '');
  L.push('## Key pages', '');
  L.push(`- [Home: thresholds and map](${origin}/): set your own thresholds on ${countWord(facts.criteria)} sourced criteria and read the matching regions on a map. Thresholds filter; nothing is summed.`);
  L.push(`- [The framework in depth](${origin}/deeper.html): method, case studies, ethics and sources.`);
  L.push(`- [Methodology](${origin}/deeper.html#methodology): how each criterion is read, with its window and its limits.`);
  const optional = { 'arrive.html': 'How to arrive: the questions to ask the people already there, before anything else', 'host.html': 'For people already here: what this tool says about your place and what it leaves to you', 'terms-of-arrival.html': 'Terms of arrival: a printable statement of good-faith arrival' };
  for (const f of optionalPages) L.push(`- [${optional[f].split(':')[0]}](${origin}/${f}): ${optional[f].split(': ').slice(1).join(': ')}.`);
  L.push(`- [Sitemap](${origin}/sitemap.xml)`, '');

  L.push('## Regions', '');
  L.push(`${CapWord(regions.length)} regions, listed in the order the data declares them. The order is not a ranking. Each page opens with whose land it is, then what living there asks, the place, the way in, and the criteria with their sources.`, '');
  const byContinent = new Map();
  for (const r of regions) { if (!byContinent.has(r.continent)) byContinent.set(r.continent, []); byContinent.get(r.continent).push(r); }
  for (const [continent, list] of byContinent) {
    L.push(`### ${continentLabel(continent)}`, '');
    for (const r of list) L.push(`- [${r.name}, ${r.country}](${origin}/region/${r.id}.html): ${regionLine(r)}`);
    L.push('');
  }

  L.push('## How the data is dated and licensed', '');
  L.push(`Every value on a region page prints its source, its vintage (the period the number describes) and its licence. Values were revised against their cited sources in ${dataRevision.month} (site built ${buildDate}). A licence the provider's own page did not state reads "licence not confirmed"; none is inferred. Native units are kept; nothing is resampled to a common grid.`, '');
  const criterionSources = new Set();
  for (const c of criteria) {
    const reg = c.sourceId && sources[c.sourceId];
    if (c.sourceId) criterionSources.add(c.sourceId);
    const win = c.window && c.window.label ? `, window ${c.window.label}` : '';
    const lic = sourcesMod.licenseOf({ sourceId: c.sourceId }, c);
    const name = reg && isStr(reg.name) ? reg.name : readableSourceName(c.source);
    const url = safeUrl(reg && reg.url) || safeUrl(c.sourceUrl);
    L.push(`- ${c.name}${win}: ${url ? `[${name}](${url})` : name}. Licence: ${lic}.`);
  }
  const extra = new Map();
  for (const r of regions) for (const c of criteria) {
    const cell = values[r.id] && values[r.id][c.id];
    if (isObj(cell) && cell.sourceId && !criterionSources.has(cell.sourceId) && sources[cell.sourceId]) extra.set(cell.sourceId, sources[cell.sourceId]);
  }
  if (extra.size) {
    L.push('', 'Some regional values cite a different source where the usual one has no coverage; the region page names it on that value:', '');
    for (const [id, reg] of extra) {
      const url = safeUrl(reg.url);
      L.push(`- ${url ? `[${reg.name}](${url})` : reg.name}. Licence: ${isStr(reg.license) ? reg.license : 'licence not confirmed'}.`);
    }
  }
  L.push('', 'Land standing, region depth and the way in are written text, each with its own source line, checked against opened public sources on the date it shows. No nation or community named has reviewed its entry.', '');

  L.push('## What this is not', '');
  L.push('- Not a score, a ranking or a recommendation. No criteria are summed or weighted, and no region is called best, top or first. The tool filters by thresholds you set; the order of regions is the data\'s declared order.');
  L.push('- Not a listing of land and not a guide to where to go. Land standing is qualitative and is never a filter. Where arriving would harm the community already there, the honest answer is not there.');
  L.push('- Not a finished data product. A cell the pipeline could not reproduce is shown as not yet verified; it is never filled with a guessed number.', '');

  L.push('## How to cite', '');
  L.push(`${site.name} working group (framework originated by Askja). ${site.name}, data revision ${dataRevision.month}, built ${buildDate}. ${origin}/`);
  L.push(`For one region, cite its page, for example ${origin}/region/${regions[0].id}.html, and name the criterion and its source and vintage as printed there.`, '');
  return L.join('\n');
}
files.set('llms.txt', llmsTxt());

// Unified diff head for one file (via system diff on temp copies; the check verdict never depends on it).
function diffHead(rel, expected, actual, maxLines = 40) {
  const dir = join(tmpdir(), `gen_region_check_${process.pid}`);
  mkdirSync(dir, { recursive: true });
  const a = join(dir, 'disk');
  const b = join(dir, 'generated');
  writeFileSync(a, actual, 'utf8');
  writeFileSync(b, expected, 'utf8');
  const res = spawnSync('diff', ['-u', '--label', `disk/${rel}`, '--label', `generated/${rel}`, a, b], { encoding: 'utf8' });
  return (res.stdout || '').split('\n').slice(0, maxLines).join('\n');
}

if (opts.check) {
  const bad = [];
  for (const [rel, content] of files) {
    const path = join(ROOT, rel);
    if (!existsSync(path)) { bad.push({ rel, why: 'missing on disk', head: '' }); continue; }
    const onDisk = readFileSync(path, 'utf8');
    if (onDisk !== content) bad.push({ rel, why: 'differs from generated output', head: diffHead(rel, content, onDisk) });
  }
  if (bad.length) {
    console.error(`gen_region_pages --check: ${bad.length} of ${files.size} generated files out of date:`);
    for (const b of bad.slice(0, 5)) {
      console.error(`\n--- ${b.rel}: ${b.why}`);
      if (b.head) console.error(b.head);
    }
    if (bad.length > 5) console.error(`\n... and ${bad.length - 5} more: ${bad.slice(5).map((b) => b.rel).join(', ')}`);
    process.exit(1);
  }
  console.log(`gen_region_pages --check: OK (${files.size} generated files match disk: ${count} region pages + sitemap.xml + llms.txt)`);
} else {
  const base = opts.outDir || ROOT;
  for (const [rel, content] of files) {
    const path = join(base, rel);
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf8');
  }
  console.log(`Generated ${count} region pages in ${opts.outDir ? join(base, 'region') : 'region/'} + sitemap.xml (${urls.length} urls) + llms.txt${opts.outDir ? ` under ${base}` : ''}`);
}
