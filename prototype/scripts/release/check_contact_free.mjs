#!/usr/bin/env node
// check_contact_free.mjs (--list FILE | --paths P...) [--root DIR] [--forms FILE] [--excluded FILE] [--handle H]
//
// G9: nothing deployed may carry a personal contact detail, a dead host or an internal path, and the list of regions
// that were left off the slate (upgrade-2026-10/regions/selection.md) must never be published.
// Scans every text file (html js mjs css json geojson xml txt svg webmanifest; vendor/maplibre* and vendor/fonts are skipped)
// of the deploy list (--list) or of the given files and folders (--paths, relative to --root) and FAILS on:
//   an email address, a mail-link or phone-link scheme, vercel.app, upgrade-2026-10, the GitHub handle of `git remote get-url origin`
//   (read at run time, never written here), instagram.com/, substack.com, and any name from
//   upgrade-2026-10/verify/baseline/excluded-regions.txt (one name per line, optional `allow: <name> @ <file or folder/>` lines;
//   kept outside the committed scripts).
// The only allowed exception is the FormSubmit endpoint https://formsubmit.co/[ajax/]<hash> with the hash of the
// baseline forms.json; a formsubmit.co URL carrying anything else (an email address, a different token) FAILS.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Report, parseArgs, cli, PROTO, FORMS_BASELINE, EXCLUDED_FILE, readJson, readDeployList, isTextPath, lineOf, walk } from './lib.mjs';

