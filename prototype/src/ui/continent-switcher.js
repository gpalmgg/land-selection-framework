// Continent switcher, render-both-and-toggle.
// All regions live in the DOM; switching just sets body[data-continent],
// which CSS uses to show/hide each continent's cards, bars, summary columns
// and markers. Thresholds are per-criterion, so a switch never disturbs them
// (AC-5 falls out for free). The switcher itself only renders when more than
// one continent has data.
//
// The hiding rule is generated, not written per continent: injectContinentRules() puts one rule per key of CONTINENTS
// into <style id="continent-rules">, so adding a continent to src/config/continents.js needs no CSS edit. (The old
// two-continent rule in styles/map.css still says the same thing for Europe and North America; MC-MAP-UI deletes it.)
// The tab is part of the shareable state: a switch writes ?c= (src/ui/url-sync.js listens to continent:change) and a
// link opens on the tab it names (applyURLState sets state.continent before the first render).
//
// The map half of a switch (re-centre, swap the per-continent GeoJSON) answers the bus event continent:change in
// main.js until MC-JS-3 moves it into src/map/. The document event lsf:continentchange keeps firing for anyone
// outside the bundle.

import { state } from '../state.js';
import { emit } from '../bus.js';
import { CONTINENTS, continentsPresent } from '../config/continents.js';
import { el } from './dom.js';
import { trackEvent } from './analytics.js';

// The CSS that hides every node tagged with another continent than the active one. The tabs themselves carry
// data-continent too (they are controls, not continent content), so they are excluded.
export function continentRulesCss() {
  return Object.keys(CONTINENTS).map((c) =>
    `body[data-continent="${c}"] [data-continent]:not([data-continent="${c}"]):not(.continent-tab) { display: none !important; }`
  ).join('\n');
}

// Creates or refreshes <style id="continent-rules"> in the head. Safe to call twice.
export function injectContinentRules() {
  let tag = document.getElementById('continent-rules');
  if (!tag) {
    tag = document.createElement('style');
    tag.id = 'continent-rules';
    document.head.appendChild(tag);
  }
  const css = continentRulesCss();
  if (tag.textContent !== css) tag.textContent = css;
}

export function setContinent(c) {
  if (!CONTINENTS[c] || c === state.continent) return;
  state.continent = c;
  document.body.dataset.continent = c;

  // The map half: re-centre to the active continent (no re-init, layers persist) and swap the processed layers.
  emit('continent:change', { continent: c });

  // Reflect active tab.
  document.querySelectorAll('.continent-tab').forEach((btn) => {
    const on = btn.dataset.continent === c;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
  });

  emit('refresh');
  // Let independently-rendered consumers react.
  document.dispatchEvent(new CustomEvent('lsf:continentchange', { detail: { continent: c } }));
  trackEvent('continent_switch', { continent: c });
}

export function initContinentSwitcher() {
  injectContinentRules();
  const present = continentsPresent();
  // One continent (current state) → no switcher, no visual change at all.
  if (present.length < 2) return;

  const mount = document.getElementById('continent-switcher');
  if (!mount) return;
  mount.hidden = false;
  mount.setAttribute('role', 'tablist');
  mount.setAttribute('aria-label', 'Choose a continent');

  present.forEach((c) => {
    const btn = el('button', { className: 'continent-tab', text: CONTINENTS[c].label });
    btn.type = 'button';
    btn.dataset.continent = c;
    btn.setAttribute('role', 'tab');
    const on = c === state.continent;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
    btn.addEventListener('click', () => setContinent(c));
    btn.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      e.preventDefault();
      const i = present.indexOf(state.continent);
      const next = e.key === 'ArrowRight'
        ? present[(i + 1) % present.length]
        : present[(i - 1 + present.length) % present.length];
      setContinent(next);
      const nextBtn = mount.querySelector(`.continent-tab[data-continent="${next}"]`);
      if (nextBtn) nextBtn.focus();
    });
    mount.appendChild(btn);
  });
}
