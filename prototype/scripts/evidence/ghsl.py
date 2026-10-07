#!/usr/bin/env python3
"""Stage 5 of the canonical evidence pipeline (remote B): population density from GHS-POP.

Metric   People per km2 over the footprint, GHS-POP R2023A, 1 km Mollweide (ESRI:54009), epoch 2020
         as the state. Trajectory: the 2020 to 2030 change (2030 is a GHSL PROJECTION) and, because
         the 2000 epoch is cheap to fetch (about 6 MB a tile), the 2000 to 2020 change (a modelled
         estimate from census disaggregation, not a census count).
Method   For every 1000 km tile that the footprint touches, the footprint (densified, then
         projected to Mollweide, an equal-area CRS like the 1 km cells) is rasterised at 10x
         supersampling inside the footprint's pixel window, which gives the exact covered fraction
         of every 1 km cell. Population = sum(cell population x covered fraction); density =
         population / footprint area in the same projection (the sum of the covered fractions,
         which is asserted to equal the projected polygon's area within 1.5 percent: a missing
         tile or a clipped window cannot pass). For comparison with the region packages
         (regions/*/tools/ghsl.py use pixel centres) the centre-in sum and density are stored
         too. Cells with the GHS-POP nodata value (-200, open sea) are excluded from the sum; their
         share of the footprint is recorded (`nodata_share`), and `density_per_km2_valid_cells`
         divides by the non-nodata area. The headline `value` follows the WP: people in the
         footprint / footprint km2.
Source   JRC Global Human Settlement Layer GHS-POP R2023A (Schiavina et al. 2023), open data under
         Commission Decision 2011/833/EU (CC BY 4.0 per JRC),
         https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A/
Integrity  Every tile download is HEAD-checked (Content-Length), size-asserted against it, zip
         tested and sha256-recorded (curl exit 0 is never trusted; the 194 MB ghsl-pop-2030-1km.zip
         left in prototype/data/raw is exactly such a truncated file and is NOT used). The tif's
         shape, bounds and CRS are asserted against the tile id. If the 2020 tiles of a region
         cannot be fetched the stage writes status 'fallback' with the error and NO value; the
         integration WP then uses an official statistic (`method: 'official-statistic'`, admin unit
         named). If 2020 is fine but 2030 is not, the value stays and status is 'fallback' naming
         the missing epoch; a missing 2000 epoch is recorded (`epochs_failed`) and stays 'ok'
         (the 2000 trajectory is optional).

Run (project virtualenv):
    prototype/.venv/bin/python prototype/scripts/evidence/ghsl.py \
        --regions alentejo,finger-lakes|all --out upgrade-2026-10/evidence-out [--verify] [--refresh]
    prototype/.venv/bin/python prototype/scripts/evidence/ghsl.py --verify upgrade-2026-10/evidence-out

Output  <out>/<region>/ghsl.json     Cache  upgrade-2026-10/evidence-cache/ghsl/E<epoch>/ (zips + tifs)
"""
from __future__ import annotations

import argparse
import datetime as _dt
import json
import math
import sys
import time
import zipfile
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import common  # noqa: E402
from common import U, DownloadError, fetch, head_content_length, load_footprint, registry, with_retry  # noqa: E402
import solar as _solar  # noqa: E402  (sibling stage of this WP: shared helpers and report writer)

STAGE = "ghsl"
CACHE = U / "evidence-cache" / "ghsl"
BASE = "https://jeodpp.jrc.ec.europa.eu/ftp/jrc-opendata/GHSL/GHS_POP_GLOBE_R2023A"
EPOCHS = (2020, 2030, 2000)             # state first, projection second, optional observed third
REQUIRED = (2020, 2030)
SRC_URL = "https://human-settlement.emergency.copernicus.eu/ghs_pop2023.php"
LICENCE = "CC BY 4.0 (JRC open data, Commission Decision 2011/833/EU)"
TILE_M = 1_000_000                       # tiles are 1000 x 1000 cells of 1000 m
X0, Y0 = -18_041_000, 9_000_000          # left edge of column 1, top edge of row 1 (read off R4_C19: -41000, 6000000)
NODATA = -200.0
SS = 10                                  # supersampling factor for covered fractions
AREA_TOL = 0.015
STATUSES = ("ok", "fallback", "failed")
MOLL = "ESRI:54009"
# Region-package centre-in sums for epoch 2020 (regions/valle-maira/data.json population._note: "E2020: 11,352")
PKG_CENTRE_IN_2020 = {"valle-maira": 11352.0}
ANCHOR_TOL = 0.05


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


