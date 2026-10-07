// Shared evidence renderers: value formatting, provenance lines, trajectory chips, the ledger, the way in (legal
// pathway) and the climate and water context block.
//
// Pure ESM. No DOM, no globals, no fs, no imports: the same file runs in the browser, in Node (region page generator,
// tests) and in the edge runtime (OG card). Every function returns a string or a plain object.
//
// Output carries the DESIGN class names (design spec 8.14 and 15.5 #4): ledger = ul.ledger > li > span.nm + span.vv +
// div.sb, gap row = li.gap, trajectory chip = .traj, way in = .way / .way.compact with .way-sum, ol.way-steps, li.gate,
// .way-out, .way-gaps, .way-foot and the direction chip .dir; context block = .ctx / .ctx-row. There are no inline
// styles, no ev-* classes and no class or word that implies better or worse. Direction words are neutral (rising,
// falling, steady, mixed). Nothing here scores, ranks or sums anything.
//
// Two flavours of output:
//   * HTML functions (esc'd, true typography: en dashes, U+2212 minus, inline-SVG direction icons).
//   * `*Text` functions (used by the OG card): plain text restricted to Latin-1 (the OG font is a subset), so no U+2264,
//     U+2265, U+2212, en dash or arrow ever reaches them; ranges are written 'at least' / 'at most'.

export const LEGAL_NOT_ADVICE = 'Orientation from public sources, not legal advice. Check current law with a local professional before acting.';
export const NOT_VERIFIED = 'not verified';           // fmtCell text for a null cell (design 15.3)
export const GAP_VALUE = 'not yet verified';          // what a ledger gap row prints in the value slot (design 8.14)
export const LICENCE_NOT_CONFIRMED = 'licence not confirmed';

const MINUS = '−';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const isNum = (n) => typeof n === 'number' && Number.isFinite(n);
const str = (x) => (typeof x === 'string' && x.trim() ? x.trim() : '');
const arr = (x) => (Array.isArray(x) ? x : []);

// ---------------------------------------------------------------------------------------------------------------
// Escaping and small helpers
export function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Only http(s) links are ever emitted as href.
export function safeUrl(u) {
  const s = str(u);
  return /^https?:\/\/[^\s"'<>]+$/i.test(s) ? s : '';
}
const link = (text, url, cls) => {
  const u = safeUrl(url);
  return u ? `<a${cls ? ` class="${cls}"` : ''} href="${esc(u)}" rel="noopener">${esc(text)}</a>` : esc(text);
};
// '2026-10-04' -> '4 October 2026'. Anything else is returned as written.
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str(iso));
  if (!m) return str(iso);
  const mo = Number(m[2]);
  if (mo < 1 || mo > 12) return str(iso);
  return `${Number(m[3])} ${MONTHS[mo - 1]} ${m[1]}`;
}

// Latin-1 safe plain text (the OG font subset). Typographic characters are mapped to ASCII; letters with a diacritic
// outside Latin-1 fall back to their base letter; anything else is dropped.
const SPECIAL = { 'ł': 'l', 'Ł': 'L', 'đ': 'd', 'Đ': 'D', 'œ': 'oe', 'Œ': 'OE', 'ı': 'i', '•': '-', ' ': ' ' };
export function latin1(s) {
  const pre = String(s == null ? '' : s)
    .replace(/≤\s*/g, 'at most ').replace(/≥\s*/g, 'at least ')
    .replace(/[‐-―−]/g, '-')
    .replace(/[‘’‚′]/g, "'").replace(/[“”„]/g, '"')
    .replace(/…/g, '...')
    .replace(/\s*[←-↓]\s*/g, ' to ')
    .replace(/[ -   ]/g, ' ');
  let out = '';
  for (const ch of Array.from(pre)) {
    const c = ch.codePointAt(0);
    if (SPECIAL[ch] !== undefined) out += SPECIAL[ch];
    else if (c <= 0xFF) out += ch;
    else { const base = ch.normalize('NFD')[0]; out += base && base.codePointAt(0) <= 0xFF && base !== ch ? base : ''; }
  }
  return out.replace(/ {2,}/g, ' ').trim();
}

