// The layer compare extension (MC-MAP-COMPARE, decision D14): two layers over the same view, a swipe at 900px and wider, a fade
// below that, and the "Then and later" pairs. It replaces the stub that MC-JS-3 left in the manifest.
//
// The control sits in the layer panel's #map-ext-slot (ctx.getSlot()): a closed <details> "Compare layers" with
//   * "Then and later": one button per pair the registry names (config/map-layers.js trajectoryPair: Koppen 1991-2020 against
//     2041-2070, river flood 1960-1999 against each 2050 scenario). No pair is invented here; a layer without a counterpart epoch
//     is never offered one.
//   * two pickers (any two raster or GeoJSON layers of the registry) and a "Compare these two" button.
// It lives in a shadow root on the slot (a <slot> inside keeps any other extension's rows visible): the slot stays free of element
// children, which is what the panel's own contract test asserts, and the control's styles cannot leak into the panel. The
// stylesheet (styles/map-compare.css) is linked from the document and, once more, inside the shadow root; this module adds both
// links itself, because the page's own <link> list is not ours to edit.
//
// SWIPE (the viewport is 900px or wider). A second MapLibre instance is created lazily and stacked over the first, inside the
// first map's container, clipped by `clip-path: inset(0 0 0 X%)`. The first map shows layer A on the left of the divider, the
// second shows layer B on the right. Every other registry layer is hidden on the first map for the length of the comparison
// (state.mapLayers is never touched, so leaving puts back exactly what the visitor had). The divider is a role=slider: arrow keys
// move it in 5 percent steps, Home and End go to the ends, aria-valuetext says what each side shows; a pointer drags it.
// Cameras follow each other both ways behind a feedback guard. The second map is `aria-hidden` and `inert`, so the first stays the
// one the visitor drives; the region markers are the first map's own DOM markers and sit above the second map by z-order, so they
// stay real, focusable and in step with it (nothing needs mirroring).
//
// FADE (narrower than 900px). One map: layer B is drawn over layer A and a "Fade between" slider crossfades them by changing the
// opacity of both. The layers' own opacities are put back when the comparison ends.
//
// Exit button, Escape (unless an overlay such as the drawer is open: that one gets it first), a change of layers in the panel and
// disposeMap() all end the comparison: the second map is removed (its WebGL context is released), the first map's layers return to
// state.mapLayers. The comparison is never written to the URL. The divider never animates (no transition at all).
//
// Words: nothing here scores, ranks or sums. Each side names its layer and prints that layer's source line (source, vintage,
// licence) and its colour key, taken from the registry.

import { state } from '../state.js';
import { MAP_LAYERS, MAP_GROUPS, STACK_OPACITY_CAP, trajectoryPairs, layerById } from '../config/map-layers.js';
import { initialSourceSpec, emptyFC, firstLabelId, koppenFillExpression, buildGroupedLegend, koppenCodesIn, legendModel } from './layers.js';
import { sourceText, appendSourceText } from './legend.js';
import { el } from '../ui/dom.js';

const NARROW = '(max-width: 899px)';
const STEP = 5;
const CSS_URL = new URL('../styles/map-compare.css', import.meta.url).href;
const CSS_ID = 'map-compare-css';
const FADE_DEFAULT = 50;
const NOTE_UNAVAILABLE = 'This service is slow or unavailable right now. The map keeps working.';

let ctx = null;
let ui = null;            // the control: { host, root, details, ... }
let cmp = null;           // the running comparison, or null
let unsubToggle = null;
let mql = null;
let mountTimer = null;
const jsonCache = new Map();

// ------------------------------------------------------------------------------------------------------ small helpers
const narrow = () => !!(window.matchMedia && window.matchMedia(NARROW).matches);

// Layers the pickers offer: every registry layer drawn as a raster, a WMS or GeoJSON surface. The ecovillage points (a point
// layer, drawn above the others) and the heat map are not surfaces to lay side by side.
const COMPARABLE = (l) => l.kind === 'raster' || l.kind === 'wms' || l.kind === 'geojson';
const comparable = () => MAP_LAYERS.filter(COMPARABLE);

function styleIdOf(entry, i) {
  return (entry.layers[i] && entry.layers[i].id) || (i === 0 ? entry.id : `${entry.id}-${i}`);
}
const styleIds = (entry) => entry.layers.map((_, i) => styleIdOf(entry, i));

const OPACITY_PROP = { raster: 'raster-opacity', fill: 'fill-opacity', heatmap: 'heatmap-opacity', circle: 'circle-opacity' };

// The paint a layer is drawn with: the registry's, with the stacking cap on opacity (as layers.js does for the first map).
function paintOf(entry, def) {
  const paint = { ...def.paint };
  if (entry.capOpacity && typeof paint['raster-opacity'] === 'number') {
    paint['raster-opacity'] = Math.min(paint['raster-opacity'], STACK_OPACITY_CAP);
  }
  return paint;
}

