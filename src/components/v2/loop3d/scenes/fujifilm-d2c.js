// Fujifilm direct-to-consumer platform lit loop, 10 s. "Pick the film, get the prints."
// A film boutique after hours: a walnut wall of cubbies lit by warm strips, each holding a film box.
// One box slides out with a little hitch, spins to the camera and drops into a kraft mailer on the
// stone counter. The lid slams, green tape seals it, and the mailer spins away as the light turns to
// golden hour. The lid pops again, warm light spills out, and a print rises out as an orange negative,
// then develops into a clear mountain lake while the title settles above it.
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
const HERO = [2, 1];                               // column, row of the box that gets picked
const BOX = [0.16, 0.22, 0.1];
const BOX_COLS = [0x1f8a4c, 0xb8235a, 0x1e5aa8, 0xd99a1e, 0xc23a2b, 0x5a3e9a, 0x2a9a8a, 0x1f8a4c, 0xd99a1e, 0x1e5aa8, 0xb8235a, 0x2a9a8a, 0xc23a2b, 0x1f8a4c, 0x5a3e9a];
const MAIL = new THREE.Vector3(0.66, 0, 0.24);
const MW = 0.44, MH = 0.12, MD = 0.32, WALL = 0.008;
const HOVER = new THREE.Vector3(0.5, 0.52, 0.5), PRINT_GROW = 1.75;

const cellPos = (c, r, out = new THREE.Vector3()) => out.set(SH.x - (COLS * CW) / 2 + CW / 2 + c * CW, SH.y + BOARD / 2 + r * CH + BOX[1] / 2, SH.z + 0.01);

