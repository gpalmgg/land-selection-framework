"""test_mapui: the map plate, the layer panel, the legend, the markers and the continent fit (MC-MAP-UI, design 8.6).

Deterministic: every third-party request is stubbed (Esri tiles answer a 1x1 PNG so the primary basemap stays), so nothing
depends on a tile provider. Run at 1280 and 390 (the harness widths).

  plate        figure.map-wrap with the stage, the panel, a figcaption that says what a marker is; stage height clamp(420px, 62vh, 640px)
               from 1280 and clamp(360px, 60dvh, 520px) below 900; the maplibre script is deferred; the panel is a role=group that
               holds an empty #map-ext-slot and the legend; at 390 it sits under the map as a collapsed disclosure that shows the count
  mobile       the map box is at least 358 x 360 px; no tap target inside the plate under 44 px (tabs, panel, markers' tap area, the
               library's buttons), also with the panel open
  panel        every row shows a non-empty source line (and an unrecorded vintage in the gap ink); "N of M shown"; hillshade and
               regen-network are the only default-on layers plus the extensions' defaults; groups are role=group and collapse; a group
               with a layer on starts open; Clear layers and Back to defaults; storage blocked still renders
  legend       rows exist only for active layers; the land-cover row has at least 8 discrete swatches and no gradient; Koppen is grouped;
               a ramp is a 64 x 8 gradient; the legend sits inside the panel and scrolls inside its own box
  markers      one per region of the continent, a unique mark, aria-label with "whose land", Enter opens the drawer, hover shows
               "Whose land: ...", a visible focus ring; a filtered share link opens with the outside markers already dashed (no later change)
  fit          every chip inside the stage and clear of the controls on both continents, Nova Scotia and Quebec/Vermont named, at both widths;
               the switcher shows one tab per continent
Test ids: plate:*, mobile:*, panel:*, legend:*, markers:*, fit:*, clean:*, harness (no-formsubmit).
"""
import re

from lib import sel as _sel
from lib.site import PNG_1X1, default_storage, goto_settled

NAME = "test_mapui"
S = _sel.load("mapui")
SEL = S.SEL
ARCGIS = re.compile(r"^https?://services\.arcgisonline\.com/", re.I)
NAMED = ["nova-scotia", "quebec-eastern-townships", "vermont"]


