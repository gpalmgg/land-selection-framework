# Build Spec — Usability Upgrade

Tasks for `/build`. Engineering tasks are integration-sensitive (shared state, continent machinery, framework discipline) → executed directly by the main agent in a single coherent pass, NOT fanned out (a subagent editing one feature in isolation risks drifting the shared `state`/URL scheme). Content synthesis IS independent → parallel subagents.

Cache-bust: bump `?v=na2` → `?v=usab1` everywhere as the final engineering step (T-7).

## Group A — Phase 1 engineering (sequential, main agent; integration-sensitive)

- [ ] **T-1 [subagent] Preset chips + onboarding cue.** Define `PRESETS` (4 entries, each = `{label, sets:{critId:value,...}, hint}`) in main.js. Render a chip row mounted near `#crit-grid` (markup + CSS in index.html). Click handler sets `state.thresholds` for the named criteria, updates the matching sliders' values, calls `refreshAll()` + `writeThresholdsToURL()`. Add the onboarding cue line. Keep "filters not scores" line. Chips expose set-thresholds via title/aria. No score computed.
  - Files: src/main.js, index.html
  - Satisfies: AC-1, AC-2
  - Depends on: none
  - Notes: framework-critical — presets only set thresholds. Continent-aware safe.

- [ ] **T-2 [subagent] Region detail drawer (shell + values + sources + deep-links).** Create `data/region-depth.js` (3 case-study entries only). Add drawer + overlay markup + CSS to index.html (desktop side panel; ≤390px bottom slide-up sheet). In main.js: `openDrawer(regionId)` renders 8 criteria (value/unit/vintage/source from `regions.js` values) + branches on `regionDepth[id]` (`caseStudy`→deep-link, `asks`→prose+source, absent→omit section); `closeDrawer()` restores scroll/focus. Wire card click + marker click to `openDrawer`. Import `region-depth.js` with `?v=usab1`.
  - Files: src/main.js, index.html, data/region-depth.js (new)
  - Satisfies: AC-3, AC-4
  - Depends on: none
  - Notes: reuse modal open/close pattern. Verify deeper.html anchors resolve. EU + NA both.

- [ ] **T-3 [subagent] Star/shortlist + ?pin= URL.** Add `state.shortlist = new Set()`. Add star control to each card (and marker) via render; `toggleStar(regionId)` updates the Set, the star visual, and the "Your shortlist (N)" affordance; stops propagation so it doesn't open the drawer. `applyShortlistFromURL()` on boot + `writeShortlistToURL()` (replaceState + debounce) writing `?pin=id,id`. Ignore unknown ids gracefully. Backward-compatible with `?t.*`-only links.
  - Files: src/main.js, index.html
  - Satisfies: AC-5, AC-6
  - Depends on: T-2 (drawer must exist so star event-isolation is testable)
  - Notes: cross-continent shortlist allowed. No ranking.

- [ ] **T-4 [subagent] Compare view (reuse summary table, neutral order).** Add a compare panel container + open/close. `renderCompare()` reuses `renderSummaryTable` logic scoped to `state.shortlist` (selection or alphabetical order — pick one, document it). Empty-state message when shortlist empty. Handle cross-continent starred sets.
  - Files: src/main.js, index.html
  - Satisfies: AC-7
  - Depends on: T-3
  - Notes: NEUTRAL ORDER — never sort by value/pass-count. Framework-critical.

- [ ] **T-5 [subagent] Next-step row on match bar.** Inside `refreshAll()`, render/update a next-step row in `.match-bar`: "What they ask of you" (opens first passing region's drawer), "Share this view" (copies full URL incl. `?t.*`+`?pin=`+continent, with copied feedback), "Talk to The Collective" (mailto hello@islands-of-coherence.com). Hide or show loosen-hint when 0 pass.
  - Files: src/main.js, index.html
  - Satisfies: AC-8
  - Depends on: T-2, T-3
  - Notes: phrase as "N regions meet your criteria" — no "best match". Reuse share-feedback pattern.

- [ ] **T-6 [subagent] Em-dash purge.** Replace em-dashes in `#match-detail` status copy (main.js ~782-788) and scan all shipped files; replace with comma/period per context (never en-dash).
  - Files: src/main.js, index.html, data/regions.js, data/region-depth.js
  - Satisfies: AC-11 (em-dash portion)
  - Depends on: T-1..T-5 (purge after copy settles)

- [ ] **T-7 [subagent] Cache-bust bump.** Bump every `?v=na2` → `?v=usab1`: index.html script src, main.js style.json + geojson loads, the new region-depth.js import.
  - Files: src/main.js, index.html
  - Satisfies: AC-11 (cache-bust portion)
  - Depends on: T-1..T-6 (last, once JS settled)

## Group B — Phase 1 verification + ship (main agent)

- [ ] **T-8 [subagent] Hard local verification.** Start `python3 -m http.server 8770 --directory prototype`. Playwright: navigate, screenshot EU, exercise each feature, assert `getComputedStyle().display` for drawer/chips/next-step/switcher, switch to NA and re-test all four features, resize 390px and screenshot, read console for errors. Run framework grep (AC-9) + em-dash/cache grep (AC-11). Fix any failures, re-verify. Do NOT proceed to deploy until all Phase-1 ACs (AC-1..AC-11) pass with computed-visibility + screenshot evidence.
  - Files: (none — verification)
  - Satisfies: AC-9, AC-10, AC-11 (live check)
  - Depends on: T-1..T-7

- [ ] **T-9 [subagent] Deploy Phase 1 to prod + verify live.** `vercel deploy --prod --yes --cwd /Users/gustafpalm/Projects/land-selection-framework/prototype`. Then curl + Playwright the live URL: confirm bumped `?v=usab1` served, all four features work live, EU+NA intact, no console errors. Confirm `.vercelignore` excluded `region-depth.staging.js`.
  - Files: (none — deploy)
  - Satisfies: ship gate
  - Depends on: T-8 PASS

## Group C — Phase 2 content (PARALLEL subagents; staged, not shipped)

- [ ] **T-10 [ralphy --parallel] Synthesize 17 region summaries → staging.** Dispatch parallel subagents (batched), each reads a region's `legal.md` + `regen.md` + `climate.md` and drafts a 2-4 sentence "what living here asks of you" summary + source + sourceUrl + `_dossierBasis` note. Compile into `data/region-depth.staging.js` (ES module, 17 entries, em-dash-free). Add `region-depth.staging.js` to `.vercelignore`. Do NOT wire into live drawer.
  - Files: data/region-depth.staging.js (new), .vercelignore
  - Satisfies: AC-12
  - Depends on: none (parallel with Group A)
  - Notes: ZERO fabrication — every claim traceable to a dossier line. Practitioner-honest tone. Human verify before any ship.

## Projected proof-gate metrics (Standard tier — informational)
- Non-doc files touched: 4 (main.js, index.html, region-depth.js, region-depth.staging.js) + .vercelignore. Well above doc-only.
- Code-to-doc ratio: high (engineering build, 4 planning docs).
- No forge sessions required (Standard tier).

## Tool routing note
All engineering tagged `[subagent]` = executed directly by the main agent (autonomous /summon run) because the four features share `state`, the URL scheme, and the continent machinery; isolation would cause integration drift. Content (T-10) is genuinely independent → parallel subagents.
