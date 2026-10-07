#!/usr/bin/env node
// URL health for the evidence track. Opens every URL a data file, a text file or a
// replacements file cites, and exits 1 only for a URL that is dead and not accounted for.
//
//   node scripts/evidence/linkcheck_urls.mjs --data
//       every URL in data/*.js and data/processed/*.json
//   node scripts/evidence/linkcheck_urls.mjs --files F [F...]
//       every URL in the named text files (.js/.mjs/.json are walked as data, everything
//       else is scanned line by line)
//   node scripts/evidence/linkcheck_urls.mjs --verify FILE
//       re-opens every `replace` / `keep-verified` / `archive` entry of a replacements file
//       (upgrade-2026-10/staging/links/replacements.json) and checks that the page that
//       opened contains the entry's `contains` phrase
//
// Options:
//   --list              print the URL universe with usages and exit (no network)
//   --json PATH         also write the full report as JSON
//   --no-browser        skip the Playwright fallback (blocked / TLS / timeout hosts)
//   --strict            URLs that are only tracked for replacement fail instead of being reported
//   --concurrency N     parallel requests (default 12; at most 2 per host)
//   --exceptions-dir D  where link-exceptions*.json live (default upgrade-2026-10/evidence-out)
//   --replacements F    replacements file used to recognise "pending replacement" URLs
//
// Classes: ok | redirected | unreachable-here (listed in a link-exceptions*.json: informational)
//          | pending-replacement (tracked in replacements.json, informational unless --strict)
//          | dead | blocked | error (these exit 1 when unlisted).
//
// link-exceptions*.json (one file per WP: EV-LINKS, BIO-2, DOC-6) hold rows
//   { url, host, reason: 'DNS not resolvable from sandbox' | 'blocks bots', verifiedVia, openedOn }
// for public-body (and a few publisher) pages that were opened by some other method (Playwright,
// the r.jina.ai reader proxy, WebFetch, Crossref, the Wayback copy of the owner page) but cannot be
// opened by this script in this sandbox. --verify re-opens a listed page through the mirror named
// in `verifiedVia` (reader | wayback | crossref) when that mirror answers; if the mirror is rate
// limiting, the listed row is accepted as is. A mirror that opens but lacks the phrase fails.
//
// Not alive even when HTTP says 200: pages whose title looks like a parked / hijacked domain
// (casino and domain-broker pages) or a soft 404 ("Page not found") count as dead.
//
// Real Chromium (Playwright, /usr/bin/python3) is used as the fallback for hosts that answer
// bots with 401/403/429/5xx, TLS-chain errors or timeouts. DNS failures are not sent to the browser
// (it shares the resolver) but are retried twice over plain HTTP, because this sandbox's resolver
// drops names now and then. A browser that is shown the real page under a 401/403 status counts as
// opened; a Cloudflare / "verifying your browser" wall does not.

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const PROTO = path.resolve(here, '..', '..');
const ROOT = path.resolve(PROTO, '..');
const UPG = path.join(ROOT, 'upgrade-2026-10');
const PYTHON = '/usr/bin/python3';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const URL_RE = /https?:\/\/[^\s"'<>\\`)\]}]+/g;
// XML namespaces, loopback, the signup POST endpoint (never requested) and example hosts.
const SKIP_HOST = /^(www\.w3\.org|localhost|127\.0\.0\.1|formsubmit\.co|example\.(com|org|net))$/i;
const SEARCH_HOST = /(^|\.)(google\.[a-z.]+|bing\.com|duckduckgo\.com|yandex\.[a-z]+|baidu\.com|search\.yahoo\.com|ecosia\.org|startpage\.com)$/i;
const ARCHIVE_HOST = /(^|\.)(web\.archive\.org|archive\.org|archive\.ph|archive\.today|archive\.is|webcache\.googleusercontent\.com)$/i;
const REASONS = ['DNS not resolvable from sandbox', 'blocks bots', 'incomplete TLS chain'];

// ------------------------------------------------------------------ args
const argv = process.argv.slice(2);
const opts = { mode: null, files: [], verify: null, list: false, json: null, browser: true, strict: false, concurrency: 12,
  exDir: path.join(UPG, 'evidence-out'), replacements: path.join(UPG, 'staging', 'links', 'replacements.json') };
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === '--data') opts.mode = 'data';
  else if (a === '--files') { opts.mode = 'files'; while (argv[i + 1] && !argv[i + 1].startsWith('--')) opts.files.push(path.resolve(argv[++i])); }
  else if (a === '--verify') { opts.mode = 'verify'; opts.verify = path.resolve(argv[++i] || ''); }
  else if (a === '--list') opts.list = true;
  else if (a === '--json') opts.json = path.resolve(argv[++i]);
  else if (a === '--no-browser') opts.browser = false;
  else if (a === '--strict') opts.strict = true;
  else if (a === '--concurrency') opts.concurrency = Math.max(1, Number(argv[++i]) || 12);
  else if (a === '--exceptions-dir') opts.exDir = path.resolve(argv[++i]);
  else if (a === '--replacements') opts.replacements = path.resolve(argv[++i]);
  else { console.error(`unknown argument: ${a}`); process.exit(2); }
}
if (!opts.mode) {
  console.error('usage: linkcheck_urls.mjs (--data | --files F... | --verify FILE) [--list] [--json PATH] [--no-browser] [--strict]');
  process.exit(2);
}
if (opts.mode === 'files' && !opts.files.length) { console.error('--files needs at least one file'); process.exit(2); }

