#!/usr/bin/env python3
"""Driver for the remote-data stages of the canonical evidence pipeline.

Stages (modules next to this file, each ALSO a standalone CLI with the same flags):
    climate  hansen  soil      (EV-PIPE-REMOTE-A)
    solar    ghsl    regen     (EV-PIPE-REMOTE-B)
A stage whose module file does not exist yet is skipped with a note (importlib probe), so the
driver works while the other WP is still landing. Stages run as child processes
(`<stage>.py --regions ... --out DIR [--refresh]`), one after the other, so a crash in one
stage can never take the others down and GDAL state never leaks between stages.

Run (project virtualenv):
    run_remote.py --regions all|id,id --stages climate,hansen,soil --out DIR [--refresh]
    run_remote.py --verify DIR --stages climate,hansen,soil [--regions all|id,id]

--verify DIR re-reads <DIR>/<region>/<stage>.json for every region and exits non-zero on any
structural problem or failed sanity anchor. A region with an explicit status 'failed' or
'fallback' plus an error text is a valid, recorded result (never masked, never fabricated);
it is counted in the report. Modules that define verify_outputs()/anchor_check() contribute
their stage-specific checks.

Writes <out>/remote-report-A.md (totals ok/fallback/failed per stage plus a per-region table)
for the stages of this WP that were requested.
"""
from __future__ import annotations

import argparse
import datetime as _dt
import importlib.util
import json
import math
import subprocess
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import common  # noqa: E402
from common import U, registry  # noqa: E402

ALL_STAGES = ("climate", "hansen", "soil", "solar", "ghsl", "regen")
A_STAGES = ("climate", "hansen", "soil")
STATUSES = ("ok", "fallback", "failed")
REPORT = "remote-report-A.md"


