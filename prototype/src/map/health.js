// Layer health: a quiet note on a layer's row when its service is slow or down, and nothing else. The map keeps working;
// the row says so in words. Nothing here decides what is shown on the map, never retries, and never throws into the page.
//
// Two halves.
//   createMonitor()  a pure state machine per layer (no map, no DOM, injectable timers) so the rules are unit-tested.
//   attachHealth()   the glue: feeds the monitor from the map's `error` and `sourcedata` events, writes the notes into the
//                    panel and announces changes in a polite live region. layers.js loads this module lazily, on the first
//                    realise, so it never lengthens the static module chain.
//
// The rules (per layer, counted from the moment the layer is switched on):
//   unavailable   at least 3 tile errors (1 for a GeoJSON layer) and no tile or file has arrived
//   slow          nothing has arrived within 8 s while tiles are expected (a layer below its minzoom expects none)
//   ok            something arrived; a later success also recovers a layer that was slow or unavailable
// Registry flags add a pre-emptive note while a layer is on: `fragile` (the third-party path may be missing) and `slow` (it
// is drawn on request). A layer with a zoom floor says "Zoom in to see this layer." until the map is zoomed in far enough.
//
// DOM contract (for the panel and the tests): a layer's note is <p class="map-layer-note" id="map-layer-note-<id>"
// data-layer-note="<id>"> placed right after the layer's toggle button, which gets aria-describedby pointing at it (merged
// with any token it already has); the note is removed when there is nothing to say. Changes of state are announced in
// <div id="map-health-live" role="status" aria-live="polite">, a visually hidden region inside the panel.

export const ERRORS_TO_FAIL = 3;
export const SLOW_AFTER_MS = 8000;

export const NOTE_UNAVAILABLE = 'This service is slow or unavailable right now. The map keeps working.';
export const NOTE_ZOOM = 'Zoom in to see this layer.';
export const NOTE_SLOW_FLAG = 'This layer is drawn on request, so tiles can take a few seconds.';
export const NOTE_FRAGILE = 'This layer comes from a third-party service and may be slow or missing.';

// ---------------------------------------------------------------------------------------------- the monitor

export function createMonitor(opts = {}) {
  const {
    setTimer = (fn, ms) => setTimeout(fn, ms),
    clearTimer = (t) => clearTimeout(t),
    slowMs = SLOW_AFTER_MS,
    onChange = () => {},
  } = opts;
  const recs = new Map();

  function set(rec, next) {
    if (rec.state === next) return;
    const prev = rec.state;
    rec.state = next;
    onChange(rec.id, next, prev);
  }

  function stop(rec) {
    if (rec.timer !== null) { clearTimer(rec.timer); rec.timer = null; }
  }

  function arm(rec) {
    stop(rec);
    if (!rec.expects()) { set(rec, 'idle'); return; }
    set(rec, 'loading');
    rec.timer = setTimer(() => {
      rec.timer = null;
      if (!rec.active || rec.successes > 0 || rec.state === 'unavailable') return;
      if (!rec.expects()) { set(rec, 'idle'); return; }
      // Tiles served from the map's own cache raise no event: if everything in view is loaded and nothing failed, it is fine.
      if (rec.errors === 0 && rec.probe(rec)) { rec.successes += 1; set(rec, 'ok'); return; }
      set(rec, 'slow');
    }, slowMs);
  }

  const api = {
    // Registers a layer. expects(): are tiles or data expected right now? probe(rec): true when the layer is evidently loaded.
    track(id, o = {}) {
      recs.set(id, {
        id, active: false, errors: 0, successes: 0, state: 'idle', timer: null,
        errorsToFail: o.errorsToFail || ERRORS_TO_FAIL,
        explicit: !!o.explicit,
        expects: o.expects || (() => true),
        probe: o.probe || (() => false),
      });
    },
    has: (id) => recs.has(id),
    isExplicit: (id) => !!(recs.get(id) && recs.get(id).explicit),
    // The layer was switched on: a fresh count and a fresh 8 s.
    activate(id) {
      const rec = recs.get(id);
      if (!rec) return;
      rec.active = true;
      rec.errors = 0;
      rec.successes = 0;
      arm(rec);
    },
    // Switched off: nothing to watch, nothing to say.
    deactivate(id) {
      const rec = recs.get(id);
      if (!rec) return;
      rec.active = false;
      rec.errors = 0;
      rec.successes = 0;
      stop(rec);
      set(rec, 'idle');
    },
    // A new attempt for a layer that stays on (a continent switch, a style swap): count again.
    restart(id) {
      const rec = recs.get(id);
      if (rec && rec.active) api.activate(id);
    },
    error(id) {
      const rec = recs.get(id);
      if (!rec || !rec.active || !rec.expects()) return;
      rec.errors += 1;
      if (rec.successes === 0 && rec.errors >= rec.errorsToFail) { stop(rec); set(rec, 'unavailable'); }
    },
    // A whole attempt failed (a fetch that errored or timed out): unavailable at once, whatever arrived before.
    fail(id) {
      const rec = recs.get(id);
      if (!rec || !rec.active) return;
      rec.errors = Math.max(rec.errors, rec.errorsToFail);
      rec.successes = 0;
      stop(rec);
      set(rec, 'unavailable');
    },
    success(id) {
      const rec = recs.get(id);
      if (!rec || !rec.active) return;
      rec.successes += 1;
      stop(rec);
      set(rec, 'ok');
    },
    // The expectation may have changed (the map zoomed past a zoom floor): re-arm, or stand down.
    recheck(id) {
      const rec = recs.get(id);
      if (!rec || !rec.active) return;
      if (rec.state === 'ok' || rec.state === 'unavailable') return;
      if (!rec.expects()) { stop(rec); set(rec, 'idle'); return; }
      if (rec.state === 'idle') arm(rec);
    },
    status(id) {
      const rec = recs.get(id);
      return rec ? { state: rec.state, errors: rec.errors, successes: rec.successes, active: rec.active } : { state: 'idle', errors: 0, successes: 0, active: false };
    },
    ids: () => [...recs.keys()],
    dispose() {
      recs.forEach((rec) => stop(rec));
      recs.clear();
    },
  };
  return api;
}

