"""Canonical pipeline stage: Koppen-Geiger class shares inside a region footprint (EV-PIPE-LOCAL).

Source: Beck et al. (2023), High-resolution (1 km) Koppen-Geiger maps for 1901-2099 based on
constrained CMIP6 projections, Scientific Data 10, 724. Figshare file 61012822
(`koppen_geiger_tif.zip`, 130,618,411 bytes, md5 7fc2f5a15d4f5fe0ce59c9a9b502aa09), licence CC BY 4.0.

Periods and rasters (1 km, `koppen_geiger_0p00833333.tif`):
    1961_1990, 1991_2020, 2041_2070_ssp245, 2071_2099_ssp245

Per period and footprint:
    * shares      class code -> share of the footprint's LAND cells, weighted by true cell area
                  (cos latitude), cells selected with rasterio.mask(all_touched=False). Sums to 1.
    * cells       class code -> number of cells (unweighted), so the share can be recomputed
    * dominant    the class with the largest share (ties: lowest code)
    * marker      3x3 mode of the cells around the marker (ties: the centre cell's class wins,
                  then the lowest class number); null with a reason if the window is all water
    * noDataShare share of selected cells carrying the raster's 0 value (sea / no data), excluded
                  from the shares

The extracted rasters come from `upgrade-2026-10/tracks/evidence-tools/raw/koppen/` (written by
EV-KOPPEN-MAP). Each is checked against the zip's member size and CRC-32 before use; a missing
extracted file is read straight out of the md5-verified zip through GDAL's /vsizip/.

    python koppen.py <region-id> [--out DIR]
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import common  # noqa: E402

STAGE = "koppen"
METHOD_VERSION = "koppen-1km-footprint-v1"

RAW = common.U / "tracks" / "evidence-tools" / "raw"
ZIP = RAW / "koppen_geiger_tif.zip"
EXTRACTED = RAW / "koppen"
ZIP_BYTES = 130_618_411
ZIP_MD5 = "7fc2f5a15d4f5fe0ce59c9a9b502aa09"
RASTER_NAME = "koppen_geiger_0p00833333.tif"

# period key -> path of the raster inside the zip (and below RAW/koppen)
PERIODS = {
    "1961_1990": "1961_1990",
    "1991_2020": "1991_2020",
    "2041_2070_ssp245": "2041_2070/ssp245",
    "2071_2099_ssp245": "2071_2099/ssp245",
}

SOURCE = {
    "id": "beck-koppen-2023",
    "citation": ("Beck, H. E., McVicar, T. R., Vergopolan, N., Berg, A., Lutsko, N. J., Dufour, A., Zeng, Z., "
                 "Jiang, X., van Dijk, A. I. J. M., Miralles, D. G. (2023). High-resolution (1 km) "
                 "Koppen-Geiger maps for 1901-2099 based on constrained CMIP6 projections. "
                 "Scientific Data 10, 724."),
    "url": "https://www.nature.com/articles/s41597-023-02549-6",
    "dataUrl": "https://ndownloader.figshare.com/files/61012822",
    "licence": "CC BY 4.0",
    "vintage": "1961-1990, 1991-2020 observed-constrained; 2041-2070 and 2071-2099 projected under SSP2-4.5",
    "nativeUnit": "Koppen-Geiger class at 0.00833 degree (about 1 km) cells",
}

_cache: dict = {}


class StageError(RuntimeError):
    pass


# --------------------------------------------------------------------------- inputs


def _md5(path: Path) -> str:
    h = hashlib.md5()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def verify_zip() -> dict:
    """The zip must be present, 130,618,411 bytes, md5 7fc2f5a1... (cached per process)."""
    if "zip" in _cache:
        return _cache["zip"]
    if not ZIP.is_file():
        raise StageError(f"{ZIP} is missing (download https://ndownloader.figshare.com/files/61012822, "
                         f"expect {ZIP_BYTES} bytes, md5 {ZIP_MD5})")
    size = ZIP.stat().st_size
    if size != ZIP_BYTES:
        raise StageError(f"{ZIP}: {size} bytes != expected {ZIP_BYTES} (truncated download?)")
    md5 = _md5(ZIP)
    if md5 != ZIP_MD5:
        raise StageError(f"{ZIP}: md5 {md5} != expected {ZIP_MD5}")
    info = {"file": str(ZIP.relative_to(common.R)), "bytes": size, "md5": md5,
            "retrieved": datetime.fromtimestamp(ZIP.stat().st_mtime, timezone.utc).strftime("%Y-%m-%d")}
    _cache["zip"] = info
    return info


def legend() -> dict[int, dict]:
    """{class number: {code, name, rgb}} parsed from legend.txt inside the zip."""
    if "legend" in _cache:
        return _cache["legend"]
    verify_zip()
    with zipfile.ZipFile(ZIP) as zf:
        text = zf.read("legend.txt").decode("utf-8", errors="replace")
    out = {}
    for line in text.splitlines():
        m = re.match(r"^\s*(\d+):\s+(\S+)\s+(.+?)\s+\[(\d+) (\d+) (\d+)\]\s*$", line)
        if m:
            out[int(m.group(1))] = {"code": m.group(2), "name": m.group(3).strip(),
                                    "rgb": [int(m.group(4)), int(m.group(5)), int(m.group(6))]}
    if len(out) != 30:
        raise StageError(f"legend.txt: parsed {len(out)} classes, expected 30")
    _cache["legend"] = out
    return out


def raster_source(period: str) -> tuple[str, dict]:
    """(rasterio path, input record) for a period; extracted file when it matches the zip, else /vsizip/."""
    key = ("raster", period)
    if key in _cache:
        return _cache[key]
    verify_zip()
    sub = PERIODS[period]
    member = f"{sub}/{RASTER_NAME}"
    with zipfile.ZipFile(ZIP) as zf:
        zi = zf.getinfo(member)
    extracted = EXTRACTED / sub / RASTER_NAME
    use_path = None
    sha = None
    if extracted.is_file() and extracted.stat().st_size == zi.file_size:
        import zlib
        crc = 0
        with open(extracted, "rb") as fh:
            for chunk in iter(lambda: fh.read(1 << 20), b""):
                crc = zlib.crc32(chunk, crc)
        if (crc & 0xFFFFFFFF) == zi.CRC:
            use_path = str(extracted)
            sha = common.sha256_file(extracted)
    if use_path is None:
        use_path = f"zip://{ZIP}!/{member}"
    rec = {"file": f"{ZIP.name}!/{member}", "bytes": zi.file_size, "crc32": f"{zi.CRC:08x}",
           "sha256": sha, "readFrom": "extracted file (size and CRC-32 equal the zip member)"
           if sha else "zip member via /vsizip/", "period": period}
    _cache[key] = (use_path, rec)
    return _cache[key]


def input_fingerprint() -> str:
    """Compact identity of the inputs, used by run_local.py to decide whether an output is still current."""
    return verify_zip()["md5"]


# --------------------------------------------------------------------------- compute


def _mode_3x3(src, lon: float, lat: float) -> dict:
    import numpy as np
    from rasterio.windows import Window
    row, col = src.index(lon, lat)
    for half in (1,):
        win = Window(col - half, row - half, 2 * half + 1, 2 * half + 1)
        arr = src.read(1, window=win, boundless=True, fill_value=0)
        vals = [int(v) for v in arr.ravel() if int(v) != 0]
        if not vals:
            continue
        centre = int(arr[half, half])
        counts = Counter(vals)
        top = max(counts.values())
        tied = sorted(k for k, v in counts.items() if v == top)
        pick = centre if centre in tied else tied[0]
        return {"class": pick, "window": f"{2 * half + 1}x{2 * half + 1}", "cells": dict(sorted(counts.items())),
                "centreClass": centre or None, "tiedClasses": tied if len(tied) > 1 else None}
    return {"class": None, "window": "3x3", "cells": {}, "centreClass": None, "tiedClasses": None,
            "nullReason": "all nine cells around the marker are water or no data (0) in this raster"}


def period_result(period: str, geom, lon: float, lat: float) -> dict:
    import numpy as np
    import rasterio
    from rasterio.mask import raster_geometry_mask

    path, _rec = raster_source(period)
    leg = legend()
    with rasterio.open(path) as src:
        outside, transform, window = raster_geometry_mask(src, [geom.__geo_interface__], all_touched=False,
                                                          invert=False, crop=True)
        vals = src.read(1, window=window)
        inside = ~outside
        rows = np.arange(vals.shape[0])
        lats = transform.f + (rows + 0.5) * transform.e
        w = np.cos(np.radians(lats))[:, None] * np.ones((1, vals.shape[1]))
        sel = inside & (vals > 0)
        sel_all = inside
        total_cells = int(sel_all.sum())
        land_cells = int(sel.sum())
        if land_cells == 0:
            raise StageError(f"{period}: no land cell inside the footprint ({total_cells} cells selected)")
        wsum = float(w[sel].sum())
        shares_num, cells = {}, {}
        for cls in np.unique(vals[sel]):
            m = sel & (vals == cls)
            shares_num[int(cls)] = float(w[m].sum()) / wsum
            cells[int(cls)] = int(m.sum())
        marker = _mode_3x3(src, lon, lat)

    def code(n):
        if n not in leg:
            raise StageError(f"{period}: raster value {n} is not in legend.txt")
        return leg[n]["code"]

    shares = {code(n): round(v, 4) for n, v in sorted(shares_num.items(), key=lambda kv: (-kv[1], kv[0]))}
    order = sorted(shares_num.items(), key=lambda kv: (-kv[1], kv[0]))
    dom_n = order[0][0]
    out = {
        "shares": shares,
        "sharesSum": round(sum(shares.values()), 4),
        "cells": {code(n): c for n, c in sorted(cells.items(), key=lambda kv: -kv[1])},
        "landCells": land_cells,
        "noDataShare": round(1.0 - land_cells / total_cells, 4) if total_cells else None,
        "dominant": {"code": code(dom_n), "name": leg[dom_n]["name"], "share": shares[code(dom_n)]},
        "classes": {code(n): leg[n]["name"] for n, _ in order},
        "marker": {
            "code": code(marker["class"]) if marker["class"] else None,
            "name": leg[marker["class"]]["name"] if marker["class"] else None,
            "window": marker["window"],
            "cells": {code(n): c for n, c in marker["cells"].items()},
            "tiedClasses": [code(n) for n in marker["tiedClasses"]] if marker["tiedClasses"] else None,
        },
    }
    if marker["class"] is None:
        out["marker"]["nullReason"] = marker.get("nullReason")
    return out


def run(region_id: str) -> dict:
    """Run the stage for one region. Returns the output document (status ok or failed)."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    reg = common.registry()[region_id]
    lon, lat = common.markers()[region_id]
    doc = {
        "stage": STAGE,
        "id": region_id,
        "status": "ok",
        "method": {
            "version": METHOD_VERSION,
            "summary": ("Koppen-Geiger class share inside the region footprint at 1 km: cells chosen with "
                        "rasterio.mask(all_touched=False), sea / no-data cells (value 0) excluded, each cell "
                        "weighted by cos(latitude) so a share is a share of land area; dominant = largest "
                        "share; marker class = mode of the 3x3 cells around the marker, centre cell wins ties."),
            "raster": RASTER_NAME,
            "cellSizeDeg": 1 / 120,
        },
        "source": SOURCE,
        "footprint": footprint_record(region_id, reg),
        "marker": [lon, lat],
        "inputFingerprint": None,
        "inputs": [],
        "computedAt": now,
    }
    try:
        zinfo = verify_zip()
        doc["inputFingerprint"] = input_fingerprint()
        geom = common.load_footprint(region_id)
        periods, inputs = {}, []
        for period in PERIODS:
            _, rec = raster_source(period)
            inputs.append(rec)
            periods[period] = period_result(period, geom, lon, lat)
        doc["inputs"] = [{"file": zinfo["file"], "bytes": zinfo["bytes"], "md5": zinfo["md5"],
                          "note": "md5 equals Figshare's published md5 for file 61012822"}] + inputs
        doc["retrieved"] = zinfo["retrieved"]
        doc["periods"] = periods
        doc["flags"] = flags_for(periods)
        doc["notes"] = notes_for(periods)
    except Exception as exc:  # noqa: BLE001 - a failed stage is recorded, never guessed
        doc["status"] = "failed"
        doc["error"] = f"{type(exc).__name__}: {exc}"
        doc.pop("periods", None)
        doc["flags"] = [f"stage failed: {doc['error']}"]
        doc.setdefault("retrieved", None)
    return doc


