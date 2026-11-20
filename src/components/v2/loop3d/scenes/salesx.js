// BASF SalesX lit loop, 10 s. "Scattered tools become one season plan."
// A wooden worktable at the edge of a cornfield at golden hour. The rep's five scattered tools lie on
// the table as cards; they lift, turn and fly into one tablet, each one becoming a module of SalesX.
// The tablet stands up and runs the season plan: growers pop onto the territory map, the four season
// bars fill, and the rollout count climbs from the 40-person pilot to 800+.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, phone, dip, skyDome, sway,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const BLUE = '#004a96', DARK = '#00305e', GREEN = '#65ac1e', SKY = '#21a0d2', ORANGE = '#f39500';
const F = '600 20px Inter, system-ui, sans-serif';
// The five tools a rep juggled, and the SalesX module each one becomes.
const TOOLS = [
  { t: 'Spreadsheet', m: 'Planning', c: '#1f7a3a' },
  { t: 'Rebate accruals', m: 'Rebates', c: ORANGE },
  { t: 'Account notes', m: 'Accounts', c: '#c9a227' },
  { t: 'Territory map', m: 'Territory', c: SKY },
  { t: 'Inbox', m: 'Activity', c: '#7a4fd6' },
];
// Where each card lies on the table [x, z, rotY] and when it lifts and lands.
const LIE = [[-1.05, 0.28, 0.35], [-0.42, 0.62, -0.22], [0.52, 0.55, 0.28], [1.08, 0.18, -0.4], [0.2, -0.52, 0.15]];
const LIFT = [2.15, 2.3, 2.42, 2.55, 2.68];
const LAND = LIFT.map((l) => l + 1.05);
const PINS = [[0.22, 0.3], [0.38, 0.22], [0.55, 0.36], [0.31, 0.52], [0.7, 0.28], [0.47, 0.62], [0.64, 0.56], [0.18, 0.68], [0.82, 0.47], [0.74, 0.74], [0.4, 0.8], [0.88, 0.2]];

