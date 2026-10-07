// Region cards: one card per region, all rendered up front, shown or hidden per continent by CSS.
//
// A card is a folded leaf: place above the fold, what living there asks of you below it, equal weight.
//   wave -> Salutation ("Whose land") -> name -> country -> place line -> blurb | fold | It asks of you | status + Pin
//
// Markup contract (final-spec 8.8): <article class="region-card [fail]" style="--region:#hex" aria-labelledby="nm-<id>">.
// The card is NOT a button and holds no nested interactive control: the name is a real <button> inside the <h3> and its
// ::after is stretched over the card, so a click anywhere opens the drawer (bus: drawer:open); the Pin button is a sibling
// above that layer and stops propagation (bus: pin:toggle).
//
// Outside the thresholds the card keeps toggling `.fail`: a dashed border, the recessed ground, a hatched status mark and a
// reason line, never faded text. The status (within / outside) is shown only while a filter is active.

import { regions, cardAsks, bioregions } from '../data.js';
import { state, filterData } from '../state.js';
import { emit, on } from '../bus.js';
import { el } from './dom.js';
import { salutation, LABEL as SAL_LABEL, CONTESTED_SUFFIX } from '../../lib/salutation.js';
import { failReasons, anyFilterActive, cellState, thresholdDefault, thresholdStep } from '../../lib/filters.js';
import { qualLabel, QUAL_FIELDS } from '../../lib/qual-labels.js';

export const PIN_ICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M5 2.5h6M6.2 2.5l-.4 4.2L4 8.5h8l-1.8-1.8-.4-4.2M8 8.5v5.2"/></svg>';

const WITHIN = 'Within your thresholds';
const OUTSIDE = 'Outside your thresholds';

// Words that end in a full stop without ending a sentence.
const ABBREV = /(?:\b(?:St|Mr|Mrs|Ms|Dr|No|Nos|vs|etc|approx|Ltd|Co|Inc|Fig|cf|ca|c|e\.g|i\.e)|\b[A-Z])\.$/;

// The first sentence of a text, never the second. A very long first sentence that carries a colon is cut at the colon
// (the lead clause stands on its own and the drawer holds the rest).
export function firstSentence(text) {
  const s = String(text == null ? '' : text).replace(/\s+/g, ' ').trim();
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

// "Highlands (north-west Scotland)" -> { main: 'Highlands', desc: 'north-west Scotland' }. A name with no parenthesis
// keeps everything in main.
export function splitName(name) {
  const m = /^(.*?)\s*\(([^)]*)\)\s*$/.exec(String(name || ''));
  if (m && m[1]) return { main: m[1].trim(), desc: m[2].trim() };
  return { main: String(name || '').trim(), desc: '' };
}

// ---------------------------------------------------------------------------------------------------- reason lines
function decimalsOf(step) {
  if (!(step > 0) || Number.isInteger(step)) return 0;
  const s = String(step);
  const dot = s.indexOf('.');
  return dot < 0 ? 0 : Math.min(3, s.length - dot - 1);
}
const fmtN = (n, d) => n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: d });

// A figure and a threshold in the criterion's own precision; when they would print the same, the figure gets more digits
// (up to three) so "1.5; your ceiling is 1.5" can never describe a region that is outside.
function figureAndThreshold(crit, value, threshold) {
  const d = decimalsOf(typeof crit.step === 'number' ? crit.step : thresholdStep(crit));
  const t = fmtN(threshold, d);
  let k = d;
  let v = fmtN(value, k);
  while (v === t && k < 3) { k += 1; v = fmtN(value, k); }
  return { v, t };
}

// One reason as a plain sentence: "Solar PV potential 1,150 kWh/kWp/yr; your floor is 1,200."
export function reasonSentence(regionId, reason, data) {
  if (reason.kind === 'qual') {
    const label = (QUAL_FIELDS[reason.filterId] && QUAL_FIELDS[reason.filterId].label) || reason.filterId.replace(/_/g, ' ');
    return `${label} reads ${qualLabel(reason.filterId, reason.got)}; you chose ${qualLabel(reason.filterId, reason.want)}.`;
  }
  const crit = data.criteria.find((c) => c.id === reason.critId);
  const cell = data.values[regionId] && data.values[regionId][reason.critId];
  const { v, t } = figureAndThreshold(crit, reason.value, reason.threshold);
  const unit = cell && cell.unit ? ` ${cell.unit}` : '';
  const bound = reason.direction === 'min' ? 'floor' : 'ceiling';
  return `${crit.name} ${v}${unit}; your ${bound} is ${t}.`;
}

// The reason line of a card outside the thresholds: the first failing criterion in declared order, plus "And N more."
export function reasonLine(regionId, st, data) {
  const reasons = failReasons(regionId, st, data);
  if (!reasons.length) return '';
  const first = reasonSentence(regionId, reasons[0], data);
  return reasons.length > 1 ? `${first} And ${reasons.length - 1} more.` : first;
}

// A region with no verified figure for a criterion the visitor has moved: the threshold cannot be checked there.
export function gapLine(regionId, st, data) {
  const names = data.criteria
    .filter((c) => st.thresholds[c.id] !== thresholdDefault(c) && cellState(regionId, c.id, st, data) === 'gap')
    .map((c) => c.name);
  if (!names.length) return '';
  return `No verified figure yet for ${names.join(' and ')}; that threshold is not applied here.`;
}

