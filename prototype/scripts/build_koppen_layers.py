#!/usr/bin/env python
"""Build the Koppen-Geiger vector map layers (lazy, continent-clipped GeoJSON).

Source: Beck et al. 2023, "High-resolution (1 km) Koppen-Geiger maps for
1901-2099 based on constrained CMIP6 projections", Scientific Data 10:724,
doi:10.1038/s41597-023-02549-6. Dataset doi:10.6084/m9.figshare.21789074.v2,
licence CC BY 4.0. We use the 0.1 degree rasters:
  1991_2020/koppen_geiger_0p1.tif            (observation-constrained climatology)
  2041_2070/ssp245/koppen_geiger_0p1.tif     (projection under SSP2-4.5)

Outputs (all under prototype/data/processed/):
  koppen-1991-2020-eu.geojson          koppen-1991-2020-na.geojson
  koppen-2041-2070-ssp245-eu.geojson   koppen-2041-2070-ssp245-na.geojson
  koppen-legend.json                   (30 classes + attribution + per-layer stats)

Usage (run with prototype/.venv/bin/python):
  build_koppen_layers.py            build all outputs from the verified source zip, then --check
  build_koppen_layers.py --check    validate the outputs only (no source needed)

The source zip is used only if its size and md5 match the published values;
an unverified download is never used (the script stops instead).
"""
import argparse
import gzip
import hashlib
import json
import re
import sys
import tempfile
import urllib.request
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
PROTO = HERE.parent
REPO = PROTO.parent
OUT = PROTO / "data" / "processed"
UPG = REPO / "upgrade-2026-10"
CACHED_ZIP = UPG / "tracks" / "evidence-tools" / "raw" / "koppen_geiger_tif.zip"
PROBE = UPG / "tracks" / "evidence-tools" / "out" / "koppen-probe-30.json"
SELECTION = UPG / "regions" / "selection.json"
REGIONS_JS = PROTO / "data" / "regions.js"

ZIP_URL = "https://ndownloader.figshare.com/files/61012822"
ZIP_MD5 = "7fc2f5a15d4f5fe0ce59c9a9b502aa09"
ZIP_SIZE = 130_618_411

# continent -> (west, south, east, north), all on the 0.1 degree grid
BBOX = {"eu": (-12.0, 35.0, 40.0, 72.0), "na": (-126.0, 14.0, -52.0, 60.0)}
# (output stem, member inside the zip, probe period key)
PERIODS = [
    ("1991-2020", "1991_2020/koppen_geiger_0p1.tif", "1991_2020"),
    ("2041-2070-ssp245", "2041_2070/ssp245/koppen_geiger_0p1.tif", "2041_2070_ssp245"),
]
BUDGET_BYTES = {"eu": 360 * 1024, "na": 640 * 1024}
SIMPLIFY_DEG = 0.05
MIN_PART_SQDEG = 0.02
DECIMALS = 2
MIN_MARKER_AGREE = 26  # of the 30 probed region markers

GROUPS = {
    "A": "Tropical",
    "B": "Arid",
    "C": "Temperate",
    "D": "Cold",
    "E": "Polar",
}

ATTRIBUTION = (
    "Beck et al. 2023, Scientific Data 10:724, CC BY 4.0 "
    "(0.1 degree raster, vectorised and simplified; boundaries are approximate)"
)
CITATION = (
    "Beck, H. E., McVicar, T. R., Vergopolan, N., Berg, A., Lutsko, N. J., Dufour, A., "
    "Zeng, Z., Jiang, X., van Dijk, A. I. J. M., Miralles, D. G. High-resolution (1 km) "
    "Koppen-Geiger maps for 1901-2099 based on constrained CMIP6 projections. "
    "Scientific Data 10, 724 (2023). https://doi.org/10.1038/s41597-023-02549-6"
)
VINTAGES = {
    "1991-2020": "1991-2020 climatology, constrained by observations",
    "2041-2070-ssp245": "2041-2070 projection under SSP2-4.5 (one scenario, not a forecast)",
}


def log(*a):
    print(*a, flush=True)


def md5_of(path, chunk=1 << 20):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for b in iter(lambda: f.read(chunk), b""):
            h.update(b)
    return h.hexdigest()


def zip_ok(path):
    p = Path(path)
    if not p.exists() or p.stat().st_size != ZIP_SIZE:
        return False
    return md5_of(p) == ZIP_MD5