// ---------------------------------------------------------------------------------------------------------------
// Number formatting (design 15.3): as stored, never rounded away. Integers grouped with commas, other values to at
// most `maxDecimals` (default 2) without trailing zeros, negatives with the true minus U+2212.
export function fmtNumber(n, { maxDecimals = 2 } = {}) {
  if (!isNum(n)) return '';
  const neg = n < 0;
  const a = Math.abs(n);
  let body;
  if (Number.isInteger(a)) body = String(a).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  else {
    let s = a.toFixed(maxDecimals);
    if (/^0(\.0+)?$/.test(s)) { s = Number(a.toPrecision(2)).toString(); if (/e/i.test(s)) s = a.toFixed(8); }
    s = s.replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    const [i, f] = s.split('.');
    body = i.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (f ? `.${f}` : '');
  }
  return (neg && body !== '0' ? MINUS : '') + body;
}

// fmtCell(cell, criterion) -> { text, unit, reason }. A null (or missing, or non-numeric) value never prints 'null' and
// never takes a guessed number: it returns 'not verified' with the cell's nullReason.
export function fmtCell(cell, criterion) {
  const v = cell ? cell.value : null;
  if (!isNum(v)) return { text: NOT_VERIFIED, unit: '', reason: cell && cell.nullReason != null ? String(cell.nullReason) : '' };
  return { text: fmtNumber(v), unit: str(cell.unit) || str(criterion && criterion.rangeLabel) || str(criterion && criterion.unit), reason: '' };
}
export function fmtCellText(cell, criterion) {
  const f = fmtCell(cell, criterion);
  return latin1(f.unit ? `${f.text} ${f.unit}` : f.text);
}

// ---------------------------------------------------------------------------------------------------------------
// Provenance
const METHOD_LABELS = {
  'footprint-zonal': 'footprint mean',
  'point-3x3': 'marker 3x3',
  'official-statistic': 'official statistic',
  'named-count': 'named count',
  'hand-estimate': 'editorial estimate',
};
export function methodLabel(method) {
  return Object.prototype.hasOwnProperty.call(METHOD_LABELS, method) ? METHOD_LABELS[method] : '';
}

// Licence text for a cell: the cell's own override, then its registry entry, then the criterion's licence, else
// 'licence not confirmed'. Same precedence as data/sources.js licenseOf, restated here so this module has no imports.
export function licenseOf(cell, criterion, sources) {
  const own = str(cell && cell.license);
  if (own) return own;
  const entry = cell && cell.sourceId && sources ? sources[cell.sourceId] : null;
  const reg = str(entry && entry.license);
  if (reg) return reg;
  return str(criterion && criterion.license) || LICENCE_NOT_CONFIRMED;
}
export function licenseUrlOf(cell, criterion, sources) {
  if (str(cell && cell.license)) return safeUrl(cell.licenseUrl);
  const entry = cell && cell.sourceId && sources ? sources[cell.sourceId] : null;
  if (entry && str(entry.license)) return safeUrl(entry.licenseUrl);
  return safeUrl(criterion && criterion.licenseUrl);
}

// The second line of a ledger row, as HTML (the inside of div.sb):
//   <i>label</i> [trajectory chip] Source (link) · vintage · licence (link or 'licence not confirmed') · retrieved date · method chip
// Options: label, trajectory, retrieved, method (all default true).
export function provenanceLine(cell, criterion, sources, opts = {}) {
  const o = { label: true, trajectory: true, retrieved: true, method: true, ...opts };
  if (!cell || !isNum(cell.value)) return gapSb(cell, o);
  const head = [];
  if (o.label && str(cell.label)) head.push(`<i>${esc(cell.label)}</i>`);
  if (o.trajectory) { const t = trajectoryChip(cell); if (t) head.push(t); }
  const parts = [];
  const src = str(cell.source);
  if (src) parts.push(link(src, cell.sourceUrl));
  if (str(cell.vintage)) parts.push(esc(cell.vintage));
  parts.push(link(licenseOf(cell, criterion, sources), licenseUrlOf(cell, criterion, sources)));
  if (o.retrieved && str(cell.retrieved)) parts.push(`retrieved ${esc(formatDate(cell.retrieved))}`);
  const m = o.method ? methodLabel(cell.method) : '';
  if (m) parts.push(`<span class="meth">${esc(m)}</span>`);
  return `${head.join(' ')}${head.length ? ' ' : ''}${parts.join(' · ')}`;
}
// Plain text twin for the edge: source, vintage, licence, retrieved date, method. Latin-1 only.
export function provenanceText(cell, criterion, sources) {
  if (!cell || !isNum(cell.value)) return latin1([NOT_VERIFIED, str(cell && cell.nullReason)].filter(Boolean).join(': '));
  const parts = [str(cell.source), str(cell.vintage), licenseOf(cell, criterion, sources)];
  if (str(cell.retrieved)) parts.push(`retrieved ${formatDate(cell.retrieved)}`);
  const m = methodLabel(cell.method);
  if (m) parts.push(m);
  return latin1(parts.filter(Boolean).join(' · '));
}

