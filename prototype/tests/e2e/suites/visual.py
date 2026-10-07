"""visual: screenshots for the visual gate (G7). Forms are never touched.

Home (initial, preset applied, drawer open, compare open, NA tab), one region page and deeper.html, at widths 390, 768, 1280 and
1920 and colour schemes light and dark (Playwright color_scheme), reduced motion on. PNGs go to
upgrade-2026-10/screenshots/visual/<label>/ (gitignored); the result rows carry console messages, horizontal overflow (must be
0 px) and failed requests per shot. Contrast probing is added later by the component suites.
"""
import os

from lib import sel as _sel
from lib.site import U, default_storage, goto_settled
from lib.snapshot import masked_screenshot  # noqa: F401  (kept for suites that want a masked map)

NAME = "visual"
S = _sel.home()
SEL = S.SEL
WIDTHS = [390, 768, 1280, 1920]
SCHEMES = ["light", "dark"]


def _shot(page, path):
    try:
        page.screenshot(path=path, full_page=True, timeout=60000)
        return True
    except Exception:
        pass
    try:
        page.screenshot(path=path, timeout=60000)
        return True
    except Exception:
        return False


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    label = h.label or "run"
    base = U / "screenshots" / "visual" / label
    os.makedirs(str(base), exist_ok=True)
    region = next((p for p in h.page_files() if p.startswith("/region/")), None)
    states = ["home-initial", "home-preset", "home-drawer", "home-compare", "home-na"]
    if region:
        states.append("region")
    states.append("deeper")
    for scheme in SCHEMES:
        for width in WIDTHS:
            for st in states:
                browser = h.launch()          # a fresh browser per shot: Chromium blocks WebGL after repeated context loss
                try:
                    tag = "%s-%s-%d" % (st, scheme, width)
                    s = h.session(browser, width=width, scheme=scheme, storage=default_storage(h.site), stub=None)
                    page = s.page()
                    log = s.log(page)
                    try:
                        if st == "home-initial":
                            goto_settled(page, h.base + "/", extra_ms=600)
                        elif st == "home-preset":
                            goto_settled(page, h.base + "/", extra_ms=300)
                            page.locator(SEL["preset_chip"], has_text=S.PRESET_LABEL).first.click()
                            page.wait_for_timeout(700)
                        elif st == "home-drawer":
                            goto_settled(page, h.base + "/", extra_ms=300)
                            page.locator("#region-%s" % S.DRAWER_REGION).focus()
                            page.keyboard.press("Enter")
                            page.wait_for_timeout(800)
                        elif st == "home-compare":
                            goto_settled(page, h.base + "/?pin=" + ",".join(S.COMPARE_PINS), extra_ms=300)
                            page.locator(SEL["shortlist_btn"]).click()
                            page.wait_for_timeout(800)
                        elif st == "home-na":
                            goto_settled(page, h.base + "/", extra_ms=300)
                            page.locator('%s[data-continent="north-america"]' % SEL["continent_tab"]).click()
                            page.wait_for_timeout(1200)
                        elif st == "region":
                            page.goto(h.base + region, wait_until="load", timeout=60000)
                            page.wait_for_timeout(500)
                        else:
                            page.goto(h.base + "/deeper.html", wait_until="load", timeout=60000)
                            page.wait_for_timeout(500)
                        overflow = page.evaluate("Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
                        path = str(base / (tag + ".png"))
                        ok = _shot(page, path)
                        errs = log.errors(own_only=True)
                        r.check("shot:" + tag, ok, path)
                        r.check("no-h-overflow:" + tag, overflow == 0, "%d px" % overflow)
                        r.check("console-clean:" + tag, not errs and not log.pageerrors,
                                "; ".join(e["text"][:120] for e in errs[:3] + [{"text": x} for x in log.pageerrors[:2]]))
                        fo = log.failed_own()
                        r.check("own-requests-ok:" + tag, not fo, "; ".join("%s %s" % (f["status"] or f["error"], f["url"]) for f in fo[:3]))
                        r.check("no-formsubmit:" + tag, not s.guard.formsubmit, s.guard.formsubmit)
                    except Exception as e:
                        r.check("state-reached:" + tag, False, "exception: %s" % str(e)[:300])
                    finally:
                        s.close()
                finally:
                    h.close_browser(browser)
    r.info("shots-dir", str(base))
    return r.out
