#!/usr/bin/env node
// check_framing_guards.mjs [--root DIR] [--og-dir DIR] [--only vermont,finger-lakes,ne-missouri-se-iowa]
//
// Wording guards for the three regions whose entries touch live questions (BIO-9, MC-GATE; plan P-BIO):
//   vermont               land-standing.js, reciprocity.js and region/vermont.html visible text match none of
//                         /identity|genealog|illegitim|fraud|contested|dispute/i, and the territory still says "unceded"
//   finger-lakes          its strings match none of /leadership|faction|dispute|illegitim/i and its obligation matches none of
//                         /repurchases come first|make no offer where it is buying/i
//   ne-missouri-se-iowa   region page title, meta description, h1 and first paragraph, its llms.txt entry and every OG dump
//                         `*ne-missouri-se-iowa*.json` in --og-dir match none of /affordab|cheap|price|bargain/i
// "Strings" are the string VALUES of the region's entry in the data modules (keys, URLs, dates and status flags are not text).
import fs from 'node:fs';
import path from 'node:path';
import { Report, parseArgs, cli, PROTO, allStrings, importData, stripTags, metaContents, readJson } from './lib.mjs';

const NON_TEXT_KEY = /url|href|link|status|flag|^id$|^key$|checked|date|vintage|^basis$/i;
const textKeys = (k) => !NON_TEXT_KEY.test(k);

const GUARDS = {
  vermont: { forbidden: /identity|genealog|illegitim|fraud|contested|dispute/i },
  'finger-lakes': { forbidden: /leadership|faction|dispute|illegitim/i, obligation: /repurchases come first|make no offer where it is buying/i },
  'ne-missouri-se-iowa': { forbidden: /affordab|cheap|price|bargain/i },
};

async function moduleStrings(root, file, id, rep, label) {
  const abs = path.join(root, 'data', file);
  if (!fs.existsSync(abs)) { rep.fail(`${id} ${label}`, `data/${file} is missing under ${root}`); return null; }
  let mod;
  try { mod = await importData(abs); } catch (e) { rep.fail(`${id} ${label}`, `data/${file} does not import: ${e.message}`); return null; }
  const entries = [];
  for (const v of Object.values(mod)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && Object.prototype.hasOwnProperty.call(v, id)) entries.push(v[id]);
  }
  if (!entries.length) { rep.fail(`${id} ${label}`, `data/${file} has no entry for ${id}`); return null; }
  return entries;
}

function firstMatch(re, strings) {
  for (const s of strings) { const m = re.exec(s); if (m) return `"${m[0]}" in "${s.slice(Math.max(0, m.index - 40), m.index + 60).replace(/\s+/g, ' ')}"`; }
  return null;
}

