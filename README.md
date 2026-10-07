# Land Selection Framework

> **A bioregioning tool for communities seeking to belong to a place and help it flourish over fifty to a hundred years.** It filters; it never scores, ranks, or tells you where to go.

**Live demonstration:** https://land-selection-framework.regencommunity.tools

**State:** v1 r4. A designed demonstration of the framework, not a finished data product. Values are sourced and dated; the group has not yet ratified the slate or the V1 proposal.

- **Slate:** 30 regions (15 in Europe, 15 in North America).
- **Seven per-jurisdiction layers** (legal ownership, land cost, hospital proximity, demographic trajectory, soil contamination, water source control, climate buffering), complete for the whole slate:

  | Layer | Regions covered |
  |---|---|
  | legal_ownership | 30/30 |
  | land_cost | 30/30 |
  | hospital_proximity | 30/30 |
  | demographic_trajectory | 30/30 |
  | soil_contamination | 30/30 |
  | water_source_control | 30/30 |
  | climate_buffering | 30/30 |

- **Five areal and presence layers** (water stress, water depletion, forest change, conflict, regen network) are the continental clips ingested in r4. They were not re-ingested or re-checked in 2026-10.
- **The dashboard:** 8 threshold sliders and 4 categorical qualitative filters, a region grid, a summary table, a region drawer, shortlist and compare, and a map. Each region also has its own page.
- **Revision:** Values revised October 2026 against their cited sources; earlier shared links may match different regions.

---

## What this is

A place is not a product. It has people, a history and a standing that no listing carries. This project is building a shared, open framework and database that describes a place before anyone arrives: climate, water, soil, forest, conflict, regenerative networks, population; what the law asks of a newcomer; and whose land it already is. Every value comes from public datasets, in its native spatial unit, with source, vintage and licence in view.

**Reciprocity is the spine.** Each region carries a *Land standing* entry: whose land this is (the Indigenous nation and the treaty or unceded status in North America; the rooted community or commons in Europe), how land is held, how to arrive in good faith, and what arriving asks. It is qualitative only: never scored, never ranked, never a filter. Where arriving in a place would harm the community already there, the honest answer is not to go.

The discipline is strict and it is the point: **no composite scoring**, **no weighting**, **native units throughout**, **state and trajectory per criterion**, **source and vintage on every value**. The user sets their own thresholds; the system shows pass or fail per region per threshold and nothing more. These rules are in [the source documents](source-docs/) as `[COMMITTED]` decisions, and [`FRAMEWORK.md`](FRAMEWORK.md) states them in portable form.

**Who made it.** The framework was originated by Askja and is developed by a small working group of practitioners and researchers. The demonstration site was built by one member of that group, who holds the practitioner seat. Members are named by first name and role only, as in the working documents; no surnames, handles or contact details appear anywhere on the site.

### How the data is checked

Values are re-opened against their cited sources, and anything that cannot be reproduced from an opened source is corrected or dropped, never shipped half-done. The Land standing entries, territory claims and legal pathway blocks are assembled from public sources and checked against opened pages. No nation or community named in them has reviewed them, and "checked against opened public sources" is not a review, a consent or an approval by anyone. The legal pathway is context, not legal advice.

---

## Since r4 (2026-10)

The 2026-10 round added to the demonstration and to the documents. Counts in this section come from the data, not from memory.

