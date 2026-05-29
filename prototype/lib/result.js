// Shared, runtime-agnostic logic for turning a shared URL's query string into a
// concrete result: which regions pass the encoded thresholds, and a human
// summary of those thresholds. Imported by BOTH edge functions (api/og,
// api/share). This mirrors the passing logic in src/main.js exactly — filtering,
// never scoring or ranking. The matching list is returned in declaration order.
//
// Threshold encoding (set by writeThresholdsToURL in main.js):
//   ?t.<criterionId>=<number>   e.g. ?t.water_stress=0.3&t.solar_pv=1500
//   ?pin=<id>,<id>              the visitor's shortlist (membership, never ranked)

import { regions, values, criteria } from '../data/regions.js';

const direction = (higherIs) => (higherIs === 'better' ? 'min' : 'max');
const defaultThreshold = (c) => (direction(c.higherIs) === 'min' ? c.rangeMin : c.rangeMax);
const clamp = (c, n) => Math.max(c.rangeMin, Math.min(c.rangeMax, n));

function fmtNum(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return v.toLocaleString('en-US');
  return v.toFixed(Math.abs(v) < 10 ? 2 : 0).replace(/\.?0+$/, '');
}

// continent: shared links don't encode a continent (the switcher is client-only
// and not persisted), so a freshly-opened shared link is always Europe context.
// We compute the matching set against that same default so the card matches what
// the sharer saw on load.
export function computeResult(searchParams, continent = 'europe') {
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));

  const thresholds = Object.fromEntries(criteria.map((c) => [c.id, defaultThreshold(c)]));
  for (const [key, value] of searchParams.entries()) {
    if (!key.startsWith('t.')) continue;
    const c = byId[key.slice(2)];
    if (!c) continue;
    const n = parseFloat(value);
    if (Number.isFinite(n)) thresholds[c.id] = clamp(c, n);
  }

  const active = criteria.filter((c) => thresholds[c.id] !== defaultThreshold(c));

  const inView = regions.filter((r) => r.continent === continent);
  const passes = (r) =>
    criteria.every((c) => {
      const v = values[r.id] && values[r.id][c.id];
      if (!v || typeof v.value !== 'number') return true;
      return direction(c.higherIs) === 'min' ? v.value >= thresholds[c.id] : v.value <= thresholds[c.id];
    });

  const matching = inView.filter(passes);

  const knownIds = new Set(regions.map((r) => r.id));
  const pins = (searchParams.get('pin') || '')
    .split(',')
    .map((s) => s.trim())
    .filter((id) => knownIds.has(id));

  const summaries = active.map((c) => {
    const verb = direction(c.higherIs) === 'min' ? '≥' : '≤';
    return `${c.name} ${verb} ${fmtNum(thresholds[c.id])} ${c.rangeLabel}`;
  });

  return {
    thresholds,
    active,
    matching,            // array of region objects, declaration order
    pins,
    summaries,           // human-readable active-threshold lines
    total: inView.length,
    anyActive: active.length > 0,
  };
}
