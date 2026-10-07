// node --test lib/bio.test.mjs
// lib/bio.js: the shared render module for the place strip, the Land standing v2 block and the OG subline.
// The backward-compatibility snapshot uses FIXTURES (three Land standing entries copied from commit 6bce1a3, below),
// never the live land-standing.js, because the data waves rewrite that file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import * as bio from './bio.js';
import { bioregions as LIVE_BIO } from '../data/bioregions.js';
import { reciprocity as LIVE_REC } from '../data/reciprocity.js';
import { landStanding as LIVE_LS } from '../data/land-standing.js';
import { salutation } from './salutation.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const {
  whereItSits, waterLine, placeCaption, ecoSubline, landStandingV2Html, landStandingProvenance, placeStripHtml,
  firstConversationsGrouped, claimsFor, isVerified, KIND_ORDER,
} = bio;

// --- fixtures: three entries of data/land-standing.js at 6bce1a3, verbatim -----------------------------------------
const V1 = {
  alentejo: {
    territory: 'Alentejano montado agro-pastoral culture — large herdade estates and village baldio commons',
    tenure: 'Freehold under Portuguese land law; RAN-classified parcels transact freely but rarely permit residential construction',
    entry: 'Buy freehold, but verify RAN/REN protected-zone status before purchase and root into a sparse village rather than fencing off a herdade',
    obligation: "Hold the cork-oak montado's shared water and fire discipline with the neighbours who manage the landscape in common",
    source: 'Portuguese Land Law DL 555/99 (consolidated, 2024)',
    sourceUrl: 'https://dre.pt/web/guest/legislacao-consolidada/-/lc/34465475/view',
  },
  kootenays: {
    territory: 'Unceded Sinixt, Ktunaxa & Syilx territory',
    tenure: 'Fee-simple, much within the Agricultural Land Reserve (one principal residence as of right); Crown duty to consult applies',
    entry: 'Work with the Agricultural Land Commission and the water-licence system; expect a 6–18 month ALC process for multi-dwelling plans',
    obligation: 'Honour the Crown duty to consult on unceded territory and engage knowledgeable, skeptical neighbours who expect real engagement',
    source: 'ALR Use Regulation, BC Reg 30/2019',
    sourceUrl: 'https://www.bclaws.gov.bc.ca/civix/document/id/complete/statreg/30_2019',
  },
  oaxaca: {
    territory: 'Zapotec, Mixtec & Chatino comunal lands',
    tenure: 'Ejido/comunal under usos y costumbres; foreigners cannot directly buy, only via 6–18 month dominio-pleno conversion or a usufruct acta de posesión',
    entry: 'Negotiate entry with the comunal or ejido assembly, not a seller, with competent Mexican agrarian counsel — never a prestanombre front-owner',
    obligation: 'Make the legal and relational the same dimension: 418 of 570 municipalities can admit or exclude you, and the deepest knowledge here is Indigenous',
    source: 'Ley Agraria (1992, reformed), Artículos 76-82 and 98-107',
    sourceUrl: 'https://mexico.justia.com/federales/leyes/ley-agraria/titulo-tercero/capitulo-ii/seccion-sexta/',
  },
};

// The v1 renderers at 6bce1a3 as strings. Drawer: the el() output of blocks/land-standing.js as the DOM serialises it.
// Page: scripts/gen_region_pages.mjs landStandingBlock(), copied with its whitespace.
const esc = (s) => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
function v1DrawerString(s) {
  let h = '<div class="drawer-land-standing"><h4>Land standing</h4>';
  for (const [l, v] of [['Whose land', s.territory], ['Tenure', s.tenure], ['Arriving in good faith', s.entry], ['What it asks', s.obligation]]) {
    if (v) h += `<div class="ls-row"><span class="ls-label">${esc(l)}</span><span class="ls-val">${esc(v)}</span></div>`;
  }
  if (s.source) h += `<div class="ls-src">Source: ${s.sourceUrl ? `<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a>` : esc(s.source)}</div>`;
  return h + '</div>';
}
function v1PageString(s) {
  const row = (label, val) => (val ? `<div><dt>${esc(label)}</dt><dd>${esc(val)}</dd></div>` : '');
  const src = s.source
    ? `<p class="ls-src">Source: ${s.sourceUrl ? `<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a>` : esc(s.source)}</p>`
    : '';
  return `
      <section class="land-standing">
        <div class="wrap">
          <h2>Land standing</h2>
          <dl class="ls-dl">
            ${row('Whose land', s.territory)}
            ${row('Tenure', s.tenure)}
            ${row('Arriving in good faith', s.entry)}
            ${row('What it asks', s.obligation)}
          </dl>
          ${src}
        </div>
      </section>`;
}
// The additive elements are the only difference allowed in compatibility mode.
const stripAdditions = (h) => h
  .replace(/<p class="ls-provenance">[\s\S]*?<\/p>/, '')
  .replace(/<div class="ls-consent">[\s\S]*?<\/div>/, '')
  .replace(/<a class="ls-arrive"[\s\S]*?<\/a>/, '');

