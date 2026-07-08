import { regions, values, criteria } from '../data/regions.js?v=usab16';
import { regionDepth } from '../data/region-depth.js?v=usab16';
import { v1Lookup } from '../data/v1-lookup.js?v=usab16';
import { landStanding } from '../data/land-standing.js?v=usab16';

// Qualitative (per-jurisdiction) filter definitions — the r4 V1 layers exposed
// as enum filters. These are FILTERS, never scores, same threshold-not-weighting
// discipline as the sliders. Each filter independent; 'any' means no filter;
// a chosen value means the region must match exactly to pass.
const QUAL_FILTERS = [
  {
    id: 'foreign_ownership',
    label: 'Foreign ownership',
    options: ['any', 'yes', 'restricted', 'no'],
    pick: (rid) => v1Lookup.legal_ownership?.[rid]?.foreign_ownership?.allowed,
  },
  {
    id: 'affordability_band',
    label: 'Affordability',
    options: ['any', 'cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'],
    pick: (rid) => v1Lookup.land_cost?.[rid]?.affordability_band,
  },
  {
    id: 'buffering_strength',
    label: 'Climate buffering',
    options: ['any', 'very_low', 'low', 'moderate', 'high', 'very_high'],
    pick: (rid) => v1Lookup.climate_buffering?.[rid]?.buffering_strength,
  },
  {
    id: 'regulatory_direction',
    label: 'Legal direction',
    options: ['any', 'stable', 'tightening', 'loosening', 'volatile'],
    pick: (rid) => v1Lookup.legal_ownership?.[rid]?.regulatory_direction,
  },
];

// ====================================================================
// Continents, the "whole world" seam. Adding a continent is one entry
// here plus that continent's verified data. No render or map-engine change.
// ====================================================================

const CONTINENTS = {
  'europe':        { label: 'Europe',        center: [3, 48],    zoom: 4.0, minZoom: 3,   maxZoom: 9 },
  'north-america': { label: 'North America', center: [-100, 45], zoom: 3.2, minZoom: 2.5, maxZoom: 9 },
};
const DEFAULT_CONTINENT = 'europe';

// Processed GeoJSON layers are per-continent (Europe-clipped vs NA-clipped).
// The map loads the active continent's files and swaps them on a continent switch
// via source.setData, so EU visitors never download the NA payload.
const CONTINENT_LAYER_DATA = {
  'water-stress':    { 'europe': 'data/processed/water-stress.geojson',    'north-america': 'data/processed/water-stress-na.geojson' },
  'water-depletion': { 'europe': 'data/processed/water-depletion.geojson', 'north-america': 'data/processed/water-depletion-na.geojson' },
  'conflict':        { 'europe': 'data/processed/conflict.geojson',        'north-america': 'data/processed/conflict-na.geojson' },
  'regen-network':   { 'europe': 'data/processed/ecovillages.geojson',     'north-america': 'data/processed/ecovillages-na.geojson' },
};

// Continents that actually have regions in the data right now. The switcher
// (and any NA UI) only appears once a continent has verified data, so the live
// site never shows an empty continent.
function continentsPresent() {
  return Object.keys(CONTINENTS).filter((c) => regions.some((r) => r.continent === c));
}

// ====================================================================
// State
// ====================================================================

const state = {
  continent: DEFAULT_CONTINENT,
  thresholds: Object.fromEntries(
    criteria.map((c) => [c.id, thresholdDefault(c)])
  ),
  passing: Object.fromEntries(regions.map((r) => [r.id, true])),
  // Region ids the visitor has pinned. A membership Set, never ranked, never scored.
  // Persisted to the URL as ?pin=id,id so a shortlist is shareable like thresholds.
  shortlist: new Set(),
  // Qualitative per-jurisdiction filters (r4 V1 layers). 'any' = no filter.
  // Persisted as ?q.<field>=<value> alongside the other URL state.
  qualFilters: Object.fromEntries(QUAL_FILTERS.map((qf) => [qf.id, 'any'])),
  mapLayers: {
    // imagery / terrain
    'hillshade': true,    // relief texture under the data
    'topo': false,
    'satellite': false,
    'night-lights': false,
    // existing data
    'forest-change': false,
    'water-stress': false,
    'water-depletion': false,
    'conflict': false,
    'regen-network': true, // ecovillages, the framework's signature
    // expanded data layers (verified public tile/WMS services, 2026-07)
    'precipitation': false,
    'soil-carbon': false,  // dynamic WMS (~3s/tile) — great on-demand, too slow as a default
    'land-cover': false,
    'solar-pv': false,
    'population': false,
    'travel-time': false,
    'seismic': false,
    'coastal-flood': false,
  },
};

let mapInstance = null;
let regionMarkers = {};

// ====================================================================
// Helpers
// ====================================================================

function el(tag, opts = {}) {
  const n = document.createElement(tag);
  if (opts.className) n.className = opts.className;
  if (opts.text != null) n.textContent = opts.text;
  if (opts.style) Object.assign(n.style, opts.style);
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) n.setAttribute(k, v);
  return n;
}

function fmtVal(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toFixed(Math.abs(v) < 10 ? 1 : 0);
}

function normalize(v, lo, hi) {
  if (typeof v !== 'number') return 0;
  return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}

function rampColor(ramp, t) {
  const n = ramp.length - 1;
  const pos = t * n;
  const idx = Math.min(n - 1, Math.max(0, Math.floor(pos)));
  return pos - idx > 0.5 ? ramp[idx + 1] : ramp[idx];
}

