"""Canonical evidence pipeline, local-data stages (EV-PIPE-LOCAL): Koppen, Aqueduct, UCDP conflict.

    run_local.py --regions all --out upgrade-2026-10/evidence-out
    run_local.py --regions cevennes,oaxaca --stages conflict --out ... --force
    run_local.py --verify upgrade-2026-10/evidence-out

Run with the project virtualenv (prototype/.venv/bin/python).

For every region the id list comes from dump_regions.mjs (data, never typed). A region is processed when
it has a footprint in data/footprints.json. Per region and stage the output is
    <out>/<region>/koppen.json | aqueduct.json | conflict.json
and one report, <out>/local-report.md, lists every flag, the failed stages and the reproduction check.

A stage that fails for a region writes `status: "failed"` with the error and no values (policy P-CELL is
applied downstream, EV-INT-REGIONS). Idempotent and resumable: an output whose status is ok, whose
method version, footprint hash and input fingerprint are unchanged is kept as is (use --force to redo);
failed outputs are always retried. The report is rebuilt from the JSON files on every run.

--verify checks the acceptance rules without recomputing anything:
  * every footprinted region has all three files, of the right stage and id, not stale
  * Koppen shares of every period sum to 1 +- 0.02
  * Aqueduct basin counts present; baseline/future covered-area fraction below 0.95 must be flagged
  * conflict reproduces the expected 2019-2024 values (deployed-layer basis) for the baseline regions:
    0 everywhere except Oaxaca 120 and Cevennes 2
  * local-report.md exists and lists every flag and every failed stage
Exit status 0 only when all of that holds; failed stages are allowed (they are reported, not hidden).
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))

import aqueduct  # noqa: E402
import common  # noqa: E402
import conflict  # noqa: E402
import koppen  # noqa: E402

STAGES = {"koppen": koppen, "aqueduct": aqueduct, "conflict": conflict}
REPORT = "local-report.md"
# expected 2019-2024 conflict counts today for the regions of the baseline commit (recon + reverify)
EXPECTED_CONFLICT_2019_2024 = {"oaxaca": 120, "cevennes": 2}
KOPPEN_SUM_TOL = 0.02
COVERAGE_MIN = aqueduct.COVERAGE_MIN


# --------------------------------------------------------------------------- io


def out_file(out: Path, rid: str, stage: str) -> Path:
    return out / rid / f"{stage}.json"


def read_doc(path: Path):
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return None


def write_doc(path: Path, doc: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_name(path.name + ".tmp")
    tmp.write_text(json.dumps(doc, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    os.replace(tmp, path)


def is_current(doc, rid: str, stage: str) -> bool:
    """True when an existing output is ok and its method, footprint and inputs are unchanged."""
    if not doc or doc.get("status") != "ok" or doc.get("id") != rid or doc.get("stage") != stage:
        return False
    mod = STAGES[stage]
    try:
        if doc.get("method", {}).get("version") != mod.METHOD_VERSION:
            return False
        if doc.get("footprint", {}).get("sha256") != mod.footprint_record(rid)["sha256"]:
            return False
        return doc.get("inputFingerprint") == mod.input_fingerprint()
    except Exception:  # noqa: BLE001 - anything unreadable means: recompute
        return False


BASELINE_COMMIT = "6bce1a3"


def baseline_ids() -> tuple[list[str], str]:
    """Ids of the regions the site shipped at the baseline commit (the ones the expected conflict values
    describe). Falls back to the ids in data/regions.js when git or node cannot supply them."""
    if "baseline" not in _memo:
        try:
            src = subprocess.run(["git", "show", f"{BASELINE_COMMIT}:prototype/data/regions.js"], capture_output=True,
                                 check=True, cwd=str(common.R), timeout=60).stdout
            js = ("import('data:text/javascript;base64," + base64.b64encode(src).decode() +
                  "').then(m=>console.log(JSON.stringify(m.regions.map(r=>r.id))))")
            cp = subprocess.run(["node", "-e", js], capture_output=True, text=True, timeout=60, check=True)
            ids = json.loads(cp.stdout)
            if not ids:
                raise ValueError("no ids")
            _memo["baseline"] = (ids, f"regions in data/regions.js at {BASELINE_COMMIT}")
        except Exception:  # noqa: BLE001
            ids = [r["id"] for r in common.regions_list(with_new=False)]
            _memo["baseline"] = (ids, "regions in the working-tree data/regions.js (git baseline unavailable)")
    return _memo["baseline"]


_memo: dict = {}


# --------------------------------------------------------------------------- run


def pick_regions(arg: str) -> tuple[list[str], list[str]]:
    """(region ids to process, ids listed by dump_regions.mjs that have no footprint)."""
    listed = [r["id"] for r in common.regions_list(with_new=True)]
    have = set(common.footprint_ids())
    if arg == "all":
        want = listed
    else:
        want = [x.strip() for x in arg.split(",") if x.strip()]
        unknown = [x for x in want if x not in listed and x not in have]
        if unknown:
            raise SystemExit(f"unknown region id(s): {', '.join(unknown)}")
    todo = [r for r in want if r in have]
    missing = [r for r in want if r not in have]
    return todo, missing


def run(args) -> int:
    out = Path(args.out)
    stages = [s.strip() for s in args.stages.split(",") if s.strip()]
    for s in stages:
        if s not in STAGES:
            raise SystemExit(f"unknown stage {s}; choose from {', '.join(STAGES)}")
    todo, missing = pick_regions(args.regions)
    print(f"[run_local] {len(todo)} region(s), stages {', '.join(stages)}, out {out}", flush=True)
    if missing:
        print(f"[run_local] no footprint for: {', '.join(missing)}", flush=True)
    out.mkdir(parents=True, exist_ok=True)
    counts = {"computed": 0, "kept": 0, "failed": 0}
    failed = []
    for rid in todo:
        for stage in stages:
            path = out_file(out, rid, stage)
            if not args.force and is_current(read_doc(path), rid, stage):
                counts["kept"] += 1
                print(f"[run_local] {rid:26s} {stage:9s} kept (current)", flush=True)
                continue
            t0 = time.time()
            doc = STAGES[stage].run(rid)
            write_doc(path, doc)
            counts["computed"] += 1
            if doc["status"] != "ok":
                counts["failed"] += 1
                failed.append((rid, stage, doc.get("error")))
            print(f"[run_local] {rid:26s} {stage:9s} {doc['status']:6s} {time.time() - t0:5.1f}s"
                  + (f"  {doc.get('error')}" if doc["status"] != "ok" else ""), flush=True)
    write_report(out, missing_footprint=missing)
    print(f"[run_local] done: {counts['computed']} computed, {counts['kept']} kept, {counts['failed']} failed", flush=True)
    for rid, stage, err in failed:
        print(f"[run_local] FAILED {rid} {stage}: {err}", flush=True)
    print(f"[run_local] report: {out / REPORT}", flush=True)
    return 0


# --------------------------------------------------------------------------- report


def load_all(out: Path):
    docs = {}
    for rid in common.footprint_ids():
        for stage in STAGES:
            docs[(rid, stage)] = read_doc(out_file(out, rid, stage))
    return docs


def conflict_layer(doc, period="2019_2024"):
    p = (doc or {}).get("periods", {}).get(period)
    return None if p is None else p.get("layerEquivalentEvents")


def collect_flags(docs) -> list[tuple[str, str, str]]:
    """[(region, stage, flag text)] for every flag in every output."""
    out = []
    for (rid, stage), doc in docs.items():
        if not doc:
            continue
        for f in doc.get("flags") or []:
            out.append((rid, stage, f))
    return out


def collect_notes(docs) -> list[tuple[str, str, str]]:
    out = []
    for (rid, stage), doc in docs.items():
        for f in (doc or {}).get("notes") or []:
            out.append((rid, stage, f))
    return out


def repro_rows(docs, existing_ids):
    rows = []
    for rid in existing_ids:
        d = docs.get((rid, "conflict"))
        got = conflict_layer(d)
        exp = EXPECTED_CONFLICT_2019_2024.get(rid, 0)
        full = (d or {}).get("periods", {}).get("2019_2024", {}).get("events")
        rows.append((rid, exp, got, full, got == exp))
    return rows


def fmt(x, nd=3):
    return "n/a" if x is None else (f"{x:.{nd}f}" if isinstance(x, float) else str(x))


def write_report(out: Path, missing_footprint=()) -> None:
    ids = common.footprint_ids()
    existing, existing_basis = baseline_ids()
    docs = load_all(out)
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    L = []
    L.append("# Local evidence stages (EV-PIPE-LOCAL)")
    L.append("")
    L.append(f"Generated {now} by `prototype/scripts/evidence/run_local.py` from the JSON files in this folder. "
             f"{len(ids)} footprinted regions, three stages each (Koppen-Geiger, Aqueduct 4.0, UCDP GED).")
    L.append("")
    status = {k: (d or {}).get("status", "missing") for k, d in docs.items()}
    n_ok = sum(1 for v in status.values() if v == "ok")
    n_failed = [(k, v) for k, v in status.items() if v != "ok"]
    L.append(f"**Stage outputs:** {n_ok} ok of {len(status)}; {len(n_failed)} failed or missing.")
    if missing_footprint:
        L.append("")
        L.append("Regions listed by dump_regions.mjs without a footprint (not processed): " + ", ".join(missing_footprint))
    L.append("")

    L.append("## Failed or missing stages")
    L.append("")
    if not n_failed:
        L.append("None.")
    else:
        for (rid, stage), st in n_failed:
            err = (docs[(rid, stage)] or {}).get("error")
            L.append(f"- `{rid}` / {stage}: {st}" + (f" ({err})" if err else "") +
                     ". Policy P-CELL applies downstream (never a guessed value).")
    L.append("")

    flags = collect_flags(docs)
    L.append("## Flags")
    L.append("")
    if not flags:
        L.append("None.")
    else:
        for rid, stage, f in flags:
            L.append(f"- `{rid}` / {stage}: {f}")
    L.append("")

    notes = collect_notes(docs)
    L.append("## Notes (informational, not defects)")
    L.append("")
    if not notes:
        L.append("None.")
    else:
        for rid, stage, f in notes:
            L.append(f"- `{rid}` / {stage}: {f}")
    L.append("")

    # Koppen
    L.append("## Koppen-Geiger (Beck et al. 2023, 1 km, CC BY 4.0)")
    L.append("")
    L.append("Dominant class (share of the footprint's land area) per period, marker class (3x3 mode) in the 1991-2020 map, "
             "and the sum of the shares.")
    L.append("")
    L.append("| region | 1961-1990 | 1991-2020 | 2041-2070 SSP2-4.5 | 2071-2099 SSP2-4.5 | marker 1991-2020 | sum (1991-2020) |")
    L.append("|---|---|---|---|---|---|---|")
    for rid in ids:
        d = docs.get((rid, "koppen"))
        if not d or d.get("status") != "ok":
            L.append(f"| {rid} | failed or missing | | | | | |")
            continue
        P = d["periods"]
        cells = [f"{P[k]['dominant']['code']} {P[k]['dominant']['share']:.2f}" for k in koppen.PERIODS]
        L.append(f"| {rid} | " + " | ".join(cells) + f" | {P['1991_2020']['marker']['code']} | {P['1991_2020']['sharesSum']:.3f} |")
    L.append("")

    # Aqueduct
    L.append("## Aqueduct 4.0 (WRI, HydroBASINS level 6, area-weighted over the footprint)")
    L.append("")
    scen = aqueduct.SCENARIO
    L.append(f"Scenario note, copied from the technical note ({scen['document']}; {scen['url']}; "
             f"sha256 {scen['pdfSha256']}):")
    L.append("")
    L.append("> " + aqueduct.SCENARIO_NOTE)
    L.append("")
    L.append(f"The `bau50_ws_x_r` field is therefore the 2050 business-as-usual ({scen['code']}) water-stress ratio. "
             "Climate (SSP2-4.5, Koppen) and water (Aqueduct BAU, SSP3-7.0) use different scenario families and cannot be harmonised.")
    L.append("")
    L.append("| region | basin units (pfaf ids) | covered fraction | baseline bws | baseline class | 2050 BAU ratio | BAU class | no-data / arid share (BAU) |")
    L.append("|---|---|---|---|---|---|---|---|")
    for rid in ids:
        d = docs.get((rid, "aqueduct"))
        if not d or d.get("status") != "ok":
            L.append(f"| {rid} | failed or missing | | | | | | |")
            continue
        c = d["coverage"]
        b, f = d["baseline"]["bws"], d["bau2050"]
        L.append(f"| {rid} | {c['baseline']['nBasins']} ({c['baseline']['nPfafBasins']}) | {c['baseline']['fraction']:.3f} | "
                 f"{fmt(b['raw'])} | {b['label']} | {fmt(f['raw'])} | {f['label']} | {f['sentinelShareOfIntersected']:.3f} |")
    L.append("")

    # Conflict
    L.append("## UCDP GED v25.1, events within 200 km of the marker")
    L.append("")
    L.append("`events` is the canonical count (current `process_vectors.py` filter, every event). `layer` is what the "
             "deployed map layers show (Europe layer holds only `best >= 3`).")
    L.append("")
    L.append("| region | 2013-2018 events | 2019-2024 events | 2019-2024 layer | 2019-2024 within 100 km | nearest event km (2019-2024) |")
    L.append("|---|---|---|---|---|---|")
    for rid in ids:
        d = docs.get((rid, "conflict"))
        if not d or d.get("status") != "ok":
            L.append(f"| {rid} | failed or missing | | | | |")
            continue
        a, b = d["periods"]["2013_2018"], d["periods"]["2019_2024"]
        L.append(f"| {rid} | {a['events']} | {b['events']} | {b['layerEquivalentEvents']} | {b['within100km']} | {fmt(b['nearestEventKm'], 1)} |")
    L.append("")
    L.append(f"### Reproduction check ({existing_basis}, 2019-2024, deployed-layer basis)")
    L.append("")
    L.append("Expected: 0 for every region except Oaxaca 120 and Cevennes 2.")
    L.append("")
    L.append("| region | expected | reproduced | all events (current filter) | match |")
    L.append("|---|---|---|---|---|")
    bad = 0
    for rid, exp, got, full, ok in repro_rows(docs, existing):
        bad += 0 if ok else 1
        L.append(f"| {rid} | {exp} | {fmt(got)} | {fmt(full)} | {'yes' if ok else 'NO'} |")
    L.append("")
    L.append(f"{len(existing) - bad} of {len(existing)} reproduce.")
    L.append("")
    L.append("**Finding.** The deployed Europe layer `data/processed/conflict.geojson` (14,546 features, built 2025-05-19) holds only "
             "events with `best >= 3`; `process_vectors.py` as it stands applies no threshold and would write 51,218 Europe events "
             "(2015-2024); the deployed North America layer holds all 16,333. So the recon's 'Cevennes 2' is the best >= 3 count: "
             "by the current filter Cevennes has 44 events in 2019-2024, all at one point in Marseille (159 km from the marker; "
             "non-state violence, 2023-2024, 1 to 3 deaths each). The card text 'None' for Cevennes is true of the area around the "
             "marker (nothing nearer than 158 km) and not of the 200 km radius. EV-INT-REGIONS decides the wording; the numbers for both "
             "readings are in `conflict.json` (`events`, `eventsBestGe1`, `eventsBestGe3`, `layerEquivalentEvents`).")
    L.append("")

    L.append("## Method decisions")
    L.append("")
    L.append("- Koppen shares are shares of land area (cells weighted by cos latitude; sea cells excluded and reported as `noDataShare`); "
             "cells chosen with `all_touched=False`; the marker class is the 3x3 mode with the centre cell winning ties.")
    L.append("- Aqueduct areas are computed in EPSG:6933 (`common.EA_CRS`, the equal-area CRS of the footprint registry) instead of the "
             "EPSG:3035 the finger-lakes prototype used; both are equal-area, the finger-lakes footprint reproduces its earlier 0.0149 BAU value. "
             "Sentinels (-9999 no data, 9999 arid and low water use) are excluded from means and their area share is reported; "
             "the covered-area fraction is intersected basin area over footprint area (sea and non-basin land lowers it).")
    L.append("- Conflict is a marker-radius measure; the footprint is recorded but not used.")
    L.append("")
    path = out / REPORT
    path.write_text("\n".join(L) + "\n", encoding="utf-8")


# --------------------------------------------------------------------------- verify


def verify(out_dir: str) -> int:
    out = Path(out_dir)
    errors, notes = [], []
    ids = common.footprint_ids()
    existing, _basis = baseline_ids()
    listed = [r["id"] for r in common.regions_list(with_new=True)]
    no_fp = [r for r in listed if r not in ids]
    if no_fp:
        errors.append(f"regions without a footprint: {', '.join(no_fp)}")
    docs = load_all(out)

    for rid in ids:
        for stage in STAGES:
            d = docs[(rid, stage)]
            tag = f"{rid}/{stage}"
            if d is None:
                errors.append(f"{tag}: file missing or not JSON ({out_file(out, rid, stage)})")
                continue
            if d.get("stage") != stage or d.get("id") != rid:
                errors.append(f"{tag}: stage/id fields say {d.get('stage')}/{d.get('id')}")
            if d.get("status") not in ("ok", "failed"):
                errors.append(f"{tag}: status {d.get('status')!r}")
                continue
            if d["status"] == "failed":
                notes.append(f"{tag}: failed ({d.get('error')})")
                if not d.get("error"):
                    errors.append(f"{tag}: failed without an error text")
                if any(k in d for k in ("periods", "baseline", "bau2050")):
                    errors.append(f"{tag}: failed output carries values")
                continue
            for key in ("inputs", "method", "footprint", "retrieved"):
                if not d.get(key):
                    errors.append(f"{tag}: missing {key}")
            try:
                if d["footprint"]["sha256"] != STAGES[stage].footprint_record(rid)["sha256"]:
                    errors.append(f"{tag}: stale, the footprint changed since this output was written (re-run)")
            except Exception as exc:  # noqa: BLE001
                errors.append(f"{tag}: footprint check failed ({exc})")

            if stage == "koppen":
                if set(d["periods"]) != set(koppen.PERIODS):
                    errors.append(f"{tag}: periods {sorted(d['periods'])}")
                for p, r in d["periods"].items():
                    s = sum(r["shares"].values())
                    if abs(s - 1.0) > KOPPEN_SUM_TOL:
                        errors.append(f"{tag}/{p}: shares sum {s:.4f}")
            elif stage == "aqueduct":
                c = d["coverage"]
                for k in ("baseline", "future"):
                    if not c[k]["nBasins"]:
                        errors.append(f"{tag}: no {k} basins")
                    if c[k]["fraction"] < COVERAGE_MIN and not any(f"{k} basin coverage" in x for x in d["flags"]):
                        errors.append(f"{tag}: {k} coverage {c[k]['fraction']} below {COVERAGE_MIN} and not flagged")
                if "business as usual" not in d.get("scenarioNote", "") or "SSP3-7.0" not in d["scenarioNote"]:
                    errors.append(f"{tag}: scenarioNote does not carry the technical note's wording")
                b = d["bau2050"]["raw"]
                if b is not None and not (0 <= b < aqueduct.SENTINEL_ABS):
                    errors.append(f"{tag}: bau2050 raw {b} outside the valid range")
            elif stage == "conflict":
                if set(d["periods"]) != set(conflict.PERIODS):
                    errors.append(f"{tag}: periods {sorted(d['periods'])}")

    for rid, exp, got, full, ok in repro_rows(docs, [r for r in existing if r in ids]):
        if not ok:
            errors.append(f"conflict reproduction: {rid} 2019-2024 layer-equivalent {got}, expected {exp}")
    # every region must be in the existing list for the check to mean anything
    for rid in EXPECTED_CONFLICT_2019_2024:
        if rid not in existing:
            errors.append(f"expected-value region {rid} is not in the baseline region set")

    report = out / REPORT
    if not report.is_file():
        errors.append(f"{report} missing")
    else:
        text = report.read_text(encoding="utf-8")
        for rid, stage, f in collect_flags(docs):
            if f not in text:
                errors.append(f"report does not list the flag of {rid}/{stage}: {f[:90]}")
        for (rid, stage), d in docs.items():
            if d and d.get("status") == "failed" and f"`{rid}` / {stage}: failed" not in text:
                errors.append(f"report does not list the failed stage {rid}/{stage}")
        for rid, stage, f in collect_notes(docs):
            if f not in text:
                errors.append(f"report does not list the note of {rid}/{stage}: {f[:90]}")
        if "Reproduction check" not in text:
            errors.append("report has no reproduction check section")

    n_ok = sum(1 for d in docs.values() if d and d.get("status") == "ok")
    print(f"[verify] {len(ids)} footprinted regions x {len(STAGES)} stages = {len(docs)} outputs, {n_ok} ok", flush=True)
    for n in notes:
        print(f"[verify] note: {n}", flush=True)
    for e in errors:
        print(f"[verify] FAIL: {e}", flush=True)
    if errors:
        print(f"[verify] {len(errors)} problem(s)", flush=True)
        return 1
    print("[verify] OK", flush=True)
    return 0


# --------------------------------------------------------------------------- cli


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--regions", default="all", help="'all' or comma-separated region ids")
    ap.add_argument("--stages", default="koppen,aqueduct,conflict")
    ap.add_argument("--out", default=str(common.U / "evidence-out"))
    ap.add_argument("--force", action="store_true", help="recompute even when an output is current")
    ap.add_argument("--verify", metavar="DIR", default=None, help="check the outputs in DIR against the acceptance rules")
    a = ap.parse_args(argv)
    if a.verify:
        return verify(a.verify)
    return run(a)


if __name__ == "__main__":
    sys.exit(main())
