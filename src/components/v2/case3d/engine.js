// Case study 3D player: one WebGL stage, a 30 second timeline per scene, DOM title / act / result cards on top.
import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import VEH from './veh.json';

export { THREE };
export const D = 30;
export const C = { paper: 0xf4f1ec, ink: 0x111111, mid: 0x6b655e, dim: 0xb5afa6, raised: 0xe9e4da, white: 0xffffff, red: 0xff2b2b };

// ---------------------------------------------------------------- timing
export const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
export const k = (t, a, b) => clamp((t - a) / (b - a));
export const eo = (x) => 1 - Math.pow(1 - x, 3);
export const eio = (x) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
export const back = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : 1 + 2.70158 * Math.pow(x - 1, 3) + 1.70158 * Math.pow(x - 1, 2));
export const lerp = (a, b, p) => a + (b - a) * p;
export const rnd = (i, s = 0) => { const x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); };
export function kf(t, pts, ease = eio) {
  if (t <= pts[0][0]) return pts[0][1];
  for (let i = 1; i < pts.length; i++) {
    if (t <= pts[i][0]) {
      const [t0, v0] = pts[i - 1], [t1, v1] = pts[i], p = ease(k(t, t0, t1));
      return Array.isArray(v0) ? v0.map((x, j) => lerp(x, v1[j], p)) : lerp(v0, v1, p);
    }
  }
  return pts[pts.length - 1][1];
}
export const pop = (o, t, a, d = 0.5, s = 1) => { const p = back(k(t, a, a + d)) * s; o.visible = p > 0.001; o.scale.setScalar(Math.max(p, 0.001)); return o; };
export const show = (o, t, a, b = 1e9) => { o.visible = t >= a && t < b; return o; };
export const at = (o, x, y, z, parent) => { o.position.set(x, y, z); if (parent) parent.add(o); return o; };
export const P = (o, v) => { o.position.set(v[0], v[1], v[2]); return o; };

// ---------------------------------------------------------------- materials and primitives
const mats = new Map();
export function mat(color, o) {
  const key = color + (o ? JSON.stringify(o) : '');
  if (!mats.has(key)) mats.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...o }));
  return mats.get(key);
}
export const own = (color, o) => new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0, ...o });
const hullMat = new THREE.MeshBasicMaterial({ color: C.ink, side: THREE.BackSide });
const E = 0.035;
function solid(geo, color, hullGeo, o = {}) {
  const m = new THREE.Mesh(geo, o.material || mat(color));
  m.castShadow = true; m.receiveShadow = true;
  if (hullGeo && color !== C.ink && o.edge !== false) m.add(new THREE.Mesh(hullGeo, hullMat));
  return m;
}
export const box = (w, h, d, color = C.white, o = {}) => solid(new THREE.BoxGeometry(w, h, d), color, new THREE.BoxGeometry(w + 2 * E, h + 2 * E, d + 2 * E), o);
export const cyl = (r, h, color = C.white, o = {}) => solid(new THREE.CylinderGeometry(o.top ?? r, r, h, o.seg || 28), color, new THREE.CylinderGeometry((o.top ?? r) + E, r + E, h + 2 * E, o.seg || 28), o);
export const sphere = (r, color = C.white, o = {}) => solid(new THREE.SphereGeometry(r, 24, 16), color, new THREE.SphereGeometry(r + E, 24, 16), o);
export const torus = (r, tube, color = C.red) => solid(new THREE.TorusGeometry(r, tube, 10, 40), color, null);
export function extrude(pts, depth, color, o = {}) {
  const sh = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  const m = solid(g, color, null, o);
  if (color !== C.ink && o.edge !== false) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 20), new THREE.LineBasicMaterial({ color: C.ink })));
  return m;
}
export const prism = (w, h, d, color = C.ink, o) => extrude([[-w / 2, 0], [w / 2, 0], [0, h]], d, color, o);

