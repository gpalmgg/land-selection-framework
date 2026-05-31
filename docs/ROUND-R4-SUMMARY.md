# Round r4 — Summary

**Delivered:** 2026-05-29 (placed into source-docs); fact-check + readiness pass: 2026-05-31.
**Contributor:** @Gustaf (practitioner reality-check seat).
**State:** propose-and-proceed under the 5-working-day default response window. The V1 ship-candidate at [`v1-ship-candidate.md`](v1-ship-candidate.md) stands as the working V1 unless the group objects.

---

## In 60 seconds

r4 turned the prototype demonstration into a real V1 production run + a public reach layer.

- **12 Tier-1 ingested V1 layers** across 20 regions (10 EU, 10 North America). Each layer has a metadata sidecar, a GeoPackage export, and per-jurisdiction `data_confidence` where evidence is uneven.
- **All 6 red-line underlying datasets named in Overview decision 9 are now ingested** (active-conflict, water-deficit-2050, collective-ownership, hospital-60-min via geodesic proxy, soil-contamination, single-entity-water-control).
- **Overview decision 8.1's named "climate-buffering features" gap is closed** as a structured per-jurisdiction layer.
- **r4 commentary placed** into all three source-docs as attributed `## r4 Commentary` sections; nothing overwrites `[COMMITTED]` decisions.
- **The Handoff Request block in `Land Project v1 r4 Overview.md` is now `r4 → r5`** with per-contributor specific asks for Adam, Askja, Deca, Monty, Alaska.
- **Public reach layer live** at https://land-selection-framework.vercel.app — 20 indexable per-region pages, dynamic OG share cards, dashboard with both threshold sliders and qualitative-filter dropdowns wired to the same V1 data.

---

## The 12 Tier-1 layers (and what's in them)

| Layer | Askja # | Mode | Source | What it tells you |
|---|---|---|---|---|
| water_stress | #4 | areal (basin polygons) | WRI Aqueduct 4.0 | demand-to-supply ratio per HydroBASINS L6, 2050 BAU projection |
| water_depletion | #4 | areal | WRI Aqueduct 4.0 | drawdown rate signal (distinct from stress) |
| forest_change | #5 / #11 | areal (XYZ tiles) | Hansen GFC v1.11 / GFW | tree-cover loss 2001-2023, served live |
| conflict | #1 | presence (event points) | UCDP GED v25.1 | observed fatal political-violence events 2015-2024 |
| regen_network | #3 | presence (points) | OSM via Overpass + GEN | intentional-community / permaculture / ecovillage sites |
| **legal_ownership** | **#10 (r4-promoted to first-class gate)** | per-jurisdiction | dossier compile | foreign-ownership rule + collective-form path + multi-household residence + planning gate + regulatory direction |
| **land_cost** | **#10 (r4-new, split out)** | per-jurisdiction | dossier + national ag-ministry data | price range + currency + vintage + affordability band + appreciation trajectory |
| hospital_proximity | #9 | per-jurisdiction | OSM Overpass + haversine | nearest hospital km + counts within 50/100 km (50 km geodesic proxy for the 60-min red line) |
| demographic_trajectory | #1 (Spec Step 1 gap-candidate) | per-jurisdiction | dossier + national stats | population trend + median age + migration + rural density |
| soil_contamination | #5 | per-jurisdiction (thin by design) | dossier compile | regulatory regime + known signals + due-diligence burden |
| water_source_control | #4 | per-jurisdiction | dossier compile | rights regime + holder type + single-entity control risk + drought-priority mechanism |
| **climate_buffering** | **#2 (closes Overview 8.1)** | per-jurisdiction | dossier + national climate-projection sources | primary buffering features + altitude + strength + trajectory under warming |

---

## What the data revealed (a few decision-relevant signals)

- **Only 1 of 20 regions** allows multi-household residence as-of-right (Ozarks). The legal/ownership gate is the framework's biggest blind spot when buried under #10.
- **7 of 20 regions are in *tightening* regulatory direction; zero are loosening.** Directional signal: getting harder, not easier.
- **15 of 20 land prices are rising or rising_fast.** Affordability erosion is the rule.
- **5 very_high + 5 high climate buffering** (Connemara, Oaxaca Sierra Norte, South Tirol, Asturias, Nova Scotia at the top); **2 very_low** (Alentejo, Saxony-Anhalt) — both also flagged "worsening trajectory."
- **All 20 regions pass the 50 km hospital proxy** for the 60-min red line, but centroid placement skews "closest" rankings toward regional hub cities (see hospital-proximity metadata caveat) — geodesic distance is technically accurate, real rural-settlement remoteness is materially higher in regions like Oaxaca's Sierra Norte, Cape Breton, the Ozark backcountry, and the Kootenays' Class-5 valleys.

---

## Three methodology refinements proposed (for group ratification at r5)

1. **Tier-1 / Tier-2 honesty line** — curated/demonstration values never count as ingested coverage; only Tier-1 real ingestion clears the ship gate. The four blocked raster criteria (climate-as-temperature CMIP6, soil_carbon SoilGrids, solar_pv Global Solar Atlas, population GHSL) remain Tier-2 in V1, deferred to V2 or an alternate bulk-fetch path.
2. **Three-way completeness ship-gate metric** (areal / presence / per-jurisdiction) — replaces the single areal % which structurally under-prioritises legal-type criteria.
3. **Filtering / scoring split** — threshold-filtering (pass/fail, no weights, no composite) is safe and high-value and can ship earlier than V2's full query layer; composite scoring + weighting stays deferred and contested.

Plus five pattern adoptions documented in [`v1-shipped.md`](v1-shipped.md): `data_confidence` per-feature, proxy-vs-true-metric honesty (e.g. 50 km geodesic for 60-min isochrone), LLM-assisted extraction with human-verifiable JSON intermediate (Spec Step 4 explicitly allows), regional dossier as a Step-4 sub-deliverable, and the public-demonstration as an explicit V1/V2 dual track.

---

## What's NOT done (honest)

- **Manual QGIS eyeball** on the 12 layers is still owed (Spec Step 10 sanity check, only a human in front of QGIS can do it).
- **Four Tier-2 raster criteria** (climate-as-temperature, soil_carbon, solar_pv, population) stay blocked on the data-fetch wall; they live as curated values for demonstration but are explicitly NOT counted toward V1 coverage.
- **Group ratification** of the V1 ship-candidate, the criteria additions, and the methodology refinements is what r5 is for.

---

## Where to read more

| You want | Read |
|---|---|
| The formal proposal to ratify V1 | [`v1-ship-candidate.md`](v1-ship-candidate.md) |
| The full r4 commentary on the framework | `source-docs/Land Project v1 r4 Overview.md`, `Specifications.md`, `Implementation Strategy.md` (the `## r4 Commentary` sections) |
| What's in the V1 set + sources | [`criteria-inventory.md`](criteria-inventory.md) + [`data-source-inventory.md`](data-source-inventory.md) |
| Coverage measured against the three-way metric | [`coverage-report.md`](coverage-report.md) |
| What's verified vs what still needs eyes | [`v1-verification-notes.md`](v1-verification-notes.md) |
| Lessons-learned for V2 | [`v1-shipped.md`](v1-shipped.md) |
| How to pick up r5 | [`../CONTRIBUTING.md`](../CONTRIBUTING.md) |
