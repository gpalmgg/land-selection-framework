import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, walk, makeAllowed, underscoreKeys, GATE } from './helpers.mjs';
import { FORBIDDEN_KEYS, BANNED_COPY, PII } from './schema.mjs';

const D = await loadAll();
const allowed = makeAllowed(); // tests/allowlist.json: [{ path:'regex', pattern:'regex', reason:'why' }], each reviewed
const layerCorpus = Object.fromEntries(Object.entries(D.layers).map(([k, v]) => [`layer:${k}`, v]));
// Draft reciprocity entries are checked for forbidden KEYS always, but for copy/PII only when verified (or in gate mode):
// the wave-0 draft module is not shipped by itself and BIO-2 replaces it.
const recip = D.reciprocity ? Object.fromEntries(Object.entries(D.reciprocity).filter(([, e]) => GATE || (e && e.status === 'verified'))) : null;
const corpus = { regions: D.regions, values: D.values, criteria: D.criteria, landStanding: D.landStanding, regionDepth: D.regionDepth, v1Lookup: D.v1Lookup, legalPathway: D.legalPathway, context: D.context, bioregions: D.bioregions, reciprocity: recip, ...layerCorpus };
const keyCorpus = { ...corpus, reciprocity: D.reciprocity };

test('NO scoring / weight / rank fields anywhere in shipped data', () => {
  const hits = []; walk(keyCorpus, (k, _v, p) => { if (FORBIDDEN_KEYS.test(k)) hits.push(`forbidden key "${k}" at ${p}: the framework filters, it never scores`); });
  assert.deepEqual(hits, []);
});

test('criteria carry no weighting or aggregation hooks', () => {
  for (const c of D.criteria) for (const k of Object.keys(c)) assert.ok(!/weight|score|rank|aggregate|combine|sum/i.test(k), `criteria.${c.id}.${k}`);
});

test('land standing, legal pathway and qualitative layers contain no numeric score-like fields', () => {
  const numericKeys = [];
  for (const root of ['landStanding', 'legalPathway']) walk(corpus[root] || {}, (k, v, p) => { if (typeof v === 'number' && !/year|asOf|n$|step$|retrieved/i.test(k)) numericKeys.push(p); });
  assert.deepEqual(numericKeys, [], 'land standing / legal pathway are qualitative only: numbers found at ' + numericKeys.slice(0, 5).join(', '));
});

test('banned framing and superlative words absent from copy fields', () => {
  const hits = [];
  walk(corpus, (k, v, p) => {
    if (typeof v !== 'string' || /(^|\.)(source|sourceUrl|source_url|url|id|region_id|accent)$/.test(p)) return;
    for (const re of BANNED_COPY) if (re.test(v) && !allowed(p, v)) hits.push(`${p}: /${re.source}/ in "${v.slice(0, 90)}"`);
  });
  assert.deepEqual(hits, [], 'framing/superlative hits:\n' + hits.join('\n'));
});

test('no personal contact details in any data string', () => {
  const hits = [];
  walk(corpus, (k, v, p) => { if (typeof v === 'string') for (const re of PII) if (re.test(v) && !/^https?:\/\//.test(v) && !allowed(p, v)) hits.push(`${p}: ${v.slice(0, 70)}`); });
  assert.deepEqual(hits, []);
});

test('no keys starting with _ in shipped data (regions, land standing, region depth, legal pathway, context, processed JSON)', () => {
  const hits = [];
  for (const [name, o] of Object.entries({ regions: D.regions, values: D.values, criteria: D.criteria, landStanding: D.landStanding, regionDepth: D.regionDepth, legalPathway: D.legalPathway, context: D.context, ...layerCorpus, hospital: D.hospital })) if (o) hits.push(...underscoreKeys(o, name));
  assert.deepEqual(hits, [], 'underscore-prefixed keys are scratch fields and never ship:\n' + hits.slice(0, 20).join('\n'));
});

test('bioregions.js: no scoring keys, no personal data, no banned framing (skips when absent or isolated)', (t) => {
  if (!D.bioregions) return t.skip('data/bioregions.js not present (BIO-1) or LSF_WAVE_ISOLATION=1');
  const hits = [];
  walk(D.bioregions, (k, v, p) => {
    if (FORBIDDEN_KEYS.test(k)) hits.push(`forbidden key "${k}" at ${p}`);
    if (typeof v === 'string' && !/^https?:\/\//.test(v)) { for (const re of PII) if (re.test(v)) hits.push(`${p}: personal data ${v.slice(0, 60)}`); for (const re of BANNED_COPY) if (re.test(v) && !allowed(p, v)) hits.push(`${p}: /${re.source}/`); }
  });
  assert.deepEqual(hits, []);
});

test('reciprocity.js: no scoring keys, no personal data; every entry is qualitative (skips when absent or isolated)', (t) => {
  if (!D.reciprocity) return t.skip('data/reciprocity.js not present (BIO-1/BIO-2) or LSF_WAVE_ISOLATION=1');
  const hits = [];
  walk(D.reciprocity, (k, v, p) => {
    if (FORBIDDEN_KEYS.test(k)) hits.push(`forbidden key "${k}" at ${p}`);
    if (typeof v === 'number' && !/checked|reviewed|year/i.test(k)) hits.push(`numeric field at ${p}: reciprocity is qualitative only`);
  });
  walk(recip || {}, (k, v, p) => { if (typeof v === 'string' && !/^https?:\/\//.test(v)) for (const re of PII) if (re.test(v)) hits.push(`${p}: personal data ${v.slice(0, 60)}`); });
  assert.deepEqual(hits, []);
});

test('validator self-test: forbidden keys and banned copy are detected', () => {
  for (const k of ['score', 'weight', 'rank', 'rating', 'composite', 'best', 'top', 'grade']) assert.ok(FORBIDDEN_KEYS.test(k), k);
  for (const k of ['source', 'sources', 'status', 'territory', 'step']) assert.ok(!FORBIDDEN_KEYS.test(k), k);
  for (const s of ['a candidate area', 'the densest cluster', 'best land', 'site shopping', 'the apocalypse']) assert.ok(BANNED_COPY.some((re) => re.test(s)), s);
});
