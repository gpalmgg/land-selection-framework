"""test_seo: what a crawler and an AI engine read (MC-SEO, 2026-10): structured data, meta, sitemap, llms.txt, robots, internal links.

Everything is checked on the SCRATCH site the harness serves (built by tools/scratch_site.py), never on the working tree. Static,
no browser: the HTML is read as a crawler reads it (files and fetched responses), not as the DOM.

PER PAGE of the scratch site's sitemap.xml that exists on disk (home, deeper, arrive, host, terms-of-arrival, every region page):
  * exactly one /_vercel/insights/script.js tag (asserted IN THE HTML: the harness allow-lists the script's 404 on a static server,
    so a missing tag would otherwise go unseen), exactly one <h1>, exactly one canonical equal to the sitemap URL
  * every JSON-LD block parses; a recursive walk finds no licence / rating key, no email shape, and none of the words best, top,
    rank, score outside the unit "score"
  * no "vercel.app" string
  * the meta description is at most 160 characters (pages this WP generates: home and regions; hand-authored pages are reported as info)
REGION PAGES: one @graph of a Place (geo, address country, isPartOf the WebSite, about, ecoregion and watershed properties), a
  BreadcrumbList and a Dataset (a reading of <region>: one PropertyValue per criterion that has a number, null cells omitted, with
  unit, source and window label; isBasedOn; creator = the working group with Askja as originator; free to access); title is
  "<name>, <country> - <site name>"; description starts "Whose land:"; og:image carries &v=<buildId>; links to arrive?region=<id>,
  host, deeper.html#methodology and every other region.
HOME: WebSite + one Dataset + an UNORDERED ItemList of every region page (no position keys); og:image carries ?v=<buildId>; the
  region links reach every region page in the fetched HTML (no JavaScript) once index.html carries <!--s:regionlinks-->; until then
  the marker's own output is proven on a copy.
SITEMAP: URL set = home + deeper + the optional pages that exist + the files under region/; lastmod = buildDate on every entry.
LLMS.TXT: lists every region with its URL, carries the canon descriptor and stance, the licence section, "what this is not" and how to
  cite; generated output is deterministic and --check covers it (fresh tree passes, an edited llms.txt fails naming it).
ROBOTS.TXT: allows all, points at the sitemap on the canonical origin.
"""
import html as htmllib
import json
import os
import re
import shutil
import subprocess
import urllib.request
import urllib.error
from pathlib import Path

from lib.site import PROTO, U

NAME = "test_seo"
SCRATCH = U / "verify" / "scratch"
ENV = dict(os.environ, NODE_NO_WARNINGS="1")
INSIGHTS = "/_vercel/insights/script.js"

FORBIDDEN_KEYS = {"license", "licence", "aggregaterating", "ratingvalue", "rating", "review", "reviewrating", "bestrating",
                  "worstrating", "ratingcount", "reviewcount", "email", "telephone"}
WORDS = re.compile(r"\b(best|top|rank|ranks|ranked|ranking|rankings|score|scores|scored|scoring)\b", re.I)
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.-]+")

NODE_FACTS = r"""
import { regions, criteria, values } from './data/regions.js';
import { site, buildId, buildDate, canon, facts } from './data/site-facts.js';
const num = (c) => typeof c === 'object' && c !== null && typeof c.value === 'number' && Number.isFinite(c.value);
console.log(JSON.stringify({
  site, buildId, buildDate, canon, nCriteria: facts.criteria,
  criteria: criteria.map((c) => ({ id: c.id, name: c.name })),
  regions: regions.map((r) => ({
    id: r.id, name: r.name, country: r.country, continent: r.continent,
    measured: criteria.filter((c) => num(values[r.id] && values[r.id][c.id])).map((c) => c.id),
    nulls: criteria.filter((c) => !num(values[r.id] && values[r.id][c.id])).map((c) => c.id),
  })),
}));
"""


# ------------------------------------------------------------------------------------------------------------------ helpers
def node_facts(site):
    p = subprocess.run(["node", "--input-type=module", "-e", NODE_FACTS], cwd=str(site), env=ENV, capture_output=True, timeout=120)
    if p.returncode != 0:
        raise RuntimeError("node facts failed: %s" % p.stderr.decode("utf-8", "replace")[-600:])
    return json.loads(p.stdout.decode("utf-8"))


