"""test_map_compare: layer swipe / fade compare and the "Then and later" pairs (MC-MAP-COMPARE, decision D14).

Deterministic: every third-party request is answered here (a 1x1 PNG with CORS), so nothing depends on a tile provider. The GeoJSON
files are the site's own. Run at 1280 (swipe) and 390 (fade); the widths come from the harness.

  control    the control sits in a shadow root on #map-ext-slot (the slot keeps no element children), a closed <details> with a 44px
             summary; "Then and later" buttons are exactly the registry's trajectoryPair pairs and none is offered for any other layer;
             the pickers offer raster, WMS and GeoJSON surfaces only; Compare is disabled until two different layers are chosen
  swipe      (1280) a Koppen pair gives two canvases; the second map is aria-hidden and inert; the divider is a role=slider with
             aria-valuetext naming both layers; arrow keys move it 5 percent and the clip-path follows; Home and End; cameras follow
             each other both ways; the first map shows only the left layer and the second the right one; region markers stay above
             the second map; Exit and Escape (but not while an overlay is open) return to one canvas and release the WebGL context;
             the visitor's own layers return; a river-flood raster pair works; a picker pair works and leaves state untouched; a
             change of layers in the panel ends the comparison; a continent switch reloads both sides; crossing 900px swaps to fade
  fade       (390) a Koppen pair is one canvas with a "Fade between" slider; the slider changes the opacity of layer B (and A) in the
             style; B is drawn over A; leaving restores the opacities and the layer order
  both       the comparison is not in the URL; the divider and the fade never animate; the text of the compare UI passes the framework
             discipline scan (it sits in a shadow root the page-wide scan cannot see); no console error; nothing is submitted
Test ids: control:*, swipe:*, fade:*, breakpoint:*, discipline:*, clean:*, harness (no-formsubmit).
"""
import re

from lib import sel as _sel
from lib.site import FORMSUBMIT_RE, PNG_1X1, default_storage, goto_settled
from lib.util import load_tool

NAME = "test_map_compare"
S = _sel.load("compare_map")
SEL = S.SEL

THIRD_PARTY = re.compile(r"^https?://(?!(127\.0\.0\.1|localhost)(:|/|$))")
KOPPEN = ("koppen-now", "koppen-2041-2070")
FLOOD = ("river-flood-current", "river-flood-2050-rcp45")


