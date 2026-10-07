#!/usr/bin/env /usr/bin/python3
"""css_coverage.py (MC-CSS-CLEANUP): coverage-proven single definition per class.

    css_coverage.py --port N --site DIR [--report OUT.json] [--static-only] [--only SUBSTR[,SUBSTR]] [--skip-dead-check]
    css_coverage.py --port N --site DIR --fingerprint OUT.json.gz [--compare BEFORE.json.gz --want-out WANT.json]
    css_coverage.py --port N --site DIR --want WANT.json --fingerprint OUT.json.gz [--compare BEFORE.json.gz --summary-out S.json]

What it does, against the stylesheets of --site (DIR/src/styles/*.css, served on --port by the harness' own static server):

  1. COVERAGE. Drives Chromium through every state (home: every snapshot state, the drawer of EVERY region, compare, the signup
     modal displayed only, every layer panel state and the map-compare control, sliders, qualitative filters, guided chips, mobile and
     desktop, print emulation, dark scheme; every generated region page; deeper, arrive, host, terms-of-arrival with print emulation)
     and records, per style rule, whether its selector matched an element in ANY state. Two independent signals are unioned:
       * Chromium's own rule-usage tracking (CDP CSS.startRuleUsageTracking), which sees transient DOM and exact media/pseudo state;
       * a selector probe (document.querySelector, shadow roots included) on the selector with pseudo-elements and dynamic
         pseudo-classes stripped (:hover, :focus-visible, ::before ...), media conditions ignored, run at every checkpoint.
     A rule is DEAD only when neither signal ever saw it. Vendor-prefixed rules (-webkit-, -moz-) are never dead (other engines).
     Rules that need a state no test may create (the signup status after a submit) are listed in KEEP with the reason.
  2. DUPLICATES. Any selector defined in two files with the same at-rule context (media variants are the allow-list: the same selector
     under a different @media / @supports is a variant, not a duplicate) is reported; KEEP_DUP lists the few intended ones.
  3. BREAKPOINTS. Every (min|max)-width media query must use one of 390 / 768 / 1280 / 1920 (as 389 / 767 / 1279 / 1919 for max-width)
     or 899 / 900 for the rail.
  4. PAYLOAD. gzip -9 of the concatenated stylesheets linked by DIR/index.html (the home page set) must be at most 30 KB.
  5. FINGERPRINT. --fingerprint hashes, at every checkpoint, the computed style of EVERY element (all longhands, sorted, except
     animation* / transition* and the custom properties this WP deletes or moves; ::before/::after when they generate content).
     --compare BEFORE diffs the hashes and (--want-out) lists the changed element indexes. A second pass, run on BOTH sites with
     --want (those indexes), stores their full computed styles; --compare then classifies each property difference as INTENDED (the
     list in this file, each with its reason) or UNEXPLAINED, and exits 1 on any UNEXPLAINED. The three-run recipe is in
     upgrade-2026-10/verify/wp/MC-CSS-CLEANUP.md.

Exit 0 = every check passed; 1 = a check failed (the report says which); 2 = usage / harness error. Only --port is ever bound.
Never submits a form: it adds a CSS class to the status element only (a pure class toggle) to reach the status states.
"""
import argparse
import bisect
import collections
import gzip
import json
import os
import re
import sys
import time
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))
PROTO = E2E.parent.parent
ROOT = PROTO.parent

CANON_MAX = {389, 767, 899, 900, 1279, 1919}
CANON_MIN = {390, 768, 900, 1280, 1920}
GZIP_BUDGET = 30 * 1024

# Rules that can only match in a state no test may create. [selector regex, reason]
KEEP = [
    (r"^\.modal-status\.(error|success)$|^\.form-status\.(error|success)$",
     "the signup status after a submit: the harness never submits (a class toggle reaches it, but the rule is kept for the real state)"),
]
# Same selector + same context in two files that is intended. [selector, files, reason]
KEEP_DUP = [
    (":root", {"theme-gate.css", "tokens.css"},
     "design decision D10: the light-only gate is a separate file ONLY MC-A11Y may remove, and it must override tokens.css's color-scheme"),
    (':root:not([data-theme="light"])', {"theme-gate.css", "tokens.css"},
     "the same gate for browsers without light-dark(): it restates the light values after tokens.css's generated fallback"),
]

# Computed-style differences that ARE the cleanup, each with its reason. [name, state regex, element regex, property regex, reason].
# Everything else a before/after comparison finds is UNEXPLAINED and fails the comparison. Custom properties --pass, --fail and --ripple
# are not hashed at all (deleted / moved on purpose, see JS_FP).
INTENDED = [
    ("boundary-768", r"-768$", r".", r".",
     "max-width 768 became max-width 767 (the 390/768/1280/1920 scale): at exactly 768 px the tablet rules now apply, not the phone rules"),
    ("print-black-on-white", r"-print(-390)?$", r"^(html|body)(\.|$)|.", r"^(::(before|after) )?(color|background-color)$",
     "html and body are black on white in print on EVERY page (base.css; before: print.css for the home page and terms.css only)"),
    ("skip-link-one-definition", r"^region-", r"^a\.skip-link$", r".",
     "one .skip-link definition (base.css, the a11y.css version): on region pages its font stack and line-height follow it; it is off-screen until focused"),
    ("sr-only-one-definition", r"^region-", r"sr-only", r"^clip-path$",
     "one .sr-only definition (base.css): the region page's extra clip-path: inset(50%) on the visually hidden text is gone"),
    ("hidden-bar-mark-colour", r"^home-", r"^span\.bar-mark\.sr-only$", r"^color$",
     "visually hidden text of a filtered-out bar row: the legacy pin to --ink (a fade compensation) is gone; nothing is painted"),
]

SKIP_TAGS = {"SCRIPT", "STYLE", "LINK", "NOSCRIPT", "TEMPLATE", "META", "TITLE", "HEAD", "BASE"}


# ------------------------------------------------------------------------------------------------------------------ CSS parser
def find_close(t, i):
    depth = 0
    n = len(t)
    while i < n:
        c = t[i]
        if c == "/" and t.startswith("/*", i):
            j = t.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "\"'":
            q = c
            i += 1
            while i < n and t[i] != q:
                if t[i] == "\\":
                    i += 1
                i += 1
            i += 1
            continue
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    return n - 1


def find_prelude_end(t, i):
    n = len(t)
    par = 0
    while i < n:
        c = t[i]
        if c == "/" and t.startswith("/*", i):
            j = t.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "\"'":
            q = c
            i += 1
            while i < n and t[i] != q:
                if t[i] == "\\":
                    i += 1
                i += 1
            i += 1
            continue
        if c in "([":
            par += 1
        elif c in ")]":
            par -= 1
        elif c in "{;" and par <= 0:
            return i
        i += 1
    return n


def skip_ws(t, i):
    n = len(t)
    while i < n:
        if t[i].isspace():
            i += 1
        elif t.startswith("/*", i):
            j = t.find("*/", i + 2)
            i = n if j < 0 else j + 2
        else:
            break
    return i


