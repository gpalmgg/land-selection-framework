# Land Project v1 Implementation Strategy

**Read first:** `Land Project Overview.md` for framing, `Askja's Regenerative Land Selection Framework.md` for the substantive starter set of criteria and named data sources, then `Land Project v1 Specifications.md` for what V1 produces. This document is the chronological *how* — sequence of work, manual vs automated tasks, and group sync points.

---

## Conventions

- **[M]** = manual task (humans).
- **[A]** = automated task (scripts / pipelines).
- **[M+A]** = mixed; humans set up or verify, scripts execute.
- **[GROUP]** = requires group sync. Posted in chat → wait for responses → iterate.

Tooling decisions are deferred until justified by what data we're actually handling. Steps below describe categories of work, not implementation specifics. Where a deliverable is a markdown file, it lives in `Docs/` of the shared repo. Where a deliverable is data or code, it lives in `data/` or `scripts/` in the same repo (structure adapted as we go).

---

## Sequence

### Step 1 — Adopt and review Askja's 12 metrics  [M] [GROUP]

Askja's framework gives us 12 metrics as a developed starter set. Step 1 is not to invent categories from scratch but to **review, scope-adjust, and confirm** the starter set.

Per V1 Specifications, scope adjustments versus Askja's full 12:

- IN: metrics 1, 2, 3, 4, 5, 7, 9, 10, 11 in full.
- PARTIAL: metric 6 *Existing Infrastructure* — regional indicators in, parcel-level out.
- OUT: metric 8 *System Coherence Score* (composite, V2 design question).
- OUT: metric 12 *Cultural & Lifestyle Fit* (subjective).

Top-down review as a check (not primary input): walk through the list "ecological resilience / sovereignty / access to inputs / civilizational stability / social fabric" and confirm each is covered by Askja's 12. Surface any gaps explicitly. Most likely candidates for additions: demographic-trajectory dimensions (population trend, median age, migration patterns) under metric 1.

Sovereignty as a cross-cutting tagging scheme (geopolitical / legal / material / social) is applied during this step — each surviving metric gets tagged with whichever sovereignty axis (or axes) it serves.

**Deliverable**: `Docs/criteria-inventory.md` populated with a "Top-level categories" section listing Askja's metrics as adopted, with scope-adjustments noted, and the four sovereignty-axis tags applied per metric.

**Sync point**: confirm scope-adjustments and sovereignty tagging before bottom-up supplementation begins.

---

### Step 2 — Bottom-up framework supplementation  [M] (parallel)

Askja's framework is the primary bottom-up source — already integrated in Step 1. Step 2 is supplementation: each working-group member contributes additional criteria from frameworks Askja may have under-covered.

Suggested initial divisions (adapt to who actually shows up):

- **Deca**: Dalio Power Index components (debt cycle position, education, innovation, military), AMOC and tipping-point literature, macro-history sources for civilizational-trajectory dimensions.
- **Adam**: GIS / climate frameworks, IPCC SSPs/RCPs scenario framing, INFORM Risk components, any GIS-domain criteria not in Askja's set.
- **Askja**: any criteria she didn't fit into the initial framework but considers worth adding.
- **Other group members**: their own domains.

Each contribution is a flat list of candidate criteria, tagged with source. No filtering at this stage — comprehensiveness over economy. Many will overlap with Askja's metrics; that's fine, mark the overlap and move on.

**Deliverable**: `Docs/criteria-inventory.md` extended with a "Bottom-up supplements" section, each entry tagged with its source framework and noting whether it extends an existing metric or adds a new dimension.

---

### Step 3 — Reconciliation and closure  [M] [GROUP]

