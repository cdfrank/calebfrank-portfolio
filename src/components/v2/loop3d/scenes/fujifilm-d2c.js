// Fujifilm direct-to-consumer platform lit loop, 10 s. "Your photo, on the things you keep."
// A film boutique after hours: a walnut wall of cubbies lit by warm strips, each holding a film box.
// Seen over a shopper's shoulder, two hands raise a green disposable film camera, wind it with a thumb
// and take the shot; the flash pops across the film wall. The photo slides out of the camera as a print,
// develops into a mountain lake, and sails into a kraft mailer on the stone counter. The lid slams, green
// tape seals it, and the mailer spins away as the light turns to
// golden hour. The lid pops again, warm light spills out, and personalized goods rise out of it: a mug,
// a folded fleece blanket and a throw pillow, each printing the customer's lake photo onto itself while
// the title settles above them.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const GREEN = '#1f8a4c', GREEN_H = 0x1f8a4c, KRAFT = '#a77a4c', PLUM = 0x1d1216;
const SH = new THREE.Vector3(-0.3, 0.2, -0.55);   // shelf: bottom centre
const COLS = 5, ROWS = 3, CW = 0.26, CH = 0.3, BOARD = 0.02;
const BOX = [0.16, 0.22, 0.1];
const BOX_COLS = [0x1f8a4c, 0xb8235a, 0x1e5aa8, 0xd99a1e, 0xc23a2b, 0x5a3e9a, 0x2a9a8a, 0x1f8a4c, 0xd99a1e, 0x1e5aa8, 0xb8235a, 0x2a9a8a, 0xc23a2b, 0x1f8a4c, 0x5a3e9a];
const MAIL = new THREE.Vector3(0.66, 0, 0.24);
const MW = 0.44, MH = 0.12, MD = 0.32, WALL = 0.008;
const HOVER = new THREE.Vector3(0.5, 0.52, 0.5), GOODS_GROW = 1.45;

const cellPos = (c, r, out = new THREE.Vector3()) => out.set(SH.x - (COLS * CW) / 2 + CW / 2 + c * CW, SH.y + BOARD / 2 + r * CH + BOX[1] / 2, SH.z + 0.01);

