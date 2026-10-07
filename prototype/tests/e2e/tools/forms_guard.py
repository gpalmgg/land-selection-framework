#!/usr/bin/env /usr/bin/python3
"""Signup-form guard (gate G12). The signup forms send REAL email through FormSubmit; this tool never submits anything.

    forms_guard.py --site DIR --record OUT.json          record every <form> (action, method, hidden inputs, input names and ids)
                                                         plus the String(data.success) === 'true' count and formsubmit.co mentions
    forms_guard.py --site DIR --compare BASELINE.json    compare against a recorded baseline (exit 1 on any difference)
        --allow-visible-strings                          ignore visible text nodes and string-literal changes only: button text,
                                                         placeholder, aria-label, title, the _subject value, status text
    forms_guard.py --handler-diff NEWFILE                extract the two submit handlers from the baseline src/main.js and from
        [--baseline-main FILE]                           NEWFILE (the moved src/ui/signup.js), mask string literals EXCEPT the
                                                         literals passed to localStorage/sessionStorage getItem/setItem/removeItem
                                                         (the key), the event names passed to window.va/trackEvent, and 'true'/'false',
                                                         and compare the code (exit 1 on any difference). The storage keys, values
                                                         and event names of the WHOLE signup source are compared as well: a changed
                                                         storage key would re-show the modal to existing subscribers.
"""
import argparse
import json
import re
import sys
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
PROTO = E2E.parent.parent
U = PROTO.parent / "upgrade-2026-10"
BASELINE_MAIN = U / "verify" / "baseline-site" / "prototype" / "src" / "main.js"
SUCCESS_CHECK = "String(data.success) === 'true'"
SKIP = ("vendor", "node_modules", "tests", ".venv", "scripts", "notebooks")

# ---------------------------------------------------------------------------------------------------- HTML forms


def html_files(site):
    site = Path(site)
    out = []
    for p in sorted(site.rglob("*.html")):
        parts = p.relative_to(site).parts
        if parts[0] in SKIP:
            continue
        out.append(p)
    return out


def parse_forms(site):
    from bs4 import BeautifulSoup
    forms = []
    for p in html_files(site):
        soup = BeautifulSoup(p.read_text("utf-8", "ignore"), "html.parser")
        for f in soup.find_all("form"):
            inputs = []
            for i in f.find_all("input"):
                inputs.append({"name": i.get("name"), "type": i.get("type"), "id": i.get("id"), "value": i.get("value"),
                               "required": i.has_attr("required"), "autocomplete": i.get("autocomplete"), "tabindex": i.get("tabindex"),
                               "style": i.get("style"), "placeholder": i.get("placeholder"), "aria_label": i.get("aria-label")})
            buttons = [{"type": b.get("type"), "text": b.get_text(" ", strip=True), "id": b.get("id")} for b in f.find_all("button")]
            status = []
            nxt = f.find_next_sibling()
            if nxt is not None and nxt.get("id"):
                status.append({"id": nxt.get("id"), "class": " ".join(nxt.get("class") or []), "aria_live": nxt.get("aria-live"),
                               "role": nxt.get("role"), "text": nxt.get_text(" ", strip=True)})
            forms.append({"file": str(p.relative_to(site)), "id": f.get("id"), "class": " ".join(f.get("class") or []),
                          "action": f.get("action"), "method": (f.get("method") or "").upper(), "novalidate": f.has_attr("novalidate"),
                          "inputs": inputs, "buttons": buttons, "status": status})
    return forms


def js_files(site):
    site = Path(site)
    out = []
    for p in sorted(list(site.rglob("*.js")) + list(site.rglob("*.mjs")) + list(site.rglob("*.html"))):
        parts = p.relative_to(site).parts
        if parts[0] in SKIP or parts[0] == "data":
            continue
        out.append(p)
    return out


def success_checks(site):
    per = {}
    for p in js_files(site):
        try:
            n = p.read_text("utf-8", "ignore").count(SUCCESS_CHECK)
        except Exception:
            continue
        if n:
            per[str(p.relative_to(site))] = n
    return per


def formsubmit_mentions(site):
    per = {}
    for p in js_files(site):
        try:
            n = len(re.findall(r"formsubmit\.co", p.read_text("utf-8", "ignore")))
        except Exception:
            continue
        if n:
            per[str(p.relative_to(site))] = n
    return per


def record(site):
    sc = success_checks(site)
    fm = formsubmit_mentions(site)
    return {"site": str(site), "forms": parse_forms(site), "success_check_files": sc, "success_check_total": sum(sc.values()),
            "formsubmit_mentions": fm, "formsubmit_mentions_total": sum(fm.values())}


