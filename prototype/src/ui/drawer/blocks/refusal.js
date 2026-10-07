// Drawer block: the refusal band (design 8.12, reading order step 4). Owner: MC-DRAWER.
//
// The tool's stance, drawn: a river that runs, breaks into a dotted gap and stops at a bar (REFUSAL, lib/linework.js), the
// canon refusal sentence (data/site-facts.js, copied from the docs track's canonical-copy file) and one small line.
// It is STATIC and IDENTICAL in every drawer: it is the stance of the tool, never a verdict on a place, so nothing in it
// depends on the region, and it does not move. The region-specific "where the answer is not here" is BIO-4's `.ls-notthere`.

import { REFUSAL } from '../../../../lib/linework.js';
import { canon } from '../../../../data/site-facts.js';

const SMALL = 'Every region in this tool is already someone’s home. The river stops here by choice.';

function stream() {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('viewBox', REFUSAL.viewBox);
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  [[REFUSAL.river, '2.2', null], [REFUSAL.gap, '2.2', '2 7'], [REFUSAL.bar, '3.2', null]].forEach(([d, w, dash]) => {
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke-width', w);
    if (dash) path.setAttribute('stroke-dasharray', dash);
    svg.appendChild(path);
  });
  return svg;
}

export default {
  id: 'refusal',
  render(ctx) {
    const { el } = ctx;
    const section = el('section', { className: 'refusal', attrs: { 'aria-label': 'Where arriving would harm' } });
    section.appendChild(stream());
    section.appendChild(el('p', { text: canon.refusal }));
    section.appendChild(el('small', { text: SMALL }));
    return section;
  },
};
