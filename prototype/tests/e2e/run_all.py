#!/usr/bin/env /usr/bin/python3
"""Run the e2e suites against a site directory.

    /usr/bin/python3 tests/e2e/run_all.py --port 8200 --site DIR --suite pages,interactions [--strict] [--json OUT] [--label L]

  --port N           REQUIRED (or env LSF_PORT); there is no default: every WP has its own port. Only this port is ever bound.
  --site DIR         site root to serve (default: the working tree's prototype/)
  --suite a,b|all    suites by NAME (suites/<name>.py). `all` = every discovered suite EXCEPT `snapshot` (the zero-behaviour-change
                     gate, meaningful only in waves 1-3) and `perf` (run explicitly)
  --strict           ignore known_issues.json (every failure counts)
  --viewport 1280,390  widths for pages/interactions (default 1280,390)
  --offline          stub every third-party request (structure-only runs)
  --browser B        chromium (default) | webkit | firefox ; a missing build prints `SKIPPED: <browser> not installed`
  --json OUT         write {wp, status, started, finished, suites, failures, known_issues_active, ...}
  --label L          the WP / run label (written as `wp`)
  --baseline DIR     baseline capture directory (default upgrade-2026-10/verify/baseline)

Known issues (tests/e2e/known_issues.json, WRITE-ONCE) are tolerated only while verify/e2e/<fixed_by>.json does not exist or its
`status` is not `pass`. Any request to formsubmit.co is aborted, recorded, and fails the run.
Exit status: 0 = no unexpected failure, 1 = failures, 2 = usage / harness error.
"""
import argparse
import fnmatch
import importlib.util
import json
import os
import sys
import time
import traceback
from pathlib import Path

E2E = Path(__file__).resolve().parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))

from lib.site import Harness, RESULT_DIR, PROTO   # noqa: E402
from lib.util import read_json, write_json          # noqa: E402

EXCLUDED_FROM_ALL = {"snapshot", "perf"}


def discover():
    out = {}
    for p in sorted((E2E / "suites").glob("*.py")):
        if p.name.startswith("_"):
            continue
        spec = importlib.util.spec_from_file_location("lsf_suite_%s" % p.stem, str(p))
        mod = importlib.util.module_from_spec(spec)
        try:
            spec.loader.exec_module(mod)
        except Exception as e:
            print("WARNING: suite %s failed to import: %s" % (p.name, e), file=sys.stderr)
            continue
        if hasattr(mod, "run"):
            out[getattr(mod, "NAME", p.stem)] = mod
            out.setdefault(p.stem, mod)
    return out


def load_known():
    return read_json(E2E / "known_issues.json", []) or []


def fixed(fixed_by):
    d = read_json(RESULT_DIR / ("%s.json" % fixed_by))
    return bool(d) and d.get("status") == "pass"


