// The per-criterion "Sources for ..." <details> at the foot of each criterion block: one ledger line per region, with the
// value on a dotted leader and, beneath it, the label, the source (linked), the vintage, the licence, the retrieval date
// and how the number was made. It is collapsed by default. The lines come from the same evidence renderer the drawer
// ledger uses (lib/evidence-render.js), so a cell prints its provenance the same way everywhere.
//
// ui/criteria.js calls buildSourcesBlock() while it builds a block, so the markup and its place (inside the plot column,
// under the key) never depend on a timing hack. initCriteriaSources() still registers the old hook
// (runtime.hooks.criterionSources) and keeps the "(N regions)" counts in step with the active continent.
//
// Nothing here scores, sorts or counts anything but the regions in view: lines keep the order the regions were written.

import { regions, values, sources } from '../data.js';
import { runtime } from '../state.js';
import { on } from '../bus.js';
import { el } from './dom.js';
import { fmtCell, provenanceLine, GAP_VALUE } from '../../lib/evidence-render.js';

const activeContinent = () => document.body.dataset.continent || 'europe';
const regionCountFor = (c) => regions.filter((r) => r.continent === c).length;

// The sentence of the summary: "Sources for water stress (15 regions)". The count is words-only data, never typed.
function summaryText(name, n) {
  return `Sources for ${String(name || '').toLowerCase()} (${n} ${n === 1 ? 'region' : 'regions'})`;
}

// One region's line: name on a leader, the value on the right, the provenance line beneath. A null cell keeps its line
// and says so ("not yet verified"), with its reason; it is neither a pass nor a fail.
function sourceLine(r, crit, cell) {
  const li = el('li');
  li.dataset.continent = r.continent; // CSS hides the inactive continent's lines
  li.dataset.region = r.id;
  const f = fmtCell(cell, crit);
  const isGap = f.text === 'not verified';
  if (isGap) li.className = 'gap';

  li.appendChild(el('span', { className: 'reg-name', text: r.name }));
  const vv = el('span', { className: 'src-val' });
  if (isGap) {
    vv.textContent = GAP_VALUE;
  } else {
    vv.appendChild(document.createTextNode(f.text));
    if (f.unit) vv.appendChild(el('small', { text: f.unit }));
  }
  li.appendChild(vv);

  const sb = el('div', { className: 'sb' });
  if (!cell) {
    sb.textContent = 'No source recorded for this cell.';
  } else if (isGap) {
    const reason = f.reason || 'Re-check pending.';
    sb.appendChild(el('i', { text: reason }));
    if (cell.source) sb.appendChild(document.createTextNode(` Source named: ${cell.source}.`));
  } else {
    // innerHTML is safe here: provenanceLine escapes every field and only emits http(s) links.
    sb.innerHTML = provenanceLine(cell, crit, sources, { trajectory: false });
  }
  li.appendChild(sb);
  return li;
}

export function buildSourcesBlock(crit) {
  const det = el('details', { className: 'sources' });
  const sum = el('summary', { text: summaryText(crit.name, regionCountFor(activeContinent())) });
  sum.dataset.critName = crit.name.toLowerCase();
  det.appendChild(sum);

  const ul = el('ul');
  regions.forEach((r) => {
    const cell = values[r.id] && values[r.id][crit.id];
    ul.appendChild(sourceLine(r, crit, cell || null));
  });
  det.appendChild(ul);
  return det;
}

// Registers the hook (kept for callers that still ask for it) and keeps the per-criterion counts in step with the
// active continent.
export function initCriteriaSources() {
  runtime.hooks.criterionSources = buildSourcesBlock;
  on('continent:change', () => {
    const n = regionCountFor(activeContinent());
    document.querySelectorAll('.crit-card .sources > summary').forEach((sum) => {
      sum.textContent = summaryText(sum.dataset.critName || '', n);
    });
  });
}
