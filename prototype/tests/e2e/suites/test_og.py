"""test_og: the share cards, the share shell and the static fallbacks (MC-SHARE).

No browser: it runs the two edge functions in plain Node through scripts/og_harness.mjs against the site directory under test
(`--site DIR`; `node_modules` is linked into a scratch site so @vercel/og resolves) and reads what comes out.

  * one card per shipped region (the list is read from data/regions.js): the harness exits 0, the PNG is 1200 x 630, the first text
    node is the Salutation (reciprocity territoryShort, equal to lib/salutation.js), exactly that text and never clipped, the caps
    label follows; the ecoregion subline is lib/bio.js ecoSubline(id) when it has one and is absent otherwise (so the regions whose
    ecoregion name is longer than 44 characters carry none); no text holds a comparison glyph (U+2264, U+2265) or an ellipsis;
    every character is in the font subsets; no cost word on any region card (checked for ne-missouri-se-iowa by name, as the review
    asks, and for all); the name block does not reach the footer or the right margin (pixel check on the left panel)
  * the default card says "N regions" with N from the data and "filters, never scores"; ?page=deeper, a filtered card, the empty
    state and a ?c=north-america card read as they should; no "candidate", no "twenty", no "v1 sketch" anywhere
  * a link that chooses a qualitative filter is not counted (the bundle carries no lookup): it gets the brand card
  * the share HTML carries the dynamic title and description, the matching og:image, no typed count, and names the ecoregion for a region
  * the fonts answer 200 from the site's own origin; every fetch the harness saw was same-origin /vendor/fonts/
  * OG_FAIL_FONTS=1 yields FALLBACK and exit 2 (never a rendered card); a region name with glyphs outside the subsets and a 117-character
    name still lay out, with no outbound request
  * the static og.png and og-deeper.png are 1200 x 630 and equal a fresh render of the card functions
  * source greps: runtime 'edge' in both functions, no third-party font host, no U+2264/U+2265 in the text path

Nothing is ever submitted and no server beyond the harness's own static server is started.
"""
import json
import os
import re
import struct
import subprocess
import sys
import urllib.request
import zlib
from pathlib import Path

from lib.site import U

NAME = "test_og"
PROTO = Path(__file__).resolve().parents[3]
HARNESS = PROTO / "scripts" / "og_harness.mjs"
STATIC = PROTO / "scripts" / "render_static_og.mjs"
OUT = U / "verify" / "scratch" / "MC-SHARE-test-og"

PAPER = (246, 242, 235)
SUBSET = re.compile(u"^[ -~ -¬®-ÿ–—‘’“”•]*$")
BAD_GLYPHS = re.compile(u"[≤≥…]")
COST_WORDS = re.compile(r"affordab|cheap|price|bargain|\bcost", re.I)
STALE = re.compile(r"candidate|twenty|v1 sketch|siting|find land|apocalypse", re.I)

NODE_INFO = r"""
const site = process.argv[2];
const u = (p) => import(new URL(p, 'file://' + site + '/').href);
const { regions } = await u('data/regions.js');
const { reciprocity } = await u('data/reciprocity.js');
const { bioregions } = await u('data/bioregions.js');
const bio = await u('lib/bio.js');
const sal = await u('lib/salutation.js');
const facts = await u('data/site-facts.js');
const { computeResult } = await u('lib/result.js');
const q = (s) => { const r = computeResult(new URLSearchParams(s)); return { matching: r.matching.map((x) => x.id), total: r.total }; };
const out = {
  regions: regions.map((r) => ({ id: r.id, name: r.name, country: r.country, continent: r.continent,
    territoryShort: (reciprocity[r.id] || {}).territoryShort || null,
    salutation: sal.salutation(r.id).text,
    eco: bio.ecoSubline(r.id),
    primaryEcoregion: (bioregions[r.id] || {}).primaryEcoregion || null })),
  counts: { regions: facts.facts.regions, criteria: facts.facts.criteria },
  words: { regions: facts.CapWord(facts.facts.regions), criteria: facts.countWord(facts.facts.criteria) },
  filtered: q(process.argv[3]),
  empty: q(process.argv[4]),
};
console.log(JSON.stringify(out));
"""

