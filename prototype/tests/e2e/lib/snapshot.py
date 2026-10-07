"""Snapshot capture for the zero-behaviour-change equivalence gate (map-craft 3.4).

STATES x WIDTHS = 14 snapshots. Each snapshot is: normalised <body> HTML, computed-style fingerprint, network summary,
MapLibre style dump, console log and a masked full-page PNG. Third-party requests are STUBBED while capturing so the
result never depends on the network.
"""
import hashlib
import json
import os
import re
from pathlib import Path

from . import sel as _sel
from .site import default_storage, goto_settled, wait_map_idle

S = _sel.home()
SEL = S.SEL
WIDTHS = [(1280, 900), (390, 844)]

NORMALISE_JS = r"""
() => {
  const body = document.body.cloneNode(true);
  body.querySelectorAll('script, style, link, noscript').forEach(n => n.remove());
  // MapLibre-injected subtrees: everything under a .maplibregl-* node except the region markers
  const keep = new Set();
  body.querySelectorAll('.region-marker').forEach(n => { n.removeAttribute('style'); keep.add(n); });
  body.querySelectorAll('[class*="maplibregl-"]').forEach(n => {
    if (n.classList.contains('region-marker')) return;
    if (n.querySelector('.region-marker') || n.closest('.region-marker')) return;      // container of markers: handled below
    if (n.id === 'map') return;
    n.remove();
  });
  // keep #map and the marker containers but strip their MapLibre-managed attributes
  body.querySelectorAll('.maplibregl-canvas-container, .maplibregl-map, #map').forEach(n => {
    n.removeAttribute('style'); n.removeAttribute('tabindex'); n.removeAttribute('aria-label');
  });
  const walker = document.createTreeWalker(body, NodeFilter.SHOW_COMMENT);
  const comments = []; while (walker.nextNode()) comments.push(walker.currentNode);
  comments.forEach(c => c.remove());
  body.querySelectorAll('[class]').forEach(n => {
    const cls = Array.from(n.classList).filter(c => c !== 'pulse').sort();
    if (cls.length) n.setAttribute('class', cls.join(' ')); else n.removeAttribute('class');
  });
  // reflect live input values (not attributes) so slider state is part of the snapshot
  body.querySelectorAll('input[type=range]').forEach(n => {});
  const live = Array.from(document.querySelectorAll('input[type=range]')).map(n => n.value);
  body.querySelectorAll('input[type=range]').forEach((n, i) => n.setAttribute('data-live-value', live[i]));
  return body.outerHTML.replace(/\s+/g, ' ').replace(/> </g, '>\n<').trim();
}
"""

FINGERPRINT_JS = r"""
({sels, props}) => {
  const out = {};
  for (const [name, css] of Object.entries(sels)) {
    let el = null;
    try { el = Array.from(document.querySelectorAll(css)).find(e => e.getClientRects().length || getComputedStyle(e).display !== 'none') || document.querySelector(css); } catch (e) {}
    if (!el) { out[name] = null; continue; }
    const cs = getComputedStyle(el), o = {};
    for (const p of props) o[p] = cs[p];
    out[name] = o;
  }
  return out;
}
"""

STYLE_DUMP_JS = r"""
() => {
  const m = window.__maps && window.__maps[0];
  if (!m) return null;
  let st; try { st = m.getStyle(); } catch (e) { return {error: String(e)}; }
  if (!st) return null;
  const pick = (o) => JSON.parse(JSON.stringify(o));
  return pick({ version: st.version, glyphs: st.glyphs, sprite: st.sprite, sources: st.sources, layers: st.layers, light: st.light, transition: st.transition });
}
"""


def sha(s):
    return hashlib.sha256(s.encode("utf-8")).hexdigest()


def style_dump(page):
    try:
        return page.evaluate(STYLE_DUMP_JS)
    except Exception as e:
        return {"error": str(e)[:200]}


def network_summary(session):
    g = session.guard
    own_nonjs = sorted({p for (_m, p, t) in g.own_requests
                        if t not in ("script", "stylesheet", "document") and not p.endswith((".js", ".css", ".html"))})
    return {"third_party_hosts": sorted(g.third_hosts.keys()), "own_non_js_css": own_nonjs,
            "own_scripts": sorted({p for (_m, p, t) in g.own_requests if t == "script"}),
            "own_styles": sorted({p for (_m, p, t) in g.own_requests if t == "stylesheet"})}


def _wait_state(page, what, timeout=8000):
    try:
        page.wait_for_selector(what, timeout=timeout, state="attached")
    except Exception:
        pass


def drive_state(page, state, h):
    """Bring `page` (already created in a fresh session) into the named state. Returns the URL used."""
    base = h.base
    if state == "initial":
        goto_settled(page, base + "/", extra_ms=800)
    elif state == "preset":
        goto_settled(page, base + "/", extra_ms=500)
        page.locator(SEL["preset_chip"], has_text=S.PRESET_LABEL).first.click()
        page.wait_for_timeout(900)
        wait_map_idle(page)
    elif state == "drawer":
        goto_settled(page, base + "/", extra_ms=500)
        card = page.locator("#region-%s" % S.DRAWER_REGION)
        card.focus()
        page.keyboard.press("Enter")
        _wait_state(page, "%s[aria-hidden=false], %s.open" % (SEL["drawer"], SEL["drawer"]))
        page.wait_for_timeout(900)
    elif state == "compare":
        goto_settled(page, base + "/?pin=" + ",".join(S.COMPARE_PINS), extra_ms=500)
        page.locator(SEL["shortlist_btn"]).click()
        _wait_state(page, "%s.open" % SEL["compare"])
        page.wait_for_timeout(900)
    elif state == "na-tab":
        goto_settled(page, base + "/", extra_ms=500)
        page.locator('%s[data-continent="north-america"]' % SEL["continent_tab"]).click()
        page.wait_for_timeout(600)
        wait_map_idle(page)
        page.wait_for_timeout(500)
    elif state == "filtered":
        goto_settled(page, base + S.FILTERED_LINK, extra_ms=800)
    elif state == "modal":
        goto_settled(page, base + "/?modal=1", extra_ms=500)
        _wait_state(page, "%s.visible" % SEL["modal"])
        page.wait_for_timeout(900)
    else:
        raise ValueError("unknown state " + state)


