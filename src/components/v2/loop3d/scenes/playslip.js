// New York Lottery Digital Playslip lit loop, 10 s. "Paper to phone to the counter."
// A retail counter under one downlight. A pencil marks the real Quick Draw paper slip, the slip breaks
// into its own colored flecks that stream into a phone, the phone runs the four-step digital playslip
// with a live running total, ends on a QR code, and the counter scanner reads it and prints the ticket.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const NAVY = '#0f2557', BLUE = '#2a5ea8', GOLD = '#ffc629', RED = 0xff2b2b;
const PW = 0.5, PH = 1.053; // paper slip, meters, matching the scan's aspect
const PICKS = [7, 22, 38, 61];
// Pencil marks on the slip, in slip canvas pixels (512 x 1078): spots = 4, the four picks, $2 per draw.
const MARKS = [[236, 117], [355, 229], [157, 304], [395, 342], [117, 454], [157, 641]];
const MT = [0.6, 0.9, 1.16, 1.42, 1.68, 2.0];

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050914);
  scene.fog = new THREE.Fog(0x050914, 3.2, 9);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.02, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- set
  const lam = grainTex('#10162a', { size: 512, speck: 0.035, blot: 0.09, seed: 21, repeat: 3 });
  const counter = mesh(new THREE.PlaneGeometry(14, 8), std(0xffffff, { map: lam, roughness: 0.3, metalness: 0.15 }), { cast: false });
  counter.rotation.x = -Math.PI / 2;
  scene.add(counter);
  // Store lights behind, out of focus.
  [[-1.8, 1.1, -3.4, 0xffb25c, 1.2], [-0.6, 1.6, -4.2, 0x5f8cff, 1.5], [0.9, 1.0, -3.6, 0xffc629, 1.0], [2.1, 1.7, -4.4, 0xff6a5a, 1.4], [3.2, 0.9, -3.2, 0x7fa2ff, 1.1], [-3.0, 1.9, -4.8, 0xffd59a, 1.6]]
    .forEach(([x, y, z, c, s]) => { const g = glow(c, s, 0.42, 0.55); g.position.set(x, y, z); scene.add(g); });

  scene.add(new THREE.HemisphereLight(0x3552a0, 0x05070d, 0.5));
  const key = new THREE.SpotLight(0xffe2b8, 26, 0, 0.55, 0.8, 1.4);
  key.position.set(-0.35, 2.3, 0.7);
  key.target.position.set(0.05, 0, 0.05);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 5;
  key.shadow.bias = -0.0003; key.shadow.normalBias = 0.01;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x4f7dff, 1.3);
  rim.position.set(1.5, 1.2, -2.5);
  scene.add(rim);
  const laserLight = new THREE.PointLight(RED, 0, 1.2, 1.5);
  scene.add(laserLight);

  // ----------------------------------------------------------- the paper slip
  const img = new Image();
  img.src = '/loops3d/nyl-paper.jpg';
  const ready = img.decode().catch(() => {});
  const slip = canvasTex(512, 1078);
  let colors = null;
  let markN = -1;
  const drawSlip = (n) => {
    if (n === markN) return; markN = n;
    slip.redraw((c, w, h) => {
      c.fillStyle = '#fbf7f0'; c.fillRect(0, 0, w, h);
      if (img.complete && img.naturalWidth) c.drawImage(img, 0, 0, w, h);
      // Pencil fill: graphite strokes, not a flat box.
      for (let i = 0; i < n; i++) {
        const [x, y] = MARKS[i];
        c.save(); c.translate(x, y); c.rotate((rnd(i, 3) - 0.5) * 0.15);
        for (let s = 0; s < 16; s++) {
          c.strokeStyle = `rgba(28,26,30,${0.45 + rnd(s + i * 20, 4) * 0.4})`; c.lineWidth = 2.2;
          c.beginPath(); c.moveTo(-9 + rnd(s, i) * 2, -7 + s * 0.9); c.lineTo(9 - rnd(s, i + 1) * 2, -6 + s * 0.9 + rnd(s, 9)); c.stroke();
        }
        c.restore();
      }
    });
  };
  const paper = new THREE.Group();
  paper.position.set(-0.05, 0.003, 0.02);
  paper.rotation.y = 0.14;
  scene.add(paper);
  const cut = new THREE.Plane(new THREE.Vector3(0, 0, 1), 10);
  const paperMesh = mesh(new THREE.PlaneGeometry(PW, PH), std(0xe4dfd6, { map: slip.tex, roughness: 0.85, clippingPlanes: [cut], side: THREE.DoubleSide }), { cast: false });
  paperMesh.rotation.x = -Math.PI / 2;
  paper.add(paperMesh);
  const shadowCard = mesh(new THREE.PlaneGeometry(PW, PH), new THREE.ShadowMaterial({ opacity: 0 }), { cast: true, receive: false });
  shadowCard.visible = false;
  // Dissolve line glow: a gold seam that rides the cut across the slip.
  const seamTex = canvasTex(16, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,198,41,0)'); g.addColorStop(0.5, 'rgba(255,230,150,1)'); g.addColorStop(1, 'rgba(255,198,41,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(PW * 1.08, 0.06), new THREE.MeshBasicMaterial({ map: seamTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  seam.rotation.x = -Math.PI / 2; seam.position.y = 0.004;
  paper.add(seam);

  // ----------------------------------------------------------- pencil
  const pencil = new THREE.Group();
  const shaft = new THREE.Group();
  const body = mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.34, 6), std(0xf2c230, { roughness: 0.5 }));
  body.position.y = 0.17 + 0.045; shaft.add(body);
  const wood = mesh(new THREE.ConeGeometry(0.0125, 0.04, 6), std(0xe2b98a, { roughness: 0.9 }));
  wood.rotation.x = Math.PI; wood.position.y = 0.025; shaft.add(wood);
  const lead = mesh(new THREE.ConeGeometry(0.0045, 0.012, 8), std(0x2b2b30, { roughness: 0.4, metalness: 0.4 }));
  lead.rotation.x = Math.PI; lead.position.y = 0.006; shaft.add(lead);
  const ferrule = mesh(new THREE.CylinderGeometry(0.0132, 0.0132, 0.03, 12), std(0xc9ccd2, { metalness: 1, roughness: 0.3 }));
  ferrule.position.y = 0.39; shaft.add(ferrule);
  const eraser = mesh(new THREE.CylinderGeometry(0.0125, 0.0125, 0.025, 12), std(0xe58a8a, { roughness: 0.9 }));
  eraser.position.y = 0.415; shaft.add(eraser);
  shaft.rotation.set(-0.5, 0, -0.55);
  pencil.add(shaft);
  scene.add(pencil);

  const slipToWorld = (cx, cy, out = new THREE.Vector3()) => {
    out.set((cx / 512 - 0.5) * PW, 0, (cy / 1078 - 0.5) * PH);
    out.applyAxisAngle(new THREE.Vector3(0, 1, 0), paper.rotation.y).add(paper.position);
    return out;
  };
  const markW = MARKS.map(([x, y]) => slipToWorld(x, y));
  const pTmp = new THREE.Vector3();

  // ----------------------------------------------------------- the phone
  const ph = phone();
  ph.scale.setScalar(0.42);
  scene.add(ph);
  const SW = 400, SH = 866;
  const ui = canvasTex(SW, SH);
  ph.userData.screen.material.map = ui.tex;
  ph.userData.screen.material.needsUpdate = true;
  // Quick Draw QR: a fixed pattern with the three finder squares.
  const Q = 25, qr = [];
  for (let y = 0; y < Q; y++) for (let x = 0; x < Q; x++) {
    const f = (a, b) => x >= a && x < a + 7 && y >= b && y < b + 7;
    let on = rnd(x * 31 + y, 77) > 0.5;
    for (const [a, b] of [[0, 0], [Q - 7, 0], [0, Q - 7]]) if (f(a, b)) { const dx = x - a, dy = y - b; on = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx > 1 && dx < 5 && dy > 1 && dy < 5); }
    if (x === 7 || y === 7 || x === Q - 8 || (y === Q - 8 && x < 8)) on = false;
    qr.push(on);
  }
  let uiKey = '';
  const drawUI = (t) => {
    const step = t < 4.15 ? 0 : t < 4.75 ? 1 : t < 5.45 ? 2 : t < 6.05 ? 3 : 4; // steps done
    const slide = eio(k(t, 6.35, 6.85)); // playslip -> QR screen
    const picked = PICKS.filter((_, i) => t > 4.22 + i * 0.13).length;
    const total = t < 5.45 ? 0 : Math.round(lerp(0, 2, eo(k(t, 5.45, 5.85))) * 100) / 100;
    const qrP = k(t, 6.7, 7.3);
    const scan = k(t, 7.75, 8.35), done = t > 8.4;
    const live = (slide > 0 && slide < 1) || (qrP > 0 && qrP < 1) || (scan > 0 && scan < 1);
    const key2 = [step, picked, total, done, live ? Math.round(t * 30) : Math.round(slide), Math.round(qrP)].join('|');
    if (key2 === uiKey) return; uiKey = key2;
    ui.redraw((c, w, h) => {
      c.fillStyle = '#f3f4f7'; c.fillRect(0, 0, w, h);
      // Status bar and header
      c.fillStyle = NAVY; c.fillRect(0, 0, w, 150);
      c.fillStyle = '#fff'; c.font = '600 18px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText('3:25', 28, 30);
      c.fillStyle = GOLD; c.fillRect(0, 150, w, 4);
      c.save(); c.translate(-slide * w, 0);
      // --- screen A: the playslip
      c.fillStyle = '#fff'; c.font = '700 34px Inter, system-ui, sans-serif'; c.fillText('Digital Playslip', 28, 86);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '600 18px Inter, system-ui, sans-serif'; c.fillText('Quick Draw', 28, 122);
      const rows = ['How many spots?', 'Pick your numbers', 'How much per draw?', 'Quick Draw Extra?'];
      rows.forEach((r, i) => {
        const y = 196 + i * 62, isDone = step > i, cur = step === i;
        c.fillStyle = isDone ? NAVY : cur ? GOLD : '#d5d9e2';
        c.beginPath(); c.arc(46, y, 17, 0, Math.PI * 2); c.fill();
        c.fillStyle = isDone ? '#fff' : NAVY; c.font = '700 17px Inter, system-ui, sans-serif'; c.textAlign = 'center';
        c.fillText(isDone ? '✓' : String(i + 1), 46, y + 1); c.textAlign = 'left';
        c.fillStyle = isDone || cur ? NAVY : '#8a92a6'; c.font = `${cur ? 800 : 600} 20px Inter, system-ui, sans-serif`; c.fillText(r, 80, y + 1);
        c.fillStyle = BLUE; c.font = '700 18px "JetBrains Mono", ui-monospace, monospace'; c.textAlign = 'right';
        if (isDone) c.fillText(['4', '7·22·38·61', '$2', 'No'][i], w - 26, y + 1);
        c.textAlign = 'left';
        if (i < 3) { c.fillStyle = '#d5d9e2'; c.fillRect(45, y + 20, 2, 22); }
      });
      // Number board
      c.fillStyle = '#fff'; roundRect(c, 20, 446, w - 40, 250, 18); c.fill();
      for (let n = 1; n <= 80; n++) {
        const col = (n - 1) % 10, row = Math.floor((n - 1) / 10);
        const x = 44 + col * 35.5, y = 476 + row * 27.5;
        const pi = PICKS.indexOf(n), on = pi >= 0 && pi < picked;
        c.fillStyle = on ? NAVY : '#eef0f4'; c.beginPath(); c.arc(x, y, 12, 0, Math.PI * 2); c.fill();
        if (on) { c.strokeStyle = GOLD; c.lineWidth = 3; c.stroke(); }
        c.fillStyle = on ? '#fff' : '#7a8296'; c.font = `${on ? 800 : 600} 11px Inter, system-ui, sans-serif`; c.textAlign = 'center'; c.fillText(String(n), x, y + 1); c.textAlign = 'left';
      }
      // Running total
      c.fillStyle = NAVY; c.fillRect(0, h - 150, w, 150);
      c.fillStyle = 'rgba(255,255,255,0.65)'; c.font = '600 16px Inter, system-ui, sans-serif'; c.fillText('Total', 28, h - 118);
      c.fillStyle = '#fff'; c.font = '700 46px Inter, system-ui, sans-serif'; c.fillText('$' + total.toFixed(2), 28, h - 76);
      c.fillStyle = 'rgba(255,255,255,0.18)'; roundRect(c, 28, h - 40, w - 56, 10, 5); c.fill();
      c.fillStyle = GOLD; roundRect(c, 28, h - 40, Math.max(10, (w - 56) * (total / 10)), 10, 5); c.fill();
      // --- screen B: the QR for the counter
      c.translate(w, 0);
      c.fillStyle = '#fff'; c.font = '700 32px Inter, system-ui, sans-serif'; c.fillText('Ready to play', 28, 86);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '600 18px Inter, system-ui, sans-serif'; c.fillText('Scan at any retailer', 28, 122);
      const qs = 300, qx = (w - qs) / 2, qy = 220, m = qs / Q;
      c.fillStyle = '#fff'; roundRect(c, qx - 22, qy - 22, qs + 44, qs + 44, 22); c.fill();
      for (let y = 0; y < Q; y++) for (let x = 0; x < Q; x++) {
        if (!qr[y * Q + x]) continue;
        const wave = clamp((qrP * 2.2) - (x + y) / (2 * Q));
        if (wave <= 0) continue;
        const s = m * eo(wave);
        c.fillStyle = '#0b0b0c'; c.fillRect(qx + x * m + (m - s) / 2, qy + y * m + (m - s) / 2, s + 0.4, s + 0.4);
      }
      if (scan > 0 && scan < 1) {
        const ly = qy + qs * (0.5 + 0.5 * Math.sin(scan * Math.PI * 3));
        const g = c.createLinearGradient(0, ly - 14, 0, ly + 14);
        g.addColorStop(0, 'rgba(255,43,43,0)'); g.addColorStop(0.5, 'rgba(255,43,43,0.95)'); g.addColorStop(1, 'rgba(255,43,43,0)');
        c.fillStyle = g; c.fillRect(qx - 30, ly - 14, qs + 60, 28);
      }
      c.fillStyle = NAVY; c.font = '700 20px "JetBrains Mono", ui-monospace, monospace'; c.textAlign = 'center';
      c.fillText('07 · 22 · 38 · 61', w / 2, qy + qs + 70);
      c.fillStyle = '#5a6378'; c.font = '600 17px Inter, system-ui, sans-serif'; c.fillText('Quick Draw · 4 spots · $2.00', w / 2, qy + qs + 104);
      if (done) {
        c.fillStyle = '#18a957'; roundRect(c, w / 2 - 120, h - 140, 240, 64, 32); c.fill();
        c.fillStyle = '#fff'; c.font = '700 22px Inter, system-ui, sans-serif'; c.fillText('✓  Ticket printed', w / 2, h - 107);
      }
      c.textAlign = 'left';
      c.restore();
    });
  };

  // ----------------------------------------------------------- flecks: the slip streaming into the phone
  const FN = 1600, fpos = new Float32Array(FN * 3), fcol = new Float32Array(FN * 3), fl = [];
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3));
  fGeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
  for (let i = 0; i < FN; i++) {
    const u = rnd(i, 31), v = rnd(i, 32);
    fl.push({ u, v, d: 2.5 + v * 0.62 + rnd(i, 33) * 0.08, dur: 0.6 + rnd(i, 34) * 0.25, sx: rnd(i, 35), sy: rnd(i, 36), sw: (rnd(i, 37) - 0.5) * 0.9 });
    fcol.set([0.95, 0.45, 0.35], i * 3);
  }
  const flecks = new THREE.Points(fGeo, new THREE.PointsMaterial({ size: 0.011, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false }));
  flecks.frustumCulled = false;
  scene.add(flecks);
  const sampleColors = () => {
    if (colors || !img.naturalWidth) return;
    const cv = document.createElement('canvas'); cv.width = 64; cv.height = 135;
    const c = cv.getContext('2d'); c.drawImage(img, 0, 0, 64, 135);
    const d = c.getImageData(0, 0, 64, 135).data;
    for (let i = 0; i < FN; i++) {
      const p = (Math.floor(fl[i].v * 134) * 64 + Math.floor(fl[i].u * 63)) * 4;
      fcol.set([Math.pow(d[p] / 255, 2.2) * 1.4, Math.pow(d[p + 1] / 255, 2.2) * 1.4, Math.pow(d[p + 2] / 255, 2.2) * 1.4], i * 3);
    }
    fGeo.attributes.color.needsUpdate = true;
    colors = true;
  };
  const scrTarget = new THREE.Vector3(), from = new THREE.Vector3(), mid = new THREE.Vector3();

  // ----------------------------------------------------------- scanner and printer
  const scanner = new THREE.Group();
  const housing = mesh(new RoundedBoxGeometry(0.34, 0.42, 0.24, 4, 0.035), std(0x0d0f15, { roughness: 0.22, metalness: 0.35, envMapIntensity: 1.2 }));
  housing.position.y = 0.21; scanner.add(housing);
  const bezel = mesh(new RoundedBoxGeometry(0.27, 0.27, 0.012, 3, 0.02), std(0x050608, { roughness: 0.4 }), { cast: false });
  bezel.position.set(0, 0.25, 0.117); scanner.add(bezel);
  const foot = mesh(new RoundedBoxGeometry(0.38, 0.03, 0.28, 3, 0.012), std(0x07080b, { roughness: 0.5 }));
  foot.position.y = 0.015; scanner.add(foot);
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.006), new THREE.MeshBasicMaterial({ color: 0x2a5ea8, toneMapped: false }));
  strip.position.set(0, 0.075, 0.1215); scanner.add(strip);
  const windowM = mesh(new THREE.PlaneGeometry(0.24, 0.24), std(0x220608, { roughness: 0.05, metalness: 0.4, emissive: RED, emissiveIntensity: 0.2 }), { cast: false });
  windowM.position.set(0, 0.25, 0.1235); scanner.add(windowM);
  const led = mesh(new THREE.SphereGeometry(0.012, 12, 8), new THREE.MeshBasicMaterial({ color: 0x18a957, toneMapped: false }));
  led.position.set(0.12, 0.39, 0.121); scanner.add(led);
  const ledGlow = glow(0x18ff7a, 0.25, 0); ledGlow.position.copy(led.position); scanner.add(ledGlow);
  const slot = mesh(new THREE.BoxGeometry(0.2, 0.012, 0.03), std(0x050608)); slot.position.set(0, 0.42, -0.02); scanner.add(slot);
  const tTex = canvasTex(256, 640, (c, w, h) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#0b0b0c'; c.textAlign = 'center';
    c.font = '700 30px Inter, system-ui, sans-serif'; c.fillText('QUICK DRAW', w / 2, 60);
    c.font = '600 15px "JetBrains Mono", ui-monospace, monospace'; c.fillText('NEW YORK LOTTERY', w / 2, 92);
    c.fillRect(24, 112, w - 48, 2);
    c.font = '700 26px "JetBrains Mono", ui-monospace, monospace'; c.fillText('07 22 38 61', w / 2, 168);
    c.font = '600 16px "JetBrains Mono", ui-monospace, monospace'; c.fillText('4 SPOTS  ·  1 DRAW', w / 2, 210); c.fillText('$2.00', w / 2, 240);
    for (let i = 0; i < 70; i++) { const bw = 1 + Math.floor(rnd(i, 51) * 4); c.fillRect(30 + i * 2.8, 300, bw, 70); }
    c.globalAlpha = 0.4; c.fillRect(24, 420, w - 48, 1); c.globalAlpha = 1;
  }).tex;
  const ticket = new THREE.Group();
  const tGeo = new THREE.PlaneGeometry(0.16, 0.4); tGeo.translate(0, 0.2, 0);
  const tMesh = mesh(tGeo, std(0xffffff, { map: tTex, roughness: 0.6, side: THREE.DoubleSide }));
  ticket.add(tMesh);
  ticket.position.set(0, 0.425, -0.02);
  scanner.add(ticket);
  const fan = canvasTex(64, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,43,43,0.0)'); g.addColorStop(1, 'rgba(255,43,43,0.55)'); c.fillStyle = g; c.beginPath(); c.moveTo(w / 2 - 3, h); c.lineTo(w / 2 + 3, h); c.lineTo(w, 0); c.lineTo(0, 0); c.fill(); }).tex;
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.32), new THREE.MeshBasicMaterial({ map: fan, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beam.rotation.x = Math.PI / 2; beam.position.set(0, 0.25, 0.12 + 0.16);
  scanner.add(beam);
  scanner.position.set(0.68, 0, 0.0);
  scanner.rotation.y = -1.25;
  scene.add(scanner);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.42, 1.18, 1.02]], [2.4, [0.3, 1.0, 0.86], (x) => x],
    [3.4, [0.12, 0.62, 1.46]], [6.3, [-0.05, 0.58, 1.38], (x) => x],
    [7.3, [0.12, 0.76, 1.6]], [10, [0.28, 0.8, 1.5], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.02, 0.0, 0.02]], [2.4, [-0.04, 0.0, 0.0], (x) => x],
    [3.4, [0.02, 0.36, 0.2]], [6.3, [0.03, 0.36, 0.22], (x) => x],
    [7.3, [0.42, 0.3, 0.1]], [10, [0.45, 0.32, 0.08], (x) => x],
  ]);
  const tgt = new THREE.Vector3();
  const phonePose = (t) => {
    // [x, y, z, rx, ry, rz]
    if (t < 3.4) {
      const p = eo(k(t, 2.55, 3.4));
      return [lerp(0.7, 0.04, p), lerp(-0.1, 0.36, p), lerp(0.55, 0.22, p), lerp(-0.9, -0.12, p), lerp(-0.7, 0.18, p), lerp(0.3, 0, p)];
    }
    if (t < 7.2) return [0.04 + Math.sin(t * 0.9) * 0.008, 0.36 + Math.sin(t * 1.4) * 0.006, 0.22, -0.12 + Math.sin(t * 1.1) * 0.01, 0.18 - k(t, 3.4, 7.2) * 0.25, 0];
    const p = eio(k(t, 7.2, 7.75));
    return [lerp(0.04, 0.22, p), lerp(0.36, 0.3, p), lerp(0.22, 0.24, p), lerp(-0.12, -0.05, p), lerp(-0.07, 0.95, p), lerp(0, 0.03, p)];
  };

  function update(t) {
    sampleColors();
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.2) * 0.006, p[1] + Math.sin(t * 1.6 + 2) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]);
    camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 30], [2.4, 29], [3.4, 32], [7.3, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Pencil: glides in, taps each mark with a short scribble, then flicks away.
    drawSlip(MT.filter((m) => t > m + 0.1).length);
    let pi = MT.findIndex((m) => t < m + 0.2);
    if (pi < 0) pi = MT.length - 1;
    const prevW = pi > 0 ? markW[pi - 1] : new THREE.Vector3(0.5, 0.25, 0.6);
    const mv = eio(k(t, (pi > 0 ? MT[pi - 1] + 0.2 : 0.15), MT[pi] - 0.02));
    pTmp.lerpVectors(prevW, markW[pi], mv);
    const tap = k(t, MT[pi] - 0.02, MT[pi] + 0.18);
    const lift = 0.05 * Math.sin(Math.PI * mv) + (tap > 0 && tap < 1 ? 0 : t < MT[pi] ? 0.012 : 0.012);
    const scrib = tap > 0 && tap < 1 ? Math.sin(tap * Math.PI * 7) * 0.007 : 0;
    const away = ei(k(t, 2.15, 2.6));
    pencil.position.set(pTmp.x + scrib + away * 0.6, pTmp.y + lift + away * 0.35, pTmp.z + away * 0.3);
    pencil.visible = t < 2.6;
    shaft.rotation.z = -0.55 + scrib * 4;

    // Slip dissolves top first; each fleck leaves from where the seam passes and lands on the screen.
    const cutP = k(t, 2.5, 3.12);
    const cy = lerp(-PH / 2 - 0.02, PH / 2 + 0.02, cutP); // paper local z of the seam
    // Paper local z grows toward the bottom of the slip; keep the part below the seam.
    const n = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), paper.rotation.y);
    cut.normal.copy(n);
    cut.constant = -(n.dot(paper.position) + cy);
    paper.visible = cutP < 1;
    seam.position.z = cy;
    seam.visible = cutP > 0 && cutP < 1;
    seam.material.opacity = 1;

    // Phone
    const pp = phonePose(t);
    ph.position.set(pp[0], pp[1], pp[2]);
    ph.rotation.set(pp[3], pp[4], pp[5]);
    ph.visible = t > 2.5;
    ph.userData.sheen.position.x = Math.sin(t * 0.7) * 0.04;
    ph.updateMatrixWorld();
    drawUI(t);

    const pos = fGeo.attributes.position;
    let any = false;
    for (let i = 0; i < FN; i++) {
      const f = fl[i], a = (t - f.d) / f.dur;
      if (a > 0 && a < 1) {
        any = true;
        slipToWorld(f.u * 512, f.v * 1078, from); from.y = 0.004;
        scrTarget.set((f.sx - 0.5) * 0.62, (f.sy - 0.5) * 1.35, 0.06).applyMatrix4(ph.matrixWorld);
        const e = eio(a);
        mid.set(lerp(from.x, scrTarget.x, 0.5) + f.sw * 0.25, Math.max(from.y, scrTarget.y) + 0.25 + f.sw * 0.1, lerp(from.z, scrTarget.z, 0.5) + 0.15);
        // quadratic arc
        const x = (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * mid.x + e * e * scrTarget.x;
        const y = (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * mid.y + e * e * scrTarget.y;
        const z = (1 - e) * (1 - e) * from.z + 2 * (1 - e) * e * mid.z + e * e * scrTarget.z;
        pos.setXYZ(i, x, y, z);
      } else pos.setXYZ(i, 0, -50, 0);
    }
    pos.needsUpdate = true;
    flecks.visible = any;
    // Screen wakes up as the flecks arrive.
    const wake = k(t, 2.9, 3.5);
    ph.userData.screen.material.color.setScalar(lerp(0.05, 1, eo(wake)));

    // Scanner: laser on while the QR is presented, green beep, ticket feeds out and curls.
    const laser = clamp(k(t, 7.7, 7.8) * (1 - k(t, 8.35, 8.45)));
    beam.material.opacity = laser * (0.75 + 0.25 * Math.sin(t * 60));
    beam.visible = laser > 0.01;
    windowM.material.emissiveIntensity = 0.2 + laser * 1.8;
    laserLight.intensity = laser * 2.5;
    laserLight.position.set(0.55, 0.27, 0.08);
    const beep = t > 8.4 && t < 9.55;
    led.material.color.set(beep ? 0x18ff7a : 0x0d3b20);
    ledGlow.material.opacity = beep ? 0.8 * (1 - k(t, 8.4, 9.4) * 0.6) : 0;
    const feed = eo(k(t, 8.45, 9.35));
    ticket.visible = feed > 0;
    ticket.scale.set(1, Math.max(0.001, feed), 1);
    ticket.rotation.x = -0.25 - feed * 0.35;
    tTex.offset.y = 0;
  }

  return { scene, camera, update, duration: D, poster: 3.05, ready };
}
