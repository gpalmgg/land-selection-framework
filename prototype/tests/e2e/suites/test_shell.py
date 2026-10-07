"""test_shell: the page shell of the home page (design FS 8.1, 8.19, 8.20, 6.5; MC-SHELL).

  * the skip link is the FIRST Tab stop, comes before the rail in the DOM, is visible on focus with a 3px accent outline
  * the rail: six links in the suite's order with their labels and URLs, 04 and 05 present, one aria-current, a stem by CSS mask,
    six ring nodes, the current entry a filled ink block with a filled accent node; fixed 232px from 900px, a static two-column
    strip below it (no stem, no foot); hidden in print
  * the top line replaces the brick banner (one quiet line, no fill)
  * the colophon replaces the footer: frame sentence, three columns (canon AUTHORSHIP, PRIVACY, CONTACT; "ornament, not surveyed";
    sources cited), the standing notes (canon STATUS, the stamped REVISION sentence), the stamp line with the build date, the art
  * no "The Collective", no mailto, no "@", no personal contact, no "use the newsletter signup" as a contact route
  * signup forms, VISUAL ONLY: #form-status and #modal-status are aria-live, the arrow is an SVG, the modal wave replaces the topo,
    the modal's z-index exceeds the drawer's and the compare overlay's, a closed modal is not in the tab order, same ids, fields, action
  * src/ui/signup.js: String(data.success) === 'true' twice, the error strings changed, no "email me directly"
  * the suite note states no tool count; the mobile note is restyled with its behaviour intact
  * rendered-text contrast of the shell elements (and the whole page, reported)

Nothing is ever submitted: the harness aborts and records every formsubmit.co request, and this suite never clicks a submit control.
"""
import re
from pathlib import Path

from lib import sel as _sel
from lib.site import default_storage, goto_settled, mobile_note_key, storage_keys

NAME = "test_shell"
S = _sel.load("shell")
SEL = S.SEL

SHELL_SELECTOR = "#rct-rail, .skip-link, .prototype-banner, .mobile-note, footer.colophon, section.contact, #signup-modal, .suite-note"
NUMBER_WORDS = ("one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve")


def js_string(src, key):
    """The single-quoted string literal assigned to `key:` in data/site-facts.js (\\' unescaped), or None."""
    m = re.search(r"\b%s:\s*'((?:[^'\\]|\\.)*)'" % re.escape(key), src)
    return m.group(1).replace("\\'", "'") if m else None


def site_facts(site):
    p = Path(site) / "data" / "site-facts.js"
    src = p.read_text("utf-8") if p.is_file() else ""
    out = {"canon": {}}
    for k in ("authorship", "privacy", "contact", "status", "revision"):
        out["canon"][k] = js_string(src, k)
    m = re.search(r"export const buildDate = '([^']*)'", src)
    out["buildDate"] = m.group(1) if m else None
    m = re.search(r"dataRevision = \{ month: '([^']*)' \}", src)
    out["dataRevision"] = m.group(1) if m else None
    return out


def fresh(h, browser, width, path="/", storage="subscribed", scheme="light"):
    if storage == "subscribed":
        st = default_storage(h.site, modal=False)
    elif storage == "none":
        st = default_storage(h.site, modal=True)
    elif storage == "mobile-note-visible":
        k, v = storage_keys(h.site)
        st = {k: v}                       # modal stands down; the mobile note key is NOT seeded, so the note shows
    else:
        st = storage
    s = h.session(browser, width=width, storage=st, stub=True, scheme=scheme)
    page = s.page()
    goto_settled(page, h.base + path, extra_ms=500)
    return s, page


def px(v):
    try:
        return float(str(v).replace("px", ""))
    except Exception:
        return None