// The print: a mountain lake on a clear day, with a red canoe. Drawn once; the negative is derived from it.
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
function drawDecal(c, w, h, hero) {
  c.clearRect(0, 0, w, h);
  if (hero) {
    c.fillStyle = GREEN; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }
  c.fillStyle = '#f2efe8'; c.fillRect(0, h * 0.56, w, h * 0.2);
  c.fillStyle = '#16181b'; c.fillRect(w * 0.08, h * 0.6, w * 0.84, h * 0.12);
  c.fillStyle = '#f2efe8';
  for (let i = 0; i < 7; i++) { c.fillRect(w * 0.12 + i * w * 0.115, h * 0.612, w * 0.05, h * 0.022); c.fillRect(w * 0.12 + i * w * 0.115, h * 0.686, w * 0.05, h * 0.022); }
  c.fillStyle = 'rgba(242,239,232,0.92)'; roundRect(c, w * 0.1, h * 0.1, w * 0.36, h * 0.06, h * 0.03); c.fill();
  roundRect(c, w * 0.1, h * 0.2, w * 0.56, h * 0.035, h * 0.017); c.fill();
  if (hero) {
    c.fillStyle = '#f2efe8'; c.beginPath(); c.arc(w * 0.74, h * 0.34, w * 0.12, 0, 7); c.fill();
    c.fillStyle = GREEN; c.beginPath(); c.arc(w * 0.74, h * 0.34, w * 0.06, 0, 7); c.fill();
  }
  c.fillStyle = hero ? 'rgba(242,239,232,0.9)' : 'rgba(242,239,232,0.6)'; c.fillRect(0, h * 0.9, w, h * 0.02);
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
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (!(c === HERO[0] && r === HERO[1])) cells.push([c, r]);
  const boxIM = new THREE.InstancedMesh(new THREE.BoxGeometry(...BOX), std(0xffffff, { roughness: 0.42 }), cells.length);
  const decalTex = canvasTex(128, 176, (c, w, h) => drawDecal(c, w, h, false)).tex;
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

  // The hero box.
  const hero = new THREE.Group(); hero.rotation.order = 'YXZ'; scene.add(hero);
  hero.add(mesh(new THREE.BoxGeometry(...BOX), std(GREEN_H, { roughness: 0.38 })));
  const heroDecal = canvasTex(256, 352, (c, w, h) => drawDecal(c, w, h, true)).tex;
  const hFace = new THREE.Mesh(new THREE.PlaneGeometry(BOX[0], BOX[1]), std(0xffffff, { map: heroDecal, roughness: 0.35, emissive: 0xffffff, emissiveMap: heroDecal, emissiveIntensity: 0 }));
  hFace.position.z = BOX[2] / 2 + 0.001; hFace.receiveShadow = true; hero.add(hFace);
  const heroGlow = glow(0x6affb0, 0.8, 0, 0.45); heroGlow.position.z = -0.06; hero.add(heroGlow);
  const home = cellPos(HERO[0], HERO[1]);
  const out = new THREE.Vector3(home.x + 0.04, home.y + 0.1, -0.12);

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

  // ----------------------------------------------------------- the print
  const PW = 0.3, PHT = 0.212;
  const IW = 704, IH = 480;
  const pos = canvasTex(IW, IH, drawLake);
  const neg = canvasTex(IW, IH, (c, w, h) => {
    c.drawImage(pos.cv, 0, 0);
    const img = c.getImageData(0, 0, w, h), d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const r = 255 - d[i], g = 255 - d[i + 1], b = 255 - d[i + 2];
      d[i] = 70 + r * 0.66; d[i + 1] = 34 + g * 0.5; d[i + 2] = 12 + b * 0.34;
    }
    c.putImageData(img, 0, 0);
  });
  const printTex = canvasTex(768, 544);
  let prKey = '';
  const drawPrint = (t) => {
    const veil = eo(k(t, 6.0, 6.6)), mix = eio(k(t, 6.7, 8.1));
    const key2 = Math.round(veil * 20) + '|' + Math.round(mix * 48);
    if (key2 === prKey) return; prKey = key2;
    printTex.redraw((c, w, h) => {
      c.fillStyle = '#ebe5da'; c.fillRect(0, 0, w, h);
      const bx = 32, by = 32;
      c.globalAlpha = 1; c.drawImage(neg.cv, bx, by);
      c.globalAlpha = mix; c.drawImage(pos.cv, bx, by);
      c.globalAlpha = 1;
      c.fillStyle = `rgba(28,18,14,${0.85 * (1 - veil)})`; c.fillRect(bx, by, IW, IH);
    });
  };
  const printG = new THREE.Group(); printG.rotation.order = 'YXZ'; scene.add(printG);
  printG.add(mesh(new THREE.BoxGeometry(PW + 0.004, PHT + 0.004, 0.003), std(0xd8d2c8, { roughness: 0.6 })));
  const printFace = new THREE.Mesh(new THREE.PlaneGeometry(PW, PHT), std(0xd4cdc2, { map: printTex.tex, emissive: 0xffffff, emissiveMap: printTex.tex, emissiveIntensity: 0.25, roughness: 0.32 }));
  printFace.position.z = 0.0021; printG.add(printFace);
  const printGlow = glow(0xff9a5a, 1.2, 0, 0.5); printGlow.position.z = -0.08; printGlow.scale.set(1.3, 0.95, 1); printG.add(printGlow);

  // A 35 mm canister on the counter, for scale and for film.
  const can = new THREE.Group(); can.position.set(-0.08, 0, 0.42); scene.add(can);
  const canB = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.09, 28), std(0xb9bec6, { metalness: 1, roughness: 0.3 })); canB.position.y = 0.053; can.add(canB);
  const canL = mesh(new THREE.CylinderGeometry(0.0345, 0.0345, 0.05, 28), std(GREEN_H, { roughness: 0.35 })); canL.position.y = 0.053; can.add(canL);
  const leader = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.002), std(0x241a14, { roughness: 0.6 })); leader.position.set(0.06, 0.053, 0.022); leader.rotation.y = -0.3; can.add(leader);

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
    [0, [-0.42, 0.78, 1.72]], [1.2, [-0.36, 0.76, 1.62], L],
    [2.3, [-0.02, 0.74, 1.72]], [3.5, [0.5, 0.78, 1.62]],
    [5.3, [0.86, 0.66, 1.5], L], [6.9, [0.6, 0.7, 1.95]],
    [8.2, [0.5, 0.8, 2.5]], [10, [0.46, 0.81, 2.58], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.3, 0.64, -0.45]], [1.2, [-0.3, 0.64, -0.4], L],
    [2.3, [0.0, 0.58, -0.2]], [3.5, [0.6, 0.18, 0.18]],
    [5.3, [0.66, 0.16, 0.22], L], [6.9, [0.55, 0.45, 0.3]],
    [8.2, [0.5, 0.64, 0.1]], [10, [0.49, 0.64, 0.1], L],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), mid = new THREE.Vector3(), lk = new THREE.Vector3();
  const inBox = new THREE.Vector3(0, WALL + BOX[2] / 2, 0.02);
  mailG.updateMatrixWorld();
  const LAND = mailG.localToWorld(inBox.clone());

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the hero box hitches back, slides out, spins to camera.
    const hitch = Math.sin(Math.PI * k(t, 0.85, 1.05)) * 0.025;
    const slide = back(k(t, 1.05, 1.7));
    const spin = back(k(t, 1.4, 2.25));
    const fly = eio(k(t, 2.4, 3.3));
    if (fly <= 0) {
      const bob = clamp(slide) * (1 - k(t, 2.0, 2.4));
      hero.position.set(lerp(home.x, out.x, clamp(slide)), lerp(home.y, out.y, eo(k(t, 1.3, 1.85))) + Math.sin(t * 2.2) * 0.008 * bob, lerp(home.z, out.z, slide) - hitch);
      hero.rotation.set(-0.06 * clamp(slide), spin * Math.PI * 2 - 0.25 * clamp(slide), 0.04 * Math.sin(t * 1.7) * bob);
    } else {
      mid.lerpVectors(out, LAND, 0.5); mid.y = 0.62;
      a.set(
        (1 - fly) * (1 - fly) * out.x + 2 * (1 - fly) * fly * mid.x + fly * fly * LAND.x,
        (1 - fly) * (1 - fly) * out.y + 2 * (1 - fly) * fly * mid.y + fly * fly * LAND.y,
        (1 - fly) * (1 - fly) * out.z + 2 * (1 - fly) * fly * mid.z + fly * fly * LAND.z,
      );
      const bounce = t > 3.3 ? Math.abs(Math.sin((t - 3.3) * 12)) * Math.exp(-7 * (t - 3.3)) * 0.04 : 0;
      hero.position.copy(a); hero.position.y += bounce;
      hero.rotation.set(lerp(-0.06, -Math.PI / 2, fly), lerp(Math.PI * 2 - 0.25, Math.PI * 2 + mailG.rotation.y, fly), 0);
    }
    hFace.material.emissiveIntensity = 0.25 * Math.sin(Math.PI * k(t, 1.1, 3.3));
    heroGlow.material.opacity = 0.55 * Math.sin(Math.PI * k(t, 1.05, 3.2));
    hero.visible = t < 4.0;

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

    // Beat 3: the lid pops, light spills out, a print rises as a negative.
    const spill = eo(k(t, 5.45, 5.9)) * (1 - 0.6 * eo(k(t, 6.4, 7.6)));
    boxLight.intensity = 2.4 * spill; boxGlow.material.opacity = 0.7 * spill;
    const rise = back(k(t, 5.75, 6.85));
    const start = a.set(MAIL.x, 0.07, MAIL.z);
    printG.position.set(lerp(start.x, HOVER.x, clamp(rise)), lerp(start.y, HOVER.y, rise) + Math.sin(t * 1.6) * 0.008 * clamp(rise), lerp(start.z, HOVER.z, clamp(rise)));
    printG.rotation.set(lerp(-Math.PI / 2, -0.08, clamp(rise)), lerp(0.6, -0.12, clamp(rise)) + Math.sin(t * 0.9) * 0.03, lerp(0.3, 0.0, clamp(rise)));
    printG.scale.setScalar(lerp(1, PRINT_GROW, eio(k(t, 6.0, 7.2))));
    printG.visible = t > 5.7;
    drawPrint(t);
    const dev = eio(k(t, 6.7, 8.1));
    printFace.material.emissiveIntensity = 0.12 + 0.3 * eo(k(t, 6.0, 6.6));
    printGlow.material.color.setRGB(lerp(1, 0.5, dev), lerp(0.42, 0.78, dev), lerp(0.2, 1, dev));
    printGlow.material.opacity = 0.42 * eo(k(t, 6.2, 7.0)) * (1 - 0.3 * dev) + 0.25 * Math.exp(-3 * Math.max(0, t - 8.1)) * (t > 8.1 ? 1 : 0);

    // The wall dims a touch as the print takes over the frame.
    const dim = 1 - 0.45 * eo(k(t, 6.0, 7.5));
    stripM.color.setRGB(1 * dim, 0.79 * dim, 0.54 * dim);
    stripGlows.forEach((g) => { g.material.opacity = 0.22 * dim; });
    shelfLight.intensity = 1.6 * dim;

    // Beat 4: the title over the finished print.
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
