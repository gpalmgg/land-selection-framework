#!/usr/bin/env /usr/bin/python3
"""List the files a `vercel deploy` of a site directory would upload (the scratch-repo method of map-craft section 1).

A zero-byte copy of the site (minus .venv, node_modules, .git) is created in a scratch `git init` with its .vercelignore renamed
.gitignore; `git ls-files -o --exclude-standard` then yields the would-be-uploaded files. (`git check-ignore` is NOT usable:
its patterns anchor to the repo root, not to prototype/.)

    deploy_filelist.py --site DIR                              # the site's own .vercelignore
    deploy_filelist.py --site DIR --ignore-file FILE           # a different ignore file
    deploy_filelist.py --site DIR --with-current-vercelignore  # compare the site's own list with the list produced by the
                                                               # working tree's prototype/.vercelignore: exit 1 when they differ
    options: --list (print every file) --json OUT --expect-count N --assert-absent PREFIX (default tests/ when comparing)

Exit status: 0 ok, 1 a comparison or assertion failed.
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
PROTO = E2E.parent.parent
SKIP_DIRS = {".venv", "node_modules", ".git", "__pycache__"}


def deploy_list(site, ignore_file=None):
    site = Path(site)
    ignore = Path(ignore_file) if ignore_file else site / ".vercelignore"
    scratch_root = os.environ.get("LSF_SCRATCH") or str(PROTO.parent / "upgrade-2026-10" / "verify" / "scratch")
    os.makedirs(scratch_root, exist_ok=True)
    tmp = Path(tempfile.mkdtemp(prefix="deploylist-", dir=scratch_root))
    try:
        for root, dirs, files in os.walk(site):
            dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
            rel = Path(root).relative_to(site)
            (tmp / rel).mkdir(parents=True, exist_ok=True)
            for f in files:
                (tmp / rel / f).touch()
        for stale in (tmp / ".gitignore",):
            if stale.exists():
                stale.unlink()
        if ignore.is_file():
            shutil.copyfile(str(ignore), str(tmp / ".gitignore"))
        env = dict(os.environ, GIT_CONFIG_GLOBAL="/dev/null", GIT_CONFIG_SYSTEM="/dev/null", GIT_CONFIG_NOSYSTEM="1")
        subprocess.run(["git", "init", "-q"], cwd=str(tmp), env=env, check=True)
        out = subprocess.run(["git", "ls-files", "-o", "--exclude-standard", "-z"], cwd=str(tmp), env=env, check=True,
                             stdout=subprocess.PIPE).stdout.decode("utf-8", "replace")
        files = sorted(f for f in out.split("\0") if f)
        # the ignore file itself is not part of the upload: .gitignore is a stand-in for it
        return [f for f in files if f != ".gitignore"]
    finally:
        shutil.rmtree(str(tmp), ignore_errors=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", required=True)
    ap.add_argument("--ignore-file", default=None)
    ap.add_argument("--with-current-vercelignore", action="store_true")
    ap.add_argument("--current-vercelignore", default=str(PROTO / ".vercelignore"))
    ap.add_argument("--list", action="store_true")
    ap.add_argument("--json", default=None)
    ap.add_argument("--expect-count", type=int, default=None)
    ap.add_argument("--assert-absent", action="append", default=[])
    a = ap.parse_args(argv)

    rc = 0
    own = deploy_list(a.site, a.ignore_file)
    print("deploy list with %s: %d files" % (a.ignore_file or "the site's own .vercelignore", len(own)))
    result = {"site": str(a.site), "own_count": len(own)}
    lists = [("own", own)]
    if a.with_current_vercelignore:
        cur = deploy_list(a.site, a.current_vercelignore)
        print("deploy list with %s: %d files" % (a.current_vercelignore, len(cur)))
        lists.append(("current", cur))
        added, removed = sorted(set(cur) - set(own)), sorted(set(own) - set(cur))
        result.update({"current_count": len(cur), "added": added, "removed": removed})
        if added or removed:
            print("DIFFERENT: +%d -%d" % (len(added), len(removed)))
            for f in added[:20]:
                print("  +", f)
            for f in removed[:20]:
                print("  -", f)
            rc = 1
        else:
            print("UNCHANGED: the deploy list is identical with and without the .vercelignore change")
        if not a.assert_absent:
            a.assert_absent = ["tests/", "test/", "e2e/", "tools/"]
    for name, files in lists:
        if a.expect_count is not None and len(files) != a.expect_count:
            print("COUNT MISMATCH (%s): %d != %d" % (name, len(files), a.expect_count))
            rc = 1
        for pre in a.assert_absent:
            hit = [f for f in files if f.startswith(pre) or ("/" + pre) in f]
            if hit:
                print("PRESENT under %s (%s): %s" % (pre, name, hit[:5]))
                rc = 1
    if a.assert_absent and rc == 0:
        print("absent: %s" % ", ".join(a.assert_absent))
    if a.list:
        for f in lists[-1][1]:
            print(f)
    result["status"] = "pass" if rc == 0 else "fail"
    if a.json:
        Path(a.json).parent.mkdir(parents=True, exist_ok=True)
        Path(a.json).write_text(json.dumps(dict(result, files=lists[-1][1]), indent=1) + "\n", "utf-8")
    return rc


if __name__ == "__main__":
    sys.exit(main())
