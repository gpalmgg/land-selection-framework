#!/usr/bin/env node
// Import-rule checker for the client modules (map-craft 3.3). Run from prototype/:
//
//     node tests/e2e/tools/import_graph.mjs [--root DIR] [--entry src/main.js] [--json OUT] [--self-test]
//
// Reads every .js under src/ and lib/ (static imports, `export ... from`, and dynamic `import('x')`), builds the graph from
// the entry and checks six rules. Exit 0 when all hold, 1 otherwise. Nothing here executes the modules.
//
//   1  lib/* imports only lib/* and data/*, and its code never mentions window, document, localStorage or fetch.
//   2  src/data.js is the only module under src/ that imports data/*.
//   3  src/ui/* and src/map/* import only lib/*, src/data.js, state, bus, config/*, and the shared UI helpers
//      (ui/dom.js, ui/a11y.js, ui/overlays.js, ui/analytics.js). Never each other across the two folders and never one
//      UI module another. Two same-folder exceptions: drawer/index.js and drawer/blocks/manifest.js import the drawer
//      blocks, and modules under src/map/ may import their src/map/ siblings.
//   4  Only src/refresh.js and src/main.js import UI modules for orchestration (the drawer and map folders are the only
//      other importers of their own files).
//   5  No import-time side effects beyond declarations: at the top level of every src/ and lib/ module only imports,
//      exports and declarations are allowed, and a const/let/var initialiser must not touch the DOM or storage.
//      src/main.js is exempt: it is the boot entry and its top level IS the boot sequence.
//   6  The graph is acyclic, and the longest chain from the entry is at most 4 modules.
//
// How rule 6 counts. The chain is measured over the ORCHESTRATION modules: the entry, src/refresh.js, src/ui/** and
// src/map/**, leaving out the shared foundation they all sit on (state, bus, data, config/*, lib/*, data/*, and the
// four shared UI helpers). Foundation modules are leaves that modulepreload lists flat, which is the point of the rule
// ("so modulepreload flattens the waterfall"); counting them would make 4 impossible, since state.js alone imports
// data.js which imports data/*. The full-graph depth is printed too (informational) so the preload list can be checked.
// Dynamic imports are lazy chunks: they are checked for cycles but do not extend the chain.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MAX_CHAIN = 4;
const FOUNDATION_UI = new Set(['src/ui/dom.js', 'src/ui/a11y.js', 'src/ui/overlays.js', 'src/ui/analytics.js']);
const GLOBALS_BANNED_IN_LIB = ['window', 'document', 'localStorage', 'fetch'];
const SIDE_EFFECT_GLOBALS = ['document', 'window', 'localStorage', 'sessionStorage', 'navigator', 'addEventListener', 'fetch',
  'setTimeout', 'setInterval', 'requestAnimationFrame'];

// ---------------------------------------------------------------- source scanning

