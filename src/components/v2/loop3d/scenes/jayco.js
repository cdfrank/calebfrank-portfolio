// Jayco product experience proposal lit loop, 10 s. "From the campsite to the dealer, in one quick prototype."
// Blue hour in a pine clearing. A travel trailer sits on a gravel pad, porch lights and a campfire going.
// Product detail: hotspots ring its awning, door and front window. Configurator: the roof cuts away like a
// dollhouse and the floorplan rebuilds itself three ways. Dealer locator: a map spreads out over the ground,
// dealer pins drop and a route draws to the nearest one. Quick prototype: a phone rises into frame with the
// whole proposal on its screen.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, phone, dip, skyDome, sway,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const AMBER = '#f0a646', TEAL = '#4fd1d9', INK = '#0d1118';
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const L = 2.3, H = 0.95, W = 0.92, LIFT = 0.3;  // trailer body length, height, width, floor height
const CUT_OPEN = LIFT + 0.47;                     // world height of the dollhouse cut
const PINS = [[2.0, -1.2, 0xf0a646], [-1.6, 1.5, 0x4fd1d9], [-1.6, -1.35, 0x4fd1d9]]; // nearest dealer first
const DROP = [6.0, 6.2, 6.38];
const LAYOUT_AT = [3.95, 4.65];                   // floorplan 1 -> 2 -> 3

// Interior modules: height and color. Layouts give [x, z, sx, sz] inside the body (front of trailer is +x).
const MODS = [
  { h: 0.14, c: 0x2c6a6f },  // bed
  { h: 0.2, c: 0xb9ae98 },   // pillows
  { h: 0.3, c: 0x2a2c31 },   // kitchen counter
  { h: 0.16, c: 0xa04a33 },  // sofa / dinette
  { h: 0.2, c: 0x8a6a4a },   // table
  { h: 0.38, c: 0x6f767e },  // bath
  { h: 0.38, c: 0x8c7a62 },  // partition
  { h: 0.38, c: 0x8c7a62 },  // partition
];
const LAYOUTS = [
  [[0.72, 0, 0.62, 0.72], [0.98, 0, 0.1, 0.62], [-0.08, -0.31, 0.78, 0.16], [-0.08, 0.3, 0.6, 0.18], [-0.08, 0.06, 0.3, 0.2], [-0.82, -0.18, 0.46, 0.42], [0.38, -0.14, 0.03, 0.52], [-0.58, 0.14, 0.03, 0.34]],
  [[-0.72, 0, 0.62, 0.72], [-0.98, 0, 0.1, 0.62], [0.66, -0.31, 0.78, 0.16], [0.76, 0.3, 0.54, 0.18], [0.24, 0.1, 0.26, 0.22], [-0.02, -0.22, 0.4, 0.36], [-0.38, -0.14, 0.03, 0.52], [0.21, -0.22, 0.03, 0.36]],
  [[0.74, 0, 0.6, 0.72], [1.0, 0, 0.1, 0.62], [-0.22, 0.31, 0.7, 0.16], [-0.86, 0, 0.3, 0.72], [-0.55, 0, 0.24, 0.32], [0.2, -0.22, 0.36, 0.36], [0.42, 0.13, 0.03, 0.5], [-0.32, -0.3, 0.03, 0.2]],
];

function bodyGeo() {
  const s = new THREE.Shape(), x0 = -L / 2, x1 = L / 2;
  s.moveTo(x0 + 0.08, 0);
  s.lineTo(x1 - 0.12, 0);
  s.quadraticCurveTo(x1, 0, x1, 0.12);
  s.lineTo(x1, H - 0.36);
  s.quadraticCurveTo(x1, H, x1 - 0.36, H);   // the rounded aero nose
  s.lineTo(x0 + 0.08, H);
  s.quadraticCurveTo(x0, H, x0, H - 0.08);
  s.lineTo(x0, 0.08);
  s.quadraticCurveTo(x0, 0, x0 + 0.08, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.025, bevelSegments: 4, curveSegments: 18 });
  g.translate(0, 0, -W / 2);
  return g;
}

function pineGeo() {
  const tiers = [[1, 0.62, 0.31], [0.74, 0.5, 0.62], [0.46, 0.42, 0.88]].map(([r, h, y]) => {
    const c = new THREE.ConeGeometry(r, h, 7); c.translate(0, y, 0); return c;
  });
  const trunk = new THREE.CylinderGeometry(0.08, 0.1, 0.25, 6); trunk.translate(0, 0.02, 0);
  return mergeGeometries([...tiers, trunk]);
}

// A rounded chip with an amber dot and a word: the beat captions, all taken from the project summary.
function chip(text, dots = 0) {
  const HH = 150, font = `700 58px ${SANS}`;
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const tw = probe.measureText(text).width;
  const w = Math.ceil(100 + tw + 46 + (dots ? 26 + dots * 42 : 0));
  const ct = canvasTex(w, HH);
  const draw = (active = -1) => ct.redraw((c) => {
    c.clearRect(0, 0, w, HH);
    c.fillStyle = 'rgba(9,13,22,0.8)'; roundRect(c, 4, 4, w - 8, HH - 8, (HH - 8) / 2); c.fill();
    c.strokeStyle = 'rgba(240,166,70,0.6)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = AMBER; c.beginPath(); c.arc(62, HH / 2, 14, 0, 7); c.fill();
    c.fillStyle = '#f4efe6'; c.font = font; c.textBaseline = 'middle'; c.fillText(text, 96, HH / 2 + 3);
    for (let i = 0; i < dots; i++) {
      const x = 96 + tw + 46 + i * 42;
      c.fillStyle = i === active ? AMBER : 'rgba(244,239,230,0.28)';
      c.beginPath(); c.arc(x, HH / 2, i === active ? 13 : 10, 0, 7); c.fill();
    }
  });
  draw(0);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w / HH, 1), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, depthWrite: false, opacity: 0, fog: false }));
  m.renderOrder = 5;
  return { m, draw };
}

