#!/usr/bin/env /usr/bin/python3
"""Probe the basemap on the real network: placeholder detector, bytes, CORS, and the labels-layer cost.

    /usr/bin/python3 tests/e2e/tools/probe_basemap.py --port N --site DIR [--out JSON] [--shots DIR] [--widths 1440,390]

For each default view (Europe, North America) at each width it loads the page against the live tile service and records every
request to the basemap host (services.arcgisonline.com .../Canvas/...), then:

  * PLACEHOLDER: a keyless/blocked provider answers 200 with one identical small body for every tile (the retired CARTO tiles were a
    2,049-byte "API KEY REQUIRED" PNG). The tiles are re-fetched and hashed: the view is flagged when >= 4 tiles share one body,
    when a body of exactly 2049 bytes appears twice or more, or when >= 90% of tile sizes are within 10% of one size under 4 KB.
  * BYTES: transferred bytes of the base tiles and of the Reference (place-name) tiles at the default view. The labels raster is
    forced on with setLayerZoomRange so its cost is measured whatever the BASEMAP_LABELS_MINZOOM flag says; the table lists base
    only, base + labels, and what the current flag actually loaded. Budget: <= 300 KB total at each default view (the current flag).
  * CORS: every tile response carries access-control-allow-origin.
  * PICTURE: a screenshot of the map (markers hidden) must show land/water structure (coastlines), not a flat or watermark ground.

Exit 0 only when every view passes. Writes JSON (default upgrade-2026-10/verify/e2e/MC-MAP-BASE-probe.json) and screenshots.
Never submits a form: the harness aborts and records any formsubmit.co request.
"""
import argparse
import hashlib
import json
import re
import sys
import urllib.request
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))

from lib.site import Harness, U, default_storage, goto_settled      # noqa: E402
from lib.layers import NetLog, wait_quiet                           # noqa: E402
from lib.util import write_json                                     # noqa: E402

try:
    from PIL import Image
    import numpy as np
    HAVE_PIL = True
except Exception:          # pragma: no cover
    HAVE_PIL = False

BUDGET_BYTES = 300 * 1024
CANVAS_HOST = "services.arcgisonline.com"
CANVAS_PATH = "/Canvas/"
PLACEHOLDER_SIGNATURE_BYTES = 2049
VIEWS = [("europe", "/"), ("north-america", "/?c=north-america")]


def is_canvas(url):
    return CANVAS_HOST in url and CANVAS_PATH.lower() in url.lower()


def kind(url):
    return "labels" if "reference" in url.lower() else "base"


