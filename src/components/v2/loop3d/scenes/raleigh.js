// City of Raleigh website lit loop, 10 s. "A city website built around what people came to do."
// A miniature city at blue hour, with the website standing in the civic square as a big lit screen.
// The old site spews a storm of 7,713 pages over the skyline. Nearly the whole team leaves the square;
// one lead stays, wired to Detroit, New York, Manila and London. The storm funnels back into the screen
// and the site rebuilds around tasks: "How Do I?" Each task throws a line of light to the place it
// serves (the water tower, the park, the road). Eleven residents step up and test it, then City Council.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp, path,
  canvasTex, glow, label, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const NAVY = '#0b2545', GREEN = '#2fb36d', AMBER = '#ffb23f', WATER = '#5ec8ff';
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
// The new homepage's tasks, from the case study. The first three throw a line to the city.
const TASKS = [
  { t: 'Pay a utility bill', c: WATER, icon: 'drop' },
  { t: 'Find a park', c: GREEN, icon: 'tree' },
  { t: 'Road closures', c: AMBER, icon: 'cone' },
  { t: 'Transfer water service', c: '#7aa7ff', icon: 'swap' },
  { t: 'Rent a park shelter', c: '#8fd45f', icon: 'roof' },
  { t: 'Alerts', c: '#ff6b5a', icon: 'bell' },
];
const STREETS = [-5, -2, 2, 5];
const SW = 0.3;
const SCW = 1.6, SCH = 1.0, SCY = 0.78;   // the screen: width, height, center height
const UW = 1024, UH = 640;                 // its canvas
const PN = 520;                            // pages in the storm
const TEAM = 8, LEAD = 5, RES = 11;
const CITIES = ['DETROIT', 'NEW YORK', 'MANILA', 'LONDON'];
const BEACON = [[-1.7, 1.85, -1.6], [-0.62, 2.12, -2.1], [0.66, 2.1, -2.0], [1.75, 1.82, -1.5]];
const ARC_T = [5.95, 6.2, 6.45];           // each task's line of light leaves the screen
const CHECK = Array.from({ length: RES }, (_, i) => 7.45 + i * 0.08);
// Tiles on the new homepage, in canvas px: 3 x 2 grid.
const TX = 56, TY = 196, TW = 288, TH = 190, TG = 24;
const tileC = (i) => [TX + (i % 3) * (TW + TG) + TW / 2, TY + Math.floor(i / 3) * (TH + TG) + TH / 2];
const toWorld = (cx, cy, out = new THREE.Vector3()) => out.set((cx / UW - 0.5) * SCW, SCY + (0.5 - cy / UH) * SCH, 0.05);

