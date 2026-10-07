"""perf: the performance budget (map-craft 6.1 with the plan overrides) and the lazy-MapLibre / CSS-bundle A/B. Run explicitly:

    /usr/bin/python3 tests/e2e/run_all.py --port N --site SCRATCH_SITE --suite perf --json OUT --label L

Not part of `--suite all` (it takes about twenty minutes). Owned by MC-PERF; the budget numbers live in tests/e2e/perf-budget.json.

Method (same machine, same minute, headless SwiftShader like the live baseline audit):
  * every sample is a FRESH browser and context; each page and viewport is sampled `rounds` (5) times; medians are reported.
  * every `/` sample is taken twice over, UNTHROTTLED and THROTTLED (CDP network emulation 150 ms RTT, 1.6 Mbit/s down, 750 kbit/s
    up, plus Emulation.setCPUThrottlingRate(4)). The throttled run is what exposes 30 stylesheets and 100 unbundled modules.
  * the BASELINE copy of the site (verify/baseline-site/prototype, the 6bce1a3 tree) is measured in the SAME rounds, interleaved
    with the candidate and the A/B variants, so machine drift cancels. The sites are served one at a time by ONE static server on the
    assigned port (compressed with brotli quality 3, which reproduces the live Vercel transfer sizes), the served root swapping
    between samples; nothing else is ever bound.
  * the 1-minute load average is read before the run (a run that starts above the CPU count waits, up to a limit) and at the start
    of every block; every value is written to the result.
  * A/B: the four combinations of {LAZY_MAP on/off} x {CSS bundle on/off} are built from the candidate into scratch sites and
    measured with the baseline. The shipped state (the candidate) is checked against the adoption rules of perf-budget.json.
  * INP proxy: 30 slider `input` events, each timed to the second requestAnimationFrame after it, on the candidate and on the
    45-region stress site (scripts/make_stress_site.mjs), unthrottled and at 4x CPU.
  * the module-preload block is checked for being generated, matching the static import graph, and being used (no duplicate
    fetch, no console warning).

The full numbers go to the harness `extra["perf"]` (so they land in the --json report) and to verify/e2e/MC-PERF-data.json.
Environment: LSF_PERF_ROUNDS=n runs fewer rounds for development; the run then FAILS the `rounds-complete` check.
"""
import functools
import http.server
import json
import os
import re
import shutil
import socketserver
import statistics
import subprocess
import threading
import time
from pathlib import Path
from urllib.parse import unquote, urlparse

import brotli

from lib.site import BASELINE_SITE, DEFAULT_BASEMAP_HOSTS, PROTO, RESULT_DIR, U, default_storage
from lib.util import read_json, write_json

NAME = "perf"
E2E = Path(__file__).resolve().parent.parent
BUDGET = read_json(E2E / "perf-budget.json", {}) or {}
HARD = BUDGET.get("hard", {})
SCRATCH = U / "verify" / "scratch"
AB_DIR = SCRATCH / "MC-PERF-ab"
STRESS_DIR = SCRATCH / "MC-PERF-stress"
NODE = "node"

COMPRESSIBLE = {".html", ".js", ".mjs", ".css", ".json", ".geojson", ".svg", ".txt", ".xml", ".webmanifest", ".map"}
CTYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css",
          ".json": "application/json", ".geojson": "application/geo+json", ".svg": "image/svg+xml", ".png": "image/png",
          ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain",
          ".xml": "application/xml", ".pdf": "application/pdf", ".webmanifest": "application/manifest+json", ".ico": "image/x-icon"}

# What the page does to the map library in each LAZY_MAP state (index.html carries the markers; see set_lazy()).
MAPLIBRE_EAGER = ('\n  <link href="/vendor/maplibre-4.7.1/maplibre-gl.css" rel="stylesheet" />\n'
                  '  <script defer src="/vendor/maplibre-4.7.1/maplibre-gl.js"></script>\n  ')
MAPLIBRE_LAZY = ('\n  <!-- LAZY_MAP: the library and its stylesheet are requested by src/map/loader.js when the map starts '
                 '(src/config/flags.js), not by this page. -->\n  ')
MAPLIBRE_BLOCK_RE = re.compile(r"(<!-- maplibre:begin -->)(.*?)(<!-- maplibre:end -->)", re.S)
MAPLIBRE_TAG_RES = [re.compile(r'[ \t]*<link\b[^>]*maplibre-gl\.css[^>]*>[ \t]*\n?'),
                    re.compile(r'[ \t]*<script\b[^>]*maplibre-gl\.js[^>]*></script>[ \t]*\n?')]
LAZY_RE = re.compile(r"export const LAZY_MAP = (true|false);")

PERF_INIT = r"""
(() => {
  const P = window.__perf = { lcp: null, lcpEl: null, cls: 0, lt: 0, ltN: 0, mapCreated: null, mapLoaded: null };
  try { new PerformanceObserver((l) => { const e = l.getEntries(); const last = e[e.length - 1]; P.lcp = last.startTime;
    try { P.lcpEl = last.element ? (last.element.tagName + (last.element.id ? '#' + last.element.id : '')) : (last.url || null); } catch (_) {} })
    .observe({ type: 'largest-contentful-paint', buffered: true }); } catch (_) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) P.cls += e.value; })
    .observe({ type: 'layout-shift', buffered: true }); } catch (_) {}
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) { P.lt += e.duration; P.ltN += 1; } })
    .observe({ type: 'longtask', buffered: true }); } catch (_) {}
  const poll = () => {
    try {
      const m = window.__maps && window.__maps[0];
      if (m && P.mapCreated === null) P.mapCreated = performance.now();
      if (m && P.mapLoaded === null && m.loaded()) P.mapLoaded = performance.now();
    } catch (_) {}
    if (P.mapLoaded === null) setTimeout(poll, 25);
  };
  poll();
})();
"""

INP_INIT_JS = """() => {
  let sl = Array.from(document.querySelectorAll('input[type=range]')).filter((e) => /^slider-/.test(e.id || ''));
  if (!sl.length) sl = Array.from(document.querySelectorAll('input[type=range]'));
  if (!sl.length) return 0;
  const raf2 = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  window.__inpStep = async (i) => {
    const s = sl[i % sl.length];
    const min = +s.min, max = +s.max, step = +s.step || 1, span = max - min;
    const k = Math.floor(i / sl.length);
    let v = min + Math.round((((k * 0.37) + (i * 0.11)) % 1) * span / step) * step;
    if (v === +s.value) v = v + step <= max ? v + step : v - step;
    const t0 = performance.now();
    s.value = String(v);
    s.dispatchEvent(new Event('input', { bubbles: true }));
    await raf2();
    return performance.now() - t0;
  };
  return sl.length;
}"""

LOAD_REJECT = {"max": 0}


