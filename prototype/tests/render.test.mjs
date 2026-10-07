// node --test tests/render.test.mjs   (also: node tests/run.mjs --only render)
// lib/evidence-render.js: escaping, number format, null cell, provenance and licence precedence, trajectory chips,
// the ledger, the way in (snapshot), the context block, Latin-1 safe *Text functions, neutral wording.
// UPDATE_SNAPSHOT=1 rewrites tests/fixtures/legal-alentejo.html from the fixture entry below.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as R from '../lib/evidence-render.js';
import { LEGAL_NOT_ADVICE as SCHEMA_NOT_ADVICE, validateLegalEntry, validateTrajectory } from './schema.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = path.join(here, 'fixtures/legal-alentejo.html');
const MINUS = '−';
const LATIN1 = /^[\u0000-ÿ]*$/;
const BANNED = /score|rank|best|top/i;

// ---------------------------------------------------------------------------------------------------------------
// Fixtures (self-contained: no data file is read, so a data WP cannot change a result here)
const sources = {
  'worldclim-cmip6': { name: 'WorldClim 2.1 (CMIP6 downscaled)', license: 'WorldClim terms: free for academic and other non-commercial use', licenseUrl: 'https://www.worldclim.org/about.html', licenseStatus: 'confirmed' },
  'soilgrids-2': { name: 'ISRIC SoilGrids 2.0', license: 'licence not confirmed', licenseUrl: null, licenseStatus: 'unconfirmed' },
};
const climate = { id: 'climate', name: 'Climate', rangeLabel: '°C', license: 'WorldClim terms (criterion)', licenseUrl: 'https://example.org/criterion-licence' };
const solar = { id: 'solar_pv', name: 'Solar PV potential', rangeLabel: 'kWh/kWp', license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' };
const cell = () => ({
  value: 18.0, unit: '°C', vintage: '2041–2060, SSP2-4.5', label: 'Warm temperate, dry summers',
  source: 'WorldClim 2.1 CMIP6 ensemble (17 models)', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
  sourceId: 'worldclim-cmip6', method: 'footprint-zonal', footprint: 'alentejo', retrieved: '2026-10-04', scenario: 'SSP2-4.5',
  trajectory: { status: 'projected', direction: 'rising', delta: 2.1, unit: '°C', basis: '2041–2060 SSP2-4.5 ensemble mean minus WorldClim 1970–2000 over the same footprint cells', source: 'WorldClim 2.1 (historical + CMIP6)', sourceUrl: 'https://www.worldclim.org/data/worldclim21.html', sourceId: 'worldclim-hist', vintage: '2041–2060 vs 1970–2000' },
});
const forestCell = () => ({
  value: 9.3, unit: '% of 2000 cover lost', vintage: '2001–2023', label: 'Moderate loss', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://glad.earthengine.app/view/global-forest-change',
  method: 'footprint-zonal', retrieved: '2026-10-04',
  trajectory: { status: 'measured', direction: 'falling', basis: 'Annual loss fell across the window', source: 'Hansen GFC', sourceUrl: 'https://glad.earthengine.app/view/global-forest-change', vintage: '2001–2023' },
});
const nullCell = () => ({ value: null, nullReason: 'Count being re-verified. The anchor it cited lies outside the region.', source: 'OpenStreetMap contributors', sourceUrl: 'https://www.openstreetmap.org/copyright' });

// The Alentejo way-in fixture: the EV-TEST valid entry with one gate step (a step someone else must say yes to).
const alentejo = () => ({
  asOf: '2026-10-04',
  nonResidentOwnership: { status: 'open', summary: 'No nationality restriction on buying rural land; a tax number is needed.', source: 'Decreto-Lei 555/99 (consolidated)', sourceUrl: 'https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view' },
  residency: { link: 'separate_route', summary: 'Land purchase does not grant residency; separate visa routes exist and permit ownership.', source: 'Lei 56/2023 (Mais Habitação)', sourceUrl: 'https://dre.pt/dre/detalhe/lei/56-2023-224779655' },
  zoning: { route: 'case_by_case', summary: 'Building on rural land runs through the municipal chamber; protected zones can rule out residential construction on land that can still be bought.', source: 'Decreto-Lei 555/99 (consolidated)', sourceUrl: 'https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view' },
  collectiveForms: [
    { kind: 'cooperative', name: 'Cooperativa Agrícola', summary: 'Recognised agricultural co-operative form.', source: 'Decreto-Lei 335/99', sourceUrl: 'https://dre.pt/dre/detalhe/decreto-lei/335-1999-343862' },
    { kind: 'association', name: 'Associação', summary: 'Civil-code association (arts. 157 ff.).', source: 'Código Civil', sourceUrl: 'https://dre.pt/dre/legislacao-consolidada/decreto-lei/1966-34509075' },
  ],
  firstClaim: ['No statutory pre-emption holder identified for rural land in the sources opened.'],
  steps: [
    { n: 1, what: 'Check the parcel against the protected-zone maps before any offer.', who: 'Municipal chamber / regional planning office', source: 'Decreto-Lei 555/99 (consolidated)', sourceUrl: 'https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view' },
    { n: 2, what: 'Ask the chamber in writing whether a dwelling is permissible on the parcel.', who: 'Municipal chamber', gate: true, source: 'Decreto-Lei 555/99 (consolidated)', sourceUrl: 'https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view', duration: { text: 'residency processing 12-18 months as of 2024', source: 'AIMA', sourceUrl: 'https://aima.gov.pt/en' } },
  ],
  ruledOut: ['Buying land does not by itself carry water rights or a right to build.'],
  direction: 'tightening',
  directionNote: 'Residency-by-investment route for real estate removed in October 2023.',
  gaps: ['Whether scheme water allocations transfer with the parcel was not covered by a primary source.'],
  confidence: 'medium',
  verifiedOn: '2026-10-04',
});
const context = () => ({
  koppen: {
    source: { name: 'Beck et al. 2023', url: 'https://doi.org/10.1038/s41597-023-02549-6' }, footprint: 'cevennes',
    periods: {
      '1961–1990': { dominant: 'Cfb', shares: { Cfb: 0.5, Csa: 0.3, Csb: 0.2 } },
      '1991–2020': { dominant: 'Cfb', shares: { Cfb: 0.47, Csa: 0.28, Csb: 0.12, Cfa: 0.13 } },
      '2041–2070 SSP2-4.5': { dominant: 'Csa', shares: { Csa: 0.67, Cfb: 0.27, Csb: 0.06 } },
      '2071–2099 SSP2-4.5': { dominant: 'Csa', shares: { Csa: 0.8, Cfb: 0.2 } },
    },
    note: 'Shares are the fraction of the footprint area in each class at 1 km.',
  },
  water: {
    source: { name: 'WRI Aqueduct 4.0', url: 'https://www.wri.org/aqueduct' }, footprint: 'cevennes', basins: 8,
    baselineStress: { ratio: 0.016, class: 'Low (<10%)' }, stress2050Bau: { ratio: 0.06, class: 'Low (<10%)' },
    droughtRisk: 'Medium (0.4-0.6)', interannualVariability: 'Low-medium', seasonalVariability: 'Low-medium', groundwaterTrend: 'Insignificant Trend', riverineFloodRisk: 'Medium - High (2 in 1,000 to 6 in 1,000)',
    note: "WRI Aqueduct 4.0 indicators in WRI's own classes; this project does not combine or rescale them.",
  },
});
const pretty = (html) => `${html.replace(/></g, '>\n<')}\n`;
const noBannedOrColour = (html, what) => {
  assert.doesNotMatch(html, BANNED, `${what}: contains score|rank|best|top`);
  assert.doesNotMatch(html, /style=/i, `${what}: inline style`);
  assert.doesNotMatch(html, /class="[^"]*\bev-/, `${what}: ev-* class`);
  assert.doesNotMatch(html, /\bnull\b|undefined|NaN/, `${what}: leaked null/undefined/NaN`);
  assert.doesNotMatch(html, /[←-⇿≤≥]/, `${what}: arrow or inequality glyph`);
  assert.doesNotMatch(html, /class="[^"]*\b(?:good|bad|pass|fail|better|worse|green|red)\b/, `${what}: class implying better or worse`);
};

