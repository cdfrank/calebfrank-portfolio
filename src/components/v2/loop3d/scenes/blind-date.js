// MRM Office Blind Date lit loop, 10 s. "Lunches that paired employees with 10 coworkers from other departments."
// A sage-green office canteen at noon, sun striping in through tall windows. Three long department tables
// (Data, Creative, Account) sit under brass pendants; a lightbox on the back wall counts lunches. A designer
// in UX mint sits down at a small two-top with an empty chair across. Then the blind dates run as a
// quickening montage: a coworker from another department pops into the empty chair, they clink cups, the
// count ticks up, and a thread of light carries the new connection back across the room to that coworker's
// own seat, where they pop in. Ten lunches, ten threads. The camera cranes up over the room and the other
// teams start connecting to each other too, threads leaping table to table, before the title settles.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BG = 0x1d221d;
const DEPT = {
  U: { n: 'UX', c: '#35c7a1', h: 0x35c7a1 },
  D: { n: 'DATA', c: '#4c8de8', h: 0x4c8de8 },
  C: { n: 'CREATIVE', c: '#ef6a4a', h: 0xef6a4a },
  A: { n: 'ACCOUNT', c: '#e3a92e', h: 0xe3a92e },
};
// Department tables: centre x, z, facing yaw; five seats each along the back edge, facing the room.
const TABLES = { D: [-2.15, -1.55, 0.5], C: [0.1, -2.35, 0], A: [2.35, -1.55, -0.5] };
const SEAT_X = [-0.84, -0.42, 0, 0.42, 0.84], SEAT_Z = -0.62;
// The two-top where the dates happen.
const TT = [0.0, 0.45], TT_R = 0.42, TT_SEAT = 0.64;
// People. 0 is the UX designer. 1..10 are the ten coworkers in date order, each with a home seat.
// 11..15 are other people already at their tables, who start connecting in the last beat.
const MET = [['D', 0], ['C', 0], ['A', 0], ['D', 2], ['C', 1], ['A', 2], ['C', 3], ['D', 4], ['A', 4], ['C', 4]];
const OTHERS = [['D', 1], ['D', 3], ['C', 2], ['A', 1], ['A', 3]];
// Date start times: the montage quickens.
const DT = [1.5, 2.38, 2.98, 3.46, 3.86, 4.2, 4.5, 4.78, 5.04, 5.29], DT_END = 5.55;
const TRAVEL = 0.38;
// Cross-team threads in the last beat: [from, to, start].
const CROSS = [[11, 13, 6.05], [13, 14, 6.2], [12, 15, 6.35], [5, 6, 6.5], [8, 10, 6.62], [3, 7, 6.75], [14, 2, 6.88]];
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

