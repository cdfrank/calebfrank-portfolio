// BASF Agriculture Canada website lit loop, 10 s. "A style guide, a library and docs in one month."
// A small studio on a winter evening: snow drifts past the window over a blue prairie, a brass desk lamp
// pools warm light on a birch desk. On the wall, a four-week rail fills with light, week by week. A
// designer in a knit toque types at a laptop and the work lands on the desk as each week closes: a fan of
// colour swatches spreads beside an Aa type card (STYLE GUIDE), components drop one by one into a tray
// (LIBRARY), pages fly out of the laptop into a binder that snaps shut (DOCS). In the last week the designer
// picks up a rubber stamp, winds up and brings it down on the binder: DELIVERED, in red, and the rail is
// full. The project's name settles over the wall.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const NAVY = '#00305e', BLUE = '#21a0d2', GREEN = '#65ac1e', GREEN_H = 0x65ac1e, RED = '#d6322a', RED_H = 0xd6322a;
const TOP = 0.74;                                 // desk height
const WEEK = (i) => [0.5 + i * 1.55, 0.5 + (i + 1) * 1.55];   // the rail fills week by week, done at 6.7
const SLAM = 6.62;
const LAP = new THREE.Vector3(-0.15, TOP, -0.48);
const FAN = new THREE.Vector3(-0.56, TOP, -0.42), AA = new THREE.Vector3(-0.5, TOP, -0.7);
const TRAY = new THREE.Vector3(0.62, TOP, -0.6), BIND = new THREE.Vector3(0.32, TOP, -0.27), STAMP0 = new THREE.Vector3(0.11, TOP, -0.16);
const BW = 0.22, BL = 0.29;                       // binder width (x) and length (z)
const RAIL = new THREE.Vector3(0, 1.32, -0.885), PLW = 1.5, PLH = 0.44;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const SW_COLS = [0x00305e, 0x004a96, 0x21a0d2, 0x65ac1e, 0x2d7a2e, 0xf39500, 0xd6322a];

const fwdOf = (yaw, out = V(0, 0, 0)) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = V(0, 0, 0)) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// Stylized person from capsules, posed in world space every frame (adapted from the consult-room loop).
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

