#!/usr/bin/env node
// Copy lint for the bioregioning and reciprocity surfaces (WP BIO-8).
// Encodes the hard bans (copy.md 1.1) and soft rules (copy.md 1.2) as regexes over VISIBLE text.
//
// Usage (run from prototype/):
//   node scripts/lint_bio_copy.mjs                       lint the default targets that exist
//   node scripts/lint_bio_copy.mjs FILE [FILE ...]       lint exactly these files (a missing file is a failure)
//   node scripts/lint_bio_copy.mjs --self-test           plant every ban in a fixture and prove it is caught
//   node scripts/lint_bio_copy.mjs --checklist           print the human reviewer checklist
// Options: --root DIR (site root, default: prototype/), --warnings-fail (soft rules also exit 1),
//          --require-all (default targets that are missing fail instead of being skipped), --quiet.
//
// What is linted:
//   .html            visible text only: scripts, styles, comments, JSON-LD and tags are stripped; alt/title/aria-label/placeholder
//                    values and the description/og/twitter meta text are kept (they surface); href values are checked for
//                    mailto:, tel: and personal profile links.
//   .txt             as is.
//   data/bioregions.js, data/reciprocity.js   every string value in the exported objects (urls, ids, dates and enum keys skipped).
//   other .js        string and template literals that read as prose (drawer text blocks, lib/bio.js, ...); class names, selectors and code are ignored.
//   .json            every string value.
//
// Exit: 0 when no hard failure (and, with --warnings-fail, no warning); 1 otherwise; 2 on usage or load errors.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(HERE, '..');