// Walks the source once and returns { code, text }: `code` has comments removed and the CONTENT of string, template and
// regex literals blanked (delimiters kept), `text` has comments removed only (import specifiers stay readable).
export function scan(src) {
  let code = '';
  let text = '';
  let i = 0;
  const n = src.length;
  let prev = ''; // last significant (non-space) character kept in `code`
  const both = (c) => { code += c; text += c; };
  while (i < n) {
    const c = src[i];
    const d = src[i + 1];
    if (c === '/' && d === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (c === '/' && d === '*') {
      i += 2;
      while (i < n && !(src[i] === '*' && src[i + 1] === '/')) { if (src[i] === '\n') both('\n'); i++; }
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const q = c;
      code += q; text += q;
      i++;
      while (i < n && src[i] !== q) {
        if (src[i] === '\\') { text += src[i] + (src[i + 1] ?? ''); i += 2; continue; }
        if (src[i] === '\n') code += '\n';
        text += src[i];
        i++;
      }
      code += q; text += q;
      i++;
      prev = q;
      continue;
    }
    if (c === '/' && '(,=:[!&|?{};+-*%<>~^'.includes(prev || ';')) {
      // regex literal
      let j = i + 1;
      let inClass = false;
      while (j < n && src[j] !== '\n') {
        if (src[j] === '\\') { j += 2; continue; }
        if (src[j] === '[') inClass = true;
        else if (src[j] === ']') inClass = false;
        else if (src[j] === '/' && !inClass) break;
        j++;
      }
      code += '/ /'; text += src.slice(i, j + 1);
      i = j + 1;
      while (i < n && /[a-z]/i.test(src[i])) { text += src[i]; i++; }
      prev = '/';
      continue;
    }
    both(c);
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  return { code, text };
}

// Returns [{ spec, dynamic }] for every import in the comment-free text.
export function importsOf(text) {
  const out = [];
  const stat = /\bimport\s+(?:[^'";()]*?\s+from\s*)?['"]([^'"]+)['"]/g;
  const reexp = /\bexport\s+(?:\*|\{[^}]*\})\s*(?:as\s+\w+\s*)?from\s*['"]([^'"]+)['"]/g;
  const dyn = /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = stat.exec(text))) out.push({ spec: m[1], dynamic: false });
  while ((m = reexp.exec(text))) out.push({ spec: m[1], dynamic: false });
  while ((m = dyn.exec(text))) out.push({ spec: m[1], dynamic: true });
  return out;
}

// Top-level statements of the blanked code: [{ head, body }]. A statement ends at a top-level `;` or at the `}` that
// closes a function, class or block statement.
export function topLevelStatements(code) {
  const stmts = [];
  let depth = 0;
  let cur = '';
  const flush = () => { const t = cur.trim(); if (t) stmts.push(t); cur = ''; };
  const blockHead = /^(?:export\s+(?:default\s+)?)?(?:async\s+)?(?:function\b|class\b)|^(?:if|for|while|try|switch|else|do)\b/;
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '{' || c === '(' || c === '[') depth++;
    else if (c === '}' || c === ')' || c === ']') depth--;
    cur += c;
    if (depth === 0 && c === ';') flush();
    else if (depth === 0 && c === '}' && blockHead.test(cur.trim())) {
      // `if (...) {} else {}` continues; a trailing `else`/`catch`/`finally` keeps the statement open
      const rest = code.slice(i + 1).match(/^\s*(else|catch|finally)\b/);
      if (!rest) flush();
    }
  }
  flush();
  return stmts;
}

const DECL_HEAD = /^(?:export\s+(?:default\s+)?)?(?:(?:async\s+)?function\b|class\b|const\b|let\b|var\b)|^import\b|^export\s*(?:\{|\*)|^export\s+default\b/;

// Returns the list of top-level statements that are not plain declarations (or that evaluate DOM/storage globals).
export function sideEffects(code) {
  const bad = [];
  for (const s of topLevelStatements(code)) {
    const head = s.replace(/\s+/g, ' ');
    if (!DECL_HEAD.test(head)) { bad.push(head.slice(0, 90)); continue; }
    if (/^(?:export\s+)?(?:const|let|var)\b/.test(head) && !/=>|\bfunction\b/.test(head)) {
      const hit = SIDE_EFFECT_GLOBALS.find((g) => new RegExp('\\b' + g + '\\b').test(head));
      if (hit) bad.push(`${head.slice(0, 70)}  (touches ${hit} at import time)`);
    }
  }
  return bad;
}

// ---------------------------------------------------------------- graph

function walk(dir, base, acc) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) { if (e.name !== 'node_modules') walk(full, base, acc); }
    else if (e.name.endsWith('.js') && !e.name.endsWith('.test.js')) acc.push(path.relative(base, full).split(path.sep).join('/'));
  }
  return acc;
}

