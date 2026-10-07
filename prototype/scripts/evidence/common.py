"""Shared utilities for the evidence pipeline (EV-FOOT).

Run with the project virtualenv:
    prototype/.venv/bin/python

What lives here
  * paths            R, P, U, FOOTPRINT_JSON, FOOTPRINT_DIR
  * GCMS             the WorldClim CMIP6 model list used by the climate stage
  * footprints       registry(), load_footprint(id), markers(), footprint_ids()
  * geometry         EA_CRS, to_ea(), area_km2(), disc(), simplify_to_budget()
  * network          with_retry(), fetch()  (size/hash/zip asserted; curl exit 0 is never trusted)
  * regions          regions_list()  (runs dump_regions.mjs so the id list is read from data, never typed)

History lesson baked in (see land-selection-framework/CLAUDE.md): large downloads
truncated silently on this connection while curl exited 0. fetch() therefore asserts
the byte count against the server's Content-Length (HEAD), an optional expected size or
sha256, a minimum size, and a zip/gzip/JSON integrity test before the file is accepted.
"""
from __future__ import annotations

import gzip
import hashlib
import json
import math
import os
import shutil
import subprocess
import sys
import time
import zipfile
from pathlib import Path

HERE = Path(__file__).resolve().parent
P = HERE.parent.parent            # .../prototype
R = P.parent                      # repo root
U = R / "upgrade-2026-10"
FOOTPRINT_JSON = P / "data" / "footprints.json"
FOOTPRINT_DIR = P / "data" / "footprints"

# Equal-area CRS used for every areaKm2 in the project (World Cylindrical Equal Area).
EA_CRS = "EPSG:6933"
WGS84 = "EPSG:4326"

# WorldClim 2.1 CMIP6 models used by the climate stage (SSP2-4.5, 2041-2060, 2.5 arc-min).
# GFDL-ESM4 returns HTTP 404 on geodata.ucdavis.edu; it stays in the list so a run records
# the failure explicitly. The climate stage must require n_models >= GCM_MIN_OK and list
# the failed models in its output.
GCMS = (
    "ACCESS-CM2 ACCESS-ESM1-5 BCC-CSM2-MR CanESM5 CMCC-ESM2 CNRM-CM6-1 CNRM-ESM2-1 "
    "EC-Earth3-Veg GISS-E2-1-G HadGEM3-GC31-LL INM-CM5-0 IPSL-CM6A-LR MIROC-ES2L MIROC6 "
    "MPI-ESM1-2-HR MRI-ESM2-0 UKESM1-0-LL GFDL-ESM4"
).split()
GCM_MIN_OK = 15
GCM_KNOWN_404 = ("GFDL-ESM4",)


def gcm_url(gcm: str, ssp: str = "ssp245", period: str = "2041-2060") -> str:
    return (
        f"https://geodata.ucdavis.edu/cmip6/2.5m/{gcm}/{ssp}/"
        f"wc2.1_2.5m_bioc_{gcm}_{ssp}_{period}.tif"
    )


# --------------------------------------------------------------------------- retry / download


class DownloadError(RuntimeError):
    pass


def with_retry(fn, *, tries: int = 4, delay: float = 2.0, backoff: float = 2.0,
               validate=None, what: str = "operation", log=None):
    """Call fn() until it returns a value that passes validate(value) (if given).

    validate may return False or raise to signal a bad result (for example a truncated
    download). Exceptions from fn count as failures too. After `tries` failures the last
    error is re-raised as DownloadError. Never swallows a final failure.
    """
    log = log or (lambda m: print(m, file=sys.stderr))
    last = None
    wait = delay
    for attempt in range(1, tries + 1):
        try:
            value = fn()
            if validate is not None:
                ok = validate(value)
                if ok is False:
                    raise DownloadError(f"{what}: validation failed")
            return value
        except Exception as exc:  # noqa: BLE001 - any failure triggers a retry
            last = exc
            log(f"[with_retry] {what}: attempt {attempt}/{tries} failed: {exc}")
            if attempt < tries:
                time.sleep(wait)
                wait *= backoff
    raise DownloadError(f"{what}: failed after {tries} attempts: {last}") from last


def sha256_file(path: os.PathLike) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as fh:
        for chunk in iter(lambda: fh.read(1 << 20), b""):
            h.update(chunk)
    return h.hexdigest()


def _curl(args: list[str], timeout: int) -> subprocess.CompletedProcess:
    return subprocess.run(["curl", "-sS", "-L", "--fail", "--connect-timeout", "20", *args],
                          capture_output=True, text=True, timeout=timeout)


def head_content_length(url: str, timeout: int = 60) -> int | None:
    """Content-Length of the final response, or None when the server does not send one."""
    cp = _curl(["-I", url], timeout)
    if cp.returncode != 0:
        raise DownloadError(f"HEAD {url}: curl exit {cp.returncode}: {cp.stderr.strip()[:200]}")
    length = None
    for block in cp.stdout.replace("\r", "").split("\n\n"):
        for line in block.split("\n"):
            if line.lower().startswith("content-length:"):
                try:
                    length = int(line.split(":", 1)[1].strip())
                except ValueError:
                    pass
    return length


