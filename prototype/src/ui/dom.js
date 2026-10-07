// DOM helper shared by the UI modules.

// Creates an element. opts: { className, text, style (object), attrs (object of attributes) }.
export function el(tag, opts = {}) {
  const n = document.createElement(tag);
  if (opts.className) n.className = opts.className;
  if (opts.text != null) n.textContent = opts.text;
  if (opts.style) Object.assign(n.style, opts.style);
  if (opts.attrs) for (const [k, v] of Object.entries(opts.attrs)) n.setAttribute(k, v);
  return n;
}
