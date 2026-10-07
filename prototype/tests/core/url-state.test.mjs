// lib/url-state.js: the shareable view round-trips (with the continent), foreign parameters survive a write, pins infer the
// continent of old links, and old links keep parsing. The first half runs on baseline data (6bce1a3); the last tests run on
// the working tree's data to prove lib/result.js (edge) and the page (lib/filters.js regionPasses) agree on q.* and c.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { regions, values, criteria } from '../../../upgrade-2026-10/verify/baseline-site/prototype/data/regions.js';
import * as tree from '../../data/regions.js';
import { thresholdDefault, thresholdStep, clampThreshold, regionPasses } from '../../lib/filters.js';
import { parseThresholds, parseShortlist, parseQual, parseState, parseContinent, resolveContinent, buildSearch, qualFiltersFor } from '../../lib/url-state.js';
import { computeResult as computeResultRaw, resolveQuery as resolveQueryRaw } from '../../lib/result.js';
import { v1Lookup } from '../../data/v1-lookup.js';
import { QUAL_FILTERS as CLIENT_QUAL } from '../../src/config/qual-filters.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SHARE_LINKS = path.resolve(HERE, '..', '..', '..', 'upgrade-2026-10', 'verify', 'baseline', 'share-links.json');

const qualFilters = [
  { id: 'foreign_ownership', options: ['any', 'yes', 'restricted', 'no'], pick: () => undefined },
  { id: 'affordability_band', options: ['any', 'cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'], pick: () => undefined },
  { id: 'buffering_strength', options: ['any', 'very_low', 'low', 'moderate', 'high', 'very_high'], pick: () => undefined },
  { id: 'regulatory_direction', options: ['any', 'stable', 'tightening', 'loosening', 'volatile'], pick: () => undefined },
];
const data = { regions, values, criteria, qualFilters };
const blank = () => ({
  continent: 'europe',
  thresholds: Object.fromEntries(criteria.map((c) => [c.id, thresholdDefault(c)])),
  shortlist: new Set(),
  qualFilters: Object.fromEntries(qualFilters.map((q) => [q.id, 'any'])),
});
// What the page does with a parsed query: start from defaults, then lay the parsed values over them.
function applied(search) {
  const st = blank();
  const p = parseState(search, data);
  if (p.continent) st.continent = p.continent;
  Object.assign(st.thresholds, p.thresholds);
  p.shortlist.forEach((id) => st.shortlist.add(id));
  Object.assign(st.qualFilters, p.qualFilters);
  return st;
}
const same = (a, b) => {
  assert.equal(a.continent, b.continent);
  assert.deepEqual(a.thresholds, b.thresholds);
  assert.deepEqual([...a.shortlist], [...b.shortlist]);
  assert.deepEqual(a.qualFilters, b.qualFilters);
};

test('a state at its defaults encodes to the empty string, and the empty query parses to nothing', () => {
  assert.equal(buildSearch(blank(), data), '');
  assert.deepEqual(parseState('', data), { thresholds: {}, shortlist: [], qualFilters: {}, continent: null });
  assert.deepEqual(parseState(undefined, data), { thresholds: {}, shortlist: [], qualFilters: {}, continent: null });
});

test('round trip over random states (thresholds on the slider grid, pins, qualitative filters, continent)', () => {
  let seed = 99;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  for (let i = 0; i < 300; i++) {
    const st = blank();
    for (const c of criteria) {
      if (rand() < 0.5) {
        const step = thresholdStep(c);
        const raw = c.rangeMin + rand() * (c.rangeMax - c.rangeMin);
        st.thresholds[c.id] = +(Math.round(raw / step) * step).toFixed(4);
        st.thresholds[c.id] = Math.max(c.rangeMin, Math.min(c.rangeMax, st.thresholds[c.id]));
      }
    }
    regions.forEach((r) => { if (rand() < 0.15) st.shortlist.add(r.id); });
    st.continent = rand() < 0.5 ? 'europe' : 'north-america';
    qualFilters.forEach((q) => { if (rand() < 0.3) st.qualFilters[q.id] = q.options[1 + Math.floor(rand() * (q.options.length - 1))]; });
    const search = buildSearch(st, data);
    same(applied(search), st);
    // idempotent: re-encoding the decoded state gives the same string
    assert.equal(buildSearch(applied(search), data), search);
  }
});

