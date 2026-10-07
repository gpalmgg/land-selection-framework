// lib/marks.js: the one- or two-letter mark inside a region's map marker, unique within its continent.
// Pure, DOM-free, edge-safe (no window, document, fetch or storage).
//
//   assignMarks(regions) -> { [regionId]: mark }
//   markLabel(region, whoseLand, outside) -> the marker's aria-label
//
// The rule (MC-MAP-UI, plan requirement "resolve marker initial collisions"):
//   1. A region whose first letter is not shared by another region of its continent gets that one letter ("V").
//   2. Regions that share a first letter get the first TWO letters of their name, in the slate's declared order
//      ("Al", "As").
//   3. If two letters still collide inside the group (Northern New Mexico, Nova Scotia and Northeast Missouri are all
//      "No"), the later region takes the next free candidate: its first letter plus the initial of its second word,
//      its third word, ..., then its first letter plus each later letter of the name. Declared order decides, so the
//      result is the same everywhere. A one-letter mark is never given to a region whose first letter is shared.
// Letters are compared without case or accents ("Ōtākaro" starts with O; "Québec" with Q) and the mark is shown as
// an initial capital plus a lower-case second letter. A name with no letter at all falls back to "?" plus a counter so
// two such regions still differ. The marker's aria-label always names the region in full and says whose land it is.

const strip = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '');

// The letters of a word that count for a mark: Unicode letters only (digits and punctuation never become a mark).
function letters(word) {
  return Array.from(strip(word)).filter((ch) => /\p{L}/u.test(ch));
}

function words(name) {
  return strip(name).split(/[^\p{L}]+/u).filter(Boolean).map((w) => Array.from(w));
}

const cap = (ch) => ch.toLocaleUpperCase('en');
const low = (ch) => ch.toLocaleLowerCase('en');

// The two-letter candidates of a name, best first, each a [first, second] pair of single characters.
export function candidates(name) {
  const ws = words(name);
  const flat = ws.flat();
  if (!flat.length) return [];
  const first = flat[0];
  const out = [];
  const push = (second) => {
    if (!second) return;
    const key = low(first) + low(second);
    if (!out.some(([a, b]) => low(a) + low(b) === key)) out.push([first, second]);
  };
  push(flat[1]);                                    // the first two letters
  ws.slice(1).forEach((w) => push(w[0]));           // the first letter plus the initial of each later word
  flat.slice(2).forEach((ch) => push(ch));          // the first letter plus each later letter
  return out;
}

export function firstLetter(name) {
  const flat = words(name).flat();
  return flat.length ? flat[0] : '';
}

export function assignMarks(regions) {
  const out = {};
  const byContinent = new Map();
  regions.forEach((r) => {
    if (!byContinent.has(r.continent)) byContinent.set(r.continent, []);
    byContinent.get(r.continent).push(r);
  });
  byContinent.forEach((list) => {
    const count = new Map();
    list.forEach((r) => {
      const f = firstLetter(r.name);
      const k = f ? low(f) : '';
      count.set(k, (count.get(k) || 0) + 1);
    });
    const taken = new Set();
    // Pass 1: the regions whose first letter is theirs alone keep one letter.
    list.forEach((r) => {
      const f = firstLetter(r.name);
      if (f && count.get(low(f)) === 1) { out[r.id] = cap(f); taken.add(low(f)); }
    });
    // Pass 2: everyone else, in declared order.
    let anon = 0;
    list.forEach((r) => {
      if (out[r.id]) return;
      const f = firstLetter(r.name);
      if (!f) { anon += 1; out[r.id] = '?' + (anon > 1 ? String(anon) : ''); return; }
      const pick = candidates(r.name).find(([a, b]) => !taken.has(low(a) + low(b)));
      if (pick) { out[r.id] = cap(pick[0]) + low(pick[1]); taken.add(low(pick[0]) + low(pick[1])); return; }
      // A one-letter name that collides (nothing to extend with): number it, so the mark is still unique.
      let n = 2;
      while (taken.has(low(f) + n)) n += 1;
      out[r.id] = cap(f) + n;
      taken.add(low(f) + n);
    });
  });
  return out;
}

// "Nova Scotia / Cape Breton, whose land: Mi'kma'ki (unceded)". `whoseLand` is the salutation text ('' when the region
// has none recorded); `contested` and `outside` add the words a sighted visitor reads off the pill and the dashed ring.
export function markLabel(region, whoseLand, { contested = false, outside = false } = {}) {
  const land = whoseLand && String(whoseLand).trim() ? String(whoseLand).trim() : 'not yet recorded here';
  let s = `${region.name}, whose land: ${land}`;
  if (contested) s += ', contested';
  if (outside) s += ', outside your thresholds';
  return s;
}

// Exposed for tests: the letters a name offers.
export const _letters = letters;
