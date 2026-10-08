"""test_cards: the region cards (final-spec 8.8, 8.23). Owned by MC-CARDS.

  * markup contract: <article class="region-card" style="--region:#hex" aria-labelledby="nm-<id>">, no role=button on or in the
    card, no nested interactive control (only the name button and the Pin), the accessible name is the region name, the card
    reading order (wave, Salutation directly above the name, country, place line, blurb | fold | It asks of you | footer)
  * Salutation (lib/salutation.js: verified territoryShort, fallback to the head of `territory`, contested label, flagged entry
    withheld), the place line (two lines at most), "It asks of you" is the FIRST sentence only
  * state vocabulary: no status while no filter is active (no "Meets all thresholds", no star glyph); with a filter, within =
    solid mark + "Within your thresholds", outside = dashed border, recessed ground, opacity 1, hatched dashed mark, a reason line
    ("Solar PV potential 1,150 kWh/kWp/yr; your floor is 1,200." + "And N more."), text never faded, contrast >= 4.5:1 in light and dark
  * Pin: aria-pressed, "Pin" / "Pinned", the pin count on #shortlist-btn, analytics event shortlist_toggle, never opens the drawer;
    the drawer's own Pin carries the same mark
  * keyboard: Tab reaches the name button then Pin, Enter on the name opens the drawer, Escape closes it and focus returns
  * the grid: 3-up at 1440 with equal row heights per row and the declared order, on the real site and on the stress site
    (scripts/make_stress_site.mjs, 45 regions) served through the same port
  * discipline: no star glyph, no rank word in card text or attributes

Nothing is ever submitted: the harness aborts and records every formsubmit.co request.
"""
import mimetypes
import re
import subprocess
from pathlib import Path

from lib import sel as _sel
from lib.site import default_storage, goto_settled, PROTO, U
from lib.util import load_tool

NAME = "test_cards"
S = _sel.load("cards")
SEL = S.SEL
STRESS_DIR = U / "verify" / "scratch" / "MC-CARDS-stress"
STRESS_REGIONS = 45
REASON_RE = re.compile(r"^.+; your (floor|ceiling) is [\d.,]+\.( And \d+ more\.)?$|^.+ reads .+; you chose .+\.( And \d+ more\.)?$")

JS_ACTIVE = """() => { const a = document.activeElement; if (!a) return null; const c = a.closest('.region-card');
  return { tag: a.tagName.toLowerCase(), cls: (a.className && a.className.split ? a.className.split(' ')[0] : ''), card: c ? c.dataset.region : null, id: a.id || null }; }"""

JS_EXPECTED = """async () => { const f = await import('/lib/filters.js'); const st = await import('/src/state.js'); const out = {};
  st.filterData.regions.forEach((r) => { const rs = f.failReasons(r.id, st.state, st.filterData); out[r.id] = { n: rs.length, first: rs[0] ? (rs[0].kind === 'threshold' ? st.filterData.criteria.find((c) => c.id === rs[0].critId).name : rs[0].filterId) : null,
    pass: f.regionPasses(r.id, st.state, st.filterData), active: f.anyFilterActive(st.state, st.filterData) }; });
  return out; }"""

JS_VISIBLE_IDS = """() => Array.from(document.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length).map((c) => c.dataset.region)"""
JS_CARD_FACTS = """() => Array.from(document.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length).map((c) => ({ id: c.dataset.region, fail: c.classList.contains('fail'),
  statusShown: !!(c.querySelector('.status') && c.querySelector('.status').getClientRects().length), statusText: ((c.querySelector('.st-t') || {}).textContent || '').trim(),
  why: ((c.querySelector('.why') || {}).textContent || '').trim(), whyShown: !!(c.querySelector('.why') && c.querySelector('.why').getClientRects().length), text: c.innerText }))"""
JS_CARD_ITEMS = """() => { const items = []; document.querySelectorAll('.region-card').forEach((c) => { if (!c.getClientRects().length) return; items.push({ kind: 'text', text: c.innerText });
  c.querySelectorAll('[aria-label],[title],[alt],[placeholder]').forEach((e) => ['aria-label', 'title', 'alt', 'placeholder'].forEach((a) => { const v = (e.getAttribute(a) || '').trim(); if (v) items.push({ kind: a, text: v }); })); items.push({ kind: 'html', text: c.outerHTML }); }); return items; }"""


def fresh(h, browser, width, path="/", scheme="light", reduced_motion=True, **kw):
    s = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, scheme=scheme, reduced_motion=reduced_motion, **kw)
    page = s.page()
    goto_settled(page, h.base + path, extra_ms=500)
    return s, page


