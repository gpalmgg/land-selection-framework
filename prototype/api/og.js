// Dynamic Open Graph card. Reads the same ?t.* / ?pin= state a shared link
// carries, recomputes which regions pass, and renders a 1200×630 image in the
// site's paper-and-serif aesthetic showing the visitor's actual result.
//
// Built without JSX: Satori (inside @vercel/og) consumes plain {type, props}
// element objects, so a small h() helper avoids the React/tsconfig toolchain.
// On any failure (e.g. font fetch) it degrades to the existing static og.png.

import { ImageResponse } from '@vercel/og';
import { computeResult } from '../lib/result.js';
import { regions, values, criteria } from '../data/regions.js';

// V1 first-gate facts per region (r4 round): the two most decision-relevant
// criteria for a share-card glance. Imported as static JSON so the edge runtime
// bundles them at build time; no fetch / no fs at runtime.
import legalData from '../data/processed/legal-ownership.json' with { type: 'json' };
import costData from '../data/processed/land-cost.json' with { type: 'json' };
const legalById = Object.fromEntries(legalData.map((e) => [e.region_id, e]));
const costById = Object.fromEntries(costData.map((e) => [e.region_id, e]));

// Edge runtime: the web-standard (Request -> Response) handler and ImageResponse
// are native to edge, and prod edge has real outbound fetch (the font download).
// NOTE: `vercel dev` cannot run this locally — its edge emulator stubs fetch and
// @vercel/og hangs. Verify renders by importing this handler in plain Node with a
// mock Request (see scripts), or against the deployed prod URL.
export const config = { runtime: 'edge' };

const PAPER = '#f6f2eb';
const INK = '#1a1a1a';
const INK3 = '#6b6258';
const ACCENT = '#8a3a2a';
const RULE = '#d8d0c2';

// Element constructor: Satori reads .type and .props (incl. style, children).
function h(type, style, children) {
  return { type, props: children === undefined ? { style } : { style, children } };
}

// On the Node runtime req.url is a path, not absolute, so URL parsing needs a
// base. Works for both Headers objects and plain header maps.
function header(req, name) {
  const hs = req.headers;
  if (!hs) return undefined;
  return typeof hs.get === 'function' ? hs.get(name) : hs[name];
}
function baseOf(req) {
  const host = header(req, 'host') || 'land-selection-framework.vercel.app';
  const proto = header(req, 'x-forwarded-proto') || 'https';
  return `${proto}://${host}`;
}

// Small (~18 KB) Latin woff — Satori supports woff, and the tiny size is robust
// on flaky links. Covers the accented region names (Cévennes, Québec, Tirol…).
const SPECTRAL_FONT =
  'https://cdn.jsdelivr.net/npm/@fontsource/spectral/files/spectral-latin-500-normal.woff';

function fmtVal(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return v.toLocaleString('en-US');
  return v.toFixed(Math.abs(v) < 10 ? 1 : 0);
}

// Single-region card (used by /region/<id> pages via ?region=<id>): the region's
// name + its eight criterion values + a first-gate strip (cost band, foreign
// ownership, multi-household residence). A read-out, never a score.
function buildRegionTree(r) {
  const chip = (c) => {
    const v = values[r.id] && values[r.id][c.id];
    if (!v) return null;
    return h(
      'div',
      {
        display: 'flex',
        alignItems: 'baseline',
        border: `1px solid ${RULE}`,
        background: '#fbf8f2',
        padding: '8px 16px',
        marginRight: 10,
        marginBottom: 10,
        fontSize: 23,
        color: INK,
      },
      `${c.name}  ${fmtVal(v.value)} ${v.unit}`,
    );
  };

  // First-gate strip — the two r4 layers most decision-relevant at a glance.
  const legal = legalById[r.id];
  const cost = costById[r.id];
  const gateChip = (label, value) =>
    h(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        background: ACCENT,
        color: PAPER,
        padding: '6px 14px',
        marginRight: 10,
        fontSize: 20,
        letterSpacing: 0.5,
      },
      `${label}: ${value}`,
    );
  const gateStripItems = [
    cost && cost.affordability_band && cost.affordability_band !== 'unknown'
      ? gateChip('cost', cost.affordability_band.replace(/_/g, ' '))
      : null,
    legal && legal.foreign_ownership && legal.foreign_ownership.allowed
      ? gateChip('foreign ownership', legal.foreign_ownership.allowed)
      : null,
    legal && legal.multi_household_residence_as_of_right
      ? gateChip('multi-household as-of-right', legal.multi_household_residence_as_of_right)
      : null,
  ].filter(Boolean);
  const firstGateStrip =
    gateStripItems.length > 0
      ? h(
          'div',
          { display: 'flex', flexWrap: 'wrap', marginTop: 18, marginBottom: -6 },
          gateStripItems,
        )
      : null;

  const topChildren = [
    h('div', { width: 120, height: 10, background: r.accent || ACCENT, marginBottom: 28 }),
    h(
      'div',
      { display: 'flex', fontSize: 22, letterSpacing: 2, color: ACCENT, marginBottom: 16 },
      'THE LAND SELECTION FRAMEWORK',
    ),
    h('div', { display: 'flex', fontSize: 58, lineHeight: 1.05 }, r.name),
    h(
      'div',
      { display: 'flex', fontSize: 24, color: INK3, letterSpacing: 1, marginTop: 8 },
      (r.country || '').toUpperCase(),
    ),
    firstGateStrip,
    h(
      'div',
      { display: 'flex', flexWrap: 'wrap', marginTop: 24 },
      criteria.map(chip).filter(Boolean),
    ),
  ].filter(Boolean);

  return h(
    'div',
    {
      width: 1200,
      height: 630,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 56,
      backgroundColor: PAPER,
      color: INK,
      fontFamily: 'Spectral',
    },
    [
      h('div', { display: 'flex', flexDirection: 'column' }, topChildren),
      h(
        'div',
        {
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `1px solid ${RULE}`,
          paddingTop: 18,
          fontSize: 22,
          color: INK3,
        },
        [
          h('div', { display: 'flex' }, 'land-selection-framework.vercel.app'),
          h('div', { display: 'flex' }, 'eight criteria · sources on the page'),
        ],
      ),
    ],
  );
}