def obtain_zip(tmpdir):
    if zip_ok(CACHED_ZIP):
        log(f"source: cached zip verified (size {ZIP_SIZE}, md5 {ZIP_MD5})")
        return CACHED_ZIP
    dest = Path(tmpdir) / "koppen_geiger_tif.zip"
    log(f"source: cached zip missing or unverified; downloading {ZIP_URL}")
    with urllib.request.urlopen(ZIP_URL, timeout=120) as r, open(dest, "wb") as f:
        while True:
            b = r.read(1 << 20)
            if not b:
                break
            f.write(b)
    if not zip_ok(dest):
        got = dest.stat().st_size
        sys.exit(
            f"STOP: downloaded zip failed verification (size {got}, expected {ZIP_SIZE}; "
            f"md5 expected {ZIP_MD5}). Unverified geometry is not shipped."
        )
    log("source: download verified")
    return dest


def parse_legend(text):
    """legend.txt lines look like '    8:  Csa  Temperate, dry summer, hot summer   [255 255 0]'."""
    rows = []
    for m in re.finditer(r"^\s*(\d+):\s+(\w+)\s+(.+?)\s+\[(\d+) (\d+) (\d+)\]\s*$", text, re.M):
        num, code, name = int(m.group(1)), m.group(2), m.group(3)
        rgb = [int(m.group(4)), int(m.group(5)), int(m.group(6))]
        rows.append({"id": num, "code": code, "name": name, "group": code[0],
                     "rgb": rgb, "hex": "#%02x%02x%02x" % tuple(rgb)})
    if len(rows) != 30 or [r["id"] for r in rows] != list(range(1, 31)):
        sys.exit(f"STOP: legend.txt did not parse to 30 ordered classes (got {len(rows)})")
    return rows


def round_coords(obj, nd):
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(float(v), nd) for v in obj]
        return [round_coords(o, nd) for o in obj]
    return obj


def build_layer(tif_path, bbox, code_by_id):
    import numpy as np
    import rasterio
    from rasterio.features import shapes, sieve
    from rasterio.windows import from_bounds, Window
    import shapely
    from shapely.geometry import shape, mapping, MultiPolygon, Polygon
    from shapely.geometry.polygon import orient
    from shapely.ops import unary_union

    w, s, e, n = bbox
    with rasterio.open(tif_path) as src:
        win = from_bounds(w, s, e, n, transform=src.transform)
        win = Window(round(win.col_off), round(win.row_off), round(win.width), round(win.height))
        arr = src.read(1, window=win)
        tr = src.window_transform(win)
    # fold parts smaller than MIN_PART_SQDEG into their largest neighbour at raster level, so
    # removing specks leaves no holes in the map (0.1 degree pixel = 0.01 square degrees)
    min_px = max(1, round(MIN_PART_SQDEG / (abs(tr.a) * abs(tr.e))))
    arr = sieve(arr, size=min_px, connectivity=4)
    mask = arr != 0  # 0 = ocean / no data
    by_class = {}
    for geom, val in shapes(arr, mask=mask, transform=tr, connectivity=4):
        by_class.setdefault(int(val), []).append(shape(geom))
    # one dissolved (multi)polygon per class: exact pixel edges, so the union is clean
    classes = sorted(by_class)
    dissolved = [unary_union(by_class[c]) for c in classes]
    # simplify all classes together so shared boundaries stay shared (no gaps or overlaps)
    simp = list(shapely.coverage_simplify(np.array(dissolved, dtype=object), SIMPLIFY_DEG))
    feats = []
    stats = {"parts_in": 0, "parts_dropped": 0}
    for c, g in zip(classes, simp):
        parts = list(g.geoms) if g.geom_type == "MultiPolygon" else [g]
        kept = []
        for p in parts:
            stats["parts_in"] += 1
            if p.is_empty or p.area < MIN_PART_SQDEG:
                stats["parts_dropped"] += 1
                continue
            kept.append(p)
        if not kept:
            continue
        mp = shapely.set_precision(MultiPolygon([orient(p) for p in kept]), 10 ** -DECIMALS)
        polys = []
        for p in (mp.geoms if mp.geom_type == "MultiPolygon" else [mp]):
            if p.geom_type == "Polygon" and not p.is_empty and p.area > 0:
                polys.append(orient(p))
        if not polys:
            continue
        mp = MultiPolygon(polys)
        feats.append({
            "type": "Feature",
            "properties": {"k": code_by_id[c]},
            "geometry": {"type": "MultiPolygon",
                         "coordinates": round_coords(mapping(mp)["coordinates"], DECIMALS)},
        })
    return {"type": "FeatureCollection", "features": feats}, stats