// Outside the window: the prairie under snow at blue hour, a tree line and a farm's lit windows.
function drawPrairie(c, w, h) {
  const HZ = h * 0.6;
  const sky = c.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#0f1d3a'); sky.addColorStop(0.65, '#2d4a78'); sky.addColorStop(1, '#8aa4c8');
  c.fillStyle = sky; c.fillRect(0, 0, w, HZ);
  const snow = c.createLinearGradient(0, HZ, 0, h); snow.addColorStop(0, '#6f86a8'); snow.addColorStop(1, '#41557a');
  c.fillStyle = snow; c.fillRect(0, HZ, w, h - HZ);
  c.fillStyle = '#16213a';
  for (let i = 0; i < 70; i++) { const x = rnd(i, 3) * w, th = 8 + rnd(i, 4) * 22; c.beginPath(); c.moveTo(x, HZ - th); c.lineTo(x - th * 0.3, HZ + 2); c.lineTo(x + th * 0.3, HZ + 2); c.closePath(); c.fill(); }
  c.fillRect(0, HZ - 3, w, 5);
  c.fillStyle = '#1b2438'; c.fillRect(w * 0.62, HZ - 26, 44, 28); c.beginPath(); c.moveTo(w * 0.62 - 4, HZ - 26); c.lineTo(w * 0.62 + 22, HZ - 42); c.lineTo(w * 0.62 + 48, HZ - 26); c.fill();
  c.fillStyle = '#ffc070'; c.fillRect(w * 0.62 + 8, HZ - 18, 7, 7); c.fillRect(w * 0.62 + 28, HZ - 18, 7, 7);
  for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(200,220,255,${0.06 + rnd(i, 9) * 0.08})`; c.fillRect(0, HZ + rnd(i, 8) * (h - HZ), w, 1.5); }
}

// The wall plate: the header, the empty track of each week, and its label.
function drawPlate(c, w, h) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = 'rgba(14,20,30,0.92)'; roundRect(c, 0, 0, w, h, 26); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.1)'; c.lineWidth = 3; roundRect(c, 4, 4, w - 8, h - 8, 22); c.stroke();
  c.font = `700 46px ${MONO}`; c.textBaseline = 'middle'; c.fillStyle = '#cfe0f2';
  if ('letterSpacing' in c) c.letterSpacing = '4px';
  c.fillText('ONE-MONTH DESIGN WINDOW', 48, 66);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  const x0 = 48, tw = (w - 96) / 4;
  for (let i = 0; i < 4; i++) {
    c.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(c, x0 + i * tw + 6, 128, tw - 12, 40, 20); c.fill();
    c.font = `700 36px ${MONO}`; c.fillStyle = '#8d9bb0'; c.fillText(`WEEK ${i + 1}`, x0 + i * tw + 10, 216);
  }
}

// The Aa card from the style guide: a type specimen over a row of swatches.
function drawAa(c, w, h) {
  c.fillStyle = '#efe9df'; c.fillRect(0, 0, w, h);
  c.fillStyle = NAVY; c.font = `800 190px ${SANS}`; c.textBaseline = 'alphabetic'; c.fillText('Aa', 30, 220);
  [[64, 30], [44, 22], [32, 16]].forEach(([y, hh], i) => { c.fillStyle = i ? '#7d8796' : '#1c2a3c'; roundRect(c, 34, 250 + i * 46, 300 - i * 60, hh * 0.6, hh * 0.3); c.fill(); });
  const cols = ['#00305e', '#21a0d2', '#65ac1e', '#f39500', '#d6322a'];
  cols.forEach((col, i) => { c.fillStyle = col; roundRect(c, 30 + i * 74, h - 92, 62, 62, 10); c.fill(); });
}

// The binder's cover and the imprint the stamp leaves on it.
function drawCover(c, w, h) {
  c.fillStyle = NAVY; c.fillRect(0, 0, w, h);
  c.fillStyle = GREEN; c.fillRect(0, h * 0.86, w, h * 0.05);
  c.fillStyle = '#e8eef5'; c.font = `800 96px ${SANS}`; c.textBaseline = 'alphabetic'; c.fillText('DOCS', 34, 140);
  c.fillStyle = 'rgba(232,238,245,0.45)'; roundRect(c, 36, 168, w * 0.5, 14, 7); c.fill(); roundRect(c, 36, 196, w * 0.38, 14, 7); c.fill();
}
function drawImprint(c, w, h) {
  c.clearRect(0, 0, w, h);
  c.save(); c.translate(w / 2, h / 2); c.rotate(-0.12);
  c.strokeStyle = RED; c.lineWidth = 12; roundRect(c, -w * 0.42, -h * 0.3, w * 0.84, h * 0.6, 16); c.stroke();
  c.lineWidth = 4; roundRect(c, -w * 0.42 + 16, -h * 0.3 + 16, w * 0.84 - 32, h * 0.6 - 32, 8); c.stroke();
  c.fillStyle = RED; c.font = `900 68px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = '4px';
  c.fillText('DELIVERED', 0, 4);
  c.restore();
  // Ink texture: knock a speckle out of the print.
  c.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(0,0,0,${0.3 + rnd(i, 4) * 0.6})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 2 + rnd(i, 7) * 3, 2); }
  c.globalCompositeOperation = 'source-over';
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);
  scene.fog = new THREE.Fog(0x0e1626, 4, 10);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.04, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the room
  const floor = mesh(new THREE.PlaneGeometry(10, 10), std(0xffffff, { map: grainTex('#3a2c22', { size: 256, speck: 0.12, blot: 0.12, seed: 9, repeat: 5 }), roughness: 0.55, metalness: 0.05 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const plaster = std(0xffffff, { map: grainTex('#56606e', { size: 256, speck: 0.05, blot: 0.1, seed: 13, repeat: 3 }), roughness: 0.95 });
  const backWall = mesh(new THREE.PlaneGeometry(6, 4), plaster, { cast: false }); backWall.position.set(0.5, 2, -0.9); scene.add(backWall);
  // Left wall with a wide window.
  const WX = -1.15, W0 = -0.75, W1 = 0.75, WB = 0.95, WT = 2.15;
  [[-1, W0, 0, 4], [W1, 3, 0, 4], [W0, W1, 0, WB], [W0, W1, WT, 4]].forEach(([z0, z1, y0, y1]) => {
    const m = mesh(new THREE.PlaneGeometry(z1 - z0, y1 - y0), plaster, { cast: false });
    m.rotation.y = Math.PI / 2; m.position.set(WX, (y0 + y1) / 2, (z0 + z1) / 2); scene.add(m);
  });
  const outTex = canvasTex(1024, 512, drawPrairie);
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 2.75), new THREE.MeshBasicMaterial({ map: outTex.tex, color: 0xb8c4d8, fog: false }));
  outside.rotation.y = Math.PI / 2; outside.position.set(WX - 2.2, 1.45, 0); scene.add(outside);
  const frameM = std(0xe0d8cc, { roughness: 0.6 });
  const mull = mesh(mergeGeometries([
    new THREE.BoxGeometry(0.06, WT - WB, 0.05).translate(0, (WB + WT) / 2, 0),
    new THREE.BoxGeometry(0.05, 0.05, W1 - W0).translate(0, WB + 0.68, 0),
    new THREE.BoxGeometry(0.16, 0.035, W1 - W0 + 0.1).translate(0.05, WB, 0),
    new THREE.BoxGeometry(0.08, 0.06, W1 - W0).translate(0, WT, 0),
    new THREE.BoxGeometry(0.08, WT - WB, 0.06).translate(0, (WB + WT) / 2, W0),
    new THREE.BoxGeometry(0.08, WT - WB, 0.06).translate(0, (WB + WT) / 2, W1),
  ]), frameM);
  mull.position.x = WX; scene.add(mull);
  const winGlow = glow(0x8fb0e8, 1, 0.22, 0.55); winGlow.position.set(WX + 0.05, 1.5, 0); winGlow.scale.set(2, 1.6, 1); scene.add(winGlow);
  // Snow falling past the window.
  const SN = 240, spos = new Float32Array(SN * 3);
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const snow = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xdbe6ff, size: 0.018, transparent: true, opacity: 0.85, depthWrite: false, fog: false }));
  snow.frustumCulled = false; scene.add(snow);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x7088b4, 0x1a1410, 0.3));
  const moon = new THREE.DirectionalLight(0x8fb4ff, 1.5); moon.position.set(-3, 2.4, 0.3); moon.target.position.set(0, 0.8, -0.3); scene.add(moon, moon.target);
  const LAMP = V(0.72, 1.22, -0.62);
  const key = new THREE.SpotLight(0xffcf98, 0, 0, 0.85, 0.7, 1.3);
  key.position.copy(LAMP).add(V(-0.04, -0.04, 0.04)); key.target.position.set(0.12, TOP, -0.35);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  key.shadow.camera.near = 0.2; key.shadow.camera.far = 3;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xb8d0ff, 0.6); rim.position.set(1.5, 1.8, -2); scene.add(rim);
  const screenL = new THREE.PointLight(0xa8c8ff, 0, 1.2, 1.6); screenL.position.set(LAP.x, TOP + 0.2, LAP.z + 0.05); scene.add(screenL);

  // ----------------------------------------------------------- desk, chair, lamp
  const birch = std(0xffffff, { map: grainTex('#a8885e', { size: 256, speck: 0.08, blot: 0.12, seed: 21, repeat: 2 }), roughness: 0.48 });
  const desk = mesh(new RoundedBoxGeometry(1.6, 0.04, 0.74, 3, 0.012), birch); desk.position.set(0.05, TOP - 0.02, -0.46); scene.add(desk);
  const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x1e2126, { metalness: 0.7, roughness: 0.4 }), 4);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = V(0, 0, 0), s4 = V(1, 1, 1), e4 = new THREE.Euler();
  [[-0.7, -0.14], [0.8, -0.14], [-0.7, -0.78], [0.8, -0.78]].forEach(([x, z], i) => { m4.compose(p4.set(x, (TOP - 0.04) / 2, z), q4.identity(), s4.set(0.035, TOP - 0.04, 0.035)); legs.setMatrixAt(i, m4); });
  legs.castShadow = true; scene.add(legs);
  const chairM = std(0x23262c, { roughness: 0.6, metalness: 0.3 });
  const chair = mesh(mergeGeometries([
    new THREE.BoxGeometry(0.44, 0.05, 0.42).translate(0, 0.45, 0),
    new THREE.BoxGeometry(0.42, 0.42, 0.04).translate(0, 0.76, 0.22).rotateX(0),
    new THREE.CylinderGeometry(0.025, 0.025, 0.36, 10).translate(0, 0.25, 0),
    new THREE.BoxGeometry(0.03, 0.3, 0.03).translate(0, 0.6, 0.21),
    ...[0, 1, 2, 3, 4].map((i) => new THREE.BoxGeometry(0.03, 0.025, 0.3).translate(0, 0.06, 0.15).rotateY((i / 5) * Math.PI * 2)),
  ]), chairM);
  chair.position.set(-0.15, 0, 0.2); scene.add(chair);
  // Brass desk lamp in the back right corner.
  const brass = std(0xb8904e, { metalness: 1, roughness: 0.3 });
  const lampBase = V(0.78, TOP, -0.74), elbow = V(0.86, TOP + 0.36, -0.7);
  const arm = (a, b) => { const d = b.clone().sub(a); return new THREE.CylinderGeometry(0.01, 0.01, d.length(), 8).applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(Y, d.normalize()), V(1, 1, 1))); };
  const lampArms = mesh(mergeGeometries([new THREE.CylinderGeometry(0.075, 0.085, 0.025, 28).translate(lampBase.x, TOP + 0.0125, lampBase.z), arm(lampBase, elbow), arm(elbow, LAMP)]), brass);
  scene.add(lampArms);
  const shade = mesh(new THREE.ConeGeometry(0.085, 0.13, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x2c4a3a, metalness: 0.5, roughness: 0.35, side: THREE.DoubleSide }), { cast: false });
  shade.position.copy(LAMP); shade.lookAt(key.target.position); shade.rotateX(-Math.PI / 2); scene.add(shade);
  const bulbGlow = glow(0xffc888, 0.42, 0, 0.45); bulbGlow.position.copy(LAMP).lerp(key.target.position, 0.08); scene.add(bulbGlow);

  // ----------------------------------------------------------- laptop
  const alu = std(0xa9adb4, { metalness: 0.9, roughness: 0.32 });
  const lapG = new THREE.Group(); lapG.position.copy(LAP); scene.add(lapG);
  const kbTex = canvasTex(512, 360, (c, w, h) => {
    c.fillStyle = '#9ea2a9'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#26282c';
    for (let r = 0; r < 5; r++) for (let i = 0; i < 13; i++) { roundRect(c, 30 + i * 35.5, 26 + r * 36, 30, 30, 5); c.fill(); }
    c.fillStyle = '#8a8e95'; roundRect(c, w * 0.32, 222, w * 0.36, 112, 10); c.fill();
  });
  const base = mesh(new RoundedBoxGeometry(0.34, 0.016, 0.24, 2, 0.006), alu); base.position.set(0, 0.008, 0.02); lapG.add(base);
  const kb = mesh(new THREE.PlaneGeometry(0.32, 0.225), std(0xffffff, { map: kbTex.tex, roughness: 0.5, metalness: 0.3 }), { cast: false });
  kb.rotation.x = -Math.PI / 2; kb.position.set(0, 0.0165, 0.025); lapG.add(kb);
  const hinge = new THREE.Group(); hinge.position.set(0, 0.016, -0.1); hinge.rotation.x = -0.22; lapG.add(hinge);
  const lid = mesh(new RoundedBoxGeometry(0.34, 0.23, 0.01, 2, 0.005), alu); lid.position.set(0, 0.115, -0.005); hinge.add(lid);
  const SCW = 0.316, SCH = 0.2;
  const ui = canvasTex(1024, Math.round((1024 * SCH) / SCW));
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(SCW, SCH), new THREE.MeshBasicMaterial({ map: ui.tex, toneMapped: false, color: 0xd6d6d6 }));
  scr.position.set(0, 0.117, 0.0006); hinge.add(scr);
  const scrGlow = glow(0x9fc4ff, 1, 0.22, 0.5); scrGlow.position.set(0, 0.12, 0.05); scrGlow.scale.set(0.6, 0.42, 1); hinge.add(scrGlow);
  // A design tool: layers on the left, the canvas showing whichever week's work is under way.
  function drawUI(c, w, h, s) {
    c.fillStyle = '#1b1f27'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#242a35'; c.fillRect(0, 0, w, 40); c.fillRect(0, 40, 170, h - 40);
    for (let i = 0; i < 9; i++) { c.fillStyle = i === s.week * 2 ? 'rgba(33,160,210,0.6)' : 'rgba(255,255,255,0.14)'; roundRect(c, 18, 64 + i * 44, 120 - (i % 3) * 18, 16, 8); c.fill(); }
    const X = 200, Wd = w - 230, Hy = 70, Hd = h - 100;
    c.fillStyle = '#e9e5de'; roundRect(c, X, Hy, Wd, Hd, 10); c.fill();
    const p = s.p;
    if (s.week === 0) {
      c.fillStyle = NAVY; c.font = `800 ${Math.round(150)}px ${SANS}`; c.textBaseline = 'alphabetic'; c.globalAlpha = clamp(p * 3); c.fillText('Aa', X + 40, Hy + 190); c.globalAlpha = 1;
      SW_COLS.forEach((col, i) => { if (p * 8 > i + 1) { c.fillStyle = '#' + col.toString(16).padStart(6, '0'); roundRect(c, X + 330 + (i % 4) * 100, Hy + 50 + Math.floor(i / 4) * 110, 84, 84, 12); c.fill(); } });
    } else if (s.week === 1) {
      for (let i = 0; i < 12; i++) if (p * 13 > i + 1) {
        const cx = X + 40 + (i % 4) * 190, cy = Hy + 50 + Math.floor(i / 4) * 120, kind = i % 4;
        c.fillStyle = [GREEN, BLUE, NAVY, '#9aa5b4'][kind];
        if (kind === 0) { roundRect(c, cx, cy, 150, 50, 25); c.fill(); }
        else if (kind === 1) { roundRect(c, cx, cy, 90, 46, 23); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(cx + 66, cy + 23, 17, 0, 7); c.fill(); }
        else if (kind === 2) { roundRect(c, cx, cy, 46, 46, 8); c.fill(); }
        else { c.strokeStyle = '#9aa5b4'; c.lineWidth = 4; roundRect(c, cx, cy, 160, 46, 8); c.stroke(); }
      }
    } else if (s.week === 2) {
      for (let i = 0; i < 3; i++) { const px = X + 40 + i * 250; c.fillStyle = '#fbfaf7'; roundRect(c, px, Hy + 30, 210, Hd - 60, 8); c.fill(); c.fillStyle = NAVY; roundRect(c, px + 20, Hy + 56, 120, 16, 8); c.fill(); for (let j = 0; j < 8; j++) if (p * 26 > i * 8 + j) { c.fillStyle = '#9aa5b4'; roundRect(c, px + 20, Hy + 92 + j * 26, 170 - (j % 3) * 30, 10, 5); c.fill(); } }
    } else {
      [[NAVY, 'Aa'], [GREEN, ''], [BLUE, '']].forEach(([col], i) => { c.fillStyle = col; roundRect(c, X + 40 + i * 250, Hy + 60, 210, 210, 18); c.fill(); });
      c.fillStyle = '#e9e5de'; c.font = `800 110px ${SANS}`; c.fillText('Aa', X + 68, Hy + 210);
    }
    if (s.caret) { c.fillStyle = BLUE; c.fillRect(X + Wd - 60, Hy + Hd - 50, 4, 30); }
  }
  let uiKey = '';

  // ----------------------------------------------------------- week rail on the wall
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(PLW, PLH), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 300, drawPlate).tex, transparent: true, toneMapped: false, color: 0xd8d8d8 }));
  plate.position.copy(RAIL); scene.add(plate);
  const TRK = (PLW * (1024 - 96)) / 1024 / 4, TRK0 = RAIL.x - PLW / 2 + (PLW * 48) / 1024, TRY = RAIL.y + PLH / 2 - (PLH * 148) / 300;
  const fillM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const fills = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.2), fillM, 4);
  for (let i = 0; i < 4; i++) fills.setColorAt(i, new THREE.Color(GREEN_H).multiplyScalar(1.4));
  scene.add(fills);
  const edge = glow(0xa8ff6a, 0.2, 0, 0.4); scene.add(edge);
  const ticks = [0, 1, 2, 3].map((i) => { const g = glow(GREEN_H, 0.12, 0, 0.4); g.position.set(TRK0 + (i + 1) * TRK - 0.03, TRY, RAIL.z + 0.03); scene.add(g); return g; });
  const railFlash = glow(0xffe0b0, 1, 0, 0.5); railFlash.position.set(RAIL.x, TRY, RAIL.z + 0.04); railFlash.scale.set(PLW * 1.3, 0.3, 1); scene.add(railFlash);

  // ----------------------------------------------------------- week 1: the style guide
  const chipG = new RoundedBoxGeometry(0.045, 0.004, 0.17, 2, 0.0018); chipG.translate(0, 0.002, -0.07);
  const chips = new THREE.InstancedMesh(chipG, std(0xffffff, { roughness: 0.45 }), SW_COLS.length);
  SW_COLS.forEach((c, i) => chips.setColorAt(i, new THREE.Color(c)));
  chips.castShadow = chips.receiveShadow = true; scene.add(chips);
  const rivet = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.034, 12), brass); rivet.position.copy(FAN).add(V(0, 0.016, 0)); scene.add(rivet);
  const aaTex = canvasTex(400, 480, drawAa).tex;
  const aaCard = mesh(new THREE.BoxGeometry(0.15, 0.18, 0.004), std(0xd8d2c6, { roughness: 0.7 }));
  const aaFace = mesh(new THREE.PlaneGeometry(0.146, 0.176), std(0xffffff, { map: aaTex, roughness: 0.6 }), { cast: false });
  aaFace.position.z = 0.0022; aaCard.add(aaFace);
  scene.add(aaCard);

  // ----------------------------------------------------------- week 2: the component library
  const trayParts = [new THREE.BoxGeometry(0.36, 0.008, 0.26).translate(0, 0.004, 0)];
  [[-0.176, 0, 0.008, 0.26], [0.176, 0, 0.008, 0.26], [0, -0.126, 0.36, 0.008], [0, 0.126, 0.36, 0.008]].forEach(([x, z, w, d]) => trayParts.push(new THREE.BoxGeometry(w, 0.022, d).translate(x, 0.011, z)));
  const tray = mesh(mergeGeometries(trayParts), std(0x2a2f38, { roughness: 0.5, metalness: 0.4 }));
  tray.position.copy(TRAY); tray.rotation.y = -0.18; scene.add(tray);
  const COMP = [[0.07, 0.016, 0.026, GREEN_H], [0.05, 0.016, 0.024, 0x21a0d2], [0.026, 0.014, 0.026, 0x00305e], [0.074, 0.01, 0.024, 0xc8ced8]];
  const comps = new THREE.InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 2, 0.3), std(0xffffff, { roughness: 0.35, metalness: 0.05 }), 12);
  for (let i = 0; i < 12; i++) comps.setColorAt(i, new THREE.Color(COMP[i % 4][3]));
  comps.castShadow = true; comps.receiveShadow = true; scene.add(comps);
  const compAt = (i, out) => out.set(-0.12 + (i % 4) * 0.08, 0.008, -0.075 + Math.floor(i / 4) * 0.075).applyAxisAngle(Y, -0.18).add(TRAY);
  const COMP_T = (i) => 2.2 + i * 0.105;

  // ----------------------------------------------------------- week 3: the docs binder
  const bindG = new THREE.Group(); bindG.position.copy(BIND); bindG.rotation.y = 0.12; scene.add(bindG);
  const coverMat = std(0x0f2742, { roughness: 0.55 });
  const backCover = mesh(new THREE.BoxGeometry(BW + 0.012, 0.004, BL + 0.01), coverMat); backCover.position.y = 0.002; bindG.add(backCover);
  const PN = 6;
  const pages = new THREE.InstancedMesh(new THREE.BoxGeometry(BW - 0.008, 0.0025, BL - 0.01), std(0xe2ddd3, { roughness: 0.9 }), PN);
  pages.castShadow = true; pages.receiveShadow = true; pages.frustumCulled = false; scene.add(pages);
  const hingeB = new THREE.Group(); hingeB.position.set(0, 0.026, -BL / 2 - 0.004); bindG.add(hingeB);
  const coverTex = canvasTex(380, 500, drawCover).tex;
  const cover = mesh(new THREE.BoxGeometry(BW + 0.012, 0.004, BL + 0.01), coverMat);
  cover.position.set(0, 0.002, BL / 2 + 0.004); hingeB.add(cover);
  const coverFace = mesh(new THREE.PlaneGeometry(BW + 0.008, BL + 0.006), std(0xffffff, { map: coverTex, roughness: 0.5 }), { cast: false });
  coverFace.rotation.x = -Math.PI / 2; coverFace.position.y = 0.0022; cover.add(coverFace);
  const imprint = new THREE.Mesh(new THREE.PlaneGeometry(BW * 0.95, BW * 0.95 * 0.55), new THREE.MeshBasicMaterial({ map: canvasTex(512, 282, drawImprint).tex, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  imprint.rotation.x = -Math.PI / 2; imprint.position.set(0, 0.0032, 0.03); cover.add(imprint);
  const inkGlow = glow(RED_H, 0.5, 0, 0.45); scene.add(inkGlow);
  const SRC = LAP.clone().add(V(0, 0.16, -0.1)); // where pages leave the screen
  const PAGE_T = (i) => 3.72 + i * 0.16, PAGE_FLY = 0.45, CLOSE = 4.88;
  const pageRest = (i, out) => out.set(0, 0.0055 + i * 0.0028, 0).applyAxisAngle(Y, 0.12).add(BIND);

  // ----------------------------------------------------------- the stamp
  const stampG = new THREE.Group(); scene.add(stampG);
  const wood = std(0x6b4127, { roughness: 0.5 });
  const handleG = mergeGeometries([
    new THREE.CylinderGeometry(0.018, 0.024, 0.06, 18).translate(0, 0.065, 0),
    new THREE.SphereGeometry(0.03, 20, 14).translate(0, 0.105, 0),
    new THREE.CylinderGeometry(0.045, 0.045, 0.026, 28).translate(0, 0.024, 0),
  ]);
  const handle = mesh(handleG, wood); stampG.add(handle);
  const rubber = mesh(new THREE.CylinderGeometry(0.043, 0.043, 0.012, 28), std(RED_H, { roughness: 0.75 })); rubber.position.y = 0.006; stampG.add(rubber);
  const KNOB = 0.105;

  // ----------------------------------------------------------- labels over the work
  const tag = (text, fg, bg) => { const l = label(text, { font: `700 54px ${MONO}`, fg, bg, h: 0.075, pad: 26, track: 4 }); l.material.fog = false; scene.add(l); return l; };
  const TAGS = [
    { l: tag('STYLE GUIDE', '#0e1420', '#e8e2d6'), at: V(-0.52, TOP + 0.27, -0.56), t: WEEK(0)[1] },
    { l: tag('LIBRARY', '#0e1420', '#e8e2d6'), at: V(0.62, TOP + 0.17, -0.6), t: WEEK(1)[1] },
    { l: tag('DOCS', '#0e1420', '#e8e2d6'), at: V(0.36, TOP + 0.19, -0.3), t: WEEK(2)[1], out: 5.95 },
  ];
  const delivered = label('DELIVERED', { font: `900 64px ${SANS}`, fg: '#fff6ee', bg: RED, h: 0.11, pad: 30, track: 5 });
  delivered.material.fog = false; scene.add(delivered);

  // ----------------------------------------------------------- the designer
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xd9a888, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const knit = std(0xb8462e, { roughness: 0.95 });
  const toque = std(0x1f3a5a, { roughness: 0.95 });
  const designer = makePerson(scene, { skin, top: knit, sleeve: knit, fore: knit, pants: std(0x2a3346, { roughness: 0.85 }), shoeM: std(0x3a2a1e, { roughness: 0.6 }), hairM: toque, hairCap: 0.56, chestR: 0.155 });
  const pom = mesh(new THREE.SphereGeometry(0.035, 14, 10), std(0xe8e2d8, { roughness: 1 })); scene.add(pom);
  const cuff = mesh(new THREE.TorusGeometry(0.1, 0.018, 8, 28), toque, { cast: false }); scene.add(cuff);
  const HIP0 = V(-0.15, 0.53, 0.16), YAW = Math.PI;

  // ----------------------------------------------------------- title
  const kicker = label('BASF Agriculture', { font: `700 56px ${MONO}`, fg: '#a8d4ff', h: 0.09, track: 5 });
  const title = label('Canada Agriculture website', { font: `800 64px ${SANS}`, fg: '#f4f1ea', h: 0.17, track: 1 });
  [kicker, title].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, KWd = kicker.geometry.parameters.width;

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.98, 1.42, 1.42]], [1.9, [0.64, 1.3, 0.98]],
    [3.4, [1.02, 1.28, 0.86]], [5.0, [1.0, 1.3, 0.92]],
    [6.7, [0.86, 1.28, 0.82]], [8.0, [0.32, 1.46, 1.78]], [10, [0.3, 1.47, 1.88], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.08, 1.06, -0.5]], [1.9, [-0.36, 0.98, -0.55]],
    [3.4, [0.34, 0.95, -0.5]], [5.0, [0.24, 0.93, -0.36]],
    [6.7, [0.22, 0.92, -0.3]], [8.0, [0.05, 1.24, -0.6]], [10, [0.05, 1.25, -0.6], L],
  ]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), look = V(0, 0, 0), hip = V(0, 0, 0), lk = V(0, 0, 0), hand = V(0, 0, 0);
  const KEY_TYPE = (i) => [LAP.x + (i ? -0.075 : 0.075), TOP + 0.05, LAP.z + 0.075];
  const ABOVE = [BIND.x, TOP + 0.03 + KNOB + 0.25, BIND.z];
  const PRESS = [BIND.x, TOP + 0.026 + 0.004 + KNOB, BIND.z];
  const GRAB = [STAMP0.x, TOP + KNOB, STAMP0.z];
  const handR = [
    [0, KEY_TYPE(0)], [5.4, KEY_TYPE(0)], [5.8, [GRAB[0], GRAB[1] + 0.03, GRAB[2]]], [5.95, GRAB],
    [6.3, ABOVE], [6.48, [ABOVE[0] - 0.01, ABOVE[1] + 0.04, ABOVE[2] + 0.01]], [SLAM, PRESS, ei],
    [6.86, PRESS], [7.2, [BIND.x - 0.05, TOP + KNOB + 0.12, BIND.z + 0.02]], [7.55, GRAB], [7.68, GRAB], [8.1, KEY_TYPE(0)], [10, KEY_TYPE(0)],
  ];

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.005, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [1.9, 34], [3.4, 34], [6.7, 33], [8.0, 37], [10, 37]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    // The slam shakes the camera for a beat.
    const shake = t > SLAM ? Math.exp(-14 * (t - SLAM)) : 0;
    camera.position.y += Math.sin(t * 90) * 0.006 * shake;

    const on = eo(k(t, 0.05, 0.7));
    key.intensity = 5.5 * on; bulbGlow.material.opacity = 0.75 * on;

    // ---- The rail fills week by week.
    let edgeX = TRK0, edgeOn = 0;
    for (let i = 0; i < 4; i++) {
      const [a, b] = WEEK(i), f = i < 3 ? k(t, a, b) : eio(k(t, a, SLAM));
      const w = Math.max(0.0005, f * (TRK - 0.012));
      m4.compose(p4.set(TRK0 + i * TRK + 0.006 + w / 2, TRY, RAIL.z + 0.012), q4.identity(), s4.set(w, 0.034, 0.012));
      fills.setMatrixAt(i, m4);
      if (f > 0 && f < 1) { edgeX = TRK0 + i * TRK + 0.006 + w; edgeOn = 1; }
      const done = i < 3 ? t > b : t > SLAM;
      const tb = i < 3 ? b : SLAM;
      ticks[i].material.opacity = done ? 0.5 + 0.5 * Math.exp(-4 * (t - tb)) : 0;
      ticks[i].scale.setScalar(0.08 + 0.12 * (done ? Math.exp(-4 * (t - tb)) : 0));
    }
    fills.instanceMatrix.needsUpdate = true;
    const fade = 1 - ei(k(t, 9.3, 9.6));
    fillM.color.setScalar(fade);
    edge.position.set(edgeX, TRY, RAIL.z + 0.025); edge.material.opacity = edgeOn * 0.9 * fade;
    railFlash.material.opacity = t > SLAM ? 0.5 * Math.exp(-3 * (t - SLAM)) : 0;

    // ---- Week 1: the swatch fan spreads; the Aa card stands up.
    SW_COLS.forEach((_, i) => {
      const o = back(k(t, 1.0 + i * 0.1, 1.45 + i * 0.1));
      const hop = Math.exp(-10 * Math.max(0, t - SLAM)) * (t > SLAM ? 1 : 0) * Math.sin((t - SLAM) * 30) * 0.004;
      m4.compose(p4.set(FAN.x, FAN.y + 0.004 * i + Math.abs(hop), FAN.z), q4.setFromEuler(e4.set(0, 0.55 - o * (0.95 - i * 0.32) - (1 - o) * 0.0, 0)), s4.set(1, 1, 1));
      chips.setMatrixAt(i, m4);
    });
    chips.instanceMatrix.needsUpdate = true;
    const aa = back(k(t, 1.65, 2.1));
    aaCard.position.set(AA.x, TOP + 0.088 * clamp(aa, 0, 1.2), AA.z);
    aaCard.rotation.set(-0.2 * clamp(aa, 0, 1.2) - (1 - clamp(aa)) * 1.37, 0.42, 0);
    aaCard.scale.setScalar(Math.max(0.001, lerp(0.4, 1, clamp(aa))));
    aaCard.visible = aa > 0.001;

    // ---- Week 2: components drop into the tray one by one.
    for (let i = 0; i < 12; i++) {
      const T0 = COMP_T(i), d = spring(k(t, T0, T0 + 0.42)), [w, h, dd] = COMP[i % 4];
      compAt(i, p4); p4.y += h / 2 + 0.16 * (1 - clamp(d, 0, 1.1));
      if (t > SLAM) p4.y += Math.abs(Math.sin((t - SLAM) * 28)) * Math.exp(-9 * (t - SLAM)) * 0.012;
      const vis = t > T0;
      m4.compose(p4, q4.setFromEuler(e4.set(0, -0.18 + (1 - clamp(d)) * 0.8, 0)), s4.set(vis ? w : 0.0001, vis ? h * lerp(1.4, 1, clamp(d)) : 0.0001, vis ? dd : 0.0001));
      comps.setMatrixAt(i, m4);
    }
    comps.instanceMatrix.needsUpdate = true;

    // ---- Week 3: pages fly out of the laptop into the binder, which snaps shut.
    for (let i = 0; i < PN; i++) {
      const f = k(t, PAGE_T(i), PAGE_T(i) + PAGE_FLY), ef = eio(f);
      pageRest(i, tmp);
      if (t > SLAM) tmp.y -= 0.004 * Math.exp(-10 * (t - SLAM)) * (1 - i / PN);
      p4.lerpVectors(SRC, tmp, ef); p4.y += Math.sin(Math.PI * ef) * 0.22;
      e4.set(lerp(-1.3, 0, ef), lerp(0, 0.12, ef) + Math.sin(Math.PI * ef) * 0.6, Math.sin(Math.PI * ef) * 0.4);
      const vis = f > 0;
      m4.compose(p4, q4.setFromEuler(e4), s4.setScalar(vis ? lerp(0.35, 1, eo(f)) : 0.0001));
      pages.setMatrixAt(i, m4);
    }
    pages.instanceMatrix.needsUpdate = true;
    const shut = spring(k(t, CLOSE, CLOSE + 0.42));
    hingeB.rotation.x = -2.75 * (1 - shut);
    const squash = t > SLAM ? Math.exp(-10 * (t - SLAM)) : 0;
    bindG.scale.set(1 + 0.04 * squash, 1 - 0.35 * squash, 1 + 0.04 * squash);
    const ink = eo(k(t, SLAM, SLAM + 0.06));
    imprint.material.opacity = 0.92 * ink; imprint.visible = ink > 0;
    inkGlow.position.copy(BIND).add(tmp.set(0, 0.06, 0)); inkGlow.material.opacity = t > SLAM ? 0.75 * Math.exp(-3.5 * (t - SLAM)) : 0;

    // ---- The laptop's screen follows the week.
    const wk = t < WEEK(0)[1] ? 0 : t < WEEK(1)[1] ? 1 : t < WEEK(2)[1] ? 2 : 3;
    const wp = wk < 3 ? k(t, WEEK(wk)[0], WEEK(wk)[1]) : 1;
    const caret = Math.floor(t * 2.2) % 2 === 0;
    const uk = wk + '|' + Math.round(wp * 30) + '|' + caret;
    if (uk !== uiKey) { uiKey = uk; ui.redraw((c, w, h) => drawUI(c, w, h, { week: wk, p: wp, caret })); }
    screenL.intensity = 0.6 * on;

    // ---- The stamp: picked up, raised, brought down on the binder, put back.
    const held = t > 5.95 && t < 7.62;
    hand.fromArray(kf(t, handR));
    if (held) stampG.position.set(hand.x, hand.y - KNOB, hand.z);
    else stampG.position.copy(STAMP0);
    stampG.rotation.set(held ? Math.sin(Math.PI * k(t, 5.95, 6.3)) * 0.18 - 0.08 * Math.sin(Math.PI * k(t, 6.3, SLAM)) : 0, 0.3, 0);
    stampG.scale.set(1, 1 - 0.12 * squash, 1);

    // ---- The designer: types through three weeks, then stamps.
    const typing = 1 - eio(k(t, 5.3, 5.6)) + eio(k(t, 7.9, 8.3));
    const stamping = clamp(Math.sin(Math.PI * k(t, 5.4, 7.9)) * 1.3);
    hip.copy(HIP0); hip.y += Math.sin(t * 1.6) * 0.003; hip.x += 0.03 * stamping;
    if (t < 5.4) {
      const wkLook = [V(FAN.x, TOP, FAN.z), V(TRAY.x, TOP, TRAY.z), V(BIND.x, TOP, BIND.z)][Math.min(wk, 2)];
      look.set(LAP.x, TOP + 0.13, LAP.z - 0.08);
      // A glance at the work as each week closes.
      for (let i = 0; i < 3; i++) { const g = Math.sin(Math.PI * k(t, WEEK(i)[1] - 0.25, WEEK(i)[1] + 0.5)); if (g > 0) look.lerp(tmp.copy([V(FAN.x, TOP, FAN.z), V(TRAY.x, TOP, TRAY.z), V(BIND.x, TOP, BIND.z)][i]), g); }
      if (wkLook && t < 0.8) look.lerp(tmp.set(RAIL.x, RAIL.y, RAIL.z), 0.6 * (1 - k(t, 0.4, 0.8)));
    } else look.set(BIND.x, TOP + 0.04, BIND.z);
    if (t > 7.5) look.lerp(tmp.set(RAIL.x + 0.2, RAIL.y, RAIL.z), eio(k(t, 7.5, 8.1)));
    const yaw = YAW - Math.atan2(look.x - hip.x, -(look.z - hip.z)) * 0.3;
    designer.pose({
      hip, yaw, lean: 0.2 + 0.12 * stamping + 0.08 * Math.sin(Math.PI * k(t, 6.25, SLAM + 0.15)), look,
      nod: 0.1 * Math.sin(Math.PI * k(t, SLAM - 0.05, SLAM + 0.3)) - 0.06 * k(t, 7.5, 8.1),
      kneePole: tmp2.set(0, 1, -1).normalize(),
      feet: (i, out) => out.set(HIP0.x + (i ? -0.13 : 0.13), 0.085, HIP0.z - 0.42 + (i ? 0.04 : 0)),
      hands: (i, shp, out) => {
        const tp = typing * (Math.abs(Math.sin(t * 17 + i * 1.9)) * 0.008 + Math.max(0, Math.sin(t * 5.3 + i * 2.3)) * 0.006);
        if (i === 0) { out.fromArray(kf(t, handR)); out.y += tp + (held ? 0 : 0.0); if (held) out.y += 0.02; }
        else { out.fromArray(KEY_TYPE(1)); out.y += tp; out.x += Math.sin(t * 0.9) * 0.01 * typing; }
      },
    });
    pom.position.copy(designer.headPos).add(tmp.set(0, 0.125, 0)).addScaledVector(designer.look, -0.04);
    cuff.position.copy(designer.headPos).add(tmp.set(0, 0.04, 0)).addScaledVector(designer.look, -0.012);
    cuff.quaternion.setFromUnitVectors(V(0, 0, 1), tmp2.copy(Y).addScaledVector(designer.look, -0.35).normalize());

    // ---- Labels as each piece lands; DELIVERED rises off the imprint.
    TAGS.forEach((g) => {
      const a = back(k(t, g.t, g.t + 0.4)), o = 1 - ei(k(t, g.out || 7.4, (g.out || 7.4) + 0.35));
      g.l.position.copy(g.at).add(tmp.set(0, (1 - clamp(a)) * -0.03, 0));
      g.l.lookAt(camera.position); g.l.scale.setScalar(Math.max(0.001, clamp(a, 0, 1.15)));
      g.l.material.opacity = clamp(a) * o; g.l.visible = g.l.material.opacity > 0.01;
    });
    const dv = back(k(t, SLAM + 0.15, SLAM + 0.6)), dOut = ei(k(t, 9.2, 9.58));
    delivered.position.set(BIND.x + 0.02, TOP + 0.08 + 0.2 * clamp(dv), BIND.z + 0.04);
    delivered.lookAt(camera.position); delivered.scale.setScalar(Math.max(0.001, clamp(dv, 0, 1.2)));
    delivered.material.opacity = clamp(dv) * (1 - dOut); delivered.visible = delivered.material.opacity > 0.01;

    // ---- The name over the wall.
    const ki = back(k(t, 7.7, 8.25)), ti = back(k(t, 7.85, 8.4)), out = ei(k(t, 9.2, 9.58));
    const tx = 0.05, ty = RAIL.y + PLH / 2 + 0.16, tz = RAIL.z + 0.08;
    lk.copy(camera.position); lk.y = ty;
    title.position.set(tx, ty + (1 - clamp(ti)) * -0.05, tz); title.lookAt(lk);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    kicker.position.set(tx - TWd / 2 + KWd / 2 + 0.01, ty + 0.13 + (1 - clamp(ki)) * -0.04, tz); kicker.quaternion.copy(title.quaternion);
    kicker.material.opacity = clamp(ki) * (1 - out); kicker.visible = kicker.material.opacity > 0.01;

    // Snow past the window.
    for (let i = 0; i < SN; i++) {
      const fall = 0.22 + rnd(i, 3) * 0.18, H = 1.9;
      spos[i * 3] = WX - 0.15 - rnd(i, 1) * 1.6;
      spos[i * 3 + 1] = 2.3 - ((t * fall + rnd(i, 2) * H) % H);
      spos[i * 3 + 2] = W0 - 0.2 + rnd(i, 4) * (W1 - W0 + 0.4) + Math.sin(t * 0.8 + i) * 0.04;
    }
    sGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.15 };
}
