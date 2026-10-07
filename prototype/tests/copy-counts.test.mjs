import test from 'node:test';
import assert from 'node:assert/strict';
import { loadAll, readText, listDir } from './helpers.mjs';

const D = await loadAll();
const N = D.regions.length, C = D.criteria.length;
const WORDS = { eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, twenty: 20, thirty: 30, forty: 40 };
const numWord = (n) => Object.entries(WORDS).find(([, v]) => v === n)?.[0];
const files = ['index.html', 'deeper.html', 'api/og.js', 'api/share.js', 'src/main.js', 'scripts/gen_region_pages.mjs', ...listDir('region').filter((f) => f.endsWith('.html')).map((f) => `region/${f}`)];
const perContinent = (n) => ['europe', 'north-america'].map((c) => D.regions.filter((r) => r.continent === c).length).includes(n);

test('hard-coded region/criteria counts match the data (never typed; read from regions.js); a copy that says "twenty regions" after adding regions fails here', () => {
  const hits = [];
  for (const f of files) {
    const t = readText(f); if (!t) continue;
    for (const m of t.matchAll(/\b(eight|nine|ten|eleven|twelve|twenty|thirty|forty|\d{1,2})[ -](?:\w+ )?(regions|criteria)\b/gi)) {
      const isDigit = /^\d/.test(m[1]); if (isDigit && (f.startsWith('region/') || Number(m[1]) < 2)) continue; // digits only checked in the home page / edge functions / client
      const n = WORDS[m[1].toLowerCase()] ?? Number(m[1]); const want = m[2].toLowerCase() === 'regions' ? N : C;
      if (n !== want && !(m[2].toLowerCase() === 'regions' && perContinent(n))) hits.push(`${f}: "${m[0]}" (want ${numWord(want) || want})`);
    }
  }
  assert.deepEqual(hits.slice(0, 40), [], `stale counts (data: ${N} regions, ${C} criteria). Prefer deriving from regions.length at render time.`);
});
