"""Canonical pipeline stage: WRI Aqueduct 4.0 water indicators over a region footprint (EV-PIPE-LOCAL).

Source: WRI Aqueduct 4.0 data release Y2023M07D05 (file geodatabase, HydroBASINS level 6 sub-basins)
    prototype/data/raw/aqueduct-extract/Aqueduct40_waterrisk_download_Y2023M07D05/GDB/Aq40_Y2023D07M05.gdb
    layers  baseline_annual   (bws_raw, drr, iav, sev, gtd, rfr indicators)
            future_annual     (bau50_ws_x_r: water stress, 2050, business-as-usual scenario)

Method: basin polygons are intersected with the footprint in the equal-area CRS the whole project
uses for areas (EPSG:6933, `common.EA_CRS`; the finger-lakes prototype used EPSG:3035, both are
equal-area, so weighted means agree; 6933 keeps coverage comparable with the registry's areaKm2).
Numeric indicators are AREA-WEIGHTED means over the intersected basins that carry a real value
(sentinels -9999 = no data and 9999 = 'arid and low water use' are excluded and their area share is
reported). Categorical labels are the class with the largest intersected area (dominant by area) plus
the full area shares.

Scenario: the Aqueduct 4.0 technical note (WRI, August 2023, Version 1.0) was opened and read, see
SCENARIO below; the exact words are copied into `scenarioNote`.

    python aqueduct.py <region-id> [--out DIR] [--check-note PATH_TO_TECHNICAL_NOTE_PDF]
"""
from __future__ import annotations

import hashlib
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import common  # noqa: E402

STAGE = "aqueduct"
METHOD_VERSION = "aqueduct40-basin-areaweighted-v1"

RAW_DIR = common.P / "data" / "raw" / "aqueduct-extract" / "Aqueduct40_waterrisk_download_Y2023M07D05"
GDB = RAW_DIR / "GDB" / "Aq40_Y2023D07M05.gdb"

SENTINEL_ABS = 9990.0          # |value| >= this is a sentinel (-9999 no data, 9999 arid and low water use)
BBOX_PAD_DEG = 0.3             # read basins slightly beyond the footprint bounds
COVERAGE_MIN = 0.95            # intersected basin area / footprint area below this is flagged
VALID_MIN = 0.95               # basin area carrying a real value / footprint area below this is flagged
SENTINEL_FLAG_SHARE = 0.05

# The technical note: opened 2026-10-05 (pdftotext of the PDF below, page 9 of 'Future projections';
# summary on page 2). The strings are copied verbatim, curly quotes included.
SCENARIO = {
    "id": "business-as-usual",
    "code": "SSP3-7.0",
    "codeLong": "SSP 3 RCP 7.0",
    "year": 2050,
    "periodNote": "projections cover 30-year periods centred on 2030, 2050 and 2080",
    "field": "bau50_ws_x_r",
    "document": "Aqueduct 4.0: Updated decision-relevant global water risk indicators, WRI Technical Note, Version 1.0, August 2023",
    "url": "https://files.wri.org/d8/s3fs-public/2023-08/aqueduct-40-technical-note.pdf",
    "pdfSha256": "bb55ea20f39c4272dea87b1089725900ffbf45673709c18cb0dab8d361a97ae5",
    "pdfBytes": 4746842,
    "quotes": [
        "SSP3-7.0 represents a “business as usual” scenario with temperatures increasing by 2.8°C to 4.6°C by 2100.",
        "three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and pessimistic SSP 5 RCP 8.5)",
    ],
    "retrieved": "2026-10-05",
}
SCENARIO_NOTE = (
    "Aqueduct 4.0 technical note: “SSP3-7.0 represents a “business as usual” scenario with "
    "temperatures increasing by 2.8°C to 4.6°C by 2100.” and the projections use "
    "“three future scenarios (business-as-usual SSP 3 RCP 7.0, optimistic SSP 1 RCP 2.6, and "
    "pessimistic SSP 5 RCP 8.5)”, each centred on 2030, 2050 and 2080."
)