// ---------------------------------------------------------------------------------------------------------------
// Trajectory chip (state + trajectory). Neutral words only. The direction icon is inline SVG (the arrow glyphs are not
// in the font subsets) and always sits beside the words.
const DIR_PATHS = {
  rising: '<path d="M2 10L10 2M4.5 2H10v5.5"/>',
  falling: '<path d="M2 2l8 8M10 4.5V10H4.5"/>',
  steady: '<path d="M1.5 6h9M7 2.5L10.5 6 7 9.5"/>',
  mixed: '<path d="M3.5 10V2M1.5 4l2-2 2 2M8.5 2v8M6.5 8l2 2 2-2"/>',
};
export const DIRECTION_WORDS = ['rising', 'falling', 'steady', 'mixed'];
export function dirIcon(direction) {
  return Object.prototype.hasOwnProperty.call(DIR_PATHS, direction) ? `<svg class="dir-ico" viewBox="0 0 12 12" aria-hidden="true">${DIR_PATHS[direction]}</svg>` : '';
}
const signed = (n) => (n > 0 ? '+' : '') + fmtNumber(n);

// The words of a trajectory, e.g. 'rising +2.1 °C vs 1970–2000 (projected)', 'falling, 2001–2023'. null when there is
// nothing sourced to say (not_available or no trajectory).
function trajectoryWords(t) {
  if (!t || typeof t !== 'object' || t.status === 'not_available' || !['measured', 'projected', 'qualitative'].includes(t.status)) return null;
  const dir = DIRECTION_WORDS.includes(t.direction) ? t.direction : null;
  const hasDelta = isNum(t.delta);
  const vintage = str(t.vintage);
  let head = [dir, hasDelta ? `${signed(t.delta)}${str(t.unit) ? ` ${str(t.unit)}` : ''}` : ''].filter(Boolean).join(' ');
  if (!head) head = t.status;
  let tail = '';
  const vs = /\s+vs\.?\s+(.+)$/i.exec(vintage);
  if (hasDelta && vs) tail = ` vs ${vs[1]}`;
  else if (vintage) tail = `, ${vintage}`;
  const suffix = t.status === 'projected' ? ' (projected)' : t.status === 'qualitative' ? ' (qualitative)' : '';
  return { dir, words: `${head}${tail}${suffix}` };
}
// Accepts a cell (uses cell.trajectory) or a trajectory object.
export function trajectoryChip(cellOrTrajectory) {
  const t = cellOrTrajectory && cellOrTrajectory.trajectory !== undefined ? cellOrTrajectory.trajectory : cellOrTrajectory;
  if (!t || typeof t !== 'object') return '';
  if (t.status === 'not_available') {
    const basis = str(t.basis);
    return basis ? `<span class="traj-na">${esc(basis)}</span>` : '';
  }
  const w = trajectoryWords(t);
  if (!w) return '';
  const title = str(t.basis) ? ` title="${esc(t.basis)}"` : '';
  return `<span class="traj" data-status="${esc(t.status)}"${title}>${dirIcon(w.dir)}${esc(w.words)}</span>`;
}
export function trajectoryText(cellOrTrajectory) {
  const t = cellOrTrajectory && cellOrTrajectory.trajectory !== undefined ? cellOrTrajectory.trajectory : cellOrTrajectory;
  if (!t || typeof t !== 'object') return '';
  if (t.status === 'not_available') return latin1(str(t.basis));
  const w = trajectoryWords(t);
  return w ? latin1(w.words) : '';
}

