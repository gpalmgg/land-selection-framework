// Pure formatting and colour helpers shared by the client modules. No DOM, no network, no storage:
// everything here takes values in and returns values out, so it runs unchanged under node --test.
//
// Behaviour is identical to the helpers that lived in src/main.js at 6bce1a3. In particular fmtVal still
// ROUNDS (one decimal under 10, none above). A cell formatter that keeps precision belongs to the evidence
// renderers; nothing here changes how a number is shown today.

// Display text for a number in the visitor's locale; non-numbers pass through as strings.
export function fmtVal(v) {
  if (typeof v !== 'number') return String(v);
  if (Number.isInteger(v)) return v.toLocaleString();
  return v.toFixed(Math.abs(v) < 10 ? 1 : 0);
}

// Position of v inside [lo, hi] as 0..1 (clamped). Non-numbers map to 0.
export function normalize(v, lo, hi) {
  if (typeof v !== 'number') return 0;
  return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}

// Picks the ramp stop nearest to t (0..1). A ramp is an array of colour strings.
export function rampColor(ramp, t) {
  const n = ramp.length - 1;
  const pos = t * n;
  const idx = Math.min(n - 1, Math.max(0, Math.floor(pos)));
  return pos - idx > 0.5 ? ramp[idx + 1] : ramp[idx];
}

// Ramp colors double as TEXT color in the summary/compare tables, but the
// light ends of the ramps (#e8e4d8, even #f6f2eb) are near-invisible on the
// paper background. This darkens a color just enough to reach WCAG AA 4.5:1
// as text on --paper, preserving its hue so the color coding still reads.
const _textSafeCache = {};
export function textSafeColor(hexColor) {
  if (_textSafeCache[hexColor]) return _textSafeCache[hexColor];
  const m = String(hexColor).replace('#', '').match(/../g);
  if (!m || m.length < 3) return hexColor;
  const bg = [246, 242, 235]; // --paper
  const lum = (c) => {
    const f = c.map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2];
  };
  const contrast = (a, b) => {
    const l1 = lum(a); const l2 = lum(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  };
  let c = m.map((x) => parseInt(x, 16));
  for (let i = 0; i < 24 && contrast(c, bg) < 4.5; i++) {
    c = c.map((v) => Math.max(0, Math.round(v * 0.9)));
  }
  const out = `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  _textSafeCache[hexColor] = out;
  return out;
}