- **Reciprocity addendum appended to the source-docs.** Attributed, additive only; no `[COMMITTED]` decision was touched. It argues that all four of Decision 7's sovereignty axes describe the incoming settlers' sovereignty, and proposes host-community standing as a fifth consideration. Proposed, not ratified. One-page summary: [`docs/ROUND-R4-ADDENDUM-2026-10.md`](docs/ROUND-R4-ADDENDUM-2026-10.md).
- **Land standing** for every region (30/30), qualitative only.
- **Legal pathway** for every region (30/30): entry steps in order, who must consent, honest gaps.
- **Bioregion layer** for every region (30/30): WWF Ecoregions 2017, HydroBASINS watersheds and Natural Earth rivers in native units, descriptive only.
- **Slate growth:** ten new regions were added to the r4 slate (five in each continent), under a slate-admission rule the group has not yet ratified.
- **Evidence re-check.** Every region of the original slate was re-opened against its cited sources; every value cell says how it was measured, and cells that could not be reproduced show an honest gap instead of a number.
- **Contacts removed.** There is no public contact route yet; the working group will set one.
- **[`FRAMEWORK.md`](FRAMEWORK.md):** the framework discipline in portable form, offered as a proposal. It is not part of the source-docs.
- **Handoff.** The r4 to r5 Handoff Request in the Overview was amended; the chat message that would go with it exists only as an unsent draft in [`docs/r5-handoff-DRAFT.md`](docs/r5-handoff-DRAFT.md). Nobody has been contacted.

Values were revised in 2026-10. Earlier shared links (filter settings in the URL) may match different regions than they did before.

---

## What r4 produced (2026-05-29, 20 regions) <!-- history -->

The history of the r4 round, as delivered on 2026-05-29. Counts in this section describe that delivery and are quoted history. <!-- history -->

**12 Tier-1 ingested V1 layers** across 20 regions (10 EU, 10 North America), each with metadata sidecars and GeoPackage exports for QGIS: <!-- history -->

- **Areal (raster/polygon)** — water_stress, water_depletion (WRI Aqueduct 4.0), forest_change (Hansen GFW v1.11)
- **Presence (point)** — conflict (UCDP GED v25.1), regen_network (OSM + GEN directory)
- **Per-jurisdiction qualitative** — legal_ownership, land_cost, hospital_proximity, demographic_trajectory, soil_contamination, water_source_control, climate_buffering

**All 6 red-line underlying datasets** named in Overview decision 9 were ingested. The gap for climate-buffering features (referred to in the r4 commentary as Overview decision 8.1) was closed. <!-- history -->

**Public reach layer** (built alongside V1 ingestion): one indexable HTML page per region, dynamic share cards (Vercel edge functions), and a filtering dashboard with both threshold sliders and qualitative-filter dropdowns wired to the same V1 data.

For a deeper read see [`docs/ROUND-R4-SUMMARY.md`](docs/ROUND-R4-SUMMARY.md). For the formal proposal to ratify V1 see [`docs/v1-ship-candidate.md`](docs/v1-ship-candidate.md). For the round's full attributed commentary see [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).

The source-docs refer to the `docs/` folder as `Docs/`; the folder on disk is `docs/`.

---

## Working group + collaboration protocol

| Person | Role | Round |
|---|---|---|
| Adam | GIS architect, non-negotiables | r1 |
| Askja | Framework author, regenerative practitioner, the 12-metric framework | r2 |
| Deca | Synthesiser | r3 |
| Gustaf | Practitioner seat, embedded in eco-villages | **r4 (delivered 2026-05-29; addendum 2026-10-05)** |
| Monty | Regenerative academic research | Named contributor, not yet engaged |
| Alaska | Data engineering | Named contributor, not yet engaged |

The project structure is a **versioned document package** travelling together (Overview, Specifications, Implementation Strategy). State counters: `vN` = implementation version, `rN` = collaboration round. Each contributor reads, adds their attributed commentary under existing `[COMMITTED]` decisions (never overwriting them), updates the Collaboration Log, and prepares the next Handoff Request.

The current open Handoff Request is **r4 → r5**, addressed to the whole group (no prescribed order). It has been open since 2026-05-29 without a recorded response. See [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).

To pick up r5: read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the contributor flow.

---

## Repository layout

