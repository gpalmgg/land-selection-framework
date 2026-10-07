// The summary table, "Everything together": every criterion for every region, in native units, rows in the slate's declared
// order. One table, no totals row or column, ever: nothing is added up, sorted or highlighted.
//
// Markup (final-spec 8.16): <table id="sum-table"> with a <caption class="sr-only"> that says there is no total, a sticky
// header row (a corner <th scope=col>, then one <th scope=col> per region: dot, short name, country) and a sticky first
// column of <th scope=row> row heads. The first body row is "Whose land" (the Salutation text of each region); then one row
// per criterion. A cell reads value and unit in ink, the label beneath. Where the cell has no verified figure it says
// "not yet verified" with its reason and is neither within nor outside any threshold.
//
// Provenance. The row head carries the criterion's source (a link), vintage and licence. When the regions of a criterion do
// not share one source or one vintage, each cell carries its own, so no value ever shows without them.
//
// A region outside the thresholds shades its WHOLE column (.region-fail: recessed ground and dashed inline borders), never
// by opacity and never by colour on the text. Every th and td of a region carries data-continent, so the active continent's
// columns are the visible ones (ui/continent-switcher.js). Ids kept: #sum-th-<region>, #sum-td-<region>-<criterion>.

import { regions, values, criteria } from '../data.js';
import { state } from '../state.js';
import { on } from '../bus.js';
import { el } from './dom.js';
import { salutation, LABEL as SAL_LABEL, CONTESTED_SUFFIX } from '../../lib/salutation.js';
import { fmtCell, GAP_VALUE, NOT_VERIFIED, LICENCE_NOT_CONFIRMED } from '../../lib/evidence-render.js';

const NOT_RECORDED = 'Not yet recorded';

// "Highlands (north-west Scotland)" -> "Highlands". UI modules may not import each other (import_graph rule 3), so the card's
// splitName() of ui/region-grid.js is restated here in one line.
const mainName = (name) => String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || String(name || '');

// region id -> every th/td of its column, built once at render: a refresh toggles classes on these, never queries.
let columns = new Map();
let lastFail = new Map();
let subscribed = false;

const sameAcross = (cells, field) => {
  const seen = new Set(cells.map((c) => (c && typeof c[field] === 'string' ? c[field].trim() : '')));
  return seen.size <= 1;
};

// "8 kWh/kWp/yr": the number as stored (fmtCell), then its unit. A cell without a figure reads "not yet verified".
function valueText(cell, crit) {
  const f = fmtCell(cell, crit);
  if (f.text === NOT_VERIFIED) return { gap: true, text: GAP_VALUE, reason: f.reason };
  return { gap: false, text: f.unit ? `${f.text} ${f.unit}` : f.text, reason: '' };
}

function critHead(crit, cells, uniformSource, uniformVintage) {
  const th = el('th', { attrs: { scope: 'row' } });
  th.appendChild(document.createTextNode(crit.name));
  const src = el('div', { className: 'crit-src' });
  const bits = [];
  const first = cells.find((c) => c && typeof c.value === 'number') || cells[0] || {};
  if (uniformSource) {
    const name = crit.source || first.source || '';
    const url = crit.sourceUrl || first.sourceUrl || '';
    if (name && url) {
      const a = el('a', { text: name, attrs: { href: url, target: '_blank', rel: 'noopener' } });
      bits.push(a);
    } else if (name) bits.push(document.createTextNode(name));
  } else {
    bits.push(document.createTextNode('sources named in each cell'));
  }
  const vintage = uniformVintage ? (first.vintage || '') : 'vintage in each cell';
  if (vintage) bits.push(document.createTextNode(vintage));
  const rest = [crit.nativeUnit, crit.license || LICENCE_NOT_CONFIRMED].filter(Boolean).join(' · ');
  if (rest) bits.push(document.createTextNode(rest));
  bits.forEach((b, i) => {
    if (i) src.appendChild(document.createTextNode(' · '));
    src.appendChild(b);
  });
  th.appendChild(src);
  return th;
}

