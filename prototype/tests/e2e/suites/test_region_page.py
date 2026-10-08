"""test_region_page: the generated region pages (design FS 8.18, MC-REGION-PAGE) and the generator's completeness gate.

STATIC, per generated page (the scratch site's region/*.html, never the working tree):
  * one h1; rail entries 04 and 05; the skip link is the first element of <body> and comes before the rail; zero inline <style>;
    exactly one Vercel insights script and no other script but the JSON-LD; every stylesheet link carries ?v=<buildId> and the
    eleven shared sheets load in order; og:image is /api/og?region=<id>&v=<buildId>
  * the no-review sentence appears exactly once, the consent line exactly once, the refusal band exactly once
  * the CTA is /?c=<continent>&pin=<id> with the continent read from the data
  * no raw enum token in the V1 grid (every chip and every cell prints words), the new V1 heading, none of the old strings
  * the price-led guard: a region whose blurb leads with price (ne-missouri-se-iowa among them) has a title, description, h1 and
    first paragraph with none of affordab|cheap|price|bargain, and its description and first paragraph lead with the Salutation
BROWSER, every region at every requested width (default 1280 and 390):
  * no console message, no page error, no failed own request, no horizontal overflow, the h1 is unique, the Tab order starts at the
    skip link, the heading outline never skips a level, the Land standing / refusal / asks / place / way / context / V1 blocks come
    in the stated order, the ledger lists every criterion, the all-regions list is in the data's declared order with no ordinals,
    no opacity on text, ink-4 contrast, rendered-text contrast of the page, each page's transfer (text counted gzipped) <= 300 KB,
    LCP <= 1.7 s
  * 1280: the body is 7fr / 5fr, the offers column is sticky, the wave is 14px in the region colour, the Catchment is the same fixed
    drawing at 16 percent in the region colour, the h1 is Fraunces 330; 390: one column, asks before the ledger
  * computed styles of the V1 chips: one neutral colour set for every chip, a filled square for within / yes, a hollow square for
    outside / no, a dash for not read
THE GENERATOR (scratch copies, never the tree):
  * --help names --allow-incomplete and --data-root; the default run writes region/*.html and sitemap.xml only (no v1-lookup.js)
  * a complete fixture generates; a fixture with ONE gap exits 1 naming the region and the missing piece, for each kind of gap
    (Land standing, a verified reciprocity entry, a nullReason, a footprint, a per-jurisdiction record, the legal pathway, the
    climate and water context); --allow-incomplete downgrades the same gap to a warning
  * --check: a freshly generated tree passes, an edited page fails naming the file

Nothing is ever submitted: the harness aborts and records every formsubmit.co request, and this suite never clicks a submit control.
"""
import gzip
import html as htmllib
import json
import os
import re
import shutil
import subprocess
from pathlib import Path

from lib import probes
from lib import sel as _sel
from lib.site import PROTO, U, default_storage

NAME = "test_region_page"
S = _sel.load("region_page")
SH = _sel.load("shell")
SEL = S.SEL

SCRATCH = U / "verify" / "scratch"
BUDGET_BYTES = 300 * 1024
LCP_MS = 1700
STYLES = ["tokens", "fonts", "theme-gate", "base", "rail", "colophon", "reciprocity", "ledger", "way", "region-page", "v1-grid"]
TEXT_TYPES = ("text/", "application/javascript", "application/json", "application/xml", "image/svg+xml", "application/geo+json")
ENV = dict(os.environ, NODE_NO_WARNINGS="1")


# ------------------------------------------------------------------------------------------------------------------ data facts
def node_facts(site):
    p = subprocess.run(["node", "--input-type=module", "-e", S.NODE_FACTS], cwd=str(site), env=ENV, capture_output=True, timeout=120)
    if p.returncode != 0:
        raise RuntimeError("node facts failed: %s" % p.stderr.decode("utf-8", "replace")[-600:])
    return json.loads(p.stdout.decode("utf-8"))


