// For a list of share-link query strings, compute what a site's lib/result.js and data give: match count, total and the matching
// region ids/names for the default (Europe) view and for North America. Used by capture_baseline.py to write
// upgrade-2026-10/verify/baseline/share-links.json from the PINNED baseline copy (EV-INT-REGIONS and MC-SCALE read it).
//
//   node share_links.mjs --site /path/to/prototype --queries queries.json      (queries.json: ["", "?t.water_stress=0.3", ...])
//
// The site's lib/result.js is imported as it is: edge-function logic, no browser.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const args = process.argv.slice(2);
const opt = (name) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : null; };
const site = resolve(opt('--site') || '.');
const queries = JSON.parse(readFileSync(opt('--queries'), 'utf8'));

const { computeResult } = await import(pathToFileURL(resolve(site, 'lib/result.js')).href);
const { regions } = await import(pathToFileURL(resolve(site, 'data/regions.js')).href);
const nameOf = Object.fromEntries(regions.map((r) => [r.id, r.name]));

const view = (res) => ({
  count: res.matching.length,
  total: res.total,
  ids: res.matching.map((r) => r.id),
  names: res.matching.map((r) => nameOf[r.id]),
});

const out = queries.map((q) => {
  const params = new URLSearchParams(q.startsWith('?') ? q.slice(1) : q);
  const eu = computeResult(params, 'europe');
  const na = computeResult(params, 'north-america');
  return {
    query: q,
    active_thresholds: eu.active.map((c) => c.id),
    pins: eu.pins,
    europe: view(eu),
    north_america: view(na),
    ignored_by_lib_result: [...params.keys()].filter((k) => !k.startsWith('t.') && k !== 'pin'),
  };
});
process.stdout.write(JSON.stringify(out));
