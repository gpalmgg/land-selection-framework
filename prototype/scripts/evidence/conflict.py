"""Canonical pipeline stage: UCDP GED conflict events within 200 km of a region's marker (EV-PIPE-LOCAL).

Source: UCDP Georeferenced Event Dataset (GED) v25.1, `prototype/data/raw/GEDEvent_v25_1.csv`
(CC BY 4.0, https://ucdp.uu.se/downloads/). Observed conflict events, not a forecast.

Filter: the one `scripts/process_vectors.py` applies to build the map layer, reused verbatim except for
the year window, which here is the two comparison periods:
    * the row's `year`, `latitude` and `longitude` must parse (int / float), otherwise the row is skipped
    * the point must fall inside the continent bbox of the region
        europe         (-12, 35, 40, 72)       north-america  (-126, 14, -52, 60)
    * every `type_of_violence` (state-based, non-state, one-sided) counts; `best` is not used as a filter
Count: events whose geodesic (WGS84 ellipsoid) distance from the marker is <= 200 km, for 2013-2018 and
2019-2024 (inclusive). `events` is the canonical count (every event that passes the filter above).
Also reported: the nearest filtered event at any distance, the number within 100 km, best-estimate deaths,
the countries involved, the counts with `best >= 1` and `best >= 3`, and the count if the continent bbox
were not applied.

Known discrepancy (found by this stage, see local-report.md): the deployed Europe layer
`data/processed/conflict.geojson` (14,546 features, built 2025-05-19) holds only events with `best >= 3`,
while `process_vectors.py` as it stands today applies no threshold (it would write 51,218 Europe events)
and the deployed North America layer holds all of them (16,333). The 2013-2024 `layerEquivalentEvents`
field reproduces what the DEPLOYED layers show (Europe `best >= 3`, North America no threshold), which is
the basis of the values the recon expected today (0 everywhere except Oaxaca 120 and Cevennes 2).
`events` and `layerEquivalentEvents` differ for Cevennes: 44 vs 2, all 44 at one point in Marseille
(159 km from the marker).

    python conflict.py <region-id> [--out DIR]
"""
from __future__ import annotations

import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import common  # noqa: E402

STAGE = "conflict"
METHOD_VERSION = "ucdp-ged-v25.1-200km-geodesic-v1"
GED = common.P / "data" / "raw" / "GEDEvent_v25_1.csv"
RADIUS_KM = 200.0
PERIODS = {"2013_2018": (2013, 2018), "2019_2024": (2019, 2024)}

# mirrors scripts/process_vectors.py CONTINENTS (west, south, east, north)
CONTINENT_BBOX = {
    "europe": (-12.0, 35.0, 40.0, 72.0),
    "north-america": (-126.0, 14.0, -52.0, 60.0),
}

SOURCE = {
    "id": "ucdp-ged-251",
    "citation": ("Sundberg, R., Melander, E. (2013). Introducing the UCDP Georeferenced Event Dataset. "
                 "Journal of Peace Research 50(4), 523-532. Davies, S., Pettersson, T., Oberg, M. (2025). "
                 "Organized violence 1989-2024. UCDP GED version 25.1."),
    "url": "https://ucdp.uu.se/downloads/",
    "licence": "CC BY 4.0",
    "vintage": "events 1989-2024 (GED v25.1)",
    "nativeUnit": "georeferenced event points",
}

_cache: dict = {}


class StageError(RuntimeError):
    pass


