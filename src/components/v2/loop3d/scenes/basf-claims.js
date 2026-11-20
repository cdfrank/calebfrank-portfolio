// BASF Agriculture claims system lit loop, 10 s. "One claim, one status, everyone sees it."
// A field-office trailer at a test plot on a rainy afternoon: a fluorescent fixture hangs over a laminate
// table, rain runs past the wide window behind it, banker boxes are stacked against the paneling, and a
// status board with four lamps is mounted on the wall above the window. A grower slides a claim folder
// across the table and the first lamp lights: submitted. The BASF employee opens it and runs a finger
// down the page while the second lamp glows amber: in review. A rubber stamp comes down hard on the page
// and the third lamp turns green: approved. The fourth lamp flashes and green light arcs out to three
// screens at once, the employee's tablet, the grower's phone and the retail partner's phone, which all
// flip to paid. The grower and the partner hold their phones up, the employee nods, and the title
// settles over the table.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const GREEN = '#65ac1e', AMBER = '#f39500', SKY = '#21a0d2';
const STATES = ['SUBMITTED', 'IN REVIEW', 'APPROVED', 'PAID'];
const LIT = [1.55, 2.1, 4.28, 5.15];          // each bulb lights
const IMPACT = 4.25;                          // the stamp lands
const ARRIVE = [5.55, 5.65, 5.75];            // the paid light reaches tablet, grower, partner
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));
// Status reached at time t: 0 none, 1 submitted ... 4 paid. Screens lag the board until the light lands.
const stage = (t) => LIT.filter((x) => t >= x).length;

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
  p.lookD = lookD;
  p.wrist = [V(0, 0, 0), V(0, 0, 0)];
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
      p.wrist[i].copy(wr);
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

// The test plot through the trailer window on a wet afternoon: low overcast, a tree line in the mist,
// rows of young crop split into marked plots by stakes and small flags, and a gravel lane with puddles.
function drawPlot(c, w, h) {
  const HZ = h * 0.5;
  const sky = c.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#5d6873'); sky.addColorStop(1, '#a3adb3');
  c.fillStyle = sky; c.fillRect(0, 0, w, HZ);
  for (let i = 0; i < 14; i++) {
    const g = c.createRadialGradient(rnd(i, 21) * w, rnd(i, 22) * HZ * 0.7, 0, rnd(i, 21) * w, rnd(i, 22) * HZ * 0.7, 80 + rnd(i, 23) * 120);
    g.addColorStop(0, 'rgba(70,80,92,0.35)'); g.addColorStop(1, 'rgba(70,80,92,0)'); c.fillStyle = g; c.fillRect(0, 0, w, HZ);
  }
  c.fillStyle = '#56615f'; c.beginPath(); c.moveTo(0, HZ + 4);
  for (let x = 0; x <= w; x += 10) c.lineTo(x, HZ - 8 - rnd(x, 24) * 18 - Math.sin(x * 0.012) * 8);
  c.lineTo(w, HZ + 4); c.closePath(); c.fill();
  const fg = c.createLinearGradient(0, HZ, 0, h); fg.addColorStop(0, '#5f6d4f'); fg.addColorStop(1, '#2f3a26');
  c.fillStyle = fg; c.fillRect(0, HZ, w, h - HZ);
  // Crop rows converging on the horizon, broken into plots by cross alleys.
  for (let j = -30; j <= 30; j++) {
    c.strokeStyle = j % 2 ? 'rgba(110,150,70,0.55)' : 'rgba(40,50,30,0.5)'; c.lineWidth = 1 + Math.abs(j) * 0.12;
    c.beginPath(); c.moveTo(w / 2 + j * 6, HZ + 2); c.lineTo(w / 2 + j * 70, h); c.stroke();
  }
  [0.12, 0.3, 0.6].forEach((f) => { c.fillStyle = 'rgba(70,62,48,0.85)'; c.fillRect(0, HZ + (h - HZ) * f * f, w, 2 + f * 10); });
  // Plot stakes with small flags.
  for (let i = 0; i < 16; i++) {
    const f = 0.18 + (i % 4) * 0.22, y = HZ + (h - HZ) * f * f, x = w * (0.08 + Math.floor(i / 4) * 0.27 + rnd(i, 25) * 0.06), sz = 0.4 + f;
    c.fillStyle = '#d8d2c4'; c.fillRect(x, y - 26 * sz, 2.5 * sz, 26 * sz);
    c.fillStyle = ['#c8562e', '#e0b22a', '#3f8fc0', '#7fb23a'][i % 4]; c.fillRect(x + 2.5 * sz, y - 26 * sz, 12 * sz, 7 * sz);
  }
  // Gravel lane and puddles.
  c.fillStyle = '#5a5650'; c.beginPath(); c.moveTo(w * 0.86, HZ + 2); c.lineTo(w * 0.9, HZ + 2); c.lineTo(w * 1.2, h); c.lineTo(w * 0.9, h); c.closePath(); c.fill();
  c.fillStyle = 'rgba(170,182,190,0.5)';
  for (let i = 0; i < 5; i++) { c.beginPath(); c.ellipse(w * (0.92 + i * 0.012), HZ + (h - HZ) * (0.25 + i * 0.16), 10 + i * 8, 2 + i * 1.6, 0, 0, 7); c.fill(); }
  // Mist over everything near the horizon.
  const mist = c.createLinearGradient(0, HZ - 60, 0, HZ + 90); mist.addColorStop(0, 'rgba(160,170,176,0)'); mist.addColorStop(0.5, 'rgba(160,170,176,0.5)'); mist.addColorStop(1, 'rgba(160,170,176,0)');
  c.fillStyle = mist; c.fillRect(0, HZ - 60, w, 150);
}

