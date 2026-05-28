# Plan — Usability Upgrade

## Goal
Turn the live filtering dashboard (20 regions, EU + NA) into a guided decision path (arrive → orient → filter → decide → act) for first-time visitors and prospective settlers, with four additive features that never introduce scoring, weighting, or ranking.

## Architecture approach

**Chosen: additive vanilla-JS modules layered on the existing render/refresh pipeline.** All four features hook into already-mapped functions (`regionPasses`, `renderSummaryTable`, `refreshAll`, the URL machinery, the modal pattern). No build step, no framework, no data-model rewrite. State extends `state` with `state.shortlist` (Set) and reuses `state.thresholds`.

Alternatives considered and rejected:
- *Separate SPA / framework introduction* — overkill, breaks the "no build step" property, throws away the working pipeline. Rejected.
- *Server-side personalization* — there is no server; the site is static on Vercel. Rejected.
- *Wildcard: encode everything in one opaque hash param* — worse shareability + debuggability than the readable `?t.*` / `?pin=` scheme already in place. Rejected; keep human-readable URL state.

## Components & files

All edits are to existing files plus two new data files. Every JS change bumps the cache-bust `?v=na2` → `?v=usab1` at all occurrences.

### Files to MODIFY
- `prototype/src/main.js` — add: preset definitions + chip render/handlers; `state.shortlist` + star toggle + `applyShortlistFromURL`/`writeShortlistToURL`; drawer open/render/close; compare-view render (reuse `renderSummaryTable` scoped to shortlist); next-step row update inside `refreshAll`; em-dash purge in status copy. Bump every `?v=` import.
- `prototype/index.html` — add: preset-chip container near `#crit-grid`; onboarding cue line; star button markup hook in cards (added via JS, but CSS here); drawer + overlay markup + CSS (mobile slide-up at ≤390px); shortlist affordance + compare panel container; next-step row markup in `.match-bar`; `:not(.continent-tab)`-style exclusion extended to any new continent-tagged control; bump `<script ... ?v=usab1>`.
- `prototype/deeper.html` — no change required (drawer deep-links to existing anchors). Verify anchors `#alentejo`/`#connemara`/`#transylvania` resolve.

### Files to CREATE
- `prototype/data/region-depth.js` — shipped depth data: the 3 case-study entries only (`{caseStudy:'#alentejo'}` etc.). Drawer reads from here. Ships in Phase 1.
- `prototype/data/region-depth.staging.js` — the 17 synthesized "what living here asks of you" summaries (`{asks, source, sourceUrl}` per region id), STAGED for human dossier-match review, gitignored from deploy via `.vercelignore`. NOT wired to the live drawer until verified.

## Data model (drawer depth)
```js
// region-depth.js (shipped)
export const regionDepth = {
  alentejo:     { caseStudy: '#alentejo' },
  connemara:    { caseStudy: '#connemara' },
  transylvania: { caseStudy: '#transylvania' },
};
```
Drawer logic: entry has `caseStudy` → render "Read the full case study →" deep-link to `deeper.html{anchor}`. Entry has `asks` → render the prose + source line. No entry → render values + per-cell sources only (no empty "asks" section). This lets Phase 1 ship cleanly and Phase 2 content drop in after verification by copying staging → live + bumping `?v=`.

## Presets (filtering combinations, framed as starting points)
Each preset sets a subset of `state.thresholds`; all sliders remain adjustable after. Copy says "starting point — adjust freely", never "recommended/best".
- **Off-grid self-sufficiency:** high solar_pv, low water_stress, low population.
- **Climate refuge (cool & wet):** cooler climate, low water_stress, recovering forest_change.
- **Affordable & remote:** low population, regen_network low-OK.
- **High solar, dry-tolerant:** high solar_pv.
Each chip exposes (hover/aria) exactly which thresholds it sets. Setting a preset writes to `?t.*` (shareable for free).

## Ordering / dependencies
1. **Preset chips + onboarding cue** (independent; touches threshold state only).
2. **Drawer shell** (reads regions.js values + region-depth.js; independent).
3. **Star/shortlist + compare** (depends on drawer for "open region" affordance reuse, and on `renderSummaryTable`; adds `?pin=`).
4. **Next-step row** (depends on 2 + 3 — its actions open the drawer and reference shortlist; rides `refreshAll`).
5. **Em-dash purge** (independent cleanup; do alongside).
6. **Cache-bust bump** (last, once all JS settled).
Phase 2 content (17 summaries) is independent of all engineering and runs in parallel via subagents.

## Verification criteria (per step)
- Presets: clicking a chip moves the named sliders to the named values and `refreshAll` reflects the new passing set; URL gains `?t.*`; sliders still draggable after.
- Drawer: clicking a card opens a panel showing 8 values + sources; case-study regions show a working deep-link; opens/closes; at 390px it is a bottom sheet; `getComputedStyle(panel).display !== 'none'` when open.
- Shortlist: star toggles persist into `?pin=`; compare view shows ONLY starred regions, neutral order; reload with `?pin=` restores stars.
- Next-step row: appears when ≥1 region passes; "Share this view" copies URL incl. `?t.*`+`?pin=`+continent; "What they ask of you" opens first passing region's drawer.
- Cross-cutting: EU and NA both intact (switch continents, both render, off-continent controls hidden but switcher visible); no console errors; `grep -nE 'score|weight|rank' main.js` shows no new scoring logic; 0 em-dashes site-wide.

## Does NOT include
- No composite score, weighting UI, or ranked ordering anywhere (hard framework rule).
- No shipping of the 17 synthesized summaries to prod (staged for human verify only).
- No changes to the data pipeline (Python scripts), map layers, or criterion set.
- No new case studies in deeper.html for the 17 (deferred; drawer prose is the lightweight substitute).
- No account/login/persistence beyond URL state.

## Milestones (~30 min each)
- M1: Preset chips + onboarding cue.
- M2: Region detail drawer (values + sources + case-study deep-links) + mobile sheet.
- M3: Star/shortlist + `?pin=` URL + compare view.
- M4: Next-step row + em-dash purge + cache-bust bump.
- M5: Hard local verification (Playwright getComputedStyle + screenshots + 390px + EU/NA + framework grep) → fix → prod deploy → live verify.
- M6 (parallel): 17 region summaries synthesized from dossiers → `region-depth.staging.js` (staged, not shipped).
