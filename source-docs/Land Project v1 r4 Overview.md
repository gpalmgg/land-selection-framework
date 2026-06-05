## COLLABORATION PROTOCOL

> **This section is immutable. Do not modify it in any version of these documents.**

This package contains three files that travel together: **Overview** (this file), **Specifications**, and **Implementation Strategy**. Together they constitute a single versioned plan being developed asynchronously across multiple contributors.

**Two counters track the document's state:**
- **vN** — implementation version (what's being built; increments when the scope changes substantially)
- **rN** — collaboration round (how many times the documents have been passed to a new contributor; increments with each handoff)

---

**If you are a human reading this:**
Read the Handoff Request in the Collaboration Log below. It tells you what is being asked of you in this round. Then open these documents with an AI assistant — paste this Overview file in, and the AI will guide your contribution session.

**If you are an AI assistant reading this:**
Follow these steps in order:

1. **Identify the contributor.** Look at the Expected Contributors table in the Collaboration Log below. Ask the person you're working with: "Are you [list names from the table], or someone else?" If they confirm a listed name, note their role. If they are not on the list, ask for their name and a brief description of their relevant expertise or role in relation to this project.

2. **Read the Handoff Request.** It is the last section of the Collaboration Log and describes what is specifically being asked of the current recipient.

3. **Guide the contribution session.** Help the person engage with the Specifications and Implementation Strategy. Bring out their unique perspective: What do they know that the current documents don't reflect? What risks, alternatives, or dependencies do they see? Which open questions (especially those flagged with their name) can they answer? They may revise any section. Decisions marked `[COMMITTED]` should not be overwritten — add commentary directly below them instead, clearly attributed.

4. **Update the Collaboration Log.** At the end of the session, add a new row to the Contribution History table: round number, contributor name, role, and a 1–2 sentence summary of what they contributed or changed.

5. **Prepare the next Handoff Request (if applicable).** If the contributor knows who receives the documents next, help them write the next Handoff Request section before closing. If not, leave the section blank for the originator to fill in.

6. **Do not modify this section.**

---

## COLLABORATION LOG

**Implementation version:** v1
**Collaboration round:** r4

### Expected Contributors

| Name | Role / Expertise | What we need from them |
|------|-----------------|------------------------|
| @Monty | Regenerative academic research | Unique perspective on the project — criteria completeness, academic/literature gaps, methodology validation |
| @Gustaf | All-rounded thinker embedded in eco-villages | Unique perspective on the project — practitioner reality-check on criteria and priorities, what the field actually needs |
| @Alaska | Data engineering | Unique perspective on the project — feasibility of the data pipeline, ingestion architecture, tech stack considerations |

### Contribution History

| Round | Contributor | Role | Summary |
|-------|-------------|------|---------|
| r1 | @Adam | GIS architect | Produced the initial GIS Community-Finder Build Plan: proposed architecture (PostGIS + H3 + FastAPI + React/MapLibre), database schema sketch, and a set of non-negotiables (no composite scores, vintage + source per layer, data honesty in the UI). |
| r2 | @Askja | Regenerative land practitioner | Produced the Regenerative Land Selection Framework: 12-metric criteria inventory, named data sources per metric, state + trajectory two-axis scoring concept, and the Red Lines framework for absolute disqualifiers. |
| r3 | @Deca | Originator / synthesiser | Synthesised Adam's and Askja's contributions into a unified v1 plan: framing decisions with documented reasoning (native units over H3, strategy before stack, no V1 querying/scoring), criteria methodology, 11-step implementation strategy, and deferred V2/V3 design questions. |
| r4 | @Gustaf | Practitioner reality-check, embedded in eco-villages | Delivered a 5-finding field reality-check grounded in a 20-region demonstration build (EU + NA, 10+10), folded into a working V1 production run. Promoted Askja #10 (legal/ownership) to a first-class V1 Tier-1 layer with 20/20 jurisdiction completeness. Shipped **12 Tier-1 ingested layers** with metadata sidecars and GeoPackage exports (water_stress, water_depletion, conflict, regen_network, forest_change, legal_ownership, land_cost, hospital_proximity, demographic_trajectory, soil_contamination, water_source_control, climate_buffering). **All 6 red-line underlying datasets named in Overview decision 9 ingested.** Closed Overview decision 8.1's named climate-buffering features gap. Proposed three methodology refinements (Tier-1 vs Tier-2 honesty line; three-way completeness ship-gate metric; filtering/scoring split). Wired the V1 data into a public reach layer (per-region indexable pages, dynamic OG cards, dashboard qualitative-filter dropdowns). Demonstration prototype live at land-selection-framework.vercel.app. Detailed commentary added below; full deliverable set documented at `Docs/criteria-inventory.md`, `Docs/data-source-inventory.md`, `Docs/v1-data-priorities.md`, `Docs/coverage-report.md`, `Docs/v1-verification-notes.md`, `Docs/v1-shipped.md`, `Docs/v1-ship-candidate.md`. |

### Handoff Request [r4 → r5]

**To:** Open — @Monty, @Alaska, @Askja, @Deca, @Adam, or any other group member. No prescribed order.
**From:** @Gustaf (r4, practitioner reality-check seat).

**Round summary:** r4 delivered a practitioner reality-check grounded in evidence from a 20-region demonstration build (EU + NA), folded into a working V1 production run that shipped 12 Tier-1 ingested layers (all 6 red-line underlying datasets named in decision 9; Overview decision 8.1's climate-buffering features gap closed). Full attributed commentary appears below in this Overview, in Specifications, and in Implementation Strategy. A V1 ship-candidate proposal lives at `Docs/v1-ship-candidate.md` awaiting group ratification under propose-and-proceed. The demonstration prototype is live at land-selection-framework.vercel.app with per-region indexable pages, dynamic OG cards, dashboard qualitative-filter dropdowns, and a public reach layer.

**What r5 is asked to do:**

There is no single directed ask. The protocol's request stands: **bring your unique perspective to bear on what r4 produced.** Specifically valuable inputs from each named contributor (suggestive, not prescriptive):

- **@Adam** — react to (a) the proposed split of filtering from scoring/weighting (your no-composite stance is empirically validated by the prototype; the question is whether you accept early threshold-filtering as not-a-composite), and (b) the legal_ownership-as-first-gate framing for V2 query architecture.
- **@Askja** — react to (a) the promotion of #10 (Economic & Legal) to first gate status — does this fit your framework's intent? — and (b) `land_cost` and `climate_buffering` as new first-class criteria under the closure rule.
- **@Deca** — react to the V1 ship-candidate as a proposal to ratify, the Tier-1/Tier-2 honesty line, the three-way ship-gate metric refinement, and whether the demonstration-artifact track should be an explicit V1/V2 dual track.
- **@Monty** — fresh review against academic frameworks: anything still missing from the criteria inventory (Open Q3/Q4), gaps in the lessons-learned, methodology critique.
- **@Alaska** — react to the data-fetch wall lesson: is there a bulk-fetch path for the Tier-2 rasters (CMIP6, SoilGrids, GHSL, Global Solar Atlas) that the demonstration build couldn't reach? Architecture review of the loader / exports / v1-lookup module as the V1 data interface.

**Specific decisions waiting on group sync:**

1. **Ratify (or amend) the V1 ship-candidate** at `Docs/v1-ship-candidate.md`.
2. **Adopt or reject** the three methodology proposals (Tier-1/Tier-2 honesty, three-way ship-gate metric, filtering/scoring split).
3. **Confirm** the EU+NA scope (not Europe-only).
4. **Decide** whether `legal_ownership`, `land_cost`, and `climate_buffering` are formally adopted as first-class criteria under the closure rule (Spec Step 3); plus the per-jurisdiction qualitative pattern as a recognised Tier-1 ingestion mode.
5. **Decide** the next round's focus (V2 query-layer spec, V2 raster-fetch infrastructure, additional Tier-1 layers, or recruitment of the unengaged contributors).

**Open questions still owed by the group** (carried from r3, plus r4 additions):

- Original Open Qs 6 (GitHub repo setup), 7 (data-source scoring formulation), 8 (LLM-assisted sourcing comfort — partially answered this round by the legal_ownership/land_cost/climate_buffering extraction pattern with human-verifiable JSON intermediates).
- r4 addition: is the demonstration-artifact track an explicit V1/V2 dual-track, or do we wind it down once V1 ingestion is mature?
- r4 addition: response-window default of 5 working days — does the group agree, or set differently?

**Mechanism:** propose-and-proceed under the Implementation Strategy's "Group coordination" rule. The 5-working-day default response window applies; the r4 outputs stand as the working state unless the group objects, documented and reversible.

---

# Land Project — Overview

Working group building a shared geospatial database to find optimal locations for regenerative community settlements that aim to flourish 50–100 years out. The system surfaces relevant land/region attributes from public datasets in their native spatial units, with full source / method / vintage transparency.

This document covers the project as a whole: framing decisions and their justifications, V1 scope, mission, group context, and the open questions that need group input. Detailed specifications and implementation plans for V1 live in companion docs.

---

## Decisions and justifications

This project builds on two prior contributions from working-group members:

- **Askja's Regenerative Land Selection Framework** — provides the substantive starter set of criteria (12 core metrics), the named data sources for most of them, the **state + trajectory** two-axis scoring framework, and the *Red Lines* concept for absolute disqualifiers.
- **Adam's GIS Community-Finder Build Plan** — proposed a working architecture (PostGIS + H3 hexagons + a query system) and named several non-negotiables we keep, particularly the prohibition on composite "livability" scores, the requirement that every value carry vintage and source metadata, and the principle of data honesty in the UI.

This document is an **expansion** of both. Where Adam's plan gave us an architecture sketch and a set of non-negotiables, Askja's framework gives us a domain-grounded criteria inventory. Our role here is to synthesise both with a spatial-units / coverage-driven / no-V1-querying discipline that the prior writeups left underspecified. Each decision below is documented with reasoning so the group can challenge any of them.

### 1. Spatial units: native units throughout (not a fixed H3 grid)

Adam's plan picks H3 hexagons at resolution 7 (~5 km²) as the universal analytical key, with res-6 and res-5 roll-ups for coarser views. We are instead preserving each dataset's native spatial units (LSOAs, communes, NUTS-3, raster cells, etc.) and only crossing unit boundaries when a specific analysis demands it.

The relevant academic concept is the **Modifiable Areal Unit Problem (MAUP)** — a foundational issue in spatial analysis. MAUP has two effects: (a) the *scale effect*, where statistical results change with level of aggregation; (b) the *zoning effect*, where results change with how zones are configured at the same scale. The literature is clear that MAUP is essentially unsolvable; you can only manage it. Best practice (Wong 2004; Comber 2019; multiple SAGE Handbook contributions) is:

- **Native units, with transparency on scale and source.**
- **Multi-scale reporting** where applicable.
- **Sensitivity analysis** when conclusions are scale-dependent.
- **Principled interpolation** (e.g. dasymetric mapping) only when crossing unit systems is unavoidable.

Forcing all data into one arbitrary grid pre-commits to a specific MAUP risk profile (the scale effect at res 7 is locked in) and accumulates aggregation error before any analysis runs. Native units preserve information and let downstream analyses make explicit, justified choices about unit handling. This also matches a broader trend in modern urban-planning literature of moving *beyond* admin boundaries via data-driven (functional) units rather than forcing data into pre-set boundaries.

### 2. Strategy before implementation

Adam's plan picks a tech stack (PostgreSQL + PostGIS + h3-pg + Prefect + FastAPI + React/MapLibre), a database schema, a phased build plan, and a list of "first concrete tasks" — before establishing what data we actually need or what V1 actually does. We are inverting the order:

1. Define what we want to know (criteria).
2. Identify candidate data for each criterion.
3. Fetch what's tractable in priority order.
4. Let scope and tech stack emerge from what the data actually supports.

This is slower at the start and faster overall. Premature commitment to a stack risks rebuilding when we discover, for instance, that key criteria live in formats the chosen stack handles poorly.

### 3. Scope is an output, not an input

Adam's plan fixes the geographic scope at "Europe only, initial build." We do not pre-commit to a region. V1 ships when we have raw-layer ingestion of enough data sources to meet a coverage threshold (e.g. 70% European coverage of 3 high-priority criteria, or some equivalent — exact thresholds set during Phase 1) — geography is whatever the data lets us cover. This avoids committing to data work for a region only to discover key sources are unavailable, and keeps the V1 ship gate honest.

### 4. No querying or scoring in V1

Adam's plan includes a query builder (filters, ranges, ranking) as a Phase 2 deliverable. We are excluding all query / filter / scoring logic from V1.

V1 is a clean view of raw and processed data in native units, exportable to Jupyter / QGIS, with full source / method / vintage transparency. Querying, scoring, and weighting are V2 concerns. This reflects two principles: filtering decisions belong with the user, not the system; and a tool that displays data honestly is more useful than one that obscures it behind premature scoring.

### 5. Two-layer architecture

- **Raw layer**: each dataset in its native spatial unit, with absolute values, untouched. Source of truth. Carries source, vintage, native unit, license, and notes as metadata on every dataset.
- **Processed layer**: cleaned, validated, format-standardized. Stays in native units unless a different unit is justified for a specific dataset (with reasoning documented). No user preferences applied. No filters. No scoring.
- **Display (V1)**: render the processed data simply on a map, or export to Jupyter / QGIS. No query system.

User-facing logic (filters, weights, scoring functions, search) is V2's potential query layer, not part of V1's data architecture.

### 6. Subjective dimensions out; objective-but-hard-to-measure dimensions in

Two distinct cases that are easy to conflate:

- **Subjective** (vibes, aesthetic resonance, personal cultural fit, language preference, what the landscape feels like): out of V1. These don't live in datasets, and including a subjective-annotation system would be a significant architectural commitment with limited V1 value.
- **Objective but hard to measure** (existing regenerative-knowledge-network density, ecovillage / permaculture-farm presence, civil-society openness to newcomers, land-use history of an area): in V1 if data is gettable. The group has access to relevant directories and contacts that make some of this tractable; we treat it as hard data.

In Askja's terms: her metric #12 (*Cultural & Lifestyle Fit*) is subjective, deferred. Her metric #3 (*Existing Regenerative Knowledge Network*) is objective, in scope, treated as hard data alongside climate, water, soil, etc.

### 7. Sovereignty as four axes (not collapsed)

The "Sovereign Land Protocol" framing implies sovereignty is a primary axis. In criteria discovery, we treat it as four distinct axes — not collapsed into one composite:

- **Geopolitical**: state stability, alliances, conflict risk.
- **Legal**: property rights, regulatory environment, freedom from interference.
- **Material**: food / water / energy independence at the regional level.
- **Social**: community self-governance, surveillance, cohesion.

Each maps to different data sources and is treated as a separate axis through the inventory.

### 8. Time horizon per criterion (not universal); state + trajectory as standard

A 50–100 year planning horizon means projection matters as much as current state. But projections vary wildly in reliability across criteria. Each criterion gets its own time framing — chosen by what's most decision-relevant for that criterion and what data is available.

Following Askja, the canonical two-axis description of every criterion is **current state** (a value or range) plus **trajectory** (stable / improving / declining / volatile). Where credible projections exist, the trajectory axis is filled by an explicit forward-looking estimate; where they don't, by an observed recent trend; where neither is meaningful, the trajectory axis is left null and only state is recorded.

Examples:

- Mean annual temperature: state = current value; trajectory = projection to 2050/2100 (CMIP6).
- Forest cover: state = current %; trajectory = 20-year trend (Hansen).
- Geopolitical risk: state = current index; trajectory = e.g. Dalio-style empire-cycle position.
- Soil composition: state only; trajectory not meaningful at the timescales we care about.

The rule is "research per criterion." There is no universal time horizon.

### 9. Red lines: data in V1, filtering in V2

Askja's framework defines *Red Lines* — absolute disqualifiers (active conflict within 200km, no hospital within 60 minutes, water deficit projection by 2050, soil contamination requiring 5+ years remediation, anti-collective-ownership law, single-entity water control) applied before scoring.

These are valuable but they are **filtering logic**, which V1 does not implement. V1's job is to fetch and surface the **underlying data** any red-line analysis would need: conflict-zone locations, hospital proximity, climate water-deficit projections, soil-contamination registers, legal-ownership rules per jurisdiction. The user (or V2's query layer) applies their own red lines to that data.

Consequence: the data points implied by Askja's red lines are explicitly **in scope** for V1 ingestion. The red-line *filtering* is V2.

---

## Mission

Many people, individually and in groups, are trying to find land for community projects with intentions extending decades into the future. This is not typical real estate shopping. Specifically:

- **The geographic search scope is wide** — whole continents or more. Location is determined by attributes of the land and surroundings, not pre-given constraints.
- **Many relevant criteria are difficult to determine from listings** — climate trends, soil quality, geopolitical sovereignty, ecological resilience.
- **Investments are large and long-term**, so finding the right place matters disproportionately.
- **Many criteria are shared across people doing this work**, so a shared tool reduces aggregate effort substantially.

**You choose once.** Land purchases are infrequent and high-impact. The cost of getting it wrong — moving, re-buying, re-establishing community — is enormous. The tool's role is to support a decision that needs to be right the first time, not to support quick browsing.

The goal is a database and (eventually) a search interface providing consolidated access to as many relevant dimensions of geographic data as possible.

---

## V1 scope

V1 is open-source, open-data, low-cost, and not a commercial product. It is a tool for serious land-seeking groups to share. V1 is **not an MVP** in the "minimum viable" sense — it is V1 in a series intended to grow over time. The aim is a coherent, useful artifact, not a deliberately crippled prototype.

### V1 ship gate

V1 ships when:

- Many candidate data sources have been fetched into the raw layer in their native units.
- Some minimum coverage threshold is met for a small set of high-priority criteria. Illustrative target: ≥ 3 criteria with ≥ 70% European coverage. Exact thresholds set during v1 work, once data availability is mapped.
- Each chosen criterion is fully processed (cleaned, validated, format-standardized) in the processed layer.
- All processed values carry source, vintage, and native-unit metadata.
- Data is exportable and viewable in Jupyter and QGIS.

### Out of scope for V1

- Query builder / filter / search.
- User-defined scoring or weighting.
- Web UI beyond simple map rendering of single layers.
- Cross-unit interpolation between datasets.
- Subjective dimensions (Askja's #12 *Cultural & Lifestyle Fit* — language fit, aesthetic, vibes, spiritual exchange).
- Parcel-level / on-site data (Askja's Layer 3 — sensors, soil kits, walking observations). V1 stays at regional / global scale.
- Red-line *filtering* (the underlying data is in scope; applying disqualifiers is V2).
- Composite metrics — both "livability" scores and Askja's "System Coherence Score" #8. V2/V3 design question (see below).
- Tech-stack pre-commitments beyond what's strictly needed for ingestion.

---

## V1 → V2 → V3 trajectory (illustrative, not committed)

- **V1**: raw ingestion + processing of a small set of high-coverage criteria + Jupyter / QGIS exports. State + trajectory recorded per criterion where data supports it.
- **V2**: expand layer coverage; introduce a query layer with user-defined weights, per-criterion preference functions (hard cutoffs at extremes, soft weights within ranges, per-user configuration), and **red-line filtering** (Askja's hard disqualifiers); resolve the deferred V2/V3 design questions on composite scores and weighting authority (see below); basic web UI.
- **V3**: explicit sensitivity analysis tooling, group-collaborative annotation, **parcel-level / on-site integration** (Askja's Layer 3: sensors, soil kits, walking observations), cosmolocal data sovereignty considerations (community-controlled storage, mirrored datasets across settlements).

V2 and V3 are sketches to anchor V1's scope. They are not committed.

---

## V2/V3 design questions deferred (open tensions)

Two real philosophical disagreements between Adam's plan and Askja's framework. **Both are about how processed data is presented to and used by the end user — Phase 3 in our data flow. They do not affect V1.** Resolution is deferred until V2 design. We document both viewpoints so neither is lost.

### Composite scores

- **Adam's position (kept in V1 as out-of-scope):** never build a composite "livability score." Users combine criteria themselves. Composite scores collapse heterogeneous values and obscure trade-offs.
- **Askja's position:** a single composite question can be a *practical assessment* even if a numeric score isn't. Her "System Coherence Score" (#8) asks "can this location plausibly achieve closed-loop food, water, and energy within 10 years using only resources within 50km?" — integrating metrics 4, 5, and 7 into a domain-specific feasibility question rather than a generic livability score.

Both viewpoints have merit. V2 needs to decide whether to support narrative-question composites (Askja-style), reject all composites (Adam-style), or distinguish *narrative questions* from *numeric scores* (allow the former, ban the latter).

### Weighting authority

- **Adam's position (kept in V1 as out-of-scope):** users weight their own criteria. The system is transparent and lets the user decide.
- **Askja's position:** some criteria are non-negotiable baseline (climate trajectory, water trajectory, political stability, red lines) — not subject to community weighting. *Groups naturally weight toward what feels good (beauty, culture) and underweight what is boring but critical (legal, water projections, soil history). The framework should resist this.*

Both positions have merit. Adam's view honours user agency; Askja's view addresses a documented psychological pattern. V2 needs to decide between: pure user agency (Adam), framework-enforced baseline (Askja), or a hybrid where the framework *surfaces* which criteria are widely considered non-negotiable (visual hierarchy, "critical" tags, warnings) without *enforcing* them.

Neither tension affects V1, which neither scores nor weights. They are recorded here so V2 design starts from a clear statement of both viewpoints.

---

## Phase structure

- **V1 (this version)**: raw-layer ingestion and processing. Detailed in `Land Project v1 Specifications.md` and `Land Project v1 Implementation Strategy.md`.
- **V2 (not yet specified)**: cross-criterion analysis, querying, scoring. Adam's plan covers this ground at an architecture level; we will revisit specs once V1 lands.
- **V3 (not yet specified)**: user-facing tooling beyond Jupyter / QGIS export.

The phases are not strictly sequential. V1 work has thin probes into V2 and V3 (we need just enough of each to make V1 decisions sensibly), but full V2/V3 specification is deferred.

---

## Group context

This is a working group — async, distributed, collaborative. Each member contributes the skills they have. Adam produced the first GIS architecture writeup; Askja produced the substantive land-selection framework; this set of documents synthesises both.

**Coordination model**: post in chat → wait for responses → iterate.

**Canonical location for documents going forward**: a shared GitHub repository with a `Docs/` folder. All markdown files (including this one) live there. The criteria/data sheet originally started in Drive is **superseded** by this repo — single source of truth, no drift between sheets and markdown.

**On Adam's plan**: it remains a useful reference, particularly the database schema sketches and the "non-negotiables" list. Several non-negotiables are inherited verbatim into V2's eventual query design (no composite scores; vintage and source per layer; never imply more precision than the source has). The expansion documents do not invalidate Adam's contribution; they reorder the work.

---

## Open questions for the group

These are explicit asks before V1 work locks in.

### Framing

1. Do you agree with the framing decisions in the section above? Where do you disagree?
2. Anything missing from the V1 ship gate that should be there? Anything in it that shouldn't be?

### V1 inputs

3. **Top-level criteria categories** — Askja's framework gives us 12 metrics as the starter set. Anything to add (gaps), drop (irrelevant for V1), or restructure (better grouping)? Specifically: sovereignty appears in Askja as part of #1 (Geopolitical & Institutional Resilience); we earlier proposed treating it as four cross-cutting axes (geopolitical, legal, material, social). Worth confirming whether we layer the four-axis decomposition over Askja's structure as a tagging scheme, or simplify into Askja's structure directly.
4. **Bottom-up framework supplementation** — Askja's framework is our primary bottom-up source. What additional frameworks fill gaps for criteria she may have under-covered? (Deca: Dalio Power Index, AMOC literature, macro-history. Adam: GIS-domain criteria not in Askja's set. Others: domain-specific contributions welcome.)
5. **V1 coverage threshold** — illustrative is "≥ 3 criteria, ≥ 70% European coverage." Should we set tighter or looser numbers? Should "European" be the right scope, or should we leave geography fully emergent?

### Tools and process

6. **Empty GitHub repo** — who sets it up? Is "Docs/" the right initial structure? Naming convention for repo?
7. **Scoring approach for data sources** — the plan currently uses relevance × gettability × coverage. Better formulations welcome.
8. **LLM-assisted data-source identification** — comfortable with using LLMs to surface candidate datasets, with manual verification? Or fully manual?

---

## r4 Commentary (@Gustaf, practitioner reality-check, 2026-05-29)

**Provenance:** this commentary is grounded in evidence from a 20-region demonstration build (Europe + North America, 10+10 regions, sourced per-region dossiers, a live filtering dashboard, and 12 ingested Tier-1 V1 layers shipped this round). Points that are judgment rather than evidence are marked `[opinion]`. Nothing here overwrites the `[COMMITTED]` decisions above; it is additive commentary as the protocol requires.

### On Decision 1 (native units, no H3 grid)
**Validated by the prototype.** Twelve Tier-1 layers shipped in native units across EU + NA with no universal grid forced. Aqueduct kept its HydroBASINS Level 6 polygons; UCDP kept its event points; OSM regen + hospital points stayed points; per-jurisdiction qualitative layers stayed per-jurisdiction. No analysis broke. The MAUP discipline holds in practice. Keep as written.

### On Decision 3 (scope as emergent output, not Europe-only default)
**Validated empirically.** Same pipeline ran over 10 North American regions with real data. NA was just as tractable as EU. Direct evidence against any Europe-only default. r4 ships at EU + NA; V1 scope should not revert.

### On Decision 6 (subjective out, objective-but-hard-to-measure in)
The split is defensible, but one practitioner caveat: communities die from social failure (governance breakdown, founder/member conflict, succession failure over decades) as much as from physical constraints. The objective proxies in scope (#3 regen-network density) measure *availability*, not *viability*. The tool predicts **site** suitability, not **community** success — different things. V1/V2 should state this honestly and never imply it forecasts the social outcome. `[opinion, but conservative]`

### On Decision 8 (state + trajectory per criterion)
**Embraced and extended.** Climate_buffering shipped this round as a paired state + trajectory layer per region (structural buffering features as state; trajectory_under_warming as the dynamic). The framing is right and reusable. Note: 13 of 20 regions show "worsening" trajectory under warming, zero show "improving" — the directional signal is itself a contribution.

### On Decision 9 (red lines: data in V1, filtering in V2) and Open Q9-adjacent
**All 6 red-line underlying datasets are now ingested.** Active-conflict (UCDP), water-deficit-2050 (Aqueduct), collective-ownership-legality (legal_ownership compile), hospital-60-min (OSM proxy at 50 km geodesic; true road-isochrones deferred to V2), soil-contamination-needing-5yr-remediation (thin per-region layer with honest data_confidence; V2 to integrate national registers like BASIAS/BASOL/Bundes-Bodenschutzgesetz/EPA Superfund), single-entity-water-control (per-jurisdiction layer; 1 high-risk: Kootenays' prior-appropriation; 5 moderate, 14 low; community_commons regimes score lowest). V2's red-line filtering layer now has its full data foundation in place.

### On the two V2/V3 design questions (composite scores; weighting authority)

**Composite scores — Adam's no-composite stance is empirically validated, but the V1/V2 framing has a flaw worth fixing.** The prototype implemented threshold-*filtering* (user sets a max acceptable water-stress; system shows pass/fail per region) and **no** composite score — and it works, is honest, legible, useful. The user combines criteria themselves. *But* threshold-filtering is **neither a composite nor pure raw data.** It is a third unit the current V1/V2 wall wrongly bundles into V2. **Proposal:** split filtering from scoring/weighting. Threshold-filtering can arrive at V1.5 / early-V2 (it is safe — no weights, no composites). Composite scoring + weighting stays deferred and contested as Adam/Askja have it.

**Weighting authority — the prototype shows a working hybrid.** "Surface, don't enforce": render all criteria equally; let the user set thresholds; let copy and visual hierarchy foreground the load-bearing ones (water trajectory, legal feasibility, climate buffering). V2 design can start from this evidence rather than the binary.

### Open Q3 (criteria gaps / additions to Askja's 12) — r4 answers

**Three new first-class criteria proposed and shipped as Tier-1 ingested layers** (so the group can react to concrete data, not abstractions):

- **`legal_ownership`** (was buried inside #10). The 20-region evidence shows legal/tenure is the **first gate** — the decisive, frequently disqualifying constraint, more often than soil, climate, or water. SAFER pre-emption >0.7 ha (Cévennes); Maso Chiuso partition ban (South Tirol); ejido/comunal + usos y costumbres (Oaxaca); OPD/TAN 6 65%-subsistence gate (Pembrokeshire); foreign-buyer ban + 50% PNP cut (Nova Scotia); ALR one-residence (Kootenays); CPTAQ Bill 86 2025 (Québec); e-Residency ≠ land right (Estonia); active-farmer pre-emption (Saxony-Anhalt); minifundio 30+-heir title tangle (Galicia). **Only 1 of 20 regions** allows multi-household residence as-of-right (Ozarks); 7 are in *tightening* regulatory direction; **zero loosening.** Promote #10 to primary gate.
- **`land_cost`** (currently inside #10). Behaves as an independent binding constraint that kills projects before other criteria matter (Cascadia 3-5x Alentejo baseline; Appalachian regen-premium; BC ALR pricing). State + trajectory: cost/ha plus appreciation rate. Of 20 regions, 15 are rising or rising_fast; only 1 volatile (Kootenays' fruit-sector contraction); zero stable-cheap. Promote as a standalone criterion.
- **`climate_buffering`** (Decision 8.1's explicit gap-candidate). Structural microclimate features (altitude, coastal moderation, mountain shelter, forest canopy, valley inversion, peat water storage) paired with their dynamic erosion under warming. 5 very_high + 5 high (Connemara, Oaxaca Sierra Norte, South Tirol, Asturias, Nova Scotia); 2 very_low (Alentejo, Saxony-Anhalt). Closes Decision 8.1's gap explicitly.

Plus four supporting per-jurisdiction layers shipped this round to round out the V1 set: `hospital_proximity` (under Askja #9), `demographic_trajectory` (under #1, the Spec Step 1 named gap-candidate), `soil_contamination` (under #5), `water_source_control` (under #4). All twelve Tier-1 layers carry standard metadata sidecars and GeoPackage exports.

### Open Q5 (V1 coverage threshold; Europe-only?) — r4 answer

**The "≥70% coverage" threshold structurally under-prioritises the highest-value criterion.** Legal/ownership is inherently per-jurisdiction and qualitative — it has no raster "coverage %." A single-percent areal gate fails it by construction. **Proposal:** the ship gate should adopt a **three-way completeness measure**:

1. **Areal coverage** (rasters / basin polygons) — current "% of scope covered at native resolution" applies. Gate ≥70%.
2. **Presence completeness** (events, sites) — measure differently (e.g. source-completeness ratio vs reference, or "ingested with documented coverage limitation"). UCDP and OSM/GEN are ingested under this mode.
3. **Per-jurisdiction completeness** (legal_ownership, land_cost, climate_buffering, water_source_control, soil_contamination, demographic_trajectory, hospital_proximity) — "% of in-scope jurisdictions with a recorded value." Most r4 layers cleared 100% (20/20); soil_contamination is honestly thin with explicit `data_confidence: low/unknown` per region where the dossier was silent.

Under this metric, V1 ships at **12 Tier-1 criteria** across the three modes — well above any reasonable gate, scope EU+NA.

### Additional r4 methodology refinements (proposed for adoption)

- **Tier-1 / Tier-2 honesty line:** Tier-1 = real ingested layer with measurable completeness, counted toward the ship gate. Tier-2 = curated/demonstration values, **explicitly not counted as ingested coverage** (the four blocked raster criteria — climate-as-temperature, soil_carbon, solar_pv, population — remain Tier-2 in V1). Carry this as a hard discipline so coverage claims stay honest.
- **`data_confidence` per-feature pattern** (high/medium/low + a `gaps` field) for any per-jurisdiction qualitative layer with uneven evidence — proven on land_cost (17 high / 2 medium / 1 low) and soil_contamination (deliberately thin). Surfaces sparsity rather than hiding it.
- **Proxy-vs-true-metric honesty pattern** — when V1 can ship a useful approximation (e.g. 50 km geodesic distance standing in for a 60-minute road isochrone), do so with the caveat recorded per-feature *and* in the layer's metadata sidecar. V2 refines to the true metric. Hospital_proximity ships this way.
- **LLM-assisted extraction with a human-verifiable JSON intermediate** (per Spec Step 4) — the pattern that worked five times this round. The JSON is the human-verifiable artifact; a single generic `scripts/compile_per_jurisdiction.py` consumes JSON + sidecar and emits GeoJSON. Adding the next per-jurisdiction layer requires only a JSON + sidecar, no new code.
- **Regional dossiers as a Step-4 sub-deliverable** — writing per-region research dossiers (legal.md / regen.md / water.md / climate.md / accessibility.md / stability.md / soil.md / energy.md per region) wasn't planned as V1 ingestion mechanism, but the dossiers were source-cited and rigorously per-region, which made them *directly compilable into V1 layers.* Formalising "regional dossier" as a recognised Step-4 input would surface gettable sources that desk-research alone misses.

### Public demonstration artifact

A consequence of choosing the demonstration-first paradigm (after large global raster fetching failed early): the prototype became a real public surface at **land-selection-framework.vercel.app** carrying twenty per-region indexable pages, dynamic share cards reflecting current filter state, a working filtering dashboard with both threshold sliders and qualitative-filter dropdowns wired to the V1 data, a region detail drawer, a star/shortlist + compare flow, and full per-cell source attribution throughout. This is `[opinion]` — but the recommendation is to keep the public artifact alongside V1 ingestion as an explicit V1/V2 dual track, not wind it down. The public surface gives the working group something concrete to point at between [GROUP] sync gates and gives the data an audience.

---

## Document map

- `Land Project Overview.md` — this file.
- `Land Project v1 Specifications.md` — what V1 produces and the methodology behind it.
- `Land Project v1 Implementation Strategy.md` — chronological plan of execution, manual vs automated tasks, group sync points.
- `Adam's GIS Community-Finder Build Plan.md` — Adam's original writeup; useful reference for V2 architecture work.
- `Askja's Regenerative Land Selection Framework.md` — Askja's framework; primary source of the V1 criteria starter list, named data sources, and state + trajectory scoring concept.

---

## References

- Wong, D. W. S. (2004). *The Modifiable Areal Unit Problem (MAUP)*. SAGE Handbook of Spatial Analysis. https://blogs.ubc.ca/advancedgis/files/2020/09/Wong2004_Chapter_TheModifiableArealUnitProblemM.pdf
- Comber, A. (2019). *Spatial interpolation using areal features: a review of methods and opportunities using new forms of data with coded illustrations*. Geography Compass. https://compass.onlinelibrary.wiley.com/doi/full/10.1111/gec3.12465
- *Modifiable areal unit problem* — Wikipedia overview. https://en.wikipedia.org/wiki/Modifiable_areal_unit_problem
- *A data-driven approach to urban area delineation using multi-source geospatial data*. Scientific Reports (2025). https://www.nature.com/articles/s41598-025-93366-x
- Eicher & Brewer (2001). *Dasymetric Mapping and Areal Interpolation: Implementation and Evaluation*. Cartography and GIS. https://www.tandfonline.com/doi/abs/10.1559/152304001782173727