def split_top(s, sep=","):
    out, cur, par, q, i = [], [], 0, None, 0
    while i < len(s):
        c = s[i]
        if q:
            cur.append(c)
            if c == "\\":
                i += 1
                cur.append(s[i])
            elif c == q:
                q = None
        elif c in "\"'":
            q = c
            cur.append(c)
        elif c in "([":
            par += 1
            cur.append(c)
        elif c in ")]":
            par -= 1
            cur.append(c)
        elif c == sep and par == 0:
            out.append("".join(cur))
            cur = []
        else:
            cur.append(c)
        i += 1
    out.append("".join(cur))
    return [x.strip() for x in out if x.strip()]


def parse(text, ctx=(), base=0, out=None):
    """Flat list of {kind: style|at|atleaf, sel, start, end, ctx, ...}; offsets absolute in `text`."""
    if out is None:
        out = []
    i, n = 0, len(text)
    while True:
        i = skip_ws(text, i)
        if i >= n:
            break
        if text[i] == "@":
            pe = find_prelude_end(text, i)
            prelude = text[i:pe].strip()
            if pe >= n or text[pe] == ";":
                out.append(dict(kind="atleaf", sel=prelude, start=base + i, end=base + pe, ctx=ctx))
                i = pe + 1
                continue
            ce = find_close(text, pe)
            name = re.match(r"@([\w-]+)", prelude).group(1).lower()
            if name in ("media", "supports", "layer", "container", "document", "scope"):
                parse(text[pe + 1:ce], ctx + (prelude,), base + pe + 1, out)
            else:
                out.append(dict(kind="at", name=name, sel=prelude, start=base + i, end=base + ce, ctx=ctx, body=text[pe + 1:ce]))
            i = ce + 1
        else:
            pe = find_prelude_end(text, i)
            if pe >= n:
                break
            if text[pe] == ";":
                i = pe + 1
                continue
            ce = find_close(text, pe)
            sel = re.sub(r"/\*.*?\*/", "", text[i:pe], flags=re.S).strip()
            out.append(dict(kind="style", sel=sel, start=base + i, end=base + ce, ctx=ctx, body=text[pe + 1:ce], sels=split_top(sel)))
            i = ce + 1
    return out


def norm(s):
    return re.sub(r"\s+", " ", s).strip()


def load_sheets(styles_dir):
    sheets = {}
    for f in sorted(Path(styles_dir).glob("*.css")):
        t = f.read_text("utf-8")
        sheets[f.name] = {"text": t, "items": parse(t)}
    return sheets


# ------------------------------------------------------------------------------------------------------- source corpus (orphans)
def source_corpus(site):
    """Text of every file that can put a class, id or data attribute on an element: pages, modules, generators."""
    files = list(Path(site).glob("*.html"))
    for sub in ("src", "lib", "api"):
        files += [p for p in (Path(site) / sub).rglob("*.js")]
    files += list((Path(site) / "data").glob("*.js"))
    files += list((PROTO / "scripts").glob("*.mjs")) + list((PROTO / "scripts").glob("*.js"))
    files += list((PROTO / "src").rglob("*.js"))
    seen, out = set(), []
    for p in files:
        if "vendor" in p.parts or p in seen:
            continue
        seen.add(p)
        try:
            out.append(p.read_text("utf-8", "ignore"))
        except Exception:
            pass
    return "\n".join(out)


def selector_tokens(sel):
    s = re.sub(r"\[[^\]]*\]", lambda m: " [" + (re.match(r"\[\s*([\w-]+)", m.group(0)).group(1) if re.match(r"\[\s*([\w-]+)", m.group(0)) else "") + "] ", sel)
    toks = [("class", x) for x in re.findall(r"\.([A-Za-z_][\w-]*)", s)] + [("id", x) for x in re.findall(r"#([A-Za-z_][\w-]*)", s)]
    toks += [("attr", x) for x in re.findall(r"\[([\w-]+)\]", s) if x.startswith("data-")]
    return toks


class Producible:
    """Can any source create an element with this class / id / data attribute? (word match in a class-ish context; generic words
    are matched loosely, which only ever keeps a rule)"""

    def __init__(self, corpus):
        self.c = corpus
        self.cache = {}

    def has(self, kind, name):
        k = (kind, name)
        if k in self.cache:
            return self.cache[k]
        n = re.escape(name)
        if kind == "attr":
            rx = r"(?<![\w-])" + n + r"(?![\w-])"
        elif kind == "id":
            rx = r"(?:\bid\s*[=:]\s*[\"'`]?[^\n\"'`]*|getElementById\(\s*[\"'`]|#)" + r"(?<![\w-])" + n + r"(?![\w-])"
        else:
            rx = (r"(?:class(?:Name)?\s*[=:]\s*[^\n;]*?|classList\.\w+\([^)\n]*?|\bcls\s*[=:]\s*[^\n;]*?|class=\s*[\"'][^\"'\n]*?|"
                  r"querySelector(?:All)?\(\s*[^)\n]*?\.|closest\(\s*[^)\n]*?\.|matches\(\s*[^)\n]*?\.)"
                  r"(?<![\w-])" + n + r"(?![\w-])")
        ok = re.search(rx, self.c) is not None
        if not ok and kind == "class":
            # a class assembled from parts (` + 'dot'`, template literals spanning lines): fall back to the bare quoted word
            ok = re.search(r"[\"'`](?:[^\"'`\n]* )?" + n + r"(?: [^\"'`\n]*)?[\"'`]", self.c) is not None and len(name) > 5
        self.cache[k] = ok
        return ok


# ---------------------------------------------------------------------------------------------------------- selector simplifier
PSEUDO_EL = re.compile(r"::?(?:before|after|first-line|first-letter)|::[\w-]+(?:\([^)]*\))?")
PSEUDO_DYN = re.compile(r":(?:hover|focus-visible|focus-within|focus|active|visited|target-within|target|-webkit-[\w-]+|-moz-[\w-]+)(?![\w-])")


def simplify(sel):
    """Selector with pseudo-elements and dynamic pseudo-classes removed, so querySelector can say 'some element matches'."""
    n = len(sel)
    q = None
    depth_br = 0            # strip only outside strings and attribute brackets
    s = sel
    res = []
    i = 0
    while i < n:
        c = s[i]
        if q:
            res.append(c)
            if c == "\\":
                i += 1
                res.append(s[i])
            elif c == q:
                q = None
            i += 1
            continue
        if c in "\"'":
            q = c
            res.append(c)
            i += 1
            continue
        if c == "[":
            depth_br += 1
        elif c == "]":
            depth_br -= 1
        if c == ":" and depth_br == 0:
            m = PSEUDO_EL.match(s, i) or PSEUDO_DYN.match(s, i)
            if m:
                i = m.end()
                continue
        res.append(c)
        i += 1
    r = "".join(res).strip()
    r = re.sub(r"([>+~])\s*$", r"\1 *", r)
    r = re.sub(r"^\s*([>+~])", r"* \1", r)
    r = re.sub(r"([>+~])\s*([>+~])", r"\1 * \2", r)
    r = re.sub(r"\(\s*\)", "(*)", r)
    if not r:
        r = "*"
    return r


