// The base map: the raster ground under every overlay, its dark pair, and the failover when its tiles do not arrive.
//
// Provider. Esri Canvas "World Light Gray" (Base + Reference) is primary. It is keyless, answers with CORS "*", and is
// 10 to 50 times lighter per tile than a vector style (a base tile is 5 to 19 KB). Its tile service is free to use
// with the provider's attribution on the map; Esri's own production guidance prefers an API key, so the failover is
// one line away (BASEMAP_PROVIDER in config/flags.js, or the automatic failover below). The previous CARTO tiles now
// answer 200 with a "key required" watermark, which is why this module exists.
//
// The ground is warm, not cold grey: a token-coloured background layer (--paper) shows through the base raster, which
// is drawn slightly translucent, and the raster itself is desaturated and nudged warm. Colours come from the page's
// tokens (resolved with getComputedStyle, since the tokens are light-dark() values), at init and whenever the theme
// changes. The dark pair (World Dark Gray) is used when the page is dark. The light-only gate (styles/theme-gate.css) is
// lifted (MC-A11Y), so the page follows the OS colour scheme; were the gate ever restored to `color-scheme: light`, the page
// would be light whatever the OS prefers. Dark uses raster-brightness-max .7, never a CSS invert.
//
// Layer order: ground, base, then (added by layers.js realise) the data overlays, then the labels raster on top, so
// overlays sit above the base and below the place names. `raiseLabels(map)` restores that after every realise.
//
// Failover: if 3 or more base tile errors arrive and no base tile has loaded within 8 seconds, the style is swapped
// for OpenFreeMap positron (fetched only then). It logs once and never throws.

import { emit } from '../bus.js';
import { BASEMAP_PROVIDER, BASEMAP_LABELS_MINZOOM } from '../config/flags.js';

const ESRI = 'https://services.arcgisonline.com/ArcGIS/rest/services/Canvas';
const ESRI_ATTRIBUTION = 'Esri, HERE, Garmin, © OpenStreetMap contributors, and the GIS user community';
const ESRI_MAXZOOM = 16;

const OFM_STYLE_URL = 'https://tiles.openfreemap.org/styles/positron';
const OFM_ATTRIBUTION =
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>';

export const FAILOVER_ERRORS = 3;
export const FAILOVER_WINDOW_MS = 8000;

export const GROUND_ID = 'basemap-ground';
export const BASE_ID = 'base';
export const LABELS_ID = 'basemap-labels';
const BASE_SOURCE = 'basemap';
const LABELS_SOURCE = 'basemap-ref';

// Raster tuning. The light pair lands warm: a little desaturation, a hue nudge, a touch less contrast, and 88% opacity
// over the --paper ground. The dark pair is dimmed with brightness-max rather than inverted.
const TUNING = {
  light: { opacity: 0.88, saturation: -0.3, hueRotate: 12, contrast: -0.05, brightnessMax: 1 },
  dark: { opacity: 0.92, saturation: -0.2, hueRotate: 0, contrast: 0, brightnessMax: 0.7 },
};

let current = 'esri-light';       // 'esri-light' | 'esri-dark' | 'openfreemap'
let failedOver = false;

export function currentBasemap() {
  return current;
}

