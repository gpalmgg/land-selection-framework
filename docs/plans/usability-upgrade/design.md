# Usability Upgrade — Design (validated)

**Status:** validated design (brainstorm output). Next: `/deep-plan @docs/plans/usability-upgrade/design.md`.
**Date:** 2026-05-27
**Owner framing:** "Get the prototype to be more usable for people." Validated audience + scope below. Full power: all four moves.

---

## 1. Goal

Turn the live prototype (land-selection-framework.vercel.app, 20 regions across Europe + North America, threshold sliders, map, criteria cards, summary table, deeper.html) from a *data dashboard* into a *guided path*: **arrive → orient → filter → decide → act.** Serve two composed audiences: **first-time visitors** (instant comprehension) and **prospective settlers** (decision-support that leads somewhere).

## 2. The non-negotiable constraint (carried from the project)

**No composite scoring, weighting, or ranking — ever.** Every feature here stays threshold-*filtering* only. Specifically:
- **Presets** are pre-set threshold combinations (filtering), framed as adjustable *starting points*, never "recommendations" or "best fit."
- **Shortlist** is a user-starred set; **compare** shows those side-by-side (like the summary table). Neutral order — NOT ranked by a score or by "thresholds passed."
- **Region depth** is qualitative practitioner context (incl. legal/economic, which is already dossier-only).
- Native units, source+vintage preserved throughout. This is the credibility bar the site passed an audit on.

## 3. The four components

### 3.1 Guided onboarding + scenario presets *(comprehension)*
- **Inline preset chips** near the criteria section. Each sets the threshold sliders to a meaningful combination and is fully adjustable after. Candidate presets (final copy in plan): "Off-grid self-sufficiency" (high solar, low water stress, low population), "Climate refuge: cool & wet" (cooler climate, low water stress, recovering forest), "Affordable & remote" (low population, sparse-OK regen), "High solar, dry-tolerant" (high solar). Each chip shows, on hover/expand, exactly which thresholds it sets — transparency, no hidden composite.
- A one-line orienting cue ("New here? Start with a scenario, then adjust.") + keep the existing "filters, never scores" line.
- **Chosen approach:** inline chips, NOT a second overlay (a signup modal already exists; another would smother the high-traffic first impression). Rejected: first-visit coachmark (intrusive), dedicated intro flow page (adds a hop).
- Presets write to the existing URL threshold state, so a preset view is shareable for free.

### 3.2 Depth on every region — "what living here asks of you" *(decision-support)*
- A **region detail drawer/panel**: clicking a region card (or its map marker) opens a panel showing the region's 8 criterion values + per-cell sources + a concise (2–4 sentence) **"what living here asks of you"** practitioner summary.
- **Content source:** synthesized from the dossiers we already have (`data/research-dossier/<id>/` — practitioner-relevant-nuance paragraphs + legal.md), for all 20 regions. The 3 EU regions with full case studies (Alentejo, Connemara, Transylvania) deep-link to deeper.html. The other 17 get a freshly-synthesized short summary (parallel research/synthesis agents drawing on existing dossiers — low risk, data exists).
- **Chosen approach:** detail drawer. Rejected: inline card expansion (cramped, breaks the grid), extending deeper.html case studies to all 20 (a separate page is less usable mid-decision).
- Drawer stays framework-legal: shows values + qualitative context, no score.

### 3.3 Shortlist & compare *(decision-support)*
- **Star/pin** control on each region card + map marker. A persistent "**Your shortlist (N)**" affordance opens a focused compare view = the existing summary-table component scoped to just the starred regions.
- **URL-encoded** shortlist (e.g. `?pin=cascadia,alentejo,...`) so it's shareable and consistent with how thresholds already persist.
- **Neutral order** (selection order or alphabetical) — explicitly NOT ranked.

### 3.4 Actionable next step on results *(close the loop)*
- On the match bar, when regions pass the active thresholds: a contextual next-step row — *"N regions meet your criteria → [What they ask of you] · [Share this view] · [Talk to The Collective]."*
- "Share this view" rides the existing URL state (thresholds + shortlist + continent). "Talk to The Collective" = existing contact (gustaf@islands-of-coherence.com). "What they ask of you" opens the first passing region's drawer (3.2).

## 4. Build staging (phaseable; all four are in scope)

- **Phase 1 — engineering + comprehension + flow (all-mechanical, fast):** preset chips + onboarding cue (3.1), star/shortlist + compare view + URL encoding (3.3), actionable next-step row (3.4), and the empty drawer shell (3.2 structure, values + sources, deep-link for the 3 case studies). Ships usable immediately.
- **Phase 2 — the depth content marathon:** synthesize "what living here asks of you" for the other 17 regions from existing dossiers; populate the drawer. Verified before shipping (human check that summaries match dossiers — same data-honesty bar).

## 5. Architecture notes (for the plan to detail)

- Vanilla JS, no build step; mirror existing patterns in `src/main.js` + `index.html` inline module. Reuse `renderSummaryTable` for the compare view. Reuse the URL state machinery (`applyThresholdsFromURL`/`writeThresholdsToURL`) for presets + shortlist.
- Region depth content lives as data (e.g. a `region.asks` field or a parallel `data/region-depth.js`), sourced from dossiers, source-attributed.
- Drawer + chips + star are continent-aware (work for both EU and NA via the existing `data-continent` machinery).
- Cache-bust: bump `?v=` on the module graph when shipping (the lesson from this session).

## 6. Risks / open questions (for the plan)

1. **Preset framing** must not read as "recommended places" — copy + UI must say "starting point, adjust freely." Discipline risk.
2. **Drawer vs. mobile** — the panel must work at 390px (slide-up sheet on mobile).
3. **Shortlist + threshold + continent in one URL** — keep the share-link scheme clean and backward-compatible with existing `?t.*` links.
4. **Content load** — 17 region summaries is real synthesis work; batch + human-verify like the NA dossiers. No fabrication.
5. **First-impression regression** — onboarding additions must not bury the hero or slow first paint; EU/NA experience must stay intact.

## 7. Success criteria

- A first-time visitor can grasp what the tool is and make a meaningful first filter in one click (a preset).
- A settler can open any of the 20 regions and read what living there asks of them, star a shortlist, compare them, and reach a real next step — all without the framework ever collapsing a place into a score.
- EU + NA experiences unchanged except for the additive features; mobile clean; framework discipline intact; no fabricated depth content.

## 8. Portable pattern

The durable asset is the **guided-decision flow** (orient → filter → understand → shortlist → act) layered on a filtering-not-scoring tool — reusable for any criteria-based decision aid. The wiring (vanilla JS, this URL scheme) is Tied; the flow + the discipline of keeping it score-free is Portable.
