"""Selectors and page scripts for the map-layer suite (suites/test_layers.py). Owned by MC-MAP-LAYERS. Loaded by file path through
lib/sel.py (this directory has no __init__.py on purpose).

DOM contract the suite relies on (src/map/health.js writes it; the panel only needs a toggle button per layer):
  * a layer's toggle is `#map-toggles button.map-toggle`, found by `data-layer-id="<id>"` when the panel sets it, else by
    `aria-label="<label> map layer"`
  * its health note is `<p class="map-layer-note" id="map-layer-note-<id>" data-layer-note="<id>" data-note-kind="...">` placed
    right after the button, and the button's `aria-describedby` lists that id; the note is absent when there is nothing to say
  * the polite live region is `#map-health-live[role=status][aria-live=polite]` inside `.map-controls`
"""

SEL = {
    "layers_toggle": "#layers-toggle",
    "toggles": "#map-toggles",
    "toggle_any": "#map-toggles button.map-toggle",
    "continent_tab": ".continent-tab",
    "live": "#map-health-live",
    "controls": ".map-controls",
    "map": "#map",
}

UNAVAILABLE_TEXT = "This service is slow or unavailable right now. The map keeps working."

# The registry as the page sees it: [{id, label, kind, lazy, urls, defaultOn, minzoom, legendKind, sourceText}].
JS_REGISTRY = """() => import('/src/config/map-layers.js').then((m) => ({
  problems: m.REGISTRY_PROBLEMS,
  layers: m.MAP_LAYERS.map((l) => ({ id: l.id, label: l.label, kind: l.kind, lazy: !!l.lazy, urls: l.urls || null, defaultOn: l.defaultOn,
    minzoom: l.minzoom, legendKind: l.legend ? l.legend.kind : null, sourceText: m.rowSourceText(l), styleIds: l.layers.map((d, i) => (i === 0 ? l.id : l.id + '-' + i)) })),
  pairs: m.trajectoryPairs() }))"""

# Style layers of the live map, in order, with their visibility and source.
JS_STYLE = """() => { const s = window.__maps[0].getStyle(); return s.layers.map((l) => ({ id: l.id, type: l.type, source: l.source || null,
  visibility: (l.layout && l.layout.visibility) || 'visible' })); }"""

# What a GeoJSON source holds right now: the number of features, or the URL it was given.
JS_SOURCE_DATA = """(id) => { const src = window.__maps[0].getSource(id); if (!src) return { added: false };
  const d = src.serialize().data; if (typeof d === 'string') return { added: true, url: d };
  return { added: true, features: (d && d.features ? d.features.length : -1) }; }"""

JS_LEGEND_MODEL = """(id) => import('/src/map/layers.js').then((m) => m.legendModel(id))"""
JS_LAYER_HEALTH = """(id) => import('/src/map/layers.js').then((m) => m.healthReady().then(() => m.layerHealth(id)))"""

# realise() called twice more on the live map: how many style layers and sources before and after.
JS_REALISE_TWICE = """() => import('/src/map/layers.js').then((m) => { const map = window.__maps[0];
  const n = () => map.getStyle().layers.length; const s = () => Object.keys(map.getStyle().sources).length;
  const before = [n(), s()]; m.realise(map); m.realise(map); return { before, after: [n(), s()] }; })"""

# The note of one layer's toggle: its text, kind, the element before it, and whether the button's aria-describedby links to it.
JS_NOTE = """({ id, label }) => { const note = document.getElementById('map-layer-note-' + id);
  const btn = document.querySelector('#map-toggles [data-layer-id="' + id + '"]') ||
    Array.from(document.querySelectorAll('#map-toggles button.map-toggle')).find((b) => b.getAttribute('aria-label') === label + ' map layer');
  const tokens = btn ? (btn.getAttribute('aria-describedby') || '').split(/\\s+/).filter(Boolean) : [];
  return { button: !!btn, text: note ? note.textContent : null, kind: note ? note.getAttribute('data-note-kind') : null,
           after: note && note.previousElementSibling ? note.previousElementSibling === btn : null,
           linked: tokens.indexOf('map-layer-note-' + id) >= 0, describedby: tokens }; }"""

JS_LIVE = """() => { const r = document.getElementById('map-health-live'); if (!r) return null;
  return { text: r.textContent, role: r.getAttribute('role'), live: r.getAttribute('aria-live'), inControls: !!r.closest('.map-controls') }; }"""

JS_ZOOM = """(z) => { const m = window.__maps[0]; m.jumpTo({ zoom: z }); return m.getZoom(); }"""
JS_GET_ZOOM = """() => window.__maps[0].getZoom()"""
