# V1 Ship Candidate — Proposal for Group Ratification

**Status:** Proposal under propose-and-proceed (Implementation Strategy "Group coordination" rule). 5-working-day default response window applies; the V1 set below stands as the working V1 unless the group objects, documented and reversible.

**Author seat:** r4 @Gustaf, practitioner reality-check. Placed into Docs/ on 2026-05-29 as part of the r4 handoff to r5 (see updated Handoff Request in `source-docs/Land Project v1 r4 Overview.md`).

---

## What this proposes the group ratify

That the working group declare **V1 shipped** with the following set.

### V1 scope
- **Geographic scope:** Europe + North America (10 + 10 regions). *(Not Europe-only; NA proved as tractable as EU in the demonstration build, direct evidence for Overview decision 3.)*

### V1 processed criteria — 12 Tier-1 layers, ingested, metadata-complete, exportable

**Areal coverage:**
1. **water_stress** — WRI Aqueduct 4.0, EU+NA basin polygons, 2050 BAU projection. Red-line: water-deficit by 2050.
2. **water_depletion** — WRI Aqueduct 4.0, EU+NA basin polygons, drawdown signal.
3. **forest_change** — Hansen / GFW v1.11, served live as XYZ raster tiles, global 30 m.

**Presence completeness:**
4. **conflict** — UCDP GED v25.1, EU+NA event points (~30,879), observed 2015-2024. Red-line: active-conflict proximity.
5. **regen_network** — OpenStreetMap via Overpass cross-referenced with GEN directory, EU+NA points (with documented coverage limitation vs full GEN directory).

