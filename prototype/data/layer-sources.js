// Map-layer source registry (EV-LAYERS, 2026-10-05).
//
// One entry per map layer the site serves (17 today) plus the layers added in the 2026-10 upgrade
// (river flood x3, ESA WorldCover, two Koppen-Geiger layers) and the candidates that were probed and
// retired, kept with the reason so nobody re-tries a dead end.
//
// DATA ONLY. Nothing here scores, ranks or combines layers: a layer is a picture of one published
// dataset in its own units, with its source, vintage and licence beside it.
//
// The ids of the 17 layers that exist today equal the keys of `state.mapLayers` in src/main.js
// (the map track merges its presentation fields by id). The registry holds the SOURCE side:
// where tiles come from, zoom limits, attribution, licence, vintage, legend, health flags.
//
// Fields
//   id, label, group            group keys follow the panel: climate | land | energy | hazards | human | imagery
//   role                        'data' (a data layer) | 'imagery' (terrain / imagery) | 'basemap'
//   panel                       true when the layer is a panel toggle (retired entries and basemaps are false)
//   kind                        'xyz' | 'wms' | 'wmts-kvp' | 'arcgis-export' | 'geojson'
//   url                         MapLibre tile template ('{bbox-epsg-3857}' for wms / arcgis-export); null for geojson
//   urlMirrors                  optional extra hosts for the same tiles
//   urls                        geojson only: { europe, 'north-america' } paths relative to the site root
//   tileSize, minzoom, maxzoom  raster tile limits as the service really serves them
//   attribution                 text for the map attribution control
//   sourceId                    id in data/sources.js (EV-SRC seed table); relatedSourceIds for secondary sources
//   licenseText, licenseStatus  licence as stated by the provider; 'confirmed' | 'confirmed-secondary' | 'unconfirmed'
//                               (data/sources.js is the canonical licence record; this mirrors it for the panel)
//   vintage                     the period / version the layer depicts
//   verified                    YYYY-MM-DD: the day the endpoint (or data file) was last checked
//   probeZooms                  zooms scripts/probe_layers.py requests (6 tiles each: Europe and North America)
//   probePoints, probeMinFill, probeMinPass   probe tuning for layers that are legitimately sparse
//   status                      'active' | 'fragile' | 'retired'
//   fragile, slow               health flags; the probe reports them as warnings, the map shows a quiet note
//   legend                      { kind: 'ramp'|'classes'|'solid'|'dot'|'file', ... } colours are the provider's own where stated
//   coverageNote, fallbackNote, zoomHint   plain words for the panel row
//   lazy, dataFrom              geojson: load on first toggle; the WP that produces the file

export const LAYER_SOURCES_VERIFIED = '2026-10-05';

const ARCGIS_WRI = 'https://tiles.arcgis.com/tiles/7J7WB6yJX0pYke9q/arcgis/rest/services';
const RIVER_FLOOD_ATTRIBUTION =
  'WRI Aqueduct Floods (GLOFRIS; Winsemius, Ward, Luo), tiles via the UNICEF Children’s Climate Risk Index datasets. CC BY 4.0';

// Same single-hue blue ramp for the three river-flood layers: the stops come from the service's own
// legend image (https://tiles.arcgis.com/.../River_Flooding__historical_/MapServer/legend?f=json,
// read 2026-10-05): 0 m is #a2daff (light blue) and 32 m is #002674 (dark blue).
const RIVER_FLOOD_LEGEND = {
  kind: 'ramp',
  title: 'Flood inundation depth',
  unit: 'm',
  stops: [
    { value: 0, label: '0 m', color: '#a2daff' },
    { value: 32, label: '32 m', color: '#002674' },
  ],
  note: 'Depth of water over the land in metres, in the provider’s own colours; deeper is darker blue.',
};

const RIVER_FLOOD_COVERAGE = 'Rivers only; blank away from floodplains is normal.';

// ESA WorldCover 2021 v2 classes: codes, names and RGB copied from the Product User Manual V2.0
// (https://esa-worldcover.s3.eu-central-1.amazonaws.com/v200/2021/docs/WorldCover_PUM_V2.0.pdf, table of
// classes, p. 14-16, opened 2026-10-05). Hex is the same RGB.
const WORLDCOVER_CLASSES = [
  { code: 10, label: 'Tree cover', rgb: [0, 100, 0], color: '#006400' },
  { code: 20, label: 'Shrubland', rgb: [255, 187, 34], color: '#ffbb22' },
  { code: 30, label: 'Grassland', rgb: [255, 255, 76], color: '#ffff4c' },
  { code: 40, label: 'Cropland', rgb: [240, 150, 255], color: '#f096ff' },
  { code: 50, label: 'Built-up', rgb: [250, 0, 0], color: '#fa0000' },
  { code: 60, label: 'Bare / sparse vegetation', rgb: [180, 180, 180], color: '#b4b4b4' },
  { code: 70, label: 'Snow and ice', rgb: [240, 240, 240], color: '#f0f0f0' },
  { code: 80, label: 'Permanent water bodies', rgb: [0, 100, 200], color: '#0064c8' },
  { code: 90, label: 'Herbaceous wetland', rgb: [0, 150, 160], color: '#0096a0' },
  { code: 95, label: 'Mangroves', rgb: [0, 207, 117], color: '#00cf75' },
  { code: 100, label: 'Moss and lichen', rgb: [250, 230, 160], color: '#fae6a0' },
];

