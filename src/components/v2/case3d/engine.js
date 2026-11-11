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
export const tag = (S, txt, o = {}) => label(S, txt, { mono: true, weight: 700, bg: '#fff', ...o, size: (o.size || 0.26) * 1.45 });
export const face = (S, txt, o = {}) => label(S, txt, { billboard: false, ...o });

// ---------------------------------------------------------------- player
const CSS = `.c3d{position:relative;aspect-ratio:16/10;background:#F4F1EC;border-radius:12px;overflow:hidden;container-type:inline-size;font-family:Inter,system-ui,sans-serif;color:#111;user-select:none;-webkit-user-select:none}
.c3d canvas{position:absolute;inset:0;width:100%;height:100%;display:block}
.c3d-ui{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.c3d-act{position:absolute;left:3.75cqw;top:2.8cqw;display:flex;align-items:center;gap:1.4cqw;font:700 1.9cqw 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.02em}
.c3d-act b{display:grid;place-items:center;width:4cqw;height:3.75cqw;border-radius:.6cqw;background:#FF2B2B;font-size:2cqw}
.c3d-cap{position:absolute;left:0;right:0;bottom:5.4cqw;text-align:center;font-weight:700;font-size:2.5cqw;opacity:0;transform:translateY(1.2cqw);transition:opacity .35s,transform .45s cubic-bezier(.34,1.56,.64,1)}
.c3d-cap.on{opacity:1;transform:none}
.c3d-cap span{background:#fff;border:.25cqw solid #111;border-radius:99px;padding:.7cqw 2cqw;box-shadow:.5cqw .5cqw 0 #111}
.c3d-bar{position:absolute;left:3.75cqw;right:3.75cqw;bottom:2.2cqw;height:.6cqw;border-radius:9px;background:rgba(17,17,17,.12)}
.c3d-bar i{position:absolute;inset:0;background:#111;border-radius:9px;transform-origin:0 50%}
.c3d-card{position:absolute;inset:-1px;display:flex;flex-direction:column;justify-content:center;padding:0 7.5cqw;visibility:hidden;will-change:transform}
.c3d-card>*{opacity:0;transform:translateY(4cqw);transition:opacity .3s,transform .5s cubic-bezier(.34,1.56,.64,1)}
.c3d-card.on>*{opacity:1;transform:none}
.c3d-card.on>*:nth-child(2){transition-delay:.07s}.c3d-card.on>*:nth-child(3){transition-delay:.14s}.c3d-card.on>*:nth-child(4){transition-delay:.21s}
.c3d-title{background:#FF2B2B}.c3d-title>*{opacity:1;transform:none;transition:none}
.c3d-wipe{background:#FF2B2B}.c3d-result{background:#111;color:#fff}
.c3d-k{font:700 2.2cqw 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.04em;text-transform:uppercase;margin:0 0 2.6cqw}
.c3d-h{font-weight:800;font-size:6.6cqw;line-height:1.08;letter-spacing:-.02em;margin:0;max-width:74cqw}
.c3d-pill{align-self:flex-start;margin-top:3.6cqw;background:#111;color:#fff;border-radius:99px;padding:.9cqw 2.4cqw;font:700 1.8cqw 'JetBrains Mono',ui-monospace,monospace}
.c3d-n{font-weight:800;font-size:21cqw;line-height:.9;letter-spacing:-.04em}
.c3d-rule{width:12cqw;height:.9cqw;background:#111;margin:2.4cqw 0 2cqw}
.c3d-l{font:700 2.7cqw 'JetBrains Mono',ui-monospace,monospace}
.c3d-result .c3d-k{color:#FF2B2B}.c3d-result .c3d-h{font-size:5.3cqw;max-width:80cqw}.c3d-result .c3d-pill{background:none;color:#B5AFA6;padding:0}`;

export function webglOK() {
  try { const c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); } catch (e) { return false; }
}