# ------------------------------------------------------------------------------------------------ the server
class _Handler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, *a):
        pass

    def do_GET(self):
        self._serve(True)

    def do_HEAD(self):
        self._serve(False)

    def _serve(self, with_body):
        srv = self.server
        site = srv.site
        p = unquote(urlparse(self.path).path)
        if p.endswith("/"):
            p += "index.html"
        fp = (site / p.lstrip("/")).resolve()
        if site not in fp.parents and fp != site:
            return self._send(403, b"forbidden", "text/plain", False, with_body)
        if not fp.is_file() or p.startswith("/_vercel/") or p.startswith("/api/"):
            return self._send(404, b"not found", "text/plain", False, with_body)
        ext = fp.suffix.lower()
        st = fp.stat()
        key = (str(fp), st.st_mtime_ns, st.st_size)
        entry = srv.cache.get(key)
        if entry is None:
            raw = fp.read_bytes()
            br = brotli.compress(raw, quality=int(BUDGET.get("server", {}).get("brotli_quality", 3))) if ext in COMPRESSIBLE else None
            entry = (raw, br)
            srv.cache[key] = entry
        raw, br = entry
        use_br = br is not None and "br" in (self.headers.get("Accept-Encoding") or "")
        self._send(200, br if use_br else raw, CTYPES.get(ext, "application/octet-stream"), use_br, with_body)

    def _send(self, status, body, ctype, encoded, with_body):
        self.send_response(status)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        if encoded:
            self.send_header("Content-Encoding", "br")
        self.send_header("Vary", "Accept-Encoding")
        self.end_headers()
        if with_body:
            try:
                self.wfile.write(body)
            except Exception:
                pass


class _Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True
    request_queue_size = 64


def start_perf_server(port, site):
    srv = _Server(("127.0.0.1", int(port)), _Handler)
    srv.site = Path(site).resolve()
    srv.cache = {}
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv


# ----------------------------------------------------------------------------------------------- site builders
def sh(cmd, cwd=None, timeout=600):
    r = subprocess.run(cmd, cwd=str(cwd) if cwd else None, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, timeout=timeout)
    return r.returncode, r.stdout.decode("utf-8", "replace")


def site_state(site):
    html = (Path(site) / "index.html").read_text("utf-8")
    flags = (Path(site) / "src" / "config" / "flags.js").read_text("utf-8")
    m = LAZY_RE.search(flags)
    return {"lazy": bool(m and m.group(1) == "true"), "bundle": bool(re.search(r"""href=["']\./src/styles/bundle\.css""", html))}


def set_lazy(site, on):
    site = Path(site)
    fp = site / "src" / "config" / "flags.js"
    txt = fp.read_text("utf-8")
    fp.write_text(LAZY_RE.sub("export const LAZY_MAP = %s;" % ("true" if on else "false"), txt), "utf-8")
    ip = site / "index.html"
    html = ip.read_text("utf-8")
    inner = MAPLIBRE_LAZY if on else MAPLIBRE_EAGER
    if MAPLIBRE_BLOCK_RE.search(html):
        html = MAPLIBRE_BLOCK_RE.sub(lambda m: m.group(1) + inner + m.group(3), html, count=1)
    else:
        for rx in MAPLIBRE_TAG_RES:
            html = rx.sub("", html)
        anchor = "<!--s:modulepreload--><!--/s-->"
        html = html.replace(anchor, anchor + "\n  <!-- maplibre:begin -->" + inner + "<!-- maplibre:end -->", 1) if anchor in html else html
    ip.write_text(html, "utf-8")


def set_bundle(site, on):
    script = PROTO / "scripts" / "bundle_css.mjs"
    state = site_state(site)
    if on and not state["bundle"]:
        rc, out = sh([NODE, str(script), "--root", str(site), "--bundle", "--quiet"], cwd=PROTO)
        if rc:
            raise RuntimeError("bundle_css --bundle failed: %s" % out[-600:])
    if not on and state["bundle"]:
        rc, out = sh([NODE, str(script), "--root", str(site), "--unbundle", "--quiet"], cwd=PROTO)
        if rc:
            raise RuntimeError("bundle_css --unbundle failed: %s" % out[-600:])
    # a bundled or unbundled index.html needs its ?v= values stamped again
    sh([NODE, str(PROTO / "scripts" / "stamp_build.mjs"), "--root", str(site), "--write", "--quiet"], cwd=PROTO)


GATE_FN = """
// EXPERIMENT (tests/e2e/suites/perf.py, scratch only): load the library after the load event on idle (2.5 s cap) or when the map is near the viewport.
function mapGate() {
  return new Promise((resolve) => {
    let done = false;
    const go = () => { if (done) return; done = true; resolve(); };
    const el = document.getElementById('map');
    const afterLoad = () => { const idle = window.requestIdleCallback || ((f) => setTimeout(f, 200)); idle(go, { timeout: 2500 }); };
    if (document.readyState === 'complete') afterLoad(); else window.addEventListener('load', afterLoad, { once: true });
    if ('IntersectionObserver' in window && el) {
      const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); go(); } }, { rootMargin: '600px 0px' });
      io.observe(el);
    }
    setTimeout(go, 8000);
  });
}
"""


def patch_gate(site):
    fp = Path(site) / "src" / "map" / "map.js"
    t = fp.read_text("utf-8")
    if "ensureMapLibre().then((lib) => {" not in t:
        return False
    t = t.replace("ensureMapLibre().then((lib) => {", "mapGate().then(() => ensureMapLibre()).then((lib) => {", 1) + GATE_FN
    fp.write_text(t, "utf-8")
    return True


def make_variant(src, dst, lazy, bundle):
    dst = Path(dst)
    src = Path(src)
    if dst.exists():
        shutil.rmtree(str(dst))
    dst.mkdir(parents=True)
    # copy the deployable files only (the working tree holds a virtualenv and raw data); a scratch site is its own deploy list
    from importlib.machinery import SourceFileLoader
    dl = SourceFileLoader("lsf_deploy_filelist", str(E2E / "tools" / "deploy_filelist.py")).load_module()
    ign = src / ".vercelignore"
    for f in [f for f in dl.deploy_list(src, ign if ign.is_file() else None) if not f.startswith(".vercel/")]:
        (dst / f).parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(str(src / f), str(dst / f))
    if not (dst / "src" / "styles" / "bundle.css").exists() and (src / "src" / "styles" / "bundle.css").exists():
        shutil.copy2(str(src / "src" / "styles" / "bundle.css"), str(dst / "src" / "styles" / "bundle.css"))
    st = site_state(dst)
    if st["lazy"] != lazy:
        set_lazy(dst, lazy)
    # bundle.css must reflect the chunks of THIS tree when switching it on
    if bundle:
        if not (dst / "src" / "styles" / "bundle.css").exists() or not st["bundle"]:
            set_bundle(dst, True)
            sh([NODE, str(PROTO / "scripts" / "bundle_css.mjs"), "--root", str(dst), "--write", "--quiet"], cwd=PROTO)
    elif st["bundle"]:
        set_bundle(dst, False)
    return dst


# ------------------------------------------------------------------------------------------------- measuring
def load1():
    try:
        return round(os.getloadavg()[0], 2)
    except Exception:
        return None


def ncpu():
    return os.cpu_count() or 1


def wait_for_load(max_wait, poll, log):
    t0 = time.time()
    first = load1()
    cur = first
    waited = 0
    while cur is not None and cur > ncpu() and time.time() - t0 < max_wait:
        log.append({"t": time.strftime("%H:%M:%S"), "load1": cur, "action": "wait"})
        time.sleep(poll)
        cur = load1()
        waited = round(time.time() - t0)
    return {"first": first, "at_start": cur, "waited_s": waited, "cpus": ncpu(), "ok": cur is not None and cur <= ncpu()}


def med(xs):
    xs = [x for x in xs if x is not None]
    return round(statistics.median(xs), 4) if xs else None


def p95(xs):
    xs = sorted(xs)
    return xs[max(0, min(len(xs) - 1, int(0.95 * len(xs) + 0.999999) - 1))] if xs else None


def origin_of(url):
    p = urlparse(url)
    return p.netloc


