# Contributing — r5 and beyond

This is a working-group project with a strict collaboration protocol. You are picking up the documents from where the previous round left them, adding your perspective as attributed commentary, and handing off to the next round. This file is the *how*; the [Overview](source-docs/Land%20Project%20v1%20r4%20Overview.md) is the *what* and *why*.

---

## The protocol (one-paragraph version)

The three source documents (Overview, Specifications, Implementation Strategy) travel together. State counters: `vN` = implementation version, `rN` = collaboration round. **You never overwrite a `[COMMITTED]` decision** — you add attributed commentary under it, clearly marked with your name and the date. You update the Collaboration Log with a new Contribution History row. You prepare the next Handoff Request before closing. Read the full protocol at the top of [`source-docs/Land Project v1 r4 Overview.md`](source-docs/Land%20Project%20v1%20r4%20Overview.md).

---

## If you're picking up r5

**Step 0 — Identify yourself.** Add your name + role to the Expected Contributors table in the Collaboration Log (if not already there). Round-pickers in r4 noted: any of Monty, Alaska, Askja, Deca, Adam can go first; no prescribed order.

**Step 1 — Read.** In order:
1. The Handoff Request `[r4 → r5]` block in the Overview — this is what's being asked of you.
2. The `## r4 Commentary` sections in all three source-docs — the previous round's contribution.
3. [`Docs/v1-ship-candidate.md`](Docs/v1-ship-candidate.md) — the proposal awaiting your ratification under propose-and-proceed (5-working-day default response window).
4. Whatever else you want — the criteria inventory, the lessons-learned, the per-region dossiers in `prototype/data/research-dossier/<id>/`.

**Step 2 — React.** What does your knowledge/experience see that the documents don't reflect? What's missing, wrong, underweighted, over-engineered, or worth ratifying as-is? The Handoff Request enumerates specific asks; you don't have to answer all of them.

**Step 3 — Add your commentary.** Add a `## r5 Commentary (@YourName, role, YYYY-MM-DD)` section in whichever of the three source-docs your contribution touches (typically all three). **Never overwrite the `[COMMITTED]` decisions above or the r4 commentary; both stay intact.** Cite specific decisions/sections you're responding to. Tag judgment as `[opinion]` where it isn't evidence-grounded.

**Step 4 — Update the Collaboration Log.** Add an r5 row to the Contribution History table in the Overview. Replace the `Handoff Request [r4 → r5]` block with `Handoff Request [r5 → r6]` describing what you've done and what you're asking the next contributor to react to.

**Step 5 — Rename files.** Rename the three source-docs `r4 → r5`:

```bash
cd source-docs
git mv "Land Project v1 r4 Overview.md"               "Land Project v1 r5 Overview.md"
git mv "Land Project v1 r4 Specifications.md"         "Land Project v1 r5 Specifications.md"
git mv "Land Project v1 r4 Implementation Strategy.md" "Land Project v1 r5 Implementation Strategy.md"
cd ..
# Also bump the rN references in README.md + CLAUDE.md so they stay in sync.
```

**Step 6 — Commit + push.** One commit per round, substantive message. Sign as `Co-Authored-By` if AI-assisted. Push to `main`.

**Step 7 — Tell the group.** Post in the working-group chat that r5 is done, link the repo, name the round-summary in one line so people know what changed.

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

Register the layer in `scripts/v1_loader.py` (LAYERS + SIDECAR dicts). Run `python scripts/export_v1.py` to generate the GeoPackage. Run `node scripts/gen_region_pages.mjs` to regenerate the region pages + sitemap + the shared `data/v1-lookup.js` the dashboard imports.

### Areal / presence layer (raster polygons or event points)

Different pattern — see `scripts/process_aqueduct.py`, `scripts/process_vectors.py`, `scripts/fetch_hospitals.py`, `scripts/process_hospital_proximity.py` for working examples. The output goes to `data/processed/<layer>.geojson` (or `<layer>-na.geojson` for NA-clipped); the metadata sidecar goes alongside; the layer is registered in `v1_loader.py` the same way.

### Public reach surface (per-region pages, OG cards, dashboard filters)

If you want a new layer surfaced on the per-region indexable pages, extend `prototype/scripts/gen_region_pages.mjs` — the page() function takes the region object and renders sections. Add a new section renderer (see `firstGateBlock`, `practicalFitBlock`, `fieldRealityBlock`, `climateBufferingBlock`) that pulls from `v1[<layer_name>][region.id]`, and call it in page().

If you want a new qualitative filter on the dashboard, extend the `QUAL_FILTERS` array at the top of `prototype/src/main.js`. The filter integrates automatically with `regionPasses()`, the URL state (`?q.<field>=<value>`), and the reset behaviour. Bump the `?v=usabN` cache string on the three import sites in `src/main.js` + `index.html`.

If you want a new fact on the OG share card per region, extend `buildRegionTree()` in `prototype/api/og.js`.

---

## Local setup

### To browse / read

You don't need any setup. The repo is markdown + HTML + JSON. Open the files in any editor; the [live site](https://land-selection-framework.vercel.app) carries the public surface.

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

### To regenerate the public surface

```bash
cd prototype
node scripts/gen_region_pages.mjs                # 20 region pages + sitemap + v1-lookup.js
```

### To serve the prototype locally

```bash
cd prototype
python3 -m http.server 8765 --bind 127.0.0.1
# open http://127.0.0.1:8765/
```

### To deploy to production

```bash
vercel deploy --prod --yes --cwd prototype
```

You need to be logged in via `vercel login` and a member of the `gustafs-projects-c00d22da` team on Vercel. The static site + two edge functions deploy in ~30 seconds.

---

## Non-negotiables (from the source-docs)

These are `[COMMITTED]` and bind every round:

1. **No composite scoring** — no "livability" or other composite metric across criteria. The user combines criteria themselves. (Threshold filtering is not a composite; it's pass/fail per criterion.)
2. **Native units throughout** — no reshaping to a universal grid.
3. **Source + vintage + license on every value** — always visible in the UI.
4. **State + trajectory per criterion** where meaningful.
5. **No querying in V1; threshold filtering shipped in r4** as not-a-composite-not-pure-data. V2's full query layer (composites, weighting) remains deferred.
6. **Tier-1 / Tier-2 honesty (r4-proposed)** — curated values never count as ingested coverage; only Tier-1 real ingestion clears the ship gate.

Violations should be flagged in your r-N commentary, not silently fixed. The discipline matters more than the answer.

---

## Questions

The Open Questions section at the bottom of the Overview lists what's still owed by the group. Pick whichever resonates with your expertise; you don't need to address all of them.

Reach Gustaf (r4 contributor, repo maintainer): <gustaf@islands-of-coherence.com>