function pageParts(html) {
  const title = (/<title>([^<]*)<\/title>/i.exec(html) || [])[1] || '';
  const descTag = [...html.matchAll(/<meta\b[^>]*>/gi)].map((m) => m[0]).find((t) => /\bname\s*=\s*["']description["']/i.test(t));
  const desc = descTag ? (/\bcontent\s*=\s*("([^"]*)"|'([^']*)')/i.exec(descTag) || [])[2] || '' : '';
  const h1m = /<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html);
  const h1 = h1m ? stripTags(h1m[1]) : '';
  const after = h1m ? html.slice(h1m.index + h1m[0].length) : html;
  const pm = /<p\b[^>]*>([\s\S]*?)<\/p>/i.exec(after);
  return { title: stripTags(title), desc: stripTags(desc), h1, firstP: pm ? stripTags(pm[1]) : '' };
}

export async function run(argv) {
  const o = parseArgs(argv, { value: ['root', 'og-dir', 'only'] });
  const root = path.resolve(o.root || PROTO);
  const rep = new Report();
  const only = o.only ? o.only.split(',').map((s) => s.trim()).filter(Boolean) : Object.keys(GUARDS);
  for (const id of only) if (!GUARDS[id]) { rep.fail('only', `unknown guard ${id} (known: ${Object.keys(GUARDS).join(', ')})`); return rep; }
  const pageFile = (id) => path.join(root, 'region', `${id}.html`);
  const pageHtml = (id) => { try { return fs.readFileSync(pageFile(id), 'utf8'); } catch { return null; } };

  if (only.includes('vermont') || only.includes('finger-lakes')) {
    for (const id of ['vermont', 'finger-lakes'].filter((x) => only.includes(x))) {
      const g = GUARDS[id];
      const ls = await moduleStrings(root, 'land-standing.js', id, rep, 'land-standing.js');
      const rc = await moduleStrings(root, 'reciprocity.js', id, rep, 'reciprocity.js');
      const html = pageHtml(id);
      if (html === null) rep.fail(`${id} region page`, `region/${id}.html is missing under ${root}`);
      const sources = [];
      if (ls) sources.push(['land-standing.js', allStrings(ls, [], textKeys)]);
      if (rc) sources.push(['reciprocity.js', allStrings(rc, [], textKeys)]);
      if (html !== null) sources.push([`region/${id}.html`, [stripTags(html), ...metaContents(html)]]);
      for (const [label, strings] of sources) {
        const hit = firstMatch(g.forbidden, strings);
        rep.assert(!hit, `${id} ${label}`, `no wording matching ${g.forbidden}`, `forbidden wording ${hit}`);
      }
      if (id === 'vermont') {
        const terr = ls ? ls.flatMap((e) => (e && typeof e.territory === 'string' ? [e.territory] : [])) : [];
        rep.assert(terr.some((t) => /unceded/i.test(t)), 'vermont territory-unceded', 'the territory still contains the word unceded', ls ? 'the territory no longer contains the word unceded (Gustaf kept it as is)' : 'territory unreadable');
      }
      if (id === 'finger-lakes') {
        const obl = [];
        for (const e of [...(ls || []), ...(rc || [])]) if (e && typeof e === 'object') for (const [k, v] of Object.entries(e)) if (/^obligation/i.test(k)) obl.push(...allStrings(v));
        const hit = firstMatch(g.obligation, obl) || (html !== null ? firstMatch(g.obligation, [stripTags(html)]) : null);
        rep.assert(obl.length > 0, 'finger-lakes obligation-present', `${obl.length} obligation string(s) found`, 'no obligation string found in land-standing.js or reciprocity.js');
        rep.assert(!hit, 'finger-lakes obligation-clause', `obligation carries no clause matching ${g.obligation}`, `deferring clause ${hit}`);
      }
    }
  }

  if (only.includes('ne-missouri-se-iowa')) {
    const id = 'ne-missouri-se-iowa';
    const re = GUARDS[id].forbidden;
    const html = pageHtml(id);
    if (html === null) rep.fail(`${id} region page`, `region/${id}.html is missing under ${root}`);
    else {
      const p = pageParts(html);
      for (const [label, text] of [['title', p.title], ['meta description', p.desc], ['h1', p.h1], ['first paragraph', p.firstP]]) {
        rep.assert(text.length > 0, `${id} ${label} present`, `${label} found`, `${label} not found on the region page`);
        const hit = firstMatch(re, [text]);
        rep.assert(!hit, `${id} ${label}`, `no wording matching ${re}`, `forbidden wording ${hit}`);
      }
    }
    const llms = path.join(root, 'llms.txt');
    if (!fs.existsSync(llms)) rep.fail(`${id} llms.txt`, `llms.txt is missing under ${root}`);
    else {
      const lines = fs.readFileSync(llms, 'utf8').split(/\r?\n/).filter((l) => l.includes(id) || /NE Missouri/i.test(l));
      rep.assert(lines.length > 0, `${id} llms.txt entry`, `${lines.length} entry line(s) found`, 'no llms.txt line mentions the region');
      const hit = firstMatch(re, lines);
      rep.assert(!hit, `${id} llms.txt`, `no wording matching ${re}`, `forbidden wording ${hit}`);
    }
    if (!o['og-dir']) rep.pass(`${id} og-dumps`, 'no --og-dir given: OG dumps not checked here (MC-GATE passes --og-dir)');
    else {
      const dir = path.resolve(o['og-dir']);
      let dumps = [];
      try { dumps = fs.readdirSync(dir).filter((f) => f.includes(id) && f.endsWith('.json')); } catch { /* reported below */ }
      if (!dumps.length) rep.fail(`${id} og-dumps`, `no *${id}*.json OG dump in ${dir} (render the region card with og_harness --dump-text first)`);
      for (const f of dumps) {
        let strings;
        try { strings = allStrings(readJson(path.join(dir, f))); } catch (e) { rep.fail(`${id} og-dump ${f}`, `not valid JSON: ${e.message}`); continue; }
        const hit = firstMatch(re, strings);
        rep.assert(!hit, `${id} og-dump ${f}`, `no wording matching ${re}`, `forbidden wording ${hit}`);
      }
    }
  }
  return rep;
}

cli(import.meta.url, 'check_framing_guards', run);
