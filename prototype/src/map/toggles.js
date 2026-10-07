// The layer panel: one button per registry layer, in groups. Groups, labels and order come from the registry (and the
// extensions merged into it), so adding a layer there adds its row here.
//
//   * Header "Layers" with "N of M shown". At 900px and wider the panel sits beside the map (a column the height of the
//     stage) and the header is a plain heading; below 900px it is a disclosure UNDER the map, collapsed, that shows the
//     count (never an overlay on the map). The query is (max-width: 899px).
//   * Groups (an extension's `place` group first, then Climate and water, Land and soil, Energy, Hazards, People and
//     access, Terrain and imagery) are role=group blocks that collapse. A group with a layer on starts open. The open
//     state is remembered in localStorage as a convenience only (every access wrapped in try/catch); the page works the
//     same with storage blocked.
//   * A row is a 44px <button aria-pressed> with a leaf-shaped checkbox, the layer's swatch, its name and a MANDATORY
//     "source · vintage · licence" line (the registry's sourceLine; the gap words show in the --gap ink when a part is not
//     recorded). health.js puts its note right after the button and links it by aria-describedby; both are kept.
//   * "Clear layers" switches every layer off, "Back to defaults" restores the registry's defaults (and the extensions').
//   * An empty <div id="map-ext-slot"> sits above the groups for the compare control and any extension that wants room
//     (ctx.getSlot() resolves it).
// The panel follows the engine: a toggle made anywhere (this panel, an extension's control) arrives through onToggle().

import { state } from '../state.js';
import { el } from '../ui/dom.js';
import { panelGroups, panelLayers, applyVisibility, onToggle } from './layers.js';
import { renderMapLegend, sourceText, appendSourceText } from './legend.js';

const NARROW = '(max-width: 899px)';
const STORE_KEY = 'lsf-map-groups';

let rows = new Map();        // layer id -> button
let groups = new Map();      // group key -> { wrap, head, body, count, ids }
let allLayers = [];
let subscribed = false;
let panelTouched = false;    // the visitor opened or closed the disclosure themselves

const narrow = () => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(NARROW).matches;

function readStore() {
  try {
    const v = JSON.parse(window.localStorage.getItem(STORE_KEY) || '{}');
    return v && typeof v === 'object' ? v : {};
  } catch (err) { return {}; }
}

function writeStore(key, open) {
  try {
    const v = readStore();
    v[key] = !!open;
    window.localStorage.setItem(STORE_KEY, JSON.stringify(v));
  } catch (err) { /* storage blocked: the panel works without it */ }
}

const isOn = (id) => !!state.mapLayers[id];

function setGroupOpen(g, open) {
  g.body.hidden = !open;
  g.head.setAttribute('aria-expanded', String(open));
  g.wrap.classList.toggle('open', open);
}

function defaultOpen(key, ids) {
  if (ids.some(isOn)) return true;                 // a group with a layer on starts open
  const stored = readStore();
  if (typeof stored[key] === 'boolean') return stored[key];
  return !narrow();
}

function rowButton(def) {
  const on = isOn(def.id);
  const t = el('button', { className: 'map-toggle' + (on ? ' on' : ''), attrs: {
    type: 'button',
    'aria-pressed': String(on),
    'aria-label': `${def.label} map layer`,
    'data-layer-id': def.id,
    'aria-describedby': `map-src-${def.id}`,
  } });
  const dot = el('span', { className: 'dot' });
  dot.setAttribute('aria-hidden', 'true');
  t.appendChild(dot);
  const name = el('span', { className: 'name' });
  const sw = el('span', { className: 'sw' });
  sw.setAttribute('aria-hidden', 'true');
  const color = def.color || (def.legend && (def.legend.color || (def.legend.colors && def.legend.colors[0]))) || '#6a5a4a';
  sw.style.setProperty('--c', /gradient/.test(color) ? (def.legend.colors && def.legend.colors[0]) || '#6a5a4a' : color);
  name.appendChild(sw);
  name.appendChild(document.createTextNode(def.label));
  t.appendChild(name);
  const src = el('small', { className: 'src' });
  src.id = `map-src-${def.id}`;
  appendSourceText(src, sourceText(def));
  t.appendChild(src);
  // Surfaces stack freely: any layer overlays any other. Opacity is capped (STACK_OPACITY_CAP) so stacked surfaces blend
  // instead of the top one going fully opaque. applyVisibility() tells every listener, this panel's sync() included.
  t.addEventListener('click', () => {
    state.mapLayers[def.id] = !isOn(def.id);
    applyVisibility(def.id);
  });
  return t;
}

