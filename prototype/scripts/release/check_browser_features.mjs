#!/usr/bin/env node
// check_browser_features.mjs [--root DIR] [--out FILE]
//
// Static feature lint over the site's own CSS, JS and inline <style>/<script> (vendor/, data/, tests/, scripts/ and node_modules/
// are not scanned). Support floor: Chrome 118, Safari 17.0, Firefox 118. A feature whose first version is above the floor in any
// browser must be guarded or purely progressive, otherwise it FAILS:
//   CSS guard        inside an `@supports` block (not `@supports not`), or preceded by a fallback declaration of the same
//                    property in the same rule; `light-dark(` in a custom property is guarded by the
//                    `@supports not (color: light-dark(...))` block of tokens.css
//   progressive      `text-wrap` (an ignored declaration changes nothing), `dvh` after a `vh` declaration of the same property
//   JS guard         a feature check (typeof / `in` / `if (`) on the same or one of the five previous lines
// The report lists file:line, feature and versions; `--out FILE` also writes every hit as JSON.
import fs from 'node:fs';
import path from 'node:path';
import { Report, parseArgs, cli, PROTO, walk, lineOf } from './lib.mjs';

export const FLOOR = { chrome: 118, safari: 17.0, firefox: 118 };
// [Chrome, Safari, Firefox] first versions
export const TABLE = {
  'light-dark()': [123, 17.5, 120],
  ':has()': [105, 15.4, 121],
  '@container': [105, 16, 110],
  'color-mix()': [111, 16.2, 113],
  'text-wrap': [114, 17.5, 121],
  '@property': [85, 16.4, 128],
  'dvh/svh/lvh': [108, 15.4, 101],
  'css nesting': [120, 17.2, 117],
  '@layer': [99, 15.4, 97],
  'inert': [102, 15.5, 112],
  '<dialog': [37, 15.4, 98],
  'structuredClone()': [98, 15.4, 94],
  'top-level await': [89, 15, 89],
  '.at()': [92, 15.4, 90],
  'Object.hasOwn()': [93, 15.4, 92],
  'replaceAll()': [85, 13.1, 77],
};
const above = (f) => { const v = TABLE[f]; return v[0] > FLOOR.chrome || v[1] > FLOOR.safari || v[2] > FLOOR.firefox; };
const versions = (f) => { const v = TABLE[f]; return `Chrome ${v[0]}, Safari ${v[1]}, Firefox ${v[2]}`; };
const SKIP_DIRS = ['vendor', 'node_modules', 'tests', 'scripts', 'data', '.venv', 'public', '__pycache__'];

function blankComments(text) { return text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')); }

// Light CSS walker: blocks (with prelude + declarations + parent) from comment-blanked source.
export function parseCss(src) {
  const root = { prelude: '', root: true, decls: [], parent: null, idx: 0 };
  const blocks = [root];
  let top = root, seg = 0, paren = 0, quote = null;
  const flush = (end) => {
    const t = src.slice(seg, end);
    const trimmed = t.trim();
    if (trimmed && !trimmed.startsWith('@')) {
      const c = t.indexOf(':');
      if (c > 0) top.decls.push({ prop: t.slice(0, c).trim().toLowerCase(), value: t.slice(c + 1).trim(), idx: seg + (t.length - t.trimStart().length), valueIdx: seg + c + 1 });
    }
  };
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quote) { if (c === '\\') i++; else if (c === quote) quote = null; continue; }
    if (c === '"' || c === "'") { quote = c; continue; }
    if (c === '(') { paren++; continue; }
    if (c === ')') { paren = Math.max(0, paren - 1); continue; }
    if (paren > 0) continue;
    if (c === ';') { flush(i); seg = i + 1; }
    else if (c === '{') {
      const prelude = src.slice(seg, i);
      const b = { prelude: prelude.trim(), decls: [], parent: top, idx: seg + (prelude.length - prelude.trimStart().length) };
      blocks.push(b); top = b; seg = i + 1;
    } else if (c === '}') {
      flush(i);
      if (top.parent) top = top.parent;
      seg = i + 1;
    }
  }
  return blocks;
}

const isAt = (b) => b.prelude.startsWith('@');
const isStyleRule = (b) => !b.root && !isAt(b);
function supported(b) {
  for (let x = b; x && !x.root; x = x.parent) if (/^@supports\b/i.test(x.prelude) && !/^@supports\s+not\b/i.test(x.prelude)) return true;
  return false;
}

