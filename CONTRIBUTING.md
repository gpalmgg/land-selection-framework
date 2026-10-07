# Contributing — r5 and beyond

This is a working-group project with a strict collaboration protocol. You are picking up the documents from where the previous round left them, adding your perspective as attributed commentary, and handing off to the next round. This file is the *how*; the [Overview](source-docs/Land%20Project%20v1%20r4%20Overview.md) is the *what* and *why*, and [`FRAMEWORK.md`](FRAMEWORK.md) is the portable statement of the discipline (a proposal, not part of the source-docs).

Values revised October 2026 against their cited sources; earlier shared links may match different regions.

---

## The protocol (one-paragraph version)

The three source documents (Overview, Specifications, Implementation Strategy) travel together. State counters: `vN` = implementation version, `rN` = collaboration round. **You never overwrite a `[COMMITTED]` decision** — you add attributed commentary under it, clearly marked with your name and the date. You update the Collaboration Log with a new Contribution History row. You prepare the next Handoff Request before closing. Read the full protocol at the start of [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).

---

## If you're picking up r5

**Step 0 — Identify yourself.** Add your name + role to the Expected Contributors table in the Collaboration Log (if not already there). Monty and Alaska are named contributors who have not yet had a round; Askja, Deca and Adam can come back. Any of them can go first; no prescribed order. Members are named by first name and role only.

**Step 1 — Read.** In order:
1. The Handoff Request `[r4 → r5]` block in the Overview — this is what's being asked of you. It was amended in 2026-10; the amendments are tagged "(added 2026-10-05, r4 addendum)".
2. The reciprocity addendum, "r4 Commentary — Addendum: Reciprocity & host-community standing", in the same Overview, and its one-page summary [`docs/ROUND-R4-ADDENDUM-2026-10.md`](docs/ROUND-R4-ADDENDUM-2026-10.md).
3. The `## r4 Commentary` sections in all three source-docs — the previous round's contribution.
4. [`FRAMEWORK.md`](FRAMEWORK.md) — mark anywhere it misstates the framework as you know it.
5. [`docs/v1-ship-candidate.md`](docs/v1-ship-candidate.md) — the proposal awaiting your ratification under propose-and-proceed (5-working-day default response window; the host-community-standing decision is the exception and needs explicit assent). The source-docs call the folder `Docs/`; on disk it is `docs/`.
6. Whatever else you want — the criteria inventory, the lessons-learned, the per-region dossiers in `prototype/data/research-dossier/<id>/`.

**Step 2 — React.** What does your knowledge/experience see that the documents don't reflect? What's missing, wrong, underweighted, over-engineered, or worth ratifying as-is? The Handoff Request enumerates specific asks; you don't have to answer all of them.

**Step 3 — Add your commentary.** Add a `## r5 Commentary (@YourName, role, YYYY-MM-DD)` section in whichever of the three source-docs your contribution touches (typically all three). **Never overwrite the `[COMMITTED]` decisions above or the r4 commentary; both stay intact.** Cite specific decisions/sections you're responding to. Tag judgment as `[opinion]` where it isn't evidence-grounded.

The 2026-10 additions sit inside the existing text as clearly marked blocks: "r4 addendum pointer" blockquotes beneath Decisions 6 and 7, lines tagged "(added 2026-10-05, r4 addendum)" inside the Handoff Request, and a drafting-provenance sentence after each block. To respond to one, add your own attributed block directly beneath it (your name, role and date on its first line). Do not edit inside the block, do not remove its provenance sentence, and do not remove the pointer.

**Step 4 — Update the Collaboration Log.** Add an r5 row to the Contribution History table in the Overview. Replace the `Handoff Request [r4 → r5]` block with `Handoff Request [r5 → r6]` describing what you've done and what you're asking the next contributor to react to.

**Step 5 — Rename files.** Rename the three source-docs `r4 → r5`:

```bash
cd source-docs
git mv "Land Project v1 r4 Overview.md"               "Land Project v1 r5 Overview.md"
git mv "Land Project v1 r4 Specifications.md"         "Land Project v1 r5 Specifications.md"
git mv "Land Project v1 r4 Implementation Strategy.md" "Land Project v1 r5 Implementation Strategy.md"
cd ..
# Also bump the rN references so they stay in sync: README.md, CONTRIBUTING.md,
# FRAMEWORK.md, invitation.md (then rebuild both PDFs, see below) and CLAUDE.md.
```

The invitation PDF is rebuilt from `invitation.md` with `pandoc invitation.md -o "Land Selection Framework.pdf" --pdf-engine=weasyprint --css .pdf-style.css`, then copied to `prototype/invitation.pdf` (the two files must be byte-identical).

**Step 6 — Commit + push.** One commit per round, substantive message. Sign as `Co-Authored-By` if AI-assisted. Push to `main`.

**Step 7 — Tell the group.** Post in the working-group chat that r5 is done, link the repo, name the round-summary in one line so people know what changed. An unsent draft of the r4 → r5 message is in [`docs/r5-handoff-DRAFT.md`](docs/r5-handoff-DRAFT.md); it is for the practitioner seat to send or not.

That's the whole flow. Total time scales with how deep you go on commentary — Gustaf's r4 was an extreme case (delivered a working V1 production push alongside the commentary). A pure-commentary round is a few hours.

---

## How the V1 production deliverables work

If your round produces new data layers, processed outputs, or code (not required — pure-commentary rounds are valid), here's how the existing machinery is laid out.

### Per-jurisdiction qualitative layer (the pattern used 7 times in r4)

Adding a new per-jurisdiction layer (e.g. `internet_quality` or `local_food_infrastructure`) needs only **two files**:

1. **The structured JSON intermediate** at `prototype/data/processed/<layer-name>.json` — one entry per region, keyed by `region_id`, against a fixed schema. LLM-assisted extraction from the dossiers is allowed (Spec Step 4) as long as the JSON is human-verifiable.
2. **The metadata sidecar** at `prototype/data/processed/<layer-name>.metadata.yaml` — source, vintage, license, native_unit, time_framing, state, trajectory, sovereignty_axes, red_line_underlying (if any), properties_schema.

Then run:
```bash
cd prototype
.venv/bin/python scripts/compile_per_jurisdiction.py <layer-name>
```

The generic compiler reads the JSON + sidecar, joins to region coords from `data/regions.js`, and emits `data/processed/<layer-name>.geojson` as a Point FeatureCollection.

Register the layer in `scripts/v1_loader.py` (LAYERS + SIDECAR dicts). Run `python scripts/export_v1.py` to generate the GeoPackage. Run `node scripts/gen_region_pages.mjs` to regenerate the region pages, and `node scripts/gen_v1_lookup.mjs --write` to regenerate the small `data/v1-lookup.js` the dashboard filters import.

### Areal / presence layer (raster polygons or event points)

Different pattern — see `scripts/process_aqueduct.py`, `scripts/process_vectors.py`, `scripts/fetch_hospitals.py`, `scripts/process_hospital_proximity.py` for working examples. The output goes to `data/processed/<layer>.geojson` (or `<layer>-na.geojson` for NA-clipped); the metadata sidecar goes alongside; the layer is registered in `v1_loader.py` the same way.

### Public reach surface (per-region pages, share cards, dashboard filters)

If you want a new layer surfaced on the per-region indexable pages, extend `prototype/scripts/gen_region_pages.mjs` and the shared renderers in `prototype/lib/`: add a section renderer that pulls the layer's record for `region.id`, and call it where the page is assembled.

If you want a new categorical filter on the dashboard, add it to `prototype/src/config/qual-filters.js`. A filter is always one criterion or one categorical fact; no control may combine more than one (see the non-negotiables). Land standing is never a filter.

If you want a new fact on the share card per region, extend the card layout used by `prototype/api/og.js` (shared layout code is in `prototype/lib/og-card.js`). Both edge functions must stay on the edge runtime (`export const config = { runtime: 'edge' }`).

---

