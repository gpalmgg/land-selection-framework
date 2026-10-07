"""test_mapbase: the basemap (Esri primary, OpenFreeMap failover), the theme switch and the map loader. Owned by MC-MAP-BASE.

Structure (third-party requests stubbed, no network needed):
  * style-light / style-dark-wired / ground-from-tokens: the light pair, the dark pair (raster-brightness-max .7, no CSS invert)
    and the ground colour that must equal the page's --paper token as the browser resolves it
  * layer-order: ground, base, then every data layer, then the labels raster last (overlays above the base, below the labels),
    also after a theme swap and after the data layers were re-added
  * theme-swap: data-theme dark then light swaps the Esri pair with setStyle(diff:false) and the data layers come back
  * gate: with colorScheme=dark emulated the page stays on the light pair while the theme gate is closed; with the gate open it
    loads the dark pair (the live dark check is skipped, with a printed reason, while the gate is closed)
  * loader: a missing MapLibre tag is rescued by script injection; a script that fails shows the map fallback at once; a script
    that never answers shows it after 10 s; none of them throws
Live (real tile services; skipped with --offline):
  * esri-primary:<view>@<width>: no placeholder tiles (identical-body detector), CORS present, Esri attribution on the map, a picture
    with coastlines, and basemap bytes at the default Europe and North America views at most 300 KB
  * failover: with services.arcgisonline.com aborted the map shows the OpenFreeMap style within 10 s, no uncaught error
Nothing is ever submitted: the harness aborts and records every formsubmit.co request.
"""
import re
import time
from pathlib import Path

from lib import sel as _sel
from lib.layers import NetLog, wait_quiet
from lib.site import PNG_1X1, U, default_storage, goto_settled
from lib.util import load_tool

NAME = "test_mapbase"
S = _sel.load("mapbase")
SHOTS = U / "verify" / "e2e" / "MC-MAP-BASE-shots"
BUDGET = 300 * 1024
ARCGIS = re.compile(r"^https?://services\.arcgisonline\.com/", re.I)


