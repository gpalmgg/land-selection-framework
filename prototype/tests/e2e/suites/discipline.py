"""discipline: the framework-discipline scan (tools/discipline.py) over the RENDERED text of the site.

Covered states: the home page (initial, preset applied, drawer open for three regions, compare open), every region page,
deeper.html and arrive/host/terms-of-arrival when present. Scanned: visible text, every <option>, and the attributes alt,
title, aria-label and placeholder; glyphs, e-mail addresses and mailto/tel links are scanned in the DOM (scripts removed).
Test ids: banned-word:<state>:<word>, glyph:<state>:<kind>, contact:<state>, sort-control:<state>.
"""
import re

from lib import sel as _sel
from lib.site import default_storage, goto_settled
from lib.util import load_tool

NAME = "discipline"
S = _sel.home()
SEL = S.SEL
DRAWER_REGIONS = ["alentejo", "galicia", "nova-scotia"]


def collect(page, where):
    items = page.evaluate(load_tool("discipline").collect_js)
    for it in items:
        it["where"] = where
    return items


def run(ctx):
    h = ctx
    D = load_tool("discipline")
    r = h.new_results(NAME)
    states = []                       # (where, items)
    browser = h.launch()
    try:
        s = h.session(browser, width=1280, storage=default_storage(h.site), stub=True)
        page = s.page()
        goto_settled(page, h.base + "/", extra_ms=500)
        states.append(("/:initial", collect(page, "/:initial")))
        chip = page.locator(SEL["preset_chip"], has_text=S.PRESET_LABEL).first
        chip.scroll_into_view_if_needed()
        chip.click()
        page.wait_for_timeout(700)
        states.append(("/:preset", collect(page, "/:preset")))
        page.locator(SEL["reset_btn"]).click()
        page.wait_for_timeout(300)
        for rid in DRAWER_REGIONS:
            card = page.locator("#region-%s" % rid)
            if not card.count():
                continue
            card.focus()
            page.keyboard.press("Enter")
            page.wait_for_timeout(600)
            states.append(("/:drawer:%s" % rid, collect(page, "/:drawer:%s" % rid)))
            page.keyboard.press("Escape")
            page.wait_for_timeout(300)
        for rid in S.COMPARE_PINS:
            star = page.locator("#region-%s %s" % (rid, SEL["region_star"]))
            if star.count():
                star.first.scroll_into_view_if_needed()
                star.first.click()
        page.locator(SEL["shortlist_btn"]).click()
        page.wait_for_timeout(700)
        states.append(("/:compare", collect(page, "/:compare")))
        r.check("no-formsubmit:home", not s.guard.formsubmit)
        s.close()
        for path in h.page_files():
            if path == "/":
                continue
            s = h.session(browser, width=1280, storage=default_storage(h.site), stub=True)
            page = s.page()
            page.goto(h.base + path, wait_until="load", timeout=60000)
            page.wait_for_timeout(300)
            states.append((path, collect(page, path)))
            s.close()
    finally:
        h.close_browser(browser)

    all_items = []
    for where, items in states:
        all_items.extend(items)
        rep = D.scan(items)
        seen = set()
        for b in rep["bad"]:
            sig = (b["word"], re.sub(r"\s+", " ", b["context"]).strip().lower())
            if sig in seen:
                continue
            seen.add(sig)
            r.check("banned-word:%s:%s" % (where, b["word"]), False, "%s [%s] %s" % (b["word"], b["kind"], b["context"]))
        kinds = {}
        for g in rep["glyphs"]:
            kinds.setdefault(g["glyph"], []).append(g)
        for kind, gs in kinds.items():
            r.check("glyph:%s:%s" % (where, kind), False, "%d x %s e.g. %s" % (len(gs), kind, [x["context"] for x in gs[:2]]))
        if rep["emails"] or rep["contact"]:
            r.check("contact:" + where, False, "%s %s" % (rep["emails"][:3], rep["contact"][:3]))
        if rep["sort_controls"]:
            r.check("sort-control:" + where, False, rep["sort_controls"][:2])
        clean = D.is_clean(rep)
        if clean:
            r.check("clean:" + where, True, "allowed hits: %s" % rep["allowed"])
    r.info("states-scanned", [w for w, _ in states])
    return r.out