// ------------------------------------------------------------------------------------------------ the words

// What a row says, or null. One note at a time, the most useful first. `belowMinZoom`: the layer is on but the map is not
// zoomed in far enough for its service to serve tiles.
export function noteText(entry, { on = false, state = 'idle', belowMinZoom = false } = {}) {
  if (on && (state === 'unavailable' || state === 'slow')) return { kind: 'service', text: NOTE_UNAVAILABLE };
  if (entry.zoomHint && (!on || belowMinZoom)) return { kind: 'zoom', text: NOTE_ZOOM };
  if (on && entry.fragile) return { kind: 'fragile', text: entry.fallbackNote || NOTE_FRAGILE };
  if (on && entry.slow) return { kind: 'slow-flag', text: NOTE_SLOW_FLAG };
  return null;
}

// MapLibre asks for tiles at floor(zoom + log2(512 / tileSize)); below the source's minzoom it asks for none.
export function expectsTiles(entry, zoom) {
  if (entry.urls) return true;
  const min = entry.minzoom || 0;
  if (!min) return true;
  return Math.floor(zoom + Math.log2(512 / (entry.tileSize || 256))) >= min;
}

// ---------------------------------------------------------------------------------------------- the glue

const LIVE_ID = 'map-health-live';
const noteId = (id) => `map-layer-note-${id}`;

function toggleFor(doc, entry) {
  const root = doc.getElementById('map-toggles') || doc;
  const byData = Array.from(root.querySelectorAll('[data-layer-id]')).find((b) => b.getAttribute('data-layer-id') === entry.id);
  if (byData) return byData;
  return Array.from(root.querySelectorAll('button.map-toggle')).find((b) => b.getAttribute('aria-label') === `${entry.label} map layer`) || null;
}

