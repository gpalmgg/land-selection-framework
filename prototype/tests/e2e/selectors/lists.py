"""Selectors and page scripts for the lists suite (suites/test_lists.py). Owned by MC-LISTS.
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "match_bar": ".match-bar",
    "count": "#match-count",
    "total": "#match-total",
    "detail": "#match-detail",
    "gap_note": "#match-gap-note",
    "announce": "#match-announce",
    "chips_mount": "#match-regions",
    "chip": "#match-regions .region-chip:not(.more):not(.gap)",
    "chip_more": "#match-regions .region-chip.more",
    "chip_gap": "#match-regions .region-chip.gap",
    "reset": "#reset-btn",
    "share": "#share-btn",
    "share_note": "#share-note",
    "pins_btn": "#shortlist-btn",
    "next_step": "#next-step",
    "next_lead": "#next-step-lead",
    "qual": "#qual-filters",
    "qual_select": "#qual-filters select",
    "overlay": "#compare-overlay",
    "compare_body": "#compare-body",
    "compare_close": "#compare-close",
    "compare_table": "#compare-body table",
    "compare_scroll": "#compare-body .compare-scroll",
    "sum_wrap": "#sum-wrap",
    "sum_table": "#sum-table",
    "drawer": "#region-drawer",
    "pin": ".region-card .region-pin",
    "card": ".region-card",
    "tab": ".continent-tab",
}

# The words a visitor must never read in the next-step line or in a qualitative option (the discipline suite scans the same).
NEXT_STEP_BANNED = r"\b(first|best|top|closest)\b"
SUPERLATIVE = r"\b(best|top|ideal|winner|leading|densest|strongest|cheapest|lowest|highest|most|least)\b"

# ---------------------------------------------------------------------------------------------------- data and state
# Regions, criteria, qualitative filters and the label map, read through the site's own modules.
JS_BOOT = """async () => {
  const d = await import('/src/data.js'); const st = await import('/src/state.js'); const qf = await import('/src/config/qual-filters.js');
  const ql = await import('/lib/qual-labels.js'); const rg = await import('/src/ui/region-grid.js');
  // The metadata the app itself can see: data.js re-exports v1Meta from data/v1-lookup.js (follow-up of MC-LISTS while it does not).
  const meta = d.v1Meta || {};
  let fileMeta = {}; try { fileMeta = (await import('/data/v1-lookup.js')).v1Meta || {}; } catch (e) {}
  return { continent: st.state.continent,
    regions: d.regions.map((r) => ({ id: r.id, name: r.name, short: r.short || '', main: rg.splitName(r.name).main, continent: r.continent, country: r.country, accent: r.accent })),
    criteria: d.criteria.map((c) => ({ id: c.id, name: c.name, higherIs: c.higherIs, min: c.rangeMin, max: c.rangeMax, label: c.rangeLabel })),
    qual: qf.QUAL_FILTERS.map((f) => ({ id: f.id, options: f.options, labelled: ql.qualOptions(f.id, meta), field: (ql.QUAL_FIELDS[f.id] || {}).label || '' })),
    metaHasEdges: !!(meta.affordability_band && meta.affordability_band.edges), fileMetaHasEdges: !!(fileMeta.affordability_band && fileMeta.affordability_band.edges),
    values: Object.fromEntries(d.regions.map((r) => [r.id, Object.fromEntries(d.criteria.map((c) => [c.id, { value: (d.values[r.id][c.id] || {}).value, vintage: (d.values[r.id][c.id] || {}).vintage, source: (d.values[r.id][c.id] || {}).source }]))])) }; }"""

# Sets a criterion slider through the page's own input event.
JS_SET_SLIDER = """([crit, v]) => { const s = document.getElementById('slider-' + crit) || document.querySelector('#crit-' + crit + ' input[type=range]');
  s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); return s.value; }"""

# Injects a gap: the figure of one cell becomes null (what P-CELL ships for a cell the re-verification could not reproduce).
JS_MAKE_GAP = """async ([rid, crit]) => { const d = await import('/src/data.js'); const cell = d.values[rid][crit]; const was = cell.value;
  cell.value = null; cell.nullReason = 'test: no verified figure';
  const sum = await import('/src/ui/summary-table.js'); sum.renderSummaryTable();   // the table is rendered once from the data: draw it again with the gap
  const bus = await import('/src/bus.js'); bus.emit('refresh'); return was; }"""

JS_REFRESH = """async () => { const bus = await import('/src/bus.js'); bus.emit('refresh'); }"""

# The bar as the visitor sees it, plus the live state the page computed it from.
JS_BAR = """async () => {
  const st = await import('/src/state.js'); const mb = await import('/src/ui/match-bar.js'); const ns = await import('/src/ui/next-step.js');
  const t = mb.matchTally(); const txt = (s) => ((document.querySelector(s) || {}).textContent || '').trim();
  const chips = Array.from(document.querySelectorAll('#match-regions .region-chip:not(.more):not(.gap)')).filter((e) => e.getClientRects().length);
  const gapChips = Array.from(document.querySelectorAll('#match-regions .region-chip.gap')).filter((e) => e.getClientRects().length);
  const more = document.querySelector('#match-regions .region-chip.more');
  const cards = Array.from(document.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length);
  return { count: txt('#match-count'), total: txt('#match-total'), detail: txt('#match-detail'), gapNote: txt('#match-gap-note'),
    chips: chips.map((e) => e.dataset.region), chipNames: chips.map((e) => e.textContent.trim()), gapChips: gapChips.map((e) => e.dataset.region),
    more: more ? { text: more.textContent.trim(), expanded: more.getAttribute('aria-expanded'), label: more.getAttribute('aria-label') } : null,
    tally: { within: t.within.map((r) => r.id), gaps: t.gaps.map((g) => g.region.id), outside: t.outside.map((r) => r.id), inView: t.inView.map((r) => r.id), active: t.active },
    next: txt('#next-step-lead'), nextWant: ns.nextStepText(t.within.length), nextButtons: document.querySelectorAll('#next-step button, #next-step a, #next-step [tabindex]').length,
    cardsFail: cards.filter((c) => c.classList.contains('fail')).map((c) => c.dataset.region), cardsShown: cards.map((c) => c.dataset.region),
    announce: txt('#match-announce'), url: location.search }; }"""

# Everything about the qualitative selects.
JS_QUAL = """() => Array.from(document.querySelectorAll('#qual-filters select')).map((s) => ({ id: s.dataset.qualFilter, selectId: s.id, height: Math.round(s.getBoundingClientRect().height),
  label: ((s.closest('label') || {}).querySelector ? (s.closest('label').querySelector('.qual-filter-label') || {}).textContent : '') || '',
  options: Array.from(s.options).map((o) => ({ value: o.value, text: o.textContent.trim() })), value: s.value,
  radius: getComputedStyle(s).borderTopLeftRadius })).concat([{ note: ((document.querySelector('#qual-filters .qual-note') || {}).textContent || '').trim() }])"""

# The compare table: caption, heads, scopes, rows and cells.
JS_COMPARE = """() => {
  const t = document.querySelector('#compare-body table'); if (!t) return null;
  const heads = Array.from(t.querySelectorAll('th'));
  const colHeads = Array.from(t.querySelectorAll('thead th')).slice(1).map((th) => ({ name: (th.querySelector('.name') || {}).textContent || '', country: (th.querySelector('.country') || {}).textContent || '', sal: (th.querySelector('.sal-k') || {}).textContent || '',
    salV: (th.querySelector('.sal-v') || {}).textContent || '', scope: th.getAttribute('scope'), region: (th.getAttribute('style') || '') }));
  const rows = Array.from(t.querySelectorAll('tbody tr')).map((tr) => { const th = tr.querySelector('th'); const tds = Array.from(tr.querySelectorAll('td'));
    return { head: th ? th.childNodes[0].textContent.trim() : '', scope: th ? th.getAttribute('scope') : null, cls: tr.className, cells: tds.map((td) => ({ cls: td.className, text: td.innerText.trim(), v: (td.querySelector('.v') || {}).textContent || '',
      l: (td.querySelector('.l') || {}).textContent || '', s: (td.querySelector('.s') || {}).textContent || '', links: td.querySelectorAll('.s a[href^=http]').length })) }; });
  const sc = document.querySelector('#compare-body .compare-scroll'); const panel = document.querySelector('#compare-overlay .compare-panel'); const de = document.documentElement;
  const rowTh = t.querySelector('tbody th[scope=row]'); const hint = document.querySelector('#compare-body .scroll-hint');
  const scb = sc.getBoundingClientRect(); const firstTh = rowTh.getBoundingClientRect();
  return { caption: ((t.querySelector('caption') || {}).textContent || '').trim(), thTotal: heads.length, thNoScope: heads.filter((h) => !h.getAttribute('scope')).length,
    colScopes: heads.filter((h) => h.getAttribute('scope') === 'col').length, rowScopes: heads.filter((h) => h.getAttribute('scope') === 'row').length,
    colHeads, rows, tfoot: t.querySelectorAll('tfoot').length, controls: t.querySelectorAll('button, select, input, [role=button]').length,
    scroll: { scrollW: sc.scrollWidth, clientW: sc.clientWidth, overflowX: getComputedStyle(sc).overflowX, tabindex: sc.getAttribute('tabindex'), role: sc.getAttribute('role'), aria: sc.getAttribute('aria-label') },
    panel: { scrollW: panel.scrollWidth, clientW: panel.clientWidth }, pageOverflow: de.scrollWidth - innerWidth, tableW: Math.round(t.getBoundingClientRect().width),
    stickyRowHead: getComputedStyle(rowTh).position, rowHeadLeftGap: Math.round(firstTh.left - scb.left),
    hintShown: !!(hint && hint.getClientRects().length), hintText: hint ? hint.textContent.trim() : '', note: ((document.querySelector('#compare-overlay .compare-note') || {}).textContent || '').trim(),
    title: ((document.querySelector('#compare-title') || {}).textContent || '').trim(), dialogLabel: document.getElementById('compare-overlay').getAttribute('aria-labelledby'),
    text: t.innerText }; }"""

# Scrolls the compare table sideways and reports where the sticky first column sits relative to the scroll box.
JS_COMPARE_SCROLL = """(x) => { const sc = document.querySelector('#compare-body .compare-scroll'); sc.scrollLeft = x; const scb = sc.getBoundingClientRect();
  const th = document.querySelector('#compare-body tbody th[scope=row]').getBoundingClientRect(); const de = document.documentElement;
  return { left: sc.scrollLeft, gap: Math.round(th.left - scb.left), pageOverflow: de.scrollWidth - innerWidth }; }"""

# The summary table: heads, scopes, rows, region columns, fail state, sticky positions.
JS_SUMMARY = """async () => {
  const d = await import('/src/data.js'); const t = document.getElementById('sum-table'); const wrap = document.getElementById('sum-wrap');
  const heads = Array.from(t.querySelectorAll('th')); const de = document.documentElement;
  const ink = (() => { const p = document.createElement('i'); p.style.color = 'var(--ink)'; wrap.appendChild(p); const c = getComputedStyle(p).color; p.remove(); return c; })();
  const groundOut = (() => { const p = document.createElement('i'); p.style.background = 'var(--ground-out)'; wrap.appendChild(p); const c = getComputedStyle(p).backgroundColor; p.remove(); return c; })();
  const vis = (e) => e.getClientRects().length > 0;
  const regionIds = d.regions.map((r) => r.id);
  const cols = regionIds.map((id) => { const cells = Array.from(t.querySelectorAll('[id="sum-th-' + id + '"], [id^="sum-td-' + id + '-"]'));
    return { id, n: cells.length, fail: cells.filter((c) => c.classList.contains('region-fail')).length, shown: cells.some(vis),
      opacities: Array.from(new Set(cells.map((c) => getComputedStyle(c).opacity))), bgs: Array.from(new Set(cells.map((c) => getComputedStyle(c).backgroundColor))),
      borderStyles: Array.from(new Set(cells.map((c) => getComputedStyle(c).borderLeftStyle))),
      vColors: Array.from(new Set(Array.from(t.querySelectorAll('[id^="sum-td-' + id + '-"]:not(.gap) .v')).map((v) => getComputedStyle(v).color))),
      vInline: Array.from(t.querySelectorAll('[id^="sum-td-' + id + '-"] .v')).filter((v) => /color/i.test(v.getAttribute('style') || '')).length }; });
  const head = Array.from(t.querySelectorAll('thead th'));
  const rowHeads = Array.from(t.querySelectorAll('tbody th')).map((th) => th.childNodes[0].textContent.trim());
  const firstRowTh = t.querySelector('tbody th[scope=row]'); const scb = wrap.getBoundingClientRect();
  return { caption: ((t.querySelector('caption') || {}).textContent || '').trim(), captionSr: !!(t.querySelector('caption.sr-only')), thNoScope: heads.filter((h) => !h.getAttribute('scope')).length,
    headIds: head.slice(1).map((th) => th.id), headScopes: head.map((th) => th.getAttribute('scope')), rowScopes: Array.from(t.querySelectorAll('tbody th')).map((th) => th.getAttribute('scope')),
    rowHeads, tfoot: t.querySelectorAll('tfoot').length, firstRowCells: Array.from(t.querySelectorAll('tbody tr:first-child td')).map((td) => td.textContent.trim()),
    cols, ink, groundOut, wrapOverflowX: getComputedStyle(wrap).overflowX, wrapScrolls: wrap.scrollWidth > wrap.clientWidth, wrapTabindex: wrap.getAttribute('tabindex'),
    stickyHead: getComputedStyle(head[1]).position, stickyCorner: getComputedStyle(head[0]).position, stickyRowHead: getComputedStyle(firstRowTh).position,
    pageOverflow: de.scrollWidth - innerWidth, visibleCols: head.slice(1).filter(vis).length, hintShown: !!(document.querySelector('.summary .scroll-hint') && document.querySelector('.summary .scroll-hint').getClientRects().length),
    text: t.innerText, rowsHtml: t.querySelectorAll('tbody tr').length,
    lastColHeader: head[head.length - 1] ? head[head.length - 1].textContent.trim() : '' }; }"""

# Scrolls the summary sideways and reports where the sticky first column sits.
JS_SUMMARY_SCROLL = """(x) => { const w = document.getElementById('sum-wrap'); w.scrollLeft = x; const scb = w.getBoundingClientRect();
  const th = document.querySelector('#sum-table tbody th[scope=row]').getBoundingClientRect(); return { left: w.scrollLeft, gap: Math.round(th.left - scb.left) }; }"""

# Visible text, option text and attributes of the list components, for the discipline scan.
JS_ITEMS = """() => { const items = []; const roots = ['.match-bar', '#match-regions', '#next-step', '#qual-filters', '.summary', '#compare-overlay'];
  roots.forEach((sel) => { const e = document.querySelector(sel); if (!e) return; items.push({ kind: 'text', text: e.innerText || '' });
    e.querySelectorAll('option').forEach((o) => items.push({ kind: 'option', text: (o.textContent || '').trim() }));
    e.querySelectorAll('[aria-label],[title],[alt],[placeholder]').forEach((n) => ['aria-label', 'title', 'alt', 'placeholder'].forEach((a) => { const v = (n.getAttribute(a) || '').trim(); if (v) items.push({ kind: a, text: v }); }));
    const c = e.cloneNode(true); c.querySelectorAll('script,style').forEach((n) => n.remove()); items.push({ kind: 'html', text: c.outerHTML }); });
  return items; }"""

# Rendered-text contrast inside the list components (>= 4.5:1). Returns failures.
JS_CONTRAST = """() => {
  const parse = (s) => { let m = /^rgba?\\(([^)]+)\\)$/.exec(s); if (m) { const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = /^color\\(srgb ([^)]+)\\)$/.exec(s); if (m) { const p = m[1].split(/[ \\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return null; };
  const over = (fg, bg) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
  const lum = (c) => { const f = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const ground = (e) => { const layers = []; for (let p = e; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let g = [255, 255, 255, 1]; if (!layers.length || layers[layers.length - 1][3] < 1) { const b = parse(getComputedStyle(document.body).backgroundColor); if (b && b[3] > 0) g = b; } for (let i = layers.length - 1; i >= 0; i--) g = over(layers[i], g); return g; };
  const out = []; let checked = 0;
  ['.match-bar', '#match-regions', '#next-step', '#qual-filters', '.summary', '#compare-overlay.open'].forEach((sel) => {
    const root = document.querySelector(sel); if (!root) return;
    root.querySelectorAll('*').forEach((e) => {
      if (!e.getClientRects().length || e.closest('[aria-hidden=true]') || e.closest('.sr-only')) return;
      if (!Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const cs = getComputedStyle(e); const fgRaw = parse(cs.color); if (!fgRaw) return;
      const bg = ground(e); const fg = over(fgRaw, bg); checked++;
      const r = ratio(fg, bg); if (r < 4.5) out.push({ root: sel, el: (e.className && e.className.baseVal === undefined ? e.className : e.tagName) || e.tagName, text: (e.textContent || '').trim().slice(0, 30), ratio: Math.round(r * 100) / 100, color: cs.color });
    });
  });
  return { checked, fails: out }; }"""
