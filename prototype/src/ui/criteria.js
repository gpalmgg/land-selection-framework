// Criterion blocks: one per criterion, each a working object. The head says what the criterion is and which moment it
// reads (the epoch badge); the ruler is a real range input over a custom rule; the plot sets one DOT per region on the
// SAME axis as the ruler, in the order the regions were written. The sliders FILTER (a floor or a ceiling); nothing here
// scores, sums, sorts or ranks. A dot is a position, never a length: there are no bars.
//
// Markup (final-spec 8.9). Kept ids and classes: #crit-<id>, #slider-<id>, #slider-val-<id>, #slider-hint-<id>,
// #slider-note-<id>, #bars-<id>, .crit-card, .bar-row.
//   article.crit-card#crit-<id>[data-dir=min|max][data-active]
//     .head          eyebrow, h3, metric, framing, .epoch, .slider-filter-note, .credit, .scenario
//     .plot
//       .ruler-head  .plot-grid.ruler-row (label | .ruler > input[type=range] | readout) + .plot-grid.ticks-row
//       .slider-hint
//       .bar-rows#bars-<id>   .bar-row.plot-grid[data-region][data-state=within|outside|gap][.fail][.gap]
//                             .reg | .bar-track (axis, zones, .bar-threshold, .pt) | .bar-val (+ sr-only .bar-mark)
//       ul.plot-key
//       details.sources
//     .footer
//
// Cost of a slider tick. renderCriterionCard() keeps every element updateCriteria() touches (rows, dots, readout, hint)
// in a per-criterion entry, so a tick does no querySelector and no getElementById. Rows carry the threshold as the CSS
// custom property --p (0..1 along the axis); CSS draws the zones, the threshold line and the thumb position from it. A
// criterion whose threshold and continent did not change since its last update is skipped, and the refresh orchestrator's
// cache:invalidate event clears that memory.

import { regions, values, criteria } from '../data.js';
import { state } from '../state.js';
import { emit, on } from '../bus.js';
import { el } from './dom.js';
import { normalize } from '../../lib/format.js';
import { fmtCell, fmtNumber, GAP_VALUE, LICENCE_NOT_CONFIRMED } from '../../lib/evidence-render.js';
import { thresholdDirection, thresholdDefault, thresholdStep } from '../../lib/filters.js';
import { buildSourcesBlock } from './criteria-sources.js';

// How many names the "Within: ..." hint lists before it says "and N more" (every name stays reachable behind the button).
export const HINT_NAMES = 8;

// The theme words of the eyebrow ("Criterion · energy"): the map's own themes, so one word means one thing everywhere.
const CRITERION_GROUPS = {
  climate: 'climate & water',
  water_stress: 'climate & water',
  soil_carbon: 'land & soil',
  forest_change: 'land & soil',
  solar_pv: 'energy',
  conflict: 'hazards',
  regen_network: 'people & access',
  population: 'people & access',
};

const groupOf = (crit) => (typeof crit.group === 'string' && crit.group.trim()) || CRITERION_GROUPS[crit.id] || '';
const stepOf = (crit) => (typeof crit.step === 'number' && crit.step > 0 ? crit.step : thresholdStep(crit));
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

// Spoken value for a threshold slider, e.g. "at least 1,200 kWh/kWp/yr": mirrors the filter semantics (a floor or a
// ceiling), never a score or a rank. The number is printed as stored (fmtNumber), not rounded.
export function sliderValueText(crit, th) {
  const verb = thresholdDirection(crit.higherIs) === 'min' ? 'at least' : 'at most';
  return `${verb} ${fmtNumber(th)} ${crit.rangeLabel}`.trim();
}

// Five to nine tick values in the criterion's native units, on round numbers inside [rangeMin, rangeMax].
export function tickValues(lo, hi) {
  const span = hi - lo;
  if (!(span > 0)) return [lo];
  const exp = Math.floor(Math.log10(span));
  let best = null;
  for (let k = exp - 2; k <= exp + 1; k++) {
    for (const m of [1, 2, 4, 5]) {
      const step = m * Math.pow(10, k);
      const first = Math.ceil(lo / step - 1e-9);
      const last = Math.floor(hi / step + 1e-9);
      const n = last - first + 1;
      if (n < 5 || n > 9) continue;
      // fewest ticks first, but prefer 5 to 7 over 8 or 9
      const score = (n > 7 ? 100 : 0) + n;
      if (!best || score < best.score) best = { score, step, first, last };
    }
  }
  if (!best) return [lo, lo + span / 4, lo + span / 2, lo + (3 * span) / 4, hi];
  const out = [];
  for (let i = best.first; i <= best.last; i++) out.push(Math.round(i * best.step * 1e6) / 1e6);
  return out;
}

