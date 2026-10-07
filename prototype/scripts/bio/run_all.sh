#!/bin/sh
# Rebuilds every bioregion asset and both data modules from the raw downloads.
# Run from anywhere:  prototype/.venv/bin/python is used for the geo steps.
# Inputs : upgrade-2026-10/tracks/bio-data/raw/  (not committed to the site; 433 MB)
#          prototype/data/regions.js (+ upgrade-2026-10/regions/<id>/data.json for regions not yet in it)
# Outputs: upgrade-2026-10/tracks/bio-data/out/final/ ; then install = copy_final.sh
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
PY=${PY:-$HERE/../../.venv/bin/python}
cd "$HERE"
$PY membership100.py     # ecoregion shares in a 100 km disc around each refPoint -> membership100.json
$PY rivercheck.py        # Natural Earth named rivers within 100 km -> rivers100.json
$PY make_bioregions_js.py   # -> out/final/bioregions.json
$PY emit_js.py              # -> out/final/bioregions.js
$PY build_final.py          # polygons, shared borders, labels, rivers -> out/final/*.geojson, bioregion-labels.json
$PY build_reciprocity.py    # -> out/final/reciprocity.json (draft)
$PY emit_recip_js.py        # -> out/final/reciprocity.js
$PY make_manifest.py        # -> out/final/MANIFEST.json
