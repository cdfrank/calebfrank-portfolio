// BASF Agriculture Partner Portal lit loop, 10 s. "Everything a partner needs, in one place."
// An ag retailer's store at midday: the partner's desk sits in a glass-walled office at the back, and
// through the glass the shop floor runs away in gondola rows of coloured jugs under fluorescent strips.
// Skylight falls warm on a honey-wood desk, seed bags are stacked in the corner. A partner leans in to
// the laptop, types and clicks sign in. Four tiles lift out of the screen and hang in an arc in front of the
// glass, and each one fills while the partner's eyes move along them: the financials chart grows, the
// orders count rolls 12, 13, 14, the activity feed stacks up, and a learning video starts playing. The
// tiles fold into one Partner Portal panel, the partner leans back with a coffee, and the title settles.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BLUE = '#004a96', SKY = '#21a0d2', GREEN = '#65ac1e', ORANGE = '#f39500';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// The four tiles, and when each fills in.
const TILES = [
  { name: 'FINANCIALS', col: SKY, fill: [3.15, 3.95] },
  { name: 'ORDERS', col: ORANGE, fill: [3.85, 4.75] },
  { name: 'ACTIVITY', col: GREEN, fill: [4.6, 5.4] },
  { name: 'LEARNING', col: '#8fb8ff', fill: [5.3, 6.35] },
];
const SIGN_IN = 1.92;                       // the click
const LIFT = (i) => 2.3 + i * 0.16;         // each tile leaves the screen
const FOLD = (i) => 6.45 + i * 0.07;        // each tile folds into the portal