def load_events():
    """Filtered GED rows as a DataFrame (year, lat, lon, country): rows that parse, per process_vectors.py."""
    if "events" in _cache:
        return _cache["events"]
    import pandas as pd
    if not GED.is_file():
        raise StageError(f"{GED} is missing")
    df = pd.read_csv(GED, usecols=["year", "latitude", "longitude", "country", "type_of_violence", "best"], dtype=str,
                     encoding_errors="replace", keep_default_na=False)
    n_raw = len(df)
    year = pd.to_numeric(df["year"], errors="coerce")
    lat = pd.to_numeric(df["latitude"], errors="coerce")
    lon = pd.to_numeric(df["longitude"], errors="coerce")
    ok = year.notna() & lat.notna() & lon.notna() & (year == year.round())
    # process_vectors.py: best = int(row.get("best", 0) or 0), 0 when it does not parse
    best = pd.to_numeric(df["best"], errors="coerce").fillna(0).astype(int)
    out = pd.DataFrame({"year": year[ok].astype(int), "lat": lat[ok], "lon": lon[ok],
                        "country": df.loc[ok, "country"], "best": best[ok]})
    _cache["events"] = out
    _cache["n_raw"] = n_raw
    return out


def input_record() -> dict:
    if "inputs" in _cache:
        return _cache["inputs"]
    ev = load_events()
    st = GED.stat()
    rec = {"file": str(GED.relative_to(common.R)), "bytes": st.st_size, "sha256": input_fingerprint(),
           "version": "UCDP GED v25.1", "rows": int(_cache["n_raw"]), "rowsParsed": int(len(ev)),
           "maxYear": int(ev["year"].max()),
           "retrieved": datetime.fromtimestamp(st.st_mtime, timezone.utc).strftime("%Y-%m-%d")}
    _cache["inputs"] = rec
    return rec


def footprint_record(region_id: str, reg: dict | None = None) -> dict:
    reg = reg or common.registry()[region_id]
    sha = hashlib.sha256(json.dumps(reg, sort_keys=True, ensure_ascii=False).encode("utf-8")).hexdigest()
    return {"id": region_id, "kind": reg["kind"], "areaKm2": reg["areaKm2"],
            "note": "not used for the count: this stage measures events around the marker", "sha256": sha}


def input_fingerprint() -> str:
    """sha256 of the GED csv (cheap to hold, avoids parsing the file just to test freshness)."""
    if "sha" not in _cache:
        if not GED.is_file():
            raise StageError(f"{GED} is missing")
        _cache["sha"] = common.sha256_file(GED)
    return _cache["sha"]


def continent_of(region_id: str, lon: float, lat: float) -> str:
    if "regions" not in _cache:
        _cache["regions"] = {r["id"]: r for r in common.regions_list(with_new=True)}
    r = _cache["regions"].get(region_id)
    if r and r.get("continent") in CONTINENT_BBOX:
        return r["continent"]
    for name, (w, s, e, n) in CONTINENT_BBOX.items():
        if w <= lon <= e and s <= lat <= n:
            return name
    raise StageError(f"cannot assign a continent bbox to {region_id} ({lon}, {lat})")


def _geodesic_km(lon0: float, lat0: float, lons, lats):
    import numpy as np
    from pyproj import Geod
    geod = Geod(ellps="WGS84")
    n = len(lons)
    if n == 0:
        return np.array([])
    _az1, _az2, dist = geod.inv(np.full(n, lon0), np.full(n, lat0), np.asarray(lons), np.asarray(lats))
    return np.asarray(dist) / 1000.0


def count_period(ev, lon0: float, lat0: float, y0: int, y1: int) -> dict:
    import numpy as np
    sub = ev[(ev["year"] >= y0) & (ev["year"] <= y1)]
    d = _geodesic_km(lon0, lat0, sub["lon"].to_numpy(), sub["lat"].to_numpy())
    within = d <= RADIUS_KM
    countries = sub["country"].to_numpy()[within]
    by_country = {}
    for c in countries:
        by_country[c] = by_country.get(c, 0) + 1
    best = sub["best"].to_numpy()
    return {
        "years": f"{y0}-{y1}",
        "events": int(within.sum()),
        "eventsBestGe1": int((within & (best >= 1)).sum()),
        "eventsBestGe3": int((within & (best >= 3)).sum()),
        "deathsBestWithin": int(best[within].sum()),
        "within100km": int((d <= 100.0).sum()),
        "nearestEventKm": round(float(d.min()), 1) if len(d) else None,
        "countries": dict(sorted(by_country.items(), key=lambda kv: -kv[1])),
    }


