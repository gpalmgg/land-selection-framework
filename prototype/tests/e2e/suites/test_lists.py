"""test_lists: the match bar, chips, next step, qualitative filters, compare table and summary table. Owned by MC-LISTS.

  * match bar: the kept ids, the three ghost buttons ("Reset thresholds", "Share this view", "Your pins (n)"), the count and
    "of N regions within your thresholds", the null contract (a region with a gap for a threshold the visitor moved is counted
    as neither within nor outside: "N within, M with gaps", listed apart, never marked as failing), the announcement
  * chips: the regions within the thresholds in the slate's declared order, never ranked; up to 8 names then "and N more" (at 12
    matching regions on the stress site too), every name stays reachable, chips open the drawer
  * next step: the same sentence for every order of the slate; it names NO region and none of first, best, top, closest, in every
    state (initial, preset, slider extremes, zero matches, qualitative filter, pins, reset, both continents, the stress site)
  * qualitative filters: labelled selects 40px high; option VALUES are the internal enums, option TEXT comes from
    lib/qual-labels.js (native-unit price bands, never a superlative, never a token, never the word cheapest); ?q.* links parse
  * compare: ONE real table with a caption, scoped heads (no th without scope), columns in the order pinned (stated), rows in the
    reciprocity order, a source and vintage line on every value cell, gap cells, no totals / no highlight / no sorting, no cap
    on pins, 8 pins scroll inside the card (sticky first column, no page overflow), the hint on phones
  * summary table: caption that says there is no total, sticky header and first column, th scope=row, first row "Whose land",
    values in ink, .region-fail shades the WHOLE column (never opacity), no totals row or column, scrolls inside its frame
  * discipline scan of the list components and contrast >= 4.5:1; no console errors; nothing is ever submitted

The stress site (45 regions, scripts/make_stress_site.mjs) is built fresh into verify/scratch/MC-LISTS-stress and served through
the harness port by a Playwright route, so no second port is bound. When --site is itself a stress site built before this WP
(it holds the old match-bar.js), the fresh build is used in its place.
"""
import mimetypes
import re
import subprocess
from pathlib import Path

from lib import sel as _sel
from lib.site import default_storage, goto_settled, PROTO, U
from lib.util import load_tool

NAME = "test_lists"
S = _sel.load("lists")
SEL = S.SEL
STRESS_DIR = U / "verify" / "scratch" / "MC-LISTS-stress"
STRESS_REGIONS = 45
CHIP_CAP = 8
NEXT_RE = re.compile(r"^(No region is within your thresholds\. Loosen a threshold to read more places\.|1 region is within your thresholds\.( Open it to read whose land it is and what it asks of you\.)?|(\d+) regions are within your thresholds\. Open any of them to read whose land it is and what it asks of you\.)$")
BANNED_NEXT = re.compile(S.NEXT_STEP_BANNED, re.I)
SUPERLATIVE = re.compile(S.SUPERLATIVE, re.I)
SORTISH = re.compile(r"\b(total|sum|score|rank|average|best|top)\b", re.I)
_stress_built = {}


# ------------------------------------------------------------------------------------------------- site plumbing
def is_stress(root):
    return (Path(root) / "SYNTHETIC-STRESS-SITE.txt").is_file()


def is_current(root):
    """True when the site holds this WP's code (the markup and the module that came with it)."""
    root = Path(root)
    try:
        return "matchTally" in (root / "src" / "ui" / "match-bar.js").read_text("utf-8") and "match-gap-note" in (root / "index.html").read_text("utf-8")
    except Exception:
        return False


def build_stress_site(r):
    """The 45-region stress site into verify/scratch/MC-LISTS-stress (built once per run). Returns the directory or None."""
    if "dir" in _stress_built:
        return _stress_built["dir"]
    script = PROTO / "scripts" / "make_stress_site.mjs"
    if not script.is_file():
        r.skip("stress-site", "scripts/make_stress_site.mjs does not exist")
        _stress_built["dir"] = None
        return None
    p = subprocess.run(["node", str(script), "--regions", str(STRESS_REGIONS), "--out", str(STRESS_DIR)], cwd=str(PROTO),
                       stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=900)
    tail = p.stdout.decode("utf-8", "replace")[-300:]
    if p.returncode != 0:
        r.check("stress-site-built", False, tail)
        _stress_built["dir"] = None
        return None
    r.info("stress-site-built", tail.strip().splitlines()[-1] if tail.strip() else "ok")
    _stress_built["dir"] = STRESS_DIR
    return STRESS_DIR


def serve_dir_through(context, base, root):
    """Answer same-origin requests from `root` instead of the harness's site: one port, two sites."""
    root = Path(root)

    def handler(route, request):
        path = request.url[len(base):].split("?", 1)[0].split("#", 1)[0]
        path = path.lstrip("/") or "index.html"
        f = root / path
        if f.is_dir():
            f = f / "index.html"
        if f.is_file():
            ctype = mimetypes.guess_type(str(f))[0] or "application/octet-stream"
            route.fulfill(status=200, body=f.read_bytes(), headers={"content-type": ctype, "cache-control": "no-store"})
        else:
            route.fallback()
    context.route(re.compile(r"^%s/" % re.escape(base)), handler)


def fresh(h, browser, width, root=None, path="/", scheme="light"):
    s = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, scheme=scheme, reduced_motion=True,
                  permissions=["clipboard-read", "clipboard-write"])
    if root is not None:
        serve_dir_through(s.context, h.base, root)
    page = s.page()
    goto_settled(page, h.base + path, extra_ms=500)
    return s, page


def clean(r, label, log, stress=False):
    errs = log.errors() + [{"type": "pageerror", "text": e} for e in log.pageerrors]
    if stress:   # the stress copy has no insights script; a bare 404 console line carries no URL
        errs = [e for e in errs if not (str(e.get("text", "")).startswith("Failed to load resource") and not log.failed_own())]
    r.check("no-console-errors:%s" % label, not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))
    r.check("no-own-request-failed:%s" % label, not log.failed_own(), [f["url"] for f in log.failed_own()][:3])


def settle(page, ms=900):
    page.wait_for_timeout(ms)


def bar(page):
    return page.evaluate(S.JS_BAR)


def set_slider(page, crit, value):
    out = page.evaluate(S.JS_SET_SLIDER, [crit, value])
    settle(page)
    return float(out)


def default_of(c):
    return c["min"] if c["higherIs"] == "better" else c["max"]


