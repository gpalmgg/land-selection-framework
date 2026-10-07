"""Layer sweep, request capture, basemap placeholder detector and pixel diff for the e2e harness.

PORTED (copied, with the DOM selectors and the basemap host list made parameters) from
    upgrade-2026-10/recon/tools/browser_audit.py        (the heavy final audit; it stays where it is)
Do not import across the upgrade-2026-10/ boundary: this file is the copy the test suite owns.
"""
import os
import re
import time
from urllib.parse import urlparse

try:
    from PIL import Image
    import numpy as np
    HAVE_PIL = True
except Exception:  # pragma: no cover
    HAVE_PIL = False

from .site import DEFAULT_BASEMAP_HOSTS
from . import sel as _sel

SEL = _sel.home().SEL

LAYER_ID_BY_NAME = {
    "Precipitation": "precipitation", "Water stress 2050": "water-stress",
    "Water depletion 2050": "water-depletion", "Forest loss": "forest-change",
    "Soil organic carbon": "soil-carbon", "Land cover (10m)": "land-cover",
    "Solar PV potential": "solar-pv", "Coastal flood / SLR": "coastal-flood",
    "Seismic hazard": "seismic", "Population density": "population",
    "Travel time to cities": "travel-time", "Conflict density": "conflict",
    "Ecovillage sites": "regen-network", "Terrain relief": "hillshade",
    "Topographic map": "topo", "Recent satellite": "satellite", "Night lights": "night-lights",
}
WORKS = ("ok", "slow", "no-change", "vector-or-cached")
FAILS = ("broken", "partial", "broken-at-depth", "partial-at-depth")


def fname(s):
    """Filesystem-safe, length-bounded form of a layer id (macOS limit is 255 bytes per component)."""
    s = str(s)
    return s if len(s) <= 60 else s[:50].rstrip("-") + "-" + format(abs(hash_str(s)) % 0xFFFFFF, "06x")


def hash_str(s):
    import zlib
    return zlib.crc32(s.encode("utf-8"))


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "root"


