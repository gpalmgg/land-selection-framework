# Land Selection Framework

> **A working-group project building an open framework + data for choosing land for regenerative community settlements built to flourish on a 50–100 year horizon.** The framework filters; it never scores.

**Live demonstration:** https://land-selection-framework.vercel.app

**State:** v1 r4 — 12 Tier-1 ingested data layers across 20 candidate regions (Europe + North America), all metadata-complete and exportable to QGIS/Jupyter. V1 ship-candidate awaiting working-group ratification at r5.

---

## What this is

Choosing where to settle is too important to leave to gut-feel and real-estate listings. This project is building a shared, open framework and database that surfaces relevant land/region attributes from public datasets — in their native spatial units, with full source / vintage / license transparency — so groups searching for land for long-horizon community projects can make a more informed decision the *first* time.

The discipline is strict: **no composite scoring**, **no weighting**, **native units throughout**, **state + trajectory per criterion**, **source + vintage on every value**. The user combines criteria themselves; the system shows pass/fail per region per threshold. This is in [the source documents](source-docs/) as a set of `[COMMITTED]` decisions.

The project is the work of **The Collective**, a small cross-disciplinary working group of practitioners and researchers. Individual members stay private until the group agrees on attribution.

---

## What r4 produced (the current state)

**12 Tier-1 ingested V1 layers** across 20 regions (10 EU, 10 North America), each with metadata sidecars and GeoPackage exports for QGIS:

- **Areal (raster/polygon)** — water_stress, water_depletion (WRI Aqueduct 4.0), forest_change (Hansen GFW v1.11)
- **Presence (point)** — conflict (UCDP GED v25.1), regen_network (OSM + GEN directory)
- **Per-jurisdiction qualitative** — legal_ownership, land_cost, hospital_proximity, demographic_trajectory, soil_contamination, water_source_control, climate_buffering

**All 6 red-line underlying datasets** named in Overview decision 9 are now ingested. Overview decision 8.1's "climate-buffering features" gap is closed.

**Public reach layer** (built alongside V1 ingestion): 20 per-region indexable HTML pages, dynamic OG share cards (Vercel edge functions), and a filtering dashboard with both threshold sliders and qualitative-filter dropdowns wired to the same V1 data. Live at the URL above.

For a deeper read see [`Docs/ROUND-R4-SUMMARY.md`](Docs/ROUND-R4-SUMMARY.md). For the formal proposal to ratify V1 see [`Docs/v1-ship-candidate.md`](Docs/v1-ship-candidate.md). For the round's full attributed commentary see [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).

---

## Working group + collaboration protocol

| Person | Role | Round |
|---|---|---|
| Adam McKent | GIS architect, non-negotiables | r1 |
| Askja | Originator, regenerative practitioner, the 12-metric framework | r2 |
| Deca | Synthesizer | r3 |
| Gustaf | Practitioner reality-check, embedded in eco-villages | **r4 (delivered 2026-05-29)** |
| Monty | Regenerative academic research | future |
| Alaska | Data engineering | future |

The project structure is a **versioned document package** travelling together (Overview, Specifications, Implementation Strategy). State counters: `vN` = implementation version, `rN` = collaboration round. Each contributor reads, adds their attributed commentary under existing `[COMMITTED]` decisions (never overwriting them), updates the Collaboration Log, and prepares the next Handoff Request.

The current open Handoff Request is **r4 → r5**, addressed to the whole group (no prescribed order) — see [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).

To pick up r5: read [`CONTRIBUTING.md`](CONTRIBUTING.md) for the contributor flow.

---

## Repository layout

