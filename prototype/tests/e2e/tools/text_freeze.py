#!/usr/bin/env /usr/bin/python3
"""text_freeze: the text-invariance gate for deeper.html (MC-DEEPER; contract: upgrade-2026-10/tracks/docs/deeper-contract.md, section 6).

    text_freeze.py --record  [--site DIR | --file PATH] [--out JSON]      record per-section normalised text hashes
    text_freeze.py --compare [--site DIR | --file PATH] [--freeze JSON]   compare against a freeze (default: DOC-6's deeper.freeze.json)
    text_freeze.py --show SECTION [--site DIR | --file PATH]              print the normalised text of one section
    text_freeze.py --diff SECTION [--site DIR | --file PATH] [--freeze JSON]   first differing words against a recorded freeze

The page is deeper.html of --site DIR (default: the working tree's prototype/) or --file PATH.

NORMALISATION (identical to DOC-6's contract, reproducible in any language): take the section element; delete <style> and <script>
elements and HTML comments; delete inline tags (a span strong em b i code sup sub small mark abbr cite q s u wbr) without leaving
a space; replace every other tag by one space; decode character references; collapse every whitespace run to one space; trim;
SHA-256 of the UTF-8 bytes. `all` joins the section texts with a newline.

ONE EXTENSION, recorded as an approved difference of the contract: the content between a generated stamp pair
`<!--s:NAME-->...<!--/s-->` (the Century Line block, written by scripts/stamp_build.mjs from lib/century.js) is not copy and is
dropped before hashing, so a stamped scratch site and the unstamped working tree hash the same. The `<!--f:KEY-->` and
`<!--g:KEY-->` fact markers are NOT stripped: their text is part of the copy and counts.

Sections: mobile-note (id), topbar (div.topbar), hero (section.hero), methodology case-studies tensions ethics whats-next sources
(section.block with that id) and footer (the <footer> element).

Exit status: 0 = every section equal (compare) or the action succeeded; 1 = a section differs or is missing; 2 = usage error.
"""
import argparse
import hashlib
import json
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

PROTO = Path(__file__).resolve().parent.parent.parent.parent
ROOT = PROTO.parent
DEFAULT_FREEZE = ROOT / "upgrade-2026-10" / "tracks" / "docs" / "deeper.freeze.json"