def reset_all(page, boot):
    for c in boot["criteria"]:
        page.evaluate(S.JS_SET_SLIDER, [c["id"], default_of(c)])
    settle(page)


def passes(c, value, th):
    return value >= th if c["higherIs"] == "better" else value <= th


def pick_threshold(page, boot, ids, want_lo, want_hi, k):
    """Move one slider so that between want_lo and want_hi of the regions in `ids` are within the thresholds. Returns (criterion, threshold, bar)
    or None. Starts from the k-th value of each criterion."""
    for c in boot["criteria"]:
        vals = [boot["values"][i][c["id"]]["value"] for i in ids]
        vals = sorted([v for v in vals if isinstance(v, (int, float))], reverse=(c["higherIs"] == "better"))
        if len(vals) < k:
            continue
        th = set_slider(page, c["id"], vals[k - 1])
        b = bar(page)
        if want_lo <= len(b["tally"]["within"]) <= want_hi and not b["tally"]["gaps"]:
            return c, th, b
        page.evaluate(S.JS_SET_SLIDER, [c["id"], default_of(c)])
        settle(page, 400)
    return None


def check_next(r, page, boot, label):
    """The next-step line in the current state: the spec sentence, no region name or id, no first/best/top/closest, no control."""
    b = bar(page)
    text = b["next"]
    n = len(b["tally"]["within"])
    r.check("next-step-sentence:%s" % label, NEXT_RE.match(text) is not None and text == b["nextWant"], text)
    m = re.match(r"^(\d+) region", text)
    r.check("next-step-count-is-the-match-count:%s" % label, (int(m.group(1)) if m else 0) == n and str(n) == b["count"], "%s vs match %s / %d" % (text, b["count"], n))
    low = text.lower()
    hits = []
    for rg in boot["regions"]:
        for name in {rg["name"], rg["main"], rg["short"], rg["id"], rg["id"].replace("-", " ")}:
            if len(name) >= 4 and re.search(r"(?<![a-z])%s(?![a-z])" % re.escape(name.lower()), low):
                hits.append(name)
    r.check("next-step-names-no-region:%s" % label, not hits, hits[:3])
    r.check("next-step-no-ranking-word:%s" % label, BANNED_NEXT.search(text) is None, text)
    r.check("next-step-has-no-control:%s" % label, b["nextButtons"] == 0, b["nextButtons"])
    r.check("next-step-empty-class-when-zero:%s" % label, page.evaluate("document.getElementById('next-step').classList.contains('empty')") == (n == 0))
    return b


# ------------------------------------------------------------------------------------------------- the checks
def check_markup(r, page, boot, label, width):
    ids = ["match-count", "match-total", "match-detail", "match-announce", "match-regions", "share-note", "shortlist-btn", "share-btn", "reset-btn",
           "next-step", "next-step-lead", "qual-filters", "sum-table", "compare-overlay", "compare-body"]
    missing = [i for i in ids if not page.evaluate("(i) => !!document.getElementById(i)", i)]
    r.check("kept-ids-present:%s" % label, not missing, missing)
    btn = page.evaluate("""() => ['reset-btn', 'share-btn', 'shortlist-btn'].map((i) => { const b = document.getElementById(i); return { id: i, text: b.textContent.trim(), tag: b.tagName, type: b.type, h: Math.round(b.getBoundingClientRect().height),
      label: b.getAttribute('aria-label'), svg: b.querySelectorAll('svg').length, visible: b.getClientRects().length > 0 }; })""")
    texts = {b["id"]: b["text"] for b in btn}
    r.check("ghost-buttons-words:%s" % label, texts == {"reset-btn": "Reset thresholds", "share-btn": "Share this view", "shortlist-btn": "Your pins (0)"}, texts)
    r.check("ghost-buttons-are-real-buttons-40px:%s" % label, all(b["tag"] == "BUTTON" and b["type"] == "button" and b["h"] >= 40 and b["visible"] for b in btn), btn)
    r.check("pins-button-has-icon-and-count-label:%s" % label, btn[2]["svg"] == 1 and page.evaluate("!!document.getElementById('pin-count-label')"), btn[2])
    r.check("share-label-starts-with-visible-words:%s" % label, all((b["label"] is None) or b["text"].split(" (")[0].lower() in b["label"].lower() for b in btn), btn)
    b0 = bar(page)
    r.check("count-total-initial:%s" % label, b0["count"] == b0["total"] == str(len(b0["tally"]["inView"])) and b0["count"] == str(len(b0["cardsShown"])), b0["count"] + "/" + b0["total"])
    r.check("detail-says-of-n-regions-within-your-thresholds:%s" % label, re.match(r"^of \d+ regions within your thresholds\.", b0["detail"]) is not None, b0["detail"])
    r.check("no-chips-until-a-filter-is-active:%s" % label, b0["chips"] == [] and b0["more"] is None, b0["chips"][:3])
    r.check("no-announcement-without-a-filter:%s" % label, b0["announce"] == "", b0["announce"])
    r.check("match-bar-has-ink-rules:%s" % label, page.evaluate("""() => { const c = getComputedStyle(document.querySelector('.match-bar')); return c.borderTopWidth === '1px' && c.borderBottomWidth === '1px' && c.borderLeftWidth === '0px'; }"""))
    num = page.evaluate("""() => { const c = getComputedStyle(document.getElementById('match-count')); return { family: c.fontFamily, weight: c.fontWeight, size: parseFloat(c.fontSize), feat: c.fontVariantNumeric }; }""")
    r.check("count-is-fraunces-tabular-lining:%s" % label, "Fraunces" in num["family"] and "tabular-nums" in num["feat"] and "lining-nums" in num["feat"], num)
    return b0


