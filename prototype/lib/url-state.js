// Pure encode/decode of the shareable view state. Nothing here reads or writes the address bar: the parsers take a
// query string (or URLSearchParams) and return plain values, and buildSearch returns a string. src/ui/url-sync.js
// owns the side that touches the page.
//
// Encoding:
//   ?t.<criterionId>=<number>     only thresholds that differ from their default, clamped to the criterion range
//   ?pin=<id>,<id>                the pinned shortlist, in the order pinned (membership, never a ranking)
//   ?q.<filterId>=<enum value>    only qualitative filters that are not 'any'
//   ?c=<continent>                the continent tab, written only when opening the link would not already land on it
//                                 (see resolveContinent); a link without `c` opens the continent of its first pinned
//                                 region, so links made before `c` existed (?pin=vermont) still open North America
// Any other parameter (modal=1, utm_*, a key a later build adds) is "foreign": buildSearch keeps it, in place.
//
// `data` is { regions, values, criteria, qualFilters } as in lib/filters.js, plus an optional `defaultContinent`
// (default 'europe'). Unknown ids and out-of-enum values are skipped silently so a stale or hand-edited link never throws.

import { thresholdDefault, thresholdStep, clampThreshold } from './filters.js';

const asParams = (search) => (search instanceof URLSearchParams ? search : new URLSearchParams(search || ''));

// { [critId]: number } for every valid ?t.<id>= in the query. Values are clamped to the criterion's range.
export function parseThresholds(search, data) {
  const params = asParams(search);
  const byId = Object.fromEntries(data.criteria.map((c) => [c.id, c]));
  const out = {};
  for (const [key, value] of params.entries()) {
    if (!key.startsWith('t.')) continue;
    const critId = key.slice(2);
    const crit = byId[critId];
    if (!crit) continue;
    const num = parseFloat(value);
    if (!Number.isFinite(num)) continue;
    out[critId] = clampThreshold(crit, num);
  }
  return out;
}

// Region ids from ?pin=id,id that exist in the data, in the order given, without repeats.
export function parseShortlist(search, data) {
  const pin = asParams(search).get('pin');
  if (!pin) return [];
  const known = new Set(data.regions.map((r) => r.id));
  const out = [];
  pin.split(',').map((s) => s.trim()).filter(Boolean).forEach((id) => {
    if (known.has(id) && !out.includes(id)) out.push(id);
  });
  return out;
}

// { [filterId]: value } for every ?q.<id>= whose value is one of that filter's options.
export function parseQual(search, data) {
  const params = asParams(search);
  const out = {};
  for (const qf of data.qualFilters || []) {
    const val = params.get(`q.${qf.id}`);
    if (val && qf.options.includes(val)) out[qf.id] = val;
  }
  return out;
}

// The four qualitative filters (ids and option values of the first release) as { id, options, pick(regionId) }, reading the
// slim client lookup passed in (data/v1-lookup.js's `v1Lookup`). The edge functions use this; the page builds the same list
// in src/config/qual-filters.js, and tests/core/url-state.test.mjs fails when the two drift.
export function qualFiltersFor(v1Lookup) {
  const v1 = v1Lookup || {};
  return [
    { id: 'foreign_ownership', options: ['any', 'yes', 'restricted', 'no'], pick: (rid) => v1.legal_ownership?.[rid]?.foreign_ownership?.allowed },
    { id: 'affordability_band', options: ['any', 'cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'], pick: (rid) => v1.land_cost?.[rid]?.affordability_band },
    { id: 'buffering_strength', options: ['any', 'very_low', 'low', 'moderate', 'high', 'very_high'], pick: (rid) => v1.climate_buffering?.[rid]?.buffering_strength },
    { id: 'regulatory_direction', options: ['any', 'stable', 'tightening', 'loosening', 'volatile'], pick: (rid) => v1.legal_ownership?.[rid]?.regulatory_direction },
  ];
}

// The continents that have at least one region in the data (an id with no regions is never a valid `c`).
export function continentsOf(data) {
  return [...new Set(data.regions.map((r) => r.continent))];
}

// The continent a query names, or null when it names none. An explicit valid `c` wins; otherwise the continent of the
// FIRST pinned region (the back-compat rule for links written before `c` existed); otherwise null.
export function parseContinent(search, data) {
  const params = asParams(search);
  const present = new Set(continentsOf(data));
  const raw = (params.get('c') || '').trim().toLowerCase();
  if (raw && present.has(raw)) return raw;
  const first = parseShortlist(params, data)[0];
  if (first) {
    const r = data.regions.find((x) => x.id === first);
    if (r) return r.continent;
  }
  return null;
}

// The continent a page opens on for this query: parseContinent, else the default.
export function resolveContinent(search, data) {
  return parseContinent(search, data) || data.defaultContinent || 'europe';
}

// All of it at once: { thresholds, shortlist, qualFilters, continent } holding only what the query actually set
// (continent is null when the query names none; the caller then keeps its default).
export function parseState(search, data) {
  return {
    thresholds: parseThresholds(search, data),
    shortlist: parseShortlist(search, data),
    qualFilters: parseQual(search, data),
    continent: parseContinent(search, data),
  };
}

// Does buildSearch write this key? Only the keys of its own encoding for ids it knows; everything else is foreign.
function isOwnedKey(key, data) {
  if (key === 'c' || key === 'pin') return true;
  if (key.startsWith('t.')) return data.criteria.some((c) => c.id === key.slice(2));
  if (key.startsWith('q.')) return (data.qualFilters || []).some((q) => q.id === key.slice(2));
  return false;
}

// The query string for a state: '' when every filter is at its default, nothing is pinned, the continent is the one a
// bare link opens on and `base` has no foreign parameters; otherwise '?...'.
//
// `base` (optional) is the query string the page has now (location.search). Its foreign parameters are kept, in their
// original order and before the parameters written here, so a slider move never drops ?modal=1 or ?utm_source=...
// Parameters of this encoding found in `base` are replaced, never duplicated.
export function buildSearch(state, data, base) {
  const params = new URLSearchParams();
  if (base) {
    for (const [key, value] of asParams(base).entries()) {
      if (!isOwnedKey(key, data)) params.append(key, value);
    }
  }
  for (const crit of data.criteria) {
    const current = state.thresholds[crit.id];
    const def = thresholdDefault(crit);
    if (current !== def) {
      const step = thresholdStep(crit);
      const decimals = step < 1 ? 2 : 0;
      // Trim trailing zeros only in the FRACTIONAL part (0.30 -> 0.3). Never strip
      // an integer's trailing zeros (1600 must not become 16, which would clamp
      // back to the slider floor on reload).
      let s = Number(current).toFixed(decimals);
      if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
      params.set(`t.${crit.id}`, s);
    }
  }
  if (state.shortlist && state.shortlist.size) {
    params.set('pin', [...state.shortlist].join(','));
  }
  // Qualitative filters (only non-'any' written).
  for (const qf of data.qualFilters || []) {
    const v = state.qualFilters && state.qualFilters[qf.id];
    if (v && v !== 'any') params.set(`q.${qf.id}`, v);
  }
  // The continent: written only when a link without `c` would open somewhere else.
  if (state.continent) {
    const without = new URLSearchParams();
    if (params.has('pin')) without.set('pin', params.get('pin'));
    if (resolveContinent(without, data) !== state.continent) params.set('c', state.continent);
  }
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}
