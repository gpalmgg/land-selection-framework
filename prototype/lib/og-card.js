// lib/og-card.js: the share cards (1200 x 630) as Satori element trees, and the routing from a query string to one of them.
// Imported by api/og.js (the edge function renders the tree with @vercel/og), by scripts/og_harness.mjs (plain Node) and by
// scripts/render_static_og.mjs (the static og.png / og-deeper.png fallbacks), so every card comes from one place.
//
// Pure and edge-safe: no fs, no fetch, no process, no top-level await. Satori constraints that shape the code:
//   * flexbox only (every div with more than one child says display:flex); no CSS grid
//   * the fonts are static woff files from /vendor/fonts (api/og.js fetches them from the same origin), so text is limited to
//     what their subsets hold: Latin-1, curly quotes, en and em dash, bullet. fit() turns anything else into the nearest
//     base letter (or drops it) so a card never reaches for a runtime font download and never overflows
//   * comparisons are written as words ("at least", "at most"): the two comparison glyphs are not in the subsets
//
// QUALITATIVE ONLY. A card shows who a place belongs to, its name, its ecoregion and watershed, or which regions sit within the
// visitor's thresholds. It never scores, ranks, sums or recommends; the cost of land is not on any card.
//
// Bundle budget (scripts/release/check_edge_bundle.mjs: baseline + 150 KB): the data modules are bundled whole, so this file
// imports only regions, reciprocity (territoryShort) and bioregions (ecoregion, watershed). It deliberately does NOT import
// lib/bio.js or lib/salutation.js (both pull in data/land-standing.js, 88 KB) nor data/site-facts.js (pulls the 42 KB layer
// registry); the two small pieces it needs from them (ecoSubline, the verified-territory rule) are repeated below, and
// tests/e2e/suites/test_og.py compares both against the originals for every region so they cannot drift.

import { regions } from '../data/regions.js';
import { reciprocity } from '../data/reciprocity.js';
import { bioregions } from '../data/bioregions.js';
import { computeResult, resolveQuery } from './result.js';
import { qualFiltersFor } from './url-state.js';

export const C = { PAPER: '#f6f2eb', SHEET: '#fbf9f4', INK: '#1a1a1a', INK2: '#3a3a3a', INK3: '#5f574c', RULE: '#d8d0c2', ACCENT: '#8a3a2a', WASH: '#f3ece6', HOST: '#3a5a3a', RIVER: '#2c5f7c' };

// The one static OG font (Spectral 500, as on the pre-upgrade card), same origin (api/og.js builds the URLs from the request). Satori reads woff, not woff2 or variable fonts.
export const FONT_FILES = [
  { name: 'Spectral', path: '/vendor/fonts/spectral-og-500.woff', style: 'normal', weight: 500 },
];

export const DOMAIN = 'land-selection-framework.regencommunity.tools';
const W = 1200, H = 630;
const GT = '\u2265', LT = '\u2264';

// ---- text helpers ------------------------------------------------------------------------------------------------------
// Satori element constructor: reads .type and .props (style, children).
export function h(type, style, children) {
  return { type, props: children === undefined ? { style } : { style, children } };
}

/** The comparison glyphs and their ASCII digraphs, written as words. */
export const words = (s) => String(s == null ? '' : s).replace(new RegExp(`${GT}|>=`, 'g'), 'at least').replace(new RegExp(`${LT}|<=`, 'g'), 'at most');

// Characters the font subset hold: printable ASCII, Latin-1 (without the soft hyphen), curly quotes, en and em dash, bullet.
const IN_SUBSET = /[ -~\u00a0-\u00ac\u00ae-\u00ff\u2013\u2014\u2018\u2019\u201c\u201d\u2022]/;
const SWAP = { '\u0153': 'oe', '\u0152': 'OE', '\u0142': 'l', '\u0141': 'L', '\u0111': 'd', '\u0110': 'D', '\u0131': 'i', '\u0294': "'", '\u02bb': "'", '\u2026': '...' };

/** Text the card fonts can draw: kept as it is when every character is in the subsets, else the nearest base letters; a character with no
 *  base letter is dropped. Never throws, never asks for a fallback font. */
export function fit(s) {
  let out = '';
  for (const ch of String(s == null ? '' : s).normalize('NFC')) {
    if (IN_SUBSET.test(ch)) { out += ch; continue; }
    if (SWAP[ch] !== undefined) { out += SWAP[ch]; continue; }
    const base = ch.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    if (base && [...base].every((c) => IN_SUBSET.test(c))) out += base;
  }
  return out.replace(/\s+/g, ' ').trim();
}