function fetchJson(url) {
  if (!jsonCache.has(url)) {
    const p = fetch(url).then((res) => {
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json();
    });
    jsonCache.set(url, p);
    p.catch(() => jsonCache.delete(url));
  }
  return jsonCache.get(url);
}

function groupLabel(key) {
  const g = MAP_GROUPS.find((x) => x.key === key);
  return g ? g.label : key;
}

// ---------------------------------------------------------------------------------------------------- the stylesheet
function ensureDocumentCss() {
  if (document.getElementById(CSS_ID)) return;
  const link = document.createElement('link');
  link.id = CSS_ID;
  link.rel = 'stylesheet';
  link.href = CSS_URL;
  document.head.appendChild(link);
}

// ------------------------------------------------------------------------------------------------------ the control
function option(value, text) {
  return el('option', { text, attrs: { value } });
}

function pickerOptions(select, placeholder) {
  select.appendChild(option('', placeholder));
  const byGroup = new Map();
  comparable().forEach((l) => {
    if (!byGroup.has(l.group)) byGroup.set(l.group, []);
    byGroup.get(l.group).push(l);
  });
  MAP_GROUPS.forEach((g) => {
    const list = byGroup.get(g.key);
    if (!list) return;
    const og = el('optgroup', { attrs: { label: g.label } });
    list.forEach((l) => og.appendChild(option(l.id, l.label)));
    select.appendChild(og);
  });
}

function field(label, select) {
  const wrap = el('label', { className: 'mc-field' });
  wrap.appendChild(el('span', { className: 'mc-field-label', text: label }));
  wrap.appendChild(select);
  return wrap;
}

function thenAndLater() {
  const block = el('div', { className: 'mc-then', attrs: { role: 'group', 'aria-labelledby': 'mc-then-h' } });
  block.appendChild(el('h5', { className: 'mc-sub', text: 'Then and later', attrs: { id: 'mc-then-h' } }));
  block.appendChild(el('p', { className: 'mc-help', text: 'The same dataset at two dates. Only pairs the registry holds are offered.' }));
  const pairs = trajectoryPairs();
  const sets = [];
  pairs.forEach((p) => { if (!sets.includes(p.thenId)) sets.push(p.thenId); });
  const buttons = [];
  sets.forEach((thenId) => {
    const thenLayer = layerById(thenId);
    const set = el('div', { className: 'mc-set' });
    set.appendChild(el('p', { className: 'mc-set-name', text: thenLayer ? thenLayer.label : thenId }));
    pairs.filter((p) => p.thenId === thenId).forEach((p) => {
      const laterLayer = layerById(p.laterId);
      const b = el('button', { className: 'mc-pair', attrs: {
        type: 'button', 'data-then': p.thenId, 'data-later': p.laterId,
        'aria-label': `Then and later: ${thenLayer ? thenLayer.label : p.thenId} on the left, ${laterLayer ? laterLayer.label : p.laterId} on the right`,
      } });
      b.appendChild(el('span', { className: 'mc-pair-then', text: p.thenLabel }));
      b.appendChild(el('span', { className: 'mc-pair-and', text: 'then' }));
      b.appendChild(el('span', { className: 'mc-pair-later', text: p.laterLabel }));
      b.addEventListener('click', () => enter(p.thenId, p.laterId, { trigger: b }));
      set.appendChild(b);
      buttons.push(b);
    });
    block.appendChild(set);
  });
  return { block, buttons };
}