// ------------------------------------------------------------------ URL extraction
const rel = (f) => (f.startsWith(ROOT + '/') ? f.slice(ROOT.length + 1) : f);
function cleanUrl(u) {
  u = u.replace(/[.,;:!?*_]+$/, '');
  return u;
}
// The site's own pages (and edge functions) are checked against this tree, not the network: a page added in this upgrade is not
// live until the deploy, so its canonical URL answers 404 here without being a dead link.
const SELF_HOST = 'land-selection-framework.regencommunity.tools';
function selfOriginPresent(u) {
  let x;
  try { x = new URL(u); } catch { return false; }
  if (x.hostname !== SELF_HOST) return false;
  const p = decodeURIComponent(x.pathname).replace(/^\/+/, '');
  const cands = p === '' ? ['index.html'] : [p, `${p}.html`, `${p}/index.html`, `${p}.js`, `${p}.mjs`, `${p}.txt`, `${p}.xml`];
  if (p.startsWith('api/')) cands.push(`${p}.js`);
  return cands.some((c) => { try { return !c.includes('..') && fs.statSync(path.join(PROTO, c)).isFile(); } catch { return false; } });
}

function usable(u) {
  let x;
  try { x = new URL(u); } catch { return false; }
  if (SKIP_HOST.test(x.hostname)) return false;
  if (/[{}$<>|^]|%7B|%7D/i.test(u)) return false; // tile templates and placeholders are not links
  return true;
}

const usages = new Map(); // url -> [{file, path}]
function add(url, usage) {
  url = cleanUrl(url);
  if (!usable(url)) return;
  if (!usages.has(url)) usages.set(url, []);
  usages.get(url).push(usage);
}
function walk(node, p, file, seen = new WeakSet()) {
  if (typeof node === 'string') {
    for (const m of node.match(URL_RE) || []) add(m, { file: rel(file), path: p });
  } else if (node && typeof node === 'object') {
    if (seen.has(node)) return;
    seen.add(node);
    for (const [k, v] of Object.entries(node)) {
      const label = v && typeof v === 'object' && !Array.isArray(v) && typeof v.id === 'string' && Array.isArray(node) ? `id=${v.id}` : k;
      walk(v, p ? (Array.isArray(node) ? `${p}[${label}]` : `${p}.${k}`) : String(k), file, seen);
    }
  }
}
function textScan(file) {
  fs.readFileSync(file, 'utf8').split('\n').forEach((line, i) => {
    for (const m of line.match(URL_RE) || []) add(m, { file: rel(file), path: `line ${i + 1}` });
  });
}
async function loadModule(file) {
  const src = fs.readFileSync(file, 'utf8');
  if (/^\s*(export|import)\s/m.test(src)) {
    const tmp = path.join(os.tmpdir(), `linkcheck-urls-${process.pid}-${Math.random().toString(36).slice(2)}.mjs`);
    fs.writeFileSync(tmp, src);
    try { return await import(pathToFileURL(tmp).href); } finally { fs.rmSync(tmp, { force: true }); }
  }
  const sandbox = { console: { log() {}, warn() {}, error() {} } };
  sandbox.window = sandbox; sandbox.globalThis = sandbox; sandbox.self = sandbox;
  vm.createContext(sandbox);
  vm.runInContext(src, sandbox, { filename: file, timeout: 5000 });
  const out = {};
  for (const [k, v] of Object.entries(sandbox)) if (!['console', 'window', 'globalThis', 'self'].includes(k)) out[k] = v;
  return out;
}
async function extractFile(file) {
  if (!fs.existsSync(file)) { console.error(`missing file: ${file}`); return; }
  if (/\.m?js$/.test(file)) {
    try {
      const mod = await loadModule(file);
      for (const [name, val] of Object.entries(mod)) walk(val, name, file);
      return;
    } catch (e) {
      console.error(`note: ${rel(file)} did not load as a module (${String(e.message).split('\n')[0]}); scanning it as text`);
    }
    textScan(file);
  } else if (/\.json$/.test(file)) {
    try { walk(JSON.parse(fs.readFileSync(file, 'utf8')), '', file); } catch { textScan(file); }
  } else textScan(file);
}

