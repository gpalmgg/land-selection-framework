# North America Expansion, PRD (Functional Spec, LOCKED on approval)

The source of truth `/build` enforces. WHAT + WHY. Deliverable type: **static web app + sourced dataset**.

**Standing principle (from the audit):** zero placeholder data ships. A NA region goes live only when all 8 of its cells are real, sourced, and verified against its dossier. The count (10) is fixed; data quality is non-negotiable.

---

## Engineering / scaffold

### AC-1, `continent` field on the data model
**Description:** Every region object in `regions.js` carries `continent: 'europe' | 'north-america'`. All 10 existing European regions are tagged `'europe'`. No other field of the region/criteria/value shape changes.
**Setup:** `python3 -m http.server 8765 --directory prototype` (wait for "Serving HTTP")
**Verify:** In browser console at `localhost:8765`, `import('./data/regions.js').then(m => console.log(m.regions.every(r => r.continent), m.regions.filter(r=>r.continent==='europe').length))` → `true 10`. The European site renders identically to current production.
**Depth:** Additive only, must not alter existing ids, values, or the criteria array. EU regression is part of this AC.

### AC-2, Continent switcher (UI + behavior)
**Description:** A continent switcher (Europe / North America) sits near the map. Clicking a tab sets the active continent; the active tab is visually indicated; it is keyboard-operable and labeled for screen readers.
**Setup:** server running (AC-1).
**Verify:** Load page → switcher visible with both tabs. Click "North America" → NA view active (tab highlighted, `aria-selected`/pressed state set). Click "Europe" → back. Tab key reaches it; Enter/Space activates.
**Depth:** Works on mobile (≤480px) without overflowing; matches the editorial aesthetic (not a generic toggle); does not shift the hero/banner.

### AC-3, All render surfaces are continent-scoped
**Description:** With a continent active, these show ONLY that continent's regions: region grid, per-criterion bar charts, summary table, map markers, footer "Sources cited" list, AND the inline `<details>` per-criterion source builder. The match-count and any "X of N regions" text reflect the active continent's region count.
**Setup:** server running.
**Verify:** Switch to NA → region grid, every criterion's bars, summary-table columns, map markers, and each criterion's "Sources for…" expander list show NA regions only; match bar reads "N of N" where N = live NA region count. Switch to EU → EU only, count = 10.
**Depth:** MUST include the two easily-missed consumers research flagged, the inline `<details>` builder (`index.html:1499`, imports data independently of `refreshAll`) and the hardcoded count strings (`:1495` "(10 regions)", `:1269` "of 10"). A shallow pass that updates the main grid but leaves NA data absent from source expanders, or shows "of 10" on a continent with fewer live regions, FAILS this AC.

### AC-4, Continent-parameterised map (the global seam)
**Description:** A `CONTINENTS` config holds `{center, zoom}` per continent. Switching re-centers the map (animated) to the active continent. Adding a future continent requires only a `CONTINENTS` entry + a tab + that continent's data, no changes to render functions or the map engine.
**Setup:** server running.
**Verify:** Switch NA → map animates to ~`[-100, 45]` showing North America. Switch EU → Europe. Code inspection: render functions contain no hardcoded continent branches; map center/zoom come from `CONTINENTS[activeContinent]`.
**Depth:** `flyTo`/`jumpTo` re-center, not a full map re-init (preserve layer state). Min/max zoom still sane for NA's larger extent.

### AC-5, Thresholds persist across continent switch
**Description:** Threshold slider state is criterion-global and survives continent switching; the same thresholds filter both continents.
**Setup:** server running.
**Verify:** On EU, set Climate threshold to a restrictive value (some regions fail). Switch to NA → same threshold applied to NA regions. Switch back to EU → original filtered state intact.
**Depth:** Switching must not reset, double-apply, or drop the URL-encoded threshold state (the share-link round-trip still works).

### AC-6, Idempotent rendering (no duplicate DOM)
**Description:** Repeated continent switches never duplicate region cards, bar rows, table columns, or map markers.
**Setup:** server running.
**Verify:** Switch EU⇄NA five times; assert total rendered region cards, bar rows per criterion, and map markers equal their render-once counts (no growth). No orphaned/duplicate nodes in DOM.
**Depth:** Render-both-and-toggle (chosen approach): both continents rendered once, visibility toggled, verify nothing re-appends on switch.

## Map layers (North America)

### AC-7, NA map layers present, populated, and continent-scoped
**Description:** The NA view shows: **ecovillage sites** (fresh NA OpenStreetMap Overpass pull, non-empty), **water-stress 2050** and **water-depletion 2050** polygons (Aqueduct reprocessed for a NA bbox), and **conflict density** (reprocessed; may be sparse/empty, factually honest). EU layers do not render over NA and vice versa.
**Setup:** server running; NA geojsons present in `data/processed/`.
**Verify:** NA view → toggle each layer; ecovillage layer shows markers across the NA extent; water layers show NA polygons; switching to EU shows the European versions, not NA. EU view never shows NA features.
**Depth:** The ecovillage ("regen network") layer is the signature layer and starts visible, it MUST be non-empty over NA (a real Overpass result), not a re-clip of the empty European file. Conflict-empty over NA is acceptable and correct; do not fabricate events.

