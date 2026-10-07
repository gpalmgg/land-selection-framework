// Shared helpers for the release checkers (REL-TOOLS). Node ESM, no dependency beyond Node itself.
//
// Common contract of every checker in this folder:
//   * prints one line per assertion: `PASS <check>: <detail>` or `FAIL <check>: <detail>`
//   * exits 1 when any line is FAIL, 0 otherwise
//   * takes `--root DIR` (default: the prototype folder this script lives in) so it runs on the working tree,
//     a scratch site or the pinned baseline copy
//   * exports `run(argv)` (returns a Report) so the unit tests can call it without spawning a process
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const HERE = path.dirname(fileURLToPath(import.meta.url));
export const PROTO = path.resolve(HERE, '..', '..');
export const REPO = path.resolve(PROTO, '..');
export const UPG = path.join(REPO, 'upgrade-2026-10');
export const BASELINES_FILE = path.join(UPG, 'verify', 'baseline', 'release-baselines.json');
export const FORMS_BASELINE = path.join(UPG, 'verify', 'baseline', 'forms.json');
export const EXCLUDED_FILE = path.join(UPG, 'verify', 'baseline', 'excluded-regions.txt');
export const DEPLOY_FILELIST_PY = path.join(PROTO, 'tests', 'e2e', 'tools', 'deploy_filelist.py');

export class Report {
  constructor() { this.rows = []; }
  pass(check, detail = '') { this.rows.push({ ok: true, check, detail }); }
  fail(check, detail = '') { this.rows.push({ ok: false, check, detail }); }
  assert(cond, check, okDetail, failDetail) { cond ? this.pass(check, okDetail) : this.fail(check, failDetail === undefined ? okDetail : failDetail); return !!cond; }
  get failed() { return this.rows.filter((r) => !r.ok); }
  get ok() { return this.rows.length > 0 && this.failed.length === 0; }
  lines() { return this.rows.map((r) => `${r.ok ? 'PASS' : 'FAIL'} ${r.check}: ${String(r.detail).replace(/\s*\n\s*/g, ' ')}`); }
  merge(other) { this.rows.push(...other.rows); return this; }
}

// Minimal option parser. spec = { value: ['root'], flag: ['require-immutable'], list: ['paths'] }.
// `list` options swallow every following token up to the next `--option`. Anything else is positional.
export function parseArgs(argv, spec = {}) {
  const out = { _: [] };
  const value = new Set(spec.value || []);
  const flag = new Set(spec.flag || []);
  const list = new Set(spec.list || []);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const eq = a.indexOf('=');
      const key = eq > 0 ? a.slice(2, eq) : a.slice(2);
      const inline = eq > 0 ? a.slice(eq + 1) : null;
      if (flag.has(key)) { out[key] = true; continue; }
      if (value.has(key)) {
        const v = inline !== null ? inline : argv[++i];
        if (v === undefined) throw new Error(`option --${key} needs a value`);
        out[key] = v; continue;
      }
      if (list.has(key)) {
        const items = [];
        if (inline !== null) items.push(inline);
        while (i + 1 < argv.length && !argv[i + 1].startsWith('--')) items.push(argv[++i]);
        out[key] = (out[key] || []).concat(items);
        continue;
      }
      throw new Error(`unknown option ${a}`);
    }
    out._.push(a);
  }
  return out;
}

export function isMain(importMetaUrl) {
  return !!process.argv[1] && importMetaUrl === pathToFileURL(path.resolve(process.argv[1])).href;
}

// Runs `run(argv)` when the module is the entry point, prints the lines and sets the exit code.
export async function cli(importMetaUrl, name, run) {
  if (!isMain(importMetaUrl)) return;
  let report;
  try {
    report = await run(process.argv.slice(2));
  } catch (e) {
    report = new Report();
    report.fail(name, `crashed: ${e && e.message ? e.message : e}`);
  }
  for (const l of report.lines()) console.log(l);
  process.exit(report.ok ? 0 : 1);
}

export const toPosix = (p) => p.split(path.sep).join('/');

export function readJson(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

export function writeJsonMerged(file, patch) {
  let cur = {};
  try { cur = readJson(file); } catch { cur = {}; }
  const next = { ...cur, ...patch };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(next, null, 2) + '\n');
  return next;
}

