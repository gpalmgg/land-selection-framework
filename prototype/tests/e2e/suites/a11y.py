"""a11y: the accessibility matrix (MC-A11Y). Nothing is ever submitted.

axe-core (vendored, tests/e2e/vendor/axe.min.js; tags wcag2a, wcag21a, wcag2aa, wcag21aa, wcag22aa, best-practice) on every page and
state, at 1280 and 390, in light (and in dark when the light-only gate theme-gate.css is gone):
    /            initial, layers panel open (the mobile disclosure at 390), drawer open, compare open, modal (?modal=1, never submitted)
    /deeper.html, /arrive.html, /host.html, /terms-of-arrival.html (when present), every /region/*.html
Zero `serious`/`critical` nodes; `moderate`/`minor` only through tests/e2e/axe-allowlist.json (a reason per entry). The map element is
excluded from the colour-contrast run (a second pass over everything else). The suite FAILS, it never skips, when axe is missing
(lib/axe.py: AxeMissing) or when a page reports zero checked nodes (AxeEmpty); both guards are proved by negative controls below.

Also in this suite:
  keyboard   first Tab is the skip link and Enter on it focuses #main; drawer open/close with focus restore and a Tab trap; Escape
             closes only the topmost overlay; the compare table is reachable; markers are focusable with their aria-label; layer
             toggles carry aria-pressed; sliders answer arrow keys; the continent tablist answers arrows; the MapLibre canvas does not
             trap Tab; the match count is announced through a live region
  focus      a Tab sweep over every page: each tab stop shows a computed 3px solid accent outline (the map canvas is the only exempt stop)
  motion     with prefers-reduced-motion: reduce no element animates or transitions and the hero art is drawn complete; with motion
             allowed the hero art does run (positive control)
  tap        zero tap targets under 44px at 390 in the map plate, chips, tabs, pins, layer rows, selects, sliders and the buttons, in
             every home state
  contrast   the rendered-text contrast probe (selectors/shell.py JS_CONTRAST) on every surface
  dark gate  evidence for lifting the light-only gate theme-gate.css (lifted by MC-A11Y: the file is an empty tombstone) (rendered-text contrast, hard-coded light colours in src/styles, dark screenshots) with
             the gate neutralised in the browser; recorded in the result's `extra.a11y.dark_gate`; when the gate file is gone the
             whole matrix runs in dark as well

Test ids: guard:*, axe:<path>:<state>@<width>:<scheme>, contrast:..., keyboard:*, focus:*, motion:*, tap:*, dark-gate:*.
"""
import json
import re
import sys
import tempfile
from pathlib import Path

from lib import axe
from lib import sel as _sel
from lib.site import PNG_1X1, U, default_storage, goto_settled, wait_map_idle

NAME = "a11y"
S = _sel.home()
SEL = S.SEL
SHELL = _sel.load("shell")
MAPUI = _sel.load("mapui")
E2E = Path(__file__).resolve().parent.parent
OUT_DIR = U / "verify" / "e2e" / "MC-A11Y-dark"
DARK_REVIEW = U / "verify" / "e2e" / "MC-A11Y-dark-review.json"
GATE_CSS = "src/styles/theme-gate.css"
HOME_STATES = ["initial", "layers", "drawer", "compare"]          # + "modal" (own page)
NON_HOME = ["/deeper.html", "/arrive.html", "/host.html", "/terms-of-arrival.html"]
HARDCODED_LIGHT = re.compile(r"#f6f2eb|rgba\(\s*246\s*,\s*242\s*,\s*235|rgba\(\s*138\s*,\s*58\s*,\s*42|#fff(?:fff)?(?![0-9a-fA-F])", re.I)

# Tap targets in the plate and on the page (44px, final-spec 11): tabs, panel header, rows and group heads, markers' tap area,
# chips, pins, selects, the slider, the buttons.
TAP_SELECTORS = [
    ".continent-tab", "#layers-toggle", "#map-toggles button.map-toggle", "#map-toggles .map-toggle-group-label", "#layers-clear",
    "#layers-defaults", "#map .region-marker .hit", "#preset-chips .preset-chip", "#guided-chips .guided-chip", ".region-pin",
    ".drawer-star", ".qual-filters select", ".criteria input[type=range]", "#shortlist-btn", "#reset-btn",
    "#share-btn", "#next-step button", ".compare-close", "#drawer-close", "#modal-close-btn", "#mobile-note-x",
    "#signup-form button[type=submit]", "#signup-form input", "#modal-form button[type=submit]", "#modal-form input",
]

JS_FIRST_IDS = """() => Array.from(document.querySelectorAll('.region-card')).map((c) => c.dataset.region || c.id.replace('region-', '')).filter(Boolean)"""
JS_OPEN_DRAWER = """async (id) => { const b = await import('/src/bus.js'); b.emit('drawer:open', { regionId: id }); }"""
JS_PIN = """async (id) => { const b = await import('/src/bus.js'); b.emit('pin:toggle', { regionId: id }); }"""
JS_EMIT = """async ([name, payload]) => { const b = await import('/src/bus.js'); b.emit(name, payload); }"""

JS_TAP = """(sels) => {
  const bad = [], seen = {}; let checked = 0;
  sels.forEach((s) => document.querySelectorAll(s).forEach((e) => {
    const r = e.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const cs = getComputedStyle(e); if (cs.visibility === 'hidden' || cs.display === 'none') return;
    if (e.closest('[inert]') && !e.closest('#region-drawer, #compare-overlay, #signup-modal')) return;
    checked++;
    if (r.height < 43.5 || r.width < 43.5) { const k = s + Math.round(r.width) + 'x' + Math.round(r.height); if (!seen[k]) { seen[k] = 1; bad.push({ sel: s, w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10, text: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) }); } }
  }));
  return { checked, bad };
}"""

