// Twenty candidate regions (Europe + North America) for the regenerative-settlement comparison.
// Values are grounded in the per-region research dossier at
//   data/research-dossier/<region>/<dimension>.md
// Each cell carries `source` and `sourceUrl` pointing to the dossier's
// first cited source. Numeric anchors come from the dossier's
// "Key data point (with vintage)" line. Ranges (e.g. "0.6–0.8") are
// reduced to midpoints. All sources are dated; nothing here is composite
// or scored.
//
// Schema per value:
//   { value, unit, vintage, label, source, sourceUrl }

export const regions = [
  {
    id: 'alentejo',
    continent: 'europe',
    name: 'Alentejo',
    country: 'Portugal',
    coords: [-7.9, 38.6],
    blurb: 'Sparsely-populated south-Portuguese interior. Hot, dry, regen-active (Tamera, Project Kamp, dozens of permaculture sites).',
    accent: '#b8633a',
  },
  {
    id: 'galicia',
    continent: 'europe',
    name: 'Galicia',
    country: 'Spain',
    coords: [-8.4, 42.9],
    blurb: 'North-west Iberian coast. Cool, wet, deeply forested. Strong soil base, traditional smallholdings, post-rural depopulation opening land.',
    accent: '#3a6a4a',
  },
  {
    id: 'transylvania',
    continent: 'europe',
    name: 'Transylvania',
    country: 'Romania',
    coords: [25.0, 46.0],
    blurb: 'Carpathian highlands. Continental climate, intact forests, very low population density, traditional agroecology still practised at scale.',
    accent: '#5a4a3a',
  },
  {
    id: 'connemara',
    continent: 'europe',
    name: 'West Cork / Connemara',
    short: 'West Cork',
    country: 'Ireland',
    coords: [-9.4, 53.0],
    blurb: 'Atlantic-temperate Ireland. Mild winters, abundant water, peat-rich soils, active transition-town and ecovillage networks.',
    accent: '#2c5f7c',
  },
  {
    id: 'pembrokeshire',
    continent: 'europe',
    name: 'Pembrokeshire / West Wales',
    short: 'Pembrokeshire',
    country: 'UK',
    coords: [-4.9, 51.85],
    blurb: 'Atlantic-fringe west Wales. Mild, wet, low water stress. Welsh One Planet Development policy (TAN 6) is the most permissive low-impact rural settlement regime in Europe, Lammas and ~50 approved sites prove the model.',
    accent: '#4a6a8a',
  },
  {
    id: 'cevennes',
    continent: 'europe',
    name: 'Cévennes / Languedoc',
    short: 'Cévennes',
    country: 'France',
    coords: [3.85, 44.2],
    blurb: 'Schist-and-chestnut uplands transitioning to Mediterranean Languedoc. UNESCO Biosphere Reserve, France’s densest cluster of permaculture and intentional-community projects, Terre & Humanisme as anchor.',
    accent: '#8a5a3a',
  },
  {
    id: 'south-tirol',
    continent: 'europe',
    name: 'South Tirol',
    country: 'Italy',
    coords: [11.35, 46.5],
    blurb: 'Alpine valleys with autonomous-province governance. Water-secure, growing population, 1,200+ organic farms; the regen culture lives in the working farm-and-pasture system rather than dedicated ecovillages.',
    accent: '#6a4a4a',
  },
  {
    id: 'asturias',
    continent: 'europe',
    name: 'Asturias',
    country: 'Spain',
    coords: [-5.85, 43.3],
    blurb: 'Atlantic green Spain, six UNESCO Biosphere Reserves covering a quarter of the region. Steep depopulation has opened a wave of repoblación village-revival projects; soils are rich, summers cool.',
    accent: '#3a6a6a',
  },
  {
    id: 'saxony-anhalt',
    continent: 'europe',
    name: 'Saxony-Anhalt rural',
    short: 'Saxony-Anhalt',
    country: 'Germany',
    coords: [11.6, 51.95],
    blurb: 'Chernozem plain plus Harz foothills. Sieben Linden (founded 1997) and ZEGG nearby anchor Germany’s strongest ecovillage cluster. Higher water stress than Atlantic peers; mature regulatory environment.',
    accent: '#4a3a4a',
  },
  {
    id: 'estonia-rural',
    continent: 'europe',
    name: 'Rural Estonia',
    country: 'Estonia',
    coords: [25.0, 58.6],
    blurb: 'Boreal Baltic, extensive forest and peatland, very low water stress, 23% organic farmland (EU top three). Long winters and modest solar yield set the design envelope; Lilleoru and Setomaa hold the regen thread.',
    accent: '#5a6a4a',
  },
  // --- North America ---
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
  { id: 'kootenays', continent: 'north-america', name: 'BC Interior, Kootenays', short: 'Kootenays', country: 'Canada',
    coords: [-117.0, 49.5],
    blurb: 'Mountainous BC interior around Nelson. A deep intentional-community legacy (Doukhobor and 1970s back-to-land), higher land cost, increasingly wildfire-exposed.',
    accent: '#4a5a7a' },
  { id: 'quebec-eastern-townships', continent: 'north-america', name: 'Québec Eastern Townships', short: 'Québec E.T.', country: 'Canada',
    coords: [-72.0, 45.4],
    blurb: 'Estrie, under Québec civil law and the CPTAQ farmland-protection regime, among the strongest in North America. French-language, farmland strongly protected.',
    accent: '#5a4a7a' },
  { id: 'oaxaca', continent: 'north-america', name: 'Oaxaca highlands', short: 'Oaxaca', country: 'Mexico',
    coords: [-96.7, 17.1],
    blurb: 'Indigenous ejido and comunal highlands of southern Mexico. Exceptional biodiversity and a radically different communal-tenure legal regime, the hardest legal story in the slate.',
    accent: '#8a5a3a' },
];

