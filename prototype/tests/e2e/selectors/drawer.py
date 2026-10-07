"""Selectors and in-page scripts for the drawer suite (suites/test_drawer.py): the frame, the head, the refusal band, the asks, the
Land standing and place-strip styles and the overlay manager (MC-DRAWER). Loaded by file path through lib/sel.py (this directory has
no __init__.py on purpose)."""

SEL = {
    "backdrop": "#region-drawer",
    "panel": "#region-drawer .drawer-panel",
    "body": "#drawer-body",
    "close": "#drawer-close",
    "main": "#main",
    "rail": "#rct-rail",
    "modal": "#signup-modal",
    "modal_close": "#modal-close-btn",
    "compare": "#compare-overlay",
    "head": "#drawer-body > section.drawer-head",
    "sal": ".drawer-sal",
    "name": ".drawer-name",
    "country": ".drawer-country",
    "pin": "#region-drawer .drawer-star[data-region]",
    "intro": "#drawer-body > section.drawer-intro",
    "fulllink": ".drawer-fulllink",
    "ls": ".drawer-land-standing",
    "refusal": "#drawer-body > section.refusal",
    "asks": "#drawer-body > section.drawer-asks",
    "place": "#drawer-body > .place-strip",
    "provenance": ".drawer-land-standing .ls-provenance",
}

# The fixed reading order (design 8.10), as the selector of each block's root element in #drawer-body.
ORDER = [
    ("head", "section.drawer-head"),
    ("blurb", "section.drawer-intro"),
    ("land-standing", ".drawer-land-standing"),
    ("refusal", "section.refusal"),
    ("asks", "section.drawer-asks"),
    ("place", ".place-strip"),
    ("way", "section.way"),
    ("context", "section.drawer-ctx"),
    ("criteria", "section.drawer-criteria"),
]

REGIONS = ["kootenays", "galicia", "alentejo", "nova-scotia"]

# Words that must never appear in the blocks this WP renders (framework discipline). Whole words, any case.
BANNED_WORDS = r"\b(score|scores|scored|scoring|rank|ranks|ranked|ranking|best|top)\b"
ARROW_CHARS = "←↑→↓↔↕↖↗↘↙⇒▲▼"

# Open the drawer through the bus (the same event cards, chips and markers emit).
JS_OPEN = """async (id) => { const b = await import('/src/bus.js'); b.emit('drawer:open', { regionId: id }); }"""

# Which blocks have data for a region (so the test knows which ones a drawer must show).
JS_PRESENT = """async () => {
  const d = await import('/src/data.js');
  const dd = await d.loadDrawerData();
  const full = d.loadFullData ? await d.loadFullData() : {};   // Land standing, region depth and reciprocity are off the first-paint path (MC-PERF)
  const bag = { ...d, ...full, ...dd };
  const out = {};
  for (const r of d.regions) {
    out[r.id] = {
      landStanding: !!(bag.landStanding && bag.landStanding[r.id]),
      asks: !!(bag.regionDepth && bag.regionDepth[r.id] && (bag.regionDepth[r.id].asks || bag.regionDepth[r.id].caseStudy)),
      caseStudy: !!(bag.regionDepth && bag.regionDepth[r.id] && bag.regionDepth[r.id].caseStudy),
      place: !!(bag.bioregions && bag.bioregions[r.id]),
      way: !!(bag.legalPathway && bag.legalPathway[r.id]),
      context: !!(bag.context && bag.context[r.id]),
    };
  }
  return out;
}"""

# The block roots of #drawer-body in order, as ORDER ids (a root matching none of them is reported as '?').
JS_ORDER = """(order) => Array.from(document.querySelectorAll('#drawer-body > *')).map((n) => {
  for (const [id, sel] of order) if (n.matches(sel)) return id;
  return '?:' + n.tagName.toLowerCase() + '.' + n.className;
})"""

