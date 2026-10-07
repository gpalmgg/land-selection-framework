// Single source of truth for allowed values AND the pure validators built on them.
// Extend here (and only here) when a track adds a field. No WP after EV-TEST edits this file:
// every optional field the integrated plan uses is pre-registered in EXTENSIONS below.
// Zero dependencies, no I/O: safe to import from tests, from scripts/evidence/validate_legal.mjs and from fixtures.

export const CONTINENTS = ['europe', 'north-america'];
export const HIGHER_IS = ['better', 'worse', 'hotter', 'neutral'];
export const CRITERIA_IDS = ['climate', 'water_stress', 'soil_carbon', 'forest_change', 'solar_pv', 'conflict', 'regen_network', 'population'];
export const CELL_REQUIRED = ['value', 'unit', 'vintage', 'label', 'source', 'sourceUrl'];
// v2 additions (required when REQUIRE_V2=1)
export const METHODS = ['footprint-zonal', 'point-3x3', 'named-count', 'official-statistic', 'hand-estimate'];
export const CELL_V2_REQUIRED = ['sourceId', 'method', 'footprint', 'retrieved', 'trajectory'];
export const TRAJ_STATUS = ['measured', 'projected', 'qualitative', 'not_available'];
export const TRAJ_DIRECTION = ['rising', 'falling', 'steady', 'mixed', null]; // neutral words only: never better/worse
export const LP_OWNERSHIP = ['open', 'open_with_conditions', 'restricted', 'unknown'];
export const LP_RESIDENCY = ['no_link', 'separate_route', 'residency_required', 'unknown'];
export const LP_ZONING = ['dedicated_route', 'case_by_case', 'generally_unavailable', 'unknown'];
export const LP_DIRECTION = ['stable', 'tightening', 'loosening', 'mixed', 'unknown'];
export const LP_CONFIDENCE = ['high', 'medium', 'low'];
export const LP_FORM_KIND = ['cooperative', 'land_trust', 'foundation', 'association', 'company', 'commons', 'other'];
export const LEGAL_NOT_ADVICE = 'Orientation from public sources, not legal advice. Check current law with a local professional before acting.';

// Registered optional fields (plan override 2). Anything outside base + EXTENSIONS is "unregistered".
export const EXTENSIONS = {
  criteria: ['window', 'step', 'scenarioLine', 'trajectoryRule', 'bands', 'sourceId', 'nativeUnit', 'rangeLabel'],
  cell: ['scenario', 'license', 'outOfRange', 'nullReason', 'audit'], // plus all CELL_V2_REQUIRED
  landStanding: ['sources', 'territorySource', 'territorySourceUrl'],
  regionDepth: ['caseStudy', 'caseLinks'],
  legalPathway: ['harmNote', 'hostBodyNote'],
  regions: [],
};
export const BASE_KEYS = {
  criteria: ['id', 'askjaNumber', 'name', 'metric', 'framing', 'source', 'sourceUrl', 'license', 'nativeUnit', 'rangeMin', 'rangeMax', 'rangeLabel', 'higherIs', 'ramp', 'rampLabels', 'unit'],
  landStanding: ['territory', 'tenure', 'entry', 'obligation', 'source', 'sourceUrl'],
  regionDepth: ['asks', 'source', 'sourceUrl'],
  regions: ['id', 'continent', 'name', 'short', 'country', 'coords', 'blurb', 'accent'],
};
export const CRITERION_WINDOW_KINDS = ['observed', 'projection'];