# --------------------------------------------------------------------------- tiles


def tile_name(epoch: int, r: int, c: int) -> str:
    return f"GHS_POP_E{epoch}_GLOBE_R2023A_54009_1000_V1_0_R{r}_C{c}"


def tile_url(epoch: int, r: int, c: int) -> str:
    return f"{BASE}/GHS_POP_E{epoch}_GLOBE_R2023A_54009_1000/V1-0/tiles/{tile_name(epoch, r, c)}.zip"


def tile_bounds(r: int, c: int) -> tuple[float, float, float, float]:
    left = X0 + (c - 1) * TILE_M
    top = Y0 - (r - 1) * TILE_M
    return (left, top - TILE_M, left + TILE_M, top)


def to_moll(geom):
    import shapely
    import pyproj
    from shapely.ops import transform
    dens = shapely.segmentize(geom, 0.02)     # lon/lat edges bow in Mollweide; densify first
    tr = pyproj.Transformer.from_crs("EPSG:4326", MOLL, always_xy=True).transform
    return transform(tr, dens)


def tiles_for(geom_moll) -> list[tuple[int, int]]:
    """(row, col) of every 1000 km tile the projected footprint actually intersects."""
    from shapely.geometry import box
    minx, miny, maxx, maxy = geom_moll.bounds
    c0, c1 = int(math.floor((minx - X0) / TILE_M)) + 1, int(math.floor((maxx - X0) / TILE_M)) + 1
    r0, r1 = int(math.floor((Y0 - maxy) / TILE_M)) + 1, int(math.floor((Y0 - miny) / TILE_M)) + 1
    out = []
    for r in range(max(1, r0), r1 + 1):
        for c in range(max(1, c0), c1 + 1):
            b = tile_bounds(r, c)
            if geom_moll.intersects(box(*b)) and geom_moll.intersection(box(*b)).area > 1.0:
                out.append((r, c))
    return out


def fetch_tile(epoch: int, r: int, c: int, refresh: bool = False) -> dict:
    """Download one tile zip (size asserted against the server Content-Length), test it and extract the tif."""
    name = tile_name(epoch, r, c)
    url = tile_url(epoch, r, c)
    d = CACHE / f"E{epoch}"
    zpath, tpath = d / f"{name}.zip", d / f"{name}.tif"
    if refresh:
        for p in (zpath, tpath):
            if p.exists():
                p.unlink()
    expected = with_retry(lambda: head_content_length(url), tries=3, delay=2, what=f"HEAD {url}", log=lambda m: None)
    if not expected or expected < 100_000:
        raise DownloadError(f"{url}: Content-Length {expected} is implausibly small for a tile")
    info = fetch(url, zpath, expect_bytes=expected, min_bytes=100_000, kind="zip", tries=4, log=lambda m: None)
    if info["bytes"] != expected:
        raise DownloadError(f"{name}: {info['bytes']} bytes != Content-Length {expected}")
    if not tpath.is_file() or tpath.stat().st_size < 100_000:
        with zipfile.ZipFile(zpath) as zf:
            members = [n for n in zf.namelist() if n.lower().endswith(".tif")]
            if len(members) != 1:
                raise DownloadError(f"{name}: expected exactly one tif in the zip, found {members}")
            tmp = tpath.with_suffix(".tif.part")
            with zf.open(members[0]) as src, open(tmp, "wb") as dst:
                while True:
                    chunk = src.read(1 << 20)
                    if not chunk:
                        break
                    dst.write(chunk)
            if tmp.stat().st_size != zf.getinfo(members[0]).file_size:
                tmp.unlink()
                raise DownloadError(f"{name}: extracted tif size differs from the zip directory")
            tmp.replace(tpath)
    return {"tile": f"R{r}_C{c}", "epoch": epoch, "url": url, "zip": str(zpath.relative_to(U)),
            "tif": str(tpath.relative_to(U)), "bytes": info["bytes"], "expected_bytes": expected,
            "size_assertion": info["bytes"] == expected, "zip_tested": True, "sha256": info["sha256"],
            "tif_bytes": tpath.stat().st_size}