```
land-selection-framework/
├── README.md                        (this file)
├── FRAMEWORK.md                     (the framework discipline in portable form; a proposal,
│                                     not part of the source-docs)
├── CONTRIBUTING.md                  (r5+ contributor flow, how to add a region)
├── invitation.md                    (working-group invitation for new contributors)
├── Land Selection Framework.pdf     (PDF version of invitation)
├── r4-reciprocity-commentary-DRAFT.md (the draft the r4 addendum was appended from)
│
├── source-docs/                     (immutable source of truth: the round-by-round
│   │                                 document package; only add attributed commentary,
│   │                                 never overwrite [COMMITTED] decisions)
│   ├── Land Project v1 r4 Overview.md
│   ├── Land Project v1 r4 Specifications.md
│   └── Land Project v1 r4 Implementation Strategy.md
│
├── docs/                            (V1 deliverables and round notes; the source-docs
│   │                                 call this folder "Docs/")
│   ├── ROUND-R4-SUMMARY.md          (1-page "what r4 produced", at 2026-05-29)
│   ├── ROUND-R4-ADDENDUM-2026-10.md (1-page "what changed since r4")
│   ├── r5-handoff-DRAFT.md          (UNSENT draft of the r4 to r5 chat message)
│   ├── v1-ship-candidate.md         (the proposal to ratify V1 shipped)
│   ├── criteria-inventory.md        (the r4 Tier-1 criteria, sovereignty-tagged)
│   ├── data-source-inventory.md     (sources reviewed, all checked by use)
│   ├── v1-data-priorities.md        (V1 scope proposal)
│   ├── coverage-report.md           (three-way completeness metric)
│   ├── v1-verification-notes.md     (what was checked and what still needs eyes)
│   ├── v1-shipped.md                (lessons learned)
│   └── plans/                       (in-progress round work and historical drafts;
│                                     not source of truth)
│
└── prototype/                       (the live site source: vanilla JS + two Vercel edge
    │                                 functions; the static parts have no build step)
    ├── index.html                   (the dashboard)
    ├── deeper.html                  (methodology, case studies, ethics)
    ├── arrive.html, host.html, terms-of-arrival.html (+ .txt)
    │                                (how to read the tool; for host communities; terms of arrival)
    ├── invitation.pdf               (the PDF of invitation.md, served by the site)
    ├── src/                         (main.js, config/, map/, ui/, pages/, styles/)
    ├── lib/                         (shared logic: result.js passing logic used by both
    │                                 edge functions, filters, formats, share-card layout)
    ├── api/                         (Vercel edge functions: dynamic share card, share page)
    ├── region/                      (generated: one indexable page per region)
    ├── sitemap.xml, llms.txt        (generated with the region pages)
    ├── data/
    │   ├── regions.js               (the regions, the criteria and the per-region values)
    │   ├── land-standing.js         (per region: territory, tenure, entry, obligation)
    │   ├── reciprocity.js           (first conversations, "not there" forms, claims ledger)
    │   ├── legal-pathway.js         (per region: the lawful route in, in order)
    │   ├── bioregions.js            (bioregion membership and its dataset sources)
    │   ├── region-depth.js          ("what living here asks of you" + case-study links)
    │   ├── context.js               (climate-zone and water context per region)
    │   ├── sources.js               (source registry and licences)
    │   ├── footprints.json + footprints/ (the exact footprint each region's values cover)
    │   ├── layer-sources.js         (map layer sources and licences)
    │   ├── presets.js, site-facts.js (starting presets; the counts and dates the pages stamp)
    │   ├── v1-lookup.js             (GENERATED: the four fields the dashboard filters read)
    │   ├── processed/               (Tier-1 layers as GeoJSON + JSON + metadata.yaml
    │   │                             sidecars; bioregion, river and climate-class polygons)
    │   ├── v1-exports/              (GeoPackage exports of 2026-05-29, 20 regions, not <!-- history -->
    │   │                             regenerated for the 2026-10 slate; a STALE-NOTICE.txt
    │   │                             will sit beside them)
    │   ├── research-dossier/        (per-region dossier markdown, one folder per region;
    │   │                             the source material the per-jurisdiction layers compile from)
    │   └── raw/                     (gitignored: raw downloaded data)
    ├── scripts/
    │   ├── gen_region_pages.mjs     (writes region/<id>.html, sitemap.xml, llms.txt)
    │   ├── gen_v1_lookup.mjs        (writes data/v1-lookup.js)
    │   ├── stamp_build.mjs          (stamps counts, dates and cache-bust values into the pages)
    │   ├── compile_per_jurisdiction.py (per-jurisdiction layer compiler)
    │   ├── v1_loader.py, export_v1.py  (Jupyter loader; GeoPackage exporter)
    │   ├── fetch_*.py, process_*.py (fetchers and processors for the areal and presence layers)
    │   ├── evidence/                (evidence pipeline and the merge toolkit)
    │   ├── bio/                     (bioregion build scripts)
    │   └── release/                 (release checks)
    ├── tests/                       (data tests, core tests, browser tests)
    ├── notebooks/v1-demo.ipynb      (loads the V1 exports and plots each criterion)
    ├── vendor/                      (self-hosted map library and fonts)
    └── .venv/                       (gitignored: Python 3.12 venv)
```