function mount() {
  if (ui || !ctx) return;
  const slot = ctx.getSlot();
  if (!slot) {
    // The panel creates the slot at boot; if it is not there yet, look again shortly (a few times, then give up quietly).
    if (mountTimer === null) {
      let tries = 0;
      mountTimer = setInterval(() => {
        tries += 1;
        if (ctx && ctx.getSlot()) { clearInterval(mountTimer); mountTimer = null; mount(); } else if (tries > 40 || !ctx) { clearInterval(mountTimer); mountTimer = null; }
      }, 250);
    }
    return;
  }
  ensureDocumentCss();
  const root = slot.shadowRoot || slot.attachShadow({ mode: 'open' });
  const sheet = el('link', { attrs: { rel: 'stylesheet', href: CSS_URL } });
  root.appendChild(sheet);

  const details = el('details', { className: 'mc', attrs: { 'data-compare-root': '', 'data-state': 'idle' } });
  const summary = el('summary', { className: 'mc-summary' });
  summary.appendChild(el('span', { className: 'mc-summary-t', text: 'Compare layers' }));
  summary.appendChild(el('span', { className: 'mc-summary-n', text: '' }));
  details.appendChild(summary);

  const body = el('div', { className: 'mc-body' });
  body.appendChild(el('p', { className: 'mc-lede', text: '' }));

  // While a comparison runs the panel leads with it: each side's name, source line and colour key, then the way out.
  const active = el('div', { className: 'mc-active', attrs: { 'data-active': '' } });
  active.hidden = true;
  body.appendChild(active);

  const exit = el('button', { className: 'mc-btn mc-exit-panel', text: 'Exit comparison', attrs: { type: 'button' } });
  exit.hidden = true;
  body.appendChild(exit);

  const { block, buttons } = thenAndLater();
  body.appendChild(block);

  const pick = el('div', { className: 'mc-pick', attrs: { role: 'group', 'aria-labelledby': 'mc-pick-h' } });
  pick.appendChild(el('h5', { className: 'mc-sub', text: 'Any two layers', attrs: { id: 'mc-pick-h' } }));
  const selA = el('select', { className: 'mc-select', attrs: { 'data-pick': 'left' } });
  const selB = el('select', { className: 'mc-select', attrs: { 'data-pick': 'right' } });
  pickerOptions(selA, 'Choose a layer');
  pickerOptions(selB, 'Choose a layer');
  pick.appendChild(field('Left layer', selA));
  pick.appendChild(field('Right layer', selB));
  const go = el('button', { className: 'mc-btn mc-go', text: 'Compare these two', attrs: { type: 'button' } });
  go.disabled = true;
  pick.appendChild(go);
  const msg = el('p', { className: 'mc-msg', attrs: { 'data-msg': '' } });
  pick.appendChild(msg);
  body.appendChild(pick);

  const live = el('div', { className: 'mc-sr', attrs: { role: 'status', 'aria-live': 'polite', 'data-live': '' } });
  body.appendChild(live);
  details.appendChild(body);
  root.appendChild(details);
  root.appendChild(el('slot'));
  slot.setAttribute('data-compare', '');

  const check = () => {
    const a = selA.value; const b = selB.value;
    go.disabled = !(a && b && a !== b);
    msg.textContent = a && b && a === b ? 'Choose two different layers.' : '';
  };
  selA.addEventListener('change', check);
  selB.addEventListener('change', check);
  go.addEventListener('click', () => enter(selA.value, selB.value, { trigger: go }));
  exit.addEventListener('click', () => exitCompare({ refocus: true }));

  ui = { slot, root, details, summary, count: summary.querySelector('.mc-summary-n'), lede: body.querySelector('.mc-lede'),
    selA, selB, go, msg, active, exit, live, buttons, sheet };
  renderLede();
  updateControl();
}

function unmount() {
  if (mountTimer !== null) { clearInterval(mountTimer); mountTimer = null; }
  if (!ui) return;
  try {
    ui.root.textContent = '';
    ui.slot.removeAttribute('data-compare');
  } catch (err) { /* the slot is already gone */ }
  ui = null;
}

function renderLede() {
  if (!ui) return;
  ui.lede.textContent = narrow()
    ? 'Two layers over the same view. Below 900 pixels one map fades from the left layer to the right layer, with a slider over the map.'
    : 'Two layers over the same view. Drag the divider on the map, or use the arrow keys on it, to reveal the right layer over the left.';
}

function announce(text) {
  if (!ui) return;
  ui.live.textContent = '';
  // A fresh text node each time so a repeat of the same sentence is announced again.
  setTimeout(() => { if (ui) ui.live.textContent = text; }, 30);
}

// Brings the control in line with the running comparison: the active block (each side's name, source line, colour key), the exit
// button, the pair buttons' current marker, the summary.
function updateControl() {
  if (!ui) return;
  const on = !!cmp;
  ui.details.setAttribute('data-state', on ? 'active' : 'idle');
  ui.details.setAttribute('data-mode', on ? cmp.mode : '');
  ui.count.textContent = on ? 'on' : '';
  ui.exit.hidden = !on;
  ui.active.hidden = !on;
  ui.buttons.forEach((b) => {
    const cur = on && b.getAttribute('data-then') === cmp.a && b.getAttribute('data-later') === cmp.b;
    if (cur) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current');
  });
  ui.active.textContent = '';
  if (!on) return;
  [['left', cmp.a], ['right', cmp.b]].forEach(([side, id]) => ui.active.appendChild(sideBlock(side, id)));
  ui.active.appendChild(el('p', { className: 'mc-help', text: 'Switching a layer on or off in the panel ends the comparison.' }));
}

function sideBlock(side, id) {
  const entry = layerById(id);
  const sec = el('section', { className: 'mc-side', attrs: { 'data-side': side, 'data-layer-id': id } });
  sec.appendChild(el('h5', { className: 'mc-side-h', text: `${side === 'left' ? 'Left' : 'Right'}: ${entry ? entry.label : id}` }));
  const src = el('p', { className: 'mc-src' });
  appendSourceText(src, sourceText(entry));
  sec.appendChild(src);
  const note = cmp && cmp.notes[side];
  if (note) sec.appendChild(el('p', { className: 'mc-note', text: note, attrs: { 'data-note': side } }));
  const model = (cmp && cmp.models[id]) || legendModel(id) || (entry && entry.legend);
  const key = miniKey(model, entry);
  if (key) sec.appendChild(key);
  return sec;
}