// Seat on a department table, in world space: position and the yaw a seated person faces.
function seatOf(dk, si, out = V(0, 0, 0)) {
  const [cx, cz, yaw] = TABLES[dk];
  const lx = SEAT_X[si], lz = SEAT_Z;
  out.set(cx + lx * Math.cos(yaw) + lz * Math.sin(yaw), 0, cz - lx * Math.sin(yaw) + lz * Math.cos(yaw));
  return [out, yaw];
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 7, 15);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = V(0, 0, 0), s4 = V(1, 1, 1), e4 = new THREE.Euler();

  // ----------------------------------------------------------- the canteen
  const floor = mesh(new THREE.PlaneGeometry(14, 12), std(0xffffff, { map: (() => {
    const { tex } = canvasTex(512, 512, (c, w) => {
      // Terracotta tiles with grout lines and a little speckle.
      c.fillStyle = '#5a3326'; c.fillRect(0, 0, w, w);
      const n = 8, s = w / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
        const v = rnd(i * n + j, 3);
        c.fillStyle = `rgb(${Math.round(128 + v * 26)},${Math.round(72 + v * 16)},${Math.round(52 + v * 10)})`;
        c.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
      }
      for (let i = 0; i < 9000; i++) { const v = rnd(i, 9) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 7) * 0.08})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * w, 2, 2); }
    });
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(7, 6);
    return tex;
  })(), roughness: 0.62 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallM = std(0xffffff, { map: grainTex('#4f6a55', { size: 256, speck: 0.05, blot: 0.1, seed: 44, repeat: 3 }), roughness: 0.92 });
  const back_ = mesh(new THREE.PlaneGeometry(9, 3.6), wallM, { cast: false }); back_.position.set(0, 1.8, -3.4); scene.add(back_);
  const right = mesh(new THREE.PlaneGeometry(8, 3.6), wallM, { cast: false }); right.rotation.y = -Math.PI / 2; right.position.set(4.2, 1.8, 0.4); scene.add(right);
  // Wainscot band along the back wall.
  const wains = mesh(new THREE.BoxGeometry(9, 0.9, 0.04), std(0x2f4434, { roughness: 0.7 })); wains.position.set(0, 0.45, -3.38); scene.add(wains);
  // Left wall with three tall windows cut into it, so the sun only gets in through the glass.
  const WX = -3.7, WIN = [[-2.95, -2.15], [-1.75, -0.95], [-0.55, 0.25]], WY0 = 0.75, WY1 = 2.65;
  const leftParts = [];
  const lw = (z0, z1, y0, y1) => { const g = new THREE.BoxGeometry(0.12, y1 - y0, z1 - z0); g.translate(WX, (y0 + y1) / 2, (z0 + z1) / 2); leftParts.push(g); };
  lw(-3.4, 2.4, 0, WY0); lw(-3.4, 2.4, WY1, 3.6);
  let z = -3.4; WIN.forEach(([a, b]) => { lw(z, a, WY0, WY1); z = b; }); lw(z, 2.4, WY0, WY1);
  // Mullions: one bar across the middle of each window and one down it.
  const mull = [];
  WIN.forEach(([a, b]) => {
    const h = new THREE.BoxGeometry(0.06, 0.05, b - a); h.translate(WX, (WY0 + WY1) / 2 + 0.25, (a + b) / 2); mull.push(h);
    const v = new THREE.BoxGeometry(0.06, WY1 - WY0, 0.045); v.translate(WX, (WY0 + WY1) / 2, (a + b) / 2); mull.push(v);
  });
  const leftWall = mesh(mergeGeometries(leftParts), wallM); scene.add(leftWall);
  const mullM = mesh(mergeGeometries(mull), std(0x2a2620, { roughness: 0.5, metalness: 0.4 })); scene.add(mullM);
  const glassTex = canvasTex(64, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fff3dc'); g.addColorStop(1, '#ffd7a0'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  WIN.forEach(([a, b]) => {
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(b - a, WY1 - WY0), new THREE.MeshBasicMaterial({ map: glassTex, color: 0xb8b0a0, toneMapped: false }));
    gl.rotation.y = Math.PI / 2; gl.position.set(WX - 0.08, (WY0 + WY1) / 2, (a + b) / 2); scene.add(gl);
    const g = glow(0xffd29a, 1, 0.3, 0.5); g.scale.set(1.6, 2.6, 1); g.position.set(WX + 0.3, (WY0 + WY1) / 2, (a + b) / 2); scene.add(g);
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xcfd8c0, 0x3a2418, 0.42));
  const sun = new THREE.DirectionalLight(0xffd8a8, 3.4);
  sun.position.set(-7.5, 5.2, 1.6); sun.target.position.set(0, 0, -1.0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 4.5, bottom: -4.5, near: 2, far: 18 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.025;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0xa8c8ff, 0.9); rim.position.set(3, 2.6, -4); scene.add(rim);
  const fill = new THREE.SpotLight(0xffe6c8, 9, 0, 0.7, 0.8, 1.4); fill.position.set(2.2, 3.4, 3.6); fill.target.position.set(0, 0.8, -0.6); scene.add(fill, fill.target);

  // ----------------------------------------------------------- tables, chairs, pendants
  const oak = std(0xffffff, { map: grainTex('#9a6a42', { size: 256, speck: 0.08, blot: 0.12, seed: 8, repeat: 2 }), roughness: 0.45, metalness: 0.02 });
  const tops = new THREE.InstancedMesh(new RoundedBoxGeometry(2.15, 0.05, 0.8, 2, 0.015), oak, 3);
  const legsT = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.72, 0.05), std(0x232220, { roughness: 0.4, metalness: 0.6 }), 12 + 1);
  let li = 0;
  Object.values(TABLES).forEach(([cx, cz, yaw], i) => {
    q4.setFromAxisAngle(Y, yaw);
    m4.compose(p4.set(cx, 0.74, cz), q4, s4.set(1, 1, 1)); tops.setMatrixAt(i, m4);
    [[-0.98, -0.32], [0.98, -0.32], [-0.98, 0.32], [0.98, 0.32]].forEach(([lx, lz]) => {
      p4.set(lx, 0.36, lz).applyQuaternion(q4).add(V(cx, 0, cz)); m4.compose(p4, q4, s4.set(1, 1, 1)); legsT.setMatrixAt(li++, m4);
    });
  });
  // The two-top: a round table on one pedestal.
  const ttTop = mesh(new THREE.CylinderGeometry(TT_R, TT_R, 0.045, 48), oak); ttTop.position.set(TT[0], 0.74, TT[1]); ttTop.userData.tag = 'twotop'; scene.add(ttTop);
  m4.compose(p4.set(TT[0], 0.36, TT[1]), q4.identity(), s4.set(1.6, 1, 1.6)); legsT.setMatrixAt(li++, m4);
  const foot = mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.03, 32), std(0x232220, { roughness: 0.4, metalness: 0.6 })); foot.position.set(TT[0], 0.015, TT[1]); scene.add(foot);
  [tops, legsT].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  // Chairs: one per seat, and the two at the two-top.
  const seats = [];
  Object.keys(TABLES).forEach((dk) => SEAT_X.forEach((_, si) => { const [p, yaw] = seatOf(dk, si); seats.push([p.clone(), yaw]); }));
  seats.push([V(TT[0] - TT_SEAT, 0, TT[1]), Math.PI / 2], [V(TT[0] + TT_SEAT, 0, TT[1]), -Math.PI / 2]);
  const NCH = seats.length;
  const chairM = std(0x2d3a32, { roughness: 0.55 });
  const chSeat = new THREE.InstancedMesh(new RoundedBoxGeometry(0.42, 0.05, 0.42, 2, 0.015), chairM, NCH);
  const chBack = new THREE.InstancedMesh(new RoundedBoxGeometry(0.42, 0.36, 0.04, 2, 0.015), chairM, NCH);
  const chLeg = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.013, 0.011, 0.44, 8), std(0x1b1b1a, { roughness: 0.4, metalness: 0.7 }), NCH * 4);
  const qb = new THREE.Quaternion(), bp4 = V(0, 0, 0);
  const placeChair = (i, p, yaw) => {
    q4.setFromAxisAngle(Y, yaw);
    m4.compose(p4.copy(p).setY(0.45), q4, s4.set(1, 1, 1)); chSeat.setMatrixAt(i, m4);
    bp4.set(0, 0.68, -0.21).applyQuaternion(q4).add(p);
    e4.set(-0.1, yaw, 0, 'YXZ'); m4.compose(bp4, qb.setFromEuler(e4), s4.set(1, 1, 1)); chBack.setMatrixAt(i, m4);
    [[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].forEach(([x, zz], j) => { bp4.set(x, 0.22, zz).applyQuaternion(q4).add(p); m4.compose(bp4, q4, s4.set(1, 1, 1)); chLeg.setMatrixAt(i * 4 + j, m4); });
  };
  seats.forEach(([p, yaw], i) => placeChair(i, p, yaw));
  [chSeat, chBack, chLeg].forEach((m) => { m.castShadow = true; m.receiveShadow = true; scene.add(m); });
  // Lunch on every table: a bowl in front of each seat.
  const NB = 17;
  const bowls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 18, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), std(0xffffff, { roughness: 0.3, side: THREE.DoubleSide }), NB);
  const food = new THREE.InstancedMesh(new THREE.CircleGeometry(0.066, 18), std(0xffffff, { roughness: 0.8 }), NB);
  const FOOD = [0x7a9a3a, 0xc4672e, 0xd9b45a, 0x9a3a2e, 0x5e8a4a];
  const BOWL = [0xe8e0d0, 0x2f4434, 0xc96b4a, 0xe8e0d0];
  seats.forEach(([p, yaw], i) => {
    const f = fwdOf(yaw), bp = p.clone().addScaledVector(f, i >= 15 ? 0.36 : 0.45).setY(0.84);
    m4.compose(bp, q4.identity(), s4.set(1, 1, 1)); bowls.setMatrixAt(i, m4);
    bowls.setColorAt(i, new THREE.Color(BOWL[i % 4]));
    m4.compose(bp.clone().setY(0.832), q4.setFromAxisAngle(V(1, 0, 0), -Math.PI / 2), s4.set(1, 1, 1)); food.setMatrixAt(i, m4);
    food.setColorAt(i, new THREE.Color(FOOD[Math.floor(rnd(i, 4) * 5)]));
  });
  bowls.castShadow = true; scene.add(bowls, food);
  // Brass pendants: one over each department table, one over the two-top.
  const PEND = [...Object.values(TABLES).map(([x, z]) => [x, z]), [TT[0], TT[1]]];
  const shade = new THREE.InstancedMesh(new THREE.ConeGeometry(0.2, 0.18, 28, 1, true), std(0xb8873e, { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }), PEND.length);
  const cord = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), std(0x111111), PEND.length);
  PEND.forEach(([x, zz], i) => {
    m4.compose(p4.set(x, 2.02, zz), q4.identity(), s4.set(1, 1, 1)); shade.setMatrixAt(i, m4);
    m4.compose(p4.set(x, 2.6, zz), q4.identity(), s4.set(1, 1.1, 1)); cord.setMatrixAt(i, m4);
    const g = glow(0xffcf8a, 0.75, 0.55, 0.35); g.position.set(x, 1.93, zz); scene.add(g);
  });
  scene.add(shade, cord);
  const lampTT = new THREE.PointLight(0xffc98a, 2.2, 2.6, 1.6); lampTT.position.set(TT[0], 1.85, TT[1]); scene.add(lampTT);
  // Hanging department signs.
  Object.entries(TABLES).forEach(([dk, [x, zz, yaw]]) => {
    const Dp = DEPT[dk];
    const s = label(Dp.n, { font: `800 72px ${SANS}`, fg: Dp.c, bg: 'rgba(20,24,20,0.86)', h: 0.2, pad: 30, track: 6 });
    s.position.set(x, 2.38, zz - 0.15); s.rotation.y = yaw; s.material.depthWrite = true; scene.add(s);
  });
  // The tent card on the two-top.
  const tent = new THREE.Group(); tent.position.set(TT[0] - 0.05, 0.81, TT[1] + 0.27); tent.rotation.y = 0.15; scene.add(tent);
  const tentTex = canvasTex(256, 160, (c, w, h) => { c.fillStyle = '#f1ebe0'; c.fillRect(0, 0, w, h); c.fillStyle = DEPT.U.c; c.fillRect(0, h - 18, w, 18); c.fillStyle = '#1d3a30'; c.font = `800 92px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('UX', w / 2, h / 2 - 6); }).tex;
  [1, -1].forEach((sg) => { const pl = mesh(new THREE.PlaneGeometry(0.16, 0.1), std(0xffffff, { map: tentTex, roughness: 0.6, side: THREE.DoubleSide }), { cast: true }); pl.position.z = sg * 0.017; pl.rotation.set(-sg * 0.34, sg < 0 ? Math.PI : 0, 0); tent.add(pl); });

  // ----------------------------------------------------------- the lunch counter
  const CNT = [1.3, 2.2];
  const box = mesh(new RoundedBoxGeometry(1.5, 0.82, 0.08, 2, 0.02), std(0x16130f, { roughness: 0.4, metalness: 0.3 }));
  box.position.set(CNT[0], CNT[1], -3.32); scene.add(box);
  const cnt = canvasTex(640, 352);
  let cntKey = '';
  const drawCount = (n, flash) => {
    const key = n + '|' + Math.round(flash * 8); if (key === cntKey) return; cntKey = key;
    cnt.redraw((c, w, h) => {
      c.fillStyle = '#1b1712'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#d9cbb4'; c.font = `700 52px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '10px';
      c.fillText('LUNCHES', w / 2 + 5, 62);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = flash > 0.05 ? `rgb(255,${Math.round(214 + 41 * flash)},${Math.round(150 + 105 * flash)})` : '#ffd696';
      c.font = `800 210px ${MONO}`; c.fillText(String(n), w / 2, 222);
    });
  };
  const cntFace = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.77), new THREE.MeshBasicMaterial({ map: cnt.tex, toneMapped: false }));
  cntFace.position.set(CNT[0], CNT[1], -3.275); cntFace.userData.tag = 'count'; scene.add(cntFace);
  const cntGlow = glow(0xffc070, 1, 0.25, 0.45); cntGlow.scale.set(2.6, 1.5, 1); cntGlow.position.set(CNT[0], CNT[1], -3.2); scene.add(cntGlow);

  // ----------------------------------------------------------- people
  const SKINS = [0x8a5a3e, 0xe2b08e, 0xc68b68, 0x5e3a28, 0xd6a083, 0xa86e4a, 0xf0c4a0, 0x7a4a30];
  const HAIRS = [0x15100d, 0x7a3b1c, 0x2a1a12, 0xb88a4a, 0x0e0b0a, 0x4a2a1a, 0x5a5048, 0x1c1410];
  const PANTS = [0x2a2f3a, 0x30343c, 0x3a3340, 0x262a33, 0x3b3226, 0x2e3a3a];
  const roster = [['U', -1], ...MET, ...OTHERS];
  const list = roster.map(([dk], i) => ({
    skin: SKINS[(i * 3 + 1) % SKINS.length], hair: HAIRS[(i * 5 + 2) % HAIRS.length], pants: PANTS[i % PANTS.length],
    top: DEPT[dk].h, shoe: i % 3 ? 0x1d1f22 : 0xe8e2d6, bun: rnd(i, 12) > 0.6, chest: 0.135 + rnd(i, 13) * 0.02,
    fore: rnd(i, 14) > 0.55 ? SKINS[(i * 3 + 1) % SKINS.length] : undefined,
  }));
  const crowd = makeCrowd(scene, list);
  scene.userData.crowd = crowd;
  const NP = list.length;
  // Each person's home seat and facing.
  const HOME = roster.map(([dk, si]) => (dk === 'U' ? [V(TT[0] - TT_SEAT, 0, TT[1]), Math.PI / 2] : seatOf(dk, si)));
  HOME.forEach((h) => { h[0] = h[0].clone(); });
  const DATE_SEAT = V(TT[0] + TT_SEAT, 0, TT[1]), DATE_YAW = -Math.PI / 2;
  const CLINK = V(TT[0], 1.02, TT[1] - 0.04);
  // When person p (1..10) is on their date, and when they land back at home.
  const dateOf = (p) => { const a = DT[p - 1], d = (p < 10 ? DT[p] : DT_END) - a; return { a, d, clink: a + 0.45 * d, fire: a + 0.52 * d, home: Math.max(a + d, a + 0.52 * d + TRAVEL) }; };
  const DATES = [null, ...MET.map((_, i) => dateOf(i + 1))];

  const hipP = V(0, 0, 0), look = V(0, 0, 0), F = V(0, 0, 0), S = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), hang = V(0, 0, 0), hang2 = V(0, 0, 0), seatUX = V(0, 0, 0), fUX = V(0, 0, 0);
  // Seated pose at seat p (chair centre) facing yaw. talk: 0..1 gesture amount; reach: hand toward a point.
  function seated(i, seat, yaw, t, { sc = 1, lookAt, lean = 0.06, reachHand = -1, reach = 0, reachTo = null, talk = 0.4, nod = 0, rise = 0 }) {
    fwdOf(yaw, F); sideOf(yaw, S);
    const ph = t * 1.7 + i * 1.9;
    hipP.copy(seat).addScaledVector(F, lerp(-0.02, 0.22, rise)); hipP.y = lerp(0.53, 0.93, rise) + 0.004 * Math.sin(t * 2 + i);
    crowd.pose(i, {
      hip: hipP, yaw, lean: lean + 0.04 * Math.sin(ph * 0.5) * talk + 0.28 * Math.sin(Math.PI * rise), tilt: 0.03 * Math.sin(ph * 0.37),
      look: lookAt, nod, sc, kneePole: tmp2.copy(F).add(Y),
      feet: (f, out) => { out.copy(seat).addScaledVector(F, lerp(0.44, 0.36, rise)).addScaledVector(S, (f ? 1 : -1) * 0.12); out.y = 0.085; return 0; },
      hands: (h, sh, out) => {
        const sg = h ? 1 : -1;
        out.copy(seat).addScaledVector(F, 0.36).addScaledVector(S, sg * 0.2); out.y = 0.79;
        // Talking: a hand lifts and turns now and then.
        const g = Math.max(0, Math.sin(ph + h * 2.1)) * talk;
        out.y += 0.12 * g; out.addScaledVector(F, 0.04 * g);
        if (rise > 0) out.lerp(hang.copy(sh).add(hang2.set(0, -0.5, 0)).addScaledVector(F, 0.1).addScaledVector(S, sg * 0.05), rise);
        if (h === reachHand && reach > 0 && reachTo) out.lerp(reachTo, reach);
      },
    });
  }

  // ----------------------------------------------------------- threads
  // All threads live in one merged tube mesh. Each vertex carries the time the thread's head reaches it,
  // and the shader drops what hasn't been reached yet, so any t draws the right web in one call.
  const posePeople = (t) => { for (let i = 0; i < NP; i++) poseOne(i, t); crowd.commit(); [chSeat, chBack, chLeg].forEach((m) => { m.instanceMatrix.needsUpdate = true; }); };
  const CHEST = [];
  const threadGeos = [], threadSpecs = [];
  const uT = { value: 0 };
  const sparks = [];
  function addThread(a, b, t0, dur, color, lift = 0.9) {
    const m = a.clone().lerp(b, 0.5); m.y = Math.max(a.y, b.y) + lift;
    const curve = new THREE.QuadraticBezierCurve3(a.clone(), m, b.clone());
    const TS = 48, RS = 5;
    const g = new THREE.TubeGeometry(curve, TS, 0.012, RS, false);
    const n = g.attributes.position.count, rev = new Float32Array(n), colA = new Float32Array(n * 3);
    const c = new THREE.Color(color);
    for (let v = 0; v < n; v++) { const j = Math.floor(v / (RS + 1)); rev[v] = t0 + (j / TS) * dur; colA[v * 3] = c.r; colA[v * 3 + 1] = c.g; colA[v * 3 + 2] = c.b; }
    g.setAttribute('aRev', new THREE.BufferAttribute(rev, 1));
    g.setAttribute('color', new THREE.BufferAttribute(colA, 3));
    g.deleteAttribute('uv');
    threadGeos.push(g);
    const sp = glow(color, 0.26, 0, 0.35); scene.add(sp);
    sparks.push({ sp, curve, t0, dur });
    threadSpecs.push({ curve, t0, dur });
  }

  // ----------------------------------------------------------- choreography
  const T_SIT = [0.35, 1.2];
  function poseOne(i, t) {
    const [home, hyaw] = HOME[i];
    if (i === 0) {
      // The UX designer sits down, then hosts every date: looks at each new face, clinks, watches the thread go.
      const sit = ss(k(t, T_SIT[0], T_SIT[1])), tuck = ss(k(t, 1.0, 1.45));
      const seat = seatUX.copy(home).addScaledVector(fwdOf(hyaw, fUX), -0.32 * (1 - tuck));
      placeChair(15, seat, hyaw);
      let cur = 0; for (let p = 1; p <= 10; p++) if (t >= DATES[p].a - 0.05) cur = p;
      const dd = cur ? DATES[cur] : null;
      const cl = dd ? Math.sin(Math.PI * k(t, dd.clink - Math.min(0.2, dd.d * 0.4), dd.clink + Math.min(0.2, dd.d * 0.4))) : 0;
      if (dd && t > dd.fire && t < dd.fire + TRAVEL + 0.15) look.copy(CHEST[cur]); else look.copy(DATE_SEAT).setY(1.2);
      if (t < 1.4) look.lerp(tmp.set(0.6, 1.0, 2.0), 1 - k(t, 0.9, 1.4));
      if (t > 5.8) look.lerp(tmp.set(0.1, 1.6, -2.4), eio(k(t, 5.8, 6.5)));
      seated(i, seat, hyaw, t, { lookAt: look, rise: 1 - sit, reachHand: 1, reach: cl, reachTo: CLINK, talk: 0.25, lean: 0.08 + 0.3 * cl });
      return;
    }
    const isMet = i <= 10;
    const dd = isMet ? DATES[i] : null;
    // Cross-team threads this person is part of: they turn toward the other end as it lands.
    let cx = null;
    for (const [a, b, s0] of CROSS) if ((a === i || b === i) && t > s0) cx = [a === i ? b : a, s0];
    const lookHome = (to) => { if (cx) { look.copy(CHEST[cx[0]]); look.y += 0.15; } else look.copy(to); };
    if (isMet && t < dd.a) { seated(i, DATE_SEAT, DATE_YAW, t, { sc: 0, lookAt: CLINK }); return; }
    if (isMet && t < dd.home) {
      // On the date: pops into the empty chair, clinks with the host, pops out as the thread leaves.
      const pin = back(k(t, dd.a, dd.a + Math.max(0.12, dd.d * 0.3))), pout = 1 - ei(k(t, dd.a + dd.d * 0.82, dd.a + dd.d));
      const cl = Math.sin(Math.PI * k(t, dd.clink - Math.min(0.2, dd.d * 0.4), dd.clink + Math.min(0.2, dd.d * 0.4)));
      look.copy(HOME[0][0]).setY(1.18);
      seated(i, DATE_SEAT, DATE_YAW, t, { sc: Math.max(0, pin * pout), lookAt: look, reachHand: 1, reach: cl, reachTo: CLINK, talk: 0.5, lean: 0.1 + 0.3 * cl });
      return;
    }
    // At home: dated people pop into their own seat as the thread lands; others are there all along.
    const sc = isMet ? spring(k(t, dd.home, dd.home + 0.45)) : 1;
    lookHome(tmp.copy(CLINK).setY(1.1));
    if (!isMet && !cx) look.copy(home).addScaledVector(fwdOf(hyaw, tmp2), 2).setY(0.9).addScaledVector(sideOf(hyaw, tmp2), Math.sin(t * 0.4 + i) * 1.2);
    seated(i, home, hyaw, t, { sc, lookAt: look, talk: 0.5 + 0.3 * rnd(i, 3), lean: 0.06 });
  }
  // Chest positions at the end, for the thread ends.
  for (let i = 0; i < NP; i++) { const [home, hyaw] = HOME[i]; seated(i, home, hyaw, 9.5, { lookAt: V(0, 1, 0) }); CHEST[i] = crowd.chest[i].clone(); }
  for (let p = 1; p <= 10; p++) addThread(CLINK, CHEST[p], DATES[p].fire, TRAVEL, DEPT[MET[p - 1][0]].h, 0.75);
  CROSS.forEach(([a, b, s0]) => addThread(CHEST[a], CHEST[b], s0, 0.5, 0xfff0d0, 0.7));
  const thM = new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  thM.onBeforeCompile = (sh) => {
    sh.uniforms.uT = uT;
    sh.vertexShader = 'attribute float aRev;\nvarying float vRev;\n' + sh.vertexShader.replace('#include <begin_vertex>', '#include <begin_vertex>\n  vRev = aRev;');
    sh.fragmentShader = 'uniform float uT;\nvarying float vRev;\n' + sh.fragmentShader
      .replace('void main() {', 'void main() {\n  if (vRev > uT) discard;')
      .replace('#include <color_fragment>', '#include <color_fragment>\n  float hot = clamp(1.0 - (uT - vRev) * 2.5, 0.0, 1.0);\n  diffuseColor.rgb = diffuseColor.rgb * (0.75 + 0.9 * hot) + vec3(0.35) * hot;');
  };
  const threads = new THREE.Mesh(mergeGeometries(threadGeos), thM);
  threads.frustumCulled = false; scene.add(threads);
  // Cups: the host's and the date's, carried in their reaching hands.
  const cupM = new THREE.MeshPhysicalMaterial({ color: 0xe9e2d4, roughness: 0.25, clearcoat: 0.6 });
  const cupG = new THREE.CylinderGeometry(0.036, 0.03, 0.09, 20);
  const cups = [0, 1].map(() => { const c = mesh(cupG, cupM); scene.add(c); return c; });
  const clinkGlow = glow(0xffe2a8, 0.5, 0, 0.35); scene.add(clinkGlow);

  // ----------------------------------------------------------- title
  const kicker = label('MRM', { font: `700 60px ${MONO}`, fg: '#8fe8cf', h: 0.11, pad: 8, track: 8 });
  const title = label('Office Blind Date', { font: `800 72px ${SANS}`, fg: '#f6efe2', h: 0.22, pad: 8, track: 0 });
  const line1 = label('Lunches that paired employees', { font: `600 52px ${SANS}`, fg: '#efe6d6', h: 0.1, pad: 8, track: 0 });
  const line2 = label('with 10 coworkers from other departments.', { font: `600 52px ${SANS}`, fg: '#efe6d6', h: 0.1, pad: 8, track: 0 });
  [kicker, title, line1, line2].forEach((l, i) => { l.material.fog = false; l.userData.tag = ['kick', 'title', 'line1', 'line2'][i]; scene.add(l); });

  // ----------------------------------------------------------- dust in the sun
  const DN = 160, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe2b0, size: 0.013, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L_ = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [1.15, 1.42, 3.0]], [1.4, [0.75, 1.5, 2.55], L_],
    [3.2, [1.45, 2.05, 3.55]], [5.6, [-0.6, 2.2, 3.75]],
    [7.3, [0.15, 3.35, 4.45]], [10, [0.25, 3.38, 4.7], L_],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.0, 0.95, 0.4]], [1.4, [0.05, 0.98, 0.3], L_],
    [3.2, [-0.05, 1.05, -0.5]], [5.6, [0.1, 1.05, -0.65]],
    [7.3, [0.05, 0.9, -1.2]], [10, [0.05, 0.9, -1.2], L_],
  ]);
  const tgt = V(0, 0, 0), lk = V(0, 0, 0);

  function update(t) {
    const p = camPos(t), qv = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(qv[0], qv[1], qv[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [1.4, 34], [3.2, 40], [7.3, 42], [10, 42]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    posePeople(t);
    uT.value = t;
    threads.visible = t > DATES[1].fire;
    sparks.forEach(({ sp, curve, t0, dur }) => {
      const g = k(t, t0, t0 + dur);
      sp.visible = g > 0 && g < 1;
      curve.getPoint(g, sp.position); sp.material.opacity = 0.95 * Math.sin(Math.PI * Math.min(1, g * 1.4));
    });

    // Cups ride in the reaching hands; the host's rests on the table between dates.
    let cur = 0; for (let q = 1; q <= 10; q++) if (t >= DATES[q].a - 0.05) cur = q;
    cups[0].position.copy(crowd.hand[0][1]).add(tmp.set(0.03, 0.015, 0));
    cups[0].visible = t > 0.8;
    const dd = cur ? DATES[cur] : null;
    const onDate = dd && t < dd.a + dd.d;
    cups[1].visible = !!onDate && t > dd.a + 0.04;
    cups[1].position.copy(crowd.hand[cur][1]).add(tmp.set(-0.03, 0.015, 0));
    const cflash = dd ? Math.exp(-14 * Math.max(0, t - dd.clink)) * (t > dd.clink ? 1 : 0) : 0;
    clinkGlow.position.copy(CLINK).add(tmp.set(0, 0.03, 0));
    clinkGlow.material.opacity = 0.9 * cflash; clinkGlow.scale.setScalar(0.25 + 0.4 * cflash);

    // The counter ticks on each clink.
    let n = 0, last = -9; for (let q = 1; q <= 10; q++) if (t >= DATES[q].clink) { n = q; last = DATES[q].clink; }
    const fl = Math.exp(-6 * Math.max(0, t - last));
    drawCount(n, n ? fl : 0);
    const pop = n ? 1 + 0.06 * Math.exp(-9 * Math.max(0, t - last)) : 1;
    cntFace.scale.setScalar(pop);
    cntGlow.material.opacity = 0.18 + 0.35 * (n ? fl : 0) + 0.15 * eo(k(t, 5.4, 6.0));
    lampTT.intensity = 2.2 + 1.2 * cflash;

    // Title, low in front of the two-top on the wide shot.
    const ti = eo(k(t, 7.7, 8.25)), li = eo(k(t, 7.9, 8.45)), to = ei(k(t, 9.2, 9.55));
    lk.copy(camera.position);
    const tw = (l) => l.geometry.parameters.width;
    const LX = 0.42;
    [[kicker, 1.5, ti], [title, 1.32, ti], [line1, 1.13, li], [line2, 1.01, li]].forEach(([l, y, al]) => {
      l.position.set(LX + tw(l) / 2, y + (1 - al) * 0.05, 1.45);
      l.lookAt(lk);
      l.material.opacity = al * (1 - to); l.visible = al > 0.01;
    });

    for (let i = 0; i < DN; i++) {
      const u = rnd(i, 91);
      dpos[i * 3] = lerp(WX + 0.3, 1.2, u) + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = lerp(2.4, 0.3, u) + (rnd(i, 92) - 0.5) * 0.8 + Math.sin(t * 0.42 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -3.0 + rnd(i, 93) * 3.4 + Math.cos(t * 0.22 + i) * 0.08;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
