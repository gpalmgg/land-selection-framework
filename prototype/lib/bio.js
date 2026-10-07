// lib/bio.js: the shared render module for the bioregioning and reciprocity layers (WP BIO-4).
//
// Pure functions. No DOM, no fs, no network. Imports only data/bioregions.js, data/reciprocity.js and
// data/land-standing.js, so it loads under Node, in the browser and on the edge (api/og.js imports ecoSubline).
//
// QUALITATIVE ONLY. Nothing here scores, ranks, weights, sums, counts or filters. No function returns a count of
// first conversations, a number per region, or an ordering of regions. Output that mentions a place is built from
// data; no place fact is typed in this file.
//
// Data injection: every function takes an optional last argument { data } holding { bioregions, reciprocity,
// landStanding, kindLabels }. The tests use it to render fixtures; production callers omit it.
//
// Markup: landStandingV2Html and placeStripHtml return HTML strings (escaped with opts.escape, or the built-in
// escaper). The drawer blocks parse these strings; scripts/gen_region_pages.mjs inserts them as they are, so the
// drawer and the region pages serialise identically. Class hooks only: the CSS is owned by MC-DRAWER.
//
// Backward compatibility (bioregioning 3.5): an id with no verified reciprocity entry renders the v1 Land standing
// block unchanged (same elements, labels, classes) plus the additive elements .ls-provenance, .ls-consent and
// .ls-arrive. A record that carries a human-review `flag` has that field withheld.

import { bioregions as BIOREGIONS } from '../data/bioregions.js';
import { reciprocity as RECIPROCITY, kindLabels as KIND_LABELS } from '../data/reciprocity.js';
import { landStanding as LAND_STANDING } from '../data/land-standing.js';

// ---------------------------------------------------------------------------------------------------------------
// Fixed strings (copy.md 2.1, 3 and the final-spec 8.11 and 8.13 contracts)
// ---------------------------------------------------------------------------------------------------------------

export const KIND_ORDER = ['host', 'commons', 'community', 'access', 'regulator', 'regional', 'language', 'heritage', 'network', 'protocol'];

const CAPTION = "Ecoregions: RESOLVE Ecoregions 2017 (CC BY 4.0), computed within 100 km of the region's reference point, not its footprint. Watershed named from the region dossier and checked against Natural Earth rivers.";
const PLACE_NOTE = 'A descriptive label written for this tool. The names of peoples and places belong under Whose land.';
const PLACE_QUALIFIER = '· around the reference point, 100 km';
const LS_QUALIFIER = '· qualitative, never scored';
const FC_SUB = 'Public bodies and protocols to read first. Pointers, not introductions.';
const FC_FOOT = 'These are pointers to public bodies. None of them has agreed to be contacted, and none is a person. Read first; ask how they want to be approached; never assume.';
const CONSENT_CAP = 'consent of the people of this place';
const CONSENT_BLANK = 'Left blank. The tool cannot sign it; only the people of this place can.';
const NO_REVIEW = 'No nation or community named here has reviewed this entry.';
const TRAJECTORY_LABELS = {
  return: 'Land coming back',
  recognition: 'Recognition',
  revival: 'Renewal',
  pressure: 'Pressure on the people here',
};
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// ---------------------------------------------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------------------------------------------

const defaultEscape = (s) => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

function dataOf(opts) {
  const d = (opts && opts.data) || {};
  return {
    bioregions: d.bioregions || BIOREGIONS,
    reciprocity: d.reciprocity || RECIPROCITY,
    landStanding: d.landStanding || LAND_STANDING,
    kindLabels: d.kindLabels || KIND_LABELS,
  };
}

const escOf = (opts) => (opts && typeof opts.escape === 'function' ? opts.escape : defaultEscape);
const isHttps = (u) => typeof u === 'string' && /^https:\/\/[^\s"'<>]+$/i.test(u);
const isStr = (s) => typeof s === 'string' && s.trim() !== '';
const flagged = (o) => !!(o && typeof o === 'object' && o.flag);

// "2026-10-05" -> "5 October 2026"; anything else is returned as it came.
export function longDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || ''));
  if (!m) return String(iso || '');
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return String(iso);
  return `${Number(m[3])} ${MONTHS[mo - 1]} ${m[1]}`;
}

// ---------------------------------------------------------------------------------------------------------------
// isVerified, claimsFor, firstConversationsGrouped
// ---------------------------------------------------------------------------------------------------------------

