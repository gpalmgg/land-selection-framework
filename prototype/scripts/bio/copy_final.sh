#!/bin/sh
# Installs the build output into the site: data modules to prototype/data/, assets to prototype/data/processed/.
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
F="$HERE/../../../upgrade-2026-10/tracks/bio-data/out/final"
P="$HERE/../../data"
cp "$F/bioregions.js" "$F/reciprocity.js" "$P/"
for f in bioregions-europe.geojson bioregions-na.geojson bioregion-borders-europe.geojson bioregion-borders-na.geojson rivers-europe.geojson rivers-na.geojson bioregion-labels.json; do
  cp "$F/$f" "$P/processed/$f"
done
