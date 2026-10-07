// node --test lib/qual-labels.test.mjs
// The qualitative label map: no raw enum token, no superlative, no underscore, every baseline enum value labelled.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { qualLabel, qualOptions, QUAL_FIELDS, NOT_READ } from './qual-labels.js';
import { LAYER_ENUMS, LP_OWNERSHIP, LP_RESIDENCY, LP_ZONING, LP_DIRECTION, LP_CONFIDENCE } from '../tests/schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROC = path.resolve(here, '../data/processed');
const SUPERLATIVE = /\b(best|top|ideal|winner|leading|densest|strongest|cheapest|lowest|highest|most|least)\b/i;

const EDGES = { unit: 'EUR', edges: [3000, 8000, 20000, 50000] };
const EDGES_PER = { unit: 'USD per hectare', edges: [5000, 10000, 20000, 40000] };
const EDGES_OBJ = { unit: 'CAD', edges: { cheapest: [null, 4000], low: [4000, 9000], moderate: [9000, 15000], premium: [15000, 30000], very_premium: [30000, null] } };
const METAS = { none: undefined, relative: { affordability_band: { relative: true } }, edges: { affordability_band: EDGES }, edgesPer: { affordability_band: EDGES_PER }, edgesObj: { affordability_band: EDGES_OBJ }, badEdges: { affordability_band: { unit: 'EUR', edges: [5, 3, 9, 1] } } };

