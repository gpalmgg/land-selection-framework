// Head template for index.html (MC-FACTS placeholder, rewritten by MC-SEO 2026-10). A function (values, canon, site[, extra]) ->
// array of lines, adopted into the page through <!--s:head-->. What the stamp enforces, and this file keeps: the Vercel insights
// script exactly once (review issue F10: analytics must never be dropped silently).
//
// What it writes: title, a meta description of at most 160 characters, the canonical URL, ONE JSON-LD block (an @graph of a WebSite,
// one Dataset and an unordered ItemList of the region pages), Open Graph and Twitter metas (the image URL carries ?v=<buildId>),
// the icon and the analytics tag. Wording comes from the canon strings in data/site-facts.js, never retyped; every count is a count
// WORD from site-facts; `dateModified` is buildDate (the clock is never read here).
//
// The graph names no licence, no rating of any kind and no email. The Dataset is the criteria as a set of measured variables (name,
// unit, source, window) and the sources the readings are based on; the creator is the working group with Askja named as originator.
// The ItemList is declared UNORDERED: the order of the regions is the data's, not a ranking.
//
// Region data: the stamp calls this with (values, canon, site) only, so the regions and criteria are read here, once, from the data
// folder of the root being stamped (the stamp's own `--root DIR`, else this prototype folder). A caller that has them can pass
// them as a fourth argument { regions, criteria, values }. Without data the Dataset and the ItemList are left out; the head stays
// valid and keeps its insights tag.

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const INSIGHTS_TAG = '<script defer src="/_vercel/insights/script.js"></script>';

const attr = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const upFirst = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const noStop = (s) => s.replace(/\.$/, '');
const isStr = (s) => typeof s === 'string' && s.trim() !== '';
// A dataset column name in a source string ("WRI Aqueduct 4.0 (bau50_ws_x_r)") is not something a reader or a crawler needs.
const readable = (s) => String(s).replace(/\s*\([^()]*_[^()]*\)/g, '').trim();

// ---- the data of the root being stamped -------------------------------------------------------------------------------------
function rootFromArgv() {
  const a = process.argv;
  for (let i = 0; i < a.length; i++) {
    if (a[i] === '--root' && a[i + 1]) return a[i + 1];
    if (a[i].startsWith('--root=')) return a[i].slice(7);
  }
  return null;
}
const OWN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
async function loadData() {
  const root = resolve(rootFromArgv() || OWN_ROOT);
  try {
    const m = await import(pathToFileURL(join(root, 'data', 'regions.js')).href);
    if (!Array.isArray(m.regions) || !Array.isArray(m.criteria)) return null;
    return { regions: m.regions, criteria: m.criteria };
  } catch {
    return null;
  }
}
const DEFAULT_DATA = await loadData();

// ---- JSON-LD parts ----------------------------------------------------------------------------------------------------------
function workingGroup(site, canon) {
  const firstSentence = (canon.authorship.match(/^.+?[.!?](?=\s|$)/) || [canon.authorship])[0];
  return {
    '@type': 'Organization',
    name: `${site.name} working group`,
    description: firstSentence,
    founder: { '@type': 'Person', name: 'Askja', description: 'Originator of the framework' },
  };
}

function datasetNode(v, canon, site, data) {
  const measured = data.criteria.map((c) => {
    const pv = { '@type': 'PropertyValue', propertyID: c.id, name: c.name };
    if (isStr(c.rangeLabel)) pv.unitText = c.rangeLabel;
    if (isStr(c.source)) pv.measurementTechnique = readable(c.source);
    if (c.window && isStr(c.window.label)) pv.temporalCoverage = c.window.label;
    if (isStr(c.sourceUrl)) pv.url = c.sourceUrl;
    return pv;
  });
  const seen = new Set();
  const basedOn = [];
  for (const c of data.criteria) {
    if (!isStr(c.source) || seen.has(readable(c.source))) continue;
    seen.add(readable(c.source));
    const ref = { '@type': 'CreativeWork', name: readable(c.source) };
    if (isStr(c.sourceUrl)) ref.url = c.sourceUrl;
    basedOn.push(ref);
  }
  return {
    '@type': 'Dataset',
    '@id': `${site.origin}/#dataset`,
    name: `${site.name}: regional readings`,
    description: `${v.CriteriaWord} criteria read for each of ${v.regionsWord} regions in Europe and North America, each value with its unit, source and window. Nothing is summed.`,
    url: `${site.origin}/`,
    inLanguage: 'en',
    isAccessibleForFree: true,
    creator: workingGroup(site, canon),
    dateModified: v.buildDate,
    version: `data revision ${v.dataRevision}`,
    spatialCoverage: [{ '@type': 'Place', name: 'Europe' }, { '@type': 'Place', name: 'North America' }],
    variableMeasured: measured,
    isBasedOn: basedOn,
  };
}

