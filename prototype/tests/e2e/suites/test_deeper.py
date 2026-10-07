"""test_deeper: the long-read design pass on deeper.html (design FS 8.17; MC-DEEPER).

Static (the file of the site under test):
  * every `id` of the 6bce1a3 deeper.html still exists (the home page and the region pages link #ethics, #methodology, #case-studies,
    #sources, #tensions, #whats-next, #alentejo, #connemara, #transylvania); the Vercel insights tag appears exactly once
  * text invariance: tools/text_freeze.py compares the normalised visible text per section with DOC-6's freeze (deeper.freeze.json)
  * the shared CSS (tokens, fonts, longread) is linked and no inline <style> remains; skip link first; one <main id="main">; rail entries 04
    and 05; the GEN marker pairs and the stamped Century marker each once; JSON-LD parses as an Article; og:image is /api/og?page=deeper
  * longread.css carries no raw colour outside its print block
Rendered, at 390 480 768 900 1024 1280 1536 1920:
  * no horizontal scroll; one h1 (Fraunces); every in-page anchor resolves; the six contents-ledger lines (numeral, name, dotted leader)
  * the 640px column (700px from 1920), the 230px marginalia column from 1280 (260 from 1920) and the inline fold below it
  * the river spine and ring nodes from 900; the drop cap once per chapter; roman numerals in the criteria grid; the case-study closings
  * the tension pairs as two leaves with a dashed fold (vertical from 1280 and 768-899, horizontal otherwise)
  * the refusal pull-quote with its stream at the head of the ethics prose; the commitments as clauses with a Fraunces italic first word
  * the bibliography as a ledger (dotted leader to a right-aligned "used for" tag)
  * rendered-text contrast: 0 failures; reduced motion: no running animation; skip link first Tab stop
  * page weight (compressed, as served) at most 330 KB; LCP at most 1.9 s

Nothing is ever submitted: the harness aborts and records every formsubmit.co request.
"""
import gzip
import importlib.util
import json
import re
import subprocess
from pathlib import Path

from lib import sel as _sel
from lib.site import PROTO, default_storage

NAME = "test_deeper"
S = _sel.load("deeper")
SEL = S.SEL
SHELL = _sel.load("shell")

ROOT = PROTO.parent
BASELINE_COMMIT = "6bce1a3"
FREEZE = ROOT / "upgrade-2026-10" / "tracks" / "docs" / "deeper.freeze.json"
BUDGET_BYTES = 330 * 1024
BUDGET_LCP_MS = 1900
TEXT_TYPES = ("text/", "application/javascript", "application/json", "image/svg", "application/xml")


def load_text_freeze():
    spec = importlib.util.spec_from_file_location("lsf_text_freeze", str(Path(__file__).resolve().parent.parent / "tools" / "text_freeze.py"))
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def baseline_deeper():
    """The 6bce1a3 deeper.html: the extracted baseline site when present, else `git show`."""
    p = ROOT / "upgrade-2026-10" / "verify" / "baseline-site" / "prototype" / "deeper.html"
    if p.is_file():
        return p.read_text("utf-8")
    try:
        return subprocess.run(["git", "-C", str(ROOT), "show", "%s:prototype/deeper.html" % BASELINE_COMMIT], check=True,
                              stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=60).stdout.decode("utf-8")
    except Exception:
        return None


def ids_of(html):
    return set(re.findall(r"""\sid=["']([^"']+)["']""", html))


def near(a, b, tol=1.5):
    return a is not None and b is not None and abs(a - b) <= tol


def px_note(width):
    return 260 if width >= 1920 else 230


