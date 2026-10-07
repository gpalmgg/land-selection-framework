#!/usr/bin/env /usr/bin/python3
"""Compare two capture_baseline.py output directories (the zero-behaviour-change equivalence gate, map-craft 3.4).

    /usr/bin/python3 compare_snapshots.py --before DIR --after DIR [--ignore-network-scripts] [--ignore-style] [--ignore-layers]

Per snapshot (7 states x 2 widths): normalised body HTML must be identical; computed-style fingerprint identical; masked pixel
diff <= 0.1 percent; MapLibre style dump identical (and after each layer toggled on); same third-party hosts and own
non-JS/CSS requests (script and stylesheet request lists may differ: pass --strict-network to require them equal); no new console
error or warning. The layer-sweep verdict tables (layers.json) must agree by class (ok/slow/no-change count as the same class).
Exit status 1 on any non-allowed difference.
"""
import argparse
import sys
from pathlib import Path

E2E = Path(__file__).resolve().parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))
from lib.compare import compare_dirs   # noqa: E402


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--before", required=True)
    ap.add_argument("--after", required=True)
    ap.add_argument("--ignore-network-scripts", action="store_true", help="(default behaviour; kept for the documented CLI)")
    ap.add_argument("--strict-network", action="store_true")
    ap.add_argument("--ignore-style", action="store_true")
    ap.add_argument("--ignore-layers", action="store_true")
    a = ap.parse_args(argv)
    res = compare_dirs(a.before, a.after, ignore_style=a.ignore_style, strict_network=a.strict_network and not a.ignore_network_scripts,
                       ignore_layers=a.ignore_layers)
    bad = [r for r in res if not r["ok"]]
    for r in res:
        print("%s %s%s" % ("ok  " if r["ok"] else "FAIL", r["test"], ("  -- " + r["detail"]) if (not r["ok"] and r["detail"]) else ""))
    print("\n%d check(s), %d difference(s)" % (len(res), len(bad)))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