def verify_file(path: os.PathLike, *, expect_bytes: int | None = None, sha256: str | None = None,
                min_bytes: int = 1, kind: str | None = None) -> dict:
    """Assert a file on disk is complete. kind: zip | gz | json | None (guessed from suffix)."""
    p = Path(path)
    if not p.is_file():
        raise DownloadError(f"{p}: missing")
    size = p.stat().st_size
    if size < min_bytes:
        raise DownloadError(f"{p}: {size} bytes < minimum {min_bytes}")
    if expect_bytes is not None and size != expect_bytes:
        raise DownloadError(f"{p}: {size} bytes != expected {expect_bytes} (truncated?)")
    digest = sha256_file(p)
    if sha256 and digest != sha256.lower():
        raise DownloadError(f"{p}: sha256 {digest} != expected {sha256}")
    kind = kind or {".zip": "zip", ".gz": "gz", ".json": "json", ".geojson": "json"}.get(p.suffix.lower())
    if kind == "zip":
        with zipfile.ZipFile(p) as zf:
            bad = zf.testzip()
            if bad:
                raise DownloadError(f"{p}: corrupt zip member {bad}")
    elif kind == "gz":
        with gzip.open(p, "rb") as fh:
            while fh.read(1 << 20):
                pass
    elif kind == "json":
        with open(p, "rb") as fh:
            json.load(fh)
    return {"path": str(p), "bytes": size, "sha256": digest}


def fetch(url: str, dest: os.PathLike, *, expect_bytes: int | None = None, sha256: str | None = None,
          min_bytes: int = 1, kind: str | None = None, tries: int = 4, timeout: int = 900,
          headers: list[str] | None = None, log=None) -> dict:
    """Download url -> dest atomically and assert it is complete. Returns {path, bytes, sha256}.

    A cached dest that already passes verify_file() is reused. Completeness is judged by,
    in order: expect_bytes, the server Content-Length (HEAD), sha256, min_bytes, and a
    zip/gz/json integrity test. curl's exit status alone is never trusted.
    """
    dest = Path(dest)
    dest.parent.mkdir(parents=True, exist_ok=True)
    if dest.is_file():
        try:
            return verify_file(dest, expect_bytes=expect_bytes, sha256=sha256,
                               min_bytes=min_bytes, kind=kind)
        except Exception:  # noqa: BLE001 - stale or partial cache, re-download
            dest.unlink()

    want = expect_bytes
    if want is None:
        try:
            want = head_content_length(url)
        except DownloadError:
            want = None  # some servers refuse HEAD; the other assertions still apply

    tmp = dest.with_name(dest.name + ".part")

    def once():
        if tmp.exists():
            tmp.unlink()
        args = ["--retry", "2", "-o", str(tmp)]
        for h in headers or []:
            args += ["-H", h]
        cp = _curl([*args, url], timeout)
        if cp.returncode != 0:
            raise DownloadError(f"curl exit {cp.returncode}: {cp.stderr.strip()[:200]}")
        return verify_file(tmp, expect_bytes=want, sha256=sha256, min_bytes=min_bytes, kind=kind)

    try:
        info = with_retry(once, tries=tries, what=f"fetch {url}", log=log)
    finally:
        pass
    shutil.move(str(tmp), str(dest))
    info["path"] = str(dest)
    return info


# --------------------------------------------------------------------------- geometry


def _pyproj():
    import pyproj  # local import so the pure-network helpers work without geo packages
    return pyproj


def to_ea(geom, src_crs: str = WGS84):
    """Project a shapely geometry (or a geopandas GeoSeries/GeoDataFrame) to the equal-area CRS."""
    if hasattr(geom, "to_crs"):
        g = geom if geom.crs is not None else geom.set_crs(src_crs)
        return g.to_crs(EA_CRS)
    from shapely.ops import transform
    tr = _pyproj().Transformer.from_crs(src_crs, EA_CRS, always_xy=True).transform
    return transform(tr, geom)


def from_ea(geom):
    from shapely.ops import transform
    tr = _pyproj().Transformer.from_crs(EA_CRS, WGS84, always_xy=True).transform
    return transform(tr, geom)


def area_km2(geom_4326) -> float:
    """Area in km2 of an EPSG:4326 shapely geometry, computed in EA_CRS."""
    return float(to_ea(geom_4326).area) / 1e6


def disc(lon: float, lat: float, radius_km: float, quad_segs: int = 32):
    """Geodesic-style disc around a point: a buffer in a local azimuthal-equidistant CRS."""
    from shapely.geometry import Point
    from shapely.ops import transform
    pp = _pyproj()
    aeqd = pp.CRS.from_proj4(f"+proj=aeqd +lat_0={lat} +lon_0={lon} +x_0=0 +y_0=0 +datum=WGS84 +units=m")
    back = pp.Transformer.from_crs(aeqd, WGS84, always_xy=True).transform
    return transform(back, Point(0, 0).buffer(radius_km * 1000.0, quad_segs=quad_segs))