// True only for an entry whose internal status is 'verified' and which carries no entry-level human-review flag.
// 'verified' is a data flag; it never means that a nation, community or body reviewed the entry (see
// landStandingProvenance).
export function isVerified(id, opts) {
  const e = dataOf(opts).reciprocity[id];
  return !!(e && typeof e === 'object' && e.status === 'verified' && !e.flag);
}

// The merge rule (bioregioning 3.4): landStanding[id].sources, then reciprocity[id].claims (only for an entry that
// isVerified), de-duplicated by url + claim, https only, flagged claims withheld. With `field`, only the claims
// that name that field; entries without a field belong to the block, not to a row, so claimsFor(id) lists all and
// claimsFor(id, 'tenure') lists the tenure ones.
export function claimsFor(id, field, opts) {
  const d = dataOf(opts);
  const base = (d.landStanding[id] && Array.isArray(d.landStanding[id].sources)) ? d.landStanding[id].sources : [];
  const extra = (isVerified(id, opts) && Array.isArray(d.reciprocity[id].claims)) ? d.reciprocity[id].claims : [];
  const at = new Map();
  const merged = [];
  for (const c of [...base, ...extra]) {
    if (!c || typeof c !== 'object' || flagged(c) || !isHttps(c.url)) continue;
    const key = `${c.url}\u0000${c.claim || ''}`;
    if (at.has(key)) {
      // the same claim twice: keep the first, but let the more specific copy say which row it supports
      const first = merged[at.get(key)];
      if (!first.field && c.field) first.field = c.field;
      continue;
    }
    at.set(key, merged.length);
    merged.push({ claim: c.claim || '', label: c.label || c.url, url: c.url, ...(c.field ? { field: c.field } : {}) });
  }
  return field ? merged.filter((c) => c.field === field) : merged;
}

const byName = (a, b) => {
  const c = String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' });
  if (c) return c;
  return String(a.name) < String(b.name) ? -1 : String(a.name) > String(b.name) ? 1 : 0;
};

// First conversations: public bodies and protocols, grouped by kind in the fixed order host, commons, community,
// access, regulator, regional, language, heritage, network, protocol; alphabetical (accents folded) inside a kind.
// Returns [{ kind, label, items: [{ name, url, what, checked }] }], empty groups left out. Never numbered, never
// counted: no group or item carries a count, an index or a rank. An item needs a name and an https URL; a flagged
// item is withheld. Kinds outside the fixed order follow it, alphabetically.
export function firstConversationsGrouped(id, opts) {
  const d = dataOf(opts);
  if (!isVerified(id, opts)) return [];
  const list = Array.isArray(d.reciprocity[id].firstConversations) ? d.reciprocity[id].firstConversations : [];
  const groups = new Map();
  for (const it of list) {
    if (!it || typeof it !== 'object' || flagged(it) || !isStr(it.name) || !isHttps(it.url)) continue;
    const kind = isStr(it.kind) ? it.kind : 'protocol';
    if (!groups.has(kind)) groups.set(kind, []);
    groups.get(kind).push({ name: it.name, url: it.url, what: it.what || '', checked: it.checked || '' });
  }
  const known = KIND_ORDER.filter((k) => groups.has(k));
  const others = [...groups.keys()].filter((k) => !KIND_ORDER.includes(k)).sort();
  return [...known, ...others].map((kind) => ({
    kind,
    label: d.kindLabels[kind] || kind,
    items: groups.get(kind).slice().sort(byName),
  }));
}

// ---------------------------------------------------------------------------------------------------------------
// Place: whereItSits, waterLine, placeCaption, ecoSubline
// ---------------------------------------------------------------------------------------------------------------

function ecoNames(id, d) {
  const b = d.bioregions[id];
  if (!b || !Array.isArray(b.ecoregions)) return [];
  return b.ecoregions.map((e) => e && e.name).filter(isStr);
}

// "In the X." / "In the X, and partly the Y." / "Across the X, Y and Z." (+ ", and others" past three). '' when the
// region has no ecoregion. Describes the landscape around the reference point, never "within" the footprint.
export function whereItSits(id, opts) {
  const n = ecoNames(id, dataOf(opts));
  if (!n.length) return '';
  if (n.length === 1) return `In the ${n[0]}.`;
  if (n.length === 2) return `In the ${n[0]}, and partly the ${n[1]}.`;
  const head = `Across the ${n[0]}, ${n[1]} and ${n[2]}`;
  return n.length > 3 ? `${head}, and others.` : `${head}.`;
}