def prefetch(needed: dict[tuple[int, int, int], None], refresh: bool, workers: int = 4) -> tuple[dict, dict]:
    """Fetch every distinct (epoch, r, c). Returns ({key: tile info}, {key: error text})."""
    keys = list(needed)
    infos, errors = {}, {}

    def job(k):
        try:
            return k, fetch_tile(*k, refresh=refresh), None
        except Exception as exc:  # noqa: BLE001
            return k, None, f"{type(exc).__name__}: {str(exc)[:300]}"

    log(f"[ghsl] {len(keys)} distinct tile download(s), workers={workers}")
    with ThreadPoolExecutor(max_workers=workers) as pool:
        for k, info, err in pool.map(job, keys):
            if err:
                errors[k] = err
                log(f"[ghsl] E{k[0]} R{k[1]}_C{k[2]}: FAILED {err}")
            else:
                infos[k] = info
    return infos, errors


# --------------------------------------------------------------------------- compute


def sample_tile(geom_moll, tif: Path, r: int, c: int) -> dict:
    """Covered-fraction weighted population of one tile (footprint part inside this tile only)."""
    import numpy as np
    import rasterio
    from rasterio.features import rasterize
    from rasterio.windows import Window
    from affine import Affine
    from shapely.geometry import box

    exp = tile_bounds(r, c)
    with rasterio.open(tif) as ds:
        if (ds.width, ds.height) != (1000, 1000):
            raise DownloadError(f"{tif.name}: shape {ds.width}x{ds.height}, want 1000x1000")
        if any(abs(a - b) > 1e-6 for a, b in zip(tuple(ds.bounds), exp)):
            raise DownloadError(f"{tif.name}: bounds {tuple(ds.bounds)} differ from the tile-grid arithmetic {exp}")
        if abs(ds.res[0] - 1000.0) > 1e-6 or abs(ds.res[1] - 1000.0) > 1e-6:
            raise DownloadError(f"{tif.name}: pixel size {ds.res}, want 1000 m")
        if "oll" not in (ds.crs.to_wkt() or ""):
            raise DownloadError(f"{tif.name}: CRS is not Mollweide")
        part = geom_moll.intersection(box(*exp))
        minx, miny, maxx, maxy = part.bounds
        col0 = int(math.floor((minx - exp[0]) / 1000.0))
        col1 = int(math.ceil((maxx - exp[0]) / 1000.0))
        row0 = int(math.floor((exp[3] - maxy) / 1000.0))
        row1 = int(math.ceil((exp[3] - miny) / 1000.0))
        col0, row0 = max(0, col0), max(0, row0)
        col1, row1 = min(1000, col1), min(1000, row1)
        w, h = col1 - col0, row1 - row0
        win = Window(col0, row0, w, h)
        arr = ds.read(1, window=win).astype("float64")
        t = ds.window_transform(win)
    valid = np.isfinite(arr) & (arr > NODATA + 0.5) & (arr >= 0)
    pop = np.where(valid, arr, 0.0)
    tss = t * Affine.scale(1.0 / SS)
    sub = rasterize([(part, 1)], out_shape=(h * SS, w * SS), transform=tss, fill=0, all_touched=False, dtype="uint8")
    frac = sub.reshape(h, SS, w, SS).mean(axis=(1, 3))
    centre = rasterize([(part, 1)], out_shape=(h, w), transform=t, fill=0, all_touched=False, dtype="uint8").astype(bool)
    return {
        "pop_weighted": float((pop * frac).sum()),
        "area_all_km2": float(frac.sum()),
        "area_valid_km2": float((frac * valid).sum()),
        "centre_in_pop": float(pop[centre].sum()),
        "centre_in_cells": int(centre.sum()),
        "centre_in_nodata_cells": int((centre & ~valid).sum()),
        "window": [int(col0), int(row0), int(w), int(h)],
    }


def compute_epoch(geom_moll, tiles: list[tuple[int, int]], epoch: int, infos: dict) -> dict:
    agg = {"pop_weighted": 0.0, "area_all_km2": 0.0, "area_valid_km2": 0.0, "centre_in_pop": 0.0,
           "centre_in_cells": 0, "centre_in_nodata_cells": 0}
    for r, c in tiles:
        info = infos[(epoch, r, c)]
        s = sample_tile(geom_moll, U / info["tif"], r, c)
        for k in agg:
            agg[k] += s[k]
    return agg