// ------------------------------------------------------------------ text helpers
const strip = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
function pageText(html) {
  return html
    .replace(/<(script|style|noscript|template)[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, '<').replace(/&gt;/gi, '>')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)));
}
const fold = (s) => strip(String(s)).toLowerCase().replace(/[‐-―−]/g, '-').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const WALL_RE = /just a moment|attention required|verifying your browser|security verification|captcha|you have been blocked|access denied|enable javascript and cookies|request blocked|are you a robot/i;
const isWall = (rec) => WALL_RE.test(`${rec.title || ''} ${String(rec.text || '').slice(0, 400)}`);
const hasPhrase = (text, phrase) => fold(text).includes(fold(phrase));
const titleOf = (html) => { const m = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html); return m ? pageText(m[1]).replace(/\s+/g, ' ').trim() : ''; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const today = () => new Date().toISOString().slice(0, 10);

// ------------------------------------------------------------------ exceptions + replacements
function readJson(f) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch { return null; } }
function loadExceptions() {
  const rows = [];
  const bad = [];
  if (!fs.existsSync(opts.exDir)) return { map: new Map(), rows, bad };
  for (const f of fs.readdirSync(opts.exDir).sort()) {
    if (!/^link-exceptions.*\.json$/.test(f)) continue;
    const j = readJson(path.join(opts.exDir, f));
    const list = Array.isArray(j) ? j : j && (j.exceptions || j.rows || j.links || j.items);
    if (!Array.isArray(list)) { bad.push(`${f}: not an array / no "exceptions" array`); continue; }
    for (const r of list) {
      const miss = ['url', 'host', 'reason', 'verifiedVia', 'openedOn'].filter((k) => !r || !r[k]);
      if (miss.length) { bad.push(`${f}: row ${JSON.stringify(r && r.url)} lacks ${miss.join(', ')}`); continue; }
      if (!REASONS.includes(r.reason)) bad.push(`${f}: row ${r.url} has reason "${r.reason}" (expected one of: ${REASONS.join(' | ')})`);
      rows.push({ ...r, _file: f });
    }
  }
  const map = new Map();
  for (const r of rows) map.set(urlKey(r.url), r);
  return { map, rows, bad };
}
function urlKey(u) {
  try { const x = new URL(u); x.hash = ''; let s = x.href; if (s.endsWith('/') && x.pathname === '/' && !x.search) s = s.slice(0, -1); return s; } catch { return u; }
}
function loadPending() {
  const j = readJson(opts.replacements);
  const set = new Set();
  const list = Array.isArray(j) ? j : j && j.entries;
  for (const e of list || []) if (e && e.old && ['replace', 'drop', 'archive'].includes(e.action)) set.add(urlKey(e.old));
  return set;
}

