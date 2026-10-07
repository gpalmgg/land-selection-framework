// Fixture schema: only what apply_overlays.mjs and load_region_package.mjs read.
export const CONTINENTS = ['europe', 'north-america'];
export const CRITERIA_IDS = ['climate', 'water_stress', 'soil_carbon', 'forest_change', 'solar_pv', 'conflict', 'regen_network', 'population'];
export const CELL_REQUIRED = ['value', 'unit', 'vintage', 'label', 'source', 'sourceUrl'];
export const CELL_V2_REQUIRED = ['sourceId', 'method', 'footprint', 'retrieved', 'trajectory'];
export const EXTENSIONS = {
  criteria: ['window', 'step'],
  cell: ['scenario', 'license', 'outOfRange', 'nullReason', 'audit'],
  landStanding: ['sources', 'territorySource', 'territorySourceUrl', 'displacement'],
  regionDepth: ['caseStudy', 'caseLinks'],
  legalPathway: ['harmNote', 'hostBodyNote'],
  regions: [],
};
export const BASE_KEYS = {
  regions: ['id', 'continent', 'name', 'short', 'country', 'coords', 'blurb', 'accent'],
  landStanding: ['territory', 'tenure', 'entry', 'obligation', 'source', 'sourceUrl'],
  regionDepth: ['asks', 'source', 'sourceUrl'],
};
