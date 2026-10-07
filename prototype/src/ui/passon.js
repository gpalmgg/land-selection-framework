// "Pass this framework to a group": the link in the suite note shares the site URL with the native share sheet, or
// copies it. This was an inline classic script in index.html.

export function initPassOn() {
  const link = document.getElementById('passOn');
  if (!link) return;
  link.addEventListener('click', async function (ev) {
    ev.preventDefault();
    const payload = {
      title: 'Land Selection Framework',
      text: 'Know the land before you love it. A bioregioning tool for communities choosing where to root:',
      url: 'https://land-selection-framework.regencommunity.tools',
    };
    if (navigator.share) {
      try { await navigator.share(payload); } catch (e) {}
    } else {
      try { await navigator.clipboard.writeText(payload.url); this.textContent = 'link copied'; } catch (e) {}
    }
  });
}