SOURCE = {
    "id": "aqueduct-40",
    "citation": ("Kuzma, S., Bierkens, M. F. P., Lakshman, S., Luo, T., Saccoccia, L., Sutanudjaja, E. H., "
                 "Van Beek, R. (2023). Aqueduct 4.0: Updated decision-relevant global water risk indicators. "
                 "Technical Note. Washington, DC: World Resources Institute."),
    "url": "https://www.wri.org/research/aqueduct-40-updated-decision-relevant-global-water-risk-indicators",
    "licence": "CC BY 4.0 (WRI Aqueduct data)",
    "vintage": "baseline 1979-2019; projections for 2030, 2050, 2080",
    "nativeUnit": "HydroBASINS level 6 sub-basin",
}

# raw column, label column, unit text (the technical note's own wording), layer
INDICATORS = {
    "bws": ("bws_raw", "bws_label", "ratio of demand to supply (baseline water stress), 1 = demand equals supply"),
    "drr": ("drr_raw", "drr_label", "drought risk index, 0-1"),
    "iav": ("iav_raw", "iav_label", "interannual variability, dimensionless"),
    "sev": ("sev_raw", "sev_label", "seasonal variability, dimensionless"),
    "gtd": ("gtd_raw", "gtd_label", "groundwater table decline, cm per year"),
    "rfr": ("rfr_raw", "rfr_label", "riverine flood risk, share of population affected in an average year"),
}
NO_DATA_LABELS = {"no data", "nodata"}

_cache: dict = {}


class StageError(RuntimeError):
    pass


# --------------------------------------------------------------------------- inputs


def input_record() -> dict:
    """Manifest of the geodatabase: file count, total bytes and a hash over sorted 'relpath:size'."""
    if "inputs" in _cache:
        return _cache["inputs"]
    if not GDB.is_dir():
        raise StageError(f"{GDB} is missing")
    files = sorted(p for p in RAW_DIR.rglob("*") if p.is_file())
    total = sum(p.stat().st_size for p in files)
    manifest = "\n".join(f"{p.relative_to(RAW_DIR)}:{p.stat().st_size}" for p in files)
    newest = max(p.stat().st_mtime for p in files)
    rec = {
        "file": str(GDB.relative_to(common.R)),
        "version": "Aqueduct 4.0 data release Y2023M07D05",
        "layers": ["baseline_annual", "future_annual"],
        "files": len(files),
        "bytes": total,
        "manifestSha256": hashlib.sha256(manifest.encode()).hexdigest(),
        "manifestNote": "sha256 of the sorted 'relative path:size' lines of the extracted release folder",
        "retrieved": datetime.fromtimestamp(newest, timezone.utc).strftime("%Y-%m-%d"),
    }
    _cache["inputs"] = rec
    return rec


def input_fingerprint() -> str:
    """Compact identity of the inputs, used by run_local.py to decide whether an output is still current."""
    return input_record()["manifestSha256"]


# --------------------------------------------------------------------------- compute


def _read_layer(layer: str, bounds):
    import geopandas as gpd
    w, s, e, n = bounds
    pad = BBOX_PAD_DEG
    gdf = gpd.read_file(GDB, layer=layer, bbox=(w - pad, s - pad, e + pad, n + pad), engine="pyogrio")
    return gdf


def _intersect(gdf, fp_ea):
    """Basins intersected with the footprint (EA CRS). Returns a frame with an 'a_km2' column > 0."""
    import geopandas as gpd
    from shapely.validation import make_valid
    g = gdf.copy()
    if g.crs is None:
        g = g.set_crs("EPSG:4326")
    g = g.to_crs(common.EA_CRS)
    g["geometry"] = g.geometry.apply(lambda x: make_valid(x) if x is not None and not x.is_valid else x)
    g = g[g.geometry.notna() & ~g.geometry.is_empty]
    g = g[g.geometry.intersects(fp_ea)].copy()
    g["geometry"] = g.geometry.intersection(fp_ea)
    g["a_km2"] = g.geometry.area / 1e6
    return g[g.a_km2 > 0].copy()


