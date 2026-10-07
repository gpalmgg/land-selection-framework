// Qualitative (per-jurisdiction) filter UI: the r4 V1 layers as labelled selects. They FILTER; they never score or rank.
//
// One <select> per QUAL_FILTERS entry, mounted in #qual-filters. A choice updates state, re-runs the filter and writes
// ?q.<field>=<value> to the URL; 'any' (the default) clears that filter.
//
// Words. The option VALUES stay the internal enums (what the data files hold and what old shared links carry, so
// ?q.affordability_band=cheapest keeps parsing). The option TEXT is the display label from lib/qual-labels.js: native-unit
// price bands where the layer documents its band edges, otherwise the relative wording, and 'not read' where the layer's
// source did not say. No enum token and no superlative is ever printed; a label that fails that is a bug in qual-labels.js.

import * as DATA from '../data.js';
import { state } from '../state.js';
import { emit } from '../bus.js';
import { QUAL_FILTERS } from '../config/qual-filters.js';
import { qualOptions, qualLabel, QUAL_FIELDS } from '../../lib/qual-labels.js';
import { el } from './dom.js';
import { trackEvent } from './analytics.js';

// The client lookup's metadata (band edges for the affordability labels). data/v1-lookup.js exports it; read through the
// namespace so a data.js that does not re-export it yet simply gives the relative wording.
const v1Meta = DATA.v1Meta || {};

// Display name of a filter: the label map's, else its id with spaces. Never an underscore.
const filterLabel = (id) => (QUAL_FIELDS[id] && QUAL_FIELDS[id].label) || id.replace(/_/g, ' ');

// [{ value, label }] for one filter, in the filter's own option order. The text comes from qualOptions(); a value the label
// map does not list falls back to qualLabel(), which prints 'not read' rather than a token.
export function optionsFor(qf, meta = v1Meta) {
  const byValue = new Map(qualOptions(qf.id, meta).map((o) => [o.value, o.label]));
  return qf.options.map((value) => ({ value, label: byValue.has(value) ? byValue.get(value) : qualLabel(qf.id, value, meta) }));
}

// A sentence under the selects when the price bands are native-unit bands: what the unit is and what a missing price means.
function bandNote(meta) {
  const m = meta && meta.affordability_band;
  if (!m || m.relative || !m.edges || !m.unit) return '';
  return `Price bands are in ${m.unit} per hectare, converted from each country's currency. A region whose price could not be tied to an opened source reads "price not read" and sits in no band.`;
}

export function renderQualFilters() {
  const mount = document.getElementById('qual-filters');
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  for (const qf of QUAL_FILTERS) {
    const wrap = el('label', { className: 'qual-filter' });
    wrap.appendChild(el('span', { className: 'qual-filter-label', text: filterLabel(qf.id) }));
    const sel = document.createElement('select');
    sel.id = `qual-filter-${qf.id}`;
    sel.dataset.qualFilter = qf.id;
    sel.className = 'qual-filter-select';
    for (const opt of optionsFor(qf)) {
      const o = document.createElement('option');
      o.value = opt.value;
      o.textContent = opt.label;
      if (opt.value === state.qualFilters[qf.id]) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      state.qualFilters[qf.id] = sel.value;
      emit('refresh');
      emit('filters:change', { source: 'qual', immediate: true });
      trackEvent('qual_filter_change', { field: qf.id, value: sel.value });
    });
    wrap.appendChild(sel);
    mount.appendChild(wrap);
  }
  const note = bandNote(v1Meta);
  if (note) mount.appendChild(el('p', { className: 'qual-note', text: note }));
}
