# Coverage Report (V1)

**Produced:** 2026-05-28, r4 round. Measures the Tier-1 processed layers against the Spec ship gate (≥3 criteria, ≥70% coverage of a defined scope).
**Status:** PROPOSAL (propose-and-proceed; reversible). Regenerate when new sources are fetched (Spec Step 7).
**Method:** layers were clipped from global sources to two bounding boxes during processing — EU `(-12, 35, 40, 72)`, NA `(-126, 14, -52, 60)`. Feature counts are measured; coverage characterised by source completeness within those bboxes.

---

## Tier-1 layers

| Criterion | Source | EU features | NA features | Coverage character | Clears ≥70% areal? |
|-----------|--------|-------------|-------------|--------------------|--------------------|
| water_stress | WRI Aqueduct 4.0 | 995 basins | 2,039 basins | Global source; HydroBASINS tile the **entire land surface** within bbox — every land basin carries a value | ✅ effectively complete |
| water_depletion | WRI Aqueduct 4.0 | 995 basins | 2,039 basins | Same basin tiling, complete within bbox | ✅ effectively complete |
| forest_change | Hansen/GFW v1.11 | global 30 m (XYZ tiles) | global 30 m | Global continuous raster; complete | ✅ complete |
| conflict | UCDP GED v25.1 | 14,546 events | 16,333 events | **Event presence, not areal coverage** — % of area is the wrong metric | n/a (see below) |
| regen_network | OSM/GEN | 30 sites | 76 sites | **Point density; volunteer-tagged, patchy** — undercounts vs GEN 300+ | n/a (see below) |

---

## Ship-gate assessment
The Spec ship gate ("≥3 criteria, ≥70% coverage") is **met**: water_stress, water_depletion, and forest_change each have effectively complete areal coverage across both the EU and NA scopes. That is 3 criteria clearing the areal-coverage bar with real, processed, metadata-complete layers.

## Finding 5 surfaced with evidence — the gate metric is wrong for two criteria
conflict and regen_network are **not areal-coverage criteria**. UCDP is event points; "% of Europe covered" is meaningless for it (you want presence/proximity within a radius, not areal fill). OSM/GEN is point density with an honest patchiness gap. Applying a "≥70% areal coverage" gate to these would either falsely fail them or force a meaningless number.

**Recommendation (r4):** the ship gate should distinguish:
1. **Areal-coverage criteria** (rasters/basin polygons) → "% of scope covered at native resolution" applies. Gate: ≥70%.
2. **Presence/point criteria** (events, sites) → measure completeness differently (e.g. source-completeness ratio vs a reference directory, or simply "ingested with documented coverage limitation").
3. **Per-jurisdiction qualitative criteria** (legal_ownership, land_cost — the r4-proposed additions) → completeness = "% of in-scope jurisdictions with a recorded value", not areal at all.

A single areal % structurally under-prioritises exactly the highest-value criterion (legal). This is the concrete version of r4 Finding 5.

---

## Honest caveats
- The four **Tier-2** criteria (climate, soil_carbon, solar_pv, population) are **not** in this report — they are per-region curated dossier values, not ingested layers, and contribute **zero** measured coverage. They are not counted toward the ship gate.
- regen_network coverage is a documented limitation (OSM undercount), surfaced wherever the layer is used, not hidden.
- conflict NA bbox currently includes Central America (captures the Oaxaca signal); noted in its metadata.
