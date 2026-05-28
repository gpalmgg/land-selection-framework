# PRD — Usability Upgrade (LOCKED on build)

Source of truth for `/build` and `/qc`. Framework rule overrides everything: **no scoring, weighting, or ranking — filtering only.** Native units + source+vintage preserved. Em-dash-free. Zero fabricated content shipped.

**Shared setup for all UI ACs:** `python3 -m http.server 8770 --bind 127.0.0.1 --directory /Users/gustafpalm/Projects/land-selection-framework/prototype` then open `http://127.0.0.1:8770/` (new port dodges stale ES-module cache). Where an AC says "Setup: shared server", this is it.

---

### AC-1 — Scenario preset chips set thresholds
- **Description:** A row of preset chips appears near the criteria/sliders section. Each chip, when clicked, sets a named subset of threshold sliders to a named combination. At least 4 presets: "Off-grid self-sufficiency", "Climate refuge (cool & wet)", "Affordable & remote", "High solar, dry-tolerant". After clicking, all sliders remain fully adjustable.
- **Setup:** shared server.
- **Verify:** Open page. Click "High solar, dry-tolerant". The solar_pv slider value jumps to a high value and the passing-region set (`#match-count`) updates. Then drag any slider — it still moves and re-filters. `getComputedStyle(chipRow).display !== 'none'`.
- **Depth:** Each chip must expose (title/aria-label) the exact thresholds it sets. Copy frames presets as "starting point, adjust freely" — NOT "recommended", "best fit", or "top pick". Setting a preset must write the resulting thresholds to the URL (`?t.*`). A preset only sets criteria it names; it must not silently reset unnamed criteria to defaults unless that is the named intent (document which). Chips must be continent-aware safe (if tagged data-continent, excluded from the hide-rule). No numeric score is computed or shown.

### AC-2 — Onboarding orienting cue
- **Description:** A one-line cue near the top of the interactive section orients first-time visitors (e.g., "New here? Start with a scenario, then adjust.") and the existing "filters, never scores" framing line is preserved.
- **Setup:** shared server.
- **Verify:** Load page; the cue text is visible above/near the preset chips; the "filters not scores" line still present (grep index.html).
- **Depth:** Must not push the hero or map below the fold on a 1280px-wide viewport (no first-paint regression). No em-dashes. Tone matches the practitioner voice (plain, non-marketing).

### AC-3 — Region detail drawer opens with values + sources
- **Description:** Clicking a region card (and its map marker) opens a detail drawer/panel showing that region's 8 criterion values with units, vintages, and per-cell source attribution.
- **Setup:** shared server.
- **Verify:** Click the Alentejo card. A drawer becomes visible (`getComputedStyle(drawer).display !== 'none'`) showing 8 criteria each with value+unit+source. Close it (close button or overlay click) and it hides. Click a map marker for a region — same drawer opens.
- **Depth:** Drawer must render all 8 criteria (climate, water_stress, soil_carbon, forest_change, solar_pv, conflict, regen_network, population) reading live from `regions.js` values (no hardcoded duplication). Source + vintage shown per cell, matching the existing source discipline. Drawer must trap nothing it shouldn't — page scroll restored on close, focus returns sensibly. Opens for BOTH EU and NA regions. No score/ranking shown.

### AC-4 — Drawer "what living here asks of you" + case-study deep-links
- **Description:** The drawer renders a "What living here asks of you" section driven by `data/region-depth.js`. For the 3 case-study regions (alentejo, connemara, transylvania) it shows a working deep-link to the deeper.html anchor. For regions with no depth entry, the section is omitted (no empty placeholder). Prose summaries for the other 17 are NOT shipped in Phase 1 (staged separately).
- **Setup:** shared server.
- **Verify:** Open Alentejo drawer → a "Read the full case study →" link points to `deeper.html#alentejo` and navigates there. Open a non-case-study region (e.g., Cascadia) → no empty "asks" section renders (drawer still shows values+sources). 
- **Depth:** Drawer logic branches on entry shape: `caseStudy` → deep-link; `asks` → prose + source line; absent → render nothing for that section. Deep-link href must resolve to a real anchor in deeper.html (verify `#alentejo`,`#connemara`,`#transylvania` exist). The data file must be import-clean (ES module, loads without console error). This is the shell that Phase-2 verified content drops into by adding `asks` entries.

