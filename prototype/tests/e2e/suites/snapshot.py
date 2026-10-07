"""snapshot: the zero-behaviour-change equivalence gate (map-craft 3.4), used by MC-CSS-SPLIT and MC-JS-1/2/3.

Captures the site under test (third-party requests stubbed, 7 states x 2 widths) into
upgrade-2026-10/verify/scratch/<label>-snapshot/ and compares it with the baseline capture (verify/baseline by default).
Run against a `scratch_site.py --pin-data` copy so concurrent data WPs cannot disturb it. Excluded from `--suite all`.
Environment: LSF_SNAPSHOT_IGNORE=style,network,layers relaxes individual checks (a wave that changes them on purpose).
"""
import os
import shutil
from pathlib import Path

from lib.compare import compare_dirs
from lib.capture import capture_all
from lib.site import U

NAME = "snapshot"


def run(ctx):
    r = ctx.new_results(NAME)
    out = U / "verify" / "scratch" / ((ctx.label or "run") + "-snapshot")
    if out.exists():
        shutil.rmtree(str(out))
    shots = U / "screenshots" / "snapshot" / ((ctx.label or "run") + "-snapshot")
    capture_all(ctx, out, shots, with_layers=True)
    ign = set((os.environ.get("LSF_SNAPSHOT_IGNORE") or "").split(","))
    if not (ctx.baseline_dir / "manifest.json").is_file():
        r.check("baseline-present", False, "no baseline at %s: run capture_baseline.py first" % ctx.baseline_dir)
        return r.out
    for row in compare_dirs(ctx.baseline_dir, out, ignore_style="style" in ign, ignore_layers=True, strict_network="network-strict" in ign):
        r.check(row["test"], row["ok"], row["detail"])
    return r.out