def vendor_prefixed(sel):
    return bool(re.search(r"::?-(?:webkit|moz|ms|o)-", sel))


# ------------------------------------------------------------------------------------------------------------ static checks
def check_duplicates(sheets):
    by = collections.defaultdict(list)
    for fname, sh in sheets.items():
        for it in sh["items"]:
            if it["kind"] != "style":
                continue
            for s in it["sels"]:
                by[(norm(s), tuple(norm(c) for c in it["ctx"]))].append((fname, it["start"]))
    dups = []
    for (sel, ctx), v in sorted(by.items()):
        files = sorted({x[0] for x in v})
        if len(files) > 1:
            intended = any(sel == k[0] and set(files) <= set(k[1]) for k in KEEP_DUP)
            dups.append({"selector": sel, "ctx": list(ctx), "files": files, "allowed": intended})
    variants = sum(1 for (sel, ctx), v in by.items() if ctx and (sel, ()) in by)      # same selector, an at-rule variant of a base rule
    return dups, variants


def check_breakpoints(sheets):
    bad = []
    seen = collections.Counter()
    for fname, sh in sheets.items():
        for it in sh["items"]:
            if it["kind"] != "style":
                continue
            for c in it["ctx"]:
                if not c.startswith("@media"):
                    continue
                for kind, v in re.findall(r"\(\s*(min|max)-width\s*:\s*(\d+(?:\.\d+)?)px\s*\)", c):
                    v = int(float(v))
                    seen[(kind, v)] += 1
                    ok = (kind == "max" and v in CANON_MAX) or (kind == "min" and v in CANON_MIN)
                    if not ok:
                        bad.append({"file": fname, "query": norm(c), "value": "%s-width %d" % (kind, v)})
    return bad, {"%s-%d" % k: n for k, n in sorted(seen.items())}


def home_set(site):
    index = Path(site) / "index.html"
    html = index.read_text("utf-8")
    return [Path(m).name for m in re.findall(r"""href=["']\./src/styles/([\w.-]+\.css)""", html)] or \
           [Path(m).name for m in re.findall(r"""href=["']/?src/styles/([\w.-]+\.css)""", html)]


def gzip_size(styles_dir, names):
    blob = b"".join((Path(styles_dir) / n).read_bytes() for n in names if (Path(styles_dir) / n).is_file())
    return len(gzip.compress(blob, 9)), len(blob)


# ------------------------------------------------------------------------------------------------------------- browser JS
JS_PROBE = r"""
(sels) => {
  const scopes = [document];
  const walk = (root) => { for (const el of root.querySelectorAll('*')) if (el.shadowRoot) { scopes.push(el.shadowRoot); walk(el.shadowRoot); } };
  walk(document);
  const hit = [], bad = [];
  for (let i = 0; i < sels.length; i++) {
    const s = sels[i];
    if (s.indexOf(':host') >= 0) { if (scopes.length > 1) hit.push(i); continue; }
    try {
      for (const sc of scopes) { if (sc.querySelector(s)) { hit.push(i); break; } }
    } catch (e) { bad.push(i); }
  }
  return { hit, bad };
}
"""

JS_FP = r"""
(opts) => {
  const SKIP = new Set(opts.skip);
  // animation* / transition*: tokens.css (reduced motion) supersedes the a11y.css durations; --pass, --fail and --ripple are the custom
  // properties this WP deletes (--pass/--fail: legacy green and red) or moves (--ripple: from :root-in-cards.css to tokens.css)
  const excl = (p) => p.startsWith('animation') || p.startsWith('transition') || p === 'view-transition-name' || p === '--pass' || p === '--fail' || p === '--ripple';
  const MARK = new Set(['transform', 'transform-origin', 'perspective-origin', 'translate', 'top', 'left', 'right', 'bottom', 'inset', 'inset-block-start', 'inset-block-end', 'inset-inline-start', 'inset-inline-end', 'block-size', 'inline-size']);
  function h53(str) {
    let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761); h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }
  const els = [];
  const collect = (root, prefix) => {
    const all = root.querySelectorAll('*');
    for (const el of all) {
      if (SKIP.has(el.tagName)) continue;
      if (el.closest && root === document && el.closest('head')) continue;
      const cls = typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '');
      if (opts.nomap && root === document && el.id !== 'map' && el.closest('#map')) continue;     // the map's overlays are laid out by a timing-dependent placement pass
      if (/maplibregl-/.test(cls) && !el.closest('.region-marker') && !/region-marker/.test(cls)) continue;
      if (el.parentElement && el.parentElement.closest && el.parentElement.closest('.maplibregl-canvas-container, .maplibregl-control-container') && !/region-marker/.test(cls)) continue;
      els.push([el, prefix]);
      if (el.shadowRoot) collect(el.shadowRoot, prefix + 'shadow:');
    }
  };
  collect(document, '');
  const out = { d: [], h: [] };
  const full = opts.full ? {} : null;
  const want = opts.want ? new Set(opts.want) : null;
  els.forEach(([el, prefix], idx) => {
    const cls = (typeof el.className === 'string' ? el.className : (el.getAttribute('class') || '')).trim().split(/\s+/).filter(Boolean).sort().slice(0, 6).join('.');
    const desc = prefix + el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + (cls ? '.' + cls : '');
    const isMarker = /region-marker|maplibregl-marker/.test(el.getAttribute('class') || '');
    const cs = getComputedStyle(el);
    const rec = full && want && want.has(idx) ? {} : null;
    const pairs = [];
    for (let i = 0; i < cs.length; i++) {
      const p = cs[i];
      if (excl(p) || (isMarker && MARK.has(p))) continue;
      pairs.push(p + ':' + cs.getPropertyValue(p) + ';');
      if (rec) rec[p] = cs.getPropertyValue(p);
    }
    pairs.sort();
    let s = pairs.join('');
    for (const ps of ['::before', '::after']) {
      let pc; try { pc = getComputedStyle(el, ps); } catch (e) { continue; }
      const c = pc.getPropertyValue('content');
      if (c && c !== 'none' && c !== 'normal') {
        const pp = [];
        for (let i = 0; i < pc.length; i++) { const p = pc[i]; if (excl(p)) continue; pp.push(p + ':' + pc.getPropertyValue(p) + ';'); if (rec) rec[ps + ' ' + p] = pc.getPropertyValue(p); }
        pp.sort();
        s += ps + '{' + pp.join('') + '}';
      }
    }
    out.d.push(desc); out.h.push(h53(s));
    if (rec) full[idx] = rec;
  });
  if (full) out.full = full;
  return out;
}
"""


