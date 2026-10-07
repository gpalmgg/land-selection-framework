// Shared plumbing for the merge toolkit: paths, argument parsing, idempotent JSON writes, text normalisation,
// the reverify index (one row per item) and ownership rules. Zero dependencies.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

// Roots. Everything can be redirected so the unit tests never touch the real tree.
//   LSF_ROOT  prototype/ folder      (default: three levels up from this file)
//   LSF_REPO  repo root              (default: parent of ROOT)
//   LSF_UPG   upgrade-2026-10 folder (default: REPO/upgrade-2026-10)
// Command-line flags --root / --repo / --upg win over the environment.
export function resolveRoots(args = {}) {
  const ROOT = path.resolve(args.root || process.env.LSF_ROOT || path.join(HERE, '..', '..', '..'));
  const REPO = path.resolve(args.repo || process.env.LSF_REPO || path.join(ROOT, '..'));
  const UPG = path.resolve(args.upg || process.env.LSF_UPG || path.join(REPO, 'upgrade-2026-10'));
  return { ROOT, REPO, UPG, OUT: path.resolve(args.out || process.env.LSF_EVIDENCE_OUT || path.join(UPG, 'evidence-out')), REVERIFY: path.resolve(args.reverify || process.env.LSF_REVERIFY || path.join(UPG, 'reverify')) };
}

// --flag, --flag value, --flag=value. Flags in `boolFlags` never consume a value. Repeated flags collect into arrays
// only when listed in `listFlags`. Everything else is positional.
export function parseArgs(argv, { boolFlags = [], listFlags = [] } = {}) {
  const out = { _: [] };
  const bools = new Set(boolFlags);
  const lists = new Set(listFlags);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--') { out._.push(...argv.slice(i + 1)); break; }
    if (!a.startsWith('--')) { out._.push(a); continue; }
    let name = a.slice(2);
    let val;
    const eq = name.indexOf('=');
    if (eq >= 0) { val = name.slice(eq + 1); name = name.slice(0, eq); }
    const camel = name.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (bools.has(name) && val === undefined) { out[camel] = true; continue; }
    if (val === undefined) {
      const nxt = argv[i + 1];
      if (nxt !== undefined && !nxt.startsWith('--')) { val = nxt; i++; } else { out[camel] = true; continue; }
    }
    if (lists.has(name)) (out[camel] ||= []).push(val); else out[camel] = val;
  }
  return out;
}

export const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export const exists = (p) => fs.existsSync(p);

// Stable, human-diffable JSON: 2-space indent, trailing newline.
export const stringify = (v) => JSON.stringify(v, null, 2) + '\n';

// Write only when the bytes change (idempotent: a second run touches nothing). Returns 'written' | 'unchanged' | 'dry-run'.
export function writeIfChanged(p, text, { dryRun = false } = {}) {
  let prev = null;
  try { prev = fs.readFileSync(p, 'utf8'); } catch { /* new file */ }
  if (prev === text) return 'unchanged';
  if (dryRun) return 'dry-run';
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
  return 'written';
}
export const writeJsonIfChanged = (p, v, o) => writeIfChanged(p, stringify(v), o);

