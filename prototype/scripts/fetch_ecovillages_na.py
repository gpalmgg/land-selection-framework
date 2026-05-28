"""Fetch North American intentional-community / ecovillage / permaculture POIs
from OpenStreetMap via the Overpass API.

Writes data/raw/ecovillages-na-osm-raw.json in the same shape as the European
raw pull, so `python process_vectors.py north-america` can consume it directly.

This is the ONE new raw download NA needs — the other layers (water, conflict)
reprocess from on-disk global datasets. Run once:
    .venv/bin/python3 scripts/fetch_ecovillages_na.py
"""

import json
import sys
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT = ROOT / "data" / "raw" / "ecovillages-na-osm-raw.json"

# Overpass bbox order is (south, west, north, east). Covers the NA region slate
# (Oaxaca 17N / Cascadia / Nova Scotia / BC) with margin.
BBOX = "12,-128,60,-58"

QUERY = f"""
[out:json][timeout:240];
(
  node["community"~"intentional|ecovillage",i]({BBOX});
  way["community"~"intentional|ecovillage",i]({BBOX});
  node["amenity"="ecovillage"]({BBOX});
  way["amenity"="ecovillage"]({BBOX});
  node["land_use"="permaculture"]({BBOX});
  way["land_use"="permaculture"]({BBOX});
  node["residential"="cohousing"]({BBOX});
  way["residential"="cohousing"]({BBOX});
  node["name"~"ecovillage|permaculture|cohousing|intentional community",i]({BBOX});
  way["name"~"ecovillage|permaculture|cohousing|intentional community",i]({BBOX});
);
out center tags;
"""

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]


def main():
    payload = urllib.parse.urlencode({"data": QUERY}).encode()
    last_err = None
    for ep in ENDPOINTS:
        try:
            print(f"querying {ep} ...")
            req = urllib.request.Request(
                ep, data=payload, headers={"User-Agent": "land-selection-framework/1.0 (regen land siting)"}
            )
            with urllib.request.urlopen(req, timeout=260) as r:
                raw = json.loads(r.read().decode("utf-8", errors="replace"))
            n = len(raw.get("elements", []))
            OUT.write_text(json.dumps(raw))
            print(f"wrote {OUT.name}: {n} elements ({OUT.stat().st_size} bytes)")
            if n == 0:
                print("WARNING: 0 elements — Overpass returned empty; check tags/bbox before relying on this.")
            return
        except Exception as e:  # noqa: BLE001 — try the next mirror
            print(f"  failed: {e}")
            last_err = e
    sys.exit(f"all Overpass endpoints failed: {last_err}")


if __name__ == "__main__":
    main()
