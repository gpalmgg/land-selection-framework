import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, readText, listDir, REQUIRE_V2, LAYERS, expectedIds, droppedIds, idsDiff, has } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const planned = expectedIds(); // PLANNED_IDS (tests/helpers.mjs) minus verify/dropped-regions.json (policy P-DROP): never a typed count
const sameIds = (actual, msg) => { const d = idsDiff(actual, planned); assert.equal(d, '', `${msg}: ${d} (expected the planned slate minus verify/dropped-regions.json)`); };
const byId = (rows) => Object.fromEntries(rows.map((r) => [r.region_id, r]));
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

test('regions.js carries exactly the planned slate (PLANNED_IDS minus dropped-regions.json)', () => {
  sameIds(D.regions.map((r) => r.id), 'regions.js ids');
});

test('every region has a land standing entry with all four qualitative fields and a tenure source', () => {
  sameIds(Object.keys(D.landStanding), 'landStanding keys');
  for (const id of planned) { const e = D.landStanding[id]; if (!e) continue; for (const f of ['territory', 'tenure', 'entry', 'obligation', 'source']) assert.ok(typeof e[f] === 'string' && e[f].trim().length > 20, `${id}.${f}`); assert.match(e.sourceUrl || '', /^https?:\/\//, `${id}.sourceUrl`); }
});

test('every region has a region-depth entry (asks 90-175 words, first sentence stands alone) with a source', () => {
  sameIds(Object.keys(D.regionDepth), 'regionDepth keys');
  const deeper = readText('deeper.html') || '';
  for (const id of planned) {
    const e = D.regionDepth[id]; if (!e) continue; const words = e.asks.trim().split(/\s+/).length;
    assert.ok(words >= 90 && words <= 175, `${id}.asks has ${words} words (target 100-168)`);
    assert.match(e.asks.split('. ')[0], /\bask(s)?\b/, `${id}: first sentence must read "X asks you to ..." (card teaser)`);
    assert.match(e.sourceUrl || '', /^https?:\/\//, `${id}.sourceUrl`);
    if (e.caseStudy) assert.ok(new RegExp(`id="${e.caseStudy.replace('#', '')}"`).test(deeper), `${id} caseStudy anchor missing in deeper.html`);
  }
});

test('six per-jurisdiction JSON layers + hospital proximity cover every region exactly once', () => {
  for (const l of LAYERS) { const recs = D.layers[l]; assert.ok(Array.isArray(recs), `${l}.json`); sameIds(recs.map((r) => r.region_id), `${l} region_ids`); assert.equal(new Set(recs.map((r) => r.region_id)).size, recs.length, `${l} duplicate region_id`); }
  sameIds(D.hospital.features.map((f) => f.properties.region_id), 'hospital-proximity');
  for (const f of D.hospital.features) { const r = D.regions.find((x) => x.id === f.properties.region_id); if (!r) continue; assert.deepEqual(f.geometry.coordinates.map((n) => +n.toFixed(3)), r.coords.map((n) => +n.toFixed(3)), `hospital point != coords for ${r.id}`); }
});

test('v1-lookup carries every region and agrees with data/processed/*.json on the four client fields (it is generated: never hand-edit)', () => {
  const errs = [];
  for (const [lk, layer, field] of S.CLIENT_LOOKUP_FIELDS) {
    const lut = D.v1Lookup[lk]; if (!lut) { errs.push(`v1Lookup.${lk} missing`); continue; }
    const d = idsDiff(Object.keys(lut), planned); if (d) errs.push(`v1Lookup.${lk}: ${d}`);
    const recs = byId(D.layers[layer] || []);
    for (const id of planned) if (lut[id] && recs[id] && get(lut[id], field) !== get(recs[id], field)) errs.push(`${id}: v1Lookup.${lk}.${field}=${get(lut[id], field)} != processed ${get(recs[id], field)} (regenerate with scripts/gen_v1_lookup.mjs)`);
  }
  assert.deepEqual(errs, []);
});

test('legal-ownership layer and legal pathway agree (no contradiction between the two legal views)', (t) => {
  if (!D.legalPathway) { if (REQUIRE_V2) assert.fail('data/legal-pathway.js missing'); return t.skip('data/legal-pathway.js not present yet (EV-INT-LEGAL)'); }
  sameIds(Object.keys(D.legalPathway), 'legalPathway keys');
  const lo = byId(D.layers['legal-ownership']);
  const errs = []; for (const id of planned) errs.push(...S.legalAgreement(id, lo[id], D.legalPathway[id]));
  assert.deepEqual(errs, []);
});

test('footprints registry covers every region (polygon files exist)', (t) => {
  if (!D.footprints) { if (REQUIRE_V2) assert.fail('data/footprints.json missing'); return t.skip('data/footprints.json not present (EV-FOOT) or isolated'); }
  sameIds(Object.keys(D.footprints), 'footprints keys');
  for (const id of planned) { const f = D.footprints[id]; if (!f) continue; assert.ok(['disc', 'bbox', 'polygon'].includes(f.kind), `${id}.kind`); assert.ok(f.description && f.basis, `${id} footprint description/basis`); if (f.kind === 'polygon') assert.ok(listDir('data/footprints').includes(`${id}.geojson`) || has(`data/${f.polygonFile}`), `${id} polygon file`); }
});

test('cells reference a footprint that exists in data/footprints.json', (t) => {
  if (!D.footprints) return t.skip('data/footprints.json not present (EV-FOOT) or isolated');
  const ok = new Set([...Object.keys(D.footprints), 'marker-3x3', 'disc-200km', 'disc-100km']); const bad = [];
  for (const r of D.regions) for (const c of D.criteria) { const v = D.values[r.id][c.id]; if (v.footprint && !ok.has(v.footprint)) bad.push(`${r.id}.${c.id}.footprint=${v.footprint}`); }
  assert.deepEqual(bad, []);
});

test('bioregions.js covers every region and its refPoint equals the region coords (skips when absent or isolated)', (t) => {
  if (!D.bioregions) return t.skip('data/bioregions.js not present (BIO-1) or LSF_WAVE_ISOLATION=1');
  sameIds(Object.keys(D.bioregions), 'bioregions keys');
  for (const r of D.regions) { const b = D.bioregions[r.id]; if (b) assert.deepEqual(b.refPoint, r.coords, `${r.id}.refPoint != regions.js coords (no region marker may move)`); }
});

test('reciprocity.js has one entry per region (skips when absent or isolated)', (t) => {
  if (!D.reciprocity) return t.skip('data/reciprocity.js not present (BIO-1/BIO-2) or LSF_WAVE_ISOLATION=1');
  sameIds(Object.keys(D.reciprocity), 'reciprocity keys');
});

test('region pages and sitemap exist for every region (CHECK_PAGES=1, run after the final regeneration)', { skip: process.env.CHECK_PAGES !== '1' ? 'set CHECK_PAGES=1 (gate only, after INT-FINAL)' : false }, () => {
  const sm = readText('sitemap.xml'); const pages = listDir('region');
  for (const id of planned) { assert.ok(pages.includes(`${id}.html`), `region/${id}.html`); assert.ok(sm.includes(`/region/${id}.html`), `sitemap ${id}`); }
  assert.equal(pages.filter((p) => p.endsWith('.html')).length, planned.length, 'orphan region page');
  assert.ok(Array.isArray(droppedIds()));
});