// The ground map for the dealer locator: roads, a lake and contour rings, drawn in world units.
function mapTex() {
  const S = 1024, U = S / 6.4, P = (x) => (x + 3.2) * U;
  return canvasTex(S, S, (c) => {
    c.clearRect(0, 0, S, S);
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let r = 0; r < 9; r++) {
      c.strokeStyle = `rgba(79,209,217,${0.07 + (r % 3 === 0 ? 0.06 : 0)})`; c.lineWidth = 2;
      c.beginPath();
      for (let a = 0; a <= 64; a++) {
        const th = (a / 64) * Math.PI * 2, rr = (0.45 + r * 0.32 + Math.sin(th * 3 + r) * 0.08 + Math.sin(th * 5 - r * 2) * 0.05) * U;
        const x = S / 2 + 0.9 * U + Math.cos(th) * rr, y = S / 2 - 1.1 * U + Math.sin(th) * rr * 0.8;
        a ? c.lineTo(x, y) : c.moveTo(x, y);
      }
      c.stroke();
    }
    c.fillStyle = 'rgba(60,140,210,0.28)';
    c.beginPath(); c.ellipse(P(-2.2), P(0.1), 0.62 * U, 0.38 * U, 0.4, 0, 7); c.fill();
    c.strokeStyle = 'rgba(120,190,240,0.55)'; c.lineWidth = 3; c.stroke();
    const road = (pts, wdt, a) => { c.strokeStyle = `rgba(79,209,217,${a})`; c.lineWidth = wdt; c.beginPath(); pts.forEach(([x, z], i) => (i ? c.lineTo(P(x), P(z)) : c.moveTo(P(x), P(z)))); c.stroke(); };
    road([[-3.2, 1.5], [3.2, 1.5]], 11, 0.85);
    road([[2.0, -3.2], [2.0, 3.2]], 11, 0.85);
    road([[-1.6, -3.2], [-1.6, 3.2]], 9, 0.7);
    road([[-3.2, -1.35], [3.2, -1.35]], 6, 0.45);
    road([[-0.25, 0.75], [-0.25, 1.5]], 5, 0.5);
    road([[-3.2, -2.4], [-1.0, -2.0], [0.4, -2.6], [2.0, -2.2], [3.2, -2.5]], 4, 0.35);
    road([[0.4, 3.2], [0.6, 2.2], [1.2, 1.5]], 4, 0.35);
    road([[-3.2, 0.6], [-2.6, 0.75], [-1.6, 0.6]], 4, 0.35);
    // You are here.
    c.strokeStyle = 'rgba(240,166,70,0.7)'; c.lineWidth = 4; c.setLineDash([14, 12]);
    c.beginPath(); c.arc(P(0.15), P(0), 1.5 * U, 0, 7); c.stroke(); c.setLineDash([]);
    // Fade the disc out at its edge, so it reads as light thrown on the ground.
    c.globalCompositeOperation = 'destination-in';
    const g = c.createRadialGradient(S / 2, S / 2, S * 0.3, S / 2, S / 2, S * 0.5);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, S, S);
    c.globalCompositeOperation = 'source-over';
  }).tex;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x161d2e, 9, 26);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 70);
  scene.add(camera);
  const setDip = dip(camera);
  const uT = { value: 0 };

  // ----------------------------------------------------------- sky, stars, forest, ground
  scene.add(skyDome([[0, '#05070f'], [0.3, '#101932'], [0.44, '#2c3358'], [0.49, '#7a5a6a'], [0.51, '#b8745a'], [0.53, '#1d2130'], [1, '#07080b']], 34));
  const SN = 260, spos = new Float32Array(SN * 3);
  for (let i = 0; i < SN; i++) {
    const th = rnd(i, 21) * Math.PI * 2, el = 0.12 + Math.pow(rnd(i, 22), 0.7) * 1.3;
    spos[i * 3] = Math.cos(th) * Math.cos(el) * 31; spos[i * 3 + 1] = Math.sin(el) * 31; spos[i * 3 + 2] = Math.sin(th) * Math.cos(el) * 31;
  }
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const stars = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xcfd8ff, size: 0.09, transparent: true, opacity: 0.8, fog: false, depthWrite: false, toneMapped: false }));
  scene.add(stars);
  const moon = glow(0xc8d4ff, 3.2, 0.7, 0.2); moon.position.set(-14, 17, -20); moon.material.fog = false; scene.add(moon);
  const horizon = glow(0xd0805a, 26, 0.32, 0.5); horizon.position.set(6, 0.8, -28); horizon.scale.set(40, 5, 1); horizon.material.fog = false; scene.add(horizon);

  const forest = mesh(new THREE.PlaneGeometry(60, 60), std(0xffffff, { map: grainTex('#1b1f18', { size: 256, speck: 0.12, blot: 0.12, seed: 5, repeat: 14 }), roughness: 1 }), { cast: false });
  forest.rotation.x = -Math.PI / 2; scene.add(forest);
  const pad = mesh(new THREE.CircleGeometry(2.7, 64), std(0xffffff, { map: grainTex('#3a3732', { size: 256, speck: 0.25, blot: 0.1, seed: 9, repeat: 6 }), roughness: 0.95 }), { cast: false });
  pad.rotation.x = -Math.PI / 2; pad.position.y = 0.003; scene.add(pad);

  const trees = [];
  for (let i = 0; i < 420 && trees.length < 170; i++) {
    const a = rnd(i, 31) * Math.PI * 2, r = 4.4 + Math.pow(rnd(i, 32), 0.8) * 9;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    if (z > 0.8 && x > -3.5 && r < 11) continue;      // keep the camera's side of the clearing open
    if (z > 2.5 && r < 7) continue;
    trees.push([x, z, 2.2 + rnd(i, 33) * 2.6, 0.7 + rnd(i, 34) * 0.4]);
  }
  const forestM = sway(std(0x15241c, { roughness: 0.9 }), uT, 0.025);
  const pines = new THREE.InstancedMesh(pineGeo(), forestM, trees.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler();
  trees.forEach(([x, z, h, r], i) => { q4.setFromEuler(e4.set(0, rnd(i, 35) * 6, 0)); m4.compose(p4.set(x, 0, z), q4, s4.set(r * h * 0.32, h, r * h * 0.32)); pines.setMatrixAt(i, m4); });
  pines.castShadow = true; pines.receiveShadow = false;
  scene.add(pines);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x3a4a7a, 0x0b0c0f, 0.42));
  const moonL = new THREE.DirectionalLight(0xa8bcff, 1.5);
  moonL.position.set(-3.2, 5.5, 2.6); moonL.target.position.set(0.2, 0, 0);
  moonL.castShadow = true; moonL.shadow.mapSize.set(2048, 2048);
  Object.assign(moonL.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 1, far: 14 });
  moonL.shadow.bias = -0.0004; moonL.shadow.normalBias = 0.02;
  scene.add(moonL, moonL.target);
  const rim = new THREE.DirectionalLight(0xff9c6e, 1.1); rim.position.set(2.5, 1.4, -4); scene.add(rim);
  const FIRE = new THREE.Vector3(-1.75, 0, 1.45);
  const fireL = new THREE.PointLight(0xff7a2e, 4, 0, 2); fireL.position.set(FIRE.x, 0.38, FIRE.z); scene.add(fireL);
  const cabinL = new THREE.PointLight(0xffb86a, 0.5, 3.2, 2); cabinL.position.set(0, LIFT + 0.85, 0); scene.add(cabinL);

  // ----------------------------------------------------------- campfire
  const stones = new THREE.InstancedMesh(new THREE.DodecahedronGeometry(0.06, 0), std(0x55524c, { roughness: 0.9 }), 10);
  for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2; q4.setFromEuler(e4.set(rnd(i, 41) * 3, rnd(i, 42) * 3, 0)); m4.compose(p4.set(FIRE.x + Math.cos(a) * 0.24, 0.035, FIRE.z + Math.sin(a) * 0.24), q4, s4.set(1, 0.75, 1)); stones.setMatrixAt(i, m4); }
  stones.castShadow = true; stones.receiveShadow = true; scene.add(stones);
  const logs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.035, 0.36, 8), std(0x3a2618, { roughness: 0.9, emissive: 0xff5a10, emissiveIntensity: 0.15 }), 3);
  for (let i = 0; i < 3; i++) { q4.setFromEuler(e4.set(Math.PI / 2 - 0.5, (i / 3) * Math.PI * 2, 0, 'YXZ')); m4.compose(p4.set(FIRE.x, 0.08, FIRE.z), q4, s4.set(1, 1, 1)); logs.setMatrixAt(i, m4); }
  scene.add(logs);
  const flames = [[0xff6a1a, 0.55], [0xffa040, 0.38], [0xffe2a0, 0.2]].map(([c, s]) => { const g = glow(c, s, 0.9, 0.3); g.position.set(FIRE.x, 0.16, FIRE.z); scene.add(g); return g; });
  const fireGlow = glow(0xff7a2e, 2.2, 0.25, 0.5); fireGlow.position.set(FIRE.x, 0.1, FIRE.z); scene.add(fireGlow);
  const EN = 40, epos = new Float32Array(EN * 3);
  const eGeo = new THREE.BufferGeometry(); eGeo.setAttribute('position', new THREE.BufferAttribute(epos, 3));
  const embers = new THREE.Points(eGeo, new THREE.PointsMaterial({ color: 0xffa040, size: 0.022, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  embers.frustumCulled = false; scene.add(embers);

  // ----------------------------------------------------------- the travel trailer
  const cut = new THREE.Plane(new THREE.Vector3(0, -1, 0), 50);
  const clip = { clippingPlanes: [cut], clipShadows: true };
  const trailer = new THREE.Group(); scene.add(trailer);
  const shell = new THREE.Group(); shell.position.y = LIFT; trailer.add(shell);
  const geo = bodyGeo();
  const skin = std(0xb4b9bf, { metalness: 0.55, roughness: 0.34, side: THREE.DoubleSide, envMapIntensity: 1.1, ...clip });
  const body = mesh(geo, skin); shell.add(body);
  const inner = mesh(geo, std(0x6e5f4c, { roughness: 0.85, side: THREE.BackSide, ...clip }), { cast: false });
  inner.scale.set(0.975, 0.955, 0.93); inner.position.y = 0.012; shell.add(inner);
  const SZ = W / 2 + 0.027;
  // Side graphic: a teal swoosh with an amber pinstripe (generic, not a brand mark).
  const decal = canvasTex(1024, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#1f5d64'; c.beginPath(); c.moveTo(0, h * 0.62); c.bezierCurveTo(w * 0.45, h * 0.62, w * 0.7, h * 0.58, w, h * 0.12); c.lineTo(w, h * 0.34); c.bezierCurveTo(w * 0.72, h * 0.78, w * 0.45, h * 0.82, 0, h * 0.82); c.closePath(); c.fill();
    c.strokeStyle = AMBER; c.lineWidth = 6; c.beginPath(); c.moveTo(0, h * 0.9); c.bezierCurveTo(w * 0.45, h * 0.9, w * 0.74, h * 0.86, w, h * 0.44); c.stroke();
  });
  const decalM = std(0xffffff, { map: decal.tex, transparent: true, roughness: 0.4, metalness: 0.2, ...clip });
  [1, -1].forEach((sd) => { const d = new THREE.Mesh(new THREE.PlaneGeometry(L - 0.12, 0.42), decalM); d.position.set(0, 0.26, sd * SZ); if (sd < 0) { d.rotation.y = Math.PI; d.scale.x = -1; } d.receiveShadow = true; shell.add(d); });
  const winM = std(0x1d140c, { emissive: 0xffa24a, emissiveIntensity: 0.85, roughness: 0.12, metalness: 0.1, ...clip });
  const frameM = std(0x2a2c31, { roughness: 0.45, metalness: 0.6, ...clip });
  const WINS = [[-0.8, 0.6, 0.38, 0.24, 1], [0.35, 0.6, 0.5, 0.26, 1], [0.86, 0.58, 0.26, 0.22, 1], [-0.55, 0.6, 0.42, 0.24, -1], [0.45, 0.6, 0.42, 0.24, -1]];
  const winGlows = [];
  WINS.forEach(([x, y, w, h, sd]) => {
    const f = new THREE.Mesh(new THREE.PlaneGeometry(w + 0.04, h + 0.04), frameM); f.position.set(x, y, sd * SZ); if (sd < 0) f.rotation.y = Math.PI; shell.add(f);
    const g = new THREE.Mesh(new THREE.PlaneGeometry(w, h), winM); g.position.set(x, y, sd * (SZ + 0.002)); if (sd < 0) g.rotation.y = Math.PI; shell.add(g);
    if (sd > 0) { const gl = glow(0xffa24a, w * 2.2, 0.28, 0.5); gl.position.set(x, LIFT + y, SZ + 0.12); gl.scale.set(w * 2.6, h * 2.8, 1); scene.add(gl); winGlows.push(gl); }
  });
  const nose = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7, 0.2), winM); nose.position.set(L / 2 + 0.027, 0.5, 0); nose.rotation.y = Math.PI / 2; shell.add(nose);
  const noseF = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.7 + 0.04, 0.24), frameM); noseF.position.set(L / 2 + 0.026, 0.5, 0); noseF.rotation.y = Math.PI / 2; shell.add(noseF);
  // Door with its own small window, porch light above.
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.7), std(0x8d9298, { roughness: 0.4, metalness: 0.5, ...clip })); door.position.set(-0.25, 0.42, SZ + 0.001); door.receiveShadow = true; shell.add(door);
  const dWin = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.2), winM); dWin.position.set(-0.25, 0.6, SZ + 0.003); shell.add(dWin);
  const handle = mesh(new THREE.BoxGeometry(0.02, 0.06, 0.02), std(0x222428, { metalness: 0.8, roughness: 0.3, ...clip })); handle.position.set(-0.14, 0.4, SZ + 0.01); shell.add(handle);
  const porch = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.04, 0.03), new THREE.MeshBasicMaterial({ color: 0xffd28a, toneMapped: false, ...clip })); porch.position.set(-0.25, 0.83, SZ + 0.015); shell.add(porch);
  const porchGlow = glow(0xffc070, 0.7, 0.6, 0.35); porchGlow.position.set(-0.25, LIFT + 0.82, SZ + 0.06); scene.add(porchGlow);
  // Awning: striped canvas on two arms, string lights along its edge.
  const stripes = canvasTex(512, 128, (c, w, h) => { for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#b9ad94' : '#1f5d64'; c.fillRect(i * w / 16, 0, w / 16, h); } c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(0, h - 14, w, 14); }).tex;
  const awn = mesh(new THREE.BoxGeometry(1.6, 0.012, 0.44), std(0xffffff, { map: stripes, roughness: 0.85, side: THREE.DoubleSide, ...clip }));
  awn.rotation.x = 0.28; awn.position.set(-0.2, 0.85, W / 2 + 0.24); shell.add(awn);
  const armM = std(0x9aa0a8, { metalness: 0.9, roughness: 0.3, ...clip });
  [-0.95, 0.55].forEach((x) => { const a = mesh(new THREE.BoxGeometry(0.016, 0.8, 0.016), armM); a.rotation.x = 0.553; a.position.set(x, 0.43, W / 2 + 0.22); shell.add(a); });
  const BN = 13;
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffc77a, toneMapped: false, ...clip }), BN);
  for (let i = 0; i < BN; i++) { const u = i / (BN - 1); m4.makeTranslation(lerp(-0.98, 0.58, u), 0.76 - Math.sin(Math.PI * ((u * 4) % 1)) * 0.035, W / 2 + 0.46); bulbs.setMatrixAt(i, m4); }
  shell.add(bulbs);
  const bulbGlow = glow(0xffb860, 1, 0.35, 0.5); bulbGlow.position.set(-0.2, LIFT + 0.74, W / 2 + 0.5); bulbGlow.scale.set(2.0, 0.32, 1); scene.add(bulbGlow);
  // Chassis, tandem axle, A-frame tongue, propane tanks, entry steps.
  const dark = std(0x18191c, { roughness: 0.7, metalness: 0.4 });
  const rail = mesh(new THREE.BoxGeometry(L - 0.2, 0.07, W - 0.14), dark); rail.position.set(0, LIFT - 0.02, 0); trailer.add(rail);
  const tires = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.11, 28), std(0x111214, { roughness: 0.9 }), 4);
  const hubs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.085, 0.085, 0.116, 20), std(0xaeb3ba, { metalness: 1, roughness: 0.3 }), 4);
  [[-0.17, 1], [-0.17, -1], [0.19, 1], [0.19, -1]].forEach(([x, sd], i) => { q4.setFromEuler(e4.set(Math.PI / 2, 0, 0)); m4.compose(p4.set(x, 0.16, sd * (W / 2 - 0.05)), q4, s4.set(1, 1, 1)); tires.setMatrixAt(i, m4); hubs.setMatrixAt(i, m4); });
  tires.castShadow = true; hubs.castShadow = true; trailer.add(tires, hubs);
  const fender = mesh(new THREE.BoxGeometry(0.72, 0.02, W + 0.02), std(0x2a2c31, { metalness: 0.6, roughness: 0.4 })); fender.position.set(0.01, LIFT + 0.005, 0); trailer.add(fender);
  [1, -1].forEach((sd) => { const a = mesh(new THREE.BoxGeometry(0.66, 0.05, 0.05), dark); a.position.set(L / 2 + 0.28, 0.27, sd * 0.15); a.rotation.y = sd * 0.43; trailer.add(a); });
  const coupler = mesh(new THREE.BoxGeometry(0.12, 0.06, 0.08), dark); coupler.position.set(L / 2 + 0.6, 0.27, 0); trailer.add(coupler);
  const jack = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.28, 10), std(0x8e939a, { metalness: 0.9, roughness: 0.35 })); jack.position.set(L / 2 + 0.42, 0.14, 0); trailer.add(jack);
  const tankM = std(0xa9adb2, { metalness: 0.3, roughness: 0.45 });
  [-0.11, 0.11].forEach((z) => { const tk = mesh(new THREE.CapsuleGeometry(0.075, 0.14, 6, 16), tankM); tk.position.set(L / 2 + 0.22, 0.44, z); trailer.add(tk); });
  [[0.18, 0.12], [0.08, 0.22]].forEach(([y, z]) => { const st = mesh(new THREE.BoxGeometry(0.34, 0.025, 0.12), std(0x3a3d43, { metalness: 0.7, roughness: 0.5 })); st.position.set(-0.25, y, W / 2 + z); trailer.add(st); });

  // ----------------------------------------------------------- the interior (seen when the roof cuts away)
  const floor = mesh(new THREE.PlaneGeometry(L - 0.1, W - 0.06), std(0xffffff, { map: grainTex('#6e5238', { size: 256, speck: 0.1, blot: 0.12, seed: 14, repeat: 2 }), roughness: 0.6 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.045; shell.add(floor);
  const boxGeo = new RoundedBoxGeometry(1, 1, 1, 2, 0.05);
  const mods = MODS.map((md) => { const m = mesh(boxGeo, std(md.c, { roughness: 0.7 })); shell.add(m); return m; });

  // ----------------------------------------------------------- product detail hotspots
  const HOTS = [[-0.2, LIFT + 0.79, W / 2 + 0.47], [-0.14, LIFT + 0.42, SZ + 0.03], [L / 2 + 0.06, LIFT + 0.5, 0.18]];
  const hots = HOTS.map((p) => {
    const g = new THREE.Group(); g.position.set(...p); scene.add(g);
    const core = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false, transparent: true }));
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.06, 0.075, 40), new THREE.MeshBasicMaterial({ color: 0xffc070, toneMapped: false, transparent: true, side: THREE.DoubleSide, depthWrite: false }));
    const gl = glow(0xffb050, 0.32, 0.7, 0.35);
    g.add(core, ring, gl);
    return { g, core, ring, gl };
  });

  // ----------------------------------------------------------- dealer locator: ground map, pins, route
  const mapM = new THREE.MeshBasicMaterial({ map: mapTex(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, opacity: 0 });
  const map = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 6.4), mapM); map.rotation.x = -Math.PI / 2; map.position.y = 0.012; map.renderOrder = 1; scene.add(map);
  const pinHeadGeo = new THREE.SphereGeometry(0.1, 24, 16); pinHeadGeo.translate(0, 0.32, 0);
  const pinTipGeo = new THREE.ConeGeometry(0.07, 0.26, 18); pinTipGeo.rotateX(Math.PI); pinTipGeo.translate(0, 0.13, 0);
  const pins = PINS.map(([x, z, col]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    const m = std(col, { roughness: 0.3, metalness: 0.2, emissive: col, emissiveIntensity: 0.55 });
    const head = mesh(pinHeadGeo, m), tip = mesh(pinTipGeo, m); g.add(head, tip);
    const dot = new THREE.Mesh(new THREE.CircleGeometry(0.045, 20), new THREE.MeshBasicMaterial({ color: 0x0d1118 })); dot.position.set(0, 0.32, 0.098); g.add(dot);
    const burst = new THREE.Mesh(new THREE.RingGeometry(0.16, 0.2, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    burst.rotation.x = -Math.PI / 2; burst.position.set(x, 0.02, z); scene.add(burst);
    const gl = glow(col, 0.9, 0, 0.4); gl.position.set(x, 0.33, z); scene.add(gl);
    return { g, burst, gl };
  });
  const route = new THREE.CurvePath();
  [[-0.25, 0.78], [-0.25, 1.5], [2.0, 1.5], [2.0, -1.02]].reduce((a, b) => { route.add(new THREE.LineCurve3(new THREE.Vector3(a[0], 0.03, a[1]), new THREE.Vector3(b[0], 0.03, b[1]))); return b; });
  const RS = 160, RR = 8;
  const routeGeo = new THREE.TubeGeometry(route, RS, 0.022, RR, false);
  const routeMesh = new THREE.Mesh(routeGeo, new THREE.MeshBasicMaterial({ color: 0xffb860, toneMapped: false }));
  scene.add(routeMesh);
  const routeHead = glow(0xffc070, 0.5, 0, 0.35); scene.add(routeHead);

  // ----------------------------------------------------------- beat captions (words from the summary)
  const capDetail = chip('Product detail'), capConfig = chip('Configurator', 3), capDealer = chip('Dealer locator'), capProto = chip('Quick prototype');
  scene.add(capDetail.m, capConfig.m, capDealer.m);
  capDetail.m.position.set(-0.55, 1.12, 0.9); capDetail.m.scale.setScalar(0.2);
  capConfig.m.position.set(-0.3, 0.98, -0.3); capConfig.m.scale.setScalar(0.21);
  capDealer.m.position.set(PINS[0][0], 0.95, PINS[0][1]); capDealer.m.scale.setScalar(0.3);

  // ----------------------------------------------------------- quick prototype: the phone
  const ph = phone({ frame: 0x24272c });
  ph.traverse((o) => { o.castShadow = false; o.receiveShadow = false; });
  ph.scale.setScalar(0.5);
  camera.add(ph);
  camera.add(capProto.m); capProto.m.scale.setScalar(0.07);
  const UW = 460, UH = Math.round(UW * ph.userData.sh / ph.userData.sw);
  const ui = canvasTex(UW, UH);
  ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.needsUpdate = true;
  const phGlow = glow(0x6fb0c8, 1.4, 0, 0.5); phGlow.position.z = -0.1; ph.add(phGlow);
  const ROWS = ['Configurator', 'Product detail', 'Dealer locator'];
  let uiKey = '';
  const drawUI = (t) => {
    const r = k(t, 7.85, 8.75), tap = k(t, 8.95, 9.5);
    const live = (r > 0 && r < 1) || (tap > 0 && tap < 1);
    const key = live ? Math.round(t * 30) : (r >= 1 ? 'done' + (tap >= 1) : 'off');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      c.fillStyle = INK; c.fillRect(0, 0, w, h);
      c.textBaseline = 'middle';
      c.fillStyle = '#f4efe6'; c.font = `800 34px ${SANS}`; c.fillText('Jayco', 26, 84);
      c.fillStyle = 'rgba(244,239,230,0.55)'; [0, 1, 2].forEach((i) => c.fillRect(w - 58, 72 + i * 11, 30, 3));
      // Hero: the trailer at dusk.
      const hx = 20, hy = 116, hw = w - 40, hh = 290;
      c.save(); roundRect(c, hx, hy, hw, hh, 22); c.clip();
      const sky = c.createLinearGradient(0, hy, 0, hy + hh); sky.addColorStop(0, '#121a33'); sky.addColorStop(0.62, '#7a5468'); sky.addColorStop(0.78, '#c07a58'); sky.addColorStop(0.79, '#141a16'); sky.addColorStop(1, '#0c100d');
      c.fillStyle = sky; c.fillRect(hx, hy, hw, hh);
      c.fillStyle = '#0e1612';
      for (let i = 0; i < 14; i++) { const x = hx + i * hw / 13, th = 50 + rnd(i, 3) * 60, base = hy + hh * 0.8; c.beginPath(); c.moveTo(x - 22, base); c.lineTo(x, base - th); c.lineTo(x + 22, base); c.fill(); }
      const tx = hx + hw * 0.18, ty = hy + hh * 0.5, tw = hw * 0.62, th2 = 88;
      c.fillStyle = '#b4b9bf'; c.beginPath(); c.moveTo(tx + 6, ty); c.lineTo(tx + tw - 34, ty); c.quadraticCurveTo(tx + tw, ty, tx + tw, ty + 34); c.lineTo(tx + tw, ty + th2); c.lineTo(tx, ty + th2); c.lineTo(tx, ty + 6); c.closePath(); c.fill();
      c.fillStyle = '#1f5d64'; c.fillRect(tx, ty + th2 * 0.62, tw, 12);
      c.fillStyle = AMBER; [[0.08, 0.22, 0.2], [0.42, 0.22, 0.24], [0.8, 0.26, 0.12]].forEach(([u, v, s]) => c.fillRect(tx + u * tw, ty + v * th2, s * tw, 22));
      c.fillStyle = '#111'; [0.42, 0.56].forEach((u) => { c.beginPath(); c.arc(tx + u * tw, ty + th2 + 2, 14, 0, 7); c.fill(); });
      c.strokeStyle = '#2a2c31'; c.lineWidth = 5; c.beginPath(); c.moveTo(tx + tw, ty + th2 - 10); c.lineTo(tx + tw + 40, ty + th2 - 4); c.stroke();
      c.restore();
      c.fillStyle = AMBER; c.font = `700 19px ${MONO}`; c.fillText('QUICK PROTOTYPE', 26, 446);
      c.fillStyle = '#f4efe6'; c.font = `800 40px ${SANS}`; c.fillText('Product experience', 26, 494); c.fillText('proposal', 26, 540);
      ROWS.forEach((name, i) => {
        const p = eo(clamp(r * 3.2 - i * 0.9)); if (p <= 0) return;
        const y = 594 + i * 124, hit = i === 2 ? tap : 0;
        c.save(); c.globalAlpha = p; c.translate((1 - p) * 40, 0);
        c.fillStyle = '#161d29'; roundRect(c, 20, y, w - 40, 104, 20); c.fill();
        if (hit > 0) { c.strokeStyle = `rgba(240,166,70,${0.9 * Math.min(1, hit * 4)})`; c.lineWidth = 3; c.stroke(); c.save(); c.clip(); c.fillStyle = `rgba(240,166,70,${0.22 * (1 - hit)})`; c.beginPath(); c.arc(w - 90, y + 52, 30 + hit * 320, 0, 7); c.fill(); c.restore(); }
        c.fillStyle = '#222b3a'; roundRect(c, 36, y + 16, 72, 72, 14); c.fill();
        if (i === 0) { c.fillStyle = '#2c6a6f'; c.fillRect(48, y + 30, 22, 44); c.fillStyle = '#a04a33'; c.fillRect(74, y + 30, 22, 18); c.fillStyle = '#6f767e'; c.fillRect(74, y + 54, 22, 20); }
        else if (i === 1) { c.strokeStyle = AMBER; c.lineWidth = 3; c.beginPath(); c.arc(72, y + 52, 18, 0, 7); c.stroke(); c.fillStyle = AMBER; c.beginPath(); c.arc(72, y + 52, 7, 0, 7); c.fill(); }
        else { c.strokeStyle = TEAL; c.lineWidth = 3; c.beginPath(); c.moveTo(42, y + 66); c.lineTo(100, y + 66); c.moveTo(86, y + 22); c.lineTo(86, y + 82); c.stroke(); c.fillStyle = AMBER; c.beginPath(); c.arc(62, y + 46, 9, 0, 7); c.fill(); }
        c.fillStyle = '#f4efe6'; c.font = `700 29px ${SANS}`; c.fillText(name, 128, y + 54);
        c.strokeStyle = 'rgba(244,239,230,0.4)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w - 52, y + 42); c.lineTo(w - 42, y + 52); c.lineTo(w - 52, y + 62); c.stroke();
        c.restore();
      });
    });
  };
  drawUI(9.9);

  // ----------------------------------------------------------- camera
  const lin = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [3.05, 0.72, 3.45]], [2.4, [2.45, 0.9, 2.95], lin],
    [3.7, [1.95, 3.0, 2.65]], [5.2, [1.55, 3.25, 2.25], lin],
    [6.4, [2.3, 5.0, 4.7]], [7.45, [2.05, 5.2, 4.3], lin],
    [8.6, [3.05, 2.25, 4.45]], [10, [3.3, 2.35, 4.8], lin],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.1, 0.6, 0.2]], [2.4, [0.2, 0.6, 0.2], lin],
    [3.7, [0.0, 0.42, 0.05]], [5.2, [0.0, 0.4, 0.0], lin],
    [6.4, [0.15, 0.0, -0.25]], [7.45, [0.2, 0.0, -0.3], lin],
    [8.6, [0.75, 0.45, -0.45]], [10, [0.75, 0.45, -0.45], lin],
  ]);
  const tgt = new THREE.Vector3(), tmp = new THREE.Vector3();
  const layoutBlend = (t) => {
    // Returns [from, to, per-module progress fn]
    if (t < LAYOUT_AT[0]) return [0, 0, LAYOUT_AT[0]];
    if (t < LAYOUT_AT[1]) return [0, 1, LAYOUT_AT[0]];
    return [1, 2, LAYOUT_AT[1]];
  };

  function update(t) {
    uT.value = t;
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.012, p[1] + Math.sin(t * 1.6 + 1) * 0.008, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.4, 32], [3.7, 36], [7.45, 36], [8.6, 34], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Campfire and embers: flicker built from fixed sines so every frame is repeatable.
    const fl = 0.82 + 0.1 * Math.sin(t * 13.1) + 0.06 * Math.sin(t * 29.3 + 1) + 0.05 * Math.sin(t * 7.3 + 2);
    fireL.intensity = 4.2 * fl;
    fireGlow.material.opacity = 0.22 * fl;
    flames.forEach((f, i) => { const s = [0.55, 0.38, 0.2][i] * (0.9 + 0.15 * Math.sin(t * (11 + i * 4) + i)); f.scale.set(s * 0.75, s * 1.35, 1); f.position.y = 0.14 + i * 0.05 + Math.sin(t * 9 + i) * 0.01; });
    for (let i = 0; i < EN; i++) {
      const ph2 = (t * (0.55 + rnd(i, 51) * 0.4) + rnd(i, 52)) % 1;
      epos[i * 3] = FIRE.x + (rnd(i, 53) - 0.5) * 0.2 + Math.sin(t * 2 + i) * 0.06 * ph2;
      epos[i * 3 + 1] = 0.12 + ph2 * (0.9 + rnd(i, 54) * 0.5);
      epos[i * 3 + 2] = FIRE.z + (rnd(i, 55) - 0.5) * 0.2 + Math.cos(t * 1.7 + i) * 0.06 * ph2;
    }
    eGeo.attributes.position.needsUpdate = true;

    // Beat 1, product detail: hotspots pop on the awning, the door and the nose window.
    const hotOut = 1 - eo(k(t, 2.45, 2.85));
    hots.forEach((h, i) => {
      const pop = back(k(t, 0.85 + i * 0.32, 1.3 + i * 0.32)) * hotOut;
      h.g.visible = pop > 0.01;
      h.g.scale.setScalar(Math.max(0.001, pop));
      h.ring.lookAt(camera.position);
      const pulse = (t * 1.1 + i * 0.33) % 1;
      h.ring.scale.setScalar(1 + pulse * 1.3);
      h.ring.material.opacity = (1 - pulse) * 0.9;
      h.gl.material.opacity = 0.55 + 0.25 * Math.sin(t * 5 + i);
    });
    const cd = eo(k(t, 0.95, 1.4)) * (1 - ei(k(t, 2.4, 2.8)));
    capDetail.m.material.opacity = cd; capDetail.m.visible = cd > 0.01;
    capDetail.m.position.y = 1.12 + (1 - cd) * 0.06;
    capDetail.m.lookAt(camera.position);

    // Beat 2, configurator: the roof cuts away, the floorplan rebuilds itself twice, the roof comes back.
    const open = eio(k(t, 2.75, 3.35)) * (1 - eio(k(t, 5.25, 5.85)));
    cut.constant = lerp(LIFT + H + 0.12, CUT_OPEN, open);
    cabinL.intensity = 0.5 + 1.6 * open;
    const lit = 1 - 0.85 * open;
    winGlows.forEach((g) => { g.material.opacity = 0.28 * lit; });
    porchGlow.material.opacity = 0.6 * lit; bulbGlow.material.opacity = 0.35 * lit;
    const [from, to, at] = layoutBlend(t);
    mods.forEach((m, i) => {
      const raw = k(t, at + i * 0.05, at + i * 0.05 + 0.65), s = from === to ? 0 : spring(raw);
      const A = LAYOUTS[from][i], B = LAYOUTS[to][i];
      const x = lerp(A[0], B[0], s), z = lerp(A[1], B[1], s), sx = Math.max(0.02, lerp(A[2], B[2], s)), sz = Math.max(0.02, lerp(A[3], B[3], s));
      const hop = from === to ? 0 : Math.sin(Math.PI * eio(raw)) * 0.14;
      const hh = MODS[i].h;
      m.scale.set(sx, hh, sz);
      m.position.set(x, 0.05 + hh / 2 + hop, z);
      m.visible = open > 0.001;
    });
    const plan = t < LAYOUT_AT[0] + 0.2 ? 0 : t < LAYOUT_AT[1] + 0.2 ? 1 : 2;
    if (capConfig.m.userData.plan !== plan) { capConfig.draw(plan); capConfig.m.userData.plan = plan; }
    const cc = eo(k(t, 3.15, 3.55)) * (1 - ei(k(t, 5.15, 5.5)));
    capConfig.m.material.opacity = cc; capConfig.m.visible = cc > 0.01;
    capConfig.m.position.y = 0.98 + (1 - cc) * 0.06;
    capConfig.m.lookAt(camera.position);

    // Beat 3, dealer locator: the map spreads over the clearing, pins drop, a route runs to the nearest.
    const spread = eo(k(t, 5.55, 6.45));
    map.scale.setScalar(Math.max(0.001, lerp(0.15, 1, spread)));
    mapM.opacity = 0.8 * spread * (1 - 0.35 * eo(k(t, 7.8, 8.6)));
    map.visible = spread > 0.001;
    map.rotation.z = (1 - spread) * 0.5;
    pins.forEach((pn, i) => {
      const fall = ei(k(t, DROP[i], DROP[i] + 0.36)), land = k(t, DROP[i] + 0.36, DROP[i] + 1.0);
      pn.g.visible = t > DROP[i];
      pn.g.position.y = (1 - fall) * 2.4;
      const sq = land > 0 ? 0.68 + 0.32 * spring(land) : 1;
      pn.g.scale.set(1 + (1 - sq) * 0.6, sq, 1 + (1 - sq) * 0.6);
      pn.g.rotation.y = (1 - fall) * 2 + Math.sin(t * 1.4 + i) * 0.1;
      const b = k(t, DROP[i] + 0.36, DROP[i] + 1.1);
      pn.burst.visible = b > 0 && b < 1;
      pn.burst.scale.setScalar(0.3 + eo(b) * 2.4);
      pn.burst.material.opacity = 0.9 * (1 - b);
      pn.gl.material.opacity = (t > DROP[i] + 0.36 ? 0.6 + 0.2 * Math.sin(t * 4 + i) : 0) * (i === 0 ? 1.2 : 0.8);
    });
    const rp = eio(k(t, 6.55, 7.35));
    routeMesh.visible = rp > 0.001;
    routeGeo.setDrawRange(0, Math.floor(rp * RS) * RR * 6);
    route.getPointAt(Math.min(0.999, Math.max(0.001, rp)), tmp);
    routeHead.position.copy(tmp).setY(0.06);
    routeHead.material.opacity = rp > 0 && rp < 1 ? 0.9 : 0;
    const dc = back(k(t, 6.7, 7.1)) * (1 - ei(k(t, 7.6, 7.95)));
    capDealer.m.material.opacity = clamp(dc); capDealer.m.visible = dc > 0.01;
    capDealer.m.scale.setScalar(0.3 * Math.max(0.001, dc));
    capDealer.m.lookAt(camera.position);

    // Beat 4, quick prototype: a phone rises into the right of frame and builds the proposal on screen.
    const up = back(k(t, 7.55, 8.3));
    ph.visible = t > 7.5;
    ph.position.set(0.34, lerp(-1.25, -0.02, up) + Math.sin(t * 1.3) * 0.006, -1.7);
    ph.rotation.set(-0.06 + (1 - up) * 0.5, lerp(-0.7, -0.24, eo(k(t, 7.55, 8.5))), lerp(0.18, 0.03, eo(k(t, 7.55, 8.5))));
    ph.userData.sheen.position.x = Math.sin(t * 0.8) * 0.05;
    if (t > 7.5) drawUI(t);
    ph.userData.screen.material.color.setScalar(lerp(0.15, 0.9, eo(k(t, 7.7, 8.1))));
    phGlow.material.opacity = 0.35 * eo(k(t, 7.8, 8.4));
    const pc = back(k(t, 8.3, 8.7));
    capProto.m.visible = pc > 0.01;
    capProto.m.material.opacity = clamp(pc);
    capProto.m.position.set(0.14, -0.33 + (1 - clamp(pc)) * 0.03, -1.66);
    capProto.m.scale.setScalar(0.07 * Math.max(0.001, pc));
  }

  return { scene, camera, update, duration: D, poster: 9.15 };
}