// hit: { feature, idx, status: 'within-floor'|'progressive'|'guarded'|'UNGUARDED', how }
export function scanCss(text, ctx = {}) {
  const src = blankComments(text);
  const blocks = parseCss(src);
  const hits = [];
  const add = (feature, idx, guard) => {
    let status, how = '';
    if (!above(feature)) status = 'within-floor';
    else if (guard && guard.progressive) { status = 'progressive'; how = guard.how; }
    else if (guard && guard.ok) { status = 'guarded'; how = guard.how; }
    else status = 'UNGUARDED';
    hits.push({ feature, idx, status, how });
  };
  for (const b of blocks) {
    if (b.root) continue;
    const p = b.prelude;
    const parentIsStyle = isStyleRule(b.parent);
    const sup = supported(b.parent);
    if (/^@container\b/i.test(p)) add('@container', b.idx, null);
    if (/^@property\b/i.test(p)) add('@property', b.idx, { ok: sup, how: '@supports ancestor' });
    if (/^@layer\b/i.test(p)) add('@layer', b.idx, null);
    if (isAt(b) && /^@(media|supports|container|layer)\b/i.test(p) && parentIsStyle) add('css nesting', b.idx, { ok: sup, how: '@supports ancestor' });
    if (isStyleRule(b)) {
      if (/:has\(/i.test(p)) add(':has()', b.idx, { ok: sup, how: '@supports ancestor' });
      if (parentIsStyle || /&/.test(p)) add('css nesting', b.idx, { ok: sup, how: '@supports ancestor' });
      if (/\[inert\b/i.test(p)) add('inert', b.idx, null);
    }
  }
  for (const b of blocks) {
    const sup = supported(b);
    b.decls.forEach((d, n) => {
      const v = d.value.replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""').replace(/url\([^)]*\)/gi, 'url()');
      if (/light-dark\(/i.test(v)) {
        let guard = null;
        const earlier = b.decls.slice(0, n).find((e) => e.prop === d.prop && !/light-dark\(/i.test(e.value));
        if (sup) guard = { ok: true, how: '@supports ancestor' };
        else if (d.prop.startsWith('--') && ctx.tokensFallback) guard = { ok: true, how: '@supports not (color: light-dark(...)) block of tokens.css' };
        else if (earlier && !d.prop.startsWith('--')) guard = { ok: true, how: `fallback declaration of ${d.prop}` };
        add('light-dark()', d.valueIdx + d.value.search(/light-dark\(/i), guard);
      }
      if (/color-mix\(/i.test(v)) add('color-mix()', d.idx, null);
      if (/^text-wrap(-style|-mode)?$/.test(d.prop)) add('text-wrap', d.idx, { progressive: true, how: 'ignored where unsupported' });
      if (/\d(?:dvh|svh|lvh)\b/i.test(v)) {
        const earlier = b.decls.slice(0, n).some((e) => e.prop === d.prop && /\dvh\b/i.test(e.value));
        add('dvh/svh/lvh', d.idx, earlier ? { progressive: true, how: 'vh fallback declared first' } : null);
      }
    });
  }
  return hits;
}

const JS_RULES = [
  ['structuredClone()', /\bstructuredClone\s*\(/g],
  ['.at()', /\.at\(\s*-?\d/g],
  ['Object.hasOwn()', /\bObject\.hasOwn\s*\(/g],
  ['replaceAll()', /\.replaceAll\s*\(/g],
  ['inert', /\.inert\b/g],
  ['<dialog', /<dialog\b/g],
];
const GUARD_WORDS = { 'structuredClone()': 'structuredClone', 'Object.hasOwn()': 'hasOwn', 'replaceAll()': 'replaceAll', '.at()': '\\bat\\b', inert: 'inert', '<dialog': 'dialog' };

export function scanJs(text) {
  const src = text.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ' ')).replace(/(^|[^:'"`\\])\/\/[^\n]*/g, (m, a) => a + ' '.repeat(m.length - a.length));
  const lines = src.split('\n');
  const hits = [];
  for (const [feature, re] of JS_RULES) {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      let status = 'within-floor', how = '';
      if (above(feature)) {
        const ln = lineOf(src, m.index) - 1;
        const ctx = lines.slice(Math.max(0, ln - 5), ln + 1).join('\n');
        const word = GUARD_WORDS[feature] || feature;
        const guarded = new RegExp(`(typeof\\s+[\\w.]*${word}|['"][\\w.]*${word}['"]\\s+in\\b|\\bif\\s*\\([^)]*${word}|${word}[^\\n]*\\?\\s)`).test(ctx);
        status = guarded ? 'guarded' : 'UNGUARDED';
        how = guarded ? 'feature check' : '';
      }
      hits.push({ feature, idx: m.index, status, how });
    }
  }
  const tla = /^(?!\s)(?!(?:async|function|export\s+(?:async\s+)?function)\b)[^\n]*\bawait\b/gm;
  let m;
  while ((m = tla.exec(src))) if (!/^(?:\/\/|\*|\})/.test(m[0].trim())) hits.push({ feature: 'top-level await', idx: m.index, status: above('top-level await') ? 'UNGUARDED' : 'within-floor', how: '' });
  return hits;
}

function extractInline(html) {
  const parts = [];
  for (const m of html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)) parts.push({ kind: 'css', text: m[1], idx: m.index + m[0].indexOf('>') + 1 });
  for (const m of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/\bsrc\s*=/i.test(m[1]) || /ld\+json|importmap/i.test(m[1])) continue;
    parts.push({ kind: 'js', text: m[2], idx: m.index + m[0].indexOf('>') + 1 });
  }
  for (const m of html.matchAll(/<dialog\b/gi)) parts.push({ kind: 'dialog', text: '', idx: m.index });
  for (const m of html.matchAll(/\sinert(?=[\s>=])/gi)) parts.push({ kind: 'inert', text: '', idx: m.index });
  return parts;
}

export async function run(argv) {
  const o = parseArgs(argv, { value: ['root', 'out'] });
  const root = path.resolve(o.root || PROTO);
  const rep = new Report();
  const files = walk(root, { skipDirs: SKIP_DIRS }).filter((f) => /\.(css|js|mjs|html)$/i.test(f) && !/\.test\.m?js$/.test(f) && !/(^|\/)package/.test(f));
  const cssFiles = files.filter((f) => f.endsWith('.css'));
  const tokensFallback = cssFiles.some((f) => path.basename(f) === 'tokens.css' && /@supports\s+not\s*\(\s*color\s*:\s*light-dark\(/i.test(fs.readFileSync(path.join(root, f), 'utf8')));
  const all = [];
  for (const f of files) {
    const text = fs.readFileSync(path.join(root, f), 'utf8');
    const push = (hits, base, src) => { for (const h of hits) all.push({ file: f, line: lineOf(text, base + h.idx), ...h }); void src; };
    if (f.endsWith('.css')) push(scanCss(text, { tokensFallback }), 0);
    else if (/\.m?js$/.test(f)) push(scanJs(text), 0);
    else {
      for (const part of extractInline(text)) {
        if (part.kind === 'css') push(scanCss(part.text, { tokensFallback }), part.idx);
        else if (part.kind === 'js') push(scanJs(part.text), part.idx);
        else all.push({ file: f, line: lineOf(text, part.idx), feature: part.kind === 'dialog' ? '<dialog' : 'inert', idx: part.idx, status: above(part.kind === 'dialog' ? '<dialog' : 'inert') ? 'UNGUARDED' : 'within-floor', how: '' });
      }
    }
  }
  const byFeature = new Map();
  for (const h of all) { if (!byFeature.has(h.feature)) byFeature.set(h.feature, []); byFeature.get(h.feature).push(h); }
  for (const [feature, hs] of [...byFeature].sort((a, b) => a[0].localeCompare(b[0]))) {
    const bad = hs.filter((h) => h.status === 'UNGUARDED');
    for (const h of bad.slice(0, 25)) rep.fail(`browser-feature ${feature}`, `${h.file}:${h.line} unguarded (${versions(feature)}; floor Chrome ${FLOOR.chrome}, Safari ${FLOOR.safari.toFixed(1)}, Firefox ${FLOOR.firefox})`);
    if (bad.length > 25) rep.fail(`browser-feature ${feature}`, `... and ${bad.length - 25} more unguarded uses`);
    if (!bad.length) {
      const kinds = ['within-floor', 'guarded', 'progressive'].map((s) => [s, hs.filter((h) => h.status === s).length]).filter(([, n]) => n);
      rep.pass(`browser-feature ${feature}`, `${hs.length} use(s): ${kinds.map(([s, n]) => `${n} ${s}`).join(', ')} (${versions(feature)})`);
    }
  }
  if (!all.length) rep.pass('browser-features', `no tracked feature found in ${files.length} CSS/JS/HTML files`);
  rep.pass('browser-features-scan', `${files.length} files scanned against floor Chrome ${FLOOR.chrome}, Safari ${FLOOR.safari.toFixed(1)}, Firefox ${FLOOR.firefox}; tokens.css light-dark fallback block ${tokensFallback ? 'present' : 'absent'}`);
  if (o.out) {
    fs.mkdirSync(path.dirname(path.resolve(o.out)), { recursive: true });
    fs.writeFileSync(path.resolve(o.out), JSON.stringify({ floor: FLOOR, table: TABLE, root, tokensFallback, hits: all.map(({ file, line, feature, status, how }) => ({ at: `${file}:${line}`, feature, versions: TABLE[feature], status, how })) }, null, 1) + '\n');
  }
  return rep;
}

cli(import.meta.url, 'check_browser_features', run);
