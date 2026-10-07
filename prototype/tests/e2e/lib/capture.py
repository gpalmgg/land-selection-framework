"""Capture the 14 equivalence snapshots (7 states x 2 widths) of a site into an output directory and write manifest.json."""
import json
import os
import time
from pathlib import Path

from . import snapshot as snap


NORMALISATION_NOTES = [
    "third-party requests are stubbed (transparent PNG / empty GeoJSON), so the snapshots never depend on the network",
    "context: reduced motion, localStorage seeded (modal state subscribed except in the modal state; mobile note dismissed), "
    "formsubmit.co aborted, Date anchored, test style *{animation:none;transition:none} injected",
    "body HTML: script/style/link/noscript/comments dropped, MapLibre-injected subtrees dropped (.region-marker kept, its inline "
    "style dropped because marker positions depend on the GL canvas), class lists sorted and the transient .pulse class dropped, "
    "whitespace collapsed, live slider values added as data-live-value",
    "MapLibre style dump: version/glyphs/sprite/sources/layers/light/transition only (camera center/zoom omitted: they depend on animation timing)",
    "pixel diff: full-page PNG with #map and .maplibregl-ctrl-attrib hidden (visibility), threshold 0.1 percent of pixels",
    "console: error and warning lines with numbers masked; GL driver noise and the Vercel insights 404 dropped",
]


def capture_all(h, out_dir, shots_dir, with_layers=True):
    out_dir = Path(out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    recs = []
    only = [s for s in (os.environ.get("LSF_CAPTURE_STATES") or "").split(",") if s]
    for state in snap.STATES:
        if only and state not in only:
            continue
        for (w, ht) in snap.WIDTHS:
            browser = h.launch()
            try:
                rec = snap.capture_one(h, browser, state, w, ht, out_dir, shots_dir,
                                       layers_style=(with_layers and state == "initial" and w == 1280))
            finally:
                h.close_browser(browser)
            print("  snapshot %-9s@%-4d %s" % (state, w, "ok" if rec.get("ok") else "FAILED " + rec.get("error", "")), flush=True)
            recs.append(rec)
    manifest = {"snapshots": recs, "snapshot_count": len(recs), "screenshots_dir": str(shots_dir),
                "normalisation": NORMALISATION_NOTES, "captured": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())}
    (out_dir / "manifest.json").write_text(json.dumps(manifest, indent=1) + "\n", "utf-8")
    return manifest
