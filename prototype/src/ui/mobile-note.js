// Mobile honesty notice: dismissal persists across visits. This was an inline classic script in index.html.

export function initMobileNote() {
  const KEY = 'lsf-mobile-note-dismissed';
  const note = document.getElementById('mobile-note');
  if (!note) return;
  try { if (localStorage.getItem(KEY)) note.classList.add('dismissed'); } catch (e) {}
  const btn = document.getElementById('mobile-note-x');
  if (btn) btn.addEventListener('click', function () {
    note.classList.add('dismissed');
    try { localStorage.setItem(KEY, '1'); } catch (e) {}
  });
}
