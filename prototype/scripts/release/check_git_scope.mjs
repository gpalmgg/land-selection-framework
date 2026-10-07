#!/usr/bin/env node
// check_git_scope.mjs [--repo DIR] [--status-file FILE]
//
// `git status --porcelain=v1 -z` may list only paths under prototype/, source-docs/ and docs/, and the files README.md,
// invitation.md, CONTRIBUTING.md, FRAMEWORK.md, "Land Selection Framework.pdf" and r4-reciprocity-commentary-DRAFT.md.
// Never CLAUDE.md, never .gitignore, never anything under upgrade-2026-10/ (8 GB of working data, scraped third-party contact
// details and the excluded-region list; origin is a public repository). A deleted path under source-docs/ also FAILS
// (the source documents are immutable: additions only). --status-file reads saved `-z` output instead of running git.
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { Report, parseArgs, cli, REPO } from './lib.mjs';

export const ALLOWED_DIRS = ['prototype/', 'source-docs/', 'docs/'];
export const ALLOWED_FILES = ['README.md', 'invitation.md', 'CONTRIBUTING.md', 'FRAMEWORK.md', 'Land Selection Framework.pdf', 'r4-reciprocity-commentary-DRAFT.md'];

export function parsePorcelainZ(out) {
  const parts = out.split('\0');
  const entries = [];
  for (let i = 0; i < parts.length; i++) {
    const e = parts[i];
    if (!e) continue;
    const xy = e.slice(0, 2);
    const p = e.slice(3);
    entries.push({ xy, path: p });
    if (/[RC]/.test(xy)) { i++; if (parts[i]) entries.push({ xy: '  ', path: parts[i], from: true }); } // the source path of a rename/copy
  }
  return entries;
}

export async function run(argv) {
  const o = parseArgs(argv, { value: ['repo', 'status-file'] });
  const rep = new Report();
  let out;
  if (o['status-file']) out = fs.readFileSync(path.resolve(o['status-file']), 'utf8');
  else {
    const r = spawnSync('git', ['-C', path.resolve(o.repo || REPO), 'status', '--porcelain=v1', '-z', '--untracked-files=all'], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
    if (r.status !== 0) { rep.fail('git-status', `git status failed: ${(r.stderr || '').trim().slice(0, 200)}`); return rep; }
    out = r.stdout;
  }
  const entries = parsePorcelainZ(out);
  const bad = [];
  for (const { xy, path: p } of entries) {
    const okDir = ALLOWED_DIRS.some((d) => p.startsWith(d));
    const okFile = ALLOWED_FILES.includes(p);
    if (!okDir && !okFile) bad.push(`${p} (${xy.trim() || 'rename source'})`);
    else if (p.startsWith('source-docs/') && /D/.test(xy)) bad.push(`${p} (deleted: source-docs are immutable, additions only)`);
  }
  rep.assert(!bad.length, 'git-scope', `${entries.length} changed paths, all inside prototype/, source-docs/, docs/ or the listed top-level files`,
    `${bad.length} paths outside the commit scope: ${bad.slice(0, 10).join(', ')}${bad.length > 10 ? ', ...' : ''}`);
  return rep;
}

cli(import.meta.url, 'check_git_scope', run);
