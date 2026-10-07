// Scenario presets, pre-set THRESHOLD combinations (filtering, never scoring).
// A preset just moves sliders to a named starting point. It composes nothing,
// computes no score, and every threshold stays adjustable afterward. Each chip
// announces exactly which thresholds it sets.
//
// Other modules reach this one through the bus event preset:apply { presetId } and, for the chip wording,
// runtime.hooks.presetSummary(preset) (registered by initPresets).

import { criteria, PRESETS } from '../data.js';
import { state, runtime } from '../state.js';
import { on, emit } from '../bus.js';
import { el } from './dom.js';
import { trackEvent } from './analytics.js';
import { fmtVal } from '../../lib/format.js';
import { thresholdDirection, thresholdDefault, clampThreshold } from '../../lib/filters.js';

export function presetThresholdSummary(preset) {
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  return Object.entries(preset.sets).map(([cid, val]) => {
    const c = byId[cid];
    if (!c) return '';
    const verb = thresholdDirection(c.higherIs) === 'min' ? 'at least' : 'at most';
    return `${c.name} ${verb} ${fmtVal(val)} ${c.rangeLabel}`;
  }).filter(Boolean).join('; ');
}

// The thresholds a preset results in: every criterion at its default, then only the criteria the preset names, clamped to range.
// Pure (reads data and arguments only), so the guided entry can ask "is this chip still the state of the sliders?".
export function presetThresholds(preset) {
  const out = {};
  criteria.forEach((c) => { out[c.id] = thresholdDefault(c); });
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  for (const [cid, val] of Object.entries(preset.sets)) {
    const c = byId[cid];
    if (c) out[cid] = clampThreshold(c, val);
  }
  return out;
}

// True when every slider is where `target` (a { criterionId: value } map) says it is.
export function thresholdsEqual(target) {
  return criteria.every((c) => state.thresholds[c.id] === target[c.id]);
}

export function applyPreset(preset) {
  // A preset is a clean starting point, reset every threshold to default first,
  // then apply only the criteria this preset names. So clicking a scenario gives
  // exactly that scenario, never a layer on top of prior fiddling.
  const next = presetThresholds(preset);
  criteria.forEach((c) => { state.thresholds[c.id] = next[c.id]; });
  // Sync the slider inputs to the new state (same as resetThresholds does).
  criteria.forEach((c) => {
    const slider = document.querySelector(`#crit-${c.id} input[type="range"]`);
    if (slider) slider.value = String(state.thresholds[c.id]);
  });
  emit('refresh');
  emit('filters:change', { source: 'preset', immediate: true });
  trackEvent('preset_applied', { preset: preset.id });
}

export function renderPresetChips() {
  const mount = document.getElementById('preset-chips');
  if (!mount) return;
  PRESETS.forEach((p) => {
    const chip = el('button', { className: 'preset-chip', text: p.label, attrs: { type: 'button' } });
    const summary = presetThresholdSummary(p);
    chip.title = `Starting point, sets ${summary}. Adjust freely after.`;
    chip.setAttribute('aria-label', `Apply the ${p.label} scenario. Sets ${summary}. A starting point you can adjust.`);
    chip.addEventListener('click', () => applyPreset(p));
    mount.appendChild(chip);
  });
}

export function initPresets() {
  runtime.hooks.presetSummary = presetThresholdSummary;
  on('preset:apply', (payload) => {
    const p = payload && PRESETS.find((x) => x.id === payload.presetId);
    if (p) applyPreset(p);
  });
}
