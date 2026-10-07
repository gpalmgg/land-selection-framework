// The bioregions extension: where the land sits ecologically, drawn quietly under the data. Ecoregion boundaries (dashed,
// shared borders only, never a coastline), a faint tint by biome, the ecoregion names as DOM labels, and optional major
// rivers. All of it is DESCRIPTIVE CONTEXT: never scored, never a filter, no popup, no hover state (the drawer carries the
// words). Source: RESOLVE Ecoregions 2017 (Dinerstein et al., CC BY 4.0), simplified and clipped; Natural Earth rivers.
//
// Two panel rows (group "Place", first in the panel): "Bioregions" (default on: tint, boundaries and labels together) and
// "Major rivers" (default off). Both are context layers (role 'context'), not counted among the data layers.
//
// The shape is the extension manifest in src/map/extensions.js. Nothing here touches toggles.js, legend.js, layers.js or
// map.js: the registry merge, the panel row and the legend row come from the manifest alone, and the extension reaches
// the map only through the `ctx` it is handed.
//
// Lifecycle
//   * init(ctx) runs once after the map's FIRST idle, never at page load. Until then nothing is fetched.
//   * Turning "Bioregions" on fetches three files for the active continent (tint, boundaries, label list) in parallel,
//     once per continent: they are kept in memory, so a second toggle or a return to the continent costs no request.
//     "Major rivers" fetches one file per continent, on its first toggle.
//   * Turning a row off REMOVES its style layers and sources (and the labels leave the DOM), so nothing is left behind;
//     turning it on again re-adds them from memory.
//   * A continent switch re-sources at once: the previous continent's shapes never sit under the new one.
//   * A style swap (theme or basemap failover) re-adds everything from memory, with no request.
//   * A failed file is silent: the map goes on, the row says so in words, and the next toggle tries again.
//
// Z-order: above the imagery and the data rasters, below every other vector data layer (Koppen fills, water stress, water
// depletion, the conflict heat, the ecovillage points) and below the basemap's place names. Within the extension: tint,
// minor rivers, major rivers, boundaries.
//
// Labels are DOM markers (the map style has no glyph endpoint, so symbol text cannot render). They are handed to
// src/map/labels.js through ctx.labelProvider; it places them after the region pills, hides the non-core ones below zoom
// 5 and all of them on a narrow stage. They are aria-hidden: the same names are in the drawer.
//
// Imports are foundation modules only (state-free): the map folder's chain depth rule keeps this file a leaf.

import { bioregionSources } from '../data.js';
import { emit } from '../bus.js';
import { MAP_LAYERS } from '../config/map-layers.js';

const ID_BIO = 'bioregions';
const ID_RIVERS = 'rivers';

// Source and style-layer ids. The ids are part of the extension's contract with the tests and the style dump.
const SRC_FILL = 'bioregion-fill';
const SRC_BORDERS = 'bioregion-borders';
const SRC_RIVERS = 'rivers';
const L_FILL = 'bioregion-fill';
const L_BORDERS = 'bioregion-borders';
const L_RIVERS = 'rivers';
const L_RIVERS_MINOR = 'rivers-minor';

// Bottom to top. A layer is added directly under the first of the LATER layers that exists, else under the anchor.
const ORDER = [L_FILL, L_RIVERS_MINOR, L_RIVERS, L_BORDERS];

const DIR = 'data/processed/';
const LABELS_URL = DIR + 'bioregion-labels.json';
const FILES = {
  'europe': { fill: DIR + 'bioregions-europe.geojson', borders: DIR + 'bioregion-borders-europe.geojson', rivers: DIR + 'rivers-europe.geojson' },
  'north-america': { fill: DIR + 'bioregions-na.geojson', borders: DIR + 'bioregion-borders-na.geojson', rivers: DIR + 'rivers-na.geojson' },
};