### AC-5 — Star / shortlist control
- **Description:** Each region card (and map marker) has a star/pin control to add/remove the region from a shortlist. A persistent "Your shortlist (N)" affordance shows the count.
- **Setup:** shared server.
- **Verify:** Click the star on Cascadia and Vermont → "Your shortlist (2)" shows. Click Cascadia's star again → "(1)". Star state visually reflects membership (filled/empty).
- **Depth:** Shortlist backed by `state.shortlist` (a Set). Star toggle must not trigger the drawer (event isolation — stop propagation) and vice-versa. Star control continent-aware safe. Shortlist count reflects only the regions actually starred (cross-continent shortlist allowed — a user may star EU + NA regions). No ranking of the shortlist.

### AC-6 — Shortlist persists in URL (`?pin=`)
- **Description:** The shortlist is encoded in the URL as `?pin=<id>,<id>,...` alongside existing `?t.*` params; reloading restores the starred set.
- **Setup:** shared server.
- **Verify:** Star Cascadia + Alentejo. URL gains `?pin=cascadia,alentejo` (order = selection or alphabetical, documented). Copy the URL, open in a fresh tab → both show starred and "Your shortlist (2)". `?t.*` params from a prior filter must survive alongside `?pin=`.
- **Depth:** `applyShortlistFromURL()` on boot + `writeShortlistToURL()` on toggle (reuse the `replaceState` + debounce pattern from thresholds). Backward compatible: existing `?t.*`-only links must still work (no `?pin=` = empty shortlist). Invalid/unknown ids in `?pin=` are ignored gracefully, not errored. Encoding is human-readable (comma-joined ids), not opaque.

### AC-7 — Compare view (shortlist, neutral order)
- **Description:** The shortlist affordance opens a focused compare view = the summary-table component scoped to only the starred regions, in neutral (selection or alphabetical) order.
- **Setup:** shared server.
- **Verify:** Star 3 regions, open compare → a table shows exactly those 3 as columns, all 8 criteria as rows, values populated. With 0 starred, the compare view shows an empty-state message, not a broken/empty table.
- **Depth:** Reuse `renderSummaryTable` logic scoped to the starred set rather than duplicating it. **Neutral order only — explicitly NOT sorted by value, by "thresholds passed", or any score.** Columns must show source/vintage consistent with the main table. Compare must handle cross-continent shortlists (show EU + NA starred regions together). Closing compare returns to the main view intact.

