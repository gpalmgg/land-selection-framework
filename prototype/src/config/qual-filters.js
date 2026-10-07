// Qualitative (per-jurisdiction) filter definitions: the r4 V1 layers exposed
// as enum filters. These are FILTERS, never scores, same threshold-not-weighting
// discipline as the sliders. Each filter independent; 'any' means no filter;
// a chosen value means the region must match exactly to pass.
//
// Ids and option VALUES are exactly those of the first release, so shared links such as
// ?q.affordability_band=cheapest keep parsing. This file defines no display text: labels for filters and options
// come from lib/qual-labels.js.
//
// `pick` reads the v1 lookup with optional chaining so a slimmer lookup still works.

import { v1Lookup } from '../data.js';

export const QUAL_FILTERS = [
  {
    id: 'foreign_ownership',
    options: ['any', 'yes', 'restricted', 'no'],
    pick: (rid) => v1Lookup.legal_ownership?.[rid]?.foreign_ownership?.allowed,
  },
  {
    id: 'affordability_band',
    options: ['any', 'cheapest', 'low', 'moderate', 'premium', 'very_premium', 'unknown'],
    pick: (rid) => v1Lookup.land_cost?.[rid]?.affordability_band,
  },
  {
    id: 'buffering_strength',
    options: ['any', 'very_low', 'low', 'moderate', 'high', 'very_high'],
    pick: (rid) => v1Lookup.climate_buffering?.[rid]?.buffering_strength,
  },
  {
    id: 'regulatory_direction',
    options: ['any', 'stable', 'tightening', 'loosening', 'volatile'],
    pick: (rid) => v1Lookup.legal_ownership?.[rid]?.regulatory_direction,
  },
];