// Every categorical value the baseline layers carry, as [field, value] (nested foreign_ownership.allowed included).
function baselineValues() {
  const out = new Map();
  const add = (f, v) => { if (!out.has(f)) out.set(f, new Set()); out.get(f).add(v); };
  const enumFields = new Set(Object.keys(QUAL_FIELDS));
  const walk = (o, parent) => {
    for (const [k, v] of Object.entries(o || {})) {
      if (typeof v === 'string') {
        const f = parent === 'foreign_ownership' && k === 'allowed' ? 'foreign_ownership' : k;
        if (enumFields.has(f) && f !== 'foreign_ownership_notes') add(f, v);
      } else if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, k);
    }
  };
  for (const f of readdirSync(PROC).filter((n) => /^(legal-ownership|land-cost|demographic-trajectory|soil-contamination|water-source-control|climate-buffering)\.(geojson|json)$/.test(n))) {
    const j = JSON.parse(readFileSync(path.join(PROC, f), 'utf8'));
    if (Array.isArray(j.features)) j.features.forEach((ft) => walk(ft.properties));
    else (Array.isArray(j) ? j : Object.values(j)).forEach((r) => r && typeof r === 'object' && walk(r));
  }
  return out;
}
// Enum definitions in the layers' own metadata files: `key: "a|b|c"` and `allowed: "a|b|c"`.
function metadataEnums() {
  const out = new Map();
  for (const f of readdirSync(PROC).filter((n) => n.endsWith('.metadata.yaml'))) {
    for (const line of readFileSync(path.join(PROC, f), 'utf8').split('\n')) {
      const m = /(?:^|[\s{,])(\w+):\s*"([a-z_]+(?:\|[a-z_]+)+)"/.exec(line);
      if (m) { const key = m[1] === 'allowed' ? 'foreign_ownership' : m[1]; if (!out.has(key)) out.set(key, new Set()); m[2].split('|').forEach((v) => out.get(key).add(v)); }
    }
  }
  return out;
}

test('no label contains a superlative or an underscore, with every kind of meta', () => {
  for (const [mname, meta] of Object.entries(METAS)) {
    for (const [field, def] of Object.entries(QUAL_FIELDS)) {
      for (const v of def.values) {
        const label = qualLabel(field, v, meta);
        assert.ok(label && typeof label === 'string', `${field}=${v} (${mname}) has no label`);
        assert.ok(!SUPERLATIVE.test(label), `${field}=${v} (${mname}) label "${label}" holds a superlative`);
        assert.ok(!/_/.test(label), `${field}=${v} (${mname}) label "${label}" holds an underscore`);
        assert.ok(label === qualLabel(field, v, meta));
      }
    }
  }
});

test('every enum value found in the baseline processed layers has a label (never the raw token)', () => {
  const found = baselineValues();
  assert.ok(found.size >= 12, `expected the baseline layers to carry many enum fields, found ${found.size}`);
  for (const [field, values] of found) {
    for (const v of values) {
      const label = qualLabel(field, v);
      if (v === 'unknown') assert.match(label, /not read/);
      else { assert.notEqual(label, NOT_READ, `${field}=${v} found in a baseline layer but has no label`); if (v.includes('_')) assert.notEqual(label, v, `${field}=${v} label is the raw token`); }
      assert.ok(!/_/.test(label) && !SUPERLATIVE.test(label), `${field}=${v} -> "${label}"`);
    }
  }
});

test('every enum value defined in the layers\' metadata.yaml files has a label', () => {
  const enums = metadataEnums();
  assert.ok(enums.size >= 10, `parsed only ${enums.size} metadata enums`);
  for (const [field, values] of enums) {
    assert.ok(QUAL_FIELDS[field], `metadata enum field "${field}" has no entry in QUAL_FIELDS`);
    for (const v of values) { if (v !== 'unknown') assert.notEqual(qualLabel(field, v), NOT_READ, `${field}=${v} is defined in metadata but unlabelled`); else assert.match(qualLabel(field, v), /not read/); }
  }
});

test('every enum value in tests/schema.mjs (layer enums and legal-pathway enums) has a label', () => {
  for (const [layer, fields] of Object.entries(LAYER_ENUMS)) {
    for (const [key, values] of Object.entries(fields)) {
      const field = key === 'foreign_ownership.allowed' ? 'foreign_ownership' : key;
      assert.ok(QUAL_FIELDS[field], `${layer}.${key} has no QUAL_FIELDS entry`);
      for (const v of values) { if (v !== 'unknown') assert.notEqual(qualLabel(field, v), NOT_READ, `${layer}.${key}=${v}`); else assert.match(qualLabel(field, v), /not read/); }
    }
  }
  const lp = { lp_ownership_status: LP_OWNERSHIP, lp_residency_link: LP_RESIDENCY, lp_zoning_route: LP_ZONING, lp_direction: LP_DIRECTION, lp_confidence: LP_CONFIDENCE };
  for (const [field, values] of Object.entries(lp)) for (const v of values) { if (v !== 'unknown') assert.notEqual(qualLabel(field, v), NOT_READ, `${field}=${v}`); }
});

test("qualLabel('affordability_band', 'cheapest') never contains the word cheapest, with or without edges", () => {
  for (const meta of Object.values(METAS)) assert.doesNotMatch(qualLabel('affordability_band', 'cheapest', meta), /cheapest/i);
  assert.equal(qualLabel('affordability_band', 'cheapest'), 'very low price band');
  assert.equal(qualLabel('affordability_band', 'low'), 'low price band');
  assert.equal(qualLabel('affordability_band', 'moderate'), 'middle price band');
  assert.equal(qualLabel('affordability_band', 'premium'), 'high price band');
  assert.equal(qualLabel('affordability_band', 'very_premium'), 'very high price band');
  assert.equal(qualLabel('affordability_band', 'unknown'), 'price not read');
});

test('affordability bands print in the layer\'s native unit when the layer documents edges', () => {
  const m = METAS.edges;
  assert.equal(qualLabel('affordability_band', 'cheapest', m), 'under 3,000 EUR per hectare');
  assert.equal(qualLabel('affordability_band', 'low', m), '3,000 to 8,000 EUR per hectare');
  assert.equal(qualLabel('affordability_band', 'moderate', m), '8,000 to 20,000 EUR per hectare');
  assert.equal(qualLabel('affordability_band', 'premium', m), '20,000 to 50,000 EUR per hectare');
  assert.equal(qualLabel('affordability_band', 'very_premium', m), '50,000 EUR per hectare and over');
  assert.equal(qualLabel('affordability_band', 'unknown', m), 'price not read');
  // a unit that already says per hectare is not doubled
  assert.equal(qualLabel('affordability_band', 'cheapest', METAS.edgesPer), 'under 5,000 USD per hectare');
  assert.equal(qualLabel('affordability_band', 'very_premium', METAS.edgesPer), '40,000 USD per hectare and over');
  // object form with open ends
  assert.equal(qualLabel('affordability_band', 'cheapest', METAS.edgesObj), 'under 4,000 CAD per hectare');
  assert.equal(qualLabel('affordability_band', 'premium', METAS.edgesObj), '15,000 to 30,000 CAD per hectare');
  assert.equal(qualLabel('affordability_band', 'very_premium', METAS.edgesObj), '30,000 CAD per hectare and over');
  // unusable edges fall back to the relative wording, which says what it is
  assert.equal(qualLabel('affordability_band', 'premium', METAS.badEdges), 'high price band');
  assert.equal(qualLabel('affordability_band', 'premium', METAS.relative), 'high price band');
});

test('every other unknown reads "not read"; empty, missing and unrecognised values read "not read" too', () => {
  for (const [field, def] of Object.entries(QUAL_FIELDS)) {
    if (!def.values.includes('unknown') || field === 'affordability_band' || field === 'lp_direction') continue;
    assert.equal(qualLabel(field, 'unknown'), 'not read', field);
  }
  for (const bad of [null, undefined, '', 'nonsense', 'very_high_plus', 42]) {
    assert.equal(qualLabel('buffering_strength', bad), 'not read');
    assert.equal(qualLabel('regulatory_direction', bad), 'not read');
  }
  assert.equal(qualLabel('no_such_field', 'yes'), 'not read');
  assert.equal(qualLabel('foreign_ownership', 'toString'), 'not read');
});

test('qualOptions: "any" first, internal tokens as values, labels from the map, never a token as text', () => {
  const expected = {
    foreign_ownership: ['any', 'yes', 'restricted', 'no'],
    affordability_band: ['any', 'cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'],
    buffering_strength: ['any', 'very_low', 'low', 'moderate', 'high', 'very_high'],
    regulatory_direction: ['any', 'stable', 'tightening', 'loosening', 'volatile'],
  };
  for (const [field, values] of Object.entries(expected)) {
    for (const meta of [undefined, METAS.edges]) {
      const opts = qualOptions(field, meta);
      assert.deepEqual(opts.map((o) => o.value), values, `${field} option values (old ?q.${field}= links keep parsing)`);
      assert.equal(opts[0].label, 'any');
      for (const o of opts.slice(1)) {
        assert.equal(o.label, qualLabel(field, o.value, meta));
        assert.ok(!/_/.test(o.label) && !SUPERLATIVE.test(o.label), `${field}: "${o.label}"`);
        if (!/^[a-z]+$/.test(o.value)) assert.notEqual(o.label, o.value);
      }
      assert.equal(new Set(opts.map((o) => o.label)).size, opts.length, `${field} labels are distinct`);
    }
  }
  assert.deepEqual(qualOptions('no_such_field'), [{ value: 'any', label: 'any' }]);
  assert.equal(qualLabel('foreign_ownership.allowed', 'yes'), 'allowed');
});

test('the module is pure: no imports, no DOM, no globals', () => {
  const src = readFileSync(path.join(here, 'qual-labels.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(src, /^\s*import\s/m);
  assert.doesNotMatch(src, /\b(?:document|window|localStorage|process|require|fetch|navigator)\b/);
});
