// The DOM side of shareable state: reading ?t.* ?pin= ?q.* ?c= on load and writing them back with replaceState.
// Parsing and building the query string are pure and live in lib/url-state.js.
//
// Other modules never call this one. They emit bus events that initUrlSync() subscribes to:
//   filters:change { source, immediate }   immediate true writes the URL now, otherwise after a 400 ms debounce
//   continent:change { continent }         the tab changed: the URL says so now (setContinent has set state.continent)
//   url:flush                               writes now if a debounced write has been scheduled (share buttons)
//
// A write keeps every parameter this build does not own (modal=1, utm_*, ...) and the #hash: it passes the current
// location.search to buildSearch as the base.

import { state, filterData } from '../state.js';
import { on } from '../bus.js';
import { CONTINENTS } from '../config/continents.js';
import { parseState, buildSearch } from '../../lib/url-state.js';

// The URL carries only non-default thresholds (`?t.climate=15&t.water_stress=0.3`)
// so shared links stay clean and a bare URL stays bare.

// Reads ?t.*, ?pin=, ?q.* and ?c= into the state. Parsing and validation live in lib/url-state.js (unknown ids and
// out-of-range or out-of-enum values are skipped silently). The continent is the explicit ?c=, else the continent of the
// first pinned region (a link made before ?c= existed, such as ?pin=<a North America region>, opens that tab).
export function applyURLState() {
  const parsed = parseState(window.location.search, filterData);
  Object.assign(state.thresholds, parsed.thresholds);
  parsed.shortlist.forEach((id) => state.shortlist.add(id));
  Object.assign(state.qualFilters, parsed.qualFilters);
  if (parsed.continent && CONTINENTS[parsed.continent]) state.continent = parsed.continent;
}

let _urlWriteTimer = null;

// Writes the FULL shareable state: non-default thresholds (`t.<id>`), the pinned shortlist (`pin=id,id`), the
// qualitative filters and, when a link without it would open elsewhere, the continent (`c=`). Named for thresholds for
// history reasons, but it owns the whole query string so a slider move never drops the shortlist and vice-versa.
export function writeThresholdsToURL() {
  // replaceState, sliders should NOT pollute browser history
  const { pathname, search, hash } = window.location;
  window.history.replaceState(null, '', pathname + buildSearch(state, filterData, search) + hash);
}

export function scheduleURLWrite() {
  if (_urlWriteTimer) clearTimeout(_urlWriteTimer);
  _urlWriteTimer = setTimeout(writeThresholdsToURL, 400);
}

// Cancels any pending debounce and writes now (reset, presets, qualitative filters, pins, continent).
export function writeURLNow() {
  if (_urlWriteTimer) { clearTimeout(_urlWriteTimer); _urlWriteTimer = null; }
  writeThresholdsToURL();
}

// Flushes a pending debounced write so a copied link carries the latest state. Does nothing when no slider
// has moved yet.
export function flushURLWrite() {
  if (_urlWriteTimer) {
    clearTimeout(_urlWriteTimer);
    _urlWriteTimer = null;
    writeThresholdsToURL();
  }
}

export function initUrlSync() {
  on('filters:change', (payload) => {
    if (payload && payload.immediate) writeURLNow();
    else scheduleURLWrite();
  });
  on('continent:change', writeURLNow);
  on('url:flush', flushURLWrite);
}
