# Data Source Inventory (V1)

**Produced:** 2026-05-28, r4 round. Formalizes the sources used in the demonstration build into the Spec's scoring schema.
**Status:** PROPOSAL (propose-and-proceed; reversible; awaiting ratification).
**Scoring:** Priority = **relevance (1-5) × gettability (1-5)**. Coverage is a separate gate (must clear ship-gate threshold; not multiplied in), per Spec.
**Key value:** the sources marked **[verified by use]** were not just desk-scored — they were actually fetched and processed in the demonstration build, so their gettability scores are empirical, not estimated. This is exactly what Spec Step 4 asks for.

---

## Scored sources

| Source | Criterion | Rel | Get | Priority | Coverage | Vintage | Native unit | License | Status |
|--------|-----------|-----|-----|----------|----------|---------|-------------|---------|--------|
| **WRI Aqueduct 4.0** | water_stress, water_depletion | 5 | 4 | **20** | global (HydroBASINS L6); EU+NA processed | 2023 release, 2050 BAU | HydroBASINS L6 | CC BY 4.0 | **[verified by use]** — ingested EU+NA |
| **UCDP GED v25.1** | conflict | 4 | 5 | **20** | global; EU 14,546 / NA 16,333 events | events 2015-2024 | event points | CC BY 4.0 | **[verified by use]** — ingested EU+NA |
| **Hansen GFC v1.11 / GFW** | forest_change | 4 | 5 | **20** | global 30 m | 2001-2023 | 30 m raster | CC BY 4.0 | **[verified by use]** — served as XYZ tiles |
| **OpenStreetMap / GEN (Overpass)** | regen_network | 4 | 4 | **16** | patchy (volunteer-tagged); EU 30 / NA 76 sites | current OSM snapshot | point locations | ODbL 1.0 | **[verified by use]** — ingested; coverage is a real limitation vs full GEN directory (300+) |
| **Per-region `legal.md` dossiers (compiled)** | legal_ownership | 5 | 5 | **25** | 20/20 in-scope jurisdictions (100%) | 2026-05 compilation | per-jurisdiction (point at centroid) | research-dossier internal; per-feature primary legal source carries its own license | **[verified by use]** — compiled via `scripts/compile_legal_ownership.py` into `data/processed/legal-ownership.geojson`; carries red-line underlying data for collective-ownership legality |
| **Per-region dossiers (legal/regen/accessibility) + national agriculture-ministry data (Eurostat, USDA NASS, FCC, MAPA, INS, CSO, SAFER)** | land_cost | 5 | 4 | **20** | 20/20 jurisdictions attempted; 17 high-confidence, 2 medium, 1 low | 2024 (most), 2023 (Estonia partial), 2024-2025 (Alentejo, N New Mexico), 2023-2024 (Nova Scotia) | per-jurisdiction (point at centroid) | research-dossier internal; underlying national stats are typically open | **[verified by use]** — compiled via `scripts/compile_land_cost.py` into `data/processed/land-cost.geojson`; data_confidence field surfaces sparsity per region |
| **OpenStreetMap / Overpass (amenity=hospital)** | hospital_proximity | 4 | 4 | **16** | 42,593 hospital points across EU+NA; 20/20 regions with nearest-distance + 50/100 km counts | current OSM snapshot (2026-05) | point locations + per-jurisdiction aggregate | ODbL 1.0 | **[verified by use]** — fetched via `scripts/fetch_hospitals.py` (Overpass, ~6 min), processed via `scripts/process_hospital_proximity.py` (haversine). HONEST PROXY: 50 km geodesic threshold stands in for the 60-min red line; true road-isochrones are V2 work. |
| **Per-region dossiers (accessibility/regen/stability/climate.md) + national statistical agencies (INE, ONS, INSEE, ASTAT, Destatis, US Census, Statistics Canada, INEGI)** | demographic_trajectory | 4 | 4 | **16** | 20/20 jurisdictions attempted; 13 high, 6 medium, 1 low data_confidence; honest 'unknown' where dossier didn't say | 2020-2024 census/agency vintages | per-jurisdiction (point at centroid) | research-dossier internal; underlying national stats open | **[verified by use]** — compiled via `scripts/compile_per_jurisdiction.py demographic-trajectory`. Delivers Spec Step 1 top-down review gap-candidate. |
| **Per-region dossiers (legal/water/soil.md); thin layer by design** | soil_contamination | 4 | 3 | **12** | 20/20 attempted; HEAVY on 'unknown' and 'low' — contamination wasn't a structured research focus, dossier surfaces only what was visible (Asturias mining, Driftless karst nitrate, Ozarks CAFO, etc.) | 2024-2025 dossier compilation | per-jurisdiction (point at centroid) | research-dossier internal | **[verified by use]** — compiled via `scripts/compile_per_jurisdiction.py soil-contamination`. Carries red-line underlying data; honest sparsity surfaced for V2 deepening (national registers: BASIAS/BASOL FR, BBodSchG DE, EPA Superfund US, etc.). |
| **Per-region dossiers (water/legal.md)** | water_source_control | 5 | 4 | **20** | 20/20 jurisdictions; rights regime + holder type + control risk per region | 2024-2025 dossier compilation | per-jurisdiction (point at centroid) | research-dossier internal; underlying statutes typically open | **[verified by use]** — compiled via `scripts/compile_per_jurisdiction.py water-source-control`. Carries red-line underlying data for single-entity water-source control. |
| WorldClim CMIP6 (SSP2-4.5) | climate | 5 | 3 | 15 | global ~18 km | 2041-2060 | ~18 km raster | WorldClim terms | curated values only — **raster fetch hit the data wall**; not ingested in V1 |
| Global Solar Atlas v2.7 | solar_pv | 5 | 3 | 15 | global ~1 km | 1999-2018 avg | ~1 km raster | CC BY 4.0 | curated values only; not ingested |
| SoilGrids 2.0 (ISRIC) | soil_carbon | 4 | 2 | 8 | global 250 m (very large) | 2020 | 250 m raster | CC BY 4.0 | curated values only; large-raster gettability low on this connection |
| JRC GHSL POP R2023A | population | 3 | 2 | 6 | global 1 km (very large) | 2030 proj | 1 km raster | Open (JRC) | curated values only; large-raster fetch hit the data wall |

