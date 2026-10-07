// pages/arrive.js: the region view of arrive.html (BIO-6).
//
// The four stages are static text in the page and read in full without JavaScript. This module adds one thing: a picker, and
// for the chosen region a block rendered from data with the SAME components as the region drawer and the region pages
// (lib/salutation.js, lib/bio.js placeStripHtml and landStandingV2Html, lib/evidence-render.js legalPathwayHtml and
// contextHtml). Nothing a place is said to be is typed here: every place fact comes from data.
//
// Rules this file keeps
//   * Only regions whose reciprocity entry passes isVerified() (a data flag, never a claim that anyone reviewed it) are offered
//     and rendered. An id that is unknown or not in that list renders nothing.
//   * Qualitative only: nothing is scored, ranked, counted, summed or filtered. The picker lists regions A to Z by display name.
//   * No form, no storage, no network beyond the site's own data modules, no analytics event. The chosen region is carried in
//     the address (?region=<id>) with history.replaceState, and nowhere else.
//   * Headings stay in order: the block is an h2; the shared components print h3 (tagLevel 3), h4 and h5; the way in and the
//     climate lines sit under an h3 of their own, so no level is skipped.
//   * The block reserves its height when the address already carries ?region= (the head script sets html.arrive-pending), so
//     the page does not shift when the data arrives. A choice made with the picker is the visitor's own input.

import { regions, loadDrawerData } from '../data.js';
import { isVerified, placeStripHtml, landStandingV2Html } from '../../lib/bio.js';
import { salutation, salutationLabel } from '../../lib/salutation.js';
import { legalPathwayHtml, contextHtml, esc } from '../../lib/evidence-render.js';

const ID_RE = /^[a-z0-9][a-z0-9-]*$/;

const select = document.getElementById('arrive-region');
const block = document.getElementById('region');
const hints = Array.from(document.querySelectorAll('.arrive-stage-region'));

function releaseHold() {
  document.documentElement.classList.remove('arrive-pending');
}

function byName(a, b) {
  const c = String(a.name).localeCompare(String(b.name), 'en', { sensitivity: 'base' });
  return c || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
}

const offered = regions.filter((r) => r && ID_RE.test(String(r.id)) && isVerified(r.id)).sort(byName);
const byId = new Map(offered.map((r) => [r.id, r]));

function toNodes(html) {
  const t = document.createElement('template');
  t.innerHTML = html;
  return t.content;
}

// The stage pointers: one sentence per stage, each linking to the part of the block that answers it. Only parts that exist are
// named, so a region with no first conversations says nothing about them.
function hintHtml(stage, name, ids) {
  const k = `<span class="arrive-hint-k">In ${esc(name)}</span>`;
  const a = (id, text) => `<a href="#${id}">${esc(text)}</a>`;
  if (stage === 'before-you-look' && ids.land) {
    return `${k}${a(ids.land, 'Land standing')} says whose land it is and what arriving asks.`;
  }
  if (stage === 'when-you-visit' && ids.fc) {
    return `${k}${a(ids.fc, 'First conversations')} lists the public bodies to read first.`;
  }
  if (stage === 'before-you-commit' && (ids.way || ids.notThere)) {
    const parts = [];
    if (ids.way) parts.push(`${a(ids.way, 'The way in')} sets out lawful entry in order`);
    if (ids.notThere) parts.push(`${a(ids.notThere, 'where the answer is not here')} is stated plainly`);
    return `${k}${parts.join(', and ')}.`;
  }
  if (stage === 'the-first-years' && (ids.direction || ids.context)) {
    const parts = [];
    if (ids.direction) parts.push(a(ids.direction, 'the direction of change'));
    if (ids.context) parts.push(a(ids.context, 'the climate and water record'));
    return `${k}${parts.join(' and ')} ${parts.length > 1 ? 'are' : 'is'} set out above.`;
  }
  return '';
}

function clearHints() {
  for (const h of hints) h.replaceChildren();
}