def compute_region(rid: str, geom, infos: dict, errors: dict) -> dict:
    gm = to_moll(geom)
    moll_area = gm.area / 1e6
    tiles = tiles_for(gm)
    if not tiles:
        raise DownloadError("footprint intersects no GHS-POP tile")
    out = {"tiles_needed": [f"R{r}_C{c}" for r, c in tiles], "moll_area_km2": moll_area, "epochs": {}, "epochs_failed": {},
           "tiles": []}
    for ep in EPOCHS:
        missing = [(ep, r, c) for r, c in tiles if (ep, r, c) not in infos]
        if missing:
            out["epochs_failed"][str(ep)] = "; ".join(f"R{k[1]}_C{k[2]}: {errors.get(k, 'not fetched')}" for k in missing)
            continue
        try:
            a = compute_epoch(gm, tiles, ep, infos)
        except Exception as exc:  # noqa: BLE001
            out["epochs_failed"][str(ep)] = f"{type(exc).__name__}: {str(exc)[:300]}"
            continue
        closure = a["area_all_km2"] / moll_area
        if abs(closure - 1.0) > AREA_TOL:
            out["epochs_failed"][str(ep)] = (f"area closure {closure:.4f} outside +-{AREA_TOL}: covered cells "
                                             f"{a['area_all_km2']:.1f} km2 vs projected footprint {moll_area:.1f} km2")
            continue
        if not math.isfinite(a["pop_weighted"]) or a["pop_weighted"] < 0:
            out["epochs_failed"][str(ep)] = f"non-finite or negative population {a['pop_weighted']!r}"
            continue
        out["epochs"][str(ep)] = {
            "population": a["pop_weighted"],
            "density_per_km2": a["pop_weighted"] / a["area_all_km2"],
            "density_per_km2_valid_cells": (a["pop_weighted"] / a["area_valid_km2"]) if a["area_valid_km2"] > 0 else None,
            "area_covered_km2": a["area_all_km2"], "area_valid_km2": a["area_valid_km2"],
            "area_closure": closure,
            "nodata_share": 1.0 - a["area_valid_km2"] / a["area_all_km2"] if a["area_all_km2"] else None,
            "centre_in_population": a["centre_in_pop"], "centre_in_cells": a["centre_in_cells"],
            "centre_in_nodata_cells": a["centre_in_nodata_cells"],
            "centre_in_density_per_km2": a["centre_in_pop"] / moll_area,
        }
    for (ep, r, c), info in infos.items():
        if (r, c) in tiles:
            out["tiles"].append(info)
    out["tiles"].sort(key=lambda t: (t["epoch"], t["tile"]))
    return out


def _direction(chg):
    if chg is None:
        return None
    return "stable" if abs(chg) < 1.0 else ("rising" if chg > 0 else "falling")


def build_doc(rid: str, geom, res: dict | None, error: str | None) -> dict:
    doc = {
        "stage": STAGE, "region": rid, "status": "failed", "error": error, "generated": now_iso(),
        "retrieved": _dt.date.today().isoformat(),
        "footprint": _solar.footprint_block(rid, geom),
        "method": "footprint-zonal",
        "methodNote": "people in footprint / footprint km2, both in Mollweide (equal-area): population = sum of 1 km cell "
                      "population x covered fraction of the cell (10x supersampled); epoch 2020",
        "metric": "Persons per km2, GHS-POP R2023A epoch 2020, mean over the region footprint",
        "unit": "p/km2", "vintage": "GHS-POP R2023A, epoch 2020",
        "source": "JRC GHSL GHS-POP R2023A", "sourceUrl": SRC_URL, "sourceId": "ghsl-pop-r2023a", "license": LICENCE,
        "value": None,
    }
    if res is None:
        return doc
    ep = res["epochs"]
    doc["tiles_needed"] = res["tiles_needed"]
    doc["tiles"] = res["tiles"]
    doc["footprint_area_km2_mollweide"] = res["moll_area_km2"]
    doc["epochs"] = ep
    doc["epochs_failed"] = res["epochs_failed"]
    if "2020" not in ep:
        doc["status"] = "fallback"
        doc["error"] = ("GHS-POP epoch 2020 could not be computed (" + res["epochs_failed"].get("2020", "no detail") +
                        "); no value is written, the integration WP uses an official statistic "
                        "(method 'official-statistic', admin unit named)")
        return doc
    e20 = ep["2020"]
    doc["value"] = e20["density_per_km2"]
    doc["value_rounded"] = round(e20["density_per_km2"], 1)
    doc["population_2020"] = e20["population"]
    doc["density_centre_in_2020"] = e20["centre_in_density_per_km2"]
    doc["nodata_share"] = e20["nodata_share"]
    doc["density_per_km2_valid_cells"] = e20["density_per_km2_valid_cells"]
    if e20["nodata_share"] is not None and e20["nodata_share"] > 0.02:
        doc["nodata_note"] = (f"{100 * e20['nodata_share']:.0f} percent of the footprint is GHS-POP nodata (open sea), which "
                              f"dilutes the headline value; per km2 of cells with data it is "
                              f"{e20['density_per_km2_valid_cells']:.1f}. The integration WP decides which to print and says so.")
    tr = {"status": "not_available", "direction": None, "change_pct_2020_2030": None, "change_pct_2000_2020": None,
          "basis": "epoch 2030 not available for this footprint"}
    p20 = e20["population"]
    if "2030" in ep and p20 > 0:
        c30 = 100.0 * (ep["2030"]["population"] - p20) / p20
        tr.update({"status": "projected", "direction": _direction(c30), "change_pct_2020_2030": c30,
                   "basis": "GHS-POP R2023A epoch 2030 is a GHSL projection; direction 'stable' means under 1 percent "
                            "change over the decade"})
    if "2000" in ep and ep["2000"]["population"] > 0:
        c00 = 100.0 * (p20 - ep["2000"]["population"]) / ep["2000"]["population"]
        tr["change_pct_2000_2020"] = c00
        tr["basis"] += ("; 2000 to 2020 is the GHSL modelled estimate (census disaggregation), not a census count"
                        if "2030" in ep else "; 2000 to 2020 is the GHSL modelled estimate")
    doc["trajectory"] = tr
    missing_req = [str(e) for e in REQUIRED if str(e) not in ep]
    if missing_req:
        doc["status"] = "fallback"
        doc["error"] = ("secondary epoch(s) missing: " + "; ".join(f"{e}: {res['epochs_failed'].get(e, 'no detail')}"
                                                                    for e in missing_req))
    else:
        doc["status"], doc["error"] = "ok", None
    return doc


