// The overlay manager: one stack for the region drawer, the compare view and the signup modal (final-spec 6.5, D12).
//
//   open(name, { panel, trigger, onClose })   put an overlay on the stack (it becomes the topmost)
//   close(name, reason)                       take it off (true when it was open); calls its onClose(reason)
//   closeTop(reason)                          what Escape does
//   top(), has(name), count(), whenIdle(cb)   read the stack; whenIdle runs cb once no overlay is open
//
// While anything is open the manager
//   * sets `inert` on #main, #rct-rail, the skip link, the footer and every overlay BELOW the topmost one, so keyboard and
//     screen-reader users cannot reach what is behind the layer they are in (the modal may open over the drawer);
//   * puts `overlay-open` on <body>, plus the legacy `panel-open` (drawer, compare) or `modal-open` (signup modal) class
//     that the stylesheets already key on;
//   * owns ONE document keydown: Escape closes only the topmost overlay, Tab stays inside it;
//   * puts focus back on the element that had it when the overlay opened (`trigger`), after the page behind is live again.
//
// The manager never shows or hides a panel itself: the owner adds its own classes before open() and removes them in onClose.
// Whoever closes an overlay (button, Escape, scrim click) calls close(name); onClose runs once, whatever the way.
//
// The helpers below the manager (isOpen, lockBody, unlockBody, lockModal, unlockModal, createFocusReturn, escapeClaimed,
// claimEscape) are the pre-manager surface. The compare view still uses them until it registers with open(); keep them.

const stack = [];             // [{ name, panel, trigger, onClose, legacy }], bottom first
const idleWaiters = [];
const claimed = new WeakSet();
const weSetInert = new WeakSet();   // nodes whose `inert` this module put on (never clear one it did not set)
let listening = false;

const BEHIND = '#main, #rct-rail, body > .skip-link, body > footer';
const FOCUSABLE = 'a[href], button, input, select, textarea, summary, [tabindex]';

function markInert(node, on) {
  if (!node) return;
  if (on) {
    if (!node.hasAttribute('inert')) { node.setAttribute('inert', ''); weSetInert.add(node); }
  } else if (weSetInert.has(node)) {
    node.removeAttribute('inert');
    weSetInert.delete(node);
  }
}

// Brings the page in line with the stack: inert, body classes. Idempotent.
function sync() {
  const any = stack.length > 0;
  document.querySelectorAll(BEHIND).forEach((n) => markInert(n, any));
  stack.forEach((entry, i) => markInert(entry.panel, i < stack.length - 1));
  const body = document.body;
  body.classList.toggle('overlay-open', any);
  body.classList.toggle('panel-open', stack.some((e) => e.legacy === 'panel-open'));
  body.classList.toggle('modal-open', stack.some((e) => e.legacy === 'modal-open'));
}

function tabbables(panel) {
  return Array.from(panel.querySelectorAll(FOCUSABLE)).filter((n) => {
    if (n.hasAttribute('disabled') || n.getAttribute('tabindex') === '-1' || n.closest('[inert]')) return false;
    if (n.tagName === 'INPUT' && n.type === 'hidden') return false;
    return n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden';
  });
}

function onKeydown(e) {
  if (!stack.length) return;
  if (e.key === 'Escape') {
    if (claimed.has(e)) return;
    claimed.add(e);
    closeTop('escape');
    return;
  }
  if (e.key !== 'Tab' || e.defaultPrevented) return;
  const panel = stack[stack.length - 1].panel;
  if (!panel) return;
  const list = tabbables(panel);
  if (!list.length) return;
  const active = document.activeElement;
  const inside = panel.contains(active);
  if (!inside) { e.preventDefault(); list[0].focus(); return; }
  const first = list[0];
  const last = list[list.length - 1];
  if (e.shiftKey && active === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && active === last) { e.preventDefault(); first.focus(); }
}

function listen() {
  if (listening || typeof document === 'undefined') return;
  listening = true;
  document.addEventListener('keydown', onKeydown);
}
listen();

function flushIdle() {
  if (anyOpen()) return;
  idleWaiters.splice(0).forEach((fn) => { try { fn(); } catch (err) { console.error(err); } });
}