def _valid_numeric(series):
    import pandas as pd
    v = pd.to_numeric(series, errors="coerce")
    return v, v.notna() & (v.abs() < SENTINEL_ABS)


def _weighted(g, raw_col):
    """(mean, valid area km2, min, max) of raw_col weighted by intersected area, valid rows only."""
    v, ok = _valid_numeric(g[raw_col])
    a = g["a_km2"].where(ok, 0.0)
    if float(a.sum()) <= 0:
        return None, 0.0, None, None
    mean = float((v.where(ok, 0.0) * a).sum() / a.sum())
    return mean, float(a.sum()), float(v[ok].min()), float(v[ok].max())


def _label_shares(g, label_col):
    tot = float(g["a_km2"].sum())
    by = g.groupby(g[label_col].astype(str))["a_km2"].sum().sort_values(ascending=False)
    shares = {str(k): round(float(x) / tot, 4) for k, x in by.items()}
    real = {k: v for k, v in shares.items() if k.strip().lower() not in NO_DATA_LABELS}
    dominant = max(real, key=lambda k: (real[k], k)) if real else None
    return dominant, shares


def _round(x, nd=4):
    return None if x is None else round(float(x), nd)


def _indicator_block(g, raw_col, label_col, unit, fp_km2):
    mean, valid_km2, vmin, vmax = _weighted(g, raw_col)
    dom, shares = _label_shares(g, label_col)
    return {
        "raw": _round(mean),
        "rawMin": _round(vmin),
        "rawMax": _round(vmax),
        "unit": unit,
        "label": dom,
        "labelShares": shares,
        "validAreaKm2": round(valid_km2, 1),
        "validFractionOfFootprint": round(valid_km2 / fp_km2, 4),
    }


