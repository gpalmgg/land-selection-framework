"""Extract WRI Aqueduct 4.0 water-stress projection for Europe.

Pulls bau50_ws_x (business-as-usual 2050 water stress, normalized score),
clips to Europe, simplifies polygons, writes GeoJSON for MapLibre.
"""

import json
import sys
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box

ROOT = Path(__file__).parent.parent
GDB = ROOT / "data" / "raw" / "aqueduct-extract" / "Aqueduct40_waterrisk_download_Y2023M07D05" / "GDB" / "Aq40_Y2023D07M05.gdb"

# Continent config — the "whole world" seam (mirrors the front-end CONTINENTS).
# Default 'europe' reproduces the original EU output. Pass a continent key:
#   python process_aqueduct.py north-america
CONTINENTS = {
    "europe":        {"bbox": (-12.0, 35.0, 40.0, 72.0),   "suffix": "",    "tol": 0.02},
    "north-america": {"bbox": (-126.0, 14.0, -52.0, 60.0), "suffix": "-na", "tol": 0.03},
}
CONTINENT = sys.argv[1] if len(sys.argv) > 1 else "europe"
if CONTINENT not in CONTINENTS:
    sys.exit(f"unknown continent '{CONTINENT}' — expected one of {list(CONTINENTS)}")
CFG = CONTINENTS[CONTINENT]
BBOX = CFG["bbox"]
OUT = ROOT / "data" / "processed" / f"water-stress{CFG['suffix']}.geojson"

# Read with bbox spatial filter — pyogrio supports this efficiently
gdf = gpd.read_file(
    GDB,
    layer="future_annual",
    columns=["bau50_ws_x_s", "bau50_ws_x_l"],
    bbox=BBOX,
)

print(f"Loaded {len(gdf)} polygons in {CONTINENT} bbox")

# Simplify polygons — Aqueduct's HydroBASINS L6 are detailed; continent-view tolerance.
gdf["geometry"] = gdf.geometry.simplify(tolerance=CFG["tol"], preserve_topology=True)

# Keep only valid geometries
gdf = gdf[gdf.geometry.is_valid & ~gdf.geometry.is_empty]

# Clip to continent extent
clip_box = box(*BBOX)
gdf["geometry"] = gdf.geometry.intersection(clip_box)
gdf = gdf[~gdf.geometry.is_empty]

# Rename columns for cleanliness in the front-end
gdf = gdf.rename(columns={"bau50_ws_x_s": "score", "bau50_ws_x_l": "label"})

# Drop rows with no score
gdf = gdf.dropna(subset=["score"])

print(f"After cleaning: {len(gdf)} polygons")

# Write to GeoJSON (with rounded coords to reduce size)
gdf.to_file(OUT, driver="GeoJSON", coordinate_precision=4)

# Inject metadata
data = json.loads(OUT.read_text())
data["metadata"] = {
    "source": "WRI Aqueduct 4.0",
    "source_url": "https://www.wri.org/aqueduct",
    "vintage": "2023 release, business-as-usual 2050 projection",
    "native_unit": "HydroBASINS Level 6 sub-basins",
    "license": "CC BY 4.0",
    "note": "Water stress score (0-1): ratio of demand to available renewable supply. Higher = more stress.",
}
OUT.write_text(json.dumps(data, separators=(",", ":")))

size_kb = OUT.stat().st_size / 1024
print(f"Wrote {OUT.name} ({size_kb:.0f} KB)")