### AC-8 — Actionable next-step row on match bar
- **Description:** When ≥1 region passes the active thresholds, a contextual next-step row appears on/near the match bar with: "What they ask of you" (opens first passing region's drawer), "Share this view" (copies the full URL), "Talk to The Collective" (existing contact hello@islands-of-coherence.com).
- **Setup:** shared server.
- **Verify:** With default thresholds (some regions pass), the row is visible (`getComputedStyle(row).display !== 'none'`). Click "Share this view" → clipboard contains the current URL including `?t.*`, `?pin=`, and continent. Click "What they ask of you" → the first passing region's drawer opens. Filter so 0 pass → the row hides or shows a "no matches, loosen a filter" hint (documented behavior).
- **Depth:** Row updates inside `refreshAll()` so it tracks the live passing set. "Share this view" must include all state (thresholds + shortlist + continent) and give copied-feedback (like the existing share button). "Talk to The Collective" uses the existing hello@ contact, not a fabricated address. No scoring language ("best match" etc.) — phrase as "N regions meet your criteria".

### AC-9 — Framework discipline preserved (no scoring)
- **Description:** No composite scoring, weighting, or ranking is introduced anywhere by these features.
- **Setup:** Setup: none (static analysis).
- **Verify:** `grep -nEi 'score|weight|rank|sort.*by.*value|best.?fit|top.?pick' /Users/gustafpalm/Projects/land-selection-framework/prototype/src/main.js` returns no NEW scoring/ranking logic (pre-existing `rampColor`/unrelated matches noted and excused). `regionPasses` remains a pure boolean. Compare + shortlist render in neutral order.
- **Depth:** Manual read of preset, shortlist, compare, and next-step code confirms: presets only set thresholds; shortlist is a membership Set; compare iterates the starred set in selection/alpha order; next-step counts passing regions. Any sort present is alphabetical or selection-order, never by criterion value or pass-count.

### AC-10 — EU + NA intact, mobile clean, no regressions
- **Description:** Both continents render correctly with all new features; off-continent controls hidden but the continent switcher stays visible; the layout works at 390px; no console errors.
- **Setup:** shared server.
- **Verify:** Load page (EU). Screenshot. Switch to North America via the switcher → NA regions/table render, EU hidden, switcher still visible (`getComputedStyle(naTab).display !== 'none'`). Open a drawer, star a region, open compare — all work on NA. Resize to 390px → drawer is a bottom sheet, chips wrap, nothing overflows horizontally. Console has 0 errors across the flow.
- **Depth:** Every new control carrying `data-continent` must be in the `:not(.continent-tab)`-style exclusion or otherwise stay visible as a control. Verification MUST use `getComputedStyle().display` + screenshots, NOT just DOM presence (this project produced false "it works" via DOM-only checks twice). Both continents tested for all four features, not just EU.

### AC-11 — Cache-bust bumped + em-dash-free
- **Description:** All `?v=na2` cache-bust strings are bumped to `?v=usab1` (or later) across the module graph, and the site remains em-dash-free including the previously-missed `#match-detail` status copy.
- **Setup:** Setup: none (static analysis) + shared server for the live check.
- **Verify:** `grep -rn 'v=na2' prototype/` returns nothing in shipped files; `grep -rn 'v=usab1' prototype/index.html prototype/src/main.js` shows the bumped imports. `grep -rn '—' prototype/index.html prototype/src/main.js prototype/data/regions.js prototype/data/region-depth.js` returns 0. Page loads with bumped version, no 404 on imports (check Network/console).
- **Depth:** Bump EVERY occurrence (index.html script src + main.js style.json + geojson loads). Em-dash replacements use contextually-correct punctuation (comma for parenthetical, period for hard break), never en-dash. The staged file (`region-depth.staging.js`) is also em-dash-free for when it ships.

### AC-12 — 17 region summaries synthesized + STAGED (not shipped)
- **Description:** A "what living here asks of you" 2-4 sentence practitioner summary is synthesized from existing dossiers for the 17 non-case-study regions, each with a source attribution, written to `data/region-depth.staging.js`. This file is STAGED for human dossier-match review and excluded from deploy — NOT wired into the shipped drawer.
- **Setup:** Setup: none.
- **Verify:** `data/region-depth.staging.js` exists as a valid ES module exporting 17 entries keyed by the correct region ids (galicia, pembrokeshire, cevennes, south-tirol, asturias, saxony-anhalt, estonia-rural, cascadia, vermont, southern-appalachians, driftless, ozarks, northern-new-mexico, nova-scotia, kootenays, quebec-eastern-townships, oaxaca). Each entry has `asks` (2-4 sentences), `source`, `sourceUrl`. `.vercelignore` excludes it. The live `region-depth.js` still contains ONLY the 3 case-study entries.
- **Depth:** Every summary must be traceable to specific dossier content (legal.md / regen.md / climate.md) — NO fabrication. Each entry carries a `_dossierBasis` note (which file lines it draws from) so Gustaf can verify in minutes. Tone matches the deeper.html case-study closings ("This region asks for..."). Em-dash-free. The summaries are practitioner-honest (name the hard parts: water stress, planning constraints, violence proximity for Oaxaca, etc.), not promotional.

---

## Non-functional
- **NF-1 — No build step:** site still runs as static files over http; no bundler/transpiler introduced.
- **NF-2 — Additive only:** existing filter/threshold/map/summary behavior unchanged except for the em-dash fix and additive features.
- **NF-3 — Shareable state:** all user state (thresholds, shortlist, continent) lives in the URL; no cookies/localStorage required.
