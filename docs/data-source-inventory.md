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
| Anti-collective-ownership law | collective-ownership legality, per jurisdiction | per-region `legal.md` dossiers | 🟡 gettable now (qualitative) — **Phase 4 formalization target** |
| No hospital within 60 min | hospital-proximity isochrones | JRC Global Accessibility Map / OSM | ❌ not yet — **Phase 4 target (favor OSM-derived; JRC raster is heavy)** |
| Soil contamination needing 5+ yr remediation | contamination registers | national registers | ❌ not yet — qualitative/per-jurisdiction, Phase 4+ |
| Single-entity water control | water-rights concentration | per-region (qualitative) | ❌ not yet — likely V2 |

---

## The data-wall lesson (empirical, for Step 4 + V2)
Sources fetched cleanly: **vector/event data (UCDP CSV), basin polygons (Aqueduct GDB extract), point data (Overpass API), and XYZ tile services (GFW).** Sources that hit the wall: **large global rasters (WorldClim CMIP6, SoilGrids, GHSL)** truncated/failed on this connection. Practical Step-4 rule: **prioritize vector/API/tile/extract sources; treat heavy global rasters as low-gettability until a reliable bulk-fetch path exists.** This reorders the priority list independent of relevance.

---

## Priority list seed (→ `v1-data-priorities.md`)
Top by priority score **and** verified gettability: Aqueduct (water ×2), UCDP (conflict), GFW (forest), OSM/GEN (regen network). These five are the realistic V1 processed set today. Climate/solar/soil/population are high-relevance but blocked on the raster wall — V2 or an alternate fetch path. The two r4-proposed criteria (legal_ownership, land_cost) are per-jurisdiction qualitative and bypass the raster wall entirely — `legal_ownership` is partially gettable now.