const isStr = (s) => typeof s === 'string' && s.trim() !== '';
const mainName = (name) => String(name).split(' (')[0];
const stop = (s) => String(s).trim().replace(/[.\s]+$/, '');

// ---- per-region facts for the region card ------------------------------------------------------------------------------
// The territory line is reciprocity[id].territoryShort when the entry is verified and carries no human-review flag, and is absent
// otherwise (the rule of lib/salutation.js for a verified entry). It is never clipped: it is at most nine words (BIO-2).
// The ecoregion subline is lib/bio.js ecoSubline(id): "IN THE <ECOREGION>", ASCII only, at most 44 characters, null otherwise.
export function ecoSublineOf(id, data = bioregions) {
  const b = data[id];
  if (!b) return null;
  const first = Array.isArray(b.ecoregions) && b.ecoregions[0] && b.ecoregions[0].name;
  const name = isStr(first) ? first : (isStr(b.primaryEcoregion) ? b.primaryEcoregion : '');
  if (!name) return null;
  const s = `IN THE ${name.toUpperCase()}`;
  if (!/^[\x20-\x7e]+$/.test(s) || s.length > 44) return null;
  return s;
}

export function territoryOf(id, data = reciprocity) {
  const rc = data[id];
  const verified = !!(rc && typeof rc === 'object' && rc.status === 'verified' && !rc.flag && isStr(rc.territoryShort));
  const contested = !!(verified && rc.contested && typeof rc.contested === 'object' && !rc.contested.flag);
  return { text: verified ? rc.territoryShort.trim() : '', contested };
}

function waterOf(id) {
  const b = bioregions[id];
  const w = b && b.watershed;
  if (!w || !isStr(w.major)) return null;
  return { major: stop(w.major), drainsTo: isStr(w.drainsTo) ? stop(w.drainsTo) : '' };
}

/** What regionCard needs for one region, or null for an unknown id. */
export function regionFacts(id) {
  const r = regions.find((x) => x.id === id);
  if (!r) return null;
  const t = territoryOf(id);
  return { id, name: r.name, country: r.country, accent: r.accent, territory: t.text, contested: t.contested, eco: ecoSublineOf(id), water: waterOf(id) };
}

// ---- drawing -----------------------------------------------------------------------------------------------------------
function bar(color) {
  // the old card's accent bar: 120 x 10, flat
  return h('div', { width: 120, height: 10, backgroundColor: color });
}
const caps = (text, color, size = 20) => h('div', { display: 'flex', fontFamily: 'Spectral', fontWeight: 500, fontSize: size, letterSpacing: 3.2, color, textTransform: 'uppercase' }, fit(text));

/** ?region=<id>: whose land first, the name, the ecoregion, and the watershed, on one sheet with a seam. No cost, no score. */
export function regionCard(f) {
  const name = fit(mainName(f.name)), n = name.length;
  // The largest size that keeps the name on one line (the width of a Spectral character is about 0.44 em at this tracking, the
  // column is 660 px); a name that cannot fit on one line is set at 72 px (up to 34 characters) or 60 px on two lines, so the
  // name block never grows into the footer.
  const size = [104, 88, 72].find((s) => n * 0.44 * s <= 660) || (n <= 30 ? 72 : n <= 60 ? 52 : 38);
  const label = f.contested ? 'Whose land - contested' : 'Whose land';
  const w = f.water;
  const wsize = w && w.major.length > 60 ? 28 : 33;
  return h('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: C.PAPER, color: C.INK, fontFamily: 'Spectral' }, [
    h('div', { width: 770, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px 46px' }, [
      h('div', { display: 'flex', flexDirection: 'column' }, [
        bar(f.accent || C.ACCENT),
        // the salutation leads: the territory line is first in reading order, the caps label sits above it (column-reverse)
        f.territory
          ? h('div', { display: 'flex', flexDirection: 'column-reverse', marginTop: 34 }, [
            h('div', { display: 'flex', marginTop: 8, fontFamily: 'Spectral', fontSize: 44, lineHeight: 1.15, color: C.HOST, maxWidth: 640 }, fit(f.territory)),
            caps(label, C.HOST),
          ])
          : null,
        h('div', { display: 'flex', marginTop: f.territory ? 26 : 40, fontFamily: 'Spectral', fontSize: size, lineHeight: 0.98, letterSpacing: -1, maxWidth: 660 }, name),
        h('div', { display: 'flex', marginTop: 20 }, caps(f.country || '', C.INK3, 22)),
        // one line, only when the name is ASCII and at most 44 characters (omitted, never truncated, so the card never reflows)
        f.eco ? h('div', { display: 'flex', marginTop: 10 }, caps(f.eco, C.RIVER, 19)) : null,
      ].filter(Boolean)),
      h('div', { display: 'flex', alignItems: 'center' }, [
        caps('Land Selection Framework', C.ACCENT, 19),
        h('div', { display: 'flex', fontSize: 20, color: C.INK3, marginLeft: 14 }, '\u00b7 a bioregioning tool'),
      ]),
    ]),
    h('div', { width: 1, height: H, display: 'flex', backgroundColor: C.RULE }),
    h('div', { width: 428, height: H, display: 'flex', flexDirection: 'column', padding: '56px 40px', backgroundColor: C.WASH }, [
      w ? caps('The watershed', C.ACCENT) : null,
      w ? h('div', { display: 'flex', marginTop: 16, fontFamily: 'Spectral', fontSize: wsize, lineHeight: 1.26, color: C.INK }, fit(w.major)) : null,
      w && w.drainsTo && w.drainsTo.length <= 60 ? h('div', { display: 'flex', marginTop: 14, fontSize: 22, lineHeight: 1.3, color: C.INK3 }, fit(`Drains to ${w.drainsTo}`)) : null,
    ].filter(Boolean)),
  ]);
}

