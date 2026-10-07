// Drawer block: "What living here asks of you" (design 8.10, reading order step 5). Owner: MC-DRAWER.
//
// A 3px accent rule on an accent wash, the asks in Spectral italic, a source line and, where the region has one, the
// deep link to its case study in the deeper material. Asks come before offers (the covenant's rule), so this block sits
// before the place strip, the way in and the numbers. A region without a depth entry renders nothing.

const ARROW = '<svg class="arrow" aria-hidden="true" focusable="false" viewBox="0 0 16 10" width="14" height="9"><path d="M1 5h12M9 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

export default {
  id: 'asks',
  render(ctx) {
    const { el, region: r } = ctx;
    const depth = ctx.data.regionDepth && ctx.data.regionDepth[r.id];
    if (!depth || (!depth.asks && !depth.caseStudy)) return null;
    const section = el('section', { className: 'drawer-asks', attrs: { 'aria-labelledby': `drawer-asks-t-${r.id}` } });
    section.appendChild(el('h4', { text: 'What living here asks of you', attrs: { id: `drawer-asks-t-${r.id}` } }));
    if (depth.asks) section.appendChild(el('p', { className: 'drawer-asks-text', text: depth.asks }));
    if (depth.source) {
      const src = el('div', { className: 'drawer-asks-src' });
      src.appendChild(document.createTextNode('Source: '));
      if (depth.sourceUrl) {
        const a = el('a', { text: depth.source, attrs: { href: depth.sourceUrl, target: '_blank', rel: 'noopener' } });
        a.appendChild(el('span', { className: 'sr-only', text: ' (opens in a new tab)' }));
        src.appendChild(a);
      } else {
        src.appendChild(document.createTextNode(depth.source));
      }
      section.appendChild(src);
    }
    if (depth.caseStudy) {
      const a = el('a', { className: 'drawer-deeplink', attrs: { href: `deeper.html${depth.caseStudy}` } });
      a.appendChild(document.createTextNode('Read the full case study'));
      a.insertAdjacentHTML('beforeend', ARROW);
      section.appendChild(a);
    }
    return section;
  },
};