// Ramp colors double as TEXT color in the summary/compare tables, but the
// light ends of the ramps (#e8e4d8, even #f6f2eb) are near-invisible on the
// paper background. This darkens a color just enough to reach WCAG AA 4.5:1
// as text on --paper, preserving its hue so the color coding still reads.
const _textSafeCache = {};
function textSafeColor(hexColor) {
  if (_textSafeCache[hexColor]) return _textSafeCache[hexColor];
  const m = String(hexColor).replace('#', '').match(/../g);
  if (!m || m.length < 3) return hexColor;
  const bg = [246, 242, 235]; // --paper
  const lum = (c) => {
    const f = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const contrast = (a, b) => {
    const l1 = lum(a); const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  let c = m.map((x) => parseInt(x, 16));
  for (let i = 0; i < 24 && contrast(c, bg) < 4.5; i++) {
    c = c.map((v) => Math.max(0, Math.round(v * 0.9)));
  }
  const out = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  _textSafeCache[hexColor] = out;
  return out;
}

function thresholdDirection(higherIs) {
  return higherIs === 'better' ? 'min' : 'max';
}

function thresholdDefault(crit) {
  // Defaults set so all regions pass on load
  return thresholdDirection(crit.higherIs) === 'min' ? crit.rangeMin : crit.rangeMax;
}

function thresholdStep(crit) {
  const span = crit.rangeMax - crit.rangeMin;
  if (span <= 1) return 0.01;
  if (span <= 5) return 0.1;
  if (span <= 50) return 1;
  return 10;
}

function regionPasses(regionId) {
  // Threshold (numeric) filters.
  for (const crit of criteria) {
    const v = values[regionId][crit.id];
    if (typeof v.value !== 'number') continue;
    const dir = thresholdDirection(crit.higherIs);
    const th = state.thresholds[crit.id];
    const ok = dir === 'min' ? v.value >= th : v.value <= th;
    if (!ok) return false;
  }
  // Qualitative (per-jurisdiction) filters. Same pass/fail semantics: any
  // mismatch fails. Region with missing data for a chosen filter fails to it.
  for (const qf of QUAL_FILTERS) {
    const want = state.qualFilters[qf.id];
    if (want === 'any') continue;
    const got = qf.pick(regionId);
    if (got !== want) return false;
  }
  return true;
}

function anyFilterActive() {
  return (
    criteria.some((c) => state.thresholds[c.id] !== thresholdDefault(c)) ||
    QUAL_FILTERS.some((qf) => state.qualFilters[qf.id] !== 'any')
  );
}

// Regions of the currently-active continent. Render functions still emit ALL
// regions (tagged data-continent, CSS toggles visibility); this is used wherever
// we COUNT or LIST, match bar, slider hints, so totals reflect what's on screen.
function activeRegions() {
  return regions.filter((r) => r.continent === state.continent);
}

// ====================================================================
// URL-encoded threshold state
// ====================================================================
// The URL carries only non-default thresholds (`?t.climate=15&t.water_stress=0.3`)
// so shared links stay clean and a bare URL stays bare.

function clampThreshold(crit, n) {
  return Math.max(crit.rangeMin, Math.min(crit.rangeMax, n));
}

function applyThresholdsFromURL() {
  const params = new URLSearchParams(window.location.search);
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  for (const [key, value] of params.entries()) {
    if (!key.startsWith('t.')) continue;
    const critId = key.slice(2);
    const crit = byId[critId];
    if (!crit) continue;
    const num = parseFloat(value);
    if (!Number.isFinite(num)) continue;
    state.thresholds[critId] = clampThreshold(crit, num);
  }
}

// Restore a shared shortlist from ?pin=id,id. Unknown ids are skipped silently
// so a stale or hand-edited link never throws. Backward-compatible: no pin param
// means an empty shortlist, and existing ?t.*-only links are untouched.
function applyShortlistFromURL() {
  const params = new URLSearchParams(window.location.search);
  const pin = params.get('pin');
  if (!pin) return;
  const known = new Set(regions.map((r) => r.id));
  pin.split(',').map((s) => s.trim()).filter(Boolean).forEach((id) => {
    if (known.has(id)) state.shortlist.add(id);
  });
}

// Restore qualitative filters from ?q.<field>=<value>. Unknown fields and out-
// of-enum values are ignored silently (backward-compatible with ?t.*+?pin= links).
function applyQualFromURL() {
  const params = new URLSearchParams(window.location.search);
  for (const qf of QUAL_FILTERS) {
    const val = params.get(`q.${qf.id}`);
    if (val && qf.options.includes(val)) state.qualFilters[qf.id] = val;
  }
}

let _urlWriteTimer = null;
// Writes the FULL shareable state, non-default thresholds (`t.<id>`) plus the
// pinned shortlist (`pin=id,id`). Named for thresholds for history reasons, but
// it owns the whole query string so a slider move never drops the shortlist and
// vice-versa. Both the slider path and the star path call it.
function writeThresholdsToURL() {
  const params = new URLSearchParams();
  for (const crit of criteria) {
    const current = state.thresholds[crit.id];
    const def = thresholdDefault(crit);
    if (current !== def) {
      const step = thresholdStep(crit);
      const decimals = step < 1 ? 2 : 0;
      // Trim trailing zeros only in the FRACTIONAL part (0.30 -> 0.3). Never strip
      // an integer's trailing zeros (1600 must not become 16, which would clamp
      // back to the slider floor on reload).
      let s = Number(current).toFixed(decimals);
      if (s.includes('.')) s = s.replace(/0+$/, '').replace(/\.$/, '');
      params.set(`t.${crit.id}`, s);
    }
  }
  if (state.shortlist.size) {
    params.set('pin', [...state.shortlist].join(','));
  }
  // Qualitative filters (only non-'any' written).
  for (const qf of QUAL_FILTERS) {
    const v = state.qualFilters[qf.id];
    if (v && v !== 'any') params.set(`q.${qf.id}`, v);
  }
  const qs = params.toString();
  const newURL = qs ? `${window.location.pathname}?${qs}` : window.location.pathname;
  // replaceState, sliders should NOT pollute browser history
  window.history.replaceState(null, '', newURL);
  updateOgImageMeta();
}

function scheduleURLWrite() {
  if (_urlWriteTimer) clearTimeout(_urlWriteTimer);
  _urlWriteTimer = setTimeout(writeThresholdsToURL, 400);
}

// ====================================================================
// Dynamic og:image hint
// ====================================================================
// When URL state filters the view, swap og:image to a richer variant.
// Logic: no filters -> default og.png; filters narrow to exactly one
// passing region -> region-specific variant; otherwise -> og-filtered.png.

// With filters active, point og:image at the dynamic card (/api/og) carrying the
// current query so a JS-aware consumer sees the live result. Crawlers (no JS)
// get correct meta from the /share route instead — see shareTargetUrl below.
// No filters → the static default card.
function pickOgImagePath() {
  if (!anyFilterActive()) return 'og.png';
  const qs = window.location.search;
  return 'api/og' + (qs && qs !== '?' ? qs : '');
}

function updateOgImageMeta() {
  const tag = document.querySelector('meta[property="og:image"]');
  if (!tag) return;
  const base = 'https://land-selection-framework.vercel.app/';
  const path = pickOgImagePath();
  const next = base + path;
  if (tag.getAttribute('content') !== next) {
    tag.setAttribute('content', next);
  }
}

// ====================================================================
// Map
// ====================================================================

// Graceful degradation when the map library or its tiles can't load, the page's
// real content (criteria, data, sources) does not depend on the map.
function showMapFallback() {
  const mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.textContent = '';
    const msg = document.createElement('div');
    msg.className = 'map-fallback';
    const strong = document.createElement('strong');
    strong.textContent = 'Interactive map unavailable.';
    msg.appendChild(strong);
    msg.appendChild(document.createElement('br'));
    msg.appendChild(document.createTextNode("The regional comparison and criteria below don't depend on it, scroll on."));
    mapEl.appendChild(msg);
  }
  const controls = document.querySelector('.map-controls');
  if (controls) controls.style.display = 'none';
}

function initMap() {
  if (typeof maplibregl === 'undefined' || !document.getElementById('map')) {
    showMapFallback();
    return;
  }
  mapInstance = new maplibregl.Map({
    container: 'map',
    style: {
      version: 8,
      sources: {
        'carto-positron': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
          ],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors · © CARTO',
        },
      },
      layers: [{ id: 'base', type: 'raster', source: 'carto-positron' }],
    },
    center: CONTINENTS[state.continent].center,
    zoom: CONTINENTS[state.continent].zoom,
    minZoom: CONTINENTS[state.continent].minZoom,
    maxZoom: CONTINENTS[state.continent].maxZoom,
  });

  mapInstance.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

  // Hardening: a single tile/source failure (a WMS momentarily down, a rotated
  // token) must never break the map or spam the console. Swallow per-source tile
  // errors quietly; the rest of the map and every other layer keep working.
  mapInstance.on('error', (e) => {
    if (e && (e.sourceId || (e.error && /tile|source/i.test(String(e.error.message))))) return;
  });

  mapInstance.on('load', () => {
    // === Terrain & imagery overlays (added first so data overlays render on top) ===

    // Esri World Hillshade, terrain relief shading
    mapInstance.addSource('hillshade', {
      type: 'raster',
      tiles: ['https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: 'Esri · USGS · NOAA',
      maxzoom: 16,
    });
    mapInstance.addLayer({
      id: 'hillshade', source: 'hillshade', type: 'raster',
      layout: { visibility: state.mapLayers['hillshade'] ? 'visible' : 'none' },
      paint: { 'raster-opacity': 0.7 },
    });

    // OpenTopoMap, terrain map with contour lines
    mapInstance.addSource('topo', {
      type: 'raster',
      tiles: [
        'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://b.tile.opentopomap.org/{z}/{x}/{y}.png',
        'https://c.tile.opentopomap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '© OpenTopoMap (CC-BY-SA) · © OpenStreetMap contributors',
      maxzoom: 17,
    });
    mapInstance.addLayer({
      id: 'topo', source: 'topo', type: 'raster',
      layout: { visibility: state.mapLayers['topo'] ? 'visible' : 'none' },
      paint: { 'raster-opacity': 0.78 },
    });

    // Sentinel-2 cloudless 2021, current satellite imagery
    mapInstance.addSource('satellite', {
      type: 'raster',
      tiles: ['https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg'],
      tileSize: 256,
      attribution: 'Sentinel-2 cloudless · EOX IT Services GmbH · Copernicus / ESA',
      maxzoom: 14,
    });
    mapInstance.addLayer({
      id: 'satellite', source: 'satellite', type: 'raster',
      layout: { visibility: state.mapLayers['satellite'] ? 'visible' : 'none' },
      paint: { 'raster-opacity': 0.92 },
    });

    // NASA GIBS VIIRS Black Marble, night-time lights (development / electrification proxy)
    mapInstance.addSource('night-lights', {
      type: 'raster',
      tiles: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png'],
      tileSize: 256,
      attribution: 'NASA Earth Observatory · NOAA · DoD · Black Marble 2016',
      maxzoom: 8,
    });
    mapInstance.addLayer({
      id: 'night-lights', source: 'night-lights', type: 'raster',
      layout: { visibility: state.mapLayers['night-lights'] ? 'visible' : 'none' },
      paint: { 'raster-opacity': 0.85 },
    });

    // === Expanded data layers (verified public tile/WMS services, 2026-07) ===
    // Each endpoint was curl-verified to return real EPSG:3857 tiles over both
    // continents, CORS-clean, no auth. Raster XYZ or WMS via {bbox-epsg-3857}.
    // These render below the vector data (fills/heatmap/points stay on top).
    const EXTRA_RASTERS = [
      { id: 'precipitation', maxzoom: 18, opacity: 0.7,
        url: 'https://geoserver.openlandmap.org/geoserver/ows?service=WMS&version=1.1.1&request=GetMap&layers=olm:precipitation_sm2rain_ltm&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true',
        attribution: 'Precipitation (long-term mean): OpenLandMap / SM2RAIN · CC-BY-SA 4.0' },
      { id: 'soil-carbon', maxzoom: 18, opacity: 0.78,
        url: 'https://maps.isric.org/mapserv?map=/map/ocs.map&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ocs_0-30cm_mean&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&STYLES=&TRANSPARENT=true',
        attribution: 'Soil organic carbon: ISRIC SoilGrids 2.0 · CC-BY 4.0' },
      { id: 'land-cover', maxzoom: 18, opacity: 0.8,
        url: 'https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image',
        attribution: 'Land cover (10m): Esri, Impact Observatory, Microsoft · CC-BY 4.0' },
      { id: 'solar-pv', maxzoom: 11, opacity: 0.8,
        url: 'https://api.resourcewatch.org/v1/layer/68fe6a1e-6481-43ff-8fc2-cf0d23a7b701/tile/gee/{z}/{x}/{y}',
        attribution: 'Solar PV potential: Global Solar Atlas (World Bank/ESMAP, Solargis) via WRI Resource Watch · CC-BY 4.0' },
      { id: 'population', maxzoom: 7, opacity: 0.82,
        url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GPW_Population_Density_2020/default/2020-01-01/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
        attribution: 'Population density: SEDAC GPW v4.11 via NASA GIBS · CC-BY 4.0' },
      { id: 'travel-time', maxzoom: 18, opacity: 0.72,
        url: 'https://data.malariaatlas.org/geoserver/ows?service=WMS&version=1.1.1&request=GetMap&layers=Accessibility:201501_Global_Travel_Time_to_Cities&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true',
        attribution: 'Travel time to cities (2015): Malaria Atlas Project / Weiss et al. 2018 · CC-BY 4.0' },
      { id: 'seismic', maxzoom: 10, opacity: 0.68,
        url: 'https://tiles.arcgis.com/tiles/txWDfZ2LIgzmw5Ts/arcgis/rest/services/Global_Seismic_Hazard/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Seismic hazard: GEM Global Seismic Hazard Map 2023 · CC-BY' },
      { id: 'coastal-flood', maxzoom: 12, opacity: 0.8,
        url: 'https://tiles.arcgis.com/tiles/7J7WB6yJX0pYke9q/arcgis/rest/services/Coastal_Flooding__rcp8_5_/MapServer/tile/{z}/{y}/{x}',
        attribution: 'Coastal flooding (RCP8.5): WRI Aqueduct Floods · CC-BY 4.0' },
    ];
    EXTRA_RASTERS.forEach((def) => {
      mapInstance.addSource(def.id, {
        type: 'raster', tiles: [def.url], tileSize: 256, maxzoom: def.maxzoom, attribution: def.attribution,
      });
      mapInstance.addLayer({
        id: def.id, source: def.id, type: 'raster',
        layout: { visibility: state.mapLayers[def.id] ? 'visible' : 'none' },
        // Cap opacity so two stacked surfaces blend (lower one shows through)
        // rather than the top surface painting fully opaque over everything below.
        paint: { 'raster-opacity': Math.min(def.opacity, 0.66) },
      });
    });

    // === Data overlays (render on top of imagery) ===

    // Forest cover via Global Forest Watch (Hansen)
    mapInstance.addSource('forest-change', {
      type: 'raster',
      tiles: ['https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.13/dynamic/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: 'Hansen/UMD/Google/USGS/NASA · GFW',
    });
    mapInstance.addLayer({
      id: 'forest-change', source: 'forest-change', type: 'raster',
      layout: { visibility: state.mapLayers['forest-change'] ? 'visible' : 'none' },
      paint: { 'raster-opacity': 0.78 },
    });

    // Water stress polygons (WRI Aqueduct, processed)
    mapInstance.addSource('water-stress', {
      type: 'geojson',
      data: CONTINENT_LAYER_DATA['water-stress'][state.continent],
    });
    mapInstance.addLayer({
      id: 'water-stress', source: 'water-stress', type: 'fill',
      layout: { visibility: state.mapLayers['water-stress'] ? 'visible' : 'none' },
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
    });

    // Water depletion polygons (WRI Aqueduct BAU 2050 depletion, drawdown rate)
    mapInstance.addSource('water-depletion', {
      type: 'geojson',
      data: CONTINENT_LAYER_DATA['water-depletion'][state.continent],
    });
    mapInstance.addLayer({
      id: 'water-depletion', source: 'water-depletion', type: 'fill',
      layout: { visibility: state.mapLayers['water-depletion'] ? 'visible' : 'none' },
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
    });

    // Conflict heatmap (UCDP)
    mapInstance.addSource('conflict', {
      type: 'geojson',
      data: CONTINENT_LAYER_DATA['conflict'][state.continent],
    });
    mapInstance.addLayer({
      id: 'conflict', source: 'conflict', type: 'heatmap',
      layout: { visibility: state.mapLayers['conflict'] ? 'visible' : 'none' },
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
    });

    // Ecovillage points (OSM)
    mapInstance.addSource('regen-network', {
      type: 'geojson',
      data: CONTINENT_LAYER_DATA['regen-network'][state.continent],
    });
    mapInstance.addLayer({
      id: 'regen-network', source: 'regen-network', type: 'circle',
      layout: { visibility: state.mapLayers['regen-network'] ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 3, 3, 7, 6],
        'circle-color': '#3a6a4a',
        'circle-stroke-color': '#f6f2eb',
        'circle-stroke-width': 1.5,
        'circle-opacity': 0.9,
      },
    });

    // Region markers, DOM markers, not GeoJSON, so we can style them as actual labels
    regions.forEach((r) => {
      const wrap = el('div', { className: 'region-marker' });
      wrap.dataset.continent = r.continent;
      wrap.style.setProperty('--marker-color', r.accent);
      wrap.textContent = r.name[0];

      const label = el('div', { className: 'region-label', text: r.name });
      label.setAttribute('aria-hidden', 'true'); // the aria-label below carries the name
      wrap.appendChild(label);

      // Keyboard-operable: same drawer as the region card, reachable by Tab.
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');
      wrap.setAttribute('aria-label', `Open details for ${r.name}`);
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(r.id); }
      });

      // Clicking a marker opens the same region detail drawer as its card.
      wrap.addEventListener('click', (e) => { e.stopPropagation(); openDrawer(r.id); });

      const marker = new maplibregl.Marker({ element: wrap }).setLngLat(r.coords).addTo(mapInstance);
      regionMarkers[r.id] = wrap;
    });
  });
}

