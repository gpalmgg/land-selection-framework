// How the map library arrives. MapLibre is a classic <script> in index.html, so normally it is already on the page when
// the boot code runs and this resolves at once with the global. When it is not (the script was moved to load on demand
// behind LAZY_MAP in config/flags.js, or its tag failed or is still pending), the script is injected here with a 10
// second timeout; a library that does not arrive in time, or fails to load, leaves the page's map fallback in place
// (showMapFallback) and resolves undefined. It never rejects and never throws: callers treat `undefined` as "no map".
//
// WHEN IT ARRIVES (MC-PERF, LAZY_MAP): with no <script> tag in the page the library (217 KB brotli) is the largest thing the
// home page would fetch before its load event, so the injection waits for a gate: the browser is idle after the load event
// (capped at 2.5 s), or #map comes within 600 px of the viewport, whichever is first (an 8 s backstop covers a browser that
// never reports either). The map is therefore on screen before a visitor can scroll to it, and the first paint, the cards and
// the criteria no longer compete with it for the network. A page that still carries its own tag skips the gate.

import { showMapFallback } from './fallback.js';

export const MAPLIBRE_SCRIPT = '/vendor/maplibre-4.7.1/maplibre-gl.js';
export const MAPLIBRE_STYLE = '/vendor/maplibre-4.7.1/maplibre-gl.css';
export const LOAD_TIMEOUT_MS = 10000;

let pending = null;

export const GATE_IDLE_CAP_MS = 2500;
export const GATE_NEAR_PX = 600;
export const GATE_BACKSTOP_MS = 8000;

function hasPageTag() {
  return !!document.querySelector('script[src*="maplibre-gl"]');
}

// Resolves once the library may be requested. Never rejects.
export function mapGate() {
  return new Promise((resolve) => {
    let done = false;
    let io = null;
    const go = () => {
      if (done) return;
      done = true;
      if (io) io.disconnect();
      resolve();
    };
    const afterLoad = () => {
      const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200));
      idle(go, { timeout: GATE_IDLE_CAP_MS });
    };
    if (document.readyState === 'complete') afterLoad();
    else window.addEventListener('load', afterLoad, { once: true });
    const stage = document.getElementById('map');
    if ('IntersectionObserver' in window && stage) {
      io = new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) go(); }, { rootMargin: GATE_NEAR_PX + 'px 0px' });
      io.observe(stage);
    }
    setTimeout(go, GATE_BACKSTOP_MS);
  });
}

function present() {
  return typeof maplibregl === 'undefined' ? undefined : maplibregl;
}

// The URL the page itself already uses for the library (a tag in index.html), else the vendored default.
function scriptSrc() {
  const tag = document.querySelector('script[src*="maplibre-gl"]');
  return (tag && tag.getAttribute('src')) || MAPLIBRE_SCRIPT;
}

function ensureStylesheet() {
  if (document.querySelector('link[href*="maplibre-gl"]')) return;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = MAPLIBRE_STYLE;
  document.head.appendChild(link);
}

export function ensureMapLibre() {
  const lib = present();
  if (lib) return Promise.resolve(lib);
  if (pending) return pending;
  pending = (hasPageTag() ? Promise.resolve() : mapGate()).then(() => new Promise((resolve) => {
    let settled = false;
    const finish = (value, why) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (!value) {
        console.info('map: MapLibre did not load (' + why + '); showing the map fallback.');
        showMapFallback();
      }
      resolve(value);
    };
    const timer = setTimeout(() => finish(undefined, 'timed out after ' + LOAD_TIMEOUT_MS / 1000 + ' s'), LOAD_TIMEOUT_MS);
    try {
      ensureStylesheet();
      const s = document.createElement('script');
      s.src = scriptSrc();
      s.async = true;
      s.onload = () => finish(present(), 'the script ran but defined no maplibregl');
      s.onerror = () => finish(undefined, 'the script request failed');
      document.head.appendChild(s);
    } catch (err) {
      finish(undefined, err && err.message ? err.message : 'script injection failed');
    }
  })).then((value) => {
    if (!value) pending = null;     // a later call may try again
    return value;
  });
  return pending;
}
