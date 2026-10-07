"""Selectors and page scripts for the criteria suite (suites/test_criteria.py). Owned by MC-CRITERIA.
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "grid": "#crit-grid",
    "card": ".crit-card",
    "slider": ".crit-card input[type=range]",
    "row": ".bar-row",
    "pt": ".bar-row .pt",
    "ruler": ".ruler",
    "ruler_head": ".ruler-head",
    "hint_more": ".hint-more",
    "tab": ".continent-tab",
    "match_count": "#match-count",
}

# Criteria, regions and ranges as the page's own modules hold them.
JS_DATA = """async () => {
  const d = await import('/src/data.js');
  return { criteria: d.criteria.map((c) => ({ id: c.id, name: c.name, higherIs: c.higherIs, min: c.rangeMin, max: c.rangeMax, step: c.step === undefined ? null : c.step,
             unit: c.rangeLabel, hasWindow: !!(c.window && (c.window.label || c.window.from)), scenario: !!c.scenarioLine, askja: c.askjaNumber })),
           regions: d.regions.map((r) => ({ id: r.id, continent: r.continent, short: r.short || r.name })),
           outOfRange: d.criteria.flatMap((c) => d.regions.filter((r) => { const v = d.values[r.id][c.id]; return v && typeof v.value === 'number' && (v.value < c.rangeMin || v.value > c.rangeMax); }).map((r) => r.id + '/' + c.id)) };
}"""

# Sets a slider through the page's own input event.
JS_SET = """([crit, v]) => { const s = document.getElementById('slider-' + crit); s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); return s.value; }"""

# Structure facts of every criterion block.
JS_STRUCTURE = """() => Array.from(document.querySelectorAll('.crit-card')).map((c) => {
  const id = c.id.replace(/^crit-/, ''); const q = (s) => c.querySelector(s);
  const sl = q('input[type=range]'); const lab = q('label.slider-label');
  const credit = q('.credit'); const ep = q('.epoch'); const det = q('details.sources');
  const bare = Array.from(c.querySelectorAll('*')).filter((e) => Array.from(e.childNodes).some((n) => n.nodeType === 3 && /^\\s*#\\d+\\s*$/.test(n.textContent))).length;
  return { id, tag: c.tagName.toLowerCase(), labelledby: c.getAttribute('aria-labelledby'), h3: (q('h3') || {}).textContent, h3id: (q('h3') || {}).id,
    eyebrow: (q('.eyebrow') || {}).textContent, metric: !!q('.metric'), framing: !!q('.framing'), epoch: ep ? ep.textContent.trim() : null, epochHatched: ep ? !!ep.querySelector('i.p') : null,
    note: (q('.slider-filter-note') || {}).textContent, credit: credit ? credit.textContent : null, scenario: (q('.scenario') || {}).textContent || null, dir: c.dataset.dir,
    slider: sl ? { id: sl.id, min: +sl.min, max: +sl.max, step: sl.step, value: sl.value, vt: sl.getAttribute('aria-valuetext'), dby: sl.getAttribute('aria-describedby'), label: sl.getAttribute('aria-label') } : null,
    labelText: lab ? lab.textContent : null, labelFor: lab ? lab.htmlFor : null, labelControl: lab && lab.control ? lab.control.id : null,
    readout: (document.getElementById('slider-val-' + id) || {}).textContent, hint: !!document.getElementById('slider-hint-' + id), bars: !!document.getElementById('bars-' + id),
    ticks: Array.from(c.querySelectorAll('.ticks span')).map((s) => ({ t: s.textContent, left: s.style.left, hidden: s.hidden })),
    key: Array.from(c.querySelectorAll('.plot-key li')).map((l) => l.textContent.trim()),
    sources: det ? { open: det.open, summary: (det.querySelector('summary') || {}).textContent, lines: det.querySelectorAll('li').length } : null,
    footer: (q('.footer') || {}).textContent, bare, numEls: c.querySelectorAll('.num').length, stickyPos: getComputedStyle(q('.ruler-head')).position,
    headCols: getComputedStyle(c).gridTemplateColumns.split(' ').length, border: getComputedStyle(c).borderTopColor + ' ' + getComputedStyle(c).borderTopWidth + ' ' + getComputedStyle(c).borderTopStyle };
})"""

# Rows of one criterion, visible ones only, in DOM order, with the dot facts.
JS_ROWS = """(crit) => Array.from(document.querySelectorAll('#bars-' + crit + ' .bar-row')).filter((r) => r.getClientRects().length).map((r) => {
  const pt = r.querySelector('.pt'); const cs = pt ? getComputedStyle(pt) : null; const b = pt ? pt.getBoundingClientRect() : null;
  return { id: r.dataset.region, state: r.dataset.state, fail: r.classList.contains('fail'), gap: r.classList.contains('gap'), pt: !!pt,
    ptStyle: cs ? cs.borderTopStyle : null, ptW: b ? Math.round(b.width * 100) / 100 : null, ptH: b ? Math.round(b.height * 100) / 100 : null, ptBg: cs ? cs.backgroundColor : null,
    mark: (r.querySelector('.bar-mark') || {}).textContent, text: r.innerText, opacity: getComputedStyle(r).opacity,
    inline: Array.from(r.querySelectorAll('*')).filter((e) => e.style.width || e.style.height).length, p: r.style.getPropertyValue('--p') };
})"""

JS_NO_BARS = """() => ({ fills: document.querySelectorAll('.crit-card .bar-fill').length,
  inline: Array.from(document.querySelectorAll('.crit-card .bar-rows *')).filter((e) => e.style.width || e.style.height).map((e) => e.className),
  nullWord: /\\bnull\\b/i.test(document.getElementById('crit-grid').innerText) })"""

# Geometry for the shared-axis check: the ruler's rule and the first visible row's track, per criterion.
JS_AXIS = """() => Array.from(document.querySelectorAll('.crit-card')).map((c) => {
  const line = c.querySelector('.ruler .line').getBoundingClientRect(); const ticks = c.querySelector('.ticks').getBoundingClientRect();
  const row = Array.from(c.querySelectorAll('.bar-row')).find((r) => r.getClientRects().length); const tr = row.querySelector('.bar-track').getBoundingClientRect();
  const inp = c.querySelector('.ruler input').getBoundingClientRect();
  return { id: c.id, lineL: line.left, lineR: line.right, ticksL: ticks.left, ticksR: ticks.right, trackL: tr.left, trackR: tr.right, inputW: inp.width, plotW: c.querySelector('.plot').getBoundingClientRect().width };
})"""

# Overlap of the visible tick labels, per criterion.
JS_TICK_OVERLAP = """() => Array.from(document.querySelectorAll('.crit-card')).map((c) => {
  const r = Array.from(c.querySelectorAll('.ticks span')).filter((s) => s.getClientRects().length).map((s) => s.getBoundingClientRect());
  let bad = 0; for (let i = 1; i < r.length; i++) if (r[i].left < r[i - 1].right + 1) bad++;
  return { id: c.id, shown: r.length, bad, outside: r.filter((x) => x.left < c.getBoundingClientRect().left || x.right > c.getBoundingClientRect().right).length };
})"""

# Geometry of one dot and of the ruler for the click-mapping check.
JS_DOT_AND_RULER = """([crit, region]) => { const c = document.getElementById('crit-' + crit);
  const pt = c.querySelector('.bar-row[data-region="' + region + '"] .pt').getBoundingClientRect(); const r = c.querySelector('.ruler').getBoundingClientRect();
  return { x: pt.left + pt.width / 2, y: r.top + r.height / 2 }; }"""

# The hint of one criterion.
JS_HINT = """(crit) => { const h = document.getElementById('slider-hint-' + crit); const b = h.querySelector('.hint-more');
  return { text: h.textContent.replace(/\\s+/g, ' ').trim(), more: !!(b && !b.hidden), moreText: b && !b.hidden ? b.textContent : null, expanded: b ? b.getAttribute('aria-expanded') : null }; }"""

# State facts for the gap fixture: the match count and the lib's own verdict per region.
JS_GAP_FACTS = """async ([rid, cid]) => { const f = await import('/lib/filters.js'); const st = await import('/src/state.js');
  const inView = st.filterData.regions.filter((r) => r.continent === st.state.continent);
  return { cellState: f.cellState(rid, cid, st.state, st.filterData), passes: f.regionPasses(rid, st.state, st.filterData),
           // MC-LISTS: a passing region with a gap in a threshold the visitor moved is counted as neither within nor outside, so the headline number leaves it out.
           expected: inView.filter((r) => f.regionPasses(r.id, st.state, st.filterData) && !st.filterData.criteria.some((c) => st.state.thresholds[c.id] !== f.thresholdDefault(c) && f.cellState(r.id, c.id, st.state, st.filterData) === 'gap')).length, shown: +document.getElementById('match-count').textContent }; }"""

# Re-render the criteria with a null cell (a fixture: the live data has none), then refresh.
JS_NULL_FIXTURE = """async ([rid, cid, reason]) => { const d = await import('/src/data.js'); const c = await import('/src/ui/criteria.js'); const rf = await import('/src/refresh.js');
  const cell = d.values[rid][cid]; cell.value = null; cell.nullReason = reason; c.renderCriteriaGrid(); rf.refreshAll(); return true; }"""

JS_NO_WINDOW_FIXTURE = """async (cid) => { const d = await import('/src/data.js'); const c = await import('/src/ui/criteria.js'); const rf = await import('/src/refresh.js');
  const crit = d.criteria.find((x) => x.id === cid); crit.window = undefined; c.renderCriteriaGrid(); rf.refreshAll();
  const p = document.querySelector('#crit-' + cid + ' .epoch'); return { text: p.textContent.trim(), cls: p.className, hatched: !!p.querySelector('i.p'), border: getComputedStyle(p).borderTopStyle }; }"""

# Expected spoken value text for a slider value, built from the site's own formatter.
JS_EXPECT_VT = """async ([crit, v, dir]) => { const ev = await import('/lib/evidence-render.js'); const d = await import('/src/data.js'); const c = d.criteria.find((x) => x.id === crit);
  return (dir === 'min' ? 'at least ' : 'at most ') + ev.fmtNumber(v) + ' ' + c.rangeLabel; }"""

# One slider tick, timed to the second animation frame after the input event.
JS_TICKS = """async ([crit, n]) => { const s = document.getElementById('slider-' + crit); const min = +s.min, max = +s.max; const out = [];
  const raf = () => new Promise((r) => requestAnimationFrame(() => r()));
  await raf(); await raf();
  for (let i = 0; i < n; i++) { const v = min + (max - min) * (((i * 37) % 100) / 100); const t0 = performance.now();
    s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); await raf(); await raf(); out.push(performance.now() - t0); }
  return out; }"""

# Rendered-text contrast of every visible text element inside the criterion blocks. Returns failures under 4.5:1.
JS_CONTRAST = """() => {
  const parse = (s) => { let m = /^rgba?\\(([^)]+)\\)$/.exec(s); if (m) { const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = /^color\\(srgb ([^)]+)\\)$/.exec(s); if (m) { const p = m[1].split(/[ \\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return null; };
  const over = (fg, bg) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
  const lum = (c) => { const f = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const ground = (e) => { const layers = []; for (let p = e; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let g = [255, 255, 255, 1]; if (!layers.length || layers[layers.length - 1][3] < 1) { const b = parse(getComputedStyle(document.body).backgroundColor); if (b && b[3] > 0) g = b; } for (let i = layers.length - 1; i >= 0; i--) g = over(layers[i], g); return g; };
  const out = []; let checked = 0;
  document.querySelectorAll('.crit-card').forEach((c) => {
    c.querySelectorAll('*').forEach((e) => {
      if (!e.getClientRects().length || e.closest('[aria-hidden=true]') || e.closest('.sr-only')) return;
      if (!Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      let o = 1; for (let p = e; p && p !== document.documentElement; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity);
      const cs = getComputedStyle(e); const fgRaw = parse(cs.color); if (!fgRaw) return;
      const bg = ground(e); const fg = over([fgRaw[0], fgRaw[1], fgRaw[2], fgRaw[3] * o], bg); checked++;
      const r = ratio(fg, bg); if (r < 4.5) out.push({ card: c.id, el: e.className || e.tagName, text: e.textContent.trim().slice(0, 30), ratio: Math.round(r * 100) / 100, color: cs.color });
    });
  });
  return { checked, fails: out }; }"""