## Adding a region

The admission protocol is [`FRAMEWORK.md`](FRAMEWORK.md) section 13: reciprocity screen first, an exact footprint, every criterion reproduced from its stated source, all per-jurisdiction layers, a Land standing entry, a legal pathway block, bioregion membership, a "what living here asks of you" paragraph, a claims check, and the drop rule (any required element that cannot be verified drops the region; a region is never shipped half-done). Read it before touching a file. The wiring below is the current implementation of that protocol, and it will change; the protocol will not.

A region is one id (a lowercase slug, for example `finger-lakes`) that must appear in every one of these places, in the order they appear in `data/regions.js` (the slate order is the array order, Europe then North America):

| Data | File (under `prototype/`) |
|---|---|
| Region, per-criterion values (each with source, vintage, method, footprint) | `data/regions.js` |
| Land standing (territory, tenure, entry, obligation, sources) | `data/land-standing.js` |
| "What living here asks of you" | `data/region-depth.js` |
| Legal pathway | `data/legal-pathway.js` |
| Reciprocity (first conversations, "not there" forms, claims) | `data/reciprocity.js` |
| Climate-zone and water context | `data/context.js` |
| Bioregion membership | `data/bioregions.js`, built by `scripts/bio/` (the region needs a `place` and `watershed` entry in `scripts/bio/make_bioregions_js.py`) |
| Footprint | `data/footprints.json` and `data/footprints/<id>.geojson` |
| The seven per-jurisdiction layers | `data/processed/*.json`, then `compile_per_jurisdiction.py` for each `.geojson` |
| Sources and licences used | `data/sources.js` (a cell's `sourceId` must resolve here) |

Then, from `prototype/`:

```bash
node scripts/gen_v1_lookup.mjs --write      # data/v1-lookup.js
node scripts/gen_region_pages.mjs           # region/<id>.html, sitemap.xml, llms.txt
node scripts/stamp_build.mjs --bump --write # counts, count words, dates, cache-bust values in the pages
node tests/run.mjs --strict                 # data tests, including slate completeness in every file above
node --test tests/core                      # core logic tests
```

Counts of regions, criteria and map layers are derived from the data; no page or document has them typed in. `stamp_build.mjs` writes them into the pages from `data/site-facts.js`, and `--bump` also writes a new build id, which is the cache-bust value (pages and scripts that carry a `data-bust` attribute pick it up). Do not hand-edit `data/v1-lookup.js`, `region/*.html`, `sitemap.xml` or `llms.txt`: they are generated.

Notes that save a wasted run:

- `gen_region_pages.mjs` refuses to render a region that is missing a required element and says which; `--out-dir DIR` writes the same files under `DIR` instead of the working tree, and `--check` compares without writing. `gen_v1_lookup.mjs` and `stamp_build.mjs` also take `--check`, and `stamp_build.mjs` takes `--root DIR` for a scratch copy of `prototype/`. Try a new region in a scratch copy first.
- A value you cannot reproduce from its stated source is left empty with a reason (a visible "not yet verified" gap), never filled with an estimate. A new region with more than three empty cells is dropped, not shipped.
- The browser tests (`/usr/bin/python3 tests/e2e/run_all.py --port N --site DIR --suite ...`, see `tests/e2e/README.txt`) start their own local server on the port you give them. Never submit the signup forms while testing; they send real email.
- Update the Collaboration Log (or the deviation log, if you departed from the protocol) with the admission, and ask who reviews the Land standing entry. The group has not yet ratified a slate-admission rule; the Handoff Request asks it to.

---

## Documentation hygiene

Counts (regions, criteria, filters, layers) are never typed into prose; they come from computed facts. The facts generator is `docs_facts.mjs` and its companion `lint_docs.mjs` (which checks a document for stale counts, personal contact details, banned framing and the "checked against opened public sources" wording). They currently live with the maintainer's local upgrade notes, in `upgrade-2026-10/tracks/docs/tools/`, which is not tracked in this repository; ask the maintainer to run them, or to move them under `prototype/scripts/`. Without them, read the current counts from the data itself:

```bash
cd prototype
node -e "import('./data/site-facts.js').then(m => console.log(m.facts))"
```

A quoted past count (for example the size of the r4 slate) is marked as history in the source line so a checker can tell it from a stale one. When you bump an `rN` reference, check README.md, CONTRIBUTING.md, FRAMEWORK.md and invitation.md together.

---

## Local setup

### To browse / read

You don't need any setup. The repo is markdown + HTML + JSON. Open the files in any editor; the [live site](https://land-selection-framework.regencommunity.tools) carries the public surface.

### To run scripts (Python)

```bash
cd prototype
python3 -m venv .venv
.venv/bin/python -m ensurepip
.venv/bin/python -m pip install rasterio geopandas pyyaml pillow
```

Then:
```bash
.venv/bin/python scripts/v1_loader.py            # self-check, prints loadable criteria
.venv/bin/python scripts/export_v1.py            # regenerate GeoPackages
.venv/bin/python scripts/compile_per_jurisdiction.py <layer-name>  # compile a per-jurisdiction layer
```

The GeoPackages in `prototype/data/v1-exports/` are the 2026-05-29 export for the original slate; they have not been regenerated for the 2026-10 slate.

### To regenerate the public surface

```bash
cd prototype
node scripts/gen_v1_lookup.mjs --write
node scripts/gen_region_pages.mjs                # one page per region + sitemap + llms.txt
node scripts/stamp_build.mjs --write             # add --bump for a release
```

### To serve the prototype locally

```bash
cd prototype
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/
```

The two edge functions in `api/` do not run on a static server; render them in plain Node with `scripts/og_harness.mjs`.

### To deploy to production (maintainer only)

```bash
vercel deploy --prod --yes --cwd prototype
```

You need to be logged in via `vercel login` and have access to the project's Vercel team. Run `node tests/run.mjs --strict` first. The static site + two edge functions deploy in ~30 seconds.

---

## Non-negotiables (from the source-docs and FRAMEWORK.md)

The first six are `[COMMITTED]` in the source-docs and bind every round. The rule ids (F-n) are those of [`FRAMEWORK.md`](FRAMEWORK.md) section 2.

1. **No composite scoring** (F-1, F-2) — no "livability" or other composite metric across criteria, no weights, no sums, no ranking, no superlatives, no stars or medals. The user combines criteria themselves. (Threshold filtering is not a composite; it's pass/fail per criterion, F-3.)
2. **Native units throughout** (F-4) — no reshaping to a universal grid.
3. **Source + vintage + license on every value** (F-5) — always visible in the UI.
4. **State + trajectory per criterion** where meaningful (F-6).
5. **No querying in V1; threshold filtering shown in r4** as not-a-composite-not-pure-data. V2's full query layer (composites, weighting) remains deferred.
6. **Tier-1 / Tier-2 honesty (r4-proposed)** — curated values never count as ingested coverage; only Tier-1 real ingestion clears the ship gate.
7. **Land standing is qualitative only** (F-7) — never scored, never ranked, never graded, never converted to a number, and never a filter of any kind. It is read, not computed.
8. **No personal contact details on public surfaces** (F-8) — no email, phone number, handle or surname for any member, anywhere on the site or in a document it links to. Nobody is contacted on the strength of a document.
9. **Unverifiable means dropped** (F-9) — a claim, region or layer that cannot be reproduced from an opened source is corrected or dropped, never shipped half-done. Say "checked against opened public sources", never "verified" in a way that could be read as review or approval by a nation, a community or the working group.
10. **Reciprocity is the spine** (F-10) — the framework serves communities seeking to belong to a place. Where arriving in a place would harm the community already there, the honest answer is not to go.

Violations should be flagged in your r-N commentary, not silently fixed. The discipline matters more than the answer.

---

## Questions

The Open Questions section at the bottom of the Overview lists what's still owed by the group. Pick whichever resonates with your expertise; you don't need to address all of them.

There is no public contact route yet; the working group will set one.
