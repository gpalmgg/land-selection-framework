import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, walk, isUrl, REQUIRE_V2, deadLinkSet } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const dead = deadLinkSet();
const norm = (u) => u.replace(/\/$/, '');

test('every cell: source + valid sourceUrl + vintage + license resolvable (cell.license, sources registry or criterion.license)', () => {
  const errs = [];
  for (const r of D.regions) for (const c of D.criteria) {
    const v = D.values[r.id][c.id]; const w = `${r.id}.${c.id}`;
    if (v.value === null) continue; // a null cell asserts nothing; its nullReason is checked in regions.test
    if (!isUrl(v.sourceUrl)) errs.push(`${w}.sourceUrl`);
    if (!(v.source && v.source.length > 3)) errs.push(`${w}.source`);
    if (!(v.vintage && v.vintage.length > 3)) errs.push(`${w}.vintage`);
    const lic = v.license || (D.sources && D.sources[v.sourceId] && D.sources[v.sourceId].license) || c.license;
    if (!lic) errs.push(`${w} no license resolvable`);
    if (REQUIRE_V2 && !(D.sources && D.sources[v.sourceId])) errs.push(`${w}.sourceId must exist in data/sources.js`);
  }
  assert.deepEqual(errs, []);
});

test('no shipped source URL is on the dead-link list (recon/link-health.json) when that file is present', () => {
  const bad = [];
  const corpus = { regions: D.values, ls: D.landStanding, rd: D.regionDepth, crit: D.criteria, legal: D.legalPathway, recip: D.reciprocity, ctx: D.context, layerSources: D.layerSources, ...Object.fromEntries(Object.entries(D.layers).map(([k, v]) => [k, v])) };
  walk(corpus, (k, v, p) => { if (/url$/i.test(k) && typeof v === 'string' && dead.has(norm(v))) bad.push(`${p}: ${v}`); });
  assert.deepEqual(bad, [], 'dead URLs still shipped:\n' + bad.join('\n'));
});

test('known-wrong URLs from the audits never come back', () => {
  const banned = [/DetaliiDocument\/156631/, /ic\.org\/community-directory/, /terre-humaniste\.org/, /reservasdelabiosfera\.asturias\.es/, /nca2023\.globalchange\.gov/, /knoydart-foundation\.com/, /crofting\.scot(?!land)/, /\/501032023002\/consolide/];
  const hits = []; walk({ v: D.values, ls: D.landStanding, rd: D.regionDepth, l: D.layers, lp: D.legalPathway, rc: D.reciprocity }, (k, v, p) => { if (typeof v === 'string') for (const re of banned) if (re.test(v)) hits.push(`${p}: ${v}`); });
  assert.deepEqual(hits, []);
});

test('land standing: optional sources[] / territorySource are well formed; North America carries a territory source (REQUIRE_V2)', () => {
  const errs = [];
  for (const r of D.regions) {
    const e = D.landStanding[r.id]; if (!e) continue;
    errs.push(...S.validateLandStandingExtras(r.id, e));
    if (REQUIRE_V2 && r.continent === 'north-america' && !S.isHttps(e.territorySourceUrl)) errs.push(`${r.id}.territorySourceUrl (nation + treaty claims need their own source)`);
  }
  assert.deepEqual(errs, []);
});

test('region depth: optional caseLinks[] are well formed', () => {
  const errs = [];
  for (const [id, e] of Object.entries(D.regionDepth)) errs.push(...S.validateDepthExtras(id, e));
  assert.deepEqual(errs, []);
});

test('provenance of legal pathway steps: every source URL is https (when data/legal-pathway.js exists)', (t) => {
  if (!D.legalPathway) { if (REQUIRE_V2) assert.fail('data/legal-pathway.js missing'); return t.skip('data/legal-pathway.js not present yet (EV-INT-LEGAL)'); }
  const bad = []; walk(D.legalPathway, (k, v, p) => { if (/sourceUrl$/.test(k) && !S.isHttps(v)) bad.push(`${p}: ${v}`); });
  assert.deepEqual(bad, []);
});
