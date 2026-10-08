// Site facts: the ONE place the site's counts, count words, dates and canonical sentences come from (MC-FACTS, 2026-10).
//
// DOM-free and edge-safe: it imports only data modules (no window, document, fs or process), so it runs in the browser, in
// plain Node (scripts/stamp_build.mjs) and in the Vercel edge runtime. Nothing here is typed that the data already says:
//   * every count is derived from data/regions.js (regions, criteria) and data/layer-sources.js (layers, themes);
//   * every count word and date text is computed from those counts and from buildDate;
//   * `buildId` and `buildDate` are the only two typed values, and only `node scripts/stamp_build.mjs --bump --write`
//     rewrites them (the two `export const` lines below are its edit surface: keep their shape).
//
// Nothing here scores, ranks or combines anything: a count is a count of what the data files contain.

import { regions, criteria } from './regions.js';
import { panelLayerSources } from './layer-sources.js';

// ---- the two stamped values (written only by `stamp_build.mjs --bump`) -------------------------------------------------
export const buildId = 'b20261007123838';
export const buildDate = '2026-10-07';

// The month the data values were revised against their cited sources. A CONSTANT: it is not the build date, so a later
// rebuild can never rewrite history. Marker `<!--f:dataRevision-->` prints it.
export const dataRevision = { month: '2026-10' };

export const site = {
  name: 'Land Selection Framework',
  origin: 'https://land-selection-framework.regencommunity.tools',
};

// ---- count words -------------------------------------------------------------------------------------------------------
const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0 to 99 in words ("twenty-one"); anything else (negative, fractional, above 99, not a number) comes back as digits. */
export function countWord(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
}

/** countWord with a capital first letter ("Thirty"). */
export function CapWord(n) {
  const w = countWord(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
}

// ---- counts, derived ---------------------------------------------------------------------------------------------------
// A "layer" is a registry entry that appears as a map panel toggle: data/layer-sources.js entries that are panel toggles,
// not retired, not a basemap. Context layers (the bioregion outlines and rivers the BIO track draws) are references, not
// data layers, so a `role: 'context'` entry is never counted. A non-context layer declared by a map extension must also be
// in the registry (tests/core/site-facts.test.mjs fails otherwise), so the registry stays the single source.
function countedLayers() {
  return panelLayerSources().filter((l) => l.role !== 'context');
}

function byContinent() {
  const out = {};
  for (const r of regions) out[r.continent] = (out[r.continent] || 0) + 1;
  return out;
}

const _byContinent = byContinent();
const _layers = countedLayers();

/** Derived counts. Read by the stamp (count words, meta, JSON-LD), by the OG card and by the tests; never typed. */
export const facts = {
  regions: regions.length,
  regionsByContinent: _byContinent,
  regionsEurope: _byContinent.europe || 0,
  regionsNA: _byContinent['north-america'] || 0,
  criteria: criteria.length,
  layers: _layers.length,
  themes: new Set(_layers.map((l) => l.group)).size,
  dataRevision,
};

// ---- canonical sentences -----------------------------------------------------------------------------------------------
// Copied VERBATIM from the canon-copy.md of the 2026-10 upgrade's docs track (DOC-1). tests/core/site-facts.test.mjs fails when that
// file exists and differs. Placeholders in double braces ({{date}}, {{data_revision}}) are filled by the user of the string.
export const canon = {
  descriptor: 'A bioregioning tool for communities seeking to belong to a place and help it flourish over fifty to a hundred years.',
  descriptorShort: 'a bioregioning tool for communities seeking to belong to a place and help it flourish over 50–100 years.',
  stance: 'It filters; it never scores, ranks, or tells you where to go.',
  refusal: 'Where arriving in a place would harm the community already there, the honest answer is not to go.',
  authorship: 'The framework was originated by Askja and is developed by a small working group of practitioners and researchers. The demonstration site was built by one member of that group, who holds the practitioner seat.',
  status: 'A designed demonstration of the framework, not a finished data product. Values are sourced and dated; the group has not yet ratified the slate or the V1 proposal.',
  privacy: 'Members are named by first name and role only, as in the working documents; no surnames, handles or contact details appear anywhere on the site.',
  contact: 'There is no public contact route yet; the working group will set one.',
  provenance: 'Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.',
  provenanceShort: 'Drafted by Claude for @Gustaf and appended on his standing go-ahead, before he had read it.',
  landStandingProvenance: 'Assembled from public sources and checked on {{date}}. No nation or community named here has reviewed this entry.',
  revision: 'Values revised {{data_revision}} against their cited sources; earlier shared links may match different regions.',
  wording: 'A Land standing entry, a territory claim or a legal pathway is "checked against opened public sources", never "verified" in a sense that could be read as review, consent or approval by a nation, a community or the working group.',
};

// ---- dates (no locale, no clock: the same text on every machine) ---------------------------------------------------------
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** '2026-10-05' -> '5 October 2026'; '2026-10' -> 'October 2026'. Anything else comes back unchanged. */
export function longDate(iso) {
  const m = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(String(iso));
  if (!m || +m[2] < 1 || +m[2] > 12) return String(iso);
  return (m[3] ? `${+m[3]} ` : '') + `${MONTHS[+m[2] - 1]} ${m[1]}`;
}

const upFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Every `<!--f:KEY-->` the stamp can print, as strings. `o.buildId` / `o.buildDate` override the two stamped constants (the
 * stamp passes the new values right after a --bump, without re-importing this module).
 */
export function factValues(o = {}) {
  const id = o.buildId ?? buildId;
  const date = o.buildDate ?? buildDate;
  const v = {
    regions: String(facts.regions),
    regionsEurope: String(facts.regionsEurope),
    regionsNA: String(facts.regionsNA),
    criteria: String(facts.criteria),
    layers: String(facts.layers),
    themes: String(facts.themes),
    buildId: String(id),
    buildDate: String(date),
    buildDateLong: longDate(date),
    year: String(date).slice(0, 4),
    dataRevision: dataRevision.month,
    dataRevisionLong: longDate(dataRevision.month),
    revision: canon.revision.replace('{{data_revision}}', longDate(dataRevision.month)),
  };
  for (const k of ['regions', 'regionsEurope', 'regionsNA', 'criteria', 'layers', 'themes']) {
    v[`${k}Word`] = countWord(facts[k]);
    v[`${upFirst(k)}Word`] = CapWord(facts[k]);
  }
  return v;
}
