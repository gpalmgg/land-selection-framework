#!/usr/bin/env python3
"""Stage 4 of the canonical evidence pipeline (remote B): photovoltaic output.

Metric   Long-term average photovoltaic output, PVOUT_csi (kWh per kWp per year), mean over a
         regular point grid inside the footprint. Same arithmetic as regions/*/tools/solar.py
         (GSA long-term-average API, one request per grid point, mean/median/min/max/p10/p90 of
         PVOUT_csi plus the elevation spread), generalised to any footprint id. The grid spacing
         is isotropic in km (6.5 km, which is what the region tools' 0.06 x 0.085 degree grid
         gives at 45 N) so it behaves the same at 17 N and 63 N; for very large footprints the
         spacing grows so that no region needs more than MAX_POINTS requests.
Source   Global Solar Atlas 2.0 (World Bank Group / ESMAP, data by Solargis), licence CC BY 4.0,
         https://api.globalsolaratlas.info/data/lta?loc=<lat>,<lon>
Trajectory  none honest: the product is a long-term average, not a trend ('not_available').
Integrity  >= MIN_POINTS valid grid points are required; with fewer, the footprint marker is
         used alone and the stage writes status 'fallback' with marker_fallback true. Each
         point gets 3 tries; a 0.25 s politeness delay separates ANY two requests (a global
         limiter, so worker threads cannot burst). A region where more than 25 percent of
         the grid points failed is written as 'fallback' (the value stays, the error names the
         shortfall). NEVER fabricates a value: no response, no number.

Run (project virtualenv):
    prototype/.venv/bin/python prototype/scripts/evidence/solar.py \
        --regions alentejo,finger-lakes|all --out upgrade-2026-10/evidence-out [--verify] [--refresh]
    prototype/.venv/bin/python prototype/scripts/evidence/solar.py --verify upgrade-2026-10/evidence-out

--verify DIR   verify-only: re-reads <DIR>/<region>/solar.json, checks structure and the sanity
               anchors, exits non-zero on a problem. A bare --verify (with --regions/--out) runs
               the stage first and then verifies.

Output  <out>/<region>/solar.json     Cache  upgrade-2026-10/evidence-cache/solar/<region>.json
Report  <out>/remote-report-B.md (totals ok/fallback/failed for solar, ghsl, regen; rebuilt from
        whatever stage files exist, by every stage of this WP)
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import json
import math
import os
import sys
import tempfile
import threading
import time
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402
from common import U, load_footprint, registry, with_retry  # noqa: E402

STAGE = "solar"
CACHE = U / "evidence-cache" / "solar"
API = "https://api.globalsolaratlas.info/data/lta?loc={lat:.4f},{lon:.4f}"
SRC_URL = "https://globalsolaratlas.info"
LICENCE_URL = "https://globalsolaratlas.info/support/terms-of-use"
BASE_SPACING_KM = 6.5          # = the region tools' 0.06 x 0.085 degree grid at 45 N
MAX_POINTS = 150               # politeness cap per region (the region tools used up to 339)
MIN_POINTS = 5
TARGET_POINTS = 40             # small footprints get a finer grid (floor MIN_SPACING_KM) so p10/p90 rest on enough points
MIN_SPACING_KM = 2.0
MAX_FAIL_FRAC = 0.25
DELAY_S = 0.25
TRIES = 3
KM_PER_DEG = 111.32
REPORT = "remote-report-B.md"
STATUSES = ("ok", "fallback", "failed")
ANCHOR_TOL = 0.05              # relative; the grids differ in spacing/offset from the region tools'


# --------------------------------------------------------------------------- shared helpers
# (duplicated across the stage modules on purpose: every stage module is a standalone CLI)


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def dropped_regions() -> set[str]:
    p = U / "verify" / "dropped-regions.json"
    if not p.is_file():
        return set()
    try:
        d = json.loads(p.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return set()
    items = d.get("dropped", d) if isinstance(d, dict) else d
    out = set()
    for it in items or []:
        out.add(it["id"] if isinstance(it, dict) else str(it))
    return out


def resolve_regions(spec: str) -> list[str]:
    reg = registry()
    if spec.strip() == "all":
        drop = dropped_regions()
        return [r for r in reg if r not in drop]
    ids = [s.strip() for s in spec.split(",") if s.strip()]
    bad = [i for i in ids if i not in reg]
    if bad:
        raise SystemExit(f"unknown region id(s) {bad}; known: {list(reg)}")
    return ids


def geom_sha(geom) -> str:
    import shapely
    g = shapely.set_precision(geom, 1e-6)
    return hashlib.sha256(shapely.to_wkb(g)).hexdigest()


def footprint_block(rid: str, geom) -> dict:
    e = registry()[rid]
    return {"id": rid, "kind": e["kind"], "areaKm2": e.get("areaKm2"),
            "geometryAreaKm2": round(common.area_km2(geom), 1), "basis": e.get("basis"),
            "marker": e["marker"], "geometrySha256": geom_sha(geom)}


def write_json(path: Path, doc: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=str(path.parent), suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as fh:
        json.dump(doc, fh, indent=1, ensure_ascii=False, allow_nan=False)
        fh.write("\n")
    os.replace(tmp, path)


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


# --------------------------------------------------------------------------- report (shared by solar, ghsl, regen)


def _fmt(v, nd=1):
    if v is None:
        return "-"
    return f"{v:.{nd}f}" if isinstance(v, float) else str(v)


def write_report_b(out: Path) -> Path:
    """Rebuild <out>/remote-report-B.md from the solar, ghsl and regen JSON files that exist.

    Idempotent and order-independent: every stage of this WP calls it at the end of a run or a
    verify, so the report always reflects the files on disk.
    """
    ids = resolve_regions("all")
    stages = ("solar", "ghsl", "regen")
    docs = {s: {rid: read_json(out / rid / f"{s}.json") for rid in ids} for s in stages}
    lines = [
        "# Remote evidence stages B: solar, population (GHS-POP), regen network", "",
        f"Generated {now_iso()} by `scripts/evidence/{{solar,ghsl,regen}}.py` (EV-PIPE-REMOTE-B). Regions: {len(ids)} "
        "(read from `data/footprints.json` minus `verify/dropped-regions.json`).", "",
        "Status words: **ok** = full method completed; **fallback** = a value or a secondary part is missing "
        "and the error names it (for ghsl with no 2020 value the integration WP uses an official statistic, "
        "`method: 'official-statistic'`); **failed** = no value, error recorded, nothing fabricated.", "",
        "## Totals per stage", "", "| stage | ok | fallback | failed | missing file |", "|---|---|---|---|---|"]
    for s in stages:
        cnt = {k: sum(1 for d in docs[s].values() if d and d.get("status") == k) for k in STATUSES}
        miss = sum(1 for d in docs[s].values() if d is None)
        lines.append(f"| {s} | {cnt['ok']} | {cnt['fallback']} | {cnt['failed']} | {miss} |")

    lines += ["", "## Per region", "",
              "| region | PVOUT kWh/kWp/yr (n points; p10-p90) | people per km2 2020 | change 2020 to 2030 projected | "
              "change 2000 to 2020 | Atlas wave-1 floor within 100 km |", "|---|---|---|---|---|---|"]
    for rid in ids:
        so, gh, rg = (docs[s][rid] for s in stages)
        if so and so.get("value") is not None:
            srow = f"{so['value']:.0f} ({so.get('n_points')}; {so['p10']:.0f}-{so['p90']:.0f})" + (
                " marker only" if so.get("marker_fallback") else "")
        else:
            srow = "-" if not so else so.get("status", "-")
        if gh and gh.get("value") is not None:
            grow = _fmt(gh["value"], 1)
            tr = gh.get("trajectory", {})
            g30 = f"{tr['change_pct_2020_2030']:+.1f} %" if tr.get("change_pct_2020_2030") is not None else "-"
            g00 = f"{tr['change_pct_2000_2020']:+.1f} %" if tr.get("change_pct_2000_2020") is not None else "-"
        else:
            grow, g30, g00 = ("-" if not gh else gh.get("status", "-")), "-", "-"
        rrow = "-" if not rg else (str(rg.get("value")) if rg.get("value") is not None else rg.get("status", "-"))
        lines.append(f"| {rid} | {srow} | {grow} | {g30} | {g00} | {rrow} |")

    lines += ["", "## Non-ok results", ""]
    non_ok = [(s, rid, d.get("error")) for s in stages for rid, d in docs[s].items() if d and d.get("status") != "ok"]
    lines += [f"- {s}/{rid}: {err}" for s, rid, err in non_ok] or ["None."]

    lines += ["", "## Notes", ""]
    sol_fb = [rid for rid, d in docs["solar"].items() if d and d.get("marker_fallback")]
    lines.append(f"- Solar: grid spacing {BASE_SPACING_KM} km by default, coarser for very large footprints (at most {MAX_POINTS} points) and "
                 f"finer, down to {MIN_SPACING_KM} km, for small ones (about {TARGET_POINTS} points); "
                 f"marker-only fallback regions: {', '.join(sol_fb) if sol_fb else 'none'}.")
    gh_ok = [d for d in docs["ghsl"].values() if d and d.get("status") == "ok"]
    if gh_ok:
        tiles = {t["tile"] for d in gh_ok for t in d.get("tiles", [])}
        lines.append(f"- GHS-POP: {len(tiles)} distinct 1000 km Mollweide tiles per epoch, each download size-asserted "
                     "against the server Content-Length and zip-tested (curl exit 0 is never trusted).")
    rg_any = next((d for d in docs["regen"].values() if d), None)
    if rg_any:
        b = rg_any.get("baseline", {})
        lines.append(f"- Regen: baseline SHA-256 {b.get('sha256', '-')}; frozen {b.get('frozen_sha256', '-')}; "
                     f"match {b.get('matches')}. Counts are a FLOOR of web-verifiable activity among directory-listed "
                     "communities, not a census.")
    lines += ["", "## Provenance", "",
              "Per-region JSON (`<region>/<stage>.json`) records the footprint hash, the inputs with their asserted sizes "
              "and the retrieval time. Solar point responses and GHS-POP tiles are cached under "
              "`upgrade-2026-10/evidence-cache/` (gitignored).", ""]
    path = out / REPORT
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


# --------------------------------------------------------------------------- grid


def _grid(geom, spacing_km: float):
    """Regular isotropic (km) grid of (lat, lon) inside geom, centred in the bounding box."""
    from shapely.geometry import Point
    from shapely.prepared import prep
    minx, miny, maxx, maxy = geom.bounds
    dlat = spacing_km / KM_PER_DEG
    lat_mid = (miny + maxy) / 2.0
    dlon = spacing_km / (KM_PER_DEG * max(0.2, math.cos(math.radians(lat_mid))))
    pts = []
    la = miny + dlat / 2.0
    prepared = prep(geom)
    while la < maxy:
        # per-row longitude step so spacing stays isotropic across tall footprints
        dl = spacing_km / (KM_PER_DEG * max(0.2, math.cos(math.radians(la))))
        lo = minx + dl / 2.0
        while lo < maxx:
            if prepared.contains(Point(lo, la)):
                pts.append((round(la, 4), round(lo, 4)))
            lo += dl
        la += dlat
    return pts, dlat, dlon


def build_grid(geom):
    """Choose the spacing: BASE, grown until <= MAX_POINTS, or shrunk (never below MIN_SPACING_KM) until
    >= TARGET_POINTS. A footprint that still has fewer than MIN_POINTS ends in the marker fallback."""
    sp = BASE_SPACING_KM
    pts, dlat, dlon = _grid(geom, sp)
    guard = 0
    while len(pts) > MAX_POINTS and guard < 12:
        sp *= math.sqrt(len(pts) / MAX_POINTS) * 1.02
        pts, dlat, dlon = _grid(geom, sp)
        guard += 1
    shrink = 0
    while len(pts) < TARGET_POINTS and sp > MIN_SPACING_KM and shrink < 8:
        sp = max(MIN_SPACING_KM, sp * 0.8)
        pts, dlat, dlon = _grid(geom, sp)
        shrink += 1
    return pts, round(sp, 2)


# --------------------------------------------------------------------------- API


_lim_lock = threading.Lock()
_last = [0.0]


def _polite():
    """Block until DELAY_S has passed since the previous request of ANY thread started."""
    with _lim_lock:
        wait = _last[0] + DELAY_S - time.monotonic()
        if wait > 0:
            time.sleep(wait)
        _last[0] = time.monotonic()


def query_point(lat: float, lon: float):
    """One GSA LTA request (3 tries). Returns (point dict, metadata dict) or (None, error text)."""
    url = API.format(lat=lat, lon=lon)
    err = None
    for attempt in range(1, TRIES + 1):
        _polite()
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "land-selection-framework-evidence/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.load(r)
            a = d["annual"]["data"]
            pv = a["PVOUT_csi"]
            if not isinstance(pv, (int, float)) or not math.isfinite(pv) or not 100 < pv < 3500:
                raise ValueError(f"implausible PVOUT_csi {pv!r}")
            md = d["annual"].get("metadata", {})
            meta = {"data_version": (md.get("version") or {}).get("data"),
                    "pvout_layer": (md.get("layers") or {}).get("PVOUT_csi")}
            return ({"lat": lat, "lon": lon, "pvout": float(pv), "ghi": a.get("GHI"), "ele": a.get("ELE"),
                     "temp": a.get("TEMP")}, meta)
        except Exception as exc:  # noqa: BLE001
            err = f"{type(exc).__name__}: {str(exc)[:160]}"
            if attempt < TRIES:
                time.sleep(1.5 * attempt)
    return None, err


# --------------------------------------------------------------------------- compute


def _stats(vals):
    import numpy as np
    v = np.array(vals, dtype="float64")
    return {"mean": float(v.mean()), "median": float(np.median(v)), "min": float(v.min()), "max": float(v.max()),
            "p10": float(np.percentile(v, 10)), "p90": float(np.percentile(v, 90))}


def compute_region(rid: str, geom) -> dict:
    marker = registry()[rid]["marker"]
    pts, spacing = build_grid(geom)
    meta, ok, failed = None, [], []
    for la, lo in pts:
        p, m = query_point(la, lo)
        if p is None:
            failed.append({"lat": la, "lon": lo, "error": m})
        else:
            ok.append(p)
            meta = meta or m
    at_marker, mm = query_point(round(float(marker[1]), 4), round(float(marker[0]), 4))
    if at_marker is None:
        at_marker = None
        marker_err = mm
    else:
        marker_err = None
        meta = meta or mm
    res = {"grid_points": len(pts), "grid_spacing_km": spacing, "n_ok": len(ok), "n_failed": len(failed),
           "failed_points": failed[:10], "at_marker": at_marker, "marker_error": marker_err,
           "meta": meta, "points": ok, "marker_fallback": False}
    if len(ok) >= MIN_POINTS:
        pv = _stats([p["pvout"] for p in ok])
        ele = [p["ele"] for p in ok if isinstance(p.get("ele"), (int, float))]
        res["pvout"] = pv
        if ele:
            e = _stats(ele)
            res["elevation_m"] = {"mean": e["mean"], "median": e["median"], "min": e["min"], "max": e["max"],
                                  "p10": e["p10"], "p90": e["p90"]}
        ghi = [p["ghi"] for p in ok if isinstance(p.get("ghi"), (int, float))]
        if ghi:
            res["ghi_mean"] = float(sum(ghi) / len(ghi))
        res["n_ele_le_0"] = sum(1 for p in ok if isinstance(p.get("ele"), (int, float)) and p["ele"] <= 0)
    elif at_marker is not None:
        res["marker_fallback"] = True
        v = at_marker["pvout"]
        res["pvout"] = {"mean": v, "median": v, "min": v, "max": v, "p10": v, "p90": v}
    return res


def cached_region(rid: str, geom, gsha: str, refresh: bool) -> dict:
    c = None if refresh else read_json(CACHE / f"{rid}.json")
    pts, spacing = build_grid(geom)
    grid_key = f"{spacing}/{len(pts)}"     # the grid actually used: a changed rule re-queries only the regions it changes
    if c and c.get("geometrySha256") == gsha and c.get("grid_key") == grid_key and "pvout" in c:
        return c
    t0 = time.time()
    res = compute_region(rid, geom)
    res.update({"geometrySha256": gsha, "grid_key": grid_key, "retrieved": now_iso(),
                "retrieved_date": _dt.date.today().isoformat(), "seconds": round(time.time() - t0)})
    if "pvout" in res:   # never cache a total failure
        write_json(CACHE / f"{rid}.json", res)
    return res


def build_doc(rid: str, geom, res: dict | None, error: str | None) -> dict:
    doc = {
        "stage": STAGE, "region": rid, "status": "failed", "error": error, "generated": now_iso(),
        "retrieved": (res or {}).get("retrieved_date") or _dt.date.today().isoformat(),
        "footprint": footprint_block(rid, geom),
        "method": "footprint-zonal",
        "methodNote": "mean of PVOUT_csi over a regular isotropic point grid inside the footprint (one GSA long-term-average "
                      "request per point); marker-only when fewer than %d grid points are available" % MIN_POINTS,
        "metric": "Long-term average photovoltaic output (PVOUT, kWh per kWp per year)",
        "unit": "kWh/kWp/yr",
        "vintage": "long-term average (GSA, data version as returned by the API)",
        "source": "Global Solar Atlas 2.0 (World Bank Group / ESMAP, data by Solargis)", "sourceUrl": SRC_URL,
        "sourceId": "gsa-pvout", "license": "CC BY 4.0", "licenseUrl": LICENCE_URL,
        "value": None, "marker_fallback": False,
    }
    if res is None:
        return doc
    meta = res.get("meta") or {}
    layer = meta.get("pvout_layer") or {}
    doc["gsa_data_version"] = meta.get("data_version")
    doc["pvout_period"] = layer.get("period")
    doc["pvout_layer_updated"] = layer.get("updated")
    doc["pvout_layer_unit"] = layer.get("unit")
    if "pvout" not in res:
        doc["error"] = (f"no usable response: {res['n_ok']} of {res['grid_points']} grid points and the marker failed"
                        f" ({res.get('marker_error') or 'no error text'})")
        doc["grid_points"], doc["n_failed"] = res["grid_points"], res["n_failed"]
        return doc
    pv = res["pvout"]
    doc["value"] = pv["mean"]
    doc["value_rounded"] = int(round(pv["mean"]))
    for k in ("median", "min", "max", "p10", "p90"):
        doc[k] = pv[k]
    doc["n_points"] = res["n_ok"]
    doc["grid_points"] = res["grid_points"]
    doc["n_failed"] = res["n_failed"]
    doc["grid_spacing_km"] = res["grid_spacing_km"]
    doc["politeness_delay_s"] = DELAY_S
    doc["tries_per_point"] = TRIES
    doc["marker_fallback"] = res["marker_fallback"]
    doc["at_marker"] = res["at_marker"]
    if res.get("elevation_m"):
        doc["elevation_m"] = res["elevation_m"]
        doc["n_ele_le_0"] = res.get("n_ele_le_0", 0)
    if res.get("ghi_mean") is not None:
        doc["ghi_mean_kwh_m2"] = res["ghi_mean"]
    if res["n_failed"]:
        doc["failed_points_sample"] = res["failed_points"]
    doc["points"] = res["points"]
    doc["trajectory"] = {
        "status": "not_available", "direction": None,
        "basis": "the Global Solar Atlas product is a long-term average; it carries no regional trend"}
    if res["marker_fallback"]:
        doc["status"] = "fallback"
        doc["error"] = (f"only {res['n_ok']} valid grid point(s) (minimum {MIN_POINTS}) of {res['grid_points']} tried; "
                        "value is the footprint marker point alone, not a footprint mean")
    elif res["grid_points"] and res["n_failed"] / res["grid_points"] > MAX_FAIL_FRAC:
        doc["status"] = "fallback"
        doc["error"] = (f"{res['n_failed']} of {res['grid_points']} grid points failed after {TRIES} tries "
                        f"(more than {int(MAX_FAIL_FRAC * 100)} percent); the mean uses the {res['n_ok']} that answered")
    else:
        doc["status"] = "ok"
        doc["error"] = None
    return doc


def run(region_ids: list[str], out_dir: Path, refresh: bool = False, workers: int = 5) -> dict[str, dict]:
    t0 = time.time()
    geoms = {rid: load_footprint(rid) for rid in region_ids}

    def job(rid: str) -> dict:
        g = geoms[rid]
        try:
            res = cached_region(rid, g, geom_sha(g), refresh)
            doc = build_doc(rid, g, res, None)
        except Exception as exc:  # noqa: BLE001
            doc = build_doc(rid, g, None, f"{type(exc).__name__}: {str(exc)[:400]}")
        write_json(out_dir / rid / "solar.json", doc)
        v = doc.get("value")
        log(f"[solar] {rid:<26} {doc['status']:<8} PVOUT={'-' if v is None else round(v)} kWh/kWp "
            f"n={doc.get('n_points', 0)}/{doc.get('grid_points', 0)}{'  ' + doc['error'] if doc['error'] else ''}")
        return doc

    log(f"[solar] {len(region_ids)} region(s), workers={workers}, politeness {DELAY_S}s between any two requests")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        docs = dict(zip(region_ids, pool.map(job, region_ids)))
    log(f"[solar] done in {time.time() - t0:.0f}s")
    return docs


# --------------------------------------------------------------------------- verify / cli


def verify_outputs(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    for rid in region_ids:
        p = out_dir / rid / "solar.json"
        d = read_json(p)
        if d is None:
            problems.append(f"{rid}: {p} missing or unreadable")
            continue
        st = d.get("status")
        if st not in STATUSES:
            problems.append(f"{rid}: bad status {st!r}")
            continue
        if st != "ok" and not d.get("error"):
            problems.append(f"{rid}: status {st} without an error text")
        if st == "failed" and d.get("value") is not None:
            problems.append(f"{rid}: failed status carries a value")
        if st in ("ok", "fallback") and d.get("value") is not None:
            v = d["value"]
            if not isinstance(v, (int, float)) or not math.isfinite(v) or not 300 < v < 2800:
                problems.append(f"{rid}: implausible PVOUT {v!r} kWh/kWp/yr")
            n = d.get("n_points")
            if st == "ok":
                if not isinstance(n, int) or n < MIN_POINTS:
                    problems.append(f"{rid}: ok status with {n} grid points (< {MIN_POINTS})")
                if d.get("marker_fallback"):
                    problems.append(f"{rid}: ok status with marker_fallback")
                if not (d["p10"] <= d["median"] <= d["p90"] and d["min"] <= d["p10"] and d["p90"] <= d["max"]):
                    problems.append(f"{rid}: percentile ordering broken")
                if len(d.get("points", [])) != n:
                    problems.append(f"{rid}: points list length {len(d.get('points', []))} != n_points {n}")
            elif d.get("marker_fallback") is not True and (not isinstance(n, int) or n < MIN_POINTS):
                problems.append(f"{rid}: fewer than {MIN_POINTS} points without the marker_fallback flag")
            if not d.get("retrieved") or not d.get("gsa_data_version"):
                problems.append(f"{rid}: retrieval date or GSA data version missing")
    return problems


def anchor_check(out_dir: Path, region_ids: list[str]) -> list[str]:
    """Compare with the per-region packages' own solar_result.json (same API, grids differ in
    spacing and offset): within ANCHOR_TOL. Only the regions that have a package result."""
    problems = []
    for rid in region_ids:
        ref = read_json(U / "regions" / rid / "raw" / "solar_result.json")
        d = read_json(out_dir / rid / "solar.json")
        if not ref or not d or d.get("value") is None or d.get("marker_fallback"):
            continue
        r = ref.get("mean")
        if not isinstance(r, (int, float)):
            continue
        if abs(d["value"] - r) / r > ANCHOR_TOL:
            problems.append(f"{rid}: PVOUT {d['value']:.0f} differs from the package result {r:.0f} by more than "
                            f"{int(ANCHOR_TOL * 100)} percent")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--regions", default=None, help="comma-separated region ids, or 'all' (required unless --verify DIR)")
    ap.add_argument("--out", default=None, help="evidence-out directory")
    ap.add_argument("--verify", nargs="?", const="", default=None, metavar="DIR",
                    help="DIR: verify-only on that evidence-out directory; bare flag: run, then verify")
    ap.add_argument("--refresh", action="store_true", help="ignore cached per-region results")
    ap.add_argument("--workers", type=int, default=5)
    a = ap.parse_args(argv)

    if a.verify:  # verify-only
        out = Path(a.verify)
        if not out.is_dir():
            raise SystemExit(f"--verify needs an existing evidence-out directory (got {str(out)!r})")
        ids = resolve_regions(a.regions or "all")
        problems = verify_outputs(out, ids) + anchor_check(out, ids)
        write_report_b(out)
        for p in problems:
            log(f"[solar] PROBLEM: {p}")
        tot = {s: sum(1 for rid in ids if (read_json(out / rid / "solar.json") or {}).get("status") == s) for s in STATUSES}
        print(json.dumps({"stage": STAGE, "verify": str(out), "regions": len(ids), "totals": tot, "problems": problems}))
        return 1 if problems else 0

    if not a.regions or not a.out:
        raise SystemExit("--regions and --out are required when running the stage")
    ids = resolve_regions(a.regions)
    out = Path(a.out)
    docs = run(ids, out, refresh=a.refresh, workers=a.workers)
    problems = verify_outputs(out, ids) if a.verify is not None else []
    problems += anchor_check(out, ids)
    for rid in ids:
        if docs[rid]["status"] == "failed" and rid in ("alentejo", "finger-lakes"):
            problems.append(f"{rid}: solar failed: {docs[rid]['error']}")
    write_report_b(out)
    for p in problems:
        log(f"[solar] PROBLEM: {p}")
    tot = {s: sum(1 for d in docs.values() if d["status"] == s) for s in STATUSES}
    print(json.dumps({"stage": STAGE, "totals": tot, "problems": problems}))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
