// Graceful degradation when the map library or its tiles can't load: the page's real content (criteria, data,
// sources) does not depend on the map.

export function showMapFallback() {
  const mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.textContent = '';
    const msg = document.createElement('div');
    msg.className = 'map-fallback';
    const strong = document.createElement('strong');
    strong.textContent = 'Interactive map unavailable.';
    msg.appendChild(strong);
    msg.appendChild(document.createElement('br'));
    msg.appendChild(document.createTextNode("The regional comparison and criteria below don't depend on it, scroll on."));
    mapEl.appendChild(msg);
  }
  const controls = document.querySelector('.map-controls');
  if (controls) controls.style.display = 'none';
}
