// century.js - the Century Line (design 8.4): every criterion's DATA WINDOW drawn against the 50 to 100 year horizon.
//
// PURE and DOM-free, so it runs in the browser, in Node at build time (scripts/stamp_build.mjs writes it into index.html and
// deeper.html through <!--s:century-->) and under `node --test`. No Date, no Math.random, no imports.
//
// WHAT IT SHOWS: vintages, never values. Each row is one criterion, in the declared order of `criteria` (no order of merit);
// the bar is the period of data behind the criterion's metric. It therefore cannot be read as a ranking, and it cannot be false
// unless the data window itself is.
//
// DATA CONTRACT (design 15.1): criteria[].window = { from: <year>, to: <year>, kind: 'observed' | 'projection', label: '<text shown>' },
// authored by the evidence track, NEVER parsed from the heterogeneous `vintage` strings. A criterion without a valid window is drawn as
// a hatched "window not stated" row with no bar. It is never guessed.
//
//   centuryModel(criteria, opts?)  -> a plain object (axis, rows, sentences, aria label). Pure.
//   centuryHtml(model)             -> the static markup (one `.century` panel, role="img" with a full-text aria-label).
//
// The closing sentence and every count word in it are computed from the rows, never typed.

/** The year the line calls "Now". A release constant: tests/core/century.test.mjs fails when it no longer equals the year of the
 *  site's build date, which is the reminder to move it at the first rebuild of a new year. Callers may pass { now } instead. */
export const DEFAULT_NOW = 2026;
/** The horizon this tool cares about: fifty to a hundred years from now. The shaded band runs the full hundred. */
export const HORIZON_YEARS = 100;
/** The axis never starts later than this, nor ends earlier than now + HORIZON_YEARS + 9 (2135 in 2026). */
const AXIS_FROM = 1995;
const AXIS_TO_PAD = 9;
const TICK_EVERY = 25;

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve',
  'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