function resolve(from, spec, root) {
  if (!spec.startsWith('.')) return null; // absolute path or URL: not a module of ours
  const clean = spec.split('?')[0].split('#')[0];
  let rel = path.posix.normalize(path.posix.join(path.posix.dirname(from), clean));
  if (!path.posix.extname(rel)) rel += '.js';
  return rel;
}

const kindOf = (f) => {
  if (f === 'src/main.js') return 'main';
  if (f === 'src/refresh.js') return 'refresh';
  if (FOUNDATION_UI.has(f)) return 'foundation-ui';
  if (f.startsWith('src/ui/')) return 'ui';
  if (f.startsWith('src/map/')) return 'map';
  if (f === 'src/data.js' || f === 'src/state.js' || f === 'src/bus.js' || f.startsWith('src/config/')) return 'foundation';
  if (f.startsWith('src/')) return 'src-other';
  if (f.startsWith('lib/')) return 'lib';
  if (f.startsWith('data/')) return 'data';
  return 'other';
};

const isOrch = (f) => ['main', 'refresh', 'ui', 'map'].includes(kindOf(f));

function check(root, entry) {
  const files = [...walk(path.join(root, 'src'), root, []), ...walk(path.join(root, 'lib'), root, [])];
  const edges = new Map(); // file -> [{ to, dynamic, spec }]
  const violations = [];
  const fail = (rule, msg) => violations.push({ rule, msg });
  const sources = new Map();
  for (const f of files) {
    const src = fs.readFileSync(path.join(root, f), 'utf8');
    const sc = scan(src);
    sources.set(f, sc);
    const list = [];
    for (const im of importsOf(sc.text)) {
      const to = resolve(f, im.spec, root);
      if (to) list.push({ to, dynamic: im.dynamic, spec: im.spec });
    }
    edges.set(f, list);
  }

  // every relative import must resolve to a file
  for (const [f, list] of edges) {
    for (const e of list) {
      if (!fs.existsSync(path.join(root, e.to))) fail('resolve', `${f} imports ${e.spec}, which does not exist (${e.to})`);
    }
  }

  // rules 1 to 4
  for (const [f, list] of edges) {
    const k = kindOf(f);
    for (const { to, spec } of list) {
      const tk = kindOf(to);
      if (k === 'lib' && !(tk === 'lib' || tk === 'data')) fail(1, `${f} imports ${spec}: lib/* may import only lib/* and data/*`);
      if (f.startsWith('src/') && tk === 'data' && f !== 'src/data.js') fail(2, `${f} imports ${spec}: only src/data.js may import data/*`);
      if (k === 'ui' || k === 'map' || k === 'foundation-ui') {
        const allowedFoundation = tk === 'lib' || tk === 'foundation' || tk === 'foundation-ui';
        const drawerIn = f === 'src/ui/drawer/index.js' && (to === 'src/ui/drawer/blocks/manifest.js' || to.startsWith('src/ui/drawer/blocks/'));
        const drawerManifest = f === 'src/ui/drawer/blocks/manifest.js' && to.startsWith('src/ui/drawer/blocks/');
        const mapSibling = k === 'map' && tk === 'map';
        if (!(allowedFoundation || drawerIn || drawerManifest || mapSibling)) {
          if (tk === 'ui' || tk === 'map') fail(3, `${f} imports ${spec}: UI and map modules never import each other (use bus events or runtime.hooks)`);
          else fail(3, `${f} imports ${spec}: not an allowed import for a ${k} module`);
        }
      }
      if ((tk === 'ui' || tk === 'map') && !['main', 'refresh', 'ui', 'map', 'foundation-ui'].includes(k)) {
        // (importers inside src/ui and src/map are judged by rule 3 above)
        fail(4, `${f} imports ${spec}: only src/refresh.js and src/main.js import UI modules`);
      }
    }
  }

  // rule 1 grep and rule 5
  for (const [f, sc] of sources) {
    if (f.startsWith('lib/')) {
      for (const g of GLOBALS_BANNED_IN_LIB) {
        if (new RegExp('\\b' + g + '\\b').test(sc.code)) fail(1, `${f} mentions ${g}: lib/* must stay DOM-free`);
      }
    }
    if (f !== entry) {
      for (const s of sideEffects(sc.code)) fail(5, `${f}: top-level statement runs at import time: ${s}`);
    }
  }

  // rule 6: cycles over all edges, chain length over static edges from the entry
  const state = new Map();
  const cycles = [];
  const stack = [];
  const dfs = (f) => {
    state.set(f, 1);
    stack.push(f);
    for (const { to } of edges.get(f) || []) {
      if (!edges.has(to)) continue;
      if (state.get(to) === 1) cycles.push([...stack.slice(stack.indexOf(to)), to].join(' -> '));
      else if (!state.get(to)) dfs(to);
    }
    stack.pop();
    state.set(f, 2);
  };
  if (!edges.has(entry)) fail(6, `entry ${entry} not found`);
  else dfs(entry);
  for (const f of files) if (!state.get(f)) dfs(f); // modules not reachable from the entry still must not cycle
  for (const c of cycles) fail(6, `import cycle: ${c}`);

  const memo = new Map();
  const chain = (f, orchOnly) => {
    const key = f + (orchOnly ? '|o' : '|f');
    if (memo.has(key)) return memo.get(key);
    memo.set(key, { n: 0, path: [] }); // cycle guard
    let best = { n: 0, path: [] };
    for (const { to, dynamic } of edges.get(f) || []) {
      if (dynamic || !edges.has(to)) continue;
      if (orchOnly && !isOrch(to)) continue;
      const c = chain(to, orchOnly);
      if (c.n > best.n) best = c;
    }
    const res = { n: best.n + 1, path: [f, ...best.path] };
    memo.set(key, res);
    return res;
  };
  let orch = { n: 0, path: [] };
  let full = { n: 0, path: [] };
  if (edges.has(entry)) {
    orch = chain(entry, true);
    full = chain(entry, false);
  }
  if (orch.n > MAX_CHAIN) fail(6, `longest orchestration chain is ${orch.n} modules (max ${MAX_CHAIN}): ${orch.path.join(' -> ')}`);

  const reach = new Set();
  const mark = (f) => { if (reach.has(f)) return; reach.add(f); for (const { to } of edges.get(f) || []) if (edges.has(to)) mark(to); };
  if (edges.has(entry)) mark(entry);
  const unreachable = files.filter((f) => !reach.has(f) && kindOf(f) !== 'lib');

  return { files, violations, orch, full, unreachable, edges };
}