// A compact colour key: meaning only, never a score. Mirrors the legend's row kinds.
function swatch(color, dot) {
  const s = el('span', { className: 'mc-sw' + (dot ? ' dot' : '') });
  s.setAttribute('aria-hidden', 'true');
  if (color) s.style.setProperty('--c', color);
  return s;
}

function classList(items) {
  const ul = el('ul', { className: 'mc-classes' });
  items.forEach((c) => {
    const li = el('li');
    li.appendChild(swatch(c.color));
    li.appendChild(el('span', { text: c.code && !String(c.label).startsWith(String(c.code)) ? `${c.code} ${c.label}` : c.label }));
    ul.appendChild(li);
  });
  return ul;
}

function miniKey(model, entry) {
  if (!model) return null;
  const wrap = el('div', { className: 'mc-key' });
  const k = model.kind;
  if (k === 'ramp') {
    const colors = model.colors && model.colors.length ? model.colors : [(entry && entry.color) || '#6a5a4a'];
    const stops = model.stops && model.stops.length > 1 ? model.stops : null;
    const row = el('div', { className: 'mc-ramp-row' });
    row.appendChild(el('span', { className: 'mc-end', text: stops ? stops[0].label : 'low' }));
    const ramp = el('span', { className: 'mc-ramp' });
    ramp.setAttribute('aria-hidden', 'true');
    ramp.style.setProperty('--ramp', colors.length > 1 ? `linear-gradient(90deg, ${colors.join(', ')})` : colors[0]);
    row.appendChild(ramp);
    row.appendChild(el('span', { className: 'mc-end', text: stops ? stops[stops.length - 1].label : 'high' }));
    wrap.appendChild(row);
  } else if (k === 'classes' && model.classes && model.classes.length) {
    wrap.appendChild(classList(model.classes));
  } else if (k === 'grouped') {
    if (model.pending) wrap.appendChild(el('p', { className: 'mc-note', text: 'Loading the classes for this view.' }));
    else (model.groups || []).forEach((g) => {
      wrap.appendChild(el('h6', { className: 'mc-group', text: g.label }));
      wrap.appendChild(classList(g.classes));
    });
  } else {
    const color = model.color && !/gradient/.test(model.color) ? model.color : (model.colors && model.colors[0]) || (entry && entry.color);
    const row = el('div', { className: 'mc-ramp-row' });
    row.appendChild(swatch(color, k === 'dot'));
    row.appendChild(el('span', { text: model.label || (entry && entry.label) || '' }));
    wrap.appendChild(row);
  }
  if (model.note) wrap.appendChild(el('p', { className: 'mc-note', text: model.note }));
  return wrap;
}

// ------------------------------------------------------------------------------------------------ map-side helpers
function stageOf(map) {
  return map.getContainer().parentElement;
}

function cameraOf(map) {
  const c = map.getCenter();
  return { center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() };
}

// Adds a registry layer (its source and style layers) to a map that does not have it yet, under the place names.
function addEntry(map, entry) {
  if (!map.getSource(entry.id)) map.addSource(entry.id, initialSourceSpec(entry, ctx.getContinent()));
  const before = firstLabelId(map);
  entry.layers.forEach((def, i) => {
    const id = styleIdOf(entry, i);
    if (map.getLayer(id)) return;
    const layer = {
      id, source: entry.id, type: def.type,
      layout: { ...(def.layout || {}), visibility: 'visible' },
      paint: paintOf(entry, def),
    };
    if (before && def.type !== 'circle' && map.getLayer(before)) map.addLayer(layer, before);
    else map.addLayer(layer);
  });
}

// Loads a GeoJSON layer's file for the active continent into `map` (the legend file too, for Koppen). Raster layers need nothing.
// Resolves with { empty, model } and never rejects: a failure becomes a note on the side.
function loadGeo(c, map, entry, side) {
  if (!entry.urls) return Promise.resolve();
  const src = map.getSource(entry.id);
  if (!src) return Promise.resolve();
  const continent = ctx.getContinent();
  const tok = (c.tok[side] = (c.tok[side] || 0) + 1);
  const url = entry.urls[continent];
  if (!url) {
    src.setData(emptyFC());
    setNote(c, side, 'No data for this continent.');
    return Promise.resolve();
  }
  setNote(c, side, '');
  const grouped = entry.legend && entry.legend.kind === 'grouped' && entry.legend.url;
  return Promise.all([fetchJson(url), grouped ? fetchJson(grouped) : null]).then(([data, lf]) => {
    if (cmp !== c || c.tok[side] !== tok) return;
    const target = map.getSource(entry.id);
    if (!target) return;
    if (lf) {
      entry.layers.forEach((def, i) => {
        const id = styleIdOf(entry, i);
        if (def.type === 'fill' && map.getLayer(id)) map.setPaintProperty(id, 'fill-color', koppenFillExpression(lf));
      });
      c.models[entry.id] = buildGroupedLegend(lf, koppenCodesIn(data));
    }
    target.setData(data);
    updateControl();
  }).catch(() => {
    if (cmp !== c || c.tok[side] !== tok) return;
    setNote(c, side, NOTE_UNAVAILABLE);
  });
}