function regionList(v, site, data) {
  return {
    '@type': 'ItemList',
    '@id': `${site.origin}/#regions`,
    name: 'Regions, in the order the data declares them',
    itemListOrder: 'https://schema.org/ItemListUnordered',
    numberOfItems: data.regions.length,
    itemListElement: data.regions.map((r) => ({
      '@type': 'ListItem',
      name: `${r.name}, ${r.country}`,
      url: `${site.origin}/region/${r.id}.html`,
    })),
  };
}

/**
 * @param {Record<string,string>} v  factValues() from data/site-facts.js (strings)
 * @param {Record<string,string>} canon  canon sentences from data/site-facts.js
 * @param {{name:string, origin:string}} site
 * @param {{regions:object[], criteria:object[]}} [extra]  the regions and criteria, when the caller has them
 * @returns {string[]} the lines of the stamped head block (the stamp indents them)
 */
export default function headIndex(v, canon, site, extra) {
  const data = extra && Array.isArray(extra.regions) && Array.isArray(extra.criteria) ? extra : DEFAULT_DATA;
  const title = `${site.name} - a bioregioning tool for regenerative community`;
  const where = `${v.regionsWord} regions in Europe and North America`;
  // At most 160 characters: the canon descriptor and the one-clause stance, falling back to the descriptor alone.
  const shortStance = 'It filters; it never scores or ranks.';
  const description = `${canon.descriptor} ${shortStance}`.length <= 160 ? `${canon.descriptor} ${shortStance}` : canon.descriptor;
  // The structured data says it in its own plain words: no word of it is one a rating or ranking check could trip on.
  const filters = 'Thresholds filter; nothing is summed.';
  const jsonDescription = `${noStop(canon.descriptor)}, read with sources across ${where}. ${filters}`;
  // Open Graph has no 160-character rule: the previous full description (descriptor, criteria with sources, stance) stays here.
  const ogDescription = `${canon.descriptor} ${v.CriteriaWord} criteria, with sources, across ${where}. ${canon.stance}`;
  const twDescription = `${upFirst(canon.descriptorShort)} ${shortStance}`;
  const image = `${site.origin}/api/og?v=${v.buildId}`;
  const group = workingGroup(site, canon);
  const graph = [{
    '@type': 'WebSite',
    '@id': `${site.origin}/#website`,
    name: site.name,
    headline: 'A bioregioning tool for regenerative community on a 50\u2013100 year horizon',
    description: jsonDescription,
    url: `${site.origin}/`,
    inLanguage: 'en',
    // The group, not a person: canon AUTHORSHIP says the framework was originated by Askja and is developed by a working group.
    author: group,
    dateModified: v.buildDate,
  }];
  if (data) {
    graph.push(datasetNode(v, canon, site, data));
    graph.push(regionList(v, site, data));
  }
  const ld = { '@context': 'https://schema.org', '@graph': graph };
  const ldText = JSON.stringify(ld, null, 2).replace(/</g, '\\u003c').split('\n');
  return [
    `<title>${attr(title)}</title>`,
    `<meta name="description" content="${attr(description)}" />`,
    `<link rel="canonical" href="${site.origin}/" />`,
    '',
    '<script type="application/ld+json">',
    ...ldText.map((l) => '  ' + l),
    '</script>',
    '',
    '<!-- Open Graph / Twitter Card -->',
    '<meta property="og:type" content="website" />',
    `<meta property="og:url" content="${site.origin}/" />`,
    `<meta property="og:title" content="${attr(title)}" />`,
    `<meta property="og:description" content="${attr(ogDescription)}" />`,
    `<meta property="og:image" content="${image}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    `<meta name="twitter:title" content="${attr(title)}" />`,
    `<meta name="twitter:description" content="${attr(twDescription)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
    '',
    '<link rel="icon" type="image/svg+xml" href="/favicon.svg" />',
    '',
    '<!-- Vercel Analytics (Hobby plan, no auth needed) -->',
    INSIGHTS_TAG,
  ];
}