// Thins the tick labels to what fits: when the axis is narrow (a 1280 px screen gives the plot about 160 px) every other label
// (or every third) is hidden so no two overlap. The remaining ones keep their native-unit values and positions.
let tickObserver = null;
function thinTicks(ticks) {
  const spans = ticks.children;
  const n = spans.length;
  const w = ticks.clientWidth;
  if (n < 2 || !w) return;
  let chars = 0;
  for (let i = 0; i < n; i++) chars = Math.max(chars, spans[i].textContent.length);
  const need = chars * 6.6 + 12;                       // px a label needs (11 px Inter) plus a gap
  const spacing = w * (parseFloat(spans[1].style.left) - parseFloat(spans[0].style.left)) / 100;
  const k = Math.max(1, Math.ceil(need / spacing));
  for (let i = 0; i < n; i++) spans[i].hidden = i % k !== 0;
}
function watchTicks(ticks) {
  if (typeof ResizeObserver !== 'function') return;
  if (!tickObserver) tickObserver = new ResizeObserver((list) => list.forEach((en) => thinTicks(en.target)));
  tickObserver.observe(ticks);
}

// What the epoch badge says. Hatched glyph = a projection (or an unstated kind); solid = observed. A criterion with no
// window gets the hatched "window not stated" fallback, never a guessed year.
function epochBadge(crit) {
  const w = crit.window && typeof crit.window === 'object' ? crit.window : null;
  let label = '';
  if (w) {
    label = (typeof w.label === 'string' && w.label.trim()) || '';
    if (!label && isNum(w.from)) label = isNum(w.to) && w.to !== w.from ? `${w.from}–${w.to}` : String(w.from);
  }
  if (!label) {
    const p = el('p', { className: 'epoch unstated' });
    p.appendChild(el('i', { className: 'p', attrs: { 'aria-hidden': 'true' } }));
    p.appendChild(el('span', { text: 'Window not stated' }));
    return p;
  }
  const kind = w && typeof w.kind === 'string' ? w.kind.trim() : '';
  const p = el('p', { className: 'epoch' });
  p.dataset.kind = kind || 'unknown';
  p.appendChild(el('i', { className: kind === 'observed' ? '' : 'p', attrs: { 'aria-hidden': 'true' } }));
  p.appendChild(el('span', { text: `Reads ${label}${kind ? ` · ${kind}` : ''}` }));
  return p;
}

// "Askja's framework metric 7 · native unit ... · licence ...": explains the number (it is the framework's own metric
// number, an id, not a rank).
function creditLine(crit) {
  const parts = [];
  if (isNum(crit.askjaNumber)) parts.push(`Askja’s framework metric ${crit.askjaNumber}`);
  if (crit.nativeUnit) parts.push(`native unit ${crit.nativeUnit}`);
  parts.push(`licence ${crit.license || LICENCE_NOT_CONFIRMED}`);
  return parts.join(' · ');
}

function filterNote(dir) {
  return dir === 'min'
    ? 'Drag the stone, or use the arrow keys. Regions at or over the line stay filled; the rest stay on the page, drawn open. A floor filters; it never scores.'
    : 'Drag the stone, or use the arrow keys. Regions at or under the line stay filled; the rest stay on the page, drawn open. A ceiling filters; it never scores.';
}

