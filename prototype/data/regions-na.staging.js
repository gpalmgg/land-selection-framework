// ============================================================================
// NORTH AMERICA — STAGING DATA (NOT imported anywhere, NOT live)
// ============================================================================
// Compiled 2026-05-26 from the 10 per-region research dossiers in
//   data/research-dossier/<id>/  (8 dimension files each).
// This file is the MERGE PAYLOAD for regions.js once the values are
// human-verified against the dossiers and the slate is signed off by The
// Collective. It is deliberately NOT imported, so the live switcher stays
// hidden until this is merged.
//
// VERIFICATION STATUS — read docs/plans/north-america/na-data-for-verification.md
//   • Ranges are dossier midpoints (same convention as the EU block).
//   • Confidence varies; several cells are triangulated, not pixel-extracted.
//   • UNVERIFIED cells carry value:null and MUST be sourced before shipping.
//   • Some values exceed EU-tuned criterion ranges (regen_network, solar_pv,
//     forest_change) — see the range-change proposal in the verification doc.
// ============================================================================

export const naRegions = [
  { id: 'cascadia', continent: 'north-america', name: 'Cascadia', short: 'Cascadia', country: 'USA',
    coords: [-123.0, 44.5],
    blurb: 'Temperate-maritime Pacific Northwest. High rainfall, low water stress, the densest regenerative network on the continent, and the land cost to match.',
    accent: '#2d6a4a' },
  { id: 'vermont', continent: 'north-america', name: 'Vermont / Upper New England', short: 'Vermont', country: 'USA',
    coords: [-72.7, 44.0],
    blurb: 'Cold continental New England. Deep back-to-the-land culture and the most intentional-community-friendly land-and-tax regime in the US (Current Use, Act 250).',
    accent: '#3a5a3a' },
  { id: 'southern-appalachians', continent: 'north-america', name: 'Southern Appalachians', short: 'S. Appalachians', country: 'USA',
    coords: [-82.6, 35.6],
    blurb: 'Humid temperate highland around Asheville. A biodiversity hotspot with a fast-growing permaculture scene and mature conservation-easement infrastructure.',
    accent: '#5a7a4a' },
  { id: 'driftless', continent: 'north-america', name: 'Driftless Area', short: 'Driftless', country: 'USA',
    coords: [-90.8, 43.5],
    blurb: 'Unglaciated karst coulee country of southwest Wisconsin. Organic and CSA heartland, affordable, cold, with unusually deep soil-survey data behind it.',
    accent: '#7a8a4a' },
  { id: 'ozarks', continent: 'north-america', name: 'Ozarks', short: 'Ozarks', country: 'USA',
    coords: [-92.8, 36.3],
    blurb: 'The cheapest land in the slate. Off-grid homestead culture, permissive rural building rules, and sparse formal regenerative institutions.',
    accent: '#8a7a3a' },
  { id: 'northern-new-mexico', continent: 'north-america', name: 'Northern New Mexico', short: 'N. New Mexico', country: 'USA',
    coords: [-105.6, 36.4],
    blurb: 'Arid high desert around Taos. Extreme water stress and exceptional solar, balanced by deep acequia water-commons governance and earthship history.',
    accent: '#b8633a' },
  { id: 'nova-scotia', continent: 'north-america', name: 'Nova Scotia / Cape Breton', short: 'Nova Scotia', country: 'Canada',
    coords: [-63.0, 45.4],
    blurb: 'Cool Atlantic-maritime Canada. Affordable and immigration-friendly via provincial nominee programs, with heavy industrial-forestry pressure on the landscape.',
    accent: '#3a6a7a' },
  { id: 'kootenays', continent: 'north-america', name: 'BC Interior — Kootenays', short: 'Kootenays', country: 'Canada',
    coords: [-117.0, 49.5],
    blurb: 'Mountainous BC interior around Nelson. A deep intentional-community legacy (Doukhobor and 1970s back-to-land), higher land cost, increasingly wildfire-exposed.',
    accent: '#4a5a7a' },
  { id: 'quebec-eastern-townships', continent: 'north-america', name: 'Québec Eastern Townships', short: 'Québec E.T.', country: 'Canada',
    coords: [-72.0, 45.4],
    blurb: 'Estrie, under Québec civil law and the CPTAQ farmland-protection regime — among the strongest in North America. French-language, farmland strongly protected.',
    accent: '#5a4a7a' },
  { id: 'oaxaca', continent: 'north-america', name: 'Oaxaca highlands', short: 'Oaxaca', country: 'Mexico',
    coords: [-96.7, 17.1],
    blurb: 'Indigenous ejido and comunal highlands of southern Mexico. Exceptional biodiversity and a radically different communal-tenure legal regime — the hardest legal story in the slate.',
    accent: '#8a5a3a' },
];