// True when any overlay is open: the stack, or a legacy overlay that has not registered with the manager (the compare view).
function anyOpen() {
  return stack.length > 0 || isOpen('region-drawer') || isOpen('compare-overlay') || isOpen('signup-modal');
}

export function open(name, opts = {}) {
  listen();
  const panel = opts.panel || document.getElementById(name);
  const existing = stack.find((e) => e.name === name);
  if (existing) {
    // Re-opening (the drawer shown for another region): keep its place in the stack and its original trigger.
    if (opts.onClose) existing.onClose = opts.onClose;
    return name;
  }
  const legacy = opts.legacy || (panel && panel.classList.contains('modal-backdrop') ? 'modal-open' : 'panel-open');
  stack.push({
    name,
    panel,
    trigger: opts.trigger || document.activeElement,
    onClose: typeof opts.onClose === 'function' ? opts.onClose : null,
    legacy,
  });
  sync();
  return name;
}

export function close(name, reason) {
  const i = stack.findIndex((e) => e.name === name);
  if (i === -1) return false;
  const wasTop = i === stack.length - 1;
  const [entry] = stack.splice(i, 1);
  sync();
  if (entry.onClose) {
    try { entry.onClose(reason); } catch (err) { console.error(`Overlay "${name}" onClose failed:`, err); }
  }
  if (wasTop && entry.trigger && entry.trigger.isConnected && typeof entry.trigger.focus === 'function') {
    try { entry.trigger.focus({ preventScroll: true }); } catch {}
  }
  flushIdle();
  return true;
}

export function closeTop(reason) {
  if (!stack.length) return false;
  return close(stack[stack.length - 1].name, reason);
}

export function top() { return stack.length ? stack[stack.length - 1].name : null; }
export function has(name) { return stack.some((e) => e.name === name); }
export function count() { return stack.length; }

// Runs cb once no overlay is open (now, when none is). Used by the engagement-triggered signup modal, which must never
// open over a drawer or the compare view. The compare view is not on the stack yet, so a short poll backs the flush.
export function whenIdle(cb) {
  if (!anyOpen()) { cb(); return; }
  idleWaiters.push(cb);
  const poll = setInterval(() => {
    if (!idleWaiters.includes(cb)) { clearInterval(poll); return; }
    if (!anyOpen()) { clearInterval(poll); flushIdle(); }
  }, 400);
}

// ---------------------------------------------------------------------------------------------------------------
// The pre-manager helpers, kept for the compare view (and anything else that has not registered with open() yet).
// ---------------------------------------------------------------------------------------------------------------

// True when the overlay with this element id is showing (`open` for the drawer and compare, `visible` for the modal).
export function isOpen(id) {
  const n = document.getElementById(id);
  return !!n && (n.classList.contains('open') || n.classList.contains('visible'));
}

// `panel-open` stops the page behind the drawer or the compare view from scrolling.
export function lockBody() {
  document.body.classList.add('panel-open');
}

// Releases the scroll lock unless the other panel (by element id) is still open.
export function unlockBody(otherPanelId) {
  if (!isOpen(otherPanelId) && !stack.some((e) => e.legacy === 'panel-open')) document.body.classList.remove('panel-open');
}

export function lockModal() {
  document.body.classList.add('modal-open');
}

export function unlockModal() {
  if (!stack.some((e) => e.legacy === 'modal-open')) document.body.classList.remove('modal-open');
}

// Remembers the element that had focus when an overlay opened and hands focus back when it closes.
export function createFocusReturn() {
  let node = null;
  return {
    remember(target = document.activeElement) { node = target; },
    restore() {
      if (node && typeof node.focus === 'function') {
        try { node.focus({ preventScroll: true }); } catch {}
      }
    },
  };
}

// One Escape press closes one layer. A listener that acts claims the event; the others see escapeClaimed(e) and leave their
// own overlay open. The manager's own listener claims first (it is registered when this module loads).
export function escapeClaimed(e) {
  return claimed.has(e);
}

export function claimEscape(e) {
  claimed.add(e);
}