export function pawn(color = C.white, s = 1, ringed = false) {
  const g = new THREE.Group();
  at(cyl(0.38, 0.95, color, { top: 0.15 }), 0, 0.475, 0, g);
  at(sphere(0.27, color), 0, 1.16, 0, g);
  if (ringed) { const r = at(torus(0.62, 0.06), 0, 0.06, 0, g); r.rotation.x = Math.PI / 2; }
  g.scale.setScalar(s);
  const w = new THREE.Group(); w.add(g); return w;
}
export function bot(s = 1, color = C.white) {
  const g = new THREE.Group();
  at(box(1, 0.8, 0.8, color), 0, 0.75, 0, g);
  at(sphere(0.09, C.ink), -0.22, 0.8, 0.41, g); at(sphere(0.09, C.ink), 0.22, 0.8, 0.41, g);
  at(box(0.06, 0.3, 0.06, C.ink), 0, 1.3, 0, g); at(sphere(0.11, C.red), 0, 1.5, 0, g);
  at(box(0.5, 0.3, 0.5, C.ink), 0, 0.17, 0, g);
  g.scale.setScalar(s);
  const w = new THREE.Group(); w.add(g); return w;
}
export function house(s = 1, color = C.white) {
  const g = new THREE.Group();
  at(box(2.2, 1.4, 1.8, color), 0, 0.7, 0, g);
  at(prism(2.6, 1, 2, C.ink), 0, 1.4, 0, g);
  at(box(0.5, 0.8, 0.06, C.ink), 0, 0.4, 0.9, g);
  at(box(0.4, 0.4, 0.06, C.dim), 0.7, 0.85, 0.9, g); at(box(0.4, 0.4, 0.06, C.dim), -0.7, 0.85, 0.9, g);
  g.scale.setScalar(s);
  const w = new THREE.Group(); w.add(g); return w;
}
export function key3d(color = C.red) {
  const g = new THREE.Group();
  g.add(torus(0.3, 0.1, color));
  at(box(1, 0.14, 0.14, color, { edge: false }), 0.85, 0, 0, g);
  at(box(0.12, 0.3, 0.14, color, { edge: false }), 1.05, -0.18, 0, g); at(box(0.12, 0.22, 0.14, color, { edge: false }), 1.28, -0.15, 0, g);
  const w = new THREE.Group(); w.add(g); return w;
}
const SHIELD = (() => { const s = new THREE.Shape(); s.moveTo(0, 16); s.lineTo(13, 11); s.lineTo(13, 0); s.quadraticCurveTo(13, -11, 0, -17); s.quadraticCurveTo(-13, -11, -13, 0); s.lineTo(-13, 11); s.closePath(); return s; })();
export function shield(color = C.white, depth = 0.3) {
  const g = new THREE.ExtrudeGeometry(SHIELD, { depth: depth * 12, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -depth * 6); g.scale(1 / 12, 1 / 12, 1 / 12);
  const m = solid(g, color, null);
  if (color !== C.ink) m.add(new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), new THREE.LineBasicMaterial({ color: C.ink })));
  return m;
}
function badge(color, marks) {
  const g = new THREE.Group();
  const d = cyl(0.3, 0.08, color); d.rotation.x = Math.PI / 2; g.add(d);
  for (const [x, y, len, ang] of marks) { const b = at(box(len, 0.07, 0.03, color === C.ink ? C.white : C.ink, { edge: false }), x, y, 0.06, g); b.rotation.z = ang; b.castShadow = false; }
  const w = new THREE.Group(); w.add(g); return w;
}
export const check = () => badge(C.red, [[-0.1, -0.05, 0.16, -0.8], [0.05, 0.01, 0.32, 0.9]]);
export const cross = () => badge(C.ink, [[0, 0, 0.3, 0.785], [0, 0, 0.3, -0.785]]);
export function cursor3d() {
  const m = extrude([[0, 0], [0, -1.3], [0.35, -0.98], [0.6, -1.5], [0.8, -1.4], [0.56, -0.9], [1, -0.9]], 0.08, C.white);
  m.scale.setScalar(0.55); const w = new THREE.Group(); w.add(m); return w;
}

