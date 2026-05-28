# Research — Usability Upgrade

**Date:** 2026-05-27. Two parallel Explore agents: frontend integration surface + content feasibility. Both clean.

## A. Frontend integration surface (src/main.js + index.html + data/regions.js)

### Threshold state & URL
- `const state = { continent:'europe', thresholds:{}, passing:{}, mapLayers:{} }` (main.js:35-52).
- URL scheme `?t.<critId>=<value>`, repeatable. `applyThresholdsFromURL()` (138-150) parses + clamps to crit range on boot; `writeThresholdsToURL()` (153-169) uses `history.replaceState`, debounced 400ms by `scheduleURLWrite()` (171-174). Slider input → `refreshAll()` + `scheduleURLWrite()` (561).
- 8 criteria ids: `climate, water_stress, soil_carbon, forest_change, solar_pv, conflict, regen_network, population`. Each has `rangeMin/rangeMax/rangeStep`, `higherIs`. `thresholdDirection(crit)` (88-90) → 'min' if higherIs==='better' else 'max'.

### Filter (framework-critical)
- `regionPasses(regionId)` (105-115): **pure boolean**, iterates all 8 criteria, direction-aware `value >= threshold` (min) / `value <= threshold` (max), returns false on first miss. No scoring, no mutation. **Presets and shortlist plug in here without violating the no-score rule** — presets just set `state.thresholds`; shortlist is a user-pinned set filtered/displayed, never ranked.
- `activeRegions()` (124-126): `regions.filter(r => r.continent === state.continent)`.

### Render functions
- `renderRegionGrid()` (501-514): `div.region-card` per region → `#region-grid`; card `id="region-{id}"`, `data-continent`. No listeners yet (clean place to add star + drawer-open).
- `renderCriterionCard()` (520-612) / `renderCriteriaGrid()` (614-617): slider cards → `#crit-grid`. Preset chips mount near here.
- `renderSummaryTable()` (623-663): `table#sum-table`, columns per region (`data-continent`), rows per criterion, cells `id="sum-td-{rid}-{cid}"`. **Reusable for compare view** — scope columns to starred set.
- `refreshAll()` (771-872): recomputes `state.passing`; updates `#match-count`/`#match-total`/`#match-detail`, card `.fail`, table cell `.pass/.fail/.dimmed`, marker `.dim`. **Next-step row hooks the match-bar update here.**

### Continent machinery
- `setContinent()` (694-723): sets state + `body.dataset.continent`, recenters map, swaps geojson sources, toggles `.continent-tab .active`, `refreshAll()`, dispatches `lsf:continentchange`.
- CSS (index.html 456-459): `body[data-continent="X"] [data-continent="Y"]:not(.continent-tab){display:none !important}`. **GOTCHA: every new continent-aware control (chips, star, drawer trigger) that carries `data-continent` must be excluded the same way, or it vanishes on the off-continent.** Switcher only renders when `continentsPresent().length >= 2`.

### DOM anchors / CSS
- IDs: `#region-grid`, `#crit-grid`, `.match-bar` (`#match-count`,`#match-total`,`#match-detail`,`#share-btn`,`#reset-btn`,`#share-note`), `#sum-table`, `#continent-switcher`, `#signup-modal` (+`#modal-form`,`#modal-email`,`#modal-close-btn`).
- CSS vars: `--paper/--paper-2/--paper-3`, `--ink/--ink-2..4`, `--rule`, `--accent`, `--pass hsl(120,70%,40%)`, `--fail hsl(0,70%,50%)`.
- **Modal** (`#signup-modal`, `showSignupModal()` ~1481-1520, engagement triggers scroll/slider/30s) — reuse open/close + overlay pattern for the drawer. No explicit responsive breakpoints in inline CSS (flex/grid fluid); 390px target → drawer becomes bottom slide-up sheet.

### Cache-bust
- `?v=na2` at: index.html `<script type="module" src="./src/main.js?v=na2">` (~1466); main.js `style: './style.json?v=na2'` (~282) and processed geojson loads. **Bump every occurrence on JS change → `usab1`.**

### Em-dash / style
- **Em-dashes STILL present** in `#match-detail` status copy (main.js ~782-788) despite the "0 em-dashes" claim. Fix during build (comma/period per context).

## B. Content feasibility (data/research-dossier/)

- Uniform structure: each of 20 region dirs has 8 files — `accessibility.md, climate.md, energy.md, legal.md, regen.md, soil.md, stability.md, water.md` (18-44 lines each). `legal.md` + `regen.md` carry explicit "Practitioner-relevant nuance" sections and Sources lists (5-9 cited URLs).
- **All 20 = RICH. 0 thin, 0 missing.** Phase 2 synthesis is **LOW RISK** and fabrication-free.
- 3 EU case studies confirmed in deeper.html with anchors `#alentejo`, `#connemara`, `#transylvania` (region ids match) → these **deep-link** instead of inline prose.
- The **17 to synthesize**: galicia, pembrokeshire, cevennes, south-tirol, asturias, saxony-anhalt, estonia-rural, cascadia, vermont, southern-appalachians, driftless, ozarks, northern-new-mexico, nova-scotia, kootenays, quebec-eastern-townships, oaxaca.
- Source line per drawer summary: draw from each region's `legal.md` + `regen.md` Sources (matches the per-cell source+vintage discipline already in `regions.js`).

## Implications for the plan
1. All four components hook into existing functions with no architectural change. Vanilla JS, additive.
2. Reuse: URL machinery (presets + `?pin=`), `renderSummaryTable` (compare), modal pattern (drawer).
3. Hard constraints carried into ACs: pure-boolean filter preserved (grep for score/weight/rank = 0 new), `:not(.continent-tab)`-style continent exclusion for every new tagged control, `?v=` bump, em-dash purge, 390px drawer, zero fabricated content (17 summaries staged for human verify, not shipped).