const stop = (s) => String(s).trim().replace(/[.\s]+$/, '');

// "{major}. Drains to {drainsTo}." plus "The region straddles a drainage divide." only when true. '' without data.
export function waterLine(id, opts) {
  const b = dataOf(opts).bioregions[id];
  const w = b && b.watershed;
  if (!w || !isStr(w.major)) return '';
  let s = `${stop(w.major)}.`;
  if (isStr(w.drainsTo)) s += ` Drains to ${stop(w.drainsTo)}.`;
  if (w.straddlesDivide === true) s += ' The region straddles a drainage divide.';
  return s;
}

export function placeCaption() { return CAPTION; }
export function placeNote() { return PLACE_NOTE; }

// The OG card subline: "IN THE <PRIMARY ECOREGION>", upper-case, ASCII only (the card font is a subset), at most 44
// characters in all. null (omitted, never truncated) otherwise, so the card does not reflow. Edge-safe.
export function ecoSubline(id, opts) {
  const d = dataOf(opts);
  const b = d.bioregions[id];
  if (!b) return null;
  const name = ecoNames(id, d)[0] || (isStr(b.primaryEcoregion) ? b.primaryEcoregion : '');
  if (!name) return null;
  const s = `IN THE ${name.toUpperCase()}`;
  if (!/^[\x20-\x7e]+$/.test(s) || s.length > 44) return null;
  return s;
}

// ---------------------------------------------------------------------------------------------------------------
// Markup
// ---------------------------------------------------------------------------------------------------------------

const lvl = (n) => Math.max(1, Math.min(6, n));
const NEW_TAB = '<span class="sr-only"> (opens in a new tab)</span>';

function link(esc, url, text, cls) {
  return `<a${cls ? ` class="${cls}"` : ''} href="${esc(url)}" target="_blank" rel="noopener">${esc(text)}${NEW_TAB}</a>`;
}

// The place strip, from bioregions[id] alone (so it exists for every region): kicker, the descriptive place label,
// "Where it sits", "Where the water goes", the fixed caption and the fixed note. '' when the region has no entry.
export function placeStripHtml(id, opts) {
  const d = dataOf(opts);
  const b = d.bioregions[id];
  if (!b) return '';
  const esc = escOf(opts);
  const tagL = lvl((opts && opts.tagLevel) || 4);
  const sits = whereItSits(id, opts);
  const water = waterLine(id, opts);
  const rows = [];
  if (sits) rows.push(`<div><dt>Where it sits</dt><dd>${esc(sits)}</dd></div>`);
  if (water) rows.push(`<div><dt>Where the water goes</dt><dd>${esc(water)}</dd></div>`);
  return `<div class="place-strip">`
    + `<h${tagL} class="tag">Place <span class="tag-qual">${esc(PLACE_QUALIFIER)}</span></h${tagL}>`
    + (isStr(b.place) ? `<p class="place">${esc(b.place)}</p>` : '')
    + (rows.length ? `<dl class="place-dl">${rows.join('')}</dl>` : '')
    + `<p class="place-caption">${esc(placeCaption())}</p>`
    + `<p class="place-note">${esc(PLACE_NOTE)}</p>`
    + `</div>`;
}

// "Assembled from public sources and checked on <date>. No nation or community named here has reviewed this
// entry." The date is reciprocity[id].reviewed (ISO); with no date the clause is left out and the second sentence
// stays. The canon string of DOC-1: shown wherever the Land standing block renders, never on a card, in compare or
// in OG text.
export function landStandingProvenance(id, opts) {
  const e = dataOf(opts).reciprocity[id];
  const rv = e && typeof e.reviewed === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(e.reviewed) ? e.reviewed : '';
  return `${rv ? `Assembled from public sources and checked on ${rv}.` : 'Assembled from public sources.'} ${NO_REVIEW}`;
}

function claimsDetails(esc, list, label) {
  if (!list.length) return '';
  const items = list.map((c) => `<li>${c.claim ? `<em>${esc(c.claim)}</em> ` : ''}${link(esc, c.url, c.label)}</li>`).join('');
  return `<details class="ls-claims"><summary>${esc(label)} (${list.length})</summary><ul>${items}</ul></details>`;
}

