"""Selectors and page scripts for suites/test_map_compare.py (MC-MAP-COMPARE, src/map/compare.js).
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose).

DOM contract the suite relies on:
  * the control lives in a SHADOW ROOT on `#map-ext-slot` (the slot keeps zero element children). Playwright CSS selectors pierce
    the open root, so SEL entries below work with page.locator(); page.evaluate scripts reach it through `shadowRoot`.
    `details.mc[data-compare-root][data-state=idle|active][data-mode=swipe|fade]`, its `summary.mc-summary`, the "Then and later"
    buttons `button.mc-pair[data-then][data-later]`, the pickers `select.mc-select[data-pick=left|right]`, `button.mc-go`,
    the exit `button.mc-exit-panel`, one `section.mc-side[data-side]` per side while active, a polite live region `[data-live]`
  * over the map (document): the second map's host `#map-compare-top` (inside #map; aria-hidden, inert, clip-path inset), the divider
    `#map-compare-divider` (role=slider), the key card `.mc-stage-key` with `button.mc-stage-exit`, and, below 900px, the fade bar
    `.mc-fade` with `input#map-compare-fade[type=range]`
"""

SEL = {
    "slot": "#map-ext-slot",
    "summary": "#map-ext-slot summary.mc-summary",
    "root": "#map-ext-slot details.mc",
    "pair": "#map-ext-slot button.mc-pair",
    "pick_left": "#map-ext-slot select[data-pick=left]",
    "pick_right": "#map-ext-slot select[data-pick=right]",
    "go": "#map-ext-slot button.mc-go",
    "exit_panel": "#map-ext-slot button.mc-exit-panel",
    "side": "#map-ext-slot section.mc-side",
    "divider": "#map-compare-divider",
    "top": "#map-compare-top",
    "stage_exit": ".mc-stage-exit",
    "fade": "#map-compare-fade",
    "fade_bar": ".mc-fade",
    "stage": "#map-stage",
    "canvas": "canvas.maplibregl-canvas",
    "tab": ".continent-tab",
}

# Everything the checks need about the control, read through the shadow root.
JS_CONTROL = """() => {
  const slot = document.getElementById('map-ext-slot');
  const root = slot && slot.shadowRoot;
  const q = (s) => (root ? root.querySelector(s) : null);
  const qa = (s) => (root ? Array.from(root.querySelectorAll(s)) : []);
  const det = q('details.mc');
  const summary = q('summary.mc-summary');
  const sr = summary ? summary.getBoundingClientRect() : null;
  return {
    hasSlot: !!slot, shadow: !!root, kids: slot ? slot.children.length : null, attr: slot ? slot.hasAttribute('data-compare') : null,
    display: slot ? getComputedStyle(slot).display : null,
    details: !!det, state: det ? det.getAttribute('data-state') : null, mode: det ? det.getAttribute('data-mode') : null,
    open: det ? det.open : null, summaryH: sr ? sr.height : null,
    pairs: qa('button.mc-pair').map((b) => ({ then: b.getAttribute('data-then'), later: b.getAttribute('data-later'), h: b.getBoundingClientRect().height, label: b.getAttribute('aria-label'), current: b.getAttribute('aria-current') })),
    picks: ['left', 'right'].map((side) => { const s = q('select[data-pick=' + side + ']'); return s ? { side, value: s.value, options: Array.from(s.options).map((o) => o.value).filter(Boolean), h: s.getBoundingClientRect().height } : null; }),
    go: q('button.mc-go') ? { disabled: q('button.mc-go').disabled, h: q('button.mc-go').getBoundingClientRect().height } : null,
    msg: q('[data-msg]') ? q('[data-msg]').textContent : null,
    exitHidden: q('button.mc-exit-panel') ? q('button.mc-exit-panel').hidden : null,
    sides: qa('section.mc-side').map((s) => ({ side: s.getAttribute('data-side'), id: s.getAttribute('data-layer-id'), head: (s.querySelector('.mc-side-h') || {}).textContent, src: (s.querySelector('.mc-src') || {}).textContent, swatches: s.querySelectorAll('.mc-sw').length })),
    live: q('[data-live]') ? q('[data-live]').textContent : null,
    activeInShadow: root && root.activeElement ? (root.activeElement.className || root.activeElement.tagName) : null,
    text: root ? root.textContent : '',
  };
}"""

