"""Static server + guarded Playwright contexts for the e2e harness.

Everything a suite needs lives on `Harness` (the `ctx` handed to `suites/<name>.py: run(ctx)`):

    ctx.base                       http://127.0.0.1:<port>
    ctx.site                       Path of the site directory being served
    ctx.widths                     viewport widths requested (default 1280,390)
    ctx.offline                    True => third-party requests are stubbed (structure-only runs)
    ctx.launch()                   a fresh browser (one per page that owns a WebGL map is the safe pattern)
    ctx.session(browser, ...)      a guarded context (see Session) ; session.page() gives a Page with collectors
    ctx.new_results(suite_name)    a Results collector: r.check(test, ok, detail), r.skip(test, why)

Safety rules baked in (map-craft 3.5):
  * every request to formsubmit.co is aborted and RECORDED; any recorded attempt fails the run
  * tests never click a submit control, never call form.submit() and never call the handlers
  * `window.va` is replaced by a recorder (analytics guard); `window.__maps` records every maplibregl.Map
  * the Vercel insights script 404 is allow-listed
"""
import base64
import functools
import http.server
import json
import os
import re
import socketserver
import sys
import threading
import time
from pathlib import Path
from urllib.parse import urlparse

E2E = Path(__file__).resolve().parent.parent          # prototype/tests/e2e
PROTO = E2E.parent.parent                              # prototype/
R = Path(os.environ.get("LSF_ROOT") or PROTO.parent)   # repo root
U = R / "upgrade-2026-10"
BASELINE_COMMIT = "6bce1a3"
BASELINE_SITE = U / "verify" / "baseline-site" / "prototype"
BASELINE_DIR = U / "verify" / "baseline"
RESULT_DIR = U / "verify" / "e2e"

FIXED_NOW_MS = 1790000000000          # 2026-09-21T14:13:20Z: any fixed anchor will do
CHROMIUM_ARGS = ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist",
                 "--enable-webgl", "--disable-dev-shm-usage"]
DEFAULT_BASEMAP_HOSTS = ("basemaps.cartocdn.com", "tiles.openfreemap.org", "tiles.versatiles.org",
                         "tile.openstreetmap.org", "services.arcgisonline.com/ArcGIS/rest/services/Canvas")
ALLOWED_404 = ("/_vercel/insights/script.js", "/_vercel/speed-insights/script.js")
GL_NOISE = ("GL Driver Message", "CONTEXT_LOST_WEBGL", "GPU stall due to ReadPixels",
            "Automatic fallback to software WebGL")
FORMSUBMIT_RE = re.compile(r"^https?://([^/]*\.)?formsubmit\.co([/:?#]|$)", re.I)

PNG_1X1 = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==")

# ----------------------------------------------------------------------------------------------- init scripts
INIT_ANALYTICS = r"""
(() => {
  window.__vaEvents = [];
  const rec = function () {
    try {
      const a = Array.prototype.slice.call(arguments);
      if (a[0] === 'event' && a[1] && typeof a[1] === 'object') {
        const p = a[1];
        window.__vaEvents.push({ name: p.name, keys: Object.keys(p).filter(k => k !== 'name').sort(), payload: JSON.parse(JSON.stringify(p)) });
      }
    } catch (e) {}
  };
  try {
    Object.defineProperty(window, 'va', { configurable: true, get() { return rec; }, set() { /* the insights script must not replace the recorder */ } });
  } catch (e) { window.va = rec; }
})();
"""

INIT_MAPS = r"""
(() => {
  window.__maps = [];
  let _ml;
  const wrap = (ml) => {
    try {
      if (ml && ml.Map && !ml.Map.__lsfWrapped) {
        const Base = ml.Map;
        class LsfMap extends Base { constructor(o) { super(o); try { window.__maps.push(this); } catch (e) {} } }
        LsfMap.__lsfWrapped = true;
        ml.Map = LsfMap;
      }
    } catch (e) {}
    return ml;
  };
  try {
    Object.defineProperty(window, 'maplibregl', { configurable: true, get() { return _ml; }, set(v) { _ml = wrap(v); } });
  } catch (e) {}
})();
"""

INIT_FIXED_DATE = r"""
(() => {
  const ANCHOR = %d, T0 = performance.now(), RealDate = Date;
  const now = () => ANCHOR + Math.round(performance.now() - T0);
  class FixedDate extends RealDate {
    constructor(...a) { if (a.length === 0) super(now()); else super(...a); }
    static now() { return now(); }
  }
  window.Date = FixedDate;
})();
""" % FIXED_NOW_MS

