// Honeywell cart and checkout lit loop, 10 s. "Add one, paste fifty, check out."
// A steel packing bench in a building-technology warehouse at dawn: pallet racking fades into the haze
// behind, high-bay lamps overhead, a roll-up dock door at the far end. Shopping cart: a thermostat, a
// valve actuator and a controller each get their add button pressed and hop into the tote while the
// cart card counts 1, 2, 3. Quick cart: a bulk list is pasted in, its three lines fly into the cart, and
// forty-five cartons rain onto the pallet as every row counts up and the badge climbs to 48. Checkout:
// the steps fill, the load is stretch-wrapped, the dock door rolls up into morning light, and a red
// check lands over the pallet.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const RED = '#e4002b';
// The three lines of the cart, the quantities the paste adds, and the parts they stand for.
const ITEMS = [
  { code: 'TS-210', add: 20, x: -1.06 },
  { code: 'VL-14', add: 15, x: -0.74 },
  { code: 'CT-08', add: 10, x: -0.42 },
];
const ADD = [0.95, 1.6, 2.25];                // add button pressed
const HOP = 0.55;                              // hop into the tote
const IN = ADD.map((a) => a + 0.12 + HOP);    // landed in the tote
const TOTE = [0.02, 0, 0.14];
const PAL = [0.66, 0, 0.02];                   // pallet
const PASTE = 3.45;                            // the bulk list lands in Quick cart
const SEND = [3.85, 4.0, 4.15];                // each pasted line leaves for the cart
const NC = 45, CB = 0.088;                     // cartons and their size
const dropT = (i) => 4.25 + i * 0.027;         // carton i starts to fall
const DROP = 0.3;
const STEP = [6.05, 6.5, 6.95, 7.4];           // checkout steps fill
const rowOf = (i) => (i < 20 ? 0 : i < 35 ? 1 : 2);

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x10151b);
  scene.fog = new THREE.Fog(0x10151b, 3.2, 9.5);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- warehouse
  const FLOOR_Y = -0.86;
  const floor = mesh(new THREE.PlaneGeometry(14, 14), std(0xffffff, { map: grainTex('#3a3f45', { size: 256, speck: 0.12, blot: 0.1, seed: 21, repeat: 7 }), roughness: 0.32, metalness: 0.15 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR_Y; scene.add(floor);
  const stripe = mesh(new THREE.PlaneGeometry(0.08, 9), std(0xd8b02a, { roughness: 0.5 }), { cast: false });
  stripe.rotation.x = -Math.PI / 2; stripe.position.set(-1.2, FLOOR_Y + 0.002, -3); scene.add(stripe);
  const backWall = mesh(new THREE.PlaneGeometry(10, 5), std(0xffffff, { map: grainTex('#2a3038', { size: 256, speck: 0.06, blot: 0.12, seed: 22, repeat: 2 }), roughness: 0.9 }), { cast: false });
  backWall.position.set(0, 1.4, -5.6); scene.add(backWall);
  // The dock door: morning waits behind it.
  const DOOR = [0.55, FLOOR_Y + 0.8, -5.58];
  const dayM = new THREE.MeshBasicMaterial({ color: 0xffc489, toneMapped: false, fog: false });
  const day = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.6), dayM); day.position.set(DOOR[0], DOOR[1], DOOR[2] - 0.01); scene.add(day);
  const slats = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#5b636d'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, y, w, 3); c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, y + 4, w, 2); }
  }).tex;
  const door = mesh(new THREE.PlaneGeometry(1.72, 1.62), std(0xffffff, { map: slats, roughness: 0.6, metalness: 0.5 }), { cast: false });
  door.position.set(DOOR[0], DOOR[1], DOOR[2] + 0.01); scene.add(door);
  const dayGlow = glow(0xffb070, 3.2, 0, 0.35); dayGlow.position.set(DOOR[0], DOOR[1], DOOR[2] + 0.3); dayGlow.material.fog = false; scene.add(dayGlow);

  // Pallet racking down both sides of the aisle, stocked, fading into the haze.
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const posts = [], beams = [], stock = [];
  [-2.0, 2.1].forEach((sx) => {
    for (let b = 0; b <= 4; b++) [0, 0.8].forEach((dz) => posts.push([sx + (sx < 0 ? -dz : dz), -1.4 - b * 1.05]));
    for (let b = 0; b < 4; b++) for (let lv = 0; lv < 3; lv++) {
      [0, 0.8].forEach((dz) => beams.push([sx + (sx < 0 ? -dz : dz), FLOOR_Y + 0.55 + lv * 0.75, -1.4 - b * 1.05 - 0.525]));
      for (let n = 0; n < 3; n++) if (rnd(b * 9 + lv * 3 + n, sx > 0 ? 2 : 1) > 0.25) stock.push([sx + (sx < 0 ? -0.4 : 0.4), FLOOR_Y + 0.55 + lv * 0.75 + 0.2, -1.4 - b * 1.05 - 0.2 - n * 0.32, rnd(n, b + lv)]);
    }
  });
  const postI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 2.4, 0.07), std(0x2f5f9a, { metalness: 0.5, roughness: 0.45 }), posts.length);
  posts.forEach(([x, z], i) => { m4.makeTranslation(x, FLOOR_Y + 1.2, z); postI.setMatrixAt(i, m4); });
  const beamI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.09, 1.05), std(0xd8642a, { metalness: 0.4, roughness: 0.5 }), beams.length);
  beams.forEach(([x, y, z], i) => { m4.makeTranslation(x, y, z); beamI.setMatrixAt(i, m4); });
  const kraft = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#b48a5a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${rnd(i, 1) > 0.5 ? 255 : 60},${rnd(i, 1) > 0.5 ? 230 : 40},${rnd(i, 1) > 0.5 ? 200 : 20},${rnd(i, 2) * 0.12})`; c.fillRect(rnd(i, 3) * w, rnd(i, 4) * h, 2, 2); }
    c.fillStyle = 'rgba(150,110,70,0.55)'; c.fillRect(w * 0.42, 0, w * 0.16, h);
    c.fillStyle = '#efe9df'; c.fillRect(w * 0.1, h * 0.62, w * 0.26, h * 0.2);
    c.fillStyle = '#222'; for (let b = 0; b < 9; b++) c.fillRect(w * 0.12 + b * 6, h * 0.66, 2 + (b % 3), h * 0.1);
    c.fillStyle = RED; c.fillRect(w * 0.1, h * 0.12, w * 0.12, h * 0.12);
  });
  const stockI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.62, 0.4, 0.28), std(0xffffff, { map: kraft.tex, roughness: 0.85 }), stock.length);
  stock.forEach(([x, y, z, r], i) => { q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (r - 0.5) * 0.1); m4.compose(p4.set(x, y, z), q4, s4.set(1, 0.8 + r * 0.4, 1)); stockI.setMatrixAt(i, m4); });
  [postI, beamI, stockI].forEach((m) => { m.castShadow = false; m.receiveShadow = true; scene.add(m); });
  // High-bay lamps.
  [[-1.0, -1.6], [1.1, -2.4], [-1.0, -3.6], [1.1, -4.6]].forEach(([x, z]) => { const g = glow(0xdfe9ff, 0.9, 0.55, 0.3); g.position.set(x, 2.6, z); scene.add(g); });

  // ----------------------------------------------------------- the bench
  const steel = std(0x737a83, { metalness: 0.85, roughness: 0.36 });
  const bench = mesh(new RoundedBoxGeometry(2.75, 0.05, 0.98, 2, 0.012), steel);
  bench.position.set(-0.1, -0.025, 0.05); scene.add(bench);
  const legI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.82, 0.05), std(0x3d434b, { metalness: 0.7, roughness: 0.4 }), 4);
  [[-1.4, -0.38], [1.2, -0.38], [-1.4, 0.48], [1.2, 0.48]].forEach(([x, z], i) => { m4.makeTranslation(x, -0.46, z); legI.setMatrixAt(i, m4); });
  legI.castShadow = true; scene.add(legI);
  // Display pucks the parts sit on.
  const pucks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.115, 0.024, 36), std(0x1d2127, { metalness: 0.4, roughness: 0.3 }), 3);
  ITEMS.forEach((it, i) => { m4.makeTranslation(it.x, 0.012, 0.22); pucks.setMatrixAt(i, m4); });
  pucks.receiveShadow = true; scene.add(pucks);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x9fb2cc, 0x241f1a, 0.32));
  const key = new THREE.SpotLight(0xe8f0ff, 30, 0, 0.62, 0.7, 1.4);
  key.position.set(-0.6, 2.7, 1.4); key.target.position.set(-0.1, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1.2; key.shadow.camera.far = 6; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rimCool = new THREE.DirectionalLight(0x8fb4ff, 0.7); rimCool.position.set(-2.4, 1.6, -2.5); scene.add(rimCool);
  const dawn = new THREE.DirectionalLight(0xffb070, 0.25); dawn.position.set(DOOR[0], 1.2, -5); dawn.target.position.set(0.2, 0, 0.2); scene.add(dawn, dawn.target);
  const checkL = new THREE.PointLight(0xff2a4a, 0, 1.6, 2); scene.add(checkL);

  // ----------------------------------------------------------- the three parts
  const off = std(0xc9ccd0, { roughness: 0.42 });
  const dark = std(0x2b2f35, { roughness: 0.4, metalness: 0.3 });
  const parts = [];
  { // Thermostat: a round face on a small stand.
    const g = new THREE.Group();
    const body = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.034, 48), off); body.rotation.x = Math.PI / 2; g.add(body);
    const faceT = canvasTex(256, 256, (c, w) => {
      c.fillStyle = '#14181d'; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 14; c.beginPath(); c.arc(w / 2, w / 2, 92, Math.PI * 0.75, Math.PI * 2.25); c.stroke();
      c.strokeStyle = '#ff7a2a'; c.beginPath(); c.arc(w / 2, w / 2, 92, Math.PI * 0.75, Math.PI * 1.6); c.stroke();
      c.fillStyle = '#ff9a5a'; c.beginPath(); c.arc(w / 2 + Math.cos(Math.PI * 1.6) * 92, w / 2 + Math.sin(Math.PI * 1.6) * 92, 12, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.5)'; roundRect(c, w / 2 - 34, w / 2 - 8, 68, 16, 8); c.fill();
    }).tex;
    const face = new THREE.Mesh(new THREE.CircleGeometry(0.068, 48), std(0xffffff, { map: faceT, emissive: 0xffffff, emissiveMap: faceT, emissiveIntensity: 0.5, roughness: 0.15 }));
    face.position.z = 0.0175; g.add(face);
    const stand = mesh(new THREE.BoxGeometry(0.07, 0.03, 0.05), dark); stand.position.set(0, -0.09, -0.005); g.add(stand);
    g.userData = { rest: 0.105, h: 0.2 };
    parts.push(g);
  }
  { // Valve actuator: a dark housing over a brass valve.
    const g = new THREE.Group();
    const box = mesh(new RoundedBoxGeometry(0.13, 0.09, 0.1, 2, 0.012), dark); box.position.y = 0.06; g.add(box);
    const valve = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 24), std(0xb88a3e, { metalness: 1, roughness: 0.3 })); valve.rotation.z = Math.PI / 2; valve.position.y = -0.04; g.add(valve);
    const neck = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 12), std(0x9aa0a8, { metalness: 1, roughness: 0.3 })); neck.position.y = 0.0; g.add(neck);
    const tag = mesh(new THREE.BoxGeometry(0.06, 0.012, 0.003), std(RED, { roughness: 0.4, emissive: RED, emissiveIntensity: 0.25 })); tag.position.set(0, 0.075, 0.051); g.add(tag);
    g.userData = { rest: 0.075, h: 0.2 };
    parts.push(g);
  }
  { // Controller: a module with a terminal strip and a status LED.
    const g = new THREE.Group();
    const faceT = canvasTex(320, 220, (c, w, h) => {
      c.fillStyle = '#c8ccd1'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2b2f35'; c.fillRect(0, 0, w, 40); c.fillRect(0, h - 40, w, 40);
      c.fillStyle = '#9aa1aa'; for (let i = 0; i < 10; i++) { c.fillRect(14 + i * 30, 10, 18, 20); c.fillRect(14 + i * 30, h - 30, 18, 20); }
      c.fillStyle = '#1b1f24'; roundRect(c, 30, 64, 150, 90, 10); c.fill();
      c.fillStyle = '#3aa0ff'; roundRect(c, 42, 76, 70, 12, 6); c.fill(); c.fillStyle = 'rgba(58,160,255,0.5)'; roundRect(c, 42, 100, 110, 12, 6); c.fill();
      c.fillStyle = RED; c.fillRect(220, 70, 60, 14);
    }).tex;
    const box = mesh(new RoundedBoxGeometry(0.17, 0.115, 0.055, 2, 0.008), std(0xffffff, { map: faceT, roughness: 0.45 })); g.add(box);
    const led = glow(0x55ff9a, 0.06, 0.9, 0.3); led.position.set(0.06, 0.03, 0.03); g.add(led);
    g.userData = { rest: 0.0575, h: 0.115 };
    parts.push(g);
  }
  parts.forEach((g) => scene.add(g));
  // Tote: an open charcoal bin with a red band.
  const toteParts = [];
  const TW = 0.46, TH = 0.12, TD = 0.32, TT = 0.012;
  [[TW, TT, TD, 0, TT / 2, 0], [TW, TH, TT, 0, TH / 2, TD / 2], [TW, TH, TT, 0, TH / 2, -TD / 2], [TT, TH, TD, TW / 2, TH / 2, 0], [TT, TH, TD, -TW / 2, TH / 2, 0]].forEach(([w, h, d, x, y, z]) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); toteParts.push(g); });
  const tote = mesh(mergeGeometries(toteParts), std(0x2a2e34, { roughness: 0.55 }));
  tote.position.set(...TOTE); scene.add(tote);
  const band = mesh(new THREE.BoxGeometry(TW + 0.004, 0.026, TD + 0.004), std(RED, { roughness: 0.4 }));
  band.position.set(TOTE[0], TH - 0.02, TOTE[2]); scene.add(band);
  const IN_POS = [[-0.13, 0.03, 0.4], [0.0, -0.01, -0.3], [0.13, 0.02, 0.2]];  // x, z, yaw inside the tote

  // Add buttons over each part.
  const plusTex = canvasTex(128, 128, (c, w) => { c.fillStyle = '#16191e'; c.beginPath(); c.arc(w / 2, w / 2, 60, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 10; c.lineCap = 'round'; c.beginPath(); c.moveTo(w / 2, 36); c.lineTo(w / 2, 92); c.moveTo(36, w / 2); c.lineTo(92, w / 2); c.stroke(); }).tex;
  const okTex = canvasTex(128, 128, (c, w) => { c.fillStyle = RED; c.beginPath(); c.arc(w / 2, w / 2, 60, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 11; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(38, 66); c.lineTo(56, 84); c.lineTo(92, 44); c.stroke(); }).tex;
  const btns = ITEMS.map((it) => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: plusTex, transparent: true, depthWrite: false, toneMapped: false })); s.position.set(it.x + 0.11, 0.31, 0.24); s.scale.setScalar(0.085); scene.add(s); return s; });

  // ----------------------------------------------------------- the pallet and its cartons
  const pallet = mesh(new THREE.BoxGeometry(0.52, 0.06, 0.36), std(0x9a7448, { roughness: 0.85 }));
  pallet.position.set(PAL[0], 0.03, PAL[2]); scene.add(pallet);
  const cartons = new THREE.InstancedMesh(new RoundedBoxGeometry(CB - 0.004, CB - 0.004, CB - 0.004, 1, 0.006), std(0xffffff, { map: kraft.tex, roughness: 0.82 }), NC);
  cartons.castShadow = true; cartons.receiveShadow = true; scene.add(cartons);
  const TINT = [new THREE.Color(1, 1, 1), new THREE.Color(0.9, 0.93, 1), new THREE.Color(1, 0.9, 0.8)];
  for (let i = 0; i < NC; i++) cartons.setColorAt(i, TINT[rowOf(i)]);
  const cartonHome = (i, out) => { const l = Math.floor(i / 15), r = Math.floor((i % 15) / 5), c = i % 5; return out.set(PAL[0] + (c - 2) * CB, 0.06 + CB / 2 + l * CB, PAL[2] + (r - 1) * CB); };
  const STACK_H = 3 * CB;
  const wrapM = new THREE.MeshPhysicalMaterial({ color: 0xcfe3ff, roughness: 0.12, metalness: 0, transparent: true, opacity: 0, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
  const wrapG = new THREE.BoxGeometry(5 * CB + 0.02, 1, 3 * CB + 0.02, 1, 1, 1); wrapG.translate(0, 0.5, 0);
  const wrap = new THREE.Mesh(wrapG, wrapM); wrap.position.set(PAL[0], 0.06, PAL[2]); scene.add(wrap);
  const wrapRing = glow(0xbfe0ff, 0.9, 0, 0.3); wrapRing.scale.set(0.9, 0.12, 1); scene.add(wrapRing);
  const check = new THREE.Sprite(new THREE.SpriteMaterial({ map: okTex, transparent: true, depthWrite: false, toneMapped: false }));
  scene.add(check);
  const checkGlow = glow(0xff3a55, 0.9, 0, 0.35); scene.add(checkGlow);

  // ----------------------------------------------------------- cart card and quick cart card
  const PW = 0.94, PH = 0.76;
  const pTex = canvasTex(768, 620);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: pTex.tex, transparent: true, toneMapped: false, depthWrite: false }));
  panel.position.set(-0.7, 0.7, -0.44); panel.renderOrder = 5; scene.add(panel);
  const QW = 0.6, QH = 0.41;
  const qTex = canvasTex(512, 350);
  const quick = new THREE.Mesh(new THREE.PlaneGeometry(QW, QH), new THREE.MeshBasicMaterial({ map: qTex.tex, transparent: true, toneMapped: false, depthWrite: false }));
  quick.renderOrder = 6; scene.add(quick);
  const flyers = ITEMS.map(() => { const g = glow(0xff4060, 0.16, 0, 0.3); scene.add(g); return g; });
  const title = label('Cart and checkout', { font: `800 64px ${SANS}`, fg: '#f2f4f7', h: 0.16, track: 1 });
  title.position.set(0.05, 1.26, -0.6); scene.add(title);

  const qtyAt = (t) => ITEMS.map((it, r) => {
    if (t < IN[r]) return 0;
    let n = 1;
    for (let i = 0; i < NC; i++) if (rowOf(i) === r && t > dropT(i) + DROP) n++;
    return n;
  });
  const CHANGES = [...IN, ...Array.from({ length: NC }, (_, i) => dropT(i) + DROP)];
  let pKey = '';
  const drawPanel = (t) => {
    const q = qtyAt(t), total = q.reduce((a, b) => a + b, 0);
    const steps = STEP.map((s) => k(t, s, s + 0.3));
    const rows = ITEMS.map((_, r) => eo(k(t, IN[r], IN[r] + 0.35)));
    // Badge pops on every change: find when the total last changed.
    let lastChange = 0;
    CHANGES.forEach((c) => { if (c < t && c > lastChange) lastChange = c; });
    const anim = rows.some((x) => x > 0 && x < 1) || steps.some((x) => x > 0 && x < 1) || (lastChange > 0 && t - lastChange < 0.4);
    const key = [total, q.join(','), anim ? Math.round(t * 30) : 0, t > STEP[3] + 0.3 ? 1 : 0].join('|');
    if (key === pKey) return; pKey = key;
    const pop = 1 + 0.25 * Math.exp(-12 * (t - lastChange)) * (lastChange > 0 ? 1 : 0);
    pTex.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(14,18,24,0.88)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
      // Header: cart glyph, title, badge.
      c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineJoin = 'round'; c.lineCap = 'round';
      c.beginPath(); c.moveTo(34, 46); c.lineTo(46, 46); c.lineTo(56, 84); c.lineTo(94, 84); c.lineTo(102, 56); c.lineTo(50, 56); c.stroke();
      c.fillStyle = '#fff'; c.beginPath(); c.arc(62, 96, 5, 0, 7); c.arc(88, 96, 5, 0, 7); c.fill();
      c.font = `800 56px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Cart', 120, 66);
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = `600 22px ${SANS}`; c.fillText('Honeywell', 124, 108);
      c.save(); c.translate(w - 76, 66); c.scale(pop, pop);
      c.fillStyle = total ? RED : 'rgba(255,255,255,0.14)'; c.beginPath(); c.arc(0, 0, 40, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.font = `800 ${total > 9 ? 34 : 38}px ${SANS}`; c.textAlign = 'center'; c.fillText(String(total), 0, 2); c.textAlign = 'left';
      c.restore();
      // Rows
      ITEMS.forEach((it, r) => {
        const y = 146 + r * 92, p = rows[r];
        c.fillStyle = 'rgba(255,255,255,0.05)'; roundRect(c, 26, y, w - 52, 78, 16); c.fill();
        if (p <= 0) { c.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(c, 116, y + 31, 180, 16, 8); c.fill(); return; }
        c.globalAlpha = p;
        c.save(); c.translate((1 - p) * 30, 0);
        c.fillStyle = '#2a3038'; roundRect(c, 40, y + 11, 56, 56, 12); c.fill();
        c.fillStyle = ['#ff7a2a', '#b88a3e', '#3aa0ff'][r];
        if (r === 0) { c.beginPath(); c.arc(68, y + 39, 16, 0, 7); c.fill(); } else if (r === 1) { c.fillRect(54, y + 24, 28, 18); c.fillRect(50, y + 46, 36, 8); } else { c.fillRect(52, y + 27, 32, 24); }
        c.fillStyle = '#fff'; c.font = `700 36px ${MONO}`; c.fillText(it.code, 116, y + 41);
        const bumped = q[r] > 1;
        c.fillStyle = bumped ? '#ff5470' : '#fff'; c.font = `800 42px ${SANS}`; c.textAlign = 'right'; c.fillText('×' + q[r], w - 48, y + 41); c.textAlign = 'left';
        c.restore(); c.globalAlpha = 1;
      });
      // Checkout steps
      const ry = 528, xs = [96, 288, 480, 672];
      c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 6; c.beginPath(); c.moveTo(xs[0], ry); c.lineTo(xs[3], ry); c.stroke();
      const prog = steps[1] + steps[2] + steps[3];
      c.strokeStyle = RED; c.beginPath(); c.moveTo(xs[0], ry); c.lineTo(xs[0] + (xs[3] - xs[0]) * clamp(prog / 3), ry); c.stroke();
      xs.forEach((x, i) => {
        const s = steps[i], last = i === 3;
        c.fillStyle = '#141820'; c.beginPath(); c.arc(x, ry, last ? 24 : 18, 0, 7); c.fill();
        c.strokeStyle = s > 0 ? RED : 'rgba(255,255,255,0.3)'; c.lineWidth = 4; c.stroke();
        if (s > 0) { c.fillStyle = RED; c.beginPath(); c.arc(x, ry, (last ? 24 : 18) * back(s), 0, 7); c.fill(); }
        if (last && s > 0.5) { c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(x - 10, ry); c.lineTo(x - 3, ry + 8); c.lineTo(x + 11, ry - 8); c.stroke(); }
      });
      c.fillStyle = steps[3] > 0.5 ? '#fff' : 'rgba(255,255,255,0.45)'; c.font = `700 28px ${SANS}`; c.textAlign = 'right'; c.fillText('Checkout', xs[3] + 28, ry + 52); c.textAlign = 'left';
    });
  };

  let qKey = '';
  const drawQuick = (t) => {
    const paste = k(t, PASTE, PASTE + 0.25), sel = Math.sin(Math.PI * k(t, PASTE + 0.05, PASTE + 0.4));
    const sent = SEND.map((s) => eo(k(t, s, s + 0.25)));
    const anim = (paste > 0 && paste < 1) || sel > 0.01 || sent.some((x) => x > 0 && x < 1);
    const key = [anim ? Math.round(t * 30) : 0, paste >= 1 ? 1 : 0, sent.map((x) => (x >= 1 ? 1 : 0)).join('')].join('|');
    if (key === qKey) return; qKey = key;
    qTex.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(214,222,232,0.95)'; roundRect(c, 4, 4, w - 8, h - 8, 26); c.fill();
      c.fillStyle = '#121820'; c.font = `800 40px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Quick cart', 30, 48);
      c.fillStyle = RED; roundRect(c, w - 196, 28, 166, 40, 20); c.fill();
      c.fillStyle = '#fff'; c.font = `700 21px ${SANS}`; c.textAlign = 'center'; c.fillText('Bulk order', w - 113, 49); c.textAlign = 'left';
      c.strokeStyle = 'rgba(18,24,32,0.45)'; c.lineWidth = 3; c.setLineDash([10, 8]); roundRect(c, 26, 92, w - 52, h - 120, 16); c.stroke(); c.setLineDash([]);
      if (paste <= 0) { c.fillStyle = 'rgba(18,24,32,0.35)'; c.font = `600 26px ${MONO}`; c.fillText('Paste a list…', 52, 150); return; }
      ITEMS.forEach((it, i) => {
        const y = 140 + i * 62;
        if (sel > 0.01) { c.fillStyle = `rgba(58,140,255,${0.35 * sel})`; c.fillRect(44, y - 26, w - 88, 52); }
        c.globalAlpha = paste * (1 - 0.65 * sent[i]);
        c.fillStyle = '#121820'; c.font = `700 38px ${MONO}`; c.fillText(it.code, 56, y);
        c.fillStyle = RED; c.textAlign = 'right'; c.fillText('×' + it.add, w - 60, y); c.textAlign = 'left';
        if (sent[i] > 0.5) { c.globalAlpha = 1; c.fillStyle = '#1a9a5a'; c.beginPath(); c.arc(w - 40, y, 9, 0, 7); c.fill(); }
        c.globalAlpha = 1;
      });
    });
  };

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.6, 0.74, 2.05]], [2.95, [-0.46, 0.78, 2.2], (x) => x],
    [3.75, [0.02, 0.84, 2.42]], [5.7, [0.1, 0.8, 2.34], (x) => x],
    [6.9, [0.28, 0.74, 2.42]], [10, [0.1, 0.88, 2.66], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.5, 0.44, -0.1]], [2.95, [-0.4, 0.46, -0.12], (x) => x],
    [3.75, [-0.06, 0.46, -0.12]], [5.7, [-0.02, 0.44, -0.12], (x) => x],
    [6.9, [-0.04, 0.46, -0.3]], [10, [-0.08, 0.48, -0.32], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), e3 = new THREE.Euler();
  const qb = (x0, x1, x2, e) => (1 - e) * (1 - e) * x0 + 2 * (1 - e) * e * x1 + e * e * x2;
  const faceCam = (m) => { m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), 0); m.updateMatrixWorld(); };

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 33], [2.95, 33], [3.75, 36], [6.9, 36], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Cart: press the button, the part hops into the tote with a spin and lands with a squash.
    parts.forEach((g, i) => {
      const it = ITEMS[i], ud = g.userData;
      const press = k(t, ADD[i], ADD[i] + 0.12), hop = k(t, ADD[i] + 0.12, IN[i]), he = eio(hop);
      const sq = t > IN[i] ? Math.sin(Math.PI * clamp((t - IN[i]) / 0.18)) : 0;
      a.set(it.x, 0.024 + ud.rest, 0.22);
      b.set(TOTE[0] + IN_POS[i][0], TT + ud.rest * 0.6, TOTE[2] + IN_POS[i][1]);
      mid.set((a.x + b.x) / 2, Math.max(a.y, b.y) + 0.36, (a.z + b.z) / 2 + 0.08);
      g.position.set(qb(a.x, mid.x, b.x, he), qb(a.y, mid.y, b.y, he) - Math.sin(Math.PI * press) * 0.012, qb(a.z, mid.z, b.z, he));
      const idle = (1 - hop) * Math.sin(t * 1.4 + i * 2) * 0.12;
      g.rotation.set(he * (i === 0 ? -0.9 : 0.25) + (i === 0 ? -0.15 : 0), lerp(0.28 - i * 0.2, IN_POS[i][2], he) + idle + he * Math.PI * 2, 0);
      g.scale.set(1 + sq * 0.08, 1 - sq * 0.12, 1 + sq * 0.08);
      // The button: dips on the press, turns to a red check, then fades as the part leaves.
      const btn = btns[i];
      btn.material.map = t > ADD[i] + 0.06 ? okTex : plusTex;
      const bin = back(k(t, 0.45 + i * 0.12, 0.85 + i * 0.12));
      btn.scale.setScalar(Math.max(0.001, 0.085 * bin * (1 - 0.25 * Math.sin(Math.PI * press)) * (1 + 0.25 * Math.sin(Math.PI * k(t, ADD[i] + 0.06, ADD[i] + 0.3)))));
      btn.material.opacity = 1 - eo(k(t, IN[i] - 0.1, IN[i] + 0.3));
      btn.visible = btn.material.opacity > 0.01 && bin > 0;
    });

    // Cart card faces the camera from behind the parts.
    panel.position.y = 0.7 + Math.sin(t * 1.1) * 0.006;
    faceCam(panel);
    panel.material.opacity = eo(k(t, 0.35, 0.8));
    drawPanel(t);

    // Quick cart: the card slides in, the list is pasted, and each line flies to its row.
    const qin = eo(k(t, 3.0, 3.45)), qout = ei(k(t, 5.4, 5.9));
    quick.position.set(0.12 + (1 - qin) * 0.5, 0.78 + Math.sin(t * 1.3) * 0.006 - qout * 0.05, -0.08);
    faceCam(quick);
    quick.material.opacity = qin * (1 - qout);
    quick.visible = quick.material.opacity > 0.01;
    drawQuick(t);
    flyers.forEach((f, i) => {
      const fp = k(t, SEND[i], SEND[i] + 0.45), fe = eio(fp);
      a.set(0, QH / 2 - (140 + i * 62) / 350 * QH, 0.01); quick.localToWorld(a);
      b.set(-PW / 2 + 420 / 768 * PW, PH / 2 - (185 + i * 92) / 620 * PH, 0.01); panel.localToWorld(b);
      mid.set((a.x + b.x) / 2, Math.max(a.y, b.y) + 0.15, (a.z + b.z) / 2 + 0.1);
      f.position.set(qb(a.x, mid.x, b.x, fe), qb(a.y, mid.y, b.y, fe), qb(a.z, mid.z, b.z, fe));
      f.material.opacity = fp > 0 && fp < 1 ? 1 : 0;
      f.visible = fp > 0 && fp < 1;
    });

    // Bulk: forty-five cartons rain onto the pallet and stack.
    for (let i = 0; i < NC; i++) {
      const t0 = dropT(i), f = k(t, t0, t0 + DROP);
      cartonHome(i, a);
      const land = t > t0 + DROP ? spring(k(t, t0 + DROP, t0 + DROP + 0.35)) : 0;
      const y = lerp(a.y + 1.1, a.y, ei(f)) + (t > t0 + DROP ? (1 - land) * 0.012 : 0);
      e3.set((rnd(i, 3) - 0.5) * 0.9 * (1 - f), (rnd(i, 4) - 0.5) * 1.4 * (1 - f), (rnd(i, 5) - 0.5) * 0.9 * (1 - f));
      q4.setFromEuler(e3);
      const s = f > 0 ? 1 : 0.0001;
      m4.compose(p4.set(a.x, y, a.z), q4, s4.set(s, s, s));
      cartons.setMatrixAt(i, m4);
    }
    cartons.instanceMatrix.needsUpdate = true;
    cartons.visible = t > dropT(0);

    // Checkout: the load is wrapped, the dock door rolls up, a red check lands over the pallet.
    const wp = eio(k(t, 6.1, 7.0));
    wrap.scale.y = Math.max(0.001, wp * (STACK_H + 0.012));
    wrapM.opacity = 0.32 * clamp(wp * 3);
    wrap.visible = wp > 0;
    wrapRing.position.set(PAL[0], 0.06 + wp * STACK_H, PAL[2] + 0.17);
    wrapRing.material.opacity = Math.sin(Math.PI * wp) * 0.8;
    const dp = eio(k(t, 6.4, 7.6));
    const ds = Math.max(0.001, 1 - dp * 0.94);
    door.scale.y = ds; door.position.y = DOOR[1] + 0.81 - 0.81 * ds;
    dayM.color.setRGB(1, 0.77, 0.54).multiplyScalar(lerp(0.25, 0.95, dp));
    dayGlow.material.opacity = 0.75 * dp;
    dawn.intensity = lerp(0.25, 1.5, dp);
    const ck = back(k(t, 7.45, 7.9));
    check.position.set(PAL[0], 0.06 + STACK_H + 0.2 + Math.sin(t * 2) * 0.008, PAL[2]);
    check.scale.setScalar(Math.max(0.001, 0.17 * ck));
    check.visible = ck > 0;
    checkGlow.position.copy(check.position);
    checkGlow.material.opacity = 0.5 * clamp(ck) + 0.6 * Math.exp(-5 * Math.max(0, t - 7.6)) * (t > 7.6 ? 1 : 0);
    checkL.position.copy(check.position); checkL.intensity = 0.8 * clamp(ck);

    // Title for the last beat.
    const ti = eo(k(t, 7.9, 8.4));
    title.position.y = 1.26 - (1 - ti) * 0.05;
    faceCam(title);
    title.material.opacity = ti;
    title.visible = ti > 0.01;
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
