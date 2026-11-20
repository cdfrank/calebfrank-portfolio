// Young Farmers of Washtenaw County lit loop, 10 s. "The sign goes up, the flyer goes out, the ball goes in."
// A country golf course on a late summer afternoon, a red barn and silo across the fairway, long shadows
// on mown stripes. Beat one: the club's sign is hoisted up its two posts on ropes, bounces into place and
// its two lamps flick on. Beat two: the tournament flyer unrolls down an easel by the tee and two tacks
// pin it. Beat three: the golfer at the tee settles over the ball, glances at the flag, winds up and
// swings; the camera follows the ball the length of the hole, it lands, hops, breaks along the green and
// drops into the cup; the flag rattles and HOLE IN ONE pops above it. The camera pulls wide over the
// course while the golfer pumps a fist and the title settles over the sky.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { makePerson } from '../person.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BARN_RED = '#a8322a', CREAM = '#efe6cf', FLAG = '#e9b43a';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// Timing.
const RISE = [0.45, 1.45], LAMPS = [1.7, 1.86], UNROLL = [2.75, 3.45];
const SET = 4.55, GLANCE = 4.95, BACK = 5.25, TOP = 6.0, IMPACT = 6.2, FINISH = 6.55;
const LANDT = 7.0, HOPT = 7.18, CUPT = 7.64, DROPT = 7.74;

// People come from the shared rig in ../person.js.

// The club's sign: cream board, red barn emblem, the club's name.
function drawSign(c, w, h) {
  c.fillStyle = CREAM; c.fillRect(0, 0, w, h);
  c.strokeStyle = BARN_RED; c.lineWidth = 18; c.strokeRect(20, 20, w - 40, h - 40);
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 3; c.strokeRect(40, 40, w - 80, h - 80);
  // Barn emblem.
  const bx = 70, by = 92, bw = 250, bh = 300;
  c.fillStyle = BARN_RED; c.beginPath();
  c.moveTo(bx, by + bh); c.lineTo(bx, by + bh * 0.42); c.lineTo(bx + bw * 0.18, by + bh * 0.14); c.lineTo(bx + bw / 2, by);
  c.lineTo(bx + bw * 0.82, by + bh * 0.14); c.lineTo(bx + bw, by + bh * 0.42); c.lineTo(bx + bw, by + bh); c.closePath(); c.fill();
  c.strokeStyle = CREAM; c.lineWidth = 9;
  const dx = bx + bw * 0.27, dy = by + bh * 0.52, dw = bw * 0.46, dh = bh * 0.48;
  c.strokeRect(dx, dy, dw, dh); c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + dw, dy + dh); c.moveTo(dx + dw, dy); c.lineTo(dx, dy + dh); c.stroke();
  c.strokeRect(bx + bw * 0.4, by + bh * 0.22, bw * 0.2, bh * 0.16);
  c.fillStyle = '#2a2a2a'; c.textBaseline = 'alphabetic';
  c.font = `900 118px ${SANS}`; c.fillText('YOUNG', 360, 210);
  c.fillText('FARMERS', 360, 330);
  c.fillStyle = BARN_RED; c.fillRect(362, 356, 560, 8);
  c.fillStyle = '#4a4438'; c.font = `700 40px ${MONO}`; c.fillText('Washtenaw County', 362, 420);
}

