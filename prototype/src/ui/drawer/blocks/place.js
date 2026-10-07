// Drawer block: place (the place strip), BIO-4.
//
// How a region is introduced by its place: the descriptive label, "Where it sits" and "Where the water goes", and the
// fixed caption. Built from data/bioregions.js alone, so it exists for every region. It is its own block: the
// manifest orders it after the refusal and the asks, and Land standing leads (final-spec 15.5 #1).
// Descriptive, never an official or Indigenous name, never "within": the ecoregion list is computed around a
// reference point, not a footprint. The strings come from lib/bio.js, never from this file. CSS: MC-DRAWER.

import { placeStripHtml } from '../../../../lib/bio.js';

export default {
  id: 'place',
  render(ctx) {
    const { region: r } = ctx;
    const d = ctx.data || {};
    if (!d.bioregions || !d.bioregions[r.id]) return null;
    const html = placeStripHtml(r.id, { escape: ctx.esc, data: { bioregions: d.bioregions } });
    if (!html) return null;
    const t = document.createElement('template');
    t.innerHTML = html;
    return t.content.firstElementChild;
  },
};
