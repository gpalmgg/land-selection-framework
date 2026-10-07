"""test_layers: the layer registry, lazy GeoJSON and layer health on the real page (MC-MAP-LAYERS).

Deterministic by construction: every third-party request is answered here (a 1x1 PNG with CORS, or aborted, or held back), so
the checks never depend on a tile provider being up. The live tile services are the job of the `layers` suite.

  * load        no GeoJSON is fetched before a toggle except the ecovillage points, and the bytes at load fall by at least 1 MB
                against the 6bce1a3 baseline (the files that baseline fetched at load)
  * lazy        a layer's file is fetched on its first toggle, once; off and on again fetches nothing
  * continent   a switch loads only what was already shown (plus the eager points); a continent with no clip clears the source
  * registry    the registry in the page: halves agree, defaults, source line of the ecovillage row, trajectory pairs, z-order,
                realise() idempotent, every raster layer under the basemap label layer
  * legend      the Koppen legend lists the classes of the loaded file, grouped, not 30 rows
  * health      a layer whose host is blocked shows the unavailable note within 10 s (and recovers), a stalled one the same
                within 11 s; fragile / slow / zoom-floor notes; aria-describedby links and the polite live region
  * clean       no console error, no page error, nothing submitted
Test ids: load:*, lazy:*, continent:*, registry:*, legend:*, health:*, clean:*, harness (no-formsubmit).
"""
import re
import time
from pathlib import Path
from urllib.parse import urlparse

from lib import sel as _sel
from lib.site import BASELINE_SITE, FORMSUBMIT_RE, PNG_1X1, default_storage, goto_settled

NAME = "test_layers"
S = _sel.load("layers")
SEL = S.SEL

THIRD_PARTY = re.compile(r"^https?://(?!(127\.0\.0\.1|localhost)(:|/|$))")
LAZY_IDS = ["water-stress", "water-depletion", "conflict", "koppen-now", "koppen-2041-2070"]
BASELINE_LOAD_GEOJSON = ["conflict.geojson", "ecovillages.geojson", "water-depletion.geojson", "water-stress.geojson"]
SAVED_BYTES = 1_000_000
BLOCK_WITHIN_S = 10
STALL_WITHIN_S = 11