// The tournament flyer.
function drawFlyer(c, w, h) {
  c.fillStyle = '#f3ead2'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#1f3a24'; c.fillRect(0, 0, w, 150);
  c.fillStyle = '#f3ead2'; c.font = `900 84px ${SANS}`; c.textBaseline = 'middle'; c.fillText('GOLF OUTING', 34, 80);
  c.fillStyle = BARN_RED; c.font = `800 38px ${MONO}`; c.fillText('YOUNG FARMERS', 36, 196);
  c.fillStyle = '#4a4438'; c.font = `600 32px ${SANS}`; c.fillText('Washtenaw County', 36, 240);
  // Illustration: a hole on a summer afternoon.
  const ix = 36, iy = 280, iw = w - 72, ih = 380;
  c.save(); roundRect(c, ix, iy, iw, ih, 22); c.clip();
  const sky = c.createLinearGradient(0, iy, 0, iy + ih); sky.addColorStop(0, '#6fa6dc'); sky.addColorStop(0.6, '#f3d9a4'); sky.addColorStop(1, '#f3d9a4');
  c.fillStyle = sky; c.fillRect(ix, iy, iw, ih);
  c.fillStyle = 'rgba(255,236,190,0.9)'; c.beginPath(); c.arc(ix + iw * 0.78, iy + ih * 0.32, 44, 0, 7); c.fill();
  c.fillStyle = '#4f7f36'; c.beginPath(); c.moveTo(ix, iy + ih * 0.66); c.quadraticCurveTo(ix + iw * 0.4, iy + ih * 0.5, ix + iw, iy + ih * 0.62); c.lineTo(ix + iw, iy + ih); c.lineTo(ix, iy + ih); c.fill();
  c.fillStyle = '#6fae48'; c.beginPath(); c.ellipse(ix + iw * 0.6, iy + ih * 0.8, iw * 0.3, ih * 0.08, 0, 0, 7); c.fill();
  c.fillStyle = BARN_RED; c.beginPath(); const bx = ix + 40, by = iy + ih * 0.42;
  c.moveTo(bx, by + 90); c.lineTo(bx, by + 40); c.lineTo(bx + 20, by + 14); c.lineTo(bx + 50, by); c.lineTo(bx + 80, by + 14); c.lineTo(bx + 100, by + 40); c.lineTo(bx + 100, by + 90); c.fill();
  c.strokeStyle = '#2a2a2a'; c.lineWidth = 5; c.beginPath(); c.moveTo(ix + iw * 0.6, iy + ih * 0.8); c.lineTo(ix + iw * 0.6, iy + ih * 0.36); c.stroke();
  c.fillStyle = FLAG; c.beginPath(); c.moveTo(ix + iw * 0.6, iy + ih * 0.36); c.lineTo(ix + iw * 0.6 + 70, iy + ih * 0.42); c.lineTo(ix + iw * 0.6, iy + ih * 0.48); c.fill();
  c.fillStyle = '#1b1b1b'; c.beginPath(); c.ellipse(ix + iw * 0.6, iy + ih * 0.8, 12, 4, 0, 0, 7); c.fill();
  c.restore();
  c.fillStyle = '#1f3a24'; c.font = `800 34px ${SANS}`; c.fillText('County golf tournament', 36, 712);
  c.fillStyle = BARN_RED; c.fillRect(36, 744, 180, 7);
  for (let i = 0; i < 2600; i++) { const v = rnd(i, 3) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 4) * 0.06})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 2, 2); }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x9cc0e0);
  scene.fog = new THREE.Fog(0xc9d6d2, 16, 52);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.1, 80);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), e4 = new THREE.Euler();

  // ----------------------------------------------------------- sky and course
  scene.add(skyDome([[0, '#2f63aa'], [0.3, '#6c9fd6'], [0.45, '#c7dce6'], [0.5, '#f1d7a6'], [0.505, '#7f9a5a'], [1, '#2f4a24']], 60));
  const haze = glow(0xffe2b0, 30, 0.35, 0.3); haze.material.fog = false; haze.scale.set(46, 10, 1); haze.position.set(-14, 1.5, -48); scene.add(haze);
  const stripes = canvasTex(512, 512, (c, w, h) => {
    for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#3f6e2c' : '#477a31'; c.fillRect(i * w / 8, 0, w / 8, h); }
    for (let i = 0; i < 9000; i++) { const v = rnd(i, 11) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 12) * 0.08})`; c.fillRect(rnd(i, 13) * w, rnd(i, 14) * h, 2, 2); }
  }).tex;
  stripes.wrapS = stripes.wrapT = THREE.RepeatWrapping; stripes.repeat.set(20, 20);
  const ground = mesh(new THREE.PlaneGeometry(90, 90), std(0xffffff, { map: stripes, roughness: 0.92 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; ground.position.set(0, 0, -20); scene.add(ground);

  // Tee, golfer, ball, and the hole down the fairway.
  const GP = V(0.95, 0, 0.75), G = V(2.0, 0, -7.4);
  const d0 = G.clone().sub(GP).setY(0).normalize();
  const YAW0 = Math.atan2(-d0.z, d0.x); // facing across the target line, with the target on the golfer's left
  const FACE = fwdOf(YAW0), TO_T = sideOf(YAW0);              // TO_T points down the target line
  const T = GP.clone().addScaledVector(FACE, 0.78);
  const BALL = T.clone().setY(0.068);
  const DIR = G.clone().sub(T).setY(0).normalize(), SIDEL = V(-DIR.z, 0, DIR.x);
  const LAND = T.clone().lerp(G, 0.84).setY(0.04), LAND2 = LAND.clone().addScaledVector(DIR, 0.36);

  const lawn = (r, col, y) => { const m = mesh(new THREE.CircleGeometry(r, 64), std(0xffffff, { map: grainTex(col, { size: 128, speck: 0.06, blot: 0.08, seed: r * 10 | 0, repeat: 3 }), roughness: 0.7 }), { cast: false }); m.rotation.x = -Math.PI / 2; m.position.set(G.x, y, G.z); scene.add(m); return m; };
  lawn(2.0, '#3c7029', 0.004); lawn(1.75, '#5e9c3c', 0.008);
  const tee = mesh(new THREE.PlaneGeometry(1.7, 1.3), std(0xffffff, { map: grainTex('#56913a', { size: 128, speck: 0.06, seed: 4, repeat: 2 }), roughness: 0.75 }), { cast: false });
  tee.rotation.x = -Math.PI / 2; tee.rotation.z = YAW0 - Math.PI / 2; tee.position.set((GP.x + T.x) / 2, 0.004, (GP.z + T.z) / 2); scene.add(tee);
  [-1, 1].forEach((s) => { const mk = mesh(new THREE.SphereGeometry(0.045, 16, 10), std(0xc23a2b, { roughness: 0.4 })); mk.position.copy(T).addScaledVector(TO_T, 0.6 * -1).addScaledVector(FACE, s * 0.5).setY(0.04); scene.add(mk); });
  const peg = mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.05, 10), std(0xe8dcc0, { roughness: 0.6 })); peg.position.copy(T).setY(0.022); scene.add(peg);
  const hole = mesh(new THREE.CircleGeometry(0.075, 32), std(0x0a0a0a, { roughness: 1 }), { cast: false }); hole.rotation.x = -Math.PI / 2; hole.position.copy(G).setY(0.011); scene.add(hole);
  const lip = mesh(new THREE.RingGeometry(0.075, 0.088, 32), std(0xd8d8d0, { roughness: 0.5 }), { cast: false }); lip.rotation.x = -Math.PI / 2; lip.position.copy(G).setY(0.012); scene.add(lip);
  const flagG = new THREE.Group(); flagG.position.copy(G); scene.add(flagG);
  const pole = mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.45, 10), std(0xe6e2d6, { roughness: 0.4 })); pole.position.y = 0.725; flagG.add(pole);
  const clothG = new THREE.PlaneGeometry(0.44, 0.28, 10, 2); clothG.translate(0.22, 0, 0);
  const clothBase = clothG.attributes.position.array.slice();
  const cloth = mesh(clothG, std(FLAG, { roughness: 0.7, side: THREE.DoubleSide })); cloth.position.y = 1.3; flagG.add(cloth);
  flagG.rotation.y = -0.6;

  // The barn and silo across the fairway.
  const barn = new THREE.Group(); barn.position.set(-3.6, 0, -6.6); barn.rotation.y = 0.35; scene.add(barn);
  const prof = [[-1.6, 0], [1.6, 0], [1.6, 1.8], [1.05, 2.75], [0, 3.2], [-1.05, 2.75], [-1.6, 1.8]];
  const shp = new THREE.Shape(); prof.forEach(([x, y], i) => (i ? shp.lineTo(x, y) : shp.moveTo(x, y)));
  const wallsG = new THREE.ExtrudeGeometry(shp, { depth: 3.6, bevelEnabled: false }); wallsG.translate(0, 0, -1.8);
  barn.add(mesh(wallsG, std(0xffffff, { map: grainTex(BARN_RED, { size: 128, speck: 0.08, blot: 0.12, seed: 31 }), roughness: 0.85 })));
  const roofM = std(0x3c3d42, { roughness: 0.7, metalness: 0.3 });
  for (let i = 2; i < 6; i++) {
    const [x0, y0] = prof[i], [x1, y1] = prof[i + 1];
    const len = Math.hypot(x1 - x0, y1 - y0) + 0.12;
    const r = mesh(new THREE.BoxGeometry(len, 0.07, 3.8), roofM);
    r.position.set((x0 + x1) / 2 + Math.sign((x0 + x1) / 2) * 0.03, (y0 + y1) / 2 + 0.04, 0); r.rotation.z = Math.atan2(y1 - y0, x1 - x0); barn.add(r);
  }
  const front = canvasTex(512, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const X = (x) => (x + 1.6) / 3.2 * w, Yp = (y) => h - y / 3.2 * h;
    c.strokeStyle = '#efe8d8'; c.lineWidth = 10; c.beginPath(); prof.forEach(([x, y], i) => (i ? c.lineTo(X(x), Yp(y)) : c.moveTo(X(x), Yp(y)))); c.closePath(); c.stroke();
    const dx = X(-0.75), dy = Yp(1.7), dw = X(0.75) - dx, dh = Yp(0) - dy;
    c.lineWidth = 9; c.strokeRect(dx, dy, dw, dh); c.beginPath(); c.moveTo(dx, dy); c.lineTo(dx + dw, dy + dh); c.moveTo(dx + dw, dy); c.lineTo(dx, dy + dh); c.moveTo(dx + dw / 2, dy); c.lineTo(dx + dw / 2, dy + dh); c.stroke();
    c.strokeRect(X(-0.35), Yp(2.6), X(0.35) - X(-0.35), Yp(2.0) - Yp(2.6));
  }).tex;
  const frontP = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), std(0xffffff, { map: front, transparent: true, roughness: 0.8 })); frontP.position.set(0, 1.6, 1.805); barn.add(frontP);
  const silo = new THREE.Group(); silo.position.set(-1.4, 0, -8.6); scene.add(silo);
  silo.add(at(mesh(new THREE.CylinderGeometry(0.75, 0.75, 4.2, 32), std(0xb9b2a2, { roughness: 0.6, metalness: 0.35 })), 0, 2.1, 0));
  silo.add(at(mesh(new THREE.SphereGeometry(0.76, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), std(0x8a8f96, { roughness: 0.4, metalness: 0.6 })), 0, 4.2, 0));

  // Trees around the hole and a far tree line, instanced.
  const TREES = [[-6.2, -9.5, 1.2], [-0.6, -12, 1.4], [4.4, -10.5, 1.3], [6.0, -6.2, 1.0], [5.6, -14, 1.5], [-7.4, -4.0, 1.1], [3.6, -3.2, 0.8], [-2.5, -14.5, 1.3]];
  for (let i = 0; i < 46; i++) TREES.push([-22 + i * 1.0 + (rnd(i, 1) - 0.5) * 0.6, -22 - rnd(i, 2) * 4, 0.9 + rnd(i, 3) * 0.7]);
  const trunkG = new THREE.CylinderGeometry(0.08, 0.12, 1.3, 7); trunkG.translate(0, 0.65, 0);
  const crownG = new THREE.IcosahedronGeometry(0.95, 1); crownG.translate(0, 1.9, 0);
  const trunks = new THREE.InstancedMesh(trunkG, std(0x4a3426, { roughness: 0.9 }), TREES.length);
  const crowns = new THREE.InstancedMesh(crownG, std(0xffffff, { roughness: 0.85, flatShading: true }), TREES.length);
  const tc = new THREE.Color();
  TREES.forEach(([x, z, s], i) => {
    m4.compose(p4.set(x, 0, z), q4.setFromEuler(e4.set(0, rnd(i, 9) * 6, 0)), s4.set(s, s * (0.9 + rnd(i, 8) * 0.3), s));
    trunks.setMatrixAt(i, m4); crowns.setMatrixAt(i, m4);
    crowns.setColorAt(i, tc.setHSL(0.27 + rnd(i, 6) * 0.06, 0.4, 0.2 + rnd(i, 7) * 0.08));
  });
  trunks.castShadow = crowns.castShadow = true; crowns.receiveShadow = true; scene.add(trunks, crowns);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xa8c8ff, 0x4a5a30, 0.5));
  const sun = new THREE.DirectionalLight(0xffd6a0, 2.9);
  sun.target.position.set(0.0, 0, -2.6); sun.position.set(-6.5, 6.2, -9.5);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.85); fill.position.set(4, 3, 7); scene.add(fill);

  // ----------------------------------------------------------- the sign
  const SG = V(-1.65, 0, 0.1), SBW = 1.3, SBH = 0.64, SB_Y = 1.08, BEAM_Y = 1.98;
  const woodM = std(0x5a3f2a, { roughness: 0.85 });
  [-1, 1].forEach((s) => { const pst = mesh(new THREE.BoxGeometry(0.1, 2.12, 0.1), woodM); pst.position.set(SG.x + s * 0.74, 1.06, SG.z); scene.add(pst); });
  const beam = mesh(new THREE.BoxGeometry(1.72, 0.1, 0.12), woodM); beam.position.set(SG.x, BEAM_Y + 0.05, SG.z); scene.add(beam);
  const board = new THREE.Group(); scene.add(board);
  board.add(mesh(new RoundedBoxGeometry(SBW + 0.06, SBH + 0.06, 0.05, 2, 0.012), std(0x3a2a1c, { roughness: 0.8 })));
  const signFace = mesh(new THREE.PlaneGeometry(SBW, SBH), std(0xffffff, { map: canvasTex(1024, 504, drawSign).tex, roughness: 0.75 }), { cast: false });
  signFace.position.z = 0.026; board.add(signFace);
  const ropeM = std(0xcab48a, { roughness: 0.9 });
  const ropes = [-1, 1].map(() => { const r = mesh(new THREE.CylinderGeometry(0.007, 0.007, 1, 6), ropeM, { cast: false }); scene.add(r); return r; });
  const pulleys = [-1, 1].map((s) => { const pl = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 16), std(0x666a70, { metalness: 0.8, roughness: 0.35 })); pl.rotation.x = Math.PI / 2; pl.position.set(SG.x + s * 0.55, BEAM_Y - 0.03, SG.z); scene.add(pl); return pl; });
  // Two gooseneck lamps over the board.
  const lampHeads = [-1, 1].map((s) => {
    const g = new THREE.Group(); g.position.set(SG.x + s * 0.42, BEAM_Y + 0.1, SG.z); scene.add(g);
    const arm = mesh(new THREE.TorusGeometry(0.14, 0.009, 6, 16, Math.PI * 0.6), std(0x2a2c30, { metalness: 0.7, roughness: 0.4 })); arm.rotation.set(0, Math.PI / 2, 0); arm.position.set(0, 0, 0.14); g.add(arm);
    const shade = mesh(new THREE.ConeGeometry(0.07, 0.08, 18, 1, true), std(0x1f3a24, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }), { cast: false }); shade.position.set(0, 0.06, 0.3); shade.rotation.x = 0.8; g.add(shade);
    const bulbM = new THREE.MeshBasicMaterial({ color: 0x222222, toneMapped: false });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 12, 8), bulbM); bulb.position.set(0, 0.04, 0.32); g.add(bulb);
    const gl = glow(0xffd9a0, 0.5, 0, 0.35); gl.position.set(0, 0.02, 0.34); g.add(gl);
    return { bulbM, gl };
  });
  const signLight = new THREE.SpotLight(0xffe0b0, 0, 4, 0.75, 0.5, 1.5);
  signLight.position.set(SG.x, BEAM_Y + 0.2, SG.z + 0.55); signLight.target.position.set(SG.x, SB_Y + SBH / 2, SG.z); scene.add(signLight, signLight.target);

  // ----------------------------------------------------------- the easel and the flyer
  const E = V(0.12, 0, 0.42);
  const easel = new THREE.Group(); easel.position.copy(E); easel.rotation.y = 0.08; scene.add(easel);
  const easelM = std(0x8a6a48, { roughness: 0.75 });
  [-1, 1].forEach((s) => { const lg = mesh(new THREE.BoxGeometry(0.035, 1.55, 0.035), easelM); lg.position.set(s * 0.28, 0.76, 0.05); lg.rotation.set(-0.1, 0, s * -0.1); easel.add(lg); });
  const backLeg = mesh(new THREE.BoxGeometry(0.035, 1.5, 0.035), easelM); backLeg.position.set(0, 0.72, -0.2); backLeg.rotation.x = 0.32; easel.add(backLeg);
  const ledge = mesh(new THREE.BoxGeometry(0.72, 0.03, 0.08), easelM); ledge.position.set(0, 0.56, 0.11); easel.add(ledge);
  const boardM = mesh(new THREE.BoxGeometry(0.66, 0.92, 0.02), std(0x2b3b2d, { roughness: 0.8 })); boardM.position.set(0, 1.03, 0.09); boardM.rotation.x = -0.1; easel.add(boardM);
  const FW = 0.6, FH = 0.85;
  const flyerTex = canvasTex(600, 850, drawFlyer).tex;
  const flyerG = new THREE.PlaneGeometry(FW, FH); flyerG.translate(0, -FH / 2, 0);
  const flyer = mesh(flyerG, std(0xffffff, { map: flyerTex, roughness: 0.6 }), { cast: false });
  const flyerTop = new THREE.Group(); flyerTop.position.set(0, 1.03 + FH / 2, 0.09); flyerTop.rotation.x = -0.1; easel.add(flyerTop);
  flyer.position.z = 0.012; flyerTop.add(flyer);
  const roll = mesh(new THREE.CylinderGeometry(1, 1, FW + 0.01, 20), std(0xe8dfc6, { roughness: 0.7 })); roll.rotation.z = Math.PI / 2; flyerTop.add(roll);
  const tacks = [-1, 1].map((s) => { const tk = mesh(new THREE.SphereGeometry(0.016, 12, 8), std(0xc23a2b, { roughness: 0.3 })); tk.position.set(s * (FW / 2 - 0.04), -0.04, 0.02); flyerTop.add(tk); return tk; });
  // A golf bag leaning by the easel.
  const bag = new THREE.Group(); bag.position.set(0.62, 0, -0.35); bag.rotation.set(0, 0.4, 0.18); scene.add(bag);
  bag.add(at(mesh(new THREE.CylinderGeometry(0.13, 0.12, 0.9, 20), std(0x1f3a24, { roughness: 0.6 })), 0, 0.45, 0));
  bag.add(at(mesh(new THREE.CylinderGeometry(0.135, 0.135, 0.08, 20), std(0xb8322a, { roughness: 0.5 })), 0, 0.86, 0));
  const headsG = new THREE.CylinderGeometry(0.03, 0.03, 0.14, 8);
  const heads = new THREE.InstancedMesh(headsG, std(0x9aa0a8, { metalness: 0.9, roughness: 0.3 }), 4);
  [[-0.05, 0.03], [0.05, 0.04], [0.0, -0.05], [-0.06, -0.04]].forEach(([x, z], i) => { m4.compose(p4.set(x, 0.98 + i * 0.015, z), q4.setFromEuler(e4.set(0.3 * (i - 1.5), 0, 0.2)), s4.set(1, 1, 1)); heads.setMatrixAt(i, m4); });
  heads.castShadow = true; bag.add(heads);

  // ----------------------------------------------------------- the golfer
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc68b68, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const polo = std(0x2f6f8f, { roughness: 0.8 });
  const golfer = makePerson(scene, { skin, top: polo, sleeve: polo, fore: skin, pants: std(0xb8a77e, { roughness: 0.85 }), shoeM: std(0xd6d1c6, { roughness: 0.5 }), hairM: std(0x1f2a44, { roughness: 0.7 }), hairCap: 0.48, chestR: 0.15, handM: std(0xe8e4da, { roughness: 0.7 }) });
  const bill = mesh(new THREE.BoxGeometry(0.15, 0.012, 0.1), std(0x1f2a44, { roughness: 0.7 })); scene.add(bill);
  const club = new THREE.Group(); scene.add(club);
  const grip = mesh(new THREE.CylinderGeometry(0.013, 0.011, 0.24, 10), std(0x1b1b1d, { roughness: 0.8 })); club.add(grip);
  const shaft = mesh(new THREE.CylinderGeometry(0.0065, 0.005, 1, 8), std(0xcfd4da, { metalness: 1, roughness: 0.25 })); club.add(shaft);
  const clubHead = mesh(new RoundedBoxGeometry(0.1, 0.035, 0.05, 2, 0.01), std(0xb9bec6, { metalness: 1, roughness: 0.28 })); club.add(clubHead);

  // Swing geometry, solved once so the club meets the ball exactly at impact.
  const LEAN0 = 0.42, HIPY0 = 0.86;
  const hip0 = GP.clone().setY(HIPY0);
  const Dn0 = FACE.clone().multiplyScalar(LEAN0).add(Y).normalize();
  const top0 = hip0.clone().addScaledVector(Dn0, 0.5);
  const C0 = top0.clone().addScaledVector(Dn0, -0.16).addScaledVector(FACE, 0.02);
  const A = BALL.clone().sub(C0).normalize();                     // address direction: down to the ball
  const B = TO_T.clone().multiplyScalar(-1);                       // away from the target
  const shL = top0.clone().addScaledVector(Dn0, -0.04).addScaledVector(TO_T, 0.19);
  // Lead-arm reach of 0.53 sets the hand circle's radius.
  const w0 = C0.clone().sub(shL), bq = 2 * w0.dot(A), cq = w0.lengthSq() - 0.53 * 0.53;
  const R = (-bq + Math.sqrt(Math.max(0, bq * bq - 4 * cq))) / 2;
  const CLUB = BALL.distanceTo(C0) - R;
  grip.position.y = 0.1; shaft.scale.y = CLUB; shaft.position.y = CLUB / 2; clubHead.position.set(0.035, CLUB, 0);

  const swingTheta = (t) => kf(t, [[BACK, 0], [TOP, 2.2, eio], [IMPACT, 0, ei], [FINISH, -2.45, eo]]);
  const swingHinge = (t) => kf(t, [[BACK, 0], [TOP, 1.4, eio], [IMPACT - 0.07, 1.2, ei], [IMPACT, 0, ei], [FINISH, -1.3, eo]]);
  const swingYaw = (t) => kf(t, [[BACK, 0], [TOP, -0.5, eio], [IMPACT, 0, ei], [FINISH, 0.95, eo]]);

  // ----------------------------------------------------------- the ball
  const ball = mesh(new THREE.SphereGeometry(0.04, 20, 14), std(0xf2f2ee, { roughness: 0.35 })); scene.add(ball);
  const ballGlow = glow(0xfff6e0, 0.35, 0, 0.4); scene.add(ballGlow);
  const TRN = 18, trPos = new Float32Array(TRN * 3), trCol = new Float32Array(TRN * 3);
  const trGeo = new THREE.BufferGeometry(); trGeo.setAttribute('position', new THREE.BufferAttribute(trPos, 3)); trGeo.setAttribute('color', new THREE.BufferAttribute(trCol, 3));
  for (let j = 0; j < TRN; j++) { const v = Math.pow(1 - j / TRN, 1.5); trCol[j * 3] = v; trCol[j * 3 + 1] = v * 0.96; trCol[j * 3 + 2] = v * 0.85; }
  const trail = new THREE.Points(trGeo, new THREE.PointsMaterial({ size: 0.05, vertexColors: true, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  trail.frustumCulled = false; scene.add(trail);
  const ballAt = (t, out) => {
    if (t < IMPACT) return out.copy(BALL);
    if (t < LANDT) { const u = k(t, IMPACT, LANDT); out.lerpVectors(BALL, LAND, u); out.y = lerp(BALL.y, 0.04, u) + 4 * 2.5 * u * (1 - u) * (1 - 0.25 * u); return out; }
    if (t < HOPT) { const u = k(t, LANDT, HOPT); out.lerpVectors(LAND, LAND2, u); out.y = 0.04 + 0.16 * Math.sin(Math.PI * u); return out; }
    if (t < CUPT) { const u = k(t, HOPT, CUPT), e = u * (1.4 - 0.4 * u); out.lerpVectors(LAND2, G, e).addScaledVector(SIDEL, 0.13 * Math.sin(Math.PI * e)); out.y = 0.04; return out; }
    const u = ei(k(t, CUPT, DROPT)); out.copy(G); out.y = 0.04 - 0.16 * u; return out;
  };
  const puff = glow(0xf6f0dc, 0.4, 0, 0.5); puff.position.copy(BALL); scene.add(puff);
  // The payoff at the cup.
  const burst = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 64), new THREE.MeshBasicMaterial({ color: 0xffe6a8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  burst.rotation.x = -Math.PI / 2; burst.position.copy(G).setY(0.03); scene.add(burst);
  const sparks = [0, 1, 2, 3, 4, 5].map(() => { const s = glow(0xffe0a0, 0.12, 0, 0.4); scene.add(s); return s; });
  const chip = label('HOLE IN ONE', { font: `800 64px ${MONO}`, fg: '#1f2a1c', bg: FLAG, h: 0.3, pad: 34, track: 3 });
  chip.material.fog = false; scene.add(chip);

  // ----------------------------------------------------------- title
  const kicker = label('Young Farmers of Washtenaw County', { font: `700 44px ${MONO}`, fg: '#f3ead2', bg: 'rgba(31,58,36,0.82)', h: 0.12, pad: 26, track: 2 });
  const title = label('Young Farmers materials', { font: `800 72px ${SANS}`, fg: '#fbf4e2', bg: 'rgba(168,50,42,0.9)', h: 0.22, pad: 34, track: 1 });
  const line = label('Sign logos and golf tournament flyers', { font: `600 46px ${SANS}`, fg: '#1f3a24', bg: 'rgba(243,234,210,0.92)', h: 0.12, pad: 26, track: 0 });
  [kicker, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });
  const FINAL = [V(2.6, 2.0, 4.6), V(-0.2, 0.9, -2.0)];
  const finalCam = new THREE.PerspectiveCamera(38, 16 / 10, 0.1, 80);
  finalCam.position.copy(FINAL[0]); finalCam.lookAt(FINAL[1]); finalCam.updateMatrixWorld();
  const inView = (sx, sy, depth) => { const v = V(sx, sy, 0.5).unproject(finalCam).sub(finalCam.position).normalize(); return finalCam.position.clone().addScaledVector(v, depth); };
  const TPOS = inView(-0.36, 0.5, 4.2);
  const TW = title.geometry.parameters.width, KW = kicker.geometry.parameters.width, LW = line.geometry.parameters.width;

  // ----------------------------------------------------------- pollen in the low sun
  const DN = 150, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe6b0, size: 0.016, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.75, 1.3, 3.5]], [2.3, [-0.55, 1.32, 3.2], L],
    [3.1, [0.05, 1.22, 2.75]], [4.4, [0.12, 1.2, 2.55], L],
    [5.25, [0.75, 1.3, 3.9]], [IMPACT, [0.82, 1.32, 3.8], L],
    [7.0, [1.0, 1.45, 3.35]], [7.8, [1.02, 1.45, 3.3], L],
    [8.55, FINAL[0].toArray()], [10, [2.68, 2.02, 4.7], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-1.6, 1.3, 0.1]], [2.3, [-1.5, 1.3, 0.1], L],
    [3.1, [0.12, 1.02, 0.4]], [4.4, [0.14, 1.0, 0.4], L],
    [5.25, [1.25, 0.82, 0.45]], [IMPACT, [1.3, 0.85, 0.3], L],
    [7.0, [1.9, 0.4, -5.5]], [7.8, [2.0, 0.3, -7.2], L],
    [8.55, FINAL[1].toArray()], [10, FINAL[1].toArray(), L],
  ]);
  const tgt = V(0, 0, 0), bp = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), hipP = V(0, 0, 0), H = V(0, 0, 0), cdir = V(0, 0, 0), look = V(0, 0, 0), lk = V(0, 0, 0);
  const restH = V(0, 0, 0), restD = V(0, 0, 0);

  function update(t) {
    ballAt(t, bp);
    const p = camPos(t), q = camTgt(t);
    tgt.set(q[0], q[1], q[2]);
    const follow = eio(k(t, IMPACT + 0.02, IMPACT + 0.4)) * (1 - eio(k(t, 7.95, 8.5)));
    tgt.lerp(tmp.copy(bp).add(tmp2.set(0, 0.12, 0)), follow * 0.85);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.5 + 1) * 0.006, p[2]);
    camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.3, 33], [3.1, 32], [4.4, 31], [5.25, 34], [IMPACT, 33], [6.6, 30], [7.0, 22], [7.8, 17], [8.55, 38], [10, 38]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the sign is hoisted up its posts, bounces into place, and its lamps come on.
    const up = back(k(t, RISE[0], RISE[1])) - 0.03 * Math.sin(Math.PI * k(t, RISE[0] - 0.2, RISE[0])) ;
    const by = lerp(0.06, SB_Y, up);
    const settle = t > RISE[1] - 0.15 ? Math.exp(-4 * (t - RISE[1] + 0.15)) * Math.sin((t - RISE[1] + 0.15) * 9) : 0;
    board.position.set(SG.x, by + SBH / 2, SG.z + 0.0);
    board.rotation.set(0.07 * settle + (1 - clamp(up)) * 0.12, 0, 0.02 * Math.sin(t * 7) * (1 - clamp(up)) * clamp(up * 3));
    const topY = by + SBH;
    ropes.forEach((r, i) => { const x = SG.x + (i ? 1 : -1) * 0.55, len = Math.max(0.02, BEAM_Y - 0.03 - topY); r.scale.y = len; r.position.set(x, topY + len / 2, SG.z); });
    pulleys.forEach((pl, i) => { pl.rotation.y = up * 9 * (i ? 1 : -1); });
    let lampOn = 0;
    lampHeads.forEach((lh, i) => {
      const a = k(t, LAMPS[i], LAMPS[i] + 0.25), fl = a > 0 && a < 1 ? (Math.sin(t * 90 + i * 3) > -0.2 ? 1 : 0.15) : 1, on = a > 0 ? eo(a) * fl : 0;
      lh.bulbM.color.setRGB(0.13 + 1.5 * on, 0.13 + 1.3 * on, 0.13 + 0.95 * on);
      lh.gl.material.opacity = 0.75 * on;
      lampOn += on / 2;
    });
    signLight.intensity = 7 * lampOn;

    // Beat 2: the flyer unrolls down the easel and two tacks pin it.
    const ur = eio(k(t, UNROLL[0], UNROLL[1]));
    flyer.scale.y = Math.max(0.001, ur); flyer.visible = ur > 0.002;
    flyerTex.repeat.y = Math.max(0.001, ur); flyerTex.offset.y = 1 - Math.max(0.001, ur);
    const rr = lerp(0.032, 0.012, ur);
    roll.scale.set(rr, 1, rr); roll.position.set(0, -FH * ur, 0.012 + rr);
    roll.visible = t > UNROLL[0] - 0.4 && ur < 0.995;
    const rollIn = eo(k(t, UNROLL[0] - 0.4, UNROLL[0]));
    roll.position.y += (1 - rollIn) * 0.5; roll.position.x = (1 - rollIn) * 0.6;
    tacks.forEach((tk, i) => { const s = back(k(t, 3.5 + i * 0.12, 3.75 + i * 0.12)); tk.scale.setScalar(Math.max(0.001, s)); tk.visible = s > 0.01; tk.position.z = 0.02 + (1 - clamp(s)) * 0.06; });

    // Beat 3: the golfer settles, glances at the flag, swings; the ball flies the hole.
    const set = eio(k(t, SET - 0.4, SET + 0.1));
    const idle = 1 - set;
    const th = swingTheta(t) + (0.13 * Math.sin(t * 2.3) * idle + 0.05 * Math.sin(t * 3.1) * set * (1 - k(t, BACK - 0.25, BACK)));
    const hingeA = swingHinge(t) + 0.15 * Math.sin(t * 2.3 + 0.6) * idle;
    const dyaw = swingYaw(t);
    const fin = eo(k(t, IMPACT, FINISH + 0.3)), rest = eio(k(t, 7.3, 8.0)), pump = eio(k(t, 7.7, 7.98)), relax = eio(k(t, 8.9, 9.5));
    const yaw = YAW0 + dyaw;
    const shift = 0.07 * eo(k(t, IMPACT - 0.05, FINISH)) - 0.025 * Math.sin(Math.PI * k(t, BACK, IMPACT));
    const breathe = Math.sin(t * 1.9) * 0.006;
    hipP.copy(GP).addScaledVector(TO_T, shift);
    hipP.y = lerp(0.9, HIPY0, set) + 0.04 * fin + breathe * 0.5 + 0.035 * Math.sin(Math.PI * k(t, 7.72, 8.15));
    const lean = lerp(0.24, LEAN0, set) - 0.32 * fin + breathe;
    // Hands ride a circle in the swing plane, carried round by the body's turn.
    H.copy(C0).addScaledVector(A, R * Math.cos(th)).addScaledVector(B, R * Math.sin(th));
    H.sub(hip0).applyAxisAngle(Y, dyaw * 0.6).add(hip0);
    const ph = th + hingeA;
    cdir.copy(A).multiplyScalar(Math.cos(ph)).addScaledVector(B, Math.sin(ph)).applyAxisAngle(Y, dyaw * 0.6);
    // After the finish the club comes down to the lead side and rests there.
    restH.copy(hipP).addScaledVector(TO_T, 0.24).addScaledVector(fwdOf(yaw, tmp2), 0.1); restH.y = 0.86;
    restD.copy(fwdOf(yaw, tmp2)).multiplyScalar(0.58).add(tmp.set(0, -1, 0)).normalize();
    H.lerp(restH, rest); cdir.lerp(restD, rest).normalize();
    // Where he looks: the ball, a glance at the flag, then the ball in flight.
    const glance = Math.sin(Math.PI * k(t, GLANCE, BACK - 0.05));
    if (t < IMPACT + 0.12) look.copy(BALL).lerp(tmp.copy(G).setY(0.6), glance * (t < GLANCE + 0.6 ? 1 : 0));
    else look.copy(bp).lerp(tmp.copy(G).setY(0.3), eio(k(t, CUPT, DROPT)));
    if (t < SET - 0.4) look.copy(BALL).lerp(tmp.set(-1.65, 1.4, 0.1), 0.5 * Math.sin(Math.PI * k(t, 1.6, 3.6)));
    golfer.pose({ t,
      hip: hipP, yaw, lean, look,
      feet: (i, out) => {
        const sg = i ? 1 : -1;
        out.copy(GP).addScaledVector(TO_T, sg * 0.24).setY(0.085);
        if (i === 0) { out.addScaledVector(TO_T, 0.1 * fin); out.y += 0.06 * fin; }
      },
      hands: (i, shp, out) => {
        if (i === 1) { out.copy(H); return; }
        out.copy(H).addScaledVector(cdir, 0.075);
        // Trail hand lets go for the fist pump.
        tmp.copy(shp).add(tmp2.set(0, 0.38 + 0.05 * Math.sin(Math.PI * k(t, 7.95, 8.3)), 0)).addScaledVector(fwdOf(yaw, tmp2), 0.14);
        out.lerp(tmp, pump * (1 - relax * 0.6));
      },
    });
    golfer.shoe[0].rotation.set(-0.45 * fin, YAW0 + 0.5 * fin, 0);
    golfer.shoe[1].rotation.set(0, YAW0 + 0.25, 0);
    bill.position.copy(golfer.headPos).addScaledVector(golfer.lookD, 0.1).add(tmp.set(0, 0.06, 0));
    bill.quaternion.setFromUnitVectors(tmp.set(0, 0, 1), tmp2.copy(golfer.lookD).setY(golfer.lookD.y * 0.3 + 0.05).normalize());
    club.position.copy(H);
    club.quaternion.setFromUnitVectors(Y, cdir);

    const flying = t > IMPACT && t < DROPT;
    ball.position.copy(bp); ball.visible = t < DROPT + 0.02;
    ballGlow.position.copy(bp); ballGlow.material.opacity = flying ? 0.6 * (1 - 0.4 * k(t, HOPT, CUPT)) : 0;
    ballGlow.scale.setScalar(0.25 + 0.3 * k(t, IMPACT, LANDT));
    for (let j = 0; j < TRN; j++) { ballAt(Math.max(IMPACT, t - j * 0.016), tmp); trPos[j * 3] = tmp.x; trPos[j * 3 + 1] = tmp.y; trPos[j * 3 + 2] = tmp.z; }
    trGeo.attributes.position.needsUpdate = true;
    trail.material.opacity = flying ? 0.85 * (1 - k(t, LANDT, CUPT)) : 0;
    trail.material.size = 0.05 + 0.08 * k(t, IMPACT, LANDT);
    const hit = t > IMPACT ? Math.exp(-9 * (t - IMPACT)) : 0;
    puff.material.opacity = 0.8 * hit; puff.scale.setScalar(0.25 + 0.6 * (1 - hit));
    peg.rotation.z = hit * 0.5;

    // The cup: rattle, burst, sparks, and the call.
    const sink = t > DROPT ? t - DROPT : -1;
    const rattle = sink > 0 ? Math.exp(-5 * sink) * Math.sin(sink * 38) : 0;
    flagG.rotation.set(0.04 * rattle, -0.6, 0.05 * rattle);
    const ca = clothG.attributes.position.array;
    for (let i = 0; i < ca.length; i += 3) {
      const x = clothBase[i], u = x / 0.44;
      ca[i + 2] = Math.sin(x * 9 - t * 6.5) * 0.04 * u + Math.sin(x * 15 - t * 9) * 0.01 * u;
      ca[i + 1] = clothBase[i + 1] - 0.025 * u * u;
    }
    clothG.attributes.position.needsUpdate = true; clothG.computeVertexNormals();
    const bu = sink > 0 ? k(sink, 0, 0.9) : 0;
    burst.scale.setScalar(lerp(0.6, 4.5, eo(bu))); burst.material.opacity = sink > 0 ? 0.85 * (1 - bu) : 0; burst.visible = bu > 0 && bu < 1;
    sparks.forEach((s, i) => {
      const a = i * Math.PI / 3 + 0.3, u = sink > 0 ? eo(k(sink, 0, 0.8)) : 0;
      s.position.set(G.x + Math.cos(a) * 0.6 * u, 0.1 + 0.55 * Math.sin(Math.PI * u * 0.9) + 0.05 * i * u, G.z + Math.sin(a) * 0.6 * u);
      s.material.opacity = sink > 0 ? 0.9 * (1 - k(sink, 0.4, 1.0)) : 0;
    });
    const ci = back(k(t, DROPT + 0.05, DROPT + 0.45)), cout = ei(k(t, 9.2, 9.55));
    chip.position.set(G.x - 0.05, 0.95 + 0.1 * clamp(ci) + Math.sin(t * 2) * 0.01, G.z + 0.2);
    chip.lookAt(camera.position);
    chip.scale.setScalar(Math.max(0.001, ci));
    chip.material.opacity = clamp(ci * 2) * (1 - cout); chip.visible = ci > 0.01;

    // Title over the sky once the camera is wide.
    const ki = back(k(t, 8.3, 8.8)), ti = back(k(t, 8.45, 8.95)), li = eo(k(t, 8.65, 9.15)), out = ei(k(t, 9.25, 9.55));
    lk.copy(camera.position);
    title.position.set(TPOS.x, TPOS.y + (1 - clamp(ti)) * -0.06, TPOS.z); title.lookAt(lk);
    const right = tmp.set(1, 0, 0).applyQuaternion(title.quaternion);
    kicker.quaternion.copy(title.quaternion); line.quaternion.copy(title.quaternion);
    kicker.position.copy(title.position).addScaledVector(right, -(TW - KW) / 2).add(tmp2.set(0, 0.19 + (1 - clamp(ki)) * -0.04, 0));
    line.position.copy(title.position).addScaledVector(right, -(TW - LW) / 2).add(tmp2.set(0, -0.19 - (1 - li) * 0.03, 0));
    [[kicker, ki], [title, ti], [line, li]].forEach(([l, al]) => { l.material.opacity = clamp(al) * (1 - out); l.visible = l.material.opacity > 0.01; });

    // Pollen drifting through the low light around the camera.
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -2.5 + rnd(i, 51) * 6 + Math.sin(t * 0.3 + i) * 0.15 + t * 0.04;
      dpos[i * 3 + 1] = 0.2 + rnd(i, 52) * 2.2 + Math.sin(t * 0.5 + i * 1.3) * 0.06;
      dpos[i * 3 + 2] = -3 + rnd(i, 53) * 5.5 + Math.cos(t * 0.25 + i) * 0.1;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.95 };
}
