"""Selectors and page scripts for the scale suite (suites/test_scale.py): continent in the URL, foreign parameters kept,
coalesced refresh, layout at many regions. Owned by MC-SCALE. Loaded by file path through lib/sel.py (this directory has no
__init__.py on purpose)."""

SEL = {
    "tab": ".continent-tab",
    "tab_active": ".continent-tab.active",
    "card": ".region-card",
    "star": ".region-star",
    "slider": ".criteria input[type=range]",
    "match_count": "#match-count",
    "shortlist_btn": "#shortlist-btn",
    "modal": "#signup-modal",
    "modal_close": "#modal-close-btn",
    "sum_table": "#sum-table",
    "grid": "#region-grid",
    "rules_style": "style#continent-rules",
    "og_image": "meta[property='og:image']",
}

# { continent: [region ids in document order] } from the rendered cards (every continent is in the DOM; CSS hides the others).
JS_REGIONS = """() => { const out = {}; document.querySelectorAll('.region-card').forEach((c) => {
  (out[c.dataset.continent] = out[c.dataset.continent] || []).push(c.id.replace('region-', '')); }); return out; }"""

# Tabs in order: [{continent, active, selected}].
JS_TABS = """() => Array.from(document.querySelectorAll('.continent-tab')).map((b) => ({
  continent: b.dataset.continent, active: b.classList.contains('active'), selected: b.getAttribute('aria-selected') })) """

# Nodes of a hidden continent that still take space, and the active continent's cards that are not shown.
JS_HIDDEN_VISIBLE = """() => { const a = document.body.dataset.continent; const bad = []; let other = 0;
  document.querySelectorAll('[data-continent]').forEach((e) => {
    if (e === document.body || e.classList.contains('continent-tab')) return;
    if (e.dataset.continent === a) return;
    other++;
    if (e.getClientRects().length) bad.push(e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : ''));
  });
  const cards = Array.from(document.querySelectorAll('.region-card')).filter((c) => c.dataset.continent === a);
  const cardsShown = cards.filter((c) => c.getClientRects().length).length;
  return { active: a, otherNodes: other, visibleOther: bad.length, sample: bad.slice(0, 6), cards: cards.length, cardsShown }; }"""

# Layout facts: page overflow, the summary table's scroll container, the cards grid, names that overflow their card.
JS_LAYOUT = """() => { const de = document.documentElement; const t = document.getElementById('sum-table');
  let box = null; let p = t && t.parentElement;
  while (p && p !== document.body) { const ox = getComputedStyle(p).overflowX; if (ox === 'auto' || ox === 'scroll') { box = p; break; } p = p.parentElement; }
  const g = document.getElementById('region-grid');
  const names = Array.from(document.querySelectorAll('.region-card .name')).filter((n) => n.getClientRects().length && n.scrollWidth > n.clientWidth + 1).map((n) => n.textContent.slice(0, 40));
  const ths = Array.from(document.querySelectorAll('#sum-table thead th')).filter((th) => th.getClientRects().length).length;
  return { pageOverflow: de.scrollWidth - window.innerWidth,
           table: t ? { width: Math.round(t.getBoundingClientRect().width), scrollBox: !!box, boxScrolls: box ? box.scrollWidth > box.clientWidth : false, boxClient: box ? box.clientWidth : null } : null,
           grid: g ? { over: g.scrollWidth - g.clientWidth } : null, namesOverflowing: names, visibleColumns: ths - 1,
           cardsTotal: document.querySelectorAll('.region-card').length, sumColumnsTotal: document.querySelectorAll('#sum-table thead th').length - 1 }; }"""

# 20 slider inputs in one task, then how many times #match-count was rewritten (a coalesced refresh writes it once).
JS_BURST = """async () => { const el = document.getElementById('match-count'); let n = 0;
  const mo = new MutationObserver((m) => { n += m.length; }); mo.observe(el, { childList: true, characterData: true, subtree: true });
  const s = document.querySelector('.criteria input[type=range]'); const min = +s.min, max = +s.max;
  for (let i = 0; i < 20; i++) { s.value = String(min + (max - min) * ((i * 3) % 10) / 10); s.dispatchEvent(new Event('input', { bubbles: true })); }
  await new Promise((r) => setTimeout(r, 400)); mo.disconnect();
  const shown = Array.from(document.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length);
  return { writes: n, count: el.textContent.trim(), meeting: shown.filter((c) => !c.classList.contains('fail')).length, shown: shown.length }; }"""

# Positive control for the burst above: refreshAll() called 20 times in a row runs the sections 20 times, so the observer must
# count at least 20 writes. If it counted fewer the burst check could not fail.
JS_SYNC_CONTROL = """async () => { const el = document.getElementById('match-count'); let n = 0; const m = await import('/src/refresh.js');
  const mo = new MutationObserver((x) => { n += x.length; }); mo.observe(el, { childList: true, characterData: true, subtree: true });
  // match-bar.js writes a node only when its text changed (MC-LISTS), so each direct call starts from a blanked #match-count;
  // the blanking itself is discarded (takeRecords) and only what refreshAll() wrote is counted.
  for (let i = 0; i < 20; i++) { el.textContent = '-'; mo.takeRecords(); m.refreshAll(); n += mo.takeRecords().length; }
  await new Promise((r) => setTimeout(r, 100)); n += mo.takeRecords().length; mo.disconnect(); return n; }"""

# One slider tick: the input event, then two animation frames (the refresh has run and the page has had a frame to
# style, lay out and paint). The suite reads the browser's main-thread TaskDuration around this call (Chrome DevTools
# Performance.getMetrics), so a tick costs what the main thread worked, not how long the software rasteriser of a headless run
# takes to present the frame. The frame latency is returned too and reported as information.
JS_ONE_TICK = """async (frac) => { const s = document.querySelector('.criteria input[type=range]'); const min = +s.min, max = +s.max;
  const t0 = performance.now(); s.value = String(min + (max - min) * frac); s.dispatchEvent(new Event('input', { bubbles: true }));
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r()))); return performance.now() - t0; }"""

# The bus event the refresh orchestrator emits when the continent or the region count changed since its last run.
JS_INVALIDATE = """async (other) => { const bus = await import('/src/bus.js'); const sw = await import('/src/ui/continent-switcher.js');
  const got = []; bus.on('cache:invalidate', (e) => got.push(e.reason + ':' + e.continent + ':' + e.regionCount));
  sw.setContinent(other); await new Promise((r) => setTimeout(r, 300)); return got; }"""
