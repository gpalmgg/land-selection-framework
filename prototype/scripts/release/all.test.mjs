// Entry point of `node --test scripts/release`: Node 25 runs a directory argument as a module, which resolves through
// package.json "main" to this file. Every *.test.mjs of the folder is imported here so one command runs them all.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.dirname(fileURLToPath(import.meta.url));
for (const f of fs.readdirSync(dir).filter((n) => n.endsWith('.test.mjs') && n !== 'all.test.mjs').sort()) await import(`./${f}`);
