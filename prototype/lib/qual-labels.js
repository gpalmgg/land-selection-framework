// Display labels for the qualitative (per-jurisdiction) layer values: the one place where an enum token becomes words.
//
// Pure ESM, no DOM, no imports: safe in the browser, in Node and in the edge runtime.
//
// The enum VALUES stay the internal tokens ('cheapest', 'very_high', ...). They are what the data files hold and what
// old shared links carry (?q.affordability_band=cheapest must keep parsing). Nothing may print a token: every filter
// option, chip, table cell and V1 grid row takes its text from qualLabel() / qualOptions(). A label never contains a
// superlative (best, top, ideal, winner, leading, densest, strongest, cheapest, lowest, highest, most, least) or an
// underscore; every `unknown` reads 'not read' (the layer's source did not say), never a guess.
//
//   qualLabel(field, value, meta)  -> string
//   qualOptions(field, meta)       -> [{ value, label }]  ('any' first; the values the filter accepts)
//   QUAL_FIELDS                    -> { [field]: { label, values, options } }
//
// `meta` is the client lookup's v1Meta (data/v1-lookup.js). Only meta.affordability_band is read:
//   { unit: 'EUR', edges: [e1, e2, e3, e4] }  four ascending band edges per hectare in the layer's own native unit
//   (also accepted: edges as { cheapest: [lo, hi], low: [lo, hi], ... } with null for an open end), or { relative: true }.
// With edges the affordability labels are price bands in that unit ('under 5,000 EUR per hectare', '5,000 to 12,000 EUR
// per hectare', '12,000 EUR per hectare and over'); without them the labels state that they are relative price bands
// ('very low price band' ... 'very high price band').

export const NOT_READ = 'not read';
export const ANY = 'any';

const UNKNOWN = { unknown: NOT_READ };
const LEVEL5 = { very_low: 'very low', low: 'low', moderate: 'moderate', high: 'high', very_high: 'very high' };
const CONF = { high: 'high confidence', medium: 'medium confidence', low: 'low confidence' };

// field -> { label, map (value -> words), options (the filter's option values, in display order) }.
// Words come from each layer's metadata.yaml enum (underscores read as spaces) except where the bare token is jargon
// or a value judgement; those are spelled out and noted here.
const DEFS = {
  foreign_ownership: { label: 'Foreign ownership', map: { yes: 'allowed', restricted: 'restricted', no: 'not allowed', ...UNKNOWN }, options: ['yes', 'restricted', 'no'] },
  multi_household_residence_as_of_right: { label: 'Several households on one holding', map: { yes: 'as of right', conditional: 'with conditions', no: 'not as of right', ...UNKNOWN } },
  residency_required_for_purchase: { label: 'Residency needed to buy', map: { yes: 'residency required', conditional: 'residency required in some cases', no: 'no residency required', ...UNKNOWN } },
  regulatory_direction: { label: 'Legal direction', map: { stable: 'stable', tightening: 'tightening', loosening: 'loosening', volatile: 'volatile', mixed: 'mixed', ...UNKNOWN }, options: ['stable', 'tightening', 'loosening', 'volatile'] },
  // land-cost layer. affordability_band is special-cased below (native-unit edges when the layer documents them).
  affordability_band: { label: 'Affordability', map: { cheapest: 'very low price band', low: 'low price band', moderate: 'middle price band', premium: 'high price band', very_premium: 'very high price band', unknown: 'price not read' }, options: ['cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'] },
  appreciation_trajectory: { label: 'Price trajectory', map: { stable: 'stable', rising: 'rising', rising_fast: 'rising fast', volatile: 'volatile', ...UNKNOWN } },
  data_confidence: { label: 'Confidence in this entry', map: { ...CONF, ...UNKNOWN } },
  // demographic-trajectory layer
  population_trend: { label: 'Population trend', map: { growing: 'growing', stable: 'stable', declining: 'declining', volatile: 'volatile', mixed: 'mixed', ...UNKNOWN } },
  median_age_band: { label: 'Median age', map: { young: 'young', moderate: 'middle', aging: 'aging', aging_fast: 'aging fast', ...UNKNOWN } },
  migration_dynamic: { label: 'Migration', map: { net_in: 'more people arriving than leaving', stable: 'stable', net_out: 'more people leaving than arriving', mixed: 'mixed', ...UNKNOWN } },
  rural_density_signal: { label: 'Rural density', map: { very_low: 'very low density', low: 'low density', moderate: 'moderate density', moderate_high: 'moderate to high density', high: 'high density', ...UNKNOWN } },
  // soil-contamination layer
  contamination_register_availability: { label: 'Contamination register', map: { public: 'public register', partial: 'partial register', opaque: 'register not open', ...UNKNOWN } },
  known_contamination_signal: { label: 'Known contamination', map: { none_documented: 'none documented', legacy_industrial: 'legacy industrial', legacy_mining: 'legacy mining', legacy_agriculture: 'legacy agriculture', complex: 'complex', ...UNKNOWN } },
  due_diligence_burden: { label: 'Due-diligence burden', map: { low: 'low', moderate: 'moderate', high: 'high', very_high: 'very high', ...UNKNOWN } },
  // water-source-control layer
  water_rights_holder_type: { label: 'Water rights holder', map: { public_utility: 'public utility', private_corporate: 'private corporate', community_commons: 'community commons', state: 'state', mixed: 'mixed', ...UNKNOWN } },
  single_entity_control_risk: { label: 'Single-entity control', map: { low: 'low', moderate: 'moderate', high: 'high', very_high: 'very high', ...UNKNOWN } },
  // climate-buffering layer
  buffering_strength: { label: 'Climate buffering', map: { ...LEVEL5, ...UNKNOWN }, options: ['very_low', 'low', 'moderate', 'high', 'very_high'] },
  // 'improving' / 'worsening' are verdict words; the layer means the buffering itself rising or falling under warming.
  trajectory_under_warming: { label: 'Buffering under warming', map: { improving: 'buffering rising', stable: 'steady', worsening: 'buffering falling', volatile: 'volatile', ...UNKNOWN } },
  // legal pathway entry enums (data/legal-pathway.js)
  lp_ownership_status: { label: 'Non-resident ownership', map: { open: 'open', open_with_conditions: 'open with conditions', restricted: 'restricted', ...UNKNOWN } },
  lp_residency_link: { label: 'Residency link', map: { no_link: 'no link to residency', separate_route: 'separate residency route', residency_required: 'residency required', ...UNKNOWN } },
  lp_zoning_route: { label: 'Where building is decided', map: { dedicated_route: 'dedicated route', case_by_case: 'case by case', generally_unavailable: 'generally unavailable', ...UNKNOWN } },
  lp_direction: { label: 'Direction', map: { stable: 'stable', tightening: 'tightening', loosening: 'loosening', mixed: 'mixed', unknown: 'direction not established' } },
  lp_confidence: { label: 'Confidence in this entry', map: { ...CONF } },
};
// Aliases: the names the client lookup and the metadata files use for the same field.
const ALIASES = { 'foreign_ownership.allowed': 'foreign_ownership', 'legal-ownership.regulatory_direction': 'regulatory_direction' };

