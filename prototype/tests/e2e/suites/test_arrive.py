"""test_arrive: the "How to arrive" page (BIO-6; design FS 8.22, bioregioning 4.4).

Static (the file of the site under test):
  * the Vercel insights tag appears exactly once and nothing else external loads: no <form>, no storage API, no third-party
    script, no analytics call beyond the page view; skip link first in <body>; one <main id="main">; one <h1>; the six-entry rail
  * the shared CSS is linked with data-bust (tokens, fonts, rail, a11y, longread, reciprocity, way, ledger, colophon)
  * copy: the four stage ids in order, each with five questions, "Look for" and "Not there if"; the fixed closing line and the
    protocol footer (matching data/reciprocity.js protocols); the word "journey" and any "verified" wording are absent
  * without JavaScript (a context with JS off): all four stages readable, the picker hidden, the plain list of region links present
    (one link for every region page of the site), the region block empty
Rendered (JS on), at 1280, 768 and 390:
  * no console error, no page error, no failed own request, no horizontal scroll
  * headings strictly ordered (h1, then no level skipped), bare page and with a region
  * the picker: a native <select> with a visible <label>, first option "No region chosen", options = isVerified() regions A to Z by
    display name; choosing a region renders the block and updates the address with replaceState (history length unchanged); choosing
    "No region chosen" clears it; an unknown id renders nothing; a region whose entry stops being verified is neither offered nor
    rendered (the data module is served modified for that one test)
  * ?region=<id> for EVERY verified region: block present with one h2 "In <name>", place strip before Land standing, the Land standing
    rows in the 4.2 order, the no-review sentence, the closing line, ecoregion line equal to lib/bio.js whereItSits, stage pointers
    whose targets exist, no console error, headings in order, no "verified by" wording
  * no layout shift when a region is chosen by address (hold the height): layout-shift total stays under the budget
  * links in: the home page, deeper.html#ethics and a region page link to arrive.html; the drawer's "How to arrive in" link resolves
    to this page and renders the block

Nothing is ever submitted: the harness aborts and records every formsubmit.co request. The tests click no submit control.
"""
import json
import re
import subprocess
import time
import urllib.error
import urllib.request
from pathlib import Path
from urllib.parse import urlparse

from lib.site import PROTO

NAME = "test_arrive"

ROOT = PROTO.parent
SHOTS = ROOT / "upgrade-2026-10" / "verify" / "e2e" / "BIO-6-shots"
CLS_BUDGET = 0.02            # layout-shift total allowed after a region chosen by address (hold the height: expected 0)
CLOSING = ("These are pointers to public bodies. None of them has agreed to be contacted, and none is a person. "
           "Read first; ask how they want to be approached; never assume.")
NO_REVIEW = "No nation or community named here has reviewed this entry."
STAGES = [("before-you-look", "Before you look"), ("when-you-visit", "When you visit"),
          ("before-you-commit", "Before you commit"), ("the-first-years", "The first years")]
# the 4.2 order of the Land standing block, by the class hook each row carries (each appears only when its data exists)
ORDER_4_2 = [".place-strip", ".drawer-land-standing .ls-territory", ".ls-contested", ".ls-row:not(.ls-trajectory)", ".ls-trajectory",
             ".ls-notthere", ".ls-fc", ".drawer-land-standing > .ls-src", ".ls-provenance", ".ls-consent"]

HEADINGS_JS = """
() => Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).filter(h => !!(h.getClientRects().length))
  .map(h => ({level: Number(h.tagName[1]), text: (h.textContent || '').trim().slice(0, 80)}))
"""

HEADINGS_ALL_JS = """
() => Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => ({level: Number(h.tagName[1]), text: (h.textContent || '').trim().slice(0, 80)}))
"""

DOM_ORDER_JS = """
(selectors) => {
  const root = document.getElementById('region');
  const out = [];
  for (const sel of selectors) {
    const el = root.querySelector(sel);
    out.push(el ? {sel, found: true, pos: Array.from(root.querySelectorAll('*')).indexOf(el)} : {sel, found: false, pos: -1});
  }
  return out;
}
"""

