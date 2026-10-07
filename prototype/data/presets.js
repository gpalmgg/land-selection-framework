// Scenario presets: pre-set THRESHOLD combinations (filtering, never scoring).
// A preset just moves sliders to a named starting point. It composes nothing,
// computes no score, and every threshold stays adjustable afterward. Each chip
// announces exactly which thresholds it sets.
//
// Moved out of src/main.js so tests and the page read one list. Ids and labels are unchanged.
// `sets` maps a criterion id to the threshold value the preset applies (a floor for 'better' criteria, a ceiling for the rest).

export const PRESETS = [
  // solar_pv floor at 1400 (not 1500): with the current data, 1500 leaves ZERO
  // matches on the default (Europe) continent — the only ≥1500 region there
  // fails the water threshold. 1400 still means strong solar and keeps the
  // starting point honest on both continents.
  { id: 'offgrid', label: 'Off-grid self-sufficiency',
    sets: { solar_pv: 1400, water_stress: 0.4, population: 50 } },
  // forest_change floor -1 (net % canopy change; higher is better): a floor of 0 matched
  // zero regions on both continents once data went to 30 regions. -1 keeps "little net forest loss".
  { id: 'cool-wet', label: 'Cool & water-secure',
    sets: { climate: 14, water_stress: 0.35, forest_change: -1 } },
  { id: 'affordable', label: 'Quiet & rural',
    sets: { population: 40 } },
  { id: 'high-solar', label: 'High solar, dry-tolerant',
    sets: { solar_pv: 1600 } },
];