def dissolve(geoms):
    """Union an iterable of geometries into one valid geometry."""
    from shapely.ops import unary_union
    from shapely.validation import make_valid
    u = unary_union([make_valid(g) for g in geoms if g is not None and not g.is_empty])
    return make_valid(u)


def _polygons_only(geom):
    from shapely.geometry import MultiPolygon, Polygon
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    if hasattr(geom, "geoms"):
        out = []
        for g in geom.geoms:
            out.extend(_polygons_only(g))
        return out
    return []


def simplify_to_budget(geom_4326, *, tolerance: float = 0.005, min_part_km2: float = 1.0,
                       budget_bytes: int = 30_000, decimals: int = 4):
    """Drop parts under min_part_km2, simplify (topology-preserving), and tighten until the
    serialised GeoJSON fits budget_bytes. Returns (geometry, tolerance_used, bytes)."""
    import shapely
    from shapely.geometry import MultiPolygon
    from shapely.validation import make_valid

    parts = [p for p in _polygons_only(make_valid(geom_4326)) if area_km2(p) >= min_part_km2]
    if not parts:
        raise ValueError("no polygon part survives the minimum-area filter")
    base = MultiPolygon(parts) if len(parts) > 1 else parts[0]
    tol = tolerance
    while True:
        g = base.simplify(tol, preserve_topology=True)
        # snap to the output precision first, so rounding the coordinates cannot break validity
        g = make_valid(shapely.set_precision(g, 10.0 ** -decimals))
        keep = [p for p in _polygons_only(g) if area_km2(p) >= min_part_km2]
        g = MultiPolygon(keep) if len(keep) > 1 else keep[0]
        size = len(feature_collection_bytes(g, decimals=decimals))
        if size <= budget_bytes or tol > 0.5:
            return g, tol, size
        tol *= 1.35


def round_coords(obj, decimals: int):
    if isinstance(obj, (list, tuple)):
        if obj and isinstance(obj[0], (int, float)):
            return [round(float(v), decimals) for v in obj]
        return [round_coords(o, decimals) for o in obj]
    return obj


def feature_collection_bytes(geom, props: dict | None = None, decimals: int = 4) -> bytes:
    from shapely.geometry import mapping
    m = mapping(geom)
    feat = {"type": "Feature", "properties": props or {},
            "geometry": {"type": m["type"], "coordinates": round_coords(m["coordinates"], decimals)}}
    fc = {"type": "FeatureCollection", "features": [feat]}
    return json.dumps(fc, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


# --------------------------------------------------------------------------- registry


def registry() -> dict:
    """The footprint registry (data/footprints.json): {region id: entry}."""
    with open(FOOTPRINT_JSON, encoding="utf-8") as fh:
        return json.load(fh)


def footprint_ids() -> list[str]:
    return list(registry().keys())


def markers() -> dict[str, tuple[float, float]]:
    """{region id: (lon, lat)} of every region's marker, as recorded in the registry."""
    return {rid: (float(e["marker"][0]), float(e["marker"][1])) for rid, e in registry().items()}


def load_footprint(region_id: str):
    """Shapely geometry (EPSG:4326) of a region's footprint.

    polygon -> the shipped GeoJSON (simplified; areaKm2 in the registry is from the
    full-resolution geometry); bbox -> the bounds rectangle; disc -> a radiusKm disc around
    the marker.
    """
    from shapely.geometry import box, shape
    entry = registry()[region_id]
    kind = entry["kind"]
    if kind == "polygon":
        with open(P / "data" / entry["polygonFile"], encoding="utf-8") as fh:
            gj = json.load(fh)
        feats = gj["features"] if gj.get("type") == "FeatureCollection" else [gj]
        return dissolve([shape(f["geometry"] if "geometry" in f else f) for f in feats])
    if kind == "bbox":
        w, s, e, n = entry["bounds"]
        return box(w, s, e, n)
    if kind == "disc":
        lon, lat = entry["marker"]
        return disc(lon, lat, float(entry["radiusKm"]))
    raise ValueError(f"{region_id}: unknown footprint kind {kind!r}")


def regions_list(with_new: bool = True) -> list[dict]:
    """[{id, continent, lon, lat, name}] from dump_regions.mjs (ids come from data, never typed)."""
    cmd = ["node", str(HERE / "dump_regions.mjs")] + (["--with-new"] if with_new else [])
    cp = subprocess.run(cmd, capture_output=True, text=True, cwd=str(P), timeout=120)
    if cp.returncode != 0:
        raise RuntimeError(f"dump_regions.mjs failed: {cp.stderr.strip()[:300]}")
    return json.loads(cp.stdout)


def km_between(lon1: float, lat1: float, lon2: float, lat2: float) -> float:
    """Great-circle distance in km (haversine)."""
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = p2 - p1
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * 6371.0088 * math.asin(math.sqrt(a))


def marker_distance_km(region_id: str) -> float:
    """Distance in km from a region's marker to its footprint geometry (0 when inside)."""
    from shapely.geometry import Point
    lon, lat = markers()[region_id]
    g = to_ea(load_footprint(region_id))
    return float(g.distance(to_ea(Point(lon, lat)))) / 1000.0