def fresh(h, browser, width=1280, path="/", scheme="light", stub=True, settle=True):
    s = h.session(browser, width=width, scheme=scheme, storage=default_storage(h.site), stub=stub)
    if stub:
        # The harness stubs every third-party fetch with JSON, which MapLibre rightly reads as a failed tile (the failover would
        # fire). Esri tiles get a real 1x1 PNG so the structure checks see the primary basemap, not the failover.
        s.context.route(ARCGIS, lambda route, request: route.fulfill(
            status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"}))
    page = s.page()
    if settle:
        goto_settled(page, h.base + path, extra_ms=300)
    return s, page


def tag(page):
    return page.evaluate(S.JS_BASEMAP_TAG)


def wait_tag(page, want, timeout=10000):
    t0 = time.time()
    try:
        page.wait_for_function("(w) => document.documentElement.getAttribute('data-basemap') === w", arg=want, timeout=timeout)
        return round(time.time() - t0, 2)
    except Exception:
        return None


def wait_style_loaded(page, timeout=10000):
    try:
        page.wait_for_function("() => { const m = window.__maps && window.__maps[0]; return !!m && m.isStyleLoaded(); }", timeout=timeout)
    except Exception:
        pass


def order_problems(dump):
    """Style-dump assertion: ground, base, every other layer, labels last."""
    ids = [l["id"] for l in dump["layers"]]
    probs = []
    if ids[:2] != [S.GROUND_ID, S.BASE_ID]:
        probs.append("the style does not start with ground, base: %s" % ids[:3])
    if not ids or ids[-1] != S.LABELS_ID:
        probs.append("the labels raster is not the top layer (last is %s)" % (ids[-1] if ids else None))
    if len(ids) < 8:
        probs.append("only %d layers: the data layers were not re-added" % len(ids))
    return probs, ids


def rgb_of(css):
    nums = re.findall(r"[\d.]+", css or "")[:3]
    return [round(float(n)) for n in nums] if len(nums) == 3 else None


def structure(h, r):
    browser = h.launch()
    try:
        # ---- the light pair, order, ground from tokens
        s, page = fresh(h, browser)
        wait_style_loaded(page)
        r.check("tag-esri-light", tag(page) == "esri-light", tag(page))
        dump = page.evaluate(S.JS_STYLE_ORDER)
        r.check("map-constructed", bool(dump), "window.__maps[0]")
        if dump:
            lay = {l["id"]: l for l in dump["layers"]}
            src = dump["sources"]
            base_tiles = (src.get("basemap") or {}).get("tiles") or []
            r.check("style-light", len(base_tiles) == 1 and "Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}" in base_tiles[0]
                    and "ArcGIS/rest/services" in base_tiles[0], base_tiles)
            ref_tiles = (src.get("basemap-ref") or {}).get("tiles") or []
            r.check("style-light-labels", len(ref_tiles) == 1 and "Canvas/World_Light_Gray_Reference/" in ref_tiles[0], ref_tiles)
            r.check("attribution-in-style", "Esri" in ((src.get("basemap") or {}).get("attribution") or ""), (src.get("basemap") or {}).get("attribution"))
            base_paint = (lay.get(S.BASE_ID) or {}).get("paint", {})
            r.check("raster-tuning-set", all(k in base_paint for k in ("raster-saturation", "raster-hue-rotate", "raster-contrast", "raster-opacity")), base_paint)
            probs, ids = order_problems(dump)
            r.check("layer-order", not probs, "; ".join(probs) or ("%d layers, ground/base first, labels last" % len(ids)))
            over = page.evaluate(S.JS_OVERLAY_LAYERS) or []
            between = all(1 < i < len(ids) - 1 for i, _ in over)
            r.check("overlays-between-base-and-labels", bool(over) and between, "%d data layers; first %s, last %s" % (len(over), over[:1], over[-1:]))
            paper = page.evaluate(S.JS_PAPER_RGB)
            ground = rgb_of(str((lay.get(S.GROUND_ID) or {}).get("paint", {}).get("background-color")))
            r.check("ground-from-tokens", paper and ground and all(abs(a - b) <= 1 for a, b in zip(paper, ground)), "paper %s ground %s" % (paper, ground))
            r.check("no-css-invert", page.evaluate("() => { const c = document.querySelector('#map canvas'); const f = c ? getComputedStyle(c).filter : 'none'; "
                                                   "return f === 'none' && getComputedStyle(document.querySelector('#map')).filter === 'none'; }"),
                    "no filter on the map or its canvas")
        att = page.evaluate(S.JS_ATTRIBUTION)
        r.check("attribution-on-map", "Esri" in att, att)
        r.check("no-carto", not any("cartocdn" in host for host in s.guard.third_hosts), sorted(s.guard.third_hosts))
        r.check("no-page-errors", not s.log(page).pageerrors, s.log(page).pageerrors[:2])

        # ---- the dark pair is wired (built straight from the module, whatever the theme gate says)
        dark = page.evaluate(S.JS_DARK_STYLE)
        dsrc, dl = dark["sources"], {l["id"]: l for l in dark["layers"]}
        r.check("style-dark-wired",
                "World_Dark_Gray_Base" in dsrc["basemap"]["tiles"][0] and "World_Dark_Gray_Reference" in dsrc["basemap-ref"]["tiles"][0]
                and abs(dl["base"]["paint"].get("raster-brightness-max", 1) - 0.7) < 1e-9 and "Esri" in dsrc["basemap"]["attribution"],
                {"base": dsrc["basemap"]["tiles"], "paint": dl["base"]["paint"]})

        # ---- theme swap through the page's own data-theme (setStyle diff:false, then realise on style.load)
        page.evaluate(S.JS_SET_THEME, "dark")
        t = wait_tag(page, "esri-dark", 8000)
        r.check("theme-swap-to-dark", t is not None, "data-basemap %s after %s s" % (tag(page), t))
        wait_style_loaded(page)
        page.wait_for_timeout(500)
        d2 = page.evaluate(S.JS_STYLE_ORDER)
        if d2:
            probs2, ids2 = order_problems(d2)
            r.check("layer-order-after-swap", not probs2 and len(ids2) == len(ids) if dump else not probs2,
                    "; ".join(probs2) or ("%d layers, same as before the swap" % len(ids2)))
            r.check("swap-is-dark-pair", "World_Dark_Gray_Base" in (d2["sources"].get("basemap") or {}).get("tiles", [""])[0], d2["sources"].get("basemap"))
        page.evaluate(S.JS_SET_THEME, "light")
        t = wait_tag(page, "esri-light", 8000)
        r.check("theme-swap-back-to-light", t is not None, "data-basemap %s after %s s" % (tag(page), t))
        wait_style_loaded(page)
        page.wait_for_timeout(300)
        d3 = page.evaluate(S.JS_STYLE_ORDER)
        probs3, _ = order_problems(d3) if d3 else (["no map"], [])
        r.check("layer-order-after-swap-back", not probs3, "; ".join(probs3) or "ok")
        r.check("no-page-errors-after-swap", not s.log(page).pageerrors, s.log(page).pageerrors[:2])
        errs = [e for e in s.log(page).errors() if "basemap" in e["text"].lower() or "style" in e["text"].lower()]
        r.check("no-console-error-after-swap", not errs, errs[:2])
        s.close()

        # ---- colorScheme=dark emulated: the gate decides
        s, page = fresh(h, browser, scheme="dark")
        wait_style_loaded(page)
        scheme = page.evaluate(S.JS_GATE_SCHEME)
        gate_open = "dark" in scheme
        want = "esri-dark" if gate_open else "esri-light"
        r.check("gate-respected:%s" % ("open" if gate_open else "closed"), tag(page) == want,
                "color-scheme %r with prefers-color-scheme: dark emulated: basemap %s (want %s)" % (scheme, tag(page), want))
        if gate_open:
            att = page.evaluate(S.JS_ATTRIBUTION)
            r.check("dark-path-loads", tag(page) == "esri-dark" and "Esri" in att, "%s %s" % (tag(page), att))
        else:
            r.skip("dark-path-loads", "the theme gate is closed (theme-gate.css forces color-scheme: light, computed %r); the dark pair is wired "
                   "(style-dark-wired) and swaps in on data-theme=dark (theme-swap-to-dark), but the OS preference is deliberately ignored" % scheme)
        # a live prefers-color-scheme change while the page is open
        page.emulate_media(color_scheme="light")
        page.wait_for_timeout(300)
        page.emulate_media(color_scheme="dark")
        t = wait_tag(page, "esri-dark", 3000) if gate_open else None
        r.check("media-change-follows-gate", (t is not None) if gate_open else tag(page) == "esri-light",
                "gate %s: basemap after a live media change is %s" % ("open" if gate_open else "closed", tag(page)))
        s.close()
    finally:
        h.close_browser(browser)


def loader(h, r):
    """The map library arriving: rescue by injection, quick failure, 10 s timeout. A fresh browser per case."""
    doc_re = re.compile(r"^http://127\.0\.0\.1:%d/(index\.html)?(\?.*)?$" % h.port)
    lib_re = re.compile(r"/maplibre-gl\.js(\?.*)?$")

    def strip_tag(route, request):
        resp = route.fetch()
        body = re.sub(S.MAPLIBRE_TAG_RE, "", resp.text())
        route.fulfill(response=resp, body=body)

    # 1. the page's own tag is present: the global is there, the map starts, no fallback
    b = h.launch()
    try:
        s, page = fresh(h, b)
        n = page.evaluate("() => (window.__maps || []).length")
        r.check("loader-present-global", n == 1 and not page.locator(S.SEL["fallback"]).count(), "maps constructed: %s" % n)
        s.close()
    finally:
        h.close_browser(b)

    # 2. no tag in the page, the script answers: injected, the map starts
    b = h.launch()
    try:
        s, page = fresh(h, b, settle=False)
        page.route(doc_re, strip_tag)
        page.goto(h.base + "/", wait_until="load", timeout=60000)
        try:
            page.wait_for_function("() => (window.__maps || []).length === 1", timeout=10000)
        except Exception:
            pass
        n = page.evaluate("() => (window.__maps || []).length")
        injected = page.evaluate("() => !!document.querySelector('head script[src*=\"maplibre-gl\"]')")
        r.check("loader-injects-script", n == 1 and injected and not page.locator(S.SEL["fallback"]).count(),
                "maps %s, injected script tag %s, fallback shown %s" % (n, injected, page.locator(S.SEL["fallback"]).count()))
        r.check("loader-no-page-errors", not s.log(page).pageerrors, s.log(page).pageerrors[:2])
        s.close()
    finally:
        h.close_browser(b)

    # 3. the script request fails: the fallback shows at once
    b = h.launch()
    try:
        s, page = fresh(h, b, settle=False)
        page.route(doc_re, strip_tag)
        page.route(lib_re, lambda route, request: route.abort())
        page.goto(h.base + "/", wait_until="load", timeout=60000)
        t0 = time.time()
        try:
            page.wait_for_selector(S.SEL["fallback"], timeout=5000, state="attached")
        except Exception:
            pass
        shown = page.locator(S.SEL["fallback"]).count()
        r.check("loader-failure-shows-fallback", shown == 1, "fallback shown %s after %.1f s" % (shown, time.time() - t0))
        r.check("loader-failure-no-page-errors", not s.log(page).pageerrors, s.log(page).pageerrors[:2])
        s.close()
    finally:
        h.close_browser(b)

    # 4. the script request never answers: the fallback shows at the 10 s timeout, not before
    b = h.launch()
    try:
        s, page = fresh(h, b, settle=False)
        page.route(doc_re, strip_tag)
        page.route(lib_re, lambda route, request: None)         # left pending on purpose
        t0 = time.time()
        page.goto(h.base + "/", wait_until="domcontentloaded", timeout=60000)
        early = page.locator(S.SEL["fallback"]).count()
        try:
            page.wait_for_selector(S.SEL["fallback"], timeout=16000, state="attached")
        except Exception:
            pass
        took = time.time() - t0
        shown = page.locator(S.SEL["fallback"]).count()
        r.check("loader-timeout-shows-fallback", shown == 1 and 9.0 <= took <= 13.5 and not early,
                "fallback shown %s after %.1f s (expect about 10 s); shown before the timeout: %s" % (shown, took, bool(early)))
        r.check("loader-timeout-no-page-errors", not s.log(page).pageerrors, s.log(page).pageerrors[:2])
        try:
            page.unroute(lib_re)            # release the pending request before the context closes
            s.close()
        except Exception:
            pass
    finally:
        h.close_browser(b)


def live(h, r):
    probe = load_tool("probe_basemap")
    # ---- Esri: placeholder, bytes, CORS, picture, attribution, at every width and both default views
    for width in h.widths:
        for name, path in probe.VIEWS:
            b = h.launch()
            try:
                row = probe.measure(h, b, width, name, path, str(SHOTS))
            finally:
                h.close_browser(b)
            tid = "%s@%d" % (name, width)
            if row.get("error"):
                r.check("esri-primary:%s" % tid, False, row["error"])
                continue
            ph = probe.placeholder_report(row.get("urls", [])[:24], h.base)
            r.check("basemap-placeholder:%s" % tid, not ph["suspect_placeholder"] and ph["tiles"] >= 1,
                    "%d tiles, %d distinct bodies, %s" % (ph["tiles"], ph["distinct_bodies"], "; ".join(ph["why"]) or "no placeholder"))
            loaded = row["loaded_with_flag"]["bytes"]
            r.check("bytes-budget:%s" % tid, loaded <= BUDGET,
                    "%.1f KB at the default view (base %.1f KB, base + labels %.1f KB, budget 300 KB)" % (loaded / 1024.0, row["base_bytes"] / 1024.0, row["with_labels_bytes"] / 1024.0))
            r.check("cors:%s" % tid, not row["cors"]["missing"] and row["cors"]["tiles"] > 0, row["cors"])
            r.check("tiles-ok:%s" % tid, not row["failed"], row["failed"])
            r.check("picture-has-coastlines:%s" % tid, (row["picture"].get("ok") if row["picture"].get("checked") else True), row["picture"])
            r.check("attribution-live:%s" % tid, "Esri" in (row["map"].get("attribution") or ""), row["map"].get("attribution"))
            r.check("no-page-errors:%s" % tid, not row.get("errors"), row.get("errors"))

    # ---- failover: services.arcgisonline.com aborted
    b = h.launch()
    try:
        s, page = fresh(h, b, stub=False, settle=False)
        s.context.route(ARCGIS, lambda route, request: route.abort())
        nl = NetLog(page, s.context)
        t0 = time.time()
        page.goto(h.base + "/", wait_until="load", timeout=60000)
        took = wait_tag(page, "openfreemap", 10000)
        r.check("failover-within-10s", took is not None, "data-basemap %s; switched %s s after navigation start" % (tag(page), round(time.time() - t0, 1) if took is not None else "never"))
        wait_style_loaded(page, 12000)
        wait_quiet(nl, quiet_s=1.5, max_s=20)
        dump = page.evaluate(S.JS_STYLE_ORDER)
        if dump:
            hosts = " ".join(str(v.get("url")) + " " + " ".join(v.get("tiles") or []) for v in dump["sources"].values())
            r.check("failover-style-is-openfreemap", "openfreemap" in hosts and not any(l["id"] == S.BASE_ID for l in dump["layers"]),
                    "sources: %s" % list(dump["sources"])[:6])
            symbols = sum(1 for l in dump["layers"] if l["type"] == "symbol")
            r.check("failover-has-labels", symbols > 0, "%d symbol layers" % symbols)
            over = page.evaluate(S.JS_OVERLAY_LAYERS) or []
            r.check("failover-overlays-readded", any(i > 0 for i, _ in over) and len(over) >= 5, "%d data layers re-added on the failover style" % len(over))
        else:
            r.check("failover-style-is-openfreemap", False, "no map")
        att = page.evaluate(S.JS_ATTRIBUTION)
        r.check("failover-attribution", "OpenFreeMap" in att or "OpenStreetMap" in att, att)
        tiles = [q for q in nl.reqs.values() if "tiles.openfreemap.org" in q["url"] and q["status"] == 200]
        r.check("failover-tiles-loaded", len(tiles) > 0, "%d OpenFreeMap responses" % len(tiles))
        log = s.log(page)
        r.check("failover-no-page-errors", not log.pageerrors and not nl.pageerrors, (log.pageerrors + [str(e) for e in nl.pageerrors])[:2])
        errs = [e for e in log.errors() if "basemap" in e["text"].lower() or "uncaught" in e["text"].lower()]
        r.check("failover-no-console-errors", not errs, errs[:2])
        infos = [m for m in log.console if "switching to OpenFreeMap" in m["text"]]
        r.check("failover-logged-once", len(infos) == 1, "%d log lines" % len(infos))
        SHOTS.mkdir(parents=True, exist_ok=True)
        shot = SHOTS / "failover-europe.png"
        page.add_style_tag(content=".region-marker,.bio-label{visibility:hidden!important}")
        page.locator("#map").scroll_into_view_if_needed()
        page.wait_for_timeout(400)
        page.locator("#map").screenshot(path=str(shot))
        pic = probe.picture_report(shot)
        r.check("failover-picture", pic.get("ok", True), pic)
        s.close()
    finally:
        h.close_browser(b)


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    if h.browser_name != "chromium":
        r.skip("mapbase", "the basemap suite needs Chromium (CDP network log, WebGL flags)")
        return r.out
    structure(h, r)
    loader(h, r)
    if h.offline:
        r.skip("live", "offline run: Esri and OpenFreeMap are stubbed, so placeholder, bytes, CORS and failover are not measured")
    else:
        live(h, r)
    r.check("no-formsubmit", not h.formsubmit_attempts(), h.formsubmit_attempts()[:2])
    return r.out
