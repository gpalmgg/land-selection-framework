# Usability Upgrade — Autonomous Build COMPLETE

**Mode:** autonomous (/summon-style). Boundary: Ship verified Phase 1 to prod; stage Phase 2 content for human review. DONE.

**Live:** https://land-selection-framework.vercel.app — Phase 1 deployed + verified 2026-05-27. Cache-bust `?v=usab1`.

## Checklist

- [x] Research (frontend surface + content feasibility) — both clean
- [x] research.md + plan.md + prd.md + build-spec.md + test-plan.md written
- [x] Phase 1: preset chips (4) + onboarding cue — AC-1, AC-2
- [x] Phase 1: region detail drawer (8 values + sources + case-study deep-links) — AC-3, AC-4
- [x] Phase 1: star/shortlist + compare view + ?pin= URL — AC-5, AC-6, AC-7
- [x] Phase 1: actionable next-step row on match bar — AC-8
- [x] Phase 1: em-dash purge (was 1, in a CSS comment) + cache-bust bump — AC-11
- [x] Phase 1 verify HARD (Playwright getComputedStyle + screenshots + 390px + EU/NA + framework grep) — AC-9, AC-10
- [x] Phase 1 deploy to prod + verify live (0 console errors, staging 404'd)
- [x] Phase 2: 17 region summaries drafted (4 parallel agents) → STAGED in data/region-depth.staging.js (NOT shipped) — AC-12
- [x] Final report

## Bug found + fixed during build
`writeThresholdsToURL` stripped trailing zeros with `/\.?0+$/`, mangling integer thresholds (1600 -> 16, which clamps to the slider floor on reload). Pre-existing; surfaced by presets writing round values every click. Fixed to only trim zeros in the fractional part. Verified live: preset writes `?t.solar_pv=1600`.

## AWAITING GUSTAF (the human gate by design)
The 17 `asks` summaries in `data/region-depth.staging.js` need a dossier-match check before shipping. Each carries `_dossierBasis`. To ship: move verified `{asks, source, sourceUrl}` entries into `data/region-depth.js`, bump `?v=`, redeploy. The drawer already renders them the moment they appear (the shell branches on entry shape).

## Files changed
- src/main.js (presets, shortlist, drawer, compare, next-step, URL-zero fix, boot wiring, import bump)
- index.html (cue + chips + shortlist btn + next-step markup, drawer + compare overlays, ~200 lines CSS, cache-bust x2, em-dash fix)
- data/region-depth.js (NEW, shipped, 3 case-study deep-links)
- data/region-depth.staging.js (NEW, staged, 17 summaries, gitignored from deploy)
- .vercelignore (+ region-depth.staging.js)