# ---------------------------------------------------------------------------------------------------------------- the run
class Collector:
    def __init__(self, sheets, site_root):
        self.sheets = sheets
        self.site = Path(site_root)
        self.rules = []          # flat list of dicts for style rules: file, idx, sels, simp
        self.by_file = {}
        for fname, sh in sheets.items():
            starts = []
            for it in sh["items"]:
                if it["kind"] != "style":
                    continue
                r = {"file": fname, "start": it["start"], "end": it["end"], "sel": it["sel"], "sels": it["sels"], "ctx": it["ctx"],
                     "simp": [simplify(s) for s in it["sels"]], "hit": set(), "css_used": False, "states": []}
                self.rules.append(r)
                starts.append(it["start"])
            self.by_file[fname] = ([r for r in self.rules if r["file"] == fname], starts)
        self.uniq = sorted({s for r in self.rules for s in r["simp"]})
        self.uidx = {s: i for i, s in enumerate(self.uniq)}
        self.unparsed = set()
        self.state_names = []
        self.fp = {}             # checkpoint -> {d: [...], h: [...]}
        self.errors = []

    def apply_probe(self, res, label):
        hit = set(res["hit"])
        for b in res["bad"]:
            self.unparsed.add(self.uniq[b])
        for r in self.rules:
            for s in r["simp"]:
                if self.uidx[s] in hit:
                    if not r["hit"]:
                        r["states"].append(label)
                    r["hit"].add(s)

    def apply_usage(self, usage, sid_url, label):
        for u in usage:
            if not u.get("used"):
                continue
            url = sid_url.get(u["styleSheetId"])
            if not url:
                continue
            fname = Path(re.sub(r"[?#].*$", "", url)).name
            if fname not in self.by_file:
                continue
            rules, starts = self.by_file[fname]
            k = bisect.bisect_right(starts, u["startOffset"]) - 1
            if k >= 0 and rules[k]["start"] <= u["startOffset"] <= rules[k]["end"]:
                if not (rules[k]["css_used"] or rules[k]["hit"]):
                    rules[k]["states"].append(label + " (cdp)")
                rules[k]["css_used"] = True


class Driver:
    def __init__(self, h, col, args):
        self.h = h
        self.col = col
        self.args = args
        self.only = [x for x in (args.only or "").split(",") if x]
        self.count = 0

    def want(self, name):
        wm = getattr(self.args, "want_map", None)
        if wm and not self.only:
            return any(k.split("/")[0] == name for k in wm)
        return not self.only or any(o in name for o in self.only)

    def probe(self, page, label):
        try:
            res = page.evaluate(JS_PROBE, self.col.uniq)
            self.col.apply_probe(res, label)
        except Exception as e:
            self.col.errors.append("probe %s: %s" % (label, str(e)[:160]))

    def fingerprint(self, page, label):
        try:
            page.evaluate("document.fonts && document.fonts.ready ? document.fonts.ready.then(() => 1) : 1")
        except Exception:
            pass
        try:
            want = self.args.want_map.get(label) if getattr(self.args, "want_map", None) else None
            opts = {"skip": sorted(SKIP_TAGS), "nomap": bool(getattr(self, "nomap", False))}
            if want:
                opts.update({"full": True, "want": want})
            fp = page.evaluate(JS_FP, opts)
            self.col.fp[label] = fp
        except Exception as e:
            self.col.errors.append("fingerprint %s: %s" % (label, str(e)[:160]))

    def checkpoint(self, page, label, fp=True):
        page.wait_for_timeout(120)
        self.probe(page, label)
        if fp and self.args.fingerprint:
            self.fingerprint(page, label)


def scenario(drv, name, path, width, fn=None, scheme="light", storage="default", media=None, theme=None, home=False, height=None,
             fp_main=True, settle=500, permissions=None, nomap=False):
    """Open `path` in a guarded session, track CSS usage, run fn(page, cp) and checkpoint the main state first."""
    if not drv.want(name):
        return
    from lib.site import default_storage, goto_settled
    h, col = drv.h, drv.col
    t0 = time.time()
    drv.nomap = nomap
    b = h.launch()
    st = None
    if storage == "default":
        st = default_storage(h.site, modal=False)
    elif storage == "modal":
        st = default_storage(h.site, modal=True)
    s = h.session(b, width=width, height=height, scheme=scheme, reduced_motion=True, storage=st, stub=True, freeze_date=True,
                  kill_motion=True, permissions=permissions)
    page = s.page()
    sid_url = {}
    cdp = None
    try:
        cdp = s.context.new_cdp_session(page)
        cdp.on("CSS.styleSheetAdded", lambda e: sid_url.__setitem__(e["header"]["styleSheetId"], e["header"].get("sourceURL", "")))
        cdp.send("DOM.enable")
        cdp.send("CSS.enable")
        cdp.send("CSS.startRuleUsageTracking")
        if media:
            page.emulate_media(media=media)
        if home:
            goto_settled(page, h.base + path, extra_ms=settle)
            try:   # the markers and the layer-compare control (a shadow root) are built after the map has loaded: wait for both, then for the label placement
                page.wait_for_function("(() => { const s = document.getElementById('map-ext-slot'); "
                                       "return document.querySelectorAll('#map .region-marker').length > 0 && (!s || !!s.shadowRoot); })()", timeout=8000)
                page.wait_for_timeout(500)
            except Exception:
                pass
        else:
            page.goto(h.base + path, wait_until="load", timeout=60000)
            page.wait_for_timeout(settle)
        if theme:
            page.evaluate("(t) => document.documentElement.setAttribute('data-theme', t)", theme)
            page.wait_for_timeout(150)
        # unfold every disclosure so its content is in the DOM (details are real states of the page)
        cp = lambda label, fp=True: drv.checkpoint(page, "%s/%s" % (name, label), fp=fp)
        cp("main", fp=fp_main)
        if fn:
            fn(page, cp)
        try:
            page.evaluate("document.querySelectorAll('details').forEach(d => d.open = true)")
            cp("details-open", fp=False)
        except Exception:
            pass
    except Exception as e:
        col.errors.append("%s: %s" % (name, str(e)[:300]))
    finally:
        try:
            if cdp:
                usage = cdp.send("CSS.stopRuleUsageTracking")["ruleUsage"]
                col.apply_usage(usage, sid_url, name)
        except Exception as e:
            col.errors.append("%s usage: %s" % (name, str(e)[:160]))
        s.close()
        h.close_browser(b)
    col.state_names.append(name)
    drv.count += 1
    print("  state %-34s %5.1fs" % (name, time.time() - t0), flush=True)


# ------------------------------------------------------------------------------------------------------------ scenario bodies
def drawer_all(page, cp):
    """Open the drawer of every region of both continents."""
    for cont in ("europe", "north-america"):
        try:
            page.locator('.continent-tab[data-continent="%s"]' % cont).click(timeout=4000)
            page.wait_for_timeout(500)
        except Exception:
            continue
        ids = page.evaluate("Array.from(document.querySelectorAll('.region-card[id^=region-]')).filter(c => c.getClientRects().length).map(c => c.id.slice(7))")
        for rid in ids:
            try:
                card = page.locator("#region-%s" % rid)
                card.focus()
                page.keyboard.press("Enter")
                page.wait_for_selector("#region-drawer.open, #region-drawer[aria-hidden=false]", timeout=5000, state="attached")
                page.wait_for_timeout(350)
                cp("drawer-%s" % rid)
                page.evaluate("(() => { const b = document.querySelector('#drawer-body'); if (b) b.scrollTop = b.scrollHeight; })()")
                page.keyboard.press("Escape")
                page.wait_for_timeout(250)
            except Exception as e:
                drv_err(page, "drawer %s: %s" % (rid, str(e)[:100]))


