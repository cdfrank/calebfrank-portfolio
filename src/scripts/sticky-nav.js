// Pins each page's nav to the top. Its section keeps the nav's height as padding, and once the
// page scrolls the nav gets a bar in that section's own colour. The home hero does its own (Home.jsx).
// State lives on <html> (data-navpin, data-nav-stuck, --navh, --bar-c, --nav-c) so React-owned markup is never touched.
const d = document.documentElement;
const nav = document.querySelector('.site .wrap.nav');
if (nav && !nav.closest('.ss')) {
  const island = Boolean(nav.closest('astro-island'));
  const host = nav.parentElement;
  const hs = getComputedStyle(host);
  const base = parseFloat(hs.paddingTop) || 0;
  d.style.setProperty('--bar-c', hs.backgroundColor === 'rgba(0, 0, 0, 0)' ? '#111' : hs.backgroundColor);
  d.style.setProperty('--nav-c', hs.color);
  // A clipped or layered section would hide a fixed child, so static pages lift the nav out of it.
  // React-hydrated pages keep it in place (their nav already sits directly in .site).
  const site = nav.closest('.site');
  if (!island && host !== site) site.prepend(nav);
  d.dataset.navpin = island ? 'island' : 'page';
  const size = () => {
    const stuck = d.hasAttribute('data-nav-stuck');
    d.removeAttribute('data-nav-stuck');
    const h = base + nav.offsetHeight + 'px';
    if (island) d.style.setProperty('--navh', h); else host.style.paddingTop = h;
    d.toggleAttribute('data-nav-stuck', stuck);
  };
  const stick = () => d.toggleAttribute('data-nav-stuck', window.scrollY > 8);
  size(); stick();
  addEventListener('scroll', stick, { passive: true });
  addEventListener('resize', size);
}
