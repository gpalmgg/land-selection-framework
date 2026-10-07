"""axe-core for the e2e harness (MC-A11Y): load the vendored copy, run it on a Playwright page, apply the reviewed allow-list.

    from lib import axe
    res = axe.run_page(page)            # {violations, passes, incomplete, nodes_checked, ...}; raises AxeMissing / AxeEmpty
    bad, allowed, unused = axe.apply_allowlist(res["violations"], page_path, allowlist)

Guards (the suite FAILS on them, it never skips):
  * AxeMissing: tests/e2e/vendor/axe.min.js (or VERSION.txt) is absent or empty, or the script did not define `window.axe`
  * AxeEmpty:   the run reported zero checked nodes (an empty context, a blank page, or a crashed run)

The vendored file is axe-core from cdnjs (version, URL and licence MPL-2.0 in vendor/VERSION.txt). The tests/ directory is vercel-ignored.
"""
import fnmatch
import json
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
VENDOR = E2E / "vendor"
AXE_JS = VENDOR / "axe.min.js"
VERSION_TXT = VENDOR / "VERSION.txt"
ALLOWLIST = E2E / "axe-allowlist.json"

TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"]
BLOCKING = ("serious", "critical")          # never allow-listable
ALLOWABLE = ("moderate", "minor")

# Rules axe reports as "incomplete" (needs review) are not failures; they are recorded for the notes.


class AxeMissing(RuntimeError):
    pass


class AxeEmpty(RuntimeError):
    pass


def load_source(path=None, version_path=None):
    """The vendored axe source text. Raises AxeMissing when the file or its VERSION.txt is missing or empty."""
    p = Path(path) if path else AXE_JS
    v = Path(version_path) if version_path else VERSION_TXT
    if not p.is_file() or p.stat().st_size < 10000:
        raise AxeMissing("axe-core is missing or empty at %s (vendor it from cdnjs; see vendor/VERSION.txt)" % p)
    if not v.is_file() or not v.read_text("utf-8").strip():
        raise AxeMissing("vendor/VERSION.txt is missing or empty at %s (record version, source and the MPL-2.0 licence)" % v)
    return p.read_text("utf-8")


def version():
    try:
        first = VERSION_TXT.read_text("utf-8").strip().splitlines()[0]
    except Exception:
        return None
    return first.strip()


def inject(page, source=None):
    """Define window.axe in the page. Raises AxeMissing when it does not appear."""
    src = source if source is not None else load_source()
    present = page.evaluate("() => typeof window.axe === 'object' && typeof window.axe.run === 'function'")
    if not present:
        page.evaluate(src)
    if not page.evaluate("() => typeof window.axe === 'object' && typeof window.axe.run === 'function'"):
        raise AxeMissing("window.axe is not defined after injecting the vendored script")
    return True


_RUN_JS = """async ({context, options}) => {
  const res = await window.axe.run(context, options);
  const slim = (n) => ({ target: n.target, html: (n.html || '').slice(0, 220), summary: (n.failureSummary || '').slice(0, 420) });
  const count = (list) => list.reduce((a, r) => a + r.nodes.length, 0);
  return {
    violations: res.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, helpUrl: v.helpUrl, tags: v.tags,
      nodes: v.nodes.map(n => Object.assign(slim(n), { impact: n.impact })) })),
    incomplete: res.incomplete.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, targets: v.nodes.slice(0, 3).map(n => n.target) })),
    passes: res.passes.length, passNodes: count(res.passes), violationNodes: count(res.violations), incompleteNodes: count(res.incomplete),
    inapplicable: res.inapplicable.length, url: res.url, engine: res.testEngine && res.testEngine.version
  };
}"""


