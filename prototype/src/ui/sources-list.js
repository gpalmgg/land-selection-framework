// The distinct data sources behind the criteria, one line each: the source (a link where it has one) and, where known, its
// licence. Filled into #sources-list in the colophon.

import { criteria } from '../data.js';
import { el } from './dom.js';

export function renderSourcesList() {
  const ul = document.getElementById('sources-list');
  if (!ul) return;
  while (ul.firstChild) ul.removeChild(ul.firstChild);
  const seen = new Set();
  criteria.forEach((c) => {
    if (!c.source || seen.has(c.source)) return;
    seen.add(c.source);
    const li = el('li');
    if (c.sourceUrl) {
      const a = el('a', { text: c.source, attrs: { href: c.sourceUrl, target: '_blank', rel: 'noopener' } });
      a.style.color = 'var(--ink-2)';
      a.style.textDecoration = 'underline dotted';
      a.style.textUnderlineOffset = '2px';
      li.appendChild(a);
    } else {
      li.appendChild(document.createTextNode(c.source));
    }
    if (c.license) li.appendChild(document.createTextNode(` (${c.license})`));
    ul.appendChild(li);
  });
}