export default async function handler(req) {
  const base = baseOf(req);
  try {
    const { searchParams } = new URL(req.url, base);

    const fontData = await fetch(SPECTRAL_FONT).then((r) => {
      if (!r.ok) throw new Error(`font ${r.status}`);
      return r.arrayBuffer();
    });

    // Region card branch (?region=<id>) for per-region pages.
    const regionId = searchParams.get('region');
    if (regionId) {
      const r = regions.find((x) => x.id === regionId);
      if (r) {
        return new ImageResponse(buildRegionTree(r), {
          width: 1200,
          height: 630,
          fonts: [{ name: 'Spectral', data: fontData, style: 'normal', weight: 500 }],
        });
      }
    }

    const { matching, summaries, total, anyActive } = computeResult(searchParams);

    const names = matching.map((r) => r.name);
    const headline = !anyActive
      ? 'Eight criteria. Twenty candidate regions.'
      : matching.length === 0
        ? 'No regions meet these criteria'
        : matching.length === 1
          ? `${names[0]} meets your criteria`
          : `${matching.length} regions meet your criteria`;

    // Region chips (cap to keep the card legible + fit 630px), "+N more" overflow.
    const SHOWN = 6;
    const shown = matching.slice(0, SHOWN);
    const overflow = matching.length - shown.length;

    const chip = (r) =>
      h(
        'div',
        {
          display: 'flex',
          alignItems: 'center',
          border: `1px solid ${RULE}`,
          background: '#fbf8f2',
          padding: '8px 18px',
          marginRight: 12,
          marginBottom: 12,
          fontSize: 27,
          color: INK,
        },
        [
          h('div', {
            width: 16,
            height: 16,
            borderRadius: 8,
            background: r.accent || ACCENT,
            marginRight: 11,
          }),
          r.name,
        ],
      );

    const overflowChip =
      overflow > 0
        ? [
            h(
              'div',
              {
                display: 'flex',
                alignItems: 'center',
                padding: '8px 16px',
                marginBottom: 12,
                fontSize: 27,
                color: INK3,
              },
              `+${overflow} more`,
            ),
          ]
        : [];

    const resultRow =
      anyActive && matching.length === 0
        ? h(
            'div',
            { display: 'flex', marginTop: 34, fontSize: 28, color: INK3 },
            'Loosen a threshold to see candidates.',
          )
        : h(
            'div',
            { display: 'flex', flexWrap: 'wrap', marginTop: 34 },
            [...shown.map(chip), ...overflowChip],
          );

    // The font's Latin subset has no ≤/≥ glyphs (Satori would try, and fail, to
    // fetch a dynamic glyph font), so render them as ASCII in the image.
    const safeSummaries = summaries.map((s) => s.replace(/≥/g, '>=').replace(/≤/g, '<='));
    const summaryText =
      safeSummaries.length > 0
        ? h(
            'div',
            { display: 'flex', fontSize: 24, color: INK3, marginBottom: 16, maxWidth: 1072 },
            safeSummaries.slice(0, 4).join('   ·   ') + (safeSummaries.length > 4 ? '   ·   ...' : ''),
          )
        : h(
            'div',
            { display: 'flex', fontSize: 24, color: INK3, marginBottom: 16 },
            'Drag any threshold; the framework filters, it never scores.',
          );

    const tree = h(
      'div',
      {
        width: 1200,
        height: 630,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 56,
        backgroundColor: PAPER,
        color: INK,
        fontFamily: 'Spectral',
      },
      [
        // Top block
        h('div', { display: 'flex', flexDirection: 'column' }, [
          h('div', { width: 120, height: 10, background: ACCENT, marginBottom: 30 }),
          h(
            'div',
            { display: 'flex', fontSize: 22, letterSpacing: 2, color: ACCENT, marginBottom: 18 },
            'THE LAND SELECTION FRAMEWORK',
          ),
          h(
            'div',
            { display: 'flex', fontSize: 62, lineHeight: 1.06, maxWidth: 1040 },
            headline,
          ),
          resultRow,
        ]),
        // Bottom block
        h('div', { display: 'flex', flexDirection: 'column' }, [
          summaryText,
          h(
            'div',
            {
              display: 'flex',
              justifyContent: 'space-between',
              borderTop: `1px solid ${RULE}`,
              paddingTop: 18,
              fontSize: 22,
              color: INK3,
            },
            [
              h('div', { display: 'flex' }, 'land-selection-framework.vercel.app'),
              h('div', { display: 'flex' }, `${total} candidate regions · filters, never scores`),
            ],
          ),
        ]),
      ],
    );

    return new ImageResponse(tree, {
      width: 1200,
      height: 630,
      fonts: [{ name: 'Spectral', data: fontData, style: 'normal', weight: 500 }],
    });
  } catch (err) {
    // Graceful degradation: fall back to the static card that already ships.
    return Response.redirect(new URL('/og.png', base), 302);
  }
}
