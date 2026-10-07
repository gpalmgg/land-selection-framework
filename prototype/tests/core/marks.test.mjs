// node --test tests/core/marks.test.mjs
// lib/marks.js: the unique 1-2 letter mark of every region marker, and the marker's aria-label.
import test from 'node:test';
import assert from 'node:assert/strict';
import { assignMarks, markLabel, candidates, firstLetter } from '../../lib/marks.js';
import { regions } from '../../data/regions.js';
import { salutation } from '../../lib/salutation.js';

const R = (id, name, continent = 'europe') => ({ id, name, continent });

test('a unique first letter is the mark', () => {
  assert.deepEqual(assignMarks([R('a', 'Galicia'), R('b', 'Transylvania')]), { a: 'G', b: 'T' });
});

test('a collision takes the first two letters, in declared order (Alentejo / Asturias)', () => {
  const m = assignMarks([R('al', 'Alentejo'), R('gal', 'Galicia'), R('as', 'Asturias')]);
  assert.deepEqual(m, { al: 'Al', gal: 'G', as: 'As' });
});

test('a two-letter collision extends: Northern New Mexico, Nova Scotia, Northeast Missouri', () => {
  const m = assignMarks([R('a', 'Northern New Mexico', 'na'), R('b', 'Nova Scotia / Cape Breton', 'na'), R('c', 'Northeast Missouri / Southeast Iowa', 'na')]);
  assert.equal(m.a, 'No');
  assert.equal(m.b, 'Ns');
  assert.equal(m.c, 'Nm');
  assert.equal(new Set(Object.values(m)).size, 3);
});

test('the continents are independent: V in both is fine', () => {
  const m = assignMarks([R('a', 'Valle Maira', 'europe'), R('b', 'Vermont', 'na')]);
  assert.deepEqual(m, { a: 'V', b: 'V' });
});

test('accents and non-Latin names are handled', () => {
  assert.equal(firstLetter('Ōtākaro Łąki'), 'O');
  assert.equal(firstLetter('Québec Eastern Townships'), 'Q');
  assert.equal(firstLetter('テスト地域'), 'テ');
  assert.equal(firstLetter('  (…)'), '');
  const m = assignMarks([R('a', 'Cévennes'), R('b', 'Cascadia')]);
  assert.deepEqual(m, { a: 'Cé'.normalize('NFD').replace(/[̀-ͯ]/g, '') , b: 'Ca' });
});

test('names with no letter, and identical names, still get distinct marks', () => {
  const m = assignMarks([R('a', '12'), R('b', '34'), R('c', 'X'), R('d', 'X')]);
  assert.equal(new Set(Object.values(m)).size, 4);
  assert.ok(Object.values(m).every((x) => x.length >= 1 && x.length <= 2));
});

test('candidates are the two-letter options, best first', () => {
  assert.deepEqual(candidates('Nova Scotia').slice(0, 3).map((p) => p.join('').toLowerCase()), ['no', 'ns', 'nv']);
});

test('real regions: marks are unique per continent, 1-2 characters, deterministic', () => {
  const marks = assignMarks(regions);
  assert.equal(Object.keys(marks).length, regions.length);
  const per = {};
  regions.forEach((r) => {
    const m = marks[r.id];
    assert.ok(m && Array.from(m).length >= 1 && Array.from(m).length <= 2, `${r.id} mark "${m}"`);
    (per[r.continent] = per[r.continent] || []).push(m.toLowerCase());
  });
  Object.entries(per).forEach(([c, list]) => assert.equal(new Set(list).size, list.length, `${c} marks collide: ${list}`));
  assert.deepEqual(assignMarks(regions), marks);
  // the collisions the old r.name[0] code had
  const by = (n) => regions.find((r) => r.name.startsWith(n));
  ['Alentejo', 'Asturias'].forEach((n) => { const r = by(n); if (r) assert.equal(marks[r.id].length, 2, n); });
});