// Legend for the data layers currently visible — color meaning, never a score.
// Imagery/terrain layers are self-explanatory and stay out of the legend.
const LEGEND = {
  'precipitation':   { label: 'Precipitation (mean)',     kind: 'ramp',  colors: ['#eef3f6', '#7aa8c8', '#1c4a78'] },
  'water-stress':    { label: 'Water stress, 2050',       kind: 'ramp',  colors: ['#fcecc9', '#e8a64a', '#96201e'] },
  'water-depletion': { label: 'Water depletion, 2050',    kind: 'ramp',  colors: ['#ecdab2', '#d4a266', '#6e321c'] },
  'forest-change':   { label: 'Forest loss (Hansen)',     kind: 'solid', color: '#8a3a2a' },
  'soil-carbon':     { label: 'Soil organic carbon',      kind: 'ramp',  colors: ['#f0e5cf', '#a87a3a', '#3a2a14'] },
  'land-cover':      { label: 'Land cover (10m)',         kind: 'ramp',  colors: ['#3a7a3a', '#e8d8a0', '#9a9a9a'] },
  'solar-pv':        { label: 'Solar PV potential',       kind: 'ramp',  colors: ['#e8e4d8', '#e8b34a', '#b8633a'] },
  'coastal-flood':   { label: 'Coastal flood / SLR',      kind: 'ramp',  colors: ['#dfeef4', '#6aa8cc', '#1c4a70'] },
  'seismic':         { label: 'Seismic hazard',           kind: 'ramp',  colors: ['#e8e0c8', '#d8a04a', '#8a2a2a'] },
  'population':      { label: 'Population density',        kind: 'ramp',  colors: ['#eef0e8', '#9a9a72', '#3a3a2a'] },
  'travel-time':     { label: 'Travel time to cities',    kind: 'ramp',  colors: ['#f4ead8', '#c89a5a', '#6a3a1a'] },
  'conflict':        { label: 'Conflict density',         kind: 'ramp',  colors: ['#d8a0a0', '#b24632', '#5a1a1a'] },
  'regen-network':   { label: 'Ecovillage sites',         kind: 'dot',   color: '#3a6a4a' },
};

function renderMapLegend() {
  const mount = document.getElementById('map-legend');
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  const active = Object.keys(LEGEND).filter((id) => state.mapLayers[id]);
  if (!active.length) { mount.setAttribute('aria-hidden', 'true'); return; }
  mount.setAttribute('aria-hidden', 'false');
  mount.appendChild(el('div', { className: 'map-legend-title', text: 'Active layers' }));
  active.forEach((id) => {
    const def = LEGEND[id];
    const row = el('div', { className: 'legend-row' });
    const sw = el('span', { className: 'legend-swatch' + (def.kind === 'dot' ? ' dot' : '') });
    if (def.kind === 'ramp') sw.style.background = `linear-gradient(90deg, ${def.colors.join(', ')})`;
    else sw.style.background = def.color;
    row.appendChild(sw);
    row.appendChild(el('span', { className: 'legend-label', text: def.label }));
    mount.appendChild(row);
  });
}

function applyLayerVisibility(id) {
  if (mapInstance && mapInstance.getLayer(id)) {
    mapInstance.setLayoutProperty(id, 'visibility', state.mapLayers[id] ? 'visible' : 'none');
  }
}

