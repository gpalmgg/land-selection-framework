#!/usr/bin/env node
// Convert the re-verification corrections (upgrade-2026-10/reverify/*.json) into machine-applicable patches.
//
//   node scripts/evidence/merge/reverify_to_patches.mjs --summary       print the counts, write nothing
//   node scripts/evidence/merge/reverify_to_patches.mjs --index         write evidence-out/reverify-index.json + unverifiable.json
//   node scripts/evidence/merge/reverify_to_patches.mjs [--dry-run]     write patches.json, needs-hand.json, deferred-low.json,
//                                                                       deeper-change-list.json, held-by-converter.json (+ the index)
//
// Rules (plan: tracks/evidence.md 7.1, plus the 2026-10-05 review revisions)
//  * high and medium corrections with a mechanically understood path become patches (data/regions.js, land-standing.js,
//    region-depth.js, and the processed JSON that the v1 lookup is generated from). Every patch carries `old`, asserted at
//    apply time. The converter never guesses: a path it cannot read goes to needs-hand.json with the reason.
//  * low corrections are never applied: deferred-low.json.
//  * deeper.html corrections are handed to the docs track as deeper-change-list.json; dossier markdown corrections are
//    recorded only (they live in the index).
//  * HOLD RULE: a correction whose own `reason` matches /needs human review|human review (advised|before|required)/i is
//    never emitted into patches.json. It goes to held-by-converter.json with state `held-human-review` and the full
//    proposed text. The rule is mechanical, so a future reverify file is held the same way.
import path from 'node:path';
import {
  parseArgs, resolveRoots, loadReverify, readJson, exists, writeJsonIfChanged, targetKind, confidenceOf, buildIndex,
  HOLD_RE, OWNER_BY_KIND, printLine, isMain,
} from './common.mjs';

const LAYER_KEYS = {
  legal_ownership: 'legal-ownership', land_cost: 'land-cost', demographic_trajectory: 'demographic-trajectory',
  soil_contamination: 'soil-contamination', water_source_control: 'water-source-control', climate_buffering: 'climate-buffering',
};
const FILE_OF = { regions: 'data/regions.js', landStanding: 'data/land-standing.js', regionDepth: 'data/region-depth.js' };
const EXPORT_OF = { landStanding: 'landStanding', regionDepth: 'regionDepth' };

