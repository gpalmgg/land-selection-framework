> **SUPERSEDED** — content was placed into Docs/v1-ship-candidate.md (promoted to a proper deliverable on 2026-05-29; updated to the 12-Tier-1 reality) on 2026-05-29. This file is kept as historical record of the staged draft, not as source-of-truth. To act on the round, read the placement target above instead.

---

# V1 Ship Candidate — Proposal for Group Ratification (DRAFT)

**Status:** DRAFT, for @Gustaf's review before going to the working group as the r4 round's V1 ship-candidate proposal. Nothing here goes into the source-of-truth docs or is sent to the group until Gustaf signs off.

**Mechanism:** propose-and-proceed under the Implementation Strategy's "Group coordination" rule. The 5-working-day default response window applies; the V1 set below stands as the working V1 unless the group objects, documented and reversible.

---

## What this proposes the group ratify

That the working group declare **V1 shipped** with the following set:

### V1 scope (locked here as proposal)
- **Geographic scope:** Europe + North America. *(Not Europe-only; NA proved as tractable as EU in the demonstration build. Direct evidence for Overview decision 3.)*

### V1 processed criteria (Tier-1, ingested, metadata-complete, exportable, 6 criteria)
1. **legal_ownership** — per-jurisdiction qualitative, 20/20 in-scope regions, carries red-line collective-ownership-legality underlying data. *r4-promoted to first-class criterion (was buried under Askja #10).*
2. **water_stress** — WRI Aqueduct 4.0, EU+NA, basin polygons, 2050 BAU projection. Red-line: water-deficit by 2050.
3. **water_depletion** — WRI Aqueduct 4.0, EU+NA, basin polygons, drawdown signal.
4. **conflict** — UCDP GED v25.1, EU+NA, event points, observed 2015-2024. Red-line: active-conflict proximity.
5. **regen_network** — OpenStreetMap via Overpass + GEN, EU+NA, point density (with documented coverage limitation vs full GEN directory).
6. **forest_change** — Hansen / GFW v1.11, served live as XYZ tiles, global 30 m.

### Out-of-scope but acknowledged in V1 (Tier-2, curated demonstration values, NOT counted as ingested coverage)
climate (CMIP6), soil_carbon (SoilGrids), solar_pv (Global Solar Atlas), population (GHSL). All blocked on the raster fetch wall (see lessons-learned). Deferred to V2 or an alternate bulk-fetch path.

### Deliverables (the V1 artifact set)
- `Docs/criteria-inventory.md`, `Docs/data-source-inventory.md`, `Docs/v1-data-priorities.md`, `Docs/coverage-report.md`, `Docs/v1-verification-notes.md`, `Docs/v1-shipped.md`.
- 5 metadata sidecars at `prototype/data/processed/*.metadata.yaml`.
- GeoPackage exports at `prototype/data/v1-exports/<criterion>.gpkg`.
- Jupyter canonical loader: `prototype/scripts/v1_loader.py`.
- Demo notebook: `prototype/notebooks/v1-demo.ipynb`.
- Compile script for legal_ownership: `prototype/scripts/compile_legal_ownership.py`.

### Ship-gate assessment (Spec Step 8)
- Spec gate: ≥3 criteria, ≥70% coverage of a defined scope.
- **Met with margin.** 3 criteria with effectively complete areal coverage (water_stress, water_depletion, forest_change); 2 ingested presence-mode criteria (conflict, regen_network); 1 per-jurisdiction-mode criterion at 100% (legal_ownership). All metadata-complete, all exportable, demo notebook works.

---

## What this proposes the group adopt going forward

1. **The Tier-1 / Tier-2 honesty line** (curated demonstration values never count as ingested coverage).
2. **The three-way completeness ship-gate metric** (areal / presence / per-jurisdiction) — replaces the single areal % which structurally under-prioritises legal-type criteria.
3. **Promote Askja #10 to first-class gate status**, evidenced by the new `legal_ownership` ingested layer.
4. **`land_cost` as the next first-class addition** (proposed; not yet ingested).
5. **Split filtering from scoring/weighting** in the V1→V2 boundary; filtering (threshold pass/fail) is safe and high-value and can arrive earlier than composite/weighting.

---

## Honest qualifications

- This is **one practitioner's draft**, not a group consensus. It is a proposal for r5 to react to.
- Manual QGIS eyeball verification is the remaining sanity-check gate per Spec Step 10 ("at least one human eyeballs the dataset rendered in QGIS against known reality"). Mechanical loader checks don't substitute for it. See `Docs/v1-verification-notes.md` for what still needs human eyes.
- The legal_ownership extraction was LLM-assisted from the per-region dossiers with a human-verifiable JSON intermediate, per Spec Step 4. Sources are pulled verbatim from the dossiers; field values are extracted and structured against a fixed schema. The intermediate JSON is directly inspectable.
- Several Tier-2 raster criteria are not ingested because the data-fetch wall was real on this connection. Not pretending otherwise.

---

## Ask of the group

Within the response window: ratify, object, or amend. Silence defaults to "this stands as the working V1," reversible at the next sync.
