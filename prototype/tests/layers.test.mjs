import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, REQUIRE_V2, fixture } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const clone = (x) => JSON.parse(JSON.stringify(x));

test('layer-sources.js: unique ids, https templates, maxzoom >= minzoom, seismic maxzoom 6, no dated population URL, active layers verified within 120 days with attribution (offline)', (t) => {
  if (D.loadErrors.some((m) => /layer-sources\.js/.test(m))) assert.fail(D.loadErrors.find((m) => /layer-sources\.js/.test(m)));
  if (!D.layerSources) { if (REQUIRE_V2) assert.fail('data/layer-sources.js missing'); return t.skip('data/layer-sources.js not present yet (EV-LAYERS) or LSF_WAVE_ISOLATION=1'); }
  assert.ok(Array.isArray(D.layerSources), 'layerSources must be an array');
  const ids = D.layerSources.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, 'duplicate layer id');
  const errs = []; for (const l of D.layerSources) errs.push(...S.validateLayerSource(l));
  assert.deepEqual(errs, []);
});

test('layer-sources.js: sourceIds resolve in the sources registry when both exist', (t) => {
  if (!D.layerSources || !D.sources) return t.skip('layer-sources.js or sources.js not present (EV-LAYERS / EV-SRC) or isolated');
  const bad = D.layerSources.filter((l) => l.sourceId && !D.sources[l.sourceId]).map((l) => `${l.id}: ${l.sourceId}`);
  assert.deepEqual(bad, []);
});

test('validator self-test: layer fixture passes; each invalid variant fails', () => {
  const ok = fixture('valid/layer-sources.json');
  for (const l of ok) assert.deepEqual(S.validateLayerSource(l, { today: '2026-10-05' }), [], l.id);
  const variants = {
    'http template': (l) => { l.url = 'http://tiles.example.org/{z}/{x}/{y}.png'; },
    'xyz without {z}': (l) => { l.url = 'https://tiles.example.org/tiles.png'; },
    'maxzoom < minzoom': (l) => { l.minzoom = 5; l.maxzoom = 2; },
    'seismic maxzoom 8': (l) => { l.id = 'seismic-hazard'; l.maxzoom = 8; },
    'dated population url': (l) => { l.id = 'gpw-population'; l.url = 'https://tiles.example.org/2026-10-04/{z}/{x}/{y}.png'; },
    'stale verification': (l) => { l.verified = '2026-01-01'; },
    'no attribution': (l) => { l.attribution = ''; },
    'bad kind': (l) => { l.kind = 'raster'; },
  };
  const retired = { ...clone(ok[0]), id: 'dead-end', status: 'retired', url: null, verified: '2026-01-01' };
  assert.deepEqual(S.validateLayerSource(retired, { today: '2026-10-05' }), [], 'a retired entry may carry url null and an old verification date');
  assert.ok(S.validateLayerSource({ ...retired, status: 'active', verified: '2026-10-04' }, { today: '2026-10-05' }).length > 0, 'a live tile layer needs a url');
  for (const [name, mut] of Object.entries(variants)) { const l = clone(ok[0]); mut(l); assert.ok(S.validateLayerSource(l, { today: '2026-10-05' }).length > 0, `${name} should fail`); }
});
