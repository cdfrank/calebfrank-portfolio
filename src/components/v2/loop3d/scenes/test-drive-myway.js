// GM Lab313 Test Drive My Way lit loop, 10 s. "The test drive that came to you."
// A California street on a Saturday morning: stucco houses, palms, dry hills in the haze. A phone hangs
// over the curb in front of a house and books a time (SAT 10AM). The booking folds into a gold pin on
// the street, a route lights up from the dealer to that pin, and a blue Bolt EV drives it while the ETA
// counts down. It pulls up at the curb, dips on its brakes, blinks its lights, and the card reads
// Bolt EV, at home.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const NAVY = '#13213a', GOLD = '#e9b23c', GOLDH = 0xf0b43a, PAINT = 0x1d5bd6;
const FI = 'Inter, system-ui, sans-serif', FM = '"JetBrains Mono", ui-monospace, monospace';
const SLOTS = ['FRI 6PM', 'SAT 10AM', 'SAT 2PM', 'SUN 11AM'];
const PICK = 1;                        // SAT 10AM
const TAP = 1.5, BOOK = 2.1;           // slot tapped, booking confirmed
const GO = 3.7, STOP = 7.4;            // car leaves the dealer lot, pulls up at the curb
const PHONE_AT = new THREE.Vector3(2.3, 1.12, 0.95);
const PIN_AT = new THREE.Vector3(1.95, 0.36, 0.3);
// Where the car drives: out of the dealer lot, along the street, over to the curb in front of the house.
const ROUTE = [[-5.2, -1.9], [-5.2, -0.95], [-4.98, 0.12], [-4.35, 0.62], [-3.1, 0.8], [-1.0, 0.8], [0.05, 0.77], [1.0, 0.6], [1.6, 0.36], [1.95, 0.3]];

