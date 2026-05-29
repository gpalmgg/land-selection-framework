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
| **legal_ownership** | per-region `legal.md` dossiers (compiled) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction structured; 20/20 in-scope = 100% completeness** | n/a (per-jurisdiction; see below) |
| **land_cost** | per-region dossiers + national ag-ministry data (compiled) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction structured; 20/20 attempted; data_confidence high=17, medium=2, low=1** | n/a (per-jurisdiction; see below) |
| **hospital_proximity** | OSM Overpass amenity=hospital (42,593 raw points, aggregated) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction nearest-distance + 50/100 km counts; 20/20 regions; all pass the 50 km geodesic proxy for 60-min red line** | n/a (per-jurisdiction; honest geodesic-vs-isochrone proxy caveat in metadata) |
| **demographic_trajectory** | per-region dossiers + national statistical agencies (compiled) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction structured; 20/20 attempted; data_confidence high=13, medium=6, low=1 (Driftless, N New Mexico, Nova Scotia, Kootenays, Quebec, Oaxaca all 'unknown' trend where dossier was silent)** | n/a (per-jurisdiction; Spec Step 1 gap-candidate delivered) |
| **soil_contamination** | per-region dossiers (compiled, thin by design) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction structured; 20/20 attempted; HEAVY on 'unknown' and 'low' — dossiers did not systematically research contamination; known signals captured (Asturias mining, Driftless nitrate, Ozarks CAFO, Transylvania, Saxony-Anhalt industrial)** | n/a (per-jurisdiction; carries red-line underlying data; V2 to add national registers) |
| **water_source_control** | per-region dossiers (compiled) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction structured; 20/20 regions; 1 high-risk (Kootenays), 5 moderate, 14 low; community_commons regimes (acequia, ALR, ejido) score lowest** | n/a (per-jurisdiction; carries red-line single-entity-water-control) |
| **climate_buffering** | per-region climate.md + national projection sources (compiled) | 10 jurisdictions | 10 jurisdictions | **Per-jurisdiction state + trajectory; 20/20 regions; all data_confidence=high; 5 very_high + 5 high buffering, 2 very_low (Alentejo, Saxony-Anhalt); 13 worsening trajectory** | n/a (per-jurisdiction; closes Overview 8.1's named gap) |

---

## Ship-gate assessment
The Spec ship gate ("≥3 criteria, ≥70% coverage") is **met by a wide margin**: water_stress, water_depletion, and forest_change each have effectively complete areal coverage across both EU and NA scopes — 3 criteria clearing the areal-coverage bar. With the three-way metric, conflict + regen_network add **presence-mode** completeness (ingested with documented limitations), and **legal_ownership + land_cost + hospital_proximity + demographic_trajectory + soil_contamination + water_source_control + climate_buffering** add **per-jurisdiction-mode** completeness (20/20 each) — a total of **12 criteria** demonstrating all three completeness modes. **All 6 red-line underlying datasets named in Overview decision 9 are now ingested** (active-conflict via UCDP, water-deficit via Aqueduct, collective-ownership via dossier compilation, hospital-60-min via OSM proxy, soil-contamination via thin dossier compilation, single-entity-water-control via dossier compilation). The Overview's red-line filtering logic (deferred to V2) has its data foundation in place.

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
