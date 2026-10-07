// The match bar: how many regions in view are within the visitor's thresholds, and who they are.
//
// The count is a FILTER count, never a score. Three kinds of region exist:
//   within   every threshold the visitor moved is met by a verified figure (or no threshold is moved)
//   outside  at least one verified figure misses a threshold, or a qualitative filter does not match
//   gap      not outside, but at least one moved threshold has no verified figure for this region
// A gap region is neither within nor outside: it is never counted as passing and never counted as failing. The bar says
// "N within your thresholds, M with gaps" and lists the two groups apart.
//
// The chips are a membership list in the slate's declared order, never ranked: up to CHIP_NAMES names, then an "and N more"
// button that reveals the rest. Every name stays reachable.
//
// Markup (index.html): #match-count, #match-total, #match-detail (+ #match-gap-note), #match-announce, #match-regions,
// #reset-btn, #share-btn, #shortlist-btn, #share-note. Reset and Share are wired in ui/reset.js and ui/share.js; the pins
// button in ui/compare.js and ui/shortlist.js.

import { state, filterData, runtime } from '../state.js';
import { emit, on } from '../bus.js';
import { el } from './dom.js';
import { anyFilterActive, activeRegions, cellState, thresholdDefault } from '../../lib/filters.js';

// How many chip names show before "and N more" (the same cap as the slider hint in ui/criteria.js).
export const CHIP_NAMES = 8;

// "Highlands (north-west Scotland)" -> "Highlands". UI modules may not import each other (import_graph rule 3), so the card's
// splitName() of ui/region-grid.js is restated here in one line.
const mainName = (name) => String(name || '').replace(/\s*\([^)]*\)\s*$/, '').trim() || String(name || '');

const ANNOUNCE_DELAY_MS = 700;

let expanded = false;          // the "and N more" button has been pressed
let lastChipKey = null;        // what the chips currently show, so an unchanged refresh rebuilds nothing
let announceTimer = null;
let wasActive = false;         // whether a filter was active at the previous run (to announce a reset once)
let subscribed = false;

// Short name for a chip: the card's own short form, else the head of the name before its parenthesis.
export function shortName(r) {
  return (r && (r.short || mainName(r.name))) || '';
}

// The three groups for the regions in view, each in declared order. `gaps` rows carry the criteria whose figure is missing.
//   { inView, active, within: [region], gaps: [{ region, names: [criterion name] }], outside: [region] }
export function matchTally(st = state, data = filterData) {
  const inView = activeRegions(st, data);
  const active = anyFilterActive(st, data);
  const moved = data.criteria.filter((c) => st.thresholds[c.id] !== thresholdDefault(c));
  const within = [];
  const gaps = [];
  const outside = [];
  for (const r of inView) {
    if (!st.passing[r.id]) { outside.push(r); continue; }
    const names = moved.filter((c) => cellState(r.id, c.id, st, data) === 'gap').map((c) => c.name);
    if (names.length) gaps.push({ region: r, names });
    else within.push(r);
  }
  return { inView, active, within, gaps, outside };
}

const plural = (n, one, many) => (n === 1 ? one : many);

// The small line under the count: what the number means, and the honest note about gaps.
export function detailText(t) {
  if (!t.active) return 'No threshold is set yet, so every region is shown. Move a slider, or start from a scenario, to narrow them.';
  const parts = [];
  if (!t.within.length && !t.gaps.length) {
    parts.push('No region is within your thresholds. Loosen one to read more places.');
  } else {
    if (t.within.length) parts.push('Listed below in the order of the slate, never ranked.');
    if (t.gaps.length) {
      const n = t.gaps.length;
      parts.push(`${n} with ${plural(n, 'a gap', 'gaps')}: no verified figure for a threshold you set, so ${plural(n, 'it is', 'they are')} counted as neither within nor outside.`);
    }
  }
  return parts.join(' ');
}

// What a screen reader hears when the count settles. Empty while no filter is active.
export function announceText(t) {
  if (!t.active) return '';
  const base = `${t.within.length} of ${t.inView.length} ${plural(t.inView.length, 'region', 'regions')} within your thresholds.`;
  if (!t.gaps.length) return base;
  return `${base} ${t.gaps.length} with ${plural(t.gaps.length, 'a gap', 'gaps')}, counted as neither within nor outside.`;
}

function setText(node, text) {
  if (node && node.textContent !== text) node.textContent = text;
}