def tag_attrs(tag):
    return {m.group(1): htmllib.unescape(m.group(3) if m.group(3) is not None else m.group(4) if m.group(4) is not None else "")
            for m in re.finditer(r'([\w:-]+)(\s*=\s*(?:"([^"]*)"|\'([^\']*)\'))?', tag.split(None, 1)[1] if " " in tag else "")}


def meta_content(h, key):
    for m in re.finditer(r"<meta\b[^>]*>", h):
        a = tag_attrs(m.group(0))
        if a.get("name") == key or a.get("property") == key:
            return a.get("content")
    return None


def canonicals(h):
    out = []
    for m in re.finditer(r"<link\b[^>]*>", h):
        a = tag_attrs(m.group(0))
        if a.get("rel") == "canonical":
            out.append(a.get("href"))
    return out


def jsonld_blocks(h):
    """(parsed or None, raw) for every <script type=application/ld+json>."""
    out = []
    for m in re.finditer(r'<script\b[^>]*type="application/ld\+json"[^>]*>(.*?)</script>', h, re.S):
        raw = m.group(1)
        try:
            out.append((json.loads(raw), raw))
        except ValueError:
            out.append((None, raw))
    return out


def walk(node, path=""):
    """Yield (path, key, value) for every key of every object and every string in a JSON value."""
    if isinstance(node, dict):
        for k, v in node.items():
            yield (path + "/" + k, k, v)
            for x in walk(v, path + "/" + k):
                yield x
    elif isinstance(node, list):
        for i, v in enumerate(node):
            for x in walk(v, "%s[%d]" % (path, i)):
                yield x


def forbidden_in(doc):
    """Problems a rating, licence, email or ranking word would be: [(path, what)]."""
    bad = []
    for path, key, val in walk(doc):
        if key.lower() in FORBIDDEN_KEYS:
            bad.append((path, "key %s" % key))
        if isinstance(val, str):
            if EMAIL.search(val):
                bad.append((path, "email shape: %s" % val[:60]))
            if key == "unitText" and val.strip().lower() == "score":
                continue
            m = WORDS.search(val)
            if m:
                bad.append((path, "word '%s' in: %s" % (m.group(0), val[:80])))
    return bad


def fetch(base, path):
    try:
        with urllib.request.urlopen(base + path, timeout=20) as resp:
            return resp.status, resp.read().decode("utf-8", "replace"), resp.headers.get("content-type", "")
    except urllib.error.HTTPError as e:
        return e.code, "", ""
    except Exception as e:
        return 0, str(e), ""


def graph_nodes(doc):
    if isinstance(doc, dict) and isinstance(doc.get("@graph"), list):
        return doc["@graph"]
    return [doc] if isinstance(doc, dict) else []


def of_type(nodes, t):
    return [n for n in nodes if n.get("@type") == t]


def run_gen(args, cwd):
    p = subprocess.run(["node", "scripts/gen_region_pages.mjs"] + args, cwd=str(cwd), env=ENV, capture_output=True, timeout=300)
    return p.returncode, p.stdout.decode("utf-8", "replace"), p.stderr.decode("utf-8", "replace")


PROCESSED = ["legal-ownership.json", "land-cost.json", "hospital-proximity.geojson", "demographic-trajectory.json",
             "soil-contamination.json", "water-source-control.json", "climate-buffering.json", "land-cost.metadata.yaml",
             "koppen-legend.json"]
OPTIONAL = ["arrive.html", "host.html", "terms-of-arrival.html"]


def make_tree(dest, site):
    """A prototype-shaped tree (data, lib, the generator) built from the scratch site, to run the generator in place."""
    if dest.exists():
        shutil.rmtree(str(dest))
    (dest / "data" / "processed").mkdir(parents=True)
    (dest / "scripts").mkdir()
    for f in (Path(site) / "data").glob("*.js"):
        if ".staging." in f.name or f.name.endswith(".bak") or f.name == "v1-lookup.js":
            continue
        shutil.copy2(str(f), str(dest / "data" / f.name))
    shutil.copy2(str(Path(site) / "data" / "footprints.json"), str(dest / "data" / "footprints.json"))
    for n in PROCESSED:
        src = Path(site) / "data" / "processed" / n
        if src.is_file():
            shutil.copy2(str(src), str(dest / "data" / "processed" / n))
    for n in ("gen_region_pages.mjs", "gen_v1_lookup.mjs"):
        shutil.copy2(str(PROTO / "scripts" / n), str(dest / "scripts" / n))
    shutil.copytree(str(PROTO / "lib"), str(dest / "lib"), ignore=shutil.ignore_patterns("*.test.mjs"))
    for n in OPTIONAL:
        if (Path(site) / n).is_file():
            shutil.copy2(str(Path(site) / n), str(dest / n))
    return dest


