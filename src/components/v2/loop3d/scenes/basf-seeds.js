// BASF Agriculture global seeds and traits lit loop, 10 s. "The seeds and traits portfolio on BASF's global site."
// A research greenhouse at night: magenta grow bars click on over rows of seedlings, rain-dark glass
// behind. At the end of a potting bench a glass globe spins down out of a fast turn and region pins drop
// onto it, one by one, as each part of the world comes round. Along the bench a breeder in a green apron
// pinches a seed from a tray and drops it into each of three peat pots: corn, then soy, then cotton. Each
// one pushes up out of the soil and its product tile lights. Then each sprout sends an arc of light up to
// the globe, the globe pulses as the three land, and the project's name settles above the bench.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip, sway,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const NIGHT = 0x0c0a1c, MAGENTA = 0xff4fd2, VIOLET = 0x7a5cff, CYAN = 0x5fd8ff;
const BENCH_Y = 0.86;
// The three crops, left to right along the bench: name, tile colour, arc colour, seed colour.
const CROPS = [
  { name: 'CORN', css: '#f2b632', hex: 0xf2b632, seed: 0xe9b43a, x: -0.38 },
  { name: 'SOY', css: '#65ac1e', hex: 0x7fd23a, seed: 0xcdb48a, x: 0.12 },
  { name: 'COTTON', css: '#21a0d2', hex: 0x3cc4ff, seed: 0xe9e4da, x: 0.62 },
];
const POT_Z = -0.02, SOIL_Y = BENCH_Y + 0.115, TRAY_Z = -0.2;
const T_PLANT = [2.45, 3.35, 4.25];          // each planting: dip, pinch, carry, drop
const LAND = T_PLANT.map((x) => x + 0.8);    // seed reaches the soil
const ARC = [5.75, 5.97, 6.19], ARC_LEN = 0.75;
const G = new THREE.Vector3(-1.12, 1.3, -0.12), GR = 0.3;  // globe centre and radius
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// Rough continent outlines in (longitude, latitude), drawn as dots on the globe.
const LAND_POLYS = [
  [[-165, 65], [-140, 70], [-95, 72], [-75, 62], [-60, 50], [-80, 30], [-82, 25], [-97, 18], [-105, 22], [-118, 33], [-125, 48], [-140, 58], [-165, 60]],
  [[-97, 18], [-83, 9], [-78, 8], [-92, 15]],
  [[-80, 10], [-60, 10], [-50, 0], [-35, -7], [-40, -22], [-55, -35], [-68, -55], [-75, -45], [-72, -20], [-81, -5]],
  [[-50, 60], [-20, 70], [-30, 82], [-60, 80]],
  [[-10, 36], [0, 43], [-5, 48], [5, 52], [10, 57], [5, 62], [20, 70], [30, 70], [40, 62], [30, 45], [20, 40], [10, 44], [-9, 43]],
  [[-17, 15], [-10, 30], [10, 37], [32, 31], [43, 12], [51, 11], [40, -15], [32, -28], [20, -35], [12, -17], [9, 4], [-8, 5]],
  [[30, 45], [40, 62], [60, 70], [100, 77], [140, 72], [180, 68], [160, 60], [140, 50], [122, 40], [120, 23], [105, 10], [100, 20], [88, 22], [77, 8], [68, 24], [57, 25], [48, 30], [36, 36]],
  [[36, 30], [43, 12], [52, 16], [58, 22], [50, 30]],
  [[95, 5], [120, -8], [140, -5], [110, -2]],
  [[114, -22], [130, -12], [142, -11], [153, -27], [146, -39], [135, -34], [115, -34]],
];
// Pins: latitude, longitude, colour.
const PINS = [[32, 105, 0x3cc4ff], [49, 8, 0x7fd23a], [-14, -52, 0xf2b632], [40, -90, 0xff8a3c]];
const lonLat = (lat, lon, out = V(0, 0, 0)) => {
  const a = THREE.MathUtils.degToRad(lat), o = THREE.MathUtils.degToRad(lon);
  return out.set(Math.cos(a) * Math.cos(o), Math.sin(a), -Math.cos(a) * Math.sin(o));
};
// The globe's spin: a fast turn that eases down, then a slow drift.
const spinAt = (t) => (t < 2.7 ? lerp(-4.2, -0.1, eio(k(t, 0, 2.7))) : -0.1 + (t - 2.7) * 0.07);

