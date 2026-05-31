> **SUPERSEDED** — content was placed into source-docs/Land Project v1 r4 Overview.md (as the Handoff Request [r4 -> r5] block, replacing the previous Handoff Request [r3 -> r4]) on 2026-05-29. This file is kept as historical record of the staged draft, not as source-of-truth. To act on the round, read the placement target above instead.

---

# Handoff Request [r4 → r5] (DRAFT)

**Status:** DRAFT for @Gustaf's review. Replaces the existing r3→r4 Handoff Request block in `source-docs/Land Project v1 r3 Overview.md` ONLY after Gustaf approves and places it himself.

---

**To:** Open — @Monty, @Alaska, @Askja, @Deca, @Adam, or any other group member. No prescribed order.
**From:** @Gustaf (r4, practitioner reality-check seat).
**Round summary:** r4 delivered a practitioner reality-check grounded in evidence from a 20-region demonstration build (EU + NA), folded into a working V1 production run. Outputs: attributed commentary across the three docs (see `r4-contribution.draft.md`), a V1 ship-candidate (see `v1-ship-candidate.draft.md`), and the Tier-1 processed-layer set documented at `Docs/criteria-inventory.md`, `Docs/data-source-inventory.md`, `Docs/v1-data-priorities.md`, `Docs/coverage-report.md`, `Docs/v1-verification-notes.md`, `Docs/v1-shipped.md`.

---

## What r4 produced

- **5 findings** in the practitioner reality-check (criteria weighting; site-suitability ≠ community-survival; pipeline coordination-overhead risk; field-tested view on the two deferred tensions; scope and the ship-gate metric).
- **6 Tier-1 V1 criteria** ingested with metadata: legal_ownership (per-jurisdiction, 20/20), water_stress, water_depletion, conflict, regen_network, forest_change (tiles). Ship gate met with margin.
- **Two r4 proposals** for the criteria inventory: `legal_ownership` promoted to first-class (delivered as a Tier-1 layer this round); `land_cost` proposed as the next addition (not yet ingested).
- **Three methodology refinements** proposed: the Tier-1/Tier-2 honesty line; the three-way completeness ship-gate metric; the filtering / scoring split in the V1→V2 boundary.

## What r5 is asked to do

There is no single directed ask. The protocol's request stands: **bring your unique perspective to bear on what r4 produced.** Specifically valuable inputs from each named contributor:

- **@Adam** — react to (a) the proposed split of filtering from scoring/weighting (your no-composite stance is empirically validated by the prototype; the question is whether you accept early threshold-filtering as not-a-composite), and (b) the legal_ownership-as-first-gate framing for V2 query architecture.
- **@Askja** — react to (a) the promotion of #10 (Economic & Legal) to first gate status — does this fit your framework's intent? — and (b) the `land_cost` candidate as a new first-class criterion.
- **@Deca** — react to the V1 ship-candidate write-up as proposal-to-ratify, the Tier-1/Tier-2 honesty line, and whether the three-way ship-gate metric is the right refinement.
- **@Monty** — fresh review against academic frameworks: anything still missing from the criteria inventory (Open Q3/Q4), gaps in the lessons-learned, methodology critique.
- **@Alaska** — react to the data-fetch wall lesson: is there a bulk-fetch path for the Tier-2 rasters (CMIP6, SoilGrids, GHSL, Global Solar Atlas) that the demonstration build couldn't reach? Architecture review of the loader / exports as the V1 data interface for the group.

## Specific decisions waiting on group sync

1. **Ratify (or amend) the V1 ship-candidate** (`v1-ship-candidate.draft.md` in the r4 plan dir, intended for promotion into a `Docs/v1-shipped.md` decision section).
2. **Adopt or reject** the three methodology proposals (Tier-1/Tier-2 honesty, three-way ship-gate metric, filtering/scoring split).
3. **Confirm** the EU+NA scope (not Europe-only).
4. **Decide** whether `legal_ownership` is adopted as a first-class criterion under the closure rule (Spec Step 3), and whether `land_cost` follows.
5. **Decide** the next round's focus (Phase-4 extension into hospital-proximity / soil-contamination, or V2 spec work, or recruitment of the unengaged contributors).

## Open questions still owed by the group (carried from r3, plus r4 additions)

- Original Open Qs 6 (GitHub repo setup), 7 (data-source scoring formulation), 8 (LLM-assisted sourcing comfort — partially answered this round by the legal_ownership extraction pattern).
- r4 addition: is the demonstration-artifact track an explicit V1/V2 dual-track, or do we wind it down once V1 ingestion is mature?
- r4 addition: response-window default of 5 working days — does the group agree, or set differently?

## Logistics

- Repo / canonical-location decision (Open Q6) is still pending. The r4 round produced files at `Docs/` (project root) and `prototype/` (existing structure); whoever sets up the GitHub repo decides whether to keep that layout or restructure.
- Contribution-History row to add to the Overview Collaboration Log (proposed wording):

  | r4 | @Gustaf | Practitioner reality-check | Delivered a 5-finding field reality-check grounded in a 20-region demonstration build (EU + NA), promoted Askja #10 (legal/ownership) to a first-class V1 Tier-1 layer with 20/20 jurisdiction completeness, formalized the prototype's processed data into the Spec V1 deliverable shapes (6 Tier-1 criteria, ship gate met with margin), and proposed three methodology refinements (Tier-1/Tier-2 honesty line, three-way ship-gate metric, filtering/scoring split). |
