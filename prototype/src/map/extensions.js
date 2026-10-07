// The map extension manifest. Each extension is a module in this folder with a default export of the shape
//
//   { id, groups: [{ key, label, order }], layers: [{ id, group, label, defaultOn, role, sourceLine, legend }],
//     init(ctx), onContinent(ctx, continent), onTheme(ctx), dispose() }
//
// ctx = { map, maplibregl, health, getContinent(), isOn(id), onToggle(fn), beforeLabelsId(), labelProvider(fn),
//         getSlot() }. getSlot() returns the layer panel's #map-ext-slot element, or null until the panel has one.
// init runs once, after the map's first 'idle' (never at page load). Groups and layers merge into the panel and the
// legend generically (layers.js), so an extension never touches toggles.js, legend.js or map.js. Nobody edits this
// list: the work packages that own an extension replace that extension's own module.

import bioregions from './bioregions.js';
import compare from './compare.js';

export const extensions = [bioregions, compare];