_ERRS = []


def drv_err(page, msg):
    _ERRS.append(msg)


def interact_home(page, cp):
    # sliders: each to its min then its max (dispatching input), so cards and bars take the filtered-out state
    n = page.evaluate("document.querySelectorAll('.criteria input[type=range]').length")
    for i in range(n):
        for which in ("min", "max"):
            try:
                page.evaluate("""([i, w]) => { const el = document.querySelectorAll('.criteria input[type=range]')[i];
                  el.value = w === 'min' ? el.min : el.max; el.dispatchEvent(new Event('input', {bubbles: true})); el.dispatchEvent(new Event('change', {bubbles: true})); }""", [i, which])
            except Exception:
                pass
        if i in (0, 3, n - 1):
            page.wait_for_timeout(150)
            cp("slider-%d" % i, fp=(i == 0))
    cp("sliders-extreme")
    # qualitative filters: take the first option that is not the first one, in every select
    try:
        page.evaluate("""() => { document.querySelectorAll('#qual-filters select').forEach(s => { if (s.options.length > 1) { s.selectedIndex = 1; s.dispatchEvent(new Event('change', {bubbles: true})); } }); }""")
        cp("qual-filters")
    except Exception:
        pass
    # reset
    try:
        page.locator("#reset-btn").click(timeout=3000)
        page.wait_for_timeout(300)
        cp("after-reset")
    except Exception:
        pass
    # guided and preset chips, one by one
    for sel, tag in (("#guided-chips .guided-chip", "guided"), ("#preset-chips .preset-chip", "preset")):
        try:
            cnt = page.locator(sel).count()
        except Exception:
            cnt = 0
        for i in range(cnt):
            try:
                page.locator(sel).nth(i).click(timeout=3000)
                page.wait_for_timeout(250)
                if i in (0, cnt - 1):
                    cp("%s-%d" % (tag, i), fp=(i == 0))
            except Exception:
                pass
    # pin a few cards (aria-pressed) then the summary table and share
    try:
        pins = page.locator(".region-card .region-pin")
        for i in range(min(3, pins.count())):
            pins.nth(i).click(timeout=3000)
        page.wait_for_timeout(250)
        cp("pins")
    except Exception:
        pass
    for sel in ("#share-btn", "#ns-share"):
        try:
            page.locator(sel).first.click(timeout=3000)
            page.wait_for_timeout(300)
            cp("share-%s" % sel.strip("#"), fp=False)
        except Exception:
            pass
    # hover and focus states of the controls the cleanup touched (a filtered-out card's Pin, a chip, a guided card, a layer row)
    try:
        page.evaluate("""() => { document.querySelectorAll('.criteria input[type=range]').forEach(el => { el.value = el.max; el.dispatchEvent(new Event('input', {bubbles: true})); }); }""")
        page.wait_for_timeout(300)
        for sel, label in ((".region-card.fail .region-pin", "hover-fail-pin"), (".region-card:not(.fail) .region-pin", "hover-pin"),
                           (".region-card .region-open", "hover-card"), ("#guided-chips .guided-chip", "hover-guided"),
                           ("#preset-chips .preset-chip", "hover-preset"), ("#shortlist-btn", "hover-pins-btn")):
            loc = page.locator(sel)
            if loc.count():
                loc.first.scroll_into_view_if_needed(timeout=2000)
                loc.first.hover(timeout=2000, force=True)
                page.wait_for_timeout(150)
                cp(label)
        loc = page.locator(".region-card.fail .region-pin")
        if loc.count():
            loc.first.click(timeout=2000, force=True)
            loc.first.hover(timeout=2000, force=True)
            page.wait_for_timeout(150)
            cp("hover-fail-pin-pressed")
    except Exception as e:
        drv_err(page, "hover pass: %s" % str(e)[:100])
    # keyboard focus: the first tab stops (skip link, rail), so :focus-visible styles are applied and fingerprinted
    try:
        page.evaluate("window.scrollTo(0, 0)")
        for i in range(3):
            page.keyboard.press("Tab")
            cp("focus-%d" % (i + 1))
    except Exception:
        pass


def layers_home(page, cp):
    try:
        page.evaluate("(() => { const b = document.querySelector('#layers-toggle'); if (b && b.getAttribute('aria-expanded') === 'false') b.click(); })()")
    except Exception:
        pass
    page.wait_for_timeout(300)
    cp("panel-open")
    # every group head toggled (collapsed then expanded)
    try:
        heads = page.locator("#map-toggles .map-toggle-group-label")
        for i in range(heads.count()):
            heads.nth(i).click(timeout=2000)
        page.wait_for_timeout(200)
        cp("groups-collapsed", fp=False)
        for i in range(heads.count()):
            heads.nth(i).click(timeout=2000)
        page.wait_for_timeout(200)
    except Exception:
        pass
    n = page.evaluate("document.querySelectorAll('#map-toggles button.map-toggle').length")
    for i in range(n):
        try:
            b = page.locator("#map-toggles button.map-toggle").nth(i)
            if not b.is_visible():
                continue
            b.scroll_into_view_if_needed()
            b.click(timeout=3000)
            page.wait_for_timeout(260)
            if i % 4 == 0:
                cp("layer-%d-on" % i, fp=(i % 8 == 0))
            else:
                drv_probe(page, cp, "layer-%d-on" % i)
        except Exception:
            pass
    cp("all-layers-on")
    for sel in ("#layers-clear", "#layers-defaults"):
        try:
            page.locator(sel).click(timeout=3000)
            page.wait_for_timeout(300)
            cp("after-%s" % sel.strip("#"), fp=False)
        except Exception:
            pass
    # markers: hover and focus the first two (label pill, aria states)
    try:
        ms = page.locator("#map .region-marker")
        for i in range(min(2, ms.count())):
            ms.nth(i).hover(timeout=3000, force=True)
            page.wait_for_timeout(200)
            ms.nth(i).focus()
        cp("marker-focus", fp=False)
        ms.nth(0).click(timeout=3000, force=True)
        page.wait_for_timeout(500)
        cp("marker-click", fp=False)
        page.keyboard.press("Escape")
    except Exception:
        pass


def drv_probe(page, cp, label):
    cp(label, fp=False)


