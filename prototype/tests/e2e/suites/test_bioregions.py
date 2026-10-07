"""test_bioregions: the bioregions map extension (BIO-3, src/map/bioregions.js; bioregioning track 4.1, map-craft 4.2).

Deterministic: every third-party request is stubbed (Esri tiles answer a 1x1 PNG), the site's own data files are served by the harness'
static server. Checks, with the ids they report under:

  extension     manifest: group "place" first in the panel, rows "Bioregions" (on) and "Major rivers" (off), both role context,
                every row with a source line that names source, vintage and licence                     manifest:*, panel:*
  lazy          nothing from the extension is fetched before the map's first idle; exactly three requests per continent on the first
                enable (tint, boundaries, label list); none on a second toggle or a return to a continent; rivers cost one request per
                continent on their first toggle and none before                                          lazy:*
  layers        off and on again leaves no layer or source behind (map.getLayer / getSource, three cycles); no duplicate style layer;
                z-order above every raster and below every vector overlay and the place names; tint at most 0.14; dashed boundaries;
                boundary file holds shared borders only (two different ecoregions per line, no coastline)  layers:*, data:*
  continent     a continent switch swaps the data (24 tint features in Europe, 39 in North America) and leaves nothing of the other one
  labels        DOM markers, aria-hidden, pointer-events none; below zoom 5 only core labels show, none on a phone stage; none in the DOM
                when the layer is off; no two visible labels intersect (region pills included)        labels:*
  legend        a dashed-swatch row with source, vintage and licence appears when on and goes when off; the rivers row likewise  legend:*
  theme         a style swap (data-theme dark, then light) re-adds the layers from memory with no request, in the dark palette
  failure       a failed file is silent (no console error from the page), the row says so in words, the next toggle tries again
  performance   transfer for the default view at most 120 KB gzipped (Europe) / 145 KB (North America); parsing the largest file is far
                under the 50 ms long-task budget                                                         perf:*
  screenshots   zoom 3, 5 and 6.3 for Scottish Highlands, Valle Maira, Driftless and the North America overview, light (dark only when the
                theme gate is open), written to upgrade-2026-10/verify/e2e/BIO-3-shots/
Nothing is submitted; no signup form is touched. Test ids: manifest:*, panel:*, lazy:*, layers:*, data:*, continent:*, labels:*, legend:*,
theme:*, failure:*, perf:*, shots:*, clean:*, harness:*.
"""
import gzip
import json
import re
from pathlib import Path

from lib import sel as _sel
from lib.site import PNG_1X1, U, default_storage, goto_settled

NAME = "test_bioregions"
S = _sel.load("mapui")
SEL = S.SEL
ARCGIS = re.compile(r"^https?://services\.arcgisonline\.com/", re.I)
SHOTS = U / "verify" / "e2e" / "BIO-3-shots"

EU, NA = "europe", "north-america"
SUFFIX = {EU: "europe", NA: "na"}
EXPECT_TINT = {EU: 24, NA: 39}                  # the track's acceptance numbers at the final region set
GZ_BUDGET = {EU: 120 * 1024, NA: 145 * 1024}    # bytes gzipped for the default view
BIO_RE = re.compile(r"/data/processed/(bioregions-|bioregion-borders-|bioregion-labels)")
RIV_RE = re.compile(r"/data/processed/rivers-")

INIT_FIRST_IDLE = r"""(() => { window.__firstIdle = null;
  const iv = setInterval(() => { const m = window.__maps && window.__maps[0]; if (!m) return; clearInterval(iv); m.once('idle', () => { window.__firstIdle = performance.now(); }); }, 1); })();"""

# Every fetch() of an extension file, with the time it was called (independent of the browser's resource-timing buffer).
INIT_FETCH_LOG = r"""(() => { window.__fetchLog = []; const f = window.fetch;
  window.fetch = function (u) { try { const url = typeof u === 'string' ? u : (u && u.url) || String(u);
    if (/data\/processed\/(bioregion|rivers)/.test(url)) window.__fetchLog.push([url, performance.now()]); } catch (e) {} return f.apply(this, arguments); }; })();"""

JS_BIO = """() => {
  const m = window.__maps && window.__maps[0]; if (!m) return null;
  const ids = m.getStyle().layers.map((l) => l.id);
  const count = (id) => ids.filter((x) => x === id).length;
  const feat = (s) => { const src = m.getSource(s); if (!src) return null; try { const d = src.serialize().data; return d && d.features ? d.features.length : null; } catch (e) { return null; } };
  const lbl = Array.from(document.querySelectorAll('#map .bio-label'));
  const vis = lbl.filter((e) => !e.closest('.nolabel') && getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0);
  return { layers: { fill: count('bioregion-fill'), borders: count('bioregion-borders'), rivers: count('rivers'), minor: count('rivers-minor') },
    sources: { fill: !!m.getSource('bioregion-fill'), borders: !!m.getSource('bioregion-borders'), rivers: !!m.getSource('rivers') },
    features: { fill: feat('bioregion-fill'), borders: feat('bioregion-borders'), rivers: feat('rivers') },
    labelsInDom: lbl.length, labelsVisible: vis.length, visibleNonCore: vis.filter((e) => e.dataset.core !== '1').length,
    domContinents: Array.from(new Set(lbl.map((e) => e.dataset.continent))), zoom: m.getZoom(), order: ids }; }"""

