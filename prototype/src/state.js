// The visitor's view state, and the non-serialisable runtime handles.
//
// `state` is everything a shared link can carry plus the live pass/fail map. It is plain data.
// `runtime` holds live objects (the map, the marker elements) and cross-module hooks; it is never
// serialised, never put in the URL, and never read by lib/.
//
// `filterData` is the bundle lib/filters.js and lib/url-state.js take as their `data` argument:
//   filterData = { regions, values, criteria, qualFilters }

import { regions, values, criteria } from './data.js';
import { QUAL_FILTERS } from './config/qual-filters.js';
import { DEFAULT_CONTINENT } from './config/continents.js';
import { MAP_LAYERS } from './config/map-layers.js';
import { thresholdDefault } from '../lib/filters.js';

export const filterData = { regions, values, criteria, qualFilters: QUAL_FILTERS };

export const state = {
  continent: DEFAULT_CONTINENT,
  thresholds: Object.fromEntries(
    criteria.map((c) => [c.id, thresholdDefault(c)])
  ),
  passing: Object.fromEntries(regions.map((r) => [r.id, true])),
  // Region ids the visitor has pinned. A membership Set, never ranked, never scored.
  // Persisted to the URL as ?pin=id,id so a shortlist is shareable like thresholds.
  shortlist: new Set(),
  // Qualitative per-jurisdiction filters (r4 V1 layers). 'any' = no filter.
  // Persisted as ?q.<field>=<value> alongside the other URL state.
  qualFilters: Object.fromEntries(QUAL_FILTERS.map((qf) => [qf.id, 'any'])),
  // Layer visibility, keyed by layer id. The defaults are the registry's defaultOn (config/map-layers.js); extension
  // layers add their own key when they register (map/layers.js).
  mapLayers: Object.fromEntries(MAP_LAYERS.map((l) => [l.id, !!l.defaultOn])),
};

// Live handles. regionMarkers maps a region id to its marker element (an object keyed by id, as before).
// hooks lets one module reach another without importing it, e.g. hooks.updateMarkers is set by the map
// code and called by the refresh code.
export const runtime = {
  mapInstance: null,
  regionMarkers: {},
  hooks: {},
};
