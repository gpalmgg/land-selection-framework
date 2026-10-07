// Pins: a user-pinned Set (never ranked). Pinning is requested with the bus event pin:toggle (the card Pin button and the
// drawer Pin button emit it); this module owns the toggle, then announces pin:changed so the compare view can redraw.
// The same mark and words everywhere: the Pin icon with "Pin" / "Pinned" and aria-pressed. No star glyph.
//
// Names kept from the star-era module so importers and the analytics event keep working: toggleStar, updateStarVisuals.

import { regions } from '../data.js';
import { state } from '../state.js';
import { on, emit } from '../bus.js';
import { trackEvent } from './analytics.js';
import { PIN_ICON } from './region-grid.js';

const nameOf = (id) => {
  const r = regions.find((x) => x.id === id);
  return r ? r.name : id;
};

// Puts the Pin icon, the words and the pressed state on a pin button. Idempotent: a button already showing this state
// is left alone (a MutationObserver watches the drawer, so a rewrite must never retrigger it).
function paintPin(btn, id, pinned) {
  const key = pinned ? 'on' : 'off';
  btn.classList.toggle('on', pinned);
  btn.setAttribute('aria-pressed', String(pinned));
  btn.setAttribute('aria-label', pinned ? `Pinned ${nameOf(id)}` : `Pin ${nameOf(id)}`);
  if (btn.dataset.pinUi === key) return;
  btn.dataset.pinUi = key;
  btn.innerHTML = PIN_ICON;
  const word = document.createElement('span');
  word.textContent = pinned ? 'Pinned' : 'Pin';
  btn.appendChild(word);
}

export function toggleStar(regionId) {
  if (state.shortlist.has(regionId)) state.shortlist.delete(regionId);
  else state.shortlist.add(regionId);
  // Persist immediately, flush any pending threshold debounce so we don't race it.
  emit('filters:change', { source: 'pin', immediate: true });
  updateStarVisuals();
  updateShortlistCount();
  emit('pin:changed', { regionId, pinned: state.shortlist.has(regionId) });
  trackEvent('shortlist_toggle', { region: regionId, size: state.shortlist.size });
}
export const togglePin = toggleStar;

// The drawer's own pin button (head block): `.drawer-star` today, a `.region-pin` carrying data-region once MC-DRAWER lands.
function drawerPin() {
  return document.querySelector('#region-drawer .drawer-star[data-region], #region-drawer .region-pin[data-region]');
}

function syncDrawerPin() {
  const btn = drawerPin();
  if (!btn || !btn.dataset.region) return;
  paintPin(btn, btn.dataset.region, state.shortlist.has(btn.dataset.region));
}

export function updateStarVisuals() {
  regions.forEach((r) => {
    const on = state.shortlist.has(r.id);
    const card = document.getElementById(`region-${r.id}`);
    if (!card) return;
    card.classList.toggle('starred', on);
    const pin = card.querySelector('.region-pin');
    if (pin) paintPin(pin, r.id, on);
  });
  syncDrawerPin();
}
export const updatePinVisuals = updateStarVisuals;

// "Your pins (n)": into #pin-count-label when the button has one (icon + label), else the button's own text.
export function updateShortlistCount() {
  const btn = document.getElementById('shortlist-btn');
  if (!btn) return;
  const n = state.shortlist.size;
  const text = `Your pins (${n})`;
  const label = btn.querySelector('#pin-count-label');
  if (label) label.textContent = text;
  else if (!btn.children.length) btn.textContent = text;
  btn.setAttribute('aria-label', `${text}: open them side by side, ${n} ${n === 1 ? 'region' : 'regions'} pinned`);
}

// Subscribes to pin:toggle and reflects any ?pin= regions restored from the URL.
export function initShortlist() {
  on('pin:toggle', (payload) => { if (payload && payload.regionId) toggleStar(payload.regionId); });
  // The drawer rebuilds its body on every open; show the Pin mark on whatever pin button the head block builds.
  const body = document.getElementById('drawer-body');
  if (body && typeof MutationObserver === 'function') {
    new MutationObserver(syncDrawerPin).observe(body, { childList: true });
  }
  updateStarVisuals();
  updateShortlistCount();
}