def matches(issue, res):
    if issue["suite"] != res["suite"]:
        return False
    if not fnmatch.fnmatchcase(res["test"], issue["test"]):
        return False
    contains = issue.get("contains")
    if contains and contains.lower() not in (res.get("detail", "") + " " + res["test"]).lower():
        return False
    return True


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, default=None)
    ap.add_argument("--site", default=str(PROTO))
    ap.add_argument("--suite", default="all")
    ap.add_argument("--strict", action="store_true")
    ap.add_argument("--viewport", default="1280,390")
    ap.add_argument("--offline", action="store_true")
    ap.add_argument("--browser", default="chromium", choices=["chromium", "webkit", "firefox"])
    ap.add_argument("--json", default=None)
    ap.add_argument("--label", default="")
    ap.add_argument("--baseline", default=None)
    ap.add_argument("--basemap-hosts", default="")
    ap.add_argument("--list", action="store_true", help="list discovered suites and exit")
    a = ap.parse_args(argv)

    suites = discover()
    if a.list:
        for n in sorted({getattr(m, "NAME", k) for k, m in suites.items()}):
            print(n)
        return 0
    port = a.port if a.port is not None else (int(os.environ["LSF_PORT"]) if os.environ.get("LSF_PORT") else None)
    if port is None:
        print("error: --port N (or env LSF_PORT) is required; there is no default port", file=sys.stderr)
        return 2
    if a.suite == "all":
        names = sorted({getattr(m, "NAME", k) for k, m in suites.items()} - EXCLUDED_FROM_ALL)
    else:
        names = [s.strip() for s in a.suite.split(",") if s.strip()]
    missing = [n for n in names if n not in suites]
    if missing:
        print("error: unknown suite(s): %s (have: %s)" % (", ".join(missing), ", ".join(sorted(suites))), file=sys.stderr)
        return 2
    widths = [int(w) for w in a.viewport.split(",") if w]
    started = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    t0 = time.time()
    h = Harness(a.site, port, browser_name=a.browser, offline=a.offline, widths=widths, strict=a.strict,
                baseline_dir=a.baseline, label=a.label,
                basemap_hosts=[x for x in a.basemap_hosts.split(",") if x] or None)
    results, suite_rows = [], []
    try:
        h.start()
        if not h.browser_installed():
            print("SKIPPED: %s not installed" % a.browser)
            if a.json:
                write_json(a.json, {"wp": a.label, "status": "skipped", "browser": a.browser, "started": started,
                                    "finished": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "suites": [],
                                    "failures": [], "known_issues_active": []})
            return 0
        for n in names:
            mod = suites[n]
            ts = time.time()
            try:
                rows = mod.run(h) or []
            except Exception:
                rows = [{"suite": n, "test": "suite-crashed", "status": "fail", "detail": traceback.format_exc()[-1500:]}]
            for row in rows:
                row.setdefault("suite", n)
            results.extend(rows)
            suite_rows.append((n, rows, time.time() - ts))
            c = {k: sum(1 for x in rows if x["status"] == k) for k in ("pass", "fail", "skip", "info")}
            print("[%s] pass=%d fail=%d skip=%d (%.1fs)" % (n, c["pass"], c["fail"], c["skip"], time.time() - ts), flush=True)
    finally:
        h.stop()

    # the formsubmit guard: any attempt fails the run
    attempts = h.formsubmit_attempts()
    if attempts:
        results.append({"suite": "harness", "test": "no-formsubmit-requests", "status": "fail",
                        "detail": "request(s) to formsubmit.co were attempted and aborted: %s" % attempts[:5]})
    known = [] if a.strict else load_known()
    active = [k for k in known if not fixed(k.get("fixed_by", ""))]
    tolerated, failures = [], []
    for res in results:
        if res["status"] != "fail":
            continue
        issue = next((k for k in active if matches(k, res)), None)
        if issue:
            res["status"] = "known"
            res["known_issue"] = issue["id"]
            tolerated.append(res)
        else:
            failures.append(res)
    used = {}
    for t in tolerated:
        used[t["known_issue"]] = used.get(t["known_issue"], 0) + 1
    known_rows = [{"id": k["id"], "suite": k["suite"], "test": k["test"], "fixed_by": k.get("fixed_by"), "why": k.get("why"),
                   "matched": used.get(k["id"], 0)} for k in active]
    finished = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    status = "pass" if not failures else "fail"
    report = {"wp": a.label, "status": status, "started": started, "finished": finished, "seconds": round(time.time() - t0, 1),
              "site": str(h.site), "port": port, "browser": a.browser, "strict": a.strict, "widths": widths,
              "suites": [{"name": n, "pass": sum(1 for x in rows if x["status"] == "pass"),
                          "fail": sum(1 for x in rows if x["status"] == "fail"),
                          "known": sum(1 for x in rows if x["status"] == "known"),
                          "skip": sum(1 for x in rows if x["status"] == "skip"), "seconds": round(sec, 1)}
                         for n, rows, sec in suite_rows],
              "failures": failures, "known_issues_active": known_rows,
              "tolerated": [{"test": t["test"], "suite": t["suite"], "known_issue": t["known_issue"], "detail": t["detail"][:300]} for t in tolerated],
              "info": [x for x in results if x["status"] == "info"], "skipped": [x for x in results if x["status"] == "skip"]}
    for k, v in h.extra.items():
        report.setdefault("extra", {})[k] = v
    if a.json:
        write_json(a.json, report)
    print("\n== %s: %s | %d failure(s), %d tolerated as known issues ==" % (a.label or "run", status.upper(), len(failures), len(tolerated)))
    for f in failures:
        print("FAIL %s :: %s :: %s" % (f["suite"], f["test"], f["detail"][:300]))
    for kid, n in sorted(used.items()):
        print("known %s x%d" % (kid, n))
    return 0 if not failures else 1


if __name__ == "__main__":
    sys.exit(main())
