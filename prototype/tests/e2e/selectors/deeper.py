"""Selectors and page scripts for the deeper.html suite (suites/test_deeper.py). Owned by MC-DEEPER.
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "main": "main#main",
    "skip": ".skip-link",
    "rail": "#rct-rail",
    "hero": "section.hero",
    "h1": "h1",
    "toc": "nav.toc",
    "toc_links": "nav.toc a",
    "chapters": "section.lr-chapter",
    "prose": ".lr-prose",
    "criteria": "#criteria",
    "note": "[data-doc='demo-status']",
    "method_list": ".method-list",
    "method_num": ".method-point .num",
    "century": ".lr-century .century",
    "case": "article.case-study",
    "closing": ".lr-closing",
    "tension": ".lr-tension",
    "leaf": ".lr-tension .tension-pair",
    "refusal": ".lr-refusal",
    "stream": ".lr-stream",
    "reciprocity": ".lr-reciprocity",
    "clause": ".lr-clause",
    "sources": "#sources",
    "source_group_h": "#sources .source-group h3",
    "source_li": "#sources li[data-doc='source']",
    "footer": "footer.lr-footer",
}

# The six chapters, in order: (id, toc label as printed).
CHAPTERS = [
    ("methodology", "Methodology"),
    ("case-studies", "Case studies"),
    ("tensions", "Deferred tensions"),
    ("ethics", "Ethics and values"),
    ("whats-next", "What's coming next"),
    ("sources", "Sources"),
]

# Widths at which the layout is checked: phone, small phone, tablet, the rail's breakpoint, laptop, the marginalia breakpoint, large, wide.
WIDTHS = (390, 480, 768, 900, 1024, 1280, 1536, 1920)

ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii"]

# Resolved token colours as computed rgb() strings.
JS_TOKENS = """() => { const out = {}; for (const n of ['ink', 'ink-2', 'ink-3', 'paper', 'paper-2', 'accent', 'accent-wash', 'art', 'rule-strong']) {
  const p = document.createElement('span'); p.style.color = 'var(--' + n + ')'; document.body.appendChild(p);
  out[n] = getComputedStyle(p).color; p.remove(); } return out; }"""

JS_FIRST_TAB = """() => {
  const a = document.activeElement; if (!a || a === document.body) return null;
  const rail = document.getElementById('rct-rail');
  return { cls: a.className && a.className.toString(), href: a.getAttribute('href'), text: (a.textContent || '').trim(),
    beforeRail: !!(rail && (a.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING)) };
}"""

# One probe that returns every layout measurement the suite needs at the current width (document coordinates).
JS_LAYOUT = r"""() => {
  const q = (s, r) => (r || document).querySelector(s), qa = (s, r) => Array.from((r || document).querySelectorAll(s));
  const R = (e) => { if (!e) return null; const b = e.getBoundingClientRect(); return { l: b.left + scrollX, t: b.top + scrollY, r: b.right + scrollX, b: b.bottom + scrollY, w: b.width, h: b.height }; };
  const S = (e, p) => e ? getComputedStyle(e, p || null) : null;
  const de = document.documentElement;
  const out = { vw: innerWidth, overflow: Math.max(0, de.scrollWidth - de.clientWidth), h1: qa('h1').map((h) => h.textContent.trim()) };
  const h1 = q('h1'); out.h1Font = h1 ? S(h1).fontFamily : null; out.h1Size = h1 ? parseFloat(S(h1).fontSize) : null;

  // anchors: every in-page link resolves, and the six toc links in order
  out.hashLinks = qa('a[href^="#"]').map((a) => a.getAttribute('href')).filter((h) => h.length > 1);
  out.hashBroken = Array.from(new Set(out.hashLinks)).filter((h) => !document.getElementById(decodeURIComponent(h.slice(1))));
  out.toc = qa('nav.toc a').map((a) => ({ href: a.getAttribute('href'), text: a.textContent.replace(/\s+/g, ' ').trim(),
    numColor: S(q('.lr-num', a)).color, numStyle: S(q('.lr-num', a)).fontStyle, numFont: S(q('.lr-num', a)).fontFamily,
    leader: S(a, '::after').borderBottomStyle, h: Math.round(a.getBoundingClientRect().height) }));

  // spine and ring nodes
  const ch = qa('section.lr-chapter');
  out.chapters = ch.map((c) => ({ id: c.id, stem: S(c, '::before').content, ring: S(q('.lr-wrap', c), '::before').content,
    firsts: qa('p.first', c).length, dropFloat: q('p.first', c) ? S(q('p.first', c), '::first-letter').float : null,
    dropFont: q('p.first', c) ? S(q('p.first', c), '::first-letter').fontFamily : null,
    dropColor: q('p.first', c) ? S(q('p.first', c), '::first-letter').color : null,
    dropSize: q('p.first', c) ? parseFloat(S(q('p.first', c), '::first-letter').fontSize) / parseFloat(S(q('p.first', c)).fontSize) : null,
    h2: S(q('h2', c)).fontFamily, h2Size: parseFloat(S(q('h2', c)).fontSize) }));
  out.firstsTotal = qa('p.first').length;
  out.caseRing = qa('article.lr-case').map((c) => S(c, '::before').content);

  // the column and the margin column
  const prose = q('#criteria');
  out.prose = R(prose); out.proseCols = prose ? S(prose).gridTemplateColumns : null; out.proseFont = prose ? S(prose).fontFamily : null; out.proseSize = prose ? parseFloat(S(prose).fontSize) : null;
  out.proseLine = prose ? parseFloat(S(prose).lineHeight) / parseFloat(S(prose).fontSize) : null;
  const p1 = prose ? q(':scope > p', prose) : null;
  out.p1 = R(p1); out.p1Max = p1 ? S(p1).maxWidth : null;
  if (prose) { const pb = document.createElement('div'); pb.style.cssText = 'position:absolute;visibility:hidden;width:64ch;height:1px'; prose.appendChild(pb); out.ch64 = pb.getBoundingClientRect().width; pb.remove(); }
  const note = q("[data-doc='demo-status']");
  out.note = R(note); out.noteFloat = note ? S(note).float : null; out.noteSize = note ? parseFloat(S(q('p', note)).fontSize) : null;
  out.noteRule = note ? S(note).borderLeftWidth + ' ' + S(note).borderLeftStyle : null;
  out.noteFont = note ? S(q('p', note)).fontFamily : null;
  out.methodList = R(q('.method-list'));
  out.methodCols = q('.method-list') ? S(q('.method-list')).gridTemplateColumns.split(' ').length : 0;
  out.cards = qa('.method-point').map((c) => R(c));
  out.nums = qa('.method-point .num').map((n) => ({ t: n.textContent.trim(), size: parseFloat(S(n).fontSize), style: S(n).fontStyle, font: S(n).fontFamily, color: S(n).color }));
  out.sourceNote = (() => { const e = q(".method-point [data-doc='criterion-source']"); return e ? { size: parseFloat(S(e).fontSize), rule: S(e).borderLeftWidth + ' ' + S(e).borderLeftStyle, font: S(e).fontFamily } : null; })();
  out.century = R(q('.lr-century .century'));

  // tension pairs
  out.tensions = qa('.lr-tension').map((t) => { const l = qa('.tension-pair', t).map(R); const f = S(t, '::before');
    return { leaves: l, labels: qa('.pair-label', t).map((x) => x.textContent.trim()), foldV: f.borderLeftStyle, foldH: f.borderTopStyle, foldVW: f.borderLeftWidth, foldHW: f.borderTopWidth }; });

  // ethics: the refusal first
  const ref = q('.lr-refusal'), st = q('.lr-stream');
  out.refusal = ref ? { r: R(ref), size: parseFloat(S(ref).fontSize), style: S(ref).fontStyle, font: S(ref).fontFamily, maxw: S(ref).maxWidth, text: ref.textContent.trim() } : null;
  out.stream = st ? { r: R(st), hidden: st.getAttribute('aria-hidden'), color: S(st).color } : null;
  const clauses = qa('.lr-clause');
  out.clauses = clauses.map((c) => { const s = q('strong', c); return s ? { t: s.textContent.trim(), style: S(s).fontStyle, font: S(s).fontFamily, size: parseFloat(S(s).fontSize), top: R(c).t } : null; }).filter(Boolean);
  const lo = qa('.lr-clause').find((c) => /^\s*Localism/.test(c.textContent));
  out.localismTop = lo ? R(lo).t : null;
  out.ethicsH2 = R(q('#ethics h2'));
  out.ethicsIcons = qa('#ethics img, #ethics .lr-clause svg:not(.lr-stream), #ethics .lr-reciprocity .lr-body svg').length;

  // case studies
  out.closings = qa('.lr-closing').map((c) => ({ rule: S(c).borderLeftWidth + ' ' + S(c).borderLeftStyle, bg: S(c).backgroundColor, style: S(c).fontStyle, size: parseFloat(S(c).fontSize),
    font: S(c).fontFamily, labelSize: parseFloat(S(q('.closing-label', c)).fontSize), label: q('.closing-label', c).textContent.trim() }));
  out.caseNames = qa('.case-name').map((c) => ({ font: S(c).fontFamily, size: parseFloat(S(c).fontSize) }));

  // the bibliography ledger
  const gh = qa('#sources .source-group h3');
  out.groupHeads = gh.slice(0, 3).map((h) => ({ font: S(h).fontFamily, style: S(h).fontStyle, size: parseFloat(S(h).fontSize) }));
  out.groupCount = gh.length;
  const li = q("#sources li[data-doc='source']");
  out.entries = qa("#sources li[data-doc='source']").length;
  if (li) { const nm = q('.src-name', li), uf = q('.used-for', li), lic = q(".used-for[data-doc='licence']", li);
    out.entry = { display: S(li).display, leader: S(nm, '::after').borderBottomStyle, ufAlign: S(uf).textAlign, ufColStart: S(uf).gridColumnStart, ufSize: parseFloat(S(uf).fontSize),
      licSpan: lic ? S(lic).gridColumnStart + '/' + S(lic).gridColumnEnd : null, nameFont: S(nm).fontFamily, nameR: R(nm), ufR: R(uf) }; }
  out.deadLinkUi = qa('#sources .used-for').filter((e) => /link unavailable/i.test(e.textContent)).length;

  // top-level structure
  out.skip = (() => { const e = q('.skip-link'); return e ? { href: e.getAttribute('href'), first: document.body.firstElementChild === e } : null; })();
  out.main = (() => { const e = q('main#main'); return e ? { tabindex: e.getAttribute('tabindex'), mains: qa('main').length } : null; })();
  out.footer = R(q('footer.lr-footer'));
  out.bodyPadLeft = parseFloat(S(document.body).paddingLeft);
  out.anim = (document.getAnimations ? document.getAnimations().length : 0);
  out.scrollBehavior = S(de).scrollBehavior;
  return out;
}"""

# Largest Contentful Paint (ms), read after load.
JS_LCP_INIT = """(() => { window.__lcp = 0;
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true }); } catch (e) {} })();"""
JS_LCP_READ = "() => window.__lcp || 0"
