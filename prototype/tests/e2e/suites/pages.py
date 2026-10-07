"""pages: every page of the site, at each requested width (default 1280 and 390).

Per page x width: HTTP 200, no console error or warning, no page error, no failed own-origin request, no horizontal
overflow, exactly one h1, <title>, meta description, canonical and og:image present, JSON-LD parses, no broken image, every
internal <a href> resolves (HEAD against the local server). Extra home-page structure checks carry the known issues
(basemap placeholder, GeoJSON fetched at load, tap targets, aria-live, skip link, credit, tagline).
"""
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urlparse, urljoin

from lib import probes
from lib import sel as _sel
from lib.layers import NetLog
from lib.site import default_storage, wait_map_idle

NAME = "pages"
S = _sel.home()
SEL = S.SEL
TAP_SELECTORS = [SEL["layer_buttons"], SEL["continent_tab"], SEL["region_star"], SEL["shortlist_btn"], ".preset-chips button",
                 SEL["reset_btn"], SEL["slider"]]
SKIP_PREFIXES = ("/api/", "/share", "/_vercel/")


def _head(base, path):
    try:
        req = urllib.request.Request(base + path, method="HEAD")
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0


def _internal_paths(h, page_path, hrefs):
    out = set()
    for href in hrefs:
        if not href or href.startswith(("mailto:", "tel:", "javascript:", "#", "data:")):
            continue
        u = urlparse(urljoin(h.base + page_path, href))
        if u.scheme not in ("http", "https") or u.netloc != urlparse(h.base).netloc:
            continue
        if u.path.startswith(SKIP_PREFIXES):
            continue
        out.add(u.path or "/")
    return sorted(out)


def run(ctx):
    r = ctx.new_results(NAME)
    h = ctx
    pages = h.page_files()
    seen_links = {}
    for path in pages:
        is_home = path == "/"
        for width in h.widths:
            tag = "%s@%d" % (path, width)
            browser = h.launch()
            sess = h.session(browser, width=width, storage=default_storage(h.site), stub=None)
            page = sess.page()
            log = sess.log(page)
            nl = NetLog(page, sess.context, h.basemap_hosts) if (is_home and h.browser_name == "chromium") else None
            try:
                resp = page.goto(h.base + path, wait_until="load", timeout=60000)
                status = resp.status if resp else 0
                if is_home:
                    wait_map_idle(page)
                    page.wait_for_timeout(1500)
                else:
                    page.wait_for_timeout(500)
                facts = page.evaluate(probes.PAGE_FACTS_JS)
                r.check("http-200:" + tag, status == 200, "status %s" % status)
                errs = log.errors(own_only=True)
                r.check("console-clean:" + tag, not errs, "; ".join("%s %s" % (e["type"], e["text"][:140]) for e in errs[:4]))
                r.check("no-page-errors:" + tag, not log.pageerrors, "; ".join(log.pageerrors[:3]))
                fo = log.failed_own()
                r.check("own-requests-ok:" + tag, not fo, "; ".join("%s %s" % (f["status"] or f["error"], f["url"]) for f in fo[:4]))
                r.check("no-h-overflow:" + tag, facts["overflow"] == 0, "%d px" % facts["overflow"])
                r.check("single-h1:" + tag, len(facts["h1"]) == 1, "h1s: %s" % facts["h1"])
                r.check("title:" + tag, bool((facts["title"] or "").strip()))
                r.check("meta-description:" + tag, bool(facts["description"]))
                r.check("canonical:" + tag, bool(facts["canonical"]))
                r.check("og-image:" + tag, bool(facts["ogImage"]))
                r.check("json-ld-parses:" + tag, facts["jsonldOk"], "%d blocks" % facts["jsonld"])
                r.check("images-ok:" + tag, not facts["brokenImages"], facts["brokenImages"])
                bad = []
                for p in _internal_paths(h, path, facts["links"]):
                    if p not in seen_links:
                        seen_links[p] = _head(h.base, p)
                    if seen_links[p] >= 400 or seen_links[p] == 0:
                        bad.append("%s -> %s" % (p, seen_links[p]))
                if bad:
                    for b in bad:
                        r.check("internal-link-broken:%s:%s" % (tag, b.split(" -> ")[0]), False, b)
                else:
                    r.check("internal-links:" + tag, True)
                r.check("no-formsubmit:" + tag, not sess.guard.formsubmit, sess.guard.formsubmit)

                if is_home and width >= 1000:
                    own = [p for (_m, p, _t) in sess.guard.own_requests]
                    # bioregion*.geojson is the default-on "Bioregions" context layer (BIO-3, defaultOn: true), so loading it after first idle is intended
                    geo = sorted({p for p in own if p.endswith(".geojson") and "ecovillage" not in p and "/bioregion" not in p})
                    r.check("geojson-at-load:" + tag, not geo, "fetched before any toggle: %s" % geo)
                    if nl is not None and h.offline:
                        r.skip("basemap-placeholder:" + tag, "offline run: third-party tiles are stubbed")
                    elif nl is not None:
                        bc = nl.basemap_check()
                        r.check("basemap-placeholder:" + tag, not bc["suspect_placeholder"], bc)
                    page.keyboard.press("Tab")
                    first = page.evaluate(probes.FIRST_TAB_JS) or {}
                    is_skip = "skip" in ((first.get("cls") or "") + " " + (first.get("text") or "")).lower()
                    r.check("skip-link-first-tab:" + tag, is_skip, "first Tab stop: %s" % first)
                    for fid in ("form-status", "modal-status"):
                        info = page.evaluate(probes.ARIA_LIVE_JS, fid)
                        r.check("aria-live:#%s:%s" % (fid, tag), bool(info.get("live")), info)
                    text = facts["text"]
                    r.check("askja-credited:" + tag, bool(re.search(r"\bAskja\b", text)), "no visible credit for the originator")
                    r.check("no-collective-contact:" + tag, "The Collective" not in text,
                            "%d occurrences of 'The Collective'" % text.count("The Collective"))
                    r.check("no-five-free-tools:" + tag, "five free tools" not in text.lower(), "tagline present")
                if is_home and width < 600:
                    taps = page.evaluate(probes.TAP_TARGETS_JS, TAP_SELECTORS)
                    r.check("tap-targets-44:" + tag, not taps, "%d under 44px: %s" % (len(taps), taps[:6]))
                    mp = page.evaluate("(() => { const m = document.querySelector('%s'); if (!m) return null; const b = m.getBoundingClientRect(); return {w: Math.round(b.width), h: Math.round(b.height)}; })()" % SEL["map"])
                    r.info("map-box:" + tag, mp)
                if not is_home:
                    ink = page.evaluate(probes.INK4_CONTRAST_JS)
                    if ink.get("token") is None:
                        r.skip("contrast-ink-4:" + tag, "no --ink-4 token on this page")
                    else:
                        r.check("contrast-ink-4:" + tag, not ink["fails"], "checked %d text nodes; %s failing, e.g. %s"
                                % (ink["checked"], ink.get("nfails"), ink["fails"][:3]))
            except Exception as e:
                r.check("page-loads:" + tag, False, "exception: %s" % str(e)[:300])
            finally:
                sess.close()
                h.close_browser(browser)
    return r.out
