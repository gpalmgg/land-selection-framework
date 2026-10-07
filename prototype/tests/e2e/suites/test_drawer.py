"""test_drawer: the region drawer's frame, head, refusal band, asks, Land standing and place styles, and the overlay manager (MC-DRAWER).

  * the blocks of a drawer come in the manifest order (head, blurb, land-standing, refusal, asks, place, way, context, criteria) for a
    region that has every block; a block that throws is skipped and never blanks the drawer
  * frame: a right-hand leaf from 768px (780px wide, 1px left edge, a 12px region-coloured wave, a 44px round close), a bottom sheet
    below it (full width, max-height 92dvh, scrolling inside); the modal's z-index (1200) exceeds the drawer's (1100)
  * head: the Salutation above the name (h3) above the country, the Pin (icon + "Pin"/"Pinned", aria-pressed), "Open X as a full
    page" with an SVG arrow and no text arrow
  * the refusal band: the same markup in two different regions, the canon sentence, a static three-path stream, no animation
  * asks: 3px accent rule on the accent wash, Spectral italic, a source line, the case-study link where one exists
  * Land standing and the place strip carry their frames (braid, 128px label column, radius); the .ls-provenance line is Inter 12.5px,
    the colour of .ls-src, no italics, never faded, contrast >= 4.5:1 on its ground, visible at 390px and not hidden in print media
  * no opacity on any text in the drawer; rendered-text contrast of the whole drawer has 0 failures
  * overlays: #main and #rct-rail are inert while the drawer is open and live again after; Tab cycles inside the drawer; Escape closes it
    and focus returns to the trigger; the manager's stack closes only the topmost layer per Escape (drawer + modal stand-in), the
    drawer under it is inert until the top closes; the engagement-triggered modal waits while the drawer is open and shows after
  * reduced motion: no transform transition on open (computed transition-duration 0s); without the preference the leaf slides
  * beforeprint expands the per-row source lists and afterprint restores them
  * no console error, no page error, nothing submitted

Nothing is ever submitted: the harness aborts and records every formsubmit.co request, and this suite never clicks a submit control.
"""
import re

from lib import sel as _sel
from lib.site import default_storage, goto_settled

NAME = "test_drawer"
S = _sel.load("drawer")
SEL = S.SEL


def fresh(h, browser, width, reduced=True, modal=False, path="/", **kw):
    s = h.session(browser, width=width, storage=default_storage(h.site, modal=modal), stub=True, reduced_motion=reduced, **kw)
    page = s.page()
    return s, page


def settle(h, page, path="/"):
    goto_settled(page, h.base + path, extra_ms=400)


def open_drawer(page, rid):
    page.evaluate(S.JS_OPEN, rid)
    try:
        page.wait_for_selector("%s.open" % SEL["backdrop"], timeout=8000)
        page.wait_for_selector("%s > *" % SEL["body"], timeout=8000)
    except Exception:
        return False
    page.wait_for_timeout(500)
    return True


