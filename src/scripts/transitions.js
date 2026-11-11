// Page transitions for the main nav. A click on a nav.links item covers the page with that
// item's overlay (#tx), hands off through sessionStorage, and the next page reveals itself.
// First visit to each item per session gets the DOOANE antics; repeats get a quick fade.
const d = document.documentElement;
const OUT = { about: 320, work: 380, process: 320, play: 420, contact: 300 };
const HOLD = 2200; // matches --hold in transitions.css: the pause after DOOANE's antics
const IN = { about: 1250 + HOLD, work: 900 + HOLD, process: 860 + HOLD, play: 980 + HOLD, contact: 840 + HOLD };
const ART = { about: '/dooane/spray-can.webp', work: '/dooane/pointing.webp', process: '/dooane/crouch.png', play: '/dooane/skating.png', contact: '/dooane/cap-tip.png' };
const still = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let timer = 0;

function kind(url) {
  if (url.origin !== location.origin) return null;
  if (url.pathname === '/' && url.hash === '#contact') return 'contact';
  const m = url.pathname.match(/^\/(about|work|process|play)\/?$/);
  return m ? m[1] : null;
}

function repeat(t) {
  let s = [];
  try { s = JSON.parse(sessionStorage.getItem('tx-seen') || '[]'); } catch {}
  if (s.includes(t)) return true;
  s.push(t);
  try { sessionStorage.setItem('tx-seen', JSON.stringify(s)); } catch {}
  return false;
}

function end() {
  clearTimeout(timer);
  delete d.dataset.tx; delete d.dataset.txP; delete d.dataset.txQ;
}

function pulse() {
  const b = document.querySelector('.dooane-launcher');
  if (!b) return;
  b.classList.remove('tx-pulse'); void b.offsetWidth; b.classList.add('tx-pulse');
  setTimeout(() => b.classList.remove('tx-pulse'), 1300);
}

function reveal(t, q) {
  d.dataset.txP = 'in';
  timer = setTimeout(() => { end(); if (t === 'contact') pulse(); }, q ? 260 : IN[t]);
}

document.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('nav.links a[href]');
  if (!a || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || a.target === '_blank') return;
  const url = new URL(a.href, location.href);
  const t = kind(url);
  if (!t || still()) return;
  const same = url.pathname === location.pathname;
  if (same && !url.hash) return;
  e.preventDefault();
  const q = repeat(t);
  if (!q) new Image().src = ART[t];
  clearTimeout(timer);
  d.dataset.tx = t;
  if (q) d.dataset.txQ = ''; else delete d.dataset.txQ;
  d.dataset.txP = 'out';
  timer = setTimeout(() => {
    if (same) {
      history.pushState(null, '', url.hash);
      document.getElementById(url.hash.slice(1))?.scrollIntoView({ behavior: 'instant', block: 'start' });
      d.dataset.txP = 'hold';
      requestAnimationFrame(() => reveal(t, q));
    } else {
      try { sessionStorage.setItem('tx-pend', JSON.stringify({ t, q, u: url.pathname, ts: Date.now() })); } catch {}
      location.href = url.href;
    }
  }, q ? 170 : OUT[t]);
});

// Arriving from a transition: the head script already set data-tx and data-tx-p="hold".
if (d.dataset.tx) {
  const t = d.dataset.tx, q = 'txQ' in d.dataset;
  Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 250))]).then(() => requestAnimationFrame(() => reveal(t, q)));
}

// Any click or key skips the reveal.
const skip = () => { if (d.dataset.tx && d.dataset.txP !== 'out') end(); };
document.getElementById('tx')?.addEventListener('pointerdown', skip);
addEventListener('keydown', skip);
addEventListener('pageshow', (e) => { if (e.persisted) end(); });
