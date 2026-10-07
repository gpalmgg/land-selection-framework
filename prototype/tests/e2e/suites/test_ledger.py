"""test_ledger: the drawer's criteria ledger, the compact way in, and the compact climate and water context (MC-LEDGER).

  * for three regions the drawer shows one ledger line per criterion (the count comes from the data), each with a source link,
    the cell's vintage and its licence text ("licence not confirmed" is acceptable and explicit); the value is as stored
  * a fixture cell with value null renders the gap row (li.gap, dashed leader, "not yet verified", the reason) and never the
    word "null"; small values keep their digits (0.08), negatives use U+2212, integers are grouped; a trajectory chip carries
    an inline SVG icon and words, a not-available trajectory is a sentence and never an empty chip
  * no score, rank, best or top in the ledger text; no verdict words and no text arrows in a trajectory chip
  * no raw enum token or underscore is visible in the ledger, the way in or the context, tested on a region whose
    affordability band is the lowest enum ('cheapest')
  * the compact way in has exactly three rows, the not-legal-advice tag, no long not-advice sentence (that is the page version's)
    and the link "The full pathway is on the region page"; a restricted region is fully visible, not dimmed
  * the compact context has its two lines, a source line with licence, and the pointer to the region page
  * contrast: no text inside the three blocks below AA; reduced motion: nothing in them moves, with or without the preference
  * no horizontal overflow at phone width and the way in rows stack; no console error, no page error, nothing submitted

Nothing is ever submitted: the harness aborts and records every formsubmit.co request.
"""
import re

from lib import sel as _sel
from lib.site import default_storage, goto_settled

NAME = "test_ledger"
S = _sel.load("ledger")
SEL = S.SEL
ENUM_TOKEN = re.compile(r"\b[a-z]+(?:_[a-z]+)+\b")


def fresh(h, browser, width, reduced=True):
    s = h.session(browser, width=width, storage=default_storage(h.site, modal=False), stub=True, reduced_motion=reduced)
    page = s.page()
    goto_settled(page, h.base + "/", extra_ms=400)
    return s, page


def open_drawer(page, region_id):
    """Open through the bus; fall back to the card (Enter). True when the drawer is open and the ledger has rendered."""
    page.evaluate(S.JS_OPEN, region_id)
    try:
        page.wait_for_selector(SEL["ledger_row"], timeout=6000)
    except Exception:
        card = page.locator("#region-%s" % region_id)
        if card.count():
            try:
                card.focus()
                page.keyboard.press("Enter")
                page.wait_for_selector(SEL["ledger_row"], timeout=6000)
            except Exception:
                return False
    page.wait_for_timeout(400)
    return page.locator("%s.open" % SEL["drawer"]).count() > 0


def close_drawer(page):
    page.keyboard.press("Escape")
    page.wait_for_timeout(300)


def pick_regions(data):
    ids = data["regions"]
    chosen = [r for r in S.REGIONS if r in ids]
    for r in ids:
        if len(chosen) >= 3:
            break
        if r not in chosen:
            chosen.append(r)
    return chosen[:3]


def clean(r, tag, log, label):
    errs = log.errors() + [{"type": "pageerror", "text": e} for e in log.pageerrors]
    r.check("no-console-errors:%s%s" % (label, tag), not errs, "; ".join(str(e.get("text"))[:160] for e in errs[:3]))


