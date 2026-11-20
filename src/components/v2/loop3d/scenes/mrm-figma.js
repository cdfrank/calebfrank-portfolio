// MRM Figma 101, 201 and 301 lit loop, 10 s. "Three courses that opened Figma to every department."
// A graphite studio with a terrazzo stair of three wide steps, each with its course number on the riser.
// Four learners in their department colors walk in from the left and climb it together. On each step a
// course card pops up above them and teaches its idea while they watch: 101 drags out a frame, 201 stamps
// instances from a component and pushes one change to all of them, 301 wires a prototype noodle and taps it
// to slide the next screen in. Each step's edge strip lights and its card earns a check. On the top step the
// learners throw up their arms, four ribbons of light run from them down to four department pads (Strategy,
// Creative, Data, Account) which light in turn, and the camera pulls back to the whole stair under the title.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { makeCrowd } from '../person.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BG = 0x15171c;
const SEL = '#0d99ff';
// The three courses: number, what it unlocks, color.
const COURSES = [
  { n: '101', w: 'Frames', c: '#ff6a4d', h: 0xff6a4d },
  { n: '201', w: 'Components', c: '#a46bff', h: 0xa46bff },
  { n: '301', w: 'Prototyping', c: '#29d68f', h: 0x29d68f },
];
const DEPTS = [
  { n: 'STRATEGY', c: '#f2b440', h: 0xf2b440 },
  { n: 'CREATIVE', c: '#ff5f7e', h: 0xff5f7e },
  { n: 'DATA', c: '#2ec4c4', h: 0x2ec4c4 },
  { n: 'ACCOUNT', c: '#5b8cff', h: 0x5b8cff },
];
// Stair: three steps side by side along x, rising to the right.
const SX = [-1.2, 0, 1.2], SH = [0.24, 0.48, 0.72], SW = 1.2, SDP = 1.8;
const RISERS = [-1.8, -0.6, 0.6];
const gAt = (x) => (x < -1.8 ? 0 : x < -0.6 ? 0.24 : x < 0.6 ? 0.48 : 0.72);
// Smoothed ground for the hips, so the body rises across each riser instead of popping.
const hipG = (x) => RISERS.reduce((a, r) => a + 0.24 * ss(clamp((x - r + 0.22) / 0.5)), 0);
// Group route: [start time, end time, x]. The walk-in, then one step up for each course.
const X0 = -3.05;
const SEGS = [[0.3, 2.0, -1.2], [2.95, 4.05, 0], [5.0, 6.1, 1.2]];
// When each card pops, teaches (demo window) and earns its check.
const CARD_T = [[1.75, 1.95, 2.85], [3.8, 4.0, 4.9], [5.85, 6.05, 6.95]];
const CHEER = 7.0, RIB = 7.15;
// Learners: department, offset from the group centre, start delay, look.
const LEARN = [
  { d: 0, dx: -0.27, dz: -0.38, dl: 0.07, skin: 0x8a5a3e, hair: 0x15100d, pants: 0x2a2f3a, shoe: 0xe9e4da, bun: false, chest: 0.15 },
  { d: 2, dx: 0.22, dz: -0.44, dl: 0.17, skin: 0xe2b08e, hair: 0x7a3b1c, pants: 0x30343c, shoe: 0x1b1d20, bun: true, chest: 0.138 },
  { d: 1, dx: -0.16, dz: 0.3, dl: 0.0, skin: 0xc68b68, hair: 0x2a1a12, pants: 0x3a3340, shoe: 0xf2efe8, bun: true, chest: 0.14 },
  { d: 3, dx: 0.3, dz: 0.36, dl: 0.11, skin: 0x5e3a28, hair: 0x0e0b0a, pants: 0x262a33, shoe: 0x2b2f36, bun: false, chest: 0.152 },
];
const PODS = [-1.95, -0.65, 0.65, 1.95], POD_Z = 1.95;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const fwdOf = (yaw, out = V(0, 0, 0)) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = V(0, 0, 0)) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));
const ss = (x) => x * x * (3 - 2 * x);
// Shortest signed turn from angle a to angle b.
const angD = (a, b) => { let d = (b - a) % (2 * Math.PI); if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };

// People come from the shared instanced crowd in ../person.js.

