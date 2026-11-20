// Lit loops: shared toolkit. Timing curves, materials, canvas textures, glow sprites and the phone prop
// that every lit loop builds from. Everything here is deterministic in t, so any frame can be drawn
// on demand (the poster frame, a scrubbed frame, a resumed loop) without replaying the timeline.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export { THREE };

// ---------------------------------------------------------------- timing
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const k = (t, a, b) => clamp((t - a) / (b - a));
export const lerp = (a, b, p) => a + (b - a) * p;
export const eo = (x) => 1 - Math.pow(1 - x, 3);
export const eo5 = (x) => 1 - Math.pow(1 - x, 5);
export const ei = (x) => x * x * x;
export const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
// Overshoot that settles: anticipation-free pop for things that land.
export const back = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2));
// Damped spring 0 -> 1 with one visible wobble: for drops, pins and impacts.
export const spring = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 - Math.exp(-6.5 * x) * Math.cos(11 * x));
export const rnd = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
export function kf(t, pts, ease = eio) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i], p = (pts[i][2] || ease)(k(t, t0, t1));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], p)) : lerp(v0, v1, p);
    }
  }
  return pts[pts.length - 1][1];
}
// Catmull-Rom through camera waypoints, so camera moves never stop dead between keys.
export function path(pts) {
  const c = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  return (p, out = new THREE.Vector3()) => c.getPoint(clamp(p), out);
}

// ---------------------------------------------------------------- textures
export function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas');
  cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  if (draw) draw(ctx, w, h);
  return { cv, ctx, tex, redraw(fn) { fn(ctx, w, h); tex.needsUpdate = true; } };
}
// Grainy surface: base color with speckle and soft blotches, for asphalt, concrete and counters.
export function grainTex(base, { size = 256, speck = 0.18, blot = 0.08, seed = 1, repeat = 1 } = {}) {
  const { tex } = canvasTex(size, size, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const g = c.createRadialGradient(0, 0, 0, 0, 0, 1);
      const v = rnd(i, seed) > 0.5 ? 255 : 0;
      g.addColorStop(0, `rgba(${v},${v},${v},${blot})`); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.save(); c.translate(rnd(i, seed + 1) * w, rnd(i, seed + 2) * h); c.scale(20 + rnd(i, seed + 3) * 60, 20 + rnd(i, seed + 4) * 60);
      c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore();
    }
    const n = size * size * 0.35;
    for (let i = 0; i < n; i++) {
      const v = rnd(i, seed + 9) > 0.5 ? 255 : 0;
      c.fillStyle = `rgba(${v},${v},${v},${rnd(i, seed + 7) * speck})`;
      c.fillRect(rnd(i, seed + 5) * w, rnd(i, seed + 6) * h, 1, 1);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}
const glowCache = new Map();
function glowTex(soft) {
  if (!glowCache.has(soft)) {
    glowCache.set(soft, canvasTex(128, 128, (c, w) => {
      const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(soft, 'rgba(255,255,255,0.35)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, w);
    }).tex);
  }
  return glowCache.get(soft);
}
// Additive light bloom without a post pass: cheap on phones, reads as lens glow.
export function glow(color, size = 1, opacity = 1, soft = 0.25) {
  const m = new THREE.SpriteMaterial({ map: glowTex(soft), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const s = new THREE.Sprite(m);
  s.scale.setScalar(size);
  return s;
}
export function label(text, { font = '700 64px Inter, system-ui, sans-serif', fg = '#fff', bg = null, pad = 28, h = 1, track = 2 } = {}) {
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const tw = Math.ceil(probe.measureText(text).width + track * text.length);
  const W = tw + pad * 2, H = 112;
  const { tex } = canvasTex(W, H, (c) => {
    if (bg) { c.fillStyle = bg; roundRect(c, 0, 0, W, H, 18); c.fill(); }
    c.font = font; c.fillStyle = fg; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = track + 'px';
    c.fillText(text, pad, H / 2 + 3);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry((W / H) * h, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
  return m;
}
export function roundRect(c, x, y, w, h, r) {
  c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r);
  c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath();
}

// ---------------------------------------------------------------- materials and props
export const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, ...o });
export function mesh(geo, material, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, material);
  m.castShadow = cast; m.receiveShadow = receive;
  return m;
}
// A modern phone: graphite frame, glass face, a glowing screen plane that takes any texture.
export function phone({ w = 0.74, h = 1.52, d = 0.075, frame = 0x2a2c31, notch = true, r = 0.09 } = {}) {
  const g = new THREE.Group();
  const body = mesh(new RoundedBoxGeometry(w, h, d, 4, r), std(frame, { metalness: 0.85, roughness: 0.32 }));
  g.add(body);
  const glass = mesh(new RoundedBoxGeometry(w - 0.02, h - 0.02, 0.006, 3, r - 0.01), std(0x050506, { roughness: 0.08, metalness: 0.2 }), { cast: false });
  glass.position.z = d / 2 - 0.001;
  g.add(glass);
  const sw = w - 0.07, sh = h - 0.07;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }));
  screen.position.z = d / 2 + 0.004;
  g.add(screen);
  // Rounded screen corners: a black mask frame drawn over the screen edges.
  // Mask and sheen canvases follow the screen's own aspect, so a landscape tablet keeps round corners.
  const MW = Math.round(512 * sw / Math.max(sw, sh)), MH = Math.round(512 * sh / Math.max(sw, sh));
  const mask = canvasTex(MW, MH, (c, W, H) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, W, H);
    c.globalCompositeOperation = 'destination-out'; roundRect(c, 0, 0, W, H, 34); c.fill();
    c.globalCompositeOperation = 'source-over';
    if (notch) { c.fillStyle = '#000'; roundRect(c, W / 2 - 34, 12, 68, 20, 10); c.fill(); }
  }).tex;
  const cover = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: mask, transparent: true, toneMapped: false, depthWrite: false }));
  cover.position.z = d / 2 + 0.005;
  g.add(cover);
  // Glass sheen: a soft diagonal highlight that slides as the phone turns.
  const sheen = canvasTex(MW, MH, (c, W, H) => {
    const gr = c.createLinearGradient(0, 0, W, H);
    gr.addColorStop(0.3, 'rgba(255,255,255,0)'); gr.addColorStop(0.42, 'rgba(255,255,255,0.13)');
    gr.addColorStop(0.47, 'rgba(255,255,255,0.03)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, W, H);
  }).tex;
  const sh2 = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ map: sheen, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sh2.position.z = d / 2 + 0.006;
  g.add(sh2);
  g.userData = { screen, sheen: sh2, sw, sh, d };
  return g;
}
// Full-frame fade card that rides on the camera: the dip to black at the loop seam.
export function dip(camera) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false, toneMapped: false }));
  m.position.z = -0.5; m.renderOrder = 999;
  camera.add(m);
  return (o) => { m.material.opacity = o; m.visible = o > 0.001; };
}

