// The layer engine: turns the registry (config/map-layers.js) into MapLibre sources and style layers, applies a
// layer's visibility, loads GeoJSON only when a layer is first shown, and holds the extension layers merged on top of
// the core list.
//
// `realise(map)` is idempotent: it adds only the sources and layers the style is missing, in registry order (which is
// the z-order). Raster, fill and heat layers go in below the basemap's label layer when it has one, so place names stay
// readable above the data; the ecovillage points stay on top. The panel and the legend read the same merged list through
// `panelGroups()` / `panelLayers()` / `legendLayers()`, so a layer an extension adds shows up in both without either
// file knowing about it.
//
// GeoJSON is lazy. Only the ecovillage points (lazy: false) are handed to MapLibre as a URL when the source is added; the
// other layers' sources start empty and their file for the active continent is fetched on the layer's FIRST toggle.
// On a continent switch only sources that are already added are touched: a visible lazy layer or the eager points load
// the new continent's file, a hidden one waits for its next toggle, and a layer with no clip for that continent is
// cleared, so one continent's data is never left under the other.
//
// Layer health (health.js, loaded on the first realise as its own chunk so it never lengthens the module chain) watches
// tile errors and tile successes per source and puts a quiet note on a layer's row when its service is slow or down.

import { state, runtime } from '../state.js';
import { on, emit } from '../bus.js';
import { MAP_LAYERS, MAP_GROUPS, STACK_OPACITY_CAP } from '../config/map-layers.js';

let extensions = [];
let extGroups = [];
let extLayers = [];
const toggleListeners = [];

// Run-time bookkeeping. `dataRec` is per geojson source: which continent's data it holds (or is loading) and a token that
// lets a late fetch notice it was superseded. `legendModels` holds the legends built from loaded files (Koppen).
const dataRec = new Map();
const legendModels = new Map();
const legendFiles = new Map();
const wired = new WeakSet();
let continentSubscribed = false;
let healthApi = null;
let healthPromise = null;

// The data property that carries a Koppen-Geiger class code in the processed files (EV-KOPPEN-MAP).
export const KOPPEN_PROP = 'k';
export const KOPPEN_FALLBACK_COLOR = '#b2b2b2';

export const emptyFC = () => ({ type: 'FeatureCollection', features: [] });

// Stored once at boot (main.js) before the panel renders. Every extension layer gets a visibility key in
// state.mapLayers (its defaultOn) unless one is already there.
export function registerExtensions(list) {
  extensions = list.slice();
  extGroups = [];
  extLayers = [];
  extensions.forEach((ext) => {
    (ext.groups || []).forEach((g) => extGroups.push(g));
    (ext.layers || []).forEach((l) => {
      extLayers.push(l);
      if (!(l.id in state.mapLayers)) state.mapLayers[l.id] = !!l.defaultOn;
    });
  });
}

export function getExtensions() {
  return extensions;
}

// Panel groups in reading order: extension groups with a lower `order` come first. Stable for equal orders.
export function panelGroups() {
  return [...MAP_GROUPS, ...extGroups]
    .map((g, i) => ({ g, i }))
    .sort((a, b) => (a.g.order - b.g.order) || (a.i - b.i))
    .map((x) => x.g);
}

// Every toggle-able layer (core, then extension) in panel order: by group order, then position in the panel.
export function panelLayers(groupKey) {
  const order = new Map(panelGroups().map((g, i) => [g.key, i]));
  return [...MAP_LAYERS, ...extLayers]
    .map((l, i) => ({ l, i }))
    .filter((x) => groupKey === undefined || x.l.group === groupKey)
    .sort((a, b) => (order.get(a.l.group) - order.get(b.l.group)) || ((a.l.panel ?? 1000 + a.i) - (b.l.panel ?? 1000 + b.i)))
    .map((x) => x.l);
}

// The layers that have a legend row, in panel order.
export function legendLayers() {
  return panelLayers().filter((l) => l.legend);
}