def sample(h, srv, site, path, width, throttled, quiet_s, budget, own_html_preloads=None):
    """One fresh-browser load. Returns a flat dict of metrics."""
    srv.site = Path(site).resolve()
    own = "127.0.0.1:%d" % h.port
    th = budget.get("throttle", {})
    browser = h.launch()
    s = None
    try:
        s = h.session(browser, width=width, scheme="light", reduced_motion=False, stub=False, extra_init=(PERF_INIT,))
        page = s.page()
        log = s.log(page)
        cdp = s.context.new_cdp_session(page)
        cdp.send("Network.enable")
        cdp.send("Page.enable")
        initiators = {}
        cdp_fin = {}                  # requestId -> (monotonic ts, encodedDataLength): the page's own session, so ordering against the load event is exact
        marks = {}

        def on_lf(p):
            cdp_fin[p["requestId"]] = (p["timestamp"], int(p.get("encodedDataLength") or 0))
        cdp.on("Network.loadingFinished", on_lf)
        cdp.on("Page.loadEventFired", lambda p: marks.setdefault("load", p["timestamp"]))

        def on_rws(p):
            try:
                ini = p.get("initiator") or {}
                frames = ((ini.get("stack") or {}).get("callFrames") or [])
                initiators[p["requestId"]] = {"url": p["request"]["url"], "type": p.get("type"), "ini_type": ini.get("type"), "ts": p.get("timestamp"),
                                              "ini_url": ini.get("url") or (frames[0].get("url") if frames else None)}
            except Exception:
                pass
        cdp.on("Network.requestWillBeSent", on_rws)
        if throttled:
            cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": th.get("latency_ms", 150),
                                                          "downloadThroughput": th.get("down_bytes_per_s", 200000),
                                                          "uploadThroughput": th.get("up_bytes_per_s", 93750)})
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": th.get("cpu_rate", 4)})
        started, done = [], []
        act = {"t": time.time(), "pending": 0}

        def on_req(r):
            if r.url.startswith(("http://", "https://")):
                started.append(("req", r.url, r.resource_type, time.time() * 1000.0))
                act["t"] = time.time()
                act["pending"] += 1

        def on_fin(r):
            if r.url.startswith(("http://", "https://")):
                done.append((r, True))
                act["t"] = time.time()
                act["pending"] = max(0, act["pending"] - 1)

        def on_fail(r):
            if r.url.startswith(("http://", "https://")):
                done.append((r, False))
                act["t"] = time.time()
                act["pending"] = max(0, act["pending"] - 1)
        s.context.on("request", on_req)
        s.context.on("requestfinished", on_fin)
        s.context.on("requestfailed", on_fail)
        t_nav = time.time()
        page.goto(h.base + path, wait_until="load", timeout=120000)
        t_load_wall = time.time() - t_nav
        # LCP is final enough once the first paint has happened; wait for it, then (unthrottled) for network quiet.
        try:
            page.wait_for_function("() => window.__perf && window.__perf.lcp !== null", timeout=45000)
        except Exception:
            pass
        t_quiet = time.time()
        limit = 40 if throttled else 25
        while time.time() - t_quiet < limit:
            page.wait_for_timeout(100)
            if act["pending"] == 0 and time.time() - act["t"] >= quiet_s:
                break
        m = page.evaluate("""() => { const P = window.__perf || {}; const n = performance.getEntriesByType('navigation')[0] || {};
          const fcp = (performance.getEntriesByName('first-contentful-paint')[0] || {}).startTime;
          return { lcp: P.lcp, lcpEl: P.lcpEl, cls: P.cls, lt: P.lt, ltN: P.ltN, mapCreated: P.mapCreated, mapLoaded: P.mapLoaded, fcp: fcp,
                   dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, maps: (window.__maps || []).length,
                   hasLib: typeof maplibregl !== 'undefined',
                   preloads: Array.from(document.querySelectorAll('link[rel=preload][as=font]')).map((l) => l.href),
                   mp: Array.from(document.querySelectorAll('link[rel=modulepreload]')).map((l) => l.href) }; }""")
        # sizes are read now, from the finished request objects (not inside the event handlers: an RPC there reorders the events)
        fin_rows = []
        for rq, ok in list(done):
            if not ok:
                continue
            try:
                sz = rq.sizes()
                b = int(sz["responseBodySize"]) + int(sz["responseHeadersSize"])
            except Exception:
                b = 0
            fin_rows.append(("fin", rq.url, rq.resource_type, b, None))
        errs = [{"type": c["type"], "text": c["text"][:200], "url": c["url"][-80:]} for c in log.errors(own_only=True)]
        errs3 = len(log.errors(own_only=False)) - len(errs)
        pageerrors = list(log.pageerrors)
        failed_own = log.failed_own()
    finally:
        if s is not None:
            s.close()
        h.close_browser(browser)

    # ---- fold. Totals come from the context-level events (they include Web Worker requests, as the baseline audit did). "At the load
    # event" comes from the page's own CDP session (Page.loadEventFired against Network.loadingFinished / requestWillBeSent, one clock):
    # it sees every main-thread request, including the map tiles; a request made by a Web Worker (the ecovillage GeoJSON, 2 KB) is not in it.
    fins = fin_rows
    reqs_all = started
    load_ts = marks.get("load")
    by_id = {rid: rec for rid, rec in initiators.items() if (rec.get("url") or "").startswith(("http://", "https://"))}
    fins_load = [rec_id for rec_id in by_id if load_ts is not None and rec_id in cdp_fin and cdp_fin[rec_id][0] <= load_ts]
    reqs_load = [rec_id for rec_id, rec in by_id.items() if load_ts is not None and rec.get("ts") is not None and rec["ts"] <= load_ts]
    load_bytes = sum(cdp_fin[i][1] for i in fins_load)
    load_js_bytes = sum(cdp_fin[i][1] for i in fins_load if by_id[i].get("type") == "Script")
    late_rows = [(by_id[i]["url"].replace("http://127.0.0.1:%d" % h.port, "")[-60:], cdp_fin[i][1], round((cdp_fin[i][0] - load_ts) * 1000)) for i in by_id
                 if i in cdp_fin and load_ts is not None and cdp_fin[i][0] > load_ts]
    is_own = lambda u: origin_of(u) == own
    is_js = lambda e: e[2] == "script"
    basemap = lambda u: any(b in u for b in h.basemap_hosts)
    out = {
        "lcp": m.get("lcp"), "lcp_el": m.get("lcpEl"), "fcp": m.get("fcp"), "cls": m.get("cls") or 0, "long_task_ms": m.get("lt") or 0,
        "long_tasks": m.get("ltN") or 0, "dcl": m.get("dcl"), "load": m.get("load"), "load_wall_s": round(t_load_wall, 2),
        "req_load": len(reqs_load), "req_total": len(reqs_all),
        "bytes_load": load_bytes, "bytes_total": sum(f[3] for f in fins),
        "js_load": load_js_bytes, "js_total": sum(f[3] for f in fins if is_js(f)),
        "css_requests": sum(1 for r in reqs_all if r[2] == "stylesheet" and is_own(r[1])),
        "css_bytes": sum(f[3] for f in fins if f[2] == "stylesheet" and is_own(f[1])),
        "script_requests_own": sum(1 for r in reqs_all if r[2] == "script" and is_own(r[1])),
        "font_bytes": sum(f[3] for f in fins if f[2] == "font"),
        "font_preloaded_bytes": sum(f[3] for f in fins if f[2] == "font" and f[1] in set(m.get("preloads") or [])),
        "basemap_bytes": sum(f[3] for f in fins if basemap(f[1])),
        "third_party_bytes": sum(f[3] for f in fins if not is_own(f[1])),
        "geojson": sorted({urlparse(f[1]).path.rsplit("/", 1)[-1] for f in fins if is_own(f[1]) and urlparse(f[1]).path.endswith(".geojson")}),
        "geojson_bytes": sum(f[3] for f in fins if is_own(f[1]) and urlparse(f[1]).path.endswith(".geojson")),
        "map_created_ms": m.get("mapCreated"), "map_loaded_ms": m.get("mapLoaded"), "maps_at_end": m.get("maps"),
        "console": errs, "console_third_party": errs3, "pageerrors": pageerrors[:3], "failed_own": [f["url"][-80:] for f in failed_own[:4]],
        "modulepreload_n": len(m.get("mp") or []),
        "load_avg": load1(),
    }
    # diagnostics: the heaviest own scripts and the third-party bytes by host/service (what the budget is spent on)
    scripts = {}
    for f in fins:
        if f[2] == "script":
            scripts[f[1].replace("http://127.0.0.1:%d" % h.port, "").split("?")[0]] = f[3]
    out["after_load"] = sorted(late_rows, key=lambda x: -x[1])[:8]
    out["after_load_n"] = len(late_rows)
    out["top_scripts"] = sorted(scripts.items(), key=lambda kv: -kv[1])[:14]
    hosts = {}
    for f in fins:
        if not is_own(f[1]):
            pu = urlparse(f[1])
            svc = re.sub(r"/(tile|MapServer/tile)/.*$", "", pu.path)[-48:]
            k = "%s%s" % (pu.netloc, svc)
            e = hosts.setdefault(k, [0, 0])
            e[0] += 1
            e[1] += f[3]
    out["third_party"] = sorted(([k, v[0], v[1]] for k, v in hosts.items()), key=lambda x: -x[2])[:10]
    # duplicate fetches of one own module URL (a modulepreload that does not match the import => fetched twice)
    seen = {}
    for r in reqs_all:
        if r[2] == "script" and is_own(r[1]):
            seen[r[1]] = seen.get(r[1], 0) + 1
    out["duplicate_scripts"] = sorted(u.split("127.0.0.1:%d" % h.port)[-1] for u, n in seen.items() if n > 1)
    # network-observed import chain: depth of the own script requests following the initiator chain
    by_url = {}
    for rec in initiators.values():
        if rec["type"] == "Script" and is_own(rec["url"]):
            by_url.setdefault(rec["url"], rec)
    memo = {}

    def depth(u, guard=()):
        if u in memo:
            return memo[u]
        rec = by_url.get(u)
        d = 1
        if rec and rec["ini_type"] == "script" and rec["ini_url"] and rec["ini_url"] != u and rec["ini_url"] in by_url and u not in guard:
            d = depth(rec["ini_url"], guard + (u,)) + 1
        memo[u] = d
        return d
    out["chain_depth"] = max([depth(u) for u in by_url] or [0])
    return out