function setHints(name, ids) {
  for (const h of hints) {
    const html = hintHtml(h.dataset.stage, name, ids);
    h.replaceChildren();
    if (html) h.appendChild(toNodes(`<p class="arrive-hint">${html}</p>`));
  }
}

// Gives the parts of the shared markup the ids the stage pointers link to. Ids are set on elements the library renders, so the
// library markup itself is untouched.
function tagParts(root) {
  const ids = {};
  const mark = (key, sel, id) => {
    const el = root.querySelector(sel);
    if (!el) return;
    if (!el.id) el.id = id;
    ids[key] = el.id;
  };
  mark('land', '.drawer-land-standing', 'region-land');
  mark('fc', '.ls-fc', 'region-fc');
  mark('notThere', '.ls-notthere', 'region-notthere');
  mark('direction', '.ls-trajectory', 'region-direction');
  mark('way', 'section.way', 'way-in');
  mark('context', '.ctx', 'region-context');
  return ids;
}

let seq = 0;

async function show(id, { fromHash = false } = {}) {
  const mine = ++seq;
  const r = id && byId.get(id);
  if (!r) {
    block.replaceChildren();
    clearHints();
    releaseHold();
    return;
  }
  let drawer = {};
  try { drawer = (await loadDrawerData()) || {}; } catch (e) { drawer = {}; }
  if (mine !== seq) return;                                  // a newer choice has taken over

  const name = r.name;
  const sal = salutation(id);
  const parts = [];
  parts.push('<section aria-labelledby="region-h">');
  if (sal.text) {
    parts.push(`<p class="arrive-sal"><span class="arrive-sal-label">${esc(salutationLabel(sal.contested))}</span>${esc(sal.text)}</p>`);
  }
  parts.push(`<h2 id="region-h">In ${esc(name)}</h2>`);
  if (r.country) parts.push(`<p class="arrive-country">${esc(r.country)}</p>`);
  parts.push(placeStripHtml(id, { escape: esc, tagLevel: 3 }));
  parts.push(landStandingV2Html(id, { escape: esc, name, variant: 'drawer', tagLevel: 3 }));
  const way = drawer.legalPathway && drawer.legalPathway[id]
    ? legalPathwayHtml(drawer.legalPathway[id], { mode: 'full', idPrefix: 'arrive-way', regionId: id })
    : '';
  if (way) parts.push(`<h3 class="arrive-sub">Under local law</h3>${way}`);
  const ctx = drawer.context && drawer.context[id] ? contextHtml(drawer.context[id], { mode: 'drawer' }) : '';
  if (ctx) parts.push(`<h3 class="arrive-sub">Climate and water, in short</h3>${ctx}`);
  parts.push(`<p class="arrive-more"><a href="/region/${esc(id)}.html">The page for ${esc(name)}, with all eight criteria and their sources</a></p>`);
  parts.push('</section>');

  const frag = toNodes(parts.join(''));
  const ids = tagParts(frag);
  block.replaceChildren(frag);
  setHints(name, ids);
  releaseHold();
  if (fromHash && location.hash === '#region') block.scrollIntoView({ block: 'start' });
}

function syncAddress(id) {
  try {
    const u = new URL(location.href);
    if (id) u.searchParams.set('region', id); else u.searchParams.delete('region');
    history.replaceState(null, '', u.pathname + u.search + u.hash);
  } catch (e) { /* the address stays as it was */ }
}

function init() {
  if (!select || !block) { releaseHold(); return; }
  for (const r of offered) {
    const o = document.createElement('option');
    o.value = r.id;
    o.textContent = r.name;
    select.appendChild(o);
  }
  let start = '';
  try { start = new URLSearchParams(location.search).get('region') || ''; } catch (e) { start = ''; }
  start = ID_RE.test(start) && byId.has(start) ? start : '';
  select.value = start;
  select.addEventListener('change', () => {
    const id = select.value;
    syncAddress(id);
    show(id);
  });
  show(start, { fromHash: true });
}

try {
  init();
} catch (e) {
  releaseHold();
  throw e;
}
