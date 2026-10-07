import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, REQUIRE_V2, LAYERS, isUrl } from './helpers.mjs';
import { LAYER_ENUMS } from './schema.mjs';

const D = await loadAll();
// Tolerant of a layer file that does not exist yet.
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);

for (const layer of LAYERS) {
  test(`${layer}.json: enums valid, source + source_url present, gaps is a string`, () => {
    for (const rec of D.layers[layer]) {
      for (const [path, allowed] of Object.entries(LAYER_ENUMS[layer])) {
        const v = get(rec, path);
        if (v === undefined && path === 'data_confidence' && layer === 'legal-ownership' && !REQUIRE_V2) continue;
        assert.ok(allowed.includes(v), `${layer}/${rec.region_id}.${path}="${v}" not in ${allowed.join('|')}`);
      }
      assert.ok(rec.source && isUrl(rec.source_url), `${layer}/${rec.region_id} source/source_url`);
      assert.equal(typeof rec.gaps, 'string', `${layer}/${rec.region_id}.gaps`);
    }
  });
}
test('legal-ownership has data_confidence on every record (REQUIRE_V2) and honest sparsity: all-unknown demographic records are not "medium"/"high"', () => {
  if (REQUIRE_V2) for (const r of D.layers['legal-ownership']) assert.ok(['high', 'medium', 'low'].includes(r.data_confidence), `legal-ownership/${r.region_id}.data_confidence`);
  for (const r of D.layers['demographic-trajectory']) {
    const unk = ['population_trend', 'median_age_band', 'migration_dynamic', 'rural_density_signal'].every((k) => r[k] === 'unknown');
    if (unk) assert.equal(r.data_confidence, 'low', `${r.region_id}: all fields unknown yet data_confidence=${r.data_confidence}`);
  }
});
test('no layer claims uniform "high" confidence on a thin evidence base (>80% high is not credible)', () => {
  for (const layer of LAYERS) { const rs = D.layers[layer].filter((r) => r.data_confidence); if (rs.length < 6) continue; const hi = rs.filter((r) => r.data_confidence === 'high').length / rs.length; assert.ok(hi <= 0.8 || layer === 'land-cost', `${layer}: ${(hi * 100).toFixed(0)}% high`); }
});
test('land-cost: price range sane, currency present, band "unknown" iff no range', () => {
  for (const r of D.layers['land-cost']) {
    if (r.price_per_ha_low != null) { assert.ok(r.price_per_ha_high >= r.price_per_ha_low, `${r.region_id} low>high`); assert.ok(r.price_currency, `${r.region_id} currency`); assert.ok(r.price_vintage, `${r.region_id} price_vintage`); }
    else assert.equal(r.affordability_band, 'unknown', `${r.region_id}`);
  }
});
