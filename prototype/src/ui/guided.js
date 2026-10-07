// Guided entry, the top-of-page on-ramp ("Starting points", design 8.5).
// Surfaces the SAME presets as the primary hook above the fold. A guided choice sets thresholds (filtering, never scoring),
// then carries the visitor down to their result and pulses it. The neutral chip clears all thresholds, so "show me
// everything" is one tap too.
//
// Each chip states, BEFORE it is pressed, exactly which thresholds it will set (the "sets" line, from presetThresholdSummary):
// a starting point that hides what it does would be a recommendation. A pressed chip is a real toggle state (aria-pressed): it
// stays pressed only while the sliders still equal what the chip set, and lets go the moment a slider, a reset or a shared link
// moves them. Nothing here scores, ranks or composes anything.
//
// Applying a preset and resetting are requested over the bus (preset:apply, filters:reset); the chip wording comes from
// runtime.hooks.presetSummary and the thresholds a chip stands for from ui/presets.js (registered/imported before this renders).

import { PRESETS } from '../data.js';
import { state, runtime } from '../state.js';
import { emit, on } from '../bus.js';
import { el } from './dom.js';
import { trackEvent } from './analytics.js';
import { presetThresholds, thresholdsEqual } from './presets.js';
import { QUAL_FILTERS } from '../config/qual-filters.js';

const SVG_NS = 'http://www.w3.org/2000/svg';

// Four line icons (16 x 16, stroked, drawn in currentColor): a triangle, a drop, an arc and a sun. Keyed by preset id;
// a preset id this table does not know gets the next unused icon, so a new preset never renders without one.
const ICONS = {
  offgrid: '<path d="M3 13l5-10 5 10Z"/>',
  'cool-wet': '<path d="M8 2C11 6 13 8 13 10.5A5 5 0 0 1 3 10.5C3 8 5 6 8 2Z"/>',
  affordable: '<path d="M2 12c3-6 9-6 12 0"/>',
  'high-solar': '<path d="M8 3v2M8 11v2M3 8h2M11 8h2M4.5 4.5l1.2 1.2M10.3 10.3l1.2 1.2M4.5 11.5l1.2-1.2M10.3 5.7l1.2-1.2"/>',
};
const ICON_ORDER = Object.keys(ICONS);

function iconFor(preset, index) {
  return ICONS[preset.id] || ICONS[ICON_ORDER[index % ICON_ORDER.length]];
}

function iconEl(markup) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'ico');
  svg.setAttribute('viewBox', '0 0 16 16');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  svg.innerHTML = markup;   // static markup from the table above, never user input
  return svg;
}

export function scrollToResultMoment() {
  const bar = document.querySelector('.match-bar');
  if (!bar) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bar.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  // Retrigger the pulse animation even if it ran moments ago.
  bar.classList.remove('pulse');
  void bar.offsetWidth; // force reflow
  bar.classList.add('pulse');
  setTimeout(() => bar.classList.remove('pulse'), 1600);
}

// Every threshold at its default and every qualitative filter on 'any': what "Show every region" leaves behind.
// A preset with no `sets` leaves every threshold at its default, so presetThresholds({ sets: {} }) is that map.
function isEverything() {
  return thresholdsEqual(presetThresholds({ sets: {} })) && QUAL_FILTERS.every((qf) => state.qualFilters[qf.id] === 'any');
}

export function renderGuidedEntry() {
  const mount = document.getElementById('guided-chips');
  if (!mount) return;
  mount.textContent = '';

  const chips = [];   // [{ node, stillTrue() }]
  let pressed = null; // the chip the visitor pressed last, while it is still true of the sliders

  function syncPressed() {
    if (pressed && !pressed.stillTrue()) pressed = null;
    chips.forEach((c) => c.node.setAttribute('aria-pressed', c === pressed ? 'true' : 'false'));
  }

  PRESETS.forEach((p, i) => {
    const summary = runtime.hooks.presetSummary(p);
    const chip = el('button', { className: 'guided-chip', attrs: { type: 'button', 'aria-pressed': 'false' } });
    chip.appendChild(iconEl(iconFor(p, i)));
    chip.appendChild(el('span', { className: 't', text: p.label }));
    chip.appendChild(el('span', { className: 'sets', text: summary }));
    chip.setAttribute('aria-label', `Apply the ${p.label} starting point. Sets ${summary}. You can adjust freely after.`);
    const entry = { node: chip, stillTrue: () => thresholdsEqual(presetThresholds(p)) };
    chip.addEventListener('click', () => {
      pressed = entry;
      emit('preset:apply', { presetId: p.id });   // applying already writes the URL and tracks preset_applied
      syncPressed();
      trackEvent('guided_start', { preset: p.id });
      scrollToResultMoment();
    });
    chips.push(entry);
    mount.appendChild(chip);
  });

  // Neutral entry: clear everything and show every region. Its label never carries a number (the count on the page is
  // the match bar's job, and it is read from the data).
  const all = el('button', { className: 'guided-chip neutral', attrs: { type: 'button', 'aria-pressed': 'false' } });
  all.appendChild(el('span', { className: 't', text: 'Show every region' }));
  all.setAttribute('aria-label', 'Clear all thresholds and show every region.');
  const allEntry = { node: all, stillTrue: isEverything };
  all.addEventListener('click', () => {
    pressed = allEntry;
    emit('filters:reset');
    syncPressed();
    trackEvent('guided_start', { preset: 'all' });
    scrollToResultMoment();
  });
  chips.push(allEntry);
  mount.appendChild(all);

  // Let go the moment the sliders (or a qualitative filter) no longer equal what the pressed chip set.
  on('filters:change', syncPressed);
}
