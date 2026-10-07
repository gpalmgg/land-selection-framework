# Data test suite (`prototype/tests/`)

Zero dependencies: `node:test` + `node:assert`. Owned by EV-TEST. Read-only against the tree (nothing writes outside `os.tmpdir()`), so it can run while other work packages edit files.

```
node tests/run.mjs                      # ratchet run: every tests/*.test.mjs (NOT recursive; tests/e2e and tests/core are other suites)
node tests/run.mjs --only regions,provenance,no-scoring,qualitative
node tests/run.mjs --strict             # the gate: ignores debt.json, also switches on gate-mode checks (every reciprocity entry is checked)
node tests/mutation-check.mjs           # copies the tree to a tmp dir, applies 6 mutations, requires each to be caught
node scripts/evidence/validate_legal.mjs <dir> [--ids a,b]   # staging legal-pathway entries + opened-URL ledger
```

## Ratchet (`run.mjs` + `debt.json`)

`debt.json` is `[{ test, owner, why }]`, matched by exact test name. It is **write-once**: no later work package edits it.

* a failing test that is not in debt: exit 1
* a debt entry whose test now passes: a WARNING only (debt can only shrink in effect; `--strict` is the final gate, EV-GATE)
* a skipped test prints its reason; a skip is never a pass (set `REQUIRE_V2=1` and a missing input becomes a failure)
* `--debt FILE` / `$LSF_DEBT` use another debt file (how the ratchet itself is checked without editing `debt.json`)

## Environment

| Variable | Effect |
|---|---|
| `REQUIRE_V2=1` | every "valid if present" check for v2 fields (method, retrieved, footprint, sourceId, trajectory, `criteria[].window`, legal pathway, sources registry, footprints) becomes "must be present" |
| `LSF_WAVE_ISOLATION=1` | treat the files other wave-0 WPs create (`data/bioregions.js`, `reciprocity.js`, `sources.js`, `layer-sources.js`, `footprints.json`, `footprints/`, koppen/bioregion/river layers) as absent, so a half-written neighbour cannot change a result |
| `CHECK_PAGES=1` | also check `region/*.html` and `sitemap.xml` (gate only, after the final regeneration) |
| `LSF_ROOT`, `LSF_REPO` | alternate `prototype/` and repo root (the mutation check) |
| `LSF_TODAY=YYYY-MM-DD` | fixed "today" for date-window checks (legal `asOf` within 400 days, layer `verified` within 120 days) |

`--strict` sets `LSF_STRICT=1`: `hygiene.test.mjs` then checks the reciprocity strings of **every** entry (otherwise only entries with `status: 'verified'`, because the wave-0 draft module is not shipped by itself and BIO-2 replaces it).

## Files

| File | Asserts |
|---|---|
| `schema.mjs` | single source of truth for enums, `EXTENSIONS` (registered optional fields), `LEGAL_NOT_ADVICE`, and the pure validators (cell, trajectory, criterion, legal entry, context, sources, layer source). Never edited by a later WP: every optional field the plan uses is already registered. |
| `helpers.mjs` | loaders, `PLANNED_IDS` / `NEW_REGION_IDS` (declared once), `expectedIds()` = planned minus `verify/dropped-regions.json`, pure checkers (null policy, unceded, criteria compat, hygiene) |
| `regions.test.mjs` | slugs, geography, accents == `design/final-assets/region-accents.json`, criteria schema, cells, null policy (WARN existing >3, FAIL new >3), v2 fields, no underscore keys |
| `provenance.test.mjs` | every cell has source, https URL, vintage, resolvable licence; dead and known-wrong URLs; land standing / region depth optional fields |
| `cross-file.test.mjs` | the shipped slate (planned minus dropped) is covered by every data file; v1-lookup agrees with processed layers on the four client fields; bioregions / reciprocity / footprints / legal agreement |
| `qualitative.test.mjs` | enums of the six qualitative layers, source + url, confidence honesty, land cost sanity |
| `no-scoring.test.mjs` | no score / weight / rank key anywhere, banned framing words, no personal data, no `_` keys, bioregions + reciprocity |
| `copy-counts.test.mjs` | hard-coded "twenty regions" style counts match the data |
| `legal-pathway.test.mjs`, `context.test.mjs`, `sources.test.mjs`, `layers.test.mjs` | the new data files (skip with a printed reason until the file exists) + validator self-tests on `fixtures/` |
| `result-parity.test.mjs` | `lib/result.js` `computeResult` equals an independent reference filter for 200 random threshold sets, with and without null cells |
| `presets.test.mjs` | every preset matches at least one region on each continent |
| `criteria-compat.test.mjs` | old shared links keep their meaning: id, `higherIs`, unit, step of the 6bce1a3 criteria are unchanged (renames/removals only if listed in `verify/criteria-changes.md`) |
| `unceded.test.mjs` | every 6bce1a3 occurrence of "unceded" survives (Gustaf kept the wording, option c) |
| `hygiene.test.mjs` | no `upgrade-2026-10`, email, phone or `mailto:` in shipped strings; Vermont and Finger Lakes wording rules |
| `disposition.test.mjs` | wraps `scripts/evidence/merge/disposition.mjs --check` and `--check-null-decisions` |
| `allowlist.json` | reasoned exceptions `{ path, pattern, reason }` (a `ruledOut` entry may name a prohibited structure, never instruct one) |
| `fixtures/` | minimal valid and invalid inputs for the validator self-tests |

## Adding a field

Do not edit `schema.mjs` from a data WP. If a new optional field is truly needed, it goes through the orchestrator as a one-line change to `EXTENSIONS` plus the validator and a test, in one place.
