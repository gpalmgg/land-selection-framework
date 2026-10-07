"""test_hero: the home page's opening (design FS 8.2 to 8.5, 9, 10; MC-HERO).

  * hero: exactly one h1, computed font-family starts with Fraunces, font-size equals the --t-hero clamp at 1280 and 390, the last word is an
    italic accent; subtitle and lede copy; count words in the lede and the headings are READ FROM site-facts, never typed here; the retired stat
    strip is gone; the Catchment is an inline aria-hidden SVG of at most 10.5 KB with the draw-in; reduced motion draws it at once; the class
    is dropped after the last animationend; the Fraunces roman file is preloaded; the signup slip is visual only (same form, same relay)
  * "How to read this": the h2, the For / Not for pair, links to /arrive.html and /host.html (home band and colophon)
  * Century Line: one row per criterion in declared order, role="img" with an aria-label that lists every criterion, closing sentence equal to
    lib/century.js on the real data, hatched/dotted marks, no horizontal overflow
  * starting points: five chips (four presets and "Show every region"), each preset chip shows its "sets" line before it is pressed (equal to
    presetThresholdSummary), no number in the neutral chip, aria-pressed follows the sliders, behaviour unchanged (URL, sliders)
  * every preset matches at least one region per continent on the real data
  * headings: no orphan word, font-swap probe (web font blocked) keeps line counts, CLS at most 0.05 (3-run median), rendered-text contrast 0 failures

Nothing is ever submitted: the harness aborts and records every formsubmit.co request, and this suite never clicks a submit control.
"""
import re
import statistics

from lib import sel as _sel
from lib.site import default_storage, goto_settled

NAME = "test_hero"
S = _sel.load("hero")
SHELL = _sel.load("shell")
SEL = S.SEL
NO_NUM_WORDS = ("one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen",
                "fifteen", "sixteen", "seventeen", "eighteen", "nineteen", "twenty", "thirty", "forty", "fifty")


def px(v):
    try:
        return float(str(v).replace("px", ""))
    except Exception:
        return None


