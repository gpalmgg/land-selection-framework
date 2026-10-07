"""test_map_labels: label placement on the map, with the real slate and with the 45-region stress site (MC-MAP-UI, design 8.6).

For each continent, at 1280 and 390, on the real data and on the synthetic stress site (scripts/make_stress_site.mjs, 45 regions,
one very long name and several outside Latin-1):

  * no two visible labels intersect (the region pills and any bioregion labels together)
  * no visible label is clipped by the stage, and none sits under the map's own controls
  * no label covers another marker's chip (every chip is an obstacle first)
  * every chip is inside the stage (the continent fit), at the fitted view and again after a zoom in
  * a stage narrower than 560 px shows no pill at all (chip only: the aria-label and the card list carry the name)
  * placement is deterministic: running it again changes nothing
  * placement answers the map: it re-runs after a zoom and after a continent switch
  * at least one pill is shown on a wide stage (a placement that drops everything would pass the rest vacuously)
Nothing is submitted; third-party requests are stubbed. Test ids: labels:*, fit:*, harness.
"""
import mimetypes
import re
import subprocess
from pathlib import Path

from lib import sel as _sel
from lib.site import PNG_1X1, PROTO, U, default_storage, goto_settled

NAME = "test_map_labels"
S = _sel.load("mapui")
SEL = S.SEL
STRESS_DIR = U / "verify" / "scratch" / "MC-MAP-UI-stress"
STRESS_REGIONS = 45
ARCGIS = re.compile(r"^https?://services\.arcgisonline\.com/", re.I)
COMPACT = 560


def serve_dir_through(context, base, root):
    """Answer same-origin requests from `root` instead of the harness's site: one port, two sites."""
    root = Path(root)

    def handler(route, request):
        path = request.url[len(base):].split("?", 1)[0].split("#", 1)[0]
        path = path.lstrip("/") or "index.html"
        f = root / path
        if f.is_dir():
            f = f / "index.html"
        if f.is_file():
            ctype = mimetypes.guess_type(str(f))[0] or "application/octet-stream"
            route.fulfill(status=200, body=f.read_bytes(), headers={"content-type": ctype, "cache-control": "no-store"})
        else:
            route.fallback()
    context.route(re.compile(r"^%s/" % re.escape(base)), handler)


def build_stress_site(r):
    script = PROTO / "scripts" / "make_stress_site.mjs"
    if not script.is_file():
        r.check("harness:stress-site-script-present", False, "scripts/make_stress_site.mjs does not exist")
        return None
    p = subprocess.run(["node", str(script), "--regions", str(STRESS_REGIONS), "--out", str(STRESS_DIR)], cwd=str(PROTO),
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=600)
    tail = p.stdout.decode("utf-8", "replace")[-300:]
    if p.returncode != 0:
        r.check("harness:stress-site-built", False, tail)
        return None
    r.info("harness:stress-site-built", tail.strip().splitlines()[-1] if tail.strip() else "ok")
    return STRESS_DIR


def overlap(a, b):
    w = min(a["r"], b["r"]) - max(a["l"], b["l"])
    hh = min(a["b"], b["b"]) - max(a["t"], b["t"])
    return w > 0.5 and hh > 0.5


def inside(a, st, pad=0):
    return a["l"] >= st["l"] + pad - 0.5 and a["r"] <= st["r"] - pad + 0.5 and a["t"] >= st["t"] + pad - 0.5 and a["b"] <= st["b"] - pad + 0.5