def run(region_id: str) -> dict:
    import pandas as pd
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    reg = common.registry()[region_id]
    lon, lat = common.markers()[region_id]
    doc = {
        "stage": STAGE,
        "id": region_id,
        "status": "ok",
        "method": {
            "version": METHOD_VERSION,
            "summary": ("Aqueduct 4.0 HydroBASINS level 6 sub-basins intersected with the region footprint in "
                        "EPSG:6933 (equal area); numeric indicators are area-weighted means over basins with a "
                        "real value (sentinels -9999 / 9999 excluded and reported); labels are the class with the "
                        "largest intersected area. bau50_ws_x_r is the 2050 business-as-usual water-stress ratio."),
            "areaCrs": common.EA_CRS,
            "sentinels": "-9999 no data, 9999 arid and low water use: excluded from means",
        },
        "source": SOURCE,
        "scenario": SCENARIO,
        "scenarioNote": SCENARIO_NOTE,
        "footprint": footprint_record(region_id, reg),
        "inputFingerprint": None,
        "marker": [lon, lat],
        "inputs": [],
        "computedAt": now,
    }
    try:
        inp = input_record()
        doc["inputFingerprint"] = input_fingerprint()
        doc["inputs"] = [inp, {"file": SCENARIO["url"], "bytes": SCENARIO["pdfBytes"], "sha256": SCENARIO["pdfSha256"],
                               "note": "technical note read for the scenario wording; not part of the numbers"}]
        doc["retrieved"] = inp["retrieved"]

        geom = common.load_footprint(region_id)
        fp_ea = common.to_ea(geom)
        fp_km2 = float(fp_ea.area) / 1e6

        base = _intersect(_read_layer("baseline_annual", geom.bounds), fp_ea)
        fut = _intersect(_read_layer("future_annual", geom.bounds), fp_ea)
        if base.empty:
            raise StageError("no baseline_annual basin intersects the footprint")
        if fut.empty:
            raise StageError("no future_annual basin intersects the footprint")

        base_km2 = float(base.a_km2.sum())
        fut_km2 = float(fut.a_km2.sum())
        doc["coverage"] = {
            "footprintKm2": round(fp_km2, 1),
            "registryAreaKm2": reg["areaKm2"],
            "baseline": {"nBasins": int(len(base)), "nPfafBasins": int(base["pfaf_id"].nunique()),
                         "unitNote": "nBasins counts baseline_annual rows (sub-basin units; several rows can share one pfaf_id, each with its own name_0 / name_1); nPfafBasins counts distinct HydroBASINS level 6 ids",
                         "intersectedKm2": round(base_km2, 1),
                         "fraction": round(base_km2 / fp_km2, 4)},
            "future": {"nBasins": int(len(fut)), "nPfafBasins": int(fut["pfaf_id"].nunique()), "intersectedKm2": round(fut_km2, 1),
                       "fraction": round(fut_km2 / fp_km2, 4)},
        }

        baseline = {}
        for key, (raw, lab, unit) in INDICATORS.items():
            baseline[key] = _indicator_block(base, raw, lab, unit, fp_km2)
        # arid / sentinel share for baseline water stress, so a mean is never read without it
        v, ok = _valid_numeric(base["bws_raw"])
        sentinel_km2 = float(base.a_km2[~ok].sum())
        baseline["bws"]["sentinelAreaKm2"] = round(sentinel_km2, 1)
        baseline["bws"]["sentinelShareOfIntersected"] = round(sentinel_km2 / base_km2, 4)

        bau = _indicator_block(fut, "bau50_ws_x_r", "bau50_ws_x_l",
                               "ratio of demand to supply, 2050 business-as-usual (SSP3-7.0), 1 = demand equals supply",
                               fp_km2)
        v2, ok2 = _valid_numeric(fut["bau50_ws_x_r"])
        s2 = float(fut.a_km2[~ok2].sum())
        bau["sentinelAreaKm2"] = round(s2, 1)
        bau["sentinelShareOfIntersected"] = round(s2 / fut_km2, 4)

        doc["baseline"] = {"year": "baseline 1979-2019", **baseline}
        doc["bau2050"] = {"scenario": SCENARIO["id"], "code": SCENARIO["code"], "field": SCENARIO["field"], **bau}

        # per-basin table (traceability): baseline geometry, future values joined by pfaf_id
        fut_by = {}
        for _, r in fut.iterrows():
            fut_by[int(float(r["pfaf_id"]))] = (r.get("bau50_ws_x_r"), r.get("bau50_ws_x_l"))
        basins = []
        for _, r in base.sort_values("a_km2", ascending=False).iterrows():
            pid = int(r["pfaf_id"])
            fr, fl = fut_by.get(pid, (None, None))
            bws = r["bws_raw"]
            basins.append({
                "pfafId": pid, "name0": r.get("name_0"), "name1": r.get("name_1"),
                "areaKm2": round(float(r.a_km2), 1), "shareOfFootprint": round(float(r.a_km2) / fp_km2, 4),
                "bwsRaw": _round(bws) if pd.notna(bws) and abs(bws) < SENTINEL_ABS else None,
                "bwsLabel": r.get("bws_label"),
                "bau50Raw": _round(fr) if fr is not None and pd.notna(fr) and abs(fr) < SENTINEL_ABS else None,
                "bau50Label": fl,
            })
        doc["basins"] = basins
        doc["flags"] = flags_for(doc)
        doc["notes"] = notes_for(doc)
    except Exception as exc:  # noqa: BLE001 - a failed stage is recorded, never guessed
        doc["status"] = "failed"
        doc["error"] = f"{type(exc).__name__}: {exc}"
        for k in ("coverage", "baseline", "bau2050", "basins"):
            doc.pop(k, None)
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


