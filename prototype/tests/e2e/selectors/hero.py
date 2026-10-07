"""Selectors and page scripts for the hero suite (suites/test_hero.py): hero, "How to read this", the Century Line, starting points,
data-driven count words. Owned by MC-HERO. Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "hero": "section.hero",
    "h1": "section.hero h1",
    "art": ".hero-art",
    "river": ".hero .river-rule",
    "subtitle": ".hero .subtitle",
    "lede": ".hero .lede",
    "note": ".hero .lede-note",
    "signup": ".hero .signup-card",
    "form": "#signup-form",
    "status": "#form-status",
    "cta": ".hero .hero-cta",
    "arrive": "section.arrive",
    "arrive_h2": "#arrive-title",
    "century_sec": "section.century-sec",
    "century": ".century",
    "century_row": ".century .cl-row:not(.cl-foot)",
    "guided": "section.guided",
    "guided_h2": "#guided-title",
    "chips": "#guided-chips .guided-chip",
    "neutral": "#guided-chips .guided-chip.neutral",
    "regions_h2": ".regions-intro h2",
    "regions_p": ".regions-intro > .container > p",
    "criteria_h2": ".criteria h2",
}

HERO_SELECTOR = "section.hero, section.arrive, section.century-sec, section.guided"
HEADINGS = ["section.hero h1", "#arrive-title", "#cl-h", "#guided-title", ".regions-intro h2", ".criteria h2"]
SUBTITLE = "A bioregioning tool for communities seeking to belong to a place — and help it flourish over fifty to a hundred years."

# The words the page must print, read from the site's own modules (never typed here).
JS_FACTS = """async () => {
  const f = await import('/data/site-facts.js'); const v = f.factValues();
  const c = await import('/lib/century.js'); const d = await import('/src/data.js');
  const p = await import('/src/ui/presets.js');
  return { v, model: c.centuryModel(d.criteria), criteria: d.criteria.map((x) => ({ id: x.id, name: x.name, window: x.window || null })),
           presets: d.PRESETS.map((x) => ({ id: x.id, label: x.label, sets: x.sets })), summaries: d.PRESETS.map((x) => p.presetThresholdSummary(x)) }; }"""

JS_HERO = """() => {
  const q = (s) => document.querySelector(s); const cs = (e) => getComputedStyle(e);
  const h1 = q('section.hero h1'); const probe = document.createElement('span'); probe.style.cssText = 'font-size:var(--t-hero);position:absolute;visibility:hidden';
  document.body.appendChild(probe); const heroSize = cs(probe).fontSize; probe.remove();
  const em = h1.querySelector('em'); const art = q('.hero-art'); const svg = art && art.querySelector('svg');
  const rr = q('.hero .river-rule'); const lede = q('.hero .lede'); const sub = q('.hero .subtitle');
  const strong = lede.querySelector('strong');
  return {
    h1Count: document.querySelectorAll('h1').length, h1Text: h1.textContent.replace(/\\s+/g, ' ').trim(), h1Family: cs(h1).fontFamily, h1Size: cs(h1).fontSize, heroSize,
    h1Weight: cs(h1).fontWeight, h1Line: cs(h1).lineHeight, h1Track: cs(h1).letterSpacing, h1Opsz: cs(h1).fontVariationSettings,
    emStyle: em && cs(em).fontStyle, emWeight: em && cs(em).fontWeight, emColor: em && cs(em).color, emPad: em && cs(em).paddingRight,
    accent: (() => { const s = document.createElement('i'); s.style.color = 'var(--accent)'; document.body.appendChild(s); const c = cs(s).color; s.remove(); return c; })(),
    subText: sub.textContent.trim(), subFamily: cs(sub).fontFamily, subStyle: cs(sub).fontStyle, subWeight: cs(sub).fontWeight, subMax: cs(sub).maxWidth,
    ledeText: lede.textContent.replace(/\\s+/g, ' ').trim(), ledeSize: cs(lede).fontSize, ledeStrong: strong && cs(strong).fontWeight,
    noteStyle: cs(q('.hero .lede-note')).fontStyle,
    keyStrip: !!document.querySelector('.hero .key'), heroText: q('section.hero').textContent,
    art: art && { aria: art.getAttribute('aria-hidden'), svg: !!svg, svgBytes: svg ? new TextEncoder().encode(svg.outerHTML).length : 0,
                  paths: art.querySelectorAll('path').length, pe: cs(art).pointerEvents, pos: cs(art).position, z: cs(art).zIndex, w: art.getBoundingClientRect().width,
                  hasPathLength: svg ? [...svg.querySelectorAll('path')].every((p) => p.getAttribute('pathLength') === '1') : false },
    river: rr && { aria: rr.getAttribute('aria-hidden'), d: (rr.querySelector('path') || {getAttribute: () => null}).getAttribute('d') },
    preload: [...document.querySelectorAll('link[rel=preload][as=font]')].map((l) => l.getAttribute('href')),
    eyebrow: (q('.hero .eyebrow') || {}).textContent,
    ethics: (() => { const a = q('.hero .hero-cta'); return a && { href: a.getAttribute('href'), text: a.textContent.trim(), svg: !!a.querySelector('svg'), arrowGlyph: /\\u2192/.test(a.textContent) }; })(),
    overflow: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
  }; }"""

JS_DRAW = """() => ({ drawClass: document.querySelectorAll('.draw').length,
  paths: [...document.querySelectorAll('.hero-art path')].map((p) => { const c = getComputedStyle(p); return { off: c.strokeDashoffset, dash: c.strokeDasharray, anim: c.animationName }; }).slice(0, 3),
  riverOff: (() => { const p = document.querySelector('.hero .river-rule path'); return p && getComputedStyle(p).strokeDashoffset; })() })"""

JS_SIGNUP = """() => { const f = document.getElementById('signup-form'); const card = document.querySelector('.hero .signup-card'); const cs = getComputedStyle(card);
  const h2 = card.querySelector('h2'); const btn = f.querySelector('button[type=submit]'); const st = document.getElementById('form-status');
  return { action: f.getAttribute('action'), method: f.getAttribute('method'), inputs: [...f.elements].map((e) => e.name || e.tagName).sort(), bStyle: cs.borderTopStyle,
    h2Style: getComputedStyle(h2).fontStyle, h2Family: getComputedStyle(h2).fontFamily, btnBg: getComputedStyle(btn).backgroundColor, btnSvg: !!btn.querySelector('svg'),
    live: st && st.getAttribute('aria-live'), email: !!document.getElementById('signup-email') }; }"""

JS_ARRIVE = """() => { const a = document.querySelector('section.arrive'); const h2 = document.getElementById('arrive-title'); const cs = getComputedStyle(h2);
  const tags = [...a.querySelectorAll('.arrive-tag')].map((t) => ({ text: t.textContent.trim(), cls: t.className, color: getComputedStyle(t).color }));
  const fors = [...a.querySelectorAll('.arrive-for')].map((x) => x.textContent.replace(/\\s+/g, ' ').trim());
  const em = h2.querySelector('em');
  return { h2: h2.textContent.replace(/\\s+/g, ' ').trim(), h2Family: cs.fontFamily, h2Size: cs.fontSize, h2Weight: cs.fontWeight, h2Max: cs.maxWidth, emStyle: em && getComputedStyle(em).fontStyle,
    bg: getComputedStyle(a).backgroundColor, bt: getComputedStyle(a).borderTopWidth, bb: getComputedStyle(a).borderBottomWidth, tags, fors,
    lede: (a.querySelector('.arrive-lede') || {}).textContent, bridge: !!a.querySelector('.arrive-bridge a[href^="https://compass.regencommunity.tools"]'),
    pages: [...a.querySelectorAll('.arrive-pages a')].map((x) => x.getAttribute('href')), colophonPages: [...document.querySelectorAll('.colophon .colophon-pages a')].map((x) => x.getAttribute('href')),
    cols: getComputedStyle(a.querySelector('.arrive-grid')).gridTemplateColumns.split(' ').length, arrowGlyph: /\\u2192/.test(a.textContent) }; }"""

JS_CENTURY = """() => { const c = document.querySelector('.century'); if (!c) return null;
  const rows = [...c.querySelectorAll('.cl-row:not(.cl-foot)')]; const cs = getComputedStyle(c);
  return { role: c.getAttribute('role'), label: c.getAttribute('aria-label'), rows: rows.length, nowin: c.querySelectorAll('.cl-nowin').length,
    names: rows.map((r) => (r.querySelector('.cl-name').firstChild || {}).textContent), small: rows.map((r) => (r.querySelector('small') || {}).textContent),
    segs: c.querySelectorAll('.cl-seg').length, proj: c.querySelectorAll('.cl-seg.proj').length, pts: c.querySelectorAll('.cl-seg.pt').length,
    note: (c.querySelector('.cl-note') || {}).textContent, axisHidden: (c.querySelector('.cl-axis') || {getAttribute: () => null}).getAttribute('aria-hidden'),
    tick: [...c.querySelectorAll('.cl-axis span')].map((s) => s.textContent), nodes: c.querySelectorAll('*').length,
    radius: cs.borderTopLeftRadius + ' ' + cs.borderTopRightRadius, bg: cs.backgroundColor, w: c.getBoundingClientRect().width, scrollW: c.scrollWidth, clientW: c.clientWidth,
    nowLabel: (c.querySelector('.cl-now-l') || {}).textContent, hzLabel: (c.querySelector('.cl-hz-l') || {}).textContent,
    segsInside: [...c.querySelectorAll('.cl-seg')].every((s) => { const t = s.parentElement.getBoundingClientRect(); const r = s.getBoundingClientRect(); return r.left >= t.left - 8 && r.right <= t.right + 8; }),
    rowH: rows.map((r) => Math.round(r.getBoundingClientRect().height)), trackH: rows.map((r) => Math.round(r.querySelector('.cl-track').getBoundingClientRect().height)),
    stacked: getComputedStyle(rows[0]).display }; }"""

JS_CHIPS = """() => { const chips = [...document.querySelectorAll('#guided-chips .guided-chip')]; const g = document.getElementById('guided-chips');
  return { n: chips.length, cols: getComputedStyle(g).gridTemplateColumns.split(' ').length, group: g.getAttribute('role'),
    chips: chips.map((c) => { const cs = getComputedStyle(c); const r = c.getBoundingClientRect(); return { text: c.querySelector('.t').textContent, sets: (c.querySelector('.sets') || {}).textContent || null,
      neutral: c.classList.contains('neutral'), tag: c.tagName, type: c.getAttribute('type'), pressed: c.getAttribute('aria-pressed'), label: c.getAttribute('aria-label'),
      ico: !!c.querySelector('svg.ico'), icoColor: c.querySelector('svg.ico') && getComputedStyle(c.querySelector('svg.ico')).color, icoSize: c.querySelector('svg.ico') && c.querySelector('svg.ico').getBoundingClientRect().width,
      h: r.height, w: r.width, bt: cs.borderTopWidth, btStyle: cs.borderTopStyle, btColor: cs.borderTopColor, bg: cs.backgroundColor, color: cs.color, style: cs.borderStyle, fontStyle: getComputedStyle(c.querySelector('.t')).fontStyle,
      tFamily: getComputedStyle(c.querySelector('.t')).fontFamily, tSize: getComputedStyle(c.querySelector('.t')).fontSize, setsSize: (c.querySelector('.sets') ? getComputedStyle(c.querySelector('.sets')).fontSize : null) }; }),
    note: (document.querySelector('.guided-note') || {}).textContent }; }"""

JS_SLIDERS = """() => Object.fromEntries([...document.querySelectorAll('.criteria input[type=range]')].map((s) => [s.closest('[id^=crit-]').id.replace('crit-', ''), Number(s.value)]))"""

JS_HEADINGS = """(sels) => sels.map((s) => { const e = document.querySelector(s); if (!e) return [s, null]; const r = document.createRange(); r.selectNodeContents(e);
  const rr = r.getBoundingClientRect(); const lh = parseFloat(getComputedStyle(e).lineHeight) || parseFloat(getComputedStyle(e).fontSize) * 1.1; const b = e.getBoundingClientRect();
  const rects = [...r.getClientRects()]; const lines = []; rects.forEach((x) => { if (!lines.some((y) => Math.abs(y - x.top) < lh * .4)) lines.push(x.top); });
  return [s, Math.round(rr.width), Math.round(b.height), Math.max(1, lines.length), e.textContent.replace(/\\s+/g, ' ').trim()]; })"""

# A heading must not leave one word alone on its last line: measure every word with a Range and count the words on the last line.
JS_ORPHAN = """(sels) => sels.map((s) => { const e = document.querySelector(s); if (!e) return [s, null, 0];
  const w = document.createTreeWalker(e, NodeFilter.SHOW_TEXT); const words = [];
  while (w.nextNode()) { const n = w.currentNode; const re = /[^\\s\\u00a0]+/g; let m; while ((m = re.exec(n.textContent))) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length);
    const b = r.getClientRects()[0]; if (b) words.push({ t: m[0], top: Math.round(b.top) }); } }
  if (!words.length) return [s, null, 0]; const tops = [...new Set(words.map((x) => x.top))]; const last = Math.max(...tops);
  return [s, tops.length, words.filter((x) => x.top === last).map((x) => x.t)]; })"""

JS_PRESET_MATCH = """async () => { const d = await import('/src/data.js'); const f = await import('/lib/filters.js'); const p = await import('/src/ui/presets.js'); const out = [];
  for (const preset of d.PRESETS) { const th = p.presetThresholds(preset);
    for (const cont of ['europe', 'north-america']) { const view = d.regions.filter((r) => r.continent === cont);
      const n = view.filter((r) => f.regionPasses(r.id, { thresholds: th, qualFilters: {}, continent: cont }, { regions: d.regions, values: d.values, criteria: d.criteria, qualFilters: [] })).length;
      out.push([preset.id, cont, n, view.length]); } }
  return out; }"""

JS_CONTRAST = None   # the shell selectors' probe is reused (selectors/shell.py JS_CONTRAST)

JS_CLS = """(() => { window.__cls = 0; try { new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {} })();"""

JS_TOKENS = """() => { const out = {}; for (const n of ['ink', 'paper', 'paper-2', 'accent', 'host', 'accent-soft']) {
  const p = document.createElement('span'); p.style.color = 'var(--' + n + ')'; document.body.appendChild(p);
  out[n] = getComputedStyle(p).color; p.remove(); } return out; }"""