// Sky dome: a vertical gradient on a big inside-out sphere, so the horizon stays put as the camera moves.
// stops: [[0..1 from top to bottom, css color], ...]
export function skyDome(stops, radius = 40) {
  const { tex } = canvasTex(8, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    stops.forEach(([p, col]) => g.addColorStop(p, col));
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(radius, 32, 16), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false }));
  m.renderOrder = -1;
  return m;
}
// Wind sway for instanced foliage: bends each instance by its own world spot, driven by a time uniform
// the scene sets from t, so the field moves the same way on every frame of the loop.
export function sway(material, uT, amount = 0.07) {
  material.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.vertexShader = 'uniform float uT;\n' + sh.vertexShader.replace('#include <begin_vertex>', `#include <begin_vertex>
#ifdef USE_INSTANCING
  vec2 ip = instanceMatrix[3].xz;
  float swy = sin(uT * 1.6 + ip.x * 0.35 + ip.y * 0.22) * 0.5 + sin(uT * 2.7 + ip.y * 0.6) * 0.25;
  transformed.x += swy * ${amount.toFixed(3)} * position.y * position.y;
  transformed.z += swy * ${(amount * 0.4).toFixed(3)} * position.y;
#endif`);
  };
  return material;
}

// Render quality. Phones (coarse pointer or a small screen) keep the light 1.4 MP budget; desktops render
// at the screen's full pixel ratio up to about 4 MP, so people and edges stay sharp on retina displays.
export function lite() {
  if (typeof window === 'undefined') return true;
  const s = window.screen || {};
  return (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || Math.min(s.width || 1e4, s.height || 1e4) < 700;
}
export function pixelRatio(w, h, scale = 1, force = false) {
  const budget = lite() && !force ? 1.4e6 : 4.2e6;
  return Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(budget / Math.max(1, w * h))) * scale;
}
// Sharper, softer-edged shadows on desktop: double each shadow map (up to 4096) and widen the PCF blur a
// touch. Run once after a scene is built and before its first render.
export function hiShadows(scene, force = false) {
  if (lite() && !force) return;
  scene.traverse((o) => {
    if (!o.isLight || !o.castShadow || !o.shadow) return;
    const m = o.shadow.mapSize, n = Math.min(4096, Math.max(2048, m.x * 2));
    m.set(n, n);
    o.shadow.radius = Math.max(o.shadow.radius || 1, 2.5);
    if (o.shadow.map) { o.shadow.map.dispose(); o.shadow.map = null; }
  });
}
