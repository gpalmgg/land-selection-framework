# Land Selection Framework — Project Context

## What this is

A shared working-group project building a geospatial database to help people find land for regenerative community settlements meant to flourish over 50–100 years. **Gustaf is not the originator — this is async collaboration** with Adam McKent (GIS architect), Askja (regenerative practitioner / originator), Deca (synthesizer), Monty (academic researcher), and a named "Alaska" contributor.

The project structure is a **versioned document package** with a strict collaboration protocol — three markdown files (Overview, Specifications, Implementation Strategy) travel together. Each contributor reads, adds their perspective, updates the Collaboration Log, hands off. State counters: `vN` = implementation version, `rN` = collaboration round. **Currently v1 r4 (Gustaf delivered).** Gustaf holds the r4 seat as practitioner reality-check.

The source documents at `source-docs/` are the **immutable source of truth** for the project state. Do not propose to overwrite `[COMMITTED]` decisions in them — only add commentary under those decisions, clearly attributed. Read `source-docs/Land Project v1 r4 Overview.md` first for framing.

## 2026-07 update — bioregioning reframe, Land standing, 17-layer map (READ THIS)

Driven by a media request (**The Atlantic** science section, "land selection for the apocalypse" — informal interview Thu/Fri 3–4 Jul 2026 with journalist **Hilary Beaumont**, who is from Nova Scotia, a region on the map). Gustaf repositioned the whole prototype. The sections below still describe the earlier state; where they conflict, **this block wins.**