def clean(r, tag, log, label, allow=()):
    errs = [e for e in log.errors() if not any(a in str(e.get("text")) for a in allow)]
    errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def pick_full_region(present, ids):
    """A region that has every block (stubs for the rest are not needed: the real data supplies them)."""
    for rid in S.REGIONS + ids:
        p = present.get(rid)
        if p and all(p[k] for k in ("landStanding", "asks", "place", "way", "context")):
            return rid
    return None


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            # ============================================================ the real drawer: order, head, blurb, refusal, asks, styles
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                ids = list(present.keys())
                full = pick_full_region(present, ids)
                r.check("a-region-has-every-block" + tag, full is not None, "regions: %d" % len(ids))
                if not full:
                    continue
                other = next((x for x in S.REGIONS + ids if x != full and present.get(x, {}).get("landStanding")), None)
                r.check("two-regions-to-compare" + tag, other is not None)

                ok = open_drawer(page, full)
                r.check("drawer-opens" + tag, ok, full)
                order = page.evaluate(S.JS_ORDER, S.ORDER)
                expect = [b for b, _ in S.ORDER]
                r.check("blocks-in-manifest-order" + tag, order == expect, order)

                # ---------------------------------------------------- frame
                f = page.evaluate(S.JS_FRAME)
                r.check("frame-aria-modal-dialog" + tag, f["ariaModal"] == "true" and f["role"] == "dialog" and f["ariaHidden"] == "false", f)
                r.check("frame-wave-12px-region-colour-decorative" + tag, f["wave"] is not None and f["wave"]["h"] == "12px" and f["wave"]["hasMask"] and f["wave"]["ariaHidden"] == "true"
                        and f["wave"]["bg"] != "rgba(0, 0, 0, 0)", f["wave"])
                r.check("frame-close-44px-round" + tag, round(f["close"]["w"]) == 44 and round(f["close"]["h"]) == 44 and f["close"]["radius"] in ("50%", "22px"), f["close"])
                r.check("frame-scrolls-inside" + tag, f["bodyOverflowY"] in ("auto", "scroll") and f["panelOverflow"] == "hidden", "%s / %s" % (f["bodyOverflowY"], f["panelOverflow"]))
                r.check("frame-z-index-1100" + tag, f["z"] == "1100", f["z"])
                if width >= 768:
                    r.check("frame-right-leaf" + tag, f["position"] == "fixed" and abs(f["width"] - min(f["vw"], 780)) < 1 and abs(f["left"] - (f["vw"] - f["width"])) < 1.5
                            and abs(f["height"] - f["vh"]) < 1.5, f)
                    r.check("frame-left-edge-1px" + tag, f["borderLeft"].startswith("1px solid"), f["borderLeft"])
                else:
                    r.check("frame-bottom-sheet-under-768" + tag, f["position"] == "fixed" and abs(f["width"] - f["vw"]) < 1 and abs(f["bottom"] - f["vh"]) < 1.5
                            and abs(float(f["maxHeight"].replace("px", "")) - 0.92 * f["vh"]) < 1.5 and f["top"] > 0, f)
                r.check("frame-inert-page-behind" + tag, f["mainInert"] and f["railInert"] and "overlay-open" in f["bodyClass"] and "panel-open" in f["bodyClass"], f["bodyClass"])

                # ---------------------------------------------------- head, blurb
                b = page.evaluate(S.JS_BLOCKS)
                hd = b["head"]
                r.check("head-section-labelled-by-the-name" + tag, bool(hd) and hd["tag"] == "section" and hd["labelledby"] == hd["nameId"] and hd["nameTag"] == "h3", hd)
                r.check("head-salutation-then-name-then-country" + tag, bool(hd) and hd["salBeforeName"] and hd["nameBeforeCountry"], hd)
                r.check("head-salutation-says-whose-land" + tag, bool(hd) and hd["salLabel"].lower().startswith("whose land") and len(hd["salValue"]) > 2, hd and (hd["salLabel"], hd["salValue"]))
                r.check("head-salutation-large-fraunces-italic-host" + tag, bool(hd) and hd["salFs"]["family"] == "Fraunces" and hd["salFs"]["style"] == "italic" and hd["salFs"]["size"] >= 24, hd and hd["salFs"])
                r.check("head-name-fraunces-large" + tag, bool(hd) and hd["nameFs"]["family"] == "Fraunces" and hd["nameFs"]["size"] >= 36, hd and hd["nameFs"])
                r.check("head-name-matches-region" + tag, bool(hd) and len(hd["name"]) > 1 and len(hd["country"]) > 1, hd and (hd["name"], hd["country"]))
                pn = b["pin"]
                r.check("head-pin-icon-and-words" + tag, bool(pn) and pn["svg"] and pn["text"] in ("Pin", "Pinned") and pn["pressed"] in ("true", "false") and not pn["glyph"]
                        and pn["region"] == full, pn)
                fl = b["full"]
                r.check("blurb-full-page-link" + tag, bool(fl) and fl["href"] == "/region/%s.html" % full and fl["text"].startswith("Open ") and fl["text"].endswith("as a full page"), fl)
                r.check("blurb-link-arrow-is-svg" + tag, bool(fl) and fl["svg"] and not fl["arrowGlyph"], fl)

                # ---------------------------------------------------- asks
                ak = b["asks"]
                r.check("asks-present-with-section-and-heading" + tag, bool(ak) and ak["tag"] == "section" and ak["h4"].lower().startswith("what living here asks of you"), ak and ak["h4"])
                if ak:
                    r.check("asks-3px-accent-rule" + tag, ak["border"] == "3px solid" and ak["borderColor"] != "rgba(0, 0, 0, 0)", ak["border"])
                    r.check("asks-accent-wash-ground" + tag, ak["bg"] not in ("rgba(0, 0, 0, 0)", "rgb(255, 255, 255)"), ak["bg"])
                    r.check("asks-text-spectral-italic" + tag, ak["textFs"] and ak["textFs"]["family"] == "Spectral" and ak["textFs"]["style"] == "italic" and ak["textFs"]["size"] >= 17, ak["textFs"])
                    r.check("asks-source-line-with-link" + tag, ak["src"] is not None and ak["src"]["text"].startswith("Source:") and ak["src"]["href"].startswith("http"), ak["src"])
                    r.check("asks-no-text-arrow" + tag, not ak["hasTextArrow"])

                # ---------------------------------------------------- Land standing, place strip
                ls = b["ls"]
                r.check("land-standing-frame" + tag, bool(ls) and ls["radius"] == "2px 22px 2px 2px" and ls["hasBraid"] and (ls["rowFirstCol"] == 128 if width > 600 else ls["rowCols"] == 1) and ls["provenance"] and ls["consent"] and ls["arrive"], ls)
                r.check("land-standing-tag-says-qualitative" + tag, bool(ls) and "never scored" in ls["tagText"].lower(), ls and ls["tagText"])
                r.check("land-standing-lead-fraunces-italic-large" + tag, bool(ls) and ls["terrFs"] and ls["terrFs"]["family"] == "Fraunces" and ls["terrFs"]["style"] == "italic" and ls["terrFs"]["size"] >= 24, ls and ls["terrFs"])
                pl = b["place"]
                r.check("place-strip-frame" + tag, bool(pl) and pl["radius"] == "2px 18px 2px 2px" and pl["tag"].lower().startswith("place") and pl["dl"] == "grid", pl)
                r.check("place-strip-label-italic-spectral" + tag, bool(pl) and pl["placeFs"] and pl["placeFs"]["family"] == "Spectral" and pl["placeFs"]["style"] == "italic" and pl["placeFs"]["size"] == 20, pl and pl["placeFs"])

                # ---------------------------------------------------- refusal band: identical in two regions
                ref1 = page.evaluate(S.JS_REFUSAL)
                r.check("refusal-present" + tag, ref1 is not None)
                canon = page.evaluate("async () => (await import('/data/site-facts.js')).canon.refusal")
                if ref1:
                    r.check("refusal-canon-sentence" + tag, ref1["sentence"] == canon, ref1["sentence"])
                    r.check("refusal-small-line" + tag, ref1["small"] == "Every region in this tool is already someone’s home. The river stops here by choice.", ref1["small"])
                    r.check("refusal-stream-three-paths-decorative" + tag, ref1["paths"] == 3 and ref1["svgAriaHidden"] == "true" and ref1["dashed"] and ref1["svgH"] == 34, ref1)
                    r.check("refusal-stream-in-accent" + tag, ref1["svgColor"] != "rgba(0, 0, 0, 0)" and abs(ref1["svgH"] - 34) < 1, ref1["svgColor"])
                    r.check("refusal-sentence-fraunces-italic-17em" + tag, ref1["pFs"]["family"] == "Fraunces" and ref1["pFs"]["style"] == "italic" and ref1["pFs"]["size"] >= 24, ref1["pFs"])
                    r.check("refusal-is-static" + tag, not ref1["animated"] and ref1["animateEls"] == 0, ref1["animated"])
                    r.check("refusal-no-score-rank-best-top" + tag, not re.findall(S.BANNED_WORDS, ref1["text"], re.I), ref1["text"])
                page.keyboard.press("Escape")
                page.wait_for_timeout(400)
                if other:
                    open_drawer(page, other)
                    ref2 = page.evaluate(S.JS_REFUSAL)
                    r.check("refusal-identical-in-two-regions:%s,%s%s" % (full, other, tag), bool(ref1) and bool(ref2) and ref1["html"] == ref2["html"], "differs" if ref1 and ref2 and ref1["html"] != ref2["html"] else "")
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(400)
                    open_drawer(page, full)

                # ---------------------------------------------------- opacity and contrast
                bad = page.evaluate(S.JS_OPACITY)
                r.check("no-opacity-on-any-text" + tag, not bad, bad[:5])
                con = page.evaluate(S.JS_CONTRAST)
                r.check("contrast-zero-failures" + tag, not con["bad"] and con["checked"] > 40, "checked %d; failing: %s" % (con["checked"], con["bad"][:4]))

                # ---------------------------------------------------- .ls-provenance
                pv = page.evaluate(S.JS_PROVENANCE)
                r.check("provenance-present-once-after-source" + tag, bool(pv) and pv["count"] == 1 and pv["directlyAfterSrc"], pv)
                if pv:
                    r.check("provenance-inter-12-5-no-italics" + tag, pv["family"] == "Inter" and pv["size"] == 12.5 and pv["style"] == "normal", pv)
                    r.check("provenance-colour-of-ls-src" + tag, pv["color"] == pv["srcColor"], "%s vs %s" % (pv["color"], pv["srcColor"]))
                    r.check("provenance-never-faded" + tag, pv["opacity"] == "1" and not pv["faded"], pv["opacity"])
                    r.check("provenance-contrast-at-least-4-5" + tag, pv["ratio"] >= 4.5, pv["ratio"])
                    r.check("provenance-says-no-nation-has-reviewed" + tag, "No nation or community named here has reviewed this entry." in pv["text"], pv["text"])
                    r.check("provenance-visible-inside-the-viewport" + tag, pv["display"] != "none" and pv["h"] > 8 and pv["right"] <= pv["vw"] + 1, pv)

                # ---------------------------------------------------- Tab trap, Escape, focus return, inert
                tab_ok, stray = True, []
                for _ in range(40):
                    page.keyboard.press("Tab")
                    inside = page.evaluate("!!(document.activeElement && document.activeElement.closest('#region-drawer'))")
                    if not inside:
                        tab_ok = False
                        stray.append(page.evaluate("(document.activeElement && (document.activeElement.tagName + '#' + document.activeElement.id)) || 'none'"))
                        break
                r.check("tab-stays-inside-the-drawer" + tag, tab_ok, stray)
                page.keyboard.press("Shift+Tab")
                r.check("shift-tab-stays-inside-the-drawer" + tag, page.evaluate("!!(document.activeElement && document.activeElement.closest('#region-drawer'))"))
                page.keyboard.press("Escape")
                page.wait_for_timeout(450)
                after = page.evaluate(S.JS_FRAME)
                r.check("escape-closes-the-drawer" + tag, after["ariaHidden"] == "true" and after["backdropVisibility"] == "hidden", after["ariaHidden"])
                r.check("closed-page-is-live-again" + tag, not after["mainInert"] and not after["railInert"] and "overlay-open" not in after["bodyClass"] and "panel-open" not in after["bodyClass"], after["bodyClass"])
                clean(r, tag, log, "drawer")
                r.check("no-formsubmit:drawer" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ============================================================ focus returns to the trigger (the card), closed drawer is out of the tab order
            s, page = fresh(h, browser, width)
            try:
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                visible = page.evaluate("Array.from(document.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length).map((c) => c.dataset.region)")
                rid = next((x for x in visible if all(present[x][k] for k in ("landStanding", "asks", "place"))), visible[0] if visible else None)
                btn = page.locator("#region-%s .region-open" % rid)
                if btn.count():
                    btn.first.scroll_into_view_if_needed()
                    btn.first.focus()
                    page.keyboard.press("Enter")
                    page.wait_for_selector("%s.open" % SEL["backdrop"], timeout=8000)
                    page.wait_for_timeout(500)
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(450)
                    back = page.evaluate("(document.activeElement && document.activeElement.closest('.region-card') && document.activeElement.closest('.region-card').dataset.region) || null")
                    r.check("focus-returns-to-the-trigger" + tag, back == rid, back)
                    out = page.evaluate("() => { const c = document.getElementById('drawer-close'); return { vis: getComputedStyle(document.getElementById('region-drawer')).visibility, rects: c.getClientRects().length }; }")
                    r.check("closed-drawer-is-out-of-the-tab-order" + tag, out["vis"] == "hidden", out)
                else:
                    r.check("focus-returns-to-the-trigger" + tag, False, "no .region-open button on #region-%s" % rid)
            finally:
                s.close()

            # ============================================================ a block that throws is skipped; the drawer is not blanked
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                page.route("**/src/ui/drawer/blocks/asks.js*", lambda route, request: route.fulfill(
                    status=200, content_type="text/javascript", body="export default { id: 'asks', render() { throw new Error('stub block failure'); } };"))
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                ok = open_drawer(page, rid)
                order = page.evaluate(S.JS_ORDER, S.ORDER)
                r.check("throwing-block-skipped-others-render" + tag, ok and order == [b for b, _ in S.ORDER if b != "asks"], order)
                errs = [e for e in log.errors() if "stub block failure" in str(e.get("text")) or "asks" in str(e.get("text"))]
                r.check("throwing-block-is-logged-not-fatal" + tag, not log.pageerrors, log.pageerrors)
                r.info("throwing-block-console" + tag, [str(e.get("text"))[:120] for e in errs[:2]])
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
            finally:
                s.close()

            # ============================================================ the overlay manager: one Escape per layer, inert, focus restore
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                # a real drawer, then the real signup modal's panel registered on top of it (the modal may open over the drawer)
                open_drawer(page, rid)
                page.locator(SEL["pin"]).focus()
                page.evaluate("""() => {
                  const m = document.getElementById('signup-modal'); m.classList.add('visible'); m.setAttribute('aria-hidden', 'false');
                  window.__modalClosed = [];
                  import('/src/ui/overlays.js').then((o) => o.open('signup-modal', { panel: m, trigger: document.activeElement,
                    onClose: (why) => { m.classList.remove('visible'); m.setAttribute('aria-hidden', 'true'); window.__modalClosed.push(why); } }));
                }""")
                page.wait_for_timeout(500)
                st = page.evaluate("""() => { const m = document.getElementById('signup-modal'); const d = document.getElementById('region-drawer');
                  return { modalZ: getComputedStyle(m).zIndex, drawerZ: getComputedStyle(d).zIndex, drawerInert: d.hasAttribute('inert'), mainInert: document.getElementById('main').hasAttribute('inert'),
                           modalInert: m.hasAttribute('inert'), body: document.body.className }; }""")
                r.check("modal-z-index-1200-above-drawer-1100" + tag, st["modalZ"] == "1200" and st["drawerZ"] == "1100" and int(st["modalZ"]) > int(st["drawerZ"]), st)
                r.check("drawer-is-inert-under-the-modal" + tag, st["drawerInert"] and st["mainInert"] and not st["modalInert"] and "modal-open" in st["body"] and "panel-open" in st["body"], st)
                page.keyboard.press("Escape")
                page.wait_for_timeout(450)
                st2 = page.evaluate("""() => ({ modalVisible: document.getElementById('signup-modal').classList.contains('visible'), drawerOpen: document.getElementById('region-drawer').classList.contains('open'),
                  drawerInert: document.getElementById('region-drawer').hasAttribute('inert'), mainInert: document.getElementById('main').hasAttribute('inert'),
                  focusInDrawer: !!(document.activeElement && document.activeElement.closest('#region-drawer')), focusOnPin: !!(document.activeElement && document.activeElement.matches('.drawer-star')),
                  closed: window.__modalClosed, body: document.body.className })""")
                r.check("escape-with-modal-over-drawer-closes-only-the-modal" + tag, not st2["modalVisible"] and st2["drawerOpen"] and st2["closed"] == ["escape"], st2)
                r.check("drawer-live-again-main-still-inert" + tag, not st2["drawerInert"] and st2["mainInert"] and "modal-open" not in st2["body"] and "panel-open" in st2["body"], st2)
                r.check("focus-returns-to-the-modal-trigger" + tag, st2["focusOnPin"], st2)
                page.keyboard.press("Escape")
                page.wait_for_timeout(450)
                st3 = page.evaluate("() => ({ drawerOpen: document.getElementById('region-drawer').classList.contains('open'), mainInert: document.getElementById('main').hasAttribute('inert'), body: document.body.className })")
                r.check("second-escape-closes-the-drawer" + tag, not st3["drawerOpen"] and not st3["mainInert"] and "overlay-open" not in st3["body"], st3)

                # the manager directly: two throwaway panels
                out = page.evaluate(S.JS_MANAGER)
                r.check("manager-open-stack-and-inert" + tag, out["afterA"]["count"] == 1 and out["afterA"]["mainInert"] and out["afterA"]["top"] == "ov-a" and not out["afterA"]["aInert"]
                        and out["afterB"]["count"] == 2 and out["afterB"]["top"] == "ov-b" and out["afterB"]["aInert"] and not out["afterB"]["bInert"], out)
                page.keyboard.press("Escape")
                a1 = page.evaluate(S.JS_MANAGER_AFTER)
                r.check("manager-escape-closes-only-the-topmost" + tag, a1["log"] == ["b:escape"] and a1["count"] == 1 and a1["top"] == "ov-a" and not a1["aInert"] and a1["focusId"] == "ov-a-b", a1)
                page.keyboard.press("Escape")
                a2 = page.evaluate(S.JS_MANAGER_AFTER)
                r.check("manager-second-escape-closes-the-last" + tag, a2["log"] == ["b:escape", "a:escape"] and a2["count"] == 0 and not a2["mainInert"] and "overlay-open" not in a2["bodyClass"] and a2["focusId"] == "ov-trig-a", a2)
                page.evaluate(S.JS_MANAGER_CLEAN)
                clean(r, tag, log, "manager")
                r.check("no-formsubmit:manager" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ============================================================ the engagement-triggered modal waits while the drawer is open
            s, page = fresh(h, browser, width, modal=True)
            try:
                log = s.log(page)
                page.clock.install()
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                open_drawer(page, rid)
                page.clock.fast_forward(33000)       # the 30 s dwell trigger fires while the drawer is open
                page.wait_for_timeout(300)
                page.clock.fast_forward(2000)
                shown = page.evaluate("document.getElementById('signup-modal').classList.contains('visible')")
                r.check("engagement-modal-waits-while-the-drawer-is-open" + tag, not shown, "modal opened over the drawer")
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
                page.clock.fast_forward(1500)
                page.wait_for_timeout(400)
                shown2 = page.evaluate("document.getElementById('signup-modal').classList.contains('visible')")
                r.check("engagement-modal-shows-after-the-drawer-closes" + tag, shown2, "modal never appeared")
                if shown2:
                    mi = page.evaluate("() => ({ main: document.getElementById('main').hasAttribute('inert'), body: document.body.className, z: getComputedStyle(document.getElementById('signup-modal')).zIndex })")
                    r.check("modal-on-the-manager-inerts-the-page" + tag, mi["main"] and "modal-open" in mi["body"] and "overlay-open" in mi["body"] and mi["z"] == "1200", mi)
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(450)
                    mc = page.evaluate("() => ({ visible: document.getElementById('signup-modal').classList.contains('visible'), main: document.getElementById('main').hasAttribute('inert'), state: localStorage.getItem('lsf-modal-state') })")
                    r.check("escape-closes-the-modal-and-remembers-dismissed" + tag, not mc["visible"] and not mc["main"] and mc["state"] == "dismissed", mc)
                r.check("no-formsubmit:modal-wait" + tag, not s.guard.formsubmit)
                clean(r, tag, log, "modal-wait")
            finally:
                s.close()

            # ============================================================ reduced motion on and off
            s, page = fresh(h, browser, width, reduced=True)
            try:
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                open_drawer(page, rid)
                f = page.evaluate(S.JS_FRAME)
                r.check("reduced-motion-no-transform-transition" + tag, f["transitionDuration"] == "0s" and f["transform"] in ("none", "matrix(1, 0, 0, 1, 0, 0)"), "%s / %s" % (f["transitionDuration"], f["transform"]))
            finally:
                s.close()
            s, page = fresh(h, browser, width, reduced=False)
            try:
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                page.evaluate(S.JS_OPEN, rid)
                page.wait_for_selector("%s.open" % SEL["backdrop"], timeout=8000)
                page.wait_for_timeout(700)
                f = page.evaluate(S.JS_FRAME)
                r.check("motion-allowed-the-leaf-slides" + tag, "transform" in f["transitionProperty"] and f["transitionDuration"].startswith("0.32"), "%s / %s" % (f["transitionProperty"], f["transitionDuration"]))
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
            finally:
                s.close()

            # ============================================================ print: sources expand, the provenance line is not hidden
            s, page = fresh(h, browser, width)
            try:
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                open_drawer(page, rid)
                n = page.evaluate("document.querySelectorAll('#region-drawer details.ls-claims').length")
                page.evaluate("window.dispatchEvent(new Event('beforeprint'))")
                opened = page.evaluate("Array.from(document.querySelectorAll('#region-drawer details.ls-claims')).every((d) => d.open)")
                page.evaluate("window.dispatchEvent(new Event('afterprint'))")
                closed = page.evaluate("Array.from(document.querySelectorAll('#region-drawer details.ls-claims')).every((d) => !d.open)")
                r.check("beforeprint-expands-every-source-list" + tag, n > 0 and opened, "details: %d" % n)
                r.check("afterprint-restores-them" + tag, closed)
                page.emulate_media(media="print")
                fx = page.evaluate(S.JS_PRINT_FIXTURE)
                r.check("provenance-not-hidden-in-print" + tag, fx["display"] != "none" and fx["size"] >= 10 and fx["opacity"] == "1" and fx["style"] == "normal" and fx["color"] == fx["srcColor"], fx)
                page.emulate_media(media="screen")
            finally:
                s.close()

            # ============================================================ pin toggles through the bus; the drawer's Pin repaints
            s, page = fresh(h, browser, width)
            try:
                settle(h, page)
                present = page.evaluate(S.JS_PRESENT)
                rid = pick_full_region(present, list(present.keys()))
                open_drawer(page, rid)
                page.locator(SEL["pin"]).click()
                page.wait_for_timeout(300)
                pn = page.evaluate("(() => { const p = document.querySelector('#region-drawer .drawer-star[data-region]'); return { t: p.textContent.trim(), a: p.getAttribute('aria-pressed') }; })()")
                r.check("pin-toggles-and-says-pinned" + tag, pn["t"] == "Pinned" and pn["a"] == "true", pn)
                page.locator(SEL["pin"]).click()
                page.wait_for_timeout(300)
                pn = page.evaluate("(() => { const p = document.querySelector('#region-drawer .drawer-star[data-region]'); return { t: p.textContent.trim(), a: p.getAttribute('aria-pressed') }; })()")
                r.check("pin-toggles-back-to-pin" + tag, pn["t"] == "Pin" and pn["a"] == "false", pn)
            finally:
                s.close()
        finally:
            h.close_browser(browser)

    # ---------------------------------------------------------------- the sheet boundary: 767 and 768
    browser = h.launch()
    try:
        s, page = fresh(h, browser, 1000)
        try:
            settle(h, page)
            present = page.evaluate(S.JS_PRESENT)
            rid = pick_full_region(present, list(present.keys()))
            for w, kind in ((767, "sheet"), (768, "leaf")):
                page.set_viewport_size({"width": w, "height": 900})
                page.wait_for_timeout(150)
                open_drawer(page, rid)
                f = page.evaluate(S.JS_FRAME)
                is_sheet = abs(f["width"] - f["vw"]) < 1 and f["top"] > 0
                r.check("sheet-boundary:%d-is-%s" % (w, kind), is_sheet == (kind == "sheet"), "width %.0f of %d, top %.0f" % (f["width"], f["vw"], f["top"]))
                page.keyboard.press("Escape")
                page.wait_for_timeout(300)
        finally:
            s.close()
    finally:
        h.close_browser(browser)

    # ---------------------------------------------------------------- the files themselves
    css = {}
    for f in ("drawer.css", "reciprocity.css"):
        p = h.site / "src" / "styles" / f
        css[f] = p.read_text(encoding="utf-8") if p.is_file() else ""
        r.check("stylesheet-shipped:%s" % f, bool(css[f]), str(p))
    # MC-MAP-UI removed the two blocks that were misplaced in drawer.css; they now live in map.css only.
    r.check("drawer-css-misplaced-blocks-removed" + "", "MISPLACED" not in css["drawer.css"] and ".map-legend {" not in css["drawer.css"] and ".map-wrap { position: relative; }" not in css["drawer.css"])
    for f, txt in css.items():
        faded = [m for m in re.findall(r"opacity\s*:\s*([^;}]+)", txt) if m.strip() not in ("1", "0")]
        r.check("stylesheet-no-faded-text-opacity:%s" % f, not faded, faded)
        r.check("stylesheet-no-hardcoded-colour-outside-fallbacks:%s" % f, not re.search(r"#[0-9a-fA-F]{3,8}\b", txt), re.findall(r"#[0-9a-fA-F]{3,8}\b", txt)[:4])
    sg = (h.site / "src" / "ui" / "signup.js").read_text(encoding="utf-8")
    r.check("signup-success-check-untouched" + "", sg.count("String(data.success) === 'true'") == 2, sg.count("String(data.success) === 'true'"))
    r.check("signup-modal-uses-the-overlay-manager" + "", "openOverlay('signup-modal'" in sg and "closeOverlay('signup-modal'" in sg and "whenIdle(" in sg)
    return r.out