// Esri / Impact Observatory 10 m land cover: classes and colours read from the ImageServer's own
// legend (https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/legend?f=json,
// 2026-10-05). 'Clouds' and 'No Data' are service classes, kept so the legend matches the picture.
const ESRI_LC_CLASSES = [
  { label: 'Water', color: '#1a5bab' },
  { label: 'Trees', color: '#358221' },
  { label: 'Flooded vegetation', color: '#87d19e' },
  { label: 'Crops', color: '#ffdb5c' },
  { label: 'Built area', color: '#ed022a' },
  { label: 'Bare ground', color: '#ede9e4' },
  { label: 'Snow / ice', color: '#f2faff' },
  { label: 'Clouds', color: '#c8c8c8' },
  { label: 'Rangeland', color: '#efcfa8' },
];

// GEM Global Seismic Hazard Map 2023.1: eleven classes with the service legend's colours
// (https://tiles.arcgis.com/tiles/txWDfZ2LIgzmw5Ts/arcgis/rest/services/Global_Seismic_Hazard/MapServer/legend?f=json, 2026-10-05).
const SEISMIC_CLASSES = [
  { label: '0.00-0.01', color: '#ffffff' },
  { label: '0.01-0.02', color: '#d7e3ee' },
  { label: '0.02-0.03', color: '#b5caff' },
  { label: '0.03-0.05', color: '#8fb3ff' },
  { label: '0.05-0.08', color: '#7f97ff' },
  { label: '0.08-0.13', color: '#abcf63' },
  { label: '0.13-0.20', color: '#e8f59e' },
  { label: '0.20-0.35', color: '#fffa14' },
  { label: '0.35-0.55', color: '#ffd121' },
  { label: '0.55-0.90', color: '#ffa30a' },
  { label: '0.90-1.50', color: '#ff4c00' },
];

// A swatch gradient for layers whose provider legend was not read. `approximate: true` tells the panel
// to word it as "low to high" and never to print numbers it does not have.
const approxRamp = (title, colors, note) => ({ kind: 'ramp', title, unit: null, approximate: true, colors, note });

