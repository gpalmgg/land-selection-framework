#!/usr/bin/env node
// Replay the baseline share links against the baseline and the final data (plan review issue F11, policy P-CELL).
//
//   node scripts/evidence/replay_share_links.mjs [--out FILE.md] [--links FILE.json] [--baseline DIR] [--json]
//
// For every link recorded by MC-BASE in upgrade-2026-10/verify/baseline/share-links.json it computes the matching regions
//   * with the BASELINE code and data (the 6bce1a3 archive: verify/baseline-site/prototype/lib/result.js + data/regions.js), and
//   * with the FINAL code and data (this tree: lib/result.js computeResult),
// for both continents, and writes a table: link, baseline count and names, final count and names, difference (regions
// that now match and regions that no longer do). Old links keep their keys but a threshold now filters different numbers,
// so the SHIFT IS REPORTED, never blocked: the exit code is 0 unless a replay cannot be computed or the baseline replay does
// not reproduce the matching sets MC-BASE recorded (that would mean this harness, not the data, is wrong).
// Zero dependencies. Never writes outside --out.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROTO = path.resolve(HERE, '..', '..');
const REPO = path.resolve(PROTO, '..');
const UPG = path.join(REPO, 'upgrade-2026-10');

const args = process.argv.slice(2);
const opt = (name, dflt) => { const i = args.indexOf(`--${name}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt; };
const outFile = opt('out', null);
const linksFile = path.resolve(opt('links', path.join(UPG, 'verify/baseline/share-links.json')));
const baseDir = path.resolve(opt('baseline', path.join(UPG, 'verify/baseline-site/prototype')));
const asJson = args.includes('--json');

const die = (msg) => { process.stderr.write(`replay_share_links: ${msg}\n`); process.exit(1); };
if (!fs.existsSync(linksFile)) die(`share-links file not found: ${linksFile}`);
if (!fs.existsSync(path.join(baseDir, 'lib/result.js'))) die(`baseline lib/result.js not found under ${baseDir}`);

// The baseline archive has no package.json "type": copy-free import by file URL works through Node's module syntax detection.
const load = async (dir) => {
  const res = await import(pathToFileURL(path.join(dir, 'lib/result.js')).href);
  const dat = await import(pathToFileURL(path.join(dir, 'data/regions.js')).href);
  return { computeResult: res.computeResult, regions: dat.regions, criteria: dat.criteria };
};
const base = await load(baseDir).catch((e) => die(`cannot load the baseline code: ${e.message}`));
const fin = await load(PROTO).catch((e) => die(`cannot load the final code: ${e.message}`));

const links = JSON.parse(fs.readFileSync(linksFile, 'utf8'));
const CONTINENTS = [['europe', 'Europe'], ['north-america', 'North America']];
const nameOf = (data) => Object.fromEntries(data.regions.map((r) => [r.id, r.name]));
const bName = nameOf(base);
const fName = nameOf(fin);

const run = (impl, search, continent) => {
  const r = impl.computeResult(new URLSearchParams(search), continent);
  return { ids: r.matching.map((x) => x.id), total: r.total, pins: r.pins, active: r.active.map((c) => c.id) };
};
const list = (ids, names) => (ids.length ? ids.map((i) => names[i] || i).join(', ') : 'none');

const rows = [];
const problems = [];
for (const l of links) {
  const search = (l.query || '').replace(/^\?/, '');
  const known = new Set(fin.criteria.map((c) => c.id));
  const keys = [...new URLSearchParams(search).keys()].filter((k) => k.startsWith('t.')).map((k) => k.slice(2));
  const unknownKeys = keys.filter((k) => !known.has(k));
  for (const [cont, contLabel] of CONTINENTS) {
    const b = run(base, search, cont);
    const f = run(fin, search, cont);
    // The harness check: the baseline replay must equal the matching set MC-BASE recorded for this link.
    const rec = cont === 'europe' ? l.lib_result && l.lib_result.europe : l.lib_result && l.lib_result.north_america;
    if (rec && JSON.stringify(rec.ids) !== JSON.stringify(b.ids)) problems.push(`${l.id} ${l.query || '(no query)'} ${cont}: baseline replay [${b.ids.join(',')}] differs from the recorded [${rec.ids.join(',')}]`);
    const baseIds = new Set(base.regions.map((x) => x.id));
    const gained = f.ids.filter((i) => !b.ids.includes(i) && baseIds.has(i)); // existing region that now passes
    const added = f.ids.filter((i) => !baseIds.has(i)); // region that did not exist at 6bce1a3
    const lost = b.ids.filter((i) => !f.ids.includes(i));
    rows.push({ link: l.path || `/${l.query || ''}`, label: l.label, id: l.id, continent: contLabel, base: b, final: f, gained, added, lost, unknownKeys, active: f.active });
  }
}

if (asJson) process.stdout.write(`${JSON.stringify({ rows, problems }, null, 2)}\n`);

const esc = (s) => String(s).replace(/\|/g, '\\|');
const changed = rows.filter((r) => r.gained.length || r.lost.length);
const slateOnly = rows.filter((r) => !r.gained.length && !r.lost.length && r.added.length);
const lines = [];
lines.push('# Share-link replay: the 10 baseline links before and after the data integration');
lines.push('');
lines.push(`Generated by \`scripts/evidence/replay_share_links.mjs\` from ${path.relative(REPO, linksFile)} (recorded by MC-BASE). "Baseline" is the 6bce1a3 archive (code and data); "final" is lib/result.js computeResult over the integrated data/regions.js. A shared link keeps its keys but a threshold now filters different numbers (pipeline values replaced dossier midpoints; the region slate grew), so a link can match different regions than the sharer saw. This is REPORTED, not blocked (review issue F11). Threshold links carry no continent, so both continents are replayed.`);
lines.push('');
lines.push(`${links.length} links x 2 continents = ${rows.length} replays; ${changed.length} replay(s) now match a different set of the regions that existed at 6bce1a3 (a region gained or lost on the new numbers); ${slateOnly.length} more only gain the regions added to the slate (no 6bce1a3 region changed); ${rows.length - changed.length - slateOnly.length} are unchanged.`);
lines.push('');
if (problems.length) {
  lines.push('## Harness check FAILED: the baseline replay does not reproduce the recorded matching sets', '');
  for (const p of problems) lines.push(`- ${p}`);
  lines.push('');
} else {
  lines.push('Harness check: the baseline replay reproduces the matching set MC-BASE recorded for every link and continent.', '');
}
lines.push('| link | continent | baseline count | baseline regions | final count | final regions | difference |');
lines.push('|---|---|---|---|---|---|---|');
for (const r of rows) {
  const diff = !r.gained.length && !r.lost.length && !r.added.length ? 'unchanged'
    : [r.gained.length ? `now also matches (existing region, new numbers): ${list(r.gained, fName)}` : '', r.lost.length ? `no longer matches: ${list(r.lost, bName)}` : '', r.added.length ? `matches ${r.added.length} region(s) added to the slate: ${list(r.added, fName)}` : ''].filter(Boolean).join('; ');
  lines.push(`| \`${esc(r.link)}\` (${esc(r.label)}) | ${r.continent} | ${r.base.ids.length} of ${r.base.total} | ${esc(list(r.base.ids, bName))} | ${r.final.ids.length} of ${r.final.total} | ${esc(list(r.final.ids, fName))} | ${esc(diff)}${r.unknownKeys.length ? `; criterion key(s) ${r.unknownKeys.join(', ')} unknown to the final data` : ''} |`);
}
lines.push('');
lines.push('## Reading this table');
lines.push('');
lines.push('- "Now also matches" are regions that existed at 6bce1a3, did not pass the link\'s thresholds on the baseline numbers and pass on the pipeline numbers; "no longer matches" are the reverse; "added to the slate" are the new regions.  Neither is a ranking: they are the same filters over different, reproducible numbers.');
lines.push('- Pins (`?pin=<id>`) are shortlist membership and do not filter; a pinned id that is not in the data is dropped.');
lines.push('- Qualitative parameters (`?q.*`) and `?modal=1` are not read by lib/result.js on either side, so those links replay as the neutral entry.');
lines.push('');
const text = `${lines.join('\n')}\n`;
if (outFile) {
  fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
  fs.writeFileSync(path.resolve(outFile), text);
  process.stdout.write(`replay_share_links: ${rows.length} replays, ${changed.length} changed, wrote ${outFile}\n`);
} else if (!asJson) process.stdout.write(text);
if (problems.length) { process.stderr.write(`replay_share_links: HARNESS CHECK FAILED\n  ${problems.join('\n  ')}\n`); process.exit(1); }
