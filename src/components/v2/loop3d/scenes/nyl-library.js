// New York Lottery design library lit loop, 10 s. "From one page of rules to a library that ships."
// A designer's studio at dusk: a walnut work table under a brass pendant, the city going blue in the
// window behind. The designer holds up the old one-page guideline, lays it on the table and taps it.
// The page comes apart: its color dots lift off as six swatch chips, its first lines as three Aa type
// blocks, the rest as six components (a button, a field, a card, a toggle, a checkbox, a radio), and
// its mark as six icon tiles. Each part arcs into its own bay of a felt-lined type tray, and each bay's
// tag ticks over as it fills: COLOR, TYPE, COMPONENTS, ICONS. The empty page fades. The designer presses
// the publish key; PUBLISHED pops over the tray and three threads of light run out to a monitor, a tablet
// and a phone, whose headers and buttons all turn to the library's saffron. The camera pulls back to the
// project's name.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const SAFF = '#f2b33d', SAFF_H = 0xf2b33d, INK = '#18263a', MID = '#5d6b7a', DIMC = '#a9b4bf', CREAM = '#e6dfd0', PAPER = '#d9cfb9';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const TY = 0.9;                         // table top
const TRAY = V(0.25, TY, 0.02);         // tray centre on the table
const BAY_W = 0.21, BAY_D = 0.4, FELT = 0.012;
const bayX = (c) => TRAY.x - 1.5 * BAY_W + c * BAY_W;
const SHEET_W = 0.3, SHEET_H = 0.42;
const HOLD = V(-0.42, 1.16, -0.4), LAYP = V(-0.48, TY + 0.003, -0.15);
const T_TAP = 1.95, T_PUB = 5.2;
const KEY = V(-0.25, TY, -0.31);
const GROUPS = ['COLOR', 'TYPE', 'COMPONENTS', 'ICONS'];
const G_START = [2.05, 2.55, 3.0, 3.5], G_STEP = [0.07, 0.09, 0.08, 0.07], G_DUR = [0.62, 0.66, 0.66, 0.62];

const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));
const mix = (a, b, p) => { const A = hex(a), B = hex(b); return `rgb(${A.map((x, i) => Math.round(lerp(x, B[i], p))).join(',')})`; };

// A stylized person built from capsules (after the Farxiga loop): every part is placed in world space from
// a few inputs (hip, facing, lean, ankle and wrist targets, where they look), so any frame stands alone.
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
    bun: mesh(new THREE.SphereGeometry(0.058, 16, 12), o.hairM),
    ua: [bone(0.05, 0.21, o.sleeve), bone(0.05, 0.21, o.sleeve)],
    fa: [bone(0.042, 0.2, o.fore), bone(0.042, 0.2, o.fore)],
    hand: [0, 1].map(() => { const h = mesh(new THREE.SphereGeometry(0.04, 14, 10), o.skin); h.scale.set(0.8, 1.15, 1); scene.add(h); return h; }),
    th: [bone(0.07, 0.34, o.pants), bone(0.07, 0.34, o.pants)],
    sh: [bone(0.056, 0.34, o.pants), bone(0.056, 0.34, o.pants)],
    shoe: [0, 1].map(() => { const s = mesh(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.03), o.shoeM); scene.add(s); return s; }),
  };
  [p.head, p.nose, p.hair, p.bun].forEach((m) => scene.add(m));
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
  p.pose = ({ hip, yaw, lean, feet, hands, look, nod = 0 }) => {
    fwdOf(yaw, F); sideOf(yaw, S);
    place(p.pelvis, va.copy(hip).addScaledVector(S, -0.08), vb.copy(hip).addScaledVector(S, 0.08));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      hipI.copy(hip).addScaledVector(S, sg * 0.1);
      feet(i, ank);
      pole.copy(F).addScaledVector(S, sg * 0.08);
      ik(hipI, ank, LT, LS, pole, jnt);
      place(p.th[i], hipI, jnt); place(p.sh[i], jnt, ank);
      p.shoe[i].position.copy(ank).addScaledVector(F, 0.05); p.shoe[i].position.y = Math.max(0.038, ank.y - 0.045);
      p.shoe[i].rotation.set(0, yaw, 0);
    }
    Dn.copy(F).multiplyScalar(lean).add(Y).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    place(p.torso, va.copy(hip).addScaledVector(Dn, 0.1), top);
    p.headPos.copy(top).addScaledVector(Dn, 0.16).addScaledVector(F, 0.015);
    place(p.neck, top, p.headPos);
    lookD.subVectors(look, p.headPos); lookD.y = clamp(lookD.y / Math.max(0.01, Math.hypot(lookD.x, lookD.z)), -1.1, 0.5) * Math.hypot(lookD.x, lookD.z);
    lookD.normalize(); lookD.y -= nod; lookD.normalize();
    p.headPos.addScaledVector(lookD, 0.012);
    p.head.position.copy(p.headPos);
    p.nose.position.copy(p.headPos).addScaledVector(lookD, 0.098);
    p.hair.position.copy(p.headPos).addScaledVector(lookD, -0.014).add(vb.set(0, 0.012, 0));
    p.hair.quaternion.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lookD, -0.4).normalize());
    p.bun.position.copy(p.headPos).addScaledVector(lookD, -0.1).add(vb.set(0, 0.04, 0));
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

// The one-page guideline: a mark, three color dots and nine lines of rules. Each part fades from the
// page as it lifts off: a = [dots, first lines, the rest, mark], 1 = still printed.
function drawSheet(c, w, h, a) {
  c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(80,60,30,0.08)'; c.fillRect(0, 0, w, 6);
  const X = (x) => (x - 120) / 80 * w, Yp = (y) => (y - 24) / 150 * h;
  c.globalAlpha = a[3]; c.fillStyle = INK; c.fillRect(X(132), Yp(36), X(152) - X(132), Yp(56) - Yp(36));
  c.fillStyle = SAFF; c.beginPath(); c.arc(X(142), Yp(46), w * 0.06, 0, 7); c.fill();
  c.globalAlpha = a[0];
  [INK, SAFF, DIMC].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(X(136 + i * 12), Yp(72), w * 0.055, 0, 7); c.fill(); });
  const lw = [60, 52, 58, 40, 56, 48, 60, 36, 50];
  lw.forEach((L, i) => {
    c.globalAlpha = i < 3 ? a[1] : a[2];
    c.fillStyle = i < 3 ? '#3b4656' : '#6d7681'; roundRect(c, X(130), Yp(86 + i * 8) - 4, X(130 + L) - X(130), i < 3 ? 11 : 8, 4); c.fill();
  });
  c.globalAlpha = 1;
}