// ---------------------------------------------------------------- self test: planted violations must be caught

function selfTest() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lsf-import-graph-'));
  const put = (rel, body) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, body); };
  put('data/x.js', 'export const x = 1;\n');
  put('lib/ok.js', "import { x } from '../data/x.js';\nexport const y = x;\n");
  put('lib/bad-dom.js', "export const f = () => document.title;\n");
  put('lib/bad-import.js', "import { s } from '../src/state.js';\nexport const z = s;\n");
  put('src/data.js', "export { x } from '../data/x.js';\n");
  put('src/state.js', "export const s = {};\n");
  put('src/bus.js', 'export const on = () => {};\n');
  put('src/ui/dom.js', 'export const el = () => 0;\n');
  put('src/ui/a.js', "import { b } from './b.js';\nexport const a = b;\n");
  put('src/ui/b.js', "import { a } from './a.js';\nexport const b = a;\n");
  put('src/ui/data-direct.js', "import { x } from '../../data/x.js';\nexport const d = x;\n");
  put('src/ui/effect.js', "document.title = 'x';\nexport const e = 1;\n");
  put('src/ui/effect2.js', "export const t = document.title;\n");
  put('src/ui/fine.js', "import { el } from './dom.js';\nconst rx = /['\"]/g;\nexport function ok() { return el(rx) + 'document'; }\n");
  put('src/main.js', "import { a } from './ui/a.js';\nimport './ui/data-direct.js';\nimport './ui/effect.js';\nimport './ui/effect2.js';\nimport './ui/fine.js';\nimport '../lib/ok.js';\nimport '../lib/bad-dom.js';\nimport '../lib/bad-import.js';\nimport './data.js';\nimport './state.js';\nimport './bus.js';\nconsole.log(a);\n");
  const r = check(dir, 'src/main.js');
  fs.rmSync(dir, { recursive: true, force: true });
  const want = [
    [1, 'lib/bad-dom.js mentions document'], [1, 'lib/bad-import.js imports'], [2, 'src/ui/data-direct.js imports'],
    [3, 'src/ui/a.js imports ./b.js'], [5, 'src/ui/effect.js'], [5, 'src/ui/effect2.js'], [6, 'import cycle'],
  ];
  let ok = true;
  for (const [rule, frag] of want) {
    const hit = r.violations.some((v) => v.rule === rule && v.msg.includes(frag));
    console.log(`${hit ? 'caught ' : 'MISSED '} rule ${rule}: ${frag}`);
    if (!hit) ok = false;
  }
  const falsePositive = r.violations.filter((v) => v.msg.startsWith('src/ui/fine.js') || v.msg.startsWith('lib/ok.js') || v.msg.startsWith('src/main.js'));
  for (const v of falsePositive) { console.log(`FALSE POSITIVE: rule ${v.rule} ${v.msg}`); ok = false; }
  console.log(ok ? 'self-test: the checker catches every planted violation and flags nothing else' : 'self-test: FAILED');
  return ok ? 0 : 1;
}