// ------------------------------------------------------------------ fetching
async function fetchOnce(url, wantBody, headers, timeoutMs = 25000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const r = await fetch(url, { redirect: 'follow', signal: ac.signal, headers: headers || { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8', 'Accept-Language': 'en-US,en;q=0.9' } });
    const res = { status: r.status, finalUrl: r.url, contentType: r.headers.get('content-type') || '' };
    if (wantBody && r.status < 400) {
      const buf = Buffer.from(await r.arrayBuffer());
      if (/pdf/i.test(res.contentType) || buf.slice(0, 5).toString() === '%PDF-') {
        const tmp = path.join(os.tmpdir(), `linkcheck-urls-${process.pid}-${Math.random().toString(36).slice(2)}.pdf`);
        fs.writeFileSync(tmp, buf);
        try { res.text = execFileSync('pdftotext', ['-q', tmp, '-'], { maxBuffer: 64 * 1024 * 1024 }).toString('utf8'); res.title = '(pdf)'; }
        catch { res.text = ''; }
        finally { fs.rmSync(tmp, { force: true }); }
      } else {
        const html = buf.toString('utf8');
        res.title = titleOf(html);
        res.text = pageText(html);
      }
    } else {
      // read the first 48 KB of an HTML page so a hijacked / parked domain or a soft 404 can be told from a live page
      try {
        if (r.status < 400 && /html/i.test(res.contentType) && r.body) {
          const reader = r.body.getReader();
          let got = 0; const chunks = [];
          while (got < 48000) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; }
          try { await reader.cancel(); } catch { /* ignore */ }
          const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString('utf8');
          res.title = titleOf(html);
          res.head = pageText(html).replace(/\s+/g, ' ').slice(0, 600);
        } else await r.body?.cancel();
      } catch { /* ignore */ }
    }
    return res;
  } catch (e) {
    return { status: 0, error: `${e.cause?.code || e.name || 'error'}: ${e.cause?.message || e.message}`, code: e.cause?.code || e.name || 'error' };
  } finally { clearTimeout(t); }
}
async function fetchUrl(url, wantBody, headers, timeoutMs) {
  let r = await fetchOnce(url, wantBody, headers, timeoutMs);
  for (let n = 0; n < 2; n++) {
    // this sandbox's resolver drops names now and then, so even ENOTFOUND is tried again before a host is called dead
    const retry = r.status === 0 ? true : [408, 425, 429, 500, 502, 503, 504].includes(r.status);
    if (!retry) break;
    await sleep(1500 * (n + 1));
    const r2 = await fetchOnce(url, wantBody, headers, timeoutMs);
    if (r2.status !== 0 || r.status === 0) r = r2;
  }
  return r;
}

const PLAYWRIGHT_PY = String.raw`
import json, os, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright
job = json.load(open(sys.argv[1]))
UA = job["ua"]
out = {}
import re, unicodedata
def norm(t):
    t = unicodedata.normalize("NFD", t or "")
    t = "".join(c for c in t if not unicodedata.combining(c)).lower()
    return re.sub(r"\s+", " ", t).strip()
def pdf_text(body):
    with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as f:
        f.write(body); name = f.name
    try:
        return subprocess.run(["pdftotext", "-q", name, "-"], capture_output=True, timeout=60).stdout.decode("utf8", "replace")
    except Exception:
        return ""
    finally:
        os.unlink(name)
with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    ctx = b.new_context(user_agent=UA, ignore_https_errors=True, locale="en-US", viewport={"width": 1280, "height": 900},
                        extra_http_headers={"Accept-Language": "en-US,en;q=0.9"})
    for item in job["items"]:
        url = item["url"]
        rec = {"status": 0}
        try:
            looks_pdf = url.lower().split("?")[0].endswith(".pdf")
            if looks_pdf:
                r = ctx.request.get(url, timeout=45000, headers={"User-Agent": UA, "Accept": "application/pdf,*/*"})
                rec = {"status": r.status, "finalUrl": r.url, "title": "(pdf)", "text": pdf_text(r.body()) if r.status < 400 else ""}
            else:
                page = ctx.new_page()
                resp = page.goto(url, wait_until="domcontentloaded", timeout=35000)
                try:
                    page.wait_for_load_state("networkidle", timeout=8000)
                except Exception:
                    pass
                want = [norm(x) for x in item.get("phrases", []) if x]
                text = ""
                for _ in range(16):  # poll: single-page apps fill in late; stop as soon as every phrase is on the page
                    text = page.evaluate("() => (document.title || '') + ' ' + (document.body ? document.body.innerText : '')")
                    if want and all(w in norm(text) for w in want):
                        break
                    if not want and len(text) > 400:
                        break
                    page.wait_for_timeout(1000)
                rec = {"status": resp.status if resp else 0, "finalUrl": page.url, "title": page.title(), "text": (text or "")[:600000]}
                page.close()
        except Exception as e:
            msg = str(e)
            if "Download is starting" in msg:
                try:
                    r = ctx.request.get(url, timeout=45000, headers={"User-Agent": UA})
                    rec = {"status": r.status, "finalUrl": r.url, "title": "(download)", "text": pdf_text(r.body()) if r.status < 400 else ""}
                except Exception as e2:
                    rec = {"status": 0, "error": str(e2)[:200]}
            else:
                rec = {"status": 0, "error": msg.split("\n")[0][:200]}
        out[url] = rec
    b.close()
json.dump(out, open(sys.argv[2], "w"))
`;
// items: [{ url, phrases? }]; split over a few Chromium processes so a long list does not run page after page
async function browserBatch(items, workers = 4) {
  const res = new Map();
  if (!opts.browser || !items.length || !fs.existsSync(PYTHON)) return res;
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'linkcheck-urls-pw-'));
  const pyF = path.join(dir, 'run.py');
  fs.writeFileSync(pyF, PLAYWRIGHT_PY);
  const n = Math.min(workers, items.length);
  const chunks = Array.from({ length: n }, () => []);
  items.forEach((it, i) => chunks[i % n].push(it));
  await Promise.all(chunks.map((chunk, i) => new Promise((resolve) => {
    const jobF = path.join(dir, `job${i}.json`), outF = path.join(dir, `out${i}.json`);
    fs.writeFileSync(jobF, JSON.stringify({ ua: UA, items: chunk }));
    const child = spawn(PYTHON, [pyF, jobF, outF], { stdio: ['ignore', 'ignore', 'pipe'] });
    let err = '';
    child.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => child.kill('SIGKILL'), Math.max(180000, chunk.length * 60000));
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) console.error(`note: browser fallback worker ${i} failed (${err.split('\n').filter(Boolean).pop() || code}); continuing without it`);
      else for (const [u, rec] of Object.entries(readJson(outF) || {})) res.set(u, rec);
      resolve();
    });
  })));
  fs.rmSync(dir, { recursive: true, force: true });
  return res;
}

