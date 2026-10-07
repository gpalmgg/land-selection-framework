#!/usr/bin/env /usr/bin/python3
"""MC-CSS-SPLIT proof: the 26 src/styles chunks, concatenated in index.html link order, equal the original CSS.

    css_concat_check.py [--site DIR] [--ref REV]

  Original CSS (the cascade as it was at the baseline commit, default 6bce1a3): the first inline <style> block of
  prototype/index.html, then src/a11y.css, then the second inline <style> block (the per-value sources block), read with
  `git show REV:prototype/<file>`. If git cannot supply them, upgrade-2026-10/verify/baseline-site/prototype is used.

  Compared after collapsing all whitespace runs to one space and trimming. The only text the chunks may add is the
  `/* MISPLACED: belongs to map.css; removed by MC-MAP-UI */` marker comments inside drawer.css (stripped before comparing).

  Also checks: the chunk link order in --site's index.html (default: the working tree's prototype/) equals the 26-file table,
  every chunk file exists, no chunk is empty, no stray <style> element remains, and no stylesheet link points to src/a11y.css.

  Exit 0 = identical; 1 = difference (the first differing offset is printed with context); 2 = cannot read the inputs.
"""
import argparse
import re
import subprocess
import sys
from pathlib import Path

PROTO = Path(__file__).resolve().parent.parent.parent.parent
ROOT = PROTO.parent
BASELINE_SITE = ROOT / "upgrade-2026-10" / "verify" / "baseline-site" / "prototype"

TABLE = ["base", "topline", "hero", "signup-card", "hero-cta", "regions-intro", "map", "cards", "arrive", "card-asks",
         "match-bar", "criteria", "summary", "contact", "footer", "modal", "responsive-mobile", "onboarding",
         "shortlist-nextstep", "drawer", "compare", "notes", "print", "rail", "a11y", "sources"]
MARKER = re.compile(r"/\*\s*MISPLACED: belongs to map\.css; removed by MC-MAP-UI\s*\*/")
LINK = re.compile(r"""<link\b[^>]*\brel=["']stylesheet["'][^>]*>""", re.I)
HREF = re.compile(r"""\bhref=["']([^"']+)["']""", re.I)
STYLE = re.compile(r"<style\b[^>]*>(.*?)</style>", re.I | re.S)


def collapse(s):
    return re.sub(r"\s+", " ", s).strip()


def git_show(rev, rel):
    r = subprocess.run(["git", "-C", str(ROOT), "show", "%s:prototype/%s" % (rev, rel)], stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if r.returncode != 0:
        return None
    return r.stdout.decode("utf-8")


def original(rev):
    html = git_show(rev, "index.html")
    a11y = git_show(rev, "src/a11y.css")
    src = "git %s" % rev
    if html is None or a11y is None:
        p = BASELINE_SITE / "index.html"
        q = BASELINE_SITE / "src" / "a11y.css"
        if not p.is_file() or not q.is_file():
            return None, None
        html, a11y, src = p.read_text(encoding="utf-8"), q.read_text(encoding="utf-8"), "baseline-site"
    blocks = STYLE.findall(html)
    if len(blocks) != 2:
        print("error: expected 2 inline <style> blocks in the original index.html, found %d" % len(blocks), file=sys.stderr)
        return None, None
    return blocks[0] + "\n" + a11y + "\n" + blocks[1], src


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site", default=str(PROTO))
    ap.add_argument("--ref", default="6bce1a3")
    a = ap.parse_args(argv)
    site = Path(a.site)
    problems = []

    html = (site / "index.html").read_text(encoding="utf-8")
    if "<style" in html.lower():
        problems.append("index.html still contains a <style element")
    hrefs = []
    for tag in LINK.findall(html):
        m = HREF.search(tag)
        if m:
            hrefs.append(m.group(1))
    chunk_links = [h for h in hrefs if h.startswith("./src/styles/")]
    got = [h[len("./src/styles/"):-len(".css")] for h in chunk_links if h.endswith(".css")]
    if got != TABLE:
        problems.append("chunk link order differs from the table:\n  got:  %s\n  want: %s" % (got, TABLE))
    if any(h.endswith("src/a11y.css") for h in hrefs):
        problems.append("a stylesheet link still points to src/a11y.css")

    parts = []
    for n in got:
        f = site / "src" / "styles" / (n + ".css")
        if not f.is_file():
            problems.append("missing chunk file src/styles/%s.css" % n)
            continue
        t = f.read_text(encoding="utf-8")
        if not t.strip():
            problems.append("empty chunk src/styles/%s.css" % n)
        if "MISPLACED" in t and n != "drawer":
            problems.append("MISPLACED marker outside drawer.css (%s.css)" % n)
        parts.append(t)
    new = collapse(MARKER.sub("", "\n".join(parts)))
    old_raw, src = original(a.ref)
    if old_raw is None:
        print("error: cannot read the original CSS (git %s and baseline-site both unavailable)" % a.ref, file=sys.stderr)
        return 2
    old = collapse(old_raw)

    if old != new:
        i = next((k for k in range(min(len(old), len(new))) if old[k] != new[k]), min(len(old), len(new)))
        problems.append("concatenated CSS differs from the original (%s) at offset %d (old len %d, new len %d)\n  old: ...%s\n  new: ...%s"
                        % (src, i, len(old), len(new), old[max(0, i - 80):i + 80], new[max(0, i - 80):i + 80]))

    if problems:
        print("css_concat_check: DIFFERENT")
        for p in problems:
            print(" - " + p)
        return 1
    print("css_concat_check: identical (%d chunks, %d chars after whitespace collapse, original from %s)" % (len(got), len(new), src))
    return 0


if __name__ == "__main__":
    sys.exit(main())
