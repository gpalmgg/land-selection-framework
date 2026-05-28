"""Extract WRI Aqueduct 4.0 water-depletion projection for Europe.

Water depletion (wd) measures the share of available renewable water
actually CONSUMED — net withdrawal divided by total renewable supply.
It's distinct from water stress (which is demand/supply ratio): a region
can have moderate stress but high depletion if it draws down aquifers
or reservoirs faster than they refill. Decision-relevant for any project
relying on local hydrology over a generation.

Pulls bau50_wd_x_s (BAU 2050 depletion score) + label, clips to Europe,
simplifies polygons, writes GeoJSON for MapLibre.
"""

import json
import sys
from pathlib import Path

import geopandas as gpd
from shapely.geometry import box

ROOT = Path(__file__).parent.parent
GDB = ROOT / "data" / "raw" / "aqueduct-extract" / "Aqueduct40_waterrisk_download_Y2023M07D05" / "GDB" / "Aq40_Y2023D07M05.gdb"

# Continent config — mirrors process_aqueduct.py. Default 'europe'; pass a key:
#   python process_aqueduct_depletion.py north-america
CONTINENTS = {
    "europe":        {"bbox": (-12.0, 35.0, 40.0, 72.0),   "suffix": "",    "tol": 0.02},
    "north-america": {"bbox": (-126.0, 14.0, -52.0, 60.0), "suffix": "-na", "tol": 0.03},
}
CONTINENT = sys.argv[1] if len(sys.argv) > 1 else "europe"
if CONTINENT not in CONTINENTS:
    sys.exit(f"unknown continent '{CONTINENT}' — expected one of {list(CONTINENTS)}")
CFG = CONTINENTS[CONTINENT]
BBOX = CFG["bbox"]
OUT = ROOT / "data" / "processed" / f"water-depletion{CFG['suffix']}.geojson"

gdf = gpd.read_file(
    GDB,
    layer="future_annual",
    columns=["bau50_wd_x_s", "bau50_wd_x_l"],
    bbox=BBOX,
)

print(f"Loaded {len(gdf)} polygons in {CONTINENT} bbox")

gdf["geometry"] = gdf.geometry.simplify(tolerance=CFG["tol"], preserve_topology=True)
gdf = gdf[gdf.geometry.is_valid & ~gdf.geometry.is_empty]

clip_box = box(*BBOX)
gdf["geometry"] = gdf.geometry.intersection(clip_box)
gdf = gdf[~gdf.geometry.is_empty]

gdf = gdf.rename(columns={"bau50_wd_x_s": "score", "bau50_wd_x_l": "label"})
gdf = gdf.dropna(subset=["score"])

print(f"After cleaning: {len(gdf)} polygons")

gdf.to_file(OUT, driver="GeoJSON", coordinate_precision=4)

data = json.loads(OUT.read_text())
data["metadata"] = {
    "source": "WRI Aqueduct 4.0",
    "source_url": "https://www.wri.org/aqueduct",
    "vintage": "2023 release, business-as-usual 2050 projection",
    "native_unit": "HydroBASINS Level 6 sub-basins",
    "license": "CC BY 4.0",
    "note": "Water depletion score (0-1): share of renewable supply actively consumed. Higher = aquifer / reservoir drawdown is faster than recharge. Different signal than water stress.",
}
OUT.write_text(json.dumps(data, separators=(",", ":")))

size_kb = OUT.stat().st_size / 1024
print(f"Wrote {OUT.name} ({size_kb:.0f} KB)")
