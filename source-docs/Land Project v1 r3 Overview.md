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
**Collaboration round:** r3

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

### Handoff Request [r3 → r4]

**To:** Open — no prescribed order. Any of @Monty, @Gustaf, @Alaska can go first.
**From:** @Deca
**Context:** This is a working-group project building a shared geospatial database for finding optimal land for regenerative community settlements. The plan synthesises two prior contributions (Adam's GIS architecture sketch and Askja's land selection framework) into a coherent v1 scope. V1 is data ingestion only — no query layer, no scoring, just clean raw and processed layers with full metadata, exportable to Jupyter and QGIS.
**What I need from you:**

There is no single directed ask. The request is the same for everyone: **contribute your unique perspective.** Read the Specifications and Implementation Strategy. Notice what your knowledge and experience sees that isn't in these documents. What's missing, wrong, underweighted, or over-engineered from where you sit?

If it helps to have starting points, the "Open questions for the group" section at the bottom of this file enumerates specific areas where the plan is explicitly incomplete or awaiting input.

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
