"""interactions: the visitor-facing behaviour of `/` through real input events. Nothing is ever submitted.

continent tabs (arrow keys), slider by keyboard and by value, preset apply and reset, qualitative filter select, pin 3 regions,
compare open and close, drawer open (Enter on the card) and close with focus returned, URL state round trip, share link restore,
?modal=1 displays the modal, a seeded subscribed state keeps the modal closed, and the ANALYTICS GUARD: every event name the
baseline fired still fires with the same payload keys (verify/baseline/analytics.json). New events are allowed.
"""
import json
import re
from pathlib import Path
from urllib.parse import unquote

from lib import sel as _sel
from lib.site import default_storage, goto_settled, storage_keys, wait_map_idle
from lib.util import read_json

NAME = "interactions"
S = _sel.home()
SEL = S.SEL


def is_open(page, css):
    return page.evaluate("(s) => { const e = document.querySelector(s); return !!e && (e.classList.contains('open') || e.getAttribute('aria-hidden') === 'false'); }", css)


def cards(page):
    return page.evaluate("""() => { const cs = Array.from(document.querySelectorAll('.region-card')).filter(c => c.getClientRects().length);
      return {visible: cs.length, fail: cs.filter(c => c.classList.contains('fail')).length,
              status: cs.map(c => ((c.querySelector('.status') || {}).textContent || '').trim()), names: cs.map(c => (c.querySelector('.name') || {}).textContent) }; }""")


def match(page):
    return {"count": page.inner_text(SEL["match_count"]).strip(), "total": page.inner_text(SEL["match_total"]).strip()}


def query(page):
    return page.evaluate("location.search")


