// The camera half of a continent switch (the rest is in ui/continent-switcher.js): fit the active continent's regions
// inside the stage, and keep them fitted. No re-init: the layers persist, and layers.js swaps each per-continent
// GeoJSON on the same bus event.
//
// Fit. `fitBounds` over the active continent's regions, padding 70 (40 on a narrow stage, where 70 on each side would
// leave nothing), `maxZoom 6`. The continent's configured centre and zoom (config/continents.js) are the fallback when
// the library cannot answer, and the configured minZoom is lowered to the fitted zoom when a small stage needs a wider
// view than the continent's default: every marker must be wholly inside the stage, Nova Scotia and the Quebec/Vermont
// pair included, at 1280 and at 390. Under prefers-reduced-motion the camera jumps instead of easing.
//
// The first fit runs when the markers exist (bus `map:markers`, emitted by markers.js), the next when the stage is
// resized and the visitor has not moved the map themselves, and one on every continent change.
//
// This file also starts the label placement (labels.js), because main.js initialises it first and it is the one map
// module main.js already calls at boot.

import { state, runtime } from '../state.js';
import { on } from '../bus.js';
import { regions } from '../data.js';
import { CONTINENTS } from '../config/continents.js';
import { initLabels } from './labels.js';

export const FIT_PADDING = 70;
export const FIT_PADDING_NARROW = 40;
export const FIT_MAX_ZOOM = 6;
const NARROW_STAGE_W = 560;
const EASE_MS = 700;

let userMoved = false;
let bound = null;

function reducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// [[west, south], [east, north]] of the continent's region points, or null when it has none.
export function continentBounds(continent) {
  const pts = regions.filter((r) => r.continent === continent).map((r) => r.coords);
  if (!pts.length) return null;
  const lngs = pts.map((p) => p[0]);
  const lats = pts.map((p) => p[1]);
  return [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]];
}

// The padding for this stage: 70 (40 on a narrow stage), never more than a fifth of the shorter side. The foot gets 20 to 28px
// more, and a narrow stage's right edge 33px more (the 44px zoom buttons), so a marker never sits under the attribution or the zoom buttons.
export function fitPadding(W, H) {
  const narrow = W < NARROW_STAGE_W;
  const base = Math.max(16, Math.min(narrow ? FIT_PADDING_NARROW : FIT_PADDING, Math.floor(Math.min(W, H) * 0.2)));
  return { top: base, left: base, right: base + (narrow ? 33 : 0), bottom: base + (narrow ? 28 : 20) };
}

// { center, zoom } that fits the continent's regions in the stage, or null.
export function fitCamera(map, continent) {
  const bounds = continentBounds(continent);
  if (!bounds || typeof map.cameraForBounds !== 'function') return null;
  const stage = map.getContainer();
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  if (!W || !H) return null;
  // A stage squeezed below the padding it would need (a layout in flight, a hidden panel) cannot be fitted: MapLibre would warn
  // "Map cannot fit within canvas" and the later resize refits it, so skip the fit now.
  // MapLibre fits against its own canvas, which lags the container until its next resize: take the smaller of the two.
  const cv = typeof map.getCanvas === 'function' ? map.getCanvas() : null;
  const cw = cv && cv.clientWidth ? Math.min(W, cv.clientWidth) : W;
  const ch = cv && cv.clientHeight ? Math.min(H, cv.clientHeight) : H;
  const pad = fitPadding(W, H);
  if (cw <= pad.left + pad.right + 24 || ch <= pad.top + pad.bottom + 24) return null;
  let cam = null;
  try {
    cam = map.cameraForBounds(bounds, { padding: fitPadding(W, H), maxZoom: FIT_MAX_ZOOM });
  } catch (err) {
    return null;
  }
  if (!cam || !cam.center || typeof cam.zoom !== 'number' || !isFinite(cam.zoom)) return null;
  const c = cam.center;
  const center = Array.isArray(c) ? c : [c.lng, c.lat];
  return { center, zoom: cam.zoom };
}

// Moves the camera to the continent's fitted view (or its configured one). `instant` skips the easing.
export function showContinent(map, continent, { instant = false } = {}) {
  const cfg = CONTINENTS[continent];
  if (!cfg || !map) return;
  const cam = fitCamera(map, continent);
  const center = cam ? cam.center : cfg.center;
  const zoom = cam ? cam.zoom : cfg.zoom;
  // A small stage needs a wider view than the continent's default: lower the floor to the fitted zoom, never raise it.
  map.setMinZoom(Math.min(cfg.minZoom, zoom));
  map.setMaxZoom(cfg.maxZoom);
  userMoved = false;
  if (instant || reducedMotion()) map.jumpTo({ center, zoom });
  else map.easeTo({ center, zoom, duration: EASE_MS });
}

// MapLibre opens the compact attribution ("i") on a narrow map and closes it on the first mouse or touch press. Close it once
// the markers are up, so the first view is the map and not a 100px credit box; the "i" button still opens it. The credit
// text stays on the map either way.
function foldAttribution(map) {
  try {
    const box = map.getContainer().querySelector('.maplibregl-ctrl-attrib.maplibregl-compact');
    if (!box) return;
    box.classList.remove('maplibregl-compact-show');
    box.removeAttribute('open');
  } catch (err) { /* cosmetic */ }
}

function bindMap(map) {
  if (bound === map) return;
  bound = map;
  // A move the visitor made (drag, wheel, touch, the zoom buttons) stops the automatic re-fit on resize.
  map.on('movestart', (e) => { if (e && e.originalEvent) userMoved = true; });
  map.on('resize', () => {
    if (userMoved) return;
    const cam = fitCamera(map, state.continent);
    if (!cam) return;
    const cfg = CONTINENTS[state.continent];
    map.setMinZoom(Math.min(cfg.minZoom, cam.zoom));
    map.jumpTo({ center: cam.center, zoom: cam.zoom });
    userMoved = false;
  });
}

export function initContinent() {
  initLabels();
  on('map:markers', ({ map }) => {
    bindMap(map);
    showContinent(map, state.continent, { instant: true });
    foldAttribution(map);
  });
  on('continent:change', ({ continent: c }) => {
    const map = runtime.mapInstance;
    if (map) showContinent(map, c);
  });
}
