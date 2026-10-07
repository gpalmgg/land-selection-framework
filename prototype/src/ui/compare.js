// The compare view: the pinned regions side by side. Columns are the regions in the ORDER THEY WERE PINNED (said on screen),
// never sorted by value or by thresholds met: the framework never ranks places, and nothing here is added up.
//
// Markup (final-spec 8.15): one real <table> with a <caption>, <th scope=col> column heads (the region's wave, its
// Salutation, name and country) and <th scope=row> row heads. Rows run in the reciprocity order: Tenure, Arriving in good
// faith, It asks of you, Place (text per region, nothing counted), then the eight criteria. Each criterion cell shows the
// value with its unit, the label, the trajectory where one is sourced, and beneath them the source, vintage and licence
// (the earlier compare view left the source off: a framework defect). A cell with no verified figure says "not yet verified"
// with its reason and its source, dashed, and is never a number.
//
// There is no cap on pins (a deliberate deviation from "up to six" in final-spec 8.15): the sticky first column and the
// horizontal scroll inside the card hold any number. No totals row or column, no highlighted cell, no sorting.
//
// UI modules may not import each other (import_graph rule 3), so the two small helpers the cards also use (the first sentence
// of "It asks of you", the Salutation markup) are restated here from lib/salutation.js and the same rule.

import { regions, values, criteria, bioregions, sources, loadFullData } from '../data.js';
import { state } from '../state.js';
import { on } from '../bus.js';
import { trackEvent } from './analytics.js';
import { open as openOverlay, close as closeOverlay, has as overlayHas } from './overlays.js';
import { salutation, LABEL as SAL_LABEL, CONTESTED_SUFFIX } from '../../lib/salutation.js';
import { esc, fmtCell, provenanceLine, trajectoryChip, GAP_VALUE, NOT_VERIFIED } from '../../lib/evidence-render.js';

const NOT_RECORDED = 'Not yet recorded';

// The two prose modules the reciprocity rows read (Land standing, "It asks of you") are not part of first paint (MC-PERF):
// openCompare() loads them once before it renders and fills these.
let landStanding = {};
let regionDepth = {};
const ABBREV = /(?:\b(?:St|Mr|Mrs|Ms|Dr|No|Nos|vs|etc|approx|Ltd|Co|Inc|Fig|cf|ca|c|e\.g|i\.e)|\b[A-Z])\.$/;

const text = (s) => (typeof s === 'string' && s.trim() ? s.trim() : '');
const mainName = (name) => String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || String(name || '');