// ---------------------------------------------------------------------------------------------------------- render
export function renderSalutation(regionId) {
  const sal = salutation(regionId);
  const p = el('p', { className: 'salutation' });
  const k = el('span', { className: 'sal-k', text: SAL_LABEL });
  if (sal.contested) k.appendChild(el('span', { className: 'sal-flag', text: CONTESTED_SUFFIX }));
  p.appendChild(k);
  p.appendChild(el('span', { className: 'sal-v', text: sal.text || 'Not yet recorded' }));
  return p;
}

function buildCard(r) {
  const card = el('article', { className: 'region-card' });
  card.id = `region-${r.id}`;
  card.dataset.region = r.id;
  card.dataset.continent = r.continent;
  card.style.setProperty('--region', r.accent);
  card.setAttribute('aria-labelledby', `nm-${r.id}`);
  // Focusable by script only (never a tab stop): lets code and tests return focus to the card and lets Enter open it.
  card.tabIndex = -1;

  card.appendChild(el('div', { className: 'wave', attrs: { 'aria-hidden': 'true' } }));

  const body = el('div', { className: 'card-body' });
  body.appendChild(renderSalutation(r.id));

  const { main, desc } = splitName(r.name);
  const h3 = el('h3', { className: 'name' });
  h3.id = `nm-${r.id}`;
  const open = el('button', { className: 'region-open', text: main, attrs: { type: 'button', 'aria-label': r.name, 'aria-haspopup': 'dialog' } });
  open.addEventListener('click', () => emit('drawer:open', { regionId: r.id }));
  h3.appendChild(open);
  body.appendChild(h3);
  if (desc) body.appendChild(el('p', { className: 'desc', text: desc }));

  body.appendChild(el('div', { className: 'country', text: r.country }));
  const place = bioregions[r.id] && bioregions[r.id].place;
  if (place) body.appendChild(el('p', { className: 'place-line', text: place }));
  body.appendChild(el('p', { className: 'blurb', text: r.blurb }));
  card.appendChild(body);

  card.appendChild(el('div', { className: 'fold', attrs: { 'aria-hidden': 'true' } }));

  // "It asks of you": reciprocity first-class on the card, no click needed. First sentence only.
  // (cardAsks is the first sentence, precomputed by scripts/gen_load_slim.mjs so region-depth.js stays off the first-paint path.)
  const asks = el('div', { className: 'card-asks' });
  asks.appendChild(el('span', { className: 'card-asks-label', text: 'It asks of you' }));
  const sentence = cardAsks[r.id] || '';
  asks.appendChild(el('p', { text: sentence || 'What living here asks of you is set out in the region detail.' }));
  card.appendChild(asks);

  const foot = el('div', { className: 'card-foot' });
  // Status: present in the DOM, empty and hidden until a filter is active.
  const status = el('div', { className: 'status' });
  status.hidden = true;
  const st = el('span', { className: 'st' });
  st.appendChild(el('i', { attrs: { 'aria-hidden': 'true' } }));
  st.appendChild(el('span', { className: 'st-t' }));
  status.appendChild(st);
  status.appendChild(el('span', { className: 'why' }));
  foot.appendChild(status);

  // Pin toggles shortlist membership (a set, never ranked); stopPropagation so it never opens the drawer.
  const pin = el('button', { className: 'region-pin region-star', attrs: { type: 'button', 'aria-pressed': 'false', 'aria-label': `Pin ${r.name}` } });
  pin.innerHTML = PIN_ICON;
  pin.appendChild(el('span', { text: 'Pin' }));
  pin.addEventListener('click', (e) => { e.stopPropagation(); emit('pin:toggle', { regionId: r.id }); });
  foot.appendChild(pin);
  card.appendChild(foot);

  // Enter on the card itself (focus returned to it, or put there by script) opens the drawer like the name button does.
  card.addEventListener('keydown', (e) => {
    if (e.target === card && e.key === 'Enter') { e.preventDefault(); emit('drawer:open', { regionId: r.id }); }
  });
  return card;
}

export function renderRegionGrid() {
  const grid = document.getElementById('region-grid');
  if (!grid) return;
  refs = null;
  regions.forEach((r) => grid.appendChild(buildCard(r)));
}

// ---------------------------------------------------------------------------------------------------------- update
// Element lookups live in a map built once and dropped when the refresh orchestrator says the page changed shape.
let refs = null;
on('cache:invalidate', () => { refs = null; });

function getRefs() {
  if (refs) return refs;
  refs = regions.map((r) => {
    const card = document.getElementById(`region-${r.id}`);
    if (!card) return null;
    return {
      id: r.id,
      card,
      status: card.querySelector('.status'),
      label: card.querySelector('.st-t'),
      why: card.querySelector('.why'),
      last: { fail: null, shown: null, label: null, why: null },
    };
  }).filter(Boolean);
  return refs;
}

// The card part of a refresh: mark the cards outside the thresholds and, while a filter is active, say within or outside
// and why. With no filter set the status is empty and hidden: a page that has asked nothing yet has nothing to report.
export function updateCards() {
  const active = anyFilterActive(state, filterData);
  getRefs().forEach((c) => {
    const fail = !state.passing[c.id];
    let label = '';
    let why = '';
    if (active) {
      label = fail ? OUTSIDE : WITHIN;
      why = fail ? reasonLine(c.id, state, filterData) : gapLine(c.id, state, filterData);
    }
    const l = c.last;
    if (l.fail !== fail) { c.card.classList.toggle('fail', fail); l.fail = fail; }
    if (l.shown !== active) { if (c.status) c.status.hidden = !active; l.shown = active; }
    if (l.label !== label) { if (c.label) c.label.textContent = label; l.label = label; }
    if (l.why !== why) { if (c.why) { c.why.textContent = why; c.why.classList.toggle('gap', !fail && !!why); } l.why = why; }
  });
}