// ---------------------------------------------------------------------------------------------------------------
// The ledger: ul.ledger > li > span.nm + span.vv + div.sb
function gapSb(cell, o = {}) {
  const reason = str(cell && cell.nullReason) || 'No verified value is recorded.';
  const src = str(cell && cell.source);
  return `<i>${esc(reason)}</i> ${src ? `${link(src, cell && cell.sourceUrl)} · ` : ''}the row keeps its place`;
}
export function ledgerRowHtml(criterion, cell, sources, opts = {}) {
  const name = esc((criterion && criterion.name) || '');
  if (!cell || !isNum(cell.value)) return `<li class="gap"><span class="nm">${name}</span><span class="vv">${GAP_VALUE}</span><div class="sb">${gapSb(cell, opts)}</div></li>`;
  const f = fmtCell(cell, criterion);
  return `<li><span class="nm">${name}</span><span class="vv">${esc(f.text)}${f.unit ? `<small>${esc(f.unit)}</small>` : ''}</span><div class="sb">${provenanceLine(cell, criterion, sources, opts)}</div></li>`;
}
// criteria: array of criterion objects; cells: { [criterionId]: cell } for one region.
export function ledgerHtml(criteria, cells, sources, opts = {}) {
  return `<ul class="ledger">${arr(criteria).map((c) => ledgerRowHtml(c, cells && cells[c.id], sources, opts)).join('')}</ul>`;
}

// ---------------------------------------------------------------------------------------------------------------
// The way in (legal pathway). Qualitative, orientation not advice, never a filter, never a rank. `mode: 'page'` is the
// full block, `mode: 'drawer'` is the compact one (three rows and a link to the page).
// Options: mode, idPrefix (unique ids when several blocks share a page), pageHref (drawer link target), regionId.
const DIRECTION_LABEL = { stable: 'stable', tightening: 'tightening', loosening: 'loosening', mixed: 'mixed', unknown: 'direction not established' };

const srcLink = (o) => (o && str(o.source) ? ` <span class="way-src">${link(o.source, o.sourceUrl)}</span>` : '');
function collectSources(entry, includeSteps) {
  const seen = new Map();
  const add = (o) => { if (o && str(o.source) && !seen.has(o.source)) seen.set(o.source, o.sourceUrl); };
  add(entry.nonResidentOwnership); add(entry.residency); add(entry.zoning);
  arr(entry.collectiveForms).forEach(add);
  if (includeSteps) arr(entry.steps).forEach((s) => { add(s); add(s && s.duration); });
  return [...seen.entries()];
}
function isGate(step) { return !!step && (step.gate === true || /^gate\b[:\s]/i.test(str(step.what))); }

function directionChip(entry) {
  const word = DIRECTION_LABEL[entry.direction] || DIRECTION_LABEL.unknown;
  const year = /^(\d{4})-/.exec(str(entry.asOf));
  return `<span class="dir">${esc(word)}${entry.direction !== 'unknown' && year ? ` · as of ${year[1]}` : ''}</span>`;
}
function formsRow(entry, full) {
  const forms = arr(entry.collectiveForms);
  const chips = `<span class="chips">${forms.map((f) => `<span class="chip" title="${esc(f.summary || '')}">${link(f.name, f.sourceUrl)}</span>`).join('')}</span>`;
  const list = full ? `<ul class="way-forms">${forms.map((f) => `<li><b>${esc(f.name)}.</b> ${esc(f.summary || '')}${srcLink(f)}</li>`).join('')}</ul>` : '';
  return `${chips}${list}`;
}
function firstClaimRow(entry) {
  const fc = arr(entry.firstClaim).filter((s) => str(s));
  if (!fc.length) return '<em class="way-empty">No statutory pre-emption holder identified for rural sales.</em>';
  return fc.length === 1 ? esc(fc[0]) : `<ul class="way-claims">${fc.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>`;
}