def task_ms(cdp):
    for m in cdp.send("Performance.getMetrics")["metrics"]:
        if m["name"] == "TaskDuration":
            return m["value"] * 1000.0
    return 0.0


def inp_run(h, srv, site, width, cpu_rate, budget):
    """30 slider `input` events. Two numbers per event: the frame latency (input to the second requestAnimationFrame, the plan's INP
    proxy) and the MAIN-THREAD work (CDP TaskDuration around the event and two frames). In this harness (software GL) the frame
    latency of ANY page change is dominated by the rasteriser; the main-thread number is the one the page controls (MC-SCALE, same
    finding)."""
    srv.site = Path(site).resolve()
    browser = h.launch()
    s = None
    try:
        s = h.session(browser, width=width, scheme="light", reduced_motion=False, stub=False, extra_init=(PERF_INIT,),
                      storage=default_storage(h.site, modal=False))
        page = s.page()
        cdp = s.context.new_cdp_session(page)
        cdp.send("Performance.enable")
        page.goto(h.base + "/", wait_until="load", timeout=120000)
        try:
            page.wait_for_function("() => { const m = window.__maps && window.__maps[0]; if (!m) return true; try { return m.loaded() && !m.isMoving(); } catch (e) { return true; } }", timeout=30000)
        except Exception:
            pass
        page.wait_for_timeout(800)
        try:        # the hero draw-in runs for a few seconds after load; measure the interaction once the page has settled
            page.wait_for_function("() => document.getAnimations().filter((a) => a.playState === 'running').length === 0", timeout=12000)
        except Exception:
            pass
        n_sliders = page.evaluate(INP_INIT_JS)
        regions = page.evaluate("() => document.querySelectorAll('.region-card').length")
        if not n_sliders:
            return {"error": "no sliders", "region_cards": regions}
        if cpu_rate and cpu_rate > 1:
            cdp.send("Emulation.setCPUThrottlingRate", {"rate": cpu_rate})
        frames, mains = [], []
        for i in range(int(budget.get("inp", {}).get("events", 30))):
            t0 = task_ms(cdp)
            frames.append(page.evaluate("(i) => window.__inpStep(i)", i))
            mains.append(task_ms(cdp) - t0)
        return {"frame_p95_ms": round(p95(frames), 1), "frame_median_ms": round(statistics.median(frames), 1), "frame_max_ms": round(max(frames), 1),
                "main_p95_ms": round(p95(mains), 1), "main_median_ms": round(statistics.median(mains), 1), "main_max_ms": round(max(mains), 1),
                "events": len(frames), "sliders": n_sliders, "region_cards": regions, "cpu_rate": cpu_rate,
                "frame_ms": [round(x, 1) for x in frames], "main_ms": [round(x, 1) for x in mains]}
    finally:
        if s is not None:
            s.close()
        h.close_browser(browser)


# ------------------------------------------------------------------------------------- module preload checks
IMPORT_RES = [re.compile(r"""(?:^|[;\s}])import\s+(?:[\w*{}\s,$]+?\s+from\s+)?["']([^"']+)["']"""),
              re.compile(r"""(?:^|[;\s}])export\s+(?:\*|\{[^}]*\})(?:\s+as\s+\w+)?\s+from\s+["']([^"']+)["']""")]


def static_closure(site, entries):
    site = Path(site)
    seen, order, stack = set(), [], list(entries)
    while stack:
        rel = stack.pop(0)
        if rel in seen:
            continue
        seen.add(rel)
        order.append(rel)
        fp = site / rel.lstrip("/")
        if not fp.is_file():
            continue
        txt = fp.read_text("utf-8", "ignore")
        txt = re.sub(r"/\*.*?\*/", "", txt, flags=re.S)
        txt = re.sub(r"(^|[^:'\"`\\])//[^\n]*", r"\1", txt)
        for rx in IMPORT_RES:
            for spec in rx.findall(txt):
                if spec.startswith("."):
                    base = os.path.normpath(os.path.join(os.path.dirname(rel), spec)).replace(os.sep, "/")
                elif spec.startswith("/"):
                    base = spec
                else:
                    continue
                base = base.split("?")[0]
                if not base.startswith("/"):
                    base = "/" + base
                stack.append(base)
    return order


