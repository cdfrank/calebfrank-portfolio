// Lit loops runtime. One WebGL renderer for the whole page: its canvas moves into whichever loop
// is playing, so the site never holds more than one GPU context however many loops it shows.
// Resting loops show a poster frame rendered once per project and kept as an image.
import { THREE } from './kit.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const SCENES = {
  'self-initiated-street-signal': () => import('./scenes/street-signal.js'),
  'nyl-digital-playslip': () => import('./scenes/playslip.js'),
};

let R = null;          // { renderer, env }
let broken = false;
const built = new Map(); // slug -> Promise<scene>
const posters = new Map(); // slug -> Promise<dataURL>
let active = null;     // { host, slug, s, t0, raf, scale, slow }

function renderer() {
  if (R || broken) return R;
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.localClippingEnabled = true;
    const pm = new THREE.PMREMGenerator(renderer);
    const env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
    const cv = renderer.domElement;
    cv.className = 'l3d-cv';
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); broken = true; stopActive(); document.querySelectorAll('.l3d-host').forEach((h) => h.classList.remove('l3d-host')); });
    R = { renderer, env };
  } catch (e) { broken = true; (globalThis.__l3dErrors ||= []).push('renderer: ' + (e && e.message)); }
  return R;
}

export const ok = () => !!renderer();

function scene(slug) {
  if (!built.has(slug)) {
    built.set(slug, Promise.all([SCENES[slug](), document.fonts ? Promise.all([document.fonts.load('700 32px Inter'), document.fonts.load('600 20px Inter'), document.fonts.load('700 20px "JetBrains Mono"')]).catch(() => null) : null]).then(([mod]) => mod.build({ THREE, env: R.env, renderer: R.renderer })));
  }
  return built.get(slug);
}

// Size the shared canvas to a host. Pixel ratio is capped by total pixels so a full-screen phone
// viewer costs about the same as a desktop card, and the adaptive scale trims it further if frames run long.
function fit(w, h, scale = 1) {
  const { renderer: r } = R;
  const dpr = Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(1.4e6 / Math.max(1, w * h))) * scale;
  r.setPixelRatio(dpr);
  r.setSize(w, h, false);
}

function draw(s, t, w, h) {
  s.update(t);
  s.camera.aspect = w / h;
  s.camera.updateProjectionMatrix();
  R.renderer.render(s.scene, s.camera);
}

export async function poster(slug) {
  if (!posters.has(slug)) {
    posters.set(slug, (async () => {
      if (!renderer()) return '';
      const s = await scene(slug);
      if (s.ready) await s.ready;
      fit(800, 500);
      draw(s, s.poster, 800, 500);
      const url = R.renderer.domElement.toDataURL('image/jpeg', 0.86);
      if (active) { active.w = 0; frame(); } // put the playing loop's own frame back before the browser paints
      return url;
    })().catch((e) => { (globalThis.__l3dErrors ||= []).push('poster ' + slug + ': ' + (e && (e.stack || e.message))); return ''; }));
  }
  return posters.get(slug);
}

function stopActive() {
  if (!active) return;
  cancelAnimationFrame(active.raf);
  const cv = R && R.renderer.domElement;
  if (cv && cv.parentNode === active.host) cv.remove();
  active.host.classList.remove('l3d-live');
  active = null;
}

function frame() {
  const a = active;
  if (!a) return;
  const w = a.host.clientWidth, h = a.host.clientHeight;
  if (!w || !h) return;
  if (w !== a.w || h !== a.h) { a.w = w; a.h = h; fit(w, h, a.scale); }
  const t = ((performance.now() - a.t0) / 1000) % a.s.duration;
  draw(a.s, t, w, h);
}

function loop(now) {
  const a = active;
  if (!a) return;
  if (!a.host.isConnected) { stopActive(); return; }
  // Adaptive resolution: if the last 40 frames averaged over 22 ms, drop pixel density a step.
  if (a.last) {
    const dt = now - a.last;
    a.acc += dt; a.n += 1;
    if (a.n >= 40) {
      if (a.acc / a.n > 22 && a.scale > 0.6) { a.scale *= 0.85; a.w = 0; }
      a.acc = 0; a.n = 0;
    }
  }
  a.last = now;
  if (!document.hidden) frame();
  a.raf = requestAnimationFrame(loop);
}

export async function play(host, slug) {
  if (!renderer()) return false;
  const s = await scene(slug);
  if (s.ready) await s.ready;
  if (host.dataset.want !== 'play') return false;
  stopActive();
  host.appendChild(R.renderer.domElement);
  host.classList.add('l3d-live');
  active = { host, slug, s, t0: performance.now(), raf: 0, scale: 1, w: 0, h: 0, acc: 0, n: 0, last: 0 };
  frame();
  active.raf = requestAnimationFrame(loop);
  return true;
}

export function rest(host) {
  if (active && active.host === host) stopActive();
}
