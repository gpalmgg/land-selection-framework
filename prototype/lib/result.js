// Shared, runtime-agnostic logic for turning a shared URL's query string into a
// concrete result: which regions pass the encoded thresholds, and a human
// summary of those thresholds. Imported by BOTH edge functions (api/og,
// api/share). The passing rule is the SAME code the page uses (lib/filters.js), so the share card and the
// page cannot drift: filtering, never scoring or ranking. The matching list is returned in declaration order.
//
// Query encoding (written by buildSearch in lib/url-state.js, which parses it for the page):
//   ?t.<criterionId>=<number>   e.g. ?t.water_stress=0.3&t.solar_pv=1500
//   ?q.<filterId>=<enum value>  the four qualitative filters, e.g. ?q.foreign_ownership=yes
//   ?pin=<id>,<id>              the visitor's shortlist (membership, never ranked)
//   ?c=<continent>              the continent tab; without it a link opens the continent of its first pinned region
//
// This file imports only lib/* and data/regions.js, and has no top-level await and no dynamic import: Vercel compiles
// the edge functions' ES modules to CommonJS with Babel, which cannot carry a top-level await. The qualitative filters
// need the slim client lookup (data/v1-lookup.js), so the caller passes the filter definitions in:
//
//   import { v1Lookup } from '../data/v1-lookup.js';
//   import { qualFiltersFor } from '../lib/url-state.js';
//   computeResult(url.searchParams, undefined, qualFiltersFor(v1Lookup));
//
// Without them only the numeric filters apply (the behaviour of the first release). tests/core/url-state.test.mjs checks
// that with them the count equals the page's regionPasses over 200 random states including q.*.

import { regions, values, criteria } from '../data/regions.js';
import { thresholdDirection, thresholdDefault, clampThreshold, regionPasses } from './filters.js';

const direction = thresholdDirection;
const defaultThreshold = thresholdDefault;
const clamp = clampThreshold;

function fmtNum(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return v.toLocaleString('en-US');
  return v.toFixed(Math.abs(v) < 10 ? 2 : 0).replace(/\.?0+$/, '');
}

// Reads a query into the state the page would hold: { continent, thresholds, qualFilters, pins }. `qualFilters` (the
// third argument) is the list of { id, options, pick } definitions, as in lib/filters.js; [] means numeric filters only.
//   continent: a valid `c` wins; else the caller's `continent` argument (when given); else the continent of the first pinned region;
//              else 'europe'. (Mirrors resolveContinent in lib/url-state.js; the tests compare the two.)
//   Unknown ids, bad numbers and out-of-enum values are skipped, as the page skips them.
export function resolveQuery(searchParams, continent, qualFilters = []) {
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));

  const thresholds = Object.fromEntries(criteria.map((c) => [c.id, defaultThreshold(c)]));
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('t.')) continue;
    const c = byId[key.slice(2)];
    if (!c) continue;
    const n = parseFloat(value);
    if (Number.isFinite(n)) thresholds[c.id] = clamp(c, n);
  }

  // Only the filters the caller defined; an out-of-enum value is skipped, as the page skips it.
  const chosen = Object.fromEntries(qualFilters.map((qf) => [qf.id, 'any']));
  for (const qf of qualFilters) {
    const val = searchParams.get(`q.${qf.id}`);
    if (val && qf.options.includes(val)) chosen[qf.id] = val;
  }

  const knownIds = new Set(regions.map((r) => r.id));
  const pins = (searchParams.get('pin') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((id) => knownIds.has(id));

  const present = new Set(regions.map((r) => r.continent));
  const asked = (searchParams.get('c') || '').trim().toLowerCase();
  let resolved;
  if (asked && present.has(asked)) resolved = asked;
  else if (continent != null) resolved = continent;
  else {
    const first = pins.length ? regions.find((r) => r.id === pins[0]) : null;
    resolved = first ? first.continent : 'europe';
  }
  return { continent: resolved, thresholds, qualFilters: chosen, pins };
}

// continent (optional): the continent to count in when the query has no valid `c`. Without it a link opens the continent
// of its first pinned region (a legacy ?pin=vermont opens North America), else Europe. The matching set is computed
// against the same continent the page opens on, so the share card shows what the sharer saw on load.
export function computeResult(searchParams, continent, qualFilters = []) {
  const q = resolveQuery(searchParams, continent, qualFilters);
  const { thresholds, pins } = q;
  const filterData = { regions, values, criteria, qualFilters };

  const active = criteria.filter((c) => thresholds[c.id] !== defaultThreshold(c));
  const qualActive = qualFilters.some((qf) => q.qualFilters[qf.id] !== 'any');

  const inView = regions.filter((r) => r.continent === q.continent);
  // The page's own rule (lib/filters.js regionPasses): a cell with no figure is a gap and never removes a region; a
  // chosen qualitative filter needs an exact match.
  const matching = inView.filter((r) => regionPasses(r.id, { thresholds, qualFilters: q.qualFilters }, filterData));

  const summaries = active.map((c) => {
    // The comparison glyphs are written as escapes so the source holds none (the OG text path turns them into words:
    // lib/og-card.js words()); the strings returned are exactly those of the first release.
    const verb = direction(c.higherIs) === 'min' ? '\u2265' : '\u2264';
    return `${c.name} ${verb} ${fmtNum(thresholds[c.id])} ${c.rangeLabel}`;
  });

  return {
    thresholds,
    active,
    matching,            // array of region objects, declaration order
    pins,
    summaries,           // human-readable active-threshold lines
    total: inView.length,
    anyActive: active.length > 0 || qualActive,
  };
}
