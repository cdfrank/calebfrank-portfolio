// BASF Agriculture unified login lit loop, 10 s. "One sign-in opens all three doors."
// A concrete lobby at dawn: violet light in two tall slit windows, a low pink sun raking across a polished
// floor. Three sealed steel doors stand in the back wall, Crop, P&SS and Seed, each with its own login
// form hanging in front of it. A grower walks in and looks from one form to the next. The three forms
// slide together and fold into one sign-in, which drops onto a kiosk; the grower taps it once. Light runs
// across the floor from the kiosk to all three doors, each lock flips open in turn and the doors slide
// apart on green, amber and blue rooms. The grower walks toward the middle door as the title lights up
// on the wall.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const DOORS = [
  { name: 'CROP', x: -1.3, col: '#65ac1e', hex: 0x65ac1e },
  { name: 'P&SS', x: 0, col: '#f39500', hex: 0xf39500 },
  { name: 'SEED', x: 1.3, col: '#21a0d2', hex: 0x21a0d2 },
];
const WZ = -2.4, DW = 0.92, DH = 1.9;
const MERGE = [2.75, 3.5];                    // the three forms fold into one
const DOCK = [3.55, 4.1];                     // the sign-in drops onto the kiosk
const TAP = 4.55;                             // the grower taps it
const BEAM = (i) => 4.85 + i * 0.15;          // light leaves the kiosk for door i
const UNLOCK = (i) => BEAM(i) + 0.7;          // and reaches it
const OPEN = (i) => UNLOCK(i) + 0.1;          // the door starts to slide
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

const near = (a, ref) => { while (a - ref > Math.PI) a -= Math.PI * 2; while (a - ref < -Math.PI) a += Math.PI * 2; return a; };
const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));
// Distance along a path that eases in over ramp, cruises, and eases out over ramp.
function trap(t, t0, t1, L, ramp) {
  const T = t1 - t0, v = L / (T - ramp), u = clamp(t - t0, 0, T);
  if (u < ramp) return (v * u * u) / (2 * ramp);
  if (u > T - ramp) { const r = T - u; return L - (v * r * r) / (2 * ramp); }
  return (v * ramp) / 2 + v * (u - ramp);
}

// A stylized person built from capsules, placed in world space from a few inputs each frame (hip,
// facing, lean, ankle and wrist targets, look point), with two-bone reach for knees and elbows.
// Hand 0 is the person's right, hand 1 their left.
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
  const va = V(0, 0, 0), vb = V(0, 0, 0), vc = V(0, 0, 0), vd = V(0, 0, 0);
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, vd.subVectors(b, a).normalize()); };
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.min(dv.length(), l1 + l2 - 0.001); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0), lookD = V(0, 0, 0);
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
    lookD.subVectors(look, p.headPos); lookD.y = clamp(lookD.y / Math.max(0.01, Math.hypot(lookD.x, lookD.z)), -0.9, 0.5) * Math.hypot(lookD.x, lookD.z);
    lookD.normalize(); lookD.y -= nod; lookD.normalize();
    p.headPos.addScaledVector(lookD, 0.012);
    p.head.position.copy(p.headPos);
    p.nose.position.copy(p.headPos).addScaledVector(lookD, 0.098);
    p.hair.position.copy(p.headPos).addScaledVector(lookD, -0.014).add(vb.set(0, 0.012, 0));
    p.hair.quaternion.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lookD, -0.4).normalize());
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

// Text on a transparent plane, wrapped to fit a 1024 px canvas. lineH is the world height of one line.
function words(text, { font, fg, lineH, maxW = 980 }) {
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const px = parseInt(font.match(/(\d+)px/)[1], 10), LH = Math.round(px * 1.3);
  const lines = [];
  text.split(' ').forEach((wd) => {
    const cur = lines.length ? lines[lines.length - 1] + ' ' + wd : wd;
    if (lines.length && probe.measureText(cur).width <= maxW) lines[lines.length - 1] = cur; else lines.push(wd);
  });
  const W = Math.min(1024, Math.ceil(Math.max(...lines.map((l) => probe.measureText(l).width))) + 16), H = LH * lines.length + 8;
  const { tex } = canvasTex(W, H, (c) => {
    c.font = font; c.fillStyle = fg; c.textBaseline = 'middle';
    lines.forEach((l, i) => c.fillText(l, 8, 4 + LH * (i + 0.5) + 2));
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry((W / LH) * lineH, (H / LH) * lineH), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, fog: false }));
  m.userData.w = (W / LH) * lineH;
  return m;
}

