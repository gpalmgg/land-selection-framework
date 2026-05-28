# North America, and the path to a global framework, Design

**Status:** validated design (brainstorm output). Next: `/deep-plan` → plan.md + prd.md + build-spec.md.
**Date:** 2026-05-26
**Owner framing:** "Just as we have data and the live map for Europe, I want that for North America too, alongside. Eventually we'll do the whole world."

---

## 1. Goal

Bring **North America to full parity with Europe**: ten candidate regions, each with the same 8-criterion sourced dataset and the same live map treatment, presented **alongside** the European set (not replacing it). Build it as the **second instance of a repeatable continent pattern**, so adding continent #3 is a data exercise, not an engineering one.

**Non-negotiable (carried from the audit):** every value is real and sourced, `value + unit + vintage + source + sourceUrl` per cell. No placeholder data ships. Ten regions are sourced and **shipped in verified batches**, never as ten thin rows. Data-honesty is the site's entire credibility.

## 2. Approved region slate (10)

| # | Region | Country | The "different story" |
|---|---|---|---|
| 1 | Cascadia (W. Oregon/Washington) | US | Temperate-maritime, high rainfall, dense regen network, high land cost |
| 2 | Vermont / Upper New England | US | Cold continental, deep back-to-land culture, strong town/legal structure |
| 3 | Southern Appalachians (W. North Carolina) | US | Humid highland, biodiversity hotspot, fast-growing regen scene |
| 4 | Driftless Area (SW Wisconsin) | US | Unglaciated, organic/CSA heartland, affordable, cold |
| 5 | Ozarks (Arkansas/Missouri) | US | Cheapest land, off-grid/homestead culture, sparse regen institutions |
| 6 | Northern New Mexico (Taos) | US | Arid, water-stressed, high solar, deep earthship/permaculture history |
| 7 | Nova Scotia / Cape Breton | Canada | Cool maritime, affordable, immigration-friendly |
| 8 | BC Interior, Kootenays | Canada | Mountainous, historic intentional-community legacy, higher cost |
| 9 | Quebec, Eastern Townships | Canada | Distinct legal/language regime (civil law, CPTAQ land protection) |
| 10 | Oaxaca highlands | Mexico | Indigenous *ejido* land tenure, biodiversity, radically different legal story |

Spans: climate (arid SW → maritime PNW → cold NE), land cost (Ozarks → Cascadia), legal regimes (US → Canada → Québec civil law → Mexican ejido), regen density (Vermont/Cascadia-dense → Ozarks-sparse). Selection is a draft proposal; if The Collective revisits region choice, swap here.

## 3. Architecture, three separable components

### 3.1 Continent-aware data model (small, one-time)
- Add `continent: 'europe' | 'north-america'` to each region object in `prototype/data/regions.js`. Existing EU regions get `continent: 'europe'`.
- Everything else about the region/criteria/values shape is **unchanged**, same `values[regionId][critId] = { value, unit, vintage, label, source, sourceUrl }`, same 8 criteria (climate, water_stress, soil_carbon, forest_change, solar_pv, conflict, regen_network, population) with their `askjaNumber`s and ranges. The criteria are global; only per-region values are added.
- Renderers (`renderRegionGrid`, `renderCriteriaGrid` bars, `renderSummaryTable`, map markers, `renderSourcesList`) filter by the **active continent**. This is the only logic change: a `state.continent` filter applied where they currently iterate all `regions`.

### 3.2 Continent switcher + continent-aware map (small, one-time)
- A **continent switcher** (Europe / North America tabs) near the top of the regions section. Switching sets `state.continent`, re-filters the region grid / criteria bars / summary table, and **re-centers + re-zooms the map** to that continent's bounds.
- Map becomes continent-parameterised: a small `CONTINENTS` config (`{ europe: {center, zoom, bounds}, 'north-america': {center:[-100,45], zoom:3.2, bounds}... }`). Adding continent #3 = one config entry + one tab + its data. This is the "whole world" payoff.
- Threshold filter state is shared across continents (a threshold is a criterion preference, not continent-specific), switching continents keeps the user's thresholds and re-applies them. Confirm in plan.
- Default continent: open question (visitor geo? Europe as today? a combined default?), see §7.

### 3.3 Data research → verify → ship pipeline (the marathon)
- **Research:** one sourcing pass per region across all 8 criteria, drawn from the same **global datasets** Europe uses, plus region-appropriate **national sources** for dossier depth. Parallelisable, a research agent per region producing a structured dossier (the `prototype/data/research-dossier/<region>/<dimension>.md` pattern already exists for Europe).
- **Compile:** I convert verified dossiers into the `regions.js` value block + the deeper.html dossier/bibliography entries.
- **Verify:** Gustaf / The Collective verifies each batch's values against the dossiers **before it goes live**. Nothing ships unverified.
- **Batch shipping** (see §6) so the live site is always fully-sourced for whatever regions are visible.

## 4. Data sourcing approach (per criterion, North America)

All 8 criteria use globally-available primary sources (same as EU), so the framework transfers cleanly. National sources add dossier richness.

