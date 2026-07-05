# Context Pack — "Land Selection Framework as a product to sell" strategic analysis

> **READ THIS FIRST, THEN READ:** `CLAUDE.md`, `README.md`, `source-docs/Land Project v1 r4 Overview.md`, and skim `prototype/` and `data/land-standing.js`. This is an ANALYSIS-ONLY task. Do NOT modify any project files. Write ONLY your `product-strategy-analysis/MODE_OUTPUT_<MODE_ID>.md` file.

## The strategic question under analysis

Gustaf is "thinking about the Land Selection Framework bigger now — a product to sell, something valuable, professional, state of the art." This swarm's job is to reason about that from 10 distinct reasoning modes. **The stance is STRESS-TEST THE PREMISE FIRST**: is turning this into a product the right move at all — and if so, *what* product, owned by *whom* — before optimizing *how*. Do not assume productization is correct. Do not match Gustaf's enthusiasm; the lead agent has explicitly flagged enthusiasm-bias as the failure mode to avoid.

## What the project actually is

A shared **working-group project** building a geospatial database to help communities find land for regenerative settlements meant to flourish over 50–100 years. As of 2026-07 it was **repositioned as a "bioregioning tool for communities seeking to belong to a place and help it flourish," with reciprocity as the spine** — deliberately moved AWAY from "land selection / candidate regions / settler site-shopping."

- **State:** v1 r4 (r = collaboration round, v = implementation version). Governed by a strict versioned-document collaboration protocol (three markdown docs travel together; each contributor reads, adds perspective, updates a Collaboration Log, hands off).
- **The deployed thing** is a `prototype/` — a *designed communicative artifact* (dashboard: 20 hand-curated regions, threshold sliders, a 17-layer map, a per-region "Land standing" reciprocity block). It is explicitly **NOT the real V1 build** — it demonstrates what V1 will produce. Live at https://land-selection-framework.vercel.app
- **Real V1** (per the working-group docs) is "data ingestion only" — no querying, no scoring. It doesn't exist yet as infrastructure.

## Ownership reality (LOAD-BEARING — do not skip)

This is **NOT solely Gustaf's project.** Contributors:
- **Askja** — the **originator** (started it). Regenerative practitioner.
- **Adam McKent** — GIS architect (r1), provisioned a VPS.
- **Deca** — synthesizer (r3).
- **Monty** — academic researcher (named, not yet engaged).
- **Alaska** — data engineering (named, existence uncertain).
- **Gustaf** holds the **r4 practitioner-reality-check seat**. Accurate to say "it's mostly my project now / I hold the practitioner seat"; **NOT** accurate to say "I founded/originated it." Public authorship guardrail: credit **Askja as originator + the working group**.

Any "productize it" reasoning MUST treat the ownership/governance/consent question as real. A product built ON TOP of the framework that Gustaf owns is a different animal from selling the shared working-group project itself.

## Committed framework discipline (non-negotiables the docs bind everyone to)

1. **No composite scoring.** The user combines criteria themselves; "livability" scores are banned in V1, deferred to V2.
2. **No querying or scoring in V1** — ingestion only.
3. **Native units throughout** — no universal grid (no H3), MAUP-aware.
4. **State + trajectory per criterion** — each criterion has current value AND directional indicator.
5. **Source + vintage + license on every value** — always visible in UI.
6. **Adam-vs-Askja tensions are documented, not resolved.** Weighting authority, composite scores = deferred V2/V3.