test('the value 1600 stays 1600 (trailing zeros of an integer are never trimmed)', () => {
  const c = criteria.find((x) => x.id === 'solar_pv') || criteria.find((x) => thresholdStep(x) === 10 && x.rangeMax >= 1600);
  assert.ok(c, 'a criterion with step 10 that reaches 1600');
  const st = blank();
  st.thresholds[c.id] = 1600;
  const search = buildSearch(st, data);
  assert.equal(search, `?t.${c.id}=1600`);
  assert.equal(parseThresholds(search, data)[c.id], 1600);
  assert.equal(applied(search).thresholds[c.id], 1600);
  // fractional trailing zeros are trimmed
  const w = criteria.find((x) => thresholdStep(x) === 0.01);
  const sw = blank();
  sw.thresholds[w.id] = 0.3;
  assert.equal(buildSearch(sw, data), `?t.${w.id}=0.3`);
});

test('unknown ids, bad numbers and out-of-enum values are skipped silently', () => {
  const c = criteria[0];
  const q = parseState(`t.${c.id}=abc&t.nope=3&t.=1&pin=nowhere,,${regions[0].id}&q.nope=x&q.foreign_ownership=maybe&q.regulatory_direction=stable`, data);
  assert.deepEqual(q.thresholds, {});
  assert.deepEqual(q.shortlist, [regions[0].id]);
  assert.deepEqual(q.qualFilters, { regulatory_direction: 'stable' });
});

test('thresholds are clamped to the criterion range', () => {
  const c = criteria[0];
  const p = parseThresholds(`t.${c.id}=100000`, data);
  assert.equal(p[c.id], c.rangeMax);
  const p2 = parseThresholds(`t.${c.id}=-100000`, data);
  assert.equal(p2[c.id], c.rangeMin);
});

test('old shared links keep parsing, accepting a string, a leading ? or URLSearchParams', () => {
  const c = criteria.find((x) => x.id === 'water_stress');
  const a = parseState(`t.${c.id}=0.3&pin=${regions[1].id},${regions[0].id}&q.affordability_band=cheapest`, data);
  assert.equal(a.thresholds[c.id], 0.3);
  assert.deepEqual(a.shortlist, [regions[1].id, regions[0].id], 'pin order is kept');
  assert.equal(a.qualFilters.affordability_band, 'cheapest');
  assert.deepEqual(parseState(`?t.${c.id}=0.3`, data).thresholds, { [c.id]: 0.3 });
  assert.deepEqual(parseState(new URLSearchParams(`t.${c.id}=0.3`), data).thresholds, { [c.id]: 0.3 });
});

test('repeated pins are listed once; the individual parsers agree with parseState', () => {
  const id = regions[0].id;
  assert.deepEqual(parseShortlist(`pin=${id},${id}`, data), [id]);
  assert.deepEqual(parseQual('q.foreign_ownership=yes', data), { foreign_ownership: 'yes' });
});

test('filtered share link from the equivalence gate parses to what the page shows', () => {
  const st = applied('t.water_stress=0.3&t.solar_pv=1400&pin=galicia');
  assert.equal(st.thresholds.water_stress, 0.3);
  assert.equal(st.thresholds.solar_pv, 1400);
  assert.deepEqual([...st.shortlist], ['galicia']);
  assert.equal(buildSearch(st, data), '?t.water_stress=0.3&t.solar_pv=1400&pin=galicia');
});

// ------------------------------------------------------------------------------------------------ the continent in the URL
const NA = regions.find((r) => r.continent === 'north-america').id;
const EU = regions.find((r) => r.continent === 'europe').id;

test('?c= is read, written and validated', () => {
  assert.equal(parseContinent('c=north-america', data), 'north-america');
  assert.equal(parseContinent('?c=Europe', data), 'europe', 'case and whitespace are forgiven');
  assert.equal(parseContinent('c=asia', data), null, 'a continent with no regions is not a continent');
  assert.equal(parseContinent('c=asia&pin=' + NA, data), 'north-america', 'an invalid c falls back to the pin');
  assert.equal(parseContinent('', data), null);
  assert.equal(resolveContinent('', data), 'europe');
  assert.equal(resolveContinent('', { ...data, defaultContinent: 'north-america' }), 'north-america');
  // a bare Europe tab keeps the URL bare; the other tab is written
  const st = blank();
  assert.equal(buildSearch(st, data), '');
  st.continent = 'north-america';
  assert.equal(buildSearch(st, data), '?c=north-america');
  assert.equal(parseState('?c=north-america', data).continent, 'north-america');
  // c survives alongside the rest and comes last
  st.shortlist.add(EU);
  assert.equal(buildSearch(st, data), `?pin=${EU}&c=north-america`);
});