# Frame facts in one round trip.
JS_FRAME = """() => {
  const q = (s) => document.querySelector(s);
  const p = q('#region-drawer .drawer-panel'); const cs = getComputedStyle(p); const r = p.getBoundingClientRect();
  const bd = getComputedStyle(q('#region-drawer')); const body = q('#drawer-body'); const bcs = getComputedStyle(body);
  const wave = p.querySelector(':scope > .wave'); const wcs = wave && getComputedStyle(wave);
  const cl = q('#drawer-close'); const clr = cl.getBoundingClientRect();
  return {
    position: cs.position, maxHeight: cs.maxHeight, width: r.width, left: r.left, top: r.top, bottom: r.bottom, height: r.height,
    vw: innerWidth, vh: innerHeight, borderLeft: cs.borderLeftWidth + ' ' + cs.borderLeftStyle, bg: cs.backgroundColor, sheet: getComputedStyle(document.documentElement).getPropertyValue('--sheet'),
    z: bd.zIndex, backdropVisibility: bd.visibility, backdropOpacity: bd.opacity,
    transitionDuration: cs.transitionDuration, transitionProperty: cs.transitionProperty, transform: cs.transform,
    bodyOverflowY: bcs.overflowY, panelOverflow: cs.overflowY,
    wave: wave ? { h: wcs.height, hasMask: (wcs.maskImage || wcs.webkitMaskImage || '') !== 'none', ariaHidden: wave.getAttribute('aria-hidden'), bg: wcs.backgroundColor } : null,
    close: { w: clr.width, h: clr.height, radius: getComputedStyle(cl).borderRadius, label: cl.getAttribute('aria-label') },
    ariaModal: q('#region-drawer').getAttribute('aria-modal'), role: q('#region-drawer').getAttribute('role'),
    mainInert: q('#main').hasAttribute('inert'), railInert: !!(q('#rct-rail') && q('#rct-rail').hasAttribute('inert')),
    bodyClass: document.body.className, ariaHidden: q('#region-drawer').getAttribute('aria-hidden'),
  };
}"""

# Head, blurb, asks, Land standing and place facts for the open drawer.
JS_BLOCKS = """() => {
  const q = (s, root) => (root || document).querySelector(s);
  const txt = (e) => (e ? (e.innerText || '').replace(/\\s+/g, ' ').trim() : '');
  const fs = (e) => { if (!e) return null; const c = getComputedStyle(e); return { family: c.fontFamily.split(',')[0].replace(/['"]/g, ''), style: c.fontStyle, weight: c.fontWeight, size: parseFloat(c.fontSize), color: c.color, bg: c.backgroundColor, opacity: c.opacity }; };
  const head = q('#drawer-body > section.drawer-head');
  const sal = head && q('.drawer-sal', head); const nm = head && q('.drawer-name', head); const ct = head && q('.drawer-country', head);
  const pin = q('#region-drawer .drawer-star[data-region]');
  const before = (a, b) => !!(a && b && (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING));
  const full = q('#drawer-body .drawer-fulllink');
  const asks = q('#drawer-body > section.drawer-asks');
  const ls = q('#drawer-body > .drawer-land-standing');
  const terr = ls && q('.ls-territory', ls); const row = ls && q('.ls-row', ls); const lsr = ls && getComputedStyle(ls);
  const place = q('#drawer-body > .place-strip');
  const deep = asks && q('.drawer-deeplink', asks); const asrc = asks && q('.drawer-asks-src', asks);
  return {
    head: head ? { tag: head.tagName.toLowerCase(), labelledby: head.getAttribute('aria-labelledby'), nameTag: nm && nm.tagName.toLowerCase(), nameId: nm && nm.id,
      salText: txt(sal), salLabel: txt(q('.sal-k', sal)), salValue: txt(q('.drawer-sal-v', sal)), name: txt(nm), country: txt(ct),
      salBeforeName: before(sal, nm), nameBeforeCountry: before(nm, ct), salFs: fs(q('.drawer-sal-v', sal)), nameFs: fs(nm), countryFs: fs(ct) } : null,
    pin: pin ? { text: txt(pin), pressed: pin.getAttribute('aria-pressed'), label: pin.getAttribute('aria-label'), svg: !!pin.querySelector('svg'), region: pin.dataset.region, glyph: /[\\u2605\\u2606]/.test(pin.textContent) } : null,
    full: full ? { text: txt(full), href: full.getAttribute('href'), svg: !!full.querySelector('svg'), arrowGlyph: txt(full).includes('\\u2192') } : null,
    asks: asks ? { text: txt(asks), tag: asks.tagName.toLowerCase(), labelledby: asks.getAttribute('aria-labelledby'), h4: txt(q('h4', asks)),
      border: getComputedStyle(asks).borderLeftWidth + ' ' + getComputedStyle(asks).borderLeftStyle, borderColor: getComputedStyle(asks).borderLeftColor, bg: getComputedStyle(asks).backgroundColor,
      accent: getComputedStyle(document.documentElement).getPropertyValue('--accent'), textFs: fs(q('.drawer-asks-text', asks)),
      src: asrc ? { text: txt(asrc), href: (q('a', asrc) || {}).href || '' } : null,
      deep: deep ? { text: txt(deep), href: deep.getAttribute('href'), svg: !!deep.querySelector('svg') } : null,
      hasTextArrow: txt(asks).includes('\\u2192') } : null,
    ls: ls ? { radius: lsr.borderRadius, bg: lsr.backgroundColor, hasBraid: !!q('.braid', ls), tagText: txt(q('.tag', ls) || q('h4', ls)), terrFs: fs(terr), rowCols: row ? getComputedStyle(row).gridTemplateColumns.split(' ').length : 0,
      rowFirstCol: row ? parseFloat(getComputedStyle(row).gridTemplateColumns.split(' ')[0]) : 0, provenance: !!q('.ls-provenance', ls), consent: !!q('.ls-consent', ls), arrive: !!q('.ls-arrive', ls) } : null,
    place: place ? { radius: getComputedStyle(place).borderRadius, bg: getComputedStyle(place).backgroundColor, tag: txt(q('.tag', place)), placeFs: fs(q('.place', place)), dl: getComputedStyle(q('.place-dl', place) || place).display } : null,
  };
}"""