/** The brand card (no filters) and its `?page=deeper` variant: a kicker, a two-line title, one italic line, the domain. */
export function homeCard(o = {}) {
  const line1 = o.line1 || 'Land Selection';
  const line2 = o.line2 || 'Framework';
  const sub = o.sub || 'for communities seeking to belong to a place, and help it flourish over fifty to a hundred years';
  const size = o.size || 104;
  const kicker = o.kicker || (o.total ? `A bioregioning tool \u00b7 ${o.total} regions` : 'A bioregioning tool');
  return h('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: C.PAPER, color: C.INK, fontFamily: 'Spectral', overflow: 'hidden' }, [
    h('div', { width: 820, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px 46px', position: 'relative' }, [
      h('div', { display: 'flex', flexDirection: 'column' }, [
        bar(C.ACCENT),
        h('div', { display: 'flex', marginTop: 34 }, caps(kicker, C.ACCENT)),
        h('div', { display: 'flex', marginTop: 18, fontFamily: 'Spectral', fontSize: size, lineHeight: 0.96, letterSpacing: -2.5 }, fit(line1)),
        h('div', { display: 'flex', fontFamily: 'Spectral', fontSize: size, lineHeight: 0.96, letterSpacing: -2.5 }, fit(line2)),
        h('div', { display: 'flex', marginTop: 28, fontFamily: 'Spectral', fontSize: 32, lineHeight: 1.3, color: C.INK2, maxWidth: 900 }, fit(sub)),
      ]),
      h('div', { display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.RULE}`, paddingTop: 16, fontSize: 21, color: C.INK3, width: 1088 }, [
        h('div', { display: 'flex' }, DOMAIN),
        h('div', { display: 'flex' }, 'filters, never scores'),
      ]),
    ]),
  ]);
}

export const DEEPER = {
  kicker: 'A bioregioning tool \u00b7 in depth',
  line1: 'The framework,',
  line2: 'in depth.',
  sub: 'the method, the case studies, the open design questions, and the sources behind every value',
  size: 100,
};

/** ?t.* / ?q.* / ?c= : "N of M regions within your thresholds": region chips, a filter sentence in words, the empty state's
 *  "Loosen a threshold to read more places." Plain words only. `o.matching` keeps the slate's order (declaration order). */
export function filteredCard(o) {
  const { matching, total, summaries = [], place = '' } = o;
  const chip = (r) => h('div', { display: 'flex', alignItems: 'center', border: `1px solid ${C.RULE}`, backgroundColor: C.SHEET, padding: '8px 18px', marginRight: 12, marginBottom: 12, fontSize: 27, color: C.INK }, [
    h('div', { width: 16, height: 16, borderRadius: 8, backgroundColor: r.accent || C.ACCENT, marginRight: 11 }),
    fit(r.short || mainName(r.name)),
  ]);
  const shown = matching.slice(0, 6), more = matching.length - shown.length;
  const said = summaries.map((s) => fit(words(s)));
  const sum = said.slice(0, 3).join('   \u00b7   ') + (said.length > 3 ? `   \u00b7   and ${said.length - 3} more` : '');
  return h('div', { width: W, height: H, display: 'flex', position: 'relative', backgroundColor: C.PAPER, color: C.INK, fontFamily: 'Spectral', overflow: 'hidden' }, [
    h('div', { width: W, height: H, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '52px 56px 46px', position: 'relative' }, [
      h('div', { display: 'flex', flexDirection: 'column' }, [
        bar(C.ACCENT),
        h('div', { display: 'flex', marginTop: 30 }, caps(place ? `Land Selection Framework \u00b7 ${place}` : 'Land Selection Framework', C.ACCENT)),
        h('div', { display: 'flex', marginTop: 16, fontFamily: 'Spectral', fontSize: 84, lineHeight: 1.0, letterSpacing: -1.5, maxWidth: 1000 }, matching.length === 0 ? 'No regions within these thresholds' : `${matching.length} of ${total} regions within your thresholds`),
        matching.length === 0
          ? h('div', { display: 'flex', marginTop: 28, fontFamily: 'Spectral', fontSize: 34, color: C.INK2 }, 'Loosen a threshold to read more places.')
          : h('div', { display: 'flex', flexWrap: 'wrap', marginTop: 30, maxWidth: 1000 }, [...shown.map(chip), ...(more > 0 ? [h('div', { display: 'flex', fontSize: 27, color: C.INK3, padding: '8px 4px' }, `+${more} more`)] : [])]),
      ]),
      h('div', { display: 'flex', flexDirection: 'column' }, [
        h('div', { display: 'flex', fontSize: 23, color: C.INK3, marginBottom: 14, maxWidth: 980 }, sum || 'Drag any threshold. The framework filters; it never scores.'),
        h('div', { display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${C.RULE}`, paddingTop: 16, fontSize: 21, color: C.INK3, width: 1088 }, [
          h('div', { display: 'flex' }, DOMAIN),
          h('div', { display: 'flex' }, 'filters, never scores'),
        ]),
      ]),
    ]),
  ]);
}

