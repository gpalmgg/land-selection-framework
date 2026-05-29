# Criteria Inventory (V1)

**Produced:** 2026-05-28, r4 round (@Gustaf, practitioner seat), as part of formalizing the demonstration build into V1 deliverables.
**Status:** PROPOSAL under the propose-and-proceed rule (Implementation Strategy "Group coordination"). Reversible; awaiting group ratification at the next sync. Adopts Askja's 12-metric starter set with the scope adjustments committed in the Specifications.
**Scope honesty:** this inventory covers the criteria the demonstration build actually instrumented (8), mapped onto Askja's metrics. It is not yet the full closure-rule inventory (Spec Steps 1-3); it is the evidence-grounded starting point plus two r4 proposals (see end).

---

## Legend
- **Tier**: T1 = real processed geodata layer exists (measurable coverage); T2 = per-region curated value (dossier midpoint, not raster ingestion). See `data-source-inventory.md`.
- **Sovereignty axes** (cross-cutting tags, per Spec): GEO = geopolitical, LEG = legal, MAT = material, SOC = social.
- **Trajectory**: projection / trend / null (per Spec time-framing).

---

## Adopted criteria

| ID | Criterion | Askja # | Tier | Sovereignty | State | Trajectory | Native unit |
|----|-----------|---------|------|-------------|-------|------------|-------------|
| climate | Climate trajectory | #2 | T2 | MAT | mean annual temp | projection (CMIP6 SSP2-4.5, 2041-2060) | ~18 km raster (dossier midpoint in V1) |
| water_stress | Water stress | #4 | **T1** | MAT | demand/supply ratio | projection (Aqueduct 2050 BAU) | HydroBASINS L6 |
| water_depletion | Water depletion | #4 | **T1** | MAT | renewable supply consumed | projection (Aqueduct 2050 BAU) | HydroBASINS L6 |
| soil_carbon | Soil organic carbon | #5 | T2 | MAT | SOC topsoil g/kg | null (not meaningful at horizon) | 250 m raster (dossier midpoint in V1) |
| forest_change | Forest cover trajectory | #5 / #11 | **T1** (tiles) | MAT | tree-cover trend | trend (Hansen 2001-2023) | 30 m raster (GFW XYZ tiles) |
| solar_pv | Solar PV potential | #7 | T2 | MAT | kWh/kWp/yr | null (stable resource) | ~1 km raster (dossier midpoint in V1) |
| conflict | Conflict proximity | #1 | **T1** | GEO | fatal events within ~200 km | trend (observed 2015-2024, NOT projected) | event points |
| regen_network | Regenerative network density | #3 | **T1** | SOC | intentional-community/permaculture sites within ~100 km | trend (mostly state in V1) | point locations |
| population | Population density | #9 / #6 | T2 | — (context) | persons/km² | projection (GHSL 2030) | 1 km raster (dossier midpoint in V1) |
| **legal_ownership** | **Legal / ownership regime** | **#10** | **T1** | **LEG** | ownership / collective-form / residency / preemption / planning regime per region | trajectory (regulatory_direction) | per-jurisdiction (point at region centroid) |
| **land_cost** | **Land cost / affordability** | **#10 (split)** | **T1** | **LEG, MAT** | price range per ha (currency, vintage, affordability band) per region | trajectory (appreciation_trajectory) | per-jurisdiction (point at region centroid) |
| **hospital_proximity** | **Hospital proximity** | **#9** | **T1** | **MAT** | nearest-hospital km from region centroid + counts within 50/100 km (red-line 60-min proxy via 50 km geodesic) | null (slow change) | per-jurisdiction (point at region centroid; distance in km) |
| **demographic_trajectory** | **Demographic trajectory** | **#1 (added)** | **T1** | **SOC** | population trend + median age + migration dynamic + rural density per region | trajectory (population_trend) | per-jurisdiction (point at region centroid) |
| **soil_contamination** | **Soil contamination** | **#5** | **T1** | **MAT** | regulatory regime + register availability + known signal + due-diligence burden per region | null (slow change) | per-jurisdiction (point at region centroid) |
| **water_source_control** | **Water source control** | **#4** | **T1** | **MAT, LEG** | water-rights regime + holder type + single-entity control risk + drought-priority mechanism per region | null in V1 | per-jurisdiction (point at region centroid) |

**Tier-1 (real ingested layers): water_stress, water_depletion, conflict, regen_network, forest_change (tiles), legal_ownership, land_cost, hospital_proximity, demographic_trajectory, soil_contamination, water_source_control.** **Eleven criteria** with measurable completeness; together they feed the ship gate. The remaining four (climate, soil_carbon, solar_pv, population) exist in V1 only as per-region curated values, not ingested layers — V2/full-V1 ingestion targets. **All 6 red-line underlying datasets from Overview decision 9 are now ingested** (active-conflict, water-deficit, collective-ownership, hospital-60-min-proxy, soil-contamination, single-entity-water-control).

---

## Notes per criterion (state + trajectory rationale)
- **climate** — trajectory is a genuine forward projection (CMIP6 SSP2-4.5); the most credible long-horizon projection in the set.
- **water_stress / water_depletion** — two distinct Aqueduct signals (demand:supply vs drawdown rate); both 2050 BAU projections. The red-line "water-deficit projection by 2050" underlying data (Overview decision 9) lives here.
- **conflict** — explicitly **observed, not projected**. Trajectory is a recent-events trend; political-violence projection is not credible at this horizon (per Askja/Spec). Carries the red-line "active-conflict proximity" underlying data.
- **forest_change** — state + 20-year trend (Hansen). Served live as GFW XYZ tiles rather than a stored GeoJSON; real ingestion, different delivery.
- **regen_network** — treated as hard data (Overview decision 6). OSM/GEN point density. Trajectory (network growth) is a V2 enrichment; V1 records state.
- **soil_carbon / solar_pv** — trajectory null/stable at the 50-100yr horizon; state-only is correct.
- **population** — density as neutral context (neither high nor low "better"), per Askja #9.

---

## r4 proposals (from the practitioner reality-check — see `docs/plans/r4-v1-production-run/r4-contribution.draft.md`)

1. **`legal_ownership` as a first-class criterion (Askja #10).** ✅ **DELIVERED this round.** The 20-region evidence showed legal/tenure is the *first gate*, more often decisive than soil or climate. Compiled from the per-region `legal.md` dossiers into a structured per-jurisdiction layer at `data/processed/legal-ownership.geojson` (20/20 = 100% jurisdiction completeness). Carries red-line underlying data (collective-ownership legality). Pending group ratification of its first-class status via the closure rule (Spec Step 3).
2. **`land_cost` as a first-class criterion (currently buried in #10).** ✅ **DELIVERED this round.** Compiled per-region from the dossier figures into a structured per-jurisdiction layer at `data/processed/land-cost.geojson` (20/20 attempted; 17 high-confidence, 2 medium, 1 low — Oaxaca, honestly flagged where no published price series exists). Carries price range + currency + vintage + appreciation_trajectory + affordability_band + per-region data_confidence. Directional finding from the data: 15 of 20 regions are *rising* or *rising_fast*; price gradient spans from Ozarks (cheapest) through low/moderate to very-premium (South Tirol, Cascadia, Kootenays). Pairs with `legal_ownership` as the two "first gate" criteria. Pending group ratification under the closure rule (Spec Step 3).