def modulepreload_check(site):
    html = (Path(site) / "index.html").read_text("utf-8")
    mp = re.findall(r"""<link\b[^>]*\brel=["']modulepreload["'][^>]*\bhref=["']([^"']+)["']""", html)
    mp = [u.split("?")[0] for u in mp]
    entries = []
    for src in re.findall(r"""<script\b[^>]*\btype=["']module["'][^>]*\bsrc=["']([^"']+)["']""", html):
        u = src.split("?")[0]
        entries.append(os.path.normpath(os.path.join("/", u)).replace(os.sep, "/") if u.startswith(".") else u)
    closure = static_closure(site, entries)
    deps = [u for u in closure if u not in entries]
    gen = bool(re.search(r"<!--s:modulepreload-->\s*<link", html))
    rc, out = sh([NODE, str(PROTO / "scripts" / "stamp_build.mjs"), "--root", str(site), "--check", "--quiet"], cwd=PROTO)
    return {"generated_block": gen, "preload_n": len(mp), "entries": entries, "closure_n": len(closure),
            "unused": sorted(set(mp) - set(deps)), "missing": sorted(set(deps) - set(mp)),
            "duplicates": sorted({u for u in mp if mp.count(u) > 1}), "stamp_check_exit": rc, "stamp_check_tail": out[-300:]}


def import_graph(site):
    rc, out = sh([NODE, str(E2E / "tools" / "import_graph.mjs"), "--root", str(site)], cwd=PROTO)
    orch = re.search(r"longest orchestration chain: (\d+) modules", out)
    full = re.search(r"longest full chain[^:]*: (\d+) modules", out)
    return {"exit": rc, "orchestration_chain": int(orch.group(1)) if orch else None, "full_chain": int(full.group(1)) if full else None,
            "violations": [l.strip() for l in out.splitlines() if l.strip().startswith("- ")][:30], "tail": out[-900:]}


# ------------------------------------------------------------------------------------------------------ main
def stats_for(samples, key):
    return med([s.get(key) for s in samples])


def summarise(samples):
    keys = ["lcp", "fcp", "cls", "long_task_ms", "dcl", "load", "req_load", "req_total", "bytes_load", "bytes_total", "js_load", "js_total",
            "css_requests", "css_bytes", "script_requests_own", "font_bytes", "font_preloaded_bytes", "basemap_bytes", "third_party_bytes",
            "geojson_bytes", "chain_depth", "map_created_ms", "map_loaded_ms"]
    out = {k: stats_for(samples, k) for k in keys}
    out["n"] = len(samples)
    out["lcp_all"] = [round(s["lcp"]) if s.get("lcp") is not None else None for s in samples]
    out["max_chain_depth"] = max([s.get("chain_depth") or 0 for s in samples] or [0])
    out["max_req_load"] = max([s.get("req_load") or 0 for s in samples] or [0])
    out["max_cls"] = max([s.get("cls") or 0 for s in samples] or [0])
    if any(s.get("map_created_ms") is not None and s.get("load") is not None for s in samples):
        out["map_after_load_ms"] = med([(s["map_created_ms"] - s["load"]) for s in samples if s.get("map_created_ms") is not None and s.get("load") is not None])
    out["maps_missing"] = sum(1 for s in samples if not s.get("maps_at_end"))
    return out


def decide(shipped, delta_gain, thr, extra_ok=True):
    """Adopt when the gain reaches the threshold; hysteresis keeps a shipped decision while the gain stays on its side of the half/1.5x band."""
    adopt_now = bool(delta_gain is not None and delta_gain >= thr and extra_ok)
    if shipped:
        keep = bool(delta_gain is not None and delta_gain >= thr * 0.5 and extra_ok)
        return keep, adopt_now
    hold = not (delta_gain is not None and delta_gain >= thr * 1.5 and extra_ok)
    return (not hold), adopt_now


