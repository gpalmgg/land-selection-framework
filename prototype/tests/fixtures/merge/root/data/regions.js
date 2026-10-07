// Fixture: house format of data/regions.js (three regions, two criteria). Comments here must survive every patch.
//
// Schema per value:
//   { value, unit, vintage, label, source, sourceUrl }

export const regions = [
  {
    id: 'alpha',
    continent: 'europe',
    name: 'Alpha Plain',
    country: 'Portugal',
    coords: [-7.9, 38.6],
    blurb: 'Dry plain with cork-oak woodland. It\'s hot in summer.',
    accent: '#b8633a',
  },
  {
    id: 'beta-land',
    continent: 'europe',
    name: 'Beta Land / Highlands',
    short: 'Beta',
    country: 'Ireland',
    coords: [-9.4, 53.0],
    blurb: 'Atlantic hill country with blanket bog.',
    accent: '#2c5f7c',
  },
  {
    id: 'gamma',
    continent: 'north-america',
    name: 'Gamma Valley',
    country: 'USA',
    coords: [-72.7, 44.0],
    blurb: 'Cold continental valley, largely unceded land.',
    accent: '#3a6a4a',
  },
];

export const values = {
  // ===================== Europe =====================
  alpha: {
    climate: {
      value: 19.5, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Hot, dry', // 2026-07 audit: kept
      source: 'WorldClim CMIP6 v2.1',
      sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html',
    },
    // water stress: baseline value, flagged by the audit
    water_stress: {
      value: 0.7, unit: 'score', vintage: '2050 BAU', label: 'High to extremely high',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
  },

  // Sources: data/research-dossier/beta-land/{climate,water}.md
  'beta-land': {
    climate: {
      value: 11.4, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Mild oceanic',
      source: 'EPA Research 471',
      sourceUrl: 'https://www.epa.ie/publications/research/climate-change/research-471.php',
    },
    water_stress: {
      value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low',
      source: 'WRI Aqueduct 4.0',
      sourceUrl: 'https://www.wri.org/aqueduct',
    },
  },

  // ===================== North America =====================
  gamma: {
    climate:      { value: 9.0, unit: '°C', vintage: '2041–2060 SSP2-4.5', label: 'Cold continental', source: 'WorldClim CMIP6 v2.1', sourceUrl: 'https://www.worldclim.org/data/cmip6/cmip6climate.html' },
    water_stress: { value: 0.08, unit: 'score', vintage: '2050 BAU', label: 'Low', source: 'WRI Aqueduct 4.0', sourceUrl: 'https://www.wri.org/aqueduct' }, // one-line cell
  },
};

export const criteria = [
  {
    id: 'climate',
    name: 'Climate trajectory',
    rangeMin: 0,
    rangeMax: 25,
    rangeLabel: '°C',
    higherIs: 'hotter',
  },
  {
    id: 'water_stress',
    name: 'Water stress',
    rangeMin: 0,
    rangeMax: 1,
    rangeLabel: 'score',
    higherIs: 'worse',
  },
];