def px_col(width):
    return 700 if width >= 1920 else 640


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    page_file = Path(h.site) / "deeper.html"
    if not page_file.is_file():
        r.check("deeper-present", False, str(page_file))
        return r.out
    html = page_file.read_text("utf-8")

    # ---------------------------------------------------------------------------------------------- static: ids, analytics tag
    base = baseline_deeper()
    if base is None:
        r.skip("baseline-ids-kept", "cannot read the %s deeper.html (no baseline-site, git show failed)" % BASELINE_COMMIT)
    else:
        missing = sorted(ids_of(base) - ids_of(html))
        r.check("baseline-ids-kept", not missing, "ids of the %s file missing now: %s" % (BASELINE_COMMIT, missing))
        for must in ("ethics", "methodology", "case-studies", "sources", "tensions", "whats-next", "alentejo", "connemara", "transylvania"):
            r.check("anchor-id-present:%s" % must, ('id="%s"' % must) in html, "id=%s absent" % must)
    ins = re.findall(r"""<script\b[^>]*\bsrc=["']/_vercel/insights/script\.js["'][^>]*>\s*</script>""", html)
    r.check("insights-tag-exactly-once", len(ins) == 1 and html.count("insights/script.js") == 1, "%d tag(s), %d mention(s)" % (len(ins), html.count("insights/script.js")))
    r.check("single-h1-in-source", len(re.findall(r"<h1\b", html)) == 1, "%d <h1>" % len(re.findall(r"<h1\b", html)))
    r.check("no-inline-style-block", "<style" not in html, "an inline <style> block is back (the page links the shared CSS)")
    for css in ("tokens.css", "fonts.css", "longread.css", "rail.css", "century.css", "a11y.css"):
        r.check("links-%s" % css, re.search(r"""<link\b[^>]*href=["']\./src/styles/%s""" % re.escape(css), html) is not None, css)
    r.check("no-old-fonts-css", "/vendor/fonts/fonts.css" not in html and "src/a11y.css" not in html.replace("src/styles/a11y.css", ""), "old stylesheet link present")
    body = html[html.index("<body"):]
    first = re.search(r"<body[^>]*>\s*(<[^>]+>)", body)
    r.check("skip-link-first-in-body", bool(first and 'class="skip-link"' in first.group(1) and 'href="#main"' in first.group(1)), first.group(1) if first else None)
    r.check("one-main-landmark", len(re.findall(r"<main\b", html)) == 1 and 'id="main"' in html, "")
    r.check("rail-entries-04-05", "04 · The Holding" in html and "05 · The Movement" in html, "rail entries 04 or 05 missing")
    for key in ("criteria", "layers", "sources"):
        r.check("gen-marker-pair:%s" % key, html.count("<!-- GEN:%s:start -->" % key) == 1 and html.count("<!-- GEN:%s:end -->" % key) == 1, key)
    r.check("revision-line-stamp-marker", bool(re.search(r'data-doc="revision"[^>]*>\s*Values revised <!--f:dataRevision-->', html)), "the canon REVISION line (stamp marker owned by DOC-6) is missing or moved")
    r.check("century-stamp-marker-once", html.count("<!--s:century-->") == 1 and html.count("<!--/s-->") >= 1, "%d marker(s)" % html.count("<!--s:century-->"))
    r.check("no-contact-surface", "mailto:" not in html and not re.search(r"""href=["']tel:""", html), "mailto: or tel: link")
    r.check("no-the-collective", "The Collective" not in html, "%d occurrence(s)" % html.count("The Collective"))

    # JSON-LD Article and the card
    blocks = re.findall(r"""<script type="application/ld\+json">\s*(.*?)\s*</script>""", html, re.S)
    ld = None
    try:
        ld = [json.loads(b) for b in blocks]
    except Exception as e:
        r.check("json-ld-parses", False, str(e))
    if ld is not None:
        art = [d for d in ld if d.get("@type") == "Article"]
        r.check("json-ld-article", len(art) == 1 and bool(art[0].get("headline")), "types: %s" % [d.get("@type") for d in ld])
        if art:
            r.check("json-ld-no-person-or-collective", "The Collective" not in json.dumps(art[0]) and art[0].get("author", {}).get("@type") == "Organization", json.dumps(art[0].get("author")))
    og = re.search(r'<meta property="og:image" content="([^"]+)"', html)
    tw = re.search(r'<meta name="twitter:image" content="([^"]+)"', html)
    r.check("og-image-is-api-og-deeper", bool(og) and "/api/og?page=deeper" in og.group(1), og.group(1) if og else None)
    r.check("twitter-image-matches-og", bool(og and tw) and og.group(1) == tw.group(1), "%s vs %s" % (og and og.group(1), tw and tw.group(1)))

    # longread.css: tokens only
    css_path = Path(h.site) / "src" / "styles" / "longread.css"
    if css_path.is_file():
        css = css_path.read_text("utf-8")
        for cls in (".longread", ".lr-col", ".lr-note", ".lr-num", ".lr-closing", ".lr-wrap", ".lr-prose", "p.first::first-letter", ".lr-tension"):
            r.check("longread-css-defines:%s" % cls, cls in css, cls)
        bare = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
        bare = re.sub(r"@media print \{.*\Z", "", bare, flags=re.S)
        hexes = re.findall(r"(?<![\w&%])#[0-9a-fA-F]{3,8}\b", bare)
        r.check("longread-css-no-raw-colour", not hexes, "raw colour(s) outside the print block: %s" % hexes[:5])
    else:
        r.check("longread-css-present", False, str(css_path))

    # ---------------------------------------------------------------------------------------------- static: text invariance
    tf = load_text_freeze()
    if FREEZE.is_file():
        frozen = tf.load_freeze(FREEZE)
        rec = tf.record(html)
        for sec in tf.SECTIONS:
            want, got = frozen.get(sec), rec.get(sec)
            r.check("text-freeze:%s" % sec, bool(want and got and want["sha256"] == got["sha256"]),
                    "frozen %s chars, now %s chars" % (want and want.get("chars"), got and got.get("chars")))
    else:
        r.skip("text-freeze", "no freeze file at %s" % FREEZE)

    # ---------------------------------------------------------------------------------------------- rendered
    for width in S.WIDTHS:
        tag = "@%d" % width
        browser = h.launch()
        try:
            sess = h.session(browser, width=width, storage=default_storage(h.site), stub=True)
            page = sess.page()
            log = sess.log(page)
            try:
                page.goto(h.base + "/deeper.html", wait_until="load", timeout=60000)
                page.wait_for_timeout(500)
                tok = page.evaluate(S.JS_TOKENS)
                L = page.evaluate(S.JS_LAYOUT)
                wide = width >= 1280
                spine = width >= 900
                col, note_w = px_col(width), px_note(width)

                errs = log.errors() + [{"type": "pageerror", "text": e} for e in log.pageerrors]
                r.check("console-clean" + tag, not errs, "; ".join(str(e.get("text"))[:140] for e in errs[:3]))
                fo = log.failed_own()
                r.check("own-requests-ok" + tag, not fo, "; ".join("%s %s" % (f["status"] or f["error"], f["url"]) for f in fo[:3]))
                r.check("no-h-overflow" + tag, L["overflow"] == 0, "%d px" % L["overflow"])
                r.check("single-h1" + tag, len(L["h1"]) == 1, L["h1"])
                r.check("h1-fraunces" + tag, "Fraunces" in (L["h1Font"] or "") and L["h1Size"] >= 44, "%s %spx" % (L["h1Font"], L["h1Size"]))
                r.check("anchors-resolve" + tag, not L["hashBroken"], "unresolved: %s of %d" % (L["hashBroken"][:5], len(L["hashLinks"])))
                r.check("main-landmark" + tag, bool(L["main"]) and L["main"]["tabindex"] == "-1" and L["main"]["mains"] == 1, L["main"])

                # skip link: first Tab stop, before the rail, lands on <main>
                page.keyboard.press("Tab")
                ft = page.evaluate(S.JS_FIRST_TAB) or {}
                r.check("skip-link-first-tab-stop" + tag, "skip-link" in (ft.get("cls") or "") and ft.get("href") == "#main" and bool(ft.get("beforeRail")), ft)
                page.keyboard.press("Enter")
                page.wait_for_timeout(150)
                r.check("skip-link-moves-to-main" + tag, page.evaluate("location.hash") == "#main", page.evaluate("location.hash"))

                # contents ledger
                toc = L["toc"]
                r.check("toc-six-lines-in-order" + tag, [t["href"] for t in toc] == ["#" + c[0] for c in S.CHAPTERS], [t["href"] for t in toc])
                r.check("toc-numerals-art-italic" + tag, all(t["numColor"] == tok["art"] and t["numStyle"] == "italic" and "Spectral" in t["numFont"] for t in toc),
                        [(t["numColor"], t["numStyle"], t["numFont"][:20]) for t in toc[:1]])
                r.check("toc-dotted-leaders" + tag, all(t["leader"] == "dotted" for t in toc), [t["leader"] for t in toc])
                r.check("toc-tap-height-44" + tag, all(t["h"] >= 44 for t in toc), [t["h"] for t in toc])

                # the column
                pr = L["prose"]
                if wide:
                    r.check("column-and-margin-tracks" + tag, L["proseCols"] == "%dpx %dpx" % (col, note_w), "grid columns %s, want %dpx %dpx" % (L["proseCols"], col, note_w))
                else:
                    r.check("column-width" + tag, pr is not None and pr["w"] <= col + 1, "prose %.0f px, column %d" % (pr["w"], col))
                r.check("first-paragraph-within-column" + tag, L["p1"]["w"] <= col + 1, "first paragraph %.0f px, column %d" % (L["p1"]["w"], col))
                r.check("body-spectral-18-5" + tag, "Spectral" in (L["proseFont"] or "") and near(L["proseSize"], 18.5, 0.1) and near(L["proseLine"], 1.7, 0.02),
                        "%s %spx x %s" % (L["proseFont"], L["proseSize"], L["proseLine"]))
                r.check("body-max-64ch" + tag, bool(L["p1Max"]) and near(float(L["p1Max"].replace("px", "")), L["ch64"], 0.6), "max-width %s, 64ch = %.1f px" % (L["p1Max"], L["ch64"]))

                # marginalia: in the margin column from 1280, folded inline below
                nt, p1 = L["note"], L["p1"]
                if wide:
                    r.check("margin-note-in-margin-column" + tag, nt["l"] >= p1["r"] - 1 and near(nt["w"], note_w, 1.5) and nt["t"] < L["methodList"]["t"],
                            "note x %.0f-%.0f (w %.0f, want %d), first paragraph right edge %.0f, note top %.0f vs grid top %.0f" % (nt["l"], nt["r"], nt["w"], note_w, p1["r"], nt["t"], L["methodList"]["t"]))
                    r.check("margin-note-clear-of-viewport" + tag, nt["r"] <= width + 0.5, "right edge %.0f > viewport %d" % (nt["r"], width))
                else:
                    r.check("margin-note-folds-inline" + tag, near(nt["l"], pr["l"], 16) and nt["w"] >= min(pr["w"] * 0.5, 280) and nt["t"] > L["methodList"]["t"],
                            "note x %.0f w %.0f, prose x %.0f w %.0f, note top %.0f vs grid top %.0f" % (nt["l"], nt["w"], pr["l"], pr["w"], nt["t"], L["methodList"]["t"]))
                r.check("margin-note-type" + tag, near(L["noteSize"], 12.5, 0.1) and "Inter" in (L["noteFont"] or "") and (L["noteRule"] or "").startswith("2px solid"),
                        "%s %spx %s" % (L["noteFont"], L["noteSize"], L["noteRule"]))
                sn = L["sourceNote"]
                r.check("criterion-source-is-a-note" + tag, bool(sn) and near(sn["size"], 12.5, 0.1) and sn["rule"].startswith("2px solid"), sn)

                # river spine and ring nodes (from 900), drop cap once per chapter
                chs = L["chapters"]
                r.check("six-chapters" + tag, [c["id"] for c in chs] == [c[0] for c in S.CHAPTERS], [c["id"] for c in chs])
                if spine:
                    r.check("river-spine-and-rings" + tag, all(c["stem"] == '""' and c["ring"] == '""' for c in chs), [(c["id"], c["stem"], c["ring"]) for c in chs if c["stem"] != '""' or c["ring"] != '""'])
                    r.check("case-study-rings" + tag, len(L["caseRing"]) == 3 and all(c == '""' for c in L["caseRing"]), L["caseRing"])
                else:
                    r.check("river-spine-hidden-under-900" + tag, all(c["stem"] in ("none", "normal") and c["ring"] in ("none", "normal") for c in chs), [(c["stem"], c["ring"]) for c in chs[:2]])
                r.check("drop-cap-once-per-chapter" + tag, all(c["firsts"] == 1 for c in chs) and L["firstsTotal"] == len(chs), [(c["id"], c["firsts"]) for c in chs])
                r.check("drop-cap-fraunces-accent" + tag, all(c["dropFloat"] == "left" and "Fraunces" in (c["dropFont"] or "") and c["dropColor"] == tok["accent"] and near(c["dropSize"], 4.1, 0.05) for c in chs),
                        [(c["id"], c["dropFloat"], c["dropColor"], c["dropSize"]) for c in chs[:2]])
                r.check("chapter-h2-fraunces" + tag, all("Fraunces" in c["h2"] and c["h2Size"] >= 28 for c in chs), [(c["id"], c["h2Size"]) for c in chs[:2]])

                # the criteria grid: eight roman numerals, two by four where wide enough
                r.check("method-numerals-roman" + tag, [n["t"] for n in L["nums"]] == S.ROMAN, [n["t"] for n in L["nums"]])
                r.check("method-numerals-fraunces-italic-art" + tag, all("Fraunces" in n["font"] and n["style"] == "italic" and near(n["size"], 28, 0.1) and n["color"] == tok["art"] for n in L["nums"]),
                        L["nums"][:1])
                cols2 = (768 <= width <= 899) or width >= 1280
                r.check("method-grid-columns" + tag, L["methodCols"] == (2 if cols2 else 1), "%d column(s)" % L["methodCols"])
                if cols2:
                    cards = L["cards"]
                    r.check("method-grid-two-by-four" + tag, len(cards) == 8 and len({round(c["t"]) for c in cards}) == 4, "%d cards in %d rows" % (len(cards), len({round(c["t"]) for c in cards})))
                if L["century"]:
                    r.check("century-line-in-methodology" + tag, L["century"]["w"] > 300, L["century"])
                else:
                    r.skip("century-line-in-methodology" + tag, "no stamped Century Line in this site (scratch sites are stamped; the working tree is stamped by INT-FINAL)")

                # case studies
                cl = L["closings"]
                r.check("case-closings" + tag, len(cl) == 3 and all(c["rule"] == "3px solid" and c["bg"] == tok["accent-wash"] and c["style"] == "italic" and near(c["size"], 18, 0.1) and "Spectral" in c["font"] for c in cl),
                        cl[:1])
                r.check("case-closing-label" + tag, all(c["label"] == "What this region asks of you" for c in cl), [c["label"] for c in cl])
                r.check("case-names-fraunces" + tag, len(L["caseNames"]) == 3 and all("Fraunces" in c["font"] and c["size"] >= 36 for c in L["caseNames"]), L["caseNames"])

                # tension pairs
                tn = L["tensions"]
                r.check("two-tension-pairs-of-two-leaves" + tag, len(tn) == 2 and all(len(t["leaves"]) == 2 for t in tn), [len(t["leaves"]) for t in tn])
                r.check("tension-labels" + tag, all(t["labels"] == ["One perspective", "The other perspective"] for t in tn), [t["labels"] for t in tn])
                side = (768 <= width <= 899) or width >= 1280
                for i, t in enumerate(tn):
                    a, b = t["leaves"]
                    if side:
                        r.check("tension-%d-side-by-side-vertical-fold%s" % (i + 1, tag), near(a["t"], b["t"], 2) and b["l"] >= a["r"] and t["foldV"] == "dashed" and t["foldVW"] != "0px",
                                "leaf tops %.0f/%.0f, leaf1 right %.0f, leaf2 left %.0f, fold %s" % (a["t"], b["t"], a["r"], b["l"], t["foldV"]))
                    else:
                        r.check("tension-%d-stacked-horizontal-fold%s" % (i + 1, tag), b["t"] >= a["b"] and near(a["l"], b["l"], 2) and t["foldH"] == "dashed" and t["foldHW"] != "0px",
                                "leaf1 bottom %.0f, leaf2 top %.0f, fold %s" % (a["b"], b["t"], t["foldH"]))

                # ethics: the refusal at the head, with its stream; commitments as clauses
                rf, st = L["refusal"], L["stream"]
                want_px = min(38.0, max(26.0, 0.032 * width))
                r.check("refusal-pull-quote-type" + tag, bool(rf) and near(rf["size"], want_px, 0.6) and rf["style"] == "italic" and "Fraunces" in rf["font"], rf and {k: rf[k] for k in ("size", "style", "font")})
                r.check("refusal-is-the-canon-sentence" + tag, bool(rf) and rf["text"] == "Where arriving in a place would harm the community already there, the honest answer is not to go.", rf and rf["text"])
                r.check("refusal-above-the-commitments" + tag, bool(rf and L["localismTop"]) and rf["r"]["b"] <= L["localismTop"] + 1, "refusal bottom %s, Localism top %s" % (rf and rf["r"]["b"], L["localismTop"]))
                r.check("refusal-stream-above-and-decorative" + tag, bool(st) and st["hidden"] == "true" and st["r"]["b"] <= rf["r"]["t"] + 1 and st["color"] == tok["accent"], st)
                r.check("refusal-opens-the-ethics-prose" + tag, bool(rf) and rf["r"]["t"] > L["ethicsH2"]["b"], "refusal top %s, h2 bottom %s" % (rf and rf["r"]["t"], L["ethicsH2"]["b"]))
                cls = L["clauses"]
                r.check("five-commitments-as-clauses" + tag, [c["t"] for c in cls] == ["Reciprocity.", "Localism.", "Bioregioning.", "Healthy integration.", "Land stewardship."] or sorted(c["t"] for c in cls) == sorted(["Reciprocity.", "Localism.", "Bioregioning.", "Healthy integration.", "Land stewardship."]),
                        [c["t"] for c in cls])
                r.check("clause-first-word-fraunces-italic" + tag, bool(cls) and all(c["style"] == "italic" and "Fraunces" in c["font"] and c["size"] >= 24 for c in cls), cls[:2])
                r.check("clauses-have-no-icons" + tag, L["ethicsIcons"] == 0, "%d icon(s)" % L["ethicsIcons"])

                # the bibliography ledger
                r.check("ledger-group-heads" + tag, L["groupCount"] >= 8 and all(g["style"] == "italic" and "Fraunces" in g["font"] and g["size"] >= 24 for g in L["groupHeads"]),
                        "%d groups, %s" % (L["groupCount"], L["groupHeads"][:1]))
                e = L["entry"]
                if e:
                    r.check("ledger-entry-grid" + tag, e["display"] == "grid", e["display"])
                    if width >= 720:
                        r.check("ledger-leader-and-right-tag" + tag, e["leader"] == "dotted" and e["ufAlign"] == "right" and e["ufColStart"] == "2" and e["ufR"]["l"] > e["nameR"]["r"] - 2,
                                "leader %s, align %s, tag col %s, name right %.0f, tag left %.0f" % (e["leader"], e["ufAlign"], e["ufColStart"], e["nameR"]["r"], e["ufR"]["l"]))
                    r.check("ledger-licence-line-full-width" + tag, (e["licSpan"] or "").startswith("1/"), e["licSpan"])
                r.check("ledger-entries-all-kept" + tag, L["entries"] >= 100, "%d entries" % L["entries"])

                # contrast and reduced motion (the session emulates prefers-reduced-motion: reduce)
                con = page.evaluate(SHELL.JS_CONTRAST, "#__no-shell__")
                r.check("contrast-0-failures" + tag, not con["fails"], "checked %d text nodes; failing: %s" % (con["checked"], json.dumps(con["fails"][:4])))
                r.check("reduced-motion-no-animation" + tag, L["anim"] == 0 and L["scrollBehavior"] == "auto", "animations %s, scroll-behavior %s" % (L["anim"], L["scrollBehavior"]))
                r.check("rail-offset" + tag, (width >= 900 and L["bodyPadLeft"] == 232) or (width < 900 and L["bodyPadLeft"] == 0), "body padding-left %s" % L["bodyPadLeft"])
                r.check("no-formsubmit" + tag, not sess.guard.formsubmit, sess.guard.formsubmit)
            except Exception as ex:
                r.check("deeper-renders" + tag, False, "exception: %s" % str(ex)[:400])
            finally:
                sess.close()
        finally:
            h.close_browser(browser)

    # ---------------------------------------------------------------------------------------------- weight and LCP (1280)
    pw = getattr(h, "_pw", None)
    plain = None
    try:
        # A plain Chromium: the harness's SwiftShader launch flags delay the first paint by about a second and would measure the harness,
        # not the page. One warm-up load, then the median of three measured loads (Cache-Control: no-store, so each is a network load).
        plain = pw.chromium.launch(headless=True) if (pw is not None and h.browser_name == "chromium") else h.launch()
        lcps, served, raw, html_raw, html_gz, nreq = [], 0, 0, 0, 0, 0
        for i in range(4):
            sess = h.session(plain, width=1280, storage=default_storage(h.site), stub=True, extra_init=(S.JS_LCP_INIT,))
            page = sess.page()
            sizes = []

            def on_response(resp, sizes=sizes):
                try:
                    if resp.url.startswith(h.base):
                        sizes.append((resp.url, resp.headers.get("content-type", ""), resp.body()))
                except Exception:
                    pass

            page.on("response", on_response)
            try:
                page.goto(h.base + "/deeper.html", wait_until="load", timeout=60000)
                page.wait_for_timeout(1200)
                if i > 0:
                    lcps.append(page.evaluate(S.JS_LCP_READ))
                if i == 1:
                    nreq = len(sizes)
                    raw = sum(len(b) for (_u, _c, b) in sizes)
                    served = sum(len(gzip.compress(b, 9)) if c.lower().startswith(TEXT_TYPES) else len(b) for (_u, c, b) in sizes)
                    hb = next((b for (u, c, b) in sizes if u.split("?")[0].endswith("/deeper.html")), b"")
                    html_raw, html_gz = len(hb), len(gzip.compress(hb, 9))
            finally:
                sess.close()
        lcps.sort()
        lcp = lcps[len(lcps) // 2] if lcps else 0
        r.info("page-weight", "deeper.html raw %d bytes (%d KB), gzip %d KB; all %d own-origin responses: raw %d KB, compressed-as-served %d KB (budget %d KB). LCP runs: %s ms"
               % (html_raw, html_raw // 1024, html_gz // 1024, nreq, raw // 1024, served // 1024, BUDGET_BYTES // 1024, [round(x) for x in lcps]))
        r.check("page-weight-at-most-330KB-as-served", 0 < served <= BUDGET_BYTES, "%d KB compressed-as-served" % (served // 1024))
        r.check("lcp-at-most-1.9s", 0 < lcp <= BUDGET_LCP_MS, "median LCP %.0f ms of %s" % (lcp, [round(x) for x in lcps]))
    except Exception as ex:
        r.check("perf-measured", False, "exception: %s" % str(ex)[:300])
    finally:
        if plain is not None:
            try:
                plain.close()
            except Exception:
                pass
    return r.out
