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

// The fonts are bundled into the edge function (the documented @vercel/og pattern: a literal
// new URL(..., import.meta.url) is copied into the bundle), so rendering needs no network fetch. A same-origin fetch
// failed on Vercel (2026-10-07: every card fell back to /og.png although the font files were deployed). In plain Node
// (scripts/og_harness.mjs) fetch() cannot read file: URLs, so each font falls back to the same-origin path there.
const BUNDLED = {
  '/vendor/fonts/fraunces-og-roman.woff': new URL('../vendor/fonts/fraunces-og-roman.woff', import.meta.url),
  '/vendor/fonts/fraunces-og-italic.woff': new URL('../vendor/fonts/fraunces-og-italic.woff', import.meta.url),
  '/vendor/fonts/spectral-og-500.woff': new URL('../vendor/fonts/spectral-og-500.woff', import.meta.url),
};
async function fontBytes(path, origin) {
  const local = BUNDLED[path];
  if (local) {
    try {
      const res = await fetch(local);
      if (res.ok) return await res.arrayBuffer();
    } catch { /* file: URL outside the edge runtime: use the origin below */ }
  }
  const res = await fetch(new URL(path, origin));
  if (!res.ok) throw new Error(`font ${path} ${res.status}`);
  return await res.arrayBuffer();
}

// Loaded once per cold start. A failure is forgotten so the next request tries again.
let fontsPromise = null;
function loadFonts(origin) {
  if (!fontsPromise) {
    fontsPromise = Promise.all(FONT_FILES.map(async (f) => (
      { name: f.name, data: await fontBytes(f.path, origin), style: f.style, weight: f.weight }
    ))).catch((err) => { fontsPromise = null; throw err; });
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
    console.error('og render failed:', err && err.message ? err.message : err);
    // Graceful degradation: fall back to the static card that already ships. (Redirects are never followed by the
    // post-deploy checks, so a fallback can never pass for a rendered card.)
    return Response.redirect(new URL('/og.png', base), 302);
  }
}