# The refusal band, serialised (it must be identical from one region to the next) plus its look.
JS_REFUSAL = """() => {
  const n = document.querySelector('#drawer-body > section.refusal');
  if (!n) return null;
  const svg = n.querySelector('svg'); const p = n.querySelector('p'); const sm = n.querySelector('small');
  const pc = getComputedStyle(p); const sc = svg && getComputedStyle(svg); const r = svg && svg.getBoundingClientRect();
  const all = [n, ...n.querySelectorAll('*')];
  return {
    html: n.outerHTML, text: (n.innerText || '').replace(/\\s+/g, ' ').trim(), sentence: p.textContent, small: sm && sm.textContent,
    paths: svg ? svg.querySelectorAll('path').length : 0, svgAriaHidden: svg && svg.getAttribute('aria-hidden'), svgColor: sc && sc.color, svgH: r && r.height, svgMaxW: sc && sc.maxWidth,
    accent: getComputedStyle(document.documentElement).getPropertyValue('--accent'),
    pFs: { family: pc.fontFamily.split(',')[0].replace(/['"]/g, ''), style: pc.fontStyle, size: parseFloat(pc.fontSize), maxWidth: pc.maxWidth, fontSize: pc.fontSize },
    animated: all.some((e) => { const c = getComputedStyle(e); return (c.animationName && c.animationName !== 'none') || c.transitionDuration.split(',').some((d) => parseFloat(d) > 0.001); }),
    animateEls: n.querySelectorAll('animate, animateTransform, set').length,
    dashed: !!(svg && Array.from(svg.querySelectorAll('path')).some((e) => e.getAttribute('stroke-dasharray'))),
  };
}"""

# Opacity on any text in the drawer: an element with its own text, or any ancestor up to (and excluding) the scrim, that is not fully opaque.
JS_OPACITY = """() => {
  const bad = []; const body = document.querySelector('#region-drawer .drawer-panel');
  body.querySelectorAll('*').forEach((el) => {
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden') return;
    for (let e = el; e && e !== document.getElementById('region-drawer'); e = e.parentElement) {
      const o = parseFloat(getComputedStyle(e).opacity);
      if (o < 1) { bad.push({ text: (el.textContent || '').trim().slice(0, 40), at: e.tagName.toLowerCase() + '.' + (e.className || ''), opacity: o }); break; }
    }
  });
  return bad;
}"""

# Rendered-text contrast of everything in #drawer-body (the ledger and the way in have their own suite; this one covers every block).
JS_CONTRAST = """() => {
  const parse = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } }
    let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base); return base; };
  const bad = []; let checked = 0;
  document.querySelectorAll('#drawer-body *').forEach((el) => {
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
    if (!own) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('details:not([open])') && !el.matches('summary')) return;
    const fg0 = parse(cs.color); if (!fg0) return;
    const bg = bgOf(el); const fg = blend(fg0, bg);
    const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
    const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = (size >= 24 || (bold && size >= 18.66)) ? 3 : 4.5;
    checked++;
    if (ratio < need) bad.push({ ratio: Math.round(ratio * 100) / 100, need, text: (el.textContent || '').trim().slice(0, 50), fg: cs.color });
  });
  return { checked, bad };
}"""

