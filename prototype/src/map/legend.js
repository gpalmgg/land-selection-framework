// The legend: colour meaning for the layers that are ON, docked at the foot of the layer panel (never over the map, so it
// can never cover a marker or a bioregion label). Colour meaning, never a score. A layer that is off has no row; a layer
// with no legend in the registry (terrain and imagery) has none either.
//
// The model of each row comes from legendModel(id) in layers.js, not from the registry entry, because the Koppen legend is
// built from the classes found in the loaded file (grouped A to E) and fills in after the layer's first toggle (bus event
// `map:legend`). Row kinds:
//   ramp      a 64 x 8 gradient with low / high labels (the provider's own stop labels when it has them)
//   solid     one swatch;  dot  a round swatch;  dash  a dashed line swatch (ecoregion boundaries)
//   classes   DISCRETE swatches, one per class, never a gradient (land cover, WorldCover, seismic hazard)
//   grouped   discrete swatches under group headings (Koppen-Geiger)
// Each active layer ends with ONE source line (source, vintage, licence) taken from the registry's sourceLine. The block
// scrolls inside its own region, with its own height cap, when many layers are on.

import { state } from '../state.js';
import { on } from '../bus.js';
import { el } from '../ui/dom.js';
import { legendLayers, legendModel } from './layers.js';

const NV = 'vintage not yet recorded';
const NL = 'licence not yet recorded';
const GAP_RE = /(vintage not yet recorded|licence not yet recorded|source not yet recorded)/g;
let subscribed = false;

// The one line a layer prints: the registry's own `text` verbatim (the ecovillage row carries a clause that must not be
// lost), else the parts joined, with the gap words where a part is missing. Never empty.
export function sourceText(def) {
  const sl = def && def.sourceLine;
  if (sl && typeof sl.text === 'string' && sl.text.trim()) return sl.text.trim();
  if (sl && (sl.source || sl.vintage || sl.licenseText)) {
    return [sl.source || 'source not yet recorded', sl.vintage || NV, sl.licenseText || NL].join(' · ');
  }
  return 'source not yet recorded';
}

// Writes `text` into `node`, with the "not yet recorded" phrases as <em class="gap"> (the --gap ink, italic).
export function appendSourceText(node, text) {
  String(text).split(GAP_RE).forEach((part, i) => {
    if (!part) return;
    if (i % 2 === 1) node.appendChild(el('em', { className: 'gap', text: part }));
    else node.appendChild(document.createTextNode(part));
  });
}

const swatch = (kind, color) => {
  const s = el('span', { className: 'lg-sw' + (kind === 'dot' ? ' dot' : '') + (kind === 'dash' ? ' dash' : '') });
  s.setAttribute('aria-hidden', 'true');
  if (color) s.style.setProperty('--c', color);
  return s;
};

function classList(items) {
  const ul = el('ul', { className: 'lg-classes' });
  items.forEach((c) => {
    const li = el('li');
    li.appendChild(swatch('solid', c.color));
    li.appendChild(el('span', { className: 'lg-cl', text: c.code && !String(c.label).startsWith(String(c.code)) ? `${c.code} ${c.label}` : c.label }));
    ul.appendChild(li);
  });
  return ul;
}