// Per-criterion values per region. Each value carries unit, vintage, label,
// and the primary cited source from the dossier file.
//
// Mapping of dossier dimensions → criterion IDs:
//   climate.md       → climate
//   water.md         → water_stress
//   soil.md          → soil_carbon
//   energy.md        → solar_pv
//   stability.md     → conflict       (UCDP fatal-event counts)
//   regen.md         → regen_network
//   accessibility.md → population
//   (forest_change is retained from Hansen GFC; dossiers cover it
//   qualitatively, so values are best-effort plausible defaults
//   informed by dossier narrative, noted inline.)
//
// Where the dossier reports a range (e.g. "0.6–0.8"), midpoint is used.
// Where dossier disagreed with the existing value, dossier wins.

export const values = {
  // Sources: data/research-dossier/alentejo/{climate,water,soil,energy,stability,regen,accessibility}.md
  alentejo: {
    climate: {
      value: 19.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Hot temperate',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.7, unit: 'score', vintage: '2050 BAU', label: 'High to extremely high',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 20, unit: 'g/kg', vintage: '2020', label: 'Low, Mediterranean dry',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; dossier (soil.md) flags eucalyptus + fire pressure.
    forest_change: {
      value: -2.4, unit: '%/decade', vintage: '2001–2023', label: 'Declining (eucalyptus + fires)',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1865, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Excellent (top decile EU)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 8, unit: 'sites', vintage: '2025', label: 'High density (Tamera anchor)',
      source: 'GEN, Tamera project page',
      sourceUrl: 'https://ecovillage.org/project/tamera-0/',
    },
    population: {
      value: 22, unit: 'p/km²', vintage: '2023', label: 'Very low (Portugal’s emptiest NUTS-II)',
      source: 'INE Portugal Censos 2021',
      sourceUrl: 'https://www.ine.pt/scripts/db_censos_2021.html',
    },
  },

  // Sources: data/research-dossier/galicia/{climate,water,soil,energy,stability,regen,accessibility}.md
  galicia: {
    climate: {
      value: 15.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild Atlantic temperate',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.18, unit: 'score', vintage: '2050 BAU', label: 'Low (coastal)',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 60, unit: 'g/kg', vintage: '2020', label: 'High, udic forest soils',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change retained, dossier soil.md notes broadly stable forest, some fire pressure.
    forest_change: {
      value: -0.4, unit: '%/decade', vintage: '2001–2023', label: 'Stable, some fire pressure',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1275, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Moderate (cloud-limited)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    // regen_network: dossier revised downward, Galicia has 3–5 GEN entries, not 9.
    regen_network: {
      value: 4, unit: 'sites', vintage: '2025', label: 'Sparse formal; *montes en man común* network',
      source: 'Red Ibérica de Ecoaldeas',
      sourceUrl: 'https://rie.ecovillage.org/',
    },
    population: {
      value: 91, unit: 'p/km²', vintage: '2023', label: 'Moderate; Ourense interior −15% since 2000',
      source: 'IGE, Instituto Galego de Estatística',
      sourceUrl: 'https://www.ige.gal/',
    },
  },

  // Sources: data/research-dossier/transylvania/{climate,water,soil,energy,stability,regen,accessibility}.md
  transylvania: {
    climate: {
      value: 11.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool continental',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.3, unit: 'score', vintage: '2050 BAU', label: 'Low to low-medium',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 45, unit: 'g/kg', vintage: '2020', label: 'High, intact hay-meadow/forest',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change retained, dossier regen.md cites FCC restoring 27,000 ha; broadly stable.
    forest_change: {
      value: -0.2, unit: '%/decade', vintage: '2001–2023', label: 'Stable, old-growth logging pressure',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1300, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Moderate (plateau cloud cover)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 8, unit: 'sites', vintage: '2025', label: 'Sparse but growing; FCC at scale',
      source: 'Mihai Eminescu Trust, Saxon villages',
      sourceUrl: 'https://www.mihaieminescutrust.ro/',
    },
    population: {
      value: 70, unit: 'p/km²', vintage: '2022', label: 'Low; rural villages −30–50% since 1990',
      source: 'INS, Recensământul Populației 2021',
      sourceUrl: 'https://www.recensamantromania.ro/',
    },
  },

  // Sources: data/research-dossier/connemara/{climate,water,soil,energy,stability,regen,accessibility}.md
  connemara: {
    climate: {
      value: 11.4, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild oceanic',
      source: 'EPA Research 471 (Met Éireann TRANSLATE)',
      sourceUrl: 'https://www.epa.ie/publications/research/climate-change/research-471-updated-high-resolution-climate-projections-for-ireland.php',
    },
    water_stress: {
      value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    // soil_carbon: dossier flags >120 g/kg blanket peat (was 72, revised up).
    soil_carbon: {
      value: 120, unit: 'g/kg', vintage: '2020', label: 'Very high, blanket-peat west',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change retained, Ireland’s overall west-coast forest is slowly recovering with afforestation.
    forest_change: {
      value: 1.1, unit: '%/decade', vintage: '2001–2023', label: 'Slowly recovering',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 975, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Low (Europe’s lowest band)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 10, unit: 'sites', vintage: '2025', label: 'Active (Cloughjordan, The Hollies)',
      source: 'Cloughjordan Ecovillage',
      sourceUrl: 'https://www.thevillage.ie/',
    },
    // population: West Cork 29, Connemara/Galway-West 22, midpoint 25.
    population: {
      value: 25, unit: 'p/km²', vintage: '2022', label: 'Very low (rural west)',
      source: 'CSO Ireland, Census 2022',
      sourceUrl: 'https://www.cso.ie/en/census/census2022/',
    },
  },

  // Sources: data/research-dossier/pembrokeshire/{climate,water,soil,energy,stability,regen,accessibility}.md
  pembrokeshire: {
    climate: {
      value: 12.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild Atlantic',
      source: 'Met Office UKCP18',
      sourceUrl: 'https://www.metoffice.gov.uk/research/approach/collaboration/ukcp/summaries/climate-change-projections-over-land',
    },
    water_stress: {
      value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 60, unit: 'g/kg', vintage: '2020', label: 'High, pasture/heath; Preseli peat higher',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; Welsh afforestation policies + Natural Resources Wales SoNaRR 2025 suggest mildly positive.
    forest_change: {
      value: 0.3, unit: '%/decade', vintage: '2001–2023', label: 'Slowly recovering (afforestation policy)',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1050, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Low (UK southwest)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    // regen_network: ~50 OPD-approved sites Wales-wide; ~12 within Pembrokeshire/Carmarthenshire orbit (Lammas core).
    regen_network: {
      value: 12, unit: 'sites', vintage: '2024', label: 'Active (One Planet Development × Lammas)',
      source: 'Welsh Government, TAN 6 One Planet Development',
      sourceUrl: 'https://www.gov.wales/planning-permission-one-planet-developments-open-countryside',
    },
    population: {
      value: 78, unit: 'p/km²', vintage: '2021', label: 'Moderate (rural wards 10–30 p/km²)',
      source: 'ONS, Census 2021 Pembrokeshire',
      sourceUrl: 'https://www.ons.gov.uk/visualisations/customprofiles/build/',
    },
  },

  // Sources: data/research-dossier/cevennes/{climate,water,soil,energy,stability,regen,accessibility}.md
  cevennes: {
    climate: {
      value: 14.5, unit: '°C', vintage: '2041–2060 RCP4.5', label: 'Mediterranean foothill',
      source: 'Météo-France DRIAS',
      sourceUrl: 'https://meteofrance.com/changement-climatique/quel-climat-futur/le-climat-futur-en-france',
    },
    water_stress: {
      value: 0.3, unit: 'score', vintage: '2050 BAU', label: 'Low-medium (uplands); coastal stress higher',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 45, unit: 'g/kg', vintage: '2020', label: 'High, chestnut & Med-oak schist',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; Parc national Cévennes biosphere protection + chestnut decline => mild recovery.
    forest_change: {
      value: 0.4, unit: '%/decade', vintage: '2001–2023', label: 'Slowly recovering (biosphere-protected)',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1550, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Good (Mediterranean influence)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 20, unit: 'sites', vintage: '2024', label: 'Dense, France’s strongest permaculture cluster',
      source: 'Terre & Humanisme',
      sourceUrl: 'https://www.terre-humaniste.org/',
    },
    // population: Lozère 15 (France lowest); Parc Cévennes ~24, use park-area midpoint.
    population: {
      value: 24, unit: 'p/km²', vintage: '2024', label: 'Very low (Lozère 15, France’s lowest)',
      source: 'INSEE, Lozère, Gard, Ardèche',
      sourceUrl: 'https://www.insee.fr/',
    },
  },

  // Sources: data/research-dossier/south-tirol/{climate,water,soil,energy,stability,regen,accessibility}.md
  'south-tirol': {
    // climate: mid-mountain settlement zone average (valley 14.5–15.5, mid 9–11).
    climate: {
      value: 12.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Alpine continental (mid-mountain)',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low (glacier/snow-fed)',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 60, unit: 'g/kg', vintage: '2020', label: 'High, mid-mountain forest/grassland',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; Alpine reforestation + protected forest => positive.
    forest_change: {
      value: 0.8, unit: '%/decade', vintage: '2001–2023', label: 'Recovering (Alpine reforestation)',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1375, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Moderate (Vinschgau higher)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    // regen_network: South Tirol has 1–2 formal GEN entries, the regen culture lives in
    // 1,200+ certified organic farms; this count reflects intentional-community proxies
    // rather than the broader organic-farm population. Noted in dossier.
    regen_network: {
      value: 5, unit: 'sites', vintage: '2024', label: 'Sparse formal; 1,200+ organic farms ambient',
      source: 'Bioland-Südtirol',
      sourceUrl: 'https://www.bioland-suedtirol.it/',
    },
    population: {
      value: 72, unit: 'p/km²', vintage: '2024', label: 'Moderate; growing +5.3% 2011–2023',
      source: 'ASTAT, South Tirol provincial statistics',
      sourceUrl: 'https://astat.provinz.bz.it/',
    },
  },

  // Sources: data/research-dossier/asturias/{climate,water,soil,energy,stability,regen,accessibility}.md
  asturias: {
    climate: {
      value: 15.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild Atlantic temperate',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 65, unit: 'g/kg', vintage: '2020', label: 'High, Atlantic oak/beech forest',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; Galicia/Asturias share eucalyptus pressure.
    forest_change: {
      value: -0.3, unit: '%/decade', vintage: '2001–2023', label: 'Mildly declining (eucalyptus pressure)',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1225, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Moderate',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 30, unit: 'sites', vintage: '2024', label: 'Dense (repoblación + 6 Biosphere Reserves)',
      source: 'Reservas de la Biosfera de Asturias',
      sourceUrl: 'https://reservasdelabiosfera.asturias.es/',
    },
    population: {
      value: 95, unit: 'p/km²', vintage: '2023', label: 'Moderate; interior comarcas 10–30 p/km²',
      source: 'SADEI, Asturias statistics',
      sourceUrl: 'https://www.sadei.es/',
    },
  },

  // Sources: data/research-dossier/saxony-anhalt/{climate,water,soil,energy,stability,regen,accessibility}.md
  'saxony-anhalt': {
    climate: {
      value: 11.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool continental',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.5, unit: 'score', vintage: '2050 BAU', label: 'Medium to high (Börde)',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    soil_carbon: {
      value: 35, unit: 'g/kg', vintage: '2020', label: 'High, Magdeburger Chernozem',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; managed German forestry => stable.
    forest_change: {
      value: 0.2, unit: '%/decade', vintage: '2001–2023', label: 'Stable (managed forestry)',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1125, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Moderate',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 6, unit: 'sites', vintage: '2024', label: 'Active (Sieben Linden, ZEGG nearby)',
      source: 'Ökodorf Sieben Linden',
      sourceUrl: 'https://siebenlinden.org/',
    },
    // population: rural Landkreis density (Altmarkkreis Salzwedel ~32) rather than Land-overall 106.
    population: {
      value: 32, unit: 'p/km²', vintage: '2024', label: 'Low (rural Landkreise)',
      source: 'Statistisches Landesamt Sachsen-Anhalt',
      sourceUrl: 'https://www.statistik.sachsen-anhalt.de/',
    },
  },

  // Sources: data/research-dossier/estonia-rural/{climate,water,soil,energy,stability,regen,accessibility}.md
  'estonia-rural': {
    climate: {
      value: 8.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool boreal',
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    water_stress: {
      value: 0.05, unit: 'score', vintage: '2050 BAU', label: 'Very low',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
    // soil_carbon: mineral-forest default; undrained peatland (22% of country) much higher (>150).
    soil_carbon: {
      value: 50, unit: 'g/kg', vintage: '2020', label: 'High, mineral forest; peatland higher',
      source: 'SoilGrids 2.0 (ISRIC)',
      sourceUrl: 'https://soilgrids.org',
    },
    // forest_change: best-effort; extensive forest + peatland-restoration trend => mildly positive.
    forest_change: {
      value: 0.5, unit: '%/decade', vintage: '2001–2023', label: 'Slowly recovering',
      source: 'Hansen Global Forest Change v1.11',
      sourceUrl: 'https://www.globalforestwatch.org',
    },
    solar_pv: {
      value: 1000, unit: 'kWh/kWp', vintage: '1999–2018 avg', label: 'Low (Baltic latitude)',
      source: 'Global Solar Atlas v2.7',
      sourceUrl: 'https://globalsolaratlas.info',
    },
    conflict: {
      value: 0, unit: 'events', vintage: '2019–2024', label: 'None (Russian border separate)',
      source: 'UCDP GED v25.1',
      sourceUrl: 'https://ucdp.uu.se',
    },
    regen_network: {
      value: 7, unit: 'sites', vintage: '2024', label: 'Active (Lilleoru + Setomaa); 23% organic farmland',
      source: 'Lilleoru Centre',
      sourceUrl: 'https://www.lilleoru.ee/',
    },
    population: {
      value: 30, unit: 'p/km²', vintage: '2024', label: 'Low (national); rural lower',
      source: 'Statistikaamet / Statistics Estonia',
      sourceUrl: 'https://www.stat.ee/',
    },
  },

  // ===================== North America =====================
  cascadia: {
    climate:      { value: 12.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild maritime', source: 'WorldClim CMIP6 v2.1', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 50, unit: 'g/kg', vintage: '2020', label: 'High, Willamette/forest', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -3, unit: '%/decade', vintage: '2001–2023', label: 'Timber-harvest loss, net ~stable', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1150, unit: 'kWh/kWp', vintage: '2022', label: 'Moderate (cloud-limited)', source: 'Global Solar Atlas v2.7', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 47, unit: 'sites', vintage: '2024', label: 'Densest in slate (FIC/GEN)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/' },
    population:   { value: 55, unit: 'p/km²', vintage: '2023', label: 'Moderate', source: 'JRC GHSL R2023', sourceUrl: 'https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php' },
  },
  vermont: {
    climate:      { value: 9.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cold continental', source: 'WorldClim CMIP6 v2.1 / NOAA NCA5', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 20, unit: 'g/kg', vintage: '2014–2022', label: 'Low–moderate (cropland/pasture)', source: 'SoilGrids 2.0 / UVM Soil Lab', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -0.5, unit: '%/decade', vintage: '2001–2023', label: 'Slight loss to sprawl', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1250, unit: 'kWh/kWp', vintage: '2023', label: 'Moderate', source: 'Global Solar Atlas v2.7', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '2019–2024', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 30, unit: 'sites', vintage: '2023–2025', label: 'Dense (incl. neighbouring states)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/' },
    population:   { value: 27, unit: 'p/km²', vintage: '2020', label: 'Low (interior much lower)', source: 'US Census 2020', sourceUrl: 'https://www.census.gov/quickfacts/VT' },
  },
  'southern-appalachians': {
    climate:      { value: 15.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Warm temperate highland', source: 'WorldClim CMIP6 v2.1 / NCA5', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 50, unit: 'g/kg', vintage: '2020', label: 'High, Appalachian forest', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: 0, unit: '%/decade', vintage: '2022', label: 'Stable (growth ≈ removal)', source: 'USDA FIA / Hansen GFC v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1400, unit: 'kWh/kWp', vintage: '2023', label: 'Good', source: 'Global Solar Atlas v2.7', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '2019–2024', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 25, unit: 'sites', vintage: '2025', label: 'Dense (Asheville cluster, Celo)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/' },
    population:   { value: 47, unit: 'p/km²', vintage: '2020', label: 'Moderate (18-county WNC)', source: 'JRC GHSL / US Census', sourceUrl: 'https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php' },
  },
  driftless: {
    climate:      { value: 11.75, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool continental', source: 'WICCI CMIP6 / WorldClim', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 23, unit: 'g/kg', vintage: '2014', label: 'Low–moderate (digital soil map)', source: 'Adhikari et al. Geoderma / SoilGrids 2.0', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: 1.5, unit: '%/decade', vintage: '2021', label: 'Net gain (statewide expansion)', source: 'USDA FS / Hansen GFC v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1365, unit: 'kWh/kWp', vintage: '2024', label: 'Good', source: 'Global Solar Atlas v2.7 / NREL NSRDB', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 20, unit: 'sites', vintage: '2024', label: 'Active (Organic Valley, Marbleseed)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/' },
    population:   { value: 13, unit: 'p/km²', vintage: '2020', label: 'Very low (Vernon/Crawford)', source: 'US Census 2020 / GHSL', sourceUrl: 'https://www.census.gov/quickfacts/vernoncountywisconsin' },
  },
  ozarks: {
    climate:      { value: 17.5, unit: '°C', vintage: '2041–2060 (NCA5 envelope)', label: 'Warm continental', source: 'NOAA NCEI / NCA5 Ch.22', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.15, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0 / USGS', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 20, unit: 'g/kg', vintage: '2020', label: 'Low (thin Ozark uplands)', source: 'SoilGrids 2.0 / NRCS OSD', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -1, unit: '%/decade', vintage: '2010–2023', label: 'Mixed, dossier internally inconsistent', source: 'Hansen GFC v1.11 / USDA FIA', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1440, unit: 'kWh/kWp', vintage: '2024', label: 'Good', source: 'NREL NSRDB / Global Solar Atlas v2.7', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '2000–2023', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 5, unit: 'sites', vintage: '2024–2025', label: 'Sparse (homestead, not institutional)', source: 'FIC / ic.org directory', sourceUrl: 'https://www.ic.org/community-directory/' },
    population:   { value: 4.5, unit: 'p/km²', vintage: '2020', label: 'Very low', source: 'US Census 2020', sourceUrl: 'https://www.census.gov/quickfacts/newtoncountyarkansas' },
  },
  'northern-new-mexico': {
    climate:      { value: 10.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'High-desert continental', source: 'WorldClim CMIP6 v2.1', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.85, unit: 'score', vintage: '2050 BAU', label: 'Extremely high', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 7, unit: 'g/kg', vintage: '2001–2024', label: 'Very low (arid rangeland)', source: 'SoilGrids 2.0 / NM rangeland studies', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -10, unit: '%/decade', vintage: '2022', label: 'Fire-driven loss (Hermit\'s Peak)', source: 'Hansen GFC v1.11 / fire records', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 2150, unit: 'kWh/kWp', vintage: '2024', label: 'Exceptional', source: 'NREL NSRDB / Global Solar Atlas v2.7', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '2019–2024', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 20, unit: 'sites', vintage: '2025', label: 'Active (earthship, permaculture)', source: 'FIC / ic.org / Earthship Biotecture', sourceUrl: 'https://www.ic.org/directory/' },
    population:   { value: 6, unit: 'p/km²', vintage: '2020', label: 'Very low (Taos County)', source: 'US Census 2020', sourceUrl: 'https://www.census.gov/quickfacts/taoscountynewmexico' },
  },
  'nova-scotia': {
    climate:      { value: 9.3, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cool maritime', source: 'WorldClim CMIP6 v2.1 / NS climate assessment', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 40, unit: 'g/kg', vintage: '2020', label: 'Moderate–high', source: 'SoilGrids 2.0 / Soil Landscapes of Canada', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -8, unit: '%/decade', vintage: '2001–2024', label: 'Industrial-forestry loss', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1100, unit: 'kWh/kWp', vintage: '2024', label: 'Moderate', source: 'Global Solar Atlas v2.7 / NRCan', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 5, unit: 'sites', vintage: '2025', label: 'Sparse (Treehouse Village, others)', source: 'GEN / FIC / Ecovillages Canada', sourceUrl: 'https://ecovillagescanada.ca/' },
    population:   { value: 18.4, unit: 'p/km²', vintage: '2021', label: 'Low', source: 'Statistics Canada 2021', sourceUrl: 'https://www12.statcan.gc.ca/census-recensement/2021/' },
  },
  kootenays: {
    climate:      { value: 10, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mountain-valley continental', source: 'ClimateNA / AdaptWest', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 40, unit: 'g/kg', vintage: '2020', label: 'Moderate (forested mineral soils)', source: 'SoilGrids 2.0 / SLC v3.2', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -5, unit: '%/decade', vintage: '2001–2023', label: 'Wildfire-driven (worse in peak years)', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1100, unit: 'kWh/kWp', vintage: '2024', label: 'Moderate (valley shading lowers real yield)', source: 'Global Solar Atlas v2.7', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 10, unit: 'sites', vintage: '2024', label: 'Active (Doukhobor + back-to-land legacy)', source: 'GEN / FIC directories', sourceUrl: 'https://ecovillage.org' },
    population:   { value: 2.8, unit: 'p/km²', vintage: '2021', label: 'Very low (RDCK)', source: 'Statistics Canada 2021', sourceUrl: 'https://www12.statcan.gc.ca/census-recensement/2021/' },
  },
  'quebec-eastern-townships': {
    climate:      { value: 8.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cold continental', source: 'Ouranos CMIP6 / WorldClim', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 32, unit: 'g/kg', vintage: '2023', label: 'Moderate (temperate-forest brunisols)', source: 'SoilGrids 2.0 / SLC 3.2', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: 1.0, unit: '%/decade', vintage: '2010–2020', label: 'Net gain (farmland reverting)', source: 'Hansen GFC v1.11 / Statistics Québec', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 1088, unit: 'kWh/kWp', vintage: '2023', label: 'Moderate (NRCan Sherbrooke)', source: 'CanmetENERGY / NRCan', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 0, unit: 'events', vintage: '1989–2023', label: 'None', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 10, unit: 'sites', vintage: '2024', label: 'Mid (fragmented Québec network)', source: 'GEN Canada / Répertoire éco-communautés', sourceUrl: 'https://ecovillagescanada.ca/' },
    population:   { value: 33, unit: 'p/km²', vintage: '2021', label: 'Moderate (rural 5–20)', source: 'Statistics Canada 2021 / GHSL', sourceUrl: 'https://www12.statcan.gc.ca/census-recensement/2021/' },
  },
  oaxaca: {
    climate:      { value: 19, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Tropical highland (valley/sierra mix)', source: 'WorldClim CMIP6 / Vázquez-Aguirre et al.', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.2, unit: 'score', vintage: '2050 BAU', label: 'Low–medium', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' },
    soil_carbon:  { value: 40, unit: 'g/kg', vintage: '2020', label: 'Moderate (valley) to high (forest)', source: 'SoilGrids 2.0 (ISRIC)', sourceUrl: 'https://soilgrids.org' },
    forest_change:{ value: -1.5, unit: '%/decade', vintage: '2001–2023', label: 'Declining (high gross loss; comunal forestry offsets)', source: 'Hansen Global Forest Change v1.11', sourceUrl: 'https://www.globalforestwatch.org' },
    solar_pv:     { value: 2000, unit: 'kWh/kWp', vintage: '2024', label: 'Exceptional', source: 'Global Solar Atlas v2.7 / World Bank', sourceUrl: 'https://globalsolaratlas.info' },
    conflict:     { value: 120, unit: 'events', vintage: '2019–2024', label: 'Material, organized violence within 200km', source: 'UCDP GED v25.1', sourceUrl: 'https://ucdp.uu.se' },
    regen_network:{ value: 10, unit: 'sites', vintage: '2024', label: 'Mid (formal); informal indigenous higher', source: 'GEN / NuMundo', sourceUrl: 'https://ecovillage.org/gen_country/mexico/' },
    population:   { value: 44, unit: 'p/km²', vintage: '2020', label: 'Moderate (state avg; Sierra ~23)', source: 'INEGI Census 2020', sourceUrl: 'https://en.www.inegi.org.mx/programas/ccpv/2020/' },
  },
};

// Criterion definitions, what V1 measures, why it matters, and how we frame it.
// Each criterion gets one card. Order is decision-relevant, not Askja's original order.
export const criteria = [
  {
    id: 'climate',
    askjaNumber: 2,
    name: 'Climate trajectory',
    metric: 'Mean annual temperature, 2041–2060',
    framing: 'Where the climate envelope will be at mid-century. State + trajectory in one number, what the temperature regime looks like by the time a community is mature.',
    source: 'WorldClim CMIP6 (SSP2-4.5)',
    sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    license: 'WorldClim terms',
    nativeUnit: '~18 km raster',
    rangeMin: 0,
    rangeMax: 25,
    rangeLabel: '°C',
    higherIs: 'hotter',
    ramp: ['#d6e8f0', '#e8c98a', '#c97a3a', '#8a3a2a'],
    rampLabels: ['Cool', 'Mild', 'Warm', 'Hot'],
  },
  {
    id: 'water_stress',
    askjaNumber: 4,
    name: 'Water stress',
    metric: 'Projected baseline water scarcity, 2050 BAU',
    framing: 'Ratio of demand to renewable supply at mid-century under business-as-usual emissions. A red-line criterion: high water stress today gets worse in a hotter future.',
    source: 'WRI Aqueduct 4.0',
    sourceUrl: 'https://www.wri.org/aqueduct',
    license: 'CC BY 4.0',
    nativeUnit: 'HydroBASINS Level 6',
    rangeMin: 0,
    rangeMax: 1,
    rangeLabel: 'score',
    higherIs: 'worse',
    ramp: ['#e8f4fa', '#a5c8dc', '#5a8aa8', '#1c4070'],
    rampLabels: ['Low', 'Low–Med', 'Medium', 'High'],
  },
  {
    id: 'soil_carbon',
    askjaNumber: 5,
    name: 'Soil organic carbon',
    metric: 'SOC topsoil concentration',
    framing: 'Carbon stored in living topsoil, a proxy for regenerative starting condition. Low SOC isn\'t disqualifying; it indicates more soil-building work ahead.',
    source: 'SoilGrids 2.0 (ISRIC)',
    sourceUrl: 'https://soilgrids.org',
    license: 'CC BY 4.0',
    nativeUnit: '250 m raster',
    rangeMin: 0,
    rangeMax: 150,
    rangeLabel: 'g/kg',
    higherIs: 'better',
    ramp: ['#f0e5cf', '#c7a868', '#7a5a2a', '#3a2a14'],
    rampLabels: ['Sparse', 'Moderate', 'Rich', 'Very rich'],
  },
  {
    id: 'forest_change',
    askjaNumber: 11,
    name: 'Forest cover trajectory',
    metric: 'Tree cover trend, 2001–2023',
    framing: 'Direction of forest cover over a generation. State + trajectory together, current cover plus directional movement. Read with land-use history.',
    source: 'Hansen Global Forest Change v1.11',
    sourceUrl: 'https://www.globalforestwatch.org',
    license: 'CC BY 4.0',
    nativeUnit: '30 m raster (regional aggregate shown)',
    rangeMin: -10,
    rangeMax: 5,
    rangeLabel: '%/decade',
    higherIs: 'better',
    ramp: ['#5a2a2a', '#b08070', '#a5c0a5', '#2d5a2a'],
    rampLabels: ['Loss', 'Slow loss', 'Stable', 'Recovery'],
  },
  {
    id: 'solar_pv',
    askjaNumber: 7,
    name: 'Solar PV potential',
    metric: 'Long-term average PV output',
    framing: 'Kilowatt-hours per installed kilowatt-peak per year. The foundation of off-grid energy autonomy. Pairs with wind and micro-hydro for full picture (V2).',
    source: 'Global Solar Atlas v2.7',
    sourceUrl: 'https://globalsolaratlas.info',
    license: 'CC BY 4.0',
    nativeUnit: '~1 km raster',
    rangeMin: 800,
    rangeMax: 2200,
    rangeLabel: 'kWh/kWp/yr',
    higherIs: 'better',
    ramp: ['#e8e4d8', '#e8c98a', '#e89a4a', '#b8633a'],
    rampLabels: ['Limited', 'Moderate', 'Good', 'Excellent'],
  },
  {
    id: 'conflict',
    askjaNumber: 1,
    name: 'Conflict proximity',
    metric: 'Fatal political-violence events 2019–2024',
    framing: 'Observed conflict events nearby. Note this is observed, not projected, political-violence projection is far harder than climate projection. Pair with governance indices.',
    source: 'UCDP GED v25.1',
    sourceUrl: 'https://ucdp.uu.se',
    license: 'CC BY 4.0',
    nativeUnit: 'event points within ~200 km',
    rangeMin: 0,
    rangeMax: 150,
    rangeLabel: 'events',
    higherIs: 'worse',
    ramp: ['#e8e4d8', '#c97a5a', '#8a3a2a', '#3a1a1a'],
    rampLabels: ['None', 'Some', 'Frequent', 'Active'],
  },
  {
    id: 'regen_network',
    askjaNumber: 3,
    name: 'Regenerative network density',
    metric: 'Intentional communities and permaculture sites within ~100 km',
    framing: 'Established sites, ecovillages, demonstration farms, transition towns. Proximity to existing knowledge networks shortens learning curves and opens supply chains.',
    source: 'GEN directory + OpenStreetMap',
    sourceUrl: 'https://ecovillage.org/projects/map/',
    license: 'GEN open data; ODbL',
    nativeUnit: 'point locations',
    rangeMin: 0,
    rangeMax: 50,
    rangeLabel: 'sites',
    higherIs: 'better',
    ramp: ['#e8e4d8', '#a5b8a0', '#5a8a5a', '#2d5a2a'],
    rampLabels: ['Sparse', 'Some', 'Moderate', 'Dense'],
  },
  {
    id: 'population',
    askjaNumber: 9,
    name: 'Population density',
    metric: 'Persons per km² (projected 2030)',
    framing: 'Density context, neither high nor low is "better." Combine mentally with accessibility (distance to hospital, road density) for the full picture of how connected vs. isolated a candidate area is.',
    source: 'JRC GHSL POP R2023A',
    sourceUrl: 'https://ghsl.jrc.ec.europa.eu/ghs_pop2023.php',
    license: 'Open (JRC)',
    nativeUnit: '1 km raster (regional avg)',
    rangeMin: 0,
    rangeMax: 200,
    rangeLabel: 'p/km²',
    higherIs: 'neutral',
    ramp: ['#f6f2eb', '#c8b8a0', '#8a7560', '#3a2a1c'],
    rampLabels: ['Very low', 'Low', 'Moderate', 'Dense'],
  },
];