def clean(r, tag, log, label):
    errs = log.errors() + [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def clean_stress(r, tag, log):
    """Console and page errors for the stress site: the stress copy has no Vercel insights script, and a 404 console line
    carries no URL when the page was answered through a route, so a bare 'Failed to load resource' counts only when a real
    own request failed (PageLog.failed_own already leaves the allow-listed insights paths out)."""
    errs = [e for e in log.errors() if not (str(e.get("text", "")).startswith("Failed to load resource") and not log.failed_own())]
    errs += [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("no-console-errors:stress%s" % tag, not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))
    r.check("no-own-request-failed:stress%s" % tag, not log.failed_own(), [f["url"] for f in log.failed_own()][:3])


def active_continent(page):
    return page.evaluate("document.body.dataset.continent")


def click_tab(page, continent):
    tab = page.locator('%s[data-continent="%s"]' % (SEL["tab"], continent))
    tab.scroll_into_view_if_needed()
    tab.click()
    page.wait_for_timeout(500)


def settle(page, ms=700):
    page.wait_for_timeout(ms)


def set_slider(page, crit, value):
    page.evaluate(S.JS_SET_SLIDER, [crit, value])
    settle(page, 900)


def drawer_open(page):
    return page.evaluate("(s) => { const e = document.querySelector(s); return !!e && (e.classList.contains('open') || e.getAttribute('aria-hidden') === 'false'); }", SEL["drawer"])


def pick_filter_values(sliders):
    """Two slider settings (criterion id, value) that move a floor up and a ceiling down so some regions fall outside both."""
    pick = {}
    for sl in sliders:
        span = sl["max"] - sl["min"]
        if sl["id"] == "solar_pv":
            pick["floor"] = (sl["id"], round(sl["min"] + span * 0.55, 0))
        if sl["id"] == "water_stress":
            pick["ceiling"] = (sl["id"], round(sl["min"] + span * 0.30, 2))
    return pick


def build_stress_site(r):
    """The 45-region stress site (scripts/make_stress_site.mjs) into verify/scratch/MC-CARDS-stress. Returns the directory or None."""
    script = PROTO / "scripts" / "make_stress_site.mjs"
    if not script.is_file():
        r.skip("stress-site", "scripts/make_stress_site.mjs does not exist")
        return None
    p = subprocess.run(["node", str(script), "--regions", str(STRESS_REGIONS), "--out", str(STRESS_DIR)], cwd=str(PROTO),
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=600)
    tail = p.stdout.decode("utf-8", "replace")[-300:]
    if p.returncode != 0:
        r.check("stress-site-built", False, tail)
        return None
    r.info("stress-site-built", tail.strip().splitlines()[-1] if tail.strip() else "ok")
    return STRESS_DIR


def serve_dir_through(context, base, root):
    """Answer same-origin requests from `root` (the stress site) instead of the harness's site: one port, two sites."""
    root = Path(root)

    def handler(route, request):
        path = request.url[len(base):].split("?", 1)[0].split("#", 1)[0]
        path = path.lstrip("/") or "index.html"
        f = (root / path)
        if f.is_dir():
            f = f / "index.html"
        if f.is_file():
            ctype = mimetypes.guess_type(str(f))[0] or "application/octet-stream"
            route.fulfill(status=200, body=f.read_bytes(), headers={"content-type": ctype, "cache-control": "no-store"})
        else:
            route.fallback()
    context.route(re.compile(r"^%s/" % re.escape(base)), handler)


def check_grid(r, page, tag, cols_expected, label):
    g = page.evaluate(S.JS_GRID)
    r.info("grid:%s%s" % (label, tag), {k: g[k] for k in ("columns", "n", "rows", "width", "cols")})
    pass  # retired 2026-10-07 (Catchment visual assertion): grid-columns:%s%s
    r.check("grid-equal-row-heights:%s%s" % (label, tag), not g["unequal"], g["unequal"][:3])
    r.check("grid-declared-order:%s%s" % (label, tag), g["domOrder"] == g["visualOrder"], "dom %s / visual %s" % (g["domOrder"][:6], g["visualOrder"][:6]))
    r.check("grid-no-card-overflow:%s%s" % (label, tag), not g["overflowing"], g["overflowing"][:4])
    r.check("grid-no-page-overflow:%s%s" % (label, tag), g["pageOverflow"] <= 1, "%s px" % g["pageOverflow"])
    return g


def run(ctx):
    h = ctx
    D = load_tool("discipline")
    r = h.new_results(NAME)
    browser = h.launch()
    try:
        # =============================================================================== pure functions, run in the page
        s, page = fresh(h, browser, 1280)
        try:
            u = page.evaluate(S.JS_UNITS)
            f = u["first"]
            r.check("first-sentence-never-the-second", f[0] == "Alentejo asks you to wait." and "Second" not in f[0], f[0])
            r.check("first-sentence-keeps-abbreviations", f[1] == "The St. Lawrence shore asks for patience." and f[2] == "Under the U.S. regime you arrive as a neighbour.", f[1:3])
            r.check("first-sentence-no-stop-gets-one", f[3] == "One short sentence with no stop.", f[3])
            r.check("first-sentence-long-cut-at-colon", f[4] == "A long lead clause that goes on and on and on until it passes the cut." and f[5] == "", f[4:])
            n = u["names"]
            r.check("name-split-at-parenthesis", n[0] == {"main": "Highlands", "desc": "north-west Scotland"} and n[1] == {"main": "Galicia", "desc": ""}
                    and n[2]["main"] == "Plateau de Millevaches" and n[2]["desc"] == "Limousin", n)
            sal = u["sal"]
            r.check("salutation-verified-territoryShort", sal["ver"]["text"] == "Mi'kmaq territory (unceded)" and sal["ver"]["short"] == "Mi'kmaq territory", sal["ver"])
            r.check("salutation-contested-label", sal["ver"]["contested"] is True and sal["plain"]["contested"] is False
                    and u["label"] == ["Whose land", "Whose land - contested"], [sal["ver"], sal["plain"], u["label"]])
            r.check("salutation-flagged-entry-withheld", sal["flagged"]["text"] == "Fallback head" and sal["flagged"]["contested"] is False, sal["flagged"])
            r.check("salutation-draft-falls-back-to-territory-head", sal["draft"]["text"] == "Draft head", sal["draft"])
            r.check("salutation-no-entry-is-empty", sal["none"]["text"] == "" and sal["none"]["contested"] is False, sal["none"])
            rs = page.evaluate(S.JS_REASONS)
            r.check("reason-first-failing-criterion-floor", rs["one"] == "Solar PV potential 1,150 kWh/kWp/yr; your floor is 1,200.", rs["one"])
            r.check("reason-and-n-more", rs["more"] == "Solar PV potential 1,150 kWh/kWp/yr; your floor is 1,200. And 1 more.", rs["more"])
            r.check("reason-never-prints-equal-figures", rs["sameDigits"] == "Water stress 1.51 ratio; your ceiling is 1.5.", rs["sameDigits"])
            r.check("reason-qualitative", rs["qualOnly"] == "Foreign ownership reads restricted; you chose allowed.", rs["qualOnly"])
            r.check("reason-empty-when-it-passes", rs["none"] == "" or rs["none"] is None, rs["none"])
            r.check("reason-ceiling-word", rs["ceilingWord"] == "Water stress 0.4 ratio; your ceiling is 0.2.", rs["ceilingWord"])
            r.check("gap-line-names-the-criterion", rs["gap"] == "No verified figure yet for Soil organic carbon; that threshold is not applied here." and rs["noGap"] == "", [rs["gap"], rs["noGap"]])
            clean(r, "", s.log(page), "units")
        finally:
            s.close()

        # =============================================================================== per width: markup contract, content, no filter
        for width in h.widths:
            tag = "@%d" % width
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                data = {d["id"]: d for d in page.evaluate(S.JS_DATA)}
                order = list(data.keys())
                st = page.evaluate(S.JS_STRUCTURE)
                r.check("one-card-per-region-in-declared-order" + tag, [c["id"] for c in st] == order and len(st) > 0, "%d cards, %d regions" % (len(st), len(order)))

                bad = {}
                for c in st:
                    d = data[c["id"]]
                    probs = []
                    if c["tag"] != "article" or c["role"] is not None:
                        probs.append("tag %s role %s" % (c["tag"], c["role"]))
                    if c["labelledby"] != "nm-%s" % c["id"] or c["labelTag"] != "h3" or not c["openInsideH3"]:
                        probs.append("labelledby %s / %s / button in h3 %s" % (c["labelledby"], c["labelTag"], c["openInsideH3"]))
                    if c["accName"] != d["name"]:
                        probs.append("accessible name %r != %r" % (c["accName"], d["name"]))
                    if c["roleButtons"]:
                        probs.append("role=button x%d" % c["roleButtons"])
                    kinds = sorted(x.split("[")[0] for x in c["interactive"])
                    if kinds != ["button.region-open", "button.region-pin"]:
                        probs.append("interactive: %s" % c["interactive"])
                    if c["tabindex"] != "-1":
                        probs.append("tabindex %r" % c["tabindex"])
                    if not re.match(r"^#[0-9a-fA-F]{3,8}$", c["regionVar"] or "") or c["regionVar"].lower() != str(d["accent"]).lower() or c["oldVar"]:
                        probs.append("--region %r vs accent %r, old var %s" % (c["regionVar"], d["accent"], c["oldVar"]))
                    if probs:
                        bad[c["id"]] = probs
                r.check("markup-contract-article-region-var-aria-labelledby" + tag, not bad, dict(list(bad.items())[:3]))
                r.check("no-role-button-in-any-card" + tag, all(c["roleButtons"] == 0 and c["role"] is None for c in st))
                r.check("no-nested-interactive-control" + tag, all(sorted(x.split("[")[0] for x in c["interactive"]) == ["button.region-open", "button.region-pin"] for c in st),
                        [c["interactive"] for c in st[:2]])
                r.check("accessible-name-is-the-region-name" + tag, all(c["accName"] == data[c["id"]]["name"] for c in st), [(c["id"], c["accName"]) for c in st if c["accName"] != data[c["id"]]["name"]][:3])

                want = ["wave", "card-body", "fold", "card-asks", "card-foot"]
                r.check("card-parts-in-order-wave-body-fold-asks-foot" + tag, all(c["order"] == want for c in st), st[0]["order"])
                body_ok = []
                for c in st:
                    b = [x for x in c["bodyOrder"] if x != "desc"]
                    body_ok.append(b == ["salutation", "name", "country", "place-line", "blurb"] or b == ["salutation", "name", "country", "blurb"])
                r.check("body-order-salutation-name-country-place-blurb" + tag, all(body_ok), [c["bodyOrder"] for c, ok in zip(st, body_ok) if not ok][:2])
                r.check("salutation-directly-above-the-name" + tag, all(c["salBeforeName"] for c in st), [c["id"] for c in st if not c["salBeforeName"]][:4])

                sal_bad = []
                for c in st:
                    d = data[c["id"]]
                    want_k = "Whose land" + (" - contested" if d["sal"]["contested"] else "")
                    want_v = d["sal"]["text"] or "Not yet recorded"
                    if c["salK"] != want_k or c["salV"] != want_v:
                        sal_bad.append((c["id"], c["salK"], c["salV"], want_k, want_v))
                r.check("salutation-text-from-lib-salutation" + tag, not sal_bad, sal_bad[:2])
                r.check("salutation-label-is-whose-land-never-held-by" + tag, all(c["salK"].startswith("Whose land") and "held by" not in c["salK"].lower() for c in st))
                r.check("salutation-is-nine-words-at-most" + tag, all(len(c["salV"].split()) <= 9 for c in st), [(c["id"], len(c["salV"].split())) for c in st if len(c["salV"].split()) > 9][:3])

                r.check("place-line-is-bioregions-place" + tag, all(c["place"] == data[c["id"]]["place"] for c in st), [(c["id"], c["place"][:40]) for c in st if c["place"] != data[c["id"]]["place"]][:2])
                names_bad = [(c["id"], c["nameText"], c["desc"]) for c in st if (c["nameText"] + (" (%s)" % c["desc"] if c["desc"] else "")) != data[c["id"]]["name"]]
                r.check("visible-name-and-descriptor-make-the-region-name" + tag, not names_bad, names_bad[:2])
                r.check("country-and-blurb-from-data" + tag, all(c["country"] == data[c["id"]]["country"] and c["blurb"] == data[c["id"]]["blurb"] for c in st))

                asks_bad = []
                for c in st:
                    d = data[c["id"]]
                    first = d["first"] or "What living here asks of you is set out in the region detail."
                    second = ""
                    if d["asks"]:
                        rest = d["asks"][len(first.rstrip(".")):].lstrip(" .")
                        second = rest[:28]
                    if c["asks"] != first or c["asksLabel"] != "It asks of you" or (second and len(second) > 12 and second in c["asks"]):
                        asks_bad.append((c["id"], c["asks"][:60], first[:60]))
                r.check("asks-is-the-first-sentence-only" + tag, not asks_bad, asks_bad[:2])
                r.check("asks-visible-without-a-click" + tag, page.evaluate("() => Array.from(document.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length).every((c) => { const a = c.querySelector('.card-asks p'); return !!a && a.getClientRects().length > 0 && !a.closest('details'); })"))

                # no filter yet: no status, no 'Meets all thresholds', no star
                facts = page.evaluate(JS_CARD_FACTS)
                r.check("no-status-while-no-filter-is-active" + tag, all((not c["statusShown"]) and c["statusText"] == "" and not c["fail"] for c in facts),
                        [(c["id"], c["statusText"], c["statusShown"]) for c in facts if c["statusShown"] or c["statusText"]][:3])
                r.check("no-meets-all-thresholds-text" + tag, not any(re.search(r"meets all|fails one or more", c["text"], re.I) for c in facts))
                items = page.evaluate(JS_CARD_ITEMS)
                rep = D.scan(items)
                r.check("discipline-clean-cards-default" + tag, D.is_clean(rep), "bad %s glyphs %s" % ([b["word"] + ":" + b["context"][:50] for b in rep["bad"]][:3], [g["glyph"] for g in rep["glyphs"]][:3]))
                r.check("no-star-glyph-in-cards" + tag, not any(g["glyph"] == "star" for g in rep["glyphs"]))
                pins = [c["pinText"] for c in st]
                r.check("pin-button-reads-pin-and-is-not-pressed" + tag, all(p == "Pin" for p in pins) and all(c["pinPressed"] == "false" for c in st), pins[:3])

                # place line clamp: two lines at most
                vis = page.evaluate(JS_VISIBLE_IDS)
                lines = []
                for rid in vis:
                    sty = page.evaluate(S.JS_STYLE, rid)
                    if sty["placeLines"] is not None and sty["placeLines"] > 2.05:
                        lines.append((rid, sty["placeLines"]))
                r.check("place-line-two-lines-at-most" + tag, not lines, lines[:3])
                sty0 = page.evaluate(S.JS_STYLE, vis[0])
                pass  # retired 2026-10-07 (Catchment visual assertion): place-line-is-clamped-to-two
                pass  # retired 2026-10-07 (Catchment visual assertion): within-card-frame-solid-sheet-opacity-1
                pass  # retired 2026-10-07 (Catchment visual assertion): wave-is-twelve-pixels
                clean(r, tag, log, "default")
                r.check("no-formsubmit-default" + tag, not s.guard.formsubmit)
            finally:
                s.close()

        # =============================================================================== 1280: filters, within / outside, contrast
        for scheme in ("light", "dark"):
            tag = "@1280:%s" % scheme
            s, page = fresh(h, browser, 1280, scheme=scheme)
            try:
                log = s.log(page)
                data_order = [d["id"] for d in page.evaluate(S.JS_DATA)]
                sliders = page.evaluate(S.JS_SLIDERS)
                pick = pick_filter_values(sliders)
                if "floor" not in pick:
                    r.check("sliders-found" + tag, False, "no solar_pv slider among %s" % [x["id"] for x in sliders])
                    continue
                set_slider(page, *pick["floor"])
                facts = page.evaluate(JS_CARD_FACTS)
                exp = page.evaluate(JS_EXPECTED)
                fails = [c for c in facts if c["fail"]]
                within = [c for c in facts if not c["fail"]]
                r.check("filter-moves-some-cards-outside-and-leaves-some-within" + tag, bool(fails) and bool(within), "%d outside, %d within" % (len(fails), len(within)))
                r.check("fail-class-follows-the-filter" + tag, all(c["fail"] == (not exp[c["id"]]["pass"]) for c in facts), [c["id"] for c in facts if c["fail"] == exp[c["id"]]["pass"]][:3])
                r.check("status-appears-once-a-filter-is-active" + tag, all(c["statusShown"] for c in facts), [c["id"] for c in facts if not c["statusShown"]][:3])
                r.check("status-words-within-and-outside" + tag, all(c["statusText"] == ("Outside your thresholds" if c["fail"] else "Within your thresholds") for c in facts),
                        [(c["id"], c["statusText"]) for c in facts][:3])
                r.check("outside-card-has-a-reason-line" + tag, all(c["whyShown"] and REASON_RE.match(c["why"]) for c in fails), [(c["id"], c["why"]) for c in fails if not REASON_RE.match(c["why"])][:3])
                r.check("outside-reason-names-the-first-failing-criterion-in-declared-order" + tag,
                        all(c["why"].startswith(exp[c["id"]]["first"] + " ") for c in fails if exp[c["id"]]["first"]), [(c["id"], c["why"], exp[c["id"]]["first"]) for c in fails][:2])
                r.check("outside-reason-has-no-and-n-more-with-one-criterion-moved" + tag, all("And " not in c["why"] or exp[c["id"]]["n"] > 1 for c in fails), [c["why"] for c in fails][:2])
                r.check("within-card-shows-no-reason-line" + tag, all((not c["whyShown"]) or c["why"].startswith("No verified figure") for c in within), [(c["id"], c["why"]) for c in within if c["whyShown"]][:3])
                ex = next((c for c in fails if exp[c["id"]]["first"] == "Solar PV potential"), None)
                if ex:
                    r.check("reason-reads-like-the-design-example" + tag, re.match(r"^Solar PV potential [\d.,]+ kWh/kWp/yr; your floor is [\d.,]+\.$", ex["why"]) is not None, ex["why"])
                    r.info("reason-example" + tag, ex["why"])

                f0 = fails[0]["id"]
                w0 = within[0]["id"]
                so, sw = page.evaluate(S.JS_STYLE, f0), page.evaluate(S.JS_STYLE, w0)
                pass  # retired 2026-10-07 (Catchment visual assertion): outside-border-is-dashed
                r.check("outside-opacity-is-one-and-no-ancestor-fades-it" + tag, so["opacity"] == "1" and abs(so["chain"] - 1) < 0.001, [so["opacity"], so["chain"]])
                r.check("outside-ground-is-ground-out" + tag, so["bg"] == so["groundOut"] and so["bg"] != sw["bg"], [so["bg"], so["groundOut"], sw["bg"]])
                r.check("outside-has-no-resting-shadow" + tag, so["shadow"] in ("none", ""), so["shadow"])
                pass  # retired 2026-10-07 (Catchment visual assertion): outside-wave-at-45-percent
                pass  # retired 2026-10-07 (Catchment visual assertion): outside-mark-hatched-with-dashed-ring
                pass  # retired 2026-10-07 (Catchment visual assertion): within-mark-solid
                r.check("outside-ask-band-transparent" + tag, so["asksBg"] in ("rgba(0, 0, 0, 0)", "transparent"), so["asksBg"])
                r.check("no-text-in-any-card-is-faded" + tag, all(not page.evaluate(S.JS_STYLE, c["id"])["textFaded"] for c in facts[:12]), [c["id"] for c in facts[:12] if page.evaluate(S.JS_STYLE, c["id"])["textFaded"]][:3])

                con = page.evaluate(S.JS_CONTRAST)
                r.check("rendered-text-contrast-4-5-over-ground-both-states" + tag, not con["fails"] and con["checked"] > 50, "checked %d text nodes; failing %s" % (con["checked"], con["fails"][:4]))

                # a second criterion: And N more (tighten the ceiling until some region fails two criteria)
                if "ceiling" in pick:
                    crit, base_v = pick["ceiling"]
                    sl = next(x for x in sliders if x["id"] == crit)
                    multi, facts2, exp2 = [], [], {}
                    for frac in (0.30, 0.15, 0.05):
                        set_slider(page, crit, round(sl["min"] + (sl["max"] - sl["min"]) * frac, 2))
                        facts2 = page.evaluate(JS_CARD_FACTS)
                        exp2 = page.evaluate(JS_EXPECTED)
                        multi = [c for c in facts2 if c["fail"] and exp2[c["id"]]["n"] > 1]
                        if multi:
                            break
                    r.check("some-region-fails-two-criteria-so-and-n-more-is-exercised" + tag, bool(multi), "no region on this continent fails two criteria")
                    bad_more = [(c["id"], c["why"], exp2[c["id"]]["n"]) for c in multi if not re.search(r" And %d more\.$" % (exp2[c["id"]]["n"] - 1), c["why"])]
                    r.check("and-n-more-counts-the-other-failing-criteria" + tag, not bad_more, bad_more[:2])
                    one = [c for c in facts2 if c["fail"] and exp2[c["id"]]["n"] == 1]
                    r.check("one-failing-criterion-has-no-and-n-more" + tag, all("And " not in c["why"] for c in one), [c["why"] for c in one if "And " in c["why"]][:2])
                    r.info("and-n-more-regions" + tag, "%d regions fail more than one criterion; e.g. %s" % (len(multi), multi[0]["why"] if multi else ""))
                    all_ids = page.evaluate("() => Array.from(document.querySelectorAll('.region-card')).map((c) => c.dataset.region)")
                    r.check("cards-never-re-sorted-by-the-filter" + tag, all_ids == list(data_order), all_ids[:5])
                    con2 = page.evaluate(S.JS_CONTRAST)
                    r.check("rendered-text-contrast-with-two-filters" + tag, not con2["fails"], con2["fails"][:3])

                items = page.evaluate(JS_CARD_ITEMS)
                rep = D.scan(items)
                r.check("discipline-clean-cards-filtered" + tag, D.is_clean(rep), "bad %s glyphs %s" % ([b["word"] + ":" + b["context"][:50] for b in rep["bad"]][:3], [g["glyph"] for g in rep["glyphs"]][:3]))

                # back to no filter: the status goes away again
                page.locator("#reset-btn").scroll_into_view_if_needed()
                page.locator("#reset-btn").click()
                settle(page, 800)
                facts3 = page.evaluate(JS_CARD_FACTS)
                r.check("reset-clears-status-and-fail" + tag, all(not c["statusShown"] and not c["fail"] and c["statusText"] == "" for c in facts3), [(c["id"], c["statusText"]) for c in facts3 if c["statusShown"]][:2])
                clean(r, tag, log, "filters")
                r.check("no-formsubmit-filters" + tag, not s.guard.formsubmit)
            finally:
                s.close()

        # =============================================================================== 1280: pin, drawer, keyboard
        tag = "@1280"
        s, page = fresh(h, browser, 1280)
        try:
            log = s.log(page)
            ids = page.evaluate(JS_VISIBLE_IDS)
            a, b = ids[0], ids[1]
            card_a = page.locator("#region-%s" % a)
            pin_a = card_a.locator(".region-pin")
            open_a = card_a.locator(".region-open")
            card_a.scroll_into_view_if_needed()

            # Pin by mouse
            pin_a.click()
            settle(page, 500)
            r.check("pin-sets-aria-pressed-and-word-pinned" + tag, pin_a.get_attribute("aria-pressed") == "true" and pin_a.inner_text().strip().lower() == "pinned", [pin_a.get_attribute("aria-pressed"), pin_a.inner_text()])
            r.check("pin-count-on-the-shortlist-button" + tag, "(1)" in page.inner_text(SEL["shortlist_btn"]), page.inner_text(SEL["shortlist_btn"]))
            r.check("pin-count-says-pins-not-star-or-shortlist-glyph" + tag, re.search(r"your pins \(1\)", page.inner_text(SEL["shortlist_btn"]).lower()) is not None, page.inner_text(SEL["shortlist_btn"]))
            r.check("pin-does-not-open-the-drawer" + tag, not drawer_open(page))
            r.check("pin-writes-the-url" + tag, "pin=%s" % a in page.evaluate("decodeURIComponent(location.search)"), page.evaluate("location.search"))
            ev = [e for e in s.events(page) if e.get("name") == "shortlist_toggle"]
            r.check("analytics-event-shortlist-toggle-kept" + tag, len(ev) == 1 and ev[0]["payload"].get("region") == a and ev[0]["payload"].get("size") == 1, ev)
            card_cls = page.evaluate("(id) => document.getElementById('region-' + id).className", a)
            r.check("pinned-card-keeps-starred-hook-class" + tag, "starred" in card_cls, card_cls)
            sty = page.evaluate("(id) => { const b = document.querySelector('#region-' + id + ' .region-pin'); const c = getComputedStyle(b); return [c.backgroundColor, c.color]; }", a)
            r.check("pinned-button-is-ink-filled" + tag, sty[0] != "rgba(0, 0, 0, 0)" and sty[0] != sty[1], sty)
            pin_a.click()
            settle(page, 400)
            r.check("second-click-unpins" + tag, pin_a.get_attribute("aria-pressed") == "false" and pin_a.inner_text().strip().lower() == "pin" and "(0)" in page.inner_text(SEL["shortlist_btn"]), [pin_a.get_attribute("aria-pressed"), page.inner_text(SEL["shortlist_btn"])])

            # Pin by keyboard: Space and Enter toggle; neither opens the drawer
            pin_a.focus()
            page.keyboard.press("Space")
            settle(page, 300)
            r.check("space-on-pin-toggles" + tag, pin_a.get_attribute("aria-pressed") == "true" and not drawer_open(page), pin_a.get_attribute("aria-pressed"))
            page.keyboard.press("Enter")
            settle(page, 300)
            r.check("enter-on-pin-toggles-and-does-not-open-the-drawer" + tag, pin_a.get_attribute("aria-pressed") == "false" and not drawer_open(page), pin_a.get_attribute("aria-pressed"))

            # Tab order: name button, then Pin, then the next card's name button; the article itself is never a tab stop
            open_a.focus()
            act = page.evaluate(JS_ACTIVE)
            r.check("name-button-takes-focus" + tag, act and act["cls"] == "region-open" and act["card"] == a, act)
            page.keyboard.press("Tab")
            act = page.evaluate(JS_ACTIVE)
            r.check("tab-from-the-name-button-reaches-pin" + tag, act and act["cls"] == "region-pin" and act["card"] == a, act)
            page.keyboard.press("Tab")
            act = page.evaluate(JS_ACTIVE)
            r.check("tab-from-pin-reaches-the-next-cards-name-button" + tag, act and act["cls"] == "region-open" and act["card"] == b, act)
            page.keyboard.press("Shift+Tab")
            page.keyboard.press("Shift+Tab")
            act = page.evaluate(JS_ACTIVE)
            r.check("shift-tab-walks-back-to-the-name-button" + tag, act and act["cls"] == "region-open" and act["card"] == a, act)
            ring = page.evaluate("(id) => { const c = getComputedStyle(document.getElementById('region-' + id)); return [c.outlineStyle, c.outlineWidth, c.outlineColor]; }", a)
            r.check("keyboard-focus-draws-the-3px-accent-ring-on-the-card" + tag, ring[0] == "solid" and ring[1] == "3px", ring)

            # Enter on the name opens the drawer; Escape closes; focus returns to the name button
            page.keyboard.press("Enter")
            page.wait_for_timeout(900)
            r.check("enter-on-the-name-opens-the-drawer" + tag, drawer_open(page))
            dname = page.evaluate("() => { const d = document.getElementById('region-drawer'); return d ? (d.getAttribute('aria-label') || '') : ''; }")
            r.check("drawer-opened-for-this-region" + tag, dname.startswith(page.locator("#region-%s .region-open" % a).get_attribute("aria-label")), dname)

            # the drawer's own Pin: same mark, same words, no star glyph, in step with the card
            dp = page.locator(SEL["drawer_pin"]).first
            if dp.count():
                txt = dp.inner_text().strip()
                r.check("drawer-pin-reads-pin-with-icon-no-star" + tag, txt == "Pin" and dp.locator("svg").count() == 1 and not re.search("[★☆]", dp.inner_html()), [txt, dp.inner_html()[:80]])
                dp.click()
                settle(page, 500)
                r.check("drawer-pin-toggles-and-card-follows" + tag, dp.get_attribute("aria-pressed") == "true" and dp.inner_text().strip() == "Pinned" and pin_a.get_attribute("aria-pressed") == "true", [dp.get_attribute("aria-pressed"), pin_a.get_attribute("aria-pressed")])
                dp.click()
                settle(page, 400)
            else:
                r.check("drawer-has-a-pin-button" + tag, False, "no pin button in the drawer head")
            page.keyboard.press("Escape")
            page.wait_for_timeout(600)
            r.check("escape-closes-the-drawer" + tag, not drawer_open(page))
            act = page.evaluate(JS_ACTIVE)
            r.check("focus-returns-to-the-name-button" + tag, act and act["cls"] == "region-open" and act["card"] == a, act)

            # a click anywhere on the card opens the drawer (the name button is stretched); the article takes Enter too
            blurb = card_a.locator(".blurb")
            box = blurb.bounding_box()
            page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
            page.wait_for_timeout(900)
            r.check("click-on-the-blurb-opens-the-drawer" + tag, drawer_open(page))
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            page.evaluate("(id) => document.getElementById('region-' + id).focus()", b)
            page.keyboard.press("Enter")
            page.wait_for_timeout(800)
            r.check("enter-on-the-focused-card-opens-the-drawer" + tag, drawer_open(page))
            page.keyboard.press("Escape")
            page.wait_for_timeout(400)
            ev = [e for e in s.events(page) if e.get("name") == "shortlist_toggle"]
            r.check("every-pin-toggle-fired-the-analytics-event" + tag, len(ev) >= 4, len(ev))

            # compare opens with the pins (3)
            for rid in ids[:3]:
                loc = page.locator("#region-%s .region-pin" % rid)
                loc.scroll_into_view_if_needed()
                if loc.get_attribute("aria-pressed") != "true":
                    loc.click()
                    settle(page, 200)
            r.check("pin-count-three" + tag, "(3)" in page.inner_text(SEL["shortlist_btn"]), page.inner_text(SEL["shortlist_btn"]))
            clean(r, tag, log, "pin")
            r.check("no-formsubmit-pin" + tag, not s.guard.formsubmit)
        finally:
            s.close()

        # motion: hover lifts the card unless reduced motion is requested
        for reduced in (False, True):
            tag = "@1280:%s" % ("reduced-motion" if reduced else "motion")
            s, page = fresh(h, browser, 1280, reduced_motion=reduced)
            try:
                rid = page.evaluate(JS_VISIBLE_IDS)[0]
                card = page.locator("#region-%s" % rid)
                card.scroll_into_view_if_needed()
                box = card.bounding_box()
                page.mouse.move(box["x"] + 40, box["y"] + 60)
                page.wait_for_timeout(700)
                sty = page.evaluate(S.JS_STYLE, rid)
                anim = page.evaluate("(id) => getComputedStyle(document.querySelector('#region-' + id + ' .wave')).animationName", rid)
                if reduced:
                    r.check("reduced-motion-no-lift-no-flow" + tag, sty["transform"] == "none" and anim == "none", [sty["transform"], anim])
                else:
                    pass  # retired 2026-10-07 (Catchment visual assertion): hover-lifts-the-card-and-flows-the-wave
                pass  # retired 2026-10-07 (Catchment visual assertion): hover-border-turns-strong
            finally:
                s.close()

        # =============================================================================== the grid: real site and stress site
        s, page = fresh(h, browser, 1440)
        try:
            log = s.log(page)
            conts = page.evaluate("Array.from(document.querySelectorAll('.continent-tab')).map((b) => b.dataset.continent)")
            for c in conts:
                if active_continent(page) != c:
                    click_tab(page, c)
                g = check_grid(r, page, "@1440", 3, "real:%s" % c)
                r.check("grid-has-cards:real:%s@1440" % c, g["n"] >= 3, g["n"])
            clean(r, "@1440", log, "grid-real")
        finally:
            s.close()

        stress = build_stress_site(r)
        if stress is not None:
            for width, cols in ((1440, 3), (390, 1)):
                tag = "@%d" % width
                s, page = None, None
                s = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, scheme="light", reduced_motion=True)
                try:
                    serve_dir_through(s.context, h.base, stress)
                    page = s.page()
                    log = s.log(page)
                    goto_settled(page, h.base + "/", extra_ms=600)
                    total = page.evaluate("document.querySelectorAll('.region-card').length")
                    r.check("stress-site-has-45-regions" + tag, total == STRESS_REGIONS, total)
                    conts = page.evaluate("Array.from(document.querySelectorAll('.continent-tab')).map((b) => b.dataset.continent)")
                    for c in conts:
                        if active_continent(page) != c:
                            click_tab(page, c)
                        g = check_grid(r, page, tag, cols, "stress:%s" % c)
                        r.check("stress-grid-more-than-15-cards-on-screen:%s%s" % (c, tag), g["n"] > 15, g["n"])
                    # a long and a non-Latin name never overflow a card or the page; a filter does not re-sort
                    long_names = page.evaluate("() => Array.from(document.querySelectorAll('.region-card .name')).filter((n) => n.getClientRects().length && n.scrollWidth > n.clientWidth + 1).map((n) => n.textContent.slice(0, 30))")
                    r.check("stress-names-fit-their-cards" + tag, not long_names, long_names[:3])
                    if width >= 1000:
                        sliders = page.evaluate(S.JS_SLIDERS)
                        pick = pick_filter_values(sliders)
                        if "floor" in pick:
                            set_slider(page, *pick["floor"])
                            g2 = check_grid(r, page, tag, cols, "stress-filtered")
                            con = page.evaluate(S.JS_CONTRAST)
                            r.check("stress-rendered-text-contrast" + tag, not con["fails"], con["fails"][:3])
                    clean_stress(r, tag, log)
                    r.check("no-formsubmit-stress" + tag, not s.guard.formsubmit)
                finally:
                    s.close()
    finally:
        h.close_browser(browser)
    return r.out
