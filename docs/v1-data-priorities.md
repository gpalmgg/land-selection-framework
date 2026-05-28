# V1 Data Priorities & Scope (PROPOSAL)

**Produced:** 2026-05-28, r4 round. Implements Spec Step 5 (prioritization) + Step 8 (V1 scope lock) as a reversible proposal for group ratification.

---

## Priority list (by priority score AND verified gettability)

1. **WRI Aqueduct 4.0** — water_stress + water_depletion (priority 20, ingested EU+NA)
2. **UCDP GED v25.1** — conflict (priority 20, ingested EU+NA)
3. **Hansen/GFW v1.11** — forest_change (priority 20, ingested as tiles)
4. **OSM/GEN** — regen_network (priority 16, ingested, patchy)
5. *(blocked)* WorldClim CMIP6 / Global Solar Atlas / SoilGrids / GHSL — high relevance, **low gettability on this connection (raster wall)**; deferred to V2 or an alternate bulk-fetch path.
6. *(r4-proposed, per-jurisdiction, bypasses the raster wall)* `legal_ownership` (partially gettable now via dossiers), `land_cost`.

## Proposed V1 scope lock
**Geographic scope:** Europe + North America (NA proved as tractable as EU in the demo — evidence for the Overview's emergent-scope decision; do not revert to Europe-only).

**Criteria through full V1 processing (metadata-complete, exportable):**
- water_stress ✅
- water_depletion ✅
- conflict ✅
- regen_network ✅ (with documented coverage limitation)
- forest_change ✅ (tile-served)

That is **5 criteria fully processed across 2 continents** — clears the illustrative ship gate (≥3 criteria). The four Tier-2 criteria (climate, soil_carbon, solar_pv, population) stay as curated demonstration values, **explicitly not counted as ingested V1 coverage**, pending a raster-fetch path (V2).

**Proposed ship-gate refinement (r4 Finding 5):** adopt the three-way completeness measure (areal / presence / per-jurisdiction) from `coverage-report.md` rather than a single areal %.

---

## What this proposal asks the group to ratify
1. Accept EU+NA (not Europe-only) as the V1 scope.
2. Accept the 5 Tier-1 criteria as the V1 processed set (ship gate met).
3. Accept the Tier-1/Tier-2 honesty line (curated values ≠ ingested coverage).
4. Consider the two r4-proposed criteria (legal_ownership, land_cost) at the next criteria sync.
5. Adopt the refined three-way ship-gate metric.

Per the propose-and-proceed rule, this stands as the working V1 scope unless the group objects within the response window; it is documented and reversible.
