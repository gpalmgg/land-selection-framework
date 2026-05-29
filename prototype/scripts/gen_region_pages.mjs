// Build-time generator for per-region indexable pages (Phase C).
// Reads the same data the app uses and emits one static, crawlable HTML page per
// region under region/<id>.html, plus sitemap.xml. No runtime — pure static.
//
// Re-run after changing data/regions.js or data/region-depth.js:
//   node scripts/gen_region_pages.mjs
//
// Each page: full meta (canonical + OG via /api/og?region=<id>), the region
// blurb, "what living here asks of you", all eight criterion values WITH source +
// vintage + license (native units, never scored), a link into the comparison tool
// pre-pinned to this region (/?pin=<id>), and internal links to every other
// region for crawl discovery.

import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { regions, values, criteria } from '../data/regions.js';
import { regionDepth } from '../data/region-depth.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'region');
const SITE = 'https://land-selection-framework.vercel.app';

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const fmtVal = (v) =>
  typeof v !== 'number' ? String(v) : Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(Math.abs(v) < 10 ? 1 : 0);

const truncate = (s, n) => (s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…');

function criteriaRows(r) {
  return criteria
    .map((c) => {
      const v = values[r.id] && values[r.id][c.id];
      if (!v) return '';
      const src = v.sourceUrl
        ? `<a href="${esc(v.sourceUrl)}" target="_blank" rel="noopener">${esc(v.source)}</a>`
        : esc(v.source || '');
      return `
        <tr>
          <th scope="row">${esc(c.name)}<span class="metric">${esc(c.metric)}</span></th>
          <td class="val mono">${esc(fmtVal(v.value))} ${esc(v.unit)}</td>
          <td class="lab">${esc(v.label || '')}</td>
          <td class="src">${src}${v.vintage ? ` · ${esc(v.vintage)}` : ''}${c.license ? ` · ${esc(c.license)}` : ''}</td>
        </tr>`;
    })
    .join('');
}

function asksBlock(r) {
  const depth = regionDepth[r.id];
  if (!depth) return '';
  if (depth.caseStudy) {
    return `
      <section class="asks">
        <h2>What living here asks of you</h2>
        <p>This region has a full case study in the deeper material.</p>
        <p><a href="/deeper.html${esc(depth.caseStudy)}">Read the full case study &rarr;</a></p>
      </section>`;
  }
  if (depth.asks) {
    const src = depth.source
      ? `<p class="asks-src">Source: ${depth.sourceUrl ? `<a href="${esc(depth.sourceUrl)}" target="_blank" rel="noopener">${esc(depth.source)}</a>` : esc(depth.source)}</p>`
      : '';
    return `
      <section class="asks">
        <h2>What living here asks of you</h2>
        <p>${esc(depth.asks)}</p>
        ${src}
      </section>`;
  }
  return '';
}

function otherRegionsNav(current) {
  const items = regions
    .filter((r) => r.id !== current.id)
    .map((r) => `<li><a href="/region/${r.id}.html">${esc(r.name)}<span>${esc(r.country)}</span></a></li>`)
    .join('');
  return `<ul class="region-nav">${items}</ul>`;
}

function page(r) {
  const title = `${r.name}, ${r.country} — Land Selection Framework`;
  const description = truncate(
    `${r.blurb} Eight criteria — climate, water, soil, solar, conflict, regenerative networks, forest cover, population — read with sources for siting a regenerative settlement.`,
    200,
  );
  const canonical = `${SITE}/region/${r.id}.html`;
  const ogImage = `${SITE}/api/og?region=${r.id}`;

  const jsonld = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: r.name,
    description: r.blurb,
    address: { '@type': 'PostalAddress', addressCountry: r.country },
    url: canonical,
    isPartOf: { '@type': 'CreativeWork', name: 'Land Selection Framework', url: SITE },
  });

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<meta property="og:type" content="article" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
<link rel="icon" type="image/svg+xml" href="/favicon.svg" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Spectral:ital,wght@0,400;0,500;0,600;1,400&display=swap" rel="stylesheet" />
<script type="application/ld+json">${jsonld}</script>
<style>
  :root{--paper:#f6f2eb;--paper-2:#efe9df;--ink:#1a1a1a;--ink-2:#3a3a3a;--ink-3:#6b6258;--ink-4:#9a9082;--rule:#d8d0c2;--accent:#8a3a2a;}
  *{box-sizing:border-box;} html,body{margin:0;padding:0;background:var(--paper);color:var(--ink);font-family:'Inter',system-ui,sans-serif;font-size:15px;line-height:1.55;-webkit-font-smoothing:antialiased;}
  .mono{font-variant-numeric:tabular-nums;} a{color:inherit;}
  .wrap{max-width:880px;margin:0 auto;padding:0 28px;}
  .top{border-bottom:1px solid var(--rule);padding:18px 0;font-size:12px;letter-spacing:.04em;}
  .top a{color:var(--ink-3);text-decoration:none;} .top a:hover{color:var(--accent);}
  header.hero{padding:56px 0 32px;border-bottom:1px solid var(--rule);}
  .eyebrow{font-size:11px;font-weight:600;letter-spacing:.12em;text-transform:uppercase;color:var(--accent);margin-bottom:16px;}
  h1{font-family:'Spectral',Georgia,serif;font-weight:400;font-size:clamp(40px,7vw,68px);line-height:1.02;letter-spacing:-.02em;margin:0 0 10px;}
  .country{font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:var(--ink-3);margin-bottom:24px;}
  .blurb{font-family:'Spectral',Georgia,serif;font-size:19px;line-height:1.55;color:var(--ink-2);max-width:60ch;}
  .accent-bar{width:84px;height:4px;background:var(--accent);margin-bottom:26px;}
  section{padding:40px 0;border-bottom:1px solid var(--rule);}
  section h2{font-family:'Spectral',Georgia,serif;font-weight:500;font-size:24px;margin:0 0 18px;}
  .asks p{font-family:'Spectral',Georgia,serif;font-size:16px;color:var(--ink-2);max-width:62ch;}
  .asks-src{font-size:12px;color:var(--ink-3);} .asks-src a,.src a{color:var(--ink-2);text-decoration:underline dotted;text-underline-offset:2px;}
  table{width:100%;border-collapse:collapse;font-size:13.5px;}
  th[scope=row]{text-align:left;font-family:'Spectral',serif;font-weight:500;font-size:15px;color:var(--ink);padding:14px 14px 14px 0;vertical-align:top;width:30%;}
  th .metric{display:block;font-family:'Inter',sans-serif;font-weight:400;font-size:11px;letter-spacing:.04em;text-transform:uppercase;color:var(--ink-3);margin-top:3px;}
  td{padding:14px 12px;border-top:1px solid var(--rule);vertical-align:top;}
  td.val{font-weight:600;white-space:nowrap;} td.lab{color:var(--ink-2);} td.src{color:var(--ink-3);font-size:11.5px;}
  .cta{display:inline-flex;align-items:center;gap:10px;margin-top:6px;padding:14px 22px;background:var(--ink);color:var(--paper);text-decoration:none;font-family:'Spectral',serif;font-style:italic;font-size:16px;}
  .cta:hover{background:var(--accent);}
  .region-nav{list-style:none;padding:0;margin:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:1px;background:var(--rule);border:1px solid var(--rule);}
  .region-nav a{display:block;background:var(--paper);padding:12px 14px;text-decoration:none;font-family:'Spectral',serif;font-size:15px;}
  .region-nav a:hover{background:var(--paper-2);} .region-nav span{display:block;font-family:'Inter',sans-serif;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-top:2px;}
  footer{padding:40px 0 70px;} footer p{font-size:11.5px;color:var(--ink-3);max-width:70ch;line-height:1.6;}
  @media(max-width:600px){ th[scope=row]{width:auto;display:block;} td{display:block;border-top:none;padding:2px 0;} tr{display:block;border-top:1px solid var(--rule);padding:12px 0;} }
</style>
</head>
<body>
  <div class="top"><div class="wrap"><a href="/">← Land Selection Framework</a></div></div>

  <header class="hero">
    <div class="wrap">
      <div class="accent-bar" style="background:${esc(r.accent || '#8a3a2a')}"></div>
      <div class="eyebrow">Candidate region</div>
      <h1>${esc(r.name)}</h1>
      <div class="country">${esc(r.country)}</div>
      <p class="blurb">${esc(r.blurb)}</p>
    </div>
  </header>

  ${asksBlock(r)}

  <section>
    <div class="wrap">
      <h2>The eight criteria, with sources</h2>
      <table>
        <tbody>
          ${criteriaRows(r)}
        </tbody>
      </table>
      <p style="margin-top:18px;font-size:12px;color:var(--ink-3);">Native units throughout. Values are best-available midpoints from the cited public sources. Nothing here is composite, weighted, or scored across criteria.</p>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2>See it in context</h2>
      <p style="font-family:'Spectral',serif;font-size:16px;color:var(--ink-2);max-width:58ch;margin-bottom:18px;">Open the comparison tool with ${esc(r.name)} already pinned to your shortlist, then set your own thresholds across all twenty regions. The framework filters; it never scores.</p>
      <a class="cta" href="/?pin=${r.id}">Explore ${esc(r.name)} in the tool &rarr;</a>
    </div>
  </section>

  <section>
    <div class="wrap">
      <h2>Other candidate regions</h2>
      ${otherRegionsNav(r)}
    </div>
  </section>

  <footer>
    <div class="wrap">
      <p>Sources: WorldClim CMIP6, WRI Aqueduct 4.0, SoilGrids 2.0, Hansen Global Forest Change, Global Solar Atlas, UCDP GED, GEN/OSM, JRC GHSL. A project of The Collective. <a href="/deeper.html" style="color:var(--ink-2);">Methodology &amp; ethics →</a></p>
    </div>
  </footer>
</body>
</html>`;
}

// --- generate ---
mkdirSync(OUT_DIR, { recursive: true });
let count = 0;
for (const r of regions) {
  writeFileSync(join(OUT_DIR, `${r.id}.html`), page(r), 'utf8');
  count++;
}

// sitemap.xml at the site root (covers home, deeper, and every region page)
const urls = [
  `${SITE}/`,
  `${SITE}/deeper.html`,
  ...regions.map((r) => `${SITE}/region/${r.id}.html`),
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Generated ${count} region pages in region/ + sitemap.xml (${urls.length} urls)`);
