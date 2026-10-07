// node --test tests/core/salutation.test.mjs
// lib/salutation.js: "whose land", the short line above a region's name on every surface.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { salutation, salutationLabel, territoryHead, LABEL } from '../../lib/salutation.js';
import { reciprocity as LIVE_REC } from '../../data/reciprocity.js';
import { landStanding as LIVE_LS } from '../../data/land-standing.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const LS = {
  a: { territory: 'Alentejano montado agro-pastoral culture — large herdade estates and village baldio commons' },
  b: { territory: 'Gaeltacht Irish rural community - hill commonage and the meitheal tradition' },
  c: { territory: 'Zapotec, Mixtec & Chatino comunal lands' },
  d: { territory: 'Head – en dash tail' },
  e: { territory: 'Well-known hyphen-word only, no spaced dash' },
};
const rec = (over = {}) => ({ territoryShort: 'Alentejo montado villages', contested: null, status: 'verified', reviewed: '2026-10-05', ...over });
const call = (id, reciprocity) => salutation(id, { data: { reciprocity, landStanding: LS } });

test('verified, unflagged entry: text is territoryShort; contested only when the entry says so', () => {
  assert.deepEqual(call('a', { a: rec() }), { text: 'Alentejo montado villages', short: 'Alentejo montado villages', contested: false });
  const c = call('a', { a: rec({ territoryShort: 'Sinixt, Ktunaxa and Syilx land', contested: { text: 'x', sources: [] } }) });
  assert.equal(c.contested, true);
  assert.equal(c.text, 'Sinixt, Ktunaxa and Syilx land');
});

test('contested is false when the contested record carries a human-review flag, and text still reads territoryShort', () => {
  const r = call('a', { a: rec({ contested: { text: 'x', sources: [], flag: 'human review' } }) });
  assert.equal(r.contested, false);
  assert.equal(r.text, 'Alentejo montado villages');
});

test('a null contested uses territoryShort (multi-party), never the head of the territory sentence', () => {
  const r = call('a', { a: rec({ territoryShort: 'Ndakina, Wabanaki homeland' }) });
  assert.equal(r.text, 'Ndakina, Wabanaki homeland');
  assert.equal(r.contested, false);
});

test('no entry, a draft entry, or an entry-level flag: the head of the territory before the spaced dash', () => {
  for (const reciprocity of [{}, { a: rec({ status: 'draft' }) }, { a: rec({ flag: 'review' }) }]) {
    assert.deepEqual(call('a', reciprocity), { text: 'Alentejano montado agro-pastoral culture', short: 'Alentejano montado agro-pastoral culture', contested: false });
  }
  assert.equal(call('b', {}).text, 'Gaeltacht Irish rural community');
  assert.equal(call('c', {}).text, 'Zapotec, Mixtec & Chatino comunal lands');
  assert.equal(call('d', {}).text, 'Head');
  assert.equal(call('e', {}).text, 'Well-known hyphen-word only, no spaced dash');
  // a flagged or draft entry can never be contested
  assert.equal(call('a', { a: rec({ status: 'draft', contested: { text: 'x', sources: [] } }) }).contested, false);
  assert.equal(call('a', { a: rec({ flag: 'r', contested: { text: 'x', sources: [] } }) }).contested, false);
});

test('unknown id, missing data and odd input are safe', () => {
  assert.deepEqual(salutation('nowhere'), { text: '', short: '', contested: false });
  assert.deepEqual(call('zzz', {}), { text: '', short: '', contested: false });
  assert.equal(territoryHead(null), '');
  assert.equal(territoryHead('  '), '');
  assert.equal(territoryHead('Only head'), 'Only head');
  assert.equal(call('a', { a: rec({ territoryShort: '   ' }) }).text, 'Alentejano montado agro-pastoral culture', 'a blank territoryShort falls back');
});

test('short drops a trailing parenthesis and is never cut mid-word', () => {
  assert.equal(call('a', { a: rec({ territoryShort: 'Galego parish commons (montes veíñais)' }) }).short, 'Galego parish commons');
  assert.equal(call('a', { a: rec({ territoryShort: 'Galego parish commons (montes veíñais)' }) }).text, 'Galego parish commons (montes veíñais)');
  assert.equal(call('a', { a: rec({ territoryShort: '(whole thing)' }) }).short, '(whole thing)');
});

test('the label is "Whose land" (+ " - contested" as real text), never "Held by"', () => {
  assert.equal(LABEL, 'Whose land');
  assert.equal(salutationLabel(false), 'Whose land');
  assert.equal(salutationLabel(true), 'Whose land - contested');
  const src = readFileSync(path.join(here, '..', '..', 'lib', 'salutation.js'), 'utf8');
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /Held by/i);
  for (const id of Object.keys(LIVE_LS)) {
    const s = salutation(id);
    assert.doesNotMatch(JSON.stringify(s), /Held by/i, id);
    assert.ok(s.text.length > 0, `${id} has a salutation`);
  }
});

test('the live data: every region has a salutation; contested follows the data; a null contested never takes the territory head', () => {
  for (const id of Object.keys(LIVE_LS)) {
    const s = salutation(id);
    const e = LIVE_REC[id];
    const verified = !!(e && e.status === 'verified' && !e.flag);
    if (verified) {
      assert.equal(s.text, e.territoryShort.trim(), id);
      assert.equal(s.contested, !!(e.contested && !e.contested.flag), id);
      assert.ok(e.territoryShort.trim().split(/\s+/).length <= 9, `${id}: territoryShort is at most 9 words`);
    } else {
      assert.equal(s.contested, false, id);
    }
  }
});

test('the module is DOM-free and imports only the slim first-paint data (the full modules stay off the home page, MC-PERF)', () => {
  const src = readFileSync(path.join(here, '..', '..', 'lib', 'salutation.js'), 'utf8');
  const imports = [...src.matchAll(/^import .* from '([^']+)'/gm)].map((m) => m[1]);
  assert.deepEqual(imports.sort(), ['../data/load-slim.js']);
  assert.doesNotMatch(src.replace(/\/\/.*$/gm, ''), /\b(document|window|navigator|localStorage|process\.|require\()/);
});
