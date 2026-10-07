// Small accessibility helpers shared by the UI modules.

// Debounced screen-reader announcement of the match count. Sliders fire
// continuously while dragging; announcing every step would flood a screen
// reader, so we wait for the value to settle. Silent until a filter is active
// (filtersActive false clears the message).
let _announceTimer = null;
export function announceMatches(count, total, filtersActive) {
  const live = document.getElementById('match-announce');
  if (!live) return;
  if (_announceTimer) clearTimeout(_announceTimer);
  if (!filtersActive) { live.textContent = ''; return; }
  _announceTimer = setTimeout(() => {
    live.textContent = `${count} of ${total} regions match your criteria.`;
  }, 700);
}

// Loose tab trap for a dialog container — Tab/Shift+Tab cycle through the
// focusable elements inside it. Same pattern the signup modal already uses.
export function trapTabWithin(container) {
  if (!container) return;
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = container.querySelectorAll(
      'button, a[href], input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });
}