VISIBLE_KEYS = {"placeholder", "aria_label", "text", "title"}


def _norm_form(f, allow_visible):
    g = json.loads(json.dumps(f))
    g.pop("file", None)
    if allow_visible:
        for i in g["inputs"]:
            i.pop("placeholder", None)
            i.pop("aria_label", None)
            if i.get("name") == "_subject":
                i["value"] = "<subject>"
        for b in g["buttons"]:
            b.pop("text", None)
        for s in g["status"]:
            s.pop("text", None)
    return g


def compare(site, base_path, allow_visible):
    base = json.loads(Path(base_path).read_text("utf-8"))
    cur = record(site)
    problems = []
    bforms = {(f["id"] or "?"): f for f in base["forms"]}
    cforms = {(f["id"] or "?"): f for f in cur["forms"]}
    for fid in bforms:
        if fid not in cforms:
            problems.append("form #%s is missing" % fid)
            continue
        a, b = _norm_form(bforms[fid], allow_visible), _norm_form(cforms[fid], allow_visible)
        # status elements may GAIN aria-live (an a11y fix): only compare ids / class there
        for s in a["status"] + b["status"]:
            s.pop("aria_live", None)
            s.pop("role", None)
        if a != b:
            for k in a:
                if a[k] != b.get(k):
                    problems.append("form #%s differs in %s: %s != %s" % (fid, k, json.dumps(a[k])[:240], json.dumps(b.get(k))[:240]))
    for fid in cforms:
        if fid not in bforms:
            problems.append("unexpected new form #%s in %s" % (fid, cforms[fid]["file"]))
    if cur["success_check_total"] != base["success_check_total"]:
        problems.append("%r count %d != baseline %d (%s)" % (SUCCESS_CHECK, cur["success_check_total"], base["success_check_total"], cur["success_check_files"]))
    if cur["formsubmit_mentions_total"] != base["formsubmit_mentions_total"]:
        problems.append("formsubmit.co mentions %d != baseline %d (%s)" % (cur["formsubmit_mentions_total"], base["formsubmit_mentions_total"], cur["formsubmit_mentions"]))
    return problems, cur


# ------------------------------------------------------------------------------------------- JS handler diff
KEYWORD_BEFORE_REGEX = {"return", "typeof", "case", "in", "of", "delete", "void", "throw", "new", "else", "do", "await", "yield"}


def tokenize(src):
    """Minimal JS tokenizer: ('str', text) ('tpl', text) ('re', text) ('id', text) ('num', text) ('p', text). Comments dropped."""
    i, n, toks = 0, len(src), []
    while i < n:
        c = src[i]
        if c.isspace():
            i += 1
        elif src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j + 1
        elif src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
        elif c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            toks.append(("str", src[i:j + 1]))
            i = j + 1
        elif c == "`":
            j, depth = i + 1, 0
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src.startswith("${", j):
                    depth += 1
                    j += 2
                    continue
                if src[j] == "}" and depth:
                    depth -= 1
                elif src[j] == "`" and not depth:
                    break
                j += 1
            toks.append(("tpl", src[i:j + 1]))
            i = j + 1
        elif c == "/":
            prev = toks[-1] if toks else None
            regex_ok = (prev is None or (prev[0] == "p" and prev[1] not in (")", "]", "}")) or (prev[0] == "id" and prev[1] in KEYWORD_BEFORE_REGEX))
            if regex_ok:
                j, in_class = i + 1, False
                while j < n:
                    if src[j] == "\\":
                        j += 2
                        continue
                    if src[j] == "[":
                        in_class = True
                    elif src[j] == "]":
                        in_class = False
                    elif src[j] == "/" and not in_class:
                        break
                    j += 1
                j += 1
                while j < n and src[j].isalpha():
                    j += 1
                toks.append(("re", src[i:j]))
                i = j
            else:
                toks.append(("p", "/"))
                i += 1
        elif c.isalpha() or c in "_$":
            j = i + 1
            while j < n and (src[j].isalnum() or src[j] in "_$"):
                j += 1
            toks.append(("id", src[i:j]))
            i = j
        elif c.isdigit():
            j = i + 1
            while j < n and (src[j].isalnum() or src[j] == "."):
                j += 1
            toks.append(("num", src[i:j]))
            i = j
        else:
            for op in ("===", "!==", "...", "=>", "&&", "||", "??", "?.", "==", "!=", "<=", ">=", "++", "--", "+=", "-="):
                if src.startswith(op, i):
                    toks.append(("p", op))
                    i += len(op)
                    break
            else:
                toks.append(("p", c))
                i += 1
    return toks


