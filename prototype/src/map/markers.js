// The region markers: DOM markers (not GeoJSON) so they can be styled as real labels. A marker opens the same
// drawer as its card, through the bus (this folder never imports the drawer). `updateMarkers()` marks every region
// that misses a threshold; refresh.js reaches it through runtime.hooks.updateMarkers, set by initMarkers().
//
// A marker is a 0x0 anchor at the point with three children: `.hit` (a 44px tap target, transparent), inside it the
// 30px `.chip` (a paper centre inside a 4px ring in the region's colour, the mark in ink: the identity colour is a
// non-text ring, so the text is always ink on paper) and, beside it, the `.region-label` pill. The pill shows the short
// name at rest and, on hover and keyboard focus, a second line "Whose land: ..." (Spectral italic, the Salutation).
// The marker's aria-label ALWAYS carries the full name and whose land it is, so no pointer or screen-reader user meets a
// name without its land. The mark is unique within the continent (lib/marks.js: Alentejo "Al", Asturias "As").
//
// Which side the pill sits on is decided by labels.js (placement), which listens for the bus event `map:markers` this
// file emits once every marker exists, and for `markers:updated` after each filter change.
//
// RCA bug 2: updateMarkers() runs at the end of createMarkers(), so a share link that restores filters opens with the
// outside markers already dashed. state.passing is computed by refreshAll() before the map exists, so it is current.

import { regions } from '../data.js';
import { state, runtime } from '../state.js';
import { emit } from '../bus.js';
import { el } from '../ui/dom.js';
import { assignMarks, markLabel } from '../../lib/marks.js';
import { salutation, salutationLabel } from '../../lib/salutation.js';

// The name shown on the pill at rest: the region's short name, else the part before a parenthesis.
export function pillName(r) {
  if (r.short) return r.short;
  const head = String(r.name).split(' (')[0].trim();
  return head || r.name;
}

// Per region, what updateMarkers needs to rewrite the aria-label: kept in a WeakMap so the DOM stays plain.
const info = new WeakMap();

export function createMarkers(map, lib) {
  const marks = assignMarks(regions);
  regions.forEach((r) => {
    const sal = salutation(r.id);
    const wrap = el('div', { className: 'region-marker' });
    wrap.dataset.continent = r.continent;
    wrap.dataset.region = r.id;
    wrap.style.setProperty('--region', r.accent);   // tokens.css derives --region-ui (the ring) from any element that sets --region inline

    const hit = el('span', { className: 'hit' });
    hit.setAttribute('aria-hidden', 'true');
    const mark = marks[r.id] || '?';
    const chip = el('span', { className: 'chip' + (Array.from(mark).length > 1 ? ' two' : ''), text: mark });
    hit.appendChild(chip);
    wrap.appendChild(hit);

    // The pill: the short name, then (shown on hover and focus) the Salutation as real text.
    const label = el('div', { className: 'region-label' });
    label.setAttribute('aria-hidden', 'true');   // the aria-label below carries the name and whose land
    label.appendChild(el('span', { className: 'nm', text: pillName(r) }));
    const land = el('small', { className: 'land' });
    land.textContent = `${salutationLabel(sal.contested)}: ${sal.text || 'not yet recorded here'}`;
    label.appendChild(land);
    wrap.appendChild(label);

    wrap.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); emit('drawer:open', { regionId: r.id }); }
    });
    // Clicking a marker opens the same region detail drawer as its card.
    wrap.addEventListener('click', (e) => { e.stopPropagation(); emit('drawer:open', { regionId: r.id }); });

    new lib.Marker({ element: wrap }).setLngLat(r.coords).addTo(map);

    // After addTo: the library writes its own attributes on the element when it is added, so ours go on last.
    wrap.setAttribute('role', 'button');
    wrap.setAttribute('tabindex', '0');
    info.set(wrap, { region: r, text: sal.text, contested: sal.contested });
    wrap.setAttribute('aria-label', markLabel(r, sal.text, { contested: sal.contested }));
    runtime.regionMarkers[r.id] = wrap;
  });
  updateMarkers();           // URL-restored filters dim at once
  emit('map:markers', { map });
}

// Marks the marker of every region that misses a threshold: dashed ring on the recessed ground, never hidden, never
// sized by a value. The aria-label says so too.
export function updateMarkers() {
  regions.forEach((r) => {
    const marker = runtime.regionMarkers[r.id];
    if (!marker) return;
    const out = !state.passing[r.id];
    marker.classList.toggle('dim', out);
    const i = info.get(marker);
    if (i) marker.setAttribute('aria-label', markLabel(i.region, i.text, { contested: i.contested, outside: out }));
  });
  emit('markers:updated');
}

export function initMarkers() {
  runtime.hooks.updateMarkers = updateMarkers;
}