let shapesCache = {}, edgeCache = {};
export function car(kind = 'SUV', color = C.ink) {
  if (!shapesCache[kind]) {
    const data = new SVGLoader().parse(`<svg xmlns="http://www.w3.org/2000/svg"><path d="${VEH[kind]}"/></svg>`);
    const g = new THREE.ExtrudeGeometry(SVGLoader.createShapes(data.paths[0]), { depth: 46, bevelEnabled: false, curveSegments: 8 });
    g.translate(-112, -143, -23); g.scale(1 / 30, -1 / 30, 1 / 30);
    shapesCache[kind] = g;
  }
  const g = new THREE.Group();
  const body = new THREE.Mesh(shapesCache[kind], own(color, { side: THREE.DoubleSide }));
  body.castShadow = true; g.add(body); g.body = body;
  body.add(new THREE.LineSegments(edgeCache[kind] || (edgeCache[kind] = new THREE.EdgesGeometry(shapesCache[kind], 25)), new THREE.LineBasicMaterial({ color: color === C.ink ? 0x8a847b : C.ink })));
  for (const x of [80, 146]) for (const z of [-0.72, 0.72]) {
    const w = at(cyl(0.37, 0.26, C.white), (x - 112) / 30, 0.37, z, g); w.rotation.x = Math.PI / 2;
    const hub = at(cyl(0.12, 0.28, C.ink), (x - 112) / 30, 0.37, z, g); hub.rotation.x = Math.PI / 2;
  }
  const w = new THREE.Group(); w.add(g); w.body = body; return w;
}

export function tube(points, color = C.red, r = 0.06, curve = null) {
  const c = curve || new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'catmullrom', 0.05);
  const seg = 80, rad = 8;
  const m = new THREE.Mesh(new THREE.TubeGeometry(c, seg, r, rad, false), mat(color));
  m.curve = c;
  m.reveal = (p) => { m.geometry.setDrawRange(0, Math.round(clamp(p) * seg) * rad * 6); m.visible = p > 0; };
  m.point = (p) => c.getPoint(clamp(p));
  return m;
}
export const arc = (a, b, h, color, r) => tube(null, color, r, new THREE.QuadraticBezierCurve3(new THREE.Vector3(...a), new THREE.Vector3((a[0] + b[0]) / 2, Math.max(a[1], b[1]) + h, (a[2] + b[2]) / 2), new THREE.Vector3(...b)));
export function inst(geo, n, color = C.white) {
  const m = new THREE.InstancedMesh(geo, mat(color), n);
  m.castShadow = true; m.frustumCulled = false; return m;
}
export const dummy = new THREE.Object3D();

// ---------------------------------------------------------------- text
const SANS = 'Inter, "Helvetica Neue", Arial, sans-serif', MONO = '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace';
function textTexture(txt, o) {
  const px = 96, font = `${o.weight || 800} ${px}px ${o.mono ? MONO : SANS}`;
  const cv = document.createElement('canvas'), c = cv.getContext('2d');
  c.font = font;
  const pad = o.bg ? 44 : 8, w = Math.ceil(c.measureText(txt).width) + pad * 2, h = o.bg ? 168 : 128;
  cv.width = w; cv.height = h;
  if (o.bg) {
    c.fillStyle = o.bg; c.strokeStyle = '#111'; c.lineWidth = 8;
    c.beginPath(); c.roundRect(4, 4, w - 8, h - 8, o.round ?? 40); c.fill(); c.stroke();
  }
  c.font = font; c.fillStyle = o.color || '#111'; c.textBaseline = 'middle'; c.textAlign = 'center';
  c.fillText(txt, w / 2, h / 2 + 6);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.aspect = w / h; tex.hRatio = h / 128;
  return tex;
}
export function label(S, txt, o = {}) {
  const size = o.size || 0.4;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, fog: false }));
  m.renderOrder = 5;
  const g = new THREE.Group(); g.add(m);
  g.set = (s) => {
    if (g.txt === s) return g; g.txt = s;
    const key = s + '|' + JSON.stringify(o);
    if (!S.tex.has(key)) S.tex.set(key, textTexture(s, o));
    const tex = S.tex.get(key);
    m.material.map = tex; m.material.needsUpdate = true;
    const hh = size * tex.hRatio; m.scale.set(hh * tex.aspect, hh, 1);
    m.position.x = o.align === 'left' ? (hh * tex.aspect) / 2 : 0;
    return g;
  };
  g.set(txt);
  if (o.billboard !== false) S.billboards.push(g);
  return g;
}
export const tag = (S, txt, o = {}) => {
  if (o.size && o.size <= 0.22) { const g = new THREE.Group(); g.set = () => g; return g; } // below the legibility floor: cut it
  return label(S, txt, { mono: true, weight: 700, bg: '#fff', ...o, size: (o.size || 0.26) * 1.6 });
};
export const face = (S, txt, o = {}) => label(S, txt, { billboard: false, ...o });