function srcHtml(esc, s) {
  if (!s.source) return '';
  const body = s.sourceUrl
    ? `<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a>`
    : esc(s.source);
  return `<div class="ls-src">Source: ${body}</div>`;
}

function arriveHtml(esc, id, name) {
  const label = isStr(name) ? `How to arrive in ${name}` : 'How to arrive here';
  return `<a class="ls-arrive" href="/arrive.html?region=${encodeURIComponent(id)}#region">${esc(label)}`
    + `<svg class="ls-arrow" aria-hidden="true" focusable="false" viewBox="0 0 16 10" width="14" height="9"><path d="M1 5h12M9 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg></a>`;
}

function consentHtml(esc) {
  return `<div class="ls-consent"><p class="ls-consent-cap">${esc(CONSENT_CAP)}</p><p class="ls-consent-blank">${esc(CONSENT_BLANK)}</p></div>`;
}

// The additive elements shared by both modes: provenance, consent and the arrive link.
function additions(esc, id, opts) {
  return `<p class="ls-provenance">${esc(landStandingProvenance(id, opts))}</p>${consentHtml(esc)}${arriveHtml(esc, id, opts && opts.name)}`;
}

// The v1 block, exactly as it was at 6bce1a3 (drawer: div.drawer-land-standing; page: section.land-standing).
function v1Drawer(esc, s) {
  const rows = [['Whose land', s.territory], ['Tenure', s.tenure], ['Arriving in good faith', s.entry], ['What it asks', s.obligation]]
    .filter(([, v]) => v)
    .map(([l, v]) => `<div class="ls-row"><span class="ls-label">${esc(l)}</span><span class="ls-val">${esc(v)}</span></div>`)
    .join('');
  return `<h4>Land standing</h4>${rows}${srcHtml(esc, s)}`;
}

function v1Page(esc, s, extra) {
  const row = (label, val) => (val ? `<div><dt>${esc(label)}</dt><dd>${esc(val)}</dd></div>` : '');
  const src = s.source
    ? `<p class="ls-src">Source: ${s.sourceUrl ? `<a href="${esc(s.sourceUrl)}" target="_blank" rel="noopener">${esc(s.source)}</a>` : esc(s.source)}</p>`
    : '';
  return `
      <section class="land-standing">
        <div class="wrap">
          <h2>Land standing</h2>
          <dl class="ls-dl">
            ${row('Whose land', s.territory)}
            ${row('Tenure', s.tenure)}
            ${row('Arriving in good faith', s.entry)}
            ${row('What it asks', s.obligation)}
          </dl>
          ${src}${extra}
        </div>
      </section>`;
}

