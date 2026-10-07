"""Selectors and page scripts for the shell suite (suites/test_shell.py): skip link, suite rail, top line, colophon, signup modal skin,
suite note, mobile note. Owned by MC-SHELL. Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "skip": ".skip-link",
    "rail": "#rct-rail",
    "rail_links": "#rct-rail nav a",
    "rail_current": "#rct-rail nav a[aria-current]",
    "rail_foot": "#rct-rail .rct-foot a",
    "topline": ".prototype-banner",
    "colophon": "footer.colophon",
    "colophon_art": "footer.colophon .art",
    "colophon_frame": "footer.colophon .frame",
    "colophon_cols": "footer.colophon .cols",
    "colophon_h": "footer.colophon .cols h3, footer.colophon .cols h4",
    "colophon_notes": "footer.colophon .notes",
    "colophon_stamp": "footer.colophon .stamp",
    "sources": "#sources-list",
    "suite_note": ".suite-note",
    "pass_on": "#passOn",
    "mobile_note": "#mobile-note",
    "mobile_note_x": "#mobile-note-x",
    "hero_form": "#signup-form",
    "hero_status": "#form-status",
    "modal": "#signup-modal",
    "modal_card": "#signup-modal .modal-card",
    "modal_close": "#modal-close-btn",
    "modal_wave": "#signup-modal .modal-wave",
    "modal_form": "#modal-form",
    "modal_status": "#modal-status",
    "drawer": "#region-drawer",
    "compare": "#compare-overlay",
    "contact": "section.contact",
}

# The rail, in order: (numeral line, name, host). The labels and URLs are the suite's, shared with the other tools.
RAIL = [
    ("01 · People", "Community Compass", "compass.regencommunity.tools"),
    ("02 · The Field", "The Living Atlas", "atlas.regencommunity.tools"),
    ("03 · The Ground", "Land Selection", "land-selection-framework.regencommunity.tools"),
    ("04 · The Holding", "Who Holds This", "whoholds.regencommunity.tools"),
    ("05 · The Movement", "Nomad Trail", "trail.regencommunity.tools"),
    ("00 · The Other Beginning", "Community Commons", "commons.regencommunity.tools"),
]

FRAME_SENTENCE = ("Opinionated about method, quiet about preference. Read the data, set your own thresholds, decide for yourself.")
TOPLINE_TEXT = "Prototype 2026 · a designed demonstration, not the V1 data build"
HOW_TO_READ = [
    "Thresholds filter; they never score or rank.",
    "Land standing is qualitative and never a filter.",
    "Every value carries its source and vintage.",
    "The rivers and contours drawn on this page are ornament, not surveyed. For geography, use the map and ask the people who live there.",
]
COLOPHON_HEADINGS = ["Who made this", "How to read it", "Sources cited"]

# The first Tab stop, with its position relative to the rail and what it looks like while focused.
JS_FIRST_TAB = """() => {
  const a = document.activeElement; if (!a || a === document.body) return null;
  const rail = document.getElementById('rct-rail');
  const r = a.getBoundingClientRect(); const cs = getComputedStyle(a);
  const probe = document.createElement('span'); probe.style.color = 'var(--accent)'; document.body.appendChild(probe);
  const accent = getComputedStyle(probe).color; probe.remove();
  return { cls: a.className && a.className.toString(), href: a.getAttribute('href'), text: (a.textContent || '').trim(),
    beforeRail: !!(rail && (a.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING)),
    top: Math.round(r.top), left: Math.round(r.left), right: Math.round(r.right), bottom: Math.round(r.bottom), vw: innerWidth, vh: innerHeight,
    outlineWidth: cs.outlineWidth, outlineStyle: cs.outlineStyle, outlineColor: cs.outlineColor, accent: accent,
    background: cs.backgroundColor, color: cs.color, transform: cs.transform };
}"""

# Resolved token colours as computed rgb() strings (a probe element per token).
JS_TOKENS = """() => { const out = {}; for (const n of ['ink', 'paper', 'paper-2', 'paper-3', 'accent', 'accent-soft', 'rule', 'rule-strong']) {
  const p = document.createElement('span'); p.style.color = 'var(--' + n + ')'; document.body.appendChild(p);
  out[n] = getComputedStyle(p).color; p.remove(); } return out; }"""

JS_RAIL = """() => {
  const rail = document.getElementById('rct-rail'); if (!rail) return null;
  const cs = getComputedStyle(rail);
  const nav = rail.querySelector('nav'); const links = Array.from(rail.querySelectorAll('nav a'));
  const cur = rail.querySelector('nav a[aria-current]');
  const navBefore = getComputedStyle(nav, '::before');
  const mask = navBefore.webkitMaskImage || navBefore.maskImage || '';
  const first = links[0]; const firstBefore = getComputedStyle(first, '::before');
  const curBefore = cur ? getComputedStyle(cur, '::before') : null;
  const foot = rail.querySelector('.rct-foot'); const wm = rail.querySelector('.rct-wordmark');
  const wcs = wm ? getComputedStyle(wm) : null;
  return {
    position: cs.position, width: Math.round(rail.getBoundingClientRect().width), zIndex: cs.zIndex, bg: cs.backgroundColor,
    borderRight: cs.borderRightWidth + ' ' + cs.borderRightStyle, display: cs.display,
    count: links.length,
    items: links.map((a) => ({ num: (a.querySelector('.rct-num') || {}).textContent, nm: (a.querySelector('.rct-nm') || {}).textContent,
      href: a.getAttribute('href'), current: a.getAttribute('aria-current') })),
    currentBg: cur ? getComputedStyle(cur).backgroundColor : null, currentColor: cur ? getComputedStyle(cur).color : null,
    currentNode: curBefore ? { w: curBefore.width, h: curBefore.height, bg: curBefore.backgroundColor, display: curBefore.display } : null,
    firstNode: { w: firstBefore.width, h: firstBefore.height, display: firstBefore.display, borderW: firstBefore.borderTopWidth, radius: firstBefore.borderTopLeftRadius, bg: firstBefore.backgroundColor, borderColor: firstBefore.borderTopColor },
    stem: { display: navBefore.display, mask: mask.slice(0, 40), width: navBefore.width, hasMask: /url\\(/.test(mask) },
    foot: foot ? { display: getComputedStyle(foot).display, text: foot.textContent.trim(), href: (foot.querySelector('a') || {}).href } : null,
    wordmark: wcs ? { size: wcs.fontSize, weight: wcs.fontWeight, ls: wcs.letterSpacing, tt: wcs.textTransform, family: wcs.fontFamily } : null,
    nums: links.map((a) => { const s = getComputedStyle(a.querySelector('.rct-num')); return { size: s.fontSize, weight: s.fontWeight, tt: s.textTransform }; }),
    names: links.map((a) => { const s = getComputedStyle(a.querySelector('.rct-nm')); return { size: s.fontSize, weight: s.fontWeight }; }),
    bodyPadLeft: getComputedStyle(document.body).paddingLeft,
    navDisplay: getComputedStyle(nav).display, navCols: getComputedStyle(nav).gridTemplateColumns
  };
}"""

JS_TOPLINE = """() => {
  const b = document.querySelector('.prototype-banner'); if (!b) return null;
  const cs = getComputedStyle(b); const tag = b.querySelector('b, .proto-tag'); const tcs = tag ? getComputedStyle(tag) : null;
  const p = b.querySelector('p'); const pcs = p ? getComputedStyle(p) : null;
  return { text: (b.textContent || '').replace(/\\s+/g, ' ').trim(), bg: cs.backgroundColor, borderBottom: cs.borderBottomWidth,
    tagColor: tcs && tcs.color, tagTransform: tcs && tcs.textTransform, tagText: tag && tag.textContent.trim(),
    pSize: pcs && pcs.fontSize, pWeight: pcs && pcs.fontWeight, pColor: pcs && pcs.color, rows: b.getBoundingClientRect().height };
}"""

JS_COLOPHON = """() => {
  const f = document.querySelector('footer.colophon'); if (!f) return null;
  const cs = getComputedStyle(f);
  const frame = f.querySelector('.frame'); const fcs = frame ? getComputedStyle(frame) : null;
  const cols = f.querySelector('.cols'); const ccs = cols ? getComputedStyle(cols) : null;
  const art = f.querySelector('.art'); const acs = art ? getComputedStyle(art) : null;
  const heads = Array.from(f.querySelectorAll('.cols h3, .cols h4')).map((h) => h.textContent.trim());
  const text = (f.innerText || '').replace(/\\s+/g, ' ').trim();
  const stamp = f.querySelector('.stamp');
  const ul = document.getElementById('sources-list');
  const lis = ul ? Array.from(ul.querySelectorAll('li')) : [];
  return {
    bg: cs.backgroundColor, borderTop: cs.borderTopWidth + ' ' + cs.borderTopStyle + ' ' + cs.borderTopColor, marginTop: cs.marginTop,
    text: text, heads: heads, stampText: stamp ? stamp.textContent.replace(/\\s+/g, ' ').trim() : null,
    frame: fcs ? { text: frame.textContent.trim(), family: fcs.fontFamily, style: fcs.fontStyle, weight: fcs.fontWeight, size: fcs.fontSize, maxWidth: fcs.maxWidth, w: Math.round(frame.getBoundingClientRect().width) } : null,
    cols: ccs ? { tracks: ccs.gridTemplateColumns.split(' ').length, maxWidth: ccs.maxWidth } : null,
    art: art ? { svg: !!art.querySelector('svg'), ariaHidden: art.getAttribute('aria-hidden'), opacity: acs.opacity, color: acs.color, pe: acs.pointerEvents, w: Math.round(art.getBoundingClientRect().width) } : null,
    how: Array.from(f.querySelectorAll('.cols > div:nth-child(2) li')).map((li) => li.textContent.trim()),
    sources: lis.map((li) => ({ text: li.textContent.trim(), href: (li.querySelector('a') || {}).href || null })),
    mailto: f.querySelectorAll('a[href^="mailto:"]').length,
    overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    inverted: (function () { const m = cs.backgroundColor.match(/\\d+/g).map(Number); return (0.2126 * m[0] + 0.7152 * m[1] + 0.0722 * m[2]) < 128; })()
  };
}"""

JS_MODAL = """() => {
  const m = document.getElementById('signup-modal'); if (!m) return null;
  const card = m.querySelector('.modal-card'); const cs = getComputedStyle(m); const ccs = getComputedStyle(card);
  const wave = m.querySelector('.modal-wave'); const wcs = wave ? getComputedStyle(wave) : null;
  const close = document.getElementById('modal-close-btn'); const cr = close.getBoundingClientRect();
  const form = document.getElementById('modal-form'); const fcs = getComputedStyle(form);
  const btn = form.querySelector('button[type=submit]'); const br = btn.getBoundingClientRect();
  const drawer = document.getElementById('region-drawer'); const compare = document.getElementById('compare-overlay');
  const status = document.getElementById('modal-status');
  const h2 = m.querySelector('h2'); const h2cs = getComputedStyle(h2);
  const inputs = Array.from(form.elements).map((e) => e.name || e.id || e.tagName);
  const mask = wcs ? (wcs.webkitMaskImage || wcs.maskImage || '') : '';
  return {
    z: cs.zIndex, drawerZ: drawer ? getComputedStyle(drawer).zIndex : null, compareZ: compare ? getComputedStyle(compare).zIndex : null,
    position: cs.position, visibility: cs.visibility, opacity: cs.opacity, ariaHidden: m.getAttribute('aria-hidden'), role: m.getAttribute('role'),
    scrimBg: cs.backgroundColor,
    card: { bg: ccs.backgroundColor, border: ccs.borderTopWidth + ' ' + ccs.borderTopStyle + ' ' + ccs.borderTopColor, radius: ccs.borderTopLeftRadius + ' ' + ccs.borderTopRightRadius + ' ' + ccs.borderBottomRightRadius + ' ' + ccs.borderBottomLeftRadius, w: Math.round(card.getBoundingClientRect().width) },
    wave: wave ? { display: wcs.display, h: wcs.height, w: wcs.width, bg: wcs.backgroundColor, hasMask: /url\\(/.test(mask), ariaHidden: wave.getAttribute('aria-hidden') } : null,
    topo: !!m.querySelector('.modal-topo'),
    close: { w: Math.round(cr.width), h: Math.round(cr.height), radius: getComputedStyle(close).borderTopLeftRadius, label: close.getAttribute('aria-label'), svg: !!close.querySelector('svg') },
    form: { action: form.getAttribute('action'), method: form.getAttribute('method'), inputs: inputs, direction: fcs.flexDirection, btnH: Math.round(br.height),
      btnSvg: !!btn.querySelector('svg.arrow'), btnText: btn.textContent.replace(/\\s+/g, ' ').trim(), btnFont: getComputedStyle(btn).fontStyle,
      btnBg: getComputedStyle(btn).backgroundColor },
    status: { live: status.getAttribute('aria-live'), id: status.id },
    h2: { text: h2.textContent.trim(), style: h2cs.fontStyle, family: h2cs.fontFamily },
    text: (m.textContent || '').replace(/\\s+/g, ' ').trim()
  };
}"""

JS_HERO_FORM = """() => {
  const f = document.getElementById('signup-form'); const s = document.getElementById('form-status'); if (!f || !s) return null;
  const btn = f.querySelector('button[type=submit]');
  return { action: f.getAttribute('action'), inputs: Array.from(f.elements).map((e) => e.name || e.id || e.tagName),
    live: s.getAttribute('aria-live'), btnSvg: !!btn.querySelector('svg.arrow'), btnText: btn.textContent.replace(/\\s+/g, ' ').trim(),
    card: (f.closest('.signup-card') || {}).textContent ? f.closest('.signup-card').textContent.replace(/\\s+/g, ' ').trim() : '' };
}"""

JS_SUITE_NOTE = """() => {
  const n = document.querySelector('.suite-note'); if (!n) return null;
  const cs = getComputedStyle(n);
  return { text: n.textContent.replace(/\\s+/g, ' ').trim(), links: Array.from(n.querySelectorAll('a')).map((a) => ({ id: a.id, href: a.getAttribute('href'), text: a.textContent.trim() })),
    size: cs.fontSize, color: cs.color };
}"""

JS_MOBILE_NOTE = """() => {
  const n = document.getElementById('mobile-note'); if (!n) return null;
  const cs = getComputedStyle(n); const x = document.getElementById('mobile-note-x'); const xr = x ? x.getBoundingClientRect() : null;
  return { display: cs.display, bg: cs.backgroundColor, borderBottom: cs.borderBottomWidth, size: cs.fontSize, role: n.getAttribute('role'),
    xH: xr ? Math.round(xr.height) : null, xW: xr ? Math.round(xr.width) : null, dismissed: n.classList.contains('dismissed') };
}"""

# Everything the visitor can read: text, plus the attribute values that hold text (placeholder, labels, titles, alt, meta content).
JS_ALL_TEXT = """() => {
  const parts = [document.body.innerText || ''];
  document.querySelectorAll('[placeholder],[aria-label],[title],[alt]').forEach((e) => {
    ['placeholder', 'aria-label', 'title', 'alt'].forEach((a) => { const v = e.getAttribute(a); if (v) parts.push(v); }); });
  const hrefs = Array.from(document.querySelectorAll('a[href]')).map((a) => a.getAttribute('href'));
  const ld = Array.from(document.querySelectorAll('script[type="application/ld+json"]')).map((s) => s.textContent);
  const metas = Array.from(document.querySelectorAll('meta[content]')).map((m) => m.getAttribute('content'));
  return { text: parts.join('\\n'), hrefs: hrefs, ld: ld, metas: metas };
}"""

JS_PRINT = """() => {
  const q = (s) => { const e = document.querySelector(s); return e ? getComputedStyle(e).display : 'absent'; };
  return { rail: q('#rct-rail'), banner: q('.prototype-banner'), modal: q('#signup-modal'), art: q('footer.colophon .art'),
    bodyPad: getComputedStyle(document.body).paddingLeft };
}"""

# The rendered-text contrast probe (WCAG 2.x AA: 4.5, large text 3.0), ported from design/final-assets/tools/probe.py CONTRAST_JS.
# `shellOnly` restricts the failures it reports as shell failures to text inside the elements this WP owns.
JS_CONTRAST = r"""(shellSel) => {
  const cv=document.createElement('canvas'); cv.width=cv.height=1; const g=cv.getContext('2d',{willReadFrequently:true});
  const parse = (c) => { if(!c||c==='transparent') return {r:0,g:0,b:0,a:0}; g.clearRect(0,0,1,1); g.fillStyle='#000'; g.fillStyle=c; g.fillRect(0,0,1,1); const d=g.getImageData(0,0,1,1).data; const m=c.match(/\/\s*([\d.]+%?)\s*\)|rgba\([^)]*,\s*([\d.]+)\s*\)/); let a=1; if(m){ const v=m[1]||m[2]; a = v.endsWith('%')? parseFloat(v)/100 : parseFloat(v);} if(/^rgba\(0, 0, 0, 0\)$/.test(c)) a=0; return {r:d[0],g:d[1],b:d[2],a:isNaN(a)?1:a}; };
  const lin = (v)=>{v/=255;return v<=0.03928? v/12.92 : Math.pow((v+0.055)/1.055,2.4)};
  const L = (c)=>0.2126*lin(c.r)+0.7152*lin(c.g)+0.0722*lin(c.b);
  const over = (fg,bg)=>({r:fg.r*fg.a+bg.r*(1-fg.a),g:fg.g*fg.a+bg.g*(1-fg.a),b:fg.b*fg.a+bg.b*(1-fg.a),a:1});
  const ratio = (a,b)=>{const x=L(a),y=L(b);return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};
  const bgOf = (el)=>{ const stack=[]; let n=el, grad=false;
    while(n && n.nodeType===1){ const cs=getComputedStyle(n); const c=parse(cs.backgroundColor); if(cs.backgroundImage && cs.backgroundImage!=='none' && /gradient/.test(cs.backgroundImage)) grad=true; if(c && c.a>0){ stack.push(c); if(c.a>=0.99) break; } n=n.parentElement; }
    let base = stack.length? stack.pop() : {r:255,g:255,b:255,a:1}; if(base.a<0.99) base=over(base,{r:255,g:255,b:255,a:1});
    while(stack.length){ base=over(stack.pop(),base); }
    return {c:base,grad}; };
  const out=[]; const shell=[]; const seen=new Set(); let n=0;
  const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
  while(walker.nextNode()){ const t=walker.currentNode; const txt=t.textContent.trim(); if(!txt) continue; const el=t.parentElement; if(!el) continue;
    const cs=getComputedStyle(el); if(cs.visibility==='hidden'||cs.display==='none') continue; const r=el.getBoundingClientRect(); if(r.width<1||r.height<1) continue;
    if(el.closest('.sr-only,script,style,svg,option')) continue;
    if(el.closest('#signup-modal') && getComputedStyle(document.getElementById('signup-modal')).visibility==='hidden') continue;
    let fg=parse(cs.color); if(!fg) continue; const bgi=bgOf(el); if(fg.a<1) fg=over(fg,bgi.c);
    const size=parseFloat(cs.fontSize), wt=parseInt(cs.fontWeight)||400; const large = size>=24 || (size>=18.66 && wt>=700);
    const need = large?3:4.5; const cr=ratio(fg,bgi.c); n++;
    if(cr<need){ const key=el.className+'|'+cs.color+'|'+JSON.stringify(bgi.c); if(seen.has(key)) continue; seen.add(key);
      const row={txt:txt.slice(0,48),cls:(el.className&&el.className.baseVal!==undefined?el.className.baseVal:el.className)||el.tagName,fg:cs.color,bg:`rgb(${Math.round(bgi.c.r)},${Math.round(bgi.c.g)},${Math.round(bgi.c.b)})`,grad:bgi.grad,size,ratio:+cr.toFixed(2),need,shell:!!el.closest(shellSel)};
      out.push(row); if(row.shell) shell.push(row); } }
  return {checked:n,fails:out,shellFails:shell};
}"""