export const QUAL_FIELDS = Object.fromEntries(Object.entries(DEFS).map(([k, d]) => [k, { label: d.label, values: Object.keys(d.map), options: d.options || Object.keys(d.map) }]));

const fmtInt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
const BAND_ORDER = ['cheapest', 'low', 'moderate', 'premium', 'very_premium'];

// Normalise meta.affordability_band into [{ lo, hi }] per band (null = open end), or null when there are no usable edges.
function bandRanges(m) {
  if (!m || m.relative || !m.edges) return null;
  const e = m.edges;
  if (Array.isArray(e)) {
    if (e.length !== 4 || !e.every((x) => typeof x === 'number' && Number.isFinite(x)) || !e.every((x, i) => i === 0 || x > e[i - 1])) return null;
    return { cheapest: { lo: null, hi: e[0] }, low: { lo: e[0], hi: e[1] }, moderate: { lo: e[1], hi: e[2] }, premium: { lo: e[2], hi: e[3] }, very_premium: { lo: e[3], hi: null } };
  }
  if (typeof e === 'object') {
    const out = {};
    for (const b of BAND_ORDER) {
      const r = e[b];
      if (!Array.isArray(r) || r.length !== 2) return null;
      const [lo, hi] = r;
      if ((lo !== null && !Number.isFinite(lo)) || (hi !== null && !Number.isFinite(hi))) return null;
      out[b] = { lo, hi };
    }
    return out;
  }
  return null;
}
function affordabilityLabel(value, meta) {
  const m = meta && meta.affordability_band;
  const r = bandRanges(m);
  if (!r || !r[value]) return DEFS.affordability_band.map[value] || NOT_READ;
  const unit = typeof m.unit === 'string' ? m.unit.trim() : '';
  const per = /\b(?:per|\/)\s*(?:hectare|ha)\b/i.test(unit);
  const suffix = per ? unit : `${unit ? `${unit} ` : ''}per hectare`;
  const { lo, hi } = r[value];
  if (lo === null && hi !== null) return `under ${fmtInt(hi)} ${suffix}`;
  if (hi === null && lo !== null) return `${fmtInt(lo)} ${suffix} and over`;
  if (lo !== null && hi !== null) return `${fmtInt(lo)} to ${fmtInt(hi)} ${suffix}`;
  return DEFS.affordability_band.map[value] || NOT_READ;
}

// A label is never a raw enum token: an empty, missing or unrecognised value reads 'not read'.
export function qualLabel(field, value, meta) {
  if (value === ANY) return ANY;
  const f = ALIASES[field] || field;
  const def = DEFS[f];
  if (!def || value == null || value === '' || typeof value !== 'string') return NOT_READ;
  if (f === 'affordability_band') return affordabilityLabel(value, meta);
  return Object.prototype.hasOwnProperty.call(def.map, value) ? def.map[value] : NOT_READ;
}

// [{ value, label }] with 'any' first. `value` is the internal token (what ?q.<field>= carries), `label` the display text.
export function qualOptions(field, meta) {
  const f = ALIASES[field] || field;
  const def = QUAL_FIELDS[f];
  const out = [{ value: ANY, label: ANY }];
  if (!def) return out;
  for (const v of def.options) out.push({ value: v, label: qualLabel(f, v, meta) });
  return out;
}
