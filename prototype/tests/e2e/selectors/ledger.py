"""Selectors and in-page scripts for the ledger suite (suites/test_ledger.py): the drawer's criteria ledger, the compact way in
and the compact climate and water context. Owned by MC-LEDGER. Loaded by file path through lib/sel.py (this directory has no
__init__.py on purpose)."""

SEL = {
    "drawer": "#region-drawer",
    "drawer_body": "#drawer-body",
    "drawer_close": "#drawer-close",
    "criteria": "section.drawer-criteria",
    "ledger": "section.drawer-criteria ul.ledger",
    "ledger_row": "section.drawer-criteria ul.ledger > li",
    "gap_row": "section.drawer-criteria ul.ledger > li.gap",
    "way": "section.way.compact",
    "way_rows": "section.way.compact dl.way-sum > dt",
    "way_more": "section.way.compact a.way-more",
    "way_tag": "section.way.compact .way-tag",
    "way_foot": "section.way.compact .way-foot",
    "ctx_section": "section.drawer-ctx",
    "ctx_row": "section.drawer-ctx .ctx-row",
    "ctx_src": "section.drawer-ctx .ctx-src",
    "ctx_more": "section.drawer-ctx .ctx-more a",
    "blocks": "section.drawer-criteria, section.way.compact, section.drawer-ctx",
}

# The three regions every ledger test opens (taken from the data when one is missing, see test_ledger.pick_regions).
REGIONS = ["alentejo", "galicia", "nova-scotia"]

# Words that must never appear in the ledger (framework discipline: nothing scores, ranks or orders). Whole words, any case.
BANNED_WORDS = r"\b(score|scores|scored|scoring|rank|ranks|ranked|ranking|best|top)\b"
# Direction words the trajectory chip may carry (neutral), and verdict words it must not.
VERDICT_WORDS = r"\b(improving|worsening|better|worse|good|bad)\b"
# Text arrows are not in the font subsets; direction icons are inline SVG.
ARROW_CHARS = "←↑→↓↔↕↖↗↘↙⇒▲▼"

# data bundle for the page under test: criteria, per-region cells, the licence registry, the shared renderers.
JS_DATA = """async () => {
  const d = await import('/src/data.js');
  const ev = await import('/lib/evidence-render.js');
  const out = { criteria: d.criteria.map((c) => ({ id: c.id, name: c.name })), regions: d.regions.map((r) => r.id), cells: {} };
  for (const r of d.regions) {
    out.cells[r.id] = {};
    for (const c of d.criteria) {
      const cell = d.values[r.id][c.id] || null;
      out.cells[r.id][c.id] = cell && {
        value: cell.value, vintage: cell.vintage || '', source: cell.source || '', sourceUrl: cell.sourceUrl || '',
        licence: ev.licenseOf(cell, c, d.sources), trajectory: cell.trajectory ? cell.trajectory.status : null,
        direction: cell.trajectory ? cell.trajectory.direction || null : null,
      };
    }
  }
  return out;
}"""

# Regions whose land-cost band is the lowest enum ('cheapest'), from the shipped V1 lookup (empty when the lookup has none).
JS_CHEAPEST = """async () => {
  const m = await import('/data/v1-lookup.js');
  const lc = (m.v1Lookup && m.v1Lookup.land_cost) || {};
  return Object.keys(lc).filter((id) => lc[id] && lc[id].affordability_band === 'cheapest');
}"""

# Open the drawer through the bus (the same event cards, chips and markers emit); the caller falls back to a card click.
JS_OPEN = """async (id) => { const b = await import('/src/bus.js'); b.emit('drawer:open', { regionId: id }); }"""