def run(region_ids: list[str], out_dir: Path, refresh: bool = False, workers: int = 4) -> dict[str, dict]:
    t0 = time.time()
    geoms = {rid: load_footprint(rid) for rid in region_ids}
    moll = {rid: to_moll(g) for rid, g in geoms.items()}
    need: dict[tuple[int, int, int], None] = {}
    for rid in region_ids:
        for r, c in tiles_for(moll[rid]):
            for ep in EPOCHS:
                need[(ep, r, c)] = None
    infos, errors = prefetch(need, refresh, workers)
    docs = {}
    for rid in region_ids:
        g = geoms[rid]
        try:
            res = compute_region(rid, g, infos, errors)
            doc = build_doc(rid, g, res, None)
        except Exception as exc:  # noqa: BLE001
            doc = build_doc(rid, g, None, f"{type(exc).__name__}: {str(exc)[:400]}")
        _solar.write_json(out_dir / rid / "ghsl.json", doc)
        docs[rid] = doc
        v = doc.get("value")
        tr = doc.get("trajectory") or {}
        c30 = tr.get("change_pct_2020_2030")
        log(f"[ghsl] {rid:<26} {doc['status']:<8} {'-' if v is None else round(v, 2)} p/km2 2020"
            f"{'  ' + format(c30, '+.1f') + '% to 2030' if c30 is not None else ''}"
            f"{'  ' + doc['error'] if doc['error'] else ''}")
    log(f"[ghsl] done in {time.time() - t0:.0f}s")
    return docs


# --------------------------------------------------------------------------- verify / cli


