// Drawer block: head (design 8.10, reading order step 1).
// Owner: MC-DRAWER. The Salutation ("Whose land", with the short form of the territory) comes first and large, then the
// region's name and its country, and the Pin. Whose land it is is read before the weather (principle 1: the people
// before the parameters). The Salutation is text from lib/salutation.js: a region with no Land standing entry reads
// "Not yet recorded", never an invented name.
//
// The Pin carries the same mark and words as the card (PIN_ICON, "Pin" / "Pinned", aria-pressed). ui/shortlist.js owns the
// toggle (bus pin:toggle) and repaints this button when a pin changes elsewhere; it finds it by `.drawer-star[data-region]`.

import { salutation, LABEL as SAL_LABEL, CONTESTED_SUFFIX } from '../../../../lib/salutation.js';
import { PIN_ICON } from '../../region-grid.js';

export default {
  id: 'head',
  render(ctx) {
    const { el, region: r, state } = ctx;
    const head = el('section', { className: 'drawer-head', attrs: { 'aria-labelledby': `drawer-name-${r.id}` } });
    head.style.setProperty('--region', r.accent);
    head.style.setProperty('--accent-region', r.accent);

    const titles = el('div', { className: 'drawer-titles' });
    const sal = salutation(r.id);
    const p = el('p', { className: 'drawer-sal' });
    const k = el('span', { className: 'sal-k', text: SAL_LABEL });
    if (sal.contested) k.appendChild(el('span', { className: 'sal-flag', text: CONTESTED_SUFFIX }));
    p.appendChild(k);
    p.appendChild(el('span', { className: 'drawer-sal-v', text: sal.text || 'Not yet recorded' }));
    titles.appendChild(p);
    titles.appendChild(el('h3', { className: 'drawer-name serif', text: r.name, attrs: { id: `drawer-name-${r.id}` } }));
    titles.appendChild(el('div', { className: 'drawer-country', text: r.country }));
    head.appendChild(titles);

    const tools = el('div', { className: 'drawer-tools' });
    const pin = el('button', { className: 'drawer-star', attrs: { type: 'button' } });
    pin.dataset.region = r.id;
    const on = state.shortlist.has(r.id);
    pin.classList.toggle('on', on);
    pin.setAttribute('aria-pressed', String(on));
    pin.setAttribute('aria-label', on ? `Pinned ${r.name}` : `Pin ${r.name}`);
    pin.dataset.pinUi = on ? 'on' : 'off';
    pin.innerHTML = PIN_ICON;
    pin.appendChild(el('span', { text: on ? 'Pinned' : 'Pin' }));
    // Pinning goes through the bus; ui/shortlist.js owns the toggle and refreshes this button.
    pin.addEventListener('click', () => ctx.bus.emit('pin:toggle', { regionId: r.id }));
    tools.appendChild(pin);
    head.appendChild(tools);
    return head;
  },
};
