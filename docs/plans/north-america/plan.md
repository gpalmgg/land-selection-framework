# North America Expansion, Plan (Architecture & Milestones)

**Goal:** Add North America as a second continent at full data + map parity with Europe, built as a repeatable continent pattern, shipping regions only when their data is sourced and verified.

Inputs: `design.md` (validated design), `research.md` (codebase findings, exact insertion points).

## Architecture decision (chosen)

**Render-both-and-toggle, not clear-and-rerender.** Research found the renderers are append-only / not idempotent. Rather than retrofit DOM-clearing into 12 render points (risky), we render **all** regions once (as today), tag each rendered node with its `data-continent`, and the continent switcher toggles visibility via a body/class scope (`body[data-continent="north-america"]` shows NA nodes, hides EU). 

- **Why:** minimal change to proven render code; thresholds/map/filter state stay alive across switches for free; idempotent by construction. 
- **Trade-off:** both sets live in the DOM (20 regions). Negligible for a static page this size.
- **Map markers** are the exception (MapLibre markers aren't CSS-scoped by our body class), markers get added for all regions but shown/hidden via marker-element class toggle on switch, and the map `flyTo` re-centers per continent.
- **Rejected:** clear-and-rerender (touches every render fn, easy to introduce duplicate-DOM bugs); separate NA page (breaks "one site, switch continents", duplicates chrome).

## Continent config (the "whole world" seam)

```js
const CONTINENTS = {
  'europe':        { label: 'Europe',       center: [3, 48],   zoom: 4.0, default: true },
  'north-america': { label: 'North America', center: [-100, 45], zoom: 3.2 },
  // continent #3 = one more entry + verified data. No engine change.
};
let activeContinent = 'europe';
```

## Files to create / modify (exact)

**Create:**
- `prototype/data/research-dossier/<na-region-id>/{climate,water,soil,energy,stability,regen,accessibility,legal}.md`, 10 regions × 8 = 80 dossier files.
- `prototype/data/processed/water-stress-na.geojson`, `water-depletion-na.geojson`, `conflict-na.geojson`, `ecovillages-na.geojson`, NA map layers (suffixed to avoid colliding with EU outputs).
- `prototype/scripts/fetch_ecovillages_na.py`, Overpass query for NA intentional-community/permaculture POIs (the one new raw pull).

**Modify:**
- `prototype/data/regions.js`, add `continent` to all 10 EU regions (`'europe'`); add 10 NA region objects + their `values` blocks (added per batch as verified).
- `prototype/src/main.js`, `state.continent` (`:7`); `CONTINENTS` config + map params (`:220–223`); continent-tag every render output + marker (`:390, :466, :536, :589, :606`); continent-scope `refreshAll` loops (`:650–740`); `pickOgImagePath` (`:154`); add `initContinentSwitcher()`; layer visibility scoped per continent in `initMap`/`renderMapToggles`.
- `prototype/index.html`, switcher mount at `.map-wrap` (`:1250`); fix inline `<details>` builder (`:1499`) + hardcoded counts (`:1495`, `:1269`) to be continent-aware; switcher CSS.
- `prototype/scripts/process_aqueduct.py`, `process_aqueduct_depletion.py`, `process_vectors.py`, parameterise `EUROPE_BBOX` → bbox arg; add NA bbox; suffix outputs per continent.
- `prototype/deeper.html`, NA bibliography "Used for" coverage + counts (`:644`); NA case studies (later batch).

## Milestones (~30-min chunks; data milestones are research-bound, longer)

- **M0, Scaffold (engineering):** continent field on EU regions; `CONTINENTS` config; `initContinentSwitcher`; continent-tag + scope all render points + markers; map recenter on switch. Ships EU-only-visible (no visitor-facing change). *Verify: switcher present, EU still works identically, no NA yet.*
- **M1, NA map layers:** parameterise scripts; re-run water+conflict for NA bbox; new ecovillage Overpass pull; wire NA layer sources, continent-scoped visibility. *Verify: NA view shows ecovillage markers + water polygons; EU view unchanged.*
- **M2, Data batch 1 (3 regions):** Cascadia, N. New Mexico, Oaxaca, dossiers → values → verified → live.
- **M3, Data batch 2 (4 regions):** Vermont, S. Appalachians, Driftless, Ozarks.
- **M4, Data batch 3 (3 regions):** Nova Scotia, Kootenays, Québec Eastern Townships.
- **M5, deeper.html NA coverage** + final counts/copy reconciliation.

## Does NOT include
- Live data-ingestion pipeline (that's the honest "V2" build, unrelated).
- Per-region OG share cards for NA (single og.png stands).
- New criteria (the 8 are global and unchanged).
- Resolving Adam-vs-Askja composite/weighting tensions (deferred V2).
- Continents beyond NA (the config seam makes #3 cheap, but it's out of scope here).

## Verification per milestone
Each data batch: every cell has value+unit+vintage+source+sourceUrl; Gustaf/Collective verifies against dossiers before the region's `continent:'north-america'` block goes live. Engineering milestones: local server + Playwright check (EU unchanged, NA renders, switch works, mobile clean) before deploy.