function renderMapToggles() {
  const togglesContainer = document.getElementById('map-toggles');
  const toggleEls = {};
  const layerDefs = [
    // Climate & water
    { id: 'precipitation', name: 'Precipitation', color: '#3a6a8a', group: 'climate' },
    { id: 'water-stress', name: 'Water stress 2050', color: '#b03a2e', group: 'climate' },
    { id: 'water-depletion', name: 'Water depletion 2050', color: '#aa6032', group: 'climate' },
    // Land & soil
    { id: 'forest-change', name: 'Forest loss', color: '#5a2a2a', group: 'land' },
    { id: 'soil-carbon', name: 'Soil organic carbon', color: '#7a5a2a', group: 'land' },
    { id: 'land-cover', name: 'Land cover (10m)', color: '#4a7a4a', group: 'land' },
    // Energy
    { id: 'solar-pv', name: 'Solar PV potential', color: '#b8633a', group: 'energy' },
    // Hazards
    { id: 'coastal-flood', name: 'Coastal flood / SLR', color: '#2a6a8a', group: 'hazards' },
    { id: 'seismic', name: 'Seismic hazard', color: '#8a5a2a', group: 'hazards' },
    // People & access
    { id: 'population', name: 'Population density', color: '#6a5a4a', group: 'human' },
    { id: 'travel-time', name: 'Travel time to cities', color: '#7a6a8a', group: 'human' },
    { id: 'conflict', name: 'Conflict density', color: '#a05050', group: 'human' },
    { id: 'regen-network', name: 'Ecovillage sites', color: '#3a6a4a', group: 'human' },
    // Terrain & imagery
    { id: 'hillshade', name: 'Terrain relief', color: '#6a5a4a', group: 'imagery' },
    { id: 'topo', name: 'Topographic map', color: '#4a6a3a', group: 'imagery' },
    { id: 'satellite', name: 'Recent satellite', color: '#2a5a7a', group: 'imagery' },
    { id: 'night-lights', name: 'Night lights', color: '#c9a04a', group: 'imagery' },
  ];

  const groups = [
    { key: 'climate', label: 'Climate & water' },
    { key: 'land', label: 'Land & soil' },
    { key: 'energy', label: 'Energy' },
    { key: 'hazards', label: 'Hazards' },
    { key: 'human', label: 'People & access' },
    { key: 'imagery', label: 'Terrain & imagery' },
  ];

  groups.forEach((grp) => {
    const header = el('div', { className: 'map-toggle-group-label', text: grp.label });
    togglesContainer.appendChild(header);

    layerDefs.filter((d) => d.group === grp.key).forEach((def) => {
      // A real <button> so every layer toggle is focusable and keyboard-operable;
      // aria-pressed carries the on/off state to screen readers. Button chrome is
      // reset in a11y.css; the .map-toggle visual style is unchanged.
      const t = el('button', { className: 'map-toggle' + (state.mapLayers[def.id] ? ' on' : ''), attrs: {
        type: 'button',
        'aria-pressed': String(!!state.mapLayers[def.id]),
        'aria-label': `${def.name} map layer`,
      } });
      toggleEls[def.id] = t;
      const dot = el('span', { className: 'dot' });
      dot.setAttribute('aria-hidden', 'true');
      dot.style.setProperty('--toggle-color', def.color);
      t.appendChild(dot);
      t.appendChild(el('span', { className: 'name', text: def.name }));
      t.addEventListener('click', () => {
        // Surfaces stack freely — any layer overlays any other. Opacity is capped
        // (see raster-opacity below) so stacked surfaces blend instead of the top
        // one going fully opaque.
        state.mapLayers[def.id] = !state.mapLayers[def.id];
        applyLayerVisibility(def.id);
        t.classList.toggle('on', state.mapLayers[def.id]);
        t.setAttribute('aria-pressed', String(!!state.mapLayers[def.id]));
        renderMapLegend();
      });
      togglesContainer.appendChild(t);
    });
  });

  // Collapsible Layers panel, starts collapsed on small screens so it doesn't
  // occlude the map; the toggle button works at any width.
  const controls = document.querySelector('.map-controls');
  const toggleBtn = document.getElementById('layers-toggle');
  if (controls && toggleBtn) {
    if (window.matchMedia('(max-width: 880px)').matches) {
      controls.classList.add('collapsed');
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
    toggleBtn.addEventListener('click', () => {
      const collapsed = controls.classList.toggle('collapsed');
      toggleBtn.setAttribute('aria-expanded', String(!collapsed));
    });
  }
}

// ====================================================================
// Region intro cards
// ====================================================================

function renderRegionGrid() {
  const grid = document.getElementById('region-grid');
  regions.forEach((r) => {
    const card = el('div', { className: 'region-card' });
    card.id = `region-${r.id}`;
    card.dataset.continent = r.continent;
    card.style.setProperty('--accent-region', r.accent);

    // Star toggles shortlist membership; stopPropagation so it never opens the drawer.
    const star = el('button', { className: 'region-star', text: '☆', attrs: {
      type: 'button', 'aria-pressed': 'false', title: 'Add to shortlist',
      'aria-label': `Add ${r.name} to your shortlist`,
    } });
    star.addEventListener('click', (e) => { e.stopPropagation(); toggleStar(r.id); });
    card.appendChild(star);

    card.appendChild(el('div', { className: 'name serif', text: r.name }));
    card.appendChild(el('div', { className: 'country', text: r.country }));
    card.appendChild(el('div', { className: 'blurb', text: r.blurb }));

    // Surface "what living here asks of you" — reciprocity made first-class on the
    // card itself, not gated behind opening the drawer. First sentence as a teaser.
    const depth = regionDepth[r.id];
    if (depth) {
      const asksLine = el('div', { className: 'card-asks' });
      asksLine.appendChild(el('span', { className: 'card-asks-label', text: 'Asks of you' }));
      const teaser = depth.asks
        ? depth.asks.split('. ')[0].replace(/\.$/, '') + '.'
        : 'much — read the full case study in the deeper material.';
      asksLine.appendChild(document.createTextNode(' ' + teaser));
      card.appendChild(asksLine);
    }

    card.appendChild(el('div', { className: 'status', text: 'Meets all thresholds' }));

    // The whole card opens the detail drawer (keyboard-accessible).
    card.tabIndex = 0;
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', `View details for ${r.name}`);
    card.addEventListener('click', () => openDrawer(r.id));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openDrawer(r.id); }
    });

    grid.appendChild(card);
  });
}

// ====================================================================
// Criterion cards (with sliders)
// ====================================================================

// Spoken value for a threshold slider, e.g. "at least 15 °C" — mirrors the
// filter semantics (a floor or a ceiling), never a score or a rank.
function sliderValueText(crit, th) {
  const verb = thresholdDirection(crit.higherIs) === 'min' ? 'at least' : 'at most';
  return `${verb} ${fmtVal(th)} ${crit.rangeLabel}`;
}

function renderCriterionCard(crit, isFirst) {
  const card = el('div', { className: 'crit-card' });
  card.id = `crit-${crit.id}`;

  // Head
  const head = el('div', { className: 'head' });
  const titleBox = el('div');
  titleBox.appendChild(el('h3', { className: 'serif', text: crit.name }));
  titleBox.appendChild(el('div', { className: 'metric', text: crit.metric }));
  head.appendChild(titleBox);
  head.appendChild(el('div', { className: 'num', text: `#${crit.askjaNumber}` }));
  card.appendChild(head);

  card.appendChild(el('div', { className: 'framing', text: crit.framing }));

  // Slider
  const dir = thresholdDirection(crit.higherIs);
  const sliderBlock = el('div', { className: 'slider-block' });

  const sliderRow = el('div', { className: 'slider-row' });
  const sliderLabel = el('label', {
    className: 'slider-label',
    text: dir === 'min' ? `Min required ${crit.rangeLabel}` : `Max acceptable ${crit.rangeLabel}`,
    attrs: { for: `slider-${crit.id}` },
  });
  sliderRow.appendChild(sliderLabel);
  const valEl = el('div', { className: 'slider-val' });
  valEl.id = `slider-val-${crit.id}`;
  sliderRow.appendChild(valEl);
  sliderBlock.appendChild(sliderRow);

  // aria-describedby: the live "Pass: …" hint, plus (on the first slider only)
  // the filters-not-ranks note rendered below.
  const describedBy = `slider-hint-${crit.id}` + (isFirst ? ` slider-note-${crit.id}` : '');
  const slider = el('input', {
    attrs: {
      type: 'range',
      id: `slider-${crit.id}`,
      min: String(crit.rangeMin),
      max: String(crit.rangeMax),
      step: String(thresholdStep(crit)),
      value: String(state.thresholds[crit.id]),
      'aria-label': `${crit.name} threshold — ${dir === 'min' ? 'minimum required' : 'maximum acceptable'} ${crit.rangeLabel}`,
      'aria-valuetext': sliderValueText(crit, state.thresholds[crit.id]),
      'aria-describedby': describedBy,
    },
  });
  slider.addEventListener('input', (e) => {
    state.thresholds[crit.id] = parseFloat(e.target.value);
    refreshAll();
    scheduleURLWrite();
  });
  sliderBlock.appendChild(slider);

  const hint = el('div', { className: 'slider-hint' });
  hint.id = `slider-hint-${crit.id}`;
  sliderBlock.appendChild(hint);

  if (isFirst) {
    sliderBlock.appendChild(el('div', {
      className: 'slider-filter-note',
      text: 'Sliders set a threshold and filter — regions that meet it stay, the rest fade. Nothing is scored or ranked.',
      attrs: { id: `slider-note-${crit.id}` },
    }));
  }

  card.appendChild(sliderBlock);

  // Bars per region
  const bars = el('div', { className: 'bar-rows' });
  bars.id = `bars-${crit.id}`;
  regions.forEach((r) => {
    const v = values[r.id][crit.id];
    const t = normalize(v.value, crit.rangeMin, crit.rangeMax);
    const row = el('div', { className: 'bar-row' });
    row.dataset.region = r.id;
    row.dataset.crit = crit.id;
    row.dataset.continent = r.continent;
    const regEl = el('div', { className: 'reg serif', text: r.short || r.name });
    regEl.title = r.name; // full name on hover; bars use the short form to avoid truncation
    row.appendChild(regEl);

    const track = el('div', { className: 'bar-track' });
    const fill = el('div', { className: 'bar-fill' });
    fill.style.width = `${Math.max(2, t * 100)}%`;
    fill.style.background = rampColor(crit.ramp, t);
    track.appendChild(fill);
    const threshold = el('div', { className: 'bar-threshold' });
    threshold.id = `th-${crit.id}-${r.id}`;
    track.appendChild(threshold);
    row.appendChild(track);

    row.appendChild(el('div', { className: 'bar-val mono', text: `${fmtVal(v.value)} ${v.unit}` }));

    const mark = el('div', { className: 'bar-mark', text: '✓' });
    row.appendChild(mark);

    bars.appendChild(row);
  });
  card.appendChild(bars);

  // Footer
  const footer = el('div', { className: 'footer' });
  const a = el('a', { text: crit.source, attrs: { href: crit.sourceUrl, target: '_blank', rel: 'noopener' } });
  footer.appendChild(a);
  footer.appendChild(document.createTextNode(` · ${crit.nativeUnit} · ${crit.license}`));
  card.appendChild(footer);

  return card;
}

function renderCriteriaGrid() {
  const grid = document.getElementById('crit-grid');
  criteria.forEach((c, i) => grid.appendChild(renderCriterionCard(c, i === 0)));
}

// ====================================================================
// Summary table
// ====================================================================