def fresh(h, browser, width, path="/", reduced=True, init=()):
    s = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, reduced_motion=reduced, extra_init=init)
    page = s.page()
    goto_settled(page, h.base + path, extra_ms=500)
    return s, page


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    for width in h.widths:
        tag = "@%d" % width
        wide = width >= 1000
        browser = h.launch()
        try:
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                facts = page.evaluate(S.JS_FACTS)
                v = facts["v"]
                hero = page.evaluate(S.JS_HERO)

                # ------------------------------------------------------------------------------------------------ hero
                r.check("one-h1" + tag, hero["h1Count"] == 1, hero["h1Count"])
                r.check("h1-text" + tag, hero["h1Text"] == "Land Selection Framework", hero["h1Text"])
                r.check("h1-fraunces-first" + tag, hero["h1Family"].replace('"', "").replace("'", "").split(",")[0].strip() == "Fraunces", hero["h1Family"])
                r.check("h1-size-is-the-t-hero-clamp" + tag, hero["h1Size"] == hero["heroSize"], "%s vs --t-hero %s" % (hero["h1Size"], hero["heroSize"]))
                want = min(max(52, 0.08 * width), 116)
                r.check("h1-size-matches-clamp-52-8vw-116" + tag, abs(px(hero["h1Size"]) - want) < 1.5, "%s vs %.1fpx" % (hero["h1Size"], want))
                r.check("h1-type-330-line-95-track" + tag, hero["h1Weight"] == "330" and abs(px(hero["h1Line"]) / px(hero["h1Size"]) - 0.95) < 0.01
                        and abs(px(hero["h1Track"]) / px(hero["h1Size"]) + 0.028) < 0.002, {"w": hero["h1Weight"], "lh": hero["h1Line"], "ls": hero["h1Track"]})
                r.check("h1-opsz-pinned-96" + tag, '"opsz" 96' in hero["h1Opsz"], hero["h1Opsz"])
                r.check("h1-last-word-italic-accent" + tag, hero["emStyle"] == "italic" and hero["emWeight"] == "300" and hero["emColor"] == hero["accent"], {"s": hero["emStyle"], "w": hero["emWeight"], "c": hero["emColor"], "a": hero["accent"]})
                r.check("h1-italic-has-room-for-its-overhang" + tag, px(hero["emPad"]) > 0, hero["emPad"])
                r.check("subtitle-copy-unchanged" + tag, hero["subText"] == S.SUBTITLE, hero["subText"])
                r.check("subtitle-spectral-italic-300-30ch" + tag, "Spectral" in hero["subFamily"] and hero["subStyle"] == "italic" and hero["subWeight"] == "300", hero)
                r.check("eyebrow-copy" + tag, (hero["eyebrow"] or "").strip() == "A bioregioning tool · prototype 2026", hero["eyebrow"])
                crit_w, reg_w = v["criteriaWord"], v["regionsWord"]
                r.check("lede-count-words-from-site-facts" + tag, ("reads %s criteria" % crit_w) in hero["ledeText"] and ("across %s regions" % reg_w) in hero["ledeText"], hero["ledeText"][:400])
                r.check("lede-18px-key-sentence-500" + tag, hero["ledeSize"] == "18px" and hero["ledeStrong"] == "500", {"size": hero["ledeSize"], "strong": hero["ledeStrong"]})
                r.check("lede-note-italic" + tag, hero["noteStyle"] == "italic", hero["noteStyle"])
                r.check("stat-strip-retired" + tag, not hero["keyStrip"] and "Doc round" not in hero["heroText"] and "Regions read" not in hero["heroText"], "key strip or its labels still present")
                a = hero["art"]
                r.check("art-is-inline-aria-hidden-svg" + tag, bool(a) and a["svg"] and a["aria"] == "true" and a["pe"] == "none", a)
                r.check("art-26-paths-pathlength-1" + tag, a["paths"] == 26 and a["hasPathLength"], a)
                r.check("art-svg-at-most-10_5-kb" + tag, 0 < a["svgBytes"] <= 10752, "%d bytes" % a["svgBytes"])
                r.check("art-width" + tag, (a["w"] <= 270.5 + 1 if not wide else 340 <= a["w"] <= 640.5), a["w"])
                r.check("river-rule-aria-hidden-and-drawn" + tag, hero["river"] and hero["river"]["aria"] == "true" and (hero["river"]["d"] or "").startswith("M2 11"), hero["river"])
                r.check("fraunces-roman-preloaded" + tag, any("fraunces-var-latin.woff2?v=fv1" in x for x in hero["preload"]), hero["preload"])
                e = hero["ethics"]
                r.check("ethics-link" + tag, e and e["href"] == "/deeper.html#ethics" and "On the ethics of a framework like this" in e["text"] and e["svg"] and not e["arrowGlyph"], e)
                r.check("hero-no-horizontal-overflow" + tag, hero["overflow"] == 0, hero["overflow"])
                # headline and lede sit on clear paper: the art stays out of the 56ch lede on desktop
                if wide:
                    box = page.evaluate("() => { const a = document.querySelector('.hero-art').getBoundingClientRect(); const l = document.querySelector('.hero .lede').getBoundingClientRect(); return { artLeft: a.left, ledeRight: l.right, artTop: a.top, ledeTop: l.top }; }")
                    r.check("lede-clear-of-the-art" + tag, box["artLeft"] >= box["ledeRight"] - 4, box)

                # ---- signup slip: visual only
                sg = page.evaluate(S.JS_SIGNUP)
                r.check("signup-slip-dashed-fraunces-italic-ink-button" + tag, sg["bStyle"] == "dashed" and sg["h2Style"] == "italic" and "Fraunces" in sg["h2Family"] and sg["btnSvg"], sg)
                r.check("signup-form-markup-untouched" + tag, (sg["action"] or "").startswith("https://formsubmit.co/ajax/") and (sg["method"] or "").upper() == "POST"
                        and sorted(sg["inputs"]) == sorted(["email", "_subject", "_captcha", "_template", "_honey", "BUTTON"]) and sg["email"] and sg["live"] == "polite", sg)
                tok = page.evaluate(S.JS_TOKENS)
                r.check("signup-button-is-ink" + tag, sg["btnBg"] == tok["ink"], "%s vs ink %s" % (sg["btnBg"], tok["ink"]))

                # ------------------------------------------------------------------------------------------------ How to read this
                ar = page.evaluate(S.JS_ARRIVE)
                r.check("arrive-h2" + tag, ar["h2"] == "A place is not a product. Arriving is a relationship.", ar["h2"])
                r.check("arrive-h2-fraunces-340-italic-second-sentence" + tag, "Fraunces" in ar["h2Family"] and ar["h2Weight"] == "340" and ar["emStyle"] == "italic", ar)
                r.check("arrive-band-paper-2-ruled" + tag, ar["bg"] == tok["paper-2"] and ar["bt"] == "1px" and ar["bb"] == "1px", {"bg": ar["bg"], "t": ar["bt"], "b": ar["bb"]})
                r.check("arrive-for-and-not-for-pair" + tag, [t["text"] for t in ar["tags"]] == ["For", "Not for"] and len(ar["fors"]) == 2, ar["tags"])
                r.check("arrive-tag-colours-secondary-words-carry-meaning" + tag, ar["tags"][0]["color"] == tok["host"] and ar["tags"][1]["color"] == tok["accent"], ar["tags"])
                r.check("arrive-two-columns-on-desktop" + tag, (ar["cols"] == 2) if wide else True, ar["cols"])
                r.check("arrive-bridge-to-compass-kept" + tag, ar["bridge"] and not ar["arrowGlyph"], ar["bridge"])
                r.check("arrive-links-to-arrive-and-host" + tag, ar["pages"] == ["/arrive.html", "/host.html"] and ar["colophonPages"] == ["/arrive.html", "/host.html"], {"band": ar["pages"], "colophon": ar["colophonPages"]})
                r.check("arrive-no-journey-word" + tag, "journey" not in (ar["lede"] or "").lower(), "journey")

                # ------------------------------------------------------------------------------------------------ Century Line
                cl = page.evaluate(S.JS_CENTURY)
                crits = facts["criteria"]
                r.check("century-present" + tag, cl is not None, None)
                r.check("century-role-img-with-aria-label" + tag, cl["role"] == "img" and bool(cl["label"]), cl["role"])
                r.check("century-one-row-per-criterion" + tag, cl["rows"] == len(crits), "%d rows, %d criteria" % (cl["rows"], len(crits)))
                r.check("century-declared-order" + tag, cl["names"] == [c["name"] for c in crits], cl["names"])
                r.check("century-aria-label-lists-every-criterion" + tag, all(c["name"] in cl["label"] for c in crits), cl["label"][:300])
                r.check("century-every-criterion-has-a-window-and-a-bar" + tag, all(c["window"] for c in crits) and cl["nowin"] == 0 and cl["segs"] == len(crits), {"nowin": cl["nowin"], "segs": cl["segs"]})
                r.check("century-marks-match-the-data" + tag, cl["proj"] == sum(1 for c in crits if c["window"] and c["window"]["kind"] == "projection")
                        and cl["pts"] == sum(1 for c in crits if c["window"] and c["window"]["from"] == c["window"]["to"]), {"proj": cl["proj"], "pts": cl["pts"]})
                r.check("century-vintage-is-plain-text-in-each-row" + tag, all(c["window"]["label"] in (sm or "") for c, sm in zip(crits, cl["small"]) if c["window"]), cl["small"])
                r.check("century-closing-sentence-is-computed" + tag, (cl["note"] or "") == facts["model"]["closing"], "%s vs %s" % (cl["note"], facts["model"]["closing"]))
                r.check("century-aria-label-equals-model" + tag, cl["label"] == facts["model"]["ariaLabel"], cl["label"][:200])
                r.check("century-axis-decorative" + tag, cl["axisHidden"] == "true" and 1995 >= facts["model"]["axis"]["from"], cl["axisHidden"])
                r.check("century-now-and-horizon-labels" + tag, (cl["nowLabel"] or "").startswith("Now") and str(facts["model"]["now"]) in cl["nowLabel"] and "50 to 100 years" in (cl["hzLabel"] or ""), cl)
                r.check("century-bars-inside-their-tracks" + tag, cl["segsInside"], None)
                r.check("century-no-horizontal-overflow" + tag, cl["scrollW"] <= cl["clientW"] + 1, "%s > %s" % (cl["scrollW"], cl["clientW"]))
                r.check("century-static-markup-small" + tag, cl["nodes"] < 140, "%d nodes" % cl["nodes"])
                r.check("century-leaf-radius-tinted-panel" + tag, cl["radius"] == "3px 28px", cl["radius"])
                if not wide:
                    r.check("century-rows-stack-below-768" + tag, cl["stacked"] == "block" and all(t == 22 for t in cl["trackH"]), {"display": cl["stacked"], "track": cl["trackH"]})
                else:
                    r.check("century-rows-are-a-grid-on-desktop" + tag, cl["stacked"] == "grid", cl["stacked"])
                r.check("century-no-ranking-words" + tag, not re.search(r"\b(best|top|rank|score|winner)\w*", (cl["note"] or "") + " " + cl["label"], re.I), None)

                # ------------------------------------------------------------------------------------------------ starting points
                ch = page.evaluate(S.JS_CHIPS)
                presets = facts["presets"]
                r.check("guided-five-chips" + tag, ch["n"] == len(presets) + 1 == 5, ch["n"])
                r.check("guided-chips-are-buttons-with-aria-pressed" + tag, all(c["tag"] == "BUTTON" and c["type"] == "button" and c["pressed"] == "false" for c in ch["chips"]), ch["chips"][0])
                r.check("guided-chip-columns" + tag, ch["cols"] == (5 if width >= 1280 else (3 if width >= 768 else 2)), ch["cols"])
                for p, summary, c in zip(presets, facts["summaries"], ch["chips"][:-1]):
                    r.check("guided-chip-shows-its-sets-line-before-pressed:%s%s" % (p["id"], tag), c["text"] == p["label"] and c["sets"] == summary and summary.count(";") == len(p["sets"]) - 1, {"text": c["text"], "sets": c["sets"], "want": summary})
                    r.check("guided-chip-icon-18px-accent:%s%s" % (p["id"], tag), c["ico"] and c["icoSize"] == 18, c)
                neutral = ch["chips"][-1]
                r.check("guided-neutral-label-has-no-number" + tag, neutral["neutral"] and neutral["text"] == "Show every region" and not re.search(r"\d", neutral["text"] + " " + (neutral["label"] or ""))
                        and not any(re.search(r"\b%s\b" % w, neutral["text"], re.I) for w in NO_NUM_WORDS), neutral)
                r.check("guided-neutral-is-dashed-italic-transparent" + tag, neutral["style"] == "dashed" and neutral["fontStyle"] == "italic" and neutral["bg"] in ("rgba(0, 0, 0, 0)", "transparent"), neutral)
                r.check("guided-chip-top-border-3px-ink" + tag, ch["chips"][0]["bt"] == "3px" and ch["chips"][0]["btColor"] == tok["ink"], ch["chips"][0])
                r.check("guided-chip-min-height-132-desktop" + tag, (ch["chips"][0]["h"] >= 131.5) if width >= 768 else (ch["chips"][0]["h"] >= 111.5), ch["chips"][0]["h"])
                r.check("guided-chip-tap-target-44" + tag, all(c["h"] >= 44 and c["w"] >= 44 for c in ch["chips"]), [(c["w"], c["h"]) for c in ch["chips"]])
                r.check("guided-note" + tag, (ch["note"] or "").strip() == "Starting points, not recommendations. They move sliders; they compose nothing.", ch["note"])

                # ---- the presets still match something on each continent (real data)
                pm = page.evaluate(S.JS_PRESET_MATCH)
                zero = [x for x in pm if x[2] < 1]
                r.check("every-preset-matches-a-region-per-continent" + tag, not zero, pm)

                # ------------------------------------------------------------------------------------------------ headings and facts
                hd = page.evaluate("() => ({ regions: document.querySelector('.regions-intro h2').textContent, regionsP: document.querySelector('.regions-intro > .container > p').textContent, criteria: document.querySelector('.criteria h2').textContent, guidedSub: document.querySelector('.guided-sub').textContent })")
                r.check("regions-heading-is-data-driven" + tag, hd["regions"].replace(" ", " ") == "%s regions, briefly named." % v["RegionsWord"], hd["regions"])
                r.check("criteria-heading-is-data-driven" + tag, hd["criteria"].replace(" ", " ") == "The %s criteria, region by region." % v["criteriaWord"], hd["criteria"])
                r.check("layers-sentence-is-data-driven" + tag, ("carries %s data layers across %s themes" % (v["layersWord"], v["themesWord"])) in hd["regionsP"], hd["regionsP"][:200])
                r.check("guided-lede-count-word-from-site-facts" + tag, ("filter %s regions" % v["regionsWord"]) in hd["guidedSub"], hd["guidedSub"][:300])
                r.check("heading-last-two-words-joined" + tag, hd["regions"].endswith("briefly named.") and hd["criteria"].endswith("by region."), None)
                for sel, lines, last in page.evaluate(S.JS_ORPHAN, S.HEADINGS):
                    if sel == "section.hero h1":
                        continue        # the h1 is two lines by design ("Land Selection" / "Framework", design 8.2): the brand name, not a sentence
                    r.check("no-orphan-word:%s%s" % (sel, tag), lines is None or lines == 1 or len(last) >= 2, "last line holds %s over %s line(s)" % (last, lines))

                # ---- rendered-text contrast, the opening of the page
                cr = page.evaluate(SHELL.JS_CONTRAST, S.HERO_SELECTOR)
                r.check("contrast-hero-band-text-aa" + tag, not cr["shellFails"], "checked %d text nodes; failures: %s" % (cr["checked"], cr["shellFails"][:4]))
                errs = log.errors() + [{"type": "pageerror", "text": x} for x in log.pageerrors]
                r.check("no-console-errors" + tag, not errs, "; ".join(str(x.get("text"))[:160] for x in errs[:3]))
                r.check("no-formsubmit" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()

            # ===================================================================================== starting points: behaviour
            s, page = fresh(h, browser, width)
            try:
                facts = page.evaluate(S.JS_FACTS)
                chips = page.locator(SEL["chips"])
                first = chips.nth(0)
                first.scroll_into_view_if_needed()
                first.click()
                page.wait_for_timeout(1100)
                ch = page.evaluate(S.JS_CHIPS)
                q = page.evaluate("location.search")
                r.check("guided-press-sets-aria-pressed-on-that-chip-only" + tag, [c["pressed"] for c in ch["chips"]] == ["true", "false", "false", "false", "false"], [c["pressed"] for c in ch["chips"]])
                r.check("guided-press-writes-url-thresholds" + tag, "t." in q, q)
                th = page.evaluate(S.JS_SLIDERS)
                want = {k: v for k, v in facts["presets"][0]["sets"].items()}
                r.check("guided-press-syncs-the-sliders" + tag, all(abs(th[k] - v) < 1e-6 for k, v in want.items()), {"sliders": th, "want": want})
                r.check("guided-pressed-chip-is-ink-fill" + tag, ch["chips"][0]["bg"] == page.evaluate(S.JS_TOKENS)["ink"], ch["chips"][0]["bg"])
                # moving a slider lets go of the chip
                crit_id = list(want.keys())[0]
                sl = page.locator("#crit-%s input[type=range]" % crit_id)
                sl.scroll_into_view_if_needed()
                sl.focus()
                page.keyboard.press("ArrowRight")
                page.wait_for_timeout(500)
                r.check("guided-slider-move-releases-the-chip" + tag, page.evaluate("document.querySelector('#guided-chips .guided-chip').getAttribute('aria-pressed')") == "false", None)
                # a second preset replaces the first
                chips.nth(1).scroll_into_view_if_needed()
                chips.nth(1).click()
                page.wait_for_timeout(800)
                r.check("guided-second-preset-replaces-the-first" + tag, [c["pressed"] for c in page.evaluate(S.JS_CHIPS)["chips"]] == ["false", "true", "false", "false", "false"], None)
                # "Show every region" resets and is itself pressed
                neutral = page.locator(SEL["neutral"])
                neutral.scroll_into_view_if_needed()
                neutral.click()
                page.wait_for_timeout(800)
                ch = page.evaluate(S.JS_CHIPS)
                r.check("guided-neutral-clears-thresholds" + tag, "t." not in page.evaluate("location.search"), page.evaluate("location.search"))
                r.check("guided-neutral-is-pressed" + tag, [c["pressed"] for c in ch["chips"]] == ["false", "false", "false", "false", "true"], [c["pressed"] for c in ch["chips"]])
                page.locator("#reset-btn").scroll_into_view_if_needed()
                page.locator("#reset-btn").click()
                page.wait_for_timeout(500)
                r.check("no-formsubmit-guided" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()

            # a shared link opens with nothing pressed
            s, page = fresh(h, browser, width, path="/?t.solar_pv=1400")
            try:
                r.check("guided-shared-link-opens-with-nothing-pressed" + tag, all(c["pressed"] == "false" for c in page.evaluate(S.JS_CHIPS)["chips"]), None)
            finally:
                s.close()

            # ===================================================================================== draw-in (needs motion allowed)
            s, page = fresh(h, browser, width, reduced=False)
            try:
                d0 = page.evaluate(S.JS_DRAW)
                r.info("draw-class-while-drawing" + tag, d0)
                page.wait_for_timeout(5600)
                d1 = page.evaluate(S.JS_DRAW)
                r.check("draw-class-dropped-after-the-last-animationend" + tag, d1["drawClass"] == 0, d1)
                r.check("drawing-complete-after-the-class-is-gone" + tag, all(p["dash"] in ("none", "") or p["off"] in ("0px", "0") for p in d1["paths"]) and d1["riverOff"] in ("0px", "0", "none", None), d1)
            finally:
                s.close()
            s, page = fresh(h, browser, width, reduced=True)
            try:
                d = page.evaluate(S.JS_DRAW)
                r.check("reduced-motion-draws-at-once-and-drops-the-class" + tag, d["drawClass"] == 0 and all(p["anim"] == "none" for p in d["paths"]), d)
            finally:
                s.close()

            # ===================================================================================== font swap and CLS
            def headings_with(block_fraunces):
                ss = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, reduced_motion=True)
                if block_fraunces:
                    # the design's method (final-assets/tools/fallback_probe.py): the family name 'Fraunces' becomes an undefined name, so the
                    # browser uses the metric-matched 'Fraunces Fallback' faces (this also defeats any system-installed Fraunces); the files are blocked too
                    def rename(route):
                        resp = route.fetch()
                        route.fulfill(response=resp, body=re.sub(r"'Fraunces'(?!\s*Fallback)", "'FraunX'", resp.text()))
                    ss.context.route(re.compile(r"/src/styles/[^?]*\.css"), rename)
                    ss.context.route("**/fraunces-*", lambda route: route.abort())
                pg = ss.page()
                goto_settled(pg, h.base + "/", extra_ms=900)
                pg.evaluate("document.fonts.ready")
                out = pg.evaluate(S.JS_HEADINGS, S.HEADINGS)
                ss.close()
                return out
            try:
                loaded, blocked = headings_with(False), headings_with(True)
                bad = []
                for a, b in zip(loaded, blocked):
                    if a[1] is None:
                        continue
                    if a[3] != b[3]:
                        bad.append("%s lines %s->%s" % (a[0], a[3], b[3]))
                r.check("font-swap-keeps-line-counts" + tag, not bad, "; ".join(bad) or [(a[0], a[3]) for a in loaded])
                hb = [(a[0], a[2], b[2]) for a, b in zip(loaded, blocked) if a[1] is not None and abs(a[2] - b[2]) > 2]
                r.check("font-swap-keeps-box-heights" + tag, not hb, hb)
            except Exception as ex:
                r.check("font-swap-probe-ran" + tag, False, str(ex)[:300])

            vals = []
            for _ in range(3):
                ss = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, reduced_motion=True, extra_init=[S.JS_CLS])
                pg = ss.page()
                goto_settled(pg, h.base + "/", extra_ms=1500)
                pg.evaluate("window.scrollTo(0, document.body.scrollHeight / 2)")
                pg.wait_for_timeout(600)
                vals.append(round(pg.evaluate("window.__cls || 0"), 4))
                ss.close()
            med = statistics.median(vals)
            r.check("cls-at-most-0_05-median-of-3" + tag, med <= 0.05, "runs %s, median %s" % (vals, med))
        finally:
            h.close_browser(browser)
    return r.out