// ---------------------------------------------------------------------------------------------------------------
test('esc escapes the five HTML characters and tolerates null and numbers', () => {
  assert.equal(R.esc(`<a href="x" onclick='y'>&</a>`), '&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
  assert.equal(R.esc(null), '');
  assert.equal(R.esc(undefined), '');
  assert.equal(R.esc(0), '0');
  assert.equal(R.esc('Café – 100%'), 'Café – 100%');
});

test('every renderer escapes data: an injected <script> and a javascript: link never survive', () => {
  const c = cell(); c.label = '<script>alert(1)</script>'; c.source = '<img src=x onerror=1>'; c.sourceUrl = 'javascript:alert(1)'; c.vintage = '"><b>';
  const html = R.provenanceLine(c, climate, sources);
  assert.doesNotMatch(html, /<script|<img|<b>|javascript:/i);
  assert.match(html, /&lt;script&gt;/);
  const e = alentejo(); e.nonResidentOwnership.summary = '<script>x</script>'; e.steps[0].what = '<b onmouseover=1>'; e.collectiveForms[0].name = '"><svg onload=1>'; e.nonResidentOwnership.sourceUrl = 'javascript:1';
  const way = R.legalPathwayHtml(e, { mode: 'page' });
  assert.doesNotMatch(way, /<script|<svg onload|<b onmouseover|javascript:/i);
  const ctx = context(); ctx.koppen.periods['1991–2020'].dominant = '<i>'; ctx.water.droughtRisk = '<u>';
  assert.doesNotMatch(R.contextHtml(ctx, { mode: 'page' }), /<i>|<u>/);
});

test('fmtCell: integers grouped, at most two decimals without trailing zeros, true minus, never rounds 0.08 to 0.1', () => {
  const f = (value, extra = {}) => R.fmtCell({ value, unit: 'u', ...extra }, solar).text;
  assert.equal(f(1150), '1,150');
  assert.equal(f(1234567), '1,234,567');
  assert.equal(f(305), '305');
  assert.equal(f(0), '0');
  assert.equal(f(0.08), '0.08');
  assert.equal(f(0.85), '0.85');
  assert.equal(f(9.3), '9.3');
  assert.equal(f(18.4), '18.4');
  assert.equal(f(18.0), '18');
  assert.match(f(2.345), /^2\.3[45]$/);
  assert.equal(f(1234.5), '1,234.5');
  assert.equal(f(-8), `${MINUS}8`);
  assert.equal(f(-0.5), `${MINUS}0.5`);
  assert.equal(f(-1150), `${MINUS}1,150`);
  assert.doesNotMatch(f(-8), /-/);
  assert.equal(f(0.004), '0.004');                                       // a small non-zero value is never shown as 0
  assert.equal(R.fmtNumber(0.016, { maxDecimals: 3 }), '0.016');
  assert.equal(R.fmtNumber(NaN), '');
});

test('fmtCell: unit comes from the cell, then the criterion; a null value is "not verified" with the reason, never "null"', () => {
  assert.deepEqual(R.fmtCell({ value: 1150, unit: 'kWh/kWp' }, solar), { text: '1,150', unit: 'kWh/kWp', reason: '' });
  assert.equal(R.fmtCell({ value: 1150 }, solar).unit, 'kWh/kWp');
  const n = nullCell();
  assert.deepEqual(R.fmtCell(n, solar), { text: 'not verified', unit: '', reason: n.nullReason });
  for (const bad of [null, undefined, {}, { value: undefined }, { value: NaN }, { value: '12' }]) {
    const r = R.fmtCell(bad, solar);
    assert.equal(r.text, 'not verified');
    assert.equal(r.unit, '');
    assert.equal(typeof r.reason, 'string');
    assert.doesNotMatch(JSON.stringify(r), /null|NaN|undefined/);
  }
  assert.equal(R.fmtCell({ value: null }, solar).reason, '');
});

test('methodLabel uses plain words', () => {
  assert.equal(R.methodLabel('footprint-zonal'), 'footprint mean');
  assert.equal(R.methodLabel('point-3x3'), 'marker 3x3');
  assert.equal(R.methodLabel('official-statistic'), 'official statistic');
  assert.equal(R.methodLabel('named-count'), 'named count');
  assert.equal(R.methodLabel('hand-estimate'), 'editorial estimate');
  assert.equal(R.methodLabel('toString'), '');
  assert.equal(R.methodLabel(undefined), '');
});

test('licenseOf precedence: cell override, then the registry entry, then the criterion, else "licence not confirmed"', () => {
  const own = { ...cell(), license: 'CC BY-SA 4.0 (cell)', licenseUrl: 'https://example.org/cell-licence' };
  assert.equal(R.licenseOf(own, climate, sources), 'CC BY-SA 4.0 (cell)');
  assert.equal(R.licenseUrlOf(own, climate, sources), 'https://example.org/cell-licence');
  // the registry beats the criterion (a UKCP18 cell must not show WorldClim terms)
  assert.equal(R.licenseOf(cell(), climate, sources), sources['worldclim-cmip6'].license);
  assert.equal(R.licenseUrlOf(cell(), climate, sources), 'https://www.worldclim.org/about.html');
  // an unconfirmed registry licence says so; it does not fall through to the criterion's licence
  assert.equal(R.licenseOf({ sourceId: 'soilgrids-2' }, solar, sources), 'licence not confirmed');
  assert.equal(R.licenseUrlOf({ sourceId: 'soilgrids-2' }, solar, sources), '');
  // no sourceId: the criterion
  assert.equal(R.licenseOf({ value: 1 }, solar, sources), 'CC BY 4.0');
  assert.equal(R.licenseUrlOf({ value: 1 }, solar, sources), 'https://creativecommons.org/licenses/by/4.0/');
  // unknown sourceId, no criterion licence, no registry: never a guess
  assert.equal(R.licenseOf({ sourceId: 'nope' }, {}, sources), 'licence not confirmed');
  assert.equal(R.licenseOf({ value: 1 }, null, undefined), 'licence not confirmed');
  assert.equal(R.licenseOf(null, null, null), 'licence not confirmed');
});

test('provenanceLine: label, source link, vintage, licence link, retrieved date, method chip, in that order', () => {
  const html = R.provenanceLine(cell(), climate, sources);
  const order = ['<i>Warm temperate, dry summers</i>', 'class="traj"', '<a href="https://www.worldclim.org/data/cmip6/cmip6climate.html" rel="noopener">WorldClim 2.1 CMIP6 ensemble (17 models)</a>', '2041–2060, SSP2-4.5', '<a href="https://www.worldclim.org/about.html" rel="noopener">WorldClim terms: free for academic and other non-commercial use</a>', 'retrieved 4 October 2026', '<span class="meth">footprint mean</span>'];
  let at = -1;
  for (const piece of order) { const i = html.indexOf(piece); assert.ok(i > at, `"${piece}" missing or out of order in: ${html}`); at = i; }
  noBannedOrColour(html, 'provenanceLine');
  // the criterion's licence is NOT shown when the registry has one
  assert.doesNotMatch(html, /criterion/);
  // an unconfirmed licence prints as plain text with no link
  const u = { ...cell(), sourceId: 'soilgrids-2' };
  assert.match(R.provenanceLine(u, climate, sources), /· licence not confirmed ·/);
  // options switch parts off
  const bare = R.provenanceLine(cell(), climate, sources, { trajectory: false, retrieved: false, method: false, label: false });
  assert.doesNotMatch(bare, /traj|retrieved|meth|<i>/);
  // a null cell: the reason in italics, the source kept, no leader value
  const g = R.provenanceLine(nullCell(), solar, sources);
  assert.match(g, /<i>Count being re-verified\./);
  assert.match(g, /OpenStreetMap contributors/);
  assert.match(g, /the row keeps its place/);
});

test('trajectoryChip: neutral words, delta, vintage and status, inline-SVG icon, never a text arrow', () => {
  const chip = R.trajectoryChip(cell());
  assert.match(chip, /^<span class="traj" data-status="projected"/);
  assert.match(chip, /<svg class="dir-ico" viewBox="0 0 12 12" aria-hidden="true">/);
  assert.ok(chip.includes('rising +2.1 °C vs 1970–2000 (projected)'), chip);
  assert.doesNotMatch(chip, /[←-⇿]/);
  // a cell and a bare trajectory give the same chip
  assert.equal(R.trajectoryChip(cell().trajectory), chip);
  // without a delta: direction and vintage
  const f = R.trajectoryChip(forestCell());
  assert.ok(f.includes('falling, 2001–2023'), f);
  assert.doesNotMatch(f, /\(measured\)|\(projected\)/);
  assert.match(f, /data-status="measured"/);
  // a negative delta uses the true minus; a delta without 'vs' keeps its vintage after a comma
  const neg = cell(); neg.trajectory = { ...neg.trajectory, direction: 'falling', delta: -1.5, vintage: '2001–2023' };
  assert.ok(R.trajectoryChip(neg).includes(`falling ${MINUS}1.5 °C, 2001–2023 (projected)`), R.trajectoryChip(neg));
  // each direction has its own icon; steady and mixed too
  for (const d of ['rising', 'falling', 'steady', 'mixed']) {
    const c = cell(); c.trajectory = { ...c.trajectory, direction: d, delta: undefined };
    assert.match(R.trajectoryChip(c), new RegExp(`<svg class="dir-ico".*</svg>${d}`), d);
  }
  // not_available renders its basis sentence, never an empty chip
  const na = { status: 'not_available', direction: null, basis: 'No consistent annual series exists for this indicator in the footprint.' };
  const nhtml = R.trajectoryChip({ ...cell(), trajectory: na });
  assert.equal(nhtml, '<span class="traj-na">No consistent annual series exists for this indicator in the footprint.</span>');
  assert.doesNotMatch(nhtml, /class="traj"/);
  // nothing sourced, nothing printed
  assert.equal(R.trajectoryChip({ value: 1 }), '');
  assert.equal(R.trajectoryChip(null), '');
  assert.equal(R.trajectoryChip({ status: 'not_available', basis: '' }), '');
  // no direction word means no icon and the status word instead
  const nodir = R.trajectoryChip({ status: 'measured', direction: null, vintage: '2001–2023', basis: 'counted twice, same total' });
  assert.ok(nodir.includes('measured, 2001–2023'), nodir);
  assert.doesNotMatch(nodir, /<svg/);
  // the fixture's trajectory is itself valid under the schema (so the chip is tested on real shapes)
  assert.deepEqual(validateTrajectory(cell().trajectory, 't'), []);
  assert.deepEqual(validateTrajectory(forestCell().trajectory, 't'), []);
  for (const t of [chip, f, nhtml, nodir]) noBannedOrColour(t, 'trajectoryChip');
});

test('*Text functions are Latin-1 only: no U+2264, U+2265, U+2212, en dash, arrow or non-Latin glyph', () => {
  const awkward = cell();
  awkward.source = 'Bundesamt für Šumava ≤ 50 km – ≥ 10 → Ő țł …';
  awkward.vintage = '2041–2060, SSP2-4.5';
  awkward.trajectory = { ...awkward.trajectory, direction: 'falling', delta: -2.1, vintage: '2041–2060 vs 1970–2000' };
  const outs = [
    R.provenanceText(awkward, climate, sources), R.provenanceText(cell(), climate, sources), R.provenanceText(nullCell(), solar, sources), R.provenanceText(null, null, null),
    R.trajectoryText(awkward), R.trajectoryText(forestCell()), R.trajectoryText({ status: 'not_available', basis: 'Not measured – ≤ 5 years of data → none' }),
    R.fmtCellText({ value: -8, unit: '≤ °C' }, solar), R.fmtCellText(nullCell(), solar),
    R.latin1('≤ 5 and ≥ 7, − 3 — “quoted” ‘x’ Łódź ő œ'),
  ];
  for (const o of outs) { assert.match(o, LATIN1, `non-Latin-1 in "${o}"`); assert.doesNotMatch(o, /[≤≥−]/); }
  assert.equal(R.trajectoryText(cell()), 'rising +2.1 °C vs 1970-2000 (projected)');
  assert.equal(R.fmtCellText({ value: -8, unit: 'm' }, solar), '-8 m');
  assert.equal(R.fmtCellText({ value: 1150 }, solar), '1,150 kWh/kWp');
  assert.equal(R.fmtCellText(nullCell(), solar), 'not verified');
  assert.equal(R.latin1('≤ 5 and ≥ 7'), 'at most 5 and at least 7');
  assert.equal(R.provenanceText(cell(), climate, sources), 'WorldClim 2.1 CMIP6 ensemble (17 models) · 2041-2060, SSP2-4.5 · WorldClim terms: free for academic and other non-commercial use · retrieved 4 October 2026 · footprint mean');
  assert.match(R.provenanceText(nullCell(), solar, sources), /^not verified: Count being re-verified\./);
  for (const o of outs) assert.doesNotMatch(o, BANNED, `Text output contains a banned word: ${o}`);
});

test('ledger: ul.ledger > li > span.nm + span.vv + div.sb; a null cell is li.gap with "not yet verified" and its reason', () => {
  const html = R.ledgerHtml([climate, solar, { id: 'regen_network', name: 'Regenerative network density', rangeLabel: 'sites' }], { climate: cell(), solar_pv: nullCell() }, sources);
  assert.match(html, /^<ul class="ledger">/);
  assert.match(html, /<li><span class="nm">Climate<\/span><span class="vv">18<small>°C<\/small><\/span><div class="sb">/);
  assert.match(html, /<li class="gap"><span class="nm">Solar PV potential<\/span><span class="vv">not yet verified<\/span><div class="sb"><i>Count being re-verified\./);
  // a criterion with no cell at all is a gap row too, with a stated reason
  assert.match(html, /<li class="gap"><span class="nm">Regenerative network density<\/span><span class="vv">not yet verified<\/span><div class="sb"><i>No verified value is recorded\.<\/i>/);
  assert.equal((html.match(/<li/g) || []).length, 3);
  noBannedOrColour(html, 'ledger');
  // negative values use the true minus inside the vv
  assert.match(R.ledgerRowHtml(climate, { ...cell(), value: -8 }, sources), new RegExp(`<span class="vv">${MINUS}8<small>`));
});

test('legalPathwayHtml page mode matches the Alentejo snapshot (tests/fixtures/legal-alentejo.html)', () => {
  const entry = alentejo();
  assert.deepEqual(validateLegalEntry('alentejo', entry, { today: '2026-10-05' }), [], 'the fixture entry must itself be valid');
  const html = pretty(R.legalPathwayHtml(entry, { mode: 'page', idPrefix: 'way' }));
  if (process.env.UPDATE_SNAPSHOT === '1') writeFileSync(SNAPSHOT, html);
  assert.ok(existsSync(SNAPSHOT), 'snapshot missing: run with UPDATE_SNAPSHOT=1 once');
  assert.equal(html, readFileSync(SNAPSHOT, 'utf8'), 'way-in markup changed: review the diff, then UPDATE_SNAPSHOT=1');
});

test('legalPathwayHtml page mode: design classes, steps in order, gate, ruled out, honest gaps, foot', () => {
  const html = R.legalPathwayHtml(alentejo(), { mode: 'page' });
  for (const cls of ['class="way"', 'class="way-tag"', 'class="way-sum"', 'class="chips"', 'class="chip"', 'class="dir"', 'class="way-steps"', 'class="gate"', 'class="what"', 'class="meta"', 'class="way-out"', 'class="way-gaps"', 'class="way-foot"']) assert.ok(html.includes(cls), `missing ${cls}`);
  assert.ok(html.indexOf('Check the parcel') < html.indexOf('Ask the chamber'));
  assert.equal((html.match(/<li class="gate">/g) || []).length, 1);
  assert.match(html, /<li class="gate"><div class="what">Ask the chamber/);
  assert.match(html, /<b>Who decides:<\/b> Municipal chamber \/ regional planning office/);
  assert.match(html, /<b>Who must say yes:<\/b> Municipal chamber/);
  assert.match(html, /<b>Duration:<\/b> residency processing 12-18 months as of 2024/);          // only because a source states it
  assert.match(html, /<b>Honest gaps<\/b>.*None is shown\./);
  assert.match(html, /<b>What the law rules out<\/b>/);
  assert.ok(html.includes(R.LEGAL_NOT_ADVICE) && html.includes(SCHEMA_NOT_ADVICE));
  assert.match(html, /Verified 4 October 2026 · confidence in this entry: medium\./);
  assert.match(html, /<span class="dir">tightening · as of 2026<\/span>/);
  assert.match(html, /The way in · qualitative · not legal advice/);
  assert.match(html, /id="way-in"/);
  // every statement carries its source link
  for (const url of ['https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view', 'https://dre.pt/dre/detalhe/lei/56-2023-224779655', 'https://dre.pt/dre/detalhe/decreto-lei/335-1999-343862', 'https://aima.gov.pt/en']) assert.ok(html.includes(`href="${url}"`), url);
  noBannedOrColour(html, 'way in (page)');
  // a step with no sourced duration shows no duration
  const e = alentejo(); delete e.steps[1].duration;
  assert.doesNotMatch(R.legalPathwayHtml(e, { mode: 'page' }), /Duration/);
  // the "Gate:" prefix of a step also marks a gate
  const g = alentejo(); delete g.steps[1].gate; g.steps[0].what = 'Gate: the municipal chamber approves the use.';
  assert.match(R.legalPathwayHtml(g, { mode: 'page' }), /<li class="gate"><div class="what">Gate: the municipal chamber/);
  // no ruled-out items: no empty heading; empty gaps say so and print no "None is shown."
  const q = alentejo(); q.ruledOut = []; q.gaps = [];
  const qh = R.legalPathwayHtml(q, { mode: 'page' });
  assert.doesNotMatch(qh, /way-out/);
  assert.match(qh, /No gaps recorded\./);
  assert.doesNotMatch(qh, /None is shown/);
});

test('legalPathwayHtml drawer mode: three rows, the link to the region page, the not-advice foot; the full pathway stays on the page', () => {
  const html = R.legalPathwayHtml(alentejo(), { mode: 'drawer', regionId: 'alentejo' });
  assert.match(html, /^<section class="way compact"/);
  const dts = [...html.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1]);
  assert.deepEqual(dts, ['Who may hold', 'How a group can hold', 'Direction']);
  assert.ok(html.includes('The full pathway is on the region page'));
  assert.match(html, /<a class="way-more" href="region\/alentejo\.html#way-in">The full pathway is on the region page<\/a>/);
  assert.ok(html.includes(R.LEGAL_NOT_ADVICE));
  assert.match(html, /class="way-foot"/);
  for (const absent of ['way-steps', 'way-out', 'way-gaps', 'class="gate"']) assert.ok(!html.includes(absent), `${absent} must stay on the page`);
  assert.match(html, /<h4>What lawful entry involves<\/h4>/);
  assert.match(R.legalPathwayHtml(alentejo(), { mode: 'drawer', pageHref: '/region/alentejo.html#way-in' }), /href="\/region\/alentejo\.html#way-in"/);
  noBannedOrColour(html, 'way in (drawer)');
  // no collective forms: row two becomes First claim, still three rows; an empty first claim is stated, never omitted
  const e = alentejo(); e.collectiveForms = []; e.firstClaim = [];
  const eh = R.legalPathwayHtml(e, { mode: 'drawer' });
  assert.deepEqual([...eh.matchAll(/<dt>([^<]+)<\/dt>/g)].map((m) => m[1]), ['Who may hold', 'First claim', 'Direction']);
  assert.match(eh, /<em class="way-empty">No statutory pre-emption holder identified for rural sales\.<\/em>/);
  assert.match(R.legalPathwayHtml(e, { mode: 'page' }), /<dt>First claim<\/dt><dd><em class="way-empty">/);
});