// Rain streaks on a transparent strip; it tiles vertically and scrolls with t.
function drawRain(c, w, h) {
  c.clearRect(0, 0, w, h);
  for (let i = 0; i < 220; i++) {
    const x = rnd(i, 61) * w, y = rnd(i, 62) * h, L = 18 + rnd(i, 63) * 40;
    c.strokeStyle = `rgba(215,228,240,${0.12 + rnd(i, 64) * 0.3})`; c.lineWidth = 1;
    for (const dy of [0, -h]) { c.beginPath(); c.moveTo(x, y + dy); c.lineTo(x - L * 0.08, y + L + dy); c.stroke(); }
  }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1c2127);
  scene.fog = new THREE.Fog(0x1c2127, 5, 12);
  scene.environment = env;
  scene.environmentIntensity = 0.25;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3();

  // ----------------------------------------------------------- the trailer
  // Vinyl tile floor.
  const floorTex = canvasTex(256, 256, (c, w, h) => {
    [[0, 0, '#5b5850'], [128, 0, '#625e55'], [0, 128, '#605c53'], [128, 128, '#58554e']].forEach(([x, y, col]) => {
      c.fillStyle = col; c.fillRect(x, y, 128, 128);
      for (let i = 0; i < 120; i++) { c.fillStyle = `rgba(${rnd(i + x, 71) > 0.5 ? 255 : 0},${rnd(i + x, 71) > 0.5 ? 250 : 0},${rnd(i + x, 71) > 0.5 ? 240 : 0},0.06)`; c.fillRect(x + rnd(i + y, 72) * 128, y + rnd(i + x, 73) * 128, 3, 3); }
    });
    c.fillStyle = 'rgba(20,18,15,0.6)'; c.fillRect(0, 0, w, 2); c.fillRect(0, 128, w, 2); c.fillRect(0, 0, 2, h); c.fillRect(128, 0, 2, h);
  }).tex;
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(20, 20);
  const floor = mesh(new THREE.PlaneGeometry(12, 12), std(0xffffff, { map: floorTex, roughness: 0.5 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Warm-gray wall paneling with grooves every 0.6 m and a darker wainscot.
  const panel = (c, w, h) => {
    c.fillStyle = '#6c665c'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(${rnd(i, 75) > 0.5 ? '255,245,225' : '0,0,0'},0.04)`; c.fillRect(rnd(i, 76) * w, rnd(i, 77) * h, 1 + rnd(i, 78) * 2, 30 + rnd(i, 79) * 120); }
    c.fillStyle = '#4c4840'; c.fillRect(0, h * 0.73, w, h * 0.27);
    c.fillStyle = '#3a3731'; c.fillRect(0, h * 0.725, w, 6);
    c.fillStyle = 'rgba(0,0,0,0.55)'; c.fillRect(0, 0, 3, h);
    c.fillStyle = 'rgba(255,240,220,0.08)'; c.fillRect(3, 0, 2, h);
  };
  const WZ = -1.55, WX = 1.25, WY0 = 0.98, WY1 = 1.92;
  const wallTex = canvasTex(256, 512, panel).tex; wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping; wallTex.repeat.set(1 / 0.6, 1 / 3.4);
  const wallShape = new THREE.Shape([V(-4, 0), V(4, 0), V(4, 3.4), V(-4, 3.4)].map((v) => new THREE.Vector2(v.x, v.y)));
  wallShape.holes.push(new THREE.Path([new THREE.Vector2(-WX, WY0), new THREE.Vector2(-WX, WY1), new THREE.Vector2(WX, WY1), new THREE.Vector2(WX, WY0)]));
  const wall = mesh(new THREE.ShapeGeometry(wallShape), std(0xffffff, { map: wallTex, roughness: 0.8 }), { cast: false });
  wall.position.z = WZ; scene.add(wall);
  const sideTex = canvasTex(256, 512, panel).tex; sideTex.wrapS = THREE.RepeatWrapping; sideTex.repeat.set(5 / 0.6, 1);
  const side = mesh(new THREE.PlaneGeometry(5, 3.4), std(0xd8d4cc, { map: sideTex, roughness: 0.8 }), { cast: false });
  side.rotation.y = Math.PI / 2; side.position.set(-2.6, 1.7, 0.6); scene.add(side);
  // The view and the rain in front of it.
  const view = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), new THREE.MeshBasicMaterial({ map: canvasTex(1024, 512, drawPlot).tex, toneMapped: false, fog: false, color: 0xa4acb4 }));
  view.position.set(0, 1.35, -4.2); scene.add(view);
  const rainTex = canvasTex(256, 512, drawRain).tex; rainTex.wrapS = rainTex.wrapT = THREE.RepeatWrapping; rainTex.repeat.set(3, 1.2);
  const rain = new THREE.Mesh(new THREE.PlaneGeometry(2 * WX + 0.2, WY1 - WY0 + 0.2), new THREE.MeshBasicMaterial({ map: rainTex, transparent: true, opacity: 0.7, depthWrite: false, toneMapped: false, fog: false }));
  rain.position.set(0, (WY0 + WY1) / 2, WZ - 0.25); scene.add(rain);
  // Aluminum window frame: head, sill, jambs and a centre mullion, plus the interior sill ledge.
  const frames = [[0, WY1 + 0.02, WZ, 2 * WX + 0.08, 0.05, 0.1], [0, WY0 - 0.02, WZ, 2 * WX + 0.08, 0.05, 0.1], [-WX - 0.02, (WY0 + WY1) / 2, WZ, 0.05, WY1 - WY0 + 0.08, 0.1], [WX + 0.02, (WY0 + WY1) / 2, WZ, 0.05, WY1 - WY0 + 0.08, 0.1], [0, (WY0 + WY1) / 2, WZ, 0.04, WY1 - WY0, 0.07], [0, WY0 - 0.05, WZ + 0.08, 2 * WX + 0.2, 0.03, 0.18]];
  const frameIM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x8a8f94, { metalness: 0.6, roughness: 0.38 }), frames.length);
  frames.forEach(([x, y, z, w, h, d], i) => { m4.compose(p4.set(x, y, z), q4.identity(), s4.set(w, h, d)); frameIM.setMatrixAt(i, m4); });
  frameIM.castShadow = frameIM.receiveShadow = true; scene.add(frameIM);
  // Banker boxes stacked against the side wall.
  const boxTex = canvasTex(256, 192, (c, w, h) => {
    c.fillStyle = '#a88d68'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(${rnd(i, 81) > 0.5 ? '255,240,210' : '60,40,20'},0.07)`; c.fillRect(rnd(i, 82) * w, rnd(i, 83) * h, 2, 2); }
    c.fillStyle = 'rgba(60,40,20,0.35)'; c.fillRect(0, h * 0.2, w, 3);
    c.fillStyle = '#2b2218'; roundRect(c, w / 2 - 34, h * 0.32, 68, 20, 10); c.fill();
    c.fillStyle = '#e8e2d4'; c.fillRect(w / 2 - 50, h * 0.58, 100, 44);
  }).tex;
  const boxes = [];
  for (let r = 0; r < 3; r++) for (let n = 0; n < 3 - r; n++) boxes.push([-2.3 + rnd(r * 3 + n, 84) * 0.04, 0.155 + r * 0.31, -1.25 + n * 0.45 + r * 0.22, (rnd(r * 3 + n, 85) - 0.5) * 0.16]);
  boxes.push([-1.75, 0.155, -1.3, 0.2], [1.9, 0.155, -1.3, -0.12], [1.9, 0.465, -1.28, 0.05]);
  const boxIM = new THREE.InstancedMesh(new RoundedBoxGeometry(0.4, 0.31, 0.32, 2, 0.012), std(0xffffff, { map: boxTex, roughness: 0.9 }), boxes.length);
  boxes.forEach(([x, y, z, r], i) => { m4.compose(p4.set(x, y, z), q4.setFromAxisAngle(Y, Math.PI / 2 + r), s4.set(1, 1, 1)); boxIM.setMatrixAt(i, m4); });
  boxIM.castShadow = boxIM.receiveShadow = true; scene.add(boxIM);

  // The laminate table on steel legs.
  const BENCH_Y = 0.92;
  const lamTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#8c8a83'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${rnd(i, 86) > 0.5 ? '235,232,222' : '50,48,44'},0.09)`; c.fillRect(rnd(i, 87) * w, rnd(i, 88) * h, 1.5, 1.5); }
  }).tex;
  lamTex.wrapS = lamTex.wrapT = THREE.RepeatWrapping; lamTex.repeat.set(3, 1);
  const bench = mesh(new RoundedBoxGeometry(1.95, 0.05, 0.72, 2, 0.012), std(0xffffff, { map: lamTex, roughness: 0.42 }));
  bench.position.set(0, BENCH_Y - 0.025, 0); scene.add(bench);
  const steel = std(0x3b3e42, { metalness: 0.7, roughness: 0.35 });
  const legIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.022, 0.022, BENCH_Y - 0.05, 12), steel, 4);
  [[-0.88, -0.28], [0.88, -0.28], [-0.88, 0.28], [0.88, 0.28]].forEach(([x, z], i) => { m4.makeTranslation(x, (BENCH_Y - 0.05) / 2, z); legIM.setMatrixAt(i, m4); });
  legIM.castShadow = true; scene.add(legIM);

  // ----------------------------------------------------------- the status board and its lamps
  const BX = [-0.72, -0.24, 0.24, 0.72], BOARD_Y = 2.3, BULB_Y = 2.05, BZ = WZ + 0.07;
  const board = canvasTex(1024, 156);
  const boardM = std(0xffffff, { map: board.tex, roughness: 0.75, emissive: 0xffffff, emissiveMap: board.tex, emissiveIntensity: 0.55 });
  const boardMesh = mesh(new THREE.BoxGeometry(2.04, 0.34, 0.04), steel);
  boardMesh.position.set(0, BOARD_Y, BZ); scene.add(boardMesh);
  const boardFace = mesh(new THREE.PlaneGeometry(2.0, 0.3), boardM, { cast: false });
  boardFace.position.set(0, BOARD_Y, BZ + 0.0205); scene.add(boardFace);
  let boardKey = '';
  const drawBoard = (t) => {
    const n = stage(t), key = String(n);
    if (key === boardKey) return; boardKey = key;
    board.redraw((c, w, h) => {
      c.fillStyle = '#1b2127'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(200,220,240,0.05)'; for (let i = 0; i < 400; i++) c.fillRect(rnd(i, 31) * w, rnd(i, 32) * h, 2, 2);
      STATES.forEach((s, i) => {
        const x = i * w / 4, on = i < n, col = i === 3 || i === 2 ? GREEN : i === 1 ? AMBER : SKY;
        c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(x + 4, 0, 2, h);
        c.font = `800 42px ${SANS}`; c.textBaseline = 'middle'; c.textAlign = 'center';
        c.fillStyle = on ? '#fff3df' : 'rgba(255,235,210,0.42)';
        c.fillText(s, x + w / 8, h * 0.42);
        c.fillStyle = on ? col : 'rgba(255,235,210,0.14)'; roundRect(c, x + w / 8 - 54, h * 0.72, 108, 12, 6); c.fill();
      });
      c.textAlign = 'left';
    });
  };
  const bulbIM = new THREE.InstancedMesh(new THREE.SphereGeometry(0.055, 20, 14), new THREE.MeshBasicMaterial({ toneMapped: false }), 4);
  const cordIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 6), std(0x1a1512, { roughness: 0.6 }), 4);
  BX.forEach((x, i) => {
    m4.makeTranslation(x, BULB_Y, BZ + 0.06); bulbIM.setMatrixAt(i, m4);
    m4.compose(p4.set(x, (BOARD_Y - 0.15 + BULB_Y) / 2 + 0.03, BZ + 0.06), q4.identity(), s4.set(1, BOARD_Y - 0.15 - BULB_Y - 0.06, 1)); cordIM.setMatrixAt(i, m4);
  });
  scene.add(bulbIM, cordIM);
  const BULB_COL = [new THREE.Color(SKY), new THREE.Color(AMBER), new THREE.Color(GREEN), new THREE.Color(GREEN)];
  const OFF = new THREE.Color(0x2c3238), bc = new THREE.Color();
  const bulbGlows = BX.map((x, i) => { const g = glow(BULB_COL[i].getHex(), 0.5, 0, 0.45); g.position.set(x, BULB_Y, BZ + 0.1); scene.add(g); return g; });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x8f9bab, 0x1a1712, 0.3));
  // Key: the fluorescent fixture over the table, a broad soft cone.
  const fixPos = V(0.05, 2.62, 0.2);
  const key = new THREE.SpotLight(0xeef3ff, 24, 0, 1.0, 0.9, 1.3);
  key.position.copy(fixPos); key.target.position.set(-0.05, 0.9, -0.1);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
  key.shadow.camera.near = 0.6; key.shadow.camera.far = 5;
  scene.add(key, key.target);
  const housing = mesh(new RoundedBoxGeometry(1.25, 0.07, 0.32, 2, 0.015), std(0x9aa0a4, { metalness: 0.4, roughness: 0.5 }), { cast: false });
  housing.position.copy(fixPos).add(V(0, 0.07, 0)); scene.add(housing);
  const diffuser = new THREE.Mesh(new THREE.PlaneGeometry(1.17, 0.25), new THREE.MeshBasicMaterial({ color: 0xc4ced8, toneMapped: false }));
  diffuser.rotation.x = Math.PI / 2; diffuser.position.copy(fixPos).add(V(0, 0.032, 0)); scene.add(diffuser);
  const fixGlow = glow(0xdfe8ff, 0.3, 0.9, 0.3); fixGlow.position.copy(fixPos); scene.add(fixGlow);
  // Rim: cool daylight from the window.
  const daylight = new THREE.DirectionalLight(0xa9bfd6, 1.5); daylight.position.set(0.3, 1.9, -5); scene.add(daylight);
  const greenL = new THREE.PointLight(0x7fe04a, 0, 3.5, 1.5); greenL.position.set(0, 1.6, 0.2); scene.add(greenL);

  // ----------------------------------------------------------- the three people
  const skinOf = (c) => new THREE.MeshPhysicalMaterial({ color: c, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const polo = std(0x123d73, { roughness: 0.85 });
  const emp = makePerson(scene, { skin: skinOf(0x8a5a3e), top: polo, sleeve: polo, fore: skinOf(0x8a5a3e), pants: std(0x7d6e50, { roughness: 0.85 }), shoeM: std(0x22201e, { roughness: 0.5 }), hairM: std(0x17120f, { roughness: 0.9 }), hairCap: 0.48, chestR: 0.15 });
  const canvasM = std(0x7a5a34, { roughness: 0.92 });
  const grower = makePerson(scene, { skin: skinOf(0xd6a083), top: canvasM, sleeve: std(0x9a3426, { roughness: 0.9 }), fore: std(0x9a3426, { roughness: 0.9 }), pants: std(0x2c3e5a, { roughness: 0.85 }), shoeM: std(0x3a2618, { roughness: 0.6 }), hairM: std(0x6a4a2a, { roughness: 0.9 }), hairCap: 0.55, chestR: 0.155 });
  const vest = std(0x34525c, { roughness: 0.9 }), sleeveP = std(0x8a98aa, { roughness: 0.85 });
  const partner = makePerson(scene, { skin: skinOf(0x6e4630), top: vest, sleeve: sleeveP, fore: sleeveP, pants: std(0x2c2f34, { roughness: 0.85 }), shoeM: std(0x1b1d20, { roughness: 0.5 }), hairM: std(0x0f0c0b, { roughness: 0.9 }), hairCap: 0.52, chestR: 0.14 });
  // The grower's cap.
  const capM = std(0x2f5a2a, { roughness: 0.8 });
  const crown = mesh(new THREE.SphereGeometry(0.114, 20, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), capM); scene.add(crown);
  const brim = mesh(new RoundedBoxGeometry(0.17, 0.012, 0.1, 2, 0.005), capM); scene.add(brim);
  const cx = V(0, 0, 0), cy = V(0, 0, 0), cz = V(0, 0, 0), cm = new THREE.Matrix4();
  const placeCap = (p) => {
    cz.copy(p.lookD); cz.y = 0; cz.normalize();
    cy.copy(Y).addScaledVector(p.lookD, -0.25).normalize();
    cx.crossVectors(cy, cz).normalize(); cz.crossVectors(cx, cy);
    cm.makeBasis(cx, cy, cz);
    crown.quaternion.setFromRotationMatrix(cm); crown.position.copy(p.headPos).addScaledVector(cy, 0.012);
    brim.quaternion.copy(crown.quaternion); brim.position.copy(p.headPos).addScaledVector(cy, 0.03).addScaledVector(cz, 0.12);
  };

  const EMP = V(0.05, 0.95, -0.56), EMP_YAW = 0;
  const GR0 = V(-1.52, 0, 0.26), GR1 = V(-1.2, 0, 0.14), GR_YAW = Math.PI / 2 - 0.3;
  const PA = V(1.24, 0, 0.18), PA_YAW = -Math.PI / 2 + 0.3;

  // ----------------------------------------------------------- the claim folder
  const FW = 0.24, FD = 0.31, FT = 0.008;
  const folder = new THREE.Group(); scene.add(folder);
  const manila = std(0xd9b878, { roughness: 0.85 });
  const backCover = mesh(new THREE.BoxGeometry(FW, FT, FD), manila); backCover.position.y = FT / 2; folder.add(backCover);
  const pageCT = canvasTex(384, 496);
  const page = mesh(new THREE.PlaneGeometry(FW - 0.02, FD - 0.02), std(0xffffff, { map: pageCT.tex, roughness: 0.8 }), { cast: false });
  page.rotation.x = -Math.PI / 2; page.position.y = FT + 0.0012; folder.add(page);
  const hingeG = new THREE.Group(); hingeG.position.set(-FW / 2, FT + 0.003, 0); folder.add(hingeG);
  // The cover's top face carries the word; drawn upside down because a box's top face maps the canvas
  // top to the near edge.
  const coverTex = canvasTex(256, 330, (c, w, h) => {
    c.fillStyle = '#d9b878'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { c.fillStyle = `rgba(120,80,30,${rnd(i, 41) * 0.08})`; c.fillRect(rnd(i, 42) * w, rnd(i, 43) * h, 2, 2); }
    c.save(); c.translate(w, h); c.rotate(Math.PI);
    c.font = `800 56px ${MONO}`; c.fillStyle = '#5a3a14'; c.textBaseline = 'middle'; c.fillText('CLAIM', 30, 70);
    c.fillStyle = 'rgba(90,58,20,0.5)'; c.fillRect(30, 108, 120, 6);
    c.restore();
  }).tex;
  const cover = mesh(new THREE.BoxGeometry(FW, 0.005, FD), std(0xffffff, { map: coverTex, roughness: 0.85 })); cover.position.set(FW / 2, 0.0025, 0); hingeG.add(cover);
  let pageKey = '';
  const drawPage = (t) => {
    const line = clamp(Math.floor(k(t, 2.4, 3.3) * 6), 0, 5), tracing = t > 2.4 && t < 3.35 ? 1 : 0, sp = back(k(t, IMPACT, IMPACT + 0.25));
    const key = [line, tracing, Math.round(sp * 20)].join('|');
    if (key === pageKey) return; pageKey = key;
    pageCT.redraw((c, w, h) => {
      c.fillStyle = '#efe6d2'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#2b2a26'; c.font = `800 46px ${MONO}`; c.textBaseline = 'middle'; c.fillText('CLAIM', 28, 46);
      c.fillStyle = '#123d73'; c.fillRect(28, 78, w - 56, 5);
      for (let i = 0; i < 6; i++) {
        const y = 108 + i * 30;
        if (tracing && i === line) { c.fillStyle = 'rgba(255,200,60,0.45)'; c.fillRect(22, y - 6, w - 44, 24); }
        c.fillStyle = 'rgba(40,36,30,0.55)'; roundRect(c, 28, y, 80 + rnd(i, 3) * 40, 10, 5); c.fill();
        c.fillStyle = 'rgba(40,36,30,0.3)'; roundRect(c, 150, y, (w - 180) * (0.5 + rnd(i, 4) * 0.5), 10, 5); c.fill();
      }
      // An evidence photo: rows of a field.
      const g = c.createLinearGradient(0, 300, 0, 400); g.addColorStop(0, '#93a7b8'); g.addColorStop(0.35, '#6f8a3a'); g.addColorStop(1, '#3c5420');
      c.fillStyle = g; c.fillRect(28, 300, 150, 100);
      c.strokeStyle = 'rgba(30,45,15,0.6)'; c.lineWidth = 2; for (let j = -5; j <= 5; j++) { c.beginPath(); c.moveTo(103 + j * 6, 335); c.lineTo(103 + j * 26, 400); c.stroke(); }
      c.fillStyle = 'rgba(40,36,30,0.3)'; roundRect(c, 196, 316, 150, 10, 5); c.fill(); roundRect(c, 196, 340, 110, 10, 5); c.fill();
      c.strokeStyle = 'rgba(40,36,30,0.6)'; c.lineWidth = 2; c.beginPath(); c.moveTo(28, 450); c.lineTo(200, 450); c.stroke();
      if (sp > 0) {
        c.save(); c.translate(w * 0.62, h * 0.8); c.rotate(-0.16); c.scale(sp, sp); c.globalAlpha = Math.min(1, sp);
        c.strokeStyle = '#3f8a12'; c.lineWidth = 7; roundRect(c, -128, -40, 256, 80, 14); c.stroke();
        c.fillStyle = '#3f8a12'; c.font = `900 46px ${SANS}`; c.textAlign = 'center'; c.fillText('APPROVED', 0, 4);
        c.restore(); c.textAlign = 'left';
      }
    });
  };

  // ----------------------------------------------------------- the stamp
  const stamp = new THREE.Group(); scene.add(stamp);
  const sBase = mesh(new RoundedBoxGeometry(0.11, 0.035, 0.07, 2, 0.008), std(0x6b3a1e, { roughness: 0.45 })); sBase.position.y = 0.024; stamp.add(sBase);
  const sHandle = mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.08, 14), std(0x8a5a30, { roughness: 0.4 })); sHandle.position.y = 0.08; stamp.add(sHandle);
  const sKnob = mesh(new THREE.SphereGeometry(0.03, 18, 12), std(0x1d1a18, { roughness: 0.3, metalness: 0.2 })); sKnob.position.y = 0.13; stamp.add(sKnob);
  const STAMP0 = V(-0.4, BENCH_Y, -0.3);
  const inkGlow = glow(0x9cff5a, 0.4, 0, 0.45); scene.add(inkGlow);

  // ----------------------------------------------------------- screens: the employee's tablet, two phones
  const screens = [];
  const makeScreen = (w, h, d, role, cw, ch) => {
    const g = new THREE.Group(); scene.add(g);
    g.add(mesh(new RoundedBoxGeometry(w, h, d, 3, Math.min(w, h) * 0.12), std(0x1c1f24, { metalness: 0.8, roughness: 0.3 })));
    const ct = canvasTex(cw, ch);
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.9), new THREE.MeshBasicMaterial({ map: ct.tex, toneMapped: false, color: 0xd8d8d8 }));
    sc.position.z = d / 2 + 0.0008; g.add(sc);
    const s = { g, ct, sc, role, key: '' };
    screens.push(s); return s;
  };
  const tablet = makeScreen(0.3, 0.2, 0.012, 'EMPLOYEE', 512, 340);
  const stand = mesh(new THREE.BoxGeometry(0.2, 0.012, 0.12), std(0x2a2724, { metalness: 0.6, roughness: 0.4 })); stand.position.set(0.47, BENCH_Y + 0.006, -0.2); scene.add(stand);
  tablet.g.position.set(0.47, BENCH_Y + 0.1, -0.22); tablet.g.rotation.set(-0.5, -0.12, 0);
  const phoneG = makeScreen(0.085, 0.17, 0.01, 'CUSTOMER', 256, 512);
  const phoneP = makeScreen(0.085, 0.17, 0.01, 'PARTNER', 256, 512);
  // What every screen shows: who is looking, the claim and its four steps.
  const drawScreen = (s, n, flash) => {
    s.ct.redraw((c, w, h) => {
      const land = w > h;
      const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#102344'); bg.addColorStop(1, '#060f20');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      const u = land ? h / 340 : w / 256;
      c.font = `700 ${Math.round(20 * u)}px ${MONO}`; c.fillStyle = 'rgba(200,220,255,0.7)'; c.textBaseline = 'middle';
      c.fillText(s.role, 18 * u, 26 * u);
      c.font = `800 ${Math.round(34 * u)}px ${SANS}`; c.fillStyle = '#f2f5fb'; c.fillText('CLAIM', 18 * u, 64 * u);
      const rows = land ? [0, 1, 2, 3].map((i) => [18 * u + (i % 2) * w / 2, 112 * u + Math.floor(i / 2) * 50 * u]) : [0, 1, 2, 3].map((i) => [18 * u, 118 * u + i * 52 * u]);
      STATES.forEach((st, i) => {
        const [x, y] = rows[i], done = i < n, cur = i === n - 1;
        c.fillStyle = done ? (i === 1 ? AMBER : i === 0 ? SKY : GREEN) : 'rgba(255,255,255,0.14)';
        c.beginPath(); c.arc(x + 12 * u, y, 11 * u, 0, 7); c.fill();
        if (done) { c.strokeStyle = '#06101f'; c.lineWidth = 3 * u; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + 7 * u, y); c.lineTo(x + 11 * u, y + 4 * u); c.lineTo(x + 18 * u, y - 4 * u); c.stroke(); }
        c.font = `${cur ? 800 : 600} ${Math.round(18 * u)}px ${SANS}`; c.fillStyle = done ? '#eef3ff' : 'rgba(238,243,255,0.4)';
        c.fillText(st, x + 32 * u, y + 1);
      });
      if (n >= 4) {
        const by = land ? h - 70 * u : h - 140 * u, bh = land ? 56 * u : 110 * u;
        c.fillStyle = `rgba(101,172,30,${0.85 + 0.15 * flash})`; roundRect(c, 14 * u, by, w - 28 * u, bh, 14 * u); c.fill();
        c.fillStyle = '#06101f'; c.font = `900 ${Math.round((land ? 34 : 52) * u)}px ${SANS}`; c.textAlign = 'center';
        c.fillText('PAID', w / 2 + (land ? 0 : 0), by + bh / 2 + 2); c.textAlign = 'left';
      }
    });
  };

  // ----------------------------------------------------------- the paid light: three arcs of motes
  const TN = 12, trailPos = new Float32Array(3 * TN * 3);
  const trailGeo = new THREE.BufferGeometry(); trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
  const trail = new THREE.Points(trailGeo, new THREE.PointsMaterial({ map: glow(0xffffff).material.map, color: 0x9cff5a, size: 0.09, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  trail.frustumCulled = false; scene.add(trail);
  const screenGlows = screens.map(() => { const g = glow(0x9cff5a, 0.4, 0, 0.45); scene.add(g); return g; });

  // ----------------------------------------------------------- title
  const titleG = new THREE.Group(); scene.add(titleG);
  const client = words('BASF Agriculture', { font: `700 52px ${MONO}`, fg: '#a6d86e', lineH: 0.07 });
  const title = words('Claims system', { font: `800 84px ${SANS}`, fg: '#fbf3e6', lineH: 0.15 });
  const line = words('A claims experience for employees, customers, and partners.', { font: `600 44px ${SANS}`, fg: '#e6c9a6', lineH: 0.058 });
  const titleBack = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: canvasTex(256, 64, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(10,6,4,0)'); g.addColorStop(0.2, 'rgba(10,6,4,0.72)'); g.addColorStop(0.8, 'rgba(10,6,4,0.72)'); g.addColorStop(1, 'rgba(10,6,4,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex, transparent: true, toneMapped: false, depthWrite: false, fog: false }));
  titleG.add(titleBack, client, title, line);

  // ----------------------------------------------------------- dust in the lamp light
  const DN = 120, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd09a, size: 0.01, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- choreography helpers
  const FOLD0 = V(-0.86, BENCH_Y, 0.16), FOLD1 = V(-0.03, BENCH_Y, -0.13), CARRY = V(-1.08, 0.86, 0.34);
  // The folder: carried at the grower's side, set down, slid across to the employee.
  const folderAt = (t, out) => {
    const set = eio(k(t, 0.85, 1.15)), slide = eo(k(t, 1.15, 1.6));
    out.copy(FOLD0).lerp(FOLD1, slide);
    out.lerp(CARRY, 1 - set);
    out.y += Math.sin(Math.PI * set) * 0.03 * (1 - set);
    return [lerp(-1.25, 0, set), lerp(0.25, 0.04, slide)];
  };
  const stampAt = (t, out) => {
    const grab = eio(k(t, 3.62, 3.85)), over = eio(k(t, 3.85, 4.12)), slam = ei(k(t, 4.12, IMPACT)), up = eio(k(t, 4.4, 4.62)), home = eio(k(t, 4.62, 5.0));
    const HOVER = V(FOLD1.x + 0.05, BENCH_Y + 0.2, FOLD1.z + 0.08), HIT = V(FOLD1.x + 0.05, BENCH_Y + FT + 0.002, FOLD1.z + 0.08);
    out.copy(STAMP0); out.y += 0.12 * grab;
    out.lerp(HOVER, over);
    out.y += 0.06 * Math.sin(Math.PI * k(t, 3.95, 4.15));           // a wind-up before it comes down
    out.lerp(HIT, slam);
    if (t > IMPACT) out.y += 0.006 * Math.abs(Math.sin((t - IMPACT) * 40)) * Math.exp(-14 * (t - IMPACT));
    out.lerp(HOVER, up).lerp(STAMP0, home);
    return 0.2 * over * (1 - home) + 0.25 * (1 - over) * grab;
  };
  const fP = V(0, 0, 0), sP = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), look = V(0, 0, 0), hip = V(0, 0, 0), root = V(0, 0, 0), fw = V(0, 0, 0), sd = V(0, 0, 0);
  const SHOW_G = V(-0.98, 1.38, 0.5), SHOW_P = V(1.02, 1.38, 0.52), CAM_SHOW = V(0, 1.5, 4.0);
  // Where each head roughly sits, for the others to look at (fixed, so no frame depends on the last).
  const EMP_HEAD = V(0.05, 1.6, -0.45), GR_HEAD = V(-1.2, 1.6, 0.14), PA_PHONE = V(1.05, 1.15, 0.3), GR_PHONE = V(-1.05, 1.1, 0.2);
  const BULB4 = V(BX[3], BULB_Y, BZ + 0.08);
  const pq = new THREE.Quaternion(), pq2 = new THREE.Quaternion(), dummy = new THREE.Object3D();

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.45, 1.5, 3.0]], [1.6, [-0.2, 1.55, 2.65]],
    [2.5, [0.32, 1.7, 1.98]], [3.6, [0.28, 1.68, 1.94], L],
    [4.2, [0.16, 1.6, 1.84]], [4.6, [0.15, 1.6, 1.85], L],
    [5.5, [0.18, 1.5, 4.35]], [7.0, [0.12, 1.48, 4.2], L],
    [8.0, [0.0, 1.36, 3.6]], [10, [0.0, 1.37, 3.72], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.6, 1.24, 0.05]], [1.6, [-0.25, 1.16, -0.05]],
    [2.5, [-0.04, 1.22, -0.2]], [3.6, [-0.05, 1.22, -0.2], L],
    [4.2, [-0.07, 1.2, -0.2]], [4.6, [-0.07, 1.2, -0.2], L],
    [5.5, [0.0, 1.55, -0.6]], [7.0, [0.0, 1.52, -0.55], L],
    [8.0, [0.0, 1.22, -0.1]], [10, [0.0, 1.22, -0.1], L],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    const shake = t > IMPACT ? Math.exp(-10 * (t - IMPACT)) * 0.008 : 0;
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.005 + Math.sin(t * 60) * shake, p[1] + Math.sin(t * 1.6 + 1) * 0.004 + Math.cos(t * 47) * shake, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.5, 33], [4.6, 31], [5.5, 36], [8.0, 34], [10, 33.5]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    const n = stage(t);

    // ---- The board and its bulbs.
    drawBoard(t);
    BX.forEach((x, i) => {
      const on = k(t, LIT[i], LIT[i] + 0.12), pop = t > LIT[i] ? Math.exp(-5 * (t - LIT[i])) : 0;
      let lvl = on * (0.85 + 0.6 * pop);
      if (i === 1 && t > LIT[1] && t < LIT[2]) lvl *= 0.75 + 0.25 * Math.sin((t - LIT[1]) * 7);
      bc.copy(OFF).lerp(BULB_COL[i], clamp(on)).multiplyScalar(0.6 + 1.6 * lvl);
      bulbIM.setColorAt(i, bc);
      bulbGlows[i].material.opacity = 0.55 * lvl;
      bulbGlows[i].scale.setScalar(0.42 + 0.4 * pop + (i === 3 ? 0.6 * pop : 0));
    });
    bulbIM.instanceColor.needsUpdate = true;

    // ---- The folder.
    const [fRoll, fYaw] = folderAt(t, fP);
    folder.position.copy(fP); folder.rotation.set(0, fYaw, fRoll);
    const open = eio(k(t, 1.98, 2.38)) * (1 - eio(k(t, 5.9, 6.3)));
    hingeG.rotation.z = Math.PI * 0.985 * open;
    drawPage(t);

    // ---- The stamp.
    const sTilt = stampAt(t, sP);
    stamp.position.copy(sP); stamp.rotation.set(0, 0.1, sTilt * 0.5);
    const hit = t > IMPACT ? Math.exp(-6 * (t - IMPACT)) : 0;
    inkGlow.position.set(FOLD1.x + 0.05, BENCH_Y + 0.03, FOLD1.z + 0.08);
    inkGlow.material.opacity = 0.7 * hit; inkGlow.scale.setScalar(0.25 + 0.5 * (1 - hit));

    // ---- The employee: pulls the folder in, opens it, reads, stamps, closes it, nods at the grower.
    const lean = kf(t, [[0, 0.05], [1.5, 0.06], [1.9, 0.2], [3.3, 0.24], [3.9, 0.22], [4.25, 0.32], [4.7, 0.2], [5.3, 0.06], [6.2, 0.12], [6.6, 0.04], [10, 0.03]]);
    hip.copy(EMP); hip.x += Math.sin(t * 0.8) * 0.008; hip.y += Math.sin(t * 1.7) * 0.003 - 0.012 * Math.sin(Math.PI * k(t, 4.1, 4.5));
    if (t < 1.4) look.copy(GR_HEAD);
    else if (t < 5.2) look.copy(FOLD1).add(tmp.set(0, 0, 0.02));
    else if (t < 5.75) look.copy(tablet.g.position);
    else look.copy(GR_HEAD);
    if (t < 1.4) look.lerp(fP, eio(k(t, 0.9, 1.4)));
    emp.pose({
      hip, yaw: EMP_YAW, lean, look, nod: 0.22 * Math.sin(Math.PI * k(t, 6.4, 6.85)),
      feet: (i, out) => { out.copy(EMP).setY(0.085); out.x += (i ? 1 : -1) * 0.11; out.z -= 0.02; },
      hands: (i, shp, out) => {
        const sx = i ? 1 : -1;
        // Rest: palms on the bench, either side of the folder.
        out.set(FOLD1.x + sx * 0.27, BENCH_Y + 0.03, FOLD1.z - 0.1);
        // Both hands draw the folder in as it arrives.
        out.lerp(tmp.set(FOLD1.x + sx * 0.13, BENCH_Y + 0.025, FOLD1.z + 0.04), Math.sin(Math.PI * k(t, 1.5, 1.98)));
        if (i === 1) {
          // Left hand swings the cover over, then closes it at the end.
          const sweep = (a) => tmp2.set(FOLD1.x - FW / 2 + Math.cos(a) * FW, BENCH_Y + FT + Math.sin(a) * FW * 0.95 + 0.02, FOLD1.z + 0.03);
          out.lerp(sweep(Math.PI * open), Math.sin(Math.PI * k(t, 1.9, 2.48)) + Math.sin(Math.PI * k(t, 5.82, 6.4)));
          // Reaching to tap the tablet when paid lands there.
          out.lerp(tmp2.set(0.42, BENCH_Y + 0.14, -0.2), Math.sin(Math.PI * k(t, 5.2, 5.85)));
        } else {
          // Right hand: a finger runs down the page line by line, then takes the stamp.
          const tr = k(t, 2.4, 3.3), ln = Math.floor(tr * 6);
          tmp2.set(FOLD1.x + lerp(-0.06, 0.05, (tr * 6) % 1), BENCH_Y + 0.03, FOLD1.z - 0.1 + ln * 0.019 + 0.005);
          out.lerp(tmp2, Math.sin(Math.PI * k(t, 2.25, 3.45)));
          const hold = eio(k(t, 3.42, 3.66)) * (1 - eio(k(t, 4.95, 5.25)));
          out.lerp(tmp2.copy(sP).add(tmp.set(0.03, 0.12, 0.03)), hold);
        }
      },
    });

    // ---- The grower: steps up, sets the folder down and slides it over, then shows the phone.
    const step = eio(k(t, 0.3, 0.95));
    root.copy(GR0).lerp(GR1, step);
    fwdOf(GR_YAW, fw); sideOf(GR_YAW, sd);
    const showG = eio(k(t, 5.72, 6.25)) * (1 - eio(k(t, 9.0, 9.5)));
    const pump = Math.sin(Math.PI * k(t, 6.25, 6.6)) * 0.05;
    hip.copy(root).setY(0.95 - 0.015 * Math.sin(Math.PI * k(t, 0.85, 1.4)) + Math.sin(t * 1.5) * 0.003);
    hip.x += Math.sin(t * 0.7 + 1) * 0.008;
    if (t < 1.6) look.copy(fP); else if (t < 5.5) look.copy(fP).lerp(EMP_HEAD, k(t, 1.6, 2.0) * (1 - k(t, 2.6, 3.0)) + k(t, 4.4, 4.8)); else look.copy(GR_PHONE).lerp(SHOW_G, showG);
    if (showG > 0.6) look.lerp(CAM_SHOW, 0.5);
    grower.pose({
      hip, yaw: GR_YAW, lean: 0.05 + 0.14 * Math.sin(Math.PI * k(t, 0.8, 1.7)) + 0.03 * showG, look,
      feet: (i, out) => {
        const sg = i ? 1 : -1, st = eio(k(t, 0.3 + i * 0.25, 0.62 + i * 0.25));
        out.copy(GR0).lerp(GR1, st).addScaledVector(sd, sg * 0.11); out.y = 0.085 + 0.06 * Math.sin(Math.PI * st);
      },
      hands: (i, shp, out) => {
        if (i === 0) {
          // Right hand carries the folder, then pushes it across and comes back to the bench edge.
          out.copy(fP).add(tmp.set(-0.12, 0.035, 0.05));
          out.lerp(tmp.set(-0.95, BENCH_Y + 0.025, 0.22), eio(k(t, 1.45, 1.85)));
          out.lerp(tmp.copy(shp).add(tmp2.set(0.1, -0.5, 0.06)), eio(k(t, 3.0, 3.6)) * (1 - 0.0));
        } else {
          // Left hand: phone at the hip, then held up to show it.
          out.copy(shp).add(tmp.set(0.08, -0.46, -0.04));
          out.y += Math.sin(Math.PI * k(t, LIT[0], LIT[0] + 0.5)) * 0.12;
          out.lerp(SHOW_G, showG); out.y += pump * showG;
        }
      },
    });
    placeCap(grower);

    // ---- The partner: waits with weight on one hip, checks the phone at each step, holds it up at paid.
    const showP = eio(k(t, 5.85, 6.4)) * (1 - eio(k(t, 9.0, 9.5)));
    fwdOf(PA_YAW, fw); sideOf(PA_YAW, sd);
    hip.copy(PA).setY(0.95 + Math.sin(t * 1.6 + 2) * 0.003); hip.addScaledVector(sd, Math.sin(t * 0.6) * 0.02);
    const checkP = Math.max(Math.sin(Math.PI * k(t, LIT[0] + 0.1, LIT[0] + 0.9)), Math.sin(Math.PI * k(t, LIT[2] + 0.1, LIT[2] + 0.9)));
    if (showP > 0.5) look.copy(CAM_SHOW).lerp(SHOW_P, 0.3);
    else if (checkP > 0.3) look.copy(PA_PHONE);
    else look.copy(fP);
    partner.pose({
      hip, yaw: PA_YAW, lean: 0.04 + 0.03 * checkP, look, nod: 0.2 * Math.sin(Math.PI * k(t, 6.6, 7.0)),
      feet: (i, out) => { out.copy(PA).addScaledVector(sd, (i ? 1 : -1) * 0.12).addScaledVector(fw, i ? 0.05 : -0.03); out.y = 0.085; },
      hands: (i, shp, out) => {
        if (i === 0) out.set(0.97, BENCH_Y + 0.03, 0.08);
        else {
          out.copy(shp).add(tmp.copy(fw).multiplyScalar(0.12)).add(tmp2.set(0, -0.45, 0));
          out.lerp(tmp.copy(shp).addScaledVector(fw, 0.3).add(tmp2.set(0, -0.2, 0)), checkP);
          out.lerp(SHOW_P, showP);
        }
      },
    });

    // ---- Phones ride in the hands; screens face their person, then turn to show the camera.
    const placePhone = (s, person, hi, show, buzz) => {
      s.g.position.copy(person.wrist[hi]).add(tmp.set(0, 0.06, 0));
      dummy.position.copy(s.g.position); dummy.lookAt(person.headPos); pq.copy(dummy.quaternion);
      dummy.lookAt(CAM_SHOW); pq2.copy(dummy.quaternion);
      s.g.quaternion.slerpQuaternions(pq, pq2, show);
      s.g.rotateZ(Math.sin(t * 70) * 0.06 * buzz);
    };
    const buzzAt = (t0) => (t > t0 ? Math.exp(-7 * (t - t0)) : 0);
    const buzz = (j) => LIT.slice(0, 3).reduce((a, x) => a + buzzAt(x + 0.05), 0) + buzzAt(ARRIVE[j]);
    placePhone(phoneG, grower, 1, showG, buzz(1));
    placePhone(phoneP, partner, 1, showP, buzz(2));
    tablet.g.rotation.set(-0.5, -0.12, Math.sin(t * 70) * 0.01 * buzz(0));

    // ---- Every screen follows the claim; paid lands when the light arrives.
    scene.updateMatrixWorld();
    screens.forEach((s, j) => {
      const sn = t >= ARRIVE[j] ? 4 : Math.min(n, 3), fl = t > ARRIVE[j] ? Math.exp(-5 * (t - ARRIVE[j])) : 0;
      const key = sn + '|' + Math.round(fl * 6);
      if (key !== s.key) { s.key = key; drawScreen(s, sn, fl); }
      s.sc.material.color.setScalar(0.85 + 0.5 * fl);
      s.g.getWorldPosition(tmp);
      screenGlows[j].position.copy(tmp); screenGlows[j].material.opacity = 0.6 * fl + 0.12 * (sn >= 4 ? 1 : 0);
      screenGlows[j].scale.setScalar(j ? 0.3 : 0.5);
    });

    // ---- The paid light: three arcs from the fourth bulb to the three screens.
    let any = 0;
    screens.forEach((s, j) => {
      s.g.getWorldPosition(tmp);
      const t0 = LIT[3] + 0.05 + j * 0.06;
      for (let m = 0; m < TN; m++) {
        const u = clamp((t - t0) / (ARRIVE[j] - t0) - m * 0.035), o = (j * TN + m) * 3;
        const a = BULB4;
        const mid = tmp2.copy(a).add(tmp).multiplyScalar(0.5); mid.y += 0.7;
        const v = 1 - u;
        trailPos[o] = v * v * a.x + 2 * v * u * mid.x + u * u * tmp.x;
        trailPos[o + 1] = v * v * a.y + 2 * v * u * mid.y + u * u * tmp.y;
        trailPos[o + 2] = v * v * a.z + 2 * v * u * mid.z + u * u * tmp.z;
        if (u <= 0 || u >= 1) { trailPos[o + 1] = -10; }
        else any = 1;
      }
    });
    trailGeo.attributes.position.needsUpdate = true;
    trail.material.opacity = any ? 0.9 : 0;
    rainTex.offset.set(-t * 0.03, t * 1.6);
    fixGlow.material.opacity = 0.3 + 0.015 * Math.sin(t * 37);
    greenL.intensity = 2.2 * (t > LIT[3] ? Math.exp(-2.2 * (t - LIT[3])) : 0) + 0.6 * k(t, LIT[3], LIT[3] + 1) * (1 - k(t, 9.2, 9.6));

    // ---- The title, a lower third over the bench.
    const ci = back(k(t, 7.55, 8.1)), ti = back(k(t, 7.7, 8.25)), li = eo(k(t, 7.95, 8.55)), out = ei(k(t, 9.2, 9.55));
    titleG.position.set(0, 0, 0.62);
    titleG.lookAt(camera.position.x, 0, camera.position.z);
    const TW = title.userData.w;
    [[client, 0.95, ci], [title, 0.83, ti], [line, 0.715, li]].forEach(([m, y, a]) => {
      m.position.set(-TW / 2 + m.userData.w / 2, y - (1 - clamp(a)) * 0.04, 0.002);
      m.material.opacity = clamp(a) * (1 - out); m.visible = m.material.opacity > 0.01;
    });
    titleBack.scale.set(Math.max(TW, line.userData.w) + 0.5, 0.36, 1); titleBack.position.set(-TW / 2 + Math.max(TW, line.userData.w) / 2, 0.84, 0);
    titleBack.material.opacity = eo(k(t, 7.5, 8.0)) * (1 - out); titleBack.visible = titleBack.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.2 + rnd(i, 51) * 2.4 + Math.sin(t * 0.3 + i) * 0.06;
      dpos[i * 3 + 1] = 0.95 + rnd(i, 52) * 1.4 + Math.sin(t * 0.42 + i * 1.3) * 0.04;
      dpos[i * 3 + 2] = -0.6 + rnd(i, 53) * 1.3 + Math.cos(t * 0.22 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