| Criterion | Primary (global) source | NA value derivation | National depth sources |
|---|---|---|---|
| Climate trajectory | WorldClim CMIP6, SSP2-4.5, 2041–2060 mean annual T | sample at region centroid/area | US: NOAA/NCA5; CA: ClimateData.ca; MX: Conagua |
| Water stress | WRI Aqueduct 4.0, 2050 BAU | basin value for region | USGS; Canada FFWS; Conagua |
| Soil organic carbon | SoilGrids 2.0 (ISRIC) | topsoil SOC g/kg | USDA NRCS SSURGO; Canada SLC; INEGI |
| Forest-cover trajectory | Hansen GFC v1.11 (GFW) | tree-cover trend 2001–2023 | USFS FIA; NRCan; CONAFOR |
| Solar PV potential | Global Solar Atlas v2.7 | kWh/kWp/yr | US: NREL NSRDB; CA: CanmetENERGY |
| Conflict proximity | UCDP GED v24.1 | events within ~200 km (likely 0 across NA, factually correct, as with EU) | n/a |
| Regen-network density | GEN directory + OpenStreetMap | intentional-community/permaculture sites within ~100 km | FIC (US ic.org directory); regional networks |
| Population density | JRC GHSL POP | persons/km² regional avg | US Census; StatCan; INEGI |

**Legal & economic context** stays **dossier-only / qualitative** (per the existing framework decision, it is not a slider). NA is where this earns its keep: land prices (USDA NASS land values; Canada FCC; Mexico INEGI), and **foreign-ownership / tenure rules that genuinely differ**, US (largely open, some state ag-land limits), Canada (provincial restrictions, e.g. PEI/Saskatchewan/CPTAQ in Québec), Mexico (restricted zone within ~100 km of border / 50 km of coast → *fideicomiso* trust; **ejido** communal land). This is real decision-relevant content for the case studies.

## 5. Map layers for North America

Most existing layers are already global and need **no new processing**:
- ✅ Forest loss (GFW XYZ tiles, global), Conflict density (UCDP, global), Ecovillage sites (GEN/OSM, global), Terrain relief / Topographic / Satellite / Night-lights (global tile services).
- ⚠️ **Water stress 2050 / Water depletion 2050** are *processed GeoJSONs* (Europe-clipped, via the existing Python Aqueduct script in `prototype/scripts/`). NA needs the same script re-run with a North American bounding box → new GeoJSONs. This is the one non-trivial map-data task. Fallback if it slips: rely on the global tile layers + the per-region water values (the criterion data) and add the NA water polygons in a later batch.

## 6. Build staging (batches, verify before each ships)

- **Batch 0, engineering scaffold:** continent field in data model + continent switcher + continent-parameterised map. Ships with EU only visible (no behaviour change for current visitors). Low risk, enables everything.
- **Batch 1, proof (3 regions):** Cascadia, Northern New Mexico, Oaxaca (max criteria-spread + the hard legal cases). Full dossiers → verified → live. Proves the pattern end-to-end.
- **Batch 2, (4 regions):** Vermont, Southern Appalachians, Driftless, Ozarks.
- **Batch 3, (3 regions):** Nova Scotia, Kootenays, Québec Eastern Townships.
- **Batch 4, NA water GeoJSON layers** (if not folded earlier).

## 7. Risks & open questions (for the plan to resolve)

1. **Default continent / first impression**, show Europe (status quo), detect visitor region, or a combined landing? Affects the high-traffic first impression.
2. **Oaxaca/Mexico data depth**, some national datasets (INEGI, ejido/RAN) are less uniform than US/Canada; verify sourcing is achievable before committing Oaxaca, or hold it as the last batch.
3. **Verification throughput**, 80 cells is a real review load on Gustaf/The Collective; batching is the mitigation, but confirm capacity.
4. **Map performance** with 20 markers + processed layers across two continents; lazy-load inactive continent's heavy layers.
5. **Region selection governance**, slate is a proposal; confirm whether The Collective ratifies region choice (we just reframed the site around the group).
6. **Summary table**, per-continent (cleaner) vs all-regions (longer, cross-continent comparison)? Lean per-continent.

## 8. Framework discipline (unchanged, applies to NA)

No composite scoring; no weighting; native units; state+trajectory per criterion; source+vintage on every value; threshold sliders filter (never score); legal & economic is dossier-only qualitative context, not a criterion.

## 9. Success criteria

- 10 NA regions live, each with all 8 criteria sourced (`value+unit+vintage+source+sourceUrl`), verified against dossiers, **zero placeholder cells** (the audit's standard).
- Continent switcher works; map re-centres; thresholds persist across continents; mobile clean.
- deeper.html gains NA dossier/bibliography coverage; framework discipline intact.
- Adding continent #3 requires only: a `CONTINENTS` entry + a tab + that continent's verified data, **no renderer or map-engine changes.** (The portability test.)

## 10. The portable pattern (why this matters beyond NA)

The durable artifact here is **not the NA regions, it's the continent-addition flow**: `pick regions → research the 8 global criteria + national depth → structured dossier → verified values into a continent-tagged data block → renders through an unchanged, continent-filtered UI`. That pattern is what makes "eventually the whole world" a content cadence instead of a rebuild. Document it as such; the regions are instances, the pattern is the asset.