const FETCH_MS = 20000;
const RIVER_MAJOR_MAX = 7;          // Natural Earth scalerank: 7 and below is a major river; the rest show from zoom 5
const RIVER_MINOR_ZOOM = 5;
const TINT_OPACITY = 0.12;          // the tint is a hint, never a surface (design maximum 0.14)
const NOTE_FAILED = 'This layer could not be loaded. The map keeps working.';

const EMPTY = Object.freeze({ type: 'FeatureCollection', features: [] });

// Biome number (RESOLVE BIOME_NUM, the keys of biomeNames) to a muted earth, green or blue-grey. Light and dark pairs.
// A biome that is not listed falls back to a neutral earth.
const PALETTE = {
  light: { 1: '#4f8a5a', 2: '#8a9a4f', 3: '#4f8a7a', 4: '#6f9a5a', 5: '#3f7a6a', 6: '#6b8fa0', 8: '#c2a45a', 12: '#c0804f', 13: '#d0b080', 14: '#4f9a8a', other: '#a09784' },
  dark:  { 1: '#7fc08a', 2: '#b5c47a', 3: '#7fc0aa', 4: '#9ac484', 5: '#76b09c', 6: '#9ab9c8', 8: '#dcc07c', 12: '#dca07a', 13: '#e2c8a0', 14: '#7ec4b4', other: '#b8ad98' },
};
const RIVER_FALLBACK = { light: '#2c5f7c', dark: '#7fb4cf' };

// ---------------------------------------------------------------------------------------------------- source words
// The panel's "source · vintage · licence" lines come from the project's own source record (data/bioregions.js, reached
// through src/data.js), so the words are written once. The fallbacks are the same words for a build without that record.
const eco = (bioregionSources && bioregionSources.ecoregions) || {};
const riv = (bioregionSources && bioregionSources.rivers) || {};
const short = (v, fb) => (typeof v === 'string' && v.trim() ? v.replace(/\s*\(.*$/, '').trim() : fb);
const ECO_SOURCE = eco.name || 'RESOLVE Ecoregions 2017';
const ECO_VINTAGE = short(eco.vintage, '2017');
const ECO_LICENCE = `${eco.license || 'CC BY 4.0'}, simplified and clipped`;
const RIV_SOURCE = 'Natural Earth rivers';
const RIV_VINTAGE = short(riv.vintage, 'v5.x');
const RIV_LICENCE = riv.license || 'public domain';

// ---------------------------------------------------------------------------------------------------- the manifest
const groups = [{ key: 'place', label: 'Place', order: 0 }];

const layers = [
  {
    id: ID_BIO, group: 'place', label: 'Bioregions', defaultOn: true, role: 'context', color: 'var(--river)',
    sourceLine: {
      source: ECO_SOURCE, vintage: ECO_VINTAGE, licenseText: ECO_LICENCE,
      text: `${ECO_SOURCE} (Dinerstein et al.) · ${ECO_VINTAGE} · ${ECO_LICENCE}`,
    },
    legend: {
      kind: 'dash', label: 'Ecoregion boundaries', color: 'var(--river)',
      note: 'The faint tint follows the biome. Descriptive context, never scored, never a filter.',
    },
  },
  {
    id: ID_RIVERS, group: 'place', label: 'Major rivers', defaultOn: false, role: 'context', color: 'var(--river)',
    sourceLine: {
      source: RIV_SOURCE, vintage: RIV_VINTAGE, licenseText: RIV_LICENCE,
      text: `${RIV_SOURCE} · ${RIV_VINTAGE} · ${RIV_LICENCE}`,
    },
    legend: { kind: 'line', label: 'Major rivers', color: 'var(--river)' },
  },
];

// ------------------------------------------------------------------------------------------------------- run state
let ctx = null;
let unToggle = null;
const recs = new Map();       // continent id -> { bio: {state, data}, rivers: {state, data}, items }
const fed = new Map();        // source id -> the data object the source currently holds

function rec(c) {
  let r = recs.get(c);
  if (!r) {
    r = { bio: { state: 'idle', data: null }, rivers: { state: 'idle', data: null }, items: null };
    recs.set(c, r);
  }
  return r;
}

// ------------------------------------------------------------------------------------------------------- helpers
async function fetchJson(url) {
  const ctl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), FETCH_MS) : null;
  try {
    const res = await fetch(url, ctl ? { signal: ctl.signal } : undefined);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    if (timer) clearTimeout(timer);
  }
}

