// Lit loops: the small piece the page loads up front. It knows which projects have a lit loop and
// upgrades a coded SVG loop box in place. three.js and the scene only load once a lit loop is needed.
// The coded SVG stays underneath as the fallback for no WebGL, a lost GPU context or any load error.
export const LIT = new Set(['self-initiated-street-signal', 'nyl-digital-playslip']);

let rt = null;
const runtime = () => (rt ||= import('./runtime.js'));

function webgl() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch (e) { return false; }
}

const classic = () => {
  try { return new URLSearchParams(location.search).get('loops') === 'classic' || document.documentElement.dataset.loops === 'classic'; } catch (e) { return false; }
};

// enhance(box, slug) -> controller { play(), rest() } or null when this project keeps its coded loop.
export function enhance(box, slug) {
  if (!box || !LIT.has(slug) || classic() || !webgl()) return null;
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
  }).catch(() => {});
  return {
    play() {
      if (still) return;
      stage.dataset.want = 'play';
      runtime().then((r) => r.play(stage, slug)).then((on) => { if (on) box.classList.add('l3d-host'); }).catch(() => {});
    },
    rest() {
      stage.dataset.want = 'rest';
      if (rt) rt.then((r) => r.rest(stage));
    },
  };
}
