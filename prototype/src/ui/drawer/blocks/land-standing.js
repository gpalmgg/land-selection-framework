// Drawer block: Land standing, version 2 (BIO-4; upgraded in place from the v1 renderer MC-JS-2 extracted).
//
// "Land standing": whose land this is, the tenure regime, the good-faith way in, and what the obligation of
// arriving carries. A qualitative reciprocity dimension, never scored, never a filter, never numbered. Nothing
// renders for a region without an entry.
//
// The markup comes from lib/bio.js (landStandingV2Html), the same function the region pages use, so the drawer and
// the pages serialise identically. A region with a verified reciprocity entry gets the v2 block (lead sentence,
// disputed standing, per-row sources, direction of change, where the answer is not here, first conversations,
// source, provenance, consent line, arrive link). Any other region gets the v1 block unchanged plus the additive
// provenance, consent and arrive elements. The CSS for the class hooks (.drawer-land-standing, .braid, .ls-*) is
// owned by MC-DRAWER.

import { landStandingV2Html } from '../../../../lib/bio.js';

export default {
  id: 'land-standing',
  render(ctx) {
    const { region: r } = ctx;
    const d = ctx.data || {};
    if (!d.landStanding || !d.landStanding[r.id]) return null;
    const html = landStandingV2Html(r.id, {
      escape: ctx.esc,
      name: r.name,
      data: {
        landStanding: d.landStanding,
        reciprocity: d.reciprocity,
        bioregions: d.bioregions,
        kindLabels: d.reciprocityKindLabels,
      },
    });
    if (!html) return null;
    const t = document.createElement('template');
    t.innerHTML = html;
    return t.content.firstElementChild;
  },
};