// ---- routing -----------------------------------------------------------------------------------------------------------
const PLACE_NAMES = { europe: 'Europe', 'north-america': 'North America' };
const placeName = (c) => PLACE_NAMES[c] || String(c || '').replace(/-/g, ' ').replace(/^./, (m) => m.toUpperCase());

// Qualitative filters (?q.*) need the slim v1 lookup, which the edge bundle does not carry (see the bundle note at the top). A link
// that chooses one is therefore never counted: the card falls back to the brand card instead of showing a number that would
// disagree with the page. A caller that has the lookup passes opts.qualFilters = qualFiltersFor(v1Lookup) and gets real counts.
export function hasUnappliedQual(searchParams, applied = []) {
  if (applied.length) return false;
  return qualFiltersFor({}).some((qf) => {
    const v = searchParams.get(`q.${qf.id}`);
    return !!v && v !== 'any' && qf.options.includes(v);
  });
}

/** The card for a query string: { kind: 'region' | 'deeper' | 'home' | 'filtered' | 'empty', tree, result? }. */
export function cardFor(searchParams, opts = {}) {
  const regionId = searchParams.get('region');
  if (regionId) {
    const f = regionFacts(regionId);
    if (f) return { kind: 'region', tree: regionCard(f), region: f };
  }
  if (searchParams.get('page') === 'deeper') return { kind: 'deeper', tree: homeCard(DEEPER) };
  const qualFilters = opts.qualFilters || [];
  const res = computeResult(searchParams, undefined, qualFilters);
  if (!res.anyActive || hasUnappliedQual(searchParams, qualFilters)) return { kind: 'home', tree: homeCard({ total: regions.length }), result: res };
  const place = placeName(resolveQuery(searchParams, undefined, qualFilters).continent);
  const tree = filteredCard({ matching: res.matching, total: res.total, summaries: res.summaries, place });
  return { kind: res.matching.length === 0 ? 'empty' : 'filtered', tree, result: res };
}

/** Every text node of an element tree, in reading order (the harness's --dump-text and the tests read this). */
export function textNodes(tree) {
  const out = [];
  const walk = (n) => {
    if (n == null || n === false) return;
    if (typeof n === 'string') { out.push(n); return; }
    if (typeof n === 'number') { out.push(String(n)); return; }
    if (Array.isArray(n)) { n.forEach(walk); return; }
    if (n.props) walk(n.props.children);
  };
  walk(tree);
  return out;
}