def check_region(r, tag, rid, data, read):
    """The per-region ledger assertions."""
    n = len(data["criteria"])
    rows = read["rows"]
    r.check("ledger-opens:%s%s" % (rid, tag), read["open"] and len(rows) > 0, "open=%s rows=%d" % (read["open"], len(rows)))
    r.check("ledger-one-line-per-criterion:%s%s" % (rid, tag), len(rows) == n, "%d lines for %d criteria" % (len(rows), n))
    r.check("ledger-order-matches-criteria:%s%s" % (rid, tag), [x["criterion"] for x in rows] == [c["id"] for c in data["criteria"]],
            [x["criterion"] for x in rows])
    missing_src, missing_vin, missing_lic, bad_val = [], [], [], []
    for row in rows:
        cell = data["cells"][rid].get(row["criterion"])
        if row["gap"]:
            continue
        if not [u for u in row["links"] if u.startswith("http")]:
            missing_src.append(row["criterion"])
        if cell and cell["vintage"] and cell["vintage"] not in row["sb"]:
            missing_vin.append(row["criterion"])
        if cell and cell["licence"] not in row["sb"]:
            missing_lic.append(row["criterion"])
        if "null" in row["value"].lower() or "undefined" in row["value"].lower() or "nan" in row["value"].lower().split():
            bad_val.append(row["criterion"])
    r.check("every-line-has-a-source-link:%s%s" % (rid, tag), not missing_src, missing_src)
    r.check("every-line-has-its-vintage:%s%s" % (rid, tag), not missing_vin, missing_vin)
    r.check("every-line-has-licence-text:%s%s" % (rid, tag), not missing_lic, missing_lic)
    r.check("no-null-in-values:%s%s" % (rid, tag), not bad_val, bad_val)
    r.check("gap-rows-say-not-yet-verified:%s%s" % (rid, tag), all("not yet verified" in x["value"] for x in rows if x["gap"]),
            [x["criterion"] for x in rows if x["gap"]])
    # only a sourced trajectory shows a chip: icon plus words; never an empty chip
    chip_problems = []
    for row in rows:
        cell = data["cells"][rid].get(row["criterion"]) or {}
        sourced = cell.get("trajectory") in ("measured", "projected", "qualitative")
        if row["gap"]:
            continue
        if sourced and not (row["traj"] and row["traj"]["svg"] and row["traj"]["text"]):
            chip_problems.append("%s: sourced trajectory without icon and words" % row["criterion"])
        if not sourced and row["traj"]:
            chip_problems.append("%s: chip without a sourced trajectory" % row["criterion"])
        if row["hasEmptyTraj"]:
            chip_problems.append("%s: empty chip" % row["criterion"])
        if row["traj"] and re.search(S.VERDICT_WORDS, row["traj"]["text"], re.I):
            chip_problems.append("%s: verdict word in chip '%s'" % (row["criterion"], row["traj"]["text"]))
    r.check("trajectory-chips-only-where-sourced:%s%s" % (rid, tag), not chip_problems, chip_problems)
    text = read["ledgerText"]
    banned = re.findall(S.BANNED_WORDS, text, re.I)
    r.check("no-score-rank-best-top:%s%s" % (rid, tag), not banned, banned[:5])
    r.check("no-text-arrows:%s%s" % (rid, tag), not any(ch in text for ch in S.ARROW_CHARS), "arrow glyph in ledger text")


def check_way(r, tag, rid, read, has_entry):
    w = read["way"]
    if not has_entry:
        r.check("way-absent-without-entry:%s%s" % (rid, tag), w is None)
        return
    r.check("way-compact-present:%s%s" % (rid, tag), w is not None)
    if w is None:
        return
    r.check("way-has-three-rows:%s%s" % (rid, tag), len(w["terms"]) == 3, w["terms"])
    r.check("way-not-the-full-block:%s%s" % (rid, tag), not w["full"])
    r.check("way-tag-says-not-legal-advice:%s%s" % (rid, tag), "not legal advice" in w["tag"].lower(), w["tag"])
    r.check("way-sentence-is-the-pages:%s%s" % (rid, tag), "Check current law with a local professional" not in w["foot"], w["foot"][:160])
    r.check("way-links-to-the-region-page:%s%s" % (rid, tag),
            bool(w["more"]) and w["more"]["text"] == "The full pathway is on the region page" and ("region/%s.html" % rid) in w["more"]["href"], w["more"])
    r.check("way-direction-is-neutral-words:%s%s" % (rid, tag), bool(w["dir"]) and not re.search(S.VERDICT_WORDS, w["dir"], re.I), w["dir"])
    r.check("way-is-not-dimmed:%s%s" % (rid, tag), w["opacity"] == "1" and w["filter"] in ("none", ""), "%s / %s" % (w["opacity"], w["filter"]))
    banned = re.findall(S.BANNED_WORDS, read["wayText"], re.I)
    r.check("way-no-score-rank-best-top:%s%s" % (rid, tag), not banned, banned[:5])


