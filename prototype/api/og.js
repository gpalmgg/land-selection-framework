// Dynamic Open Graph card (1200 x 630). The routing and every card layout live in lib/og-card.js (shared with the render harness and
// the static fallbacks): ?region=<id> is a region card, ?page=deeper the in-depth card, ?t.* / ?q.* / ?c= a filtered card, and a
// bare request the brand card. This file only loads the fonts and turns a Satori element tree into a PNG.
//
// Built without JSX: Satori (inside @vercel/og) consumes plain {type, props} element objects.
// Fonts: three static woff files fetched from the SAME ORIGIN (/vendor/fonts/), once per cold start. There is no third-party font
// request. On any failure (a font that will not load, a render error) the function degrades to the static /og.png (302).

import { ImageResponse } from '@vercel/og';
import { cardFor, FONT_FILES } from '../lib/og-card.js';

// Edge runtime: the web-standard (Request -> Response) handler and ImageResponse are native to edge.
// NOTE: `vercel dev` cannot run this locally (its edge emulator stubs fetch and @vercel/og hangs). Verify renders with
// scripts/og_harness.mjs (plain Node, a mock Request), or against the deployed custom domain.
export const config = { runtime: 'edge' };

// Works for both Headers objects and plain header maps.
function header(req, name) {
  const hs = req.headers;
  if (!hs) return undefined;
  return typeof hs.get === 'function' ? hs.get(name) : hs[name];
}
// On the Node runtime req.url is a path, not absolute, so URL parsing needs a base.
function baseOf(req) {
  const host = header(req, 'host') || 'land-selection-framework.regencommunity.tools';
  const proto = header(req, 'x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

// The fonts, fetched once per cold start. A failed fetch is forgotten so the next request tries again.
let fontsPromise = null;
function loadFonts(origin) {
  if (!fontsPromise) {
    fontsPromise = Promise.all(FONT_FILES.map(async (f) => {
      const res = await fetch(new URL(f.path, origin));
      if (!res.ok) throw new Error(`font ${f.path} ${res.status}`);
      return { name: f.name, data: await res.arrayBuffer(), style: f.style, weight: f.weight };
    })).catch((err) => { fontsPromise = null; throw err; });
  }
  return fontsPromise;
}

export default async function handler(req) {
  const base = baseOf(req);
  try {
    const url = new URL(req.url, base);
    const fonts = await loadFonts(url.origin);
    const { tree } = cardFor(url.searchParams);
    const image = new ImageResponse(tree, {
      width: 1200,
      height: 630,
      fonts,
      // The card changes when the data or the design does, so it is not marked immutable for a year.
      headers: { 'cache-control': 'public, max-age=86400, s-maxage=86400' },
    });
    // ImageResponse renders lazily while its body is read: read it here so a render error lands in the catch below
    // (and becomes the 302 fallback) instead of a half-sent response.
    const png = await image.arrayBuffer();
    return new Response(png, { status: 200, headers: image.headers });
  } catch (err) {
    // Graceful degradation: fall back to the static card that already ships. (Redirects are never followed by the
    // post-deploy checks, so a fallback can never pass for a rendered card.)
    return Response.redirect(new URL('/og.png', base), 302);
  }
}
