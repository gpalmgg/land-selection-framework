// The map layer registry: the ONE list behind the layer panel, the legend, the MapLibre style layers, the
// per-continent data swap and the default visibility. Nothing about a layer lives anywhere else.
//
// Two halves are merged here, by id:
//   * the SOURCE half is data/layer-sources.js (EV-LAYERS, reached through src/data.js): where the tiles or the GeoJSON
//     come from, zoom limits, attribution, licence, vintage, legend, health flags (status, fragile, slow), plain-word
//     notes. It is the only place a URL, a zoom limit or a licence is written.
//   * the PRESENTATION half is PRESENTATION below and nothing else: the dot colour, the panel position, the default
//     visibility, the paint, the opacity cap and the optional trajectoryPair. A layer needs both halves; the unit test
//     (tests/core/map-layers.test.mjs) fails when either half has an entry the other lacks, and REGISTRY_PROBLEMS lists
//     every mismatch. A half without a partner is left out of the registry (a layer with no source cannot be drawn and a
//     source with no presentation is not offered), so a mismatch never breaks the page.
//
// ARRAY ORDER IS INSERTION ORDER IS Z-ORDER (src/map/layers.js adds the style layers in exactly this order): imagery at
// the bottom (hillshade, topo, satellite, night lights), then the rasters, then the Koppen fills, then the other vector
// data, the ecovillage points last. Raster, fill and heat layers go in below the basemap's label layer when it has one.
//
// An entry (every field is plain data, nothing here scores, ranks, weights or sums layers):
//   id, label, group, role         the toggle's id and text, its panel group, 'data' | 'imagery'
//   color                          the colour of the toggle's dot
//   panel                          position inside its group in the layer panel and the legend (a different order from z)
//   defaultOn                      initial visibility (state.mapLayers is derived from this)
//   kind                           how it is drawn: 'raster' | 'wms' | 'geojson' | 'heatmap' | 'circle'
//   sourceKind                     how it is served (EV): 'xyz' | 'wms' | 'wmts-kvp' | 'arcgis-export' | 'geojson'
//   status, fragile, slow          health flags from the EV registry ('active' | 'fragile'); layers.js and health.js use them
//   source                         the MapLibre source spec; a geojson entry gets its `data` at run time (layers.js)
//   layers                         the MapLibre style layers: [{ type, paint, layout? }]; the first carries the entry's id
//   capOpacity                     true: raster-opacity is capped at STACK_OPACITY_CAP so stacked surfaces blend
//   minzoom, maxzoom               the service's tile zoom limits as it really serves them (maxzoom null for geojson)
//   urls, lazy                     geojson only: { europe, 'north-america' } paths, and whether the file waits for its first
//                                  toggle (everything but the ecovillage points does). A continent with no path has no clip
//   legend                         { kind, label, ...} or null: 'ramp' | 'solid' | 'dot' | 'classes' | 'grouped'. Colour meaning,
//                                  never a score. Carries `label`, and `colors` (ramp) or `color` (solid, dot, and a banded
//                                  gradient string for 'classes') so the current legend renders it; `classes`, `stops`,
//                                  `unit`, `note`, `approximate` hold the detail. 'grouped' (Koppen) is filled at run time:
//                                  legendModel(id) in layers.js
//   sourceLine                     { source, vintage, licenseText, text }: the panel's mandatory "source, vintage, licence"
//                                  line. `text` is the one string to print; the three parts carry the same words
//   coverageNote, fallbackNote, zoomHint   plain words for the panel row (EV)
//   trajectoryPair                 optional, on the 'then' layer: { thenLabel, later: [{ id, label }] } (MC-MAP-COMPARE)
//
// Extensions (src/map/extensions.js) add entries and groups at run time through src/map/layers.js; this list is the
// core only.

import { layerSourceById, panelLayerSources, sources } from '../data.js';

// Two stacked raster surfaces must blend (the lower one shows through) rather than the upper painting fully opaque.
export const STACK_OPACITY_CAP = 0.66;

export const MAP_GROUPS = [
  { key: 'climate', label: 'Climate & water', order: 1 },
  { key: 'land', label: 'Land & soil', order: 2 },
  { key: 'energy', label: 'Energy', order: 3 },
  { key: 'hazards', label: 'Hazards', order: 4 },
  { key: 'human', label: 'People & access', order: 5 },
  { key: 'imagery', label: 'Terrain & imagery', order: 6 },
];

