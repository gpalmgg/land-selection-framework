import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { loadAll, ROOT, listDir, has, GATE, hygieneHits, stringsOf, fixture } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
// Reciprocity: every entry under --strict (gate mode); otherwise only verified entries (the wave-0 draft module is not shipped by itself).
const recipEntries = D.reciprocity ? Object.fromEntries(Object.entries(D.reciprocity).filter(([, e]) => GATE || (e && e.status === 'verified'))) : null;
const modules = { regions: D.regions, values: D.values, criteria: D.criteria, landStanding: D.landStanding, regionDepth: D.regionDepth, v1Lookup: D.v1Lookup, legalPathway: D.legalPathway, context: D.context, sources: D.sources, layerSources: D.layerSources, bioregions: D.bioregions, reciprocity: recipEntries, presets: D.presets };

test('hygiene: no shipped data-module string contains "upgrade-2026-10", an email, a phone number or mailto:', () => {
  const hits = [];
  for (const [name, m] of Object.entries(modules)) if (m) hits.push(...hygieneHits(stringsOf(m, name)));
  assert.deepEqual(hits, [], 'internal paths and personal contact details never ship:\n' + hits.slice(0, 25).join('\n'));
});

test('hygiene: no processed JSON file contains "upgrade-2026-10", an email, a phone number or mailto:', () => {
  const hits = [];
  for (const f of listDir('data/processed').filter((n) => n.endsWith('.json'))) {
    if (!has(`data/processed/${f}`)) continue;
    const text = JSON.parse(readFileSync(path.join(ROOT, 'data/processed', f), 'utf8'));
    hits.push(...hygieneHits(stringsOf(text, f)));
  }
  assert.deepEqual(hits, [], hits.slice(0, 25).join('\n'));
});

const strings = (obj) => stringsOf(obj || {}, '').map((s) => s.text);
test('hygiene: Vermont land standing, region depth and reciprocity strings avoid identity / genealogy / fraud / dispute wording', () => {
  const all = [...strings(D.landStanding.vermont), ...strings(D.regionDepth.vermont), ...strings(recipEntries && recipEntries.vermont)];
  const bad = all.filter((s) => S.VERMONT_BANNED.test(s)).map((s) => s.slice(0, 120));
  assert.deepEqual(bad, [], 'the Vermont copy never adjudicates who is or is not who: ' + bad.join(' | '));
});

test('hygiene: Finger Lakes strings avoid leadership / faction / dispute / illegitimacy wording', () => {
  const all = [...strings(D.landStanding['finger-lakes']), ...strings(D.regionDepth['finger-lakes']), ...strings(recipEntries && recipEntries['finger-lakes'])];
  const bad = all.filter((s) => S.FINGER_LAKES_BANNED.test(s)).map((s) => s.slice(0, 120));
  assert.deepEqual(bad, [], bad.join(' | '));
});

test('validator self-test: a fixture with an internal path, an email, a phone number or mailto: is caught; clean strings and URLs pass', () => {
  const f = fixture('invalid/hygiene-leak.json');
  assert.deepEqual(hygieneHits(stringsOf({ s: f.clean }, 'fx')), []);
  const hits = hygieneHits(stringsOf({ s: f.leaks }, 'fx'));
  assert.equal(hits.length, f.leaks.length + 1, 'each leak is reported (the mailto string is also an email): ' + hits.join(' | ')); // "mailto:hello@example.org" = mailto + email
  for (const label of ['internal path', 'email', 'phone', 'mailto']) assert.ok(hits.some((h) => h.includes(label)), label);
  assert.ok(S.VERMONT_BANNED.test('A contested identity claim') && !S.VERMONT_BANNED.test('Held by the Abenaki'));
  assert.ok(S.FINGER_LAKES_BANNED.test('internal faction dispute') && !S.FINGER_LAKES_BANNED.test('the Haudenosaunee confederacy'));
});
