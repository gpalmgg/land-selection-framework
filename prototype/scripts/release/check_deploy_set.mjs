#!/usr/bin/env node
// check_deploy_set.mjs --list FILE [--root DIR] [--baseline FILE | --record FILE]
//
// FILE is the output of tests/e2e/tools/deploy_filelist.py (one relative path per line; a file holding only the summary lines
// is expanded with `deploy_filelist.py --site <root> --list`). Checks the would-be upload of `vercel deploy`:
//   * no tests/, scripts/, data/raw/, *.py, *.md, *.bak, staging or research-dossier paths, no .venv or node_modules
//   * no file over 10 MB except the ones the baseline already listed; total bytes at most baseline + 25 MB
//   * every file referenced by an href, src, srcset, url(), @import, static `import ... from` or `import("...")` string literal
//     in the listed HTML, CSS and JS (relative or root-absolute; computed specifiers and external URLs ignored) is in the list,
//     except /_vercel/insights/script.js, /api/* and /share. (Browser-level 404 checks belong to the e2e suite.)
//   --record FILE measures the baseline (file count, total bytes, files above 10 MB) and merges it into FILE.
import fs from 'node:fs';
import path from 'node:path';
import { Report, parseArgs, cli, PROTO, BASELINES_FILE, readJson, writeJsonMerged, readDeployList, fmtBytes, lineOf } from './lib.mjs';