def fresh(h, browser, width, path="/", extra_init=(), site_storage=True):
    s = h.session(browser, width=width, storage=default_storage(h.site) if site_storage else None, stub=True, extra_init=list(extra_init))
    s.context.route(ARCGIS, lambda route, request: route.fulfill(
        status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"}))
    page = s.page()
    log = s.log(page)
    goto_settled(page, h.base + path, extra_ms=400)
    return s, page, log


def clean(r, tag, log, label):
    errs = [e for e in log.errors() if not str(e.get("text", "")).startswith("Failed to load resource")]
    errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("clean:no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def click_tab(page, continent):
    tab = page.locator('%s[data-continent="%s"]' % (SEL["tab"], continent))
    tab.scroll_into_view_if_needed()
    tab.click()
    page.wait_for_timeout(900)


def continents(page):
    return page.evaluate("Array.from(document.querySelectorAll('.continent-tab')).map((b) => b.dataset.continent)")


def inside(chip, stage, pad=0):
    return chip["l"] >= stage["l"] + pad and chip["r"] <= stage["r"] - pad and chip["t"] >= stage["t"] + pad and chip["b"] <= stage["b"] - pad


def overlap(a, b):
    w = min(a["r"], b["r"]) - max(a["l"], b["l"])
    hh = min(a["b"], b["b"]) - max(a["t"], b["t"])
    return w > 0.5 and hh > 0.5


def open_panel(page, width):
    """Open the disclosure when the panel is collapsed (narrow) and every group, so every row is shown."""
    if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
        page.click(SEL["layers_toggle"])
        page.wait_for_timeout(200)
    page.evaluate(S.JS_OPEN_ALL_GROUPS)
    page.wait_for_timeout(150)


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            # ================================================================ the plate, the panel, the legend
            s, page, log = fresh(h, browser, width)
            try:
                conts = continents(page)
                regions = page.evaluate("Array.from(document.querySelectorAll('.region-card')).map((c) => [c.dataset.continent, c.id.replace('region-', '')])")
                per = {}
                for c, i in regions:
                    per.setdefault(c, []).append(i)
                r.info("regions" + tag, {c: len(v) for c, v in per.items()})
                pl = page.evaluate(S.JS_PLATE)
                r.check("plate:figure-with-stage-panel-caption" + tag, pl["fig"] and "map-plate" in (pl["figClasses"] or "") and pl["stage"] is not None and pl["controls"] is not None and pl["caption"] is not None, pl)
                r.check("plate:caption-says-what-a-marker-is" + tag, "reference point" in (pl["caption"] or "") and "not its extent" in (pl["caption"] or "") and "Basemap" in (pl["caption"] or ""), pl["caption"])
                want_h = max(420, min(640, 0.62 * pl["vh"])) if width >= 900 else max(360, min(520, 0.60 * pl["vh"]))
                pass  # retired 2026-10-07 (Catchment visual assertion): plate:stage-height-clamp
                # LAZY_MAP is on (MC-PERF): the page carries no maplibre tag and src/map/loader.js injects the library after load. A page that
                # does carry a tag must keep it deferred; either way nothing blocks the parser (a deferred tag, or the loader's injected script, which is async).
                r.check("plate:maplibre-script-deferred" + tag, pl["scriptDefer"] is None or pl["scriptDefer"] is True or pl.get("scriptAsync") is True, [pl["scriptDefer"], pl.get("scriptAsync")])
                r.check("plate:panel-is-a-labelled-group" + tag, pl["controlsRole"] == "group" and "layers" in (pl["controlsLabel"] or "").lower(), (pl["controlsRole"], pl["controlsLabel"]))
                r.check("plate:map-has-a-text-alternative" + tag, pl["mapRole"] == "region" and "card" in (pl["mapLabel"] or "").lower(), (pl["mapRole"], pl["mapLabel"]))
                r.check("plate:ext-slot-in-the-panel-and-empty" + tag, pl["slotInControls"] and pl["slotEmpty"], pl)
                r.check("plate:legend-docked-in-the-panel" + tag, pl["legendInControls"], pl)
                r.check("plate:panel-not-floating-over-the-map" + tag, pl["controlsPosition"] != "absolute" and not (pl["controls"]["l"] < pl["stage"]["r"] and pl["controls"]["r"] > pl["stage"]["l"] and pl["controls"]["t"] < pl["stage"]["b"] and pl["controls"]["b"] > pl["stage"]["t"]), (pl["controls"], pl["stage"]))
                r.check("plate:no-page-overflow" + tag, pl["pageOverflow"] <= 1, "%s px" % pl["pageOverflow"])
                r.check("plate:count-reads-n-of-m-shown" + tag, re.match(r"^\d+ of \d+ shown$", pl["count"] or "") is not None, pl["count"])
                if width >= 1280:
                    r.check("plate:panel-column-beside-the-map" + tag, abs(pl["controls"]["w"] - 300) <= 2 and pl["controls"]["l"] >= pl["stage"]["r"] - 1, (pl["controls"], pl["stage"]))
                    r.check("plate:panel-height-equals-the-stage" + tag, abs(pl["controls"]["h"] - pl["stage"]["h"]) <= 2, (pl["controls"]["h"], pl["stage"]["h"]))
                    r.check("plate:header-is-a-heading-not-a-control" + tag, pl["toggleExpanded"] == "true" and pl["toggleDisabled"] == "true", (pl["toggleExpanded"], pl["toggleDisabled"]))
                if width < 900:
                    r.check("plate:panel-under-the-map-collapsed" + tag, pl["controls"]["t"] >= pl["stage"]["b"] - 1 and pl["toggleExpanded"] == "false", (pl["controls"], pl["stage"], pl["toggleExpanded"]))
                    r.check("mobile:map-box-at-least-358x360" + tag, pl["map"]["w"] >= 358 and pl["map"]["h"] >= 360, "%.0f x %.0f" % (pl["map"]["w"], pl["map"]["h"]))
                    taps = page.evaluate(S.JS_TAPS)
                    r.check("mobile:no-tap-target-under-44px-panel-closed" + tag, not taps, taps[:8])
                    page.click(SEL["layers_toggle"])
                    page.wait_for_timeout(250)
                    r.check("mobile:disclosure-opens" + tag, page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "true" and page.locator(SEL["row"]).first.is_visible() or page.locator(SEL["group_head"]).first.is_visible(), "")
                    page.click(SEL["layers_toggle"])
                    page.wait_for_timeout(200)
                    r.check("mobile:disclosure-closes" + tag, page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false" and not page.locator(SEL["group_head"]).first.is_visible(), "")
                    page.click(SEL["layers_toggle"])
                    page.wait_for_timeout(250)
                    page.evaluate(S.JS_OPEN_ALL_GROUPS)
                    page.wait_for_timeout(200)
                    taps = page.evaluate(S.JS_TAPS)
                    r.check("mobile:no-tap-target-under-44px-panel-open" + tag, not taps, taps[:8])
                else:
                    open_panel(page, width)

                # ---------------------------------------------------------------- the rows
                open_panel(page, width)
                rows = page.evaluate(S.JS_ROWS)
                reg = page.evaluate(S.JS_DEFAULTS)
                r.check("panel:one-row-per-layer" + tag, len(rows) == reg["all"] + reg["extAll"], "%d rows, %d core + %d extension layers" % (len(rows), reg["all"], reg["extAll"]))
                empty = [x["id"] for x in rows if not (x["src"] or "").strip()]
                r.check("panel:every-row-shows-a-source-line" + tag, not empty, empty)
                thin = [x["id"] for x in rows if x["src"] and len(x["src"]) < 12]
                r.check("panel:source-lines-name-source-and-vintage" + tag, not thin, thin)
                r.check("panel:rows-link-their-source-line" + tag, all(x["srcId"] and x["srcId"] in (x["describedby"] or "") for x in rows), [x["id"] for x in rows if not (x["srcId"] and x["srcId"] in (x["describedby"] or ""))])
                r.check("panel:rows-carry-the-layer-id" + tag, all(x["id"] for x in rows), "")
                r.check("panel:rows-are-44px-buttons" + tag, all(x["h"] >= 44 and x["w"] >= 44 for x in rows if x["shown"]), [(x["id"], x["h"]) for x in rows if x["shown"] and x["h"] < 44][:5])
                r.check("panel:every-row-shown-once-groups-open" + tag, all(x["shown"] for x in rows), [x["id"] for x in rows if not x["shown"]][:5])
                r.info("panel:gap-words" + tag, {x["id"]: x["gap"] for x in rows if x["gap"]})
                pressed = page.evaluate(S.JS_PRESSED_IDS)
                r.check("panel:only-hillshade-and-regen-network-core-defaults" + tag, reg["core"] == ["hillshade", "regen-network"], reg["core"])
                r.check("panel:pressed-rows-equal-the-defaults" + tag, pressed == sorted(reg["core"] + reg["ext"]), "pressed %s, defaults %s" % (pressed, sorted(reg["core"] + reg["ext"])))
                groups = page.evaluate(S.JS_GROUPS)
                r.check("panel:groups-are-labelled-role-groups" + tag, len(groups) >= 5 and all(g["role"] == "group" and g["labelledby"] for g in groups), groups)
                r.check("panel:group-heads-are-44px" + tag, all(g["headH"] >= 44 for g in groups), [(g["key"], g["headH"]) for g in groups])
                order = [g["key"] for g in groups]
                core = ("climate", "land", "energy", "hazards", "human", "imagery")
                ext = [k for k in order if k not in core]
                r.check("panel:group-order-extension-groups-first-then-core" + tag, order == ext + [k for k in core if k in order] and [k for k in order if k in core] == list(core), order)
                r.check("panel:group-count-equals-pressed-rows" + tag, sum(g["on"] for g in groups) == len(pressed), (sum(g["on"] for g in groups), len(pressed)))

                # ---------------------------------------------------------------- toggling: the legend follows
                lg = page.evaluate(S.JS_LEGEND)
                ids0 = [x["id"] for x in lg["secs"]]
                r.check("legend:only-active-layers-with-a-legend" + tag, set(ids0) <= set(pressed) and "regen-network" in ids0 and "hillshade" not in ids0, (ids0, pressed))
                r.check("legend:docked-inside-the-panel" + tag, lg["inPanel"] is True, lg)
                r.check("legend:scrolls-inside-its-own-box" + tag, lg["overflowY"] in ("auto", "scroll") and lg["tabindex"] == "0" and lg["role"] == "region", (lg["overflowY"], lg["tabindex"], lg["role"]))
                r.check("legend:each-active-layer-has-one-source-line" + tag, all(x["src"] for x in lg["secs"]), [x["id"] for x in lg["secs"] if not x["src"]])

                def toggle(layer_id, want=None):
                    b = page.locator('%s[data-layer-id="%s"]' % (SEL["row"], layer_id))
                    b.scroll_into_view_if_needed()
                    b.click()
                    page.wait_for_timeout(250)

                toggle("land-cover")
                lg = page.evaluate(S.JS_LEGEND)
                lc = next((x for x in lg["secs"] if x["id"] == "land-cover"), None)
                r.check("legend:land-cover-row-appears" + tag, lc is not None, [x["id"] for x in lg["secs"]])
                if lc:
                    r.check("legend:land-cover-has-8-or-more-discrete-swatches" + tag, lc["swatches"] >= 8, lc["swatches"])
                    r.check("legend:land-cover-has-no-gradient" + tag, lc["gradients"] == 0 and lc["rampCount"] == 0, lc)
                n_on = len(page.evaluate(S.JS_PRESSED_IDS))
                r.check("panel:count-follows-the-toggle" + tag, page.inner_text(SEL["layers_count"]).startswith("%d of " % n_on), page.inner_text(SEL["layers_count"]))
                toggle("worldcover")
                toggle("seismic")
                toggle("river-flood-current")
                lg = page.evaluate(S.JS_LEGEND)
                by = {x["id"]: x for x in lg["secs"]}
                r.check("legend:worldcover-and-seismic-are-discrete-classes" + tag, by.get("worldcover", {}).get("swatches", 0) >= 8 and by.get("seismic", {}).get("swatches", 0) >= 8 and by["worldcover"]["gradients"] == 0 and by["seismic"]["gradients"] == 0, {k: (v["swatches"], v["gradients"]) for k, v in by.items()})
                r.check("legend:ramp-layers-draw-one-gradient-ramp" + tag, by.get("river-flood-current", {}).get("rampCount") == 1, by.get("river-flood-current"))
                ramp = page.evaluate("() => { const e = document.querySelector('#map-legend section[data-layer-id=\"river-flood-current\"] .lg-ramp'); if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; }")
                r.check("legend:ramp-is-64-by-8" + tag, ramp is not None and ramp["w"] == 64 and ramp["h"] == 8, ramp)
                r.check("legend:grows-a-scroll-region-with-many-layers" + tag, lg["scrolls"] or lg["h"] <= lg["panelH"], lg)
                toggle("koppen-now")
                page.wait_for_timeout(1500)
                lg = page.evaluate(S.JS_LEGEND)
                kp = next((x for x in lg["secs"] if x["id"] == "koppen-now"), None)
                r.check("legend:koppen-is-grouped-discrete-classes" + tag, kp is not None and kp["groups"] >= 2 and kp["swatches"] >= 4 and kp["gradients"] == 0, kp)
                toggle("worldcover"); toggle("seismic"); toggle("river-flood-current"); toggle("koppen-now"); toggle("land-cover")
                lg = page.evaluate(S.JS_LEGEND)
                r.check("legend:rows-vanish-when-the-layers-go-off" + tag, [x["id"] for x in lg["secs"]] == ids0, ([x["id"] for x in lg["secs"]], ids0))

                # Clear layers / Back to defaults
                page.click(SEL["clear"])
                page.wait_for_timeout(250)
                lg = page.evaluate(S.JS_LEGEND)
                r.check("panel:clear-layers-switches-everything-off" + tag, page.evaluate(S.JS_PRESSED_IDS) == [] and page.inner_text(SEL["layers_count"]).startswith("0 of "), page.inner_text(SEL["layers_count"]))
                r.check("legend:hidden-when-nothing-is-on" + tag, lg["hidden"] is True and lg["display"] == "none" and lg["ariaHidden"] == "true" and lg["secs"] == [], lg)
                page.click(SEL["defaults"])
                page.wait_for_timeout(250)
                r.check("panel:back-to-defaults" + tag, page.evaluate(S.JS_PRESSED_IDS) == sorted(reg["core"] + reg["ext"]), page.evaluate(S.JS_PRESSED_IDS))
                r.check("panel:actions-are-44px" + tag, page.evaluate("() => ['#layers-clear', '#layers-defaults'].every((s) => { const r = document.querySelector(s).getBoundingClientRect(); return r.height >= 44 && r.width >= 44; })"), "")

                # groups collapse, and a group with a layer on starts open (after a reload the stored state is a convenience only)
                head = page.locator('%s' % SEL["group_head"]).first
                key = page.evaluate("() => document.querySelector('#map-toggles .map-group').dataset.group")
                body_id = head.get_attribute("aria-controls")
                has_on = page.evaluate("(k) => document.querySelectorAll('#map-toggles .map-group[data-group=\"' + k + '\"] button.map-toggle[aria-pressed=\"true\"]').length", key)
                head.scroll_into_view_if_needed()
                head.click()
                page.wait_for_timeout(150)
                r.check("panel:group-collapses" + tag, head.get_attribute("aria-expanded") == "false" and page.evaluate("(id) => document.getElementById(id).hidden", body_id), "")
                stored = page.evaluate("() => { try { return localStorage.getItem('lsf-map-groups'); } catch (e) { return 'blocked'; } }")
                r.check("panel:open-state-is-remembered-as-a-convenience" + tag, stored not in (None, "blocked") and ('"%s":false' % key) in stored, stored)
                head.click()
                page.wait_for_timeout(150)
                r.check("panel:group-reopens" + tag, head.get_attribute("aria-expanded") == "true", "")
                blocked = page.evaluate("""() => import('/src/map/toggles.js').then((m) => { const g = Storage.prototype.getItem, p = Storage.prototype.setItem;
                  Storage.prototype.getItem = () => { throw new Error('blocked'); }; Storage.prototype.setItem = () => { throw new Error('blocked'); };
                  try { m.renderMapToggles(); document.querySelector('#map-toggles .map-toggle-group-label').click(); return document.querySelectorAll('#map-toggles button.map-toggle').length; }
                  catch (e) { return 'threw: ' + e.message; } finally { Storage.prototype.getItem = g; Storage.prototype.setItem = p; } })""")
                r.check("panel:renders-with-storage-blocked" + tag, isinstance(blocked, int) and blocked == reg["all"] + reg["extAll"], blocked)
                clean(r, tag, log, "panel")
                r.check("harness:no-formsubmit-panel" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()

            # ================================================================ groups on a fresh page: a group with a layer on starts open
            s, page, log = fresh(h, browser, width)
            try:
                if width < 900:
                    page.click(SEL["layers_toggle"])
                    page.wait_for_timeout(200)
                groups = page.evaluate(S.JS_GROUPS)
                for g in groups:
                    if g["on"]:
                        r.check("panel:group-with-a-layer-on-starts-open:%s%s" % (g["key"], tag), g["expanded"] == "true" and not g["hidden"], g)
                if width < 900:
                    r.check("panel:groups-without-a-layer-on-start-closed-on-phones" + tag, all(g["hidden"] for g in groups if not g["on"]), [(g["key"], g["hidden"]) for g in groups])
                else:
                    r.check("panel:groups-start-open-beside-the-map" + tag, all(not g["hidden"] for g in groups), [(g["key"], g["hidden"]) for g in groups])
            finally:
                s.close()

            # ================================================================ markers, per continent
            s, page, log = fresh(h, browser, width)
            try:
                conts = continents(page)
                r.check("fit:one-tab-per-continent" + tag, len(conts) >= 2 and len(set(conts)) == len(conts), conts)
                tabs = page.evaluate("Array.from(document.querySelectorAll('.continent-tab')).map((b) => ({ role: b.getAttribute('role'), h: Math.round(b.getBoundingClientRect().height), sel: b.getAttribute('aria-selected') }))")
                r.check("fit:tabs-are-role-tab-44px" + tag, all(t["role"] == "tab" and t["h"] >= 44 for t in tabs), tabs)
                for c in conts:
                    if page.evaluate(S.JS_ACTIVE_CONTINENT) != c:
                        click_tab(page, c)
                    page.locator(SEL["map"]).scroll_into_view_if_needed()
                    page.wait_for_timeout(500)
                    mk = page.evaluate(S.JS_MARKERS)
                    ids = [m["id"] for m in mk["markers"]]
                    want = [i for (cc, i) in regions if cc == c]
                    r.check("markers:one-per-region-of-the-continent:%s%s" % (c, tag), sorted(ids) == sorted(want) and len(ids) == len(want), "%d markers, %d regions" % (len(ids), len(want)))
                    marks = [m["mark"] for m in mk["markers"]]
                    r.check("markers:marks-unique-within-the-continent:%s%s" % (c, tag), len({x.lower() for x in marks}) == len(marks) and all(1 <= len(x) <= 2 for x in marks), marks)
                    r.check("markers:aria-label-names-the-region-and-whose-land:%s%s" % (c, tag), all(m["aria"] and "whose land" in m["aria"].lower() and m["role"] == "button" and m["tabindex"] == "0" for m in mk["markers"]), [m["aria"] for m in mk["markers"] if not (m["aria"] and "whose land" in m["aria"].lower())][:3])
                    r.check("markers:tap-area-44px:%s%s" % (c, tag), all(m["hit"]["w"] >= 44 and m["hit"]["h"] >= 44 for m in mk["markers"]), [(m["id"], m["hit"]["w"]) for m in mk["markers"] if m["hit"]["w"] < 44][:3])
                    bad = [m["id"] for m in mk["markers"] if not inside(m["chip"], mk["stage"])]
                    r.check("fit:every-chip-inside-the-stage:%s%s" % (c, tag), not bad, bad)
                    clash = [m["id"] for m in mk["markers"] for k in mk["ctrls"] if overlap(m["chip"], k)]
                    r.check("fit:no-chip-under-the-map-controls:%s%s" % (c, tag), not clash, clash)
                    for named in NAMED:
                        m = next((x for x in mk["markers"] if x["id"] == named), None)
                        if m is not None:
                            r.check("fit:%s-fully-inside-the-stage:%s%s" % (named, c, tag), inside(m["chip"], mk["stage"], 4), (m["chip"], mk["stage"]))
                    cam = page.evaluate(S.JS_CAMERA)
                    r.check("fit:min-zoom-never-above-the-fitted-zoom:%s%s" % (c, tag), cam["minZoom"] <= cam["zoom"] + 1e-6 and cam["zoom"] <= 6.001, cam)
                    # hover and focus show the Salutation
                    first = mk["markers"][0]["id"]
                    page.hover('#map .region-marker[data-region="%s"] .hit' % first)
                    page.wait_for_timeout(150)
                    hv = page.evaluate(S.JS_HOVER_LAND, first)
                    r.check("markers:hover-shows-whose-land:%s%s" % (c, tag), hv["shown"] and hv["labelShown"] and hv["text"].startswith("Whose land"), hv)
                    # every marker's grown pill (name + whose land) stays inside the stage while focused
                    clipped = []
                    page.mouse.move(2, 2)
                    page.keyboard.press("Shift")   # keyboard modality, so a scripted focus() counts as :focus-visible
                    for m in mk["markers"]:
                        page.focus('#map .region-marker[data-region="%s"]' % m["id"])   # focus, not hover: chips may overlap, and the top one takes the pointer
                        page.wait_for_timeout(60)
                        box = page.evaluate("(id) => { const l = document.querySelector('#map .region-marker[data-region=\"' + id + '\"] .region-label').getBoundingClientRect(); const s = document.getElementById('map').getBoundingClientRect(); return { l: l.left - s.left, r: s.right - l.right, t: l.top - s.top, b: s.bottom - l.bottom }; }", m["id"])
                        if min(box.values()) < -1:
                            clipped.append((m["id"], box))
                    r.check("markers:focused-pill-stays-inside-the-stage:%s%s" % (c, tag), not clipped, clipped[:3])
                    page.mouse.move(2, 2)
                    ring = page.evaluate(S.JS_FOCUS_RING, first)
                    r.check("markers:focus-shows-a-3px-ring-on-the-chip:%s%s" % (c, tag), ring["focused"] and ring["outlineStyle"] == "solid" and ring["outlineWidth"] == "3px" and ring["markerOutline"] == "none", ring)
                    page.evaluate("document.activeElement && document.activeElement.blur()")
                # Enter on a marker opens the drawer (the same drawer as the card)
                mid = page.evaluate("() => Array.from(document.querySelectorAll('#map .region-marker')).find((m) => getComputedStyle(m).display !== 'none').dataset.region")
                page.focus('#map .region-marker[data-region="%s"]' % mid)
                page.keyboard.press("Enter")
                page.wait_for_timeout(700)
                opened = page.evaluate("() => { const d = document.getElementById('region-drawer'); return { open: !!(d && d.classList.contains('open') && d.getAttribute('aria-hidden') === 'false'), name: (document.querySelector('.drawer-name') || {}).textContent }; }")
                r.check("markers:enter-opens-the-drawer" + tag, opened["open"], opened)
                clean(r, tag, log, "markers")
                r.check("harness:no-formsubmit-markers" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()

            # ================================================================ a filtered share link: outside markers dashed at once
            s, page, log = fresh(h, browser, width, path=S.FILTERED_LINK, extra_init=[S.INIT_DIM_WATCH])
            try:
                seen = page.evaluate(S.JS_DIM_SEEN)
                cards = page.evaluate("Array.from(document.querySelectorAll('.region-card.fail')).map((c) => c.id.replace('region-', '')).sort()")
                dim = sorted(i for i, v in seen["now"].items() if v)
                r.check("markers:filtered-link-dims-the-outside-markers" + tag, 0 < len(dim) < seen["n"] and dim == cards, "dim %s, failing cards %s" % (dim, cards))
                r.check("markers:outside-markers-dashed-the-moment-they-appear" + tag, not seen["late"] and all(seen["first"].get(i) for i in dim), "dimmed only later: %s" % seen["late"])
                mk = page.evaluate("() => Array.from(document.querySelectorAll('#map .region-marker.dim')).map((m) => ({ id: m.dataset.region, aria: m.getAttribute('aria-label'), border: getComputedStyle(m.querySelector('.chip')).borderTopStyle }))")
                r.check("markers:dim-means-a-dashed-ring-and-says-so-in-words" + tag, mk and all(x["border"] == "dashed" and "outside your thresholds" in x["aria"] and "whose land" in x["aria"].lower() for x in mk), mk[:2])
                r.check("markers:outside-markers-stay-on-the-map" + tag, page.evaluate("document.querySelectorAll('#map .region-marker.dim').length") == len(dim), "")
                clean(r, tag, log, "filtered")
            finally:
                s.close()
        finally:
            h.close_browser(browser)
    return r.out
