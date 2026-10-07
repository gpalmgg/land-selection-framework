// Share button, copies the current URL to clipboard.

import { state, filterData, runtime } from '../state.js';
import { emit } from '../bus.js';
import { trackEvent } from './analytics.js';
import { anyFilterActive as filtersActive } from '../../lib/filters.js';

const anyFilterActive = () => filtersActive(state, filterData);

// The URL we actually hand out when sharing. With state in the query, share the
// /share route (crawler-facing meta + dynamic card, then redirects humans to the
// app). With no state, share the bare app URL.
export function shareTargetUrl() {
  const qs = window.location.search;
  if (!qs || qs === '?') return `${window.location.origin}/`;
  return `${window.location.origin}/share${qs}`;
}

export function initShareButton() {
  // ui/next-step.js reads this hook for its own share button.
  runtime.hooks.shareTargetUrl = shareTargetUrl;

  const btn = document.getElementById('share-btn');
  const note = document.getElementById('share-note');
  if (!btn) return;

  let noteTimer = null;
  let revertTimer = null;

  btn.addEventListener('click', async () => {
    // Flush any pending debounced URL write so we copy the latest state (ui/url-sync.js answers this event)
    emit('url:flush');
    const url = shareTargetUrl();

    // On touch devices with a native share sheet, prefer it over clipboard.
    if (navigator.share && window.matchMedia('(pointer: coarse)').matches) {
      try {
        await navigator.share({
          title: 'Land Selection Framework',
          text: 'Bioregional criteria, filtered:',
          url,
        });
        trackEvent('share', { method: 'native', has_filters: anyFilterActive() });
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // user dismissed the sheet
        // any other failure falls through to the clipboard path below
      }
    }

    let copied = false;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
        copied = true;
      } else {
        // Fallback for non-secure contexts (file://, http on LAN)
        const ta = document.createElement('textarea');
        ta.value = url;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        copied = document.execCommand('copy');
        document.body.removeChild(ta);
      }
    } catch {
      copied = false;
    }

    if (note) {
      note.textContent = copied ? 'Link copied' : 'Copy failed, long-press to copy';
      note.classList.add('visible');
      if (noteTimer) clearTimeout(noteTimer);
      noteTimer = setTimeout(() => note.classList.remove('visible'), 2000);
    }
    if (copied) {
      trackEvent('share', { method: 'clipboard', has_filters: anyFilterActive() });
      btn.classList.add('copied');
      btn.setAttribute('aria-label', 'Link copied to clipboard');
      if (revertTimer) clearTimeout(revertTimer);
      revertTimer = setTimeout(() => {
        btn.classList.remove('copied');
        btn.setAttribute('aria-label', 'Copy the current filter URL to clipboard');
      }, 2000);
    }
  });
}