def run(region_id: str) -> dict:
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    reg = common.registry()[region_id]
    lon, lat = common.markers()[region_id]
    doc = {
        "stage": STAGE,
        "id": region_id,
        "status": "ok",
        "method": {
            "version": METHOD_VERSION,
            "summary": ("UCDP GED v25.1 events (all types of violence) whose geodesic distance (WGS84 ellipsoid) "
                        "from the region marker is at most 200 km, counted for 2013-2018 and 2019-2024; rows are "
                        "filtered as scripts/process_vectors.py does (year, latitude, longitude must parse; point "
                        "inside the continent bbox)."),
            "radiusKm": RADIUS_KM,
            "centre": "region marker (the conflict count is a marker-radius measure, not a footprint measure)",
            "periods": {k: f"{a}-{b}" for k, (a, b) in PERIODS.items()},
        },
        "source": SOURCE,
        "footprint": footprint_record(region_id, reg),
        "marker": [lon, lat],
        "inputFingerprint": None,
        "inputs": [],
        "computedAt": now,
    }
    try:
        inp = input_record()
        doc["inputFingerprint"] = input_fingerprint()
        doc["inputs"] = [inp]
        doc["retrieved"] = inp["retrieved"]
        ev_all = load_events()
        cont = continent_of(region_id, lon, lat)
        w, s, e, n = CONTINENT_BBOX[cont]
        inside = (ev_all["lon"] >= w) & (ev_all["lon"] <= e) & (ev_all["lat"] >= s) & (ev_all["lat"] <= n)
        ev = ev_all[inside]
        doc["method"]["continentBbox"] = {"continent": cont, "bbox": [w, s, e, n]}
        periods = {}
        for key, (y0, y1) in PERIODS.items():
            periods[key] = count_period(ev, lon, lat, y0, y1)
            unclipped = count_period(ev_all, lon, lat, y0, y1)["events"]
            periods[key]["eventsWithoutBboxClip"] = unclipped
            periods[key]["layerEquivalentEvents"] = (periods[key]["eventsBestGe3"] if cont == "europe"
                                                     else periods[key]["events"])
        doc["method"]["layerEquivalent"] = ("what the deployed map layers contain: europe conflict.geojson holds only "
                                            "best >= 3 events, north-america conflict-na.geojson holds all events")
        doc["periods"] = periods
        doc["flags"] = flags_for(doc)
    except Exception as exc:  # noqa: BLE001 - a failed stage is recorded, never guessed
        doc["status"] = "failed"
        doc["error"] = f"{type(exc).__name__}: {exc}"
        doc.pop("periods", None)
        doc["flags"] = [f"stage failed: {doc['error']}"]
        doc.setdefault("retrieved", None)
    return doc


def flags_for(doc: dict) -> list[str]:
    out = []
    for k, p in doc["periods"].items():
        if p["layerEquivalentEvents"] != p["events"]:
            out.append(f"{k}: {p['events']} events within {RADIUS_KM:.0f} km by the current process_vectors.py filter, "
                       f"{p['layerEquivalentEvents']} in the deployed map layer (Europe layer was built with best >= 3); "
                       f"nearest event {p['nearestEventKm']} km, countries {p['countries']}")
        if p["eventsWithoutBboxClip"] != p["events"]:
            out.append(f"{k}: {p['eventsWithoutBboxClip']} events within {RADIUS_KM:.0f} km without the continent bbox "
                       f"clip, {p['events']} with it (the map filter drops events outside the bbox)")
    return out


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("region")
    ap.add_argument("--out", default=None, help="write <out>/<region>/conflict.json instead of printing")
    a = ap.parse_args(argv)
    doc = run(a.region)
    text = json.dumps(doc, indent=2, ensure_ascii=False)
    if a.out:
        d = Path(a.out) / a.region
        d.mkdir(parents=True, exist_ok=True)
        (d / "conflict.json").write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0 if doc["status"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
