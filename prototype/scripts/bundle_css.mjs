#!/usr/bin/env node
// bundle_css.mjs: one render-blocking stylesheet instead of thirty. MC-PERF, 2026-10.
//
//   node scripts/bundle_css.mjs [--root DIR] [--write | --bundle | --unbundle | --check] [--quiet] [--help]
//
// The source chunks in src/styles/ stay the editing surface. src/styles/bundle.css is a COMMITTED, DERIVED file: the chunks that
// index.html links (tokens, fonts, theme-gate and the legacy cascade, in LINK ORDER), concatenated byte for byte, preceded by one
// header comment that records the order. index.html then links bundle.css alone. A phone no longer pays one round trip per chunk
// for the render-blocking CSS (measured by tests/e2e/suites/perf.py; the A/B numbers are in upgrade-2026-10/verify/e2e/perf.json).
//
// Where the order comes from
//   index.html is unbundled (it links the chunks)  -> the order is the order of those <link> elements.
//   index.html is bundled (it links bundle.css)    -> the order is the "bundle-order:" line in bundle.css's header.
// So the chunk list is never typed anywhere: a chunk added to (or removed from) index.html's links while it is unbundled is picked
// up by the next --write; while it is bundled, run --unbundle, edit the links, then --bundle.
//
// Modes
//   --check     (default) read only; exit 1 when bundle.css is not exactly what --write would produce, when index.html mixes the
//               bundle with chunk links, or when a chunk cannot be bundled (an @import or @charset after the first rule).
//   --write     rewrite src/styles/bundle.css only (index.html untouched). Idempotent.
//   --bundle    --write, then index.html: the first chunk <link> becomes the bundle <link>, the other chunk links are removed.
//   --unbundle  index.html: the bundle <link> becomes the chunk links again (from the header order); bundle.css is left in place.
//   --root DIR  the site root (default: the prototype/ this script lives in); scratch sites use it.
//
// Run `node scripts/bundle_css.mjs --write` after ANY edit to a chunk listed in bundle.css's header. The final gate runs --check.
// Stylesheets that are not chunks of the home page (region-page.css, longread.css, terms.css ...) are not touched: pages other
// than index.html keep their own links.
//
// Exit codes: 0 ok, 1 differences or problems found, 2 usage error.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OWN_ROOT = path.resolve(HERE, '..');
const STYLE_DIR = 'src/styles';
const BUNDLE_NAME = 'bundle.css';
const BUNDLE_HREF = `./${STYLE_DIR}/${BUNDLE_NAME}`;
const ORDER_PREFIX = 'bundle-order:';
const HEADER_RE = /bundle-order: ([^\n]*?) \*\//;

const HELP = `bundle_css.mjs: concatenate the chunks index.html links into src/styles/bundle.css.

Usage: node scripts/bundle_css.mjs [--root DIR] [--write | --bundle | --unbundle | --check] [--quiet] [--help]

  --check      read only (default); exit 1 when bundle.css or index.html is out of step with the chunks
  --write      rewrite src/styles/bundle.css (order from index.html's chunk links, or from bundle.css's header when bundled)
  --bundle     --write, then link only bundle.css from index.html
  --unbundle   link the chunks again from index.html (the editing state)
  --root DIR   site root (default: the prototype folder this script lives in)
  --quiet      print only problems
  --help       this text
`;

function parseArgs(argv) {
  const o = { root: OWN_ROOT, mode: 'check', quiet: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--help' || a === '-h') { process.stdout.write(HELP); process.exit(0); }
    else if (a === '--root') o.root = path.resolve(argv[++i] || '');
    else if (a === '--write' || a === '--bundle' || a === '--unbundle' || a === '--check') o.mode = a.slice(2);
    else if (a === '--quiet') o.quiet = true;
    else { process.stderr.write(`unknown argument: ${a}\n${HELP}`); process.exit(2); }
  }
  return o;
}

