// A tiny publish/subscribe bus so UI and map modules can talk without importing each other.
//
// Events in use:
//   refresh           the filter state changed and every view should redraw
//   continent:change  { continent } the visitor switched continent
//   pin:toggle        { regionId, pinned } a region was pinned or unpinned
//   drawer:open       { regionId } the region drawer opened
//   compare:open      the compare overlay opened
//   filters:change    { source } a threshold or qualitative filter moved
// Payloads are plain objects. A listener that throws is reported and does not stop the others.

const listeners = new Map();

// Subscribes fn to evt. Returns a function that unsubscribes it again.
export function on(evt, fn) {
  let set = listeners.get(evt);
  if (!set) { set = new Set(); listeners.set(evt, set); }
  set.add(fn);
  return () => off(evt, fn);
}

export function off(evt, fn) {
  const set = listeners.get(evt);
  if (set) set.delete(fn);
}

// Calls every listener of evt with payload, in the order they subscribed.
export function emit(evt, payload) {
  const set = listeners.get(evt);
  if (!set) return;
  for (const fn of [...set]) {
    try { fn(payload); } catch (err) { console.error(`bus listener for "${evt}" failed:`, err); }
  }
}