// One region's row on the plot. The dot's place on the axis is --v (0..1); the threshold position --p is set on update.
function buildRow(r, crit) {
  const cell = (values[r.id] && values[r.id][crit.id]) || null;
  const f = fmtCell(cell, crit);
  const num = cell && isNum(cell.value) ? cell.value : null;

  const row = el('div', { className: `bar-row plot-grid${num === null ? ' gap' : ''}` });
  row.dataset.region = r.id;
  row.dataset.crit = crit.id;
  row.dataset.continent = r.continent;
  row.dataset.state = num === null ? 'gap' : 'within';
  row.style.setProperty('--region', r.accent);

  const reg = el('div', { className: 'reg' });
  reg.title = r.name; // the full name on hover; the row uses the short form so long names never overflow
  reg.appendChild(el('span', { className: 'rn', text: r.short || r.name }));
  if (r.country) reg.appendChild(el('small', { text: r.country }));
  row.appendChild(reg);

  const track = el('div', { className: 'bar-track', attrs: { 'aria-hidden': 'true' } });
  track.appendChild(el('span', { className: 'axis' }));
  let pt = null;
  if (num !== null) {
    track.appendChild(el('span', { className: 'zone in' }));
    track.appendChild(el('span', { className: 'zone out' }));
    track.appendChild(el('span', { className: 'bar-threshold' }));
    pt = el('span', { className: 'pt' });
    pt.style.setProperty('--v', String(normalize(num, crit.rangeMin, crit.rangeMax)));
    track.appendChild(pt);
  }
  row.appendChild(track);

  const val = el('div', { className: 'bar-val' });
  if (num === null) {
    val.appendChild(el('span', { className: 'vn gap-v', text: GAP_VALUE }));
    val.appendChild(el('small', { className: 'vl', text: f.reason || 'Re-check pending: neither within nor outside, and never counted.' }));
    if (cell && cell.vintage) val.appendChild(el('small', { className: 'vi', text: cell.vintage }));
  } else {
    const line = el('span', { className: 'vn', text: f.text });
    if (f.unit) { line.appendChild(document.createTextNode(' ')); line.appendChild(el('span', { className: 'vu', text: f.unit })); }
    val.appendChild(line);
    if (cell.label) val.appendChild(el('small', { className: 'vl', text: cell.label, attrs: { title: cell.label } }));
    if (cell.vintage) val.appendChild(el('small', { className: 'vi', text: cell.vintage, attrs: { title: cell.vintage } }));
  }
  row.appendChild(val);

  const mark = el('span', { className: 'bar-mark sr-only', text: num === null ? 'not yet verified, not counted' : '' });
  row.appendChild(mark);

  return { el: row, mark, value: num, continent: r.continent, name: r.short || r.name, state: num === null ? 'gap' : '' };
}

// One entry per criterion: the elements the update touches, kept from render time.
const entries = new Map();