export const MAX_FILE = 10 * 1024 * 1024;
export const TOTAL_ALLOWANCE = 25 * 1024 * 1024;
const FORBIDDEN = [
  ['tests/', /(^|\/)tests?\//],
  ['scripts/', /(^|\/)scripts\//],
  ['data/raw/', /(^|\/)data\/raw\//],
  ['*.py', /\.py$/i],
  ['*.md', /\.md$/i],
  ['*.bak', /\.bak$/i],
  ['staging', /(^|\/)staging\/|\.staging\./i],
  ['research-dossier', /research-dossier/i],
  ['.venv', /(^|\/)\.venv\//],
  ['node_modules', /(^|\/)node_modules\//],
];
const EXEMPT = [/^\/_vercel\//, /^\/api(\/|$)/, /^\/share(\/|$)/];

function cleanRef(raw) {
  let v = String(raw).trim();
  if (!v) return null;
  if (/[\s"'`{}$<>\\|^]|\+/.test(v)) return null;           // computed or not a plain URL
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i.test(v)) return null; // external, data:, mail links, fragment
  v = v.split('#')[0].split('?')[0];
  if (!v || v.endsWith('/')) return null;
  return v;
}

export function extractRefs(text, kind) {
  const refs = [];
  const add = (raw, idx) => { const v = cleanRef(raw); if (v) refs.push({ ref: v, line: lineOf(text, idx) }); };
  let m;
  if (kind === 'html' || kind === 'js') {
    const attr = /\b(?:href|src)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    while ((m = attr.exec(text))) add(m[1] !== undefined ? m[1] : m[2], m.index);
  }
  if (kind === 'html') {
    const ss = /\bsrcset\s*=\s*(?:"([^"]*)"|'([^']*)')/gi;
    while ((m = ss.exec(text))) for (const part of (m[1] !== undefined ? m[1] : m[2]).split(',')) add(part.trim().split(/\s+/)[0], m.index);
  }
  if (kind === 'html' || kind === 'css') {
    const u = /url\(\s*(?:"([^"]*)"|'([^']*)'|([^)\s"']+))\s*\)/gi;
    while ((m = u.exec(text))) add(m[1] !== undefined ? m[1] : m[2] !== undefined ? m[2] : m[3], m.index);
    const imp = /@import\s+(?:url\(\s*)?(?:"([^"]*)"|'([^']*)')/gi;
    while ((m = imp.exec(text))) add(m[1] !== undefined ? m[1] : m[2], m.index);
  }
  if (kind === 'html' || kind === 'js') {
    const st = /\b(?:import|export)\b[^'"`;()]*?\bfrom\s*(?:"([^"]*)"|'([^']*)')/g;
    while ((m = st.exec(text))) add(m[1] !== undefined ? m[1] : m[2], m.index);
    const bare = /\bimport\s*(?:"([^"]*)"|'([^']*)')/g;
    while ((m = bare.exec(text))) add(m[1] !== undefined ? m[1] : m[2], m.index);
    const dyn = /\bimport\s*\(\s*(?:"([^"]*)"|'([^']*)')\s*\)/g;
    while ((m = dyn.exec(text))) add(m[1] !== undefined ? m[1] : m[2], m.index);
  }
  return refs;
}

export function resolveRef(ref, fromRel) {
  const abs = ref.startsWith('/') ? ref : '/' + path.posix.join(path.posix.dirname(fromRel), ref);
  let p = path.posix.normalize(abs);
  try { p = decodeURIComponent(p); } catch { /* keep */ }
  return p;
}

export async function run(argv) {
  const o = parseArgs(argv, { value: ['list', 'root', 'baseline', 'record'] });
  const rep = new Report();
  if (!o.list) { rep.fail('input', '--list FILE is required'); return rep; }
  const root = path.resolve(o.root || PROTO);
  const { files, expanded, note } = readDeployList(path.resolve(o.list), root);
  if (!files.length) { rep.fail('deploy-list', `${o.list} yields no files (${note})`); return rep; }
  const set = new Set(files);

  const bad = [];
  for (const f of files) for (const [label, re] of FORBIDDEN) if (re.test(f)) { bad.push(`${f} (${label})`); break; }
  rep.assert(!bad.length, 'forbidden-paths', `none of ${files.length} listed files is under tests/, scripts/, data/raw/, .venv, node_modules or a *.py, *.md, *.bak, staging or research-dossier path`,
    `${bad.length} forbidden paths in the deploy list: ${bad.slice(0, 8).join(', ')}${bad.length > 8 ? ', ...' : ''}`);

  let total = 0;
  const big = [];
  const missing = [];
  const sizes = new Map();
  for (const f of files) {
    try { const s = fs.statSync(path.join(root, f)); sizes.set(f, s.size); total += s.size; if (s.size > MAX_FILE) big.push({ path: f, bytes: s.size }); } catch { missing.push(f); }
  }
  rep.assert(!missing.length, 'listed-files-exist', `all ${files.length} listed files exist under ${root}`, `${missing.length} listed files missing under ${root}: ${missing.slice(0, 6).join(', ')}`);
  rep.pass('deploy-set', `${files.length} files, ${fmtBytes(total)}, ${big.length} above 10 MB${expanded ? ' (' + note + ')' : ''}`);

  if (o.record) {
    writeJsonMerged(path.resolve(o.record), { deploy: { file_count: files.length, total_bytes: total, files_over_10mb: big }, deploy_recorded_from: root });
    rep.pass('record', `baseline ${files.length} files, ${fmtBytes(total)}, ${big.length} above 10 MB written to ${o.record}`);
  } else {
    const bf = path.resolve(o.baseline || BASELINES_FILE);
    let base = null;
    try { base = readJson(bf).deploy; } catch { /* reported below */ }
    if (!base) rep.fail('baseline', `no recorded deploy baseline in ${bf} (run with --record on the baseline copy)`);
    else {
      const allowed = new Set((base.files_over_10mb || []).map((b) => b.path));
      const over = big.filter((b) => !allowed.has(b.path));
      rep.assert(!over.length, 'file-size', `no file above 10 MB except the ${allowed.size} baseline-listed`, `files above 10 MB that the baseline did not have: ${over.map((b) => `${b.path} ${fmtBytes(b.bytes)}`).join(', ')}`);
      const limit = base.total_bytes + TOTAL_ALLOWANCE;
      rep.assert(total <= limit, 'total-size', `${fmtBytes(total)} <= baseline ${fmtBytes(base.total_bytes)} + 25 MB (${files.length} files; baseline ${base.file_count})`, `${fmtBytes(total)} exceeds baseline ${fmtBytes(base.total_bytes)} + 25 MB = ${fmtBytes(limit)}`);
    }
  }

  // references
  const dead = [];
  let refCount = 0;
  for (const f of files) {
    const ext = path.extname(f).toLowerCase();
    const kind = ext === '.html' || ext === '.htm' ? 'html' : ext === '.css' ? 'css' : ext === '.js' || ext === '.mjs' ? 'js' : null;
    if (!kind || !sizes.has(f) || /^vendor\/maplibre/.test(f)) continue;
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    for (const { ref, line } of extractRefs(text, kind)) {
      const abs = resolveRef(ref, f);
      if (EXEMPT.some((re) => re.test(abs))) continue;
      refCount++;
      const rel = abs.replace(/^\//, '');
      if (!set.has(rel)) dead.push(`${f}:${line} -> ${ref}`);
    }
  }
  rep.assert(!dead.length, 'references', `${refCount} string-literal references in listed HTML, CSS and JS all point to listed files`,
    `${dead.length} references point to files that are not in the deploy list: ${dead.slice(0, 10).join('; ')}${dead.length > 10 ? '; ...' : ''}`);
  return rep;
}

cli(import.meta.url, 'check_deploy_set', run);