# The registry, as the page holds it: the pairs it names and the layer ids / kinds.
JS_REGISTRY = """() => import('/src/config/map-layers.js').then((m) => ({
  pairs: m.trajectoryPairs().map((p) => ({ then: p.thenId, later: p.laterId })),
  ids: m.MAP_LAYERS.map((l) => l.id),
  kinds: Object.fromEntries(m.MAP_LAYERS.map((l) => [l.id, l.kind])),
  withPair: m.MAP_LAYERS.filter((l) => l.trajectoryPair).map((l) => l.id),
}))"""

# The over-the-map state: maps, canvases, divider, second-map host, fade bar.
JS_STATE = """() => {
  const q = (s) => document.querySelector(s);
  const maps = window.__maps || [];
  const d = q('#map-compare-divider');
  const top = q('#map-compare-top');
  const fade = q('#map-compare-fade');
  const key = q('.mc-stage-key');
  const ex = q('.mc-stage-exit');
  const r = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left, t: b.top, r: b.right, b: b.bottom, w: b.width, h: b.height }; };
  return {
    maps: maps.length, canvases: document.querySelectorAll('canvas.maplibregl-canvas').length,
    stageOn: !!(q('#map-stage') && q('#map-stage').classList.contains('mc-on')),
    divider: d ? { role: d.getAttribute('role'), now: d.getAttribute('aria-valuenow'), min: d.getAttribute('aria-valuemin'), max: d.getAttribute('aria-valuemax'),
                   text: d.getAttribute('aria-valuetext'), label: d.getAttribute('aria-label'), tabindex: d.getAttribute('tabindex'), focused: document.activeElement === d,
                   left: d.style.left, transition: getComputedStyle(d).transitionDuration, grip: r(d.querySelector('.mc-grip')) } : null,
    top: top ? { ariaHidden: top.getAttribute('aria-hidden'), inert: top.hasAttribute('inert'), ready: top.getAttribute('data-ready'), clip: getComputedStyle(top).clipPath,
                 inStage: !!top.closest('#map'), pointerEvents: getComputedStyle(top).pointerEvents, transition: getComputedStyle(top).transitionDuration } : null,
    fade: fade ? { value: fade.value, min: fade.min, max: fade.max, text: fade.getAttribute('aria-valuetext'), h: fade.getBoundingClientRect().height,
                   label: (q('label[for=map-compare-fade]') || {}).textContent } : null,
    key: key ? { text: key.textContent, box: r(key) } : null,
    exit: ex ? { h: ex.getBoundingClientRect().height, w: ex.getBoundingClientRect().width, text: ex.textContent } : null,
    url: location.href,
  };
}"""

# Visible registry layers on map `i` (layout visibility is not 'none'), and the paint opacity of the named layers.
# M(i): the first map is __maps[0]; the second is the LAST map (earlier second maps stay in __maps, removed).
JS_VISIBLE = """async (i) => {
  const M = (j) => (j === 1 ? window.__maps[window.__maps.length - 1] : window.__maps[j]);
  const reg = await import('/src/config/map-layers.js');
  const m = M(i);
  const ids = reg.MAP_LAYERS.map((l) => l.id);
  return ids.filter((id) => m.getLayer(id) && m.getLayoutProperty(id, 'visibility') !== 'none');
}"""

JS_ORDER = """async () => {
  const reg = await import('/src/config/map-layers.js');
  const ids = new Set(reg.MAP_LAYERS.map((l) => l.id));
  return window.__maps[0].getStyle().layers.map((l) => l.id).filter((id) => ids.has(id));
}"""

JS_STATE_LAYERS = """async () => { const st = await import('/src/state.js'); return Object.keys(st.state.mapLayers).filter((k) => st.state.mapLayers[k]); }"""

JS_PAINT = """([i, id, prop]) => (i === 1 ? window.__maps[window.__maps.length - 1] : window.__maps[i]).getPaintProperty(id, prop)"""

JS_CAMERA = """(i) => { const m = i === 1 ? window.__maps[window.__maps.length - 1] : window.__maps[i]; const c = m.getCenter(); return { lng: c.lng, lat: c.lat, zoom: m.getZoom(), bearing: m.getBearing(), pitch: m.getPitch() }; }"""

