// Drawer block: the blurb and the link to the region's own page (design 8.10, reading order step 2).
// Owner: MC-DRAWER.
//
// "Open X as a full page" is the permalink to the region's indexable page (internal linking and a shareable deep link;
// the page links back into the tool pre-pinned to this region). "How to arrive in X" is part of the Land standing block
// (BIO-4 renders it as `.ls-arrive`, design 8.11), so it is not repeated here: one link, one place.
// The arrow is inline SVG: U+2192 is not in the Spectral subset.

const ARROW = '<svg class="arrow" aria-hidden="true" focusable="false" viewBox="0 0 16 10" width="14" height="9"><path d="M1 5h12M9 1l4 4-4 4" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>';

export default {
  id: 'blurb',
  render(ctx) {
    const { el, region: r } = ctx;
    const section = el('section', { className: 'drawer-intro', attrs: { 'aria-label': `About ${r.name}` } });
    section.appendChild(el('p', { className: 'drawer-blurb', text: r.blurb }));
    const link = el('a', { className: 'drawer-fulllink', attrs: { href: `/region/${r.id}.html` } });
    link.appendChild(document.createTextNode(`Open ${r.name} as a full page`));
    link.insertAdjacentHTML('beforeend', ARROW);
    section.appendChild(link);
    return section;
  },
};