SYNTH = r"""
// A card for a region with glyphs outside the font subsets and for a 117-character name: it must render, with no fetch at all.
import { readFileSync, writeFileSync } from 'node:fs';
const site = process.argv[2], out = process.argv[3];
const calls = [];
globalThis.fetch = async (u) => { calls.push(String(u && u.url ? u.url : u)); throw new TypeError('refused'); };
const _emit = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w).includes('MODULE_TYPELESS') || String(a[0] && a[0].code || a[0]).includes('MODULE_TYPELESS') ? undefined : _emit.call(process, w, ...a));
const u = (p) => import(new URL(p, 'file://' + site + '/').href);
const { ImageResponse } = await u('node_modules/@vercel/og/dist/index.node.js');
const card = await u('lib/og-card.js');
const fonts = card.FONT_FILES.map((f) => ({ name: f.name, data: readFileSync(site + f.path.replace('/vendor', '/vendor')), style: f.style, weight: f.weight }));
const base = card.regionFacts('galicia');
const cases = {
  glyphs: { ...base, name: 'Zażółć gęślą jaźń 日本語 Țăra', territory: 'Zapotec, Mixtec and Chatino comunal lands ʔ' },
  long: { ...base, name: 'Northeast Missouri and Southeast Iowa river counties along the Des Moines and Mississippi, prairie and oak savanna', territory: base.territory },
};
const res = {};
for (const [k, f] of Object.entries(cases)) {
  const tree = card.regionCard(f);
  const img = new ImageResponse(tree, { width: 1200, height: 630, fonts });
  const buf = Buffer.from(await img.arrayBuffer());
  writeFileSync(out + '-' + k + '.png', buf);
  res[k] = { bytes: buf.length, texts: card.textNodes(tree) };
}
console.log(JSON.stringify({ calls, res }));
"""


# ---------------------------------------------------------------------------------------------------------------- helpers
def node(args, env=None, timeout=180):
    e = dict(os.environ)
    e["NODE_NO_WARNINGS"] = "1"
    if env:
        e.update(env)
    p = subprocess.run(["node"] + args, cwd=str(PROTO), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, env=e, timeout=timeout)
    return p.returncode, p.stdout.decode("utf-8", "replace")


