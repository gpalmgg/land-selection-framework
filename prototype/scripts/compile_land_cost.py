"""Compile land-cost.geojson from the structured per-region land-cost extractions.

Mirrors the legal_ownership pipeline:
  raw source        -> data/research-dossier/<id>/{legal,regen,accessibility}.md
                       (cost data scattered across files, thinner than legal data)
  intermediate JSON -> data/processed/land-cost.json
                       (LLM-assisted extraction; human-verifiable; gap-honest)
  output GeoJSON    -> data/processed/land-cost.geojson
                       (Point per region at the region centroid; cost properties)

Idempotent: same inputs -> byte-identical output.
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
JSON_IN = ROOT / "data" / "processed" / "land-cost.json"
JS_REGIONS = ROOT / "data" / "regions.js"
GEOJSON_OUT = ROOT / "data" / "processed" / "land-cost.geojson"


def parse_region_coords(js_path: Path) -> dict:
    """{region_id: [lng, lat]} from regions.js, by regex (no JS runtime needed)."""
    text = js_path.read_text()
    coords = {}
    pattern = re.compile(
        r"id:\s*'([^']+)',[^}]*?coords:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]",
        re.DOTALL,
    )
    for m in pattern.finditer(text):
        rid, lng, lat = m.group(1), float(m.group(2)), float(m.group(3))
        coords[rid] = [lng, lat]
    return coords


def main():
    if not JSON_IN.exists():
        raise SystemExit(f"Missing {JSON_IN}. Run the extraction first.")
    extractions = json.loads(JSON_IN.read_text())
    coords = parse_region_coords(JS_REGIONS)

    missing = [e["region_id"] for e in extractions if e["region_id"] not in coords]
    if missing:
        raise SystemExit(f"Missing coords for region ids: {missing}")

    features = []
    for entry in extractions:
        rid = entry["region_id"]
        properties = {k: v for k, v in entry.items() if k != "region_id"}
        properties["region_id"] = rid
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": coords[rid]},
            "properties": properties,
        })

    out = {
        "type": "FeatureCollection",
        "metadata": {
            "source": "Per-region dossiers (legal.md / regen.md / accessibility.md); each entry carries its primary cost-citation source where available",
            "source_url": "data/research-dossier/<id>/{legal,regen,accessibility}.md",
            "vintage": "2026-05 compilation; per-feature price_vintage carries the cited figure's year",
            "native_unit": "per-jurisdiction (point at region centroid)",
            "license": "Research dossiers internal; underlying primary sources carry their own licenses (typically open government / national agriculture-ministry data)",
            "note": "Per-jurisdiction qualitative + numeric land-cost layer. data_confidence per feature surfaces where dossier evidence was sparse vs solid. Honest gaps recorded in `gaps` field.",
        },
        "features": features,
    }
    GEOJSON_OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"Compiled {len(features)} regions -> {GEOJSON_OUT.name}")


if __name__ == "__main__":
    main()