# The .ls-provenance line: computed look, contrast against the effective ground, and where it sits.
JS_PROVENANCE = """() => {
  const n = document.querySelector('#drawer-body .drawer-land-standing .ls-provenance');
  if (!n) return null;
  const parse = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c); const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  let bg = null; for (let e = n; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c.a >= 1) { bg = c; break; } }
  const cs = getComputedStyle(n); const fg = parse(cs.color); const src = document.querySelector('#drawer-body .drawer-land-standing .ls-src');
  const L1 = lum(fg), L2 = lum(bg); const r = n.getBoundingClientRect();
  let faded = false; for (let e = n; e && e.id !== 'region-drawer'; e = e.parentElement) if (parseFloat(getComputedStyle(e).opacity) < 1) faded = true;
  return { text: n.textContent.trim(), color: cs.color, srcColor: src ? getComputedStyle(src).color : null, size: parseFloat(cs.fontSize), family: cs.fontFamily.split(',')[0].replace(/['"]/g, ''),
    style: cs.fontStyle, opacity: cs.opacity, faded, ratio: Math.round(((Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05)) * 100) / 100,
    display: cs.display, w: r.width, h: r.height, right: r.right, vw: innerWidth, afterSrc: !!(src && (src.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING)),
    directlyAfterSrc: !!(src && src.nextElementSibling === n), count: document.querySelectorAll('#drawer-body .ls-provenance').length };
}"""

# A standalone Land standing fragment, outside the drawer, to read the .ls-provenance rules under print media.
JS_PRINT_FIXTURE = """() => {
  const host = document.createElement('div'); host.id = 'print-fixture';
  host.innerHTML = '<div class="drawer-land-standing"><details class="ls-claims"><summary>Sources for this row (1)</summary><ul><li>x</li></ul></details><p class="ls-src">Source: x</p><p class="ls-provenance">No nation or community named here has reviewed this entry.</p></div>';
  document.body.appendChild(host);
  const n = host.querySelector('.ls-provenance'); const cs = getComputedStyle(n);
  return { display: cs.display, size: parseFloat(cs.fontSize), opacity: cs.opacity, color: cs.color, srcColor: getComputedStyle(host.querySelector('.ls-src')).color, style: cs.fontStyle };
}"""

# The overlay manager, driven directly with two throwaway panels: one stack, one Escape per layer, inert, focus restore.
JS_MANAGER = """async () => {
  const o = await import('/src/ui/overlays.js');
  const mk = (id) => { const d = document.createElement('div'); d.id = id; d.innerHTML = '<button type="button" id="' + id + '-a">a</button><button type="button" id="' + id + '-b">b</button>'; document.body.appendChild(d); return d; };
  const A = mk('ov-a'); const B = mk('ov-b');
  const trigA = document.createElement('button'); trigA.id = 'ov-trig-a'; trigA.textContent = 't'; document.body.appendChild(trigA);
  const log = []; const out = {};
  trigA.focus();
  o.open('ov-a', { panel: A, trigger: trigA, onClose: (why) => log.push('a:' + why) });
  out.afterA = { count: o.count(), top: o.top(), mainInert: document.getElementById('main').hasAttribute('inert'), bodyClass: document.body.className, aInert: A.hasAttribute('inert') };
  document.getElementById('ov-a-b').focus();
  o.open('ov-b', { panel: B, trigger: document.getElementById('ov-a-b'), onClose: (why) => log.push('b:' + why) });
  out.afterB = { count: o.count(), top: o.top(), aInert: A.hasAttribute('inert'), bInert: B.hasAttribute('inert') };
  document.getElementById('ov-b-a').focus();
  out.esc1 = null;
  window.__ov = { o, A, B, log, out, trigA };
  return out;
}"""

JS_MANAGER_AFTER = """() => {
  const { o, A, B, log, trigA } = window.__ov;
  const r = { log: log.slice(), count: o.count(), top: o.top(), aInert: A.hasAttribute('inert'), bInert: B.hasAttribute('inert'), focusId: document.activeElement && document.activeElement.id,
    mainInert: document.getElementById('main').hasAttribute('inert'), bodyClass: document.body.className };
  return r;
}"""

JS_MANAGER_CLEAN = """() => { const { A, B, trigA, o } = window.__ov; while (o.count()) o.closeTop('cleanup'); A.remove(); B.remove(); trigA.remove(); delete window.__ov; }"""
