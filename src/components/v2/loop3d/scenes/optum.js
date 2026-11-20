// Optum experience design support lit loop, 10 s. "From brief to screens."
// A designer's desk in early morning light, dappled by a tree outside the window. An experience brief lies on a
// sage felt mat. An orange highlighter marks three key lines; after each one a sticky note lands in
// the margin. Each note then sends a spark across the desk, and a phone concept drops into a dock and
// powers on: three screens drawn from the three notes. The camera rises to the finished desk.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const ORANGE = '#ff612b', ORANGE_H = 0xff612b, CREAM = '#f4efe6', SLATE = '#3b3f4a';
const PW = 0.6, PH = 0.85;                       // the brief, in metres
const PAPER = new THREE.Vector3(-0.52, 0.007, 0.06), PAPER_RY = 0.1;
const LINE_Y = (n) => 236 + n * 52;              // canvas y of body line n
const HL = [                                      // the three key lines: which line, how long, when
  { n: 1, len: 0.64, t: 0.85 },
  { n: 6, len: 0.5, t: 1.85 },
  { n: 10, len: 0.7, t: 2.85 },
];
const SWEEP = 0.5;
const NOTE_T = HL.map((h) => h.t + SWEEP + 0.05);
const NOTE_C = ['#ffc9a6', '#ffe08f', '#f9a77f'];
const DROP = [4.35, 4.8, 5.25];                  // each phone concept lands
const PHONES = [[0.28, -0.44, 0.3], [0.76, -0.33, 0.06], [1.24, -0.44, -0.18]];
const LINES = [0.82, 0.7, 0.88, 0.64, 0.8, 0.76, 0.86, 0.58, 0.84, 0.72, 0.9, 0.66, 0.78, 0.5];

function drawPaper(c, w, h, t) {
  c.fillStyle = '#ebe5da'; c.fillRect(0, 0, w, h);
  c.fillStyle = ORANGE; c.fillRect(56, 64, 56, 8);
  c.fillStyle = SLATE; c.font = `600 22px ${MONO}`; c.textBaseline = 'alphabetic';
  if ('letterSpacing' in c) c.letterSpacing = '4px';
  c.fillText('OPTUM', 56, 110);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.fillStyle = '#23262e'; c.font = `800 46px ${SANS}`; c.fillText('Experience brief', 56, 166);
  c.fillStyle = 'rgba(35,38,46,0.12)'; c.fillRect(56, 192, w - 112, 2);
  LINES.forEach((f, n) => { c.fillStyle = 'rgba(60,64,74,0.42)'; roundRect(c, 56, LINE_Y(n) - 9, (w - 112) * f, 14, 7); c.fill(); });
  c.globalCompositeOperation = 'multiply';
  HL.forEach((hl) => {
    const p = eio(k(t, hl.t, hl.t + SWEEP));
    if (p <= 0) return;
    c.fillStyle = 'rgba(255,140,90,0.75)';
    roundRect(c, 50, LINE_Y(hl.n) - 18, Math.max(12, (w - 100) * hl.len * p), 32, 6); c.fill();
  });
  c.globalCompositeOperation = 'source-over';
  // Margin ticks where the notes will go.
  HL.forEach((hl, i) => { if (t > NOTE_T[i]) { c.fillStyle = ORANGE; c.beginPath(); c.arc(w - 34, LINE_Y(hl.n) - 2, 7, 0, 7); c.fill(); } });
}

