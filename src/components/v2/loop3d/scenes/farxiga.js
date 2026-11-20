// AstraZeneca Farxiga landing pages lit loop, 10 s. "A campaign page that keeps its required panel in view."
// A quiet teal consult room at first light: one tall window throws a warm shaft across the floor. A doctor
// in a white coat checks a tablet, turns it around to show the patient sitting across from them, and hands
// it over. The doctor gives a small nod, turns, and walks out through a warm doorway at the back. Over the
// patient's shoulder the campaign landing page scrolls in their hands while its pinned panel stays put,
// lifting off the glass as the content slides beneath it. The page returns to its hero, a gold ring pulses
// out from the tablet, and the project's name settles in the space the doctor left. Kept abstract on
// purpose: no product, health or efficacy copy.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const TEAL = '#1f8a8f', TEAL_HEX = 0x2fb3b0, GOLD = '#e8b45a', GOLD_HEX = 0xe8b45a, PAGE = '#ece6dc';
const APPROVE = 7.3;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// The page's scroll position in page px, deterministic in t.
const scrollAt = (t) => kf(t, [[6.0, 0], [6.7, 1180], [6.85, 1150], [7.05, 1150], [7.6, 0]]);

// Wrap an angle so it sits within half a turn of ref.
const near = (a, ref) => { while (a - ref > Math.PI) a -= Math.PI * 2; while (a - ref < -Math.PI) a += Math.PI * 2; return a; };
const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// A stylized person built from capsules: everything is placed in world space from a handful of inputs
// (hip centre, facing, lean, ankle targets, wrist targets, where they look), so any frame stands alone.
function makePerson(scene, o) {
  const bone = (r, len, m) => { const b = mesh(new THREE.CapsuleGeometry(r, len, 4, 12), m); scene.add(b); return b; };
  const LT = 0.44, LS = 0.43, LU = 0.29, LF = 0.27;
  const p = {
    pelvis: bone(0.1, 0.12, o.pants),
    torso: bone(o.chestR, 0.3, o.top),
    neck: bone(0.042, 0.05, o.skin),
    head: mesh(new THREE.SphereGeometry(0.102, 28, 20), o.skin),
    nose: mesh(new THREE.SphereGeometry(0.018, 10, 8), o.skin),
    hair: mesh(new THREE.SphereGeometry(0.109, 28, 14, 0, Math.PI * 2, 0, Math.PI * o.hairCap), o.hairM),
    ua: [bone(0.05, 0.21, o.sleeve), bone(0.05, 0.21, o.sleeve)],
    fa: [bone(0.042, 0.2, o.fore), bone(0.042, 0.2, o.fore)],
    hand: [0, 1].map(() => { const h = mesh(new THREE.SphereGeometry(0.04, 14, 10), o.skin); h.scale.set(0.8, 1.15, 1); scene.add(h); return h; }),
    th: [bone(0.07, 0.34, o.pants), bone(0.07, 0.34, o.pants)],
    sh: [bone(0.056, 0.34, o.pants), bone(0.056, 0.34, o.pants)],
    shoe: [0, 1].map(() => { const s = mesh(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.03), o.shoeM); scene.add(s); return s; }),
    extra: [],
  };
  [p.head, p.nose, p.hair].forEach((m) => scene.add(m));
  if (o.bun) { p.bun = mesh(new THREE.SphereGeometry(0.058, 16, 12), o.hairM); scene.add(p.bun); }
  const va = V(0, 0, 0), vb = V(0, 0, 0), vc = V(0, 0, 0), vd = V(0, 0, 0);
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, vd.subVectors(b, a).normalize()); };
  // Two-bone reach: the middle joint (knee or elbow) bends toward the pole.
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.min(dv.length(), l1 + l2 - 0.001); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0), lookD = V(0, 0, 0);
  p.shoulder = [V(0, 0, 0), V(0, 0, 0)];
  p.headPos = V(0, 0, 0);
  // hip: world pelvis centre; yaw: facing; lean: forward lean of the spine; feet(i, out): ankle target;
  // hands(i, shoulder, out): wrist target; look: world point the head turns toward; nod: extra head dip.
  p.pose = ({ hip, yaw, lean, feet, hands, look, nod = 0, kneePole }) => {
    fwdOf(yaw, F); sideOf(yaw, S);
    place(p.pelvis, va.copy(hip).addScaledVector(S, -0.08), vb.copy(hip).addScaledVector(S, 0.08));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      hipI.copy(hip).addScaledVector(S, sg * 0.1);
      feet(i, ank);
      pole.copy(kneePole || F).addScaledVector(S, sg * 0.08);
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
    lookD.subVectors(look, p.headPos); lookD.y = clamp(lookD.y / Math.max(0.01, Math.hypot(lookD.x, lookD.z)), -0.9, 0.5) * Math.hypot(lookD.x, lookD.z);
    lookD.normalize(); lookD.y -= nod; lookD.normalize();
    p.headPos.addScaledVector(lookD, 0.012);
    p.head.position.copy(p.headPos);
    p.nose.position.copy(p.headPos).addScaledVector(lookD, 0.098);
    p.hair.position.copy(p.headPos).addScaledVector(lookD, -0.014).add(vb.set(0, 0.012, 0));
    p.hair.quaternion.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lookD, -0.4).normalize());
    if (p.bun) p.bun.position.copy(p.headPos).addScaledVector(lookD, -0.1).add(vb.set(0, 0.03, 0));
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
  p.setVisible = (v) => { Object.values(p).forEach((x) => { if (Array.isArray(x)) x.forEach((y) => { if (y && y.isObject3D) y.visible = v; }); else if (x && x.isObject3D) x.visible = v; }); (p.meshes || []).forEach((m) => { m.visible = v; }); };
  return p;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071315);
  scene.fog = new THREE.Fog(0x071315, 5, 13);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the consult room
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#27302e', { size: 256, speck: 0.08, blot: 0.12, seed: 23, repeat: 6 }), roughness: 0.55, metalness: 0.1 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Back wall with a doorway cut into it on the right.
  const DOOR_L = 1.15, DOOR_R = 2.1, DOOR_H = 2.15, WZ = -2.3;
  const wallM = std(0xffffff, { map: grainTex('#102629', { size: 256, speck: 0.05, blot: 0.12, seed: 29, repeat: 3 }), roughness: 0.95 });
  [[-6, DOOR_L, -0.4, 5.6], [DOOR_R, 6, -0.4, 5.6], [DOOR_L, DOOR_R, DOOR_H, 5.6]].forEach(([x0, x1, y0, y1]) => {
    const w = mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), wallM, { cast: false }); w.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ); scene.add(w);
  });
  const trimM = std(0x8e7a52, { metalness: 0.85, roughness: 0.35 });
  [[DOOR_L - 0.025, DOOR_H / 2, 0.05, DOOR_H + 0.05], [DOOR_R + 0.025, DOOR_H / 2, 0.05, DOOR_H + 0.05], [(DOOR_L + DOOR_R) / 2, DOOR_H + 0.025, DOOR_R - DOOR_L + 0.1, 0.05]]
    .forEach(([x, y, w, h]) => { const b = mesh(new THREE.BoxGeometry(w, h, 0.12), trimM); b.position.set(x, y, WZ); scene.add(b); });
  // The hallway beyond: warm walls and a ceiling light the doctor walks into.
  const hallM = std(0xd8b48a, { roughness: 0.9 });
  const hallBack = mesh(new THREE.PlaneGeometry(2.4, 3), hallM, { cast: false }); hallBack.position.set((DOOR_L + DOOR_R) / 2 + 0.4, 1.5, -4.2); scene.add(hallBack);
  [DOOR_L, DOOR_R].forEach((x, i) => { const s = mesh(new THREE.PlaneGeometry(1.9, 3), hallM, { cast: false }); s.rotation.y = i ? -Math.PI / 2 : Math.PI / 2; s.position.set(x + (i ? 0.002 : -0.002), 1.5, -3.25); if (i) s.scale.x = 0.4; scene.add(s); });
  const hallL = new THREE.PointLight(0xffd2a0, 7, 4.5, 1.4); hallL.position.set(1.62, 2.0, -3.2); scene.add(hallL);
  const hallGlow = glow(0xffc890, 1.6, 0.35, 0.5); hallGlow.position.set(1.62, 1.6, -3.4); hallGlow.scale.set(1.4, 2.4, 1); scene.add(hallGlow);

  const WIN = new THREE.Vector3(-1.75, 1.7, -2.28);
  // The tall window and the shaft of warm light it throws across the room.
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 2.3), new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false }));
  win.position.copy(WIN); scene.add(win);
  const WIN_COL = new THREE.Color(0xffd9a8);
  const winGlow = glow(0xffb870, 1, 0.5, 0.45); winGlow.position.copy(WIN).add(new THREE.Vector3(0, 0, 0.05)); winGlow.scale.set(1.3, 3.4, 1); scene.add(winGlow);
  const LDIR = new THREE.Vector3(2.6, -2.1, 1.3).normalize();
  const POOL = WIN.clone().addScaledVector(LDIR, WIN.y / -LDIR.y);
  const shaftTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.3, 'rgba(0,0,0,0)'); s.addColorStop(0.7, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const shaftLen = WIN.distanceTo(POOL);
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.55, shaftLen), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffb877, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  {
    const mid = WIN.clone().add(POOL).multiplyScalar(0.5);
    const yA = WIN.clone().sub(POOL).normalize();
    const toCam = new THREE.Vector3(0, 1.0, 3.4).sub(mid);
    const zA = toCam.sub(yA.clone().multiplyScalar(toCam.dot(yA))).normalize();
    const xA = new THREE.Vector3().crossVectors(yA, zA);
    shaft.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA));
    shaft.position.copy(mid);
  }
  scene.add(shaft);
  const poolTex = canvasTex(128, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshBasicMaterial({ map: poolTex, color: 0xffb877, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.set(-Math.PI / 2, 0, -Math.atan2(LDIR.z, LDIR.x)); pool.position.set(POOL.x, 0.004, POOL.z); scene.add(pool);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5f8f8c, 0x0a0f0e, 0.34));
  const sun = new THREE.DirectionalLight(0xffc690, 0);
  sun.position.copy(LDIR).multiplyScalar(-5).add(new THREE.Vector3(0.1, 0.8, -0.2)); sun.target.position.set(0.1, 0.8, -0.2);
  sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 1, far: 11 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const fill = new THREE.SpotLight(0xd8ebe8, 11, 0, 0.75, 0.9, 1.4);
  fill.position.set(1.2, 2.6, 3.4); fill.target.position.set(0.0, 0.9, 0); scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(TEAL_HEX, 1.4); rim.position.set(2.4, 1.8, -2.4); scene.add(rim);

  // ----------------------------------------------------------- the patient's chair
  const PAT = V(-0.35, 0, 0.1), PAT_YAW = Math.PI / 2 - 0.35;
  const chair = new THREE.Group(); chair.position.copy(PAT); chair.rotation.y = PAT_YAW; scene.add(chair);
  const cushion = std(0x2e5a5c, { roughness: 0.85 }), steel = std(0xb9bfc4, { metalness: 1, roughness: 0.3 });
  const seat = mesh(new RoundedBoxGeometry(0.5, 0.07, 0.48, 3, 0.025), cushion); seat.position.set(0, 0.45, 0); chair.add(seat);
  const backR = mesh(new RoundedBoxGeometry(0.5, 0.48, 0.06, 3, 0.025), cushion); backR.position.set(0, 0.77, -0.25); backR.rotation.x = -0.14; chair.add(backR);
  [[-0.21, -0.19], [0.21, -0.19], [-0.21, 0.19], [0.21, 0.19]].forEach(([x, z]) => { const l = mesh(new THREE.CylinderGeometry(0.014, 0.012, 0.42, 10), steel); l.position.set(x, 0.21, z); chair.add(l); });
  const toW = (local, out = V(0, 0, 0)) => out.copy(local).applyAxisAngle(Y, PAT_YAW).add(PAT);

  // ----------------------------------------------------------- the two people
  const skinOf = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const coatM = new THREE.MeshPhysicalMaterial({ color: 0xf3f1ec, roughness: 0.7, sheen: 0.3, sheenColor: new THREE.Color(0xffffff) });
  const docSkin = skinOf(0x8a5a3e);
  const doc = makePerson(scene, { skin: docSkin, top: coatM, sleeve: coatM, fore: coatM, pants: std(0x2c6f74, { roughness: 0.85 }), shoeM: std(0x1b1d20, { roughness: 0.5 }), hairM: std(0x17120f, { roughness: 0.9 }), hairCap: 0.5, chestR: 0.15 });
  // Coat skirt, the scrub V at the neck, a stethoscope and an ID badge ride on the doctor's torso.
  const skirtG = new THREE.CylinderGeometry(0.19, 0.25, 0.34, 28, 1, true); skirtG.translate(0, -0.17, 0);
  const skirt = mesh(skirtG, new THREE.MeshPhysicalMaterial({ color: 0xf3f1ec, roughness: 0.7, side: THREE.DoubleSide })); scene.add(skirt);
  const vneck = mesh(new THREE.CircleGeometry(0.06, 3), std(0x2c6f74, { roughness: 0.8 }), { cast: false }); scene.add(vneck);
  const stetho = mesh(new THREE.TorusGeometry(0.1, 0.007, 8, 32, Math.PI), std(0x24272b, { roughness: 0.4 })); scene.add(stetho);
  const chestPiece = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.01, 18), std(0xc9ced3, { metalness: 1, roughness: 0.25 })); scene.add(chestPiece);
  const badge = mesh(new THREE.PlaneGeometry(0.05, 0.07), new THREE.MeshStandardMaterial({ map: canvasTex(64, 90, (c, w, h) => { c.fillStyle = '#f4f1ea'; c.fillRect(0, 0, w, h); c.fillStyle = TEAL; c.fillRect(0, 0, w, h * 0.22); c.fillStyle = '#9aa6a6'; c.fillRect(w * 0.15, h * 0.34, w * 0.4, h * 0.3); c.fillStyle = '#5f6b6b'; c.fillRect(w * 0.15, h * 0.74, w * 0.7, h * 0.06); }).tex, roughness: 0.4 }), { cast: false });
  scene.add(badge);
  const mB = new THREE.Matrix4(), bx = V(0, 0, 0), by = V(0, 0, 0), bz = V(0, 0, 0);
  doc.extra.push((hip, top, F, S, Dn) => {
    skirt.position.copy(hip).add(bx.set(0, 0.06, 0)); skirt.quaternion.setFromAxisAngle(Y, Math.atan2(F.x, F.z));
    vneck.position.copy(top).addScaledVector(Dn, -0.04).addScaledVector(F, 0.142); vneck.quaternion.setFromAxisAngle(Y, Math.atan2(F.x, F.z)); vneck.rotateZ(-Math.PI / 2);
    by.copy(Y).multiplyScalar(-0.75).addScaledVector(F, 0.66).normalize(); bx.copy(S); bz.crossVectors(bx, by).normalize();
    mB.makeBasis(bx, by, bz); stetho.quaternion.setFromRotationMatrix(mB); stetho.position.copy(top).addScaledVector(Dn, 0.05).addScaledVector(F, 0.03);
    chestPiece.position.copy(top).addScaledVector(Dn, -0.17).addScaledVector(F, 0.15).addScaledVector(S, 0.05); chestPiece.quaternion.setFromUnitVectors(Y, F);
    badge.position.copy(top).addScaledVector(Dn, -0.14).addScaledVector(F, 0.153).addScaledVector(S, -0.07); badge.quaternion.setFromAxisAngle(Y, Math.atan2(F.x, F.z));
  });
  const pat = makePerson(scene, { skin: skinOf(0xd6a083), top: std(0xb5583c, { roughness: 0.9 }), sleeve: std(0xb5583c, { roughness: 0.9 }), fore: std(0xb5583c, { roughness: 0.9 }), pants: std(0x34465e, { roughness: 0.85 }), shoeM: std(0xe9e4da, { roughness: 0.7 }), hairM: std(0x4a2a1a, { roughness: 0.9 }), hairCap: 0.6, chestR: 0.14, bun: true });

  // ----------------------------------------------------------- the tablet
  const tab = phone({ w: 0.19, h: 0.255, d: 0.009, frame: 0xa7adb3, notch: false, r: 0.016 });
  scene.add(tab);
  const { sw, sh, d: pd } = tab.userData;
  const UW = Math.round(1024 * sw / sh), UH = 1024;
  const ui = canvasTex(UW, UH);
  tab.userData.screen.material.map = ui.tex; tab.userData.screen.material.needsUpdate = true;
  const screenGlow = glow(0x9fe0dc, 1, 0, 0.5); screenGlow.position.z = 0.02; screenGlow.scale.set(sw * 2.4, sh * 2.2, 1); tab.add(screenGlow);
  const TW = 0.19, TH = 0.255;

  // The landing page: hero, content, footer. Shapes only, no copy.
  function drawPage(c, w, h, scroll, boot) {
    c.fillStyle = '#05090a'; c.fillRect(0, 0, w, h);
    if (boot <= 0) return;
    c.globalAlpha = boot;
    c.fillStyle = PAGE; c.fillRect(0, 0, w, h);
    c.save(); c.translate(0, -scroll);
    // Hero
    const hg = c.createLinearGradient(0, 0, w, 760); hg.addColorStop(0, '#0d4f55'); hg.addColorStop(0.65, '#1f7a77'); hg.addColorStop(1, '#d99a4a');
    c.fillStyle = hg; c.fillRect(0, 0, w, 760);
    c.globalAlpha = boot * 0.35;
    for (let i = 0; i < 6; i++) { c.strokeStyle = i % 2 ? '#ffe3b3' : '#bff0ea'; c.lineWidth = 3 + i; c.beginPath(); c.moveTo(-40, 520 - i * 46); c.bezierCurveTo(w * 0.3, 380 - i * 70, w * 0.7, 700 - i * 40, w + 40, 430 - i * 60); c.stroke(); }
    c.globalAlpha = boot;
    c.fillStyle = '#f4efe6'; c.font = `800 62px ${SANS}`; c.textBaseline = 'alphabetic'; c.fillText('Farxiga', 36, 250);
    c.fillStyle = 'rgba(244,239,230,0.9)'; roundRect(c, 36, 290, w - 110, 22, 11); c.fill(); roundRect(c, 36, 326, w - 170, 22, 11); c.fill();
    c.fillStyle = GOLD; roundRect(c, 36, 400, 200, 60, 30); c.fill();
    c.fillStyle = 'rgba(244,239,230,0.5)'; roundRect(c, 254, 400, 150, 60, 30); c.fill();
    // Three feature tiles
    for (let i = 0; i < 3; i++) {
      const y = 800 + i * 190;
      c.fillStyle = '#f7f3ec'; roundRect(c, 28, y, w - 56, 166, 20); c.fill();
      c.fillStyle = i === 1 ? '#d99a4a' : '#1f7a77'; c.beginPath(); c.arc(92, y + 83, 40, 0, 7); c.fill();
      c.fillStyle = '#2b3a3a'; roundRect(c, 156, y + 50, 220, 18, 9); c.fill();
      c.fillStyle = '#8a9696'; roundRect(c, 156, y + 84, w - 220, 12, 6); c.fill(); roundRect(c, 156, y + 106, w - 260, 12, 6); c.fill();
    }
    // Long text and an image block
    for (let i = 0; i < 9; i++) { c.fillStyle = '#7d8a89'; roundRect(c, 36, 1400 + i * 30, (w - 72) * (0.7 + rnd(i, 5) * 0.3), 12, 6); c.fill(); }
    const ig = c.createLinearGradient(0, 1700, w, 2000); ig.addColorStop(0, '#2c6e6c'); ig.addColorStop(1, '#e2b06a');
    c.fillStyle = ig; roundRect(c, 28, 1700, w - 56, 300, 22); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(w * 0.7, 1820, 70, 0, 7); c.fill();
    for (let i = 0; i < 5; i++) { c.fillStyle = '#7d8a89'; roundRect(c, 36, 2040 + i * 30, (w - 72) * (0.6 + rnd(i, 9) * 0.4), 12, 6); c.fill(); }
    c.fillStyle = '#163235'; c.fillRect(0, 2220, w, 400);
    c.restore();
    // Status bar stays fixed at the top
    c.fillStyle = 'rgba(5,20,22,0.35)'; c.fillRect(0, 0, w, 44);
    c.fillStyle = '#f4efe6'; roundRect(c, 24, 15, 54, 14, 7); c.fill(); roundRect(c, w - 70, 15, 46, 14, 7); c.fill();
    c.globalAlpha = 1;
  }
  let uiKey = '';
  function drawUI(t) {
    const boot = eo(k(t, 0.4, 1.0)), sc = Math.round(scrollAt(t));
    const key = Math.round(boot * 30) + '|' + sc;
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => drawPage(c, w, h, sc, boot));
  }

  // The pinned panel: its own layer over the bottom of the screen, so it can lift off the glass.
  const PINH = sh * 0.215;
  const pinTex = canvasTex(512, Math.round(512 * PINH / (sw - 0.001)), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f7f2e9';
    c.beginPath(); c.moveTo(0, 18); c.arcTo(0, 0, 18, 0, 18); c.lineTo(w - 18, 0); c.arcTo(w, 0, w, 18, 18);
    c.lineTo(w, h - 40); c.arcTo(w, h, w - 40, h, 40); c.lineTo(40, h); c.arcTo(0, h, 0, h - 40, 40); c.closePath(); c.fill();
    c.fillStyle = TEAL; c.fillRect(0, 0, w, 7);
    c.fillStyle = 'rgba(31,138,143,0.18)'; roundRect(c, w / 2 - 36, 16, 72, 8, 4); c.fill();
    c.fillStyle = TEAL; c.beginPath(); c.arc(54, 62, 22, 0, 7); c.fill();
    c.fillStyle = '#f7f2e9'; c.fillRect(51, 50, 6, 6); c.fillRect(51, 60, 6, 16);
    c.fillStyle = '#25393a'; roundRect(c, 92, 52, 220, 18, 9); c.fill();
    for (let i = 0; i < 4; i++) { c.fillStyle = '#7d8a89'; roundRect(c, 32, 100 + i * 24, (w - 64) * (0.75 + rnd(i, 13) * 0.25), 10, 5); c.fill(); }
  }).tex;
  const pin = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.001, PINH), new THREE.MeshBasicMaterial({ map: pinTex, color: 0xd9d9d9, transparent: true, toneMapped: false, depthWrite: false }));
  pin.renderOrder = 2; tab.add(pin);
  const pinGlow = glow(TEAL_HEX, 1, 0, 0.45); pinGlow.scale.set(sw * 1.5, PINH * 2.2, 1); tab.add(pinGlow);
  const pinEdge = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.008, 0.0014), new THREE.MeshBasicMaterial({ color: 0x5fe0d6, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  pinEdge.renderOrder = 3; tab.add(pinEdge);

  // ----------------------------------------------------------- the approval ring and the words
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.0026, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffd48a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(ring);
  const halo = glow(GOLD_HEX, 1, 0, 0.5); halo.scale.set(0.5, 0.6, 1); scene.add(halo);
  const title = label('Farxiga landing pages', { font: `800 64px ${SANS}`, fg: '#f3eee4', h: 0.13, pad: 12, track: 1 });
  const client = label('AstraZeneca', { font: `700 56px ${MONO}`, fg: GOLD, h: 0.08, pad: 8, track: 3 });
  const line = label('Campaign landing experience in a regulated category.', { font: `600 44px ${SANS}`, fg: '#b9cfcb', h: 0.066, pad: 8, track: 0 });
  scene.add(title, client, line);
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width, LWd = line.geometry.parameters.width;

  // ----------------------------------------------------------- dust in the shaft
  const DN = 150, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd3a0, size: 0.012, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- choreography
  // The doctor: shows the tablet, steps in to hand it over, nods, turns, and walks out through the door.
  const S0 = V(0.56, 0, 0.2), FACE0 = Math.atan2(-1, 0.3);
  const S1 = S0.clone().addScaledVector(fwdOf(FACE0), 0.13);
  const D1 = V(1.6, 0, -1.55), D2 = V(1.63, 0, -3.6);
  const SEG1 = D1.clone().sub(S1), L1 = SEG1.length(), SEG2 = D2.clone().sub(D1), L2 = SEG2.length();
  const H1 = near(Math.atan2(SEG1.x, SEG1.z), FACE0 - 2.4), H2 = near(Math.atan2(SEG2.x, SEG2.z), H1);
  const T_TURN = 2.5, T_WALK = 2.95, VEL = 1.5, STRIDE = 1.3, AMP = STRIDE / (2 * Math.PI);
  const sWalk = (t) => { const u = Math.max(0, t - T_WALK); return VEL * (u - 0.32 * (1 - Math.exp(-u / 0.32))); };
  const onPath = (s, out) => (s < L1 ? out.copy(S1).addScaledVector(SEG1, s / L1) : out.copy(D1).addScaledVector(SEG2, Math.min(s - L1, L2) / L2));
  const headingAt = (s) => lerp(H1, H2, eio(k(s, L1 - 0.35, L1 + 0.35)));

  // The tablet's path: facing the doctor while it boots, turned around to show the patient, handed over,
  // then held in the patient's lap. Facing is yaw a and pitch p of the screen's normal.
  const LAP = toW(V(0, 0.79, 0.36));
  const lapN = V(0, 0.75, -0.66).applyAxisAngle(Y, PAT_YAW).normalize();
  const A_LAP = Math.atan2(lapN.x, lapN.z), P_LAP = Math.asin(lapN.y);
  const SHOW = V(0.3, 1.14, 0.26), HAND = V(0.07, 1.0, 0.28);
  const tabAt = (t, out) => {
    const flip = eio(k(t, 1.0, 1.45)), give = eio(k(t, 1.4, 1.95)), lap = eio(k(t, 2.0, 2.8));
    let a = lerp(1.45, -1.25, flip), pch = lerp(0.32, 0.12, flip);
    a = lerp(a, A_LAP, lap); pch = lerp(pch, P_LAP, lap);
    out.copy(SHOW).lerp(HAND, give).lerp(LAP, lap);
    out.y += Math.sin(t * 1.4) * 0.004 * (1 - lap) + Math.sin(t * 0.9) * 0.002 * lap;
    return [a, pch];
  };
  const tN = V(0, 0, 0), tP = V(0, 0, 0);
  const poseTab = (t) => {
    const [a, pch] = tabAt(t, tP);
    tab.position.copy(tP);
    tN.set(Math.sin(a) * Math.cos(pch), Math.sin(pch), Math.cos(a) * Math.cos(pch));
    tab.lookAt(tP.x + tN.x, tP.y + tN.y, tP.z + tN.z);
    tab.updateMatrixWorld();
  };
  // Which side of the tablet each of the patient's hands takes, settled once from the lap pose.
  poseTab(4);
  const PAT_SIDE = [-1, 1].map((sg) => {
    const sh = toW(V(sg * 0.19, 1.0, 0)), gl = tab.localToWorld(V(-1 * (TW / 2 + 0.02), -TH * 0.2, -0.01)), gr = tab.localToWorld(V(TW / 2 + 0.02, -TH * 0.2, -0.01));
    return sh.distanceTo(gl) < sh.distanceTo(gr) ? -1 : 1;
  });

  const PAT_HEAD = toW(V(0, 1.24, 0.03));
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), docF = V(0, 0, 0), docS = V(0, 0, 0), docHip = V(0, 0, 0), docRoot = V(0, 0, 0), lookAtP = V(0, 0, 0);
  const patHip = toW(V(0, 0.53, -0.02)), patF = fwdOf(PAT_YAW), patS = sideOf(PAT_YAW);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.32, 1.52, 4.35]], [2.2, [0.22, 1.36, 3.05]],
    [3.7, [-0.02, 1.45, 3.0]], [5.15, [0.05, 1.46, 2.9], L], [6.0, [-0.25, 1.37, 0.56]],
    [6.95, [-0.27, 1.38, 0.6], L], [8.0, [0.56, 1.3, 2.95]],
    [10, [0.6, 1.3, 3.08], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.05, 1.0, 0]], [2.2, [0.06, 1.0, 0.1]],
    [3.7, [0.7, 1.05, -0.9]], [5.15, [1.05, 1.1, -1.7], L], [6.0, [LAP.x, LAP.y + 0.02, LAP.z]],
    [6.95, [LAP.x, LAP.y + 0.02, LAP.z], L], [8.0, [0.2, 1.0, 0]],
    [10, [0.22, 1.0, 0], L],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 33], [2.2, 31], [3.7, 32], [5.15, 32], [6.0, 30], [6.95, 30], [8.0, 32.5], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // First light: the window brightens and the shaft fills in.
    const dawn = eo(k(t, 0.05, 1.6));
    sun.intensity = 2.5 * dawn;
    shaft.material.opacity = 0.2 * dawn * (0.9 + 0.1 * Math.sin(t * 1.3));
    pool.material.opacity = 0.42 * dawn;
    winGlow.material.opacity = 0.5 * dawn;
    win.material.color.copy(WIN_COL).multiplyScalar(lerp(0.25, 1, dawn));
    dust.material.opacity = 0.6 * dawn;

    // The tablet and its screen.
    poseTab(t);
    const boot = eo(k(t, 0.4, 1.0));
    tab.userData.screen.material.color.setScalar(lerp(0.03, 0.8, boot));
    screenGlow.material.opacity = 0.16 * boot;
    tab.userData.sheen.position.x = Math.sin(t * 0.5) * 0.01;
    drawUI(t);
    const scrolling = Math.sin(Math.PI * k(t, 5.95, 6.9)), back2 = Math.sin(Math.PI * k(t, 7.0, 7.65));
    const liftP = Math.max(eio(k(t, 5.9, 6.3)) * (1 - eio(k(t, 7.0, 7.5))), 0);
    pin.position.set(0, -sh / 2 + PINH / 2 + 0.0006, pd / 2 + 0.0016 + liftP * 0.012);
    pin.material.opacity = boot;
    pin.scale.setScalar(1 + liftP * 0.03);
    pinEdge.position.set(0, pin.position.y + PINH / 2 * pin.scale.y - 0.001, pin.position.z + 0.0003);
    pinEdge.material.opacity = 0.9 * Math.max(scrolling, back2) * boot;
    pinGlow.position.set(0, pin.position.y, pin.position.z - 0.004);
    pinGlow.material.opacity = 0.35 * liftP * boot;

    // ---- The doctor.
    const step = eio(k(t, 1.35, 1.9)), turn = eio(k(t, T_TURN, T_WALK)), s = sWalk(t), w = clamp(s / 0.45);
    let yaw = FACE0;
    if (t < T_WALK) { docRoot.copy(S0).lerp(S1, step); yaw = lerp(FACE0, H1, turn); }
    else { onPath(s, docRoot); yaw = lerp(H1, headingAt(s), 1); }
    fwdOf(yaw, docF); sideOf(yaw, docS);
    const phase = (s / STRIDE) * Math.PI * 2;
    const bob = 0.016 * Math.cos(phase * 2) * w;
    docHip.copy(docRoot).setY(0.93 + bob - 0.012 * step * (1 - step) * 4);
    const nod = 0.35 * Math.sin(Math.PI * k(t, 2.1, 2.5));
    if (t < 1.0) lookAtP.copy(tab.position);
    else if (t < T_TURN) lookAtP.copy(PAT_HEAD).lerp(tab.position, 0.15 * (1 - k(t, 2.0, 2.4)));
    else { onPath(s + 1.5, lookAtP); lookAtP.y = 1.5; if (t < T_WALK) lookAtP.lerp(PAT_HEAD, 1 - turn); }
    doc.pose({
      hip: docHip, yaw, lean: 0.05 + 0.08 * Math.sin(Math.PI * k(t, 1.4, 2.2)) + 0.05 * w,
      look: lookAtP, nod,
      feet: (i, out) => {
        const sg = i ? 1 : -1;
        if (t < T_TURN) {
          const st = eio(k(t, 1.33 + i * 0.25, 1.65 + i * 0.25));
          out.copy(S0).lerp(S1, st).addScaledVector(sideOf(FACE0, tmp2), sg * 0.1); out.y = 0.085 + 0.06 * Math.sin(Math.PI * st);
        } else if (t < T_WALK) {
          out.copy(S1).addScaledVector(docS, sg * 0.1); out.y = 0.085 + 0.055 * Math.sin(Math.PI * k(t, T_TURN + 0.02 + i * 0.22, T_TURN + 0.26 + i * 0.22));
        } else {
          const ph = phase + i * Math.PI;
          out.copy(docRoot).addScaledVector(docS, sg * 0.1).addScaledVector(docF, AMP * Math.sin(ph) * w);
          out.y = 0.085 + 0.1 * Math.max(0, Math.cos(ph)) * w;
        }
      },
      hands: (i, shp, out) => {
        const sg = i ? 1 : -1;
        const swing = -Math.sin(phase + i * Math.PI) * w;
        tmp.copy(shp).add(tmp2.set(0, -0.52, 0)).addScaledVector(docF, 0.06 + 0.17 * swing).addScaledVector(docS, sg * 0.05);
        if (i === 1) {
          // The holding hand cups the bottom edge of the tablet until the patient has it.
          const hold = 1 - eio(k(t, 2.05, 2.5));
          out.copy(tab.localToWorld(tmp2.set(0, -TH / 2 - 0.02, -0.012))).lerp(tmp, 1 - hold);
        } else out.copy(tmp);
      },
    });
    const gone = docRoot.z < -3.15;
    doc.setVisible(!gone); [skirt, vneck, stetho, chestPiece, badge].forEach((m) => { m.visible = !gone; });

    // ---- The patient.
    const reach = eio(k(t, 1.5, 1.95));
    doc.headPos && lookAtP.copy(doc.headPos);
    if (t > 1.45) lookAtP.lerp(tab.position, eio(k(t, 1.45, 2.2)));
    pat.pose({
      hip: patHip, yaw: PAT_YAW, lean: -0.06 + 0.24 * reach * (1 - 0.4 * k(t, 2.1, 2.8)),
      look: lookAtP, kneePole: tmp2.copy(patF).add(Y),
      feet: (i, out) => { toW(V((i ? 1 : -1) * 0.12, 0.085, 0.46), out); },
      hands: (i, shp, out) => {
        const sg = i ? 1 : -1;
        toW(V(sg * 0.14, 0.63, 0.26), tmp);
        const side = PAT_SIDE[i];
        tab.localToWorld(out.set(side * (TW / 2 + 0.02), -TH * 0.2, -0.012));
        out.lerp(tmp, 1 - reach);
        out.y += Math.sin(t * 1.1 + i) * 0.002 * (1 - reach);
      },
    });

    // ---- Approval: a gold ring pulses out from the tablet.
    const r = k(t, APPROVE, APPROVE + 1.1);
    ring.position.copy(tab.position); ring.lookAt(camera.position);
    ring.scale.setScalar(lerp(1.15, 1.9, eo(r)));
    ring.material.opacity = 0.9 * Math.sin(Math.PI * r) * (r > 0 ? 1 : 0);
    halo.position.copy(tab.position).addScaledVector(tN, -0.02);
    halo.material.opacity = 0.32 * Math.exp(-2.5 * Math.max(0, t - APPROVE)) * (t > APPROVE ? 1 : 0) + 0.08 * k(t, APPROVE, APPROVE + 1) * (1 - k(t, 9.2, 9.6));

    // ---- The project's name settles where the doctor stood.
    const ci = back(k(t, 7.75, 8.3)), ti = back(k(t, 7.9, 8.45)), li = eo(k(t, 8.15, 8.75)), out = ei(k(t, 9.2, 9.6));
    const tx = 0.95, tz = 0.4;
    title.position.set(tx, 1.36 + (1 - clamp(ti)) * -0.05, tz);
    title.lookAt(camera.position.x, title.position.y, camera.position.z);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(tx - TWd / 2 + CWd / 2 + 0.01, 1.5 + (1 - clamp(ci)) * -0.04, tz);
    client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;
    line.position.set(tx - TWd / 2 + LWd / 2 + 0.01, 1.255 + (1 - li) * -0.025, tz);
    line.quaternion.copy(title.quaternion);
    line.material.opacity = li * (1 - out); line.visible = line.material.opacity > 0.01;

    // Dust turning in the shaft.
    for (let i = 0; i < DN; i++) {
      const sd = rnd(i, 61), off = 0.22;
      dpos[i * 3] = lerp(WIN.x, POOL.x, sd) + (rnd(i, 62) - 0.5) * off * 2 + Math.sin(t * 0.3 + i) * 0.05;
      dpos[i * 3 + 1] = lerp(WIN.y, 0.05, sd) + Math.sin(t * 0.4 + i * 1.3) * 0.04 + (rnd(i, 63) - 0.5) * 0.2;
      dpos[i * 3 + 2] = lerp(WIN.z, POOL.z, sd) + (rnd(i, 64) - 0.5) * off + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.9 };
}