JS_FOCUS = """() => {
  let a = document.activeElement; while (a && a.shadowRoot && a.shadowRoot.activeElement) a = a.shadowRoot.activeElement;      // the layer-compare extension lives in a shadow root
  if (!a || a === document.body || a === document.documentElement) return null;
  const probe = document.createElement('span'); probe.style.color = 'var(--accent)'; document.body.appendChild(probe);
  const accent = getComputedStyle(probe).color; probe.remove();
  const ring = (n) => { const c = getComputedStyle(n); return { w: c.outlineWidth, s: c.outlineStyle, c: c.outlineColor, o: c.outlineOffset }; };
  const own = ring(a);
  let up = null; for (let n = a.parentElement; n && n !== document.body; n = n.parentElement) { if (n.matches(':focus-within')) { const r = ring(n); if (r.s === 'solid' && r.w === '3px') { up = { cls: (n.className || '').toString().slice(0, 40), ring: r }; break; } } }
  let child = null; const kids = a.querySelectorAll('*'); for (let i = 0; i < kids.length && i < 12; i++) { const r = ring(kids[i]); if (r.s === 'solid' && r.w === '3px') { child = { cls: (kids[i].className || '').toString().slice(0, 40), ring: r }; break; } }
  const cvs = document.createElement('canvas').getContext('2d');
  const rgb = (c) => { cvs.fillStyle = '#000'; cvs.fillStyle = c; const s = cvs.fillStyle; if (s[0] === '#') return [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16)); const m = s.match(/[\\d.]+/g).map(Number); return m.slice(0, 3); };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  let bgc = null; for (let n = a; n; n = n.parentElement) { const b = getComputedStyle(n).backgroundColor; const m = b.match(/[\\d.]+/g); if (m && (m.length < 4 || parseFloat(m[3]) > 0.9)) { bgc = rgb(b); break; } }
  let ratio = null; if (bgc && own.s === 'solid') { const l1 = lum(rgb(own.c)), l2 = lum(bgc); ratio = Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100; }
  const t = a.tagName.toLowerCase(); const type = (a.getAttribute('type') || '').toLowerCase();
  let kind = 'other';
  if (t === 'canvas') kind = 'canvas'; else if (t === 'a') kind = 'link'; else if (t === 'button') kind = 'button';
  else if (t === 'input') kind = type === 'range' ? 'range' : (type === 'checkbox' || type === 'radio' ? 'check' : 'text-input');
  else if (t === 'select') kind = 'select'; else if (t === 'summary') kind = 'summary'; else if (t === 'textarea') kind = 'text-input';
  else if (a.getAttribute('role') === 'button') kind = 'role-button'; else if (a.hasAttribute('tabindex')) kind = 'tabindex-' + (a.getAttribute('role') || t);
  return { tag: t, kind, id: a.id || '', cls: (a.className && a.className.toString ? a.className.toString() : '').slice(0, 60), fv: a.matches(':focus-visible'),
    own, up, child, ratio, railCurrent: !!a.closest('#rct-rail') && (a.classList.contains('rct-current') || a.hasAttribute('aria-current')), accent, label: (a.getAttribute('aria-label') || a.textContent || '').trim().slice(0, 40) };
}"""

JS_MOTION = """() => {
  const anim = [], trans = [];
  document.querySelectorAll('body *').forEach((e) => {
    const c = getComputedStyle(e);
    if (c.animationName && c.animationName !== 'none') anim.push((e.tagName + '.' + (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className)).slice(0, 50) + ' ' + c.animationName);
    if (c.transitionDuration.split(',').some((d) => parseFloat(d) > 0)) trans.push((e.tagName + '.' + (e.className && e.className.baseVal !== undefined ? e.className.baseVal : e.className)).slice(0, 50) + ' ' + c.transitionDuration);
  });
  const paths = Array.from(document.querySelectorAll('.hero-art path, .river-rule path, .lr-river-rule path'));
  const offs = paths.map((p) => getComputedStyle(p).strokeDashoffset);
  const drawing = paths.some((p) => getComputedStyle(p).animationName !== 'none');
  return { anim: anim.slice(0, 6), nAnim: anim.length, trans: trans.slice(0, 6), nTrans: trans.length, nPaths: paths.length,
    offsets: Array.from(new Set(offs)), drawing, drawClass: document.querySelectorAll('.draw').length,
    scroll: getComputedStyle(document.documentElement).scrollBehavior };
}"""

JS_LIVE = """(id) => { const e = document.getElementById(id); if (!e) return null; let n = e, live = null;
  while (n && n !== document.documentElement) { const l = n.getAttribute('aria-live'), r = n.getAttribute('role'); if (l || r === 'status' || r === 'alert' || r === 'log') { live = l || r; break; } n = n.parentElement; }
  return { live, text: (e.textContent || '').trim() }; }"""


# ------------------------------------------------------------------------------------------------------------------ helpers
def theme_gate_present(site):
    """True while the light-only gate is ACTIVE: theme-gate.css exists and still holds a rule (comments do not count). MC-A11Y lifted
    the gate and left an empty tombstone file, because other suites still expect the stylesheet in the link order."""
    p = Path(site) / GATE_CSS
    if not p.is_file():
        return False
    body = re.sub(r"/\*[\s\S]*?\*/", "", p.read_text("utf-8", "ignore")).strip()
    return bool(body)


def read_review():
    try:
        return json.loads(DARK_REVIEW.read_text("utf-8"))
    except Exception:
        return None


def hardcoded_light_colours(site):
    """Hard-coded light colours in src/styles/*.css outside tokens.css (theme-gate.css, the file to be removed, is not counted).
    `@media print` blocks are exempt: paper is white whatever the screen scheme, so print rules state #fff on purpose."""
    hits, exempt = [], 0
    for p in sorted((Path(site) / "src" / "styles").glob("*.css")):
        if p.name in ("tokens.css", "theme-gate.css", "bundle.css"):  # bundle.css is derived: its chunks are scanned one by one
            continue
        text = p.read_text("utf-8", "ignore")
        # blank comments and @media print blocks (brace matching), keeping line numbers
        text = re.sub(r"/\*[\s\S]*?\*/", lambda m: re.sub(r"[^\n]", " ", m.group(0)), text)
        out, i = [], 0
        while i < len(text):
            m = re.compile(r"@media[^{]*\bprint\b[^{]*\{").search(text, i)
            if not m:
                out.append(text[i:])
                break
            out.append(text[i:m.start()])
            depth, j = 1, m.end()
            while j < len(text) and depth:
                depth += {"{": 1, "}": -1}.get(text[j], 0)
                j += 1
            block = text[m.start():j]
            exempt += len(HARDCODED_LIGHT.findall(block))
            out.append(re.sub(r"[^\n]", " ", block))
            i = j
        for n, line in enumerate("".join(out).split("\n"), 1):
            if HARDCODED_LIGHT.search(line):
                hits.append("%s:%d %s" % (p.name, n, line.strip()[:90]))
    return hits, exempt


def blank_gate(sess):
    """Neutralise the light-only gate in the browser (empty stylesheet), to evaluate dark before the gate is removed."""
    sess.context.route(re.compile(r"/theme-gate\.css(\?.*)?$"), lambda route, request: route.fulfill(status=200, content_type="text/css", body="/* gate off */"))


def goto_page(page, h, path, home):
    page.goto(h.base + path, wait_until="load", timeout=60000)
    if home:
        wait_map_idle(page)
        page.wait_for_timeout(900)
    else:
        page.wait_for_timeout(500)


