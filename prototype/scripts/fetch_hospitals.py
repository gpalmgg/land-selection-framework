"""Fetch hospital points from OSM Overpass for EU and NA bboxes.

Outputs two raw GeoJSONs into data/raw/hospitals/:
  hospitals-eu.geojson, hospitals-na.geojson  (Point per amenity=hospital)

Uses urllib (stdlib) so no extra venv dependency. Resumable: skips already-fetched files.
"""
import json
import time
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
RAW = ROOT / "data" / "raw" / "hospitals"
RAW.mkdir(parents=True, exist_ok=True)

OVERPASS = "https://overpass-api.de/api/interpreter"

BBOXES = {
    "eu": (35.0, -12.0, 72.0, 40.0),     # south, west, north, east
    "na": (14.0, -126.0, 60.0, -52.0),
}


def overpass_query(bbox: tuple) -> str:
    south, west, north, east = bbox
    return (
        "[out:json][timeout:180];"
        "("
        f"node[\"amenity\"=\"hospital\"]({south},{west},{north},{east});"
        f"way[\"amenity\"=\"hospital\"]({south},{west},{north},{east});"
        ");"
        "out center;"
    )


def fetch_one(scope: str, bbox: tuple) -> Path:
    out_path = RAW / f"hospitals-{scope}.geojson"
    if out_path.exists():
        print(f"  {scope}: already cached at {out_path.name}")
        return out_path

    data = urllib.parse.urlencode({"data": overpass_query(bbox)}).encode()
    req = urllib.request.Request(OVERPASS, data=data, headers={
        "User-Agent": "land-selection-framework/v1 (research, contact via project)",
    })
    print(f"  {scope}: querying Overpass (bbox {bbox})...")
    t0 = time.time()
    with urllib.request.urlopen(req, timeout=240) as resp:
        raw = json.loads(resp.read())
    dt = time.time() - t0

    features = []
    for el in raw.get("elements", []):
        lat = el.get("lat") or el.get("center", {}).get("lat")
        lon = el.get("lon") or el.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue
        tags = el.get("tags", {})
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": [lon, lat]},
            "properties": {
                "name": tags.get("name") or tags.get("name:en") or "Unnamed hospital",
                "operator": tags.get("operator"),
                "emergency": tags.get("emergency"),
                "beds": tags.get("beds"),
                "osm_id": el.get("id"),
                "osm_type": el.get("type"),
            },
        })

    geojson = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "OpenStreetMap via Overpass API (amenity=hospital)",
            "source_url": "https://overpass-api.de",
            "vintage": "current OSM snapshot",
            "native_unit": "point locations",
            "license": "ODbL 1.0",
            "note": "amenity=hospital points only (excludes clinic, doctors). Volunteer-tagged. Coverage uneven across countries.",
        },
        "features": features,
    }
    out_path.write_text(json.dumps(geojson))
    print(f"  {scope}: {len(features)} hospitals fetched in {dt:.1f}s -> {out_path.name} ({out_path.stat().st_size // 1024} KB)")
    return out_path


def main():
    print("Fetching hospital points from OSM Overpass...")
    for scope, bbox in BBOXES.items():
        fetch_one(scope, bbox)


if __name__ == "__main__":
    main()