function landCell(r) {
  const td = el('td', { className: 'sum-land' });
  td.id = `sum-td-${r.id}-land`;
  td.dataset.continent = r.continent;
  const sal = salutation(r.id);
  td.appendChild(el('span', { className: sal.text ? 'sal-v' : 'sal-v none', text: sal.text || NOT_RECORDED }));
  if (sal.contested) td.appendChild(el('span', { className: 'sal-flag', text: CONTESTED_SUFFIX }));
  return td;
}

export function renderSummaryTable() {
  const table = document.getElementById('sum-table');
  if (!table) return;
  while (table.firstChild) table.removeChild(table.firstChild);
  columns = new Map();
  lastFail = new Map();
  regions.forEach((r) => columns.set(r.id, []));
  if (!subscribed) {
    // The table is rendered once for every region, so its cells never go stale; a change of slate only forgets the shading memory.
    subscribed = true;
    on('cache:invalidate', () => { lastFail = new Map(); });
  }

  const cap = el('caption', { className: 'sr-only', text: 'Every criterion for every region on this continent, in the order of the slate. Nothing is added up: there is no total row and no total column. A shaded column is a region outside your thresholds.' });
  table.appendChild(cap);

  const thead = el('thead');
  const headRow = el('tr');
  headRow.appendChild(el('th', { text: 'Criterion', attrs: { scope: 'col' } }));
  regions.forEach((r) => {
    const th = el('th', { attrs: { scope: 'col' } });
    th.id = `sum-th-${r.id}`;
    th.dataset.continent = r.continent;
    th.style.setProperty('--region', r.accent);
    const name = el('span', { className: 'sum-name' });
    name.appendChild(el('span', { className: 'swatch', attrs: { 'aria-hidden': 'true' } }));
    name.appendChild(document.createTextNode(r.short || mainName(r.name)));
    th.appendChild(name);
    th.appendChild(el('span', { className: 'small', text: r.country }));
    headRow.appendChild(th);
    columns.get(r.id).push(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  // First row: whose land, the reading order the whole site keeps.
  const landRow = el('tr', { className: 'sum-land-row' });
  landRow.appendChild(el('th', { text: SAL_LABEL, attrs: { scope: 'row' } }));
  regions.forEach((r) => {
    const td = landCell(r);
    landRow.appendChild(td);
    columns.get(r.id).push(td);
  });
  tbody.appendChild(landRow);

  criteria.forEach((c) => {
    const cells = regions.map((r) => (values[r.id] || {})[c.id]);
    const uniformSource = sameAcross(cells, 'source');
    const uniformVintage = sameAcross(cells, 'vintage');
    const tr = el('tr');
    tr.appendChild(critHead(c, cells, uniformSource, uniformVintage));
    regions.forEach((r) => {
      const cell = (values[r.id] || {})[c.id];
      const td = el('td');
      td.id = `sum-td-${r.id}-${c.id}`;
      td.dataset.continent = r.continent;
      const v = valueText(cell, c);
      if (v.gap) td.classList.add('gap');
      td.appendChild(el('div', { className: 'v', text: v.text }));
      const lab = v.gap ? v.reason : (cell && cell.label) || '';
      if (lab) td.appendChild(el('span', { className: 'lab', text: lab }));
      if (!v.gap && (!uniformSource || !uniformVintage) && cell) {
        const own = [!uniformSource ? cell.source : '', !uniformVintage ? cell.vintage : ''].filter(Boolean).join(' · ');
        if (own) td.appendChild(el('span', { className: 'vin', text: own }));
      }
      tr.appendChild(td);
      columns.get(r.id).push(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// Shades the whole column of every region that misses a threshold. A region with a gap is not shaded: it is not outside.
export function updateSummary() {
  regions.forEach((r) => {
    const fail = !state.passing[r.id];
    if (lastFail.get(r.id) === fail) return;
    lastFail.set(r.id, fail);
    (columns.get(r.id) || []).forEach((n) => n.classList.toggle('region-fail', fail));
  });
}
