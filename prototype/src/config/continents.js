// Continents, the "whole world" seam. Adding a continent is one entry
// here plus that continent's verified data. No render or map-engine change.

import { regions } from '../data.js';

export const CONTINENTS = {
  'europe':        { label: 'Europe',        center: [3, 48],    zoom: 4.0, minZoom: 3,   maxZoom: 9 },
  'north-america': { label: 'North America', center: [-100, 45], zoom: 3.2, minZoom: 2.5, maxZoom: 9 },
};
export const DEFAULT_CONTINENT = 'europe';

// Continents that actually have regions in the data right now. The switcher
// (and any NA UI) only appears once a continent has verified data, so the live
// site never shows an empty continent.
export function continentsPresent() {
  return Object.keys(CONTINENTS).filter((c) => regions.some((r) => r.continent === c));
}