def fresh(h, browser, width, path="/", storage="subscribed", **kw):
    st = default_storage(h.site, modal=False) if storage == "subscribed" else (default_storage(h.site, modal=True) if storage == "none" else storage)
    s = h.session(browser, width=width, storage=st, stub=True, permissions=["clipboard-read", "clipboard-write"], **kw)
    page = s.page()
    goto_settled(page, h.base + path, extra_ms=400)
    return s, page


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    all_events = []
    keyname, subscribed = storage_keys(h.site)
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            # ------------------------------------------------------------- tabs (arrow keys)
            s, page = fresh(h, browser, width)
            try:
                tabs = page.locator(SEL["continent_tab"])
                r.check("tabs-present" + tag, tabs.count() >= 2, "%d tabs" % tabs.count())
                active = page.locator(SEL["continent_tab"] + ".active")
                before = page.evaluate("document.body.dataset.continent")
                active.first.focus()
                page.keyboard.press("ArrowRight")
                page.wait_for_timeout(500)
                after = page.evaluate("document.body.dataset.continent")
                focus_ok = page.evaluate("document.activeElement && document.activeElement.classList.contains('continent-tab') && document.activeElement.dataset.continent === document.body.dataset.continent")
                r.check("tabs-arrow-right" + tag, after != before and focus_ok, "%s -> %s focus_on_new_tab=%s" % (before, after, focus_ok))
                page.keyboard.press("ArrowLeft")
                page.wait_for_timeout(500)
                r.check("tabs-arrow-left" + tag, page.evaluate("document.body.dataset.continent") == before, "back to %s" % before)
                r.check("tabs-aria-selected" + tag, page.evaluate("document.querySelector('.continent-tab.active').getAttribute('aria-selected')") == "true")
                all_events += s.events(page)
                r.check("no-formsubmit-tabs" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- sliders
            s, page = fresh(h, browser, width)
            try:
                sl = page.locator(SEL["slider"]).first
                meta = page.evaluate("s => ({id: s.id, min: s.min, max: s.max, value: s.value})", sl.element_handle())
                sl.scroll_into_view_if_needed()
                sl.focus()
                seen = {}
                for key in ("Home", "End"):
                    page.keyboard.press(key)
                    page.wait_for_timeout(700)
                    seen[key] = {"value": page.evaluate("s => s.value", sl.element_handle()), "query": query(page), "match": match(page)["count"], "fail": cards(page)["fail"]}
                changed = seen["Home"]["value"] != seen["End"]["value"]
                r.check("slider-keyboard-moves" + tag, changed, seen)
                r.check("slider-keyboard-writes-url" + tag, any("t." in v["query"] for v in seen.values()), {k: v["query"] for k, v in seen.items()})
                # by value: set the extreme that filters, expect cards to fade and the match count to fall
                filtered = False
                out = []
                for tgt in (meta["max"], meta["min"]):
                    page.evaluate("([s, v]) => { s.value = v; s.dispatchEvent(new Event('input', {bubbles: true})); }", [sl.element_handle(), tgt])
                    page.wait_for_timeout(600)
                    c = cards(page)
                    out.append({"to": tgt, "fail": c["fail"], "match": match(page)["count"]})
                    filtered = filtered or c["fail"] > 0
                page.evaluate("([s, v]) => { s.value = v; s.dispatchEvent(new Event('input', {bubbles: true})); }", [sl.element_handle(), meta["value"]])
                r.check("slider-by-value-filters" + tag, filtered, out)
                all_events += s.events(page)
                r.check("no-formsubmit-slider" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- presets + guided chips + reset
            s, page = fresh(h, browser, width)
            try:
                c0 = cards(page)
                r.check("cards-none-failing-initially" + tag, c0["fail"] == 0, "%d failing of %d" % (c0["fail"], c0["visible"]))
                r.check("cards-no-meets-all-when-no-filters" + tag,
                        not all(t == "Meets all thresholds" for t in c0["status"]),
                        "every visible card says 'Meets all thresholds' while no threshold is set")
                chip = page.locator(SEL["preset_chip"], has_text=S.PRESET_LABEL).first
                chip.scroll_into_view_if_needed()
                chip.click()
                page.wait_for_timeout(900)
                q = query(page)
                r.check("preset-writes-url" + tag, "t." in q, q)
                r.check("preset-filters-something" + tag, cards(page)["fail"] > 0, cards(page)["fail"])
                page.locator(SEL["reset_btn"]).scroll_into_view_if_needed()
                page.locator(SEL["reset_btn"]).click()
                page.wait_for_timeout(700)
                r.check("reset-clears-url" + tag, "t." not in query(page), query(page))
                r.check("reset-clears-cards" + tag, cards(page)["fail"] == 0)
                guided = page.locator(SEL["guided_chip"])
                r.check("guided-chips-present" + tag, guided.count() >= 2, guided.count())
                if guided.count():
                    g0 = guided.first
                    g0.scroll_into_view_if_needed()
                    g0.click()
                    page.wait_for_timeout(1200)
                    r.check("guided-chip-applies" + tag, "t." in query(page), query(page))
                    neutral = page.locator(SEL["guided_chip"] + ".neutral")
                    if neutral.count():
                        neutral.first.scroll_into_view_if_needed()
                        neutral.first.click()
                        page.wait_for_timeout(800)
                        r.check("guided-neutral-clears" + tag, "t." not in query(page), query(page))
                all_events += s.events(page)
                r.check("no-formsubmit-presets" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- qualitative filter
            s, page = fresh(h, browser, width)
            try:
                sel_el = page.locator("%s select, select[data-qual-filter]" % SEL["qual_filters"]).first
                fid = sel_el.get_attribute("data-qual-filter")
                opts = page.evaluate("s => Array.from(s.options).map(o => o.value)", sel_el.element_handle())
                pick = next((o for o in opts if o not in ("any", "unknown")), None)
                sel_el.scroll_into_view_if_needed()
                sel_el.select_option(pick)
                page.wait_for_timeout(600)
                r.check("qual-filter-writes-url" + tag, ("q.%s=%s" % (fid, pick)) in query(page), query(page))
                r.check("qual-filter-fades-cards" + tag, cards(page)["fail"] > 0, "failing cards %d" % cards(page)["fail"])
                sel_el.select_option("any")
                page.wait_for_timeout(500)
                r.check("qual-filter-clears" + tag, "q." not in query(page), query(page))
                all_events += s.events(page)
            finally:
                s.close()

            # ------------------------------------------------------------- pin 3 + compare
            s, page = fresh(h, browser, width)
            try:
                stars = page.locator("%s" % SEL["region_star"])
                visible = [i for i in range(stars.count()) if stars.nth(i).is_visible()]
                for i in visible[:3]:
                    stars.nth(i).scroll_into_view_if_needed()
                    stars.nth(i).click()
                    page.wait_for_timeout(200)
                btn_text = page.inner_text(SEL["shortlist_btn"])
                r.check("pin-three" + tag, "(3)" in btn_text and unquote(query(page)).count(",") == 2, "%s | %s" % (btn_text, query(page)))
                page.locator(SEL["shortlist_btn"]).scroll_into_view_if_needed()
                page.locator(SEL["shortlist_btn"]).click()
                page.wait_for_timeout(800)
                r.check("compare-opens" + tag, is_open(page, SEL["compare"]))
                body = page.evaluate("(document.querySelector('%s') || {}).innerText || ''" % SEL["compare_body"])
                r.check("compare-has-content" + tag, len(body) > 100, "%d chars" % len(body))
                page.locator(SEL["compare_close"]).click()
                page.wait_for_timeout(400)
                r.check("compare-closes" + tag, not is_open(page, SEL["compare"]))
                all_events += s.events(page)
                r.check("no-formsubmit-compare" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- drawer, focus returned
            s, page = fresh(h, browser, width)
            try:
                card = page.locator("#region-%s" % S.DRAWER_REGION)
                card.scroll_into_view_if_needed()
                card.focus()
                page.keyboard.press("Enter")
                page.wait_for_timeout(800)
                r.check("drawer-opens-on-enter" + tag, is_open(page, SEL["drawer"]))
                body = page.evaluate("(document.querySelector('%s') || {}).innerText || ''" % SEL["drawer_body"])
                r.check("drawer-has-content" + tag, len(body) > 200, "%d chars" % len(body))
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)
                r.check("drawer-closes-on-escape" + tag, not is_open(page, SEL["drawer"]))
                focus_back = page.evaluate("document.activeElement && document.activeElement.id")
                r.check("drawer-focus-returned" + tag, focus_back == "region-%s" % S.DRAWER_REGION, "focus is on #%s" % focus_back)
                card.focus()
                page.keyboard.press("Enter")
                page.wait_for_timeout(600)
                page.locator(SEL["drawer_close"]).click()
                page.wait_for_timeout(400)
                r.check("drawer-closes-on-button" + tag, not is_open(page, SEL["drawer"]))
                all_events += s.events(page)
            finally:
                s.close()

            # ------------------------------------------------------------- URL round trip + share link restore + share event
            s, page = fresh(h, browser, width, path=S.FILTERED_LINK)
            try:
                m1 = match(page)
                sl_vals = page.evaluate("Array.from(document.querySelectorAll('.criteria input[type=range]')).map(s => [s.closest('.crit-card').id, s.value])")
                shortlist = page.inner_text(SEL["shortlist_btn"])
                r.check("url-state-applied" + tag, "(1)" in shortlist and int(m1["count"]) < int(m1["total"]), "%s | %s" % (shortlist, m1))
                q1 = query(page)
                page.reload(wait_until="load")
                wait_map_idle(page)
                page.wait_for_timeout(400)
                r.check("url-state-roundtrip-reload" + tag, match(page) == m1 and query(page) == q1, "%s vs %s" % (match(page), m1))
                # share: copy, then open the copied query in a fresh context
                page.locator(SEL["share_btn"]).scroll_into_view_if_needed()
                page.locator(SEL["share_btn"]).click()
                page.wait_for_timeout(500)
                clip = ""
                try:
                    clip = page.evaluate("navigator.clipboard.readText()")
                except Exception as e:
                    clip = "ERR %s" % e
                qs = urlparse_q(clip)
                r.check("share-copies-url-with-state" + tag, bool(qs) and "t.water_stress" in qs, clip)
                s2, page2 = fresh(h, browser, width, path="/" + qs)
                try:
                    r.check("share-link-restores" + tag, match(page2) == m1 and
                            page2.evaluate("Array.from(document.querySelectorAll('.criteria input[type=range]')).map(s => [s.closest('.crit-card').id, s.value])") == sl_vals,
                            "%s vs %s" % (match(page2), m1))
                finally:
                    s2.close()
                all_events += s.events(page)
                r.check("no-formsubmit-url" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- modal: displayed with ?modal=1 (never touched), then X
            s, page = fresh(h, browser, width, path="/?modal=1", storage="none")
            try:
                page.wait_for_selector("%s.visible" % SEL["modal"], timeout=5000)
                r.check("modal-force-shows" + tag, page.evaluate("document.querySelector('%s').getAttribute('aria-hidden')" % SEL["modal"]) == "false")
                page.locator(SEL["modal_close"]).click()
                page.wait_for_timeout(500)
                r.check("modal-x-closes" + tag, not page.evaluate("!!document.querySelector('%s.visible')" % SEL["modal"]))
                all_events += s.events(page)
                r.check("no-formsubmit-modal" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- modal: positive control, then seeded subscribed state
            s, page = fresh(h, browser, width, storage="none")
            try:
                page.locator(".criteria").scroll_into_view_if_needed()
                page.evaluate("window.scrollBy(0, 400)")
                try:
                    page.wait_for_selector("%s.visible" % SEL["modal"], timeout=4000)
                    opened = True
                except Exception:
                    opened = False
                r.check("modal-opens-on-engagement-unseeded" + tag, opened, "positive control for the seeded test below")
                if opened:
                    page.locator(SEL["modal_close"]).click()
                all_events += s.events(page)
            finally:
                s.close()
            s, page = fresh(h, browser, width)
            try:
                seeded = page.evaluate("localStorage.getItem(%s)" % json.dumps(keyname))
                r.check("storage-seeded:%s=%s%s" % (keyname, subscribed, tag), seeded == subscribed, "found %r" % seeded)
                page.locator(".criteria").scroll_into_view_if_needed()
                page.evaluate("window.scrollBy(0, 400)")
                sl = page.locator(SEL["slider"]).first
                page.evaluate("s => { s.value = s.max; s.dispatchEvent(new Event('input', {bubbles: true})); }", sl.element_handle())
                page.wait_for_timeout(1500)
                r.check("modal-never-opens-when-subscribed" + tag,
                        not page.evaluate("!!document.querySelector('%s.visible')" % SEL["modal"]),
                        "modal opened although %s=%s was seeded" % (keyname, subscribed))
                r.check("no-formsubmit-seeded" + tag, not s.guard.formsubmit)
            finally:
                s.close()
        finally:
            h.close_browser(browser)

    # ------------------------------------------------------------------------------- analytics guard
    fired = {}
    for ev in all_events:
        if ev.get("name"):
            fired.setdefault(ev["name"], set()).update(ev.get("keys") or [])
    h.extra["analytics_fired"] = {k: sorted(v) for k, v in fired.items()}
    h.extra["analytics_declared"] = declared_events(h.site)
    base = read_json(h.baseline_dir / "analytics.json")
    if not base:
        r.skip("analytics-guard", "no baseline analytics.json at %s (capture_baseline.py writes it)" % (h.baseline_dir / "analytics.json"))
    else:
        for name, keys in sorted(base.get("fired", {}).items()):
            now = fired.get(name)
            r.check("analytics-fires:" + name, now is not None, "baseline fired %s with %s; this run did not fire it" % (name, keys))
            if now is not None:
                r.check("analytics-keys:" + name, set(keys) <= set(now), "baseline keys %s, now %s" % (keys, sorted(now)))
        declared_now = declared_events(h.site)
        for name in sorted(base.get("declared", {})):
            r.check("analytics-declared:" + name, name in declared_now, "trackEvent('%s') is no longer in the source" % name)
    r.info("analytics-new-events", sorted(set(fired) - set((base or {}).get("fired", {}))))
    return r.out


def urlparse_q(clip):
    m = re.search(r"\?[^#\s]*", clip or "")
    return m.group(0) if m else ""


def declared_events(site):
    """Event names in the source: trackEvent('x', {...}) and window.va('event', {name: 'x'}) calls, with payload keys."""
    out = {}
    root = Path(site)
    files = [root / "index.html"] + sorted((root / "src").rglob("*.js")) if (root / "src").is_dir() else [root / "index.html"]
    for p in files:
        try:
            t = p.read_text("utf-8", "ignore")
        except Exception:
            continue
        for m in re.finditer(r"\b(?:trackEvent|track)\(\s*['\"](\w+)['\"]\s*(?:,\s*\{([^}]*)\})?", t):
            keys = sorted({piece.split(":")[0].strip() for piece in (m.group(2) or "").split(",") if re.match(r"^\s*\w+\s*(:|$)", piece)})
            out.setdefault(m.group(1), set()).update(keys)
    return {k: sorted(v) for k, v in out.items()}
