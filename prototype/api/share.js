// Crawler-facing share route. Social crawlers fetch raw HTML and don't run JS,
// so a shared link needs its og:image/og:title/og:description present in the
// SERVED markup. This route renders that markup (pointing og:image at
// /api/og?<same params>), then redirects humans to the real app at /?<params>.
//
// Reached as /share?<params> via the rewrite in vercel.json. The Share buttons
// in main.js copy this URL when thresholds/pins are active. Also answers ?region=<id> (a region share that names the
// place and its ecoregion; the card is /api/og?region=<id>) and ?page=deeper. Counts and sentences come from
// data/site-facts.js, never from typed numbers.

import { computeResult } from '../lib/result.js';
import { qualFiltersFor } from '../lib/url-state.js';
import { regions } from '../data/regions.js';
import { bioregions } from '../data/bioregions.js';
import { facts, countWord, CapWord, canon, site } from '../data/site-facts.js';

// Edge runtime: native Request -> Response, matching api/og. No outbound fetch
// here — it only renders an HTML shell with dynamic meta.
export const config = { runtime: 'edge' };

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// On the Node runtime req.url is a path; build a base from request headers.
function header(req, name) {
  const hs = req.headers;
  if (!hs) return undefined;
  return typeof hs.get === 'function' ? hs.get(name) : hs[name];
}

// A link that chooses a qualitative filter (?q.*) needs the slim v1 lookup, which the edge bundle does not carry (the bundle
// budget in scripts/release/check_edge_bundle.mjs). Such a link is never counted here: it gets the general description rather
// than a number that could disagree with the page. (api/og.js and lib/og-card.js apply the same rule.)
function hasUnappliedQual(sp) {
  return qualFiltersFor({}).some((qf) => {
    const v = sp.get(`q.${qf.id}`);
    return !!v && v !== 'any' && qf.options.includes(v);
  });
}

const MAX_NAMES = 8;

export default async function handler(req) {
  const host = header(req, 'host') || 'land-selection-framework.regencommunity.tools';
  const proto = header(req, 'x-forwarded-proto') || 'https';
  const base = `${proto}://${host}`;

  const url = new URL(req.url, base);
  const sp = url.searchParams;
  const qs = sp.toString();
  const regionId = sp.get('region');
  const region = regionId ? regions.find((r) => r.id === regionId) : null;

  // Counts and sentences come from the data (data/site-facts.js), never from typed numbers.
  const stance = canon.stance;
  const general = `${canon.descriptor} ${CapWord(facts.regions)} regions read across ${countWord(facts.criteria)} criteria. ${stance}`;

  let title, desc, appUrl, ogImage;
  if (region) {
    // A region share names the place and its ecoregion (the bioregion layer), then the framing.
    const eco = bioregions[region.id] && bioregions[region.id].primaryEcoregion;
    title = `${region.name}, ${region.country} \u2014 ${site.name}`;
    desc = `${region.name} (${region.country})${eco ? `, in the ${eco}` : ''}. Whose land it is, and what arriving asks of you. ${stance}`;
    appUrl = `${base}/region/${region.id}.html`;
    ogImage = `${base}/api/og?region=${encodeURIComponent(region.id)}`;
  } else if (sp.get('page') === 'deeper') {
    title = `${site.name} \u2014 In Depth`;
    desc = 'The method, the case studies, the open design questions, and the sources behind every value.';
    appUrl = `${base}/deeper.html`;
    ogImage = `${base}/api/og?page=deeper`;
  } else {
    const { matching, total, anyActive } = computeResult(sp);
    appUrl = `${base}/${qs ? `?${qs}` : ''}`;
    ogImage = `${base}/api/og${qs ? `?${qs}` : ''}`;
    const names = matching.map((r) => r.name);
    if (!anyActive || hasUnappliedQual(sp)) {
      title = site.name;
      desc = general;
    } else if (matching.length === 0) {
      title = `No regions within these thresholds \u2014 ${site.name}`;
      desc = `No regions are within these thresholds. Loosen a threshold to read more places. ${stance}`;
    } else {
      title = matching.length === 1
        ? `${names[0]} is within these thresholds \u2014 ${site.name}`
        : `${matching.length} of ${total} regions within these thresholds \u2014 ${site.name}`;
      const shown = names.slice(0, MAX_NAMES).join(', ');
      const more = names.length > MAX_NAMES ? `, and ${names.length - MAX_NAMES} more` : '';
      desc = `Within these thresholds: ${shown}${more}. ${stance}`;
    }
  }

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${esc(appUrl)}" />
<meta property="og:type" content="website" />
<meta property="og:url" content="${esc(appUrl)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${esc(ogImage)}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${esc(ogImage)}" />
<meta http-equiv="refresh" content="0; url=${esc(appUrl)}" />
<script>location.replace(${JSON.stringify(appUrl)});</script>
</head>
<body style="font-family: Georgia, serif; background:#f6f2eb; color:#3a3a3a; padding:40px;">
<p>Opening the Land Selection Framework… <a href="${esc(appUrl)}">continue&nbsp;&rarr;</a></p>
</body>
</html>`;

  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'public, max-age=300, s-maxage=300',
    },
  });
}