export function legalPathwayHtml(entry, opts = {}) {
  if (!entry || typeof entry !== 'object') return '';
  const full = opts.mode !== 'drawer' && opts.mode !== 'compact';
  const prefix = esc(opts.idPrefix || 'way');
  const tid = `${prefix}-t`;
  const no = entry.nonResidentOwnership || {};
  const forms = arr(entry.collectiveForms);
  const rows = [];
  rows.push(`<dt>Who may hold</dt><dd>${esc(no.summary || '')}${srcLink(no)}</dd>`);
  if (full) {
    if (forms.length) rows.push(`<dt>How a group can hold</dt><dd>${formsRow(entry, true)}</dd>`);
    rows.push(`<dt>First claim</dt><dd>${firstClaimRow(entry)}</dd>`);
  } else if (forms.length) rows.push(`<dt>How a group can hold</dt><dd>${formsRow(entry, false)}</dd>`);
  else rows.push(`<dt>First claim</dt><dd>${firstClaimRow(entry)}</dd>`);
  rows.push(`<dt>Direction</dt><dd>${esc(entry.directionNote || '')}${directionChip(entry)}</dd>`);
  const sum = `<dl class="way-sum">${rows.join('')}</dl>`;

  const srcs = collectSources(entry, full).map(([name, url]) => link(name, url));
  const conf = str(entry.confidence);
  const foot = `<p class="way-foot"><b>Context, not advice</b>${esc(LEGAL_NOT_ADVICE)}${srcs.length ? ` Sources: ${srcs.join(', ')}.` : ''}${str(entry.verifiedOn) ? ` Verified ${esc(formatDate(entry.verifiedOn))}` : ''}${conf ? ` · confidence in this entry: ${esc(conf)}` : ''}.</p>`;
  const tag = `<div class="way-tag" id="${tid}">The way in · qualitative · not legal advice</div>`;

  if (!full) {
    const rel = opts.pageHref && /^[\w./#?=&%-]+$/.test(opts.pageHref) ? opts.pageHref : (opts.regionId && /^[\w-]+$/.test(opts.regionId) ? `region/${opts.regionId}.html#way-in` : '#way-in');
    const href = esc(safeUrl(opts.pageHref) || rel);
    return `<section class="way compact" aria-labelledby="${tid}">${tag}<h4>What lawful entry involves</h4>${sum}<a class="way-more" href="${href}">The full pathway is on the region page</a>${foot}</section>`;
  }

  const steps = arr(entry.steps).map((s) => {
    const gate = isGate(s);
    const meta = [`<span><b>${gate ? 'Who must say yes:' : 'Who decides:'}</b> ${esc(s.who || '')}</span>`];
    if (s.duration && str(s.duration.text)) meta.push(`<span><b>Duration:</b> ${esc(s.duration.text)}${srcLink(s.duration)}</span>`);
    if (str(s.note)) meta.push(`<span>${esc(s.note)}</span>`);
    if (str(s.source)) meta.push(`<span class="way-src">${link(s.source, s.sourceUrl)}</span>`);
    return `<li${gate ? ' class="gate"' : ''}><div class="what">${esc(s.what || '')}</div><div class="meta">${meta.join('')}</div></li>`;
  }).join('');
  const out = arr(entry.ruledOut).filter((s) => str(s));
  const gaps = arr(entry.gaps).filter((s) => str(s));
  const gapsHtml = `<div class="way-gaps"><b>Honest gaps</b>${gaps.length ? `<ul>${gaps.map((g) => `<li>${esc(g)}</li>`).join('')}</ul> None is shown.` : 'No gaps recorded.'}</div>`;
  return `<section class="way" id="${esc(opts.anchor || 'way-in')}" aria-labelledby="${tid}">${tag}<h4>What lawful entry involves, in order</h4>${sum}`
    + (steps ? `<ol class="way-steps">${steps}</ol>` : '')
    + (out.length ? `<div class="way-out"><b>What the law rules out</b><ul>${out.map((s) => `<li>${esc(s)}</li>`).join('')}</ul></div>` : '')
    + `${gapsHtml}${foot}</section>`;
}

// ---------------------------------------------------------------------------------------------------------------
// Climate and water context (Koppen-Geiger classes, WRI Aqueduct classes in WRI's own words). Native facts: area
// fractions and dataset ratios, never combined, never rescaled, never colour-ranked.
// Options: mode ('page' | 'drawer'), legend (koppen-legend.json `classes` array or a { code: name } map), sources
// (the registry, to print licences), idPrefix.
const WATER_ROWS = [
  ['droughtRisk', 'Drought risk'],
  ['interannualVariability', 'Interannual variability'],
  ['seasonalVariability', 'Seasonal variability'],
  ['groundwaterTrend', 'Groundwater table trend'],
  ['riverineFloodRisk', 'Riverine flood risk'],
];
const isProjection = (period) => /SSP|RCP/i.test(period);
function legendMap(legend) {
  if (Array.isArray(legend)) return Object.fromEntries(legend.filter((c) => c && c.code).map((c) => [c.code, c.name]));
  return legend && typeof legend === 'object' ? legend : {};
}
const pct = (share) => `${fmtNumber(Math.round(Number(share) * 1000) / 10, { maxDecimals: 1 })}%`;
function codeWords(code, names) { return names[code] ? `${code}, ${names[code]}` : code; }
function pickPeriods(periods) {
  const keys = Object.keys(periods || {});
  const now = keys.find((k) => /^1991/.test(k)) || [...keys].reverse().find((k) => !isProjection(k));
  const later = keys.find((k) => /^2041/.test(k)) || keys.find((k) => isProjection(k));
  return { now, later };
}
function ctxSource(block, sources, fallbackId) {
  const s = block && block.source;
  const name = typeof s === 'string' ? s : str(s && s.name);
  const url = typeof s === 'object' && s ? s.url : '';
  if (!name) return '';
  let lic = '';
  if (sources) { const sid = str(block.sourceId) || str(s && s.id) || fallbackId; lic = ` · ${link(licenseOf({ sourceId: sid }, null, sources), licenseUrlOf({ sourceId: sid }, null, sources))}`; }
  return `<p class="ctx-src">Source: ${link(name, url)}${lic}</p>`;
}

export function contextHtml(ctx, opts = {}) {
  if (!ctx || typeof ctx !== 'object' || (!ctx.koppen && !ctx.water)) return '';
  const names = legendMap(opts.legend);
  const k = ctx.koppen, w = ctx.water;
  if (opts.mode === 'drawer' || opts.mode === 'compact') {
    const rows = [];
    if (k && k.periods) {
      const { now, later } = pickPeriods(k.periods);
      const bits = [];
      if (now) bits.push(`${esc(k.periods[now].dominant)} now (${esc(now)})`);
      if (later) bits.push(`${esc(k.periods[later].dominant)} in ${esc(later)} (projection)`);
      if (bits.length) rows.push(`<div class="ctx-row"><span class="ctx-k">Climate class</span><span class="ctx-v">${bits.join(', ')}</span></div>`);
    }
    if (w) {
      const bits = [];
      if (w.baselineStress) bits.push(`${esc(w.baselineStress.class)} now`);
      if (w.stress2050Bau) bits.push(`${esc(w.stress2050Bau.class)} in 2050 business as usual (projection)`);
      if (bits.length) rows.push(`<div class="ctx-row"><span class="ctx-k">Water stress</span><span class="ctx-v">${bits.join(', ')}</span></div>`);
    }
    return rows.length ? `<div class="ctx compact">${rows.join('')}</div>` : '';
  }
  const tid = `${esc(opts.idPrefix || 'ctx')}-t`;
  const blocks = [];
  if (k && k.periods) {
    const rows = Object.entries(k.periods).map(([period, v]) => {
      const shares = Object.entries(v.shares || {}).sort((a, b) => b[1] - a[1]).map(([c, s]) => `${esc(c)} ${pct(s)}`).join(', ');
      const proj = isProjection(period);
      return `<div class="ctx-row${proj ? ' proj' : ''}"><span class="ctx-k">${esc(period)}${proj ? ' · projection' : ''}</span><span class="ctx-v">${esc(codeWords(v.dominant, names))}${shares ? `<span class="ctx-shares">Share of the footprint: ${shares}</span>` : ''}</span></div>`;
    }).join('');
    blocks.push(`<div class="ctx-block"><h5>Climate class (Köppen-Geiger)</h5>${rows}${str(k.note) ? `<p class="ctx-note">${esc(k.note)}</p>` : ''}${ctxSource(k, opts.sources, 'beck-koppen-2023')}</div>`);
  }
  if (w) {
    const rows = [];
    const stress = (label, s, proj) => `<div class="ctx-row${proj ? ' proj' : ''}"><span class="ctx-k">${label}${proj ? ' · projection' : ''}</span><span class="ctx-v">${esc(s.class)}${isNum(s.ratio) ? `<span class="ctx-shares">Demand to supply ratio ${fmtNumber(s.ratio, { maxDecimals: 3 })}</span>` : ''}</span></div>`;
    if (w.baselineStress) rows.push(stress('Water stress, baseline', w.baselineStress, false));
    if (w.stress2050Bau) rows.push(stress('Water stress, 2050 business as usual', w.stress2050Bau, true));
    for (const [key, label] of WATER_ROWS) if (str(w[key])) rows.push(`<div class="ctx-row"><span class="ctx-k">${label}</span><span class="ctx-v">${esc(w[key])}</span></div>`);
    blocks.push(`<div class="ctx-block"><h5>Water (WRI Aqueduct classes, as published)</h5>${rows.join('')}${str(w.note) ? `<p class="ctx-note">${esc(w.note)}</p>` : ''}${ctxSource(w, opts.sources, 'aqueduct-40')}</div>`);
  }
  return `<section class="ctx" aria-labelledby="${tid}"><h4 id="${tid}">Climate and water context</h4>${blocks.join('')}</section>`;
}
