// Drawer block: the refusal band (design 8.12, reading order step 4). Owner: MC-DRAWER.
//
// The tool's stance: the
// canon refusal sentence (data/site-facts.js, copied from the docs track's canonical-copy file) and one small line.
// It is STATIC and IDENTICAL in every drawer: it is the stance of the tool, never a verdict on a place, so nothing in it
// depends on the region, and it does not move. The region-specific "where the answer is not here" is BIO-4's `.ls-notthere`.

import { canon } from '../../../../data/site-facts.js';

const SMALL = 'Every region in this tool is already someone’s home.';

export default {
  id: 'refusal',
  render(ctx) {
    const { el } = ctx;
    const section = el('section', { className: 'refusal', attrs: { 'aria-label': 'Where arriving would harm' } });

    section.appendChild(el('p', { text: canon.refusal }));
    section.appendChild(el('small', { text: SMALL }));
    return section;
  },
};