# ------------------------------------------------------------------------------------------------------------- plumbing
def fresh(h, browser, width, reduced_motion=True):
    s = h.session(browser, width=width, storage=default_storage(h.site), stub=True, reduced_motion=reduced_motion)

    def tiles(route, request):
        if FORMSUBMIT_RE.match(request.url):
            route.fallback()                                   # the context's guard records and aborts it
        else:
            route.fulfill(status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"})

    s.context.route(THIRD_PARTY, tiles)
    page = s.page()
    log = s.log(page)
    goto_settled(page, h.base + "/", extra_ms=300)
    page.wait_for_function(
        "() => { const s = document.getElementById('map-ext-slot'); return !!(s && s.shadowRoot && s.shadowRoot.querySelector('details.mc')); }",
        timeout=25000)
    page.locator(SEL["stage"]).scroll_into_view_if_needed()
    return s, page, log


def open_control(page, width):
    """Open the narrow disclosure (below 900px the panel is collapsed under the map) and the control's own <details>."""
    if page.get_attribute("#layers-toggle", "aria-expanded") == "false":
        page.click("#layers-toggle")
        page.wait_for_timeout(200)
    if not page.evaluate("() => document.getElementById('map-ext-slot').shadowRoot.querySelector('details.mc').open"):
        page.locator(SEL["summary"]).click()
        page.wait_for_timeout(150)


def ctrl(page):
    return page.evaluate(S.JS_CONTROL)


def st(page):
    return page.evaluate(S.JS_STATE)


def settle(page, ms=1500):
    page.wait_for_timeout(ms)


def pair_button(page, then_id):
    return page.locator('%s[data-then="%s"]' % (SEL["pair"], then_id)).first


def start_pair(page, ids, width):
    open_control(page, width)
    page.locator('%s[data-then="%s"][data-later="%s"]' % (SEL["pair"], ids[0], ids[1])).click()
    settle(page)


def exit_via_button(page):
    page.locator(SEL["stage_exit"]).click()
    page.wait_for_timeout(500)


def clip_percent(state):
    m = re.search(r"inset\(0px 0px 0px (-?[\d.]+)%\)", (state["top"] or {}).get("clip") or "")
    return float(m.group(1)) if m else None


def close(a, b, eps=1e-6):
    return abs(a - b) <= eps


def discipline(r, tag, page, where):
    """The framework-discipline scan over what the compare UI says: no score, rank, weight, total, 'best', star glyph, sort control."""
    D = load_tool("discipline")
    items = page.evaluate(S.JS_TEXTS)
    for it in items:
        it["where"] = where
    rep = D.scan(items)
    r.check("discipline:compare-ui-says-nothing-banned" + tag, D.is_clean(rep) and len(items) >= 4, {k: rep[k] for k in ("bad", "glyphs", "emails", "contact", "sort_controls")} if not D.is_clean(rep) else "%d items" % len(items))


def clean(r, tag, log):
    errs = [e for e in log.errors() if not str(e.get("text", "")).startswith("Failed to load resource")]
    errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("clean:no-console-errors" + tag, not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


# ----------------------------------------------------------------------------------------------------------------- run
def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            s, page, log = fresh(h, browser, width)
            try:
                reg = page.evaluate(S.JS_REGISTRY)
                before_order = page.evaluate(S.JS_ORDER)
                before_on = sorted(page.evaluate(S.JS_STATE_LAYERS))          # state keys, extension layers included
                before_vis = sorted(page.evaluate(S.JS_VISIBLE, 0))          # the registry layers the first map draws
                before_pressed = page.evaluate(S.JS_LAYER_PRESS, "hillshade")
                url0 = page.url

                # ============================================================================== the control
                c = ctrl(page)
                r.check("control:in-a-shadow-root-and-the-slot-has-no-element-children" + tag, c["shadow"] and c["kids"] == 0 and c["attr"], c)
                r.check("control:the-slot-shows-although-its-content-is-in-the-shadow" + tag, c["display"] != "none", c["display"])
                open_control(page, width)
                c = ctrl(page)
                r.check("control:details-closed-by-default-then-opens" + tag, c["details"] and c["open"] is True and c["state"] == "idle", c)
                r.check("control:summary-is-44px" + tag, (c["summaryH"] or 0) >= 44, c["summaryH"])
                offered = sorted((p["then"], p["later"]) for p in c["pairs"])
                want = sorted((p["then"], p["later"]) for p in reg["pairs"])
                r.check("control:then-and-later-pairs-are-exactly-the-registry's" + tag, offered == want and len(want) >= 3, {"offered": offered, "registry": want})
                allowed = set(reg["withPair"]) | {p["later"] for p in reg["pairs"]}
                stray = [p for p in c["pairs"] if p["then"] not in reg["withPair"] or p["later"] not in allowed]
                r.check("control:no-pair-for-a-layer-without-a-counterpart-epoch" + tag, not stray, stray)
                r.check("control:pair-buttons-are-44px-and-name-both-layers" + tag,
                        all(p["h"] >= 44 and p["label"] and "left" in p["label"] and "right" in p["label"] for p in c["pairs"]), [(p["then"], p["h"]) for p in c["pairs"]][:4])
                no_pair = [i for i in reg["ids"] if i not in reg["withPair"] and i not in {p["later"] for p in reg["pairs"]}]
                r.check("control:layers-without-a-counterpart-exist-and-have-no-button" + tag, "precipitation" in no_pair and not any(p["then"] == "precipitation" or p["later"] == "precipitation" for p in c["pairs"]), no_pair[:6])
                surfaces = sorted(i for i in reg["ids"] if reg["kinds"][i] in ("raster", "wms", "geojson"))
                left = next(p for p in c["picks"] if p["side"] == "left")
                right = next(p for p in c["picks"] if p["side"] == "right")
                r.check("control:pickers-offer-raster-wms-and-geojson-surfaces-only" + tag, sorted(left["options"]) == surfaces and sorted(right["options"]) == surfaces, {"left": sorted(left["options"]), "surfaces": surfaces})
                r.check("control:pickers-are-44px" + tag, left["h"] >= 44 and right["h"] >= 44, (left["h"], right["h"]))
                r.check("control:compare-disabled-until-two-layers" + tag, c["go"]["disabled"] is True and c["go"]["h"] >= 44, c["go"])
                page.select_option(SEL["pick_left"], "precipitation")
                page.select_option(SEL["pick_right"], "precipitation")
                c = ctrl(page)
                r.check("control:the-same-layer-twice-stays-disabled-and-says-why" + tag, c["go"]["disabled"] is True and "two different" in (c["msg"] or ""), (c["go"], c["msg"]))
                page.select_option(SEL["pick_right"], "soil-carbon")
                c = ctrl(page)
                r.check("control:two-different-layers-enable-compare" + tag, c["go"]["disabled"] is False and not c["msg"], (c["go"], c["msg"]))
                page.select_option(SEL["pick_left"], "")
                page.select_option(SEL["pick_right"], "")

                if width >= 900:
                    # ========================================================================== swipe: a Koppen pair
                    start_pair(page, KOPPEN, width)
                    t = st(page)
                    c = ctrl(page)
                    r.check("swipe:a-koppen-pair-gives-two-canvases" + tag, t["canvases"] == 2 and t["maps"] == 2, (t["canvases"], t["maps"]))
                    r.check("swipe:the-control-is-active-in-swipe-mode" + tag, c["state"] == "active" and c["mode"] == "swipe" and c["exitHidden"] is False, (c["state"], c["mode"]))
                    r.check("swipe:the-second-map-is-aria-hidden-and-inert" + tag, t["top"] and t["top"]["ariaHidden"] == "true" and t["top"]["inert"] and t["top"]["pointerEvents"] == "none" and t["top"]["inStage"], t["top"])
                    r.check("swipe:the-second-map-is-ready-and-clipped-at-the-middle" + tag, t["top"]["ready"] == "true" and clip_percent(t) == 50, t["top"])
                    d = t["divider"]
                    r.check("swipe:divider-is-a-slider-with-range-and-focus" + tag, d and d["role"] == "slider" and d["min"] == "0" and d["max"] == "100" and d["now"] == "50" and d["tabindex"] == "0" and d["focused"], d)
                    r.check("swipe:valuetext-names-both-layers" + tag, d and "showing" in d["text"] and "on the left" in d["text"] and "on the right" in d["text"] and "1991-2020" in d["text"] and "2041-2070" in d["text"], d and d["text"])
                    r.check("swipe:divider-has-a-name-and-a-44px-grip" + tag, d and d["label"] and d["grip"]["w"] >= 44 and d["grip"]["h"] >= 44, d and (d["label"], d["grip"]))
                    r.check("swipe:the-comparison-is-not-in-the-url" + tag, t["url"] == url0 and page.url == url0, (url0, t["url"]))
                    r.check("swipe:nothing-animates-under-reduced-motion" + tag, d["transition"] in ("0s", "0s, 0s") and t["top"]["transition"] in ("0s", "0s, 0s"), (d["transition"], t["top"]["transition"]))
                    first = sorted(page.evaluate(S.JS_VISIBLE, 0))
                    second = sorted(page.evaluate(S.JS_VISIBLE, 1))
                    r.check("swipe:first-map-shows-only-the-left-layer" + tag, first == [KOPPEN[0]], first)
                    r.check("swipe:second-map-shows-only-the-right-layer" + tag, second == [KOPPEN[1]], second)
                    page.wait_for_function("() => window.__maps[window.__maps.length - 1].querySourceFeatures('koppen-2041-2070').length > 0 && window.__maps[0].querySourceFeatures('koppen-now').length > 0", timeout=15000)
                    r.check("swipe:both-sides-loaded-their-own-file" + tag, True, "features present in both sources")
                    r.check("swipe:the-koppen-fill-uses-the-legend-colours-on-the-second-map" + tag,
                            isinstance(page.evaluate(S.JS_PAINT, [1, KOPPEN[1], "fill-color"]), list), page.evaluate(S.JS_PAINT, [1, KOPPEN[1], "fill-color"]))
                    sides = c["sides"]
                    r.check("swipe:each-side-prints-its-source-line-and-a-colour-key" + tag,
                            len(sides) == 2 and all(x["src"] and "·" in x["src"] and x["swatches"] > 3 for x in sides), sides)
                    r.check("swipe:sides-are-left-then-right" + tag, [x["side"] for x in sides] == ["left", "right"] and sides[0]["id"] == KOPPEN[0] and sides[1]["id"] == KOPPEN[1], sides)
                    r.check("swipe:the-key-card-names-both-and-offers-a-44px-exit" + tag, t["key"] and "Left" in t["key"]["text"] and "Right" in t["key"]["text"] and t["exit"]["h"] >= 44 and t["exit"]["w"] >= 44, t["key"])

                    discipline(r, tag, page, "compare:swipe")

                    # ---------------------------------------------------------------- the divider by keyboard
                    page.focus(SEL["divider"])
                    page.keyboard.press("ArrowLeft")
                    t1 = st(page)
                    r.check("swipe:arrow-left-moves-the-divider-5-and-the-clip" + tag, t1["divider"]["now"] == "45" and clip_percent(t1) == 45 and t1["divider"]["left"] == "45%", (t1["divider"]["now"], clip_percent(t1)))
                    page.keyboard.press("ArrowRight")
                    page.keyboard.press("ArrowRight")
                    t2 = st(page)
                    r.check("swipe:arrow-right-moves-it-back-and-on" + tag, t2["divider"]["now"] == "55" and clip_percent(t2) == 55, (t2["divider"]["now"], clip_percent(t2)))
                    page.keyboard.press("Home")
                    t3 = st(page)
                    r.check("swipe:home-goes-to-the-left-end-and-says-only-the-right-layer" + tag, t3["divider"]["now"] == "0" and clip_percent(t3) == 0 and "only" in t3["divider"]["text"] and "2041-2070" in t3["divider"]["text"], (t3["divider"]["now"], t3["divider"]["text"]))
                    page.keyboard.press("End")
                    t4 = st(page)
                    r.check("swipe:end-goes-to-the-right-end-and-says-only-the-left-layer" + tag, t4["divider"]["now"] == "100" and clip_percent(t4) == 100 and "only" in t4["divider"]["text"] and "1991-2020" in t4["divider"]["text"], (t4["divider"]["now"], t4["divider"]["text"]))
                    page.keyboard.press("ArrowRight")
                    r.check("swipe:the-divider-stops-at-the-ends" + tag, st(page)["divider"]["now"] == "100", st(page)["divider"]["now"])
                    page.keyboard.press("Home")
                    for _ in range(10):
                        page.keyboard.press("ArrowRight")
                    r.check("swipe:ten-presses-make-50" + tag, st(page)["divider"]["now"] == "50", st(page)["divider"]["now"])
                    box = page.locator(SEL["stage"]).bounding_box()
                    grip = st(page)["divider"]["grip"]
                    page.mouse.move(grip["l"] + grip["w"] / 2, grip["t"] + grip["h"] / 2)
                    page.mouse.down()
                    page.mouse.move(box["x"] + box["width"] * 0.3, grip["t"] + grip["h"] / 2, steps=4)
                    page.mouse.up()
                    r.check("swipe:a-pointer-drags-the-divider" + tag, abs(int(st(page)["divider"]["now"]) - 30) <= 2, st(page)["divider"]["now"])
                    page.focus(SEL["divider"])
                    page.keyboard.press("End")
                    page.keyboard.press("Home")
                    for _ in range(10):
                        page.keyboard.press("ArrowRight")

                    # ---------------------------------------------------------------- cameras, both ways
                    page.evaluate(S.JS_JUMP, [0, 9.5, 47.2, 5.1])
                    page.wait_for_timeout(300)
                    c0, c1 = page.evaluate(S.JS_CAMERA, 0), page.evaluate(S.JS_CAMERA, 1)
                    r.check("swipe:moving-the-first-map-moves-the-second" + tag, close(c0["lng"], c1["lng"], 1e-6) and close(c0["lat"], c1["lat"], 1e-6) and close(c0["zoom"], c1["zoom"], 1e-6) and close(c0["lng"], 9.5, 1e-3), (c0, c1))
                    page.evaluate(S.JS_JUMP, [1, -4.0, 41.0, 4.2])
                    page.wait_for_timeout(300)
                    c0, c1 = page.evaluate(S.JS_CAMERA, 0), page.evaluate(S.JS_CAMERA, 1)
                    r.check("swipe:moving-the-second-map-moves-the-first" + tag, close(c0["lng"], c1["lng"], 1e-6) and close(c0["lat"], c1["lat"], 1e-6) and close(c0["zoom"], c1["zoom"], 1e-6) and close(c0["lng"], -4.0, 1e-3), (c0, c1))
                    page.mouse.move(box["x"] + box["width"] * 0.3, box["y"] + box["height"] * 0.75)
                    page.mouse.wheel(0, -300)
                    page.wait_for_timeout(900)
                    c0, c1 = page.evaluate(S.JS_CAMERA, 0), page.evaluate(S.JS_CAMERA, 1)
                    r.check("swipe:a-real-wheel-zoom-on-the-map-moves-both" + tag, close(c0["zoom"], c1["zoom"], 1e-6) and c0["zoom"] > 4.2, (c0["zoom"], c1["zoom"]))
                    page.evaluate(S.JS_JUMP, [0, 9.5, 49.0, 4.0])
                    page.wait_for_timeout(500)

                    # ---------------------------------------------------------------- markers stay live above the second map
                    mk = page.evaluate(S.JS_MARKER_ON_TOP)
                    r.check("swipe:region-markers-sit-above-the-second-map" + tag, mk and mk["right"] >= 1 and mk["rightOnTop"] == mk["right"] and mk["leftOnTop"] == mk["left"], mk)

                    # ---------------------------------------------------------------- exit by the button
                    page.evaluate(S.JS_KEEP_SECOND)
                    exit_via_button(page)
                    t = st(page)
                    c = ctrl(page)
                    r.check("swipe:exit-returns-to-one-canvas" + tag, t["canvases"] == 1 and t["top"] is None and t["divider"] is None and not t["stageOn"] and t["key"] is None, (t["canvases"], t["top"], t["divider"]))
                    lost = page.evaluate(S.JS_SECOND_LOST)
                    r.check("swipe:exit-releases-the-second-maps-webgl-context" + tag, lost and lost["lost"] is True and lost["connected"] is False, lost)
                    r.check("swipe:the-control-is-idle-again" + tag, c["state"] == "idle" and c["exitHidden"] is True and not c["sides"], (c["state"], c["exitHidden"]))
                    r.check("swipe:the-visitors-layers-are-back-on-the-first-map" + tag, sorted(page.evaluate(S.JS_VISIBLE, 0)) == before_vis, (page.evaluate(S.JS_VISIBLE, 0), before_vis))
                    r.check("swipe:state-was-never-touched" + tag, sorted(page.evaluate(S.JS_STATE_LAYERS)) == before_on and page.evaluate(S.JS_LAYER_PRESS, "hillshade") == before_pressed, page.evaluate(S.JS_STATE_LAYERS))
                    r.check("swipe:the-layer-order-is-unchanged" + tag, page.evaluate(S.JS_ORDER) == before_order, "")
                    r.check("swipe:focus-goes-back-to-the-button-that-started-it" + tag, "mc-pair" in (c["activeInShadow"] or ""), c["activeInShadow"])

                    # ---------------------------------------------------------------- Escape, and Escape under an overlay
                    start_pair(page, KOPPEN, width)
                    page.evaluate("() => document.body.classList.add('overlay-open')")
                    page.focus(SEL["divider"])
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(300)
                    r.check("swipe:escape-is-left-to-an-open-overlay" + tag, st(page)["canvases"] == 2, st(page)["canvases"])
                    page.evaluate("() => document.body.classList.remove('overlay-open')")
                    page.focus(SEL["divider"])
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(500)
                    r.check("swipe:escape-exits-the-comparison" + tag, st(page)["canvases"] == 1 and st(page)["top"] is None, st(page)["canvases"])
                    r.check("swipe:escape-puts-the-layers-back" + tag, sorted(page.evaluate(S.JS_VISIBLE, 0)) == before_vis, page.evaluate(S.JS_VISIBLE, 0))

                    # ---------------------------------------------------------------- repeated use leaks no maps
                    for _ in range(3):
                        start_pair(page, KOPPEN, width)
                        page.evaluate(S.JS_KEEP_SECOND)
                        exit_via_button(page)
                    t = st(page)
                    r.check("swipe:three-rounds-leave-one-live-canvas" + tag, t["canvases"] == 1, t["canvases"])
                    r.check("swipe:every-second-map-lost-its-context" + tag, page.evaluate(S.JS_SECOND_LOST)["lost"] is True, "")

                    # ---------------------------------------------------------------- a river-flood raster pair
                    start_pair(page, FLOOD, width)
                    t = st(page)
                    r.check("swipe:a-river-flood-pair-gives-two-canvases" + tag, t["canvases"] == 2 and t["top"]["ready"] == "true", (t["canvases"], t["top"]))
                    r.check("swipe:flood-first-map-shows-the-historical-layer" + tag, page.evaluate(S.JS_VISIBLE, 0) == [FLOOD[0]], page.evaluate(S.JS_VISIBLE, 0))
                    r.check("swipe:flood-second-map-shows-the-2050-layer" + tag, page.evaluate(S.JS_VISIBLE, 1) == [FLOOD[1]], page.evaluate(S.JS_VISIBLE, 1))
                    r.check("swipe:flood-raster-keeps-the-stacking-cap" + tag, abs(page.evaluate(S.JS_PAINT, [1, FLOOD[1], "raster-opacity"]) - 0.66) < 1e-9, page.evaluate(S.JS_PAINT, [1, FLOOD[1], "raster-opacity"]))
                    c = ctrl(page)
                    r.check("swipe:flood-sides-carry-source-lines-with-the-vintage" + tag, len(c["sides"]) == 2 and all("·" in (x["src"] or "") for x in c["sides"]) and "2050" in c["sides"][1]["head"], c["sides"])
                    r.check("swipe:the-current-pair-is-marked" + tag, [p["later"] for p in c["pairs"] if p["current"] == "true"] == [FLOOD[1]], c["pairs"])
                    # switching pair without leaving
                    page.locator('%s[data-later="river-flood-2050-rcp85"]' % SEL["pair"]).click()
                    settle(page, 1200)
                    t = st(page)
                    r.check("swipe:another-pair-swaps-the-second-layer-without-a-third-canvas" + tag, t["canvases"] == 2 and page.evaluate(S.JS_VISIBLE, 1) == ["river-flood-2050-rcp85"] and page.evaluate(S.JS_VISIBLE, 0) == [FLOOD[0]], (t["canvases"], page.evaluate(S.JS_VISIBLE, 1)))
                    # a continent switch while comparing
                    page.locator('%s[data-continent="north-america"]' % SEL["tab"]).click()
                    page.wait_for_timeout(2500)
                    c0, c1 = page.evaluate(S.JS_CAMERA, 0), page.evaluate(S.JS_CAMERA, 1)
                    r.check("swipe:a-continent-switch-keeps-both-maps-together" + tag, close(c0["lng"], c1["lng"], 1e-6) and close(c0["zoom"], c1["zoom"], 1e-6) and c0["lng"] < -20 and st(page)["canvases"] == 2, (c0, c1))
                    exit_via_button(page)
                    page.locator('%s[data-continent="europe"]' % SEL["tab"]).click()
                    page.wait_for_timeout(1500)

                    # ---------------------------------------------------------------- Koppen across a continent switch
                    start_pair(page, KOPPEN, width)
                    page.locator('%s[data-continent="north-america"]' % SEL["tab"]).click()
                    page.wait_for_function(
                        "() => window.__maps[window.__maps.length - 1].querySourceFeatures('koppen-2041-2070').length > 0 && window.__maps[0].querySourceFeatures('koppen-now').length > 0", timeout=20000)
                    r.check("swipe:a-continent-switch-reloads-both-koppen-files" + tag, True, "features present on both maps after the switch")
                    exit_via_button(page)
                    page.locator('%s[data-continent="europe"]' % SEL["tab"]).click()
                    page.wait_for_timeout(1200)

                    # ---------------------------------------------------------------- the pickers
                    open_control(page, width)
                    page.select_option(SEL["pick_left"], "precipitation")
                    page.select_option(SEL["pick_right"], "soil-carbon")
                    page.locator(SEL["go"]).click()
                    settle(page, 1200)
                    t = st(page)
                    c = ctrl(page)
                    r.check("swipe:two-picked-layers-compare" + tag, t["canvases"] == 2 and page.evaluate(S.JS_VISIBLE, 0) == ["precipitation"] and page.evaluate(S.JS_VISIBLE, 1) == ["soil-carbon"], (t["canvases"], page.evaluate(S.JS_VISIBLE, 0)))
                    r.check("swipe:a-picked-pair-needs-no-counterpart-epoch" + tag, c["state"] == "active" and [p for p in c["pairs"] if p["current"] == "true"] == [], c["pairs"])
                    r.check("swipe:state-untouched-while-comparing" + tag, sorted(page.evaluate(S.JS_STATE_LAYERS)) == before_on and page.evaluate(S.JS_LAYER_PRESS, "hillshade") == before_pressed, page.evaluate(S.JS_STATE_LAYERS))
                    page.locator(SEL["exit_panel"]).click()
                    page.wait_for_timeout(400)
                    r.check("swipe:the-panels-own-exit-button-works" + tag, st(page)["canvases"] == 1, st(page)["canvases"])

                    # ---------------------------------------------------------------- a change of layers ends it
                    start_pair(page, KOPPEN, width)
                    page.evaluate("() => { const b = document.querySelector('#map-toggles button.map-toggle[data-layer-id=\"topo\"]'); b.click(); }")
                    page.wait_for_timeout(500)
                    t = st(page)
                    now_on = sorted(page.evaluate(S.JS_STATE_LAYERS))
                    r.check("swipe:switching-a-layer-in-the-panel-ends-the-comparison" + tag, t["canvases"] == 1 and "topo" in now_on, (t["canvases"], now_on))
                    r.check("swipe:and-the-visitors-choice-stands" + tag, sorted(page.evaluate(S.JS_VISIBLE, 0)) == sorted(i for i in now_on if i in reg["ids"]), (page.evaluate(S.JS_VISIBLE, 0), now_on))
                    page.evaluate("() => { const b = document.querySelector('#map-toggles button.map-toggle[data-layer-id=\"topo\"]'); b.click(); }")
                    page.wait_for_timeout(300)

                    # ---------------------------------------------------------------- crossing 900px swaps swipe for fade and back
                    start_pair(page, KOPPEN, width)
                    page.set_viewport_size({"width": 700, "height": 900})
                    page.wait_for_timeout(1200)
                    t = st(page)
                    c = ctrl(page)
                    r.check("breakpoint:below-900-the-swipe-becomes-a-fade" + tag, t["canvases"] == 1 and t["fade"] is not None and t["divider"] is None and c["mode"] == "fade", (t["canvases"], t["fade"], c["mode"]))
                    page.set_viewport_size({"width": 1280, "height": 900})
                    page.wait_for_timeout(1500)
                    t = st(page)
                    c = ctrl(page)
                    r.check("breakpoint:back-above-900-it-is-a-swipe-again" + tag, t["canvases"] == 2 and t["divider"] is not None and t["fade"] is None and c["mode"] == "swipe", (t["canvases"], c["mode"]))
                    page.set_viewport_size({"width": 1280, "height": 900})
                    exit_via_button(page)
                    r.check("breakpoint:no-map-is-left-behind" + tag, st(page)["canvases"] == 1, st(page)["canvases"])
                else:
                    # ========================================================================== fade: a Koppen pair
                    order0 = page.evaluate(S.JS_ORDER)
                    base_a = page.evaluate(S.JS_PAINT, [0, KOPPEN[0], "fill-opacity"])
                    base_b = page.evaluate(S.JS_PAINT, [0, KOPPEN[1], "fill-opacity"])
                    start_pair(page, KOPPEN, width)
                    t = st(page)
                    c = ctrl(page)
                    r.check("fade:a-koppen-pair-is-one-canvas-with-a-slider" + tag, t["canvases"] == 1 and t["maps"] == 1 and t["fade"] is not None and t["divider"] is None and t["top"] is None, (t["canvases"], t["maps"], t["fade"]))
                    r.check("fade:the-control-is-active-in-fade-mode" + tag, c["state"] == "active" and c["mode"] == "fade", (c["state"], c["mode"]))
                    f = t["fade"]
                    r.check("fade:slider-is-labelled-and-44px" + tag, f and f["label"] == "Fade between" and f["h"] >= 44 and f["min"] == "0" and f["max"] == "100" and f["value"] == "50", f)
                    r.check("fade:valuetext-names-both-layers" + tag, f and "percent" in f["text"] and "1991-2020" in f["text"] and "2041-2070" in f["text"], f and f["text"])
                    r.check("fade:the-exit-is-44px" + tag, t["exit"]["h"] >= 44 and t["exit"]["w"] >= 44, t["exit"])
                    r.check("fade:the-comparison-is-not-in-the-url" + tag, page.url == url0, page.url)
                    vis = sorted(page.evaluate(S.JS_VISIBLE, 0))
                    r.check("fade:the-map-shows-both-layers-and-nothing-else" + tag, vis == sorted(KOPPEN), vis)
                    order = page.evaluate(S.JS_ORDER)
                    r.check("fade:layer-b-is-drawn-over-layer-a" + tag, order.index(KOPPEN[1]) > order.index(KOPPEN[0]), order)
                    pa = page.evaluate(S.JS_PAINT, [0, KOPPEN[0], "fill-opacity"])
                    pb = page.evaluate(S.JS_PAINT, [0, KOPPEN[1], "fill-opacity"])
                    r.check("fade:at-50-both-layers-are-half-of-their-own-opacity" + tag, close(pa, base_a * 0.5, 1e-9) and close(pb, base_b * 0.5, 1e-9), (pa, pb, base_a, base_b))
                    discipline(r, tag, page, "compare:fade")
                    # the style dump: layer B's opacity follows the slider
                    seen = {}
                    for v in (0, 20, 75, 100):
                        page.locator(SEL["fade"]).fill(str(v))
                        page.wait_for_timeout(120)
                        seen[v] = (page.evaluate(S.JS_PAINT, [0, KOPPEN[1], "fill-opacity"]), page.evaluate(S.JS_PAINT, [0, KOPPEN[0], "fill-opacity"]), st(page)["fade"]["text"])
                    r.check("fade:the-slider-changes-the-opacity-of-layer-b-in-the-style" + tag,
                            all(close(seen[v][0], base_b * v / 100, 1e-9) for v in seen) and len({seen[v][0] for v in seen}) == 4, seen)
                    r.check("fade:and-layer-a-fades-the-other-way" + tag, all(close(seen[v][1], base_a * (100 - v) / 100, 1e-9) for v in seen), seen)
                    r.check("fade:valuetext-follows-the-slider" + tag, "20 percent" in seen[20][2] and "80 percent" in seen[20][2], seen[20][2])
                    page.locator(SEL["fade"]).fill("40")
                    page.focus(SEL["fade"])
                    page.keyboard.press("ArrowRight")
                    page.wait_for_timeout(100)
                    r.check("fade:keyboard-moves-the-slider-and-the-style" + tag, st(page)["fade"]["value"] == "41" and close(page.evaluate(S.JS_PAINT, [0, KOPPEN[1], "fill-opacity"]), base_b * 0.41, 1e-9), st(page)["fade"]["value"])
                    page.wait_for_function("() => window.__maps[0].querySourceFeatures('koppen-2041-2070').length > 0 && window.__maps[0].querySourceFeatures('koppen-now').length > 0", timeout=15000)
                    r.check("fade:both-files-loaded-on-the-one-map" + tag, True, "features present for both layers")
                    sides = ctrl(page)["sides"]
                    r.check("fade:each-side-prints-its-source-line" + tag, len(sides) == 2 and all(x["src"] and "·" in x["src"] for x in sides), sides)
                    # leaving
                    exit_via_button(page)
                    t = st(page)
                    r.check("fade:exit-removes-the-slider" + tag, t["fade"] is None and t["key"] is None and not t["stageOn"], t["fade"])
                    r.check("fade:exit-restores-the-opacities" + tag, close(page.evaluate(S.JS_PAINT, [0, KOPPEN[0], "fill-opacity"]), base_a, 1e-9) and close(page.evaluate(S.JS_PAINT, [0, KOPPEN[1], "fill-opacity"]), base_b, 1e-9), "")
                    r.check("fade:exit-restores-the-layer-order" + tag, page.evaluate(S.JS_ORDER) == order0, "")
                    r.check("fade:exit-restores-the-visitors-layers" + tag, sorted(page.evaluate(S.JS_VISIBLE, 0)) == before_vis and sorted(page.evaluate(S.JS_STATE_LAYERS)) == before_on, page.evaluate(S.JS_VISIBLE, 0))

                    # ---------------------------------------------------------------- a raster pair
                    fb = page.evaluate(S.JS_PAINT, [0, FLOOD[1], "raster-opacity"])
                    start_pair(page, FLOOD, width)
                    page.locator(SEL["fade"]).fill("30")
                    page.wait_for_timeout(150)
                    r.check("fade:a-flood-pair-fades-the-raster-opacity" + tag, close(page.evaluate(S.JS_PAINT, [0, FLOOD[1], "raster-opacity"]), fb * 0.3, 1e-9) and st(page)["canvases"] == 1, (fb, page.evaluate(S.JS_PAINT, [0, FLOOD[1], "raster-opacity"])))
                    page.focus(SEL["fade"])
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(400)
                    r.check("fade:escape-exits" + tag, st(page)["fade"] is None and close(page.evaluate(S.JS_PAINT, [0, FLOOD[1], "raster-opacity"]), fb, 1e-9), "")
                    r.check("fade:the-order-is-back-after-a-raster-pair" + tag, page.evaluate(S.JS_ORDER) == order0, "")

                    # ---------------------------------------------------------------- the pickers
                    open_control(page, width)
                    page.select_option(SEL["pick_left"], "soil-carbon")
                    page.select_option(SEL["pick_right"], "precipitation")
                    page.locator(SEL["go"]).click()
                    settle(page, 800)
                    r.check("fade:two-picked-layers-fade" + tag, st(page)["fade"] is not None and sorted(page.evaluate(S.JS_VISIBLE, 0)) == ["precipitation", "soil-carbon"], page.evaluate(S.JS_VISIBLE, 0))
                    page.locator(SEL["stage_exit"]).click()
                    page.wait_for_timeout(300)
                    r.check("fade:picked-pair-exits-cleanly" + tag, sorted(page.evaluate(S.JS_VISIBLE, 0)) == before_vis and page.evaluate(S.JS_ORDER) == order0, "")
                    open_control(page, width)
                    page.locator('%s[data-then="koppen-now"]' % SEL["pair"]).click()
                    settle(page, 600)
                    page.set_viewport_size({"width": 1280, "height": 900})
                    page.wait_for_timeout(1500)
                    t = st(page)
                    r.check("breakpoint:above-900-the-fade-becomes-a-swipe" + tag, t["canvases"] == 2 and t["divider"] is not None and t["fade"] is None, (t["canvases"], t["divider"] is not None))
                    exit_via_button(page)
                    r.check("breakpoint:exit-leaves-one-canvas" + tag, st(page)["canvases"] == 1, st(page)["canvases"])
                    page.set_viewport_size({"width": width, "height": 844})

                clean(r, tag, log)
            finally:
                s.close()

            # ====================================================== motion preference off: the divider still never animates
            if width >= 900:
                s2, page2, log2 = fresh(h, browser, width, reduced_motion=False)
                try:
                    start_pair(page2, KOPPEN, width)
                    t = st(page2)
                    r.check("swipe:the-divider-never-animates-even-with-motion-allowed" + tag, t["divider"]["transition"] in ("0s", "0s, 0s") and t["top"]["transition"] in ("0s", "0s, 0s"), (t["divider"]["transition"], t["top"]["transition"]))
                    exit_via_button(page2)
                    clean(r, tag + ":motion-allowed", log2)
                finally:
                    s2.close()
        finally:
            h.close_browser(browser)
    return r.out