// ---------------------------------------------------------------- player
const CSS = `.c3d{position:relative;aspect-ratio:16/10;background:#F4F1EC;border-radius:12px;overflow:hidden;container-type:inline-size;font-family:Inter,system-ui,sans-serif;color:#111;user-select:none;-webkit-user-select:none}
.c3d.ink{color:#fff}
.c3d-low,.c3d-pin{text-shadow:0 0 .6em rgba(244,241,236,.9),0 0 .2em rgba(244,241,236,.9)}
.c3d.ink .c3d-low,.c3d.ink .c3d-pin{text-shadow:0 0 .6em rgba(0,0,0,.9),0 0 .2em rgba(0,0,0,.9)}
.c3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.c3d-ui{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.c3d-ui:before{content:"";position:absolute;inset:0;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(0,0,0,.13))}
.c3d-pin{position:absolute;left:3.75cqw;top:3.2cqw;right:18cqw;opacity:0;transition:opacity .4s}
.c3d-pin.on{opacity:1}
.c3d-pin small{display:block;font:700 max(10px,2cqw) 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.06em;text-transform:uppercase;opacity:.62;margin-bottom:.7cqw}
.c3d-pin b{display:block;font-weight:700;font-size:max(12px,3.3cqw);line-height:1.15;letter-spacing:-.01em}
.c3d-low{position:absolute;left:3.75cqw;right:6cqw;bottom:7.2cqw}
.c3d-rise{overflow:hidden;padding-bottom:.08em}
.c3d-rise>*{display:block;transform:translateY(112%);transition:transform .4s cubic-bezier(.2,.8,.2,1)}
.on>.c3d-rise>*,.c3d-rise.on>*{transform:none}
.c3d-rise:nth-child(2)>*{transition-delay:.08s}
.c3d-q{font-weight:800;font-size:9.6cqw;line-height:1;letter-spacing:-.04em;max-width:82cqw;text-wrap:balance}
.c3d-big{font-weight:800;font-size:17cqw;line-height:.92;letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.c3d-big.line{font-size:8cqw;line-height:1;max-width:84cqw}
.c3d-unit{font:700 max(12px,3.1cqw) 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.05em;text-transform:uppercase;margin-top:1.2cqw}
.c3d-capt{font-weight:800;font-size:max(15px,5.2cqw);line-height:1.08;letter-spacing:-.02em;max-width:72cqw;text-wrap:balance}
.c3d-layer{position:absolute;left:0;right:0;bottom:0}
.c3d-ans{position:absolute;inset:-1px;background:#111;color:#fff;display:flex;flex-direction:column;justify-content:center;padding:0 7.5cqw;visibility:hidden}
.c3d-ans small{font:700 max(11px,2.6cqw) 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.04em;color:#B5AFA6;margin-bottom:2.6cqw}
.c3d-ans h3{font-weight:800;font-size:6.2cqw;line-height:1.06;letter-spacing:-.025em;margin:0;max-width:82cqw;text-wrap:balance}
.c3d-ans i{display:block;width:10cqw;height:.9cqw;background:#FF2B2B;margin:0 0 3cqw}
.c3d-ans em{font:700 max(10px,2cqw) 'JetBrains Mono',ui-monospace,monospace;font-style:normal;letter-spacing:.06em;text-transform:uppercase;color:#B5AFA6;margin-top:3.4cqw}
.c3d-bar{position:absolute;left:3.75cqw;right:3.75cqw;bottom:2.4cqw;height:max(2px,.5cqw);border-radius:9px;background:currentColor;opacity:.16}
.c3d-fill{position:absolute;left:3.75cqw;right:3.75cqw;bottom:2.4cqw;height:max(2px,.5cqw);border-radius:9px;background:currentColor;transform-origin:0 50%}
.c3d-pause{position:absolute;right:max(6px,1.6cqw);top:max(6px,1.6cqw);width:44px;height:44px;border:0;background:none;color:inherit;cursor:pointer;pointer-events:auto;display:grid;place-items:center;border-radius:50%}
.c3d-pause:focus-visible{outline:2px solid #FF2B2B;outline-offset:-4px}
.c3d-pause:before{content:"";width:12px;height:14px;border-left:4px solid currentColor;border-right:4px solid currentColor;box-sizing:border-box}
.c3d-pause[aria-pressed=true]:before{width:0;height:0;border:8px solid transparent;border-left:13px solid currentColor;border-right:0}
.c3d.ended{color:#fff}`;

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}
export const ANSWER_AT = 25.6;
const SETS = { paper: { bg: C.paper, fog: [17, 50], hemi: 2.3, sun: 2.4, shadow: 0.3 }, ink: { bg: 0x0d0d0d, fog: [11, 36], hemi: 1.25, sun: 2.7, shadow: 0 } };