// The <link rel="stylesheet"> elements of index.html that point into src/styles/ (the chunks and, when present, the bundle).
const LINK_RE = /<link\b[^>]*>/gi;
function styleLinks(html) {
  const out = [];
  let m;
  LINK_RE.lastIndex = 0;
  while ((m = LINK_RE.exec(html))) {
    const tag = m[0];
    if (!/\brel=["']stylesheet["']/i.test(tag)) continue;
    const href = (/\bhref=["']([^"']+)["']/i.exec(tag) || [])[1];
    if (!href) continue;
    const clean = href.split(/[?#]/)[0];
    const mm = /^(?:\.\/|\/)?src\/styles\/([\w.-]+\.css)$/.exec(clean);
    if (!mm) continue;
    out.push({ tag, href, file: mm[1], index: m.index, end: m.index + tag.length });
  }
  return out;
}

function chunkTag(file) { return `<link rel="stylesheet" href="./${STYLE_DIR}/${file}" data-bust />`; }

function readOrderFromBundle(root) {
  const p = path.join(root, STYLE_DIR, BUNDLE_NAME);
  if (!fs.existsSync(p)) return null;
  const head = fs.readFileSync(p, 'utf8').slice(0, 4000);
  const m = HEADER_RE.exec(head);
  return m ? m[1].split(',').map((s) => s.trim()).filter(Boolean) : null;
}

// Returns a reason string when the stylesheet text has an unterminated comment or string, or its braces do not balance; else ''.
function unbalanced(css) {
  let depth = 0;
  for (let i = 0; i < css.length; i++) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') {
      const end = css.indexOf('*/', i + 2);
      if (end < 0) return 'unterminated comment';
      i = end + 1;
    } else if (c === '"' || c === "'") {
      let j = i + 1;
      while (j < css.length && css[j] !== c) { if (css[j] === '\\') j++; if (css[j] === '\n') return 'unterminated string'; j++; }
      if (j >= css.length) return 'unterminated string';
      i = j;
    } else if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth < 0) return 'a closing brace with no opening brace'; }
  }
  return depth === 0 ? '' : `${depth} unclosed brace(s)`;
}

function buildBundle(root, order) {
  const parts = [];
  const problems = [];
  for (const file of order) {
    const p = path.join(root, STYLE_DIR, file);
    if (!fs.existsSync(p)) { problems.push(`chunk ${STYLE_DIR}/${file} does not exist`); continue; }
    let css = fs.readFileSync(p, 'utf8');
    // @import and @charset are only valid before every other rule: inside a concatenation they would be silently dropped.
    const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
    if (/@charset\b/.test(stripped)) problems.push(`${file}: @charset cannot be bundled`);
    if (/@import\b/.test(stripped)) problems.push(`${file}: @import cannot be bundled (it would be dropped after the first rule)`);
    // A chunk that does not balance would swallow the rules of the chunk after it once they share one file.
    const bad = unbalanced(css);
    if (bad) problems.push(`${file}: ${bad} (separate files hid this; one bundle would carry it into the next chunk)`);
    if (!css.endsWith('\n')) css += '\n';
    parts.push(`/* ---- ${file} ---- */\n${css}`);
  }
  const header = '/* GENERATED by scripts/bundle_css.mjs: do not edit. Edit the chunks listed below, then run `node scripts/bundle_css.mjs --write`.\n' +
    '   The chunks are concatenated in the order index.html linked them (the cascade is unchanged). `--check` is part of the final gate.\n' +
    `   ${ORDER_PREFIX} ${order.join(',')} */\n`;
  return { text: header + parts.join(''), problems };
}