test('pins infer the continent: a link without c opens the continent of its FIRST pinned region', () => {
  assert.equal(parseState(`pin=${NA}`, data).continent, 'north-america', 'legacy ?pin=vermont-style link');
  assert.equal(parseState(`pin=${EU},${NA}`, data).continent, 'europe');
  assert.equal(parseState(`pin=${NA},${EU}`, data).continent, 'north-america');
  assert.equal(parseState(`c=europe&pin=${NA}`, data).continent, 'europe', 'an explicit c beats the pin');
  // c is written only where the pin inference would land elsewhere, so the round trip is exact either way
  const onNA = blank(); onNA.continent = 'north-america'; onNA.shortlist.add(NA);
  assert.equal(buildSearch(onNA, data), `?pin=${NA}`, 'NA tab with an NA pin needs no c');
  const onEU = blank(); onEU.shortlist.add(NA);
  assert.equal(buildSearch(onEU, data), `?pin=${NA}&c=europe`, 'Europe tab with an NA first pin must say so');
  same(applied(buildSearch(onEU, data)), onEU);
  same(applied(buildSearch(onNA, data)), onNA);
});

// ------------------------------------------------------------------------------------------------ foreign parameters
test('buildSearch keeps parameters it did not write (modal, utm_*, unknown keys), in place, and never duplicates its own', () => {
  const st = blank();
  st.thresholds.solar_pv = 1400;
  const base = '?utm_source=news&t.solar_pv=900&modal=1&t.not_a_criterion=7&pin=old&utm_campaign=a%20b&c=north-america';
  const out = buildSearch(st, data, base);
  const q = new URLSearchParams(out);
  assert.deepEqual([...q.keys()], ['utm_source', 'modal', 't.not_a_criterion', 'utm_campaign', 't.solar_pv'],
    'foreign keys first in their original order, then the keys this build writes; the stale pin and c are gone');
  assert.equal(q.get('utm_campaign'), 'a b');
  assert.equal(q.get('t.solar_pv'), '1400');
  assert.equal(q.get('modal'), '1');
  // at defaults only the foreign parameters remain
  assert.equal(buildSearch(blank(), data, '?modal=1&t.solar_pv=900'), '?modal=1');
  assert.equal(buildSearch(blank(), data, '?utm_source=x'), '?utm_source=x');
  assert.equal(buildSearch(blank(), data, ''), '');
  assert.equal(buildSearch(blank(), data, '?'), '');
  // a second write with its own output as base is stable
  const again = buildSearch(st, data, out);
  assert.equal(again, out);
  // parsing ignores the foreign keys
  same(applied(out), st);
});

test('a slider move after a link with modal and utm keeps them (the page passes location.search as the base)', () => {
  const st = applied('?utm_source=news&modal=1&pin=' + NA);
  st.thresholds.water_stress = 0.3;
  const out = buildSearch(st, data, '?utm_source=news&modal=1&pin=' + NA);
  const q = new URLSearchParams(out);
  assert.equal(q.get('utm_source'), 'news');
  assert.equal(q.get('modal'), '1');
  assert.equal(q.get('t.water_stress'), '0.3');
  assert.equal(q.get('pin'), NA);
  assert.equal(q.get('c'), null, 'north-america is what the pin already says');
});

// ------------------------------------------------------------------------------------------------ back-compat replay
// The 10 links the 6bce1a3 build produced (verify/baseline/share-links.json, MC-BASE). `baselineParse` transcribes that build's
// applyThresholdsFromURL / applyShortlistFromURL / applyQualFromURL; the continent rule is the one deliberate change.
function baselineParse(search) {
  const params = new URLSearchParams(search);
  const out = { thresholds: Object.fromEntries(criteria.map((c) => [c.id, thresholdDefault(c)])), shortlist: [], qualFilters: Object.fromEntries(qualFilters.map((q) => [q.id, 'any'])) };
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  for (const [key, value] of params.entries()) {
    if (!key.startsWith('t.')) continue;
    const crit = byId[key.slice(2)];
    if (!crit) continue;
    const num = parseFloat(value);
    if (!Number.isFinite(num)) continue;
    out.thresholds[crit.id] = clampThreshold(crit, num);
  }
  const pin = params.get('pin');
  if (pin) {
    const known = new Set(regions.map((r) => r.id));
    pin.split(',').map((x) => x.trim()).filter(Boolean).forEach((id) => { if (known.has(id) && !out.shortlist.includes(id)) out.shortlist.push(id); });
  }
  for (const qf of qualFilters) {
    const val = params.get(`q.${qf.id}`);
    if (val && qf.options.includes(val)) out.qualFilters[qf.id] = val;
  }
  return out;
}