A product that violates these breaks the framework's identity. The prototype's threshold sliders are "framework-legal" (they filter, they don't score); weight sliders would have secretly composed a composite and were deliberately rejected.

## Core substrate (identity test: "would removing X change what this project IS?")

The **framework layer is the identity and it is PORTABLE**: the criteria, the sovereignty axes, state+trajectory, the reciprocity dimension, MAUP-aware methodology, the taste and relationships. The **build wiring is TIED and dies with the stack**: MapLibre + specific tile services + Vercel edge functions + vanilla-JS state. Do NOT recommend abstracting away the framework/reciprocity identity — that IS the product. DO treat the Tied wiring as disposable.

## The reciprocity reframe (the central values tension for "sell it")

In July 2026 Gustaf spent real effort *de-commodifying* the tool: hero/subtitle/presets/region blurbs/meta all reframed to reciprocity-first; a per-region **"Land standing" dimension** (territory / tenure / entry / obligation — whose land, Indigenous nation + treaty/unceded status, what arriving asks of you) that is **qualitative and NEVER scored**; an ethics section naming specific Indigenous territories and stating "where arriving would harm the community already there, the honest answer is not there." Contacts were stripped to avoid a sales-y surface. There is a drafted (not-yet-appended) r4 practitioner contribution arguing the four existing "sovereignty axes" are all *settler self-sovereignty* and proposing a fifth **"host-community standing"** consideration.

**A "product to sell for finding land" risks re-commodifying exactly what was just de-commodified.** This contradiction is not a footnote — for several of you it is the finding.

## Deployment / market context (calibrate all severity to THIS, not worst-case)

- **Current users:** ~zero. It's a demonstration prototype + a working-group artifact. Pre-product.
- **Who would buy?** Unknown and unvalidated. Plausible segments: intentional-community founders, land trusts, regenerative-ag/ecovillage networks (GEN), climate-migration planners, HNW individuals/"apocalypse land" buyers (the Atlantic angle), rewilding/conservation orgs. Each has very different willingness-to-pay and different values-fit.
- **Comparable market:** geospatial siting / land-intelligence tools exist (Regrid, Land.id, LandGate, Cape Analytics, ESRI/ArcGIS, Placer, Ownwell) — mostly serving real-estate, ag, insurance, energy. Gustaf's differentiator is the *values frame* + *state+trajectory over 50–100 yr* + *reciprocity*, NOT raw geospatial tech (where incumbents dominate).
- **Builder:** solo (Gustaf), part-time, one of ~14 active projects. Prior lesson on this codebase: an ambitious "build V1 in miniature" raster approach FAILED (large downloads truncated, projection errors, half-built layers read as broken). The winning move was a *designed artifact*, not a data product.
- **Stage:** early. No revenue, no pricing, no customer discovery done.

## Known limitations (owner-acknowledged — do NOT present these as discoveries)

- Prototype ≠ V1; it's a communicative artifact.
- Hand-curated regional values are best-available midpoints, not authoritative data.
- Several climate/hydrology layers are honest gaps (no clean public tiles).
- Edge functions (@vercel/og) are a deliberate, scoped Tied dependency.
- The framework's real V1 ingestion infrastructure does not exist yet.

## Portability filter (Gustaf's global build rule)

Every build is tiered: **Portable** (survives substrate change — taste, frameworks, voice, relationships → invest), **Semi-portable** (pattern survives, wiring rots → document pattern), **Tied** (dies with substrate → time-box, treat disposable). "State of the art / product to sell" tends to demand Tied investment. Surface the tier of anything you recommend building.

## What "good" looks like for this analysis

Findings that are: specific, evidence-cited, calibrated to the real (tiny, pre-product, shared-ownership, values-laden) context, and honest about whether "product to sell" is even the right frame. A concrete next-day action per finding. Novel insight over restating the above. It is fully legitimate for your mode to conclude "productization is the wrong frame" or "this lens has limited applicability here" with reasoning.

## Output contract

Write `product-strategy-analysis/MODE_OUTPUT_<MODE_ID>.md` with these sections:
`# <Mode Name> (<Code>) Analysis` → **Thesis** (1 para) → **Top Findings** (5–8; each with §F<n> id, Evidence, Reasoning chain, Severity [calibrated to deployment context], Confidence 0–1, and "So What?" = concrete next-day action) → **Risks Identified** → **Recommendations** (each with Priority P0–P4, Effort, tier [Portable/Semi/Tied], benefit) → **New Ideas & Extensions** (scored incremental/significant/radical) → **Assumptions Ledger** → **Questions for Project Owner** → **Points of Uncertainty** → **Agreements & Tensions with Other Perspectives** → **Confidence** (0–1 + calibration note). Quality over quantity. Every finding cites specific evidence.