JS_JUMP = """([i, lng, lat, zoom]) => { (i === 1 ? window.__maps[window.__maps.length - 1] : window.__maps[i]).jumpTo({ center: [lng, lat], zoom }); return true; }"""

# A marker whose chip lies right of the divider: is it the element on top at that point (the second map must not cover it)?
JS_MARKER_ON_TOP = """() => {
  const d = document.getElementById('map-compare-divider');
  if (!d) return null;
  const dx = d.getBoundingClientRect().left + d.getBoundingClientRect().width / 2;
  const st = document.getElementById('map-stage').getBoundingClientRect();
  const out = { right: 0, rightOnTop: 0, left: 0, leftOnTop: 0, sample: [] };
  document.querySelectorAll('#map .region-marker').forEach((m) => {
    const c = m.querySelector('.chip');
    if (!c) return;
    const b = c.getBoundingClientRect();
    const x = b.left + b.width / 2; const y = b.top + b.height / 2;
    if (x < st.left + 4 || x > st.right - 4 || y < st.top + 4 || y > st.bottom - 4) return;
    const el = document.elementFromPoint(x, y);
    // on top = nothing of the second map (its host or its canvas) is the element at the marker's centre
    const onTop = !!(el && el.closest && !el.closest('#map-compare-top') && el.tagName !== 'CANVAS');
    const covered = el && el.closest && (el.closest('.mc-stage-key') || el.closest('.mc-divider'));
    if (covered) return;
    if (x > dx + 24) { out.right += 1; if (onTop) out.rightOnTop += 1; else out.sample.push(m.dataset.region + ':' + (el ? el.className : 'none')); }
    else if (x < dx - 24) { out.left += 1; if (onTop) out.leftOnTop += 1; }
  });
  return out;
}"""

# Keeps the second map's canvas, so a later check can ask whether its WebGL context was released.
JS_KEEP_SECOND = """() => { const m = window.__maps[window.__maps.length - 1]; window.__c2 = m && m !== window.__maps[0] ? m.getCanvas() : null; return !!window.__c2; }"""
JS_SECOND_LOST = """() => { const c = window.__c2; if (!c) return null; const gl = c.getContext('webgl2') || c.getContext('webgl'); return { connected: c.isConnected, lost: gl ? gl.isContextLost() : null }; }"""

# After a comparison the page must look like it did before it.
JS_LAYER_PRESS = """(id) => { const b = document.querySelector('#map-toggles button.map-toggle[data-layer-id="' + id + '"]'); return b ? b.getAttribute('aria-pressed') : null; }"""

# What a visitor can read of the compare UI (the control's shadow root, the key card, the fade bar, the divider's labels): text,
# option text and aria-labels, and the shadow root's HTML for the glyph / contact scan. The page-wide discipline suite cannot see
# into the shadow root, so this suite feeds it.
JS_TEXTS = """() => {
  const slot = document.getElementById('map-ext-slot');
  const root = slot && slot.shadowRoot;
  const items = [];
  const add = (kind, text) => { const t = (text || '').trim(); if (t) items.push({ kind, text: t }); };
  if (root) {
    add('text', root.textContent);
    root.querySelectorAll('option').forEach((o) => add('option', o.textContent));
    root.querySelectorAll('[aria-label]').forEach((e) => add('aria-label', e.getAttribute('aria-label')));
    add('html', Array.from(root.children).map((c) => c.outerHTML || '').join(' '));
    add('controls', Array.from(root.querySelectorAll('button, select, label')).map((e) => (e.getAttribute('aria-label') || '') + ' ' + (e.textContent || '')).join('\\n'));
  }
  ['.mc-stage-key', '.mc-fade', '#map-compare-divider'].forEach((sel) => {
    const e = document.querySelector(sel);
    if (!e) return;
    add('text', e.textContent);
    e.querySelectorAll('[aria-label], [aria-valuetext]').forEach((x) => add('aria-label', x.getAttribute('aria-label') || x.getAttribute('aria-valuetext')));
    if (e.getAttribute('aria-label')) add('aria-label', e.getAttribute('aria-label'));
    if (e.getAttribute('aria-valuetext')) add('aria-label', e.getAttribute('aria-valuetext'));
    add('html', e.outerHTML);
  });
  const live = root && root.querySelector('[data-live]');
  if (live) add('text', live.textContent);
  return items;
}"""
