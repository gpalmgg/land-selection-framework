// The map: creates the MapLibre instance, adds the registry's layers and the region markers once the style has
// loaded, and runs the extensions. It is the only module that talks to the map library; everything else in this
// folder is called from here or from main.js.

import { state, runtime } from '../state.js';
import { on } from '../bus.js';
import { CONTINENTS } from '../config/continents.js';
import { LAZY_MAP } from '../config/flags.js';
import { initialStyle, attachBasemap, raiseLabels, basemapLabelsId } from './basemap.js';
import { ensureMapLibre } from './loader.js';
import { showMapFallback } from './fallback.js';
import { realise, getExtensions, onToggle } from './layers.js';
import { createMarkers } from './markers.js';

// Counts the per-source tile errors that are deliberately swallowed, so a later health panel can read them.
const health = { errors: 0 };
const labelProviders = [];
let extCtx = null;
let extStarted = false;
let basemap = null;

// The functions extensions registered with ctx.labelProvider(fn); each returns [{ el, lngLat, priority, kind }].
export function getLabelProviders() {
  return labelProviders.slice();
}

function makeContext(map, lib) {
  return {
    map,
    maplibregl: lib,
    health,
    getContinent: () => state.continent,
    isOn: (id) => !!state.mapLayers[id],
    onToggle: (fn) => onToggle(fn),
    // The id of the layer an extension should draw underneath, so its layer sits below the place names: the basemap's
    // label raster when it has one, else the first symbol layer (the OpenFreeMap failover style has those).
    beforeLabelsId: () => {
      const raster = basemapLabelsId(map);
      if (raster) return raster;
      const style = map.getStyle();
      const sym = style && style.layers ? style.layers.find((l) => l.type === 'symbol') : null;
      return sym ? sym.id : undefined;
    },
    labelProvider: (fn) => { labelProviders.push(fn); },
    // Resolved at call time: the layer panel creates #map-ext-slot, possibly after this runs. Null until then.
    getSlot: () => document.getElementById('map-ext-slot'),
  };
}

// An extension that throws must never break the map or the other extensions.
function eachExtension(fn) {
  getExtensions().forEach((ext) => {
    try { fn(ext); } catch (err) { console.error(`map extension "${ext.id}" failed:`, err); }
  });
}

function startExtensions(map, lib) {
  if (extStarted) return;
  extStarted = true;
  extCtx = makeContext(map, lib);
  eachExtension((ext) => { if (ext.init) ext.init(extCtx); });
}

function start(lib) {
  const map = new lib.Map({
    container: 'map',
    style: initialStyle(),
    center: CONTINENTS[state.continent].center,
    zoom: CONTINENTS[state.continent].zoom,
    minZoom: CONTINENTS[state.continent].minZoom,
    maxZoom: CONTINENTS[state.continent].maxZoom,
  });
  runtime.mapInstance = map;
  basemap = attachBasemap(map);

  map.addControl(new lib.NavigationControl({ showCompass: false }), 'top-right');

  // Hardening: a single tile/source failure (a WMS momentarily down, a rotated
  // token) must never break the map or spam the console. Swallow per-source tile
  // errors quietly; the rest of the map and every other layer keep working.
  map.on('error', (e) => {
    if (e && (e.sourceId || (e.error && /tile|source/i.test(String(e.error.message))))) { health.errors += 1; return; }
  });

  map.on('load', () => {
    realise(map);
    raiseLabels(map);
    createMarkers(map, lib);
    // Extensions start after the first idle, never at page load.
    map.once('idle', () => startExtensions(map, lib));
  });

  // After the core map half (continent.js subscribed first), tell each extension to re-source for the continent.
  on('continent:change', ({ continent: c }) => {
    if (extCtx) eachExtension((ext) => { if (ext.onContinent) ext.onContinent(extCtx, c); });
  });

  // The style was replaced (a theme switch or a basemap failover; basemap.js emits this on style.load): re-add the
  // layers, put the place-name raster back on top, then let extensions re-add theirs.
  on('map:style', () => {
    realise(map);
    raiseLabels(map);
    if (extCtx) eachExtension((ext) => { if (ext.onTheme) ext.onTheme(extCtx); });
  });
}

export function initMap() {
  if (!document.getElementById('map')) { showMapFallback(); return; }
  // The library is normally already on the page (a classic script), so start straight away. Otherwise, or when the
  // flag asks for lazy loading, ensureMapLibre() requests it (10 s timeout) and shows the fallback if it never arrives.
  if (!LAZY_MAP && typeof maplibregl !== 'undefined') { start(maplibregl); return; }
  ensureMapLibre().then((lib) => {
    if (!lib) { showMapFallback(); return; }
    start(lib);
  }).catch((err) => { console.error('Map init failed:', err); showMapFallback(); });
}

// Removes the map and lets every extension clean up.
export function disposeMap() {
  eachExtension((ext) => { if (ext.dispose) ext.dispose(); });
  extCtx = null;
  extStarted = false;
  if (basemap) basemap.dispose();
  basemap = null;
  if (runtime.mapInstance) runtime.mapInstance.remove();
  runtime.mapInstance = null;
}