// A page on one of the three screens. p: how far the library has reached it (0 old, 1 published).
function drawUI(c, w, h, kind, p, badge) {
  c.fillStyle = '#ece5d6'; c.fillRect(0, 0, w, h);
  const hb = kind === 'phone' ? h * 0.08 : h * 0.13;
  c.fillStyle = mix(INK, SAFF, p); c.fillRect(0, 0, w, hb);
  c.fillStyle = mix('#e6dfd0', INK, p); roundRect(c, w * 0.05, hb * 0.3, hb * 0.4, hb * 0.4, 4); c.fill();
  c.fillStyle = mix('#5d6b7a', INK, p); roundRect(c, w * 0.05 + hb * 0.6, hb * 0.42, w * 0.22, hb * 0.16, 4); c.fill();
  const m = w * 0.07;
  let y = hb + h * 0.07;
  c.fillStyle = INK; roundRect(c, m, y, w * (kind === 'phone' ? 0.7 : 0.48), h * 0.05, 6); c.fill(); y += h * 0.085;
  c.fillStyle = '#7d8793'; roundRect(c, m, y, w * (kind === 'phone' ? 0.78 : 0.56), h * 0.025, 5); c.fill(); y += h * 0.045;
  roundRect(c, m, y, w * (kind === 'phone' ? 0.6 : 0.42), h * 0.025, 5); c.fill(); y += h * 0.06;
  const bw = kind === 'phone' ? w * 0.5 : w * 0.2;
  c.fillStyle = mix(DIMC, SAFF, p); roundRect(c, m, y, bw, h * 0.065, h * 0.0325); c.fill();
  y += h * 0.11;
  const n = kind === 'desktop' ? 3 : kind === 'tablet' ? 2 : 1, gap = w * 0.03, cw = (w - m * 2 - gap * (n - 1)) / n, ch = h - y - h * 0.06;
  for (let i = 0; i < n; i++) {
    const x = m + i * (cw + gap);
    c.fillStyle = '#f6f1e6'; roundRect(c, x, y, cw, ch, 10); c.fill();
    c.fillStyle = i === 1 ? '#c9b48a' : '#9fb1c4'; roundRect(c, x, y, cw, ch * 0.5, 10); c.fill();
    c.fillStyle = mix('#7d8793', INK, p); roundRect(c, x + cw * 0.1, y + ch * 0.62, cw * 0.6, ch * 0.08, 4); c.fill();
    c.fillStyle = mix(DIMC, SAFF, p); roundRect(c, x + cw * 0.1, y + ch * 0.78, cw * 0.36, ch * 0.1, 6); c.fill();
  }
  if (badge > 0) {
    const r = Math.min(w, h) * 0.07 * badge, bx = w - r * 1.6 - w * 0.03, by = hb + r * 1.4;
    c.fillStyle = SAFF; c.beginPath(); c.arc(bx, by, r, 0, 7); c.fill();
    c.strokeStyle = INK; c.lineWidth = Math.max(2, r * 0.22); c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(bx - r * 0.45, by); c.lineTo(bx - r * 0.1, by + r * 0.35); c.lineTo(bx + r * 0.5, by - r * 0.35); c.stroke();
  }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0e16);
  scene.fog = new THREE.Fog(0x0a0e16, 5, 13);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the studio
  const floor = mesh(new THREE.PlaneGeometry(14, 10), std(0xffffff, { map: grainTex('#2b2420', { size: 256, speck: 0.1, blot: 0.12, seed: 51, repeat: 6 }), roughness: 0.6 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const WZ = -1.45;
  const wallM = std(0xffffff, { map: grainTex('#1a2232', { size: 256, speck: 0.06, blot: 0.14, seed: 53, repeat: 3 }), roughness: 0.95 });
  const WX0 = -1.35, WX1 = 0.05, WY0 = 1.0, WY1 = 2.55;
  const wallMesh = mesh(mergeGeometries([[-5, WX0, -0.2, 4.2], [WX1, 5, -0.2, 4.2], [WX0, WX1, -0.2, WY0], [WX0, WX1, WY1, 4.2]].map(([x0, x1, y0, y1]) => {
    const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0); return g;
  })), wallM, { cast: false });
  wallMesh.position.z = WZ; scene.add(wallMesh);
  // The window: the city at dusk, a little lit.
  const sky = canvasTex(480, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#16224a'); g.addColorStop(0.55, '#3c4f86'); g.addColorStop(0.8, '#c98a6a'); g.addColorStop(1, '#e8a875');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const bw = 14 + rnd(i, 3) * 40, bh = h * (0.18 + rnd(i, 4) * 0.5), x = (i / 26) * w * 1.08 - 10 + rnd(i, 5) * 8;
      const far = i % 2 === 0;
      c.fillStyle = far ? '#24305a' : '#0f1630'; c.fillRect(x, h - bh * (far ? 1.1 : 0.85), bw, bh * (far ? 1.1 : 0.85));
      if (!far) for (let j = 0; j < 14; j++) { if (rnd(i * 31 + j, 6) > 0.62) { c.fillStyle = 'rgba(255,205,130,0.85)'; c.fillRect(x + 3 + (j % 3) * (bw / 3.2), h - bh * 0.85 + 8 + Math.floor(j / 3) * 14, 3, 5); } }
    }
  });
  const winM = new THREE.MeshBasicMaterial({ map: sky.tex, color: 0xb0b0b0, toneMapped: false, fog: false });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(WX1 - WX0, WY1 - WY0), winM); win.position.set((WX0 + WX1) / 2, (WY0 + WY1) / 2, WZ - 0.04); scene.add(win);
  const frameG = [];
  const bx = (w, h, x, y) => { const g = new THREE.BoxGeometry(w, h, 0.06); g.translate(x, y, 0); frameG.push(g); };
  const WCX = (WX0 + WX1) / 2, WCY = (WY0 + WY1) / 2;
  bx(WX1 - WX0 + 0.08, 0.06, WCX, WY0); bx(WX1 - WX0 + 0.08, 0.06, WCX, WY1); bx(0.06, WY1 - WY0, WX0, WCY); bx(0.06, WY1 - WY0, WX1, WCY);
  bx(0.035, WY1 - WY0, WCX, WCY); bx(WX1 - WX0, 0.035, WCX, WY0 + (WY1 - WY0) * 0.62);
  const frame = mesh(mergeGeometries(frameG), std(0x10141c, { roughness: 0.6 }), { cast: false }); frame.position.z = WZ - 0.01; scene.add(frame);
  const winGlow = glow(0xe8a070, 1, 0.12, 0.5); winGlow.scale.set(1.8, 1.0, 1); winGlow.position.set(WCX, WY0 + 0.25, WZ + 0.05); scene.add(winGlow);

  // The work table.
  const walnut = std(0xffffff, { map: grainTex('#4a2e1e', { size: 256, speck: 0.12, blot: 0.1, seed: 57, repeat: 2 }), roughness: 0.42, metalness: 0.04 });
  const top = mesh(new RoundedBoxGeometry(2.6, 0.05, 0.85, 3, 0.012), walnut); top.position.set(0.2, TY - 0.025, 0); scene.add(top);
  const legG = [[-1.0, -0.33], [1.4, -0.33], [-1.0, 0.33], [1.4, 0.33]].map(([x, z]) => { const g = new THREE.CylinderGeometry(0.022, 0.018, TY - 0.05, 12); g.translate(x, (TY - 0.05) / 2, z); return g; });
  scene.add(mesh(mergeGeometries(legG), std(0x1a1c20, { metalness: 0.8, roughness: 0.35 })));

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5a6c9a, 0x0e0a08, 0.32));
  // The brass pendant over the tray is the key.
  const LAMP = V(TRAY.x, 2.02, TRAY.z);
  const shade = mesh(new THREE.ConeGeometry(0.17, 0.2, 40, 1, true), std(0xb48a4a, { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide }), { cast: false });
  shade.position.copy(LAMP).add(V(0, 0.07, 0)); scene.add(shade);
  const cord = mesh(new THREE.CylinderGeometry(0.005, 0.005, 1.4, 6), std(0x111111), { cast: false }); cord.position.copy(LAMP).add(V(0, 0.87, 0)); scene.add(cord);
  const bulb = glow(0xffd9a0, 0.4, 0.8, 0.35); bulb.position.copy(LAMP).add(V(0, -0.02, 0)); scene.add(bulb);
  const key = new THREE.SpotLight(0xffdcae, 6.5, 0, 0.9, 0.6, 1.4);
  key.position.copy(LAMP); key.target.position.set(TRAY.x - 0.1, TY, TRAY.z - 0.05);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  key.shadow.camera.near = 0.3; key.shadow.camera.far = 3.5;
  scene.add(key, key.target);
  const fill = new THREE.SpotLight(0xdfe4f0, 10, 0, 0.6, 0.9, 1.4);
  fill.position.set(0.5, 2.3, 2.6); fill.target.position.set(0, 1.1, -0.4); scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(0x9fb4ff, 1.3); rim.position.set(-0.4, 2.2, -2.6); scene.add(rim);
  const burstL = new THREE.PointLight(SAFF_H, 0, 1.4, 1.6); burstL.position.copy(LAYP).add(V(0, 0.12, 0)); scene.add(burstL);
  const pubL = new THREE.PointLight(SAFF_H, 0, 1.6, 1.6); pubL.position.copy(TRAY).add(V(0, 0.15, 0.05)); scene.add(pubL);

  // ----------------------------------------------------------- the type tray
  const oak = std(0xffffff, { map: grainTex('#7e5a38', { size: 256, speck: 0.14, blot: 0.08, seed: 61, repeat: 1 }), roughness: 0.5 });
  const TW = BAY_W * 4, WALL = 0.014, WH = 0.05;
  const trayG = [];
  const tb = (w, h, d, x, y, z) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); trayG.push(g); };
  tb(TW + WALL * 2, WH, WALL, 0, WH / 2, -BAY_D / 2 - WALL / 2); tb(TW + WALL * 2, WH * 0.7, WALL, 0, WH * 0.35, BAY_D / 2 + WALL / 2);
  tb(WALL, WH, BAY_D, -TW / 2 - WALL / 2, WH / 2, 0); tb(WALL, WH, BAY_D, TW / 2 + WALL / 2, WH / 2, 0);
  for (let c = 1; c < 4; c++) tb(0.008, WH * 0.8, BAY_D, -TW / 2 + c * BAY_W, WH * 0.4, 0);
  const tray = mesh(mergeGeometries(trayG), oak); tray.position.copy(TRAY); scene.add(tray);
  const felt = mesh(new THREE.BoxGeometry(TW, FELT, BAY_D), std(0x1c2944, { roughness: 1 })); felt.position.copy(TRAY).add(V(0, FELT / 2, 0)); scene.add(felt);
  const bayGlow = GROUPS.map((_, c) => { const g = glow(SAFF_H, 1, 0, 0.5); g.scale.set(0.3, 0.3, 1); g.position.set(bayX(c), TY + 0.05, TRAY.z); scene.add(g); return g; });
  // Bay tags: the name and a status dot that turns saffron when the bay is full.
  const dots = new THREE.InstancedMesh(new THREE.CircleGeometry(0.011, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 4);
  scene.add(dots);
  const tags = GROUPS.map((name, c) => {
    const l = label(name, { font: `700 56px ${MONO}`, fg: '#efe7d6', h: 0.052, pad: 8, track: 3 });
    l.position.set(bayX(c) + 0.012, TY + 0.13, TRAY.z - BAY_D / 2 - 0.01); l.rotation.x = -0.4; scene.add(l);
    const W = l.geometry.parameters.width;
    dots.setColorAt(c, new THREE.Color(0x3a4250));
    dots.setMatrixAt(c, new THREE.Matrix4().makeScale(0.0001, 0.0001, 0.0001));
    return { l, W };
  });
  const WARM = new THREE.Color(0xffe0b0), SAFF_C = new THREE.Color(SAFF_H), DOT_OFF = new THREE.Color(0x3a4250);

  // ----------------------------------------------------------- the parts of the library
  // Each part: where it sits on the page, where it lands in the tray, and what flies.
  const parts = [];
  const sheetLocal = (x, y) => V(LAYP.x + (x - 160) / 80 * SHEET_W, LAYP.y + 0.006, LAYP.z + (y - 99) / 150 * SHEET_H);
  const addPart = (grp, idx, obj, src, dst, inst) => {
    const st = G_START[grp] + idx * G_STEP[grp];
    parts.push({ grp, obj, inst, src, dst, st, du: G_DUR[grp], ax: V(rnd(parts.length, 71) - 0.5, rnd(parts.length, 72) - 0.5, rnd(parts.length, 73) - 0.5).normalize(), spin: (rnd(parts.length, 74) > 0.5 ? 1 : -1) * (2.2 + rnd(parts.length, 75) * 2), arc: 0.26 + rnd(parts.length, 76) * 0.12 });
  };
  // COLOR: six swatch chips.
  const CHIP_COLS = [INK, MID, DIMC, '#d4cab4', SAFF, '#ece6da'];
  const chips = new THREE.InstancedMesh(new RoundedBoxGeometry(0.07, 0.014, 0.07, 2, 0.006), std(0xffffff, { roughness: 0.32, metalness: 0.05 }), 6);
  chips.castShadow = chips.receiveShadow = true; scene.add(chips);
  CHIP_COLS.forEach((col, i) => {
    chips.setColorAt(i, new THREE.Color(col));
    addPart(0, i, null, sheetLocal(136 + (i % 3) * 12, 72), V(bayX(0) + (i % 2 ? 0.045 : -0.045), TY + FELT + 0.007, TRAY.z - 0.12 + Math.floor(i / 2) * 0.12), i);
  });
  // TYPE: three Aa blocks, large to small.
  const aaTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#e8e0cf'; c.fillRect(0, 0, w, h);
    c.fillStyle = INK; c.font = `800 150px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Aa', w / 2, h / 2 + 8);
  }).tex;
  const typeM = std(0xe8e0cf, { roughness: 0.55 }), faceM = std(0xffffff, { map: aaTex, roughness: 0.55, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  [[0.13, 0.034, 0.11], [0.1, 0.028, 0.085], [0.075, 0.022, 0.066]].forEach(([w, h, d], i) => {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(w, h, d, 2, 0.006), typeM));
    const f = mesh(new THREE.PlaneGeometry(w * 0.86, d * 0.86), faceM, { cast: false }); f.rotation.x = -Math.PI / 2; f.position.y = h / 2 + 0.0005; g.add(f);
    scene.add(g);
    addPart(1, i, g, sheetLocal(150, 87 + i * 8), V(bayX(1), TY + FELT + h / 2, TRAY.z - 0.12 + [0, 0.115, 0.215][i]));
  });
  // COMPONENTS: a button, a field, a card, a toggle, a checkbox and a radio.
  const saffM = std(SAFF_H, { roughness: 0.35 }), creamM = std(0xe6dfd0, { roughness: 0.5 }), inkM = std(0x18263a, { roughness: 0.45 });
  const comp = [];
  const cg = () => { const g = new THREE.Group(); scene.add(g); comp.push(g); return g; };
  { const g = cg(); g.add(mesh(new RoundedBoxGeometry(0.15, 0.022, 0.045, 3, 0.011), saffM)); g.userData.h = 0.011; g.userData.at = [0, -0.14]; }
  { const g = cg(); g.add(mesh(new RoundedBoxGeometry(0.16, 0.016, 0.045, 2, 0.006), creamM)); g.userData.h = 0.008; g.userData.at = [0, -0.075]; }
  { const g = cg(); g.add(mesh(new RoundedBoxGeometry(0.09, 0.016, 0.11, 2, 0.008), creamM)); const hd = mesh(new THREE.BoxGeometry(0.086, 0.004, 0.044), saffM, { cast: false }); hd.position.set(0, 0.009, -0.031); g.add(hd); g.userData.h = 0.008; g.userData.at = [-0.045, 0.045]; }
  { const g = cg(); g.add(mesh(new RoundedBoxGeometry(0.065, 0.016, 0.032, 3, 0.008), inkM)); const kn = mesh(new THREE.SphereGeometry(0.013, 16, 12), saffM); kn.position.set(0.016, 0.009, 0); g.add(kn); g.userData.h = 0.008; g.userData.at = [0.055, -0.005]; }
  { const g = cg(); g.add(mesh(new RoundedBoxGeometry(0.035, 0.016, 0.035, 2, 0.006), creamM));
    const ga = new THREE.BoxGeometry(0.004, 0.004, 0.012); ga.rotateY(0.8); ga.translate(-0.006, 0.009, 0.003);
    const gb = new THREE.BoxGeometry(0.004, 0.004, 0.022); gb.rotateY(-0.6); gb.translate(0.004, 0.009, -0.001);
    g.add(mesh(mergeGeometries([ga, gb]), saffM, { cast: false }));
    g.userData.h = 0.008; g.userData.at = [0.055, 0.055]; }
  { const g = cg(); g.add(mesh(new THREE.CylinderGeometry(0.019, 0.019, 0.014, 28), creamM)); const d = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.004, 20), saffM, { cast: false }); d.position.y = 0.008; g.add(d); g.userData.h = 0.007; g.userData.at = [0.055, 0.12]; }
  comp.forEach((g, i) => addPart(2, i, g, sheetLocal(140 + rnd(i, 81) * 40, 110 + i * 7), V(bayX(2) + g.userData.at[0], TY + FELT + g.userData.h, TRAY.z + g.userData.at[1])));
  // ICONS: six slate tiles, each with its glyph.
  const iconAtlas = canvasTex(768, 128, (c, w, h) => {
    for (let i = 0; i < 6; i++) {
      const x0 = i * 128, cx = x0 + 64, cy = 64;
      c.fillStyle = '#25324a'; c.fillRect(x0, 0, 128, 128);
      c.strokeStyle = '#efe5cf'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath();
      if (i === 0) c.arc(cx, cy, 30, 0, 7);
      if (i === 1) c.rect(cx - 28, cy - 28, 56, 56);
      if (i === 2) { c.moveTo(cx, cy - 32); c.lineTo(cx + 32, cy + 26); c.lineTo(cx - 32, cy + 26); c.closePath(); }
      if (i === 3) { c.moveTo(cx - 30, cy); c.lineTo(cx + 30, cy); c.moveTo(cx, cy - 30); c.lineTo(cx, cy + 30); }
      if (i === 4) { c.moveTo(cx - 30, cy - 14); c.lineTo(cx, cy + 16); c.lineTo(cx + 30, cy - 14); }
      if (i === 5) { c.moveTo(cx - 28, cy + 28); c.lineTo(cx + 28, cy - 28); c.moveTo(cx - 6, cy - 28); c.lineTo(cx + 28, cy - 28); c.lineTo(cx + 28, cy + 6); }
      c.stroke();
    }
  }).tex;
  const iconBody = new THREE.InstancedMesh(new RoundedBoxGeometry(0.075, 0.014, 0.075, 2, 0.008), std(0x25324a, { roughness: 0.4, metalness: 0.1 }), 6);
  iconBody.castShadow = iconBody.receiveShadow = true; scene.add(iconBody);
  const iconFaceM = new THREE.MeshStandardMaterial({ map: iconAtlas, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const iconFaces = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.PlaneGeometry(0.064, 0.064); const uv = g.attributes.uv;
    for (let v = 0; v < uv.count; v++) uv.setX(v, (i + uv.getX(v)) / 6);
    const f = mesh(g, iconFaceM, { cast: false }); scene.add(f); iconFaces.push(f);
    addPart(3, i, f, sheetLocal(136 + (i % 3) * 8, 40 + Math.floor(i / 3) * 10), V(bayX(3) + (i % 2 ? 0.045 : -0.045), TY + FELT + 0.007, TRAY.z - 0.12 + Math.floor(i / 2) * 0.12), i);
  }
  const groupDone = G_START.map((s, g) => s + G_STEP[g] * (parts.filter((p) => p.grp === g).length - 1) + G_DUR[g]);
  // Sparks riding with each part in flight.
  const sparkPos = new Float32Array(parts.length * 3);
  const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute('position', new THREE.BufferAttribute(sparkPos, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffc860, size: 0.028, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sparks.frustumCulled = false; scene.add(sparks);

  // ----------------------------------------------------------- the guideline sheet
  const sheetC = canvasTex(360, 504);
  const sheetM = new THREE.MeshStandardMaterial({ map: sheetC.tex, roughness: 0.85, side: THREE.DoubleSide, transparent: true });
  const sheet = mesh(new THREE.PlaneGeometry(SHEET_W, SHEET_H), sheetM);
  scene.add(sheet);
  const tapRing = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 48), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
  tapRing.position.z = 0.003; sheet.add(tapRing);
  let sheetKey = '';
  const drawSheetAt = (a) => {
    const kk = a.map((x) => Math.round(x * 16)).join(',');
    if (kk === sheetKey) return; sheetKey = kk;
    sheetC.redraw((c, w, h) => drawSheet(c, w, h, a.map((x) => Math.round(x * 16) / 16)));
  };

  // ----------------------------------------------------------- the publish key
  const keyBase = mesh(new RoundedBoxGeometry(0.12, 0.024, 0.12, 2, 0.01), std(0x15181d, { roughness: 0.4, metalness: 0.3 })); keyBase.position.copy(KEY).add(V(0, 0.012, 0)); scene.add(keyBase);
  const capTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = SAFF; c.fillRect(0, 0, w, h);
    c.strokeStyle = INK; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(w * 0.28, h * 0.52); c.lineTo(w * 0.44, h * 0.68); c.lineTo(w * 0.74, h * 0.34); c.stroke();
  }).tex;
  const keyCap = new THREE.Group(); scene.add(keyCap);
  keyCap.add(mesh(new RoundedBoxGeometry(0.088, 0.034, 0.088, 3, 0.012), saffM));
  const capFace = mesh(new THREE.PlaneGeometry(0.07, 0.07), std(0xffffff, { map: capTex, roughness: 0.35, emissive: 0xffffff, emissiveMap: capTex, emissiveIntensity: 0 }), { cast: false });
  capFace.rotation.x = -Math.PI / 2; capFace.position.y = 0.0175; keyCap.add(capFace);
  const keyGlow = glow(SAFF_H, 0.35, 0, 0.45); scene.add(keyGlow);

  // ----------------------------------------------------------- the three screens
  const devs = [];
  const addDev = (kind, opts, s, pos, yaw, tilt, cw, ch) => {
    const g = new THREE.Group(); g.position.copy(pos); g.rotation.set(0, yaw, 0); scene.add(g);
    const tiltG = new THREE.Group(); tiltG.rotation.x = -tilt; g.add(tiltG);
    const ph = phone(opts); ph.scale.setScalar(s); tiltG.add(ph);
    const ui = canvasTex(cw, ch);
    ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.needsUpdate = true;
    ph.userData.screen.material.color.setScalar(0.8);
    const gl = glow(0xffe0b0, 1, 0.1, 0.45); gl.scale.set(ph.userData.sw * s * 1.8, ph.userData.sh * s * 1.8, 1); gl.position.z = 0.05; tiltG.add(gl);
    const d = { kind, g, tiltG, ph, ui, gl, key: '' };
    devs.push(d); return d;
  };
  const standM = std(0x2a2d33, { metalness: 0.7, roughness: 0.35 });
  const mon = addDev('desktop', { w: 1.5, h: 0.95, d: 0.06, frame: 0x22252a, notch: false, r: 0.04 }, 0.38, V(1.02, TY + 0.41, -0.2), -0.42, 0, 1024, 630);
  { const n = new THREE.BoxGeometry(0.05, 0.3, 0.025); n.translate(0, -0.2, -0.03); const b = new THREE.BoxGeometry(0.22, 0.012, 0.14); b.translate(0, -0.405, -0.02); mon.g.add(mesh(mergeGeometries([n, b]), standM)); }
  const tab = addDev('tablet', { w: 1.5, h: 1.05, d: 0.05, frame: 0xa8adb4, notch: false, r: 0.07 }, 0.2, V(0.87, TY + 0.115, 0.17), -0.28, 0.32, 1024, 702);
  { const a = new THREE.BoxGeometry(0.2, 0.012, 0.09); a.translate(0, -0.11, -0.03); const b = new THREE.BoxGeometry(0.2, 0.02, 0.01); b.translate(0, -0.1, 0.012); tab.g.add(mesh(mergeGeometries([a, b]), standM)); }
  const phn = addDev('phone', { frame: 0x2a2c31 }, 0.13, V(1.21, TY + 0.105, 0.17), -0.5, 0.25, 474, 1024);
  { const s = mesh(new RoundedBoxGeometry(0.07, 0.02, 0.07, 2, 0.008), standM); s.position.set(0, -0.098, -0.02); phn.g.add(s); }
  scene.updateMatrixWorld(true);
  const SRC = TRAY.clone().add(V(0, 0.07, 0));
  const ARR = [5.82, 5.95, 6.08];
  const beams = devs.map((d, i) => {
    const dst = d.ph.userData.screen.getWorldPosition(V(0, 0, 0));
    const mid = SRC.clone().lerp(dst, 0.5); mid.y += 0.42 + i * 0.05; mid.z += 0.05;
    const curve = new THREE.QuadraticBezierCurve3(SRC.clone(), mid, dst);
    const geo = new THREE.TubeGeometry(curve, 48, 0.0045, 6, false);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: 0xffc04a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
    scene.add(m);
    const head = glow(0xffd88a, 0.12, 0, 0.3); scene.add(head);
    return { m, geo, curve, head, st: ARR[i] - 0.45, total: geo.index.count };
  });

  // ----------------------------------------------------------- words
  const pubTex = canvasTex(512, 112, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = SAFF; roundRect(c, 0, 0, w, h, h / 2); c.fill();
    c.strokeStyle = INK; c.lineWidth = 11; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(48, 58); c.lineTo(66, 76); c.lineTo(98, 38); c.stroke();
    c.fillStyle = INK; c.font = `800 52px ${MONO}`; c.textBaseline = 'middle'; c.fillText('PUBLISHED', 124, h / 2 + 3);
  }).tex;
  const pub = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3 * 112 / 512), new THREE.MeshBasicMaterial({ map: pubTex, transparent: true, toneMapped: false, depthWrite: false }));
  pub.renderOrder = 5; scene.add(pub);
  const pubGlow = glow(SAFF_H, 1, 0, 0.5); pubGlow.scale.set(0.5, 0.2, 1); scene.add(pubGlow);
  const title = label('Design library', { font: `800 64px ${SANS}`, fg: '#f1e9d8', h: 0.17, pad: 12, track: 1 });
  const client = label('New York Lottery', { font: `700 52px ${MONO}`, fg: SAFF, h: 0.08, pad: 8, track: 3 });
  const line = label('Took a one-page guideline to a unified Figma library.', { font: `600 44px ${SANS}`, fg: '#b8c2d4', h: 0.066, pad: 8, track: 0 });
  scene.add(title, client, line);
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width, LWd = line.geometry.parameters.width;

  // ----------------------------------------------------------- the designer
  const skin = new THREE.MeshPhysicalMaterial({ color: 0x7a4e36, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const knit = std(0x9c4a2c, { roughness: 0.92 });
  const des = makePerson(scene, { skin, top: knit, sleeve: knit, fore: knit, pants: std(0x23252b, { roughness: 0.85 }), shoeM: std(0x15161a, { roughness: 0.5 }), hairM: std(0x150f0c, { roughness: 0.9 }), hairCap: 0.56, chestR: 0.15 });
  const ROOT = V(-0.42, 0, -0.69);
  const MONC = mon.ph.userData.screen.getWorldPosition(V(0, 0, 0)), TABC = tab.ph.userData.screen.getWorldPosition(V(0, 0, 0));
  const TRAYC = TRAY.clone().add(V(0, 0.03, 0));
  const lookAt = (t, out) => {
    const pts = [
      [0, HOLD.clone().add(V(0, 0.02, 0))], [1.0, HOLD.clone()], [1.6, LAYP.clone()], [2.15, LAYP.clone()],
      [2.65, V(bayX(0), TY, TRAY.z)], [3.15, V(bayX(1), TY, TRAY.z)], [3.75, V(bayX(2), TY, TRAY.z)], [4.3, V(bayX(3), TY, TRAY.z)],
      [4.85, KEY.clone()], [5.3, KEY.clone()], [5.75, TRAYC.clone().add(V(0, 0.25, 0))], [6.2, MONC.clone()], [6.7, TABC.clone()],
      [7.4, MONC.clone()], [8.6, TRAYC.clone()], [10, TRAYC.clone()],
    ];
    const v = kf(t, pts.map(([tt, p]) => [tt, [p.x, p.y, p.z]]));
    return out.set(v[0], v[1], v[2]);
  };

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.22, 1.52, 1.4]], [1.0, [-0.25, 1.55, 1.3], L], [1.9, [-0.28, 1.78, 1.08]],
    [2.4, [-0.05, 1.86, 1.0]], [4.5, [0.32, 1.82, 0.96], L],
    [5.15, [0.2, 1.7, 1.85]], [5.5, [0.24, 1.68, 1.9], L], [6.4, [0.58, 1.6, 1.78]],
    [7.8, [0.24, 1.74, 2.95]], [10, [0.22, 1.76, 3.1], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.42, 1.17, -0.45]], [1.0, [-0.43, 1.12, -0.4], L], [1.9, [-0.42, 0.95, -0.17]],
    [2.4, [-0.12, 0.93, -0.06]], [4.5, [0.3, 0.93, -0.02], L],
    [5.15, [0.25, 1.04, -0.15]], [5.5, [0.28, 1.05, -0.15], L], [6.4, [0.62, 1.08, -0.1]],
    [7.8, [0.28, 1.22, -0.3]], [10, [0.28, 1.22, -0.3], L],
  ]);
  const camFov = (t) => kf(t, [[0, 33], [1.0, 33], [1.9, 36], [4.5, 36], [5.15, 36], [6.4, 35], [7.8, 37], [10, 37]]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), pp = V(0, 0, 0), hipP = V(0, 0, 0), lk = V(0, 0, 0), F = V(0, 0, 0);
  const m4 = new THREE.Matrix4(), qq = new THREE.Quaternion(), sv = V(1, 1, 1), eu = new THREE.Euler();

  // Where part P is at time t, how it is turned and how big it is.
  const partAt = (P, t) => {
    const p = k(t, P.st, P.st + P.du), e = eio(p);
    const mx = (P.src.x + P.dst.x) / 2, my = Math.max(P.src.y, P.dst.y) + P.arc, mz = (P.src.z + P.dst.z) / 2;
    pp.set(
      (1 - e) * (1 - e) * P.src.x + 2 * (1 - e) * e * mx + e * e * P.dst.x,
      (1 - e) * (1 - e) * P.src.y + 2 * (1 - e) * e * my + e * e * P.dst.y,
      (1 - e) * (1 - e) * P.src.z + 2 * (1 - e) * e * mz + e * e * P.dst.z);
    qq.setFromAxisAngle(P.ax, (1 - e) * P.spin);
    const land = k(t, P.st + P.du, P.st + P.du + 0.22), squash = Math.sin(Math.PI * land) * 0.3 * (1 - land);
    const g = 0.2 + 0.8 * back(k(t, P.st, P.st + P.du * 0.55));
    sv.set(g * (1 + squash * 0.5), g * (1 - squash), g * (1 + squash * 0.5));
    return p;
  };

  function update(t) {
    const cp = camPos(t), cq = camTgt(t);
    camera.position.set(cp[0] + Math.sin(t * 1.1) * 0.005, cp[1] + Math.sin(t * 1.6 + 1) * 0.004, cp[2]);
    tgt.set(cq[0], cq[1], cq[2]); camera.lookAt(tgt);
    camera.fov = camFov(t);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // ---- The sheet: held up, laid down, tapped, emptied, gone.
    const lay = eio(k(t, 1.0, 1.6)), flat = eio(k(t, 1.05, 1.55));
    sheet.position.copy(HOLD).lerp(LAYP, lay);
    sheet.position.y += 0.05 * Math.sin(Math.PI * lay) + 0.006 * Math.sin(t * 1.4) * (1 - lay);
    const fade = k(t, 4.45, 5.0);
    sheet.position.y += 0.04 * eo(fade);
    eu.set(lerp(-0.2 + 0.03 * Math.sin(t * 1.1), -Math.PI / 2, flat), 0.04 * Math.sin(t * 0.8) * (1 - lay), 0.02 * Math.sin(t * 0.9) * (1 - lay));
    sheet.quaternion.setFromEuler(eu);
    sheetM.opacity = 1 - fade; sheet.visible = fade < 0.99;
    sheet.castShadow = fade < 0.3;
    sheet.updateMatrixWorld();
    const gone = (g) => 1 - eo(k(t, G_START[g] - 0.05, G_START[g] + 0.35));
    drawSheetAt([gone(0), gone(1), gone(2), gone(3)]);
    const rp = k(t, T_TAP, T_TAP + 0.55);
    tapRing.scale.setScalar(1 + 4 * eo(rp)); tapRing.material.opacity = 0.9 * Math.sin(Math.PI * rp) * (rp > 0 && rp < 1 ? 1 : 0);
    burstL.intensity = t > T_TAP ? 2.4 * Math.exp(-(t - T_TAP) * 4) : 0;

    // ---- Parts fly from the page into their bays.
    for (let i = 0; i < parts.length; i++) {
      const P = parts[i], p = partAt(P, t), live = t >= P.st;
      if (P.grp === 0 || (P.grp === 3 && P.inst !== undefined)) {
        const im = P.grp === 0 ? chips : iconBody;
        if (!live) sv.setScalar(0.0001);
        im.setMatrixAt(P.inst, m4.compose(pp, qq, sv));
      }
      if (P.obj) {
        P.obj.visible = live;
        P.obj.position.copy(pp); P.obj.quaternion.copy(qq); P.obj.scale.copy(sv);
        if (P.grp === 3) { P.obj.quaternion.multiply(tmpQ.setFromAxisAngle(XA, -Math.PI / 2)); P.obj.position.addScaledVector(tmp.set(0, 1, 0).applyQuaternion(qq), 0.0075 * sv.y); }
      }
      const fly = live && p < 1;
      sparkPos[i * 3] = pp.x; sparkPos[i * 3 + 1] = fly ? pp.y : -5; sparkPos[i * 3 + 2] = pp.z;
    }
    chips.instanceMatrix.needsUpdate = true; iconBody.instanceMatrix.needsUpdate = true;
    sparkGeo.attributes.position.needsUpdate = true;

    // ---- Bays light as they fill; tags tick over.
    const pubP = k(t, T_PUB, T_PUB + 0.5), pubFlash = t > T_PUB ? Math.exp(-(t - T_PUB) * 3.5) : 0;
    for (let c = 0; c < 4; c++) {
      let hit = 0;
      for (const P of parts) if (P.grp === c) { const x = t - (P.st + P.du); if (x > 0) hit = Math.max(hit, Math.exp(-x * 7)); }
      const full = eo(k(t, groupDone[c], groupDone[c] + 0.3));
      bayGlow[c].material.opacity = 0.35 * hit + 0.1 * full + 0.45 * pubFlash * (1 - 0.15 * c);
      const tg = tags[c], show = eo(k(t, G_START[c] - 0.15, G_START[c] + 0.2)), tick = back(k(t, groupDone[c], groupDone[c] + 0.35));
      tg.l.material.opacity = show; tg.l.visible = show > 0.01;
      tg.l.material.color.setScalar(lerp(0.6, 1, clamp(tick)));
      tg.l.position.y = TY + 0.13 - 0.02 * (1 - show);
      dcol.copy(DOT_OFF).lerp(SAFF_C, clamp(tick)).multiplyScalar(show);
      dots.setColorAt(c, dcol);
      dpos.set(tg.l.position.x - tg.W / 2 - 0.006, tg.l.position.y, tg.l.position.z);
      dsc.setScalar(Math.max(0.0001, show * (1 + 0.6 * Math.sin(Math.PI * k(t, groupDone[c], groupDone[c] + 0.35)))));
      dots.setMatrixAt(c, m4.compose(dpos, DQ, dsc));
    }

    dots.instanceMatrix.needsUpdate = true; if (dots.instanceColor) dots.instanceColor.needsUpdate = true;

    // ---- Publish: the key goes down, the library ships to three screens.
    const pressK = t < T_PUB ? eio(k(t, T_PUB - 0.12, T_PUB)) : 1 - eo(k(t, T_PUB + 0.06, T_PUB + 0.3));
    keyCap.position.copy(KEY).add(tmp.set(0, 0.024 + 0.017 - 0.014 * pressK, 0));
    capFace.material.emissiveIntensity = 0.15 + 0.8 * pubFlash + 0.25 * eo(k(t, 4.6, 5.0)) * (t < T_PUB ? 0.5 + 0.5 * Math.sin(t * 9) : 0);
    keyGlow.position.copy(keyCap.position).add(tmp.set(0, 0.03, 0));
    keyGlow.material.opacity = 0.6 * pubFlash + 0.18 * eo(k(t, 4.6, 5.0)) * (t < T_PUB ? 1 : 0);
    pubL.intensity = 3 * pubFlash;
    const pb = back(k(t, T_PUB + 0.12, T_PUB + 0.5)), pout = ei(k(t, 9.2, 9.6));
    pub.position.set(TRAY.x, TY + 0.27 + 0.04 * clamp(pb), TRAY.z - 0.02);
    pub.lookAt(camera.position);
    pub.scale.setScalar(Math.max(0.0001, pb));
    pub.material.opacity = clamp(pb * 2) * (1 - pout); pub.visible = pb > 0.01 && pout < 0.99;
    pubGlow.position.copy(pub.position).add(tmp.set(0, 0, -0.02));
    pubGlow.material.opacity = 0.3 * clamp(pb) * (1 - pout) + 0.4 * pubFlash * (t > T_PUB + 0.12 ? 1 : 0);
    beams.forEach((b, i) => {
      const p = k(t, b.st, ARR[i]), e = eio(p), out = k(t, 6.5 + i * 0.1, 7.2 + i * 0.1);
      const n = Math.floor(e * 48) * 36;
      b.geo.setDrawRange(0, Math.min(b.total, n));
      b.m.visible = p > 0 && out < 1;
      b.m.material.opacity = 0.85 * (1 - out);
      b.curve.getPoint(e, b.head.position);
      b.head.material.opacity = p > 0 && p < 1 ? 1 : 0;
      b.head.scale.setScalar(0.1 + 0.05 * Math.sin(t * 30 + i));
      const d = devs[i], arr = k(t, ARR[i], ARR[i] + 0.35);
      const ui = eio(k(t, ARR[i] - 0.02, ARR[i] + 0.25)), badge = back(k(t, ARR[i] + 0.1, ARR[i] + 0.45));
      const kk = Math.round(ui * 16) + '|' + Math.round(clamp(badge, 0, 1.2) * 16);
      if (kk !== d.key) { d.key = kk; d.ui.redraw((c, w, h) => drawUI(c, w, h, d.kind, Math.round(ui * 16) / 16, Math.round(clamp(badge, 0, 1.2) * 16) / 16)); }
      d.tiltG.scale.setScalar(1 + 0.05 * Math.sin(Math.PI * arr) * (1 - arr));
      const hitA = Math.sin(Math.PI * arr) * (arr > 0 && arr < 1 ? 1 : 0);
      d.gl.material.color.copy(WARM).lerp(SAFF_C, hitA);
      d.gl.material.opacity = 0.1 + 0.08 * ui + 0.45 * hitA;
    });

    // ---- The designer.
    const lean = kf(t, [[0, 0.05], [1.0, 0.07], [1.5, 0.42], [1.75, 0.34], [2.0, 0.36], [2.35, 0.12], [2.7, 0.18], [4.6, 0.2], [5.05, 0.26], [5.3, 0.24], [5.8, 0.04], [10, 0.05]]);
    const sway = Math.sin(t * 0.8) * 0.014;
    hipP.set(ROOT.x + sway, 0.93 + 0.004 * Math.sin(t * 1.6) - 0.05 * lean, ROOT.z - 0.07 * lean);
    lookAt(t, lk);
    const nod = 0.25 * Math.sin(Math.PI * k(t, 6.25, 6.65)) + 0.2 * Math.sin(Math.PI * k(t, 1.62, 1.92));
    fwdOf(0, F);
    des.pose({
      hip: hipP, yaw: 0, lean, look: lk, nod,
      feet: (i, out) => { out.set(ROOT.x + (i ? 1 : -1) * 0.115, 0.085, ROOT.z + (i ? -0.04 : 0.03)); },
      hands: (i, shp, out) => {
        const sg = i ? 1 : -1;
        const side = tmp.copy(shp).add(tmp2.set(sg * 0.05, -0.53, 0.05));
        // Holding the sheet by its edges until it is down.
        const edge = sheet.localToWorld(tmp2.set(sg * (SHEET_W / 2 + 0.012), -0.05, lerp(-0.008, 0.06, flat)));
        const holdW = 1 - eio(k(t, 1.58 + i * 0.06, 1.8 + i * 0.06));
        if (i === 0) {
          // Then the right hand comes to rest on the table edge.
          out.set(-0.73 + 0.004 * Math.sin(t * 1.3), TY + 0.08, -0.37);
          out.lerp(edge, holdW);
        } else {
          const tapP = t < T_TAP ? eio(k(t, T_TAP - 0.14, T_TAP)) : 1 - eo(k(t, T_TAP + 0.04, T_TAP + 0.3));
          const over = V2.set(LAYP.x + 0.02, TY + 0.18 - 0.11 * tapP, LAYP.z + 0.02);
          const rest = V3.set(-0.2, TY + 0.08, -0.37);
          out.copy(over).lerp(rest, eio(k(t, T_TAP + 0.15, T_TAP + 0.6)));
          // The publish key: hover, press, release, then the hand drops to the side.
          const kh = V4.set(KEY.x + 0.005, TY + 0.2 - 0.1 * pressK, KEY.z + 0.01);
          out.lerp(kh, eio(k(t, 4.62, 4.98)));
          out.lerp(side, eio(k(t, 5.45, 6.0)));
          out.lerp(edge, holdW);
        }
      },
    });
  }
  const dcol = new THREE.Color(), dpos = V(0, 0, 0), dsc = V(1, 1, 1), DQ = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), -0.4);
  const tmpQ = new THREE.Quaternion(), XA = V(1, 0, 0), V2 = V(0, 0, 0), V3 = V(0, 0, 0), V4 = V(0, 0, 0);

  // The project's name settles to the right, over the wall.
  const titleUpdate = (t) => {
    const ci = back(k(t, 7.45, 8.0)), ti = back(k(t, 7.6, 8.15)), li = eo(k(t, 7.85, 8.45)), out = ei(k(t, 9.2, 9.6));
    const tx = 0.62, tz = -0.62, ty = 1.74;
    title.position.set(tx, ty + (1 - clamp(ti)) * -0.05, tz);
    title.lookAt(camera.position.x, title.position.y, camera.position.z);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(tx - TWd / 2 + CWd / 2 + 0.012, ty + 0.15 + (1 - clamp(ci)) * -0.04, tz);
    client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;
    line.position.set(tx - TWd / 2 + LWd / 2 + 0.012, ty - 0.13 + (1 - li) * -0.025, tz);
    line.quaternion.copy(title.quaternion);
    line.material.opacity = li * (1 - out); line.visible = line.material.opacity > 0.01;
  };

  return { scene, camera, update: (t) => { update(t); titleUpdate(t); }, duration: D, poster: 8.4 };
}