function setNote(c, side, text) {
  if (c.notes[side] === text) return;
  c.notes[side] = text;
  if (cmp === c) {
    updateControl();
    if (text) announce(`${side === 'left' ? 'Left' : 'Right'} layer: ${text}`);
  }
}

// Watches one map for the failure of one source: three tile errors and no tile loaded puts the quiet note on that side. Returns
// the function that stops watching.
function watch(c, map, id, side) {
  let errors = 0;
  let loaded = false;
  const onError = (e) => {
    if (!e || e.sourceId !== id || loaded) return;
    errors += 1;
    if (errors >= 3) setNote(c, side, NOTE_UNAVAILABLE);
  };
  const onData = (e) => {
    if (e && e.sourceId === id && e.tile && e.tile.state === 'loaded') {
      loaded = true;
      if (c.notes[side] === NOTE_UNAVAILABLE) setNote(c, side, '');
    }
  };
  map.on('error', onError);
  map.on('sourcedata', onData);
  return () => { try { map.off('error', onError); map.off('sourcedata', onData); } catch (err) { /* the map is gone */ } };
}

// ---------------------------------------------------------------------------------------------- the first map's layers
// Swipe: only layer A is drawn on the first map. Fade: A and B. Everything else is hidden for the comparison. Called again after
// anything that could have shown a layer (a style swap).
function showOnFirstMap(c) {
  const map = ctx.map;
  const want = c.mode === 'fade' ? new Set([c.a, c.b]) : new Set([c.a]);
  MAP_LAYERS.forEach((entry) => {
    styleIds(entry).forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', want.has(entry.id) ? 'visible' : 'none');
    });
  });
}

// Fade: B must be drawn over A. When it sits below A in the style, its layers move to just above A's; the places they came from
// are remembered so leaving puts the order back.
function raiseB(c) {
  const map = ctx.map;
  const A = layerById(c.a);
  const B = layerById(c.b);
  const order = () => map.getStyle().layers.map((l) => l.id);
  const ids = order();
  const aIds = styleIds(A).filter((id) => ids.includes(id));
  const bIds = styleIds(B).filter((id) => ids.includes(id));
  if (!aIds.length || !bIds.length) return;
  const aTop = Math.max(...aIds.map((id) => ids.indexOf(id)));
  const bBottom = Math.min(...bIds.map((id) => ids.indexOf(id)));
  if (bBottom > aTop) return;
  c.moved = bIds.map((id) => ({ id, next: ids[ids.indexOf(id) + 1] || null }));
  const after = ids[aTop + 1];
  bIds.forEach((id) => { map.moveLayer(id, after && !bIds.includes(after) ? after : undefined); });
}

function captureFade(c) {
  const map = ctx.map;
  c.paint = [];
  [c.a, c.b].forEach((eid) => {
    const entry = layerById(eid);
    entry.layers.forEach((def, i) => {
      const id = styleIdOf(entry, i);
      const prop = OPACITY_PROP[def.type];
      if (!prop || !map.getLayer(id)) return;
      const orig = map.getPaintProperty(id, prop);
      c.paint.push({ id, prop, orig, base: typeof orig === 'number' ? orig : 1, side: eid === c.a ? 'a' : 'b' });
    });
  });
}

// t is 0 (all A) to 1 (all B).
function setFade(c, t) {
  const map = ctx.map;
  c.t = t;
  c.paint.forEach((p) => {
    if (!map.getLayer(p.id)) return;
    map.setPaintProperty(p.id, p.prop, p.base * (p.side === 'a' ? 1 - t : t));
  });
}

function restoreFirstMap(c) {
  const map = ctx.map;
  if (!map) return;
  if (c.mode === 'fade') {
    c.paint.forEach((p) => { if (map.getLayer(p.id)) map.setPaintProperty(p.id, p.prop, p.orig === undefined ? null : p.orig); });
    c.paint = [];
    (c.moved || []).slice().reverse().forEach((m) => {
      if (map.getLayer(m.id)) map.moveLayer(m.id, m.next && map.getLayer(m.next) ? m.next : undefined);
    });
    c.moved = [];
  }
  MAP_LAYERS.forEach((entry) => {
    styleIds(entry).forEach((id) => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', state.mapLayers[entry.id] ? 'visible' : 'none');
    });
  });
}

