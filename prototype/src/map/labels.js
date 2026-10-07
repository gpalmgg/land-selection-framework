// Label placement for the map: which side of its chip each region's name pill sits on, and where the extension labels
// (the bioregion names) go. Deterministic: the same slate at the same view always gives the same result.
//
// The rule (design 8.6, mockup `placeLabels()`):
//   * every chip is an obstacle first (and the map's own controls: zoom buttons, attribution);
//   * each marker's pill takes the FIRST FREE SIDE in the order right, left, above, below, in the slate's declared order;
//   * a side is free when the pill stays inside the stage and touches no obstacle and no pill already placed;
//   * when no side is free, or the stage is narrower than 560px, the pill is dropped (class `nolabel`): the chip stays,
//     its aria-label carries the name and whose land it is, and the card list below names every place;
//   * extension labels (ctx.labelProvider(fn), fn() -> [{ el, lngLat, priority, kind, core }]) are placed AFTER the region
//     pills, centred under their point or above it when below is taken, and hidden below zoom 5 unless `core`, and on a
//     narrow stage. They are DOM markers (MapLibre markers) beneath the region markers, so they pan and zoom with the map.
// It runs when the markers appear and on load, moveend, zoomend, resize, fonts.ready, filter changes and layer toggles;
// the work is one pass over at most a few dozen markers.
//
// `layout()` is pure (numbers in, sides out) and is what the tests exercise; `placeLabels()` is the DOM half.

import { regions } from '../data.js';
import { state, runtime } from '../state.js';
import { on } from '../bus.js';
import { onToggle } from './layers.js';

export const COMPACT_STAGE_W = 560;    // narrower than this the pills are dropped
export const CHIP_R = 17;              // half the chip with its ring and shadow
export const LABEL_GAP = 21;           // from the point to the pill's near edge
export const EXT_GAP = 22;             // from the point to an extension label's near edge
export const EXT_MIN_ZOOM = 5;         // extension labels below this zoom show only when `core`
export const PAD = 2;                  // breathing room kept between two placed labels

const rect = (l, t, r, b) => ({ l, t, r, b });
const hit = (a, b) => !(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b);
const inflate = (a, p) => rect(a.l - p, a.t - p, a.r + p, a.b + p);
const inside = (a, W, H) => a.l >= 0 && a.r <= W && a.t >= 0 && a.b <= H;

// The candidate rectangles of a pill of size w x h next to a chip at (x, y), in order.
export function pillSides(x, y, w, h) {
  return [
    ['right', rect(x + LABEL_GAP, y - h / 2, x + LABEL_GAP + w, y + h / 2)],
    ['left', rect(x - LABEL_GAP - w, y - h / 2, x - LABEL_GAP, y + h / 2)],
    ['above', rect(x - w / 2, y - LABEL_GAP - h, x + w / 2, y - LABEL_GAP)],
    ['below', rect(x - w / 2, y + LABEL_GAP, x + w / 2, y + LABEL_GAP + h)],
  ];
}

// input: { W, H, chips: [{x, y}], labels: [{w, h}] (parallel to chips), obstacles: [rect], extras: [{x, y, w, h}], compact }
// output: { region: [side | null], extra: [side | null], rects: [rect] } where a side is 'right' | 'left' | 'above' | 'below'
// ('right' for a pill is the default position; an extra only ever gets 'below' or 'above').
export function layout({ W, H, chips, labels, obstacles = [], extras = [], compact = false }) {
  const placed = [];
  chips.forEach((c) => placed.push(rect(c.x - CHIP_R, c.y - CHIP_R, c.x + CHIP_R, c.y + CHIP_R)));
  obstacles.forEach((o) => placed.push(o));
  const out = { region: [], extra: [], rects: [] };
  chips.forEach((c, i) => {
    const lab = labels[i];
    let pick = null;
    if (!compact && lab && lab.w > 0 && lab.h > 0 && c.x >= 0 && c.x <= W && c.y >= 0 && c.y <= H) {
      for (const [side, r] of pillSides(c.x, c.y, lab.w, lab.h)) {
        if (!inside(r, W, H)) continue;
        const grown = inflate(r, PAD);
        if (placed.some((z) => hit(z, grown))) continue;
        pick = [side, r];
        break;
      }
    }
    if (pick) { placed.push(pick[1]); out.rects[i] = pick[1]; }
    out.region.push(pick ? pick[0] : null);
  });
  extras.forEach((e) => {
    let pick = null;
    if (!compact && e.w > 0 && e.h > 0) {
      const opts = [
        ['below', rect(e.x - e.w / 2, e.y + EXT_GAP, e.x + e.w / 2, e.y + EXT_GAP + e.h)],
        ['above', rect(e.x - e.w / 2, e.y - EXT_GAP - e.h, e.x + e.w / 2, e.y - EXT_GAP)],
      ];
      for (const [side, r] of opts) {
        if (!inside(r, W, H)) continue;
        if (placed.some((z) => hit(z, inflate(r, PAD)))) continue;
        pick = [side, r];
        break;
      }
    }
    if (pick) placed.push(pick[1]);
    out.extra.push(pick ? pick[0] : null);
  });
  return out;
}