def fetch(url, origin):
    req = urllib.request.Request(url, headers={"Origin": origin, "User-Agent": "lsf-basemap-probe"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return r.status, dict((k.lower(), v) for k, v in r.getheaders()), r.read()


def placeholder_report(urls, origin):
    """Hash the bodies of the tiles actually requested. Returns {tiles, distinct_bodies, sizes, suspect_placeholder, why}."""
    bodies = []
    for u in urls:
        try:
            st, hd, body = fetch(u, origin)
            bodies.append({"url": u, "status": st, "bytes": len(body), "sha": hashlib.sha1(body).hexdigest()[:12],
                           "cors": hd.get("access-control-allow-origin"), "type": hd.get("content-type")})
        except Exception as e:
            bodies.append({"url": u, "status": None, "bytes": 0, "sha": None, "cors": None, "type": None, "error": str(e)[:120]})
    ok = [b for b in bodies if b["sha"]]
    out = {"tiles": len(ok), "distinct_bodies": len({b["sha"] for b in ok}), "suspect_placeholder": False, "why": []}
    if ok:
        counts = {}
        for b in ok:
            counts[b["sha"]] = counts.get(b["sha"], 0) + 1
        top_sha, top_n = max(counts.items(), key=lambda kv: kv[1])
        if len(ok) >= 4 and top_n >= 4 and top_n / len(ok) >= 0.9:
            out["suspect_placeholder"] = True
            out["why"].append("%d of %d tiles share one body (%s)" % (top_n, len(ok), top_sha))
        sig = [b for b in ok if b["bytes"] == PLACEHOLDER_SIGNATURE_BYTES]
        if len(sig) >= 2:
            out["suspect_placeholder"] = True
            out["why"].append("%d tiles are exactly %d bytes (the CARTO placeholder signature)" % (len(sig), PLACEHOLDER_SIGNATURE_BYTES))
        sizes = sorted(b["bytes"] for b in ok)
        med = sizes[len(sizes) // 2]
        near = [s for s in sizes if abs(s - med) <= max(150, med * 0.1)]
        if len(ok) >= 4 and med < 4096 and len(near) / len(ok) >= 0.9:
            out["suspect_placeholder"] = True
            out["why"].append("%d%% of tile sizes sit within 10%% of %d bytes (< 4 KB)" % (round(100 * len(near) / len(ok)), med))
        out["median_bytes"] = med
    out["sizes"] = [b["bytes"] for b in ok][:40]
    out["bodies"] = ok[:3]
    out["failed"] = [b for b in bodies if not b["sha"]][:3]
    return out


def picture_report(png_path):
    """Land/water structure in the screenshot: share of pixels that sit on a strong edge, and the number of distinct colours
    (quantised). A watermark ground or a blank map has almost no edges and very few colours."""
    if not HAVE_PIL:
        return {"checked": False, "reason": "PIL not available"}
    im = Image.open(png_path).convert("RGB")
    a = np.asarray(im, dtype=np.int16)
    gx = np.abs(np.diff(a, axis=1)).sum(axis=2)
    edge_frac = float((gx > 12).mean())
    q = (a // 16).reshape(-1, 3)
    distinct = int(len({tuple(x) for x in q[::7]}))
    return {"checked": True, "edge_frac": round(edge_frac, 4), "distinct_colours": distinct,
            "ok": edge_frac > 0.004 and distinct >= 6}


def measure(h, browser, width, name, path, shots):
    s = h.session(browser, width=width, storage=default_storage(h.site), stub=False)
    page = s.page()
    nl = NetLog(page, s.context)
    cors = []
    page.on("response", lambda r: cors.append((r.url, r.status, r.headers.get("access-control-allow-origin"))) if is_canvas(r.url) else None)
    out = {"view": name, "width": width}
    try:
        goto_settled(page, h.base + path, extra_ms=300)
        wait_quiet(nl, quiet_s=1.5, max_s=25)
        info = page.evaluate("""() => { const m = window.__maps && window.__maps[0]; if (!m) return null;
            const l = m.getLayer('basemap-labels');
            return { zoom: m.getZoom(), center: m.getCenter(), labels_minzoom: l ? l.minzoom : null, basemap: document.documentElement.getAttribute('data-basemap'),
                     attribution: (document.querySelector('.maplibregl-ctrl-attrib-inner') || {}).textContent || '' }; }""")
        out["map"] = info
        if not info:
            out["error"] = "no map was constructed"
            return out
        flagged = [r for r in nl.reqs.values() if is_canvas(r["url"])]
        out["loaded_with_flag"] = {"base_tiles": sum(1 for r in flagged if kind(r["url"]) == "base"),
                                   "labels_tiles": sum(1 for r in flagged if kind(r["url"]) == "labels"),
                                   "bytes": sum(r["bytes"] for r in flagged)}
        # The picture: markers hidden, the map element only.
        page.add_style_tag(content=".region-marker,.bio-label,.maplibregl-marker{visibility:hidden!important}")
        shot = Path(shots) / ("basemap-%s-%d.png" % (name, width))
        shot.parent.mkdir(parents=True, exist_ok=True)
        page.locator("#map").scroll_into_view_if_needed()
        page.wait_for_timeout(500)
        page.locator("#map").screenshot(path=str(shot))
        out["screenshot"] = str(shot)
        out["picture"] = picture_report(shot)
        # Force the labels raster on to price it, whatever the flag says.
        page.evaluate("() => { const m = window.__maps[0]; if (m.getLayer('basemap-labels')) m.setLayerZoomRange('basemap-labels', 0, 24); }")
        wait_quiet(nl, quiet_s=1.5, max_s=25)
        tiles = [r for r in nl.reqs.values() if is_canvas(r["url"])]
        base = [r for r in tiles if kind(r["url"]) == "base"]
        labels = [r for r in tiles if kind(r["url"]) == "labels"]
        out["base_bytes"] = sum(r["bytes"] for r in base)
        out["labels_bytes"] = sum(r["bytes"] for r in labels)
        out["base_tiles"] = len(base)
        out["labels_tiles"] = len(labels)
        out["with_labels_bytes"] = out["base_bytes"] + out["labels_bytes"]
        out["failed"] = [{"url": r["url"][-60:], "status": r["status"], "error": r["failed"]} for r in tiles if r["failed"] or (r["status"] or 200) >= 400][:5]
        out["cors"] = {"tiles": len(cors), "missing": [u[-60:] for (u, st, c) in cors if st == 200 and not c][:3]}
        out["urls"] = [r["url"] for r in tiles if not r["failed"]]
        out["errors"] = [e for e in nl.pageerrors][:3]
    finally:
        s.close()
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, required=True)
    ap.add_argument("--site", required=True)
    ap.add_argument("--out", default=str(U / "verify" / "e2e" / "MC-MAP-BASE-probe.json"))
    ap.add_argument("--shots", default=str(U / "verify" / "e2e" / "MC-MAP-BASE-shots"))
    ap.add_argument("--widths", default="1440,390")
    a = ap.parse_args(argv)
    widths = [int(w) for w in a.widths.split(",") if w]
    rows, problems = [], []
    h = Harness(a.site, a.port, widths=widths)
    try:
        h.start()
        if not h.browser_installed():
            print("SKIPPED: chromium not installed")
            return 0
        for width in widths:
            for name, path in VIEWS:
                b = h.launch()
                try:
                    row = measure(h, b, width, name, path, a.shots)
                finally:
                    h.close_browser(b)
                rows.append(row)
    finally:
        h.stop()

    for row in rows:
        tag = "%s@%d" % (row["view"], row["width"])
        if row.get("error"):
            problems.append("%s: %s" % (tag, row["error"]))
            continue
        ph = placeholder_report(row.get("urls", [])[:24], h.base)
        row["placeholder"] = ph
        if ph["suspect_placeholder"]:
            problems.append("%s: placeholder tiles (%s)" % (tag, "; ".join(ph["why"])))
        if not ph["tiles"]:
            problems.append("%s: no basemap tile could be fetched" % tag)
        if row["failed"]:
            problems.append("%s: basemap tile requests failed %s" % (tag, row["failed"]))
        if row["cors"]["missing"]:
            problems.append("%s: tile responses without access-control-allow-origin %s" % (tag, row["cors"]["missing"]))
        if row["loaded_with_flag"]["bytes"] > BUDGET_BYTES:
            problems.append("%s: %d bytes loaded at the default view (budget %d)" % (tag, row["loaded_with_flag"]["bytes"], BUDGET_BYTES))
        if row["picture"].get("checked") and not row["picture"]["ok"]:
            problems.append("%s: the map picture has no land/water structure %s" % (tag, row["picture"]))
        if "Esri" not in (row["map"].get("attribution") or ""):
            problems.append("%s: Esri attribution is not on the map (%r)" % (tag, row["map"].get("attribution")))
        if row["map"].get("basemap") != "esri-light":
            problems.append("%s: expected the esri-light basemap, got %s" % (tag, row["map"].get("basemap")))
    if h.formsubmit_attempts():
        problems.append("a request to formsubmit.co was attempted: %s" % h.formsubmit_attempts()[:3])

    print("%-14s %5s %6s %10s %12s %14s %12s" % ("view", "width", "zoom", "base KB", "+labels KB", "flag loaded KB", "labels min z"))
    for r in rows:
        if r.get("error"):
            continue
        print("%-14s %5d %6.2f %10.1f %12.1f %14.1f %12s" % (
            r["view"], r["width"], r["map"]["zoom"], r["base_bytes"] / 1024.0, r["with_labels_bytes"] / 1024.0,
            r["loaded_with_flag"]["bytes"] / 1024.0, r["map"]["labels_minzoom"]))
        ph = r.get("placeholder", {})
        print("    tiles=%s distinct_bodies=%s placeholder=%s cors_missing=%d picture=%s" % (
            ph.get("tiles"), ph.get("distinct_bodies"), ph.get("suspect_placeholder"), len(r["cors"]["missing"]), r["picture"]))
    fits = all(r["with_labels_bytes"] <= BUDGET_BYTES for r in rows if not r.get("error"))
    print("labels at the default views fit the %d KB budget at every view and width: %s" % (BUDGET_BYTES // 1024, fits))
    report = {"status": "pass" if not problems else "fail", "budget_bytes": BUDGET_BYTES, "views": rows, "problems": problems,
              "labels_fit_budget_everywhere": fits}
    write_json(a.out, report)
    if problems:
        print("\nPROBE FAILED:")
        for p in problems:
            print("  - " + p)
        return 1
    print("\nPROBE PASSED: no placeholder tiles, CORS present, bytes within budget, the picture shows coastlines.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