def run(h):
    r = h.new_results(NAME)
    t_start = time.time()
    budget = BUDGET
    rounds_cfg = int(budget.get("rounds", 5))
    rounds = int(os.environ.get("LSF_PERF_ROUNDS", rounds_cfg))
    quick = rounds != rounds_cfg
    cand = Path(h.site)
    base = Path(BASELINE_SITE)
    result = {"rounds": rounds, "reduced": quick, "candidate": str(cand), "baseline": str(base), "machine": {"cpus": ncpu()},
              "method": "fresh browser per sample; baseline interleaved with the candidate and the A/B variants; brotli q%s server; throttle %s" % (
                  budget.get("server", {}).get("brotli_quality"), json.dumps(budget.get("throttle")))}
    h.extra["perf"] = result

    # the harness bound the port for its own server; this suite owns the same port with a compressing multi-root server
    try:
        h._srv.shutdown()
        h._srv.server_close()
    except Exception:
        pass
    srv = start_perf_server(h.port, cand)

    try:
        load_log = []
        lg = budget.get("load_gate", {})
        result["load_gate"] = wait_for_load(lg.get("max_wait_s", 600), lg.get("poll_s", 20), load_log)
        result["load_wait_log"] = load_log[-10:]
        r.check("load-at-start", result["load_gate"]["ok"],
                "1-minute load average %s vs %d CPUs after waiting %ss" % (result["load_gate"]["at_start"], ncpu(), result["load_gate"]["waited_s"]))
        r.check("rounds-complete", not quick, "%d rounds run, %d required (LSF_PERF_ROUNDS is a development switch)" % (rounds, rounds_cfg))

        # ------------------------------------------------------------------ variants of the home page
        st = site_state(cand)
        result["candidate_state"] = st
        AB_DIR.mkdir(parents=True, exist_ok=True)
        variants = {"baseline": base}
        combos = {}
        for lazy in (False, True):
            for bundle in (False, True):
                name = "L%dB%d" % (lazy, bundle)
                combos[name] = (lazy, bundle)
                if (lazy, bundle) == (st["lazy"], st["bundle"]):
                    variants[name] = cand           # the candidate itself, no copy
                else:
                    variants[name] = make_variant(cand, AB_DIR / name, lazy, bundle)
        # The idle / near-viewport gate is in src/map/loader.js now (LAZY_MAP on = gated), so the L1 variants ARE the gated map; the
        # scratch-only gate experiment of the first run (a patched map.js) is no longer needed and not built.
        result["gate_experiment"] = {"built": False, "note": "superseded: the gate shipped in src/map/loader.js (mapGate); the L1 variants measure it"}
        cand_name = "L%dB%d" % (st["lazy"], st["bundle"])
        result["variants"] = {k: str(v) for k, v in variants.items()}
        result["candidate_variant"] = cand_name

        vw = budget.get("viewports", {"desktop": 1440, "mobile": 390})
        order = list(variants.keys())
        home = {}            # (variant, vp, mode) -> [samples]
        blocks = []
        for vp_name, width in vw.items():
            for mode in ("unthrottled", "throttled"):
                blk = {"viewport": vp_name, "mode": mode, "load_at_start": load1(), "t": time.strftime("%H:%M:%S")}
                for i in range(rounds):
                    rot = order[i % len(order):] + order[:i % len(order)]
                    for vname in rot:
                        smp = sample(h, srv, variants[vname], "/", width, mode == "throttled", 3.0 if mode == "unthrottled" else 1.0, budget)
                        smp["variant"] = vname
                        home.setdefault((vname, vp_name, mode), []).append(smp)
                blk["load_at_end"] = load1()
                blocks.append(blk)
                print("  perf: / %s %s done (%.0fs elapsed, load %s)" % (vp_name, mode, time.time() - t_start, load1()), flush=True)
        result["blocks"] = blocks
        summ = {"%s|%s|%s" % k: summarise(v) for k, v in home.items()}
        result["home"] = summ
        result["home_raw"] = {"%s|%s|%s" % k: v for k, v in home.items()}

        # ------------------------------------------------------------------ the other budget pages (candidate only)
        pages = {"alentejo": "/region/alentejo.html", "nova-scotia": "/region/nova-scotia.html", "deeper": "/deeper.html"}
        others = {}
        for pname, ppath in pages.items():
            if not (cand / ppath.lstrip("/")).is_file():
                r.check("page-exists:%s" % pname, False, "%s is not in the scratch site" % ppath)
                continue
            for vp_name, width in vw.items():
                for mode in ("unthrottled", "throttled"):
                    lst = [sample(h, srv, cand, ppath, width, mode == "throttled", 1.2, budget) for _ in range(rounds)]
                    others[(pname, vp_name, mode)] = lst
        result["pages"] = {"%s|%s|%s" % k: summarise(v) for k, v in others.items()}
        result["pages_raw"] = {"%s|%s|%s" % k: v for k, v in others.items()}
        print("  perf: other pages done (%.0fs elapsed)" % (time.time() - t_start), flush=True)

        # ------------------------------------------------------------------ INP proxy: real data and the 45-region stress site
        stress_n = int(budget.get("inp", {}).get("stress_regions", 45))
        rc, out = sh([NODE, str(PROTO / "scripts" / "make_stress_site.mjs"), "--regions", str(stress_n), "--out", str(STRESS_DIR), "--src", str(PROTO)], cwd=PROTO)
        result["stress_build"] = {"exit": rc, "tail": out[-300:]}
        inp = {}
        if rc == 0:
            sh([NODE, str(PROTO / "scripts" / "stamp_build.mjs"), "--root", str(STRESS_DIR), "--write", "--quiet"], cwd=PROTO)
            # the stress site is a copy of the working tree's prototype/: apply the candidate's bundle/lazy state to it so INP runs on the same shape
            for name, site in (("baseline", base), ("real", cand), ("stress", STRESS_DIR)):
                for cpu in (1, budget.get("throttle", {}).get("cpu_rate", 4)):
                    inp["%s|cpu%dx" % (name, cpu)] = inp_run(h, srv, site, vw.get("desktop", 1440), cpu, budget)
        result["inp"] = inp
        print("  perf: INP done (%.0fs elapsed)" % (time.time() - t_start), flush=True)

        # ------------------------------------------------------------------ module preload + import graph
        mpc = modulepreload_check(cand)
        result["modulepreload"] = mpc
        result["import_graph"] = import_graph(cand)

        # ------------------------------------------------------------------ evaluation
        def hm(vname, vp, mode):
            return summ.get("%s|%s|%s" % (vname, vp, mode), {})

        def raw(vname, vp, mode):
            return home.get((vname, vp, mode), [])

        cands = lambda vp, mode: hm(cand_name, vp, mode)
        calib = {"baseline_js_bytes_desktop": hm("baseline", "desktop", "unthrottled").get("js_total"),
                 "live_baseline_js_bytes_desktop": budget.get("baseline_live", {}).get("home_desktop", {}).get("js_bytes"),
                 "baseline_bytes_after_quiet_desktop": hm("baseline", "desktop", "unthrottled").get("bytes_total"),
                 "live_baseline_bytes_desktop": budget.get("baseline_live", {}).get("home_desktop", {}).get("bytes")}
        result["calibration"] = calib

        for vp in ("desktop", "mobile"):
            c = cands(vp, "unthrottled")
            ct = cands(vp, "throttled")
            b = hm("baseline", vp, "unthrottled")
            bt = hm("baseline", vp, "throttled")
            lcp_lim = HARD.get("home_lcp_%s_ms" % vp)
            r.check("home-lcp-%s" % vp, c.get("lcp") is not None and c["lcp"] <= lcp_lim, "median %s ms vs limit %s (runs %s); baseline copy %s ms" % (c.get("lcp"), lcp_lim, c.get("lcp_all"), b.get("lcp")))
            r.check("home-bytes-at-load-%s" % vp, c.get("bytes_load") is not None and c["bytes_load"] <= HARD["home_bytes_at_load"], "median %s B vs limit %s" % (c.get("bytes_load"), HARD["home_bytes_at_load"]))
            q_lim = HARD["home_bytes_after_quiet_%s" % vp]
            r.check("home-bytes-after-quiet-%s" % vp, c.get("bytes_total") is not None and c["bytes_total"] <= q_lim, "median %s B vs limit %s (baseline copy %s B)" % (c.get("bytes_total"), q_lim, b.get("bytes_total")))
            r.check("home-js-bytes-%s" % vp, c.get("js_total") is not None and c["js_total"] <= HARD["home_js_bytes_brotli"], "median %s B vs limit %s (baseline copy %s B)" % (c.get("js_total"), HARD["home_js_bytes_brotli"], b.get("js_total")))
            if st["lazy"]:
                r.check("home-js-at-load-lazy-%s" % vp, c.get("js_load") is not None and c["js_load"] <= HARD["home_js_bytes_at_load_if_lazy"], "median %s B at the load event vs limit %s" % (c.get("js_load"), HARD["home_js_bytes_at_load_if_lazy"]))
            r.check("home-cls-%s" % vp, c.get("max_cls") is not None and c["max_cls"] <= HARD["home_cls"], "worst run %s, median %s vs limit %s" % (round(c.get("max_cls") or 0, 4), c.get("cls"), HARD["home_cls"]))
            r.check("home-requests-at-load-%s" % vp, c.get("max_req_load", 0) <= HARD["home_requests_at_load"], "median %s, worst %s vs limit %s" % (c.get("req_load"), c.get("max_req_load"), HARD["home_requests_at_load"]))
            r.check("home-import-chain-%s" % vp, c.get("max_chain_depth", 0) <= HARD["import_chain_hops"], "observed own-script initiator chain, worst run %s hops vs limit %s" % (c.get("max_chain_depth"), HARD["import_chain_hops"]))
            r.check("home-fonts-%s" % vp, (c.get("font_bytes") or 0) <= HARD["fonts_bytes_all"], "all fonts %s B vs limit %s" % (c.get("font_bytes"), HARD["fonts_bytes_all"]))
            r.check("home-fonts-preloaded-%s" % vp, (c.get("font_preloaded_bytes") or 0) <= HARD["fonts_bytes_preloaded"], "preloaded fonts %s B vs limit %s" % (c.get("font_preloaded_bytes"), HARD["fonts_bytes_preloaded"]))
            r.check("home-basemap-bytes-%s" % vp, (c.get("basemap_bytes") or 0) <= HARD["basemap_bytes"], "basemap bytes %s vs limit %s" % (c.get("basemap_bytes"), HARD["basemap_bytes"]))
            # throttled gate against the interleaved baseline copy
            if ct.get("lcp") is not None and bt.get("lcp") is not None:
                lim = bt["lcp"] * HARD["throttled_lcp_factor"] + HARD["throttled_lcp_slack_ms"]
                r.check("home-lcp-throttled-vs-baseline-%s" % vp, ct["lcp"] <= lim, "candidate throttled median %s ms vs baseline throttled median %s ms x %s + %s = %s ms (runs %s)" % (
                    ct["lcp"], bt["lcp"], HARD["throttled_lcp_factor"], HARD["throttled_lcp_slack_ms"], round(lim), ct.get("lcp_all")))
            else:
                r.check("home-lcp-throttled-vs-baseline-%s" % vp, False, "no throttled LCP: candidate %s baseline %s" % (ct.get("lcp"), bt.get("lcp")))
            # raw-sample hygiene: console, page errors, geojson, duplicates
            samples = raw(cand_name, vp, "unthrottled") + raw(cand_name, vp, "throttled")
            cons = [e for smp in samples for e in smp.get("console", [])]
            r.check("home-no-console-warning-%s" % vp, not cons, "%d own-origin console warning/error(s): %s" % (len(cons), cons[:3]))
            perr = [e for smp in samples for e in smp.get("pageerrors", [])]
            r.check("home-no-page-errors-%s" % vp, not perr, perr[:3])
            fo = sorted({u for smp in samples for u in smp.get("failed_own", [])})
            r.check("home-no-failed-own-requests-%s" % vp, not fo, fo[:4])
            geo = sorted({g for smp in samples for g in smp.get("geojson", []) if "ecovillage" not in g and not g.startswith("bioregion")})
            r.check("home-geojson-before-toggle-%s" % vp, not geo, "fetched before any toggle besides the ecovillage and default-on bioregion layers: %s" % geo)
            dup = sorted({d for smp in samples for d in smp.get("duplicate_scripts", [])})
            r.check("home-no-duplicate-module-fetch-%s" % vp, not dup, "own scripts fetched more than once: %s" % dup[:6])
            gj = sorted({g for smp in samples for g in smp.get("geojson", [])})
            r.info("home-geojson-fetched-%s" % vp, {"files": gj, "median_bytes": c.get("geojson_bytes")})
            r.info("home-throttled-%s" % vp, {k: ct.get(k) for k in ("lcp", "fcp", "bytes_load", "js_load", "req_load", "long_task_ms", "load", "map_after_load_ms")})
            r.info("home-targets-%s" % vp, "target LCP %s ms, bytes at load %s" % (budget.get("target", {}).get("home_lcp_%s_ms" % vp), budget.get("target", {}).get("home_bytes_at_load")))

        # other budget pages
        for pname in pages:
            for vp in ("desktop", "mobile"):
                c = result["pages"].get("%s|%s|unthrottled" % (pname, vp))
                if not c:
                    continue
                if pname == "deeper":
                    lim_l, lim_b = HARD["deeper_lcp_ms"], HARD["deeper_bytes"]
                else:
                    lim_l, lim_b = HARD["region_page_lcp_ms"], HARD["region_page_bytes"]
                r.check("page-lcp:%s:%s" % (pname, vp), c.get("lcp") is not None and c["lcp"] <= lim_l, "median %s ms vs limit %s (runs %s)" % (c.get("lcp"), lim_l, c.get("lcp_all")))
                r.check("page-bytes:%s:%s" % (pname, vp), c.get("bytes_total") is not None and c["bytes_total"] <= lim_b, "median %s B vs limit %s" % (c.get("bytes_total"), lim_b))
                r.info("page-fonts:%s:%s" % (pname, vp), "%s B of fonts (the 240 KB limit is a limit for `/`)" % c.get("font_bytes"))
                r.check("page-cls:%s:%s" % (pname, vp), (c.get("max_cls") or 0) <= HARD["home_cls"], "worst run %s" % round(c.get("max_cls") or 0, 4))
                samples = others.get((pname, vp, "unthrottled"), []) + others.get((pname, vp, "throttled"), [])
                cons = [e for smp in samples for e in smp.get("console", [])]
                r.check("page-no-console-warning:%s:%s" % (pname, vp), not cons, cons[:3])
        for pname in pages:
            for vp in ("desktop", "mobile"):
                t = result["pages"].get("%s|%s|throttled" % (pname, vp))
                if t:
                    r.info("page-throttled:%s:%s" % (pname, vp), {"lcp": t.get("lcp"), "bytes": t.get("bytes_total")})

        # INP: both numbers are gates. The frame latency (input to the second requestAnimationFrame) is the plan's proxy: p95 <= 100 ms
        # at 1x and <= 200 ms at 4x CPU on the 45-region stress site. The main-thread work per tick (CDP TaskDuration) is reported beside it
        # so a failure can be told apart: main-thread low and frame high means paint/raster cost (software GL here; the baseline copy
        # measured with the same method is in the detail).
        if "stress|cpu1x" not in inp:
            r.check("inp-stress-built", False, "make_stress_site.mjs failed: %s" % result["stress_build"].get("tail"))
        for key, res in inp.items():
            name, cpu = key.split("|")
            if "error" in res:
                r.check("inp:%s" % key, False, res)
                continue
            lim_main = HARD["inp_p95_ms_cpu4x"] if cpu != "cpu1x" else HARD["inp_p95_ms_desktop"]
            lim_frame = lim_main
            bl = inp.get("baseline|%s" % cpu, {})
            detail = "frame p95 %s ms (median %s, max %s), main-thread p95 %s ms (median %s); %s events over %s sliders, %s region cards; baseline copy (20 regions, same method) frame p95 %s ms, main-thread p95 %s ms" % (
                res["frame_p95_ms"], res["frame_median_ms"], res["frame_max_ms"], res["main_p95_ms"], res["main_median_ms"], res["events"], res["sliders"], res.get("region_cards"),
                bl.get("frame_p95_ms"), bl.get("main_p95_ms"))
            if name == "stress":
                r.check("inp-stress-regions", res.get("region_cards", 0) >= 1, "%s region cards" % res.get("region_cards"))
                r.check("inp-frame:%s" % key, res["frame_p95_ms"] <= lim_frame, "%s vs limit %s ms" % (detail, lim_frame))
                r.check("inp-main-thread:%s" % key, res["main_p95_ms"] <= lim_main, "%s vs limit %s ms" % (detail, lim_main))
            else:
                r.info("inp:%s" % key, detail)

        # module preload
        r.check("modulepreload-block-generated", mpc["generated_block"] and mpc["preload_n"] > 0, "preload links: %d; generated markers present: %s" % (mpc["preload_n"], mpc["generated_block"]))
        r.check("modulepreload-matches-stamp", mpc["stamp_check_exit"] == 0, mpc["stamp_check_tail"])
        r.check("modulepreload-no-unused-target", not mpc["unused"], "preloaded but not in the entry modules' static import graph: %s" % mpc["unused"][:8])
        r.check("modulepreload-covers-graph", not mpc["missing"], "static imports not preloaded (each is a waterfall hop): %s" % mpc["missing"][:8])
        r.check("modulepreload-no-duplicates", not mpc["duplicates"], mpc["duplicates"][:6])
        ig = result["import_graph"]
        r.info("import-graph-static", "static orchestration chain %s modules, full chain %s (informational: modulepreload flattens the waterfall; the gate is the observed network chain above); tools/import_graph.mjs exit %s with %d line(s) of findings in files this WP does not own" % (
            ig.get("orchestration_chain"), ig.get("full_chain"), ig["exit"], len(ig.get("violations", []))))

        # ------------------------------------------------------------------ the A/B decisions
        ab = budget.get("ab", {})
        decisions = {}

        def pair_gain(a_name, b_name, metric, vp, mode):
            a, b = hm(a_name, vp, mode).get(metric), hm(b_name, vp, mode).get(metric)
            return None if a is None or b is None else round(a - b, 1)

        # lazy map: compare the same bundle state with LAZY_MAP off vs on; the decision uses the better viewport of the throttled runs
        for flag, rule in (("lazy_map", ab.get("lazy_map", {})), ("css_bundle", ab.get("css_bundle", {}))):
            rows = {}
            for vp in ("desktop", "mobile"):
                for mode in ("throttled", "unthrottled"):
                    for other in (0, 1):
                        if flag == "lazy_map":
                            off, on = "L0B%d" % other, "L1B%d" % other
                        else:
                            off, on = "L%dB0" % other, "L%dB1" % other
                        rows["%s|%s|other=%d" % (vp, mode, other)] = {
                            "lcp_gain_ms": pair_gain(off, on, "lcp", vp, mode), "long_task_gain_ms": pair_gain(off, on, "long_task_ms", vp, mode),
                            "bytes_load_gain": pair_gain(off, on, "bytes_load", vp, mode), "js_load_gain": pair_gain(off, on, "js_load", vp, mode),
                            "req_load_gain": pair_gain(off, on, "req_load", vp, mode),
                            "off": {"lcp": hm(off, vp, mode).get("lcp"), "long_task_ms": hm(off, vp, mode).get("long_task_ms"), "map_after_load_ms": hm(off, vp, mode).get("map_after_load_ms")},
                            "on": {"lcp": hm(on, vp, mode).get("lcp"), "long_task_ms": hm(on, vp, mode).get("long_task_ms"), "map_after_load_ms": hm(on, vp, mode).get("map_after_load_ms")}}
            other_now = int(st["bundle"]) if flag == "lazy_map" else int(st["lazy"])
            gains_lcp = [rows["%s|throttled|other=%d" % (vp, other_now)]["lcp_gain_ms"] for vp in ("desktop", "mobile")]
            gains_lt = [rows["%s|throttled|other=%d" % (vp, other_now)]["long_task_gain_ms"] for vp in ("desktop", "mobile")]
            best_lcp = max([g for g in gains_lcp if g is not None] or [None]) if any(g is not None for g in gains_lcp) else None
            best_lt = max([g for g in gains_lt if g is not None] or [None]) if any(g is not None for g in gains_lt) else None
            shipped = st["lazy"] if flag == "lazy_map" else st["bundle"]
            ratios = []
            if best_lcp is not None:
                ratios.append(best_lcp / float(rule.get("lcp_ms", 100)))
            if flag == "lazy_map" and best_lt is not None:
                ratios.append(best_lt / float(rule.get("long_task_ms", 100)))
            ratio = max(ratios) if ratios else None
            extra = {}
            map_ok = True
            if flag == "lazy_map":
                after = [hm("L1B%d" % other_now, vp, mode).get("map_after_load_ms") for vp in ("desktop", "mobile") for mode in ("throttled", "unthrottled")]
                map_ok = all(a is not None and a <= rule.get("map_after_load_ms", 2500) for a in after) and all(
                    not hm("L1B%d" % other_now, vp, mode).get("maps_missing") for vp in ("desktop", "mobile") for mode in ("throttled", "unthrottled"))
                extra = {"best_throttled_long_task_gain_ms": best_lt, "map_after_load_ms_when_lazy": after, "map_within_cap": map_ok}
            adopt = bool(ratio is not None and ratio >= 1.0 and map_ok)
            # BUDGET-FORCED adoption (MC-PERF, 2026-10-06): lazy MapLibre is also adopted when the eager page breaks the bytes-at-load hard
            # limit (G8) in a viewport and the lazy page keeps within it in that same viewport. That is a hard gate, not a taste: the
            # LCP gain rule above does not apply to it, and it never lets the shipped state be judged inconsistent while it holds.
            if flag == "lazy_map":
                eager = "L0B%d" % other_now
                lazy_n = "L1B%d" % other_now
                lim_b = HARD["home_bytes_at_load"]
                forced_rows = {}
                for vp in ("desktop", "mobile"):
                    e_b = hm(eager, vp, "unthrottled").get("bytes_load")
                    l_b = hm(lazy_n, vp, "unthrottled").get("bytes_load")
                    forced_rows[vp] = {"eager_bytes_at_load": e_b, "lazy_bytes_at_load": l_b, "limit": lim_b}
                forced = bool(map_ok and all(v["eager_bytes_at_load"] is not None and v["lazy_bytes_at_load"] is not None and v["eager_bytes_at_load"] > lim_b >= v["lazy_bytes_at_load"] for v in forced_rows.values()))
                extra["forced_by_bytes_at_load_budget"] = forced
                extra["forced_rows"] = forced_rows
                adopt = adopt or forced
            # an adopted option holds while the gain stays at or above half the threshold; an unadopted one holds while it stays below 1.5 times
            consistent = bool(ratio is not None and ratio >= 0.5 and map_ok) if shipped else bool(ratio is None or ratio < 1.5 or not map_ok)
            if flag == "lazy_map" and extra.get("forced_by_bytes_at_load_budget"):
                consistent = bool(shipped)
            decisions[flag] = dict({"adopt": adopt, "shipped": bool(shipped), "shipped_consistent": consistent, "rule": rule, "gain_over_threshold": None if ratio is None else round(ratio, 2),
                                    "best_throttled_lcp_gain_ms": best_lcp, "rows": rows}, **extra)
        if "LG" in variants:
            ref = "L%dB%d" % (0, int(st["bundle"]))
            exp = {}
            for vp in ("desktop", "mobile"):
                for mode in ("throttled", "unthrottled"):
                    g, o = hm("LG", vp, mode), hm(ref, vp, mode)
                    exp["%s|%s" % (vp, mode)] = {
                        "lcp_gain_ms": None if g.get("lcp") is None or o.get("lcp") is None else round(o["lcp"] - g["lcp"], 1),
                        "long_task_gain_ms": None if g.get("long_task_ms") is None or o.get("long_task_ms") is None else round(o["long_task_ms"] - g["long_task_ms"], 1),
                        "bytes_at_load": {"eager": o.get("bytes_load"), "gated": g.get("bytes_load")},
                        "js_at_load": {"eager": o.get("js_load"), "gated": g.get("js_load")},
                        "js_total": {"eager": o.get("js_total"), "gated": g.get("js_total")},
                        "requests_at_load": {"eager": o.get("req_load"), "gated": g.get("req_load")},
                        "map_after_load_ms_gated": g.get("map_after_load_ms")}
            result["gate_experiment"]["results"] = exp
            result["gate_experiment"]["reference_variant"] = ref
        result["decisions"] = decisions
        for flag, d in decisions.items():
            r.check("ab-%s-shipped-matches-rule" % flag, d["shipped_consistent"],
                    "shipped=%s, rule adopt=%s; best throttled LCP gain %s ms%s (threshold %s)" % (
                        d["shipped"], d["adopt"], d.get("best_throttled_lcp_gain_ms"),
                        ("; long-task gain %s ms; map within cap %s" % (d.get("best_throttled_long_task_gain_ms"), d.get("map_within_cap"))) if flag == "lazy_map" else "",
                        json.dumps(d["rule"])))
        if st["bundle"]:
            rc, out = sh([NODE, str(PROTO / "scripts" / "bundle_css.mjs"), "--root", str(cand), "--check"], cwd=PROTO)
            r.check("bundle-css-check", rc == 0, out[-300:])
        r.info("loads", {"start": result["load_gate"], "blocks": [(b["viewport"], b["mode"], b["load_at_start"], b["load_at_end"]) for b in blocks]})
    finally:
        try:
            srv.shutdown()
            srv.server_close()
        except Exception:
            pass
        # the harness' own stop() calls shutdown on its (already stopped) server: nothing else is bound
        result["seconds"] = round(time.time() - t_start, 1)
        try:
            write_json(RESULT_DIR / "MC-PERF-data.json", result)
        except Exception:
            pass
        fails = [x for x in r.out if x["status"] == "fail"]
        if h.label == "MC-PERF":
            write_json(RESULT_DIR / "MC-PERF.json", {"wp": "MC-PERF", "status": "pass" if not fails else "fail", "finished": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                                                        "suite": "perf", "failures": [{"test": x["test"], "detail": x["detail"][:300]} for x in fails], "data": "MC-PERF-data.json"})
    return r.out