const fwdOf = (yaw, out = V(0, 0, 0)) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = V(0, 0, 0)) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// Stylized person from capsules, posed in world space from a few inputs per frame (adapted from the
// consult-room loop): hip centre, facing, lean, ankle targets, wrist targets, a point to look at.
function makePerson(scene, o) {
  const bone = (r, len, m) => { const b = mesh(new THREE.CapsuleGeometry(r, len, 4, 12), m); scene.add(b); return b; };
  const LT = 0.44, LS = 0.43, LU = 0.29, LF = 0.27;
  const p = {
    pelvis: bone(0.1, 0.12, o.pants), torso: bone(o.chestR, 0.3, o.top), neck: bone(0.042, 0.05, o.skin),
    head: mesh(new THREE.SphereGeometry(0.102, 28, 20), o.skin), nose: mesh(new THREE.SphereGeometry(0.018, 10, 8), o.skin),
    hair: mesh(new THREE.SphereGeometry(0.109, 28, 14, 0, Math.PI * 2, 0, Math.PI * o.hairCap), o.hairM),
    ua: [bone(0.05, 0.21, o.sleeve), bone(0.05, 0.21, o.sleeve)], fa: [bone(0.042, 0.2, o.fore), bone(0.042, 0.2, o.fore)],
    hand: [0, 1].map(() => { const h = mesh(new THREE.SphereGeometry(0.04, 14, 10), o.skin); h.scale.set(0.8, 1.15, 1); scene.add(h); return h; }),
    th: [bone(0.07, 0.34, o.pants), bone(0.07, 0.34, o.pants)], sh: [bone(0.056, 0.34, o.pants), bone(0.056, 0.34, o.pants)],
    shoe: [0, 1].map(() => { const s = mesh(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.03), o.shoeM); scene.add(s); return s; }),
    extra: [],
  };
  [p.head, p.nose, p.hair].forEach((m) => scene.add(m));
  const va = V(0, 0, 0), vb = V(0, 0, 0), vc = V(0, 0, 0), vd = V(0, 0, 0);
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, vd.subVectors(b, a).normalize()); };
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.min(dv.length(), l1 + l2 - 0.001); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0);
  p.look = V(0, 0, 1);
  p.shoulder = [V(0, 0, 0), V(0, 0, 0)];
  p.headPos = V(0, 0, 0);
  p.pose = ({ hip, yaw, lean, feet, hands, look, nod = 0 }) => {
    fwdOf(yaw, F); sideOf(yaw, S);
    place(p.pelvis, va.copy(hip).addScaledVector(S, -0.08), vb.copy(hip).addScaledVector(S, 0.08));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      hipI.copy(hip).addScaledVector(S, sg * 0.1);
      feet(i, ank);
      pole.copy(F).addScaledVector(S, sg * 0.08);
      ik(hipI, ank, LT, LS, pole, jnt);
      place(p.th[i], hipI, jnt); place(p.sh[i], jnt, ank);
      p.shoe[i].position.copy(ank).addScaledVector(F, 0.05); p.shoe[i].position.y = Math.max(0.038, ank.y - 0.045);
      p.shoe[i].rotation.set(0, yaw, 0);
    }
    Dn.copy(F).multiplyScalar(lean).add(Y).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    place(p.torso, va.copy(hip).addScaledVector(Dn, 0.1), top);
    for (const e of p.extra) e(hip, top, F, S, Dn);
    p.headPos.copy(top).addScaledVector(Dn, 0.16).addScaledVector(F, 0.015);
    place(p.neck, top, p.headPos);
    const lk = p.look.subVectors(look, p.headPos), hz = Math.hypot(lk.x, lk.z);
    lk.y = clamp(lk.y / Math.max(0.01, hz), -0.9, 0.5) * hz; lk.normalize(); lk.y -= nod; lk.normalize();
    p.headPos.addScaledVector(lk, 0.012);
    p.head.position.copy(p.headPos);
    p.nose.position.copy(p.headPos).addScaledVector(lk, 0.098);
    p.hair.position.copy(p.headPos).addScaledVector(lk, -0.014).add(vb.set(0, 0.012, 0));
    p.hair.quaternion.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lk, -0.4).normalize());
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      const sh = p.shoulder[i].copy(top).addScaledVector(Dn, -0.04).addScaledVector(S, sg * 0.19);
      hands(i, sh, wr);
      pole.copy(Y).multiplyScalar(-1).addScaledVector(S, sg * 0.7).addScaledVector(F, -0.35);
      ik(sh, wr, LU, LF, pole, jnt);
      place(p.ua[i], sh, jnt); place(p.fa[i], jnt, wr);
      p.hand[i].position.copy(wr).addScaledVector(vb.subVectors(wr, jnt).normalize(), 0.035);
      p.hand[i].quaternion.setFromUnitVectors(Y, vb);
    }
  };
  return p;
}