Map Step 2 supplements into the top-level categories from Step 1 (Askja's metrics).

- Where a supplement doesn't fit, decide: extend the categories, or reject the candidate with documented reasoning.
- Iterate until the **closure rule** is met: new candidates only elaborate within existing categories, rather than adding new dimensions. Given Askja's starter set is substantial, expect saturation to come quickly.
- For each criterion that survives, record: its category, its sovereignty-axis tag(s), its **state + trajectory** specification (per Askja — current state in raw units; trajectory as projection / trend / null), and a short definition.

**Deliverable**: `Docs/criteria-inventory.md` complete and locked.

**Sync point**: group sign-off on the criteria list. This is a substantive checkpoint — disagreements at this step are easier to resolve than later.

---

### Step 4 — Per-criterion data source identification  [M+A]

For each criterion (and each state/trajectory framing), identify candidate data sources. We do **not** start from a blank page: Askja named several sources, and V1 Specifications carries an extended starter inventory by criterion category. Step 4 vets, scores, and extends that inventory.

- Start from the starter inventory in V1 Specifications. For each named source: verify it exists, check the access mechanism, check the license.
- LLM-assisted surfacing acceptable for filling gaps, but every newly-surfaced candidate must be manually verified before scoring.
- Score each source on relevance (1–5), gettability (1–5), coverage (text), vintage, native unit, license. See V1 Specifications for definitions.
- Priority score = relevance × gettability.
- Special attention to **red-line underlying data** — even where the priority score is moderate, surfacing fetchable sources for active-conflict location, hospital proximity, water-deficit projection, soil-contamination registers, and collective-ownership legality is a goal of V1 (see Overview decision 9).

**Deliverable**: `Docs/data-source-inventory.md`. Structure: one section per criterion, each listing candidate sources with scores. Red-line underlying data flagged.

---

### Step 5 — Prioritization  [M] [GROUP]

Sort the data source inventory by priority score within each criterion. Across criteria, identify the top N sources we want to fetch first — the V1 priority list.

The priority list is *aspirational* at this stage; some sources will turn out to be less gettable than the score suggested. The list will be revised after coverage measurement (Step 8).

**Deliverable**: `Docs/v1-data-priorities.md`.

**Sync point**: group sign-off on the priority list before any fetching begins.

---

### Step 6 — Fetch scripts  [A]

For each source on the priority list, write an idempotent, resumable, cached fetch script.

- Output format: each source's native format (no early conversion).
- Storage: `data/raw/<source-name>/...` with a sibling `metadata.yaml` recording source URL, vintage, license, fetch date, native unit, expected coverage.
- Re-runnable without re-downloading already-cached files.
- Out of git: large raw files. Track via DVC, git-lfs, or external storage; not in scope to decide here.

**Deliverable**: `scripts/fetch/` with one script per source. Raw data populated in `data/raw/`.

---

### Step 7 — Coverage measurement  [A]

For each fetched source, programmatically measure:

- Spatial coverage at the source's native resolution. Express as: total area covered, % of Europe (or other defined scopes) covered, gaps reported.
- Vintage distribution where relevant.
- Completeness within native units (e.g. % of LSOAs with non-null values).
- Internal consistency checks (e.g. value ranges within plausible bounds, no obvious encoding errors).

**Deliverable**: `scripts/coverage/` + a generated `Docs/coverage-report.md`. The report is regenerated each time a new source is fetched.

---

### Step 8 — V1 scope decision  [M] [GROUP]

Review the coverage report. Identify which criteria meet the V1 ship gate:

- Decide on the geographic scope (Europe? wider?) based on what coverage is actually achievable.
- Decide on N and the coverage % (illustrative starting point: ≥ 3 criteria, ≥ 70% European coverage).
- Lock the V1 scope: the criteria that go through full processing for V1 ship.
- Defer the rest to V2.

**Deliverable**: a "V1 Scope" section appended to `Docs/v1-data-priorities.md`, listing the locked V1 criteria + their data sources + the agreed coverage threshold.

**Sync point**: group sign-off on V1 scope. This is the definition-of-done for V1 ingestion.

---

### Step 9 — Processing pipelines for V1 criteria  [A]

For each locked V1 criterion, write a processing pipeline that takes raw data and produces cleaned, validated, format-standardized output. Pipelines must be:

- Idempotent and reproducible (re-running produces identical output for identical inputs).
- Native-units preserving (no reshaping unless explicitly justified — see V1 Specifications).
- Metadata-emitting (every output dataset gets a sibling `metadata.yaml`).

**Deliverable**: `scripts/process/` with one pipeline per V1 criterion. Processed data populated at `data/processed/<criterion-name>/...`.

---

### Step 10 — Exports and verification  [M+A]

Generate Jupyter-friendly and QGIS-friendly exports of the processed data:

- **Jupyter**: a single canonical loader function per criterion, returning a GeoDataFrame (or equivalent) with metadata as attributes.
- **QGIS**: GeoPackage or GeoTIFF exports per criterion, openable as a layer.

Manual verification: open each export in QGIS, eyeball against known reality (e.g. forest cover should look forested where you'd expect; temperature should warm toward the equator). Record any anomalies in `Docs/v1-verification-notes.md`.

**Deliverable**: `data/v1-exports/` populated; `notebooks/v1-demo.ipynb` written; `Docs/v1-verification-notes.md` written.

---

### Step 11 — V1 sign-off and lessons learned  [M] [GROUP]

Group review of V1 output via the demo notebook + QGIS.

- Confirm the V1 ship gate is met.
- Capture lessons learned: what was harder than expected, what was easier, where data sources disappointed, where the methodology needed adapting.
- Identify candidates for V2 work — both new criteria/sources and architectural changes (query layer, web UI, cross-unit operations).

**Deliverable**: `Docs/v1-shipped.md` (with lessons-learned section) and a draft `Docs/v2-candidates.md`.

**Sync point**: group declares V1 shipped.

---

## Group coordination

Coordination model: post in chat → wait for responses → iterate.

Sync points by step:

| Step | Sync purpose |
| ---- | ------------ |
| 1 | Confirm top-level categories before bottom-up harvest |
| 3 | Sign off the criteria list |
| 5 | Sign off the priority list before fetching begins |
| 8 | Lock V1 scope based on actual coverage |
| 11 | V1 ship sign-off |

Between sync points, work proceeds async. A sync that doesn't get clear group input within a defined response window (suggestion: 5 working days, adjustable) defaults to the proposing person's recommendation, with the decision documented and reversible at the next sync.

---

## Tooling decisions deferred until justified

The following decisions are explicitly deferred:

- **Database technology** (Postgres? DuckDB? files-on-disk?). Decided once Step 7's coverage report tells us how big the data is and what queries V1 actually needs (which, since V1 has no query layer, is "load and display").
- **Processing framework** (Prefect, Dagster, Airflow, plain Make, hand-rolled scripts). Decided once Steps 6–9 reveal complexity: if pipelines are simple and few, plain scripts; otherwise, escalate.
- **Visualization stack beyond Jupyter / QGIS**. Out of scope for V1.
- **Geographic scope** (Europe-only? wider?). Decided at Step 8 based on actual coverage.

The principle: smallest tooling that does the job, justified after the work reveals what the job actually is.

---

## Open process questions

These are tracked in `Land Project Overview.md` "Open questions" but flagged here for visibility:

- Who sets up the GitHub repo, and what's the initial structure beyond `Docs/`?
- LLM-assisted source identification: comfortable, with manual verification?
- Default response window for sync points (suggested 5 working days)?
- Roles per step — who owns which step?

---

## Where this document is wrong

This is V1 of the implementation strategy and it will be wrong in places we don't yet see. As we work through steps 1–11, we will learn things that invalidate parts of this plan. The plan is to update this document as we go, not to defend it. Significant deviations get a short "Deviation log" entry at the bottom.

### Deviation log

(Empty at draft.)
