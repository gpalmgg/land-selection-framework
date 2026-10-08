// Build-time switches. Nothing here reads the page: a flag is a constant a later work package flips in one place.

// When true, the map library is requested by src/map/loader.js instead of by a <script defer> in index.html (the page then has no
// maplibre tag; the markers `<!-- maplibre:begin -->` and `<!-- maplibre:end -->` in index.html bracket the two tags, and
// tests/e2e/suites/perf.py rewrites them to build both variants).
// RESTORE-PERF (2026-10-07): OFF. The A/B rule (perf-budget.json ab.lazy_map) does not adopt it: the throttled LCP gain is 60 ms
// against a 150 ms threshold, and the gated map appears 2.59 s after load on desktop, past the 2.5 s cap. The eager page's bytes at
// load are 601 KB against the 700 KB hard limit (G8), so the budget no longer forces it either (an earlier run measured 826 KB). The lazy gate also made slider interaction janky: the library's onload task plus the map's
// first software-GL frames (about 2.4 s of main-thread work) land seconds after load, exactly when a visitor starts to drag a
// slider (frame p95 212 ms, main-thread p95 143 ms on the 45-region stress site; eager: 49 ms and 14 ms).
// To go lazy again, flip this word AND the maplibre:begin/end block in index.html (tests/e2e/suites/perf.py set_lazy() does both).
export const LAZY_MAP = false;

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
