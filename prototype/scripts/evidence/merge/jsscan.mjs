// Source-text scanner for the data modules (house-format JS object literals and plain JSON).
// Zero dependencies. It never evaluates anything: it walks the SOURCE TEXT, skipping strings, template
// literals and comments, so a patch can replace exactly one value and leave every comment, quote style and
// line break around it untouched. Two independent paths (this scanner, and a re-import of the module) are
// compared by patch_js.mjs after every write.
//
// Vocabulary
//   entry   : { key, keyStart, keyEnd, valStart, valEnd, comma, entryStart, entryEnd }
//             valStart..valEnd is the value expression (no surrounding trivia), comma is the index of the
//             separating comma (or -1), entryStart is where the key begins.
//   parts   : a path. A string selects an object key; '[id=cascadia]' / '[region_id=alentejo]' selects the array
//             element whose own `id` / `region_id` entry equals the value; '[3]' selects an array index.

const WS = /\s/;

export function skipLineComment(src, i) {
  while (i < src.length && src[i] !== '\n') i++;
  return i;
}
export function skipBlockComment(src, i) {
  const e = src.indexOf('*/', i + 2);
  return e < 0 ? src.length : e + 2;
}
// Skip whitespace and comments starting at i; returns the index of the next significant character.
export function skipTrivia(src, i) {
  for (;;) {
    while (i < src.length && WS.test(src[i])) i++;
    if (src[i] === '/' && src[i + 1] === '/') i = skipLineComment(src, i);
    else if (src[i] === '/' && src[i + 1] === '*') i = skipBlockComment(src, i);
    else return i;
  }
}
// src[i] is a quote (' " `). Returns the index just after the closing quote.
export function skipString(src, i) {
  const q = src[i];
  i++;
  while (i < src.length) {
    const c = src[i];
    if (c === '\\') { i += 2; continue; }
    if (q === '`' && c === '$' && src[i + 1] === '{') { i = matchClose(src, i + 1) + 1; continue; }
    if (c === q) return i + 1;
    i++;
  }
  throw new Error(`unterminated string starting at ${i}`);
}
// src[i] is one of { [ (. Returns the index of the matching closer.
export function matchClose(src, i) {
  const open = src[i];
  const close = open === '{' ? '}' : open === '[' ? ']' : ')';
  let depth = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '"' || c === "'" || c === '`') { j = skipString(src, j) - 1; continue; }
    if (c === '/' && src[j + 1] === '/') { j = skipLineComment(src, j) - 1; continue; }
    if (c === '/' && src[j + 1] === '*') { j = skipBlockComment(src, j) - 1; continue; }
    if (c === '{' || c === '[' || c === '(') depth++;
    else if (c === '}' || c === ']' || c === ')') { depth--; if (depth === 0) return j; }
  }
  throw new Error(`unbalanced ${open} at ${i}`);
}
// Scan an expression starting at i (a significant character). Stops at a top-level , } ] ) or end.
// Returns { end: index after the last significant char, next: index of the terminator }.
function scanExpr(src, i) {
  let last = i;
  let j = i;
  for (; j < src.length; j++) {
    const c = src[j];
    if (c === '"' || c === "'" || c === '`') { j = skipString(src, j) - 1; last = j + 1; continue; }
    if (c === '/' && src[j + 1] === '/') { j = skipLineComment(src, j) - 1; continue; }
    if (c === '/' && src[j + 1] === '*') { j = skipBlockComment(src, j) - 1; continue; }
    if (c === '{' || c === '[' || c === '(') { j = matchClose(src, j); last = j + 1; continue; }
    if (c === ',' || c === '}' || c === ']' || c === ')') return { end: last, next: j };
    if (!WS.test(c)) last = j + 1;
  }
  return { end: last, next: src.length };
}