// A listener hears every visibility change: fn(id, on). Returns the unsubscribe function.
export function onToggle(fn) {
  toggleListeners.push(fn);
  return () => {
    const i = toggleListeners.indexOf(fn);
    if (i >= 0) toggleListeners.splice(i, 1);
  };
}

// ----------------------------------------------------------------------------------------------- legends

// The Koppen legend for one loaded file: only the classes present in it, in the legend file's order, grouped by letter
// (A tropical to E polar). `lf` is data/processed/koppen-legend.json, `present` the class codes found in the data.
export function buildGroupedLegend(lf, present) {
  const index = new Map(lf.classes.map((c, i) => [c.code, i]));
  const codes = [...new Set(present)].filter((k) => index.has(k)).sort((a, b) => index.get(a) - index.get(b));
  const groups = Object.keys(lf.groups)
    .map((key) => ({
      key,
      label: lf.groups[key],
      classes: codes.map((k) => lf.classes[index.get(k)]).filter((c) => c.group === key)
        .map((c) => ({ code: c.code, label: c.name, color: c.hex })),
    }))
    .filter((g) => g.classes.length);
  return {
    kind: 'grouped', label: lf.title, title: lf.title, groups, classCount: codes.length,
    note: lf.caveat, attribution: lf.attribution,
  };
}

// The class codes a loaded Koppen file contains.
export function koppenCodesIn(geojson) {
  return ((geojson && geojson.features) || []).map((f) => f && f.properties && f.properties[KOPPEN_PROP]).filter(Boolean);
}

// The fill colour expression for a Koppen layer: the legend file's own colour per class code.
export function koppenFillExpression(lf) {
  const expr = ['match', ['get', KOPPEN_PROP]];
  lf.classes.forEach((c) => { expr.push(c.code, c.hex); });
  expr.push(KOPPEN_FALLBACK_COLOR);
  return expr;
}

// The legend model for a layer (core or extension). Static for most layers; for the 'grouped' Koppen layers it is the
// classes in the loaded file, or { pending: true, groups: [] } until the layer's data has loaded.
export function legendModel(id) {
  const entry = MAP_LAYERS.find((l) => l.id === id) || extLayers.find((l) => l.id === id);
  if (!entry || !entry.legend) return null;
  if (entry.legend.kind === 'grouped') return legendModels.get(id) || { ...entry.legend, groups: [], classCount: 0, pending: true };
  return entry.legend;
}

// ------------------------------------------------------------------------------------- style layers

function styleLayerId(entry, i) {
  return (entry.layers[i] && entry.layers[i].id) || (i === 0 ? entry.id : `${entry.id}-${i}`);
}

// The MapLibre source spec a registry entry starts with. A geojson entry's `data` is the active continent's file for the
// eager layer (MapLibre fetches it) and an empty collection for a lazy one (layers.js fetches it on the first toggle). A
// continent with no clip starts empty either way.
export function initialSourceSpec(entry, continent = state.continent) {
  const src = { ...entry.source };
  if (src.tiles) src.tiles = [...src.tiles];
  if (entry.urls) src.data = !entry.lazy && entry.urls[continent] ? entry.urls[continent] : emptyFC();
  return src;
}

function paintSpec(entry, def) {
  const paint = { ...def.paint };
  // Cap opacity so two stacked surfaces blend (the lower one shows through) rather than the top one painting fully
  // opaque over everything below.
  if (entry.capOpacity && typeof paint['raster-opacity'] === 'number') {
    paint['raster-opacity'] = Math.min(paint['raster-opacity'], STACK_OPACITY_CAP);
  }
  return paint;
}