def find_close(toks, i):
    """toks[i] is '{' : return the index of its matching '}'."""
    depth = 0
    for j in range(i, len(toks)):
        if toks[j] == ("p", "{"):
            depth += 1
        elif toks[j] == ("p", "}"):
            depth -= 1
            if depth == 0:
                return j
    return -1


def submit_handlers(toks):
    """Token slices of every `.addEventListener('submit', <fn>)` call (from the callee's `(` to its matching `)`)."""
    out = []
    for i in range(len(toks) - 3):
        if toks[i] == ("id", "addEventListener") and toks[i + 1] == ("p", "(") and toks[i + 2][0] == "str" and toks[i + 2][1].strip("'\"") == "submit":
            depth = 0
            for j in range(i + 1, len(toks)):
                if toks[j] == ("p", "("):
                    depth += 1
                elif toks[j] == ("p", ")"):
                    depth -= 1
                    if depth == 0:
                        out.append(toks[i:j + 1])
                        break
    return out


def preserved(toks, k):
    """Is the string token at k one of the literals compared verbatim?"""
    text = toks[k][1].strip("'\"")
    if text in ("true", "false"):
        return True
    p = toks[max(0, k - 4):k]
    p2 = [t[1] for t in p]
    if len(p2) >= 2 and p2[-2:] == ["trackEvent", "("]:
        return True
    if len(p2) >= 2 and p2[-2:] == ["name", ":"]:
        return True
    if len(p2) >= 4 and p2[-4] in ("localStorage", "sessionStorage") and p2[-3] == "." and p2[-2] in ("getItem", "setItem", "removeItem") and p2[-1] == "(":
        return True
    if len(p2) >= 2 and p2[-2:] == ["va", "("]:                      # window.va('event', {...}): the 'event' literal
        return True
    return False


def masked(toks):
    out = []
    for k, (kind, text) in enumerate(toks):
        if kind == "str":
            out.append(text if preserved(toks, k) else '"S"')
        elif kind == "tpl":
            out.append("`T`")
        else:
            out.append(text)
    return " ".join(out)


def protected_facts(src):
    """Storage keys/values, event names and the state strings of the WHOLE source."""
    consts = dict(re.findall(r"const\s+(\w+)\s*=\s*['\"]([^'\"]*)['\"]", src))
    facts = set()
    for m in re.finditer(r"(localStorage|sessionStorage)\.(getItem|setItem|removeItem)\(\s*(?:['\"]([^'\"]+)['\"]|(\w+))\s*(?:,\s*(?:['\"]([^'\"]*)['\"]|(\w+)))?", src):
        store, op, lit, ident, vlit, vid = m.groups()
        key = lit if lit is not None else consts.get(ident, "?" + str(ident))
        val = vlit if vlit is not None else (consts.get(vid, "<dyn>") if vid else "")
        facts.add("%s.%s(%s)%s" % (store, op, key, (" = " + val) if op == "setItem" else ""))
    for m in re.finditer(r"\btrackEvent\(\s*['\"](\w+)['\"]", src):
        facts.add("event:" + m.group(1))
    for m in re.finditer(r"\b(?:dismissModal|persistState)\(\s*['\"](\w+)['\"]", src):
        facts.add("state:" + m.group(1))
    return facts


def baseline_region(src):
    """setStatus .. end of initSignupModal in the baseline src/main.js (the signup code that moves to src/ui/signup.js)."""
    a = src.find("function setStatus(")
    b = src.find("function initSignupModal(")
    if a < 0 or b < 0:
        return src
    if a > b:
        a = 0
    return src[a:_end_of_function(src, b)]


def _end_of_function(src, start):
    """Offset just past the closing brace of the function starting at `start` (strings, templates, regexes and comments skipped)."""
    i, n, depth, seen = start, len(src), 0, False
    prev_sig = ""
    while i < n:
        c = src[i]
        if src.startswith("//", i):
            j = src.find("\n", i)
            i = n if j < 0 else j + 1
            continue
        if src.startswith("/*", i):
            j = src.find("*/", i + 2)
            i = n if j < 0 else j + 2
            continue
        if c in "'\"":
            j = i + 1
            while j < n and src[j] != c:
                j += 2 if src[j] == "\\" else 1
            i = j + 1
            prev_sig = "s"
            continue
        if c == "`":
            j, d = i + 1, 0
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src.startswith("${", j):
                    d += 1
                    j += 2
                    continue
                if src[j] == "}" and d:
                    d -= 1
                elif src[j] == "`" and not d:
                    break
                j += 1
            i = j + 1
            prev_sig = "s"
            continue
        if c == "/" and prev_sig in ("", "(", ",", "=", ":", "!", "&", "|", "?", "{", ";"):
            j, in_class = i + 1, False
            while j < n:
                if src[j] == "\\":
                    j += 2
                    continue
                if src[j] == "[":
                    in_class = True
                elif src[j] == "]":
                    in_class = False
                elif src[j] == "/" and not in_class:
                    break
                j += 1
            i = j + 1
            prev_sig = "r"
            continue
        if c == "{":
            depth += 1
            seen = True
        elif c == "}":
            depth -= 1
            if seen and depth == 0:
                return i + 1
        if not c.isspace():
            prev_sig = c if not (c.isalnum() or c in "_$") else "i"
        i += 1
    return n