# ------------------------------------------------------------------------------------------------------------- plumbing
class Net:
    """Answers every third-party request: PNG (CORS) unless the host is blocked (aborted) or stalled (held back, never answered)."""

    def __init__(self, page):
        self.blocked, self.stalled, self.held, self.asked = [], [], [], []
        page.route(THIRD_PARTY, self._handle)

    def _handle(self, route, request):
        url = request.url
        self.asked.append(url)
        if FORMSUBMIT_RE.match(url):
            route.fallback()                              # the context's guard records and aborts it
        elif any(b in url for b in self.blocked):
            route.abort("failed")
        elif any(b in url for b in self.stalled):
            self.held.append(route)                      # never answered: the request hangs
        else:
            route.fulfill(status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"})

    def release(self):
        """Answer the held-back requests (aborted) so no route is left pending when the page closes."""
        for route in self.held:
            try:
                route.abort("failed")
            except Exception:
                pass
        self.held = []

    def hits(self, fragment):
        return [u for u in self.asked if fragment in u]


class OwnFiles:
    """Own-origin response log: URL, status, body bytes for the files under data/processed."""

    def __init__(self, page):
        self.rows = []
        page.on("response", self._resp)

    def _resp(self, r):
        try:
            u = urlparse(r.url)
            if u.netloc.startswith("127.0.0.1") and u.path.endswith(".geojson"):
                try:
                    size = len(r.body())
                except Exception:
                    size = 0
                self.rows.append({"path": u.path, "status": r.status, "bytes": size, "t": time.time()})
        except Exception:
            pass

    def geojson(self):
        # bioregion*.geojson is the default-on "Bioregions" context layer (BIO-3, defaultOn: true, role context), loaded after
        # the first idle by design; this suite is about the lazy DATA layers, so the context files are not counted here.
        return [r["path"].rsplit("/", 1)[-1] for r in self.rows if "/bioregion" not in r["path"]]

    def count(self, name):
        return sum(1 for r in self.rows if r["path"].endswith("/" + name))


def new_page(h, browser, width=1280, scheme="light"):
    s = h.session(browser, width=width, storage=default_storage(h.site), stub=False, scheme=scheme)
    page = s.page()
    log = s.log(page)
    net = Net(page)
    files = OwnFiles(page)
    return s, page, log, net, files


def open_panel(page):
    try:
        if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
            page.click(SEL["layers_toggle"])
            page.wait_for_timeout(200)
    except Exception:
        pass


def toggle_button(page, layer):
    """The layer's toggle: data-layer-id when the panel sets it, else its aria-label."""
    by_id = page.locator('%s [data-layer-id="%s"]' % (SEL["toggles"], layer["id"]))
    if by_id.count():
        return by_id.first
    return page.locator('%s[aria-label="%s map layer"]' % (SEL["toggle_any"], layer["label"])).first


def pressed(btn):
    return btn.get_attribute("aria-pressed") == "true"


def set_layer(page, layer, on):
    open_panel(page)
    btn = toggle_button(page, layer)
    btn.scroll_into_view_if_needed()
    if pressed(btn) != on:
        btn.click()
    page.wait_for_timeout(150)
    return btn


def wait_until(fn, seconds, step=150, page=None):
    end = time.time() + seconds
    while time.time() < end:
        v = fn()
        if v:
            return v
        if page is not None:
            page.wait_for_timeout(step)
        else:
            time.sleep(step / 1000.0)
    return fn()


def note_of(page, layer):
    return page.evaluate(S.JS_NOTE, {"id": layer["id"], "label": layer["label"]})


def switch_continent(page, c):
    page.locator('%s[data-continent="%s"]' % (SEL["continent_tab"], c)).click()
    page.wait_for_timeout(900)


def site_geojson_bytes(site, names):
    out = 0
    for n in names:
        for base in (Path(BASELINE_SITE), Path(site)):
            p = base / "data" / "processed" / n
            if p.is_file():
                out += p.stat().st_size
                break
    return out


def clean(r, tag, log, own_only=True):
    errs = log.errors(own_only=own_only) + [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("clean:no-console-errors:%s" % tag, not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


# ------------------------------------------------------------------------------------------------------------- the checks
def check_load(h, r, browser):
    for width in h.widths:
        tag = "@%d" % width
        s, page, log, net, files = new_page(h, browser, width)
        try:
            goto_settled(page, h.base + "/", extra_ms=1500)
            names = sorted(set(files.geojson()))
            others = [n for n in names if "ecovillage" not in n]
            r.check("load:no-hidden-geojson" + tag, not others, "fetched at load: %s" % names)
            r.check("load:ecovillages-eager" + tag, any("ecovillage" in n for n in names), "fetched at load: %s" % names)
            measured = sum(x["bytes"] for x in files.rows)
            baseline = site_geojson_bytes(h.site, BASELINE_LOAD_GEOJSON)
            r.check("load:bytes-saved-at-least-1MB" + tag, baseline - measured >= SAVED_BYTES,
                    "baseline fetched %d bytes of GeoJSON at load, this build %d: saved %d" % (baseline, measured, baseline - measured))
            sources = page.evaluate("() => Object.keys(window.__maps[0].getStyle().sources)")
            r.check("load:every-registry-source-added" + tag, all(x in sources for x in ["conflict", "water-stress", "koppen-now", "regen-network"]), sources)
            clean(r, "load" + tag, log)
        finally:
            r.check("harness:no-formsubmit-load" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            s.close()


def check_registry(h, r, browser):
    s, page, log, net, files = new_page(h, browser, 1280)
    try:
        goto_settled(page, h.base + "/", extra_ms=1200)
        reg = page.evaluate(S.JS_REGISTRY)
        layers = {l["id"]: l for l in reg["layers"]}
        r.check("registry:halves-agree", not reg["problems"], reg["problems"])
        defaults = sorted(i for i, l in layers.items() if l["defaultOn"])
        r.check("registry:defaults-only-hillshade-and-ecovillages", defaults == ["hillshade", "regen-network"], defaults)
        style = page.evaluate(S.JS_STYLE)
        ids = [x["id"] for x in style]
        want = [i for l in reg["layers"] for i in l["styleIds"]]
        present = [i for i in ids if i in set(want)]
        r.check("registry:every-layer-in-the-style-in-registry-order", present == want, "missing %s" % [i for i in want if i not in ids])
        vis = {x["id"]: x["visibility"] for x in style}
        wrong = [i for i, l in layers.items() if vis.get(i) != ("visible" if l["defaultOn"] else "none")]
        r.check("registry:initial-visibility", not wrong, wrong)
        labels = [i for i, x in enumerate(style) if x["id"] == "basemap-labels" or x["type"] == "symbol"]
        if labels:
            first = labels[0]
            raster_like = [i for i, x in enumerate(style) if x["id"] in layers and layers[x["id"]]["kind"] != "circle"]
            r.check("registry:data-layers-below-the-first-label-layer", all(i < first for i in raster_like), "first label layer at %d" % first)
        else:
            r.skip("registry:data-layers-below-the-first-label-layer", "the basemap has no label layer")
        twice = page.evaluate(S.JS_REALISE_TWICE)
        r.check("registry:realise-idempotent", twice["before"] == twice["after"], twice)
        eco = layers.get("regen-network", {}).get("sourceText", "")
        r.check("registry:ecovillage-row-says-openstreetmap-not-living-atlas",
                "OpenStreetMap" in eco and "ODbL" in eco and "not the Living Atlas count" in eco and re.search(r"retrieved \d{4}-\d{2}-\d{2}", eco), eco)
        r.check("registry:every-row-has-a-source-line", all(l["sourceText"] for l in reg["layers"]), [i for i, l in layers.items() if not l["sourceText"]])
        pairs = sorted("%s>%s" % (p["thenId"], p["laterId"]) for p in reg["pairs"])
        r.check("registry:trajectory-pairs-are-the-named-ones", pairs == ["koppen-now>koppen-2041-2070", "river-flood-current>river-flood-2050-rcp45", "river-flood-current>river-flood-2050-rcp85"], pairs)
        clean(r, "registry", log)
    finally:
        r.check("harness:no-formsubmit-registry", not s.guard.formsubmit, s.guard.formsubmit)
        s.close()


def check_lazy_and_continent(h, r, browser):
    s, page, log, net, files = new_page(h, browser, 1280)
    try:
        goto_settled(page, h.base + "/", extra_ms=1200)
        reg = {l["id"]: l for l in page.evaluate(S.JS_REGISTRY)["layers"]}
        at_load = set(files.geojson())
        # --- first toggle loads, once
        for lid in LAZY_IDS:
            layer = reg[lid]
            fname = layer["urls"]["europe"].rsplit("/", 1)[-1]
            before = files.count(fname)
            r.check("lazy:not-fetched-before-toggle:" + lid, before == 0, "%d requests before any toggle" % before)
            set_layer(page, layer, True)
            got = wait_until(lambda: files.count(fname) >= 1, 8, page=page)
            page.wait_for_timeout(300)
            r.check("lazy:fetched-on-first-toggle:" + lid, got and files.count(fname) == 1, "%d requests" % files.count(fname))
            data = page.evaluate(S.JS_SOURCE_DATA, lid)
            r.check("lazy:source-holds-the-file:" + lid, data.get("features", 0) > 0, data)
            set_layer(page, layer, False)
            set_layer(page, layer, True)
            page.wait_for_timeout(400)
            r.check("lazy:off-and-on-does-not-refetch:" + lid, files.count(fname) == 1, "%d requests" % files.count(fname))
            if lid not in ("water-stress", "koppen-now"):
                set_layer(page, layer, False)          # keep two shown for the continent switch below
        r.check("lazy:only-ecovillages-at-load", all("ecovillage" in n for n in at_load), sorted(at_load))
        # --- a continent switch: what was shown and the eager points, nothing hidden
        shown = ["water-stress", "koppen-now"]
        for lid in LAZY_IDS:
            set_layer(page, reg[lid], lid in shown)
        mark = len(files.rows)
        switch_continent(page, "north-america")
        page.wait_for_timeout(1200)
        after = [r_["path"].rsplit("/", 1)[-1] for r_ in files.rows[mark:] if "/bioregion" not in r_["path"]]
        expected = {reg[i]["urls"]["north-america"].rsplit("/", 1)[-1] for i in shown} | {reg["regen-network"]["urls"]["north-america"].rsplit("/", 1)[-1]}
        r.check("continent:switch-loads-only-shown-layers-and-the-points", set(after) == expected, "fetched %s, expected %s" % (sorted(set(after)), sorted(expected)))
        r.check("continent:hidden-lazy-layers-untouched",
                not any(n in after for n in [reg[i]["urls"]["north-america"].rsplit("/", 1)[-1] for i in LAZY_IDS if i not in shown]), after)
        for lid in shown:
            d = page.evaluate(S.JS_SOURCE_DATA, lid)
            r.check("continent:shown-layer-holds-the-new-data:" + lid, d.get("features", 0) > 0, d)
        # --- a hidden layer loads for the continent that is active when it is first shown
        mark = len(files.rows)
        set_layer(page, reg["conflict"], True)
        wait_until(lambda: any(r_["path"].endswith("conflict-na.geojson") for r_ in files.rows[mark:]), 8, page=page)
        r.check("continent:first-toggle-loads-the-active-continent", any(r_["path"].endswith("conflict-na.geojson") for r_ in files.rows[mark:]),
                [r_["path"] for r_ in files.rows[mark:]])
        # --- a continent with no clip clears the source (the page's own registry object is edited, then restored)
        page.evaluate("""() => import('/src/config/map-layers.js').then((m) => { const e = m.MAP_LAYERS.find((l) => l.id === 'conflict');
          window.__savedClip = e.urls.europe; delete e.urls.europe; })""")
        switch_continent(page, "europe")
        d = page.evaluate(S.JS_SOURCE_DATA, "conflict")
        r.check("continent:no-clip-clears-the-source", d.get("features", -1) == 0, d)
        page.evaluate("""() => import('/src/config/map-layers.js').then((m) => { m.MAP_LAYERS.find((l) => l.id === 'conflict').urls.europe = window.__savedClip; })""")
        clean(r, "lazy-continent", log)
    finally:
        r.check("harness:no-formsubmit-lazy", not s.guard.formsubmit, s.guard.formsubmit)
        s.close()


def check_koppen_legend(h, r, browser):
    s, page, log, net, files = new_page(h, browser, 1280)
    try:
        goto_settled(page, h.base + "/", extra_ms=1000)
        reg = {l["id"]: l for l in page.evaluate(S.JS_REGISTRY)["layers"]}
        pending = page.evaluate(S.JS_LEGEND_MODEL, "koppen-now")
        r.check("legend:koppen-pending-before-first-toggle", bool(pending and pending.get("pending")), pending)
        for lid in ("koppen-now", "koppen-2041-2070"):
            set_layer(page, reg[lid], True)
            wait_until(lambda: not (page.evaluate(S.JS_LEGEND_MODEL, lid) or {}).get("pending"), 8, page=page)
            model = page.evaluate(S.JS_LEGEND_MODEL, lid)
            url = reg[lid]["urls"]["europe"]
            codes = page.evaluate("""(u) => fetch(u).then((r) => r.json()).then((d) => Array.from(new Set(d.features.map((f) => f.properties.k))))""", url)
            shown = [c["code"] for g in model["groups"] for c in g["classes"]]
            r.check("legend:koppen-classes-are-the-loaded-classes:" + lid, sorted(shown) == sorted(codes), "legend %d, file %d" % (len(shown), len(codes)))
            r.check("legend:koppen-grouped-not-thirty-rows:" + lid,
                    0 < len(shown) < 30 and [g["key"] for g in model["groups"]] == sorted(g["key"] for g in model["groups"]) and all(g["key"] in "ABCDE" for g in model["groups"]),
                    [g["key"] for g in model["groups"]])
            r.check("legend:koppen-every-class-has-a-colour-and-name:" + lid, all(c.get("color") and c.get("label") for g in model["groups"] for c in g["classes"]), "")
            paint = page.evaluate("(id) => window.__maps[0].getPaintProperty(id, 'fill-color')", lid)
            r.check("legend:koppen-fill-uses-the-legend-colours:" + lid, isinstance(paint, list) and paint[0] == "match", str(paint)[:120])
        clean(r, "legend", log)
    finally:
        r.check("harness:no-formsubmit-legend", not s.guard.formsubmit, s.guard.formsubmit)
        s.close()


def check_health_blocked(h, r, browser):
    layer_id, host = "satellite", "tiles.maps.eox.at"
    s, page, log, net, files = new_page(h, browser, 1280)
    try:
        goto_settled(page, h.base + "/", extra_ms=1000)
        reg = {l["id"]: l for l in page.evaluate(S.JS_REGISTRY)["layers"]}
        layer = reg[layer_id]
        net.blocked.append(host)
        t0 = time.time()
        set_layer(page, layer, True)
        got = wait_until(lambda: (note_of(page, layer).get("text") or "").startswith("This service is slow or unavailable"), BLOCK_WITHIN_S, page=page)
        took = time.time() - t0
        n = note_of(page, layer)
        r.check("health:blocked-host-shows-unavailable-note-within-10s", got, "after %.1f s: %s" % (took, n))
        r.check("health:note-text-is-the-agreed-words", n.get("text") == S.UNAVAILABLE_TEXT, n.get("text"))
        r.check("health:note-sits-after-its-button-and-is-linked-by-aria-describedby", n.get("after") is True and n.get("linked") is True, n)
        live = page.evaluate(S.JS_LIVE)
        r.check("health:polite-live-region-in-the-panel",
                bool(live) and live["role"] == "status" and live["live"] == "polite" and live["inControls"], live)
        r.check("health:live-region-announces-the-trouble", bool(live) and layer["label"] in live["text"] and "slow or unavailable" in live["text"], live)
        r.check("health:layer-health-says-unavailable-or-slow", page.evaluate(S.JS_LAYER_HEALTH, layer_id)["state"] in ("unavailable", "slow"), "")
        r.check("health:the-map-keeps-working", bool(page.evaluate("() => !!window.__maps[0].getCanvas() && window.__maps[0].getStyle().layers.length > 0")) and not log.pageerrors,
                log.pageerrors)
        # recovery: let the host answer and ask for new tiles
        net.blocked.clear()
        page.evaluate(S.JS_ZOOM, page.evaluate(S.JS_GET_ZOOM) + 1)
        gone = wait_until(lambda: note_of(page, layer).get("text") is None, 8, page=page)
        n2 = note_of(page, layer)
        r.check("health:note-clears-when-tiles-arrive-again", gone and not n2.get("linked"), n2)
        live2 = page.evaluate(S.JS_LIVE)
        r.check("health:live-region-says-it-is-loading-again", bool(live2) and "loading again" in live2["text"], live2)
        # switching the layer off leaves nothing behind
        net.blocked.append(host)
        page.evaluate(S.JS_ZOOM, page.evaluate(S.JS_GET_ZOOM) - 1)
        wait_until(lambda: note_of(page, layer).get("text"), BLOCK_WITHIN_S, page=page)
        set_layer(page, layer, False)
        n3 = note_of(page, layer)
        r.check("health:switching-off-clears-the-note", n3.get("text") is None and not n3.get("linked"), n3)
        clean(r, "health-blocked", log)
    finally:
        r.check("harness:no-formsubmit-blocked", not s.guard.formsubmit, s.guard.formsubmit)
        s.close()


def check_health_stalled(h, r, browser):
    layer_id, host = "topo", "opentopomap.org"
    s, page, log, net, files = new_page(h, browser, 1280)
    try:
        goto_settled(page, h.base + "/", extra_ms=1000)
        reg = {l["id"]: l for l in page.evaluate(S.JS_REGISTRY)["layers"]}
        layer = reg[layer_id]
        net.stalled.append(host)
        t0 = time.time()
        set_layer(page, layer, True)
        early = note_of(page, layer).get("text")
        got = wait_until(lambda: (note_of(page, layer).get("text") or "").startswith("This service is slow or unavailable"), STALL_WITHIN_S, page=page)
        took = time.time() - t0
        r.check("health:stalled-host-shows-slow-note-within-11s", got, "after %.1f s: %s" % (took, note_of(page, layer)))
        r.check("health:slow-note-waits-for-the-8s-clock", not early and took >= 7.0, "nothing at once (%r), appeared after %.1f s" % (early, took))
        clean(r, "health-stalled", log)
    finally:
        net.release()
        r.check("harness:no-formsubmit-stalled", not s.guard.formsubmit, s.guard.formsubmit)
        s.close()


def check_health_notes(h, r, browser):
    s, page, log, net, files = new_page(h, browser, 1280)
    try:
        goto_settled(page, h.base + "/", extra_ms=1000)
        reg = {l["id"]: l for l in page.evaluate(S.JS_REGISTRY)["layers"]}
        wc = reg["worldcover"]
        n = note_of(page, wc)
        r.check("health:worldcover-says-zoom-in-while-off", (n.get("text") or "").lower().startswith("zoom in to see this layer") and n.get("kind") == "zoom" and n.get("linked"), n)
        set_layer(page, wc, True)
        page.wait_for_timeout(500)
        n = note_of(page, wc)
        r.check("health:worldcover-still-says-zoom-in-when-on-and-zoomed-out", n.get("kind") == "zoom", n)
        r.check("health:worldcover-asks-no-tiles-below-its-floor", not net.hits("wmts.terrascope.be"), net.hits("wmts.terrascope.be")[:2])
        page.wait_for_timeout(8500)
        n = note_of(page, wc)
        r.check("health:worldcover-is-not-called-slow-below-its-floor", n.get("kind") == "zoom", n)
        page.evaluate(S.JS_ZOOM, 7)
        got = wait_until(lambda: net.hits("wmts.terrascope.be"), 8, page=page)
        n = note_of(page, wc)
        r.check("health:worldcover-requests-tiles-once-zoomed-in", bool(got), net.hits("wmts.terrascope.be")[:1])
        r.check("health:worldcover-zoom-note-leaves-once-zoomed-in", n.get("kind") != "zoom", n)
        set_layer(page, wc, False)
        page.evaluate(S.JS_ZOOM, 4)
        for lid, kind in (("solar-pv", "fragile"), ("precipitation", "slow-flag")):
            layer = reg[lid]
            r.check("health:no-note-while-off:" + lid, note_of(page, layer).get("text") is None, note_of(page, layer))
            set_layer(page, layer, True)
            page.wait_for_timeout(400)
            n = note_of(page, layer)
            r.check("health:preemptive-%s-note-when-on:%s" % (kind, lid), n.get("kind") == kind and n.get("linked") and n.get("after") is True, n)
            set_layer(page, layer, False)
            r.check("health:preemptive-note-leaves-when-off:" + lid, note_of(page, layer).get("text") is None, note_of(page, layer))
        set_layer(page, reg["hillshade"], True)
        page.wait_for_timeout(1500)
        r.check("health:healthy-layer-has-no-note", note_of(page, reg["hillshade"]).get("text") is None, note_of(page, reg["hillshade"]))
        clean(r, "health-notes", log)
    finally:
        r.check("harness:no-formsubmit-notes", not s.guard.formsubmit, s.guard.formsubmit)
        s.close()


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    if h.browser_name != "chromium":
        r.skip("test_layers", "the layer page checks run in chromium")
        return r.out
    steps = [check_load, check_registry, check_lazy_and_continent, check_koppen_legend, check_health_blocked, check_health_stalled, check_health_notes]
    for step in steps:
        browser = h.launch()
        try:
            step(h, r, browser)
        except Exception as e:                     # a crashed step must fail loudly, never pass silently
            r.check("harness:%s-completed" % step.__name__, False, "%s: %s" % (type(e).__name__, str(e)[:300]))
        finally:
            h.close_browser(browser)
    return r.out
