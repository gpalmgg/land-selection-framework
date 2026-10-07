# The Land Selection Framework: the portable layer

**Status.** Portable statement of the framework discipline. Not part of the source-docs. Offered to the working group as a proposal. Where it conflicts with the source-docs, the source-docs win.

**Version.** Draft 1, 2026-10-05. Inventory facts generated 2026-10-05T16:19:16.321Z (see section 3).

> The framework was originated by Askja and is developed by a small working group of practitioners and researchers. The demonstration site was built by one member of that group, who holds the practitioner seat.

> A designed demonstration of the framework, not a finished data product. Values are sourced and dated; the group has not yet ratified the slate or the V1 proposal.

> Members are named by first name and role only, as in the working documents; no surnames, handles or contact details appear anywhere on the site.

## 0. Status, provenance and labels

This file is written so that a member of the working group, or someone who inherits the work, can run the discipline without any of the tools that currently carry it. The test it was written against: if Claude, the web host and the current tool surface disappeared in three months, what survives? The rules below survive. The wiring that implements them is described once, at the end, in a clearly non-normative appendix.

**Provenance.** Assembled from the decisions in the source-docs (Overview, Specifications, Implementation Strategy at r4), from the r4 practitioner commentary and the reciprocity addendum drafted for it, and from the practices of the demonstration site as of 2026-10. Drafted by Claude for the practitioner seat (Gustaf), who had not read it when it was written. It has not been read, reviewed or ratified by any other member of the working group.

**Labels.** Every rule carries one or more labels.

| Label | Meaning |
|---|---|
| COMMITTED (Decision N) | Stated in the Overview's "Decisions and justifications" as decision N (1 to 9). Only the working group changes it. |
| SOURCE-DOCS (section) | A method statement in the Specifications or Implementation Strategy that the decisions rely on, restated here. The section is named. |
| PROPOSED | Put forward in the r4 commentary or its reciprocity addendum. Not ratified. The group may adopt, change or refuse it. |
| PRACTICE | What the demonstration does today. It is a fact about the demonstration, not a decision of the group. |

**Rule ids.** Rules are numbered F-1 onward. The numbers are stable: a rule keeps its id when its wording changes, a retired id is never reused, and other documents cite rules by id.

**Names.** First names only, as in the working documents: Adam (GIS architect, r1), Askja (framework author, r2), Deca (synthesiser, r3), Monty (academic researcher), Alaska (named contributor, not yet engaged), Gustaf (practitioner seat, r4).

Test: a reader can say, for any rule, which of the four labels it carries and, for COMMITTED rules, which numbered decision in the Overview it rests on.

## 1. Purpose and stance

A bioregioning tool for communities seeking to belong to a place and help it flourish over fifty to a hundred years.

The framework is a way of looking at a place before anyone arrives. It describes conditions: climate, water, soil, forest, sun, conflict, regenerative networks, population. It describes law: who may own, who has first claim, what planning allows, what the lawful route in looks like. It describes standing: whose land this already is and what arriving asks of them. It does not weigh these against each other for you.

It filters; it never scores, ranks, or tells you where to go.

Three sentences carry the rest.

A place is not a product. It has people, a history and a standing that no listing carries.

Arriving is a relationship. It starts before a purchase and it does not end with one.

Where arriving in a place would harm the community already there, the honest answer is not to go.

**What the tool will not do.**

- It will not score a place, rank places, or name one as better than another.
- It will not tell a group where to go. A group reads the conditions and decides.
- It will not forecast whether a community will thrive. It describes site conditions and law, not the social outcome. Communities fail for social reasons as often as physical ones, and the objective measures in scope describe availability, not viability (r4 commentary on Decision 6).
- It will not give legal advice. It shows what lawful entry involves, in order, with sources.
- It will not verify consent. Nobody named in a Land standing entry has reviewed it. The relationship is the work of the arriving group.
- It will not work at parcel level. It describes regions at regional scale.

Test: read any page of any rendering of the framework and look for a verdict, a rank, an instruction to go somewhere, or a promise about the outcome. There should be none.

## 2. Non-negotiables

These ten rules bind every rendering of the framework: any document, table, map, page or tool built on it.

**F-1** [COMMITTED (Decision 4) · PRACTICE] **No composite scores, no weights, no sums.** Criteria are never combined into one number, index or grade. No weight is offered to the user. Nothing sums across criteria. Decision 4 excludes scoring and weighting from V1, and the Overview records Adam's rule that a composite "livability" score is never built. Whether a later version ever supports weights is an open tension recorded in the Overview ("Weighting authority") and this document does not resolve it. The demonstration applies the rule to itself.

Test: search any rendering for a total, an index, a "match score", a weight control or an average across criteria. Any hit is a violation.

**F-2** [COMMITTED (Decision 4) · PRACTICE] **No ranking, no ordering by fit, no superlatives, no stars or medals.** No region is placed above another. No sentence names a place as the strongest, the most suitable or the one to choose. No star, medal, badge or colour band crowns a place. The Specifications list cross-criterion combination and ranking as out of scope for V1.

Test: search the copy for superlatives and for grades. Check that no list is sorted by any measure of fit.

**F-3** [PROPOSED · PRACTICE] **Threshold filters only: filter, never score.** The user may set a threshold on a criterion and see which regions pass it. The threshold is the user's own number. A filter says pass or fail against that number and says nothing about better or worse. A criterion with no figure for a region (a stated gap) neither passes nor fails that region. The r4 commentary proposes this as a third unit, neither raw data nor a composite, and proposes splitting it from scoring and weighting. Decision 4 places all filter logic outside V1, so this rule is a proposal that the demonstration practises.

Test: every control that changes which regions show is a single-criterion threshold or a categorical choice on one per-jurisdiction fact. No control takes more than one criterion.

**F-4** [COMMITTED (Decision 1)] **Native units.** Each dataset is reported in its own spatial unit and its own measurement unit. No fixed universal grid. No reshaping to make criteria comparable. See section 6.

Test: for every value, the unit of measurement and the spatial unit are stated and are the source's own.

**F-5** [COMMITTED (Decision 5)] **Source, vintage and licence on every value.** No value appears without its source, the period it represents and its licence. Where the licence is unknown, the value says so. See section 5.

Test: pick any displayed value. Its source, vintage and licence (or "licence not confirmed") are visible without a click, or one click away on the same view.

**F-6** [COMMITTED (Decision 8)] **State plus trajectory where meaningful.** Each criterion is described by a current state and, where one is meaningful, a trajectory. Where neither a projection nor an observed trend is meaningful, the trajectory is left empty and only the state is recorded. See section 4.

Test: for every criterion, the trajectory is either filled with a stated basis or visibly empty with a stated reason.

**F-7** [PROPOSED · PRACTICE] **Land standing is qualitative only.** It is never scored, never ranked, never graded, never converted to a number and never offered as a numeric filter. It is read, not computed. It is also never compared between regions as if one standing were better than another. See sections 9 and 10.

Test: no Land standing field holds a number, a grade or a fixed verdict list, and no control filters on it.

**F-8** [PRACTICE] **No personal contact details on public surfaces.** No email address, phone number or personal handle for any member of the working group appears on anything the framework publishes. Members are named by first name and role only, as the working documents name them. Nobody is contacted on the strength of this document.

Test: search every public surface for an address, a number, a handle or a surname. There should be none.

**F-9** [PRACTICE] **Unverifiable means dropped.** A claim, a region or a layer that cannot be reproduced from an opened source is corrected or dropped, never shipped half-done. A region that cannot be completed to this standard does not ship. See sections 5 and 13.

Test: every shipped claim has an opened source in the claims ledger, or carries the words "not verified" in its own sentence.

**F-10** [PROPOSED] **Reciprocity is the spine.** The framework serves communities seeking to belong to a place. Belonging is earned in place. Where arriving would harm the community already there, the answer is not there. In the framework's own words: Where arriving in a place would harm the community already there, the honest answer is not to go.

Test: for every region, the question "whose land is this and what does arriving ask of them" has a visible, sourced answer before any criterion is read as an invitation.

## 3. Criteria model

**F-11** [SOURCE-DOCS (Specifications, Criteria discovery methodology) · PRACTICE] **A criterion is defined completely or not at all.** Each criterion has:

| Field | What it holds |
|---|---|
| id | A short stable key. It never changes meaning. A changed unit or scale gets a new id. |
| name | The plain name. |
| question | The one question it answers, in a sentence. |
| metric | The full metric string: what is measured, over what period, under what scenario, by which dataset. The trend window is part of this string. |
| unit | The measurement unit, native to the source. |
| native spatial unit | The unit the source reports in (a grid cell size, a basin level, event points within a stated distance). |
| time framing | State, projection, observed trend, or none, with the years. |
| source, licence | Name, specific record, licence name and licence link. |
| direction word | Which way the number moves with more of the thing: neutral unless the criterion is a hazard (F-12). |
| sovereignty tags | Which of the four axes it serves, if any (Decision 7). |
| Askja number | Which of Askja's twelve metrics it descends from, if any. |
| tier | Tier-1 or Tier-2 (F-16). |

Test: for any criterion, every field above is present, or its absence is recorded in the inventory note. A criterion with a missing definition field is incomplete, not complete by default.

**F-12** [PRACTICE] **Direction is a neutral word.** Whether more of a thing is good depends on who reads it. The direction word says which way the number runs and whether more of it is a hazard to a settlement. It is never a valuation. Where an existing field stores a valuation word, it is read as the side of the user's own threshold that passes, and a neutral replacement is proposed.

Test: no direction word says better, worse, good or bad about a place.

**F-13** [SOURCE-DOCS (Specifications, Closure rule)] **Closure rule.** Stop adding criteria when new candidates only elaborate within categories already held, rather than adding a new dimension. Concretely: if the next ten candidates all slot into existing categories and overlap substantively with criteria already listed, the inventory is complete enough. Saturation closes discovery.

Test: for any proposed criterion, name the existing category it would sit in. If it fits one, it is not added; if it opens a dimension, it is.

**F-14** [COMMITTED (Decision 6)] **Objective-but-hard-to-measure in; subjective out.** Subjective matters (vibes, aesthetic resonance, personal cultural fit, language preference, what a landscape feels like) are out. Objective-but-hard-to-measure matters (regenerative-network density, civil-society openness, land-use history) are in, where the data can be had, and are treated as hard data. In Askja's terms, metric 12 (Cultural and Lifestyle Fit) is out and metric 3 (Existing Regenerative Knowledge Network) is in. Land standing sits on the objective side: treaty status, tenure and obligation are documentable facts. The feel of a place is carried in prose, not in data.

Test: for any criterion, can a second reader reproduce its value from the cited source? If not, it is subjective and out.

### Askja's twelve metrics

The Specifications adopt Askja's twelve metrics as the starter set, ten in full or in part and two out.

| # | Metric | Status in the source-docs | Why |
|---|---|---|---|
| 1 | Geopolitical and Institutional Resilience | IN | Includes the conflict-proximity data. |
| 2 | Climate Resilience (with projections) | IN | Includes the water-deficit projection data. |
| 3 | Existing Regenerative Knowledge Network | IN | Hard data under Decision 6. |
| 4 | Water Resources (trajectory-weighted) | IN | Includes water-source control. |
| 5 | Land and Ecology | IN | Includes soil contamination and land history. |
| 6 | Existing Infrastructure | PARTIAL | Regional indicators in; parcel level out. |
| 7 | Energy Autonomy | IN | |
| 8 | System Coherence Score | OUT | A composite. The underlying metrics 4, 5 and 7 are in. A V2 and V3 design question. |
| 9 | Accessibility and Connectivity | IN | Includes hospital proximity. |
| 10 | Economic and Legal Context | IN | Includes collective-ownership legality. |
| 11 | Biodiversity and Regeneration Potential | IN | |
| 12 | Cultural and Lifestyle Fit | OUT | Subjective. Decision 6. |

Two cases are easy to conflate and Decision 6 splits them. Metric 12 is subjective: it does not live in datasets. Metric 3 is objective but hard to measure: it lives in directories and contacts the group can reach. Metric 8 is out for a different reason: it is a composite, and F-1 excludes composites.

### Sovereignty tags

**F-15** [COMMITTED (Decision 7)] **Four axes, kept apart.** Sovereignty is not one axis. Geopolitical, legal, material and social are tagged on criteria as a cross-cutting scheme and never collapsed into one. A criterion may serve more than one axis. The tag is information, not a sum. The r4 addendum proposes a fifth consideration, host-community standing, and does not reopen Decision 7 (section 9).

Test: no rendering shows a single sovereignty figure.

### Tier-1 and Tier-2

**F-16** [PROPOSED] **Tier honesty.** Tier-1 is a real ingested layer with measurable completeness, counted toward any coverage claim. Tier-2 is curated or demonstration values, explicitly not counted as ingested coverage. A value that was hand-estimated is never presented as a measured one. See section 8.

Test: every coverage claim names which tier it counts.

### Inventory at 2026-10-05

Wiring-independent facts only. Generated from the facts file (section 3, generation note at the end of this section). Do not edit these tables by hand.

**Slate.** 30 regions: 15 in Europe and 15 in North America. The declared slate order is the order below: the original regions first, new regions appended per continent. The order carries no meaning (F-33).

| Continent | Regions in declared slate order | Count |
| --- | --- | --- |
| Europe | `alentejo`, `galicia`, `transylvania`, `connemara`, `pembrokeshire`, `cevennes`, `south-tirol`, `asturias`, `saxony-anhalt`, `estonia-rural`, `scottish-highlands` (new), `north-karelia-kainuu` (new), `millevaches` (new), `teruel-uplands` (new), `valle-maira` (new) | 15 |
| North America | `cascadia`, `vermont`, `southern-appalachians`, `driftless`, `ozarks`, `northern-new-mexico`, `nova-scotia`, `kootenays`, `quebec-eastern-townships`, `oaxaca`, `finger-lakes` (new), `virginia-piedmont` (new), `bas-saint-laurent` (new), `ne-missouri-se-iowa` (new), `downeast-maine` (new) | 15 |

"(new)" marks a region added after the baseline slate. Land standing entries: 30 for 30 regions; regions without one: none.

**Threshold criteria.** 8 criteria, each a measured or modelled value per region.

| Id | Askja # | Name | Metric | Unit | Native spatial unit | Time framing | Source | Licence | Stored direction token |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `climate` | 2 | Climate trajectory | Mean annual air temperature, 2041–2060 (SSP2-4.5, WorldClim CMIP6 model ensemble) | °C | 2.5 arc-minute grid (~4 km) | projection: 2041–2060 | WorldClim 2.1 CMIP6 downscaled (17-model ensemble, SSP2-4.5) | WorldClim terms (non-commercial use) | `hotter` |
| `water_stress` | 4 | Water stress | Water withdrawals as a share of available supply, 2050 business-as-usual (WRI Aqueduct 4.0) | score | HydroBASINS level 6 sub-basins, area-weighted over the footprint | projection: 2050 (30-year period centred on 2050) | WRI Aqueduct 4.0 (bau50_ws_x_r) | CC BY 4.0 | `worse` |
| `soil_carbon` | 5 | Soil organic carbon | Soil organic carbon, topsoil 0–30 cm (SoilGrids 2.0, depth-weighted) | g/kg | 250 m raster (0–5, 5–15 and 15–30 cm layers weighted 5/10/15) | observed: 1960–2020 (62% of the profiles behind the map; 34% undated) | SoilGrids 2.0 (ISRIC) | CC BY 4.0 | `better` |
| `forest_change` | 11 | Forest cover trajectory | Net tree-cover change per decade (Hansen: gain 2000–2012 minus gross loss 2001–2023, % of year-2000 canopy) | %/decade | 30 m raster, aggregated over the footprint | observed: 2001–2023 | Hansen Global Forest Change v1.11 | CC BY 4.0 | `better` |
| `solar_pv` | 7 | Solar PV potential | Long-term average photovoltaic output (PVOUT, kWh per kWp per year) | kWh/kWp/yr | 30 arc-second grid (~1 km), sampled on a ~6.5 km point grid inside the footprint | observed: long-term average; record start 1994, 1999 or 2007 by satellite region, to 2025 | Global Solar Atlas 2.0 (World Bank Group / ESMAP / Solargis) | CC BY 4.0 (Global Solar Atlas terms) | `better` |
| `conflict` | 1 | Conflict proximity | Fatal political-violence events 2019–2024 within 200 km of the marker (UCDP GED v25.1) | events | event points within 200 km of the marker | observed: 2019–2024 | UCDP GED v25.1 | CC BY 4.0 | `worse` |
| `regen_network` | 3 | Regenerative network density | Web-verifiable intentional communities and regenerative projects within 100 km of the marker (Living Atlas wave-1 baseline; a floor, not a census) | sites | point locations within 100 km of the marker | observed: wave 1, frozen 2026-07-24 | Living Atlas Baseline Census, wave 1 (Regen Community Tools) | licence not confirmed (the suite’s own dataset) | `better` |
| `population` | 9 | Population density | Persons per km², GHS-POP R2023A epoch 2020, mean over the region footprint | p/km² | 1 km raster, footprint mean | observed: epoch 2020 (GHSL modelled estimate) | JRC GHSL GHS-POP R2023A | CC BY 4.0 | `neutral` |

