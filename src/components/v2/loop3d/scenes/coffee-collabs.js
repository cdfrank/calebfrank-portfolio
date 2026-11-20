// MRM UX team Coffee & Collabs lit loop, 10 s. "Team knowledge sharing that reached the Toronto and New York offices."
// An espresso-brown home-office lounge under a pink neon sign. Close on the coffee bar: the host tilts a
// glass carafe and pours a mug, steam curling off it, while the neon flickers on behind. Mug in hand, they
// walk to the screen and open the first talk for three colleagues on stools. Then the two sliding panels in
// the back wall roll open on the Toronto and New York offices, each a lit room with its own skyline and its
// own screen; links of light jump from the home screen into theirs, both screens light with the same talk
// and the people there raise their mugs. Talks two and three flip across all three screens together, a card
// for each drops into the stack on the side table, and the room applauds as the line settles.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BG = 0x140d0a;
const NEON = '#ff7a8a', NEON_H = 0xff6a7e, PEACH = '#ff9a6a', CREAM = '#f0e2cc';
const WZ = -2.2;                                   // back wall of the home office
const PORT = [[-2.75, -1.55], [1.55, 2.75]], PY = [0.75, 2.05];
// Remote rooms sit behind the portals, wider on the outer side, where the camera's view through them lands.
const ROOMS = [
  { name: 'TORONTO', cx: -2.3, light: 0x7fb4ff, wall: '#1d2a3a', sky: ['#0f1d3a', '#2f5d8a', '#e6a77a'], side: -1 },
  { name: 'NEW YORK', cx: 2.3, light: 0xffb070, wall: '#3a2418', sky: ['#1a1030', '#7a3a5a', '#ffb070'], side: 1 },
];
const RZ0 = WZ - 0.05, RZ1 = WZ - 1.65;            // remote room depth
// Talks: when each one goes up on the screens (home first, then in sync everywhere).
const TALK_T = [3.35, 6.45, 7.15];
const OPEN = 4.35, LINK = [4.85, 5.0], LAND = [5.3, 5.45];
const CARD_T = [3.75, 6.75, 7.45];
const CLAP = 7.75;
// Coffee bar and the pour.
const BAR = [1.5, 0.78], BAR_TOP = 0.95;
const MUG0 = [1.5, BAR_TOP, 0.66], CARAFE0 = [1.86, BAR_TOP, 0.62];
const STAGE = [0.95, -1.5];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const fwdOf = (yaw, out = V(0, 0, 0)) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = V(0, 0, 0)) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));
const ss = (x) => x * x * (3 - 2 * x);

// People, instanced. Adapted from the capsule figures in farxiga.js: every body part of every person shares
// one InstancedMesh per part, so a whole crowd costs about a dozen draw calls. Each person is posed in
// world space from a few inputs (hip, facing, lean, ankle and wrist targets, where they look) with two-bone
// IK for knees and elbows, so every frame stands alone. list: [{ skin, top, sleeve, fore, pants, shoe, hair,
// chest, bun }] as hex colors. sc scales a whole person about their floor point, for pop-ins.
function makeCrowd(scene, list) {
  const N = list.length;
  const skinM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const clothM = std(0xffffff, { roughness: 0.86 });
  const shoeM = std(0xffffff, { roughness: 0.5 });
  const col = new THREE.Color();
  const part = (geo, mat, per, colorOf) => {
    const im = new THREE.InstancedMesh(geo, mat, N * per);
    im.castShadow = true; im.receiveShadow = true; im.frustumCulled = false;
    for (let i = 0; i < N; i++) for (let j = 0; j < per; j++) im.setColorAt(i * per + j, col.set(colorOf(list[i], j)));
    scene.add(im);
    return im;
  };
  const LT = 0.44, LS = 0.43, LU = 0.29, LF = 0.27;
  const P = {
    pelvis: part(new THREE.CapsuleGeometry(0.1, 0.12, 4, 10), clothM, 1, (p) => p.pants),
    torso: part(new THREE.CapsuleGeometry(0.145, 0.3, 4, 14), clothM, 1, (p) => p.top),
    neck: part(new THREE.CapsuleGeometry(0.042, 0.05, 3, 8), skinM, 1, (p) => p.skin),
    head: part(new THREE.SphereGeometry(0.102, 24, 18), skinM, 1, (p) => p.skin),
    nose: part(new THREE.SphereGeometry(0.018, 8, 6), skinM, 1, (p) => p.skin),
    hair: part(new THREE.SphereGeometry(0.109, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.56), clothM, 1, (p) => p.hair),
    bun: part(new THREE.SphereGeometry(0.058, 12, 10), clothM, 1, (p) => p.hair),
    ua: part(new THREE.CapsuleGeometry(0.05, 0.21, 4, 10), clothM, 2, (p) => p.sleeve ?? p.top),
    fa: part(new THREE.CapsuleGeometry(0.042, 0.2, 4, 10), clothM, 2, (p) => p.fore ?? p.sleeve ?? p.top),
    hand: part(new THREE.SphereGeometry(0.04, 12, 10), skinM, 2, (p) => p.skin),
    th: part(new THREE.CapsuleGeometry(0.07, 0.34, 4, 10), clothM, 2, (p) => p.pants),
    sh: part(new THREE.CapsuleGeometry(0.056, 0.34, 4, 10), clothM, 2, (p) => p.pants),
    shoe: part(new RoundedBoxGeometry(0.1, 0.075, 0.26, 2, 0.03), shoeM, 2, (p) => p.shoe),
  };
  const ALL = Object.values(P);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const R = V(0, 0, 0), pv = V(0, 0, 0), sv = V(1, 1, 1), mid = V(0, 0, 0);
  let SC = 1;
  const xf = (v, out) => out.copy(v).sub(R).multiplyScalar(SC).add(R);
  const put = (im, idx, pos, quat, sx = 1, sy = 1, sz = 1) => { m4.compose(xf(pos, pv), quat, sv.set(sx * SC, sy * SC, sz * SC)); im.setMatrixAt(idx, m4); };
  const va = V(0, 0, 0), vb = V(0, 0, 0), vc = V(0, 0, 0), vd = V(0, 0, 0);
  const seg = (im, idx, a, b, sx = 1, sz = 1) => { mid.addVectors(a, b).multiplyScalar(0.5); q.setFromUnitVectors(Y, vd.subVectors(b, a).normalize()); put(im, idx, mid, q, sx, 1, sz); };
  // Two-bone reach: the middle joint (knee or elbow) bends toward the pole.
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.max(0.001, Math.min(dv.length(), l1 + l2 - 0.001)); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0), lookD = V(0, 0, 0), hp = V(0, 0, 0), qy = new THREE.Quaternion();
  const out = {
    N, parts: P, stretch: 0, reach: 0,
    head: list.map(() => V(0, 0, 0)), chest: list.map(() => V(0, 0, 0)),
    hand: list.map(() => [V(0, 0, 0), V(0, 0, 0)]), shoulder: [V(0, 0, 0), V(0, 0, 0)],
  };
  const hide = (i) => { for (const [, im] of Object.entries(P)) { const per = im.count / N; for (let j = 0; j < per; j++) im.setMatrixAt(i * per + j, zero); } };
  // hip: pelvis centre; yaw: facing; lean: forward lean; tilt: sideways lean; feet(i, out) -> ground y under
  // that foot (sets the ankle target); hands(i, shoulder, out): wrist target; look: world point to face.
  out.pose = (i, { hip, yaw, lean = 0, tilt = 0, feet, hands, look, nod = 0, kneePole = null, sc = 1, root = null }) => {
    if (sc <= 0.002) { hide(i); out.head[i].copy(hip); out.chest[i].copy(hip); out.hand[i][0].copy(hip); out.hand[i][1].copy(hip); return; }
    SC = sc; if (root) R.copy(root); else R.set(hip.x, 0, hip.z);
    const p = list[i];
    fwdOf(yaw, F); sideOf(yaw, S);
    qy.setFromAxisAngle(Y, yaw);
    seg(P.pelvis, i, va.copy(hip).addScaledVector(S, -0.08), vb.copy(hip).addScaledVector(S, 0.08));
    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1, ix = i * 2 + s;
      hipI.copy(hip).addScaledVector(S, sg * 0.1);
      const gy = feet(s, ank) || 0;
      pole.copy(kneePole || F).addScaledVector(S, sg * 0.08);
      out.stretch = Math.max(out.stretch, hipI.distanceTo(ank) - (LT + LS));
      ik(hipI, ank, LT, LS, pole, jnt);
      seg(P.th, ix, hipI, jnt); seg(P.sh, ix, jnt, ank);
      pv.copy(ank).addScaledVector(F, 0.05); pv.y = Math.max(gy + 0.038, ank.y - 0.045);
      put(P.shoe, ix, mid.copy(pv), qy);
    }
    Dn.copy(F).multiplyScalar(lean).addScaledVector(S, tilt).add(Y).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    const cr = (p.chest || 0.145) / 0.145;
    seg(P.torso, i, va.copy(hip).addScaledVector(Dn, 0.1), top, cr, cr * 0.92);
    hp.copy(top).addScaledVector(Dn, 0.16).addScaledVector(F, 0.015);
    seg(P.neck, i, top, hp);
    lookD.subVectors(look, hp);
    const flat = Math.max(0.01, Math.hypot(lookD.x, lookD.z));
    lookD.y = clamp(lookD.y / flat, -0.9, 0.6) * flat;
    lookD.normalize(); lookD.y -= nod; lookD.normalize();
    hp.addScaledVector(lookD, 0.012);
    put(P.head, i, hp, q.identity());
    put(P.nose, i, va.copy(hp).addScaledVector(lookD, 0.098), q);
    q.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lookD, -0.4).normalize());
    put(P.hair, i, va.copy(hp).addScaledVector(lookD, -0.014).add(vb.set(0, 0.012, 0)), q);
    if (p.bun) put(P.bun, i, va.copy(hp).addScaledVector(lookD, -0.1).add(vb.set(0, 0.03, 0)), q.identity());
    else P.bun.setMatrixAt(i, zero);
    xf(hp, out.head[i]); xf(va.copy(top).addScaledVector(Dn, -0.12).addScaledVector(F, 0.14), out.chest[i]);
    for (let s = 0; s < 2; s++) {
      const sg = s ? 1 : -1, ix = i * 2 + s;
      const sh = out.shoulder[s].copy(top).addScaledVector(Dn, -0.04).addScaledVector(S, sg * 0.19);
      hands(s, sh, wr);
      pole.copy(Y).multiplyScalar(-1).addScaledVector(S, sg * 0.7).addScaledVector(F, -0.35);
      out.reach = Math.max(out.reach, sh.distanceTo(wr) - (LU + LF));
      ik(sh, wr, LU, LF, pole, jnt);
      seg(P.ua, ix, sh, jnt); seg(P.fa, ix, jnt, wr);
      vd.subVectors(wr, jnt).normalize();
      va.copy(wr).addScaledVector(vd, 0.035);
      q.setFromUnitVectors(Y, vd);
      put(P.hand, ix, va, q, 0.8, 1.15, 1);
      xf(va, out.hand[i][s]);
    }
  };
  out.commit = () => { ALL.forEach((im) => { im.instanceMatrix.needsUpdate = true; }); };
  return out;
}