// Per-jurisdiction qualitative layers: allowed enum values (mirror data/processed/*.metadata.yaml).
export const LAYER_ENUMS = {
  'legal-ownership': { 'foreign_ownership.allowed': ['yes', 'restricted', 'no'], multi_household_residence_as_of_right: ['yes', 'no', 'conditional'], residency_required_for_purchase: ['yes', 'no', 'conditional'], regulatory_direction: ['stable', 'tightening', 'loosening', 'volatile'] },
  'land-cost': { appreciation_trajectory: ['stable', 'rising', 'rising_fast', 'volatile', 'unknown'], affordability_band: ['cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'], data_confidence: ['high', 'medium', 'low'] },
  'demographic-trajectory': { population_trend: ['growing', 'stable', 'declining', 'volatile', 'unknown'], median_age_band: ['young', 'moderate', 'aging', 'aging_fast', 'unknown'], migration_dynamic: ['net_in', 'stable', 'net_out', 'mixed', 'unknown'], rural_density_signal: ['very_low', 'low', 'moderate', 'moderate_high', 'high', 'unknown'], data_confidence: ['high', 'medium', 'low'] },
  'soil-contamination': { contamination_register_availability: ['public', 'partial', 'opaque', 'unknown'], known_contamination_signal: ['none_documented', 'legacy_industrial', 'legacy_mining', 'legacy_agriculture', 'complex', 'unknown'], due_diligence_burden: ['low', 'moderate', 'high', 'very_high', 'unknown'], data_confidence: ['high', 'medium', 'low'] },
  'water-source-control': { water_rights_holder_type: ['public_utility', 'private_corporate', 'community_commons', 'state', 'mixed', 'unknown'], single_entity_control_risk: ['low', 'moderate', 'high', 'very_high', 'unknown'], data_confidence: ['high', 'medium', 'low'] },
  'climate-buffering': { buffering_strength: ['very_low', 'low', 'moderate', 'high', 'very_high', 'unknown'], trajectory_under_warming: ['improving', 'stable', 'worsening', 'volatile', 'unknown'], data_confidence: ['high', 'medium', 'low'] },
};
// The four fields the slimmed client lookup (data/v1-lookup.js) still carries: asserted against data/processed/*.json.
export const CLIENT_LOOKUP_FIELDS = [
  ['legal_ownership', 'legal-ownership', 'foreign_ownership.allowed'],
  ['legal_ownership', 'legal-ownership', 'regulatory_direction'],
  ['land_cost', 'land-cost', 'affordability_band'],
  ['climate_buffering', 'climate-buffering', 'buffering_strength'],
];

// Keys that must never appear anywhere in shipped data (framework discipline: filter, never score).
export const FORBIDDEN_KEYS = /^(score|scores|weight|weights|rank|ranks|ranking|rankings|rating|ratings|star|stars|composite|composite_score|total_score|overall|grade|medal|best|top|tier_rank|index_score|suitability|livability|habitability)$/i;
// Words that must not appear in site copy fields (negations in framework docs are fine; data is not docs).
export const BANNED_COPY = [/\bcomposite\b/i, /\branking\b/i, /\branked\b/i, /\bbest\b/i, /\btop (?:decile|three|ten|tier|\d)/i, /\bcandidate(?:s| region| area)?\b/i, /\bsit(?:e|ing) shopping\b/i, /\bsiting\b/i, /\bfind(?:ing)? (?:the )?land\b/i, /\bapocalyp/i, /\bstrongest\b/i, /\bdensest\b/i, /\bmost (?:livable|habitable|suitable)\b/i, /\bcheap land\b/i];
// Phrases that may never be INSTRUCTIONS in the legal pathway (a ruledOut entry may name a prohibited structure via allowlist.json).
export const BANNED_LEGAL_PHRASES = [/work-?\s?around/i, /\bloophole/i, /\bget(?:ting)? around\b/i, /\bbypass/i, /\bnominee/i];
export const PII = [/[\w.+-]+@[\w-]+\.[\w.-]+/, /\+\d[\d\s().-]{7,}\d/, /(^|\s)@[a-z0-9_]{3,}\b/i, /\b(?:instagram|substack)\.com\/(?!p\/)[\w.-]+/i];
// Hygiene (shipped strings): internal paths, emails, phones, mailto.
export const HYGIENE = [
  ['internal path', /upgrade-2026-10/i],
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}/],
  ['phone', /(?:^|[\s(])\+\d{1,3}[\s().-]*\d[\d\s().-]{6,}\d/],
  ['mailto', /mailto:/i],
];
export const VERMONT_BANNED = /identity|genealog|illegitim|fraud|contested|dispute/i;
export const FINGER_LAKES_BANNED = /leadership|faction|dispute|illegitim/i;

