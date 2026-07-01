// Crawler-facing share route. Social crawlers fetch raw HTML and don't run JS,
// so a shared link needs its og:image/og:title/og:description present in the
// SERVED markup. This route renders that markup (pointing og:image at
// /api/og?<same params>), then redirects humans to the real app at /?<params>.
//
// Reached as /share?<params> via the rewrite in vercel.json. The Share buttons
// in main.js copy this URL when thresholds/pins are active.

import { computeResult } from '../lib/result.js';

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

export default async function handler(req) {
  const host = header(req, 'host') || 'land-selection-framework.vercel.app';
  const proto = header(req, 'x-forwarded-proto') || 'https';
  const base = `${proto}://${host}`;

  const url = new URL(req.url, base);
  const qs = url.searchParams.toString();
  const { matching, anyActive } = computeResult(url.searchParams);
  const appUrl = `${base}/${qs ? `?${qs}` : ''}`;
  const ogImage = `${base}/api/og${qs ? `?${qs}` : ''}`;

  const names = matching.map((r) => r.name);
  const title = !anyActive
    ? 'Land Selection Framework'
    : matching.length === 0
      ? 'Land Selection Framework — no regions match these criteria'
      : matching.length === 1
        ? `${names[0]} meets these criteria — Land Selection Framework`
        : `${matching.length} regions meet these criteria — Land Selection Framework`;

  const desc = !anyActive
    ? 'A bioregioning tool for communities seeking to belong to a place and help it flourish over a 50–100 year horizon, across twenty regions. It filters; it never scores or ranks.'
    : matching.length === 0
      ? 'No regions meet these thresholds — adjust them and explore. It filters; it never scores or ranks.'
      : `Matching: ${names.join(', ')}. Eight criteria across twenty regions, held as questions of how to arrive in reciprocity. It filters; it never scores.`;

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
