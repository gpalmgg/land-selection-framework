"""Selectors and page scripts for the region-card suite (suites/test_cards.py). Owned by MC-CARDS.
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "grid": "#region-grid",
    "card": ".region-card",
    "open": ".region-card .region-open",
    "pin": ".region-card .region-pin",
    "status": ".region-card .status",
    "slider": ".criteria input[type=range]",
    "shortlist_btn": "#shortlist-btn",
    "drawer": "#region-drawer",
    "drawer_close": "#drawer-close",
    "drawer_pin": "#region-drawer .drawer-star, #region-drawer .region-pin",
    "tab": ".continent-tab",
}

# ----------------------------------------------------------------------------------------------------- data from the page
# { regions: [{id, name, continent, accent}], names, salutation text, place, asks, first sentence } read through the site's own modules.
JS_DATA = """async () => {
  const d = await import('/src/data.js'); const sal = await import('/lib/salutation.js'); const rg = await import('/src/ui/region-grid.js');
  const full = d.loadFullData ? await d.loadFullData() : d;   // region-depth is off the first-paint path (MC-PERF): the full prose loads on demand
  const depth = full.regionDepth;
  return d.regions.map((r) => ({ id: r.id, name: r.name, continent: r.continent, accent: r.accent,
    sal: sal.salutation(r.id), place: (d.bioregions[r.id] || {}).place || '', asks: (depth[r.id] || {}).asks || '',
    first: rg.firstSentence((depth[r.id] || {}).asks || ''), blurb: r.blurb, country: r.country })); }"""

# Structure of every card in the DOM (all continents): markup contract facts.
JS_STRUCTURE = """() => Array.from(document.querySelectorAll('.region-card')).map((c) => {
  const id = c.dataset.region;
  const q = (s) => c.querySelector(s);
  const body = q('.card-body');
  const order = [];
  Array.from(c.children).forEach((ch) => order.push(ch.className.split(' ')[0]));
  const bodyOrder = body ? Array.from(body.children).map((ch) => ch.className.split(' ')[0] || ch.tagName.toLowerCase()) : [];
  const labelled = c.getAttribute('aria-labelledby');
  const lab = labelled ? document.getElementById(labelled) : null;
  const nameOf = (n) => { if (!n) return ''; const al = n.getAttribute && n.getAttribute('aria-label'); if (al) return al; let t = ''; n.childNodes.forEach((k) => { t += k.nodeType === 3 ? k.textContent : (k.nodeType === 1 ? nameOf(k) : ''); }); return t.trim(); };
  const interactive = Array.from(c.querySelectorAll('a[href],button,input,select,textarea,summary,[tabindex],[contenteditable],[role=button],[role=link]'));
  return { id, tag: c.tagName.toLowerCase(), role: c.getAttribute('role'), tabindex: c.getAttribute('tabindex'), labelledby: labelled,
    labelTag: lab ? lab.tagName.toLowerCase() : null, accName: nameOf(lab), accessibleLabelButton: !!(lab && lab.querySelector('button.region-open')),
    style: c.getAttribute('style') || '', regionVar: c.style.getPropertyValue('--region').trim(),
    oldVar: (c.getAttribute('style') || '').indexOf('--accent-region') >= 0, continent: c.dataset.continent,
    order, bodyOrder, roleButtons: c.querySelectorAll('[role=button]').length,
    interactive: interactive.map((e) => e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.split(' ')[0] : '') + (e.hasAttribute('tabindex') ? '[tabindex=' + e.getAttribute('tabindex') + ']' : '')),
    openInsideH3: !!q('h3.name > button.region-open'), salK: (q('.sal-k') || {}).textContent || '', salV: (q('.sal-v') || {}).textContent || '',
    salBeforeName: !!(q('.salutation') && q('.salutation').nextElementSibling && q('.salutation').nextElementSibling.matches('h3.name')),
    place: (q('.place-line') || {}).textContent || '', asks: (q('.card-asks p') || {}).textContent || '', asksLabel: (q('.card-asks-label') || {}).textContent || '',
    country: (q('.country') || {}).textContent || '', blurb: (q('.blurb') || {}).textContent || '',
    pinLabel: (q('.region-pin') || {}).getAttribute ? q('.region-pin').getAttribute('aria-label') : null,
    pinPressed: q('.region-pin') ? q('.region-pin').getAttribute('aria-pressed') : null, pinText: q('.region-pin') ? q('.region-pin').textContent.trim() : null,
    nameText: (q('.region-open') || {}).textContent || '', desc: (q('.desc') || {}).textContent || '',
    statusHidden: q('.status') ? q('.status').hidden : null, statusText: q('.status') ? q('.status').textContent.trim() : null };
})"""

# Computed facts of one card (by id): frame, wave, status mark, opacity chain, place-line clamp.
JS_STYLE = """(id) => { const c = document.getElementById('region-' + id); const cs = getComputedStyle(c);
  const probe = document.createElement('div'); probe.style.cssText = 'position:absolute;visibility:hidden;background:var(--ground-out)'; c.appendChild(probe);
  const groundOut = getComputedStyle(probe).backgroundColor; probe.style.background = 'var(--sheet)'; const sheet = getComputedStyle(probe).backgroundColor; probe.remove();
  let chain = 1; for (let e = c; e && e !== document.documentElement; e = e.parentElement) chain *= parseFloat(getComputedStyle(e).opacity);
  const textOpacity = []; c.querySelectorAll('*').forEach((e) => { if (!e.getClientRects().length) return; let o = 1; for (let p = e; p && p !== document.documentElement; p = p.parentElement) o *= parseFloat(getComputedStyle(p).opacity); if (e.childNodes.length && Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim()) && o < 0.999) textOpacity.push(e.className || e.tagName); });
  const w = c.querySelector('.wave'); const wcs = w ? getComputedStyle(w) : null;
  const mark = c.querySelector('.status i'); const mcs = mark ? getComputedStyle(mark) : null;
  const pl = c.querySelector('.place-line'); const plcs = pl ? getComputedStyle(pl) : null;
  const lh = plcs ? parseFloat(plcs.lineHeight) : 0;
  return { borderStyle: cs.borderTopStyle, borderWidth: cs.borderTopWidth, opacity: cs.opacity, chain, bg: cs.backgroundColor, groundOut, sheet, shadow: cs.boxShadow,
    waveOpacity: wcs ? wcs.opacity : null, waveHeight: wcs ? wcs.height : null, markBg: mcs ? mcs.backgroundImage : null, markBorderStyle: mcs ? mcs.borderTopStyle : null,
    markShown: !!(mark && mark.getClientRects().length), textFaded: textOpacity.slice(0, 5),
    placeLines: pl && lh ? Math.round(pl.getBoundingClientRect().height / lh * 100) / 100 : null, placeClamp: plcs ? (plcs.webkitLineClamp || plcs.lineClamp) : null, placeOverflow: plcs ? plcs.overflow : null,
    transform: cs.transform, outline: cs.outlineStyle + ' ' + cs.outlineWidth,
    asksBg: getComputedStyle(c.querySelector('.card-asks')).backgroundColor, whyDisplay: getComputedStyle(c.querySelector('.status .why')).display }; }"""

# Rendered-text contrast of every visible text element inside the cards that are on screen. Returns failures under 4.5:1.
JS_CONTRAST = """() => {
  const parse = (s) => { let m = /^rgba?\\(([^)]+)\\)$/.exec(s); if (m) { const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    m = /^color\\(srgb ([^)]+)\\)$/.exec(s); if (m) { const p = m[1].split(/[ \\/]+/).filter(Boolean).map(Number); return [p[0] * 255, p[1] * 255, p[2] * 255, p.length > 3 ? p[3] : 1]; } return null; };
  const over = (fg, bg) => { const a = fg[3]; return [fg[0] * a + bg[0] * (1 - a), fg[1] * a + bg[1] * (1 - a), fg[2] * a + bg[2] * (1 - a), 1]; };
  const lum = (c) => { const f = c.slice(0, 3).map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }); return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const ground = (e) => { const layers = []; for (let p = e; p; p = p.parentElement) { const c = parse(getComputedStyle(p).backgroundColor); if (c && c[3] > 0) { layers.push(c); if (c[3] >= 1) break; } }
    let g = [255, 255, 255, 1]; if (!layers.length || layers[layers.length - 1][3] < 1) { const b = parse(getComputedStyle(document.body).backgroundColor); if (b && b[3] > 0) g = b; } for (let i = layers.length - 1; i >= 0; i--) g = over(layers[i], g); return g; };
  const out = []; let checked = 0;
  document.querySelectorAll('.region-card').forEach((c) => {
    if (!c.getClientRects().length) return;
    c.querySelectorAll('*').forEach((e) => {
      if (!e.getClientRects().length || e.closest('[aria-hidden=true]')) return;
      if (!Array.from(e.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim())) return;
      const cs = getComputedStyle(e); const fgRaw = parse(cs.color); if (!fgRaw) return;
      const bg = ground(e); const fg = over(fgRaw, bg); checked++;
      const r = ratio(fg, bg); if (r < 4.5) out.push({ id: c.dataset.region, el: e.className || e.tagName, ratio: Math.round(r * 100) / 100, color: cs.color });
    });
  });
  return { checked, fails: out }; }"""

# Layout facts at the current width: for the cards on screen, per grid row: tops, heights, columns; DOM order versus visual order.
JS_GRID = """() => {
  const g = document.getElementById('region-grid'); const cs = getComputedStyle(g);
  const cards = Array.from(g.querySelectorAll('.region-card')).filter((c) => c.getClientRects().length);
  const boxes = cards.map((c) => { const b = c.getBoundingClientRect(); return { id: c.dataset.region, top: Math.round(b.top + scrollY), left: Math.round(b.left), w: Math.round(b.width), h: Math.round(b.height * 10) / 10,
    overflow: Math.max(0, ...Array.from(c.querySelectorAll('*')).filter((e) => !e.closest('.fold') && e.getClientRects().length).map((e) => Math.round(e.getBoundingClientRect().right - b.right))) }; });
  const rows = []; boxes.forEach((b) => { let r = rows.find((x) => Math.abs(x.top - b.top) <= 2); if (!r) { r = { top: b.top, items: [] }; rows.push(r); } r.items.push(b); });
  const lefts = Array.from(new Set(boxes.map((b) => b.left))).sort((a, b) => a - b);
  const visual = boxes.slice().sort((a, b) => (Math.abs(a.top - b.top) <= 2 ? a.left - b.left : a.top - b.top)).map((b) => b.id);
  const unequal = rows.filter((r) => Math.max(...r.items.map((i) => i.h)) - Math.min(...r.items.map((i) => i.h)) > 1).map((r) => ({ top: r.top, hs: r.items.map((i) => i.h) }));
  return { columns: lefts.length, cols: cs.gridTemplateColumns, n: cards.length, rows: rows.length, unequal, domOrder: boxes.map((b) => b.id), visualOrder: visual,
    overflowing: boxes.filter((b) => b.overflow > 1).map((b) => b.id), pageOverflow: document.documentElement.scrollWidth - innerWidth, width: Math.round(g.getBoundingClientRect().width) }; }"""

# Sets the first criterion slider (or the one named) to a value through the page's own input event.
JS_SET_SLIDER = """([crit, v]) => { const s = document.getElementById('slider-' + crit) || document.querySelector('#crit-' + crit + ' input[type=range]');
  s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); return s.value; }"""

# Which sliders exist and their range, by criterion id.
JS_SLIDERS = """() => Array.from(document.querySelectorAll('.criteria input[type=range]')).map((s) => { const c = s.closest('.crit-card'); return { id: c ? c.id.replace(/^crit-/, '') : s.id.replace(/^slider-/, ''), min: +s.min, max: +s.max, value: +s.value, step: +s.step }; })"""

# Pure functions of region-grid.js and lib/salutation.js, called in the page with injected data.
JS_UNITS = """async () => {
  const rg = await import('/src/ui/region-grid.js'); const sal = await import('/lib/salutation.js'); const out = {};
  out.first = [
    rg.firstSentence('Alentejo asks you to wait. Second sentence here.'),
    rg.firstSentence('The St. Lawrence shore asks for patience. Then more.'),
    rg.firstSentence('Under the U.S. regime you arrive as a neighbour. Then another.'),
    rg.firstSentence('One short sentence with no stop'),
    rg.firstSentence('A long lead clause that goes on and on and on until it passes the cut: ' + 'x'.repeat(120) + ' and then ends. Second one.'),
    rg.firstSentence('')];
  out.names = [rg.splitName('Highlands (north-west Scotland)'), rg.splitName('Galicia'), rg.splitName('Plateau de Millevaches (Limousin)')];
  const data = { reciprocity: { ver: { status: 'verified', territoryShort: 'Mi\\'kmaq territory (unceded)', contested: { note: 'x' } }, flagged: { status: 'verified', flag: 'review', territoryShort: 'WITHHELD', contested: { note: 'x' } },
                              draft: { status: 'draft', territoryShort: 'DRAFT' }, plain: { status: 'verified', territoryShort: 'Rooted commons', contested: null } },
           landStanding: { ver: { territory: 'Head of ver \\u2014 more words' }, flagged: { territory: 'Fallback head \\u2014 tail' }, draft: { territory: 'Draft head - tail' }, plain: { territory: 'Plain head' } } };
  out.sal = Object.fromEntries(['ver', 'flagged', 'draft', 'plain', 'none'].map((k) => [k, sal.salutation(k, { data })]));
  out.label = [sal.salutationLabel(false), sal.salutationLabel(true)];
  return out; }"""

# One-region reason sentence through the exported pure functions, with a synthetic data bundle.
JS_REASONS = """async () => {
  const rg = await import('/src/ui/region-grid.js');
  const criteria = [{ id: 'a', name: 'Solar PV potential', higherIs: 'better', rangeMin: 700, rangeMax: 2000, step: 10 },
                    { id: 'b', name: 'Water stress', higherIs: 'worse', rangeMin: 0, rangeMax: 2, step: 0.1 },
                    { id: 'c', name: 'Soil organic carbon', higherIs: 'better', rangeMin: 0, rangeMax: 340, step: 1 }];
  const values = { r1: { a: { value: 1150, unit: 'kWh/kWp/yr' }, b: { value: 1.505, unit: 'ratio' }, c: { value: null, unit: 'g/kg' } },
                   r2: { a: { value: 1500, unit: 'kWh/kWp/yr' }, b: { value: 0.4, unit: 'ratio' }, c: { value: 120, unit: 'g/kg' } } };
  const qualFilters = [{ id: 'foreign_ownership', options: ['any', 'yes', 'restricted', 'no'], pick: (id) => ({ r1: 'restricted', r2: 'yes' }[id]) }];
  const data = { regions: [{ id: 'r1' }, { id: 'r2' }], values, criteria, qualFilters };
  const mk = (t, q) => ({ thresholds: Object.assign({ a: 700, b: 2, c: 0 }, t || {}), qualFilters: Object.assign({ foreign_ownership: 'any' }, q || {}), continent: 'x' });
  return {
    one: rg.reasonLine('r1', mk({ a: 1200 }), data),
    more: rg.reasonLine('r1', mk({ a: 1200, b: 1.2 }), data),
    sameDigits: rg.reasonLine('r1', mk({ b: 1.5 }), data),
    qualOnly: rg.reasonLine('r1', mk({}, { foreign_ownership: 'yes' }), data),
    none: rg.reasonLine('r2', mk({ a: 1200 }), data),
    gap: rg.gapLine('r1', mk({ c: 50 }), data),
    noGap: rg.gapLine('r1', mk({}), data),
    ceilingWord: rg.reasonLine('r2', mk({ b: 0.2 }), data) };
}"""