function renderSummaryTable() {
  const table = document.getElementById('sum-table');
  const thead = el('thead');
  const headRow = el('tr');
  headRow.appendChild(el('th', { text: 'Criterion' }));
  regions.forEach((r) => {
    const th = el('th');
    th.id = `sum-th-${r.id}`;
    th.dataset.continent = r.continent;
    const swatch = el('span', { className: 'swatch' });
    swatch.style.background = r.accent;
    th.appendChild(swatch);
    th.appendChild(document.createTextNode(`${r.name} `));
    th.appendChild(el('span', { className: 'small', text: r.country }));
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = el('tbody');
  criteria.forEach((c) => {
    const tr = el('tr');
    // First column: criterion name + its source cue (source · unit · license),
    // the same per-criterion provenance the bar-chart cards show in their footer.
    const critTd = el('td');
    critTd.appendChild(document.createTextNode(c.name));
    const critSrc = el('div', { className: 'crit-src' });
    if (c.source && c.sourceUrl) {
      critSrc.appendChild(el('a', { text: c.source, attrs: { href: c.sourceUrl, target: '_blank', rel: 'noopener' } }));
    } else if (c.source) {
      critSrc.appendChild(document.createTextNode(c.source));
    }
    const critMeta = [c.nativeUnit, c.license].filter(Boolean).join(' · ');
    if (critMeta) critSrc.appendChild(document.createTextNode(`${c.source ? ' · ' : ''}${critMeta}`));
    critTd.appendChild(critSrc);
    tr.appendChild(critTd);
    regions.forEach((r) => {
      const v = values[r.id][c.id];
      const td = el('td');
      td.id = `sum-td-${r.id}-${c.id}`;
      td.dataset.continent = r.continent;
      const t = normalize(v.value, c.rangeMin, c.rangeMax);
      const color = textSafeColor(rampColor(c.ramp, t));

      const valLine = el('div', { className: 'v', style: { color: color } });
      valLine.textContent = `${fmtVal(v.value)} ${v.unit}`;
      td.appendChild(valLine);
      td.appendChild(el('span', { className: 'lab', text: v.label }));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

// ====================================================================
// Sources list
// ====================================================================

function renderSourcesList() {
  const ul = document.getElementById('sources-list');
  const seen = new Set();
  criteria.forEach((c) => {
    if (seen.has(c.source)) return;
    seen.add(c.source);
    const li = el('li');
    const a = el('a', { text: c.source, attrs: { href: c.sourceUrl, target: '_blank', rel: 'noopener' } });
    a.style.color = 'var(--ink-2)';
    a.style.textDecoration = 'underline dotted';
    a.style.textUnderlineOffset = '2px';
    li.appendChild(a);
    ul.appendChild(li);
  });
}

// ====================================================================
// Continent switcher, render-both-and-toggle
// ====================================================================
// All regions live in the DOM; switching just sets body[data-continent],
// which CSS uses to show/hide each continent's cards, bars, summary columns
// and markers. Thresholds are per-criterion, so a switch never disturbs them
// (AC-5 falls out for free). The switcher itself only renders when more than
// one continent has data, until NA ships, the UI is byte-identical to today.

function setContinent(c) {
  if (!CONTINENTS[c] || c === state.continent) return;
  state.continent = c;
  document.body.dataset.continent = c;

  // Re-center the map to the active continent (no re-init, layers persist).
  if (mapInstance) {
    mapInstance.setMinZoom(CONTINENTS[c].minZoom);
    mapInstance.setMaxZoom(CONTINENTS[c].maxZoom);
    mapInstance.flyTo({ center: CONTINENTS[c].center, zoom: CONTINENTS[c].zoom, essential: true });
    // Swap each processed layer to the active continent's GeoJSON.
    for (const [layerId, paths] of Object.entries(CONTINENT_LAYER_DATA)) {
      const src = mapInstance.getSource(layerId);
      if (src && paths[c]) src.setData(paths[c]);
    }
  }

  // Reflect active tab.
  document.querySelectorAll('.continent-tab').forEach((btn) => {
    const on = btn.dataset.continent === c;
    btn.classList.toggle('active', on);
    btn.setAttribute('aria-selected', String(on));
    btn.tabIndex = on ? 0 : -1;
  });

  refreshAll();
  // Let independently-rendered consumers (the inline source <details>) react.
  document.dispatchEvent(new CustomEvent('lsf:continentchange', { detail: { continent: c } }));
  trackEvent('continent_switch', { continent: c });
}

function initContinentSwitcher() {
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

// ====================================================================
// Filter state refresh
// ====================================================================

// Debounced screen-reader announcement of the match count. Sliders fire
// continuously while dragging; announcing every step would flood a screen
// reader, so we wait for the value to settle. Silent until a filter is active.
let _announceTimer = null;
function announceMatches(count, total) {
  const live = document.getElementById('match-announce');
  if (!live) return;
  if (_announceTimer) clearTimeout(_announceTimer);
  if (!anyFilterActive()) { live.textContent = ''; return; }
  _announceTimer = setTimeout(() => {
    live.textContent = `${count} of ${total} regions match your criteria.`;
  }, 700);
}

function refreshAll() {
  // Recompute passing (over all regions, cheap, and ids never collide)
  regions.forEach((r) => { state.passing[r.id] = regionPasses(r.id); });
  // Counts and lists reflect only the active continent (what's visible).
  const inView = activeRegions();
  const passingCount = inView.filter((r) => state.passing[r.id]).length;

  // Update match bar
  document.getElementById('match-count').textContent = passingCount;
  const totalEl = document.getElementById('match-total');
  if (totalEl) totalEl.textContent = inView.length;
  const detailEl = document.getElementById('match-detail');
  if (!anyFilterActive()) {
    detailEl.textContent = 'No filters yet — every region is shown. Move any slider above to begin.';
  } else {
    const passing = inView.filter((r) => state.passing[r.id]);
    detailEl.textContent = passing.length === 0
      ? 'No regions match — relax a threshold'
      : (passing.length === 1 ? 'Your matching region' : 'Your matching regions');
  }
  renderMatchRegions();
  announceMatches(passingCount, inView.length);

  // Update region cards
  regions.forEach((r) => {
    const card = document.getElementById(`region-${r.id}`);
    if (!card) return;
    card.classList.toggle('fail', !state.passing[r.id]);
    const status = card.querySelector('.status');
    if (status) {
      status.textContent = state.passing[r.id] ? 'Meets all thresholds' : 'Fails one or more thresholds';
    }
  });

  // Update map markers
  regions.forEach((r) => {
    const marker = regionMarkers[r.id];
    if (marker) marker.classList.toggle('dim', !state.passing[r.id]);
  });

  // Update criterion cards (slider values, threshold positions, per-bar pass/fail)
  criteria.forEach((c) => {
    const dir = thresholdDirection(c.higherIs);
    const th = state.thresholds[c.id];
    const def = thresholdDefault(c);
    const isActive = th !== def;

    // Slider value display
    const valEl = document.getElementById(`slider-val-${c.id}`);
    if (valEl) {
      while (valEl.firstChild) valEl.removeChild(valEl.firstChild);
      valEl.appendChild(document.createTextNode(fmtVal(th)));
      const u = el('span', { className: 'u', text: c.rangeLabel });
      valEl.appendChild(u);
    }

    // Keep the spoken value in step with the visual one ("at least 15 °C")
    const sliderEl = document.getElementById(`slider-${c.id}`);
    if (sliderEl) sliderEl.setAttribute('aria-valuetext', sliderValueText(c, th));

    // Slider hint
    const hint = document.getElementById(`slider-hint-${c.id}`);
    if (hint) {
      if (!isActive) {
        hint.textContent = dir === 'min' ? 'Slide right to require more' : 'Slide left to require less';
      } else {
        const passNames = activeRegions()
          .filter((r) => {
            const v = values[r.id][c.id];
            return dir === 'min' ? v.value >= th : v.value <= th;
          })
          .map((r) => r.name);
        hint.textContent = passNames.length === 0
          ? 'No regions meet this threshold'
          : `Pass: ${passNames.join(', ')}`;
      }
    }

    // Threshold line on each bar
    const thPos = normalize(th, c.rangeMin, c.rangeMax);
    regions.forEach((r) => {
      const el2 = document.getElementById(`th-${c.id}-${r.id}`);
      if (el2) {
        el2.style.left = `${thPos * 100}%`;
        el2.style.display = isActive ? 'block' : 'none';
      }
    });

    // Per-bar pass/fail styling
    regions.forEach((r) => {
      const v = values[r.id][c.id];
      const rowPass = dir === 'min' ? v.value >= th : v.value <= th;
      const row = document.querySelector(`.bar-row[data-region="${r.id}"][data-crit="${c.id}"]`);
      if (row) {
        row.classList.toggle('fail', !rowPass);
        const mark = row.querySelector('.bar-mark');
        if (mark) mark.textContent = rowPass ? '✓' : '✕';
      }
    });
  });

  // Update summary table
  regions.forEach((r) => {
    const th = document.getElementById(`sum-th-${r.id}`);
    if (th) th.classList.toggle('region-fail', !state.passing[r.id]);
    criteria.forEach((c) => {
      const td = document.getElementById(`sum-td-${r.id}-${c.id}`);
      if (td) td.classList.toggle('region-fail', !state.passing[r.id]);
    });
  });

  updateShareButtonVisibility();
  updateNextStep();
  updateOgImageMeta();
}

// ====================================================================
// Reset button
// ====================================================================

function resetThresholds() {
  criteria.forEach((c) => { state.thresholds[c.id] = thresholdDefault(c); });
  // Update slider input values
  criteria.forEach((c) => {
    const slider = document.querySelector(`#crit-${c.id} input[type="range"]`);
    if (slider) slider.value = String(state.thresholds[c.id]);
  });
  // Reset qualitative filters too — Reset means "clear all filters", not just sliders.
  QUAL_FILTERS.forEach((qf) => { state.qualFilters[qf.id] = 'any'; });
  document.querySelectorAll('select[data-qual-filter]').forEach((sel) => { sel.value = 'any'; });
  refreshAll();
  // Reset flushes immediately, no debounce
  if (_urlWriteTimer) { clearTimeout(_urlWriteTimer); _urlWriteTimer = null; }
  writeThresholdsToURL();
}

document.getElementById('reset-btn').addEventListener('click', resetThresholds);

// ====================================================================
// Qualitative (per-jurisdiction) filter UI
// ====================================================================
// One <select> per QUAL_FILTERS entry, mounted in #qual-filters. Selection
// updates state, re-runs the filter, and writes ?q.<field>=<value> to the URL.
// 'any' (default) clears that filter.

function renderQualFilters() {
  const mount = document.getElementById('qual-filters');
  if (!mount) return;
  for (const qf of QUAL_FILTERS) {
    const wrap = el('label', { className: 'qual-filter' });
    wrap.appendChild(el('span', { className: 'qual-filter-label', text: qf.label }));
    const sel = document.createElement('select');
    sel.id = `qual-filter-${qf.id}`;
    sel.dataset.qualFilter = qf.id;
    sel.className = 'qual-filter-select';
    for (const opt of qf.options) {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt === 'any' ? 'any' : opt.replace(/_/g, ' ');
      if (opt === state.qualFilters[qf.id]) o.selected = true;
      sel.appendChild(o);
    }
    sel.addEventListener('change', () => {
      state.qualFilters[qf.id] = sel.value;
      refreshAll();
      if (_urlWriteTimer) { clearTimeout(_urlWriteTimer); _urlWriteTimer = null; }
      writeThresholdsToURL();
      trackEvent('qual_filter_change', { field: qf.id, value: sel.value });
    });
    wrap.appendChild(sel);
    mount.appendChild(wrap);
  }
}

// ====================================================================
// Analytics, Vercel Web Analytics custom events (no-op if blocked/absent)
// ====================================================================

function trackEvent(name, data) {
  try {
    if (typeof window.va === 'function') window.va('event', { name, ...(data || {}) });
  } catch { /* analytics must never break the page */ }
}

// ====================================================================
// Share button, copies the current URL to clipboard
// ====================================================================

// The URL we actually hand out when sharing. With state in the query, share the
// /share route (crawler-facing meta + dynamic card, then redirects humans to the
// app). With no state, share the bare app URL.
function shareTargetUrl() {
  const qs = window.location.search;
  if (!qs || qs === '?') return `${window.location.origin}/`;
  return `${window.location.origin}/share${qs}`;
}

function initShareButton() {
  const btn = document.getElementById('share-btn');
  const note = document.getElementById('share-note');
  if (!btn) return;

  let noteTimer = null;
  let revertTimer = null;

  btn.addEventListener('click', async () => {
    // Flush any pending debounced URL write so we copy the latest state
    if (_urlWriteTimer) {
      clearTimeout(_urlWriteTimer);
      _urlWriteTimer = null;
      writeThresholdsToURL();
    }
    const url = shareTargetUrl();

    // On touch devices with a native share sheet, prefer it over clipboard.
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({
          title: 'Land Selection Framework',
          text: 'Bioregional criteria, filtered:',
          url,
        });
        trackEvent('share', { method: 'native', has_filters: anyFilterActive() });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user dismissed the sheet
        // any other failure falls through to the clipboard path below
      }
    }

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        copied = true;
      } else {
        // Fallback for non-secure contexts (file://, http on LAN)
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      copied = false;
    }

    if (note) {
      note.textContent = copied ? 'Link copied' : 'Copy failed, long-press to copy';
      note.classList.add('visible');
      if (noteTimer) clearTimeout(noteTimer);
      noteTimer = setTimeout(() => note.classList.remove('visible'), 2000);
    }
    if (copied) {
      trackEvent('share', { method: 'clipboard', has_filters: anyFilterActive() });
      btn.classList.add('copied');
      btn.setAttribute('aria-label', 'Link copied to clipboard');
      if (revertTimer) clearTimeout(revertTimer);
      revertTimer = setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('aria-label', 'Copy the current filter URL to clipboard');
      }, 2000);
    }
  });
}

initShareButton();

// Reveal/hide share button when filter activity changes, refreshAll runs after every change.
function updateShareButtonVisibility() {
  const bar = document.querySelector('.match-bar');
  if (bar) bar.classList.toggle('has-filters', anyFilterActive());
}

// ====================================================================
// Signup form (Web3Forms endpoint, mailto fallback in the footnote)
// ====================================================================

function setStatus(statusEl, kind, text, link) {
  statusEl.className = 'form-status' + (kind ? ` ${kind}` : '');
  while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
  statusEl.appendChild(document.createTextNode(text));
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.style.color = 'var(--accent)';
    a.style.textDecoration = 'underline dotted';
    a.style.textUnderlineOffset = '2px';
    statusEl.appendChild(document.createTextNode(' '));
    statusEl.appendChild(a);
    statusEl.appendChild(document.createTextNode(link.tail || ''));
  }
}

function initSignupForm() {
  const form = document.getElementById('signup-form');
  const status = document.getElementById('form-status');
  const emailInput = document.getElementById('signup-email');
  if (!form || !status || !emailInput) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus(status, 'error', 'Please enter a valid email.');
      return;
    }

    // Honeypot check, if hidden field is filled, silently succeed but discard
    const honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) {
      setStatus(status, 'success', 'Thanks, you\'re in.');
      emailInput.value = '';
      return;
    }

    setStatus(status, '', 'Sending…');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      // Web3Forms returns { success: true } on success, { success: false } on rejection
      if (response.ok && data.success !== false) {
        trackEvent('signup', { source: 'hero' });
        setStatus(status, 'success', 'Thanks, you\'re in. I won\'t share your email.');
        emailInput.value = '';
      } else {
        setStatus(status, 'error', 'Something went wrong. Please email me directly.');
      }
    } catch (err) {
      setStatus(status, 'error', 'Network error. Please email me directly.');
    }
  });
}

