// linework.js - the brand's drawn line language (streams, contour rings, divide, braid). PURE and DOM-free:
//   * runs in the browser (index.html, hero + colophon art)
//   * runs in Node at build time (scripts/gen_region_pages.mjs inlines the SVG, so region pages need no JS)
//   * runs in the Vercel edge runtime (api/og.js turns the same paths into Satori <svg> children)
//
// HONESTY RULE (non-negotiable, see final-spec.md section 7): this is ORNAMENT. Seeds are FIXED per surface
// ('catchment', 'colophon', 'divider'). It is never seeded from a region id, so it can never be read as the
// geography of a place. Real geography lives only on the map, from real data.
//
// Everything is deterministic: same seed => same drawing on every machine. No Math.random, no Date.

export function hash(s) { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
export function rng(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const f1 = (n) => Math.round(n * 10) / 10;
const P = (a) => f1(a[0]) + ' ' + f1(a[1]);
function bez(p0, p1, p2, p3, t) { const u = 1 - t; return [u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]; }

/** A drainage network: one meandering stem, `tribs` tributaries joining at acute angles, a twig on each.
 *  Returns [{ d, w, role }] in draw order (stem first). Output is ~700 bytes per 4 tributaries. */
export function network(seed, o = {}) {
  const w = o.w || 120, h = o.h || 120, n = o.tribs || 4, sw = o.sw || [3.2, 2.2, 1.4], r = rng(hash(seed));
  const p0 = [w * (.40 + r() * .22), h * .03], p3 = [w * (.38 + r() * .24), h * .98], p1 = [w * (.08 + r() * .84), h * .30], p2 = [w * (.08 + r() * .84), h * .68];
  const out = [{ d: `M${P(p0)}C${P(p1)} ${P(p2)} ${P(p3)}`, w: sw[0], role: 'stem' }];
  for (let i = 0; i < n; i++) {
    const t = .22 + ((i + .2 + r() * .6) / n) * .62, c = bez(p0, p1, p2, p3, t), side = (i % 2 ? 1 : -1) * (r() < .82 ? 1 : -1);
    const dx = side * w * (.2 + r() * .24), dy = h * (.14 + r() * .18), s = [c[0] + dx, c[1] - dy];
    out.push({ d: `M${P(s)}C${P([s[0] - dx * .04, s[1] + dy * .55])} ${P([c[0] + dx * .14, c[1] - dy * .3])} ${P(c)}`, w: sw[1], role: 'trib' });
    const m = bez(s, [s[0] - dx * .04, s[1] + dy * .55], [c[0] + dx * .14, c[1] - dy * .3], c, .45 + r() * .2), tx = (r() < .5 ? 1 : -1) * w * (.1 + r() * .1);
    out.push({ d: `M${P(m)}Q${P([m[0] + tx * .9, m[1] - dy * .05])} ${P([m[0] + tx, m[1] - dy * .5])}`, w: sw[2], role: 'twig' });
  }
  return out;
}

/** Nested closed curves with a 3-term sinusoidal wobble: read as contour lines / tree rings. Returns [{ d, w, op, dash }]. */
export function rings(seed, cx, cy, n, r0, gap, o = {}) {
  const r = rng(hash(seed)), ph = [r() * 6.28, r() * 6.28, r() * 6.28], ky = o.ky || .88, out = [];
  for (let i = 0; i < n; i++) {
    const R = r0 + i * gap, pts = [];
    for (let a = 0; a <= 72; a++) {
      const th = a / 72 * 6.2832, k = 1 + .085 * Math.sin(3 * th + ph[0] + i * .35) + .05 * Math.sin(5 * th + ph[1] - i * .2) + .03 * Math.sin(2 * th + ph[2]);
      pts.push(f1(cx + R * k * Math.cos(th)) + ' ' + f1(cy + R * k * ky * Math.sin(th)));
    }
    out.push({ d: `M${pts.join('L')}Z`, w: o.sw || .9, op: o.op || .35, dash: o.dash || null });
  }
  return out;
}

/** The brand's hero drawing ("the Catchment"): 8 contour rings, a dashed drainage divide, a stem with 8 tributaries.
 *  Fixed seeds. viewBox 0 0 600 640. Total path data is ~9 KB. */
export function catchment() {
  return {
    viewBox: '0 0 600 640',
    rings: rings('ecoregion', 330, 330, 8, 60, 30, { op: .26 }),
    divide: rings('catchment/divide', 335, 330, 1, 292, 0, { ky: 1.04, sw: 1.3, dash: '2 7', op: .7 }),
    network: network('catchment', { w: 600, h: 640, tribs: 8, sw: [3.4, 2.2, 1.3] }),
  };
}
/** Smaller fixed drawing for the colophon (no divide). */
export function colophonArt() { return { viewBox: '0 0 420 300', rings: [], divide: [], network: network('colophon', { w: 420, h: 300, tribs: 6, sw: [2.4, 1.7, 1] }) }; }

/** Wavy river rule under the h1 (one path). */
export const RIVER_RULE = 'M2 11C40 1 80 21 120 11S200 1 240 11 320 21 360 11 440 3 478 10';

/** The refusal stream: a river that runs, breaks into a dotted gap and stops at a bar. 560 x 34 viewBox. */
export const REFUSAL = { viewBox: '0 0 560 34', river: 'M2 17C40 5 80 29 120 17S200 5 240 17 320 29 360 17 420 7 470 17', gap: 'M486 17h20', bar: 'M526 5v24' };

/** SVG string for the DOM or for static HTML. `draw: true` adds pathLength + --i for the CSS draw-in. */
export function svg(art, o = {}) {
  const draw = o.draw ? (i) => ` pathLength="1" style="--i:${i}"` : () => '';
  let i = 0;
  const g = (arr, cls, color) => arr.length ? `<g class="${cls}"${color ? ` style="color:${color}"` : ''}>${arr.map((p) => `<path${draw(i++)} d="${p.d}" stroke-width="${p.w}"${p.op ? ` opacity="${p.op}"` : ''}${p.dash ? ` stroke-dasharray="${p.dash}"` : ''}/>`).join('')}</g>` : '';
  return `<svg viewBox="${art.viewBox}" fill="none" stroke="currentColor" stroke-linecap="round" aria-hidden="true" focusable="false">${g(art.rings, 'lw-rings')}${g(art.divide, 'lw-divide', 'var(--ink-3)')}${g(art.network, 'lw-net')}</svg>`;
}

/** Satori (@vercel/og) children for the OG card: flat list of <path> element objects. `color` is a literal hex. */
export function satoriPaths(art, color) {
  const mk = (p, extra = {}) => ({ type: 'path', props: { d: p.d, fill: 'none', stroke: color, strokeWidth: p.w, strokeLinecap: 'round', ...(p.op ? { strokeOpacity: p.op } : {}), ...(p.dash ? { strokeDasharray: p.dash } : {}), ...extra } });
  return [...art.rings.map((p) => mk(p)), ...art.divide.map((p) => mk(p)), ...art.network.map((p) => mk(p))];
}