# Everything the assertions need from the open drawer, in one round trip.
JS_READ = """(sel) => {
  const q = (s) => document.querySelector(s);
  const txt = (e) => (e ? (e.innerText || '').replace(/\\s+/g, ' ').trim() : '');
  const rows = Array.from(document.querySelectorAll('section.drawer-criteria ul.ledger > li')).map((li) => {
    const sb = li.querySelector('.sb');
    const traj = li.querySelector('.traj');
    return {
      criterion: li.dataset.criterion || '', gap: li.classList.contains('gap'),
      name: txt(li.querySelector('.nm')), value: txt(li.querySelector('.vv')), sb: txt(sb),
      links: sb ? Array.from(sb.querySelectorAll('a[href]')).map((a) => a.getAttribute('href')) : [],
      traj: traj ? { text: txt(traj), svg: !!traj.querySelector('svg.dir-ico'), status: traj.dataset.status || '' } : null,
      trajNa: !!li.querySelector('.traj-na'), hasEmptyTraj: Array.from(li.querySelectorAll('.traj')).some((t) => !txt(t)),
    };
  });
  const way = q('section.way.compact');
  const ctx = q('section.drawer-ctx');
  return {
    open: !!q('#region-drawer.open'),
    rows,
    ledgerText: txt(q('section.drawer-criteria')),
    wayText: txt(way),
    ctxText: txt(ctx),
    way: way ? {
      terms: Array.from(way.querySelectorAll('dl.way-sum > dt')).map((e) => txt(e)),
      tag: txt(way.querySelector('.way-tag')),
      foot: txt(way.querySelector('.way-foot')),
      more: way.querySelector('a.way-more') ? { text: txt(way.querySelector('a.way-more')), href: way.querySelector('a.way-more').getAttribute('href') } : null,
      dir: txt(way.querySelector('.dir')),
      opacity: getComputedStyle(way).opacity, filter: getComputedStyle(way).filter,
      cols: getComputedStyle(way.querySelector('dl.way-sum')).gridTemplateColumns.split(' ').length,
      full: !!way.querySelector('ol.way-steps'),
    } : null,
    ctx: ctx ? {
      rows: Array.from(ctx.querySelectorAll('.ctx-row')).map((e) => txt(e)),
      src: txt(ctx.querySelector('.ctx-src')),
      more: ctx.querySelector('.ctx-more a') ? ctx.querySelector('.ctx-more a').getAttribute('href') : '',
      names: txt(ctx.querySelector('.ctx-names')),
    } : null,
    overflow: (() => { const b = q('#drawer-body'); return b ? { sw: b.scrollWidth, cw: b.clientWidth } : null; })(),
  };
}"""

# Contrast of every text-bearing element inside the three blocks: [{ratio, need, text, fg, bg}] for those below the AA bar.
JS_CONTRAST = """() => {
  const parse = (c) => { const m = /rgba?\\(([^)]+)\\)/.exec(c); if (!m) return null; const p = m[1].split(/[ ,\\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const blend = (top, under) => ({ r: top.r * top.a + under.r * (1 - top.a), g: top.g * top.a + under.g * (1 - top.a), b: top.b * top.a + under.b * (1 - top.a), a: 1 });
  const bgOf = (el) => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } }
    let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = stack.length - 1; i >= 0; i--) base = blend(stack[i], base); return base; };
  const bad = []; let checked = 0;
  document.querySelectorAll('section.drawer-criteria, section.way.compact, section.drawer-ctx').forEach((root) => {
    root.querySelectorAll('*').forEach((el) => {
      const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim());
      if (!own) return;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none') return;
      const fg0 = parse(cs.color); if (!fg0) return;
      const bg = bgOf(el); const fg = blend(fg0, bg);
      const L1 = lum(fg), L2 = lum(bg); const ratio = (Math.max(L1, L2) + 0.05) / (Math.min(L1, L2) + 0.05);
      const size = parseFloat(cs.fontSize); const bold = parseInt(cs.fontWeight, 10) >= 700;
      const need = (size >= 24 || (bold && size >= 18.66)) ? 3 : 4.5;
      checked++;
      if (ratio < need) bad.push({ ratio: Math.round(ratio * 100) / 100, need, text: (el.textContent || '').trim().slice(0, 50), fg: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
    });
  });
  return { checked, bad };
}"""