export function decodeString(raw) {
  // raw includes its quotes
  const body = raw.slice(1, -1);
  let out = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (c !== '\\') { out += c; continue; }
    const n = body[++i];
    if (n === 'n') out += '\n';
    else if (n === 't') out += '\t';
    else if (n === 'r') out += '\r';
    else if (n === 'b') out += '\b';
    else if (n === 'f') out += '\f';
    else if (n === 'v') out += '\v';
    else if (n === '0') out += '\0';
    else if (n === 'x') { out += String.fromCharCode(parseInt(body.slice(i + 1, i + 3), 16)); i += 2; }
    else if (n === 'u') {
      if (body[i + 1] === '{') { const e = body.indexOf('}', i); out += String.fromCodePoint(parseInt(body.slice(i + 2, e), 16)); i = e; }
      else { out += String.fromCharCode(parseInt(body.slice(i + 1, i + 5), 16)); i += 4; }
    } else if (n === '\n') { /* line continuation */ } else out += n;
  }
  return out;
}

// Parse the entries of the object literal whose `{` is at src[open].
export function objectEntries(src, open) {
  if (src[open] !== '{') throw new Error(`objectEntries: no { at ${open}`);
  const close = matchClose(src, open);
  const entries = [];
  let i = open + 1;
  for (;;) {
    i = skipTrivia(src, i);
    if (i >= close) break;
    if (src[i] === ',') { i++; continue; }
    const entryStart = i;
    let key = null;
    let keyEnd = i;
    if (src.startsWith('...', i)) {
      const { end, next } = scanExpr(src, i);
      entries.push({ key: null, spread: true, keyStart: i, keyEnd: i, valStart: i, valEnd: end, comma: src[next] === ',' ? next : -1, entryStart, entryEnd: end });
      i = next;
      continue;
    }
    if (src[i] === '"' || src[i] === "'") { keyEnd = skipString(src, i); key = decodeString(src.slice(i, keyEnd)); }
    else if (src[i] === '[') { keyEnd = matchClose(src, i) + 1; key = null; }
    else { let j = i; while (j < src.length && /[A-Za-z0-9_$]/.test(src[j])) j++; if (j === i) throw new Error(`objectEntries: cannot read a key at ${i}: ${JSON.stringify(src.slice(i, i + 40))}`); keyEnd = j; key = src.slice(i, j); }
    let k = skipTrivia(src, keyEnd);
    if (src[k] === ':') {
      const valStart = skipTrivia(src, k + 1);
      const { end, next } = scanExpr(src, valStart);
      entries.push({ key, keyStart: entryStart, keyEnd, valStart, valEnd: end, comma: src[next] === ',' ? next : -1, entryStart, entryEnd: end });
      i = next;
    } else {
      // shorthand or method: keep the whole thing as an opaque entry
      const { end, next } = scanExpr(src, entryStart);
      entries.push({ key, keyStart: entryStart, keyEnd, valStart: entryStart, valEnd: end, comma: src[next] === ',' ? next : -1, entryStart, entryEnd: end, opaque: true });
      i = next;
    }
  }
  return { open, close, entries };
}

// Elements of the array literal whose `[` is at src[open].
export function arrayElements(src, open) {
  if (src[open] !== '[') throw new Error(`arrayElements: no [ at ${open}`);
  const close = matchClose(src, open);
  const els = [];
  let i = open + 1;
  for (;;) {
    i = skipTrivia(src, i);
    if (i >= close) break;
    if (src[i] === ',') { i++; continue; }
    const { end, next } = scanExpr(src, i);
    els.push({ valStart: i, valEnd: end, comma: src[next] === ',' ? next : -1, entryStart: i, entryEnd: end });
    i = next;
  }
  return { open, close, elements: els };
}

// Position of `export const <name> = ` value (the { or [ ), or -1.
export function findExport(src, name) {
  const re = new RegExp(`(^|\\n)\\s*export\\s+(?:const|let|var)\\s+${name.replace(/[$]/g, '\\$')}\\s*=\\s*`, 'g');
  let m;
  while ((m = re.exec(src))) {
    const pos = m.index + m[0].length;
    // make sure the match is real code, not inside a comment line
    const lineStart = src.lastIndexOf('\n', m.index + (m[1] ? 1 : 0)) + 1;
    if (/^\s*(\/\/|\*)/.test(src.slice(lineStart, pos))) continue;
    return pos;
  }
  return -1;
}
// Names of every `export const X = {|[` in the file.
export function exportedObjects(src) {
  const out = [];
  const re = /(^|\n)export\s+const\s+([A-Za-z0-9_$]+)\s*=\s*/g;
  let m;
  while ((m = re.exec(src))) {
    const pos = m.index + m[0].length;
    if (src[pos] === '{' || src[pos] === '[') out.push({ name: m[2], pos });
  }
  return out;
}

