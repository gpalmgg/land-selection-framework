import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, REQUIRE_V2, walk, fixture } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const clone = (x) => JSON.parse(JSON.stringify(x));

// Every sourceId referenced anywhere in shipped data (cells, trajectories, criteria, layer registry, context, ...).
function usedIds() {
  const used = new Map();
  const note = (id, where) => { if (typeof id === 'string' && id) (used.get(id) || used.set(id, []).get(id)).push(where); };
  walk({ values: D.values, criteria: D.criteria, layerSources: D.layerSources, context: D.context }, (k, v, p) => { if (k === 'sourceId') note(v, p); });
  // Legal pathway, Land standing, region depth, reciprocity and cell trajectories name their sources as text, not as ids. A registry id counts
  // as used when one of those source strings resolves to it through sourceAliases (the table EV-SRC built from every distinct string).
  const idFor = D.sourcesMod && D.sourcesMod.sourceIdFor;
  if (idFor) {
    const textKeys = (k) => k === 'source' || k === 'label' || /Source$/.test(k) || k === 'sources';
    const text = (v, p) => { if (typeof v === 'string') { const id = idFor(v.trim()); if (id) note(id, p); } else if (Array.isArray(v)) v.forEach((x, i) => text(x, `${p}[${i}]`)); else if (v && typeof v === 'object' && typeof v.label === 'string') text(v.label, p); };
    walk({ values: D.values, legalPathway: D.legalPathway, landStanding: D.landStanding, regionDepth: D.regionDepth, reciprocity: D.reciprocity }, (k, v, p) => { if (textKeys(k)) text(v, p); });
  }
  return used;
}

test('sources registry: complete entries (name, url, license, licenseUrl|null, licenseStatus, checked, attribution); unconfirmed licences are explicit', (t) => {
  if (D.loadErrors.some((m) => /sources\.js/.test(m))) assert.fail(D.loadErrors.find((m) => /sources\.js/.test(m)));
  if (!D.sources) { if (REQUIRE_V2) assert.fail('data/sources.js missing'); return t.skip('data/sources.js not present yet (EV-SRC) or LSF_WAVE_ISOLATION=1'); }
  const errs = []; for (const [id, s] of Object.entries(D.sources)) errs.push(...S.validateSourceEntry(id, s));
  assert.deepEqual(errs, []);
});

test('sources registry: licenseOf(cell, criterion) is exported and resolves cell override, registry, then criterion', (t) => {
  if (!D.sourcesMod) return t.skip('data/sources.js not present yet (EV-SRC) or LSF_WAVE_ISOLATION=1');
  assert.equal(typeof D.sourcesMod.licenseOf, 'function', 'sources.js must export licenseOf(cell, criterion)');
  const crit = { license: 'criterion licence' };
  const reg = Object.keys(D.sources)[0];
  const lic = (x) => (typeof x === 'string' ? x : x && (x.license || x.text || x.name));
  assert.equal(lic(D.sourcesMod.licenseOf({ license: 'cell licence', sourceId: reg }, crit)), 'cell licence');
  assert.ok(lic(D.sourcesMod.licenseOf({ sourceId: reg }, crit)), 'registry licence resolves');
  assert.equal(lic(D.sourcesMod.licenseOf({ sourceId: 'no-such-id' }, crit)), 'criterion licence');
});

test('sources registry: every sourceId used by a cell, criterion, trajectory, context or layer exists; no orphans (orphans warn; fail under REQUIRE_V2)', (t) => {
  if (!D.sources) { if (REQUIRE_V2) assert.fail('data/sources.js missing'); return t.skip('data/sources.js not present yet (EV-SRC) or LSF_WAVE_ISOLATION=1'); }
  const used = usedIds();
  const missing = [...used.keys()].filter((id) => !D.sources[id]).map((id) => `${id} (used at ${used.get(id)[0]})`);
  assert.deepEqual(missing, [], 'sourceIds missing from data/sources.js');
  const orphans = Object.keys(D.sources).filter((id) => !used.has(id));
  if (REQUIRE_V2) assert.deepEqual(orphans, [], 'orphan registry entries (no cell, criterion or layer uses them)');
  else if (orphans.length) t.diagnostic(`WARN ${orphans.length} registry ids not used yet: ${orphans.slice(0, 8).join(', ')}${orphans.length > 8 ? ', ...' : ''}`);
});

test('validator self-test: sources fixture passes; each invalid variant fails', () => {
  const ok = fixture('valid/sources.json');
  for (const [id, s] of Object.entries(ok)) assert.deepEqual(S.validateSourceEntry(id, s), [], id);
  const variants = {
    'missing attribution': (s) => { delete s.attribution; },
    'bad status': (s) => { s.licenseStatus = 'probably'; },
    'bad checked date': (s) => { s.checked = 'yesterday'; },
    'unconfirmed without the explicit text': (s) => { s.licenseStatus = 'unconfirmed'; s.license = 'CC BY 4.0'; },
    'licenseUrl not a url': (s) => { s.licenseUrl = 'terms'; },
  };
  for (const [name, mut] of Object.entries(variants)) { const s = clone(ok['worldclim-cmip6']); mut(s); assert.ok(S.validateSourceEntry('fx', s).length > 0, `${name} should fail`); }
});
