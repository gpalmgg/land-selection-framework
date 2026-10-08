"""test_host: host.html and terms-of-arrival.html (+ terms-of-arrival.txt), WP BIO-7.

Static (the files of the site under test):
  * both pages carry the same-origin insights script exactly once; no <form>, <input>, <textarea>, <select>; the only scripts are the
    insights tag (both) and, on the terms page, the optional print link; none touches storage, cookies or the network
  * no contact detail anywhere (e-mail, phone, mailto:, tel:, @handle, personal profile link) in the .html and the .txt
  * the Indigenous-nations note is verbatim on host.html, the terms page and the .txt
  * host.html: one h1, five chapters in order, the limits block (no-review statement, archived-or-secondary-source limit, no route to
    correct yet, nothing collected) sits under its own heading BEFORE the examples chapter; canon CONTACT and REFUSAL sentences; the
    five worked examples each carry a quote, a source link and "Opened 5 October 2026"; Askja credited; no founder claim
  * terms: ten h2 headings, numbered 1 to 10 in the copy.md order; the .txt carries the same ten headings in the same order; the fixed top
    note and the fixed footer words; four ruled lines per field, three signature lines and a date line; no script is required
  * terms.css: no raw colour outside its print block
Rendered:
  * host.html and the terms page at 390 and 1280: no horizontal scroll, console clean, one h1, skip link first
  * print: the terms page prints to two pages or fewer on A4 AND Letter (page.pdf at each size); rail, top line, print link and notes are
    hidden in print; the sheet is white, Spectral 12pt, 18mm @page margins, ruled lines carry a black 1px bottom border

Nothing is ever submitted: the harness aborts and records every formsubmit.co request.
"""
import re
from pathlib import Path

from lib.site import default_storage

NAME = "test_host"

NATIONS_NOTE = ("If your nation has its own protocol, law or consultation process, use that. "
                "This sheet is for what is not already written elsewhere.")
CONTACT_CANON = "There is no public contact route yet; the working group will set one."
REFUSAL_CANON = "Where arriving in a place would harm the community already there, the honest answer is not to go."
TERMS_NOTE = ("Terms of arrival. A page for a community, a commons, a parish, a village or a nation to write what it asks of people who wish to arrive, "
              "in its own words. It records what you ask. It does not replace your laws, customs or protocols, it grants nothing until you say so, "
              "and it is not legal advice. Nothing you write here is sent anywhere.")
TERMS_HEADINGS = [
    "1. Who is writing this, and for what place.",
    "2. What we ask first.",
    "3. What we welcome.",
    "4. Where the answer is not here.",
    "5. How we decide, and who.",
    "6. What arrivals owe.",
    "7. What we owe arrivals.",
    "8. Land and housing.",
    "9. If it does not work.",
    "10. Review.",
]
HOST_CHAPTERS = ["says", "told", "use", "wont", "examples"]
EXAMPLES = [  # id, a phrase the page itself says (verbatim, from the page opened on 5 October 2026), the source host
    ("ex-faux", "L’accueil de nouveaux habitants est au cœur de nos préoccupations", "fauxlamontagne.fr/nouveaux-arrivants/"),
    ("ex-eigg", "Residents attended workshops and open days to decide where new homes should be built", "isleofeigg.org/ieht/community-buyout/"),
    ("ex-knoydart", "the innovative Rural Housing Burden scheme", "knoydart.org/about-us/"),
    ("ex-galicia", "bienes indivisibles, inalienables, imprescriptibles e inembargables", "boe.es/buscar/act.php?id=BOE-A-1990-3358"),
    ("ex-acequias", "the role of acequias as local institutions of government", "lasacequias.org/acequia-governance/"),
]
OPENED = "Opened 5 October 2026"

