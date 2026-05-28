# Land Project v1 Specifications

**Read first:** `Land Project Overview.md` for framing decisions, then `Askja's Regenerative Land Selection Framework.md` for the substantive criteria starter set. This document specifies *what* V1 produces and the methodology behind each piece. The chronological *how* and *by whom* is in `Land Project v1 Implementation Strategy.md`.

---

## What V1 produces

1. **Criteria inventory** — a vetted list of geographic criteria relevant to choosing land for a regenerative community on a 50–100 year horizon, organized by top-level category (starter set: Askja's 12 metrics, minus #12 *Cultural & Lifestyle Fit*). Lives at `Docs/criteria-inventory.md`.
2. **Data source inventory** — for each criterion, candidate datasets scored on relevance, gettability, coverage, vintage, and native unit. Starter inventory uses Askja's named sources. Lives at `Docs/data-source-inventory.md`.
3. **V1 priority list** — the prioritized subset of data sources to fetch in V1, plus the agreed coverage threshold for shipping. Lives at `Docs/v1-data-priorities.md`.
4. **Raw-layer ingestion** — fetched data from prioritized sources, stored in native units in a documented directory structure (`data/raw/<source-name>/...`).
5. **Processed-layer datasets** — cleaned, validated, format-standardized versions of the V1 criteria that crossed the ship gate. In native units. Stored at `data/processed/<criterion-name>/...`. Each dataset carries a **state + trajectory** description per Askja (see Time framing below).
6. **Exports** — Jupyter-friendly and QGIS-friendly exports of the processed layer. Stored at `data/v1-exports/`.
7. **Demo notebook** — a Jupyter notebook that loads the V1 exports and demonstrates basic visualization for each criterion.
8. **Lessons-learned writeup** — captured at V1 ship; feeds into V2 planning.

---

## Criteria discovery methodology

The goal: produce a list of criteria comprehensive enough that a serious land-seeker would consider it useful, while being practical enough to act on. We have a strong starting set from Askja, so the work is more triage than invention.

### Starter set: Askja's 12 metrics

Askja's *Regenerative Land Selection Framework* gives us a thoughtful 12-metric inventory. We adopt it directly as the V1 starter list, with two scope adjustments to match our framing decisions:

| # | Metric (Askja) | V1 status | Notes |
| --- | --- | --- | --- |
| 1 | Geopolitical & Institutional Resilience | IN | Includes red-line data: active-conflict proximity. |
| 2 | Climate Resilience (with projections) | IN | Includes red-line data: water-deficit projection. |
| 3 | Existing Regenerative Knowledge Network | IN | Treated as hard data — group is plugged into directories (ecovillages, permaculture, seed banks). |
| 4 | Water Resources (trajectory-weighted) | IN | Includes red-line data: water-source control. |
| 5 | Land & Ecology | IN | Includes red-line data: soil contamination, land history. |
| 6 | Existing Infrastructure | PARTIAL | Regional-scale indicators in (electrification rate, road density, internet coverage); parcel-level out (Layer 3). |
| 7 | Energy Autonomy | IN | |
| 8 | System Coherence Score | OUT | Composite — V2/V3 design question. The *underlying* metrics 4, 5, 7 are in. |
| 9 | Accessibility & Connectivity | IN | Includes red-line data: hospital proximity. |
| 10 | Economic & Legal Context | IN | Includes red-line data: collective-ownership legality. |
| 11 | Biodiversity & Regeneration Potential | IN | |
| 12 | Cultural & Lifestyle Fit | OUT | Subjective — see Project Overview decision 6. |

10 of the 12 metrics are in V1 in full or partial form. The two excluded (#8 composite, #12 subjective) align with framing decisions in the Overview.

### Top-down review of the starter set

Run a top-down decomposition exercise *as a check*, not as primary input. Starting from "what does flourishing for 50–100 years require?", confirm each high-level requirement is covered by Askja's 12. Categories worth checking explicitly:

- **Ecological resilience** — covered by #2, #4, #5, #11.
- **Sovereignty** (four cross-cutting axes — see below) — covered by #1, #4, #7, #10, #3.
- **Access to inputs** (food, water, energy, materials) — covered by #4, #5, #7.
- **Civilizational stability** (economic, demographic, political volatility) — covered by #1, #10. Some demographic dimensions (population trend, median age, migration) may need explicit addition under #1.
- **Social fabric** — covered by #3 (objective dimensions); #12 (subjective) excluded.

Gaps surfaced by the top-down review get added to the starter set with attribution.

### Bottom-up supplementation

Askja's framework is the primary bottom-up source. Other frameworks supplement gaps:

- **Dalio's Power Index** components (economic, military, education, innovation, debt cycle position) — supplements civilizational-stability dimensions.
- **AMOC and tipping-point literature** — supplements long-horizon climate-projection criteria.
- **IPCC scenarios (SSPs, RCPs)** — supplements climate-projection framing.
- **INFORM Risk index components** — supplements geopolitical/disaster-risk dimensions.
- **Permaculture site-design factors** — already largely covered by Askja but worth cross-checking soil/water/microclimate criteria.
- **Schumacher (*Small is Beautiful*)** — frame-level rather than criterion-level; informs the worldview behind closure decisions.

Each contribution is added to the inventory with attribution.

### Closure rule

**Stop adding criteria when new candidates only elaborate within categories you already have, rather than adding new dimensions.** Concretely: if the next ten candidates all slot into existing categories and substantively overlap with criteria already on the list, the inventory is "complete enough." This is saturation. We close criteria discovery and move on to data-source identification.

Given Askja's starter set is already substantial, expect the saturation point to come quickly.

---

## Sovereignty as four cross-cutting axes

Sovereignty in Askja's framework is mainly metric #1 (Geopolitical & Institutional Resilience). We earlier proposed treating it as four distinct axes (geopolitical, legal, material, social). These coexist as a **cross-cutting tagging scheme** rather than a separate top-level category — each criterion in the inventory can be tagged with whichever sovereignty axis (or axes) it serves, in addition to its primary category.

Mapping:

- **Geopolitical sovereignty** — covered by Askja's #1 (state stability, alliances, conflict risk).
- **Legal sovereignty** — covered by Askja's #10 (property rights, regulatory environment, ownership laws, residency pathways).
- **Material sovereignty** — covered by Askja's #4, #5, #7 (regional food / water / energy independence).
- **Social sovereignty** — covered by Askja's #3 (community self-governance presence, civil-society density, openness to newcomers).

Tagging means a criterion can serve multiple axes — e.g. "permaculture-farm density within 50km" tags as Material (food self-sufficiency contribution) *and* Social (knowledge-network density). This is information, not redundancy.

---

## Time framing: state + trajectory per criterion

Following Askja, every criterion is described on two axes:

- **Current state** — value or range, in the criterion's natural units. (High / Moderate / Low qualitative levels are a V2 concern; raw values in V1.)
- **Trajectory** — directional indicator: stable, improving, declining, volatile. Filled by:
  - Explicit **projection** where credible projections exist (CMIP6 climate scenarios, demographic projections, geopolitical trajectory models).
  - **Recent trend** over a defined window where projections aren't credible but observed change is meaningful (e.g. 20-year Hansen forest cover change).
  - **Null** where trajectory isn't meaningful at the timescales we care about (e.g. soil composition).

Each (criterion, time-framing) pair is its own data point in the inventory. The data source inventory carries a `time_framing` field on each source. There is no universal time horizon for the project — research per criterion.

---

## Data source identification methodology

For each criterion (and each time framing of that criterion), identify candidate data sources. Score each candidate on:

- **Relevance** (1–5): how directly does this source measure the criterion?
- **Gettability** (1–5): how easy is it to access? Considers licensing, access mechanism (download vs API vs scraping), file format, total size, transformation complexity.
- **Coverage** (per source): estimated geographic coverage at the source's native resolution. Recorded as text (e.g. "global at 1km resolution; gaps in Antarctica").
- **Vintage**: when the data was collected / what time the values represent.
- **Native unit**: the spatial unit the source comes in (raster cell with stated resolution; LSOA; NUTS-3; commune; etc.).
- **License**: usage rights for our purposes.

**Priority score**: `relevance × gettability`. Coverage is treated as a separate gate (must clear a minimum to qualify for V1), not multiplied in. Sources with high relevance × gettability but low coverage are deferred to V2.

LLM-assisted source surfacing is acceptable, but every candidate must be manually verified by a human before scoring (license check, format check, actual accessibility).

### Starter inventory — sources from Askja

These are the data sources Askja named directly. They form the seed of the data source inventory:

| Criterion category | Sources |
| --- | --- |
| Geopolitical & Institutional Resilience (#1) | World Bank Governance Indicators, Global Peace Index |
| Climate Resilience (#2) | IPCC projections, Copernicus Climate Data Store |
| Water Resources (#4) | HydroSHEDS, FAO AquaStat |
| Land & Ecology (#5) | FAO Soil Portal, Global Forest Watch, NASA DEM |
| Biodiversity (#11) | Global Biodiversity Index, local forestry maps |

Additional sources commonly used for the other metrics (to be vetted in Step 4):

- **Climate baseline**: WorldClim v2.1 (temperature, precipitation), CHELSA, ERA5.
- **Climate projections**: CMIP6 (multiple scenarios), Copernicus Climate Change Service.
- **Land cover**: ESA WorldCover, Hansen Global Forest Change, Copernicus Land Monitoring Service.
- **Soil**: SoilGrids 2.0 (global), national soil agencies.
- **Solar / wind / hydro**: Global Solar Atlas, Global Wind Atlas, HydroSHEDS for stream networks.
- **Conflict / security**: ACLED, UCDP, Global Peace Index, INFORM Risk.
- **Demographics / economy**: World Bank, Eurostat NUTS-3, GHSL population.
- **Accessibility**: JRC Global Accessibility Map, OSM-derived isochrones.
- **Civil society / democracy**: V-Dem, Bertelsmann Transformation Index, Freedom House.
- **Regenerative networks**: Global Ecovillage Network (GEN) directory, Permaculture Worldwide Network, FAO agricultural cooperative registers, national permaculture associations.
- **Hazards**: USGS earthquake catalog, GEM Hazard, ThinkHazard, European Flood Awareness System.
- **Land cost**: per-country specific (DVF for France, BORIS for Germany, Idealista/Imovirtual scrapes for Iberia, etc.).

This is an opening list, not a closed set. Step 4 of the Implementation Strategy fleshes it out per criterion.

---

## Datapoints in scope for V1 ingestion

The following data points are explicitly **in scope** for V1 fetching (whether they make the V1 *processed* set depends on coverage — see ship gate). This list captures Askja's interesting datapoints so none are lost:

**From metric 1 (Geopolitical & Institutional)**: political stability indices, corruption indices, democracy indices, peace index proximity-to-conflict, public service reliability indicators, disaster response capacity, **active-conflict locations** (red-line underlying data, ACLED/UCDP).

**From metric 2 (Climate Resilience)**: temperature now + +25yr/+50yr projections, precipitation now + projections, drought/flood trajectories, fire-day frequency, heatwave frequency, climate-buffering features (altitude, distance-to-coast, mountain-shelter exposure), **water-deficit projection by 2050** (red-line underlying data).

**From metric 3 (Regenerative Knowledge Network)**: ecovillage / permaculture / agroforestry density (proximity within 50km), seed banks, agricultural schools, cooperatives, civil-society density indicators, openness-to-newcomers proxies (e.g. migration data, community-receptiveness studies).

**From metric 4 (Water)**: river/stream networks, aquifer presence, springs, water-quality indicators, rainwater-harvesting potential (precipitation × topography), seasonal flow patterns, projected water availability +25yr/+50yr, **water-source single-entity control** indicators (red-line underlying data — likely qualitative per region, may be deferred).

**From metric 5 (Land & Ecology)**: parcel size potential (regional aggregates), topography (slope, elevation), soil fertility, soil pH, soil organic matter %, **soil contamination** registers (red-line underlying data), land-use history (virgin/forest/polyculture/monoculture/industrial), old-growth forest presence, geological / seismic / erosion / landslide risk, *regenerative velocity* heuristic (biome-based).

**From metric 6 (Infrastructure, regional only)**: road density, electrification rate, internet coverage, water infrastructure, distance to airports/seaports.

**From metric 7 (Energy Autonomy)**: solar irradiance, wind potential, micro-hydro potential (streams + elevation drops), off-grid feasibility indicators.

**From metric 9 (Accessibility & Connectivity)**: distance to urban center, **distance to hospital** (red-line underlying data, 60-min isochrone), distance to school, seasonal accessibility (flood/snow closures), road/air/sea connections, internet infrastructure.

**From metric 10 (Economic & Legal)**: cost per hectare (per-country sources), ownership laws for foreigners, residency / citizenship pathways, construction permit complexity, zoning, tax structures, **collective-ownership legal options** (red-line underlying data).

**From metric 11 (Biodiversity)**: flora/fauna diversity indices, recovery-potential indicators, permaculture/agroforestry integration suitability.

**Out of V1 ingestion** (deferred):

- All of metric 12 (Cultural & Lifestyle Fit — subjective).
- Parcel-level detail (Askja's Layer 3): specific building condition, parcel-level soil testing, on-site sensor data.
- The composite question of metric 8 itself (the underlying metrics 4, 5, 7 are in).

---

## Native units policy

### Raw layer

All raw data is stored in its native spatial unit. **No reshaping. No projection to a common grid.** Native unit type is part of the dataset metadata.

### Processed layer

The same native units are retained unless a different unit is justified for a specific dataset, with the rationale documented in the dataset's metadata file. Acceptable justifications include:

- Storage size (e.g. raster aggregation from 10m to 100m where the source resolution exceeds analytical needs).
- Format incompatibility with downstream tooling, where the alternative is data loss.
- Source-driven: when the original source is itself an aggregation that introduces no new information at finer scales.

Unacceptable: aggregating "to make criteria comparable." Cross-criterion comparison is V2's problem.

### Cross-unit operations

Deferred to V2. V1 does not perform cross-unit interpolation. Each criterion stands on its own in its own unit.

When V2 introduces cross-unit operations, the literature-recommended approach is dasymetric mapping with declared method (the method is part of the result's metadata). This is documented for V2 reference but not implemented in V1.

---

## V1 ship gate

V1 ships when all of the following are true:

1. **N criteria fully processed end-to-end** — raw ingestion → cleaning/validation → exportable. Illustrative target: N ≥ 3.
2. **Each of those criteria meets a coverage threshold** within a defined geographic scope. Illustrative target: ≥ 70% coverage of Europe at the criterion's native resolution. (Geographic scope and exact threshold set during V1 work after the coverage report is in.)
3. **All processed values carry source, vintage, native-unit, license metadata** — and where applicable, state + trajectory.
4. **Data is consumable in Jupyter and QGIS** without manual reformatting. Demo notebook exists.

The exact N and coverage % are illustrative and locked during V1 once data availability is mapped (see Implementation Strategy step 8).

---

## Out of scope for V1

V1 explicitly does not produce or attempt:

- Query / search / filter logic.
- User-defined scoring or weighting.
- Web UI of any kind beyond static map renders for verification.
- Cross-criterion combination or ranking.
- Cross-unit interpolation between criteria.
- Composite metrics — including Askja's "System Coherence Score" #8 and any "livability" composite. V2/V3 design question.
- Subjective dimensions — Askja's #12 *Cultural & Lifestyle Fit*: language fit, vibes, aesthetic resonance.
- Parcel-level / on-site data — Askja's Layer 3: sensors, soil kits, walking observations. V3+.
- Red-line *filtering* — the underlying data is in scope; the act of disqualifying sites by criteria is V2.
- Projections beyond what individual datasets natively include.
- Tech-stack decisions beyond what's strictly needed for ingestion (database choice, processing framework, web framework deferred until justified by data shape).

---

## Quality gates inside V1

Even within V1, every dataset crosses several quality gates before reaching the processed layer:

- **Reproducibility**: re-running the fetch + processing pipeline for a dataset produces byte-identical output (or, where stochastic/dated, identical *given* a pinned source vintage).
- **Idempotency**: every fetch and processing script can be re-run safely without corrupting prior state.
- **Resumability**: long-running fetches survive interruption.
- **Metadata completeness**: source, vintage, license, native unit, time framing, coverage estimate, processing method, sovereignty-axis tags, state + trajectory description recorded for every dataset.
- **Sanity check**: at least one human eyeballs the dataset rendered in QGIS against known reality before declaring it processed.

---

## Notes on what V1 deliberately leaves open

- **Tech stack** — no decision yet on database, processing framework, file formats beyond "what each source natively provides plus, where standardization is needed, GeoTIFF for rasters and GeoPackage / GeoParquet for vectors." Locked once we see what we're handling.
- **Repository internal structure beyond `Docs/`** — directory layout for `data/`, `scripts/`, etc. is sketched in the Implementation Strategy but is not load-bearing; we adapt as the work proceeds.
- **V2 query architecture** — Adam's plan covers this and will be revisited as a V2 spec after V1 ships and we have actual data to design against. The V2/V3 design questions on composite scores and weighting authority (see Overview) feed into that work.
- **Cosmolocal data sovereignty** — Askja's concept of community-controlled, mirrored data storage. V3+ governance / hosting question; not addressed by V1 ingestion.