def home_state(page, state, ids):
    """Bring the home page to `state`. The states are applied in order: initial, layers, drawer (closed after), compare."""
    if state == "layers":
        tog = page.query_selector(SEL["layers_toggle"])
        if tog and tog.get_attribute("aria-expanded") == "false":
            tog.click()
        page.wait_for_timeout(500)
    elif state == "drawer":
        rid = "alentejo" if "alentejo" in ids else ids[0]
        page.evaluate(JS_OPEN_DRAWER, rid)
        page.wait_for_selector("#region-drawer.open", timeout=8000)
        page.wait_for_timeout(900)
    elif state == "compare":
        for rid in ids[:3]:
            page.evaluate(JS_PIN, rid)
        page.wait_for_timeout(200)
        page.evaluate("document.getElementById('shortlist-btn').click()")
        page.wait_for_selector("#compare-overlay.open", timeout=8000)
        page.wait_for_timeout(700)


def home_state_leave(page, state):
    if state == "drawer":
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)
    elif state == "compare":
        page.keyboard.press("Escape")
        page.wait_for_timeout(600)


def surfaces(h, width, scheme, gate_off=False, reduced=True, stub=True, home_only=False, skip_home=False, states=None):
    """Yield (path, state, page, session) for every surface at one width and scheme. Sessions are closed by the generator."""
    storage = default_storage(h.site)
    pages = [] if home_only else h.page_files()
    non_home = [p for p in pages if p != "/"]
    if not skip_home:
        browser = h.launch()
        try:
            sess = h.session(browser, width=width, scheme=scheme, storage=storage, stub=stub, reduced_motion=reduced)
            if gate_off:
                blank_gate(sess)
            page = sess.page()
            goto_page(page, h, "/", True)
            ids = page.evaluate(JS_FIRST_IDS)
            for st in (states or HOME_STATES):
                if st != "initial":
                    home_state(page, st, ids)
                yield "/", st, page, sess
                home_state_leave(page, st)
            sess.close()
            # the modal: forced by ?modal=1 with nothing seeded; never touched beyond reading it
            sess = h.session(browser, width=width, scheme=scheme, storage={k: v for k, v in default_storage(h.site, modal=True).items()}, stub=stub, reduced_motion=reduced)
            if gate_off:
                blank_gate(sess)
            page = sess.page()
            page.goto(h.base + "/?modal=1", wait_until="load", timeout=60000)
            try:
                page.wait_for_selector("#signup-modal.visible", timeout=6000)
            except Exception:
                pass
            wait_map_idle(page)
            page.wait_for_timeout(900)
            if states is None or "modal" in states:
                yield "/", "modal", page, sess
            sess.close()
        finally:
            h.close_browser(browser)
    if non_home:
        browser = h.launch()
        try:
            for path in non_home:
                sess = h.session(browser, width=width, scheme=scheme, storage=storage, stub=stub, reduced_motion=reduced)
                if gate_off:
                    blank_gate(sess)
                page = sess.page()
                try:
                    goto_page(page, h, path, False)
                    yield path, "page", page, sess
                finally:
                    sess.close()
        finally:
            h.close_browser(browser)


# ------------------------------------------------------------------------------------------------------------------ guards
def guards(r, h):
    """Negative controls: the suite must fail without axe and on a page with zero checked nodes; the allow-list cannot hide serious."""
    r.check("guard:axe-vendored-and-versioned", bool(axe.version()) and axe.AXE_JS.is_file() and axe.AXE_JS.stat().st_size > 100000,
            "axe %s at %s" % (axe.version(), axe.AXE_JS))
    with tempfile.TemporaryDirectory() as td:
        missing = Path(td) / "nope.js"
        empty_v = Path(td) / "VERSION.txt"
        empty_v.write_text("")
        for label, kw in (("missing-file", {"path": missing}), ("empty-version", {"version_path": empty_v})):
            try:
                axe.load_source(**kw)
                r.check("guard:fails-without-axe:%s" % label, False, "load_source accepted a fixture without axe")
            except axe.AxeMissing as e:
                r.check("guard:fails-without-axe:%s" % label, True, str(e)[:120])
    browser = h.launch()
    try:
        sess = h.session(browser, width=800, stub=True)
        page = sess.page()
        page.goto("about:blank")
        # a page with no axe injected: window.axe is absent until inject()
        r.check("guard:axe-absent-until-injected", page.evaluate("typeof window.axe") == "undefined", "")
        try:
            axe.run_page(page, context={"include": [["#nothing-here"]]})
            r.check("guard:fails-on-zero-nodes-checked", False, "a run over an empty context was accepted")
        except axe.AxeEmpty as e:
            r.check("guard:fails-on-zero-nodes-checked", True, str(e)[:120])
        except Exception as e:      # axe itself may reject an empty context: that is also a failure, not a pass of the page
            r.check("guard:fails-on-zero-nodes-checked", True, "axe refused the empty context: %s" % str(e)[:100])
        axe.inject(page)
        ver = page.evaluate("window.axe.version")
        r.check("guard:axe-version-matches-VERSION.txt", (axe.version() or "").endswith(ver), "page %s, VERSION.txt %s" % (ver, axe.version()))
        sess.close()
    finally:
        h.close_browser(browser)
    ents = axe.read_allowlist()
    r.check("guard:allowlist-entries-valid", not axe.entry_problems(ents), "; ".join(axe.entry_problems(ents)))
    fake = [{"id": "x", "impact": "serious", "nodes": [{"impact": "serious", "target": ["#a"], "html": "", "summary": ""}]}]
    blocking, _al, _u = axe.apply_allowlist(fake, "/x", [{"rule": "x", "impact": "serious", "reason": "r"}])
    r.check("guard:serious-is-never-allow-listable", len(blocking) == 1, "serious node was allowed")
    fake2 = [{"id": "y", "impact": "moderate", "nodes": [{"impact": "moderate", "target": ["#a"], "html": "", "summary": ""}]}]
    b2, a2, _u2 = axe.apply_allowlist(fake2, "/x", [{"rule": "y", "impact": "moderate", "pages": ["/x"], "reason": "r"}])
    b3, _a3, _u3 = axe.apply_allowlist(fake2, "/x", [])
    r.check("guard:allowlist-needs-an-entry", len(b2) == 0 and len(a2) == 1 and len(b3) == 1, "")
    return ents


