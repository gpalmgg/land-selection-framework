"""test_scale: the page at many regions. Run it on the real scratch site and on the stress site (scripts/make_stress_site.mjs).

  * the continent is part of the URL: a tab switch writes ?c=, the default continent leaves the URL bare, a link opens the tab it
    names, a legacy ?pin=<region> link (no c) opens the continent of its first pinned region
  * a write keeps foreign parameters (utm_*, modal=1) and the #hash
  * switching continents leaves no node of the hidden continent visible; every card of the active one is shown
  * the hiding rule is generated (<style id="continent-rules">) from the continents the page has
  * one refresh per frame: 20 slider inputs in one task rewrite the match count once; p95 of a slider tick is at most 100 ms
  * cache:invalidate is emitted when the continent changes
  * the dead client og:image rewrite is gone (the meta tag does not move with the filters)
  * the cards grid and the summary table scroll without page overflow; card names fit
  * no console error, no page error, nothing submitted

Nothing is ever submitted: the harness aborts and records every formsubmit.co request.
"""
from lib import sel as _sel
from lib.site import default_storage, goto_settled

NAME = "test_scale"
S = _sel.load("scale")
SEL = S.SEL
TICK_P95_MS = 100
TICKS = 40


def main_thread_ms(cdp):
    """Main-thread busy time so far in ms (TaskDuration: script, style, layout and paint work on the main thread)."""
    m = cdp.send("Performance.getMetrics")["metrics"]
    return next(x["value"] for x in m if x["name"] == "TaskDuration") * 1000.0


