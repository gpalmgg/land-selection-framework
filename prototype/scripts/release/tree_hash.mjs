#!/usr/bin/env node
// tree_hash.mjs --list FILE [--root DIR]
//
// Prints ONE hex string: the sha256 over the sorted lines `<sha256-of-file> <path>\n` of the deploy list. FILE is the output of
// tests/e2e/tools/deploy_filelist.py (a file holding only its summary is expanded with `--list` against --root, see lib.mjs).
// The gate runner hashes the deploy set before and after the gates and refuses a deploy when the hash moved.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { parseArgs, isMain, PROTO, readDeployList } from './lib.mjs';

export function treeHash(listFile, root) {
  const { files } = readDeployList(path.resolve(listFile), root);
  if (!files.length) throw new Error(`deploy list ${listFile} yields no files`);
  const lines = files.slice().sort().map((f) => {
    const h = crypto.createHash('sha256').update(fs.readFileSync(path.join(root, f))).digest('hex');
    return `${h} ${f}`;
  });
  return crypto.createHash('sha256').update(lines.map((l) => l + '\n').join('')).digest('hex');
}

if (isMain(import.meta.url)) {
  try {
    const o = parseArgs(process.argv.slice(2), { value: ['list', 'root'] });
    if (!o.list) throw new Error('--list FILE is required');
    console.log(treeHash(o.list, path.resolve(o.root || PROTO)));
  } catch (e) {
    console.error(`FAIL tree-hash: ${e.message}`);
    process.exit(1);
  }
}
