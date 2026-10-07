"""Selectors and page scripts for the basemap suite (suites/test_mapbase.py): the Esri/OpenFreeMap basemap, the theme switch,
the failover and the map loader. Owned by MC-MAP-BASE. Loaded by file path through lib/sel.py (this directory has no
__init__.py on purpose)."""

SEL = {
    "map": "#map",
    "fallback": "#map .map-fallback",
    "attribution": ".maplibregl-ctrl-attrib-inner",
}

# The ids the basemap module gives its own layers (src/map/basemap.js).
GROUND_ID = "basemap-ground"
BASE_ID = "base"
LABELS_ID = "basemap-labels"

# The basemap tag the page keeps on <html data-basemap>: esri-light | esri-dark | openfreemap.
JS_BASEMAP_TAG = "() => document.documentElement.getAttribute('data-basemap')"

# Layer ids in draw order (bottom first) and the source ids of the live style.
JS_STYLE_ORDER = """() => { const m = window.__maps && window.__maps[0]; if (!m) return null; const s = m.getStyle();
  return { layers: s.layers.map((l) => ({ id: l.id, type: l.type, source: l.source || null, minzoom: l.minzoom === undefined ? null : l.minzoom,
                                          paint: l.paint || {} })),
           sources: Object.fromEntries(Object.entries(s.sources).map(([k, v]) => [k, { type: v.type, tiles: v.tiles || null, url: v.url || null,
                                          attribution: v.attribution || null }])) }; }"""

JS_ATTRIBUTION = "() => (document.querySelector('.maplibregl-ctrl-attrib-inner') || {}).textContent || ''"

# Does the page allow dark at all (the theme gate pins color-scheme to light)?
JS_GATE_SCHEME = "() => getComputedStyle(document.documentElement).colorScheme"

# --paper as the browser resolves it (a light-dark() token), as [r, g, b].
JS_PAPER_RGB = """() => { const i = document.createElement('i'); i.style.cssText = 'position:absolute;visibility:hidden;color:var(--paper)';
  document.documentElement.appendChild(i); const c = getComputedStyle(i).color; i.remove();
  const m = c.match(/[\\d.]+/g) || []; return m.slice(0, 3).map(Number); }"""

# The basemap module's dark style, built without touching the page's theme (the module is the one the app already loaded).
JS_DARK_STYLE = """async () => { const mod = await import('/src/map/basemap.js'); const s = mod.basemapStyle({ dark: true });
  return { sources: s.sources, layers: s.layers }; }"""

JS_LIGHT_STYLE = """async () => { const mod = await import('/src/map/basemap.js'); const s = mod.basemapStyle({ dark: false });
  return { sources: s.sources, layers: s.layers }; }"""

# Layers of the live map that are not the basemap's own: [index, id], in style order.
JS_OVERLAY_LAYERS = """() => { const m = window.__maps && window.__maps[0]; if (!m) return null;
  const ids = m.getStyle().layers.map((l) => l.id);
  return ids.map((id, i) => [i, id]).filter(([i, id]) => !['basemap-ground', 'base', 'basemap-labels'].includes(id)); }"""

# Force an explicit theme the way a page could (data-theme is read by the basemap module as well as by the tokens).
JS_SET_THEME = "(t) => { document.documentElement.setAttribute('data-theme', t); }"
JS_CLEAR_THEME = "() => { document.documentElement.removeAttribute('data-theme'); }"

# Strip the MapLibre <script> tag from the page HTML (the rescue-injection tests serve index.html without it).
MAPLIBRE_TAG_RE = r'<script[^>]+maplibre-gl\.js[^>]*></script>'