// ---------------------------------------------------------------------------------------------------------------
// Rules. level 'hard' fails the lint; level 'soft' warns (reviewer decides).
// plants: strings that MUST be flagged by this rule (the self-test plants each one in a sentence).
// exempt(ctx): optional; return true when the match is a permitted use. ctx = { text, index, match, sentence, before }.
// ---------------------------------------------------------------------------------------------------------------
const quotedAround = (ctx) => /["“‘']\s*$/.test(ctx.before.slice(-3)) && /^\s*["”’']/.test(ctx.text.slice(ctx.index + ctx.match.length, ctx.index + ctx.match.length + 3));

// A sentence that REFUSES scoring ("None of this is scored, ranked or used as a filter") is the honest disclaimer, not a grade.
const negatedBefore = (ctx) => /\b(?:not|never|none|no|nor|neither|without|nothing|refuses?|refusing|avoids?|avoiding)\b[^.\n]{0,45}$/i.test(ctx.before.slice(-60));

export const RULES = [
  // 1.1 Framing
  { id: 'framing-candidate-region', level: 'hard', re: /\bcandidate\s+regions?\b/gi, plants: ['candidate region', 'candidate regions'], msg: 'framing: not a "candidate region" tool' },
  { id: 'framing-siting', level: 'hard', re: /\bsiting\b/gi, plants: ['siting'], msg: 'framing: "siting"' },
  { id: 'framing-site-shopping', level: 'hard', re: /\bsite[\s-]+shopping\b/gi, plants: ['site shopping', 'site-shopping'], msg: 'framing: "site shopping"' },
  { id: 'framing-shopping-list', level: 'hard', re: /\bshopping\s+lists?\b/gi, plants: ['shopping list'], msg: 'framing: "shopping list"' },
  { id: 'framing-find-land', level: 'hard', re: /\bfind(?:ing)?\s+(?:the\s+|your\s+|a\s+)?(?:right\s+|perfect\s+)?land\b/gi, plants: ['find land', 'find the land', 'find your land', 'find the right land'], msg: 'framing: "find land"' },
  { id: 'framing-land-grab', level: 'hard', re: /\bland[\s-]+grabs?\b/gi, plants: ['land grab'], exempt: quotedAround, msg: 'framing: "land grab" (allowed only inside quotation marks in the ethics argument)' },
  { id: 'framing-apocalypse', level: 'hard', re: /\bapocalyp(?:se|tic)\b/gi, plants: ['apocalypse', 'apocalyptic'], msg: 'framing: "apocalypse"' },
  { id: 'framing-collapse-proof', level: 'hard', re: /\bcollapse[\s-]+proof\b/gi, plants: ['collapse-proof', 'collapse proof'], msg: 'framing: "collapse-proof"' },
  { id: 'framing-bug-out', level: 'hard', re: /\bbug[\s-]+out\b/gi, plants: ['bug-out', 'bug out'], msg: 'framing: "bug-out"' },
  {
    id: 'framing-cheap-land', level: 'hard', re: /\bcheap\s+land\b/gi, plants: ['cheap land'],
    // The single named NE Missouri / SE Iowa passage names it as the displacement route, never offers it.
    exempt: (ctx) => /displace/i.test(ctx.sentence) && /\bnot\b/i.test(ctx.sentence),
    msg: 'framing: "cheap land" (allowed only in a sentence that names it as the displacement route and says not)',
  },
  { id: 'authorship-founder-claim', level: 'hard', re: /\b(?:founded|originated|created|started)\s+by\s+Gustaf\b|\bGustaf\b[^.\n]{0,60}\b(?:founded|originated|founder|originator)\b|\bfounder\s+(?:is|was)\s+Gustaf\b/g, plants: ['founded by Gustaf', 'originated by Gustaf', 'Gustaf is the founder'], msg: 'authorship: never imply Gustaf founded or originated the project (Askja is the originator)' },

  // 1.1 Ranking and grading
  { id: 'rank-best', level: 'hard', re: /\bbest\b/gi, plants: ['best'], msg: 'ranking word: best' },
  { id: 'rank-top', level: 'hard', re: /\btop\b/gi, plants: ['top'], msg: 'ranking word: top' },
  { id: 'rank-ideal', level: 'hard', re: /\bideal\b/gi, plants: ['ideal'], msg: 'ranking word: ideal' },
  { id: 'rank-perfect', level: 'hard', re: /\bperfect\b/gi, plants: ['perfect'], msg: 'ranking word: perfect' },
  { id: 'rank-winner', level: 'hard', re: /\bwinners?\b/gi, plants: ['winner', 'winners'], msg: 'ranking word: winner' },
  { id: 'rank-safest', level: 'hard', re: /\bsafest\b/gi, plants: ['safest'], msg: 'ranking word: safest' },
  { id: 'rank-worst', level: 'hard', re: /\bworst\b/gi, plants: ['worst'], msg: 'ranking word: worst' },
  { id: 'rank-the-most', level: 'hard', re: /\bthe\s+most\s+[\p{L}]+/giu, plants: ['the most resilient', 'the most'], msg: 'ranking phrase: "the most ..."' },
  { id: 'rank-the-least', level: 'hard', re: /\bthe\s+least\s+[\p{L}]+/giu, plants: ['the least exposed', 'the least'], msg: 'ranking phrase: "the least ..."' },
  { id: 'rank-strongest', level: 'hard', re: /\bstrongest\b/gi, plants: ['strongest'], msg: 'ranking word: strongest' },
  { id: 'rank-densest', level: 'hard', re: /\bdensest\b/gi, plants: ['densest'], msg: 'ranking word: densest' },
  { id: 'rank-leading', level: 'hard', re: /\bleading\b/gi, plants: ['leading'], msg: 'ranking word: leading' },
  { id: 'rank-premier', level: 'hard', re: /\bpremier\b/gi, plants: ['premier'], msg: 'ranking word: premier' },
  { id: 'rank-stars', level: 'hard', re: /\bstars?\b/gi, plants: ['star', 'stars'], exempt: negatedBefore, msg: 'grading: stars' },
  { id: 'rank-medals', level: 'hard', re: /\bmedal(?:s|ist|lists)?\b/gi, plants: ['medal', 'medals'], exempt: negatedBefore, msg: 'grading: medals' },
  { id: 'rank-rank', level: 'hard', re: /\brank(?:s|ed|ing|ings)?\b/gi, plants: ['rank', 'ranked', 'ranking', 'rankings'], exempt: negatedBefore, msg: 'grading: rank / ranking' },
  { id: 'rank-rating', level: 'hard', re: /\bratings?\b/gi, plants: ['rating', 'ratings'], exempt: negatedBefore, msg: 'grading: rating' },
  {
    id: 'rank-score', level: 'hard', re: /\bscor(?:e|es|ed|ing|eboard)\b/gi, plants: ['score', 'scores', 'scored', 'scoring'],
    // The native 0-1 water-stress unit keeps its unit label.
    exempt: (ctx) => /\b0\s*(?:[-–—]|to)\s*1\b/.test(ctx.sentence) || negatedBefore(ctx),
    msg: 'grading: "score" used as a product (only the native 0-1 water-stress unit label is allowed)',
  },
  { id: 'rank-totals', level: 'hard', re: /\b(?:composite|weighted|weighting|total\s+score|total\s+points|overall\s+(?:score|rating)|combined\s+score|sum\s+of\s+(?:the\s+)?criteria|summed)\b/gi, plants: ['composite', 'weighted', 'weighting', 'total score', 'overall score', 'combined score', 'sum of criteria', 'summed'], exempt: negatedBefore, msg: 'grading: totals or composites across criteria' },

  // 1.1 Marketing
  { id: 'marketing-unlock', level: 'hard', re: /\bunlock(?:s|ed|ing)?\b/gi, plants: ['unlock', 'unlocking'], msg: 'marketing word: unlock' },
  { id: 'marketing-empower', level: 'hard', re: /\bempower(?:s|ed|ing|ment)?\b/gi, plants: ['empower', 'empowering', 'empowerment'], msg: 'marketing word: empower' },
  { id: 'marketing-seamless', level: 'hard', re: /\bseamless(?:ly)?\b/gi, plants: ['seamless', 'seamlessly'], msg: 'marketing word: seamless' },
  { id: 'marketing-game-changing', level: 'hard', re: /\bgame[\s-]+chang(?:ing|er|ers)\b/gi, plants: ['game-changing', 'game changer'], msg: 'marketing word: game-changing' },
  { id: 'marketing-revolutionary', level: 'hard', re: /\brevolutionary\b/gi, plants: ['revolutionary'], msg: 'marketing word: revolutionary' },
  { id: 'marketing-journey', level: 'hard', re: /\bjourney(?:s|ed|ing)?\b/gi, plants: ['journey', 'reciprocity journey', 'journeys'], msg: 'marketing word: journey (say "arrive" or "arrival"; "reciprocity journey" is an internal name and must not leak)' },
  { id: 'marketing-solution', level: 'hard', re: /\bsolutions?\b/gi, plants: ['solution', 'solutions'], msg: 'marketing word: solution' },
  { id: 'marketing-platform', level: 'hard', re: /\b(?:this|our|the|its|a\s+new)\s+(?:[\p{L}-]+\s+)?platforms?\b|\b(?:land|bioregion\w*|reciprocity|bioregioning)\s+platforms?\b/giu, plants: ['this platform', 'our platform', 'the platform', 'the reciprocity platform', 'land platform'], msg: 'marketing word: platform (the site is a tool, not a platform)' },
  { id: 'soft-platform', level: 'soft', re: /\bplatforms?\b/gi, plants: ['platform'], msg: '"platform": hard-banned for the site itself; fine only when describing another body, as that body describes itself' },
  { id: 'marketing-community-of-practice', level: 'hard', re: /\bcommunit(?:y|ies)\s+of\s+practice\b/gi, plants: ['community of practice', 'communities of practice'], msg: 'marketing phrase: community of practice' },

  // 1.1 Voice
  {
    id: 'voice-first-person', level: 'hard', re: /\bI\b|\b(?:[Mm]e|[Mm]y|[Mm]yself|[Mm]ine)\b/g, plants: ['I', 'me', 'my', 'myself', 'mine'],
    // Roman numerals ("Part I", "Annex I") are not the pronoun.
    exempt: (ctx) => ctx.match === 'I' && (/\b(?:Part|Annex|Phase|Stage|Class|Category|Zone|Appendix|Schedule|Section|Article|Title|Group|Level|Type|Tier|Round|Wave|Book|Volume|Chapter|World War)\s$/.test(ctx.before.slice(-14))),
    msg: 'voice: first-person singular (no I, me, my)',
  },
  { id: 'voice-exclamation', level: 'hard', re: /!/g, plants: ['wow!'], msg: 'voice: exclamation mark' },
  { id: 'voice-emoji', level: 'hard', re: /[\u{1F000}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{2712}\u{2714}-\u{2716}\u{2718}-\u{27BF}\u{FE0F}]/gu, plants: ['\u{1F331}', '\u{2705}', '\u{2728}'], msg: 'voice: emoji' },

  // 1.1 Personal data (organisations only; a link is a pointer, never an introduction)
  { id: 'personal-email', level: 'hard', re: /[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, plants: ['name@example.org', 'first.last+x@mail.example.com'], msg: 'personal data: email address' },
  { id: 'personal-phone', level: 'hard', re: /(?<![\w/.-])(?:\+|00)\d[\d\s().-]{7,}\d|\b\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b/g, plants: ['+44 20 7946 0958', '+1 (555) 010-9999', '555-123-4567'], msg: 'personal data: phone number' },
  { id: 'personal-handle', level: 'hard', re: /(?<![\w.@/])@[A-Za-z0-9_]{2,}/g, plants: ['@someone', '@some_one'], msg: 'personal data: social handle' },
  { id: 'personal-profile-link', level: 'hard', re: /\b(?:instagram\.com|twitter\.com|x\.com|facebook\.com|tiktok\.com|threads\.net|substack\.com\/@|linkedin\.com\/in)\/[@\w.%-]+|mailto:|tel:/gi, plants: ['instagram.com/someone', 'linkedin.com/in/someone', 'x.com/someone', 'mailto:a@b.org', 'tel:+441234567890'], msg: 'personal data: personal profile, mailto or tel link' },
  { id: 'personal-contact-x', level: 'hard', re: /\b[Cc]ontact[ \t]+(?!details\b|route\b|page\b|form\b|information\b|us\b)(?:the[ \t]+)?\p{Lu}/gu, plants: ['contact Maria Lopez', 'Contact the Land Trust'], msg: 'personal data: never "contact X"; a link is a pointer, not an introduction' },
  { id: 'personal-introduce', level: 'hard', re: /\bintroduce\s+yourself\s+to\b/gi, plants: ['introduce yourself to the elders'], msg: 'personal data: never "introduce yourself to X"' },
  { id: 'personal-ask-by-name', level: 'hard', re: /\bask\s+for\b[^.\n]{0,40}\bby\s+name\b/gi, plants: ['ask for the coordinator by name'], msg: 'personal data: never "ask for Y by name"' },

  // 1.1 Glyphs that can reach the OG card
  { id: 'glyph-le-ge', level: 'hard', re: /[≤≥]/g, plants: ['≤', '≥'], msg: 'glyph: U+2264 / U+2265 can reach the OG card (font subset)' },

  // Review revision 2026-10-05 (D11): nobody named on the site has reviewed anything.
  {
    id: 'claim-reviewed-by', level: 'hard',
    re: /\b(?:verified|approved|endorsed|reviewed)\s+by\s+(?:(?:the|a|an|each|any|every|all|their|its|our|these|those)\s+)?(?:[\p{L}'’-]+\s+){0,4}?(?:nations?|communit(?:y|ies)|peoples?|tribes?)\b/giu,
    plants: ['verified by the nation', 'approved by the community', 'endorsed by the Cayuga people', 'reviewed by each tribe', 'reviewed by the host community'],
    // A plain negation is the honest disclaimer ("has not been reviewed by any nation").
    exempt: (ctx) => /\b(?:not|never|nor|no|neither)\b[^.\n]{0,30}$/i.test(ctx.before.slice(-45)),
    msg: 'claim: "verified/approved/endorsed/reviewed by" a nation, community, people or tribe (nobody named here has reviewed anything)',
  },

  // 1.2 Soft rules
  { id: 'soft-honest', level: 'soft', re: /\bhonest(?:ly)?\b/gi, plants: [], perUnitMax: 1, msg: '"honest/honestly": at most once per page' },
  { id: 'soft-welcome', level: 'soft', re: /\bwelcom(?:e|es|ed|ing)\b/gi, plants: ['welcome'], msg: '"welcome": only where a sourced welcome programme exists; never "the community welcomes you"' },
  { id: 'soft-settler', level: 'soft', re: /\b(?:settlers?|coloni[sz](?:e|es|ed|ing|ation))\b/gi, plants: ['settler', 'colonise'], msg: '"settler/colonise": only inside the reciprocity and ethics argument or a direct quotation; never as a label for a user' },
  { id: 'soft-tribe', level: 'soft', re: /\b(?:the|a|this|that)\s+tribes?\b/gi, plants: ['the tribe'], msg: '"the tribe": use the people\'s own designation as they write it on their own site' },
  { id: 'soft-ancestral', level: 'soft', re: /\bancestral\b/gi, plants: ['ancestral'], msg: '"ancestral": attribute it ("the Nation says its ancestral homeland ...") rather than asserting' },
  { id: 'soft-unceded', level: 'soft', re: /\bunceded\b/gi, plants: ['unceded'], msg: '"unceded": kept only where already decided in land-standing.js; never new without a source on file' },
  { id: 'soft-extinct', level: 'soft', re: /\bextinct\b/gi, plants: ['extinct'], msg: '"extinct": only in the attributed Sinixt sentence with the 2021 recognition in the same sentence' },
  { id: 'soft-empty-village', level: 'soft', re: /\b(?:empty|abandoned|opportunit(?:y|ies)|up\s+for\s+grabs)\b/gi, plants: ['empty', 'abandoned', 'opportunity', 'up for grabs'], msg: 'a depopulating village is a rooted community to partner with: never empty / abandoned / opportunity / up for grabs' },
  { id: 'soft-us-spelling', level: 'soft', re: /\b(?:neighbors?|neighboring|organizations?|organized|labor|behavior|honor|favor|colors?|centers?)\b/gi, plants: ['neighbor', 'organization', 'labor'], msg: 'spelling: British in new long-form prose (neighbour, organisation, labour); product microcopy and "license" stay as they are' },
  { id: 'soft-small-numeral', level: 'soft', re: /(?<![\d.,/:-])\b[1-9]\s+(?:stages?|steps?|ways|things|questions|reasons|parts|sections|conversations|years|months|weeks|people|households|neighbours|neighbors|communities|nations|rules|forms)\b/gi, plants: ['4 stages', '3 ways'], msg: 'numerals: spell out numbers under ten in prose ("four stages"); figures for data' },
  { id: 'soft-us-date', level: 'soft', re: /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+\d{1,2}(?:st|nd|rd|th)?,\s*\d{4}\b/g, plants: ['October 4, 2026'], msg: 'dates: "checked 4 October 2026" in prose, 2026-10-04 in data and source lines' },
  { id: 'soft-glossary', level: 'soft', re: /\b(?:relocat(?:e|es|ed|ing|ion)|locals|natives|vetting|screening|networking|red[\s-]+listed|within\s+the\s+region)\b/gi, plants: ['relocate', 'locals', 'vetting', 'networking', 'within the region'], msg: 'glossary: say arrive / host community / first conversations / not there / "around the reference point"' },
  { id: 'soft-nation-claims', level: 'soft', re: /\bthe\s+(?:[\p{Lu}][\p{L}'’-]+\s+){1,3}(?:Nation|Tribe|Council)\s+claims?\b/gu, plants: ['the Cayuga Nation claims'], msg: 'glossary: "the Nation says", not "claims" (unless quoting a court)' },
];

// ---------------------------------------------------------------------------------------------------------------
// Core engine
// ---------------------------------------------------------------------------------------------------------------
function sentenceAt(text, index, len) {
  let s = index;
  while (s > 0 && !/[.!?\n]/.test(text[s - 1])) s--;
  let e = index + len;
  while (e < text.length && !/[.!?\n]/.test(text[e])) e++;
  return text.slice(s, Math.min(text.length, e + 1));
}
function excerpt(text, index, len) {
  const a = Math.max(0, index - 28), b = Math.min(text.length, index + len + 28);
  return (a > 0 ? '...' : '') + text.slice(a, b).replace(/\s+/g, ' ') + (b < text.length ? '...' : '');
}

// lintText(text, { only?: ruleId[] }) -> { fails: [{rule,match,excerpt,msg}], warns: [...] }
export function lintText(text, opts = {}) {
  const fails = [], warns = [];
  if (typeof text !== 'string' || !text.trim()) return { fails, warns };
  for (const rule of RULES) {
    if (opts.only && !opts.only.includes(rule.id)) continue;
    const re = new RegExp(rule.re.source, rule.re.flags.includes('g') ? rule.re.flags : rule.re.flags + 'g');
    let m, hits = 0;
    while ((m = re.exec(text))) {
      if (m[0] === '') { re.lastIndex++; continue; }
      const ctx = { text, index: m.index, match: m[0], before: text.slice(Math.max(0, m.index - 60), m.index), sentence: sentenceAt(text, m.index, m[0].length) };
      if (rule.exempt && rule.exempt(ctx)) continue;
      hits++;
      if (rule.perUnitMax) { if (hits === rule.perUnitMax + 1) warns.push({ rule: rule.id, match: m[0], excerpt: excerpt(text, m.index, m[0].length), msg: rule.msg }); continue; }
      (rule.level === 'hard' ? fails : warns).push({ rule: rule.id, match: m[0], excerpt: excerpt(text, m.index, m[0].length), msg: rule.msg });
    }
  }
  return { fails, warns };
}

// ---------------------------------------------------------------------------------------------------------------
// Visible-text extraction
// ---------------------------------------------------------------------------------------------------------------
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', copy: '©', shy: '', laquo: '«', raquo: '»', times: '×', le: '≤', ge: '≥', lsaquo: '‹', rsaquo: '›', bull: '•', rarr: '→', larr: '←', deg: '°' };
export function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, g) => {
    if (g[0] === '#') {
      const cp = g[1].toLowerCase() === 'x' ? parseInt(g.slice(2), 16) : parseInt(g.slice(1), 10);
      try { return String.fromCodePoint(cp); } catch { return all; }
    }
    return Object.prototype.hasOwnProperty.call(NAMED, g.toLowerCase()) ? NAMED[g.toLowerCase()] : all;
  });
}
const INLINE_TAGS = 'a|span|em|strong|b|i|u|code|abbr|cite|small|sub|sup|mark|time|q|kbd|var|bdi|bdo|wbr|data|dfn|s|del|ins';

// htmlToText(html) -> { text, hrefs }  (text = what a reader can see or what surfaces in previews)
export function htmlToText(html) {
  let h = String(html).replace(/<!--[\s\S]*?-->/g, ' ');
  h = h.replace(/<script\b[\s\S]*?<\/script\s*>/gi, ' ').replace(/<style\b[\s\S]*?<\/style\s*>/gi, ' ');
  h = h.replace(/<template\b[\s\S]*?<\/template\s*>/gi, ' ');
  h = h.replace(/<svg\b[\s\S]*?<\/svg\s*>/gi, (svg) => (svg.match(/<title\b[^>]*>([\s\S]*?)<\/title>/gi) || []).map((t) => t.replace(/<[^>]+>/g, '')).join('\n'));
  const extras = [], hrefs = [];
  h.replace(/<meta\b[^>]*>/gi, (tag) => {
    const key = (tag.match(/\b(?:name|property)\s*=\s*["']([^"']+)["']/i) || [])[1] || '';
    const content = (tag.match(/\bcontent\s*=\s*"([^"]*)"|\bcontent\s*=\s*'([^']*)'/i) || []);
    if (/^(?:description|og:title|og:description|og:image:alt|twitter:title|twitter:description|twitter:image:alt)$/i.test(key) && (content[1] || content[2])) extras.push(content[1] || content[2]);
    return tag;
  });
  h.replace(/\b(?:alt|title|aria-label|placeholder)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (all, a, b) => { extras.push(a || b || ''); return all; });
  h.replace(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)')/gi, (all, a, b) => { hrefs.push(a || b || ''); return all; });
  h = h.replace(new RegExp(`<\\/?(?:${INLINE_TAGS})\\b[^>]*>`, 'gi'), '');
  h = h.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '\n');
  let text = decodeEntities(h) + '\n' + extras.map(decodeEntities).join('\n');
  text = text.replace(/[ \t\r\f\v ]+/g, ' ').replace(/ *\n[ \n]*/g, '\n').trim();
  return { text, hrefs: hrefs.map(decodeEntities) };
}

// looksLikeProse: guards against linting class names, selectors and code tokens inside .js files.
export function looksLikeProse(s) {
  const toks = s.trim().split(/\s+/);
  if (toks.length < 3) return false;
  return toks.filter((t) => /^[A-Za-zÀ-ɏ][a-zà-ɏ'’]{2,}[.,;:!?)]?$/.test(t)).length >= 2;
}

// jsLiterals(src) -> [string]: string and template literals outside comments (a small scanner, not a parser).
export function jsLiterals(src) {
  const out = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
    if (c === '"' || c === "'" || c === '`') {
      const q = c; let j = i + 1, buf = '';
      while (j < n && src[j] !== q) {
        if (src[j] === '\\') { buf += src[j + 1] === 'n' ? '\n' : src[j + 1]; j += 2; continue; }
        if (q !== '`' && src[j] === '\n') break;
        if (q === '`' && src[j] === '$' && src[j + 1] === '{') { let depth = 1; j += 2; while (j < n && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; } buf += ' '; continue; }
        buf += src[j]; j++;
      }
      out.push(buf); i = j + 1; continue;
    }
    i++;
  }
  return out;
}

// loadExports(file): evaluate an ES data module that has no imports and return its exports (no Node module warnings).
export function loadExports(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (/^\s*import\s/m.test(src)) throw new Error(`${file}: data modules must not import (cannot evaluate)`);
  const names = [];
  const body = src.replace(/^export\s+(?:const|let|var|function|class)\s+([A-Za-z_$][\w$]*)/gm, (all, nm) => { names.push(nm); return all.replace(/^export\s+/, ''); });
  const fn = new Function(`${body}\nreturn { ${names.join(', ')} };`);
  return fn();
}

const SKIP_KEYS = new Set(['url', 'licenseUrl', 'download', 'id', 'kind', 'via', 'field', 'status', 'checked', 'reviewed', 'license', 'accent', 'continent']);
export function dataStrings(obj, base = '') {
  const out = [];
  (function walk(v, p, key) {
    if (typeof v === 'string') {
      if (SKIP_KEYS.has(key)) return;
      if (/^https?:\/\/\S+$/i.test(v) || /^\d{4}-\d{2}-\d{2}$/.test(v) || !/\p{L}/u.test(v)) return;
      out.push({ path: p, text: v });
    } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${p}[${i}]`, key));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, p ? `${p}.${k}` : k, k);
  })(obj, base, '');
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// File linting
// ---------------------------------------------------------------------------------------------------------------
const DATA_MODULES = /(?:^|[\\/])data[\\/](?:bioregions|reciprocity)\.js$/;

// lintUnits(file) -> [{ label, text }]  (each unit gets its own per-page soft-rule counts)
export function unitsForFile(file) {
  const ext = path.extname(file).toLowerCase();
  const src = fs.readFileSync(file, 'utf8');
  if (ext === '.html' || ext === '.htm') {
    const { text, hrefs } = htmlToText(src);
    const hrefText = hrefs.filter((x) => /^(?:mailto:|tel:)|(?:instagram|twitter|x|facebook|tiktok|threads)\.(?:com|net)\/|linkedin\.com\/in\//i.test(x)).join('\n');
    return [{ label: path.basename(file), text: text + (hrefText ? '\n' + hrefText : '') }];
  }
  if (ext === '.txt' || ext === '.md') return [{ label: path.basename(file), text: src }];
  if (ext === '.json') return [{ label: path.basename(file), text: dataStrings(JSON.parse(src)).map((s) => s.text).join('\n') }];
  if (ext === '.js' || ext === '.mjs') {
    if (DATA_MODULES.test(file)) {
      const mod = loadExports(file);
      return dataStrings(mod).map((s) => ({ label: `${path.basename(file)}:${s.path}`, text: s.text, perString: true }));
    }
    const lits = jsLiterals(src).map((s) => /<[a-z][\s\S]*>/i.test(s) ? htmlToText(s).text : s).filter(looksLikeProse);
    return [{ label: path.basename(file), text: lits.join('\n') }];
  }
  throw new Error(`${file}: unsupported file type for the copy lint`);
}

export function lintFile(file) {
  const units = unitsForFile(file);
  const fails = [], warns = [];
  // Data modules: hard rules per string; per-page soft rules (honest) over the whole module.
  const perString = units.filter((u) => u.perString);
  for (const u of perString) {
    const r = lintText(u.text, { only: RULES.filter((x) => !x.perUnitMax).map((x) => x.id) });
    r.fails.forEach((f) => fails.push({ ...f, where: u.label }));
    r.warns.forEach((f) => warns.push({ ...f, where: u.label }));
  }
  if (perString.length) {
    const r = lintText(perString.map((u) => u.text).join('\n'), { only: RULES.filter((x) => x.perUnitMax).map((x) => x.id) });
    r.warns.forEach((f) => warns.push({ ...f, where: path.basename(file) }));
  }
  for (const u of units.filter((x) => !x.perString)) {
    const r = lintText(u.text);
    r.fails.forEach((f) => fails.push({ ...f, where: u.label }));
    r.warns.forEach((f) => warns.push({ ...f, where: u.label }));
  }
  return { fails, warns, strings: units.length };
}

// The last four are the drawer and region-page text blocks (BIO-4) and the shared render modules that hold their strings.
export const DEFAULT_TARGETS = ['data/bioregions.js', 'data/reciprocity.js', 'arrive.html', 'host.html', 'terms-of-arrival.html', 'terms-of-arrival.txt', 'src/ui/drawer/blocks/land-standing.js', 'src/ui/drawer/blocks/place.js', 'lib/bio.js', 'lib/salutation.js'];

export const CHECKLIST = `Human reviewer checklist for bioregioning and reciprocity copy (the lint cannot judge these)
 1. Whose land comes first: every region page opens with the people already there, in their own words where published; no legal conclusion is written for them.
 2. "The Nation says" for any own-account sentence; no "claims" unless quoting a court; "ancestral" always attributed.
 3. Where authority is disputed or overlapping, the page names both and takes no side; where no source on file says so, nothing is said.
 4. Nothing implies a nation, community or the working group verified, approved, endorsed or reviewed an entry. The data flag 'verified' is internal; public wording is "checked against opened public sources on <date>".
 5. First conversations are organisations and protocols only: no person, no email, no phone, no handle, no "contact X", no "ask for Y by name".
 6. Nothing is scored, ranked, weighted, summed or filterable: no number stands in for a people's standing; lists of people, bodies and places carry no meaningful order.
 7. "Not there" is a plain statement of arrival forms, never a place verdict and never a price comparison; no new claim beyond the shipped Land standing sentences.
 8. Depopulating villages are rooted communities to partner with: never empty, abandoned, opportunity or up for grabs.
 9. Framing: arrive / arrival, host community, first conversations, around the reference point; never find land, candidate region, site shopping, apocalypse.
10. Authorship: Askja credited as originator plus the working group; nothing implies Gustaf founded or originated the project.
11. Register: British spelling in long-form prose, no first-person singular, no exclamation marks, no emoji, "honest" at most once per page, "welcome" only for a sourced programme.
12. Every place-specific claim traces to a page opened on the stated date; dates read "checked 4 October 2026" in prose and 2026-10-04 in data.
13. Soft-rule warnings were each read and either fixed or consciously kept (write the reason in the WP notes).`;

// ---------------------------------------------------------------------------------------------------------------
// CLI
// ---------------------------------------------------------------------------------------------------------------
function runCli(argv) {
  const args = argv.slice(2);
  if (args.includes('--checklist')) { console.log(CHECKLIST); return 0; }
  if (args.includes('--self-test')) return selfTest();
  const flag = (n) => args.includes(n);
  let root = DEFAULT_ROOT;
  const files = [];
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--root') root = path.resolve(args[++i]);
    else if (a.startsWith('--')) { if (!['--warnings-fail', '--require-all', '--quiet'].includes(a)) { console.error(`unknown option ${a}`); return 2; } }
    else files.push(a);
  }
  let targets;
  const explicit = files.length > 0;
  if (explicit) targets = files.map((f) => ({ file: path.isAbsolute(f) ? f : path.resolve(process.cwd(), f), required: true }));
  else targets = DEFAULT_TARGETS.map((f) => ({ file: path.resolve(root, f), required: flag('--require-all') }));
  let hardCount = 0, warnCount = 0, linted = 0;
  for (const t of targets) {
    const rel = path.relative(process.cwd(), t.file) || t.file;
    if (!fs.existsSync(t.file)) {
      if (t.required) { console.log(`FAIL ${rel}: file not found`); hardCount++; } else if (!flag('--quiet')) console.log(`skip ${rel}: not present`);
      continue;
    }
    let r;
    try { r = lintFile(t.file); } catch (e) { console.error(`ERROR ${rel}: ${e.message}`); return 2; }
    linted++;
    r.fails.forEach((f) => console.log(`FAIL ${rel} [${f.rule}] ${f.where !== path.basename(t.file) ? f.where + ' ' : ''}"${f.match}" in: ${f.excerpt}  -- ${f.msg}`));
    if (!flag('--quiet')) r.warns.forEach((f) => console.log(`warn ${rel} [${f.rule}] ${f.where !== path.basename(t.file) ? f.where + ' ' : ''}"${f.match}" in: ${f.excerpt}  -- ${f.msg}`));
    hardCount += r.fails.length; warnCount += r.warns.length;
  }
  console.log(`lint_bio_copy: files linted ${linted}; hard failures ${hardCount}; warnings ${warnCount}`);
  if (!explicit && linted === 0) console.log('note: none of the default targets exist yet (nothing to lint).');
  return hardCount || (flag('--warnings-fail') && warnCount) ? 1 : 0;
}

// ---------------------------------------------------------------------------------------------------------------
// Self-test: every banned word planted in a fixture must be caught; clean copy must pass; extraction must be right.
// ---------------------------------------------------------------------------------------------------------------
function selfTest() {
  let bad = 0, checks = 0;
  const ok = (cond, label) => { checks++; if (!cond) { bad++; console.log(`SELF-TEST FAIL: ${label}`); } };

  // 1. Every plant for every rule is flagged by that rule, in a sentence of otherwise clean words.
  let planted = 0;
  for (const rule of RULES) {
    for (const plant of rule.plants) {
      planted++;
      const sample = `A short line of plain words about arrival ${plant} and more plain words after it.`;
      const r = lintText(sample);
      const hit = (rule.level === 'hard' ? r.fails : r.warns).some((f) => f.rule === rule.id);
      ok(hit, `rule ${rule.id} did not flag planted "${plant}"`);
    }
    ok(rule.level !== 'hard' || rule.plants.length > 0, `hard rule ${rule.id} has no planted fixture`);
  }
  // 'honest' more than once per page warns; once does not.
  ok(lintText('It is honest. It is also honestly said.').warns.some((f) => f.rule === 'soft-honest'), 'honest twice must warn');
  ok(!lintText('It is honest and plain.').warns.some((f) => f.rule === 'soft-honest'), 'honest once must not warn');

  // 2. A fixture file with one planted ban per line: every ban line is caught, in html, txt and data-module form.
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lintbio-'));
  try {
    const hardPlants = RULES.filter((r) => r.level === 'hard').flatMap((r) => r.plants.map((p) => ({ id: r.id, p })));
    const html = `<!doctype html><html><head><title>Fixture</title>
<meta name="description" content="A plain description with best in it.">
<script type="application/ld+json">{"description":"top best ideal winner journey"}</script>
<script>var s = "best top empower"; // winner</script><style>.best{content:"top"}</style></head>
<body><!-- best top ideal --><h1>Arrival</h1><p>Plain words only here.</p>
${hardPlants.map((x) => `<p>Line ${x.id} words ${x.p} more words.</p>`).join('\n')}
<img src="x.png" alt="a perfect view"><a href="mailto:a@b.org">write</a></body></html>`;
    const hp = path.join(tmp, 'fixture.html');
    fs.writeFileSync(hp, html);
    const hr = lintFile(hp);
    for (const x of hardPlants) ok(hr.fails.some((f) => f.rule === x.id), `html fixture: ${x.id} not flagged for "${x.p}"`);
    // script, style, comment and JSON-LD text must NOT be linted: lint a page that carries bans only there.
    const hidden = `<!doctype html><html><head><title>Plain page</title><script type="application/ld+json">{"name":"best top ideal journey winner"}</script><style>.top{color:red}</style></head><body><!-- best --><p>Plain words about arrival and first conversations.</p><script>var x="empower seamless";</script></body></html>`;
    const hp2 = path.join(tmp, 'hidden.html'); fs.writeFileSync(hp2, hidden);
    ok(lintFile(hp2).fails.length === 0, 'bans inside script, style, comments and JSON-LD must not be linted');
    const alt = path.join(tmp, 'alt.html'); fs.writeFileSync(alt, '<html><body><img alt="the best place" src="x"><p>Plain words only.</p></body></html>');
    ok(lintFile(alt).fails.some((f) => f.rule === 'rank-best'), 'alt text must be linted');
    const meta = path.join(tmp, 'meta.html'); fs.writeFileSync(meta, '<html><head><meta property="og:description" content="Find land that suits you"></head><body><p>Plain words only.</p></body></html>');
    ok(lintFile(meta).fails.some((f) => f.rule === 'framing-find-land'), 'meta description must be linted');

    const txt = path.join(tmp, 'fixture.txt');
    fs.writeFileSync(txt, hardPlants.map((x) => `Line words ${x.p} more words.`).join('\n'));
    const tr = lintFile(txt);
    for (const x of hardPlants) ok(tr.fails.some((f) => f.rule === x.id), `txt fixture: ${x.id} not flagged for "${x.p}"`);

    // data module fixture
    const dm = path.join(tmp, 'data'); fs.mkdirSync(dm);
    const modSrc = `export const reciprocity = {\n  alpha: { territoryShort: "Plain words about the place", firstConversations: [{ name: "Body", kind: "host", url: "https://example.org/best", what: "A top body for arrival.", checked: "2026-10-04" }] },\n  beta: { notThere: { forms: ["Arriving to find land"], basis: [{ label: "x", url: "https://example.org/a" }] } }\n};\nexport const kindLabels = { host: "Host" };\n`;
    fs.writeFileSync(path.join(dm, 'reciprocity.js'), modSrc);
    const dr = lintFile(path.join(dm, 'reciprocity.js'));
    ok(dr.fails.some((f) => f.rule === 'rank-top' && /alpha\.firstConversations\[0\]\.what/.test(f.where)), 'data module: banned word in nested string must be flagged with its path');
    ok(dr.fails.some((f) => f.rule === 'framing-find-land'), 'data module: find land flagged');
    ok(!dr.fails.some((f) => /example\.org/.test(f.excerpt)), 'data module: url values must not be linted');

    // JS literal fixture (drawer text blocks): code comments and class lists are ignored, prose is linted.
    const js = path.join(tmp, 'drawer.js');
    fs.writeFileSync(js, `// the best comment\nconst cls = 'ls-top ls-row';\nconst a = 'Plain words about first conversations here.';\nconst b = \`<p class="top">The best place to arrive is here</p>\`;\n`);
    const jr = lintFile(js);
    ok(jr.fails.length === 1 && jr.fails[0].rule === 'rank-best', 'js literals: only the prose string with "best" is flagged');

    // 3. Clean copy passes (all permitted constructs included).
    const clean = [
      'Every region page opens with whose land it is, in the words of the people where they have published them.',
      'The "land grab" idiom is quoted only to say what this tool refuses.',
      'In the single NE Missouri passage, cheap land in shrinking farm towns is named as the displacement route here, not a reason to come.',
      'Water stress runs on the native 0-1 score and keeps its unit label.',
      'This entry has not been reviewed by any nation or community named here.',
      'No nation or community named here has reviewed this entry.',
      'There are no contact details on this page, and no contact route is set yet.',
      'See Part I of the framework and Annex I for the terms.',
      'Checked against opened public sources on 4 October 2026 (2026-10-04).',
      'First conversations lists public bodies to read, never people to contact.',
    ].join('\n');
    const cr = lintText(clean);
    ok(cr.fails.length === 0, `clean copy must pass; got ${cr.fails.map((f) => f.rule + ':' + f.match).join(', ')}`);

    // 4. Exemptions are narrow: the same words outside the permitted context still fail.
    ok(lintText('Cheap land is on offer here.').fails.some((f) => f.rule === 'framing-cheap-land'), 'cheap land without displacement context must fail');
    ok(lintText('A land grab is under way.').fails.some((f) => f.rule === 'framing-land-grab'), 'unquoted land grab must fail');
    ok(lintText('None of this is scored, ranked, rated or summed, and no stars are given.').fails.length === 0, 'a sentence that refuses scoring must pass');
    ok(lintText('Each region is scored and ranked.').fails.length === 2, 'an affirmative score and rank must fail');
    ok(lintText('The score is 7 out of 10.').fails.some((f) => f.rule === 'rank-score'), 'a plain score must fail');
    ok(lintText('Entries were reviewed by the host nation.').fails.some((f) => f.rule === 'claim-reviewed-by'), 'affirmative reviewed-by must fail');

    // 5. CLI exit codes: a dirty file exits 1, a clean file exits 0, a missing explicit file exits 1.
    const run = (a) => spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...a], { encoding: 'utf8' });
    const cleanFile = path.join(tmp, 'clean.txt'); fs.writeFileSync(cleanFile, 'Plain words about arrival and the people already there.\n');
    ok(run([cleanFile]).status === 0, 'CLI: clean file must exit 0');
    ok(run([hp]).status === 1, 'CLI: dirty file must exit 1');
    ok(run([path.join(tmp, 'nope.html')]).status === 1, 'CLI: missing explicit file must exit 1');
    ok(run(['--warnings-fail', cleanFile]).status === 0, 'CLI: --warnings-fail on a clean file exits 0');
    const softFile = path.join(tmp, 'soft.txt'); fs.writeFileSync(softFile, 'The abandoned village is up for grabs.\n');
    ok(run([softFile]).status === 0 && run(['--warnings-fail', softFile]).status === 1, 'CLI: soft warnings pass by default and fail under --warnings-fail');
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  console.log(`lint_bio_copy self-test: ${planted} planted bans, ${checks} checks, ${bad} failures`);
  return bad ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) process.exit(runCli(process.argv));