export function createPlayer(el, scenes) {
  if (!document.getElementById('c3d-css')) { const s = document.createElement('style'); s.id = 'c3d-css'; s.textContent = CSS; document.head.appendChild(s); }
  el.classList.add('c3d'); el.setAttribute('role', 'img');
  el.innerHTML = `<canvas aria-hidden="true"></canvas><div class="c3d-ui">
<div class="c3d-pin"><small></small><b></b></div>
<div class="c3d-low"><div class="c3d-layer c3d-lq"><div class="c3d-rise"><span class="c3d-q"></span></div></div>
<div class="c3d-layer c3d-lh"><div class="c3d-rise"><span class="c3d-big"></span></div><div class="c3d-rise"><span class="c3d-unit"></span></div></div>
<div class="c3d-layer c3d-lc"><div class="c3d-rise"><span class="c3d-capt"></span></div></div></div>
<div class="c3d-ans"><small></small><i></i><h3></h3><em></em></div>
<div class="c3d-bar"></div><div class="c3d-fill"></div><button class="c3d-pause" type="button" aria-label="Pause animation" aria-pressed="false"></button></div>`;
  const q = (s) => el.querySelector(s);
  const ui = { pin: q('.c3d-pin'), lq: q('.c3d-lq'), lh: q('.c3d-lh'), lc: q('.c3d-lc'), q: q('.c3d-q'), big: q('.c3d-big'), unit: q('.c3d-unit'), capt: q('.c3d-capt'), ans: q('.c3d-ans'), fill: q('.c3d-fill'), pause: q('.c3d-pause') };
  const touch = window.matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ canvas: q('canvas'), antialias: true, powerPreference: 'high-performance' });
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = touch ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(C.paper, 17, 50);
  const camera = new THREE.PerspectiveCamera(35, 1.6, 0.1, 200);
  const hemi = new THREE.HemisphereLight(0xffffff, 0xe4ddd2, 2.3); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffffff, 2.4); sun.castShadow = true;
  const sm = touch ? 1024 : 2048; sun.shadow.mapSize.set(sm, sm); Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 60 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03; sun.shadow.radius = 2;
  scene.add(sun); scene.add(sun.target);
  const dotTex = (bg, fg) => { const d = document.createElement('canvas'); d.width = d.height = 64; const c = d.getContext('2d'); c.fillStyle = bg; c.fillRect(0, 0, 64, 64); c.fillStyle = fg; c.beginPath(); c.arc(32, 32, 4.5, 0, 7); c.fill(); const t = new THREE.CanvasTexture(d); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(160, 160); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
  const tex = { paper: dotTex('#F4F1EC', '#C9C3B9'), ink: dotTex('#0d0d0d', '#2a2927') };
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ map: tex.paper })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; scene.add(ground);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.3 })); shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true; scene.add(shadow);
  const root = new THREE.Group(); scene.add(root);

  let S = null, def = null, update = null, raf = 0, clock = 0, last = performance.now(), visible = true, frozen = null, paused = false, curSet = '', camKeys = null, gen = 0;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  el.addEventListener('pointermove', (e) => { const r = el.getBoundingClientRect(); pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; });
  el.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; });
  ui.pause.addEventListener('click', () => { paused = !paused; ui.pause.setAttribute('aria-pressed', String(paused)); ui.pause.setAttribute('aria-label', paused ? 'Play animation' : 'Pause animation'); });

  function resize() {
    const w = el.clientWidth, h = el.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize); ro.observe(el);
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0.05 }); io.observe(el);

  function clear() {
    root.traverse((o) => { if (o.geometry && !Object.values(shapesCache).includes(o.geometry) && !Object.values(edgeCache).includes(o.geometry)) o.geometry.dispose(); if (o.isInstancedMesh) o.dispose(); });
    root.clear(); if (S) S.tex.forEach((x) => x.dispose());
  }
  function setSet(name) {
    if (name === curSet) return; curSet = name; const s = SETS[name];
    renderer.setClearColor(s.bg); scene.fog.color.set(s.bg); scene.fog.near = s.fog[0]; scene.fog.far = s.fog[1];
    ground.material.map = tex[name]; ground.material.needsUpdate = true; shadow.material.opacity = s.shadow; hemi.intensity = s.hemi; sun.intensity = s.sun;
    el.classList.toggle('ink', name === 'ink');
  }
  async function load(slug) {
    const mine = ++gen; clear(); def = null; if (!scenes[slug]) return;
    try { if (document.fonts) await Promise.race([Promise.all([document.fonts.load('800 96px Inter'), document.fonts.load('700 96px "JetBrains Mono"')]), new Promise((r) => setTimeout(r, 900))]); } catch (e) { /* use fallback fonts */ }
    if (mine !== gen) return;
    def = scenes[slug];
    const lastAct = def.acts[def.acts.length - 1][0];
    S = { tex: new Map(), billboards: [], groups: [], fx: [], caps: [], heroes: [], kicks: [], root, camera, cam: null,
      group(a, b) { const g = new THREE.Group(); root.add(g); S.groups.push([g, a, b]); return g; },
      act(i) { return S.group(def.acts[i][0], i + 1 < def.acts.length ? def.acts[i + 1][0] : D + 1); },
      caption(text, a, b) { S.caps.push([text, a, b]); },
      hero(big, unit, a, b) { S.heroes.push([big, unit, a, b]); },
      // Red is held for the payoff: bursts only fire in the last act.
      burst(p, time, n = 14, color = C.red) {
        if (time < lastAct) return;
        S.kicks.push(time);
        const m = inst(new THREE.BoxGeometry(0.26, 0.26, 0.26), n, color); m.castShadow = false; root.add(m);
        S.fx.push((t) => {
          const dt = t - time; m.visible = dt > 0 && dt < 1.2; if (!m.visible) return;
          for (let i = 0; i < n; i++) {
            const a = rnd(i, time) * Math.PI * 2, b = rnd(i, time + 1) * 1.2 + 0.3, sp = 3 + rnd(i, time + 2) * 3.4;
            dummy.position.set(p[0] + Math.cos(a) * Math.cos(b) * sp * dt, p[1] + Math.sin(b) * sp * dt - 3.6 * dt * dt, p[2] + Math.sin(a) * Math.cos(b) * sp * dt);
            dummy.rotation.set(dt * 6 + i, dt * 5, i); dummy.scale.setScalar(1 - dt / 1.2); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
          }
          m.instanceMatrix.needsUpdate = true;
        });
      } };
    update = def.build(S);
    // Keyframes less than half a second apart are a cut, not a move.
    camKeys = def.cam.map((kk) => kk.slice());
    for (let i = 0; i + 1 < camKeys.length; i++) if (camKeys[i + 1][0] - camKeys[i][0] <= 0.45) camKeys[i][0] = camKeys[i + 1][0] - 0.001;
    ui.pin.firstElementChild.textContent = def.client; ui.pin.lastElementChild.textContent = def.question; ui.q.textContent = def.question;
    ui.ans.querySelector('small').textContent = def.question; ui.ans.querySelector('h3').textContent = def.result; ui.ans.querySelector('em').textContent = def.client;
    el.setAttribute('aria-label', `${def.client}. ${def.question} ${def.result}`);
    curSet = ''; clock = 0; last = performance.now(); resize();
  }

  const setLayer = (n, on) => { if (n.classList.contains('on') !== on) n.classList.toggle('on', on); };
  function drawUI(t, ts) {
    const open = t < 3.3, ended = t >= ANSWER_AT;
    setLayer(ui.lq, open && t > 0.12); setLayer(ui.pin, !open && !ended);
    const h = !open && !ended && S.heroes.find(([, , a, b]) => ts >= a && ts < b);
    if (h) { if (ui.big.textContent !== h[0]) { ui.big.textContent = h[0]; ui.big.classList.toggle('line', h[0].length > 7); } if (ui.unit.textContent !== h[1]) ui.unit.textContent = h[1]; }
    setLayer(ui.lh, !!h);
    const cap = !open && !ended && !h && S.caps.find(([, a, b]) => ts >= a && ts < b);
    if (cap && ui.capt.textContent !== cap[0]) ui.capt.textContent = cap[0];
    setLayer(ui.lc, !!cap);
    ui.ans.style.visibility = ended ? 'visible' : 'hidden'; el.classList.toggle('ended', ended);
    ui.fill.style.transform = `scaleX(${t / D})`;
  }
  const v1 = new THREE.Vector3(), q1 = new THREE.Quaternion();
  function frame(t) {
    if (!def) return;
    const real = t; t = real * (def.warp ?? 1.14); // legacy scenes were timed to 30 s; compress them so they finish before the answer card
    let ai = 0; def.acts.forEach(([a], i) => { if (t >= a) ai = i; });
    setSet((def.sets && def.sets[ai]) || 'paper');
    for (const [g, a, b] of S.groups) g.visible = t >= a && t < b;
    S.cam = null; update(t);
    const pose = S.cam || [kf(t, camKeys.map(([tt, p]) => [tt, p])), kf(t, camKeys.map(([tt, , g]) => [tt, g]))];
    const fov = kf(t, camKeys.map(([tt, , , f]) => [tt, f || 35]));
    if (Math.abs(camera.fov - fov) > 0.01) { camera.fov = fov; camera.updateProjectionMatrix(); }
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    let kick = 0; for (const kt of S.kicks) { const d = t - kt; if (d > 0 && d < 0.25) kick = Math.max(kick, (1 - d / 0.25)); }
    camera.position.set(pose[0][0] + Math.sin(t * 0.5) * 0.12 + pointer.x * 0.9 + Math.sin(t * 90) * 0.07 * kick, pose[0][1] + Math.cos(t * 0.37) * 0.08 - pointer.y * 0.5 + Math.cos(t * 70) * 0.07 * kick, pose[0][2]);
    camera.lookAt(v1.set(pose[1][0], pose[1][1], pose[1][2]));
    sun.position.set(pose[1][0] + 9, 10, pose[1][2] + 7); sun.target.position.set(pose[1][0], 0, pose[1][2]);
    tex.paper.offset.set(t * 0.004, t * 0.004);
    for (const b of S.billboards) { if (b.parent) { b.parent.getWorldQuaternion(q1); b.quaternion.copy(q1.invert()).multiply(camera.quaternion); } }
    for (const f of S.fx) f(t);
    drawUI(real, t); renderer.render(scene, camera);
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    if (frozen !== null || !visible || document.hidden || paused) return;
    clock = (clock + dt) % D; frame(clock);
  }
  raf = requestAnimationFrame(tick);
  return {
    load, seek(t) { frozen = t; frame(t); }, play() { frozen = null; last = performance.now(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clear(); renderer.dispose(); el.innerHTML = ''; },
  };
}