const NV = 'vintage not yet recorded';
const NL = 'licence not yet recorded';

const raster = (opacity) => [{ type: 'raster', paint: { 'raster-opacity': opacity } }];

// The Koppen fills start neutral: the class colours come with the legend file, which loads together with the data on the
// layer's first toggle (layers.js sets 'fill-color' then). Until then nothing is drawn, the data is not there either.
const koppenLayers = () => [{
  type: 'fill',
  paint: { 'fill-color': '#b2b2b2', 'fill-opacity': 0.62, 'fill-outline-color': 'rgba(26, 26, 26, 0.14)' },
}];

// The presentation half. Bottom of the stack first.
const PRESENTATION = [
  // === Terrain & imagery overlays (added first so data overlays render on top) ===
  { id: 'hillshade', color: '#6a5a4a', panel: 19, defaultOn: true, layers: raster(0.7) },
  { id: 'topo', color: '#4a6a3a', panel: 20, layers: raster(0.78) },
  { id: 'satellite', color: '#2a5a7a', panel: 21, layers: raster(0.92) },
  { id: 'night-lights', color: '#c9a04a', panel: 22, layers: raster(0.85) },

  // === Data rasters (verified public tile services); they render below the vector data ===
  { id: 'precipitation', color: '#3a6a8a', panel: 0, capOpacity: true, layers: raster(0.7) },
  { id: 'soil-carbon', color: '#7a5a2a', panel: 6, capOpacity: true, layers: raster(0.78) },
  { id: 'land-cover', color: '#4a7a4a', panel: 7, capOpacity: true, layers: raster(0.8) },
  { id: 'worldcover', color: '#3a7a4a', panel: 8, capOpacity: true, layers: raster(0.8) },
  { id: 'solar-pv', color: '#b8633a', panel: 9, capOpacity: true, layers: raster(0.8) },
  { id: 'population', color: '#6a5a4a', panel: 15, capOpacity: true, layers: raster(0.82) },
  { id: 'travel-time', color: '#7a6a8a', panel: 16, capOpacity: true, layers: raster(0.72) },
  { id: 'seismic', color: '#8a5a2a', panel: 14, capOpacity: true, layers: raster(0.68) },
  { id: 'coastal-flood', color: '#2a6a8a', panel: 10, capOpacity: true, layers: raster(0.8) },
  {
    id: 'river-flood-current', color: '#2a5a8a', panel: 11, capOpacity: true, layers: raster(0.8),
    trajectoryPair: {
      thenLabel: '1960-1999 simulation',
      later: [
        { id: 'river-flood-2050-rcp45', label: '2050, SSP2/RCP4.5' },
        { id: 'river-flood-2050-rcp85', label: '2050, SSP3/RCP8.5' },
      ],
    },
  },
  { id: 'river-flood-2050-rcp45', color: '#3a6a9a', panel: 12, capOpacity: true, layers: raster(0.8) },
  { id: 'river-flood-2050-rcp85', color: '#1a4a7a', panel: 13, capOpacity: true, layers: raster(0.8) },
  { id: 'forest-change', color: '#5a2a2a', panel: 5, layers: raster(0.78) },

  // === Vector data (render on top of the rasters) ===
  {
    id: 'koppen-now', color: '#4a7a5a', panel: 3, draw: 'geojson', layers: koppenLayers(),
    trajectoryPair: {
      thenLabel: '1991-2020',
      later: [{ id: 'koppen-2041-2070', label: '2041-2070, SSP2-4.5' }],
    },
  },
  { id: 'koppen-2041-2070', color: '#7a5a3a', panel: 4, draw: 'geojson', layers: koppenLayers() },
  {
    // Water stress polygons (WRI Aqueduct, processed)
    id: 'water-stress', color: '#b03a2e', panel: 1, draw: 'geojson',
    layers: [{
      type: 'fill',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'score'],
          0.0, 'rgba(255, 247, 230, 0.0)',
          0.5, 'rgba(252, 224, 150, 0.55)',
          1.5, 'rgba(244, 184, 96, 0.72)',
          3.0, 'rgba(226, 122, 60, 0.84)',
          5.0, 'rgba(150, 32, 30, 0.92)',
        ],
        'fill-outline-color': 'rgba(150, 32, 30, 0.08)',
      },
    }],
  },
  {
    // Water depletion polygons (WRI Aqueduct BAU 2050 depletion, drawdown rate)
    id: 'water-depletion', color: '#aa6032', panel: 2, draw: 'geojson',
    layers: [{
      type: 'fill',
      paint: {
        'fill-color': [
          'interpolate', ['linear'], ['get', 'score'],
          0.0, 'rgba(252, 246, 235, 0.0)',
          0.5, 'rgba(232, 212, 178, 0.5)',
          1.5, 'rgba(212, 162, 102, 0.7)',
          3.0, 'rgba(170, 96, 50, 0.82)',
          5.0, 'rgba(110, 50, 28, 0.92)',
        ],
        'fill-outline-color': 'rgba(110, 50, 28, 0.08)',
      },
    }],
  },
  {
    // Conflict heatmap (UCDP)
    id: 'conflict', color: '#a05050', panel: 17, draw: 'heatmap',
    layers: [{
      type: 'heatmap',
      paint: {
        'heatmap-weight': ['interpolate', ['linear'], ['get', 'deaths_best'], 0, 0.15, 100, 1],
        'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 3, 0.8, 8, 2.4],
        'heatmap-color': [
          'interpolate', ['linear'], ['heatmap-density'],
          0, 'rgba(0,0,0,0)',
          0.15, 'rgba(160, 80, 80, 0.25)',
          0.4, 'rgba(178, 70, 50, 0.55)',
          0.7, 'rgba(220, 100, 70, 0.75)',
          1, 'rgba(90, 26, 26, 0.9)',
        ],
        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 3, 12, 7, 28],
        'heatmap-opacity': 0.9,
      },
    }],
  },
  {
    // Ecovillage points (OpenStreetMap), the framework's signature layer. Its id stays 'regen-network' (the key of
    // state.mapLayers since the first version); the EV registry names the same entry 'ecovillages' as an alias. The panel
    // row says what it is: OpenStreetMap points, never the Living Atlas count behind the regen_network cells.
    id: 'regen-network', color: '#3a6a4a', panel: 18, defaultOn: true, draw: 'circle',
    sourceName: 'OpenStreetMap ecovillage points; not the Living Atlas count behind the regen_network cells',
    layers: [{
      type: 'circle',
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 7, 6],
        'circle-color': '#3a6a4a',
        'circle-stroke-color': '#f6f2eb',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9,
      },
    }],
  },
];

