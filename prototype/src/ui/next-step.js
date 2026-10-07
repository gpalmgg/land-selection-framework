// The quiet row under the match bar: what the count means and what to do with it.
//
// It NEVER selects. A line that named "the first region within your thresholds" would give the slate's declared order
// the weight of a recommendation (the ten regions added in 2026-10 sit at the end of each continent). So the text names no
// region, says nothing about first, best, top or closest, and reads the same for every order of the slate: it only says how
// many regions are within the thresholds and invites the visitor to open any of them.
//
// The number is the match count of ui/match-bar.js (a region with a gap for a threshold is not counted). UI modules may not
// import each other, so the match bar publishes its tally as runtime.hooks.matchTally on every refresh and this row reads it;
// the refresh order (match bar first, next step last) keeps the two in step.

import { runtime } from '../state.js';

// The sentence for N regions within the thresholds. Pure.
export function nextStepText(n) {
  if (n <= 0) return 'No region is within your thresholds. Loosen a threshold to read more places.';
  if (n === 1) return '1 region is within your thresholds. Open it to read whose land it is and what it asks of you.';
  return `${n} regions are within your thresholds. Open any of them to read whose land it is and what it asks of you.`;
}

export function updateNextStep() {
  const row = document.getElementById('next-step');
  const lead = document.getElementById('next-step-lead');
  const tally = runtime.hooks.matchTally;
  if (!row || !lead || typeof tally !== 'function') return;
  const n = tally().within.length;
  row.classList.toggle('empty', n === 0);
  const text = nextStepText(n);
  if (lead.textContent !== text) lead.textContent = text;
}

// The row has no controls and nothing to subscribe to: the refresh orchestrator calls updateNextStep() after the match bar.
// Kept so the boot sequence in main.js keeps its call; it asks the row to say itself once if a tally already exists.
export function initNextStep() {
  updateNextStep();
}