// The first sentence of a text, never the second (the same rule as the card's "It asks of you"): a very long first sentence
// that carries a colon is cut at the colon.
function firstSentence(raw) {
  const s = String(raw == null ? '' : raw).replace(/\s+/g, ' ').trim();
  if (!s) return '';
  let end = -1;
  const re = /[.!?](?=\s+["“‘'(]?[A-ZÀ-Þ0-9]|\s*$)/g;
  let m;
  while ((m = re.exec(s))) {
    if (m[0] === '.' && ABBREV.test(s.slice(0, m.index + 1))) continue;
    end = m.index;
    break;
  }
  let one = (end < 0 ? s : s.slice(0, end + 1)).replace(/[.]$/, '');
  if (one.length > 150 && one.includes(':')) one = one.split(':')[0];
  return one + '.';
}

// "Whose land" (or "Whose land - contested", as real text) above the territory text.
function salutationHtml(id) {
  const sal = salutation(id);
  const flag = sal.contested ? '<span class="sal-flag">' + esc(CONTESTED_SUFFIX) + '</span>' : '';
  return '<p class="salutation"><span class="sal-k">' + esc(SAL_LABEL) + flag + '</span>'
    + '<span class="sal-v">' + esc(sal.text || NOT_RECORDED) + '</span></p>';
}

// The reciprocity rows: label, band class, and a function from region id to the text.
const RECIPROCITY_ROWS = [
  { label: 'Tenure', cls: 'band', read: (id) => text((landStanding[id] || {}).tenure) },
  { label: 'Arriving in good faith', cls: 'band', read: (id) => text((landStanding[id] || {}).entry) },
  { label: 'It asks of you', cls: 'band ask', read: (id) => firstSentence(text((regionDepth[id] || {}).asks)) },
  { label: 'Place', cls: 'band bio', read: (id) => text((bioregions[id] || {}).place) },
];

function columnHead(r) {
  return '<th scope="col" style="--region:' + esc(r.accent) + '"><div class="wave" aria-hidden="true"></div>'
    + salutationHtml(r.id)
    + '<div class="name">' + esc(mainName(r.name)) + '</div><div class="country">' + esc(r.country) + '</div></th>';
}

function reciprocityRow(row, cols) {
  const tds = cols.map((r) => {
    const t = row.read(r.id);
    return t ? '<td>' + esc(t) + '</td>' : '<td class="none">' + NOT_RECORDED + '</td>';
  }).join('');
  return '<tr class="' + row.cls + '"><th scope="row">' + esc(row.label) + '</th>' + tds + '</tr>';
}

// One criterion cell: value, label, trajectory, then the source line. Never a bare number.
export function criterionCell(cell, crit) {
  const f = fmtCell(cell, crit);
  if (f.text === NOT_VERIFIED) {
    const reason = f.reason ? '<div class="l">' + esc(f.reason) + '</div>' : '';
    return '<td class="gap"><div class="v">' + GAP_VALUE + '</div>' + reason
      + '<div class="s">' + provenanceLine(cell, crit, sources) + '</div></td>';
  }
  const unit = f.unit ? '<small>' + esc(f.unit) + '</small>' : '';
  const label = text(cell.label) ? '<div class="l">' + esc(cell.label) + '</div>' : '';
  const traj = trajectoryChip(cell);
  const src = provenanceLine(cell, crit, sources, { label: false, trajectory: false, retrieved: false, method: false });
  return '<td><div class="v">' + esc(f.text) + unit + '</div>' + label
    + (traj ? '<div class="t">' + traj + '</div>' : '') + '<div class="s">' + src + '</div></td>';
}

function criterionRow(c, cols) {
  const range = c.rangeLabel ? '<small>' + esc(c.rangeLabel) + '</small>' : '';
  const cells = cols.map((r) => criterionCell((values[r.id] || {})[c.id], c)).join('');
  return '<tr class="crit"><th scope="row">' + esc(c.name) + range + '</th>' + cells + '</tr>';
}

// The whole compare body for a list of region ids (in pin order), as HTML.
export function compareHtml(ids) {
  const cols = ids.map((id) => regions.find((r) => r.id === id)).filter(Boolean);
  if (!cols.length) {
    return '<p class="compare-empty">No regions pinned yet. Use Pin on any region card to add it here, then read your pins side by side.</p>';
  }
  const n = cols.length;
  const caption = n + ' pinned ' + (n === 1 ? 'region' : 'regions') + ': whose land, what each asks, the place, and the '
    + criteria.length + ' criteria with their sources';
  return '<p class="scroll-hint">Scroll sideways to read every column.</p>'
    + '<div class="compare-scroll" tabindex="0" role="region" aria-label="Pinned regions side by side (scrolls sideways)">'
    + '<table class="compare-table" style="--cols:' + n + '"><caption>' + esc(caption) + '</caption>'
    + '<thead><tr><th scope="col"><span class="sr-only">Row</span></th>' + cols.map(columnHead).join('') + '</tr></thead>'
    + '<tbody>' + RECIPROCITY_ROWS.map((row) => reciprocityRow(row, cols)).join('')
    + criteria.map((c) => criterionRow(c, cols)).join('') + '</tbody></table></div>';
}

export function renderCompare() {
  const body = document.getElementById('compare-body');
  if (!body) return;
  body.innerHTML = compareHtml([...state.shortlist]);
}

export async function openCompare() {
  const overlay = document.getElementById('compare-overlay');
  if (!overlay) return;
  // Focus is read before anything changes: it goes back here when the view closes (the overlay manager does it).
  const returnTo = document.activeElement;
  // A failed load leaves the reciprocity rows reading "Not yet recorded"; the criteria rows still render.
  try { const full = await loadFullData(); landStanding = full.landStanding; regionDepth = full.regionDepth; } catch (err) { console.error('Compare: reciprocity data did not load:', err); }
  renderCompare();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  // On the overlay manager (like the drawer): #main and the rail go inert, one Escape closes one layer, Tab stays inside, and
  // focus returns to the control that opened the view.
  openOverlay('compare-overlay', { panel: overlay, trigger: returnTo, onClose: hideCompare });
  const closeBtn = document.getElementById('compare-close');
  if (closeBtn) setTimeout(() => { if (overlayHas('compare-overlay')) closeBtn.focus(); }, 50);
  trackEvent('compare_open', { size: state.shortlist.size });
}

// The panel's own state: the manager calls this through onClose however the view closes (button, Escape, scrim click).
function hideCompare() {
  const overlay = document.getElementById('compare-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
}

export function closeCompare() {
  // close() runs hideCompare through onClose; the fallback covers a view that was never registered.
  if (!closeOverlay('compare-overlay')) hideCompare();
}

export function initCompare() {
  const btn = document.getElementById('shortlist-btn');
  if (btn) btn.addEventListener('click', () => { openCompare().catch((err) => console.error('Compare failed to open:', err)); });
  const closeBtn = document.getElementById('compare-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCompare);
  const overlay = document.getElementById('compare-overlay');
  if (overlay) overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCompare(); });
  // Escape and the Tab trap are the overlay manager's single document listener: nothing to bind here.

  // Keep an open compare view in step with pins made elsewhere (card Pin, drawer Pin).
  on('pin:changed', () => { if (document.getElementById('compare-overlay')?.classList.contains('open')) renderCompare(); });
  on('compare:open', () => { openCompare().catch((err) => console.error('Compare failed to open:', err)); });
}