// ---------------------------------------------------------------------------------------------- the merge

const DRAW_BY_SERVED = { xyz: 'raster', 'wmts-kvp': 'raster', wms: 'wms', 'arcgis-export': 'wms' };

function text(v) {
  return typeof v === 'string' ? v.trim() : '';
}

function rasterSource(ev) {
  const src = { type: 'raster', tiles: [ev.url, ...(ev.urlMirrors || [])], tileSize: ev.tileSize || 256 };
  if (ev.minzoom > 0) src.minzoom = ev.minzoom;
  if (typeof ev.maxzoom === 'number') src.maxzoom = ev.maxzoom;
  src.attribution = ev.attribution;
  return src;
}

// A swatch string the current legend can paint as `background`: hard colour bands, one per class.
function bandedGradient(colors) {
  const n = colors.length;
  const stop = (i) => `${((i / n) * 100).toFixed(1)}%`;
  return `linear-gradient(90deg, ${colors.map((c, i) => `${c} ${stop(i)} ${stop(i + 1)}`).join(', ')})`;
}

// The EV legend in the shape the panel reads. `label` is always set; the colours the current legend needs sit at the top
// level, the provider's own detail (classes, stops, unit, note, approximate) stays attached.
function legendOf(ev) {
  const lg = ev.legend;
  if (!lg) return null;
  const out = { kind: lg.kind, label: lg.title };
  if (lg.unit) out.unit = lg.unit;
  if (lg.note) out.note = lg.note;
  if (lg.approximate) out.approximate = true;
  if (lg.kind === 'ramp') {
    out.colors = lg.stops ? lg.stops.map((s) => s.color) : [...lg.colors];
    if (lg.stops) out.stops = lg.stops.map((s) => ({ ...s }));
  } else if (lg.kind === 'solid' || lg.kind === 'dot') {
    out.color = lg.color;
  } else if (lg.kind === 'classes') {
    out.classes = lg.classes.map((c) => ({ ...c }));
    out.colors = lg.classes.map((c) => c.color);
    out.color = bandedGradient(out.colors);
  } else if (lg.kind === 'file') {
    // Koppen: the classes drawn are the classes in the loaded file, grouped A to E; layers.js builds that from the file.
    out.kind = 'grouped';
    out.url = lg.url;
  }
  return out;
}