# Motion inside the three blocks: any element with a running animation or a non-zero transition.
JS_MOTION = """() => {
  const found = [];
  document.querySelectorAll('section.drawer-criteria, section.way.compact, section.drawer-ctx').forEach((root) => {
    [root, ...root.querySelectorAll('*')].forEach((el) => {
      const cs = getComputedStyle(el);
      const anim = cs.animationName && cs.animationName !== 'none' && parseFloat(cs.animationDuration) > 0.001;   // the global reduced-motion rule leaves 0.01 ms: not motion
      const trans = cs.transitionDuration.split(',').some((d) => parseFloat(d) > 0.001);
      if (anim || trans) found.push(el.tagName.toLowerCase() + '.' + (el.className || ''));
    });
  });
  return found;
}"""

# Render the criteria block from a synthetic context (a null cell, a small value, a negative) into a probe container.
JS_FIXTURE = """async () => {
  const blk = (await import('/src/ui/drawer/blocks/criteria.js')).default;
  const crit = [
    { id: 'a', name: 'Fixture gap', unit: 'x', license: 'CC BY 4.0' },
    { id: 'b', name: 'Fixture small', unit: 'ratio', license: 'CC BY 4.0' },
    { id: 'c', name: 'Fixture negative', unit: '%', license: 'CC BY 4.0' },
    { id: 'd', name: 'Fixture grouped', unit: 'kWh', license: 'CC BY 4.0' },
    { id: 'e', name: 'Fixture no licence', unit: 'u' },
  ];
  const values = {
    a: { value: null, unit: 'x', vintage: '2020', label: '', source: 'Fixture source', sourceUrl: 'https://example.org/a', nullReason: 'Count being re-verified. The anchor it cited lies outside the region.' },
    b: { value: 0.08, unit: 'ratio', vintage: '2019', label: 'Low', source: 'Fixture source', sourceUrl: 'https://example.org/b' },
    c: { value: -8, unit: '%', vintage: '2001\\u20132023', label: 'Loss', source: 'Fixture source', sourceUrl: 'https://example.org/c',
         trajectory: { status: 'measured', direction: 'falling', delta: -8, unit: '%', vintage: '2001\\u20132023', basis: 'fixture' } },
    d: { value: 1150, unit: 'kWh', vintage: '2023', label: 'Plenty', source: 'Fixture source', sourceUrl: 'https://example.org/d',
         trajectory: { status: 'not_available', basis: 'No open trend dataset exists for this value.' } },
    e: { value: 9.3, unit: 'u', vintage: '2022', label: 'Mid', source: 'Fixture source', sourceUrl: 'https://example.org/e' },
  };
  const host = document.createElement('div');
  host.id = 'ledger-fixture-host';
  host.style.cssText = 'position:fixed;left:0;top:0;width:520px;background:#fbf9f4;z-index:99999;padding:8px';
  document.body.appendChild(host);
  const node = blk.render({ id: 'fixture', criteria: crit, values, data: { sources: {} } });
  host.appendChild(node);
  // The drawer's block stylesheets (ledger.css) are injected when the drawer code first loads, which is on demand since MC-PERF
  // (the manifest is no longer imported at page load), so wait for them as the drawer itself does before reading computed styles.
  await Promise.all(Array.from(document.querySelectorAll('link[data-injected-by="drawer-block"]')).filter((l) => !l.sheet)
    .map((l) => new Promise((done) => { l.addEventListener('load', done, { once: true }); l.addEventListener('error', done, { once: true }); setTimeout(done, 3000); })));
  const rows = Array.from(host.querySelectorAll('ul.ledger > li')).map((li) => ({
    gap: li.classList.contains('gap'), name: li.querySelector('.nm').innerText, value: li.querySelector('.vv').innerText.replace(/\\s+/g, ' ').trim(),
    sb: li.querySelector('.sb').innerText.replace(/\\s+/g, ' ').trim(), hasTraj: !!li.querySelector('.traj'),
    trajSvg: !!li.querySelector('.traj svg.dir-ico'), trajNa: li.querySelector('.traj-na') ? li.querySelector('.traj-na').innerText : '',
    leaderStyle: getComputedStyle(li.querySelector('.nm'), '::after').borderBottomStyle,
    vvColor: getComputedStyle(li.querySelector('.vv')).color, vvStyle: getComputedStyle(li.querySelector('.vv')).fontStyle,
  }));
  const all = host.innerText;
  host.remove();
  return { rows, all };
}"""
