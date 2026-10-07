// Drawer block: the way in, compact (MC-LEDGER, design 8.14).
//
// What lawful, relational entry involves, in three rows (who may hold, how a group can hold or the first claim, and
// the direction of the law) with a link to the full pathway on the region page. Qualitative orientation: not legal
// advice, never a rank, never a filter, and a restricted region stays fully visible. The markup comes from
// legalPathwayHtml (lib/evidence-render.js), the same function the region page calls in full mode, so the two never
// drift. A region without an entry renders nothing (the completeness gate is the generator's job).
//
// The constant not-advice sentence belongs to the page version; the compact block carries the tag "The way in,
// qualitative, not legal advice" and the label "Context, not advice", and points to the page for the rest.
//
// No enum token is ever printed: the library prints the entry's own words and the direction in words, and anything
// qualitative added here would go through qualLabel (lib/qual-labels.js). styles/way.css carries the CSS.

import { legalPathwayHtml, LEGAL_NOT_ADVICE, esc } from '../../../../lib/evidence-render.js';
import { ensureStylesheet } from './criteria.js';

ensureStylesheet('way.css', import.meta.url);

export default {
  id: 'way',
  render(ctx) {
    const entry = ctx.data && ctx.data.legalPathway && ctx.data.legalPathway[ctx.id];
    if (!entry) return null;
    ensureStylesheet('way.css', import.meta.url);
    let html = legalPathwayHtml(entry, { mode: 'drawer', idPrefix: 'drawer-way', regionId: ctx.id });
    if (!html) return null;
    html = html.split(esc(LEGAL_NOT_ADVICE)).join('').replace('Context, not advice</b> ', 'Context, not advice</b>');
    const t = document.createElement('template');
    t.innerHTML = html;
    return t.content.firstElementChild;
  },
};