// Builds the body of one layer's legend and returns { node, rows } (rows = swatch rows, for the "more than six" rule).
function bodyFor(model, layer) {
  const wrap = el('div', { className: 'lg-body' });
  let rows = 0;
  const k = model.kind;
  if (k === 'ramp') {
    const colors = (model.colors && model.colors.length ? model.colors : [layer.color || '#6a5a4a']);
    const ramp = el('span', { className: 'lg-ramp' });
    ramp.setAttribute('aria-hidden', 'true');
    ramp.style.setProperty('--ramp', colors.length > 1 ? `linear-gradient(90deg, ${colors.join(', ')})` : colors[0]);
    const stops = model.stops && model.stops.length > 1 ? model.stops : null;
    const lo = el('span', { className: 'lg-end', text: stops ? stops[0].label : 'low' });
    const hi = el('span', { className: 'lg-end', text: stops ? stops[stops.length - 1].label : 'high' });
    const row = el('div', { className: 'lg-row' });
    row.appendChild(lo); row.appendChild(ramp); row.appendChild(hi);
    wrap.appendChild(row);
    rows = 1;
  } else if (k === 'classes' && model.classes && model.classes.length) {
    wrap.appendChild(classList(model.classes));
    rows = model.classes.length;
  } else if (k === 'grouped') {
    if (model.pending) {
      wrap.appendChild(el('p', { className: 'lg-note', text: 'Loading the classes for this view.' }));
    } else if (!model.groups || !model.groups.length) {
      wrap.appendChild(el('p', { className: 'lg-note', text: 'No classes to show for this continent.' }));
    } else {
      model.groups.forEach((g) => {
        wrap.appendChild(el('h6', { className: 'lg-group', text: g.label }));
        wrap.appendChild(classList(g.classes));
        rows += g.classes.length;
      });
    }
  } else {
    const color = model.color && !/gradient/.test(model.color) ? model.color : (model.colors && model.colors[0]) || layer.color;
    const row = el('div', { className: 'lg-row' });
    row.appendChild(swatch(k === 'dot' ? 'dot' : k === 'dash' ? 'dash' : 'solid', color));
    row.appendChild(el('span', { className: 'lg-cl', text: model.label || layer.label }));
    wrap.appendChild(row);
    rows = 1;
  }
  return { node: wrap, rows };
}

export function renderMapLegend() {
  initLegend();
  const mount = document.getElementById('map-legend');
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const active = legendLayers().filter((l) => state.mapLayers[l.id]);
  if (!active.length) {
    mount.hidden = true;
    mount.setAttribute('aria-hidden', 'true');
    mount.removeAttribute('tabindex');
    mount.removeAttribute('role');
    mount.classList.remove('many');
    return;
  }
  mount.hidden = false;
  mount.setAttribute('aria-hidden', 'false');
  mount.setAttribute('role', 'region');
  mount.setAttribute('aria-label', 'Legend for the layers that are on');
  mount.tabIndex = 0;   // it scrolls inside its own box, so the keyboard must be able to reach it
  mount.appendChild(el('h3', { className: 'lg-title', text: 'Legend' }));
  let total = 0;
  active.forEach((layer) => {
    const model = legendModel(layer.id) || layer.legend;
    const sec = el('section', { className: 'lg-layer' });
    sec.dataset.layerId = layer.id;
    sec.appendChild(el('h4', { className: 'lg-name', text: layer.label }));
    // A one-row legend already says its name in the row; a ramp, a class list or a grouped list gets the provider's title.
    const single = model.kind === 'solid' || model.kind === 'dot' || model.kind === 'dash';
    const sub = single ? '' : [model.label && model.label !== layer.label ? model.label : '', model.unit && model.kind !== 'ramp' ? `(${model.unit})` : ''].filter(Boolean).join(' ');
    if (sub) sec.appendChild(el('p', { className: 'lg-sub', text: sub }));
    const { node, rows } = bodyFor(model, layer);
    total += rows;
    sec.appendChild(node);
    if (model.note) sec.appendChild(el('p', { className: 'lg-note', text: model.note }));
    const src = el('p', { className: 'lg-src' });
    appendSourceText(src, sourceText(layer));
    sec.appendChild(src);
    mount.appendChild(sec);
  });
  mount.classList.toggle('many', total > 6);
}

// Re-draws when a layer's legend fills in (the Koppen classes arrive after the first toggle) and when a toggle happens
// outside the panel (an extension's control). Safe to call more than once.
export function initLegend() {
  if (subscribed) return;
  subscribed = true;
  on('map:legend', () => renderMapLegend());
}