// A padlock, drawn closed or with its shackle swung open.
function lock(c, x, y, s, open, col) {
  c.strokeStyle = col; c.lineWidth = s * 0.16; c.lineCap = 'round';
  c.beginPath();
  if (open) { c.moveTo(x - s * 0.28, y); c.lineTo(x - s * 0.28, y - s * 0.3); c.arc(x + s * 0.02, y - s * 0.3, s * 0.3, Math.PI, Math.PI * 1.85); }
  else { c.moveTo(x - s * 0.28, y); c.lineTo(x - s * 0.28, y - s * 0.3); c.arc(x, y - s * 0.3, s * 0.28, Math.PI, 0); c.lineTo(x + s * 0.28, y); }
  c.stroke();
  c.fillStyle = col; roundRect(c, x - s * 0.45, y - s * 0.04, s * 0.9, s * 0.62, s * 0.1); c.fill();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0d0a16);
  scene.fog = new THREE.Fog(0x0d0a16, 5.5, 13);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), col = new THREE.Color();

  // ----------------------------------------------------------- the lobby
  const floor = mesh(new THREE.PlaneGeometry(12, 12), std(0xffffff, { map: grainTex('#2a2630', { size: 256, speck: 0.1, blot: 0.12, seed: 111, repeat: 7 }), roughness: 0.28, metalness: 0.2 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wallM = std(0xffffff, { map: grainTex('#26222c', { size: 256, speck: 0.06, blot: 0.14, seed: 112, repeat: 2 }), roughness: 0.9 });
  const gaps = DOORS.map((d) => [d.x - DW / 2, d.x + DW / 2]);
  const spans = [[-5, gaps[0][0]], [gaps[0][1], gaps[1][0]], [gaps[1][1], gaps[2][0]], [gaps[2][1], 5]];
  spans.forEach(([x0, x1]) => { const w = mesh(new THREE.PlaneGeometry(x1 - x0, DH), wallM, { cast: false }); w.position.set((x0 + x1) / 2, DH / 2, WZ); scene.add(w); });
  const upper = mesh(new THREE.PlaneGeometry(10, 2.4), wallM, { cast: false }); upper.position.set(0, DH + 1.2, WZ); scene.add(upper);
  // Dawn in two tall slit windows.
  const dawnTex = canvasTex(64, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2b2458'); g.addColorStop(0.45, '#7a4f8a'); g.addColorStop(0.75, '#e48a7a'); g.addColorStop(0.9, '#ffc08a'); g.addColorStop(1, '#3a2a40');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }).tex;
  const slits = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.3, 2.8), new THREE.MeshBasicMaterial({ map: dawnTex, toneMapped: false, fog: false, color: 0xb8b0c0 }), 2);
  [-2.55, 2.55].forEach((x, i) => { m4.makeTranslation(x, 1.55, WZ + 0.01); slits.setMatrixAt(i, m4); });
  scene.add(slits);

  // Door frames and the steel leaves.
  const steel = std(0x3a3d46, { metalness: 0.85, roughness: 0.32 });
  const frames = [];
  DOORS.forEach((d) => { frames.push([d.x - DW / 2 - 0.03, DH / 2, 0.06, DH + 0.06], [d.x + DW / 2 + 0.03, DH / 2, 0.06, DH + 0.06], [d.x, DH + 0.03, DW + 0.12, 0.06]); });
  const frameIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 0.14), std(0x8c8f98, { metalness: 1, roughness: 0.22 }), frames.length);
  frames.forEach(([x, y, w, h], i) => { m4.compose(p4.set(x, y, WZ + 0.03), q4.identity(), s4.set(w, h, 1)); frameIM.setMatrixAt(i, m4); });
  frameIM.castShadow = true; frameIM.receiveShadow = true; scene.add(frameIM);
  const leafIM = new THREE.InstancedMesh(new RoundedBoxGeometry(DW / 2, DH, 0.05, 2, 0.008), steel, 6);
  leafIM.castShadow = true; leafIM.receiveShadow = true; scene.add(leafIM);
  const seamIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.012, DH - 0.06, 0.01), new THREE.MeshBasicMaterial({ toneMapped: false }), 3);
  scene.add(seamIM);
  // The rooms behind: each an open-fronted glowing box, plus the light it throws on the floor.
  const roomTex = canvasTex(16, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#ffffff'); g.addColorStop(0.6, '#bdbdbd'); g.addColorStop(1, '#6a6a6a'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const roomIM = new THREE.InstancedMesh(new THREE.BoxGeometry(DW, DH, 0.9), new THREE.MeshBasicMaterial({ map: roomTex, side: THREE.BackSide, toneMapped: false, fog: false }), 3);
  DOORS.forEach((d, i) => { m4.makeTranslation(d.x, DH / 2, WZ - 0.47); roomIM.setMatrixAt(i, m4); });
  scene.add(roomIM);
  const spillTex = canvasTex(128, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.25, 'rgba(0,0,0,0)'); s.addColorStop(0.75, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const spillIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: spillTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 3);
  scene.add(spillIM);
  const doorGlows = DOORS.map((d) => { const g = glow(d.hex, 1, 0, 0.5); g.position.set(d.x, 1.0, WZ + 0.15); g.scale.set(1.5, 2.4, 1); scene.add(g); return g; });
  const doorLights = DOORS.map((d) => { const l = new THREE.PointLight(d.hex, 0, 4.5, 1.6); l.position.set(d.x, 1.3, WZ + 0.25); scene.add(l); return l; });

  // Name plates above each door, with a lock that flips open.
  const plates = DOORS.map((d) => {
    const ct = canvasTex(512, 128);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.18), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, depthWrite: false }));
    m.position.set(d.x, DH + 0.2, WZ + 0.02); scene.add(m);
    return { ct, m, key: '' };
  });
  const drawPlate = (i, open) => plates[i].ct.redraw((c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(10,8,16,0.6)'; roundRect(c, 4, 8, w - 8, h - 16, 20); c.fill();
    c.font = `800 66px ${SANS}`; c.fillStyle = open ? '#fff6ea' : 'rgba(240,232,250,0.7)'; c.textBaseline = 'middle';
    c.fillText(DOORS[i].name, 34, h / 2 + 3);
    lock(c, w - 70, h / 2 + 12, 52, open, open ? DOORS[i].col : 'rgba(240,232,250,0.55)');
  });

  // ----------------------------------------------------------- the kiosk
  const KX = -0.6, KZ = -0.25;
  const column = mesh(new RoundedBoxGeometry(0.14, 1.0, 0.14, 2, 0.02), steel); column.position.set(KX, 0.5, KZ); scene.add(column);
  const kHead = new THREE.Group(); kHead.position.set(KX, 1.06, KZ); kHead.rotation.order = 'YXZ'; kHead.rotation.set(-0.62, 0.57, 0); scene.add(kHead);
  kHead.add(mesh(new RoundedBoxGeometry(0.42, 0.54, 0.05, 3, 0.02), steel));
  const kScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.46), new THREE.MeshBasicMaterial({ color: 0x06070c, toneMapped: false }));
  kScreen.position.z = 0.026; kHead.add(kScreen);
  kHead.updateMatrixWorld(true);
  const K_POS = kScreen.localToWorld(V(0, 0, 0.004)), K_Q = new THREE.Quaternion(); kScreen.getWorldQuaternion(K_Q);
  const K_N = V(0, 0, 1).applyQuaternion(K_Q), K_UP = V(0, 1, 0).applyQuaternion(K_Q);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x6a5a8a, 0x120e16, 0.3));
  const sun = new THREE.DirectionalLight(0xffb39a, 2.4);
  sun.position.set(-4.2, 1.9, 1.6); sun.target.position.set(0, 0.6, -0.8);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3, right: 3, top: 3, bottom: -3, near: 0.5, far: 10 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0x8a7aff, 0.5); fill.position.set(2.5, 2.5, 3); scene.add(fill);
  const panelL = new THREE.PointLight(0xc8d8ff, 0, 2.5, 1.5); scene.add(panelL);

  // ----------------------------------------------------------- the login forms
  const PW = 0.5, PH = 0.64;
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x141020, roughness: 0.2, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.1 });
  const panelGeo = new RoundedBoxGeometry(PW, PH, 0.016, 3, 0.02);
  // One form: its header, a lock, two fields and a button. one: the merged sign-in, filled to f, pressed, done.
  const drawForm = (c, w, h, { name, colr, one = false, f = 0, press = 0, done = 0 }) => {
    c.clearRect(0, 0, w, h);
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#221b36'); bg.addColorStop(1, '#0e0b18');
    c.fillStyle = bg; roundRect(c, 0, 0, w, h, 30); c.fill();
    c.strokeStyle = one ? 'rgba(255,255,255,0.35)' : colr; c.globalAlpha = one ? 1 : 0.6; c.lineWidth = 4; roundRect(c, 2, 2, w - 4, h - 4, 28); c.stroke(); c.globalAlpha = 1;
    if (one) {
      // Three colour ticks along the top: the three businesses this one sign-in covers.
      DOORS.forEach((d, i) => { c.fillStyle = d.col; roundRect(c, 40 + i * 64, 36, 52, 10, 5); c.fill(); });
    } else { c.fillStyle = colr; roundRect(c, 40, 36, 90, 10, 5); c.fill(); }
    c.font = `800 ${one ? 64 : 76}px ${SANS}`; c.fillStyle = '#f6f0ff'; c.textBaseline = 'middle';
    c.fillText(name, 40, 112);
    if (!one) lock(c, w - 70, 128, 56, false, 'rgba(246,240,255,0.6)');
    for (let r = 0; r < 2; r++) {
      const y = 200 + r * 120;
      c.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(c, 40, y, w - 80, 84, 16); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 2; roundRect(c, 40, y, w - 80, 84, 16); c.stroke();
      const fr = clamp(f * 2 - r);
      if (r === 0 && fr > 0) { c.fillStyle = 'rgba(246,240,255,0.85)'; roundRect(c, 64, y + 34, 230 * fr, 16, 8); c.fill(); }
      if (r === 1) { c.fillStyle = 'rgba(246,240,255,0.85)'; for (let j = 0; j < Math.floor(fr * 9); j++) { c.beginPath(); c.arc(72 + j * 34, y + 42, 9, 0, 7); c.fill(); } }
    }
    const by = 460 + press * 6;
    c.fillStyle = done ? '#65ac1e' : one ? '#e9e2f7' : 'rgba(255,255,255,0.16)'; roundRect(c, 40, by, w - 80, 96, 20); c.fill();
    if (done) {
      c.strokeStyle = '#0e0b18'; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(w / 2 - 34, by + 48); c.lineTo(w / 2 - 6, by + 74); c.lineTo(w / 2 + 40, by + 22); c.stroke();
    } else {
      c.fillStyle = one ? '#1b1530' : 'rgba(246,240,255,0.5)';
      c.beginPath(); c.moveTo(w / 2 - 14, by + 30); c.lineTo(w / 2 + 18, by + 48); c.lineTo(w / 2 - 14, by + 66); c.closePath(); c.fill();
    }
  };
  const panels = DOORS.map((d, i) => {
    const g = new THREE.Group(); scene.add(g);
    g.add(mesh(panelGeo, glassM, { cast: true, receive: false }));
    const ct = canvasTex(512, 656);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.006, PH - 0.006), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, color: 0xe4e0ea }));
    face.position.z = 0.009; g.add(face);
    if (i !== 1) ct.redraw((c, w, h) => drawForm(c, w, h, { name: d.name, colr: d.col }));
    return { g, ct, face, home: V(d.x, 1.3, -1.72), key: '' };
  });
  const oneGlow = glow(0xd8c8ff, 1, 0, 0.5); oneGlow.scale.set(1.0, 1.2, 1); scene.add(oneGlow);
  const mergeFlash = glow(0xffffff, 1, 0, 0.4); mergeFlash.position.set(0, 1.3, -1.6); scene.add(mergeFlash);

  // ----------------------------------------------------------- light running across the floor
  const beamTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.15, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(255,255,255,0.15)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.4, 'rgba(0,0,0,0)'); s.addColorStop(0.6, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const beamIM = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: beamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), 3);
  beamIM.frustumCulled = false; scene.add(beamIM);
  DOORS.forEach((d, i) => beamIM.setColorAt(i, col.set(d.col)));
  const beamHeads = DOORS.map((d) => { const g = glow(d.hex, 0.35, 0, 0.4); scene.add(g); return g; });
  const B0 = V(KX + 0.05, 0.004, KZ + 0.1);
  const BEND = DOORS.map((d) => V(d.x, 0.004, WZ + 0.08));

  // ----------------------------------------------------------- the grower
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc58c6a, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const jacket = std(0xb5532c, { roughness: 0.85 });
  const grower = makePerson(scene, { skin, top: jacket, sleeve: jacket, fore: jacket, pants: std(0x26324a, { roughness: 0.85 }), shoeM: std(0x3a2a20, { roughness: 0.6 }), hairM: std(0x1e1612, { roughness: 0.9 }), hairCap: 0.52, chestR: 0.15 });
  const P0 = V(2.05, 0, 1.5), P1 = V(-0.28, 0, 0.24), PM = V(0.05, 0, -0.32), P2 = V(0.05, 0, -1.45);
  const A = P1.clone().sub(P0), LA = A.length();
  const B1 = PM.clone().sub(P1), LB1 = B1.length(), B2 = P2.clone().sub(PM), LB2 = B2.length();
  const HA = Math.atan2(A.x, A.z), HK = near(Math.atan2(K_POS.x - P1.x, K_POS.z - P1.z), HA);
  const HB1 = near(Math.atan2(B1.x, B1.z), HK), HB2 = near(Math.atan2(B2.x, B2.z), HB1);
  const WA = [0.15, 2.45, 0.5], WB = [6.75, 9.25, 0.65], STRIDE = 1.25, AMP = STRIDE / (2 * Math.PI);
  const sA = (t) => trap(t, WA[0], WA[1], LA, WA[2]);
  const sB = (t) => trap(t, WB[0], WB[1], LB1 + LB2, WB[2]);
  const vMaxA = LA / (WA[1] - WA[0] - WA[2]), vMaxB = (LB1 + LB2) / (WB[1] - WB[0] - WB[2]);

  // ----------------------------------------------------------- title
  const titleG = new THREE.Group(); scene.add(titleG);
  const client = words('BASF Agriculture', { font: `700 52px ${MONO}`, fg: '#c8b6ff', lineH: 0.08 });
  const title = words('Unified login', { font: `800 84px ${SANS}`, fg: '#fbf6ff', lineH: 0.17 });
  const line = words('One sign-in across US Crop, P&SS, and Seed business segments.', { font: `600 44px ${SANS}`, fg: '#e2cfe6', lineH: 0.062 });
  titleG.add(client, title, line);
  titleG.position.set(0, 0, WZ + 0.03);

  // ----------------------------------------------------------- dust in the dawn light
  const DN = 120, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffc8b0, size: 0.01, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [1.75, 1.5, 3.55]], [2.6, [0.95, 1.45, 3.0]],
    [3.5, [0.6, 1.5, 2.6], L], [4.1, [1.22, 1.6, 0.45]],
    [4.8, [1.2, 1.6, 0.43], L], [5.9, [0.35, 1.6, 3.2]],
    [7.4, [0.16, 1.45, 2.95]], [10, [0.12, 1.44, 3.1], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.25, 1.15, -0.8]], [2.6, [0.0, 1.25, -1.2]],
    [3.5, [-0.05, 1.25, -1.3], L], [4.1, [-0.46, 1.27, -0.15]],
    [4.8, [-0.46, 1.27, -0.15], L], [5.9, [0.0, 1.2, -1.5]],
    [7.4, [0.0, 1.5, -1.9]], [10, [0.0, 1.51, -1.9], L],
  ]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), root = V(0, 0, 0), hip = V(0, 0, 0), F = V(0, 0, 0), S = V(0, 0, 0), look = V(0, 0, 0), pp = V(0, 0, 0), qq = new THREE.Quaternion(), qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), dummy = new THREE.Object3D();
  const TAP_PT = K_POS.clone().addScaledVector(K_UP, -0.12);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 35], [2.6, 34], [4.1, 32], [4.8, 32], [5.9, 35], [7.4, 35.5], [10, 35]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // ---- The three forms hang in front of their doors, then fold together into one.
    const mg = eio(k(t, MERGE[0], MERGE[1])), dock = eio(k(t, DOCK[0], DOCK[1]));
    const fl = t > MERGE[1] - 0.08 ? Math.exp(-6 * (t - MERGE[1] + 0.08)) : 0;
    mergeFlash.material.opacity = 0.8 * fl; mergeFlash.scale.setScalar(0.5 + 1.4 * (1 - fl));
    const CEN = tmp2.set(0, 1.3, -1.55);
    panels.forEach((pn, i) => {
      const bob = Math.sin(t * 1.2 + i * 2) * 0.008;
      pp.copy(pn.home).lerp(CEN, mg); pp.y += bob + Math.sin(Math.PI * mg) * 0.06 * (i === 1 ? 0 : 1);
      pp.z += Math.sin(Math.PI * mg) * (i === 1 ? 0.08 : -0.05);
      dummy.position.copy(pp); dummy.lookAt(0.6, 1.4, 3.2); qa.copy(dummy.quaternion);
      dummy.rotateY((i - 1) * -0.9 * Math.sin(Math.PI * mg)); qb.copy(dummy.quaternion);
      pn.g.position.copy(pp); pn.g.quaternion.copy(qb);
      let sc = 1;
      if (i !== 1) { sc = 1 - 0.4 * eo(k(t, MERGE[1] - 0.25, MERGE[1])); pn.g.visible = t < MERGE[1]; }
      else {
        sc = 1 + 0.06 * Math.sin(Math.PI * k(t, MERGE[1] - 0.1, MERGE[1] + 0.3));
        // The merged form drops onto the kiosk and becomes its screen.
        if (dock > 0) {
          pn.g.position.lerp(K_POS, dock); pn.g.position.y += Math.sin(Math.PI * dock) * 0.1;
          pn.g.quaternion.slerpQuaternions(qb, K_Q, dock);
          sc = lerp(sc, 0.72, dock);
        }
        if (t > TAP) pn.g.position.addScaledVector(K_N, -0.004 * Math.sin(Math.PI * k(t, TAP - 0.03, TAP + 0.12)));
      }
      pn.g.scale.setScalar(sc);
      pn.face.material.color.setScalar(0.85 + (i === 1 ? 0.4 * fl : 0));
    });
    // The merged form's face: P&SS until the fold, then one sign-in that fills, is pressed and opens.
    const one = t > MERGE[1] - 0.12, f = eio(k(t, 4.05, 4.45)), press = t > TAP && t < TAP + 0.14 ? 1 : 0, done = t > TAP + 0.12 ? 1 : 0;
    const key = one ? ['o', Math.round(f * 18), press, done].join('|') : 'p';
    if (key !== panels[1].key) {
      panels[1].key = key;
      panels[1].ct.redraw((c, w, h) => (one ? drawForm(c, w, h, { name: 'ONE SIGN-IN', one: true, f, press, done }) : drawForm(c, w, h, { name: 'P&SS', colr: DOORS[1].col })));
    }
    panels[1].g.getWorldPosition(oneGlow.position); oneGlow.position.addScaledVector(K_N, -0.05 * dock);
    const tapPop = t > TAP ? Math.exp(-4 * (t - TAP)) : 0;
    oneGlow.material.opacity = 0.35 * fl + 0.12 * (one ? 1 : 0) + 0.5 * tapPop;
    oneGlow.material.color.set(done ? 0x9cff5a : 0xd8c8ff);
    panelL.position.copy(oneGlow.position).addScaledVector(K_N, 0.2);
    panelL.intensity = 0.6 + 1.2 * tapPop;

    // ---- Light runs out to the three doors; locks flip; doors slide apart.
    DOORS.forEach((d, i) => {
      const u = eo(k(t, BEAM(i), UNLOCK(i))), fade = 1 - 0.7 * k(t, UNLOCK(i) + 0.2, UNLOCK(i) + 1.4);
      tmp.copy(B0).lerp(BEND[i], u);
      const len = Math.max(0.001, B0.distanceTo(tmp)), ang = Math.atan2(BEND[i].x - B0.x, BEND[i].z - B0.z);
      q4.setFromEuler(new THREE.Euler(-Math.PI / 2, ang + Math.PI, 0, 'YXZ'));
      m4.compose(p4.copy(B0).add(tmp).multiplyScalar(0.5), q4, s4.set(0.16, len, 1)); beamIM.setMatrixAt(i, m4);
      beamIM.setColorAt(i, col.set(d.col).multiplyScalar(u > 0 ? 0.9 * fade : 0));
      beamHeads[i].position.copy(tmp).setY(0.03);
      beamHeads[i].material.opacity = u > 0 && u < 1 ? 0.9 : t > UNLOCK(i) ? 0.6 * Math.exp(-4 * (t - UNLOCK(i))) : 0;
      // Lock plate.
      const open = t > UNLOCK(i);
      const pk = open ? 'o' : 'c';
      if (pk !== plates[i].key) { plates[i].key = pk; drawPlate(i, open); }
      plates[i].m.scale.setScalar(1 + 0.12 * (open ? Math.exp(-6 * (t - UNLOCK(i))) : 0));
      // Leaves slide apart with a small overshoot.
      const o = back(k(t, OPEN(i), OPEN(i) + 0.75));
      [-1, 1].forEach((sg, j) => {
        m4.makeTranslation(d.x + sg * (DW / 4 + o * DW * 0.46), DH / 2, WZ + 0.045);
        leafIM.setMatrixAt(i * 2 + j, m4);
      });
      const lit = clamp(o) * (0.9 + 0.1 * Math.sin(t * 2 + i));
      m4.compose(p4.set(d.x, DH / 2, WZ + 0.075), q4.identity(), s4.set(1, Math.max(0.001, 1 - clamp(o * 5)), 1)); seamIM.setMatrixAt(i, m4);
      seamIM.setColorAt(i, col.set(d.col).multiplyScalar(0.3 + 0.04 * Math.sin(t * 1.4 + i) + 1.8 * (open ? Math.exp(-3 * (t - UNLOCK(i))) : 0)));
      roomIM.setColorAt(i, col.set(d.col).multiplyScalar(0.15 + 1.05 * lit));
      m4.compose(p4.set(d.x, 0.003, WZ + 0.06 + 0.75 * clamp(o)), q4.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0)), s4.set(DW * 1.25 * Math.max(0.01, clamp(o)), 1.5 * Math.max(0.01, clamp(o)), 1));
      spillIM.setMatrixAt(i, m4); spillIM.setColorAt(i, col.set(d.col).multiplyScalar(0.55 * lit));
      doorGlows[i].material.opacity = 0.32 * lit;
      doorLights[i].intensity = 5 * lit;
    });
    [beamIM, leafIM, seamIM, spillIM].forEach((m) => { m.instanceMatrix.needsUpdate = true; });
    [beamIM, seamIM, roomIM, spillIM].forEach((m) => { if (m.instanceColor) m.instanceColor.needsUpdate = true; });

    // ---- The grower: walks in, reads the forms, taps the kiosk, turns and walks to the doors.
    let yaw, s = 0, w = 0, turn = 0;
    if (t < 6.75) {
      s = sA(t);
      root.copy(P0).addScaledVector(A, s / LA);
      w = clamp((sA(t + 0.02) - sA(t - 0.02)) / 0.04 / vMaxA);
      turn = eio(k(t, 2.15, 2.6));
      yaw = lerp(HA, HK, turn);
      const tb = eio(k(t, 6.35, 6.8));
      yaw = lerp(yaw, HB1, tb);
    } else {
      const sb = sB(t);
      s = LA + sb;
      if (sb < LB1) root.copy(P1).addScaledVector(B1, sb / LB1); else root.copy(PM).addScaledVector(B2, Math.min(1, (sb - LB1) / LB2));
      w = clamp((sB(t + 0.02) - sB(t - 0.02)) / 0.04 / vMaxB);
      yaw = lerp(HB1, HB2, eio(k(sb, LB1 - 0.3, LB1 + 0.3)));
    }
    fwdOf(yaw, F); sideOf(yaw, S);
    const phase = (s / STRIDE) * Math.PI * 2;
    const tap = eio(k(t, 4.15, 4.5)) * (1 - eio(k(t, 4.75, 5.15)));
    hip.copy(root).setY(0.93 + 0.016 * Math.cos(phase * 2) * w + Math.sin(t * 1.6) * 0.003 * (1 - w));
    hip.addScaledVector(S, Math.sin(t * 0.7) * 0.012 * (1 - w));
    // Where the eyes go: ahead while walking, across the three forms, the merge, the kiosk, the doors.
    if (t < 2.2) look.copy(root).addScaledVector(F, 2).setY(1.5);
    else if (t < 2.75) { const u = eio(k(t, 2.2, 2.75)); look.copy(panels[0].home).lerp(panels[2].home, u); }
    else if (t < 3.6) look.copy(panels[1].g.position);
    else if (t < 4.85) look.copy(K_POS);
    else if (t < 6.4) { const u = k(t, 4.85, 6.3); look.set(lerp(-1.3, 1.3, eio(u)), 1.2, WZ); }
    else look.copy(P2).setY(1.55).add(tmp.set(0, 0, -1));
    grower.pose({
      hip, yaw, lean: 0.04 + 0.05 * w + 0.12 * tap, look,
      feet: (i, out) => {
        const sg = i ? 1 : -1, ph = phase + i * Math.PI;
        out.copy(root).addScaledVector(S, sg * 0.1).addScaledVector(F, AMP * Math.sin(ph) * w);
        out.y = 0.085 + 0.1 * Math.max(0, Math.cos(ph)) * w;
        // Little steps as the grower turns on the spot.
        out.y += 0.05 * Math.sin(Math.PI * k(t, 2.2 + i * 0.18, 2.45 + i * 0.18)) + 0.05 * Math.sin(Math.PI * k(t, 6.35 + i * 0.18, 6.6 + i * 0.18));
      },
      hands: (i, shp, out) => {
        const sg = i ? 1 : -1, swing = -Math.sin(phase + i * Math.PI) * w;
        out.copy(shp).add(tmp.set(0, -0.52, 0)).addScaledVector(F, 0.06 + 0.17 * swing).addScaledVector(S, sg * 0.05);
        if (i === 0 && tap > 0) {
          tmp.copy(TAP_PT).addScaledVector(K_N, 0.055 - 0.02 * Math.sin(Math.PI * k(t, TAP - 0.05, TAP + 0.12)));
          out.lerp(tmp, tap);
        }
      },
    });

    // ---- The title lights up on the wall above the doors.
    const ci = back(k(t, 7.5, 8.05)), ti = back(k(t, 7.65, 8.2)), li = eo(k(t, 7.9, 8.5)), out = ei(k(t, 9.25, 9.6));
    [[client, 2.74, ci], [title, 2.56, ti], [line, 2.38, li]].forEach(([m, y, a]) => {
      m.position.set(0, y - (1 - clamp(a)) * 0.04, 0);
      m.material.opacity = clamp(a) * (1 - out); m.visible = m.material.opacity > 0.01;
    });

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -2.2 + rnd(i, 121) * 4 + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = 0.2 + rnd(i, 122) * 2.2 + Math.sin(t * 0.4 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -2.2 + rnd(i, 123) * 3.4 + Math.cos(t * 0.25 + i) * 0.06;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.7 };
}