const NO_REVIEW_SENTENCE = 'No nation or community named here has reviewed this entry.';
const count = (hay, needle) => hay.split(needle).length - 1;
const FORBIDDEN_KEY = /^(score|rank|weight|rating|stars?|points?|total|composite)$/i;
function walkKeys(o, fn, p = '') {
  if (Array.isArray(o)) o.forEach((x, i) => walkKeys(x, fn, `${p}[${i}]`));
  else if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) { fn(k, `${p}.${k}`); walkKeys(v, fn, `${p}.${k}`); }
}

// A stub verified entry that carries every row of bioregioning 4.2.
const stubRec = (over = {}) => ({
  territoryShort: 'Alentejo montado villages',
  contested: { text: 'Two bodies state authority here and the sources do not settle it.', sources: [{ label: 'Source A', url: 'https://example.org/a' }, { label: 'Source B', url: 'https://example.org/b' }] },
  trajectory: { text: 'Parcels are coming back to the Nation.', kind: 'return', sources: [{ label: 'Nation history', url: 'https://example.org/t' }] },
  firstConversations: [
    { name: 'Zeta Network', kind: 'network', url: 'https://example.org/z', what: 'A network.', checked: '2026-10-05' },
    { name: 'Alpha Commons', kind: 'commons', url: 'https://example.org/c', what: 'A commons body.', checked: '2026-10-05' },
    { name: 'Host Nation', kind: 'host', url: 'https://example.org/h', what: 'The host nation.', checked: '2026-10-04' },
  ],
  notThere: { forms: ['Arriving as a lone buyer.', 'Buying around the villagers.'], basis: [{ label: 'Statute 1', url: 'https://example.org/law' }] },
  claims: [
    { field: 'tenure', claim: 'Tenure claim.', label: 'Tenure source', url: 'https://example.org/ten' },
    { field: 'entry', claim: 'Entry claim.', label: 'Entry source', url: 'https://example.org/ent' },
    { field: 'obligation', claim: 'Obligation claim.', label: 'Obligation source', url: 'https://example.org/obl' },
    { field: 'territory', claim: 'Territory claim.', label: 'Territory source', url: 'https://example.org/ter' },
    { claim: 'Whole-block claim.', label: 'Block source', url: 'https://example.org/blk' },
  ],
  reviewed: '2026-10-05',
  status: 'verified',
  ...over,
});
const stubData = (rec, ls = V1.alentejo) => ({ landStanding: { x: ls }, reciprocity: rec === null ? {} : { x: rec }, bioregions: {}, kindLabels: { host: 'Host nation or community', commons: 'Commons or shared-water body', network: 'Network or association' } });

// --- module shape ---------------------------------------------------------------------------------------------------
test('exports the render contract and imports only the three data modules (DOM-free, edge-safe)', () => {
  for (const k of ['whereItSits', 'waterLine', 'placeCaption', 'ecoSubline', 'landStandingV2Html', 'firstConversationsGrouped', 'claimsFor', 'isVerified', 'landStandingProvenance']) {
    assert.equal(typeof bio[k], 'function', k);
  }
  const src = readFileSync(path.join(here, 'bio.js'), 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ['../data/bioregions.js', '../data/land-standing.js', '../data/reciprocity.js']);
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /\b(document|window|navigator|localStorage|process\.|require\()/);
  walkKeys(bio, (k) => assert.ok(!FORBIDDEN_KEY.test(k), `export named ${k}`));
});

