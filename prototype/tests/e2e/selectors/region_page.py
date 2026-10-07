"""Selectors, constants and page scripts for the region-page suite (suites/test_region_page.py). Owned by MC-REGION-PAGE.
Loaded by file path through lib/sel.py (this directory has no __init__.py on purpose)."""

SEL = {
    "skip": ".skip-link",
    "rail": "#rct-rail",
    "rail_links": "#rct-rail nav a",
    "main": "main#main",
    "article": "article.rp",
    "wave": "article.rp > .wave",
    "art": "article.rp > .rp-art",
    "crumbs": "nav.crumbs",
    "salutation": "p.salutation.lg",
    "h1": "article.rp h1",
    "meta": ".rp-in > .meta",
    "lede": "p.rp-lede",
    "grid": ".rp-grid",
    "main_col": ".rp-grid > .rp-main",
    "offers": "aside.offers",
    "ledger": "aside.offers ul.ledger",
    "ledger_rows": "aside.offers ul.ledger > li",
    "cta": "aside.offers a.cta",
    "land_standing": ".drawer-land-standing",
    "consent": ".ls-consent",
    "refusal": "section.refusal",
    "asks": "section.rp-asks",
    "place": ".place-strip",
    "place_caption": ".place-caption",
    "way": "section.way",
    "ctx": "section.ctx",
    "v1": "section.v1-section",
    "v1_grid": ".v1-grid",
    "v1_chip": ".v1-chip",
    "regions_nav": "nav.rp-regions",
    "regions_list": "nav.rp-regions ul.region-nav",
    "colophon": "footer.colophon",
}

# The rail, in order: (numeral line, name).
RAIL = [
    ("01 · People", "Community Compass"),
    ("02 · The Field", "The Living Atlas"),
    ("03 · The Ground", "Land Selection"),
    ("04 · The Holding", "Who Holds This"),
    ("05 · The Movement", "Nomad Trail"),
    ("00 · The Other Beginning", "Community Commons"),
]

NO_REVIEW = "No nation or community named here has reviewed this entry."
PLACE_CAPTION = ("Ecoregions: RESOLVE Ecoregions 2017 (CC BY 4.0), computed within 100 km of the region's reference point, not its "
                 "footprint. Watershed named from the region dossier and checked against Natural Earth rivers.")
PRICE_WORDS = r"affordab|cheap|price|bargain"
V1_HEADING = "Where legal and cost questions come first"
OLD_V1_HEADING = "The first gate, legal and cost"
CTA_TEXT = "Pin this region and set your thresholds"
# Raw enum tokens the per-jurisdiction layers carry; none may ever be printed in the grid (the grid prints words).
RAW_TOKENS = ["cheapest", "very_premium", "very_high", "very_low", "rising_fast", "aging_fast", "net_in", "net_out", "none_documented",
              "legacy_industrial", "legacy_mining", "legacy_agriculture", "public_utility", "private_corporate", "community_commons",
              "moderate_high", "low_data", "forest_canopy", "unknown", "passes", "fails"]
# Strings from the pre-upgrade page and the old live defects that must not come back.
BANNED_STRINGS = ["A project of The Collective", "Eight criteria", "eight criteria across", "twenty regions", "twenty-regions",
                  "The first gate", "decisive constraints", "badge-"]

# Facts from the data, computed in Node (never typed here): region order, continents, build id, criteria count.
NODE_FACTS = r"""
import { regions, criteria } from './data/regions.js';
import { buildId, countWord } from './data/site-facts.js';
process.stdout.write(JSON.stringify({
  regions: regions.map((r) => ({ id: r.id, name: r.name, country: r.country, continent: r.continent, accent: r.accent, blurb: r.blurb })),
  criteria: criteria.map((c) => ({ id: c.id, name: c.name, source: c.source })),
  criteriaWord: countWord(criteria.length),
  buildId,
}));
"""