export function renderCriterionCard(crit, isFirst) {
  const dir = thresholdDirection(crit.higherIs);
  const word = dir === 'min' ? 'floor' : 'ceiling';
  const th0 = state.thresholds[crit.id];

  const card = el('article', { className: 'crit-card' });
  card.id = `crit-${crit.id}`;
  card.dataset.crit = crit.id;
  card.dataset.dir = dir;
  card.setAttribute('aria-labelledby', `crit-h-${crit.id}`);

  // ---- Head ----------------------------------------------------------------------------------------------------
  const head = el('div', { className: 'head' });
  const group = groupOf(crit);
  head.appendChild(el('p', { className: 'eyebrow', text: group ? `Criterion · ${group}` : 'Criterion' }));
  const h3 = el('h3', { text: crit.name });
  h3.id = `crit-h-${crit.id}`;
  head.appendChild(h3);
  head.appendChild(el('p', { className: 'metric', text: crit.metric }));
  head.appendChild(el('p', { className: 'framing', text: crit.framing }));
  head.appendChild(epochBadge(crit));
  head.appendChild(el('p', { className: 'slider-filter-note', text: filterNote(dir), attrs: { id: `slider-note-${crit.id}` } }));
  head.appendChild(el('p', { className: 'credit', text: creditLine(crit) }));
  if (crit.scenarioLine) head.appendChild(el('p', { className: 'scenario', text: crit.scenarioLine }));
  card.appendChild(head);

  // ---- Plot: the ruler ------------------------------------------------------------------------------------------
  const plot = el('div', { className: 'plot' });
  const rulerHead = el('div', { className: 'ruler-head' });

  const rulerRow = el('div', { className: 'plot-grid ruler-row' });
  rulerRow.appendChild(el('label', {
    className: 'slider-label',
    text: dir === 'min' ? 'At least' : 'At most',
    attrs: { for: `slider-${crit.id}` },
  }));

  const ruler = el('div', { className: 'ruler' });
  ruler.appendChild(el('span', { className: 'line' }));
  ruler.appendChild(el('span', { className: 'zone out' }));
  ruler.appendChild(el('span', { className: 'zone in' }));

  // aria-describedby: the live "Within: ..." hint, plus (on the first slider only) the filters-not-ranks note.
  const describedBy = `slider-hint-${crit.id}` + (isFirst ? ` slider-note-${crit.id}` : '');
  const slider = el('input', {
    attrs: {
      type: 'range',
      id: `slider-${crit.id}`,
      min: String(crit.rangeMin),
      max: String(crit.rangeMax),
      step: String(stepOf(crit)),
      value: String(th0),
      'aria-label': `${crit.name} threshold — ${dir === 'min' ? 'at least' : 'at most'} ${crit.rangeLabel}`,
      'aria-valuetext': sliderValueText(crit, th0),
      'aria-describedby': describedBy,
    },
  });
  slider.addEventListener('input', (e) => {
    state.thresholds[crit.id] = parseFloat(e.target.value);
    emit('refresh');
    emit('filters:change', { source: 'slider' });
  });
  ruler.appendChild(slider);
  rulerRow.appendChild(ruler);

  const readout = el('div', { className: 'slider-val' });
  readout.id = `slider-val-${crit.id}`;
  const readoutN = el('span', { className: 'rv-n' });
  readout.appendChild(readoutN);
  readout.appendChild(el('small', { className: 'u', text: crit.rangeLabel }));
  rulerRow.appendChild(readout);
  rulerHead.appendChild(rulerRow);

  // Ticks, in native units, on the same column as the ruler and the plot axis.
  const ticksRow = el('div', { className: 'plot-grid ticks-row', attrs: { 'aria-hidden': 'true' } });
  ticksRow.appendChild(el('span'));
  const ticks = el('div', { className: 'ticks' });
  tickValues(crit.rangeMin, crit.rangeMax).forEach((v) => {
    const t = el('span', { text: fmtNumber(v) });
    t.style.left = `${normalize(v, crit.rangeMin, crit.rangeMax) * 100}%`;
    ticks.appendChild(t);
  });
  ticksRow.appendChild(ticks);
  watchTicks(ticks);
  ticksRow.appendChild(el('span'));
  rulerHead.appendChild(ticksRow);
  plot.appendChild(rulerHead);

  // ---- The hint: who is within (capped), and how many cells cannot be checked --------------------------------------
  const hint = el('div', { className: 'slider-hint' });
  hint.id = `slider-hint-${crit.id}`;
  const hintText = el('span', { className: 'hint-text' });
  const hintMore = el('button', { className: 'hint-more', attrs: { type: 'button', 'aria-expanded': 'false' } });
  hintMore.hidden = true;
  const hintGap = el('span', { className: 'hint-gap' });
  hint.appendChild(hintText);
  hint.appendChild(hintMore);
  hint.appendChild(hintGap);
  plot.appendChild(hint);

  // ---- The plot: one row per region, in declared order, never sorted --------------------------------------------
  const bars = el('div', { className: 'bar-rows' });
  bars.id = `bars-${crit.id}`;
  const rows = regions.map((r) => {
    const built = buildRow(r, crit);
    bars.appendChild(built.el);
    return built;
  });
  plot.appendChild(bars);

  const key = el('ul', { className: 'plot-key' });
  [
    ['fill', `Within your ${word}`],
    ['open', 'Outside it, drawn open, still on the page'],
    ['cut', 'Your threshold'],
    ['gapk', 'Not yet verified: shown, never guessed'],
  ].forEach(([k, text]) => {
    const li = el('li');
    li.appendChild(el('span', { className: `k ${k}`, attrs: { 'aria-hidden': 'true' } }));
    li.appendChild(document.createTextNode(text));
    key.appendChild(li);
  });
  plot.appendChild(key);

  // The per-value sources, collapsed, built here (no timing hack, no hook).
  plot.appendChild(buildSourcesBlock(crit));
  card.appendChild(plot);

  // ---- Foot -----------------------------------------------------------------------------------------------------
  const footer = el('div', { className: 'footer' });
  footer.appendChild(el('b', { text: 'Source' }));
  footer.appendChild(document.createTextNode(' '));
  footer.appendChild(el('a', { text: crit.source, attrs: { href: crit.sourceUrl, target: '_blank', rel: 'noopener' } }));
  const w = crit.window && typeof crit.window.label === 'string' ? crit.window.label : '';
  footer.appendChild(document.createTextNode(
    ` · vintage ${w || 'stated per value, under Sources'} · native unit ${crit.nativeUnit} · licence ${crit.license || LICENCE_NOT_CONFIRMED}` +
    ' · rows are in the order the regions were written, never sorted by value.'
  ));
  card.appendChild(footer);

  entries.set(crit.id, {
    crit, dir, word, def: thresholdDefault(crit), card, slider, readoutN, ruler, rows,
    hintText, hintMore, hintGap, hintOpen: false, key: null,
  });
  hintMore.addEventListener('click', () => {
    const e = entries.get(crit.id);
    if (!e) return;
    e.hintOpen = !e.hintOpen;
    e.key = null; // force the hint to redraw
    updateCriteria();
  });

  return card;
}

