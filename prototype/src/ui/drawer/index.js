// The region drawer shell: open, close, focus handling and the block loop. What the drawer says lives in blocks/.
// The drawer opens on the bus event drawer:open { regionId } (cards, chips, markers and the next-step button emit it).
//
// Layering and focus belong to the overlay manager (ui/overlays.js): the drawer registers with open() and close(); the
// manager makes #main inert, owns Escape and the Tab trap, and puts focus back on whatever opened the drawer. The signup
// modal may open over the drawer (it is above it, z-index 1200 against 1100) and then Escape closes only the modal.

import * as dataBundle from '../../data.js';
import { loadDrawerData, loadFullData, regions, values, criteria } from '../../data.js';
import { state } from '../../state.js';
import * as bus from '../../bus.js';
import { el } from '../dom.js';
import { trackEvent } from '../analytics.js';
import { open as openOverlay, close as closeOverlay, has as overlayHas } from '../overlays.js';
import { fmtVal, normalize, rampColor, textSafeColor } from '../../../lib/format.js';

const NAME = 'region-drawer';

// HTML-escapes text for blocks that build markup strings. Blocks that use el() and textContent never need it.
function esc(text) {
  return String(text == null ? '' : text)
    .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;').replaceAll("'", '&#39;');
}

const helpers = { fmtVal, normalize, rampColor, textSafeColor };

// The 12px region-coloured wave across the top of the leaf (design 8.10). Decorative; the markup in index.html has none,
// so it is added once. Its colour is --region on the panel, set for each region at open.
function ensureWave(backdrop) {
  const leaf = backdrop && backdrop.querySelector('.drawer-panel');
  if (!leaf || leaf.querySelector(':scope > .wave')) return;
  const wave = document.createElement('span');
  wave.className = 'wave';
  wave.setAttribute('aria-hidden', 'true');
  leaf.insertBefore(wave, leaf.firstChild);
}

// Waits (at most 1.5 s) for the injected stylesheets to arrive, so the first open never paints unstyled blocks.
function stylesReady() {
  const pending = Array.from(document.querySelectorAll('link[rel="stylesheet"][data-injected-by="drawer-block"]'))
    .filter((l) => !l.sheet);
  if (!pending.length) return Promise.resolve();
  return Promise.race([
    Promise.all(pending.map((l) => new Promise((done) => {
      l.addEventListener('load', done, { once: true });
      l.addEventListener('error', done, { once: true });
    }))),
    new Promise((done) => setTimeout(done, 1500)),
  ]);
}

function hideDrawer() {
  const panel = document.getElementById(NAME);
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

export async function openDrawer(regionId) {
  const r = regions.find((x) => x.id === regionId);
  const panel = document.getElementById(NAME);
  const body = document.getElementById('drawer-body');
  if (!r || !panel || !body) return;

  // Focus is read before the first await: by the time the data module has loaded, the visitor may have moved on.
  const returnTo = document.activeElement;

  // The drawer-only code and data load on first open (MC-PERF, G8: none of it is on the first-paint path): the block
  // manifest with its blocks and lib/bio.js, the legal pathway and context modules, and the full reciprocity prose (Land
  // standing, region depth). A failed load must not keep the drawer shut: blocks read these bundles defensively.
  const [drawerData, fullData, blocks] = await Promise.all([
    loadDrawerData().catch(() => ({ legalPathway: {}, context: {} })),
    loadFullData().catch(() => ({})),
    import('./blocks/manifest.js').then((m) => m.blocks).catch((err) => { console.error('Drawer blocks failed to load:', err); return []; }),
  ]);
  // The block stylesheets are injected by the manifest on import, so they are waited for after it.
  await stylesReady();

  while (body.firstChild) body.removeChild(body.firstChild);

  const ctx = {
    id: r.id,
    region: r,
    values: values[r.id],
    criteria,
    data: { ...dataBundle, ...fullData, ...drawerData },
    state,
    el,
    esc,
    bus: { on: bus.on, off: bus.off, emit: bus.emit },
    helpers,
  };
  for (const block of blocks) {
    let node = null;
    try {
      node = block.render(ctx);
    } catch (err) {
      console.error(`Drawer block "${block.id}" failed:`, err);
    }
    if (node) body.appendChild(node);
  }
  body.scrollTop = 0;

  ensureWave(panel);
  const leaf = panel.querySelector('.drawer-panel');
  if (leaf) leaf.style.setProperty('--region', r.accent);
  panel.setAttribute('aria-label', `${r.name} — region detail`);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  openOverlay(NAME, { panel, trigger: returnTo, onClose: hideDrawer });
  const closeBtn = document.getElementById('drawer-close');
  if (closeBtn) setTimeout(() => { if (overlayHas(NAME)) closeBtn.focus(); }, 50);
  trackEvent('drawer_open', { region: regionId });
}

export function closeDrawer() {
  // close() runs hideDrawer through onClose; the fallback covers a drawer that was never registered.
  if (!closeOverlay(NAME)) hideDrawer();
}

// Printing the drawer expands every per-row source list, so a printed Land standing block carries its sources in full.
function expandForPrint(on) {
  document.querySelectorAll('#region-drawer details.ls-claims').forEach((d) => {
    if (on) { d.dataset.wasOpen = d.open ? '1' : ''; d.open = true; }
    else if ('wasOpen' in d.dataset) { d.open = d.dataset.wasOpen === '1'; delete d.dataset.wasOpen; }
  });
}

export function initDrawer() {
  const closeBtn = document.getElementById('drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  const panel = document.getElementById(NAME);
  if (panel) {
    ensureWave(panel);
    panel.addEventListener('click', (e) => { if (e.target === panel) closeDrawer(); });
  }
  // Escape and the Tab trap are the overlay manager's single document listener: nothing to bind here.
  bus.on('drawer:open', (payload) => {
    if (payload && payload.regionId) openDrawer(payload.regionId).catch((err) => console.error('Drawer failed to open:', err));
  });
  window.addEventListener('beforeprint', () => expandForPrint(true));
  window.addEventListener('afterprint', () => expandForPrint(false));
}