def verify_outputs(out_dir: Path, region_ids: list[str]) -> list[str]:
    problems = []
    for rid in region_ids:
        p = out_dir / rid / "ghsl.json"
        d = _solar.read_json(p)
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
        if st == "fallback" and d.get("value") is None and "2020" in (d.get("epochs") or {}):
            problems.append(f"{rid}: 2020 epoch computed but no value written")
        if st == "ok" or (st == "fallback" and d.get("value") is not None):
            v = d.get("value")
            if not isinstance(v, (int, float)) or not math.isfinite(v) or not 0 <= v < 30000:
                problems.append(f"{rid}: implausible density {v!r}")
            tiles = d.get("tiles") or []
            if not tiles:
                problems.append(f"{rid}: no tile records")
            have = {(t.get("epoch"), t.get("tile")) for t in tiles}
            for ep in (2020,) + ((2030,) if st == "ok" else ()):
                for tid in d.get("tiles_needed", []):
                    if (ep, tid) not in have:
                        problems.append(f"{rid}: tile {tid} epoch {ep} not recorded")
            for t in tiles:
                if not (t.get("size_assertion") is True and t.get("bytes") == t.get("expected_bytes") and t.get("bytes")):
                    problems.append(f"{rid}: tile {t.get('tile')} E{t.get('epoch')} size not asserted")
                if not t.get("sha256") or not t.get("url"):
                    problems.append(f"{rid}: tile {t.get('tile')} E{t.get('epoch')} lacks url or sha256")
            e20 = (d.get("epochs") or {}).get("2020")
            if not e20:
                problems.append(f"{rid}: epoch 2020 block missing")
            else:
                if abs(e20.get("area_closure", 0) - 1) > AREA_TOL:
                    problems.append(f"{rid}: area closure {e20.get('area_closure')} outside tolerance")
                if isinstance(v, (int, float)) and abs(v - e20["density_per_km2"]) > 1e-9:
                    problems.append(f"{rid}: value differs from epoch 2020 density")
            if st == "ok" and not (d.get("trajectory") or {}).get("status") == "projected":
                problems.append(f"{rid}: ok without a projected 2020-2030 trajectory")
    return problems


def anchor_check(out_dir: Path, region_ids: list[str]) -> list[str]:
    """Centre-in 2020 sums against the region packages' own results (same data, same tile, same
    pixel-centre rule; the footprint is EV-FOOT's simplified polygon, hence ANCHOR_TOL)."""
    problems = []
    refs = {}
    for rid, key in (("scottish-highlands", "2020"), ("teruel-uplands", "all")):
        ref = _solar.read_json(U / "regions" / rid / "raw" / "ghsl_result.json")
        if not ref:
            continue
        if rid == "scottish-highlands":
            refs[rid] = ref["2020"]["centre_in_sum"]
        else:
            refs[rid] = ref["all"]["2020"]
    for rid, v in PKG_CENTRE_IN_2020.items():
        refs[rid] = v
    for rid in region_ids:
        d = _solar.read_json(out_dir / rid / "ghsl.json")
        if rid not in refs or not d or d.get("status") == "failed":
            continue
        e20 = (d.get("epochs") or {}).get("2020")
        if not e20:
            continue
        got, want = e20["centre_in_population"], refs[rid]
        if want and abs(got - want) / want > ANCHOR_TOL:
            problems.append(f"{rid}: centre-in 2020 population {got:.0f} differs from the region package {want:.0f} "
                            f"by more than {int(ANCHOR_TOL * 100)} percent")
    return problems


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--regions", default=None, help="comma-separated region ids, or 'all' (required unless --verify DIR)")
    ap.add_argument("--out", default=None, help="evidence-out directory")
    ap.add_argument("--verify", nargs="?", const="", default=None, metavar="DIR",
                    help="DIR: verify-only on that evidence-out directory; bare flag: run, then verify")
    ap.add_argument("--refresh", action="store_true", help="re-download the tiles")
    ap.add_argument("--workers", type=int, default=4, help="parallel tile downloads")
    a = ap.parse_args(argv)

    if a.verify:
        out = Path(a.verify)
        if not out.is_dir():
            raise SystemExit(f"--verify needs an existing evidence-out directory (got {str(out)!r})")
        ids = _solar.resolve_regions(a.regions or "all")
        problems = verify_outputs(out, ids) + anchor_check(out, ids)
        _solar.write_report_b(out)
        for p in problems:
            log(f"[ghsl] PROBLEM: {p}")
        tot = {s: sum(1 for rid in ids if (_solar.read_json(out / rid / "ghsl.json") or {}).get("status") == s)
               for s in STATUSES}
        print(json.dumps({"stage": STAGE, "verify": str(out), "regions": len(ids), "totals": tot, "problems": problems}))
        return 1 if problems else 0

    if not a.regions or not a.out:
        raise SystemExit("--regions and --out are required when running the stage")
    ids = _solar.resolve_regions(a.regions)
    out = Path(a.out)
    docs = run(ids, out, refresh=a.refresh, workers=a.workers)
    problems = verify_outputs(out, ids) if a.verify is not None else []
    problems += anchor_check(out, ids)
    _solar.write_report_b(out)
    for p in problems:
        log(f"[ghsl] PROBLEM: {p}")
    tot = {s: sum(1 for d in docs.values() if d["status"] == s) for s in STATUSES}
    print(json.dumps({"stage": STAGE, "totals": tot, "problems": problems}))
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