// ------------------------------------------------------------------ course cards
// Each card is a little Figma canvas: a chip with the course number, the idea it unlocks, and a demo that
// plays from p = 0 to 1. done (0..1) pops the check in the corner.
function cursor(c, x, y, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.beginPath(); c.moveTo(0, 0); c.lineTo(0, 34); c.lineTo(9, 26); c.lineTo(16, 41); c.lineTo(23, 38); c.lineTo(16, 23); c.lineTo(28, 23); c.closePath();
  c.fillStyle = '#ffffff'; c.fill(); c.lineWidth = 3; c.strokeStyle = '#111317'; c.stroke();
  c.restore();
}
function drawCard(c, W, H, ci, p, done, live) {
  const C = COURSES[ci];
  c.clearRect(0, 0, W, H);
  c.fillStyle = '#16171b'; roundRect(c, 0, 0, W, H, 30); c.fill();
  c.strokeStyle = `rgba(255,255,255,${0.08 + 0.1 * live})`; c.lineWidth = 3; roundRect(c, 1.5, 1.5, W - 3, H - 3, 29); c.stroke();
  // Header: course chip and the idea it teaches.
  c.fillStyle = C.c; roundRect(c, 30, 26, 150, 70, 35); c.fill();
  c.fillStyle = '#121316'; c.font = `800 46px ${MONO}`; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(C.n, 105, 63);
  c.textAlign = 'left'; c.fillStyle = '#f3f0ea'; c.font = `800 62px ${SANS}`; c.fillText(C.w, 204, 63);
  // Canvas area with a dot grid.
  const AX = 30, AY = 120, AW = W - 60, AH = H - 150;
  c.fillStyle = '#202228'; roundRect(c, AX, AY, AW, AH, 20); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.07)';
  for (let x = AX + 24; x < AX + AW; x += 32) for (let y = AY + 22; y < AY + AH; y += 32) c.fillRect(x - 1.5, y - 1.5, 3, 3);
  c.save(); c.beginPath(); roundRect(c, AX, AY, AW, AH, 20); c.clip();
  if (ci === 0) demoFrame(c, p, C);
  else if (ci === 1) demoComponent(c, p, C);
  else demoProto(c, p, C);
  c.restore();
  // The check.
  if (done > 0) {
    const s = back(done);
    c.save(); c.translate(W - 66, 61); c.scale(s, s);
    c.fillStyle = '#2fd27a'; c.beginPath(); c.arc(0, 0, 34, 0, 7); c.fill();
    c.strokeStyle = '#0d2016'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(-15, 1); c.lineTo(-4, 12); c.lineTo(16, -11); c.stroke();
    c.restore();
  }
}
const handle = (c, x, y) => { c.fillStyle = '#ffffff'; c.fillRect(x - 7, y - 7, 14, 14); c.strokeStyle = SEL; c.lineWidth = 3; c.strokeRect(x - 7, y - 7, 14, 14); };
// 101: the cursor drags out a frame, then the frame fills with a layout.
function demoFrame(c, p, C) {
  const a = [110, 160], dr = eo(clamp(p / 0.55)), fill = eio(k(p, 0.55, 0.95));
  const w = 520 * dr, h = 280 * dr;
  if (p <= 0) { cursor(c, a[0], a[1]); return; }
  c.fillStyle = `rgba(244,241,234,${0.12 + 0.88 * eo(clamp(p / 0.3))})`; c.fillRect(a[0], a[1], w, h);
  if (fill > 0) {
    c.globalAlpha = fill;
    c.fillStyle = C.c; c.fillRect(a[0], a[1], w, 56);
    c.fillStyle = '#2a2c33'; roundRect(c, a[0] + 28, a[1] + 84, 230, 22, 11); c.fill();
    c.fillStyle = '#9a9ca4'; roundRect(c, a[0] + 28, a[1] + 122, 280, 14, 7); c.fill(); roundRect(c, a[0] + 28, a[1] + 148, 240, 14, 7); c.fill();
    const g = c.createLinearGradient(a[0] + 340, a[1] + 84, a[0] + 492, a[1] + 250); g.addColorStop(0, '#ffb38a'); g.addColorStop(1, C.c);
    c.fillStyle = g; roundRect(c, a[0] + 340, a[1] + 84, 152, 166, 14); c.fill();
    c.fillStyle = C.c; roundRect(c, a[0] + 28, a[1] + 200, 150, 50, 25); c.fill();
    c.globalAlpha = 1;
  }
  c.strokeStyle = SEL; c.lineWidth = 3; c.strokeRect(a[0], a[1], w, h);
  handle(c, a[0], a[1]); handle(c, a[0] + w, a[1]); handle(c, a[0], a[1] + h); handle(c, a[0] + w, a[1] + h);
  const cx = a[0] + w + (1 - dr) * 0, cy = a[1] + h;
  cursor(c, cx + 6 + 40 * fill, cy + 6 + 20 * fill);
}
// 201: a component stamps out three instances, then one change to the main component reaches all of them.
function demoComponent(c, p, C) {
  const swap = (at) => eio(k(p, at, at + 0.1));
  const card = (x, y, s, sw, main, ring) => {
    if (s <= 0.01) return;
    c.save(); c.translate(x + 95, y + 46); c.scale(s, s); c.translate(-95, -46);
    c.fillStyle = '#2c2e36'; roundRect(c, 0, 0, 190, 92, 14); c.fill();
    c.fillStyle = sw > 0.5 ? C.c : '#7d808a';
    const r = parseInt(C.c.slice(1, 3), 16), g = parseInt(C.c.slice(3, 5), 16), b = parseInt(C.c.slice(5, 7), 16);
    c.fillStyle = `rgb(${Math.round(lerp(125, r, sw))},${Math.round(lerp(128, g, sw))},${Math.round(lerp(138, b, sw))})`;
    roundRect(c, 18, 22, 110, 48, 24); c.fill();
    c.fillStyle = '#9a9ca4'; roundRect(c, 142, 30, 30, 10, 5); c.fill(); roundRect(c, 142, 52, 22, 10, 5); c.fill();
    c.strokeStyle = C.c; c.lineWidth = 3;
    if (main) c.setLineDash([12, 8]);
    roundRect(c, -6, -6, 202, 104, 18); c.stroke(); c.setLineDash([]);
    // Component glyph in the corner: a diamond, hollow on instances.
    c.save(); c.translate(-6, -6); c.rotate(Math.PI / 4);
    c.fillStyle = main ? C.c : '#16171b'; c.fillRect(-9, -9, 18, 18); c.strokeStyle = C.c; c.lineWidth = 3; c.strokeRect(-9, -9, 18, 18);
    c.restore();
    if (ring > 0 && ring < 1) { c.strokeStyle = `rgba(255,255,255,${0.8 * (1 - ring)})`; c.lineWidth = 4; roundRect(c, -6 - ring * 20, -6 - ring * 20, 202 + ring * 40, 104 + ring * 40, 18 + ring * 10); c.stroke(); }
    c.restore();
  };
  const MX = 80, MY = 230, IX = 430, IY = [140, 250, 360];
  const pops = [0.08, 0.22, 0.36], prop = [0.66, 0.74, 0.82];
  // Faint links from the main component to its instances.
  c.strokeStyle = 'rgba(164,107,255,0.35)'; c.lineWidth = 3;
  IY.forEach((y, i) => { const s = clamp(k(p, pops[i], pops[i] + 0.1)); if (s <= 0) return; c.beginPath(); c.moveTo(MX + 196, MY + 46); c.bezierCurveTo(MX + 270, MY + 46, IX - 80, y + 46, MX + 196 + (IX - 6 - MX - 196) * s, y + 46); c.stroke(); });
  const msw = swap(0.55);
  card(MX, MY, 1, msw, true, k(p, 0.55, 0.75));
  IY.forEach((y, i) => card(IX, y, back(k(p, pops[i], pops[i] + 0.16)), swap(prop[i]), false, k(p, prop[i], prop[i] + 0.2)));
  // The cursor clicks the main component's fill just before the change goes out.
  const cp = eio(k(p, 0.4, 0.55));
  cursor(c, lerp(300, MX + 90, cp), lerp(470, MY + 56, cp), 1 - 0.1 * Math.sin(Math.PI * k(p, 0.52, 0.6)));
}
// 301: a prototype noodle runs from a button to the next screen, the button is tapped, the screen slides in.
function demoProto(c, p, C) {
  const A = [90, 150], B = [450, 150], FW = 200, FH = 300;
  const slide = eio(k(p, 0.62, 0.88)), nood = eo(k(p, 0.06, 0.46)), tap = k(p, 0.5, 0.7);
  const screen = (x, y, hue, dim) => {
    c.fillStyle = '#f2efe8'; roundRect(c, x, y, FW, FH, 20); c.fill();
    c.fillStyle = hue; roundRect(c, x, y, FW, 120, 20); c.fill(); c.fillRect(x, y + 60, FW, 60);
    c.fillStyle = '#2a2c33'; roundRect(c, x + 18, y + 142, 130, 16, 8); c.fill();
    c.fillStyle = '#a0a2aa'; roundRect(c, x + 18, y + 172, 160, 11, 5); c.fill(); roundRect(c, x + 18, y + 192, 120, 11, 5); c.fill();
    if (dim > 0) { c.fillStyle = `rgba(16,17,20,${dim})`; roundRect(c, x, y, FW, FH, 20); c.fill(); }
  };
  screen(A[0], A[1], '#3a3d48', 0.55 * slide);
  // The button the noodle starts from.
  const bx = A[0] + 18, by = A[1] + 226, bw = 164, bh = 48;
  c.fillStyle = C.c; roundRect(c, bx, by, bw, bh, 24); c.fill();
  if (tap > 0 && tap < 1) { c.strokeStyle = `rgba(255,255,255,${0.9 * (1 - tap)})`; c.lineWidth = 5; c.beginPath(); c.arc(bx + bw * 0.7, by + bh / 2, 10 + 60 * eo(tap), 0, 7); c.stroke(); }
  // The noodle, drawn out along a curve, fading once the screen slides.
  const p0 = [bx + bw, by + bh / 2], p3 = [B[0], B[1] + FH / 2], p1 = [p0[0] + 120, p0[1]], p2 = [p3[0] - 120, p3[1]];
  const at = (u) => { const v = 1 - u; return [v * v * v * p0[0] + 3 * v * v * u * p1[0] + 3 * v * u * u * p2[0] + u * u * u * p3[0], v * v * v * p0[1] + 3 * v * v * u * p1[1] + 3 * v * u * u * p2[1] + u * u * u * p3[1]]; };
  if (nood > 0) {
    c.globalAlpha = 1 - slide;
    c.strokeStyle = SEL; c.lineWidth = 5; c.beginPath();
    for (let i = 0; i <= 40; i++) { const q = at((i / 40) * nood); if (i) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
    c.stroke();
    c.fillStyle = SEL; c.beginPath(); c.arc(p0[0], p0[1], 9, 0, 7); c.fill();
    const e = at(nood), e2 = at(Math.max(0, nood - 0.04)), ang = Math.atan2(e[1] - e2[1], e[0] - e2[0]);
    if (nood > 0.95) { c.save(); c.translate(e[0], e[1]); c.rotate(ang); c.beginPath(); c.moveTo(4, 0); c.lineTo(-16, -11); c.lineTo(-16, 11); c.closePath(); c.fill(); c.restore(); }
    c.globalAlpha = 1;
  }
  // The next screen: waits on the right, then slides over the first.
  screen(lerp(B[0], A[0] + 14, slide), B[1] - 8 * Math.sin(Math.PI * slide), C.c, 0);
  if (p < 0.62) cursor(c, lerp(560, bx + bw * 0.7, eio(k(p, 0.3, 0.5))), lerp(440, by + bh / 2, eio(k(p, 0.3, 0.5))), 1 - 0.12 * Math.sin(Math.PI * k(p, 0.48, 0.58)));
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 7.5, 16);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = V(0, 0, 0), s4 = V(1, 1, 1);

  // ----------------------------------------------------------- studio
  const floor = mesh(new THREE.PlaneGeometry(22, 14), std(0xffffff, { map: grainTex('#23262c', { size: 256, speck: 0.07, blot: 0.1, seed: 71, repeat: 7 }), roughness: 0.42, metalness: 0.15 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Back wall of vertical acoustic slats, lit from below by a cool wash.
  const wall = mesh(new THREE.PlaneGeometry(14, 6), std(0x1b1e24, { roughness: 0.9 }), { cast: false });
  wall.position.set(0, 3, -2.6); scene.add(wall);
  const NSL = 44;
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 4.6, 0.06), std(0x2a2e36, { roughness: 0.7 }), NSL);
  for (let i = 0; i < NSL; i++) { m4.compose(p4.set(-5.4 + i * 0.25, 2.3, -2.55), q4.identity(), s4.set(1, 1, 1)); slats.setMatrixAt(i, m4); }
  slats.receiveShadow = true; scene.add(slats);
  const washTex = canvasTex(8, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const wash = new THREE.Mesh(new THREE.PlaneGeometry(12, 2.6), new THREE.MeshBasicMaterial({ map: washTex, color: 0x3b4f7a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  wash.position.set(0, 1.3, -2.5); scene.add(wash);

  // ----------------------------------------------------------- the stair
  const terr = std(0xffffff, { map: grainTex('#8c8f95', { size: 256, speck: 0.3, blot: 0.05, seed: 17, repeat: 2 }), roughness: 0.38, metalness: 0.05 });
  const strips = [], risers = [];
  SX.forEach((x, i) => {
    const b = mesh(new RoundedBoxGeometry(SW - 0.01, SH[i], SDP, 2, 0.015), terr);
    b.position.set(x, SH[i] / 2, 0); scene.add(b);
    // Edge strip along the top front edge, dark until the step's course is learned.
    const s = new THREE.Mesh(new THREE.BoxGeometry(SW - 0.06, 0.016, 0.016), new THREE.MeshBasicMaterial({ color: 0x222428, toneMapped: false }));
    s.position.set(x, SH[i] - 0.004, SDP / 2 + 0.004); scene.add(s);
    const g = glow(COURSES[i].h, 1, 0, 0.45); g.scale.set(SW * 1.4, 0.3, 1); g.position.set(x, SH[i], SDP / 2 + 0.06); scene.add(g);
    strips.push({ s, g });
    // Course number on the riser.
    const r = label(COURSES[i].n, { font: `800 84px ${MONO}`, fg: '#e9e6df', h: Math.min(0.2, SH[i] * 0.72), pad: 10, track: 4 });
    r.material.transparent = true; r.material.opacity = 0.5;
    r.position.set(x - SW / 2 + 0.06 + r.geometry.parameters.width / 2, SH[i] / 2, SDP / 2 + 0.003); scene.add(r);
    r.userData.tag = 'riser' + i;
    risers.push(r);
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x8fa2c8, 0x17130f, 0.36));
  const key = new THREE.SpotLight(0xffe2c4, 64, 0, 0.62, 0.65, 1.3);
  key.position.set(-2.6, 5.2, 4.2); key.target.position.set(0.1, 0.6, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 2; key.shadow.camera.far = 12;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7fa6ff, 1.5); rim.position.set(3.2, 3.0, -3.4); scene.add(rim);
  // A practical light that follows the active card and spills its color onto the learners.
  const cardL = new THREE.PointLight(0xffffff, 0, 3.4, 1.6); scene.add(cardL);
  const CL = COURSES.map((c) => new THREE.Color(c.h));

  // ----------------------------------------------------------- course cards
  const CW = 1.12, CHh = CW * 512 / 768;
  const CARD_POS = SX.map((x, i) => V(x, SH[i] + 2.12, -0.62));
  const cards = COURSES.map((C, i) => {
    const ct = canvasTex(768, 512);
    const g = new THREE.Group(); g.position.copy(CARD_POS[i]); scene.add(g);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CW, CHh), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = 0.012; g.add(face);
    const slab = mesh(new RoundedBoxGeometry(CW + 0.03, CHh + 0.03, 0.02, 2, 0.01), std(0x0e0f12, { roughness: 0.35, metalness: 0.6 }), { cast: false, receive: false });
    g.add(slab);
    const halo = glow(C.h, 1, 0, 0.5); halo.scale.set(CW * 2.1, CHh * 2.1, 1); halo.position.z = -0.08; g.add(halo);
    g.lookAt(CARD_POS[i].x * 0.35 + 0.1, CARD_POS[i].y - 0.4, 6.5);
    g.userData.tag = 'card' + i;
    return { g, ct, face, halo, key: '' };
  });
  const drawCards = (t) => cards.forEach((cd, i) => {
    const [, d0, dn] = CARD_T[i];
    const p = clamp(k(t, d0, dn - 0.05)), done = k(t, dn, dn + 0.35), live = 1 - k(t, dn + 0.3, dn + 0.8);
    const key = Math.round(p * 48) + '|' + Math.round(done * 14) + '|' + Math.round(live * 6);
    if (key === cd.key) return; cd.key = key;
    cd.ct.redraw((c, w, h) => drawCard(c, w, h, i, p, done, live));
  });

  // ----------------------------------------------------------- department pads
  // Wedge pads on the floor in front of the stair, their faces tilted up toward the camera.
  const padBody = new THREE.InstancedMesh(new RoundedBoxGeometry(1.02, 0.16, 0.5, 2, 0.03), std(0x1d2026, { roughness: 0.45, metalness: 0.5 }), PODS.length);
  padBody.castShadow = true; padBody.receiveShadow = true; scene.add(padBody);
  PODS.forEach((x, i) => { m4.compose(p4.set(x, 0.08, POD_Z), q4.identity(), s4.set(1, 1, 1)); padBody.setMatrixAt(i, m4); });
  const pads = DEPTS.map((Dp, i) => {
    const ct = canvasTex(512, 160, (c, w, h) => {
      c.fillStyle = '#101216'; roundRect(c, 0, 0, w, h, 22); c.fill();
      c.fillStyle = Dp.c; roundRect(c, 0, h - 14, w, 14, 7); c.fill();
      c.fillStyle = Dp.c; c.font = `800 64px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '4px';
      c.fillText(Dp.n, w / 2, h / 2 - 4);
    });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.96, 0.3), new THREE.MeshBasicMaterial({ map: ct.tex, color: 0x333333, toneMapped: false }));
    face.position.set(PODS[i], 0.26, POD_Z + 0.02); face.rotation.x = -0.95; face.userData.tag = 'pad' + i; scene.add(face);
    const g = glow(Dp.h, 1, 0, 0.45); g.scale.set(1.9, 0.75, 1); g.position.set(PODS[i], 0.3, POD_Z + 0.1); scene.add(g);
    const pool = glow(Dp.h, 1, 0, 0.5); pool.scale.set(1.6, 0.5, 1); pool.position.set(PODS[i], 0.03, POD_Z - 0.2); scene.add(pool);
    return { face, g, pool, c: new THREE.Color(Dp.h) };
  });

  // ----------------------------------------------------------- the learners
  const people = LEARN.map((L) => ({ skin: L.skin, top: DEPTS[L.d].h, pants: L.pants, shoe: L.shoe, hair: L.hair, bun: L.bun, chest: L.chest }));
  const crowd = makeCrowd(scene, people);
  scene.userData.crowd = crowd;
  // Group centre x at time t (per learner, with their own start delay), and its speed.
  const gx = (t) => {
    let x = X0;
    for (const [a, b, to] of SEGS) { if (t <= a) break; x = lerp(x, to, ss(k(t, a, b))); }
    return x;
  };
  const STRIDE = 0.95, AMP = STRIDE / (2 * Math.PI);
  const hipP = V(0, 0, 0), look = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), F = V(0, 0, 0), S = V(0, 0, 0);
  // Where everyone's chest is once they stand on the top step: the ribbons start there.
  const CHEST_END = [];

  // The camera rides with the group, about 4.4 m in front of it.
  const CAM_Z = 4.4, camX = (t) => gx(t);
  function posePeople(t) {
    LEARN.forEach((L, i) => {
      const tt = t - L.dl;
      const x = gx(tt) + L.dx, z = L.dz;
      const v = (gx(tt + 0.03) - gx(tt - 0.03)) / 0.06;
      const w = clamp(Math.abs(v) / 0.55);
      const s = x - X0 - L.dx;                    // distance walked so far
      const ph = (s / STRIDE) * Math.PI * 2 + i * 0.7;
      const ci = clamp(Math.floor((x + 1.8) / 1.2), 0, 2);
      // Look at the card above the step they are on, or ahead while walking; at the end, toward the pads.
      const rest = 1 - w;
      const cp = CARD_POS[ci];
      look.set(lerp(x + 2, cp.x, rest), lerp(1.4 + hipG(x), cp.y, rest * 0.8), lerp(z, cp.z, rest));
      const toPods = eio(k(t, RIB + 0.1, RIB + 0.7));
      if (toPods > 0) look.lerp(tmp.set(PODS[L.d], 0.3, POD_Z), toPods);
      // Walking, they face +x. At rest the whole body turns with the eyes: square to what they watch,
      // opened well toward the camera so faces stay readable, and the neck only finishes the turn.
      const yLook = Math.atan2(look.x - x, look.z - z);
      const yView = yLook + angD(yLook, Math.atan2(camX(t) - x, CAM_Z - z)) * 0.42;
      const yaw = Math.PI / 2 + angD(Math.PI / 2, yView) * ss(rest);
      fwdOf(yaw, F); sideOf(yaw, S);
      const cheer = Math.sin(Math.PI * k(t, CHEER + i * 0.06, CHEER + 0.8 + i * 0.06)) * (t > CHEER ? 1 : 0);
      const pump = [0, 1, 2].map((j) => Math.sin(Math.PI * k(t, CARD_T[j][2] + 0.05 + i * 0.05, CARD_T[j][2] + 0.5 + i * 0.05)));
      const bob = 0.018 * Math.cos(ph * 2) * w;
      const breathe = 0.004 * Math.sin(t * 2.1 + i);
      const sway = 0.02 * Math.sin(t * 0.9 + i * 1.7) * rest;
      // The hips never rise past what the lower foot can reach, so a climbing leg never over-stretches.
      const fxs = [0, 1].map((f) => x + AMP * Math.sin(ph + f * Math.PI) * w * F.x);
      const fg = fxs.map((fx) => gAt(fx + 0.14 * w));
      const hg = Math.min(hipG(x), Math.min(fg[0], fg[1]) + 0.05);
      hipP.set(x + sway * S.x, 0.93 + hg + bob + breathe - 0.03 * cheer, z + sway * S.z);
      crowd.pose(i, { t,
        hip: hipP, yaw, lean: 0.05 + 0.06 * w - 0.08 * cheer, tilt: 0.03 * Math.sin(t * 0.9 + i * 1.7) * rest,
        look, nod: 0.05 * Math.sin(Math.PI * k(t, CARD_T[ci][2], CARD_T[ci][2] + 0.4)),
        feet: (f, out) => {
          const sg = f ? 1 : -1, fp = ph + f * Math.PI;
          const fx = fxs[f], gy = fg[f];
          out.set(fx + sg * 0.1 * S.x, gy + 0.085 + 0.12 * Math.max(0, Math.cos(fp)) * w, z + sg * 0.1 * S.z + AMP * Math.sin(fp) * w * F.z);
          return gAt(fx);
        },
        hands: (h, sh, out) => {
          const sg = h ? 1 : -1;
          const swing = -Math.sin(ph + h * Math.PI) * w;
          out.copy(sh).add(tmp2.set(0, -0.52, 0)).addScaledVector(F, 0.06 + 0.16 * swing).addScaledVector(S, sg * 0.06);
          // One fist pump per finished course (alternate hands), both arms up on the top step.
          const pp = pump[ci] * (h === (i % 2) ? 1 : 0);
          if (pp > 0) out.lerp(tmp.copy(sh).add(tmp2.set(0, 0.42, 0)).addScaledVector(F, 0.08).addScaledVector(S, sg * 0.05), pp);
          if (cheer > 0) out.lerp(tmp.copy(sh).add(tmp2.set(0, 0.5, 0)).addScaledVector(F, 0.04).addScaledVector(S, sg * 0.16), ss(clamp(cheer * 1.4)));
          out.y += 0.01 * Math.sin(t * 2 + h + i) * rest;
        },
      });
    });
    crowd.commit();
  }
  posePeople(RIB);
  LEARN.forEach((L, i) => CHEST_END.push(crowd.chest[i].clone()));

  // ----------------------------------------------------------- ribbons to the departments
  const ribbons = LEARN.map((L, i) => {
    const a = CHEST_END[i], b = V(PODS[L.d], 0.3, POD_Z);
    const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + 0.75; m.z += 0.35;
    const curve = new THREE.QuadraticBezierCurve3(a, m, b);
    const geo = new THREE.TubeGeometry(curve, 64, 0.016, 6, false);
    const r = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: DEPTS[L.d].h, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    r.frustumCulled = false; scene.add(r);
    const spark = glow(DEPTS[L.d].h, 0.32, 0, 0.35); scene.add(spark);
    return { r, curve, spark, n: geo.index.count, t0: RIB + i * 0.09 };
  });

  // ----------------------------------------------------------- title
  const kicker = label('MRM', { font: `700 60px ${MONO}`, fg: '#ff8a6a', h: 0.11, pad: 8, track: 8 });
  const title = label('Figma 101, 201, and 301', { font: `800 72px ${SANS}`, fg: '#f4f1ea', h: 0.2, pad: 8, track: 0 });
  const line1 = label('Three courses that opened', { font: `600 54px ${SANS}`, fg: '#c9ccd6', h: 0.105, pad: 8, track: 0 });
  const line2 = label('Figma to every department.', { font: `600 54px ${SANS}`, fg: '#c9ccd6', h: 0.105, pad: 8, track: 0 });
  const TL = [kicker, title, line1, line2];
  TL.forEach((l, i) => { l.material.fog = false; l.userData.tag = ['kick', 'title', 'line1', 'line2'][i]; scene.add(l); });
  const TX = -2.95, TZ = 0.75;

  // ----------------------------------------------------------- dust
  const DN = 130, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe2c4, size: 0.014, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  // Tracks the group up the stair, settling on each card while it teaches, then pulls back for the payoff.
  const L_ = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-2.75, 1.6, 4.1]], [1.9, [-1.45, 1.86, 4.45]], [2.85, [-1.3, 1.88, 4.25], L_],
    [4.0, [-0.1, 2.06, 4.45]], [4.85, [0.0, 2.08, 4.25], L_],
    [6.05, [1.05, 2.28, 4.5]], [6.95, [1.15, 2.3, 4.3], L_],
    [7.85, [-0.15, 2.7, 6.75]], [10, [-0.22, 2.66, 7.0], L_],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-2.3, 1.3, 0]], [1.9, [-1.25, 1.92, -0.2]], [2.85, [-1.2, 1.95, -0.25], L_],
    [4.0, [-0.05, 2.15, -0.25]], [4.85, [0.0, 2.17, -0.3], L_],
    [6.05, [1.1, 2.37, -0.25]], [6.95, [1.15, 2.39, -0.3], L_],
    [7.85, [-0.12, 1.46, 0.35]], [10, [-0.12, 1.44, 0.35], L_],
  ]);
  const tgt = V(0, 0, 0), lk = V(0, 0, 0);

  function update(t) {
    const p = camPos(t), qv = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(qv[0], qv[1], qv[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [1.9, 33], [6.95, 33], [7.85, 40], [10, 40]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    posePeople(t);

    // Cards: pop in when the group arrives, teach, check; the finished ones stay on, a little dimmer.
    drawCards(t);
    let act = -1;
    cards.forEach((cd, i) => {
      const [pop, , dn] = CARD_T[i];
      const s = back(k(t, pop, pop + 0.45));
      cd.g.scale.setScalar(Math.max(0.001, s));
      cd.g.visible = t > pop;
      cd.g.position.y = CARD_POS[i].y + (1 - clamp(s)) * -0.25 + Math.sin(t * 1.3 + i) * 0.01;
      const live = 1 - k(t, dn + 0.3, dn + 0.8);
      cd.face.material.color.setScalar(lerp(0.62, 1, live));
      cd.halo.material.opacity = (0.16 + 0.22 * live + 0.35 * Math.exp(-5 * Math.max(0, t - dn)) * (t > dn ? 1 : 0)) * clamp(s);
      if (t > pop && t < dn + 0.8) act = i;
      // Edge strip and riser number light once the course is done.
      const on = eo(k(t, dn, dn + 0.3));
      strips[i].s.material.color.copy(CL[i]).multiplyScalar(lerp(0.1, 1.6, on));
      strips[i].g.material.opacity = 0.5 * on + 0.4 * Math.exp(-4 * Math.max(0, t - dn)) * (t > dn ? 1 : 0);
      risers[i].material.opacity = lerp(0.42, 0.95, on);
    });
    if (act >= 0) {
      const [pop, , dn] = CARD_T[act];
      cardL.position.copy(CARD_POS[act]).add(tmp.set(0, -0.35, 0.6));
      cardL.color.copy(CL[act]);
      cardL.intensity = 4.5 * eo(k(t, pop, pop + 0.4)) * (1 - k(t, dn + 0.3, dn + 0.8));
    } else cardL.intensity = 0;

    // Payoff: ribbons run from each learner to their department pad, which lights as it lands.
    ribbons.forEach((rb, i) => {
      const g = eio(k(t, rb.t0, rb.t0 + 0.6));
      rb.r.geometry.setDrawRange(0, Math.floor(rb.n * g / 36) * 36);
      rb.r.visible = g > 0.01;
      rb.r.material.opacity = 0.9 * (1 - 0.45 * k(t, rb.t0 + 0.8, rb.t0 + 1.6));
      rb.curve.getPoint(g, rb.spark.position);
      rb.spark.material.opacity = 0.95 * Math.sin(Math.PI * g);
      rb.spark.visible = g > 0 && g < 1;
      const pd = pads[LEARN[i].d], land = rb.t0 + 0.6;
      const on = eo(k(t, land, land + 0.25)), flash = t > land ? Math.exp(-5 * (t - land)) : 0;
      pd.face.material.color.setScalar(lerp(0.22, 1, on));
      pd.g.material.opacity = 0.28 * on + 0.55 * flash;
      pd.pool.material.opacity = 0.35 * on;
    });

    // Title, left of the stair once everyone has climbed.
    const ti = eo(k(t, 7.95, 8.5)), li = eo(k(t, 8.15, 8.7)), to = ei(k(t, 9.2, 9.55));
    lk.copy(camera.position);
    const tw = (l) => l.geometry.parameters.width;
    [[kicker, 1.68, ti], [title, 1.48, ti], [line1, 1.29, li], [line2, 1.17, li]].forEach(([l, y, al]) => {
      l.position.set(TX + tw(l) / 2, y + (1 - al) * 0.05, TZ);
      l.lookAt(lk.x, l.position.y, lk.z);
      l.material.opacity = al * (1 - to); l.visible = al > 0.01;
    });
    key.intensity = 64 + 8 * eo(k(t, 7.4, 8.4));

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -3.2 + rnd(i, 81) * 6.4 + Math.sin(t * 0.3 + i) * 0.1;
      dpos[i * 3 + 1] = 0.2 + rnd(i, 82) * 3.2 + Math.sin(t * 0.4 + i * 1.3) * 0.06;
      dpos[i * 3 + 2] = -1.6 + rnd(i, 83) * 4.2 + Math.cos(t * 0.25 + i) * 0.08;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.75 };
}
