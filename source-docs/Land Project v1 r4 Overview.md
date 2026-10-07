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
| r4 (addendum, 2026-10) | @Gustaf | Practitioner reality-check | Added a reciprocity / host-community-standing finding: all four of Decision 7's sovereignty axes describe the *incoming settlers'* sovereignty, with no axis for the standing of those already rooted in a place (Indigenous nations across the NA slate — Mi'kma'ki, Sinixt/Ktunaxa/Syilx, Zapotec/Mixtec/Chatino — and rooted rural communities/commons in Europe). Names the green-colonialism failure mode and proposes, additively (no overwrite of Decision 6 or 7): (a) a fifth V2 criteria-discovery consideration, "host-community standing," as a qualitative dimension only — never a composite or score, per Adam's rule; and (b) a V1-legal move to surface land-tenure / territory / "what arriving asks" as visible per-region qualitative context, which the deployed prototype now does. Evidence-grounded 2026-07-04 and updated 2026-10 as the demonstration slate grew from 20 to 30 regions, each with a sourced Land standing entry, a legal pathway block and bioregion context; none of this changes any [COMMITTED] decision. Appended 2026-10-05; no files renamed, counters unchanged (still v1 r4); the group has not yet picked up the r4 to r5 handoff. Drafted by Claude for @Gustaf and appended on his standing go-ahead, before he had read it. |

### Handoff Request [r4 → r5]

**To:** Open — @Monty, @Alaska, @Askja, @Deca, @Adam, or any other group member. No prescribed order.
**From:** @Gustaf (r4, practitioner reality-check seat).

