// data/site-facts.js (MC-FACTS): counts, count words, dates and canonical sentences come from the data, never typed.
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { regions, criteria } from '../../data/regions.js';
import { layerSources, panelLayerSources } from '../../data/layer-sources.js';
import { buildId, buildDate, dataRevision, site, countWord, CapWord, longDate, facts, canon, factValues } from '../../data/site-facts.js';

const SRC = readFileSync(new URL('../../data/site-facts.js', import.meta.url), 'utf8');
const CODE = SRC.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\s\/\/ .*$/gm, '');
const CANON_MD = new URL('../../../upgrade-2026-10/tracks/docs/canon-copy.md', import.meta.url);

test('counts are derived from the data files', () => {
  assert.equal(facts.regions, regions.length);
  assert.equal(facts.criteria, criteria.length);
  const by = {};
  for (const r of regions) by[r.continent] = (by[r.continent] || 0) + 1;
  assert.deepEqual(facts.regionsByContinent, by);
  assert.equal(Object.values(facts.regionsByContinent).reduce((a, b) => a + b, 0), facts.regions);
  assert.equal(facts.regionsEurope, by.europe || 0);
  assert.equal(facts.regionsNA, by['north-america'] || 0);
  assert.ok(facts.regions > 0 && facts.criteria > 0 && facts.layers > 0 && facts.themes > 0);
});

test('layers = registry entries that are panel toggles (not retired, not basemaps, not context); themes = their distinct groups', () => {
  const counted = layerSources.filter((l) => l.panel === true && l.status !== 'retired' && l.role !== 'basemap' && l.role !== 'context');
  assert.equal(facts.layers, counted.length);
  assert.equal(facts.themes, new Set(counted.map((l) => l.group)).size);
  assert.equal(facts.layers, panelLayerSources().filter((l) => l.role !== 'context').length);
  assert.ok(facts.themes <= facts.layers);
  assert.ok(!layerSources.some((l) => l.role === 'context' && counted.includes(l)));
});

test('a non-context layer declared by a map extension must be in the registry, or the layer count drifts', async (t) => {
  let ext;
  try { ext = (await import('../../src/map/extensions.js')).extensions; } catch (e) { t.skip(`src/map/extensions.js not importable under plain Node: ${e.message}`); return; }
  const ids = new Set(panelLayerSources().flatMap((l) => [l.id, ...(l.aliases || [])]));
  for (const x of ext) for (const l of x.layers || []) {
    if (l.role === 'context') continue;
    assert.ok(ids.has(l.id), `extension "${x.id}" declares the non-context layer "${l.id}", which is not a panel entry in data/layer-sources.js`);
  }
});

test('countWord: one to ninety-nine in words, anything else as digits', () => {
  const known = { 0: 'zero', 1: 'one', 8: 'eight', 11: 'eleven', 13: 'thirteen', 17: 'seventeen', 19: 'nineteen', 20: 'twenty', 21: 'twenty-one',
    30: 'thirty', 40: 'forty', 45: 'forty-five', 50: 'fifty', 60: 'sixty', 70: 'seventy', 80: 'eighty', 90: 'ninety', 99: 'ninety-nine' };
  for (const [n, w] of Object.entries(known)) assert.equal(countWord(Number(n)), w, n);
  const seen = new Set();
  for (let n = 0; n <= 99; n++) { const w = countWord(n); assert.match(w, /^[a-z]+(-[a-z]+)?$/, String(n)); assert.ok(!seen.has(w), `duplicate word ${w}`); seen.add(w); }
  for (const bad of [100, -1, 1.5, NaN, '7', null, undefined]) assert.equal(countWord(bad), String(bad));
  assert.equal(CapWord(30), 'Thirty');
  assert.equal(CapWord(21), 'Twenty-one');
  assert.equal(CapWord(8), 'Eight');
  assert.equal(CapWord(100), '100');
});

test('the two stamped values have the shape `stamp_build.mjs --bump` rewrites, and nothing else is typed as a build constant', () => {
  assert.match(buildId, /^b\d{14}$/);
  assert.match(buildDate, /^\d{4}-\d{2}-\d{2}$/);
  assert.match(SRC, /^export const buildId = '[^']*';$/m);
  assert.match(SRC, /^export const buildDate = '[^']*';$/m);
  assert.equal(buildDate.replace(/-/g, ''), buildId.slice(1, 9), 'buildId starts with the build date');
});

test('dataRevision is the constant month 2026-10 (not the build date) and the marker value follows it', () => {
  assert.deepEqual(dataRevision, { month: '2026-10' });
  assert.deepEqual(facts.dataRevision, { month: '2026-10' });
  assert.equal(factValues().dataRevision, '2026-10');
  assert.equal(factValues({ buildDate: '2031-03-04', buildId: 'bX' }).dataRevision, '2026-10', 'a later rebuild cannot rewrite history');
  assert.equal(factValues().dataRevisionLong, 'October 2026');
  assert.ok(factValues().revision.includes('October 2026'));
  assert.ok(!factValues().revision.includes('{{'));
});