def clean(r, tag, log, label):
    errs = log.errors() + [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    facts = site_facts(h.site)

    # ------------------------------------------------------------------------------------------------ static: signup.js
    sj = Path(h.site) / "src" / "ui" / "signup.js"
    if sj.is_file():
        src = sj.read_text("utf-8")
        r.check("signup-js-success-check-twice", src.count("String(data.success) === 'true'") == 2, "%d occurrences" % src.count("String(data.success) === 'true'"))
        r.check("signup-js-no-email-me-directly", "email me directly" not in src, "string still present")
        r.check("signup-js-no-first-person-voice", "I won\\'t share" not in src and "I won't share" not in src, "first-person voice still present")
        r.check("signup-js-new-error-string-twice", src.count("Something went wrong. Please try again in a moment.") == 2,
                "%d occurrences" % src.count("Something went wrong. Please try again in a moment."))
        r.check("signup-js-no-mailto", "mailto:" not in src.replace("(FormSubmit.co endpoint, mailto fallback in the footnote)", ""), "mailto: literal in the file")
    else:
        r.check("signup-js-present", False, str(sj))

    for width in h.widths:
        tag = "@%d" % width
        wide = width >= 1000
        browser = h.launch()
        try:
            # ================================================================================== the page, modal stood down
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                tok = page.evaluate(S.JS_TOKENS)

                # ---------------------------------------------------------------- skip link: the first Tab stop, visible, 3px accent outline
                page.keyboard.press("Tab")
                ft = page.evaluate(S.JS_FIRST_TAB) or {}
                r.check("skip-link-first-tab-stop" + tag, "skip-link" in (ft.get("cls") or "") and ft.get("href") == "#main", ft)
                r.check("skip-link-before-rail-in-dom" + tag, bool(ft.get("beforeRail")), ft)
                inview = ft.get("top", -999) >= 0 and ft.get("left", -999) >= 0 and ft.get("right", 99999) <= ft.get("vw", 0) and ft.get("bottom", 99999) <= ft.get("vh", 0)
                r.check("skip-link-visible-on-focus" + tag, inview and ft.get("transform") in ("none", "matrix(1, 0, 0, 1, 0, 0)"), ft)
                r.check("skip-link-3px-accent-outline" + tag, ft.get("outlineWidth") == "3px" and ft.get("outlineStyle") == "solid" and ft.get("outlineColor") == tok["accent"],
                        "%s %s %s vs accent %s" % (ft.get("outlineWidth"), ft.get("outlineStyle"), ft.get("outlineColor"), tok["accent"]))
                r.check("skip-link-ink-block" + tag, ft.get("background") == tok["ink"] and ft.get("color") == tok["paper"], "%s on %s" % (ft.get("color"), ft.get("background")))
                page.keyboard.press("Enter")
                page.wait_for_timeout(200)
                r.check("skip-link-moves-to-main" + tag, page.evaluate("location.hash") == "#main", page.evaluate("location.hash"))
                page.keyboard.press("Shift+Tab")        # leave focus state tidy for the later probes
                page.evaluate("window.scrollTo(0, 0)")

                # ---------------------------------------------------------------- rail
                rail = page.evaluate(S.JS_RAIL)
                r.check("rail-six-links" + tag, bool(rail) and rail["count"] == 6, rail and rail["count"])
                want = [(a, b) for a, b, _ in S.RAIL]
                got = [((i["num"] or "").strip(), (i["nm"] or "").strip()) for i in (rail or {}).get("items", [])]
                r.check("rail-labels-and-order" + tag, got == want, got)
                hosts_ok = all(("://" + host) in (i["href"] or "") for i, (_, _, host) in zip(rail["items"], S.RAIL))
                r.check("rail-urls" + tag, hosts_ok, [i["href"] for i in rail["items"]])
                nums = [x[0] for x in got]
                r.check("rail-has-04-and-05" + tag, any(n.startswith("04") for n in nums) and any(n.startswith("05") for n in nums), nums)
                cur = [i for i in rail["items"] if i["current"]]
                r.check("rail-one-aria-current-is-land-selection" + tag, len(cur) == 1 and (cur[0]["nm"] or "").strip() == "Land Selection" and cur[0]["current"] == "page", cur)
                r.check("rail-foot-link" + tag, (rail["foot"] is None) or ("regencommunity.tools" in (rail["foot"]["text"] or "")), rail["foot"])
                r.check("rail-aside-label" + tag, page.evaluate("document.getElementById('rct-rail').getAttribute('aria-label')") == "Regen Community Tools")
                r.check("rail-type" + tag, rail["nums"][0]["weight"] in ("600",) and rail["nums"][0]["tt"] == "uppercase" and rail["names"][0]["size"] == "14px"
                        and rail["names"][0]["weight"] == "500" and px(rail["nums"][0]["size"]) == 10.0, {"nums": rail["nums"][0], "names": rail["names"][0]})
                r.check("rail-current-ink-block" + tag, rail["currentBg"] == tok["ink"] and rail["currentColor"] == tok["paper"], "%s on %s" % (rail["currentColor"], rail["currentBg"]))
                if wide:
                    r.check("rail-fixed-232" + tag, rail["position"] == "fixed" and rail["width"] == 232, "%s %spx" % (rail["position"], rail["width"]))
                    r.check("rail-z-index-60" + tag, rail["zIndex"] == "60", rail["zIndex"])
                    r.check("rail-paper-ground-and-1px-edge" + tag, rail["bg"] == tok["paper"] and rail["borderRight"].startswith("1px solid"), "%s %s" % (rail["bg"], rail["borderRight"]))
                    r.check("rail-stem-is-a-css-mask" + tag, rail["stem"]["hasMask"] and rail["stem"]["display"] != "none" and rail["stem"]["width"] == "12px", rail["stem"])
                    r.check("rail-ring-nodes-11px" + tag, rail["firstNode"]["w"] == "11px" and rail["firstNode"]["h"] == "11px" and rail["firstNode"]["radius"] in ("50%", "5.5px")
                            and rail["firstNode"]["borderW"] in ("1px", "1.5px", "1.4px"), rail["firstNode"])   # 1.5px snaps to 1px at 1x device pixels
                    r.check("rail-current-node-15px-accent-soft" + tag, rail["currentNode"] and rail["currentNode"]["w"] == "15px" and rail["currentNode"]["bg"] == tok["accent-soft"], rail["currentNode"])
                    r.check("rail-wordmark-caps-ink-3" + tag, rail["wordmark"]["tt"] == "uppercase" and rail["wordmark"]["weight"] == "600" and "Inter" in rail["wordmark"]["family"], rail["wordmark"])
                    r.check("body-makes-room-for-rail" + tag, rail["bodyPadLeft"] == "232px", rail["bodyPadLeft"])
                    r.check("rail-foot-shown" + tag, rail["foot"] is not None and rail["foot"]["display"] != "none", rail["foot"])
                else:
                    r.check("rail-static-strip-below-900" + tag, rail["position"] == "static" and rail["bodyPadLeft"] == "0px", "%s, body padding %s" % (rail["position"], rail["bodyPadLeft"]))
                    r.check("rail-strip-two-columns" + tag, rail["navDisplay"] == "grid" and len(rail["navCols"].split(" ")) == 2, "%s %s" % (rail["navDisplay"], rail["navCols"]))
                    r.check("rail-strip-no-stem-no-nodes" + tag, rail["stem"]["display"] == "none" and rail["firstNode"]["display"] == "none", {"stem": rail["stem"]["display"], "node": rail["firstNode"]["display"]})
                    r.check("rail-strip-no-foot" + tag, rail["foot"] is None or rail["foot"]["display"] == "none", rail["foot"])

                # ---------------------------------------------------------------- top line
                tl = page.evaluate(S.JS_TOPLINE)
                r.check("topline-text" + tag, bool(tl) and tl["text"] == S.TOPLINE_TEXT, tl and tl["text"])
                r.check("topline-no-fill-no-rule" + tag, tl["bg"] in ("rgba(0, 0, 0, 0)", "transparent") and tl["borderBottom"] == "0px", "%s %s" % (tl["bg"], tl["borderBottom"]))
                r.check("topline-tag-accent-caps" + tag, tl["tagColor"] == tok["accent"] and tl["tagTransform"] == "uppercase" and tl["tagText"] == "Prototype", tl)
                r.check("topline-inter-500-12px" + tag, tl["pSize"] == "12px" and tl["pWeight"] == "500", "%s %s" % (tl["pSize"], tl["pWeight"]))
                r.check("topline-one-line-at-1280" + tag, (not wide) or tl["rows"] < 60, "%s px high" % tl["rows"])

                # ---------------------------------------------------------------- aria-live on the two status lines
                for fid in ("form-status", "modal-status"):
                    live = page.evaluate("(i) => (document.getElementById(i) || {getAttribute: () => null}).getAttribute('aria-live')", fid)
                    r.check("aria-live-polite:#%s%s" % (fid, tag), live == "polite", live)

                # ---------------------------------------------------------------- hero signup: visual only
                hf = page.evaluate(S.JS_HERO_FORM)
                r.check("hero-form-arrow-is-svg" + tag, hf["btnSvg"] and "→" not in hf["btnText"], hf["btnText"])
                r.check("hero-form-fields-and-action-unchanged" + tag,
                        (hf["action"] or "").startswith("https://formsubmit.co/ajax/") and sorted(hf["inputs"]) == sorted(["email", "_subject", "_captcha", "_template", "_honey", "BUTTON"]), hf)
                r.check("hero-form-copy-not-the-collective" + tag, "The Collective" not in hf["card"], hf["card"][:160])

                # ---------------------------------------------------------------- modal (closed): skin, layering, tab order
                md = page.evaluate(S.JS_MODAL)
                r.check("modal-z-index-1200" + tag, md["z"] == "1200", md["z"])
                r.check("modal-z-exceeds-drawer-and-compare" + tag, int(md["z"]) > int(md["drawerZ"]) and int(md["z"]) > int(md["compareZ"]) and int(md["z"]) < 3000,
                        "modal %s, drawer %s, compare %s" % (md["z"], md["drawerZ"], md["compareZ"]))
                r.check("modal-closed-is-aria-hidden-and-out-of-tab-order" + tag, md["ariaHidden"] == "true" and md["visibility"] == "hidden" and md["opacity"] == "0", md)
                r.check("modal-has-wave-not-topo" + tag, md["wave"] is not None and md["wave"]["hasMask"] and md["wave"]["h"] == "12px" and not md["topo"], {"wave": md["wave"], "topo": md["topo"]})
                r.check("modal-wave-is-accent-and-decorative" + tag, md["wave"]["bg"] == tok["accent"] and md["wave"]["ariaHidden"] == "true", md["wave"])
                r.check("modal-arrow-is-svg" + tag, md["form"]["btnSvg"] and "→" not in md["form"]["btnText"], md["form"]["btnText"])
                r.check("modal-same-ids-fields-action" + tag, (md["form"]["action"] or "").startswith("https://formsubmit.co/ajax/") and md["form"]["method"].upper() == "POST"
                        and sorted(md["form"]["inputs"]) == sorted(["email", "_subject", "_captcha", "_template", "_honey", "BUTTON"]) and md["role"] == "dialog", md["form"])
                r.check("modal-status-live-region" + tag, md["status"]["live"] == "polite", md["status"])
                r.check("modal-copy-no-exclusivity-no-collective" + tag, "Subscribers see it first" not in md["text"] and "The Collective" not in md["text"] and "email me" not in md["text"].lower(), md["text"][:200])
                same_action = (hf["action"] == md["form"]["action"])
                r.check("both-forms-same-relay-action" + tag, same_action, "%s vs %s" % (hf["action"], md["form"]["action"]))

                # ---------------------------------------------------------------- the colophon
                co = page.evaluate(S.JS_COLOPHON)
                r.check("colophon-present-and-replaces-footer" + tag, co is not None and page.evaluate("document.querySelectorAll('body > footer').length") == 1, co is not None)
                r.check("colophon-frame-sentence" + tag, co["frame"]["text"] == S.FRAME_SENTENCE, co["frame"]["text"])
                f = co["frame"]
                r.check("colophon-frame-type" + tag, "Spectral" in f["family"] and f["style"] == "italic" and f["weight"] == "300" and 22 <= px(f["size"]) <= 30, f)
                r.check("colophon-frame-max-34ch" + tag, f["w"] <= 34 * 20, "%spx wide, max-width %s" % (f["w"], f["maxWidth"]))
                r.check("colophon-three-columns-in-order" + tag, co["heads"] == S.COLOPHON_HEADINGS, co["heads"])
                r.check("colophon-grid" + tag, co["cols"]["tracks"] == (3 if wide else 1), co["cols"])
                r.check("colophon-paper-2-band-ink-rule" + tag, co["bg"] == tok["paper-2"] and co["borderTop"].startswith("1px solid") and co["borderTop"].endswith(tok["ink"]) and not co["inverted"], "%s %s" % (co["bg"], co["borderTop"]))
                r.check("colophon-says-ornament-not-surveyed" + tag, "ornament, not surveyed" in co["text"], "phrase missing")
                r.check("colophon-how-to-read-four-lines" + tag, co["how"] == S.HOW_TO_READ, co["how"])
                canon = facts["canon"]
                for k in ("authorship", "privacy", "contact", "status"):
                    r.check("colophon-canon-%s%s" % (k, tag), bool(canon.get(k)) and canon[k] in co["text"], "canon %s not found verbatim in the colophon (canon: %s)" % (k, canon.get(k)))
                m = re.search(r"Values revised (\S+(?: \d{4})?) against their cited sources; earlier shared links may match different regions\.", co["text"])
                rev_ok = bool(m) and (m.group(1) == facts["dataRevision"])
                r.check("colophon-revision-sentence-from-dataRevision" + tag, rev_ok, "%s (dataRevision %s)" % (m and m.group(0), facts["dataRevision"]))
                st = re.fullmatch(r"prototype · open data sources, no commercial product · last updated (\d{4}-\d{2}-\d{2})", co["stampText"] or "")
                r.check("colophon-stamp-line" + tag, bool(st), co["stampText"])
                r.check("colophon-stamp-date-is-the-build-date" + tag, bool(st) and st.group(1) == facts["buildDate"], "%s vs buildDate %s" % (st and st.group(1), facts["buildDate"]))
                r.check("colophon-art-stamped-decorative" + tag, co["art"] and co["art"]["svg"] and co["art"]["ariaHidden"] == "true" and co["art"]["pe"] == "none", co["art"])
                r.check("colophon-art-40-percent" + tag, co["art"] and abs(float(co["art"]["opacity"]) - 0.4) < 0.01 and co["art"]["w"] == (360 if wide else 240), co["art"])
                r.check("colophon-sources-from-criteria" + tag, len(co["sources"]) >= 3 and all((x["href"] or "").startswith("http") for x in co["sources"]), co["sources"][:3])
                r.check("colophon-no-mailto" + tag, co["mailto"] == 0, co["mailto"])
                r.check("colophon-old-footer-copy-gone" + tag, not re.search(r"framework for choosing land|Open-source, open-data|About The Collective|A project of", co["text"]), co["text"][:120])
                r.check("colophon-no-horizontal-overflow" + tag, co["overflowX"] <= 1, "%s px" % co["overflowX"])

                # ---------------------------------------------------------------- no Collective, no mailto, no @, no contact route by newsletter
                at = page.evaluate(S.JS_ALL_TEXT)
                r.check("no-the-collective-in-text" + tag, "The Collective" not in at["text"], "%d occurrences" % at["text"].count("The Collective"))
                r.check("no-the-collective-in-json-ld" + tag, not any("The Collective" in x for x in at["ld"]), "JSON-LD still names The Collective as author")
                r.check("no-mailto-links" + tag, not any(x.lower().startswith("mailto:") for x in at["hrefs"]), [x for x in at["hrefs"] if x.lower().startswith("mailto:")])
                r.check("no-at-sign-in-text" + tag, "@" not in at["text"], re.findall(r".{0,20}@.{0,20}", at["text"])[:3])
                r.check("no-at-sign-in-meta" + tag, not any("@" in x for x in at["metas"]), [x for x in at["metas"] if "@" in x][:2])
                r.check("no-newsletter-as-contact-route" + tag, not re.search(r"use the newsletter signup|subscribe to updates and we'll be in touch|subscribe to get in touch|Subscribe on the main page", at["text"], re.I), "contact-by-newsletter copy present")
                r.check("askja-credited" + tag, bool(re.search(r"originated by Askja", at["text"])), "the colophon must credit Askja as originator")
                r.check("no-founder-claim" + tag, not re.search(r"founded by|founder of|originated by Gustaf|created by Gustaf", at["text"], re.I), "founder claim present")

                # ---------------------------------------------------------------- read-further band (formerly Reach The Collective)
                ct = page.evaluate("() => { const c = document.querySelector('section.contact'); return c ? { h2: (c.querySelector('h2') || {}).textContent, text: c.textContent.replace(/\\s+/g, ' ').trim(), forms: c.querySelectorAll('form, input, button').length, links: Array.from(c.querySelectorAll('a')).map((a) => a.getAttribute('href')) } : null; }")
                r.check("contact-band-no-form-no-collective" + tag, ct is not None and ct["forms"] == 0 and "Collective" not in ct["text"] and "invitation" not in ct["text"].lower(), ct)
                r.check("contact-band-points-to-deeper" + tag, ct is not None and "/deeper.html" in ct["links"], ct and ct["links"])

                # ---------------------------------------------------------------- suite note
                sn = page.evaluate(S.JS_SUITE_NOTE)
                r.check("suite-note-present" + tag, sn is not None and "Regen Community Tools" in sn["text"], sn and sn["text"])
                digits = re.search(r"\d", sn["text"])
                words = [w for w in NUMBER_WORDS if re.search(r"\b%s\b" % w, sn["text"], re.I)]
                r.check("suite-note-states-no-tool-count" + tag, not digits and not words and "five free tools" not in sn["text"].lower(), "digits=%s words=%s: %s" % (bool(digits), words, sn["text"]))
                ids = [x["id"] for x in sn["links"]]
                hrefs = " ".join(x["href"] or "" for x in sn["links"])
                r.check("suite-note-links-intact" + tag, "passOn" in ids and "https://regencommunity.tools" in hrefs and "t.me/share" in hrefs and "wa.me" in hrefs, sn["links"])
                r.check("suite-note-quiet" + tag, px(sn["size"]) >= 12, sn["size"])

                # ---------------------------------------------------------------- print
                page.emulate_media(media="print")
                pr = page.evaluate(S.JS_PRINT)
                r.check("print-hides-rail-banner-modal-art" + tag, pr["rail"] == "none" and pr["banner"] == "none" and pr["modal"] == "none" and pr["art"] == "none" and pr["bodyPad"] == "0px", pr)
                page.emulate_media(media="screen")

                # ---------------------------------------------------------------- layout and contrast
                ov = page.evaluate("Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
                r.check("no-page-overflow" + tag, ov <= 1, "%s px" % ov)
                cr = page.evaluate(S.JS_CONTRAST, SHELL_SELECTOR)
                r.check("contrast-shell-text-aa" + tag, not cr["shellFails"], "checked %d text nodes; shell failures: %s" % (cr["checked"], cr["shellFails"][:4]))
                # Map region markers (.region-marker, the letter chips drawn by the map WPs) are not shell: reported as info, owned by MC-MAP-UI.
                other = [x for x in cr["fails"] if "region-marker" not in str(x["cls"])]
                markers = [x for x in cr["fails"] if "region-marker" in str(x["cls"])]
                r.check("contrast-home-rendered-text-aa" + tag, not other, "checked %d text nodes; %d distinct failures outside the map markers, e.g. %s" % (cr["checked"], len(other), other[:4]))
                if markers:
                    r.info("contrast-map-markers-not-shell" + tag, "%d .region-marker chips below 4.5:1 (map WPs own them): %s" % (len(markers), [(x["txt"], x["ratio"]) for x in markers]))
                clean(r, tag, log, "shell")
                r.check("no-formsubmit-shell" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()

            # ================================================================================== the modal, forced open (?modal=1)
            s, page = fresh(h, browser, width, path="/?modal=1", storage="none")
            try:
                log = s.log(page)
                page.wait_for_selector("%s.visible" % SEL["modal"], timeout=5000)
                page.wait_for_timeout(600)
                tok = page.evaluate(S.JS_TOKENS)
                md = page.evaluate(S.JS_MODAL)
                r.check("modal-open-visible-and-aria-visible" + tag, md["visibility"] == "visible" and md["opacity"] == "1" and md["ariaHidden"] == "false", {"v": md["visibility"], "o": md["opacity"], "a": md["ariaHidden"]})
                r.check("modal-open-z-above-everything-but-skip-link" + tag, md["z"] == "1200", md["z"])
                r.check("modal-scrim-is-ink-46" + tag, re.match(r"rgba\(26, 26, 26, 0\.4[56]\d*\)", md["scrimBg"]) is not None or re.match(r"rgba\(26, 22, 18, 0\.46\)", md["scrimBg"]) is not None or "0.46" in md["scrimBg"] or "46%" in md["scrimBg"], md["scrimBg"])
                r.check("modal-card-sheet-ink-border-leaf" + tag, md["card"]["bg"] not in ("rgba(0, 0, 0, 0)",) and md["card"]["border"].startswith("1px solid") and md["card"]["border"].endswith(tok["ink"])
                        and md["card"]["radius"] == "3px 28px 3px 3px", md["card"])
                r.check("modal-close-44px-round" + tag, md["close"]["w"] == 44 and md["close"]["h"] == 44 and md["close"]["radius"] in ("50%", "22px") and md["close"]["svg"], md["close"])
                r.check("modal-h2-fraunces-italic" + tag, md["h2"]["style"] == "italic" and "Fraunces" in md["h2"]["family"], md["h2"])
                r.check("modal-button-ink-spectral-italic" + tag, md["form"]["btnBg"] == tok["ink"] and md["form"]["btnFont"] == "italic", md["form"])
                if not wide:
                    r.check("modal-form-stacks-button-44px" + tag, md["form"]["direction"] == "column" and md["form"]["btnH"] >= 44, md["form"])
                inside = page.evaluate("() => { const m = document.getElementById('signup-modal'); const a = document.activeElement; return !!(a && m.contains(a)); }")
                r.check("modal-focus-moves-inside" + tag, inside, "focus not inside the modal")
                over = page.evaluate("Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
                r.check("modal-open-no-page-overflow" + tag, over <= 1, "%s px" % over)
                box = page.evaluate("() => { const c = document.querySelector('#signup-modal .modal-card').getBoundingClientRect(); return { l: c.left, r: c.right, t: c.top, b: c.bottom, vw: innerWidth, vh: innerHeight }; }")
                r.check("modal-card-inside-viewport" + tag, box["l"] >= 0 and box["r"] <= box["vw"] + 0.5 and box["t"] >= 0 and box["b"] <= box["vh"] + 0.5, box)
                cr = page.evaluate(S.JS_CONTRAST, SHELL_SELECTOR)
                r.check("contrast-modal-open-aa" + tag, not cr["shellFails"], cr["shellFails"][:4])
                # Escape closes it (never touches the form)
                page.keyboard.press("Escape")
                page.wait_for_timeout(500)
                r.check("modal-escape-closes" + tag, not page.evaluate("!!document.querySelector('%s.visible')" % SEL["modal"]))
                clean(r, tag, log, "modal")
                r.check("no-formsubmit-modal-skin" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()

            # ================================================================================== the mobile note
            s, page = fresh(h, browser, width, storage="mobile-note-visible")
            try:
                mn = page.evaluate(S.JS_MOBILE_NOTE)
                if wide:
                    r.check("mobile-note-hidden-on-wide-screens" + tag, mn["display"] == "none", mn)
                else:
                    r.check("mobile-note-shown-below-768" + tag, mn["display"] == "flex" and mn["role"] == "note", mn)
                    r.check("mobile-note-skin" + tag, mn["bg"] != "rgba(0, 0, 0, 0)" and mn["borderBottom"] == "1px" and mn["size"] == "12.5px", mn)
                    r.check("mobile-note-dismiss-44px" + tag, mn["xH"] is not None and mn["xH"] >= 44 and mn["xW"] >= 44, mn)
                    page.locator(SEL["mobile_note_x"]).click()
                    page.wait_for_timeout(300)
                    mn2 = page.evaluate(S.JS_MOBILE_NOTE)
                    key = mobile_note_key(h.site)
                    stored = page.evaluate("(k) => { try { return localStorage.getItem(k); } catch (e) { return 'blocked'; } }", key)
                    r.check("mobile-note-dismiss-behaviour-intact" + tag, mn2["display"] == "none" and mn2["dismissed"] and stored == "1", "%s stored=%s" % (mn2, stored))
                    page.reload(wait_until="load")
                    page.wait_for_timeout(500)
                    r.check("mobile-note-stays-dismissed" + tag, page.evaluate(S.JS_MOBILE_NOTE)["display"] == "none")
                r.check("no-formsubmit-mobile-note" + tag, not s.guard.formsubmit, s.guard.formsubmit)
            finally:
                s.close()
        finally:
            h.close_browser(browser)
    return r.out