# ------------------------------------------------------------------------------------------------------------------ the suite
def run(ctx):
    r = ctx.new_results(NAME)
    site = Path(ctx.site)
    base = ctx.base
    try:
        F = node_facts(site)
    except Exception as e:
        r.check("facts-load", False, str(e)[:400])
        return r.out
    origin = F["site"]["origin"]
    site_name = F["site"]["name"]
    build_id, build_date = F["buildId"], F["buildDate"]
    regions = F["regions"]
    by_id = {x["id"]: x for x in regions}
    region_urls = {"%s/region/%s.html" % (origin, x["id"]) for x in regions}

    # ---------------------------------------------------------------- sitemap
    sm_path = site / "sitemap.xml"
    sm = sm_path.read_text("utf-8") if sm_path.is_file() else ""
    r.check("sitemap-exists", bool(sm), "no sitemap.xml in the scratch site")
    entries = re.findall(r"<url>\s*<loc>([^<]+)</loc>(?:\s*<lastmod>([^<]*)</lastmod>)?", sm)
    locs = [e[0] for e in entries]
    r.check("sitemap-no-duplicate-urls", len(locs) == len(set(locs)), "%d urls, %d distinct" % (len(locs), len(set(locs))))
    r.check("sitemap-all-urls-on-canonical-origin", all(u.startswith(origin + "/") for u in locs), [u for u in locs if not u.startswith(origin + "/")][:3])
    r.check("sitemap-lastmod-is-build-date-everywhere", len(entries) == len(locs) and all(e[1] == build_date for e in entries),
            "buildDate %s; got %s" % (build_date, sorted({e[1] for e in entries})))
    optional_present = [n for n in OPTIONAL if (site / n).is_file()]
    want = {origin + "/", origin + "/deeper.html"} | {"%s/%s" % (origin, n) for n in optional_present}
    files_region = sorted(p.stem for p in (site / "region").glob("*.html")) if (site / "region").is_dir() else []
    want |= {"%s/region/%s.html" % (origin, s) for s in files_region}
    r.check("sitemap-url-set-equals-pages-that-exist", set(locs) == want,
            "missing %s; extra %s" % (sorted(want - set(locs))[:4], sorted(set(locs) - want)[:4]))
    r.check("region-files-equal-the-data", sorted(files_region) == sorted(by_id), "%d files, %d regions" % (len(files_region), len(by_id)))
    r.info("sitemap-pages", "%d urls; optional pages present: %s" % (len(locs), optional_present or "none yet"))

    # ---------------------------------------------------------------- per page
    def local_file(url):
        path = url[len(origin):]
        if path in ("", "/"):
            return site / "index.html"
        return site / path.lstrip("/")

    pages = {}
    for u in locs:
        f = local_file(u)
        if f.is_file():
            pages[u] = f.read_text("utf-8")
    missing_files = [u for u in locs if not local_file(u).is_file()]
    r.check("sitemap-lists-no-missing-file", not missing_files, missing_files[:4])
    generated = lambda u: u == origin + "/" or "/region/" in u   # noqa: E731

    for u, h in sorted(pages.items()):
        t = ":" + u[len(origin):]
        ins = re.findall(r'<script\b[^>]*\bsrc="/_vercel/insights/script\.js"[^>]*>\s*</script>', h)
        r.check("one-insights-tag" + t, len(ins) == 1 and h.count(INSIGHTS) == 1, "%d tags, %d mentions" % (len(ins), h.count(INSIGHTS)))
        n_h1 = len(re.findall(r"<h1\b", h))
        r.check("one-h1" + t, n_h1 == 1, "%d h1" % n_h1)
        cans = canonicals(h)
        r.check("self-canonical" + t, cans == [u], "canonical %s, sitemap url %s" % (cans, u))
        r.check("no-vercel-app" + t, "vercel.app" not in h, "a vercel.app string is present")
        blocks = jsonld_blocks(h)
        r.check("jsonld-present-and-parses" + t, bool(blocks) and all(b[0] is not None for b in blocks), "%d blocks, %d unparsed" % (len(blocks), sum(1 for b in blocks if b[0] is None)))
        bad = []
        for doc, raw in blocks:
            if doc is not None:
                bad += forbidden_in(doc)
            if "</script" in raw.lower() or "<" in raw:
                bad.append(("raw", "an unescaped < inside the JSON-LD block"))
        r.check("jsonld-no-licence-rating-email-or-ranking-word" + t, not bad, bad[:4])
        desc = meta_content(h, "description")
        if desc is None:
            r.check("meta-description-present" + t, False, "no meta description")
        elif generated(u):
            r.check("meta-description-at-most-160" + t, len(desc) <= 160, "%d characters: %s" % (len(desc), desc))
        elif len(desc) > 160:
            r.info("meta-description-over-160-hand-authored" + t, "%d characters; this page's head is hand-written (no <!--s:head--> and no head template): its owner shortens it" % len(desc))
        else:
            r.check("meta-description-at-most-160" + t, True, "%d characters" % len(desc))

    # ---------------------------------------------------------------- region pages
    for x in regions:
        rid = x["id"]
        u = "%s/region/%s.html" % (origin, rid)
        h = pages.get(u)
        t = ":" + rid
        if h is None:
            r.check("region-page-in-sitemap" + t, False, u)
            continue
        title = htmllib.unescape((re.search(r"<title>(.*?)</title>", h, re.S) or [None, ""])[1])
        r.check("title-name-country-site" + t, title == "%s, %s - %s" % (x["name"], x["country"], site_name), title)
        desc = meta_content(h, "description") or ""
        r.check("description-leads-with-whose-land" + t, desc.startswith("Whose land:") or desc.startswith(x["name"]), desc[:80])
        og = meta_content(h, "og:image") or ""
        r.check("og-image-carries-build-id" + t, og == "%s/api/og?region=%s&v=%s" % (origin, rid, build_id), og)
        r.check("og-url-and-canonical-agree" + t, meta_content(h, "og:url") == u, meta_content(h, "og:url"))
        blocks = jsonld_blocks(h)
        doc = blocks[0][0] if blocks else None
        nodes = graph_nodes(doc) if doc else []
        r.check("jsonld-single-graph-block" + t, len(blocks) == 1 and isinstance(doc, dict) and doc.get("@context") == "https://schema.org", "%d blocks" % len(blocks))
        place, crumbs, ds = (of_type(nodes, "Place") or [None])[0], (of_type(nodes, "BreadcrumbList") or [None])[0], (of_type(nodes, "Dataset") or [None])[0]
        r.check("jsonld-has-place-breadcrumb-dataset" + t, bool(place and crumbs and ds), [n.get("@type") for n in nodes])
        if place:
            geo = place.get("geo") or {}
            r.check("place-fields" + t, bool(place.get("name") == x["name"] and place.get("url") == u
                                              and isinstance(geo.get("latitude"), (int, float)) and isinstance(geo.get("longitude"), (int, float))
                                              and (place.get("address") or {}).get("addressCountry") == x["country"]
                                              and (place.get("isPartOf") or {}).get("@type") == "WebSite"
                                              and (place.get("isPartOf") or {}).get("url") == origin + "/"), json.dumps({k: place.get(k) for k in ("name", "url", "geo", "address", "isPartOf")})[:300])
            props = [p.get("name") for p in place.get("additionalProperty", [])]
            r.check("place-keeps-bio-about-and-ecoregion" + t, bool((place.get("about") or {}).get("@type") == "Place" and "Ecoregion" in props), "about %s; properties %s" % (place.get("about"), props))
        if crumbs:
            items = crumbs.get("itemListElement") or []
            r.check("breadcrumbs-home-regions-region" + t, [i.get("position") for i in items] == [1, 2, 3] and items[0].get("item") == origin + "/" and items[-1].get("item") == u and items[-1].get("name") == x["name"], items)
        if ds:
            vm = ds.get("variableMeasured") or []
            got = sorted(p.get("propertyID") for p in vm)
            r.check("dataset-one-variable-per-number-null-cells-omitted" + t, got == sorted(x["measured"]),
                    "measured %s; nulls %s; got %s" % (sorted(x["measured"]), x["nulls"], got))
            holes = [p.get("propertyID") for p in vm if not (isinstance(p.get("value"), (int, float)) and p.get("unitText") and p.get("measurementTechnique") and p.get("temporalCoverage") and p.get("name"))]
            r.check("dataset-variables-have-value-unit-source-window" + t, not holes, holes)
            creator = ds.get("creator") or {}
            r.check("dataset-creator-is-the-group-with-askja-as-originator" + t,
                    creator.get("@type") == "Organization" and "working group" in (creator.get("name") or "") and (creator.get("founder") or {}).get("name") == "Askja"
                    and "Askja" in (creator.get("description") or ""), creator)
            r.check("dataset-free-and-based-on-sources" + t, ds.get("isAccessibleForFree") is True and len(ds.get("isBasedOn") or []) >= 1 and ds.get("name") == "A reading of %s" % x["name"], {k: ds.get(k) for k in ("name", "isAccessibleForFree")})
            r.check("dataset-has-no-licence-key" + t, "license" not in ds and "licence" not in ds, list(ds.keys()))
        # internal links, in the HTML
        hrefs = [htmllib.unescape(m) for m in re.findall(r'<a\b[^>]*\bhref="([^"]*)"', h)]
        r.check("links-to-arrive-with-this-region" + t, "/arrive.html?region=%s#region" % rid in hrefs or any(x_.startswith("/arrive.html?region=%s" % rid) for x_ in hrefs), [x_ for x_ in hrefs if "arrive" in x_][:3])
        r.check("links-to-host" + t, "/host.html" in hrefs, "no /host.html link")
        r.check("links-to-methodology" + t, "/deeper.html#methodology" in hrefs, "no /deeper.html#methodology link")
        others = {"/region/%s.html" % o for o in by_id if o != rid}
        r.check("links-to-every-other-region" + t, others <= set(hrefs), "missing %s" % sorted(others - set(hrefs))[:4])
        r.check("no-self-link-in-region-list" + t, "/region/%s.html" % rid not in hrefs, "the page links to itself")

    # ---------------------------------------------------------------- home
    home = pages.get(origin + "/")
    if home is None:
        r.check("home-in-sitemap", False, "no home page in the sitemap")
    else:
        og = meta_content(home, "og:image") or ""
        r.check("home-og-image-carries-build-id", og == "%s/api/og?v=%s" % (origin, build_id), og)
        r.check("home-og-url-matches-canonical", meta_content(home, "og:url") == origin + "/", meta_content(home, "og:url"))
        blocks = jsonld_blocks(home)
        r.check("home-one-jsonld-graph", len(blocks) == 1 and blocks[0][0] is not None, "%d blocks" % len(blocks))
        nodes = graph_nodes(blocks[0][0]) if blocks and blocks[0][0] else []
        types = [n.get("@type") for n in nodes]
        r.check("home-graph-website-one-dataset-itemlist", types.count("WebSite") == 1 and types.count("Dataset") == 1 and types.count("ItemList") == 1, types)
        ds = (of_type(nodes, "Dataset") or [None])[0]
        if ds:
            ids = sorted(p.get("propertyID") for p in ds.get("variableMeasured") or [])
            r.check("home-dataset-names-every-criterion", ids == sorted(c["id"] for c in F["criteria"]), ids)
            cr = ds.get("creator") or {}
            r.check("home-dataset-creator-group-askja-originator", cr.get("@type") == "Organization" and (cr.get("founder") or {}).get("name") == "Askja", cr)
            r.check("home-dataset-free-and-no-licence", ds.get("isAccessibleForFree") is True and "license" not in ds, list(ds.keys()))
        il = (of_type(nodes, "ItemList") or [None])[0]
        if il:
            urls = [i.get("url") for i in il.get("itemListElement") or []]
            r.check("home-itemlist-is-unordered", il.get("itemListOrder") == "https://schema.org/ItemListUnordered" and not any("position" in i for i in il.get("itemListElement") or []), il.get("itemListOrder"))
            r.check("home-itemlist-lists-every-region-page", sorted(urls) == sorted(region_urls) and il.get("numberOfItems") == len(regions), "%d urls for %d regions" % (len(urls), len(regions)))
        ws = (of_type(nodes, "WebSite") or [None])[0]
        if ws:
            au = ws.get("author") or {}
            r.check("home-website-author-is-the-group", au.get("@type") == "Organization" and "working group" in (au.get("name") or "") and ws.get("url") == origin + "/", au)
        desc = meta_content(home, "description") or ""
        r.check("home-description-carries-the-canon-descriptor", desc.startswith(F["canon"]["descriptor"][:60]), desc[:80])

        # internal links from "/" reach every region page without JavaScript: the FETCHED html, not the DOM
        status, body, _ct = fetch(base, "/")
        got = set(htmllib.unescape(m) for m in re.findall(r'<a\b[^>]*\bhref="(/region/[a-z0-9-]+\.html)"', body))
        want_links = {"/region/%s.html" % rid for rid in by_id}
        index_src = (site / "index.html").read_text("utf-8") if (site / "index.html").is_file() else ""
        has_marker = "<!--s:regionlinks-->" in index_src
        if has_marker or got:
            r.check("home-fetched-html-links-every-region-page", status == 200 and want_links <= got,
                    "status %s; missing %s" % (status, sorted(want_links - got)[:5]))
        else:
            r.skip("home-fetched-html-links-every-region-page",
                   "index.html carries no <!--s:regionlinks--> marker yet (index.html is owned by MC-LISTS, then INT-FINAL, which must add it); the check turns on by itself once the marker or the links exist")
        # the mechanism, proven on a copy: the marker, stamped, makes every region page reachable without JavaScript
        if not has_marker:
            tmp = SCRATCH / "MC-SEO-stamp-proof"
            if tmp.exists():
                shutil.rmtree(str(tmp))
            tmp.mkdir(parents=True)
            for sub in ("data", "lib", "src"):
                shutil.copytree(str(site / sub), str(tmp / sub), ignore=shutil.ignore_patterns("processed", "*.geojson", "*.test.mjs"))
            page = index_src.replace("</body>", "<nav aria-label=\"Regions\"><!--s:regionlinks--><!--/s--></nav>\n</body>", 1)
            (tmp / "index.html").write_text(page, "utf-8")
            p = subprocess.run(["node", "scripts/stamp_build.mjs", "--root", str(tmp), "--write", "--quiet"], cwd=str(PROTO), env=ENV, capture_output=True, timeout=120)
            stamped = (tmp / "index.html").read_text("utf-8") if (tmp / "index.html").is_file() else ""
            got2 = set(re.findall(r'<a\b[^>]*\bhref="(/region/[a-z0-9-]+\.html)"', stamped))
            r.check("regionlinks-marker-yields-every-region-link-without-js", p.returncode == 0 and want_links <= got2,
                    "exit %s; missing %s; %s" % (p.returncode, sorted(want_links - got2)[:4], p.stderr.decode("utf-8", "replace")[-200:]))
            shutil.rmtree(str(tmp), ignore_errors=True)

    # ---------------------------------------------------------------- llms.txt
    lp = site / "llms.txt"
    llms = lp.read_text("utf-8") if lp.is_file() else ""
    r.check("llms-exists", bool(llms), "no llms.txt in the scratch site")
    status, body, ctype = fetch(base, "/llms.txt")
    r.check("llms-served-as-text", status == 200 and ctype.startswith("text/"), "status %s, %s" % (status, ctype))
    r.check("llms-h1-and-summary", llms.startswith("# %s\n\n> " % site_name) and F["canon"]["descriptor"] in llms and F["canon"]["stance"] in llms, llms[:160])
    missing = [x["id"] for x in regions if ("(%s/region/%s.html)" % (origin, x["id"])) not in llms or ("[%s, %s]" % (x["name"], x["country"])) not in llms]
    r.check("llms-lists-every-region-with-its-url", not missing, "missing %s" % missing[:5])
    r.check("llms-lists-each-region-once", all(llms.count("(%s/region/%s.html)" % (origin, x["id"])) == 1 for x in regions), "a region appears twice")
    for head in ("## Key pages", "## Regions", "## How the data is dated and licensed", "## What this is not", "## How to cite"):
        r.check("llms-section:" + head[3:].lower().replace(" ", "-"), ("\n" + head + "\n") in llms, head)
    r.check("llms-no-vercel-app", "vercel.app" not in llms, "a vercel.app string")
    r.check("llms-no-email-or-contact", not EMAIL.search(llms) and "mailto:" not in llms, "an email shape")
    r.check("llms-states-order-is-not-a-ranking", "not a ranking" in llms, "")
    r.check("llms-names-askja-as-originator", "originated by Askja" in llms, "")
    r.check("llms-licence-line-per-criterion", all(("- %s" % c["name"]) in llms for c in F["criteria"]) and llms.count("Licence:") >= len(F["criteria"]), "")
    for n in optional_present:
        r.check("llms-key-pages-lists-" + n, ("%s/%s" % (origin, n)) in llms, n)

    # ---------------------------------------------------------------- robots.txt
    rp = site / "robots.txt"
    robots = rp.read_text("utf-8") if rp.is_file() else ""
    lines = [ln.strip() for ln in robots.splitlines() if ln.strip() and not ln.strip().startswith("#")]
    r.check("robots-allows-all", "User-agent: *" in lines and "Allow: /" in lines and not [ln for ln in lines if ln.lower().startswith("disallow") and ln.split(":", 1)[1].strip()], lines)
    r.check("robots-points-to-the-canonical-sitemap", ("Sitemap: %s/sitemap.xml" % origin) in lines, lines)
    r.check("robots-no-vercel-app", "vercel.app" not in robots, "")

    # ---------------------------------------------------------------- the generator: deterministic, and --check covers llms.txt
    tree = make_tree(SCRATCH / "MC-SEO-check-tree", site)
    code, out, err = run_gen([], tree)
    r.check("gen-in-place-on-a-copy-exits-0", code == 0 and (tree / "llms.txt").is_file() and (tree / "sitemap.xml").is_file(), "exit %s: %s" % (code, err[-300:]))
    same = [n for n in ("llms.txt", "sitemap.xml") if (tree / n).is_file() and (tree / n).read_text("utf-8") == (site / n).read_text("utf-8")]
    r.check("gen-output-is-deterministic-and-equals-the-scratch-site", same == ["llms.txt", "sitemap.xml"], "identical: %s" % same)
    pages_same = all((tree / "region" / ("%s.html" % x["id"])).is_file() and (tree / "region" / ("%s.html" % x["id"])).read_text("utf-8") == (site / "region" / ("%s.html" % x["id"])).read_text("utf-8") for x in regions)
    r.check("gen-region-pages-are-deterministic", pages_same, "a region page differs between two runs")
    code, out, err = run_gen(["--check"], tree)
    r.check("gen-check-clean-on-a-fresh-tree", code == 0 and "OK" in out and "llms.txt" in out, "exit %s: %s %s" % (code, out[-200:], err[-200:]))
    (tree / "llms.txt").write_text((tree / "llms.txt").read_text("utf-8") + "\nedited\n", "utf-8")
    code, out, err = run_gen(["--check"], tree)
    r.check("gen-check-fails-on-an-edited-llms-txt-naming-it", code == 1 and "llms.txt" in err, "exit %s: %s" % (code, err[-300:]))
    (tree / "sitemap.xml").write_text("<urlset/>", "utf-8")
    code, out, err = run_gen(["--check"], tree)
    r.check("gen-check-fails-on-an-edited-sitemap-naming-it", code == 1 and "sitemap.xml" in err, "exit %s: %s" % (code, err[-300:]))
    shutil.rmtree(str(tree), ignore_errors=True)
    code, out, err = run_gen(["--help"], PROTO)
    r.check("gen-help-names-llms-txt", code == 0 and "llms.txt" in out, "exit %s" % code)

    # ---------------------------------------------------------------- the head template keeps the analytics tag
    code_p = subprocess.run(["node", "--input-type=module", "-e",
                             "import h, {INSIGHTS_TAG} from './scripts/stamp/head-index.mjs'; import * as f from './data/site-facts.js';"
                             "const L = h(f.factValues(), f.canon, f.site); const t = L.join('\\n');"
                             "console.log(JSON.stringify({n: (t.match(/_vercel\\/insights\\/script\\.js/g)||[]).length, tag: L.filter(x => x === INSIGHTS_TAG).length,"
                             " d: (t.match(/name=\"description\" content=\"([^\"]*)\"/)||[])[1].length}));"],
                            cwd=str(PROTO), env=ENV, capture_output=True, timeout=60)
    try:
        j = json.loads(code_p.stdout.decode("utf-8"))
        r.check("head-template-emits-insights-tag-once", j["n"] == 1 and j["tag"] == 1, j)
        r.check("head-template-description-at-most-160", j["d"] <= 160, j)
    except Exception:
        r.check("head-template-emits-insights-tag-once", False, code_p.stderr.decode("utf-8", "replace")[-300:])

    # nothing in this suite submits a form or opens a browser
    r.check("no-form-submitted", not ctx.formsubmit_attempts(), ctx.formsubmit_attempts())
    return r.out