// pool with a per-host cap
async function pool(items, worker, concurrency) {
  const perHost = new Map();
  const queue = [...items];
  const out = new Array(items.length);
  const idx = new Map(items.map((it, i) => [it, i]));
  let active = 0;
  await new Promise((resolve) => {
    const next = () => {
      if (!queue.length && active === 0) return resolve();
      for (let q = 0; q < queue.length && active < concurrency; q++) {
        const it = queue[q];
        let h = ''; try { h = new URL(it.url || it).hostname; } catch { /* ignore */ }
        if ((perHost.get(h) || 0) >= 2) continue;
        queue.splice(q, 1); q--;
        active++; perHost.set(h, (perHost.get(h) || 0) + 1);
        worker(it).then((r) => { out[idx.get(it)] = r; }).catch((e) => { out[idx.get(it)] = { status: 0, error: String(e) }; })
          .finally(() => { active--; perHost.set(h, perHost.get(h) - 1); next(); });
      }
      if (!queue.length && active === 0) resolve();
    };
    next();
  });
  return out;
}

// a page that answers 200 but is a parked / hijacked domain or a soft 404 is dead, not alive
const SUSPECT_RE = /casino|slot gacor|slots? online|online betting|sportsbook|gambl|poker|domain (is )?for sale|buy this domain|this domain (may be|is) for sale|domain broker|parked (domain|page)|hugedomains|sedo\.com|afternic|viagra|\bporn|kaubamärgi/i;
const SOFT404_RE = /^\s*(error\s*)?404\b|page not found|not found\s*[-|–]|404\s*[-|–:]|nicht gefunden|introuvable|no existe|página no encontrada|pagina non trovata|seite nicht gefunden|ei leitud/i;
function suspect(r) {
  const t = `${r.title || ''}`;
  if (SUSPECT_RE.test(t)) return 'parked or hijacked domain';
  if (SOFT404_RE.test(t)) return 'soft 404';
  if (r.finalUrl && /(domeeninimi|hugedomains|sedo|afternic|dan\.com|godaddy\.com\/domainsearch|parkingcrew|bodis)\./i.test(r.finalUrl)) return 'redirects to a domain-broker page';
  return null;
}
function classify(r) {
  if (r.status >= 200 && r.status < 300) return suspect(r) ? 'dead' : 'ok';
  if (r.status === 405 || r.status === 501) return 'ok'; // endpoint exists, GET not its method
  if (r.status === 404 || r.status === 410) return 'dead';
  if ([401, 403, 429, 503].includes(r.status)) return 'blocked';
  if (r.status >= 500) return 'dead';
  if (r.status >= 300) return 'error';
  return /ENOTFOUND|EAI_AGAIN/.test(r.error || '') ? 'dead' : 'error';
}
const sameDoc = (a, b) => { try { const x = new URL(a), y = new URL(b); return x.hostname.replace(/^www\./, '') === y.hostname.replace(/^www\./, '') && x.pathname.replace(/\/+$/, '') === y.pathname.replace(/\/+$/, ''); } catch { return a === b; } };

// ------------------------------------------------------------------ modes: data / files
async function runCheck(urlList) {
  const exc = loadExceptions();
  const pending = loadPending();
  const results = new Map();
  const work = urlList.map((u) => ({ url: u }));
  const fetched = await pool(work, async (it) => fetchUrl(it.url, false), opts.concurrency);
  work.forEach((it, i) => results.set(it.url, fetched[i]));

  // browser fallback for what a bot cannot judge
  const needBrowser = [];
  for (const [u, r] of results) {
    const c = classify(r);
    if (c === 'ok') continue;
    if (c === 'dead' && r.status === 0 && /ENOTFOUND|EAI_AGAIN/.test(r.error || '')) continue;
    if (c === 'dead' && (r.status === 404 || r.status === 410)) continue;
    needBrowser.push(u);
  }
  const viaBrowser = await browserBatch(needBrowser.map((u) => ({ url: u })));
  for (const [u, rec] of viaBrowser) {
    const r = results.get(u);
    const shown = [401, 403, 429].includes(rec.status) && !isWall(rec) && String(rec.text || '').length > 300; // a real browser was shown the page
    if ((rec.status >= 200 && rec.status < 400 && !isWall(rec)) || shown) results.set(u, { ...rec, status: shown ? 200 : rec.status, via: 'browser', first: r });
  }

  // last chance for slow-but-live hosts: whatever still ended in a timeout or reset gets one patient plain request
  const slow = urlList.filter((u) => { const r = results.get(u); return classify(r) === 'error' || (r.status === 0 && !/ENOTFOUND|EAI_AGAIN/.test(r.error || '')); });
  const patient = await pool(slow.map((u) => ({ url: u })), async (it) => fetchOnce(it.url, false, undefined, 70000), 4);
  slow.forEach((u, i) => { if (patient[i] && patient[i].status && classify(patient[i]) === 'ok') results.set(u, patient[i]); });

  const rows = [];
  for (const u of urlList) {
    const r = results.get(u);
    let cls = classify(r);
    const redirected = cls === 'ok' && r.finalUrl && !sameDoc(u, r.finalUrl);
    let note = r.status ? `HTTP ${r.status}${r.via ? ' (browser)' : ''}` : (r.error || 'no response');
    if (r.status >= 200 && r.status < 300 && suspect(r)) note += ` | ${suspect(r)}: "${String(r.title || r.finalUrl).slice(0, 80)}"`;
    if (cls !== 'ok' && selfOriginPresent(u)) { cls = 'ok'; note += ' | the site\'s own page: file present in this tree, the live copy updates on deploy'; }
    if (cls === 'ok') cls = redirected ? 'redirected' : 'ok';
    else {
      const ex = exc.map.get(urlKey(u));
      if (ex) { cls = 'unreachable-here'; note += ` | listed: ${ex.reason}, via ${ex.verifiedVia}, opened ${ex.openedOn}`; }
      else if (pending.has(urlKey(u))) { cls = 'pending-replacement'; note += ' | tracked in replacements.json'; }
    }
    if (cls === 'redirected' && pending.has(urlKey(u))) note += ` -> ${r.finalUrl} | tracked in replacements.json`;
    else if (cls === 'redirected') note += ` -> ${r.finalUrl}`;
    if (cls === 'ok' && pending.has(urlKey(u))) { cls = 'pending-replacement'; note += ' | resolves but tracked in replacements.json as wrong or superseded'; }
    if (cls === 'redirected' && pending.has(urlKey(u))) cls = 'pending-replacement';
    rows.push({ url: u, cls, note, status: r.status || 0, finalUrl: r.finalUrl || null, usages: usages.get(u) || [] });
  }
  return { rows, exc };
}

