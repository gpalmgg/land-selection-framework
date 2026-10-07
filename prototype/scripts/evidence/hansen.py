#!/usr/bin/env python3
"""Stage 2 of the canonical evidence pipeline (remote A): Hansen forest change.

Metric   Net tree-cover change per decade: Hansen gain 2000-2012 minus gross loss 2001-2023,
         as a percent of the footprint's year-2000 canopy (treecover2000 >= 30 percent),
         divided by 2.3 decades. Same arithmetic as regions/finger-lakes/tools/hansen.py
         (plain pixel counts, loss counted over canopy pixels, gain over all footprint pixels),
         generalised to any footprint and to footprints that span several 10-degree tiles.
         Understates regrowth after 2012 (Hansen gain ends in 2012): the cell text says so.
Source   Hansen/UMD/Google/USGS/NASA Global Forest Change v1.11 (2000-2023), read as /vsicurl
         windows (GDAL range requests) from the public Google Cloud Storage bucket.
Trajectory  Annual gross-loss rate 2013-2023 versus 2001-2012 (both also stored as sums, as in
         the region packages). 'steady' when the relative change is under 10 percent.
Integrity  Every tile layer's Content-Length is read and asserted; each strip read is retried;
         the pixels inside the footprint are converted to km2 (row-wise cos-lat areas) and must
         match the footprint geometry's area within 3 percent, which would catch a silently
         truncated or missing window. A secondary area-weighted result is stored beside the
         pixel-count one.

Run (project virtualenv):
    prototype/.venv/bin/python prototype/scripts/evidence/hansen.py \
        --regions alentejo,finger-lakes|all --out upgrade-2026-10/evidence-out [--verify] [--refresh]

Output  <out>/<region>/hansen.json     Cache  upgrade-2026-10/evidence-cache/hansen/<region>.json
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
import time
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402
from common import (U, DownloadError, head_content_length, load_footprint, registry,  # noqa: E402
                    with_retry)

STAGE = "hansen"
CACHE = U / "evidence-cache" / "hansen"
BASE = ("https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/"
        "Hansen_GFC-2023-v1.11_{layer}_{lat}_{lon}.tif")
LAYERS = ("treecover2000", "lossyear", "gain")
CANOPY_MIN = 30           # percent canopy in 2000 that counts as forest
DECADES_LOSS = 2.3        # 2001-2023
AREA_TOL = 0.03           # footprint area closure tolerance
STRIP_ROWS = 500
STEADY_REL = 0.10         # evidence track section 5: loss change under 10 percent relative = steady
SRC_URL = "https://storage.googleapis.com/earthenginepartners-hansen/GFC-2023-v1.11/download.html"
R_KM = 6371.0072          # authalic radius for the cos-lat row areas


# --------------------------------------------------------------------------- shared helpers
# (duplicated in climate.py / soil.py on purpose: every stage module is a standalone CLI)


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


# --------------------------------------------------------------------------- tiles


def tile_names(minx: float, miny: float, maxx: float, maxy: float) -> list[tuple[int, int, str, str]]:
    """Hansen 10-degree tiles (named by their upper-left corner) that the bounds touch."""
    out = []
    for top in range(-90, 90, 10):
        top += 10
        if not (top > miny and top - 10 < maxy):
            continue
        for left in range(-180, 180, 10):
            if not (left + 10 > minx and left < maxx):
                continue
            lat = f"{abs(top):02d}{'N' if top >= 0 else 'S'}"
            lon = f"{abs(left):03d}{'E' if left >= 0 else 'W'}"
            out.append((top, left, lat, lon))
    return out


def _row_areas_km2(top_lat: float, n_rows: int, res_deg: float, ncols_deg: float) -> "np.ndarray":
    import numpy as np
    edges = top_lat - res_deg * np.arange(n_rows + 1)
    s = np.sin(np.radians(edges))
    return R_KM ** 2 * math.radians(ncols_deg) * (s[:-1] - s[1:])


def process_tile(geom, top: int, left: int, lat: str, lon: str) -> dict | None:
    """Accumulate counts for the part of `geom` inside one tile. None when the tile has no data file."""
    import numpy as np
    import rasterio
    from rasterio.features import geometry_mask
    from rasterio.mask import raster_geometry_mask
    from rasterio.windows import Window
    from shapely.geometry import box

    clip = geom.intersection(box(left, top - 10, left + 10, top))
    if clip.is_empty:
        return {"tile": f"{lat}_{lon}", "skipped": "no overlap"}
    urls = {k: BASE.format(layer=k, lat=lat, lon=lon) for k in LAYERS}
    sizes = {}
    for k, u in urls.items():
        try:
            sizes[k] = with_retry(lambda u=u: head_content_length(u), tries=3, delay=2, what=f"HEAD {u}",
                                  log=lambda m: None)
        except DownloadError as exc:
            if "404" in str(exc) or "error: 404" in str(exc):
                return None
            raise
        if not sizes[k] or sizes[k] < 1_000_000:
            raise DownloadError(f"{u}: Content-Length {sizes[k]} is implausibly small")
    acc = {"n_in": 0, "n_forest": 0, "n_loss": 0, "n_gain": 0, "n_gain_forest": 0,
           "loss_year": np.zeros(24, dtype=np.int64),
           "km2_in": 0.0, "km2_forest": 0.0, "km2_loss": 0.0, "km2_gain": 0.0,
           "km2_loss_year": np.zeros(24, dtype=np.float64)}
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif",
                      GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_TIMEOUT="90", GDAL_HTTP_CONNECTTIMEOUT="20", GDAL_HTTP_RETRY_DELAY="2"), \
            ThreadPoolExecutor(max_workers=3) as pool3:
        ds = {k: with_retry(lambda u=u: rasterio.open(u), tries=3, delay=3, what=f"open {u}", log=lambda m: None)
              for k, u in urls.items()}
        try:
            for k, d in ds.items():
                if (d.width, d.height) != (40000, 40000):
                    raise DownloadError(f"{k} {lat}_{lon}: grid {d.width}x{d.height}, want 40000x40000")
            ref = ds["treecover2000"]
            res = abs(ref.res[1])
            full_mask, _t, win = raster_geometry_mask(ref, [clip.__geo_interface__], crop=True, all_touched=False)
            del full_mask
            r0, r1 = int(win.row_off), int(win.row_off + win.height)
            c0, c1 = int(win.col_off), int(win.col_off + win.width)
            for s0 in range(r0, r1, STRIP_ROWS):
                s1 = min(r1, s0 + STRIP_ROWS)
                w = Window(c0, s0, c1 - c0, s1 - s0)
                tr = ref.window_transform(w)
                inside = geometry_mask([clip.__geo_interface__], out_shape=(s1 - s0, c1 - c0), transform=tr,
                                       all_touched=False, invert=True)
                if not inside.any():
                    continue

                def read(k):
                    return with_retry(lambda: ds[k].read(1, window=w), tries=3, delay=2,
                                      what=f"read {k} {lat}_{lon} rows {s0}-{s1}", log=lambda m: None,
                                      validate=lambda a: a.shape == (s1 - s0, c1 - c0))
                # the tiles are stored one row per block (40000 px wide), so a strip read is bound by network
                # latency: read the three layers concurrently (each has its own dataset handle)
                tc, ly, gn = (f.result() for f in [pool3.submit(read, k) for k in LAYERS])
                forest = inside & (tc >= CANOPY_MIN)
                loss = forest & (ly > 0) & (ly <= 23)
                gain = inside & (gn == 1)
                gain_f = forest & (gn == 1)
                rows = _row_areas_km2(tr.f, s1 - s0, res, abs(tr.a))
                wgt = np.broadcast_to(rows[:, None], inside.shape)
                acc["n_in"] += int(inside.sum())
                acc["n_forest"] += int(forest.sum())
                acc["n_loss"] += int(loss.sum())
                acc["n_gain"] += int(gain.sum())
                acc["n_gain_forest"] += int(gain_f.sum())
                acc["loss_year"] += np.bincount(ly[loss], minlength=24)[:24]
                acc["km2_in"] += float(rows @ inside.sum(axis=1))
                acc["km2_forest"] += float(rows @ forest.sum(axis=1))
                acc["km2_loss"] += float(rows @ loss.sum(axis=1))
                acc["km2_gain"] += float(rows @ gain.sum(axis=1))
                acc["km2_loss_year"] += np.bincount(ly[loss], weights=wgt[loss], minlength=24)[:24]
        finally:
            for d in ds.values():
                d.close()
    acc["tile"] = f"{lat}_{lon}"
    acc["inputs"] = [{"url": urls[k], "bytes": sizes[k], "layer": k} for k in LAYERS]
    return acc


def combine(parts: list[dict]) -> dict:
    import numpy as np
    tot = {"n_in": 0, "n_forest": 0, "n_loss": 0, "n_gain": 0, "n_gain_forest": 0,
           "km2_in": 0.0, "km2_forest": 0.0, "km2_loss": 0.0, "km2_gain": 0.0}
    ly = np.zeros(24, dtype=np.int64)
    kly = np.zeros(24, dtype=np.float64)
    for p in parts:
        for k in tot:
            tot[k] += p[k]
        ly += p["loss_year"]
        kly += p["km2_loss_year"]
    tot["loss_year"] = ly
    tot["km2_loss_year"] = kly
    return tot


def derive(t: dict) -> dict:
    """The region-package arithmetic (counts), plus the same numbers area-weighted."""
    nf = t["n_forest"]
    out = {"pixels_in": t["n_in"], "forest_pixels": nf,
           "forest_frac": t["n_forest"] / t["n_in"]}
    loss_pct = 100.0 * t["n_loss"] / nf
    gain_pct = 100.0 * t["n_gain"] / nf
    gain_in_forest = 100.0 * t["n_gain_forest"] / nf
    by_year = {str(2000 + i): round(100.0 * float(t["loss_year"][i]) / nf, 3) for i in range(1, 24)}
    out.update({
        "loss_pct_of_forest_2001_2023": loss_pct,
        "gain_pct_of_forest_2000_2012": gain_pct,
        "gain_in_forest_pct": gain_in_forest,
        "loss_by_year_pct": by_year,
        "loss_per_decade": loss_pct / DECADES_LOSS,
        "gain_per_decade_if_over_23y": gain_pct / DECADES_LOSS,
        "net_pct_per_decade": (gain_pct - loss_pct) / DECADES_LOSS,
        "net_pct_per_decade_gain_in_forest_only": (gain_in_forest - loss_pct) / DECADES_LOSS,
        "loss_2001_2012": float(sum(100.0 * float(t["loss_year"][i]) / nf for i in range(1, 13))),
        "loss_2013_2023": float(sum(100.0 * float(t["loss_year"][i]) / nf for i in range(13, 24))),
    })
    out["loss_per_year_2001_2012"] = out["loss_2001_2012"] / 12.0
    out["loss_per_year_2013_2023"] = out["loss_2013_2023"] / 11.0
    kf = t["km2_forest"]
    lw = 100.0 * t["km2_loss"] / kf if kf else 0.0
    gw = 100.0 * t["km2_gain"] / kf if kf else 0.0
    out["area_weighted"] = {"footprint_km2": t["km2_in"], "forest_km2": kf,
                            "loss_pct_of_forest_2001_2023": lw, "gain_pct_of_forest_2000_2012": gw,
                            "net_pct_per_decade": (gw - lw) / DECADES_LOSS}
    return out


def _direction(early: float, late: float) -> tuple[str, float | None]:
    if early <= 0:
        return ("rising" if late > 0 else "steady"), None
    rel = (late - early) / early
    if abs(rel) < STEADY_REL:
        return "steady", rel
    return ("rising" if rel > 0 else "falling"), rel


def compute_region(rid: str, geom) -> dict:
    minx, miny, maxx, maxy = geom.bounds
    tiles = tile_names(minx, miny, maxx, maxy)
    parts, used, missing, inputs = [], [], [], []
    for top, left, lat, lon in tiles:
        p = process_tile(geom, top, left, lat, lon)
        if p is None:
            missing.append(f"{lat}_{lon}")
        elif "skipped" in p:
            continue
        else:
            parts.append(p)
            used.append(p["tile"])
            inputs += p["inputs"]
    if not parts:
        raise DownloadError(f"no Hansen tile data for {rid} (tiles tried: {[f'{a}_{b}' for _, _, a, b in tiles]})")
    t = combine(parts)
    if t["n_in"] == 0 or t["n_forest"] == 0:
        raise DownloadError(f"zero footprint/forest pixels (n_in={t['n_in']}, n_forest={t['n_forest']})")
    geom_km2 = common.area_km2(geom)
    closure = t["km2_in"] / geom_km2
    if abs(closure - 1.0) > AREA_TOL:
        raise DownloadError(f"footprint area closure {closure:.4f} outside +-{AREA_TOL} "
                            f"(raster {t['km2_in']:.0f} km2 vs geometry {geom_km2:.0f} km2; missing tiles {missing})")
    res = derive(t)
    res.update({"tiles_used": used, "tiles_without_data_file": missing, "area_closure": closure,
                "inputs": inputs})
    return res


def cached_region(rid: str, geom, gsha: str, refresh: bool) -> dict:
    c = None if refresh else read_json(CACHE / f"{rid}.json")
    if c and c.get("geometrySha256") == gsha and "net_pct_per_decade" in c:
        return c
    t0 = time.time()
    res = compute_region(rid, geom)
    res.update({"geometrySha256": gsha, "retrieved": now_iso(), "seconds": round(time.time() - t0)})
    write_json(CACHE / f"{rid}.json", res)
    return res


def build_doc(rid: str, geom, gsha: str, res: dict | None, error: str | None) -> dict:
    doc = {
        "stage": STAGE, "region": rid, "status": "failed", "error": error, "generated": now_iso(),
        "retrieved": _dt.date.today().isoformat(),
        "footprint": footprint_block(rid, geom),
        "method": "footprint-zonal",
        "metric": ("Net tree-cover change per decade: Hansen gain 2000-2012 minus gross loss 2001-2023, "
                   "% of year-2000 canopy (>= 30 percent)"),
        "unit": "%/decade", "vintage": "2001–2023",
        "source": "Hansen Global Forest Change v1.11", "sourceUrl": SRC_URL, "sourceId": "hansen-gfc",
        "value": None,
    }
    if res is None:
        return doc
    doc["status"] = "ok"
    doc["error"] = None
    doc["value"] = float(res["net_pct_per_decade"])
    doc["value_rounded"] = round(doc["value"], 1)
    doc["canopy_threshold_pct"] = CANOPY_MIN
    for k in ("pixels_in", "forest_pixels", "forest_frac", "loss_pct_of_forest_2001_2023",
              "gain_pct_of_forest_2000_2012", "gain_in_forest_pct", "loss_per_decade",
              "gain_per_decade_if_over_23y", "net_pct_per_decade", "net_pct_per_decade_gain_in_forest_only",
              "loss_2001_2012", "loss_2013_2023", "loss_per_year_2001_2012", "loss_per_year_2013_2023",
              "loss_by_year_pct", "area_weighted", "area_closure", "tiles_used", "tiles_without_data_file",
              "inputs"):
        doc[k] = res[k]
    direction, rel = _direction(res["loss_per_year_2001_2012"], res["loss_per_year_2013_2023"])
    doc["trajectory"] = {
        "status": "measured", "direction": direction,
        "delta": round(res["loss_per_year_2013_2023"] - res["loss_per_year_2001_2012"], 3), "unit": "% of canopy per year",
        "basis": ("annual gross loss 2013–2023 versus 2001–2012, as a share of the footprint's year-2000 canopy "
                  "(direction = loss rate rising or falling; Hansen gain ends in 2012)"),
        "relative_change": rel,
        "source": "Hansen Global Forest Change v1.11 (annual loss series)", "sourceUrl": SRC_URL,
        "sourceId": "hansen-gfc", "vintage": "2013–2023 vs 2001–2012"}
    doc["computed_at"] = res.get("retrieved")
    return doc


def run(region_ids: list[str], out_dir: Path, refresh: bool = False, workers: int = 3) -> dict[str, dict]:
    t0 = time.time()
    geoms = {rid: load_footprint(rid) for rid in region_ids}

    def job(rid: str) -> dict:
        g = geoms[rid]
        gsha = geom_sha(g)
        try:
            res = cached_region(rid, g, gsha, refresh)
            doc = build_doc(rid, g, gsha, res, None)
        except Exception as exc:  # noqa: BLE001
            doc = build_doc(rid, g, gsha, None, f"{type(exc).__name__}: {str(exc)[:400]}")
        write_json(out_dir / rid / "hansen.json", doc)
        v = doc.get("value")
        log(f"[hansen] {rid:<26} {doc['status']:<7} net={'-' if v is None else round(v, 3)} %/dec"
            f"{'  ' + doc['error'] if doc['error'] else ''}")
        return doc

    log(f"[hansen] {len(region_ids)} region(s), workers={workers}")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        docs = dict(zip(region_ids, pool.map(job, region_ids)))
    log(f"[hansen] done in {time.time() - t0:.0f}s")
    return docs


# --------------------------------------------------------------------------- verify / cli


def verify_outputs(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    for rid in region_ids:
        p = out_dir / rid / "hansen.json"
        d = read_json(p)
        if d is None:
            problems.append(f"{rid}: {p} missing or unreadable")
            continue
        st = d.get("status")
        if st not in ("ok", "fallback", "failed"):
            problems.append(f"{rid}: bad status {st!r}")
            continue
        if st != "ok" and not d.get("error"):
            problems.append(f"{rid}: status {st} without an error text")
        if st == "failed" and d.get("value") is not None:
            problems.append(f"{rid}: failed status carries a value")
        if st in ("ok", "fallback"):
            v = d.get("value")
            if not isinstance(v, (int, float)) or not math.isfinite(v) or not -20 < v < 10:
                problems.append(f"{rid}: implausible net %/decade {v!r}")
            if not d.get("pixels_in") or not d.get("forest_pixels"):
                problems.append(f"{rid}: zero pixel counts")
            if abs(d.get("area_closure", 0) - 1) > AREA_TOL:
                problems.append(f"{rid}: area closure {d.get('area_closure')} outside tolerance")
            if not d.get("inputs") or any(not i.get("bytes") for i in d["inputs"]):
                problems.append(f"{rid}: an input has no asserted size")
            if not (0 < d.get("forest_frac", 0) <= 1):
                problems.append(f"{rid}: forest_frac out of range")
    return problems


def anchor_check(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    if "finger-lakes" in region_ids:
        pkg = (read_json(U / "regions" / "finger-lakes" / "data.json") or {}).get("values", {}).get("forest_change", {}).get("value")
        d = read_json(out_dir / "finger-lakes" / "hansen.json") or {}
        if pkg is None:
            problems.append("finger-lakes: package forest_change value not found")
        elif d.get("value") is None or abs(d["value"] - float(pkg)) > 1.0:
            problems.append(f"finger-lakes: forest {d.get('value')} not within 1.0 %/decade of package {pkg}")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--regions", required=True, help="comma-separated region ids, or 'all'")
    ap.add_argument("--out", required=True, help="evidence-out directory")
    ap.add_argument("--verify", action="store_true", help="after running, check the outputs and the anchors")
    ap.add_argument("--refresh", action="store_true", help="ignore cached per-region results")
    ap.add_argument("--workers", type=int, default=3)
    a = ap.parse_args(argv)
    ids = resolve_regions(a.regions)
    out = Path(a.out)
    docs = run(ids, out, refresh=a.refresh, workers=a.workers)
    problems = verify_outputs(out, ids) if a.verify else []
    problems += anchor_check(out, ids)
    for rid in ids:
        if docs[rid]["status"] == "failed" and rid in ("alentejo", "finger-lakes"):
            problems.append(f"{rid}: hansen failed: {docs[rid]['error']}")
    tot = {s: sum(1 for d in docs.values() if d["status"] == s) for s in ("ok", "fallback", "failed")}
    print(json.dumps({"stage": STAGE, "totals": tot, "problems": problems}))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