```
land-selection-framework/
├── README.md                        (this file)
├── CONTRIBUTING.md                  (r5+ contributor flow)
├── invitation.md                    (working-group invitation for new contributors)
├── Land Selection Framework.pdf     (PDF version of invitation)
│
├── source-docs/                     (immutable source of truth — the round-by-round
│   │                                 document package; only add attributed commentary,
│   │                                 never overwrite [COMMITTED] decisions)
│   ├── Land Project v1 r4 Overview.md
│   ├── Land Project v1 r4 Specifications.md
│   └── Land Project v1 r4 Implementation Strategy.md
│
├── Docs/                            (V1 deliverables — written this round, ratifiable
│   │                                 at the next sync)
│   ├── ROUND-R4-SUMMARY.md          (1-page "what r4 produced")
│   ├── v1-ship-candidate.md         (the proposal to ratify V1 shipped)
│   ├── criteria-inventory.md        (12 Tier-1 criteria, sovereignty-tagged)
│   ├── data-source-inventory.md     (scored sources, all verified-by-use)
│   ├── v1-data-priorities.md        (V1 scope proposal)
│   ├── coverage-report.md           (three-way completeness metric)
│   ├── v1-verification-notes.md     (what's verified + what still needs eyes)
│   └── v1-shipped.md                (lessons-learned)
│
├── prototype/                       (the live site source — Vanilla JS + Vercel edge
│   │                                 functions, no build step for the static parts)
│   ├── index.html                   (the dashboard: 8 threshold sliders + 4 qualitative
│   │                                 filter dropdowns + region grid + summary table +
│   │                                 region detail drawer + shortlist/compare)
│   ├── deeper.html                  (methodology, case studies, ethics)
│   ├── src/main.js                  (dashboard logic)
│   ├── api/                         (Vercel edge functions: dynamic OG cards, share)
│   ├── region/                      (20 generated per-region indexable HTML pages)
│   ├── sitemap.xml
│   ├── data/
│   │   ├── regions.js               (the 20 regions + 8 criteria + per-region values)
│   │   ├── region-depth.js          (the 17 "what living here asks of you" summaries
│   │   │                             + 3 case-study deep-links)
│   │   ├── v1-lookup.js             (AUTO-GENERATED: the 7 per-jurisdiction V1 layers
│   │   │                             as a single ESM module the dashboard imports)
│   │   ├── processed/               (12 Tier-1 layers as GeoJSON + JSON intermediates +
│   │   │                             metadata.yaml sidecars per layer)
│   │   ├── v1-exports/              (GeoPackages of every loadable Tier-1 layer for QGIS)
│   │   ├── research-dossier/        (160 per-region dossier markdown files;
│   │   │                             8 dimensions × 20 regions; the source material
│   │   │                             from which the per-jurisdiction layers compile)
│   │   └── raw/                     (gitignored: raw downloaded data, 1.5 GB)
│   ├── scripts/
│   │   ├── v1_loader.py             (canonical Jupyter loader, 11 loadable criteria)
│   │   ├── export_v1.py             (GeoPackage exporter)
│   │   ├── compile_per_jurisdiction.py  (generic per-jurisdiction layer compiler)
│   │   ├── fetch_*.py               (OSM Overpass / WRI Aqueduct fetchers)
│   │   ├── process_*.py             (per-layer processors)
│   │   └── gen_region_pages.mjs     (regenerates region/<id>.html + sitemap + v1-lookup.js)
│   ├── notebooks/v1-demo.ipynb      (loads the V1 exports + plots each criterion)
│   └── .venv/                       (gitignored: Python 3.12 venv)
│
└── docs/plans/                      (in-progress round work + historical drafts;
                                      not source-of-truth, not for working-group review)
```

---

## How to read this (~30 minutes)

**For an external visitor / press / partner / future contributor:**
1. This README.
2. The [live demonstration](https://land-selection-framework.vercel.app) — try the filters; click any region card; read a region page.
3. [`Docs/ROUND-R4-SUMMARY.md`](Docs/ROUND-R4-SUMMARY.md) — what r4 produced, in one page.
4. [`invitation.md`](invitation.md) — what the working group is about, how to engage.

**For a working-group member picking up r5:**
1. The Handoff Request block in [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).
2. The r4 commentary in all three source-docs.
3. [`Docs/v1-ship-candidate.md`](Docs/v1-ship-candidate.md) — what's being proposed for V1 ratification.
4. [`CONTRIBUTING.md`](CONTRIBUTING.md) — how to add your commentary, regenerate the public surface, hand off to r6.

---

## V1 → V2 → V3 trajectory

- **V1 (current, ship-candidate awaiting r5 ratification)** — raw + processed data ingestion in native units, exportable to QGIS/Jupyter. 12 Tier-1 layers across 20 EU+NA regions. No composite scoring. No weighting authority. Threshold filtering (sliders + qualitative dropdowns) shipped on the demonstration alongside the data.
- **V2 (sketched, not committed)** — formal query and weighting layer with red-line filtering. The 6 red-line underlying datasets named in Overview decision 9 are all ingested in V1, so V2's filtering layer has its data foundation. Resolves the two deferred design questions on composite scores and weighting authority.
- **V3 (sketched)** — parcel-level integration (soil kits, sensors, walking observations), cosmolocal data governance (community-controlled / mirrored data storage).

---

## License + contact

Data sources retain their own licenses (typically CC BY 4.0, ODbL 1.0, or open government). The working-group documents and code in this repo are open for the working group's purposes; broader open-source licensing pending group decision at r5+.

Reach The Collective: <gustaf@islands-of-coherence.com>

Want to join the working group? Read [`invitation.md`](invitation.md).