CLS_INIT = """
(() => { window.__cls = 0; window.__clsN = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__clsN++; } } })
    .observe({type: 'layout-shift', buffered: true}); } catch (e) {} })();
"""


def heading_problems(hs):
    """Strict order: the first heading is an h1, there is one h1, and no step goes down by more than one level."""
    bad = []
    if not hs:
        return ["no headings"]
    if hs[0]["level"] != 1:
        bad.append("first heading is h%d" % hs[0]["level"])
    if sum(1 for h in hs if h["level"] == 1) != 1:
        bad.append("%d h1" % sum(1 for h in hs if h["level"] == 1))
    for a, b in zip(hs, hs[1:]):
        if b["level"] > a["level"] + 1:
            bad.append("h%d '%s' -> h%d '%s'" % (a["level"], a["text"], b["level"], b["text"]))
    return bad


def visible_text(html):
    h = re.sub(r"<!--.*?-->", " ", html, flags=re.S)
    h = re.sub(r"<(script|style|noscript)\b.*?</\1>", " ", h, flags=re.S | re.I)
    h = re.sub(r"<[^>]+>", " ", h)
    return re.sub(r"\s+", " ", h)


def head_status(base, path):
    try:
        with urllib.request.urlopen(urllib.request.Request(base + path, method="HEAD"), timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def node_json(site, code):
    """Evaluate `code` (an ES module body that prints JSON) in the site's own folder, so data comes from the site under test."""
    p = subprocess.run(["node", "--input-type=module", "-e", code], cwd=str(site), stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=120)
    if p.returncode != 0:
        raise RuntimeError(p.stderr.decode("utf-8", "replace")[-600:])
    return json.loads(p.stdout.decode("utf-8"))


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    site = Path(h.site)
    page_file = site / "arrive.html"
    if not page_file.is_file():
        r.check("arrive-present", False, str(page_file))
        return r.out
    html = page_file.read_text("utf-8")
    js_file = site / "src" / "pages" / "arrive.js"
    js = js_file.read_text("utf-8") if js_file.is_file() else ""
    r.check("arrive-js-present", bool(js), str(js_file))

    # ------------------------------------------------------------------------------------------------ static: shell and safety
    ins = re.findall(r"""<script\b[^>]*\bsrc=["']/_vercel/insights/script\.js["'][^>]*>\s*</script>""", html)
    r.check("insights-tag-exactly-once", len(ins) == 1 and html.count("insights/script.js") == 1, "%d tag(s), %d mention(s)" % (len(ins), html.count("insights/script.js")))
    srcs = re.findall(r"""<script\b[^>]*\bsrc=["']([^"']+)["']""", html)
    extra = [s for s in srcs if not (s == "/_vercel/insights/script.js" or s.startswith("./src/pages/arrive.js"))]
    r.check("no-other-script-src", not extra, extra)
    r.check("no-external-script-or-style-host", not re.findall(r"""(?:src|href)=["']https?://[^"']*\.(?:js|css)\b""", html), "an absolute script or stylesheet URL")
    r.check("no-form", "<form" not in html.lower() and "<input" not in html.lower() and "<textarea" not in html.lower(), "form control in the source")
    stor = [w for w in ("localStorage", "sessionStorage", "indexedDB", "document.cookie", "navigator.sendBeacon", "XMLHttpRequest", "fetch(", "va(")
            if w in html or w in js]
    r.check("no-storage-no-network-calls", not stor, stor)
    r.check("no-analytics-event", "window.va" not in html + js and "track(" not in js and "trackEvent" not in js, "an analytics call")
    r.check("no-mailto-tel", "mailto:" not in html and not re.search(r"""href=["']tel:""", html), "contact link")
    r.check("no-the-collective", "The Collective" not in html, "")
    for css in ("tokens.css", "fonts.css", "rail.css", "a11y.css", "longread.css", "reciprocity.css", "way.css", "ledger.css", "colophon.css"):
        r.check("links-%s-with-data-bust" % css, re.search(r"""<link\b[^>]*href=["']\./src/styles/%s[^"']*["'][^>]*\bdata-bust\b""" % re.escape(css), html) is not None, css)
    body = html[html.index("<body"):]
    first = re.search(r"<body[^>]*>\s*(<[^>]+>)", body)
    r.check("skip-link-first-in-body", bool(first and 'class="skip-link"' in first.group(1) and 'href="#main"' in first.group(1)), first.group(1) if first else None)
    r.check("one-main-landmark", len(re.findall(r"<main\b", html)) == 1 and 'id="main"' in html, "")
    r.check("single-h1-in-source", len(re.findall(r"<h1\b", html)) == 1, "")
    r.check("rail-six-entries-04-05", html.count('class="rct-nm"') == 6 and "04 · The Holding" in html and "05 · The Movement" in html, "")
    r.check("canonical-and-description", 'rel="canonical" href="https://land-selection-framework.regencommunity.tools/arrive.html"' in html and 'name="description"' in html, "")
    blocks = re.findall(r"""<script type="application/ld\+json">\s*(.*?)\s*</script>""", html, re.S)
    try:
        ld = json.loads(blocks[0])
        r.check("json-ld-parses", ld.get("@type") == "WebPage" and "aggregateRating" not in blocks[0], ld.get("@type"))
    except Exception as e:
        r.check("json-ld-parses", False, str(e)[:200])

    # ------------------------------------------------------------------------------------------------ static: copy
    text = visible_text(html)
    ids = re.findall(r"""<section\b[^>]*\bid="([a-z-]+)"[^>]*\bclass|<section\b[^>]*class="[^"]*"[^>]*\bid="([a-z-]+)""", html)
    order = [a or b for a, b in ids if (a or b) in dict(STAGES)]
    r.check("four-stage-ids-in-order", order == [s for s, _ in STAGES], order)
    for sid, title in STAGES:
        m = re.search(r"""<section\b[^>]*id="%s".*?</section>""" % sid, html, re.S)
        sec = m.group(0) if m else ""
        r.check("stage-%s-parts" % sid, bool(sec) and "<h3>Questions to carry</h3>" in sec and "<h3>Look for</h3>" in sec
                and ">Not there if</h3>" in sec and len(re.findall(r"<li>", sec.split("Look for")[0])) == 5 and ">%s</h2>" % title in sec.replace("</span>", "</span>"),
                "%d questions" % len(re.findall(r"<li>", sec.split("Look for")[0])))
        r.check("stage-%s-region-slot-live" % sid, 'class="arrive-region arrive-stage-region" aria-live="polite" data-stage="%s"' % sid in sec, "")
    r.check("closing-line-fixed", CLOSING in text, "")
    r.check("standing-sentence-present", "A bioregion is a place known by its water" in text, "")
    r.check("no-journey-word", not re.search(r"\bjourney", text, re.I), "")
    r.check("no-verified-wording", not re.search(r"\bverified\b", text, re.I), re.findall(r".{20}\bverified\b.{20}", text, re.I)[:2])
    r.check("no-candidate-or-siting-framing", not re.search(r"\bcandidate regions?\b|\bsiting\b|\bsite shopping\b|\bfind land\b|\bapocalyp", text, re.I), "")
    r.check("authorship-askja-no-founder-claim", "originated by Askja" in text and not re.search(r"Gustaf", text), "")
    # protocol footer equals the data
    try:
        protos = node_json(site, "import {protocols} from './data/reciprocity.js'; console.log(JSON.stringify(protocols.map(p=>({name:p.name,url:p.url}))))")
        got = re.findall(r"""<ul class="arrive-protocols">(.*?)</ul>""", html, re.S)
        links = re.findall(r"""<a href="([^"]+)"[^>]*>(.*?)<span class="sr-only">""", got[0]) if got else []
        r.check("protocol-footer-matches-data", [(u, n) for u, n in links] == [(re.sub('&amp;', '&', p["url"]), p["name"]) for p in protos] and len(protos) > 0,
                "page %d links, data %d" % (len(links), len(protos)))
    except Exception as e:
        r.check("protocol-footer-matches-data", False, str(e)[:300])
    for m in re.finditer(r"""<a\b[^>]*target="_blank"[^>]*>""", html):
        if "noopener" not in m.group(0):
            r.check("blank-links-noopener", False, m.group(0)[:120])
            break
    else:
        r.check("blank-links-noopener", True)

    # region facts from the site under test: verified ids, display names, region pages on disk
    try:
        facts = node_json(site, """
          import {regions} from './data/regions.js'; import {isVerified, whereItSits} from './lib/bio.js';
          const v = regions.filter(r => isVerified(r.id)).map(r => ({id: r.id, name: r.name, sits: whereItSits(r.id)}));
          console.log(JSON.stringify({all: regions.map(r => r.id), verified: v}));""")
    except Exception as e:
        r.check("site-data-loads", False, str(e)[:400])
        return r.out
    all_ids, verified = facts["all"], facts["verified"]
    vids = [v["id"] for v in verified]
    r.check("some-regions-verified", len(vids) > 0, len(vids))
    base = h.base

    browser = h.launch()
    try:
        # ------------------------------------------------------------------------------------------------ JavaScript off
        nojs = browser.new_context(viewport={"width": 1280, "height": 900}, java_script_enabled=False)
        pg = nojs.new_page()
        pg.goto(base + "/arrive.html?region=%s" % (vids[0] if vids else "x"), wait_until="load")
        try:
            have = pg.evaluate("""() => ({
              stages: ['before-you-look','when-you-visit','before-you-commit','the-first-years'].map(id => {
                const s = document.getElementById(id); if (!s) return null;
                const vis = e => !!(e && e.getClientRects().length);
                return {id, h2: vis(s.querySelector('h2')), questions: Array.from(s.querySelectorAll('ol li')).filter(vis).length,
                        look: Array.from(s.querySelectorAll('h3')).filter(vis).map(x => x.textContent.trim())};
              }),
              picker: (() => { const p = document.querySelector('.arrive-picker'); return p ? getComputedStyle(p).display : null; })(),
              regionLinks: Array.from(document.querySelectorAll('.arrive-nojs a[href^="/region/"]')).map(a => a.getAttribute('href')),
              nojsVisible: (() => { const n = document.querySelector('.arrive-nojs'); return !!(n && n.getClientRects().length); })(),
              block: (document.getElementById('region') || {}).innerHTML,
              closing: !!Array.from(document.querySelectorAll('.arrive-closing')).find(e => e.getClientRects().length),
              protocols: document.querySelectorAll('.arrive-protocols a').length,
              h1: document.querySelectorAll('h1').length })""")
        except Exception as e:
            have = {"err": str(e)}
        r.check("nojs-four-stages-readable", all(s and s["h2"] and s["questions"] == 5 and set(["Questions to carry", "Look for", "Not there if"]) <= set(s["look"]) for s in have.get("stages", [None])), have.get("stages"))
        r.check("nojs-picker-hidden", have.get("picker") == "none", have.get("picker"))
        pages_on_disk = sorted(p.name for p in (site / "region").glob("*.html"))
        links = sorted(set(l.split("/")[-1] for l in have.get("regionLinks", [])))
        r.check("nojs-region-list-links-every-region-page", links == pages_on_disk and len(links) == len(all_ids), "%d links, %d pages, %d regions" % (len(links), len(pages_on_disk), len(all_ids)))
        r.check("nojs-region-list-visible", have.get("nojsVisible") is True, "")
        r.check("nojs-region-block-empty", not (have.get("block") or "").strip(), (have.get("block") or "")[:80])
        r.check("nojs-closing-line-and-protocols", have.get("closing") is True and (have.get("protocols") or 0) > 0, "")
        nojs.close()

        # ------------------------------------------------------------------------------------------------ JavaScript on: per width
        for width in (1280, 768, 390):
            tag = "@%d" % width
            s = h.session(browser, width=width, stub=True)
            page = s.page()
            log = s.log(page)
            try:
                page.goto(base + "/arrive.html", wait_until="load", timeout=60000)
                page.wait_for_timeout(900)
                errs = log.errors(own_only=True)
                r.check("console-clean" + tag, not errs, "; ".join("%s %s" % (e["type"], e["text"][:140]) for e in errs[:4]))
                r.check("no-page-errors" + tag, not log.pageerrors, "; ".join(log.pageerrors[:3]))
                fo = log.failed_own()
                r.check("own-requests-ok" + tag, not fo, "; ".join("%s %s" % (f["status"] or f["error"], f["url"]) for f in fo[:4]))
                ov = page.evaluate("document.documentElement.scrollWidth - document.documentElement.clientWidth")
                r.check("no-h-overflow" + tag, ov <= 0, "%s px" % ov)
                r.check("headings-in-order-bare" + tag, not heading_problems(page.evaluate(HEADINGS_ALL_JS)), heading_problems(page.evaluate(HEADINGS_ALL_JS)))
                if width == 1280:
                    pk = page.evaluate("""() => { const sel = document.getElementById('arrive-region'); const lab = document.querySelector('label[for="arrive-region"]');
                      const opts = Array.from(sel.options).map(o => ({v: o.value, t: o.textContent}));
                      return {tag: sel.tagName, labelText: lab ? lab.textContent.trim() : null, labelVisible: !!(lab && lab.getClientRects().length),
                              visible: !!sel.getClientRects().length, opts, pickerDisplay: getComputedStyle(document.querySelector('.arrive-picker')).display,
                              regionBlockEmpty: document.getElementById('region').children.length === 0}; }""")
                    r.check("picker-native-select-with-visible-label", pk["tag"] == "SELECT" and pk["visible"] and pk["labelVisible"] and bool(pk["labelText"]), pk)
                    r.check("picker-first-option-no-region-chosen", pk["opts"][0] == {"v": "", "t": "No region chosen"}, pk["opts"][:2])
                    exp = sorted(verified, key=lambda v: (v["name"].lower(), v["id"]))
                    got = [(o["v"], o["t"]) for o in pk["opts"][1:]]
                    r.check("picker-options-verified-only-alphabetical", got == [(v["id"], v["name"]) for v in exp], "got %d, expected %d" % (len(got), len(exp)))
                    r.check("bare-page-region-block-empty", pk["regionBlockEmpty"], "")
                    # choose, then clear, then an unknown id; the history length must not change
                    hl0 = page.evaluate("history.length")
                    pick = vids[0]
                    page.select_option("#arrive-region", pick)
                    page.wait_for_timeout(700)
                    st = page.evaluate("""() => ({url: location.search, h2: (document.querySelector('#region h2') || {}).textContent, hist: history.length,
                                       hints: Array.from(document.querySelectorAll('.arrive-stage-region')).filter(e => e.textContent.trim()).length})""")
                    r.check("choose-region-renders-block-and-sets-address", st["url"] == "?region=%s" % pick and (st["h2"] or "").startswith("In "), st)
                    r.check("choose-region-uses-replaceState", st["hist"] == hl0, "history %s -> %s" % (hl0, st["hist"]))
                    r.check("choose-region-fills-stage-pointers", st["hints"] >= 1, st)
                    page.select_option("#arrive-region", "")
                    page.wait_for_timeout(300)
                    st = page.evaluate("({url: location.search, empty: document.getElementById('region').children.length === 0, hints: Array.from(document.querySelectorAll('.arrive-stage-region')).filter(e => e.textContent.trim()).length})")
                    r.check("clear-region-empties-block-and-address", st["url"] == "" and st["empty"] and st["hints"] == 0, st)
                    page.goto(base + "/arrive.html?region=not-a-region", wait_until="load")
                    page.wait_for_timeout(500)
                    st = page.evaluate("({sel: document.getElementById('arrive-region').value, empty: document.getElementById('region').children.length === 0})")
                    r.check("unknown-region-renders-nothing", st["sel"] == "" and st["empty"], st)
                    page.goto(base + "/arrive.html?region=%3Cscript%3E", wait_until="load")
                    page.wait_for_timeout(300)
                    r.check("hostile-region-id-renders-nothing", page.evaluate("document.getElementById('region').children.length === 0"), "")
                SHOTS.mkdir(parents=True, exist_ok=True)
                for label, q in (("bare", ""), ("region", "?region=%s" % vids[0] if vids else "")):
                    if label == "region" and not vids:
                        continue
                    try:
                        page.goto(base + "/arrive.html" + q, wait_until="load")
                        page.wait_for_timeout(1000)
                        tall = page.evaluate("document.documentElement.scrollHeight")
                        path = str(SHOTS / ("test-arrive-%s-%d.png" % (label, width)))
                        if tall <= 9000:
                            page.screenshot(path=path, full_page=True)
                        else:                                   # very tall pages: the first 9000 px (Chromium cannot always capture more)
                            page.set_viewport_size({"width": width, "height": 9000})
                            page.wait_for_timeout(300)
                            page.screenshot(path=path)
                            page.set_viewport_size({"width": width, "height": 844 if width < 600 else 900})
                    except Exception as e:                      # a screenshot is evidence, not a gate: record why one is missing
                        r.info("screenshot-%s%s" % (label, tag), str(e)[:160])
            except Exception as e:
                r.check("page-loads" + tag, False, "exception: %s" % str(e)[:300])
            finally:
                s.close()

        # ------------------------------------------------------------------------------------------------ every verified region, 1280
        s = h.session(browser, width=1280, stub=True)
        page = s.page()
        log = s.log(page)
        try:
            for v in verified:
                rid = v["id"]
                tag = ":" + rid
                n0 = len(log.console)
                page.goto(base + "/arrive.html?region=%s" % rid, wait_until="load", timeout=60000)
                try:
                    page.wait_for_selector("#region h2", timeout=15000)
                except Exception:
                    r.check("region-block-renders" + tag, False, "no #region h2")
                    continue
                page.wait_for_timeout(250)
                errs = [e for e in log.errors(own_only=True) if log.console.index(e) >= n0]
                r.check("region-console-clean" + tag, not errs, "; ".join(e["text"][:120] for e in errs[:3]))
                info = page.evaluate("""(rid) => { const b = document.getElementById('region');
                  const h2s = Array.from(b.querySelectorAll('h2')).map(x => x.textContent.trim());
                  const dd = b.querySelector('.place-dl dd');
                  return {h2s, nh1: document.querySelectorAll('h1').length, sits: dd ? dd.textContent.trim() : null,
                          prov: (b.querySelector('.ls-provenance') || {}).textContent || '', consent: !!b.querySelector('.ls-consent'),
                          sel: document.getElementById('arrive-region').value, text: b.innerText,
                          hintLinks: Array.from(document.querySelectorAll('.arrive-stage-region a')).map(a => a.getAttribute('href')).map(h => ({h, ok: !!document.getElementById(h.slice(1))})),
                          arriveLinkHidden: Array.from(b.querySelectorAll('.ls-arrive')).every(a => !a.getClientRects().length),
                          blank: Array.from(b.querySelectorAll('a[target=_blank]')).filter(a => !/noopener/.test(a.rel)).length}; }""", rid)
                r.check("region-block-one-h2-in-name" + tag, len(info["h2s"]) == 1 and info["h2s"][0] == "In " + v["name"] and info["sel"] == rid and info["nh1"] == 1, info["h2s"])
                r.check("region-ecoregion-line-matches-lib" + tag, bool(v["sits"]) and info["sits"] == v["sits"], "%r vs %r" % (info["sits"], v["sits"]))
                r.check("region-no-review-sentence" + tag, NO_REVIEW in info["prov"] and "reviewed" in info["prov"], info["prov"])
                r.check("region-consent-line" + tag, info["consent"], "")
                r.check("region-stage-pointers-resolve" + tag, bool(info["hintLinks"]) and all(x["ok"] for x in info["hintLinks"]), info["hintLinks"])
                r.check("region-no-self-link-to-arrive" + tag, info["arriveLinkHidden"], "")
                r.check("region-external-links-noopener" + tag, info["blank"] == 0, info["blank"])
                r.check("region-no-verified-by-wording" + tag, not re.search(r"verified by|reviewed by (?:the |a |each )?(?:nation|community|people|tribe)", info["text"], re.I)
                        and not re.search(r"(?:land standing|this entry|entries)\b[^.]{0,40}\bverified", info["text"], re.I), re.findall(r".{30}verified.{30}", info["text"])[:2])
                r.check("region-headings-in-order" + tag, not heading_problems(page.evaluate(HEADINGS_ALL_JS)), heading_problems(page.evaluate(HEADINGS_ALL_JS)))
                pos = page.evaluate(DOM_ORDER_JS, ORDER_4_2)
                found = [p for p in pos if p["found"]]
                r.check("region-order-4.2" + tag, [p["pos"] for p in found] == sorted(p["pos"] for p in found) and found and found[0]["sel"] == ".place-strip",
                        [(p["sel"], p["pos"]) for p in pos])
                r.check("region-no-form-no-input" + tag, page.evaluate("document.querySelectorAll('form, input, textarea').length") == 0, "")
        finally:
            s.close()

        # ------------------------------------------------------------------------------------------------ an entry that is not verified
        if vids:
            rid = vids[0]
            data_url = base + "/data/reciprocity.js"
            try:
                with urllib.request.urlopen(data_url, timeout=15) as resp:
                    src = resp.read().decode("utf-8")
                start = src.index('"%s": {' % rid)
                nxt = re.search(r'\n  "[a-z0-9-]+": \{', src[start + 5:])
                end = start + 5 + nxt.start() if nxt else len(src)
                seg = src[start:end].replace('"status": "verified"', '"status": "draft"', 1)
                modified = src[:start] + seg + src[end:]
                changed = modified != src
            except Exception as e:
                modified, changed = None, False
                r.check("unverified-fixture-built", False, str(e)[:200])
            if modified is not None:
                r.check("unverified-fixture-built", changed, "status flag not found for %s" % rid)
                s = h.session(browser, width=1280, stub=True)
                page = s.page()
                log = s.log(page)
                page.route("**/data/reciprocity.js*", lambda route, request: route.fulfill(status=200, content_type="text/javascript; charset=utf-8", body=modified))
                try:
                    page.goto(base + "/arrive.html?region=%s" % rid, wait_until="load", timeout=60000)
                    page.wait_for_timeout(1200)
                    st = page.evaluate("""(rid) => ({sel: document.getElementById('arrive-region').value, empty: document.getElementById('region').children.length === 0,
                                        offered: Array.from(document.getElementById('arrive-region').options).some(o => o.value === rid),
                                        n: document.getElementById('arrive-region').options.length})""", rid)
                    r.check("unverified-region-not-offered-and-renders-nothing", st["sel"] == "" and st["empty"] and not st["offered"], st)
                    r.check("unverified-region-no-console-error", not log.errors(own_only=True) and not log.pageerrors, [e["text"][:100] for e in log.errors(own_only=True)][:2])
                finally:
                    s.close()

        # ------------------------------------------------------------------------------------------------ layout shift
        # The data of the way in arrives late (800 ms), the visitor has already scrolled to the picker, and the address carries ?region=:
        # the block must hold its height (html.arrive-pending) so the stage text under the picker does not jump. The control run strips
        # the hold from the page and must show the shift, so the probe is proven able to fail.
        def slow(route, request):
            time.sleep(0.8)
            route.continue_()

        def shift_run(width, hold):
            s = h.session(browser, width=width, stub=True, extra_init=(CLS_INIT,))
            page = s.page()
            try:
                if not hold:
                    original = (site / "arrive.html").read_text("utf-8")
                    stripped = original.replace("h.classList.add('arrive-pending');", "")
                    page.route("**/arrive.html*", lambda route, request: route.fulfill(status=200, content_type="text/html; charset=utf-8", body=stripped))
                page.route("**/data/legal-pathway.js*", slow)
                page.goto(base + "/arrive.html?region=%s" % vids[0], wait_until="domcontentloaded", timeout=60000)
                page.evaluate("document.querySelector('.arrive-front').scrollIntoView()")
                page.wait_for_selector("#region h2", timeout=20000)
                page.wait_for_timeout(1500)
                return page.evaluate("({v: window.__cls, n: window.__clsN, pend: document.documentElement.classList.contains('arrive-pending')})")
            finally:
                s.close()

        if vids:
            for width in (1280, 390):
                try:
                    held = shift_run(width, True)
                    r.check("layout-shift-region-by-address@%d" % width, held["v"] <= CLS_BUDGET, "layout-shift total %.4f over %d entries (budget %.2f)" % (held["v"], held["n"], CLS_BUDGET))
                    r.check("hold-released-after-render@%d" % width, held["pend"] is False, "html.arrive-pending still set")
                    ctl = shift_run(width, False)
                    r.check("layout-shift-probe-sees-a-shift-without-the-hold@%d" % width, ctl["v"] > 0.1, "control total %.4f" % ctl["v"])
                except Exception as e:
                    r.check("layout-shift-region-by-address@%d" % width, False, str(e)[:300])

        # ------------------------------------------------------------------------------------------------ links in
        try:
            home = (site / "index.html").read_text("utf-8")
            r.check("link-in-home-page", "/arrive.html" in home, "index.html has no link to /arrive.html")
            deeper = (site / "deeper.html").read_text("utf-8")
            ethics = deeper[deeper.find('id="ethics"'):] if 'id="ethics"' in deeper else ""
            r.check("link-in-deeper-ethics", "/arrive.html" in ethics.split('id="whats-next"')[0] if ethics else False, "deeper.html#ethics has no link to /arrive.html")
            regs = [p for p in (site / "region").glob("*.html")]
            miss = [p.name for p in regs if "/arrive.html" not in p.read_text("utf-8")]
            r.check("link-in-every-region-page", bool(regs) and not miss, "%d of %d lack it: %s" % (len(miss), len(regs), miss[:4]))
        except Exception as e:
            r.check("link-in-pages", False, str(e)[:200])
        s = h.session(browser, width=1280, stub=True)
        page = s.page()
        try:
            rid = vids[0] if vids else "alentejo"
            page.goto(base + "/", wait_until="load", timeout=60000)
            page.wait_for_timeout(1500)
            card = page.locator("#region-%s" % rid)
            if card.count():
                card.focus()
                page.keyboard.press("Enter")
                page.wait_for_timeout(900)
                href = page.evaluate("(() => { const a = document.querySelector('#region-drawer .ls-arrive'); return a ? a.getAttribute('href') : null; })()")
                r.check("drawer-link-points-here", href == "/arrive.html?region=%s#region" % rid, href)
                if href:
                    page.keyboard.press("Escape")
                    page.goto(base + href, wait_until="load", timeout=60000)
                    page.wait_for_selector("#region h2", timeout=15000)
                    r.check("drawer-link-resolves-and-renders-block", page.evaluate("document.querySelector('#region h2').textContent.startsWith('In ')"), "")
            else:
                r.skip("drawer-link-points-here", "no card #region-%s on the home page" % rid)
        except Exception as e:
            r.check("drawer-link-points-here", False, str(e)[:300])
        finally:
            s.close()
        for rid in all_ids:
            st = head_status(base, "/region/%s.html" % rid)
            if st != 200:
                r.check("region-page-link-resolves:%s" % rid, False, st)
        if (site / "host.html").is_file():
            r.check("host-page-link-resolves", head_status(base, "/host.html") == 200, "host.html is built by BIO-7")
        else:
            r.skip("host-page-link-resolves", "host.html is not in the site yet (BIO-7)")
        r.check("no-formsubmit-requests", not h.formsubmit_attempts(), h.formsubmit_attempts())
    finally:
        h.close_browser(browser)
    return r.out