function groupBlock(grp, defs) {
  const wrap = el('div', { className: 'map-group' });
  wrap.setAttribute('role', 'group');
  wrap.dataset.group = grp.key;
  const headId = `map-group-${grp.key}`;
  const bodyId = `map-group-body-${grp.key}`;
  wrap.setAttribute('aria-labelledby', headId);
  const head = el('button', { className: 'map-toggle-group-label', attrs: { type: 'button', id: headId, 'aria-controls': bodyId, 'aria-expanded': 'true' } });
  head.appendChild(el('span', { className: 'gl', text: grp.label }));
  const count = el('span', { className: 'gn' });
  head.appendChild(count);
  const caret = el('span', { className: 'caret' });
  caret.setAttribute('aria-hidden', 'true');
  head.appendChild(caret);
  const body = el('div', { className: 'map-group-body', attrs: { id: bodyId } });
  const g = { wrap, head, body, count, ids: defs.map((d) => d.id) };
  defs.forEach((def) => {
    const b = rowButton(def);
    rows.set(def.id, b);
    body.appendChild(b);
  });
  head.addEventListener('click', () => {
    const open = body.hidden;          // hidden now -> opening
    setGroupOpen(g, open);
    writeStore(grp.key, open);
  });
  wrap.appendChild(head);
  wrap.appendChild(body);
  groups.set(grp.key, g);
  return wrap;
}

// Brings every row, group count and the header count in line with state.mapLayers.
function sync() {
  let on = 0;
  rows.forEach((btn, id) => {
    const v = isOn(id);
    if (v) on += 1;
    btn.classList.toggle('on', v);
    if (btn.getAttribute('aria-pressed') !== String(v)) btn.setAttribute('aria-pressed', String(v));
  });
  groups.forEach((g) => {
    const n = g.ids.filter(isOn).length;
    g.count.textContent = n ? `${n} shown` : '';
    g.wrap.classList.toggle('has-on', n > 0);
    if (n > 0 && g.body.hidden) setGroupOpen(g, true);   // a layer that is on is never hidden in a closed group
  });
  const count = document.getElementById('layers-count');
  if (count) count.textContent = `${on} of ${allLayers.length} shown`;
  const toggle = document.getElementById('layers-toggle');
  if (toggle) toggle.setAttribute('data-on', String(on));
  renderMapLegend();
}

function setAll(values) {
  allLayers.forEach((d) => {
    const want = values(d);
    if (isOn(d.id) === want) return;
    state.mapLayers[d.id] = want;
    applyVisibility(d.id);
  });
  sync();
}

function renderActions(host) {
  host.textContent = '';
  const clear = el('button', { className: 'map-action', text: 'Clear layers', attrs: { type: 'button', id: 'layers-clear' } });
  clear.addEventListener('click', () => setAll(() => false));
  const back = el('button', { className: 'map-action', text: 'Back to defaults', attrs: { type: 'button', id: 'layers-defaults' } });
  back.addEventListener('click', () => setAll((d) => !!d.defaultOn));
  host.appendChild(clear);
  host.appendChild(back);
}

// The panel as a disclosure (narrow) or a fixed column (wide).
function applyPanelMode(controls, toggleBtn) {
  const isNarrow = narrow();
  if (isNarrow) {
    toggleBtn.removeAttribute('aria-disabled');
    toggleBtn.removeAttribute('tabindex');
    if (!panelTouched) {
      controls.classList.add('collapsed');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  } else {
    controls.classList.remove('collapsed');
    toggleBtn.setAttribute('aria-expanded', 'true');
    toggleBtn.setAttribute('aria-disabled', 'true');   // beside the map the header is a heading, not a control
    toggleBtn.setAttribute('tabindex', '-1');
  }
}

export function renderMapToggles() {
  const container = document.getElementById('map-toggles');
  if (!container) return;
  container.textContent = '';
  rows = new Map();
  groups = new Map();
  allLayers = panelLayers();

  // The slot for extension controls (MC-MAP-COMPARE's control, BIO-3's rows): empty, above the groups.
  if (!document.getElementById('map-ext-slot')) {
    const slot = el('div', { attrs: { id: 'map-ext-slot' } });
    container.parentNode.insertBefore(slot, container);
  }
  const actions = document.getElementById('map-panel-actions');
  if (actions) renderActions(actions);

  panelGroups().forEach((grp) => {
    const defs = panelLayers(grp.key);
    if (!defs.length) return;
    container.appendChild(groupBlock(grp, defs));
  });
  groups.forEach((g, key) => setGroupOpen(g, defaultOpen(key, g.ids)));

  // The disclosure: collapsed under the map on small screens, a fixed column from 900px.
  const controls = document.querySelector('.map-controls');
  const toggleBtn = document.getElementById('layers-toggle');
  if (controls && toggleBtn) {
    if (!toggleBtn.dataset.wired) {
      toggleBtn.dataset.wired = '1';
      toggleBtn.addEventListener('click', () => {
        if (!narrow()) return;
        panelTouched = true;
        const collapsed = controls.classList.toggle('collapsed');
        toggleBtn.setAttribute('aria-expanded', String(!collapsed));
      });
      const mq = window.matchMedia ? window.matchMedia(NARROW) : null;
      if (mq) {
        const onChange = () => {
          applyPanelMode(controls, toggleBtn);
          groups.forEach((g, key) => { if (!g.ids.some(isOn)) setGroupOpen(g, defaultOpen(key, g.ids)); });
        };
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else if (mq.addListener) mq.addListener(onChange);
      }
    }
    applyPanelMode(controls, toggleBtn);
  }

  if (!subscribed) {
    subscribed = true;
    onToggle(() => sync());
  }
  sync();
}
