# Land Selection Framework — Project Context

## What this is

A shared working-group project building a geospatial database to help people find land for regenerative community settlements meant to flourish over 50–100 years. **Gustaf is not the originator — this is async collaboration** with Adam McKent (GIS architect), Askja (regenerative practitioner / originator), Deca (synthesizer), Monty (academic researcher), and a named "Alaska" contributor.

The project structure is a **versioned document package** with a strict collaboration protocol — three markdown files (Overview, Specifications, Implementation Strategy) travel together. Each contributor reads, adds their perspective, updates the Collaboration Log, hands off. State counters: `vN` = implementation version, `rN` = collaboration round. **Currently v1 r3.** Gustaf holds the r4 seat as practitioner reality-check.

The source documents at `source-docs/` are the **immutable source of truth** for the project state. Do not propose to overwrite `[COMMITTED]` decisions in them — only add commentary under those decisions, clearly attributed. Read `source-docs/Land Project v1 r3 Overview.md` first for framing.

## What's been built in this folder

- `invitation.md` + `Land Selection Framework.pdf` — explainer for inviting new contributors (working group + roles + collaboration protocol)
- `prototype/` — a designed dashboard sketch demonstrating what V1 will produce, deployed to Vercel. Hand-curated regional comparison across 4 European candidates (Alentejo PT, Galicia ES, Transylvania RO, West Cork IE) with threshold sliders. NOT the V1 build — a communicative artifact.
- `source-docs/` — the three working-group documents at r3, plus working transcripts

**Live URL:** https://land-selection-framework.vercel.app
**Project name on Vercel:** `land-selection-framework` under `gustafs-projects-c00d22da`

## Critical framework discipline

The r3 docs commit to several non-negotiables that bind everything we build:

1. **No composite scoring** (Adam's r1 non-negotiable, kept by Deca). The user combines criteria themselves. Composite "livability" scores are explicitly banned in V1 and design-deferred for V2.
2. **No querying or scoring in V1.** V1 is data ingestion only.
3. **Native units throughout.** No reshaping to a universal grid (no H3). MAUP-aware methodology.
4. **State + trajectory per criterion** (Askja's framing). Each criterion has both current value and directional indicator.
5. **Source + vintage + license on every value.** Always visible in the UI.
6. **Adam vs Askja tensions are documented, not resolved.** Composite scores and weighting authority are deferred V2/V3 questions.

The deployed prototype's **threshold sliders** are framework-legal: they filter, they don't score. Weight sliders would have been the wrong choice (compose a hidden composite). Threshold sliders demonstrate V2's intended query layer without breaking the V1 discipline.

## What was learned (paradigm lesson)

Initial approach was wrong: tried to build V1 in miniature (custom MapLibre + manual GeoTIFF → PNG overlays). Three things broke:
- Large-file downloads failed silently on this connection (CMIP6, GHSL, first Aqueduct all truncated despite curl exit 0)
- WGS84-image-rendered-in-Mercator produces "slightly out of place" overlays at Europe latitudes
- Half-built layers + clearly-pending layers communicate "this thing doesn't work" to viewers

Pivot: scrap the map-as-data-product paradigm, build a **designed communicative artifact** instead. Dashboard + hand-curated regional values + small map only for layers using reliable services (GFW XYZ tiles, processed GeoJSONs). Result is more impressive *and* more honest *and* respects framework discipline.

**Tier honesty** (per ~/.claude portability filter): the **framework layer** (criteria, sovereignty axes, state+trajectory, MAUP-respecting methodology) is **Portable**. The **build wiring** (MapLibre + specific tile services + JS state management) is **Tied** — dies with the stack. Both layers are visible in this folder; don't confuse them.

## File map

```
land-selection-framework/
├── CLAUDE.md                       (this file)
├── README.md                       (project orientation, more public-facing)
├── invitation.md                   (working-group invitation for new contributors)
├── Land Selection Framework.pdf    (PDF of invitation.md)
├── .pdf-style.css                  (CSS for pandoc → PDF)
├── source-docs/                    (the r3 doc package — source of truth)
│   ├── Land Project v1 r3 Overview.md
│   ├── Land Project v1 r3 Specifications.md
│   └── Land Project v1 r3 Implementation Strategy.md
└── prototype/                      (the deployed v1 sketch)
    ├── index.html                  (dashboard shell)
    ├── src/main.js                 (rendering + slider state)
    ├── data/regions.js             (regions + criteria + hand-curated values)
    ├── data/processed/             (real GeoJSONs used by the map)
    ├── data/raw/                   (1.4 GB of downloaded data — gitignored, NOT deployed)
    ├── scripts/                    (Python processors — for future updates)
    ├── .venv/                      (Python 3.12, rasterio + geopandas + pillow)
    └── .vercelignore               (excludes .venv, raw data, scripts from deployment)
```

## Operational notes for future sessions

- **Don't auto-rebuild the V1 in miniature.** That paradigm failed. Stay in the designed-artifact paradigm unless something fundamental changes (e.g. group sets up real ingestion infrastructure, V1 actually starts).
- **The 1.4 GB `data/raw/` folder can be deleted.** It was scratch for the original (failed) raster-overlay approach. The processed GeoJSONs in `data/processed/` are what the deployed site uses. Keep `data/raw/aqueduct-extract/` if you want to re-process water-stress with different parameters.
- **Redeploying** the Vercel site: `cd prototype && vercel deploy --prod --yes`. ~10 seconds.
- **The hand-curated values in `data/regions.js`** are best-available midpoints. If you change them, document the change in a comment and ideally update the footer to note the revision.
- **Adding a new region:** add to the `regions` and `values` arrays in `data/regions.js`. The renderer will pick it up.
- **Adding a new criterion:** add to the `criteria` array in `data/regions.js` and add per-region values for it. Slider direction is computed from `higherIs`.

## What r4 still owes the working group

Per the r3 Handoff Request, Gustaf is expected to contribute a **practitioner reality-check** — what the eco-village-embedded perspective sees that the docs don't. The deployed prototype is *demonstration*, not the contribution. The actual r4 contribution still needs to happen: read the three source-docs end to end, write practitioner commentary on the framing decisions and criteria, append to the documents, prepare the next Handoff Request.

## Working group people (do not contact without asking Gustaf first)

- **Adam McKent** — GIS architect, r1, provisioned a VPS, last active 2026-04-27
- **Askja** — originator, r2, started the chat
- **Deca** — synthesizer, r3, last active 2026-05-12
- **Monty / montymerlin** — academic research, named but not yet engaged
- **Alaska** — data engineering, named but unclear if real person — worth confirming with Gustaf

## Don't

- Don't propose Gemini for this codebase (Vercel deployment, vanilla JS, no Anthropic SDK).
- Don't auto-add to git or push to a remote. The project folder isn't a git repo; that's deliberate for now.
- Don't propose `omni_chain_queue` integration or any Mythic Ops wiring — this project is async with external collaborators, not an Omni pipeline.