// The panel's one line. The licence is the canonical record's (data/sources.js) when that record is confirmed; otherwise
// the layer registry's own words, which say what the provider's pages do and do not state.
function sourceLineOf(ev, pres) {
  const rec = ev.sourceId ? sources[ev.sourceId] : null;
  const source = pres.sourceName || text(rec && (rec.short || rec.name)) || text(ev.label);
  let vintage = text(ev.vintage);
  if (ev.retrieved) {
    const dates = Object.entries(ev.retrieved).map(([c, d]) => `${d} (${c === 'north-america' ? 'North America' : 'Europe'})`);
    vintage = `retrieved ${dates.join(' and ')}`;
  }
  if (!vintage) vintage = NV;
  const confirmed = rec && rec.licenseStatus === 'confirmed' && text(rec.license);
  const licenseText = (confirmed ? text(rec.license) : text(ev.licenseText)) || NL;
  const line = { source, vintage, licenseText };
  line.text = typeof ev.sourceLine === 'string' && ev.sourceLine.trim() ? ev.sourceLine.trim() : `${source} · ${vintage} · ${licenseText}`;
  return line;
}

const problems = [];

function build(pres) {
  const ev = layerSourceById(pres.id);
  if (!ev || ev.id !== pres.id) {
    problems.push(`presentation without a source entry: ${pres.id}`);
    return null;
  }
  const geo = ev.kind === 'geojson';
  const entry = {
    id: ev.id,
    label: ev.label,
    group: ev.group,
    role: ev.role,
    color: pres.color,
    panel: pres.panel,
    defaultOn: !!pres.defaultOn,
    kind: geo ? (pres.draw || 'geojson') : (DRAW_BY_SERVED[ev.kind] || 'raster'),
    sourceKind: ev.kind,
    status: ev.status,
    fragile: !!ev.fragile,
    slow: !!ev.slow,
    source: geo ? { type: 'geojson', attribution: ev.attribution } : rasterSource(ev),
    layers: pres.layers.map((def) => ({ ...def, paint: { ...def.paint } })),
    capOpacity: !!pres.capOpacity,
    minzoom: ev.minzoom || 0,
    maxzoom: typeof ev.maxzoom === 'number' ? ev.maxzoom : null,
    attribution: ev.attribution,
    licenseStatus: ev.licenseStatus,
    sourceId: ev.sourceId || null,
    vintage: text(ev.vintage) || NV,
    legend: legendOf(ev),
    sourceLine: sourceLineOf(ev, pres),
  };
  if (geo) {
    entry.urls = { ...ev.urls };
    entry.lazy = !!ev.lazy;
  } else {
    entry.url = ev.url;
    entry.tileSize = ev.tileSize || 256;
  }
  ['coverageNote', 'fallbackNote', 'zoomHint'].forEach((k) => { if (ev[k]) entry[k] = ev[k]; });
  if (pres.trajectoryPair) entry.trajectoryPair = JSON.parse(JSON.stringify(pres.trajectoryPair));
  return entry;
}

export const MAP_LAYERS = PRESENTATION.map(build).filter(Boolean);

// Mismatches between the two halves, empty when they agree: a presentation row with no source entry (found while merging)
// and a source entry that is a panel layer but has no presentation row. The unit test asserts it is empty.
export const REGISTRY_PROBLEMS = [
  ...problems,
  ...panelLayerSources()
    .filter((ev) => !PRESENTATION.some((p) => p.id === ev.id))
    .map((ev) => `source entry without a presentation: ${ev.id}`),
];

// The same list under the name the track spec uses.
export const LAYERS = MAP_LAYERS;

export function layerById(id) {
  return MAP_LAYERS.find((l) => l.id === id) || null;
}

// "Then and later" pairs, flattened: [{ thenId, thenLabel, laterId, laterLabel, group }]. Only pairs the registry names.
export function trajectoryPairs() {
  const out = [];
  MAP_LAYERS.forEach((l) => {
    if (!l.trajectoryPair) return;
    l.trajectoryPair.later.forEach((later) => {
      out.push({ thenId: l.id, thenLabel: l.trajectoryPair.thenLabel, laterId: later.id, laterLabel: later.label, group: l.group });
    });
  });
  return out;
}

// The one string a panel row prints under the layer's name.
export function rowSourceText(entry) {
  return entry && entry.sourceLine ? entry.sourceLine.text : '';
}
