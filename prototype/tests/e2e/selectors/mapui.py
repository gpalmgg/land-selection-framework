"""Selectors and page scripts for the map UI suites (suites/test_mapui.py, suites/test_map_labels.py). Owned by MC-MAP-UI.
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose).

DOM contract the suites rely on (src/map/markers.js, toggles.js, legend.js, labels.js, continent.js):
  * the plate is `figure.map-wrap.map-plate`: the stage `#map-stage` holds `#map`; the panel is `#map-controls.map-controls`
    (header button `#layers-toggle`, count `#layers-count`, body `#map-panel-body`, groups `.map-group` with a head button
    `.map-toggle-group-label`, rows `button.map-toggle[data-layer-id]` with a `.src` line, `#map-ext-slot`, `#map-legend`)
  * a marker is `.region-marker[data-region]` (0x0 anchor) with `.hit` (44px tap area), `.chip` (the mark) and `.region-label`
    (`.nm` the pill name, `small.land` the Salutation, shown on hover and focus); sides are the classes flip / above / below,
    `nolabel` drops the pill; `.dim` = outside the thresholds
  * the legend is `#map-legend` with one `section.lg-layer[data-layer-id]` per active layer that has a legend
"""

SEL = {
    "plate": ".map-wrap",
    "stage": "#map-stage",
    "map": "#map",
    "controls": "#map-controls",
    "layers_toggle": "#layers-toggle",
    "layers_count": "#layers-count",
    "toggles": "#map-toggles",
    "row": "#map-toggles button.map-toggle",
    "group_head": "#map-toggles .map-toggle-group-label",
    "legend": "#map-legend",
    "slot": "#map-ext-slot",
    "marker": "#map .region-marker",
    "tab": ".continent-tab",
    "caption": ".map-wrap figcaption",
    "clear": "#layers-clear",
    "defaults": "#layers-defaults",
}

FILTERED_LINK = "/?t.water_stress=0.3&t.solar_pv=1400"

# Records, for every region marker that is ever added to the page, whether it already carried `dim` when the browser first got to
# look at it (a microtask after createMarkers() returned). A share link that restores filters must open with the outside markers
# already dashed (RCA bug 2); a marker dimmed only later (on the next refresh) shows in `late`.
INIT_DIM_WATCH = """(() => {
  window.__dimSeen = { first: {}, later: [] };
  const seen = window.__dimSeen;
  const start = () => {
    const mo = new MutationObserver((muts) => { muts.forEach((m) => { m.addedNodes.forEach((n) => {
      if (n.nodeType === 1 && n.classList && n.classList.contains('region-marker') && !(n.dataset.region in seen.first)) seen.first[n.dataset.region] = n.classList.contains('dim');
    }); }); });
    mo.observe(document, { childList: true, subtree: true });
  };
  start();
})();"""

JS_DIM_SEEN = """() => { const seen = window.__dimSeen || { first: {} };
  const now = {}; document.querySelectorAll('#map .region-marker').forEach((m) => { now[m.dataset.region] = m.classList.contains('dim'); });
  const late = Object.keys(now).filter((id) => now[id] && seen.first[id] === false);
  return { first: seen.first, now, late, n: Object.keys(now).length }; }"""

# Everything the label and fit checks need, in viewport pixels: the stage, the map controls, every visible marker (chip, tap area,
# visible pill) and the visible bioregion labels.
JS_MARKERS = """() => {
  const stageEl = document.getElementById('map'); const st = stageEl.getBoundingClientRect();
  const vis = (e) => { const cs = getComputedStyle(e); return cs.display !== 'none' && cs.visibility !== 'hidden'; };
  const R = (e) => { const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const ctrls = Array.from(stageEl.querySelectorAll('.maplibregl-ctrl')).filter((e) => e.getBoundingClientRect().width > 0 && vis(e)).map(R);
  const markers = Array.from(stageEl.querySelectorAll('.region-marker')).filter(vis).map((m) => {
    const lab = m.querySelector('.region-label');
    return { id: m.dataset.region, mark: m.querySelector('.chip').textContent, aria: m.getAttribute('aria-label'), role: m.getAttribute('role'),
      tabindex: m.getAttribute('tabindex'), dim: m.classList.contains('dim'), chip: R(m.querySelector('.chip')), hit: R(m.querySelector('.hit')),
      label: lab && vis(lab) ? R(lab) : null, name: lab ? lab.querySelector('.nm').textContent : null, cls: m.className };
  });
  const bio = Array.from(stageEl.querySelectorAll('.bio-label')).filter((e) => vis(e) && !e.closest('.nolabel') && e.getBoundingClientRect().width > 0)
    .map((e) => Object.assign({ txt: e.textContent }, R(e)));
  return { stage: { l: st.left, t: st.top, r: st.right, b: st.bottom, w: st.width, h: st.height }, ctrls, markers, bio, zoom: window.__maps ? window.__maps[0].getZoom() : null }; }"""