test('way in: the direction chip is one neutral chip whatever the direction (never coloured by permissiveness)', () => {
  const chips = [];
  for (const d of ['stable', 'tightening', 'loosening', 'mixed', 'unknown']) {
    const e = alentejo(); e.direction = d;
    const m = /<span class="(dir[^"]*)">([^<]*)<\/span>/.exec(R.legalPathwayHtml(e, { mode: 'page' }));
    assert.ok(m, d); assert.equal(m[1], 'dir'); chips.push(m[2]);
  }
  assert.deepEqual(chips, ['stable · as of 2026', 'tightening · as of 2026', 'loosening · as of 2026', 'mixed · as of 2026', 'direction not established']);
  assert.equal(R.legalPathwayHtml(null), '');
  assert.equal(R.legalPathwayHtml(undefined, { mode: 'drawer' }), '');
});

test('contextHtml: page mode keeps WRI classes verbatim and flags projections; drawer mode is two lines', () => {
  const legend = [{ code: 'Cfb', name: 'Temperate, no dry season, warm summer' }, { code: 'Csa', name: 'Temperate, dry hot summer' }];
  const page = R.contextHtml(context(), { mode: 'page', legend });
  assert.match(page, /^<section class="ctx"/);
  assert.match(page, /<h4 id="ctx-t">Climate and water context<\/h4>/);
  assert.match(page, /<div class="ctx-row"><span class="ctx-k">1991–2020<\/span><span class="ctx-v">Cfb, Temperate, no dry season, warm summer<span class="ctx-shares">Share of the footprint: Cfb 47%, Csa 28%, Cfa 13%, Csb 12%<\/span>/);
  assert.match(page, /<div class="ctx-row proj"><span class="ctx-k">2041–2070 SSP2-4\.5 · projection<\/span>/);
  assert.ok(page.includes('Low (&lt;10%)'), 'the WRI class is printed as published');
  assert.ok(page.includes('Demand to supply ratio 0.016'));
  assert.ok(page.includes('Medium - High (2 in 1,000 to 6 in 1,000)'));
  assert.ok(page.includes('Insignificant Trend'));
  assert.ok(page.includes('<a href="https://doi.org/10.1038/s41597-023-02549-6" rel="noopener">Beck et al. 2023</a>'));
  assert.ok(page.includes('<a href="https://www.wri.org/aqueduct" rel="noopener">WRI Aqueduct 4.0</a>'));
  assert.ok(page.includes('this project does not combine or rescale them'));
  noBannedOrColour(page, 'context page');
  // licences print when the registry is passed
  const reg = { 'beck-koppen-2023': { license: 'CC BY 4.0', licenseUrl: 'https://creativecommons.org/licenses/by/4.0/' } };
  const withLic = R.contextHtml(context(), { mode: 'page', sources: reg });
  assert.ok(withLic.includes('<a href="https://creativecommons.org/licenses/by/4.0/" rel="noopener">CC BY 4.0</a>'));
  assert.ok(withLic.includes('licence not confirmed'), 'a source missing from the registry never gets an inferred licence');
  const drawer = R.contextHtml(context(), { mode: 'drawer' });
  assert.match(drawer, /^<div class="ctx compact">/);
  assert.equal((drawer.match(/class="ctx-row"/g) || []).length, 2);
  assert.ok(drawer.includes('Cfb now (1991–2020), Csa in 2041–2070 SSP2-4.5 (projection)'));
  assert.ok(drawer.includes('Low (&lt;10%) now, Low (&lt;10%) in 2050 business as usual (projection)'));
  noBannedOrColour(drawer, 'context drawer');
  // partial or empty context never prints an empty shell
  assert.equal(R.contextHtml(null), '');
  assert.equal(R.contextHtml({}), '');
  const waterOnly = R.contextHtml({ water: context().water }, { mode: 'drawer' });
  assert.equal((waterOnly.match(/ctx-row/g) || []).length, 1);
});