// ---------------------------------------------------------------- main

function main(argv) {
  const arg = (name, dflt) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : dflt; };
  if (argv.includes('--self-test')) return selfTest();
  const root = path.resolve(arg('--root', path.resolve(HERE, '..', '..', '..')));
  const entry = arg('--entry', 'src/main.js');
  const r = check(root, entry);
  const byRule = (n) => r.violations.filter((v) => String(v.rule) === String(n));
  const labels = {
    1: 'lib/* imports only lib/* and data/*, DOM-free',
    2: 'src/data.js is the only importer of data/*',
    3: 'ui/* and map/* import only foundation modules (no UI-to-UI, no ui<->map)',
    4: 'only refresh.js and main.js import UI modules',
    5: 'no import-time side effects (main.js exempt: it is the boot entry)',
    6: `acyclic, longest orchestration chain at most ${MAX_CHAIN} modules`,
  };
  console.log(`import graph: ${r.files.length} modules under src/ and lib/, entry ${entry}`);
  for (let n = 1; n <= 6; n++) {
    const v = byRule(n);
    console.log(`  rule ${n}: ${v.length ? 'FAIL' : 'ok  '}  ${labels[n]}`);
    for (const x of v) console.log(`      - ${x.msg}`);
  }
  for (const x of r.violations.filter((v) => v.rule === 'resolve')) console.log(`  unresolved import: ${x.msg}`);
  console.log(`  longest orchestration chain: ${r.orch.n} modules (${r.orch.path.join(' -> ')})`);
  console.log(`  longest full chain (informational, modulepreload must list every module): ${r.full.n} modules (${r.full.path.join(' -> ')})`);
  if (r.unreachable.length) console.log(`  not reachable from ${entry} by any import: ${r.unreachable.join(', ')}`);
  const out = arg('--json', null);
  if (out) {
    fs.writeFileSync(out, JSON.stringify({
      entry, modules: r.files.length, violations: r.violations, orchestrationChain: r.orch, fullChain: r.full,
      unreachable: r.unreachable,
    }, null, 2));
  }
  console.log(r.violations.length ? `FAIL: ${r.violations.length} violation(s)` : 'PASS: rules 1 to 6 satisfied');
  return r.violations.length ? 1 : 0;
}

process.exit(main(process.argv.slice(2)));