/** 0 to 99 in words ("twenty-one"); anything else comes back as digits. Same rule as data/site-facts.js countWord (a test pins it). */
export function countWord(n) {
  if (typeof n !== 'number' || !Number.isInteger(n) || n < 0 || n > 99) return String(n);
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10), o = n % 10;
  return o ? `${TENS[t]}-${ONES[o]}` : TENS[t];
}
const capWord = (n) => { const w = countWord(n); return w.charAt(0).toUpperCase() + w.slice(1); };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escAttr = (s) => esc(s).replace(/"/g, '&quot;');
const r2 = (n) => Math.round(n * 100) / 100;
const isYear = (y) => typeof y === 'number' && Number.isInteger(y) && y >= 1000 && y <= 3000;
const HEX = /^#[0-9a-fA-F]{3,8}$/;

/** A valid window or null. Anything that is not a clean { from <= to, years } object counts as "not stated". */
function readWindow(c) {
  const w = c && c.window;
  if (!w || typeof w !== 'object' || !isYear(w.from) || !isYear(w.to) || w.to < w.from) return null;
  const kind = w.kind === 'projection' ? 'projection' : 'observed';
  const label = typeof w.label === 'string' && w.label.trim() ? w.label.trim() : (w.from === w.to ? String(w.from) : `${w.from}–${w.to}`);
  return { from: w.from, to: w.to, kind, label };
}

/** The criterion's own ramp colour (the mid-stop). It identifies the criterion; it never encodes a value. */
function rampMid(c) {
  const ramp = c && Array.isArray(c.ramp) ? c.ramp.filter((x) => typeof x === 'string' && HEX.test(x)) : [];
  return ramp.length ? ramp[Math.floor(ramp.length / 2)] : null;
}

/** "2041 to 2060, projection" / "2050, projection" / "window not stated": the words used by the aria-label. */
function windowWords(w) {
  if (!w) return 'window not stated';
  const span = w.from === w.to ? String(w.from) : `${w.from} to ${w.to}`;
  return `${span}, ${w.kind === 'projection' ? 'projection' : 'observed'}`;
}

/**
 * The model. `criteria` is the data/regions.js array (id, name, ramp, window ...). Rows keep the declared order.
 *   opts.now   the year drawn as "Now" (default DEFAULT_NOW)
 * Returns { now, axis: { from, to, ticks: [{year, pct}] }, nowPct, horizon: { from, to, pct, width },
 *           rows: [{ id, name, stated, from, to, kind, label, color, point, left, width }],
 *           counts: { total, observed, projection, unstated }, furthest: { year, kind } | null,
 *           closing, ariaLabel }
 */
export function centuryModel(criteria, opts = {}) {
  const list = Array.isArray(criteria) ? criteria : [];
  const now = isYear(opts.now) ? opts.now : DEFAULT_NOW;
  const wins = list.map(readWindow);

  const stated = wins.filter(Boolean);
  const minFrom = stated.length ? Math.min(...stated.map((w) => w.from)) : AXIS_FROM;
  const maxTo = stated.length ? Math.max(...stated.map((w) => w.to)) : 0;
  const axisFrom = minFrom < AXIS_FROM ? Math.floor(minFrom / TICK_EVERY) * TICK_EVERY : AXIS_FROM;
  const axisTo = Math.max(now + HORIZON_YEARS + AXIS_TO_PAD, Math.ceil(maxTo / TICK_EVERY) * TICK_EVERY);
  const span = axisTo - axisFrom;
  const X = (y) => r2(((y - axisFrom) / span) * 100);

  const ticks = [];
  for (let y = Math.ceil((axisFrom + 1) / TICK_EVERY) * TICK_EVERY; y <= axisTo; y += TICK_EVERY) {
    const pct = X(y);
    if (pct >= 2 && pct <= 97) ticks.push({ year: y, pct });
  }

  const rows = list.map((c, i) => {
    const w = wins[i];
    const base = { id: String((c && c.id) || `criterion-${i + 1}`), name: String((c && c.name) || (c && c.id) || `Criterion ${i + 1}`), color: rampMid(c) };
    if (!w) return { ...base, stated: false, from: null, to: null, kind: null, label: 'window not stated', point: false, left: 0, width: 0 };
    const point = w.from === w.to;
    return {
      ...base, stated: true, from: w.from, to: w.to, kind: w.kind, label: w.label, point,
      // a range covers its first through its last year; a single year is a dot centred on the year
      left: point ? X(w.from + 0.5) : X(w.from),
      width: point ? 0 : r2(X(w.to + 1) - X(w.from)),
    };
  });

  const total = rows.length;
  const projection = rows.filter((r) => r.stated && r.kind === 'projection').length;
  const observed = rows.filter((r) => r.stated && r.kind !== 'projection').length;
  const unstated = rows.filter((r) => !r.stated).length;

  let furthest = null;
  for (const r of rows) {
    if (r.stated && (!furthest || r.to > furthest.year)) furthest = { year: r.to, kind: r.kind };
  }

  const closing = closingSentence({ total, observed, projection, unstated }, furthest);
  const hzFrom = now, hzTo = now + HORIZON_YEARS;
  const ariaLabel = `Data windows against a fifty to one hundred year horizon, from ${axisFrom} to ${axisTo}. Now is ${now}; the horizon runs to ${hzTo}. `
    + (total ? rows.map((r) => `${r.name} ${windowWords(r.stated ? r : null)}`).join('; ') + '. ' : 'No criteria. ')
    + closing;

  return {
    now,
    axis: { from: axisFrom, to: axisTo, ticks },
    nowPct: X(now),
    horizon: { from: hzFrom, to: hzTo, pct: X(hzFrom), width: r2(X(hzTo) - X(hzFrom)) },
    rows,
    counts: { total, observed, projection, unstated },
    furthest,
    closing,
    ariaLabel,
  };
}

/** The closing sentence, computed from the counts. Never typed with a number. */
export function closingSentence(counts, furthest) {
  const { total, observed, unstated } = counts;
  const parts = [];
  parts.push(`${capWord(observed)} of ${countWord(total)} criteria ${observed === 1 ? 'describes' : 'describe'} the past or the present.`);
  if (furthest && furthest.kind === 'projection') parts.push(`The furthest any of them looks is ${furthest.year}, a projection.`);
  else if (furthest) parts.push(`The furthest any of them reaches is ${furthest.year}, an observation.`);
  else parts.push('None of them states a data window yet.');
  if (unstated > 0 && unstated < total) parts.push(`${capWord(unstated)} ${unstated === 1 ? 'states no data window yet and is' : 'state no data window yet and are'} drawn as such.`);
  parts.push('The tool reads what it can, and says plainly where it cannot see.');
  return parts.join(' ');
}

/** The static markup for a model: one `.century` panel (role="img", full-text aria-label), no script, no per-frame work. */
export function centuryHtml(model) {
  const m = model;
  const ticks = m.axis.ticks.map((t) => `<span style="left:${t.pct}%">${t.year}</span>`).join('');
  const rows = m.rows.map((r) => {
    if (!r.stated) {
      return `<div class="cl-row cl-nowin"><div class="cl-name">${esc(r.name)}<small>window not stated</small></div><div class="cl-track"><span class="cl-none"></span></div></div>`;
    }
    const cls = ['cl-seg', r.kind === 'projection' ? 'proj' : '', r.point ? 'pt' : ''].filter(Boolean).join(' ');
    const color = r.color ? `--c:${r.color};` : '';
    const pos = r.point ? `left:${r.left}%` : `left:${r.left}%;width:${r.width}%`;
    const word = r.kind === 'projection' ? ' · projection' : '';
    return `<div class="cl-row"><div class="cl-name">${esc(r.name)}<small>${esc(r.label)}${word}</small></div><div class="cl-track"><span class="${cls}" style="${color}${pos}"></span></div></div>`;
  }).join('');
  return [
    `<div class="century" role="img" aria-label="${escAttr(m.ariaLabel)}" style="--now:${m.nowPct}%;--hz:${m.horizon.width}%">`,
    `<div class="cl-head"><div></div><div class="cl-axis" aria-hidden="true">${ticks}</div></div>`,
    `<div class="cl-rows">${rows}`,
    `<div class="cl-row cl-foot"><div class="cl-name"></div><div class="cl-track"><b class="cl-now-l">Now · ${m.now}</b><b class="cl-hz-l">The horizon · 50 to 100 years</b></div></div></div>`,
    '<div class="cl-key"><span><i></i>Observed or measured</span><span><i class="p"></i>Projection</span><span><i class="h"></i>The 50 to 100 year horizon</span>'
      + '<span>Windows are the vintage of each criterion’s metric; individual cells vary and are dated where they differ.</span></div>',
    `<p class="cl-note">${esc(m.closing)}</p>`,
    '</div>',
  ].join('\n');
}
