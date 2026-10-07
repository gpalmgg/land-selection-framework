#!/usr/bin/env python3
"""Stage 1 of the canonical evidence pipeline (remote A): climate.

Metric   Mean annual air temperature (BIO1), 2041-2060, SSP2-4.5, WorldClim 2.1 CMIP6
         downscaled 2.5 arc-minute grid, ensemble of the models whose files open.
Method   Zonal mean (all_touched) of BIO1 over the region footprint per model, ensemble
         mean/min/max over models (n_models >= GCM_MIN_OK = 15 or the stage is 'failed').
         Trajectory = ensemble mean minus WorldClim 2.1 historical BIO1 (1970-2000) over the
         SAME footprint cells (bio_1 member pulled once from the WorldClim zip by range requests, size/CRC/sha256 asserted, read locally).
         Same arithmetic as regions/finger-lakes/tools/climate.py + climate_base.py, with the
         footprint taken from data/footprints.json instead of a hard-coded GeoJSON.

Run (project virtualenv):
    prototype/.venv/bin/python prototype/scripts/evidence/climate.py \
        --regions alentejo,finger-lakes|all --out upgrade-2026-10/evidence-out [--verify] [--refresh]

Output  <out>/<region>/climate.json  (status ok | fallback | failed; never a fabricated value)
Cache   upgrade-2026-10/evidence-cache/climate/<model>/<region>.json + worldclim-baseline/ (bio_1 GeoTIFF)

Status semantics (shared by every remote stage)
  ok        full method completed.
  fallback  value computed, but a secondary part is missing (here: baseline unavailable, so the
            trajectory is 'not_available'); the missing part is named in `error`.
  failed    no value; `error` says why. The orchestrating WP decides what to do (reverify value
            or a null cell with nullReason), this script never invents a number.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import hashlib
import io
import json
import math
import os
import subprocess
import sys
import tempfile
import time
import urllib.request
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402
from common import (GCM_KNOWN_404, GCM_MIN_OK, GCMS, U, DownloadError, gcm_url,  # noqa: E402
                    head_content_length, load_footprint, registry, with_retry)

STAGE = "climate"
CACHE = U / "evidence-cache" / "climate"
BASELINE_DIR = U / "evidence-cache" / "worldclim-baseline"
BASELINE_ZIP_URL = "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_2.5m_bio.zip"
BASELINE_MEMBER = "wc2.1_2.5m_bio_1.tif"
BASELINE_TIF = BASELINE_DIR / BASELINE_MEMBER
BASELINE_MANIFEST = BASELINE_DIR / "bio_1.manifest.json"
GRID = (8640, 4320)           # width, height of every 2.5 arc-minute WorldClim grid
GCM_BANDS = 19                # bioc stack: BIO1..BIO19, BIO1 is band 1
STEADY_DELTA_C = 0.2          # evidence track section 5: |delta| < 0.2 C is 'steady'
SRC_URL = "https://www.worldclim.org/data/cmip6/cmip6climate.html"
HIST_URL = "https://www.worldclim.org/data/worldclim21.html"


# --------------------------------------------------------------------------- shared helpers
# (duplicated in hansen.py / soil.py on purpose: every stage module is a standalone CLI)


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


# --------------------------------------------------------------------------- raster reads


def _env(**extra):
    import rasterio
    return rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="EMPTY_DIR", CPL_VSIL_CURL_ALLOWED_EXTENSIONS=".tif,.zip",
                        GDAL_HTTP_MAX_RETRY="4", GDAL_HTTP_TIMEOUT="90", GDAL_HTTP_CONNECTTIMEOUT="20", GDAL_HTTP_RETRY_DELAY="2", **extra)


def zonal_band1(ds, geom, marker, *, check_grid=True) -> dict:
    """Zonal mean of band 1 (all_touched) plus a 3x3 mean at the marker. nodata/NaN/<-1000 dropped."""
    import numpy as np
    from rasterio.mask import raster_geometry_mask
    from rasterio.windows import Window

    if check_grid and (ds.width, ds.height) != GRID:
        raise DownloadError(f"unexpected grid {ds.width}x{ds.height}, want {GRID[0]}x{GRID[1]}")
    mask, _tr, win = raster_geometry_mask(ds, [geom.__geo_interface__], crop=True, all_touched=True)
    a = ds.read(1, window=win).astype("float64")
    a[~np.isfinite(a) | (a < -1000)] = np.nan
    a[mask] = np.nan
    n = int(np.sum(~np.isnan(a)))
    if n == 0:
        raise DownloadError("zero valid cells under the footprint")
    mean = float(np.nanmean(a))
    lon, lat = marker
    row, col = ds.index(lon, lat)
    w = ds.read(1, window=Window(col - 1, row - 1, 3, 3)).astype("float64")
    w[~np.isfinite(w) | (w < -1000)] = np.nan
    m3 = float(np.nanmean(w)) if np.any(~np.isnan(w)) else None
    sha = hashlib.sha256(np.ascontiguousarray(a, dtype="float32").tobytes()).hexdigest()
    return {"zonal_mean": mean, "cells": n, "window_shape": list(a.shape), "window_sha256": sha,
            "marker_3x3": m3}


# --------------------------------------------------------------------------- per-model work


def _head(url: str) -> tuple[int | None, str | None]:
    """(content_length, error). error mentions the HTTP status for a 404."""
    try:
        return with_retry(lambda: head_content_length(url), tries=2, delay=1.5,
                          what=f"HEAD {url}", log=lambda m: None), None
    except DownloadError as exc:
        return None, str(exc)


def model_job(gcm: str, todo: list[tuple[str, object, tuple[float, float], str]], refresh: bool) -> dict:
    """Process one GCM for the regions in `todo` [(rid, geom, marker, geom_sha)].

    Returns {gcm, url, bytes, error, regions: {rid: result|{error}}}. Uses and fills the cache.
    """
    import rasterio
    url = gcm_url(gcm)
    res = {"model": gcm, "url": url, "bytes": None, "error": None, "regions": {}}
    pending = []
    for rid, geom, marker, gsha in todo:
        c = None if refresh else read_json(CACHE / gcm / f"{rid}.json")
        if c and c.get("geometrySha256") == gsha and "zonal_mean" in c:
            res["regions"][rid] = c
            res["bytes"] = c.get("bytes")
        else:
            pending.append((rid, geom, marker, gsha))
    if not pending:
        return res
    size, herr = _head(url)
    if size is None:
        res["error"] = ("HTTP 404: file not hosted at " + url) if herr and "error: 404" in herr else (herr or "no Content-Length")
        # a missing file (404) is a recorded model failure, not a retryable network error
        return res
    if size < 100_000_000:
        res["error"] = f"Content-Length {size} is implausibly small for a 19-band global grid"
        return res
    res["bytes"] = size
    try:
        with _env():
            ds = with_retry(lambda: rasterio.open(url), tries=3, delay=3, what=f"open {gcm}", log=lambda m: None)
            with ds:
                if ds.count != GCM_BANDS:
                    raise DownloadError(f"{gcm}: {ds.count} bands, want {GCM_BANDS}")
                for rid, geom, marker, gsha in pending:
                    try:
                        r = with_retry(lambda: zonal_band1(ds, geom, marker), tries=3, delay=2,
                                       what=f"{gcm}/{rid}", log=lambda m: None)
                    except Exception as exc:  # noqa: BLE001
                        res["regions"][rid] = {"error": str(exc)[:300]}
                        continue
                    r.update({"model": gcm, "url": url, "bytes": size, "geometrySha256": gsha,
                              "retrieved": now_iso()})
                    write_json(CACHE / gcm / f"{rid}.json", r)
                    res["regions"][rid] = r
    except Exception as exc:  # noqa: BLE001
        res["error"] = str(exc)[:300]
    return res


class _HttpRange(io.RawIOBase):
    """Seekable read-only file over HTTP range requests (so one zip member can be pulled without
    downloading the 658 MB archive). Every range response is length-checked and retried."""

    def __init__(self, url: str, size: int, chunk: int = 1 << 20):
        self.url, self.size, self.pos, self.chunk = url, size, 0, chunk

    def readable(self):
        return True

    def seekable(self):
        return True

    def tell(self):
        return self.pos

    def seek(self, off, whence=0):
        self.pos = off if whence == 0 else self.pos + off if whence == 1 else self.size + off
        return self.pos

    def readinto(self, b):
        want = min(len(b), self.size - self.pos, self.chunk)
        if want <= 0:
            return 0
        start, end = self.pos, self.pos + want - 1

        def get():
            req = urllib.request.Request(self.url, headers={"Range": f"bytes={start}-{end}"})
            with urllib.request.urlopen(req, timeout=120) as r:
                d = r.read()
            if len(d) != want:
                raise DownloadError(f"range {start}-{end}: got {len(d)} bytes, want {want}")
            return d
        d = with_retry(get, tries=4, delay=2, what=f"range {start}-{end}", log=lambda m: None)
        b[:want] = d
        self.pos += want
        return want


def fetch_baseline_member(log=log) -> dict:
    """WorldClim 2.1 historical BIO1 (1970-2000, 2.5 arc-min) as a local GeoTIFF in the evidence cache.

    Only the bio_1 member (48 MB deflated) is pulled from the 658 MB zip, by HTTP range requests.
    Asserted: archive Content-Length, member compressed/uncompressed size from the central
    directory, the zip CRC-32 (zipfile checks it when the stream ends), the written byte count and a
    GeoTIFF open with the expected grid. The result is cached with a manifest (sha256) and reused
    only when size and sha256 still match.
    """
    import rasterio
    total = head_content_length(BASELINE_ZIP_URL)
    if not total or total < 100_000_000:
        raise DownloadError(f"{BASELINE_ZIP_URL}: Content-Length {total} implausible")
    raw = io.BufferedReader(_HttpRange(BASELINE_ZIP_URL, total), buffer_size=4 << 20)
    with zipfile.ZipFile(raw) as zf:
        zi = zf.getinfo(BASELINE_MEMBER)
        man = read_json(BASELINE_MANIFEST)
        if (BASELINE_TIF.is_file() and man and man.get("zip_bytes") == total and man.get("crc32") == zi.CRC
                and BASELINE_TIF.stat().st_size == zi.file_size
                and common.sha256_file(BASELINE_TIF) == man.get("sha256")):
            return man
        BASELINE_DIR.mkdir(parents=True, exist_ok=True)
        tmp = BASELINE_TIF.with_name(BASELINE_TIF.name + ".part")
        written = 0
        log(f"[climate] pulling {BASELINE_MEMBER} ({zi.compress_size} bytes deflated) from the WorldClim zip")
        with zf.open(zi) as src, open(tmp, "wb") as dst:
            for blk in iter(lambda: src.read(1 << 20), b""):
                dst.write(blk)
                written += len(blk)
        if written != zi.file_size:
            raise DownloadError(f"{BASELINE_MEMBER}: wrote {written} bytes, central directory says {zi.file_size}")
        with rasterio.open(tmp) as ds:
            if (ds.width, ds.height) != GRID:
                raise DownloadError(f"{BASELINE_MEMBER}: grid {ds.width}x{ds.height}")
        os.replace(tmp, BASELINE_TIF)
        man = {"url": BASELINE_ZIP_URL, "member": BASELINE_MEMBER, "zip_bytes": total, "bytes": written,
               "deflated_bytes": zi.compress_size, "crc32": zi.CRC, "sha256": common.sha256_file(BASELINE_TIF),
               "local": str(BASELINE_TIF), "retrieved": now_iso()}
        write_json(BASELINE_MANIFEST, man)
        return man


def baseline_job(todo, refresh: bool) -> dict:
    """Historical BIO1 over the same footprints. Returns {ok, info, regions{rid: result|error}, error}."""
    import rasterio
    out = {"ok": False, "info": None, "regions": {}, "error": None}
    try:
        man = with_retry(fetch_baseline_member, tries=3, delay=5, what="baseline member", log=log)
        out["info"] = {"url": man["url"], "member": man["member"], "bytes": man["bytes"], "sha256": man["sha256"],
                       "zip_bytes": man["zip_bytes"], "crc32": man["crc32"]}
        pending = []
        for rid, geom, marker, gsha in todo:
            c = None if refresh else read_json(CACHE / "_baseline" / f"{rid}.json")
            if c and c.get("geometrySha256") == gsha and c.get("input_sha256") == man["sha256"] and "zonal_mean" in c:
                out["regions"][rid] = c
            else:
                pending.append((rid, geom, marker, gsha))
        if pending:
            with rasterio.Env():
                with rasterio.open(BASELINE_TIF) as ds:
                    for rid, geom, marker, gsha in pending:
                        try:
                            r = zonal_band1(ds, geom, marker)
                        except Exception as exc:  # noqa: BLE001
                            out["regions"][rid] = {"error": str(exc)[:300]}
                            continue
                        r.update({"geometrySha256": gsha, "input_sha256": man["sha256"], "retrieved": now_iso()})
                        write_json(CACHE / "_baseline" / f"{rid}.json", r)
                        out["regions"][rid] = r
        out["ok"] = True
    except Exception as exc:  # noqa: BLE001
        out["error"] = str(exc)[:400]
    return out


# --------------------------------------------------------------------------- assemble


def _direction(delta: float) -> str:
    if abs(delta) < STEADY_DELTA_C:
        return "steady"
    return "rising" if delta > 0 else "falling"


def assemble(rid: str, geom, marker, gsha: str, models: list[dict], base: dict) -> dict:
    import numpy as np
    retrieved = _dt.date.today().isoformat()
    doc = {
        "stage": STAGE, "region": rid, "status": "failed", "error": None, "generated": now_iso(),
        "retrieved": retrieved,
        "footprint": footprint_block(rid, geom),
        "method": "footprint-zonal",
        "metric": "Mean annual air temperature (BIO1), 2041-2060, SSP2-4.5",
        "unit": "°C", "vintage": "2041–2060, SSP2-4.5", "scenario": "SSP2-4.5",
        "source": "WorldClim 2.1 CMIP6 downscaled ensemble", "sourceUrl": SRC_URL, "sourceId": "worldclim-cmip6",
        "value": None,
    }
    ok, failed, per = [], [], {}
    for m in models:
        r = m["regions"].get(rid)
        if r and "zonal_mean" in r:
            ok.append(m["model"])
            per[m["model"]] = {"zonal_mean": r["zonal_mean"], "cells": r["cells"], "marker_3x3": r["marker_3x3"],
                               "url": r["url"], "bytes": r["bytes"], "window_sha256": r["window_sha256"]}
        else:
            err = (r or {}).get("error") or m.get("error") or "no result"
            failed.append({"model": m["model"], "url": m["url"], "error": err,
                           "expected": m["model"] in GCM_KNOWN_404})
    doc["n_models"] = len(ok)
    doc["models_ok"] = ok
    doc["models_failed"] = failed
    doc["n_models_required"] = GCM_MIN_OK
    doc["per_model"] = per
    if len(ok) < GCM_MIN_OK:
        doc["error"] = f"only {len(ok)} of {len(models)} models opened; {GCM_MIN_OK} required"
        return doc
    vals = np.array([per[g]["zonal_mean"] for g in ok])
    cellset = sorted({per[g]["cells"] for g in ok})
    if len(cellset) != 1:
        doc["error"] = f"models disagree on the cell count under the footprint: {cellset}"
        return doc
    pts = [per[g]["marker_3x3"] for g in ok if per[g]["marker_3x3"] is not None]
    doc["cells"] = cellset[0]
    doc["ensemble"] = {"mean": float(vals.mean()), "min": float(vals.min()), "max": float(vals.max()),
                       "sd": float(vals.std(ddof=1)) if len(vals) > 1 else 0.0,
                       "marker_3x3_mean": float(np.mean(pts)) if pts else None}
    doc["value"] = float(vals.mean())
    doc["value_rounded"] = round(doc["value"], 1)
    doc["inputs"] = [{"url": per[g]["url"], "bytes": per[g]["bytes"], "window_sha256": per[g]["window_sha256"],
                      "role": f"CMIP6 {g}"} for g in ok]

    b = base.get("regions", {}).get(rid)
    if base.get("ok") and b and "zonal_mean" in b:
        if b["cells"] != doc["cells"]:
            doc["status"] = "fallback"
            doc["error"] = (f"baseline grid cell count {b['cells']} differs from the ensemble's {doc['cells']}; "
                            "trajectory not computed")
            doc["trajectory"] = {"status": "not_available", "direction": None,
                                 "basis": "historical baseline cells do not match the projection cells"}
        else:
            delta = doc["value"] - b["zonal_mean"]
            doc["baseline"] = {"mean": b["zonal_mean"], "cells": b["cells"], "marker_3x3": b["marker_3x3"],
                               "vintage": "1970–2000", "source": "WorldClim 2.1 historical BIO1 (2.5 arc-minute)",
                               "sourceUrl": HIST_URL, "input": base["info"], "window_sha256": b["window_sha256"]}
            doc["delta"] = float(delta)
            doc["delta_rounded"] = round(delta, 1)
            doc["trajectory"] = {
                "status": "projected", "direction": _direction(delta), "delta": round(delta, 1), "unit": "°C",
                "basis": "2041–2060 SSP2-4.5 ensemble mean minus WorldClim 1970–2000 over the same footprint cells",
                "source": "WorldClim 2.1 (historical + CMIP6)", "sourceUrl": HIST_URL, "sourceId": "worldclim-hist",
                "vintage": "2041–2060 vs 1970–2000"}
            doc["status"] = "ok"
    else:
        doc["status"] = "fallback"
        doc["error"] = "baseline unavailable: " + (base.get("error") or (b or {}).get("error") or "no result")
        doc["trajectory"] = {"status": "not_available", "direction": None,
                             "basis": "historical WorldClim baseline could not be read for this footprint"}
    return doc


def run(region_ids: list[str], out_dir: Path, refresh: bool = False, workers: int = 6) -> dict[str, dict]:
    t0 = time.time()
    todo = []
    for rid in region_ids:
        g = load_footprint(rid)
        todo.append((rid, g, tuple(registry()[rid]["marker"]), geom_sha(g)))
    log(f"[climate] {len(todo)} region(s), {len(GCMS)} models, workers={workers}")
    with ThreadPoolExecutor(max_workers=1) as ex:
        bfut = ex.submit(baseline_job, todo, refresh)
        with ThreadPoolExecutor(max_workers=workers) as pool:
            models = list(pool.map(lambda g: model_job(g, todo, refresh), GCMS))
        base = bfut.result()
    for m in models:
        nok = sum(1 for r in m["regions"].values() if "zonal_mean" in r)
        log(f"[climate] {m['model']:<16} ok for {nok}/{len(todo)} regions" + (f"  ({m['error'][:90]})" if m["error"] else ""))
    log(f"[climate] baseline: {'ok' if base['ok'] else 'FAILED ' + str(base['error'])}")
    docs = {}
    for rid, geom, marker, gsha in todo:
        doc = assemble(rid, geom, marker, gsha, models, base)
        write_json(out_dir / rid / "climate.json", doc)
        docs[rid] = doc
        v = doc.get("value")
        log(f"[climate] {rid:<26} {doc['status']:<8} n_models={doc['n_models']:>2} "
            f"value={'-' if v is None else round(v, 2)} delta={doc.get('delta_rounded')}")
    log(f"[climate] done in {time.time() - t0:.0f}s")
    return docs


# --------------------------------------------------------------------------- verify / cli


def verify_outputs(out_dir: Path, region_ids: list[str]) -> list[str]:
    """Structural checks of <out>/<region>/climate.json. Returns a list of problems (empty = pass)."""
    problems = []
    for rid in region_ids:
        p = out_dir / rid / "climate.json"
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
        if st in ("ok", "fallback"):
            v = d.get("value")
            if not isinstance(v, (int, float)) or not math.isfinite(v) or not -30 < v < 45:
                problems.append(f"{rid}: implausible value {v!r}")
            if d.get("n_models", 0) < GCM_MIN_OK:
                problems.append(f"{rid}: n_models {d.get('n_models')} < {GCM_MIN_OK}")
            if not isinstance(d.get("models_failed"), list):
                problems.append(f"{rid}: models_failed not recorded")
            if not d.get("inputs") or any(not i.get("bytes") for i in d["inputs"]):
                problems.append(f"{rid}: an input has no asserted size")
            ens = d.get("ensemble") or {}
            if not (ens.get("min", 1) <= d.get("value", 0) <= ens.get("max", -1)):
                problems.append(f"{rid}: value outside the ensemble range")
        if st == "ok":
            tr = d.get("trajectory") or {}
            dl = d.get("delta")
            if tr.get("status") != "projected" or not isinstance(dl, (int, float)) or not math.isfinite(dl):
                problems.append(f"{rid}: ok but trajectory/delta missing")
            elif (tr.get("direction") == "rising") != (dl >= STEADY_DELTA_C):
                problems.append(f"{rid}: trajectory direction disagrees with delta {dl}")
        if st == "failed" and d.get("value") is not None:
            problems.append(f"{rid}: failed status carries a value")
    return problems


ANCHOR_ALENTEJO_TOL = 0.5


def anchor_check(out_dir: Path, region_ids: list[str]) -> list[str]:
    """Sanity anchors: Alentejo within 0.5 C of the reverify 18.0; Finger Lakes within the package tolerance."""
    problems = []
    if "alentejo" in region_ids:
        ref = None
        rv = read_json(U / "reverify" / "alentejo.json") or {}
        for c in rv.get("corrections", []):
            if c.get("path") == "values.alentejo.climate.value":
                ref = float(c["new"])
        d = read_json(out_dir / "alentejo" / "climate.json") or {}
        if ref is None:
            problems.append("alentejo: reverify reference value not found")
        elif d.get("value") is None or abs(d["value"] - ref) > ANCHOR_ALENTEJO_TOL:
            problems.append(f"alentejo: climate {d.get('value')} not within {ANCHOR_ALENTEJO_TOL} of reverify {ref}")
    if "finger-lakes" in region_ids:
        pkg = (read_json(U / "regions" / "finger-lakes" / "data.json") or {}).get("values", {}).get("climate", {}).get("value")
        d = read_json(out_dir / "finger-lakes" / "climate.json") or {}
        if pkg is None:
            problems.append("finger-lakes: package value not found")
        elif d.get("value") is None or abs(d["value"] - float(pkg)) > ANCHOR_ALENTEJO_TOL:
            problems.append(f"finger-lakes: climate {d.get('value')} not within {ANCHOR_ALENTEJO_TOL} of package {pkg}")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--regions", required=True, help="comma-separated region ids, or 'all'")
    ap.add_argument("--out", required=True, help="evidence-out directory")
    ap.add_argument("--verify", action="store_true", help="after running, check the outputs and the sanity anchors")
    ap.add_argument("--refresh", action="store_true", help="ignore cached per-model windows")
    ap.add_argument("--workers", type=int, default=6)
    a = ap.parse_args(argv)
    ids = resolve_regions(a.regions)
    out = Path(a.out)
    docs = run(ids, out, refresh=a.refresh, workers=a.workers)
    problems = verify_outputs(out, ids) if a.verify else []
    problems += anchor_check(out, ids)
    # a stage that failed for an anchor region is a real defect; elsewhere failed/fallback is an explicit result
    for rid in ids:
        if docs[rid]["status"] == "failed" and rid in ("alentejo", "finger-lakes"):
            problems.append(f"{rid}: climate failed: {docs[rid]['error']}")
    tot = {s: sum(1 for d in docs.values() if d["status"] == s) for s in ("ok", "fallback", "failed")}
    print(json.dumps({"stage": STAGE, "totals": tot, "problems": problems}))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