def compare_control(page, cp):
    """The layer-compare extension lives in a shadow root on #map-ext-slot."""
    try:
        page.evaluate("(() => { const b = document.querySelector('#layers-toggle'); if (b && b.getAttribute('aria-expanded') === 'false') b.click(); })()")
        page.wait_for_timeout(300)
        page.locator("#map-ext-slot summary.mc-summary").click(timeout=4000)
        page.wait_for_timeout(300)
        cp("mc-open")
        pair = page.locator("#map-ext-slot button.mc-pair")
        if pair.count():
            pair.first.click(timeout=3000)
            page.wait_for_timeout(300)
            cp("mc-pair", fp=False)
        go = page.locator("#map-ext-slot button.mc-go")
        if go.count() and go.first.is_enabled():
            go.first.click(timeout=3000)
            page.wait_for_timeout(1500)
            cp("mc-active")
            try:
                page.evaluate("(() => { const d = document.getElementById('map-compare-divider'); if (d) { d.focus(); } })()")
                page.keyboard.press("ArrowLeft")
                page.wait_for_timeout(200)
                cp("mc-divider", fp=False)
            except Exception:
                pass
            ex = page.locator("#map-ext-slot button.mc-exit-panel, .mc-stage-exit")
            if ex.count():
                ex.first.click(timeout=3000, force=True)
                page.wait_for_timeout(300)
    except Exception as e:
        drv_err(page, "compare control: %s" % str(e)[:120])


def status_classes(page, cp):
    """Reach the signup status states without submitting: a class toggle on the status element only."""
    try:
        page.evaluate("""() => { window.__stat = ['#modal-status', '#form-status'].map(s => document.querySelector(s)).filter(Boolean); }""")
        for kind in ("error", "success", "pending", "loading"):
            page.evaluate("(k) => window.__stat.forEach(e => { e.className = e.className.replace(/\\b(error|success|pending|loading)\\b/g, '').trim() + ' ' + k; if (!e.textContent) e.textContent = 'status'; })", kind)
            cp("status-%s" % kind, fp=False)
    except Exception:
        pass


def modal_state(page, cp):
    try:
        page.locator("#modal-email").focus()
        cp("modal-focus", fp=False)
    except Exception:
        pass
    status_classes(page, cp)


def compare_pins(ids):
    return "/?pin=" + ",".join(ids)