// ====================================================================
// Signup modal, engagement-gated (scroll / slider / dwell), dismissable.
// Never locks the page; fires once per visitor after real engagement.
// ====================================================================

function initSignupModal() {
  const STORAGE_KEY = 'lsf-modal-state';
  const DWELL_FALLBACK_MS = 30000;   // gentle ask after this long even for a passive reader

  const modal = document.getElementById('signup-modal');
  const card = modal && modal.querySelector('.modal-card');
  const closeBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('modal-form');
  const emailInput = document.getElementById('modal-email');
  const status = document.getElementById('modal-status');

  if (!modal || !form || !emailInput) return;

  // Query-string override: ?modal=1 forces show regardless of prior state (for testing)
  const forceShow = new URLSearchParams(window.location.search).get('modal') === '1';

  const prior = (() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  })();

  if (!forceShow && (prior === 'subscribed' || prior === 'dismissed')) {
    // Already engaged, never re-prompt
    return;
  }

  let modalShown = false;
  let lastFocusedBeforeModal = null;

  // Engagement-gated trigger: the sliders are NEVER locked. Show the modal once,
  // after the visitor has actually engaged, scrolled past the criteria section,
  // moved a threshold slider, or dwelled ~30s. First signal wins; then unbind all.
  const teardownTriggers = [];
  function armTrigger(unbind) { teardownTriggers.push(unbind); }
  function fireModalOnce(trigger) {
    if (modalShown) return;
    teardownTriggers.splice(0).forEach((fn) => { try { fn(); } catch {} });
    showModal(trigger);
  }

  if (forceShow) {
    setTimeout(() => fireModalOnce('force'), 200);
  } else {
    // 1) Scrolled to/through the criteria section, they've seen the core content.
    const criteria = document.querySelector('.criteria');
    const onScroll = () => {
      const reached = criteria
        ? criteria.getBoundingClientRect().top < window.innerHeight * 0.6
        : window.scrollY > window.innerHeight * 1.3;
      if (reached) fireModalOnce('scroll');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    armTrigger(() => window.removeEventListener('scroll', onScroll));

    // 2) Moved a threshold slider, high-intent engagement with the actual tool.
    const sliders = document.querySelectorAll('.criteria input[type="range"]');
    const onSlider = () => fireModalOnce('slider');
    sliders.forEach((s) => s.addEventListener('input', onSlider));
    armTrigger(() => sliders.forEach((s) => s.removeEventListener('input', onSlider)));

    // 3) Dwell fallback, a gentle ask even for a passive reader.
    const dwell = setTimeout(() => fireModalOnce('dwell'), DWELL_FALLBACK_MS);
    armTrigger(() => clearTimeout(dwell));
  }

  function persistState(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
  }

  function showModal(trigger) {
    if (modalShown) return;
    modalShown = true;
    lastFocusedBeforeModal = document.activeElement;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    trackEvent('modal_shown', { trigger: trigger || 'unknown' });
    // Defer focus to allow transition
    setTimeout(() => emailInput.focus({ preventScroll: true }), 60);
  }

  function dismissModal(reason) {
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    persistState(reason); // 'subscribed' or 'dismissed'
    trackEvent('modal_dismissed', { reason });
    if (lastFocusedBeforeModal && typeof lastFocusedBeforeModal.focus === 'function') {
      try { lastFocusedBeforeModal.focus({ preventScroll: true }); } catch {}
    }
  }

  // Dismiss handlers
  closeBtn && closeBtn.addEventListener('click', () => dismissModal('dismissed'));

  // Click outside card, also a clear "no thanks"
  modal.addEventListener('click', (e) => {
    if (e.target === modal) dismissModal('dismissed');
  });

  // ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('visible')) {
      dismissModal('dismissed');
    }
  });

  // Focus trap (loose, Tab/Shift+Tab cycle through focusable inside modal)
  card && card.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = card.querySelectorAll('button, input[type="email"], [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // Form submit, same Web3Forms endpoint as hero, just a second form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus(status, 'error', 'Please enter a valid email.');
      return;
    }
    const honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) {
      // Bot, silently succeed but discard
      setStatus(status, 'success', 'Thanks, you\'re in.');
      setTimeout(() => dismissModal('subscribed'), 900);
      return;
    }
    setStatus(status, '', 'Sending…');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success !== false) {
        trackEvent('signup', { source: 'modal' });
        setStatus(status, 'success', 'Thanks, you\'re in. Closing this in a moment.');
        emailInput.value = '';
        setTimeout(() => dismissModal('subscribed'), 1100);
      } else {
        setStatus(status, 'error', 'Something went wrong. You can continue without subscribing.');
      }
    } catch {
      setStatus(status, 'error', 'Network error. You can continue without subscribing.');
    }
  });
}

// ====================================================================
// Scenario presets, pre-set THRESHOLD combinations (filtering, never scoring)
// ====================================================================
// A preset just moves sliders to a named starting point. It composes nothing,
// computes no score, and every threshold stays adjustable afterward. Each chip
// announces exactly which thresholds it sets.

const PRESETS = [
  // solar_pv floor at 1400 (not 1500): with the current data, 1500 leaves ZERO
  // matches on the default (Europe) continent — the only ≥1500 region there
  // fails the water threshold. 1400 still means strong solar and keeps the
  // starting point honest on both continents.
  { id: 'offgrid', label: 'Off-grid self-sufficiency',
    sets: { solar_pv: 1400, water_stress: 0.4, population: 50 } },
  { id: 'cool-wet', label: 'Cool & water-secure',
    sets: { climate: 14, water_stress: 0.35, forest_change: 0 } },
  { id: 'affordable', label: 'Quiet & rural',
    sets: { population: 40 } },
  { id: 'high-solar', label: 'High solar, dry-tolerant',
    sets: { solar_pv: 1600 } },
];