// The page is dark when data-theme says so, or when the OS asks for dark AND the page's computed colour scheme allows it
// (the light-only gate pins that to light). Same rule as the basemap's.
function isDark() {
  try {
    const root = document.documentElement;
    const forced = root.getAttribute('data-theme');
    if (forced === 'dark') return true;
    if (forced === 'light') return false;
    const scheme = getComputedStyle(root).colorScheme || '';
    if (!/\bdark\b/.test(scheme)) return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (err) {
    return false;
  }
}

// A token's resolved colour as an rgb() string (MapLibre cannot parse the raw light-dark() text of a token).
function tokenColour(name, fallback) {
  try {
    const probe = document.createElement('i');
    probe.style.cssText = `position:absolute;width:0;height:0;visibility:hidden;color:var(${name})`;
    document.documentElement.appendChild(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return /^rgba?\(/.test(colour) ? colour : fallback;
  } catch (err) {
    return fallback;
  }
}

function fillColour(dark) {
  const p = PALETTE[dark ? 'dark' : 'light'];
  const expr = ['match', ['get', 'b']];
  Object.keys(p).filter((k) => k !== 'other').forEach((k) => { expr.push(Number(k), p[k]); });
  expr.push(p.other);
  return expr;
}

// The id of the first vector data layer of the core registry that the style has: the extension sits just under it, so it
// is above every raster and below every vector overlay. Falls back to the basemap's label layer, else the top.
function anchorId(map) {
  for (const e of MAP_LAYERS) {
    const first = e.layers && e.layers[0];
    if (first && first.type !== 'raster' && map.getLayer(e.id)) return e.id;
  }
  try { return ctx.beforeLabelsId(); } catch (err) { return undefined; }
}

function beforeFor(map, id) {
  const later = ORDER.slice(ORDER.indexOf(id) + 1);
  const hit = later.find((l) => map.getLayer(l));
  return hit || anchorId(map);
}

function layerSpecs(dark) {
  const river = tokenColour('--river', RIVER_FALLBACK[dark ? 'dark' : 'light']);
  const riverPaint = { 'line-color': river, 'line-width': 0.8, 'line-opacity': 0.5 };
  const riverLayout = { 'line-join': 'round', 'line-cap': 'round' };
  return {
    [L_FILL]: {
      id: L_FILL, type: 'fill', source: SRC_FILL,
      paint: { 'fill-color': fillColour(dark), 'fill-opacity': TINT_OPACITY, 'fill-outline-color': 'rgba(0,0,0,0)' },
    },
    [L_RIVERS_MINOR]: {
      id: L_RIVERS_MINOR, type: 'line', source: SRC_RIVERS, minzoom: RIVER_MINOR_ZOOM,
      filter: ['>', ['get', 'r'], RIVER_MAJOR_MAX], layout: riverLayout, paint: riverPaint,
    },
    [L_RIVERS]: {
      id: L_RIVERS, type: 'line', source: SRC_RIVERS,
      filter: ['<=', ['get', 'r'], RIVER_MAJOR_MAX], layout: riverLayout, paint: riverPaint,
    },
    [L_BORDERS]: {
      id: L_BORDERS, type: 'line', source: SRC_BORDERS, layout: { 'line-cap': 'butt', 'line-join': 'round' },
      paint: {
        'line-color': river, 'line-opacity': 0.7, 'line-dasharray': [3, 2],
        'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 8, 1.8],
      },
    },
  };
}

function addSource(map, id, attribution) {
  if (map.getSource(id)) return;
  map.addSource(id, { type: 'geojson', data: EMPTY, attribution });
  fed.set(id, EMPTY);
}

function addLayers(map, ids) {
  const specs = layerSpecs(isDark());
  ids.forEach((id) => { if (!map.getLayer(id)) map.addLayer(specs[id], beforeFor(map, id)); });
}

function removeAll(map, layerIds, sourceIds) {
  layerIds.forEach((id) => { if (map.getLayer(id)) map.removeLayer(id); });
  sourceIds.forEach((id) => { if (map.getSource(id)) map.removeSource(id); fed.delete(id); });
}

// Gives a source the data it should hold. A no-op when it already holds exactly that object.
function feed(map, id, data) {
  const want = data || EMPTY;
  if (fed.get(id) === want) return;
  const src = map.getSource(id);
  if (!src) return;
  src.setData(want);
  fed.set(id, want);
}

// ---------------------------------------------------------------------------------------------- the panel row note
// A quiet line after a row's button when its file could not be loaded (health.js notes belong to the core rows).
function setNote(id, text) {
  if (typeof document === 'undefined') return;
  const noteId = `map-layer-note-${id}`;
  const btn = document.querySelector(`#map-toggles button.map-toggle[data-layer-id="${id}"]`);
  let el = document.getElementById(noteId);
  if (!text) {
    if (el) el.remove();
    if (btn) {
      const t = (btn.getAttribute('aria-describedby') || '').split(/\s+/).filter((x) => x && x !== noteId);
      if (t.length) btn.setAttribute('aria-describedby', t.join(' ')); else btn.removeAttribute('aria-describedby');
    }
    return;
  }
  if (!btn) return;
  if (!el) {
    el = document.createElement('p');
    el.id = noteId;
    el.className = 'map-layer-note';
    el.setAttribute('data-layer-note', id);
  }
  if (el.previousElementSibling !== btn) btn.insertAdjacentElement('afterend', el);
  el.textContent = text;
  const t = (btn.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
  if (!t.includes(noteId)) t.push(noteId);
  btn.setAttribute('aria-describedby', t.join(' '));
}

// ----------------------------------------------------------------------------------------------------- the labels
// One element per ecoregion label per continent, built once and reused, so the label layer never churns the DOM.
function labelItems(c) {
  const r = rec(c);
  if (r.items) return r.items;
  const list = (r.bio.data && r.bio.data.labels) || [];
  r.items = list.filter((l) => l && Array.isArray(l.lp) && l.n).map((l) => {
    const el = document.createElement('span');
    el.className = 'bio-label';
    el.textContent = l.n;
    el.dataset.continent = c;
    el.dataset.core = l.core ? '1' : '0';
    el.setAttribute('aria-hidden', 'true');
    return { el, lngLat: l.lp, priority: 2, kind: 'bio', core: !!l.core };
  });
  return r.items;
}

// What labels.js asks for on every placement pass: the active continent's labels while "Bioregions" is on and loaded.
function provide() {
  if (!ctx || !ctx.isOn(ID_BIO)) return [];
  const c = ctx.getContinent();
  const r = recs.get(c);
  if (!r || r.bio.state !== 'ok') return [];
  return labelItems(c);
}

// ----------------------------------------------------------------------------------------------------- the loading
function loadBio(c) {
  const r = rec(c).bio;
  if (r.state === 'loading' || r.state === 'ok') return;
  const f = FILES[c];
  if (!f) { r.state = 'ok'; r.data = { fill: EMPTY, borders: EMPTY, labels: [] }; return; }
  r.state = 'loading';
  Promise.all([fetchJson(f.fill), fetchJson(f.borders), fetchJson(LABELS_URL)])
    .then(([fill, borders, labels]) => {
      r.data = { fill, borders, labels: labels && Array.isArray(labels[c]) ? labels[c] : [] };
      r.state = 'ok';
    })
    .catch(() => { r.state = 'failed'; })
    .then(() => loaded(c));
}

function loadRivers(c) {
  const r = rec(c).rivers;
  if (r.state === 'loading' || r.state === 'ok') return;
  const f = FILES[c];
  if (!f) { r.state = 'ok'; r.data = EMPTY; return; }
  r.state = 'loading';
  fetchJson(f.rivers)
    .then((data) => { r.data = data; r.state = 'ok'; })
    .catch(() => { r.state = 'failed'; })
    .then(() => loaded(c));
}

// A file arrived (or failed). Only the active continent touches the map; the others are simply kept.
function loaded(c) {
  if (!ctx || ctx.getContinent() !== c) return;
  sync();
  emit('markers:updated');      // the labels are placed again, now that they exist
}

// ----------------------------------------------------------------------------------------------------- the sync
// Brings the style in line with the toggles, the active continent and what has been loaded. Idempotent.
function sync() {
  if (!ctx) return;
  const map = ctx.map;
  const c = ctx.getContinent();
  const r = rec(c);

  if (ctx.isOn(ID_BIO)) {
    addSource(map, SRC_FILL, `${ECO_SOURCE} (CC BY 4.0), simplified`);
    addSource(map, SRC_BORDERS, `${ECO_SOURCE} (CC BY 4.0), simplified`);
    feed(map, SRC_FILL, r.bio.state === 'ok' ? r.bio.data.fill : EMPTY);
    feed(map, SRC_BORDERS, r.bio.state === 'ok' ? r.bio.data.borders : EMPTY);
    addLayers(map, [L_FILL, L_BORDERS]);
    setNote(ID_BIO, r.bio.state === 'failed' ? NOTE_FAILED : null);
  } else {
    removeAll(map, [L_FILL, L_BORDERS], [SRC_FILL, SRC_BORDERS]);
    setNote(ID_BIO, null);
  }

  if (ctx.isOn(ID_RIVERS)) {
    addSource(map, SRC_RIVERS, 'Natural Earth');
    feed(map, SRC_RIVERS, r.rivers.state === 'ok' ? r.rivers.data : EMPTY);
    addLayers(map, [L_RIVERS_MINOR, L_RIVERS]);
    setNote(ID_RIVERS, r.rivers.state === 'failed' ? NOTE_FAILED : null);
  } else {
    removeAll(map, [L_RIVERS_MINOR, L_RIVERS], [SRC_RIVERS]);
    setNote(ID_RIVERS, null);
  }
}

// What the active continent needs that is not in memory yet, for the rows that are on.
function load() {
  const c = ctx.getContinent();
  if (ctx.isOn(ID_BIO)) loadBio(c);
  if (ctx.isOn(ID_RIVERS)) loadRivers(c);
}

function onToggle(id, on) {
  if (!ctx || (id !== ID_BIO && id !== ID_RIVERS)) return;
  if (on) {
    // A file that failed earlier is tried again on the next toggle.
    const r = rec(ctx.getContinent());
    if (id === ID_BIO && r.bio.state === 'failed') r.bio.state = 'idle';
    if (id === ID_RIVERS && r.rivers.state === 'failed') r.rivers.state = 'idle';
    load();
  }
  sync();
}

// -------------------------------------------------------------------------------------------------- the extension
export default {
  id: 'bioregions',
  groups,
  layers,

  // Once, after the map's first idle.
  init(c) {
    ctx = c;
    ctx.labelProvider(provide);
    unToggle = ctx.onToggle(onToggle);
    load();
    sync();
  },

  // The active continent changed: show its shapes now (or nothing until they arrive), fetch what is missing.
  onContinent(c) {
    if (!ctx) ctx = c;
    load();
    sync();
  },

  // The style was replaced: the sources and layers are gone; put them back from memory.
  onTheme(c) {
    if (!ctx) ctx = c;
    fed.clear();
    load();
    sync();
  },

  dispose() {
    if (unToggle) unToggle();
    unToggle = null;
    if (ctx) {
      try { removeAll(ctx.map, [L_FILL, L_BORDERS, L_RIVERS_MINOR, L_RIVERS], [SRC_FILL, SRC_BORDERS, SRC_RIVERS]); } catch (err) { /* the map is already gone */ }
    }
    setNote(ID_BIO, null);
    setNote(ID_RIVERS, null);
    recs.clear();
    fed.clear();
    ctx = null;
  },
};