test('factValues: every documented fact key, computed from the counts and the build date', () => {
  const v = factValues();
  const keys = ['regions', 'regionsWord', 'RegionsWord', 'regionsEurope', 'regionsEuropeWord', 'RegionsEuropeWord', 'regionsNA', 'regionsNAWord',
    'RegionsNAWord', 'criteria', 'criteriaWord', 'CriteriaWord', 'layers', 'layersWord', 'LayersWord', 'themes', 'themesWord', 'ThemesWord',
    'buildId', 'buildDate', 'buildDateLong', 'year', 'dataRevision', 'dataRevisionLong', 'revision'];
  for (const k of keys) assert.equal(typeof v[k], 'string', k);
  assert.equal(v.regions, String(regions.length));
  assert.equal(v.regionsWord, countWord(regions.length));
  assert.equal(v.RegionsWord, CapWord(regions.length));
  assert.equal(v.criteriaWord, countWord(criteria.length));
  assert.equal(v.layersWord, countWord(facts.layers));
  assert.equal(v.themesWord, countWord(facts.themes));
  assert.equal(v.buildId, buildId);
  assert.equal(v.buildDate, buildDate);
  assert.equal(v.year, buildDate.slice(0, 4));
  assert.equal(v.buildDateLong, longDate(buildDate));
  const o = factValues({ buildId: 'bTEST', buildDate: '2027-01-02' });
  assert.deepEqual([o.buildId, o.buildDate, o.year, o.buildDateLong], ['bTEST', '2027-01-02', '2027', '2 January 2027']);
});

test('longDate: no locale, no clock', () => {
  assert.equal(longDate('2026-10-05'), '5 October 2026');
  assert.equal(longDate('2026-10'), 'October 2026');
  assert.equal(longDate('2026-12-31'), '31 December 2026');
  assert.equal(longDate('2026-01-01'), '1 January 2026');
  assert.equal(longDate('soon'), 'soon');
  assert.equal(longDate('2026-13-01'), '2026-13-01');
});

test('no region id, region name or count is hand-listed in the source', () => {
  for (const r of regions) assert.ok(!CODE.includes(`'${r.id}'`) && !CODE.includes(`"${r.id}"`), `region id ${r.id} appears in site-facts.js`);
  assert.ok(!/\bregions\s*[:=]\s*\d/.test(CODE), 'no typed region count');
});

test('edge-safe and DOM-free: only data imports, no host globals', () => {
  assert.ok(!/\b(window|document|localStorage|sessionStorage|navigator|process|require|Buffer|fetch)\b/.test(CODE));
  assert.ok(!/\bDate\b/.test(CODE), 'no clock');
  const imports = [...CODE.matchAll(/^import\s[^;]*from\s*'([^']+)'/gm)].map((m) => m[1]).sort();
  assert.deepEqual(imports, ['./layer-sources.js', './regions.js']);
  assert.doesNotThrow(() => JSON.stringify(facts));
  assert.equal(site.origin, 'https://land-selection-framework.regencommunity.tools');
});

// ---- canon ----------------------------------------------------------------------------------------------------------------
const camel = (h) => h.toLowerCase().replace(/_([a-z])/g, (_m, c) => c.toUpperCase());

function parseCanon(md) {
  const out = {};
  const lines = md.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = /^## ([A-Z][A-Z_]*)\s*$/.exec(lines[i]);
    if (!m) continue;
    for (let j = i + 1; j < lines.length && !lines[j].startsWith('## '); j++) {
      if (lines[j].startsWith('> ')) { out[camel(m[1])] = lines[j].slice(2).trim(); break; }
    }
  }
  return out;
}

test('canon strings equal upgrade-2026-10/tracks/docs/canon-copy.md whenever that file exists', (t) => {
  if (!existsSync(CANON_MD)) { t.skip('canon-copy.md not present'); return; }
  const md = parseCanon(readFileSync(CANON_MD, 'utf8'));
  for (const [k, v] of Object.entries(canon)) {
    assert.ok(k in md, `canon.${k} has no heading in canon-copy.md`);
    assert.equal(v, md[k], `canon.${k} differs from canon-copy.md`);
  }
  for (const k of ['descriptor', 'stance', 'refusal', 'authorship', 'status', 'privacy', 'contact', 'revision', 'landStandingProvenance']) assert.ok(k in canon, `canon.${k} missing`);
});

test('canon discipline: no contact details, no scores, no glyphs the OG font lacks', () => {
  for (const [k, v] of Object.entries(canon)) {
    assert.ok(typeof v === 'string' && v.length > 20, k);
    assert.ok(!/[\w.+-]+@[\w-]+\.[\w.]+/.test(v), `${k}: email`);
    assert.ok(!/mailto:|substack|instagram/i.test(v), `${k}: handle`);
    assert.ok(!/[\u2264\u2265]/.test(v), `${k}: U+2264/U+2265`);
  }
  assert.match(canon.authorship, /originated by Askja/);
  assert.ok(!/founded|originated by Gustaf/i.test(canon.authorship));
  assert.match(canon.stance, /never scores, ranks/);
});
