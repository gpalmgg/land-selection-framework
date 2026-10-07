"""Compare two snapshot captures (capture_baseline.py output directories). Shared by compare_snapshots.py and suites/snapshot.py.

Per snapshot (state@width): normalised body HTML (sha), computed-style fingerprint, masked pixel diff (<= 0.1 percent differing
pixels), MapLibre style dump (sha, plus the dump after each layer toggled on), network summary (third-party hosts and own
non-JS/CSS requests; script/style lists only with strict_network), console (no NEW error or warning). Optionally the layer
sweep verdict table (layers.json) by verdict class.
"""
import difflib
import json
from pathlib import Path

from .layers import verdict_class

PIXEL_LIMIT = 0.001      # 0.1 percent


def _load(d):
    d = Path(d)
    m = json.loads((d / "manifest.json").read_text("utf-8"))
    snaps = {}
    for s in m["snapshots"]:
        snaps["%s@%d" % (s["state"], s["width"])] = s
    return d, m, snaps


def pixel_diff(a_path, b_path):
    from PIL import Image
    import numpy as np
    a = Image.open(a_path).convert("RGB")
    b = Image.open(b_path).convert("RGB")
    if a.size != b.size:
        return None, "sizes differ: %s vs %s" % (a.size, b.size)
    arr = np.abs(np.asarray(a, dtype=np.int16) - np.asarray(b, dtype=np.int16)).sum(axis=2)
    return float((arr > 24).mean()), ""


def fp_diff(a, b):
    out = []
    for sel in sorted(set(a) | set(b)):
        x, y = a.get(sel), b.get(sel)
        if x == y:
            continue
        if x is None or y is None:
            out.append("%s: %s" % (sel, "missing before" if x is None else "missing after"))
            continue
        for p in sorted(set(x) | set(y)):
            if x.get(p) != y.get(p):
                out.append("%s.%s: %r -> %r" % (sel, p, x.get(p), y.get(p)))
    return out


def compare_dirs(before, after, ignore_style=False, strict_network=False, ignore_layers=False, pixel_limit=PIXEL_LIMIT):
    bd, bm, bs = _load(before)
    ad, am, as_ = _load(after)
    res = []

    def check(test, ok, detail=""):
        res.append({"test": test, "ok": bool(ok), "detail": str(detail)[:1500]})

    check("same-snapshot-set", sorted(bs) == sorted(as_), "before %s | after %s" % (sorted(bs), sorted(as_)))
    for tag in sorted(set(bs) & set(as_)):
        a, b = bs[tag], as_[tag]
        if not (a.get("ok") and b.get("ok")):
            check("captured:" + tag, False, "before ok=%s %s | after ok=%s %s" % (a.get("ok"), a.get("error"), b.get("ok"), b.get("error")))
            continue
        check("body-html:" + tag, a["body_sha256"] == b["body_sha256"],
              _body_diff(bd, ad, tag) if a["body_sha256"] != b["body_sha256"] else "")
        d = fp_diff(a["fingerprint"], b["fingerprint"])
        check("fingerprint:" + tag, not d, "%d differences: %s" % (len(d), d[:6]))
        try:
            frac, why = pixel_diff(a["screenshot"], b["screenshot"])
            check("pixels:" + tag, frac is not None and frac <= pixel_limit, why or "%.4f percent differing" % (frac * 100))
        except Exception as e:
            check("pixels:" + tag, False, "cannot diff: %s" % e)
        if not ignore_style:
            check("map-style:" + tag, a.get("style_sha256") == b.get("style_sha256"), "MapLibre style dumps differ")
            if "style_after_toggle" in a or "style_after_toggle" in b:
                ta, tb = a.get("style_after_toggle") or {}, b.get("style_after_toggle") or {}
                diff = sorted(k for k in set(ta) | set(tb) if ta.get(k) != tb.get(k))
                check("map-style-per-layer:" + tag, not diff, "layers whose style differs when toggled on: %s" % diff)
        na, nb = a["network"], b["network"]
        check("network-hosts:" + tag, na["third_party_hosts"] == nb["third_party_hosts"],
              "%s -> %s" % (na["third_party_hosts"], nb["third_party_hosts"]))
        check("network-own-requests:" + tag, na["own_non_js_css"] == nb["own_non_js_css"],
              "added %s removed %s" % (sorted(set(nb["own_non_js_css"]) - set(na["own_non_js_css"])),
                                       sorted(set(na["own_non_js_css"]) - set(nb["own_non_js_css"]))))
        if strict_network:
            check("network-scripts-styles:" + tag, na["own_scripts"] == nb["own_scripts"] and na["own_styles"] == nb["own_styles"], "script/style lists differ")
        new_console = sorted(set(b["console"]) - set(a["console"])) + ["pageerror: " + e for e in b["pageerrors"] if e not in a["pageerrors"]]
        check("console:" + tag, not new_console, new_console[:5])
        check("no-formsubmit:" + tag, not b.get("formsubmit_attempts"), b.get("formsubmit_attempts"))
    if not ignore_layers:
        la, lb = _layers(bd), _layers(ad)
        if la is not None and lb is not None:
            ta, tb = _table(la), _table(lb)
            diffs = sorted(k for k in set(ta) | set(tb) if ta.get(k) != tb.get(k))
            check("layer-sweep-verdicts", not diffs, "; ".join("%s: %s -> %s" % (k, ta.get(k), tb.get(k)) for k in diffs[:10]))
    return res


def _body_diff(bd, ad, tag):
    try:
        a = (bd / "snapshots" / (tag + ".body.html")).read_text("utf-8").splitlines()
        b = (ad / "snapshots" / (tag + ".body.html")).read_text("utf-8").splitlines()
        d = [l for l in difflib.unified_diff(a, b, "before", "after", lineterm="", n=0) if not l.startswith(("---", "+++", "@@"))]
        return "%d changed lines, first: %s" % (len(d), [x[:200] for x in d[:6]])
    except Exception as e:
        return "body differs (%s)" % e


def _layers(d):
    p = Path(d) / "layers.json"
    if not p.is_file():
        return None
    return json.loads(p.read_text("utf-8"))


def _table(lj):
    t = {}
    for row in lj.get("layers", []):
        t["%s:%s" % (row["continent"], row["layer_id"])] = verdict_class(row["verdict"])
    for row in ((lj.get("zoom") or {}).get("layers") or []):
        t["zoom:%s" % row["layer_id"]] = verdict_class(row["verdict"])
    return t
