#!/usr/bin/env node
// Prints every region as JSON: [{ id, continent, lon, lat, name }].
//
//   node scripts/evidence/dump_regions.mjs              regions in data/regions.js
//   node scripts/evidence/dump_regions.mjs --with-new   plus the shipped new regions
//
// The region list is read from data, never typed here. New regions are not in
// data/regions.js until the integration WP lands, so with --with-new they are read from
// upgrade-2026-10/regions/<id>/data.json, kept only when verify.md carries a ship or
// ship-with-gaps verdict and the id is not listed in upgrade-2026-10/verify/dropped-regions.json.
// Once a region is in data/regions.js the regions.js entry wins (no duplicates).

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const proto = resolve(here, '..', '..');
const root = resolve(proto, '..');
const upgrade = join(root, 'upgrade-2026-10');

const withNew = process.argv.includes('--with-new');

// data/*.js are ESM without a package.json "type"; Node reparses them and warns on stderr.
process.removeAllListeners('warning');

const { regions } = await import(pathToFileURL(join(proto, 'data', 'regions.js')).href);

const out = [];
const seen = new Set();
function add(r, lon, lat) {
  if (seen.has(r.id)) return;
  if (!Number.isFinite(lon) || !Number.isFinite(lat)) {
    throw new Error(`region ${r.id}: marker coords missing or not numeric`);
  }
  seen.add(r.id);
  out.push({ id: r.id, continent: r.continent, lon, lat, name: r.name });
}

for (const r of regions) add(r, Number(r.coords[0]), Number(r.coords[1]));

function droppedIds() {
  const f = join(upgrade, 'verify', 'dropped-regions.json');
  if (!existsSync(f)) return new Set();
  const j = JSON.parse(readFileSync(f, 'utf8'));
  const list = Array.isArray(j) ? j : Array.isArray(j.dropped) ? j.dropped : Object.keys(j);
  return new Set(list.map((e) => (typeof e === 'string' ? e : e && e.id)).filter(Boolean));
}

// Verdict lives on the first non-empty line ("VERDICT: ship-with-gaps", "Verdict: ship", or a
// bare "ship"), else on the line after a "## Verdict" heading.
function verdictOf(file) {
  if (!existsSync(file)) return null;
  const lines = readFileSync(file, 'utf8').split('\n').map((l) => l.trim());
  const norm = (s) => {
    const m = /^(?:verdict:\s*)?(ship-with-gaps|ship|drop(?:ped)?|do-not-ship)\b/i.exec(s.replace(/[*_`#]/g, '').trim());
    return m ? m[1].toLowerCase() : null;
  };
  const first = lines.find((l) => l.length);
  const direct = first ? norm(first) : null;
  if (direct) return direct;
  const idx = lines.findIndex((l) => /^#+\s*verdict/i.test(l));
  if (idx >= 0) {
    for (const l of lines.slice(idx + 1)) {
      if (l.length) return norm(l);
    }
  }
  return null;
}

if (withNew) {
  const dropped = droppedIds();
  const regionsDir = join(upgrade, 'regions');
  const ids = readdirSync(regionsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(join(regionsDir, d.name, 'data.json')))
    .map((d) => d.name)
    .sort();
  for (const id of ids) {
    if (dropped.has(id)) continue;
    const v = verdictOf(join(regionsDir, id, 'verify.md'));
    if (v !== 'ship' && v !== 'ship-with-gaps') continue;
    const j = JSON.parse(readFileSync(join(regionsDir, id, 'data.json'), 'utf8'));
    const r = j.region;
    if (!r || r.id !== id) throw new Error(`regions/${id}/data.json: region.id mismatch`);
    add(r, Number(r.coords[0]), Number(r.coords[1]));
  }
}

process.stdout.write(JSON.stringify(out, null, 1) + '\n');
