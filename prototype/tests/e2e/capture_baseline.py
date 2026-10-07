#!/usr/bin/env /usr/bin/python3
"""Capture the BASELINE: the pristine 6bce1a3 `prototype/` (git archive, immune to concurrent edits) rendered, snapshotted and swept.

    /usr/bin/python3 capture_baseline.py --port 8200 --out upgrade-2026-10/verify/baseline [--site DIR] [--skip-layers] [--refresh-archive]

Writes under --out: manifest.json (commit, archive hash, tool versions, 14 snapshots, normalisation notes), snapshots/*, layers.json
(the live layer sweep + deep-zoom sweep verdicts), discipline.json, analytics.json (event names + payload keys fired by the
interactions suite), forms.json, share-links.json (10 baseline share links with the match counts the baseline lib/result.js and
the baseline client give). PNGs go to upgrade-2026-10/screenshots/baseline-e2e/<out basename>/ (gitignored).
The baseline is never captured from the working tree: if --site is omitted the archive of 6bce1a3 is extracted (once) to
upgrade-2026-10/verify/baseline-site/ and served from there.
"""
import argparse
import hashlib
import importlib.metadata
import json
import subprocess
import sys
import time
from pathlib import Path

E2E = Path(__file__).resolve().parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))

from lib import sel as _sel                       # noqa: E402
from lib.capture import capture_all               # noqa: E402
from lib.layers import run_sweeps                 # noqa: E402
from lib.site import (Harness, R, U, BASELINE_COMMIT, BASELINE_SITE, default_storage, goto_settled)   # noqa: E402
from lib.util import load_path, write_json        # noqa: E402

S = _sel.home()
SEL = S.SEL

EXTRA_LINKS = [
    ("threshold-pin", "thresholds plus a pin", "?t.water_stress=0.3&t.solar_pv=1400&pin=galicia"),
    ("legacy-pin", "legacy pin without a continent", "?pin=vermont"),
    ("qualitative", "qualitative filter only", "?q.foreign_ownership=yes"),
    ("modal", "modal link", "?modal=1"),
    ("solar-1500", "solar floor 1500", "?t.solar_pv=1500"),
]


