// Signup: the hero form (FormSubmit.co endpoint, mailto fallback in the footnote) and the engagement-gated modal.
// Moved verbatim from main.js. The two submit handlers are deliberately NOT merged, and nothing in the test suite
// ever clicks submit or calls them. Do not loosen the success check (FormSubmit answers with the STRING "true").
// MC-SHELL changes the strings; MC-DRAWER put the modal on the overlay manager (ui/overlays.js): open and close only,
// the submit path is untouched.

import { trackEvent } from './analytics.js';
import { open as openOverlay, close as closeOverlay, whenIdle } from './overlays.js';

// Signup form (FormSubmit.co endpoint, mailto fallback in the footnote)
// ====================================================================

function setStatus(statusEl, kind, text, link) {
  statusEl.className = 'form-status' + (kind ? ` ${kind}` : '');
  while (statusEl.firstChild) statusEl.removeChild(statusEl.firstChild);
  statusEl.appendChild(document.createTextNode(text));
  if (link) {
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    a.style.color = 'var(--accent)';
    a.style.textDecoration = 'underline dotted';
    a.style.textUnderlineOffset = '2px';
    statusEl.appendChild(document.createTextNode(' '));
    statusEl.appendChild(a);
    statusEl.appendChild(document.createTextNode(link.tail || ''));
  }
}

export function initSignupForm() {
  const form = document.getElementById('signup-form');
  const status = document.getElementById('form-status');
  const emailInput = document.getElementById('signup-email');
  if (!form || !status || !emailInput) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus(status, 'error', 'Please enter a valid email.');
      return;
    }

    // Honeypot check, if hidden field is filled, silently succeed but discard
    const honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) {
      setStatus(status, 'success', 'Thanks, you\'re in.');
      emailInput.value = '';
      return;
    }

    // Lock the button for the duration of the request. Without this the visitor
    // can press Subscribe repeatedly while the fetch is in flight, which is how
    // the same address arrived twice within a minute in the relay notifications.
    const submitBtn = form.querySelector('button[type="submit"], button:not([type])');
    if (submitBtn) {
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    setStatus(status, '', 'Sending…');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      // FormSubmit's AJAX endpoint returns success as the STRING "true"/"false"
      if (response.ok && String(data.success) === 'true') {
        trackEvent('signup', { source: 'hero' });
        setStatus(status, 'success', 'Thanks, you\'re in. The group won\'t share your email.');
        emailInput.value = '';
        markSubscribed();
        // Button stays disabled on success: they are in, there is nothing to press again.
      } else {
        setStatus(status, 'error', 'Something went wrong. Please try again in a moment.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
      }
    } catch (err) {
      setStatus(status, 'error', 'Something went wrong. Please try again in a moment.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
    }
  });
}

/**
 * One signup means one signup. The hero form and the engagement-gated modal are
 * separate forms writing to the same relay, and the modal only consulted its own
 * localStorage key, which the hero never set. So someone who subscribed in the
 * hero got asked again ~13-30s later by the modal and dutifully subscribed twice.
 * Recording it in the shared key and announcing it lets the modal stand down.
 */
function markSubscribed() {
  try { localStorage.setItem('lsf-modal-state', 'subscribed'); } catch {}
  try { window.dispatchEvent(new CustomEvent('lsf:subscribed')); } catch {}
}

// ====================================================================
// Signup modal, engagement-gated (scroll / slider / dwell), dismissable.
// Never locks the page; fires once per visitor after real engagement.
// ====================================================================