// The id of the first label layer of the basemap, or undefined when it has none. The basemap module may name it with a
// layer metadata flag ('lsf:labels': true); otherwise the first symbol layer, or the first layer whose id says labels or
// reference, counts. A raster basemap with its labels baked in has none and the overlays simply go on top, as always.
export function firstLabelId(map) {
  let layers = [];
  try {
    const style = map.getStyle();
    layers = (style && style.layers) || [];
  } catch (err) {
    return undefined;
  }
  const ours = new Set(MAP_LAYERS.map((l) => l.id));
  const flagged = layers.find((l) => l.metadata && l.metadata['lsf:labels']);
  if (flagged) return flagged.id;
  const sym = layers.find((l) => l.type === 'symbol' && !ours.has(l.id));
  if (sym) return sym.id;
  const named = layers.find((l) => !ours.has(l.id) && /label|reference/i.test(l.id));
  return named ? named.id : undefined;
}

// Adds every core layer the style does not have yet, in registry order. Safe to call again (after a style swap too).
export function realise(map) {
  const before = firstLabelId(map);
  let readded = false;
  MAP_LAYERS.forEach((entry) => {
    if (!map.getSource(entry.id)) {
      map.addSource(entry.id, initialSourceSpec(entry));
      if (entry.urls) {
        // A fresh source holds only what initialSourceSpec gave it.
        dataRec.delete(entry.id);
        if (!entry.lazy && entry.urls[state.continent]) dataRec.set(entry.id, { for: state.continent, token: 1, failed: false });
      }
      readded = true;
    }
    entry.layers.forEach((def, i) => {
      const id = styleLayerId(entry, i);
      if (map.getLayer(id)) return;
      const layer = {
        id, source: entry.id, type: def.type,
        layout: { ...(def.layout || {}), visibility: state.mapLayers[entry.id] ? 'visible' : 'none' },
        paint: paintSpec(entry, def),
      };
      // Points stay above the labels; everything else sits under them.
      if (before && def.type !== 'circle' && map.getLayer(before)) map.addLayer(layer, before);
      else map.addLayer(layer);
    });
  });
  wire(map);
  // Layers that are already switched on (a restored state, or a style swap) need their data and their health watch now.
  MAP_LAYERS.forEach((entry) => {
    if (state.mapLayers[entry.id] && entry.urls) ensureData(map, entry);
  });
  if (readded && healthApi) healthApi.reset();
}

// Once per map: the continent subscription (module level, one for the page) and the health chunk.
function wire(map) {
  if (!continentSubscribed) {
    continentSubscribed = true;
    on('continent:change', ({ continent: c }) => syncContinent(runtime.mapInstance, c));
  }
  if (wired.has(map)) return;
  wired.add(map);
  healthPromise = import('./health.js').then((mod) => {
    healthApi = mod.attachHealth(map, {
      entries: MAP_LAYERS,
      isOn: (id) => !!state.mapLayers[id],
      // A lazy geojson layer is judged by our own fetch, not by tile events: has its file for this continent arrived?
      dataLoaded: (id) => {
        const rec = dataRec.get(id);
        return !!(rec && rec.loaded && rec.for === state.continent && !rec.failed);
      },
    });
    return healthApi;
  }).catch(() => null);
}

// Resolves with the health controller once its chunk has loaded (null when it could not).
export function healthReady() {
  return healthPromise || Promise.resolve(null);
}

// The state of a layer's service: { state: 'idle' | 'loading' | 'ok' | 'slow' | 'unavailable', errors, successes }.
export function layerHealth(id) {
  return healthApi ? healthApi.status(id) : { state: 'idle', errors: 0, successes: 0 };
}

// ------------------------------------------------------------------------------------------ geojson data