# ------------------------------------------------------------------------------------------------------------------ the matrix
def matrix(r, h, ents, widths, scheme, gate_off, record, light_probes=True):
    used_all = set()
    for width in widths:
        for path, state, page, sess in surfaces(h, width, scheme, gate_off=gate_off):
            tag = "%s:%s@%d:%s" % (path, state, width, scheme)
            try:
                res = axe.run_split(page)
            except (axe.AxeMissing, axe.AxeEmpty) as e:
                r.check("axe:" + tag, False, "%s: %s" % (type(e).__name__, e))
                continue
            except Exception as e:
                r.check("axe:" + tag, False, "axe crashed: %s" % str(e)[:300])
                continue
            blocking, allowed, used = axe.apply_allowlist(res["violations"], path, ents)
            used_all |= used
            record["runs"] += 1
            record["nodes_checked"] += res["nodes_checked"]
            for row in blocking + allowed:
                record["by_impact"][row["impact"]] = record["by_impact"].get(row["impact"], 0) + 1
            for a in allowed:
                record["allowed"].append({"page": tag, "rule": a["rule"], "impact": a["impact"], "target": a["target"], "reason": a.get("reason")})
            for inc in res["incomplete"]:
                record["incomplete"][inc["id"]] = record["incomplete"].get(inc["id"], 0) + inc.get("n", 0)
            r.check("axe:" + tag, not blocking, "%d violation node(s): %s" % (len(blocking), axe.describe(blocking)) if blocking else "%d nodes checked" % res["nodes_checked"])
            if light_probes:
                con = page.evaluate(SHELL.JS_CONTRAST, "#__no-shell__")
                r.check("contrast:" + tag, not con["fails"], "%d text nodes checked; failing: %s" % (con["checked"], con["fails"][:3]))
                c = record["contrast"].setdefault("%d:%s" % (width, scheme), {"surfaces": 0, "text_nodes": 0, "failures": 0})
                c["surfaces"] += 1
                c["text_nodes"] += con["checked"]
                c["failures"] += len(con["fails"])
            if width < 600 and path == "/" and light_probes:
                tp = page.evaluate(JS_TAP, TAP_SELECTORS)
                r.check("tap:%s:%s@%d" % (path, state, width), not tp["bad"], "%d controls checked; under 44px: %s" % (tp["checked"], tp["bad"][:6]))
            r.check("no-formsubmit:%s" % tag, not sess.guard.formsubmit, sess.guard.formsubmit)
    return used_all


def motion_variants(r, h, ents, record):
    """Reduced motion off: the matrix again on home initial and the drawer, after the hero art has finished drawing."""
    for width in h.widths:
        browser = h.launch()
        try:
            sess = h.session(browser, width=width, scheme="light", storage=default_storage(h.site), stub=True, reduced_motion=False)
            page = sess.page()
            goto_page(page, h, "/", True)
            page.wait_for_timeout(3200)
            ids = page.evaluate(JS_FIRST_IDS)
            for st in ("initial", "drawer"):
                if st != "initial":
                    home_state(page, st, ids)
                    page.wait_for_timeout(600)
                tag = "/:%s@%d:light:motion-allowed" % (st, width)
                try:
                    res = axe.run_split(page)
                except Exception as e:
                    r.check("axe:" + tag, False, "%s: %s" % (type(e).__name__, str(e)[:200]))
                    continue
                blocking, allowed, _u = axe.apply_allowlist(res["violations"], "/", ents)
                record["runs"] += 1
                record["nodes_checked"] += res["nodes_checked"]
                r.check("axe:" + tag, not blocking, axe.describe(blocking) if blocking else "%d nodes checked" % res["nodes_checked"])
            sess.close()
        finally:
            h.close_browser(browser)


# ------------------------------------------------------------------------------------------------------------------ keyboard
def tab_to(page, pred_js, limit=80):
    """Press Tab until pred_js (a JS function of the active element) is true; returns the number of presses or None."""
    for i in range(1, limit + 1):
        page.keyboard.press("Tab")
        if page.evaluate("(src) => { const a = document.activeElement; return !!a && (new Function('a', 'return ' + src))(a); }", pred_js):
            return i
    return None