export function renderCriteriaGrid() {
  const grid = document.getElementById('crit-grid');
  entries.clear();
  grid.textContent = '';
  criteria.forEach((c, i) => grid.appendChild(renderCriterionCard(c, i === 0)));
}

// A cache:invalidate (the active continent or the number of regions changed) clears every entry's memory.
on('cache:invalidate', () => entries.forEach((e) => { e.key = null; }));

function drawHint(e, th, isActive) {
  const { dir, rows } = e;
  const gaps = rows.filter((r) => r.continent === state.continent && r.value === null).length;
  e.hintGap.textContent = gaps
    ? ` ${gaps} ${gaps === 1 ? 'region has' : 'regions have'} no verified figure here and ${gaps === 1 ? 'is' : 'are'} not counted.`
    : '';
  if (!isActive) {
    e.hintText.textContent = dir === 'min' ? 'Slide right to require more.' : 'Slide left to require less.';
    e.hintMore.hidden = true;
    return;
  }
  const names = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (r.continent === state.continent && r.state === 'within') names.push(r.name);
  }
  if (!names.length) {
    e.hintText.textContent = `No regions are within this ${e.word}.`;
    e.hintMore.hidden = true;
    return;
  }
  if (names.length <= HINT_NAMES) {
    e.hintText.textContent = `Within: ${names.join(', ')}.`;
    e.hintMore.hidden = true;
    return;
  }
  if (e.hintOpen) {
    e.hintText.textContent = `Within: ${names.join(', ')}. `;
    e.hintMore.textContent = 'show fewer';
    e.hintMore.setAttribute('aria-expanded', 'true');
  } else {
    e.hintText.textContent = `Within: ${names.slice(0, HINT_NAMES).join(', ')} and `;
    e.hintMore.textContent = `${names.length - HINT_NAMES} more`;
    e.hintMore.setAttribute('aria-expanded', 'false');
  }
  e.hintMore.hidden = false;
}

// The per-criterion part of a refresh: slider value and spoken value, the "Within: ..." hint, the threshold position
// (--p) on the ruler and on every row, and per-row within / outside state. A gap row (no figure) is neither: it is left
// as it was drawn and never counted.
export function updateCriteria() {
  entries.forEach((e) => {
    const th = state.thresholds[e.crit.id];
    const key = `${th}|${state.continent}|${e.hintOpen ? 1 : 0}`;
    if (e.key === key) return;
    e.key = key;

    const c = e.crit;
    const isActive = th !== e.def;
    const p = String(normalize(th, c.rangeMin, c.rangeMax));
    const min = e.dir === 'min';

    e.card.dataset.active = isActive ? 'true' : 'false';
    if (Number(e.slider.value) !== th) e.slider.value = String(th);
    e.slider.setAttribute('aria-valuetext', sliderValueText(c, th));
    e.readoutN.textContent = fmtNumber(th);
    e.ruler.style.setProperty('--p', p);

    // Only the active continent's rows are drawn (the other continent's are display:none), so only they are written; a
    // continent switch changes the key above and brings the other half up to date.
    const rows = e.rows;
    const cont = state.continent;
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      if (r.continent !== cont) continue;
      r.el.style.setProperty('--p', p);
      if (r.value === null) continue;
      const within = min ? r.value >= th : r.value <= th;
      const next = within ? 'within' : 'outside';
      if (r.state === next) continue;
      r.state = next;
      r.el.dataset.state = next;
      r.el.classList.toggle('fail', !within);
      r.mark.textContent = `${next} your ${e.word}`;
    }
    drawHint(e, th, isActive);
  });
}