const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// A stylized person built from capsules, placed in world space from a few inputs each frame (hip,
// facing, lean, ankle and wrist targets, look point), with two-bone reach for knees and elbows.
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
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.min(dv.length(), l1 + l2 - 0.001); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0), lookD = V(0, 0, 0);
  p.shoulder = [V(0, 0, 0), V(0, 0, 0)];
  p.headPos = V(0, 0, 0);
  p.lookD = lookD;
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

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x161b18);
  scene.fog = new THREE.Fog(0x161b18, 3.2, 9.5);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), col = new THREE.Color();

  // ----------------------------------------------------------- the office at the back of the store
  const floor = mesh(new THREE.PlaneGeometry(12, 12), std(0xffffff, { map: grainTex('#3b3a33', { size: 256, speck: 0.1, blot: 0.1, seed: 71, repeat: 8 }), roughness: 0.5, metalness: 0.05 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // The office's back wall is glass from waist to head height, onto the shop floor.
  const WZ = -1.5, GX = 2.2, G0 = 0.85, G1 = 2.4;
  const wallM = std(0xffffff, { map: grainTex('#3d4a40', { size: 256, speck: 0.05, blot: 0.1, seed: 72, repeat: 3 }), roughness: 0.92 });
  [[-5, -GX, 0, 3.4], [GX, 5, 0, 3.4], [-GX, GX, 0, G0], [-GX, GX, G1, 3.4]].forEach(([x0, x1, y0, y1]) => {
    const w = mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), wallM, { cast: false }); w.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ); scene.add(w);
  });
  const bars = [
    [0, G0, GX * 2 + 0.06, 0.05, 0.12], [0, G1, GX * 2 + 0.06, 0.05, 0.12],
    [-GX, (G0 + G1) / 2, 0.05, G1 - G0, 0.12], [GX, (G0 + G1) / 2, 0.05, G1 - G0, 0.12],
    [-0.73, (G0 + G1) / 2, 0.035, G1 - G0, 0.08], [0.73, (G0 + G1) / 2, 0.035, G1 - G0, 0.08],
  ];
  const frameIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x2a2f2b, { metalness: 0.6, roughness: 0.4 }), bars.length);
  bars.forEach(([x, y, w, h, d], i) => { m4.compose(p4.set(x, y, WZ), q4.identity(), s4.set(w, h, d)); frameIM.setMatrixAt(i, m4); });
  frameIM.castShadow = true; frameIM.receiveShadow = true; scene.add(frameIM);
  const streaks = canvasTex(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 5; i++) { const x = rnd(i, 61) * w; const g = c.createLinearGradient(x, 0, x + 60, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 18 + rnd(i, 62) * 30, 0); c.lineTo(x + 70, h); c.lineTo(x + 52, h); c.closePath(); c.fill(); }
  }).tex;
  const glassSheen = new THREE.Mesh(new THREE.PlaneGeometry(GX * 2, G1 - G0), new THREE.MeshBasicMaterial({ map: streaks, transparent: true, opacity: 0.07, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  glassSheen.position.set(0, (G0 + G1) / 2, WZ + 0.01); scene.add(glassSheen);

  // The shop floor beyond the glass: gondola shelving stocked with jugs and bags under fluorescent strips.
  const ROWS = [-2.3, -3.2, -4.1], LEVELS = [0.16, 0.6, 1.04, 1.48];
  const boards = [];
  ROWS.forEach((z) => {
    LEVELS.forEach((y) => boards.push([0, y - 0.02, z, 4.8, 0.03, 0.5]));
    for (let x = -2.4; x <= 2.41; x += 1.2) boards.push([x, 0.9, z, 0.05, 1.8, 0.5]);
    boards.push([0, 0.9, z - 0.2, 4.8, 1.8, 0.04]);
  });
  const shelfIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x7a8076, { metalness: 0.5, roughness: 0.5 }), boards.length);
  boards.forEach(([x, y, z, w, h, d], i) => { m4.compose(p4.set(x, y, z), q4.identity(), s4.set(w, h, d)); shelfIM.setMatrixAt(i, m4); });
  shelfIM.receiveShadow = true; scene.add(shelfIM);
  const PAL = [0xd8642a, 0x2f7a3a, 0x1f5fa8, 0xd9a21e, 0x9a2f2a, 0x4e8a9a, 0xc9b48a];
  const stock = [];
  ROWS.forEach((z, r) => LEVELS.forEach((y, l) => {
    for (let x = -2.32; x < 2.35; x += 0.155) {
      if (rnd(stock.length, 63) < 0.12) { stock.push(null); continue; }
      stock.push([x + (rnd(stock.length, 64) - 0.5) * 0.02, y + 0.11, z + 0.08, PAL[(Math.floor((x + 2.4) / 0.93) + r * 2 + l) % PAL.length]]);
    }
  }));
  const items = stock.filter(Boolean);
  const stockIM = new THREE.InstancedMesh(new RoundedBoxGeometry(0.13, 0.2, 0.11, 2, 0.025), std(0xffffff, { roughness: 0.45 }), items.length);
  items.forEach(([x, y, z, c], i) => { m4.compose(p4.set(x, y, z), q4.setFromAxisAngle(Y, (rnd(i, 65) - 0.5) * 0.2), s4.set(1, 0.85 + rnd(i, 66) * 0.3, 1)); stockIM.setMatrixAt(i, m4); stockIM.setColorAt(i, col.setHex(c)); });
  stockIM.receiveShadow = true; scene.add(stockIM);
  const tubes = new THREE.InstancedMesh(new THREE.BoxGeometry(3.6, 0.03, 0.1), new THREE.MeshBasicMaterial({ color: 0xdfe9f0, toneMapped: false }), 4);
  [-1.85, -2.75, -3.65, -4.55].forEach((z, i) => { m4.makeTranslation(0, 2.95, z); tubes.setMatrixAt(i, m4); });
  scene.add(tubes);
  const storeBack = mesh(new THREE.PlaneGeometry(10, 3.4), std(0x4a5446, { roughness: 0.9 }), { cast: false });
  storeBack.position.set(0, 1.7, -5.2); scene.add(storeBack);

  // Seed bags stacked in the office corner, and a filing cabinet on the other side.
  const bagTex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#c9b48a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 500; i++) { c.fillStyle = `rgba(80,60,30,${rnd(i, 4) * 0.15})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 2, 2); }
    c.fillStyle = '#2f7a3a'; c.fillRect(0, h * 0.36, w, h * 0.28);
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(w * 0.1, h * 0.46, w * 0.3, h * 0.08);
  }).tex;
  const bags = [];
  for (let r = 0; r < 4; r++) for (let n = 0; n < 2; n++) bags.push([1.62 + n * 0.02 - r * 0.01, 0.07 + r * 0.13, -0.95 - n * 0.36 + (r % 2) * 0.03, (rnd(r * 2 + n, 8) - 0.5) * 0.12]);
  const bagIM = new THREE.InstancedMesh(new RoundedBoxGeometry(0.48, 0.13, 0.34, 2, 0.04), std(0xffffff, { map: bagTex, roughness: 0.9 }), bags.length);
  bags.forEach(([x, y, z, ry], i) => { m4.compose(p4.set(x, y, z), q4.setFromAxisAngle(Y, ry + Math.PI / 2), s4.set(1, 1, 1)); bagIM.setMatrixAt(i, m4); });
  bagIM.castShadow = bagIM.receiveShadow = true; scene.add(bagIM);
  const cab = mesh(new RoundedBoxGeometry(0.46, 1.05, 0.55, 2, 0.015), std(0x56604f, { metalness: 0.6, roughness: 0.45 }));
  cab.position.set(-1.65, 0.525, -1.1); scene.add(cab);

  // Honey-wood desk on steel legs.
  const DESK_Y = 0.76;
  const desk = mesh(new RoundedBoxGeometry(1.7, 0.04, 0.78, 2, 0.01), std(0xffffff, { map: grainTex('#8a6238', { size: 256, speck: 0.08, blot: 0.14, seed: 73, repeat: 2 }), roughness: 0.42 }));
  desk.position.set(0, DESK_Y - 0.02, 0); scene.add(desk);
  const legIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, DESK_Y - 0.04, 0.04), std(0x262a31, { metalness: 0.7, roughness: 0.4 }), 4);
  [[-0.8, -0.34], [0.8, -0.34], [-0.8, 0.34], [0.8, 0.34]].forEach(([x, z], i) => { m4.makeTranslation(x, (DESK_Y - 0.04) / 2, z); legIM.setMatrixAt(i, m4); });
  legIM.castShadow = true; scene.add(legIM);

  // Office chair.
  const fabric = std(0x1d2128, { roughness: 0.9 });
  const seat = mesh(new RoundedBoxGeometry(0.48, 0.07, 0.46, 3, 0.03), fabric); seat.position.set(0, 0.46, 0.78); scene.add(seat);
  const backrest = mesh(new RoundedBoxGeometry(0.46, 0.52, 0.06, 3, 0.03), fabric); backrest.position.set(0, 0.8, 1.02); backrest.rotation.x = 0.12; scene.add(backrest);
  const chrome = std(0xb8bec6, { metalness: 1, roughness: 0.25 });
  const column = mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.36, 14), chrome); column.position.set(0, 0.24, 0.78); scene.add(column);
  const base = mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.03, 5), chrome); base.position.set(0, 0.05, 0.78); scene.add(base);

  // The laptop: lid hinged at the back of the base, screen toward the partner.
  const alu = std(0x9aa1ab, { metalness: 0.9, roughness: 0.3 });
  const LBASE = V(0, DESK_Y + 0.009, 0.08);
  const lbase = mesh(new RoundedBoxGeometry(0.34, 0.018, 0.24, 2, 0.006), alu); lbase.position.copy(LBASE); scene.add(lbase);
  const keysTex = canvasTex(256, 180, (c, w, h) => {
    c.fillStyle = '#7e858f'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#16181c';
    for (let r = 0; r < 5; r++) for (let n = 0; n < 12; n++) roundRect(c, 14 + n * 19.2, 10 + r * 19, 16, 16, 3), c.fill();
    roundRect(c, 70, 108, 116, 16, 3); c.fill();
    c.fillStyle = '#8c939d'; roundRect(c, 78, 132, 100, 44, 6); c.fill();
  }).tex;
  const deck = new THREE.Mesh(new THREE.PlaneGeometry(0.32, 0.225), std(0xffffff, { map: keysTex, roughness: 0.5, metalness: 0.4 }));
  deck.rotation.x = -Math.PI / 2; deck.position.set(LBASE.x, DESK_Y + 0.0185, LBASE.z); scene.add(deck);
  const hinge = new THREE.Group(); hinge.position.set(0, DESK_Y + 0.018, LBASE.z - 0.12); hinge.rotation.x = -0.24; scene.add(hinge);
  const lid = mesh(new RoundedBoxGeometry(0.34, 0.22, 0.008, 2, 0.006), alu); lid.position.set(0, 0.11, 0); hinge.add(lid);
  const SW = 0.312, SHh = 0.19;
  const lap = canvasTex(656, 400);
  const lapScreen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SHh), new THREE.MeshBasicMaterial({ map: lap.tex, toneMapped: false }));
  lapScreen.position.set(0, 0.11, 0.0045); hinge.add(lapScreen);
  const lapGlow = glow(0x6fa8ff, 1, 0, 0.5); lapGlow.position.set(0, 0.11, 0.06); lapGlow.scale.set(0.6, 0.42, 1); hinge.add(lapGlow);

  // Coffee mug, BASF blue, handle toward the partner's right hand.
  const MUG0 = V(0.34, DESK_Y, 0.22);
  const mug = new THREE.Group(); scene.add(mug);
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0x0d4a8f, roughness: 0.25, clearcoat: 0.8, clearcoatRoughness: 0.1, side: THREE.DoubleSide });
  const mugBody = mesh(new THREE.CylinderGeometry(0.04, 0.037, 0.1, 32, 1, true), ceramic); mugBody.position.y = 0.05; mug.add(mugBody);
  const mugHandle = mesh(new THREE.TorusGeometry(0.026, 0.007, 8, 20, Math.PI * 1.2), ceramic); mugHandle.position.set(0.042, 0.05, 0); mugHandle.rotation.z = -Math.PI * 0.6; mug.add(mugHandle);
  const coffee = mesh(new THREE.CircleGeometry(0.038, 28), std(0x2a170e, { roughness: 0.12 }), { cast: false }); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.086; mug.add(coffee);

  // ----------------------------------------------------------- lights
  // Midday through a skylight: a high warm-white key with soft shadows; the shop's cool light rims from behind.
  scene.add(new THREE.HemisphereLight(0x9aa89a, 0x1a1a16, 0.36));
  const key = new THREE.DirectionalLight(0xfff0d8, 2.3);
  key.position.set(-1.7, 3.4, 1.5); key.target.position.set(0.05, 0.85, 0.0);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -2.2, right: 2.2, top: 2.2, bottom: -2.2, near: 0.5, far: 9 });
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xdfe9ff, 1.1); rim.position.set(0.6, 2.8, -4); scene.add(rim);
  const storeL = new THREE.PointLight(0xe8f0ff, 3, 6, 1.2); storeL.position.set(0, 2.6, -3.2); scene.add(storeL);

  const tileL = new THREE.PointLight(0x8cc4ff, 0, 2.6, 1.4); tileL.position.set(0.05, 1.3, -0.1); scene.add(tileL);

  // ----------------------------------------------------------- the partner
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xb07a58, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const shirt = std(0x6f8fb3, { roughness: 0.85 });
  const partner = makePerson(scene, {
    skin, top: std(0x3f4a2f, { roughness: 0.9 }), sleeve: shirt, fore: shirt, pants: std(0x6a5a40, { roughness: 0.85 }),
    shoeM: std(0x3a2618, { roughness: 0.6 }), hairM: std(0x2a1d16, { roughness: 0.9 }), hairCap: 0.56, chestR: 0.145, bun: true,
  });
  const HIP = V(0, 0.53, 0.76), YAW = Math.PI;
  const PF = fwdOf(YAW), PS = sideOf(YAW);

  // ----------------------------------------------------------- the four tiles
  const TW = 0.46, TH = 0.33, TD = 0.016;
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0b1730, roughness: 0.22, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.12 });
  const tileGeo = new RoundedBoxGeometry(TW, TH, TD, 3, 0.018);
  const tiles = TILES.map((d, i) => {
    const g = new THREE.Group(); scene.add(g);
    const body = mesh(tileGeo, glass, { cast: true, receive: false }); g.add(body);
    const ct = canvasTex(512, 368);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(TW - 0.008, TH - 0.008), new THREE.MeshBasicMaterial({ map: ct.tex, transparent: true, toneMapped: false, color: 0xe2e6ee }));
    face.position.z = TD / 2 + 0.0008; g.add(face);
    const halo = glow(new THREE.Color(d.col).getHex(), 1, 0, 0.5); halo.position.z = -0.05; halo.scale.set(TW * 1.9, TH * 1.9, 1); g.add(halo);
    return { ...d, g, ct, halo, key: '' };
  });

  // What each tile shows at fill p (0..1).
  function drawTile(c, w, h, i, p) {
    const d = TILES[i], done = p >= 1;
    c.clearRect(0, 0, w, h);
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#14294e'); bg.addColorStop(1, '#08142b');
    c.fillStyle = bg; roundRect(c, 0, 0, w, h, 26); c.fill();
    c.strokeStyle = 'rgba(140,185,255,0.28)'; c.lineWidth = 3; roundRect(c, 1.5, 1.5, w - 3, h - 3, 25); c.stroke();
    c.font = `700 42px ${MONO}`; c.fillStyle = '#eef3ff'; c.textBaseline = 'middle';
    c.fillText(d.name, 30, 52);
    c.fillStyle = d.col; c.fillRect(30, 84, 72, 6);
    // Status dot: grey, then green with a check once the tile has filled in.
    c.fillStyle = done ? GREEN : 'rgba(255,255,255,0.16)'; c.beginPath(); c.arc(w - 46, 52, 18, 0, 7); c.fill();
    if (done) { c.strokeStyle = '#0b1730'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(w - 55, 52); c.lineTo(w - 48, 59); c.lineTo(w - 36, 45); c.stroke(); }
    const X0 = 30, X1 = w - 30, Y0 = 112, Y1 = h - 28;
    if (i === 0) {
      // Bars grow left to right, then a trend line draws across their tops.
      const HS = [0.34, 0.5, 0.42, 0.64, 0.58, 0.86], n = HS.length, bw = (X1 - X0) / n;
      c.fillStyle = 'rgba(255,255,255,0.08)'; for (let r = 0; r < 4; r++) c.fillRect(X0, Y1 - r * (Y1 - Y0) / 4, X1 - X0, 2);
      HS.forEach((hh, j) => {
        const g = eo(clamp(p * 1.6 - j * 0.1)), bh = hh * (Y1 - Y0) * g;
        const gr = c.createLinearGradient(0, Y1 - bh, 0, Y1); gr.addColorStop(0, SKY); gr.addColorStop(1, BLUE);
        c.fillStyle = gr; roundRect(c, X0 + j * bw + bw * 0.18, Y1 - bh, bw * 0.64, Math.max(1, bh), 6); c.fill();
      });
      const lp = clamp((p - 0.55) / 0.45);
      if (lp > 0) {
        c.strokeStyle = GREEN; c.lineWidth = 6; c.lineJoin = 'round'; c.beginPath();
        const pts = HS.map((hh, j) => [X0 + j * bw + bw / 2, Y1 - hh * (Y1 - Y0) - 16]);
        const L = lp * (n - 1);
        pts.forEach(([x, y], j) => { if (j === 0) c.moveTo(x, y); else if (j <= Math.floor(L)) c.lineTo(x, y); });
        const j0 = Math.floor(L), f = L - j0;
        if (j0 < n - 1) c.lineTo(lerp(pts[j0][0], pts[j0 + 1][0], f), lerp(pts[j0][1], pts[j0 + 1][1], f));
        c.stroke();
        const e = j0 < n - 1 ? [lerp(pts[j0][0], pts[j0 + 1][0], f), lerp(pts[j0][1], pts[j0 + 1][1], f)] : pts[n - 1];
        c.fillStyle = '#d9ffb0'; c.beginPath(); c.arc(e[0], e[1], 8, 0, 7); c.fill();
      }
    } else if (i === 1) {
      // The count rolls 12, 13, 14; a row of crates fills to match.
      const roll = (a, b) => eio(clamp((p - a) / (b - a)));
      const r1 = roll(0.22, 0.4), r2 = roll(0.62, 0.8);
      const n = 12 + (r1 >= 1 ? 1 : 0) + (r2 >= 1 ? 1 : 0), sl = r1 > 0 && r1 < 1 ? r1 : r2 > 0 && r2 < 1 ? r2 : 0;
      c.save(); c.beginPath(); c.rect(X0, Y0, 300, 150); c.clip();
      c.font = `800 136px ${SANS}`; c.fillStyle = '#ffffff'; c.textBaseline = 'alphabetic';
      c.fillText(String(n), X0, Y0 + 128 - sl * 150);
      if (sl > 0) { c.fillStyle = '#ffd08a'; c.fillText(String(n + 1), X0, Y0 + 128 + (1 - sl) * 150); }
      c.restore();
      const shown = 12 + r1 + r2;
      for (let j = 0; j < 14; j++) {
        const x = X0 + (j % 7) * 64, y = Y1 - 66 + Math.floor(j / 7) * 36, a = clamp(shown - j);
        c.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(c, x, y, 54, 28, 6); c.fill();
        if (a > 0) { c.globalAlpha = a; c.fillStyle = ORANGE; roundRect(c, x, y + 28 * (1 - a), 54, 28 * a, 6); c.fill(); c.globalAlpha = 1; }
      }
    } else if (i === 2) {
      // Feed rows slide in one after another.
      const cols = [GREEN, SKY, ORANGE, '#8fb8ff'];
      for (let j = 0; j < 4; j++) {
        const a = eo(clamp(p * 1.35 - j * 0.24)); if (a <= 0) continue;
        const y = Y0 + 8 + j * 54, x = X0 + (1 - a) * 120;
        c.globalAlpha = a;
        c.fillStyle = 'rgba(255,255,255,0.06)'; roundRect(c, x, y, X1 - X0, 44, 10); c.fill();
        c.fillStyle = cols[j]; c.beginPath(); c.arc(x + 24, y + 22, 11, 0, 7); c.fill();
        c.fillStyle = 'rgba(238,243,255,0.85)'; roundRect(c, x + 48, y + 10, 190 + rnd(j, 4) * 100, 10, 5); c.fill();
        c.fillStyle = 'rgba(238,243,255,0.4)'; roundRect(c, x + 48, y + 26, 120 + rnd(j, 5) * 80, 8, 4); c.fill();
        c.globalAlpha = 1;
      }
    } else {
      // A field-day video: play turns to pause and the progress bar runs partway.
      const vx = X0, vy = Y0 - 4, vw = X1 - X0, vh = Y1 - Y0 - 30;
      c.save(); roundRect(c, vx, vy, vw, vh, 14); c.clip();
      const sk = c.createLinearGradient(0, vy, 0, vy + vh); sk.addColorStop(0, '#3d6fa8'); sk.addColorStop(0.5, '#e3a86a'); sk.addColorStop(0.52, '#4d6a2a'); sk.addColorStop(1, '#2a3d16');
      c.fillStyle = sk; c.fillRect(vx, vy, vw, vh);
      c.strokeStyle = 'rgba(160,200,90,0.5)'; c.lineWidth = 3;
      for (let j = -8; j <= 8; j++) { c.beginPath(); c.moveTo(vx + vw / 2 + j * 8, vy + vh * 0.52); c.lineTo(vx + vw / 2 + j * 70, vy + vh); c.stroke(); }
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(vx, vy, vw, vh);
      c.restore();
      const playing = p > 0.18, cx = vx + vw / 2, cy = vy + vh / 2;
      c.fillStyle = 'rgba(8,20,43,0.7)'; c.beginPath(); c.arc(cx, cy, 34, 0, 7); c.fill();
      c.fillStyle = '#ffffff';
      if (!playing) { c.beginPath(); c.moveTo(cx - 10, cy - 16); c.lineTo(cx + 16, cy); c.lineTo(cx - 10, cy + 16); c.closePath(); c.fill(); }
      else { c.fillRect(cx - 12, cy - 15, 8, 30); c.fillRect(cx + 4, cy - 15, 8, 30); }
      const prog = 0.62 * eio(clamp((p - 0.18) / 0.82));
      c.fillStyle = 'rgba(255,255,255,0.15)'; roundRect(c, X0, Y1 - 14, X1 - X0, 10, 5); c.fill();
      c.fillStyle = d.col; roundRect(c, X0, Y1 - 14, Math.max(10, (X1 - X0) * prog), 10, 5); c.fill();
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(X0 + (X1 - X0) * prog, Y1 - 9, 10, 0, 7); c.fill();
    }
  }

  // The laptop: the sign-in card, then the portal's empty grid once the tiles have flown.
  let lapKey = '';
  function drawLaptop(t) {
    const dots = Math.floor(clamp(k(t, 0.65, 1.5)) * 8), press = t > SIGN_IN && t < SIGN_IN + 0.14 ? 1 : 0;
    const tr = eio(k(t, 2.0, 2.3)), left = TILES.filter((_, i) => t > LIFT(i) + 0.05).length;
    const key = [dots, press, Math.round(tr * 12), left, t > SIGN_IN ? 1 : 0].join('|');
    if (key === lapKey) return; lapKey = key;
    lap.redraw((c, w, h) => {
      const bg = c.createLinearGradient(0, 0, w, h); bg.addColorStop(0, '#0b2246'); bg.addColorStop(1, '#04101f');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      if (tr < 1) {
        c.save(); c.globalAlpha = 1 - tr; c.translate(0, -tr * 40);
        c.fillStyle = '#12305e'; roundRect(c, w / 2 - 170, 52, 340, 296, 22); c.fill();
        c.font = `700 32px ${MONO}`; c.fillStyle = '#eef3ff'; c.textBaseline = 'middle'; c.textAlign = 'center';
        c.fillText('PARTNER', w / 2, 102); c.textAlign = 'left';
        c.fillStyle = '#0a1d3c'; roundRect(c, w / 2 - 136, 140, 272, 46, 10); c.fill(); roundRect(c, w / 2 - 136, 200, 272, 46, 10); c.fill();
        c.fillStyle = 'rgba(238,243,255,0.75)'; roundRect(c, w / 2 - 118, 157, 150, 12, 6); c.fill();
        for (let j = 0; j < dots; j++) { c.beginPath(); c.arc(w / 2 - 112 + j * 22, 223, 6, 0, 7); c.fill(); }
        c.fillStyle = t > SIGN_IN ? '#4e8c16' : GREEN; roundRect(c, w / 2 - 136, 266 + press * 3, 272, 50, 12); c.fill();
        c.fillStyle = '#0b1730'; c.beginPath(); c.moveTo(w / 2 - 8, 281 + press * 3); c.lineTo(w / 2 + 10, 291 + press * 3); c.lineTo(w / 2 - 8, 301 + press * 3); c.closePath(); c.fill();
        c.restore();
      }
      if (tr > 0) {
        c.globalAlpha = tr;
        c.fillStyle = 'rgba(255,255,255,0.08)'; c.fillRect(0, 0, w, 44);
        c.fillStyle = GREEN; c.fillRect(24, 18, 40, 8);
        for (let j = 0; j < 4; j++) {
          const x = j % 2 ? w / 2 + 8 : 24, y = j < 2 ? 62 : 228, gone = j < left;
          c.fillStyle = gone ? 'rgba(33,160,210,0.12)' : '#14294e'; roundRect(c, x, y, w / 2 - 32, 150, 14); c.fill();
          if (gone) { c.strokeStyle = 'rgba(120,200,255,0.55)'; c.lineWidth = 3; roundRect(c, x, y, w / 2 - 32, 150, 14); c.stroke(); }
        }
        c.globalAlpha = 1;
      }
    });
  }

  // Where tiles start (on the laptop's grid), where they hang (an arc facing the partner) and where they
  // end (a 2 x 2 grid in the portal panel).
  hinge.updateMatrixWorld(true);
  const lidQ = new THREE.Quaternion(); lapScreen.getWorldQuaternion(lidQ);
  const START = [[-0.075, 0.045], [0.075, 0.045], [-0.075, -0.045], [0.075, -0.045]].map(([x, y]) => lapScreen.localToWorld(V(x, y, 0.01)));
  const EYE = V(0, 1.2, 0.95);
  const ARC = [V(-0.8, 1.28, -0.1), V(-0.27, 1.37, -0.36), V(0.27, 1.37, -0.36), V(0.8, 1.28, -0.1)];
  const dummy = new THREE.Object3D();
  const ARC_Q = ARC.map((a) => { dummy.position.copy(a); dummy.lookAt(EYE); return dummy.quaternion.clone(); });
  const PC = V(0.2, 1.25, -0.5);
  dummy.position.copy(PC); dummy.lookAt(0.75, 1.25, 1.7); const GRID_Q = dummy.quaternion.clone();
  const gx = V(1, 0, 0).applyQuaternion(GRID_Q), gy = V(0, 1, 0).applyQuaternion(GRID_Q), gz = V(0, 0, 1).applyQuaternion(GRID_Q);
  const GRID = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([c, r]) => PC.clone().addScaledVector(gx, c * (TW / 2 + 0.02)).addScaledVector(gy, r * (TH / 2 + 0.02) - 0.05).addScaledVector(gz, 0.025));

  // The portal panel the tiles fold into, with its header.
  const panel = new THREE.Group(); panel.position.copy(PC); panel.quaternion.copy(GRID_Q); scene.add(panel);
  const PW = TW * 2 + 0.1, PH = TH * 2 + 0.2;
  const panelBody = mesh(new RoundedBoxGeometry(PW, PH, 0.02, 3, 0.022), new THREE.MeshPhysicalMaterial({ color: 0x061024, roughness: 0.3, metalness: 0.4, clearcoat: 1, clearcoatRoughness: 0.2 }), { cast: true, receive: false });
  panelBody.position.y = 0.01; panel.add(panelBody);
  const headTex = canvasTex(1024, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = GREEN; roundRect(c, 24, 46, 46, 46, 10); c.fill();
    c.font = `800 64px ${SANS}`; c.fillStyle = '#eef3ff'; c.textBaseline = 'middle'; c.fillText('PARTNER PORTAL', 96, 72);
  }).tex;
  const header = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.04, (PW - 0.04) / 8), new THREE.MeshBasicMaterial({ map: headTex, transparent: true, toneMapped: false, depthWrite: false }));
  header.position.set(0, PH / 2 - 0.06, 0.012); panel.add(header);
  const panelGlow = glow(0x2a8fd8, 1, 0, 0.5); panelGlow.position.z = -0.12; panelGlow.scale.set(PW * 2, PH * 1.9, 1); panel.add(panelGlow);

  // ----------------------------------------------------------- title
  const client = words('BASF Agriculture', { font: `700 52px ${MONO}`, fg: '#9fd36a', lineH: 0.075 });
  const title = words('Partner Portal', { font: `800 84px ${SANS}`, fg: '#f2f5fb', lineH: 0.15 });
  const line = words('Gave partners financials, orders, activity, and learning content in one place.', { font: `600 44px ${SANS}`, fg: '#b8c7e0', lineH: 0.062, maxW: 700 });
  const titleG = new THREE.Group(); scene.add(titleG);
  [client, title, line].forEach((m) => titleG.add(m));

  // ----------------------------------------------------------- motes in the skylight
  const DN = 90, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd6a8, size: 0.008, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- choreography helpers
  const KEYS = DESK_Y + 0.03;
  const tileState = (i, t, pos, q) => {
    const u = k(t, LIFT(i), LIFT(i) + 0.8), f = k(t, FOLD(i), FOLD(i) + 0.7);
    if (f > 0) {
      const e = eio(f);
      pos.lerpVectors(ARC[i], GRID[i], e); pos.addScaledVector(gz, Math.sin(Math.PI * f) * 0.08);
      q.slerpQuaternions(ARC_Q[i], GRID_Q, e);
      return 1 - 0.04 * Math.sin(Math.PI * f) + 0.025 * Math.sin(Math.PI * k(t, 7.25, 7.6));
    }
    const e = eio(u);
    pos.lerpVectors(START[i], ARC[i], e); pos.y += Math.sin(Math.PI * u) * 0.14;
    pos.y += Math.sin(t * 1.3 + i * 1.7) * 0.006 * e;
    q.slerpQuaternions(lidQ, ARC_Q[i], e);
    return lerp(0.3, 1, back(u));
  };
  const lookPts = [[2.3, START[0].toArray()], [3.0, ARC[0].toArray()], [3.85, ARC[0].toArray()], [4.1, ARC[1].toArray()], [4.6, ARC[1].toArray()], [4.85, ARC[2].toArray()], [5.3, ARC[2].toArray()], [5.55, ARC[3].toArray()], [6.4, ARC[3].toArray()], [7.0, PC.toArray()]];
  // The mug's path: on the desk, up to the lips, tipped, then held at the chest.
  partner.pose({ hip: HIP, yaw: YAW, lean: -0.06, look: PC, feet: (i, o) => o.set(0, 0.085, 0.3), hands: (i, s, o) => o.copy(s).y -= 0.4 });
  const MOUTH = partner.headPos.clone().addScaledVector(PF, 0.13).add(V(0.03, -0.075, 0));
  const HOLD = V(0.2, 0.96, 0.46);
  const mugAt = (t, out) => {
    const lift = eio(k(t, 7.05, 7.6)), lower = eio(k(t, 8.3, 8.85));
    out.copy(MUG0).lerp(MOUTH, lift).lerp(HOLD, lower);
    out.y += Math.sin(Math.PI * k(t, 7.05, 7.6)) * 0.04 + Math.sin(t * 1.4) * 0.003 * lift;
    return 0.75 * Math.sin(Math.PI * k(t, 7.55, 8.35));
  };
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), look = V(0, 0, 0), mugP = V(0, 0, 0), handle = V(0, 0, 0), hip = V(0, 0, 0), tp = V(0, 0, 0), tq = new THREE.Quaternion();

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.8, 1.34, 1.12]], [1.9, [0.72, 1.3, 0.98], L],
    [3.1, [0.42, 1.56, 2.68]], [6.2, [0.14, 1.53, 2.78], L],
    [7.6, [1.32, 1.44, 2.3]], [10, [1.4, 1.45, 2.4], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.02, 0.88, -0.02]], [1.9, [0.01, 0.88, -0.04], L],
    [3.1, [0.0, 1.2, -0.3]], [6.2, [0.0, 1.22, -0.32], L],
    [7.6, [-0.08, 1.2, -0.3]], [10, [-0.1, 1.2, -0.31], L],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.005, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 33], [1.9, 31], [3.1, 34], [6.2, 34], [7.6, 33], [10, 32.5]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // ---- The laptop.
    drawLaptop(t);
    const flash = t > SIGN_IN ? Math.exp(-5 * (t - SIGN_IN)) : 0;
    lapScreen.material.color.setScalar(0.82 + 0.4 * flash);
    lapGlow.material.opacity = 0.22 + 0.45 * flash;

    // ---- The tiles: lift, fill, fold.
    let lit = 0;
    tiles.forEach((tl, i) => {
      const s = tileState(i, t, tp, tq);
      tl.g.position.copy(tp); tl.g.quaternion.copy(tq); tl.g.scale.setScalar(s);
      tl.g.visible = t > LIFT(i) - 0.02;
      const pf = k(t, tl.fill[0], tl.fill[1]);
      const key = String(Math.round(pf * 48));
      if (key !== tl.key) { tl.key = key; tl.ct.redraw((c, w, h) => drawTile(c, w, h, i, pf)); }
      const pop = t > tl.fill[1] ? Math.exp(-4 * (t - tl.fill[1])) : 0;
      tl.halo.material.opacity = 0.12 * eo(k(t, LIFT(i), LIFT(i) + 0.8)) + 0.3 * Math.sin(Math.PI * pf) + 0.35 * pop;
      lit += eo(k(t, LIFT(i), LIFT(i) + 0.8));
    });
    tileL.intensity = 0.55 * lit;

    // ---- The portal panel grows behind the grid as the tiles fold in.
    const pg = back(k(t, 6.4, 7.1));
    panel.scale.set(Math.max(0.001, pg), Math.max(0.001, eo(k(t, 6.4, 6.9))), 1);
    panel.visible = t > 6.4;
    header.material.opacity = eo(k(t, 6.9, 7.3));
    panelGlow.material.opacity = 0.18 * eo(k(t, 6.5, 7.2)) + 0.35 * Math.sin(Math.PI * k(t, 7.2, 7.9));

    // ---- The partner.
    const typing = k(t, 0.6, 0.7) * (1 - k(t, 1.5, 1.6));
    const lean = kf(t, [[0, 0.1], [0.5, 0.17], [2.1, 0.16], [2.8, 0.0], [3.6, 0.06], [6.2, 0.05], [6.9, -0.02], [7.6, -0.08], [8.4, -0.1], [10, -0.08]]);
    hip.copy(HIP); hip.y += Math.sin(t * 1.7) * 0.003;
    const lp = kf(t, lookPts);
    if (t < 2.3) look.copy(lapScreen.getWorldPosition(look)); else look.set(lp[0], lp[1], lp[2]);
    const sip = eio(k(t, 7.15, 7.6)) * (1 - eio(k(t, 8.2, 8.6)));
    const tip = mugAt(t, mugP);
    mug.position.copy(mugP); mug.rotation.set(tip, 0, 0);
    mug.updateMatrixWorld();
    mug.localToWorld(handle.set(0.068, 0.05, 0));
    partner.pose({
      hip, yaw: YAW, lean, look, nod: -0.25 * sip + 0.08 * Math.sin(Math.PI * k(t, 1.85, 2.2)),
      kneePole: tmp2.copy(PF).add(Y),
      feet: (i, out) => { const sg = i ? 1 : -1; out.copy(HIP).addScaledVector(PS, sg * 0.13); out.z = 0.33 + (i ? 0.03 : 0); out.y = 0.085; },
      hands: (i, shp, out) => {
        const right = shp.x > 0, sx = right ? 1 : -1;
        // Keys, with a typing tap.
        out.set(sx * 0.085, KEYS + 0.012 * Math.max(0, Math.sin(t * 23 + i * 2.2)) * typing, 0.15);
        if (right) {
          const toPad = eio(k(t, 1.55, 1.8));
          out.lerp(tmp.set(0.02, KEYS + 0.008, 0.18), toPad);
          out.y -= 0.007 * Math.sin(Math.PI * k(t, SIGN_IN - 0.04, SIGN_IN + 0.12));
        }
        // Off the keys to rest on the desk edge while the tiles fly.
        out.lerp(tmp.set(sx * 0.22, DESK_Y + 0.025, 0.31), eio(k(t, 2.2, 2.75)));
        // A small reach toward the tiles while they fill.
        if (!right) out.lerp(tmp.set(-0.24, DESK_Y + 0.12, 0.2), 0.5 * Math.sin(Math.PI * k(t, 3.3, 5.0)));
        if (right) out.lerp(tmp.copy(handle).add(tmp2.set(0.02, -0.008, 0.035)), eio(k(t, 6.75, 7.05)));
      },
    });

    // ---- The project's name settles beside the portal.
    camera.updateMatrixWorld();
    const ci = back(k(t, 7.8, 8.35)), ti = back(k(t, 7.95, 8.5)), li = eo(k(t, 8.2, 8.8)), out = ei(k(t, 9.25, 9.6));
    titleG.position.set(-1.36, 0, -0.3);
    titleG.lookAt(camera.position.x, 0, camera.position.z);
    [[client, 1.62, ci], [title, 1.5, ti], [line, 1.33, li]].forEach(([m, y, a]) => {
      m.position.set(m.userData.w / 2, y - (1 - clamp(a)) * 0.04, 0);
      m.material.opacity = clamp(a) * (1 - out); m.visible = m.material.opacity > 0.01;
    });

    // Motes turning in the skylight.
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -0.9 + rnd(i, 81) * 1.4 + Math.sin(t * 0.3 + i) * 0.05;
      dpos[i * 3 + 1] = 0.8 + rnd(i, 82) * 1.0 + Math.sin(t * 0.4 + i * 1.3) * 0.03;
      dpos[i * 3 + 2] = -0.6 + rnd(i, 83) * 1.2 + Math.cos(t * 0.25 + i) * 0.04;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.8 };
}