export const layerSources = [
  // ===================================================================
  // Climate and water
  // ===================================================================
  {
    id: 'precipitation',
    label: 'Precipitation',
    group: 'climate', role: 'data', panel: true,
    kind: 'wms',
    url: 'https://geoserver.openlandmap.org/geoserver/ows?service=WMS&version=1.1.1&request=GetMap&layers=olm:precipitation_sm2rain_ltm&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true',
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'Precipitation (long-term mean): OpenLandMap / SM2RAIN · CC-BY-SA 4.0',
    sourceId: 'openlandmap-precip',
    licenseText: 'licence not confirmed (the existing attribution says CC-BY-SA 4.0)', licenseStatus: 'unconfirmed',
    vintage: 'long-term mean (SM2RAIN-derived)',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: true,
    legend: approxRamp('Precipitation (long-term mean)', ['#eef3f6', '#7aa8c8', '#1c4a78'], 'Wetter is darker blue; the service does not publish a unit on its legend.'),
    coverageNote: 'Global; drawn on request by a WMS, so a tile can take a few seconds.',
    fallbackNote: 'This service is slow or unavailable right now; the per-region water values on each card are not affected.',
  },
  {
    id: 'water-stress',
    label: 'Water stress 2050',
    group: 'climate', role: 'data', panel: true,
    kind: 'geojson', url: null,
    urls: { 'europe': 'data/processed/water-stress.geojson', 'north-america': 'data/processed/water-stress-na.geojson' },
    lazy: true,
    attribution: 'WRI Aqueduct 4.0 water stress, 2050 (processed to the continent footprint)',
    sourceId: 'aqueduct-40',
    licenseText: 'CC BY 4.0', licenseStatus: 'confirmed-secondary',
    vintage: '2050, business as usual (WRI Aqueduct 4.0)',
    verified: '2026-10-05', probeZooms: [],
    status: 'active', fragile: false, slow: false,
    legend: approxRamp('Water stress, 2050', ['#fcecc9', '#e8a64a', '#96201e'], 'WRI’s own water-stress classes, light to dark; this project does not combine or rescale them.'),
    coverageNote: 'Europe and North America (continent-clipped files).',
  },
  {
    id: 'water-depletion',
    label: 'Water depletion 2050',
    group: 'climate', role: 'data', panel: true,
    kind: 'geojson', url: null,
    urls: { 'europe': 'data/processed/water-depletion.geojson', 'north-america': 'data/processed/water-depletion-na.geojson' },
    lazy: true,
    attribution: 'WRI Aqueduct 4.0 groundwater / surface-water depletion, 2050 (processed to the continent footprint)',
    sourceId: 'aqueduct-40',
    licenseText: 'CC BY 4.0', licenseStatus: 'confirmed-secondary',
    vintage: '2050, business as usual (WRI Aqueduct 4.0)',
    verified: '2026-10-05', probeZooms: [],
    status: 'active', fragile: false, slow: false,
    legend: approxRamp('Water depletion, 2050', ['#ecdab2', '#d4a266', '#6e321c'], 'WRI’s own depletion classes, light to dark; this project does not combine or rescale them.'),
    coverageNote: 'Europe and North America (continent-clipped files).',
  },
  {
    // New in the 2026-10 upgrade. Data file produced by EV-KOPPEN-MAP from Beck et al. 2023 (Figshare, md5 verified 2026-10-04).
    id: 'koppen-now',
    label: 'Climate zones 1991-2020 (Köppen-Geiger)',
    group: 'climate', role: 'data', panel: true,
    kind: 'geojson', url: null,
    urls: { 'europe': 'data/processed/koppen-1991-2020-eu.geojson', 'north-america': 'data/processed/koppen-1991-2020-na.geojson' },
    lazy: true, dataFrom: 'EV-KOPPEN-MAP',
    attribution: 'Beck et al. 2023, Scientific Data 10:724, CC BY 4.0 (0.1 degree, simplified)',
    sourceId: 'beck-koppen-2023',
    licenseText: 'CC BY 4.0', licenseStatus: 'confirmed',
    vintage: '1991-2020 (observed climate)',
    verified: '2026-10-04', probeZooms: [],
    status: 'active', fragile: false, slow: false,
    legend: { kind: 'file', url: 'data/processed/koppen-legend.json', title: 'Köppen-Geiger classes' },
    coverageNote: 'Europe and North America; polygons simplified from the 0.1 degree grid, so edges are approximate.',
  },
  {
    id: 'koppen-2041-2070',
    label: 'Climate zones 2041-2070 (Köppen-Geiger, SSP2-4.5)',
    group: 'climate', role: 'data', panel: true,
    kind: 'geojson', url: null,
    urls: { 'europe': 'data/processed/koppen-2041-2070-ssp245-eu.geojson', 'north-america': 'data/processed/koppen-2041-2070-ssp245-na.geojson' },
    lazy: true, dataFrom: 'EV-KOPPEN-MAP',
    attribution: 'Beck et al. 2023, Scientific Data 10:724, CC BY 4.0 (0.1 degree, simplified)',
    sourceId: 'beck-koppen-2023',
    licenseText: 'CC BY 4.0', licenseStatus: 'confirmed',
    vintage: '2041-2070, SSP2-4.5 (projected climate)',
    verified: '2026-10-04', probeZooms: [],
    status: 'active', fragile: false, slow: false,
    legend: { kind: 'file', url: 'data/processed/koppen-legend.json', title: 'Köppen-Geiger classes' },
    coverageNote: 'Europe and North America; a projection under one scenario, shown beside the 1991-2020 layer so the shift is visible, not as a forecast.',
  },

  // ===================================================================
  // Land and soil
  // ===================================================================
  {
    id: 'forest-change',
    label: 'Forest loss',
    group: 'land', role: 'data', panel: true,
    kind: 'xyz',
    url: 'https://tiles.globalforestwatch.org/umd_tree_cover_loss/v1.13/dynamic/{z}/{x}/{y}.png',
    tileSize: 256, minzoom: 0, maxzoom: 22,
    attribution: 'Hansen/UMD/Google/USGS/NASA · GFW',
    sourceId: 'gfw-umd-loss', relatedSourceIds: ['hansen-gfc'],
    licenseText: 'CC BY 4.0 for the Hansen et al. data (confirmed on the data page); the GFW tile service terms are not confirmed', licenseStatus: 'unconfirmed',
    vintage: 'UMD tree cover loss v1.13 (GFW dynamic tiles)',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: false,
    legend: { kind: 'solid', title: 'Forest loss (Hansen)', color: '#8a3a2a', note: 'Loss pixels in one colour; the layer carries no scale.' },
    coverageNote: 'The heaviest layer; tiles take 1 to 4 seconds.',
  },
  {
    id: 'soil-carbon',
    label: 'Soil organic carbon',
    group: 'land', role: 'data', panel: true,
    kind: 'wms',
    url: 'https://maps.isric.org/mapserv?map=/map/ocs.map&SERVICE=WMS&VERSION=1.3.0&REQUEST=GetMap&LAYERS=ocs_0-30cm_mean&CRS=EPSG:3857&BBOX={bbox-epsg-3857}&WIDTH=256&HEIGHT=256&FORMAT=image/png&STYLES=&TRANSPARENT=true',
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'Soil organic carbon: ISRIC SoilGrids 2.0 · CC-BY 4.0',
    sourceId: 'isric-wms', relatedSourceIds: ['soilgrids-2'],
    licenseText: 'licence not confirmed (the existing attribution says CC BY 4.0)', licenseStatus: 'unconfirmed',
    vintage: 'SoilGrids 2.0, 0-30 cm mean',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: true,
    legend: approxRamp('Soil organic carbon, 0-30 cm', ['#f0e5cf', '#a87a3a', '#3a2a14'], 'Richer soils are darker brown; the service does not publish a unit on its legend.'),
    coverageNote: 'Global; drawn on request by a WMS, so a tile can take a few seconds.',
    fallbackNote: 'This service is slow or unavailable right now; the per-region soil values on each card are not affected.',
  },
  {
    id: 'land-cover',
    label: 'Land cover (10m)',
    group: 'land', role: 'data', panel: true,
    kind: 'arcgis-export',
    url: 'https://ic.imagery1.arcgis.com/arcgis/rest/services/Sentinel2_10m_LandCover/ImageServer/exportImage?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png&transparent=true&f=image',
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'Land cover (10m): Esri, Impact Observatory, Microsoft · CC-BY 4.0',
    sourceId: 'esri-sentinel2-lc',
    licenseText: 'licence not confirmed (the existing attribution says CC BY 4.0)', licenseStatus: 'unconfirmed',
    vintage: 'Sentinel-2 10 m annual land cover; the year is the service default and is not pinned in the URL',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: true,
    legend: { kind: 'classes', title: 'Land cover (Esri 10 m)', classes: ESRI_LC_CLASSES, note: 'Classes and colours from the service’s own legend.' },
    coverageNote: 'Global; drawn on request by an ImageServer, so a tile can take a few seconds. ESA WorldCover (next entry) is the pinned 2021 alternative.',
    fallbackNote: 'This service is slow or unavailable right now; the per-region land values on each card are not affected.',
  },
  {
    // New in the 2026-10 upgrade. Terrascope WMTS (KVP GetTile; the REST template in the capabilities answers 400).
    id: 'worldcover',
    label: 'Land cover, ESA WorldCover 2021 (10 m)',
    group: 'land', role: 'data', panel: true,
    kind: 'wmts-kvp',
    url: 'https://wmts.terrascope.be/?service=WMTS&request=GetTile&version=1.0.0&layer=esa-worldcover-map-10m-2021-v2_map&style=default&tilematrixset=EPSG:3857&tilematrix={z}&tilerow={y}&tilecol={x}&format=image/png&TIME=2021-01-01',
    tileSize: 256, minzoom: 6, maxzoom: 14,
    attribution: '© ESA WorldCover project 2021 / Contains modified Copernicus Sentinel data (2021) processed by the ESA WorldCover consortium. CC BY 4.0',
    sourceId: 'esa-worldcover-2021',
    licenseText: 'CC BY 4.0 (free of charge, without restriction of use)', licenseStatus: 'confirmed',
    vintage: '2021, product version v2 (200)',
    verified: '2026-10-05', probeZooms: [6, 8, 10],
    status: 'active', fragile: false, slow: true,
    legend: { kind: 'classes', title: 'ESA WorldCover 2021 classes', classes: WORLDCOVER_CLASSES, note: 'Codes, names and colours from the ESA WorldCover Product User Manual V2.0.' },
    coverageNote: 'Global at 10 m; the service serves tiles from zoom 6, so the layer is invisible when zoomed further out.',
    zoomHint: 'Zoom in to see this layer: it appears from zoom level 6.',
    fallbackNote: 'This service is slow or unavailable right now; some tiles took 40 seconds in testing.',
  },

  // ===================================================================
  // Energy
  // ===================================================================
  {
    id: 'solar-pv',
    label: 'Solar PV potential',
    group: 'energy', role: 'data', panel: true,
    kind: 'xyz',
    url: 'https://api.resourcewatch.org/v1/layer/68fe6a1e-6481-43ff-8fc2-cf0d23a7b701/tile/gee/{z}/{x}/{y}',
    tileSize: 256, minzoom: 0, maxzoom: 11,
    attribution: 'Solar PV potential: Global Solar Atlas (World Bank/ESMAP, Solargis) via WRI Resource Watch · CC-BY 4.0',
    sourceId: 'gsa-pvout',
    licenseText: 'licence not confirmed (the existing attribution says CC BY 4.0)', licenseStatus: 'unconfirmed',
    vintage: 'Global Solar Atlas long-term average; version not stated by the Resource Watch layer',
    verified: '2026-10-05', probeZooms: [5, 8],
    status: 'fragile', fragile: true, slow: false,
    legend: approxRamp('Solar PV potential', ['#e8e4d8', '#e8b34a', '#b8633a'], 'Higher potential is darker orange; the layer does not publish a unit on its legend.'),
    coverageNote: 'Global.',
    fallbackNote: 'Tiles come from a third-party Earth Engine path and may be slow or missing; the per-region solar value on each card is not affected.',
  },

  // ===================================================================
  // Hazards
  // ===================================================================
  {
    id: 'coastal-flood',
    label: 'Coastal flood / SLR',
    group: 'hazards', role: 'data', panel: true,
    kind: 'xyz',
    url: `${ARCGIS_WRI}/Coastal_Flooding__rcp8_5_/MapServer/tile/{z}/{y}/{x}`,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: 'Coastal flooding (RCP8.5): WRI Aqueduct Floods · CC-BY 4.0',
    sourceId: 'aqueduct-floods',
    licenseText: 'CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement', licenseStatus: 'confirmed-secondary',
    vintage: 'RCP8.5 scenario; the service item states metres of coastal inundation and no year or return period',
    verified: '2026-10-05', probeZooms: [5, 7],
    probePoints: 'coastal', probeMinFill: 0.0005,
    status: 'active', fragile: false, slow: false,
    legend: {
      kind: 'ramp', title: 'Coastal flood inundation depth', unit: 'm',
      stops: [{ value: 0, label: '0 m', color: '#ffb4b4' }, { value: 40.46, label: '40.46 m', color: '#740000' }],
      note: 'Depth of coastal inundation in metres, in the provider’s own colours (service legend, 2026-10-05).',
    },
    coverageNote: 'Coastal only; blank inland is normal.',
  },
  {
    // New in the 2026-10 upgrade. Rehosted WRI Aqueduct Floods tiles (UNICEF Children's Climate Risk Index datasets).
    id: 'river-flood-current',
    label: 'River flood depth, 1-in-50-year (1960-1999)',
    group: 'hazards', role: 'data', panel: true,
    kind: 'xyz',
    url: `${ARCGIS_WRI}/River_Flooding__historical_/MapServer/tile/{z}/{y}/{x}`,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: `Flood inundation depth, 1-in-50-year river flood, 1960-1999 simulation. ${RIVER_FLOOD_ATTRIBUTION}`,
    sourceId: 'aqueduct-floods',
    licenseText: 'CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement', licenseStatus: 'confirmed-secondary',
    vintage: '1960-1999 simulation, 1-in-50-year river flood',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: false,
    legend: RIVER_FLOOD_LEGEND,
    coverageNote: RIVER_FLOOD_COVERAGE,
  },
  {
    id: 'river-flood-2050-rcp45',
    label: 'River flood depth, 2050 (SSP2/RCP4.5)',
    group: 'hazards', role: 'data', panel: true,
    kind: 'xyz',
    url: `${ARCGIS_WRI}/River_Flooding__rcp4_5_/MapServer/tile/{z}/{y}/{x}`,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: `Flood inundation depth, 2050, SSP2/RCP4.5, mean of 5 climate models. ${RIVER_FLOOD_ATTRIBUTION}`,
    sourceId: 'aqueduct-floods',
    licenseText: 'CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement', licenseStatus: 'confirmed-secondary',
    vintage: '2050, SSP2/RCP4.5, mean of 5 climate models',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: false,
    legend: RIVER_FLOOD_LEGEND,
    coverageNote: RIVER_FLOOD_COVERAGE,
  },
  {
    id: 'river-flood-2050-rcp85',
    label: 'River flood depth, 2050 (SSP3/RCP8.5)',
    group: 'hazards', role: 'data', panel: true,
    kind: 'xyz',
    url: `${ARCGIS_WRI}/River_Flooding__rcp8_5_/MapServer/tile/{z}/{y}/{x}`,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: `Flood inundation depth, 2050, SSP3/RCP8.5, mean of 5 climate models. ${RIVER_FLOOD_ATTRIBUTION}`,
    sourceId: 'aqueduct-floods',
    licenseText: 'CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement', licenseStatus: 'confirmed-secondary',
    vintage: '2050, SSP3/RCP8.5, mean of 5 climate models',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: false,
    legend: RIVER_FLOOD_LEGEND,
    coverageNote: RIVER_FLOOD_COVERAGE,
  },
  {
    id: 'seismic',
    label: 'Seismic hazard',
    group: 'hazards', role: 'data', panel: true,
    kind: 'xyz',
    url: 'https://tiles.arcgis.com/tiles/txWDfZ2LIgzmw5Ts/arcgis/rest/services/Global_Seismic_Hazard/MapServer/tile/{z}/{y}/{x}',
    tileSize: 256, minzoom: 0, maxzoom: 6,
    attribution: 'Seismic hazard: GEM Global Seismic Hazard Map 2023.1, peak ground acceleration with a 10% chance of being exceeded in 50 years (reference rock). CC BY-NC-SA 4.0',
    sourceId: 'gem-seismic-2023',
    // The ArcGIS item description (opened 2026-10-05) states the openly released raster is CC BY-NC-SA 4.0 and the
    // poster PNG CC BY-SA 4.0. src/main.js printed "CC-BY", which this entry corrects.
    licenseText: 'CC BY-NC-SA 4.0 (GEM raster, per the ArcGIS item description opened 2026-10-05); the non-commercial term applies if the working group ever commercialises', licenseStatus: 'confirmed-secondary',
    commercialUseNote: 'Non-commercial licence: displaying it in a non-commercial tool is within the terms; ask GEM before any commercial use.',
    vintage: 'GEM Global Seismic Hazard Map version 2023.1',
    verified: '2026-10-05', probeZooms: [4, 6],
    status: 'active', fragile: false, slow: false,
    legend: {
      kind: 'classes', title: 'Peak ground acceleration, 10% in 50 years', unit: 'g', classes: SEISMIC_CLASSES,
      note: 'Classes and colours from the service legend; values are peak ground acceleration (as a fraction of g) on reference rock.',
    },
    coverageNote: 'Global. Tiles end at zoom 6; deeper zooms magnify them.',
  },

  // ===================================================================
  // People and access
  // ===================================================================
  {
    id: 'population',
    label: 'Population density',
    group: 'human', role: 'data', panel: true,
    kind: 'xyz',
    // The bogus '2020-01-01/' date segment is dropped: with it the request answered 403 (live audit, 15 of 15).
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/GPW_Population_Density_2020/default/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png',
    tileSize: 256, minzoom: 0, maxzoom: 7,
    attribution: 'Population density: SEDAC GPW v4.11 via NASA GIBS · CC-BY 4.0',
    sourceId: 'gpw-v4',
    licenseText: 'licence not confirmed (the existing attribution says CC BY 4.0)', licenseStatus: 'unconfirmed',
    vintage: 'GPW v4.11, 2020 estimate',
    verified: '2026-10-05', probeZooms: [3, 5, 7],
    status: 'active', fragile: false, slow: false,
    legend: approxRamp('Population density, 2020', ['#eef0e8', '#9a9a72', '#3a3a2a'], 'Denser settlement is darker; the layer does not publish a unit on its legend.'),
    coverageNote: 'Global; tiles end at zoom 7.',
  },
  {
    id: 'travel-time',
    label: 'Travel time to cities',
    group: 'human', role: 'data', panel: true,
    kind: 'wms',
    url: 'https://data.malariaatlas.org/geoserver/ows?service=WMS&version=1.1.1&request=GetMap&layers=Accessibility:201501_Global_Travel_Time_to_Cities&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true',
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'Travel time to cities (2015): Malaria Atlas Project / Weiss et al. 2018 · CC-BY 4.0',
    sourceId: 'malaria-atlas-travel',
    licenseText: 'licence not confirmed (the existing attribution says CC BY 4.0)', licenseStatus: 'unconfirmed',
    vintage: '2015 (Weiss et al. 2018)',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: true,
    legend: approxRamp('Travel time to cities, 2015', ['#f4ead8', '#c89a5a', '#6a3a1a'], 'Longer travel is darker brown; the service does not publish a unit on its legend.'),
    coverageNote: 'Global; drawn on request by a WMS, so a tile can take a few seconds.',
    fallbackNote: 'This service is slow or unavailable right now; the per-region access values on each card are not affected.',
  },
  {
    id: 'conflict',
    label: 'Conflict density',
    group: 'human', role: 'data', panel: true,
    kind: 'geojson', url: null,
    urls: { 'europe': 'data/processed/conflict.geojson', 'north-america': 'data/processed/conflict-na.geojson' },
    lazy: true,
    attribution: 'UCDP Georeferenced Event Dataset (GED), Uppsala Conflict Data Program · CC BY 4.0',
    sourceId: 'ucdp-ged',
    licenseText: 'CC BY 4.0', licenseStatus: 'confirmed',
    vintage: 'UCDP GED v25.1',
    verified: '2026-10-05', probeZooms: [],
    status: 'active', fragile: false, slow: false,
    legend: approxRamp('Conflict event density', ['#d8a0a0', '#b24632', '#5a1a1a'], 'Denser recorded events are darker red (a heat map of event points).'),
    coverageNote: 'Europe and North America (continent-clipped files).',
  },
  {
    // The 'ecovillages' row. Its real source is OpenStreetMap, not the Living Atlas count behind the regen_network cells.
    id: 'regen-network',
    aliases: ['ecovillages'],
    label: 'Ecovillage sites',
    group: 'human', role: 'data', panel: true,
    kind: 'geojson', url: null,
    urls: { 'europe': 'data/processed/ecovillages.geojson', 'north-america': 'data/processed/ecovillages-na.geojson' },
    lazy: false,
    attribution: 'Ecovillage points: © OpenStreetMap contributors, ODbL 1.0 (via the Overpass API)',
    sourceId: 'osm-odbl',
    licenseText: 'ODbL 1.0', licenseStatus: 'confirmed',
    vintage: 'OpenStreetMap snapshot retrieved 2026-05-19 (Europe) and 2026-05-27 (North America)',
    retrieved: { 'europe': '2026-05-19', 'north-america': '2026-05-27' },
    retrievedBasis: 'modification time of data/processed/ecovillages.geojson and ecovillages-na.geojson (the files carry no retrieval stamp)',
    sourceLine: 'OpenStreetMap ecovillage points (ODbL), retrieved 2026-05-19 (Europe) and 2026-05-27 (North America); not the Living Atlas count behind the regen_network cells',
    verified: '2026-10-05', probeZooms: [],
    status: 'active', fragile: false, slow: false,
    legend: { kind: 'dot', title: 'Ecovillage sites (OpenStreetMap)', color: '#3a6a4a', note: 'Points volunteers have tagged in OpenStreetMap; a floor of what exists, not a census.' },
    coverageNote: 'Volunteer-tagged, so patchy: it undercounts the full GEN directory (300+ sites).',
  },

  // ===================================================================
  // Terrain and imagery
  // ===================================================================
  {
    id: 'hillshade',
    label: 'Terrain relief',
    group: 'imagery', role: 'imagery', panel: true,
    kind: 'xyz',
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    tileSize: 256, minzoom: 0, maxzoom: 16,
    attribution: 'Esri · USGS · NOAA',
    sourceId: 'esri-hillshade',
    licenseText: 'licence not confirmed (Esri terms; attribution required)', licenseStatus: 'unconfirmed',
    vintage: 'Esri World Hillshade (continuously maintained basemap service)',
    verified: '2026-10-05', probeZooms: [5, 7],
    // Flat terrain (Estonia at zoom 7) shades to near-white, which the non-empty test reads as blank: 5 of 6 is a pass.
    probeMinPass: 5,
    status: 'active', fragile: false, slow: false,
    legend: null,
    coverageNote: 'Global relief shading; self-explanatory, no legend.',
  },
  {
    id: 'topo',
    label: 'Topographic map',
    group: 'imagery', role: 'imagery', panel: true,
    kind: 'xyz',
    url: 'https://a.tile.opentopomap.org/{z}/{x}/{y}.png',
    urlMirrors: ['https://b.tile.opentopomap.org/{z}/{x}/{y}.png', 'https://c.tile.opentopomap.org/{z}/{x}/{y}.png'],
    tileSize: 256, minzoom: 0, maxzoom: 17,
    attribution: '© OpenTopoMap (CC-BY-SA) · © OpenStreetMap contributors',
    sourceId: 'opentopomap',
    licenseText: 'licence not confirmed (the existing attribution says CC-BY-SA; map data ODbL)', licenseStatus: 'unconfirmed',
    vintage: 'continuously updated (OpenStreetMap data, SRTM relief)',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: false,
    legend: null,
    coverageNote: 'Community-run tile server: be gentle, and expect it to be slow at busy times.',
  },
  {
    id: 'satellite',
    label: 'Recent satellite',
    group: 'imagery', role: 'imagery', panel: true,
    kind: 'xyz',
    url: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg',
    tileSize: 256, minzoom: 0, maxzoom: 14,
    attribution: 'Sentinel-2 cloudless · EOX IT Services GmbH · Copernicus / ESA',
    sourceId: 'eox-s2cloudless',
    licenseText: 'licence not confirmed (Copernicus Sentinel data; EOX terms not opened)', licenseStatus: 'unconfirmed',
    vintage: 'Sentinel-2 cloudless mosaic, 2021',
    verified: '2026-10-05', probeZooms: [5, 7],
    status: 'active', fragile: false, slow: false,
    legend: null,
    coverageNote: 'Imagery, no legend.',
  },
  {
    id: 'night-lights',
    label: 'Night lights',
    group: 'imagery', role: 'imagery', panel: true,
    kind: 'xyz',
    // Keeps its date segment: GIBS requires it for this layer (unlike population).
    url: 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/VIIRS_Black_Marble/default/2016-01-01/GoogleMapsCompatible_Level8/{z}/{y}/{x}.png',
    tileSize: 256, minzoom: 0, maxzoom: 8,
    attribution: 'NASA Earth Observatory · NOAA · DoD · Black Marble 2016',
    sourceId: 'viirs-black-marble',
    licenseText: 'licence not confirmed (NASA GIBS imagery; credit NASA Earth Observatory)', licenseStatus: 'unconfirmed',
    vintage: 'VIIRS Black Marble, 2016',
    verified: '2026-10-05', probeZooms: [3, 5],
    status: 'active', fragile: false, slow: false,
    legend: null,
    coverageNote: 'Night-time lights as a proxy for settlement and electrification; tiles end at zoom 8.',
  },

  // ===================================================================
  // Basemap (current state; replaced by MC-MAP-BASE)
  // ===================================================================
  {
    id: 'basemap-carto-positron',
    label: 'CARTO Positron basemap (current, retired)',
    group: 'imagery', role: 'basemap', panel: false,
    kind: 'xyz',
    url: 'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    urlMirrors: ['https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png', 'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'],
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: '© OpenStreetMap contributors © CARTO',
    sourceId: 'osm-odbl',
    licenseText: 'ODbL 1.0 (map data); CARTO terms not confirmed', licenseStatus: 'unconfirmed',
    vintage: 'n/a',
    verified: '2026-10-05', probeZooms: [5],
    status: 'retired', fragile: false, slow: false,
    retiredReason: 'The public CARTO raster tiles now answer HTTP 200 with one identical 2,049-byte watermark PNG (md5 502fc5f6793fad87dcf8ba3fa646c38f) for every tile, so the map shows a placeholder, not a basemap. Still referenced by src/main.js until MC-MAP-BASE replaces it with Esri World Light Gray (OpenFreeMap failover).',
    placeholderSignature: { bytes: 2049, md5: '502fc5f6793fad87dcf8ba3fa646c38f' },
    legend: null,
  },

  // ===================================================================
  // Retired candidates: probed, not served. Kept with the reason.
  // ===================================================================
  {
    id: 'edo-cdi',
    label: 'Combined Drought Indicator (Copernicus EDO)',
    group: 'climate', role: 'data', panel: false,
    kind: 'wms',
    url: 'https://drought.emergency.copernicus.eu/api/wms?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&FORMAT=image/png&TRANSPARENT=true&SRS=EPSG:3857&WIDTH=256&HEIGHT=256&STYLES=&bbox={bbox-epsg-3857}&LAYERS=cdiad',
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'Copernicus European Drought Observatory', sourceId: null,
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: 'current dekad',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Works over Europe only (the North American points are empty) and shows current conditions by dekad, which does not belong in a 50 to 100 year tool; its capabilities request also answered 502 on 2026-10-04. Drought is carried by Aqueduct drought-risk cells instead.',
    legend: null,
  },
  {
    id: 'olm-lst-day',
    label: 'Land surface temperature, daytime (OpenLandMap MODIS)',
    group: 'climate', role: 'data', panel: false,
    kind: 'wms',
    url: 'https://geoserver.openlandmap.org/geoserver/ows?service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&bbox={bbox-epsg-3857}&width=256&height=256&format=image/png&transparent=true&layers=olm:lst_mod11a2_daytime',
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'OpenLandMap', sourceId: 'openlandmap-precip',
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: 'monthly / annual time series',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Tiles render, but the layer is a monthly time series (DATE dimension), the legend is in raw digital numbers (11,738 to 15,980) and the unit scale could not be verified, so a legend would be invented. Air temperature goes to cells (WorldClim) instead.',
    legend: null,
  },
  {
    id: 'olm-lst-trend',
    label: 'Land surface temperature trend (OpenLandMap MODIS)',
    group: 'climate', role: 'data', panel: false,
    kind: 'wms', url: null,
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'OpenLandMap', sourceId: 'openlandmap-precip',
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: 'undocumented',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Passes the tile probe but its unit is undocumented (legend -400 to 400) and the 1 km trend is noisy.',
    legend: null,
  },
  {
    id: 'tx35-heat',
    label: 'Days above 35 C, 2050 (UNICEF CCRI rehost)',
    group: 'climate', role: 'data', panel: false,
    kind: 'xyz',
    url: `${ARCGIS_WRI}/TX35_2050__worst_case_scenario_/MapServer/tile/{z}/{y}/{x}`,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: 'UNICEF Children’s Climate Risk Index datasets (rehost)', sourceId: null,
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: '2050 worst-case scenario',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Tiles pass, but they are one-degree blocks (visual check) and the provenance is a rehost with no licence statement.',
    legend: null,
  },
  {
    id: 'deltares-rp250',
    label: 'Deltares flood map, 250-year return period (OpenLandMap)',
    group: 'hazards', role: 'data', panel: false,
    kind: 'wms', url: null,
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'Deltares via OpenLandMap', sourceId: null,
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: 'undocumented',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Passes the tile probe but renders as a flat colour over all land (a mask or nodata styled as flood). Not usable.',
    legend: null,
  },
  {
    id: 'esri-koppen-imageserver',
    label: 'Köppen-Geiger climate classification (Esri ImageServer)',
    group: 'climate', role: 'data', panel: false,
    kind: 'xyz',
    url: 'https://tiledimageservices.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/KoppenGeiger_Climate_Classification/ImageServer/tile/{z}/{y}/{x}',
    tileSize: 256, minzoom: 0, maxzoom: 7,
    attribution: 'Esri', sourceId: null,
    licenseText: 'CC BY-NC (item licence)', licenseStatus: 'unconfirmed', vintage: 'unstated',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Tiled in a WGS84 scheme (8 levels), exportImage answers 400, and the item licence is non-commercial. Replaced by Beck et al. 2023 (CC BY 4.0), polygonised by this project.',
    legend: null,
  },
  {
    id: 'esri-koppen-staff-tiles',
    label: 'Köppen-Geiger 1980-2016 and 2071-2100 tile layers (Esri staff uploads)',
    group: 'climate', role: 'data', panel: false,
    kind: 'xyz', url: null,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: 'Esri staff uploads', sourceId: null,
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: '1980-2016 / 2071-2100',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'The current-period layer answers 404 at zoom 5, the items carry no licence text and were uploaded by an individual.',
    legend: null,
  },
  {
    id: 'esri-gsa-pvout-4326',
    label: 'Global Solar Atlas PVOUT (Esri tiled service, WGS84 scheme)',
    group: 'energy', role: 'data', panel: false,
    kind: 'xyz', url: null,
    tileSize: 256, minzoom: 0, maxzoom: 6,
    attribution: 'Global Solar Atlas via Esri', sourceId: 'gsa-pvout',
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: 'unstated',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'A WGS84 tile scheme: zoom 5 returns 94-byte empty tiles and zoom 7 answers 404. Not a replacement for the fragile Resource Watch path.',
    legend: null,
  },
  {
    id: 'oem-eu-ltm-temperature',
    label: 'Mean air temperature 1991-2020 (OpenEarthMonitor, Europe)',
    group: 'climate', role: 'data', panel: false,
    kind: 'wms', url: null,
    tileSize: 256, minzoom: 0, maxzoom: 18,
    attribution: 'OpenEarthMonitor', sourceId: null,
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: '1991-2020',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Europe only: the North American tiles are empty, which would make a half-continent layer.',
    legend: null,
  },
  {
    id: 'esri-aridity-index',
    label: 'Aridity index (Esri, Australia)',
    group: 'climate', role: 'data', panel: false,
    kind: 'xyz', url: null,
    tileSize: 256, minzoom: 0, maxzoom: 9,
    attribution: 'Esri', sourceId: null,
    licenseText: 'licence not confirmed', licenseStatus: 'unconfirmed', vintage: 'unstated',
    verified: '2026-10-04', probeZooms: [], status: 'retired', fragile: false, slow: false,
    retiredReason: 'Covers Australia only and no tile service for the CGIAR Global Aridity Index v3 exists. Aridity is carried by the Koppen B classes instead.',
    legend: null,
  },
];

// ---------------------------------------------------------------------
// Helpers (pure; used by the map module and the tests)
// ---------------------------------------------------------------------

/** Entry by id or alias (the 'ecovillages' row is the entry with id 'regen-network'). */
export function layerSourceById(id) {
  return layerSources.find((l) => l.id === id || (l.aliases && l.aliases.includes(id))) || null;
}

/** Entries the panel can show: not retired, a panel toggle, not a basemap. */
export function panelLayerSources() {
  return layerSources.filter((l) => l.panel && l.status !== 'retired' && l.role !== 'basemap');
}

/** The one-line source statement a panel row prints (vintage + licence beside the name, never a score). */
export function layerSourceLine(l) {
  if (l.sourceLine) return l.sourceLine;
  const parts = [l.attribution, l.vintage, l.licenseText].filter(Boolean);
  return parts.join(' · ');
}