// Bolt EV: a tall, short-nosed hatchback. Body to the beltline in paint, a black glass greenhouse on top.
function boltBody() {
  const s = new THREE.Shape();
  s.moveTo(-0.405, 0.075); s.lineTo(-0.362, 0.075);
  s.absarc(-0.27, 0.075, 0.092, Math.PI, 0, true);
  s.lineTo(0.178, 0.075);
  s.absarc(0.27, 0.075, 0.092, Math.PI, 0, true);
  s.lineTo(0.405, 0.075);
  s.quadraticCurveTo(0.432, 0.1, 0.43, 0.15);
  s.quadraticCurveTo(0.42, 0.195, 0.33, 0.208);
  s.lineTo(0.17, 0.222); s.lineTo(-0.34, 0.232);
  s.quadraticCurveTo(-0.405, 0.232, -0.41, 0.18);
  s.lineTo(-0.415, 0.12);
  s.quadraticCurveTo(-0.418, 0.08, -0.405, 0.075);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.016, bevelSegments: 5, curveSegments: 22 });
  g.translate(0, 0, -0.15);
  return g;
}
function boltGlass() {
  const s = new THREE.Shape();
  s.moveTo(0.2, 0.2);
  s.quadraticCurveTo(0.08, 0.29, -0.01, 0.318);
  s.lineTo(-0.27, 0.322);
  s.quadraticCurveTo(-0.36, 0.318, -0.385, 0.25);
  s.lineTo(-0.39, 0.2); s.lineTo(0.2, 0.2);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.018, bevelSegments: 4, curveSegments: 16 });
  g.translate(0, 0, -0.125);
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xe6dccb);
  scene.fog = new THREE.Fog(0xe6dccb, 14, 46);
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 90);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- sky, hills, ground
  scene.add(skyDome([[0, '#3a78c0'], [0.3, '#7fb0de'], [0.46, '#dfe3dc'], [0.5, '#efe3cc'], [0.53, '#cbb894'], [1, '#7d6c4e']]));
  [[-30, 0xb89e63, 1.0, 1], [-38, 0x93a2ae, 1.8, 2]].forEach(([z, col, lift, seed]) => {
    const hg = new THREE.PlaneGeometry(130, 8, 90, 1);
    const hp = hg.attributes.position;
    for (let i = 0; i < hp.count; i++) {
      if (hp.getY(i) > 0) { const x = hp.getX(i); hp.setY(i, lift + 1.4 + Math.sin(x * 0.08 + seed) * 1.3 + Math.sin(x * 0.21 + seed * 2) * 0.6 + rnd(i, seed) * 0.25); }
    }
    hg.computeVertexNormals();
    const h = mesh(hg, std(col, { roughness: 1 }), { cast: false, receive: false });
    h.position.set(0, 0, z); scene.add(h);
  });
  const ground = mesh(new THREE.PlaneGeometry(100, 80), std(0xffffff, { map: grainTex('#7a8a4c', { size: 256, speck: 0.16, blot: 0.12, seed: 21, repeat: 40 }), roughness: 0.95 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; scene.add(ground);

  // Street: one canvas for sidewalk, gutter, asphalt and the far sidewalk, repeated along x.
  const road = canvasTex(512, 256, (c, w, h) => {
    const u = h / 2.3, s0 = Math.round(0.35 * u), s1 = s0 + Math.round(1.6 * u);
    c.fillStyle = '#d4ccbe'; c.fillRect(0, 0, w, s0); c.fillRect(0, s1, w, h - s1);
    c.fillStyle = '#4a4b4e'; c.fillRect(0, s0, w, s1 - s0);
    for (let i = 0; i < 9000; i++) { const v = rnd(i, 3) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 4) * 0.16})`; c.fillRect(rnd(i, 5) * w, s0 + rnd(i, 6) * (s1 - s0), 1.5, 1.5); }
    for (let i = 0; i < 3000; i++) { const v = rnd(i, 13) > 0.5 ? 255 : 0; const y = rnd(i, 14) > 0.5 ? rnd(i, 15) * s0 : s1 + rnd(i, 15) * (h - s1); c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 16) * 0.12})`; c.fillRect(rnd(i, 17) * w, y, 1.5, 1.5); }
    c.fillStyle = 'rgba(80,70,56,0.4)'; for (let x = 0; x < w; x += 128) { c.fillRect(x, 0, 2, s0); c.fillRect(x, s1, 2, h - s1); }
    c.fillStyle = 'rgba(20,20,22,0.35)'; c.fillRect(0, s0, w, 7); c.fillRect(0, s1 - 7, w, 7);
    c.strokeStyle = 'rgba(25,25,28,0.5)'; c.lineWidth = 2; c.beginPath(); c.moveTo(0, s0 + 70); c.bezierCurveTo(150, s0 + 60, 260, s0 + 96, w, s0 + 82); c.stroke();
  });
  road.tex.wrapS = THREE.RepeatWrapping; road.tex.repeat.set(35, 1);
  const street = mesh(new THREE.PlaneGeometry(70, 2.3), std(0xffffff, { map: road.tex, roughness: 0.88 }), { cast: false });
  street.rotation.x = -Math.PI / 2; street.position.set(0, 0.003, 0.8); scene.add(street);
  const curbM = std(0xd9d2c6, { roughness: 0.8 });
  [[-35, -5.8, 0], [-4.5, 2.4, 0], [3.1, 35, 0], [-35, 35, 1.6]].forEach(([a, b, z]) => {
    const cb = mesh(new THREE.BoxGeometry(b - a, 0.035, 0.05), curbM); cb.position.set((a + b) / 2, 0.0175, z); scene.add(cb);
  });
  const concrete = grainTex('#cfc8bb', { size: 128, speck: 0.12, blot: 0.06, seed: 31, repeat: 2 });
  const drive = mesh(new THREE.PlaneGeometry(0.66, 0.95), std(0xffffff, { map: concrete, roughness: 0.9 }), { cast: false });
  drive.rotation.x = -Math.PI / 2; drive.position.set(2.75, 0.005, -0.825); scene.add(drive);
  const lot = mesh(new THREE.PlaneGeometry(3.4, 3.45), std(0xffffff, { map: concrete, roughness: 0.85 }), { cast: false });
  lot.rotation.x = -Math.PI / 2; lot.position.set(-5.4, 0.005, -2.075); scene.add(lot);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xbcd6f2, 0x6b6a3e, 0.85));
  const sunL = new THREE.DirectionalLight(0xfff0d8, 3.1);
  sunL.position.set(-6.5, 8.5, 4.5); sunL.target.position.set(-2, 0, -1);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -9.5, right: 9.5, top: 7, bottom: -7, near: 1, far: 30 });
  sunL.shadow.bias = -0.0005; sunL.shadow.normalBias = 0.03;
  scene.add(sunL, sunL.target);
  const rim = new THREE.DirectionalLight(0xbfd8ff, 1.3); rim.position.set(5, 3, -6); scene.add(rim);

  // ----------------------------------------------------------- the house it comes to
  const stucco = grainTex('#efe1c8', { size: 256, speck: 0.1, blot: 0.07, seed: 41, repeat: 3 });
  const house = mesh(new THREE.BoxGeometry(2.6, 0.62, 1.8), std(0xffffff, { map: stucco, roughness: 0.92 }));
  house.position.set(1.9, 0.31, -2.2); scene.add(house);
  const roofGeo = new THREE.ConeGeometry(0.7071, 1, 4, 1); roofGeo.rotateY(Math.PI / 4); roofGeo.translate(0, 0.5, 0);
  const roof = mesh(roofGeo, std(0xb4573a, { roughness: 0.72, flatShading: true }));
  roof.scale.set(2.95, 0.55, 2.15); roof.position.set(1.9, 0.6, -2.2); scene.add(roof);
  const garage = canvasTex(256, 172, (c, w, h) => {
    c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 4; y++) { c.fillStyle = 'rgba(0,0,0,0.09)'; c.fillRect(0, y * h / 4, w, 3); for (let x = 0; x < 6; x++) { c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 2; c.strokeRect(8 + x * w / 6, 8 + y * h / 4, w / 6 - 16, h / 4 - 16); } }
  });
  const gd = mesh(new THREE.PlaneGeometry(0.66, 0.44), std(0xffffff, { map: garage.tex, roughness: 0.6 }), { cast: false });
  gd.position.set(2.75, 0.22, -1.298); scene.add(gd);
  const doorT = canvasTex(96, 168, (c, w, h) => {
    c.fillStyle = '#2d6a73'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3; c.strokeRect(12, 14, w - 24, 60); c.strokeRect(12, 88, w - 24, 66);
    c.fillStyle = '#e8c36a'; c.beginPath(); c.arc(w - 18, h * 0.55, 5, 0, 7); c.fill();
  });
  const fd = mesh(new THREE.PlaneGeometry(0.24, 0.42), std(0xffffff, { map: doorT.tex, roughness: 0.45 }), { cast: false });
  fd.position.set(1.55, 0.21, -1.298); scene.add(fd);
  const winT = canvasTex(256, 144, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#9ec4e8'); g.addColorStop(0.55, '#40607c'); g.addColorStop(1, '#1d2a36');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.moveTo(40, 0); c.lineTo(90, 0); c.lineTo(30, h); c.lineTo(-20, h); c.fill();
    c.fillStyle = '#f7f3ea'; c.fillRect(0, 0, w, 10); c.fillRect(0, h - 10, w, 10); c.fillRect(0, 0, 10, h); c.fillRect(w - 10, 0, 10, h); c.fillRect(w / 2 - 4, 0, 8, h); c.fillRect(0, h / 2 - 3, w, 6);
  });
  const winM = std(0xffffff, { map: winT.tex, roughness: 0.12, metalness: 0.25 });
  [0.82, 2.05].forEach((x) => { const wm = mesh(new THREE.PlaneGeometry(0.5, 0.28), winM, { cast: false }); wm.position.set(x === 2.05 ? 1.98 : x, 0.36, -1.298); scene.add(wm); });
  const mbox = new THREE.Group();
  const post = mesh(new THREE.BoxGeometry(0.03, 0.26, 0.03), std(0xf2eee6, { roughness: 0.7 })); post.position.y = 0.13; mbox.add(post);
  const box = mesh(new RoundedBoxGeometry(0.16, 0.085, 0.09, 2, 0.03), std(0x24262b, { roughness: 0.4, metalness: 0.5 })); box.position.y = 0.29; mbox.add(box);
  mbox.position.set(1.2, 0, -0.16); scene.add(mbox);

  // Neighbors: instanced walls, roofs and one facade decal, in soft California pastels.
  const NB = [];
  [-11.4, -8.6, -1.55, 5.2, 8.4].forEach((x, i) => NB.push([x, -2.2, 2.4 + rnd(i, 2) * 0.5, 1.8, 0.56 + rnd(i, 3) * 0.12, 1]));
  [-9.6, -6.4, -3.2, 0.0, 3.2, 6.4, 9.6].forEach((x, i) => NB.push([x, 5.25, 2.3 + rnd(i, 5) * 0.5, 1.8, 0.56 + rnd(i, 6) * 0.12, -1]));
  const WALLS = [0xf2d9c4, 0xdfe7d8, 0xf3ead6, 0xe9d4d8, 0xd9e3ea, 0xf6efe4];
  const ROOFS = [0xa8533a, 0x8a5f48, 0xb86a44, 0x6d6560];
  const wg = new THREE.BoxGeometry(1, 1, 1); wg.translate(0, 0.5, 0);
  const walls = new THREE.InstancedMesh(wg, std(0xffffff, { roughness: 0.9 }), NB.length);
  const roofs = new THREE.InstancedMesh(roofGeo, std(0xffffff, { roughness: 0.75, flatShading: true }), NB.length);
  const facadeT = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f7f4ee'; c.fillRect(150, 44, 86, 84);
    c.fillStyle = 'rgba(0,0,0,0.1)'; for (let y = 0; y < 4; y++) c.fillRect(150, 44 + y * 21, 86, 2);
    [[24, 40], [92, 40]].forEach(([x, y]) => { c.fillStyle = '#f7f4ee'; c.fillRect(x - 4, y - 4, 50, 38); c.fillStyle = '#4a6782'; c.fillRect(x, y, 42, 30); c.fillStyle = 'rgba(255,255,255,0.3)'; c.fillRect(x + 6, y, 8, 30); });
  });
  const facades = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), std(0xffffff, { map: facadeT.tex, alphaTest: 0.5, roughness: 0.6 }), NB.length);
  facades.castShadow = false;
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler();
  const col = new THREE.Color();
  NB.forEach(([x, z, w, d, h, side], i) => {
    m4.compose(p4.set(x, 0, z), q4.identity(), s4.set(w, h, d)); walls.setMatrixAt(i, m4); walls.setColorAt(i, col.setHex(WALLS[i % WALLS.length]));
    m4.compose(p4.set(x, h - 0.02, z), q4.identity(), s4.set(w + 0.32, 0.46 + rnd(i, 8) * 0.12, d + 0.32)); roofs.setMatrixAt(i, m4); roofs.setColorAt(i, col.setHex(ROOFS[i % ROOFS.length]));
    q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), side > 0 ? 0 : Math.PI);
    m4.compose(p4.set(x, h * 0.46, z + side * (d / 2 + 0.003)), q4, s4.set(w * 0.92, h * 0.9, 1)); facades.setMatrixAt(i, m4);
  });
  walls.castShadow = walls.receiveShadow = roofs.castShadow = roofs.receiveShadow = true;
  scene.add(walls, roofs, facades);
  // Shrubs along the house fronts.
  const SH = [];
  NB.concat([[1.9, -2.2, 2.6, 1.8, 0.62, 1]]).forEach(([x, z, w, d, , side], j) => {
    for (let i = 0; i < 6; i++) { const sx = x - w / 2 + 0.15 + rnd(i, j + 40) * (w - 0.3); if (j === NB.length && sx > 2.35) continue; SH.push([sx, z + side * (d / 2 + 0.13 + rnd(i, j + 41) * 0.08), 0.1 + rnd(i, j + 42) * 0.07]); }
  });
  const shrubs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), std(0x4d6b33, { roughness: 0.85, flatShading: true }), SH.length);
  SH.forEach(([x, z, r], i) => { m4.compose(p4.set(x, r * 0.7, z), q4.identity(), s4.set(r * 1.3, r, r * 1.2)); shrubs.setMatrixAt(i, m4); shrubs.setColorAt(i, col.setHex(0x4d6b33).offsetHSL(0, 0, (rnd(i, 44) - 0.5) * 0.1)); });
  shrubs.castShadow = shrubs.receiveShadow = true; scene.add(shrubs);

  // Palms: instanced trunks with bark rings, instanced drooping fronds that sway with t.
  const PALMS = [[-10.5, -0.18], [-7.0, -0.18], [-3.1, -0.18], [-0.7, -0.18], [0.55, -0.18], [3.6, -0.18], [6.4, -0.18], [9.3, -0.18], [0.3, -3.7], [3.75, -3.45], [-9.0, 1.85], [5.9, 1.85]]
    .map(([x, z], i) => ({ x, z, h: (i >= 8 && i < 10 ? 3.5 : 2.6) + rnd(i, 51) * 0.6, lx: (rnd(i, 52) - 0.5) * 0.12, lz: (rnd(i, 53) - 0.5) * 0.14 }));
  const bark = canvasTex(32, 128, (c, w, h) => { c.fillStyle = '#8a7556'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 8) { c.fillStyle = 'rgba(40,28,16,0.45)'; c.fillRect(0, y, w, 2); c.fillStyle = 'rgba(255,240,210,0.12)'; c.fillRect(0, y + 3, w, 2); } }).tex;
  bark.wrapS = bark.wrapT = THREE.RepeatWrapping; bark.repeat.set(1, 6);
  const tg = new THREE.CylinderGeometry(0.042, 0.075, 1, 8, 1); tg.translate(0, 0.5, 0);
  const trunks = new THREE.InstancedMesh(tg, std(0xffffff, { map: bark, roughness: 0.95 }), PALMS.length);
  const tops = PALMS.map((p, i) => {
    q4.setFromEuler(e4.set(p.lx, 0, p.lz));
    m4.compose(p4.set(p.x, 0, p.z), q4, s4.set(1, p.h, 1)); trunks.setMatrixAt(i, m4);
    return new THREE.Vector3(0, p.h, 0).applyQuaternion(q4).add(new THREE.Vector3(p.x, 0, p.z));
  });
  trunks.castShadow = true; scene.add(trunks);
  const fgeo = new THREE.PlaneGeometry(1, 0.22, 10, 2);
  fgeo.rotateX(-Math.PI / 2); fgeo.translate(0.5, 0, 0);
  const fp = fgeo.attributes.position;
  for (let i = 0; i < fp.count; i++) { const x = fp.getX(i), z = fp.getZ(i) * (1 - x * 0.85); fp.setZ(i, z); fp.setY(i, 0.2 * x - 0.66 * x * x - Math.abs(z) * 0.55); }
  fgeo.computeVertexNormals();
  const FN = 9;
  const fronds = new THREE.InstancedMesh(fgeo, std(0x3e6428, { roughness: 0.7, side: THREE.DoubleSide }), PALMS.length * FN);
  fronds.castShadow = true; fronds.receiveShadow = false; scene.add(fronds);
  const frondsAt = (t) => {
    PALMS.forEach((p, i) => {
      for (let j = 0; j < FN; j++) {
        const a = (j / FN) * Math.PI * 2 + rnd(j, i + 60) * 0.4;
        const sw = Math.sin(t * 1.7 + i * 1.3 + j * 0.7) * 0.05 + Math.sin(t * 2.9 + j) * 0.02;
        e4.set(sw, a, 0.32 + rnd(j, i + 61) * 0.3 + sw * 0.6, 'YZX'); q4.setFromEuler(e4);
        const sc = 0.78 + rnd(j, i + 62) * 0.3;
        m4.compose(tops[i], q4, s4.set(sc, sc, sc)); fronds.setMatrixAt(i * FN + j, m4);
      }
    });
    fronds.instanceMatrix.needsUpdate = true;
  };

  // ----------------------------------------------------------- the dealer, down the street
  const showroom = mesh(new THREE.BoxGeometry(2.3, 0.85, 1.0), std(0xeef0f2, { roughness: 0.5 }));
  showroom.position.set(-5.4, 0.425, -3.0); scene.add(showroom);
  const canopy = mesh(new THREE.BoxGeometry(2.6, 0.07, 1.3), std(0xf7f8fa, { roughness: 0.4, metalness: 0.2 }));
  canopy.position.set(-5.4, 0.885, -2.88); scene.add(canopy);
  const glassT = canvasTex(512, 192, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fdf4df'); g.addColorStop(0.7, '#e6dcc6'); g.addColorStop(1, '#a8a196');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(29,91,214,0.85)'; roundRect(c, 70, 112, 150, 44, 18); c.fill(); c.fillStyle = 'rgba(160,30,36,0.85)'; roundRect(c, 300, 112, 150, 44, 18); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)'; for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(i * 120 + 10, 0); c.lineTo(i * 120 + 60, 0); c.lineTo(i * 120 - 30, h); c.lineTo(i * 120 - 80, h); c.fill(); }
    c.fillStyle = '#5d6168'; for (let x = 0; x <= w; x += 102) c.fillRect(x - 3, 0, 6, h); c.fillRect(0, 0, w, 6); c.fillRect(0, h - 6, w, 6);
  });
  const front = new THREE.Mesh(new THREE.PlaneGeometry(2.24, 0.8), new THREE.MeshStandardMaterial({ map: glassT.tex, emissiveMap: glassT.tex, emissive: 0xffffff, emissiveIntensity: 0.45, roughness: 0.08, metalness: 0.15 }));
  front.position.set(-5.4, 0.42, -2.497); scene.add(front);
  const LOT = [[-6.35, -1.75, 0xf2f2f2], [-6.35, -0.95, 0xa8adb5], [-4.15, -1.75, 0x9e1c22], [-4.15, -0.95, 0x2b2e34]];
  const lotB = new THREE.InstancedMesh(new RoundedBoxGeometry(0.8, 0.2, 0.36, 2, 0.06), std(0xffffff, { roughness: 0.3, metalness: 0.45 }), LOT.length);
  const lotC = new THREE.InstancedMesh(new RoundedBoxGeometry(0.46, 0.14, 0.31, 2, 0.05), std(0x0b0d11, { roughness: 0.08, metalness: 0.4 }), LOT.length);
  LOT.forEach(([x, z, c], i) => {
    q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
    m4.compose(p4.set(x, 0.13, z), q4, s4.set(1, 1, 1)); lotB.setMatrixAt(i, m4); lotB.setColorAt(i, col.setHex(c));
    m4.compose(p4.set(x, 0.27, z + 0.04), q4, s4.set(1, 1, 1)); lotC.setMatrixAt(i, m4);
  });
  lotB.castShadow = lotC.castShadow = true; scene.add(lotB, lotC);

  // ----------------------------------------------------------- the Bolt EV
  const car = new THREE.Group(); scene.add(car);
  const body = new THREE.Group(); car.add(body);
  const paint = new THREE.MeshPhysicalMaterial({ color: PAINT, metalness: 0.55, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.05 });
  body.add(mesh(boltBody(), paint));
  body.add(mesh(boltGlass(), new THREE.MeshPhysicalMaterial({ color: 0x07090d, metalness: 0.3, roughness: 0.05, clearcoat: 1 })));
  const blackM = std(0x0c0d10, { roughness: 0.25, metalness: 0.4 });
  const panel = mesh(new THREE.BoxGeometry(0.012, 0.055, 0.22), blackM); panel.position.set(0.447, 0.125, 0); body.add(panel);
  [-1, 1].forEach((sd) => { const mr = mesh(new THREE.BoxGeometry(0.045, 0.03, 0.03), blackM); mr.position.set(0.15, 0.24, sd * 0.195); body.add(mr); });
  const headM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const tailM = new THREE.MeshBasicMaterial({ color: 0xff2a2a, toneMapped: false });
  const headGlows = [], tailGlows = [];
  [-1, 1].forEach((sd) => {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.026, 0.085), headM); hl.position.set(0.432, 0.182, sd * 0.12); body.add(hl);
    const hg = glow(0xe9f3ff, 0.3, 0, 0.3); hg.position.set(0.47, 0.182, sd * 0.12); body.add(hg); headGlows.push(hg);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.04, 0.07), tailM); tl.position.set(-0.426, 0.205, sd * 0.135); body.add(tl);
    const tg2 = glow(0xff3030, 0.26, 0, 0.3); tg2.position.set(-0.46, 0.205, sd * 0.135); body.add(tg2); tailGlows.push(tg2);
  });
  const spokes = canvasTex(128, 128, (c, w) => {
    c.fillStyle = '#16171a'; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill();
    c.fillStyle = '#c9ced6'; c.beginPath(); c.arc(w / 2, w / 2, w * 0.46, 0, 7); c.fill();
    c.fillStyle = '#2a2d33'; for (let i = 0; i < 5; i++) { c.save(); c.translate(w / 2, w / 2); c.rotate(i * Math.PI * 2 / 5); c.beginPath(); c.moveTo(-6, -14); c.lineTo(6, -14); c.lineTo(15, -54); c.lineTo(-15, -54); c.fill(); c.restore(); }
    c.fillStyle = '#7d838c'; c.beginPath(); c.arc(w / 2, w / 2, 11, 0, 7); c.fill();
  }).tex;
  const tireGeo = new THREE.CylinderGeometry(0.068, 0.068, 0.06, 28); tireGeo.rotateX(Math.PI / 2);
  const tireM = std(0x141416, { roughness: 0.85 }), rimM = std(0xffffff, { map: spokes, roughness: 0.3, metalness: 0.7 });
  const wheels = [[0.27, 1], [0.27, -1], [-0.27, 1], [-0.27, -1]].map(([x, sd]) => {
    const steer = new THREE.Group(); steer.position.set(x, 0.068, sd * 0.15); car.add(steer);
    const spin = new THREE.Group(); steer.add(spin);
    spin.add(mesh(tireGeo, tireM));
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.048, 24), rimM); face.position.z = sd * 0.0305; if (sd < 0) face.rotation.y = Math.PI; spin.add(face);
    return { steer, spin, front: x > 0 };
  });
  const aoT = canvasTex(128, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, w / 2, 2, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(0,0,0,0.75)'); g.addColorStop(1, 'rgba(0,0,0,0)'); c.save(); c.scale(1, h / w); c.fillStyle = g; c.fillRect(0, 0, w, w); c.restore(); }).tex;
  const ao = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.52), new THREE.MeshBasicMaterial({ map: aoT, transparent: true, depthWrite: false, opacity: 0.8 }));
  ao.rotation.x = -Math.PI / 2; ao.position.y = 0.008; car.add(ao);

  // ----------------------------------------------------------- route, pins, ETA
  const route = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const RL = route.getLength();
  const lifted = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0.03, z)), false, 'centripetal');
  const TS = 240;
  const tube = new THREE.Mesh(new THREE.TubeGeometry(lifted, TS, 0.045, 6, false), new THREE.MeshBasicMaterial({ color: GOLDH, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(tube);
  const head = glow(0xffcf5a, 0.9, 0, 0.3); scene.add(head);
  const pinM = std(GOLDH, { metalness: 0.55, roughness: 0.25, emissive: GOLDH, emissiveIntensity: 0.35 });
  const makePin = (text) => {
    const g = new THREE.Group();
    const hd = mesh(new THREE.SphereGeometry(0.1, 32, 16), pinM, { cast: false }); hd.position.y = 0.22; g.add(hd);
    const tip = mesh(new THREE.ConeGeometry(0.07, 0.2, 24), pinM, { cast: false }); tip.rotation.x = Math.PI; tip.position.y = 0.1; g.add(tip);
    const gl = glow(0xffc24a, 0.8, 0.55, 0.35); gl.position.y = 0.22; g.add(gl);
    const lab = label(text, { font: `800 60px ${FI}`, fg: '#1d1406', bg: '#ffd36a', h: 0.26, pad: 40, track: 5 });
    lab.position.y = 0.55; g.add(lab);
    scene.add(g);
    return { g, lab, gl };
  };
  const youPin = makePin('YOU'), dealerPin = makePin('DEALER');
  dealerPin.g.position.set(-5.4, 0.98, -2.7);
  const ringM = new THREE.MeshBasicMaterial({ color: GOLDH, transparent: true, toneMapped: false, depthWrite: false, side: THREE.DoubleSide });
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.17, 0.21, 48), ringM); ring.rotation.x = -Math.PI / 2; ring.position.set(PIN_AT.x, 0.012, PIN_AT.z); scene.add(ring);
  const burstM = ringM.clone();
  const burst = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.0, 64), burstM); burst.rotation.x = -Math.PI / 2; burst.position.set(PIN_AT.x, 0.013, PIN_AT.z); scene.add(burst);

  const eta = canvasTex(512, 150);
  const etaM = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.205), new THREE.MeshBasicMaterial({ map: eta.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(etaM);
  let etaKey = '';
  const drawEta = (txt, arrived) => {
    if (txt === etaKey) return; etaKey = txt;
    eta.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = arrived ? '#1f9d6a' : NAVY; roundRect(c, 6, 6, w - 12, h - 12, (h - 12) / 2); c.fill();
      c.fillStyle = arrived ? '#ffffff' : GOLD; c.beginPath(); c.arc(76, h / 2, 40, 0, 7); c.fill();
      c.strokeStyle = arrived ? '#1f9d6a' : NAVY; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      if (arrived) { c.moveTo(58, h / 2); c.lineTo(71, h / 2 + 13); c.lineTo(95, h / 2 - 13); }
      else { c.arc(76, h / 2, 22, -Math.PI / 2, Math.PI * 1.1); c.moveTo(76, h / 2); c.lineTo(76, h / 2 - 14); c.moveTo(76, h / 2); c.lineTo(87, h / 2 + 4); }
      c.stroke();
      c.fillStyle = '#ffffff'; c.textBaseline = 'middle'; c.font = `800 60px ${FM}`; c.fillText(txt, 140, h / 2 + 3);
    });
  };

  // ----------------------------------------------------------- the phone that books it
  const ph = phone({ w: 0.74, h: 1.52, d: 0.075, frame: 0xd9dbe0 });
  ph.children[0].material.color.setHex(0xc9ccd2);
  scene.add(ph);
  const PW = 472, PH = Math.round(472 * ph.userData.sh / ph.userData.sw);
  const scr = canvasTex(PW, Math.min(1024, PH));
  ph.userData.screen.material.map = scr.tex; ph.userData.screen.material.needsUpdate = true;
  ph.userData.screen.material.color.setScalar(0.94);
  const phGlow = glow(0xffd98a, 2.2, 0, 0.5); phGlow.position.z = -0.15; ph.add(phGlow);
  const flash = glow(0xffe08a, 1.4, 0, 0.3); flash.position.copy(PIN_AT).add(new THREE.Vector3(0, 0.22, 0)); scene.add(flash);
  const SLOT_XY = [[30, 560], [246, 560], [30, 700], [246, 700]], SW = 196, SH2 = 120;
  let pKey = '';
  const drawPhone = (t) => {
    const intro = (t > 0.2 && t < 1.25), tapLive = t > TAP - 0.05 && t < TAP + 0.5, bookLive = t > BOOK - 0.2 && t < BOOK + 0.8;
    const sel = t > TAP + 0.08;
    const key = [sel ? 1 : 0, t > BOOK ? 1 : 0, intro || tapLive || bookLive ? Math.round(t * 30) : 0].join('|');
    if (key === pKey) return; pKey = key;
    scr.redraw((c, w, h) => {
      c.fillStyle = '#f6f2ea'; c.fillRect(0, 0, w, h);
      c.textBaseline = 'middle';
      c.fillStyle = '#1b1f27'; c.fillRect(34, 34, 40, 10); c.fillRect(w - 86, 34, 52, 10);
      c.fillStyle = NAVY; c.font = `800 42px ${FI}`; c.fillText('Test Drive My Way', 30, 118);
      c.fillStyle = '#6c6a64'; c.font = `600 28px ${FI}`; c.fillText('Chevrolet Bolt EV', 30, 164);
      // Hero card: the car itself, on the customer's own street.
      const g = c.createLinearGradient(0, 200, 0, 470); g.addColorStop(0, '#7fb0de'); g.addColorStop(0.62, '#efe3cc'); g.addColorStop(0.63, '#4a4b4e'); g.addColorStop(1, '#3a3b3e');
      c.save(); roundRect(c, 24, 200, w - 48, 270, 26); c.clip(); c.fillStyle = g; c.fillRect(24, 200, w - 48, 270);
      c.fillStyle = '#1d5bd6'; c.beginPath(); c.moveTo(90, 410); c.lineTo(96, 372); c.quadraticCurveTo(150, 360, 196, 350); c.quadraticCurveTo(240, 316, 286, 312); c.lineTo(356, 312); c.quadraticCurveTo(388, 316, 392, 350); c.lineTo(396, 410); c.closePath(); c.fill();
      c.fillStyle = '#0b0d12'; c.beginPath(); c.moveTo(206, 350); c.quadraticCurveTo(244, 322, 288, 320); c.lineTo(352, 320); c.quadraticCurveTo(378, 324, 382, 350); c.closePath(); c.fill();
      [150, 340].forEach((x) => { c.fillStyle = '#15161a'; c.beginPath(); c.arc(x, 410, 28, 0, 7); c.fill(); c.fillStyle = '#c9ced6'; c.beginPath(); c.arc(x, 410, 14, 0, 7); c.fill(); });
      c.restore();
      c.fillStyle = '#8a6a1e'; c.font = `700 26px ${FM}`; c.fillText('PICK A TIME', 30, 520);
      SLOTS.forEach((s, i) => {
        const a = eo(k(t, 0.45 + i * 0.1, 0.8 + i * 0.1)), [x, y] = SLOT_XY[i], on = sel && i === PICK;
        if (a <= 0) return;
        c.globalAlpha = a;
        c.save(); c.translate(0, (1 - a) * 18);
        const pr = i === PICK ? 1 - 0.05 * Math.sin(Math.PI * k(t, TAP - 0.05, TAP + 0.2)) : 1;
        c.translate(x + SW / 2, y + SH2 / 2); c.scale(pr, pr); c.translate(-(x + SW / 2), -(y + SH2 / 2));
        c.fillStyle = on ? NAVY : '#ffffff'; roundRect(c, x, y, SW, SH2, 22); c.fill();
        c.strokeStyle = on ? GOLD : 'rgba(19,33,58,0.16)'; c.lineWidth = on ? 6 : 3; c.stroke();
        c.fillStyle = on ? '#ffffff' : NAVY; c.font = `800 38px ${FI}`; c.textAlign = 'center'; c.fillText(s, x + SW / 2, y + SH2 / 2 + 2); c.textAlign = 'left';
        c.restore(); c.globalAlpha = 1;
      });
      const tp = k(t, TAP, TAP + 0.45);
      if (tp > 0 && tp < 1) { const [x, y] = SLOT_XY[PICK]; c.strokeStyle = `rgba(233,178,60,${1 - tp})`; c.lineWidth = 8; c.beginPath(); c.arc(x + SW / 2, y + SH2 / 2, 20 + tp * 90, 0, 7); c.stroke(); }
      const ready = sel, push = 1 - 0.06 * Math.sin(Math.PI * k(t, BOOK - 0.2, BOOK + 0.05));
      c.save(); c.translate(w / 2, 900); c.scale(push, push);
      c.fillStyle = ready ? GOLD : '#dcd6cb'; roundRect(c, -(w - 60) / 2, -46, w - 60, 92, 46); c.fill();
      c.fillStyle = ready ? NAVY : '#8f8a80'; c.font = `800 38px ${FI}`; c.textAlign = 'center'; c.fillText('Book', 0, 2); c.textAlign = 'left';
      c.restore();
      // Confirmation slides up over everything.
      const cf = eo(k(t, BOOK, BOOK + 0.4));
      if (cf > 0) {
        const oy = (1 - cf) * h;
        c.fillStyle = NAVY; roundRect(c, 0, oy, w, h + 40, 40); c.fill();
        const ck = back(k(t, BOOK + 0.25, BOOK + 0.7));
        c.save(); c.translate(w / 2, oy + 330); c.scale(ck, ck);
        c.fillStyle = GOLD; c.beginPath(); c.arc(0, 0, 92, 0, 7); c.fill();
        c.strokeStyle = NAVY; c.lineWidth = 18; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-40, 2); c.lineTo(-10, 32); c.lineTo(44, -28); c.stroke();
        c.restore();
        c.textAlign = 'center';
        c.fillStyle = '#ffffff'; c.font = `800 76px ${FI}`; c.fillText('BOOKED', w / 2, oy + 530);
        c.fillStyle = GOLD; c.font = `800 52px ${FM}`; c.fillText('SAT 10AM', w / 2, oy + 610);
        c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = `600 32px ${FI}`; c.fillText('The car comes to you', w / 2, oy + 690);
        c.textAlign = 'left';
      }
    });
  };

  // ----------------------------------------------------------- captions
  const bring = label('We bring the car', { font: `800 58px ${FI}`, fg: '#ffffff', bg: 'rgba(19,33,58,0.88)', h: 0.13, pad: 40 });
  bring.position.set(0, 0.47, -2); camera.add(bring);
  const cardT = canvasTex(900, 300, (c, w, h) => {
    c.fillStyle = 'rgba(250,247,240,0.94)'; roundRect(c, 6, 6, w - 12, h - 12, 34); c.fill();
    c.fillStyle = GOLD; c.fillRect(48, 52, 64, 7);
    c.textBaseline = 'middle';
    c.fillStyle = '#8a6a1e'; c.font = `700 26px ${FM}`; c.fillText('TEST DRIVE MY WAY  ·  GM LAB313', 130, 56);
    c.fillStyle = NAVY; c.font = `800 82px ${FI}`; c.fillText('Bolt EV, at home', 44, 146);
    c.fillStyle = '#5c5a55'; c.font = `600 36px ${FI}`; c.fillText('Live in 3 California cities · 2017', 46, 228);
  }).tex;
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.05, 0.35), new THREE.MeshBasicMaterial({ map: cardT, transparent: true, toneMapped: false, depthWrite: false }));
  card.position.set(0, 0.34, -2.1); camera.add(card);
  [bring, card].forEach((m) => { m.renderOrder = 10; m.material.fog = false; });

  // ----------------------------------------------------------- motion
  // Car progress along the route: ease out of the lot, cruise, brake to the curb. Velocity is
  // continuous at both joins (the three pieces are solved to share one cruise speed).
  const V = 1 / 2.5667, A = 0.4 * V, B = A + 1.8 * V;
  const carU = (t) => {
    if (t <= GO) return 0;
    if (t < GO + 0.8) { const x = (t - GO) / 0.8; return A * x * x; }
    if (t < STOP - 1.1) return A + (B - A) * (t - GO - 0.8) / 1.8;
    if (t < STOP) return B + (1 - B) * eo((t - (STOP - 1.1)) / 1.1);
    return 1;
  };
  const camA = (t) => kf(t, [
    [0, [2.62, 1.22, 3.35]], [2.7, [2.4, 1.18, 3.0], (x) => x],
    [4.4, [0.3, 5.4, 8.8]], [7.7, [3.35, 0.42, 2.05]], [10, [3.55, 0.47, 2.28], (x) => x],
  ]);
  const tgtA = (t) => kf(t, [
    [0, [2.3, 1.12, 0.95]], [2.7, [2.3, 1.1, 0.95], (x) => x],
    [4.4, [-1.7, 0, -0.5]], [7.7, [1.74, 0.22, -0.12]], [10, [1.8, 0.24, -0.16], (x) => x],
  ]);
  const cp = new THREE.Vector3(), ct = new THREE.Vector3(), ct2 = new THREE.Vector3(), tgt = new THREE.Vector3(), tmp = new THREE.Vector3();

  function update(t) {
    // Car on the route.
    const u = carU(t);
    route.getPointAt(u, cp); route.getTangentAt(u, ct);
    const yaw = Math.atan2(-ct.z, ct.x);
    car.position.copy(cp); car.rotation.y = yaw;
    route.getTangentAt(Math.min(1, u + 0.015), ct2);
    let dy = Math.atan2(-ct2.z, ct2.x) - yaw; if (dy > Math.PI) dy -= Math.PI * 2; if (dy < -Math.PI) dy += Math.PI * 2;
    const steer = clamp(dy * 5, -0.45, 0.45) * (u < 1 ? 1 : 0);
    const roll = u * RL / 0.068;
    wheels.forEach((w) => { w.steer.rotation.y = w.front ? steer : 0; w.spin.rotation.z = -roll; });
    // Squat on launch, nose dive on the brakes, one wobble as it settles.
    const st = t - STOP;
    body.rotation.z = 0.026 * Math.sin(Math.PI * k(t, GO, GO + 0.6)) - 0.032 * Math.sin(Math.PI * k(t, STOP - 0.6, STOP + 0.05)) + (st > 0 ? 0.018 * Math.exp(-5 * st) * Math.sin(12 * st) : 0);
    body.rotation.x = -steer * 0.05;
    const blink = t > STOP + 0.3 && t < STOP + 0.9 ? (Math.sin((t - STOP - 0.3) * Math.PI * 2 / 0.3) > 0 ? 1 : 0.15) : 0;
    const drl = eo(k(t, GO - 0.5, GO)) * (1 - eo(k(t, STOP + 1.2, STOP + 1.8)));
    headGlows.forEach((g) => { g.material.opacity = Math.max(0.55 * drl, blink); g.scale.setScalar(0.3 + blink * 0.25); });
    headM.color.setScalar(0.6 + 0.4 * Math.max(drl, blink));
    const brake = (t > STOP - 0.9 && t < STOP + 0.5) ? 1 : 0;
    tailGlows.forEach((g) => { g.material.opacity = 0.25 * drl + 0.75 * brake; });
    tailM.color.setRGB(0.6 + 0.4 * brake, 0.08, 0.08);

    // Camera: phone close-up, crane up to the street, follow the car, settle on the hero at the curb.
    const a = camA(t), ta = tgtA(t);
    const w = eio(k(t, 4.6, 5.4)) * (1 - eio(k(t, 6.8, 7.7)));
    const fe = eio(k(t, 4.8, 7.2));
    tmp.set(cp.x + 1.5, lerp(2.4, 0.7, fe), cp.z + 2.5);
    camera.position.set(lerp(a[0], tmp.x, w) + Math.sin(t * 1.1) * 0.008, lerp(a[1], tmp.y, w) + Math.sin(t * 1.6 + 1) * 0.005, lerp(a[2], tmp.z, w));
    tgt.set(lerp(ta[0], cp.x + 0.7, w), lerp(ta[1], 0.15, w), lerp(ta[2], cp.z - 0.2, w));
    camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 32], [2.7, 32], [4.4, 38], [7.7, 34], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: phone rises in, books SAT 10AM, then folds into the gold pin on the street.
    const pin = back(k(t, 0.15, 0.9)), fly = eio(k(t, 2.85, 3.45));
    const press = Math.sin(Math.PI * k(t, TAP - 0.05, TAP + 0.2)) + Math.sin(Math.PI * k(t, BOOK - 0.2, BOOK + 0.05));
    ph.position.set(lerp(PHONE_AT.x, PIN_AT.x, fly), lerp(PHONE_AT.y - (1 - pin) * 0.35 + Math.sin(t * 1.3) * 0.015, PIN_AT.y + 0.22, fly) + Math.sin(Math.PI * fly) * 0.25, lerp(PHONE_AT.z - press * 0.025, PIN_AT.z, fly));
    ph.rotation.set(-0.04 + Math.sin(t * 0.9) * 0.02, 0.12 + Math.sin(t * 0.7) * 0.04 + ei(fly) * Math.PI * 2, 0);
    ph.scale.setScalar(Math.max(0.001, 0.72 * pin * (1 - ei(fly) * 0.97)));
    ph.visible = fly < 0.995 && t > 0.15;
    ph.userData.sheen.position.x = Math.sin(t * 0.6) * 0.05;
    phGlow.material.opacity = 0.25 * clamp(pin) * (1 - fly);
    drawPhone(t);
    flash.material.opacity = 1.2 * Math.sin(Math.PI * k(t, 3.3, 3.75));

    // Pins: YOU springs out of the folded phone, DEALER drops on the showroom as the route lights.
    const yp = spring(k(t, 3.3, 4.1)), yout = eio(k(t, STOP - 0.35, STOP + 0.1));
    youPin.g.position.set(PIN_AT.x, PIN_AT.y + Math.sin(t * 2.2) * 0.025 + yout * 0.5, PIN_AT.z);
    const near = (o, d0, lo, hi) => clamp(camera.position.distanceTo(o.position) / d0, lo, hi);
    youPin.g.scale.setScalar(Math.max(0.001, yp * (1 - yout) * near(youPin.g, 5.5, 0.55, 1.8)));
    youPin.g.visible = t > 3.3 && yout < 1;
    youPin.lab.quaternion.copy(camera.quaternion);
    const dp = spring(k(t, 3.55, 4.35)), dout = ei(k(t, 5.6, 6.2));
    dealerPin.g.position.y = 0.98 + Math.sin(t * 2.2 + 1) * 0.025;
    dealerPin.g.scale.setScalar(Math.max(0.001, dp * (1 - dout) * near(dealerPin.g, 5.5, 0.55, 1.8)));
    dealerPin.g.visible = t > 3.55 && dout < 1;
    dealerPin.lab.quaternion.copy(camera.quaternion);
    const rp = (t * 0.9) % 1;
    ring.scale.setScalar(1 + rp * 1.6);
    ringM.opacity = (1 - rp) * 0.9 * clamp(yp) * (1 - yout);
    ring.visible = t > 3.3 && yout < 1;
    const bp = k(t, STOP - 0.05, STOP + 0.8);
    burst.scale.setScalar(0.2 + eo(bp) * 1.2); burstM.opacity = (1 - bp) * 0.85; burst.visible = bp > 0 && bp < 1;

    // Route: draws from the dealer to the pin, the car drives it, then it clears for the hero shot.
    const draw = eio(k(t, 3.55, 4.4));
    tube.geometry.setDrawRange(0, Math.floor(draw * TS) * 36);
    tube.material.opacity = 0.95 * (1 - eo(k(t, STOP + 0.2, STOP + 1.0)));
    tube.visible = draw > 0 && t < STOP + 1.0;
    lifted.getPointAt(draw, head.position);
    head.material.opacity = draw > 0 && draw < 1 ? 1 : 0;

    // ETA chip rides above the car and counts down, then reads ARRIVED.
    const arrived = t > STOP + 0.05;
    drawEta(arrived ? 'ARRIVED' : u < 0.35 ? 'ETA 14 MIN' : u < 0.72 ? 'ETA 9 MIN' : 'ETA 3 MIN', arrived);
    const ein = back(k(t, GO - 0.1, GO + 0.35)), apop = arrived ? back(k(t, STOP + 0.05, STOP + 0.4)) : 1, eout = ei(k(t, 8.0, 8.35));
    etaM.position.set(cp.x, 0.66 + Math.sin(t * 2) * 0.012, cp.z);
    etaM.quaternion.copy(camera.quaternion);
    etaM.scale.setScalar(Math.max(0.001, ein * (arrived ? 0.85 + 0.15 * apop : 1) * (1 - eout) * near(etaM, 4, 0.85, 2.2)));
    etaM.visible = ein > 0.01 && eout < 1;

    // Captions.
    const bi = eo(k(t, 4.25, 4.7)) * (1 - ei(k(t, 6.5, 6.9)));
    bring.material.opacity = bi; bring.visible = bi > 0.01; bring.position.y = 0.47 + (1 - bi) * 0.03;
    const ci = back(k(t, 8.0, 8.5)), cout = ei(k(t, 9.25, 9.55));
    card.scale.setScalar(Math.max(0.001, 0.9 + 0.1 * ci)); card.material.opacity = clamp(ci) * (1 - cout); card.visible = ci > 0.01;
    card.position.y = 0.34 - (1 - clamp(ci)) * 0.04;

    frondsAt(t);
  }

  return { scene, camera, update, duration: D, poster: 8.7 };
}