def run_states(h, col, args):
    drv = Driver(h, col, args)
    from lib.snapshot import S as HS
    site = h.site
    print("states (%s):" % site, flush=True)
    regions = sorted(p.stem for p in (site / "region").glob("*.html")) if (site / "region").is_dir() else []
    # ---- home, desktop
    scenario(drv, "home-initial-1280", "/", 1280, fn=interact_home, home=True)
    scenario(drv, "home-initial-390", "/", 390, fn=interact_home, home=True)
    scenario(drv, "home-initial-768", "/", 768, home=True)
    scenario(drv, "home-initial-800", "/", 800, home=True)
    # 1920 x 1080: probed, NOT fingerprinted (SwiftShader draws that map slowly, so the markers and the layer-compare control appear at a
    # varying time: two runs of the SAME site differ by those 30 + 95 elements). The page below the map is fingerprinted at 1280.
    scenario(drv, "home-initial-1920", "/", 1920, home=True, height=1080, fp_main=False)
    scenario(drv, "home-fresh-1280", "/", 1280, storage="none", home=True, settle=2500)
    scenario(drv, "home-fresh-390", "/", 390, storage="none", home=True, settle=2500)
    scenario(drv, "home-modal-1280", "/?modal=1", 1280, storage="modal", home=True, fn=modal_state)
    scenario(drv, "home-modal-390", "/?modal=1", 390, storage="modal", home=True, fn=modal_state)
    scenario(drv, "home-drawers-1280", "/", 1280, fn=drawer_all, home=True, fp_main=False)
    scenario(drv, "home-drawers-390", "/", 390, fn=lambda p, cp: drawer_few(p, cp), home=True, fp_main=False)
    scenario(drv, "home-compare-3-1280", compare_pins(HS.COMPARE_PINS), 1280, home=True, fn=open_compare)
    scenario(drv, "home-compare-3-390", compare_pins(HS.COMPARE_PINS), 390, home=True, fn=open_compare)
    scenario(drv, "home-compare-8-1280", compare_pins(many_pins(site, 8)), 1280, home=True, fn=open_compare)
    scenario(drv, "home-na-tab-1280", "/", 1280, home=True, fn=na_tab)
    scenario(drv, "home-na-tab-390", "/", 390, home=True, fn=na_tab)
    scenario(drv, "home-filtered-1280", HS.FILTERED_LINK, 1280, home=True)
    scenario(drv, "home-filtered-390", HS.FILTERED_LINK, 390, home=True)
    scenario(drv, "home-layers-1280", "/", 1280, home=True, fn=layers_home, fp_main=False)
    scenario(drv, "home-layers-390", "/", 390, home=True, fn=layers_home, fp_main=False)
    scenario(drv, "home-map-compare-1280", "/", 1280, home=True, fn=compare_control, fp_main=False)
    scenario(drv, "home-map-compare-390", "/", 390, home=True, fn=compare_control, fp_main=False)
    scenario(drv, "home-print-1280", "/", 1280, home=True, media="print")
    scenario(drv, "home-print-390", "/", 390, home=True, media="print")
    scenario(drv, "home-dark-1280", "/", 1280, home=True, scheme="dark", fn=lambda p, cp: dark_drawer(p, cp))
    scenario(drv, "home-theme-dark-390", "/", 390, home=True, theme="dark")
    scenario(drv, "home-theme-light-1280", "/", 1280, home=True, theme="light")
    # ---- generated region pages
    for i, rid in enumerate(regions):
        scenario(drv, "region-%s-1280" % rid, "/region/%s.html" % rid, 1280, fp_main=True)
    for rid in regions[:: max(1, len(regions) // 4)]:
        scenario(drv, "region-%s-390" % rid, "/region/%s.html" % rid, 390)
        scenario(drv, "region-%s-print" % rid, "/region/%s.html" % rid, 1280, media="print")
    if regions:
        scenario(drv, "region-%s-dark" % regions[0], "/region/%s.html" % regions[0], 1280, scheme="dark")
        scenario(drv, "region-%s-768" % regions[0], "/region/%s.html" % regions[0], 768)
        scenario(drv, "region-%s-800" % regions[0], "/region/%s.html" % regions[0], 800)
        scenario(drv, "region-%s-1920" % regions[0], "/region/%s.html" % regions[0], 1920, height=1080)
    # ---- long reads
    for page_name in ("deeper", "arrive", "host", "terms-of-arrival"):
        if not (site / (page_name + ".html")).is_file():
            continue
        url = "/%s.html" % page_name
        scenario(drv, "%s-1280" % page_name, url, 1280)
        scenario(drv, "%s-390" % page_name, url, 390)
        scenario(drv, "%s-768" % page_name, url, 768)
        scenario(drv, "%s-800" % page_name, url, 800)
        scenario(drv, "%s-print" % page_name, url, 1280, media="print")
        scenario(drv, "%s-print-390" % page_name, url, 390, media="print")
        scenario(drv, "%s-dark" % page_name, url, 1280, scheme="dark")
        scenario(drv, "%s-theme-dark" % page_name, url, 1280, theme="dark")
    if _ERRS:
        col.errors.extend(_ERRS)
    return drv


def drawer_few(page, cp):
    for rid in ("alentejo", "kootenays", "oaxaca"):
        try:
            card = page.locator("#region-%s" % rid)
            if not card.count():
                continue
            card.focus()
            page.keyboard.press("Enter")
            page.wait_for_selector("#region-drawer.open, #region-drawer[aria-hidden=false]", timeout=5000, state="attached")
            page.wait_for_timeout(350)
            cp("drawer-%s" % rid)
            page.keyboard.press("Escape")
            page.wait_for_timeout(250)
        except Exception:
            pass


def dark_drawer(page, cp):
    try:
        card = page.locator("#region-alentejo")
        card.focus()
        page.keyboard.press("Enter")
        page.wait_for_selector("#region-drawer.open, #region-drawer[aria-hidden=false]", timeout=5000, state="attached")
        page.wait_for_timeout(350)
        cp("drawer-alentejo")
        page.keyboard.press("Escape")
    except Exception:
        pass


def open_compare(page, cp):
    try:
        page.locator("#shortlist-btn").click(timeout=4000)
        page.wait_for_selector("#compare-overlay.open", timeout=5000, state="attached")
        page.wait_for_timeout(500)
        cp("compare-open")
    except Exception as e:
        drv_err(page, "compare: %s" % str(e)[:100])


def na_tab(page, cp):
    try:
        page.locator('.continent-tab[data-continent="north-america"]').click(timeout=4000)
        page.wait_for_timeout(900)
        cp("na")
    except Exception:
        pass


def many_pins(site, n):
    ids = sorted(p.stem for p in (site / "region").glob("*.html"))
    return ids[:n] if ids else ["alentejo"]


# ------------------------------------------------------------------------------------------------------------ reporting
def rule_label(r):
    return "%s:%d  %s%s" % (r["file"], r["start"], norm(r["sel"])[:140], ("   in " + " / ".join(r["ctx"])) if r["ctx"] else "")


def orphan(rule, prod):
    """True when EVERY alternative of the selector list needs a class / id / data attribute no source can produce."""
    for s in rule["sels"]:
        toks = selector_tokens(s)
        if not toks:
            return False
        if all(prod.has(k, n) for k, n in toks):
            return False
    return True


def classify(col, prod=None):
    dead, kept, cond, ok = [], [], [], 0
    for r in col.rules:
        if r["hit"] or r["css_used"]:
            ok += 1
            continue
        if any(vendor_prefixed(s) for s in r["sels"]):
            kept.append((r, "vendor-prefixed (other engines)"))
            continue
        why = next((w for rx, w in KEEP if any(re.search(rx, norm(s)) for s in r["sels"])), None)
        if why:
            kept.append((r, why))
            continue
        if prod is not None and not orphan(r, prod):
            kept.append((r, "no test state reaches it, but a source can produce its element (data-dependent state)"))
            continue
        dead.append(r)
    return dead, kept, ok


def fingerprint_compare(before_path, after_fp):
    """-> (state_count, identical_states, diffs[list of (state, desc, n_elems)], structural[list]) comparing hashes."""
    with gzip.open(str(before_path), "rt") as f:
        before = json.load(f)
    diffs, structural, same = [], [], 0
    for state, a in sorted(after_fp.items()):
        b = before.get(state)
        if b is None:
            structural.append("state missing in before: %s" % state)
            continue
        if a["d"] != b["d"]:
            structural.append("DOM differs in %s (%d vs %d elements)" % (state, len(b["d"]), len(a["d"])))
            continue
        bad = [i for i in range(len(a["h"])) if a["h"][i] != b["h"][i]]
        if not bad:
            same += 1
        else:
            diffs.append((state, bad, a["d"]))
    for state in before:
        if state not in after_fp:
            structural.append("state missing in after: %s" % state)
    return len(after_fp), same, diffs, structural


COLOR_DERIVED = re.compile(r"(^|.* )(-webkit-text-fill-color|-webkit-text-stroke-color|border-.*-color|caret-color|column-rule-color|outline-color|"
                           r"text-decoration-color|text-emphasis-color)$")


def intended_for(state, desc, prop):
    st = state.split("/")[0]
    for name, srx, drx, prx, _why in INTENDED:
        if re.search(srx, st) and re.search(drx, desc) and re.search(prx, prop):
            return name
    return None


def full_diff(before_path, after_fp, summary_out=None):
    """When both fingerprint files carry `full` (a --want run), classify the property-level differences (colour properties that merely
    follow `color` are folded into it). Returns the number of UNEXPLAINED differences."""
    with gzip.open(str(before_path), "rt") as f:
        before = json.load(f)
    unexplained = collections.defaultdict(lambda: [0, set()])
    intended = collections.Counter()
    elems = 0
    for state, a in sorted(after_fp.items()):
        b = before.get(state)
        if not b or "full" not in a or "full" not in b:
            continue
        for idx, props in a["full"].items():
            old = b["full"].get(idx)
            if not old:
                continue
            elems += 1
            desc = a["d"][int(idx)]
            diffs = {p: (old.get(p), props.get(p)) for p in set(old) | set(props) if old.get(p) != props.get(p)}
            col = diffs.get("color")
            for p in list(diffs):
                if col and p != "color" and diffs[p] == col and COLOR_DERIVED.match(p):
                    del diffs[p]
            for p, (x, y) in diffs.items():
                name = intended_for(state, desc, p)
                if name:
                    intended[name] += 1
                else:
                    k = (desc, p, str(x)[:60], str(y)[:60])
                    unexplained[k][0] += 1
                    unexplained[k][1].add(state.split("/")[0])
    for (desc, p, x, y), (n, states) in sorted(unexplained.items(), key=lambda kv: (-kv[1][0], kv[0]))[:80]:
        print("  UNEXPLAINED  %-44s %-24s %s -> %s   (x%d in %s)" % (desc[:44], p, x, y, n, ",".join(sorted(states))[:90]))
    print("  property pass: %d changed elements inspected; intended differences by reason: %s; UNEXPLAINED: %d"
          % (elems, dict(intended), len(unexplained)))
    if summary_out:
        Path(summary_out).write_text(json.dumps({"elements_inspected": elems, "intended": dict(intended),
                                                 "reasons": {n: w for n, _s, _d, _p, w in INTENDED},
                                                 "unexplained": [{"element": d, "property": p, "before": x, "after": y, "count": c[0],
                                                                  "states": sorted(c[1])} for (d, p, x, y), c in unexplained.items()]},
                                                indent=1) + "\n", "utf-8")
    return len(unexplained)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--port", type=int, required=True)
    ap.add_argument("--site", required=True)
    ap.add_argument("--report", help="write the JSON report here")
    ap.add_argument("--fingerprint", help="write per-checkpoint computed-style hashes (json.gz) here")
    ap.add_argument("--compare", help="a fingerprint file from the BEFORE site: diff against this run")
    ap.add_argument("--only", help="comma list of substrings: run only the states whose name contains one of them")
    ap.add_argument("--static-only", action="store_true", help="duplicates, breakpoints and payload only (no browser)")
    ap.add_argument("--styles", help="stylesheet directory (default SITE/src/styles)")
    ap.add_argument("--skip-dead-check", action="store_true", help="do not fail on dead rules (use with --only)")
    ap.add_argument("--want", help="JSON {checkpoint: [element index, ...]}: store the FULL computed style of those elements (property diffs)")
    ap.add_argument("--summary-out", help="with --compare and --want: write the property-level classification here")
    ap.add_argument("--want-out", help="with --compare: write the differing element indexes per checkpoint here (input of --want)")
    a = ap.parse_args(argv)
    site = Path(a.site).resolve()
    styles = Path(a.styles) if a.styles else site / "src" / "styles"
    if not styles.is_dir():
        print("error: no stylesheet directory %s" % styles, file=sys.stderr)
        return 2
    sheets = load_sheets(styles)
    failures = []
    report = {"site": str(site), "styles": str(styles)}
    nrules = sum(1 for sh in sheets.values() for it in sh["items"] if it["kind"] == "style")
    print("stylesheets: %d files, %d style rules" % (len(sheets), nrules))

    # 2 duplicates
    dups, _ = check_duplicates(sheets)
    bad_dups = [d for d in dups if not d["allowed"]]
    report["duplicates"] = dups
    print("duplicates (same selector + same at-rule context in two files): %d unallowed, %d allowed" % (len(bad_dups), len(dups) - len(bad_dups)))
    for d in bad_dups:
        print("  DUP  %s  %s  in %s" % (d["selector"], ("[" + " / ".join(d["ctx"]) + "]") if d["ctx"] else "", ", ".join(d["files"])))
    if bad_dups:
        failures.append("%d selector(s) defined in more than one file" % len(bad_dups))

    # 3 breakpoints
    badbp, seen = check_breakpoints(sheets)
    report["breakpoints"] = seen
    report["breakpoints_bad"] = badbp
    print("breakpoints used: %s" % ", ".join("%s x%d" % kv for kv in seen.items()))
    agg_bp = collections.Counter((b["file"], b["value"]) for b in badbp)
    for (f, v), n in sorted(agg_bp.items()):
        print("  BREAKPOINT  %s  %s  x%d" % (f, v, n))
    if badbp:
        failures.append("%d media query value(s) off the 390/768/1280/1920 + 899 scale" % len(badbp))

    # 4 payload
    try:
        names = home_set(site)
        gz, raw = gzip_size(styles, names)
        report["home_css"] = {"files": names, "gzip": gz, "raw": raw}
        print("home page CSS set: %d files, %d B raw, %d B gzip (budget %d)" % (len(names), raw, gz, GZIP_BUDGET))
        if gz > GZIP_BUDGET:
            failures.append("home CSS gzip %d B exceeds %d B" % (gz, GZIP_BUDGET))
    except Exception as e:
        print("payload check skipped: %s" % e)

    # named dead things must be gone
    text_all = "\n".join(re.sub(r"/\*.*?\*/", "", sh["text"], flags=re.S) for sh in sheets.values())
    named = {"--pass": r"--pass\b", "--fail": r"--fail\b", ".region-star": r"\.region-star\b", ".socials": r"\.socials\b",
             ".direct": r"\.direct\b", ".modal-topo": r"\.modal-topo\b", "--bar-color": r"--bar-color\b",
             "opacity on .region-card.fail": r"\.region-card\.fail\s*\{[^}]*opacity"}
    stale = {k: len(re.findall(rx, text_all)) for k, rx in named.items()}
    report["named_dead"] = stale
    for k, n in stale.items():
        if n:
            print("  NAMED-DEAD still present: %s x%d" % (k, n))
            failures.append("named dead rule %s still present" % k)

    if not a.static_only:
        from lib.site import Harness
        col = Collector(sheets, site)
        h = Harness(site, a.port, offline=True).start()
        try:
            a.want_map = json.loads(Path(a.want).read_text("utf-8")) if a.want else None
            drv = run_states(h, col, a)
        finally:
            h.stop()
        dead, kept, ok = classify(col, Producible(source_corpus(site)))
        report["states"] = col.state_names
        report["rules_total"] = len(col.rules)
        report["rules_matched"] = ok
        report["dead"] = [rule_label(r) for r in dead]
        report["kept"] = [{"rule": rule_label(r), "why": w} for r, w in kept]
        report["unparsed_selectors"] = sorted(col.unparsed)
        report["errors"] = col.errors
        print("rules: %d total, %d matched in some state, %d kept for stated reasons, %d DEAD" % (len(col.rules), ok, len(kept), len(dead)))
        for r in dead:
            print("  DEAD  " + rule_label(r))
        n_state = sum(1 for _, w in kept if w.startswith("no test state"))
        print("  (%d rules need a data-dependent state no test reaches; each has a source that can produce its element: kept)" % n_state)
        for r, w in kept:
            if not w.startswith("no test state"):
                print("  KEPT  %s  [%s]" % (rule_label(r), w))
        if col.unparsed:
            print("  selectors the browser could not parse (treated as matched): %s" % ", ".join(sorted(col.unparsed)[:10]))
        for e in col.errors:
            print("  NOTE  " + e)
        if dead and not a.skip_dead_check:
            failures.append("%d dead rule(s)" % len(dead))
        if len(col.state_names) < 10 and not a.only:
            failures.append("only %d states ran" % len(col.state_names))
        if a.fingerprint:
            with gzip.open(a.fingerprint, "wt") as f:
                json.dump(col.fp, f)
            print("fingerprint: %d checkpoints written to %s" % (len(col.fp), a.fingerprint))
        if a.compare:
            n, same, diffs, structural = fingerprint_compare(a.compare, col.fp)
            report["fingerprint"] = {"checkpoints": n, "identical": same, "differing": len(diffs), "structural": structural}
            print("fingerprint compare: %d checkpoints, %d identical, %d with differing elements, %d structural" % (n, same, len(diffs), len(structural)))
            for s in structural[:40]:
                print("  STRUCT  " + s)
            agg = collections.Counter()
            for state, bad, descs in diffs:
                for i in bad:
                    agg[descs[i]] += 1
            for d, c in agg.most_common(60):
                print("  CHANGED  %s  (x%d checkpoints)" % (d, c))
            if diffs or structural:
                report["fingerprint"]["changed_elements"] = dict(agg)
            if a.want_out:
                sample = {}
                for s, bad, descs in diffs:
                    seen, pick = set(), []
                    for i in bad:
                        if descs[i] not in seen:
                            seen.add(descs[i])
                            pick.append(i)
                        if len(pick) >= 120:
                            break
                    sample[s] = pick
                Path(a.want_out).write_text(json.dumps(sample) + "\n", "utf-8")
            n_un = full_diff(a.compare, col.fp, a.summary_out)
            if n_un and a.want:
                failures.append("%d unexplained computed-style difference(s)" % n_un)
    if a.report:
        Path(a.report).parent.mkdir(parents=True, exist_ok=True)
        Path(a.report).write_text(json.dumps(report, indent=1) + "\n", "utf-8")
    if failures:
        print("FAIL: " + "; ".join(failures))
        return 1
    print("OK: coverage, single definition, breakpoints and payload checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