JS_ACTIVE_CONTINENT = """() => document.body.dataset.continent"""

JS_PLATE = """() => { const q = (s) => document.querySelector(s); const R = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { l: r.left, t: r.top, r: r.right, b: r.bottom, w: r.width, h: r.height }; };
  const map = q('#map'); const stage = q('#map-stage'); const ctl = q('#map-controls'); const fig = q('figure.map-wrap');
  const script = document.querySelector('script[src*="maplibre-gl"]');
  return { fig: !!fig, figClasses: fig ? fig.className : null, stage: R(stage), map: R(map), controls: R(ctl), caption: q('.map-wrap figcaption') ? q('.map-wrap figcaption').textContent : null,
    stageHeight: stage ? parseFloat(getComputedStyle(stage).height) : null, vh: innerHeight,
    controlsRole: ctl ? ctl.getAttribute('role') : null, controlsLabel: ctl ? ctl.getAttribute('aria-label') : null,
    mapRole: map ? map.getAttribute('role') : null, mapLabel: map ? map.getAttribute('aria-label') : null,
    slotInControls: !!(q('#map-ext-slot') && ctl && ctl.contains(q('#map-ext-slot'))), slotEmpty: q('#map-ext-slot') ? q('#map-ext-slot').children.length === 0 : null,
    legendInControls: !!(q('#map-legend') && ctl && ctl.contains(q('#map-legend'))),
    scriptDefer: script ? script.defer : null, scriptAsync: script ? script.async : null, pageOverflow: document.documentElement.scrollWidth - innerWidth,
    toggleExpanded: q('#layers-toggle') ? q('#layers-toggle').getAttribute('aria-expanded') : null,
    toggleDisabled: q('#layers-toggle') ? q('#layers-toggle').getAttribute('aria-disabled') : null,
    count: q('#layers-count') ? q('#layers-count').textContent : null,
    controlsPosition: ctl ? getComputedStyle(ctl).position : null }; }"""

# Every row of the panel (visible or not): id, the source line, whether the button is pressed, its height when it is shown.
JS_ROWS = """() => Array.from(document.querySelectorAll('#map-toggles button.map-toggle')).map((b) => {
  const src = b.querySelector('.src'); const r = b.getBoundingClientRect(); const cs = getComputedStyle(b);
  return { id: b.getAttribute('data-layer-id'), label: b.getAttribute('aria-label'), pressed: b.getAttribute('aria-pressed') === 'true', on: b.classList.contains('on'),
    src: src ? src.textContent.trim() : null, srcId: src ? src.id : null, describedby: b.getAttribute('aria-describedby'), h: Math.round(r.height), w: Math.round(r.width),
    shown: r.width > 0 && r.height > 0 && cs.visibility !== 'hidden', group: b.closest('.map-group') ? b.closest('.map-group').dataset.group : null,
    gap: Array.from(b.querySelectorAll('.src .gap')).map((e) => e.textContent) }; })"""

JS_GROUPS = """() => Array.from(document.querySelectorAll('#map-toggles .map-group')).map((g) => { const head = g.querySelector('.map-toggle-group-label'); const body = g.querySelector('.map-group-body');
  const r = head.getBoundingClientRect();
  return { key: g.dataset.group, role: g.getAttribute('role'), labelledby: g.getAttribute('aria-labelledby'), label: head.querySelector('.gl').textContent, expanded: head.getAttribute('aria-expanded'),
    hidden: body.hidden, rows: body.querySelectorAll('button.map-toggle').length, on: body.querySelectorAll('button.map-toggle[aria-pressed="true"]').length, headH: Math.round(r.height) }; })"""

JS_OPEN_ALL_GROUPS = """() => { document.querySelectorAll('#map-toggles .map-toggle-group-label[aria-expanded="false"]').forEach((b) => b.click()); }"""

