#!/usr/bin/env /usr/bin/python3
"""Framework-discipline scan over RENDERED text (what a visitor can read), not the source.

PORTED from upgrade-2026-10/design/final-assets/tools/discipline.py (that tool scans the mockup; this one takes a list of
rendered texts so the suite can feed it pages and states). Extended per the 2026-10-05 review: besides visible text it
scans the text of every <option> and the attributes alt, title, aria-label and placeholder with the same banned rules.

Library use:
    scan(items) -> report
        items: list of dicts {"where": "home:initial", "kind": "text|option|alt|title|aria-label|placeholder|html", "text": "..."}
        `html` items are scanned only for glyphs, e-mail addresses and mailto:/tel: links.
    collect_js        JS function (string) for page.evaluate that returns the items of the current DOM state

CLI (self-contained check of a text file or of a fixture HTML file via Playwright):
    /usr/bin/python3 discipline.py --html FILE [--html FILE ...]
    exit 1 when anything is unallowed.
"""
import re
import sys
from collections import Counter

# Concept words: the framework discusses them (negated, or on the methodology page deeper.html). Label words: never allowed
# as a description of a region or a value, outside an allow-listed idiom or negation.
BAN_CONCEPT = r"composite|scores?|scored|scoring|weights?|weighted|ranks?|ranked|ranking|rankings|totals?|sums?"
BAN_LABEL = (r"best|top|ideal|winner|leading|premier|candidates?|siting|apocalypse|densest|strongest|safest|cheapest|richest|"
             r"hardest|stars?|medals?|podium|find land|site shopping|shopping|held by")
BAN = re.compile(r"\b(%s|%s)\b" % (BAN_CONCEPT, BAN_LABEL), re.I)
CONCEPT = re.compile(r"^(%s)$" % BAN_CONCEPT, re.I)
METHODOLOGY_PAGES = ("/deeper.html",)      # the methodology page may DISCUSS the concept words (never the label words)

# A hit is allowed only inside one of these phrases: negations, the native water-stress unit, the quoted deeper.html tension,
# an idiom. Every entry is a phrase a reviewer can read; add new ones only with a reason.
ALLOW = re.compile("|".join([
    r"(never|no|not|nothing is|nothing here is|neither|without|still builds no|not the same as a livability|nor|doesn.t|does not)\W+(\w+\W+){0,3}(scores?|scored|ranks?|ranked|composite|totals?|rankings?|weights?|weighted|sums?|stars?)",
    r"\bnever (scores|score|scored|ranked)\b",
    r"\d\s?score\b",                                   # the native water-stress unit: "0.3 score"
    r"water stress score", r"stress score", r"acceptable score", r"scores \d",
    r"composite score", r"livability composite", r"feasibility composite", r"Composite scores",
    r"on top of a community", r"total row or column", r"One table, no totals", r"scores, ranks",
    r"scored, ranked", r"never score or rank", r"never scores", r"filters, never scores", r"nothing is scored",
    r"no totals", r"no weights", r"no rank", r"no ranking",
    r"best[- ]available", r"best made", r"census totals", r"zone weighted", r"area[- ]weighted", r"shift weight", r"relationship with weight",
    # Added 2026-10-05 (wave-5 fix): factual native-unit and tenure phrasing from the verified data text. None of these scores,
    # ranks or sums criteria: statistical-method adjectives, population counts, and tenure statements.
    r"(depth|population|sale|area|zone)[- ]weighted", r"layers weighted \d", r"\(weighted;", r"base-\d{4} weights", r"ha weight\)",
    r"(county|comarcas?) total \d", r"; total \d", r"the total is [+-]", r"state.s total", r"total floor area",
    r"\bsum of the \d+ communes", r"estimates sum to \d",
    r"seven-rank pre-emption", r"premier of new brunswick",
    r"\b(is|are|commons|easements|land|votes|water|supply) held by\b",
    # Added 2026-10-05 (wave-7 fix, MC-REGION-PAGE): the region pages now print the legal pathway in full. These are statutory
    # phrasings (tenure holder, regulated-holdings threshold, the Romanian seven-rank pre-emption queue, the fallback sale
    # rule). None scores, ranks or sums regions or criteria.
    r"\b(may be|be|easement|abstraction|in Land,) held by\b", r"total (holdings|aggregate alien)", r"\brank (I|II|III|IV|V|VI|VII)\b",
    r"if no candidate meets",
]), re.I)

GLYPHS = {
    "star": re.compile("[★☆⭐✩✭✯]"),
    "medal": re.compile("[\U0001F947\U0001F948\U0001F949\U0001F3C6\U0001F3C5]"),
    "comparison": re.compile("[≤≥]|<=|>="),
    "arrow": re.compile("[←-⇿⟵-⟹⬅-⬇]"),
    "check": re.compile("[✓✔✗✘]"),
}
EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
CONTACT = re.compile(r"mailto:|tel:", re.I)
SORT_CONTROL = re.compile(r"\b(sort(ed|ing)?( by)?|order by|rank by)\b", re.I)

