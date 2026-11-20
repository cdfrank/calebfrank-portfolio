// Fujifilm Amazon experience review lit loop, 10 s. "Reading a listing the way a shopper does."
// A walnut desk at night under one warm lamp: a silver-topped camera in the foreground, a monitor showing
// a marketplace listing for it. A brass-and-glass loupe glides over the page and stops on its four parts
// in turn (the gallery, the title, the reviews, the details); each one is ringed in green, numbered, and
// sends a finding into the audit card beside the screen. The camera pulls back to the reviewed listing,
// the card stamps complete, and the project's name settles under the screen.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const GREEN = '#22d39b', GREEN_HEX = 0x22d39b, BUY = '#f3a51b';
// The four parts of the listing under review, in page px [x, y, w, h] on a 1024-wide page.
const ZONES = [[26, 56, 394, 506], [442, 60, 556, 104], [442, 174, 334, 56], [442, 378, 556, 182]];
const AT = [1.95, 3.0, 4.05, 5.1];            // loupe arrives on each part
const MARK = AT.map((a) => a + 0.22);         // its green ring starts to draw
const FILL = [0.42, 0.7, 0.52, 0.32];         // how far each finding's bar runs
const STAMP = 6.55;

// Five-point star path, for the review row and the audit icon.
function star(c, x, y, r) {
  c.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
    c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  c.closePath();
}
// The audit card's four icons, drawn in a 56 px box centred on (x, y).
function icon(c, i, x, y, col) {
  c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 3.5; c.lineJoin = 'round'; c.lineCap = 'round';
  if (i === 0) { roundRect(c, -15, -12, 30, 24, 4); c.stroke(); c.beginPath(); c.moveTo(-13, 9); c.lineTo(-3, -1); c.lineTo(4, 5); c.lineTo(8, 1); c.lineTo(13, 7); c.stroke(); c.beginPath(); c.arc(6, -5, 3, 0, 7); c.fill(); }
  else if (i === 1) { [-9, 0, 9].forEach((yy, j) => { c.beginPath(); c.moveTo(-14, yy); c.lineTo(j === 2 ? 4 : 14, yy); c.stroke(); }); }
  else if (i === 2) { star(c, 0, 1, 15); c.fill(); }
  else { [-9, 0, 9].forEach((yy) => { c.beginPath(); c.arc(-12, yy, 2.4, 0, 7); c.fill(); c.beginPath(); c.moveTo(-5, yy); c.lineTo(14, yy); c.stroke(); }); }
  c.restore();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060807);
  scene.fog = new THREE.Fog(0x060807, 4.2, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- room and desk
  const wall = mesh(new THREE.PlaneGeometry(10, 5), std(0xffffff, { map: grainTex('#141c18', { size: 256, speck: 0.06, blot: 0.1, seed: 31, repeat: 4 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 1.8, -1.45); scene.add(wall);
  const wash = glow(0xff9a52, 1, 0.22, 0.5); wash.position.set(-1.25, 1.55, -1.4); wash.scale.set(3.4, 2.8, 1); scene.add(wash);
  const walnut = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#3a2416'; c.fillRect(0, 0, w, h);
    for (let p = 0; p < 4; p++) {
      const y = p * h / 4;
      c.fillStyle = `rgb(${52 + rnd(p, 1) * 16},${32 + rnd(p, 2) * 10},${20 + rnd(p, 3) * 8})`; c.fillRect(0, y, w, h / 4);
      for (let g = 0; g < 34; g++) {
        c.strokeStyle = `rgba(${rnd(g, p) > 0.7 ? '120,80,50' : '14,8,4'},${0.06 + rnd(g, p + 2) * 0.14})`; c.lineWidth = 1 + rnd(g, p + 4) * 2.5;
        const gy = y + rnd(g, p + 9) * h / 4; c.beginPath(); c.moveTo(0, gy);
        for (let x = 0; x <= w; x += 48) c.lineTo(x, gy + Math.sin(x * 0.006 + g * 1.7) * 6 + Math.sin(x * 0.03 + g) * 1.5);
        c.stroke();
      }
      c.fillStyle = 'rgba(8,4,2,0.8)'; c.fillRect(0, y, w, 2);
    }
  });
  walnut.tex.wrapS = walnut.tex.wrapT = THREE.RepeatWrapping;
  const desk = mesh(new RoundedBoxGeometry(4.8, 0.08, 2.5, 3, 0.02), std(0xffffff, { map: walnut.tex, roughness: 0.42, metalness: 0.05 }));
  desk.position.set(0, -0.04, 0.15); scene.add(desk);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5f7a6e, 0x0b0705, 0.32));
  const key = new THREE.SpotLight(0xffcf9a, 0, 0, 0.62, 0.75, 1.3);
  key.position.set(-1.6, 2.5, 1.5); key.target.position.set(0.1, 0.45, -0.2);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 7; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x48e0b4, 1.3); rim.position.set(2.2, 1.6, -2.2); scene.add(rim);
  const spill = new THREE.PointLight(0xd6e8ff, 0, 2.6, 1.6); spill.position.set(0.05, 0.9, 0.2); scene.add(spill);
  const lampGlow = glow(0xffc184, 1.1, 0.5, 0.3); lampGlow.position.set(-1.75, 2.0, 0.9); scene.add(lampGlow);

  // ----------------------------------------------------------- the camera on the desk (generic, no marks)
  const prop = new THREE.Group();
  const leather = std(0xffffff, { map: grainTex('#202123', { size: 128, speck: 0.3, blot: 0.04, seed: 21, repeat: 3 }), roughness: 0.78 });
  const silver = std(0xc5c8cc, { metalness: 1, roughness: 0.28 });
  const black = std(0x141518, { metalness: 0.6, roughness: 0.38 });
  const body = mesh(new RoundedBoxGeometry(0.52, 0.2, 0.15, 3, 0.022), leather); body.position.y = 0.14; prop.add(body);
  const topPlate = mesh(new RoundedBoxGeometry(0.52, 0.075, 0.155, 3, 0.022), silver); topPlate.position.y = 0.272; prop.add(topPlate);
  const base = mesh(new RoundedBoxGeometry(0.52, 0.04, 0.155, 3, 0.015), silver); base.position.y = 0.03; prop.add(base);
  const barrel = mesh(new THREE.CylinderGeometry(0.074, 0.078, 0.12, 40), black); barrel.rotation.x = Math.PI / 2; barrel.position.set(0.04, 0.14, 0.135); prop.add(barrel);
  const grip = mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.045, 40), silver); grip.rotation.x = Math.PI / 2; grip.position.set(0.04, 0.14, 0.17); prop.add(grip);
  const front = new THREE.Mesh(new THREE.CircleGeometry(0.062, 40), std(0x0a1322, { metalness: 0.7, roughness: 0.06 })); front.position.set(0.04, 0.14, 0.1935); prop.add(front);
  const lensGlint = glow(0x9ad8ff, 0.07, 0.6, 0.3); lensGlint.position.set(0.02, 0.16, 0.2); prop.add(lensGlint);
  [[-0.16, 0.034], [0.15, 0.03], [0.205, 0.016]].forEach(([x, r]) => { const d = mesh(new THREE.CylinderGeometry(r, r, 0.034, 28), silver); d.position.set(x, 0.326, 0); prop.add(d); });
  const finder = mesh(new THREE.BoxGeometry(0.07, 0.038, 0.01), std(0x0b1118, { metalness: 0.5, roughness: 0.05 })); finder.position.set(-0.17, 0.274, 0.079); prop.add(finder);
  prop.position.set(-1.12, 0, 0.42); prop.rotation.y = 0.62; scene.add(prop);
  const cap = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.018, 36), black); cap.position.set(-0.62, 0.009, 0.78); scene.add(cap);

  // ----------------------------------------------------------- the monitor and its listing
  const mon = phone({ w: 1.5, h: 0.94, d: 0.045, frame: 0x1a1c1f, notch: false, r: 0.04 });
  mon.position.set(0.02, 0.95, -0.4); mon.rotation.x = -0.04; scene.add(mon);
  const neck = mesh(new THREE.BoxGeometry(0.12, 0.62, 0.04), std(0xa9adb2, { metalness: 0.9, roughness: 0.35 })); neck.position.set(0.02, 0.33, -0.47); scene.add(neck);
  const foot = mesh(new RoundedBoxGeometry(0.46, 0.02, 0.3, 2, 0.008), std(0xa9adb2, { metalness: 0.9, roughness: 0.35 })); foot.position.set(0.02, 0.01, -0.42); scene.add(foot);
  const { sw, sh } = mon.userData;
  const UW = 1024, UH = Math.round(1024 * sh / sw);
  const ui = canvasTex(UW, UH);
  mon.userData.screen.material.map = ui.tex; mon.userData.screen.material.needsUpdate = true;
  const screenGlow = glow(0x9fd6ff, 2.6, 0, 0.5); screenGlow.position.z = -0.15; screenGlow.scale.set(2.8, 1.9, 1); mon.add(screenGlow);
  // Where a page point sits on the screen, in monitor-local units.
  const toLocal = (x, y, out) => out.set((x / UW - 0.5) * sw, (0.5 - y / UH) * sh, 0);
  const zoneC = ZONES.map(([x, y, w, h]) => toLocal(x + w / 2, y + h / 2, new THREE.Vector3()));

  function page(c, w, h, boot) {
    c.fillStyle = '#05070a'; c.fillRect(0, 0, w, h);
    if (boot <= 0) return;
    const sec = (i) => eo(clamp(boot * 1.8 - i * 0.2));
    c.globalAlpha = sec(0);
    c.fillStyle = '#e7e9e5'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#20262c'; c.fillRect(0, 0, w, 40);
    ['#ff6157', '#ffbd2e', '#28c941'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(22 + i * 20, 20, 6, 0, 7); c.fill(); });
    c.fillStyle = '#3a424b'; roundRect(c, 100, 10, 420, 20, 10); c.fill();
    // Gallery: hero shot of the camera and a strip of thumbnails.
    c.globalAlpha = sec(1);
    const g = c.createLinearGradient(0, 60, 0, 470); g.addColorStop(0, '#f2f3f1'); g.addColorStop(1, '#cfd3cf');
    c.fillStyle = g; roundRect(c, 32, 62, 382, 410, 10); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.12)'; c.beginPath(); c.ellipse(223, 392, 140, 16, 0, 0, 7); c.fill();
    c.fillStyle = '#25272a'; roundRect(c, 98, 226, 250, 150, 18); c.fill();
    c.fillStyle = '#b8bcc1'; roundRect(c, 98, 200, 250, 46, 14); c.fill();
    c.fillStyle = '#9ea3a9'; c.fillRect(140, 186, 30, 16); c.fillRect(278, 188, 26, 14);
    c.fillStyle = '#121418'; c.beginPath(); c.arc(234, 300, 62, 0, 7); c.fill();
    c.fillStyle = '#5a6068'; c.beginPath(); c.arc(234, 300, 50, 0, 7); c.fill();
    const lg = c.createRadialGradient(220, 286, 4, 234, 300, 42); lg.addColorStop(0, '#5f86b8'); lg.addColorStop(0.6, '#13203a'); lg.addColorStop(1, '#070b14');
    c.fillStyle = lg; c.beginPath(); c.arc(234, 300, 42, 0, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.beginPath(); c.arc(220, 284, 7, 0, 7); c.fill();
    for (let i = 0; i < 4; i++) {
      c.fillStyle = i === 0 ? '#ffffff' : '#d9dcd8'; roundRect(c, 32 + i * 98, 486, 88, 66, 8); c.fill();
      if (i === 0) { c.strokeStyle = BUY; c.lineWidth = 3; c.stroke(); }
      c.fillStyle = '#2a2c30'; roundRect(c, 50 + i * 98, 508, 52, 30, 5); c.fill();
      c.fillStyle = '#121418'; c.beginPath(); c.arc(76 + i * 98 + (i % 2) * 4, 523, 10, 0, 7); c.fill();
    }
    // Title: two heavy lines of copy (shown as bars, no words).
    c.globalAlpha = sec(2);
    c.fillStyle = '#1d2228'; roundRect(c, 448, 70, 520, 24, 8); c.fill(); roundRect(c, 448, 104, 380, 24, 8); c.fill();
    c.fillStyle = '#7b848c'; roundRect(c, 448, 140, 200, 12, 6); c.fill();
    // Reviews: three and a half stars and a count bar.
    for (let i = 0; i < 5; i++) {
      star(c, 466 + i * 34, 202, 14); c.fillStyle = i < 3 ? BUY : '#c3c7c3'; c.fill();
      if (i === 3) { c.save(); c.beginPath(); c.rect(452 + i * 34, 186, 14, 32); c.clip(); star(c, 466 + i * 34, 202, 14); c.fillStyle = BUY; c.fill(); c.restore(); }
    }
    c.fillStyle = '#3d7fb8'; roundRect(c, 642, 196, 110, 12, 6); c.fill();
    // Price and buy buttons.
    c.globalAlpha = sec(3);
    c.fillStyle = '#c9cdc8'; c.fillRect(448, 246, 540, 2);
    c.fillStyle = '#1d2228'; roundRect(c, 448, 264, 150, 34, 8); c.fill();
    c.fillStyle = BUY; roundRect(c, 448, 314, 250, 44, 22); c.fill();
    c.fillStyle = '#f7c74b'; roundRect(c, 716, 314, 250, 44, 22); c.fill();
    // Details: bullet list.
    c.globalAlpha = sec(4);
    for (let i = 0; i < 6; i++) {
      c.fillStyle = '#4a525a'; c.beginPath(); c.arc(456, 398 + i * 28, 4, 0, 7); c.fill();
      c.fillStyle = '#69727a'; roundRect(c, 470, 393 + i * 28, 300 + rnd(i, 3) * 210, 10, 5); c.fill();
    }
    c.fillStyle = '#b5bab5'; for (let i = 0; i < 2; i++) { roundRect(c, 32, 576 + i * 20, 940 - i * 260, 8, 4); c.fill(); }
    c.globalAlpha = 1;
  }
  function marks(c, t) {
    ZONES.forEach(([x, y, w, h], i) => {
      const p = eo(k(t, MARK[i], MARK[i] + 0.45));
      if (p <= 0) return;
      const per = 2 * (w + h);
      c.save();
      c.strokeStyle = GREEN; c.lineWidth = 5; c.setLineDash([per * p, per]); c.lineDashOffset = 0;
      c.shadowColor = 'rgba(34,211,155,0.7)'; c.shadowBlur = 14;
      roundRect(c, x, y, w, h, 12); c.stroke();
      c.restore();
      c.fillStyle = 'rgba(34,211,155,0.07)'; c.globalAlpha = p; roundRect(c, x, y, w, h, 12); c.fill(); c.globalAlpha = 1;
      const b = back(k(t, MARK[i] + 0.3, MARK[i] + 0.6));
      if (b > 0) {
        c.save(); c.translate(x + w - 2, y + 2); c.scale(b, b);
        c.fillStyle = GREEN; c.beginPath(); c.arc(0, 0, 22, 0, 7); c.fill();
        c.strokeStyle = '#0b1612'; c.lineWidth = 3; c.stroke();
        c.fillStyle = '#04120c'; c.font = `800 24px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(i + 1), 0, 1);
        c.restore();
      }
    });
  }
  let uiKey = '';
  function drawUI(t) {
    const boot = k(t, 0.45, 1.5);
    const live = (boot > 0 && boot < 1) || MARK.some((m) => t > m && t < m + 0.65);
    const key = [Math.round(boot * 40), MARK.filter((m) => t > m + 0.65).length, live ? Math.round(t * 30) : 0].join('|');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => { page(c, w, h, boot); if (boot >= 1) marks(c, t); });
    lensTex.needsUpdate = true;
  }

  // ----------------------------------------------------------- the loupe (child of the monitor)
  const LR = 0.13, MAG = 1.9;
  const lensTex = ui.tex.clone();
  lensTex.needsUpdate = true;
  lensTex.repeat.set((2 * LR / MAG) / sw, (2 * LR / MAG) / sh);
  const loupe = new THREE.Group(); mon.add(loupe);
  const brass = std(0xb08a4a, { metalness: 1, roughness: 0.26 });
  const rimRing = mesh(new THREE.TorusGeometry(LR + 0.012, 0.014, 14, 64), brass); loupe.add(rimRing);
  const lensM = new THREE.MeshBasicMaterial({ map: lensTex, color: 0xd8d8d8, toneMapped: false });
  const lens = new THREE.Mesh(new THREE.CircleGeometry(LR, 48), lensM); loupe.add(lens);
  const sheenTex = canvasTex(128, 128, (c, w) => {
    const g = c.createLinearGradient(0, 0, w, w);
    g.addColorStop(0.2, 'rgba(255,255,255,0)'); g.addColorStop(0.36, 'rgba(255,255,255,0.32)'); g.addColorStop(0.44, 'rgba(255,255,255,0.05)'); g.addColorStop(0.7, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill();
    const v = c.createRadialGradient(w / 2, w / 2, w * 0.36, w / 2, w / 2, w / 2); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.55)');
    c.fillStyle = v; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill();
  }).tex;
  const lensSheen = new THREE.Mesh(new THREE.CircleGeometry(LR, 48), new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, depthWrite: false, toneMapped: false }));
  lensSheen.position.z = 0.002; loupe.add(lensSheen);
  const handle = new THREE.Group(); handle.rotation.z = 0.75; loupe.add(handle);
  const collar = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 20), brass); collar.position.y = -(LR + 0.04); handle.add(collar);
  const stick = mesh(new THREE.CylinderGeometry(0.022, 0.026, 0.26, 20), std(0x1c1410, { roughness: 0.45, metalness: 0.1 })); stick.position.y = -(LR + 0.19); handle.add(stick);
  const loupeGlow = glow(GREEN_HEX, 0.5, 0, 0.4); loupeGlow.position.z = -0.01; loupe.add(loupeGlow);

  // ----------------------------------------------------------- the audit card and the findings that fly to it
  const PW = 512, PH = 660, PWW = 0.6, PHW = PWW * PH / PW;
  const card = canvasTex(PW, PH);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(PWW, PHW), new THREE.MeshBasicMaterial({ map: card.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(panel);
  const panelGlow = glow(GREEN_HEX, 1, 0, 0.5); panelGlow.scale.set(1.2, 1.3, 1); scene.add(panelGlow);
  const ROW_Y = (i) => 196 + i * 104;
  let cKey = '';
  function drawCard(t) {
    const fills = FILL.map((f, i) => eo(k(t, MARK[i] + 0.7, MARK[i] + 1.15)));
    const st = back(k(t, STAMP, STAMP + 0.4));
    const live = fills.some((f) => f > 0 && f < 1) || (st > 0 && t < STAMP + 0.45);
    const key = [fills.filter((f) => f >= 1).length, live ? Math.round(t * 30) : 0, st >= 1 ? 1 : 0].join('|');
    if (key === cKey) return; cKey = key;
    card.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(9,15,13,0.88)'; roundRect(c, 4, 4, w - 8, h - 8, 28); c.fill();
      c.strokeStyle = 'rgba(34,211,155,0.35)'; c.lineWidth = 2; c.stroke();
      c.textBaseline = 'middle';
      c.fillStyle = GREEN; c.font = `700 22px ${MONO}`; c.fillText('Fujifilm', 34, 52);
      c.fillStyle = '#eef6f2'; c.font = `800 33px ${SANS}`; c.fillText('Amazon experience', 34, 94);
      c.fillText('review', 34, 132);
      FILL.forEach((f, i) => {
        const y = ROW_Y(i), p = fills[i], done = p > 0;
        c.fillStyle = done ? 'rgba(34,211,155,0.16)' : 'rgba(255,255,255,0.05)'; roundRect(c, 26, y - 40, w - 52, 84, 18); c.fill();
        c.fillStyle = done ? GREEN : 'rgba(255,255,255,0.1)'; roundRect(c, 42, y - 28, 56, 56, 14); c.fill();
        icon(c, i, 70, y, done ? '#06140e' : 'rgba(255,255,255,0.45)');
        c.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(c, 118, y - 6, 300, 12, 6); c.fill();
        if (p > 0) { c.fillStyle = GREEN; roundRect(c, 118, y - 6, Math.max(12, 300 * f * p), 12, 6); c.fill(); }
        c.fillStyle = done ? GREEN : 'rgba(255,255,255,0.3)'; c.font = `800 22px ${MONO}`; c.textAlign = 'center'; c.fillText(String(i + 1), w - 56, y + 1); c.textAlign = 'left';
      });
      if (st > 0) {
        c.save(); c.translate(w - 92, 92); c.rotate(-0.18); c.scale(st, st);
        c.strokeStyle = GREEN; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, 46, 0, 7); c.stroke();
        c.lineWidth = 2; c.beginPath(); c.arc(0, 0, 37, 0, 7); c.stroke();
        c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(-17, 1); c.lineTo(-4, 14); c.lineTo(19, -13); c.stroke();
        c.restore();
      }
    });
  }
  const chips = ZONES.map(() => { const s = glow(GREEN_HEX, 0.16, 0, 0.3); scene.add(s); return s; });

  // ----------------------------------------------------------- title for the payoff
  const title = label('Amazon experience review', { font: `800 64px ${SANS}`, fg: '#f1f7f4', bg: 'rgba(8,13,11,0.78)', h: 0.15, pad: 40, track: 1 });
  const client = label('Fujifilm', { font: `700 56px ${MONO}`, fg: GREEN, h: 0.1, pad: 8, track: 3 });
  scene.add(title, client);
  const TW = title.geometry.parameters.width, CW = client.geometry.parameters.width;

  // ----------------------------------------------------------- lamp dust and back-wall bokeh
  const DN = 160, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd6a6, size: 0.01, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);
  const dotTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.55, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const BN = 26, bpos = new Float32Array(BN * 3), bcol = new Float32Array(BN * 3);
  for (let i = 0; i < BN; i++) {
    bpos.set([(rnd(i, 41) - 0.5) * 6.5, 0.6 + rnd(i, 42) * 2.4, -1.38], i * 3);
    const warm = rnd(i, 43) > 0.35; bcol.set(warm ? [1, 0.62, 0.32] : [0.2, 0.85, 0.62], i * 3);
  }
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bGeo.setAttribute('color', new THREE.BufferAttribute(bcol, 3));
  const bokeh = new THREE.Points(bGeo, new THREE.PointsMaterial({ size: 0.22, map: dotTex, vertexColors: true, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(bokeh);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.75, 1.3, 3.7]], [1.8, [0.28, 1.06, 3.1]],
    [5.7, [0.55, 0.98, 2.88], (x) => x],
    [7.1, [0.5, 1.02, 3.35]], [10, [0.62, 1.05, 3.5], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.15, 0.62, -0.3]], [1.8, [0.34, 0.86, -0.3]],
    [5.7, [0.4, 0.84, -0.25], (x) => x],
    [7.1, [0.32, 0.7, -0.1]], [10, [0.32, 0.7, -0.1], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), lw = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), m = new THREE.Vector3(), tmp = new THREE.Vector3();
  const REST = new THREE.Vector3(1.05, -0.75, 0.5), EXIT = new THREE.Vector3(1.2, -0.95, 0.6);

  // Loupe path: rest, then each part in turn (dwell, then glide on), then away.
  function loupeAt(t, out) {
    const stops = [[1.4, REST], ...AT.flatMap((at, i) => [[at, zoneC[i]], [at + 0.55, zoneC[i]]]), [6.35, EXIT]];
    if (t <= stops[0][0]) return { lift: 0, out: out.copy(REST) };
    for (let i = 1; i < stops.length; i++) {
      if (t <= stops[i][0]) {
        const [t0, p0] = stops[i - 1], [t1, p1] = stops[i];
        const e = eio(k(t, t0, t1));
        out.lerpVectors(p0, p1, e);
        return { lift: p0 === p1 ? 0 : Math.sin(Math.PI * e), out };
      }
    }
    return { lift: 0, out: out.copy(EXIT) };
  }
  const lp = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);

    // Lamp snaps on, screen boots.
    const on = clamp(back(k(t, 0.1, 0.7)));
    key.intensity = 15 * on;
    lampGlow.material.opacity = 0.55 * on;
    wash.material.opacity = 0.22 * on;
    const boot = eo(k(t, 0.45, 1.3));
    mon.userData.screen.material.color.setScalar(lerp(0.03, 0.8, boot));
    screenGlow.material.opacity = 0.22 * boot;
    spill.intensity = 0.9 * boot;
    mon.userData.sheen.position.x = Math.sin(t * 0.5) * 0.08;
    drawUI(t);

    // Loupe glides over the page; its lens shows the page magnified under it.
    const { lift } = loupeAt(t, lp);
    const away = k(t, 5.7, 6.35);
    loupe.position.set(lp.x + Math.sin(t * 2.3) * 0.004, lp.y + Math.cos(t * 2.0) * 0.004, 0.12 + lift * 0.07 + away * 0.1);
    loupe.rotation.set(Math.sin(t * 1.3) * 0.05, Math.cos(t * 1.1) * 0.06, -0.08 + lift * 0.1);
    const ls = eo(k(t, 1.2, 1.7)) * (1 - ei(k(t, 5.95, 6.45)));
    loupe.scale.setScalar(Math.max(0.001, ls));
    loupe.visible = ls > 0.01;
    lensTex.offset.set(lp.x / sw + 0.5 - lensTex.repeat.x / 2, lp.y / sh + 0.5 - lensTex.repeat.y / 2);
    const dwell = AT.reduce((acc, at) => Math.max(acc, Math.sin(Math.PI * k(t, at - 0.05, at + 0.6))), 0);
    loupeGlow.material.opacity = 0.55 * dwell;
    loupeGlow.scale.setScalar(0.42 + dwell * 0.1);

    // Camera leans toward whichever part the loupe is reading, then lets go for the wide payoff.
    mon.updateMatrixWorld(); loupe.getWorldPosition(lw);
    const lean = 0.22 * k(t, 1.4, 2.0) * (1 - eio(k(t, 5.6, 6.6)));
    tgt.set(q[0] + (lw.x - q[0]) * lean, q[1] + (lw.y - q[1]) * lean, q[2]);
    camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 33], [1.8, 31], [5.7, 29.5], [7.1, 32], [10, 32.5]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Audit card slides in beside the screen, then steps forward for the payoff.
    const pin = eo(k(t, 1.3, 2.0)), pf = back(k(t, 6.2, 6.85));
    panel.position.set(lerp(1.35, 1.12, pin) - pf * 0.08, 0.98 + pf * 0.02, lerp(-0.05, 0.02, pin) + pf * 0.2);
    panel.lookAt(camera.position.x, panel.position.y, camera.position.z);
    panel.scale.setScalar(1 + pf * 0.08);
    panel.material.opacity = pin;
    panel.visible = pin > 0.01;
    panel.updateMatrixWorld();
    drawCard(t);
    const flash = Math.exp(-4 * Math.max(0, t - STAMP)) * (t > STAMP ? 1 : 0);
    panelGlow.position.copy(panel.position).add(tmp.set(0, 0, -0.05));
    panelGlow.material.opacity = 0.12 * pin + 0.4 * flash;

    // Each marked part sends a finding into its row on the card.
    chips.forEach((s, i) => {
      const f = k(t, MARK[i] + 0.15, MARK[i] + 0.75);
      s.visible = f > 0 && f < 1;
      if (!s.visible) return;
      a.copy(zoneC[i]); mon.localToWorld(a);
      b.set((70 / PW - 0.5) * PWW, (0.5 - ROW_Y(i) / PH) * PHW, 0.01); panel.localToWorld(b);
      m.lerpVectors(a, b, 0.5); m.z += 0.35; m.y += 0.12;
      const e = eio(f);
      s.position.set(
        (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * m.x + e * e * b.x,
        (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * m.y + e * e * b.y,
        (1 - e) * (1 - e) * a.z + 2 * (1 - e) * e * m.z + e * e * b.z,
      );
      s.material.opacity = Math.sin(Math.PI * f) * 0.95;
      s.scale.setScalar(0.14 + Math.sin(Math.PI * f) * 0.06);
    });

    // The project's name settles under the screen.
    const ti = back(k(t, 6.75, 7.35)), to = ei(k(t, 9.15, 9.6));
    title.position.set(0.02 + 0.06, 0.29 + (1 - ti) * -0.06, 0.15);
    title.lookAt(camera.position.x, title.position.y, camera.position.z);
    title.material.opacity = clamp(ti) * (1 - to);
    title.visible = ti > 0.01;
    client.position.set(title.position.x - TW / 2 + CW / 2 + 0.02, 0.43 + (1 - clamp(back(k(t, 6.6, 7.2)))) * -0.05, 0.16);
    client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(back(k(t, 6.6, 7.2))) * (1 - to);
    client.visible = client.material.opacity > 0.01;

    // Dust turning in the lamp light.
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.4 + rnd(i, 51) * 2.6 + Math.sin(t * 0.3 + i) * 0.12;
      dpos[i * 3 + 1] = 0.2 + rnd(i, 52) * 1.9 + Math.sin(t * 0.45 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -0.6 + rnd(i, 53) * 1.8 + Math.cos(t * 0.2 + i) * 0.1;
    }
    dGeo.attributes.position.needsUpdate = true;
    dust.material.opacity = 0.5 * on;
  }

  return { scene, camera, update, duration: D, poster: 7.6 };
}