TEST_STYLE_CSS = "*,*::before,*::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}"
INIT_TEST_STYLE = r"""
(() => {
  const css = %s;
  const add = () => {
    const root = document.head || document.documentElement;
    if (!root) return false;
    const s = document.createElement('style'); s.setAttribute('data-lsf-test', ''); s.textContent = css; root.appendChild(s); return true;
  };
  if (!add()) { const mo = new MutationObserver(() => { if (add()) mo.disconnect(); }); mo.observe(document, { childList: true, subtree: true }); }
})();
""" % json.dumps(TEST_STYLE_CSS)


def init_storage(items):
    return "(() => { try { %s } catch (e) {} })();" % " ".join(
        "localStorage.setItem(%s, %s);" % (json.dumps(k), json.dumps(v)) for k, v in items.items())


# --------------------------------------------------------------------------------------------------- server
class _Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = dict(http.server.SimpleHTTPRequestHandler.extensions_map)
    extensions_map.update({".js": "text/javascript", ".mjs": "text/javascript", ".geojson": "application/geo+json",
                           ".webp": "image/webp", ".woff2": "font/woff2", ".svg": "image/svg+xml", ".json": "application/json",
                           ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json"})

    def log_message(self, *a):
        pass

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


class _Server(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


def start_server(site, port):
    handler = functools.partial(_Handler, directory=str(site))
    srv = _Server(("127.0.0.1", int(port)), handler)
    t = threading.Thread(target=srv.serve_forever, daemon=True)
    t.start()
    return srv


# ----------------------------------------------------------------------------------------------- collectors
class Results:
    """Collects test results for one suite. `check(test, ok, detail)`; `skip(test, why)`; `.out` is the list returned by run()."""

    def __init__(self, suite):
        self.suite = suite
        self.out = []

    def check(self, test, ok, detail=""):
        self.out.append({"suite": self.suite, "test": test, "status": "pass" if ok else "fail", "detail": str(detail)[:2000]})
        return bool(ok)

    def skip(self, test, why=""):
        self.out.append({"suite": self.suite, "test": test, "status": "skip", "detail": str(why)[:500]})

    def info(self, test, detail):
        self.out.append({"suite": self.suite, "test": test, "status": "info", "detail": str(detail)[:4000]})


class Guard:
    def __init__(self, own_host_port):
        self.own = own_host_port
        self.formsubmit = []
        self.third_hosts = {}
        self.own_requests = []          # (method, path, resource_type)

    def own_url(self, url):
        p = urlparse(url)
        return p.scheme in ("http", "https") and p.netloc == self.own


class PageLog:
    def __init__(self, page, guard):
        self.guard = guard
        self.console = []
        self.pageerrors = []
        self.failed = []                # {url, status, error, own, type}
        self.noise = 0
        page.on("console", self._console)
        page.on("pageerror", lambda e: self.pageerrors.append(str(e)[:400]))
        page.on("requestfailed", self._failed)
        page.on("response", self._resp)

    def _console(self, m):
        try:
            loc = m.location or {}
        except Exception:
            loc = {}
        url = loc.get("url", "") if isinstance(loc, dict) else ""
        text = m.text or ""
        if any(a in url or a in text for a in ALLOWED_404):
            return
        if m.type in ("error", "warning") and any(g in text for g in GL_NOISE):
            self.noise += 1
            return
        self.console.append({"type": m.type, "text": text[:400], "url": url, "own": (not url) or self.guard.own_url(url)})

    def _failed(self, r):
        err = ""
        try:
            err = r.failure or ""
        except Exception:
            pass
        if "ERR_ABORTED" in err:
            return
        if any(a in r.url for a in ALLOWED_404):
            return
        self.failed.append({"url": r.url[:300], "status": None, "error": err[:120], "own": self.guard.own_url(r.url), "type": r.resource_type})

    def _resp(self, r):
        try:
            if r.status >= 400 and not any(a in r.url for a in ALLOWED_404):
                self.failed.append({"url": r.url[:300], "status": r.status, "error": "", "own": self.guard.own_url(r.url), "type": r.request.resource_type})
        except Exception:
            pass

    def errors(self, own_only=True):
        out = []
        for c in self.console:
            if c["type"] in ("error", "warning") and (c["own"] or not own_only):
                out.append(c)
        return out

    def failed_own(self):
        return [f for f in self.failed if f["own"] and not FORMSUBMIT_RE.match(f["url"])]


def _stub_body(url, rtype):
    path = urlparse(url).path.lower()
    if rtype == "image" or re.search(r"\.(png|jpe?g|gif|webp|avif)$", path):
        return 200, "image/png", PNG_1X1
    if re.search(r"\.(pbf|mvt|pmtiles)$", path):
        return 200, "application/x-protobuf", b""
    if rtype == "stylesheet":
        return 200, "text/css", b"/* lsf stub */"
    if rtype == "script":
        return 200, "text/javascript", b"/* lsf stub */"
    if rtype == "font":
        return 204, "font/woff2", b""
    if re.search(r"/styles?/|positron|liberty|bright|style\.json", path):
        return 200, "application/json", b'{"version":8,"sources":{},"layers":[]}'
    if "geojson" in path or path.endswith(".json") or rtype in ("fetch", "xhr", "other"):
        return 200, "application/json", b'{"type":"FeatureCollection","features":[]}'
    return 204, "text/plain", b""


class Session:
    """A guarded Playwright context. Use `.page()` to get a Page; `.log(page)` its PageLog."""

    def __init__(self, harness, context, guard):
        self.h = harness
        self.context = context
        self.guard = guard
        self._logs = {}

    def page(self):
        pg = self.context.new_page()
        self._logs[id(pg)] = PageLog(pg, self.guard)
        return pg

    def log(self, page):
        return self._logs[id(page)]

    def events(self, page):
        try:
            return page.evaluate("window.__vaEvents || []")
        except Exception:
            return []

    def close(self):
        try:
            self.h.guards.append(self.guard)
            self.context.close()
        except Exception:
            pass


class Harness:
    def __init__(self, site, port, browser_name="chromium", offline=False, widths=(1280, 390), strict=False,
                 baseline_dir=None, label="", basemap_hosts=None):
        self.site = Path(site).resolve()
        self.port = int(port)
        self.browser_name = browser_name
        self.offline = offline
        self.widths = tuple(widths)
        self.strict = strict
        self.baseline_dir = Path(baseline_dir) if baseline_dir else BASELINE_DIR
        self.label = label
        self.basemap_hosts = tuple(basemap_hosts) if basemap_hosts else DEFAULT_BASEMAP_HOSTS
        self.base = "http://127.0.0.1:%d" % self.port
        self.guards = []
        self.extra = {}                 # suites may leave artifacts here (e.g. analytics events)
        self._srv = None
        self._pw = None
        self._pwm = None
        self._browsers = []

    # lifecycle ----------------------------------------------------------------------------------------
    def start(self):
        from playwright.sync_api import sync_playwright
        if not self.site.is_dir():
            raise SystemExit("site directory not found: %s" % self.site)
        self._srv = start_server(self.site, self.port)
        self._pwm = sync_playwright()
        self._pw = self._pwm.start()
        return self

    def stop(self):
        for b in self._browsers:
            try:
                b.close()
            except Exception:
                pass
        self._browsers = []
        try:
            if self._pwm:
                self._pwm.stop()
        except Exception:
            pass
        try:
            if self._srv:
                self._srv.shutdown()
                self._srv.server_close()
        except Exception:
            pass

    def __enter__(self):
        return self.start()

    def __exit__(self, *a):
        self.stop()

    # browsers -----------------------------------------------------------------------------------------
    def browser_installed(self):
        try:
            bt = getattr(self._pw, self.browser_name)
            return Path(bt.executable_path).exists()
        except Exception:
            return False

    def launch(self):
        bt = getattr(self._pw, self.browser_name)
        kw = {"headless": True}
        if self.browser_name == "chromium":
            kw["args"] = CHROMIUM_ARGS
        b = bt.launch(**kw)
        self._browsers.append(b)
        return b

    def close_browser(self, b):
        try:
            b.close()
        except Exception:
            pass
        if b in self._browsers:
            self._browsers.remove(b)

    # contexts -----------------------------------------------------------------------------------------
    def session(self, browser, width=1280, height=None, scheme="light", reduced_motion=True, storage=None,
                mobile=None, scale=1, stub=None, freeze_date=False, kill_motion=False, permissions=None,
                extra_init=()):
        """storage: dict of localStorage items seeded before page scripts; None seeds nothing.
        stub: None => follow ctx.offline; True/False forces third-party stubbing."""
        stub = self.offline if stub is None else stub
        height = height or (844 if width < 600 else 900)
        mobile = (width < 600) if mobile is None else mobile
        kw = dict(viewport={"width": int(width), "height": int(height)}, device_scale_factor=scale,
                  color_scheme=scheme, reduced_motion="reduce" if reduced_motion else "no-preference")
        if self.browser_name != "firefox":
            kw["is_mobile"] = bool(mobile)
        kw["has_touch"] = bool(mobile)
        if permissions and self.browser_name == "chromium":
            kw["permissions"] = list(permissions)
        ctx = browser.new_context(**kw)
        guard = Guard("127.0.0.1:%d" % self.port)

        def on_request(req):
            try:
                u = req.url
                p = urlparse(u)
                if p.scheme not in ("http", "https"):
                    return
                if p.netloc == guard.own:
                    guard.own_requests.append((req.method, p.path, req.resource_type))
                else:
                    guard.third_hosts[p.netloc] = guard.third_hosts.get(p.netloc, 0) + 1
            except Exception:
                pass

        ctx.on("request", on_request)
        if stub:
            def stub_handler(route, request):
                status, ctype, body = _stub_body(request.url, request.resource_type)
                route.fulfill(status=status, content_type=ctype, body=body, headers={"access-control-allow-origin": "*"})
            ctx.route(re.compile(r"^https?://(?!(127\.0\.0\.1|localhost)(:|/|$))"), stub_handler)

        def formsubmit_handler(route, request):
            guard.formsubmit.append(request.url)
            route.abort()
        ctx.route(FORMSUBMIT_RE, formsubmit_handler)       # registered last => matched first

        ctx.add_init_script(INIT_ANALYTICS)
        ctx.add_init_script(INIT_MAPS)
        if storage:
            ctx.add_init_script(init_storage(storage))
        if freeze_date:
            ctx.add_init_script(INIT_FIXED_DATE)
        if kill_motion:
            ctx.add_init_script(INIT_TEST_STYLE)
        for s in extra_init:
            ctx.add_init_script(s)
        return Session(self, ctx, guard)

    # helpers ------------------------------------------------------------------------------------------
    def new_results(self, suite):
        return Results(suite)

    def url(self, path="/"):
        return self.base + (path if path.startswith("/") else "/" + path)

    def formsubmit_attempts(self):
        out = []
        for g in self.guards:
            out.extend(g.formsubmit)
        return out

    def page_files(self):
        """(path, label) of every page the pages/discipline suites cover, from the filesystem."""
        pages = ["/", "/deeper.html"]
        reg = self.site / "region"
        if reg.is_dir():
            pages += ["/region/%s" % p.name for p in sorted(reg.glob("*.html"))]
        for extra in ("arrive.html", "host.html", "terms-of-arrival.html"):
            if (self.site / extra).is_file():
                pages.append("/" + extra)
        return pages


# -------------------------------------------------------------------------------------- page-level helpers
def goto_settled(page, url, timeout=60000, map_wait=True, extra_ms=500):
    """Navigate, wait for `load`, then (when a MapLibre map was constructed) for it to be loaded and idle."""
    page.goto(url, wait_until="load", timeout=timeout)
    if map_wait:
        wait_map_idle(page)
    page.wait_for_timeout(extra_ms)


def wait_map_idle(page, timeout=25000):
    """Wait until the map exists and is idle. LAZY_MAP is on (MC-PERF): src/map/loader.js injects the library on idle after the load
    event (cap 2.5 s), so right after `load` there is no map YET. No map is only accepted as 'nothing to wait for' when the page has
    no #map at all or the page has shown its map fallback (the library failed or was blocked on purpose)."""
    try:
        page.wait_for_function(
            "() => { const m = window.__maps && window.__maps[0]; if (!m) return !document.getElementById('map') || !!document.querySelector('.map-fallback'); "
            "try { return m.loaded() && !m.isMoving(); } catch (e) { return true; } }", timeout=timeout)
    except Exception:
        pass


def storage_keys(site):
    """Real signup-modal storage key + subscribed value, read from the site's own JS (never hard-coded elsewhere)."""
    key, val = None, None
    for p in sorted(Path(site).rglob("*.js")):
        parts = p.relative_to(site).parts
        if parts[0] in ("vendor", "node_modules", "data", "api", "scripts", "tests"):
            continue
        try:
            t = p.read_text("utf-8", "ignore")
        except Exception:
            continue
        m = re.search(r"STORAGE_KEY\s*=\s*['\"]([^'\"]+)['\"]", t)
        if m and not key:
            key = m.group(1)
        m2 = re.search(r"localStorage\.setItem\(\s*['\"]([^'\"]+)['\"]\s*,\s*['\"](subscribed)['\"]\s*\)", t)
        if m2:
            key = key or m2.group(1)
            val = m2.group(2)
    index = Path(site) / "index.html"
    if index.is_file() and not key:
        m = re.search(r"STORAGE_KEY\s*=\s*['\"]([^'\"]+)['\"]", index.read_text("utf-8", "ignore"))
        key = m.group(1) if m else None
    return key or "lsf-modal-state", val or "subscribed"


def mobile_note_key(site):
    for p in [Path(site) / "index.html"] + sorted((Path(site) / "src").rglob("*.js")):
        try:
            m = re.search(r"KEY\s*=\s*['\"](lsf-mobile-note-dismissed)['\"]", p.read_text("utf-8", "ignore"))
        except Exception:
            continue
        if m:
            return m.group(1)
    return "lsf-mobile-note-dismissed"


def default_storage(site, modal=False):
    """Storage seed used by smoke and snapshot runs: modal stands down unless `modal` is True."""
    k, v = storage_keys(site)
    items = {mobile_note_key(site): "1"}
    if not modal:
        items[k] = v
    return items