function cardFace(tool, i) {
  return canvasTex(512, 340, (c, w, h) => {
    c.fillStyle = '#f6f3ec'; c.fillRect(0, 0, w, h);
    c.fillStyle = tool.c; c.fillRect(0, 0, w, 54);
    c.fillStyle = '#fff'; c.font = '700 26px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText(tool.t, 22, 28);
    c.fillStyle = '#2b2b2b';
    if (i === 0) { // grid of cells
      c.strokeStyle = '#c9cfc6'; c.lineWidth = 1.5;
      for (let y = 70; y < h - 10; y += 30) { c.beginPath(); c.moveTo(14, y); c.lineTo(w - 14, y); c.stroke(); }
      for (let x = 14; x < w; x += 82) { c.beginPath(); c.moveTo(x, 70); c.lineTo(x, h - 16); c.stroke(); }
      c.font = '500 15px "JetBrains Mono", ui-monospace, monospace';
      for (let r = 0; r < 8; r++) for (let q = 0; q < 6; q++) if (rnd(r * 7 + q, 4) > 0.3) c.fillText(String(Math.floor(rnd(r, q) * 9000)), 20 + q * 82, 86 + r * 30);
    } else if (i === 1) { // form with amounts
      c.font = '600 18px Inter, system-ui, sans-serif';
      for (let r = 0; r < 6; r++) { c.fillStyle = '#5a5a5a'; c.fillText(['Q1 accrual', 'Q2 accrual', 'Volume tier', 'Adjustment', 'Pending', 'Paid'][r], 22, 88 + r * 40); c.fillStyle = '#1b1b1b'; c.textAlign = 'right'; c.fillText('$' + (1200 + Math.floor(rnd(r, 9) * 9000)).toLocaleString('en-US'), w - 24, 88 + r * 40); c.textAlign = 'left'; c.fillStyle = '#ddd'; c.fillRect(22, 104 + r * 40, w - 44, 1.5); }
      c.fillStyle = '#d23b2b'; c.font = '800 22px Inter, system-ui, sans-serif'; c.save(); c.translate(w - 120, 70); c.rotate(-0.2); c.strokeStyle = '#d23b2b'; c.lineWidth = 3; c.strokeRect(-6, -18, 112, 36); c.fillText('LATE', 14, 1); c.restore();
    } else if (i === 2) { // legal pad notes
      c.fillStyle = '#fff6c9'; c.fillRect(0, 54, w, h);
      c.strokeStyle = '#9fc3e0'; c.lineWidth = 1.2; for (let y = 90; y < h; y += 28) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
      c.strokeStyle = '#e08a8a'; c.beginPath(); c.moveTo(60, 54); c.lineTo(60, h); c.stroke();
      c.strokeStyle = '#2a3a6a'; c.lineWidth = 2.2;
      for (let r = 0; r < 8; r++) { c.beginPath(); let x = 72; c.moveTo(x, 84 + r * 28); while (x < 72 + 300 * (0.5 + rnd(r, 2) * 0.5)) { x += 10; c.lineTo(x, 84 + r * 28 + Math.sin(x * 0.6 + r) * 3); } c.stroke(); }
    } else if (i === 3) { // folded paper map
      c.fillStyle = '#e9ead8'; c.fillRect(0, 54, w, h);
      for (let q = 0; q < 40; q++) { c.fillStyle = `rgba(${90 + rnd(q, 1) * 60},${130 + rnd(q, 2) * 60},${70 + rnd(q, 3) * 40},0.55)`; c.fillRect(rnd(q, 4) * w, 54 + rnd(q, 5) * (h - 54), 30 + rnd(q, 6) * 70, 20 + rnd(q, 7) * 50); }
      c.strokeStyle = '#8a8a7a'; c.lineWidth = 2; for (let x = 128; x < w; x += 128) { c.beginPath(); c.moveTo(x, 54); c.lineTo(x, h); c.stroke(); }
      c.strokeStyle = '#d24b3b'; c.lineWidth = 4; c.beginPath(); c.moveTo(30, h - 40); c.bezierCurveTo(160, 120, 300, 300, 480, 90); c.stroke();
    } else { // inbox list
      for (let r = 0; r < 6; r++) {
        const y = 66 + r * 45;
        c.fillStyle = r < 4 ? '#7a4fd6' : '#bbb'; c.beginPath(); c.arc(30, y + 18, 6, 0, 7); c.fill();
        c.fillStyle = '#1b1b1b'; c.font = `${r < 4 ? 700 : 500} 18px Inter, system-ui, sans-serif`; c.fillText(['Re: rebate status?', 'Spring order changes', 'Fwd: price list v3', 'Grower meeting Tue', 'Seed delivery', 'Re: Re: invoice'][r], 48, y + 10);
        c.fillStyle = '#8a8a8a'; c.font = '500 14px Inter, system-ui, sans-serif'; c.fillText('Lorem retail partner · 2d', 48, y + 32);
      }
    }
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xc0794a, 7, 30);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);
  const uT = { value: 0 };

  // ----------------------------------------------------------- sky, sun, field
  scene.add(skyDome([[0, '#0b1630'], [0.32, '#2b2c55'], [0.44, '#9a4f4a'], [0.5, '#f0a35a'], [0.52, '#c0794a'], [1, '#2a1a12']]));
  const sun = glow(0xffb468, 9, 0.95, 0.18); sun.position.set(-6, -0.35, -26); scene.add(sun);
  const sunCore = glow(0xfff1d0, 2.2, 1, 0.3); sunCore.position.set(-6, -0.35, -25.8); scene.add(sunCore);
  const soil = mesh(new THREE.PlaneGeometry(80, 60), std(0xffffff, { map: grainTex('#2a1d15', { size: 256, speck: 0.12, blot: 0.12, seed: 8, repeat: 12 }), roughness: 1 }), { cast: false });
  soil.rotation.x = -Math.PI / 2; soil.position.set(0, -0.9, -20); scene.add(soil);
  // Corn rows running to the horizon, backlit by the low sun.
  const pg = new THREE.ConeGeometry(0.05, 1, 5); pg.translate(0, 0.5, 0);
  const rows = [];
  for (let x = -12; x <= 12; x += 0.5) for (let z = -1.7; z > -26; z -= 0.32) rows.push([x + (rnd(x * 9, z) - 0.5) * 0.12, z + (rnd(z * 7, x) - 0.5) * 0.1, 0.75 + rnd(x, z * 3) * 0.45]);
  const field = new THREE.InstancedMesh(pg, sway(std(0x56622c, { roughness: 0.85, emissive: 0x1a1406, emissiveIntensity: 0.6 }), uT, 0.09), rows.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  rows.forEach(([x, z, h], i) => { q4.setFromEuler(new THREE.Euler((rnd(i, 1) - 0.5) * 0.12, rnd(i, 2) * 6, (rnd(i, 3) - 0.5) * 0.12)); m4.compose(p4.set(x, -0.9, z), q4, s4.set(1.6, h, 1.6)); field.setMatrixAt(i, m4); });
  field.castShadow = false; field.receiveShadow = false;
  scene.add(field);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x6a7ab8, 0x2a170c, 0.55));
  const sunL = new THREE.DirectionalLight(0xffa35a, 3.2);
  sunL.position.set(-3.2, 1.6, -6); sunL.target.position.set(0, 0, 0);
  sunL.castShadow = true; sunL.shadow.mapSize.set(1024, 1024);
  Object.assign(sunL.shadow.camera, { left: -2.4, right: 2.4, top: 2.4, bottom: -2.4, near: 1, far: 14 });
  sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.02;
  scene.add(sunL, sunL.target);
  const fill = new THREE.SpotLight(0xffe9d2, 9, 0, 0.75, 0.9, 1.4);
  fill.position.set(1.6, 2.6, 2.6); fill.target.position.set(0, 0.2, 0);
  scene.add(fill, fill.target);

  // ----------------------------------------------------------- the worktable
  const plank = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#6b4a30'; c.fillRect(0, 0, w, h);
    for (let p = 0; p < 6; p++) {
      const y = p * h / 6;
      c.fillStyle = `rgb(${96 + rnd(p, 1) * 26},${64 + rnd(p, 2) * 18},${40 + rnd(p, 3) * 12})`; c.fillRect(0, y, w, h / 6);
      for (let g = 0; g < 26; g++) { c.strokeStyle = `rgba(30,18,10,${0.08 + rnd(g, p) * 0.14})`; c.lineWidth = 1 + rnd(g, p + 4) * 2; c.beginPath(); const gy = y + rnd(g, p + 9) * h / 6; c.moveTo(0, gy); for (let x = 0; x <= w; x += 64) c.lineTo(x, gy + Math.sin(x * 0.01 + g) * 4); c.stroke(); }
      c.fillStyle = 'rgba(15,8,4,0.85)'; c.fillRect(0, y, w, 3);
    }
  });
  plank.tex.wrapS = plank.tex.wrapT = THREE.RepeatWrapping;
  const table = mesh(new RoundedBoxGeometry(4.2, 0.12, 2.1, 3, 0.02), std(0xffffff, { map: plank.tex, roughness: 0.7 }));
  table.position.set(0, -0.06, 0); scene.add(table);
  [[-1.9, -0.85], [1.9, -0.85], [-1.9, 0.85], [1.9, 0.85]].forEach(([x, z]) => { const l = mesh(new THREE.BoxGeometry(0.1, 0.9, 0.1), std(0x4a3220, { roughness: 0.8 })); l.position.set(x, -0.57, z); scene.add(l); });
  // A coffee cup and a seed-corn cob: small truths of a rep's day.
  const cup = new THREE.Group();
  const cupB = mesh(new THREE.CylinderGeometry(0.085, 0.07, 0.2, 24), std(0xe9e4da, { roughness: 0.35 })); cupB.position.y = 0.1; cup.add(cupB);
  const cupL = mesh(new THREE.CylinderGeometry(0.087, 0.087, 0.02, 24), std(0x1b1b1d, { roughness: 0.4 })); cupL.position.y = 0.205; cup.add(cupL);
  const sleeve = mesh(new THREE.CylinderGeometry(0.083, 0.078, 0.07, 24), std(0x8a6a44, { roughness: 0.9 })); sleeve.position.y = 0.09; cup.add(sleeve);
  cup.position.set(1.55, 0, -0.45); scene.add(cup);
  const cob = new THREE.Group();
  const kern = mesh(new THREE.CapsuleGeometry(0.045, 0.24, 6, 12), std(0xe6b13a, { roughness: 0.45 })); kern.rotation.z = Math.PI / 2; cob.add(kern);
  const husk = mesh(new THREE.ConeGeometry(0.06, 0.22, 6), std(0xc9b77a, { roughness: 0.9 })); husk.rotation.z = -Math.PI / 2; husk.position.x = 0.22; cob.add(husk);
  cob.position.set(-1.62, 0.045, -0.5); cob.rotation.y = 0.5; scene.add(cob);

  // ----------------------------------------------------------- the five scattered tools
  const cards = TOOLS.map((tool, i) => {
    const g = new THREE.Group();
    const face = cardFace(tool, i);
    const slab = mesh(new RoundedBoxGeometry(0.62, 0.012, 0.41, 2, 0.006), std(0xf2efe8, { roughness: 0.8 }));
    g.add(slab);
    const top = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), std(0xffffff, { map: face.tex, roughness: 0.75 }));
    top.rotation.x = -Math.PI / 2; top.position.y = 0.0065; top.receiveShadow = true;
    g.add(top);
    const trail = glow(new THREE.Color(tool.c), 0.5, 0, 0.3); g.add(trail);
    scene.add(g);
    return { g, trail };
  });

  // ----------------------------------------------------------- the tablet
  const tab = phone({ w: 1.24, h: 0.86, d: 0.045, frame: 0x1e2024, notch: false, r: 0.06 });
  scene.add(tab);
  const stand = mesh(new THREE.BoxGeometry(0.7, 0.42, 0.012), std(0x24262b, { roughness: 0.6 }));
  stand.geometry.translate(0, -0.21, 0);
  stand.position.set(0, 0.3, -0.025);
  tab.add(stand);
  const UW = 1024, UH = Math.round(1024 * (tab.userData.sh / tab.userData.sw));
  const ui = canvasTex(UW, UH);
  tab.userData.screen.material.map = ui.tex;
  tab.userData.screen.material.needsUpdate = true;
  const screenGlow = glow(0x6fb6ff, 2.4, 0, 0.5); screenGlow.position.z = -0.12; tab.add(screenGlow);

  let uiKey = '';
  const drawUI = (t) => {
    const boot = k(t, 2.95, 3.35), lay = eo(k(t, 3.5, 4.1));
    const mods = LAND.filter((l) => t > l).length;
    const pins = PINS.filter((_, i) => t > 4.7 + i * 0.12).length;
    const bars = eo(k(t, 5.1, 7.2)), users = Math.round(lerp(40, 812, eo(k(t, 6.6, 8.3))));
    const live = (t > 2.9 && t < 4.2) || (t > 4.6 && t < 8.4);
    const key = [mods, pins, live ? Math.round(t * 30) : 0, users].join('|');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      c.fillStyle = '#04070d'; c.fillRect(0, 0, w, h);
      if (boot <= 0) return;
      c.globalAlpha = boot;
      c.fillStyle = '#f2f4f7'; c.fillRect(0, 0, w, h);
      // Top bar
      c.fillStyle = DARK; c.fillRect(0, 0, w, 70);
      c.fillStyle = '#fff'; c.font = '800 34px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText('SalesX', 110, 36);
      c.fillStyle = GREEN; c.fillRect(110, 58, 104, 4);
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = F; c.textAlign = 'right'; c.fillText('Season plan  ·  US Crop', w - 30, 36); c.textAlign = 'left';
      // Module rail: each tool that landed lights a module.
      c.fillStyle = '#e4e8ee'; c.fillRect(0, 70, 90, h - 70);
      TOOLS.forEach((tool, i) => {
        const on = i < mods, pop = back(k(t, LAND[i], LAND[i] + 0.35));
        const y = 120 + i * 92;
        c.save(); c.translate(45, y); c.scale(on ? 0.7 + pop * 0.3 : 0.7, on ? 0.7 + pop * 0.3 : 0.7);
        c.fillStyle = on ? tool.c : '#c5ccd6'; roundRect(c, -30, -30, 60, 60, 14); c.fill();
        c.fillStyle = '#fff'; c.font = '800 26px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(tool.m[0], 0, 2);
        c.restore();
        c.fillStyle = on ? DARK : '#9aa3b0'; c.font = '700 13px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText(tool.m, 45, y + 42); c.textAlign = 'left';
      });
      if (lay <= 0) {
        c.fillStyle = BLUE; c.font = '800 64px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('SalesX', w / 2 + 45, h / 2); c.textAlign = 'left';
        c.globalAlpha = 1; return;
      }
      c.save(); c.globalAlpha = boot * lay; c.translate(0, (1 - lay) * 30);
      // Territory map
      const mx = 116, my = 96, mw = 470, mh = h - 130;
      c.fillStyle = '#fff'; roundRect(c, mx, my, mw, mh, 16); c.fill();
      c.save(); roundRect(c, mx + 10, my + 46, mw - 20, mh - 56, 10); c.clip();
      for (let q = 0; q < 60; q++) { c.fillStyle = `rgba(${120 + rnd(q, 11) * 50},${165 + rnd(q, 12) * 45},${90 + rnd(q, 13) * 40},${0.35 + rnd(q, 14) * 0.35})`; c.fillRect(mx + 10 + (q % 10) * 46, my + 46 + Math.floor(q / 10) * 66, 45, 65); }
      c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 2; for (let x = 0; x < 11; x++) { c.beginPath(); c.moveTo(mx + 10 + x * 46, my + 46); c.lineTo(mx + 10 + x * 46, my + mh); c.stroke(); }
      const hub = [mx + 10 + 0.5 * (mw - 20), my + 46 + 0.48 * (mh - 56)];
      PINS.forEach(([px, py], i) => {
        if (i >= pins) return;
        const s = clampP(spring(k(t, 4.7 + i * 0.12, 5.3 + i * 0.12)));
        const x = mx + 10 + px * (mw - 20), y = my + 46 + py * (mh - 56);
        c.strokeStyle = 'rgba(0,74,150,0.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(hub[0], hub[1]); c.lineTo(lerp(hub[0], x, s), lerp(hub[1], y, s)); c.stroke();
        c.fillStyle = GREEN; c.beginPath(); c.arc(x, y, 11 * s, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 3; c.stroke();
      });
      c.fillStyle = BLUE; roundRect(c, hub[0] - 15, hub[1] - 15, 30, 30, 8); c.fill();
      c.restore();
      c.fillStyle = DARK; c.font = '800 22px Inter, system-ui, sans-serif'; c.fillText('Territory', mx + 18, my + 26);
      c.fillStyle = '#6a7484'; c.font = '600 16px Inter, system-ui, sans-serif'; c.textAlign = 'right'; c.fillText(pins + ' growers', mx + mw - 18, my + 26); c.textAlign = 'left';
      // Season plan bars
      const sx = 604, sy = 96, swd = w - sx - 26, sht = 330;
      c.fillStyle = '#fff'; roundRect(c, sx, sy, swd, sht, 16); c.fill();
      c.fillStyle = DARK; c.font = '800 22px Inter, system-ui, sans-serif'; c.fillText('Season plan', sx + 18, sy + 30);
      const SEAS = ['SPR', 'SUM', 'FAL', 'WIN'], H1 = [0.78, 0.92, 0.6, 0.38], H2 = [0.3, 0.42, 0.5, 0.22];
      SEAS.forEach((s, i) => {
        const bx = sx + 34 + i * ((swd - 60) / 4), bw = (swd - 60) / 4 - 26, base = sy + sht - 46, full = sht - 110;
        const p = eo(clamp(bars * 1.6 - i * 0.2));
        c.fillStyle = '#e8edf3'; roundRect(c, bx, base - full, bw, full, 8); c.fill();
        c.fillStyle = BLUE; roundRect(c, bx, base - full * H1[i] * p, bw, full * H1[i] * p, 8); c.fill();
        c.fillStyle = GREEN; roundRect(c, bx, base - full * H2[i] * p, bw, full * H2[i] * p, 8); c.fill();
        c.fillStyle = '#4a5464'; c.font = '700 17px "JetBrains Mono", ui-monospace, monospace'; c.textAlign = 'center'; c.fillText(s, bx + bw / 2, base + 24); c.textAlign = 'left';
      });
      // Rollout count
      const ky = sy + sht + 16, kh = h - ky - 34;
      c.fillStyle = DARK; roundRect(c, sx, ky, swd, kh, 16); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = '600 18px Inter, system-ui, sans-serif'; c.fillText('Sales pros on SalesX', sx + 22, ky + 32);
      c.fillStyle = '#fff'; c.font = '800 64px Inter, system-ui, sans-serif'; c.fillText(users >= 800 ? '800+' : String(users), sx + 22, ky + kh / 2 + 22);
      c.fillStyle = 'rgba(255,255,255,0.18)'; roundRect(c, sx + 22, ky + kh - 26, swd - 44, 8, 4); c.fill();
      c.fillStyle = GREEN; roundRect(c, sx + 22, ky + kh - 26, Math.max(8, (swd - 44) * (users / 812)), 8, 4); c.fill();
      c.restore();
      c.globalAlpha = 1;
    });
  };
  const clampP = (x) => Math.max(0, x);

  // ----------------------------------------------------------- dust in the sun
  const DN = 240, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffc98a, size: 0.012, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [1.75, 1.3, 2.35]], [2.2, [1.05, 1.15, 2.15], (x) => x],
    [4.3, [0.28, 0.8, 1.85]], [8.3, [-0.12, 0.62, 1.32], (x) => x],
    [10, [0.55, 0.95, 2.1]],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 0.05, -0.05]], [2.2, [0, 0.1, -0.05], (x) => x],
    [4.3, [0, 0.42, -0.08]], [8.3, [0.02, 0.44, -0.08], (x) => x],
    [10, [0, 0.36, -0.3]],
  ]);
  const tgt = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3(), mid = new THREE.Vector3();
  const TAB_FLAT = [0, 0.028, -0.05, -Math.PI / 2], TAB_UP = [0, 0.46, -0.12, -0.3];

  function update(t) {
    uT.value = t;
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.01, p[1] + Math.sin(t * 1.5 + 1) * 0.007, p[2]);
    tgt.set(q[0], q[1], q[2]);
    camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [4.3, 32], [8.3, 30], [10, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Tablet: lies dark on the table, stands up as the modules arrive.
    const up = eio(k(t, 3.55, 4.45));
    tab.position.set(lerp(TAB_FLAT[0], TAB_UP[0], up), lerp(TAB_FLAT[1], TAB_UP[1], up) + Math.sin(up * Math.PI) * 0.06, lerp(TAB_FLAT[2], TAB_UP[2], up));
    tab.rotation.set(lerp(TAB_FLAT[3], TAB_UP[3], up), 0, 0);
    stand.rotation.x = lerp(0, 0.95, up);
    tab.userData.sheen.position.x = Math.sin(t * 0.6) * 0.06;
    tab.updateMatrixWorld();
    drawUI(t);
    tab.userData.screen.material.color.setScalar(lerp(0.04, 1, eo(k(t, 2.9, 3.4))));
    screenGlow.material.opacity = 0.35 * eo(k(t, 3.0, 4.2));

    // Cards: breeze flutter, lift, turn to camera, then arc into the tablet's module rail.
    cards.forEach(({ g, trail }, i) => {
      const [x, z, ry] = LIE[i];
      const lift = back(k(t, LIFT[i], LIFT[i] + 0.45)), fly = eio(k(t, LIFT[i] + 0.4, LAND[i]));
      const flutter = (1 - lift) * Math.sin(t * 3 + i * 2) * 0.012;
      from.set(x, 0.012 + lift * 0.42, z);
      to.set(-0.52, 0.28 - i * 0.075, 0.03).applyMatrix4(tab.matrixWorld);
      mid.set(lerp(from.x, to.x, 0.5), Math.max(from.y, to.y) + 0.35, lerp(from.z, to.z, 0.5) + 0.25);
      const e = fly;
      g.position.set(
        (1 - e) * (1 - e) * from.x + 2 * (1 - e) * e * mid.x + e * e * to.x,
        (1 - e) * (1 - e) * from.y + 2 * (1 - e) * e * mid.y + e * e * to.y,
        (1 - e) * (1 - e) * from.z + 2 * (1 - e) * e * mid.z + e * e * to.z,
      );
      g.rotation.set(flutter + lift * 1.15 + e * 0.2, ry * (1 - lift) + (rnd(i, 5) - 0.5) * 0.4 * lift * (1 - e), flutter * 0.6 + Math.sin(t * 4 + i) * 0.05 * lift * (1 - e));
      g.scale.setScalar(lerp(1, 0.12, ei(e)));
      g.visible = t < LAND[i];
      trail.material.opacity = 0.9 * Math.sin(Math.PI * clamp(e)) * (e > 0 ? 1 : 0);
    });

    // Dust drifting through the low light.
    for (let i = 0; i < DN; i++) {
      const bx = (rnd(i, 61) - 0.5) * 5, bz = -rnd(i, 62) * 4 + 0.6, by = rnd(i, 63) * 1.4;
      dpos[i * 3] = bx + Math.sin(t * 0.3 + i) * 0.2 + t * 0.03;
      dpos[i * 3 + 1] = by + Math.sin(t * 0.5 + i * 1.7) * 0.06;
      dpos[i * 3 + 2] = bz + Math.cos(t * 0.25 + i) * 0.15;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 6.9 };
}