function report(rows, exc) {
  const order = ['dead', 'blocked', 'error', 'pending-replacement', 'unreachable-here', 'redirected', 'ok'];
  const count = Object.fromEntries(order.map((c) => [c, rows.filter((r) => r.cls === c).length]));
  console.log(`\n${rows.length} unique URLs: ${order.map((c) => `${c} ${count[c]}`).join(' | ')}`);
  for (const c of ['dead', 'blocked', 'error', 'pending-replacement', 'unreachable-here']) {
    const sel = rows.filter((r) => r.cls === c);
    if (!sel.length) continue;
    console.log(`\n== ${c} (${sel.length})${c === 'unreachable-here' ? ' informational, listed in link-exceptions*.json' : c === 'pending-replacement' ? ' informational, tracked for replacement' : ''}`);
    for (const r of sel) {
      console.log(`  ${r.url}\n    ${r.note}\n    used in: ${r.usages.slice(0, 3).map((u) => `${u.file} ${u.path}`).join('; ')}${r.usages.length > 3 ? ` (+${r.usages.length - 3})` : ''}`);
    }
  }
  const failing = rows.filter((r) => ['dead', 'blocked', 'error'].includes(r.cls) || (opts.strict && r.cls === 'pending-replacement'));
  let exit = failing.length ? 1 : 0;
  if (exc.bad.length) { console.log(`\nlink-exceptions problems:\n  ${exc.bad.join('\n  ')}`); exit = 1; }
  console.log(`\n${exit ? 'FAIL' : 'PASS'}: ${failing.length} unlisted dead / blocked / error URL(s)${exc.bad.length ? `, ${exc.bad.length} malformed exceptions row(s)` : ''}`);
  return exit;
}

