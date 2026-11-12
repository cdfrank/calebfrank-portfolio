// Work transition: DOOANE sprays a "this way" tag and a left arrow onto the paper sheet.
// One Three.js scene in CSS pixels. Paint, overspray, drips and mist are point clouds whose
// shaders reveal each point at its own birth time, so a frame only moves DOOANE and one clock.
import * as THREE from 'three';

const ART = '/dooane/spray-can.webp';
const AR = 550 / 900;          // the art's width / height
const NOZ = [0.115, 0.36];     // the can's nozzle inside the art, from its top left
const RED = [1, 0.169, 0.169]; // #FF2B2B
const T0 = 0.38;               // DOOANE is up; spraying starts
const DUR = 1.35;              // seconds to sweep the tag, left to right
const WORD = 'this way';

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const rnd = (a, b) => a + Math.random() * (b - a);

const PAINT_V = `
attribute float aBirth; attribute float aSize; attribute float aAlpha;
uniform float uTime; uniform float uDpr; varying float vA;
void main(){
  vA = aAlpha * smoothstep(aBirth, aBirth + 0.07, uTime);
  gl_PointSize = aSize * uDpr;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}`;
const MIST_V = `
attribute float aBirth; attribute vec2 aVel;
uniform float uTime; uniform float uDpr; varying float vA;
void main(){
  float age = (uTime - aBirth) / 0.24;
  float on = step(0.0, age) * step(age, 1.0);
  vA = 0.3 * (1.0 - age) * on;
  gl_PointSize = mix(5.0, 26.0, age) * uDpr * on;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position.xy + aVel * (uTime - aBirth), 0.0, 1.0);
}`;
const DOT_F = `
uniform vec3 uColor; varying float vA;
void main(){
  float d = length(gl_PointCoord - 0.5) * 2.0;
  float a = vA * (1.0 - smoothstep(0.35, 1.0, d));
  if (a < 0.004) discard;
  gl_FragColor = vec4(uColor, a);
}`;

function points(attrs, vertexShader, uniforms) {
  const g = new THREE.BufferGeometry();
  for (const [name, [arr, n]] of Object.entries(attrs)) g.setAttribute(name, new THREE.Float32BufferAttribute(arr, n));
  const m = new THREE.ShaderMaterial({ vertexShader, fragmentShader: DOT_F, uniforms, transparent: true, depthTest: false, depthWrite: false });
  const p = new THREE.Points(g, m);
  p.frustumCulled = false;
  return p;
}

function loadArt() {
  return new Promise((ok, no) => new THREE.TextureLoader().load(ART, ok, undefined, no));
}

// Lay the scene out for this viewport and draw the tag once, as a mask, to sample paint from.
function layout(W, H) {
  const gh = Math.min(H * 0.6, (W * 0.42) / AR, 560), gw = gh * AR;
  const gap = Math.max(26, gw * 0.14);          // nozzle to paint
  const x0 = Math.max(16, W * 0.07);
  const x1 = W - gw * (1 - NOZ[0]) - gap - 8;   // the tag ends where DOOANE still fits on screen
  const tw = x1 - x0;
  const cy = H - gh * (1 - NOZ[1]);             // nozzle height with his feet on the floor

  const c = document.createElement('canvas'); c.width = Math.ceil(W); c.height = Math.ceil(H);
  const x = c.getContext('2d', { willReadFrequently: true });
  let fs = Math.min(H * 0.24, 220);
  x.font = `400 ${fs}px "Permanent Marker", cursive`;
  fs *= Math.min(1, tw / x.measureText(WORD).width);
  x.font = `400 ${fs}px "Permanent Marker", cursive`;
  const wordW = x.measureText(WORD).width;
  x.fillStyle = x.strokeStyle = '#000'; x.lineCap = x.lineJoin = 'round';
  x.translate(x0 + tw / 2, cy); x.rotate(-0.05);
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(WORD, 0, -fs * 0.3);
  // the arrow under it: head on the left, where the sheet is about to go
  const ay = fs * 0.48, l = -wordW / 2, r = wordW / 2, hd = fs * 0.3;
  x.lineWidth = fs * 0.105;
  x.beginPath(); x.moveTo(r, ay - fs * 0.05); x.bezierCurveTo(r * 0.3, ay + fs * 0.12, l * 0.4, ay - fs * 0.1, l + 4, ay + fs * 0.03); x.stroke();
  x.beginPath(); x.moveTo(l + hd, ay - hd * 0.72); x.lineTo(l, ay + fs * 0.03); x.lineTo(l + hd * 1.05, ay + hd * 0.8); x.stroke();
  return { gw, gh, gap, x0, tw, cy, fs, mask: x.getImageData(0, 0, c.width, c.height) };
}