const IMAGE_LIKE_TLD = new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'avif', 'svg', 'css', 'js', 'mjs', 'json', 'ico', 'woff', 'woff2', 'ttf', 'mp4', 'webm', 'map']);
const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
const FORMSUBMIT_URL = /formsubmit\.co\/[^\s"'<>)\\]*/gi;
const MAIL = 'mail' + 'to:';
const PHONE = 'te' + 'l:';
const FIXED = [
  // spelled in two parts so this source never contains the literal schemes (the pre-commit contact grep reads added lines)
  [MAIL, new RegExp(MAIL, 'i')],
  [PHONE, new RegExp('(?<![A-Za-z0-9])' + PHONE, 'i')],
  ['vercel.app', /vercel\.app/i],
  ['upgrade-2026-10', /upgrade-2026-10/i],
  ['instagram.com/', /instagram\.com\//i],
  ['substack.com', /substack\.com/i],
];
const SKIP_PREFIXES = ['vendor/maplibre', 'vendor/fonts'];

// Accents and apostrophes are ignored on both sides, so a name matches its plain spelling too.
const foldKeep = (s) => s.normalize('NFD').replace(/\p{M}/gu, '').replace(/[\x27`\p{Pi}\p{Pf}]/gu, '');
const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Whole-word match. Short single-word names (six letters or fewer) are case-sensitive so ordinary words do not trip it.
export function nameRegex(name) {
  const f = foldKeep(name);
  const caseSensitive = !/[\s-]/.test(f) && f.length <= 6;
  return new RegExp(`(?<![\\p{L}\\p{N}])${escRe(f)}(?![\\p{L}\\p{N}])`, caseSensitive ? 'u' : 'iu');
}

export function githubHandle(root) {
  const r = spawnSync('git', ['-C', root, 'remote', 'get-url', 'origin'], { encoding: 'utf8' });
  if (r.status !== 0) return null;
  const m = /github\.com[:/]+([^/\s]+)\//i.exec(r.stdout.trim());
  return m ? m[1] : null;
}

function formsubmitHash(file) {
  try {
    const j = readJson(file);
    const hashes = new Set();
    for (const f of j.forms || []) { const m = /formsubmit\.co\/(?:ajax\/)?([0-9a-f]{16,})/i.exec(f.action || ''); if (m) hashes.add(m[1]); }
    return [...hashes];
  } catch { return null; }
}

// excluded-regions.txt: one name per line; `#` comments; optional `allow: <name> @ <path or path/>` lines that tolerate that name
// in that file (or under that folder), e.g. an ecoregion label inside a map-layer data file. Every allow line is a recorded,
// reviewable decision: the default file ships only the ones its header comment explains.
function excludedNames(file) {
  let lines;
  try { lines = fs.readFileSync(file, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')); } catch { return null; }
  const names = [];
  const allow = [];
  for (const l of lines) {
    const m = /^allow:\s*(.+?)\s*@\s*(\S+)$/i.exec(l);
    if (m) allow.push({ name: foldKeep(m[1]).toLowerCase(), path: m[2] });
    else names.push(l);
  }
  return { names, allow };
}

// Files that .vercelignore keeps off the deploy (raw scratch data, staged data, test files, tests/ folders). A folder walk skips
// them so `--paths data lib` checks what ships; a file named explicitly on the command line is always scanned.
const NOT_SERVED = /(^|\/)(data\/raw|data\/aqueduct-extract|data\/research-dossier|data\/footprints-full|\.fetch-cache|tests?|e2e|tools|node_modules)\/|\.staging\.[a-z]+$|\.(test|spec)\.m?js$|\.py$/;

function expandPaths(root, paths, rep) {
  const files = [];
  for (const p of paths) {
    const abs = path.resolve(root, p);
    if (!fs.existsSync(abs)) { rep.fail('path', `${p} does not exist under ${root}`); continue; }
    if (fs.statSync(abs).isDirectory()) {
      const dir = p.split(path.sep).join('/').replace(/\/$/, '');
      for (const f of walk(abs)) if (!NOT_SERVED.test(path.posix.join(dir, f))) files.push(path.posix.join(dir, f));
    } else files.push(p.split(path.sep).join('/'));
  }
  return files.map((f) => path.posix.normalize(f));
}

export async function run(argv) {
  const o = parseArgs(argv, { value: ['list', 'root', 'forms', 'excluded', 'handle'], list: ['paths'] });
  const root = path.resolve(o.root || PROTO);
  const rep = new Report();
  let files;
  if (o.list) {
    const l = readDeployList(path.resolve(o.list), root);
    files = l.files;
    if (!files.length) { rep.fail('input', `deploy list ${o.list} yields no files`); return rep; }
  } else if (o.paths && o.paths.length) {
    files = expandPaths(root, o.paths, rep);
  } else { rep.fail('input', 'give --list FILE or --paths P...'); return rep; }

  const hashes = formsubmitHash(path.resolve(o.forms || FORMS_BASELINE));
  if (!hashes) rep.fail('forms baseline', `cannot read the FormSubmit hash from ${o.forms || FORMS_BASELINE}: every formsubmit.co URL will fail`);
  const excluded = excludedNames(path.resolve(o.excluded || EXCLUDED_FILE));
  const names = excluded ? excluded.names : null;
  const allow = excluded ? excluded.allow : [];
  if (!names || !names.length) rep.fail('excluded-regions', `${o.excluded || EXCLUDED_FILE} is missing or empty: the excluded-region check cannot run`);
  const handle = o.handle !== undefined ? o.handle : githubHandle(root);
  const handleRe = handle ? new RegExp(`(?<![A-Za-z0-9_-])${handle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![A-Za-z0-9_-])`, 'i') : null;
  const foldedNames = (names || []).map((n) => ({ n, re: nameRegex(n) }));

  let scanned = 0;
  let allowed = 0;
  const hits = [];
  const seenFiles = new Set();
  for (const rel of files) {
    if (seenFiles.has(rel)) continue;
    seenFiles.add(rel);
    if (!isTextPath(rel) || SKIP_PREFIXES.some((p) => rel === p || rel.startsWith(p))) continue;
    const abs = path.join(root, rel);
    let text;
    try { text = fs.readFileSync(abs, 'utf8'); } catch { rep.fail('read', `${rel}: not readable under ${root}`); continue; }
    scanned++;
    // FormSubmit endpoints: only the baseline hash is allowed; the URL is then blanked so the hash cannot trip other patterns.
    let body = text.replace(FORMSUBMIT_URL, (m, off) => {
      const ok = hashes && hashes.some((h) => m.includes(h)) && !/@/.test(m);
      if (!ok) hits.push(`${rel}:${lineOf(text, off)} formsubmit endpoint with an unknown token or an email (${m.slice(0, 60)})`);
      return ' '.repeat(m.length);
    });
    for (const [label, re] of FIXED) {
      const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
      let m;
      while ((m = g.exec(body))) { hits.push(`${rel}:${lineOf(body, m.index)} ${label}`); if (hits.length > 400) break; }
    }
    EMAIL.lastIndex = 0;
    let m;
    while ((m = EMAIL.exec(body))) {
      const tld = m[0].slice(m[0].lastIndexOf('.') + 1).toLowerCase();
      if (IMAGE_LIKE_TLD.has(tld)) continue;
      hits.push(`${rel}:${lineOf(body, m.index)} email address (${m[0].replace(/^(.{2}).*(@.*)$/, '$1...$2')})`);
    }
    if (handleRe) { const hm = handleRe.exec(body); if (hm) hits.push(`${rel}:${lineOf(body, hm.index)} GitHub handle`); }
    if (foldedNames.length) {
      const fb = foldKeep(body);
      for (const { n, re } of foldedNames) {
        if (!re.test(fb)) continue;
        const key = foldKeep(n).toLowerCase();
        if (allow.some((a) => a.name === key && (rel === a.path || (a.path.endsWith('/') && rel.startsWith(a.path))))) { allowed++; continue; }
        hits.push(`${rel} names an excluded region (${n})`);
      }
    }
  }
  if (!hits.length) rep.pass('contact-free', `${scanned} text files scanned: no email, mail or phone link, vercel.app, internal path, GitHub handle, instagram.com/, substack.com or excluded-region name${allowed ? ` (${allowed} listed allow: exception${allowed === 1 ? '' : 's'} applied)` : ''}`);
  else {
    const uniq = [...new Set(hits)];
    for (const h of uniq.slice(0, 60)) rep.fail('contact-free', h);
    if (uniq.length > 60) rep.fail('contact-free', `... and ${uniq.length - 60} more findings`);
  }
  if (handle === null && o.handle === undefined) rep.pass('github-handle', 'no git origin remote: handle check not applicable');
  return rep;
}

cli(import.meta.url, 'check_contact_free', run);