test('real regions: the aria-label carries the full name and "whose land", for every region', () => {
  regions.forEach((r) => {
    const s = salutation(r.id);
    const label = markLabel(r, s.text, { contested: s.contested });
    assert.ok(label.startsWith(r.name + ', whose land: '), label);
    assert.match(label, /whose land/i);
  });
});

test('markLabel: contested and outside add words; a region with no entry says so, not blank', () => {
  const r = R('x', 'Nova Scotia / Cape Breton');
  assert.equal(markLabel(r, "Mi'kma'ki (unceded)"), "Nova Scotia / Cape Breton, whose land: Mi'kma'ki (unceded)");
  assert.match(markLabel(r, 'X', { contested: true, outside: true }), /, contested, outside your thresholds$/);
  assert.match(markLabel(r, ''), /whose land: not yet recorded here/);
});

// ---- src/map/labels.js layout(): the pure half of the label placement -------------------------------------------------
import { layout, pillSides } from '../../src/map/labels.js';

test('labels layout: the first free side wins, in the order right, left, above, below', () => {
  const W = 600, H = 400;
  const one = layout({ W, H, chips: [{ x: 300, y: 200 }], labels: [{ w: 80, h: 21 }] });
  assert.deepEqual(one.region, ['right']);
  const edge = layout({ W, H, chips: [{ x: 560, y: 200 }], labels: [{ w: 80, h: 21 }] });
  assert.deepEqual(edge.region, ['left']);
  const top = layout({ W, H, chips: [{ x: 300, y: 10 }], labels: [{ w: 620, h: 21 }] });   // wider than the stage: dropped
  assert.deepEqual(top.region, [null]);
  const above = layout({ W, H, chips: [{ x: 560, y: 390 }, { x: 470, y: 390 }], labels: [{ w: 80, h: 21 }, { w: 80, h: 21 }] });
  assert.equal(above.region[0], 'above');
});

test('labels layout: chips are obstacles first, pills never overlap, and a pill with no free side is dropped', () => {
  const W = 600, H = 400;
  const chips = [{ x: 300, y: 200 }, { x: 392, y: 200 }];     // the second chip sits where the first pill would go
  const res = layout({ W, H, chips, labels: [{ w: 80, h: 21 }, { w: 80, h: 21 }] });
  assert.notEqual(res.region[0], 'right');
  const rects = res.rects.filter(Boolean);
  rects.forEach((a, i) => rects.slice(i + 1).forEach((b) => assert.ok(a.r <= b.l || a.l >= b.r || a.b <= b.t || a.t >= b.b)));
  const boxed = layout({ W: 100, H: 60, chips: [{ x: 50, y: 30 }], labels: [{ w: 90, h: 21 }] });
  assert.deepEqual(boxed.region, [null]);
});

test('labels layout: a stage narrower than 560px drops every pill; the same input gives the same output', () => {
  const input = { W: 400, H: 400, chips: [{ x: 100, y: 100 }, { x: 250, y: 250 }], labels: [{ w: 60, h: 21 }, { w: 60, h: 21 }], compact: true };
  assert.deepEqual(layout(input).region, [null, null]);
  const wide = { ...input, W: 900, compact: false };
  assert.deepEqual(layout(wide), layout(wide));
});

test('labels layout: extension labels go after the pills, below else above, and never into a placed pill', () => {
  const res = layout({ W: 600, H: 400, chips: [{ x: 300, y: 200 }], labels: [{ w: 80, h: 21 }], extras: [{ x: 300, y: 100, w: 90, h: 14 }, { x: 300, y: 180, w: 90, h: 14 }, { x: 5, y: 5, w: 90, h: 14 }] });
  assert.equal(res.extra[0], 'below');
  assert.equal(res.extra[1], 'above');
  assert.ok(['below', 'above', null].includes(res.extra[2]));
  assert.equal(pillSides(0, 0, 10, 10).map((s) => s[0]).join(), 'right,left,above,below');
});
