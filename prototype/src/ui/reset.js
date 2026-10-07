// Reset button: "clear all filters", sliders and qualitative filters alike.
// Also answers the bus event filters:reset (the guided "show all" chip emits it).

import { criteria } from '../data.js';
import { state } from '../state.js';
import { on, emit } from '../bus.js';
import { QUAL_FILTERS } from '../config/qual-filters.js';
import { thresholdDefault } from '../../lib/filters.js';

export function resetThresholds() {
  criteria.forEach((c) => { state.thresholds[c.id] = thresholdDefault(c); });
  // Update slider input values
  criteria.forEach((c) => {
    const slider = document.querySelector(`#crit-${c.id} input[type="range"]`);
    if (slider) slider.value = String(state.thresholds[c.id]);
  });
  // Reset qualitative filters too — Reset means "clear all filters", not just sliders.
  QUAL_FILTERS.forEach((qf) => { state.qualFilters[qf.id] = 'any'; });
  document.querySelectorAll('select[data-qual-filter]').forEach((sel) => { sel.value = 'any'; });
  emit('refresh');
  // Reset flushes immediately, no debounce
  emit('filters:change', { source: 'reset', immediate: true });
}

export function initReset() {
  const btn = document.getElementById('reset-btn');
  if (btn) btn.addEventListener('click', resetThresholds);
  on('filters:reset', resetThresholds);
}