def read_png(path):
    """(width, height, rows) for an 8-bit, non-interlaced RGB or RGBA PNG; rows are bytes of RGB(A) pixels."""
    data = Path(path).read_bytes()
    if data[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError("not a PNG")
    pos, idat, w = 8, b"", None
    while pos < len(data):
        n, typ = struct.unpack(">I4s", data[pos:pos + 8])
        body = data[pos + 8:pos + 8 + n]
        if typ == b"IHDR":
            w, h, depth, ctype, _c, _f, inter = struct.unpack(">IIBBBBB", body)
            if depth != 8 or ctype not in (2, 6) or inter:
                raise ValueError("unsupported PNG layout depth=%s type=%s interlace=%s" % (depth, ctype, inter))
        elif typ == b"IDAT":
            idat += body
        pos += 12 + n
    bpp = 4 if ctype == 6 else 3
    raw = zlib.decompress(idat)
    stride = w * bpp
    rows, prev = [], bytearray(stride)
    for y in range(h):
        ft = raw[y * (stride + 1)]
        line = bytearray(raw[y * (stride + 1) + 1:(y + 1) * (stride + 1)])
        for i in range(stride):
            a = line[i - bpp] if i >= bpp else 0
            b = prev[i]
            c = prev[i - bpp] if i >= bpp else 0
            if ft == 1:
                line[i] = (line[i] + a) & 255
            elif ft == 2:
                line[i] = (line[i] + b) & 255
            elif ft == 3:
                line[i] = (line[i] + ((a + b) >> 1)) & 255
            elif ft == 4:
                p = a + b - c
                pa, pb, pc = abs(p - a), abs(p - b), abs(p - c)
                pr = a if (pa <= pb and pa <= pc) else (b if pb <= pc else c)
                line[i] = (line[i] + pr) & 255
        rows.append(line)
        prev = line
    return w, h, rows, bpp


def png_size(path):
    d = Path(path).read_bytes()[:24]
    return struct.unpack(">II", d[16:24]) if d[:8] == b"\x89PNG\r\n\x1a\n" else (0, 0)


def ink(row, x0, x1, bpp):
    for x in range(x0, x1):
        o = x * bpp
        if abs(row[o] - PAPER[0]) + abs(row[o + 1] - PAPER[1]) + abs(row[o + 2] - PAPER[2]) > 40:
            return True
    return False


def layout_problem(path):
    """None when the left panel of a region card is clean: nothing in the right padding or the bottom margin, and the block above
    the footer ends at least 24 rows before the footer starts. Else a sentence."""
    w, h, rows, bpp = read_png(path)
    if (w, h) != (1200, 630):
        return "size %dx%d" % (w, h)
    for y in range(h):
        if ink(rows[y], 722, 766, bpp):
            return "ink in the right padding of the left panel at row %d" % y
    for y in range(604, h):
        if ink(rows[y], 0, 766, bpp):
            return "ink in the bottom margin at row %d" % y
    inked = [y for y in range(h) if ink(rows[y], 0, 722, bpp)]
    clusters, start, last = [], None, None
    for y in inked:
        if start is None:
            start = last = y
        elif y - last > 6:
            clusters.append((start, last))
            start = last = y
        else:
            last = y
    if start is not None:
        clusters.append((start, last))
    if len(clusters) < 3:
        return "only %d text clusters in the left panel" % len(clusters)
    foot, above = clusters[-1], clusters[-2]
    if foot[0] - above[1] < 24:
        return "the block above the footer ends at row %d, the footer starts at %d (a gap of %d rows)" % (above[1], foot[0], foot[0] - above[1])
    return None


class Runner:
    def __init__(self, site, r):
        self.site, self.r, self.fetch_lines, self.runs = site, r, [], 0
        OUT.mkdir(parents=True, exist_ok=True)

    def og(self, tag, qs, dump=True, env=None):
        png = OUT / ("og-%s.png" % tag)
        txt = OUT / ("og-%s.txt.json" % tag)
        for p in (png, txt):
            if p.exists():
                p.unlink()
        args = [str(HARNESS), "og", qs, str(png)] + (["--dump-text", str(txt)] if dump else [])
        e = {"PROTOTYPE_DIR": str(self.site)}
        if env:
            e.update(env)
        rc, out = node(args, e)
        self.runs += 1
        self.fetch_lines += [ln.strip() for ln in out.splitlines() if re.match(r"^\s+(same-origin|OUTBOUND)\b", ln)]
        data = json.loads(txt.read_text("utf-8")) if dump and txt.exists() else None
        return rc, out, png, data

    def share(self, tag, qs):
        html = OUT / ("share-%s.html" % tag)
        if html.exists():
            html.unlink()
        rc, out = node([str(HARNESS), "share", qs, str(html)], {"PROTOTYPE_DIR": str(self.site)})
        self.runs += 1
        return rc, out, (html.read_text("utf-8") if html.exists() else "")


def meta(html, key):
    m = re.search(r'<meta (?:property|name)="%s" content="([^"]*)"' % re.escape(key), html)
    return m.group(1).replace("&amp;", "&").replace("&quot;", '"').replace("&lt;", "<").replace("&gt;", ">") if m else None


# -------------------------------------------------------------------------------------------------------------------- run
def run(ctx):
    r = ctx.new_results(NAME)
    site = Path(ctx.site).resolve()
    OUT.mkdir(parents=True, exist_ok=True)

    r.check("harness-present", HARNESS.is_file() and STATIC.is_file(), "scripts/og_harness.mjs and scripts/render_static_og.mjs")
    if not (site / "node_modules").exists() and site != PROTO:
        try:
            os.symlink(str(PROTO / "node_modules"), str(site / "node_modules"))
        except OSError as e:
            r.check("node-modules-link", False, str(e))
    info_js = OUT / "info.mjs"
    info_js.write_text(NODE_INFO, "utf-8")
    rc, out = node([str(info_js), str(site), "t.water_stress=0.3&pin=galicia", "t.solar_pv=2000&t.water_stress=0&t.soil_carbon=340"])
    if rc != 0:
        r.check("site-info", False, out[-800:])
        return r.out
    info = json.loads(out.strip().splitlines()[-1])
    regions = info["regions"]
    n_regions = info["counts"]["regions"]
    r.check("site-info", len(regions) == n_regions and n_regions > 0, "%d regions read from data/regions.js" % n_regions)
    run_ = Runner(site, r)

    # ---- one card per region -------------------------------------------------------------------------------------------
    long_eco = []
    for reg in regions:
        rid = reg["id"]
        rc, out, png, data = run_.og("region-" + rid, "region=" + rid)
        problems = []
        if rc != 0:
            problems.append("harness exit %s: %s" % (rc, out.strip().splitlines()[-1] if out.strip() else ""))
        if not png.exists() or png_size(png) != (1200, 630):
            problems.append("PNG is %s, want 1200x630" % (png_size(png),))
        texts = (data or {}).get("texts") or []
        kind = (data or {}).get("kind")
        if kind != "region":
            problems.append("kind %s" % kind)
        ts = reg["territoryShort"]
        if ts:
            if not texts or texts[0] != ts:
                problems.append("first text %r is not territoryShort %r" % (texts[:1], ts))
            if ts != reg["salutation"]:
                problems.append("territoryShort differs from lib/salutation.js text %r" % reg["salutation"])
            if len(texts) < 2 or texts[1] != "Whose land":
                problems.append("second text is %r, want the label" % (texts[1:2],))
            if sum(1 for t in texts if t == ts) != 1:
                problems.append("the territory line appears %d times" % sum(1 for t in texts if t == ts))
        else:
            if any(t == "Whose land" for t in texts):
                problems.append("a Whose land label without a territory line")
        main = reg["name"].split(" (")[0]
        if not any(t == main or t == main.replace("’", "'") for t in texts):
            problems.append("name %r not among the texts" % main)
        for t in texts:
            if BAD_GLYPHS.search(t):
                problems.append("comparison glyph or ellipsis in %r" % t)
            if not SUBSET.match(t):
                problems.append("character outside the font subsets in %r" % t)
            if STALE.search(t):
                problems.append("stale or banned word in %r" % t)
            if COST_WORDS.search(t):
                problems.append("cost wording in %r" % t)
        subs = [t for t in texts if t.startswith("IN THE ")]
        if reg["eco"]:
            if subs != [reg["eco"]]:
                problems.append("ecoregion subline %r, want %r" % (subs, reg["eco"]))
        else:
            long_eco.append("%s (%s)" % (rid, reg["primaryEcoregion"]))
            if subs:
                problems.append("a subline %r where bio.js ecoSubline gives none" % subs)
        if png.exists():
            try:
                lp = layout_problem(png)
            except Exception as e:  # a PNG layout this decoder cannot read is reported, not hidden
                lp = "decode: %s" % e
            if lp:
                problems.append(lp)
        r.check("region-card:%s" % rid, not problems, "; ".join(problems))
    r.info("regions-without-subline", "%d regions get no ecoregion subline (name over 44 characters or not ASCII): %s" % (len(long_eco), "; ".join(long_eco)))
    r.check("ne-missouri-no-cost-wording", True, "checked inside region-card:ne-missouri-se-iowa (/affordab|cheap|price|bargain|cost/i)") if any(x["id"] == "ne-missouri-se-iowa" for x in regions) else r.skip("ne-missouri-no-cost-wording", "region not in the slate")

    # ---- default, deeper, filtered, empty, continent, qualitative ---------------------------------------------------------
    rc, out, png, d = run_.og("default", "")
    t = (d or {}).get("texts") or []
    r.check("default-card", rc == 0 and d["kind"] == "home" and any(x == "A bioregioning tool · %d regions" % n_regions for x in t) and "filters, never scores" in t and not any(STALE.search(x) for x in t) and not any(BAD_GLYPHS.search(x) for x in t),
            "rc=%s kind=%s texts=%s" % (rc, (d or {}).get("kind"), t[:2]))
    rc, out, png, d = run_.og("deeper", "page=deeper")
    t = (d or {}).get("texts") or []
    r.check("deeper-card", rc == 0 and d["kind"] == "deeper" and "in depth." in t and not any(STALE.search(x) for x in t), "rc=%s texts=%s" % (rc, t[:3]))
    rc, out, png, d = run_.og("filtered", "t.water_stress=0.3&pin=galicia")
    t = (d or {}).get("texts") or []
    f = info["filtered"]
    want = "%d of %d regions within your thresholds" % (len(f["matching"]), f["total"])
    r.check("filtered-card", rc == 0 and d["kind"] == "filtered" and want in t and any("Water stress at most 0.3" in x for x in t) and not any(BAD_GLYPHS.search(x) for x in t) and "filters, never scores" in t,
            "rc=%s want %r in %s" % (rc, want, t[:3]))
    rc, out, png, d = run_.og("empty", "t.solar_pv=2000&t.water_stress=0&t.soil_carbon=340")
    t = (d or {}).get("texts") or []
    r.check("empty-card", rc == 0 and d["kind"] == "empty" and "No regions within these thresholds" in t and "Loosen a threshold to read more places." in t and not any(STALE.search(x) for x in t) and info["empty"]["matching"] == [],
            "rc=%s kind=%s texts=%s data matching=%s" % (rc, (d or {}).get("kind"), t[:3], info["empty"]["matching"]))
    rc, out, png, d = run_.og("north-america", "c=north-america&t.water_stress=1.9")
    t = (d or {}).get("texts") or []
    r.check("continent-card", rc == 0 and any("North America" in x for x in t), "rc=%s texts=%s" % (rc, t[:2]))
    rc, out, png, d = run_.og("qual-only", "q.foreign_ownership=yes")
    r.check("qualitative-link-gets-brand-card", rc == 0 and d["kind"] == "home", "kind=%s (a link that chooses q.* is never counted here)" % (d or {}).get("kind"))
    rc, out, png, d = run_.og("unknown-region", "region=not-a-region")
    r.check("unknown-region-falls-through", rc == 0 and d["kind"] == "home", "kind=%s" % (d or {}).get("kind"))
    for tag in ("default", "deeper", "filtered", "empty", "north-america"):
        p = OUT / ("og-%s.png" % tag)
        r.check("png-size:%s" % tag, p.exists() and png_size(p) == (1200, 630), str(png_size(p)) if p.exists() else "missing")

    # ---- share shell -------------------------------------------------------------------------------------------------------
    rc, out, html = run_.share("default", "")
    title, desc = re.search(r"<title>(.*?)</title>", html, re.S), meta(html, "og:description")
    ok = rc == 0 and bool(title) and desc and ("%s regions" % info["words"]["regions"]) in desc and ("%s criteria" % info["words"]["criteria"]) in desc and not STALE.search(html)
    r.check("share-default", ok, "rc=%s title=%r desc=%r" % (rc, title and title.group(1), desc))
    rc, out, html = run_.share("filtered", "t.water_stress=0.3&pin=galicia")
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    f = info["filtered"]
    want = "%d of %d regions within these thresholds" % (len(f["matching"]), f["total"])
    img = meta(html, "og:image") or ""
    ok = rc == 0 and bool(title) and want in title.group(1) and img.endswith("/api/og?t.water_stress=0.3&pin=galicia") and not STALE.search(html)
    r.check("share-filtered", ok, "rc=%s title=%r og:image=%r" % (rc, title and title.group(1), img))
    rc, out, html = run_.share("solar", "t.solar_pv=1500")
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    ttl = title.group(1) if title else ""
    r.check("share-solar-title-dynamic", rc == 0 and ("regions within these thresholds" in ttl or "is within these thresholds" in ttl or "No regions within these thresholds" in ttl), "title=%r" % ttl)
    rc, out, html = run_.share("qual", "q.foreign_ownership=yes&t.solar_pv=1500")
    title = re.search(r"<title>(.*?)</title>", html, re.S)
    r.check("share-qualitative-not-counted", rc == 0 and bool(title) and title.group(1) == "Land Selection Framework", "title=%r" % (title and title.group(1)))
    probe = next((x for x in regions if x["primaryEcoregion"]), None)
    if probe:
        rc, out, html = run_.share("region", "region=" + probe["id"])
        desc, img, title = meta(html, "og:description"), meta(html, "og:image") or "", re.search(r"<title>(.*?)</title>", html, re.S)
        r.check("share-region-names-ecoregion", rc == 0 and desc and probe["primaryEcoregion"] in desc and img.endswith("/api/og?region=" + probe["id"]) and title and probe["name"] in title.group(1),
                "rc=%s title=%r desc=%r" % (rc, title and title.group(1), desc))
    rc, out, html = run_.share("deeper", "page=deeper")
    r.check("share-deeper", rc == 0 and (meta(html, "og:image") or "").endswith("/api/og?page=deeper"), "og:image=%r" % meta(html, "og:image"))

    # ---- fonts and the outbound log ----------------------------------------------------------------------------------------
    for name in ("spectral-og-500.woff",):
        try:
            with urllib.request.urlopen(ctx.base + "/vendor/fonts/" + name, timeout=20) as resp:
                body = resp.read()
                ok = resp.status == 200 and len(body) == (site / "vendor" / "fonts" / name).stat().st_size and len(body) > 10000
                detail = "%d bytes" % len(body)
        except Exception as e:
            ok, detail = False, str(e)
        r.check("font-served:%s" % name, ok, detail)
    bad = [ln for ln in run_.fetch_lines if not (ln.startswith("same-origin") and "/vendor/fonts/" in ln)]
    r.check("fetches-same-origin-fonts-only", not bad, "%d fetch lines over %d runs; unexpected: %s" % (len(run_.fetch_lines), run_.runs, bad[:3]))

    # ---- the fallback is loud ---------------------------------------------------------------------------------------------------
    rc, out, png, d = run_.og("fail-fonts", "region=alentejo", dump=False, env={"OG_FAIL_FONTS": "1"})
    r.check("fail-fonts-is-fallback-exit-2", rc == 2 and "FALLBACK" in out and not png.exists(), "rc=%s %s" % (rc, out.strip().splitlines()[0] if out.strip() else ""))

    # ---- glyphs outside the subsets, a very long name ----------------------------------------------------------------------
    synth = OUT / "synth.mjs"
    synth.write_text(SYNTH, "utf-8")
    rc, out = node([str(synth), str(site), str(OUT / "synth")])
    try:
        j = json.loads(out.strip().splitlines()[-1])
    except Exception:
        j = None
    if not j or rc != 0:
        r.check("synthetic-names-render", False, "rc=%s %s" % (rc, out[-500:]))
    else:
        ok_text = all(SUBSET.match(t) for k in j["res"] for t in j["res"][k]["texts"])
        r.check("synthetic-names-render", not j["calls"] and ok_text and all(v["bytes"] > 20000 for v in j["res"].values()),
                "fetch calls=%s subset-clean=%s sizes=%s name text=%r" % (j["calls"], ok_text, {k: v["bytes"] for k, v in j["res"].items()}, j["res"]["glyphs"]["texts"][2] if len(j["res"]["glyphs"]["texts"]) > 2 else None))
        for k in ("glyphs", "long"):
            p = OUT / ("synth-%s.png" % k)
            try:
                lp = layout_problem(p)
            except Exception as e:
                lp = "decode: %s" % e
            r.check("synthetic-layout:%s" % k, lp is None, lp or "")

    # ---- static fallbacks --------------------------------------------------------------------------------------------------------
    fresh = OUT / "static"
    rc, out = node([str(STATIC), "--out-dir", str(fresh)])
    for f in ("og.png", "og-deeper.png"):
        a, b = site / f, fresh / f
        same = a.exists() and b.exists() and a.read_bytes() == b.read_bytes()
        r.check("static-%s" % f, rc == 0 and a.exists() and png_size(a) == (1200, 630) and same, "size=%s equals a fresh render of the card functions: %s" % (png_size(a) if a.exists() else None, same))
    orphans = sorted(p.name for p in site.glob("og-*.png") if p.name not in ("og-deeper.png",))
    r.info("orphan-static-cards", "present in the site root, linked from nowhere the build knows, NOT deleted by this WP (orchestrator decides): %s" % ", ".join(orphans))

    # ---- source greps ------------------------------------------------------------------------------------------------------------
    src = {n: (site / n).read_text("utf-8") for n in ("api/og.js", "api/share.js", "lib/og-card.js", "lib/result.js")}
    r.check("runtime-edge-both", all(re.search(r"export const config = \{ runtime: 'edge' \}", src[n]) for n in ("api/og.js", "api/share.js")), "")
    r.check("no-third-party-font-host", not re.search(r"jsdelivr|googleapis|gstatic|fontsource|unpkg|cdnjs", src["api/og.js"] + src["lib/og-card.js"], re.I), "api/og.js + lib/og-card.js")
    r.check("no-comparison-glyph-in-source", not any(re.search(u"[≤≥]", s) for s in src.values()), "")
    r.check("no-stale-strings-in-source", not any(re.search(r"candidate|twenty|thirty|eight criteria|v1 sketch", src[n], re.I) for n in ("api/og.js", "api/share.js", "lib/og-card.js")), "")
    r.check("og-has-no-server-only-api", not re.search(r"\brequire\s*\(|node:|process\.cwd|__dirname", src["api/og.js"] + src["lib/og-card.js"] + src["api/share.js"]), "")
    return r.out