def check_ctx(r, tag, rid, read, has_entry):
    c = read["ctx"]
    if not has_entry:
        r.check("context-absent-without-entry:%s%s" % (rid, tag), c is None)
        return
    r.check("context-present:%s%s" % (rid, tag), c is not None)
    if c is None:
        return
    r.check("context-has-two-lines:%s%s" % (rid, tag), len(c["rows"]) == 2, c["rows"])
    r.check("context-projection-is-labelled:%s%s" % (rid, tag), any("projection" in x for x in c["rows"]), c["rows"])
    r.check("context-source-line-has-licence:%s%s" % (rid, tag), "Sources:" in c["src"] and ("CC BY" in c["src"] or "licence not confirmed" in c["src"]), c["src"])
    r.check("context-links-to-the-region-page:%s%s" % (rid, tag), ("region/%s.html" % rid) in c["more"], c["more"])


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            # ------------------------------------------------------------- the real drawer, three regions
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                data = page.evaluate(S.JS_DATA)
                regions = pick_regions(data)
                r.info("regions" + tag, "criteria=%d regions=%s" % (len(data["criteria"]), regions))
                r.check("criteria-found" + tag, len(data["criteria"]) > 0 and len(regions) == 3, regions)
                legal = page.evaluate("async () => { const m = await import('/data/legal-pathway.js'); return Object.keys(m.legalPathway); }")
                context = page.evaluate("async () => { const m = await import('/data/context.js'); return Object.keys(m.context); }")
                for rid in regions:
                    if not open_drawer(page, rid):
                        r.check("ledger-opens:%s%s" % (rid, tag), False, "drawer did not open")
                        continue
                    read = page.evaluate(S.JS_READ, "")
                    check_region(r, tag, rid, data, read)
                    check_way(r, tag, rid, read, rid in legal)
                    check_ctx(r, tag, rid, read, rid in context)
                    if rid == regions[0]:
                        con = page.evaluate(S.JS_CONTRAST)
                        r.check("contrast-zero-failures" + tag, not con["bad"] and con["checked"] > 20, "checked %d; failing: %s" % (con["checked"], con["bad"][:4]))
                        mo = page.evaluate(S.JS_MOTION)
                        r.check("reduced-motion-nothing-moves" + tag, not mo, mo[:5])
                        ov = read["overflow"]
                        r.check("no-horizontal-overflow" + tag, ov and ov["sw"] <= ov["cw"] + 1, ov)
                        if width < 600 and read["way"]:
                            r.check("way-rows-stack-on-phones" + tag, read["way"]["cols"] == 1, "columns: %d" % read["way"]["cols"])
                        elif read["way"]:
                            r.check("way-rows-two-columns-on-desktop" + tag, read["way"]["cols"] == 2, "columns: %d" % read["way"]["cols"])
                    close_drawer(page)
                clean(r, tag, log, "drawer")
                r.check("no-formsubmit:drawer" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- no raw enum token, region with the lowest affordability band
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                cheapest = page.evaluate(S.JS_CHEAPEST)
                data = page.evaluate(S.JS_DATA)
                known = [x for x in cheapest if x in data["regions"]]
                r.info("cheapest-regions" + tag, known)
                if not known:
                    r.skip("no-enum-token-visible" + tag, "no region carries affordability band 'cheapest' in this site's V1 lookup")
                else:
                    rid = known[0]
                    ok = open_drawer(page, rid)
                    read = page.evaluate(S.JS_READ, "")
                    r.check("cheapest-region-drawer-opens:%s%s" % (rid, tag), ok and len(read["rows"]) > 0)
                    blob = " ".join([read["ledgerText"], read["wayText"], read["ctxText"]])
                    tokens = ENUM_TOKEN.findall(blob)
                    r.check("no-enum-token-visible:%s%s" % (rid, tag), not tokens and "cheapest" not in blob.lower() and "_" not in blob,
                            "tokens: %s" % tokens[:6])
                    # the label function the blocks would use for a qualitative value never returns a token
                    lab = page.evaluate("async () => { const q = await import('/lib/qual-labels.js'); return [q.qualLabel('affordability_band', 'cheapest'), q.qualLabel('affordability_band', 'very_premium'), q.qualLabel('lp_ownership_status', 'open_with_conditions'), q.qualLabel('buffering_strength', 'nonsense')]; }")
                    r.check("qual-labels-never-print-a-token" + tag, all("_" not in x and x != "cheapest" for x in lab), lab)
                clean(r, tag, log, "enum")
            finally:
                s.close()

            # ------------------------------------------------------------- fixture: gap row, number format, chips, licence fallback
            s, page = fresh(h, browser, width)
            try:
                log = s.log(page)
                fx = page.evaluate(S.JS_FIXTURE)
                rows = fx["rows"]
                r.check("fixture-five-lines" + tag, len(rows) == 5, len(rows))
                if len(rows) == 5:
                    gap, small, neg, grouped, nolic = rows
                    r.check("fixture-null-is-a-gap-row" + tag, gap["gap"], gap)
                    r.check("fixture-gap-says-not-yet-verified" + tag, "not yet verified" in gap["value"] and "not yet verified" in gap["value"].lower(), gap["value"])
                    r.check("fixture-gap-gives-the-reason" + tag, "Count being re-verified" in gap["sb"], gap["sb"])
                    r.check("fixture-gap-never-says-null" + tag, not re.search(r"\bnull\b", fx["all"], re.I), fx["all"][:200])
                    r.check("fixture-gap-leader-is-dashed" + tag, gap["leaderStyle"] == "dashed", gap["leaderStyle"])
                    r.check("fixture-gap-value-is-italic" + tag, gap["vvStyle"] == "italic", gap["vvStyle"])
                    r.check("fixture-ordinary-leader-is-dotted" + tag, small["leaderStyle"] == "dotted", small["leaderStyle"])
                    r.check("fixture-small-value-keeps-its-digits" + tag, small["value"].startswith("0.08"), small["value"])
                    r.check("fixture-negative-uses-true-minus" + tag, neg["value"].startswith("−8"), neg["value"])
                    r.check("fixture-integers-are-grouped" + tag, grouped["value"].startswith("1,150"), grouped["value"])
                    r.check("fixture-chip-has-icon-and-words" + tag, neg["hasTraj"] and neg["trajSvg"] and "falling" in neg["sb"], neg["sb"])
                    r.check("fixture-not-available-is-a-sentence-not-a-chip" + tag, (not grouped["hasTraj"]) and "No open trend dataset" in grouped["trajNa"], grouped["trajNa"])
                    r.check("fixture-no-licence-says-so" + tag, "licence not confirmed" in nolic["sb"], nolic["sb"])
                    r.check("fixture-licence-from-the-criterion" + tag, "CC BY 4.0" in small["sb"], small["sb"])
                clean(r, tag, log, "fixture")
                r.check("no-formsubmit:fixture" + tag, not s.guard.formsubmit)
            finally:
                s.close()

            # ------------------------------------------------------------- motion also off the preference: the blocks have none at all
            s, page = fresh(h, browser, width, reduced=False)
            try:
                data = page.evaluate(S.JS_DATA)
                rid = pick_regions(data)[0]
                if open_drawer(page, rid):
                    page.wait_for_timeout(600)
                    mo = page.evaluate(S.JS_MOTION)
                    r.check("no-motion-in-the-blocks-without-the-preference" + tag, not mo, mo[:5])
                else:
                    r.check("no-motion-in-the-blocks-without-the-preference" + tag, False, "drawer did not open")
            finally:
                s.close()
        finally:
            h.close_browser(browser)

    # ----------------------------------------------------------------- the stylesheets themselves
    for f in ("ledger.css", "way.css"):
        p = h.site / "src" / "styles" / f
        txt = p.read_text(encoding="utf-8") if p.is_file() else ""
        r.check("stylesheet-shipped:%s" % f, bool(txt), str(p))
        r.check("stylesheet-has-no-ev-alias:%s" % f, ".ev-" not in txt)
        r.check("stylesheet-has-no-hardcoded-colour:%s" % f, not re.search(r"#[0-9a-fA-F]{3,8}\b|rgba?\(", txt), "colours must be tokens")
    return r.out
