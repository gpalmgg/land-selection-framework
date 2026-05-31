> **SUPERSEDED** — content was placed into source-docs/Land Project v1 r4 Overview.md (and Specifications, Implementation Strategy) as attributed '## r4 Commentary' sections on 2026-05-29. This file is kept as historical record of the staged draft, not as source-of-truth. To act on the round, read the placement target above instead.

---

# r4 Contribution — Practitioner Reality-Check (DRAFT, for Gustaf's review)

**Status:** DRAFT. Not yet placed into the source-of-truth docs. Nothing here lands in Overview / Specifications / Implementation Strategy under @Gustaf's name until he reviews, corrects, and owns it.

**Honest provenance (carries into the docs):** this reality-check is grounded in evidence from a 20-region demonstration build (Europe + North America, 8 criteria, per-region dossiers with sources, a live filtering dashboard). It is *"what building the demonstration taught us about the framework"* — analytical findings on real evidence, not unsupported opinion and not invented field anecdotes. Points that are judgment rather than evidence are marked `[opinion]`.

---

## Finding 1 — Criteria weighting is wrong in two specific ways

### 1a. Legal / residency / ownership (#10) is the most under-weighted criterion
Askja lists *Economic & Legal Context* (#10) mid-pack. The 20-region evidence says it is the **first gate** — the decisive, frequently disqualifying constraint, more often than soil, climate, or water:
- SAFER pre-emption >0.7 ha (Cévennes); Maso Chiuso partition ban (South Tirol); ejido/comunal + usos y costumbres (Oaxaca); OPD/TAN 6 65%-subsistence gate (Pembrokeshire); foreign-buyer ban + 50% PNP cut (Nova Scotia); ALR one-residence (Kootenays); CPTAQ Bill 86 2025 (Québec); e-Residency ≠ land right (Estonia); active-farmer pre-emption (Saxony-Anhalt); minifundio 30+-heir title tangle (Galicia).

**Implication:** #10 should be re-positioned as a primary gate. It already carries the most red-line underlying data (collective-ownership legality, residency pathways). In V1 (no filtering) this means legal/ownership data is a *highest-priority* ingestion target, not mid-list. In V2's query layer, legal feasibility should filter *before* amenity criteria are read.

### 1b. Land cost / affordability should be promoted to a first-class criterion
Currently buried inside #10. In the evidence it behaves as an independent binding constraint that kills projects before other criteria matter (Cascadia 3-5x Alentejo; Appalachian regen-premium; BC ALR pricing). Promote it, with both axes:
- **State:** cost per hectare (per-country sources: DVF/FR, FCC/CA, USDA NASS, MAPA/ES).
- **Trajectory:** appreciation rate — material over 50-100yr, and *worse* in desirable regen regions (network richness capitalises into price; documented in Cascadia, Appalachians, Driftless).

A candidate **new dimension** under the closure rule (Spec Step 3), not an elaboration within #10.

## Finding 2 — Site suitability is not community survival `[Gustaf's stance: context-dependent]`
Asked what most kills communities, the practitioner answer is: *it depends on context — there is no single dominant failure mode.* That is itself the finding, and it has three consequences for the framework:
- It **validates deferring #12** (Cultural & Lifestyle Fit) rather than forcing social viability into a dataset that would imply false precision.
- It **warns against treating #3** (regen-network density) as a *predictor* of success. Proximity to other communities is an input, not a guarantee. The framework should surface it as availability, not viability.
- Most important: the tool predicts **site** suitability, not **community** success — different things. V1/V2 should state this honestly in the UI and never imply it forecasts the social outcome. `[opinion, but conservative]`

## Finding 3 — Process risk: the pipeline may die in coordination before it produces anything
The 11-step sequence has 5 `[GROUP]` gates before V1 ships. For an async group already slowing (last activity ~2 weeks pre-r4), that is a real failure mode: **death by coordination overhead before anything visible exists.** The demonstration build is counter-evidence — a compelling, honest, sourced artifact was produced *fast* by going demonstration-first instead of ingestion-first. `[opinion]` Recommendation: keep the rigor, but front-load a visible artifact (the prototype already is one) so the group has something concrete to rally around between gates, rather than five sign-offs before any output. The native-units / no-H3 discipline, by contrast, is **right** and the prototype validates it (GeoJSON layers worked cleanly in native units, no universal grid needed).

## Finding 4 — The two deferred tensions, field-tested by the prototype
- **Composite scores (Adam: never / Askja: narrative composites OK).** The prototype implemented threshold-*filtering* and **no** composite score, and it works — honest, legible, useful. Evidence supports Adam's no-composite stance. But it also exposes a flaw in the V1/V2 framing: the useful unit is *filtering* (user sets thresholds, system shows pass/fail), which is **neither a composite nor pure raw data**. The current binary wrongly bundles filtering *with* scoring+weighting in V2. **Recommend splitting them:** threshold-filtering (no weighting, no composite) is safe and high-value and could arrive earlier; composite scoring + weighting stays deferred and contested.
- **Weighting authority (Adam: user decides / Askja: framework defends the boring-but-critical).** The prototype's "surface, don't enforce" — show all criteria equally, let the user set thresholds, but let structure/copy foreground the load-bearing ones (water, legal) — is a working instance of the hybrid both positions can live with. Evidence supports it: surface criticality via hierarchy/warnings, never hard-enforce weights.

## Finding 5 — Scope and the ship-gate metric
- **Don't pre-commit to Europe.** The prototype ran the same pipeline over 10 North American regions with real data — NA was just as tractable. This is direct evidence for the Overview's own decision 3 (scope as emergent output), and against any Europe-only default.
- **The "≥70% coverage" ship gate is the wrong gate for the highest-value criterion.** Legal/ownership (Finding 1a) is inherently per-jurisdiction and qualitative — it has no raster "coverage %." A coverage-only gate structurally under-prioritises exactly the criterion that matters most. **Recommend** the ship gate distinguish raster-coverage criteria from per-jurisdiction qualitative ones, with a separate completeness measure for the latter.

---

## Placement map (once Gustaf owns it)
- 1a → attributed commentary under Overview decisions + Spec criteria table (#10).
- 1b → proposed new criterion in `criteria-inventory.md` + commentary on Spec Step 3 closure.
- 2 → commentary on Overview decision 6 + Open Q3; explicit "site ≠ community" caveat for the UI.
- 3 → commentary on Implementation Strategy sequence + "Where this document is wrong".
- 4 → commentary on the two Overview "V2/V3 design questions"; propose the filtering/scoring split.
- 5 → commentary on Overview decision 3 + Spec ship gate + Open Q5.
- Contribution-History row (r4 | @Gustaf | practitioner | summary) + drafted r5 Handoff Request.

## Still open for Gustaf
- Finding 2 is recorded as your stance; deepen with a concrete example if/when you want (optional, not blocking).
- Veto / correct any `[opinion]` you disagree with before these are placed into the source docs.
