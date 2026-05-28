# North America build, codebase research (grounding for the plan)

**Purpose:** map the current state of the prototype exactly, so `/deep-plan` can be drafted against reality, not assumptions. Every claim below is verified against the actual files. No changes proposed here, this is a map.

**Verification date:** 2026-05-26. Files read in full: `data/regions.js`, `src/main.js`, `index.html` (relevant sections), `scripts/process_aqueduct.py`, `scripts/process_aqueduct_depletion.py`, `scripts/process_vectors.py`, `scripts/process_rasters.py`, `.vercelignore`, `.gitignore`, `deeper.html` (relevant sections), one full dossier file, dossier directory listing for all 10 regions.

**Key correction to a design-doc assumption:** the design doc (and the regions.js header comment) say "ten European candidate regions." That is correct, there are exactly **10** EU regions today, not 4. (The project's top-level CLAUDE.md still describes "4 European candidates", that is stale; `regions.js` has 10.)

---

## 1. Data model, `prototype/data/regions.js`

Single ES module, 721 lines. Three named exports consumed everywhere: `regions`, `values`, `criteria`.

### 1.1 Region object shape

Fields observed across all 10 region objects (`regions.js:13–98`):

- `id` (string, kebab-case; e.g. `'alentejo'`, `'south-tirol'`, `'estonia-rural'`), the join key into `values`, used in DOM ids everywhere.
- `name` (string, display name).
- `short` (string, **optional**, present only on `connemara`, `pembrokeshire`, `cevennes`, `saxony-anhalt`; used by the bar rows to avoid truncation, falls back to `name`).
- `country` (string).
- `coords` (`[lng, lat]` array, note **lng first**, GeoJSON/MapLibre order).
- `blurb` (string, 1–3 sentences).
- `accent` (hex color string; drives marker color, region-card accent, summary-table swatch).

**There is NO `continent` field today.** Confirmed by reading all 10 objects and grepping. This is the one-line data-model addition Batch 0 needs.

One full region object, quoted exactly (`regions.js:38–46`):

```js
{
  id: 'connemara',
  name: 'West Cork / Connemara',
  short: 'West Cork',
  country: 'Ireland',
  coords: [-9.4, 53.0],
  blurb: 'Atlantic-temperate Ireland. Mild winters, abundant water, peat-rich soils, active transition-town and ecovillage networks.',
  accent: '#2c5f7c',
},
```

### 1.2 `criteria` array shape

8 entries (`regions.js:583–720`). Every entry has these fields (no optionals, all 8 carry all fields):
`id`, `askjaNumber`, `name`, `metric`, `framing`, `source`, `sourceUrl`, `license`, `nativeUnit`, `rangeMin`, `rangeMax`, `rangeLabel`, `higherIs`, `ramp` (array of 4 hex), `rampLabels` (array of 4 strings).

`higherIs` takes one of: `'better'`, `'worse'`, `'hotter'`, `'neutral'`. The slider direction logic (`main.js:59–61`) treats `'better'` → `min` threshold; everything else (`worse`/`hotter`/`neutral`) → `max` threshold.

All 8 criteria, id + askjaNumber + range:

| id | askjaNumber | name | range | rangeLabel | higherIs |
|---|---|---|---|---|---|
| `climate` | 2 | Climate trajectory | 0–25 | °C | hotter |
| `water_stress` | 4 | Water stress | 0–1 | score | worse |
| `soil_carbon` | 5 | Soil organic carbon | 0–150 | g/kg | better |
| `forest_change` | 11 | Forest cover trajectory | −5–5 | %/decade | better |
| `solar_pv` | 7 | Solar PV potential | 800–2000 | kWh/kWp/yr | better |
| `conflict` | 1 | Conflict proximity | 0–100 | events | worse |
| `regen_network` | 3 | Regenerative network density | 0–30 | sites | better |
| `population` | 9 | Population density | 0–200 | p/km² | neutral |

**Criteria are global / continent-agnostic**, the design's "criteria are global; only per-region values are added" is exactly what the code does. The criteria array drives state init (`main.js:8`), slider rendering, and all column/row iteration. NA needs **zero** changes here, *unless* a range needs widening for NA values (e.g. solar in arid New Mexico may exceed the EU-tuned `solar_pv` max of 2000, and Oaxaca tropical-highland climate could push the `climate` max past 25). **Watch item, not a structural change**, flagged in Gotchas.

### 1.3 `values[regionId][critId]` cell shape

`values` is an object keyed by region id, each holding 8 criterion-keyed cells (`regions.js:118–579`). Cell shape:
`{ value, unit, vintage, label, source, sourceUrl }`.

One full cell, quoted exactly (`regions.js:126–130`, alentejo water_stress):

```js
water_stress: {
  value: 0.7, unit: 'score', vintage: '2050 BAU', label: 'High to extremely high',
  source: 'WRI Aqueduct 4.0',
  sourceUrl: 'https://www.wri.org/aqueduct',
},
```

`value` is usually a number; `regionPasses` and `normalize` guard with `typeof v.value !== 'number'` (so a non-numeric value is allowed and simply never fails a threshold). `unit`, `vintage`, `label`, `source`, `sourceUrl` are all strings. Every cell carries its own source+sourceUrl+vintage (not inherited from the criterion), this is the per-cell sourcing the data-honesty rule depends on, and it is what the index.html inline `<details>` script reads (§2.4).

### 1.4 Exports / imports

`regions.js` exports `regions`, `values`, `criteria` (all `export const`).
Two consumers, both ES modules:
- `src/main.js:1`, `import { regions, values, criteria } from '../data/regions.js';`
- `index.html:1488` (inline `<script type="module">`), `import { regions, values, criteria } from './data/regions.js';`

**What the NA build must change/add here:** add `continent: 'europe'` to all 10 existing region objects; add 10 NA region objects with `continent: 'north-america'`; add 10 NA value blocks (80 cells). No criteria changes (modulo possible range widening, see §1.2). This is the bulk of the marathon content work; the schema itself is ready.

---

## 2. Render + state layer, `prototype/src/main.js` (1111 lines)

### 2.1 `state` object shape (`main.js:7–23`)

```js
const state = {
  thresholds: Object.fromEntries(criteria.map((c) => [c.id, thresholdDefault(c)])),
  passing:    Object.fromEntries(regions.map((r) => [r.id, true])),
  mapLayers: { hillshade, topo, satellite, 'night-lights', 'forest-change',
               'water-stress', 'water-depletion', conflict, 'regen-network': true /* …others false */ },
};
```

- `thresholds`, keyed **by criterion id** (8 entries). **Continent-global by construction.** This directly confirms the design's "thresholds persist across a continent switch", a threshold is a per-criterion preference, with no region or continent dimension. Switching continents does NOT need to touch `state.thresholds`; it only needs to re-run `refreshAll()` so the (unchanged) thresholds re-apply to the now-visible region set.
- `passing`, keyed **by region id**, recomputed every `refreshAll()` (`main.js:650`). Today initialised over ALL regions. After adding NA regions, this will hold all 20 region ids; that is fine, `refreshAll` recomputes them regardless. The display logic must only *count/show* the active continent's regions (see insertion points).
- `mapLayers`, keyed by layer id, boolean visibility. Continent-agnostic; `regen-network` starts visible.
- **No `continent` field today.** The plan adds `state.continent` (default value is the §7 open question in the design doc).
- Module-level (outside `state`): `let mapInstance = null;` (`main.js:25`), `let regionMarkers = {};` (`main.js:26`).

### 2.2 Every function that iterates regions/values, the continent-filter insertion points

The pattern across the renderers is: **iterate `regions` (or `regions.filter`) and index `values[r.id][critId]`.** Every such loop is a place where the design's "filter by `state.continent`" must apply. There is no existing region-filtering helper, the only filter primitive is `regionPasses` (threshold filter). The cleanest plan-level move is a single helper like `activeRegions()` returning `regions.filter(r => r.continent === state.continent)` and routing the render loops through it; but the research deliverable is the exhaustive list of raw insertion points, below.

**`renderRegionGrid`** (`main.js:464–476`), `regions.forEach` at **`main.js:466`** builds the region intro cards.

**`renderCriterionCard`** (`main.js:482–573`), called per criterion by **`renderCriteriaGrid`** (`main.js:575–578`, `criteria.forEach` at 577):
- bar-rows loop: `regions.forEach((r) => { const v = values[r.id][crit.id]; … })` at **`main.js:536`**.

**`renderSummaryTable`** (`main.js:584–622`):
- header columns: `regions.forEach` at **`main.js:589`**.
- body cells per criterion: `regions.forEach` at **`main.js:606`** (inside `criteria.forEach` at 603).

**`initMap` region-marker loop** (`main.js:390–400`): `regions.forEach((r) => { … new maplibregl.Marker(...).setLngLat(r.coords) … regionMarkers[r.id] = wrap; })`. Loop starts at **`main.js:390`**. (Markers for the inactive continent must be hidden or not created, see §3.)

**`renderSourcesList`** (`main.js:628–642`): iterates **`criteria`** (`criteria.forEach` at 631), dedups by `c.source`. This lists *criterion-level* sources, not per-region, so it is continent-independent, **no continent filter needed**, but note it shows only the 8 global criterion sources (the per-region/national sources live in the index.html `<details>` and in deeper.html).

**`refreshAll`** (`main.js:648–751`), the hot path, multiple region loops, all currently over ALL regions:
- `regions.forEach` recompute passing, **`main.js:650`**.
- `regions.filter(...).length` passing count, **`main.js:651`** (feeds `#match-count`).
- `regions.filter(...)` for match detail names, **`main.js:659`**.
- region-card update loop, **`main.js:666`**.
- map-marker dim loop, **`main.js:677`**.
- inside `criteria.forEach` (683): slider-hint pass-names `regions.filter`, **`main.js:704`**; threshold-line-per-bar `regions.forEach`, **`main.js:718`**; per-bar pass/fail `regions.forEach`, **`main.js:727`**.
- summary-table fail-styling `regions.forEach`, **`main.js:740`** (with nested `criteria.forEach` at 743).

**`regionPasses`** (`main.js:76–86`), iterates `criteria`, indexes `values[regionId][crit.id]`. Takes a single regionId; **continent-agnostic, no change needed** (it is called per-region by the loops above). Will be called for NA regions once they exist; works unchanged provided every NA cell exists.

**`anyFilterActive`** (`main.js:88–90`), iterates `criteria` only, compares thresholds to defaults. **Continent-independent; no change.**

**`pickOgImagePath`** (`main.js:154–161`), `regions.filter(r => regionPasses(r.id))`. Currently all regions; with NA added this would count cross-continent passes. **Needs continent awareness** if OG image logic should reflect only the active continent (lower priority, OG variants only exist for 4 EU regions, set `REGIONS_WITH_OG_VARIANT` at `main.js:150`).

**`initSignupModal`** (`main.js:937+`), has a local `const criteria = document.querySelector('.criteria')` at `main.js:980` that **shadows** the imported `criteria`. Not a data loop; noted only so the planner doesn't mistake it for a criteria iteration.

### 2.3 Threshold/filter state persistence, confirmed

`state.thresholds` is **per-criterion (criterion-global)**, never per-region or per-continent (`main.js:8`). URL state (`t.<critId>=…`) is likewise per-criterion (`applyThresholdsFromURL` `main.js:102–114`, `writeThresholdsToURL` `main.js:117–133`). **Conclusion: thresholds persist across a continent switch for free.** A continent switch must call `refreshAll()` (and re-center the map); it must NOT reset thresholds. The URL scheme has no continent param today, the plan may want `?c=north-america` added alongside `t.*` for shareable continent state (open design choice, not a blocker).

### 2.4 index.html inline `<script>` (per-criterion source `<details>`)

`index.html:1487–1556`. Imports `regions, values, criteria` (`:1488`). `buildSourcesBlock(crit)` (`:1490`) loops **`regions.forEach`** at **`index.html:1499`**, reading `values[r.id][crit.id]` → emits one `<li>` per region with `v.source`/`v.sourceUrl`/`v.vintage`. The summary text hardcodes "(10 regions)" at **`index.html:1495`**. `augmentCriterionCards` (`:1532`) attaches one `<details>` per criterion card.

**What the NA build must change/add here:** this is a **third continent-filter insertion point** outside main.js. If continents are filtered, this loop must filter `regions` by active continent (and the "(10 regions)" label must become dynamic), OR it must list both continents' sources. Because this runs once at load (via `requestAnimationFrame`) and is not re-run by `refreshAll`, a continent switch would need to either re-build these blocks or pre-build per-continent. **This is the easiest insertion point to miss**, it is not in main.js and not re-rendered on state change.

### 2.5 Boot sequence (`main.js:1100–1110`)

`applyThresholdsFromURL()` → `renderRegionGrid()` → `renderMapToggles()` → `renderCriteriaGrid()` → `renderSummaryTable()` → `renderSourcesList()` → `refreshAll()` → `initMap()` → form/modal init. All renderers run once at load. **There is no re-render-on-switch mechanism today**, a continent switcher must either (a) re-run the render functions for the new continent, or (b) render both continents' DOM and toggle visibility. The plan must choose; the renderers are not idempotent against an existing DOM (they `appendChild` without clearing, re-running `renderRegionGrid` would duplicate cards). This is an architecture decision the plan must make explicit.

---

## 3. Map, `initMap` + `renderMapToggles` (`main.js:197–458`)

### 3.1 Map view parameters to continent-parameterise

In `new maplibregl.Map({…})` (`main.js:202–224`):
- `center: [3, 48]` (`main.js:220`), Europe-centred.
- `zoom: 4.0` (`main.js:221`).
- `minZoom: 3` (`main.js:222`).
- `maxZoom: 9` (`main.js:223`).

These four are the values the design's `CONTINENTS` config must parameterise. The design suggests NA `center:[-100,45], zoom:3.2`. The basemap (CARTO Positron, `main.js:207–216`) and `NavigationControl` (`main.js:226`) are global, no change.

### 3.2 Map layer inventory (`renderMapToggles` `layerDefs`, `main.js:406–416`)

Nine toggles in two groups:

| toggle id | name | group | source type in initMap | GLOBAL vs PROCESSED |
|---|---|---|---|---|
| `forest-change` | Forest loss | data | raster XYZ, GFW `tiles.globalforestwatch.org/umd_tree_cover_loss` (`main.js:294–304`) | **GLOBAL**, works for NA, no new data |
| `water-stress` | Water stress 2050 | data | **geojson** `data/processed/water-stress.geojson` (`main.js:307–325`) | **PROCESSED (Europe-clipped)**, needs NA re-run |
| `water-depletion` | Water depletion 2050 | data | **geojson** `data/processed/water-depletion.geojson` (`main.js:328–346`) | **PROCESSED (Europe-clipped)**, needs NA re-run |
| `conflict` | Conflict density | data | **geojson** `data/processed/conflict.geojson` (`main.js:349–370`) | **PROCESSED (Europe-clipped)**, see note below |
| `regen-network` | Ecovillage sites | data | **geojson** `data/processed/ecovillages.geojson` (`main.js:373–387`) | **PROCESSED (Europe-clipped)**, see note below |
| `hillshade` | Terrain relief | imagery | raster XYZ, Esri World_Hillshade (`main.js:232–243`) | **GLOBAL** |
| `topo` | Topographic map | imagery | raster XYZ, OpenTopoMap (`main.js:246–261`) | **GLOBAL** |
| `satellite` | Recent satellite | imagery | raster XYZ, EOX Sentinel-2 cloudless (`main.js:264–275`) | **GLOBAL** |
| `night-lights` | Night lights | imagery | raster XYZ, NASA GIBS VIIRS Black Marble (`main.js:278–289`) | **GLOBAL** |

**Split summary:**
- **GLOBAL (5):** forest-change, hillshade, topo, satellite, night-lights, all XYZ/WMTS tile services with worldwide coverage. **No new data for NA.** They simply render wherever the map is centred.
- **PROCESSED, Europe-clipped (4):** water-stress, water-depletion, conflict, regen-network, all served from `data/processed/*.geojson`, all produced by Python scripts with a hardcoded `EUROPE_BBOX` filter.
  - The design doc only flags **water-stress + water-depletion** as needing reprocessing. **That is incomplete.** `conflict.geojson` and `ecovillages.geojson` are *also* Europe-clipped (`process_vectors.py:20` `EUROPE_BBOX`, `in_europe()` filter at `:23–25`, applied at `:41` and `:117`). For NA those two layers would render **empty** over North America. See §4 for what reproducing them entails. (Practically: NA conflict is ~0 events, matching the criterion data, so an empty conflict layer is arguably *honest*, but the regen-network/ecovillage map layer going empty over NA is a real visible gap, since regen density is the framework's signature layer and starts visible.)

### 3.3 Region markers (`main.js:390–400`)

DOM markers (not a GeoJSON source), one per region: a `.region-marker` div with `--marker-color` = `r.accent`, text = first letter of `r.name`, plus a `.region-label` child. `new maplibregl.Marker({element}).setLngLat(r.coords).addTo(mapInstance)`. **Keyed `regionMarkers[r.id] = wrap`** (`main.js:399`), keyed by region id, so 20 regions = 20 entries; collision-free. `refreshAll` dims markers via `regionMarkers[r.id].classList.toggle('dim', …)` (`main.js:677–680`).

**What the NA build must change/add here:** markers for the inactive continent must be hidden (the design notes "lazy-load inactive continent's heavy layers" and 20-marker performance). The marker loop at `main.js:390` is a continent-filter insertion point; alternatively all 20 are created and inactive ones get `display:none`. The `center/zoom/minZoom/maxZoom` must come from a `CONTINENTS` config, and switching continents calls `mapInstance.flyTo`/`setCenter`+`setZoom`.

---

## 4. Data processing, `prototype/scripts/`

Four Python scripts. The `.venv` (Python 3.12, rasterio + geopandas + pillow per project CLAUDE.md) is present.

### 4.1 `process_aqueduct.py` (water-stress), re-runnable for NA: YES

- **Input:** the Aqueduct 4.0 file geodatabase at `data/raw/aqueduct-extract/Aqueduct40_waterrisk_download_Y2023M07D05/GDB/Aq40_Y2023D07M05.gdb`, layer `future_annual` (`process_aqueduct.py:13, 20–24`). **Verified present on disk** (`GDB EXISTS`). This GDB is **global**, only the read is bbox-limited.
- **Column:** `bau50_ws_x_s` (score) + `bau50_ws_x_l` (label) → renamed `score`/`label` (`:22, :41`).
- **Output:** `data/processed/water-stress.geojson` (`:14`). Current file 1.6 MB.
- **Parameterisation:** the extent is a module-level constant `EUROPE_BBOX = (-12.0, 35.0, 40.0, 72.0)` (`:16`), used in `gpd.read_file(bbox=…)` (`:23`), in `box(*EUROPE_BBOX)` clip (`:35–37`). It is **not** a CLI arg, it is hardcoded. So NA water-stress is produced by **changing that one constant to a North American bbox** (or, better for the "repeatable continent pattern," refactoring it to a CLI/param and writing per-continent output files). The mechanism (read GDB with bbox, simplify at tol 0.02, clip, rename, drop-NA, write GeoJSON with metadata) transfers cleanly. **NA is wider than EU (≈ -170 to -50 lng), expect a larger GeoJSON; the design's "lazy-load inactive continent" note matters here.** Output naming will collide (`water-stress.geojson`) unless parameterised, the plan should make output paths continent-suffixed (e.g. `water-stress.na.geojson`) and have `initMap` pick the file per `state.continent`.

### 4.2 `process_aqueduct_depletion.py` (water-depletion), re-runnable for NA: YES

Identical structure to 4.1. Columns `bau50_wd_x_s`/`bau50_wd_x_l` (`:29, :42`). Same hardcoded `EUROPE_BBOX` (`:24`), same GDB input, output `data/processed/water-depletion.geojson` (`:22`). Same re-run path: change bbox / parameterise, suffix output.

### 4.3 `process_vectors.py` (ecovillages + conflict), re-runnable for NA: PARTIAL / DIFFERENT INPUTS

- **`process_ecovillages()`** (`:32–89`): input `data/raw/ecovillages-osm-raw.json` (an Overpass extract), filters via `in_europe(lon,lat)` (`:41`), writes `data/processed/ecovillages.geojson`. **The raw OSM file is a Europe Overpass query** (`data/raw/overpass-query.txt` present). For NA, a **new Overpass query with a North American bounding box** must be run to produce a new raw JSON; then this function's bbox/filter re-pointed. So it is re-runnable in *mechanism* but needs a **new raw download**, not just a constant change. This is the regen-network map layer, important because it starts visible and is the framework's signature.
- **`process_conflict()`** (`:96–152`): input `data/raw/GEDEvent_v25_1.csv` (the **global** UCDP CSV, verified present), year filter 2015–2024, `in_europe()` filter (`:117`), writes `data/processed/conflict.geojson`. **The CSV is global**, so NA conflict is produced by **changing the bbox** (same as Aqueduct), no new download. Expect near-zero NA events (consistent with the criterion data).

### 4.4 `process_rasters.py`, NOT used at runtime (legacy)

Produces PNG overlays (`climate-trajectory.png`, `soil-carbon.png`, `population.png`) via rasterio. **The live map uses none of these**, they are the scrapped raster-overlay approach (project CLAUDE.md: "paradigm failed"). `climate-trajectory.png/.json` exist in `data/processed/` but are **explicitly excluded from deploy** (`.vercelignore`). **NA does not need this script.** Ignore for the build.

### 4.5 `data/processed/` contents & `.vercelignore`

`data/processed/` holds: `water-stress.geojson` (1.6 MB), `water-depletion.geojson` (1.6 MB), `conflict.geojson` (2.3 MB), `ecovillages.geojson` (12 KB), plus the unused `climate-trajectory.png` (68 KB) and `.json` (4 KB).

`.vercelignore` excludes from deploy: `.venv/`, `__pycache__/`, `*.pyc`, **`data/raw/`** (1.4 GB), `data/aqueduct-extract/`, **`scripts/`**, `*.bak`/`.*.bak`, `data/processed/climate-trajectory.png`, `data/processed/climate-trajectory.json`, **`public/`** (incl. `public/og.html`).

**Confirmed deploy/no-deploy split:**
- **DEPLOYS:** `index.html`, `deeper.html`, `src/`, `data/regions.js`, `data/processed/*.geojson` (the four real ones), `vendor/maplibre/`, root `og-*.png`, favicon, sitemap, robots, etc.
- **DOES NOT DEPLOY:** `scripts/`, `data/raw/`, `public/`, `.venv/`, `.bak` files, the legacy climate PNG/JSON. (`.vercel/` is gitignored.)

**Implication for NA:** new NA GeoJSONs go in `data/processed/` and will deploy. The Python scripts stay local (excluded). Total processed payload roughly doubles with NA water/depletion/conflict polygons, relevant to the design's map-performance / lazy-load risk (§7.4).

---

## 5. Dossier structure, `prototype/data/research-dossier/`

One directory per region (kebab-case id, **matches `region.id` exactly**, e.g. `south-tirol/`, `estonia-rural/`). 10 directories today.

**Each region has exactly 8 dimension files** (verified identical set across all 10 regions):
`accessibility.md`, `climate.md`, `energy.md`, `legal.md`, `regen.md`, `soil.md`, `stability.md`, `water.md`.

Mapping dossier dimension → criterion id (from `regions.js:103–113` header comment):
`climate.md`→climate, `water.md`→water_stress, `soil.md`→soil_carbon, `energy.md`→solar_pv, `stability.md`→conflict, `regen.md`→regen_network, `accessibility.md`→population. `forest_change` has **no dedicated dossier file** (covered qualitatively, values are dossier-informed best-effort, noted inline in `regions.js`). **`legal.md` is the 9th-criterion-less dimension**, it maps to no slider criterion; it is the dossier-only legal/economic context the framework keeps qualitative. This is exactly where the design says NA "earns its keep" (US/Canada/Québec/Mexico tenure differences), and the template for it already exists.

**Dossier file template** (from `alentejo/climate.md`, the per-region/per-dimension format NA must match):
- `# <Dimension>, <Region>, <Country>` heading.
- `**Headline finding:**` paragraph.
- `**Key data point (with vintage):**`, bold value + vintage (this is the line `regions.js` `value`/`vintage` are sourced from).
- `**Supporting facts:**`, bullet list.
- `**Practitioner-relevant nuance:**`, paragraph.
- `**Sources:**`, numbered list with URLs (the first becomes the cell's `source`/`sourceUrl`).

**What the NA build must add here:** 10 NA region directories × 8 dimension files = **80 new dossier files**, matching this exact template. These are the verification artifact the design's "verify against dossiers before shipping" gate reads. The `forest_change` value still has no dossier file (consistent with EU). Mexico/Oaxaca legal.md (ejido/RAN) is the highest-research-uncertainty file (design §7.2).

---

## 6. deeper.html (893 lines)

Static HTML, **does not import regions.js** (unlike index.html). All region/source content is **hand-authored inline**. Three places NA must extend:

### 6.1 Case studies (`deeper.html:457–~550`)
Three `<article class="case-study" id="<regionId>">` blocks, `alentejo` (`:462`), `connemara` (`:491`), `transylvania` (`:520`). Structure per case study:
```
<article class="case-study" id="…">
  <div class="case-head">
    <div class="country">Country · climate-tag</div>
    <h3 class="case-name">Name</h3>
    <p class="case-tag">one-line hook</p>
  </div>
  <div class="prose">
    <p>… 5 narrative paragraphs with inline <a> source links …</p>
    <p class="closing"><span class="closing-label">What this region asks of you</span> …</p>
  </div>
</article>
```
Intro line at `:459` names the three. **NA add:** the design's Batch-1 proof regions (Cascadia, Northern New Mexico, Oaxaca) are the natural NA case studies, new `<article>` blocks in the same format, plus a heading/intro that accounts for the second continent. This is hand-authored prose, not generated.

### 6.2 "Working toward" section (`deeper.html:640–~660`)
`:644` currently reads "covers ten European regions, and as of May 2026 all ten are live." This sentence is **Europe-specific and hardcoded**, must be revised for the NA expansion.

### 6.3 Bibliography grouped by dimension (`deeper.html:662–893`)
Heading `:662` "Every source cited in the dossier files, grouped by dimension." Intro `:664` explains the `Used for` tag. Structure: `<h3>Climate</h3>` (`:670`), `<h3>Water</h3>` (`:693`), etc., one group per dimension. Within each group: `<li><span class="src-name">…</span> <a href>…</a> <span class="used-for">Used for: …</span></li>`.
- Pan-continental datasets carry **`Used for: all ten regions`** (e.g. WorldClim `:672`, WRI Aqueduct `:695`). **These strings must become "all twenty regions" (or per-continent phrasing)** once NA ships.
- Region-specific national sources are listed individually with their region in `Used for:`. **NA adds:** new national sources (NOAA/NCA5, USGS, NRCS SSURGO, USFS FIA, NREL, FIC, US Census, StatCan, INEGI, RAN, CPTAQ, etc.) appended into the matching dimension `<h3>` groups, each with its NA `Used for:` regions.

**All deeper.html changes are manual HTML edits**, there is no data binding. This is content work, parallel to the dossiers, not engineering.

---

## CONTINENT-FILTER INSERTION POINTS, checklist (highest-value output)

Every place that must become continent-aware. Grouped by file. (`regionPasses`, `anyFilterActive`, `renderSourcesList`, and `process_rasters.py` are deliberately NOT here, they are continent-independent, see notes.)

**`src/main.js`:**
- [ ] `main.js:7–23`, add `state.continent` (default per design §7 open question).
- [ ] `main.js:220–223`, `center`/`zoom`/`minZoom`/`maxZoom` → from `CONTINENTS` config; switch re-centers map.
- [ ] `main.js:390`, `initMap` region-marker loop: only create/show active-continent markers (perf + correctness).
- [ ] `main.js:466`, `renderRegionGrid` `regions.forEach`.
- [ ] `main.js:536`, `renderCriterionCard` bar-rows `regions.forEach`.
- [ ] `main.js:589`, `renderSummaryTable` header `regions.forEach`.
- [ ] `main.js:606`, `renderSummaryTable` body cells `regions.forEach`.
- [ ] `main.js:650`, `refreshAll` recompute-passing loop (safe over all, but count must scope).
- [ ] `main.js:651`, `refreshAll` passing-COUNT `regions.filter` (feeds `#match-count`).
- [ ] `main.js:659`, `refreshAll` match-detail names `regions.filter`.
- [ ] `main.js:666`, `refreshAll` region-card update loop.
- [ ] `main.js:677`, `refreshAll` map-marker dim loop.
- [ ] `main.js:704`, `refreshAll` slider-hint pass-names `regions.filter`.
- [ ] `main.js:718`, `refreshAll` threshold-line-per-bar `regions.forEach`.
- [ ] `main.js:727`, `refreshAll` per-bar pass/fail `regions.forEach`.
- [ ] `main.js:740`, `refreshAll` summary-table fail-styling `regions.forEach`.
- [ ] `main.js:154–161`, `pickOgImagePath` `regions.filter(regionPasses)` (lower priority; OG-only).
- [ ] (architecture) boot sequence `main.js:1100–1110`, renderers are append-only / not idempotent; switch needs either re-render-with-clear or render-both-and-toggle. **Decision required in plan.**

**`index.html`:**
- [ ] `index.html:1499`, inline `<details>` builder `regions.forEach` (per-criterion per-region sources). **Easy to miss, not in main.js, not re-run by `refreshAll`.**
- [ ] `index.html:1495`, hardcoded "(10 regions)" label in the `<details>` summary.
- [ ] `index.html:1269`, hardcoded `<span id="match-count">10</span> of 10 regions match` (the "of 10" is static text; JS only updates the count span).
- [ ] `index.html:1247`, section heading "Ten European candidates, briefly named." (Europe-specific copy.)
- [ ] `index.html:1250–1256`, the `.map-wrap` / `.map-controls` block is where the **continent switcher UI** mounts (no element exists yet).

**`scripts/` (data, not render):**
- [ ] `process_aqueduct.py:16`, `EUROPE_BBOX` → NA bbox / parameterise; suffix output.
- [ ] `process_aqueduct_depletion.py:24`, `EUROPE_BBOX` → NA bbox / parameterise; suffix output.
- [ ] `process_vectors.py:20`, `EUROPE_BBOX` (used by both ecovillages + conflict); conflict re-runs from global CSV, ecovillages needs a **new NA Overpass raw download** first.

**`deeper.html` (content, not render):**
- [ ] `:459`, `:462/491/520`, case-study intro + 3 articles → add NA case studies.
- [ ] `:644`, "ten European regions … all ten are live" copy → revise for NA.
- [ ] `:664` and the `Used for: all ten regions` strings (e.g. `:672`, `:695`) → "twenty"/per-continent.
- [ ] `:670+` dimension `<h3>` groups → append NA national sources.

---

## Gotchas & integration risks

1. **Renderers are not idempotent.** `renderRegionGrid`/`renderCriteriaGrid`/`renderSummaryTable` `appendChild` without clearing. Re-running them on a continent switch duplicates DOM. The plan must pick: (a) render only active continent and re-render-with-clear on switch, or (b) render both continents once and toggle visibility. (b) is simpler to keep idempotent but doubles initial DOM (40 bar-rows × 8 criteria, 20 summary columns). The design leans toward filtering, that implies re-render-with-clear. **This is the single biggest architecture decision and the design doc under-specifies it.**

2. **The index.html inline `<details>` script is a hidden insertion point.** It imports the data independently of main.js, runs once via `requestAnimationFrame`, and is never touched by `refreshAll`. A continent switch won't update it unless explicitly wired. It also hardcodes "(10 regions)".

3. **Two more map layers are Europe-clipped than the design admits.** Design §5 flags only water-stress + water-depletion. `conflict.geojson` AND `ecovillages.geojson` are also Europe-clipped (`process_vectors.py`). Over NA they render empty. Conflict-empty is defensible (NA ≈ 0 events, honest). **Ecovillage-empty is a real gap**, it is the framework's signature layer and starts visible (`state.mapLayers['regen-network'] = true`). Producing NA ecovillage points needs a **new Overpass query + raw download**, the only NA map-data task beyond a bbox change.

4. **GeoJSON output filename collisions.** All processed files use fixed names (`water-stress.geojson` etc.). Re-running scripts with an NA bbox would overwrite the EU files. The plan must parameterise output paths (continent suffix) and have `initMap` choose the source per `state.continent`, and lazy-load the inactive continent's polygons (design §7.4) given the payload roughly doubles.

5. **Criterion ranges are EU-tuned.** `solar_pv` max = 2000 kWh/kWp/yr; arid Northern New Mexico can hit ~2100+. `climate` max = 25°C; Oaxaca tropical-highland mean could approach or exceed it. `population` max = 200 p/km². If an NA value exceeds a `rangeMax`, `normalize()` clamps the bar to 100% and the slider can't express it. **Not a structural change, a per-criterion range review against NA values.** Criteria are global, so widening a range affects EU bars too (re-normalises them), verify EU rendering stays sensible.

6. **`coords` is `[lng, lat]` (GeoJSON order), lng-first.** NA region coords must follow (negative longitudes for the Americas). Easy to flip; markers would land in Asia/Pacific if reversed.

7. **`region.id` must match the dossier dir name AND the `values` key AND any deeper.html `id`.** Three-way consistency (plus `REGIONS_WITH_OG_VARIANT` if OG variants are made). A typo silently breaks `values[r.id][critId]` → runtime error in `regionPasses` (`values[regionId][crit.id]` would throw on undefined). The data layer has no schema validation, a missing NA cell crashes `refreshAll` for that region.

8. **`renderSourcesList` (sources footer) shows only criterion-level sources** (8 global datasets), deduped. It is continent-independent and needs no change, but it also means the footer source list will NOT reflect NA national sources; those only appear in the index.html `<details>` and deeper.html bibliography. Consistent with current behaviour; just don't expect the footer to grow.

9. **The Aqueduct GDB is present and global** (`GDB EXISTS`, verified), so water-stress/depletion NA reprocessing has its input on disk already; no re-download needed. The UCDP CSV is also global and present. Only the OSM/Overpass ecovillage extract is Europe-scoped and needs a fresh NA pull.

10. **Stale top-level doc.** `land-selection-framework/CLAUDE.md` says the prototype compares "4 European candidates" and "Adding a new region: add to the regions and values arrays." The "4" is wrong (it's 10); the add-a-region instruction is still accurate and is exactly the NA data path, but the renderer "will pick it up" claim is only true within one continent once filtering lands (it will pick it up but show it under whichever continent the region is tagged).