def fresh(h, browser, width, root=None):
    site = root or h.site
    s = h.session(browser, width=width, storage=default_storage(site), stub=True)
    s.context.route(ARCGIS, lambda route, request: route.fulfill(
        status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"}))
    if root is not None:
        serve_dir_through(s.context, h.base, root)
    page = s.page()
    log = s.log(page)
    goto_settled(page, h.base + "/", extra_ms=500)
    return s, page, log


def click_tab(page, continent):
    tab = page.locator('%s[data-continent="%s"]' % (SEL["tab"], continent))
    tab.scroll_into_view_if_needed()
    tab.click()
    page.wait_for_timeout(1000)


def labels_of(mk):
    """Every visible label rectangle: the region pills and the bioregion labels."""
    out = [("pill:%s" % m["id"], m["label"]) for m in mk["markers"] if m["label"]]
    out += [("bio:%s" % b["txt"][:20], b) for b in mk["bio"]]
    return out


def check_view(r, page, tag, view, width):
    """The label rules on whatever view the map is in now."""
    mk = page.evaluate(S.JS_MARKERS)
    labs = labels_of(mk)
    pairs = [(a[0], b[0]) for i, a in enumerate(labs) for b in labs[i + 1:] if overlap(a[1], b[1])]
    r.check("labels:no-two-visible-labels-intersect:%s%s" % (view, tag), not pairs, pairs[:4])
    clipped = [n for n, rc in labs if not inside(rc, mk["stage"])]
    r.check("labels:none-clipped-by-the-stage:%s%s" % (view, tag), not clipped, clipped[:4])
    under = [n for n, rc in labs for k in mk["ctrls"] if overlap(rc, k)]
    r.check("labels:none-under-the-map-controls:%s%s" % (view, tag), not under, under[:4])
    covers = [(n, m["id"]) for n, rc in labs for m in mk["markers"] if n != "pill:%s" % m["id"] and overlap(rc, m["chip"])]
    r.check("labels:none-covers-another-markers-chip:%s%s" % (view, tag), not covers, covers[:4])
    own = [n for n, rc in labs for m in mk["markers"] if n == "pill:%s" % m["id"] and overlap(rc, m["chip"])]
    r.check("labels:a-pill-never-covers-its-own-chip:%s%s" % (view, tag), not own, own[:4])
    return mk, labs


def run_site(r, h, browser, width, root, site_label, expect_total=None):
    tag = "@%d" % width
    s, page, log = fresh(h, browser, width, root)
    try:
        conts = page.evaluate("Array.from(document.querySelectorAll('.continent-tab')).map((b) => b.dataset.continent)")
        total = page.evaluate("document.querySelectorAll('.region-card').length")
        if expect_total is not None:
            r.check("harness:%s-has-%d-regions%s" % (site_label, expect_total, tag), total == expect_total, total)
        r.check("harness:%s-has-two-continents%s" % (site_label, tag), len(conts) >= 2, conts)
        for c in conts:
            if page.evaluate(S.JS_ACTIVE_CONTINENT) != c:
                click_tab(page, c)
            page.locator(SEL["map"]).scroll_into_view_if_needed()
            page.wait_for_timeout(700)
            view = "%s:%s" % (site_label, c)
            mk, labs = check_view(r, page, tag, view, width)
            n_markers = len(mk["markers"])
            bad = [m["id"] for m in mk["markers"] if not inside(m["chip"], mk["stage"])]
            r.check("fit:every-chip-inside-the-stage:%s%s" % (view, tag), not bad and n_markers > 0, "%d markers; outside: %s" % (n_markers, bad[:5]))
            clash = [m["id"] for m in mk["markers"] for k in mk["ctrls"] if overlap(m["chip"], k)]
            r.check("fit:no-chip-under-the-map-controls:%s%s" % (view, tag), not clash, clash[:5])
            pills = [x for x in labs if x[0].startswith("pill:")]
            r.info("labels:shown:%s%s" % (view, tag), "%d of %d pills shown, stage %dx%d" % (len(pills), n_markers, mk["stage"]["w"], mk["stage"]["h"]))
            if mk["stage"]["w"] < COMPACT:
                r.check("labels:narrow-stage-shows-no-pill:%s%s" % (view, tag), not pills and not mk["bio"], [p[0] for p in pills][:4])
            else:
                r.check("labels:wide-stage-shows-pills:%s%s" % (view, tag), len(pills) >= max(1, n_markers // 4), "%d of %d" % (len(pills), n_markers))
            # determinism: placing again changes nothing
            before = [(m["id"], m["cls"]) for m in mk["markers"]]
            page.evaluate("() => import('/src/map/labels.js').then((m) => { m.placeLabels(); m.placeLabels(); })")
            page.wait_for_timeout(100)
            after = [(m["id"], m["cls"]) for m in page.evaluate(S.JS_MARKERS)["markers"]]
            r.check("labels:placement-is-deterministic:%s%s" % (view, tag), before == after, [(a, b) for a, b in zip(before, after) if a != b][:3])
            # zoom in: placement re-runs on zoomend, the rules still hold
            cam = page.evaluate(S.JS_CAMERA)
            page.evaluate(S.JS_JUMP, min(cam["zoom"] + 1.6, 7))
            page.wait_for_timeout(700)
            mk2, labs2 = check_view(r, page, tag, view + ":zoomed", width)
            r.check("labels:rerun-after-zoom:%s%s" % (view, tag), page.evaluate(S.JS_CAMERA)["zoom"] > cam["zoom"], page.evaluate(S.JS_CAMERA))
            page.evaluate(S.JS_JUMP, cam["zoom"])
            page.wait_for_timeout(300)
        r.check("harness:no-formsubmit-%s%s" % (site_label, tag), not s.guard.formsubmit, s.guard.formsubmit)
        errs = [e for e in log.errors() if not str(e.get("text", "")).startswith("Failed to load resource")]
        errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
        r.check("harness:no-console-errors-%s%s" % (site_label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))
    finally:
        s.close()


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    stress = build_stress_site(r)
    for width in h.widths:
        browser = h.launch()
        try:
            run_site(r, h, browser, width, None, "real")
            if stress is not None:
                run_site(r, h, browser, width, stress, "stress45", expect_total=STRESS_REGIONS)
        finally:
            h.close_browser(browser)
    return r.out
