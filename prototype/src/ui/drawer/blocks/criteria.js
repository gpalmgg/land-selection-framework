// Drawer block: the criteria ledger (MC-LEDGER, design 8.14).
//
// Every criterion is one line of ul.ledger: the name on a dotted leader, the value with its unit on the right, and on
// the line beneath the label, a trajectory chip (only where a source states one), the source as a link, the vintage and
// the licence in the same breath. A cell whose value is null is a gap row ("not yet verified" and why); it keeps its
// place, takes no guessed number and is never counted. Values go through the shared formatter (fmtCell, as stored,
// never rounded away), provenance through provenanceLine, chips through trajectoryChip: all three live in
// lib/evidence-render.js and run unchanged on the region pages and in the OG card. Nothing here scores, ranks or sums.
//
// The class hooks (.ledger, .sb, .traj, .gap, .dir-ico) are styled by styles/ledger.css.

import { ledgerHtml } from '../../../../lib/evidence-render.js';

const NUMBER_WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];

// ledger.css is linked by the page when the build stamps it in; until then the block loads it itself, once, and the
// module asks for it at import time so that it has arrived before the first drawer opens. Idempotent.
export function ensureStylesheet(file, base) {
  try {
    if (typeof document === 'undefined') return;
    const tail = `/styles/${file}`;
    const have = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).some((l) => (l.getAttribute('href') || '').split('?')[0].endsWith(tail));
    if (have) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = new URL(`../../../styles/${file}`, base).href;
    link.setAttribute('data-injected-by', 'drawer-block');
    document.head.appendChild(link);
  } catch { /* the block renders without the sheet; it is never fatal */ }
}
ensureStylesheet('ledger.css', import.meta.url);

// A source name must read as words. A few cells carry a dataset field name in a parenthesis, "WRI Aqueduct 4.0
// (bau50_ws_x_r)": it is a column of the file, not something a visitor reads, and its underscores are the look of a raw
// token. The display drops that parenthesis and keeps the full string as the link's title; the data is untouched.
const FIELD_NAME_PAREN = /\s*\([^()]*_[^()]*\)/g;
function readableSource(cell) {
  if (!cell || typeof cell.source !== 'string') return { cell, from: '' };
  const clean = cell.source.replace(FIELD_NAME_PAREN, '').trim();
  return clean === cell.source ? { cell, from: '' } : { cell: { ...cell, source: clean }, from: cell.source };
}

export default {
  id: 'criteria',
  render(ctx) {
    const { criteria, values } = ctx;
    const sources = ctx.data && ctx.data.sources;
    if (!Array.isArray(criteria) || !criteria.length) return null;
    ensureStylesheet('ledger.css', import.meta.url);

    const section = document.createElement('section');
    section.className = 'drawer-criteria';
    section.setAttribute('aria-labelledby', 'drawer-crit-t');

    const count = NUMBER_WORDS[criteria.length] || String(criteria.length);
    const h = document.createElement('h4');
    h.id = 'drawer-crit-t';
    h.textContent = `The ${count} criteria, with sources`;
    section.appendChild(h);

    const shown = {};
    const full = {};
    criteria.forEach((c) => {
      const r = readableSource(values && values[c.id]);
      shown[c.id] = r.cell;
      if (r.from) full[c.id] = r.from;
    });
    const t = document.createElement('template');
    t.innerHTML = ledgerHtml(criteria, shown, sources);
    const ul = t.content.firstElementChild;
    // Hooks for tests and deep links; the lib's markup is untouched otherwise.
    Array.from(ul.children).forEach((li, i) => {
      const c = criteria[i];
      if (!c) return;
      li.dataset.criterion = c.id;
      const a = full[c.id] && li.querySelector('.sb a');
      if (a) a.setAttribute('title', full[c.id]);
    });
    section.appendChild(ul);

    const note = document.createElement('p');
    note.className = 'ledger-note';
    note.textContent = 'Each line keeps its source, vintage and licence. A row marked not yet verified keeps its place and never takes a guessed number.';
    section.appendChild(note);
    return section;
  },
};