**Per-jurisdiction completeness** (the r4 round's signature contribution):
6. **legal_ownership** — per-region structured layer; 20/20 jurisdictions; carries red-line collective-ownership-legality underlying data. *r4-promoted to first-class criterion (was buried under Askja #10).*
7. **land_cost** — per-region structured layer; 20/20 attempted; data_confidence high=17, medium=2, low=1; r4-promoted to first-class criterion under the closure rule.
8. **hospital_proximity** — per-jurisdiction nearest-hospital distance from 42,593 OSM Overpass points, plus 50/100 km counts. Carries red-line "no hospital within 60 minutes" as a 50 km geodesic proxy; true road-isochrones deferred to V2.
9. **demographic_trajectory** — per-region structured layer; 20/20 attempted; delivers Spec Step 1's named gap-candidate (demographic-trajectory dimensions under Askja #1).
10. **soil_contamination** — per-region structured layer (deliberately thin); 20/20 attempted; carries red-line soil-contamination underlying data; honest data_confidence + gaps fields, V2 to integrate national registers.
11. **water_source_control** — per-region structured layer; 20/20 jurisdictions; carries red-line single-entity-water-control underlying data; 1 high-risk (Kootenays), 5 moderate, 14 low.
12. **climate_buffering** — per-region structured layer; 20/20, all data_confidence=high; **closes Overview decision 8.1's explicitly named "climate-buffering features (altitude, distance-to-coast, mountain-shelter exposure)" gap.**

**All 6 red-line underlying datasets named in Overview decision 9 are ingested in this set** (active-conflict, water-deficit-2050, collective-ownership, hospital-60-min via proxy, soil-contamination, single-entity-water-control). The Overview's V2 red-line filtering layer now has its full data foundation in place.

### Out-of-scope but acknowledged in V1 (Tier-2, curated demonstration values, **explicitly not counted as ingested coverage**)
- climate-as-temperature (CMIP6)
- soil_carbon (SoilGrids)
- solar_pv (Global Solar Atlas)
- population (GHSL POP)

All blocked on the data-fetch wall (heavy global rasters truncated on this connection — see `Docs/v1-shipped.md` lessons-learned for the empirical rule that reorders the priority list). Deferred to V2 or an alternate bulk-fetch path.

### Ship-gate assessment (Spec Step 8, refined three-way metric)
- **Areal mode:** 3 criteria with effectively complete EU+NA coverage (water_stress, water_depletion, forest_change). Original ≥3/≥70% gate cleared by these alone.
- **Presence mode:** 2 criteria ingested with documented coverage limitations (conflict, regen_network).
- **Per-jurisdiction mode:** 7 criteria at 20/20 completeness (legal_ownership, land_cost, hospital_proximity, demographic_trajectory, soil_contamination, water_source_control, climate_buffering).
- **Total:** 12 Tier-1 criteria across all three completeness modes. Ship gate met by a wide margin.

### V1 artifact set (the deliverables in this round)

**Data:**
- `prototype/data/processed/*.geojson` — 5 areal/presence ingestions (EU + NA each where applicable) + 7 per-jurisdiction layers
- `prototype/data/processed/*.metadata.yaml` — sidecar per Tier-1 layer (Spec Step 9 requirement)
- `prototype/data/processed/*.json` — human-verifiable intermediates for per-jurisdiction layers (Spec Step 4 manual-verification rule satisfied)
- `prototype/data/v1-exports/<criterion>.gpkg` — GeoPackage exports for QGIS

**Documentation** (this Docs/ folder):
- `criteria-inventory.md` — Tier-1 inventory, sovereignty-tagged, state+trajectory
- `data-source-inventory.md` — scored sources, all marked verified-by-use
- `v1-data-priorities.md` — V1 scope proposal + priority list
- `coverage-report.md` — three-way completeness metric in action
- `v1-verification-notes.md` — what was mechanically verified + what still needs a QGIS eyeball
- `v1-shipped.md` — lessons-learned
- `v1-ship-candidate.md` — this file

**Code:**
- `prototype/scripts/v1_loader.py` — canonical Jupyter loader (11 loadable + GFW tiles documented)
- `prototype/scripts/export_v1.py` — GeoPackage exporter
- `prototype/scripts/compile_per_jurisdiction.py` — generic compile script (one script for all per-jurisdiction layers)
- `prototype/scripts/fetch_hospitals.py` + `prototype/scripts/process_hospital_proximity.py` — Overpass fetch + haversine processor
- `prototype/scripts/gen_region_pages.mjs` — generates 20 indexable region pages + sitemap + the shared `data/v1-lookup.js`
- `prototype/notebooks/v1-demo.ipynb` — Spec Step 10 demo

**Public reach layer** (built alongside V1 ingestion, not in the original sequence — see Implementation Strategy r4 Deviation log):
- 20 per-region indexable HTML pages at `prototype/region/<id>.html`, sitemap-listed
- Dynamic OG share cards via Vercel edge functions (`prototype/api/og.js`, `prototype/api/share.js`)
- Dashboard qualitative-filter dropdowns wired to `data/v1-lookup.js` (foreign_ownership, affordability_band, buffering_strength, regulatory_direction) — filters never scores, same threshold-discipline as the existing sliders
- Site live: https://land-selection-framework.vercel.app

---

## What this proposes the group adopt going forward

1. **The Tier-1 / Tier-2 honesty line** (curated demonstration values never count as ingested coverage).
2. **The three-way completeness ship-gate metric** (areal / presence / per-jurisdiction) — replaces the single areal % which structurally under-prioritises legal-type criteria.
3. **Promote Askja #10 to first-class gate status**, split into `legal_ownership` (the regime gate) and `land_cost` (the affordability gate). Both evidenced by ingested Tier-1 layers this round.
4. **Adopt `climate_buffering` as a first-class criterion** under the closure rule — closes Overview decision 8.1's explicit gap-candidate.
5. **Split filtering from scoring/weighting** in the V1→V2 boundary; threshold-filtering (pass/fail, no weights) is safe and high-value and can arrive earlier than composite/weighting. The dashboard demonstrates threshold + qualitative filtering work without any composite.
6. **Adopt the `data_confidence` + `gaps` pattern** for any per-jurisdiction qualitative layer with uneven evidence (proven on land_cost and soil_contamination).
7. **Adopt the proxy-vs-true-metric honesty pattern** (hospital_proximity ships a 50 km geodesic proxy for the 60-min isochrone, caveat recorded per-feature; V2 refines).
8. **Adopt LLM-assisted extraction with a human-verifiable JSON intermediate** as the recognised Step-4 pattern for per-jurisdiction qualitative criteria (proven 7 times this round).
9. **Recognise regional dossiers as a Step-4 sub-deliverable.** Per-region dossier files (legal.md, regen.md, water.md, climate.md, etc.) were directly compilable into V1 layers. Formalising this surfaces gettable sources desk research misses.
10. **Keep the public demonstration artifact alongside V1 ingestion** as an explicit V1/V2 dual track, not something to wind down once formal V1 lands. `[opinion, but recommended]`

---

## Honest qualifications

- This is **one practitioner's proposal**, not a group consensus. It is for r5 (and Adam/Askja/Deca particularly) to react to.
- Manual QGIS eyeball verification is the remaining sanity-check gate per Spec Step 10 ("at least one human eyeballs the dataset rendered in QGIS against known reality"). Mechanical loader checks don't substitute for it. See `Docs/v1-verification-notes.md` for what still needs human eyes.
- The seven per-jurisdiction layers were LLM-assisted from the per-region dossiers with human-verifiable JSON intermediates (Spec Step 4 manual-verification rule explicitly allows this). Sources are pulled verbatim from the dossiers; field values are extracted against fixed schemas; the JSON intermediates are directly inspectable.
- The four Tier-2 raster criteria are not ingested because the data-fetch wall was real on this connection. Not pretending otherwise.
- Soil_contamination is honestly thin (heavy on `unknown` / `low data_confidence` where dossiers were silent on contamination — they weren't researched for it). The known signals captured (Asturias mining, Driftless karst nitrate, Ozarks CAFO, Saxony-Anhalt industrial) are dossier-grounded; the absence elsewhere is honestly recorded, not hidden. V2 to integrate national contamination registers (BASIAS/BASOL FR, BBodSchG DE, EPA Superfund US, etc.).

---

## Ask of the group

Within the response window: ratify, object, or amend. Silence defaults to "this stands as the working V1," reversible at the next sync. See the updated `Handoff Request [r4 → r5]` block in `source-docs/Land Project v1 r4 Overview.md` for the per-contributor specific asks.