// value = dossier midpoint (range → midpoint), native units. conf field is NOT
// rendered; it carries the dossier's confidence for the verification pass.
const W = 'https://www.worldclim.org/data/cmip6/cmip6climate.html';
const AQ = 'https://www.wri.org/aqueduct';
const SG = 'https://soilgrids.org';
const GFC = 'https://www.globalforestwatch.org';
const GSA = 'https://globalsolaratlas.info';
const UCDP = 'https://ucdp.uu.se';

export const naValues = {
  cascadia: {
    climate:      { value: 12.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild maritime', source: 'WorldClim CMIP6 v2.1', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 50, unit: 'g/kg', vintage: '2020', label: 'High — Willamette/forest', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: -3, unit: '%/decade', vintage: '2001–2023', label: 'Timber-harvest loss, net ~stable', source: 'Hansen Global Forest Change v1.11', sourceUrl: GFC, conf: 'low' },
    solar_pv:     { value: 1150, unit: 'kWh/kWp', vintage: '2022', label: 'Moderate (cloud-limited)', source: 'Global Solar Atlas v2.7', sourceUrl: GSA, conf: 'high' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 47, unit: 'sites', vintage: '2024', label: 'Densest in slate (FIC/GEN)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/', conf: 'med' }, // EXCEEDS range 30
    population:   { value: 55, unit: 'p/km²', vintage: '2023', label: 'Moderate', source: 'JRC GHSL R2023', sourceUrl: 'https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php', conf: 'med' },
  },
  vermont: {
    climate:      { value: 9.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cold continental', source: 'WorldClim CMIP6 v2.1 / NOAA NCA5', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 20, unit: 'g/kg', vintage: '2014–2022', label: 'Low–moderate (cropland/pasture)', source: 'SoilGrids 2.0 / UVM Soil Lab', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: -0.5, unit: '%/decade', vintage: '2001–2023', label: 'Slight loss to sprawl', source: 'Hansen Global Forest Change v1.11', sourceUrl: GFC, conf: 'med' },
    solar_pv:     { value: 1250, unit: 'kWh/kWp', vintage: '2023', label: 'Moderate', source: 'Global Solar Atlas v2.7', sourceUrl: GSA, conf: 'med' },
    conflict:     { value: 0, unit: 'events', vintage: '2019–2024', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 30, unit: 'sites', vintage: '2023–2025', label: 'Dense (incl. neighbouring states)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/', conf: 'med' }, // at range ceiling
    population:   { value: 27, unit: 'p/km²', vintage: '2020', label: 'Low (interior much lower)', source: 'US Census 2020', sourceUrl: 'https://www.census.gov/quickfacts/VT', conf: 'high' },
  },
  'southern-appalachians': {
    climate:      { value: 15.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Warm temperate highland', source: 'WorldClim CMIP6 v2.1 / NCA5', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 50, unit: 'g/kg', vintage: '2020', label: 'High — Appalachian forest', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: 0, unit: '%/decade', vintage: '2022', label: 'Stable (growth ≈ removal)', source: 'USDA FIA / Hansen GFC v1.11', sourceUrl: GFC, conf: 'med' },
    solar_pv:     { value: 1400, unit: 'kWh/kWp', vintage: '2023', label: 'Good', source: 'Global Solar Atlas v2.7', sourceUrl: GSA, conf: 'med' },
    conflict:     { value: 0, unit: 'events', vintage: '2019–2024', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 25, unit: 'sites', vintage: '2025', label: 'Dense (Asheville cluster, Celo)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/', conf: 'med' },
    population:   { value: 47, unit: 'p/km²', vintage: '2020', label: 'Moderate (18-county WNC)', source: 'JRC GHSL / US Census', sourceUrl: 'https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php', conf: 'high' },
  },
  driftless: {
    climate:      { value: 11.75, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool continental', source: 'WICCI CMIP6 / WorldClim', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 23, unit: 'g/kg', vintage: '2014', label: 'Low–moderate (digital soil map)', source: 'Adhikari et al. Geoderma / SoilGrids 2.0', sourceUrl: SG, conf: 'high' },
    forest_change:{ value: 1.5, unit: '%/decade', vintage: '2021', label: 'Net gain (statewide expansion)', source: 'USDA FS / Hansen GFC v1.11', sourceUrl: GFC, conf: 'low' },
    solar_pv:     { value: 1365, unit: 'kWh/kWp', vintage: '2024', label: 'Good', source: 'Global Solar Atlas v2.7 / NREL NSRDB', sourceUrl: GSA, conf: 'med' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 20, unit: 'sites', vintage: '2024', label: 'Active (Organic Valley, Marbleseed)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/', conf: 'med' },
    population:   { value: 13, unit: 'p/km²', vintage: '2020', label: 'Very low (Vernon/Crawford)', source: 'US Census 2020 / GHSL', sourceUrl: 'https://www.census.gov/quickfacts/vernoncountywisconsin', conf: 'high' },
  },
  ozarks: {
    climate:      { value: 17.5, unit: '°C', vintage: '2041–2060 (NCA5 envelope)', label: 'Warm continental', source: 'NOAA NCEI / NCA5 Ch.22', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0 / USGS', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 20, unit: 'g/kg', vintage: '2020', label: 'Low (thin Ozark uplands)', source: 'SoilGrids 2.0 / NRCS OSD', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: -1, unit: '%/decade', vintage: '2010–2023', label: 'Mixed — dossier internally inconsistent', source: 'Hansen GFC v1.11 / USDA FIA', sourceUrl: GFC, conf: 'low' }, // NOTE: dossier table said -1..-2, prose said +1..+2 — VERIFY
    solar_pv:     { value: 1440, unit: 'kWh/kWp', vintage: '2024', label: 'Good', source: 'NREL NSRDB / Global Solar Atlas v2.7', sourceUrl: GSA, conf: 'high' },
    conflict:     { value: 0, unit: 'events', vintage: '2000–2023', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 5, unit: 'sites', vintage: '2024–2025', label: 'Sparse (homestead, not institutional)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/', conf: 'med' },
    population:   { value: 4.5, unit: 'p/km²', vintage: '2020', label: 'Very low', source: 'US Census 2020', sourceUrl: 'https://www.census.gov/quickfacts/newtoncountyarkansas', conf: 'high' },
  },
  'northern-new-mexico': {
    climate:      { value: 10.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'High-desert continental', source: 'WorldClim CMIP6 v2.1', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.85, unit: 'score', vintage: '2050 BAU', label: 'Extremely high', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'high' },
    soil_carbon:  { value: 7, unit: 'g/kg', vintage: '2001–2024', label: 'Very low (arid rangeland)', source: 'SoilGrids 2.0 / NM rangeland studies', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: -10, unit: '%/decade', vintage: '2022', label: 'Fire-driven loss (Hermit\'s Peak)', source: 'Hansen GFC v1.11 / fire records', sourceUrl: GFC, conf: 'low' }, // EXCEEDS range floor -5
    solar_pv:     { value: 2150, unit: 'kWh/kWp', vintage: '2024', label: 'Exceptional', source: 'NREL NSRDB / Global Solar Atlas v2.7', sourceUrl: GSA, conf: 'med' }, // EXCEEDS range 2000
    conflict:     { value: 0, unit: 'events', vintage: '2019–2024', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 20, unit: 'sites', vintage: '2025', label: 'Active (earthship, permaculture)', source: 'FIC / ic.org / Earthship Biotecture', sourceUrl: 'https://www.ic.org/directory/', conf: 'med' },
    population:   { value: 6, unit: 'p/km²', vintage: '2020', label: 'Very low (Taos County)', source: 'US Census 2020', sourceUrl: 'https://www.census.gov/quickfacts/taoscountynewmexico', conf: 'high' },
  },
  'nova-scotia': {
    climate:      { value: 9.3, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool maritime', source: 'WorldClim CMIP6 v2.1 / NS climate assessment', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'high' },
    soil_carbon:  { value: 40, unit: 'g/kg', vintage: '2020', label: 'Moderate–high', source: 'SoilGrids 2.0 / Soil Landscapes of Canada', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: -8, unit: '%/decade', vintage: '2001–2024', label: 'Industrial-forestry loss', source: 'Hansen Global Forest Change v1.11', sourceUrl: GFC, conf: 'high' }, // EXCEEDS range floor -5
    solar_pv:     { value: 1100, unit: 'kWh/kWp', vintage: '2024', label: 'Moderate', source: 'Global Solar Atlas v2.7 / NRCan', sourceUrl: GSA, conf: 'high' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 5, unit: 'sites', vintage: '2025', label: 'Sparse (Treehouse Village, others)', source: 'GEN / FIC / Ecovillages Canada', sourceUrl: 'https://ecovillagescanada.ca/', conf: 'med' },
    population:   { value: 18.4, unit: 'p/km²', vintage: '2021', label: 'Low', source: 'Statistics Canada 2021', sourceUrl: 'https://www12.statcan.gc.ca/census-recensement/2021/', conf: 'high' },
  },
  kootenays: {
    climate:      { value: 10, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mountain-valley continental', source: 'ClimateNA / AdaptWest', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 40, unit: 'g/kg', vintage: '2020', label: 'Moderate (forested mineral soils)', source: 'SoilGrids 2.0 / SLC v3.2', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: -5, unit: '%/decade', vintage: '2001–2023', label: 'Wildfire-driven (worse in peak years)', source: 'Hansen Global Forest Change v1.11', sourceUrl: GFC, conf: 'med' }, // at range floor; exceeds in fire years
    solar_pv:     { value: 1100, unit: 'kWh/kWp', vintage: '2024', label: 'Moderate (valley shading lowers real yield)', source: 'Global Solar Atlas v2.7', sourceUrl: GSA, conf: 'high' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 10, unit: 'sites', vintage: '2024', label: 'Active (Doukhobor + back-to-land legacy)', source: 'GEN / FIC directories', sourceUrl: 'https://ecovillage.org', conf: 'med' },
    population:   { value: 2.8, unit: 'p/km²', vintage: '2021', label: 'Very low (RDCK)', source: 'Statistics Canada 2021', sourceUrl: 'https://www12.statcan.gc.ca/census-recensement/2021/', conf: 'high' },
  },
  'quebec-eastern-townships': {
    climate:      { value: 8.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cold continental', source: 'Ouranos CMIP6 / WorldClim', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'high' },
    soil_carbon:  { value: 32, unit: 'g/kg', vintage: '2023', label: 'Moderate (temperate-forest brunisols)', source: 'SoilGrids 2.0 / SLC 3.2', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: 1.0, unit: '%/decade', vintage: '2010–2020', label: 'Net gain (farmland reverting)', source: 'Hansen GFC v1.11 / Statistics Québec', sourceUrl: GFC, conf: 'low' },
    solar_pv:     { value: 1088, unit: 'kWh/kWp', vintage: '2023', label: 'Moderate (NRCan Sherbrooke)', source: 'CanmetENERGY / NRCan', sourceUrl: GSA, conf: 'high' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v24.1', sourceUrl: UCDP, conf: 'high' },
    regen_network:{ value: 10, unit: 'sites', vintage: '2024', label: 'Mid (fragmented Québec network)', source: 'GEN Canada / Répertoire éco-communautés', sourceUrl: 'https://ecovillagescanada.ca/', conf: 'med' },
    population:   { value: 33, unit: 'p/km²', vintage: '2021', label: 'Moderate (rural 5–20)', source: 'Statistics Canada 2021 / GHSL', sourceUrl: 'https://www12.statcan.gc.ca/census-recensement/2021/', conf: 'high' },
  },
  oaxaca: {
    climate:      { value: 19, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Tropical highland (valley/sierra mix)', source: 'WorldClim CMIP6 / Vázquez-Aguirre et al.', sourceUrl: W, conf: 'med' },
    water_stress: { value: 0.2, unit: 'score', vintage: '2050 BAU', label: 'Low–medium', source: 'WRI Aqueduct 4.0', sourceUrl: AQ, conf: 'med' },
    soil_carbon:  { value: 40, unit: 'g/kg', vintage: '2020', label: 'Moderate (valley) to high (forest)', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: SG, conf: 'med' },
    forest_change:{ value: null, unit: '%/decade', vintage: 'n/a', label: 'UNVERIFIED — GFW dynamic dashboard, needs direct query', source: 'Hansen GFC v1.11 (pending)', sourceUrl: GFC, conf: 'UNVERIFIED' }, // top-5 MX deforestation state; rate NOT retrieved
    solar_pv:     { value: 2000, unit: 'kWh/kWp', vintage: '2024', label: 'Exceptional', source: 'Global Solar Atlas v2.7 / World Bank', sourceUrl: GSA, conf: 'med' }, // at range ceiling 2000
    conflict:     { value: null, unit: 'events', vintage: 'n/a', label: 'UNVERIFIED — ACLED proxy ~99 (state); UCDP-within-200km NOT pulled', source: 'UCDP GED v24.1 (pending)', sourceUrl: UCDP, conf: 'UNVERIFIED' }, // Mexico is the one NA region where conflict is NOT auto-zero
    regen_network:{ value: 10, unit: 'sites', vintage: '2024', label: 'Mid (formal); informal indigenous higher', source: 'GEN / NuMundo', sourceUrl: 'https://ecovillage.org/gen_country/mexico/', conf: 'med' },
    population:   { value: 44, unit: 'p/km²', vintage: '2020', label: 'Moderate (state avg; Sierra ~23)', source: 'INEGI Census 2020', sourceUrl: 'https://en.www.inegi.org.mx/programas/ccpv/2020/', conf: 'high' },
  },
};
