# scripts/evidence/merge: patch, region-package and overlay toolkit

Built by EV-MERGE-TOOLS, run by the integration WPs (EV-INT-*), the docs track (DOC-6) and the orchestrator (P-DROP).
Zero dependencies (Node only). Every tool is idempotent (a second run changes nothing) and has `--dry-run`. Nothing writes a
generated file in the working tree (region pages, sitemap, llms.txt, v1-lookup.js): regenerate those with their generators.
All tools accept `--root DIR` (a prototype/ folder), `--upg DIR`, `--out DIR` (evidence-out) and `--reverify DIR`, so the tests
and scratch copies never touch the real tree.

| tool | what it does |
|---|---|
| `reverify_to_patches.mjs` | `--summary` prints the counts; `--index` writes `evidence-out/reverify-index.json` + `unverifiable.json`; default writes `patches.json`, `needs-hand.json`, `deferred-low.json`, `deeper-change-list.json`, `held-by-converter.json` (+ the index). Hold rule: a correction whose own `reason` asks for human review is never in `patches.json`. |
| `patch_js.mjs` | applies `patches.json` to the SOURCE TEXT of `data/regions.js`, `land-standing.js`, `region-depth.js` and `data/processed/*.json`: asserts `old`, replaces one value (or one sentence inside a string), keeps comments and layout, re-imports and compares with the independently patched object model. States: applied, noop, stale, unresolved, unsupported, superseded-by-pipeline. Records dispositions itself. Flags: `--file`, `--min-confidence`, `--non-numeric-only`, `--numeric-only`, `--ref`, `--pipeline-dir`, `--no-pipeline`, `--no-record`, `--strict`. |
| `disposition.mjs` | the ledger: `--init <WP>`, `--set <ref> <state> [detail]`, `--check [--strict] [--owner WP]`, `--check-null-decisions`, `--summary`. |
| `load_region_package.mjs` | verdict filter (`ship`, `ship-with-gaps`, `drop`, no verdict) and validation of `regions/<id>/`; strips underscore keys and non-schema cell keys. |
| `emit_region_js.mjs` | emits a region object, values block, land standing and region depth entries in house format; `--into regions|standing|depth` inserts them (continent-aware). |
| `apply_overlays.mjs` | applies `staging/<fileKey>/<regionId>.json` overlays; a new field must be registered in `tests/schema.mjs`. |
| `fit_ranges.mjs` | fits `criteria[].rangeMin/rangeMax` to the values (never clamps; writes an explicit `step` when widening would change the slider step). |
| `remove_region.mjs` | removes one region from every data module (P-DROP); orchestrator only. |
| `report.mjs` | writes `evidence-out/integration-report.md`. |
| `../build_cells.mjs` | assembles `evidence-out/<id>/cells.json` under policy P-CELL and writes `crosscheck.json|md`. |

Tests: `node --test scripts/evidence/merge/` (index.js loads every `*.test.mjs`; fixtures in `tests/fixtures/merge/`).