// 1:1 character canonicalisation (index-preserving) used for the old-value assertion and substring matching:
// typographic quotes and dashes become ASCII, no-break spaces become spaces, and a precomposed accented Latin letter
// folds to its base letter (the dossier JSON often carries "posesion" for "posesión").
const CHAR_MAP = new Map([
  ['\u2019', "'"], ['\u2018', "'"], ['\u201a', "'"], ['\u02bc', "'"], ['\u201c', '"'], ['\u201d', '"'], ['\u201e', '"'],
  ['\u2013', '-'], ['\u2014', '-'], ['\u2212', '-'], ['\u2010', '-'], ['\u2011', '-'], ['\u00a0', ' '], ['\u2009', ' '], ['\u202f', ' '],
]);
function foldChar(ch) {
  const m = CHAR_MAP.get(ch);
  if (m !== undefined) return m;
  if (ch.charCodeAt(0) < 0x80) return ch;
  const d = ch.normalize('NFD');
  return d.length > 1 && d.charCodeAt(0) < 0x80 ? d[0] : ch;
}
export function canonChars(s) {
  let o = '';
  for (const ch of String(s)) o += foldChar(ch);
  return o;
}
// Whole-string normalisation: canonical characters, NFC first, collapsed whitespace, trimmed. A backslash before a
// quote (dossier JSON escaping) is dropped.
export const normText = (s) => canonChars(String(s).normalize('NFC').replace(/\\(['"])/g, '$1')).replace(/\s+/g, ' ').trim();
export function sameValue(a, b) {
  if (a === b) return true;
  const na = normText(a);
  const nb = normText(b);
  if (na === nb) return true;
  if (/^[-+]?\d*\.?\d+(?:e[-+]?\d+)?$/i.test(na) && /^[-+]?\d*\.?\d+(?:e[-+]?\d+)?$/i.test(nb)) return Number(na) === Number(nb);
  return false;
}
// All occurrences of `needle` in `hay`, compared on canonical characters; returns raw indexes into `hay`.
export function findAllCanon(hay, needle) {
  const h = canonChars(hay);
  const n = canonChars(needle);
  const out = [];
  if (!n) return out;
  for (let i = h.indexOf(n); i >= 0; i = h.indexOf(n, i + 1)) out.push(i);
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Reverify files, targets, ownership.

export const OWNERS = {
  regions: 'EV-INT-REGIONS',
  landStanding: 'EV-INT-STANDING',
  regionDepth: 'EV-INT-DEPTH',
  layers: 'EV-INT-LAYERS',
  deeper: 'DOC-6',
};
export const HOLD_RE = /needs human review|human review (advised|before|required)/i;
export const CLAIM_RE = /land[- ]?standing|region[- ]?depth|\basks\b|legal|blurb|territory|tenure|\bentry\b|obligation|purchase|buyer|statute|\blaw\b|decree|zoning|treaty/i;
export const FOREIGN_RE = /non-EU|foreign|non-resident|nationality|purchase restriction|any buyer|alien/i;

// Which family of target does a correction's `file` string name?
export function targetKind(file) {
  const f = String(file || '');
  if (/research-dossier/.test(f)) return 'dossier';
  if (/deeper\.html/.test(f)) return 'deeper';
  if (/data\/regions\.js/.test(f)) return 'regions';
  if (/land-standing\.js/.test(f)) return 'landStanding';
  if (/region-depth\.js/.test(f)) return 'regionDepth';
  return 'layers'; // v1-lookup.js and data/processed/*.json (retargeted to the processed JSON)
}
export const OWNER_BY_KIND = { ...OWNERS, dossier: 'recorded-only' };

export function ownerForUnverifiable(text) {
  const t = String(text);
  if (/land[- ]?standing/i.test(t)) return 'EV-INT-STANDING';
  if (/region[- ]?depth|\basks\b|case study/i.test(t)) return 'EV-INT-DEPTH';
  if (/\bv1\b|legal layer|land_cost|processed/i.test(t)) return 'EV-INT-LAYERS';
  if (/deeper/i.test(t)) return 'DOC-6';
  return 'EV-INT-REGIONS';
}
export function classFor(text) { return CLAIM_RE.test(String(text)) ? 'claim' : 'other'; }
export const itemText = (x) => (typeof x === 'string' ? x : JSON.stringify(x));

// Load every reverify/*.json in a stable order. Returns [{ region, file, data }].
export function loadReverify(dir) {
  return fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort().map((f) => {
    const data = readJson(path.join(dir, f));
    return { region: data.regionId || f.replace(/\.json$/, ''), file: f, data };
  });
}

export const confidenceOf = (c) => {
  const v = String(c && c.confidence ? c.confidence : '').toLowerCase().trim();
  return v === 'high' || v === 'medium' ? v : 'low'; // anything unrecognised is treated as low: never applied
};

export function correctionClass(kind, c) {
  const p = String(c.path || '');
  if (kind === 'dossier') return 'other';
  if (kind === 'deeper') return /case study/i.test(p) ? 'case-study' : 'other';
  if (kind === 'regions') return /^values/.test(p) || /^values/.test(p.replace(/^regions\.js\s*/, '')) ? 'cell' : (CLAIM_RE.test(p) ? 'claim' : 'other');
  if (kind === 'landStanding' || kind === 'regionDepth') return /sourceUrl|source\b/i.test(p) && !/territory|tenure|entry|obligation|asks/i.test(p) ? 'other' : 'claim';
  return CLAIM_RE.test(`${c.file} ${p}`) ? 'claim' : 'other';
}

// The index: one row per item of every reverify/*.json (corrections, newer_vintages, unverifiable).
export function buildIndex(reverifyDir) {
  const rows = [];
  for (const { region, data } of loadReverify(reverifyDir)) {
    (data.corrections || []).forEach((c, i) => {
      const conf = confidenceOf(c);
      const kind = targetKind(c.file);
      const text = `${c.file} :: ${c.path}`;
      rows.push({
        ref: `${region}/${conf}/${i}`, kind: conf, region, target: text, owner: OWNER_BY_KIND[kind],
        class: correctionClass(kind, c),
      });
    });
    (data.newer_vintages || []).forEach((n, i) => {
      rows.push({ ref: `${region}/newer_vintage/${i}`, kind: 'newer_vintage', region, target: itemText(n), owner: 'EV-INT-REGIONS', class: 'other' });
    });
    (data.unverifiable || []).forEach((u, i) => {
      const text = itemText(u);
      rows.push({ ref: `${region}/unverifiable/${i}`, kind: 'unverifiable', region, target: text, owner: ownerForUnverifiable(text), class: classFor(text) });
    });
  }
  return rows;
}

export function printLine(s = '') { process.stdout.write(s + '\n'); }
export function fail(msg, code = 1) { process.stderr.write(msg + '\n'); process.exit(code); }
export const isMain = (metaUrl) => process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(metaUrl);