// ------------------------------------------------------------------------------------------------ the DOM half

let attached = null;           // the map the listeners are on
let scheduled = false;
let fallbackTimer = null;
let getProviders = null;       // map.js's getLabelProviders, reached lazily so this file never imports the map entry
const anchors = new Map();     // extension label el -> { wrap, marker }

function schedule() {
  if (scheduled) return;
  scheduled = true;
  const run = () => {
    if (!scheduled) return;
    scheduled = false;
    if (fallbackTimer !== null) { clearTimeout(fallbackTimer); fallbackTimer = null; }
    try { placeLabels(); } catch (err) { console.error('label placement failed:', err); }
  };
  if (typeof requestAnimationFrame === 'function') requestAnimationFrame(run);
  fallbackTimer = setTimeout(run, 150);   // a hidden tab never delivers a frame
}

// The rectangles of the map's own controls, in the stage's coordinates: labels never sit under them.
function controlRects(stage) {
  const box = stage.getBoundingClientRect();
  const out = [];
  stage.querySelectorAll('.maplibregl-ctrl').forEach((c) => {
    const r = c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    out.push(rect(r.left - box.left - 2, r.top - box.top - 2, r.right - box.left + 2, r.bottom - box.top + 2));
  });
  return out;
}

function providerItems() {
  const items = [];
  if (!getProviders) return items;
  let fns = [];
  try { fns = getProviders() || []; } catch (err) { return items; }
  fns.forEach((fn) => {
    try { (fn() || []).forEach((it) => { if (it && it.el && Array.isArray(it.lngLat)) items.push(it); }); } catch (err) { console.error('label provider failed:', err); }
  });
  return items.map((it, i) => ({ it, i })).sort((a, b) => ((b.it.priority || 0) - (a.it.priority || 0)) || (a.i - b.i)).map((x) => x.it);
}

function anchorFor(item, map) {
  let a = anchors.get(item.el);
  if (a) { a.marker.setLngLat(item.lngLat); return a; }
  const lib = typeof maplibregl !== 'undefined' ? maplibregl : null;
  if (!lib) return null;
  const wrap = document.createElement('div');
  wrap.className = 'bio-anchor';
  wrap.setAttribute('aria-hidden', 'true');
  if (item.el.dataset && item.el.dataset.continent) wrap.dataset.continent = item.el.dataset.continent;
  wrap.appendChild(item.el);
  const marker = new lib.Marker({ element: wrap }).setLngLat(item.lngLat).addTo(map);
  a = { wrap, marker };
  anchors.set(item.el, a);
  return a;
}

function dropStale(live) {
  anchors.forEach((a, el) => {
    if (live.has(el)) return;
    try { a.marker.remove(); } catch (err) { /* already gone */ }
    anchors.delete(el);
  });
}