// ------------------------------------------------------------------------------------------------ the second map
// The second map's style: the first map's own style without the registry layers (the basemap and whatever else is not ours), so a
// theme or a basemap failover is followed without a second copy of the rules. Falls back to the basemap module's style.
function secondStyle() {
  const map = ctx.map;
  try {
    const s = map.getStyle();
    const drop = new Set();
    MAP_LAYERS.forEach((entry) => styleIds(entry).forEach((id) => drop.add(id)));
    const layers = s.layers.filter((l) => !drop.has(l.id) && l.type !== 'circle');
    const used = new Set(layers.map((l) => l.source).filter(Boolean));
    const sources = {};
    used.forEach((id) => { if (s.sources[id]) sources[id] = s.sources[id]; });
    return { ...s, sources, layers };
  } catch (err) {
    return null;
  }
}

function buildSecond(c) {
  const lib = ctx.maplibregl;
  const map = ctx.map;
  const style = secondStyle();
  if (!style) return;
  const host = el('div', { className: 'mc-top', attrs: { id: 'map-compare-top', 'aria-hidden': 'true', 'data-ready': 'false' } });
  host.setAttribute('inert', '');
  map.getContainer().appendChild(host);
  const cam = cameraOf(map);
  const second = new lib.Map({
    container: host, style, ...cam,
    minZoom: map.getMinZoom(), maxZoom: map.getMaxZoom(),
    interactive: false, attributionControl: false,
  });
  c.second = second;
  c.secondHost = host;
  host.style.clipPath = `inset(0 0 0 ${c.x}%)`;

  // A source that fails must never put a console error on the page (an event with no listener is logged by the library).
  second.on('error', () => {});

  // Cameras: each follows the other, behind one guard so a jump does not echo back.
  let guard = false;
  const follow = (from, to) => () => {
    if (guard) return;
    guard = true;
    try {
      // The zoom limits change with the continent (continent.js): carry them too, or the follower clamps where the leader does not.
      if (to.getMinZoom() !== from.getMinZoom()) to.setMinZoom(from.getMinZoom());
      if (to.getMaxZoom() !== from.getMaxZoom()) to.setMaxZoom(from.getMaxZoom());
      to.jumpTo(cameraOf(from));
    } finally { guard = false; }
  };
  const toSecond = follow(map, second);
  const toFirst = follow(second, map);
  // resize() fires move events of its own: inside the guard, so the first map is not jumped (which would stop an easing).
  const onResize = () => {
    if (guard) return;
    guard = true;
    try { second.resize(); } catch (err) { /* removed */ } finally { guard = false; }
  };
  map.on('move', toSecond);
  second.on('move', toFirst);
  map.on('resize', onResize);
  c.offs.push(() => {
    try { map.off('move', toSecond); map.off('resize', onResize); } catch (err) { /* gone */ }
  });

  second.once('load', () => {
    if (cmp !== c || c.second !== second) return;
    const B = layerById(c.b);
    addEntry(second, B);
    c.offs.push(watch(c, second, B.id, 'right'));
    host.setAttribute('data-ready', 'true');
    loadGeo(c, second, B, 'right');
  });
}

function destroySecond(c) {
  if (c.second) {
    try { c.second.remove(); } catch (err) { /* already removed */ }
    c.second = null;
  }
  if (c.secondHost) {
    c.secondHost.remove();
    c.secondHost = null;
  }
}

// ------------------------------------------------------------------------------------------- the divider and the fade
function layerLabel(id) {
  const l = layerById(id);
  return l ? l.label : id;
}

function dividerText(c) {
  const a = layerLabel(c.a);
  const b = layerLabel(c.b);
  if (c.x >= 100) return `showing ${a} only`;
  if (c.x <= 0) return `showing ${b} only`;
  return `showing ${a} on the left, ${b} on the right`;
}

function setDivider(c, x) {
  c.x = Math.max(0, Math.min(100, Math.round(x)));
  c.divider.style.left = `${c.x}%`;
  c.divider.setAttribute('aria-valuenow', String(c.x));
  c.divider.setAttribute('aria-valuetext', dividerText(c));
  if (c.secondHost) c.secondHost.style.clipPath = `inset(0 0 0 ${c.x}%)`;
}