JS_ORDER = """async () => {
  const m = window.__maps[0]; const { MAP_LAYERS } = await import('/src/config/map-layers.js');
  const ids = m.getStyle().layers.map((l) => l.id);
  const at = (id) => ids.indexOf(id);
  const rasters = MAP_LAYERS.filter((e) => e.layers[0].type === 'raster').map((e) => at(e.id)).filter((i) => i >= 0);
  const vectors = MAP_LAYERS.filter((e) => e.layers[0].type !== 'raster').map((e) => at(e.id)).filter((i) => i >= 0);
  return { fill: at('bioregion-fill'), borders: at('bioregion-borders'), rivers: at('rivers'), minor: at('rivers-minor'), labels: at('basemap-labels'),
    maxRaster: Math.max(...rasters), minVector: Math.min(...vectors), nRaster: rasters.length, nVector: vectors.length }; }"""

JS_PAINT = """() => { const m = window.__maps[0]; const g = (l, p) => { try { return m.getPaintProperty(l, p); } catch (e) { return null; } };
  return { fillOpacity: g('bioregion-fill', 'fill-opacity'), fillColor: g('bioregion-fill', 'fill-color'), outline: g('bioregion-fill', 'fill-outline-color'),
    dash: g('bioregion-borders', 'line-dasharray'), bOpacity: g('bioregion-borders', 'line-opacity'), bWidth: g('bioregion-borders', 'line-width'),
    rOpacity: g('rivers', 'line-opacity'), rWidth: g('rivers', 'line-width'), rFilter: (() => { try { return m.getFilter('rivers'); } catch (e) { return null; } })(),
    minorFilter: (() => { try { return m.getFilter('rivers-minor'); } catch (e) { return null; } })(),
    minorMinZoom: (() => { try { return m.getLayer('rivers-minor').minzoom; } catch (e) { return null; } })() }; }"""

JS_LABEL_STYLE = """() => { const e = document.querySelector('#map .bio-label'); if (!e) return null; const cs = getComputedStyle(e); const a = e.closest('.bio-anchor');
  return { pe: cs.pointerEvents, fontStyle: cs.fontStyle, aria: e.getAttribute('aria-hidden'), anchorAria: a ? a.getAttribute('aria-hidden') : null,
    role: e.getAttribute('role'), tabindex: e.getAttribute('tabindex'), clickable: !!e.closest('a,button') }; }"""

JS_ATTRIB = """() => { const e = document.querySelector('#map .maplibregl-ctrl-attrib'); return e ? e.textContent.replace(/\\s+/g, ' ').trim() : ''; }"""

JS_JUMP_TO = """(a) => { const m = window.__maps[0]; m.jumpTo({ center: a[0], zoom: a[1] }); }"""

JS_PARSE_COST = """async (url) => { const t = await (await fetch(url)).text(); const t0 = performance.now(); JSON.parse(t); return { ms: performance.now() - t0, bytes: t.length }; }"""

JS_SETDATA_COST = """() => { const m = window.__maps[0]; const src = m.getSource('bioregion-fill'); if (!src) return null; const d = src.serialize().data;
  const t0 = performance.now(); src.setData(d); return { ms: performance.now() - t0, features: d.features.length }; }"""

JS_LONGTASKS = """() => ({ idle: window.__firstIdle, tasks: window.__long || [] })"""
INIT_LONGTASKS = r"""(() => { window.__long = []; try { new PerformanceObserver((l) => { l.getEntries().forEach((e) => window.__long.push({ start: e.startTime, dur: e.duration })); }).observe({ entryTypes: ['longtask'] }); } catch (e) {} })();"""


