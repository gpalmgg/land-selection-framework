import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { loadAll, readText, REQUIRE_V2, UPG, NEW_REGION_IDS, nullFindings, underscoreKeys, isNum, fixture } from './helpers.mjs';
import * as S from './schema.mjs';

const D = await loadAll();
const { regions, values, criteria } = D;
const ids = regions.map((r) => r.id);
const BBOX = { europe: [-12, 35, 40, 72], 'north-america': [-126, 14, -52, 60] }; // = map layer clips in src/main.js

test('region ids: unique slugs, single-quoted literal (python scripts regex them)', () => {
  assert.equal(new Set(ids).size, ids.length, 'duplicate region id');
  for (const id of ids) assert.match(id, /^[a-z0-9]+(-[a-z0-9]+)*$/, `bad slug ${id}`);
  const src = readText('data/regions.js');
  const m = [...src.matchAll(/id:\s*'([^']+)',[^}]*?coords:/g)].map((x) => x[1]);
  assert.deepEqual(m.sort(), [...ids].sort(), 'scripts/compile_per_jurisdiction.py regex would miss/garble a region: keep `id: \'x\', ... coords:` with no } between');
});

test('regions: required fields and geography', () => {
  for (const r of regions) {
    assert.ok(S.CONTINENTS.includes(r.continent), `${r.id} continent`);
    for (const f of ['name', 'country', 'blurb']) assert.ok(typeof r[f] === 'string' && r[f].trim(), `${r.id}.${f}`);
    assert.ok(r.blurb.length <= 400, `${r.id} blurb too long for cards/meta`);
    assert.ok(Array.isArray(r.coords) && r.coords.length === 2 && r.coords.every(isNum), `${r.id} coords`);
    const [lon, lat] = r.coords; const [w, s, e, n] = BBOX[r.continent];
    assert.ok(lon >= w && lon <= e && lat >= s && lat <= n, `${r.id} coords [lon,lat]=${r.coords} outside the ${r.continent} map clip: needs new clipped layers (see EV-INT-REGIONS)`);
    assert.match(r.accent || '', /^#[0-9a-fA-F]{6}$/, `${r.id} accent`);
  }
});

test('region accents equal design/final-assets/region-accents.json (30 distinct hex values; applied by EV-INT-REGIONS)', () => {
  const f = path.join(UPG, 'design/final-assets/region-accents.json');
  assert.ok(existsSync(f), 'design/final-assets/region-accents.json missing');
  const acc = JSON.parse(readFileSync(f, 'utf8'));
  const wrong = regions.filter((r) => String(r.accent).toLowerCase() !== String(acc[r.id]).toLowerCase()).map((r) => `${r.id}: ${r.accent} != ${acc[r.id]}`);
  assert.deepEqual(wrong, [], 'accent mismatches:\n' + wrong.join('\n'));
  const mine = regions.map((r) => String(r.accent).toLowerCase());
  assert.equal(new Set(mine).size, mine.length, 'region accents must be distinct');
  assert.equal(new Set(Object.values(acc).map((v) => v.toLowerCase())).size, Object.keys(acc).length, 'region-accents.json has duplicate values');
});

test('criteria: schema', () => {
  const have = criteria.map((c) => c.id);
  for (const id of S.CRITERIA_IDS) assert.ok(have.includes(id), `missing criterion ${id}`);
  assert.equal(new Set(have).size, have.length);
  const errs = [];
  for (const c of criteria) errs.push(...S.validateCriterion(c, { requireV2: REQUIRE_V2 }).errors);
  assert.deepEqual(errs, [], 'criteria errors:\n' + errs.join('\n'));
});

test('criteria: unregistered fields are reported (warning; register in tests/schema.mjs EXTENSIONS)', (t) => {
  const w = criteria.flatMap((c) => S.validateCriterion(c).warnings);
  const r = regions.flatMap((x) => Object.keys(x).filter((k) => ![...S.BASE_KEYS.regions, ...S.EXTENSIONS.regions].includes(k)).map((k) => `regions.${x.id}: unregistered field "${k}"`));
  for (const m of [...w, ...r]) t.diagnostic(`WARN ${m}`);
});

test('values: every region x criterion cell exists, no extras; numeric (or null with nullReason); in slider range (default-threshold trap)', () => {
  assert.deepEqual(Object.keys(values).sort(), [...ids].sort(), 'values keys != regions');
  const errs = [];
  for (const r of regions) {
    assert.deepEqual(Object.keys(values[r.id]).sort(), criteria.map((c) => c.id).sort(), `${r.id} criterion keys`);
    for (const c of criteria) {
      const v = values[r.id][c.id], w = `${r.id}.${c.id}`;
      errs.push(...S.validateCellCore(v, w));
      if (!v || v.value === null || !isNum(v.value)) continue; // null never counts as pass or fail
      const min = c.higherIs === 'better';
      const ok = min ? v.value >= c.rangeMin : v.value <= c.rangeMax; // the default threshold is rangeMin for min-type, rangeMax for max-type
      if (!ok) errs.push(`${w}=${v.value} fails the DEFAULT threshold (range ${c.rangeMin}..${c.rangeMax}): widen the criterion range, never clamp the value`);
      if (v.value < c.rangeMin - 1e-9 && !v.outOfRange) errs.push(`${w}=${v.value} below rangeMin; set cell.outOfRange='reason' or widen`);
      if (v.value > c.rangeMax + 1e-9 && !v.outOfRange) errs.push(`${w}=${v.value} above rangeMax; set cell.outOfRange='reason' or widen`);
    }
  }
  assert.deepEqual(errs, [], 'cell errors:\n' + errs.join('\n'));
});

test('null cells: never more than 3 per region (WARN for the existing regions, FAIL for the new ones), reason always named', (t) => {
  const { warn, fail } = nullFindings(values, criteria, ids);
  for (const m of warn) t.diagnostic(`WARN ${m}`);
  assert.deepEqual(fail, [], 'new regions above the null cap:\n' + fail.join('\n'));
});

test('values: one unit per criterion; no leaked QA/markdown/placeholder text', () => {
  for (const c of criteria) assert.equal(new Set(ids.map((id) => values[id][c.id]).filter((v) => v.value !== null).map((v) => v.unit)).size, 1, `${c.id} mixed units`);
  const bad = /\*\*|\bUNVERIFIED\b|\bTODO\b|\bFIXME\b|dossier|internally inconsistent|\bQA\b|best-effort|plausible default/i;
  for (const id of ids) for (const [k, v] of Object.entries(values[id])) for (const f of ['label', 'vintage', 'source', 'nullReason']) if (v[f] !== undefined) assert.ok(!bad.test(v[f]), `${id}.${k}.${f} leaks internal text: ${v[f]}`);
  for (const r of regions) assert.ok(!bad.test(r.blurb), `${r.id} blurb leaks internal text`);
});

test('v2 cell fields (method, retrieved, footprint, sourceId, trajectory) valid when present; required under REQUIRE_V2=1', () => {
  const errs = [];
  for (const id of ids) for (const c of criteria) errs.push(...S.validateCellV2(values[id][c.id], `${id}.${c.id}`, { requireV2: REQUIRE_V2, crit: c }));
  assert.deepEqual(errs, [], 'v2 cell errors:\n' + errs.join('\n'));
});

test('underscore-prefixed keys never ship (regions.js)', () => {
  assert.deepEqual([...underscoreKeys(regions, 'regions'), ...underscoreKeys(values, 'values'), ...underscoreKeys(criteria, 'criteria')], []);
});

// ---- validator self-tests on fixtures (always run) ----
test('validator self-test: cell fixtures (valid passes; each invalid variant fails)', () => {
  const ok = fixture('valid/cell.json');
  assert.deepEqual(S.validateCell(ok, 'fx', { requireV2: true }), []);
  const bad = {
    'null without nullReason': { ...ok, value: null },
    'unregistered field': { ...ok, extra: 1 },
    'direction better': { ...ok, trajectory: { ...ok.trajectory, direction: 'better' } },
    'direction vs delta': { ...ok, trajectory: { ...ok.trajectory, direction: 'falling', delta: 2.1, unit: '°C' } },
    'outOfRange without reason': { ...ok, outOfRange: '' },
    'arrow without a source': { ...ok, trajectory: { status: 'measured', direction: 'rising', basis: 'a long enough basis text' } },
  };
  for (const [name, cell] of Object.entries(bad)) assert.ok(S.validateCell(cell, 'fx', { requireV2: true }).length > 0, `${name} should fail`);
  assert.deepEqual(S.validateCell({ value: null, nullReason: 'Hansen tile download truncated twice; not reproduced' }, 'fx'), [], 'null with a reason is valid');
});

test('validator self-test: null-count policy (existing id with 4 nulls warns, NEW id with 4 nulls fails)', () => {
  const f = fixture('invalid/nulls.json');
  const mk = (id) => ({ [id]: Object.fromEntries(f.criteria.map((c, i) => [c, { value: i < 4 ? null : 1, nullReason: 'not reproduced in fixture' }])) });
  const crit = f.criteria.map((id) => ({ id }));
  const old = nullFindings(mk('alentejo'), crit, ['alentejo']);
  assert.equal(old.warn.length, 1); assert.equal(old.fail.length, 0);
  const nw = nullFindings(mk(NEW_REGION_IDS[0]), crit, [NEW_REGION_IDS[0]]);
  assert.equal(nw.fail.length, 1); assert.equal(nw.warn.length, 0);
  assert.equal(nullFindings(mk('alentejo'), crit.slice(0, 3).concat(crit.slice(4)), ['alentejo']).warn.length, 0, 'three nulls is within the cap');
});