function describedTokens(btn) {
  return (btn.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
}

function setDescribed(btn, id, present) {
  const tokens = describedTokens(btn).filter((t) => t !== id);
  if (present) tokens.push(id);
  if (tokens.length) btn.setAttribute('aria-describedby', tokens.join(' '));
  else btn.removeAttribute('aria-describedby');
}

function liveRegion(doc) {
  let region = doc.getElementById(LIVE_ID);
  if (!region) {
    region = doc.createElement('div');
    region.id = LIVE_ID;
    region.setAttribute('role', 'status');
    region.setAttribute('aria-live', 'polite');
    region.setAttribute('aria-atomic', 'true');
    region.style.cssText = 'position:absolute;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0';
    (doc.querySelector('.map-controls') || doc.body).appendChild(region);
  }
  return region;
}

// Connects the monitor to one map and to the panel. Returns the controller layers.js calls:
//   layerChanged(id, on)   a toggle: start or stop watching, refresh the note
//   restart(id)            a new load of a layer that stays on
//   succeed(id) / fail(id) / settle(id)   the outcome of layers.js's own file fetch (lazy GeoJSON)
//   reset()                the style was replaced: count again for every layer that is on
//   status(id), refresh(), dispose()
export function attachHealth(map, opts) {
  const { entries, isOn, dataLoaded = () => false } = opts;
  const doc = opts.doc !== undefined ? opts.doc : (typeof document !== 'undefined' ? document : null);
  const byId = new Map(entries.map((e) => [e.id, e]));
  let missingToggle = false;

  const zoom = () => { try { return map.getZoom(); } catch (err) { return 0; } };
  const sourceLoaded = (id) => { try { return !!map.isSourceLoaded(id); } catch (err) { return false; } };

  function render(entry) {
    if (!doc) return;
    const btn = toggleFor(doc, entry);
    if (!btn) { missingToggle = true; return; }
    const st = monitor.status(entry.id).state;
    const on = !!isOn(entry.id);
    const note = noteText(entry, { on, state: st, belowMinZoom: on && !expectsTiles(entry, zoom()) });
    const id = noteId(entry.id);
    let el = doc.getElementById(id);
    if (!note) {
      if (el) el.remove();
      setDescribed(btn, id, false);
      return;
    }
    if (!el) {
      el = doc.createElement('p');
      el.id = id;
      el.className = 'map-layer-note';
      el.setAttribute('data-layer-note', entry.id);
      el.style.cssText = 'margin:0 0 4px 18px;font:italic 12px/1.4 Spectral,Georgia,serif;color:var(--ink-3,#5f574c);white-space:normal';
    }
    if (el.previousElementSibling !== btn) btn.insertAdjacentElement('afterend', el);
    el.setAttribute('data-note-kind', note.kind);
    if (el.textContent !== note.text) el.textContent = note.text;
    setDescribed(btn, id, true);
  }

  function announce(entry, next, prev) {
    if (!doc) return;
    let msg = '';
    if (next === 'slow' || next === 'unavailable') msg = `${entry.label}: ${NOTE_UNAVAILABLE}`;
    else if (next === 'ok' && (prev === 'slow' || prev === 'unavailable')) msg = `${entry.label} is loading again.`;
    if (msg) liveRegion(doc).textContent = msg;
  }

  const monitor = createMonitor({
    setTimer: opts.setTimer,
    clearTimer: opts.clearTimer,
    slowMs: opts.slowMs,
    onChange: (id, next, prev) => {
      const entry = byId.get(id);
      if (!entry) return;
      render(entry);
      announce(entry, next, prev);
    },
  });

  entries.forEach((entry) => {
    const explicit = !!entry.urls && !!entry.lazy;
    monitor.track(entry.id, {
      explicit,
      errorsToFail: entry.urls ? 1 : ERRORS_TO_FAIL,
      expects: () => expectsTiles(entry, zoom()),
      probe: () => (explicit ? dataLoaded(entry.id) : sourceLoaded(entry.id)),
    });
  });

  const onError = (ev) => {
    const id = ev && ev.sourceId;
    if (id && byId.has(id)) monitor.error(id);
  };
  const onSourceData = (ev) => {
    const id = ev && ev.sourceId;
    if (!id || !byId.has(id) || monitor.isExplicit(id)) return;
    if (ev.tile) monitor.success(id);
  };
  const onZoomEnd = () => {
    entries.forEach((entry) => { monitor.recheck(entry.id); render(entry); });
  };
  const onIdle = () => {
    if (!missingToggle) return;
    missingToggle = false;
    entries.forEach(render);
  };
  map.on('error', onError);
  map.on('sourcedata', onSourceData);
  map.on('zoomend', onZoomEnd);
  map.on('idle', onIdle);

  function sync() {
    entries.forEach((entry) => {
      if (isOn(entry.id)) {
        monitor.activate(entry.id);
        if (monitor.isExplicit(entry.id) && dataLoaded(entry.id)) monitor.success(entry.id);
      }
      render(entry);
    });
  }
  sync();

  return {
    monitor,
    layerChanged(id, on) {
      const entry = byId.get(id);
      if (!entry) return;
      if (on) {
        monitor.activate(id);
        if (monitor.isExplicit(id) && dataLoaded(id)) monitor.success(id);
      } else {
        monitor.deactivate(id);
      }
      render(entry);
    },
    restart: (id) => monitor.restart(id),
    succeed: (id) => monitor.success(id),
    fail: (id) => monitor.fail(id),
    // Nothing to load (a continent with no clip): an active layer is simply fine.
    settle: (id) => monitor.success(id),
    reset() {
      entries.forEach((entry) => { if (isOn(entry.id)) monitor.restart(entry.id); });
    },
    status: (id) => monitor.status(id),
    refresh: () => entries.forEach(render),
    dispose() {
      try {
        map.off('error', onError);
        map.off('sourcedata', onSourceData);
        map.off('zoomend', onZoomEnd);
        map.off('idle', onIdle);
      } catch (err) { /* the map may already be gone */ }
      monitor.dispose();
    },
  };
}