// Three screen concepts in one visual language: cream ground, orange accent, soft cards.
function drawScreen(c, w, h, i) {
  c.fillStyle = CREAM; c.fillRect(0, 0, w, h);
  const bar = (x, y, bw, col = 'rgba(35,38,46,0.55)', bh = 14) => { c.fillStyle = col; roundRect(c, x, y, bw, bh, bh / 2); c.fill(); };
  c.fillStyle = 'rgba(35,38,46,0.6)'; roundRect(c, 28, 34, 60, 12, 6); c.fill(); roundRect(c, w - 84, 34, 56, 12, 6); c.fill();
  bar(28, 92, 170, '#23262e', 22); bar(28, 126, 120, 'rgba(35,38,46,0.35)');
  if (i === 0) {
    const g = c.createLinearGradient(28, 170, w - 28, 470); g.addColorStop(0, '#ff7a45'); g.addColorStop(1, '#e8481f');
    c.fillStyle = g; roundRect(c, 28, 170, w - 56, 300, 28); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.22)'; c.beginPath(); c.arc(w - 100, 250, 70, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.arc(w - 100, 250, 34, 0, 7); c.fill();
    bar(56, 380, 190, 'rgba(255,255,255,0.95)', 20); bar(56, 414, 130, 'rgba(255,255,255,0.65)');
    for (let r = 0; r < 3; r++) {
      const y = 510 + r * 96;
      c.fillStyle = '#fff'; roundRect(c, 28, y, w - 56, 80, 20); c.fill();
      c.fillStyle = r === 0 ? '#ffd9c7' : '#e9e4f0'; c.beginPath(); c.arc(76, y + 40, 22, 0, 7); c.fill();
      bar(116, y + 24, 160 - r * 20, 'rgba(35,38,46,0.7)'); bar(116, y + 48, 100, 'rgba(35,38,46,0.3)', 10);
    }
    c.fillStyle = ORANGE; roundRect(c, 28, h - 110, w - 56, 64, 32); c.fill();
    bar(w / 2 - 60, h - 85, 120, 'rgba(255,255,255,0.95)');
  } else if (i === 1) {
    const T = ['#ffe1d2', '#e3ecf7', '#efe6d6', '#e6f1e6'];
    for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) {
      const x = 28 + q * ((w - 70) / 2 + 14), y = 176 + r * 210, tw = (w - 70) / 2, i2 = r * 2 + q;
      c.fillStyle = T[i2]; roundRect(c, x, y, tw, 190, 24); c.fill();
      c.fillStyle = i2 === 0 ? ORANGE : 'rgba(35,38,46,0.55)';
      if (i2 % 2) { roundRect(c, x + 24, y + 26, 44, 44, 12); c.fill(); } else { c.beginPath(); c.arc(x + 46, y + 48, 22, 0, 7); c.fill(); }
      bar(x + 24, y + 120, tw - 60, 'rgba(35,38,46,0.7)'); bar(x + 24, y + 148, tw - 90, 'rgba(35,38,46,0.3)', 10);
    }
    c.fillStyle = '#fff'; roundRect(c, 28, 610, w - 56, 120, 24); c.fill();
    bar(56, 640, 180, 'rgba(35,38,46,0.7)'); bar(56, 668, 120, 'rgba(35,38,46,0.3)', 10);
    c.fillStyle = ORANGE; roundRect(c, w - 128, 646, 72, 40, 20); c.fill();
    c.fillStyle = '#fff'; c.beginPath(); c.arc(w - 76, 666, 15, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.fillRect(0, h - 92, w, 92);
    for (let q = 0; q < 4; q++) { c.fillStyle = q === 0 ? ORANGE : 'rgba(35,38,46,0.3)'; c.beginPath(); c.arc(60 + q * ((w - 120) / 3), h - 46, 12, 0, 7); c.fill(); }
  } else {
    const cx = w / 2, cy = 330, R = 112;
    c.lineCap = 'round';
    c.strokeStyle = 'rgba(35,38,46,0.1)'; c.lineWidth = 26; c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
    c.strokeStyle = ORANGE; c.beginPath(); c.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + Math.PI * 1.35); c.stroke();
    c.fillStyle = '#23262e'; c.beginPath(); c.arc(cx, cy, 30, 0, 7); c.fill();
    for (let r = 0; r < 3; r++) {
      const y = 500 + r * 92, done = r < 2;
      c.fillStyle = '#fff'; roundRect(c, 28, y, w - 56, 76, 20); c.fill();
      c.fillStyle = done ? ORANGE : 'rgba(35,38,46,0.15)'; c.beginPath(); c.arc(72, y + 38, 18, 0, 7); c.fill();
      if (done) { c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(63, y + 38); c.lineTo(70, y + 45); c.lineTo(82, y + 31); c.stroke(); }
      bar(108, y + 30, 170 - r * 24, 'rgba(35,38,46,0.65)');
    }
    c.strokeStyle = ORANGE; c.lineWidth = 4; roundRect(c, 28, h - 110, w - 56, 64, 32); c.stroke();
    bar(w / 2 - 60, h - 85, 120, ORANGE);
  }
}

