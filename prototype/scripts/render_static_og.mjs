#!/usr/bin/env node
// Re-render the two static Open Graph fallbacks from the same card functions the edge function uses:
//   og.png         the brand card (api/og with no query)   : the 302 target when the edge function fails, and the home page's og:image
//   og-deeper.png  the in-depth card (api/og?page=deeper)   : the fallback for deeper.html
//
//   node scripts/render_static_og.mjs [--out-dir DIR]      (default: the prototype/ this script lives in)
//
// Plain Node, no network: the three fonts are read from vendor/fonts on disk, exactly the files api/og.js fetches from the same
// origin. The orphan og-{alentejo,connemara,galicia,transylvania,filtered}.png in the site root are NOT touched (nothing links to
// them; the orchestrator decides about deleting them).
import { writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PROTO = resolve(join(here, '..'));
const args = process.argv.slice(2);
const at = args.indexOf('--out-dir');
const OUT = resolve(at >= 0 ? args[at + 1] : PROTO);
mkdirSync(OUT, { recursive: true });

// package.json has no "type": node prints a MODULE_TYPELESS warning for the data modules; silence it.
const _emit = process.emitWarning;
process.emitWarning = (w, ...a) => (String(w).includes('MODULE_TYPELESS') || String(a[0]?.code || a[0]).includes('MODULE_TYPELESS') ? undefined : _emit.call(process, w, ...a));

const { ImageResponse } = await import(pathToFileURL(join(PROTO, 'node_modules/@vercel/og/dist/index.node.js')).href);
const { cardFor, homeCard, FONT_FILES } = await import(pathToFileURL(join(PROTO, 'lib/og-card.js')).href);

const fonts = FONT_FILES.map((f) => ({ name: f.name, data: readFileSync(join(PROTO, f.path)), style: f.style, weight: f.weight }));
// The static brand card carries no region count: a file cannot follow the data, so it says "A bioregioning tool" and nothing typed
// goes stale if the slate changes. (The dynamic default card, api/og with no query, prints the count from the data.)
const jobs = [['og.png', () => homeCard({}), 'brand card, no count'], ['og-deeper.png', () => cardFor(new URLSearchParams('page=deeper')).tree, 'in-depth card']];
for (const [file, make] of jobs) {
  const tree = make();
  const res = new ImageResponse(tree, { width: 1200, height: 630, fonts });
  const buf = Buffer.from(await res.arrayBuffer());
  writeFileSync(join(OUT, file), buf);
  console.log(`${file.padEnd(14)} ${buf.length} bytes -> ${join(OUT, file)}`);
}