def check_chips(r, page, boot, label, stress):
    """Chips: declared order, cap 8, 'and N more', reachability, the drawer."""
    inview = bar(page)["tally"]["inView"]
    order = [x["id"] for x in boot["regions"]]
    got = pick_threshold(page, boot, inview, CHIP_CAP + 1, len(inview) - 1, min(12, len(inview) - 1))
    if not got:
        r.check("chips-found-a-slider-with-9-or-more-matches:%s" % label, False, "no criterion gives between 9 and %d matches" % (len(inview) - 1))
        return
    c, th, b = got
    n = len(b["tally"]["within"])
    want = [i for i in order if i in b["tally"]["within"]]
    r.info("chips-state:%s" % label, "criterion %s threshold %s -> %d within of %d" % (c["id"], th, n, len(inview)))
    r.check("chips-in-declared-order-never-ranked:%s" % label, b["chips"] == want[:CHIP_CAP], "%s vs %s" % (b["chips"], want[:CHIP_CAP]))
    r.check("chips-cap-is-8-names:%s" % label, len(b["chips"]) == CHIP_CAP, len(b["chips"]))
    r.check("and-n-more-button:%s" % label, b["more"] is not None and b["more"]["text"] == "and %d more" % (n - CHIP_CAP) and b["more"]["expanded"] == "false", b["more"])
    r.check("count-equals-the-passing-regions:%s" % label, b["count"] == str(n) == str(len(want)), b["count"])
    r.check("outside-regions-are-the-failing-cards:%s" % label, sorted(b["cardsFail"]) == sorted(b["tally"]["outside"]), "%s vs %s" % (b["cardsFail"], b["tally"]["outside"]))
    r.check("detail-says-never-ranked:%s" % label, "never ranked" in b["detail"], b["detail"])
    r.check("announcement-names-count-and-total:%s" % label, re.match(r"^%d of %d regions within your thresholds\." % (n, len(inview)), b["announce"]) is not None, b["announce"])
    check_next(r, page, boot, "filtered-%d-matches:%s" % (n, label))
    # reveal every name
    page.locator(SEL["chip_more"]).first.scroll_into_view_if_needed()
    page.locator(SEL["chip_more"]).first.click()
    settle(page, 400)
    b2 = bar(page)
    r.check("every-name-stays-reachable:%s" % label, b2["chips"] == want, "%d chips of %d" % (len(b2["chips"]), n))
    r.check("show-fewer-button-after-reveal:%s" % label, b2["more"] is not None and b2["more"]["expanded"] == "true" and b2["more"]["text"] == "show fewer names", b2["more"])
    focus = page.evaluate("document.activeElement && document.activeElement.dataset ? document.activeElement.dataset.region : null")
    r.check("focus-moves-to-the-first-revealed-name:%s" % label, focus == want[CHIP_CAP], focus)
    names = {bx["id"]: bx["main"] for bx in boot["regions"]}
    r.check("chip-names-are-the-short-names:%s" % label, all(nm and nm in {x["short"] or x["main"] for x in boot["regions"]} for nm in b2["chipNames"]), b2["chipNames"][:4])
    page.locator(SEL["chip_more"]).first.click()
    settle(page, 300)
    b3 = bar(page)
    r.check("show-fewer-collapses-to-8:%s" % label, len(b3["chips"]) == CHIP_CAP and b3["more"]["text"] == "and %d more" % (n - CHIP_CAP), b3["more"])
    # a chip opens the drawer
    page.locator(SEL["chip"]).nth(1).scroll_into_view_if_needed()
    page.locator(SEL["chip"]).nth(1).click()
    settle(page, 700)
    opened = page.evaluate("(() => { const d = document.getElementById('region-drawer'); return d.classList.contains('open') || d.getAttribute('aria-hidden') === 'false'; })()")
    r.check("a-chip-opens-the-drawer:%s" % label, opened)
    page.keyboard.press("Escape")
    settle(page, 500)
    if stress:
        # exactly 12 matching regions on the stress site: the cap shows 8 names and "and 4 more" holds the rest
        found = None
        page.evaluate(S.JS_SET_SLIDER, [c["id"], default_of(c)])
        settle(page, 400)
        for c3 in boot["criteria"]:
            vals = sorted([boot["values"][i][c3["id"]]["value"] for i in inview if isinstance(boot["values"][i][c3["id"]]["value"], (int, float))], reverse=(c3["higherIs"] == "better"))
            for k in range(10, min(len(vals), 16) + 1):
                set_slider(page, c3["id"], vals[k - 1])
                b12 = bar(page)
                if len(b12["tally"]["within"]) == 12 and not b12["tally"]["gaps"]:
                    found = b12
                    break
            if found:
                break
            page.evaluate(S.JS_SET_SLIDER, [c3["id"], default_of(c3)])
        if found:
            r.check("and-4-more-at-12-matching-regions:%s" % label, len(found["chips"]) == CHIP_CAP and found["more"] is not None and found["more"]["text"] == "and 4 more", found["more"])
            page.locator(SEL["chip_more"]).first.click()
            settle(page, 400)
            r.check("all-12-names-reachable:%s" % label, len(bar(page)["chips"]) == 12)
            check_next(r, page, boot, "twelve-matches:%s" % label)
        else:
            r.info("exactly-12-matches-not-found:%s" % label, "the cloned values tie, no threshold splits at exactly 12")
        for c3 in boot["criteria"]:
            page.evaluate(S.JS_SET_SLIDER, [c3["id"], default_of(c3)])
        settle(page, 600)
    # few matches: no more button
    got2 = pick_threshold(page, boot, inview, 1, CHIP_CAP, 5)
    if got2:
        c2, th2, bf = got2
        r.check("few-matches-no-more-button:%s" % label, bf["more"] is None and len(bf["chips"]) == len(bf["tally"]["within"]), bf["more"])
        check_next(r, page, boot, "filtered-%d-matches:%s" % (len(bf["tally"]["within"]), label))
        page.evaluate(S.JS_SET_SLIDER, [c2["id"], default_of(c2)])
    page.evaluate(S.JS_SET_SLIDER, [c["id"], default_of(c)])
    settle(page)