**Round summary:** r4 delivered a practitioner reality-check grounded in evidence from a 20-region demonstration build (EU + NA), folded into a working V1 production run that shipped 12 Tier-1 ingested layers (all 6 red-line underlying datasets named in decision 9; Overview decision 8.1's climate-buffering features gap closed). Full attributed commentary appears below in this Overview, in Specifications, and in Implementation Strategy. A V1 ship-candidate proposal lives at `Docs/v1-ship-candidate.md` awaiting group ratification under propose-and-proceed. The demonstration prototype is live at land-selection-framework.vercel.app with per-region indexable pages, dynamic OG cards, dashboard qualitative-filter dropdowns, and a public reach layer.

**Addendum to the round summary (@Gustaf, 2026-10-05):** r4 also delivered the reciprocity addendum below ("r4 Commentary — Addendum: Reciprocity & host-community standing"). The demonstration now carries 30 regions, each with a Land standing entry, a legal pathway block and bioregion context, none of it ratified by the group. The portable statement of the framework discipline now exists as `FRAMEWORK.md`, offered as a proposal and not part of these source-docs. The r4 to r5 handoff has been open since 2026-05-29 without a recorded response. (added 2026-10-05, r4 addendum)

Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.

**What r5 is asked to do:**

There is no single directed ask. The protocol's request stands: **bring your unique perspective to bear on what r4 produced.** Specifically valuable inputs from each named contributor (suggestive, not prescriptive):

- **@Adam** — react to (a) the proposed split of filtering from scoring/weighting (your no-composite stance is empirically validated by the prototype; the question is whether you accept early threshold-filtering as not-a-composite), and (b) the legal_ownership-as-first-gate framing for V2 query architecture.
- **@Askja** — react to (a) the promotion of #10 (Economic & Legal) to first gate status — does this fit your framework's intent? — and (b) `land_cost` and `climate_buffering` as new first-class criteria under the closure rule.
- **@Deca** — react to the V1 ship-candidate as a proposal to ratify, the Tier-1/Tier-2 honesty line, the three-way ship-gate metric refinement, and whether the demonstration-artifact track should be an explicit V1/V2 dual track.
- **@Monty** — fresh review against academic frameworks: anything still missing from the criteria inventory (Open Q3/Q4), gaps in the lessons-learned, methodology critique.
- **@Alaska** — react to the data-fetch wall lesson: is there a bulk-fetch path for the Tier-2 rasters (CMIP6, SoilGrids, GHSL, Global Solar Atlas) that the demonstration build couldn't reach? Architecture review of the loader / exports / v1-lookup module as the V1 data interface.
- (added 2026-10-05, r4 addendum) **@Askja (framework author, r2) and @Deca (synthesiser, r3)** — (a) react to the reciprocity addendum: does host-community standing belong as a fifth consideration beside Decision 7's four axes, as a companion and not a reopening, and should the green-colonialism risk be named in the Mission? (b) Read `FRAMEWORK.md` and mark anywhere it misstates the framework you wrote. Askja: your 12 metrics, state plus trajectory, the red lines. Deca: the closure rule and the decisions.
- (added 2026-10-05, r4 addendum) **@Monty** — locate the addendum against the literature (CARE and OCAP, Indigenous data sovereignty, Tuck and Yang, Liboiron, land-back and rematriation as trajectory signals); test the evidence items marked `[evidence]`; and say whether the bioregion layer (WWF Ecoregions 2017, HydroBASINS levels, Natural Earth rivers) is defensible as bioregional context, or whether cultural-geographic bioregions (the Berg and Dasmann tradition) need to be named as a limitation.
- (added 2026-10-05, r4 addendum) **@Adam** — confirm the discipline holds: Land standing and the legal pathway are qualitative, never composite, never weighted, never a numeric filter; the four categorical qualitative filters are filters and not scores; display order is not a ranking; the ecoregion, basin and river layers stay in native units (the MAUP stance).
- (added 2026-10-05, r4 addendum) **@Alaska** — architecture review of the new data shapes (Land standing, legal pathway, bioregion membership, and the facts and lint scripts that keep the docs and the data in step) as the V1 data interface. The existing ask on a bulk-fetch path for the Tier-2 rasters stands.
- (added 2026-10-05, r4 addendum) **Anyone** — ratify or amend the slate-admission rule (decision 7 below).

Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.

**Specific decisions waiting on group sync:**

1. **Ratify (or amend) the V1 ship-candidate** at `Docs/v1-ship-candidate.md`.
2. **Adopt or reject** the three methodology proposals (Tier-1/Tier-2 honesty, three-way ship-gate metric, filtering/scoring split).
3. **Confirm** the EU+NA scope (not Europe-only).
4. **Decide** whether `legal_ownership`, `land_cost`, and `climate_buffering` are formally adopted as first-class criteria under the closure rule (Spec Step 3); plus the per-jurisdiction qualitative pattern as a recognised Tier-1 ingestion mode.
5. **Decide** the next round's focus (V2 query-layer spec, V2 raster-fetch infrastructure, additional Tier-1 layers, or recruitment of the unengaged contributors).
6. **Decide** whether to (a) adopt "host-community standing / reciprocity" as a fifth V2 criteria-discovery consideration alongside Decision 7's four axes, and (b) authorise the V1-now move to surface land-tenure / territory / "what arriving asks" as visible per-region qualitative context (no scoring, no filtering — pure sourced display, inside V1 scope). Recommended NOT to run by propose-and-proceed: this touches the project's ethical center and warrants explicit group assent, not default-on-silence. (added 2026-10-05, r4 addendum) Honest status: part (b) is already live on the demonstration, and it went live without the group's authorisation; this asks for that authorisation retroactively, and it now covers the larger slate.
7. **Ratify or amend the slate-admission rule** (added 2026-10-05, r4 addendum): a region joins the demonstration only with complete, sourced data on every criterion (or an honest gap with its reason) AND a Land standing entry checked against opened public sources; anything unverifiable is dropped rather than shipped half-done; regions the reciprocity screen judged harmful were left off, and one region (NE Missouri / SE Iowa) was admitted over a dissent from that screen, with the harm named in its entry and refusal text. The group has not reviewed that choice, and no nation or community named in a Land standing entry has reviewed its entry. The slate grew from 20 to 30 under this rule without a group sync. This item is a process rule about the demonstration, reversible, and follows propose-and-proceed.

Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.

**Open questions still owed by the group** (carried from r3, plus r4 additions):

- Original Open Qs 6 (GitHub repo setup), 7 (data-source scoring formulation), 8 (LLM-assisted sourcing comfort — partially answered this round by the legal_ownership/land_cost/climate_buffering extraction pattern with human-verifiable JSON intermediates).
- r4 addition: is the demonstration-artifact track an explicit V1/V2 dual-track, or do we wind it down once V1 ingestion is mature?
- r4 addition: response-window default of 5 working days — does the group agree, or set differently?
- r4 addition (2026-06-30): does the project want a "who this tool should not serve / where the honest answer is not to go" gate stated anywhere in the documents? Currently there is none. The practitioner position is that its absence is itself a design decision the group should make consciously rather than by omission. (added 2026-10-05, r4 addendum) As of this addendum the source-docs still hold no committed gate; the sentence appears in the r4 addendum, and, as a proposal, in `FRAMEWORK.md` and on the site.
- (added 2026-10-05, r4 addendum) r4 addition: who may add a region to the demonstration slate, and who reviews its Land standing entry, and how can the nations and communities named in it correct it?

Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.

**Mechanism:** propose-and-proceed under the Implementation Strategy's "Group coordination" rule. The 5-working-day default response window applies; the r4 outputs stand as the working state unless the group objects, documented and reversible.

**Exception (added 2026-10-05):** decision 6 and the "where the honest answer is not to go" question are NOT subject to the 5-working-day default. They need explicit group assent; silence does not adopt them. Decision 7 is a process rule about the demonstration and follows propose-and-proceed, as its own text says. (added 2026-10-05, r4 addendum)

Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.

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

> **r4 addendum pointer (@Gustaf, 2026-10-05):** the standing of those already rooted in a place is argued, in "r4 Commentary — Addendum: Reciprocity & host-community standing" below, to be an objective-but-hard-to-measure dimension (treaty and tenure status, customary regime, and land-claim activity are documentable facts); proposed, not committed.
> Drafted by Claude for @Gustaf and appended on his standing go-ahead, before he had read it.

### 7. Sovereignty as four axes (not collapsed)

The "Sovereign Land Protocol" framing implies sovereignty is a primary axis. In criteria discovery, we treat it as four distinct axes — not collapsed into one composite:

- **Geopolitical**: state stability, alliances, conflict risk.
- **Legal**: property rights, regulatory environment, freedom from interference.
- **Material**: food / water / energy independence at the regional level.
- **Social**: community self-governance, surveillance, cohesion.

Each maps to different data sources and is treated as a separate axis through the inventory.

> **r4 addendum pointer (@Gustaf, 2026-10-05):** the same addendum proposes a fifth consideration, host-community standing, to sit beside these four axes as a companion; it explicitly does not reopen this decision.
> Drafted by Claude for @Gustaf and appended on his standing go-ahead, before he had read it.

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

## r4 Commentary — Addendum: Reciprocity & host-community standing (@Gustaf, practitioner reality-check, 2026-10-05)

**Provenance:** Drafted 2026-06-30, evidence-grounded 2026-07-04, updated and appended 2026-10-05 on the go-ahead of Gustaf Palm, the r4 practitioner-seat contributor. This addendum is the part of the practitioner reality-check the first r4 pass (2026-05-29) didn't reach. The earlier pass argued the *mechanics* — criteria completeness, the ship gate, the filtering/scoring split — from inside the build. This one steps outside the build to name something the whole framing is missing. It is grounded in the same 20-region evidence base, read against an eco-village-embedded perspective on what actually determines whether a settlement is welcomed or resented over decades. Points that are judgment rather than evidence are marked `[opinion]`. **Nothing here overwrites the `[COMMITTED]` decisions above — including Decision 6 (subjective dimensions out of V1) and Decision 7 (the four sovereignty axes). It is additive commentary, and it specifically does *not* propose re-opening Decision 7.** What it proposes is a fifth consideration to sit *beside* the four axes, plus a V1-legal move that needs no new scoring.

### The thing the framing doesn't see: all four sovereignty axes are the *incomer's* sovereignty

Read Decision 7 again with one question in mind — *whose* sovereignty? Geopolitical: state stability around **us**. Legal: property rights and freedom from interference for **us**. Material: food/water/energy independence for **our** settlement. Social: **our** community's self-governance, and — tellingly — "civil-society openness to newcomers," which Decision 6 lists among the objective-but-hard-to-measure dimensions and the Specifications mapping (Social sovereignty, SP:87) carries as part of Askja #3, and which reads, in this framing, as *how welcoming the locals are to the incomers.*

Every axis is the arriving settlers' own sovereignty. The one place the people already on the land appear, they appear as a *property of the destination* — a measure of how receptive they'll be to us. There is no axis, anywhere in the four, for **the sovereignty and standing of those already rooted in the place.** The framework has a complete vocabulary for *our* self-determination and no vocabulary at all for *theirs*.

This isn't a drafting oversight to patch inside Decision 7. It's a worldview the tool inherits by default if no one names it. And in our actual region slate it is not abstract:

- **The North American regions sit on living Indigenous territory.** The Kootenays are Sinixt, Ktunaxa, and Syilx land. The Sinixt were declared extinct in Canada in 1956; *R. v. Desautel* (2021 SCC 17) held that the Sinixt hold constitutionally protected rights in their BC territory (the case concerned an Aboriginal right to hunt). This is contested, active sovereignty, not history, and how the Sinixt and the Syilx relate is itself contested: the Syilx Okanagan Nation Alliance's own history counts the Sinixt among Syilx people, while the Sinixt's own site presents the Sinixt as a people whose rights were restored. Nova Scotia is **Mi'kma'ki**, held under Peace and Friendship treaties that never ceded land (Canada's own account: those treaties did not involve First Nations surrendering rights to the lands they had traditionally used and occupied). The Oaxaca regions are the *comunal* and *ejido* lands of Zapotec, Mixtec, Mixe, Chinantec, Chatino, and other Indigenous peoples.
- **We already encountered this — and coded it as friction to the buyer.** Our own `legal_ownership` layer files Oaxaca's collective and customary tenure under *restriction*: its record says that foreigners cannot own *ejido* or *comunidad agraria* land, that over half of Oaxaca is held in those forms, and lists the agrarian assembly as the body that decides conversion. The Land standing entry now carries the other half of the same fact, that 418 of Oaxaca's 570 municipalities elect their authorities through traditional assemblies (*usos y costumbres*). That is exactly backwards as a framing. *Usos y costumbres* is not an obstacle in our path; it is **Indigenous self-governance functioning as designed.** The framework met host-community sovereignty face-to-face in the data and filed it under "things that make it hard for us to buy in." `[opinion, but I'd stake the contribution on it]`
- **Europe has rooted standing too**, even without the colonial frame — old commons regimes, *vicinales*/*comunales*, depopulating rural communities (our own `demographic_trajectory` layer shows which), village social fabric that an arriving group can either join or hollow out. The Galician minifundio tangle and the South Tirol *Maso Chiuso* aren't just title puzzles; they're the legal shells of communities that already live there.

### Why this matters more than a missing criterion: the green-colonialism failure mode

Say it plainly, because the polite version lets it happen: **a land-selection tool that helps relatively privileged, mostly Western groups scan continents for "available" land is one design decision away from being an instrument of green colonialism — a land grab with better intentions and a permaculture logo.** "Optimal location for a regenerative settlement" and "someone else's home and territory" are frequently the *same coordinates*. The tool's entire value proposition — wide search scope, attributes over listings, find the right land — is also the exact shape of the extractive move if reciprocity isn't built in as discipline. The framework is admirably honest about MAUP, about vintage, about not faking precision. It is currently silent about the one thing that could make the whole project do harm at scale. That silence is the gap. `[opinion]`

The discipline that prevents it has a name, and it's the one our whole field runs on: **reciprocity.** Not "are the locals open to us" (that's the incomer asking what they can extract from the welcome). The reciprocal question is: *what does our arriving give and take here, who was already in relationship with this land, and do they have standing in whether we come?* In practice — and I'll put the practitioner's line on the record because the tool should be able to surface a "no" — **where arriving would harm the community already there, the honest answer is not to go.** A tool that can only ever return "here are good places for you" and never "this is not yours to take" is not neutral. It's complicit by omission.

### What I'm actually proposing — two moves, both framework-legal

**1. A fifth consideration for V2 criteria discovery: *host-community standing* (proposed, not committed; does NOT reopen Decision 7).**

Add a fifth consideration *alongside* the four sovereignty axes — call it **host-community standing** or **reciprocity / prior relationship** — that asks the question the four axes structurally can't: *whose land is this already, under what tenure and what law (including treaty and customary law), and what would arriving here ask of, or take from, them?* This is a V2 *criteria-discovery* question (Spec Step 3 territory, the same place `legal_ownership` / `land_cost` / `climate_buffering` were proposed), not a V1 ingestion mandate. I'm flagging it for the group to react to, not landing it by propose-and-proceed.

It must obey the same disciplines as everything else:

- **Never a composite, never a score, never a weight.** This is Adam's rule and it applies with full force here — *especially* here. A numeric "reciprocity score" would be obscene: it would let a group buy down an Indigenous nation's standing against cheaper land. It is a **qualitative dimension** that the user reads and reckons with, exactly like `legal_ownership`'s `regime`/`restriction` fields. It informs a human conscience; it does not compute a verdict.
- **State + trajectory, native units, source + vintage + license** — same as every criterion. State = current tenure / territory / treaty status. Trajectory = e.g. land-back movements, rematriation, depopulation-and-renewal in rural Europe.
- It is the *objective-but-hard-to-measure* kind (Decision 6's "in" column), not the subjective kind. Treaty status, unceded/contested designation, customary-tenure regime, and land-claim activity are documentable facts with sources — closer to `legal_ownership` than to "vibes." This keeps it cleanly on the right side of Decision 6.

If the group adopts it, the dimension resolves into **four documentable sub-fields** (all sourced fact, no score) — a shape the deployed prototype's `land-standing.js` block partly prototypes (whose land and entry exist; displacement trajectory and reciprocal vehicle are proposed, not built):

- **whose land** — the Indigenous nation(s) plus treaty / cession / unceded status (North America), or the rooted community / commons institution (Europe);
- **standing pathway** — how a newcomer lawfully *and* relationally earns place (join an existing *comunidade de montes*; become an acequia *parciante*; win One Planet Development planning; settle before buying);
- **displacement trajectory** — whether in-migration is currently displacing the host community, holding steady, or reviving it (state + trajectory, sourced);
- **existing reciprocal vehicle** — whether a structure already exists through which arrival can be made reciprocal (community land trust, land-back body, commons membership).

**2. A V1-now move that needs no new scoring and breaks no committed decision: surface what's already in the dossiers as visible host-context.**

We don't have to wait for V2 to stop coding Indigenous sovereignty as buyer-friction. V1 can — today, within the no-querying/no-scoring discipline — **surface land-tenure, territory/treaty status, and a plain "what arriving here asks of the place and its people" note as visible qualitative context per region.** This is pure display of sourced fact: no filter, no weight, no composite, fully inside Decision 4 and the V1 scope. It's the same per-jurisdiction Tier-1 pattern we already proved five times this round (dossier prose → human-verifiable JSON → `compile_per_jurisdiction.py` → GeoJSON), pointed at a question we'd so far only asked from the buyer's side.

And the honest disclosure: **the deployed demonstration prototype already does a version of this** — the per-region "what living here asks of you" depth content (`data/region-depth.js`), and now a structured per-region "Land standing" block (`data/land-standing.js`: whose land, tenure, how to enter in good faith, what it asks), surfaced in the region drawer and on the indexable region pages. The artifact is ahead of the docs on this; the docs should catch up. That display went live without the group's authorisation: item 6(b) among the Handoff Request's decisions waiting on group sync asks the group to authorise it retroactively, and that request now covers the larger slate described in the update below.

### Evidence grounding (added 2026-07-04, from the research swarm + Nova Scotia triangulation)

The argument above was drafted from practitioner judgment. A multi-track research pass since then puts documented evidence and named scholarship under it — this is the starting evidence for what r5 asks @Monty to test against the literature.

- **The mechanism has a documented local case on our own slate, though not a count.** In the High Road villages above Taos in Northern New Mexico, a 2026 Santa Fe New Mexican report on land prices describes a parcel selling "way, way over market," property taxes whose burden falls hardest on locals, a lifelong resident likening the trend to the plight of the farmers in *The Milagro Beanfield War*, and a headline that names "concerns of cultural loss." `[evidence]` The report gives no displacement count, and none is claimed here. The structural point is judgment, not a measured result: the tool's optimisation targets (water security, affordability, climate buffering) are the *same variables* that draw amenity and climate migrants, so the mechanism the tool runs on and the mechanism that displaces host communities may be one variable, not two — which is why reciprocity has to be built in as discipline rather than added as sentiment. `[opinion]`
- **The critique has a name in the literature.** Tuck & Yang's "settler moves to innocence" and their phrase for what those moves try to rescue, "settler futurity" (2012), name the blind spot in Decision 7 — a framework fluent only in the incomer's sovereignty. `[opinion]` (The abstract names the moves; reading them onto Decision 7 is an interpretation.) Liboiron (2021) argues that even when researchers work toward benevolent goals, environmental science and activism are often premised on a colonial worldview and access to land, which is close to the shape of this tool's risk. Pair with the CARE principles (Collective Benefit, Authority to Control, Responsibility, Ethics) and the First Nations principles of OCAP (ownership, control, access, possession) for Indigenous data governance; whether and how they bind this tool's naming of territories is a question for the group and @Monty, not something those sources decide. `[evidence]` for what each source says.
- **The European "earning standing" mechanism is concrete, not romantic.** Galicia's *montes vecinales en mano común* are collective private property of the households that keep an open house and habitual residence in the settlement the commons belongs to; the community is made up of the vecinos who compose it at any given time; and the land is indivisible and inalienable. Membership follows residence, and it cannot be bought; admission conditions sit in each community's own statutes (Ley 13/1989, arts. 2, 3 and 16). In Portugal the *baldíos* were returned by law in 1976 to the user communities, with commoners defined by customary entitlement (FAO *Unasylva* 180). Two real, documentable models of host-community standing with no treaty and no imposed Indigenous frame: the answer to "what does reciprocity look like in Europe." `[evidence]`
- **It is already being done — including in Nova Scotia.** *Asitu'lɨsk* (formerly Windhorse Farm, Nova Scotia) was returned to the Mi'kmaq at the end of 2021 in what its caretakers call a land-back initiative, and is now in the care of the Ulnooweg Education Centre — a settler-founded land project that gave the land back (the project's own site). Transposable mechanism: the **Shuumi Land Tax** of the Sogorea Te' Land Trust, a voluntary annual contribution that non-Indigenous people living on Lisjan territory can make (the Trust's own page). Region-matched co-stewardship: the Mi'kmaq and Canada signed the Toqi'maliaptmu'k Arrangement ("we will look after it together") on 10 December 2025 for Parks Canada-administered sites; the Sinixt *R. v. Desautel* ruling (2021); and a May 2026 news report that 165 acres in Dane County, Wisconsin, are set to be returned to the Ho-Chunk Nation (an announced deal, not a report of a completed transfer). `[evidence]`
- **The law is moving with the thesis, in the cases checked for this update.** Recent and longer-standing law in our jurisdictions keeps *closing* on non-resident, non-farmer, or speculative acquisition: Nova Scotia's non-resident deed-transfer tax on residential property, including vacant residential land (its rate rose on 1 April 2025); Québec's Bill 86 (assented 25 March 2025, and summarised by a law firm as adding restrictions on non-resident acquisition of agricultural land); Romania's Law 17/2014 (a ranked pre-emption queue headed by co-owners and relatives, and a tax on resale within eight years); France's SAFER pre-emption right, with a March 2025 first-reading National Assembly vote on a bill against non-farmers buying farmland for non-farm use (its later fate was not checked); and a further round of US state-level foreign-ownership restrictions in the 2025 legislative session. The *openings* checked tie arrival to settling and to land use: Galicia's *aldeas modelo* (a voluntary instrument for recovering abandoned farmland around villages, Ley 11/2021, art. 79 onwards) and the Welsh One Planet Development route, which asks for a binding management plan and a land-based, low-footprint way of living, with the development as the occupants' sole residence (Welsh Government practice guidance, 2012). `[evidence]` That "arrive as residents-who-farm-in-common, not buyers-who-hold" is now the *legal* direction of travel and not only the ethical stance is a generalisation from these cases, not something checked across every jurisdiction `[opinion]`; if it holds, it is external support the group did not have when Decision 7 was written.

Full sourcing: the 2026-10 claims ledger kept with this addendum (`upgrade-2026-10/tracks/docs/staged/claims-ledger.md`), which records for each claim the source opened, the date, and the verdict; the 2026-07 research (`research/site-enrichment-2026-07/`, tracks 02 land-tenure, 05 reciprocity, 06 long-horizon viability, and `synthesis.md`) is where the evidence items were first gathered. The Nova Scotia treaty and tenure claims were cross-checked in `research/nova-scotia-land-access/`, and the 2026-10 pass re-opened the treaty and tax sources themselves.

### Update, 2026-10 (what the demonstration now carries)

The argument above stands on the 20-region evidence base it was written from. The demonstration has since changed; this subsection records what its data currently shows, and nothing in it changes any `[COMMITTED]` decision.

- The slate grew from 20 to 30 regions (15 in Europe, 15 in North America). The working group has not yet reviewed the slate growth, which happened without a group sync.
- Every region carries a Land standing entry (30 of 30), each resting on a named source, and 15 of those entries also name a source for the territory claim itself. Land standing stays qualitative: it is never scored, weighted, or used as a numeric filter.
- Two further qualitative layers exist as context only: a per-region legal pathway block (30 of 30: entry steps in order, who must consent, honest gaps; not legal advice) and bioregion membership (30 of 30: WWF ecoregions, HydroBASINS watersheds, rivers; native units; descriptive). Neither is scored, weighted, or used as a numeric filter.
- Regions were admitted only with complete sourced data (or an honest gap with its reason) and a Land standing entry checked against opened public sources, which is not a review by the nations or communities named; regions the reciprocity screen judged harmful were left off; one region (NE Missouri / SE Iowa) was admitted over a dissent from that screen, with the harm named in its entry and refusal text, and the working group has not reviewed that choice.

### In one line

The framework is rigorous about protecting the people *arriving*. It says nothing about the people *already there*. Until it does, we're building a better map for a land grab. Reciprocity — host-community standing, treated as visible qualitative context and never as a score — is the discipline that turns this from extraction into arrival-in-good-relationship. That's the practitioner's reality-check, and it's the one I'd most want the group to sit with. `[opinion]`

Drafted by Claude for @Gustaf; the 2026-10 revisions were appended on his standing go-ahead and he had not read them at the time of appending.

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
