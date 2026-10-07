// lib/salutation.js: "whose land", the one-line form that sits above a region's name on every surface
// (card, drawer, compare, region page, map, OG, arrive.html). Pure, DOM-free, edge-safe.
//
//   salutation(id) -> { text, short, contested }
//
// text       reciprocity[id].territoryShort when the entry is verified and carries no human-review `flag`;
//            otherwise the head of landStanding[id].territory before its first " - " (or spaced dash), or '' when
//            the region has no Land standing entry at all.
// short      text without a trailing parenthesis, for tight places (a map pill): "Galego parish commons (montes
//            veciñais)" -> "Galego parish commons". Never truncated mid-word; equal to text when there is none.
// contested  true only when the entry is verified, unflagged and reciprocity[id].contested exists and carries no
//            `flag`. Where it is true the label reads "Whose land - contested" as real text (salutationLabel).
//
// The label is "Whose land", never "Held by": authority is disputed or overlapping in several regions and a single
// holder would be property language. Where contested is null the text is territoryShort, which names every party and
// carries no authority word (BIO-2), never the head of the territory sentence.
//
// Data injection for tests: salutation(id, { data: { reciprocity, landStanding } }).
//
// WHERE THE DEFAULT DATA COMES FROM (MC-PERF): every card, table row and map pill needs this line at first paint, and the two
// source modules (data/reciprocity.js, data/land-standing.js) are 56 KB brotli between them. So the default path reads
// data/load-slim.js instead: the result of salutationFrom() for every region, precomputed by scripts/gen_load_slim.mjs. The
// full modules load only when the drawer or the compare view opens. tests/core/load-slim.test.mjs fails if the two ever differ.
// The rule itself lives in salutationFrom(), which both this module and the generator call.

import { salutations as SLIM } from '../data/load-slim.js';

export const LABEL = 'Whose land';
export const CONTESTED_SUFFIX = ' - contested';

const isStr = (s) => typeof s === 'string' && s.trim() !== '';

// The head of a territory sentence: everything before the first " - ", " – " or " — " (the Land standing
// entries use the em dash). Trimmed.
export function territoryHead(territory) {
  if (!isStr(territory)) return '';
  const m = /\s[-–—]\s/.exec(territory);
  return (m ? territory.slice(0, m.index) : territory).trim();
}

// The rule, on one region's reciprocity entry and Land standing entry (either may be undefined).
export function salutationFrom(rc, ls) {
  const verified = !!(rc && typeof rc === 'object' && rc.status === 'verified' && !rc.flag);
  let text = '';
  if (verified && isStr(rc.territoryShort)) text = rc.territoryShort.trim();
  else if (ls && isStr(ls.territory)) text = territoryHead(ls.territory);
  const contested = !!(verified && rc.contested && typeof rc.contested === 'object' && !rc.contested.flag);
  const trimmed = text.replace(/\s*\([^)]*\)\s*$/, '').trim();
  return { text, short: trimmed || text, contested };
}

export function salutation(id, opts) {
  const d = opts && opts.data;
  if (d) return salutationFrom((d.reciprocity || {})[id], (d.landStanding || {})[id]);
  const s = SLIM[id];
  return s ? { text: s.text, short: s.short, contested: s.contested } : { text: '', short: '', contested: false };
}

// "Whose land" or "Whose land - contested", as real text.
export function salutationLabel(contested) {
  return contested ? `${LABEL}${CONTESTED_SUFFIX}` : LABEL;
}
