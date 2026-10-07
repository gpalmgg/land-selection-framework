// Node >= 21 treats `node --test <dir>` as a module path, not a directory to scan.
// This entry makes `node --test tests/core` work: it imports every *.test.mjs in this folder.
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
for (const f of readdirSync(here).filter((n) => n.endsWith('.test.mjs')).sort()) {
  await import(new URL(f, import.meta.url).href);
}