# Page facts used by several checks: structure, scripts, inline styles, focus order.
JS_FACTS = r"""() => {
  const sel = (s) => document.querySelector(s);
  const body = document.body;
  const rail = document.getElementById('rct-rail');
  const skip = sel('.skip-link');
  const scripts = Array.from(document.querySelectorAll('script')).map(s => ({ src: s.getAttribute('src'), type: s.getAttribute('type'), len: (s.textContent || '').length }));
  const nums = Array.from(document.querySelectorAll('#rct-rail nav a .rct-num')).map(e => e.textContent.trim());
  const firstFocusable = Array.from(body.querySelectorAll('a[href], button, input, select, textarea, [tabindex]')).find(e => !e.matches('[tabindex="-1"]'));
  const attr = (e, a) => (e ? e.getAttribute(a) : null);
  const h1 = sel('article.rp h1');
  const firstP = h1 ? Array.from(document.querySelectorAll('p')).find(p => (h1.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_FOLLOWING)) : null;
  const cta = sel('aside.offers a.cta');
  return {
    h1: Array.from(document.querySelectorAll('h1')).map(h => h.textContent.trim()),
    styleTags: document.querySelectorAll('style').length,
    inlineStyleAttrs: Array.from(document.querySelectorAll('[style]')).map(e => e.tagName.toLowerCase() + ':' + e.getAttribute('style').slice(0, 60)),
    scripts,
    railNums: nums,
    skipBeforeRail: !!(skip && rail && (skip.compareDocumentPosition(rail) & Node.DOCUMENT_POSITION_FOLLOWING)),
    skipIsFirstFocusable: !!(skip && firstFocusable === skip),
    skipIsFirstBodyChild: !!(skip && body.firstElementChild === skip),
    overflowX: Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth),
    placeStrips: document.querySelectorAll('.place-strip').length,
    placeCaptions: Array.from(document.querySelectorAll('.place-caption')).map(e => e.textContent.trim()),
    consent: document.querySelectorAll('.ls-consent').length,
    refusal: document.querySelectorAll('.refusal').length,
    olInRegionsNav: document.querySelectorAll('nav.rp-regions ol').length,
    imgsInRegionsNav: document.querySelectorAll('nav.rp-regions img, nav.rp-regions svg').length,
    regionLinks: Array.from(document.querySelectorAll('nav.rp-regions ul.region-nav li')).map(li => ({ href: attr(li.querySelector('a'), 'href'), current: li.classList.contains('current'), text: li.textContent.trim().replace(/\s+/g, ' ') })),
    cta: attr(cta, 'href'),
    ctaText: cta ? cta.textContent.trim() : null,
    ledgerRows: document.querySelectorAll('aside.offers ul.ledger > li').length,
    gapRows: document.querySelectorAll('aside.offers ul.ledger > li.gap').length,
    headings: Array.from(document.querySelectorAll('h1,h2,h3,h4,h5,h6')).map(h => +h.tagName[1]),
    v1Heading: sel('section.v1-section > h2') ? sel('section.v1-section > h2').textContent : null,
    v1Text: sel('section.v1-section') ? sel('section.v1-section').innerText : '',
    firstPAfterH1: firstP ? firstP.textContent.trim() : null,
    externalLinksWithoutRel: Array.from(document.querySelectorAll('a[target="_blank"]')).filter(a => !/noopener/.test(a.getAttribute('rel') || '')).length,
    mailtos: document.querySelectorAll('a[href^="mailto:"], a[href^="tel:"]').length,
  };
}"""

# No element that carries text may be faded: opacity is never used on text. The drawn art (svg only) is the one thing that is.
JS_OPACITY = r"""() => {
  const bad = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const seen = new Set();
  while (walker.nextNode()) {
    const t = walker.currentNode; if (!t.textContent.trim()) continue;
    const el = t.parentElement; if (!el || seen.has(el)) continue; seen.add(el);
    if (el.closest('svg')) continue;
    let o = 1, n = el;
    while (n && n.nodeType === 1) { o *= parseFloat(getComputedStyle(n).opacity); n = n.parentElement; }
    if (o < 0.999) bad.push({ tag: el.tagName.toLowerCase(), cls: String(el.className).slice(0, 40), opacity: +o.toFixed(2), text: t.textContent.trim().slice(0, 30) });
  }
  return bad.slice(0, 10);
}"""