// --- place -----------------------------------------------------------------------------------------------------------
const B = (names, water = {}) => ({ place: 'A place', ecoregions: names.map((n, i) => ({ id: i, name: n, share: 0.5 })), watershed: { major: 'The Big River', drainsTo: 'the sea', straddlesDivide: false, ...water } });

test('whereItSits and waterLine follow copy.md 2.1', () => {
  const d = (b) => ({ data: { bioregions: { x: b } } });
  assert.equal(whereItSits('x', d(B(['Alpha forests']))), 'In the Alpha forests.');
  assert.equal(whereItSits('x', d(B(['Alpha forests', 'Beta scrub']))), 'In the Alpha forests, and partly the Beta scrub.');
  assert.equal(whereItSits('x', d(B(['A', 'B', 'C']))), 'Across the A, B and C.');
  assert.equal(whereItSits('x', d(B(['A', 'B', 'C', 'D']))), 'Across the A, B and C, and others.');
  assert.equal(whereItSits('x', d({ place: 'p', ecoregions: [] })), '');
  assert.equal(waterLine('x', d(B(['A']))), 'The Big River. Drains to the sea.');
  assert.equal(waterLine('x', d(B(['A'], { major: 'The Big River.', straddlesDivide: true }))), 'The Big River. Drains to the sea. The region straddles a drainage divide.');
  assert.equal(waterLine('x', d(B(['A'], { straddlesDivide: 'yes' }))), 'The Big River. Drains to the sea.', 'only a true boolean adds the divide sentence');
  assert.equal(waterLine('x', d({ place: 'p', ecoregions: [] })), '');
  assert.equal(whereItSits('nowhere'), '');
  assert.equal(waterLine('nowhere'), '');
  assert.match(placeCaption(), /^Ecoregions: RESOLVE Ecoregions 2017 \(CC BY 4\.0\), computed within 100 km of the region's reference point, not its footprint\./);
});

test('the place strip exists for every region from bioregions alone, and says "around", never "within"', () => {
  for (const id of Object.keys(LIVE_BIO)) {
    const h = placeStripHtml(id, { escape: esc });
    assert.match(h, /^<div class="place-strip">/, id);
    assert.ok(h.includes('Where it sits'), id);
    assert.ok(h.includes('Where the water goes'), id);
    assert.ok(h.includes(esc(LIVE_BIO[id].place)), id);
    assert.ok(h.includes('around the reference point, 100 km'), id);
    assert.doesNotMatch(h, /\bwithin the region\b/i);
  }
  assert.equal(placeStripHtml('nowhere'), '');
});

test('ecoSubline: ASCII, at most 44 characters, null (never truncated) otherwise', () => {
  const d = (n) => ({ data: { bioregions: { x: B([n]) } } });
  assert.equal(ecoSubline('x', d('New England-Acadian forests')), 'IN THE NEW ENGLAND-ACADIAN FORESTS');
  assert.equal(ecoSubline('x', d('A'.repeat(37))), `IN THE ${'A'.repeat(37)}`, '44 characters exactly is kept');
  assert.equal(ecoSubline('x', d('A'.repeat(38))), null, '45 characters is omitted');
  assert.equal(ecoSubline('x', d('Cévennes forests')), null, 'a non-ASCII name is omitted');
  assert.equal(ecoSubline('nowhere'), null);
  for (const id of ['alentejo', 'cevennes', 'driftless', 'teruel-uplands']) assert.equal(ecoSubline(id), null, `${id} is longer than 44`);
  let shown = 0;
  for (const id of Object.keys(LIVE_BIO)) {
    const s = ecoSubline(id);
    if (s === null) continue;
    shown++;
    assert.match(s, /^IN THE [\x20-\x7e]+$/, id);
    assert.ok(s.length <= 44, id);
    assert.doesNotMatch(s, /[≤≥]/);
  }
  assert.ok(shown > 0);
});

// --- first conversations ----------------------------------------------------------------------------------------------
test('first conversations: fixed kind order, alphabetical inside a kind, accents folded, never numbered or counted', () => {
  const rec = stubRec({
    firstConversations: [
      { name: 'Zed Protocol', kind: 'protocol', url: 'https://example.org/1', what: 'w', checked: '2026-10-05' },
      { name: 'Eigg Trust', kind: 'community', url: 'https://example.org/2', what: 'w', checked: '2026-10-05' },
      { name: 'Écosse Trust', kind: 'community', url: 'https://example.org/3', what: 'w', checked: '2026-10-05' },
      { name: 'Alpha', kind: 'community', url: 'https://example.org/4', what: 'w', checked: '2026-10-05' },
      { name: 'Xunta', kind: 'regulator', url: 'https://example.org/5', what: 'w', checked: '2026-10-05' },
      { name: 'AGADER', kind: 'access', url: 'https://example.org/6', what: 'w', checked: '2026-10-05' },
      { name: 'Net', kind: 'network', url: 'https://example.org/7', what: 'w', checked: '2026-10-05' },
      { name: 'Region body', kind: 'regional', url: 'https://example.org/8', what: 'w', checked: '2026-10-05' },
      { name: 'Language body', kind: 'language', url: 'https://example.org/9', what: 'w', checked: '2026-10-05' },
      { name: 'Heritage body', kind: 'heritage', url: 'https://example.org/10', what: 'w', checked: '2026-10-05' },
      { name: 'Commons body', kind: 'commons', url: 'https://example.org/11', what: 'w', checked: '2026-10-05' },
      { name: 'Host nation', kind: 'host', url: 'https://example.org/12', what: 'w', checked: '2026-10-05' },
    ],
  });
  const data = { reciprocity: { x: rec } };
  const g = firstConversationsGrouped('x', { data });
  assert.deepEqual(g.map((x) => x.kind), KIND_ORDER);
  assert.deepEqual(KIND_ORDER, ['host', 'commons', 'community', 'access', 'regulator', 'regional', 'language', 'heritage', 'network', 'protocol']);
  assert.deepEqual(g.find((x) => x.kind === 'community').items.map((i) => i.name), ['Alpha', 'Écosse Trust', 'Eigg Trust']);
  for (const grp of g) {
    assert.deepEqual(Object.keys(grp).sort(), ['items', 'kind', 'label'], 'a group carries no count');
    for (const it of grp.items) assert.deepEqual(Object.keys(it).sort(), ['checked', 'name', 'url', 'what']);
  }
  const html = landStandingV2Html('x', { escape: esc, data: { landStanding: { x: V1.alentejo }, reciprocity: { x: rec } } });
  assert.doesNotMatch(html, /<ol[\s>]/);
  assert.doesNotMatch(html, /<li>\s*\d/);
  assert.ok(html.indexOf('Host nation') < html.indexOf('Commons body') && html.indexOf('Commons body') < html.indexOf('Zed Protocol'));
});

test('first conversations drops an item without an https URL or a name, a flagged item, and every item of an unverified entry', () => {
  const items = [
    { name: 'Good', kind: 'host', url: 'https://example.org/g', what: 'w', checked: '2026-10-05' },
    { name: 'Plain http', kind: 'host', url: 'http://example.org/g', what: 'w', checked: '2026-10-05' },
    { name: 'Mail', kind: 'host', url: 'mailto:someone@example.org', what: 'w', checked: '2026-10-05' },
    { name: '', kind: 'host', url: 'https://example.org/n', what: 'w', checked: '2026-10-05' },
    { name: 'Flagged', kind: 'host', url: 'https://example.org/f', what: 'w', checked: '2026-10-05', flag: 'review' },
  ];
  const ok = firstConversationsGrouped('x', { data: { reciprocity: { x: stubRec({ firstConversations: items }) } } });
  assert.deepEqual(ok.flatMap((g) => g.items.map((i) => i.name)), ['Good']);
  assert.deepEqual(firstConversationsGrouped('x', { data: { reciprocity: { x: stubRec({ status: 'draft' }) } } }), []);
  assert.deepEqual(firstConversationsGrouped('nowhere'), []);
});

// --- claimsFor ---------------------------------------------------------------------------------------------------------
test('claimsFor merges landStanding sources then reciprocity claims, de-duplicates by url + claim, https only', () => {
  const ls = { ...V1.alentejo, sources: [
    { claim: 'Same claim', label: 'From land-standing', url: 'https://example.org/same' },
    { claim: 'Block claim', label: 'Block', url: 'https://example.org/block' },
    { claim: 'Http only', label: 'Insecure', url: 'http://example.org/insecure' },
  ] };
  const rec = stubRec({ claims: [
    { field: 'tenure', claim: 'Same claim', label: 'Dup', url: 'https://example.org/same' },
    { field: 'tenure', claim: 'Same claim', label: 'Dup 2', url: 'https://example.org/same' },
    { field: 'tenure', claim: 'Other claim', label: 'Other', url: 'https://example.org/same' },
    { field: 'entry', claim: 'Entry', label: 'E', url: 'https://example.org/e' },
    { field: 'entry', claim: 'Flagged', label: 'F', url: 'https://example.org/f', flag: 'review' },
  ] });
  const data = { landStanding: { x: ls }, reciprocity: { x: rec } };
  const all = claimsFor('x', null, { data });
  assert.deepEqual(all.map((c) => `${c.claim}|${c.url}`), [
    'Same claim|https://example.org/same', 'Block claim|https://example.org/block', 'Other claim|https://example.org/same', 'Entry|https://example.org/e',
  ]);
  assert.deepEqual(claimsFor('x', 'entry', { data }).map((c) => c.claim), ['Entry']);
  assert.deepEqual(claimsFor('x', 'tenure', { data }).map((c) => c.claim), ['Same claim', 'Other claim'], 'a duplicate keeps the first copy and takes the row it names');
  assert.deepEqual(claimsFor('x', 'obligation', { data }), [], 'a field with no claim lists none');
  assert.equal(claimsFor('x', null, { data }).find((c) => c.claim === 'Block claim').field, undefined, 'entries without a field belong to the block, not a row');
  // an unverified entry contributes no reciprocity claims
  const draft = { landStanding: { x: ls }, reciprocity: { x: { ...rec, status: 'draft' } } };
  assert.deepEqual(claimsFor('x', null, { data: draft }).map((c) => c.claim), ['Same claim', 'Block claim']);
  assert.deepEqual(claimsFor('nowhere'), []);
});

// --- backward compatibility (bioregioning 3.5; plan decision 3) --------------------------------------------------------
for (const [id, s] of Object.entries(V1)) {
  for (const [label, rec] of [['no reciprocity entry', null], ['a draft entry', stubRec({ status: 'draft' })], ['an entry-level human-review flag', stubRec({ flag: 'review' })]]) {
    test(`compat snapshot, ${id}, ${label}: identical to the v1 block except the additive elements`, () => {
      const data = { landStanding: { [id]: s }, reciprocity: rec === null ? {} : { [id]: rec }, bioregions: {} };
      const drawer = landStandingV2Html(id, { escape: esc, name: 'X', data });
      assert.equal(stripAdditions(drawer), v1DrawerString(s));
      const page = landStandingV2Html(id, { escape: esc, name: 'X', variant: 'page', data });
      assert.equal(stripAdditions(page), v1PageString(s));
      for (const h of [drawer, page]) {
        assert.equal(count(h, 'class="ls-provenance"'), 1);
        assert.equal(count(h, 'class="ls-consent"'), 1);
        assert.equal(count(h, 'class="ls-arrive"'), 1);
        for (const cls of ['braid', 'ls-territory', 'ls-contested', 'ls-trajectory', 'ls-notthere', 'ls-fc', 'ls-claims']) assert.ok(!h.includes(`class="${cls}`), `${cls} must not appear without a verified entry`);
        for (const cls of ['ls-row', 'ls-label', 'ls-val', 'ls-src']) if (h.includes('drawer-land-standing')) assert.ok(h.includes(cls), cls);
      }
    });
  }
}

test('compat: a missing source line and a missing field are handled as v1 did', () => {
  const s = { territory: 'T', tenure: '', entry: 'E', obligation: 'O' };
  const data = { landStanding: { x: s }, reciprocity: {} };
  assert.equal(stripAdditions(landStandingV2Html('x', { escape: esc, data })), v1DrawerString(s));
  assert.equal(stripAdditions(landStandingV2Html('x', { escape: esc, variant: 'page', data })), v1PageString(s));
  assert.equal(landStandingV2Html('nowhere', { escape: esc }), '');
});

// --- v2 with a stub verified entry ---------------------------------------------------------------------------------------
test('v2 block: every row of 4.2 renders in the stated order', () => {
  const h = landStandingV2Html('x', { escape: esc, name: 'Alentejo', data: stubData(stubRec()) });
  const marks = [
    'class="drawer-land-standing"', 'class="braid"', 'class="tag"', 'class="ls-territory"', 'class="ls-contested"', 'Whose standing is disputed',
    '>Tenure<', 'Tenure claim.', '>Arriving in good faith<', 'Entry claim.', '>What it asks<', 'Obligation claim.',
    'ls-row ls-trajectory', 'class="ls-notthere"', 'Where the answer is not here', 'Basis:', 'class="ls-fc"', 'First conversations',
    'class="ls-src"', 'class="ls-provenance"', 'class="ls-consent"', 'class="ls-arrive"',
  ];
  let at = -1;
  for (const m of marks) {
    const i = h.indexOf(m, at + 1);
    assert.ok(i > at, `${m} is missing or out of order (after index ${at})`);
    at = i;
  }
  // the lead replaces the live first row: no "Whose land" row, and the full territory sentence leads
  assert.doesNotMatch(h, /<span class="ls-label">Whose land<\/span>/);
  assert.ok(h.includes(`<p class="ls-territory">${esc(V1.alentejo.territory)}</p>`));
  assert.ok(h.indexOf('Territory claim.') < h.indexOf('class="ls-contested"'), 'the territory sources sit under the lead');
  assert.ok(h.includes('Further sources for this entry (1)'), 'block-level claims are listed once');
  assert.match(h, /<h4 class="tag">Land standing <span class="tag-qual">· qualitative, never scored<\/span><\/h4>/);
  assert.ok(h.includes('href="/arrive.html?region=x#region">How to arrive in Alentejo'));
  assert.ok(h.includes('consent of the people of this place') && h.includes('Left blank. The tool cannot sign it; only the people of this place can.'));
  assert.ok(h.includes('Public bodies and protocols to read first. Pointers, not introductions.'));
  assert.ok(h.includes('These are pointers to public bodies. None of them has agreed to be contacted, and none is a person. Read first; ask how they want to be approached; never assume.'));
  assert.ok(h.includes('checked 5 October 2026') && h.includes('checked 4 October 2026'));
  assert.ok(h.includes('<span class="sr-only"> (opens in a new tab)</span>'));
});

test('v2 block: trajectory labels by kind, text only', () => {
  const labels = { return: 'Land coming back', recognition: 'Recognition', revival: 'Renewal', pressure: 'Pressure on the people here' };
  for (const [kind, label] of Object.entries(labels)) {
    const rec = stubRec({ trajectory: { text: 'Sentence.', kind, sources: [] } });
    const h = landStandingV2Html('x', { escape: esc, data: stubData(rec) });
    assert.ok(h.includes(`<span class="ls-label">${label}</span><span class="ls-val">Sentence.</span>`), kind);
    assert.doesNotMatch(h, /ls-trajectory[^>]*>.*[↑↓▲▼]/);
  }
});

test('v2 block: contested, trajectory and notThere are absent when null; details are hidden when n = 0', () => {
  const h = landStandingV2Html('x', { escape: esc, data: stubData(stubRec({ contested: null, trajectory: null, notThere: null, firstConversations: [], claims: [] })) });
  for (const cls of ['ls-contested', 'ls-trajectory', 'ls-notthere', 'ls-fc', 'ls-claims']) assert.ok(!h.includes(cls), cls);
  assert.ok(h.includes('class="ls-territory"') && h.includes('class="ls-provenance"'));
});

test('v2 block: details are native, keyboard operable (details > summary), and every link carries rel="noopener"', () => {
  const h = landStandingV2Html('x', { escape: esc, data: stubData(stubRec()) });
  assert.ok(count(h, '<details class="ls-claims"><summary>Sources for this row (1)</summary>') >= 4);
  assert.equal(count(h, '<details'), count(h, '</details>'));
  assert.doesNotMatch(h, /<details[^>]*\sopen/);
  assert.doesNotMatch(h, /tabindex|onclick|role="button"/);
  const anchors = [...h.matchAll(/<a\b[^>]*>/g)].map((m) => m[0]);
  assert.ok(anchors.length > 8);
  for (const a of anchors) {
    if (a.includes('class="ls-arrive"')) continue; // internal link to /arrive.html
    assert.ok(a.includes('rel="noopener"'), a);
    assert.ok(a.includes('target="_blank"'), a);
    assert.match(a, /href="https:\/\//, a);
  }
});

test('v2 block: escaping, a <script> in any string never reaches the markup', () => {
  const X = '<script>alert(1)</script>';
  const ls = { territory: X + 'T', tenure: X + 'Te', entry: X + 'E', obligation: X + 'O', source: X + 'S', sourceUrl: 'https://example.org/s?a=1&b="2"' };
  const rec = stubRec({
    territoryShort: X,
    contested: { text: X, sources: [{ label: X, url: 'https://example.org/c?x=<b>' }] },
    trajectory: { text: X, kind: 'return', sources: [{ label: X, url: 'https://example.org/t' }] },
    firstConversations: [{ name: X, kind: 'host', url: 'https://example.org/h?q="x"', what: X, checked: X }],
    notThere: { forms: [X], basis: [{ label: X, url: 'https://example.org/b' }] },
    claims: [{ field: 'tenure', claim: X, label: X, url: 'https://example.org/c' }],
    reviewed: '2026-10-05',
  });
  for (const variant of ['drawer', 'page']) {
    const h = landStandingV2Html('x', { escape: esc, name: X, variant, data: stubData(rec, ls) });
    assert.doesNotMatch(h, /<script/i, variant);
    assert.ok(h.includes('&lt;script&gt;'), variant);
    assert.doesNotMatch(h, /href="[^"]*<[^"]*"/, variant);
  }
  // the default escaper (no opts.escape) does the same
  const h = landStandingV2Html('x', { name: X, data: stubData(rec, ls) });
  assert.doesNotMatch(h, /<script/i);
  const p = placeStripHtml('x', { data: { bioregions: { x: { place: X, ecoregions: [{ name: X }], watershed: { major: X, drainsTo: X } } } } });
  assert.doesNotMatch(p, /<script/i);
  assert.ok(p.includes('&lt;script&gt;'));
});

test('a record with a human-review flag withholds the flagged field, and only that field', () => {
  const full = landStandingV2Html('x', { escape: esc, data: stubData(stubRec()) });
  assert.ok(full.includes('ls-contested') && full.includes('ls-trajectory') && full.includes('ls-notthere'));
  const noC = landStandingV2Html('x', { escape: esc, data: stubData(stubRec({ contested: { ...stubRec().contested, flag: 'human review' } })) });
  assert.ok(!noC.includes('ls-contested') && noC.includes('ls-trajectory') && noC.includes('ls-notthere') && noC.includes('class="ls-fc"'));
  const noT = landStandingV2Html('x', { escape: esc, data: stubData(stubRec({ trajectory: { ...stubRec().trajectory, flag: 'x' } })) });
  assert.ok(!noT.includes('ls-trajectory') && noT.includes('ls-contested'));
  const noN = landStandingV2Html('x', { escape: esc, data: stubData(stubRec({ notThere: { ...stubRec().notThere, flag: 'x' } })) });
  assert.ok(!noN.includes('ls-notthere') && noN.includes('ls-contested'));
  // the base Land standing still ships
  for (const h of [noC, noT, noN]) assert.ok(h.includes('class="ls-territory"') && h.includes('>Tenure<'));
  assert.equal(isVerified('x', { data: { reciprocity: { x: stubRec() } } }), true);
  assert.equal(isVerified('x', { data: { reciprocity: { x: stubRec({ flag: 'r' }) } } }), false);
  assert.equal(isVerified('x', { data: { reciprocity: { x: stubRec({ status: 'draft' }) } } }), false);
  assert.equal(isVerified('nowhere'), false);
});

// --- the no-review line (review issue D11) --------------------------------------------------------------------------------
test('the no-review sentence appears exactly once in every rendering of the block, with and without a reviewed date', () => {
  assert.equal(landStandingProvenance('x', { data: { reciprocity: { x: stubRec() } } }),
    'Assembled from public sources and checked on 2026-10-05. No nation or community named here has reviewed this entry.');
  assert.equal(landStandingProvenance('x', { data: { reciprocity: { x: stubRec({ reviewed: undefined }) } } }),
    `Assembled from public sources. ${NO_REVIEW_SENTENCE}`);
  assert.equal(landStandingProvenance('x', { data: { reciprocity: { x: stubRec({ reviewed: 'yesterday' }) } } }),
    `Assembled from public sources. ${NO_REVIEW_SENTENCE}`);
  assert.equal(landStandingProvenance('nowhere'), `Assembled from public sources. ${NO_REVIEW_SENTENCE}`);
  for (const rec of [stubRec(), stubRec({ reviewed: undefined }), stubRec({ status: 'draft' }), null]) {
    for (const variant of ['drawer', 'page']) {
      const h = landStandingV2Html('x', { escape: esc, variant, data: stubData(rec) });
      assert.equal(count(h, NO_REVIEW_SENTENCE), 1, `${variant} ${rec && rec.status}`);
      assert.match(h, /<p class="ls-provenance">Assembled from public sources[^<]*No nation or community named here has reviewed this entry\.<\/p>/);
      assert.ok(h.indexOf('class="ls-src"') < h.indexOf('class="ls-provenance"') && h.indexOf('class="ls-provenance"') < h.indexOf('class="ls-consent"'), 'after .ls-src, before the consent line');
    }
  }
  // never on a card, in compare, in the OG text, in the place strip or in the salutation
  for (const id of Object.keys(LIVE_BIO)) {
    assert.ok(!placeStripHtml(id).includes('reviewed this entry'), id);
    assert.ok(!(ecoSubline(id) || '').includes('reviewed'), id);
    assert.ok(!JSON.stringify(salutation(id)).includes('reviewed this entry'), id);
  }
});

// --- the live data ---------------------------------------------------------------------------------------------------------
test('the live data: every region renders, the sentence once, no contested row where contested is null, no scoring keys', () => {
  const ids = Object.keys(LIVE_LS);
  assert.ok(ids.length > 0);
  for (const id of ids) {
    const h = landStandingV2Html(id, { escape: esc, name: id });
    assert.ok(h.startsWith('<div class="drawer-land-standing">'), id);
    assert.equal(count(h, NO_REVIEW_SENTENCE), 1, id);
    assert.equal(h.includes('ls-contested'), !!(LIVE_REC[id] && LIVE_REC[id].contested && isVerified(id)), id);
    assert.equal(count(h, 'class="ls-consent"'), 1, id);
    assert.doesNotMatch(h, /class="[^"]*\b(score|rank|rating|stars?)\b/, id);
    const page = landStandingV2Html(id, { escape: esc, name: id, variant: 'page' });
    assert.ok(page.includes('<section class="land-standing">'), id);
    if (isVerified(id)) assert.ok(page.includes('<h2 class="tag">Land standing'), id);
    assert.equal(count(page, NO_REVIEW_SENTENCE), 1, id);
  }
  walkKeys(LIVE_REC, (k, p) => assert.ok(!FORBIDDEN_KEY.test(k), p));
  walkKeys(LIVE_BIO, (k, p) => assert.ok(!FORBIDDEN_KEY.test(k), p));
});

test('the live data: first conversations are organisations with https links, grouped in the fixed order, no addresses or handles', () => {
  for (const id of Object.keys(LIVE_REC)) {
    const g = firstConversationsGrouped(id);
    const order = g.map((x) => KIND_ORDER.indexOf(x.kind));
    assert.ok(order.every((n) => n >= 0), `${id}: only known kinds`);
    assert.deepEqual(order, [...order].sort((a, b) => a - b), id);
    for (const grp of g) {
      const names = grp.items.map((i) => i.name);
      assert.deepEqual(names, [...names].sort((a, b) => a.localeCompare(b, 'en', { sensitivity: 'base' })), `${id} ${grp.kind}`);
      for (const it of grp.items) {
        assert.match(it.url, /^https:\/\//);
        assert.doesNotMatch(`${it.name} ${it.what}`, /@[a-z0-9.-]+\.[a-z]{2,}|\+?\d[\d ()-]{8,}\d/i, `${id}: ${it.name}`);
      }
    }
  }
});

test('heading levels: a region page passes tagLevel 2 and the sub-headings follow', () => {
  const h = landStandingV2Html('x', { escape: esc, variant: 'page', data: stubData(stubRec()) });
  assert.ok(h.includes('<h2 class="tag">Land standing'));
  assert.ok(h.includes('<h3 class="ls-sub">First conversations</h3>'));
  assert.ok(h.includes('<h4>Host nation or community</h4>'));
  const d = landStandingV2Html('x', { escape: esc, data: stubData(stubRec()) });
  assert.ok(d.includes('<h4 class="tag">Land standing'));
  assert.ok(d.includes('<h5 class="ls-sub">First conversations</h5>'));
  assert.ok(d.includes('<h6>Host nation or community</h6>'));
});