def fresh(h, browser, width, scheme="light", stub=True, extra_init=()):
    s = h.session(browser, width=width, scheme=scheme, storage=default_storage(h.site), stub=stub,
                  extra_init=[INIT_FIRST_IDLE, INIT_FETCH_LOG] + list(extra_init))
    if stub:
        s.context.route(ARCGIS, lambda route, request: route.fulfill(
            status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"}))
    page = s.page()
    log = s.log(page)
    goto_settled(page, h.base + "/", extra_ms=900)
    return s, page, log


def bio_requests(s):
    """Basenames of the extension's data requests so far, in order."""
    return [p.rsplit("/", 1)[-1] for (_m, p, _t) in s.guard.own_requests if BIO_RE.search(p)]


def riv_requests(s):
    return [p.rsplit("/", 1)[-1] for (_m, p, _t) in s.guard.own_requests if RIV_RE.search(p)]


def want_files(c):
    return sorted(["bioregions-%s.geojson" % SUFFIX[c], "bioregion-borders-%s.geojson" % SUFFIX[c], "bioregion-labels.json"])


def row(page, layer_id):
    return page.locator('%s[data-layer-id="%s"]' % (SEL["row"], layer_id))


def open_panel(page):
    try:
        if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
            page.click(SEL["layers_toggle"])
            page.wait_for_timeout(200)
        page.evaluate(S.JS_OPEN_ALL_GROUPS)
        page.wait_for_timeout(150)
    except Exception:
        pass


def click_row(page, layer_id, wait=700):
    b = row(page, layer_id)
    b.scroll_into_view_if_needed()
    b.click()
    page.wait_for_timeout(wait)


def click_tab(page, continent, wait=1300):
    tab = page.locator('%s[data-continent="%s"]' % (SEL["tab"], continent))
    tab.scroll_into_view_if_needed()
    tab.click()
    page.wait_for_timeout(wait)


def clean(r, tag, log, label):
    errs = [e for e in log.errors() if not str(e.get("text", "")).startswith("Failed to load resource")]
    errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("clean:no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def disk(h, name):
    return json.loads((Path(h.site) / "data" / "processed" / name).read_text(encoding="utf-8"))


def gz(h, name):
    return len(gzip.compress((Path(h.site) / "data" / "processed" / name).read_bytes(), 6))


def overlap(a, b):
    w = min(a["r"], b["r"]) - max(a["l"], b["l"])
    hh = min(a["b"], b["b"]) - max(a["t"], b["t"])
    return w > 0.5 and hh > 0.5


def visible_label_rects(page):
    mk = page.evaluate(S.JS_MARKERS)
    labs = [("pill:%s" % m["id"], m["label"]) for m in mk["markers"] if m["label"]]
    labs += [("bio:%s" % b["txt"][:24], b) for b in mk["bio"]]
    return mk, labs


def intersecting(labs):
    return [(a[0], b[0]) for i, a in enumerate(labs) for b in labs[i + 1:] if overlap(a[1], b[1])]


# ------------------------------------------------------------------------------------------------ data-level checks
def check_data(r, h):
    for c in (EU, NA):
        fill = disk(h, "bioregions-%s.geojson" % SUFFIX[c])
        borders = disk(h, "bioregion-borders-%s.geojson" % SUFFIX[c])
        rivers = disk(h, "rivers-%s.geojson" % SUFFIX[c])
        labels = disk(h, "bioregion-labels.json")[c]
        r.check("data:tint-feature-count-%s-is-%d" % (c, EXPECT_TINT[c]), len(fill["features"]) == EXPECT_TINT[c], len(fill["features"]))
        r.check("data:every-tint-feature-has-a-biome-and-a-name-%s" % c,
                all(isinstance(f["properties"].get("b"), int) and f["properties"].get("n") for f in fill["features"]), "")
        bad = [f["properties"] for f in borders["features"]
               if f["properties"].get("a") is None or f["properties"].get("b") is None or f["properties"]["a"] == f["properties"]["b"]
               or f["geometry"]["type"] not in ("LineString", "MultiLineString")]
        r.check("data:boundaries-are-shared-borders-only-no-coastline-%s" % c, bool(borders["features"]) and not bad, bad[:3])
        ids = {f["properties"]["id"] for f in fill["features"]}
        stray = [f["properties"] for f in borders["features"] if f["properties"]["a"] not in ids or f["properties"]["b"] not in ids]
        r.check("data:every-boundary-joins-two-ecoregions-of-the-continent-%s" % c, not stray, stray[:3])
        r.check("data:rivers-carry-a-scalerank-%s" % c, bool(rivers["features"]) and all(isinstance(f["properties"].get("r"), int) for f in rivers["features"]), "")
        r.check("data:labels-have-a-point-a-name-and-a-core-flag-%s" % c,
                bool(labels) and all(isinstance(x.get("lp"), list) and len(x["lp"]) == 2 and x.get("n") and isinstance(x.get("core"), bool) for x in labels), len(labels))
    # the performance gate for the default view (the files the first enable fetches)
    for c in (EU, NA):
        total = gz(h, "bioregions-%s.geojson" % SUFFIX[c]) + gz(h, "bioregion-borders-%s.geojson" % SUFFIX[c]) + gz(h, "bioregion-labels.json")
        r.check("perf:default-view-transfer-%s-within-budget" % c, total <= GZ_BUDGET[c], "%d bytes gzipped (budget %d)" % (total, GZ_BUDGET[c]))
        riv = gz(h, "rivers-%s.geojson" % SUFFIX[c])
        r.info("perf:rivers-extra-%s" % c, "%d bytes gzipped, only when 'Major rivers' is switched on" % riv)


# --------------------------------------------------------------------------------------------------- the desktop run
def run_desktop(r, h, browser, width):
    tag = "@%d" % width
    s, page, log = fresh(h, browser, width, extra_init=[INIT_LONGTASKS])
    try:
        open_panel(page)

        # ---------------------------------------------------------------- manifest and panel
        mf = page.evaluate("""async () => { const e = await import('/src/map/extensions.js'); const b = e.extensions.find((x) => x.id === 'bioregions');
          return b ? { groups: b.groups, layers: b.layers.map((l) => ({ id: l.id, group: l.group, label: l.label, defaultOn: l.defaultOn, role: l.role, legend: l.legend && l.legend.kind,
            sl: l.sourceLine })) } : null; }""")
        r.check("manifest:extension-registered" + tag, mf is not None, mf)
        if mf:
            r.check("manifest:group-place-first" + tag, mf["groups"] and mf["groups"][0]["key"] == "place" and mf["groups"][0]["order"] == 0, mf["groups"])
            ids = [l["id"] for l in mf["layers"]]
            r.check("manifest:two-rows-bioregions-and-rivers" + tag, ids == ["bioregions", "rivers"], ids)
            r.check("manifest:labels-and-defaults" + tag, [(l["label"], l["defaultOn"]) for l in mf["layers"]] == [("Bioregions", True), ("Major rivers", False)], mf["layers"])
            r.check("manifest:both-are-context-layers-not-data-layers" + tag, all(l["role"] == "context" for l in mf["layers"]), [l["role"] for l in mf["layers"]])
            r.check("manifest:legend-kinds-dash-and-line" + tag, [l["legend"] for l in mf["layers"]] == ["dash", "line"], [l["legend"] for l in mf["layers"]])
            for l in mf["layers"]:
                sl = l["sl"] or {}
                r.check("manifest:source-line-names-source-vintage-licence:%s%s" % (l["id"], tag), bool(sl.get("source") and sl.get("vintage") and sl.get("licenseText") and sl.get("text")), sl)
        groups = page.evaluate(S.JS_GROUPS)
        r.check("panel:place-group-leads-the-panel" + tag, bool(groups) and groups[0]["key"] == "place" and groups[0]["rows"] == 2, groups[:1])
        rows = {x["id"]: x for x in page.evaluate(S.JS_ROWS)}
        r.check("panel:bioregions-row-on-rivers-row-off-by-default" + tag, rows.get("bioregions", {}).get("pressed") is True and rows.get("rivers", {}).get("pressed") is False, {k: rows.get(k, {}).get("pressed") for k in ("bioregions", "rivers")})
        for lid, words in (("bioregions", ("RESOLVE Ecoregions 2017", "2017", "CC BY 4.0")), ("rivers", ("Natural Earth", "v5", "domain"))):
            src = (rows.get(lid) or {}).get("src") or ""
            r.check("panel:row-source-line-has-source-vintage-licence:%s%s" % (lid, tag), all(w.lower() in src.lower() for w in words), src)
        r.check("panel:rows-are-keyboard-buttons-with-aria-pressed" + tag, page.evaluate("""() => ['bioregions', 'rivers'].every((id) => { const b = document.querySelector('#map-toggles button.map-toggle[data-layer-id="' + id + '"]');
          return b && b.tagName === 'BUTTON' && (b.getAttribute('aria-pressed') === 'true' || b.getAttribute('aria-pressed') === 'false'); })"""), "")
        r.check("panel:ext-slot-stays-empty" + tag, page.evaluate("() => { const e = document.getElementById('map-ext-slot'); return !!e && e.children.length === 0; }"), "")

        # ---------------------------------------------------------------- lazy: nothing before idle, three requests, none for rivers
        got = bio_requests(s)
        r.check("lazy:three-requests-for-the-first-continent" + tag, sorted(got) == want_files(EU), got)
        r.check("lazy:no-rivers-request-until-the-row-is-switched-on" + tag, riv_requests(s) == [], riv_requests(s))
        times = page.evaluate("""() => ({ idle: window.__firstIdle, starts: (window.__fetchLog || []).map((x) => x[1]) })""")
        r.info("lazy:first-idle-and-fetch-start-times-ms" + tag, {"firstIdle": round(times["idle"] or 0), "starts": [round(t) for t in times["starts"]]})
        r.check("lazy:something-was-fetched-so-the-timing-check-is-not-vacuous" + tag, len(times["starts"]) == 3 and times["idle"] is not None, times)
        r.check("lazy:nothing-fetched-before-the-maps-first-idle" + tag, times["idle"] is not None and all(t >= times["idle"] - 0.5 for t in times["starts"]), times)

        st = page.evaluate(JS_BIO)
        r.check("layers:tint-and-boundaries-present-once-by-default" + tag, st["layers"]["fill"] == 1 and st["layers"]["borders"] == 1 and st["sources"]["fill"] and st["sources"]["borders"], st["layers"])
        r.check("layers:rivers-absent-by-default" + tag, st["layers"]["rivers"] == 0 and st["layers"]["minor"] == 0 and not st["sources"]["rivers"], st["layers"])
        r.check("continent:europe-tint-has-%d-features" % EXPECT_TINT[EU] + tag, st["features"]["fill"] == EXPECT_TINT[EU], st["features"])
        eu_borders = len(disk(h, "bioregion-borders-europe.geojson")["features"])
        r.check("continent:europe-boundaries-match-the-file" + tag, st["features"]["borders"] == eu_borders, (st["features"]["borders"], eu_borders))

        # z-order and paint
        o = page.evaluate(JS_ORDER)
        r.check("layers:above-every-raster" + tag, o["nRaster"] > 5 and o["fill"] > o["maxRaster"] and o["borders"] > o["fill"], o)
        r.check("layers:below-every-vector-overlay" + tag, o["nVector"] > 3 and o["borders"] < o["minVector"], o)
        r.check("layers:below-the-place-names" + tag, o["labels"] < 0 or o["borders"] < o["labels"], o)
        p = page.evaluate(JS_PAINT)
        r.check("layers:tint-opacity-at-most-0.14" + tag, isinstance(p["fillOpacity"], (int, float)) and 0 < p["fillOpacity"] <= 0.14, p["fillOpacity"])
        r.check("layers:tint-colour-follows-the-biome" + tag, isinstance(p["fillColor"], list) and p["fillColor"][0] == "match" and p["fillColor"][1] == ["get", "b"], p["fillColor"])
        r.check("layers:tint-has-no-outline" + tag, "0,0,0,0" in str(p["outline"]).replace(" ", "") or p["outline"] in ("transparent",), p["outline"])
        r.check("layers:boundaries-are-dashed" + tag, p["dash"] == [3, 2], p["dash"])
        r.check("layers:boundaries-widen-with-zoom" + tag, isinstance(p["bWidth"], list) and p["bWidth"][0] == "interpolate", p["bWidth"])
        attrib = page.evaluate(JS_ATTRIB)
        r.check("layers:attribution-names-the-ecoregion-source" + tag, "RESOLVE Ecoregions 2017" in attrib and "CC BY 4.0" in attrib, attrib[:200])

        # labels
        ls = page.evaluate(JS_LABEL_STYLE)
        r.check("labels:aria-hidden-never-clickable-no-popup" + tag, ls is not None and ls["pe"] == "none" and ls["aria"] == "true" and ls["anchorAria"] == "true" and not ls["clickable"] and ls["tabindex"] is None and ls["role"] is None, ls)
        labels_eu = disk(h, "bioregion-labels.json")[EU]
        r.check("labels:one-dom-label-per-ecoregion-label-of-the-continent" + tag, st["labelsInDom"] == len(labels_eu) and st["domContinents"] == [EU], (st["labelsInDom"], len(labels_eu), st["domContinents"]))
        r.check("labels:below-zoom-5-only-core-labels-show" + tag, st["zoom"] < 5 and st["labelsVisible"] > 0 and st["visibleNonCore"] == 0, (st["zoom"], st["labelsVisible"], st["visibleNonCore"]))
        mk, labs = visible_label_rects(page)
        r.check("labels:no-two-visible-labels-intersect-fitted-view" + tag, not intersecting(labs), intersecting(labs)[:4])
        r.check("labels:wide-stage-labels-do-not-sit-under-the-controls" + tag, not [n for n, rc in labs for k in mk["ctrls"] if overlap(rc, k)], "")

        # legend
        lg = page.evaluate(S.JS_LEGEND)
        sec = next((x for x in (lg["secs"] if lg else []) if x["id"] == "bioregions"), None)
        r.check("legend:bioregions-row-appears-when-on" + tag, sec is not None, [x["id"] for x in lg["secs"]] if lg else None)
        if sec:
            r.check("legend:dashed-swatch" + tag, sec["dash"] == 1, sec)
            r.check("legend:row-names-the-boundaries" + tag, "Ecoregion boundaries" in sec["text"], sec["text"])
            r.check("legend:source-vintage-licence-line" + tag, all(w in sec["src"] for w in ("RESOLVE Ecoregions 2017", "2017", "CC BY 4.0")), sec["src"])
            r.check("legend:says-descriptive-context-never-scored" + tag, "never scored" in sec["text"].lower() or "never scored" in (sec["src"] or "").lower(), sec["text"])
        r.check("legend:no-rivers-row-while-rivers-are-off" + tag, not any(x["id"] == "rivers" for x in lg["secs"]), "")

        # ---------------------------------------------------------------- off, on: nothing left behind (three cycles)
        before_req = len(bio_requests(s))
        click_row(page, "bioregions")
        off = page.evaluate(JS_BIO)
        r.check("layers:off-removes-every-layer-and-source" + tag, off["layers"]["fill"] == 0 and off["layers"]["borders"] == 0 and not off["sources"]["fill"] and not off["sources"]["borders"], (off["layers"], off["sources"]))
        r.check("labels:none-in-the-dom-when-off" + tag, off["labelsInDom"] == 0 and off["labelsVisible"] == 0, (off["labelsInDom"], off["labelsVisible"]))
        lg_off = page.evaluate(S.JS_LEGEND)
        r.check("legend:row-gone-when-off" + tag, not any(x["id"] == "bioregions" for x in (lg_off["secs"] if lg_off else [])), "")
        r.check("panel:row-reads-not-pressed-when-off" + tag, row(page, "bioregions").get_attribute("aria-pressed") == "false", "")
        clean_cycles = []
        for i in range(3):
            click_row(page, "bioregions")
            on = page.evaluate(JS_BIO)
            click_row(page, "bioregions")
            off = page.evaluate(JS_BIO)
            clean_cycles.append((on["layers"]["fill"], on["layers"]["borders"], off["layers"]["fill"], off["layers"]["borders"], off["labelsInDom"]))
        r.check("layers:three-off-on-cycles-leave-nothing-behind-and-no-duplicates" + tag, clean_cycles == [(1, 1, 0, 0, 0)] * 3, clean_cycles)
        click_row(page, "bioregions")
        back = page.evaluate(JS_BIO)
        r.check("layers:on-again-restores-tint-boundaries-and-labels" + tag, back["layers"]["fill"] == 1 and back["layers"]["borders"] == 1 and back["labelsInDom"] == len(labels_eu) and back["features"]["fill"] == EXPECT_TINT[EU], back["features"])
        r.check("lazy:switching-off-and-on-costs-no-further-request" + tag, len(bio_requests(s)) == before_req, bio_requests(s))
        r.check("panel:aria-pressed-follows-the-toggle" + tag, row(page, "bioregions").get_attribute("aria-pressed") == "true", "")

        # ---------------------------------------------------------------- rivers
        click_row(page, "rivers", wait=1000)
        rv = page.evaluate(JS_BIO)
        eu_riv = len(disk(h, "rivers-europe.geojson")["features"])
        r.check("lazy:rivers-cost-one-request-on-first-toggle" + tag, riv_requests(s) == ["rivers-europe.geojson"], riv_requests(s))
        r.check("layers:rivers-add-two-style-layers-and-one-source" + tag, rv["layers"]["rivers"] == 1 and rv["layers"]["minor"] == 1 and rv["sources"]["rivers"], rv["layers"])
        r.check("layers:rivers-source-holds-the-continents-file" + tag, rv["features"]["rivers"] == eu_riv, (rv["features"]["rivers"], eu_riv))
        o2 = page.evaluate(JS_ORDER)
        r.check("layers:order-tint-minor-rivers-rivers-boundaries" + tag, o2["fill"] < o2["minor"] < o2["rivers"] < o2["borders"] < o2["minVector"], o2)
        p2 = page.evaluate(JS_PAINT)
        r.check("layers:rivers-thin-and-half-opaque" + tag, p2["rWidth"] == 0.8 and p2["rOpacity"] == 0.5, (p2["rWidth"], p2["rOpacity"]))
        r.check("layers:minor-rivers-wait-for-zoom-5-and-major-ones-always-show" + tag, p2["minorMinZoom"] == 5 and p2["rFilter"] and p2["rFilter"][0] == "<=" and p2["minorFilter"] and p2["minorFilter"][0] == ">", (p2["minorMinZoom"], p2["rFilter"], p2["minorFilter"]))
        r.check("layers:attribution-names-natural-earth" + tag, "Natural Earth" in page.evaluate(JS_ATTRIB), page.evaluate(JS_ATTRIB)[:200])
        lg2 = page.evaluate(S.JS_LEGEND)
        rsec = next((x for x in lg2["secs"] if x["id"] == "rivers"), None)
        r.check("legend:rivers-row-appears-with-source-vintage-licence" + tag, rsec is not None and "Natural Earth" in rsec["src"] and "v5" in rsec["src"] and "domain" in rsec["src"].lower(), rsec)
        click_row(page, "rivers")
        gone = page.evaluate(JS_BIO)
        r.check("layers:rivers-off-removes-both-layers-and-the-source" + tag, gone["layers"]["rivers"] == 0 and gone["layers"]["minor"] == 0 and not gone["sources"]["rivers"], gone["layers"])
        click_row(page, "rivers", wait=800)
        click_row(page, "rivers")
        r.check("lazy:rivers-again-costs-no-further-request" + tag, riv_requests(s) == ["rivers-europe.geojson"], riv_requests(s))
        gone2 = page.evaluate(JS_BIO)
        r.check("layers:rivers-two-more-toggles-leave-nothing-behind" + tag, gone2["layers"]["rivers"] == 0 and gone2["layers"]["minor"] == 0, gone2["layers"])

        # ---------------------------------------------------------------- continent switch
        n0 = len(bio_requests(s))
        click_tab(page, NA)
        got_na = bio_requests(s)[n0:]
        r.check("lazy:three-requests-for-north-america-on-its-first-visit" + tag, sorted(got_na) == want_files(NA), got_na)
        na = page.evaluate(JS_BIO)
        r.check("continent:north-america-tint-has-%d-features" % EXPECT_TINT[NA] + tag, na["features"]["fill"] == EXPECT_TINT[NA], na["features"])
        na_b = len(disk(h, "bioregion-borders-na.geojson")["features"])
        r.check("continent:north-america-boundaries-match-the-file" + tag, na["features"]["borders"] == na_b, (na["features"]["borders"], na_b))
        labels_na = disk(h, "bioregion-labels.json")[NA]
        r.check("continent:labels-are-the-new-continents-only" + tag, na["labelsInDom"] == len(labels_na) and na["domContinents"] == [NA], (na["labelsInDom"], len(labels_na), na["domContinents"]))
        r.check("continent:no-duplicate-style-layers-after-the-switch" + tag, na["layers"]["fill"] == 1 and na["layers"]["borders"] == 1, na["layers"])
        r.check("labels:north-america-below-zoom-5-only-core" + tag, na["zoom"] < 5 and na["visibleNonCore"] == 0, (na["zoom"], na["visibleNonCore"]))
        mk, labs = visible_label_rects(page)
        r.check("labels:no-two-visible-labels-intersect-north-america" + tag, not intersecting(labs), intersecting(labs)[:4])
        # a switch while rivers are on swaps the rivers too, from a single new request
        click_row(page, "rivers", wait=1000)
        nr = page.evaluate(JS_BIO)
        na_r = len(disk(h, "rivers-na.geojson")["features"])
        r.check("continent:rivers-follow-the-continent" + tag, nr["features"]["rivers"] == na_r and riv_requests(s) == ["rivers-europe.geojson", "rivers-na.geojson"], (nr["features"]["rivers"], na_r, riv_requests(s)))
        click_row(page, "rivers")
        n1 = len(bio_requests(s))
        click_tab(page, EU)
        eu_again = page.evaluate(JS_BIO)
        r.check("continent:back-to-europe-swaps-the-data-back" + tag, eu_again["features"]["fill"] == EXPECT_TINT[EU] and eu_again["labelsInDom"] == len(labels_eu) and eu_again["domContinents"] == [EU], (eu_again["features"], eu_again["labelsInDom"]))
        r.check("lazy:returning-to-a-continent-costs-no-further-request" + tag, len(bio_requests(s)) == n1, bio_requests(s)[n1:])
        # the continent switch with the layer OFF: nothing is added, nothing fetched
        click_row(page, "bioregions")
        n2 = len(bio_requests(s))
        click_tab(page, NA)
        offsw = page.evaluate(JS_BIO)
        r.check("continent:switch-with-the-layer-off-adds-nothing" + tag, offsw["layers"]["fill"] == 0 and offsw["labelsInDom"] == 0 and len(bio_requests(s)) == n2, (offsw["layers"], bio_requests(s)[n2:]))
        click_row(page, "bioregions")
        click_tab(page, EU)

        # ---------------------------------------------------------------- zoom gate on the labels
        page.evaluate(JS_JUMP_TO, [[-5.1, 57.8], 5.6])
        page.wait_for_timeout(900)
        z5 = page.evaluate(JS_BIO)
        r.check("labels:from-zoom-5-the-non-core-labels-may-show" + tag, z5["zoom"] >= 5 and z5["labelsVisible"] >= 1, (z5["zoom"], z5["labelsVisible"], z5["visibleNonCore"]))
        mk, labs = visible_label_rects(page)
        r.check("labels:no-two-visible-labels-intersect-at-zoom-5-6" + tag, not intersecting(labs), intersecting(labs)[:4])
        r.check("labels:none-clipped-by-the-stage-at-zoom-5-6" + tag, all(rc["l"] >= mk["stage"]["l"] - 0.5 and rc["r"] <= mk["stage"]["r"] + 0.5 and rc["t"] >= mk["stage"]["t"] - 0.5 and rc["b"] <= mk["stage"]["b"] + 0.5 for _n, rc in labs), "")

        # ---------------------------------------------------------------- theme: a style swap re-adds everything from memory
        page.evaluate("() => { const m = window.__maps[0]; m.jumpTo({ center: [3, 48], zoom: 4 }); }")
        page.wait_for_timeout(500)
        n3 = len(bio_requests(s))
        page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
        page.wait_for_timeout(2500)
        dk = page.evaluate(JS_BIO)
        pk = page.evaluate(JS_PAINT)
        r.check("theme:layers-come-back-after-the-style-swap-to-dark" + tag, dk["layers"]["fill"] == 1 and dk["layers"]["borders"] == 1 and dk["features"]["fill"] == EXPECT_TINT[EU], (dk["layers"], dk["features"]))
        r.check("theme:dark-palette-in-the-tint" + tag, isinstance(pk["fillColor"], list) and "#7fc08a" in pk["fillColor"], pk["fillColor"])
        r.check("theme:the-swap-costs-no-request" + tag, len(bio_requests(s)) == n3, bio_requests(s)[n3:])
        r.check("theme:labels-survive-the-swap" + tag, dk["labelsInDom"] == len(labels_eu), dk["labelsInDom"])
        page.evaluate("() => document.documentElement.setAttribute('data-theme', 'light')")
        page.wait_for_timeout(2500)
        lt = page.evaluate(JS_BIO)
        pl = page.evaluate(JS_PAINT)
        r.check("theme:and-back-to-light" + tag, lt["layers"]["fill"] == 1 and lt["layers"]["borders"] == 1 and isinstance(pl["fillColor"], list) and "#4f8a5a" in pl["fillColor"], (lt["layers"], pl["fillColor"]))
        r.check("theme:swap-keeps-the-order-above-rasters-below-vectors" + tag, (lambda q: q["fill"] > q["maxRaster"] and q["borders"] < q["minVector"])(page.evaluate(JS_ORDER)), "")

        # ---------------------------------------------------------------- performance: the parse cost of the largest file
        cost = page.evaluate(JS_PARSE_COST, h.base + "/data/processed/bioregions-na.geojson")
        r.check("perf:parsing-the-largest-file-is-far-under-50ms" + tag, cost["ms"] <= 50, "%.1f ms for %d bytes" % (cost["ms"], cost["bytes"]))
        sd = page.evaluate(JS_SETDATA_COST)
        r.check("perf:handing-the-tint-to-the-map-is-far-under-50ms-on-the-main-thread" + tag, sd is not None and sd["ms"] <= 50, sd)
        lt = page.evaluate(JS_LONGTASKS)
        after = [round(x["dur"]) for x in lt["tasks"] if lt["idle"] is not None and x["start"] >= lt["idle"]]
        r.info("perf:long-tasks-after-the-first-idle-ms" + tag, "%s (rendering on a software GL driver included; the parse and setData costs above are the extension's own)" % after[:12])

        clean(r, tag, log, "desktop")
        r.check("harness:no-formsubmit-desktop" + tag, not s.guard.formsubmit, s.guard.formsubmit)
    finally:
        s.close()


# --------------------------------------------------------------------------------------------------- a failed file
def run_failure(r, h, browser, width):
    tag = "@%d" % width
    s = h.session(browser, width=width, storage=default_storage(h.site), stub=True, extra_init=[INIT_FIRST_IDLE])
    s.context.route(ARCGIS, lambda route, request: route.fulfill(status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"}))
    state = {"fail": True}

    def flaky(route, request):
        if state["fail"]:
            route.fulfill(status=500, content_type="text/plain", body="down")
        else:
            route.continue_()
    s.context.route(re.compile(r".*/data/processed/bioregion-borders-europe\.geojson$"), flaky)
    page = s.page()
    log = s.log(page)
    try:
        goto_settled(page, h.base + "/", extra_ms=1200)
        open_panel(page)
        st = page.evaluate(JS_BIO)
        r.check("failure:the-map-goes-on-with-no-extension-layers-data" + tag, st is not None and not st["features"]["fill"] and st["labelsInDom"] == 0, st and (st["features"], st["labelsInDom"]))
        note = page.evaluate("() => { const n = document.querySelector('.map-layer-note[data-layer-note=\"bioregions\"]'); const b = document.querySelector('#map-toggles button[data-layer-id=\"bioregions\"]'); return n ? { text: n.textContent, linked: !!b && (b.getAttribute('aria-describedby') || '').includes(n.id), after: n.previousElementSibling === b } : null; }")
        r.check("failure:the-row-says-so-in-words" + tag, note is not None and "could not be loaded" in note["text"] and note["linked"] and note["after"], note)
        errs = [e for e in log.errors() if not str(e.get("text", "")).startswith("Failed to load resource")]
        errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
        r.check("failure:no-console-error-from-the-page" + tag, not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))
        state["fail"] = False
        click_row(page, "bioregions", wait=400)    # off
        click_row(page, "bioregions", wait=1200)   # on: tries again
        st2 = page.evaluate(JS_BIO)
        gone = page.evaluate("() => !document.querySelector('.map-layer-note[data-layer-note=\"bioregions\"]')")
        r.check("failure:the-next-toggle-tries-again-and-recovers" + tag, st2["features"]["fill"] == EXPECT_TINT[EU] and st2["labelsInDom"] > 0 and gone, (st2["features"], st2["labelsInDom"], gone))
        r.check("harness:no-formsubmit-failure" + tag, not s.guard.formsubmit, s.guard.formsubmit)
    finally:
        s.close()


# --------------------------------------------------------------------------------------------------- a slow switch
def run_slow_switch(r, h, browser, width):
    """While the new continent's files are on their way the map holds NOTHING of the old one (no stale polygons or labels)."""
    tag = "@%d" % width
    s = h.session(browser, width=width, storage=default_storage(h.site), stub=True, extra_init=[INIT_FIRST_IDLE])
    s.context.route(ARCGIS, lambda route, request: route.fulfill(status=200, content_type="image/png", body=PNG_1X1, headers={"access-control-allow-origin": "*"}))
    held = []
    hold = {"on": True}

    def slow(route, request):
        if hold["on"]:
            held.append(route)
        else:
            route.continue_()
    s.context.route(re.compile(r".*/data/processed/(bioregions-na|bioregion-borders-na)\.geojson$"), slow)
    page = s.page()
    log = s.log(page)
    try:
        goto_settled(page, h.base + "/", extra_ms=900)
        open_panel(page)
        click_tab(page, NA, wait=900)
        mid = page.evaluate(JS_BIO)
        r.check("continent:while-the-files-are-on-their-way-the-source-holds-nothing-of-europe" + tag, len(held) == 2 and mid["features"]["fill"] == 0 and mid["features"]["borders"] == 0, (len(held), mid["features"]))
        r.check("continent:while-they-are-on-their-way-no-european-label-stays" + tag, mid["labelsInDom"] == 0, mid["labelsInDom"])
        r.check("continent:the-layers-stay-in-place-meanwhile" + tag, mid["layers"]["fill"] == 1 and mid["layers"]["borders"] == 1, mid["layers"])
        hold["on"] = False
        for rt in held:
            rt.continue_()
        page.wait_for_timeout(1500)
        end = page.evaluate(JS_BIO)
        r.check("continent:then-the-new-continent-arrives" + tag, end["features"]["fill"] == EXPECT_TINT[NA] and end["labelsInDom"] > 0 and end["domContinents"] == [NA], (end["features"], end["labelsInDom"]))
        r.check("harness:no-formsubmit-slow-switch" + tag, not s.guard.formsubmit, s.guard.formsubmit)
        clean(r, tag, log, "slow-switch")
    finally:
        s.close()


# --------------------------------------------------------------------------------------------------- a phone stage
def run_narrow(r, h, browser, width):
    tag = "@%d" % width
    s, page, log = fresh(h, browser, width)
    try:
        st = page.evaluate(JS_BIO)
        r.check("layers:phone-layers-present" + tag, st["layers"]["fill"] == 1 and st["layers"]["borders"] == 1, st["layers"])
        r.check("labels:phone-stage-shows-no-bioregion-label" + tag, st["labelsVisible"] == 0, st["labelsVisible"])
        r.check("lazy:phone-three-requests" + tag, sorted(bio_requests(s)) == want_files(EU), bio_requests(s))
        page.click(SEL["layers_toggle"])
        page.wait_for_timeout(250)
        page.evaluate(S.JS_OPEN_ALL_GROUPS)
        taps = page.evaluate(S.JS_TAPS)
        r.check("panel:phone-rows-are-44px-tap-targets" + tag, not taps, taps[:4])
        click_row(page, "bioregions")
        off = page.evaluate(JS_BIO)
        r.check("layers:phone-off-removes-them" + tag, off["layers"]["fill"] == 0 and off["layers"]["borders"] == 0, off["layers"])
        clean(r, tag, log, "phone")
        r.check("harness:no-formsubmit-phone" + tag, not s.guard.formsubmit, s.guard.formsubmit)
    finally:
        s.close()


# --------------------------------------------------------------------------------------------------- screenshots
VIEWS = [
    ("scottish-highlands", EU, [-5.1, 57.8], (3, 5, 6.3)),
    ("valle-maira", EU, [7.1, 44.45], (3, 5, 6.3)),
    ("driftless", NA, [-90.8, 43.5], (3, 5, 6.3)),
    ("na-overview", NA, [-100, 45], (3, 5, 6.3)),
]


def run_shots(r, h, browser):
    SHOTS.mkdir(parents=True, exist_ok=True)
    for scheme in ("light", "dark"):
        s, page, log = fresh(h, browser, 1280, scheme="light", stub=False)
        try:
            if scheme == "dark":
                page.evaluate("() => document.documentElement.setAttribute('data-theme', 'dark')")
                page.wait_for_timeout(2500)
                gate = page.evaluate("() => { const c = getComputedStyle(document.documentElement); const probe = document.createElement('i'); probe.style.cssText = 'color:var(--paper)'; document.body.appendChild(probe); const col = getComputedStyle(probe).color; probe.remove(); return { scheme: c.colorScheme, paper: col }; }")
                m = re.match(r"rgb\((\d+), (\d+), (\d+)\)", gate["paper"] or "")
                lum = (int(m.group(1)) + int(m.group(2)) + int(m.group(3))) / 3 if m else 255
                if lum > 128:
                    r.info("shots:dark-skipped", "the theme gate is closed (the page stays light under data-theme=dark: %s); dark shots are taken once MC-A11Y opens it" % gate)
                    continue
            open_panel(page)
            for name, cont, center, zooms in VIEWS:
                if page.evaluate(S.JS_ACTIVE_CONTINENT) != cont:
                    click_tab(page, cont, wait=1600)
                page.locator(SEL["map"]).scroll_into_view_if_needed()
                for z in zooms:
                    page.evaluate(JS_JUMP_TO, [center, z])
                    page.wait_for_timeout(2200)
                    f = SHOTS / ("%s-z%s-%s.png" % (name, str(z).replace(".", "_"), scheme))
                    page.locator(SEL["map"]).screenshot(path=str(f))
                    mk, labs = visible_label_rects(page)
                    clash = intersecting(labs)
                    r.check("shots:%s-z%s-%s-no-two-labels-intersect" % (name, z, scheme), not clash, clash[:3])
                    r.check("shots:%s-z%s-%s-written" % (name, z, scheme), f.is_file() and f.stat().st_size > 2000, str(f))
            clean(r, "@1280", log, "shots-" + scheme)
        finally:
            s.close()


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    check_data(r, h)
    for width in h.widths:
        browser = h.launch()
        try:
            if width >= 900:
                run_desktop(r, h, browser, width)
                run_failure(r, h, browser, width)
                run_slow_switch(r, h, browser, width)
                if width == max(h.widths):
                    run_shots(r, h, browser)
            else:
                run_narrow(r, h, browser, width)
        finally:
            h.close_browser(browser)
    return r.out
