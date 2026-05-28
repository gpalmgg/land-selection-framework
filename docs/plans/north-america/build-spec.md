# North America Expansion, Build Spec (Technical Plan, regenerable from PRD)

Tasks in dependency order, grouped into shippable batches. Tool tags: `[subagent]` bite-sized, `[subagent-dd]` subagent-driven-dev (high-fidelity), `[bash]` script run, `[research-agents]` parallel research, `[human]` verification gate.

> Verify-before-ship: each batch is locally verified (server + Playwright) and, for data batches, human-verified against dossiers before deploy. No placeholder data goes live.

## Batch 0, Engineering scaffold (no visitor-facing change; EU stays identical)

- [ ] **T1** `[subagent]` Add `continent: 'europe'` to all 10 EU region objects in `prototype/data/regions.js`., Files: regions.js. Satisfies: AC-1. Depends on: none. Notes: additive only; do not touch ids/values/criteria.
- [ ] **T2** `[subagent]` Add `CONTINENTS` config + `state.continent` (`main.js:7`); drive map `center/zoom` from `CONTINENTS[activeContinent]` (`main.js:220–223`)., Files: main.js. Satisfies: AC-4. Depends on: T1.
- [ ] **T3** `[subagent-dd]` Continent-scope EVERY render surface + the two easily-missed consumers. Tag rendered nodes with `data-continent`; scope via `body[data-continent=...]` (render-both-toggle). Insertion points (from research.md): marker loop `:390`, `renderRegionGrid:466`, bar-rows `:536`, summary header `:589`/body `:606`, `refreshAll` loops `:650–740`, `pickOgImagePath:154`; index.html inline `<details>` builder `:1499` + counts `:1495`/`:1269`., Files: main.js, index.html. Satisfies: AC-3, AC-6. Depends on: T1, T2. Notes: HIGH-FIDELITY, missing one consumer = silent NA data gap. Use subagent-driven-dev; verify all 12 points.
- [ ] **T4** `[subagent]` Continent switcher: markup mount at `.map-wrap` (`index.html:1250`), CSS (editorial, mobile-safe), `initContinentSwitcher()` setting `state.continent` + `body[data-continent]` + aria state; thresholds untouched on switch (AC-5 falls out of render-both-toggle)., Files: index.html, main.js. Satisfies: AC-2, AC-5. Depends on: T3.
- [ ] **T5** `[subagent]` Map markers: add for all regions, toggle marker-element visibility by continent on switch; `flyTo(CONTINENTS[c])` on switch., Files: main.js. Satisfies: AC-4, AC-6. Depends on: T2, T4.
- [ ] **VERIFY-0** `[human]`+Playwright: EU identical to prod; switcher works; switch is idempotent; thresholds persist; mobile clean. Satisfies: AC-1,2,3,4,5,6,14(partial). → **Deploy** (EU-only visible; NA tab present but empty until data lands, or hide NA tab until Batch 2, decide in annotation).

## Batch M1, NA map layers

- [ ] **T6** `[subagent]` Parameterise `process_aqueduct.py`, `process_aqueduct_depletion.py`, `process_vectors.py`: bbox → arg/constant per continent; output filenames suffixed (`-na`). Keep EU outputs intact., Files: prototype/scripts/*. Satisfies: AC-8. Depends on: none.
- [ ] **T7** `[subagent]` New `prototype/scripts/fetch_ecovillages_na.py`, Overpass query for NA intentional-community/permaculture/ecovillage POIs → raw → processed `ecovillages-na.geojson`. Satisfies: AC-7, AC-8. Depends on: none.
- [ ] **T8** `[bash]` Run scripts for NA bbox (venv) → `water-stress-na.geojson`, `water-depletion-na.geojson`, `conflict-na.geojson`, `ecovillages-na.geojson` in `data/processed/`. Satisfies: AC-7. Depends on: T6, T7.
- [ ] **T9** `[subagent]` Wire NA layer sources in `initMap` + `renderMapToggles`; layers continent-scoped (NA layers only visible in NA view)., Files: main.js. Satisfies: AC-7. Depends on: T5, T8.
- [ ] **VERIFY-M1** Playwright: NA view shows non-empty ecovillage layer + NA water polygons; EU layers unchanged. Satisfies: AC-7,8.

## Batch M2–M4, Data (the marathon; parallel research → compile → human-verify → ship)

- [ ] **T10** `[research-agents]` Dossier research, one agent per NA region (10 agents, parallelizable in waves of ~3–4). Each produces 8 dimension files under `data/research-dossier/<id>/` with real citations from the documented datasets + national sources, following the European dossier template. Satisfies: AC-10. Depends on: none. Notes: this is the bulk of effort; agents return structured dossiers, NOT regions.js edits.
- [ ] **T11** `[subagent]` Compile verified dossiers → `regions.js` NA region objects + `values` blocks, one batch at a time (Batch 2: Cascadia, N. New Mexico, Oaxaca; Batch 3: Vermont, S. Appalachians, Driftless, Ozarks; Batch 4: Nova Scotia, Kootenays, Québec Eastern Townships). Each region: 8 cells × {value,unit,vintage,label,source,sourceUrl}, native units. Satisfies: AC-9, AC-11. Depends on: T10 (for that region), VERIFY-0.
- [ ] **VERIFY-M2/3/4** `[human]` Gustaf/Collective verifies each batch's values against dossiers (the gate AC-9/AC-11 require). Programmatic check: all fields present, no cross-region duplicate values (except conflict=0). → **Deploy** per batch only after human sign-off.

## Batch M5, Content reconciliation

- [ ] **T12** `[subagent]` `deeper.html`: correct singular-continent counts (`:644`), extend bibliography "Used for" with NA, add NA acknowledgment/case-study framing. Preserve version ladder + Collective framing. Satisfies: AC-12.
- [ ] **T13** `[subagent-dd]` Final discipline + regression sweep: grep main.js (no scoring/weight added; `regionPasses` pure); EU regression diff; mobile both continents; default continent (AC-15) + OG/meta intact. Satisfies: AC-13, AC-14, AC-15.
- [ ] **VERIFY-M5** Full pass → **Deploy**.

## Parallelization map
- Batch 0: T1→T2→T3→{T4,T5} (T4/T5 after T3).
- Batch M1 runs **in parallel with Batch 0** (scripts/data independent of render code), T6, T7 fully parallel; T8 after both; T9 after T5+T8.
- T10 (dossier research, 10 agents) can start **immediately, in parallel with all engineering**, it's pure research, no code dependency. This is the long pole; start it first.
- T11/verify are sequential per batch (human gate).

## Projected proof-gate note
No tier-manifest.yaml present (prototype repo) → proof gates skipped (graceful degradation). This is a real code+data build (not a spec-build): ~5 modified source files, 4 new geojsons, 1 new script, 80 dossier files, NA data blocks. Code-to-doc ratio healthy.

## Tool routing summary
- Heavy parallel research → `[research-agents]` (T10), the marathon.
- High-fidelity render-scoping + final sweep → `[subagent-dd]` (T3, T13).
- Mechanical edits/wiring → `[subagent]`.
- Script runs → `[bash]`.
- Data correctness → `[human]` gate (cannot be auto-verified, see test-plan).
