#!/usr/bin/env node
// check_pages.mjs [--root DIR] [--sitemap FILE]
//
// Static integrity of the generated pages (the browser-level 404 check belongs to the e2e suite):
//   * every <loc> of the sitemap maps to a file under --root; every region id of data/regions.js has region/<id>.html
//     and is listed in the sitemap
//   * every sitemap page and every region page has exactly one <h1, exactly one <script defer src="/_vercel/insights/script.js",
//     a canonical link equal to its sitemap URL, an og:image, a title, parseable JSON-LD and no vercel.app
//   * region pages carry the rail entries `Who Holds This` and `Nomad Trail` and the sentence
//     "No nation or community named here has reviewed this entry"
import fs from 'node:fs';
import path from 'node:path';
import { Report, parseArgs, cli, PROTO, regionIds, stripTags } from './lib.mjs';

const INSIGHTS = /<script\b[^>]*\bdefer\b[^>]*\bsrc="\/_vercel\/insights\/script\.js"|<script\b[^>]*\bsrc="\/_vercel\/insights\/script\.js"[^>]*\bdefer\b/gi;
const NO_REVIEW = 'No nation or community named here has reviewed this entry';

export function sitemapLocs(xml) {
  return [...xml.matchAll(/<loc>\s*([^<]+?)\s*<\/loc>/gi)].map((m) => m[1]);
}

export function locToFile(loc) {
  let p;
  try { p = new URL(loc).pathname; } catch { return null; }
  p = decodeURIComponent(p);
  if (p.endsWith('/')) p += 'index.html';
  return p.replace(/^\//, '');
}

function linkTags(html) { return [...html.matchAll(/<link\b[^>]*>/gi)].map((m) => m[0]); }
function attr(tag, name) { const m = new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, 'i').exec(tag); return m ? (m[2] !== undefined ? m[2] : m[3]) : null; }

function checkPage(rep, label, html, { expectCanonical, isRegion }) {
  const h1 = (html.match(/<h1[\s>]/gi) || []).length;
  rep.assert(h1 === 1, `h1 ${label}`, 'exactly one <h1', `${h1} <h1 elements (want exactly one)`);
  const ins = (html.match(INSIGHTS) || []).length;
  rep.assert(ins === 1, `insights ${label}`, 'exactly one <script defer src="/_vercel/insights/script.js"', `${ins} insights script tags (want exactly one)`);
  const canon = linkTags(html).filter((t) => /\brel\s*=\s*["']?canonical/i.test(t)).map((t) => attr(t, 'href'));
  if (expectCanonical) rep.assert(canon.length === 1 && canon[0] === expectCanonical, `canonical ${label}`, `canonical equals the sitemap URL ${expectCanonical}`, `canonical ${JSON.stringify(canon)} != sitemap URL ${expectCanonical}`);
  else rep.assert(canon.length === 1 && !!canon[0], `canonical ${label}`, `canonical ${canon[0]}`, `${canon.length} canonical links`);
  const og = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => /\bproperty\s*=\s*["']og:image["']/i.test(t));
  rep.assert(!!(og && attr(og, 'content')), `og:image ${label}`, 'og:image present', 'og:image meta is missing or empty');
  const title = /<title>([^<]*)<\/title>/i.exec(html);
  rep.assert(!!(title && title[1].trim()), `title ${label}`, `title "${title && title[1].trim().slice(0, 60)}"`, 'title is missing or empty');
  const blocks = [...html.matchAll(/<script\b[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((m) => m[1]);
  let okLd = blocks.length > 0;
  let ldErr = blocks.length ? '' : 'no JSON-LD block';
  for (const b of blocks) { try { JSON.parse(b); } catch (e) { okLd = false; ldErr = e.message; } }
  rep.assert(okLd, `json-ld ${label}`, `${blocks.length} JSON-LD block(s) parse`, ldErr);
  rep.assert(!/vercel\.app/i.test(html), `no-vercel.app ${label}`, 'no vercel.app', 'contains vercel.app');
  if (isRegion) {
    const text = stripTags(html);
    rep.assert(text.includes('Who Holds This'), `rail-who-holds ${label}`, 'rail entry Who Holds This present', 'rail entry "Who Holds This" missing');
    rep.assert(text.includes('Nomad Trail'), `rail-nomad-trail ${label}`, 'rail entry Nomad Trail present', 'rail entry "Nomad Trail" missing');
    rep.assert(text.includes(NO_REVIEW), `no-review ${label}`, 'no-review sentence present', `sentence "${NO_REVIEW}" missing`);
  }
}

export async function run(argv) {
  const o = parseArgs(argv, { value: ['root', 'sitemap'] });
  const root = path.resolve(o.root || PROTO);
  const sitemapFile = path.resolve(o.sitemap || path.join(root, 'sitemap.xml'));
  const rep = new Report();
  let xml;
  try { xml = fs.readFileSync(sitemapFile, 'utf8'); } catch (e) { rep.fail('sitemap', `cannot read ${sitemapFile}`); return rep; }
  const locs = sitemapLocs(xml);
  rep.assert(locs.length > 0, 'sitemap', `${locs.length} <loc> entries`, 'sitemap has no <loc> entries');
  const pages = new Map(); // file -> sitemap url
  for (const loc of locs) {
    const f = locToFile(loc);
    if (!f || !fs.existsSync(path.join(root, f))) { rep.fail('sitemap-loc', `${loc} maps to ${f || 'nothing'}, which does not exist under ${root}`); continue; }
    pages.set(f, loc);
  }
  if (locs.length && pages.size === locs.length) rep.pass('sitemap-loc', `all ${locs.length} <loc> entries map to files`);

  let ids = [];
  try { ids = regionIds(fs.readFileSync(path.join(root, 'data', 'regions.js'), 'utf8')); } catch { rep.fail('regions.js', `cannot read data/regions.js under ${root}`); }
  if (ids.length) rep.pass('regions.js', `${ids.length} region ids`);
  const regionFiles = new Set();
  for (const id of ids) {
    const f = `region/${id}.html`;
    regionFiles.add(f);
    if (!fs.existsSync(path.join(root, f))) { rep.fail(`region-page ${id}`, `${f} does not exist`); continue; }
    if (!pages.has(f)) rep.fail(`region-sitemap ${id}`, `${f} is not listed in the sitemap`);
  }
  if (ids.length && !rep.rows.some((r) => !r.ok && /^region-(page|sitemap) /.test(r.check))) rep.pass('region-pages', `every one of ${ids.length} regions has region/<id>.html listed in the sitemap`);

  const all = new Set([...pages.keys(), ...[...regionFiles].filter((f) => fs.existsSync(path.join(root, f)))]);
  for (const f of [...all].sort()) {
    if (!/\.html?$/i.test(f)) continue;
    const html = fs.readFileSync(path.join(root, f), 'utf8');
    checkPage(rep, f, html, { expectCanonical: pages.get(f) || null, isRegion: regionFiles.has(f) });
  }
  return rep;
}

cli(import.meta.url, 'check_pages', run);
