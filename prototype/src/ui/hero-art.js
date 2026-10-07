// Hero drawing clean-up (design 9, moment 2): the Catchment and the river rule draw themselves once, by CSS (`.draw path`).
// When the LAST path has finished, drop the `.draw` class everywhere so the page carries no animation afterwards (the drawing is
// already complete and stays exactly as it is). Reduced motion never animates, so there is nothing to wait for: the class is
// dropped at once. The script is optional: without it the drawing still draws, forwards-filled, and simply keeps its class.
const stop = () => document.querySelectorAll('.draw').forEach((n) => n.classList.remove('draw'));
const last = [...document.querySelectorAll('.hero-art path')].pop();
if (!last) stop();
else if (matchMedia('(prefers-reduced-motion: reduce)').matches) stop();
else last.addEventListener('animationend', stop, { once: true });