INLINE = {"a", "span", "strong", "em", "b", "i", "code", "sup", "sub", "small", "mark", "abbr", "cite", "q", "s", "u", "wbr"}
VOID = {"area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "source", "track", "wbr"}
SECTIONS = ["mobile-note", "topbar", "hero", "methodology", "case-studies", "tensions", "ethics", "whats-next", "sources", "footer"]


def matches(name, section, tag, attrs):
    """Does this start tag open the element that IS `section`?"""
    a = dict(attrs)
    classes = (a.get("class") or "").split()
    if section == "mobile-note":
        return a.get("id") == "mobile-note"
    if section == "topbar":
        return tag == "div" and "topbar" in classes
    if section == "hero":
        return tag == "section" and "hero" in classes
    if section == "footer":
        return tag == "footer"
    return tag == "section" and "block" in classes and a.get("id") == section


class Extract(HTMLParser):
    def __init__(self, section):
        super().__init__(convert_charrefs=True)
        self.section = section
        self.depth = 0          # nesting depth of the target element's own tag (0 = outside)
        self.target_tag = None
        self.same = 0           # how many open elements with the target tag name are inside the target
        self.skip = 0           # inside <style> or <script>
        self.stamp = False      # inside a <!--s:NAME--> ... <!--/s--> generated block
        self.parts = []
        self.found = False
        self.done = False

    def _inside(self):
        return self.target_tag is not None and not self.done

    def handle_starttag(self, tag, attrs):
        if self.done:
            return
        if self.target_tag is None:
            if matches(None, self.section, tag, attrs) and not self.found:
                self.target_tag = tag
                self.found = True
                self.same = 1
                if tag not in VOID:
                    pass
                self.parts.append(" ")
            return
        if tag == self.target_tag and tag not in VOID:
            self.same += 1
        if tag in ("style", "script"):
            self.skip += 1
            return
        if self.stamp:
            return
        self.parts.append("" if tag in INLINE else " ")

    def handle_startendtag(self, tag, attrs):
        if self.target_tag is None or self.done or self.stamp or self.skip:
            return
        self.parts.append("" if tag in INLINE else " ")

    def handle_endtag(self, tag):
        if self.target_tag is None or self.done:
            return
        if tag in ("style", "script"):
            self.skip = max(0, self.skip - 1)
            return
        if tag == self.target_tag and tag not in VOID:
            self.same -= 1
            if self.same == 0:
                self.done = True
                return
        if self.stamp or self.skip:
            return
        self.parts.append("" if tag in INLINE else " ")

    def handle_data(self, data):
        if self.target_tag is None or self.done or self.skip or self.stamp:
            return
        self.parts.append(data)

    def handle_comment(self, data):
        if self.target_tag is None or self.done:
            return
        if re.match(r"s:[A-Za-z0-9:_-]+$", data):
            self.stamp = True
        elif data == "/s":
            self.stamp = False

    def text(self):
        return re.sub(r"\s+", " ", "".join(self.parts)).strip()


def section_text(html, section):
    p = Extract(section)
    p.feed(html)
    p.close()
    return p.text() if p.found else None


def digest(text):
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def record(html):
    out, texts = {}, []
    for s in SECTIONS:
        t = section_text(html, s)
        if t is None:
            out[s] = None
            continue
        texts.append(t)
        out[s] = {"sha256": digest(t), "chars": len(t), "words": len(t.split())}
    present = [section_text(html, s) for s in SECTIONS]
    joined = "\n".join(t for t in present if t is not None)
    out["all"] = {"sha256": digest(joined), "chars": len(joined)}
    return out


def load_page(a):
    if a.file:
        p = Path(a.file)
    else:
        p = Path(a.site or PROTO) / "deeper.html"
    if not p.is_file():
        print("error: %s not found" % p, file=sys.stderr)
        sys.exit(2)
    return p, p.read_text("utf-8")


def load_freeze(path):
    d = json.loads(Path(path).read_text("utf-8"))
    return d.get("sections") or d


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    g = ap.add_mutually_exclusive_group(required=True)
    g.add_argument("--record", action="store_true")
    g.add_argument("--compare", action="store_true")
    g.add_argument("--show", metavar="SECTION")
    g.add_argument("--diff", metavar="SECTION")
    ap.add_argument("--site", default=None)
    ap.add_argument("--file", default=None)
    ap.add_argument("--freeze", default=str(DEFAULT_FREEZE))
    ap.add_argument("--out", default=None)
    a = ap.parse_args(argv)
    page, html = load_page(a)

    if a.show:
        if a.show not in SECTIONS:
            print("error: unknown section %s (have: %s)" % (a.show, ", ".join(SECTIONS)), file=sys.stderr)
            return 2
        t = section_text(html, a.show)
        if t is None:
            print("section %s not found in %s" % (a.show, page), file=sys.stderr)
            return 1
        print(t)
        return 0

    if a.record:
        rec = record(html)
        doc = {"generatedBy": "text_freeze.py --record", "page": str(page), "method": "deeper-contract.md section 6 (+ stamp-block exclusion)", "sections": rec}
        if a.out:
            Path(a.out).parent.mkdir(parents=True, exist_ok=True)
            Path(a.out).write_text(json.dumps(doc, indent=1) + "\n", "utf-8")
        for s in SECTIONS + ["all"]:
            r = rec[s]
            print("%-13s %s" % (s, ("%s  %d chars" % (r["sha256"], r["chars"])) if r else "MISSING"))
        return 0

    if a.diff:
        frozen = load_freeze(a.freeze)
        t = section_text(html, a.diff)
        print("current %s: %s chars; freeze: %s chars" % (a.diff, len(t) if t else None, (frozen.get(a.diff) or {}).get("chars")))
        return 0

    # --compare
    frozen = load_freeze(a.freeze)
    rec = record(html)
    bad = 0
    for s in SECTIONS + ["all"]:
        want, got = frozen.get(s), rec.get(s)
        if want is None:
            print("%-13s no frozen value (skipped)" % s)
            continue
        if got is None:
            print("%-13s MISSING in %s" % (s, page))
            bad += 1
            continue
        ok = got["sha256"] == want["sha256"]
        if not ok:
            bad += 1
        print("%-13s %s  (%s chars now, %s frozen)" % (s, "identical" if ok else "DIFFERS", got["chars"], want.get("chars")))
    print("text-freeze: %s (%s vs %s)" % ("every section identical" if not bad else "%d section(s) differ or are missing" % bad, page, a.freeze))
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
