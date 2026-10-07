// Vercel Web Analytics custom events (no-op if blocked/absent).

export function trackEvent(name, data) {
  try {
    if (typeof window.va === 'function') window.va('event', { name, ...(data || {}) });
  } catch { /* analytics must never break the page */ }
}
