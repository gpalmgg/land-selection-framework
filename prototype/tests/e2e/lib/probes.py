"""In-page probes shared by suites (JS strings run through page.evaluate)."""

PAGE_FACTS_JS = r"""
() => {
  const m = (n) => { const e = document.querySelector('meta[name="' + n + '"],meta[property="' + n + '"]'); return e ? e.content : null; };
  const ld = []; let ldOk = true;
  document.querySelectorAll('script[type="application/ld+json"]').forEach(s => { try { ld.push(JSON.parse(s.textContent)); } catch (e) { ldOk = false; } });
  return {
    title: document.title,
    h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim().slice(0, 100)),
    description: m('description'),
    canonical: (document.querySelector('link[rel=canonical]') || {}).href || null,
    ogImage: m('og:image'),
    jsonld: ld.length, jsonldOk: ldOk,
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    brokenImages: Array.from(document.images).filter(i => i.complete && i.naturalWidth === 0).map(i => i.currentSrc || i.src).slice(0, 10),
    links: Array.from(document.querySelectorAll('a[href]')).map(a => a.getAttribute('href')),
    text: document.body ? document.body.innerText : ''
  };
}
"""

TAP_TARGETS_JS = r"""
(sels) => {
  const bad = [];
  sels.forEach(s => document.querySelectorAll(s).forEach(e => {
    const r = e.getBoundingClientRect();
    if (r.width && r.height && (r.height < 44 || r.width < 44)) bad.push({sel: s, w: Math.round(r.width), h: Math.round(r.height)});
  }));
  const seen = {};
  return bad.filter(b => { const k = b.sel + b.w + 'x' + b.h; if (seen[k]) return false; seen[k] = 1; return true; });
}
"""

ARIA_LIVE_JS = r"""
(id) => {
  const e = document.getElementById(id);
  if (!e) return {present: false};
  let n = e, live = null;
  while (n && n !== document.documentElement) {
    const l = n.getAttribute('aria-live'), r = n.getAttribute('role');
    if (l || r === 'status' || r === 'alert' || r === 'log') { live = l || r; break; }
    n = n.parentElement;
  }
  return {present: true, live: live};
}
"""

FIRST_TAB_JS = r"""
() => { const a = document.activeElement; if (!a || a === document.body) return null;
  return {tag: a.tagName, cls: a.className && a.className.toString(), text: (a.textContent || '').trim().slice(0, 60), href: a.getAttribute('href')}; }
"""

# Contrast of every text node's colour == var(--ink-4) against its effective background (WCAG 2.x, AA 4.5 / large 3.0).
INK4_CONTRAST_JS = r"""
() => {
  const cvs = document.createElement('canvas').getContext('2d');
  const parse = (c) => { cvs.fillStyle = '#000'; cvs.fillStyle = c; const s = cvs.fillStyle;
    if (s[0] === '#') { return [parseInt(s.slice(1,3),16), parseInt(s.slice(3,5),16), parseInt(s.slice(5,7),16), 1]; }
    const m = s.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(',').map(parseFloat); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--ink-4').trim();
  if (!raw) return {token: null, checked: 0, fails: []};
  const ink = parse(raw); if (!ink) return {token: raw, checked: 0, fails: []};
  const bgOf = (el) => { let n = el; while (n) { const b = parse(getComputedStyle(n).backgroundColor); if (b && b[3] > 0.5) return b; n = n.parentElement; } return [255, 255, 255, 1]; };
  const fails = []; let checked = 0;
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (!el.getClientRects().length) continue;
    const cs = getComputedStyle(el); if (cs.visibility === 'hidden') continue;
    const col = parse(cs.color); if (!col || col[0] !== ink[0] || col[1] !== ink[1] || col[2] !== ink[2]) continue;
    checked++;
    const bg = bgOf(el); const l1 = lum(col), l2 = lum(bg);
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
    const px = parseFloat(cs.fontSize), bold = parseInt(cs.fontWeight, 10) >= 700;
    const need = (px >= 24 || (px >= 18.66 && bold)) ? 3 : 4.5;
    if (ratio < need) fails.push({text: t.textContent.trim().slice(0, 40), ratio: Math.round(ratio * 100) / 100, need: need, px: px});
  }
  return {token: raw, checked: checked, fails: fails.slice(0, 12), nfails: fails.length};
}
"""