function buildDivider(c, stage) {
  const d = el('div', { className: 'mc-divider', attrs: {
    id: 'map-compare-divider', role: 'slider', tabindex: '0', 'aria-label': 'Comparison divider',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-orientation': 'horizontal',
  } });
  d.appendChild(el('span', { className: 'mc-line' }));
  const grip = el('span', { className: 'mc-grip' });
  grip.setAttribute('aria-hidden', 'true');
  d.appendChild(grip);
  stage.appendChild(d);
  c.divider = d;
  setDivider(c, c.x);

  d.addEventListener('keydown', (e) => {
    let x = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') x = c.x - STEP;
    else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') x = c.x + STEP;
    else if (e.key === 'Home') x = 0;
    else if (e.key === 'End') x = 100;
    if (x === null) return;
    e.preventDefault();
    setDivider(c, x);
  });
  // A pointer drags it. The grip is the target; the move is measured against the stage, so it follows the pointer exactly.
  let dragging = false;
  const move = (e) => {
    if (!dragging) return;
    const r = stage.getBoundingClientRect();
    if (r.width > 0) setDivider(c, ((e.clientX - r.left) / r.width) * 100);
  };
  d.addEventListener('pointerdown', (e) => {
    dragging = true;
    try { d.setPointerCapture(e.pointerId); } catch (err) { /* synthetic pointer */ }
    d.focus({ preventScroll: true });
    e.preventDefault();
    move(e);
  });
  d.addEventListener('pointermove', move);
  const end = () => { dragging = false; };
  d.addEventListener('pointerup', end);
  d.addEventListener('pointercancel', end);
}

function buildFade(c, stage) {
  const bar = el('div', { className: 'mc-fade', attrs: { 'data-fade': '' } });
  const id = 'map-compare-fade';
  bar.appendChild(el('label', { className: 'mc-fade-label', text: 'Fade between', attrs: { for: id } }));
  const input = el('input', { className: 'mc-fade-input', attrs: {
    id, type: 'range', min: '0', max: '100', step: '1', value: String(c.fade),
    'aria-valuetext': fadeText(c, c.fade),
  } });
  bar.appendChild(input);
  const ends = el('div', { className: 'mc-fade-ends' });
  ends.appendChild(el('span', { className: 'mc-fade-a', text: layerLabel(c.a) }));
  ends.appendChild(el('span', { className: 'mc-fade-b', text: layerLabel(c.b) }));
  bar.appendChild(ends);
  stage.appendChild(bar);
  c.fadeBar = bar;
  c.fadeInput = input;
  input.addEventListener('input', () => {
    c.fade = Number(input.value);
    input.setAttribute('aria-valuetext', fadeText(c, c.fade));
    setFade(c, c.fade / 100);
  });
}

function fadeText(c, v) {
  return `${100 - v} percent ${layerLabel(c.a)}, ${v} percent ${layerLabel(c.b)}`;
}

function buildStageUi(c, stage) {
  const key = el('div', { className: 'mc-stage-key', attrs: { 'data-stage-key': '' } });
  const exit = el('button', { className: 'mc-stage-exit', text: 'Exit comparison', attrs: { type: 'button' } });
  exit.addEventListener('click', () => exitCompare({ refocus: true }));
  key.appendChild(exit);
  const names = el('p', { className: 'mc-stage-names' });
  const l = el('span', { className: 'mc-stage-left' });
  l.appendChild(el('b', { text: c.mode === 'swipe' ? 'Left' : 'From' }));
  l.appendChild(document.createTextNode(` ${layerLabel(c.a)}`));
  const r = el('span', { className: 'mc-stage-right' });
  r.appendChild(el('b', { text: c.mode === 'swipe' ? 'Right' : 'To' }));
  r.appendChild(document.createTextNode(` ${layerLabel(c.b)}`));
  names.appendChild(l);
  names.appendChild(r);
  key.appendChild(names);
  stage.appendChild(key);
  c.stageKey = key;
}

// ------------------------------------------------------------------------------------------------- enter and leave
function onDocKeydown(e) {
  if (!cmp || e.key !== 'Escape' || e.defaultPrevented) return;
  // An open overlay (drawer, signup modal, shortlist compare) takes Escape first.
  if (document.body.classList.contains('overlay-open') || document.body.classList.contains('panel-open') || document.body.classList.contains('modal-open')) return;
  e.preventDefault();
  exitCompare({ refocus: true });
}

function onBreakpoint() {
  renderLede();
  if (cmp) enter(cmp.a, cmp.b, { trigger: cmp.trigger, keepFocus: true });
}

function build(c) {
  const map = ctx.map;
  const stage = stageOf(map);
  c.stage = stage;
  stage.classList.add('mc-on');
  buildStageUi(c, stage);
  if (c.mode === 'swipe') {
    buildDivider(c, stage);
    showOnFirstMap(c);
    buildSecond(c);
    c.offs.push(watch(c, map, c.a, 'left'));
    loadGeo(c, map, layerById(c.a), 'left');
  } else {
    showOnFirstMap(c);
    raiseB(c);
    captureFade(c);
    setFade(c, c.fade / 100);
    buildFade(c, stage);
    c.offs.push(watch(c, map, c.a, 'left'));
    c.offs.push(watch(c, map, c.b, 'right'));
    loadGeo(c, map, layerById(c.a), 'left');
    loadGeo(c, map, layerById(c.b), 'right');
  }
}