def now_iso() -> str:
    return _dt.datetime.now(_dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def log(msg: str) -> None:
    print(msg, file=sys.stderr, flush=True)


def read_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:  # noqa: BLE001
        return None


def dropped_regions() -> set[str]:
    d = read_json(U / "verify" / "dropped-regions.json")
    if d is None:
        return set()
    items = d.get("dropped", d) if isinstance(d, dict) else d
    return {it["id"] if isinstance(it, dict) else str(it) for it in (items or [])}


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


def resolve_stages(spec: str) -> list[str]:
    st = [s.strip() for s in spec.split(",") if s.strip()]
    bad = [s for s in st if s not in ALL_STAGES]
    if bad:
        raise SystemExit(f"unknown stage(s) {bad}; known: {list(ALL_STAGES)}")
    return st


def stage_path(stage: str) -> Path:
    return HERE / f"{stage}.py"


def load_stage(stage: str):
    """Import a stage module by file path, or None when it does not exist (yet) or cannot import."""
    p = stage_path(stage)
    if not p.is_file():
        return None
    try:
        spec = importlib.util.spec_from_file_location(f"evidence_stage_{stage}", p)
        mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(mod)  # type: ignore[union-attr]
        return mod
    except Exception as exc:  # noqa: BLE001
        log(f"[run_remote] {stage}.py exists but does not import: {exc}")
        return None


# --------------------------------------------------------------------------- run


def run_stage(stage: str, spec: str, out: Path, refresh: bool, workers: int | None) -> int:
    cmd = [sys.executable, str(stage_path(stage)), "--regions", spec, "--out", str(out)]
    if refresh:
        cmd.append("--refresh")
    if workers:
        cmd += ["--workers", str(workers)]
    log(f"[run_remote] === {stage} ===  {' '.join(cmd[1:])}")
    cp = subprocess.run(cmd)
    log(f"[run_remote] {stage} exit {cp.returncode}")
    return cp.returncode


# --------------------------------------------------------------------------- verify


def generic_problems(out: Path, stage: str, ids: list[str]) -> list[str]:
    problems = []
    for rid in ids:
        p = out / rid / f"{stage}.json"
        d = read_json(p)
        if d is None:
            problems.append(f"{stage}/{rid}: {p} missing or unreadable")
            continue
        st = d.get("status")
        if st not in STATUSES:
            problems.append(f"{stage}/{rid}: bad status {st!r}")
            continue
        if st != "ok" and not d.get("error"):
            problems.append(f"{stage}/{rid}: status {st} carries no error text")
        if st == "failed" and d.get("value") not in (None,):
            problems.append(f"{stage}/{rid}: failed status carries a value")
        v = d.get("value")
        if st == "ok" and isinstance(v, (int, float)) and not math.isfinite(v):
            problems.append(f"{stage}/{rid}: non-finite value")
    return problems


def verify(out: Path, stages: list[str], ids: list[str]) -> tuple[list[str], list[str]]:
    problems, notes = [], []
    for stage in stages:
        if not stage_path(stage).is_file():
            notes.append(f"{stage}: module not present yet, stage skipped")
            continue
        problems += generic_problems(out, stage, ids)
        mod = load_stage(stage)
        if mod is None:
            notes.append(f"{stage}: module did not import; generic checks only")
            continue
        if hasattr(mod, "verify_outputs"):
            problems += [f"{stage}: {m}" for m in mod.verify_outputs(out, ids)]
        if hasattr(mod, "anchor_check"):
            problems += [f"{stage} anchor: {m}" for m in mod.anchor_check(out, ids)]
    return problems, notes


# --------------------------------------------------------------------------- report


def _fmt(v, nd=2):
    return "-" if v is None else (f"{v:.{nd}f}" if isinstance(v, float) else str(v))


def write_report(out: Path, stages: list[str], ids: list[str], notes: list[str], problems: list[str]) -> Path:
    stages = [s for s in stages if s in A_STAGES and stage_path(s).is_file()]
    lines = [f"# Remote evidence stages A: climate, hansen, soil", "",
             f"Generated {now_iso()} by `scripts/evidence/run_remote.py`. Regions: {len(ids)} "
             f"(read from `data/footprints.json` minus `verify/dropped-regions.json`).", "",
             "Status words: **ok** = full method completed; **fallback** = value computed but a secondary part is "
             "missing (named in the error); **failed** = no value, error recorded, nothing fabricated.", "",
             "## Totals per stage", "", "| stage | ok | fallback | failed | missing file |", "|---|---|---|---|---|"]
    docs: dict[str, dict[str, dict]] = {s: {} for s in stages}
    for s in stages:
        for rid in ids:
            d = read_json(out / rid / f"{s}.json")
            if d is not None:
                docs[s][rid] = d
        cnt = {k: sum(1 for d in docs[s].values() if d.get("status") == k) for k in STATUSES}
        lines.append(f"| {s} | {cnt['ok']} | {cnt['fallback']} | {cnt['failed']} | {len(ids) - len(docs[s])} |")
    lines += ["", "## Per region", "",
              "| region | climate C (n models) | warming vs 1970-2000 | forest net %/decade | loss/yr 2013-23 vs 2001-12 | "
              "soil 0-30 cm g/kg | soil 0-5 cm g/kg |", "|---|---|---|---|---|---|---|"]
    for rid in ids:
        c, h, so = (docs.get(s, {}).get(rid) for s in ("climate", "hansen", "soil"))
        crow = "-" if not c else (f"{_fmt(c.get('value'))} ({c.get('n_models')})" if c.get("value") is not None else f"{c['status']}")
        dl = "-" if not c else _fmt(c.get("delta"))
        hrow = "-" if not h else (_fmt(h.get("value"), 3) if h.get("value") is not None else h["status"])
        ht = "-" if not h or not h.get("loss_per_year_2013_2023") else (
            f"{h['loss_per_year_2013_2023']:.3f} vs {h['loss_per_year_2001_2012']:.3f}")
        srow = "-" if not so else (_fmt(so.get("value")) if so.get("value") is not None else so["status"])
        s05 = "-" if not so or so.get("topsoil_0_5_mean_gkg") is None else _fmt(so["topsoil_0_5_mean_gkg"])
        lines.append(f"| {rid} | {crow} | {dl} | {hrow} | {ht} | {srow} | {s05} |")
    fails = [(s, rid, d.get("error")) for s in stages for rid, d in docs[s].items() if d.get("status") != "ok"]
    lines += ["", "## Non-ok results", ""]
    lines += [f"- {s}/{rid}: {err}" for s, rid, err in fails] or ["None."]
    cm = [(rid, d["models_failed"]) for rid, d in docs.get("climate", {}).items() if d.get("models_failed")]
    if cm:
        lines += ["", "## Climate models that did not open", ""]
        seen = {}
        for rid, mf in cm:
            for m in mf:
                seen.setdefault(m["model"], m)
        for m in seen.values():
            lines.append(f"- {m['model']}: {m['error'][:200]}{' (known: HTTP 404 on the host)' if m.get('expected') else ''}")
    lines += ["", "## Sanity anchors", ""]
    if "alentejo" in ids and "climate" in docs and "alentejo" in docs["climate"]:
        lines.append(f"- Alentejo climate {_fmt(docs['climate']['alentejo'].get('value'))} C versus the reverify 18.0 (tolerance 0.5 C).")
    if "finger-lakes" in ids:
        for s, label in (("climate", "climate C"), ("hansen", "forest net %/decade"), ("soil", "soil g/kg")):
            d = docs.get(s, {}).get("finger-lakes")
            if d:
                lines.append(f"- Finger Lakes {label}: {_fmt(d.get('value'), 3)} (region package value in `regions/finger-lakes/data.json`).")
    if problems:
        lines += ["", "## Verification problems", ""] + [f"- {p}" for p in problems]
    if notes:
        lines += ["", "## Notes", ""] + [f"- {n}" for n in notes]
    lines += ["", "## Provenance", "",
              "Per-region JSON (`<region>/<stage>.json`) records the footprint hash, the inputs with their asserted sizes, "
              "per-model window hashes for climate, and the retrieval time. Downloaded rasters and per-window results are cached "
              "under `upgrade-2026-10/evidence-cache/` (gitignored).", ""]
    path = out / REPORT
    path.write_text("\n".join(lines), encoding="utf-8")
    return path


# --------------------------------------------------------------------------- cli


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--regions", default="all", help="comma-separated region ids, or 'all' (default)")
    ap.add_argument("--stages", default=",".join(ALL_STAGES), help="comma-separated stage names")
    ap.add_argument("--out", help="evidence-out directory")
    ap.add_argument("--verify", nargs="?", const="", metavar="DIR",
                    help="verify <DIR>/<region>/<stage>.json instead of running (DIR defaults to --out)")
    ap.add_argument("--refresh", action="store_true", help="ignore stage caches")
    ap.add_argument("--workers", type=int, default=None, help="passed through to the stage CLIs")
    a = ap.parse_args(argv)
    stages = resolve_stages(a.stages)
    ids = resolve_regions(a.regions)

    if a.verify is not None:
        out = Path(a.verify or a.out or "")
        if not str(out) or not out.is_dir():
            raise SystemExit(f"--verify needs an existing evidence-out directory (got {str(out)!r})")
        problems, notes = verify(out, stages, ids)
        write_report(out, stages, ids, notes, problems)
        for n in notes:
            log(f"[run_remote] note: {n}")
        for p in problems:
            log(f"[run_remote] PROBLEM: {p}")
        tot = {s: {k: sum(1 for rid in ids if (read_json(out / rid / f"{s}.json") or {}).get("status") == k)
                   for k in STATUSES} for s in stages if stage_path(s).is_file()}
        print(json.dumps({"verify": str(out), "regions": len(ids), "totals": tot, "problems": len(problems)}))
        return 1 if problems else 0

    if not a.out:
        raise SystemExit("--out is required when running stages")
    out = Path(a.out)
    out.mkdir(parents=True, exist_ok=True)
    notes, rc = [], 0
    for stage in stages:
        if not stage_path(stage).is_file():
            note = f"{stage}: module {stage}.py not present (owned by the other remote WP); skipped"
            log(f"[run_remote] {note}")
            notes.append(note)
            continue
        # pass the user's region spec through so 'all' resolves identically inside each stage
        code = run_stage(stage, a.regions, out, a.refresh, a.workers)
        if code != 0:
            rc = 1
            notes.append(f"{stage}: CLI exited {code} (anchor or integrity problem; see its output)")
    problems, vnotes = verify(out, stages, ids)
    path = write_report(out, stages, ids, notes + vnotes, problems)
    log(f"[run_remote] report: {path}")
    for p in problems:
        log(f"[run_remote] PROBLEM: {p}")
    return 1 if (rc or problems) else 0


if __name__ == "__main__":
    sys.exit(main())