function announce(text) {
  const live = document.getElementById('match-announce');
  if (!live) return;
  if (announceTimer) clearTimeout(announceTimer);
  // Sliders fire continuously; wait for the number to settle before speaking it.
  announceTimer = setTimeout(() => { live.textContent = text; }, text ? ANNOUNCE_DELAY_MS : 0);
}

// Count, total, detail line, the chips and the screen-reader announcement.
export function updateMatchBar() {
  if (!subscribed) {
    // A continent switch or a change in the slate changes who can be listed: forget what the chips showed. (Subscribed on the
    // first run, not at import: modules have no import-time side effects, import_graph rule 5.)
    subscribed = true;
    on('cache:invalidate', () => { lastChipKey = null; expanded = false; });
  }
  // The next-step line counts with the same tally (ui/next-step.js reaches it through runtime.hooks, never by import).
  runtime.hooks.matchTally = matchTally;
  const t = matchTally();
  setText(document.getElementById('match-count'), String(t.within.length));
  setText(document.getElementById('match-total'), String(t.inView.length));
  setText(document.getElementById('match-gap-note'), detailText(t));
  renderMatchRegions(t);
  if (t.active) announce(announceText(t));
  else announce(wasActive ? `Thresholds reset. All ${t.inView.length} ${plural(t.inView.length, 'region is', 'regions are')} shown.` : '');
  wasActive = t.active;
}

function chip(r, gap) {
  const b = el('button', { className: gap ? 'region-chip gap' : 'region-chip', attrs: { type: 'button' } });
  b.style.setProperty('--region', r.accent);
  b.dataset.region = r.id;
  b.appendChild(el('span', { className: 'region-chip-dot', attrs: { 'aria-hidden': 'true' } }));
  b.appendChild(document.createTextNode(shortName(r)));
  b.setAttribute('aria-label', `Open details for ${r.name}`);
  b.addEventListener('click', () => emit('drawer:open', { regionId: r.id }));
  return b;
}

// The "result moment": once any filter is active, name the regions within the thresholds as chips (declared order, never
// ranked), then, apart, the regions with a gap. Nothing is listed until the visitor has chosen something.
export function renderMatchRegions(t = matchTally(), focusAfter = null) {
  const mount = document.getElementById('match-regions');
  if (!mount) return;
  if (!t.active || t.within.length <= CHIP_NAMES) expanded = false;
  const key = t.active ? `${t.within.map((r) => r.id).join(',')}|${t.gaps.map((g) => g.region.id).join(',')}|${expanded ? 1 : 0}` : '';
  if (key === lastChipKey && focusAfter === null) return;
  lastChipKey = key;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  if (!t.active) return;

  const shown = expanded ? t.within : t.within.slice(0, CHIP_NAMES);
  shown.forEach((r) => mount.appendChild(chip(r, false)));
  const more = t.within.length - CHIP_NAMES;
  if (more > 0) {
    const b = el('button', { className: 'region-chip more', attrs: { type: 'button', 'aria-expanded': String(expanded) } });
    if (expanded) {
      b.textContent = 'show fewer names';
      b.setAttribute('aria-label', 'Show fewer names');
    } else {
      b.textContent = `and ${more} more`;
      b.setAttribute('aria-label', `Show the other ${more} ${plural(more, 'region', 'regions')} within your thresholds`);
    }
    b.addEventListener('click', () => {
      expanded = !expanded;
      renderMatchRegions(matchTally(), expanded ? 'revealed' : 'toggle');
    });
    mount.appendChild(b);
  }
  if (t.gaps.length) {
    const group = el('div', { className: 'match-gaps', attrs: { role: 'group', 'aria-label': 'Regions with a gap: no verified figure for a threshold you set' } });
    group.appendChild(el('span', { className: 'match-gaps-label', text: 'With gaps:' }));
    t.gaps.forEach((g) => group.appendChild(chip(g.region, true)));
    mount.appendChild(group);
  }
  if (focusAfter === 'revealed') {
    const target = mount.querySelectorAll('.region-chip:not(.gap):not(.more)')[CHIP_NAMES];
    if (target) target.focus();
  } else if (focusAfter === 'toggle') {
    const btn = mount.querySelector('.region-chip.more');
    if (btn) btn.focus();
  }
}

// Shows the match bar's Share button state; Share is always available (a link carries thresholds, pins and the tab),
// the class stays for styling hooks.
export function updateShareButtonVisibility() {
  const bar = document.querySelector('.match-bar');
  if (bar) bar.classList.toggle('has-filters', anyFilterActive(state, filterData));
}