class NetLog:
    """Collects network + console telemetry for one page via CDP + Playwright events."""

    def __init__(self, page, ctx, basemap_hosts=DEFAULT_BASEMAP_HOSTS):
        self.page = page
        self.basemap_hosts = tuple(basemap_hosts)
        self.reqs = {}
        self.console = []
        self.pageerrors = []
        self.t0 = time.time()
        self.cdp = ctx.new_cdp_session(page)
        self.cdp.send("Network.enable")
        self.cdp.on("Network.requestWillBeSent", self._rws)
        self.cdp.on("Network.responseReceived", self._rr)
        self.cdp.on("Network.loadingFinished", self._lf)
        self.cdp.on("Network.loadingFailed", self._lfail)
        page.on("console", self._console)
        page.on("pageerror", lambda e: self.pageerrors.append({"text": str(e), "t": time.time() - self.t0}))

    def _rws(self, p):
        self.reqs[p["requestId"]] = {"url": p["request"]["url"], "type": p.get("type"), "t_start": p["timestamp"],
                                     "status": None, "bytes": 0, "t_end": None, "mime": None, "failed": None, "from_cache": False}

    def _rr(self, p):
        r = self.reqs.get(p["requestId"])
        if not r:
            return
        resp = p["response"]
        r["status"] = resp.get("status")
        r["mime"] = resp.get("mimeType")
        r["t_resp"] = p["timestamp"]
        r["from_cache"] = bool(resp.get("fromDiskCache") or resp.get("fromServiceWorker"))

    def _lf(self, p):
        r = self.reqs.get(p["requestId"])
        if r:
            r["bytes"] = int(p.get("encodedDataLength") or 0)
            r["t_end"] = p["timestamp"]

    def _lfail(self, p):
        r = self.reqs.get(p["requestId"])
        if r:
            r["failed"] = p.get("errorText")
            r["blocked"] = p.get("blockedReason")
            r["t_end"] = p["timestamp"]

    def _console(self, m):
        try:
            loc = m.location
            loc_s = "%s:%s" % (loc.get("url", ""), loc.get("lineNumber", "")) if loc else ""
        except Exception:
            loc_s = ""
        self.console.append({"type": m.type, "text": m.text[:500], "loc": loc_s, "t": round(time.time() - self.t0, 2)})

    def is_basemap(self, url):
        return any(h in url for h in self.basemap_hosts)

    def basemap_check(self):
        """A keyless/blocked tile provider answers 200 with ONE identical placeholder image for every tile, so status checks
        pass. Flag when >=4 basemap tiles were fetched and >=90% share one byte size under 4 KB."""
        bm = [r["bytes"] for r in self.reqs.values() if self.is_basemap(r["url"]) and r["bytes"]]
        out = {"tiles": len(bm), "distinct_sizes": len(set(bm)), "suspect_placeholder": False}
        if len(bm) >= 4:
            med = sorted(bm)[len(bm) // 2]
            near = [b for b in bm if abs(b - med) <= max(150, med * 0.1)]
            out["median_bytes"] = med
            out["suspect_placeholder"] = len(near) / len(bm) >= 0.9 and med < 4096
        return out

    def summary(self):
        reqs = list(self.reqs.values())
        failed = [{"url": r["url"], "status": r["status"], "error": r["failed"], "type": r["type"]}
                  for r in reqs if r["failed"] or (r["status"] is not None and r["status"] >= 400)]
        hard = [f for f in failed if f["error"] != "net::ERR_ABORTED"]
        by_host = {}
        for r in reqs:
            h = urlparse(r["url"]).netloc
            by_host.setdefault(h, {"n": 0, "bytes": 0})
            by_host[h]["n"] += 1
            by_host[h]["bytes"] += r["bytes"]
        return {"basemap_check": self.basemap_check(), "request_count": len(reqs),
                "transferred_bytes": sum(r["bytes"] for r in reqs), "by_host": by_host, "failed_requests": hard}


def wait_quiet(netlog, quiet_s=1.2, max_s=20):
    """Wait until no non-basemap request has been in flight/new for quiet_s seconds."""
    t_end = time.time() + max_s
    last_activity = time.time()
    seen = len(netlog.reqs)
    while time.time() < t_end:
        netlog.page.wait_for_timeout(150)
        inflight = [r for r in netlog.reqs.values() if r["t_end"] is None and not r["url"].startswith(("blob:", "data:"))]
        if len(netlog.reqs) != seen or inflight:
            seen = len(netlog.reqs)
            last_activity = time.time()
        if time.time() - last_activity >= quiet_s:
            return round(time.time() - (t_end - max_s), 2)
    return round(max_s, 2)


def map_diff(a_path, b_path):
    """Fraction of pixels that differ materially between two screenshots, plus mean abs delta."""
    if not HAVE_PIL:
        return None
    a = Image.open(a_path).convert("RGB")
    b = Image.open(b_path).convert("RGB")
    if a.size != b.size:
        b = b.resize(a.size)
    arr = np.abs(np.asarray(a, dtype=np.int16) - np.asarray(b, dtype=np.int16)).sum(axis=2)
    return {"changed_frac": round(float((arr > 24).mean()), 4), "mean_delta": round(float(arr.mean()), 2)}


def dismiss_modal(page):
    """Close the signup modal with its X button only (never touches the form)."""
    try:
        if page.evaluate("!!document.querySelector('%s.visible')" % SEL["modal"]):
            page.click(SEL["modal_close"], timeout=3000)
            page.wait_for_timeout(500)
            return True
    except Exception:
        pass
    return False


def settle_map(page, nl, max_s=12):
    return wait_quiet(nl, quiet_s=1.0, max_s=max_s)


def discover_layers(page):
    """DOM-discovered toggles: [{index, name, id, visible, pressed}]."""
    btns = page.locator(SEL["layer_buttons"])
    out = []
    for i in range(btns.count()):
        b = btns.nth(i)
        name = (b.inner_text() or "").strip().split("\n")[-1].strip()
        out.append({"index": i, "name": name, "id": LAYER_ID_BY_NAME.get(name) or slug(name),
                    "visible": b.is_visible(), "pressed": b.get_attribute("aria-pressed") == "true"})
    return out


def _panel_open(page):
    try:
        if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
            page.click(SEL["layers_toggle"])
    except Exception:
        pass


def _all_off(page, btns, n):
    for i in range(n):
        b = btns.nth(i)
        if b.get_attribute("aria-pressed") == "true" and b.is_visible():
            b.click()


def layer_sweep(page, nl, shots, label, continent, only=None):
    out = []
    btns = page.locator(SEL["layer_buttons"])
    n = btns.count()
    page.locator(SEL["map"]).scroll_into_view_if_needed()
    _panel_open(page)
    _all_off(page, btns, n)
    page.wait_for_timeout(500)
    settle_map(page, nl, 8)
    mp = page.locator(SEL["map"])
    for i in range(n):
        b = btns.nth(i)
        name = (b.inner_text() or "").strip().split("\n")[-1].strip()
        lid = LAYER_ID_BY_NAME.get(name) or slug(name)
        if only and lid not in only and name not in only:
            continue
        if not b.is_visible():
            out.append({"continent": continent, "layer_id": lid, "name": name, "verdict": "hidden-on-continent"})
            continue
        before = os.path.join(shots, "%s-layer-%s-%s-before.png" % (label, continent, fname(lid)))
        mp.screenshot(path=before)
        dismiss_modal(page)
        mark = set(nl.reqs.keys())
        cons_mark = len(nl.console)
        tc = time.time()
        b.scroll_into_view_if_needed()
        b.click()
        click_s = round(time.time() - tc, 2)
        pressed = b.get_attribute("aria-pressed")
        quiet = settle_map(page, nl, 14)
        page.wait_for_timeout(500)
        after = os.path.join(shots, "%s-layer-%s-%s-after.png" % (label, continent, fname(lid)))
        mp.screenshot(path=after)
        new = [r for k, r in nl.reqs.items() if k not in mark and not nl.is_basemap(r["url"])]
        ok = [r for r in new if r["status"] is not None and 200 <= r["status"] < 400 and not r["failed"]]
        bad = [r for r in new if (r["status"] is not None and r["status"] >= 400) or (r["failed"] and r["failed"] != "net::ERR_ABORTED")]
        aborted = [r for r in new if r["failed"] == "net::ERR_ABORTED"]
        hosts = sorted({urlparse(r["url"]).netloc for r in new})
        lat = sorted((r["t_end"] - r["t_start"]) for r in ok if r["t_end"])
        t_first_start = min((r["t_start"] for r in new), default=None)
        first_ok = None
        if ok and t_first_start and any((r.get("t_resp") or r["t_end"]) for r in ok):
            first_ok = min((r.get("t_resp") or r["t_end"]) for r in ok if (r.get("t_resp") or r["t_end"])) - t_first_start
        diff = map_diff(before, after)
        tiny = [r for r in ok if r["bytes"] and r["bytes"] <= 400 and (r["mime"] or "").startswith("image")]
        new_cons = [c for c in nl.console[cons_mark:] if c["type"] in ("error", "warning")]
        changed = diff["changed_frac"] if diff else None
        if bad and not ok:
            verdict = "broken"
        elif bad and len(bad) >= max(1, len(new) // 2):
            verdict = "broken"
        elif new and not bad and ((lat and (lat[len(lat) // 2] > 3 or lat[-1] > 8)) or (first_ok and first_ok > 4)):
            verdict = "slow"
        elif not new and (changed is not None and changed < 0.002):
            verdict = "no-change"
        elif changed is not None and changed < 0.002:
            verdict = "no-change"
        else:
            verdict = "ok"
        if bad and ok and verdict == "ok":
            verdict = "partial"
        out.append({"continent": continent, "layer_id": lid, "name": name, "aria_pressed_after_click": pressed,
                    "endpoint_hosts": hosts, "requests": len(new), "ok": len(ok), "failed": len(bad), "aborted": len(aborted),
                    "tiny_tiles": len(tiny), "bytes": sum(r["bytes"] for r in new),
                    "first_ok_s": round(first_ok, 2) if first_ok is not None else None,
                    "lat_p50_s": round(lat[len(lat) // 2], 2) if lat else None, "lat_max_s": round(lat[-1], 2) if lat else None,
                    "quiesce_s": quiet, "click_s": click_s,
                    "failed_samples": [{"url": r["url"][:220], "status": r["status"], "err": r["failed"]} for r in bad[:3]],
                    "pixels": diff, "console_in_window": new_cons[:5], "verdict": verdict, "before": before, "after": after})
        b.click()
        page.wait_for_timeout(300)
        settle_map(page, nl, 6)
    return out


def zoom_sweep(page, nl, shots, label, dblclicks=4):
    """Deep-zoom regression: tile services have their own max LOD. Zoom in with double-clicks, toggle each layer on one at a
    time and count tile successes/failures at that depth."""
    out = []
    btns = page.locator(SEL["layer_buttons"])
    n = btns.count()
    mp = page.locator(SEL["map"])
    mp.scroll_into_view_if_needed()
    _panel_open(page)
    _all_off(page, btns, n)
    box = mp.bounding_box()
    cx, cy = box["x"] + box["width"] * 0.62, box["y"] + box["height"] * 0.5
    mark0 = set(nl.reqs.keys())
    for _ in range(dblclicks):
        page.mouse.dblclick(cx, cy)
        page.wait_for_timeout(900)
    settle_map(page, nl, 8)
    zs = []
    for k, r in nl.reqs.items():
        if k in mark0:
            continue
        m = re.search(r"basemaps\.cartocdn\.com/[a-z_]+/(\d+)/", r["url"]) or re.search(r"opentopomap\.org/(\d+)/", r["url"])
        if m:
            zs.append(int(m.group(1)))
    info = {"deepest_basemap_tile_z": max(zs) if zs else None}
    sp = os.path.join(shots, "%s-zoom-deep-baseline.png" % label)
    mp.screenshot(path=sp)
    for i in range(n):
        b = btns.nth(i)
        name = (b.inner_text() or "").strip().split("\n")[-1].strip()
        lid = LAYER_ID_BY_NAME.get(name) or slug(name)
        if not b.is_visible():
            continue
        mark = set(nl.reqs.keys())
        b.scroll_into_view_if_needed()
        b.click()
        settle_map(page, nl, 8)
        page.wait_for_timeout(400)
        new = [r for k, r in nl.reqs.items() if k not in mark and not nl.is_basemap(r["url"])]
        ok = [r for r in new if r["status"] is not None and 200 <= r["status"] < 400 and not r["failed"]]
        bad = [r for r in new if (r["status"] is not None and r["status"] >= 400) or (r["failed"] and r["failed"] != "net::ERR_ABORTED")]
        after = os.path.join(shots, "%s-zoom-deep-%s.png" % (label, fname(lid)))
        mp.screenshot(path=after)
        diff = map_diff(sp, after)
        verdict = "ok"
        if bad and not ok:
            verdict = "broken-at-depth"
        elif bad:
            verdict = "partial-at-depth"
        elif not new:
            verdict = "vector-or-cached" if (diff and diff["changed_frac"] >= 0.002) else "no-change"
        out.append({"layer_id": lid, "requests": len(new), "ok": len(ok), "failed": len(bad), "verdict": verdict,
                    "failed_samples": [{"url": r["url"][:200], "status": r["status"], "err": r["failed"]} for r in bad[:2]],
                    "pixels": diff, "after": after})
        b.click()
        page.wait_for_timeout(250)
    return {"info": info, "layers": out}


def verdict_class(v):
    if v in WORKS:
        return "works"
    if v in FAILS:
        return v
    return v


def run_sweeps(h, shots, label, skip_zoom=False, only=None, retry=True, scheme="light"):
    """Live sweep over both continents plus the deep-zoom sweep, in one fresh browser. Returns
    {"layers": [...], "zoom": {...}, "mobile": ..., "discovered": {continent: [...]}, "basemap_check": ...}."""
    os.makedirs(shots, exist_ok=True)
    from .site import default_storage
    result = {"layers": [], "zoom": None, "discovered": {}, "errors": []}
    browser = h.launch()
    try:
        sess = h.session(browser, width=1440, height=900, storage=default_storage(h.site), stub=False)
        page = sess.page()
        nl = NetLog(page, sess.context, h.basemap_hosts)
        page.goto(h.base + "/", wait_until="load", timeout=60000)
        settle_map(page, nl, 15)
        dismiss_modal(page)
        result["basemap_check"] = nl.basemap_check()
        tabs = page.locator(SEL["continent_tab"])
        conts = [tabs.nth(i).get_attribute("data-continent") for i in range(tabs.count())] or [None]
        for c in conts:
            if c:
                page.locator('%s[data-continent="%s"]' % (SEL["continent_tab"], c)).click()
                page.wait_for_timeout(1000)
                settle_map(page, nl, 10)
            result["discovered"][c or "all"] = [d["id"] for d in discover_layers(page) if d["visible"]]
            try:
                rows = layer_sweep(page, nl, shots, label, c or "all", only)
                if retry:
                    for idx, row in enumerate(rows):
                        if row.get("verdict") in FAILS:
                            again = layer_sweep(page, nl, shots, label + "-retry", c or "all", [row["layer_id"]])
                            if again:
                                again[0]["retried"] = True
                                rows[idx] = again[0]
                result["layers"].extend(rows)
            except Exception as e:
                result["errors"].append("layer_sweep %s: %s" % (c, str(e)[:300]))
        if not skip_zoom:
            try:
                if conts[0]:
                    page.locator('%s[data-continent="%s"]' % (SEL["continent_tab"], conts[0])).click()
                    page.wait_for_timeout(1500)
                z = zoom_sweep(page, nl, shots, label)
                result["zoom"] = z
            except Exception as e:
                result["errors"].append("zoom_sweep: %s" % str(e)[:300])
        sess.close()
    finally:
        h.close_browser(browser)
    return result