// --------------------------------------------------------------------------------------------------- theme + tokens
// True when the page is dark: an explicit data-theme wins; otherwise the OS preference counts only while the page's
// computed color-scheme allows dark (the theme gate pins it to light).
export function themeIsDark() {
  try {
    const root = document.documentElement;
    const forced = root.getAttribute('data-theme');
    if (forced === 'dark') return true;
    if (forced === 'light') return false;
    const scheme = getComputedStyle(root).colorScheme || '';
    if (!/\bdark\b/.test(scheme)) return false;
    return !!(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  } catch (e) {
    return false;
  }
}

// A token's resolved colour as an rgb() string. getPropertyValue would return the raw light-dark(...) text, which
// MapLibre cannot parse, so the token is read through a probe element's computed colour.
function tokenColour(name, fallback) {
  try {
    const probe = document.createElement('i');
    probe.style.cssText = 'position:absolute;width:0;height:0;visibility:hidden;color:var(' + name + ')';
    document.documentElement.appendChild(probe);
    const colour = getComputedStyle(probe).color;
    probe.remove();
    return /^rgba?\(/.test(colour) ? colour : fallback;
  } catch (e) {
    return fallback;
  }
}

function groundColour(dark) {
  return tokenColour('--paper', dark ? '#17140f' : '#f6f2eb');
}

// -------------------------------------------------------------------------------------------------------- the style
function esriTiles(service) {
  return [`${ESRI}/${service}/MapServer/tile/{z}/{y}/{x}`];
}

// The Esri style for a theme. Returns a fresh object each call (MapLibre may keep a reference to what it is given).
// opts.dark picks the dark pair (default: the page's theme); opts.labelsMinZoom overrides the flag (used by the probe).
export function basemapStyle(opts) {
  const o = opts || {};
  const dark = o.dark === undefined ? themeIsDark() : !!o.dark;
  const labelsMinZoom = o.labelsMinZoom === undefined ? BASEMAP_LABELS_MINZOOM : o.labelsMinZoom;
  const t = dark ? TUNING.dark : TUNING.light;
  const base = dark ? 'World_Dark_Gray_Base' : 'World_Light_Gray_Base';
  const ref = dark ? 'World_Dark_Gray_Reference' : 'World_Light_Gray_Reference';
  const layers = [
    { id: GROUND_ID, type: 'background', paint: { 'background-color': groundColour(dark) } },
    {
      id: BASE_ID, type: 'raster', source: BASE_SOURCE,
      paint: {
        'raster-opacity': t.opacity,
        'raster-saturation': t.saturation,
        'raster-hue-rotate': t.hueRotate,
        'raster-contrast': t.contrast,
        'raster-brightness-max': t.brightnessMax,
        'raster-fade-duration': 150,
      },
    },
  ];
  const sources = {
    [BASE_SOURCE]: {
      type: 'raster', tiles: esriTiles(base), tileSize: 256, maxzoom: ESRI_MAXZOOM, attribution: ESRI_ATTRIBUTION,
    },
  };
  if (labelsMinZoom !== null && labelsMinZoom !== false) {
    sources[LABELS_SOURCE] = { type: 'raster', tiles: esriTiles(ref), tileSize: 256, maxzoom: ESRI_MAXZOOM };
    layers.push({
      id: LABELS_ID, type: 'raster', source: LABELS_SOURCE, minzoom: labelsMinZoom,
      paint: { 'raster-opacity': 1, 'raster-fade-duration': 150 },
    });
  }
  return { version: 8, sources, layers };
}

// What the map is constructed with: the Esri style for the page's theme, or (BASEMAP_PROVIDER = 'openfreemap') a bare
// ground that attachBasemap replaces with the OpenFreeMap style at once.
export function initialStyle() {
  if (BASEMAP_PROVIDER === 'openfreemap') {
    return { version: 8, sources: {}, layers: [{ id: GROUND_ID, type: 'background', paint: { 'background-color': groundColour(themeIsDark()) } }] };
  }
  const dark = themeIsDark();
  current = dark ? 'esri-dark' : 'esri-light';
  mark();
  return basemapStyle({ dark });
}

function mark() {
  try { document.documentElement.setAttribute('data-basemap', current); } catch (e) { /* no document */ }
}

// ------------------------------------------------------------------------------------------------------ the labels
export function basemapLabelsId(map) {
  try { return map.getLayer(LABELS_ID) ? LABELS_ID : undefined; } catch (e) { return undefined; }
}

// Puts the place-name raster back on top of everything layers.js added after it. A no-op on a style without it.
export function raiseLabels(map) {
  try {
    if (map.getLayer(LABELS_ID)) map.moveLayer(LABELS_ID);
  } catch (err) {
    console.error('basemap: could not raise the label layer:', err);
  }
}

// ------------------------------------------------------------------------------------------ swapping the whole style
let swapToken = 0;

// Replaces the style (diff:false: the old and new styles share no layers worth diffing) and, once the new one has
// loaded, tells the map code with the bus event 'map:style' (map.js re-adds the data layers with realise, then raises the
// labels and lets the extensions re-add theirs).
function swapStyle(map, style, reason) {
  const token = ++swapToken;
  try {
    map.once('style.load', () => {
      if (token === swapToken) emit('map:style', { reason, basemap: current });
    });
    map.setStyle(style, { diff: false });
  } catch (err) {
    console.error('basemap: setStyle failed:', err);
  }
}

// ---------------------------------------------------------------------------------------------------------- failover
async function openFreeMapStyle() {
  const res = await fetch(OFM_STYLE_URL, { mode: 'cors' });
  if (!res.ok) throw new Error('OpenFreeMap style answered ' + res.status);
  const style = await res.json();
  const dark = themeIsDark();
  const ground = groundColour(dark);
  const water = tokenColour('--river-wash', dark ? '#1b2a31' : '#e4ebeb');
  Object.keys(style.sources || {}).forEach((id) => {
    if (!style.sources[id].attribution) style.sources[id].attribution = OFM_ATTRIBUTION;
  });
  // Warm it from the tokens: a failover must not look like a different site.
  (style.layers || []).forEach((l) => {
    if (l.id === 'background') { l.paint = { ...(l.paint || {}), 'background-color': ground }; }
    if (l.id === 'water' && l.type === 'fill') { l.paint = { ...(l.paint || {}), 'fill-color': water }; }
  });
  return style;
}

let loggedFailover = false;

// Swaps to OpenFreeMap positron. Idempotent, logs once, never throws. Returns a promise that resolves either way.
export function failoverToOpenFreeMap(map, reason) {
  if (failedOver) return Promise.resolve(false);
  failedOver = true;
  if (!loggedFailover) {
    loggedFailover = true;
    console.info('basemap: ' + (reason || 'Esri tiles unavailable') + '; switching to OpenFreeMap (positron).');
  }
  return openFreeMapStyle().then((style) => {
    current = 'openfreemap';
    mark();
    swapStyle(map, style, 'failover');
    return true;
  }).catch((err) => {
    // Both providers are down: keep the warm ground, which still frames the markers and the overlays. No retry loop.
    console.info('basemap: OpenFreeMap did not load either (' + (err && err.message ? err.message : err) + '); the map keeps its plain ground.');
    return false;
  });
}

// ------------------------------------------------------------------------------------------------------- the watcher
// Starts watching one map: tile errors from the base source feed the failover rule, a theme change swaps the Esri
// pair. Returns { dispose() }.
export function attachBasemap(map) {
  failedOver = false;               // a fresh map (after disposeMap) gets a fresh chance at Esri
  let errors = 0;
  let loaded = false;
  let armedAt = Date.now();

  const arm = () => { errors = 0; loaded = false; armedAt = Date.now(); };

  const onError = (e) => {
    try {
      if (failedOver || current === 'openfreemap' || loaded) return;
      if (!e || e.sourceId !== BASE_SOURCE) return;
      if (Date.now() - armedAt > FAILOVER_WINDOW_MS) return;
      errors += 1;
      if (errors >= FAILOVER_ERRORS) failoverToOpenFreeMap(map, errors + ' Esri tile errors and no tile loaded');
    } catch (err) { /* never throw from a map event */ }
  };
  const onSourceData = (e) => {
    try {
      if (e && e.sourceId === BASE_SOURCE && e.tile && e.tile.state === 'loaded') loaded = true;
    } catch (err) { /* never throw from a map event */ }
  };
  map.on('error', onError);
  map.on('sourcedata', onSourceData);

  // The theme: a prefers-color-scheme change, or an explicit data-theme flip, swaps the Esri pair when the page's
  // darkness actually changed (so a change the gate ignores costs nothing).
  const apply = () => {
    try {
      if (current === 'openfreemap') return;
      const next = themeIsDark() ? 'esri-dark' : 'esri-light';
      if (next === current) return;
      current = next;
      mark();
      arm();
      swapStyle(map, basemapStyle({ dark: next === 'esri-dark' }), 'theme');
    } catch (err) { console.error('basemap: theme switch failed:', err); }
  };
  let mql = null;
  try {
    mql = window.matchMedia('(prefers-color-scheme: dark)');
    if (mql.addEventListener) mql.addEventListener('change', apply);
  } catch (e) { mql = null; }
  let observer = null;
  try {
    observer = new MutationObserver(apply);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  } catch (e) { observer = null; }

  if (BASEMAP_PROVIDER === 'openfreemap') failoverToOpenFreeMap(map, 'BASEMAP_PROVIDER is openfreemap');

  return {
    dispose() {
      try { map.off('error', onError); map.off('sourcedata', onSourceData); } catch (e) { /* map already removed */ }
      try { if (mql && mql.removeEventListener) mql.removeEventListener('change', apply); } catch (e) { /* ignore */ }
      if (observer) observer.disconnect();
    },
  };
}