function presetThresholdSummary(preset) {
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  return Object.entries(preset.sets).map(([cid, val]) => {
    const c = byId[cid];
    if (!c) return '';
    const verb = thresholdDirection(c.higherIs) === 'min' ? 'at least' : 'at most';
    return `${c.name} ${verb} ${fmtVal(val)} ${c.rangeLabel}`;
  }).filter(Boolean).join('; ');
}

function applyPreset(preset) {
  // A preset is a clean starting point, reset every threshold to default first,
  // then apply only the criteria this preset names. So clicking a scenario gives
  // exactly that scenario, never a layer on top of prior fiddling.
  criteria.forEach((c) => { state.thresholds[c.id] = thresholdDefault(c); });
  const byId = Object.fromEntries(criteria.map((c) => [c.id, c]));
  for (const [cid, val] of Object.entries(preset.sets)) {
    const c = byId[cid];
    if (c) state.thresholds[cid] = clampThreshold(c, val);
  }
  // Sync the slider inputs to the new state (same as resetThresholds does).
  criteria.forEach((c) => {
    const slider = document.querySelector(`#crit-${c.id} input[type="range"]`);
    if (slider) slider.value = String(state.thresholds[c.id]);
  });
  refreshAll();
  if (_urlWriteTimer) { clearTimeout(_urlWriteTimer); _urlWriteTimer = null; }
  writeThresholdsToURL();
  trackEvent('preset_applied', { preset: preset.id });
}

function renderPresetChips() {
  const mount = document.getElementById('preset-chips');
  if (!mount) return;
  PRESETS.forEach((p) => {
    const chip = el('button', { className: 'preset-chip', text: p.label, attrs: { type: 'button' } });
    const summary = presetThresholdSummary(p);
    chip.title = `Starting point, sets ${summary}. Adjust freely after.`;
    chip.setAttribute('aria-label', `Apply the ${p.label} scenario. Sets ${summary}. A starting point you can adjust.`);
    chip.addEventListener('click', () => applyPreset(p));
    mount.appendChild(chip);
  });
}

// ====================================================================
// Guided entry, the top-of-page on-ramp (Phase A)
// ====================================================================
// Surfaces the SAME presets as the primary hook above the fold. A guided
// choice sets thresholds (filtering, never scoring), then carries the visitor
// down to their result and pulses it. The neutral chip clears all thresholds
// so "show me everything" is one tap too.

function scrollToResultMoment() {
  const bar = document.querySelector('.match-bar');
  if (!bar) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  bar.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'center' });
  // Retrigger the pulse animation even if it ran moments ago.
  bar.classList.remove('pulse');
  void bar.offsetWidth; // force reflow
  bar.classList.add('pulse');
  setTimeout(() => bar.classList.remove('pulse'), 1600);
}

function renderGuidedEntry() {
  const mount = document.getElementById('guided-chips');
  if (!mount) return;

  PRESETS.forEach((p) => {
    const chip = el('button', { className: 'guided-chip', text: p.label, attrs: { type: 'button' } });
    const summary = presetThresholdSummary(p);
    chip.title = `Sets ${summary}. A starting point, adjust freely after.`;
    chip.setAttribute('aria-label', `${p.label}. Sets ${summary}. A starting point you can adjust.`);
    chip.addEventListener('click', () => {
      applyPreset(p);                       // applyPreset already writes URL + tracks preset_applied
      trackEvent('guided_start', { preset: p.id });
      scrollToResultMoment();
    });
    mount.appendChild(chip);
  });

  // Neutral entry: clear everything and show every region.
  const all = el('button', { className: 'guided-chip neutral', text: 'Show all 20 regions', attrs: { type: 'button' } });
  all.setAttribute('aria-label', 'Clear all thresholds and show every region.');
  all.addEventListener('click', () => {
    resetThresholds();
    trackEvent('guided_start', { preset: 'all' });
    scrollToResultMoment();
  });
  mount.appendChild(all);
}

// The "result moment": once any filter is active, name the matching regions as
// clickable chips. A membership list in declaration order, never ranked.
function renderMatchRegions() {
  const mount = document.getElementById('match-regions');
  if (!mount) return;
  while (mount.firstChild) mount.removeChild(mount.firstChild);
  if (!anyFilterActive()) return; // no result moment until the visitor has chosen
  const passing = activeRegions().filter((r) => state.passing[r.id]);
  passing.forEach((r) => {
    const chip = el('button', { className: 'region-chip', attrs: { type: 'button' } });
    const dot = el('span', { className: 'region-chip-dot' });
    dot.style.background = r.accent;
    chip.appendChild(dot);
    chip.appendChild(document.createTextNode(r.short || r.name));
    chip.setAttribute('aria-label', `Open details for ${r.name}`);
    chip.addEventListener('click', () => openDrawer(r.id));
    mount.appendChild(chip);
  });
}

// ====================================================================
// Shortlist, a user-pinned Set (never ranked) + a compare view
// ====================================================================

function toggleStar(regionId) {
  if (state.shortlist.has(regionId)) state.shortlist.delete(regionId);
  else state.shortlist.add(regionId);
  // Persist immediately, flush any pending threshold debounce so we don't race it.
  if (_urlWriteTimer) { clearTimeout(_urlWriteTimer); _urlWriteTimer = null; }
  writeThresholdsToURL();
  updateStarVisuals();
  updateShortlistCount();
  if (document.getElementById('compare-overlay')?.classList.contains('open')) renderCompare();
  trackEvent('shortlist_toggle', { region: regionId, size: state.shortlist.size });
}

function updateStarVisuals() {
  regions.forEach((r) => {
    const on = state.shortlist.has(r.id);
    const card = document.getElementById(`region-${r.id}`);
    if (card) {
      card.classList.toggle('starred', on);
      const star = card.querySelector('.region-star');
      if (star) {
        star.textContent = on ? '★' : '☆';
        star.classList.toggle('on', on);
        star.setAttribute('aria-pressed', String(on));
        star.setAttribute('aria-label', on
          ? `Remove ${r.name} from your shortlist`
          : `Add ${r.name} to your shortlist`);
      }
    }
  });
  const dStar = document.querySelector('.drawer-star');
  if (dStar && dStar.dataset.region) {
    const on = state.shortlist.has(dStar.dataset.region);
    dStar.textContent = on ? '★ Shortlisted' : '☆ Add to shortlist';
    dStar.classList.toggle('on', on);
    dStar.setAttribute('aria-pressed', String(on));
  }
}

function updateShortlistCount() {
  const btn = document.getElementById('shortlist-btn');
  if (btn) {
    const n = state.shortlist.size;
    btn.textContent = `Your shortlist (${n})`;
    btn.setAttribute('aria-label', `Open your shortlist, ${n} ${n === 1 ? 'region' : 'regions'} pinned`);
  }
}

