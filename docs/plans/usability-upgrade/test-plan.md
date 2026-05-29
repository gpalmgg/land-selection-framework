# Test Plan — Usability Upgrade

Deliverable type: **web app + behavior** (vanilla JS static site). Verification is browser-driven (Playwright) + static grep. **Hard rule from this project's history: assert `getComputedStyle().display` + screenshots, never DOM presence alone** (DOM-only checks gave false "it works" twice).

## Smoke test (< 60s)
```bash
python3 -m http.server 8770 --bind 127.0.0.1 --directory /Users/gustafpalm/Projects/land-selection-framework/prototype
# Playwright: navigate http://127.0.0.1:8770/ ; expect 0 console errors; screenshot;
# assert preset chip row visible (getComputedStyle.display !== 'none'); click a chip; #match-count changes.
```
Alive = page loads, chips render, a chip click re-filters. If this fails, stop.

---

## Group 1 — UI features (shared setup: local server)
**Setup:**
```bash
python3 -m http.server 8770 --bind 127.0.0.1 --directory /Users/gustafpalm/Projects/land-selection-framework/prototype
# open http://127.0.0.1:8770/
```
**Teardown:** kill the http.server process.

- **AC-1 presets** — Action: click "High solar, dry-tolerant"; Expected: solar_pv slider jumps high, #match-count updates, sliders still draggable after. Edge (Depth): hover a chip → title/aria lists exact thresholds; URL gains `?t.solar_pv=...`; copy says "starting point/adjust", no "recommended/best"; no numeric score shown.
- **AC-2 onboarding cue** — Action: load; Expected: cue line visible near chips, "filters not scores" line present. Edge: at 1280px width hero+map not pushed below fold; 0 em-dashes in cue.
- **AC-3 drawer values** — Action: click Alentejo card; Expected: drawer visible (computed display), 8 criteria w/ value+unit+source; close → hidden; click a marker → opens. Edge: opens for an NA region too; scroll restored on close; all 8 criteria read from regions.js.
- **AC-4 drawer deep-links / asks branch** — Action: open Alentejo → "Read the full case study →" links to deeper.html#alentejo and navigates; open Cascadia → no empty "asks" section. Edge: #connemara + #transylvania anchors resolve; region-depth.js imports with no console error.
- **AC-5 star/shortlist** — Action: star Cascadia + Vermont → "Your shortlist (2)"; unstar Cascadia → "(1)". Edge: starring does NOT open the drawer (event isolation); star visual reflects state; star an EU + an NA region (cross-continent allowed).
- **AC-6 ?pin= persistence** — Action: star Cascadia+Alentejo → URL `?pin=cascadia,alentejo`; open URL in fresh tab → both starred, "(2)". Edge: prior `?t.*` survives alongside `?pin=`; a `?t.*`-only link still works; unknown id in `?pin=` ignored, no error.
- **AC-7 compare** — Action: star 3, open compare → table with exactly those 3 columns × 8 rows, values populated; 0 starred → empty-state message not broken table. Edge: order is neutral (selection/alpha), NOT by value/pass-count; cross-continent starred shown together; closing compare restores main view.
- **AC-8 next-step row** — Action: default thresholds → row visible (computed display); "Share this view" → clipboard has URL incl. `?t.*`+`?pin=`+continent + copied feedback; "What they ask of you" → first passing region's drawer opens; filter to 0 pass → row hides or shows loosen-hint. Edge: "Talk to The Collective" = mailto gustaf@islands-of-coherence.com; phrasing "N regions meet your criteria", no "best match".
- **AC-10 EU+NA + mobile** — Action: screenshot EU; switch to NA → NA renders, EU hidden, switcher tab visible (computed display !== none); run drawer+star+compare on NA; resize 390px → drawer = bottom sheet, chips wrap, no horizontal overflow; console 0 errors across flow. Edge: every new data-continent control either excluded from hide-rule or stays visible.

## Group 2 — Static analysis (setup: none)
**Setup:** none. **Teardown:** none.
- **AC-9 no scoring** — Action: `grep -nEi 'score|weight|rank|sort.*by.*value|best.?fit|top.?pick' prototype/src/main.js`; Expected: no NEW scoring/ranking (pre-existing rampColor excused); manual read confirms presets set thresholds, shortlist is a Set, compare neutral-order, next-step counts passing. Edge: `regionPasses` still pure boolean.
- **AC-11 cache-bust + em-dash** — Action: `grep -rn 'v=na2' prototype/` (shipped files) → none; `grep -rn 'v=usab1' prototype/index.html prototype/src/main.js` → present; `grep -rn '—' prototype/index.html prototype/src/main.js prototype/data/regions.js prototype/data/region-depth.js` → 0. Edge: live page loads bumped version, no import 404.
- **AC-12 staged content** — Action: `node -e "import('./prototype/data/region-depth.staging.js').then(m=>console.log(Object.keys(m.regionDepth||m.default).length))"` (or syntax check) → 17 entries with correct ids; each has asks+source+sourceUrl+_dossierBasis; `.vercelignore` lists region-depth.staging.js; live `region-depth.js` has only 3 case-study entries. Edge: staging file em-dash-free; summaries name hard parts (not promotional).

## Browser tests (Playwright, post-deploy live check)
- Navigate live URL → screenshot; assert `?v=usab1` served (Network); 0 console errors.
- Exercise all four features live on EU and NA; screenshot each.
- 390px live screenshot.

## What cannot be tested automatically (needs Gustaf's judgment)
- **Phase 2 content accuracy** — whether each of the 17 "asks" summaries faithfully reflects its dossier and reads true to a practitioner. This is the explicit human gate; the staged file carries `_dossierBasis` notes to make the check fast. **Nothing ships until Gustaf verifies.**
- **Preset usefulness** — whether the 4 scenario presets are the *right* starting points for real settlers (vs framework-legal but unhelpful).
- **Drawer prose voice** — whether the case-study deep-link framing and "asks" tone land emotionally.
- **First-impression feel** — whether the onboarding cue + chips genuinely make the tool graspable in one click for a true first-timer.