// Koppen-Geiger: the 30 classes of the Beck et al. 2023 legend.
export const KOPPEN_CODES = ['Af', 'Am', 'Aw', 'BWh', 'BWk', 'BSh', 'BSk', 'Csa', 'Csb', 'Csc', 'Cwa', 'Cwb', 'Cwc', 'Cfa', 'Cfb', 'Cfc', 'Dsa', 'Dsb', 'Dsc', 'Dsd', 'Dwa', 'Dwb', 'Dwc', 'Dwd', 'Dfa', 'Dfb', 'Dfc', 'Dfd', 'ET', 'EF'];
export const KOPPEN_PERIODS = ['1961–1990', '1991–2020', '2041–2070 SSP2-4.5', '2071–2099 SSP2-4.5'];
// WRI Aqueduct class vocabulary (labels are WRI's own; this project never rescales them). Compared after normalising dashes/space.
export const AQUEDUCT_CLASS = /^(Low|Low - Medium|Medium - High|High|Extremely High|Arid and Low Water Use|No Data)\b/i;
export const SOURCE_STATUS = ['confirmed', 'unconfirmed'];
export const LAYER_KINDS = ['xyz', 'wms', 'wmts-kvp', 'arcgis-export', 'geojson'];
export const LAYER_STATUS = ['active', 'fragile', 'retired'];

// ---------------------------------------------------------------------------------------------------------------
// Small pure helpers
export const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
export const isStr = (s, min = 1) => typeof s === 'string' && s.trim().length >= min;
export const isHttps = (s) => typeof s === 'string' && /^https:\/\/[^\s/]+\.[^\s]+$/.test(s);
export const isUrl = (s) => typeof s === 'string' && /^https?:\/\/[^\s]+\.[^\s]+/.test(s);
export const isIso = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
export const daysBetween = (a, b) => Math.abs((Date.parse(a) - Date.parse(b)) / 86400000);
export const todayIso = () => process.env.LSF_TODAY || new Date().toISOString().slice(0, 10);
export function idsDiff(actual, expected) {
  const a = new Set(actual), e = new Set(expected);
  const missing = [...e].filter((x) => !a.has(x)).sort(), extra = [...a].filter((x) => !e.has(x)).sort();
  return missing.length || extra.length ? `missing: [${missing.join(', ')}]; extra: [${extra.join(', ')}]` : '';
}
export function walk(obj, cb, p = '') {
  if (Array.isArray(obj)) { obj.forEach((v, i) => { cb(String(i), v, `${p}[${i}]`); walk(v, cb, `${p}[${i}]`); }); return; }
  if (obj && typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) { const np = p ? `${p}.${k}` : k; cb(k, v, np); walk(v, cb, np); }
  }
}