def footprint_record(region_id: str, reg: dict | None = None) -> dict:
    reg = reg or common.registry()[region_id]
    h = hashlib.sha256(json.dumps(reg, sort_keys=True, ensure_ascii=False).encode("utf-8"))
    pf = reg.get("polygonFile")
    if pf:
        h.update((common.P / "data" / pf).read_bytes())
    return {"id": region_id, "kind": reg["kind"], "areaKm2": reg["areaKm2"], "description": reg.get("description"),
            "polygonFile": pf, "sha256": h.hexdigest()}


def flags_for(periods: dict) -> list[str]:
    out = []
    for p, r in periods.items():
        if abs(r["sharesSum"] - 1.0) > 0.02:
            out.append(f"{p}: shares sum {r['sharesSum']} (outside 1 +- 0.02)")
        if r["noDataShare"] is not None and r["noDataShare"] > 0.25:
            out.append(f"{p}: {r['noDataShare']:.0%} of the footprint cells are sea / no data (excluded from shares)")
        if r["marker"]["code"] is None:
            out.append(f"{p}: marker class is null ({r['marker'].get('nullReason')})")
    return out


def notes_for(periods: dict) -> list[str]:
    """Informational remarks (not defects)."""
    out = []
    codes = {p: r["dominant"]["code"] for p, r in periods.items()}
    if len(set(codes.values())) > 1:
        out.append("dominant class changes across periods: " + ", ".join(f"{p} {c}" for p, c in codes.items()))
    return out


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("region")
    ap.add_argument("--out", default=None, help="write <out>/<region>/koppen.json instead of printing")
    a = ap.parse_args(argv)
    doc = run(a.region)
    text = json.dumps(doc, indent=2, ensure_ascii=False)
    if a.out:
        d = Path(a.out) / a.region
        d.mkdir(parents=True, exist_ok=True)
        (d / "koppen.json").write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0 if doc["status"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