// ------------------------------------------------------------------ mode: verify
async function runVerify(file) {
  const j = readJson(file);
  const entries = Array.isArray(j) ? j : j && j.entries;
  if (!Array.isArray(entries)) { console.error(`${file}: expected { entries: [...] } or an array`); return 1; }
  const exc = loadExceptions();
  const problems = [];
  const ACTIONS = ['replace', 'keep-verified', 'drop', 'archive'];
  const toOpen = []; // {entry, url}
  entries.forEach((e, i) => {
    const tag = `entry ${i} (${e.target || '?'} ${e.old || '?'})`;
    if (!e.old) problems.push(`${tag}: no "old"`);
    if (!ACTIONS.includes(e.action)) problems.push(`${tag}: action "${e.action}" is not one of ${ACTIONS.join(' | ')}`);
    if (!e.target) problems.push(`${tag}: no "target"`);
    if (e.action === 'drop') {
      if (!e.reason) problems.push(`${tag}: drop needs a reason`);
      return;
    }
    const url = e.action === 'keep-verified' ? (e.new || e.old) : e.new;
    if (!url) { problems.push(`${tag}: ${e.action} needs "new"`); return; }
    if (!e.openedOn || !/^\d{4}-\d{2}-\d{2}/.test(e.openedOn)) problems.push(`${tag}: no valid openedOn`);
    if (!e.contains || !String(e.contains).trim()) problems.push(`${tag}: no "contains" phrase`);
    if (!e.title) problems.push(`${tag}: no "title"`);
    let host = '';
    try { host = new URL(url).hostname; } catch { problems.push(`${tag}: "${url}" is not a URL`); return; }
    if (SEARCH_HOST.test(host)) problems.push(`${tag}: points to a search engine`);
    if (ARCHIVE_HOST.test(host) && e.action !== 'archive') problems.push(`${tag}: points to an archive host but action is not "archive"`);
    if (e.action === 'archive' && !e.reason) problems.push(`${tag}: archive needs a reason`);
    if (/DetaliiDocument\/156631/.test(url)) problems.push(`${tag}: points at the wrong Transylvania decree (/156631)`);
    if (e.action === 'replace' && e.old && urlKey(e.old) === urlKey(url)) problems.push(`${tag}: replace with the same URL`);
    if (e.contains && e.openedOn) toOpen.push({ entry: e, url, tag });
  });

  // coverage: every dead / blocked / redirected URL of the recon sweep has an entry
  const lh = readJson(path.join(UPG, 'recon', 'link-health.json'));
  if (lh && Array.isArray(lh.results)) {
    const have = new Set(entries.map((e) => urlKey(e.old || '')));
    const miss = lh.results.filter((r) => ['dead', 'blocked', 'redirected-elsewhere'].includes(r.class) && !/formsubmit\.co\/ajax|wa\.me\//.test(r.url) && !have.has(urlKey(r.url)));
    for (const m of miss) problems.push(`coverage: ${m.class} URL from recon/link-health.json has no entry: ${m.url}`);
    console.log(`coverage: ${lh.results.filter((r) => ['dead', 'blocked', 'redirected-elsewhere'].includes(r.class)).length} dead/blocked/redirected recon URLs, ${miss.length} without an entry`);
  }

  // open each distinct page once
  const distinct = [...new Set(toOpen.map((t) => t.url))];
  const opened = new Map();
  const fetched = await pool(distinct.map((u) => ({ url: u })), async (it) => fetchUrl(it.url, true), opts.concurrency);
  distinct.forEach((u, i) => opened.set(u, fetched[i]));
  const phraseOk = (r, phrase) => r && (r.text || r.title) && hasPhrase(`${r.title || ''} ${r.text || ''}`, phrase);
  const phrasesFor = (u) => toOpen.filter((t) => t.url === u).map((t) => t.entry.contains);
  const needBrowser = distinct.filter((u) => {
    const r = opened.get(u);
    if (r.status >= 200 && r.status < 300 && phrasesFor(u).every((p) => phraseOk(r, p))) return false;
    if (r.status === 0 && /ENOTFOUND|EAI_AGAIN/.test(r.error || '')) return false;
    if (exc.map.has(urlKey(u))) return false; // listed: re-opened through its mirror below, a browser adds nothing
    return true;
  });
  const viaBrowser = await browserBatch(needBrowser.map((u) => ({ url: u, phrases: phrasesFor(u) })));
  for (const [u, rec] of viaBrowser) {
    const shown = [401, 403, 429].includes(rec.status) && !isWall(rec);
    if ((rec.status >= 200 && rec.status < 400 && !isWall(rec)) || shown) opened.set(u, { ...rec, status: shown ? 200 : rec.status, via: 'browser' });
  }

  // slow-but-live hosts: one patient plain request for whatever is still unopened (and not listed)
  const stillOpen = distinct.filter((u) => { const r = opened.get(u); return !exc.map.has(urlKey(u)) && !(r.status >= 200 && r.status < 400 && !isWall(r) && phrasesFor(u).every((p) => phraseOk(r, p))) && !(r.status === 0 && /ENOTFOUND|EAI_AGAIN/.test(r.error || '')); });
  const patient = await pool(stillOpen.map((u) => ({ url: u })), async (it) => fetchUrl(it.url, true, undefined, 70000), 4);
  stillOpen.forEach((u, i) => { const p = patient[i]; if (p && p.status >= 200 && p.status < 400 && phrasesFor(u).every((ph) => phraseOk(p, ph))) opened.set(u, p); });

  const log = [];
  const mirror = async (kind, u) => {
    const doi = /^https?:\/\/(dx\.)?doi\.org\/(10\.[^?#]+)/i.exec(u);
    const target = kind === 'wayback' ? `https://web.archive.org/web/2/${u}` : kind === 'crossref' && doi ? `https://api.crossref.org/works/${decodeURIComponent(doi[2])}` : `https://r.jina.ai/${u}`;
    if (kind === 'reader') await sleep(1600); // keep under the reader proxy's rate limit
    // the reader proxy forwards the client's UA / Accept to the target, so it gets a plain request (a browser UA draws the target's bot wall)
    const w = await fetchUrl(target, true, kind === 'reader' ? { 'User-Agent': 'Mozilla/5.0', Accept: 'text/plain' } : undefined);
    const m = /Target URL returned error (\d+)/.exec(w.text || '');
    if (m) w.status = Number(m[1]);
    return w;
  };
  const verdicts = new Map(); // url -> { log } | { problem }
  const checkOne = async (u) => {
    const r = opened.get(u);
    const ex = exc.map.get(urlKey(u));
    const phrases = phrasesFor(u);
    const missing = phrases.filter((p) => !phraseOk(r, p));
    const reachable = r.status >= 200 && r.status < 400 && !isWall(r);
    if (reachable && !missing.length) return { log: `ok        ${r.via ? '(browser) ' : ''}${u}` };
    if (ex) {
      // opened elsewhere (another network, reader proxy, Crossref or the Wayback copy of the owner page): re-open that way if it answers
      const kinds = [];
      if (/jina|reader proxy/i.test(ex.verifiedVia)) kinds.push('reader');
      if (/wayback|archive/i.test(ex.verifiedVia)) kinds.push('wayback');
      if (/crossref/i.test(ex.verifiedVia)) kinds.push('crossref');
      let refuted = null;
      for (const k of kinds) {
        const w = await mirror(k, u);
        if (w.status >= 200 && w.status < 400 && !isWall(w)) {
          const miss = phrases.filter((p) => !phraseOk(w, p));
          if (!miss.length) return { log: `unreachable-here (listed; ${k === 'reader' ? 'reader-proxy copy' : k === 'crossref' ? 'Crossref record' : 'Wayback copy of the owner page'} contains the phrase) ${u}` };
          refuted = `listed page ${u}: the ${k} copy opened but does not contain ${miss.map((m) => JSON.stringify(m)).join(', ')}`;
        }
      }
      if (refuted) return { problem: refuted };
      return { log: `unreachable-here (listed in ${ex._file}: ${ex.reason}; opened ${ex.openedOn} via ${ex.verifiedVia}; ${kinds.length ? 'mirror not answering now' : 'no mirror to re-open it'}) ${u}` };
    }
    if (reachable) return { problem: `phrase not on the opened page ${u} (HTTP ${r.status}${r.via ? ', browser' : ''}, title "${(r.title || '').slice(0, 80)}"): ${missing.map((m) => JSON.stringify(m)).join(', ')}` };
    return { problem: `could not open ${u} (${r.status ? 'HTTP ' + r.status : r.error}${isWall(r) ? ', bot wall' : ''}) and it is not listed in link-exceptions*.json` };
  };
  const queue = [...distinct];
  await Promise.all(Array.from({ length: 2 }, async () => { // a couple at a time: the reader proxy rate-limits
    while (queue.length) { const u = queue.shift(); verdicts.set(u, await checkOne(u)); }
  }));
  for (const u of distinct) { const v = verdicts.get(u); if (v.log) log.push(v.log); else problems.push(v.problem); }
  console.log(log.join('\n'));
  if (exc.bad.length) for (const b of exc.bad) problems.push(`link-exceptions: ${b}`);
  const counts = entries.reduce((a, e) => ((a[e.action] = (a[e.action] || 0) + 1), a), {});
  console.log(`\n${entries.length} entries (${Object.entries(counts).map(([k, v]) => `${k} ${v}`).join(', ')}); ${distinct.length} distinct pages opened`);
  if (problems.length) { console.log(`\nFAIL: ${problems.length} problem(s)\n  ${problems.join('\n  ')}`); return 1; }
  console.log('PASS: every replace / keep-verified / archive entry opened and carries its contains phrase');
  return 0;
}

// ------------------------------------------------------------------ main
async function main() {
  if (opts.mode === 'verify') return runVerify(opts.verify);
  const files = [];
  if (opts.mode === 'data') {
    const d = path.join(PROTO, 'data');
    for (const f of fs.readdirSync(d).sort()) if (/\.js$/.test(f)) files.push(path.join(d, f));
    const pd = path.join(d, 'processed');
    if (fs.existsSync(pd)) for (const f of fs.readdirSync(pd).sort()) if (/\.json$/.test(f)) files.push(path.join(pd, f));
  } else files.push(...opts.files);
  for (const f of files) await extractFile(f);
  const urls = [...usages.keys()].sort();
  console.log(`${urls.length} unique URLs from ${files.length} files`);
  if (opts.list) {
    for (const u of urls) console.log(`${u}\n    ${usages.get(u).slice(0, 4).map((x) => `${x.file} ${x.path}`).join('; ')}`);
    return 0;
  }
  const { rows, exc } = await runCheck(urls);
  if (opts.json) fs.writeFileSync(opts.json, JSON.stringify({ generated: new Date().toISOString(), mode: opts.mode, rows }, null, 2));
  return report(rows, exc);
}

process.exitCode = await main();