---

## Red-line underlying data (Overview decision 9) — status

| Red line | Underlying data | Source | Status |
|----------|-----------------|--------|--------|
| Active conflict within 200 km | conflict event locations | UCDP GED v25.1 | ✅ ingested (EU+NA) |
| Water deficit by 2050 | water-stress/depletion projection | WRI Aqueduct 4.0 | ✅ ingested (EU+NA) |
| Anti-collective-ownership law | collective-ownership legality, per jurisdiction | per-region `legal.md` dossiers, compiled | ✅ **ingested** (Phase 4 done) — 20/20 jurisdictions in `legal-ownership.geojson` |
| No hospital within 60 minutes | hospital-proximity (proxied via 50 km geodesic) | OSM via Overpass, processed per region | ✅ **ingested as proxy** (Phase 4+ done) — 20/20 regions in `hospital-proximity.geojson`; true road-isochrones deferred to V2 |
| Soil contamination needing 5+ yr remediation | contamination regime + known signals per region | dossier compilation, thin layer | ✅ **ingested (thin)** — 20/20 in `soil-contamination.geojson`; honest sparsity, V2 to add national registers |
| Single-entity water control | water-rights regime + holder type + control risk | dossier compilation | ✅ **ingested** — 20/20 in `water-source-control.geojson`; 1 high-risk (Kootenays), 5 moderate, 14 low |

**All 6 red-line underlying datasets from Overview decision 9 now ingested.**

---

## The data-wall lesson (empirical, for Step 4 + V2)
Sources fetched cleanly: **vector/event data (UCDP CSV), basin polygons (Aqueduct GDB extract), point data (Overpass API), and XYZ tile services (GFW).** Sources that hit the wall: **large global rasters (WorldClim CMIP6, SoilGrids, GHSL)** truncated/failed on this connection. Practical Step-4 rule: **prioritize vector/API/tile/extract sources; treat heavy global rasters as low-gettability until a reliable bulk-fetch path exists.** This reorders the priority list independent of relevance.

---

## Priority list seed (→ `v1-data-priorities.md`)
Top by priority score **and** verified gettability: **legal_ownership (25)**, **water_source_control (20)**, **land_cost (20)**, Aqueduct (water ×2), UCDP (conflict), GFW (forest), OSM/GEN (regen network), **hospital_proximity (16)**, **demographic_trajectory (16)**, **soil_contamination (12 — thin by design)**. These **eleven** are the V1 processed set. Climate/solar/soil-organic-carbon/population are high-relevance but blocked on the raster wall — V2 or an alternate fetch path. **All 6 red-line underlying datasets ingested this round** (active-conflict, water-deficit, collective-ownership, hospital-60-min-proxy, soil-contamination, single-entity-water-control).