test('replay: the 10 baseline share links parse to the same thresholds, pins and qualitative filters as the 6bce1a3 parser', () => {
  const links = JSON.parse(readFileSync(SHARE_LINKS, 'utf8'));
  assert.equal(links.length, 10);
  for (const link of links) {
    const want = baselineParse(link.query);
    const st = applied(link.query);
    assert.deepEqual(st.thresholds, want.thresholds, link.id + ' ' + link.query);
    assert.deepEqual([...st.shortlist], want.shortlist, link.id + ' ' + link.query);
    assert.deepEqual(st.qualFilters, want.qualFilters, link.id + ' ' + link.query);
    // the continent: Europe unless the first pinned region is elsewhere (a legacy ?pin=vermont opens North America)
    const first = want.shortlist[0] && regions.find((r) => r.id === want.shortlist[0]);
    assert.equal(st.continent, first ? first.continent : 'europe', link.id + ' ' + link.query);
    // and writing the state back gives the link's own query (modal=1 survives only through the base)
    const own = link.query.replace(/^\?/, '').split('&').filter((kv) => kv && !kv.startsWith('modal=')).join('&');
    assert.equal(buildSearch(st, data), own ? '?' + own : '', link.id + ' rebuilt');
    assert.equal(buildSearch(st, data, link.query), link.query || '', link.id + ' rebuilt with its base');
  }
  const legacy = links.find((l) => l.id === 'legacy-pin');
  assert.equal(applied(legacy.query).continent, 'north-america');
  const modal = links.find((l) => l.id === 'modal');
  assert.equal(buildSearch(blank(), data, modal.query), '?modal=1');
});

// ------------------------------------------------------------------------------------------------ edge parity (working-tree data)
const treeData = { regions: tree.regions, values: tree.values, criteria: tree.criteria, qualFilters: CLIENT_QUAL };
// What api/og.js and api/share.js do: hand computeResult the lookup-backed filter definitions.
const EDGE_QUAL = qualFiltersFor(v1Lookup);
const computeResult = (sp, continent) => computeResultRaw(sp, continent, EDGE_QUAL);
const resolveQuery = (sp, continent) => resolveQueryRaw(sp, continent, EDGE_QUAL);
const treeBlank = () => ({
  thresholds: Object.fromEntries(tree.criteria.map((c) => [c.id, thresholdDefault(c)])),
  qualFilters: Object.fromEntries(CLIENT_QUAL.map((q) => [q.id, 'any'])),
});

test('qualFiltersFor (the edge definitions) equals src/config/qual-filters.js: ids, options and what they read', () => {
  assert.deepEqual(EDGE_QUAL.map((q) => [q.id, q.options]), CLIENT_QUAL.map((q) => [q.id, q.options]));
  for (const r of tree.regions) {
    for (let i = 0; i < EDGE_QUAL.length; i++) assert.equal(EDGE_QUAL[i].pick(r.id), CLIENT_QUAL[i].pick(r.id), `${EDGE_QUAL[i].id} ${r.id}`);
  }
  assert.ok(tree.regions.some((r) => EDGE_QUAL[0].pick(r.id) !== undefined), 'the lookup really has values (an empty one would hide a drift)');
});