Other files at the repository root (audits, research notes, strategy analysis) are working notes. They are not source of truth.

---

## How to read this (~30 minutes)

**For an external visitor / press / partner / future contributor:**
1. This README.
2. [`FRAMEWORK.md`](FRAMEWORK.md), the portable statement of the discipline. It is the shortest honest account of what the framework refuses to do.
3. The [live demonstration](https://land-selection-framework.regencommunity.tools): try the filters, click any region card, read a region page and its Land standing entry.
4. [`docs/ROUND-R4-SUMMARY.md`](docs/ROUND-R4-SUMMARY.md) and [`docs/ROUND-R4-ADDENDUM-2026-10.md`](docs/ROUND-R4-ADDENDUM-2026-10.md): what r4 produced, and what changed since.
5. [`invitation.md`](invitation.md): what the working group is about and how to engage.

**For a working-group member picking up r5:**
1. The Handoff Request block in [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).
2. The reciprocity addendum, "r4 Commentary — Addendum: Reciprocity & host-community standing", in the same Overview, with its one-page summary in [`docs/ROUND-R4-ADDENDUM-2026-10.md`](docs/ROUND-R4-ADDENDUM-2026-10.md).
3. The r4 commentary in all three source-docs.
4. [`FRAMEWORK.md`](FRAMEWORK.md): mark anywhere it misstates what you wrote.
5. [`docs/v1-ship-candidate.md`](docs/v1-ship-candidate.md): what is being proposed for V1 ratification.
6. [`CONTRIBUTING.md`](CONTRIBUTING.md): how to add your commentary, regenerate the public surface, add a region and hand off to r6.

---

## V1 → V2 → V3 trajectory

- **V1 (current, ship-candidate awaiting r5 ratification):** raw and processed data ingestion in native units, exportable to QGIS and Jupyter. No composite scoring. No weighting authority. Threshold filtering (sliders and qualitative dropdowns) shown on the demonstration alongside the data.
- **V2 (sketched, not committed):** a formal query and weighting layer with red-line filtering. Resolves the two deferred design questions on composite scores and weighting authority.
- **V3 (sketched):** parcel-level integration (soil kits, sensors, walking observations), cosmolocal data governance (community-controlled or mirrored data storage).

---

## Licence and contact

Data sources retain their own licences (typically CC BY 4.0, ODbL 1.0, or open government); each value on the site names its licence where it is known. The working-group documents and code in this repository are open for the working group's purposes; broader open-source licensing is pending a group decision.

There is no public contact route yet; the working group will set one.

Want to join the working group? Read [`invitation.md`](invitation.md).
