# V1 Shipped — Lessons Learned (DRAFT)

**Status:** DRAFT for group ratification at r5. Captures what the r4 round actually learned, so V2 design starts from real evidence and not assumption.
**Author seat:** r4 @Gustaf (practitioner). Findings are grounded in: the 20-region demonstration build (Europe + North America), the legal_ownership compilation, and the formalization of the prototype's Tier-1 layers into V1 deliverables.

---

## Lessons (ordered roughly by load-bearing weight for V2)

### 1. The data-fetch wall is real, and it reorders the priority list
Sources that fetched cleanly: vector / event data (UCDP CSV), basin polygons (WRI Aqueduct GDB extracts), points via Overpass API, XYZ raster tiles (GFW). Sources that **truncated or failed** on this connection: large global rasters (WorldClim CMIP6, SoilGrids, GHSL POP). Empirical rule for V2 Step 4: **gettability ranking must reflect what actually fetches, not what relevance says is desirable.** High-relevance heavy rasters drop in priority until an alternate bulk-fetch path exists. The four Tier-2 curated criteria (climate, soil_carbon, solar_pv, population) are exactly the ones blocked here.

### 2. The "demonstration artifact" path was strictly more valuable than rebuilding V1 in miniature
The original instinct — build V1 from scratch with PostGIS + processing pipelines — broke on (a) data-fetch wall, (b) WGS84-rendered-in-Mercator overlay drift, and (c) the social cost of half-built layers. The pivot to a **designed communicative artifact** (a real dashboard, curated regional values, real Tier-1 layers where gettable) produced an honest, sourced, useful thing fast — and the 20-region dossiers it generated turned out to be **directly compilable into a per-jurisdiction V1 layer** (`legal_ownership`). V2 should keep this dual-track sensibility: a public artifact alongside the ingestion pipeline, not in sequence after it.

### 3. The Tier-1 / Tier-2 honesty line is load-bearing
The prototype carried both real processed layers AND hand-curated dossier midpoints. Conflating them would have inflated apparent V1 coverage and broken credibility. The discipline that worked: **never let curated comparison values count toward the ship gate; reserve ingested-layer status for the real processed data.** This is the empirical version of the docs' "data honesty in the UI" non-negotiable.

### 4. The ship-gate metric (`≥70% coverage`) is wrong for two-thirds of useful criteria
- **Areal criteria** (Aqueduct basins, GFW raster) → coverage % is right.
- **Presence criteria** (UCDP events, OSM points) → "% of area" is meaningless; measure source-completeness vs a reference, or "ingested with documented limitation."
- **Per-jurisdiction qualitative criteria** (legal_ownership, land_cost) → "% of in-scope jurisdictions with a recorded value" — areal doesn't apply at all.
A single areal % structurally under-prioritises the **highest-value** criterion (legal). V2 should adopt the three-way completeness measure formalized in `coverage-report.md`.

### 5. Legal/ownership is the first gate, not a mid-list criterion
The 20-region evidence is unambiguous: legal/tenure was the most-often decisive constraint (more than soil, climate, or water). Only **1 of 20 regions** allows multi-household residence as-of-right (Ozarks); 95% require special permission. **7 of 20 regions are in tightening regulatory direction, zero are loosening.** Askja's #10 should be promoted to first-class gate status, evidenced by the new `legal_ownership` Tier-1 layer. This is r4 Finding 1a, now backed by ingested data.

### 6. The V1/V2 filtering-vs-scoring boundary is mis-drawn
V1 currently bundles all user-facing logic ("query, filter, score, weight") into V2. The prototype showed **threshold-filtering** (user sets thresholds, system shows pass/fail per region) is neither a composite nor pure raw data — it is the simplest possible decision-support layer, safe (no scoring, no weighting), high-value, and **belongs earlier than V2's full query architecture.** V2 should split: filtering (no weighting, no composite) earlier; composite + weighting stays deferred and contested.

### 7. "Surface, don't enforce" works as the weighting hybrid
The prototype's design — show all criteria equally, let user set thresholds, but let copy and visual hierarchy foreground the load-bearing ones — is a working instance of the hybrid both Adam (user agency) and Askja (defend the boring-but-critical) can live with. V2's weighting question can start from this, not from the binary either/or.

### 8. NA proved as tractable as EU; do not revert to Europe-only
Same pipeline, same data quality, ten real regions in North America with full dossiers and Tier-1 layers. Direct evidence for the Overview's emergent-scope decision (decision 3). V1 ships at **EU + NA**.

### 9. LLM-assisted extraction needs a human-verifiable intermediate
The `legal_ownership` layer was compiled via LLM extraction from the dossiers, which Spec Step 4 explicitly allows ("LLM-assisted source surfacing acceptable, but every candidate must be manually verified by a human"). The discipline that worked: stage the extraction as a structured `legal-ownership.json` **before** compiling the GeoJSON, so the JSON is the human-verifiable artifact. The `compile_legal_ownership.py` script is mechanical from there. This pattern is reusable for other per-jurisdiction qualitative criteria (`land_cost`, soil-contamination registers, hospital-proximity if/when added).

### 10. Per-region dossiers double as primary-source compilations
Writing per-region research dossiers (legal.md, regen.md, water.md, climate.md, etc.) wasn't planned as a V1 ingestion mechanism — it was demonstration prep. But the dossiers were rigorously source-cited, which means each one is **already a verified-by-use micro-inventory of the most load-bearing sources for that region.** The data-source-inventory's "verified by use" tag exists because of this. V2 should formalize "regional dossier as Spec-Step-4 deliverable" — it consistently surfaces gettable sources that desk-research alone would miss.

---

## Candidates for V2 (synthesized from these lessons)

- Adopt the three-way completeness ship-gate metric (areal / presence / per-jurisdiction).
- Split filtering from scoring/weighting; introduce threshold-filtering as a near-V1 layer.
- Promote `legal_ownership` to first-class gate criterion; add `land_cost`.
- Extend the per-jurisdiction qualitative pattern to soil-contamination, hospital-proximity, water-source single-entity control.
- Find a bulk-fetch path for the Tier-2 rasters (CMIP6, SoilGrids, GHSL, Global Solar Atlas) — alternate mirrors, regional extracts, or institutional pipes.
- Keep the public demonstration artifact alongside the pipeline (don't ship "pure V1" without a visible thing for the group/community to see).
- Specify "regional dossier" as a Step-4 sub-deliverable for per-jurisdiction qualitative criteria.

(See also `docs/plans/r4-v1-production-run/r4-contribution.draft.md` for the full r4 reality-check.)