Against the definition in F-11: the question a criterion answers is carried as `framing` and the time framing as `window`. Sovereignty tags and the tier are not carried as fields in the data on this date; carrying them is a proposed change. The unit label of `water_stress` is stored as the word "score". It is one measured ratio, not a composite (F-1), and the cell values carry the unit `ratio`; a rename of the label is proposed.

**Per-jurisdiction qualitative layers.** 7 layers, each recording one fact per jurisdiction, with its completeness computed as regions with a record over regions in the slate.

| Layer | Completeness | Native unit | Source | Vintage | Licence |
| --- | --- | --- | --- | --- | --- |
| `climate_buffering` | 30/30 | per-jurisdiction (point at region centroid) | Per-region climate.md dossiers + national/regional climate-projection sources (CMIP6 SSP2-4.5, IPMA, AEMET, Meteo-France DRIAS, Met Office UKCP18, NCA5, Ouranos, WICCI, etc.) | 2026-05 compilation; per-feature source vintages 2020-2025; re-verified and extended to 30 regions 2026-10 | Research dossiers internal; underlying climate-projection sources are typically open government / publicly funded |
| `demographic_trajectory` | 30/30 | per-jurisdiction (point at region centroid) | National and regional statistical offices (census and statistical-office pages) cited per entry in `source`; dossier readings are marked as such | 2026-05 compilation; re-verified and extended to 30 regions 2026-10 | Research dossiers internal; underlying primary sources carry their own licenses |
| `hospital_proximity` | 30/30 | per-jurisdiction (point at region centroid; distance in km) | OpenStreetMap via Overpass API (amenity=hospital), aggregated per region from EU+NA snapshots | current OSM snapshot (2026-05 compile) | ODbL 1.0 |
| `land_cost` | 30/30 | per-jurisdiction (point at region centroid) | Official land-price statistics where an opened source gave one (MAPA, CSO, Eurostat apri_lprc, Statistics Canada 32-10-0047-01, USDA NASS Land Values, Agenzia delle Entrate, Scottish Land Commission, National Land Survey of Finland); market reports and listings elsewhere, marked `not verified`. Each entry carries its source in `source` and `source_url`. | 2026-05 compilation; per-feature `price_vintage` carries the cited figure's year; re-verified and extended to 30 regions 2026-10 | Research dossiers internal; underlying primary sources carry their own licenses (typically open government / national agriculture-ministry data) |
| `legal_ownership` | 30/30 | per-jurisdiction (point at region centroid) | Primary legal texts and official guidance opened for the 2026-10 legal pathway pass (Diário da República, BOE, Riigi Teataja, legislatie.just.ro, Publications du Québec, Arkansas Legislature, National Agricultural Law Center and others); each entry carries its primary source in its `source` property. Statements no opened source supported are removed or say `not verified`. | 2026-05 compilation; per-feature regulatory_notes carry the latest known change; re-verified and extended to 30 regions 2026-10 | Research dossiers internal; underlying primary sources carry their own licenses (typically open government) |
| `soil_contamination` | 30/30 | per-jurisdiction (point at region centroid) | Official environment-agency and regulation pages opened (named per entry); contamination data was NOT a structured research focus, so the layer captures regulatory regime + known signals only, and dossier readings are marked `not verified` | 2026-05 compilation; re-verified and extended to 30 regions 2026-10 | Research dossiers internal; underlying primary sources (national contamination registers) carry their own licenses |
| `water_source_control` | 30/30 | per-jurisdiction (point at region centroid) | Water-rights statutes and regulator pages opened (named per entry); dossier readings are marked as such | 2026-05 compilation; re-verified and extended to 30 regions 2026-10 | Research dossiers internal; underlying primary sources (water-rights statutes, regulator docs) carry their own licenses |

**Categorical qualitative filters.** 4 filters, each a choice on one per-jurisdiction fact. They filter; they never score.

| Filter id | Fact it filters on |
| --- | --- |
| `foreign_ownership` | Whether a foreign or non-resident buyer may own rural land: yes, restricted or no. |
| `affordability_band` | The land-cost band the region falls in, in the layer's own descriptive bands. |
| `buffering_strength` | How much structural climate buffering the region has, in the layer's own descriptive scale. |
| `regulatory_direction` | Which way the ownership rules are moving: stable, tightening, loosening or swinging without a direction. |

**Map layers.** The facts file records 0 map layers with method "none found" because the layer registry was being rebuilt in the same working tree on this date. The table is therefore read from the layer source registry directly on the same date: 23 layers in use (11 retired layers are left out). It lists what each layer is and where it comes from, never a ranking of layers.

| Layer | Theme | Source | Vintage | Licence |
| --- | --- | --- | --- | --- |
| Precipitation | Climate and water | OpenLandMap precipitation | long-term mean (SM2RAIN-derived) | licence not confirmed (the existing attribution says CC-BY-SA 4.0) |
| Water stress 2050 | Climate and water | WRI Aqueduct 4.0 | 2050, business as usual (WRI Aqueduct 4.0) | CC BY 4.0 |
| Water depletion 2050 | Climate and water | WRI Aqueduct 4.0 | 2050, business as usual (WRI Aqueduct 4.0) | CC BY 4.0 |
| Climate zones 1991-2020 (Köppen-Geiger) | Climate and water | Koppen-Geiger (Beck 2023) | 1991-2020 (observed climate) | CC BY 4.0 |
| Climate zones 2041-2070 (Köppen-Geiger, SSP2-4.5) | Climate and water | Koppen-Geiger (Beck 2023) | 2041-2070, SSP2-4.5 (projected climate) | CC BY 4.0 |
| Forest loss | Land and ecology | GFW tree cover loss | UMD tree cover loss v1.13 | CC BY 4.0 for the Hansen et al. data (confirmed on the data page) |
| Soil organic carbon | Land and ecology | ISRIC SoilGrids 2.0 | SoilGrids 2.0, 0-30 cm mean | licence not confirmed (the existing attribution says CC BY 4.0) |
| Land cover (10m) | Land and ecology | Esri 10 m land cover | Sentinel-2 10 m annual land cover; the year is the service default and is not pinned in the URL | licence not confirmed (the existing attribution says CC BY 4.0) |
| Land cover, ESA WorldCover 2021 (10 m) | Land and ecology | ESA WorldCover 2021 | 2021, product version v2 (200) | CC BY 4.0 (free of charge, without restriction of use) |
| Solar PV potential | Energy | Global Solar Atlas | Global Solar Atlas long-term average; version not stated by the Resource Watch layer | licence not confirmed (the existing attribution says CC BY 4.0) |
| Coastal flood / SLR | Hazards | Aqueduct Floods | RCP8.5 scenario; the service item states metres of coastal inundation and no year or return period | CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement |
| River flood depth, 1-in-50-year (1960-1999) | Hazards | Aqueduct Floods | 1960-1999 simulation, 1-in-50-year river flood | CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement |
| River flood depth, 2050 (SSP2/RCP4.5) | Hazards | Aqueduct Floods | 2050, SSP2/RCP4.5, mean of 5 climate models | CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement |
| River flood depth, 2050 (SSP3/RCP8.5) | Hazards | Aqueduct Floods | 2050, SSP3/RCP8.5, mean of 5 climate models | CC BY 4.0 (Aqueduct); the ArcGIS rehost carries no licence statement |
| Seismic hazard | Hazards | GEM seismic hazard | GEM Global Seismic Hazard Map version 2023.1 | CC BY-NC-SA 4.0 (GEM raster, per the ArcGIS item description opened 2026-10-05); the non-commercial term applies if the working group ever commercialises |
| Population density | People | GPW v4.11 | GPW v4.11, 2020 estimate | licence not confirmed (the existing attribution says CC BY 4.0) |
| Travel time to cities | People | MAP travel time | 2015 (Weiss et al. 2018) | licence not confirmed (the existing attribution says CC BY 4.0) |
| Conflict density | People | UCDP GED | UCDP GED v25.1 | CC BY 4.0 |
| Ecovillage sites | People | OpenStreetMap | OpenStreetMap snapshot retrieved 2026-05-19 (Europe) and 2026-05-27 (North America) | ODbL 1.0 |
| Terrain relief | Imagery | Esri World Hillshade | Esri World Hillshade (continuously maintained basemap service) | licence not confirmed (Esri terms; attribution required) |
| Topographic map | Imagery | OpenTopoMap | continuously updated (OpenStreetMap data, SRTM relief) | licence not confirmed (the existing attribution says CC-BY-SA; map data ODbL) |
| Recent satellite | Imagery | EOxCloudless 2021 | Sentinel-2 cloudless mosaic, 2021 | licence not confirmed (Copernicus Sentinel data; EOX terms not opened) |
| Night lights | Imagery | Black Marble | VIIRS Black Marble, 2016 | licence not confirmed (NASA GIBS imagery; credit NASA Earth Observatory) |