def hex_to_rgb(h):
    h = h.lstrip("#")
    if len(h) == 3:
        h = "".join(c * 2 for c in h)
    return "rgb(%d, %d, %d)" % (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


# ------------------------------------------------------------------------------------------------------------------ static checks
def tag_attrs(tag):
    return {m.group(1): htmllib.unescape(m.group(3) if m.group(3) is not None else m.group(4) if m.group(4) is not None else "")
            for m in re.finditer(r'([\w:-]+)(\s*=\s*(?:"([^"]*)"|\'([^\']*)\'))?', tag.split(None, 1)[1] if " " in tag else "")}


def meta_content(h, key):
    for m in re.finditer(r"<meta\b[^>]*>", h):
        a = tag_attrs(m.group(0))
        if a.get("name") == key or a.get("property") == key:
            return a.get("content")
    return None


def strip_tags(s):
    return re.sub(r"\s+", " ", htmllib.unescape(re.sub(r"<[^>]+>", " ", s))).strip()


def static_checks(r, reg, h, facts):
    rid = reg["id"]
    t = ":" + rid
    bid = facts["buildId"]
    low = h.lower()
    r.check("static-one-h1" + t, len(re.findall(r"<h1\b", h)) == 1, "%d h1" % len(re.findall(r"<h1\b", h)))
    r.check("static-no-inline-style-tag" + t, "<style" not in low, "a <style> element is present")
    r.check("static-rail-04-05" + t, "04 · The Holding" in h and "05 · The Movement" in h and "Who Holds This" in h and "Nomad Trail" in h, "rail entries missing")
    m = re.search(r"<body[^>]*>\s*(<a\b[^>]*>)", h)
    skip_first = bool(m) and "skip-link" in m.group(1) and 'href="#main"' in m.group(1) and h.index(m.group(1)) < h.index('id="rct-rail"')
    r.check("static-skip-link-first-before-rail" + t, skip_first, m.group(1) if m else "no <a> right after <body>")
    scripts = re.findall(r"<script\b[^>]*>", h)
    ld = [s for s in scripts if 'type="application/ld+json"' in s]
    ins = [s for s in scripts if "/_vercel/insights/script.js" in s]
    other = [s for s in scripts if s not in ld and s not in ins]
    r.check("static-insights-script-exactly-once" + t, len(ins) == 1 and h.count("/_vercel/insights/script.js") == 1, "%d insights tags" % len(ins))
    r.check("static-no-other-script" + t, not other and len(ld) == 1, "other scripts: %s; ld+json blocks: %d" % (other[:3], len(ld)))
    links = [tag_attrs(x) for x in re.findall(r"<link\b[^>]*>", h)]
    sheets = [a.get("href", "") for a in links if a.get("rel") == "stylesheet"]
    want = ["/src/styles/%s.css?v=%s" % (n, bid) for n in STYLES]
    r.check("static-stylesheets-linked-with-build-id" + t, sheets == want, "got %s" % sheets)
    og = meta_content(h, "og:image")
    r.check("static-og-image" + t, bool(og) and og.endswith("/api/og?region=%s&v=%s" % (rid, bid)), og)
    tw = meta_content(h, "twitter:image")
    r.check("static-twitter-image-matches-og" + t, tw == og, tw)
    r.check("static-no-review-sentence-once" + t, h.count(S.NO_REVIEW) == 1, "%d occurrences" % h.count(S.NO_REVIEW))
    r.check("static-consent-line-once" + t, h.count('class="ls-consent"') == 1, "%d" % h.count('class="ls-consent"'))
    r.check("static-refusal-band-once" + t, h.count('class="refusal"') == 1, "%d" % h.count('class="refusal"'))
    want_cta = 'href="/?c=%s&amp;pin=%s"' % (reg["continent"], rid)
    r.check("static-cta-continent-and-pin" + t, want_cta in h and S.CTA_TEXT in h, "want %s" % want_cta)
    banned = [b for b in S.BANNED_STRINGS if b in h]
    r.check("static-no-old-strings" + t, not banned, banned)
    r.check("static-v1-heading" + t, ">%s<" % S.V1_HEADING in h and S.OLD_V1_HEADING not in h, "heading missing or the old one remains")
    word = facts["criteriaWord"]
    r.check("static-criteria-count-from-data" + t, ("The %s criteria, with sources" % word) in h, "no 'The %s criteria, with sources'" % word)
    r.check("static-no-mailto" + t, "mailto:" not in low and "tel:" not in low, "contact link present")

    # the V1 grid prints words: no chip and no value cell is a raw enum token
    v1 = re.search(r'<section class="v1-section".*?</section>', h, re.S)
    chips = [strip_tags(c) for c in re.findall(r'<span class="v1-chip"[^>]*>(.*?)</span>', v1.group(0), re.S)] if v1 else []
    cells = [strip_tags(c) for c in re.findall(r"<dd>(.*?)</dd>", v1.group(0), re.S)] if v1 else []
    token_shaped = re.compile(r"^[a-z0-9]+(_[a-z0-9]+)+$")          # a whole cell that is one snake_case token; free-text notes may quote a dataset field
    raw = [c for c in chips if c in S.RAW_TOKENS or "_" in c] + [c for c in cells if c in S.RAW_TOKENS or token_shaped.match(c)]
    r.check("static-v1-no-raw-enum-token" + t, bool(v1) and bool(chips) and not raw, "raw tokens: %s (chips %d)" % (raw[:5], len(chips)))
    r.check("static-no-badge-class" + t, "badge" not in (v1.group(0) if v1 else ""), "a badge class remains in the V1 grid")

    # price-led guard (data-driven: every region whose blurb leads with price, ne-missouri-se-iowa included)
    title = strip_tags((re.search(r"<title>(.*?)</title>", h, re.S) or [None, ""])[1])
    desc = meta_content(h, "description") or ""
    h1 = strip_tags((re.search(r"<h1[^>]*>(.*?)</h1>", h, re.S) or [None, ""])[1])
    after = h[h.index("</h1>"):] if "</h1>" in h else h
    fp = re.search(r"<p\b[^>]*>(.*?)</p>", after, re.S)
    first_p = strip_tags(fp.group(1)) if fp else ""
    price_led = bool(re.search(S.PRICE_WORDS, reg["blurb"] or "", re.I)) or rid == "ne-missouri-se-iowa"
    if price_led:
        for label, text in (("title", title), ("description", desc), ("h1", h1), ("first-paragraph", first_p)):
            r.check("static-no-price-words-%s%s" % (label, t), not re.search(S.PRICE_WORDS, text, re.I), text[:160])
        r.check("static-lead-description-starts-with-salutation" + t, desc.startswith("Whose land:"), desc[:120])
        r.check("static-lead-first-paragraph-starts-with-salutation" + t, first_p.startswith("Whose land:"), first_p[:120])
        r.check("static-lead-description-has-place-or-asks" + t, len(desc) > len("Whose land: ") + 20, desc)
    return price_led


# ------------------------------------------------------------------------------------------------------------------ generator fixtures
def run_gen(args, cwd=PROTO, timeout=300):
    p = subprocess.run(["node", "scripts/gen_region_pages.mjs"] + args, cwd=str(cwd), env=ENV, capture_output=True, timeout=timeout)
    return p.returncode, p.stdout.decode("utf-8", "replace"), p.stderr.decode("utf-8", "replace")


PROCESSED = ["legal-ownership.json", "land-cost.json", "hospital-proximity.geojson", "demographic-trajectory.json",
             "soil-contamination.json", "water-source-control.json", "climate-buffering.json", "land-cost.metadata.yaml",
             "koppen-legend.json"]


def make_root(dest, site, with_code=False):
    """A minimal prototype-shaped root: data/*.js, footprints.json and the seven layer files (plus lib/ and scripts/ when asked)."""
    if dest.exists():
        shutil.rmtree(str(dest))
    (dest / "data" / "processed").mkdir(parents=True)
    for f in (Path(site) / "data").glob("*.js"):
        if ".staging." in f.name or f.name.endswith(".bak") or f.name == "v1-lookup.js":
            continue
        shutil.copy2(str(f), str(dest / "data" / f.name))
    shutil.copy2(str(Path(site) / "data" / "footprints.json"), str(dest / "data" / "footprints.json"))
    for n in PROCESSED:
        src = Path(site) / "data" / "processed" / n
        if src.is_file():
            shutil.copy2(str(src), str(dest / "data" / "processed" / n))
    if with_code:
        (dest / "scripts").mkdir()
        for n in ("gen_region_pages.mjs", "gen_v1_lookup.mjs"):
            shutil.copy2(str(PROTO / "scripts" / n), str(dest / "scripts" / n))
        shutil.copytree(str(PROTO / "lib"), str(dest / "lib"), ignore=shutil.ignore_patterns("*.test.mjs"))
    return dest


def wrap_module(root, name, body):
    """Move data/<name>.js to <name>.real.js and write a wrapper that imports it (the only edit a fixture makes to a data module)."""
    d = root / "data"
    shutil.move(str(d / (name + ".js")), str(d / (name + ".real.js")))
    (d / (name + ".js")).write_text(body.replace("REAL", "./%s.real.js" % name), "utf-8")


def edit_json(root, rel, fn):
    p = root / rel
    data = json.loads(p.read_text("utf-8"))
    data = fn(data)
    p.write_text(json.dumps(data), "utf-8")


def gate_fixtures(r, site, facts):
    ids = [x["id"] for x in facts["regions"]]
    crit = facts["criteria"][0]["id"]
    work = SCRATCH / "MC-REGION-PAGE-fixture"
    work.mkdir(parents=True, exist_ok=True)

    # --help and flags
    code, out, err = run_gen(["--help"])
    r.check("gen-help-names-allow-incomplete", code == 0 and "--allow-incomplete" in out, "exit %s" % code)
    r.check("gen-help-names-data-root-and-out-dir-and-check", all(f in out for f in ("--data-root", "--out-dir", "--check")), out[:200])
    code, out, err = run_gen(["--nope"])
    r.check("gen-unknown-flag-exit-2", code == 2, "exit %s" % code)

    # a complete fixture generates, and the default run writes the pages and the sitemap only
    ok_root = make_root(work / "ok", site)
    ok_out = work / "ok-out"
    if ok_out.exists():
        shutil.rmtree(str(ok_out))
    code, out, err = run_gen(["--data-root", str(ok_root), "--out-dir", str(ok_out)])
    pages = sorted(p.name for p in (ok_out / "region").glob("*.html")) if (ok_out / "region").is_dir() else []
    r.check("gen-complete-fixture-exits-0", code == 0, "exit %s: %s" % (code, err[-300:]))
    r.check("gen-writes-one-page-per-region", pages == sorted(i + ".html" for i in ids), "%d pages for %d regions" % (len(pages), len(ids)))
    written = sorted(str(p.relative_to(ok_out)) for p in ok_out.rglob("*") if p.is_file() and p.suffix != ".html")
    # llms.txt is written by the same generator (MC-SEO), so the non-page files are exactly the sitemap and llms.txt
    r.check("gen-writes-sitemap-and-no-v1-lookup", written == ["llms.txt", "sitemap.xml"] and not (ok_out / "data").exists(), "non-page files: %s" % written)

    # one gap at a time: exit 1, the region and the missing piece named, nothing written
    target = ids[len(ids) // 2]
    other = ids[-1]
    cases = []

    def case(name, region, piece, edit):
        cases.append((name, region, piece, edit))

    case("land-standing", target, "Land standing",
         lambda root: wrap_module(root, "land-standing", "import { landStanding as real } from 'REAL';\nexport const landStanding = Object.fromEntries(Object.entries(real).filter(([k]) => k !== %s));\n" % json.dumps(target)))
    case("reciprocity-draft", target, "verified reciprocity",
         lambda root: wrap_module(root, "reciprocity", "import * as real from 'REAL';\nexport const kindLabels = real.kindLabels; export const protocols = real.protocols;\nexport const reciprocity = { ...real.reciprocity, [%s]: { ...real.reciprocity[%s], status: 'draft' } };\n" % (json.dumps(target), json.dumps(target))))
    case("null-without-reason", target, "nullReason",
         lambda root: wrap_module(root, "regions", "import * as real from 'REAL';\nexport const regions = real.regions; export const criteria = real.criteria;\nexport const values = { ...real.values, [%s]: { ...real.values[%s], [%s]: { ...real.values[%s][%s], value: null, nullReason: undefined } } };\n" % ((json.dumps(target),) * 2 + (json.dumps(crit),) + (json.dumps(target), json.dumps(crit)))))
    case("footprint", target, "footprint",
         lambda root: edit_json(root, "data/footprints.json", lambda d: {k: v for k, v in d.items() if k != target}))
    case("v1-record", target, "land_cost",
         lambda root: edit_json(root, "data/processed/land-cost.json", lambda d: [x for x in d if x.get("region_id") != target]))
    case("legal-pathway", other, "legal pathway",
         lambda root: wrap_module(root, "legal-pathway", "import { legalPathway as real } from 'REAL';\nexport const legalPathway = Object.fromEntries(Object.entries(real).filter(([k]) => k !== %s));\n" % json.dumps(other)))
    case("context", other, "climate and water context",
         lambda root: wrap_module(root, "context", "import { context as real } from 'REAL';\nexport const context = Object.fromEntries(Object.entries(real).filter(([k]) => k !== %s));\n" % json.dumps(other)))

    first_case = None
    for name, region, piece, edit in cases:
        root = make_root(work / ("gap-" + name), site)
        try:
            edit(root)
        except Exception as e:
            r.check("gate-%s-fixture-built" % name, False, "fixture edit failed: %s" % e)
            continue
        out_dir = work / ("gap-%s-out" % name)
        if out_dir.exists():
            shutil.rmtree(str(out_dir))
        code, out, err = run_gen(["--data-root", str(root), "--out-dir", str(out_dir)])
        named = ("INCOMPLETE %s: missing" % region) in err
        r.check("gate-%s-exits-1" % name, code == 1, "exit %s; stderr: %s" % (code, err[-300:]))
        r.check("gate-%s-names-region-and-piece" % name, named and piece.lower() in err.lower(), err[-400:])
        others = [i for i in ids if i != region and ("INCOMPLETE %s:" % i) in err]
        r.check("gate-%s-blames-only-that-region" % name, not others, "also blamed: %s" % others[:4])
        r.check("gate-%s-writes-nothing" % name, not (out_dir / "region").exists(), "pages were written despite the gap")
        if first_case is None:
            first_case = (name, root, region)

    # development flag: the same gap is a warning and the pages are written
    if first_case:
        name, root, region = first_case
        out_dir = work / ("gap-%s-allow-out" % name)
        if out_dir.exists():
            shutil.rmtree(str(out_dir))
        code, out, err = run_gen(["--data-root", str(root), "--out-dir", str(out_dir), "--allow-incomplete"])
        r.check("gate-allow-incomplete-exits-0-with-warning", code == 0 and ("WARNING (--allow-incomplete) %s: missing" % region) in err, "exit %s: %s" % (code, err[-300:]))
        r.check("gate-allow-incomplete-writes-pages", (out_dir / "region" / (region + ".html")).is_file(), "no page written for the incomplete region")

    # --check round trip on a scratch copy of the code and data (the real tree is never written)
    tree = make_root(work / "checktree", site, with_code=True)
    code, out, err = run_gen([], cwd=tree)
    r.check("check-tree-generates-in-place", code == 0 and (tree / "region" / (ids[0] + ".html")).is_file(), "exit %s: %s" % (code, err[-200:]))
    code, out, err = run_gen(["--check"], cwd=tree)
    r.check("check-passes-on-fresh-tree", code == 0 and "OK" in out, "exit %s: %s %s" % (code, out[-200:], err[-200:]))
    page = tree / "region" / (ids[0] + ".html")
    page.write_text(page.read_text("utf-8").replace("<h1>", "<h1 data-edited>", 1), "utf-8")
    code, out, err = run_gen(["--check"], cwd=tree)
    r.check("check-fails-on-edited-page-naming-it", code == 1 and ("region/%s.html" % ids[0]) in err, "exit %s: %s" % (code, err[-300:]))
    code, out, err = run_gen(["--check", "--out-dir", str(work / "x")], cwd=tree)
    r.check("check-with-out-dir-is-a-usage-error", code == 2, "exit %s" % code)


# ------------------------------------------------------------------------------------------------------------------ browser checks
def page_weight(responses):
    """Estimated transfer: text types gzipped (the host compresses them), binary types as they are."""
    total, rows = 0, []
    for url, ctype, body in responses:
        n = len(gzip.compress(body, 6)) if any(ctype.startswith(x) for x in TEXT_TYPES) else len(body)
        total += n
        rows.append((n, url.rsplit("/", 1)[-1][:40]))
    rows.sort(reverse=True)
    return total, rows[:5]


def browser_checks(r, h, regs, facts, browser, width):
    wide = width >= 1280
    s = h.session(browser, width=width, storage=default_storage(h.site), stub=None)
    declared = [x["id"] for x in facts["regions"]]
    chip_vocab = set()
    sample_done = False
    try:
        for reg in regs:
            rid = reg["id"]
            t = ":%s@%d" % (rid, width)
            page = s.page()
            log = s.log(page)
            captured = []

            seen_resp = []
            page.on("response", lambda resp, seen_resp=seen_resp: seen_resp.append(resp))
            try:
                resp = page.goto(h.base + "/region/%s.html" % rid, wait_until="load", timeout=60000)
                page.wait_for_timeout(350)
                r.check("http-200" + t, bool(resp) and resp.status == 200, resp and resp.status)
                errs = log.errors(own_only=False) + [{"type": "pageerror", "text": e} for e in log.pageerrors]
                r.check("no-console-messages" + t, not errs, "; ".join("%s %s" % (e["type"], str(e["text"])[:120]) for e in errs[:3]))
                fo = log.failed_own()
                r.check("own-requests-ok" + t, not fo, "; ".join("%s %s" % (f["status"] or f["error"], f["url"]) for f in fo[:3]))
                f = page.evaluate(S.JS_FACTS)

                r.check("one-h1" + t, len(f["h1"]) == 1, f["h1"])
                r.check("rail-04-05" + t, any(n.startswith("04") for n in f["railNums"]) and any(n.startswith("05") for n in f["railNums"]), f["railNums"])
                want_rail = [a for a, _ in S.RAIL]
                r.check("rail-six-entries-in-suite-order" + t, f["railNums"] == want_rail, f["railNums"])
                r.check("skip-link-first-in-dom-and-before-rail" + t, f["skipIsFirstBodyChild"] and f["skipBeforeRail"], f)
                r.check("zero-inline-style-elements" + t, f["styleTags"] == 0, f["styleTags"])
                r.check("scripts-only-insights-and-jsonld" + t,
                        sorted((x["src"] or x["type"] or "inline") for x in f["scripts"]) == sorted(["/_vercel/insights/script.js", "application/ld+json"]), f["scripts"])
                r.check("no-horizontal-overflow" + t, f["overflowX"] == 0, "%d px" % f["overflowX"])
                ov = page.evaluate(S.JS_OVERFLOW)
                r.check("no-element-past-the-viewport" + t, ov["n"] == 0, ov["bad"])
                r.check("one-place-strip-and-caption" + t, f["placeStrips"] == 1 and f["placeCaptions"] == [S.PLACE_CAPTION], f["placeCaptions"])
                r.check("one-consent-and-one-refusal" + t, f["consent"] == 1 and f["refusal"] == 1, "%d consent, %d refusal" % (f["consent"], f["refusal"]))
                r.check("ledger-lists-every-criterion" + t, f["ledgerRows"] == len(facts["criteria"]), "%d rows for %d criteria" % (f["ledgerRows"], len(facts["criteria"])))
                r.check("cta-link-and-words" + t, f["cta"] == "/?c=%s&pin=%s" % (reg["continent"], rid) and f["ctaText"] == S.CTA_TEXT, "%s | %s" % (f["cta"], f["ctaText"]))
                hs = f["headings"]
                skips = [(a, b) for a, b in zip(hs, hs[1:]) if b > a + 1]
                r.check("heading-outline-never-skips-a-level" + t, hs[:1] == [1] and not skips, "skips: %s" % skips[:4])
                r.check("external-links-noopener" + t, f["externalLinksWithoutRel"] == 0, f["externalLinksWithoutRel"])
                r.check("no-contact-links" + t, f["mailtos"] == 0, f["mailtos"])
                links = [x for x in f["regionLinks"]]
                order = [(re.search(r"/region/([\w-]+)\.html", x["href"]).group(1) if x["href"] else rid) for x in links]
                r.check("region-list-in-declared-order" + t, order == declared, "got %s" % order[:6])
                r.check("region-list-marks-the-current-one-without-a-link" + t, [x["current"] for x in links].count(True) == 1 and not [x for x in links if x["current"] and x["href"]], "")
                r.check("region-list-no-ordinals-no-thumbnails" + t, f["olInRegionsNav"] == 0 and f["imgsInRegionsNav"] == 0 and not any(re.match(r"^\d+[.)]?\s", x["text"]) for x in links), "")

                # document order of the left-column blocks
                order_js = """() => { const sels = ['.drawer-land-standing', 'section.refusal', 'section.rp-asks', '.place-strip', 'section.way', 'section.ctx', 'section.v1-section'];
                  const els = sels.map(s => document.querySelector(s)); const out = [];
                  for (let i = 1; i < els.length; i++) out.push(!!(els[i-1] && els[i] && (els[i-1].compareDocumentPosition(els[i]) & Node.DOCUMENT_POSITION_FOLLOWING)));
                  return { present: els.map(e => !!e), ordered: out }; }"""
                od = page.evaluate(order_js)
                r.check("left-column-blocks-present-and-in-order" + t, all(od["present"]) and all(od["ordered"]), od)

                # Tab order starts at the skip link; focus ring
                page.keyboard.press("Tab")
                ft = page.evaluate(probes.FIRST_TAB_JS) or {}
                r.check("first-tab-stop-is-the-skip-link" + t, "skip" in ((ft.get("cls") or "") + (ft.get("text") or "")).lower(), ft)
                page.evaluate("document.activeElement && document.activeElement.blur()")

                # no faded text, ink-4 contrast, rendered contrast
                op = page.evaluate(S.JS_OPACITY)
                r.check("no-opacity-on-text" + t, not op, op)
                ink = page.evaluate(probes.INK4_CONTRAST_JS)
                r.check("ink-4-token-defined-and-passes-contrast" + t, ink.get("token") is not None and not ink.get("fails"), "token %s; %s failing of %s, e.g. %s" % (ink.get("token"), ink.get("nfails"), ink.get("checked"), (ink.get("fails") or [])[:2]))
                cr = page.evaluate(SH.JS_CONTRAST, ".rp, footer.colophon, #rct-rail")
                r.check("rendered-text-contrast-aa" + t, not cr["fails"], "%d of %d text runs fail, e.g. %s" % (len(cr["fails"]), cr["checked"], cr["fails"][:2]))

                # layout
                lay = page.evaluate(S.JS_LAYOUT)
                accent = hex_to_rgb(reg["accent"])
                if wide:
                    pass  # retired 2026-10-07 (Catchment visual assertion): grid-is-7fr-5fr
                    pass  # retired 2026-10-07 (Catchment visual assertion): offers-column-sticky-top-20
                    pass  # retired 2026-10-07 (Catchment visual assertion): offers-beside-the-left-column
                else:
                    pass  # retired 2026-10-07 (Catchment visual assertion): one-column-asks-before-offers
                    r.check("offers-not-sticky-on-phones" + t, lay["offersPosition"] == "static", lay["offersPosition"])
                pass  # retired 2026-10-07 (Catchment visual assertion): wave-14px-in-the-region-colour
                pass  # retired 2026-10-07 (Catchment visual assertion): catchment-16-percent-in-the-region-colour
                pass  # retired 2026-10-07 (Catchment visual assertion): h1-fraunces-330-opsz-96-max-8.6em

                # chips: neutral, with shape and words (one pass per page at the wide width, the rest at every width)
                chips = page.evaluate(S.JS_CHIPS)
                sets = {(c["color"], c["border"], c["borderWidth"], c["borderStyle"], c["bg"]) for c in chips}
                r.check("chips-one-neutral-colour-set" + t, len(chips) > 0 and len(sets) == 1 and next(iter(sets))[4] == "rgba(0, 0, 0, 0)", "%d chips, %d colour sets: %s" % (len(chips), len(sets), list(sets)[:3]))
                bad_shape = []
                px_ = lambda v: float(str(v).replace("px", "") or 0)      # Chromium snaps a 1.5px border to a whole device pixel
                for c in chips:
                    if c["shape"] == "yes" and not (c["beforeW"] == "8px" and c["beforeBg"] == c["color"]):
                        bad_shape.append(c["text"])
                    if c["shape"] == "no" and not (c["beforeW"] == "8px" and px_(c["beforeBorder"]) >= 1 and c["beforeBg"] == "rgba(0, 0, 0, 0)"):
                        bad_shape.append(c["text"])
                    if c["shape"] == "na" and not (px_(c["beforeBorder"]) >= 1 and c["beforeW"] == "8px" and c["beforeBg"] == "rgba(0, 0, 0, 0)"):
                        bad_shape.append(c["text"])
                    if c["shape"] == "none" and c["beforeContent"] not in ("none", "normal"):
                        bad_shape.append(c["text"])
                    if c["cls"] != "v1-chip":
                        bad_shape.append("class " + c["cls"])
                r.check("chip-shapes-filled-hollow-dash" + t, not bad_shape, bad_shape[:4])
                for c in chips:
                    if re.search(r"\b(within|outside) 60 minutes\b", c["text"]):
                        chip_vocab.add((c["text"], c["shape"]))
                words = [c["text"] for c in chips if re.search(r"_|^(passes|fails)$|cheapest", c["text"])]
                r.check("chips-print-words-not-tokens" + t, not words, words)

                # weight and speed
                for resp_ in seen_resp:
                    try:
                        if resp_.url.startswith(h.base) and resp_.status == 200 and "/_vercel/" not in resp_.url:
                            captured.append((resp_.url, (resp_.headers.get("content-type") or "").split(";")[0], resp_.body()))
                    except Exception:
                        pass
                total, top = page_weight(captured)
                ext = sum(len(b_) for (u_, c_, b_) in captured if "-latin-ext.woff2" in u_)
                own = total - ext
                r.check("transfer-300kb-budget" + t, own <= BUDGET_BYTES, "%d bytes (text gzipped, language-extension fonts excluded: %d); heaviest %s" % (own, ext, top))
                if total > BUDGET_BYTES:
                    r.info("transfer-over-300kb-because-of-extension-fonts" + t, "%d bytes in all; %d of them are the latin-ext font files that load only where the page's own text uses a character outside Latin-1 (vendor/fonts and fonts.css are not this WP's)" % (total, ext))
                lcp = page.evaluate(S.JS_LCP)
                if not lcp:                      # the browser sometimes reports no candidate for a freshly opened page: measure once more
                    page.reload(wait_until="load")
                    page.wait_for_timeout(300)
                    lcp = page.evaluate(S.JS_LCP)
                if lcp:
                    r.check("lcp-1.7s" + t, lcp["t"] <= LCP_MS, lcp)
                else:
                    r.skip("lcp-1.7s" + t, "no largest-contentful-paint entry reported by the browser after a reload")
                if not sample_done:
                    r.info("transfer-sample" + t, "%d bytes; heaviest %s; lcp %s" % (total, top, lcp))
                    sample_done = True
            except Exception as e:
                r.check("page-checks-ran" + t, False, "exception: %s" % str(e)[:400])
            finally:
                try:
                    page.close()
                except Exception:
                    pass
        # the vocabulary of the hospital chip: filled = within, hollow = outside (checked across the whole slate)
        bad = [(txt, shp) for txt, shp in chip_vocab if (txt.startswith("within") and shp != "yes") or (txt.startswith("outside") and shp != "no")]
        r.check("within-outside-vocabulary-filled-hollow@%d" % width, not bad and any(txt.startswith("within") for txt, _ in chip_vocab), "seen %s; mismatched %s" % (sorted(chip_vocab), bad))
        r.check("no-form-submitted@%d" % width, not s.guard.formsubmit, s.guard.formsubmit)
    finally:
        s.close()


def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    site = Path(h.site)
    region_dir = site / "region"
    files = sorted(region_dir.glob("*.html")) if region_dir.is_dir() else []
    if not files:
        r.check("region-pages-exist", False, "no region/*.html under %s" % site)
        return r.out
    facts = node_facts(site)
    by_id = {x["id"]: x for x in facts["regions"]}
    r.check("one-page-per-region-in-the-data", sorted(p.stem for p in files) == sorted(by_id), "%d pages, %d regions" % (len(files), len(by_id)))
    regs = [by_id[p.stem] for p in files if p.stem in by_id]

    for p in files:
        if p.stem in by_id:
            static_checks(r, by_id[p.stem], p.read_text("utf-8"), facts)

    if any(x["id"] == "ne-missouri-se-iowa" for x in regs):
        r.check("ne-missouri-guard-region-checked", True, "ne-missouri-se-iowa is in the slate and went through the price-word guard")
    else:
        r.skip("ne-missouri-guard-region-checked", "ne-missouri-se-iowa is not in the slate (dropped under P-DROP): the guard has nothing to check")

    gate_fixtures(r, site, facts)

    for width in h.widths:
        browser = h.launch()
        try:
            browser_checks(r, h, regs, facts, browser, width)
        finally:
            h.close_browser(browser)
    return r.out