def handler_diff(new_file, baseline_main):
    base_src = Path(baseline_main).read_text("utf-8")
    new_src = Path(new_file).read_text("utf-8")
    problems = []
    bh = submit_handlers(tokenize(base_src))
    nh = submit_handlers(tokenize(new_src))
    if len(bh) != 2:
        problems.append("expected 2 submit handlers in the baseline %s, found %d" % (baseline_main, len(bh)))
    if len(nh) != 2:
        problems.append("expected 2 submit handlers in %s, found %d" % (new_file, len(nh)))
    for k, (a, b) in enumerate(zip(bh, nh)):
        ma, mb = masked(a), masked(b)
        if ma != mb:
            ta, tb = ma.split(" "), mb.split(" ")
            d = next((x for x in range(min(len(ta), len(tb))) if ta[x] != tb[x]), min(len(ta), len(tb)))
            problems.append("submit handler %d differs at token %d: baseline ...%s... vs new ...%s..." % (
                k + 1, d, " ".join(ta[max(0, d - 6):d + 8]), " ".join(tb[max(0, d - 6):d + 8])))
    fa = protected_facts(baseline_region(base_src))
    fb = protected_facts(baseline_region(new_src))        # whole file when it is the moved signup module
    for f in sorted(fa - fb):
        problems.append("protected literal missing in %s: %s" % (new_file, f))
    for f in sorted(fb - fa):
        problems.append("protected literal added in %s: %s" % (new_file, f))
    n_checks_b, n_checks_n = base_src.count(SUCCESS_CHECK), new_src.count(SUCCESS_CHECK)
    if n_checks_n != 2:
        problems.append("%r appears %d times in %s (must be 2)" % (SUCCESS_CHECK, n_checks_n, new_file))
    return problems, {"baseline_handlers": len(bh), "new_handlers": len(nh), "protected_facts": sorted(fa)}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--site")
    ap.add_argument("--record")
    ap.add_argument("--compare")
    ap.add_argument("--allow-visible-strings", action="store_true")
    ap.add_argument("--handler-diff")
    ap.add_argument("--baseline-main", default=str(BASELINE_MAIN))
    a = ap.parse_args(argv)
    if a.handler_diff:
        problems, info = handler_diff(a.handler_diff, a.baseline_main)
        if problems:
            print("HANDLER DIFF: %d problem(s)" % len(problems))
            for p in problems:
                print("  -", p)
            return 1
        print("handler diff clean: 2 submit handlers equal after masking; %d protected literals equal (%s)" % (
            len(info["protected_facts"]), ", ".join(info["protected_facts"])))
        return 0
    if not a.site:
        ap.error("--site is required with --record / --compare")
    if a.record:
        rec = record(a.site)
        Path(a.record).parent.mkdir(parents=True, exist_ok=True)
        Path(a.record).write_text(json.dumps(rec, indent=2) + "\n", "utf-8")
        print("recorded %d form(s): %s | %r count %d | formsubmit.co mentions %d -> %s" % (
            len(rec["forms"]), ", ".join("#%s" % f["id"] for f in rec["forms"]), SUCCESS_CHECK, rec["success_check_total"],
            rec["formsubmit_mentions_total"], a.record))
        return 0
    if a.compare:
        problems, cur = compare(a.site, a.compare, a.allow_visible_strings)
        if problems:
            print("FORMS GUARD: %d difference(s)%s" % (len(problems), " (visible strings ignored)" if a.allow_visible_strings else ""))
            for p in problems:
                print("  -", p)
            return 1
        print("forms guard clean: %d form(s) equal to the baseline%s; %r count %d" % (
            len(cur["forms"]), " (visible strings ignored)" if a.allow_visible_strings else "", SUCCESS_CHECK, cur["success_check_total"]))
        return 0
    ap.error("one of --record, --compare, --handler-diff is required")


if __name__ == "__main__":
    sys.exit(main())
