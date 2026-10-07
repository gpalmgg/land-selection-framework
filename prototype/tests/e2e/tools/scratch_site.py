#!/usr/bin/env /usr/bin/python3
"""Build a SCRATCH copy of the deployable site, so no WP ever has to regenerate artifacts in the working tree (policy P-GEN).

    scratch_site.py --out DIR [--pin-data] [--src SITE]

  The file list is the deployable list (tools/deploy_filelist.py: scratch-repo + .vercelignore method) of --src (default: the
  working tree's prototype/), copied so that DIR/index.html is the home page. `.vercel/` is never copied.

  --pin-data   then overlay the data files that existed at 6bce1a3 (data/regions.js, land-standing.js, region-depth.js,
               v1-lookup.js and data/processed/**) from upgrade-2026-10/verify/baseline-site/prototype, so equivalence gates in
               waves 1-3 are immune to concurrent data-integration WPs. Generators are NOT run.
  (default)    regenerate the generated artifacts INTO DIR ONLY, each only if the script exists in the tree and its --help text
               names the flag:
                   node scripts/gen_v1_lookup.mjs --out DIR/data/v1-lookup.js
                   node scripts/gen_region_pages.mjs --out-dir DIR
                   node scripts/stamp_build.mjs --root DIR --write
               (run with the working tree's prototype/ as cwd; a script that lacks the flag is reported as skipped)

DIR must live under upgrade-2026-10/verify/scratch/ (it is deleted and recreated). A manifest is written next to it:
DIR.manifest.json.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))
PROTO = E2E.parent.parent
R = PROTO.parent
U = R / "upgrade-2026-10"
BASELINE_SITE = U / "verify" / "baseline-site" / "prototype"
SCRATCH_ROOT = (U / "verify" / "scratch").resolve()

PINNED = ["data/regions.js", "data/land-standing.js", "data/region-depth.js", "data/v1-lookup.js", "data/presets.js"]  # presets.js: baseline copy has the 20-region cool-wet floor (forest_change 0); the working tree uses -1 for 30 regions


def run_generators(src, out):
    notes = []
    gens = [("scripts/gen_v1_lookup.mjs", "--out", ["--out", str(out / "data" / "v1-lookup.js")]),
            ("scripts/gen_region_pages.mjs", "--out-dir", ["--out-dir", str(out)]),
            ("scripts/stamp_build.mjs", "--root", ["--root", str(out), "--write"])]
    for rel, flag, args in gens:
        script = src / rel
        if not script.is_file():
            notes.append({"script": rel, "ran": False, "why": "script does not exist in the tree"})
            continue
        h = subprocess.run(["node", str(script), "--help"], cwd=str(src), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=120)
        help_text = h.stdout.decode("utf-8", "replace")
        if flag not in help_text:
            notes.append({"script": rel, "ran": False, "why": "--help does not name %s" % flag})
            continue
        r = subprocess.run(["node", str(script)] + args, cwd=str(src), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=600)
        notes.append({"script": rel, "ran": True, "exit": r.returncode, "tail": r.stdout.decode("utf-8", "replace")[-400:]})
        if r.returncode != 0:
            raise SystemExit("generator %s failed (exit %d):\n%s" % (rel, r.returncode, r.stdout.decode("utf-8", "replace")[-1500:]))
    return notes


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", required=True)
    ap.add_argument("--pin-data", action="store_true")
    ap.add_argument("--src", default=str(PROTO))
    a = ap.parse_args(argv)
    out = Path(a.out).resolve()
    src = Path(a.src).resolve()
    if SCRATCH_ROOT not in out.parents:
        print("error: --out must be under %s (it is deleted and recreated)" % SCRATCH_ROOT, file=sys.stderr)
        return 2
    from importlib.machinery import SourceFileLoader
    dl = SourceFileLoader("lsf_deploy_filelist", str(E2E / "tools" / "deploy_filelist.py")).load_module()
    files = [f for f in dl.deploy_list(src, src / ".vercelignore") if not f.startswith(".vercel/")]
    if out.exists():
        shutil.rmtree(str(out))
    out.mkdir(parents=True)
    for f in files:
        dst = out / f
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(src / f), str(dst))
    manifest = {"src": str(src), "out": str(out), "pin_data": bool(a.pin_data), "files": len(files), "pinned": [], "generators": []}
    if a.pin_data:
        for rel in PINNED:
            b = BASELINE_SITE / rel
            if b.is_file():
                (out / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(b), str(out / rel))
                manifest["pinned"].append(rel)
        bp = BASELINE_SITE / "data" / "processed"
        for f in sorted(bp.rglob("*")):
            if f.is_file():
                rel = str(f.relative_to(BASELINE_SITE))
                (out / rel).parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(f), str(out / rel))
                manifest["pinned"].append(rel)
    else:
        manifest["generators"] = run_generators(src, out)
    mpath = Path(str(out) + ".manifest.json")
    mpath.write_text(json.dumps(manifest, indent=1) + "\n", "utf-8")
    print("scratch site: %s (%d deployable files from %s; %s)" % (
        out, len(files), src, "data pinned to 6bce1a3: %d files overlaid" % len(manifest["pinned"]) if a.pin_data
        else "generators: " + ", ".join("%s=%s" % (g["script"].split("/")[-1], "ran" if g["ran"] else "skipped") for g in manifest["generators"])))
    return 0


if __name__ == "__main__":
    sys.exit(main())