**Generation note.** The tables above are generated from a facts file (named in the wiring appendix; generated 2026-10-05T16:19:16.321Z, sha256 75d8e828240be101e8717c5bcfe012046aca958825fd2b8a84ff07fea7b9d474) by reading the data modules directly. The criteria, slate, per-jurisdiction layers and filters come from that file. The map-layer table and the field counts in sections 10 to 12 are read from the same modules on the same date. When the data changes, regenerate; do not patch the tables.

Test: the facts file named above exists, its hash matches, and every table row traces to it.

## 4. State plus trajectory

**F-6 restated.** Decision 8 makes state plus trajectory the standard description of a criterion. The state is the current value or range. The trajectory is a direction.

Decision 8 names four directions: stable, improving, declining, and a fourth for a series that swings without a direction. The demonstration records the direction of a number as rising, falling or steady. These are neutral: they say which way the number moves, not whether that is good (F-12). That is a practice that refines the vocabulary of Decision 8 and does not change it: "improving" and "declining" carry a valuation, and for most criteria the valuation depends on who is reading.

**F-17** [COMMITTED (Decision 8)] **Three ways to fill the trajectory.**
1. A projection, where a credible one exists (a climate scenario, a demographic projection). The scenario is named.
2. An observed trend over a stated window, where projections are not credible but observed change is meaningful. The window is stated.
3. Null, where trajectory is not meaningful at the timescales that matter (soil composition is the Overview's example). The reason is stated.

Test: for every criterion, one of the three is chosen and written down.

**F-18** [PRACTICE] **The window belongs to the metric.** A trend window is part of the metric string. Every cell in that criterion must use the same window, or the exception is labelled in the cell. A cell that quietly uses a different window from its neighbours is a defect.

Test: compare the window in the metric string with the basis in every cell. They match, or the cell labels its exception.

**F-19** [PROPOSED] **Trajectory for the host community, never for the settler's amenity.** Where a trajectory is shown for a place's people (depopulation, in-migration, displacement), it is the host community's trajectory, sourced. A trajectory is never shown for the settler's own comfort, such as how desirable a place is becoming.

Test: every shown trajectory about people names whose trajectory it is.

**F-20** [PRACTICE] **One point is one point.** Where the data supplies a single point in time, the state is shown and the trajectory is empty. A direction is never inferred from one point.

Test: no direction word appears on a criterion whose data holds one observation.

## 5. Provenance rules

**F-21** [COMMITTED (Decision 5) · PROPOSED · PRACTICE] **Every value carries the same record.** Value; unit; vintage (the period the value represents, never the year it was published); source name; the specific record URL (never a landing page); licence name and licence link; retrieval date. For qualitative layers also a `data_confidence` of high, medium, low or unknown, and a `gaps` list saying what was not found.

Test: for a random sample of values, every field above is present.

**F-22** [PRACTICE] **A claims ledger per region.** For each region, every claim in its Land standing entry, its depth text and its legal pathway is listed with its source and a state: verified, corrected or unverified. A claim that is unverified is rewritten to what an opened source supports, removed, or marked "not verified" in its own sentence. The word "verified" in the ledger means checked against an opened source. It never means reviewed or approved by anyone named.

Test: pick any claim on any page. The ledger names the opened source it rests on, or the sentence says "not verified".

**F-23** [PRACTICE] **An unopened source is not evidence.** A source that could not be opened is not cited. A source that was opened is recorded with the date it was opened and how.

Test: every cited URL appears in the opened-sources record for its region.

**F-24** [PRACTICE] **Dead links are replaced or dropped.** A dead link is replaced with a working source for the same claim or the claim is dropped. The check date is recorded. No document claims that all links are live; it states the date of the last check and the exceptions, with a reason for each.

Test: the link-check record carries a date, counts and an exceptions list.

**F-25** [PRACTICE] **Primary and official first.** Prefer primary and official sources. Statutes come from the official gazette. Claims about a nation come from that nation's own bodies where they can be reached; where only a secondary summary can be reached, the label says so.

Test: for each territory claim, the source label says whose voice it is.

**F-26** [PRACTICE] **Reproduce or correct.** A numeric value that cannot be reproduced from its stated source is corrected to the reproduced value or dropped. The earlier value and the reason are recorded in the cell's audit note.

Test: for a sample of values, recompute from the source. They agree within the stated tolerance.

**F-27** [PRACTICE] **Out of range is flagged, not clamped.** A value outside the display range of a control widens the range; it is never clamped to fit. An out-of-range value is flagged for a second reader.

Test: no displayed value equals its control's limit by construction.

**F-28** [PROPOSED · PRACTICE] **Proxies carry their caveat.** When an approximation stands in for the true metric (a straight-line distance for a travel time), the caveat is recorded on the feature itself and in the layer's own description. The true metric replaces it when it becomes available.

Test: for every proxy, the caveat is visible on the value.

## 6. Native units and the Modifiable Areal Unit Problem

**F-4 restated.** Decision 1 preserves each dataset's native spatial unit and crosses unit boundaries only when a specific analysis demands it. The Modifiable Areal Unit Problem has two effects: the scale effect, where results change with the level of aggregation, and the zoning effect, where results change with how the zones are drawn. It cannot be solved; it can only be managed. The practice Decision 1 adopts is: native units with transparency on scale and source; multi-scale reporting where applicable; sensitivity analysis where conclusions depend on scale; principled interpolation only when crossing unit systems cannot be avoided.

**F-29** [COMMITTED (Decision 1)] **No universal grid.** Nothing is reshaped to a common grid to make criteria comparable. Comparing criteria with each other is not a reason to change units.

Test: each criterion states its own spatial unit, and no pair of criteria shares one only because they were reshaped.

**F-30** [SOURCE-DOCS (Specifications, Native units policy)] **Crossing units needs a declared method.** A cross-unit operation is allowed only when an analysis demands it, with the method declared as part of the result. The literature-recommended method is dasymetric mapping. The method is recorded with the result.

Test: for every value computed across unit systems, the method is stated.

**F-31** [PRACTICE] **A disc is a stated unit, not a region.** A statistic computed over a stated radius around a point (events within a stated distance, sites within a stated distance) is a statistic over that disc. It is not a truth about the region. The radius is part of the metric string and is repeated wherever the number appears.

Test: every disc statistic names its radius and its centre.

**F-32** [COMMITTED (Decision 1)] **Report scale, don't merge it.** Where scale matters, report each scale as its own level (for example drainage basins at levels 4, 5 and 6 reported as levels, not merged into one figure).

Test: a scale-sensitive value names its level.

## 7. Filters, not scores

**F-3 restated.** The only controls that change which regions show are these.

- A **threshold** on a single criterion: pass or fail against the user's own number.
- A **categorical choice** on a single per-jurisdiction fact (foreign ownership allowed, restricted or not; the regulatory direction; and the like).

Not allowed in any form: weights; sums; composite indices; sort-by-fit; and a per-region tally of criteria met, whether written as words, digits, dots, bars or ticks that add up. A count across criteria is a sum (F-1).

**F-33** [COMMITTED (Decision 4) · PRACTICE] **No count of criteria met; slate order carries no meaning.** No count of criteria met is shown for any region. The only count shown is how many regions are within the user's thresholds. The order of regions is the declared slate order, with new regions appended per continent. It carries no meaning and is never an order of fit. A rendering that reorders regions by how many thresholds they pass has built a ranking.

Test: no region card shows a tally across criteria; the region list does not change order when thresholds change.

**F-34** [PRACTICE] **Descriptive scale words, not grades.** Where a scale word is needed, use the word the source uses for its own range (low, moderate, high) or the unit itself. Never excellent, good or poor.

Test: no scale word reads as a grade of a place.

**F-35** [PRACTICE] **Colour is not a valuation.** A colour marks a class or a range. It does not say good or bad. No red-to-green meaning is carried by the framework's own marks.

Test: every legend states what a colour marks, and none implies a verdict.

**F-36** [PRACTICE] **No superlative ranks a place.** No sentence ranks a region against others, by superlative or by implication.

Test: read the copy for each region without the others. Expected: none says it beats, outranks or leads another.

**F-37** [COMMITTED (Decision 9) · PROPOSED] **Surface, don't enforce.** Askja's baseline-critical criteria (climate trajectory, water trajectory, political stability, red lines) are not weighted for the user. The Overview records Askja's concern: groups drift toward what feels good and underweight what is critical but dull. The r4 commentary proposes a hybrid: every criterion appears equally; the user sets thresholds; copy and visual hierarchy foreground the load-bearing ones (water trajectory, legal feasibility, climate buffering). Red lines remain the user's own thresholds. Decision 9 keeps red-line filtering out of V1; this document proposes only the surfacing.

Test: the load-bearing criteria are foregrounded by position and wording; none is enforced, none is weighted.

Land standing is never filtered or compared numerically (F-7).

Test: list every control that changes which regions show. Each one is a single-criterion threshold or a single categorical choice, and no control, count or order combines criteria.

## 8. Tier honesty and completeness

**F-38** [PROPOSED] **Three completeness modes.** A single areal coverage percentage fails per-jurisdiction facts, which have no raster coverage by construction. The r4 commentary on the V1 ship gate proposes three modes, each measured differently.
1. **Areal coverage** (rasters, basin polygons): the share of the stated scope covered at native resolution.
2. **Presence completeness** (events, sites): measured against a reference or stated as ingested with a documented coverage limit.
3. **Per-jurisdiction completeness** (legal ownership, land cost, climate buffering, water-source control, soil contamination, demographic trajectory, hospital proximity): the share of in-scope jurisdictions with a recorded value.

Test: each coverage claim states its mode.

**F-39** [PRACTICE] **"N of M" statements are computed, never typed.** Every count in prose (regions, criteria, layers, filters, completeness) comes from the facts file at the date of writing. A count that was typed by hand is stale by construction.

Test: regenerate the facts; every count in the text matches.

Tier-2 values, and any layer thinner than its neighbours, say so in their own sentence (F-16, F-21).

Test: pick any coverage or count sentence. It names its mode and its tier, and regenerating the facts reproduces the number.

## 9. Reciprocity and host-community standing

**The argument in a page.** Decision 7 names four axes of sovereignty: geopolitical, legal, material and social. Read each with one question: whose? Each is the incomer's sovereignty. Geopolitical stability around us. Property rights and freedom from interference for us. Food, water and energy independence for our settlement. Our community's self-governance. The one place the people already on the land appear is as a property of the destination: how welcoming they will be to us. The framework has a full vocabulary for the arriving group's self-determination and none for the standing of those already rooted in the place.

**F-40** [PROPOSED] **A fifth consideration: host-community standing.** The r4 addendum proposes, for criteria discovery, a fifth consideration beside the four axes, and does not reopen Decision 7. It asks: whose land is this already, under what tenure and what law (including treaty and customary law), and what would arriving ask of, or take from, them? It obeys every discipline here: never a score (F-7), state plus trajectory where meaningful (F-6), source and vintage (F-5). It is the objective-but-hard-to-measure kind that Decision 6 puts in.

Test: for each region, the consideration is answered in qualitative fields with sources, and nowhere as a number.

**The failure mode.** A tool that helps relatively well-resourced groups scan continents for available land is one design decision from being an instrument of green colonialism: a land grab with better intentions. The coordinates a framework of this kind would call suitable for a regenerative settlement are often someone else's home. The discipline that prevents it is reciprocity: not "are the locals open to us" (the incomer asking what the welcome can give) but what our arriving gives and takes, who was already in relationship with this land, and whether they have standing in whether we come.

**The mechanism.** In-migration by buyers with outside income can raise land prices against local incomes and can displace the residents who hold the place. The conditions a settlement tool foregrounds (secure water, a mild climate, workable land, a lawful route) are the same conditions that draw that pressure. This document quotes no figure for it. A displacement figure appears in a region's entry only where that entry's own sources state it (proposed field `displacement`, held today in the field `trajectory` of the reciprocity layer; section 10), and is stated with its basis and its limits.

**F-41** [PRACTICE] **State only what the claims ledger verified.** No sentence about displacement, recognition or dispute appears unless an opened source states it, and then in the source's voice and with its attribution. A contested status is stated as contested. Where a source for a disputed matter could not be read, the entry says nothing rather than choosing a side.

Test: every sentence about a host community's circumstances is attributable in the ledger.

**What the framework does about it.**

- **Land standing is displayed**, for every region, before any criterion invites a decision (F-10).
- **Harm is screened at admission** (section 13): a region where arriving would harm the community already there, or where entry has no consent route, is not admitted.
- **"Not there" is a legitimate outcome.** A region may carry a short, sourced statement of the form of arrival that the sources say does not work, and the honest answer for that form of arrival is not there.

**F-42** [PROPOSED] **"Not there" is a legitimate answer.** A rendering never treats a refusal as a gap to be worked around. A place may be shown with the plain statement that a given way of arriving does not fit, and the statement is sourced.

Test: no copy suggests how to get round a refusal.

**What it cannot do.** It cannot verify consent. It cannot know whether a nation, a commons or a village would welcome a particular group. It cannot stand in for the conversation. The first conversations listed for a region (the bodies that hold or speak for the place) are where the relationship starts, and starting it is the work of the arriving group.

**F-43** [PROPOSED] **The two continents are framed differently, on purpose.** In North America, the entry names the Indigenous nation or nations whose land it is and the treaty, cession or unceded status, drawn from the nations' own sources where they can be reached. In Europe, the entry names the rooted community, the commons or the land tradition (a parish commons, a village assembly, a farm-family tenure), and does not impose an Indigenous frame on a place where that is not the relationship in question. Where a European region is the homeland of an Indigenous or minority people, the entry names them from their own sources. The rule is to name who is there, in the terms they use, not to apply one frame everywhere.

Test: for each region, the entry names who is there in terms from their own sources, and no frame is applied that the sources do not support.

**F-44** [PROPOSED] **Standing is earned in place, not purchased.** Nothing in the framework lets standing be bought, offset or scored down against cheaper land. A numeric standing would let a group buy down a nation's standing against a lower price per hectare, which is what the rule exists to stop.

Test: no price, fee or score appears in any Land standing field.

## 10. Land standing schema (qualitative, never scored)

The proposed shape. All fields are text, sourced, and none holds a number, a grade or a fixed verdict (F-7).

| Proposed field | Holds |
|---|---|
| `territory` | Whose land: the nation or nations and the treaty, cession or unceded status, or the rooted community or commons institution. |
| `tenure` | The tenure reality, and what cannot be bought. |
| `entry` | The relational and lawful route in. It never begins with "Buy". It names the consenting body where one exists. |
| `obligation` | What the arrival owes. An obligation, not an acknowledgement. |
| `displacement` (PROPOSED) | The state plus trajectory of the host community, sourced. May be `unknown`. |
| `reciprocal_vehicle` (PROPOSED) | An existing structure through which arrival can be made reciprocal (a community land trust, a land-back body, commons membership). May be `none found`. |
| `harm_note` (optional, PROPOSED) | Prose where arriving would harm. Free text; never enumerated, never a grade. |
| `source`, `sourceUrl` | A document that supports the territory claim itself, not only a price report. |
| `checked_on` | The date the entry was checked against opened public sources. |

**F-45** [PROPOSED · PRACTICE] **Every claim cites an opened source; contested status is stated as contested.** Nothing is asserted without a source that was opened. A word such as "unceded" is used only where a source supports it, and where none does the same sentence says "not verified". The practitioner seat chose to keep that word where the demonstration already used it (a decision of 2026-07). The rule here is that the sentence then says what is and is not sourced.

Test: for each strong term in `territory`, the source or the words "not verified" are in the same sentence.

**F-46** [PROPOSED] **`entry` never begins with "Buy".** It starts with the body whose consent or process governs entry, or with the relational step.

Test: no `entry` value begins with "Buy".

**F-47** [PROPOSED] **`obligation` is an obligation.** "Acknowledge whose land this is" is not an obligation; it is a gesture. An obligation says what the arrival owes: a duty, a contribution, a standing earned, a norm kept.

Test: each `obligation` names something the arrival does or gives or keeps.

**F-48** [PROPOSED · PRACTICE] **No review claim.** Every entry says that no nation or community named in it has reviewed it, until one has. The date field is `checked_on`: it means "checked against opened public sources on this date". It never means reviewed, approved or consented to. Where a source is one nation's own page, an archived copy, a secondary summary or an agency that speaks for none of them, the label says which.

Test: every entry carries the no-review sentence, and no sentence anywhere calls an entry reviewed by the people it names.

**F-49** [PRACTICE] **No Land standing entry, no region.** A region without an entry checked against opened public sources does not ship (F-9).

Test: the number of regions in the slate equals the number of entries, and the difference is zero.

### Mapping to the final field names

The final shape on the inventory date differs from the proposed names. The table maps each proposed field to the field that holds it today. Counts are generated from the data modules on 2026-10-05.

| Proposed field | Field that holds it today | Where | Present in | Note |
| --- | --- | --- | --- | --- |
| `territory` | `territory`; `territorySource`, `territorySourceUrl` (the page the territory wording rests on) | Land standing entry | 30/30; territory source 15/30 | Also `territoryShort`, a short label of the same claim, in the reciprocity layer. |
| `tenure` | `tenure` | Land standing entry | 30/30 |  |
| `entry` | `entry` | Land standing entry | 30/30 | Never begins with "Buy" (F-46). |
| `obligation` | `obligation` | Land standing entry | 30/30 |  |
| `displacement` | `trajectory` (`text`, `sources`, `kind`) | Reciprocity layer | 3/30 (null where no opened source states one) | Sourced and attributed; null is `unknown`. |
| `reciprocal_vehicle` | `firstConversations[]` (`name`, `kind`, `url`, `what`, `checked`, `via`); a vehicle is an entry of kind `access` or `commons` | Reciprocity layer | 16/30 regions list at least one of those kinds | The real field is wider: it lists the bodies a first conversation starts with. A region with none of those kinds reads as `none found`. |
| `harm_note` | `notThere` (`forms[]`, `basis[]`) | Reciprocity layer | 19/30 (null where no opened source states a form) | Prose, sourced, never a grade. Null is a stated gap, not a clean bill. |
| (none proposed) | `contested` | Reciprocity layer | 0/30 | Where a status is contested the entry says so (F-45). Null where it was withheld pending human review. |
| `source`, `sourceUrl` | `source`, `sourceUrl`; `sources[]` (`claim`, `label`, `url`) | Land standing entry | 30/30; list 15/30 | The list gives per-claim sources where the single source is not enough. |
| (claims ledger, F-22) | `claims[]` (`field`, `claim`, `label`, `url`) | Reciprocity layer | 30/30 | Each claim names the Land standing field it supports. |
| `checked_on` | `reviewed` (a date) | Reciprocity layer | 30/30 | The date the entry was checked against opened public sources. It never means review by anyone named (F-48). |
| (entry state) | `status` | Reciprocity layer | 30/30; values: `verified` | Stored word is `verified`; read as "checked against opened public sources". |

The `status` value stored with each entry is the word "verified" in the data. Read it as "checked against opened public sources", never as review or approval (F-22, F-48).

Test: every proposed field maps to a real field or to a stated absence, and every real field in the data appears in the table.

## 11. Legal pathway block (qualitative, not advice)

Purpose: to show what lawful, relational entry actually involves, in order. It is not scored or ranked, and it is not legal advice.

**F-50** [PROPOSED · PRACTICE] **Not advice, every time.** Every rendering carries the one-line sentence that it describes how the law and the process are laid out in the sources opened, and is not legal advice and not a substitute for a lawyer in the jurisdiction.

Test: the not-advice sentence is present wherever the block is shown.

**F-51** [PROPOSED · PRACTICE] **Restricted regions stay visible.** A region where foreign or non-resident ownership is restricted is shown, with the restriction stated. Restriction is never a reason to hide a region and never a reason to rank it.

Test: no filter or sort removes a restricted region silently.

**F-52** [PROPOSED] **Never "workaround".** A legal restriction is not an obstacle to defeat. No copy suggests a way round it. Where the law bars a structure (a nominee front-owner, for example), the block says it is barred.

Test: search the copy for workaround, loophole and the like. Expected: none.

**F-53** [PROPOSED · PRACTICE] **Timelines only where a source states them.** A duration appears only as a range a source gives, with that source. No duration is estimated.

Test: every duration has a source and a unit.

**Proposed content, in order.** Foreign or non-resident ownership rule; who holds pre-emption or first claim; the collective vehicles available; the planning gate for living on the land; the ordered entry steps and who must consent at each (an assembly, a parish commons, an irrigation community, a community landowner); typical durations as cited ranges only; the professional needed; prohibited structures; the regulatory direction; honest gaps and a `data_confidence`; sources.

### Mapping to the final field names

| Proposed content | Field that holds it today | Shape and values on the inventory date | Present in |
| --- | --- | --- | --- |
| Foreign or non-resident ownership rule | `nonResidentOwnership` | `status`: `open`, `open_with_conditions`, `restricted`; `summary`, `source`, `sourceUrl` | 30/30 |
| (not proposed) residency link | `residency` | `link`: `no_link`, `residency_required`, `separate_route`, `unknown`; `summary`, `source`, `sourceUrl` | 30/30 |
| Planning gate for living on the land | `zoning` | `route`: `case_by_case`, `dedicated_route`, `unknown`; `summary`, `source`, `sourceUrl` | 30/30 |
| Collective vehicles available | `collectiveForms[]` | `kind`: `association`, `commons`, `company`, `cooperative`, `land_trust`, `other`; `name`, `summary`, `source`, `sourceUrl` | 30/30 |
| Who holds pre-emption or first claim | `firstClaim[]` | Plain statements, one per right | 30/30 |
| Ordered entry steps and who must consent | `steps[]` | `n`, `what`, `who` (the body whose consent or process governs the step, and any professional needed), `source`, `sourceUrl` | 30/30; 142 steps in all |
| Typical durations, as cited ranges only | `steps[].duration` | `text`, `source`, `sourceUrl`; carried by 36 of 142 steps | 24/30 |
| Professional needed | no separate field | Named inside `steps[].who` | n/a |
| Prohibited structures | `ruledOut[]` | Plain statements of what the law bars | 30/30 |
| Regulatory direction | `direction`, `directionNote` | `direction`: `stable`, `tightening`, `unknown` | 30/30 |
| Honest gaps | `gaps[]` | What was not found or not opened | 30/30 |
| `data_confidence` | `confidence` | values on the date: `low`, `medium` | 30/30 |
| Date checked | `verifiedOn` (checked against opened public sources), `asOf` | Dates | 30/30 |
| Sources | `source`, `sourceUrl` on each part | Each block part carries its own | n/a |

Test: for a sample of regions, each rendered statement traces to a source in its block, and each gap is stated.

## 12. Bioregion framing

**F-54** [PROPOSED · PRACTICE] **A descriptive reading, not a boundary.** A bioregion in this framework is a descriptive reading of where a region sits ecologically: the ecoregion or ecoregions it overlaps (with the share of the stated disc), the watershed or watersheds it drains to, and the major rivers. It is not a boundary the framework draws and it is not a claim about cultural bioregions. Cultural-geographic bioregioning (people, language, land tradition) cannot be derived from datasets. It is carried in prose: Land standing, and "what living here asks of you".

Test: no rendering draws a bioregion boundary of its own or says that a place "is in" a cultural bioregion on the strength of a dataset.

**F-55** [PRACTICE] **Native units, named dataset.** Ecoregion polygons are the published polygons. Basin polygons are used at their published levels. River lines are the source's lines. Names are the published dataset's names, with its licence and version.

Test: every ecoregion name matches the published dataset's name.

**F-56** [PRACTICE] **State the method with the number.** A membership figure states the radius, the dataset and the rounding. The demonstration's method on 2026-10-05: a disc of a stated radius around the region's reference point; the ecoregions that overlap its land area; the share of each; shares rounded to five percent; entries under ten percent dropped. The radius is 100 km. The dataset is RESOLVE Ecoregions 2017, licence CC BY 4.0, vintage 2017 (files dated 2018-11-07, attribute table 2019-05-07).

Test: each membership figure carries its radius and its rounding.

**F-57** [PRACTICE] **Limitations on every rendering.** Any rendering of bioregion membership states three limits. A disc around a point is not the region's footprint. Regions at an edge straddle ecoregions. The datasets are coarse, and polygons shown are simplified.

Test: each rendering carries the three limits.

### Mapping to the final field names

| Proposed element | Field that holds it today | Shape | Present in |
| --- | --- | --- | --- |
| Ecoregion or ecoregions overlapped, with share of the disc | `ecoregions[]` | `id`, `name` (the dataset's own), `biome`, `share` (a fraction rounded to five percent; entries under ten percent dropped) | 30/30 |
| Dominant ecoregion | `primaryEcoregion`; `biome` | Text | 30/30 |
| Ecoregion at the reference point itself | `pointEcoregion` | Text; may differ from the dominant one at an edge | 30/30 |
| Watershed or watersheds and major rivers | `watershed` | `major` (the named basin or basins), `rivers[]`, `drainsTo`, `straddlesDivide`, `riversCheckedAgainstNaturalEarth[]`, `riversFromDossierOrKnowledge[]` | 30/30 |
| The centre of the disc | `refPoint` | Longitude, latitude of the region's reference point | 30/30 |
| Radius and method | `method` | One string stating radius, dataset, rounding and drop threshold | 30/30 |
| A plain name for the reading | `place` | Text | 30/30 |
| Datasets, licences, vintages | `bioregionSources` | One record each for ecoregions, rivers and basins: `name`, `url`, `license`, `licenseUrl`, `vintage`, `checked` | once |

Watershed level is not stored per region: `watershed.major` names the basin, and the basin dataset was used for analysis only. Reporting basins at their published levels (F-32) is therefore a proposed improvement, not a current fact.

Test: a reviewer can pick any region, name its ecoregions with their shares, and find the radius, the dataset and the three limits stated with them.

## 13. How to add a region

The admission protocol. It is tool-independent: a group with a spreadsheet and a library card can follow it.

**F-58** [PROPOSED · PRACTICE] **Admission in order; any unverifiable required element drops the region.**

1. **Reciprocity screen first.** Who is already here? Is there a consent-based route in? Would arrival harm? A region where arriving would harm the community already there is not admitted. The geographic scope on 2026-10-05 is Europe and North America. That scope is a proposal and unconfirmed; scope remains emergent, as Decision 3 holds.
2. **An exact footprint.** Administrative units or a basin set, never a point. The footprint is recorded with the region.
3. **Eight criteria**, each with a vintage consistent within the criterion, each reproduced from its stated source or dropped. Out-of-range values are flagged (F-27).
4. **Per-jurisdiction layers**, all seven, each with a `data_confidence` and `gaps`.
5. **A Land standing entry**, checked against opened public sources. It says that nobody named has reviewed it (F-48).
6. **A legal pathway block** (section 11).
7. **Bioregion membership** (section 12).
8. **A "what living here asks of you" paragraph** in the form "X asks you to ...", with a source.
9. **A blurb** in the place-first register: the place before the pitch.
10. **A claims ledger, a link check and a second-reader check.**
11. **The drop rule.** Any unverifiable required element drops the region. A region is never shipped half-done.
12. **Update every count from computed facts** (F-39).
13. **Record the admission** in the Collaboration Log, or in the deviation log if it departs from this protocol.

Test: a reviewer can tick all thirteen steps from the region's record, or the region is not in the slate.

**F-59** [PROPOSED] **Exclusions.** Three categories are excluded at step 1.
- **Amenity hotspots**, where the framework would be the accelerant: places already under the in-migration pressure described in section 9.
- **Places where entry has no consent route**: no assembly, commons, community landowner or lawful process through which a newcomer can be received.
- **Sovereign-territory exclusions**, such as reservations, where the nation's own sovereignty is the answer.

Test: each excluded category has a named example in the deviation log or none was met.

## 14. Who may change what

The source-docs hold the collaboration protocol. This file follows the source-docs and never the reverse. Decisions marked as committed in the source-docs are not overwritten here. Commentary is added beneath them, attributed.

| Kind | Who changes it | How |
|---|---|---|
| COMMITTED | The working group | A group sync, recorded in the Collaboration Log. |
| SOURCE-DOCS | The working group | The same, in the Specifications or Implementation Strategy. |
| PROPOSED | Anyone in the group may propose; the group adopts | Discussed at a group sync. If adopted it becomes COMMITTED in the source-docs and the label here changes. |
| PRACTICE | The person who maintains the demonstration | Changed as the demonstration changes; the date in the header is updated. |

**F-60** [PRACTICE] **Promotion.** A rule here moves from PROPOSED to COMMITTED only when the source-docs record the decision. Until then it is offered, not binding. This file is then updated to cite the decision number. A rule that the group refuses is deleted with its id retired.

Test: every COMMITTED label cites a decision that exists in the Overview.

### Rule register

Generated from the rules above.

| Id | Section | Label | Rule |
| --- | --- | --- | --- |
| F-1 | 2 | COMMITTED (Decision 4) · PRACTICE | No composite scores, no weights, no sums |
| F-2 | 2 | COMMITTED (Decision 4) · PRACTICE | No ranking, no ordering by fit, no superlatives, no stars or medals |
| F-3 | 2 | PROPOSED · PRACTICE | Threshold filters only: filter, never score |
| F-4 | 2 | COMMITTED (Decision 1) | Native units |
| F-5 | 2 | COMMITTED (Decision 5) | Source, vintage and licence on every value |
| F-6 | 2 | COMMITTED (Decision 8) | State plus trajectory where meaningful |
| F-7 | 2 | PROPOSED · PRACTICE | Land standing is qualitative only |
| F-8 | 2 | PRACTICE | No personal contact details on public surfaces |
| F-9 | 2 | PRACTICE | Unverifiable means dropped |
| F-10 | 2 | PROPOSED | Reciprocity is the spine |
| F-11 | 3 | SOURCE-DOCS (Specifications, Criteria discovery methodology) · PRACTICE | A criterion is defined completely or not at all |
| F-12 | 3 | PRACTICE | Direction is a neutral word |
| F-13 | 3 | SOURCE-DOCS (Specifications, Closure rule) | Closure rule |
| F-14 | 3 | COMMITTED (Decision 6) | Objective-but-hard-to-measure in; subjective out |
| F-15 | 3 | COMMITTED (Decision 7) | Four axes, kept apart |
| F-16 | 3 | PROPOSED | Tier honesty |
| F-17 | 4 | COMMITTED (Decision 8) | Three ways to fill the trajectory |
| F-18 | 4 | PRACTICE | The window belongs to the metric |
| F-19 | 4 | PROPOSED | Trajectory for the host community, never for the settler's amenity |
| F-20 | 4 | PRACTICE | One point is one point |
| F-21 | 5 | COMMITTED (Decision 5) · PROPOSED · PRACTICE | Every value carries the same record |
| F-22 | 5 | PRACTICE | A claims ledger per region |
| F-23 | 5 | PRACTICE | An unopened source is not evidence |
| F-24 | 5 | PRACTICE | Dead links are replaced or dropped |
| F-25 | 5 | PRACTICE | Primary and official first |
| F-26 | 5 | PRACTICE | Reproduce or correct |
| F-27 | 5 | PRACTICE | Out of range is flagged, not clamped |
| F-28 | 5 | PROPOSED · PRACTICE | Proxies carry their caveat |
| F-29 | 6 | COMMITTED (Decision 1) | No universal grid |
| F-30 | 6 | SOURCE-DOCS (Specifications, Native units policy) | Crossing units needs a declared method |
| F-31 | 6 | PRACTICE | A disc is a stated unit, not a region |
| F-32 | 6 | COMMITTED (Decision 1) | Report scale, don't merge it |
| F-33 | 7 | COMMITTED (Decision 4) · PRACTICE | No count of criteria met; slate order carries no meaning |
| F-34 | 7 | PRACTICE | Descriptive scale words, not grades |
| F-35 | 7 | PRACTICE | Colour is not a valuation |
| F-36 | 7 | PRACTICE | No superlative ranks a place |
| F-37 | 7 | COMMITTED (Decision 9) · PROPOSED | Surface, don't enforce |
| F-38 | 8 | PROPOSED | Three completeness modes |
| F-39 | 8 | PRACTICE | "N of M" statements are computed, never typed |
| F-40 | 9 | PROPOSED | A fifth consideration: host-community standing |
| F-41 | 9 | PRACTICE | State only what the claims ledger verified |
| F-42 | 9 | PROPOSED | "Not there" is a legitimate answer |
| F-43 | 9 | PROPOSED | The two continents are framed differently, on purpose |
| F-44 | 9 | PROPOSED | Standing is earned in place, not purchased |
| F-45 | 10 | PROPOSED · PRACTICE | Every claim cites an opened source; contested status is stated as contested |
| F-46 | 10 | PROPOSED | `entry` never begins with "Buy" |
| F-47 | 10 | PROPOSED | `obligation` is an obligation |
| F-48 | 10 | PROPOSED · PRACTICE | No review claim |
| F-49 | 10 | PRACTICE | No Land standing entry, no region |
| F-50 | 11 | PROPOSED · PRACTICE | Not advice, every time |
| F-51 | 11 | PROPOSED · PRACTICE | Restricted regions stay visible |
| F-52 | 11 | PROPOSED | Never "workaround" |
| F-53 | 11 | PROPOSED · PRACTICE | Timelines only where a source states them |
| F-54 | 12 | PROPOSED · PRACTICE | A descriptive reading, not a boundary |
| F-55 | 12 | PRACTICE | Native units, named dataset |
| F-56 | 12 | PRACTICE | State the method with the number |
| F-57 | 12 | PRACTICE | Limitations on every rendering |
| F-58 | 13 | PROPOSED · PRACTICE | Admission in order; any unverifiable required element drops the region |
| F-59 | 13 | PROPOSED | Exclusions |
| F-60 | 14 | PRACTICE | Promotion |

Test: the register lists every rule id once, and every COMMITTED label in it names a numbered decision in the Overview.

## 15. Glossary

**State.** The current value or range of a criterion in its natural units.

**Trajectory.** The direction a criterion is moving: a projection, an observed trend over a stated window, or empty.

**Native unit.** The spatial and measurement unit a dataset itself uses.

**MAUP.** The Modifiable Areal Unit Problem: results change with the scale and the zoning of the units used. Managed, not solved.

**Tier-1, Tier-2.** Tier-1 is a real ingested layer with measurable completeness. Tier-2 is curated or demonstration values, not counted as ingested coverage.

**Per-jurisdiction layer.** A layer that records one fact per legal jurisdiction (a regime, a rule, a band) rather than a measurement over an area.

**Land standing.** The qualitative account of whose land a place already is and what arriving asks of them. Never scored.

**Host-community standing.** The proposed fifth consideration: the sovereignty and standing of those already rooted in a place.

**Bioregion.** In this framework, a descriptive reading of where a region sits ecologically, not a drawn boundary.

**Ecoregion.** A mapped area of similar ecology, as published by a named dataset.

**Watershed level.** The depth at which drainage basins are published; a higher level is a smaller basin.

**Threshold filter.** A pass or fail against the user's own number on one criterion.

**Composite.** One number built from several criteria. Never built here.

**Red line.** One of Askja's absolute disqualifiers (active conflict nearby, no hospital within reach, projected water deficit, contaminated soil, a law against collective ownership, a single entity controlling the water). Its data is in scope; applying it is the user's own threshold.

**Claims ledger.** The per-region list of claims, each with its opened source and its state.

Test: every term used in the rules above is defined here or in the text where it is first used.

---

## Appendix A. Wiring map (non-normative)

Everything above is the framework. This appendix says how the demonstration site carries it on 2026-10-05. It is a map of the current wiring, not a rule. It will go out of date; the framework will not.

**Paths** are relative to the repository root. The site that is deployed is under `prototype/`.

| What | Where |
|---|---|
| Criteria, regions, values (the slate order is the array order) | `prototype/data/regions.js` |
| Land standing entries | `prototype/data/land-standing.js` |
| Reciprocity layer: first conversations, "not there" forms, claims ledger, `reviewed`, `status` | `prototype/data/reciprocity.js` |
| "What living here asks of you" and case-study links | `prototype/data/region-depth.js` |
| Legal pathway blocks | `prototype/data/legal-pathway.js` |
| Per-jurisdiction layers (source files) | `prototype/data/processed/` |
| Per-jurisdiction lookup used by the page | `prototype/data/v1-lookup.js`, generated by `prototype/scripts/gen_v1_lookup.mjs` |
| Bioregion membership, dataset sources | `prototype/data/bioregions.js`; polygons in `prototype/data/processed/` |
| Climate-zone and water context per region | `prototype/data/context.js` |
| Source registry and licences | `prototype/data/sources.js` |
| Footprints per region | `prototype/data/footprints.json` and `prototype/data/footprints/` |
| Map layer sources and the layer registry | `prototype/data/layer-sources.js`, `prototype/src/config/map-layers.js` |
| Categorical filters | `prototype/src/config/qual-filters.js` |
| The page and its scripts and styles | `prototype/index.html`, `prototype/src/` |
| Per-region pages and sitemap | `prototype/region/`, generated by `prototype/scripts/gen_region_pages.mjs` |
| Share card and share page | `prototype/api/og.js`, `prototype/api/share.js` (both on the edge runtime) |
| Shared passing logic | `prototype/lib/result.js` |
| Data tests | `prototype/tests/` (`node tests/run.mjs --strict` from `prototype/`) |
| Bioregion build scripts | `prototype/scripts/bio/` |
| Facts used by the inventory | generator `upgrade-2026-10/tracks/docs/tools/docs_facts.mjs`; the facts file this draft was built from is `upgrade-2026-10/tracks/docs/docs-facts.DOC-5.json` |

**Regeneration commands** (run from `prototype/` unless shown):

- `node scripts/gen_region_pages.mjs` rewrites the per-region pages and sitemap.
- `node scripts/gen_v1_lookup.mjs --write` rewrites the per-jurisdiction lookup.
- `node tests/run.mjs --strict` runs the data tests.
- From the repository root: `node upgrade-2026-10/tracks/docs/tools/docs_facts.mjs --out <file>` regenerates the facts the inventory is built from.

**Stack, for the record.** A static site with native ES modules, a self-hosted map library, vector and raster layers drawn from public services, and two edge functions for the share card. Deployed to a managed static host. None of this is part of the framework.

### Cell schema, version 2

The value cell carries the provenance fields of F-21. The keys on 2026-10-05 are listed from the facts file, with the field of section 5 each one holds.

| Cell key | Holds (section 5) | Note |
| --- | --- | --- |
| `value` | value | The number, in the criterion's native unit. |
| `unit` | unit | The measurement unit. |
| `vintage` | vintage | The period the value represents. |
| `label` | descriptive word | A scale word or class from the source's own range (F-34), never a grade. |
| `source` | source name | The dataset the value comes from. |
| `sourceUrl` | specific record URL | A page for the record, not a landing page. |
| `sourceId` | source registry key | Looks up the licence name and licence link in the source registry. |
| `method` | method | How the value was computed (over the footprint, or a named count). |
| `footprint` | footprint | The region footprint the value covers (section 13, step 2). |
| `retrieved` | retrieval date | When the source was read. |
| `scenario` | scenario | The projection scenario, where there is one (F-17). |
| `trajectory` | trajectory | Status, direction, change, basis, source and vintage of the trajectory (F-17). |
| `audit` | audit note | What an earlier value was and why it changed (F-26). |

Direction vocabulary in the data: `rising`, `falling`, `steady` (neutral, F-12). Trajectory status: `projected`, `measured`, `not_available`. The criteria's own `trajectoryRule` states how each direction is derived. The `higherIs` field on a criterion stores the side of the user's threshold that passes (for example `worse`, `better`, `hotter`, `neutral`); it is a stored token, not a valuation (F-12), and a neutral renaming is proposed.

## Appendix B. Changelog

| Date | Change |
|---|---|
| 2026-10-05 | Draft 1. Portable statement assembled from the source-docs at r4 and the practices of the demonstration. Inventory generated from the facts file named in section 3. Bioregion method reconciled to the final data: a 100 km disc, shares rounded to five percent, entries under ten percent dropped (an earlier working note had 75 km and two percent; the shipped data used the figures here). Land standing and legal pathway field tables mapped to the final field names. |
