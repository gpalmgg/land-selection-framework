#!/usr/bin/env /usr/bin/python3
"""Prove the harness' own guards on planted fixtures (run once after any change to the harness).

    /usr/bin/python3 tools/selftest.py --port N

 1. discipline flags a planted <option>cheapest</option> and a planted aria-label with a banned word, and stays quiet on a clean page
 2. forms_guard --handler-diff flags a changed storage-key literal, a loosened success check and a changed event name; it passes a
    handler whose only difference is visible text
 3. the formsubmit guard: a page that tries to POST to formsubmit.co is aborted, recorded, and the run fails
Exit 0 only when every proof holds.
"""
import argparse
import shutil
import sys
import tempfile
from pathlib import Path

E2E = Path(__file__).resolve().parent.parent
if str(E2E) not in sys.path:
    sys.path.insert(0, str(E2E))
from lib.site import Harness, BASELINE_SITE, U      # noqa: E402
from lib.util import load_tool                      # noqa: E402

CLEAN = "<!doctype html><title>t</title><h1>A bioregioning tool</h1><p>It filters; it never scores or ranks.</p><select><option>any</option><option>low</option></select>"
PLANT_OPTION = "<!doctype html><title>t</title><h1>x</h1><label>Affordability <select><option>any</option><option>cheapest</option></select></label>"
PLANT_ARIA = "<!doctype html><title>t</title><h1>x</h1><button aria-label=\"Open the best region\">Open</button><input placeholder=\"top candidates\">"
FORMSUBMIT = "<!doctype html><title>t</title><h1>x</h1><script>fetch('https://formsubmit.co/ajax/selftest', {method: 'POST', body: 'x'}).catch(function(){});</script>"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, required=True)
    a = ap.parse_args()
    D = load_tool("discipline")
    FG = load_tool("forms_guard")
    ok = True

    def proof(name, cond, detail=""):
        nonlocal ok
        ok = ok and cond
        print("%s %s %s" % ("ok  " if cond else "FAIL", name, detail))

    tmp = Path(tempfile.mkdtemp(dir=str(U / "verify" / "scratch")))
    (tmp / "fixtures").mkdir()
    for name, html in (("clean", CLEAN), ("option", PLANT_OPTION), ("aria", PLANT_ARIA), ("formsubmit", FORMSUBMIT)):
        (tmp / "fixtures" / ("%s.html" % name)).write_text(html, "utf-8")
    (tmp / "index.html").write_text(CLEAN, "utf-8")

    h = Harness(tmp, a.port, widths=(1280,), label="selftest").start()
    try:
        b = h.launch()
        reports = {}
        for name in ("clean", "option", "aria"):
            s = h.session(b, width=1280, stub=True)
            pg = s.page()
            pg.goto(h.base + "/fixtures/%s.html" % name)
            items = pg.evaluate(D.collect_js)
            for it in items:
                it["where"] = "/fixtures/%s.html" % name
            reports[name] = D.scan(items)
            s.close()
        proof("discipline: clean fixture is clean", D.is_clean(reports["clean"]), reports["clean"]["bad"])
        proof("discipline: planted <option>cheapest</option> flagged",
              any(x["word"] == "cheapest" and x["kind"] == "option" for x in reports["option"]["bad"]), reports["option"]["bad"])
        proof("discipline: planted aria-label 'best' flagged",
              any(x["word"] == "best" and x["kind"] == "aria-label" for x in reports["aria"]["bad"]), reports["aria"]["bad"])
        proof("discipline: planted placeholder 'top candidates' flagged",
              {x["word"] for x in reports["aria"]["bad"] if x["kind"] == "placeholder"} >= {"top", "candidates"}, reports["aria"]["bad"])

        # formsubmit guard
        s = h.session(b, width=1280, stub=True)
        pg = s.page()
        pg.goto(h.base + "/fixtures/formsubmit.html")
        pg.wait_for_timeout(800)
        s.close()
        proof("formsubmit guard: the injected request was aborted and recorded", len(h.formsubmit_attempts()) >= 1, h.formsubmit_attempts())
        h.close_browser(b)
    finally:
        h.stop()

    # handler-diff on fixtures made from the baseline source
    base_main = BASELINE_SITE / "src" / "main.js"
    src = base_main.read_text("utf-8")

    def diff_of(text, label):
        f = tmp / ("handler-%s.js" % label)
        f.write_text(text, "utf-8")
        return FG.handler_diff(str(f), str(base_main))[0]

    proof("handler-diff: baseline against itself is clean", not diff_of(src, "same"))
    proof("handler-diff: changed visible text only is clean",
          not diff_of(src.replace("Thanks, you\\'re in. I won\\'t share your email.", "Thank you for subscribing."), "visible"))
    probs = diff_of(src.replace("const STORAGE_KEY = 'lsf-modal-state'", "const STORAGE_KEY = 'lsf-modal-state-v2'"), "key")
    proof("handler-diff: changed storage-key literal flagged", any("lsf-modal-state" in p for p in probs), probs[:2])
    probs = diff_of(src.replace("localStorage.setItem('lsf-modal-state', 'subscribed')", "localStorage.setItem('lsf-signed-up', 'subscribed')"), "setitem")
    proof("handler-diff: changed setItem key flagged", any("lsf-signed-up" in p or "lsf-modal-state" in p for p in probs), probs[:2])
    probs = diff_of(src.replace("String(data.success) === 'true'", "String(data.success) === 'ok'"), "loosen")
    proof("handler-diff: loosened success check flagged", bool(probs), probs[:2])
    probs = diff_of(src.replace("trackEvent('modal_shown'", "trackEvent('modal_seen'"), "event")
    proof("handler-diff: changed event name flagged", any("modal_shown" in p or "modal_seen" in p for p in probs), probs[:2])
    probs = diff_of(src.replace("form.addEventListener('submit', async (e) => {\n    e.preventDefault();\n    const email = emailInput.value.trim();",
                                "form.addEventListener('submit', async (e) => {\n    e.preventDefault();\n    const email = emailInput.value;", 1), "code")
    proof("handler-diff: a code change inside a handler flagged", bool(probs), probs[:1])
    shutil.rmtree(str(tmp), ignore_errors=True)
    print("\nSELFTEST %s" % ("PASSED" if ok else "FAILED"))
    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
