# V1 Data Priorities & Scope (PROPOSAL)

**Produced:** 2026-05-28, r4 round. Implements Spec Step 5 (prioritization) + Step 8 (V1 scope lock) as a reversible proposal for group ratification.

---

## Priority list (by priority score AND verified gettability)

1. **Per-region legal.md dossiers (compiled)** — legal_ownership (priority **25**, ingested 20/20 jurisdictions; carries red-line collective-ownership-legality underlying data)
2. **Per-region dossiers + national ag-ministry data** — land_cost (priority **20**, ingested 20/20 jurisdictions; 17 high / 2 medium / 1 low data_confidence; honest sparsity surfaced)
3. **WRI Aqueduct 4.0** — water_stress + water_depletion (priority 20, ingested EU+NA)
4. **UCDP GED v25.1** — conflict (priority 20, ingested EU+NA)
5. **Hansen/GFW v1.11** — forest_change (priority 20, ingested as tiles)
6. **OSM/GEN** — regen_network (priority 16, ingested, patchy)
7. **OSM/Overpass amenity=hospital** — hospital_proximity (priority 16, ingested EU+NA; 50 km geodesic proxy for 60-min red line, true isochrones deferred to V2)
8. **Per-region dossiers + national statistical agencies** — demographic_trajectory (priority 16; population trend + median age + migration + density per region; Spec Step 1 gap-candidate delivered)
9. **Per-region dossiers (legal/water)** — water_source_control (priority 20; water-rights regime + holder type + control risk; carries red-line single-entity-water-control underlying data)
10. **Per-region dossiers (thin by design)** — soil_contamination (priority 12; regulatory regime + known signals per region; carries red-line soil-contamination underlying data; heavy on honest 'unknown' where dossiers were silent)
11. **Per-region climate.md dossiers + national climate-projection sources** — climate_buffering (priority 20; state + trajectory: primary buffering features + buffering strength + trajectory_under_warming; closes Overview decision 8.1's explicit gap; all 20 data_confidence=high)
12. *(blocked)* WorldClim CMIP6 / Global Solar Atlas / SoilGrids / GHSL — high relevance, **low gettability on this connection (raster wall)**; deferred to V2 or an alternate bulk-fetch path.

## Proposed V1 scope lock
**Geographic scope:** Europe + North America (NA proved as tractable as EU in the demo — evidence for the Overview's emergent-scope decision; do not revert to Europe-only).

**Criteria through full V1 processing (metadata-complete, exportable):**
- legal_ownership ✅ (per-jurisdiction, 20/20; carries red-line collective-ownership)
- land_cost ✅ (per-jurisdiction, 20/20; data_confidence surfaces sparsity)
- hospital_proximity ✅ (per-jurisdiction, 20/20; carries red-line hospital-60-min via 50 km geodesic proxy)
- demographic_trajectory ✅ (per-jurisdiction, 20/20; Spec Step 1 gap-candidate delivered)
- soil_contamination ✅ (per-jurisdiction, 20/20; carries red-line soil-contamination; thin by design with honest 'unknown' for V2 deepening)
- water_source_control ✅ (per-jurisdiction, 20/20; carries red-line single-entity-water-control)
- climate_buffering ✅ (per-jurisdiction, 20/20, all high-confidence; closes Overview decision 8.1's explicit gap)
- water_stress ✅ (areal)
- water_depletion ✅ (areal)
- conflict ✅ (presence; carries red-line active-conflict)
- regen_network ✅ (presence; with documented coverage limitation)
- forest_change ✅ (tile-served)

That is **12 criteria fully processed across 2 continents** — clears the illustrative ship gate (≥3 criteria) by a wide margin, covers all three completeness modes (areal, presence, per-jurisdiction), **ingests all 6 red-line underlying datasets** the Overview decision 9 names, and **closes Overview decision 8.1's named climate-buffering features gap**. The four Tier-2 criteria (climate-as-temperature, soil_carbon, solar_pv, population) stay as curated demonstration values, **explicitly not counted as ingested V1 coverage**, pending a raster-fetch path (V2).

**Proposed ship-gate refinement (r4 Finding 5):** adopt the three-way completeness measure (areal / presence / per-jurisdiction) from `coverage-report.md` rather than a single areal %.

---

## What this proposal asks the group to ratify
1. Accept EU+NA (not Europe-only) as the V1 scope.
2. Accept the **11 Tier-1 criteria** as the V1 processed set; ship gate met by a wide margin.
3. Accept the Tier-1/Tier-2 honesty line (curated values ≠ ingested coverage).
4. Adopt as first-class criteria: `legal_ownership`, `land_cost`, `hospital_proximity`, `demographic_trajectory`, `soil_contamination`, `water_source_control` — the per-jurisdiction batch this round delivered, plus the existing Tier-1 layers.
5. Adopt the refined three-way ship-gate metric (areal / presence / per-jurisdiction).
6. Accept the `data_confidence` honesty pattern (per-feature high/medium/low) and the **proxy-vs-true-metric** pattern (e.g. hospital_proximity ships a 50 km geodesic proxy for the 60-min isochrone, caveat recorded per-feature; V2 to refine).
7. Note: **all 6 red-line underlying datasets from Overview decision 9 are now ingested** (active-conflict, water-deficit, collective-ownership, hospital-60-min-proxy, soil-contamination, single-entity-water-control). The Overview's red-line filtering logic (V2) has its data foundation in place.

Per the propose-and-proceed rule, this stands as the working V1 scope unless the group objects within the response window; it is documented and reversible.