export function createPlayer(el, scenes) {
  if (!document.getElementById('c3d-css')) { const s = document.createElement('style'); s.id = 'c3d-css'; s.textContent = CSS; document.head.appendChild(s); }
  el.classList.add('c3d');
  el.innerHTML = `<canvas></canvas><div class="c3d-ui"><div class="c3d-act"><b></b><span></span></div><div class="c3d-cap"><span></span></div>
<div class="c3d-card c3d-wipe"><div class="c3d-n"></div><div class="c3d-rule"></div><div class="c3d-l"></div></div>
<div class="c3d-card c3d-result"><p class="c3d-k">Result</p><h3 class="c3d-h"></h3><div class="c3d-pill"></div></div>
<div class="c3d-card c3d-title"><p class="c3d-k"></p><h3 class="c3d-h"></h3><div class="c3d-pill">CASE STUDY</div></div>
<div class="c3d-bar"><i></i></div></div>`;
  const q = (s) => el.querySelector(s);
  const ui = { act: q('.c3d-act'), cap: q('.c3d-cap'), wipe: q('.c3d-wipe'), result: q('.c3d-result'), title: q('.c3d-title'), bar: q('.c3d-bar i') };
  const renderer = new THREE.WebGLRenderer({ canvas: q('canvas'), antialias: true, powerPreference: 'high-performance' });
  renderer.setClearColor(C.paper); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene(); scene.fog = new THREE.Fog(C.paper, 26, 60);
  const camera = new THREE.PerspectiveCamera(35, 1.6, 0.1, 200);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe4ddd2, 2.7));
  const sun = new THREE.DirectionalLight(0xffffff, 1.9); sun.position.set(7, 14, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 50 }); sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.03;
  scene.add(sun); scene.add(sun.target);
  // ground: drifting dot grid plus a shadow catcher
  const dots = document.createElement('canvas'); dots.width = dots.height = 64;
  const dc = dots.getContext('2d'); dc.fillStyle = '#F4F1EC'; dc.fillRect(0, 0, 64, 64); dc.fillStyle = '#C9C3B9'; dc.beginPath(); dc.arc(32, 32, 4.5, 0, 7); dc.fill();
  const dotTex = new THREE.CanvasTexture(dots); dotTex.wrapS = dotTex.wrapT = THREE.RepeatWrapping; dotTex.repeat.set(160, 160); dotTex.colorSpace = THREE.SRGBColorSpace; dotTex.anisotropy = 8;
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.MeshBasicMaterial({ map: dotTex })); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01; scene.add(ground);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(160, 160), new THREE.ShadowMaterial({ opacity: 0.26 })); shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true; scene.add(shadow);
  const root = new THREE.Group(); scene.add(root);

  let S = null, def = null, update = null, raf = 0, t0 = performance.now(), visible = true, frozen = null, wipeAct = -1;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => { const r = el.getBoundingClientRect(); pointer.tx = ((e.clientX - r.left) / r.width - 0.5) * 2; pointer.ty = ((e.clientY - r.top) / r.height - 0.5) * 2; };
  el.addEventListener('pointermove', onMove); el.addEventListener('pointerleave', () => { pointer.tx = pointer.ty = 0; });

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
  function load(slug) {
    clear(); def = scenes[slug]; if (!def) return;
    S = { tex: new Map(), billboards: [], groups: [], fx: [], caps: [], root, camera, cam: null,
      group(a, b) { const g = new THREE.Group(); root.add(g); S.groups.push([g, a, b]); return g; },
      act(i) { return S.group(def.acts[i][0], i + 1 < def.acts.length ? def.acts[i + 1][0] : D + 1); },
      caption(text, a, b) { S.caps.push([text, a, b]); },
      burst(p, time, n = 16, color = C.red) {
        const m = inst(new THREE.BoxGeometry(0.13, 0.13, 0.13), n, color); m.castShadow = false; root.add(m);
        S.fx.push((t) => {
          const dt = t - time; m.visible = dt > 0 && dt < 1.1; if (!m.visible) return;
          for (let i = 0; i < n; i++) {
            const a = rnd(i, time) * Math.PI * 2, b = rnd(i, time + 1) * 1.2 + 0.3, sp = 2.4 + rnd(i, time + 2) * 2.6;
            dummy.position.set(p[0] + Math.cos(a) * Math.cos(b) * sp * dt, p[1] + Math.sin(b) * sp * dt - 3.2 * dt * dt, p[2] + Math.sin(a) * Math.cos(b) * sp * dt);
            dummy.rotation.set(dt * 6 + i, dt * 5, i); dummy.scale.setScalar(1 - dt / 1.1); dummy.updateMatrix(); m.setMatrixAt(i, dummy.matrix);
          }
          m.instanceMatrix.needsUpdate = true;
        });
      } };
    update = def.build(S);
    ui.title.querySelector('.c3d-k').textContent = def.client; ui.title.querySelector('.c3d-h').textContent = def.title;
    ui.result.querySelector('.c3d-h').textContent = def.result; ui.result.querySelector('.c3d-pill').textContent = def.client.toUpperCase();
    wipeAct = -1; t0 = performance.now(); resize();
  }

  const X = (n, x) => { if (x === null) { n.style.visibility = 'hidden'; } else { n.style.visibility = 'visible'; n.style.transform = `translateX(${x}%)`; } };
  function drawUI(t) {
    X(ui.title, t < 1.1 ? 0 : t < 1.42 ? eio((t - 1.1) / 0.32) * 101 : null);
    let w = null, wi = -1;
    def.acts.forEach(([a], i) => { if (i && t >= a - 0.52 && t < a + 0.67) { wi = i; w = t < a - 0.2 ? -101 + 101 * eio(k(t, a - 0.52, a - 0.2)) : t < a + 0.35 ? 0 : 101 * eio(k(t, a + 0.35, a + 0.67)); } });
    if (wi > 0 && wi !== wipeAct) { wipeAct = wi; ui.wipe.querySelector('.c3d-n').textContent = '0' + (wi + 1); ui.wipe.querySelector('.c3d-l').textContent = def.acts[wi][1]; }
    X(ui.wipe, w); ui.wipe.classList.toggle('on', wi > 0 && t > def.acts[wi][0] - 0.3);
    X(ui.result, t >= 28.95 ? -101 + 101 * eio(k(t, 28.95, 29.27)) : null); ui.result.classList.toggle('on', t > 29.15);
    let ai = 0; def.acts.forEach(([a], i) => { if (t >= a) ai = i; });
    if (ui.act.dataset.i !== String(ai) + def.title) { ui.act.dataset.i = String(ai) + def.title; ui.act.firstChild.textContent = ai + 1; ui.act.lastChild.textContent = def.acts[ai][1]; }
    const cap = S.caps.find(([, a, b]) => t >= a && t < b);
    if (cap && ui.cap.firstChild.textContent !== cap[0]) ui.cap.firstChild.textContent = cap[0];
    ui.cap.classList.toggle('on', !!cap);
    ui.bar.style.transform = `scaleX(${t / D})`;
  }
  const v1 = new THREE.Vector3(), q1 = new THREE.Quaternion();
  function frame(t) {
    if (!def) return;
    for (const [g, a, b] of S.groups) g.visible = t >= a && t < b;
    S.cam = null; update(t);
    const pose = S.cam || [kf(t, def.cam.map(([tt, p]) => [tt, p])), kf(t, def.cam.map(([tt, , g]) => [tt, g]))];
    pointer.x += (pointer.tx - pointer.x) * 0.06; pointer.y += (pointer.ty - pointer.y) * 0.06;
    camera.position.set(pose[0][0] + Math.sin(t * 0.5) * 0.12 + pointer.x * 0.9, pose[0][1] + Math.cos(t * 0.37) * 0.08 - pointer.y * 0.5, pose[0][2]);
    camera.lookAt(v1.set(pose[1][0], pose[1][1], pose[1][2]));
    sun.position.set(pose[1][0] + 7, 14, pose[1][2] + 9); sun.target.position.set(pose[1][0], 0, pose[1][2]);
    dotTex.offset.set(t * 0.004, t * 0.004);
    for (const b of S.billboards) { if (b.parent) { b.parent.getWorldQuaternion(q1); b.quaternion.copy(q1.invert()).multiply(camera.quaternion); } }
    for (const f of S.fx) f(t);
    drawUI(t); renderer.render(scene, camera);
  }
  function tick(now) {
    raf = requestAnimationFrame(tick);
    if (frozen !== null || !visible || document.hidden) return;
    frame(((now - t0) / 1000) % D);
  }
  raf = requestAnimationFrame(tick);
  return {
    load, seek(t) { frozen = t; frame(t); }, play() { frozen = null; t0 = performance.now(); },
    destroy() { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clear(); renderer.dispose(); el.innerHTML = ''; },
  };
}