// ---------------------------------------------------------------------------------------------------------------
// Value cell v2. `crit` is the criterion (optional). Returns an array of error strings (empty = valid).
export function validateCellCore(c, w) {
  const e = [];
  if (!c || typeof c !== 'object') return [`${w}: cell missing`];
  const known = new Set([...CELL_REQUIRED, ...CELL_V2_REQUIRED, ...EXTENSIONS.cell]);
  for (const k of Object.keys(c)) if (!known.has(k)) e.push(`${w}: unregistered cell field "${k}" (register in tests/schema.mjs EXTENSIONS)`);
  if (c.value === null) {
    // NULL POLICY (P-CELL): value null only with a nullReason naming what was not reproduced.
    if (!isStr(c.nullReason, 12)) e.push(`${w}.nullReason required (>= 12 chars) when value is null`);
    return e;
  }
  if (c.nullReason !== undefined) e.push(`${w}.nullReason is only allowed on a null cell`);
  if (!isNum(c.value)) e.push(`${w}.value must be a finite number or null with nullReason`);
  for (const f of CELL_REQUIRED) if (f !== 'value' && !isStr(c[f])) e.push(`${w}.${f} missing`);
  if (c.sourceUrl !== undefined && !isUrl(c.sourceUrl)) e.push(`${w}.sourceUrl not a URL`);
  return e;
}
// v2 fields: validated when present, required under requireV2. Null cells carry only nullReason.
export function validateCellV2(c, w, { requireV2 = false, crit = null } = {}) {
  const e = [];
  if (!c || typeof c !== 'object' || c.value === null) return e;
  if (crit && requireV2 && isStr(crit.rangeLabel) && isStr(c.unit) && c.unit !== crit.rangeLabel) e.push(`${w}.unit "${c.unit}" != criterion rangeLabel "${crit.rangeLabel}"`);
  if (requireV2) for (const f of CELL_V2_REQUIRED) if (c[f] === undefined || c[f] === null || c[f] === '') e.push(`${w}.${f} required under REQUIRE_V2`);
  if (c.method !== undefined && !METHODS.includes(c.method)) e.push(`${w}.method "${c.method}" not in ${METHODS.join('|')}`);
  if (c.retrieved !== undefined && !isIso(c.retrieved)) e.push(`${w}.retrieved must be ISO date`);
  if (c.footprint !== undefined && !isStr(c.footprint)) e.push(`${w}.footprint must be a non-empty string`);
  if (c.sourceId !== undefined && !isStr(c.sourceId)) e.push(`${w}.sourceId must be a non-empty string`);
  if (c.outOfRange !== undefined && !isStr(c.outOfRange, 8)) e.push(`${w}.outOfRange needs a reason`);
  if (c.license !== undefined && !isStr(c.license)) e.push(`${w}.license must be a non-empty string`);
  if (c.audit !== undefined && !isStr(c.audit)) e.push(`${w}.audit must be a string`);
  if (c.trajectory !== undefined) e.push(...validateTrajectory(c.trajectory, `${w}.trajectory`));
  return e;
}
export const validateCell = (c, w, o = {}) => [...validateCellCore(c, w), ...validateCellV2(c, w, o)];

export function validateTrajectory(t, w) {
  const e = [];
  if (!t || typeof t !== 'object') return [`${w} must be an object`];
  if (!TRAJ_STATUS.includes(t.status)) e.push(`${w}.status "${t.status}" not in ${TRAJ_STATUS.join('|')}`);
  if (!TRAJ_DIRECTION.includes(t.direction ?? null)) e.push(`${w}.direction must be rising|falling|steady|mixed|null (neutral words), got "${t.direction}"`);
  if (!isStr(t.basis, 11)) e.push(`${w}.basis required (>= 11 chars)`);
  if (t.status === 'not_available') { if ((t.direction ?? null) !== null) e.push(`${w}.direction must be null when status is not_available`); }
  else if (TRAJ_STATUS.includes(t.status)) {
    if (!isUrl(t.sourceUrl)) e.push(`${w}.sourceUrl (never an arrow without a source)`);
    if (!isStr(t.source) || !isStr(t.vintage)) e.push(`${w}.source and vintage required`);
  }
  if (t.delta !== undefined) {
    if (!isNum(t.delta) || !isStr(t.unit)) e.push(`${w}.delta needs a numeric value and a unit`);
    else if (t.direction === 'rising' && !(t.delta > 0)) e.push(`${w}.direction "rising" disagrees with delta ${t.delta}`);
    else if (t.direction === 'falling' && !(t.delta < 0)) e.push(`${w}.direction "falling" disagrees with delta ${t.delta}`);
  }
  return e;
}