def check_gap_contract(r, page, boot, label):
    """A cell with no verified figure for a threshold the visitor moved: neither within nor outside, listed apart, never failing."""
    b = bar(page)
    inview = b["tally"]["inView"]
    if len(inview) < 4:
        r.skip("gap-contract:%s" % label, "fewer than 4 regions in view")
        return
    gap_rid = inview[0]
    crit = boot["criteria"][0]
    other = boot["criteria"][1]
    vals = sorted(boot["values"][i][crit["id"]]["value"] for i in inview if isinstance(boot["values"][i][crit["id"]]["value"], (int, float)))
    mid = vals[len(vals) // 2]
    page.evaluate(S.JS_MAKE_GAP, [gap_rid, crit["id"]])
    settle(page, 500)
    # (1) the threshold of the gap criterion moved: the gap region is a gap
    th = set_slider(page, crit["id"], mid)
    bb = bar(page)
    exp_in = [i for i in inview if i != gap_rid and passes(crit, boot["values"][i][crit["id"]]["value"], th)]
    exp_out = [i for i in inview if i != gap_rid and not passes(crit, boot["values"][i][crit["id"]]["value"], th)]
    r.check("gap-region-is-in-the-gap-group:%s" % label, bb["tally"]["gaps"] == [gap_rid], bb["tally"]["gaps"])
    r.check("gap-region-never-counted-as-within:%s" % label, gap_rid not in bb["tally"]["within"] and bb["count"] == str(len(exp_in)), "%s vs %d" % (bb["count"], len(exp_in)))
    r.check("gap-region-never-counted-as-outside:%s" % label, gap_rid not in bb["tally"]["outside"] and gap_rid not in bb["cardsFail"] and sorted(bb["tally"]["outside"]) == sorted(exp_out), bb["tally"]["outside"])
    r.check("within-gaps-outside-add-up-to-the-regions-in-view:%s" % label, len(bb["tally"]["within"]) + len(bb["tally"]["gaps"]) + len(bb["tally"]["outside"]) == len(inview) and b["total"] == bb["total"], bb["tally"])
    r.check("within-chips-exclude-the-gap-region:%s" % label, gap_rid not in bb["chips"] and bb["gapChips"] == [gap_rid], "%s / %s" % (bb["chips"][:3], bb["gapChips"]))
    r.check("detail-says-n-with-gaps:%s" % label, re.search(r"1 with a gap: no verified figure for a threshold you set, so it is counted as neither within nor outside\.", bb["detail"]) is not None, bb["detail"])
    r.check("announcement-says-with-gaps:%s" % label, re.search(r"1 with a gap, counted as neither within nor outside\.", bb["announce"]) is not None, bb["announce"])
    r.check("next-step-counts-only-the-within-regions:%s" % label, bb["next"] == bb["nextWant"] and (bb["next"].startswith("%d region" % len(exp_in)) or (len(exp_in) == 0 and bb["next"].startswith("No region"))), bb["next"])
    check_next(r, page, boot, "gap:%s" % label)
    cell = page.evaluate("(([r, c]) => { const e = document.getElementById('sum-td-' + r + '-' + c); return e ? { text: e.textContent.trim(), gap: e.classList.contains('gap'), failCls: e.classList.contains('region-fail') } : null; })", [gap_rid, crit["id"]])
    r.check("gap-cell-in-the-summary-says-not-yet-verified-and-is-not-shaded:%s" % label, cell and cell["gap"] and cell["text"].startswith("not yet verified") and not cell["failCls"], cell)
    # (2) the gap criterion back at its default, another criterion moved: no gap to speak of
    page.evaluate(S.JS_SET_SLIDER, [crit["id"], default_of(crit)])
    ovals = sorted(boot["values"][i][other["id"]]["value"] for i in inview if isinstance(boot["values"][i][other["id"]]["value"], (int, float)))
    th2 = set_slider(page, other["id"], ovals[len(ovals) // 2])
    b2 = bar(page)
    r.check("a-gap-in-an-unmoved-criterion-is-not-a-gap:%s" % label, b2["tally"]["gaps"] == [] and b2["gapChips"] == [], b2["tally"]["gaps"])
    page.evaluate(S.JS_SET_SLIDER, [other["id"], default_of(other)])
    settle(page)


def check_qual(r, page, boot, label):
    qs = page.evaluate(S.JS_QUAL)
    note = qs[-1]["note"]
    selects = qs[:-1]
    if boot["fileMetaHasEdges"] and not boot["metaHasEdges"]:
        r.info("v1meta-not-reexported-by-data-js:%s" % label, "data/v1-lookup.js documents the price band edges but src/data.js does not re-export v1Meta: the affordability labels read the relative wording until it does (follow-up of MC-LISTS)")
    r.check("four-labelled-selects:%s" % label, [s["id"] for s in selects] == [q["id"] for q in boot["qual"]] and len(selects) == 4, [s["id"] for s in selects])
    r.check("selects-are-40px-high:%s" % label, all(s["height"] >= 40 for s in selects), [(s["id"], s["height"]) for s in selects])
    r.check("select-labels-from-the-label-map:%s" % label, all(s["label"] == q["field"] and q["field"] for s, q in zip(selects, boot["qual"])), [(s["id"], s["label"]) for s in selects])
    bad_text, bad_vals, bad_super, bad_token = [], [], [], []
    for s, q in zip(selects, boot["qual"]):
        want = {o["value"]: o["label"] for o in q["labelled"]}
        if [o["value"] for o in s["options"]] != q["options"]:
            bad_vals.append((s["id"], [o["value"] for o in s["options"]], q["options"]))
        for o in s["options"]:
            if o["text"] != want.get(o["value"], "<<missing>>"):
                bad_text.append((s["id"], o["value"], o["text"], want.get(o["value"])))
            if SUPERLATIVE.search(o["text"]):
                bad_super.append((s["id"], o["text"]))
            if "_" in o["text"] or (o["value"] not in ("any", "yes", "no", "low", "moderate", "high", "stable", "restricted", "tightening", "loosening", "volatile", "unknown") and o["text"] == o["value"]):
                bad_token.append((s["id"], o["value"], o["text"]))
    r.check("option-values-are-the-internal-enums:%s" % label, not bad_vals, bad_vals[:2])
    r.check("option-text-equals-the-label-map-output:%s" % label, not bad_text, bad_text[:3])
    r.check("option-text-has-no-superlative:%s" % label, not bad_super, bad_super[:3])
    r.check("option-text-never-prints-an-enum-token:%s" % label, not bad_token, bad_token[:3])
    aff = next((s for s in selects if s["id"] == "affordability_band"), None)
    cheapest = next((o for o in aff["options"] if o["value"] == "cheapest"), None) if aff else None
    r.check("old-cheapest-value-kept-for-shared-links-but-never-printed:%s" % label, bool(cheapest) and not re.search(r"cheapest", cheapest["text"], re.I), cheapest)
    r.check("band-text-is-a-native-unit-price-or-relative-wording:%s" % label,
            bool(cheapest) and (re.search(r"per hectare", cheapest["text"]) is not None) == boot["metaHasEdges"] and (boot["metaHasEdges"] or "price band" in cheapest["text"]), cheapest)
    unk = next((o for o in aff["options"] if o["value"] == "unknown"), None) if aff else None
    r.check("unknown-reads-price-not-read:%s" % label, bool(unk) and unk["text"] == "price not read", unk)
    r.check("band-note-iff-the-layer-documents-edges:%s" % label, bool(note) == boot["metaHasEdges"] and (not note or "price could not be tied to an opened source" in note), note)
    # choosing an option filters, writes the enum into the URL, and 'any' clears it
    first = page.locator(SEL["qual_select"]).first
    fid = first.get_attribute("data-qual-filter")
    opt = next(o["value"] for o in selects[0]["options"] if o["value"] not in ("any", "unknown"))
    first.scroll_into_view_if_needed()
    first.select_option(opt)
    settle(page, 700)
    b = bar(page)
    r.check("qual-choice-writes-the-enum-to-the-url:%s" % label, ("q.%s=%s" % (fid, opt)) in b["url"], b["url"])
    r.check("qual-choice-filters-and-never-scores:%s" % label, b["tally"]["active"] and len(b["tally"]["within"]) + len(b["tally"]["outside"]) + len(b["tally"]["gaps"]) == len(b["tally"]["inView"]), b["count"])
    check_next(r, page, boot, "qual-choice:%s" % label)
    first.select_option("any")
    settle(page, 500)


def check_reset(r, page, boot, label):
    b = bar(page)
    inview = b["tally"]["inView"]
    c = boot["criteria"][0]
    vals = sorted(boot["values"][i][c["id"]]["value"] for i in inview)
    set_slider(page, c["id"], vals[len(vals) // 2])
    first = page.locator(SEL["qual_select"]).first
    first.select_option("restricted" if page.evaluate("(s) => Array.from(s.options).some((o) => o.value === 'restricted')", first.element_handle()) else "any")
    settle(page, 600)
    b1 = bar(page)
    r.check("filters-active-before-reset:%s" % label, b1["tally"]["active"] and "t." in b1["url"], b1["url"])
    page.locator(SEL["reset"]).scroll_into_view_if_needed()
    page.locator(SEL["reset"]).click()
    settle(page, 1100)
    b2 = bar(page)
    sel_vals = page.evaluate("Array.from(document.querySelectorAll('#qual-filters select')).map((s) => s.value)")
    r.check("reset-clears-thresholds-and-selects:%s" % label, not b2["tally"]["active"] and all(v == "any" for v in sel_vals) and "t." not in b2["url"] and "q." not in b2["url"], "%s %s" % (sel_vals, b2["url"]))
    r.check("reset-restores-count-and-removes-chips:%s" % label, b2["count"] == b2["total"] and b2["chips"] == [] and b2["more"] is None and b2["gapChips"] == [], b2["count"])
    r.check("reset-is-announced:%s" % label, re.match(r"^Thresholds reset\. All \d+ regions are shown\.$", b2["announce"]) is not None, b2["announce"])
    check_next(r, page, boot, "after-reset:%s" % label)


def check_states_for_next_step(r, page, boot, label):
    """Every state the interactions suite visits: initial, other continent, preset, slider extremes, zero matches, pin."""
    check_next(r, page, boot, "initial:%s" % label)
    # slider extreme that filters, then every threshold at its restrictive end: zero matches
    for c in boot["criteria"]:
        page.evaluate(S.JS_SET_SLIDER, [c["id"], c["max"] if c["higherIs"] == "better" else c["min"]])
    settle(page, 900)
    b = check_next(r, page, boot, "zero-matches:%s" % label)
    r.check("zero-matches-reads-loosen-a-threshold:%s" % label, b["next"] == "No region is within your thresholds. Loosen a threshold to read more places." and b["count"] == "0", b["next"])
    r.check("zero-matches-no-chips:%s" % label, b["chips"] == [] and b["more"] is None)
    reset_all(page, boot)
    # preset
    chip = page.locator(".preset-chip").first
    chip.scroll_into_view_if_needed()
    chip.click()
    settle(page, 900)
    check_next(r, page, boot, "preset:%s" % label)
    page.locator(SEL["reset"]).click()
    settle(page, 700)
    # a single region within the thresholds (the sentence for one)
    inview = bar(page)["tally"]["inView"]
    one = pick_threshold(page, boot, inview, 1, 1, 1)
    if one:
        bo = check_next(r, page, boot, "one-match:%s" % label)
        r.check("one-match-sentence:%s" % label, bo["next"].startswith("1 region is within your thresholds."), bo["next"])
        page.evaluate(S.JS_SET_SLIDER, [one[0]["id"], default_of(one[0])])
        settle(page, 500)
    # a pin
    star = page.locator("#region-%s .region-pin" % bar(page)["cardsShown"][0])
    star.scroll_into_view_if_needed()
    star.click()
    settle(page, 500)
    check_next(r, page, boot, "pinned:%s" % label)
    star.click()
    settle(page, 400)


def pin_regions(page, ids):
    for i in ids:
        pin = page.locator("#region-%s .region-pin" % i)
        pin.scroll_into_view_if_needed()
        pin.click()
        page.wait_for_timeout(120)
    settle(page, 400)


def open_compare(page):
    page.locator(SEL["pins_btn"]).scroll_into_view_if_needed()
    page.locator(SEL["pins_btn"]).click()
    page.wait_for_timeout(900)


def close_compare(page):
    page.locator(SEL["compare_close"]).click()
    page.wait_for_timeout(400)


def check_compare(r, page, boot, label, width, n_pins, gap=None):
    """Pin n regions in a deliberate non-declared order, open the compare view and read the table."""
    b = bar(page)
    vis = b["cardsShown"]
    order = [x["id"] for x in boot["regions"]]
    if len(vis) < n_pins:
        r.skip("compare:%s" % label, "only %d regions in view" % len(vis))
        return
    pins = list(reversed(vis[:n_pins])) if n_pins > 3 else [vis[2], vis[0], vis[1]]
    pin_regions(page, pins)
    btn = page.inner_text(SEL["pins_btn"]).strip()
    r.check("pins-button-counts-pins:%s" % label, btn == "Your pins (%d)" % n_pins, btn)
    open_compare(page)
    t = page.evaluate(S.JS_COMPARE)
    if not t:
        r.check("compare-table-exists:%s" % label, False, "no table in #compare-body")
        return
    by_id = {x["id"]: x for x in boot["regions"]}
    r.check("compare-is-one-real-table-with-a-caption:%s" % label, bool(t["caption"]) and str(n_pins) in t["caption"] and "criteria" in t["caption"], t["caption"])
    r.check("compare-no-th-without-scope:%s" % label, t["thNoScope"] == 0, t["thNoScope"])
    r.check("compare-th-scopes-col-and-row:%s" % label, t["colScopes"] == n_pins + 1 and t["rowScopes"] == len(t["rows"]) and t["thTotal"] == t["colScopes"] + t["rowScopes"], "%d col, %d row" % (t["colScopes"], t["rowScopes"]))
    names = [h["name"] for h in t["colHeads"]]
    r.check("compare-columns-equal-the-pin-order:%s" % label, names == [by_id[i]["main"] for i in pins], "%s vs %s" % (names, [by_id[i]["main"] for i in pins]))
    r.check("compare-columns-are-not-in-declared-order:%s" % label, [i for i in order if i in pins] != pins, pins)
    r.check("compare-column-heads-carry-salutation-and-country:%s" % label, all(h["sal"].startswith("Whose land") and h["salV"] and h["country"] == by_id[i]["country"] for h, i in zip(t["colHeads"], pins)), t["colHeads"][:2])
    r.check("compare-states-the-order-on-screen:%s" % label, "in the order you pinned them, never ranked" in t["note"].lower() and "nothing is added up" in t["note"].lower(), t["note"])
    r.check("compare-title-and-dialog-name:%s" % label, t["title"] == "Your pins, side by side" and t["dialogLabel"] == "compare-title", t["title"])
    heads = [rw["head"] for rw in t["rows"]]
    want_heads = ["Tenure", "Arriving in good faith", "It asks of you", "Place"] + [c["name"] for c in boot["criteria"]]
    r.check("compare-rows-in-the-reciprocity-order:%s" % label, heads == want_heads, heads)
    r.check("compare-every-row-has-one-cell-per-pin:%s" % label, all(len(rw["cells"]) == n_pins for rw in t["rows"]), [len(rw["cells"]) for rw in t["rows"]][:6])
    recip = t["rows"][:4]
    r.check("compare-reciprocity-rows-are-text-per-region:%s" % label, all(c["text"] and not re.search(r"^\d+$", c["text"]) and c["v"] == "" for rw in recip for c in rw["cells"]), [c["text"][:30] for c in recip[0]["cells"]])
    miss = []
    for rw in t["rows"][4:]:
        crit = next(c for c in boot["criteria"] if c["name"] == rw["head"])
        for cell, rid in zip(rw["cells"], pins):
            data = boot["values"][rid][crit["id"]]
            if gap and (rid, crit["id"]) == gap:
                continue
            if "gap" in cell["cls"]:
                miss.append((rid, crit["id"], "unexpected gap"))
                continue
            if not cell["v"] or not cell["s"]:
                miss.append((rid, crit["id"], "value/source missing: %r" % cell["text"][:60]))
            elif data["vintage"] and data["vintage"] not in cell["s"]:
                miss.append((rid, crit["id"], "vintage %r not in %r" % (data["vintage"], cell["s"][:80])))
            elif data["source"] and data["source"] not in cell["s"]:
                miss.append((rid, crit["id"], "source %r not in %r" % (data["source"], cell["s"][:80])))
            elif cell["links"] < 1:
                miss.append((rid, crit["id"], "no source link"))
    r.check("compare-every-value-cell-has-source-and-vintage:%s" % label, not miss, miss[:3])
    if gap:
        gcell = next((cell for rw in t["rows"] if rw["head"] == next(c["name"] for c in boot["criteria"] if c["id"] == gap[1]) for cell, rid in zip(rw["cells"], pins) if rid == gap[0]), None)
        r.check("compare-gap-cell-says-not-yet-verified-with-its-source:%s" % label, bool(gcell) and "gap" in gcell["cls"] and gcell["v"] == "not yet verified" and bool(gcell["s"]) and not re.search(r"\bnull\b", gcell["text"]), gcell)
    r.check("compare-no-totals-row-or-column:%s" % label, t["tfoot"] == 0 and not any(SORTISH.search(h) for h in heads + names + [t["caption"]]) and len(t["rows"]) == len(want_heads), heads[:3])
    r.check("compare-no-sorting-or-highlight-controls:%s" % label, t["controls"] == 0, t["controls"])
    r.check("compare-no-cap-on-pins:%s" % label, len(t["colHeads"]) == n_pins, len(t["colHeads"]))
    sc = t["scroll"]
    r.check("compare-scroll-box-is-focusable-and-named:%s" % label, sc["overflowX"] == "auto" and sc["tabindex"] == "0" and sc["role"] == "region" and bool(sc["aria"]), sc)
    r.check("compare-no-page-overflow:%s" % label, t["pageOverflow"] <= 1 and t["panel"]["scrollW"] <= t["panel"]["clientW"] + 1, "page %s, panel %s" % (t["pageOverflow"], t["panel"]))
    r.check("compare-first-column-is-sticky:%s" % label, t["stickyRowHead"] == "sticky", t["stickyRowHead"])
    needs_scroll = t["tableW"] > sc["clientW"] + 1
    if width < 768 or n_pins >= 6:
        r.check("compare-scrolls-inside-its-card:%s" % label, needs_scroll and sc["scrollW"] > sc["clientW"], "table %s box %s/%s" % (t["tableW"], sc["scrollW"], sc["clientW"]))
        mv = page.evaluate(S.JS_COMPARE_SCROLL, 320)
        r.check("compare-sticky-column-stays-while-scrolling:%s" % label, mv["left"] > 0 and -1 <= mv["gap"] <= 2 and mv["pageOverflow"] <= 1, mv)
        page.evaluate(S.JS_COMPARE_SCROLL, 0)
    r.check("compare-scroll-hint-on-phones-only:%s" % label, t["hintShown"] == (width < 768) and (width >= 768 or t["hintText"] == "Scroll sideways to read every column."), "%s %s" % (t["hintShown"], t["hintText"]))
    con = page.evaluate(S.JS_CONTRAST)
    r.check("compare-rendered-text-contrast:%s" % label, not con["fails"], con["fails"][:3])
    return pins


def check_summary(r, page, boot, label, width, stress):
    s = page.evaluate(S.JS_SUMMARY)
    n_regions = len(boot["regions"])
    r.check("summary-caption-says-there-is-no-total:%s" % label, s["captionSr"] and re.search(r"no total row and no total column", s["caption"]) is not None, s["caption"])
    r.check("summary-no-th-without-scope:%s" % label, s["thNoScope"] == 0, s["thNoScope"])
    r.check("summary-header-scope-col-rows-scope-row:%s" % label, set(s["headScopes"]) == {"col"} and set(s["rowScopes"]) == {"row"}, "%s / %s" % (set(s["headScopes"]), set(s["rowScopes"])))
    r.check("summary-columns-in-declared-order:%s" % label, s["headIds"] == ["sum-th-%s" % x["id"] for x in boot["regions"]], s["headIds"][:4])
    r.check("summary-first-row-is-whose-land-then-the-criteria-in-order:%s" % label, s["rowHeads"] == ["Whose land"] + [c["name"] for c in boot["criteria"]], s["rowHeads"])
    r.check("summary-no-totals-row-or-column:%s" % label, s["tfoot"] == 0 and not SORTISH.search(" ".join(s["rowHeads"])) and not SORTISH.search(s["lastColHeader"]) and s["rowsHtml"] == 1 + len(boot["criteria"]), s["lastColHeader"])
    r.check("summary-whose-land-row-is-the-salutation-text:%s" % label, len(s["firstRowCells"]) == n_regions and all(c for c in s["firstRowCells"]), s["firstRowCells"][:2])
    r.check("summary-scrolls-inside-its-frame:%s" % label, s["wrapOverflowX"] == "auto" and s["pageOverflow"] <= 1 and s["wrapTabindex"] == "0", "overflow %s page %s" % (s["wrapOverflowX"], s["pageOverflow"]))
    r.check("summary-header-and-first-column-are-sticky:%s" % label, s["stickyHead"] == "sticky" and s["stickyCorner"] == "sticky" and s["stickyRowHead"] == "sticky", [s["stickyHead"], s["stickyCorner"], s["stickyRowHead"]])
    r.check("summary-scroll-hint-on-phones-only:%s" % label, s["hintShown"] == (width < 768), s["hintShown"])
    shown = [c["id"] for c in s["cols"] if c["shown"]]
    r.check("summary-shows-the-active-continents-columns:%s" % label, s["visibleCols"] == len(bar(page)["tally"]["inView"]) and len(shown) == s["visibleCols"], "%d visible of %d" % (s["visibleCols"], n_regions))
    r.check("summary-values-in-ink-never-ramp-tinted:%s" % label, all(c["vColors"] == [s["ink"]] and c["vInline"] == 0 for c in s["cols"]), [(c["id"], c["vColors"], c["vInline"]) for c in s["cols"] if c["vColors"] != [s["ink"]] or c["vInline"]][:2])
    mv = page.evaluate(S.JS_SUMMARY_SCROLL, 300)
    r.check("summary-sticky-first-column-stays-while-scrolling:%s" % label, mv["left"] > 0 and -1 <= mv["gap"] <= 2, mv)
    page.evaluate(S.JS_SUMMARY_SCROLL, 0)
    return s


def check_summary_fail(r, page, boot, label):
    """With a filter, a region outside the thresholds shades its whole column by background, never by opacity."""
    inview = bar(page)["tally"]["inView"]
    got = pick_threshold(page, boot, inview, 2, len(inview) - 1, max(2, len(inview) // 2))
    if not got:
        r.check("summary-fail-found-a-slider:%s" % label, False, "no criterion splits the regions")
        return
    c, th, b = got
    s = page.evaluate(S.JS_SUMMARY)
    by = {x["id"]: x for x in s["cols"]}
    outside = b["tally"]["outside"]
    r.check("summary-outside-regions-shade-every-cell-of-their-column:%s" % label, outside and all(by[i]["fail"] == by[i]["n"] for i in outside), [(i, by[i]["fail"], by[i]["n"]) for i in outside[:3]])
    r.check("summary-within-regions-are-not-shaded:%s" % label, all(by[i]["fail"] == 0 for i in b["tally"]["within"]), [(i, by[i]["fail"]) for i in b["tally"]["within"][:3] if by[i]["fail"]])
    r.check("summary-never-opacity-on-a-shaded-column:%s" % label, all(by[i]["opacities"] == ["1"] for i in outside), [(i, by[i]["opacities"]) for i in outside[:3]])
    r.check("summary-shaded-column-is-the-recessed-ground-with-dashed-inline-borders:%s" % label, all(by[i]["bgs"] == [s["groundOut"]] and "dashed" in by[i]["borderStyles"] for i in outside), [(i, by[i]["bgs"], by[i]["borderStyles"]) for i in outside[:2]])
    r.check("summary-shaded-text-stays-ink:%s" % label, all(by[i]["vColors"] == [s["ink"]] for i in outside), [(i, by[i]["vColors"]) for i in outside[:2]])
    page.evaluate(S.JS_SET_SLIDER, [c["id"], default_of(c)])
    settle(page, 600)
    s2 = page.evaluate(S.JS_SUMMARY)
    r.check("summary-shading-clears-on-reset:%s" % label, all(c2["fail"] == 0 for c2 in s2["cols"]), [(c2["id"], c2["fail"]) for c2 in s2["cols"] if c2["fail"]][:3])


def check_discipline(r, page, D, label):
    items = page.evaluate(S.JS_ITEMS)
    for it in items:
        it["where"] = label
    rep = D.scan(items)
    r.check("discipline-no-banned-word:%s" % label, not rep["bad"], rep["bad"][:3])
    r.check("discipline-no-glyph:%s" % label, not rep["glyphs"], rep["glyphs"][:3])
    r.check("discipline-no-contact-or-sort-control:%s" % label, not (rep["emails"] or rep["contact"] or rep["sort_controls"]), (rep["emails"] + rep["contact"] + rep["sort_controls"])[:3])


# ------------------------------------------------------------------------------------------------- one site, one width
def run_site(r, h, browser, width, label, root, stress, D):
    tag = "%s@%d" % (label, width)
    # ---- session 1: bar, chips, next step, qualitative filters, reset, summary
    s, page = fresh(h, browser, width, root)
    try:
        boot = page.evaluate(S.JS_BOOT)
        r.check("site-regions-count:%s" % tag, len(boot["regions"]) == (STRESS_REGIONS if stress else len(boot["regions"])) and len(boot["regions"]) >= 20, len(boot["regions"]))
        continents = []
        for x in boot["regions"]:
            if x["continent"] not in continents:
                continents.append(x["continent"])
        check_markup(r, page, boot, tag, width)
        check_chips(r, page, boot, tag, stress)
        check_states_for_next_step(r, page, boot, tag)
        if not stress or width >= 768:
            check_qual(r, page, boot, tag)
            check_reset(r, page, boot, tag)
        # the other continent: the same sentence, still no names
        if len(continents) > 1:
            other = [c for c in continents if c != boot["continent"]][0]
            tab = page.locator('%s[data-continent="%s"]' % (SEL["tab"], other))
            tab.scroll_into_view_if_needed()
            tab.click()
            settle(page, 800)
            b = check_next(r, page, boot, "other-continent:%s" % tag)
            r.check("other-continent-count-is-its-own-region-count:%s" % tag, b["count"] == b["total"] == str(len([x for x in boot["regions"] if x["continent"] == other])), "%s/%s" % (b["count"], b["total"]))
            check_summary(r, page, boot, "%s:%s" % (other, tag), width, stress)
            tab0 = page.locator('%s[data-continent="%s"]' % (SEL["tab"], boot["continent"]))
            tab0.scroll_into_view_if_needed()
            tab0.click()
            settle(page, 800)
        check_summary(r, page, boot, tag, width, stress)
        check_summary_fail(r, page, boot, tag)
        clean(r, "lists-1:%s" % tag, s.log(page), stress)
        r.check("no-formsubmit-lists-1:%s" % tag, not s.guard.formsubmit)
    finally:
        s.close()
    # ---- session 2: compare (3 pins; then a fresh session for 8 pins when the width needs it)
    s, page = fresh(h, browser, width, root)
    try:
        boot = page.evaluate(S.JS_BOOT)
        # empty compare says Pin, never star
        open_compare(page)
        body = page.evaluate("document.getElementById('compare-body').innerText")
        r.check("compare-empty-state-says-pin-not-star:%s" % tag, "Use Pin on any region card" in body and not re.search(r"star", body, re.I), body[:120])
        close_compare(page)
        check_compare(r, page, boot, "%s:3-pins" % tag, width, 3)
        check_discipline(r, page, D, "compare:%s" % tag)
        close_compare(page)
        clean(r, "compare-3:%s" % tag, s.log(page), stress)
        r.check("no-formsubmit-compare-3:%s" % tag, not s.guard.formsubmit)
    finally:
        s.close()
    s, page = fresh(h, browser, width, root)
    try:
        boot = page.evaluate(S.JS_BOOT)
        check_compare(r, page, boot, "%s:8-pins" % tag, width, 8)
        close_compare(page)
        clean(r, "compare-8:%s" % tag, s.log(page), stress)
        r.check("no-formsubmit-compare-8:%s" % tag, not s.guard.formsubmit)
    finally:
        s.close()
    # ---- session 3: the gap contract in the bar, the summary and the compare view; discipline and contrast of the bar
    s, page = fresh(h, browser, width, root)
    try:
        boot = page.evaluate(S.JS_BOOT)
        check_gap_contract(r, page, boot, tag)
        inview = bar(page)["tally"]["inView"]
        gap_rid, crit = inview[0], boot["criteria"][0]
        set_slider(page, crit["id"], sorted(boot["values"][i][crit["id"]]["value"] for i in inview)[len(inview) // 2])
        pin_regions(page, [inview[0], inview[1]])
        open_compare(page)
        t = page.evaluate(S.JS_COMPARE)
        r.check("compare-gap-cell-in-a-pinned-region:%s" % tag,
                bool(t) and any("gap" in c["cls"] and c["v"] == "not yet verified" and c["s"] for rw in t["rows"] for c in rw["cells"]), [c["cls"] for rw in t["rows"][4:6] for c in rw["cells"]])
        close_compare(page)
        pick_threshold(page, boot, inview, 2, len(inview) - 1, max(2, len(inview) // 2))
        check_discipline(r, page, D, "bar-filtered:%s" % tag)
        con = page.evaluate(S.JS_CONTRAST)
        r.check("lists-rendered-text-contrast:%s" % tag, not con["fails"] and con["checked"] > 40, "%d checked; %s" % (con["checked"], con["fails"][:3]))
        clean(r, "lists-3:%s" % tag, s.log(page), stress)
        r.check("no-formsubmit-lists-3:%s" % tag, not s.guard.formsubmit)
    finally:
        s.close()
    # ---- session 4: an old shared link keeps parsing (?q.affordability_band=cheapest) and prints its label
    s, page = fresh(h, browser, width, root, path="/?q.affordability_band=cheapest")
    try:
        boot = page.evaluate(S.JS_BOOT)
        val = page.evaluate("document.getElementById('qual-filter-affordability_band').value")
        shown = page.evaluate("(() => { const s = document.getElementById('qual-filter-affordability_band'); return s.options[s.selectedIndex].textContent.trim(); })()")
        want = next(o["label"] for q in boot["qual"] if q["id"] == "affordability_band" for o in q["labelled"] if o["value"] == "cheapest")
        r.check("old-link-q-affordability-cheapest-selects-the-option:%s" % tag, val == "cheapest" and shown == want and not re.search(r"cheapest", shown, re.I), "%s / %s" % (val, shown))
        b = bar(page)
        r.check("old-link-filters-the-regions:%s" % tag, b["tally"]["active"] and "q.affordability_band=cheapest" in b["url"], b["url"])
        check_next(r, page, boot, "old-link:%s" % tag)
        clean(r, "lists-4:%s" % tag, s.log(page), stress)
    finally:
        s.close()


def run(ctx):
    h = ctx
    D = load_tool("discipline")
    r = h.new_results(NAME)
    main_root = h.site
    if not is_current(h.site):
        if is_stress(h.site):
            fresh_dir = build_stress_site(r)
            r.info("site-predates-mc-lists", "the --site stress copy holds the old match bar; using the fresh build %s" % fresh_dir)
            main_root = fresh_dir
        else:
            r.check("site-holds-the-lists-code", False, "%s has no src/ui/match-bar.js with matchTally or no #match-gap-note" % h.site)
    if main_root is None:
        return r.out
    main_through = None if Path(main_root).resolve() == Path(h.site).resolve() else main_root
    stress_root = main_root if is_stress(main_root) else build_stress_site(r)
    browser = h.launch()
    try:
        for width in h.widths:
            run_site(r, h, browser, width, "stress" if is_stress(main_root) else "site", main_through, is_stress(main_root), D)
        if stress_root is not None and Path(stress_root).resolve() != Path(main_root).resolve():
            for width in [w for w in h.widths if w >= 768] or h.widths[:1]:
                run_site(r, h, browser, width, "stress", stress_root, True, D)
    finally:
        h.close_browser(browser)
    return r.out