test('edge parity: computeResult over 200 random states (thresholds, q.*, c, pin) counts what the page counts', () => {
  let seed = 424242;
  const rand = () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };
  let withQual = 0, narrowed = 0, nonEurope = 0;
  for (let i = 0; i < 200; i++) {
    const st = treeBlank();
    const p = new URLSearchParams();
    for (const c of tree.criteria) {
      if (rand() < 0.4) {
        const step = thresholdStep(c);
        const raw = c.rangeMin + rand() * (c.rangeMax - c.rangeMin);
        const v = clampThreshold(c, +(Math.round(raw / step) * step).toFixed(4));
        st.thresholds[c.id] = v;
        p.set(`t.${c.id}`, String(v));
      }
    }
    for (const q of CLIENT_QUAL) {
      if (rand() < 0.35) {
        const opts = q.options.slice(1);
        const pick = opts[Math.floor(rand() * opts.length)];
        st.qualFilters[q.id] = pick;
        p.set(`q.${q.id}`, pick);
        withQual++;
      }
    }
    const pins = tree.regions.filter(() => rand() < 0.05).map((r) => r.id);
    if (pins.length) p.set('pin', pins.join(','));
    let continent;
    const roll = rand();
    if (roll < 0.4) { continent = 'north-america'; p.set('c', continent); }
    else if (roll < 0.7) { continent = 'europe'; p.set('c', continent); }
    else continent = parseContinent(p, treeData) || 'europe'; // no c: the pin rule, else Europe
    if (rand() < 0.3) p.set('utm_source', 'x');
    if (rand() < 0.1 && st.qualFilters.regulatory_direction === 'any') p.set('q.regulatory_direction', 'not-a-value');
    if (continent !== 'europe') nonEurope++;

    const wantCount = tree.regions.filter((r) => r.continent === continent && regionPasses(r.id, st, treeData)).length;
    const wantTotal = tree.regions.filter((r) => r.continent === continent).length;
    const got = computeResult(new URLSearchParams(p));
    assert.equal(got.matching.length, wantCount, `#${i} ?${p}`);
    assert.equal(got.total, wantTotal, `#${i} ?${p}`);
    assert.deepEqual(got.matching.map((r) => r.id), tree.regions.filter((r) => r.continent === continent && regionPasses(r.id, st, treeData)).map((r) => r.id));
    assert.equal(resolveQuery(new URLSearchParams(p)).continent, continent, `continent #${i} ?${p}`);
    assert.equal(resolveContinent(p, treeData), continent, `url-state continent #${i} ?${p}`);
    if (got.matching.length < got.total) narrowed++;
  }
  assert.ok(withQual > 50, `q.* filters were exercised (${withQual})`);
  assert.ok(narrowed > 60, `filters narrowed the list in ${narrowed} cases`);
  assert.ok(nonEurope > 40, `North America was exercised (${nonEurope})`);
});

test('computeResult: an explicit continent argument still counts that continent, c wins over it, anyActive sees q.*', () => {
  const na = tree.regions.find((r) => r.continent === 'north-america');
  const eu = tree.regions.find((r) => r.continent === 'europe');
  assert.equal(computeResult(new URLSearchParams(''), 'north-america').total, tree.regions.filter((r) => r.continent === 'north-america').length);
  assert.equal(computeResult(new URLSearchParams(`pin=${na.id}`), 'europe').total, tree.regions.filter((r) => r.continent === 'europe').length, 'explicit argument beats the pin rule');
  assert.equal(computeResult(new URLSearchParams(`pin=${na.id}`)).total, tree.regions.filter((r) => r.continent === 'north-america').length, 'no argument: the pin rule');
  assert.equal(computeResult(new URLSearchParams(`pin=${eu.id}`)).total, tree.regions.filter((r) => r.continent === 'europe').length);
  assert.equal(computeResult(new URLSearchParams('c=north-america'), 'europe').total, tree.regions.filter((r) => r.continent === 'north-america').length, 'c wins');
  assert.equal(computeResult(new URLSearchParams('c=nowhere')).total, tree.regions.filter((r) => r.continent === 'europe').length, 'an invalid c is ignored');
  assert.equal(computeResult(new URLSearchParams('')).anyActive, false);
  assert.equal(computeResult(new URLSearchParams('q.foreign_ownership=yes')).anyActive, true);
  assert.equal(computeResult(new URLSearchParams('q.foreign_ownership=maybe')).anyActive, false);
  assert.equal(Object.keys(computeResult(new URLSearchParams(''))).length, 7, 'output shape is unchanged');
  // without definitions (the old two-argument call) q.* is not applied: the first release's behaviour
  const plain = computeResultRaw(new URLSearchParams('q.foreign_ownership=yes'));
  assert.equal(plain.anyActive, false);
  assert.equal(plain.matching.length, plain.total);
});

test('a shared link /?c=north-america&pin=<na> round-trips through the page parser and the edge parser alike', () => {
  const na = tree.regions.find((r) => r.continent === 'north-america').id;
  const q = `?c=north-america&pin=${na}`;
  const page = parseState(q, treeData);
  assert.equal(page.continent, 'north-america');
  assert.deepEqual(page.shortlist, [na]);
  const edge = computeResult(new URLSearchParams(q));
  assert.deepEqual(edge.pins, [na]);
  assert.ok(edge.matching.every((r) => r.continent === 'north-america'));
  assert.equal(edge.total, tree.regions.filter((r) => r.continent === 'north-america').length);
});
