// The refresh orchestrator: recompute which regions pass, then bring every view in line, in this order.
// The order is the order the old refreshAll ran its sections in, and it is part of the behaviour. Each section is
// one exported update function that is idempotent and cheap to repeat. The map markers are reached through
// runtime.hooks.updateMarkers (set by the map code) so this file never imports the map.
//
// Everything else asks for a refresh with the bus event `refresh`; initRefresh() subscribes to it.
//
// Coalescing. A slider fires `input` many times a frame, and each one asks for a refresh. The state that decides who
// passes (state.passing) is recomputed at once on every request, so any code that reads it between a request and the
// repaint sees the truth, but the DOM sections run ONCE per frame: the requests of a frame share one
// requestAnimationFrame (with a short timer as a fallback, because a hidden tab never delivers a frame). refreshAll()
// itself stays synchronous for the boot call in main.js and for anyone who needs the views in step right now.
//
// Caches. The update* sections look their elements up by id. A section that keeps such a lookup (or a list of
// regions) must drop it when the shape of the page changes. This file tells them when: before the sections run, if the
// active continent or the number of regions differs from the last run, it emits the bus event
//   cache:invalidate { reason: 'continent' | 'regions', continent, regionCount }
// and a section that caches subscribes to it. The first run counts as a change, so every cache starts empty.

import { regions } from './data.js';
import { state, filterData, runtime } from './state.js';
import { on, emit } from './bus.js';
import { regionPasses } from '../lib/filters.js';
import { updateMatchBar, updateShareButtonVisibility } from './ui/match-bar.js';
import { updateCards } from './ui/region-grid.js';
import { updateCriteria } from './ui/criteria.js';
import { updateSummary } from './ui/summary-table.js';
import { updateNextStep } from './ui/next-step.js';

// How long a requested refresh waits for an animation frame before the timer runs it instead (hidden tabs).
const FRAME_FALLBACK_MS = 120;

let seenContinent = null;
let seenRegionCount = -1;
let frameHandle = null;
let timerHandle = null;
let pending = false;

// Recompute passing over all regions (cheap, and ids never collide).
function recomputePassing() {
  regions.forEach((r) => { state.passing[r.id] = regionPasses(r.id, state, filterData); });
}

// Tells caching sections that what they looked up may be stale.
function invalidateIfShapeChanged() {
  const reasons = [];
  if (state.continent !== seenContinent) reasons.push('continent');
  if (regions.length !== seenRegionCount) reasons.push('regions');
  if (!reasons.length) return;
  seenContinent = state.continent;
  seenRegionCount = regions.length;
  reasons.forEach((reason) => emit('cache:invalidate', { reason, continent: state.continent, regionCount: regions.length }));
}

function runSections() {
  invalidateIfShapeChanged();

  updateMatchBar();
  updateCards();
  // Map markers: dim the ones whose region misses a threshold
  if (runtime.hooks.updateMarkers) runtime.hooks.updateMarkers();
  // Criterion cards (slider values, threshold positions, per-bar pass/fail)
  updateCriteria();
  updateSummary();
  updateShareButtonVisibility();
  updateNextStep();
}

function cancelScheduled() {
  if (frameHandle !== null && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(frameHandle);
  if (timerHandle !== null) clearTimeout(timerHandle);
  frameHandle = null;
  timerHandle = null;
}

// Runs the sections now and clears any scheduled run (whatever was waiting is satisfied by this one).
export function refreshAll() {
  cancelScheduled();
  pending = false;
  recomputePassing();
  runSections();
}

// Asks for a refresh: passing is current at once, the sections run once on the next frame however many requests came
// in before it.
export function requestRefresh() {
  recomputePassing();
  if (pending) return;
  pending = true;
  const run = () => {
    if (!pending) return;
    cancelScheduled();
    pending = false;
    runSections();
  };
  if (typeof requestAnimationFrame === 'function') frameHandle = requestAnimationFrame(run);
  timerHandle = setTimeout(run, FRAME_FALLBACK_MS);
}

export function initRefresh() {
  on('refresh', requestRefresh);
}