async function fetchJson(url, ms = 20000) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), ms) : null;
  try {
    const res = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

function legendFile(url) {
  if (!legendFiles.has(url)) {
    const p = fetchJson(url);
    legendFiles.set(url, p);
    p.catch(() => legendFiles.delete(url));
  }
  return legendFiles.get(url);
}

function fillLayerIds(entry) {
  return entry.layers.map((def, i) => (def.type === 'fill' ? styleLayerId(entry, i) : null)).filter(Boolean);
}

// Loads the continent's file into the layer's source, or clears it when the continent has no clip.
function loadData(map, entry, continent) {
  const src = map.getSource(entry.id);
  if (!src) return;
  const prev = dataRec.get(entry.id);
  const rec = { for: continent, token: (prev ? prev.token : 0) + 1, failed: false };
  dataRec.set(entry.id, rec);
  const url = entry.urls && entry.urls[continent];
  if (!url) {
    src.setData(emptyFC());
    legendModels.delete(entry.id);
    emit('map:legend', { id: entry.id });
    rec.loaded = true;
    if (healthApi) healthApi.settle(entry.id);
    return;
  }
  if (!entry.lazy) {
    src.setData(url);
    return;
  }
  // A lazy layer: our own fetch, so a failure or a hang is known and can reach the row's note.
  if (healthApi) healthApi.restart(entry.id);
  const grouped = entry.legend && entry.legend.kind === 'grouped' && entry.legend.url;
  Promise.all([fetchJson(url), grouped ? legendFile(grouped) : null]).then(([data, lf]) => {
    if (dataRec.get(entry.id) !== rec) return;
    const target = map.getSource(entry.id);
    if (!target) return;
    if (lf) {
      fillLayerIds(entry).forEach((lid) => {
        if (map.getLayer(lid)) map.setPaintProperty(lid, 'fill-color', koppenFillExpression(lf));
      });
      legendModels.set(entry.id, buildGroupedLegend(lf, koppenCodesIn(data)));
      emit('map:legend', { id: entry.id });
    }
    target.setData(data);
    rec.loaded = true;
    if (healthApi) healthApi.succeed(entry.id);
  }).catch(() => {
    if (dataRec.get(entry.id) !== rec) return;
    rec.failed = true;
    if (healthApi) healthApi.fail(entry.id);
  });
}

// Makes sure a geojson layer holds the active continent's data. A no-op once it does (and did not fail).
function ensureData(map, entry) {
  if (!entry.urls || !map.getSource(entry.id)) return;
  const rec = dataRec.get(entry.id);
  if (rec && rec.for === state.continent && !rec.failed) return;
  loadData(map, entry, state.continent);
}

// The continent changed: touch only the sources that were already added (see the header).
export function syncContinent(map, continent) {
  if (!map) return;
  MAP_LAYERS.forEach((entry) => {
    if (!entry.urls || !map.getSource(entry.id)) return;
    if (!entry.urls[continent]) { loadData(map, entry, continent); return; }
    if (entry.lazy && !state.mapLayers[entry.id]) return;
    loadData(map, entry, continent);
  });
}

// Pushes state.mapLayers[id] into the style, then tells the listeners.
export function applyVisibility(id) {
  const map = runtime.mapInstance;
  const on = !!state.mapLayers[id];
  const entry = MAP_LAYERS.find((l) => l.id === id);
  if (map) {
    // Data first (a lazy file starts loading on the first toggle), then the visibility.
    if (on && entry) ensureData(map, entry);
    const ids = entry ? entry.layers.map((_, i) => styleLayerId(entry, i)) : [id];
    ids.forEach((lid) => {
      if (map.getLayer(lid)) map.setLayoutProperty(lid, 'visibility', on ? 'visible' : 'none');
    });
    if (healthApi && entry) healthApi.layerChanged(id, on);
  }
  toggleListeners.slice().forEach((fn) => {
    try { fn(id, on); } catch (err) { console.error('map toggle listener failed:', err); }
  });
}

// Test hook: forgets everything run-time (data records, legends, the health chunk). Not used by the page.
export function resetLayerEngineForTests() {
  const pending = healthPromise;
  if (healthApi && healthApi.dispose) healthApi.dispose();
  // A chunk still loading would attach (and start its clock) after this reset: stop that one too.
  if (pending) pending.then((api) => { if (api && api.dispose) api.dispose(); });
  dataRec.clear();
  legendModels.clear();
  legendFiles.clear();
  healthApi = null;
  healthPromise = null;
}