JS_LEGEND = """() => { const lg = document.getElementById('map-legend'); if (!lg) return null; const cs = getComputedStyle(lg);
  const secs = Array.from(lg.querySelectorAll('section.lg-layer')).map((s) => ({ id: s.dataset.layerId, name: (s.querySelector('.lg-name') || {}).textContent,
    swatches: s.querySelectorAll('.lg-classes li .lg-sw').length, rampCount: s.querySelectorAll('.lg-ramp').length,
    gradients: Array.from(s.querySelectorAll('*')).filter((e) => !e.classList.contains('lg-ramp') && /gradient/.test(getComputedStyle(e).backgroundImage)).length,
    groups: s.querySelectorAll('.lg-group').length, src: ((s.querySelector('.lg-src') || {}).textContent || '').trim(), text: s.textContent.replace(/\\s+/g, ' ').trim().slice(0, 160),
    dash: s.querySelectorAll('.lg-sw.dash').length }));
  const r = lg.getBoundingClientRect(); const ctl = document.getElementById('map-controls').getBoundingClientRect();
  return { hidden: lg.hidden, ariaHidden: lg.getAttribute('aria-hidden'), display: cs.display, secs, tabindex: lg.getAttribute('tabindex'), role: lg.getAttribute('role'),
    inPanel: r.width > 0 ? (r.left >= ctl.left - 1 && r.right <= ctl.right + 1 && r.bottom <= ctl.bottom + 1) : null, h: Math.round(r.height), scrolls: lg.scrollHeight > lg.clientHeight + 1, overflowY: cs.overflowY,
    maxH: cs.maxHeight, panelH: Math.round(ctl.height) }; }"""

JS_PRESSED_IDS = """() => Array.from(document.querySelectorAll('#map-toggles button.map-toggle[aria-pressed="true"]')).map((b) => b.getAttribute('data-layer-id')).sort()"""

JS_DEFAULTS = """async () => { const m = await import('/src/config/map-layers.js'); const e = await import('/src/map/extensions.js');
  return { core: m.MAP_LAYERS.filter((l) => l.defaultOn).map((l) => l.id).sort(),
           ext: e.extensions.flatMap((x) => (x.layers || []).filter((l) => l.defaultOn).map((l) => l.id)).sort(),
           all: m.MAP_LAYERS.length, extAll: e.extensions.reduce((n, x) => n + (x.layers || []).length, 0) }; }"""

# Interactive things inside the plate (the continent tabs, the panel, the markers' tap areas, MapLibre's buttons) smaller than 44px.
JS_TAPS = """() => { const bad = []; const seen = new Set();
  const push = (what, e, box) => { const r = (box || e).getBoundingClientRect(); if (!r.width || !r.height) return; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    if (r.width < 43.5 || r.height < 43.5) { const k = what + Math.round(r.width) + 'x' + Math.round(r.height); if (!seen.has(k)) { seen.add(k); bad.push({ what, w: Math.round(r.width), h: Math.round(r.height), txt: (e.textContent || e.getAttribute('aria-label') || '').trim().slice(0, 30) }); } } };
  document.querySelectorAll('.continent-tab').forEach((e) => push('tab', e));
  document.querySelectorAll('.map-wrap button, .map-wrap [role=tab], .map-wrap summary, .map-wrap input, .map-wrap select').forEach((e) => {
    const cls = (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className) || e.tagName;
    push(String(cls).split(' ').slice(0, 2).join('.') || e.tagName, e); });
  document.querySelectorAll('#map .region-marker').forEach((m) => { if (getComputedStyle(m).display !== 'none') push('region-marker.hit', m, m.querySelector('.hit')); });
  return bad; }"""

JS_HOVER_LAND = """(id) => { const m = document.querySelector('#map .region-marker[data-region="' + id + '"]'); const l = m.querySelector('small.land'); const cs = getComputedStyle(l);
  const lab = m.querySelector('.region-label'); return { shown: cs.display !== 'none', text: l.textContent, labelShown: getComputedStyle(lab).display !== 'none', z: getComputedStyle(m).zIndex, aria: m.getAttribute('aria-label') }; }"""

JS_FOCUS_RING = """(id) => { const m = document.querySelector('#map .region-marker[data-region="' + id + '"]'); m.focus({ focusVisible: true }); const chip = m.querySelector('.chip'); const cs = getComputedStyle(chip);
  return { focused: document.activeElement === m, outlineStyle: cs.outlineStyle, outlineWidth: cs.outlineWidth, outlineOffset: cs.outlineOffset, markerOutline: getComputedStyle(m).outlineStyle }; }"""

JS_CAMERA = """() => { const m = window.__maps[0]; const c = m.getCenter(); return { zoom: m.getZoom(), center: [c.lng, c.lat], minZoom: m.getMinZoom(), maxZoom: m.getMaxZoom() }; }"""

JS_JUMP = """(z) => { const m = window.__maps[0]; m.jumpTo({ zoom: z }); return m.getZoom(); }"""

JS_PAN_BY = """([dx, dy]) => { const m = window.__maps[0]; m.panBy([dx, dy], { duration: 0 }); return true; }"""
