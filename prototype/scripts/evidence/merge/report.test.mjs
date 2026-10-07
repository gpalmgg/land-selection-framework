import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import fs from 'node:fs';
import {
  copyFixtureRoot, read, write, cli, scratchUpg, tmp,
} from './_kit.mjs';
import {
  normText, sameValue, findAllCanon, canonChars, parseArgs, buildIndex, HOLD_RE, targetKind, writeIfChanged,
} from './common.mjs';

test('normalisation for the old-value assertion: typographic quotes and dashes, accents, whitespace, escaped quotes, numbers', () => {
  assert.ok(sameValue('Hermit’s Peak', "Hermit's Peak"));
  assert.ok(sameValue('6–18 month', '6-18 month'));
  assert.ok(sameValue('posesión  de   tierra', 'posesion de tierra'));
  assert.ok(sameValue("Hermit's", "Hermit\\'s"));
  assert.ok(sameValue('0.80', '0.8'));
  assert.ok(sameValue(19.5, '19.50'));
  assert.ok(!sameValue('Low', 'High'));
  assert.ok(!sameValue('12', '12 km'));
  assert.equal(normText('  a b \n c '), 'a b c');
  assert.deepEqual(findAllCanon('Café and cafe and CAFÉ', 'cafe'), [9], 'canonical match is case-sensitive and index-preserving');
  assert.equal(canonChars('é').length, 1);
});

test('parseArgs: flags with and without values, repeated list flags, booleans never consume a value, positional ids', () => {
  const a = parseArgs(['abc', '--out', 'x', '--dry-run', '--ref', 'a', '--ref', 'b', '--min-confidence=high', 'tail'], { boolFlags: ['dry-run'], listFlags: ['ref'] });
  assert.deepEqual(a._, ['abc', 'tail']);
  assert.equal(a.out, 'x');
  assert.equal(a.dryRun, true);
  assert.deepEqual(a.ref, ['a', 'b']);
  assert.equal(a.minConfidence, 'high');
});

test('target families and the hold regexp', () => {
  assert.equal(targetKind('prototype/data/regions.js'), 'regions');
  assert.equal(targetKind('prototype/data/land-standing.js'), 'landStanding');
  assert.equal(targetKind('prototype/data/region-depth.js'), 'regionDepth');
  assert.equal(targetKind('prototype/deeper.html'), 'deeper');
  assert.equal(targetKind('prototype/data/research-dossier/oaxaca/regen.md'), 'dossier');
  assert.equal(targetKind('prototype/data/v1-lookup.js and prototype/data/processed/legal-ownership.json (+ .geojson)'), 'layers');
  for (const t of ['needs human review before use', 'Human review advised.', 'human review required', 'human review before publication']) assert.ok(HOLD_RE.test(t), t);
  for (const t of ['a human reviewed it', 'review the link']) assert.ok(!HOLD_RE.test(t), t);
});

test('writeIfChanged is idempotent and honours dry-run', () => {
  const f = path.join(tmp(), 'sub/x.json');
  assert.equal(writeIfChanged(f, 'a', { dryRun: true }), 'dry-run');
  assert.ok(!fs.existsSync(f));
  assert.equal(writeIfChanged(f, 'a'), 'written');
  assert.equal(writeIfChanged(f, 'a'), 'unchanged');
  assert.equal(writeIfChanged(f, 'b'), 'written');
});

test('index rows are stable: running twice gives the same refs in the same order', () => {
  const { rev } = scratchUpg();
  assert.deepEqual(buildIndex(rev), buildIndex(rev));
});

test('integration report: counts computed from the files, patch states against the current data, deterministic', () => {
  const { upg, out, rev } = scratchUpg();
  const root = copyFixtureRoot();
  const flags = ['--root', root, '--out', out, '--reverify', rev, '--upg', upg];
  assert.equal(cli('reverify_to_patches.mjs', flags).code, 0);
  const rep = path.join(tmp(), 'integration-report.md');
  const a = cli('report.mjs', [...flags, '--out-file', rep]);
  assert.equal(a.code, 0, a.err);
  let text = read(rep);
  assert.match(text, /## 1\. Re-verification input/);
  assert.match(text, /corrections \d+ = \d+ high \+ \d+ medium \+ \d+ low/);
  assert.match(text, /\| data\/regions\.js \| 8 \| 0 \| 6 \| 1 \| 1 \| 0 \|/, 'six to apply, the wrong-old item is stale, the missing cell is unresolved: nothing is applied yet');
  assert.match(text, /- stale `alpha\/medium\/3` data\/regions\.js/);
  assert.match(text, /- unresolved `alpha\/medium\/17`/);
  assert.match(text, /### Held by the converter \(2\)/);
  assert.match(text, /### Needs hand \(\d+\)/);
  assert.match(text, /state held-human-review/);
  assert.match(text, /No `verify\/dropped-regions\.json`: no region has been dropped\./);
  // after patch_js: "already applied" replaces "still to apply", and the report changes accordingly but stays deterministic
  assert.equal(cli('patch_js.mjs', [...flags, '--no-record']).code, 0);
  assert.equal(cli('report.mjs', [...flags, '--out-file', rep]).code, 0);
  text = read(rep);
  assert.match(text, /\| data\/regions\.js \| 8 \| 6 \| 0 \| 1 \| 1 \| 0 \|/);
  const once = text;
  const b = cli('report.mjs', [...flags, '--out-file', rep]);
  assert.match(b.out, /unchanged/);
  assert.equal(read(rep), once);
  // dropped regions are listed with their reasons
  write(path.join(upg, 'verify/dropped-regions.json'), { dropped: [{ id: 'gamma', reason: 'too many null cells' }] });
  cli('report.mjs', [...flags, '--out-file', rep]);
  assert.match(read(rep), /Dropped regions \(1\):\n- gamma: too many null cells/);
});
