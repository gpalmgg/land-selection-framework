LAND SELECTION FRAMEWORK: e2e harness (Playwright for Python, /usr/bin/python3 3.9, no pytest)
===========================================================================================
Vercel-ignored (tests/). Everything runs against a STATIC server the harness starts itself, on the port you pass.

COMMANDS  (cd prototype; $PW = /usr/bin/python3)
  $PW tests/e2e/run_all.py --port N --site DIR --suite pages,interactions[,discipline,layers,visual,...] [--strict]
        [--viewport 1280,390] [--offline] [--browser chromium|webkit|firefox] [--json OUT] [--label L]
        --port is REQUIRED (or env LSF_PORT): each WP has its own port; nothing else is ever bound.
        --suite all = every suite except `snapshot` and `perf`.  --strict ignores known_issues.json.
        webkit/firefox run only when their Playwright builds are installed; otherwise: `SKIPPED: <browser> not installed`.
  $PW tests/e2e/run_all.py --list                                  list the suites
  $PW tests/e2e/capture_baseline.py --port N --out DIR [--site DIR]    capture a baseline (14 snapshots, layer sweep, forms,
                                                                       analytics, share links). The real baseline is the
                                                                       pristine 6bce1a3 archive: never capture it from the tree.
  $PW tests/e2e/compare_snapshots.py --before DIR --after DIR          the zero-behaviour-change equivalence gate
  $PW tests/e2e/tools/scratch_site.py --out DIR [--pin-data]           scratch copy of the DEPLOYABLE site (generators run into
                                                                       DIR only; --pin-data overlays the 6bce1a3 data files)
  $PW tests/e2e/tools/deploy_filelist.py --site DIR [--with-current-vercelignore]
  $PW tests/e2e/tools/forms_guard.py --site DIR --record F | --compare F [--allow-visible-strings] | --handler-diff NEWFILE
  $PW tests/e2e/tools/discipline.py --html FILE                        framework-discipline scan of rendered text
  $PW tests/e2e/tools/selftest.py                                      proves the harness' own guards (fixtures)

LAYOUT
  run_all.py, capture_baseline.py, compare_snapshots.py, known_issues.json (WRITE-ONCE)
  lib/        site.py (server, guarded contexts, collectors), snapshot.py, capture.py, compare.py, layers.py (ported from
              recon/tools/browser_audit.py), probes.py, sel.py, util.py
  selectors/  one dict per component (home.py). NOT a package (no __init__.py): it must never shadow the stdlib `selectors`.
              The WP that changes a component's markup owns its selectors/<component>.py.
  suites/     <name>.py with NAME and run(ctx) -> list of {suite, test, status: pass|fail|skip|info, detail}; discovered by glob.
              Initial: pages, interactions, snapshot, layers, discipline, visual. Later WPs ADD suites/test_<component>.py.
  tools/      deploy_filelist, scratch_site, forms_guard, discipline, share_links.mjs, selftest (builds its planted fixtures in a scratch dir)

WRITING A SUITE
  NAME = "test_x";  def run(ctx): r = ctx.new_results(NAME); b = ctx.launch(); s = ctx.session(b, width=1280, stub=None);
  page = s.page(); log = s.log(page); ... r.check("test-id", ok, "detail"); s.close(); ctx.close_browser(b); return r.out
  ctx.base, ctx.site, ctx.widths, ctx.offline, ctx.baseline_dir, ctx.page_files(), ctx.extra.
  Keep test ids stable: known_issues.json matches them with fnmatch globs (plus an optional `contains` on the detail).

KNOWN ISSUES
  known_issues.json entries {id, suite, test, why, fixed_by[, contains]} are tolerated ONLY while
  upgrade-2026-10/verify/e2e/<fixed_by>.json does not exist or its `status` is not `pass`. --strict ignores them all.
  run_all.py --json OUT writes {wp, status, started, finished, suites, failures, known_issues_active}.

SAFETY RULES (baked into lib/site.py)
  * every request to formsubmit.co is aborted AND recorded; any attempt fails the run (harness :: no-formsubmit-requests)
  * tests never click a submit control, never form.submit(), never call the submit handlers
  * window.va is replaced by a recorder (analytics guard: interactions asserts every baseline event name and payload keys still fire)
  * the Vercel insights script 404 is allow-listed; GL driver noise is dropped from console checks
  * the interactions suite seeds the real signup storage key (read from the site's JS, `lsf-modal-state` today) and asserts the
    modal never opens; a positive control proves the assertion can fail
  * serve only on your own port and stop the server when done (the harness does; a crashed run frees the port at exit)
