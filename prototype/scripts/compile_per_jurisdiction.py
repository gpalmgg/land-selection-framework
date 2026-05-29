"""Generic compiler for per-jurisdiction qualitative V1 layers.

Usage:
    python compile_per_jurisdiction.py <layer-name>

Inputs:
    data/processed/<layer-name>.json           LLM-extracted, human-verifiable
    data/processed/<layer-name>.metadata.yaml  optional, for embedded GeoJSON metadata
    data/regions.js                            region coords

Output:
    data/processed/<layer-name>.geojson        FeatureCollection, point-per-region

The single compile script for every per-jurisdiction qualitative V1 layer: legal_ownership,
land_cost, demographic_trajectory, soil_contamination, water_source_control, climate_buffering,
and any future siblings. Adding a new layer needs only a JSON + sidecar, never a new script.
Idempotent.
"""
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).parent.parent
PROCESSED = ROOT / "data" / "processed"
JS_REGIONS = ROOT / "data" / "regions.js"


def parse_region_coords(js_path: Path) -> dict:
    coords = {}
    pattern = re.compile(
        r"id:\s*'([^']+)',[^}]*?coords:\s*\[\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\]",
        re.DOTALL,
    )
    for m in pattern.finditer(js_path.read_text()):
        coords[m.group(1)] = [float(m.group(2)), float(m.group(3))]
    return coords


def main():
    if len(sys.argv) < 2:
        sys.exit("usage: compile_per_jurisdiction.py <layer-name>")
    layer = sys.argv[1]
    json_in = PROCESSED / f"{layer}.json"
    sidecar = PROCESSED / f"{layer}.metadata.yaml"
    geojson_out = PROCESSED / f"{layer}.geojson"

    if not json_in.exists():
        sys.exit(f"missing {json_in}; extract the structured layer JSON first")

    extractions = json.loads(json_in.read_text())
    coords = parse_region_coords(JS_REGIONS)

    missing = [e["region_id"] for e in extractions if e["region_id"] not in coords]
    if missing:
        sys.exit(f"missing region coords for: {missing}")

    sidecar_meta = {}
    if sidecar.exists():
        sc = yaml.safe_load(sidecar.read_text())
        notes_first_line = (sc.get("notes") or "").strip().split("\n")[0] if sc.get("notes") else ""
        sidecar_meta = {
            "source": sc.get("source", ""),
            "source_url": sc.get("source_url", ""),
            "vintage": sc.get("vintage", ""),
            "native_unit": sc.get("native_unit", ""),
            "license": sc.get("license", ""),
            "note": notes_first_line,
        }

    features = []
    for entry in extractions:
        rid = entry["region_id"]
        props = {k: v for k, v in entry.items() if k != "region_id"}
        props["region_id"] = rid
        features.append({
            "type": "Feature",
            "geometry": {"type": "Point", "coordinates": coords[rid]},
            "properties": props,
        })

    out = {
        "type": "FeatureCollection",
        "metadata": sidecar_meta,
        "features": features,
    }
    geojson_out.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"Compiled {len(features)} regions ({layer}) -> {geojson_out.name}")


if __name__ == "__main__":
    main()