function build(W, H, L) {
  const { data, width, height } = L.mask;
  let step = 3;
  const birthAt = (px) => T0 + clamp((px - L.x0) / L.tw, 0, 1) * DUR;
  const pos = [], birth = [], size = [], alpha = [];
  const low = new Map(); // lowest painted pixel per column bucket, for drips
  const add = (px, py, b, s, a) => { pos.push(px, py, 0); birth.push(b); size.push(s); alpha.push(a); };
  const dot = L.fs * 0.075 + 5;
  const sample = () => {
    for (let y = 0; y < height; y += step) for (let x = (y / step) % 2 ? step / 2 : 0; x < width; x += step) {
      if (data[((y | 0) * width + (x | 0)) * 4 + 3] < 128) continue;
      const b = birthAt(x) + rnd(-0.03, 0.05);
      add(x + rnd(-1, 1), y + rnd(-1, 1), b, dot * rnd(0.8, 1.25), rnd(0.55, 0.9));
      if (Math.random() < 0.09) { // overspray: a fine halo around the letters
        const a = rnd(0, 6.283), d = rnd(0.4, 1) * L.fs * 0.2;
        add(x + Math.cos(a) * d, y + Math.sin(a) * d, b + 0.02, rnd(1.5, 4.5), rnd(0.25, 0.6));
      }
      const k = Math.round(x / 12);
      if (!low.has(k) || low.get(k)[1] < y) low.set(k, [x, y]);
    }
  };
  sample();
  if (birth.length > 30000) { step = 4; pos.length = birth.length = size.length = alpha.length = 0; low.clear(); sample(); }

  // drips: a few fat runs off the bottom of the paint, still creeping when the sheet leaves
  const cols = [...low.values()].sort(() => Math.random() - 0.5).slice(0, 7);
  for (const [dx, dy] of cols) {
    const len = rnd(0.25, 0.9) * L.fs * 0.55, n = Math.ceil(len / 1.4), b0 = birthAt(dx) + 0.12, w = dot * rnd(0.42, 0.6);
    for (let j = 0; j <= n; j++) add(dx + Math.sin(j * 0.07) * 0.8, dy + j * 1.4, b0 + Math.pow(j / n, 1.6) * rnd(1.3, 1.7), j === n ? w * 1.35 : w, 0.9);
  }

  // mist: fired from the nozzle toward the wall while he sprays
  const nozzle = (t) => {
    const u = clamp((t - T0) / DUR, 0, 1);
    return [L.x0 + L.tw * u + L.gap, L.cy + Math.sin(u * Math.PI * 7) * L.fs * 0.1];
  };
  const mp = [], mb = [], mv = [];
  for (let i = 0; i < 520; i++) {
    const t = rnd(T0, T0 + DUR), [nx, ny] = nozzle(t), sp = rnd(1.2, 3.2) * L.gap * 4;
    const a = rnd(-0.85, 0.85);
    mp.push(nx, ny, 0); mb.push(t); mv.push(-Math.cos(a) * sp, Math.sin(a) * sp * 1.6);
  }
  return { paint: { position: [pos, 3], aBirth: [birth, 1], aSize: [size, 1], aAlpha: [alpha, 1] }, mist: { position: [mp, 3], aBirth: [mb, 1], aVel: [mv, 2] }, nozzle };
}

// Resolves once the art, the font and the scene are ready and the first frame is queued.
export async function play(host) {
  const W = innerWidth, H = innerHeight, dpr = Math.min(devicePixelRatio || 1, 2);
  const [tex] = await Promise.all([loadArt(), document.fonts.load('400 80px "Permanent Marker"', WORD).catch(() => {})]);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(dpr); renderer.setSize(W, H, false);
  const el = renderer.domElement; el.className = 'tx-gl';
  const cam = new THREE.OrthographicCamera(0, W, 0, H, -10, 10); // y runs down, like the page
  const scene = new THREE.Scene();

  const L = layout(W, H), B = build(W, H, L);
  const uTime = { value: 0 }, uDpr = { value: dpr }, uColor = { value: new THREE.Vector3(...RED) };
  const paint = points(B.paint, PAINT_V, { uTime, uDpr, uColor });
  const mist = points(B.mist, MIST_V, { uTime, uDpr, uColor });
  tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
  const guy = new THREE.Mesh(new THREE.PlaneGeometry(L.gw, L.gh), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, depthTest: false }));
  guy.geometry.translate(L.gw * (0.5 - NOZ[0]), L.gh * (0.5 - NOZ[1]), 0); // pivot on the nozzle
  paint.renderOrder = 0; mist.renderOrder = 1; guy.renderOrder = 2;
  scene.add(paint, mist, guy);

  let raf = 0, t0 = 0, dead = false;
  const frame = (now) => {
    if (dead) return;
    if (!t0) t0 = now;
    const t = (now - t0) / 1000;
    uTime.value = t;
    const [nx, ny] = B.nozzle(t);
    const up = clamp(t / 0.32, 0, 1), pop = 1 - Math.pow(1 - up, 3) * (1 + 2.2 * up); // back-out ease
    const going = t > T0 && t < T0 + DUR;
    const done = clamp((t - T0 - DUR) / 0.25, 0, 1);
    guy.position.set(nx + (going ? Math.sin(t * 46) * 1.2 : 0), ny + (1 - pop) * L.gh * 1.1 - Math.sin(done * Math.PI) * 14 + (done === 1 ? Math.sin((t - T0 - DUR) * 5.5) * 4 : 0), 0);
    guy.rotation.z = going ? -0.05 + Math.sin(t * 9) * 0.025 : -0.05 * (1 - done);
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  };
  host.appendChild(el);
  raf = requestAnimationFrame(frame);
  return {
    stop() {
      if (dead) return;
      dead = true; cancelAnimationFrame(raf);
      el.remove(); tex.dispose();
      for (const o of [paint, mist, guy]) { o.geometry.dispose(); o.material.dispose(); }
      renderer.dispose(); renderer.forceContextLoss?.();
    },
  };
}