### AC-8, Processing scripts parameterised (repeatable for any continent)
**Description:** `process_aqueduct.py`, `process_aqueduct_depletion.py`, `process_vectors.py` take a bounding box (no hardcoded `EUROPE_BBOX`); a new `fetch_ecovillages_na.py` performs the NA Overpass query. Re-running for NA produces `*-na.geojson` outputs without overwriting the European files.
**Setup:** Python venv at `prototype/.venv`; global source data on disk (Aqueduct GDB, UCDP CSV present).
**Verify:** Inspect scripts → bbox is a parameter/constant per continent, output filenames suffixed per continent. Run for NA → `water-stress-na.geojson`, `water-depletion-na.geojson`, `conflict-na.geojson`, `ecovillages-na.geojson` created; EU `*.geojson` unchanged (byte-identical).
**Depth:** Idempotent + documented so continent #3 is a bbox + re-run, not a rewrite.

## Data (the marathon)

### AC-9, Ten NA regions with complete, real, sourced data
**Description:** Each approved NA region (Cascadia, Vermont, S. Appalachians, Driftless, Ozarks, N. New Mexico, Nova Scotia, Kootenays, Québec E. Townships, Oaxaca) has all 8 criteria cells, each with `value + unit + vintage + source + sourceUrl`. No placeholder, empty, or suspiciously-identical-across-regions values.
**Setup:** server running.
**Verify:** Programmatic: import regions.js; for each NA region × 8 criteria, assert all 6 fields present and non-empty; flag any criterion whose value is identical across all 10 NA regions (except conflict, where 0 is legitimate). **Plus human verification** (see test-plan "Cannot be auto-tested").
**Depth:** Values are sourced from the documented global datasets (WorldClim CMIP6 SSP2-4.5 2041–2060, Aqueduct 4.0, SoilGrids 2.0, Hansen GFC v1.11, Global Solar Atlas v2.7, UCDP GED v24.1, GHSL, GEN/OSM) and cross-checked against the region's dossier. This is the audit's data-honesty bar applied to NA, a region with invented or copy-pasted numbers FAILS even if all fields are technically populated.

### AC-10, NA dossiers (the audit trail)
**Description:** Each NA region has a dossier dir with 8 dimension files (`climate, water, soil, energy, stability, regen, accessibility, legal`), matching the European template, with real citations that back the values in `regions.js`.
**Setup:** none.
**Verify:** `ls data/research-dossier/` shows the 10 NA dirs; each has 8 `.md` files; spot-check 2 regions: citations are real URLs/sources and the dossier value matches the corresponding `regions.js` cell.
**Depth:** `legal.md` carries the qualitative legal/economic content (foreign-ownership rules, land prices, tenure, US vs Canada vs Québec civil law vs Mexican ejido) that the dashboard deliberately does NOT slider-ise.

### AC-11, Batch integrity (never ship unverified)
**Description:** A NA region's data block is present in deployed `regions.js` only after its cells are verified against its dossier. At any point, every *visible* NA region is fully sourced.
**Setup:** server running.
**Verify:** For the deployed build, AC-9's programmatic + human check passes for ALL visible NA regions (no partially-filled region is live).
**Depth:** Batching is the mechanism (proof batch of 3, then 4, then 3). The site must never show a region with blank/“TBD” cells.

## Content & discipline

### AC-12, deeper.html gains NA coverage without new contradictions
**Description:** `deeper.html` reflects the multi-continent reality: stale "ten European regions / all ten live" claims corrected; bibliography "Used for" strings include NA where sources are shared; NA regions acknowledged. (Full NA case studies may be a later batch; at minimum the framing is consistent.)
**Setup:** none.
**Verify:** `grep` deeper.html → no stale "ten European regions … all ten" singular-continent claim; NA regions appear in bibliography "Used for" or a NA section.
**Depth:** Must not break the existing version ladder (prototype→V1→V2) or the "The Collective" framing shipped earlier. No new contradictions.

### AC-13, Framework discipline intact for NA
**Description:** No scoring, weighting, ranking, or compositing is introduced. Native units throughout. Legal & economic stays dossier-only (no slider/criterion card). Threshold filtering unchanged.
**Setup:** server running.
**Verify:** `grep` main.js → no new score/weight/rank logic; `regionPasses` remains pure boolean threshold AND-ing; no 9th criterion card; NA values in native units.
**Depth:** The continent feature is presentation/filtering only, it must not sneak any cross-criterion aggregation in.

### AC-14, No European regression; mobile clean both continents
**Description:** The European experience is unchanged (regions, data, map, modal, sliders, share, banner, Collective framing). Both continents render cleanly on mobile (390px), including the switcher and the collapsible map controls.
**Setup:** server running.
**Verify:** EU view DOM/visual matches current production (10 regions, 8 criteria, modal engagement-gated, sliders usable). Mobile screenshots of both continents: hero/banner, switcher, map (collapsed controls), criteria, footer, no overflow/overlap.
**Depth:** All prior fixes survive (engagement-gated modal, self-hosted MapLibre, short bar labels, native share, SEO tags).

### AC-15, Default continent + first impression
**Description:** A defined default continent loads on first visit (decision: Europe/status-quo unless geo-detection is chosen, resolve in annotation). OG/meta tags remain correct; "Prototype · A project of The Collective" framing intact above the switcher.
**Setup:** server running.
**Verify:** Fresh load (cleared storage) shows the chosen default continent; meta/canonical/JSON-LD unchanged; banner + eyebrow framing present.
**Depth:** If geo-detection is chosen, it degrades gracefully to the default when geo is unavailable; no layout shift on switcher mount.

---

**Self-ask (laziness test):** Could someone satisfy these with maximum laziness and I'd be happy? The risk points are AC-3 (miss the inline details builder), AC-7 (re-clip empty ecovillages instead of a real NA pull), and AC-9 (populate fields with fabricated/duplicated numbers). The Depth fields explicitly close those, and AC-9's real-data bar is enforced by human verification, not just a field-presence check.