function currentOrder(root, html) {
  const links = styleLinks(html);
  const chunks = links.filter((l) => l.file !== BUNDLE_NAME);
  const bundled = links.some((l) => l.file === BUNDLE_NAME);
  return { links, chunks, bundled, order: chunks.length ? chunks.map((l) => l.file) : (bundled ? readOrderFromBundle(root) : null) };
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  const say = (s) => { if (!o.quiet) process.stdout.write(s + '\n'); };
  const htmlPath = path.join(o.root, 'index.html');
  const bundlePath = path.join(o.root, STYLE_DIR, BUNDLE_NAME);
  if (!fs.existsSync(htmlPath)) { process.stderr.write(`no index.html in ${o.root}\n`); return 2; }
  let html = fs.readFileSync(htmlPath, 'utf8');
  const cur = currentOrder(o.root, html);
  const problems = [];
  for (const l of cur.chunks) {
    if (/\b(media|disabled|integrity|crossorigin|title)\s*=/i.test(l.tag)) problems.push(`${l.file}: the <link> carries an attribute a bundle cannot keep (${l.tag})`);
  }
  if (problems.length && o.mode !== 'check') { for (const p of problems) process.stderr.write(`FAIL ${p}\n`); return 1; }

  if (o.mode === 'check') {
    if (cur.bundled && cur.chunks.length) problems.push(`index.html links bundle.css AND ${cur.chunks.length} chunk(s) (${cur.chunks.map((l) => l.file).join(', ')}): the cascade would apply twice`);
    if (!cur.order || !cur.order.length) {
      if (cur.bundled) problems.push('bundle.css has no readable "bundle-order:" header');
      else say('bundle_css: index.html links no chunks and no bundle; nothing to check');
    } else if (cur.bundled || fs.existsSync(bundlePath)) {
      const built = buildBundle(o.root, cur.order);
      problems.push(...built.problems);
      if (!fs.existsSync(bundlePath)) problems.push(`${STYLE_DIR}/${BUNDLE_NAME} is missing`);
      else if (fs.readFileSync(bundlePath, 'utf8') !== built.text) problems.push(`${STYLE_DIR}/${BUNDLE_NAME} is out of date: run node scripts/bundle_css.mjs --write`);
      if (cur.bundled) {
        const link = cur.links.find((l) => l.file === BUNDLE_NAME);
        if (!/\bdata-bust\b/.test(link.tag)) problems.push('the bundle <link> lacks data-bust (its ?v= would never be stamped)');
      }
    } else {
      say('bundle_css: index.html is unbundled and no bundle.css exists; nothing to check');
    }
    for (const p of problems) process.stderr.write(`FAIL ${p}\n`);
    if (!problems.length) say(`bundle_css: OK (${cur.bundled ? 'bundled' : 'unbundled'}, ${cur.order ? cur.order.length : 0} chunks)`);
    return problems.length ? 1 : 0;
  }

  if (o.mode === 'write' || o.mode === 'bundle') {
    if (!cur.order || !cur.order.length) { process.stderr.write('no chunk order: index.html links no src/styles chunks and bundle.css has no header\n'); return 1; }
    const built = buildBundle(o.root, cur.order);
    if (built.problems.length) { for (const p of built.problems) process.stderr.write(`FAIL ${p}\n`); return 1; }
    fs.mkdirSync(path.dirname(bundlePath), { recursive: true });
    const before = fs.existsSync(bundlePath) ? fs.readFileSync(bundlePath, 'utf8') : null;
    if (before !== built.text) fs.writeFileSync(bundlePath, built.text);
    say(`bundle_css: ${before === built.text ? 'unchanged' : 'wrote'} ${STYLE_DIR}/${BUNDLE_NAME} (${Buffer.byteLength(built.text)} bytes, ${cur.order.length} chunks)`);
  }

  if (o.mode === 'bundle') {
    if (!cur.chunks.length) { say('bundle_css: index.html already links the bundle'); return 0; }
    // Replace the first chunk link by the bundle link, drop the other chunk links with their line.
    const first = cur.chunks[0];
    let out = '';
    let pos = 0;
    for (const l of cur.chunks) {
      out += html.slice(pos, l.index);
      if (l === first) out += `<link rel="stylesheet" href="${BUNDLE_HREF}" data-bust />`;
      else {
        // remove the whole line when the link is alone on it
        const lineStart = out.lastIndexOf('\n') + 1;
        const lineIsBlank = /^[ \t]*$/.test(out.slice(lineStart));
        const rest = html.slice(l.end);
        const nl = /^[ \t]*\r?\n/.exec(rest);
        if (lineIsBlank && nl) { out = out.slice(0, lineStart); pos = l.end + nl[0].length; continue; }
      }
      pos = l.end;
    }
    out += html.slice(pos);
    fs.writeFileSync(htmlPath, out);
    say(`bundle_css: index.html now links ${BUNDLE_HREF} instead of ${cur.chunks.length} chunks`);
  }

  if (o.mode === 'unbundle') {
    if (!cur.bundled) { say('bundle_css: index.html is already unbundled'); return 0; }
    const order = readOrderFromBundle(o.root);
    if (!order || !order.length) { process.stderr.write('bundle.css has no "bundle-order:" header; cannot restore the chunk links\n'); return 1; }
    const link = cur.links.find((l) => l.file === BUNDLE_NAME);
    const lineStart = html.lastIndexOf('\n', link.index) + 1;
    const indent = /^[ \t]*/.exec(html.slice(lineStart, link.index))[0];
    const replacement = order.map((f, i) => (i ? indent : '') + chunkTag(f)).join('\n');
    html = html.slice(0, link.index) + replacement + html.slice(link.end);
    fs.writeFileSync(htmlPath, html);
    say(`bundle_css: index.html links ${order.length} chunks again`);
  }
  return 0;
}

process.exit(main());
