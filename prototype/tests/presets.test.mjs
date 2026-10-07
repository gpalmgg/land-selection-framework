import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, readText, REQUIRE_V2 } from './helpers.mjs';

const D = await loadAll();
const { regions, values, criteria } = D;
const dir = (c) => (c.higherIs === 'better' ? 'min' : 'max');
const dflt = (c) => (dir(c) === 'min' ? c.rangeMin : c.rangeMax);
const clamp = (c, n) => Math.max(c.rangeMin, Math.min(c.rangeMax, n));

// PRESETS come from data/presets.js (MC-JS-1 moves them out of src/main.js). Until then they are parsed out of src/main.js
// (read-only, evaluated in a bare Function) so the test still guards the 0-match history (lesson 11).
function loadPresets() {
  if (D.presets) return { presets: D.presets, from: 'data/presets.js' };
  const src = readText('src/main.js');
  const i = src ? src.indexOf('const PRESETS = [') : -1;
  if (i < 0) return null;
  let depth = 0, j = src.indexOf('[', i);
  const start = j;
  for (; j < src.length; j++) { if (src[j] === '[') depth++; else if (src[j] === ']' && --depth === 0) break; }
  try { return { presets: new Function(`return ${src.slice(start, j + 1)};`)(), from: 'src/main.js (not yet importable: request I-1.5)' }; } catch { return null; }
}

test('presets: every preset yields at least one matching region on each continent (null cells never fail a threshold)', (t) => {
  const p = loadPresets();
  if (!p) { process.stderr.write('PRESETS LOUD WARNING: presets cannot be imported (no data/presets.js, none parseable from src/main.js); presets.test.mjs is not checking anything\n'); if (REQUIRE_V2) assert.fail('presets not importable'); return t.skip('PRESETS not importable (data/presets.js missing)'); }
  if (!D.presets) t.diagnostic(`WARN presets read from ${p.from}`);
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  const bad = [];
  for (const preset of p.presets) {
    const th = Object.fromEntries(criteria.map((c) => [c.id, dflt(c)]));
    for (const [cid, val] of Object.entries(preset.sets || {})) { assert.ok(byId[cid], `preset ${preset.id} names unknown criterion ${cid}`); th[cid] = clamp(byId[cid], val); }
    for (const continent of ['europe', 'north-america']) {
      const inView = regions.filter((r) => r.continent === continent);
      if (!inView.length) continue;
      const n = inView.filter((r) => criteria.every((c) => { const v = values[r.id][c.id]; if (!v || typeof v.value !== 'number') return true; return dir(c) === 'min' ? v.value >= th[c.id] : v.value <= th[c.id]; })).length;
      if (n < 1) bad.push(`preset "${preset.id}" matches 0 regions on ${continent}`);
    }
  }
  assert.deepEqual(bad, [], 'a preset that returns 0 teaches visitors the tool is broken (history lesson 11):\n' + bad.join('\n'));
});
