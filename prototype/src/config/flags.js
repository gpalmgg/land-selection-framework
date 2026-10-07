// Build-time switches. Nothing here reads the page: a flag is a constant a later work package flips in one place.

// When true, the map library is requested by src/map/loader.js instead of by a <script defer> in index.html (the page then has no
// maplibre tag; the markers `<!-- maplibre:begin -->` and `<!-- maplibre:end -->` in index.html bracket the two tags, and
// tests/e2e/suites/perf.py rewrites them to build both variants).
// MC-PERF (2026-10-06): ADOPTED, and forced by the budget rather than by the A/B gain rule. The first A/B (loader injecting the
// script as soon as the map starts) gained under 100 ms of throttled LCP, so it was left off. But the home page then fetched the
// 217 KB library (plus the basemap tiles it triggers) before its load event, and bytes at the load event were 826 KB against the
// 700 KB hard limit (G8), which no amount of trimming the app's own 313 KB reached. The loader now WAITS (src/map/loader.js
// mapGate: idle after load with a 2.5 s cap, or #map within 600 px of the viewport), which puts the library and the first tiles
// after the load event. The cost is that the map is created up to a couple of seconds after load; it is on screen before a visitor
// can scroll to it, and the cards, criteria and thresholds (the page's first job) no longer wait behind it.
export const LAZY_MAP = true;

// Which basemap the map starts with (src/map/basemap.js). 'esri' is the keyless Esri Light Gray raster pair (the
// default); 'openfreemap' skips Esri and starts on the OpenFreeMap positron vector style, the same style the map
// fails over to when the Esri tiles do not arrive. Changing this one word is the whole provider swap.
export const BASEMAP_PROVIDER = 'esri';

// The lowest zoom at which the basemap's place-name layer (Esri Reference) is requested and drawn. Chosen by measurement, twice.
// MC-MAP-BASE (2026-10-05, probe at the continent default zoom 4.0): base + labels 197.5 KB at the worst view, so 0 qualified.
// MC-PERF (2026-10-06, the real page): since the map fits the continent's regions to its stage (src/map/continent.js) the default
// view at 1440 px is zoom 2.78, not 4.0, and base + labels cost 333 KB (tests/e2e/suites/perf.py, `basemap_bytes`), over the 300 KB
// cap (G8). With the labels from zoom 3 the default desktop view costs about 270 KB (measured), and the
// place names are drawn as soon as the visitor zooms in one step; the region markers and the bioregion labels keep the wide view
// readable. The 390 px views stay under the cap either way (58 to 147 KB). Set it back to 0 to draw labels at every zoom: the cost is
// the 300 KB budget at 1440 px, which tests/e2e/suites/perf.py then fails.
export const BASEMAP_LABELS_MINZOOM = 3;
