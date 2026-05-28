# North America build — RESUME (paused 2026-05-26)

Paused mid-build to conserve usage. **Nothing deployed. Live site untouched.** All work below is local-only.

## Where we stopped

**Batch 0 scaffold (T1–T5): edited locally, NOT verified, NOT deployed.**
- `data/regions.js` — added `continent: 'europe'` to all 10 EU regions (verified: 10 inserts). Syntax OK.
- `src/main.js` — added `CONTINENTS` config + `DEFAULT_CONTINENT` + `continentsPresent()`; `state.continent`; `activeRegions()` helper; map center/zoom/minZoom/maxZoom now read from `CONTINENTS[state.continent]`; `data-continent` tags on markers / region cards / bar rows / summary th+td; `refreshAll` counts + match-total + slider-hint use `activeRegions()`; `pickOgImagePath` continent-scoped; new `setContinent()` + `initContinentSwitcher()` (render-both-and-toggle, fires `lsf:continentchange`); boot sets `body.dataset.continent` + calls `initContinentSwitcher()`. Syntax OK (node --check passed).
- `index.html` — `<div id="continent-switcher" hidden>` mount before `.map-wrap`; `.continent-switcher`/`.continent-tab` CSS + the `body[data-continent]` show/hide rule; `<span id="match-total">`; inline `<details>` builder now tags each `<li>` with `data-continent`, count is dynamic, listens for `lsf:continentchange`.

**Architecture:** render-both-and-toggle (per plan.md). All regions render once, tagged `data-continent`; CSS `body[data-continent="X"]` hides the other continent. Switcher only appears when >1 continent has data — so with EU-only data it stays hidden and the live experience is byte-identical (this IS the "NA tab hidden until data" locked decision, implemented data-drivenly).

## VERIFY-0 — NOT DONE (blocker)
Playwright MCP can't launch: profile lock ("Opening in existing browser session") from a Chrome-for-Testing instance + `~/Library/Caches/ms-playwright/mcp-chromium-3812ddb`. On resume: ensure no Chrome-for-Testing is running and the lock dir is clear, or verify via a fresh user-data-dir. Syntax is checked; behavioral verify (EU identical, switcher infra, idempotent switch, mobile 390px) still owed. Mechanism test idea: temporarily add a fake NA region locally to confirm 2 tabs render + toggle, then remove.

## Research (T10): ✅ 10/10 dossiers on disk
`data/research-dossier/<id>/` with 8 files each. IDs: `cascadia`, `vermont`, `southern-appalachians`, `driftless`, `ozarks`, `northern-new-mexico`, `nova-scotia`, `kootenays`, `quebec-eastern-townships`, `oaxaca`.

**HONESTY FLAGS (must clear human-verification gate before any value ships):**
- Confidence uneven. Many agents could NOT pixel-query primary rasters (WorldClim/SoilGrids/GFW) and triangulated → several med/low-confidence cells.
- Explicit UNVERIFIED: Oaxaca `forest_change` (GFW dynamic dashboard, needs direct query); Oaxaca `conflict` (used ACLED proxy ~99 events, UCDP-within-200km not directly pulled — needs care).
- `forest_change` low-confidence across most regions (decadal %/decade rarely pixel-extracted; often inferred from state/national FIA or arithmetic from GFW totals).

**RANGE-WIDENING needed at compile (regions.js criteria) — EU-tuned ranges break for NA:**
- `regen_network` ceiling 30 → raise (Cascadia 47; S. Appalachians 25+; Vermont 25–35).
- `solar_pv` ceiling 2000 → raise (N. New Mexico ~2100; Oaxaca ~2000).
- `forest_change` band −5..+5 → revisit (Nova Scotia ≈ −7/−9 /decade industrial forestry; Kootenays exceeds in peak fire years). Note: widening a range re-normalizes EU bars too — re-check EU visuals.
- `climate` 0–25 OK (Oaxaca ~20, within).

## Remaining (gated)
- T6–T9 NA map layers (parameterise Python scripts by bbox; fresh NA ecovillage Overpass pull; reprocess water+conflict; `-na` outputs; wire continent-scoped). Needs venv + network.
- T11 compile dossiers → regions.js NA blocks. **Human-gated:** Gustaf/Collective verify values vs dossiers + confirm final 10-region slate before any NA region goes live.
- T12 deeper.html NA coverage; T13 discipline/regression/mobile sweep.
- Deploy Batch 0 (EU-identical, NA hidden) was pending your go when we paused.

## To resume
`cd ~/Projects/land-selection-framework/prototype` → finish VERIFY-0 (clear Chrome lock first) → deploy Batch 0 if it passes → then T6–T9, then the human-gated data compile.