function teardown(c) {
  c.offs.splice(0).forEach((off) => { try { off(); } catch (err) { /* ignore */ } });
  destroySecond(c);
  if (c.divider) c.divider.remove();
  if (c.fadeBar) c.fadeBar.remove();
  if (c.stageKey) c.stageKey.remove();
  if (c.stage) c.stage.classList.remove('mc-on');
  restoreFirstMap(c);
}

function enter(aId, bId, opts = {}) {
  if (!ctx || !ctx.map) return false;
  const A = layerById(aId);
  const B = layerById(bId);
  if (!A || !B || aId === bId || !COMPARABLE(A) || !COMPARABLE(B)) return false;
  const prev = cmp;
  if (prev) { cmp = null; teardown(prev); }
  const c = {
    a: aId, b: bId, mode: narrow() ? 'fade' : 'swipe',
    x: prev && prev.mode === 'swipe' ? prev.x : 50,
    fade: prev ? prev.fade : FADE_DEFAULT,
    t: 0, tok: {}, notes: { left: '', right: '' }, models: {}, offs: [], paint: [], moved: [],
    trigger: opts.trigger || (prev && prev.trigger) || null,
  };
  cmp = c;
  build(c);
  if (!prev) {
    document.addEventListener('keydown', onDocKeydown);
    if (mql && mql.addEventListener) mql.addEventListener('change', onBreakpoint);
  }
  if (ui) ui.details.open = true;
  updateControl();
  announce(c.mode === 'swipe'
    ? `Comparing ${A.label} on the left with ${B.label} on the right. Use the arrow keys on the divider to move it.`
    : `Comparing ${A.label} with ${B.label}. Use the slider to fade between them.`);
  if (!opts.keepFocus) {
    const target = c.mode === 'swipe' ? c.divider : c.fadeInput;
    if (target) target.focus({ preventScroll: true });
  }
  return true;
}

function exitCompare(opts = {}) {
  const c = cmp;
  if (!c) return;
  cmp = null;
  teardown(c);
  document.removeEventListener('keydown', onDocKeydown);
  if (mql && mql.removeEventListener) mql.removeEventListener('change', onBreakpoint);
  updateControl();
  announce(opts.message || 'Comparison closed.');
  if (opts.refocus !== false && c.trigger && c.trigger.isConnected) {
    try { c.trigger.focus({ preventScroll: true }); } catch (err) { /* hidden */ }
  }
}

// ----------------------------------------------------------------------------------------------------- the extension
export default {
  id: 'compare',
  groups: [],
  layers: [],

  init(c) {
    ctx = c;
    mql = window.matchMedia ? window.matchMedia(NARROW) : null;
    // A layer switched on or off in the panel is the visitor choosing what to see: the comparison ends and their choice stands
    // (state.mapLayers was never changed by the comparison, so there is nothing to undo).
    unsubToggle = c.onToggle(() => {
      if (cmp) exitCompare({ refocus: false, message: 'Comparison closed because you changed the layers.' });
    });
    mount();
  },

  // The continent changed: both sides reload their file for it (the cameras follow on their own).
  onContinent() {
    const c = cmp;
    if (!c) return;
    if (c.mode === 'swipe') {
      loadGeo(c, ctx.map, layerById(c.a), 'left');
      if (c.second && c.second.getSource(c.b)) loadGeo(c, c.second, layerById(c.b), 'right');
    } else {
      loadGeo(c, ctx.map, layerById(c.a), 'left');
      loadGeo(c, ctx.map, layerById(c.b), 'right');
    }
  },

  // The style was replaced (a theme switch or a basemap failover) and the engine has re-added its layers: put the comparison back.
  onTheme() {
    const c = cmp;
    if (!c) return;
    c.paint = [];
    c.moved = [];
    c.offs.splice(0).forEach((off) => { try { off(); } catch (err) { /* ignore */ } });
    destroySecond(c);
    showOnFirstMap(c);
    c.offs.push(watch(c, ctx.map, c.a, 'left'));
    if (c.mode === 'swipe') {
      buildSecond(c);
    } else {
      raiseB(c);
      captureFade(c);
      setFade(c, c.fade / 100);
      c.offs.push(watch(c, ctx.map, c.b, 'right'));
    }
    loadGeo(c, ctx.map, layerById(c.a), 'left');
    if (c.mode === 'fade') loadGeo(c, ctx.map, layerById(c.b), 'right');
  },

  dispose() {
    if (cmp) {
      const c = cmp;
      cmp = null;
      teardown(c);
      document.removeEventListener('keydown', onDocKeydown);
      if (mql && mql.removeEventListener) mql.removeEventListener('change', onBreakpoint);
    }
    if (unsubToggle) { unsubToggle(); unsubToggle = null; }
    unmount();
    ctx = null;
    mql = null;
  },
};
