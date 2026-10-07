"""layers: DOM-discovered map layer toggles on both continents.

Live mode (default): a layer passes when toggling it on changes the map (pixel diff) or issues tile requests that succeed; `slow`
is tolerated, `broken` and `partial` fail (one retry), plus the deep-zoom sweep (`partial-at-depth` / `broken-at-depth` fail).
Offline mode (--offline): every third-party request is stubbed, so only STRUCTURE is checked: toggle state (aria-pressed), a legend
row or a MapLibre style change. Test ids: sweep:<continent>:<layer-id>, zoom:<layer-id>, structure:<continent>:<layer-id>.
"""
import hashlib
import json
import os

from lib import sel as _sel
from lib.layers import FAILS, discover_layers, dismiss_modal, run_sweeps
from lib.site import U, default_storage, goto_settled
from lib.snapshot import style_dump

NAME = "layers"
SEL = _sel.home().SEL


def _structure(h, r):
    browser = h.launch()
    try:
        s = h.session(browser, width=1280, storage=default_storage(h.site), stub=True)
        page = s.page()
        goto_settled(page, h.base + "/", extra_ms=400)
        tabs = page.locator(SEL["continent_tab"])
        conts = [tabs.nth(i).get_attribute("data-continent") for i in range(tabs.count())] or [None]
        for c in conts:
            if c:
                page.locator('%s[data-continent="%s"]' % (SEL["continent_tab"], c)).click()
                page.wait_for_timeout(700)
            try:
                if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
                    page.click(SEL["layers_toggle"])
            except Exception:
                pass
            btns = page.locator(SEL["layer_buttons"])
            r.check("toggles-discovered:%s" % (c or "all"), btns.count() > 0, "%d toggles" % btns.count())
            for d in discover_layers(page):
                tid = "structure:%s:%s" % (c or "all", d["id"])
                if not d["visible"]:
                    continue
                b = btns.nth(d["index"])
                dismiss_modal(page)
                before = hashlib.sha256(json.dumps(style_dump(page), sort_keys=True).encode()).hexdigest()
                legend_before = page.evaluate("(document.querySelector('%s') || {children: []}).children.length" % SEL["legend"])
                b.scroll_into_view_if_needed()
                was_on = b.get_attribute("aria-pressed") == "true"      # a few layers are on by default: the click turns them off
                b.click()
                page.wait_for_timeout(400)
                pressed = (b.get_attribute("aria-pressed") == "true") != was_on
                after = hashlib.sha256(json.dumps(style_dump(page), sort_keys=True).encode()).hexdigest()
                legend_after = page.evaluate("(document.querySelector('%s') || {children: []}).children.length" % SEL["legend"])
                r.check(tid, pressed and (after != before or legend_after != legend_before),
                        "toggled=%s style_changed=%s legend %s->%s" % (pressed, after != before, legend_before, legend_after))
                b.click()
                page.wait_for_timeout(200)
        r.check("no-formsubmit", not s.guard.formsubmit)
        s.close()
    finally:
        h.close_browser(browser)


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    if h.browser_name != "chromium":
        r.skip("layers", "the live sweep needs CDP (chromium)")
        return r.out
    if h.offline:
        _structure(h, r)
        return r.out
    shots = str(U / "screenshots" / "layers" / (h.label or "run"))
    sw = run_sweeps(h, shots, h.label or "run")
    for e in sw["errors"]:
        r.check("sweep-error", False, e)
    for row in sw["layers"]:
        v = row["verdict"]
        r.check("sweep:%s:%s" % (row["continent"], row["layer_id"]), v not in FAILS,
                "%s (requests %s ok %s failed %s) %s" % (v, row.get("requests"), row.get("ok"), row.get("failed"), row.get("failed_samples", [])[:1]))
    for row in ((sw.get("zoom") or {}).get("layers") or []):
        r.check("zoom:%s" % row["layer_id"], row["verdict"] not in FAILS, "%s %s" % (row["verdict"], row.get("failed_samples", [])[:1]))
    r.info("discovered", sw["discovered"])
    return r.out