// Compare view = the summary-table component scoped to the pinned set, in
// SELECTION ORDER. Explicitly not sorted by value or by thresholds-passed: the
// framework never ranks places.
function renderCompare() {
  const body = document.getElementById('compare-body');
  if (!body) return;
  while (body.firstChild) body.removeChild(body.firstChild);

  const ids = [...state.shortlist];
  if (ids.length === 0) {
    body.appendChild(el('p', {
      className: 'compare-empty',
      text: 'No regions shortlisted yet. Tap the star on any region card to add it here, then compare your picks side by side.',
    }));
    return;
  }

  const starred = ids.map((id) => regions.find((r) => r.id === id)).filter(Boolean);

  const scroller = el('div', { style: { overflowX: 'auto' } });
  const table = el('table', { className: 'sum-table' });

  const thead = el('thead');
  const hr = el('tr');
  hr.appendChild(el('th', { text: 'Criterion' }));
  starred.forEach((r) => {
    const th = el('th');
    const sw = el('span', { className: 'swatch' });
    sw.style.background = r.accent;
    th.appendChild(sw);
    th.appendChild(document.createTextNode(`${r.name} `));
    th.appendChild(el('span', { className: 'small', text: r.country }));
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);

  const tbody = el('tbody');
  criteria.forEach((c) => {
    const tr = el('tr');
    tr.appendChild(el('td', { text: c.name }));
    starred.forEach((r) => {
      const v = values[r.id][c.id];
      const td = el('td');
      const t = normalize(v.value, c.rangeMin, c.rangeMax);
      const valLine = el('div', { className: 'v', style: { color: textSafeColor(rampColor(c.ramp, t)) } });
      valLine.textContent = `${fmtVal(v.value)} ${v.unit}`;
      td.appendChild(valLine);
      td.appendChild(el('span', { className: 'lab', text: v.label }));
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  scroller.appendChild(table);
  body.appendChild(scroller);
}

function openCompare() {
  const overlay = document.getElementById('compare-overlay');
  if (!overlay) return;
  renderCompare();
  overlay.classList.add('open');
  overlay.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  const closeBtn = document.getElementById('compare-close');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  trackEvent('compare_open', { size: state.shortlist.size });
}

function closeCompare() {
  const overlay = document.getElementById('compare-overlay');
  if (!overlay) return;
  overlay.classList.remove('open');
  overlay.setAttribute('aria-hidden', 'true');
  if (!document.getElementById('region-drawer')?.classList.contains('open')) {
    document.body.classList.remove('panel-open');
  }
}

function initCompare() {
  const btn = document.getElementById('shortlist-btn');
  if (btn) btn.addEventListener('click', openCompare);
  const closeBtn = document.getElementById('compare-close');
  if (closeBtn) closeBtn.addEventListener('click', closeCompare);
  const overlay = document.getElementById('compare-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeCompare(); });
    trapTabWithin(overlay.querySelector('.compare-panel'));
  }
}

// ====================================================================
// Region detail drawer, "what living here asks of you"
// ====================================================================

let _lastFocusBeforeDrawer = null;

function openDrawer(regionId) {
  const r = regions.find((x) => x.id === regionId);
  const panel = document.getElementById('region-drawer');
  const body = document.getElementById('drawer-body');
  if (!r || !panel || !body) return;
  while (body.firstChild) body.removeChild(body.firstChild);

  const head = el('div', { className: 'drawer-head' });
  head.style.setProperty('--accent-region', r.accent);
  const titleWrap = el('div', { className: 'drawer-titles' });
  titleWrap.appendChild(el('div', { className: 'drawer-name serif', text: r.name }));
  titleWrap.appendChild(el('div', { className: 'drawer-country', text: r.country }));
  head.appendChild(titleWrap);
  const star = el('button', { className: 'drawer-star', attrs: { type: 'button' } });
  star.dataset.region = r.id;
  const on = state.shortlist.has(r.id);
  star.textContent = on ? '★ Shortlisted' : '☆ Add to shortlist';
  star.classList.toggle('on', on);
  star.setAttribute('aria-pressed', String(on));
  star.addEventListener('click', () => toggleStar(r.id));
  head.appendChild(star);
  body.appendChild(head);

  body.appendChild(el('p', { className: 'drawer-blurb', text: r.blurb }));

  // Permalink to the region's own indexable page (internal linking + a shareable
  // deep link). The page itself links back into the tool pre-pinned to this region.
  body.appendChild(el('a', {
    text: `Open ${r.name} as a full page →`,
    attrs: { href: `/region/${r.id}.html` },
    style: {
      display: 'inline-block', marginBottom: '20px',
      fontFamily: "'Spectral', Georgia, serif", fontStyle: 'italic', fontSize: '14px',
      color: 'var(--accent)', textDecoration: 'underline dotted', textUnderlineOffset: '3px',
    },
  }));

  // "Land standing" — whose land this is, the tenure regime, the good-faith way
  // in, and the obligation arriving carries. A qualitative reciprocity dimension,
  // never scored. Nothing renders for regions without an entry yet.
  const standing = landStanding[r.id];
  if (standing) {
    const ls = el('div', { className: 'drawer-land-standing' });
    ls.appendChild(el('h4', { text: 'Land standing' }));
    const lsRows = [
      ['Whose land', standing.territory],
      ['Tenure', standing.tenure],
      ['Arriving in good faith', standing.entry],
      ['What it asks', standing.obligation],
    ];
    lsRows.forEach(([label, val]) => {
      if (!val) return;
      const row = el('div', { className: 'ls-row' });
      row.appendChild(el('span', { className: 'ls-label', text: label }));
      row.appendChild(el('span', { className: 'ls-val', text: val }));
      ls.appendChild(row);
    });
    if (standing.source) {
      const src = el('div', { className: 'ls-src' });
      src.appendChild(document.createTextNode('Source: '));
      if (standing.sourceUrl) {
        src.appendChild(el('a', { text: standing.source, attrs: { href: standing.sourceUrl, target: '_blank', rel: 'noopener' } }));
      } else {
        src.appendChild(document.createTextNode(standing.source));
      }
      ls.appendChild(src);
    }
    body.appendChild(ls);
  }

  // "What living here asks of you", deep-link for case studies, prose for the
  // verified regions, nothing rendered when there is no depth entry yet.
  const depth = regionDepth[r.id];
  if (depth) {
    const asksWrap = el('div', { className: 'drawer-asks' });
    asksWrap.appendChild(el('h4', { text: 'What living here asks of you' }));
    if (depth.caseStudy) {
      asksWrap.appendChild(el('p', {
        className: 'drawer-asks-text',
        text: 'This region has a full case study in the deeper material.',
      }));
      asksWrap.appendChild(el('a', {
        className: 'drawer-deeplink',
        text: 'Read the full case study →',
        attrs: { href: `deeper.html${depth.caseStudy}` },
      }));
    } else if (depth.asks) {
      asksWrap.appendChild(el('p', { className: 'drawer-asks-text', text: depth.asks }));
      if (depth.source) {
        const src = el('div', { className: 'drawer-asks-src' });
        src.appendChild(document.createTextNode('Source: '));
        if (depth.sourceUrl) {
          src.appendChild(el('a', { text: depth.source, attrs: { href: depth.sourceUrl, target: '_blank', rel: 'noopener' } }));
        } else {
          src.appendChild(document.createTextNode(depth.source));
        }
        asksWrap.appendChild(src);
      }
    }
    body.appendChild(asksWrap);
  }

  // All eight criterion values, read live from regions.js, with per-cell sources.
  const list = el('div', { className: 'drawer-criteria' });
  list.appendChild(el('h4', { text: 'The eight criteria, with sources' }));
  criteria.forEach((c) => {
    const v = values[r.id][c.id];
    const row = el('div', { className: 'drawer-crit-row' });
    row.appendChild(el('div', { className: 'drawer-crit-name', text: c.name }));
    const valWrap = el('div', { className: 'drawer-crit-val' });
    valWrap.appendChild(el('span', { className: 'dc-num mono', text: `${fmtVal(v.value)} ${v.unit}` }));
    valWrap.appendChild(el('span', { className: 'dc-lab', text: v.label }));
    row.appendChild(valWrap);
    const srcWrap = el('div', { className: 'drawer-crit-src' });
    if (v.source && v.sourceUrl) {
      srcWrap.appendChild(el('a', { text: v.source, attrs: { href: v.sourceUrl, target: '_blank', rel: 'noopener' } }));
    } else if (v.source) {
      srcWrap.appendChild(document.createTextNode(v.source));
    }
    if (v.vintage) srcWrap.appendChild(document.createTextNode(` · ${v.vintage}`));
    row.appendChild(srcWrap);
    list.appendChild(row);
  });
  body.appendChild(list);

  _lastFocusBeforeDrawer = document.activeElement;
  panel.setAttribute('aria-label', `${r.name} — region detail`);
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  document.body.classList.add('panel-open');
  const closeBtn = document.getElementById('drawer-close');
  if (closeBtn) setTimeout(() => closeBtn.focus(), 50);
  trackEvent('drawer_open', { region: regionId });
}

function closeDrawer() {
  const panel = document.getElementById('region-drawer');
  if (!panel) return;
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
  if (!document.getElementById('compare-overlay')?.classList.contains('open')) {
    document.body.classList.remove('panel-open');
  }
  if (_lastFocusBeforeDrawer && typeof _lastFocusBeforeDrawer.focus === 'function') {
    try { _lastFocusBeforeDrawer.focus({ preventScroll: true }); } catch {}
  }
}

// Loose tab trap for a dialog container — Tab/Shift+Tab cycle through the
// focusable elements inside it. Same pattern the signup modal already uses.
function trapTabWithin(container) {
  if (!container) return;
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = container.querySelectorAll(
      'button, a[href], input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
}

function initDrawer() {
  const closeBtn = document.getElementById('drawer-close');
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  const panel = document.getElementById('region-drawer');
  if (panel) {
    panel.addEventListener('click', (e) => { if (e.target === panel) closeDrawer(); });
    trapTabWithin(panel.querySelector('.drawer-panel'));
  }
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (document.getElementById('region-drawer')?.classList.contains('open')) closeDrawer();
    else if (document.getElementById('compare-overlay')?.classList.contains('open')) closeCompare();
  });
}

// ====================================================================
// Actionable next step on the match bar
// ====================================================================

function updateNextStep() {
  const row = document.getElementById('next-step');
  const lead = document.getElementById('next-step-lead');
  if (!row) return;
  const passing = activeRegions().filter((r) => state.passing[r.id]);
  row.dataset.firstPassing = passing.length ? passing[0].id : '';
  if (passing.length === 0) {
    row.classList.add('empty');
    if (lead) lead.textContent = 'No regions meet your current criteria. Loosen a threshold to bring regions back.';
  } else {
    row.classList.remove('empty');
    if (lead) lead.textContent = `${passing.length} ${passing.length === 1 ? 'region meets' : 'regions meet'} your criteria — each asks something of you in return.`;
  }
}

function initNextStep() {
  const asksBtn = document.getElementById('ns-asks');
  if (asksBtn) {
    asksBtn.addEventListener('click', () => {
      const row = document.getElementById('next-step');
      const id = row && row.dataset.firstPassing;
      if (id) openDrawer(id);
    });
  }
  const shareBtn = document.getElementById('ns-share');
  if (shareBtn) {
    let revert = null;
    shareBtn.addEventListener('click', async () => {
      if (_urlWriteTimer) { clearTimeout(_urlWriteTimer); _urlWriteTimer = null; writeThresholdsToURL(); }
      const url = shareTargetUrl();
      let copied = false;
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(url);
          copied = true;
        } else {
          const ta = document.createElement('textarea');
          ta.value = url; ta.setAttribute('readonly', '');
          ta.style.position = 'fixed'; ta.style.opacity = '0';
          document.body.appendChild(ta); ta.select();
          copied = document.execCommand('copy');
          document.body.removeChild(ta);
        }
      } catch { copied = false; }
      const original = 'Share this view';
      shareBtn.textContent = copied ? 'Link copied' : 'Copy failed';
      if (revert) clearTimeout(revert);
      revert = setTimeout(() => { shareBtn.textContent = original; }, 2000);
      if (copied) trackEvent('share', { method: 'next_step', has_filters: anyFilterActive() });
    });
  }
}

// ====================================================================
// Boot
// ====================================================================

// CRITICAL: apply URL thresholds BEFORE any render so sliders/bars init
// at the shared state, not at defaults that snap on first paint.
applyThresholdsFromURL();
applyShortlistFromURL();
applyQualFromURL();

// Scope the page to the active continent before any render so the CSS
// show/hide rule is live from the first paint.
document.body.dataset.continent = state.continent;

renderRegionGrid();
renderMapToggles();
renderMapLegend();
renderCriteriaGrid();
renderSummaryTable();
renderSourcesList();
renderPresetChips();
renderQualFilters();
renderGuidedEntry();
initContinentSwitcher();
initDrawer();
initCompare();
initNextStep();
updateStarVisuals();    // reflect any ?pin= regions restored from the URL
updateShortlistCount();
refreshAll();
try { initMap(); } catch (err) { console.error('Map init failed:', err); showMapFallback(); }
initSignupForm();
initSignupModal();
