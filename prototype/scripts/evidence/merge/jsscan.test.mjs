import test from 'node:test';
import assert from 'node:assert/strict';
import {
  findExport, resolve, objectEntries, arrayElements, readLiteral, encodeString, replaceRange, removeSpan, skipTrivia, matchClose, exportedObjects,
} from './jsscan.mjs';

const SRC = `// header { not code
export const values = {
  // a comment with a } and a quote ' in it
  alpha: {
    note: 'brace } and "quote" and // not a comment',
    n: -0.5, // trailing
    s: "double 'single' inside",
    t: \`template \${1 + 1} text\`,
    'hy-phen': { x: 1 },
    /* block } */ later: [1, 2, { a: 'z' }],
  },
  'beta-land': { v: 2 },
};
export const list = [{ id: 'a', n: 1 }, { id: 'b-c', n: 2 }];
`;

test('findExport and exportedObjects see real exports only', () => {
  assert.ok(findExport(SRC, 'values') > 0);
  assert.ok(findExport(SRC, 'list') > 0);
  assert.equal(findExport(SRC, 'nothing'), -1);
  assert.deepEqual(exportedObjects(SRC).map((e) => e.name), ['values', 'list']);
});

test('matchClose skips strings, template literals and comments', () => {
  const open = findExport(SRC, 'values');
  const close = matchClose(SRC, open);
  assert.equal(SRC[close], '}');
  assert.ok(SRC.slice(close).startsWith('};'));
});

test('objectEntries reads bare, quoted and hyphenated keys and keeps value spans exact', () => {
  const open = findExport(SRC, 'values');
  const top = objectEntries(SRC, open);
  assert.deepEqual(top.entries.map((e) => e.key), ['alpha', 'beta-land']);
  const alpha = objectEntries(SRC, top.entries[0].valStart);
  assert.deepEqual(alpha.entries.map((e) => e.key), ['note', 'n', 's', 't', 'hy-phen', 'later']);
  const lits = Object.fromEntries(alpha.entries.map((e) => [e.key, readLiteral(SRC, e.valStart, e.valEnd)]));
  assert.equal(lits.note.value, 'brace } and "quote" and // not a comment');
  assert.equal(lits.n.value, -0.5);
  assert.equal(lits.s.quote, '"');
  assert.equal(lits.t.type, 'other');
  assert.equal(lits['hy-phen'].type, 'object');
});

test('resolve walks keys, [id=..] selectors and [n] indexes', () => {
  const r = resolve(SRC, ['values', 'alpha', 'n']);
  assert.ok(r.found);
  assert.equal(SRC.slice(r.entry.valStart, r.entry.valEnd), '-0.5');
  const b = resolve(SRC, ['values', 'beta-land', 'v']);
  assert.equal(SRC.slice(b.entry.valStart, b.entry.valEnd), '2');
  const l = resolve(SRC, ['list', '[id=b-c]', 'n']);
  assert.equal(SRC.slice(l.entry.valStart, l.entry.valEnd), '2');
  const i = resolve(SRC, ['values', 'alpha', 'later', '[2]', 'a']);
  assert.equal(SRC.slice(i.entry.valStart, i.entry.valEnd), "'z'");
  const miss = resolve(SRC, ['values', 'alpha', 'nope']);
  assert.equal(miss.found, false);
  assert.equal(miss.missing, 'nope');
});

test('encodeString escapes the quote in use, backslashes and newlines', () => {
  assert.equal(encodeString("it's", "'"), "'it\\'s'");
  assert.equal(encodeString('say "hi"', '"'), '"say \\"hi\\""');
  assert.equal(encodeString('a\\b\nc', '"'), '"a\\\\b\\nc"');
  assert.equal(encodeString('\u2028', '"'), '"\\u2028"');
});

test('replaceRange keeps everything outside the span', () => {
  const r = resolve(SRC, ['values', 'alpha', 'n']);
  const out = replaceRange(SRC, r.entry.valStart, r.entry.valEnd, '7');
  assert.ok(out.includes('n: 7, // trailing'));
  assert.equal(out.length, SRC.length - 4 + 1);
});

test('removeSpan removes an entry with its comma and line, and the previous comma when the last has none', () => {
  const j = '{\n  "a": 1,\n  "b": 2,\n  "c": 3\n}';
  const o = objectEntries(j, 0);
  const noC = removeSpan(j, o.entries, 2);
  assert.equal(noC, '{\n  "a": 1,\n  "b": 2\n}');
  assert.deepEqual(JSON.parse(noC), { a: 1, b: 2 });
  const noA = removeSpan(j, o.entries, 0);
  assert.deepEqual(JSON.parse(noA), { b: 2, c: 3 });
  const one = '[{"id":"x"},{"id":"y"},{"id":"z"}]';
  const a = arrayElements(one, 0);
  assert.equal(removeSpan(one, a.elements, 1), '[{"id":"x"},{"id":"z"}]');
});

test('skipTrivia steps over comments and whitespace', () => {
  assert.equal(skipTrivia('  // x\n /* y */ z', 0), 16);
});
