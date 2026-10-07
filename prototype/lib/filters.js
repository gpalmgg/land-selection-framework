// Pure threshold and qualitative filtering. FILTERS, never scores: a region passes or it does not, per criterion,
// and nothing here sums, weights, ranks or orders anything.
//
// Every function takes the visitor's state and a `data` bundle instead of reading module globals:
//   state = { thresholds: { [critId]: number }, qualFilters: { [filterId]: string }, continent: string }
//   data  = { regions, values, criteria, qualFilters }
//           qualFilters (optional) is the list of { id, options, pick(regionId) } definitions from src/config/qual-filters.js;
//           lib/ never imports src/, so the client passes them in. The edge functions pass none and get numeric filtering only.
//
// Semantics are those of src/main.js at 6bce1a3:
//   * higherIs === 'better' means the threshold is a FLOOR (value >= threshold); every other kind is a CEILING (value <= threshold).
//   * Defaults are the permissive end of each range, so a fresh page passes every region.
//   * A numeric cell that is null, missing or not a number is a GAP: it is neither a pass nor a fail (D22). A gap never
//     removes a region and never counts as meeting a threshold; the interface says "no figure" for it.
//   * Qualitative filters keep their old rule: 'any' is no filter, any other choice needs an exact match, and a region
//     with no value for a chosen filter does not match it.

export function thresholdDirection(higherIs) {
  return higherIs === 'better' ? 'min' : 'max';
}

export function thresholdDefault(crit) {
  // Defaults set so all regions pass on load
  return thresholdDirection(crit.higherIs) === 'min' ? crit.rangeMin : crit.rangeMax;
}

export function thresholdStep(crit) {
  const span = crit.rangeMax - crit.rangeMin;
  if (span <= 1) return 0.01;
  if (span <= 5) return 0.1;
  if (span <= 50) return 1;
  return 10;
}

export function clampThreshold(crit, n) {
  return Math.max(crit.rangeMin, Math.min(crit.rangeMax, n));
}

// The cell for a region and criterion, or null when there is none.
function cellOf(regionId, critId, data) {
  const row = data.values && data.values[regionId];
  return (row && row[critId]) || null;
}

// 'within'  the cell has a figure and it meets the visitor's threshold
// 'outside' the cell has a figure and it does not
// 'gap'     no figure (null, missing, or not a number): neither within nor outside
export function cellState(regionId, critId, state, data) {
  const crit = data.criteria.find((c) => c.id === critId);
  if (!crit) return 'gap';
  const cell = cellOf(regionId, critId, data);
  if (!cell || typeof cell.value !== 'number' || !Number.isFinite(cell.value)) return 'gap';
  const th = state.thresholds[critId];
  const ok = thresholdDirection(crit.higherIs) === 'min' ? cell.value >= th : cell.value <= th;
  return ok ? 'within' : 'outside';
}

// Why a region does not pass, as plain facts, in criteria order then qualitative-filter order.
//   { kind: 'threshold', critId, value, threshold, direction: 'min' | 'max' }
//   { kind: 'qual', filterId, want, got }
// Empty when the region passes. Gaps are not reasons.
export function failReasons(regionId, state, data) {
  const out = [];
  for (const crit of data.criteria) {
    if (cellState(regionId, crit.id, state, data) !== 'outside') continue;
    out.push({
      kind: 'threshold',
      critId: crit.id,
      value: cellOf(regionId, crit.id, data).value,
      threshold: state.thresholds[crit.id],
      direction: thresholdDirection(crit.higherIs),
    });
  }
  for (const qf of data.qualFilters || []) {
    const want = state.qualFilters && state.qualFilters[qf.id];
    if (!want || want === 'any') continue;
    const got = qf.pick(regionId);
    if (got !== want) out.push({ kind: 'qual', filterId: qf.id, want, got });
  }
  return out;
}

export function regionPasses(regionId, state, data) {
  for (const crit of data.criteria) {
    if (cellState(regionId, crit.id, state, data) === 'outside') return false;
  }
  for (const qf of data.qualFilters || []) {
    const want = state.qualFilters && state.qualFilters[qf.id];
    if (!want || want === 'any') continue;
    if (qf.pick(regionId) !== want) return false;
  }
  return true;
}

export function anyFilterActive(state, data) {
  return (
    data.criteria.some((c) => state.thresholds[c.id] !== thresholdDefault(c)) ||
    (data.qualFilters || []).some((qf) => state.qualFilters && state.qualFilters[qf.id] !== 'any')
  );
}

// Regions of the currently-active continent. Render functions still emit ALL
// regions (tagged data-continent, CSS toggles visibility); this is used wherever
// we COUNT or LIST, match bar, slider hints, so totals reflect what's on screen.
export function activeRegions(state, data) {
  return data.regions.filter((r) => r.continent === state.continent);
}