// A leaf strip: tapered at both ends, curling forward along its length. Base at the origin, growing up +y.
function leafGeo(len, wid, bend, segs = 8) {
  const g = new THREE.PlaneGeometry(wid, len, 2, segs); g.translate(0, len / 2, 0);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const v = p.getY(i) / len, taper = Math.pow(Math.sin(Math.PI * clamp(v * 0.92 + 0.04)), 0.7) * (1 - v * 0.25);
    p.setX(i, p.getX(i) * taper);
    p.setZ(i, bend * v * v * len + Math.abs(p.getX(i)) * -0.25);
  }
  g.computeVertexNormals();
  return g;
}
const tint = (g, hex) => {
  const c = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
  g.setAttribute('color', new THREE.BufferAttribute(a, 3));
  return g;
};
const xf = (g, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => g.applyMatrix4(new THREE.Matrix4().compose(V(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(r[0], r[1], r[2], 'YXZ')), V(...s)));

function cornGeo() {
  const parts = [tint(new THREE.CylinderGeometry(0.007, 0.012, 0.3, 8).translate(0, 0.15, 0), 0x6f9a3a)];
  const L = [[0.03, 0.27, 0.0, 0.75], [0.07, 0.25, Math.PI + 0.3, 0.7], [0.12, 0.23, 0.5, 0.55], [0.17, 0.2, Math.PI + 0.9, 0.45], [0.22, 0.16, 1.4, 0.25]];
  L.forEach(([h, len, yaw, tilt], i) => parts.push(tint(xf(leafGeo(len, 0.04, 0.55), { p: [0, h, 0], r: [tilt, yaw, 0] }), i % 2 ? 0x5e9a2c : 0x6fb03a)));
  parts.push(tint(xf(leafGeo(0.12, 0.03, 0.15), { p: [0, 0.27, 0], r: [0.1, 0.8, 0] }), 0x8cc24a));
  return mergeGeometries(parts);
}
function soyGeo() {
  const parts = [tint(new THREE.CylinderGeometry(0.004, 0.007, 0.22, 6).translate(0, 0.11, 0), 0x7a9a3a)];
  [[0.09, 0.2], [0.15, 2.4], [0.21, 4.4]].forEach(([h, yaw]) => {
    parts.push(tint(xf(new THREE.CylinderGeometry(0.0025, 0.0025, 0.06, 5).translate(0, 0.03, 0), { p: [0, h, 0], r: [1.0, yaw, 0] }), 0x7a9a3a));
    const tip = V(0, 0.03, 0).applyEuler(new THREE.Euler(1.0, yaw, 0, 'YXZ')).multiplyScalar(2).add(V(0, h, 0));
    [-1.1, 0, 1.1].forEach((a, j) => {
      const leaf = new THREE.CircleGeometry(0.034, 14); leaf.scale(0.62, 1, 1); leaf.translate(0, 0.034, 0);
      parts.push(tint(xf(leaf, { p: [tip.x, tip.y, tip.z], r: [-1.05 + (j === 1 ? 0.25 : 0), yaw + a, 0] }), j === 1 ? 0x5aa02a : 0x4f9424));
    });
  });
  return mergeGeometries(parts);
}
function cottonGeo() {
  const parts = [tint(new THREE.CylinderGeometry(0.005, 0.008, 0.26, 6).translate(0, 0.13, 0), 0x6b5a3a)];
  [[0.08, 0.4, 0.05], [0.13, 2.5, 0.055], [0.18, 4.3, 0.045]].forEach(([h, yaw, r]) => {
    const leaf = new THREE.CircleGeometry(r, 5); leaf.translate(0, r * 0.9, 0);
    parts.push(tint(xf(leaf, { p: [0, h, 0], r: [-0.95, yaw, 0] }), 0x4e8a2a));
  });
  // Bracts cupping the boll at the top.
  [0, 2.1, 4.2].forEach((yaw) => parts.push(tint(xf(leafGeo(0.05, 0.035, -0.6, 4), { p: [0, 0.255, 0], r: [0.7, yaw, 0] }), 0x5a4426)));
  return mergeGeometries(parts);
}

// The globe's map: navy with a faint graticule, the land in cyan dots.
function drawGlobe(c, w, h) {
  c.fillStyle = '#081a33'; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(95,216,255,0.12)'; c.lineWidth = 1.5;
  for (let i = 1; i < 12; i++) { c.beginPath(); c.moveTo((i * w) / 12, 0); c.lineTo((i * w) / 12, h); c.stroke(); }
  for (let i = 1; i < 6; i++) { c.beginPath(); c.moveTo(0, (i * h) / 6); c.lineTo(w, (i * h) / 6); c.stroke(); }
  c.save(); c.beginPath();
  LAND_POLYS.forEach((poly) => poly.forEach(([lo, la], i) => { const x = ((lo + 180) / 360) * w, y = ((90 - la) / 180) * h; if (i) c.lineTo(x, y); else c.moveTo(x, y); }));
  c.closePath(); c.clip();
  c.fillStyle = 'rgba(95,216,255,0.16)'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#9fe9ff';
  for (let y = 4; y < h; y += 8) for (let x = (y / 8) % 2 ? 4 : 8; x < w; x += 8) { c.beginPath(); c.arc(x, y, 2.4, 0, 7); c.fill(); }
  c.restore();
}

// A product tile: a colour band that fills when the crop comes up, the crop's name, a check.
function drawTile(c, w, h, crop, lit) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#151a2b'; roundRect(c, 0, 0, w, h, 28); c.fill();
  c.save(); roundRect(c, 0, 0, w, h, 28); c.clip();
  c.fillStyle = '#20263a'; c.fillRect(0, 0, w, h * 0.42);
  if (lit > 0) {
    const g = c.createLinearGradient(0, 0, w, h * 0.42); g.addColorStop(0, crop.css); g.addColorStop(1, 'rgba(255,255,255,0.35)');
    c.fillStyle = crop.css; c.fillRect(0, 0, w * lit, h * 0.42);
    c.globalAlpha = 0.35; c.fillStyle = g; c.fillRect(0, 0, w * lit, h * 0.42); c.globalAlpha = 1;
  }
  c.restore();
  c.font = `800 92px ${SANS}`; c.textBaseline = 'alphabetic';
  c.fillStyle = lit >= 1 ? '#f4f1ea' : '#59617a'; c.fillText(crop.name, 34, h - 44);
  c.strokeStyle = lit >= 1 ? crop.css : '#2c3348'; c.lineWidth = 8;
  c.beginPath(); c.arc(w - 58, h - 76, 26, 0, 7); c.stroke();
  if (lit >= 1) { c.fillStyle = crop.css; c.beginPath(); c.arc(w - 58, h - 76, 26, 0, 7); c.fill(); c.strokeStyle = '#151a2b'; c.lineWidth = 8; c.beginPath(); c.moveTo(w - 71, h - 76); c.lineTo(w - 61, h - 66); c.lineTo(w - 44, h - 88); c.stroke(); }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NIGHT);
  scene.fog = new THREE.Fog(0x170f2a, 3.8, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const uT = { value: 0 };

  // ----------------------------------------------------------- the greenhouse
  const floor = mesh(new THREE.PlaneGeometry(14, 12), std(0xffffff, { map: grainTex('#1d1a2a', { size: 256, speck: 0.1, blot: 0.12, seed: 17, repeat: 6 }), roughness: 0.42, metalness: 0.15 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // The glass wall at the back: night sky and wet panes drawn into one texture.
  const glassTex = canvasTex(1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0a1030'); g.addColorStop(0.62, '#1d1d4a'); g.addColorStop(0.7, '#2a2050'); g.addColorStop(1, '#0d0a1e');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { c.fillStyle = `rgba(255,200,150,${0.25 + rnd(i, 3) * 0.4})`; c.beginPath(); c.arc(rnd(i, 4) * w, h * 0.66 + rnd(i, 5) * 8, 1.5 + rnd(i, 6) * 2, 0, 7); c.fill(); }
    for (let i = 0; i < 600; i++) { c.fillStyle = `rgba(190,200,255,${0.05 + rnd(i, 7) * 0.12})`; const x = rnd(i, 8) * w, y = rnd(i, 9) * h; c.fillRect(x, y, 1.5, 2 + rnd(i, 10) * 10); }
    c.strokeStyle = '#06050f'; c.lineWidth = 10;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo((i * w) / 8, 0); c.lineTo((i * w) / 8, h); c.stroke(); }
    c.lineWidth = 7; [0.32, 0.72].forEach((p) => { c.beginPath(); c.moveTo(0, h * p); c.lineTo(w, h * p); c.stroke(); });
  });
  const glassWall = new THREE.Mesh(new THREE.PlaneGeometry(13, 6.5), new THREE.MeshBasicMaterial({ map: glassTex.tex, color: 0x9a9ab8 }));
  glassWall.position.set(0, 2.6, -4.2); scene.add(glassWall);

  // Two background benches of seedlings under their own grow bars.
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const benchBits = [];
  [-1.7, -2.8].forEach((z) => {
    benchBits.push([0, 0.78, z, 5.2, 0.05, 0.75]);
    [-2.4, -0.8, 0.8, 2.4].forEach((x) => benchBits.push([x, 0.38, z + 0.3, 0.05, 0.76, 0.05], [x, 0.38, z - 0.3, 0.05, 0.76, 0.05]));
  });
  // The potting bench in front, with its own legs and a back rail.
  benchBits.push([0, BENCH_Y - 0.03, 0.02, 3.3, 0.06, 0.66], [0, BENCH_Y + 0.06, -0.33, 3.3, 0.06, 0.03]);
  [-1.55, 1.55].forEach((x) => benchBits.push([x, (BENCH_Y - 0.06) / 2, 0.3, 0.05, BENCH_Y - 0.06, 0.05], [x, (BENCH_Y - 0.06) / 2, -0.26, 0.05, BENCH_Y - 0.06, 0.05]));
  benchBits.push([0, 0.22, 0.02, 3.1, 0.03, 0.6]);
  const benchM = std(0xffffff, { map: grainTex('#5b5f6a', { size: 256, speck: 0.12, blot: 0.06, seed: 5, repeat: 2 }), roughness: 0.45, metalness: 0.6 });
  const benchIM = new THREE.InstancedMesh(boxGeo, benchM, benchBits.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = V(0, 0, 0), s4 = V(1, 1, 1), e4 = new THREE.Euler();
  benchBits.forEach(([x, y, z, w, h, d], i) => { m4.compose(p4.set(x, y, z), q4.identity(), s4.set(w, h, d)); benchIM.setMatrixAt(i, m4); });
  benchIM.castShadow = benchIM.receiveShadow = true; scene.add(benchIM);
  // The bench top is a slatted steel grid: a darker inlay so it doesn't read as a plain slab.
  const slatTex = canvasTex(256, 64, (c, w, h) => { c.fillStyle = '#2a2c33'; c.fillRect(0, 0, w, h); c.fillStyle = '#6a6e78'; for (let i = 0; i < 16; i++) c.fillRect(i * 16, 0, 11, h); });
  slatTex.tex.wrapS = slatTex.tex.wrapT = THREE.RepeatWrapping; slatTex.tex.repeat.set(5, 2);
  const benchTop = mesh(new THREE.PlaneGeometry(3.28, 0.64), std(0xffffff, { map: slatTex.tex, roughness: 0.4, metalness: 0.7 }), { cast: false });
  benchTop.rotation.x = -Math.PI / 2; benchTop.position.set(0, BENCH_Y + 0.001, 0.02); scene.add(benchTop);

  // Seedlings on the back benches: one instanced leafy clump, swaying a little in the fans.
  const clumpGeo = mergeGeometries([0, 1, 2, 3].map((i) => xf(leafGeo(0.13, 0.05, 0.6, 4), { r: [0.6, i * 1.6, 0] })));
  const clumpM = sway(std(0x3f7a2a, { roughness: 0.6, side: THREE.DoubleSide }), uT, 0.12);
  const CLN = 96, clumps = new THREE.InstancedMesh(clumpGeo, clumpM, CLN);
  for (let i = 0; i < CLN; i++) {
    const row = i < CLN / 2 ? -1.7 : -2.8, j = i % (CLN / 2);
    const x = -2.45 + (j % 24) * 0.213 + (rnd(i, 1) - 0.5) * 0.05, z = row + (j < 24 ? -0.17 : 0.17) + (rnd(i, 2) - 0.5) * 0.05;
    m4.compose(p4.set(x, 0.805, z), q4.setFromEuler(e4.set(0, rnd(i, 3) * 6.28, 0)), s4.setScalar(0.85 + rnd(i, 4) * 0.5));
    clumps.setMatrixAt(i, m4);
  }
  clumps.castShadow = false; clumps.receiveShadow = true; scene.add(clumps);

  // Grow bars: three over the back benches and one over the potting bench.
  const BARS = [[0, 1.75, -1.7], [0, 1.75, -2.8], [-1.4, 2.05, -0.15], [1.4, 2.05, -0.15]];
  const barM = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const barIM = new THREE.InstancedMesh(boxGeo, barM, BARS.length);
  BARS.forEach(([x, y, z], i) => { m4.compose(p4.set(x, y, z), q4.identity(), s4.set(i < 2 ? 4.6 : 2.4, 0.025, 0.07)); barIM.setMatrixAt(i, m4); });
  scene.add(barIM);
  const housing = new THREE.InstancedMesh(boxGeo, std(0x24242c, { metalness: 0.7, roughness: 0.4 }), BARS.length);
  BARS.forEach(([x, y, z], i) => { m4.compose(p4.set(x, y + 0.03, z), q4.identity(), s4.set(i < 2 ? 4.7 : 2.5, 0.04, 0.11)); housing.setMatrixAt(i, m4); });
  scene.add(housing);
  const barGlows = BARS.map(([x, y, z], i) => { const g = glow(MAGENTA, 1, 0, 0.5); g.position.set(x, y - 0.12, z + 0.05); g.scale.set(i < 2 ? 5.2 : 2.9, 0.5, 1); scene.add(g); return g; });
  const BAR_ON = [0.2, 0.42, 0.62, 0.8];

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x6a5aa8, 0x120a18, 0.32));
  const grow = new THREE.DirectionalLight(MAGENTA, 0); grow.position.set(0, 4, -1); grow.target.position.set(0, 0, -1.2); scene.add(grow, grow.target);
  const key = new THREE.SpotLight(0xffe2c4, 0, 0, 0.62, 0.65, 1.2);
  key.position.set(1.3, 2.6, 1.6); key.target.position.set(-0.15, 0.9, -0.05);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1.2; key.shadow.camera.far = 6;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7fb8ff, 1.5); rim.position.set(-2.2, 2.2, -3.2); scene.add(rim);
  const globeL = new THREE.PointLight(CYAN, 0, 2.2, 1.6); globeL.position.copy(G).add(V(0.25, -0.1, 0.35)); scene.add(globeL);

  // ----------------------------------------------------------- the globe
  const globeRoot = new THREE.Group(); globeRoot.position.copy(G); globeRoot.rotation.z = 0.36; scene.add(globeRoot);
  const spin = new THREE.Group(); globeRoot.add(spin);
  const mapTex = canvasTex(1024, 512, drawGlobe).tex;
  const globeM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: mapTex, emissive: 0xffffff, emissiveMap: mapTex, emissiveIntensity: 0.5, roughness: 0.3, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 });
  const globe = mesh(new THREE.SphereGeometry(GR, 64, 32), globeM, { cast: true, receive: false });
  spin.add(globe);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(GR * 1.06, 48, 24), new THREE.MeshPhysicalMaterial({ color: 0xbfe8ff, transparent: true, opacity: 0.12, roughness: 0.04, metalness: 0, clearcoat: 1, depthWrite: false }));
  globeRoot.add(shell);
  const atmo = glow(CYAN, 1, 0, 0.5); atmo.position.copy(G).add(V(0, 0, -0.05)); scene.add(atmo);
  const brass = std(0xb08a4a, { metalness: 1, roughness: 0.28 });
  const meridian = mesh(new THREE.TorusGeometry(GR * 1.12, 0.008, 8, 72, Math.PI * 1.2), brass);
  meridian.rotation.set(0, -Math.PI / 2, Math.PI / 2 - 0.6); globeRoot.add(meridian);
  // The stem meets the bottom of the tilted meridian ring.
  const STEM_X = G.x + GR * 1.12 * Math.sin(0.36), STEM_TOP = G.y - GR * 1.12 * Math.cos(0.36);
  const standG = mergeGeometries([
    new THREE.CylinderGeometry(0.14, 0.16, 0.03, 40).translate(0, BENCH_Y + 0.015, 0),
    new THREE.CylinderGeometry(0.014, 0.02, STEM_TOP - BENCH_Y + 0.01, 12).translate(0, (STEM_TOP + BENCH_Y) / 2, 0),
  ]);
  const stand = mesh(standG, brass); stand.position.set(STEM_X, 0, G.z); scene.add(stand);
  // Region pins: one instanced needle and head per pin, riding on the spinning globe.
  const needleG = new THREE.CylinderGeometry(0.0035, 0.0035, 0.07, 6); needleG.translate(0, 0.035, 0);
  const needles = new THREE.InstancedMesh(needleG, std(0xd8dde4, { metalness: 1, roughness: 0.25 }), PINS.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.019, 16, 12), std(0xffffff, { roughness: 0.25, emissive: 0xffffff, emissiveIntensity: 0.1 }), PINS.length);
  needles.castShadow = false; heads.castShadow = false;
  PINS.forEach(([, , c], i) => heads.setColorAt(i, new THREE.Color(c)));
  spin.add(needles, heads);
  const pinGlows = PINS.map(([, , c]) => { const g = glow(c, 0.16, 0, 0.4); spin.add(g); return g; });
  const PIN_N = PINS.map(([la, lo]) => lonLat(la, lo));
  // Each pin drops as its region turns to face the camera: find when that happens on the spin curve.
  const PIN_T = PINS.map(([, lo]) => {
    const target = -Math.PI / 2 - THREE.MathUtils.degToRad(lo);
    let best = 0.6, bd = 1e9;
    for (let t = 0.6; t <= 2.45; t += 0.01) { const d = Math.abs(spinAt(t) - target); if (d < bd) { bd = d; best = t; } }
    return best;
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(GR * 1.1, 0.004, 8, 96), new THREE.MeshBasicMaterial({ color: 0x9fe9ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  ring.position.copy(G); scene.add(ring);
  const gLabel = label('GLOBAL SITE', { font: `700 60px ${MONO}`, fg: '#9fe9ff', h: 0.13, track: 6 });
  gLabel.material.fog = false; scene.add(gLabel);

  // ----------------------------------------------------------- pots, seed tray, tiles
  const peat = std(0xffffff, { map: grainTex('#5a3b26', { size: 128, speck: 0.25, blot: 0.12, seed: 31, repeat: 1 }), roughness: 0.95 });
  const pots = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.075, 0.058, 0.12, 28), peat, 3);
  const soil = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.069, 0.069, 0.01, 28), std(0xffffff, { map: grainTex('#2a1c14', { size: 128, speck: 0.35, blot: 0.1, seed: 37 }), roughness: 1 }), 3);
  CROPS.forEach((c, i) => {
    m4.compose(p4.set(c.x, BENCH_Y + 0.06, POT_Z), q4.identity(), s4.set(1, 1, 1)); pots.setMatrixAt(i, m4);
    m4.compose(p4.set(c.x, SOIL_Y - 0.005, POT_Z), q4.identity(), s4.set(1, 1, 1)); soil.setMatrixAt(i, m4);
  });
  pots.castShadow = pots.receiveShadow = true; soil.receiveShadow = true; scene.add(pots, soil);
  // A three-bay seed tray behind the pots, each bay holding its crop's seeds.
  const trayParts = [new THREE.BoxGeometry(1.24, 0.012, 0.13).translate(0.12, 0.006, 0)];
  [-0.5, -0.12, 0.36, 0.74].forEach((x) => trayParts.push(new THREE.BoxGeometry(0.012, 0.035, 0.13).translate(x, 0.0175, 0)));
  [-0.065, 0.065].forEach((z) => trayParts.push(new THREE.BoxGeometry(1.24, 0.035, 0.012).translate(0.12, 0.0175, z)));
  const tray = mesh(mergeGeometries(trayParts), std(0xd8d2c4, { roughness: 0.35, metalness: 0.0 }));
  tray.position.set(0, BENCH_Y, TRAY_Z); scene.add(tray);
  const SN = 54, seedsIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.009, 8, 6), std(0xffffff, { roughness: 0.5 }), SN);
  for (let i = 0; i < SN; i++) {
    const b = Math.floor(i / 18), c = CROPS[b];
    m4.compose(p4.set(c.x + (rnd(i, 11) - 0.5) * 0.3, BENCH_Y + 0.017 + rnd(i, 12) * 0.006, TRAY_Z + (rnd(i, 13) - 0.5) * 0.1), q4.setFromEuler(e4.set(rnd(i, 14) * 3, rnd(i, 15) * 3, 0)), s4.set(b === 0 ? 1.1 : 1, b === 0 ? 0.7 : 1, b === 0 ? 1.3 : 1));
    seedsIM.setMatrixAt(i, m4); seedsIM.setColorAt(i, new THREE.Color(c.seed));
  }
  scene.add(seedsIM);
  const seed = mesh(new THREE.SphereGeometry(0.011, 10, 8), std(0xffffff, { roughness: 0.5 }), { cast: false });
  scene.add(seed);
  const puff = glow(0xd9b48a, 0.2, 0, 0.5); scene.add(puff);

  // Product tiles lean back against the front edge of the bench, one per pot.
  const TW = 0.42, TH = 0.25;
  const tiles = CROPS.map((c) => {
    const ct = canvasTex(512, 304);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(TW, TH), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, color: 0xe6e6e6 }));
    m.position.set(c.x, BENCH_Y + 0.08, 0.25); m.rotation.x = -0.95; scene.add(m);
    const gl = glow(c.hex, 1, 0, 0.5); gl.position.set(c.x, BENCH_Y + 0.06, 0.2); gl.scale.set(0.7, 0.32, 1); scene.add(gl);
    return { ct, m, gl, key: '' };
  });

  // ----------------------------------------------------------- the three crops
  const leafM = new THREE.MeshStandardMaterial({ vertexColors: true, side: THREE.DoubleSide, roughness: 0.55 });
  const plants = [cornGeo(), soyGeo(), cottonGeo()].map((g, i) => { const p = mesh(g, leafM); p.position.set(CROPS[i].x, SOIL_Y - 0.004, POT_Z); scene.add(p); return p; });
  const fluffG = mergeGeometries([[0, 0, 0, 0.026], [0.017, 0.006, 0.01, 0.019], [-0.016, 0.005, 0.008, 0.02], [0.002, 0.008, -0.017, 0.019], [0, 0.022, 0, 0.018]].map(([x, y, z, r]) => new THREE.SphereGeometry(r, 12, 9).translate(x, y, z)));
  const fluff = mesh(fluffG, new THREE.MeshPhysicalMaterial({ color: 0xf1eee8, roughness: 0.9, sheen: 1, sheenColor: new THREE.Color(0xffffff) }));
  scene.add(fluff);

  // ----------------------------------------------------------- arcs from the crops to the globe
  const ARC_DIR = [V(0.62, 0.55, 0.62), V(0.8, 0.12, 0.62), V(0.66, -0.3, 0.72)];
  const arcs = CROPS.map((c, i) => {
    const a = V(c.x, SOIL_Y + [0.29, 0.22, 0.27][i], POT_Z), b = G.clone().addScaledVector(ARC_DIR[i].normalize(), GR * 1.02);
    const mid = a.clone().lerp(b, 0.5).add(V(0, 0.5 + i * 0.12, 0.18 + i * 0.08));
    const curve = new THREE.QuadraticBezierCurve3(a, mid, b);
    const geo = new THREE.TubeGeometry(curve, 64, 0.0055, 6, false);
    const tube = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: c.hex, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    tube.frustumCulled = false; scene.add(tube);
    const head = glow(c.hex, 0.14, 0, 0.35); scene.add(head);
    return { curve, geo, tube, head, n: geo.index.count };
  });

  // ----------------------------------------------------------- the breeder
  const skin = new THREE.MeshPhysicalMaterial({ color: 0x9a6446, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const shirt = std(0x3b4a5c, { roughness: 0.9 });
  const breeder = makePerson(scene, { skin, top: shirt, sleeve: shirt, fore: skin, pants: std(0x2a2a33, { roughness: 0.85 }), shoeM: std(0x1b1d20, { roughness: 0.5 }), hairM: std(0x15110e, { roughness: 0.85 }), hairCap: 0.52, chestR: 0.15 });
  const apronM = std(0x2f7d3a, { roughness: 0.75 });
  const apron = mesh(new RoundedBoxGeometry(0.33, 0.66, 0.018, 2, 0.008), apronM); scene.add(apron);
  const pocket = mesh(new THREE.BoxGeometry(0.16, 0.08, 0.006), std(0x266a30, { roughness: 0.8 })); scene.add(pocket);
  const mA = new THREE.Matrix4(), ax = V(0, 0, 0), ay = V(0, 0, 0), az = V(0, 0, 0);
  breeder.extra.push((hip, top, F, S, Dn) => {
    ay.copy(Dn); az.copy(F).addScaledVector(Dn, -F.dot(Dn)).normalize(); ax.crossVectors(ay, az);
    mA.makeBasis(ax, ay, az);
    apron.quaternion.setFromRotationMatrix(mA); apron.position.copy(hip).addScaledVector(Dn, 0.06).addScaledVector(az, 0.16);
    pocket.quaternion.copy(apron.quaternion); pocket.position.copy(hip).addScaledVector(Dn, -0.04).addScaledVector(az, 0.172);
  });
  const HIP0 = V(0.12, 0.93, -0.53);

  // Where each hand goes: rest on the bench rail, dip into the seed bay, carry to above the pot, let go.
  const JOBS = [[0], [1, 2]];
  const tray3 = (i) => V(CROPS[i].x + (i === 1 ? 0.04 : 0), BENCH_Y + 0.07, TRAY_Z - 0.01);
  const above = (i) => V(CROPS[i].x, SOIL_Y + 0.13, POT_Z - 0.01);
  const handKeys = (hand, rest) => {
    const pts = [[0, rest]];
    JOBS[hand].forEach((j, n) => {
      const T = T_PLANT[j];
      if (n === 0) pts.push([T, rest]);
      pts.push([T + 0.22, tray3(j).toArray()], [T + 0.32, tray3(j).add(V(0, 0.012, 0)).toArray()], [T + 0.58, above(j).toArray()], [T + 0.7, above(j).add(V(0, 0.006, 0.004)).toArray()]);
    });
    const last = T_PLANT[JOBS[hand][JOBS[hand].length - 1]];
    pts.push([last + 1.02, rest], [10, rest]);
    return pts;
  };

  // ----------------------------------------------------------- title
  const kicker = label('BASF Agriculture', { font: `700 56px ${MONO}`, fg: '#9fe9ff', h: 0.1, track: 5 });
  const title = label('Global Seeds & Traits', { font: `800 72px ${SANS}`, fg: '#f6f0ff', h: 0.19, track: 1 });
  [kicker, title].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, KWd = kicker.geometry.parameters.width;

  // ----------------------------------------------------------- spores in the grow light
  const DN = 130, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xff9ae6, size: 0.011, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.62, 1.5, 1.42]], [2.15, [-0.42, 1.44, 1.3]],
    [3.05, [0.0, 1.6, 1.62]], [5.0, [0.36, 1.55, 1.52]],
    [6.6, [-0.2, 1.66, 2.95]], [10, [-0.1, 1.64, 3.2], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-1.08, 1.38, -0.1]], [2.15, [-0.98, 1.34, -0.1]],
    [3.05, [-0.12, 1.15, -0.1]], [5.0, [0.3, 1.08, -0.08]],
    [6.6, [-0.42, 1.18, -0.15]], [10, [-0.38, 1.2, -0.15], L],
  ]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), look = V(0, 0, 0), hip = V(0, 0, 0), lk = V(0, 0, 0);
  const restOf = (i) => [HIP0.x + (i ? 0.24 : -0.24), BENCH_Y + 0.1, -0.29];
  const HK = [handKeys(0, restOf(0)), handKeys(1, restOf(1))];

  function update(t) {
    uT.value = t;
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 33], [2.15, 31], [3.05, 36], [5.0, 34], [6.6, 34], [10, 34.5]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Grow bars clunk on one after another, with a short flicker each.
    let growAll = 0;
    BAR_ON.forEach((t0, i) => {
      const on = t < t0 ? 0 : t < t0 + 0.12 ? (rnd(Math.floor(t * 40), i + 3) > 0.45 ? 1 : 0.15) : 1;
      growAll += on / BAR_ON.length;
      barGlows[i].material.opacity = 0.32 * on;
    });
    barM.color.setRGB(2.2 * growAll, 0.55 * growAll, 1.9 * growAll);
    grow.intensity = 1.1 * growAll;
    key.intensity = 26 * eo(k(t, 0.15, 1.1));
    dust.material.opacity = 0.5 * growAll;

    // ---- Beat 1: the globe spins down and the region pins drop on.
    spin.rotation.y = spinAt(t);
    globeM.emissiveIntensity = 0.45 + 0.25 * eo(k(t, 0.1, 0.8));
    let pulse = 0;
    PINS.forEach((pin, i) => {
      const tl = PIN_T[i], s = spring(k(t, tl - 0.3, tl + 0.35));
      const n = PIN_N[i], lift = 0.24 * (1 - s);
      const vis = t > tl - 0.3;
      m4.compose(p4.copy(n).multiplyScalar(GR - 0.004 + lift), q4.setFromUnitVectors(Y, n), s4.setScalar(vis ? 1 : 0.0001)); needles.setMatrixAt(i, m4);
      m4.compose(p4.copy(n).multiplyScalar(GR + 0.066 + lift), q4.identity(), s4.setScalar(vis ? 1 : 0.0001)); heads.setMatrixAt(i, m4);
      const hit = t > tl + 0.05 ? Math.exp(-5 * (t - tl - 0.05)) : 0;
      const arrive = ARC.reduce((m, a) => m + (t > a + ARC_LEN ? Math.exp(-4 * (t - a - ARC_LEN)) : 0), 0);
      pinGlows[i].position.copy(n).multiplyScalar(GR + 0.07 + lift);
      pinGlows[i].material.opacity = vis ? clamp(0.35 + 0.9 * hit + 0.5 * arrive) : 0;
      pinGlows[i].scale.setScalar(0.12 + 0.2 * hit + 0.08 * arrive);
      pulse += hit;
    });
    needles.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;
    const gl = clamp(eo(k(t, 0.6, 1.1)) * (1 - ei(k(t, 2.5, 2.95))));
    gLabel.position.set(G.x + 0.02, G.y + GR + 0.16 + (1 - gl) * -0.04, G.z + 0.05);
    gLabel.lookAt(camera.position); gLabel.material.opacity = gl; gLabel.visible = gl > 0.01;

    // ---- Beat 2: the breeder plants corn, soy and cotton, and each tile lights as its crop comes up.
    const reachW = [0, 1, 2].reduce((m, j) => Math.max(m, Math.sin(Math.PI * k(t, T_PLANT[j] + 0.1, T_PLANT[j] + 0.9))), 0);
    const activeX = t < T_PLANT[1] - 0.1 ? CROPS[0].x : t < T_PLANT[2] - 0.1 ? CROPS[1].x : CROPS[2].x;
    const planting = clamp(k(t, T_PLANT[0] - 0.4, T_PLANT[0]) * (1 - k(t, T_PLANT[2] + 1.0, T_PLANT[2] + 1.4)));
    hip.copy(HIP0);
    hip.x += (activeX - HIP0.x) * 0.12 * planting + Math.sin(t * 0.8) * 0.006;
    hip.y += Math.sin(t * 1.7) * 0.004 - 0.012 * reachW;
    const watch = eio(k(t, 5.7, 6.2)) * (1 - eio(k(t, 7.3, 7.9)));
    if (t < T_PLANT[0] - 0.5) look.copy(G).lerp(V(0.1, 1.0, 0.1), eio(k(t, 1.6, 2.1)));
    else look.set(activeX, SOIL_Y, POT_Z + 0.05);
    if (watch > 0) { lk.copy(G); look.lerp(lk, watch); }
    if (t > 7.3) look.lerp(tmp.copy(camera.position), 0.55 * eio(k(t, 7.3, 7.9)));
    const yaw = Math.atan2(look.x - hip.x, Math.max(0.3, look.z - hip.z)) * 0.35;
    breeder.pose({
      hip, yaw, lean: 0.1 + 0.16 * reachW - 0.05 * watch, look, nod: 0.12 * Math.sin(Math.PI * k(t, 7.0, 7.45)),
      feet: (i, out) => out.set(HIP0.x + (i ? 0.12 : -0.12) + (activeX - HIP0.x) * 0.05 * planting, 0.085, HIP0.z - 0.03 + (i ? 0.02 : -0.01)),
      hands: (i, shp, out) => {
        out.fromArray(kf(t, HK[i]));
        out.y += Math.sin(t * 1.3 + i) * 0.003;
      },
    });

    // The seed: pinched from the bay, carried, let go above the pot, falls into the soil.
    let sv = false;
    seed.position.set(CROPS[0].x, SOIL_Y, POT_Z);
    for (let j = 0; j < 3; j++) {
      const T = T_PLANT[j], h = JOBS[0].includes(j) ? 0 : 1;
      if (t > T + 0.3 && t < T + 0.66) { seed.position.fromArray(kf(t, HK[h])).add(tmp.set(0, -0.03, 0.012)); sv = true; }
      else if (t >= T + 0.66 && t < LAND[j]) {
        const f = ei(k(t, T + 0.66, LAND[j])), a0 = above(j).add(V(0, -0.03, 0.012));
        seed.position.set(a0.x, lerp(a0.y, SOIL_Y + 0.004, f), lerp(a0.z, POT_Z, f)); sv = true;
      }
      if (sv) { seed.material.color.setHex(CROPS[j].seed); seed.scale.set(j === 0 ? 1.1 : 1, j === 0 ? 0.7 : 1, j === 0 ? 1.3 : 1); break; }
    }
    seed.visible = sv;
    let pf = 0, px = CROPS[0].x;
    LAND.forEach((l, j) => { if (t > l && t < l + 0.6) { pf = Math.exp(-6 * (t - l)); px = CROPS[j].x; } });
    puff.position.set(px, SOIL_Y + 0.02 + 0.04 * (1 - pf), POT_Z); puff.material.opacity = 0.6 * pf; puff.scale.setScalar(0.12 + 0.14 * (1 - pf));

    plants.forEach((pl, j) => {
      const g = k(t, LAND[j] + 0.05, LAND[j] + 0.95), s = back(g);
      pl.visible = g > 0;
      pl.scale.set(Math.max(0.001, s * (0.9 + 0.1 * eo(g))), Math.max(0.001, s), Math.max(0.001, s * (0.9 + 0.1 * eo(g))));
      pl.rotation.set(Math.sin(t * 1.4 + j * 2) * 0.03 * eo(g), (1 - eo(g)) * 1.2 + j * 0.7, Math.sin(t * 1.1 + j) * 0.03 * eo(g));
      const lit = eio(k(t, LAND[j] + 0.45, LAND[j] + 0.85));
      const tile = tiles[j], key2 = String(Math.round(lit * 24));
      if (key2 !== tile.key) { tile.key = key2; tile.ct.redraw((c, w, h) => drawTile(c, w, h, CROPS[j], lit)); }
      tile.gl.material.opacity = 0.35 * lit + 0.5 * (lit > 0 && lit < 1 ? Math.sin(Math.PI * lit) : 0) + 0.25 * Math.exp(-3 * Math.max(0, t - ARC[j])) * (t > ARC[j] ? 1 : 0);
    });
    // The cotton boll pops open once the plant is up.
    const cot = plants[2], bo = spring(k(t, LAND[2] + 0.75, LAND[2] + 1.3));
    fluff.position.copy(cot.position).add(tmp.set(0, 0.268 * cot.scale.y, 0));
    fluff.scale.setScalar(Math.max(0.001, bo) * cot.scale.y); fluff.visible = bo > 0.01;

    // ---- Beat 3: each sprout sends an arc of light up to the globe.
    let ringP = 0;
    arcs.forEach((a, i) => {
      const r = k(t, ARC[i], ARC[i] + ARC_LEN), pr = eio(r);
      const cnt = Math.floor((a.n * pr) / 3) * 3;
      a.geo.setDrawRange(0, cnt); a.tube.visible = cnt > 0;
      a.tube.material.opacity = 0.9 - 0.4 * eio(k(t, 8.2, 9.0));
      a.curve.getPoint(pr, a.head.position);
      a.head.material.opacity = r > 0 && r < 1 ? 1 : 0;
      a.head.scale.setScalar(0.12 + 0.05 * Math.sin(t * 30));
      if (t > ARC[i] + ARC_LEN) ringP = Math.max(ringP, k(t, ARC[i] + ARC_LEN, ARC[i] + ARC_LEN + 0.9));
    });
    ring.lookAt(camera.position);
    ring.scale.setScalar(lerp(1, 1.55, eo(ringP)));
    ring.material.opacity = ringP > 0 && ringP < 1 ? 0.9 * Math.sin(Math.PI * ringP) : 0;
    const arrive = ARC.reduce((m, a) => m + (t > a + ARC_LEN ? Math.exp(-3.5 * (t - a - ARC_LEN)) : 0), 0);
    atmo.material.opacity = 0.22 * eo(k(t, 0.2, 1.0)) + 0.35 * clamp(arrive) + 0.12 * pulse;
    atmo.scale.setScalar(GR * 3.4 + 0.15 * clamp(arrive));
    globeL.intensity = 0.8 + 2.4 * clamp(arrive) + 1.2 * clamp(pulse);
    globeM.emissiveIntensity += 0.45 * clamp(arrive);

    // ---- Beat 4: the project's name above the bench.
    const ki = back(k(t, 7.35, 7.9)), ti = back(k(t, 7.5, 8.05)), out = ei(k(t, 9.2, 9.58));
    const tx = -0.36, ty = 1.92, tz = 0.25;
    lk.copy(camera.position); lk.y = ty;
    title.position.set(tx, ty + (1 - clamp(ti)) * -0.05, tz); title.lookAt(lk);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    kicker.position.set(tx - TWd / 2 + KWd / 2 + 0.01, ty + 0.15 + (1 - clamp(ki)) * -0.04, tz); kicker.quaternion.copy(title.quaternion);
    kicker.material.opacity = clamp(ki) * (1 - out); kicker.visible = kicker.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -2 + rnd(i, 41) * 4 + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = 0.9 + rnd(i, 42) * 1.1 + Math.sin(t * 0.45 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -2.4 + rnd(i, 43) * 2.6 + Math.cos(t * 0.25 + i) * 0.06;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.35 };
}
