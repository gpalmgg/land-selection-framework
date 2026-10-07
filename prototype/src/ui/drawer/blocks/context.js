// Drawer block: climate and water context, compact (MC-LEDGER, design 8.14).
//
// Two lines: the Koppen-Geiger class now and in the projection, and the WRI Aqueduct water stress class now and in
// 2050 business as usual, in WRI's own words. Native facts only: never scored, filtered on, ranked or colour-ranked, and a
// projection is always labelled as one. The lines come from contextHtml (lib/evidence-render.js); this block adds the
// plain-words names of the Koppen classes (read from the legend file, never required), one source line with licence
// and retrieval date, and the pointer to the full record on the region page. A region without an entry renders
// nothing. styles/ledger.css carries the CSS.

import { contextHtml, esc, safeUrl, formatDate } from '../../../../lib/evidence-render.js';
import { ensureStylesheet } from './criteria.js';

ensureStylesheet('ledger.css', import.meta.url);

let legendPromise = null;
// { code: name } from data/processed/koppen-legend.json; {} when the file cannot be read.
function loadLegend() {
  if (!legendPromise) {
    legendPromise = fetch(new URL('../../../../data/processed/koppen-legend.json', import.meta.url))
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => Object.fromEntries(((j && j.classes) || []).filter((c) => c && c.code).map((c) => [c.code, c.name])))
      .catch(() => ({}));
  }
  return legendPromise;
}

// The two periods the compact line names: the 1991 observation and the 2041 projection (same choice as the library).
function shownCodes(koppen) {
  const periods = (koppen && koppen.periods) || {};
  const keys = Object.keys(periods);
  const now = keys.find((k) => /^1991/.test(k));
  const later = keys.find((k) => /^2041/.test(k));
  return [now, later].filter(Boolean).map((k) => periods[k].dominant).filter((c, i, a) => c && a.indexOf(c) === i);
}

function sourceBit(src) {
  if (!src || typeof src !== 'object' || !String(src.name || '').trim()) return '';
  const url = safeUrl(src.url);
  const name = url ? `<a href="${esc(url)}" rel="noopener">${esc(src.name)}</a>` : esc(src.name);
  const lic = String(src.licence || '').trim() ? esc(src.licence) : 'licence not confirmed';
  const got = String(src.retrieved || '').trim() ? ` · retrieved ${esc(formatDate(src.retrieved))}` : '';
  return `${name} · ${lic}${got}`;
}

export default {
  id: 'context',
  render(ctx) {
    const c = ctx.data && ctx.data.context && ctx.data.context[ctx.id];
    if (!c) return null;
    const lines = contextHtml(c, { mode: 'drawer' });
    if (!lines) return null;
    ensureStylesheet('ledger.css', import.meta.url);

    const section = document.createElement('section');
    section.className = 'drawer-ctx';
    section.setAttribute('aria-labelledby', 'drawer-ctx-t');
    const bits = [sourceBit(c.koppen && c.koppen.source), sourceBit(c.water && c.water.source)].filter(Boolean);
    const regionId = /^[\w-]+$/.test(String(ctx.id)) ? ctx.id : '';
    section.innerHTML = `<h4 id="drawer-ctx-t">Climate and water, in short</h4>${lines}`
      + '<p class="ctx-names" hidden></p>'
      + (bits.length ? `<p class="ctx-src">Sources: ${bits.join('; ')}.</p>` : '')
      + (regionId ? `<p class="ctx-more"><a href="region/${regionId}.html">The full record, every period and share, is on the region page</a></p>` : '');

    const codes = shownCodes(c.koppen);
    if (codes.length) {
      const names = section.querySelector('.ctx-names');
      loadLegend().then((legend) => {
        const parts = codes.filter((code) => legend[code]).map((code) => `${code}, ${legend[code].toLowerCase()}`);
        if (parts.length && names) { names.textContent = `Köppen-Geiger classes in words: ${parts.join('; ')}.`; names.hidden = false; }
      });
    }
    return section;
  },
};