export function initSignupModal() {
  const STORAGE_KEY = 'lsf-modal-state';
  const DWELL_FALLBACK_MS = 30000;   // gentle ask after this long even for a passive reader

  const modal = document.getElementById('signup-modal');
  const card = modal && modal.querySelector('.modal-card');
  const closeBtn = document.getElementById('modal-close-btn');
  const form = document.getElementById('modal-form');
  const emailInput = document.getElementById('modal-email');
  const status = document.getElementById('modal-status');

  if (!modal || !form || !emailInput) return;

  // Query-string override: ?modal=1 forces show regardless of prior state (for testing)
  const forceShow = new URLSearchParams(window.location.search).get('modal') === '1';

  const prior = (() => {
    try { return localStorage.getItem(STORAGE_KEY); } catch { return null; }
  })();

  if (!forceShow && (prior === 'subscribed' || prior === 'dismissed')) {
    // Already engaged, never re-prompt
    return;
  }

  let modalShown = false;
  let lastFocusedBeforeModal = null;

  // If the hero form succeeds while the modal triggers are armed, stand down.
  window.addEventListener('lsf:subscribed', () => {
    teardownTriggers.splice(0).forEach((fn) => { try { fn(); } catch {} });
    modalShown = true; // blocks any trigger that already fired this tick
  });

  // Engagement-gated trigger: the sliders are NEVER locked. Show the modal once,
  // after the visitor has actually engaged, scrolled past the criteria section,
  // moved a threshold slider, or dwelled ~30s. First signal wins; then unbind all.
  const teardownTriggers = [];
  function armTrigger(unbind) { teardownTriggers.push(unbind); }
  let modalPending = false;
  function fireModalOnce(trigger) {
    if (modalShown || modalPending) return;
    teardownTriggers.splice(0).forEach((fn) => { try { fn(); } catch {} });
    // The engagement-triggered ask never opens over another overlay (a drawer or the compare view): it waits until
    // every overlay is closed, then shows. A subscription in the meantime sets modalShown and cancels it.
    modalPending = true;
    whenIdle(() => { modalPending = false; showModal(trigger); });
  }

  if (forceShow) {
    setTimeout(() => fireModalOnce('force'), 200);
  } else {
    // 1) Scrolled to/through the criteria section, they've seen the core content.
    const criteria = document.querySelector('.criteria');
    const onScroll = () => {
      const reached = criteria
        ? criteria.getBoundingClientRect().top < window.innerHeight * 0.6
        : window.scrollY > window.innerHeight * 1.3;
      if (reached) fireModalOnce('scroll');
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    armTrigger(() => window.removeEventListener('scroll', onScroll));

    // 2) Moved a threshold slider, high-intent engagement with the actual tool.
    const sliders = document.querySelectorAll('.criteria input[type="range"]');
    const onSlider = () => fireModalOnce('slider');
    sliders.forEach((s) => s.addEventListener('input', onSlider));
    armTrigger(() => sliders.forEach((s) => s.removeEventListener('input', onSlider)));

    // 3) Dwell fallback, a gentle ask even for a passive reader.
    const dwell = setTimeout(() => fireModalOnce('dwell'), DWELL_FALLBACK_MS);
    armTrigger(() => clearTimeout(dwell));
  }

  function persistState(value) {
    try { localStorage.setItem(STORAGE_KEY, value); } catch {}
  }

  function showModal(trigger) {
    if (modalShown) return;
    modalShown = true;
    lastFocusedBeforeModal = document.activeElement;
    modal.classList.add('visible');
    modal.setAttribute('aria-hidden', 'false');
    // On the overlay manager: #main (and a drawer under the modal) go inert, body gets overlay-open and modal-open.
    openOverlay('signup-modal', { panel: modal, trigger: lastFocusedBeforeModal, onClose: (why) => finishDismiss(why === 'subscribed' ? 'subscribed' : 'dismissed') });
    trackEvent('modal_shown', { trigger: trigger || 'unknown' });
    // Defer focus to allow transition
    setTimeout(() => emailInput.focus({ preventScroll: true }), 60);
  }

  // The overlay manager calls this (through onClose) however the modal closes: the X, a click outside, Escape, or the
  // timed close after a subscription. It hides the modal and records why; the manager puts focus back on the trigger.
  function finishDismiss(reason) {
    modal.classList.remove('visible');
    modal.setAttribute('aria-hidden', 'true');
    persistState(reason); // 'subscribed' or 'dismissed'
    trackEvent('modal_dismissed', { reason });
  }

  function dismissModal(reason) {
    if (!closeOverlay('signup-modal', reason)) finishDismiss(reason);
  }

  // Dismiss handlers
  closeBtn && closeBtn.addEventListener('click', () => dismissModal('dismissed'));

  // Click outside card, also a clear "no thanks"
  modal.addEventListener('click', (e) => {
    if (e.target === modal) dismissModal('dismissed');
  });

  // ESC key: the overlay manager's one keydown closes the topmost overlay (this modal when it is on top, and only it),
  // whose onClose records it as 'dismissed' (only a subscription records 'subscribed').

  // Focus trap (loose, Tab/Shift+Tab cycle through focusable inside modal)
  card && card.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    const focusable = card.querySelectorAll('button, input[type="email"], [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault(); last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault(); first.focus();
    }
  });

  // Form submit, same FormSubmit endpoint as hero, just a second form
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setStatus(status, 'error', 'Please enter a valid email.');
      return;
    }
    const honey = form.querySelector('input[name="_honey"]');
    if (honey && honey.value) {
      // Bot, silently succeed but discard
      setStatus(status, 'success', 'Thanks, you\'re in.');
      setTimeout(() => dismissModal('subscribed'), 900);
      return;
    }
    // Same double-submit lock as the hero form.
    const submitBtn = form.querySelector('button[type="submit"], button:not([type])');
    if (submitBtn) {
      if (submitBtn.disabled) return;
      submitBtn.disabled = true;
      submitBtn.setAttribute('aria-busy', 'true');
    }

    setStatus(status, '', 'Sending…');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' },
      });
      const data = await response.json().catch(() => ({}));
      // FormSubmit's AJAX endpoint returns success as the STRING "true"/"false"
      if (response.ok && String(data.success) === 'true') {
        trackEvent('signup', { source: 'modal' });
        setStatus(status, 'success', 'Thanks, you\'re in. Closing this in a moment.');
        emailInput.value = '';
        setTimeout(() => dismissModal('subscribed'), 1100);
      } else {
        setStatus(status, 'error', 'Something went wrong. You can continue without subscribing.');
        if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
      }
    } catch {
      setStatus(status, 'error', 'Network error. You can continue without subscribing.');
      if (submitBtn) { submitBtn.disabled = false; submitBtn.removeAttribute('aria-busy'); }
    }
  });
}
