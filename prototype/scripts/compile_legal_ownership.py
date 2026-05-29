"""Compile legal-ownership.geojson from the structured per-region legal extractions.

Pipeline:
  raw source        -> data/research-dossier/<id>/legal.md (primary legal sources cited inline)
  intermediate JSON -> data/processed/legal-ownership.json
                       (LLM-assisted extraction from the legal.md files into the
                        structured schema; HUMAN-VERIFIABLE by direct inspection)
  output GeoJSON    -> data/processed/legal-ownership.geojson
                       (one Point feature per region at the region centroid, carrying
                        all legal properties; loadable in QGIS, Jupyter, anything)

The JSON intermediate satisfies the Spec Step 4 rule that LLM-assisted candidates
must be manually verifiable: open the JSON, read the fields, sanity-check against
the linked dossier.

Idempotent: re-running with the same inputs produces the same output.
"""

import json
import re
from pathlib import Path

ROOT = Path(__file__).parent.parent
JSON_IN = ROOT / "data" / "processed" / "legal-ownership.json"
JS_REGIONS = ROOT / "data" / "regions.js"
GEOJSON_OUT = ROOT / "data" / "processed" / "legal-ownership.geojson"


def parse_region_coords(js_path: Path) -> dict:
    """Parse {region_id: [lng, lat]} out of regions.js by regex (no JS runtime needed)."""
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
        raise SystemExit(
            f"Missing {JSON_IN}. Extract the structured legal data first "
            "(see scripts/compile_legal_ownership.py docstring)."
        )
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
            "source": "Per-region legal.md dossiers; each entry carries its primary legal source inline",
            "source_url": "data/research-dossier/<id>/legal.md",
            "vintage": "2026-05 compilation; per-feature regulatory_notes carry the latest known change",
            "native_unit": "per-jurisdiction (point at region centroid)",
            "license": "Research dossiers internal; underlying primary sources carry their own licenses (typically open government)",
            "note": "Per-jurisdiction qualitative legal-ownership layer. State + trajectory per Spec: state = current regime; trajectory = per-feature regulatory_direction.",
        },
        "features": features,
    }
    GEOJSON_OUT.write_text(json.dumps(out, indent=2, ensure_ascii=False))
    print(f"Compiled {len(features)} regions -> {GEOJSON_OUT.name}")


if __name__ == "__main__":
    main()