def flags_for(doc: dict) -> list[str]:
    out = []
    cov = doc["coverage"]
    for k in ("baseline", "future"):
        c = cov[k]
        if c["fraction"] < COVERAGE_MIN:
            out.append(f"{k} basin coverage {c['fraction']:.3f} of the footprint is below {COVERAGE_MIN} "
                       f"({c['nBasins']} basins; the footprint includes area outside any HydroBASINS sub-basin, "
                       f"for example sea)")
    for name, blk in (("baseline bws", doc["baseline"]["bws"]), ("bau2050 water stress", doc["bau2050"])):
        if blk["validFractionOfFootprint"] < VALID_MIN:
            out.append(f"{name}: basins with a real value cover {blk['validFractionOfFootprint']:.3f} of the footprint "
                       f"(below {VALID_MIN})")
        if blk["raw"] is None:
            out.append(f"{name}: no basin has a real value")
        if blk.get("sentinelShareOfIntersected", 0) > SENTINEL_FLAG_SHARE:
            out.append(f"{name}: {blk['sentinelShareOfIntersected']:.1%} of the intersected basin area is "
                       f"no-data or 'arid and low water use' and is excluded from the mean")
    for key in ("drr", "iav", "sev", "gtd", "rfr"):
        blk = doc["baseline"][key]
        if blk["raw"] is None:
            out.append(f"{key}: no basin has a real value (label {blk['label']})")
    return out


_BWS_EDGES = (0.1, 0.2, 0.4, 0.8)
_BWS_NAMES = ("Low (<10%)", "Low-medium (10-20%)", "Medium-high (20-40%)", "High (40-80%)", "Extremely high (>80%)")


def _label_bin(label):
    t = (label or "").lower().replace(" ", "")
    for i, key in enumerate(("low(", "low-medium", "medium-high", "high(", "extremelyhigh")):
        if t.startswith(key):
            return i
    return None


def notes_for(doc: dict) -> list[str]:
    """Informational remarks (not defects): where the area-weighted mean and the largest-area class disagree."""
    out = []
    for name, blk in (("baseline water stress", doc["baseline"]["bws"]), ("2050 business-as-usual water stress", doc["bau2050"])):
        if blk["raw"] is None:
            continue
        mean_bin = sum(1 for e in _BWS_EDGES if blk["raw"] >= e)
        dom_bin = _label_bin(blk["label"])
        if dom_bin is not None and dom_bin != mean_bin:
            out.append(f"{name}: the area-weighted mean {blk['raw']:.3f} falls in the class {_BWS_NAMES[mean_bin]} while the class "
                       f"with the largest area is {blk['label']} (the footprint spans basins of different stress; both numbers are kept)")
    return out


def check_note(pdf_path: str) -> dict:
    """Verify the scenario quotes against the technical note PDF (needs pdftotext)."""
    import re
    p = Path(pdf_path)
    sha = common.sha256_file(p)
    txt = subprocess.run(["pdftotext", "-layout", str(p), "-"], capture_output=True, text=True, check=True).stdout
    flat = re.sub(r"\s+", " ", txt)
    # pdftotext -layout interleaves the two columns of the page, so match on the words of each quote
    # in the unwrapped, single-column extraction as a fallback
    raw = subprocess.run(["pdftotext", str(p), "-"], capture_output=True, text=True, check=True).stdout
    flat_raw = re.sub(r"\s+", " ", raw)
    res = {"sha256": sha, "sha256Matches": sha == SCENARIO["pdfSha256"], "quotes": {}}
    for q in SCENARIO["quotes"]:
        res["quotes"][q] = (q in flat) or (q in flat_raw)
    return res


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("region", nargs="?")
    ap.add_argument("--out", default=None, help="write <out>/<region>/aqueduct.json instead of printing")
    ap.add_argument("--check-note", default=None, help="verify the scenario quotes against the technical note PDF")
    a = ap.parse_args(argv)
    if a.check_note:
        res = check_note(a.check_note)
        print(json.dumps(res, indent=2, ensure_ascii=False))
        return 0 if res["sha256Matches"] and all(res["quotes"].values()) else 1
    if not a.region:
        ap.error("region id required")
    doc = run(a.region)
    text = json.dumps(doc, indent=2, ensure_ascii=False)
    if a.out:
        d = Path(a.out) / a.region
        d.mkdir(parents=True, exist_ok=True)
        (d / "aqueduct.json").write_text(text + "\n", encoding="utf-8")
    else:
        print(text)
    return 0 if doc["status"] == "ok" else 1


if __name__ == "__main__":
    sys.exit(main())