def git(*args):
    return subprocess.run(["git", "-C", str(R)] + list(args), stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout


def ensure_archive(refresh):
    if refresh or not (BASELINE_SITE / "index.html").is_file():
        import shutil
        dest = U / "verify" / "baseline-site"
        if dest.exists():
            shutil.rmtree(str(dest))
        dest.mkdir(parents=True)
        tar = git("archive", BASELINE_COMMIT, "prototype")
        subprocess.run(["tar", "-x", "-C", str(dest)], input=tar, check=True)
    return hashlib.sha256(git("archive", BASELINE_COMMIT, "prototype")).hexdigest()


def preset_links(h, browser):
    """Click each preset chip on the baseline client and read the URL it writes: the client is the truth for preset queries."""
    s = h.session(browser, width=1280, storage=default_storage(h.site), stub=True)
    page = s.page()
    out = []
    try:
        goto_settled(page, h.base + "/", extra_ms=300)
        chips = page.locator(SEL["preset_chip"])
        for i in range(chips.count()):
            label = chips.nth(i).inner_text().strip()
            chips.nth(i).scroll_into_view_if_needed()
            chips.nth(i).click()
            page.wait_for_timeout(700)
            out.append((label, page.evaluate("location.search")))
            page.locator(SEL["reset_btn"]).click()
            page.wait_for_timeout(300)
    finally:
        s.close()
    return out


def client_truth(h, browser, query):
    s = h.session(browser, width=1280, storage=default_storage(h.site, modal=("modal=1" in query)), stub=True)
    page = s.page()
    try:
        goto_settled(page, h.base + "/" + query, extra_ms=500)
        info = page.evaluate("""() => { const cs = Array.from(document.querySelectorAll('.region-card')).filter(c => c.getClientRects().length);
          const pass = cs.filter(c => !c.classList.contains('fail'));
          return {count: document.getElementById('match-count').textContent.trim(), total: document.getElementById('match-total').textContent.trim(),
                  ids: pass.map(c => c.id.replace(/^region-/, '')), names: pass.map(c => (c.querySelector('.name') || {}).textContent) }; }""")
        info["count"], info["total"] = int(info["count"]), int(info["total"])
        return info
    finally:
        s.close()


def share_links(h, browser, out):
    import tempfile
    links = [("all", "neutral entry: all thresholds cleared", "")]
    for label, q in preset_links(h, browser):
        links.append(("preset", label, q))
    for lid, label, q in EXTRA_LINKS:
        links.append((lid, label, q))
    qfile = Path(tempfile.mkdtemp(dir=str(U / "verify" / "scratch"))) / "queries.json"
    qfile.write_text(json.dumps([q for _i, _l, q in links]))
    raw = subprocess.run(["node", "--no-warnings", str(E2E / "tools" / "share_links.mjs"), "--site", str(h.site), "--queries", str(qfile)],
                         stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True).stdout
    lib = json.loads(raw)
    rows = []
    for (lid, label, q), lr in zip(links, lib):
        c = client_truth(h, browser, q)
        rows.append({"id": lid, "label": label, "query": q, "path": "/" + q, "client_europe_view": c,
                     "lib_result": {"europe": lr["europe"], "north_america": lr["north_america"], "pins": lr["pins"],
                                    "active_thresholds": lr["active_thresholds"], "ignored_by_lib_result": lr["ignored_by_lib_result"]},
                     "note": ("lib/result.js ignores q.* and modal keys; the client numbers include the qualitative filter"
                              if lr["ignored_by_lib_result"] else "")})
    write_json(Path(out) / "share-links.json", rows)
    return rows


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--site", default=None)
    ap.add_argument("--skip-layers", action="store_true")
    ap.add_argument("--skip-zoom", action="store_true")
    ap.add_argument("--skip-interactions", action="store_true")
    ap.add_argument("--refresh-archive", action="store_true")
    a = ap.parse_args(argv)
    out = Path(a.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    t0 = time.time()
    archive_sha = ensure_archive(a.refresh_archive)
    site = Path(a.site).resolve() if a.site else BASELINE_SITE
    # PNGs: upgrade-2026-10/screenshots/baseline-e2e/<out basename>/ (gitignored)
    shots = U / "screenshots" / "baseline-e2e" / out.name
    rev = git("rev-parse", BASELINE_COMMIT).decode().strip()
    head = git("rev-parse", "HEAD").decode().strip()
    h = Harness(site, a.port, offline=True, widths=(1280,), baseline_dir=out, label="baseline-capture")
    h.start()
    try:
        print("capturing 14 snapshots from %s on port %d" % (site, a.port), flush=True)
        manifest = capture_all(h, out, shots, with_layers=True)
        failed = [s for s in manifest["snapshots"] if not s.get("ok")]
        browser_version = None
        b = h.launch()
        try:
            browser_version = b.version
            print("share links", flush=True)
            links = share_links(h, b, out)
        finally:
            h.close_browser(b)
        fg = load_path("lsf_forms_guard", E2E / "tools" / "forms_guard.py")
        write_json(out / "forms.json", fg.record(site))
        disc = load_path("lsf_suite_discipline", E2E / "suites" / "discipline.py").run(h)
        write_json(out / "discipline.json", disc)
        if not a.skip_interactions:
            print("interactions (analytics events)", flush=True)
            inter = load_path("lsf_suite_interactions", E2E / "suites" / "interactions.py")
            h.baseline_dir = out
            irows = inter.run(h)
            write_json(out / "analytics.json", {"fired": h.extra.get("analytics_fired", {}), "declared": h.extra.get("analytics_declared", {}),
                                                "note": "fired = events observed through the window.va recorder in suites/interactions.py at 1280 px; "
                                                        "declared = trackEvent(...) calls in the source (signup is never fired: no submission is ever made)"})
            write_json(out / "interactions.json", irows)
        if not a.skip_layers:
            print("layer sweep (live network)", flush=True)
            h.offline = False
            sweep = run_sweeps(h, str(shots / "layers"), "baseline", skip_zoom=a.skip_zoom)
            write_json(out / "layers.json", sweep)
    finally:
        h.stop()
    versions = {"python": sys.version.split()[0], "playwright": importlib.metadata.version("playwright"), "chromium": browser_version,
                "node": subprocess.run(["node", "-v"], stdout=subprocess.PIPE).stdout.decode().strip()}
    manifest.update({"baseline_commit": BASELINE_COMMIT, "baseline_commit_full": rev, "repo_head_at_capture": head,
                     "archive_sha256": archive_sha, "archive_cmd": "git archive %s prototype | tar -x -C upgrade-2026-10/verify/baseline-site" % BASELINE_COMMIT,
                     "site": str(site), "tool_versions": versions, "port": a.port, "capture_seconds": round(time.time() - t0, 1),
                     "files": sorted(p.name for p in out.glob("*.json")), "share_links": len(links),
                     "snapshot_failures": [s["state"] + "@%d" % s["width"] for s in failed]})
    write_json(out / "manifest.json", manifest)
    print("manifest: commit %s, %d snapshots (%d failed), archive sha256 %s..., %s" % (
        BASELINE_COMMIT, manifest["snapshot_count"], len(failed), archive_sha[:12], out / "manifest.json"))
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