# In-page collector: visible text, option text, and the attributes covered by the review addition.
collect_js = r"""
() => {
  const items = [];
  const vis = (e) => !!(e.getClientRects().length) && getComputedStyle(e).visibility !== 'hidden';
  items.push({kind: 'text', text: document.body.innerText || ''});
  document.querySelectorAll('option').forEach(o => items.push({kind: 'option', text: (o.textContent || '').trim()}));
  for (const attr of ['alt', 'title', 'aria-label', 'placeholder']) {
    document.querySelectorAll('[' + attr + ']').forEach(e => { const v = (e.getAttribute(attr) || '').trim(); if (v) items.push({kind: attr, text: v}); });
  }
  const clone = document.documentElement.cloneNode(true);
  clone.querySelectorAll('script, style').forEach(n => n.remove());
  items.push({kind: 'html', text: clone.outerHTML});
  const sorts = [];
  document.querySelectorAll('select, button, [role=button], [role=combobox], label').forEach(e => {
    const t = ((e.getAttribute('aria-label') || '') + ' ' + (e.textContent || '')).trim();
    if (t) sorts.push(t.slice(0, 120));
  });
  items.push({kind: 'controls', text: sorts.join('\n')});
  return items;
}
"""


def _ctx(text, m, before=48, after=40):
    return text[max(0, m.start() - before): m.end() + after].replace("\n", " ")


def scan(items, extra_allow=None, methodology_pages=METHODOLOGY_PAGES):
    """Return {"bad": [...], "allowed": Counter, "glyphs": [...], "emails": [...], "contact": [...], "sort_controls": [...]}.
    Each bad entry: {where, kind, word, context}."""
    allow = ALLOW if not extra_allow else re.compile(ALLOW.pattern + "|" + "|".join(extra_allow), re.I)
    bad, allowed = [], Counter()
    glyphs, emails, contact, sorts = [], [], [], []
    for it in items:
        where, kind, text = it.get("where", ""), it.get("kind", "text"), it.get("text", "") or ""
        if kind == "html":
            for g, rx in GLYPHS.items():
                for m in rx.finditer(text):
                    glyphs.append({"where": where, "glyph": g, "char": m.group(0), "context": _ctx(text, m, 24, 24)})
            for m in EMAIL.finditer(text):
                if not re.search(r"@(\d|[0-9a-f]{6,})", m.group(0)) and "@context" not in m.group(0):
                    emails.append({"where": where, "match": m.group(0)})
            for m in CONTACT.finditer(text):
                contact.append({"where": where, "match": m.group(0)})
            continue
        if kind == "controls":
            for m in SORT_CONTROL.finditer(text):
                sorts.append({"where": where, "context": _ctx(text, m)})
            continue
        for m in BAN.finditer(text):
            ctx = _ctx(text, m)
            if allow.search(ctx):
                allowed[m.group(0).lower()] += 1
            elif CONCEPT.match(m.group(0)) and where.startswith(tuple(methodology_pages)):
                allowed[m.group(0).lower()] += 1
            else:
                bad.append({"where": where, "kind": kind, "word": m.group(0).lower(), "context": ctx})
        if kind == "text":
            for g, rx in GLYPHS.items():
                for m in rx.finditer(text):
                    glyphs.append({"where": where, "glyph": g, "char": m.group(0), "context": _ctx(text, m, 24, 24)})
    return {"bad": bad, "allowed": dict(allowed), "glyphs": glyphs, "emails": emails, "contact": contact, "sort_controls": sorts}


def is_clean(rep):
    return not (rep["bad"] or rep["glyphs"] or rep["emails"] or rep["contact"] or rep["sort_controls"])


def main(argv):
    import argparse
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--html", action="append", default=[], help="a local HTML file to render and scan (repeatable)")
    a = ap.parse_args(argv)
    if not a.html:
        ap.error("pass at least one --html FILE")
    from playwright.sync_api import sync_playwright
    items = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        for f in a.html:
            pg = b.new_page(viewport={"width": 1280, "height": 900})
            pg.goto("file://" + f)
            pg.wait_for_timeout(300)
            for it in pg.evaluate(collect_js):
                it["where"] = f
                items.append(it)
            pg.close()
        b.close()
    rep = scan(items)
    for k in ("bad", "glyphs", "emails", "contact", "sort_controls"):
        print("%s: %s" % (k, rep[k]))
    print("allowed hits:", rep["allowed"])
    return 0 if is_clean(rep) else 1


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
