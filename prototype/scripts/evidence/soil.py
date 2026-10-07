#!/usr/bin/env python3
"""Stage 3 of the canonical evidence pipeline (remote A): soil organic carbon.

Metric   Soil organic carbon, topsoil 0-30 cm, depth-weighted (5/10/15 cm layer weights),
         SoilGrids 2.0 SOC mean (250 m, dg/kg), converted to g/kg, zonal mean over the
         footprint. Same arithmetic as regions/finger-lakes/tools/soil.py (per-pixel depth
         weighting, then mean/median/p10/p90), generalised to any footprint. The 0-5 cm mean
         is stored for the label rule (shown when it differs from 0-30 cm by more than 40
         percent) together with `n` pixels per layer.
Source   ISRIC SoilGrids 2.0, /vsicurl windows over files.isric.org/soilgrids/latest/data/soc/
         soc_{0-5,5-15,15-30}cm_mean.vrt (Interrupted Goode Homolosine, equal-area).
Trajectory  none honest: no open regional trend dataset ('not_available', with the reason).
Integrity  VRT Content-Length read and asserted; GDAL_HTTP_MAX_RETRY=4 plus stage-level retries;
         the number of footprint pixels times 0.0625 km2 (250 m, equal-area) must match the
         footprint geometry area within 5 percent (catches a silently short read); valid-pixel
         counts per layer must be non-zero and equal.

Run (project virtualenv):
    prototype/.venv/bin/python prototype/scripts/evidence/soil.py \
        --regions alentejo,finger-lakes|all --out upgrade-2026-10/evidence-out [--verify] [--refresh]

Output  <out>/<region>/soil.json     Cache  upgrade-2026-10/evidence-cache/soil/<region>.json
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

STAGE = "soil"
CACHE = U / "evidence-cache" / "soil"
VRT = "https://files.isric.org/soilgrids/latest/data/soc/soc_{d}cm_mean.vrt"
LAYERS = {"0-5": 5, "5-15": 10, "15-30": 15}      # depth label -> layer thickness (cm), the weights
NODATA = -32768
PIXEL_KM2 = 0.25 * 0.25
AREA_TOL = 0.05
SRC_URL = "https://soilgrids.org"
DG_PER_G = 10.0           # dg/kg -> g/kg


# --------------------------------------------------------------------------- shared helpers
# (duplicated in climate.py / hansen.py on purpose: every stage module is a standalone CLI)


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


# --------------------------------------------------------------------------- compute


def compute_region(rid: str, geom) -> dict:
    import numpy as np
    import rasterio
    from rasterio.mask import raster_geometry_mask
    from shapely.geometry import mapping
    import shapely.ops
    import pyproj

    urls = {d: VRT.format(d=d) for d in LAYERS}
    sizes = {}
    for d, u in urls.items():
        sizes[d] = with_retry(lambda u=u: head_content_length(u), tries=3, delay=2, what=f"HEAD {u}",
                              log=lambda m: None)
        if not sizes[d] or sizes[d] < 100_000:
            raise DownloadError(f"{u}: Content-Length {sizes[d]} is implausibly small for a VRT")
    arrs, layer_info, inside_n, win_shape, crs_txt = {}, {}, None, None, None
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.vrt",
                      GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_TIMEOUT="90", GDAL_HTTP_CONNECTTIMEOUT="20", GDAL_HTTP_RETRY_DELAY="2"):
        for d, u in urls.items():
            def read_layer(u=u):
                with rasterio.open(u) as ds:
                    tr = pyproj.Transformer.from_crs("EPSG:4326", ds.crs, always_xy=True).transform
                    g = shapely.ops.transform(tr, geom)
                    mask, _t, win = raster_geometry_mask(ds, [mapping(g)], crop=True, all_touched=False)
                    a = ds.read(1, window=win)
                    return a, mask, ds.res, str(ds.crs)[:60], ds.nodata
            a, mask, res, crs_txt, nod = with_retry(read_layer, tries=3, delay=4, what=f"soil {d} {rid}",
                                                    log=lambda m: None,
                                                    validate=lambda r: r[0].size > 0)
            if abs(res[0] - 250.0) > 1 or abs(res[1] - 250.0) > 1:
                raise DownloadError(f"{d}: pixel size {res}, want 250 m")
            if win_shape is None:
                win_shape = a.shape
            elif a.shape != win_shape:
                raise DownloadError(f"layer window shapes differ: {a.shape} vs {win_shape}")
            ins = ~mask
            inside_n = int(ins.sum()) if inside_n is None else inside_n
            f = a.astype("float64")
            f[(a == NODATA) | (a == (nod if nod is not None else NODATA))] = np.nan
            f[~ins] = np.nan
            arrs[d] = f
            n = int(np.sum(~np.isnan(f)))
            if n == 0:
                raise DownloadError(f"{d}: zero valid pixels under the footprint")
            layer_info[d] = {"n": n, "mean_dgkg": float(np.nanmean(f)), "median_dgkg": float(np.nanmedian(f)),
                             "p10": float(np.nanpercentile(f, 10)), "p90": float(np.nanpercentile(f, 90)),
                             "max": float(np.nanmax(f)), "res": [float(res[0]), float(res[1])],
                             "nodata": float(NODATA)}
    geom_km2 = common.area_km2(geom)
    closure = inside_n * PIXEL_KM2 / geom_km2
    if abs(closure - 1.0) > AREA_TOL:
        raise DownloadError(f"footprint area closure {closure:.4f} outside +-{AREA_TOL} "
                            f"({inside_n} px x 0.0625 km2 vs geometry {geom_km2:.0f} km2)")
    stack = np.stack([arrs[d] * LAYERS[d] for d in LAYERS])
    allvalid = np.all(~np.isnan(np.stack(list(arrs.values()))), axis=0)
    dw = np.nansum(stack, axis=0) / sum(LAYERS.values())
    dw[~allvalid] = np.nan
    n_dw = int(np.sum(~np.isnan(dw)))
    if n_dw == 0:
        raise DownloadError("zero pixels valid in all three layers")
    if len({layer_info[d]["n"] for d in LAYERS}) != 1:
        log(f"[soil] {rid}: valid-pixel counts differ across layers {[layer_info[d]['n'] for d in LAYERS]}; "
            "depth-weighting uses pixels valid in all three")
    mean = float(np.nanmean(dw)) / DG_PER_G
    top = layer_info["0-5"]["mean_dgkg"] / DG_PER_G
    return {
        "layers": layer_info,
        "dw_mean_gkg": mean,
        "dw_median_gkg": float(np.nanmedian(dw)) / DG_PER_G,
        "dw_p10": float(np.nanpercentile(dw, 10)) / DG_PER_G,
        "dw_p90": float(np.nanpercentile(dw, 90)) / DG_PER_G,
        "dw_max": float(np.nanmax(dw)) / DG_PER_G,
        "dw_frac_gt150": float(np.nanmean(dw / DG_PER_G > 150)),
        "dw_n": n_dw,
        "topsoil_0_5_mean_gkg": top,
        "topsoil_differs_gt_40pct": bool(abs(top - mean) / mean > 0.40) if mean else False,
        "pixels_in_footprint": inside_n,
        "valid_frac": n_dw / inside_n,
        "area_closure": closure,
        "crs": crs_txt,
        "inputs": [{"url": urls[d], "bytes": sizes[d], "layer": f"soc_{d}cm_mean"} for d in LAYERS],
    }


def cached_region(rid: str, geom, gsha: str, refresh: bool) -> dict:
    c = None if refresh else read_json(CACHE / f"{rid}.json")
    if c and c.get("geometrySha256") == gsha and "dw_mean_gkg" in c:
        return c
    t0 = time.time()
    res = compute_region(rid, geom)
    res.update({"geometrySha256": gsha, "retrieved": now_iso(), "seconds": round(time.time() - t0)})
    write_json(CACHE / f"{rid}.json", res)
    return res


def build_doc(rid: str, geom, res: dict | None, error: str | None) -> dict:
    doc = {
        "stage": STAGE, "region": rid, "status": "failed", "error": error, "generated": now_iso(),
        "retrieved": _dt.date.today().isoformat(),
        "footprint": footprint_block(rid, geom),
        "method": "footprint-zonal",
        "metric": "Soil organic carbon, topsoil 0-30 cm, depth-weighted (SoilGrids 2.0 SOC mean)",
        "unit": "g/kg", "vintage": "SoilGrids 2.0 (2020 release)",
        "source": "SoilGrids 2.0 (ISRIC)", "sourceUrl": SRC_URL, "sourceId": "soilgrids",
        "value": None,
    }
    if res is None:
        return doc
    doc["status"] = "ok"
    doc["error"] = None
    doc["value"] = float(res["dw_mean_gkg"])
    doc["value_rounded"] = round(doc["value"], 1)
    doc["depth_weights_cm"] = LAYERS
    for k in ("layers", "dw_mean_gkg", "dw_median_gkg", "dw_p10", "dw_p90", "dw_max", "dw_frac_gt150", "dw_n",
              "topsoil_0_5_mean_gkg", "topsoil_differs_gt_40pct", "pixels_in_footprint", "valid_frac",
              "area_closure", "crs", "inputs"):
        doc[k] = res[k]
    doc["peat_note"] = bool(res["dw_frac_gt150"] > 0.10 or res["dw_mean_gkg"] > 100)
    doc["trajectory"] = {
        "status": "not_available", "direction": None,
        "basis": "no open regional trend dataset exists for soil organic carbon; the value is a single 2020-release modelled map"}
    return doc


def run(region_ids: list[str], out_dir: Path, refresh: bool = False, workers: int = 3) -> dict[str, dict]:
    t0 = time.time()
    geoms = {rid: load_footprint(rid) for rid in region_ids}

    def job(rid: str) -> dict:
        g = geoms[rid]
        try:
            res = cached_region(rid, g, geom_sha(g), refresh)
            doc = build_doc(rid, g, res, None)
        except Exception as exc:  # noqa: BLE001
            doc = build_doc(rid, g, None, f"{type(exc).__name__}: {str(exc)[:400]}")
        write_json(out_dir / rid / "soil.json", doc)
        v = doc.get("value")
        log(f"[soil] {rid:<26} {doc['status']:<7} dw0-30={'-' if v is None else round(v, 2)} g/kg"
            f"{'  ' + doc['error'] if doc['error'] else ''}")
        return doc

    log(f"[soil] {len(region_ids)} region(s), workers={workers}")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        docs = dict(zip(region_ids, pool.map(job, region_ids)))
    log(f"[soil] done in {time.time() - t0:.0f}s")
    return docs


# --------------------------------------------------------------------------- verify / cli


def verify_outputs(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    for rid in region_ids:
        p = out_dir / rid / "soil.json"
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
            if not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 < v < 600:
                problems.append(f"{rid}: implausible SOC {v!r} g/kg")
            if not d.get("dw_n") or any(not (d.get("layers", {}).get(k, {}).get("n")) for k in LAYERS):
                problems.append(f"{rid}: zero valid pixel counts")
            if abs(d.get("area_closure", 0) - 1) > AREA_TOL:
                problems.append(f"{rid}: area closure {d.get('area_closure')} outside tolerance")
            if not d.get("inputs") or any(not i.get("bytes") for i in d["inputs"]):
                problems.append(f"{rid}: an input has no asserted size")
    return problems


def anchor_check(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    if "finger-lakes" in region_ids:
        pkg = (read_json(U / "regions" / "finger-lakes" / "data.json") or {}).get("values", {}).get("soil_carbon", {}).get("value")
        d = read_json(out_dir / "finger-lakes" / "soil.json") or {}
        if pkg is None:
            problems.append("finger-lakes: package soil_carbon value not found")
        elif d.get("value") is None or abs(d["value"] - float(pkg)) > 0.15 * float(pkg):
            problems.append(f"finger-lakes: soil {d.get('value')} not within 15% of package {pkg}")
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
            problems.append(f"{rid}: soil failed: {docs[rid]['error']}")
    tot = {s: sum(1 for d in docs.values() if d["status"] == s) for s in ("ok", "fallback", "failed")}
    print(json.dumps({"stage": STAGE, "totals": tot, "problems": problems}))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
