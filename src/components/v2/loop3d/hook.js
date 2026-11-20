// Lit loops: the small piece the page loads up front. It knows which projects have a lit loop and
// upgrades a coded SVG loop box in place. three.js and the scene only load once a lit loop is needed.
// The coded SVG stays underneath as the fallback for no WebGL, a lost GPU context or any load error.
export const LIT = new Set([
  'self-initiated-street-signal', 'nyl-digital-playslip', 'basf-salesx',
  'general-motors-build-price-platform-redesign', 'honeywell-product-selector-and-tools', 'new-york-lottery-single-sign-on',
  'basf-agriculture-customer-portal',
  'valero-digital-ecosystem-audit',
  'city-of-raleigh-website-redesign',
  'general-motors-global-design-system',
  'general-motors-onstar-shopping-pages-and-cart',
  'gm-lab313-mycardrive',
  'gm-lab313-test-drive-myway',
  'mrm-agent-relationship-management',
  'mrm-ux-team-ux-jam-sessions',
  'stella-alert-rework',
  'self-initiated-tin-minnows-bearings-co',
  'honeywell-building-automation-site-proposal',
  'jayco-product-experience-proposal',
  'self-initiated-shred-dice',
  'new-york-lottery-live-drawing-and-integrity-pages',
  'self-initiated-playable-figma-make-games',
  'olympia-skate-shop-brand-web-and-nike-materials',
  'self-initiated-tart',
  'self-initiated-design-system-scanner',
  'self-initiated-portfolios-please',
  'corebridge-financial-new-business-story',
  'new-york-lottery-alexa-skills-and-help-center',
  'mcdonald-s-crm-pitch',
  'fujifilm-instax-instax-north-america-website',
  'self-initiated-indoor-skatepark-proposal',
  'us-marine-corps-marine-corps-pitch',
  'mrm-ai-and-asset-management-vision',
  'optum-experience-design-support',
  'fujifilm-direct-to-consumer-platform',
  'fujifilm-amazon-experience-review',
  'new-york-lottery-crm-overhaul',
  'astrazeneca-farxiga-landing-pages',
  'thomas-edison-center-thomas-edison-center-website',
  'new-york-lottery-quick-draw-rebrand',
  'honeywell-cart-and-checkout',
]);

let rt = null;
const runtime = () => (rt ||= import('./runtime.js'));

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

// Errors are kept (not thrown) so a broken lit loop never breaks the page; /lab/motion/?debug shows them.
const errs = (globalThis.__l3dErrors ||= []);
const note = (e) => { errs.push(String((e && (e.stack || e.message)) || e)); };

const classic = () => {
  try { return new URLSearchParams(location.search).get('loops') === 'classic' || document.documentElement.dataset.loops === 'classic'; } catch (e) { return false; }
};

// enhance(box, slug) -> controller { play(), rest() } or null when this project keeps its coded loop.
export function enhance(box, slug) {
  if (!box || !LIT.has(slug) || classic()) return null;
  if (!webgl()) { note('no webgl'); return null; }
  let stage = box.querySelector(':scope > .l3d');
  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'l3d';
    stage.setAttribute('aria-hidden', 'true');
    box.prepend(stage);
  }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  runtime().then((r) => r.poster(slug)).then((url) => {
    if (!url) return;
    let img = stage.querySelector('img');
    if (!img) { img = document.createElement('img'); img.alt = ''; img.decoding = 'async'; stage.prepend(img); }
    img.src = url;
    box.classList.add('l3d-host');
  }).catch(note);
  return {
    play() {
      if (still) return;
      stage.dataset.want = 'play';
      runtime().then((r) => r.play(stage, slug)).then((on) => { if (on) box.classList.add('l3d-host'); }).catch(note);
    },
    rest() {
      stage.dataset.want = 'rest';
      if (rt) rt.then((r) => r.rest(stage));
    },
  };
}