export function placeLabels() {
  const map = runtime.mapInstance;
  if (!map || typeof map.project !== 'function') return;
  const stage = map.getContainer();
  const W = stage.clientWidth;
  const H = stage.clientHeight;
  if (!W || !H) return;
  const compact = W < COMPACT_STAGE_W;

  const rows = [];
  regions.forEach((r) => {
    if (r.continent !== state.continent) return;
    const m = runtime.regionMarkers[r.id];
    if (m) rows.push({ r, m });
  });
  // Natural position first, so every pill is measured as it is at rest (no Salutation line).
  rows.forEach(({ m }) => m.classList.remove('nolabel', 'flip', 'above', 'below'));
  const chips = rows.map(({ r }) => { const p = map.project(r.coords); return { x: p.x, y: p.y }; });
  const labels = rows.map(({ m }) => { const l = m.querySelector('.region-label'); return l ? { w: l.offsetWidth, h: l.offsetHeight } : null; });

  // Extension labels: attach their elements, drop the ones no provider returns now, measure the visible ones.
  const items = providerItems();
  const zoom = map.getZoom();
  const live = new Set();
  const extraIdx = [];
  const extras = [];
  items.forEach((it) => {
    const a = anchorFor(it, map);
    if (!a) return;
    live.add(it.el);
    a.wrap.classList.remove('nolabel', 'above');
    const off = it.el.dataset && it.el.dataset.off;
    const tooFar = zoom < EXT_MIN_ZOOM && !(it.core || (it.el.dataset && (it.el.dataset.core === '1' || it.el.dataset.core === 'true')));
    if (off || tooFar || compact) { a.wrap.classList.add('nolabel'); return; }
    const p = map.project(it.lngLat);
    extraIdx.push(a);
    extras.push({ x: p.x, y: p.y, w: it.el.offsetWidth, h: it.el.offsetHeight });
  });
  dropStale(live);

  const res = layout({ W, H, chips, labels, obstacles: controlRects(stage), extras, compact });
  rows.forEach(({ m }, i) => {
    const side = res.region[i];
    if (!side) m.classList.add('nolabel');
    else if (side === 'left') m.classList.add('flip');
    else if (side === 'above' || side === 'below') m.classList.add(side);
  });
  extraIdx.forEach((a, i) => {
    const side = res.extra[i];
    if (!side) a.wrap.classList.add('nolabel');
    else if (side === 'above') a.wrap.classList.add('above');
  });
  // The marker under the pointer or holding focus keeps its grown pill inside the stage.
  stage.querySelectorAll('.region-marker:hover, .region-marker:focus-within').forEach(fitHovered);
}

// On hover and keyboard focus the pill grows by the Salutation line. Keep the grown pill inside the stage: if it would cross
// the right or left edge, put it on the other side; a marker whose pill was dropped shows it on the side with room. The
// next placement pass puts every class back.
function fitHovered(marker) {
  const map = runtime.mapInstance;
  if (!map || !marker || !marker.classList || !marker.classList.contains('region-marker')) return;
  const stage = map.getContainer();
  const lab = marker.querySelector('.region-label');
  if (!lab) return;
  marker.classList.remove('flip', 'above', 'below');
  marker.classList.add('hover-measure');
  const box = stage.getBoundingClientRect();
  let r = lab.getBoundingClientRect();
  if (r.right > box.right - 2) {
    marker.classList.add('flip');
    r = lab.getBoundingClientRect();
    if (r.left < box.left + 2) {            // neither side has room: above, centred
      marker.classList.remove('flip');
      marker.classList.add('above');
    }
  }
  marker.classList.remove('hover-measure');
}

function bindHover(stage) {
  const on_ = (e) => fitHovered(e.target && e.target.closest ? e.target.closest('.region-marker') : null);
  const off_ = (e) => {
    const from = e.target && e.target.closest ? e.target.closest('.region-marker') : null;
    const to = e.relatedTarget && e.relatedTarget.closest ? e.relatedTarget.closest('.region-marker') : null;
    if (from && from === to) return;           // moving between a marker's own parts
    schedule();
  };
  stage.addEventListener('mouseover', on_);
  stage.addEventListener('focusin', on_);
  stage.addEventListener('mouseout', off_);
  stage.addEventListener('focusout', off_);
}

function attach(map) {
  if (attached === map) { schedule(); return; }
  attached = map;
  bindHover(map.getContainer());
  ['load', 'moveend', 'zoomend', 'resize'].forEach((evt) => map.on(evt, schedule));
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) document.fonts.ready.then(schedule);
  schedule();
}

// Wires the placement to the bus and the layer toggles. Called once, from continent.js (which main.js initialises first).
export function initLabels() {
  on('map:markers', ({ map }) => attach(map));
  on('markers:updated', () => { if (attached) schedule(); });
  on('continent:change', () => { if (attached) schedule(); });
  onToggle(() => { if (attached) schedule(); });
  // map.js already sits in the module graph; the label providers extensions register live there.
  import('./map.js').then((m) => { getProviders = m.getLabelProviders; if (attached) schedule(); }).catch(() => {});
}

// Test hook: the number of extension labels the layer currently holds.
export function extensionLabelCount() {
  return anchors.size;
}
