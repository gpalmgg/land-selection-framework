// node --test tests/core/load-slim.test.mjs
// data/load-slim.js is derived from three big data modules so the home page can skip them (MC-PERF). It must never drift.
import test from 'node:test';
import assert from 'node:assert/strict';
import { regions } from '../../data/regions.js';
import { reciprocity } from '../../data/reciprocity.js';
import { landStanding } from '../../data/land-standing.js';
import { regionDepth } from '../../data/region-depth.js';
import { salutations, cardAsks } from '../../data/load-slim.js';
import { salutation, salutationFrom } from '../../lib/salutation.js';
import { firstSentence as cardFirstSentence } from '../../src/ui/region-grid.js';
import { firstSentence as genFirstSentence, build } from '../../scripts/gen_load_slim.mjs';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

test('the committed data/load-slim.js is exactly what the generator writes now', async () => {
  const disk = readFileSync(path.join(root, 'data/load-slim.js'), 'utf8');
  assert.equal(disk, await build(root), 'run: node scripts/gen_load_slim.mjs --write');
});

test('every region: the slim salutation equals the rule applied to the full data', () => {
  for (const r of regions) {
    assert.deepEqual(salutation(r.id), salutationFrom(reciprocity[r.id], landStanding[r.id]), r.id);
    assert.ok(salutations[r.id], `${r.id} has a slim salutation`);
  }
  assert.deepEqual(Object.keys(salutations).sort(), regions.map((r) => r.id).sort());
});

test('every region: the slim "It asks of you" equals the card rule applied to the full text', () => {
  for (const r of regions) {
    const d = regionDepth[r.id];
    const want = d && d.asks ? cardFirstSentence(d.asks) : '';
    assert.equal(cardAsks[r.id] || '', want, r.id);
  }
});

test('the generator copy of firstSentence agrees with the card on awkward inputs', () => {
  for (const t of ['', null, 'One. Two.', 'Dr. Smith asks: a long lead clause ' + 'x'.repeat(160) + ': tail. Next.', 'No stop', 'It costs 1.5 euro. More.', 'St. Anne is here. And there.']) {
    assert.equal(genFirstSentence(t), cardFirstSentence(t), JSON.stringify(t));
  }
});