def tick_stats(s, page):
    """(p50, p95, max) of the main-thread cost of TICKS slider ticks, and the same for the frame latency. None when the browser
    has no DevTools protocol (webkit, firefox)."""
    try:
        cdp = s.context.new_cdp_session(page)
        cdp.send("Performance.enable")
    except Exception:
        return None
    work, frame = [], []
    for i in range(TICKS):
        before = main_thread_ms(cdp)
        frame.append(page.evaluate(S.JS_ONE_TICK, ((i * 37) % 100) / 100.0))
        work.append(main_thread_ms(cdp) - before)

    def pick(xs):
        xs = sorted(xs)
        return {"p50": xs[len(xs) // 2], "p95": xs[int(-(-len(xs) * 95 // 100)) - 1], "max": xs[-1]}
    return {"work": pick(work), "frame": pick(frame), "n": TICKS}


def fresh(h, browser, width, path="/", storage="subscribed"):
    st = default_storage(h.site, modal=False) if storage == "subscribed" else default_storage(h.site, modal=True)
    s = h.session(browser, width=width, storage=st, stub=True)
    page = s.page()
    goto_settled(page, h.base + path, extra_ms=400)
    return s, page


def active_continent(page):
    return page.evaluate("document.body.dataset.continent")


def query(page):
    return page.evaluate("location.search")


def click_tab(page, continent):
    tab = page.locator('%s[data-continent="%s"]' % (SEL["tab"], continent))
    tab.scroll_into_view_if_needed()
    tab.click()
    page.wait_for_timeout(500)


def move_slider(page, frac=0.5):
    page.evaluate("""(f) => { const s = document.querySelector('.criteria input[type=range]'); const min = +s.min, max = +s.max;
      s.value = String(min + (max - min) * f); s.dispatchEvent(new Event('input', { bubbles: true })); }""", frac)
    page.wait_for_timeout(800)   # the URL write is debounced 400 ms


def clean(r, tag, log, label):
    errs = log.errors() + [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            # ---------------------------------------------------------------- the page itself: sizes, hidden continent, layout
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                regions = page.evaluate(S.JS_REGIONS)
                tabs = page.evaluate(S.JS_TABS)
                conts = [t["continent"] for t in tabs]
                default = next((t["continent"] for t in tabs if t["active"]), conts[0] if conts else None)
                r.check("two-or-more-continents" + tag, len(conts) >= 2, conts)
                r.info("region-counts" + tag, {c: len(v) for c, v in regions.items()})
                if len(conts) < 2:
                    return r.out
                r.check("default-continent-bare-url" + tag, query(page) == "", query(page))
                rules = page.evaluate("Array.from(document.querySelectorAll('style#continent-rules')).map((t) => t.textContent)")
                r.check("continent-rules-style-injected" + tag, len(rules) == 1 and all(('body[data-continent="%s"]' % c) in rules[0] for c in conts),
                        "style tags: %d; continents %s" % (len(rules), conts))
                layout = page.evaluate(S.JS_LAYOUT)
                r.check("cards-equal-summary-columns" + tag, layout["cardsTotal"] == layout["sumColumnsTotal"], layout)

                for c in conts:
                    if active_continent(page) != c:
                        click_tab(page, c)
                    r.check("tab-active:%s%s" % (c, tag), active_continent(page) == c and page.evaluate(
                        "(c) => document.querySelector('.continent-tab.active').dataset.continent === c && document.querySelector('.continent-tab.active').getAttribute('aria-selected') === 'true'", c))
                    hv = page.evaluate(S.JS_HIDDEN_VISIBLE)
                    r.check("no-hidden-continent-node-visible:%s%s" % (c, tag), hv["visibleOther"] == 0, hv)
                    r.check("active-continent-cards-all-shown:%s%s" % (c, tag), hv["cards"] == len(regions.get(c, [])) and hv["cardsShown"] == hv["cards"], hv)
                    lay = page.evaluate(S.JS_LAYOUT)
                    r.check("no-page-overflow:%s%s" % (c, tag), lay["pageOverflow"] <= 1, "%s px" % lay["pageOverflow"])
                    t = lay["table"] or {}
                    r.check("summary-table-scrolls-inside-its-box:%s%s" % (c, tag), bool(t.get("scrollBox")) or (t.get("width") or 0) <= width, lay["table"])
                    r.check("cards-grid-no-overflow:%s%s" % (c, tag), (lay["grid"] or {}).get("over", 0) <= 1, lay["grid"])
                    r.check("card-names-fit:%s%s" % (c, tag), not lay["namesOverflowing"], lay["namesOverflowing"][:4])
                    r.info("layout:%s%s" % (c, tag), {"visibleColumns": lay["visibleColumns"], "table": lay["table"]})

                # cache:invalidate on a continent change (back to the default first, so the next switch is a change)
                if active_continent(page) != default:
                    click_tab(page, default)
                other = next(c for c in conts if c != default)
                try:
                    got = page.evaluate(S.JS_INVALIDATE, other)
                    r.check("cache-invalidate-emitted-on-continent-change" + tag, ("continent:%s:%d" % (other, sum(len(v) for v in regions.values()))) in got, got)
                    r.check("cache-invalidate-not-emitted-for-region-count" + tag, not any(g.startswith("regions:") for g in got), got)
                except Exception as e:
                    r.check("cache-invalidate-emitted-on-continent-change" + tag, False, "could not import the modules: %s" % str(e)[:200])
                clean(r, tag, log, "page")
                r.check("no-formsubmit-page" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ---------------------------------------------------------------- continent in the URL
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                regions = page.evaluate(S.JS_REGIONS)
                conts = [t["continent"] for t in page.evaluate(S.JS_TABS)]
                default = conts[0]
                other = next(c for c in conts if c != default)
                click_tab(page, other)
                r.check("tab-switch-writes-c" + tag, ("c=%s" % other) in query(page), query(page))
                click_tab(page, default)
                r.check("default-tab-clears-c" + tag, "c=" not in query(page) and query(page) == "", query(page))
                clean(r, tag, log, "switch")
            finally:
                s.close()

            for label, build in (
                ("explicit-c-and-pin", lambda reg, d, o: ("/?c=%s&pin=%s" % (o, reg[o][0]), o, reg[o][0], 1)),
                ("legacy-pin-without-c", lambda reg, d, o: ("/?pin=%s" % reg[o][0], o, reg[o][0], 1)),
                ("pin-order-decides", lambda reg, d, o: ("/?pin=%s,%s" % (reg[d][0], reg[o][0]), d, reg[d][0], 2)),
                ("explicit-c-beats-pin", lambda reg, d, o: ("/?c=%s&pin=%s" % (d, reg[o][0]), d, reg[o][0], 1)),
            ):
                s0, p0 = fresh(h, browser, width)
                try:
                    reg = p0.evaluate(S.JS_REGIONS)
                    cs = [t["continent"] for t in p0.evaluate(S.JS_TABS)]
                finally:
                    s0.close()
                d, o = cs[0], next(c for c in cs if c != cs[0])
                path, want, pin, npins = build(reg, d, o)
                s, page = fresh(h, browser, width, path=path)
                try:
                    log = s.log(page)
                    tabs = page.evaluate(S.JS_TABS)
                    sel = next((t["continent"] for t in tabs if t["selected"] == "true"), None)
                    r.check("link-opens-tab:%s%s" % (label, tag), active_continent(page) == want and sel == want, "%s -> body %s, selected tab %s" % (path, active_continent(page), sel))
                    card = page.locator("#region-%s" % pin)
                    shown = card.count() == 1 and card.is_visible()
                    starred = page.evaluate("(id) => { const c = document.getElementById('region-' + id); return !!c && c.classList.contains('starred'); }", pin)
                    btn = page.inner_text(SEL["shortlist_btn"])
                    if want == o and label != "explicit-c-beats-pin":
                        r.check("pinned-card-visible:%s%s" % (label, tag), shown and starred and ("(%d)" % npins) in btn, "visible=%s starred=%s button=%s" % (shown, starred, btn))
                    else:
                        r.check("pinned-card-restored:%s%s" % (label, tag), starred and ("(%d)" % npins) in btn, "starred=%s button=%s (visible=%s)" % (starred, btn, shown))
                    hv = page.evaluate(S.JS_HIDDEN_VISIBLE)
                    r.check("no-hidden-continent-node-visible:%s%s" % (label, tag), hv["visibleOther"] == 0, hv)
                    r.check("no-page-overflow:%s%s" % (label, tag), page.evaluate(S.JS_LAYOUT)["pageOverflow"] <= 1)
                    clean(r, tag, log, label)
                    r.check("no-formsubmit:%s%s" % (label, tag), not s.guard.formsubmit)
                finally:
                    s.close()

            s, page = fresh(h, browser, width, path="/?c=nowhere")
            try:
                tabs = page.evaluate(S.JS_TABS)
                r.check("invalid-c-ignored" + tag, active_continent(page) == tabs[0]["continent"], active_continent(page))
            finally:
                s.close()

            # ---------------------------------------------------------------- foreign parameters and the hash survive a write
            s, page = fresh(h, browser, width, path="/?utm_source=stress&utm_campaign=scale#criteria")
            try:
                log = s.log(page)
                og0 = page.evaluate("(s) => (document.querySelector(s) || {}).content", SEL["og_image"])
                move_slider(page, 0.3)
                q = query(page)
                r.check("slider-write-keeps-utm" + tag, "utm_source=stress" in q and "utm_campaign=scale" in q and "t." in q, q)
                r.check("slider-write-keeps-hash" + tag, page.evaluate("location.hash") == "#criteria", page.evaluate("location.hash"))
                star = page.locator(SEL["star"]).first
                star.scroll_into_view_if_needed()
                star.click()
                page.wait_for_timeout(300)
                q2 = query(page)
                r.check("pin-write-keeps-utm" + tag, "utm_source=stress" in q2 and "pin=" in q2 and "t." in q2, q2)
                other = next(t["continent"] for t in page.evaluate(S.JS_TABS) if t["continent"] != active_continent(page))
                click_tab(page, other)
                q3 = query(page)
                r.check("continent-write-keeps-utm" + tag, "utm_source=stress" in q3 and ("c=%s" % other) in q3, q3)
                og1 = page.evaluate("(s) => (document.querySelector(s) || {}).content", SEL["og_image"])
                r.check("og-image-meta-not-rewritten" + tag, og0 == og1, "%s -> %s" % (og0, og1))
                clean(r, tag, log, "foreign")
                r.check("no-formsubmit-foreign" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            s, page = fresh(h, browser, width, path="/?modal=1&utm_source=stress", storage="none")
            try:
                page.wait_for_selector("%s.visible" % SEL["modal"], timeout=5000)
                page.locator(SEL["modal_close"]).click()
                page.wait_for_timeout(500)
                move_slider(page, 0.4)
                q = query(page)
                r.check("slider-write-keeps-modal-and-utm" + tag, "modal=1" in q and "utm_source=stress" in q and "t." in q, q)
                r.check("no-formsubmit-modal" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ---------------------------------------------------------------- one refresh per frame, tick time
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                page.locator(SEL["slider"]).first.scroll_into_view_if_needed()
                burst = page.evaluate(S.JS_BURST)
                r.check("refresh-coalesced-20-inputs-write-match-count-at-most-twice" + tag, burst["writes"] <= 2, burst)
                r.check("refresh-coalesced-result-is-current" + tag, str(burst["meeting"]) == burst["count"], burst)
                try:
                    sync_writes = page.evaluate(S.JS_SYNC_CONTROL)
                    r.check("burst-detector-positive-control" + tag, sync_writes >= 20, "20 direct refreshAll() calls wrote #match-count %d times" % sync_writes)
                except Exception as e:
                    r.check("burst-detector-positive-control" + tag, False, str(e)[:200])
                ticks = tick_stats(s, page)
                if ticks is None:
                    r.skip("slider-tick-p95" + tag, "no DevTools protocol in this browser")
                else:
                    r.check("slider-tick-p95-at-most-%dms%s" % (TICK_P95_MS, tag), ticks["work"]["p95"] <= TICK_P95_MS,
                            "main-thread work per tick: p50 %.1f ms, p95 %.1f ms, max %.1f ms (n=%d)" % (ticks["work"]["p50"], ticks["work"]["p95"], ticks["work"]["max"], ticks["n"]))
                    r.info("slider-tick-main-thread" + tag, "per tick: p50 %.1f ms, p95 %.1f ms, max %.1f ms" % (ticks["work"]["p50"], ticks["work"]["p95"], ticks["work"]["max"]))
                    r.info("slider-tick-frame-latency" + tag, "input to second frame: p50 %.1f ms, p95 %.1f ms (headless software rasteriser, not asserted)" % (ticks["frame"]["p50"], ticks["frame"]["p95"]))
                other = next(t["continent"] for t in page.evaluate(S.JS_TABS) if t["continent"] != active_continent(page))
                click_tab(page, other)
                page.locator(SEL["slider"]).first.scroll_into_view_if_needed()
                ticks2 = tick_stats(s, page)
                if ticks2 is not None:
                    r.check("slider-tick-p95-at-most-%dms-on-%s%s" % (TICK_P95_MS, other, tag), ticks2["work"]["p95"] <= TICK_P95_MS,
                            "main-thread work per tick: p50 %.1f ms, p95 %.1f ms, max %.1f ms" % (ticks2["work"]["p50"], ticks2["work"]["p95"], ticks2["work"]["max"]))
                clean(r, tag, log, "ticks")
            finally:
                s.close()
        finally:
            h.close_browser(browser)
    return r.out