// The customer's photo: a mountain lake on a clear day, with a red canoe. Drawn once, printed onto the goods.
function drawLake(c, w, h) {
  const HZ = h * 0.56;
  const sky = c.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#3f7fc4'); sky.addColorStop(1, '#bfdff0');
  c.fillStyle = sky; c.fillRect(0, 0, w, HZ);
  const ridge = (pts, fill) => { c.fillStyle = fill; c.beginPath(); c.moveTo(0, HZ); pts.forEach(([x, y]) => c.lineTo(x * w, y * h)); c.lineTo(w, HZ); c.closePath(); c.fill(); };
  const FAR = [[0, 0.4], [0.12, 0.3], [0.2, 0.36], [0.34, 0.16], [0.44, 0.3], [0.52, 0.26], [0.63, 0.12], [0.76, 0.32], [0.86, 0.24], [1, 0.38]];
  ridge(FAR, '#7b98b6');
  // Snow on the peaks.
  c.fillStyle = '#eef3f6';
  [[0.34, 0.16], [0.63, 0.12], [0.12, 0.3], [0.86, 0.24]].forEach(([x, y]) => { c.beginPath(); c.moveTo(x * w, y * h); c.lineTo(x * w - w * 0.045, y * h + h * 0.07); c.lineTo(x * w - w * 0.01, y * h + h * 0.06); c.lineTo(x * w + w * 0.015, y * h + h * 0.075); c.lineTo(x * w + w * 0.05, y * h + h * 0.065); c.closePath(); c.fill(); });
  ridge([[0, 0.48], [0.18, 0.42], [0.3, 0.47], [0.5, 0.4], [0.7, 0.46], [0.88, 0.41], [1, 0.47]], '#3e5a68');
  // The lake, with the mountains mirrored in it.
  const lake = c.createLinearGradient(0, HZ, 0, h); lake.addColorStop(0, '#5c93b4'); lake.addColorStop(1, '#1f4d6a');
  c.fillStyle = lake; c.fillRect(0, HZ, w, h - HZ);
  c.save(); c.globalAlpha = 0.35; c.translate(0, HZ * 2); c.scale(1, -1); ridge(FAR, '#9db4c8'); c.restore();
  for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.08 + rnd(i, 21) * 0.12})`; c.fillRect(rnd(i, 22) * w, HZ + 6 + rnd(i, 23) * (h - HZ), 20 + rnd(i, 24) * 60, 2); }
  // Pines along the shore.
  c.fillStyle = '#1b3a31';
  for (let i = 0; i < 46; i++) {
    const x = rnd(i, 31) * w, th = h * (0.05 + rnd(i, 32) * 0.09), bw = th * 0.32;
    c.beginPath(); c.moveTo(x, HZ - th); c.lineTo(x - bw, HZ + 2); c.lineTo(x + bw, HZ + 2); c.closePath(); c.fill();
  }
  c.fillRect(0, HZ - 4, w, 8);
  // The canoe.
  c.fillStyle = '#d8402c'; c.beginPath(); c.moveTo(w * 0.52, h * 0.74); c.quadraticCurveTo(w * 0.58, h * 0.77, w * 0.64, h * 0.74); c.lineTo(w * 0.62, h * 0.755); c.quadraticCurveTo(w * 0.58, h * 0.765, w * 0.54, h * 0.755); c.closePath(); c.fill();
  c.fillStyle = '#16232a'; c.beginPath(); c.arc(w * 0.585, h * 0.722, h * 0.012, 0, 7); c.fill(); c.fillRect(w * 0.578, h * 0.73, w * 0.014, h * 0.03);
  for (let i = 0; i < 2600; i++) { const v = rnd(i, 9) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 7) * 0.1})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 2, 2); }
}

// The front of every film box on the wall: a white band with a film-strip run through it.
function drawDecal(c, w, h) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#f2efe8'; c.fillRect(0, h * 0.56, w, h * 0.2);
  c.fillStyle = '#16181b'; c.fillRect(w * 0.08, h * 0.6, w * 0.84, h * 0.12);
  c.fillStyle = '#f2efe8';
  for (let i = 0; i < 7; i++) { c.fillRect(w * 0.12 + i * w * 0.115, h * 0.612, w * 0.05, h * 0.022); c.fillRect(w * 0.12 + i * w * 0.115, h * 0.686, w * 0.05, h * 0.022); }
  c.fillStyle = 'rgba(242,239,232,0.92)'; roundRect(c, w * 0.1, h * 0.1, w * 0.36, h * 0.06, h * 0.03); c.fill();
  roundRect(c, w * 0.1, h * 0.2, w * 0.56, h * 0.035, h * 0.017); c.fill();
  c.fillStyle = 'rgba(242,239,232,0.6)'; c.fillRect(0, h * 0.9, w, h * 0.02);
}

// The cardboard wrap on the back of the disposable camera: green, a white band with the film speed, a
// film-strip stripe and a flash bolt.
function drawWrap(c, w, h) {
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#24a05c'); g.addColorStop(1, '#14703c');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.fillStyle = '#f4f1ea'; c.fillRect(0, h * 0.42, w, h * 0.3);
  c.fillStyle = '#14703c'; c.font = `900 ${h * 0.26}px ${SANS}`; c.textBaseline = 'middle'; c.fillText('400', w * 0.06, h * 0.575);
  c.fillStyle = '#1b1d20'; c.font = `700 ${h * 0.09}px ${MONO}`; c.fillText('27 EXP', w * 0.42, h * 0.52); c.fillText('COLOR', w * 0.42, h * 0.635);
  c.fillStyle = '#d8402c'; c.beginPath(); c.moveTo(w * 0.86, h * 0.45); c.lineTo(w * 0.79, h * 0.6); c.lineTo(w * 0.84, h * 0.6); c.lineTo(w * 0.8, h * 0.7); c.lineTo(w * 0.9, h * 0.54); c.lineTo(w * 0.85, h * 0.54); c.closePath(); c.fill();
  c.fillStyle = '#16181b'; c.fillRect(0, h * 0.8, w, h * 0.11);
  c.fillStyle = '#f4f1ea';
  for (let i = 0; i < 14; i++) { c.fillRect(w * 0.02 + i * w * 0.072, h * 0.815, w * 0.032, h * 0.02); c.fillRect(w * 0.02 + i * w * 0.072, h * 0.875, w * 0.032, h * 0.02); }
  c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = `800 ${h * 0.12}px ${SANS}`; c.fillText('FILM', w * 0.06, h * 0.22);
  c.fillStyle = 'rgba(255,255,255,0.55)'; c.fillRect(w * 0.06, h * 0.31, w * 0.3, h * 0.025);
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PLUM);
  scene.fog = new THREE.Fog(PLUM, 3.4, 8.5);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the shop
  const wall = mesh(new THREE.PlaneGeometry(9, 4), std(0xffffff, { map: grainTex('#2b1a20', { size: 256, speck: 0.05, blot: 0.1, seed: 33, repeat: 3 }), roughness: 0.92 }), { cast: false });
  wall.position.set(0, 1.4, -0.7); scene.add(wall);
  const counter = mesh(new RoundedBoxGeometry(4.2, 0.08, 1.7, 3, 0.02), std(0xffffff, { map: grainTex('#1d1b1f', { size: 256, speck: 0.22, blot: 0.06, seed: 12, repeat: 5 }), roughness: 0.3, metalness: 0.15 }));
  counter.position.set(0.1, -0.04, 0.15); scene.add(counter);

  scene.add(new THREE.HemisphereLight(0x9a7a8a, 0x1a0f12, 0.34));
  const key = new THREE.SpotLight(0xffe0bc, 34, 0, 0.6, 0.6, 1.3);
  key.position.set(-1.3, 2.5, 2.1); key.target.position.set(0.15, 0.3, -0.15);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 7;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x5fd3c8, 1.3); rim.position.set(2.2, 1.6, -1.2); scene.add(rim);
  const KEY_A = new THREE.Color(0xffe0bc), KEY_B = new THREE.Color(0xffa860);

  // ----------------------------------------------------------- the film wall
  const unit = new THREE.Group(); scene.add(unit);
  const walnut = std(0x4a2c1c, { roughness: 0.5, metalness: 0.05 });
  const UW = COLS * CW + BOARD, UH = ROWS * CH + BOARD, UD = 0.24;
  const boards = [];
  for (let r = 0; r <= ROWS; r++) boards.push([SH.x, SH.y + r * CH, SH.z, UW, BOARD, UD]);
  for (let c = 0; c <= COLS; c++) boards.push([SH.x - UW / 2 + BOARD / 2 + c * CW, SH.y + UH / 2 - BOARD / 2, SH.z, BOARD, UH, UD]);
  const bGeo = new THREE.BoxGeometry(1, 1, 1);
  const boardIM = new THREE.InstancedMesh(bGeo, walnut, boards.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3();
  boards.forEach(([x, y, z, w, h, d], i) => { m4.compose(p4.set(x, y, z), q4.identity(), s4.set(w, h, d)); boardIM.setMatrixAt(i, m4); });
  boardIM.castShadow = boardIM.receiveShadow = true; unit.add(boardIM);
  const backPanel = mesh(new THREE.PlaneGeometry(UW, UH), std(0x2a1a14, { roughness: 0.9 }), { cast: false });
  backPanel.position.set(SH.x, SH.y + UH / 2 - BOARD / 2, SH.z - UD / 2 + 0.002); unit.add(backPanel);
  // Warm strips under each shelf.
  const stripM = new THREE.MeshBasicMaterial({ color: 0xffc98a, toneMapped: false });
  const strips = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), stripM, ROWS);
  for (let r = 1; r <= ROWS; r++) { m4.compose(p4.set(SH.x, SH.y + r * CH - BOARD / 2 - 0.003, SH.z + UD / 2 - 0.02), q4.identity(), s4.set(UW - 0.06, 0.004, 0.01)); strips.setMatrixAt(r - 1, m4); }
  unit.add(strips);
  const stripGlows = [];
  for (let r = 1; r <= ROWS; r++) { const g = glow(0xffb070, 1, 0.22, 0.5); g.scale.set(UW * 1.1, 0.22, 1); g.position.set(SH.x, SH.y + r * CH - 0.07, SH.z + 0.06); unit.add(g); stripGlows.push(g); }
  const shelfLight = new THREE.PointLight(0xffb070, 1.6, 1.6, 1.6); shelfLight.position.set(SH.x, SH.y + 0.5, SH.z + 0.35); scene.add(shelfLight);

  // The boxes: one instanced body and one instanced front decal for the whole wall.
  const cells = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) cells.push([c, r]);
  const boxIM = new THREE.InstancedMesh(new THREE.BoxGeometry(...BOX), std(0xffffff, { roughness: 0.42 }), cells.length);
  const decalTex = canvasTex(128, 176, drawDecal).tex;
  const decalIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(BOX[0], BOX[1]), std(0xffffff, { map: decalTex, transparent: true, roughness: 0.4 }), cells.length);
  const col = new THREE.Color();
  cells.forEach(([c, r], i) => {
    cellPos(c, r, p4); const ry = (rnd(i, 3) - 0.5) * 0.16;
    q4.setFromEuler(new THREE.Euler(0, ry, 0));
    m4.compose(p4, q4, s4.set(1, 1, 1)); boxIM.setMatrixAt(i, m4);
    boxIM.setColorAt(i, col.setHex(BOX_COLS[(r * COLS + c) % BOX_COLS.length]));
    const off = new THREE.Vector3(0, 0, BOX[2] / 2 + 0.001).applyQuaternion(q4);
    m4.compose(p4.clone().add(off), q4, s4.set(1, 1, 1)); decalIM.setMatrixAt(i, m4);
  });
  boxIM.castShadow = boxIM.receiveShadow = true; decalIM.receiveShadow = true;
  unit.add(boxIM, decalIM);

  // ----------------------------------------------------------- the shooter
  // Over the shoulder: two hands holding a disposable film camera up to the eye, lens toward the film wall.
  const DW = 0.13, DH = 0.07, DD = 0.042;
  const SHOOT = new THREE.Vector3(-0.37, 0.72, 1.12);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const shooter = new THREE.Group(); scene.add(shooter);
  const rig = new THREE.Group(); shooter.add(rig);
  rig.add(mesh(new RoundedBoxGeometry(DW, DH, DD, 4, 0.009), std(0x1a8a4c, { roughness: 0.55 })));
  const wrapTex = canvasTex(512, 280, drawWrap).tex;
  const wrapFace = mesh(new THREE.PlaneGeometry(DW * 0.9, DH * 0.82), std(0xffffff, { map: wrapTex, roughness: 0.62, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { cast: false });
  wrapFace.position.z = DD / 2 + 0.0008; rig.add(wrapFace);
  const darkGlass = std(0x0a0c0f, { roughness: 0.08, metalness: 0.4 });
  const finder = mesh(new RoundedBoxGeometry(0.022, 0.015, 0.006, 2, 0.002), darkGlass); finder.position.set(-DW * 0.33, DH * 0.27, DD / 2 + 0.002); rig.add(finder);
  const lens = mesh(new THREE.CylinderGeometry(0.014, 0.015, 0.008, 28), darkGlass); lens.rotation.x = Math.PI / 2; lens.position.set(DW * 0.1, -0.002, -DD / 2 - 0.003); rig.add(lens);
  const flashM = new THREE.MeshBasicMaterial({ color: 0x8c949c, toneMapped: false });
  const flashWin = new THREE.Mesh(new THREE.PlaneGeometry(0.032, 0.015), flashM); flashWin.rotation.y = Math.PI; flashWin.position.set(-DW * 0.3, DH * 0.26, -DD / 2 - 0.0012); rig.add(flashWin);
  const button = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.005, 20), std(0x15171a, { roughness: 0.4 })); button.position.set(DW * 0.3, DH / 2 + 0.002, -0.006); rig.add(button);
  const ribs = canvasTex(64, 16, (c, w, h) => { c.fillStyle = '#16181b'; c.fillRect(0, 0, w, h); c.fillStyle = '#3b3f45'; c.fillRect(0, 0, w * 0.45, h); });
  ribs.tex.wrapS = THREE.RepeatWrapping; ribs.tex.repeat.set(14, 1);
  const wheel = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.011, 28), std(0xffffff, { map: ribs.tex, roughness: 0.5 })); wheel.position.set(DW / 2 - 0.021, DH / 2 + 0.001, DD / 2 - 0.009); rig.add(wheel);
  const ledM = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0026, 10, 8), ledM); led.position.set(DW * 0.06, DH * 0.33, DD / 2 + 0.002); rig.add(led);
  const flashGlow = glow(0xeef4ff, 0.5, 0, 0.4); flashGlow.position.set(-DW * 0.3, DH * 0.26, -DD / 2 - 0.03); rig.add(flashGlow);
  const flashL = new THREE.PointLight(0xeef4ff, 0, 4, 1.2); flashL.position.set(-DW * 0.3, DH * 0.26, -DD / 2 - 0.05); rig.add(flashL);
  const wallHit = glow(0xf4f8ff, 1.3, 0, 0.5); wallHit.position.set(-0.32, 0.72, -0.42); scene.add(wallHit);

  // Hands: soft stylized skin, hoodie sleeves running out of frame toward the viewer.
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc68b68, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const sleeveM = std(0x2b3037, { roughness: 0.95 }), cuffM = std(0x3a4048, { roughness: 0.9 });
  const UP = new THREE.Vector3(0, 1, 0), dv = new THREE.Vector3();
  const aim = (m, a, b) => { m.position.copy(a); m.quaternion.setFromUnitVectors(UP, dv.subVectors(b, a).normalize()); };
  const limb = (r, a, b, mat, parent = rig) => {
    const len = a.distanceTo(b), g = new THREE.CapsuleGeometry(r, len, 4, 12); g.translate(0, len / 2, 0);
    const m = mesh(g, mat); aim(m, a, b); parent.add(m); return m;
  };
  const hand = (sx) => {
    const X = (x) => x * sx;
    const palm = mesh(new RoundedBoxGeometry(0.027, 0.08, 0.066, 3, 0.012), skin); palm.position.set(X(DW / 2 + 0.012), -0.006, 0.008); rig.add(palm);
    // Fingers wrap around the front of the camera; the right hand keeps its index finger for the shutter.
    for (let j = sx > 0 ? 1 : 0; j < 4; j++) {
      const y = 0.022 - j * 0.017;
      limb(0.0078, V(X(DW / 2 + 0.006), y, -DD / 2 - 0.007), V(X(DW / 2 - 0.028), y - 0.002, -DD / 2 - 0.009), skin);
    }
    limb(0.021, V(X(DW / 2 + 0.014), -0.032, 0.034), V(X(DW / 2 + 0.07), -0.2, 0.3), skin);
    limb(0.037, V(X(DW / 2 + 0.03), -0.082, 0.1), V(X(DW / 2 + 0.11), -0.33, 0.56), sleeveM);
    limb(0.04, V(X(DW / 2 + 0.024), -0.068, 0.078), V(X(DW / 2 + 0.03), -0.082, 0.1), cuffM);
  };
  hand(-1); hand(1);
  // Left thumb rests on the back.
  limb(0.0095, V(-DW / 2 - 0.008, -0.02, DD / 2 + 0.013), V(-DW / 2 + 0.013, -0.007, DD / 2 + 0.013), skin);
  limb(0.0085, V(-DW / 2 + 0.013, -0.007, DD / 2 + 0.013), V(-DW / 2 + 0.031, 0.001, DD / 2 + 0.008), skin);
  // Right thumb winds the wheel; right index finger finds the shutter.
  const tBase = V(DW / 2 + 0.008, -0.018, DD / 2 + 0.013), tKnk = V(DW / 2 - 0.004, 0.004, DD / 2 + 0.015);
  const thumbA = limb(0.0095, tBase, tKnk, skin), thumbB = limb(0.0085, tKnk, V(DW / 2 - 0.016, DH / 2 - 0.006, DD / 2 + 0.008), skin);
  const iBase = V(DW / 2 + 0.006, DH / 2 - 0.006, -0.013), iKnk = V(DW / 2 - 0.01, DH / 2 + 0.013, -0.011);
  const idxA = limb(0.0082, iBase, iKnk, skin), idxB = limb(0.0076, iKnk, V(DW * 0.3 + 0.004, DH / 2 + 0.008, -0.006), skin);
  const kV = new THREE.Vector3(), tV = new THREE.Vector3();

  // ----------------------------------------------------------- the mailer
  const mailG = new THREE.Group(); mailG.position.copy(MAIL); mailG.rotation.y = -0.22; scene.add(mailG);
  const kraft = std(0xffffff, { map: grainTex(KRAFT, { size: 256, speck: 0.16, blot: 0.08, seed: 41, repeat: 1 }), roughness: 0.92 });
  [[0, WALL / 2, 0, MW, WALL, MD], [0, MH / 2, MD / 2 - WALL / 2, MW, MH, WALL], [0, MH / 2, -MD / 2 + WALL / 2, MW, MH, WALL], [MW / 2 - WALL / 2, MH / 2, 0, WALL, MH, MD], [-MW / 2 + WALL / 2, MH / 2, 0, WALL, MH, MD]]
    .forEach(([x, y, z, w, h, d]) => { const p = mesh(new THREE.BoxGeometry(w, h, d), kraft); p.position.set(x, y, z); mailG.add(p); });
  const lidHinge = new THREE.Group(); lidHinge.position.set(0, MH, -MD / 2); mailG.add(lidHinge);
  const lid = mesh(new THREE.BoxGeometry(MW + 0.01, WALL, MD + 0.01), kraft); lid.position.set(0, WALL / 2, MD / 2); lidHinge.add(lid);
  const tapeM = std(GREEN_H, { roughness: 0.3, metalness: 0.1 });
  const tapeGeo = new THREE.BoxGeometry(0.07, 0.002, MD + 0.012); tapeGeo.translate(0, 0, (MD + 0.012) / 2);
  const tapeTop = mesh(tapeGeo, tapeM, { cast: false }); tapeTop.position.set(0, WALL + 0.001, -0.001); lidHinge.add(tapeTop);
  const tapeFront = mesh(new THREE.BoxGeometry(0.07, 0.07, 0.002), tapeM, { cast: false }); tapeFront.position.set(0, MH - 0.035, MD / 2 + 0.0015); mailG.add(tapeFront);
  const boxLight = new THREE.PointLight(0xffc27a, 0, 1.2, 1.6); boxLight.position.set(0, 0.16, 0); mailG.add(boxLight);
  const boxGlow = glow(0xffc27a, 0.9, 0, 0.45); boxGlow.position.set(0, 0.14, 0); mailG.add(boxGlow);
  const puffs = [0, 1, 2, 3].map((i) => { const g = glow(0xe9cfa8, 0.2, 0, 0.6); mailG.add(g); return g; });

  // ----------------------------------------------------------- the personalized goods
  // The customer's photo (a mountain lake with a red canoe) gets printed onto three things that rise out
  // of the mailer: a mug, a folded fleece blanket and a throw pillow. Each starts blank, and the photo
  // wipes onto it left to right as if it is being printed.
  const IW = 704, IH = 480;
  const photo = canvasTex(IW, IH, drawLake);
  const goods = [];
  // Draws the photo into rect (x, y, w, h) of a canvas, revealed left to right by mix, with a bright
  // print-head line at the edge of the wipe.
  const printOn = (c, x, y, w, h, mix, base) => {
    c.fillStyle = base; c.fillRect(x, y, w, h);
    if (mix <= 0) return;
    c.save(); c.beginPath(); c.rect(x, y, w * mix, h); c.clip();
    const s = Math.max(w / IW, h / IH), dw = IW * s, dh = IH * s;
    c.drawImage(photo.cv, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
    c.restore();
    if (mix < 1) { c.fillStyle = 'rgba(255,236,200,0.9)'; c.fillRect(x + w * mix - 3, y, 6, h); }
  };
  const goodsTex = (w, h, draw) => {
    const ct = canvasTex(w, h);
    const g = { ct, key: '', draw };
    goods.push(g);
    return ct.tex;
  };
  const goodsG = new THREE.Group(); scene.add(goodsG);
  const fromV = new THREE.Vector3();

  // Mug: white ceramic, the photo wrapped around the front half.
  const mug = new THREE.Group(); goodsG.add(mug);
  const MR = 0.042, MHh = 0.096;
  const mugTex = goodsTex(1024, 384, (c, w, h, mix) => { c.fillStyle = '#f4f1ec'; c.fillRect(0, 0, w, h); printOn(c, w * 0.29, h * 0.12, w * 0.42, h * 0.76, mix, '#f4f1ec'); });
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.1 });
  const mugSide = mesh(new THREE.CylinderGeometry(MR, MR * 0.96, MHh, 56, 1, true, Math.PI, Math.PI * 2),
    new THREE.MeshPhysicalMaterial({ color: 0xffffff, map: mugTex, roughness: 0.22, clearcoat: 0.8, clearcoatRoughness: 0.1 }));
  mug.add(mugSide);
  const mugIn = mesh(new THREE.CylinderGeometry(MR * 0.9, MR * 0.86, MHh * 0.96, 40, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xf2eee8, roughness: 0.3, side: THREE.BackSide }), { cast: false });
  mugIn.position.y = 0.002; mug.add(mugIn);
  const coffee = mesh(new THREE.CircleGeometry(MR * 0.89, 40), std(0x3a2116, { roughness: 0.15 }), { cast: false });
  coffee.rotation.x = -Math.PI / 2; coffee.position.y = MHh * 0.32; mug.add(coffee);
  const rimT = mesh(new THREE.TorusGeometry(MR * 0.95, MR * 0.055, 8, 56), ceramic, { cast: false });
  rimT.rotation.x = Math.PI / 2; rimT.position.y = MHh / 2; mug.add(rimT);
  const mugBase = mesh(new THREE.CircleGeometry(MR * 0.96, 40), ceramic); mugBase.rotation.x = Math.PI / 2; mugBase.position.y = -MHh / 2; mug.add(mugBase);
  const handle = mesh(new THREE.TorusGeometry(0.026, 0.0075, 10, 28, Math.PI * 1.15), ceramic);
  handle.rotation.z = Math.PI / 2 + 0.25; handle.position.set(-MR - 0.004, 0.0, 0); mug.add(handle);

  // Blanket: soft fleece folded in thirds, the photo across the top fold, standing up for the camera.
  const blanket = new THREE.Group(); goodsG.add(blanket);
  const BWd = 0.23, BHt = 0.165, BDp = 0.05;
  const fleece = std(0xe8e0d2, { roughness: 0.95 });
  [0, 1, 2].forEach((i) => {
    const slab = mesh(new RoundedBoxGeometry(BWd - i * 0.004, BHt - i * 0.003, BDp / 3 + 0.004, 3, 0.008), fleece);
    slab.position.set(i * 0.0015, -i * 0.001, -i * (BDp / 3)); blanket.add(slab);
  });
  const blanketTex = goodsTex(640, 460, (c, w, h, mix) => printOn(c, 0, 0, w, h, mix, '#e8e0d2'));
  const blanketFace = mesh(new THREE.PlaneGeometry(BWd - 0.018, BHt - 0.016),
    std(0xffffff, { map: blanketTex, roughness: 0.9, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { cast: false });
  blanketFace.position.z = (BDp / 3 + 0.004) / 2 + 0.0012; blanket.add(blanketFace);
  // A rolled fold along the bottom edge so it reads as cloth, not a board.
  const roll = mesh(new THREE.CapsuleGeometry(BDp * 0.5, BWd - 0.03, 6, 16), fleece);
  roll.rotation.z = Math.PI / 2; roll.position.set(0.0015, -BHt / 2 + 0.006, -BDp / 3); blanket.add(roll);

  // Pillow: a plump square with the photo cropped on its face.
  const pillow = new THREE.Group(); goodsG.add(pillow);
  const pillowBody = mesh(new RoundedBoxGeometry(0.135, 0.135, 0.055, 5, 0.026), std(0xf0ebe3, { roughness: 0.85 }));
  pillowBody.scale.z = 0.9; pillow.add(pillowBody);
  const pillowTex = goodsTex(420, 420, (c, w, h, mix) => printOn(c, 0, 0, w, h, mix, '#f0ebe3'));
  const pillowFace = mesh(new THREE.PlaneGeometry(0.108, 0.108),
    std(0xffffff, { map: pillowTex, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { cast: false });
  pillowFace.position.z = 0.0255; pillow.add(pillowFace);

  const ITEMS = [
    // group, final local position, final rotation (x, y, z), when it rises, when its photo prints
    { g: blanket, at: [0.0, 0.04, -0.03], rot: [-0.06, 0.0, 0.0], up: 5.75, ink: 6.55 },
    { g: mug, at: [-0.165, -0.035, 0.07], rot: [0.05, 0.42, 0.0], up: 5.9, ink: 6.85 },
    { g: pillow, at: [0.165, -0.02, 0.05], rot: [-0.04, -0.38, 0.06], up: 6.05, ink: 7.15 },
  ];
  const drawGoods = (t) => goods.forEach((g, i) => {
    const mix = eio(k(t, ITEMS[i].ink, ITEMS[i].ink + 0.85));
    const key = String(Math.round(mix * 40));
    if (key === g.key) return; g.key = key;
    g.ct.redraw((c, w, h) => g.draw(c, w, h, mix));
  });
  const printGlow = glow(0xff9a5a, 1.2, 0, 0.5); printGlow.position.z = -0.12; printGlow.scale.set(1.5, 0.95, 1); goodsG.add(printGlow);

  // A 35 mm canister on the counter, for scale and for film.
  const can = new THREE.Group(); can.position.set(-0.08, 0, 0.42); scene.add(can);
  const canB = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.09, 28), std(0xb9bec6, { metalness: 1, roughness: 0.3 })); canB.position.y = 0.053; can.add(canB);
  const canL = mesh(new THREE.CylinderGeometry(0.0345, 0.0345, 0.05, 28), std(GREEN_H, { roughness: 0.35 })); canL.position.y = 0.053; can.add(canL);
  const leader = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.002), std(0x241a14, { roughness: 0.6 })); leader.position.set(0.06, 0.053, 0.022); leader.rotation.y = -0.3; can.add(leader);


  // ----------------------------------------------------------- the print
  // The shot slides out of the top of the camera as a print, develops from dark to the lake, and sails
  // into the mailer.
  const PW = 0.11, PH = 0.074;
  const printG = new THREE.Group(); printG.rotation.order = 'YXZ'; scene.add(printG);
  const printTex = canvasTex(440, 296);
  let printKey = '';
  const drawPrint = (dev) => {
    const key = String(Math.round(dev * 40)); if (key === printKey) return; printKey = key;
    printTex.redraw((c, w, h) => {
      c.fillStyle = '#f6f2ea'; c.fillRect(0, 0, w, h);
      const b = w * 0.035, iw = w - 2 * b, ih = h - 2 * b;
      c.fillStyle = '#26170f'; c.fillRect(b, b, iw, ih);
      if (dev > 0) {
        c.save(); c.globalAlpha = dev; const sc = Math.max(iw / IW, ih / IH);
        c.beginPath(); c.rect(b, b, iw, ih); c.clip();
        c.drawImage(photo.cv, b + (iw - IW * sc) / 2, b + (ih - IH * sc) / 2, IW * sc, IH * sc); c.restore();
        c.fillStyle = `rgba(255,150,70,${0.4 * dev * (1 - dev) * 2})`; c.fillRect(b, b, iw, ih);
      }
    });
  };
  const printFront = mesh(new THREE.PlaneGeometry(PW, PH), std(0xffffff, { map: printTex.tex, roughness: 0.3 }), { cast: false });
  printFront.position.z = 0.0006; printG.add(printFront);
  const printBack = mesh(new THREE.PlaneGeometry(PW, PH), std(0xefe9de, { roughness: 0.8 }));
  printBack.rotation.y = Math.PI; printBack.position.z = -0.0006; printG.add(printBack);
  const printHalo = glow(0xffb070, 0.32, 0, 0.5); printHalo.position.z = -0.02; printG.add(printHalo);
  // Where the top of the camera sits once it is raised, and where the print hovers before it flies.
  shooter.position.copy(SHOOT); shooter.rotation.set(0, 0.06, -0.03); shooter.updateMatrixWorld();
  const P0 = shooter.localToWorld(V(0, 0, 0)), P1 = shooter.localToWorld(V(0, DH / 2 + PH / 2 + 0.004, 0));
  const P2 = P1.clone().add(V(0.03, 0.07, 0.07));

  // ----------------------------------------------------------- title
  const kicker = label('Fujifilm', { font: `700 56px ${MONO}`, fg: '#7fe0b0', h: 0.1, track: 6 });
  const title = label('Direct-to-consumer platform', { font: `800 72px ${SANS}`, fg: '#fbf1e2', h: 0.13, track: 1 });
  const line = label('A store concept for modern film buyers', { font: `600 54px ${SANS}`, fg: '#f2d2b0', bg: 'rgba(29,18,22,0.72)', h: 0.1, pad: 30 });
  [kicker, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });

  // ----------------------------------------------------------- dust
  const DN = 140, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd2a0, size: 0.009, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.4, 0.86, 1.86]], [1.6, [-0.37, 0.84, 1.8], L],
    [2.6, [-0.05, 0.82, 1.86]], [3.5, [0.5, 0.78, 1.62]],
    [5.3, [0.86, 0.66, 1.5], L], [6.9, [0.6, 0.7, 1.95]],
    [8.2, [0.5, 0.8, 2.5]], [10, [0.46, 0.81, 2.58], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.32, 0.62, -0.4]], [1.6, [-0.3, 0.62, -0.36], L],
    [2.6, [0.05, 0.5, 0.4]], [3.5, [0.6, 0.18, 0.18]],
    [5.3, [0.66, 0.16, 0.22], L], [6.9, [0.55, 0.45, 0.3]],
    [8.2, [0.5, 0.64, 0.1]], [10, [0.49, 0.64, 0.1], L],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), mid = new THREE.Vector3(), lk = new THREE.Vector3();
  const inBox = new THREE.Vector3(0, WALL + 0.004, 0.01);
  mailG.updateMatrixWorld();
  const LAND = mailG.localToWorld(inBox.clone());

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the hands raise the disposable, wind it, take the shot; the flash pops across the wall.
    const raise = back(k(t, 0.25, 1.0)), lower = ei(k(t, 2.55, 3.25));
    const flash = t > 1.5 ? Math.exp(-9 * (t - 1.5)) : 0;
    shooter.position.set(SHOOT.x, SHOOT.y - 0.32 * (1 - raise) - 0.42 * lower + Math.sin(t * 1.3) * 0.002 * clamp(raise), SHOOT.z + 0.05 * (1 - clamp(raise)));
    shooter.rotation.set(0.35 * (1 - clamp(raise)) + 0.4 * lower, 0.06, -0.03);
    shooter.visible = t > 0.2 && t < 3.3;
    rig.rotation.set(-0.03 * flash * Math.sin(t * 70), 0, 0.012 * flash * Math.sin(t * 55));
    rig.position.y = -0.003 * flash;
    const wind = Math.sin(Math.PI * k(t, 0.95, 1.3));
    wheel.rotation.y = -eio(k(t, 0.95, 1.3)) * 2.6;
    kV.copy(tKnk).x -= wind * 0.004; tV.set(DW / 2 - 0.016 - wind * 0.014, DH / 2 - 0.006, DD / 2 + 0.008);
    aim(thumbA, tBase, kV); aim(thumbB, kV, tV);
    const reach = eio(k(t, 1.2, 1.42)), press = Math.sin(Math.PI * k(t, 1.42, 1.62));
    kV.copy(iKnk).y += 0.01 * (1 - reach) - 0.002 * press;
    tV.set(DW * 0.3 + 0.004, DH / 2 + 0.008 + 0.014 * (1 - reach) - 0.003 * press, -0.006);
    aim(idxA, iBase, kV); aim(idxB, kV, tV);
    button.position.y = DH / 2 + 0.002 - 0.002 * press;
    const charge = eo(k(t, 0.6, 1.1)) * (t < 1.5 ? 1 : 0);
    ledM.color.setRGB(1.6 * charge * (0.8 + 0.2 * Math.sin(t * 18)), 0.12 * charge, 0.06 * charge);
    flashM.color.setRGB(0.55 + 7 * flash, 0.58 + 7 * flash, 0.61 + 7 * flash);
    flashGlow.material.opacity = 0.95 * flash; flashGlow.scale.setScalar(0.35 + 0.4 * flash);
    flashL.intensity = 28 * flash;
    wallHit.material.opacity = 0.55 * flash;

    // The print slides up out of the camera, develops, then sails into the mailer.
    const em = eo(k(t, 1.7, 2.15)), ho = eio(k(t, 2.1, 2.55)), fly = eio(k(t, 2.55, 3.35));
    drawPrint(eio(k(t, 1.95, 2.8)));
    if (fly <= 0) {
      a.lerpVectors(P0, P1, em).add(mid.subVectors(P2, P1).multiplyScalar(ho));
      printG.position.copy(a);
      printG.rotation.set(0.05 * ho * Math.sin(t * 3), 0.06 - 0.31 * ho, -0.03 + 0.06 * ho * Math.sin(t * 2.4));
      printG.scale.setScalar(1);
    } else {
      mid.lerpVectors(P2, LAND, 0.5); mid.y = 0.78;
      a.set(
        (1 - fly) * (1 - fly) * P2.x + 2 * (1 - fly) * fly * mid.x + fly * fly * LAND.x,
        (1 - fly) * (1 - fly) * P2.y + 2 * (1 - fly) * fly * mid.y + fly * fly * LAND.y,
        (1 - fly) * (1 - fly) * P2.z + 2 * (1 - fly) * fly * mid.z + fly * fly * LAND.z,
      );
      const bounce = t > 3.35 ? Math.abs(Math.sin((t - 3.35) * 12)) * Math.exp(-7 * (t - 3.35)) * 0.025 : 0;
      printG.position.copy(a); printG.position.y += bounce;
      printG.rotation.set(lerp(0, -Math.PI / 2, fly), lerp(-0.25, -0.22, fly), Math.sin(Math.PI * fly) * 0.7);
      printG.scale.setScalar(lerp(1, 1.5, fly));
    }
    printHalo.material.opacity = 0.5 * Math.sin(Math.PI * k(t, 1.75, 3.2));
    printG.visible = t > 1.68 && t < 4.0;

    // Beat 2: lid slams, tape seals, the mailer spins away into golden hour.
    const shut = spring(k(t, 3.45, 4.05));
    const reopen = back(k(t, 5.4, 5.95));
    lidHinge.rotation.x = -1.95 * (1 - shut) - 1.95 * clamp(reopen, 0, 1.2) * (t > 5.4 ? 1 : 0);
    const tape = eo(k(t, 3.95, 4.35));
    tapeTop.scale.z = Math.max(0.001, tape); tapeTop.visible = tape > 0.01;
    tapeFront.scale.y = Math.max(0.001, eo(k(t, 4.25, 4.45))); tapeFront.visible = t > 4.25;
    const slam = t > 3.62 ? Math.exp(-6 * (t - 3.62)) : 0;
    puffs.forEach((g, i) => {
      const s = k(t, 3.62, 4.4), ang = i * Math.PI / 2 + 0.6;
      g.position.set(Math.cos(ang) * (0.24 + s * 0.12), 0.05 + s * 0.05, Math.sin(ang) * (0.18 + s * 0.1));
      g.scale.setScalar(0.12 + s * 0.22); g.material.opacity = t > 3.62 ? 0.4 * (1 - s) : 0;
    });
    const trip = eio(k(t, 4.45, 5.35));
    mailG.rotation.y = -0.22 + trip * Math.PI * 2;
    mailG.position.set(MAIL.x, Math.sin(Math.PI * trip) * 0.07 + slam * 0.01, MAIL.z);
    const gold = eo(k(t, 4.4, 5.6));
    key.color.copy(KEY_A).lerp(KEY_B, gold);
    key.intensity = 34 - gold * 6;
    key.position.set(lerp(-1.3, -1.9, gold), lerp(2.5, 1.7, gold), 2.1);
    rim.intensity = 1.3 + gold * 0.5;

    // Beat 3: the lid pops, light spills out, and the personalized goods rise out one after another.
    const spill = eo(k(t, 5.45, 5.9)) * (1 - 0.6 * eo(k(t, 6.4, 7.6)));
    boxLight.intensity = 2.4 * spill; boxGlow.material.opacity = 0.7 * spill;
    goodsG.position.set(HOVER.x, HOVER.y + Math.sin(t * 1.6) * 0.006, HOVER.z);
    goodsG.rotation.set(0, -0.06 + Math.sin(t * 0.9) * 0.025, 0);
    goodsG.scale.setScalar(lerp(1.0, GOODS_GROW, eio(k(t, 6.0, 7.4))));
    goodsG.updateMatrixWorld();
    const from = goodsG.worldToLocal(fromV.set(MAIL.x, 0.07, MAIL.z));
    ITEMS.forEach((it, i) => {
      const rise = back(k(t, it.up, it.up + 1.0));
      it.g.position.set(lerp(from.x, it.at[0], clamp(rise)), lerp(from.y, it.at[1], rise), lerp(from.z, it.at[2], clamp(rise)));
      it.g.position.y += Math.sin(t * 1.3 + i * 2.1) * 0.004 * clamp(rise);
      it.g.rotation.set(lerp(-1.2, it.rot[0], clamp(rise)), lerp(0.9 - i * 0.6, it.rot[1], clamp(rise)) + Math.sin(t * 0.8 + i) * 0.03 * clamp(rise), lerp(0.4, it.rot[2], clamp(rise)));
      it.g.scale.setScalar(lerp(0.55, 1, eo(clamp(rise))));
      it.g.visible = t > it.up - 0.05;
    });
    drawGoods(t);
    const dev = eio(k(t, 6.6, 8.0));
    printGlow.material.color.setRGB(lerp(1, 0.6, dev), lerp(0.42, 0.75, dev), lerp(0.2, 0.9, dev));
    printGlow.material.opacity = 0.42 * eo(k(t, 6.2, 7.0)) * (1 - 0.3 * dev) + 0.25 * Math.exp(-3 * Math.max(0, t - 8.1)) * (t > 8.1 ? 1 : 0);

    // The wall dims a touch as the goods take over the frame.
    const dim = 1 - 0.45 * eo(k(t, 6.0, 7.5));
    stripM.color.setRGB(1 * dim, 0.79 * dim, 0.54 * dim);
    stripGlows.forEach((g) => { g.material.opacity = 0.22 * dim; });
    shelfLight.intensity = 1.6 * dim;

    // Beat 4: the title over the finished goods.
    const ti = eo(k(t, 7.75, 8.35)), li = eo(k(t, 8.05, 8.65)), to = ei(k(t, 9.25, 9.6));
    lk.copy(camera.position); lk.y = 1.0;
    [[kicker, 1.07, ti], [title, 0.96, ti], [line, 0.835, li]].forEach(([l, y, al]) => {
      l.position.set(0.5, y + (1 - al) * 0.04, 0.42); l.lookAt(lk);
      l.material.opacity = al * (1 - to); l.visible = al > 0.01;
    });

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.5 + rnd(i, 51) * 3 + Math.sin(t * 0.3 + i) * 0.1;
      dpos[i * 3 + 1] = 0.05 + rnd(i, 52) * 1.4 + Math.sin(t * 0.42 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -0.4 + rnd(i, 53) * 1.6 + Math.cos(t * 0.22 + i) * 0.08;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