export function walk(root, { skipDirs = [], skipPrefixes = [] } = {}) {
  const out = [];
  const skip = new Set(skipDirs);
  const rec = (dir, rel) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (skip.has(e.name) || skipPrefixes.some((p) => r === p || r.startsWith(p + '/'))) continue;
        rec(path.join(dir, e.name), r);
      } else if (e.isFile()) {
        if (skipPrefixes.some((p) => r === p || r.startsWith(p))) continue;
        out.push(r);
      }
    }
  };
  rec(root, '');
  return out.sort();
}

// The summary lines tests/e2e/tools/deploy_filelist.py prints around the list.
const SUMMARY_LINE = /^(deploy list with |UNCHANGED:|DIFFERENT:|absent:|PRESENT under |COUNT MISMATCH|\s+[+-] )/;

// Reads a deploy list produced by deploy_filelist.py.
//   * `--list` output (one relative path per line, plus the summary line) is used as is, summary lines dropped.
//   * Plain output without --list is ONLY the summary (counts, no paths). The gate commands of the plan redirect exactly that,
//     so a summary-only file is expanded by running `deploy_filelist.py --site <root> --list` against the same root.
// Returns { files: string[], expanded: boolean, note: string }.
export function readDeployList(listFile, root) {
  const text = fs.readFileSync(listFile, 'utf8');
  const lines = text.split(/\r?\n/);
  const paths = lines.filter((l) => l.trim() && !SUMMARY_LINE.test(l)).map((l) => l.trim());
  if (paths.length) return { files: [...new Set(paths)].sort(), expanded: false, note: `${paths.length} paths read from ${path.basename(listFile)}` };
  const sawSummary = lines.some((l) => SUMMARY_LINE.test(l));
  if (!sawSummary) return { files: [], expanded: false, note: `${path.basename(listFile)} is empty` };
  const r = spawnSync('/usr/bin/python3', [DEPLOY_FILELIST_PY, '--site', root, '--list'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0 || r.error) throw new Error(`deploy_filelist.py --list failed for ${root}: ${(r.stderr || r.error || '').toString().slice(0, 300)}`);
  const files = r.stdout.split(/\r?\n/).filter((l) => l.trim() && !SUMMARY_LINE.test(l)).map((l) => l.trim());
  return { files: [...new Set(files)].sort(), expanded: true, note: `${path.basename(listFile)} held only the summary; expanded ${files.length} paths with deploy_filelist.py --list --site ${root}` };
}

export const TEXT_EXT = new Set(['.html', '.htm', '.js', '.mjs', '.css', '.json', '.geojson', '.xml', '.txt', '.svg', '.webmanifest']);
export const isTextPath = (p) => TEXT_EXT.has(path.extname(p).toLowerCase());

export function lineOf(text, index) {
  let n = 1;
  for (let i = 0; i < index && i < text.length; i++) if (text.charCodeAt(i) === 10) n++;
  return n;
}

// Same regex the Python scripts use: `id: '<id>',` followed (within one object) by `coords:`.
export function regionIds(regionsJsText) {
  const re = /\bid:\s*'([a-z0-9-]+)',(?:(?!\bid:\s*')[\s\S]){0,600}?\bcoords:/g;
  const ids = [];
  let m;
  while ((m = re.exec(regionsJsText))) ids.push(m[1]);
  return ids;
}

export function stripTags(html) {
  return html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;|&#x27;/g, "'").replace(/&rsquo;/g, '’')
    .replace(/\s+/g, ' ').trim();
}

export function metaContents(html) {
  const out = [];
  const re = /<meta\b[^>]*>/gi;
  let m;
  while ((m = re.exec(html))) {
    const c = /\bcontent\s*=\s*("([^"]*)"|'([^']*)')/i.exec(m[0]);
    if (c) out.push(c[2] !== undefined ? c[2] : c[3]);
  }
  return out;
}

export function allStrings(value, out = [], keyFilter = null) {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) for (const v of value) allStrings(v, out, keyFilter);
  else if (value && typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (keyFilter && !keyFilter(k)) continue;
      allStrings(v, out, keyFilter);
    }
  }
  return out;
}

// Imports a data module (ESM) from a file path without printing Node's typeless-package warning.
export async function importData(file) {
  const orig = process.emitWarning;
  process.emitWarning = () => {};
  try {
    const st = fs.statSync(file);
    return await import(pathToFileURL(file).href + `?m=${st.mtimeMs}-${st.size}`);
  } finally {
    process.emitWarning = orig;
  }
}

export function fmtBytes(n) { return `${n.toLocaleString('en-US')} B`; }