def run_page(page, context=None, only_rules=None, disable_rules=None, tags=None, source=None, allow_empty=False):
    """Run axe on the page. `context` is axe's context object (include/exclude) or None for the whole page.
    Raises AxeMissing (no axe) or AxeEmpty (zero nodes checked) unless allow_empty."""
    inject(page, source)
    options = {"resultTypes": ["violations", "incomplete", "passes"]}
    if only_rules:
        options["runOnly"] = {"type": "rule", "values": list(only_rules)}
    else:
        options["runOnly"] = {"type": "tag", "values": list(tags or TAGS)}
    if disable_rules:
        options["rules"] = {r: {"enabled": False} for r in disable_rules}
    res = page.evaluate(_RUN_JS, {"context": context if context is not None else {"include": [["html"]]}, "options": options})
    res["nodes_checked"] = res["passNodes"] + res["violationNodes"] + res["incompleteNodes"]
    if res["nodes_checked"] == 0 and not allow_empty:
        raise AxeEmpty("axe reported zero checked nodes on %s" % res.get("url"))
    return res


def run_split(page, map_selector="#map"):
    """The suite's standard run: every rule on the whole page, then colour-contrast again with the map element excluded from the
    colour check (map tiles and drawn layers have no meaningful text colour). The first run has colour-contrast disabled; the second
    runs only colour-contrast over everything but the map. Violations are merged."""
    main = run_page(page, disable_rules=["color-contrast"])
    exclude = [[map_selector]] if page.evaluate("(s) => !!document.querySelector(s)", map_selector) else []
    ctx = {"include": [["html"]]}
    if exclude:
        ctx["exclude"] = exclude
    col = run_page(page, context=ctx, only_rules=["color-contrast"], allow_empty=True)
    out = {"violations": main["violations"] + col["violations"], "incomplete": main["incomplete"] + col["incomplete"],
           "nodes_checked": main["nodes_checked"] + col["nodes_checked"], "passes": main["passes"] + col["passes"],
           "engine": main.get("engine")}
    return out


def read_allowlist(path=None):
    p = Path(path) if path else ALLOWLIST
    try:
        data = json.loads(p.read_text("utf-8"))
    except Exception:
        return []
    return data.get("entries", data) if isinstance(data, dict) else data


def entry_problems(entries):
    """Allow-list entries must name a rule, an allowable impact and a reason; serious/critical are never allow-listable."""
    bad = []
    for i, e in enumerate(entries):
        why = []
        if not e.get("rule"):
            why.append("no rule")
        if e.get("impact") not in ALLOWABLE:
            why.append("impact must be moderate or minor (serious and critical are never allow-listed)")
        if not str(e.get("reason", "")).strip():
            why.append("no reason")
        if why:
            bad.append("entry %d (%s): %s" % (i, e.get("rule"), "; ".join(why)))
    return bad


def _entry_matches(entry, page_path, rule, impact, node):
    if entry.get("rule") != rule or entry.get("impact") != impact:
        return False
    pages = entry.get("pages") or ["*"]
    if not any(fnmatch.fnmatchcase(page_path, pat) for pat in pages):
        return False
    sub = entry.get("target_contains")
    if sub:
        tgt = " ".join(str(t) for t in (node.get("target") or []))
        if sub not in tgt:
            return False
    return True


def apply_allowlist(violations, page_path, entries):
    """Split violation NODES into (blocking, allowed, used_entry_indexes).
    blocking: every serious/critical node, and every moderate/minor node with no matching allow-list entry."""
    blocking, allowed, used = [], [], set()
    for v in violations:
        for n in v["nodes"]:
            impact = n.get("impact") or v.get("impact")
            row = {"rule": v["id"], "impact": impact, "help": v.get("help"), "target": n.get("target"), "html": n.get("html"),
                   "summary": n.get("summary")}
            if impact in BLOCKING:
                blocking.append(row)
                continue
            hit = next((i for i, e in enumerate(entries) if _entry_matches(e, page_path, v["id"], impact, n)), None)
            if hit is None:
                blocking.append(row)
            else:
                used.add(hit)
                row["reason"] = entries[hit].get("reason")
                allowed.append(row)
    return blocking, allowed, used


def describe(rows, limit=4):
    return "; ".join("%s[%s] %s | %s" % (r["rule"], r["impact"], " ".join(str(t) for t in (r["target"] or []))[:90], (r.get("summary") or "").replace("\n", " ")[:120])
                     for r in rows[:limit]) + (" (+%d more)" % (len(rows) - limit) if len(rows) > limit else "")