// Tokenise a dotted/bracketed path: values.alentejo.climate.value, values['estonia-rural'].x, regions[id='x'].blurb,
// land-standing.estonia-rural.entry, legal_ownership['x'].notes, x.preemption_or_first_claim_holders[0].
export function tokenisePath(p) {
  const toks = [];
  let i = 0;
  while (i < p.length) {
    const c = p[i];
    if (c === '.') { i++; continue; }
    if (c === '[') {
      const e = p.indexOf(']', i);
      if (e < 0) return null;
      const inner = p.slice(i + 1, e).trim();
      let m;
      if ((m = /^(['"])(.*)\1$/.exec(inner))) toks.push({ key: m[2] });
      else if ((m = /^(\d+)$/.exec(inner))) toks.push({ key: `[${m[1]}]`, index: true });
      else if ((m = /^([A-Za-z_$][\w$]*)\s*=\s*(['"]?)([^'"]*)\2$/.exec(inner))) toks.push({ key: `[${m[1]}=${m[3]}]`, selector: { k: m[1], v: m[3] } });
      else return null;
      i = e + 1;
      continue;
    }
    if (c === "'" || c === '"') {
      const e = p.indexOf(c, i + 1);
      if (e < 0) return null;
      toks.push({ key: p.slice(i + 1, e) });
      i = e + 1;
      continue;
    }
    const m = /^[A-Za-z0-9_$][A-Za-z0-9_$-]*/.exec(p.slice(i));
    if (!m) return null;
    toks.push({ key: m[0] });
    i += m[0].length;
  }
  return toks;
}

function isJsonStringArray(text) {
  try { const v = JSON.parse(text); return Array.isArray(v) && v.every((x) => typeof x === 'string'); } catch { return false; }
}

function stripParenthetical(p) {
  const m = /\s*\(([^()]*)\)\s*$/.exec(p);
  return m ? { path: p.slice(0, m.index), paren: m[1] } : { path: p, paren: null };
}

// Decide the target of one correction. Returns { ok, file, parts, numeric, supersede, secondary } or { ok:false, why }.
export function normalise(c, ctx) {
  const kind = targetKind(c.file);
  if (kind === 'dossier' || kind === 'deeper') return { ok: false, why: `${kind} target is not a patch` };
  const { path: bare, paren } = stripParenthetical(String(c.path).trim());
  if (/\s\/\s|\s&\s|\sand\s/.test(bare) || /\s/.test(bare)) return { ok: false, why: 'path names several fields or contains free text' };
  const toks = tokenisePath(bare);
  if (!toks || !toks.length) return { ok: false, why: 'path is not a dotted/bracketed path' };
  const keys = toks.map((t) => t.key);
  let secondary = null;
  if (paren) {
    const m = /\band\s+(?:data\/)?(land-standing|region-depth|regions)\.js\s*(.*)$/i.exec(paren);
    if (m) secondary = `also names ${m[1]}.js ${m[2]}`.trim();
  }

  if (kind === 'regions') {
    if (keys[0] === 'values' && keys.length === 4) {
      return { ok: true, file: FILE_OF.regions, parts: ['values', keys[1], keys[2], keys[3]], numeric: keys[3] === 'value', supersede: keys[3] === 'value' ? { region: keys[1], criterion: keys[2] } : undefined, secondary };
    }
    if (keys[0] === 'regions' && toks[1]?.selector && toks[1].selector.k === 'id' && keys.length === 3) {
      return { ok: true, file: FILE_OF.regions, parts: ['regions', `[id=${toks[1].selector.v}]`, keys[2]], numeric: false, secondary };
    }
    return { ok: false, why: `unrecognised regions.js path shape ${JSON.stringify(bare)}` };
  }
  if (kind === 'landStanding' || kind === 'regionDepth') {
    const lead = kind === 'landStanding' ? ['landStanding', 'land-standing'] : ['regionDepth', 'region-depth'];
    const k = lead.includes(keys[0]) ? keys.slice(1) : keys;
    if (k.length !== 2) return { ok: false, why: `unrecognised ${kind} path shape ${JSON.stringify(bare)}` };
    return { ok: true, file: FILE_OF[kind], parts: [EXPORT_OF[kind], k[0], k[1]], numeric: false, secondary };
  }
  // layers: the processed JSON that the v1 lookup is generated from
  let k = keys[0] === 'v1Lookup' ? keys.slice(1) : keys;
  let layer = null;
  let id = null;
  if (LAYER_KEYS[k[0]]) { layer = LAYER_KEYS[k[0]]; id = k[1]; k = k.slice(2); }
  else if (LAYER_KEYS[k[1]]) { layer = LAYER_KEYS[k[1]]; id = k[0]; k = k.slice(2); }
  else if (ctx.ids.has(k[0])) { id = k[0]; k = k.slice(1); }
  else { id = ctx.region; }
  if (!id || !k.length) return { ok: false, why: `cannot read record id and field from ${JSON.stringify(bare)}` };
  if (!layer) {
    const hinted = Object.values(LAYER_KEYS).filter((l) => String(c.file).includes(`processed/${l}.json`));
    if (hinted.length === 1) layer = hinted[0];
    else {
      const owners = Object.entries(ctx.fieldIndex).filter(([, fields]) => fields.has(k[0])).map(([l]) => l);
      if (owners.length === 1) layer = owners[0];
      else return { ok: false, why: `field ${JSON.stringify(k[0])} belongs to ${owners.length} processed layers and the file names ${hinted.length}` };
    }
  }
  return { ok: true, file: `data/processed/${layer}.json`, parts: ['$', `[region_id=${id}]`, ...k], numeric: false, secondary };
}

function layerFieldIndex(root) {
  const idx = {};
  const ids = new Set();
  for (const l of Object.values(LAYER_KEYS)) {
    const f = path.join(root, 'data/processed', `${l}.json`);
    if (!exists(f)) continue;
    try { const arr = readJson(f); idx[l] = new Set(Object.keys(arr[0] || {})); for (const r of arr) ids.add(r.region_id); } catch { /* unreadable layer file: no index for it */ }
  }
  return { idx, ids };
}

const DEFAULT_EXPECT = { total: 362, high: 109, medium: 189, low: 64, byTarget: { regions: 199, landStanding: 58, regionDepth: 36, layers: 42, deeper: 22, dossier: 5 }, newer: 130, unverifiable: 143 };
export const TARGET_LABEL = { regions: 'regions.js', landStanding: 'land-standing.js', regionDepth: 'region-depth.js', layers: 'v1/processed', deeper: 'deeper.html', dossier: 'dossier md' };

export function convert({ ROOT, REVERIFY }) {
  const { idx, ids } = layerFieldIndex(ROOT);
  const files = loadReverify(REVERIFY);
  for (const f of files) ids.add(f.region);
  const out = { patches: [], needsHand: [], deferredLow: [], deeper: [], held: [], counts: { total: 0, high: 0, medium: 0, low: 0, byTarget: {}, newer: 0, unverifiable: 0, held: 0 } };
  const C = out.counts;
  for (const { region, data } of files) {
    (data.newer_vintages || []).forEach(() => { C.newer++; });
    (data.unverifiable || []).forEach(() => { C.unverifiable++; });
    (data.corrections || []).forEach((c, i) => {
      const conf = confidenceOf(c);
      const kind = targetKind(c.file);
      const ref = `${region}/${conf}/${i}`;
      C.total++; C[conf]++; C.byTarget[kind] = (C.byTarget[kind] || 0) + 1;
      const base = { ref, region, file: String(c.file).replace(/^prototype\//, ''), path: c.path, old: c.old, new: c.new, confidence: conf, evidence_url: c.evidence_url, reason: c.reason, owner: OWNER_BY_KIND[kind], source: `reverify/${region}.json#corrections[${i}]` };
      if (HOLD_RE.test(String(c.reason || ''))) {
        C.held++;
        out.held.push({ ...base, state: 'held-human-review', heldBy: 'converter hold rule: reason matches /needs human review|human review (advised|before|required)/i', proposed: c.new });
        return;
      }
      if (conf === 'low') {
        out.deferredLow.push({ ...base, state: 'parked-low', targetKind: kind });
        if (kind === 'deeper') out.deeper.push({ ...base, state: 'parked-low', lowConfidence: true, note: 'low confidence: DOC-6 applies only a label or URL fix whose evidence URL opens and shows the text, never a number' });
        return;
      }
      if (kind === 'deeper') { out.deeper.push({ ...base, state: 'for-DOC-6', note: 'apply to deeper.html; the evidence integration WPs do not touch the page' }); return; }
      if (kind === 'dossier') return; // recorded only (reverify-index.json carries the row)
      const n = normalise(c, { ids, fieldIndex: idx, region });
      if (!n.ok) { out.needsHand.push({ ...base, why: n.why }); return; }
      if (/^\s*\[/.test(String(c.new)) && !isJsonStringArray(c.new)) { out.needsHand.push({ ...base, why: 'new value is a list that is not a JSON array of strings: its items cannot be split safely' }); return; }
      const patch = { ...base, file: n.file, parts: n.parts, numeric: !!n.numeric };
      if (n.supersede) patch.supersede = n.supersede;
      if (n.file !== base.file) patch.retargetedFrom = base.file;
      out.patches.push(patch);
      if (n.secondary) out.needsHand.push({ ...base, secondary: true, why: n.secondary });
    });
  }
  return out;
}

export function summaryLines(out, index) {
  const C = out.counts;
  const t = C.byTarget;
  const lines = [];
  lines.push(`corrections ${C.total} = ${C.high} high + ${C.medium} medium + ${C.low} low`);
  lines.push(`by target: ${Object.keys(TARGET_LABEL).map((k) => `${TARGET_LABEL[k]} ${t[k] || 0}`).join(', ')}`);
  lines.push(`newer_vintages ${C.newer}, unverifiable ${C.unverifiable}`);
  lines.push(`patches ${out.patches.length} (numeric ${out.patches.filter((p) => p.numeric).length}), needs-hand ${out.needsHand.length}, deferred-low ${out.deferredLow.length}, deeper change list ${out.deeper.length}, held by converter ${out.held.length}`);
  if (index) lines.push(`index rows ${index.length} (= ${C.total} corrections + ${C.newer} newer_vintages + ${C.unverifiable} unverifiable)`);
  return lines;
}

export function writeAll({ OUT }, out, index, { dryRun = false } = {}) {
  const w = (name, v) => `${name}: ${writeJsonIfChanged(path.join(OUT, name), v, { dryRun })}`;
  return [
    w('patches.json', out.patches),
    w('needs-hand.json', out.needsHand),
    w('deferred-low.json', out.deferredLow),
    w('deeper-change-list.json', out.deeper),
    w('held-by-converter.json', out.held),
    w('reverify-index.json', index),
    w('unverifiable.json', index.filter((r) => r.kind === 'unverifiable')),
  ];
}

export function run(argv) {
  const args = parseArgs(argv, { boolFlags: ['summary', 'index', 'dry-run'] });
  const roots = resolveRoots(args);
  const out = convert(roots);
  const index = buildIndex(roots.REVERIFY);
  if (index.length !== out.counts.total + out.counts.newer + out.counts.unverifiable) throw new Error('index row count differs from the item count: internal error');
  for (const l of summaryLines(out, index)) printLine(l);
  if (args.summary) return 0;
  if (args.index) {
    const d = !!args.dryRun;
    printLine(`reverify-index.json: ${writeJsonIfChanged(path.join(roots.OUT, 'reverify-index.json'), index, { dryRun: d })}`);
    printLine(`unverifiable.json: ${writeJsonIfChanged(path.join(roots.OUT, 'unverifiable.json'), index.filter((r) => r.kind === 'unverifiable'), { dryRun: d })}`);
    return 0;
  }
  for (const l of writeAll(roots, out, index, { dryRun: !!args.dryRun })) printLine(l);
  const byWhy = {};
  for (const n of out.needsHand) byWhy[n.why] = (byWhy[n.why] || 0) + 1;
  for (const [why, n] of Object.entries(byWhy).sort((a, b) => b[1] - a[1])) printLine(`  needs-hand ${String(n).padStart(3)}  ${why}`);
  for (const h of out.held) printLine(`  held ${h.ref}  ${h.path}`);
  return 0;
}

export { DEFAULT_EXPECT };
if (isMain(import.meta.url)) {
  try { process.exit(run(process.argv.slice(2))); } catch (e) { process.stderr.write(`${e.stack || e}\n`); process.exit(1); }
}