function drawNote(c, w, h, i) {
  c.fillStyle = NOTE_C[i]; c.fillRect(0, 0, w, h);
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(0,0,0,0.06)'); g.addColorStop(0.2, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.05)');
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(40,36,48,0.8)'; c.lineWidth = 5; c.lineCap = 'round'; c.lineJoin = 'round';
  for (let r = 0; r < 4; r++) {
    c.beginPath(); let x = 30; const y = 62 + r * 46, end = 30 + (w - 70) * (0.55 + rnd(r, i + 3) * 0.45);
    c.moveTo(x, y);
    while (x < end) { x += 9; c.lineTo(x, y + Math.sin(x * 0.45 + r + i) * 5 + Math.sin(x * 0.13) * 3); }
    c.stroke();
  }
  // A little sketch in each note: a card, a grid, a ring. The three screens to come.
  c.strokeStyle = ORANGE; c.lineWidth = 6;
  if (i === 0) { roundRect(c, w - 92, h - 82, 64, 50, 10); c.stroke(); }
  else if (i === 1) { [0, 1].forEach((a) => [0, 1].forEach((b) => { roundRect(c, w - 92 + a * 34, h - 86 + b * 30, 26, 22, 5); c.stroke(); })); }
  else { c.beginPath(); c.arc(w - 60, h - 58, 26, -1.6, 2.6); c.stroke(); }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x14110f);
  scene.fog = new THREE.Fog(0x14110f, 3.2, 8);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- room and desk
  const wall = mesh(new THREE.PlaneGeometry(9, 4), std(0xffffff, { map: grainTex('#2c2522', { size: 256, speck: 0.05, blot: 0.08, seed: 21, repeat: 3 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 1.4, -1.35); scene.add(wall);
  const oak = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#7a5434'; c.fillRect(0, 0, w, h);
    for (let p = 0; p < 4; p++) {
      const y = p * h / 4;
      c.fillStyle = `rgb(${110 + rnd(p, 1) * 22},${76 + rnd(p, 2) * 16},${48 + rnd(p, 3) * 10})`; c.fillRect(0, y, w, h / 4);
      for (let g = 0; g < 34; g++) { c.strokeStyle = `rgba(40,22,10,${0.06 + rnd(g, p) * 0.12})`; c.lineWidth = 1 + rnd(g, p + 4) * 2.5; c.beginPath(); const gy = y + rnd(g, p + 9) * h / 4; c.moveTo(0, gy); for (let x = 0; x <= w; x += 48) c.lineTo(x, gy + Math.sin(x * 0.008 + g * 1.7) * 5); c.stroke(); }
      c.fillStyle = 'rgba(20,10,4,0.7)'; c.fillRect(0, y, w, 2);
    }
  });
  oak.tex.wrapS = oak.tex.wrapT = THREE.RepeatWrapping;
  const desk = mesh(new RoundedBoxGeometry(5, 0.08, 2.6, 3, 0.015), std(0xffffff, { map: oak.tex, roughness: 0.55 }));
  desk.position.set(0.2, -0.04, -0.1); scene.add(desk);
  const mat = mesh(new RoundedBoxGeometry(2.7, 0.006, 1.35, 2, 0.003), std(0xffffff, { map: grainTex('#4f5c52', { size: 256, speck: 0.14, blot: 0.05, seed: 5, repeat: 3 }), roughness: 1 }));
  mat.position.set(0.25, 0.003, -0.08); scene.add(mat);
  // A mug at the back left: something human on the desk.
  const mug = new THREE.Group(); mug.position.set(-1.2, 0.006, -0.55); scene.add(mug);
  const mugB = mesh(new THREE.CylinderGeometry(0.085, 0.078, 0.19, 32), std(0x2f4a5c, { roughness: 0.35 })); mugB.position.y = 0.095; mug.add(mugB);
  const handle = mesh(new THREE.TorusGeometry(0.05, 0.013, 10, 24, Math.PI), std(0x2f4a5c, { roughness: 0.35 })); handle.rotation.z = -Math.PI / 2; handle.position.set(0.085, 0.1, 0); mug.add(handle);

  // ----------------------------------------------------------- window light through a tree outside
  scene.add(new THREE.HemisphereLight(0xc9d4ff, 0x2a1d14, 0.36));
  // Light cookie: a soft window disc broken up by leaf shadows, so the desk is dappled, not flat.
  const leaves = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.55); g.addColorStop(0, '#fff'); g.addColorStop(0.72, '#fff'); g.addColorStop(1, '#000');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    [[60, 22, 0.35], [90, 12, 0.7]].forEach(([n, size, alpha], layer) => {
      for (let i = 0; i < n; i++) {
        const a = rnd(i, 70 + layer) * Math.PI * 2, rr = Math.sqrt(rnd(i, 72 + layer)) * w * 0.5;
        if (rr < w * 0.16 && rnd(i, 74) > 0.25) continue;      // keep the middle of the desk mostly in the light
        c.save(); c.translate(w / 2 + Math.cos(a) * rr, h / 2 + Math.sin(a) * rr); c.rotate(rnd(i, 76 + layer) * Math.PI);
        c.fillStyle = `rgba(0,0,0,${alpha})`; c.beginPath(); c.ellipse(0, 0, size * (0.6 + rnd(i, 78) * 0.8), size * 0.38, 0, 0, 7); c.fill();
        c.restore();
      }
    });
  });
  const sun = new THREE.SpotLight(0xffdcb4, 40, 0, 0.5, 0.35, 1.2);
  sun.position.set(-2.6, 2.7, 0.6); sun.target.position.set(0.1, 0, -0.1);
  sun.map = leaves.tex;
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.015;
  sun.shadow.camera.near = 1.5; sun.shadow.camera.far = 7;
  scene.add(sun, sun.target);
  const rim = new THREE.DirectionalLight(0x9fb8ff, 0.9); rim.position.set(2.4, 1.6, -2.2); scene.add(rim);
  const fill = new THREE.PointLight(0xffc49a, 0.6, 3, 1.6); fill.position.set(0.6, 0.9, 1.4); scene.add(fill);
  const haze = glow(0xffd6a8, 3.2, 0.1, 0.6); haze.position.set(-2.2, 1.6, -1.2); haze.material.fog = false; scene.add(haze);

  // ----------------------------------------------------------- the brief
  const paperG = new THREE.Group(); paperG.position.copy(PAPER); paperG.rotation.y = PAPER_RY; scene.add(paperG);
  const paperTex = canvasTex(720, 1020);
  const paper = mesh(new THREE.PlaneGeometry(PW, PH), std(0xd9d2c6, { map: paperTex.tex, roughness: 0.9 }), { cast: false });
  paper.rotation.x = -Math.PI / 2; paperG.add(paper);
  const under = mesh(new THREE.PlaneGeometry(PW, PH), std(0xc9c1b4, { roughness: 0.9 }), { cast: false });
  under.rotation.set(-Math.PI / 2, 0, 0.04); under.position.set(0.02, -0.002, -0.015); paperG.add(under);
  paperG.updateMatrixWorld();
  const onPaper = (u, v, lift = 0, out = new THREE.Vector3()) => paperG.localToWorld(out.set((u - 0.5) * PW, lift, (v - 0.5) * PH));
  let pKey = '';
  const drawBrief = (t) => {
    const key = HL.map((h) => Math.round(eio(k(t, h.t, h.t + SWEEP)) * 40)).join(',') + NOTE_T.filter((n) => t > n).length;
    if (key === pKey) return; pKey = key;
    paperTex.redraw((c, w, h) => drawPaper(c, w, h, t));
  };

  // ----------------------------------------------------------- the highlighter
  const pen = new THREE.Group(); scene.add(pen);
  const penTilt = new THREE.Group(); pen.add(penTilt);
  const bodyM = std(ORANGE_H, { roughness: 0.32 });
  const body = mesh(new THREE.CylinderGeometry(0.017, 0.017, 0.17, 24), bodyM); body.position.y = 0.11; penTilt.add(body);
  const cap = mesh(new THREE.CylinderGeometry(0.0185, 0.0185, 0.05, 24), std(0x23262e, { roughness: 0.4, metalness: 0.2 })); cap.position.y = 0.215; penTilt.add(cap);
  const tip = mesh(new THREE.ConeGeometry(0.012, 0.03, 4), std(0xff8a5c, { roughness: 0.6 })); tip.position.y = 0.012; tip.rotation.set(Math.PI, Math.PI / 4, 0); penTilt.add(tip);
  const tipGlow = glow(0xff8a5c, 0.12, 0, 0.3); pen.add(tipGlow);
  const PEN = [[0, [1.3, 0.12, 0.2]], [0.45, [1.22, 0.14, 0.17]]];
  HL.forEach((h) => {
    const v = (LINE_Y(h.n) - 2) / 1020;
    PEN.push([h.t - 0.02, [0.09, v, 0.0]]);
    PEN.push([h.t + SWEEP, [0.09 + h.len * 0.86, v, 0]]);
    PEN.push([h.t + SWEEP + 0.16, [0.14 + h.len * 0.86, v - 0.02, 0.08]]);
  });
  PEN.push([4.0, [1.36, 0.9, 0]], [10, [1.36, 0.9, 0]]);
  const penPt = new THREE.Vector3();

  // ----------------------------------------------------------- sticky notes
  const notes = HL.map((h, i) => {
    const g = new THREE.Group(); scene.add(g);
    const nTex = canvasTex(256, 256, (c, w, hh) => drawNote(c, w, hh, i));
    const pad = mesh(new THREE.BoxGeometry(0.17, 0.003, 0.17), std(new THREE.Color(NOTE_C[i]), { roughness: 0.85 }));
    g.add(pad);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.17), std(0xffffff, { map: nTex.tex, roughness: 0.85 }));
    top.rotation.x = -Math.PI / 2; top.position.y = 0.0016; top.receiveShadow = true; g.add(top);
    const nGlow = glow(0xffa070, 0.45, 0, 0.4); nGlow.position.y = 0.03; g.add(nGlow);
    const v = (LINE_Y(h.n) - 2) / 1020;
    const home = onPaper(1.21, v, 0.004);
    return { g, nGlow, home, ry: PAPER_RY + (rnd(i, 7) - 0.5) * 0.35 };
  });

  // ----------------------------------------------------------- the dock and three phone concepts
  const dock = mesh(new RoundedBoxGeometry(1.5, 0.045, 0.16, 2, 0.012), std(0x2a211c, { roughness: 0.35, metalness: 0.2 }));
  dock.position.set(0.76, 0.0225, -0.38); scene.add(dock);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.004, 0.03), new THREE.MeshBasicMaterial({ color: ORANGE_H, transparent: true, opacity: 0.25, toneMapped: false }));
  slot.position.set(0.76, 0.046, -0.4); scene.add(slot);
  const phones = PHONES.map(([x, z, ry], i) => {
    const p = phone({ w: 0.37, h: 0.76, d: 0.04, r: 0.05, frame: 0x2b2d33 });
    const ui = canvasTex(400, Math.round(400 * p.userData.sh / p.userData.sw), (c, w, h) => drawScreen(c, w, h, i));
    p.userData.screen.material.map = ui.tex; p.userData.screen.material.needsUpdate = true;
    const sGlow = glow(0xffb48a, 1.6, 0, 0.5); sGlow.position.z = -0.1; sGlow.scale.set(1.0, 1.7, 1); p.add(sGlow);
    scene.add(p);
    const spark = glow(0xffa070, 0.32, 0, 0.3); scene.add(spark);
    const rest = new THREE.Vector3(x, 0.045 + 0.38, z);
    return { p, sGlow, spark, rest, ry, i };
  });

  // ----------------------------------------------------------- title
  const kicker = label('OPTUM', { font: `700 56px ${MONO}`, fg: '#ff8a5c', h: 0.12, track: 10 });
  const title = label('Experience design support', { font: `800 72px ${SANS}`, fg: '#f6efe4', h: 0.18, track: 1 });
  [kicker, title].forEach((l) => { l.material.fog = false; scene.add(l); });

  // ----------------------------------------------------------- dust in the window light
  const DN = 180, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffdcb4, size: 0.008, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.12, 0.6, 0.98]], [1.2, [-0.16, 0.62, 1.0], L],
    [3.4, [-0.06, 0.68, 1.08], L], [4.5, [0.5, 0.8, 2.02]],
    [6.4, [0.62, 0.72, 1.88], L], [8.2, [0.3, 1.12, 2.85]],
    [10, [0.28, 1.14, 2.95], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.5, 0.0, 0.0]], [1.2, [-0.5, 0.0, -0.02], L],
    [3.4, [-0.38, 0.02, -0.02], L], [4.5, [0.55, 0.36, -0.3]],
    [6.4, [0.68, 0.38, -0.34], L], [8.2, [0.24, 0.52, -0.25]],
    [10, [0.24, 0.52, -0.25], L],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), m = new THREE.Vector3(), lk = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.5 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [3.4, 36], [4.5, 34], [8.2, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // The leaves outside move in a breeze, so the dapple drifts across the desk.
    sun.position.set(-2.6 + t * 0.02 + Math.sin(t * 1.3) * 0.035 + Math.sin(t * 2.3 + 1) * 0.015, 2.7, 0.6 + Math.sin(t * 1.1 + 2) * 0.03);

    // Beat 1: the highlighter marks three lines of the brief.
    const pv = kf(t, PEN);
    onPaper(pv[0], pv[1], pv[2], penPt);
    pen.position.copy(penPt);
    const resting = k(t, 3.5, 4.0);
    pen.rotation.set(0, PAPER_RY, 0);
    penTilt.rotation.set(lerp(0.55, Math.PI / 2 - 0.02, eio(resting)), 0, lerp(-0.42, 0, eio(resting)));
    penTilt.position.y = eio(resting) * 0.017;
    const drawing = HL.some((h) => t > h.t && t < h.t + SWEEP);
    tipGlow.material.opacity = drawing ? 0.8 : 0;
    drawBrief(t);

    // Beat 2: after each line, a note lands in the margin with a little bounce.
    notes.forEach((n, i) => {
      const d = spring(k(t, NOTE_T[i], NOTE_T[i] + 0.7));
      n.g.position.copy(n.home); n.g.position.y += (1 - d) * 0.28;
      n.g.rotation.set((1 - clamp(d)) * 0.5, n.ry + (1 - clamp(d)) * 0.8, (1 - clamp(d)) * -0.3);
      n.g.visible = t > NOTE_T[i];
      const send = DROP[i] - 0.5;
      n.nGlow.material.opacity = 0.7 * Math.exp(-5 * Math.max(0, t - NOTE_T[i] - 0.4)) * (t > NOTE_T[i] + 0.4 ? 1 : 0)
        + 0.8 * Math.sin(Math.PI * k(t, send - 0.15, send + 0.25));
    });

    // Beat 3: each note sends a spark to the dock and a concept drops in and powers on.
    phones.forEach((ph, i) => {
      const s0 = DROP[i] - 0.5, sp = eio(k(t, s0, DROP[i]));
      a.copy(notes[i].home); a.y += 0.03; b.copy(ph.rest); b.y = 0.08;
      m.lerpVectors(a, b, 0.5); m.y += 0.35;
      ph.spark.position.set(
        (1 - sp) * (1 - sp) * a.x + 2 * (1 - sp) * sp * m.x + sp * sp * b.x,
        (1 - sp) * (1 - sp) * a.y + 2 * (1 - sp) * sp * m.y + sp * sp * b.y,
        (1 - sp) * (1 - sp) * a.z + 2 * (1 - sp) * sp * m.z + sp * sp * b.z,
      );
      ph.spark.material.opacity = t > s0 && t < DROP[i] + 0.1 ? 0.95 : 0;
      const land = spring(k(t, DROP[i], DROP[i] + 0.8));
      ph.p.position.set(ph.rest.x, ph.rest.y + (1 - land) * 0.9, ph.rest.z);
      ph.p.rotation.set(-0.1 + (1 - clamp(land)) * 0.25, ph.ry + (1 - clamp(land)) * 0.4, 0);
      ph.p.visible = t > DROP[i];
      const on = eo(k(t, DROP[i] + 0.35, DROP[i] + 0.75));
      ph.p.userData.screen.material.color.setScalar(lerp(0.03, 0.82, on));
      ph.sGlow.material.opacity = 0.22 * on + 0.35 * (t > DROP[i] + 0.35 ? Math.exp(-4 * (t - DROP[i] - 0.35)) : 0);
      ph.p.userData.sheen.position.x = Math.sin(t * 0.5 + i) * 0.04;
    });
    slot.material.opacity = 0.18 + 0.4 * eo(k(t, 4.3, 5.8));

    // Beat 4: the desk, finished, under the title.
    const ti = eo(k(t, 6.9, 7.5)), to = ei(k(t, 9.25, 9.6));
    lk.copy(camera.position); lk.y = 0.95;
    [[kicker, 1.12, ti], [title, 0.97, ti]].forEach(([l, y, al]) => {
      l.position.set(0.3, y + (1 - al) * 0.04, -0.2); l.lookAt(lk);
      l.material.opacity = al * (1 - to); l.visible = al > 0.01;
    });

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.6 + rnd(i, 31) * 2.8 + Math.sin(t * 0.25 + i) * 0.08 + t * 0.012;
      dpos[i * 3 + 1] = 0.05 + rnd(i, 32) * 1.3 + Math.sin(t * 0.4 + i * 1.7) * 0.04;
      dpos[i * 3 + 2] = -1.0 + rnd(i, 33) * 1.9 + Math.cos(t * 0.2 + i) * 0.06;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.4 };
}