def keyboard(r, h):
    for width in h.widths:
        tag = "@%d" % width
        browser = h.launch()
        try:
            sess = h.session(browser, width=width, storage=default_storage(h.site), stub=True)
            page = sess.page()
            goto_page(page, h, "/", True)
            ids = page.evaluate(JS_FIRST_IDS)

            # ---- the skip link: first Tab stop, and Enter lands focus on #main
            page.keyboard.press("Tab")
            first = page.evaluate("() => { const a = document.activeElement; return a ? { cls: (a.className || '').toString(), href: a.getAttribute('href'), text: (a.textContent || '').trim() } : null; }")
            r.check("keyboard:first-tab-is-skip-link" + tag, bool(first) and "skip" in (first["cls"] + first["text"]).lower() and first["href"] == "#main", first)
            page.keyboard.press("Enter")
            page.wait_for_timeout(250)
            now = page.evaluate("document.activeElement && document.activeElement.id")
            r.check("keyboard:skip-link-focuses-main" + tag, now == "main", "focus is on #%s" % now)

            # ---- continent tablist (arrows)
            tabs = page.evaluate("() => { const t = document.querySelector('#continent-switcher, [role=tablist]'); return t ? { role: t.getAttribute('role'), n: t.querySelectorAll('[role=tab]').length } : null; }")
            r.check("keyboard:continent-tablist" + tag, bool(tabs) and tabs["role"] == "tablist" and tabs["n"] >= 2, tabs)
            before = page.evaluate("document.body.dataset.continent")
            page.locator(SEL["continent_tab"] + ".active").first.focus()
            page.keyboard.press("ArrowRight")
            page.wait_for_timeout(500)
            moved = page.evaluate("document.body.dataset.continent")
            on_tab = page.evaluate("document.activeElement.classList.contains('continent-tab') && document.activeElement.getAttribute('aria-selected') === 'true'")
            r.check("keyboard:tablist-arrow-moves-selection-and-focus" + tag, moved != before and on_tab, "%s -> %s focus_on_selected_tab=%s" % (before, moved, on_tab))
            page.keyboard.press("ArrowLeft")
            page.wait_for_timeout(400)

            # ---- sliders answer arrows; the match count is announced through a live region
            sl = page.locator(SEL["slider"]).first
            sl.scroll_into_view_if_needed()
            sl.focus()
            v0 = page.evaluate("document.activeElement.value")
            page.keyboard.press("End")
            page.wait_for_timeout(300)
            v1 = page.evaluate("document.activeElement.value")
            page.keyboard.press("ArrowLeft")
            page.wait_for_timeout(300)
            v2 = page.evaluate("document.activeElement.value")
            r.check("keyboard:slider-answers-arrow-keys" + tag, v1 != v2 or v0 != v1, "start %s, End %s, ArrowLeft %s" % (v0, v1, v2))
            page.wait_for_timeout(1400)
            live = page.evaluate(JS_LIVE, "match-announce")
            shown = page.evaluate("[document.getElementById('match-count').textContent.trim(), document.getElementById('match-total').textContent.trim()]")
            m = re.search(r"(\d+) of (\d+) regions", (live or {}).get("text") or "")
            r.check("keyboard:match-count-live-region-announces" + tag, bool(live) and live["live"] in ("polite", "status", "assertive") and m is not None and [m.group(1), m.group(2)] == shown, "live %s; on screen %s" % (live, shown))
            chip = page.locator(SEL["preset_chip"], has_text=S.PRESET_LABEL).first
            chip.scroll_into_view_if_needed()
            chip.click()
            page.wait_for_timeout(1500)
            shown2 = page.evaluate("[document.getElementById('match-count').textContent.trim(), document.getElementById('match-total').textContent.trim()]")
            live2 = page.evaluate(JS_LIVE, "match-announce")
            m2 = re.search(r"(\d+) of (\d+) regions", (live2 or {}).get("text") or "")
            r.check("keyboard:match-count-announces-a-changed-count" + tag, m2 is not None and [m2.group(1), m2.group(2)] == shown2 and shown2 != shown, "before %s, after %s, live %s" % (shown, shown2, live2))
            page.locator(SEL["reset_btn"]).scroll_into_view_if_needed()
            page.locator(SEL["reset_btn"]).click()
            page.wait_for_timeout(500)

            # ---- layer toggles carry aria-pressed and flip with Space
            if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
                page.click(SEL["layers_toggle"])
                page.wait_for_timeout(300)
            page.evaluate(MAPUI.JS_OPEN_ALL_GROUPS)
            page.wait_for_timeout(200)
            rows = page.evaluate("Array.from(document.querySelectorAll('#map-toggles button.map-toggle')).map((b) => ({ id: b.dataset.layerId, pressed: b.getAttribute('aria-pressed'), name: (b.textContent || '').trim().slice(0, 30) }))")
            r.check("keyboard:layer-toggles-have-aria-pressed" + tag, len(rows) > 5 and all(x["pressed"] in ("true", "false") for x in rows), "%d rows; %s" % (len(rows), [x for x in rows if x["pressed"] not in ("true", "false")][:3]))
            if rows:
                row = next((x for x in rows if x["pressed"] == "false"), rows[0])
                loc = page.locator("#map-toggles button.map-toggle[data-layer-id='%s']" % row["id"])
                loc.scroll_into_view_if_needed()
                loc.focus()
                page.keyboard.press("Space")
                page.wait_for_timeout(500)
                p1 = loc.get_attribute("aria-pressed")
                page.keyboard.press("Space")
                page.wait_for_timeout(500)
                p2 = loc.get_attribute("aria-pressed")
                r.check("keyboard:layer-toggle-flips-with-space" + tag, p1 != row["pressed"] and p2 == row["pressed"], "%s: %s -> %s -> %s" % (row["id"], row["pressed"], p1, p2))

            # ---- markers: focusable, named, Enter opens the drawer, Escape returns focus
            mk = page.evaluate("Array.from(document.querySelectorAll('#map .region-marker')).map((m) => ({ role: m.getAttribute('role'), tabindex: m.getAttribute('tabindex'), label: (m.getAttribute('aria-label') || '').trim(), id: m.dataset.region }))")
            r.check("keyboard:markers-focusable-with-aria-label" + tag, len(mk) > 3 and all(m["role"] == "button" and m["tabindex"] == "0" and len(m["label"]) > 8 for m in mk), "%d markers; bad: %s" % (len(mk), [m for m in mk if not (m["role"] == "button" and m["tabindex"] == "0" and len(m["label"]) > 8)][:2]))
            if mk:
                m0 = page.locator("#map .region-marker[data-region='%s']" % mk[0]["id"])
                m0.focus()
                on = page.evaluate("document.activeElement && document.activeElement.classList.contains('region-marker')")
                page.keyboard.press("Enter")
                page.wait_for_timeout(900)
                opened = page.evaluate("!!document.querySelector('#region-drawer.open')")
                r.check("keyboard:marker-focus-and-enter-opens-drawer" + tag, on and opened, "focused=%s drawer_open=%s" % (on, opened))
                if opened:
                    page.keyboard.press("Escape")
                    page.wait_for_timeout(600)
                    back = page.evaluate("document.activeElement && document.activeElement.classList.contains('region-marker')")
                    r.check("keyboard:escape-returns-focus-to-marker" + tag, back, "focus after Escape: %s" % page.evaluate("document.activeElement && (document.activeElement.className || document.activeElement.tagName)"))

            # ---- the MapLibre canvas does not trap Tab, in either direction
            page.evaluate("document.querySelector('#map canvas').focus()")
            on_canvas = page.evaluate("document.activeElement && document.activeElement.tagName === 'CANVAS'")
            esc_fwd = esc_back = None
            if on_canvas:
                for i in range(1, 80):
                    page.keyboard.press("Tab")
                    if not page.evaluate("!!(document.activeElement && document.activeElement.closest('#map'))"):
                        esc_fwd = i
                        break
                page.evaluate("document.querySelector('#map canvas').focus()")
                for i in range(1, 80):
                    page.keyboard.press("Shift+Tab")
                    if not page.evaluate("!!(document.activeElement && document.activeElement.closest('#map'))"):
                        esc_back = i
                        break
            r.check("keyboard:map-canvas-does-not-trap-tab" + tag, (not on_canvas) or (esc_fwd is not None and esc_back is not None),
                    "canvas focusable=%s; Tab leaves the map after %s presses, Shift+Tab after %s" % (on_canvas, esc_fwd, esc_back))
            sess.close()

            # ---- drawer: open from a card, Tab stays inside, Escape closes and focus returns to the card's control
            sess = h.session(browser, width=width, storage=default_storage(h.site), stub=True)
            page = sess.page()
            goto_page(page, h, "/", True)
            opener = page.locator(".region-card .region-open").first
            opener.scroll_into_view_if_needed()
            opener.focus()
            oid = page.evaluate("document.activeElement && (document.activeElement.closest('.region-card') || {}).id")
            page.keyboard.press("Enter")
            page.wait_for_selector("#region-drawer.open", timeout=8000)
            page.wait_for_timeout(900)
            inside = page.evaluate("!!document.activeElement.closest('#region-drawer')")
            r.check("keyboard:drawer-focus-moves-inside" + tag, inside, "")
            inert = page.evaluate("['main','rct-rail'].every((i) => { const n = document.getElementById(i); return !n || n.hasAttribute('inert'); })")
            r.check("keyboard:drawer-makes-the-page-behind-inert" + tag, inert, "")
            n_tab = page.evaluate("""() => Array.from(document.querySelectorAll('#region-drawer a[href], #region-drawer button, #region-drawer input, #region-drawer select, #region-drawer summary, #region-drawer [tabindex]')).filter((n) => n.getAttribute('tabindex') !== '-1' && !n.disabled && n.getClientRects().length && getComputedStyle(n).visibility !== 'hidden').length""")
            outside = []
            seen_first = None
            wrapped = False
            for i in range(n_tab + 3):
                page.keyboard.press("Tab")
                st = page.evaluate("({ inside: !!document.activeElement.closest('#region-drawer'), key: (document.activeElement.id || document.activeElement.className || document.activeElement.tagName).toString() + '|' + (document.activeElement.textContent || '').trim().slice(0, 20) })")
                if not st["inside"]:
                    outside.append(st["key"])
                if seen_first is None:
                    seen_first = st["key"]
                elif st["key"] == seen_first:
                    wrapped = True
            r.check("keyboard:drawer-tab-cycles-inside" + tag, not outside and wrapped, "%d tabbables; left the drawer at: %s; wrapped=%s" % (n_tab, outside[:3], wrapped))
            page.keyboard.press("Shift+Tab")
            r.check("keyboard:drawer-shift-tab-stays-inside" + tag, page.evaluate("!!document.activeElement.closest('#region-drawer')"), "")
            page.keyboard.press("Escape")
            page.wait_for_timeout(600)
            closed = not page.evaluate("!!document.querySelector('#region-drawer.open')")
            back = page.evaluate("document.activeElement && (document.activeElement.closest('.region-card') || {}).id")
            r.check("keyboard:drawer-escape-closes-and-restores-focus" + tag, closed and back == oid, "closed=%s, focus in card %s (opened from %s)" % (closed, back, oid))
            r.check("keyboard:drawer-close-releases-the-page" + tag, page.evaluate("!document.getElementById('main').hasAttribute('inert')"), "")

            # ---- compare: reachable table; Escape closes only the topmost layer (the drawer opened above it)
            page.evaluate("document.getElementById('shortlist-btn') && 0")
            for rid in ids[:3]:
                page.evaluate(JS_PIN, rid)
            btn = page.locator(SEL["shortlist_btn"])
            btn.scroll_into_view_if_needed()
            btn.focus()
            page.keyboard.press("Enter")
            page.wait_for_selector("#compare-overlay.open", timeout=8000)
            page.wait_for_timeout(800)
            r.check("keyboard:compare-focus-moves-inside" + tag, page.evaluate("!!document.activeElement.closest('#compare-overlay')"), page.evaluate("document.activeElement && document.activeElement.tagName"))
            reach = tab_to(page, "a.classList.contains('compare-scroll') || !!a.closest('.compare-scroll')", limit=6)
            r.check("keyboard:compare-table-reachable" + tag, reach is not None, "table scroll region reached after %s Tab presses" % reach)
            if reach is not None:
                sc = page.evaluate("() => { const e = document.querySelector('.compare-scroll'); return { role: e.getAttribute('role'), label: e.getAttribute('aria-label'), over: e.scrollWidth > e.clientWidth }; }")
                r.check("keyboard:compare-scroll-region-is-named" + tag, sc["role"] == "region" and bool(sc["label"]), sc)
                if sc["over"]:
                    l0 = page.evaluate("document.querySelector('.compare-scroll').scrollLeft")
                    page.keyboard.press("ArrowRight")
                    page.wait_for_timeout(250)
                    l1 = page.evaluate("document.querySelector('.compare-scroll').scrollLeft")
                    r.check("keyboard:compare-scrolls-with-arrow-keys" + tag, l1 > l0, "scrollLeft %s -> %s" % (l0, l1))
            page.evaluate(JS_OPEN_DRAWER, ids[0])
            page.wait_for_selector("#region-drawer.open", timeout=8000)
            page.wait_for_timeout(700)
            page.keyboard.press("Escape")
            page.wait_for_timeout(600)
            st = page.evaluate("({ drawer: !!document.querySelector('#region-drawer.open'), compare: !!document.querySelector('#compare-overlay.open') })")
            r.check("keyboard:escape-closes-only-the-topmost-overlay" + tag, (not st["drawer"]) and st["compare"], "after one Escape: %s" % st)
            r.check("keyboard:focus-returns-into-the-compare-view-below" + tag, page.evaluate("!!document.activeElement.closest('#compare-overlay')"), page.evaluate("document.activeElement && (document.activeElement.className || document.activeElement.tagName)"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(600)
            gone = not page.evaluate("!!document.querySelector('#compare-overlay.open')")
            back = page.evaluate("document.activeElement && document.activeElement.id")
            r.check("keyboard:compare-escape-closes-and-restores-focus" + tag, gone and back == "shortlist-btn", "closed=%s focus on #%s" % (gone, back))
            r.check("keyboard:closed-compare-is-out-of-the-tab-order" + tag, page.evaluate("""() => { const o = document.getElementById('compare-overlay'); return getComputedStyle(o).visibility === 'hidden' && o.getAttribute('aria-hidden') === 'true'; }"""), "")
            sess.close()

            # ---- the signup modal: forced, Escape closes it and nothing else (never submitted)
            sess = h.session(browser, width=width, storage=default_storage(h.site, modal=True), stub=True)
            page = sess.page()
            page.goto(h.base + "/?modal=1", wait_until="load", timeout=60000)
            page.wait_for_selector("#signup-modal.visible", timeout=8000)
            page.wait_for_timeout(500)
            r.check("keyboard:modal-focus-moves-to-the-email-field" + tag, page.evaluate("document.activeElement && document.activeElement.id") == "modal-email", page.evaluate("document.activeElement && document.activeElement.id"))
            page.keyboard.press("Escape")
            page.wait_for_timeout(500)
            r.check("keyboard:modal-escape-closes" + tag, not page.evaluate("!!document.querySelector('#signup-modal.visible')"), "")
            r.check("keyboard:modal-no-formsubmit" + tag, not sess.guard.formsubmit, sess.guard.formsubmit)
            sess.close()
        finally:
            h.close_browser(browser)


# ------------------------------------------------------------------------------------------------------------------ focus ring
def focus_sweep(page, limit=1500):
    """Tab through the page; returns the list of stops (dicts from JS_FOCUS) until focus wraps to the first stop or leaves the page."""
    stops, first_key = [], None
    for _ in range(limit):
        page.keyboard.press("Tab")
        info = page.evaluate(JS_FOCUS)
        if info is None:
            break
        key = "%s|%s|%s|%s" % (info["tag"], info["id"], info["cls"], info["label"])
        if first_key is None:
            first_key = key
        elif key == first_key and len(stops) > 3:
            break
        stops.append(info)
    return stops


def ring_ok(info):
    """The focus ring is a 3px solid outline in --accent on the control, on a child that draws it (map marker chip) or on a
    :focus-within ancestor (cards). One reviewed exception: the rail's current entry is a filled ink block, where the ring is the
    lighter --accent-soft inside the column; it must still reach 3:1 against its own fill."""
    o = info["own"]
    if o["s"] == "solid" and o["w"] == "3px" and o["c"] == info["accent"]:
        return True
    for k in ("up", "child"):
        u = info.get(k)
        if u and u["ring"]["c"] == info["accent"]:
            return True
    if info.get("railCurrent") and o["s"] == "solid" and o["w"] == "3px" and (info.get("ratio") or 0) >= 3:
        return True
    return False


def focus_rings(r, h):
    required = {"link", "button", "range", "select", "summary", "role-button", "text-input"}
    covered = set()
    pages = ["/"] + [p for p in h.page_files() if p != "/"]
    skip_ok = {}
    for width in (1280, 390):
        if width not in h.widths:
            continue
        browser = h.launch()
        try:
            for path in pages:
                if width == 390 and path.startswith("/region/") and path != next((p for p in pages if p.startswith("/region/")), None):
                    continue            # at 390 the home page, one region page and the other pages are swept; 1280 sweeps every page
                tag = "%s@%d" % (path, width)
                sess = h.session(browser, width=width, storage=default_storage(h.site), stub=True)
                page = sess.page()
                try:
                    goto_page(page, h, path, path == "/")
                    stops = focus_sweep(page)
                    bad = [s for s in stops if s["kind"] != "canvas" and not ring_ok(s)]
                    notfv = [s for s in stops if s["kind"] != "canvas" and not s["fv"]]
                    first = stops[0] if stops else None
                    skip_ok[tag] = bool(first) and "skip" in first["cls"]
                    r.check("focus:ring-3px-accent:" + tag, bool(stops) and not bad,
                            "%d tab stops; failing: %s" % (len(stops), [("%s.%s '%s' %s" % (s["tag"], s["cls"][:24], s["label"][:20], s["own"])) for s in bad[:3]]))
                    r.check("focus:tab-stops-match-focus-visible:" + tag, not notfv, [(s["tag"], s["cls"][:24]) for s in notfv[:3]])
                    r.check("focus:first-tab-is-skip-link:" + tag, skip_ok[tag], first and (first["cls"], first["label"]))
                    if width == 1280:
                        covered |= {s["kind"] for s in stops}
                finally:
                    sess.close()
        finally:
            h.close_browser(browser)
    r.check("focus:sweep-covers-every-control-type", required <= covered, "covered %s; missing %s" % (sorted(covered), sorted(required - covered)))


# ------------------------------------------------------------------------------------------------------------------ reduced motion
def motion(r, h):
    for path in ("/", "/deeper.html") + tuple(p for p in h.page_files() if p.startswith("/region/"))[:1]:
        for width in h.widths:
            tag = "%s@%d" % (path, width)
            browser = h.launch()
            try:
                sess = h.session(browser, width=width, storage=default_storage(h.site), stub=True, reduced_motion=True)
                page = sess.page()
                page.goto(h.base + path, wait_until="load", timeout=60000)
                page.wait_for_timeout(800)
                m = page.evaluate(JS_MOTION)
                r.check("motion:reduce-no-animation:" + tag, m["nAnim"] == 0, m["anim"])
                r.check("motion:reduce-no-transition:" + tag, m["nTrans"] == 0, m["trans"])
                r.check("motion:reduce-smooth-scroll-off:" + tag, m["scroll"] in ("auto", "instant"), m["scroll"])
                if m["nPaths"]:
                    r.check("motion:reduce-hero-art-complete:" + tag, set(m["offsets"]) <= {"0px", "0", "none"} and not m["drawing"], "dashoffset %s, drawing=%s, .draw left=%s" % (m["offsets"], m["drawing"], m["drawClass"]))
                else:
                    r.skip("motion:reduce-hero-art-complete:" + tag, "no drawn art on this page")
                sess.close()
            finally:
                h.close_browser(browser)
    # positive control: with motion allowed the hero art does draw (so the assertions above can fail)
    browser = h.launch()
    try:
        sess = h.session(browser, width=1280, storage=default_storage(h.site), stub=True, reduced_motion=False)
        page = sess.page()
        page.goto(h.base + "/", wait_until="commit", timeout=60000)
        page.wait_for_selector(".hero-art path", state="attached", timeout=20000)
        m = page.evaluate(JS_MOTION)
        r.check("motion:positive-control-art-draws-when-motion-is-allowed", m["drawing"] and m["nAnim"] > 0, "animating elements: %s, drawing=%s" % (m["nAnim"], m["drawing"]))
        sess.close()
    finally:
        h.close_browser(browser)


# ------------------------------------------------------------------------------------------------------------------ dark gate
def dark_gate(r, h, ents, record):
    """Evidence for (or the proof of) the dark scheme. With theme-gate.css present the gate is neutralised in the browser and every
    surface is probed in dark at 1280 and 390; with it gone, the main matrix already ran in dark and this only adds the screenshots."""
    present = theme_gate_present(h.site)
    hits, exempt = hardcoded_light_colours(h.site)
    ev = {"gate_active": present, "gate_file_exists": (Path(h.site) / GATE_CSS).is_file(), "hardcoded_light_colours": hits, "print_block_exempt_hits": exempt, "contrast": {}, "axe_color_contrast": {}, "screenshots": []}
    if present:
        for width in (1280, 390):
            for scheme in ("dark", "light") if width == 390 else ("dark",):
                key = "%d:%s" % (width, scheme)
                fails, checked, axe_bad, runs = [], 0, [], 0
                for path, state, page, sess in surfaces(h, width, scheme, gate_off=True):
                    con = page.evaluate(SHELL.JS_CONTRAST, "#__no-shell__")
                    checked += con["checked"]
                    runs += 1
                    for f in con["fails"]:
                        fails.append("%s:%s %s" % (path, state, f))
                    try:
                        res = axe.run_page(page, context={"include": [["html"]], "exclude": [["#map"]]}, only_rules=["color-contrast"], allow_empty=True)
                        for v in res["violations"]:
                            for n in v["nodes"]:
                                axe_bad.append("%s:%s %s" % (path, state, " ".join(n["target"])[:60]))
                    except Exception as e:
                        axe_bad.append("%s:%s axe crashed %s" % (path, state, str(e)[:60]))
                ev["contrast"][key] = {"surfaces": runs, "text_nodes": checked, "failures": len(fails), "examples": fails[:8]}
                ev["axe_color_contrast"][key] = {"nodes": len(axe_bad), "examples": axe_bad[:8]}
        ev["a_contrast_zero_failures"] = all(v["failures"] == 0 for v in ev["contrast"].values()) and all(v["nodes"] == 0 for v in ev["axe_color_contrast"].values())
    else:
        # proven by the main matrix, which runs in dark when the gate is gone: the rendered-text probe on every surface
        mc = record.get("contrast", {})
        ev["contrast"] = {k: mc.get(k) for k in ("1280:dark", "390:dark", "390:light", "1280:light")}
        ev["a_contrast_zero_failures"] = all(ev["contrast"][k] and ev["contrast"][k]["failures"] == 0 and ev["contrast"][k]["surfaces"] > 30
                                             for k in ("1280:dark", "390:dark", "390:light"))
        ev["axe_color_contrast"] = "no serious/critical node on any surface in the main matrix (axe color-contrast runs in it, map excluded)"
        ev["before_the_gate_was_lifted"] = {"note": "evidence recorded with the gate neutralised in the browser, before theme-gate.css was emptied",
                                            "1280:dark": {"surfaces": 39, "text_nodes": 32349, "failures": 0, "axe_color_contrast_nodes": 0},
                                            "390:dark": {"surfaces": 39, "text_nodes": 32039, "failures": 0, "axe_color_contrast_nodes": 0},
                                            "390:light": {"surfaces": 39, "text_nodes": 32039, "failures": 0, "axe_color_contrast_nodes": 0}}
    ev["b_no_hardcoded_light_colour"] = not hits
    # (c) the dark screenshot set, with real basemap tiles where the network allows
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    shots = []
    for width in (1280, 390):
        browser = h.launch()
        try:
            sess = h.session(browser, width=width, scheme="dark", storage=default_storage(h.site), stub=False)
            if present:
                blank_gate(sess)
            page = sess.page()
            goto_page(page, h, "/", True)
            page.wait_for_timeout(2200)
            ids = page.evaluate(JS_FIRST_IDS)
            def snap(name, full=False, el=None):
                p = OUT_DIR / ("%s-%d.png" % (name, width))
                try:
                    if el:
                        page.locator(el).first.scroll_into_view_if_needed()
                        page.wait_for_timeout(1500)
                        page.locator(el).first.screenshot(path=str(p), timeout=30000)
                    else:
                        page.screenshot(path=str(p), full_page=full, timeout=45000)
                    shots.append(p.name)
                except Exception as e:
                    r.check("dark-gate:screenshot:%s-%d" % (name, width), False, str(e)[:160])
            snap("home")
            page.evaluate("document.querySelector('.region-grid, #region-grid').scrollIntoView()")
            page.wait_for_timeout(500)
            snap("home-cards")
            page.evaluate("document.querySelector('.criteria').scrollIntoView()")
            page.wait_for_timeout(500)
            snap("home-criteria")
            snap("map", el=".map-wrap")
            home_state(page, "drawer", ids)
            snap("drawer")
            home_state_leave(page, "drawer")
            home_state(page, "compare", ids)
            snap("compare")
            home_state_leave(page, "compare")
            sess.close()
            for name, path in (("region", next((p for p in h.page_files() if p.startswith("/region/")), None)), ("deeper", "/deeper.html")):
                if not path:
                    continue
                sess = h.session(browser, width=width, scheme="dark", storage=default_storage(h.site), stub=True)
                if present:
                    blank_gate(sess)
                page = sess.page()
                goto_page(page, h, path, False)
                snap(name)
                page.evaluate("window.scrollTo(0, 2200)")
                page.wait_for_timeout(400)
                snap(name + "-lower")
                sess.close()
        finally:
            h.close_browser(browser)
    ev["screenshots"] = sorted(shots)
    want = ["compare", "deeper", "drawer", "home", "map", "region"]      # each also has -lower / -cards / -criteria companions
    ev["c_screenshot_set_complete"] = all(("%s-%d.png" % (n, w)) in shots for n in want for w in (1280, 390))
    review = read_review()
    ev["c_screenshots_reviewed"] = bool(review) and set(want) <= set(review.get("viewed", []))
    ev["review_file"] = str(DARK_REVIEW) if review else None
    ev["decision"] = ("gate lifted: dark ships (the whole matrix ran in dark)" if not present else
                      "gate kept: light-only ships" if not (ev.get("a_contrast_zero_failures") and ev["b_no_hardcoded_light_colour"] and ev["c_screenshots_reviewed"]) else
                      "ready to lift theme-gate.css (a, b and c hold)")
    ev["reasons_kept"] = [] if not present else [x for x in (
        None if ev.get("a_contrast_zero_failures") else "(a) contrast failures in dark or 390 light",
        None if ev["b_no_hardcoded_light_colour"] else "(b) hard-coded light colours: %d" % len(hits),
        None if ev["c_screenshots_reviewed"] else "(c) dark screenshots not yet recorded as viewed") if x]
    record["dark_gate"] = ev
    r.check("dark-gate:screenshots-saved", ev["c_screenshot_set_complete"], "%d saved in %s" % (len(shots), OUT_DIR))
    r.info("dark-gate:evidence", json.dumps({k: v for k, v in ev.items() if k not in ("hardcoded_light_colours",)}, default=str)[:3500])
    if not present:
        # gate lifted: the evidence becomes hard requirements
        r.check("dark-gate:contrast-probe-zero-failures-1280-dark-and-390-light-and-dark", ev["a_contrast_zero_failures"], json.dumps(ev["contrast"]))
        r.check("dark-gate:no-hardcoded-light-colour-outside-tokens", not hits, "; ".join(hits[:5]))
        r.check("dark-gate:screenshots-were-viewed", ev["c_screenshots_reviewed"], "write %s listing the six surfaces viewed" % DARK_REVIEW.name)
    else:
        r.info("dark-gate:hardcoded-light-colours", "%d outside tokens.css (+%d inside @media print, exempt): %s" % (len(hits), exempt, "; ".join(hits[:12])))
    return ev


# ------------------------------------------------------------------------------------------------------------------ entry point
def run(ctx):
    h = ctx
    r = h.new_results(NAME)
    record = {"axe_version": axe.version(), "runs": 0, "nodes_checked": 0, "by_impact": {}, "allowed": [], "incomplete": {}, "contrast": {}, "tags": axe.TAGS}
    try:
        ents = guards(r, h)
    except Exception as e:
        r.check("guard:suite-setup", False, "%s: %s" % (type(e).__name__, str(e)[:300]))
        return r.out
    gate = theme_gate_present(h.site)
    record["gate_active"] = gate
    schemes = ["light"] if gate else ["light", "dark"]
    record["schemes"] = schemes
    used = set()
    for scheme in schemes:
        used |= matrix(r, h, ents, h.widths, scheme, gate_off=False, record=record)
    motion_variants(r, h, ents, record)
    keyboard(r, h)
    focus_rings(r, h)
    motion(r, h)
    dark_gate(r, h, ents, record)
    unused = [i for i in range(len(ents)) if i not in used]
    r.info("axe:allowlist-unused-entries", [ents[i].get("rule") for i in unused])
    r.info("axe:summary", json.dumps({k: record[k] for k in ("axe_version", "runs", "nodes_checked", "by_impact", "incomplete")}, default=str))
    h.extra["a11y"] = record
    return r.out