STATES = ["initial", "preset", "drawer", "compare", "na-tab", "filtered", "modal"]


def masked_screenshot(page, path):
    """Full-page PNG with the map canvas and the attribution control masked (hidden, layout kept)."""
    page.add_style_tag(content="#map{visibility:hidden!important}.maplibregl-ctrl-attrib,.maplibregl-ctrl-attrib *{visibility:hidden!important}")
    page.wait_for_timeout(150)
    try:
        page.screenshot(path=path, full_page=True, timeout=60000)
        return "single"
    except Exception:
        pass
    from PIL import Image
    dims = page.evaluate("({w: document.documentElement.scrollWidth, h: document.documentElement.scrollHeight})")
    chunk, y, i, tmp = 3600, 0, 0, []
    while y < dims["h"]:
        ch = min(chunk, dims["h"] - y)
        cp = "%s.part%03d.png" % (path, i)
        page.screenshot(path=cp, full_page=True, clip={"x": 0, "y": y, "width": dims["w"], "height": ch}, timeout=60000)
        tmp.append(cp); y += ch; i += 1
    Image.MAX_IMAGE_PIXELS = None
    canvas = Image.new("RGB", (Image.open(tmp[0]).width, dims["h"]), "white")
    yy = 0
    for cp in tmp:
        im = Image.open(cp).convert("RGB"); canvas.paste(im, (0, yy)); yy += im.height; im.close(); os.remove(cp)
    canvas.save(path)
    return "stitched"


def capture_one(h, browser, state, width, height, out_dir, shots_dir, layers_style=False):
    """Capture one (state, width) snapshot. Returns the JSON-able record (heavy parts are written next to it)."""
    storage = default_storage(h.site, modal=(state == "modal"))
    s = h.session(browser, width=width, height=height, scheme="light", reduced_motion=True, storage=storage,
                  stub=True, freeze_date=True, kill_motion=True)
    page = s.page()
    log = s.log(page)
    rec = {"state": state, "width": width, "height": height}
    try:
        drive_state(page, state, h)
        page.wait_for_timeout(300)
        body = page.evaluate(NORMALISE_JS)
        rec["body_sha256"] = sha(body)
        rec["body_bytes"] = len(body)
        rec["fingerprint"] = page.evaluate(FINGERPRINT_JS, {"sels": S.FINGERPRINT, "props": S.FINGERPRINT_PROPS})
        st = style_dump(page)
        rec["style_sha256"] = sha(json.dumps(st, sort_keys=True)) if st is not None else None
        rec["network"] = network_summary(s)
        rec["console"] = sorted({"%s: %s" % (c["type"], re.sub(r"\d+(\.\d+)?", "#", c["text"])) for c in log.console
                                 if c["type"] in ("error", "warning")})
        rec["pageerrors"] = [re.sub(r"\d+", "#", e) for e in log.pageerrors]
        rec["formsubmit_attempts"] = list(s.guard.formsubmit)
        rec["url"] = page.url.replace(h.base, "")
        tag = "%s@%d" % (state, width)
        (Path(out_dir) / "snapshots").mkdir(parents=True, exist_ok=True)
        (Path(out_dir) / "snapshots" / (tag + ".body.html")).write_text(body, "utf-8")
        (Path(out_dir) / "snapshots" / (tag + ".style.json")).write_text(json.dumps(st, indent=1, sort_keys=True), "utf-8")
        if layers_style:
            rec["style_after_toggle"] = style_per_layer(page, out_dir, tag)
        shot = os.path.join(shots_dir, tag + ".png")
        os.makedirs(shots_dir, exist_ok=True)
        masked_screenshot(page, shot)
        rec["screenshot"] = shot
        rec["ok"] = True
    except Exception as e:
        rec["ok"] = False
        rec["error"] = str(e)[:400]
    finally:
        s.close()
    return rec


def style_per_layer(page, out_dir, tag):
    """After `load`, toggle each map layer on (one at a time) and record the style hash; toggle off again."""
    res = {}
    btns = page.locator(SEL["layer_buttons"])
    n = btns.count()
    try:
        if page.get_attribute(SEL["layers_toggle"], "aria-expanded") == "false":
            page.click(SEL["layers_toggle"])
    except Exception:
        pass
    full = {}
    for i in range(n):
        b = btns.nth(i)
        name = (b.inner_text() or "").strip().split("\n")[-1].strip()
        if not b.is_visible():
            res[name] = "hidden"
            continue
        b.scroll_into_view_if_needed()
        b.click()
        page.wait_for_timeout(350)
        st = style_dump(page)
        res[name] = sha(json.dumps(st, sort_keys=True))
        full[name] = st
        b.click()
        page.wait_for_timeout(200)
    (Path(out_dir) / "snapshots" / (tag + ".style-toggled.json")).write_text(json.dumps(full, indent=1, sort_keys=True), "utf-8")
    return res
