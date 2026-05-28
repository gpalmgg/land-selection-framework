"""Process raw vector sources into GeoJSON for the MapLibre prototype.

Outputs:
  data/processed/ecovillages.geojson
  data/processed/conflict.geojson

Both files in WGS84 (EPSG:4326), small enough to ship directly as MapLibre sources.
"""

import csv
import json
import sys
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "raw"
OUT = ROOT / "data" / "processed"
OUT.mkdir(parents=True, exist_ok=True)

# Continent config — mirrors the front-end + Aqueduct scripts. Default 'europe'
# reproduces the original EU outputs. Pass a continent key:
#   python process_vectors.py north-america
# bbox is (west, south, east, north). Points (not polygons), so a wide bbox is cheap.
CONTINENTS = {
    "europe":        {"bbox": (-12.0, 35.0, 40.0, 72.0),   "suffix": "",    "osm_raw": "ecovillages-osm-raw.json"},
    "north-america": {"bbox": (-126.0, 14.0, -52.0, 60.0), "suffix": "-na", "osm_raw": "ecovillages-na-osm-raw.json"},
}
CONTINENT = sys.argv[1] if len(sys.argv) > 1 else "europe"
if CONTINENT not in CONTINENTS:
    sys.exit(f"unknown continent '{CONTINENT}' — expected one of {list(CONTINENTS)}")
CFG = CONTINENTS[CONTINENT]
BBOX = CFG["bbox"]
SUFFIX = CFG["suffix"]


def in_bbox(lon: float, lat: float) -> bool:
    w, s, e, n = BBOX
    return w <= lon <= e and s <= lat <= n


# =========================================================================
# Ecovillages from OSM Overpass
# =========================================================================

def process_ecovillages():
    raw = json.loads((RAW / CFG["osm_raw"]).read_text())
    features = []
    for e in raw["elements"]:
        # nodes have lat/lon; ways/relations use center
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue
        if not in_bbox(lon, lat):
            continue

        tags = e.get("tags", {})
        name = tags.get("name") or tags.get("name:en") or "Unnamed site"
        kind = (
            "ecovillage"
            if any(
                tags.get(k) in ("ecovillage", "intentional", "Global Ecovillage Network")
                or tags.get(k) == "global_ecovillage_network"
                for k in ("community", "place", "amenity", "network", "identity")
            )
            else "permaculture"
            if "permaculture" in (tags.get("land_use", ""), tags.get("farm", ""))
            or "permaculture" in tags
            else "intentional_community"
        )

        features.append(
            {
                "type": "Feature",
                "geometry": {"type": "Point", "coordinates": [lon, lat]},
                "properties": {
                    "name": name,
                    "kind": kind,
                    "population": tags.get("population"),
                    "website": tags.get("website") or tags.get("contact:website"),
                    "country": tags.get("addr:country"),
                    "osm_id": e.get("id"),
                    "osm_type": e.get("type"),
                },
            }
        )

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "OpenStreetMap via Overpass API",
            "source_url": "https://overpass-api.de",
            "vintage": "current OSM snapshot",
            "native_unit": "point locations",
            "license": "ODbL 1.0",
            "note": "Volunteer-tagged. Coverage is patchy versus the full GEN directory (300+ sites). Real data, real limitation.",
        },
        "features": features,
    }
    out_path = OUT / f"ecovillages{SUFFIX}.geojson"
    out_path.write_text(json.dumps(out))
    print(f"ecovillages ({CONTINENT}): {len(features)} features -> {out_path.name} ({out_path.stat().st_size} bytes)")


# =========================================================================
# Conflict events from UCDP GED v25.1
# =========================================================================

def process_conflict():
    csv_path = RAW / "GEDEvent_v25_1.csv"
    features = []

    # UCDP columns we care about: year, latitude, longitude, deaths_civilians, deaths_a, deaths_b, type_of_violence
    # type_of_violence: 1 = state-based, 2 = non-state, 3 = one-sided
    YEAR_MIN = 2015
    YEAR_MAX = 2024

    with csv_path.open(newline="", encoding="utf-8", errors="replace") as f:
        reader = csv.DictReader(f)
        for row in reader:
            try:
                year = int(row["year"])
                if year < YEAR_MIN or year > YEAR_MAX:
                    continue
                lat = float(row["latitude"])
                lon = float(row["longitude"])
            except (ValueError, KeyError):
                continue

            if not in_bbox(lon, lat):
                continue

            try:
                best = int(row.get("best", 0) or 0)
            except ValueError:
                best = 0

            features.append(
                {
                    "type": "Feature",
                    "geometry": {"type": "Point", "coordinates": [lon, lat]},
                    "properties": {
                        "year": year,
                        "country": row.get("country"),
                        "type_of_violence": int(row.get("type_of_violence", 0) or 0),
                        "deaths_best": best,
                    },
                }
            )

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "UCDP Georeferenced Event Dataset v25.1",
            "source_url": "https://ucdp.uu.se",
            "vintage": "events 2015-2024",
            "native_unit": "event points",
            "license": "CC BY 4.0",
            "note": "Observed conflict events, not future risk. Ukraine 2022+ dominates recent years.",
        },
        "features": features,
    }
    out_path = OUT / f"conflict{SUFFIX}.geojson"
    out_path.write_text(json.dumps(out))
    print(f"conflict ({CONTINENT}): {len(features)} features -> {out_path.name} ({out_path.stat().st_size} bytes)")


if __name__ == "__main__":
    try:
        process_ecovillages()
    except FileNotFoundError as e:
        print(f"ecovillages skipped — raw OSM file missing ({e}); run fetch_ecovillages_na.py first")
    process_conflict()