- **Bioregioning reframe (live).** The site now presents as *"a bioregioning tool for communities seeking to belong to a place and help it flourish over 50–100 years,"* with **reciprocity as the spine** — no longer "land selection / candidate regions" (that read as settler site-shopping). Hero, subtitle, presets, region blurbs, meta/OG/Twitter/JSON-LD, and `deeper.html`'s ethics section all reframed. "Candidate region / siting / shopping list" removed from *framing* copy (factual price/legal data left intact). `deeper.html`#ethics carries the firmer stance (a "Reciprocity" value naming Mi'kma'ki, Sinixt/Ktunaxa/Syilx, Zapotec/Mixtec/Chatino + "where arriving would harm the community already there, the honest answer is not there"); the homepage stays warm/invitational.
- **"Land standing" dimension (live).** `data/land-standing.js` — a per-region **qualitative reciprocity dimension (never scored)**: `territory` (whose land — Indigenous nation + treaty/unceded status for NA; rooted community/commons for Europe), `tenure`, `entry`, `obligation`. Shows in the region drawer + each `region/<id>.html`. NA territory names verified against public sources 2026-06-30. **Gustaf chose to keep "unceded" wording as-is (option c).**
- **Map expanded 9 → 17 layers (live).** `src/main.js` wires 8 new verified public tile/WMS layers (precipitation, soil carbon, land cover, solar PV, population, travel-time, seismic, coastal-flood/SLR), grouped into 6 themes, with a bottom-right **legend**. Every endpoint curl- + in-browser-verified (CORS + real tiles). Cached-XYZ layers paint fast; 4 dynamic-WMS ones (soil, precipitation, land-cover, travel-time) are slower. Hardening: graceful `map.on('error')`, continent-switch-safe, **surfaces stack freely** with opacity capped so pairs blend. Honest gaps NOT shipped (no clean public tiles): air-temp climatology, aridity/Köppen, riverine flood, real SPEI drought, ESA WorldCover.
- **Contacts removed.** Personal email + Substack + Instagram stripped site-wide; "A project of The Collective" removed from the hero eyebrow. Contact now routes via the newsletter signup + invitation PDF.
- **New working docs (project root, NOT deployed):** `interview-brief-atlantic.md` (interview prep) and `r4-reciprocity-commentary-DRAFT.md` (the practitioner r4 contribution as protocol-legal additive commentary — **drafted, NOT yet appended to source-docs**, pending Gustaf's decision).
- **Authorship guardrail:** publicly, credit **Askja as originator** + the working group. "It's mostly my project now / I hold the practitioner seat" is accurate; "I founded/originated it" is not.
- **Cache-bust** currently `?v=usab15` (bump on any `main.js`/data edit). See the [[bioregioning-reframe-and-atlantic-interview]] memory.

## What's been built in this folder

- `invitation.md` + `Land Selection Framework.pdf` — explainer for inviting new contributors (working group + roles + collaboration protocol)
- `prototype/` — a designed dashboard demonstrating what V1 will produce, deployed to Vercel. Hand-curated regional comparison across **20 regions** (10 Europe, 10 North America) with threshold sliders, a shortlist/compare view, a region-detail drawer, and (since 2026-07) a per-region "Land standing" reciprocity block + a 17-layer map. NOT the V1 build — a communicative artifact.
  - **Reach layer added 2026-05 (A/B/C):** (A) a guided "what matters most?" entry band that sets thresholds and scrolls to a result moment; (B) a **dynamic share card** — Vercel **edge functions** `api/og.js` (renders the visitor's result, or `?region=<id>`, as a 1200×630 image) + `api/share.js` (crawler-facing meta → redirects to the app); (C) **per-region indexable pages** (`region/<id>.html`) generated by `scripts/gen_region_pages.mjs`, plus `sitemap.xml`. This means the prototype is **no longer pure-static** — it now ships two edge functions (`@vercel/og`). See the [[dynamic-og-and-region-pages-wiring]] memory for wiring + verification gotchas.
- `source-docs/` — the three working-group documents at r4, plus working transcripts

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

**Tier honesty** (per ~/.claude portability filter): the **framework layer** (criteria, sovereignty axes, state+trajectory, MAUP-respecting methodology) is **Portable**. The **build wiring** (MapLibre + specific tile services + JS state management) is **Tied** — dies with the stack. The 2026-05 reach layer adds tiers too: the guided-entry *pattern* and per-region *content* are Portable/Semi-portable, but the **dynamic share card (Vercel edge functions + `@vercel/og`) is Tied** — a deliberate, scoped serverless dependency in an otherwise-static project. Both layers are visible in this folder; don't confuse them.

## File map

```
land-selection-framework/
├── CLAUDE.md                       (this file)
├── README.md                       (project orientation, more public-facing)
├── invitation.md                   (working-group invitation for new contributors)
├── Land Selection Framework.pdf    (PDF of invitation.md)
├── .pdf-style.css                  (CSS for pandoc → PDF)
├── source-docs/                    (the r3 doc package — source of truth)
│   ├── Land Project v1 r4 Overview.md
│   ├── Land Project v1 r4 Specifications.md
│   └── Land Project v1 r4 Implementation Strategy.md
└── prototype/                      (the deployed artifact: static site + 2 edge functions)
    ├── index.html                  (dashboard shell; guided entry band + result moment)
    ├── src/main.js                 (rendering, slider state, shortlist, share wiring; cache-bust ?v=usabN)
    ├── data/regions.js             (regions + criteria + hand-curated values)
    ├── data/region-depth.js        ("what living here asks of you" + case-study deep-links)
    ├── data/land-standing.js       (per-region reciprocity dimension: territory/tenure/entry/obligation — 2026-07)
    ├── data/v1-lookup.js           (per-jurisdiction r4 V1 layers; regenerated by gen script)
    ├── deeper.html                 (methodology, case studies, ethics/values, sources)
    ├── data/processed/             (real GeoJSONs used by the map)
    ├── data/raw/                   (1.4 GB of downloaded data — gitignored, NOT deployed)
    ├── api/og.js                   (edge fn: dynamic OG image; ?<filters> or ?region=<id>)
    ├── api/share.js                (edge fn: crawler HTML shell w/ dynamic meta → redirect)
    ├── lib/result.js               (shared computeResult() — passing logic; used by both edge fns)
    ├── region/<id>.html            (20 generated per-region indexable pages)
    ├── sitemap.xml + robots.txt    (generated sitemap; robots points to it)
    ├── package.json                (@vercel/og dependency — Node reinstalls on Vercel build)
    ├── vercel.json                 (single rewrite: /share → /api/share)
    ├── scripts/gen_region_pages.mjs (build-time generator for region/ + sitemap.xml — NOT deployed)
    ├── scripts/                    (Python processors — for future updates)
    ├── .venv/                      (Python 3.12, rasterio + geopandas + pillow)
    └── .vercelignore               (excludes .venv, raw data, scripts, node_modules from deployment)
```

## Operational notes for future sessions

- **Don't auto-rebuild the V1 in miniature.** That paradigm failed. Stay in the designed-artifact paradigm unless something fundamental changes (e.g. group sets up real ingestion infrastructure, V1 actually starts).
- **The 1.4 GB `data/raw/` folder can be deleted.** It was scratch for the original (failed) raster-overlay approach. The processed GeoJSONs in `data/processed/` are what the deployed site uses. Keep `data/raw/aqueduct-extract/` if you want to re-process water-stress with different parameters.
- **Redeploying** the Vercel site: `cd prototype && vercel deploy --prod --yes`. ~10 seconds.
- **The hand-curated values in `data/regions.js`** are best-available midpoints. If you change them, document the change in a comment and ideally update the footer to note the revision.
- **Adding a new region:** add to the `regions` and `values` arrays in `data/regions.js`. The renderer will pick it up.
- **Adding a new criterion:** add to the `criteria` array in `data/regions.js` and add per-region values for it. Slider direction is computed from `higherIs`.
- **After editing `data/regions.js` or `data/region-depth.js`, regenerate the region pages:** `cd prototype && node scripts/gen_region_pages.mjs` (rewrites `region/*.html` + `sitemap.xml`). The dynamic OG card + `/share` read the data live, so they need no regen — only the static per-region pages do. Bump `?v=usabN` in `index.html` when `src/main.js` changes so browsers reload it.
- **The edge functions can't be tested with `vercel dev`** on this machine — its edge emulator stubs `fetch` and `@vercel/og` hangs. Verify the image by importing the handler in plain Node with a mock `Request` (write the PNG to /tmp and Read it), or curl the **production** URL (preview deploys are 401-gated). The functions MUST stay on the **edge runtime** (`export const config = { runtime: 'edge' }`) — Vercel's Node runtime 500s on a returned web `Response`. Full notes: [[dynamic-og-and-region-pages-wiring]] memory.

## What r4 still owes the working group

Per the r3 Handoff Request, Gustaf is expected to contribute a **practitioner reality-check** — what the eco-village-embedded perspective sees that the docs don't. The deployed prototype is *demonstration*, not the contribution.

**Status (2026-07):** the practitioner contribution is now **drafted** — see `r4-reciprocity-commentary-DRAFT.md` (the reciprocity / host-community-standing argument: Decision 7's four sovereignty axes are all *settler* self-sovereignty; proposes a fifth "host-community standing" consideration + a V1-legal move to surface land-tenure/territory as qualitative context, which the prototype's Land standing block now does). It is written as protocol-legal *additive* commentary (does not overwrite committed decisions) with a Collaboration Log entry + r5 Handoff. **NOT yet appended to the source-docs — awaiting Gustaf's go.** When he approves, append it (attributed) and prepare the next Handoff Request.

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