// ------------------------------------------------------------------ canvas art
// The talk slide every screen shows. n: talk number (0 = standby); a wipe carries one slide into the next.
function slide(c, w, h, n) {
  if (!n) {
    c.fillStyle = '#0b0806'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,154,106,0.5)'; c.beginPath(); c.arc(w / 2, h / 2, 6, 0, 7); c.fill();
    return;
  }
  const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#2a1a12'); g.addColorStop(1, '#3d2618');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  // Header: a small cup and the series name.
  c.strokeStyle = CREAM; c.lineWidth = 5; c.lineJoin = 'round';
  roundRect(c, 60, 62, 40, 36, 8); c.stroke(); c.beginPath(); c.arc(104, 80, 10, -Math.PI / 2, Math.PI / 2); c.stroke();
  c.fillStyle = CREAM; c.font = `700 34px ${MONO}`; c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = '4px';
  c.fillText('COFFEE & COLLABS', 140, 82);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.fillStyle = PEACH; c.font = `800 168px ${SANS}`; c.fillText('TALK ' + n, 56, 300);
  // A different simple diagram for each talk.
  c.save(); c.translate(720, 290);
  if (n === 1) { [[0, -90, 230], [0, -10, 180], [0, 70, 210]].forEach(([x, y, ww], i) => { c.fillStyle = i === 0 ? PEACH : 'rgba(240,226,204,0.55)'; roundRect(c, x - 110, y - 26, ww, 52, 26); c.fill(); }); }
  else if (n === 2) { c.strokeStyle = 'rgba(240,226,204,0.6)'; c.lineWidth = 6; c.beginPath(); c.moveTo(-90, 60); c.lineTo(0, -70); c.lineTo(110, 50); c.stroke(); [[-90, 60], [0, -70], [110, 50]].forEach(([x, y], i) => { c.fillStyle = i === 1 ? PEACH : CREAM; c.beginPath(); c.arc(x, y, 30, 0, 7); c.fill(); }); }
  else { for (let i = 0; i < 3; i++) { c.fillStyle = i === 2 ? PEACH : 'rgba(240,226,204,0.55)'; roundRect(c, -120 + i * 85, 90 - (i + 1) * 60, 64, (i + 1) * 60, 12); c.fill(); } }
  c.restore();
  // Which talk of three.
  for (let i = 0; i < 3; i++) { c.fillStyle = i < n ? PEACH : 'rgba(240,226,204,0.25)'; c.beginPath(); c.arc(76 + i * 40, h - 70, 11, 0, 7); c.fill(); }
}
function cardFace(c, w, h, n) {
  c.fillStyle = '#efe3cf'; roundRect(c, 0, 0, w, h, 22); c.fill();
  c.fillStyle = ['#ff9a6a', '#ff7a8a', '#e8b45a'][n - 1]; roundRect(c, 0, 0, w, 110, 22); c.fill(); c.fillRect(0, 60, w, 50);
  c.fillStyle = '#2a1a12'; c.font = `800 74px ${MONO}`; c.textBaseline = 'middle'; c.fillText('TALK ' + n, 30, 58);
  c.fillStyle = 'rgba(42,26,18,0.35)'; for (let i = 0; i < 3; i++) { roundRect(c, 30, 150 + i * 42, (w - 60) * (0.85 - i * 0.18), 16, 8); c.fill(); }
  // A coffee ring, because of course.
  c.strokeStyle = 'rgba(122,74,40,0.35)'; c.lineWidth = 7; c.beginPath(); c.arc(w - 92, h - 80, 52, 0.3, 5.6); c.stroke();
}
function skyline(c, w, h, room) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, room.sky[0]); g.addColorStop(0.6, room.sky[1]); g.addColorStop(1, room.sky[2]);
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  const ink = room.side < 0 ? '#0a1424' : '#1a0c10';
  for (let layer = 0; layer < 2; layer++) {
    c.fillStyle = layer ? ink : 'rgba(10,16,30,0.45)';
    for (let i = 0; i < 16; i++) {
      const bw = 18 + rnd(i, 7 + layer) * 30, bh = h * (0.18 + rnd(i, 9 + layer) * (layer ? 0.32 : 0.45)), x = (i / 16) * w + rnd(i, 3) * 20 - 10;
      c.fillRect(x, h - bh, bw, bh);
      if (room.side > 0 && layer && i % 5 === 2) { c.fillRect(x + bw * 0.25, h - bh - 26, bw * 0.5, 26); c.fillRect(x + bw * 0.45, h - bh - 60, bw * 0.1, 36); }
    }
  }
  if (room.side < 0) {
    // A tall needle tower over the lake shore.
    const x = w * 0.62;
    c.fillStyle = ink; c.beginPath(); c.moveTo(x - 9, h); c.lineTo(x - 3, h * 0.12); c.lineTo(x + 3, h * 0.12); c.lineTo(x + 9, h); c.fill();
    c.beginPath(); c.ellipse(x, h * 0.4, 16, 9, 0, 0, 7); c.fill(); c.fillRect(x - 1.5, h * 0.02, 3, h * 0.12);
  }
  for (let i = 0; i < 70; i++) { c.fillStyle = `rgba(255,${210 + rnd(i, 5) * 40},150,${0.35 + rnd(i, 6) * 0.5})`; c.fillRect(rnd(i, 1) * w, h * (0.62 + rnd(i, 2) * 0.36), 3, 4); }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 6.5, 14);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.04, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = V(0, 0, 0), s4 = V(1, 1, 1);

  // ----------------------------------------------------------- the lounge
  const floor = mesh(new THREE.PlaneGeometry(12, 10), std(0xffffff, { map: grainTex('#3a281d', { size: 256, speck: 0.12, blot: 0.12, seed: 5, repeat: 6 }), roughness: 0.5, metalness: 0.05 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.z = 1.5; scene.add(floor);
  const rug = mesh(new THREE.CircleGeometry(1.5, 48), std(0x5a2f2a, { roughness: 0.95 }), { cast: false });
  rug.rotation.x = -Math.PI / 2; rug.position.set(-0.2, 0.004, -0.4); rug.scale.set(1.3, 0.8, 1); scene.add(rug);
  // Back wall built around the two portals.
  const wallM = std(0xffffff, { map: grainTex('#2b1d16', { size: 256, speck: 0.06, blot: 0.1, seed: 19, repeat: 3 }), roughness: 0.9 });
  const wallPieces = [[-6, PORT[0][0], 0, 3.4], [PORT[0][1], PORT[1][0], 0, 3.4], [PORT[1][1], 6, 0, 3.4], [PORT[0][0], PORT[0][1], 0, PY[0]], [PORT[0][0], PORT[0][1], PY[1], 3.4], [PORT[1][0], PORT[1][1], 0, PY[0]], [PORT[1][0], PORT[1][1], PY[1], 3.4]]
    .map(([x0, x1, y0, y1]) => new THREE.PlaneGeometry(x1 - x0, y1 - y0).translate((x0 + x1) / 2, (y0 + y1) / 2, WZ));
  scene.add(mesh(mergeGeometries(wallPieces), wallM, { cast: false }));
  const trimM = std(0xb8743e, { metalness: 0.9, roughness: 0.32 });
  const trims = [];
  PORT.forEach(([a, b]) => [[a - 0.02, (PY[0] + PY[1]) / 2, 0.04, PY[1] - PY[0] + 0.04], [b + 0.02, (PY[0] + PY[1]) / 2, 0.04, PY[1] - PY[0] + 0.04], [(a + b) / 2, PY[1] + 0.02, b - a + 0.08, 0.04], [(a + b) / 2, PY[0] - 0.02, b - a + 0.08, 0.04]]
    .forEach(([x, y, w, h]) => trims.push(new THREE.BoxGeometry(w, h, 0.08).translate(x, y, WZ))));
  scene.add(mesh(mergeGeometries(trims), trimM));
  // Sliding panels over each portal: walnut, rolling outward to open.
  const doorM = std(0xffffff, { map: grainTex('#5a3622', { size: 256, speck: 0.1, blot: 0.15, seed: 31, repeat: 1 }), roughness: 0.55 });
  const doors = PORT.map(([a, b]) => { const d = mesh(new RoundedBoxGeometry(b - a + 0.06, PY[1] - PY[0] + 0.06, 0.05, 2, 0.012), doorM); d.position.set((a + b) / 2, (PY[0] + PY[1]) / 2, WZ + 0.07); scene.add(d); return d; });

  // ----------------------------------------------------------- the remote offices
  const roomScreens = [], roomLights = [], roomLabels = [];
  ROOMS.forEach((R, ri) => {
    const rw = 2.2, rh = 2.4, cx = R.cx;
    const rm = std(0xffffff, { map: grainTex(R.wall, { size: 128, speck: 0.05, blot: 0.12, seed: 50 + ri, repeat: 1 }), roughness: 0.9 });
    const fl = mesh(new THREE.PlaneGeometry(rw, RZ0 - RZ1), std(ri ? 0x4a3020 : 0x2a3340, { roughness: 0.6 }), { cast: false }); fl.rotation.x = -Math.PI / 2; fl.position.set(cx, 0.002, (RZ0 + RZ1) / 2); scene.add(fl);
    const shell = [new THREE.PlaneGeometry(rw, rh).translate(cx, rh / 2, RZ1)];
    [-1, 1].forEach((s) => shell.push(new THREE.PlaneGeometry(RZ0 - RZ1, rh).rotateY(-s * Math.PI / 2).translate(cx + s * rw / 2, rh / 2, (RZ0 + RZ1) / 2)));
    shell.push(new THREE.PlaneGeometry(rw, RZ0 - RZ1).rotateX(Math.PI / 2).translate(cx, rh, (RZ0 + RZ1) / 2));
    scene.add(mesh(mergeGeometries(shell), rm, { cast: false }));
    // Skyline window on the outer half of the back wall, screen on the inner half.
    const win = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.9), new THREE.MeshBasicMaterial({ map: canvasTex(300, 480, (c, w, h) => skyline(c, w, h, R)).tex, toneMapped: false }));
    win.position.set(R.side * 3.04, 1.42, RZ1 + 0.01); scene.add(win);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.394), new THREE.MeshBasicMaterial({ color: 0x080808, toneMapped: false }));
    scr.position.set(R.side * 2.32, 1.36, RZ1 + 0.02); scene.add(scr);
    const bez = mesh(new THREE.BoxGeometry(0.74, 0.43, 0.03), std(0x0c0c0d, { roughness: 0.3, metalness: 0.5 }), { cast: false }); bez.position.set(scr.position.x, 1.36, RZ1 + 0.003); scene.add(bez);
    const sg = glow(R.light, 1, 0, 0.5); sg.scale.set(1.5, 1.0, 1); sg.position.set(scr.position.x, 1.36, RZ1 + 0.15); scene.add(sg);
    roomScreens.push({ scr, sg });
    const L = new THREE.PointLight(R.light, 0, 3.2, 1.5); L.position.set(cx, 2.1, (RZ0 + RZ1) / 2 + 0.2); scene.add(L);
    roomLights.push(L);
    // Office name over the portal, dark until the link lands.
    const nm = label(R.name, { font: `800 64px ${SANS}`, fg: '#f6e9d8', h: 0.17, pad: 10, track: 8 });
    nm.position.set((PORT[ri][0] + PORT[ri][1]) / 2, PY[1] + 0.27, WZ + 0.02); nm.material.opacity = 0.18; scene.add(nm);
    nm.userData.tag = 'room' + ri;
    roomLabels.push(nm);
  });

  // ----------------------------------------------------------- the home screen and neon
  const SW = 1.5, SHh = SW * 576 / 1024, SY = 1.42;
  const slideTex = canvasTex(1024, 576);
  const screenM = new THREE.MeshBasicMaterial({ map: slideTex.tex, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SHh), screenM); screen.position.set(0, SY, WZ + 0.035); scene.add(screen);
  screen.userData.tag = 'screen';
  const bezel = mesh(new RoundedBoxGeometry(SW + 0.06, SHh + 0.06, 0.05, 2, 0.015), std(0x0c0c0d, { roughness: 0.3, metalness: 0.5 })); bezel.position.set(0, SY, WZ + 0.01); scene.add(bezel);
  roomScreens.forEach((r) => { r.scr.material.map = slideTex.tex; r.scr.material.needsUpdate = true; });
  const screenGlow = glow(0xffb48a, 1, 0, 0.5); screenGlow.scale.set(SW * 2.2, SHh * 2.4, 1); screenGlow.position.set(0, SY, WZ + 0.2); scene.add(screenGlow);
  const screenL = new THREE.PointLight(0xffc8a0, 0, 4, 1.4); screenL.position.set(0, SY - 0.1, WZ + 0.8); scene.add(screenL);
  const home = label('HOME OFFICE', { font: `700 52px ${MONO}`, fg: '#d9b48a', h: 0.085, pad: 8, track: 6 });
  home.position.set(-SW / 2 + home.geometry.parameters.width / 2, SY - SHh / 2 - 0.12, WZ + 0.02); scene.add(home);
  const neonTex = canvasTex(1024, 160, (c, w, h) => {
    c.font = `800 92px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.shadowColor = NEON; c.shadowBlur = 26; c.strokeStyle = NEON; c.lineWidth = 9; c.strokeText('COFFEE & COLLABS', w / 2, h / 2);
    c.shadowBlur = 8; c.strokeStyle = '#ffe2e6'; c.lineWidth = 3; c.strokeText('COFFEE & COLLABS', w / 2, h / 2);
  }).tex;
  const neon = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.36), new THREE.MeshBasicMaterial({ map: neonTex, transparent: true, depthWrite: false, toneMapped: false, color: 0x222222 }));
  neon.position.set(0, 2.5, WZ + 0.03); scene.add(neon);
  neon.userData.tag = 'neon';
  const neonGlow = glow(NEON_H, 1, 0, 0.5); neonGlow.scale.set(3.4, 0.9, 1); neonGlow.position.set(0, 2.5, WZ + 0.1); scene.add(neonGlow);
  const neonL = new THREE.PointLight(NEON_H, 0, 3.5, 1.5); neonL.position.set(0, 2.4, WZ + 0.5); scene.add(neonL);
  let slideKey = '';
  const talkAt = (t) => { let n = 0; TALK_T.forEach((tt, i) => { if (t >= tt) n = i + 1; }); return n; };

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xc8a890, 0x1a100c, 0.34));
  const key = new THREE.SpotLight(0xffd6ae, 40, 0, 0.62, 0.6, 1.3);
  key.position.set(2.6, 4.4, 3.4); key.target.position.set(0.3, 0.6, -0.6);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 2; key.shadow.camera.far = 11;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9ab8ff, 1.0); rim.position.set(-3, 2.6, -3); scene.add(rim);
  // Warm pendant over the coffee bar.
  const barL = new THREE.PointLight(0xffc27a, 3.2, 3, 1.6); barL.position.set(BAR[0], 2.0, BAR[1] - 0.1); scene.add(barL);
  const barShade = mesh(new THREE.ConeGeometry(0.17, 0.16, 24, 1, true), std(0xb8743e, { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }), { cast: false });
  barShade.position.set(BAR[0], 2.08, BAR[1] - 0.1); scene.add(barShade);
  const barGlow = glow(0xffc27a, 0.6, 0.6, 0.35); barGlow.position.set(BAR[0], 1.99, BAR[1] - 0.1); scene.add(barGlow);

  // ----------------------------------------------------------- the coffee bar
  const bar = mesh(new RoundedBoxGeometry(1.3, BAR_TOP - 0.03, 0.5, 2, 0.02), std(0x24170f, { roughness: 0.6 }));
  bar.position.set(BAR[0], (BAR_TOP - 0.03) / 2, BAR[1]); scene.add(bar);
  const barTop = mesh(new RoundedBoxGeometry(1.38, 0.035, 0.56, 2, 0.012), std(0xffffff, { map: grainTex('#6d6a66', { size: 256, speck: 0.3, blot: 0.05, seed: 23, repeat: 1 }), roughness: 0.25, metalness: 0.1 }));
  barTop.position.set(BAR[0], BAR_TOP - 0.017, BAR[1]); scene.add(barTop);
  // Glass carafe with coffee inside and a dark handle.
  const carafe = new THREE.Group(); scene.add(carafe);
  const glass = new THREE.Mesh(new THREE.LatheGeometry([[0.0, 0], [0.065, 0.004], [0.075, 0.05], [0.07, 0.11], [0.04, 0.15], [0.036, 0.2], [0.045, 0.215]].map(([x, y]) => new THREE.Vector2(x, y)), 28),
    new THREE.MeshStandardMaterial({ color: 0xd8e4e8, roughness: 0.05, metalness: 0, transparent: true, opacity: 0.32, side: THREE.DoubleSide, depthWrite: false }));
  carafe.add(glass);
  const brew = mesh(new THREE.CylinderGeometry(0.064, 0.06, 1, 24), std(0x2a1308, { roughness: 0.15 }), { cast: false });
  carafe.add(brew);
  const cHandle = mesh(new THREE.TorusGeometry(0.04, 0.009, 8, 20, Math.PI), std(0x1a1210, { roughness: 0.5 }));
  cHandle.rotation.z = -Math.PI / 2; cHandle.position.set(0.075, 0.11, 0); carafe.add(cHandle);
  const collar = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 20), std(0xb8743e, { metalness: 0.9, roughness: 0.3 })); collar.position.y = 0.13; carafe.add(collar);
  const stream = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.008, 1, 10), new THREE.MeshStandardMaterial({ color: 0x3a1a0a, roughness: 0.1 }));
  scene.add(stream);
  // Mugs: the host's hero mug with coffee and steam, and one each for everyone else (instanced).
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xe9ddc8, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15 });
  const hero = new THREE.Group(); scene.add(hero);
  const MR = 0.042, MH = 0.095;
  hero.add(mesh(new THREE.CylinderGeometry(MR, MR * 0.92, MH, 28, 1, true), new THREE.MeshPhysicalMaterial({ color: 0xc8553a, roughness: 0.35, clearcoat: 0.6, side: THREE.DoubleSide })));
  const heroBase = mesh(new THREE.CircleGeometry(MR * 0.92, 24), ceramic); heroBase.rotation.x = Math.PI / 2; heroBase.position.y = -MH / 2; hero.add(heroBase);
  const heroH = mesh(new THREE.TorusGeometry(0.024, 0.007, 8, 18, Math.PI * 1.2), new THREE.MeshPhysicalMaterial({ color: 0xc8553a, roughness: 0.35 }));
  heroH.rotation.z = -Math.PI / 2 - 0.3; heroH.position.set(MR + 0.004, 0, 0); hero.add(heroH);
  const coffee = mesh(new THREE.CircleGeometry(MR * 0.93, 24), std(0x3a1d0e, { roughness: 0.12 }), { cast: false });
  coffee.rotation.x = -Math.PI / 2; hero.add(coffee);
  const NM = 7;
  const mugs = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.04, 0.036, 0.09, 18), ceramic, NM);
  mugs.castShadow = true; mugs.frustumCulled = false; scene.add(mugs);
  const MUGC = [0xe9ddc8, 0x2f6f6a, 0xe8b45a, 0x6a8ac8, 0xe9ddc8, 0xd8573a, 0x2a2a2e];
  MUGC.forEach((c, i) => mugs.setColorAt(i, new THREE.Color(c)));
  // Steam off the hero mug: soft sprites rising and fading, deterministic in t.
  const steamTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const steam = Array.from({ length: 12 }, () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, color: 0xf2e6da, transparent: true, opacity: 0, depthWrite: false })); scene.add(s); return s; });

  // ----------------------------------------------------------- stools, side table and the talk cards
  const AUD = [[-1.05, -0.05], [-0.3, -0.38], [0.42, -0.12]];
  const AIM = V(0.45, 0, -1.9);
  const stoolTop = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.19, 0.19, 0.05, 28), std(0x8a5a36, { roughness: 0.5 }), 3);
  const stoolLeg = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.025, 0.03, 0.62, 10), std(0x1a1512, { roughness: 0.4, metalness: 0.7 }), 3);
  AUD.forEach(([x, z], i) => { m4.compose(p4.set(x, 0.625, z), q4.identity(), s4.set(1, 1, 1)); stoolTop.setMatrixAt(i, m4); m4.compose(p4.set(x, 0.31, z), q4.identity(), s4.set(1, 1, 1)); stoolLeg.setMatrixAt(i, m4); });
  [stoolTop, stoolLeg].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  const SIDE = V(-1.62, 0, 0.62);
  const sideT = mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.04, 36), std(0x8a5a36, { roughness: 0.45 })); sideT.position.set(SIDE.x, 0.58, SIDE.z); scene.add(sideT);
  const sideL = mesh(new THREE.CylinderGeometry(0.04, 0.12, 0.56, 16), std(0x1a1512, { roughness: 0.4, metalness: 0.7 })); sideL.position.set(SIDE.x, 0.28, SIDE.z); scene.add(sideL);
  // A wooden holder the cards drop into, leaning back toward the room.
  const HOLD_YAW = 0.42, HOLD_TILT = -0.32;
  const holder = mesh(new RoundedBoxGeometry(0.52, 0.05, 0.2, 2, 0.01), std(0x5a3622, { roughness: 0.5 })); holder.position.set(SIDE.x, 0.625, SIDE.z); holder.rotation.y = HOLD_YAW; scene.add(holder);
  const CWd = 0.46, CHd = 0.3;
  const cards = [1, 2, 3].map((n) => {
    const g = new THREE.Group(); g.rotation.order = 'YXZ'; scene.add(g);
    const f = mesh(new RoundedBoxGeometry(CWd, CHd, 0.008, 2, 0.006), std(0xffffff, { map: canvasTex(512, 334, (c, w, h) => cardFace(c, w, h, n)).tex, roughness: 0.6 }));
    g.add(f); g.userData.tag = 'card' + n; return g;
  });

  // ----------------------------------------------------------- people
  const list = [
    { skin: 0xc68b68, top: 0xd29a3a, pants: 0x2b2f3a, hair: 0x2a1a12, shoe: 0xe9e4da, chest: 0.148 },
    { skin: 0x8a5a3e, top: 0x2f8f86, pants: 0x30343c, hair: 0x15100d, shoe: 0x1b1d20, chest: 0.142 },
    { skin: 0xe2b08e, top: 0x8c2f3c, pants: 0x262a33, hair: 0x7a3b1c, shoe: 0xf2efe8, bun: true, chest: 0.136 },
    { skin: 0x5e3a28, top: 0x4a5a78, pants: 0x3b3226, hair: 0x0e0b0a, shoe: 0x2b2f36, chest: 0.152 },
    { skin: 0xd6a083, top: 0x3d7be0, pants: 0x262a33, hair: 0x4a2a1a, shoe: 0xe9e4da, bun: true, chest: 0.138 },
    { skin: 0xa86e4a, top: 0x2ab0c8, pants: 0x30343c, hair: 0x15100d, shoe: 0x1b1d20, chest: 0.148 },
    { skin: 0xf0c4a0, top: 0xd8573a, pants: 0x2a2f3a, hair: 0xb88a4a, shoe: 0x1b1d20, chest: 0.14 },
    { skin: 0x7a4a30, top: 0xe0a33a, pants: 0x3a3340, hair: 0x0e0b0a, shoe: 0xf2efe8, bun: true, chest: 0.144 },
  ];
  const crowd = makeCrowd(scene, list);
  scene.userData.crowd = crowd;
  // Remote people: [room, x offset, z, yaw].
  // Remote people: [room, x, z]. They face each other by their screen, then turn to the portal when the link lands.
  const REM = [[0, -2.88, RZ1 + 0.95], [0, -2.12, RZ1 + 1.12], [1, 2.12, RZ1 + 1.12], [1, 2.88, RZ1 + 0.95]];

  const hipP = V(0, 0, 0), look = V(0, 0, 0), F = V(0, 0, 0), S = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), tmp3 = V(0, 0, 0), root = V(0, 0, 0);
  const SCREEN = V(0, SY, WZ), hostS = V(1, 0, 0);
  let hostYaw = 0;
  const clapAt = (t, i) => { const c = k(t, CLAP + i * 0.05, CLAP + 0.15 + i * 0.05) * (1 - k(t, 9.0, 9.4)); return [c, Math.max(0, Math.sin((t - CLAP) * 22 + i))]; };

  // The carafe: lifted off the bar, tilted over the mug, poured, set back down.
  const CAR0 = V(...CARAFE0), CAR1 = V(MUG0[0] + 0.16, BAR_TOP + 0.2, MUG0[2] - 0.01);
  const carafeAt = (t) => {
    const up = eio(k(t, 0.4, 0.66)) * (1 - eio(k(t, 1.42, 1.66)));
    const tilt = eio(k(t, 0.62, 0.84)) * (1 - eio(k(t, 1.28, 1.46))) * (1.0 + 0.16 * k(t, 0.84, 1.28));
    carafe.position.lerpVectors(CAR0, CAR1, up);
    carafe.rotation.set(0, 0, tilt);
    carafe.updateMatrixWorld();
    return tilt;
  };
  const MUGP = V(...MUG0).setY(BAR_TOP + MH / 2);
  const level = (t) => lerp(0.012, 0.078, eio(k(t, 0.86, 1.32)));

  // The host's route: behind the bar, a turn, a walk to the screen, a turn to face the room.
  const H0 = V(BAR[0], 0, BAR[1] - 0.5), H1 = V(STAGE[0], 0, STAGE[1]);
  const PATH = H1.clone().sub(H0), PL = PATH.length();
  const HEAD = Math.atan2(PATH.x, PATH.z), YAW_END = -0.62;
  const T_T1 = [1.98, 2.32], T_W = [2.22, 3.32], T_T2 = [3.22, 3.62];
  const sAt = (t) => PL * ss(k(t, T_W[0], T_W[1]));
  const STRIDE = 1.15, AMP = STRIDE / (2 * Math.PI);
  const GEST = [[3.55, 4.35], [6.4, 6.95], [7.1, 7.6]];

  function poseHost(t) {
    const tilt = carafeAt(t);
    const s = sAt(t), w = clamp(((sAt(t + 0.03) - sAt(t - 0.03)) / 0.06) / 0.6);
    root.copy(H0).addScaledVector(PATH, s / PL);
    let yaw = 0;
    if (t < T_W[0] + 0.1) yaw = lerp(0, HEAD, eio(k(t, T_T1[0], T_T1[1])));
    else yaw = lerp(HEAD, YAW_END, eio(k(t, T_T2[0], T_T2[1])));
    fwdOf(yaw, F); sideOf(yaw, S); hostS.copy(S); hostYaw = yaw;
    const ph = (s / STRIDE) * Math.PI * 2;
    const turning = Math.max(Math.sin(Math.PI * k(t, T_T1[0], T_T1[1])), Math.sin(Math.PI * k(t, T_T2[0], T_T2[1])));
    hipP.copy(root).setY(0.93 + 0.016 * Math.cos(ph * 2) * w + 0.004 * Math.sin(t * 2.1));
    hipP.addScaledVector(S, 0.015 * Math.sin(t * 0.8) * (1 - w));
    const pour = t < 1.9 ? 1 : 0;
    if (t < 1.75) look.copy(MUGP).lerp(carafe.position, 0.3);
    else if (t < 2.0) look.set(BAR[0] - 0.3, 1.5, 3);
    else if (t < 3.3) { look.copy(root).addScaledVector(PATH, 1.4 / PL); look.y = 1.5; }
    else if (t < 4.4) look.set(-0.3, 1.1, -0.2);
    else if (t < 5.6) look.set(ROOMS[(t < 5.0 ? 0 : 1)].cx * 0.8, 1.5, WZ);
    else look.set(-0.35, 1.15, 0.2).lerp(tmp.set(0, 1.4, 4), 0.3 * k(t, 8, 8.6));
    const gest = Math.max(...GEST.map(([a, b]) => Math.sin(Math.PI * k(t, a, b))));
    const [clap, beat] = clapAt(t, 0);
    crowd.pose(0, {
      hip: hipP, yaw, lean: 0.06 + 0.16 * pour * eio(k(t, 0.3, 0.6)) * (1 - k(t, 1.6, 1.95)) + 0.05 * w, tilt: 0.02 * Math.sin(t * 0.8),
      look, nod: 0.08 * Math.sin(Math.PI * k(t, 1.8, 2.0)),
      feet: (f, out) => {
        const sg = f ? 1 : -1;
        out.copy(root).addScaledVector(S, sg * 0.1).addScaledVector(F, AMP * Math.sin(ph + f * Math.PI) * w);
        out.y = 0.085 + 0.1 * Math.max(0, Math.cos(ph + f * Math.PI)) * w + 0.05 * turning * Math.max(0, Math.sin(t * 18 + f * Math.PI));
        return 0;
      },
      hands: (h, sh, out) => {
        const sg = h ? 1 : -1;
        const swing = -Math.sin(ph + h * Math.PI) * w;
        out.copy(sh).add(tmp.set(0, -0.52, 0)).addScaledVector(F, 0.06 + 0.16 * swing).addScaledVector(S, sg * 0.05);
        if (h === 1) {
          // The pouring hand: on the carafe handle, then over to the mug, then carrying it at the chest.
          const grip = carafe.localToWorld(tmp2.set(0.115, 0.11, 0));
          const toMug = eio(k(t, 1.64, 1.86)), carry = eio(k(t, 1.9, 2.2));
          tmp3.copy(MUGP).add(tmp.set(MR + 0.04, 0, 0));
          out.copy(grip).lerp(tmp3, toMug);
          const held = tmp.copy(sh).add(tmp2.set(0, -0.3, 0)).addScaledVector(F, 0.3).addScaledVector(S, -0.06);
          out.lerp(held, carry);
          if (clap > 0) out.lerp(tmp2.copy(sh).add(tmp3.set(0, -0.22, 0)).addScaledVector(F, 0.32).addScaledVector(S, -0.1 - 0.05 * beat), clap * 0.6);
        } else {
          // The free hand rests on the bar, then points at the screen with each new talk.
          if (t < 2.0) out.lerp(tmp2.set(BAR[0] - 0.3, BAR_TOP + 0.03, BAR[1] - 0.12), 1 - eio(k(t, 1.85, 2.05)));
          tmp2.copy(SCREEN).sub(sh).normalize();
          if (gest > 0) out.lerp(tmp3.copy(sh).addScaledVector(tmp2, 0.5).add(tmp.set(0, 0.06, 0)), eio(clamp(gest * 1.3)));
          if (clap > 0) out.lerp(tmp2.copy(sh).add(tmp3.set(0, -0.22, 0)).addScaledVector(F, 0.32).addScaledVector(S, 0.1 + 0.05 * beat), clap);
        }
      },
    });
  }

  function poseAudience(i, t) {
    const [x, z] = AUD[i - 1];
    const yaw = Math.atan2(AIM.x - x, AIM.z - z);
    fwdOf(yaw, F); sideOf(yaw, S);
    const ph = t * 1.3 + i * 2.1;
    const seat = tmp3.set(x, 0, z);
    hipP.copy(seat).addScaledVector(F, -0.02); hipP.y = 0.71 + 0.004 * Math.sin(t * 2 + i);
    // Who they watch: the host, the screen when a talk lands, the portals when they open.
    const host = crowd.head[0];
    look.copy(host);
    const sl = Math.max(...TALK_T.map((a) => Math.sin(Math.PI * k(t, a, a + 0.9))));
    look.lerp(tmp.set(0, SY, WZ), sl);
    const po = Math.sin(Math.PI * k(t, OPEN - 0.05 + i * 0.08, LAND[1] + 0.6));
    look.lerp(tmp.set(ROOMS[i % 2].cx, 1.3, WZ - 0.8), po);
    const nod = 0.08 * Math.max(...TALK_T.map((a) => Math.sin(Math.PI * k(t, a + 0.3 + i * 0.07, a + 0.6 + i * 0.07))));
    const [clap, beat] = clapAt(t, i);
    crowd.pose(i, {
      hip: hipP, yaw, lean: 0.08 + 0.05 * Math.sin(ph * 0.4) + 0.08 * sl, tilt: 0.03 * Math.sin(ph * 0.3),
      look, nod, kneePole: tmp2.copy(F).add(Y),
      feet: (f, out) => { out.copy(seat).addScaledVector(F, 0.36 + 0.04 * f).addScaledVector(S, (f ? 1 : -1) * 0.13); out.y = 0.085; return 0; },
      hands: (h, sh, out) => {
        const sg = h ? 1 : -1;
        // Mug hand on the knee, other hand resting on the thigh; both come together to clap.
        out.copy(seat).addScaledVector(F, 0.26 + 0.04 * h).addScaledVector(S, sg * 0.12); out.y = 0.8 + (h ? 0.05 : 0);
        if (h === 1) out.y += 0.18 * Math.max(0, Math.sin(Math.PI * k(t, 2.6 + i * 0.5, 3.4 + i * 0.5)));
        if (clap > 0) out.lerp(tmp.copy(sh).add(tmp2.set(0, -0.2, 0)).addScaledVector(F, 0.3).addScaledVector(S, -sg * (0.02 + 0.05 * beat)), clap);
      },
    });
  }

  function poseRemote(j, t) {
    const i = 4 + j, [ri, x, z] = REM[j], R = ROOMS[ri];
    const land = LAND[ri];
    const out_ = x * R.side > 2.5 ? 1 : -1;      // the outer one of the pair faces in, the inner one faces out
    const turn = eio(k(t, land + (j % 2) * 0.1, land + 0.45 + (j % 2) * 0.1));
    const yaw = lerp(-R.side * out_ * (Math.PI / 2 + 0.35), -R.side * 0.3 + 0.0, turn);
    fwdOf(yaw, F); sideOf(yaw, S);
    root.set(x, 0, z);
    const cheer = Math.sin(Math.PI * k(t, land + 0.2 + (j % 2) * 0.1, land + 1.1 + (j % 2) * 0.1));
    hipP.copy(root).setY(0.93 + 0.004 * Math.sin(t * 2 + j) - 0.02 * cheer).addScaledVector(S, 0.02 * Math.sin(t * 0.7 + j * 2));
    look.copy(roomScreens[ri].scr.position).lerp(tmp.set(R.side * 2.5, 1.55, z), 0.35 * (1 - turn) * (0.5 + 0.5 * Math.sin(t * 0.9 + j)));
    look.lerp(tmp.set(0, 1.5, 1.5), turn * (0.6 + 0.3 * cheer));
    const [clap, beat] = clapAt(t, j + 4);
    crowd.pose(i, {
      hip: hipP, yaw, lean: 0.04 - 0.06 * cheer, tilt: 0.03 * Math.sin(t * 0.7 + j * 2),
      look,
      feet: (f, out) => { out.copy(root).addScaledVector(S, (f ? 1 : -1) * 0.11).addScaledVector(F, f ? 0.05 : -0.03); out.y = 0.085; return 0; },
      hands: (h, sh, out) => {
        const sg = h ? 1 : -1;
        out.copy(sh).add(tmp.set(0, -0.52, 0)).addScaledVector(F, 0.07).addScaledVector(S, sg * 0.05);
        if (h === 1) out.copy(sh).add(tmp.set(0, -0.32, 0)).addScaledVector(F, 0.28).addScaledVector(S, -0.04);
        if (h === 1 && cheer > 0) out.lerp(tmp2.copy(sh).add(tmp.set(0, 0.4, 0)).addScaledVector(F, 0.18), cheer);
        if (clap > 0) out.lerp(tmp2.copy(sh).add(tmp.set(0, -0.2, 0)).addScaledVector(F, 0.3).addScaledVector(S, -sg * (0.02 + 0.05 * beat)), clap);
      },
    });
  }

  // ----------------------------------------------------------- links to the other offices
  const links = ROOMS.map((R, ri) => {
    const s = R.side;
    const a = V(s * (SW / 2 + 0.02), SY + 0.12, WZ + 0.05), d = roomScreens[ri].scr.position.clone().add(V(0, 0, 0.02));
    const curve = new THREE.CubicBezierCurve3(a, V(s * 1.25, 2.05, WZ + 0.55), V(s * 2.1, 1.75, WZ - 0.2), d);
    const geo = new THREE.TubeGeometry(curve, 72, 0.014, 6, false);
    const tube = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: R.light, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    tube.frustumCulled = false; scene.add(tube);
    const spark = glow(R.light, 0.3, 0, 0.35); scene.add(spark);
    return { tube, curve, spark, n: geo.index.count };
  });

  // ----------------------------------------------------------- words
  const kicker = label('MRM UX team', { font: `700 56px ${MONO}`, fg: '#ffb08a', h: 0.1, pad: 8, track: 4 });
  const line1 = label('Team knowledge sharing that reached', { font: `600 54px ${SANS}`, fg: '#f3e6d4', bg: 'rgba(20,13,10,0.78)', h: 0.12, pad: 26, track: 0 });
  const line2 = label('the Toronto and New York offices.', { font: `600 54px ${SANS}`, fg: '#f3e6d4', bg: 'rgba(20,13,10,0.78)', h: 0.12, pad: 26, track: 0 });
  [kicker, line1, line2].forEach((l, i) => { l.material.fog = false; l.userData.tag = ['kick', 'line1', 'line2'][i]; scene.add(l); });

  // ----------------------------------------------------------- dust
  const DN = 110, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd2a8, size: 0.012, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L_ = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.55, 1.42, 2.75]], [1.75, [0.72, 1.38, 2.4], L_],
    [3.3, [-0.45, 1.72, 3.35]], [4.2, [-0.38, 1.7, 3.2], L_],
    [5.2, [0.0, 1.92, 4.25]], [6.3, [0.05, 1.9, 4.2], L_],
    [7.6, [-0.4, 1.74, 4.1]], [10, [-0.3, 1.76, 4.3], L_],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [1.2, 1.32, 0.25]], [1.75, [1.3, 1.24, 0.42], L_],
    [3.3, [0.2, 1.3, -1.5]], [4.2, [0.18, 1.3, -1.5], L_],
    [5.2, [0.0, 1.38, -2.2]], [6.3, [0.0, 1.38, -2.2], L_],
    [7.6, [-0.2, 1.02, -1.5]], [10, [-0.15, 1.02, -1.5], L_],
  ]);
  const camFov = (t) => kf(t, [[0, 34], [1.75, 33], [3.3, 40], [4.2, 40], [5.2, 44], [6.3, 44], [7.6, 42], [10, 42]]);
  const tgt = V(0, 0, 0), lk = V(0, 0, 0);

  function update(t) {
    const p = camPos(t), qv = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.007, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(qv[0], qv[1], qv[2]); camera.lookAt(tgt);
    camera.fov = camFov(t);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // People.
    poseHost(t);
    for (let i = 1; i <= 3; i++) poseAudience(i, t);
    for (let j = 0; j < 4; j++) poseRemote(j, t);
    crowd.commit();

    // The pour: stream from the spout into the mug, the level rising, the carafe emptying.
    const tilt = carafe.rotation.z;
    brew.scale.y = lerp(0.1, 0.035, eio(k(t, 0.86, 1.32))); brew.position.y = brew.scale.y / 2 + 0.006;
    const spout = carafe.localToWorld(tmp.set(-0.045, 0.21, 0));
    const lv = level(t);
    const flowing = tilt > 0.9 && t < 1.36 ? 1 : 0;
    const surf = tmp2.copy(MUGP).setY(MUGP.y - MH / 2 + lv);
    stream.visible = flowing > 0;
    const sdx = spout.x - surf.x, sdy = Math.max(0.01, spout.y - surf.y);
    stream.position.set((spout.x + surf.x) / 2, (spout.y + surf.y) / 2, (spout.z + surf.z) / 2);
    stream.scale.set(1, Math.hypot(sdx, sdy), 1);
    stream.rotation.set(0, 0, -Math.atan2(sdx, sdy));
    // The hero mug sits on the bar, then rides in the host's hand.
    const grab = eio(k(t, 1.86, 1.96));
    hero.position.copy(MUGP);
    hero.rotation.set(0, 0, 0);
    if (grab > 0) {
      // Carried with its handle in the hand: the mug sits just inside the host's right hand.
      tmp3.copy(crowd.hand[0][1]).addScaledVector(hostS, -(MR + 0.035)); tmp3.y -= 0.01;
      hero.position.lerp(tmp3, grab);
      hero.rotation.y = hostYaw * grab;
    }
    coffee.position.y = -MH / 2 + lv;
    // Steam rises off it.
    steam.forEach((s, i) => {
      const u = (t * 0.42 + rnd(i, 3)) % 1;
      const amt = eo(k(t, 0.95, 1.6));
      s.position.set(hero.position.x + Math.sin(u * 7 + i) * 0.025 * (0.3 + u), hero.position.y + MH / 2 + 0.01 + u * 0.36, hero.position.z + Math.cos(u * 5 + i * 2) * 0.02 * u);
      s.scale.setScalar(0.05 + u * 0.13);
      s.material.opacity = 0.2 * Math.sin(Math.PI * u) * amt * (1 - 0.5 * k(t, 3.2, 4.0));
      s.material.rotation = u * 2 + i;
    });
    // Everyone else's mugs follow their right hands.
    for (let i = 1; i < 8; i++) {
      m4.compose(tmp.copy(crowd.hand[i][1]).add(tmp2.set(0, 0.03, 0)), q4.identity(), s4.set(1, 1, 1));
      mugs.setMatrixAt(i - 1, m4);
    }
    mugs.instanceMatrix.needsUpdate = true;

    // Neon flickers on while the coffee pours.
    const nf = t < 1.15 ? 0 : t < 1.75 ? (rnd(Math.floor(t * 24), 7) > 0.45 ? 1 : 0.15) : 1;
    neon.material.color.setScalar(lerp(0.13, 1, nf));
    neonGlow.material.opacity = 0.38 * nf;
    neonL.intensity = 2.0 * nf;

    // Screens: standby, then talk 1 at home; links carry it to Toronto and New York; talks 2 and 3 in sync.
    const n = talkAt(t);
    const key_ = String(n);
    if (key_ !== slideKey) { slideKey = key_; slideTex.redraw((c, w, h) => slide(c, w, h, n)); }
    const boot = eo(k(t, TALK_T[0] - 0.25, TALK_T[0] + 0.1));
    const flip = Math.max(...TALK_T.map((a) => Math.exp(-7 * Math.max(0, t - a)) * (t > a ? 1 : 0)));
    screenM.color.setScalar(lerp(0.35, 1, boot) + 0.25 * flip);
    screenGlow.material.opacity = 0.05 + 0.2 * boot + 0.25 * flip;
    screenL.intensity = 0.5 + 2.4 * boot + 2 * flip;
    // Panels roll open on the two offices.
    const op = eio(k(t, OPEN, OPEN + 0.65));
    doors.forEach((d, i) => { const s = i ? 1 : -1; d.position.x = (PORT[i][0] + PORT[i][1]) / 2 + s * 1.28 * op; });
    links.forEach((L, ri) => {
      const g = eio(k(t, LINK[ri], LAND[ri]));
      L.tube.geometry.setDrawRange(0, Math.floor(L.n * g / 36) * 36);
      L.tube.visible = g > 0.01;
      L.tube.material.opacity = 0.85 - 0.45 * k(t, LAND[ri] + 0.5, LAND[ri] + 1.5);
      L.curve.getPoint(g, L.spark.position);
      L.spark.material.opacity = 0.95 * Math.sin(Math.PI * g);
      L.spark.visible = g > 0 && g < 1;
      const on = eo(k(t, LAND[ri], LAND[ri] + 0.25)), fl = t > LAND[ri] ? Math.exp(-5 * (t - LAND[ri])) : 0;
      roomScreens[ri].scr.material.color.setScalar(lerp(0.06, 1, on) + 0.25 * flip * on);
      roomScreens[ri].sg.material.opacity = 0.32 * on + 0.5 * fl;
      roomLights[ri].intensity = lerp(0.6, 3.2, eo(k(t, OPEN + 0.1, OPEN + 0.6))) + 2 * fl;
      roomLabels[ri].material.opacity = lerp(0.18, 1, on);
    });

    // Talk cards drop into the holder, each new one in front of the last.
    cards.forEach((g, i) => {
      const d = spring(k(t, CARD_T[i], CARD_T[i] + 0.55));
      // Earlier cards stand higher and further back, so every label stays readable.
      const rest = tmp.set(0, 0.17 + 0.07 * (2 - i), 0.05 - i * 0.045).applyAxisAngle(Y, HOLD_YAW).add(tmp2.set(SIDE.x, 0.63, SIDE.z));
      g.position.copy(rest); g.position.y += (1 - d) * 0.55;
      g.rotation.set(HOLD_TILT + (1 - d) * 0.5, HOLD_YAW + (1 - d) * 0.4 * (i % 2 ? 1 : -1), (1 - d) * 0.3 * (i % 2 ? -1 : 1));
      g.visible = t > CARD_T[i];
    });

    // Line under the finished room.
    const ti = eo(k(t, 8.05, 8.6)), li = eo(k(t, 8.25, 8.8)), to = ei(k(t, 9.2, 9.55));
    lk.copy(camera.position);
    const tw = (l) => l.geometry.parameters.width;
    const LX = -0.92, LZ = 1.9;
    [[kicker, 1.15, ti], [line1, 1.02, li], [line2, 0.89, li]].forEach(([l, y, al]) => {
      l.position.set(LX + tw(l) / 2, y + (1 - al) * 0.04, LZ);
      l.lookAt(lk);
      l.material.opacity = al * (1 - to); l.visible = al > 0.01;
    });

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -2.4 + rnd(i, 61) * 4.8 + Math.sin(t * 0.3 + i) * 0.1;
      dpos[i * 3 + 1] = 0.3 + rnd(i, 62) * 2.4 + Math.sin(t * 0.4 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -2.0 + rnd(i, 63) * 3.4 + Math.cos(t * 0.25 + i) * 0.08;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.7 };
}
