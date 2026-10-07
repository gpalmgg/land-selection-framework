// Fixture builders shared by the *.test.mjs files (not a test itself).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export function tmpdir(prefix = 'lsf-rel-') { return fs.mkdtempSync(path.join(os.tmpdir(), prefix)); }

export function write(root, rel, content) {
  const f = path.join(root, rel);
  fs.mkdirSync(path.dirname(f), { recursive: true });
  fs.writeFileSync(f, content);
  return f;
}

export const MAILTO = 'mail' + 'to:';
export const PHONE = 'te' + 'l:';
export const addr = (local, domain) => `${local}@${domain}`;
export const ORIGIN = 'https://example.test';

export function regionPage(id, { h1 = 1, insights = 1, canonical, noReview = true, ldJson = '{"@context":"https://schema.org","@type":"Place","name":"X"}', extra = '' } = {}) {
  const canon = canonical === undefined ? `${ORIGIN}/region/${id}.html` : canonical;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${id} - Land Selection Framework</title>
<link rel="canonical" href="${canon}" />
<meta property="og:image" content="${ORIGIN}/api/og?region=${id}" />
<script type="application/ld+json">${ldJson}</script>
${'<script defer src="/_vercel/insights/script.js"></script>\n'.repeat(insights)}</head><body>
<aside><a href="https://whoholds.example">Who Holds This</a><a href="https://trail.example">Nomad Trail</a></aside>
${`<h1>${id}</h1>\n`.repeat(h1)}<p>First paragraph about ${id}.</p>
${noReview ? '<p>Assembled from public sources. No nation or community named here has reviewed this entry.</p>' : ''}${extra}</body></html>`;
}

const REGIONS = (ids) => 'export const regions = [\n' + ids.map((id) => `  {\n    id: '${id}',\n    continent: 'europe',\n    name: '${id}',\n    country: 'X',\n    coords: [1, 2],\n  },`).join('\n') + '\n];\n';

// A small site that passes check_pages.
export function makeSite(root, ids = ['alpha', 'beta'], pageOpts = {}) {
  write(root, 'data/regions.js', REGIONS(ids));
  const home = regionPage('home', { noReview: false }).replace('<title>home', '<title>Home').replace(`/region/home.html`, '/');
  write(root, 'index.html', home.replace(`${ORIGIN}/region/home.html`, `${ORIGIN}/`));
  const locs = [`${ORIGIN}/`];
  for (const id of ids) { write(root, `region/${id}.html`, regionPage(id, pageOpts[id] || {})); locs.push(`${ORIGIN}/region/${id}.html`); }
  write(root, 'sitemap.xml', `<?xml version="1.0"?><urlset>${locs.map((l) => `<url><loc>${l}</loc></url>`).join('')}</urlset>`);
  return root;
}