# Layout of the two-column body: columns, order, sticky.
JS_LAYOUT = r"""() => {
  const grid = document.querySelector('.rp-grid'), main = document.querySelector('.rp-main'), off = document.querySelector('.offers');
  if (!grid || !main || !off) return null;
  const gs = getComputedStyle(grid);
  const cols = gs.gridTemplateColumns.split(' ').map(parseFloat).filter(x => !isNaN(x));
  const mr = main.getBoundingClientRect(), orr = off.getBoundingClientRect();
  const asks = document.querySelector('.rp-asks'), ledger = document.querySelector('.offers .ledger');
  const art = document.querySelector('.rp-art'), wave = document.querySelector('article.rp > .wave'), h1 = document.querySelector('article.rp h1');
  const ar = art ? art.getBoundingClientRect() : null, h1r = h1 ? h1.getBoundingClientRect() : null;
  const cs = (e, p) => (e ? getComputedStyle(e)[p] : null);
  return {
    cols, ratio: cols.length === 2 ? +(cols[0] / cols[1]).toFixed(3) : null,
    mainLeft: Math.round(mr.left), mainTop: Math.round(mr.top + scrollY), offLeft: Math.round(orr.left), offTop: Math.round(orr.top + scrollY),
    mainBeforeOffers: !!(main.compareDocumentPosition(off) & Node.DOCUMENT_POSITION_FOLLOWING),
    asksBeforeLedger: !!(asks && ledger && (asks.compareDocumentPosition(ledger) & Node.DOCUMENT_POSITION_FOLLOWING)),
    offersPosition: getComputedStyle(off).position, offersTop: getComputedStyle(off).top,
    waveHeight: wave ? Math.round(wave.getBoundingClientRect().height) : null,
    artOpacity: cs(art, 'opacity'), artColour: cs(art, 'color'), artWidth: ar ? Math.round(ar.width) : null,
    h1Font: cs(h1, 'fontFamily'), h1Weight: cs(h1, 'fontWeight'), h1Size: cs(h1, 'fontSize'), h1MaxWidth: cs(h1, 'maxWidth'), h1Var: cs(h1, 'fontVariationSettings'),
    h1Right: h1r ? Math.round(h1r.right) : null,
    waveBg: cs(wave, 'backgroundColor'),
  };
}"""

# Everything that sticks out past the viewport, ignoring the clipped drawn art.
JS_OVERFLOW = r"""() => {
  const vw = document.documentElement.clientWidth, bad = [];
  document.querySelectorAll('main *, footer *').forEach(e => {
    if (e.closest('.rp-art, .art, svg, .sr-only')) return;
    const r = e.getBoundingClientRect(); if (!r.width || !r.height) return;
    const cs = getComputedStyle(e); if (cs.position === 'fixed' || cs.visibility === 'hidden') return;
    if (r.right > vw + 1 || r.left < -1) bad.push({ tag: e.tagName.toLowerCase(), cls: String(e.className).slice(0, 40), right: Math.round(r.right), left: Math.round(r.left) });
  });
  return { vw, bad: bad.slice(0, 8), n: bad.length };
}"""

# Every outlined chip in the V1 grid: its resolved colours and its drawn shape. Neutral means one colour set for all of them.
JS_CHIPS = r"""() => {
  return Array.from(document.querySelectorAll('.v1-grid .v1-chip')).map(c => {
    const cs = getComputedStyle(c), b = getComputedStyle(c, '::before');
    return {
      text: c.textContent.trim(), shape: c.getAttribute('data-shape'), cls: c.className,
      color: cs.color, border: cs.borderTopColor, borderWidth: cs.borderTopWidth, borderStyle: cs.borderTopStyle, bg: cs.backgroundColor,
      beforeContent: b.content, beforeW: b.width, beforeH: b.height, beforeBg: b.backgroundColor, beforeBorder: b.borderTopWidth, beforeBorderColor: b.borderTopColor,
    };
  });
}"""

# Largest contentful paint: observe (buffered) until the browser has reported one, give it a moment to settle, then read the last candidate.
JS_LCP = r"""() => new Promise((resolve) => {
  let last = null, tries = 0;
  try {
    const po = new PerformanceObserver((l) => { for (const e of l.getEntries()) last = e; });
    po.observe({ type: 'largest-contentful-paint', buffered: true });
    const tick = () => {
      if (last || tries++ > 40) setTimeout(() => { po.disconnect(); resolve(last ? { t: Math.round(last.startTime), tag: last.element ? last.element.tagName.toLowerCase() : null, cls: last.element ? String(last.element.className).slice(0, 40) : null } : null); }, 300);
      else setTimeout(tick, 100);
    };
    tick();
  } catch (e) { resolve(null); }
})"""
