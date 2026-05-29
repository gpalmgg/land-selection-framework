"""Compile hospital-proximity.geojson from the raw OSM hospital points.

Produces one Point feature per region (at region centroid) with:
  - nearest_hospital_km           : geodesic distance to nearest hospital point
  - nearest_hospital_name         : name (or "Unnamed hospital")
  - hospitals_within_50km         : count (rough proxy for "60-min by road")
  - hospitals_within_100km        : count
  - red_line_60min_proxy_passes   : nearest_hospital_km <= 50  (true/false)

Honest caveat: 60-minute isochrones need road-network routing (OSRM / Valhalla / OSM
graph). V1 uses geodesic distance as a coarse proxy. Average rural drive 50 km/h
implies ~50 km in 60 min on reasonable roads; mountainous/island regions take longer
for the same distance, highway corridors take less. Recorded in metadata + per-feature.
"""
import json
import re
from math import asin, cos, radians, sin, sqrt
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "raw" / "hospitals"
PROCESSED = ROOT / "data" / "processed"
JS_REGIONS = ROOT / "data" / "regions.js"
OUT = PROCESSED / "hospital-proximity.geojson"

EARTH_KM = 6371.0088


def haversine_km(lon1, lat1, lon2, lat2):
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon, dlat = lon2 - lon1, lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    return 2 * EARTH_KM * asin(sqrt(a))


def parse_region_coords(js_path: Path) -> dict:
    coords = {}
    pattern = re.compile(
        r"id:\s*'([^']+)',[^}]*?coords:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]",
        re.DOTALL,
    )
    for m in pattern.finditer(js_path.read_text()):
        coords[m.group(1)] = (float(m.group(2)), float(m.group(3)))
    return coords


def load_hospital_points():
    points = []
    for fname in ("hospitals-eu.geojson", "hospitals-na.geojson"):
        path = RAW / fname
        if not path.exists():
            raise SystemExit(f"Missing {path}; run scripts/fetch_hospitals.py first.")
        gj = json.loads(path.read_text())
        for f in gj.get("features", []):
            lon, lat = f["geometry"]["coordinates"]
            name = f["properties"].get("name", "Unnamed hospital")
            points.append((lon, lat, name))
    return points


def main():
    coords = parse_region_coords(JS_REGIONS)
    hospitals = load_hospital_points()
    print(f"Loaded {len(hospitals)} hospital points (EU+NA combined)")

    features = []
    for rid, (rlon, rlat) in coords.items():
        dists = [(haversine_km(rlon, rlat, hlon, hlat), name) for hlon, hlat, name in hospitals]
        if not dists:
            continue
        dists.sort(key=lambda x: x[0])
        nearest_km, nearest_name = dists[0]
        within_50 = sum(1 for d, _ in dists if d <= 50)
        within_100 = sum(1 for d, _ in dists if d <= 100)
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [rlon, rlat]},
            "properties": {
                "region_id": rid,
                "nearest_hospital_km": round(nearest_km, 2),
                "nearest_hospital_name": nearest_name,
                "hospitals_within_50km": within_50,
                "hospitals_within_100km": within_100,
                "red_line_60min_proxy_passes": nearest_km <= 50,
                "proxy_caveat": "Geodesic distance, not road-network isochrone. ~50 km == ~60 min on rural roads as a coarse rule; mountainous regions slower.",
            },
        })

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "OpenStreetMap via Overpass API (amenity=hospital), aggregated per region from EU+NA snapshots",
            "source_url": "https://overpass-api.de",
            "vintage": "current OSM snapshot (2026-05 compile)",
            "native_unit": "per-jurisdiction (point at region centroid; distance in km)",
            "license": "ODbL 1.0",
            "note": "Geodesic nearest-hospital distance, NOT a road-network 60-min isochrone. The red_line_60min_proxy_passes field uses 50 km as a coarse proxy; refine in V2 with routing.",
        },
        "features": features,
    }
    OUT.write_text(json.dumps(out, indent=2))
    print(f"Wrote {len(features)} per-region features -> {OUT.name}")
    print()
    print("Per-region summary (nearest hospital km, hospitals within 50km / 100km):")
    for f in features:
        p = f["properties"]
        flag = "✓" if p["red_line_60min_proxy_passes"] else "✗"
        print(f"  {flag} {p['region_id']:<26s} {p['nearest_hospital_km']:>6.1f} km  ({p['hospitals_within_50km']:>3d} / {p['hospitals_within_100km']:>3d})")


if __name__ == "__main__":
    main()
