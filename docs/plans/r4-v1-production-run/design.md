# Design — r4: a practitioner reality-check, delivered as a working V1 production run

**Status:** validated design (brainstorm output). Next: `/deep-plan @docs/plans/r4-v1-production-run/design.md`.
**Date:** 2026-05-28
**Owner framing:** Gustaf holds the open r4 seat on the land-selection-framework working group. "Move the project forward" resolved (via brainstorm) to: deliver the owed r4 practitioner reality-check AND start producing V1 — at maximum ambition — folded into one round. Spine = r4-as-production; front-load the clean r4 words (two-track); target the V1 ship gate (ship-gate run).

---

## 0. Reality constraints (non-negotiable framing)

- **Role:** Gustaf is r4 (practitioner reality-check), NOT the originator. He cannot solo-declare V1 shipped. Implementation-Strategy Steps 1, 3, 5, 8, 11 are `[GROUP]` sync points.
- **Legitimate mechanism:** the docs' own rule — propose-and-proceed, 5-working-day default, documented and reversible. Everything here is a **reversible proposal the group ratifies at r5**, not a fait accompli. Gustaf drives; the group signs off.
- **Data-fetch wall (learned):** heavy global rasters (CMIP6, GHSL, first Aqueduct pull) truncated on this connection. Vectors / APIs / modest extracts / XYZ tiles worked. New ingestion favors gettable sources only; do not promise heavy rasters.
- **Collaboration protocol:** add attributed commentary; never overwrite `[COMMITTED]` decisions. Update Contribution History. Prepare the r5 Handoff Request.
- **Framework discipline (binding):** native units throughout (no H3 grid); no querying/scoring/weighting in V1; source + vintage + license + native-unit metadata on every value; sovereignty as four cross-cutting tags (geopolitical/legal/material/social); state + trajectory per criterion.
- **Project is deliberately NOT a git repo** — do not git init or commit. (Overrides the brainstorming skill's default "commit the design.")

## 1. The honest data distinction (anchors the whole round)

The live prototype holds two different data tiers; conflating them would be dishonest and break the project's credibility bar:

- **Tier 1 — real processed layers:** the map GeoJSONs (WRI Aqueduct water-stress + depletion, UCDP conflict, OSM/GEN ecovillages) and the GFW/Hansen XYZ forest layer, produced by reproducible Python scripts in native units. **This is genuine V1 Step 6/7/9 ingestion.** Only Tier 1 counts toward the V1 ship gate.
- **Tier 2 — curated comparison values:** the 20-region × 8-criteria dashboard values are hand-curated dossier midpoints (best-available), NOT raster ingestion. A demonstration artifact, not a processed V1 layer. Useful, but it does not count as ingested coverage.

Naming this distinction is itself part of the practitioner reality-check.

## 2. Deliverables (mapped to the docs' own deliverable list)

**A. r4 words** (Phase 1; standalone-valuable):
- Attributed commentary blocks added under relevant sections of Overview / Specifications / Implementation Strategy (never overwriting `[COMMITTED]`).
- Answers to Open Questions: Q3 (criteria gaps/over-weights from the field), Q4 (framework supplements), Q5 (coverage threshold + whether Europe-only — NA proved tractable, argue for emergent scope). Process Qs if Gustaf has a view.
- A field-tested position on the two deferred V2 tensions: the prototype's threshold-filters-not-scores is *empirical* evidence for Adam's no-composite stance + a "surface-don't-enforce" hybrid on weighting authority.
- Contribution-History row (r4 | @Gustaf | practitioner | summary). Drafted r5 Handoff Request.
- Standalone `Docs/r4-contribution.md` summarizing the reality-check.

**B. V1 production — formalize Tier-1 into doc shapes** (Phase 2):
- `Docs/criteria-inventory.md` — criteria, scope-adjusted vs Askja's 12, sovereignty-tagged, state+trajectory, short definitions, practitioner load-bearing notes.
- `Docs/data-source-inventory.md` — the actual sources used (Aqueduct, UCDP, Hansen/GFW, SoilGrids, WorldClim CMIP6, Global Solar Atlas, GHSL, GEN/OSM), scored relevance×gettability, coverage/vintage/native-unit/license. These are **already verified by use** — high-value for Step 4. Red-line underlying data flagged.
- `metadata.yaml` sibling per Tier-1 processed dataset (source/vintage/license/native-unit/coverage/time-framing/sovereignty-tags/state+trajectory).
- Repo structure confirmed/created: `Docs/ data/raw/ data/processed/ scripts/fetch/ scripts/process/` (prototype `scripts/` + `data/processed/` largely map already).

**C. Coverage + ship-gate** (Phase 3):
- `Docs/coverage-report.md` — measured coverage of Tier-1 layers across the defined scope (EU + NA bboxes), % coverage, gaps. Honest Tier-1-only.
- `Docs/v1-data-priorities.md` + a proposed **V1 scope lock** (criteria through full processing) mapped to the ship gate (≥3 criteria ≥70% coverage). Likely already met by Tier-1 — the move is to formalize and propose it.

**D. Extension — gettable + red-line** (Phase 4):
- Add 1-3 new gettable sources, prioritizing red-line underlying data the docs call out: hospital-proximity (OSM-derived isochrones or a JRC accessibility extract), **collective-ownership legality** (formalize the dossiers' per-region `legal.md` into a qualitative red-line dataset — it already is this), soil-contamination registers (qualitative/per-region).
- Reproducible fetch + process scripts + metadata. Vectors/APIs/extracts only.

**E. Exports + demo + lessons + ship-candidate** (Phase 5):
- Jupyter canonical loader per criterion + GeoPackage/GeoTIFF exports (`data/v1-exports/`).
- `notebooks/v1-demo.ipynb`.
- `Docs/v1-verification-notes.md` + draft `Docs/v1-shipped.md` lessons-learned (raster-fetch wall; MAUP/WGS84-in-Mercator drift; the map-as-data-product → designed-artifact pivot; dossier-as-legal-dataset insight; threshold-filter validation).
- A **V1-ship-candidate** write-up + the r5 Handoff Request — the ratify-ready package for the group.

## 3. Build sequence (phaseable; Phase 1 ships value alone)

1. **Phase 1 — r4 words.** Interview Gustaf (draw out field view; do not invent) → write attributed commentary + open-question answers + tensions position + history row + r5 handoff + `r4-contribution.md`.
2. **Phase 2 — Formalize.** criteria-inventory, data-source-inventory, metadata.yaml on Tier-1, repo structure.
3. **Phase 3 — Coverage + scope.** coverage-report, v1-data-priorities + proposed V1 scope lock vs ship gate.
4. **Phase 4 — Extend.** 1-3 gettable/red-line sources (incl. legal.md formalization).
5. **Phase 5 — Exports + demo + lessons + ship-candidate + r5 handoff.**

Phases 1 is independent and front-loaded (owed words land first). 2-3 depend on the prototype's existing Tier-1 data. 4 is parallelizable. 5 depends on 2-4.

## 4. Risks / open questions (for the plan)

1. **Group-gate overreach** — must stay a reversible proposal; the V1-ship-candidate is a *proposal to ratify*, never a unilateral ship. Discipline risk.
2. **Data wall** — Phase 4 ingestion must favor gettable sources; budget for "source turned out ungettable, defer to V2."
3. **Tier honesty** — coverage claims must derive only from Tier-1; do not let curated values inflate the ship-gate story.
4. **Practitioner content is Gustaf's** — Phase 1 is interview-driven; the AI facilitates and writes, it does not fabricate the field perspective.
5. **Scope realism** — "everything and more" is ~5 phases / multiple sessions; plan may want to be sequenced (consider `/deep-plan` then phase the `/build`).

## 5. Success criteria

- r4 words delivered and standalone-valuable even if the build stalls.
- The 3 docs carry attributed r4 commentary; Contribution History updated; r5 handoff drafted.
- V1 deliverables exist in the doc-specified shapes; metadata complete on every Tier-1 layer; coverage report honest.
- ≥1 new gettable/red-line source added (legal.md formalization counts).
- Demo notebook loads the exports; lessons captured; a clean, ratify-ready V1-ship-candidate exists.

## 6. Portable pattern

The durable assets are the **r4 reality-check, the criteria + data-source inventories, the lessons-learned, and the methodology discipline** (native units, no-score filtering, source+vintage, sovereignty tags) — these survive any stack and compound for the group. The prototype/build wiring is Tied. Invest the care in the Portable layer; treat the wiring as disposable.