function v2Inner(id, s, rc, d, opts) {
  const esc = escOf(opts);
  const tagL = lvl((opts && opts.tagLevel) || 4);
  const subL = lvl(tagL + 1);
  const grpL = lvl(tagL + 2);
  const row = (label, val, field, extraCls) => {
    if (!val) return '';
    return `<div class="ls-row${extraCls ? ` ${extraCls}` : ''}"><span class="ls-label">${esc(label)}</span><span class="ls-val">${esc(val)}</span></div>`
      + claimsDetails(esc, claimsFor(id, field, opts), 'Sources for this row');
  };
  let h = `<span class="braid" aria-hidden="true"></span>`
    + `<h${tagL} class="tag">Land standing <span class="tag-qual">${esc(LS_QUALIFIER)}</span></h${tagL}>`;
  if (s.territory) h += `<p class="ls-territory">${esc(s.territory)}</p>` + claimsDetails(esc, claimsFor(id, 'territory', opts), 'Sources for this row');

  const c = rc.contested;
  if (c && typeof c === 'object' && !flagged(c) && isStr(c.text)) {
    const srcs = (Array.isArray(c.sources) ? c.sources : []).filter((x) => x && isHttps(x.url));
    h += `<div class="ls-contested"><h${subL} class="ls-sub">Whose standing is disputed</h${subL}><p>${esc(c.text)}</p>`
      + (srcs.length ? `<ul class="ls-links">${srcs.map((x) => `<li>${link(esc, x.url, x.label || x.url)}</li>`).join('')}</ul>` : '')
      + `</div>`;
  }

  h += row('Tenure', s.tenure, 'tenure');
  h += row('Arriving in good faith', s.entry, 'entry');
  h += row('What it asks', s.obligation, 'obligation');

  const t = rc.trajectory;
  if (t && typeof t === 'object' && !flagged(t) && isStr(t.text)) {
    const label = TRAJECTORY_LABELS[t.kind] || 'Change over time';
    const srcs = (Array.isArray(t.sources) ? t.sources : []).filter((x) => x && isHttps(x.url))
      .map((x) => ({ claim: '', label: x.label || x.url, url: x.url }));
    h += `<div class="ls-row ls-trajectory"><span class="ls-label">${esc(label)}</span><span class="ls-val">${esc(t.text)}</span></div>`
      + claimsDetails(esc, srcs, 'Sources for this row');
  }

  const nt = rc.notThere;
  if (nt && typeof nt === 'object' && !flagged(nt) && Array.isArray(nt.forms) && nt.forms.some(isStr)) {
    const basis = (Array.isArray(nt.basis) ? nt.basis : []).filter((x) => x && isHttps(x.url));
    h += `<div class="ls-notthere"><h${subL} class="ls-sub">Where the answer is not here</h${subL}><ul class="ls-nt-forms">`
      + nt.forms.filter(isStr).map((f) => `<li>${esc(f)}</li>`).join('')
      + `</ul>`
      + (basis.length ? `<p class="ls-nt-basis">Basis: ${basis.map((x) => link(esc, x.url, x.label || x.url)).join('; ')}</p>` : '')
      + `</div>`;
  }

  const groups = firstConversationsGrouped(id, opts);
  if (groups.length) {
    h += `<div class="ls-fc"><h${subL} class="ls-sub">First conversations</h${subL}><p class="ls-fc-sub">${esc(FC_SUB)}</p>`
      + groups.map((g) => `<div class="ls-fc-group"><h${grpL}>${esc(g.label)}</h${grpL}><ul>`
        + g.items.map((it) => `<li>${link(esc, it.url, it.name)}`
          + (it.what ? ` <span class="ls-fc-what">${esc(it.what)}</span>` : '')
          + (it.checked ? ` <span class="ls-fc-checked">checked ${esc(longDate(it.checked))}</span>` : '')
          + `</li>`).join('')
        + `</ul></div>`).join('')
      + `<p class="ls-fc-foot">${esc(FC_FOOT)}</p></div>`;
  }

  // Claims that name no row belong to the block as a whole.
  const blockClaims = claimsFor(id, null, opts).filter((x) => !x.field);
  h += claimsDetails(esc, blockClaims, 'Further sources for this entry');
  h += srcHtml(esc, s) + additions(esc, id, opts);
  return h;
}

// The Land standing block as one HTML string.
//   opts.escape    string escaper (default: built-in)
//   opts.variant   'drawer' (default): <div class="drawer-land-standing">...</div>
//                  'page': <section class="land-standing"><div class="wrap">...</div></section>, the region-page shell
//   opts.name      display name, for the "How to arrive in {name}" link
//   opts.tagLevel  heading level of the block's tag (drawer 4; a region page passes 2)
//   opts.data      data injection (tests)
// An id with a verified reciprocity entry gets the v2 block (design 8.11): lead sentence, disputed standing, rows each
// with its sources, direction of change, where the answer is not here, first conversations, source, provenance,
// consent line and arrive link. Any other id gets the v1 block unchanged plus provenance, consent and arrive link.
// '' when the id has no Land standing entry at all.
export function landStandingV2Html(id, opts) {
  const d = dataOf(opts);
  const s = d.landStanding[id];
  if (!s || typeof s !== 'object') return '';
  const esc = escOf(opts);
  const page = opts && opts.variant === 'page';
  const verified = isVerified(id, opts);
  if (!verified) {
    if (page) return v1Page(esc, s, additions(esc, id, opts));
    return `<div class="drawer-land-standing">${v1Drawer(esc, s)}${additions(esc, id, opts)}</div>`;
  }
  const inner = v2Inner(id, s, d.reciprocity[id], d, { ...(opts || {}), tagLevel: (opts && opts.tagLevel) || (page ? 2 : 4) });
  if (page) {
    return `
      <section class="land-standing">
        <div class="wrap">
          <div class="drawer-land-standing">${inner}</div>
        </div>
      </section>`;
  }
  return `<div class="drawer-land-standing">${inner}</div>`;
}