CONTACT_RES = [
    ("email", re.compile(r"[\w.+-]+@[\w-]+(?:\.[\w-]+)+")),
    ("phone", re.compile(r"(?<![\w/.-])(?:\+|00)\d[\d\s().-]{7,}\d|\b\(?\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b")),
    ("mailto-tel", re.compile(r"mailto:|tel:", re.I)),
    ("handle", re.compile(r"(?<![\w.@/])@[A-Za-z0-9_]{2,}")),
    ("profile", re.compile(r"(?:instagram\.com|twitter\.com|x\.com|facebook\.com|tiktok\.com|threads\.net|linkedin\.com/in)/[@\w.%-]+", re.I)),
]


def squash(s):
    s = re.sub(r"<!--.*?-->", "", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    s = (s.replace("&rsquo;", "’").replace("&lsquo;", "‘").replace("&ldquo;", "“").replace("&rdquo;", "”")
         .replace("&nbsp;", " ").replace("&amp;", "&").replace("&laquo;", "«").replace("&raquo;", "»")
         .replace("&oelig;", "œ").replace("&eacute;", "é").replace("&uacute;", "ú").replace("&oacute;", "ó")
         .replace("&hellip;", "…"))
    return re.sub(r"\s+", " ", s).strip()


def scripts_of(html):
    out = []
    for m in re.finditer(r"<script\b([^>]*)>(.*?)</script>", html, re.S | re.I):
        out.append((m.group(1), m.group(2)))
    return out


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    site = Path(h.site)
    files = {n: site / n for n in ("host.html", "terms-of-arrival.html", "terms-of-arrival.txt")}
    for n, p in files.items():
        r.check("file-present:" + n, p.is_file(), str(p))
    if not all(p.is_file() for p in files.values()):
        return r.out
    host = files["host.html"].read_text("utf-8")
    terms = files["terms-of-arrival.html"].read_text("utf-8")
    txt = files["terms-of-arrival.txt"].read_text("utf-8")
    pages = {"host.html": host, "terms-of-arrival.html": terms}

    # ------------------------------------------------------------------ static: analytics, no form, scripts
    for n, html in pages.items():
        tags = re.findall(r"""<script\b[^>]*\bsrc=["']/_vercel/insights/script\.js["'][^>]*>\s*</script>""", html)
        r.check("insights-tag-exactly-once:" + n, len(tags) == 1 and html.count("insights/script.js") == 1, "%d tag(s)" % len(tags))
        r.check("no-form-controls:" + n, not re.search(r"<(form|input|textarea|select)\b", html, re.I), "a form control is present")
        sc = [(a, b) for a, b in scripts_of(html) if "application/ld+json" not in a]
        inline = [b for a, b in sc if "src=" not in a]
        r.check("scripts-only-insights-and-print:" + n, len(sc) - len(inline) == 1 and (len(inline) == (1 if n.startswith("terms") else 0)),
                "%d external, %d inline" % (len(sc) - len(inline), len(inline)))
        for b in inline:
            bad = [w for w in ("localStorage", "sessionStorage", "indexedDB", "document.cookie", "fetch(", "XMLHttpRequest", "sendBeacon", "formsubmit", "submit")
                   if w in b]
            r.check("inline-script-is-only-print:" + n, "window.print()" in b and not bad, "uses %s" % bad)
        r.check("no-formsubmit-text:" + n, "formsubmit" not in html.lower(), "")
        r.check("stylesheets-carry-data-bust:" + n, all("data-bust" in t for t in re.findall(r"<link\b[^>]*rel=\"stylesheet\"[^>]*>", html)), "a stylesheet link lacks data-bust")
        r.check("links-terms-css:" + n, "./src/styles/terms.css" in html and "./src/styles/longread.css" in html, "terms.css or longread.css not linked")
        r.check("skip-link-first-in-body:" + n, bool(re.search(r"<body[^>]*>\s*<a class=\"skip-link\" href=\"#main\"", html)), "")
        r.check("one-main-landmark:" + n, len(re.findall(r"<main\b", html)) == 1 and 'id="main"' in html, "")
        r.check("rail-entries-04-05:" + n, "04 · The Holding" in html and "05 · The Movement" in html, "")
        r.check("no-the-collective:" + n, "The Collective" not in html, "")
        r.check("single-h1-in-source:" + n, len(re.findall(r"<h1\b", html)) == 1, "")
        r.check("not-legal-advice-or-collects-nothing:" + n,
                ("collected" in squash(html) or "sent anywhere" in squash(html) or "Nothing is collected" in squash(html)), "")

    # ------------------------------------------------------------------ static: no contact details
    for n, body in (("host.html", host), ("terms-of-arrival.html", terms), ("terms-of-arrival.txt", txt)):
        hits = []
        for kind, rx in CONTACT_RES:
            for m in rx.finditer(re.sub(r"<script type=\"application/ld\+json\">.*?</script>", "", body, flags=re.S)):
                ctxs = body[max(0, m.start() - 20):m.end() + 20].replace("\n", " ")
                hits.append("%s: %s" % (kind, ctxs))
        r.check("no-contact-details:" + n, not hits, "; ".join(hits[:3]))

    # ------------------------------------------------------------------ static: the Indigenous-nations note, verbatim
    for n, body in (("host.html", squash(host)), ("terms-of-arrival.html", squash(terms)), ("terms-of-arrival.txt", re.sub(r"\s+", " ", txt))):
        r.check("indigenous-nations-note-verbatim:" + n, NATIONS_NOTE in body, "the note is missing or altered")

    # ------------------------------------------------------------------ static: host.html structure and copy
    ht = squash(host)
    h1 = re.findall(r"<h1\b[^>]*>(.*?)</h1>", host, re.S)
    r.check("host-h1", [squash(x) for x in h1] == ["For people already here."], [squash(x) for x in h1])
    ids = re.findall(r"""<section class="block lr-chapter" id="([^"]+)\"""", host)
    r.check("host-five-chapters-in-order", ids == HOST_CHAPTERS, ids)
    h2s = [squash(x) for x in re.findall(r"<h2\b[^>]*>(.*?)</h2>", host, re.S)]
    r.check("host-h2-headings", h2s == ["What this site says about your place.", "What arrivals are being told.", "Three ways to use it.",
                                         "What this tool will not do.", "How rooted communities already say it."], h2s)
    lim = re.search(r'<div class="host-limits" id="limits">(.*?)</div>', host, re.S)
    r.check("host-limits-block", bool(lim), "no .host-limits block")
    if lim:
        lt = squash(lim.group(1))
        h3 = re.search(r"<h3>(.*?)</h3>", lim.group(1), re.S)
        r.check("host-limits-heading", bool(h3) and squash(h3.group(1)) == "What the entries are, and what they are not.", h3 and squash(h3.group(1)))
        r.check("host-limits-assembled-from-public-sources", "assembled from public sources and checked against pages that were opened" in lt, lt[:200])
        r.check("host-limits-no-nation-has-reviewed", "No nation or community named in an entry has reviewed it." in lt, lt[:300])
        r.check("host-limits-archived-or-secondary", "cites an archived copy or a secondary source, and its source label says so" in lt, lt[:400])
        r.check("host-limits-no-route-to-correct", "no public route yet to correct it" in lt, lt[:400])
        r.check("host-limits-nothing-collected", "Nothing is collected here." in lt, lt[:400])
        r.check("host-limits-before-examples", lim.start() < host.index('id="examples"') and lim.start() < host.index('id="ex-faux"'), "limits come after the examples")
    r.check("host-contact-canon", CONTACT_CANON in ht, "canon CONTACT sentence missing")
    r.check("host-refusal-canon", REFUSAL_CANON in ht, "canon REFUSAL sentence missing")
    r.check("host-corrections-route-not-pretended", "A route for corrections is for the working group to decide; until it does, this page says so and does not pretend otherwise." in ht, "")
    r.check("host-says-collects-nothing", "nothing here is collected from you" in ht and "has no form" in ht, "")
    r.check("host-askja-credited", "originated by Askja" in ht, "Askja is not credited")
    r.check("host-no-founder-claim", not re.search(r"Gustaf", host), "Gustaf is named on the page")
    r.check("host-links-terms-and-arrive", 'href="/terms-of-arrival.html"' in host and 'href="/arrive.html"' in host and 'href="/terms-of-arrival.txt"' in host, "")
    r.check("host-standfirst", "This tool was written by people who are not from your place, about places that are yours." in ht, "")
    r.check("host-closing-line", "These are the shape, not the template. Yours will be different." in ht, "")
    for ex_id, phrase, src in EXAMPLES:
        m = re.search(r'<div class="host-example lr-closing" id="%s">(.*?)</div>' % ex_id, host, re.S)
        r.check("example-present:" + ex_id, bool(m), "")
        if not m:
            continue
        t = squash(m.group(1))
        r.check("example-quote-verbatim:" + ex_id, phrase in t, "phrase not found: %s" % phrase)
        r.check("example-quote-in-blockquote:" + ex_id, phrase in squash(" ".join(re.findall(r"<blockquote\b.*?</blockquote>", m.group(1), re.S)) + " " + m.group(1)), "")
        r.check("example-source-link:" + ex_id, ("https://" + src) in m.group(1) or ("https://www." + src) in m.group(1), "source URL https://%s missing" % src)
        r.check("example-opened-date:" + ex_id, OPENED in t, "no '%s'" % OPENED)
    r.check("host-five-examples", len(re.findall(r'class="host-example lr-closing"', host)) == 5, "")

    # ------------------------------------------------------------------ static: terms html and txt
    th = [squash(x) for x in re.findall(r"<h2\b[^>]*>(.*?)</h2>", terms, re.S)]
    r.check("terms-ten-headings", th == TERMS_HEADINGS, th)
    tx_heads = [m.group(0).strip() for m in re.finditer(r"^\d{1,2}\. .*$", txt, re.M)]
    r.check("txt-ten-headings", tx_heads == TERMS_HEADINGS, tx_heads)
    r.check("txt-headings-equal-html-headings-in-order", tx_heads == th, "html %s vs txt %s" % (th, tx_heads))
    r.check("terms-note-verbatim", TERMS_NOTE in squash(terms), "fixed note differs")
    r.check("txt-note-verbatim", TERMS_NOTE in re.sub(r"\s+", " ", txt), "fixed note differs in the .txt")
    tt = squash(terms)
    r.check("terms-says-not-legal-advice", "it is not legal advice" in tt, "")
    r.check("terms-says-nothing-sent", "Nothing you write here is sent anywhere." in tt, "")
    r.check("terms-agreed-by-block", "Agreed by" in tt and len(re.findall(r'class="terms-sign"', terms)) == 1, "")
    sign = re.search(r'<section class="terms-sign".*?</section>', terms, re.S)
    r.check("terms-signature-three-lines-and-date", bool(sign) and sign.group(0).count("<i></i>") == 4 and ">Date<" in sign.group(0), "")
    r.check("terms-footer-written-reviewed", bool(re.search(r"Written on <span class=\"blank\"></span>\. Reviewed on <span class=\"blank\"></span>\.", terms)), "")
    r.check("txt-footer-written-reviewed", bool(re.search(r"Written on _+\. Reviewed on _+\.", txt)), "")
    fields = re.findall(r'<div class="rules" aria-hidden="true">(.*?)</div>', terms, re.S)
    r.check("terms-four-ruled-lines-per-field", sum(1 for f in fields if f.count("<i></i>") == 4) >= 10, [f.count("<i></i>") for f in fields])
    n_blank = len(re.findall(r"^\s+_{20,}$", txt, re.M))
    r.check("txt-four-blank-lines-per-field", n_blank >= 40 + 3, "%d blank lines" % n_blank)
    r.check("terms-not-script-dependent", 'id="print-link" hidden' in terms and "<noscript>" in terms, "the print button must be hidden until script shows it")
    r.check("txt-ascii-or-latin", all(ord(c) < 0x2070 for c in txt), "unexpected glyph in the .txt")

    css = site / "src" / "styles" / "terms.css"
    r.check("terms-css-present", css.is_file(), str(css))
    if css.is_file():
        c = css.read_text("utf-8")
        bare = re.sub(r"/\*.*?\*/", "", c, flags=re.S)
        screen = re.sub(r"@media print \{.*\Z", "", bare, flags=re.S)
        hexes = re.findall(r"(?<![\w&%])#[0-9a-fA-F]{3,8}\b", screen)
        r.check("terms-css-no-raw-colour-on-screen", not hexes, "raw colour(s) outside the print block: %s" % hexes[:5])
        r.check("terms-css-page-margin-18mm", re.search(r"@page\s*\{[^}]*margin:\s*18mm", bare) is not None, "")
        # the suite rail's print rule lives in rail.css (every page loads it); terms.css hides the page's own chrome
        rail_css = site / "src" / "styles" / "rail.css"
        rail_bare = re.sub(r"/\*.*?\*/", "", rail_css.read_text("utf-8"), flags=re.S) if rail_css.is_file() else ""
        rail_prints = re.search(r"@media print\s*\{[^}]*#rct-rail\s*\{[^}]*display:\s*none", rail_bare) is not None
        r.check("terms-css-print-hides-chrome", rail_prints and all(s in bare for s in (".topbar", ".print-link")) and "@media print" in bare, "#rct-rail print rule in rail.css: %s" % rail_prints)
        r.check("terms-css-ruled-lines-black", "border-bottom: 1px solid #000" in bare, "")

    # ------------------------------------------------------------------ rendered
    for width in (1280, 390):
        for n in ("host.html", "terms-of-arrival.html"):
            tag = ":%s@%d" % (n, width)
            browser = h.launch()
            try:
                sess = h.session(browser, width=width, storage=default_storage(h.site), stub=True)
                page = sess.page()
                log = sess.log(page)
                try:
                    page.goto(h.base + "/" + n, wait_until="load", timeout=60000)
                    page.wait_for_timeout(500)
                    ov = page.evaluate("Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth)")
                    r.check("no-h-overflow" + tag, ov == 0, "%d px" % ov)
                    errs = log.errors(own_only=True) + [{"type": "pageerror", "text": e} for e in log.pageerrors]
                    r.check("console-clean" + tag, not errs, "; ".join(str(e.get("text"))[:140] for e in errs[:3]))
                    r.check("single-h1" + tag, page.evaluate("document.querySelectorAll('h1').length") == 1, "")
                    page.keyboard.press("Tab")
                    first = page.evaluate("(() => { const a = document.activeElement; return a ? a.className + '|' + a.getAttribute('href') : null; })()")
                    r.check("skip-link-first-tab" + tag, bool(first) and "skip-link" in first and first.endswith("#main"), first)
                    fonts = page.evaluate("(() => { const e = document.querySelector('h1'); return getComputedStyle(e).fontFamily; })()")
                    pass  # retired 2026-10-07 (Catchment visual assertion): h1-fraunces
                    if n == "terms-of-arrival.html":
                        vis = page.evaluate("(() => { const b = document.getElementById('print-link'); return b && !b.hidden; })()")
                        r.check("print-button-shown-by-script" + tag, bool(vis), "")
                        rules = page.evaluate("(() => { const i = document.querySelector('.rules i'); const s = getComputedStyle(i); return [i.getBoundingClientRect().height, s.borderBottomStyle, s.borderBottomWidth]; })()")
                        r.check("ruled-lines-28px-on-screen" + tag, abs(rules[0] - 28) <= 1.5 and rules[1] == "solid" and rules[2] == "1px", rules)
                    if n == "host.html":
                        # the limits block comes before the first example in reading order
                        order = page.evaluate("(() => { const a = document.getElementById('limits'), b = document.getElementById('ex-faux'); return a && b ? (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 : null; })()")
                        r.check("limits-before-examples-in-dom" + tag, order is True, order)
                        bad = page.evaluate("(() => Array.from(document.querySelectorAll('.toc a')).filter(a => !document.querySelector(a.getAttribute('href'))).map(a => a.getAttribute('href')))()")
                        r.check("toc-anchors-resolve" + tag, not bad, bad)
                        tap = page.evaluate("(() => Array.from(document.querySelectorAll('.toc a')).filter(a => a.getBoundingClientRect().height < 44).length)()")
                        r.check("toc-tap-height-44" + tag, tap == 0, tap)
                    r.check("no-formsubmit" + tag, not sess.guard.formsubmit, sess.guard.formsubmit)
                except Exception as e:
                    r.check("page-loads" + tag, False, "exception: %s" % str(e)[:300])
                finally:
                    sess.close()
            finally:
                h.close_browser(browser)

    # ------------------------------------------------------------------ rendered: print
    browser = h.launch()
    try:
        sess = h.session(browser, width=1280, storage=default_storage(h.site), stub=True)
        page = sess.page()
        try:
            page.goto(h.base + "/terms-of-arrival.html", wait_until="load", timeout=60000)
            page.wait_for_timeout(600)
            page.emulate_media(media="print")
            facts = page.evaluate("""() => {
              const vis = (sel) => { const e = document.querySelector(sel); return e ? getComputedStyle(e).display !== 'none' : false; };
              const sheet = document.querySelector('.terms-sheet'); const cs = getComputedStyle(sheet);
              const rule = getComputedStyle(document.querySelector('.rules i'));
              const rules = document.querySelectorAll('.terms-field .rules i').length;
              return {rail: vis('#rct-rail'), top: vis('.topbar'), printLink: vis('.print-link'), screenNotes: vis('.terms-screen'), skip: vis('.skip-link'),
                      bg: cs.backgroundColor, color: cs.color, size: cs.fontSize, family: cs.fontFamily, border: cs.borderTopWidth,
                      ruleB: rule.borderBottomColor + ' ' + rule.borderBottomWidth + ' ' + rule.borderBottomStyle, rules: rules,
                      bodyBg: getComputedStyle(document.body).backgroundColor, padLeft: getComputedStyle(document.body).paddingLeft};
            }""")
            r.check("print-rail-hidden", not facts["rail"], facts["rail"])
            r.check("print-topbar-hidden", not facts["top"], facts["top"])
            r.check("print-link-hidden", not facts["printLink"], facts["printLink"])
            r.check("print-screen-notes-hidden", not facts["screenNotes"], facts["screenNotes"])
            r.check("print-sheet-white", facts["bg"] == "rgb(255, 255, 255)" and facts["bodyBg"] == "rgb(255, 255, 255)", [facts["bg"], facts["bodyBg"]])
            r.check("print-black-text", facts["color"] == "rgb(0, 0, 0)", facts["color"])
            r.check("print-font-spectral-12pt", "Spectral" in facts["family"] and abs(float(facts["size"].replace("px", "")) - 16) < 0.2, [facts["family"], facts["size"]])
            r.check("print-ruled-lines-black-1px", facts["ruleB"] == "rgb(0, 0, 0) 1px solid", facts["ruleB"])
            r.check("print-forty-ruled-lines", facts["rules"] == 40, facts["rules"])
            r.check("print-no-body-rail-padding", facts["padLeft"] == "0px", facts["padLeft"])
            for fmt, wmm in (("A4", 210), ("Letter", 216)):
                pdf = page.pdf(format=fmt, print_background=True)
                n = len(re.findall(rb"/Type\s*/Page[^s]", pdf))
                r.check("print-pages-at-most-two:" + fmt, 1 <= n <= 2, "%d page(s)" % n)
        except Exception as e:
            r.check("print-render", False, "exception: %s" % str(e)[:300])
        finally:
            sess.close()
    finally:
        h.close_browser(browser)
    return r.out