export function readLiteral(src, valStart, valEnd) {
  const text = src.slice(valStart, valEnd);
  const c = text[0];
  if ((c === '"' || c === "'" || c === '`') && skipString(src, valStart) === valEnd) {
    if (c === '`' && text.includes('${')) return { type: 'other', text };
    return { type: 'string', quote: c, value: decodeString(text), text };
  }
  if (/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?$/i.test(text)) return { type: 'number', value: Number(text), text };
  if (text === 'null') return { type: 'null', value: null, text };
  if (text === 'true' || text === 'false') return { type: 'bool', value: text === 'true', text };
  if (text === 'undefined') return { type: 'undefined', value: undefined, text };
  if (c === '{') return { type: 'object', text };
  if (c === '[') return { type: 'array', text };
  return { type: 'other', text };
}

export function encodeString(value, quote = '"') {
  let s = String(value).replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
  if (quote === '"') s = s.replace(/"/g, '\\"');
  else if (quote === "'") s = s.replace(/'/g, "\\'");
  else if (quote === '`') s = s.replace(/`/g, '\\`').replace(/\$\{/g, '\\${');
  return quote + s + quote;
}

const SEL = /^\[([A-Za-z_$][\w$]*)=(.*)\]$/;
const IDX = /^\[(\d+)\]$/;

// Resolve `parts` below the container whose value starts at `start` (a { or [). Returns the entry-like record of
// the final value, plus `parent` info: { kind:'object'|'array', open, close, siblings, index }.
export function resolveFrom(src, start, parts) {
  let cur = { valStart: start, valEnd: start };
  let parent = null;
  let at = start;
  for (let p = 0; p < parts.length; p++) {
    const part = parts[p];
    if (src[at] === '{') {
      const obj = objectEntries(src, at);
      const idx = obj.entries.findIndex((e) => e.key === part);
      if (idx < 0) return { found: false, missing: part, depth: p };
      cur = obj.entries[idx];
      parent = { kind: 'object', open: obj.open, close: obj.close, siblings: obj.entries, index: idx };
    } else if (src[at] === '[') {
      const arr = arrayElements(src, at);
      let idx = -1;
      let m;
      if ((m = IDX.exec(part))) idx = Number(m[1]) < arr.elements.length ? Number(m[1]) : -1;
      else if ((m = SEL.exec(part))) {
        const [, k, vRaw] = m;
        const want = vRaw.replace(/^(['"])(.*)\1$/, '$2');
        idx = arr.elements.findIndex((el) => {
          if (src[el.valStart] !== '{') return false;
          const o = objectEntries(src, el.valStart);
          const e = o.entries.find((x) => x.key === k);
          if (!e) return false;
          const lit = readLiteral(src, e.valStart, e.valEnd);
          return lit.type === 'string' && lit.value === want;
        });
      }
      if (idx < 0) return { found: false, missing: part, depth: p };
      cur = arr.elements[idx];
      parent = { kind: 'array', open: arr.open, close: arr.close, siblings: arr.elements, index: idx };
    } else {
      return { found: false, missing: part, depth: p, notContainer: true };
    }
    at = cur.valStart;
  }
  return { found: true, entry: cur, parent };
}

// parts[0] names an export; '$' means "the JSON root".
export function resolve(src, parts) {
  let start;
  if (parts[0] === '$') start = skipTrivia(src, 0);
  else {
    start = findExport(src, parts[0]);
    if (start < 0) return { found: false, missing: parts[0], depth: 0 };
  }
  if (parts.length === 1) return { found: true, entry: { valStart: start, valEnd: start + (src[start] === '{' || src[start] === '[' ? matchClose(src, start) - start + 1 : 0) }, parent: null };
  return resolveFrom(src, start, parts.slice(1));
}

export function replaceRange(src, start, end, text) {
  return src.slice(0, start) + text + src.slice(end);
}

// Remove an entry or element (with its comma and its own line) from a container. `rec` is a record from
// objectEntries/arrayElements, `siblings` the full list, `index` its position.
// extraCommentIds: attached line comments directly above that mention one of these strings are removed too.
export function removeSpan(src, siblings, index, extraCommentIds = []) {
  const rec = siblings[index];
  let s = rec.entryStart;
  let e = rec.comma >= 0 ? rec.comma + 1 : rec.entryEnd;
  const ls = src.lastIndexOf('\n', s - 1) + 1;
  const onOwnLine = /^[ \t]*$/.test(src.slice(ls, s));
  if (onOwnLine) {
    // consume trailing spaces and one same-line comment, then the newline
    let k = e;
    while (src[k] === ' ' || src[k] === '\t') k++;
    if (src[k] === '/' && src[k + 1] === '/') k = skipLineComment(src, k);
    if (src[k] === '\n' || k >= src.length) { s = ls; e = k < src.length ? k + 1 : k; }
    else { e = k; }
    // attached comment lines directly above that mention the id
    if (s === ls && extraCommentIds.length) {
      for (;;) {
        const prevEnd = s - 1; // the \n before this line
        if (prevEnd < 0) break;
        const prevStart = src.lastIndexOf('\n', prevEnd - 1) + 1;
        const line = src.slice(prevStart, prevEnd);
        if (/^\s*\/\//.test(line) && extraCommentIds.some((id) => line.toLowerCase().includes(id.toLowerCase()))) s = prevStart;
        else break;
      }
    }
  } else {
    let k = e;
    while (src[k] === ' ' || src[k] === '\t') k++;
    e = k;
  }
  let out = src.slice(0, s) + src.slice(e);
  // last element without a comma: drop the previous element's comma (keeps JSON valid)
  if (rec.comma < 0 && index > 0) {
    const prev = siblings[index - 1];
    if (prev.comma >= 0) {
      const adj = prev.comma < s ? prev.comma : prev.comma - (e - s);
      if (out[adj] === ',') out = out.slice(0, adj) + out.slice(adj + 1);
    }
  }
  return out;
}

// Insert a new `key: literal,` entry into the object literal at src[open], after the entry named `afterKey` (or after the
// last entry when afterKey is null/absent). The new entry takes the indentation of its neighbour when that neighbour sits on
// its own line; for single-line objects it is inserted inline after the neighbour's comma.
export function insertEntryAfter(src, open, afterKey, key, literalText, { keyText = null } = {}) {
  const o = objectEntries(src, open);
  if (!o.entries.length) throw new Error('insertEntryAfter: empty object');
  let idx = afterKey ? o.entries.findIndex((e) => e.key === afterKey) : -1;
  if (idx < 0) idx = o.entries.length - 1;
  const rec = o.entries[idx];
  let s = src;
  let end = rec.comma >= 0 ? rec.comma + 1 : rec.entryEnd;
  if (rec.comma < 0) { s = replaceRange(s, rec.entryEnd, rec.entryEnd, ','); end = rec.entryEnd + 1; }
  const k = keyText || (/^[A-Za-z_$][\w$]*$/.test(key) ? key : `'${key}'`);
  const ls = s.lastIndexOf('\n', rec.entryStart - 1) + 1;
  const ownLine = /^[ \t]*$/.test(s.slice(ls, rec.entryStart));
  const nextNl = s.indexOf('\n', end);
  const restOfLine = s.slice(end, nextNl < 0 ? s.length : nextNl);
  if (ownLine && (restOfLine.trim() === '' || /^\s*\/\//.test(restOfLine))) {
    const indent = s.slice(ls, rec.entryStart);
    const at = nextNl < 0 ? s.length : nextNl + 1;
    const ins = `${indent}${k}: ${literalText},\n`;
    return s.slice(0, at) + (nextNl < 0 ? '\n' : '') + ins + s.slice(at);
  }
  return `${s.slice(0, end)} ${k}: ${literalText},${s.slice(end)}`;
}