// Criterion: base schema + registered extensions. Returns { errors, warnings }.
export function validateCriterion(c, { requireV2 = false } = {}) {
  const errors = [], warnings = [], w = `criteria.${c && c.id}`;
  for (const f of ['name', 'metric', 'framing', 'source', 'license', 'nativeUnit', 'rangeLabel']) if (!isStr(c[f])) errors.push(`${w}.${f}`);
  if (!isUrl(c.sourceUrl)) errors.push(`${w}.sourceUrl`);
  if (!(isNum(c.rangeMin) && isNum(c.rangeMax) && c.rangeMin < c.rangeMax)) errors.push(`${w} range`);
  if (!HIGHER_IS.includes(c.higherIs)) errors.push(`${w}.higherIs`);
  if (!(Array.isArray(c.ramp) && c.ramp.length === 4 && c.ramp.every((h) => /^#[0-9a-fA-F]{6}$/.test(h)))) errors.push(`${w}.ramp must be 4 hex colours`);
  if (!(Array.isArray(c.rampLabels) && c.rampLabels.length === 4)) errors.push(`${w}.rampLabels must have 4 entries`);
  if (isStr(c.rangeLabel) && c.rangeLabel.toLowerCase() === 'score') errors.push(`${w}: unit "score" reads as our own score; use the dataset's real unit`);
  if (c.step !== undefined && !(isNum(c.step) && c.step > 0)) errors.push(`${w}.step must be a positive number`);
  for (const f of ['scenarioLine', 'trajectoryRule', 'sourceId']) if (c[f] !== undefined && !isStr(c[f])) errors.push(`${w}.${f} must be a non-empty string`);
  if (c.bands !== undefined && !((Array.isArray(c.bands) && c.bands.length) || (c.bands && typeof c.bands === 'object' && Object.keys(c.bands).length))) errors.push(`${w}.bands must be a non-empty array or object`);
  if (c.window !== undefined || requireV2) {
    const x = c.window;
    if (!x || typeof x !== 'object') errors.push(`${w}.window {from,to,kind,label} required (Century Line, design spec 15.1)`);
    else {
      if (!(isNum(x.from) && isNum(x.to) && x.from <= x.to)) errors.push(`${w}.window.from/to must be numbers with from <= to`);
      if (!CRITERION_WINDOW_KINDS.includes(x.kind)) errors.push(`${w}.window.kind must be observed|projection`);
      if (!isStr(x.label)) errors.push(`${w}.window.label required`);
    }
  }
  const known = new Set([...BASE_KEYS.criteria, ...EXTENSIONS.criteria]);
  for (const k of Object.keys(c)) if (!known.has(k)) warnings.push(`${w}: unregistered criterion field "${k}"`);
  return { errors, warnings };
}

// ---------------------------------------------------------------------------------------------------------------
// Legal pathway entry (evidence.md section 3.2). `allowed(path, text)` returns true for allowlisted exceptions.
const LP_KEYS = ['asOf', 'nonResidentOwnership', 'residency', 'zoning', 'collectiveForms', 'firstClaim', 'steps', 'ruledOut', 'direction', 'directionNote', 'gaps', 'confidence', 'verifiedOn'];
export function validateLegalEntry(id, e, { today = todayIso(), allowed = () => false } = {}) {
  const errs = [], w = id;
  if (!e || typeof e !== 'object') return [`${w}: entry missing`];
  const known = new Set([...LP_KEYS, ...EXTENSIONS.legalPathway]);
  for (const k of Object.keys(e)) if (!known.has(k)) errs.push(`${w}: unregistered legal-pathway field "${k}"`);
  walk(e, (k, v, p) => {
    if (FORBIDDEN_KEYS.test(k)) errs.push(`${w}.${p}: forbidden key "${k}" (the framework filters, it never scores)`);
    if (/^_/.test(k)) errs.push(`${w}.${p}: underscore-prefixed key`);
    if (typeof v === 'number' && !/^steps\[\d+\]\.n$/.test(p)) errs.push(`${w}.${p}: numeric field (only steps[].n is numeric)`);
    if (typeof v === 'string' && !/(source|sourceUrl|url)$/i.test(k)) for (const re of BANNED_LEGAL_PHRASES) if (re.test(v) && !allowed(`${w}.${p}`, v)) errs.push(`${w}.${p}: banned phrase /${re.source}/ in "${v.slice(0, 80)}"`);
  });
  for (const f of ['asOf', 'verifiedOn']) if (!isIso(e[f])) errs.push(`${w}.${f} must be an ISO date`);
  if (isIso(e.asOf) && daysBetween(e.asOf, today) > 400) errs.push(`${w}.asOf ${e.asOf} is more than 400 days from ${today}`);
  const src = (o, p) => { if (!isStr(o && o.source)) errs.push(`${w}.${p}.source`); if (!isHttps(o && o.sourceUrl)) errs.push(`${w}.${p}.sourceUrl must be https`); };
  const no = e.nonResidentOwnership; const re = e.residency; const zo = e.zoning;
  if (!no || !LP_OWNERSHIP.includes(no.status)) errs.push(`${w}.nonResidentOwnership.status not in ${LP_OWNERSHIP.join('|')}`);
  if (!re || !LP_RESIDENCY.includes(re.link)) errs.push(`${w}.residency.link not in ${LP_RESIDENCY.join('|')}`);
  if (!zo || !LP_ZONING.includes(zo.route)) errs.push(`${w}.zoning.route not in ${LP_ZONING.join('|')}`);
  for (const [o, p] of [[no, 'nonResidentOwnership'], [re, 'residency'], [zo, 'zoning']]) { if (!isStr(o && o.summary)) errs.push(`${w}.${p}.summary`); src(o || {}, p); }
  if (!Array.isArray(e.collectiveForms)) errs.push(`${w}.collectiveForms must be an array`);
  else e.collectiveForms.forEach((f, i) => { if (!LP_FORM_KIND.includes(f.kind)) errs.push(`${w}.collectiveForms[${i}].kind not in ${LP_FORM_KIND.join('|')}`); if (!isStr(f.name) || !isStr(f.summary)) errs.push(`${w}.collectiveForms[${i}] name/summary`); src(f, `collectiveForms[${i}]`); });
  if (!Array.isArray(e.firstClaim) || !e.firstClaim.every((s) => isStr(s))) errs.push(`${w}.firstClaim must be an array of strings`);
  if (!Array.isArray(e.ruledOut) || !e.ruledOut.every((s) => isStr(s))) errs.push(`${w}.ruledOut must be an array of strings`);
  if (!LP_DIRECTION.includes(e.direction)) errs.push(`${w}.direction not in ${LP_DIRECTION.join('|')}`);
  if (!isStr(e.directionNote)) errs.push(`${w}.directionNote`);
  if (!LP_CONFIDENCE.includes(e.confidence)) errs.push(`${w}.confidence not in ${LP_CONFIDENCE.join('|')}`);
  if (!Array.isArray(e.gaps) || !e.gaps.every((s) => isStr(s))) errs.push(`${w}.gaps must be an array of strings`);
  const anyUnknown = [no && no.status, re && re.link, zo && zo.route].includes('unknown');
  if (Array.isArray(e.gaps) && e.gaps.length === 0 && (e.confidence === 'low' || anyUnknown)) errs.push(`${w}.gaps must be non-empty when confidence is low or any status is unknown`);
  if (!Array.isArray(e.steps)) errs.push(`${w}.steps must be an array`);
  else {
    e.steps.forEach((s, i) => {
      if (s.n !== i + 1) errs.push(`${w}.steps[${i}].n must be ${i + 1} (ordered 1..k), got ${s.n}`);
      if (!isStr(s.what) || !isStr(s.who)) errs.push(`${w}.steps[${i}] what/who`);
      src(s, `steps[${i}]`);
      if (s.duration !== undefined) { if (!isStr(s.duration.text)) errs.push(`${w}.steps[${i}].duration.text`); src(s.duration, `steps[${i}].duration`); }
    });
    if (e.steps.length < 2 && !(e.confidence === 'low' && Array.isArray(e.gaps) && e.gaps.length > 0)) errs.push(`${w}.steps needs >= 2 entries (or confidence low with a gaps entry explaining why)`);
  }
  for (const f of EXTENSIONS.legalPathway) if (e[f] !== undefined && !isStr(e[f])) errs.push(`${w}.${f} must be a non-empty string`);
  return errs;
}
// Agreement between the qualitative legal-ownership layer record and a legal pathway entry.
export function legalAgreement(id, layerRec, entry) {
  const e = [];
  if (!layerRec || !entry) return e;
  const a = layerRec.foreign_ownership && layerRec.foreign_ownership.allowed, b = entry.nonResidentOwnership && entry.nonResidentOwnership.status;
  const okPairs = { yes: ['open', 'open_with_conditions', 'unknown'], restricted: ['restricted', 'open_with_conditions', 'unknown'], no: ['restricted'] };
  if (!okPairs[a] || !okPairs[a].includes(b)) e.push(`${id}: legal-ownership says foreign_ownership=${a} but legalPathway says ${b}`);
  const dir = { stable: 'stable', tightening: 'tightening', loosening: 'loosening', volatile: 'mixed' }[layerRec.regulatory_direction];
  if (dir && entry.direction !== dir && entry.direction !== 'unknown') e.push(`${id}: regulatory_direction=${layerRec.regulatory_direction} (expects ${dir}) but legalPathway.direction=${entry.direction}`);
  return e;
}

// ---------------------------------------------------------------------------------------------------------------
// Context entry (Koppen shares + Aqueduct classes).
export function validateContextEntry(id, c) {
  const e = [];
  if (!c || typeof c !== 'object') return [`${id}: context entry missing`];
  const k = c.koppen, w = c.water;
  if (!k) e.push(`${id}.koppen missing`);
  else {
    if (!k.periods || typeof k.periods !== 'object') e.push(`${id}.koppen.periods missing`);
    else {
      for (const p of KOPPEN_PERIODS) if (!k.periods[p]) e.push(`${id}.koppen.periods["${p}"] missing`);
      for (const [p, v] of Object.entries(k.periods)) {
        if (!KOPPEN_CODES.includes(v.dominant)) e.push(`${id}.koppen.${p}.dominant "${v.dominant}" not a Koppen-Geiger code`);
        const codes = Object.keys(v.shares || {});
        for (const cd of codes) if (!KOPPEN_CODES.includes(cd)) e.push(`${id}.koppen.${p}.shares code "${cd}" not in the 30-class legend`);
        const sum = codes.reduce((s, cd) => s + Number(v.shares[cd]), 0);
        if (!codes.length || Math.abs(sum - 1) > 0.02) e.push(`${id}.koppen.${p}.shares sum ${sum.toFixed(3)} (must be 1 +- 0.02)`);
      }
    }
    if (!k.source) e.push(`${id}.koppen.source missing`);
  }
  if (!w) e.push(`${id}.water missing`);
  else {
    for (const f of ['baselineStress', 'stress2050Bau']) {
      const s = w[f];
      if (!s || !isNum(s.ratio)) e.push(`${id}.water.${f}.ratio must be a number`);
      if (!s || typeof s.class !== 'string' || !AQUEDUCT_CLASS.test(s.class.replace(/\s+/g, ' ').replace(/[–—]/g, '-').trim())) e.push(`${id}.water.${f}.class "${s && s.class}" not in the WRI Aqueduct vocabulary`);
    }
    for (const f of ['droughtRisk', 'interannualVariability', 'seasonalVariability', 'groundwaterTrend', 'riverineFloodRisk']) if (w[f] !== undefined && typeof w[f] !== 'string') e.push(`${id}.water.${f} must be a WRI class string`);
    if (!w.source) e.push(`${id}.water.source missing`);
  }
  return e;
}

// Sources registry entry.
export function validateSourceEntry(id, s) {
  const e = [];
  if (!s || typeof s !== 'object') return [`${id}: entry missing`];
  for (const f of ['name', 'license', 'attribution']) if (!isStr(s[f])) e.push(`${id}.${f}`);
  if (!isUrl(s.url)) e.push(`${id}.url`);
  if (!(isUrl(s.licenseUrl) || s.licenseUrl === null)) e.push(`${id}.licenseUrl must be a URL or null`);
  if (!SOURCE_STATUS.includes(s.licenseStatus)) e.push(`${id}.licenseStatus must be confirmed|unconfirmed`);
  if (!isIso(s.checked)) e.push(`${id}.checked must be an ISO date`);
  if (s.licenseStatus === 'unconfirmed' && !/licence not confirmed/i.test(s.license || '')) e.push(`${id}: unconfirmed licence must say "licence not confirmed" in .license (never infer a licence)`);
  if (s.licenseStatus === 'confirmed' && /licence not confirmed/i.test(s.license || '')) e.push(`${id}: licenseStatus confirmed but the licence text says not confirmed`);
  return e;
}

// Layer source registry entry.
export function validateLayerSource(l, { today = todayIso() } = {}) {
  const e = [], w = `layer ${l && l.id}`;
  if (!l || !isStr(l.id)) return [`${w}: id missing`];
  if (!isStr(l.label)) e.push(`${w}.label`);
  if (!LAYER_KINDS.includes(l.kind)) e.push(`${w}.kind "${l.kind}" not in ${LAYER_KINDS.join('|')}`);
  if (!LAYER_STATUS.includes(l.status)) e.push(`${w}.status "${l.status}" not in ${LAYER_STATUS.join('|')}`);
  // Retired entries are kept with their reason and may carry url: null (a dead end nobody should re-try); every other
  // entry that has a url must be an https template, and live (active/fragile) tile layers must have one.
  const live = l.status === 'active' || l.status === 'fragile';
  if (l.url != null || (live && l.kind !== 'geojson')) {
    if (!isHttps(l.url)) e.push(`${w}.url must be an https template`);
    else if (l.kind === 'xyz' && !(/\{z\}/.test(l.url) && /\{x\}/.test(l.url) && /\{y\}/.test(l.url))) e.push(`${w}.url xyz template needs {z}/{x}/{y}`);
  }
  if (l.kind === 'geojson' && live && l.url == null && !(l.urls && typeof l.urls === 'object')) e.push(`${w}: a live geojson layer needs url or urls`);
  if (isNum(l.minzoom) && isNum(l.maxzoom) && l.maxzoom < l.minzoom) e.push(`${w}.maxzoom < minzoom`);
  if (/seismic/i.test(l.id) && l.maxzoom !== 6) e.push(`${w}.maxzoom must be 6 for the seismic layer (tiles stop at z6)`);
  if (/popul|gpw/i.test(l.id) && typeof l.url === 'string' && /(?:^|[/_=-])(?:19|20)\d{2}-\d{2}-\d{2}(?:[/_.-]|$)|\/(?:19|20)\d{6}\//.test(l.url)) e.push(`${w}.url carries a date segment (it will 404 when the provider rolls the date)`);
  if (l.status === 'active') {
    if (!isIso(l.verified)) e.push(`${w}.verified must be an ISO date for an active layer`);
    else if (daysBetween(l.verified, today) > 120) e.push(`${w}.verified ${l.verified} is more than 120 days old`);
    if (!isStr(l.attribution)) e.push(`${w}.attribution required for an active layer`);
  }
  return e;
}

// Land standing / region depth optional fields.
export function validateLandStandingExtras(id, e) {
  const errs = [];
  if (e.sources !== undefined) {
    if (!Array.isArray(e.sources)) errs.push(`${id}.sources must be an array`);
    else e.sources.forEach((s, i) => { if (!isStr(s.claim) || !isStr(s.label) || !isHttps(s.url)) errs.push(`${id}.sources[${i}] needs claim, label, https url`); });
  }
  if (e.territorySource !== undefined && !isStr(e.territorySource)) errs.push(`${id}.territorySource`);
  if (e.territorySourceUrl !== undefined && !isHttps(e.territorySourceUrl)) errs.push(`${id}.territorySourceUrl must be https`);
  return errs;
}
export function validateDepthExtras(id, e) {
  const errs = [];
  if (e.caseLinks !== undefined) {
    if (!Array.isArray(e.caseLinks)) errs.push(`${id}.caseLinks must be an array`);
    else e.caseLinks.forEach((s, i) => { if (!isStr(s.title) || !isHttps(s.url)) errs.push(`${id}.caseLinks[${i}] needs title and https url`); if (s.note !== undefined && typeof s.note !== 'string') errs.push(`${id}.caseLinks[${i}].note`); });
  }
  return errs;
}