def dump(fc, path):
    # compact separators, features on their own lines: small and diff-friendly
    parts = [json.dumps(f, separators=(",", ":")) for f in fc["features"]]
    text = '{"type":"FeatureCollection","features":[\n' + ",\n".join(parts) + "\n]}\n"
    Path(path).write_text(text, encoding="utf-8")
    raw = len(text.encode("utf-8"))
    gz = len(gzip.compress(text.encode("utf-8"), 9))
    return raw, gz


def build():
    with tempfile.TemporaryDirectory() as td:
        zpath = obtain_zip(td)
        with zipfile.ZipFile(zpath) as z:
            legend_rows = parse_legend(z.read("legend.txt").decode("utf-8", "replace"))
            code_by_id = {r["id"]: r["code"] for r in legend_rows}
            z.extract("legend.txt", td)
            tifs = {}
            for stem, member, _ in PERIODS:
                z.extract(member, td)
                tifs[stem] = Path(td) / member
        layers = {}
        OUT.mkdir(parents=True, exist_ok=True)
        for stem, _, _ in PERIODS:
            for cont, bbox in BBOX.items():
                fc, st = build_layer(tifs[stem], bbox, code_by_id)
                fname = f"koppen-{stem}-{cont}.geojson"
                raw, gz = dump(fc, OUT / fname)
                present = sorted({f["properties"]["k"] for f in fc["features"]},
                                 key=lambda c: [r["code"] for r in legend_rows].index(c))
                layers[fname] = {
                    "period": stem, "continent": cont, "bbox": list(bbox),
                    "vintage": VINTAGES[stem], "bytes": raw, "bytes_gzip": gz,
                    "classes_present": present, **st,
                }
                log(f"{fname}: {raw/1024:.0f} KB raw, {gz/1024:.0f} KB gz, "
                    f"{len(fc['features'])} class features, parts dropped {st['parts_dropped']}/{st['parts_in']}")
    legend = {
        "id": "koppen-geiger",
        "title": "Koppen-Geiger climate classes",
        "attribution": ATTRIBUTION,
        "citation": CITATION,
        "license": "CC BY 4.0",
        "license_url": "https://creativecommons.org/licenses/by/4.0/",
        "source": "Beck et al. 2023, Scientific Data 10:724",
        "source_doi": "https://doi.org/10.1038/s41597-023-02549-6",
        "dataset_doi": "https://doi.org/10.6084/m9.figshare.21789074.v2",
        "dataset_url": "https://figshare.com/articles/dataset/High-resolution_1_km_K_ppen-Geiger_maps_for_1901-2099_based_on_constrained_CMIP6_projections/21789074",
        "source_file_md5": ZIP_MD5,
        "resolution": "0.1 degree raster (about 11 km), vectorised, simplified 0.05 degrees, "
                      "parts under 0.02 square degrees dropped, coordinates rounded to 2 decimals",
        "caveat": "Class boundaries are approximate at this resolution. The future layer is one "
                  "scenario (SSP2-4.5), not a forecast. Class names follow the source legend.",
        "groups": GROUPS,
        "classes": [{"code": r["code"], "name": r["name"], "group": r["group"],
                     "rgb": r["rgb"], "hex": r["hex"]} for r in legend_rows],
        "layers": layers,
    }
    (OUT / "koppen-legend.json").write_text(
        json.dumps(legend, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    log("wrote koppen-legend.json")


# ----------------------------------------------------------------- check

def marker_coords():
    """id -> (lon, lat) for the live regions (regions.js) and the planned new ones (selection.json)."""
    out = {}
    if REGIONS_JS.exists():
        s = REGIONS_JS.read_text(encoding="utf-8")
        for m in re.finditer(r"id:\s*'([^']+)',\s*continent:\s*'([^']+)',\s*name:\s*'([^']+)'.*?coords:\s*\[([^\]]+)\]", s, re.S):
            lon, lat = [float(x) for x in m.group(4).split(",")]
            out[m.group(1)] = (lon, lat)
    if SELECTION.exists():
        for r in json.loads(SELECTION.read_text(encoding="utf-8")):
            out.setdefault(r["id"], (r["coords"][0], r["coords"][1]))
    return out


def polygon_class_at(fc, lon, lat):
    from shapely.geometry import shape, Point
    pt = Point(lon, lat)
    for f in fc["features"]:
        if shape(f["geometry"]).intersects(pt):
            return f["properties"]["k"]
    return None


def check():
    from shapely.geometry import shape
    problems = []
    notes = []
    legend_path = OUT / "koppen-legend.json"
    if not legend_path.exists():
        sys.exit(f"FAIL: {legend_path} missing")
    legend = json.loads(legend_path.read_text(encoding="utf-8"))
    codes = [c["code"] for c in legend.get("classes", [])]
    if len(codes) != 30 or len(set(codes)) != 30:
        problems.append(f"legend has {len(codes)} classes, expected 30 distinct")
    for c in legend.get("classes", []):
        if c.get("group") not in GROUPS or not c["code"].startswith(c["group"]):
            problems.append(f"legend class {c.get('code')} has bad group")
        if not (isinstance(c.get("rgb"), list) and len(c["rgb"]) == 3):
            problems.append(f"legend class {c.get('code')} has no source RGB")
    attr = legend.get("attribution", "")
    for needle in ("Beck et al. 2023", "Scientific Data 10:724", "CC BY 4.0"):
        if needle not in attr:
            problems.append(f"legend attribution lacks '{needle}'")
    codeset = set(codes)

    fcs = {}
    for stem, _, pkey in PERIODS:
        for cont in BBOX:
            fname = f"koppen-{stem}-{cont}.geojson"
            p = OUT / fname
            if not p.exists():
                problems.append(f"{fname} missing")
                continue
            size = p.stat().st_size
            gz = len(gzip.compress(p.read_bytes(), 9))
            try:
                fc = json.loads(p.read_text(encoding="utf-8"))
            except Exception as ex:  # noqa: BLE001
                problems.append(f"{fname} is not valid JSON: {ex}")
                continue
            fcs[(stem, cont)] = fc
            if fc.get("type") != "FeatureCollection" or not fc.get("features"):
                problems.append(f"{fname} is not a non-empty FeatureCollection")
                continue
            bad_k = {f["properties"].get("k") for f in fc["features"]} - codeset
            if bad_k:
                problems.append(f"{fname} has k values outside the legend: {sorted(map(str, bad_k))}")
            w, s, e, n = BBOX[cont]
            for f in fc["features"]:
                g = shape(f["geometry"])
                if not g.is_valid:
                    problems.append(f"{fname} class {f['properties']['k']} geometry invalid")
                bx = g.bounds
                if bx[0] < w - 1e-6 or bx[1] < s - 1e-6 or bx[2] > e + 1e-6 or bx[3] > n + 1e-6:
                    problems.append(f"{fname} class {f['properties']['k']} outside bbox {BBOX[cont]}")
            if size > BUDGET_BYTES[cont]:
                problems.append(f"{fname} is {size} bytes, over the {BUDGET_BYTES[cont]} budget")
            lay = legend.get("layers", {}).get(fname, {})
            if lay.get("bytes") != size:
                problems.append(f"{fname} size {size} differs from legend record {lay.get('bytes')} (rebuild)")
            notes.append(f"{fname}: {size/1024:.0f} KB raw (budget {BUDGET_BYTES[cont]/1024:.0f}), {gz/1024:.0f} KB gz, "
                         f"{len(fc['features'])} classes")

    # region markers: polygon class vs the 1 km probe
    if PROBE.exists() and len(fcs) == 4:
        probe = json.loads(PROBE.read_text(encoding="utf-8"))
        coords = marker_coords()
        for stem, _, pkey in PERIODS:
            agree, diffs, skipped = 0, [], []
            for rid, per in probe.items():
                if rid not in coords:
                    skipped.append(rid)
                    continue
                lon, lat = coords[rid]
                cont = "eu" if -12 <= lon <= 40 and 35 <= lat <= 72 else "na"
                want = per[pkey]["centre3x3"]
                got = polygon_class_at(fcs[(stem, cont)], lon, lat)
                if got == want:
                    agree += 1
                else:
                    diffs.append(f"{rid}: polygon {got} vs probe {want}")
            evaluated = agree + len(diffs)
            need = MIN_MARKER_AGREE if not skipped else max(0, evaluated - (len(probe) - MIN_MARKER_AGREE))
            notes.append(f"markers {stem}: {agree}/{evaluated} agree with probe (need >= {need})"
                         + (f"; skipped (not in data): {skipped}" if skipped else ""))
            for d in diffs:
                notes.append(f"  difference [{stem}] {d}")
            if agree < need:
                problems.append(f"markers {stem}: only {agree}/{evaluated} agree with probe (need >= {need})")
    else:
        notes.append("marker probe comparison skipped (probe file or layer files missing)")

    for n_ in notes:
        log(n_)
    if problems:
        for p in problems:
            log("FAIL:", p)
        sys.exit(1)
    log("OK: koppen layers valid")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--check", action="store_true", help="validate outputs only")
    a = ap.parse_args()
    if not a.check:
        build()
    check()


if __name__ == "__main__":
    main()