test('the module is pure ESM (no imports, no DOM, no globals, no fs) and its constant equals the schema constant', () => {
  const src = readFileSync(path.join(here, '../lib/evidence-render.js'), 'utf8').replace(/^\s*\/\/.*$/gm, '');
  assert.doesNotMatch(src, /^\s*import\s/m);
  assert.doesNotMatch(src, /\b(?:document|window|localStorage|sessionStorage|process|require|fetch|navigator|location)\b|node:/);
  assert.equal(R.LEGAL_NOT_ADVICE, SCHEMA_NOT_ADVICE);
  assert.doesNotMatch(src, /\bev-[a-z]/, 'no ev-* class names');
  assert.doesNotMatch(src, /style=/);
});

test('across every renderer and every fixture: no score, rank, best or top, no inline style, no ev-* class, no better/worse class', () => {
  const outs = [
    R.provenanceLine(cell(), climate, sources), R.provenanceLine(forestCell(), solar, sources), R.provenanceLine(nullCell(), solar, sources),
    R.ledgerHtml([climate, solar], { climate: cell(), solar_pv: nullCell() }, sources),
    R.trajectoryChip(cell()), R.trajectoryChip(forestCell()),
    R.legalPathwayHtml(alentejo(), { mode: 'page' }), R.legalPathwayHtml(alentejo(), { mode: 'drawer' }),
    R.contextHtml(context(), { mode: 'page' }), R.contextHtml(context(), { mode: 'drawer' }),
  ];
  outs.forEach((o, i) => noBannedOrColour(o, `output ${i}`));
  for (const d of ['rising', 'falling', 'steady', 'mixed']) assert.ok(R.DIRECTION_WORDS.includes(d));
  assert.deepEqual(R.DIRECTION_WORDS, ['rising', 'falling', 'steady', 'mixed']);
  for (const w of ['improving', 'worsening', 'better', 'worse']) for (const o of outs) assert.ok(!o.toLowerCase().includes(w), `${w} in output`);
});
