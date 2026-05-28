# North America Expansion, Test Plan (for /prove)

**Deliverable type:** static web app + sourced dataset. Most behavior is browser-verified (Playwright/CDP); data *correctness* is human-verified (see final section).

## Smoke test (run first, < 60s)
```bash
python3 -m http.server 8765 --directory /Users/gustafpalm/Projects/land-selection-framework/prototype &
sleep 1
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8765/        # expect 200
```
Then load `http://localhost:8765/` in browser: page renders, Europe regions visible, **continent switcher present**. If the switcher is missing or EU is broken → stop, scaffold regressed.

---

## Group A, Engineering scaffold (Setup: local server)
**Setup:** `python3 -m http.server 8765 --directory prototype` (wait for "Serving HTTP"); open `http://localhost:8765/?fresh=1`; clear `localStorage`.
**Teardown:** `pkill -f "http.server 8765"`.

- **AC-1** Action: console `import('./data/regions.js').then(m=>({all:m.regions.every(r=>r.continent),eu:m.regions.filter(r=>r.continent==='europe').length}))`. Expected: `{all:true, eu:10}`.
- **AC-1 (regression)** Action: compare EU view region count + criteria count to prod. Expected: 10 regions, 8 criteria, modal still engagement-gated, sliders usable.
- **AC-2** Action: locate switcher; click "North America" then "Europe". Expected: active tab highlights; `aria-selected`/pressed toggles; both views reachable; keyboard (Tab→Enter) works.
- **AC-3** Action: switch to NA; count region cards, bar rows per criterion, summary columns, map markers, and open a criterion's "Sources for…" expander. Expected: all show NA regions only; match bar reads "N of N" (N = live NA count); **source expander lists NA regions** (catches the inline `:1499` builder); no "of 10" when N≠10.
- **AC-3 (edge: counts)** Action: inspect match-count + any "X of N" text on NA. Expected: reflects NA count, never hardcoded 10.
- **AC-5** Action: set Climate threshold restrictive on EU; switch NA; switch back EU. Expected: threshold value + filtered state preserved both ways; share URL still encodes it.
- **AC-6** Action: switch EU⇄NA five times; recount region cards + markers. Expected: counts constant (no duplication/orphans).
- **AC-4** Action: switch to NA; observe map; inspect `CONTINENTS` in source. Expected: map flies to NA (~[-100,45]); render fns have no per-continent branches.
- **AC-14** Action: diff EU view against current production (regions, data, map, modal, sliders, share, banner, "A project of The Collective" framing); then load both continents at 390px. Expected: EU experience unchanged from prod; both continents render cleanly on mobile (switcher fits, map controls collapse, no overflow/overlap); all prior fixes survive (engagement-gated modal, self-hosted MapLibre, short bar labels, native share, SEO tags).

## Group B, NA map layers (Setup: local server + NA geojsons present)
**Setup:** as Group A; confirm `data/processed/*-na.geojson` exist.
- **AC-7** Action: NA view → toggle Ecovillage sites, Water stress, Water depletion, Conflict. Expected: ecovillage layer **non-empty** over NA; water polygons in NA extent; conflict may be empty (OK); EU view shows EU versions only.
- **AC-7 (edge: signature layer)** Action: confirm Ecovillage layer is on by default in NA and has markers. Expected: real Overpass results, not an empty re-clip.
- **AC-8** Action: `grep -n bbox prototype/scripts/process_*.py`; `ls data/processed/`. Expected: bbox parameterised; `*-na.geojson` present; EU `*.geojson` unchanged.

## Group C, Data integrity (Setup: local server), AUTO-CHECKABLE PORTION ONLY
**Setup:** as Group A.
- **AC-9 (field presence)** Action: console, for each NA region × 8 criteria assert `value,unit,vintage,label,source,sourceUrl` all present + non-empty. Expected: zero missing fields.
- **AC-9 (placeholder smell)** Action: for each criterion, check whether the value is identical across all live NA regions. Expected: none identical except `conflict` (0 is legitimate). Any other all-identical column → flag as suspected placeholder.
- **AC-10** Action: `ls data/research-dossier/` and a region's dir. Expected: each live NA region has 8 dimension `.md` files; spot-checked citations are real URLs.
- **AC-11** Action: run AC-9 checks against ALL currently-visible NA regions. Expected: every visible region passes (no half-filled region live).

## Group D, Content & discipline (Setup: none / grep)
- **AC-12** Action: `grep -niE "ten European regions|all ten" deeper.html`. Expected: no stale singular-continent claim; NA referenced in bibliography.
- **AC-13** Action: `grep -niE "score|weight|rank" prototype/src/main.js` (excluding MapLibre paint + match-count). Expected: no new aggregation; `regionPasses` pure boolean; no 9th criterion card.
- **AC-15** Action: fresh load, cleared storage. Expected: defined default continent loads; meta/canonical/JSON-LD intact; banner + "A project of The Collective" eyebrow present.

## Browser tests (CDP)
- Navigate localhost → screenshot (EU) → switch NA → screenshot (NA) → mobile 390px both continents (hero/banner/switcher/map-collapsed/criteria/footer). Accessibility snapshot of the switcher (roles/labels). Interaction: drag a slider on each continent, confirm bars fade + match-count updates.

## What CANNOT be tested automatically (must exist, and here it's the crux)
1. **Data accuracy / sourcing correctness (AC-9, the whole point).** A script can confirm a cell has a number and a URL; it cannot confirm the number is *right* or the source *actually says it*. **Gustaf/The Collective must verify each batch's values against its dossier before deploy.** This is the data-honesty bar the audit set, automation checks presence, humans check truth.
2. **Region selection appropriateness.** Whether these 10 NA regions "tell different stories" / are the right set is editorial judgment (and possibly a Collective decision).
3. **Dossier citation quality.** Whether a cited source is authoritative and current vs. a weak/stale link.
4. **Visual design / copy quality** of the switcher and any NA case-study prose, judgment, not assertion.
5. **Map cartographic sensibility** for NA (center/zoom framing, marker legibility at NA scale), eyeball it.

If anyone claims items 1–3 are auto-verified, they're wrong: the site's credibility rests on human-verified data, and no test substitutes for that.