function wrap(c, text, maxW) {
  const words = text.split(' '), lines = [];
  let cur = '';
  for (const wd of words) { const tr = cur ? cur + ' ' + wd : wd; if (cur && c.measureText(tr).width > maxW) { lines.push(cur); cur = wd; } else cur = tr; }
  lines.push(cur);
  return lines;
}
function icon(c, kind, x, y, col) {
  c.fillStyle = col; c.beginPath(); c.arc(x, y, 30, 0, 7); c.fill();
  c.fillStyle = '#fff'; c.strokeStyle = '#fff'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
  c.beginPath();
  if (kind === 'drop') { c.moveTo(x, y - 17); c.bezierCurveTo(x + 13, y - 2, x + 12, y + 14, x, y + 14); c.bezierCurveTo(x - 12, y + 14, x - 13, y - 2, x, y - 17); c.fill(); }
  else if (kind === 'tree') { c.arc(x, y - 5, 12, 0, 7); c.fill(); c.fillRect(x - 3, y + 4, 6, 13); }
  else if (kind === 'cone') { c.moveTo(x, y - 17); c.lineTo(x + 12, y + 13); c.lineTo(x - 12, y + 13); c.closePath(); c.fill(); c.fillStyle = col; c.fillRect(x - 8, y - 1, 16, 5); }
  else if (kind === 'swap') { c.moveTo(x - 14, y - 6); c.lineTo(x + 12, y - 6); c.moveTo(x + 6, y - 12); c.lineTo(x + 12, y - 6); c.lineTo(x + 6, y); c.moveTo(x + 14, y + 7); c.lineTo(x - 12, y + 7); c.moveTo(x - 6, y + 1); c.lineTo(x - 12, y + 7); c.lineTo(x - 6, y + 13); c.stroke(); }
  else if (kind === 'roof') { c.moveTo(x - 17, y - 1); c.lineTo(x, y - 15); c.lineTo(x + 17, y - 1); c.closePath(); c.fill(); c.fillRect(x - 10, y + 1, 4, 13); c.fillRect(x + 6, y + 1, 4, 13); }
  else { c.arc(x, y - 1, 11, Math.PI, 0); c.lineTo(x + 13, y + 10); c.lineTo(x - 13, y + 10); c.closePath(); c.fill(); c.beginPath(); c.arc(x, y + 14, 4, 0, 7); c.fill(); }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x141b33, 7, 21);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- blue-hour sky
  scene.add(skyDome([[0, '#04081a'], [0.3, '#0c1838'], [0.43, '#22325f'], [0.49, '#6b4a6a'], [0.505, '#d9826a'], [0.52, '#2a2c48'], [1, '#07090f']]));
  const moon = glow(0xcfe0ff, 2.2, 0.8, 0.22); moon.position.set(-9, 9, -30); scene.add(moon);

  // ----------------------------------------------------------- ground: blocks, streets, lawns
  const G = 16, GP = 64; // 16 world units at 64 px each
  const gx = (x) => (x + G / 2) * GP;
  const inStreet = (v) => STREETS.some((s) => Math.abs(v - s) < SW / 2 + 0.06);
  const isFront = (x, z) => Math.abs(x) < 1.8 && z > 2.2 && z < 4.8;   // the park in front of the square
  const TOWER = [-1.55, -2.8], SHELTER = [1.45, -1.42], ROAD = [0.95, 2.0];
  const ground = canvasTex(1024, 1024, (c, w, h) => {
    c.fillStyle = '#171a22'; c.fillRect(0, 0, w, h);
    // Sidewalk rims round every block, then the blocks themselves.
    const edges = [-8, ...STREETS, 8];
    for (let i = 0; i < edges.length - 1; i++) for (let j = 0; j < edges.length - 1; j++) {
      const x0 = edges[i] + (i ? SW / 2 : 0), x1 = edges[i + 1] - (i < edges.length - 2 ? SW / 2 : 0);
      const z0 = edges[j] + (j ? SW / 2 : 0), z1 = edges[j + 1] - (j < edges.length - 2 ? SW / 2 : 0);
      c.fillStyle = '#2a2f3a'; c.fillRect(gx(x0), gx(z0), (x1 - x0) * GP, (z1 - z0) * GP);
      c.fillStyle = '#1b1f28'; c.fillRect(gx(x0) + 5, gx(z0) + 5, (x1 - x0) * GP - 10, (z1 - z0) * GP - 10);
    }
    // Lawns: the green in front of the square and a pocket park in its back corner.
    [[-1.8, 2.2, 1.8, 4.8], [0.85, -1.85, 1.85, -0.85]].forEach(([x0, z0, x1, z1], q) => {
      c.fillStyle = '#142a1b'; roundRect(c, gx(x0), gx(z0), (x1 - x0) * GP, (z1 - z0) * GP, 14); c.fill();
      for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${40 + rnd(i, q) * 40},${80 + rnd(i, q + 1) * 60},${40 + rnd(i, q + 2) * 30},0.35)`; c.fillRect(gx(x0) + rnd(i, q + 3) * (x1 - x0) * GP, gx(z0) + rnd(i, q + 4) * (z1 - z0) * GP, 2, 2); }
    });
    // Park paths.
    c.strokeStyle = 'rgba(190,170,140,0.35)'; c.lineWidth = 5;
    c.beginPath(); c.moveTo(gx(-1.8), gx(4.2)); c.quadraticCurveTo(gx(-0.6), gx(3.0), gx(0.4), gx(3.6)); c.quadraticCurveTo(gx(1.2), gx(4.1), gx(1.8), gx(2.6)); c.stroke();
    // Streets with lane dashes and crosswalks.
    STREETS.forEach((s) => {
      c.fillStyle = '#0b0d12'; c.fillRect(gx(s - SW / 2), 0, SW * GP, h); c.fillRect(0, gx(s - SW / 2), w, SW * GP);
    });
    c.fillStyle = 'rgba(255,196,110,0.32)';
    STREETS.forEach((s) => { for (let v = 0; v < w; v += 22) { c.fillRect(gx(s) - 1, v, 2, 11); c.fillRect(v, gx(s) - 1, 11, 2); } });
    c.fillStyle = 'rgba(230,236,245,0.22)';
    STREETS.forEach((a) => STREETS.forEach((b) => { for (let q = -3; q <= 3; q++) { c.fillRect(gx(a - SW / 2) + 2 + (q + 3) * 2.6, gx(b) + SW * GP / 2 + 3, 1.6, 8); c.fillRect(gx(a) + SW * GP / 2 + 3, gx(b - SW / 2) + 2 + (q + 3) * 2.6, 8, 1.6); } }));
    for (let i = 0; i < 26000; i++) { const v = rnd(i, 71) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 72) * 0.08})`; c.fillRect(rnd(i, 73) * w, rnd(i, 74) * h, 1, 1); }
  });
  const groundM = mesh(new THREE.PlaneGeometry(G, G), std(0xffffff, { map: ground.tex, roughness: 0.82, metalness: 0.05 }), { cast: false });
  groundM.rotation.x = -Math.PI / 2; scene.add(groundM);
  const outer = mesh(new THREE.PlaneGeometry(80, 80), std(0x10131a, { roughness: 0.95 }), { cast: false });
  outer.rotation.x = -Math.PI / 2; outer.position.y = -0.004; scene.add(outer);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x4a5c9a, 0x0c0e14, 0.55));
  const moonL = new THREE.DirectionalLight(0xa8bcff, 1.35);
  moonL.position.set(-5, 7, -4); moonL.target.position.set(0, 0, 0);
  moonL.castShadow = true; moonL.shadow.mapSize.set(2048, 2048);
  Object.assign(moonL.shadow.camera, { left: -6.5, right: 6.5, top: 6.5, bottom: -6.5, near: 1, far: 22 });
  moonL.shadow.bias = -0.0005; moonL.shadow.normalBias = 0.03;
  scene.add(moonL, moonL.target);
  const warm = new THREE.SpotLight(0xffc890, 34, 0, 0.62, 0.85, 1.4);
  warm.position.set(2.6, 5, 6); warm.target.position.set(0, 0.5, 0);
  scene.add(warm, warm.target);
  const screenL = new THREE.PointLight(0x9fc4ff, 0, 4.2, 1.6); screenL.position.set(0, 0.85, 0.75); scene.add(screenL);

  // ----------------------------------------------------------- buildings (three height classes, instanced)
  const facade = canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = '#2a303c'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 24; r++) for (let q = 0; q < 8; q++) { c.fillStyle = '#121620'; c.fillRect(6 + q * 31, 4 + r * 20.6, 20, 12); }
    c.fillStyle = '#2a303c'; c.fillRect(0, h - 18, w, 18);
  }).tex;
  const lit = canvasTex(256, 512, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 24; r++) for (let q = 0; q < 8; q++) {
      const v = rnd(r * 8 + q, 33);
      if (v < 0.42) continue;
      c.fillStyle = v > 0.93 ? 'rgba(170,215,255,0.9)' : `rgba(255,${190 + Math.floor(rnd(r, q) * 40)},${110 + Math.floor(rnd(q, r) * 50)},${0.45 + rnd(r + 3, q) * 0.55})`;
      c.fillRect(6 + q * 31, 4 + r * 20.6, 20, 12);
    }
    c.fillStyle = '#000'; c.fillRect(0, h - 18, w, 18);
  }).tex;
  const CLS = [{ h0: 0.18, h1: 0.6, rows: 5 }, { h0: 0.6, h1: 1.3, rows: 11 }, { h0: 1.3, h1: 2.7, rows: 22 }];
  const homes = [[], [], []];
  const clear = (x, z) => inStreet(x) || inStreet(z) || (Math.abs(x) < 2 && Math.abs(z) < 2) || isFront(x, z) || Math.hypot(x - TOWER[0], z - TOWER[1]) < 0.5;
  let bi = 0;
  for (let x = -7.6; x <= 7.6; x += 0.56) for (let z = -9; z <= 6.6; z += 0.56) {
    bi++;
    const jx = x + (rnd(bi, 1) - 0.5) * 0.12, jz = z + (rnd(bi, 2) - 0.5) * 0.12;
    if (clear(jx, jz) || rnd(bi, 3) < 0.16) continue;
    let hgt;
    if (jz < -2) hgt = 0.7 + rnd(bi, 4) * 1.4 + (Math.abs(jx) < 3 ? 0.5 : 0) + (jz < -5 ? 0.3 : 0);
    else if (jz < 2) hgt = 0.35 + rnd(bi, 4) * 0.75;
    else hgt = 0.18 + rnd(bi, 4) * 0.3;
    if (rnd(bi, 6) > 0.93 && jz < -2) hgt += 0.6;
    hgt = Math.min(2.65, hgt);
    const ci = hgt < 0.6 ? 0 : hgt < 1.3 ? 1 : 2;
    homes[ci].push([jx, jz, 0.3 + rnd(bi, 5) * 0.18, hgt, 0.3 + rnd(bi, 7) * 0.18, rnd(bi, 8)]);
  }
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler();
  const tint = new THREE.Color();
  CLS.forEach((cl, ci) => {
    const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0);
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) {
      if (i >= 8 && i < 16) uv.setXY(i, 0.01, 0.005); // roofs: plain facade corner, no windows
      else uv.setXY(i, uv.getX(i) * 0.98 + 0.01, uv.getY(i) * (cl.rows / 24));
    }
    const mat = std(0xffffff, { map: facade, emissiveMap: lit, emissive: 0xffffff, emissiveIntensity: 1.25, roughness: 0.55, metalness: 0.25 });
    const im = new THREE.InstancedMesh(g, mat, homes[ci].length);
    homes[ci].forEach(([x, z, w, h, d, r], i) => {
      m4.compose(p4.set(x, 0, z), q4.identity(), s4.set(w, h, d)); im.setMatrixAt(i, m4);
      im.setColorAt(i, tint.setHSL(0.6 + r * 0.08, 0.12, 0.55 + r * 0.35));
    });
    im.castShadow = true; im.receiveShadow = true;
    scene.add(im);
  });

  // ----------------------------------------------------------- oaks: the park, the green, street trees
  const trees = [];
  for (let i = 0; i < 52; i++) {
    const x = -1.62 + rnd(i, 11) * 3.24, z = 2.4 + rnd(i, 12) * 2.25;
    if (Math.abs(x) < 0.35 && z < 3.0) continue;
    trees.push([x, z, 0.72 + rnd(i, 13) * 0.5]);
  }
  // The pocket park: oaks ringing the shelter.
  for (let i = 0; i < 9; i++) { const a = i / 9 * Math.PI * 2 + 0.3; const x = SHELTER[0] + Math.cos(a) * 0.36, z = SHELTER[1] + Math.sin(a) * 0.36; if (Math.hypot(x, z) > 1.62) trees.push([x, z, 0.62 + rnd(i, 25) * 0.25]); }
  [-1.6, -0.6, 0.6].forEach((x) => trees.push([x, -1.75, 0.6])); [-1.6, -0.6, 0.6, 1.6].forEach((x) => trees.push([x, 1.78, 0.6]));
  [-1.2, 0, 1.2].forEach((z) => trees.push([-1.78, z, 0.6])); [0, 1.2].forEach((z) => trees.push([1.78, z, 0.6]));
  const canopy = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.15, 1), std(0x1f4a2c, { roughness: 0.92 }), trees.length);
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.016, 0.022, 0.2, 6).translate(0, 0.1, 0), std(0x3a2c22, { roughness: 0.9 }), trees.length);
  trees.forEach(([x, z, s], i) => {
    m4.compose(p4.set(x, 0.24 * s + 0.04, z), q4.setFromEuler(e4.set(0, rnd(i, 31) * 6, 0)), s4.set(s * (1 + rnd(i, 32) * 0.25), s * 0.85, s)); canopy.setMatrixAt(i, m4);
    canopy.setColorAt(i, tint.setHSL(0.36 + rnd(i, 33) * 0.06, 0.45, 0.3 + rnd(i, 34) * 0.25));
    m4.compose(p4.set(x, 0, z), q4.identity(), s4.set(s, s, s)); trunk.setMatrixAt(i, m4);
  });
  canopy.castShadow = trunk.castShadow = true; canopy.receiveShadow = true;
  scene.add(canopy, trunk);

  // ----------------------------------------------------------- landmarks the tasks point at
  // Water tower (Pay a utility bill), park shelter (Find a park), a closed block (Road closures).
  const steelM = std(0xc8cdd6, { metalness: 0.6, roughness: 0.35, emissive: 0x2a8fd0, emissiveIntensity: 0 });
  const tower = new THREE.Group(); tower.position.set(TOWER[0], 0, TOWER[1]); scene.add(tower);
  const leg = mesh(new THREE.CylinderGeometry(0.05, 0.11, 1.0, 12), steelM); leg.position.y = 0.5; tower.add(leg);
  const tank = mesh(new THREE.SphereGeometry(0.3, 32, 20), steelM); tank.position.y = 1.18; tank.scale.y = 0.82; tower.add(tank);
  const cap = mesh(new THREE.ConeGeometry(0.12, 0.12, 16), steelM); cap.position.y = 1.47; tower.add(cap);
  const shelter = new THREE.Group(); shelter.position.set(SHELTER[0], 0, SHELTER[1]); shelter.rotation.y = 0.4; scene.add(shelter);
  const roof = mesh(new THREE.ConeGeometry(0.34, 0.13, 4), std(0x8a3b2a, { roughness: 0.6 })); roof.rotation.y = Math.PI / 4; roof.position.y = 0.24; shelter.add(roof);
  [-1, 1].forEach((sd) => { const p = mesh(new THREE.BoxGeometry(0.03, 0.18, 0.3), std(0xd9d2c4, { roughness: 0.7 })); p.position.set(sd * 0.16, 0.09, 0); shelter.add(p); });
  const barrier = new THREE.Group(); barrier.position.set(ROAD[0], 0, ROAD[1]); scene.add(barrier);
  [-0.12, 0.12].forEach((x) => { const b = mesh(new THREE.BoxGeometry(0.2, 0.05, 0.025), std(0xff9a2a, { roughness: 0.5, emissive: 0xff7a10, emissiveIntensity: 0.4 })); b.position.set(x, 0.07, 0); barrier.add(b); });
  const roadGlowM = new THREE.MeshBasicMaterial({ color: AMBER, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const roadGlow = new THREE.Mesh(new THREE.PlaneGeometry(1.3, SW), roadGlowM); roadGlow.rotation.x = -Math.PI / 2; roadGlow.position.set(ROAD[0], 0.006, ROAD[1]); scene.add(roadGlow);

  // ----------------------------------------------------------- the civic square and the screen
  const plaza = mesh(new THREE.CylinderGeometry(1.45, 1.48, 0.03, 72), std(0x2a2f3a, { roughness: 0.26, metalness: 0.4 }), { cast: false });
  plaza.position.y = 0.015; scene.add(plaza);
  const inlay = new THREE.Mesh(new THREE.TorusGeometry(1.42, 0.006, 6, 120), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }));
  inlay.rotation.x = Math.PI / 2; inlay.position.y = 0.031; scene.add(inlay);
  const plinth = mesh(new RoundedBoxGeometry(1.9, 0.22, 0.5, 3, 0.03), std(0x1c2029, { roughness: 0.38, metalness: 0.55 }));
  plinth.position.y = 0.11; scene.add(plinth);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.012, 0.01), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }));
  strip.position.set(0, 0.16, 0.252); scene.add(strip);
  const frame = mesh(new RoundedBoxGeometry(SCW + 0.12, SCH + 0.12, 0.08, 4, 0.03), std(0x15171c, { roughness: 0.28, metalness: 0.8 }));
  frame.position.y = SCY; scene.add(frame);
  const ui = canvasTex(UW, UH);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SCW, SCH), new THREE.MeshBasicMaterial({ map: ui.tex, toneMapped: false }));
  screen.position.set(0, SCY, 0.041); screen.name = 'screen'; scene.add(screen);
  const halo = glow(0x8fb8ff, 1, 0.22, 0.5); halo.scale.set(3.6, 2.4, 1); halo.position.set(0, SCY, -0.25); scene.add(halo);
  const intake = glow(0xcfe4ff, 1, 0, 0.35); intake.scale.set(2.2, 1.5, 1); intake.position.set(0, SCY, 0.12); scene.add(intake);

  // ----------------------------------------------------------- the page storm
  const pageTex = canvasTex(64, 86, (c, w, h) => {
    c.fillStyle = '#eef1f6'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#5a6475'; c.fillRect(0, 0, w, 12);
    c.fillStyle = '#9aa3b2'; for (let r = 0; r < 9; r++) c.fillRect(6, 20 + r * 7, 20 + rnd(r, 3) * 32, 3);
    c.fillStyle = '#c0392b'; c.fillRect(w - 18, h - 14, 12, 8);
  }).tex;
  const pageM = new THREE.MeshStandardMaterial({ map: pageTex, emissiveMap: pageTex, emissive: 0xffffff, emissiveIntensity: 0.5, roughness: 0.6, side: THREE.DoubleSide });
  const pages = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.07, 0.094), pageM, PN);
  pages.frustumCulled = false; pages.castShadow = false; scene.add(pages);
  const PG = Array.from({ length: PN }, (_, i) => ({
    b: 0.3 + (i / PN) * 1.85 + rnd(i, 1) * 0.15,
    sx: (rnd(i, 2) - 0.5) * 1.4, sy: SCY + (rnd(i, 3) - 0.5) * 0.85,
    a: rnd(i, 4) * Math.PI * 2, w: (0.35 + rnd(i, 5) * 0.4), r: 0.95 + Math.pow(rnd(i, 6), 0.7) * 2.5,
    y: 0.55 + rnd(i, 7) * 2.1, f: 4.5 + rnd(i, 8) * 0.6, ra: rnd(i, 9) * 6, rb: rnd(i, 10) * 6,
  }));
  // Time warp for the storm: it slows to a hover while the team changes, then picks up again.
  const tw = (t) => kf(t, [[0, 0], [2.5, 2.5], [3.1, 2.85], [4.3, 3.2], [4.9, 3.6], [10, 8.7]], (x) => x);

  // ----------------------------------------------------------- people: the team, then residents
  const personGeo = new THREE.LatheGeometry([[0, 0], [0.028, 0], [0.031, 0.06], [0.027, 0.1], [0.018, 0.116], [0.012, 0.122], [0.021, 0.132], [0.024, 0.147], [0.019, 0.162], [0, 0.17]].map(([x, y]) => new THREE.Vector2(x, y)), 12);
  const people = new THREE.InstancedMesh(personGeo, std(0xd9dde6, { roughness: 0.5 }), TEAM + RES);
  people.castShadow = true; people.frustumCulled = false; scene.add(people);
  const haloTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const halos = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.2, 0.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: haloTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), TEAM + RES);
  halos.frustumCulled = false; scene.add(halos);
  for (let i = 0; i < TEAM + RES; i++) { halos.setColorAt(i, tint.setRGB(0, 0, 0)); people.setColorAt(i, tint.setRGB(1, 1, 1)); }
  const checkTex = canvasTex(128, 128, (c, w) => {
    c.fillStyle = GREEN; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 12; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(36, 66); c.lineTo(56, 86); c.lineTo(92, 46); c.stroke();
  }).tex;
  const checks = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.1, 0.1), new THREE.MeshBasicMaterial({ map: checkTex, transparent: true, depthWrite: false, toneMapped: false }), RES);
  checks.frustumCulled = false; scene.add(checks);
  const teamAt = (j) => { const a = -1.1 + j * (2.2 / (TEAM - 1)); return [Math.sin(a) * 0.95, 0.15 + Math.cos(a) * 0.95, a]; };
  const resAt = (j) => { const a = -1.3 + j * (2.6 / (RES - 1)); return [Math.sin(a) * 1.27, 0.12 + Math.cos(a) * 1.27, a]; };
  const leadPos = new THREE.Vector3(teamAt(LEAD)[0], 0.17, teamAt(LEAD)[1]);
  const leadMark = new THREE.Object3D(); leadMark.position.copy(leadPos); leadMark.name = 'lead'; scene.add(leadMark);

  // ----------------------------------------------------------- the distributed team: four cities, one lead
  const beacons = BEACON.map((b, i) => {
    const g = glow(0xffd29a, 0.5, 0, 0.3); g.position.set(...b); g.name = 'beacon' + i; scene.add(g);
    const l = label(CITIES[i], { font: `700 52px ${MONO}`, fg: '#e6eeff', bg: 'rgba(10,18,36,0.78)', h: 0.15, pad: 30, track: 4 });
    l.position.set(b[0], b[1] + 0.2, b[2]); scene.add(l);
    const pulse = glow(0xffe2b8, 0.16, 0, 0.3); scene.add(pulse);
    return { g, l, pulse };
  });
  const threadPos = new Float32Array(BEACON.length * 6);
  const threadGeo = new THREE.BufferGeometry(); threadGeo.setAttribute('position', new THREE.BufferAttribute(threadPos, 3));
  const threads = new THREE.LineSegments(threadGeo, new THREE.LineBasicMaterial({ color: 0xffd29a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  threads.frustumCulled = false; scene.add(threads);

  // ----------------------------------------------------------- lines of light: task -> place
  const targets = [new THREE.Vector3(TOWER[0], 1.2, TOWER[1]), new THREE.Vector3(SHELTER[0], 0.3, SHELTER[1]), new THREE.Vector3(ROAD[0], 0.1, ROAD[1])];
  const arcs = TASKS.slice(0, 3).map((task, i) => {
    const p0 = toWorld(...tileC(i)), p1 = targets[i];
    const ctrl = p0.clone().lerp(p1, 0.5); ctrl.y = Math.max(p0.y, p1.y) + 1.1; ctrl.z += 0.6;
    const curve = new THREE.QuadraticBezierCurve3(p0, ctrl, p1);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, 0.011, 6, false), new THREE.MeshBasicMaterial({ color: task.c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    tube.frustumCulled = false; scene.add(tube);
    const head = glow(task.c, 0.3, 0, 0.3); scene.add(head);
    const hit = glow(task.c, 0.9, 0, 0.35); hit.position.copy(p1); hit.name = 'target' + i; scene.add(hit);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.2, 0.24, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: task.c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    ring.position.set(p1.x, 0.012, p1.z); scene.add(ring);
    return { curve, tube, head, hit, ring };
  });

  // ----------------------------------------------------------- streetlights and traffic (two point clouds)
  const dotTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const lamps = [];
  STREETS.forEach((s) => { for (let v = -7.6; v <= 7.6; v += 0.72) { if (inStreet(v)) continue; [-1, 1].forEach((sd) => { lamps.push(s + sd * (SW / 2 + 0.06), 0.09, v, v, 0.09, s + sd * (SW / 2 + 0.06)); }); } });
  const lampGeo = new THREE.BufferGeometry(); lampGeo.setAttribute('position', new THREE.Float32BufferAttribute(lamps, 3));
  scene.add(new THREE.Points(lampGeo, new THREE.PointsMaterial({ map: dotTex, color: 0xffbf6e, size: 0.13, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })));
  const CARS = 44, carPos = new Float32Array(CARS * 3), carCol = new Float32Array(CARS * 3);
  for (let i = 0; i < CARS; i++) { const head = rnd(i, 51) > 0.45; carCol.set(head ? [1, 0.93, 0.8] : [1, 0.15, 0.12], i * 3); }
  const carGeo = new THREE.BufferGeometry();
  carGeo.setAttribute('position', new THREE.BufferAttribute(carPos, 3)); carGeo.setAttribute('color', new THREE.BufferAttribute(carCol, 3));
  const cars = new THREE.Points(carGeo, new THREE.PointsMaterial({ map: dotTex, size: 0.1, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  cars.frustumCulled = false; scene.add(cars);

  // ----------------------------------------------------------- the screen UI: old site, then tasks first
  const drawOld = (c, w, h, t) => {
    c.fillStyle = '#e6e4dd'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#4d5666'; c.fillRect(0, 0, w, 64);
    c.fillStyle = '#fff'; c.font = `700 26px ${SANS}`; c.textBaseline = 'middle'; c.fillText('City of Raleigh', 28, 33);
    for (let i = 0; i < 9; i++) { c.fillStyle = 'rgba(255,255,255,0.5)'; c.fillRect(290 + i * 78, 29, 38 + rnd(i, 3) * 26, 8); }
    c.fillStyle = '#6a6f78'; c.font = `700 17px ${MONO}`; c.fillText('HOME', 28, 92);
    for (let i = 0; i < 6; i++) { c.fillStyle = '#b4b8bf'; c.fillRect(86 + i * 64, 89, 44, 6); }
    for (let q = 0; q < 5; q++) for (let r = 0; r < 16; r++) {
      const x = 28 + q * 196, y = 120 + r * 25, wd = 40 + rnd(q * 16 + r, 5) * 130;
      c.fillStyle = r % 5 === 0 ? '#3d4452' : 'rgba(42,93,176,0.75)'; c.fillRect(x, y, wd, r % 5 === 0 ? 9 : 6);
      if (rnd(q * 16 + r, 6) > 0.86) { c.fillStyle = '#c0392b'; c.fillRect(x + wd + 8, y - 3, 30, 13); c.fillStyle = '#fff'; c.font = `700 10px ${MONO}`; c.fillText('PDF', x + wd + 12, y + 4); }
    }
    const st = eo(k(t, 1.45, 1.9));
    if (st > 0) {
      c.fillStyle = '#a3182b'; c.fillRect(0, h - 104 * st, w, 104);
      c.fillStyle = '#fff'; c.font = `800 44px ${SANS}`; c.fillText('63.3%', 32, h - 104 * st + 52);
      c.font = `600 28px ${SANS}`; c.fillText('of visits stopped at one page', 192, h - 104 * st + 54);
    }
  };
  const drawNew = (c, w, h, t) => {
    c.fillStyle = '#f2f4f7'; c.fillRect(0, 0, w, h);
    c.fillStyle = NAVY; c.fillRect(0, 0, w, 78);
    c.fillStyle = '#fff'; c.font = `800 30px ${SANS}`; c.textBaseline = 'middle'; c.fillText('City of Raleigh', 36, 40);
    c.font = `600 21px ${SANS}`; c.textAlign = 'right';
    [['Alerts', w - 36], ['Parks', w - 150], ['How Do I?', w - 250]].forEach(([s, x]) => { c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillText(s, x, 40); });
    c.textAlign = 'left';
    c.fillStyle = GREEN; c.fillRect(w - 250 - 104, 62, 104, 4);
    const hp = eo(k(t, 5.3, 5.7));
    c.globalAlpha = hp; c.fillStyle = NAVY; c.font = `800 62px ${SANS}`; c.fillText('How Do I?', 56 - (1 - hp) * 20, 140); c.globalAlpha = 1;
    const hover = t > 7.4 ? Math.floor((t - 7.4) / 0.22) % 6 : -1;
    TASKS.forEach((task, i) => {
      const s0 = 5.38 + i * 0.07, p = back(k(t, s0, s0 + 0.45)), a = clamp(k(t, s0, s0 + 0.2));
      if (a <= 0) return;
      const [cx, cy] = tileC(i);
      c.save(); c.translate(cx, cy); c.scale(0.82 + 0.18 * p, 0.82 + 0.18 * p); c.globalAlpha = a;
      c.shadowColor = 'rgba(11,37,69,0.18)'; c.shadowBlur = 18; c.shadowOffsetY = 6;
      c.fillStyle = '#fff'; roundRect(c, -TW / 2, -TH / 2, TW, TH, 18); c.fill();
      c.shadowColor = 'rgba(0,0,0,0)';
      const fire = i < 3 ? Math.sin(Math.PI * k(t, ARC_T[i] - 0.1, ARC_T[i] + 0.9)) : 0;
      const on = Math.max(fire, i === hover ? 1 : 0);
      if (on > 0) { c.strokeStyle = i === hover ? GREEN : task.c; c.globalAlpha = a * on; c.lineWidth = 6; roundRect(c, -TW / 2, -TH / 2, TW, TH, 18); c.stroke(); c.globalAlpha = a; }
      icon(c, task.icon, -TW / 2 + 54, -TH / 2 + 54, task.c);
      c.fillStyle = NAVY; c.font = `700 34px ${SANS}`; c.textBaseline = 'alphabetic';
      const lines = wrap(c, task.t, TW - 48);
      lines.forEach((ln, j) => c.fillText(ln, -TW / 2 + 24, TH / 2 - 24 - (lines.length - 1 - j) * 38));
      c.textBaseline = 'middle';
      c.restore();
    });
  };
  let uiKey = '';
  const drawUI = (t) => {
    const fresh = t >= 5.3;
    const hover = t > 7.4 ? Math.floor((t - 7.4) / 0.22) % 6 : -1;
    const live = (t > 1.4 && t < 2.0) || (t > 2.55 && t < 3.3) || (t > 4.35 && t < 7.5);
    // Outside the live windows the picture is constant per window, so a jump in t still redraws.
    const seg = t < 1.4 ? 0 : t < 2.55 ? 1 : t < 4.35 ? 2 : 3;
    const key = [fresh ? 1 : 0, hover, live ? Math.round(t * 30) : 's' + seg].join('|');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      if (fresh) drawNew(c, w, h, t); else drawOld(c, w, h, t);
      const dim = eo(k(t, 2.6, 3.2)) * (1 - eo(k(t, 4.4, 5.0)));
      if (!fresh && dim > 0) { c.fillStyle = `rgba(4,8,18,${0.62 * dim})`; c.fillRect(0, 0, w, h); }
      const flash = Math.sin(Math.PI * k(t, 5.12, 5.5));
      if (flash > 0) { c.fillStyle = `rgba(235,244,255,${flash})`; c.fillRect(0, 0, w, h); }
      // Rounded corners inside the bezel.
      c.fillStyle = '#000'; c.globalCompositeOperation = 'destination-in'; roundRect(c, 0, 0, w, h, 22); c.fill();
      c.globalCompositeOperation = 'destination-over'; c.fillRect(0, 0, w, h); c.globalCompositeOperation = 'source-over';
    });
  };

  // ----------------------------------------------------------- the chapter card above the screen
  const chap = canvasTex(1024, 256);
  const chapM = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.45), new THREE.MeshBasicMaterial({ map: chap.tex, transparent: true, depthWrite: false, toneMapped: false }));
  chapM.renderOrder = 5; chapM.name = 'chapter'; scene.add(chapM);
  const CH = [
    { a: 0.45, b: 2.55, kick: 'A CRAWL FOUND', big: (t) => Math.round(7713 * eo(k(t, 0.45, 2.3))).toLocaleString('en-US') + ' pages', side: '+ 2,564 PDFs', col: '#ff8a7a' },
    { a: 2.65, b: 4.55, kick: 'FIRST,', big: () => 'The team changed', col: '#ffd29a' },
    { a: 4.75, b: 7.35, kick: 'BUILT AROUND', big: () => 'Tasks, not departments', col: '#7fe0a8' },
    { a: 7.45, b: 8.3, kick: 'TESTED WITH', big: (t) => CHECK.filter((x) => t > x).length + ' residents', col: '#7fe0a8' },
    { a: 8.35, b: 9.75, kick: 'THEN PRESENTED TO', big: () => 'City Council', col: '#ffd29a' },
  ];
  let cKey = '';
  const drawChap = (t) => {
    const ci = CH.findIndex((s) => t >= s.a - 0.05 && t < s.b + 0.05);
    const s = CH[ci];
    const a = s ? eo(k(t, s.a, s.a + 0.25)) * (1 - ei(k(t, s.b - 0.2, s.b))) : 0;
    const big = s ? s.big(t) : '';
    const key = [ci, big, Math.round(a * 20)].join('|');
    if (key === cKey) return a; cKey = key;
    chap.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      if (!s || a <= 0) return;
      c.globalAlpha = a;
      c.fillStyle = 'rgba(6,12,26,0.74)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = s.col; c.fillRect(40, 54, 8, h - 108);
      c.textBaseline = 'middle';
      c.font = `700 40px ${MONO}`; c.fillStyle = s.col; c.fillText(s.kick, 74, 72);
      if (s.side) { c.textAlign = 'right'; c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillText(s.side, w - 44, 72); c.textAlign = 'left'; }
      let fs = 96; c.font = `800 ${fs}px ${SANS}`;
      while (c.measureText(big).width > w - 120 && fs > 60) { fs -= 4; c.font = `800 ${fs}px ${SANS}`; }
      c.fillStyle = '#fff'; c.fillText(big, 72 - (1 - a) * 14, 168);
      c.globalAlpha = 1;
    });
    return a;
  };

  // ----------------------------------------------------------- camera: aerial over the storm, down to the square
  const KT = [0, 2.4, 4.2, 5.55, 6.35, 7.35, 8.7, 10];
  const camP = path([[0.6, 4.6, 7.4], [1.0, 3.3, 5.9], [1.3, 1.75, 5.6], [0.45, 1.3, 3.45], [0.35, 1.35, 3.6], [0.15, 2.25, 6.4], [-0.28, 1.3, 4.45], [-0.48, 1.4, 4.8]]);
  const camT = path([[0, 1.05, -0.9], [0, 1.0, -0.6], [-0.05, 0.98, -0.5], [0, 1.02, 0], [0, 1.0, 0], [0.05, 0.42, -0.3], [0, 0.86, 0], [0, 0.9, 0]]);
  const camU = (t) => kf(t, KT.map((x, i) => [x, i / (KT.length - 1)]), (x) => x);
  const cp = new THREE.Vector3(), ct = new THREE.Vector3(), tmp = new THREE.Vector3(), lp = new THREE.Vector3();
  const LANES = STREETS.length * 2;

  function update(t) {
    const u = camU(t);
    camP(u, cp); camT(u, ct);
    camera.position.set(cp.x + Math.sin(t * 1.1) * 0.012, cp.y + Math.sin(t * 1.6 + 1) * 0.008, cp.z);
    camera.lookAt(ct);
    camera.updateMatrixWorld();
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Screen: boots on the old site, dims while the team changes, rebuilds around tasks.
    drawUI(t);
    const boot = eo(k(t, 0.3, 0.7)), dimS = eo(k(t, 2.6, 3.2)) * (1 - eo(k(t, 4.5, 5.1)));
    screen.material.color.setScalar(lerp(0.03, 0.92, boot) * (1 - 0.35 * dimS));
    const fresh = eo(k(t, 5.2, 5.7));
    screenL.color.setRGB(lerp(0.62, 0.85, fresh), lerp(0.77, 0.95, fresh), 1);
    screenL.intensity = 2.4 * boot * (1 - 0.5 * dimS) + 2.5 * Math.sin(Math.PI * k(t, 5.0, 5.7));
    halo.material.opacity = 0.22 * boot * (1 - 0.5 * dimS) + 0.12 * fresh;
    intake.material.opacity = 0.75 * Math.sin(Math.PI * k(t, 4.6, 5.6));

    // The page storm: born from the screen, swirling over the city, then pulled back in.
    const tt = tw(t);
    for (let i = 0; i < PN; i++) {
      const P = PG[i];
      const out = eo(k(t, P.b, P.b + 1.1)), f = eio(k(t, P.f, P.f + 0.65));
      const ang = P.a + tt * P.w + f * 2.4, rad = P.r * (1 - f * 0.85);
      const oy = P.y + Math.sin(tt * 0.9 + i) * 0.12;
      p4.set(Math.cos(ang) * rad, oy, -0.6 + Math.sin(ang) * rad * 0.75);
      const back2 = f * f;
      p4.set(lerp(lerp(P.sx, p4.x, out), P.sx * 0.3, back2), lerp(lerp(P.sy, p4.y, out), SCY, back2), lerp(lerp(0.05, p4.z, out), 0.06, back2));
      q4.setFromEuler(e4.set(P.ra + tt * 1.3 * out, P.rb + tt * 0.9 * out, tt * 0.6 * out));
      const sc = Math.max(0.0001, out * (1 - ei(f)) * (t < 0.3 ? 0 : 1));
      m4.compose(p4, q4, s4.set(sc, sc, sc)); pages.setMatrixAt(i, m4);
    }
    pages.instanceMatrix.needsUpdate = true;
    pages.visible = t > 0.3 && t < 6.3;
    pageM.emissiveIntensity = 0.55 * (1 - 0.6 * dimS);

    // The team: most of them leave the square; one lead stays and lights up.
    for (let j = 0; j < TEAM; j++) {
      const [x, z, a] = teamAt(j);
      const go = j === LEAD ? 0 : eio(k(t, 2.75 + j * 0.07, 3.75 + j * 0.07));
      const r = 1 + go * 1.4;
      const sc = j === LEAD ? 1 : Math.max(0.0001, 1 - ei(k(go, 0.75, 1)));
      m4.compose(p4.set(x * r, 0.03, 0.15 + (z - 0.15) * r), q4.setFromEuler(e4.set(0, a + (go > 0 ? 0 : Math.PI), 0)), s4.set(sc, sc, sc));
      people.setMatrixAt(j, m4); halos.setMatrixAt(j, m4);
      const leadOn = eo(k(t, 3.25, 3.7)) * (1 - 0.6 * eo(k(t, 7.4, 8.0)));
      const v = j === LEAD ? 0.35 + 0.65 * leadOn : 0.35 * (1 - go) * eo(k(t, 0.4, 0.9));
      halos.setColorAt(j, j === LEAD ? tint.setRGB(v, v * 0.78, v * 0.5) : tint.setRGB(v * 0.75, v * 0.82, v));
    }
    // Residents step into the square, then each one tests the site and gets a check.
    for (let j = 0; j < RES; j++) {
      const [x, z, a] = resAt(j);
      const arr = eo(k(t, 6.6 + j * 0.04, 7.35 + j * 0.04));
      const r = 1 + (1 - arr) * 0.9;
      const sc = Math.max(0.0001, eo(k(arr, 0, 0.3)));
      m4.compose(p4.set(x * r, 0.03, 0.12 + (z - 0.12) * r), q4.setFromEuler(e4.set(0, a + Math.PI, 0)), s4.set(sc, sc, sc));
      people.setMatrixAt(TEAM + j, m4); halos.setMatrixAt(TEAM + j, m4);
      const ok = eo(k(t, CHECK[j], CHECK[j] + 0.25));
      halos.setColorAt(TEAM + j, tint.setRGB(0.18 * ok, 0.7 * ok, 0.42 * ok));
      const pop = back(k(t, CHECK[j], CHECK[j] + 0.35)) * (1 - ei(k(t, 9.2, 9.6)));
      p4.set(x * r, 0.27 + Math.sin(t * 3 + j) * 0.008, 0.12 + (z - 0.12) * r);
      m4.compose(p4, camera.quaternion, s4.setScalar(Math.max(0.0001, pop))); checks.setMatrixAt(j, m4);
    }
    people.instanceMatrix.needsUpdate = true; halos.instanceMatrix.needsUpdate = true; halos.instanceColor.needsUpdate = true;
    checks.instanceMatrix.needsUpdate = true;

    // Four cities wire into the lead.
    const net = 1 - ei(k(t, 4.55, 5.0));
    BEACON.forEach((b, i) => {
      const on = eo(k(t, 3.4 + i * 0.12, 3.85 + i * 0.12)) * net;
      const { g, l, pulse } = beacons[i];
      g.material.opacity = 0.95 * on; g.visible = on > 0.01;
      l.material.opacity = on; l.visible = on > 0.01; l.quaternion.copy(camera.quaternion);
      tmp.set(...b);
      lp.copy(leadPos).lerp(tmp, on);
      threadPos.set([leadPos.x, leadPos.y, leadPos.z, lp.x, lp.y, lp.z], i * 6);
      const u2 = (t * 0.9 + i * 0.25) % 1;
      pulse.position.copy(tmp).lerp(leadPos, u2);
      pulse.material.opacity = on * Math.sin(Math.PI * u2) * (t > 3.9 ? 1 : 0); pulse.visible = pulse.material.opacity > 0.01;
    });
    threadGeo.attributes.position.needsUpdate = true;
    threads.material.opacity = 0.75 * eo(k(t, 3.4, 3.7)) * net; threads.visible = threads.material.opacity > 0.01;

    // Lines of light from three tasks to the places they serve.
    arcs.forEach(({ curve, tube, head, hit, ring }, i) => {
      const hd = eo(k(t, ARC_T[i], ARC_T[i] + 0.75)), tl = eio(k(t, ARC_T[i] + 0.45, ARC_T[i] + 1.25));
      const idx = tube.geometry.index.count / 48;
      const a0 = Math.floor(tl * 48), a1 = Math.ceil(hd * 48);
      tube.geometry.setDrawRange(a0 * idx, Math.max(0, a1 - a0) * idx);
      tube.visible = hd > 0 && tl < 1;
      curve.getPoint(hd, head.position);
      head.material.opacity = hd > 0 && hd < 1 ? 1 : 0; head.visible = head.material.opacity > 0;
      const land = k(t, ARC_T[i] + 0.7, ARC_T[i] + 2.2);
      const glowA = land > 0 ? Math.exp(-2.2 * land * 1.5) * 0.9 + 0.25 * (1 - ei(k(t, 8.8, 9.6))) : 0;
      hit.material.opacity = glowA; hit.visible = glowA > 0.01;
      ring.scale.setScalar(1 + land * 2.2); ring.material.opacity = 0.8 * (1 - land) * (land > 0 ? 1 : 0); ring.visible = land > 0 && land < 1;
    });
    const wl = k(t, ARC_T[0] + 0.7, ARC_T[0] + 1.6);
    steelM.emissiveIntensity = wl > 0 ? 0.9 * Math.exp(-2 * wl) + 0.18 : 0;
    roadGlowM.opacity = k(t, ARC_T[2] + 0.7, ARC_T[2] + 0.9) * (0.35 + 0.25 * Math.sin(t * 9)) * (1 - ei(k(t, 9.0, 9.6)));

    // Traffic: cars run the streets in both directions.
    for (let i = 0; i < CARS; i++) {
      const lane = Math.floor(rnd(i, 52) * LANES), s = STREETS[lane % STREETS.length], along = lane >= STREETS.length;
      const dir = rnd(i, 53) > 0.5 ? 1 : -1, v = ((rnd(i, 54) * 16 + dir * t * (0.5 + rnd(i, 55) * 0.4)) % 16 + 16) % 16 - 8;
      const off = dir * 0.07;
      carPos.set(along ? [v, 0.05, s + off] : [s + off, 0.05, v], i * 3);
    }
    carGeo.attributes.position.needsUpdate = true;

    // Chapter card: above the screen, square to the camera.
    const ca = drawChap(t);
    chapM.position.set(0, kf(t, [[0, 1.75], [5.2, 1.72], [5.8, 1.6], [7.3, 1.62], [8.6, 1.62]]), 0.1);
    chapM.quaternion.copy(camera.quaternion);
    chapM.visible = ca > 0.001;
  }

  return { scene, camera, update, duration: D, poster: 8.75 };
}
