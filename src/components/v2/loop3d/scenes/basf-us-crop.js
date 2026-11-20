// BASF Agriculture US Crop website lit loop, 10 s. "Region, then category, then product."
// A barn turned planning room on an early morning: low sun pours through the open door and the gaps in
// the plank wall, a green enamel lamp hangs over a long oak table. The table holds a map of the US made
// of hexagon tiles, which pop up west to east. A strategist leans in and taps a region in the South: its
// tiles rise in a ripple and turn blue, and REGION lights in the breadcrumb. Three category cards fan up
// out of the region; the strategist taps one and the others sink away (CATEGORY). The chosen card flies
// to a display at the far end of the table and opens into a product page, which builds module by module
// (PRODUCT), and the project's name settles above the finished path.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { makePerson } from '../person.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BLUE = '#21a0d2', BLUE_H = 0x21a0d2, GREEN = '#65ac1e', GREEN_H = 0x65ac1e, ORANGE = '#f39500', NAVY = '#00305e';
const TOP = 0.88;                          // table top height
const MAPZ = 0.15, SC = 0.031;             // map centre offset (toward the strategist) and scale per degree
const HR = 0.046;                          // hexagon spacing radius
const TAP = 1.65, CARD_TAP = 3.45, FLY = 4.0, OPEN = 4.6, CRUMB = [1.8, 3.6, 6.45];
const PAGE = new THREE.Vector3(-0.42, 1.34, -0.5), PAGE_YAW = 0.12, PW = 1.0, PH = 0.66;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// The lower 48, as a rough outline in (longitude, latitude).
const US = [[-124.5, 48.5], [-123, 46], [-124, 42], [-121, 35.5], [-117, 32.5], [-111, 31.3], [-106.5, 31.8], [-104, 29.5], [-101.5, 29.8], [-99, 26.5], [-97.2, 25.9], [-97.4, 27.8], [-94, 29.6], [-89.5, 29.2], [-89, 30.3], [-85, 29.7], [-83, 29], [-82.7, 27.5], [-81, 25.2], [-80.1, 26.8], [-81.4, 30.5], [-81, 31.8], [-78.5, 33.8], [-76, 35.2], [-76, 37], [-74, 39.7], [-72, 41], [-70, 41.7], [-70.6, 42.7], [-70.2, 43.7], [-67, 44.8], [-68, 47.4], [-69.3, 47.3], [-71, 45], [-75, 45], [-77, 43.6], [-79, 43.3], [-79, 42.7], [-82.5, 41.7], [-83.4, 42.3], [-82.5, 45.3], [-84.5, 46.5], [-88, 48], [-89.6, 48], [-95, 49], [-123, 49]];
const inPoly = (x, y, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
const toWorld = (lon, lat) => [(lon + 96) * SC, MAPZ - (lat - 37) * SC * 1.25];
const toLL = (x, z) => [x / SC - 96, 37 - (z - MAPZ) / (SC * 1.25)];
// Five broad regions; the strategist picks the South.
const regionOf = (lon, lat) => (lon < -111 ? 0 : lon < -100 ? 1 : lat < 36.2 && lon < -79 ? 3 : lon < -84 ? 2 : 4);
const PICK = 3;
const REGION_COL = [0xcdb58a, 0xb3b08a, 0xd9c79e, 0xc2a57e, 0xa8b38e];

const fwdOf = (yaw, out = V(0, 0, 0)) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = V(0, 0, 0)) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// People come from the shared rig in ../person.js.

// Oak planks for the table and the barn wall.
function planks(c, w, h, { base, n, gap, seed, dark = 0.25 }) {
  c.fillStyle = base; c.fillRect(0, 0, w, h);
  const ph = h / n;
  for (let i = 0; i < n; i++) {
    const y = i * ph;
    c.fillStyle = `rgba(${rnd(i, seed) > 0.5 ? '255,220,170' : '30,15,5'},${0.05 + rnd(i, seed + 1) * 0.1})`; c.fillRect(0, y, w, ph);
    for (let g = 0; g < 26; g++) {
      c.strokeStyle = `rgba(40,20,8,${0.06 + rnd(g + i * 31, seed + 2) * 0.12})`; c.lineWidth = 1 + rnd(g, seed + 3) * 2;
      const yy = y + rnd(g + i * 17, seed + 4) * ph;
      c.beginPath(); c.moveTo(0, yy); c.bezierCurveTo(w * 0.3, yy + (rnd(g, seed + 5) - 0.5) * 10, w * 0.6, yy + (rnd(g, seed + 6) - 0.5) * 10, w, yy); c.stroke();
    }
    c.fillStyle = `rgba(10,5,2,${dark})`; c.fillRect(0, y, w, gap);
  }
}

// The field photo used as the product page hero: morning rows running to the horizon.
function drawField(c, w, h) {
  const HZ = h * 0.48;
  const sky = c.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#5b9fd0'); sky.addColorStop(0.7, '#f4d6a8'); sky.addColorStop(1, '#f6c27c');
  c.fillStyle = sky; c.fillRect(0, 0, w, HZ);
  const sun = c.createRadialGradient(w * 0.72, HZ - 8, 4, w * 0.72, HZ - 8, w * 0.25); sun.addColorStop(0, 'rgba(255,240,200,1)'); sun.addColorStop(0.2, 'rgba(255,220,150,0.6)'); sun.addColorStop(1, 'rgba(255,200,120,0)');
  c.fillStyle = sun; c.fillRect(0, 0, w, HZ + 20);
  c.fillStyle = '#3c5a2a'; c.fillRect(0, HZ, w, h - HZ);
  for (let i = -24; i <= 24; i++) {
    const x0 = w * 0.5 + i * w * 0.09, x1 = w * 0.55 + i * 6;
    c.strokeStyle = i % 2 ? '#6f9a34' : '#86b23e'; c.lineWidth = 10 + Math.abs(i) * 0.4;
    c.beginPath(); c.moveTo(x1, HZ); c.lineTo(x0, h); c.stroke();
  }
  const haze = c.createLinearGradient(0, HZ, 0, HZ + h * 0.18); haze.addColorStop(0, 'rgba(246,210,160,0.7)'); haze.addColorStop(1, 'rgba(246,210,160,0)');
  c.fillStyle = haze; c.fillRect(0, HZ, w, h * 0.2);
}

// Category card faces: a droplet, a leaf and a seed, in shapes only.
function drawCard(c, w, h, kind, col) {
  c.clearRect(0, 0, w, h);
  c.fillStyle = '#132238'; roundRect(c, 0, 0, w, h, 34); c.fill();
  c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 4; roundRect(c, 6, 6, w - 12, h - 12, 30); c.stroke();
  const cx = w / 2, cy = h * 0.42, r = w * 0.27;
  c.fillStyle = col; c.globalAlpha = 0.18; c.beginPath(); c.arc(cx, cy, r * 1.35, 0, 7); c.fill(); c.globalAlpha = 1;
  c.fillStyle = col;
  c.beginPath();
  if (kind === 0) { c.moveTo(cx, cy - r); c.bezierCurveTo(cx + r * 0.9, cy, cx + r * 0.8, cy + r, cx, cy + r); c.bezierCurveTo(cx - r * 0.8, cy + r, cx - r * 0.9, cy, cx, cy - r); }
  else if (kind === 1) { c.moveTo(cx - r * 0.8, cy + r * 0.8); c.bezierCurveTo(cx - r * 0.9, cy - r * 0.4, cx, cy - r, cx + r * 0.85, cy - r * 0.85); c.bezierCurveTo(cx + r, cy, cx + r * 0.3, cy + r * 0.85, cx - r * 0.8, cy + r * 0.8); }
  else { c.ellipse(cx, cy, r * 0.62, r * 0.95, 0.25, 0, 7); }
  c.fill();
  if (kind === 1) { c.strokeStyle = '#132238'; c.lineWidth = 7; c.beginPath(); c.moveTo(cx - r * 0.7, cy + r * 0.7); c.quadraticCurveTo(cx, cy, cx + r * 0.6, cy - r * 0.6); c.stroke(); }
  c.fillStyle = 'rgba(255,255,255,0.75)'; roundRect(c, w * 0.18, h * 0.76, w * 0.64, 18, 9); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.3)'; roundRect(c, w * 0.28, h * 0.84, w * 0.44, 14, 7); c.fill();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a110a);
  scene.fog = new THREE.Fog(0x2a1c12, 4.5, 12);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the barn
  const floor = mesh(new THREE.PlaneGeometry(14, 12), std(0xffffff, { map: grainTex('#3a2a1c', { size: 256, speck: 0.16, blot: 0.12, seed: 7, repeat: 6 }), roughness: 0.85 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Back wall of vertical planks with a big open door on the right; sun leaks through the plank gaps.
  const WZ = -1.7, DL = 0.9, DR = 2.3, DH = 2.3;
  const wallTex = canvasTex(1024, 512, (c, w, h) => {
    c.save(); c.translate(w, 0); c.rotate(Math.PI / 2); planks(c, h, w, { base: '#3b2616', n: 22, gap: 3, seed: 11, dark: 0.55 }); c.restore();
    // Bright slits where the morning gets through.
    for (let i = 0; i < 22; i++) if (rnd(i, 4) > 0.45) { c.fillStyle = `rgba(255,214,150,${0.35 + rnd(i, 5) * 0.5})`; c.fillRect((i * w) / 22 - 1, h * rnd(i, 6) * 0.4, 2.5, h * (0.25 + rnd(i, 7) * 0.5)); }
  });
  wallTex.tex.wrapS = THREE.RepeatWrapping;
  const wallM = new THREE.MeshStandardMaterial({ map: wallTex.tex, roughness: 0.9, emissive: 0xffffff, emissiveMap: wallTex.tex, emissiveIntensity: 0.08 });
  [[-6, DL, 0, 4.2], [DR, 6, 0, 4.2], [DL, DR, DH, 4.2]].forEach(([x0, x1, y0, y1]) => {
    const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
    const uv = g.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (x0 + 6 + uv.getX(i) * (x1 - x0)) / 3, (y0 + uv.getY(i) * (y1 - y0)) / 4.2);
    const m = mesh(g, wallM, { cast: false }); m.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ); scene.add(m);
  });
  // Beyond the door: a field at sunrise.
  const outTex = canvasTex(512, 512, (c, w, h) => { drawField(c, w, h); c.fillStyle = 'rgba(255,230,190,0.35)'; c.fillRect(0, 0, w, h); });
  const outside = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 3.2), new THREE.MeshBasicMaterial({ map: outTex.tex, color: 0xd8c0a0, fog: false, toneMapped: true }));
  outside.position.set((DL + DR) / 2 + 0.3, 1.2, WZ - 1.4); scene.add(outside);
  const doorGlow = glow(0xffc884, 1, 0.45, 0.5); doorGlow.position.set((DL + DR) / 2, 1.15, WZ + 0.05); doorGlow.scale.set(2.2, 3.0, 1); scene.add(doorGlow);
  // Posts, a tie beam and two stacked hay bales.
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const beams = [[-2.2, 1.6, -1.3, 0.18, 3.2, 0.18], [DL - 0.06, 1.2, WZ + 0.05, 0.12, DH + 0.1, 0.14], [DR + 0.06, 1.2, WZ + 0.05, 0.12, DH + 0.1, 0.14], [(DL + DR) / 2, DH + 0.05, WZ + 0.05, DR - DL + 0.3, 0.12, 0.14], [0, 2.75, -1.2, 5.4, 0.2, 0.2]];
  const beamM = std(0xffffff, { map: grainTex('#4a3020', { size: 128, speck: 0.12, blot: 0.1, seed: 19 }), roughness: 0.8 });
  const beamIM = new THREE.InstancedMesh(boxGeo, beamM, beams.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = V(0, 0, 0), s4 = V(1, 1, 1), e4 = new THREE.Euler();
  beams.forEach(([x, y, z, w, h, d], i) => { m4.compose(p4.set(x, y, z), q4.identity(), s4.set(w, h, d)); beamIM.setMatrixAt(i, m4); });
  beamIM.castShadow = beamIM.receiveShadow = true; scene.add(beamIM);
  const bales = new THREE.InstancedMesh(new RoundedBoxGeometry(0.9, 0.42, 0.5, 3, 0.06), std(0xffffff, { map: grainTex('#a8843e', { size: 256, speck: 0.4, blot: 0.12, seed: 23, repeat: 1 }), roughness: 1 }), 3);
  [[-1.75, 0.21, -1.25, 0.1], [-1.65, 0.21, -0.7, -0.15], [-1.7, 0.63, -1.05, 0.05]].forEach(([x, y, z, r], i) => { m4.compose(p4.set(x, y, z), q4.setFromEuler(e4.set(0, r, 0)), s4.set(1, 1, 1)); bales.setMatrixAt(i, m4); });
  bales.castShadow = bales.receiveShadow = true; scene.add(bales);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xc8a882, 0x24160c, 0.36));
  const SUN_FROM = V(2.0, 2.1, -3.2);
  const sun = new THREE.DirectionalLight(0xffcf96, 0);
  sun.position.copy(SUN_FROM); sun.target.position.set(0, 0.9, 0.1);
  sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -1.9, right: 1.9, top: 1.7, bottom: -1.7, near: 1, far: 8 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const lamp = new THREE.PointLight(0xffc27a, 0, 3.2, 1.4); lamp.position.set(0.35, 1.98, 0.42); scene.add(lamp);
  const fill = new THREE.DirectionalLight(0x9fb4d0, 0.55); fill.position.set(-2.5, 2.0, 2.5); scene.add(fill);
  // The light shaft from the door onto the floor and table.
  const shaftTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(0.7, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.25, 'rgba(0,0,0,0)'); s.addColorStop(0.75, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 3.6), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffbe78, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  {
    const A = V((DL + DR) / 2, 1.6, WZ), B = V(0.6, 0.0, 0.6), mid = A.clone().add(B).multiplyScalar(0.5);
    const yA = A.clone().sub(B).normalize(), toCam = V(-1, 1.6, 2.4).sub(mid);
    const zA = toCam.sub(yA.clone().multiplyScalar(toCam.dot(yA))).normalize(), xA = V(0, 0, 0).crossVectors(yA, zA);
    shaft.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA)); shaft.position.copy(mid);
    shaft.scale.y = A.distanceTo(B) / 3.6;
  }
  scene.add(shaft);

  // ----------------------------------------------------------- the table and the lamp
  const tableTex = canvasTex(1024, 512, (c, w, h) => planks(c, w, h, { base: '#7a5232', n: 6, gap: 4, seed: 3, dark: 0.45 }));
  const table = mesh(new RoundedBoxGeometry(2.3, 0.07, 1.36, 3, 0.02), std(0xffffff, { map: tableTex.tex, roughness: 0.5, metalness: 0.02 }));
  table.position.set(0, TOP - 0.035, 0); scene.add(table);
  const legs = new THREE.InstancedMesh(boxGeo, std(0x4a2e1a, { roughness: 0.7 }), 4);
  [[-1.05, -0.58], [1.05, -0.58], [-1.05, 0.58], [1.05, 0.58]].forEach(([x, z], i) => { m4.compose(p4.set(x, (TOP - 0.07) / 2, z), q4.identity(), s4.set(0.08, TOP - 0.07, 0.08)); legs.setMatrixAt(i, m4); });
  legs.castShadow = legs.receiveShadow = true; scene.add(legs);
  const lampG = new THREE.Group(); lampG.position.set(0.35, 2.12, 0.42); scene.add(lampG);
  const cord = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.8, 6), std(0x111111), { cast: false }); cord.position.y = 0.45; lampG.add(cord);
  const shade = mesh(new THREE.ConeGeometry(0.22, 0.16, 36, 1, true), new THREE.MeshStandardMaterial({ color: 0x1f5a3c, roughness: 0.35, metalness: 0.4, side: THREE.DoubleSide }), { cast: false }); lampG.add(shade);
  const bulbM = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), bulbM); bulb.position.y = -0.07; lampG.add(bulb);
  const lampGlow = glow(0xffc27a, 0.7, 0, 0.45); lampGlow.position.y = -0.1; lampG.add(lampGlow);

  // ----------------------------------------------------------- the hexagon map
  const hexes = [];
  for (let row = -10; row <= 10; row++) for (let col = -16; col <= 16; col++) {
    const x = col * Math.sqrt(3) * HR + (row & 1 ? (Math.sqrt(3) * HR) / 2 : 0), z = MAPZ + row * 1.5 * HR;
    const [lon, lat] = toLL(x, z);
    if (!inPoly(lon, lat, US)) continue;
    hexes.push({ x, z, lon, lat, r: regionOf(lon, lat), h: 0.03 + rnd(row * 40 + col, 2) * 0.012 });
  }
  const HN = hexes.length;
  const hexGeo = new THREE.CylinderGeometry(HR * 0.93, HR * 0.93, 1, 6); hexGeo.translate(0, 0.5, 0);
  const hexM = std(0xffffff, { roughness: 0.55, metalness: 0.02 });
  const hexIM = new THREE.InstancedMesh(hexGeo, hexM, HN);
  hexIM.castShadow = hexIM.receiveShadow = true; scene.add(hexIM);
  hexes.forEach((h, i) => hexIM.setColorAt(i, new THREE.Color(REGION_COL[h.r])));
  const mapBase = mesh(new RoundedBoxGeometry(2.0, 0.012, 1.0, 2, 0.006), std(0x1e2a30, { roughness: 0.45, metalness: 0.3 }), { cast: false });
  mapBase.position.set(-0.02, TOP + 0.006, MAPZ - 0.01); scene.add(mapBase);
  // The picked region: centroid, and the tile nearest it is where the finger lands.
  const pick = hexes.filter((h) => h.r === PICK);
  const cen = pick.reduce((a, h) => a.add(V(h.x, 0, h.z)), V(0, 0, 0)).multiplyScalar(1 / pick.length);
  const tapHex = pick.reduce((b, h) => ((h.x - cen.x) ** 2 + (h.z - cen.z) ** 2 < (b.x - cen.x) ** 2 + (b.z - cen.z) ** 2 ? h : b), pick[0]);
  const TAP_PT = V(tapHex.x, TOP + 0.012 + tapHex.h + 0.004, tapHex.z);
  hexes.forEach((h) => { h.d = Math.hypot(h.x - tapHex.x, h.z - tapHex.z); h.wave = 0.35 + (h.x + 1) * 0.32 + rnd(h.d * 100, 3) * 0.06; });
  const hexCol = new THREE.Color(), BLUE_C = new THREE.Color(BLUE_H), baseCols = REGION_COL.map((c) => new THREE.Color(c));
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  ripple.rotation.x = -Math.PI / 2; ripple.position.set(TAP_PT.x, TAP_PT.y + 0.004, TAP_PT.z); scene.add(ripple);
  const regionGlow = glow(BLUE_H, 1, 0, 0.5); regionGlow.position.set(cen.x, TOP + 0.12, cen.z); regionGlow.scale.set(1.1, 0.45, 1); scene.add(regionGlow);

  // ----------------------------------------------------------- category cards
  const CARD_W = 0.22, CARD_H = 0.28;
  const KIND_COL = [BLUE, GREEN, ORANGE], CHOSEN = 1;
  const HOVER = [V(-0.16, 1.2, 0.36), V(0.13, 1.27, 0.33), V(0.42, 1.2, 0.36)];
  const cardBody = new RoundedBoxGeometry(CARD_W, CARD_H, 0.012, 3, 0.01);
  const cards = [0, 1, 2].map((i) => {
    const g = new THREE.Group(); scene.add(g);
    g.add(mesh(cardBody, std(0x0f1c2e, { roughness: 0.35, metalness: 0.4 })));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CARD_W - 0.004, CARD_H - 0.004), new THREE.MeshBasicMaterial({ map: canvasTex(256, 326, (c, w, h) => drawCard(c, w, h, i, KIND_COL[i])).tex, transparent: true, toneMapped: false, color: 0xdddddd }));
    face.position.z = 0.0065; g.add(face);
    return { g, face };
  });
  const cardGlow = glow(GREEN_H, 1, 0, 0.5); scene.add(cardGlow);

  // ----------------------------------------------------------- the display with the product page
  const pageG = new THREE.Group(); pageG.position.copy(PAGE); pageG.rotation.y = PAGE_YAW; scene.add(pageG);
  const frame = mesh(new RoundedBoxGeometry(PW + 0.05, PH + 0.05, 0.03, 3, 0.012), std(0x1b1d22, { metalness: 0.8, roughness: 0.32 }));
  pageG.add(frame);
  const UI = canvasTex(1024, Math.round((1024 * PH) / PW));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: UI.tex, toneMapped: false, color: 0x000000 }));
  screen.position.z = 0.0155; pageG.add(screen);
  const pageGlow = glow(0x9fd8ff, 1, 0, 0.5); pageGlow.position.z = -0.05; pageGlow.scale.set(PW * 1.9, PH * 1.9, 1); pageG.add(pageGlow);
  const standM = std(0x2a2c31, { metalness: 0.85, roughness: 0.3 });
  const POST = PAGE.y - TOP - 0.06;
  const stand = mesh(mergeGeometries([
    new THREE.BoxGeometry(0.05, POST, 0.02).translate(0, TOP + POST / 2 - PAGE.y, -0.035),
    new THREE.BoxGeometry(0.34, 0.016, 0.2).translate(0, TOP + 0.008 - PAGE.y, -0.03),
  ]), standM);
  stand.position.copy(PAGE); stand.rotation.y = PAGE_YAW; scene.add(stand);
  const field = canvasTex(1024, 360, drawField);
  // Product template: nav with the path, hero, product heading, three feature tiles, a call to action.
  function drawPage(c, w, h, s) {
    c.fillStyle = '#0b1420'; c.fillRect(0, 0, w, h);
    if (s.boot <= 0) return;
    c.globalAlpha = s.boot; c.fillStyle = '#eef1f2'; c.fillRect(0, 0, w, h); c.globalAlpha = 1;
    const fade = (p, fn) => { if (p <= 0) return; c.save(); c.globalAlpha = clamp(p); c.translate(0, (1 - eo(clamp(p))) * 24); fn(); c.restore(); };
    fade(s.nav, () => {
      c.fillStyle = NAVY; c.fillRect(0, 0, w, 64);
      c.fillStyle = '#ffffff'; roundRect(c, 28, 22, 90, 20, 10); c.fill();
      [[BLUE, 170], [GREEN, 262], [ORANGE, 354]].forEach(([col, x], i) => { c.fillStyle = col; roundRect(c, x, 24, 70, 16, 8); c.fill(); if (i < 2) { c.fillStyle = 'rgba(255,255,255,0.6)'; c.fillRect(x + 76, 30, 10, 4); } });
      c.fillStyle = 'rgba(255,255,255,0.5)'; [w - 220, w - 150, w - 80].forEach((x) => { roundRect(c, x, 26, 50, 12, 6); c.fill(); });
    });
    fade(s.hero, () => {
      c.save(); roundRect(c, 28, 84, w - 56, 300, 18); c.clip(); c.drawImage(field.cv, 28, 84, w - 56, 300); c.restore();
      c.fillStyle = 'rgba(0,48,94,0.55)'; roundRect(c, 52, 250, 440, 110, 14); c.fill();
      c.fillStyle = '#ffffff'; roundRect(c, 76, 274, 300, 30, 15); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.7)'; roundRect(c, 76, 318, 380, 16, 8); c.fill();
    });
    fade(s.head, () => {
      c.fillStyle = '#16263a'; roundRect(c, 40, 412, 420, 34, 17); c.fill();
      c.fillStyle = '#7d8a96'; roundRect(c, 40, 462, 560, 16, 8); c.fill(); roundRect(c, 40, 490, 480, 16, 8); c.fill();
    });
    [0, 1, 2].forEach((i) => fade(s.tiles[i], () => {
      const x = 40 + i * ((w - 80) / 3), tw = (w - 80) / 3 - 20;
      c.fillStyle = '#ffffff'; roundRect(c, x, 528, tw, 110, 14); c.fill();
      c.strokeStyle = 'rgba(0,48,94,0.12)'; c.lineWidth = 3; roundRect(c, x, 528, tw, 110, 14); c.stroke();
      c.fillStyle = [BLUE, GREEN, ORANGE][i]; c.beginPath(); c.arc(x + 46, 583, 24, 0, 7); c.fill();
      c.fillStyle = '#16263a'; roundRect(c, x + 86, 562, tw - 120, 16, 8); c.fill();
      c.fillStyle = '#9aa5ae'; roundRect(c, x + 86, 592, tw - 150, 12, 6); c.fill();
    }));
    fade(s.cta, () => { c.fillStyle = GREEN; roundRect(c, w - 300, 412, 256, 60, 30); c.fill(); c.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(c, w - 252, 436, 160, 12, 6); c.fill(); });
  }
  let pageKey = '';
  const PT = { nav: 4.85, hero: 5.05, head: 5.4, tiles: [5.65, 5.82, 5.99], cta: 6.2 };

  // ----------------------------------------------------------- breadcrumb
  const CHIPS = [['REGION', BLUE], ['CATEGORY', GREEN], ['PRODUCT', ORANGE]];
  // Size the strip to its content.
  const probe = document.createElement('canvas').getContext('2d'); probe.font = `700 40px ${MONO}`;
  const CW_ = Math.min(1024, Math.ceil(16 + CHIPS.reduce((a, [n]) => a + probe.measureText(n).width + 56, 0) + 2 * 64)), CH_ = 132;
  const crumb = canvasTex(CW_, CH_);
  function drawCrumb(c, w, h, st) {
    c.clearRect(0, 0, w, h);
    c.font = `700 40px ${MONO}`;
    let x = 8;
    CHIPS.forEach(([name, col], i) => {
      const tw = c.measureText(name).width + 56;
      const p = st[i];
      c.fillStyle = 'rgba(16,22,30,0.82)'; roundRect(c, x, 18, tw, 96, 48); c.fill();
      if (p > 0) { c.save(); roundRect(c, x, 18, tw, 96, 48); c.clip(); c.fillStyle = col; c.fillRect(x, 18, tw * p, 96); c.restore(); }
      c.strokeStyle = p >= 1 ? col : 'rgba(255,255,255,0.22)'; c.lineWidth = 4; roundRect(c, x + 2, 20, tw - 4, 92, 46); c.stroke();
      c.fillStyle = p >= 1 ? '#0d1520' : '#c9c2b4'; c.textBaseline = 'middle'; c.fillText(name, x + 28, 68);
      x += tw;
      if (i < 2) {
        const nx = x + 64, link = st[i + 1] > 0 ? 1 : 0;
        c.strokeStyle = 'rgba(255,255,255,0.25)'; c.lineWidth = 6; c.beginPath(); c.moveTo(x + 12, 66); c.lineTo(nx - 12, 66); c.stroke();
        if (link) { c.strokeStyle = CHIPS[i + 1][1]; c.beginPath(); c.moveTo(x + 12, 66); c.lineTo(x + 12 + (nx - x - 24) * clamp(st[i + 1] * 2), 66); c.stroke(); }
        x = nx;
      }
    });
  }
  const CRUMB_H = 0.14;
  const crumbM = new THREE.Mesh(new THREE.PlaneGeometry(CRUMB_H * CW_ / CH_, CRUMB_H), new THREE.MeshBasicMaterial({ map: crumb.tex, transparent: true, toneMapped: false, depthWrite: false }));
  crumbM.material.fog = false; scene.add(crumbM);
  let crumbKey = '';

  // ----------------------------------------------------------- the strategist
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc99572, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const zip = std(0x1f3550, { roughness: 0.85 });
  const strat = makePerson(scene, { skin, top: zip, sleeve: zip, fore: skin, pants: std(0x9a8662, { roughness: 0.9 }), shoeM: std(0x4a2e1c, { roughness: 0.6 }), hairM: std(0x5a3c24, { roughness: 0.85 }), hairCap: 0.55, chestR: 0.15 });
  const collar = mesh(new THREE.TorusGeometry(0.075, 0.02, 8, 24), zip, { cast: false }); scene.add(collar);
  strat.extra.push((hip, top, F) => { collar.position.copy(top).add(p4.set(0, 0.03, 0)).addScaledVector(F, 0.01); collar.rotation.set(Math.PI / 2, 0, 0); });
  // The index finger of the tapping hand.
  const finger = mesh(new THREE.CapsuleGeometry(0.011, 0.05, 4, 8), skin); scene.add(finger);
  const HIP0 = V(0.12, 0.93, 0.92), YAW = Math.PI;
  const REST_R = [0.4, TOP + 0.04, 0.56], REST_L = [-0.16, TOP + 0.04, 0.58];
  const TAP_HOVER = TAP_PT.clone().add(V(0.02, 0.1, 0.04));
  const C1 = HOVER[CHOSEN];
  // Fingertip path for the right hand; the wrist trails it by the finger's length.
  const tipKeys = [
    [0, REST_R], [1.1, REST_R], [1.48, TAP_HOVER.toArray()], [TAP, TAP_PT.toArray()], [TAP + 0.16, TAP_HOVER.toArray()],
    [2.35, [0.36, 1.02, 0.58]], [3.15, [C1.x + 0.02, C1.y - 0.02, C1.z + 0.11]], [CARD_TAP, [C1.x, C1.y - 0.03, C1.z + 0.012]],
    [CARD_TAP + 0.15, [C1.x + 0.03, C1.y - 0.04, C1.z + 0.12]], [4.15, REST_R], [10, REST_R],
  ];

  // ----------------------------------------------------------- title
  const kicker = label('BASF Agriculture', { font: `700 56px ${MONO}`, fg: '#ffd9a0', h: 0.095, track: 5 });
  const title = label('US Crop website', { font: `800 72px ${SANS}`, fg: '#fff4e4', h: 0.2, track: 1 });
  [kicker, title].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, KWd = kicker.geometry.parameters.width;

  // ----------------------------------------------------------- dust in the sun
  const DN = 150, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd8a8, size: 0.012, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.95, 2.02, 1.5]], [2.3, [-1.02, 1.86, 1.4]],
    [3.4, [-1.08, 1.56, 1.62]], [4.6, [-1.15, 1.6, 2.05]],
    [6.6, [-1.1, 1.6, 2.3]], [10, [-1.02, 1.62, 2.45], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.12, 0.96, 0.22]], [2.3, [0.14, 1.04, 0.22]],
    [3.4, [0.1, 1.16, 0.28]], [4.6, [-0.2, 1.3, -0.1]],
    [6.6, [-0.12, 1.54, -0.18]], [10, [-0.1, 1.56, -0.18], L],
  ]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), look = V(0, 0, 0), hip = V(0, 0, 0), lk = V(0, 0, 0), tip = V(0, 0, 0), dir = V(0, 0, 0);
  const pageCenter = PAGE.clone().add(V(Math.sin(PAGE_YAW), 0, Math.cos(PAGE_YAW)).multiplyScalar(0.03));

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 35], [2.3, 33], [3.4, 34], [4.6, 36], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Morning comes up; the lamp warms on.
    const morn = eo(k(t, 0.0, 1.4));
    sun.intensity = 2.7 * morn;
    shaft.material.opacity = 0.16 * morn * (0.9 + 0.1 * Math.sin(t * 1.2));
    doorGlow.material.opacity = 0.42 * morn;
    const lampOn = eo(k(t, 0.2, 0.7));
    lamp.intensity = 2.6 * lampOn; bulbM.color.setRGB(3 * lampOn, 2.2 * lampOn, 1.2 * lampOn); lampGlow.material.opacity = 0.55 * lampOn;
    lampG.rotation.z = Math.sin(t * 0.9) * 0.012;
    dust.material.opacity = 0.55 * morn;

    // ---- Beat 1: the map pops up west to east, then the strategist taps the South.
    hexes.forEach((h, i) => {
      const up = back(k(t, h.wave, h.wave + 0.45));
      const sel = h.r === PICK ? k(t, TAP + 0.12 + h.d * 1.3, TAP + 0.5 + h.d * 1.3) : 0;
      const rise = back(sel), lit = eo(sel);
      m4.compose(p4.set(h.x, TOP + 0.012, h.z), q4.identity(), s4.set(1, Math.max(0.001, up * h.h + 0.035 * rise), 1));
      hexIM.setMatrixAt(i, m4);
      hexCol.copy(baseCols[h.r]);
      if (h.r !== PICK) hexCol.multiplyScalar(1 - 0.2 * eo(k(t, TAP, TAP + 0.6)));
      hexCol.lerp(BLUE_C, lit);
      hexIM.setColorAt(i, hexCol);
    });
    hexIM.instanceMatrix.needsUpdate = true; hexIM.instanceColor.needsUpdate = true;
    const rp = k(t, TAP, TAP + 0.9);
    ripple.scale.setScalar(0.02 + 0.45 * eo(rp));
    ripple.material.opacity = rp > 0 && rp < 1 ? 0.9 * (1 - rp) : 0;
    regionGlow.material.opacity = 0.32 * eo(k(t, TAP + 0.1, TAP + 0.7)) * (1 - 0.4 * eo(k(t, 4.5, 5.5)));

    // ---- Beat 2: three category cards fan up out of the region; one is tapped, the rest sink away.
    let cg = 0;
    cards.forEach((cd, i) => {
      const rise = back(k(t, 2.35 + i * 0.1, 2.95 + i * 0.1));
      const chosen = i === CHOSEN;
      const press = chosen ? Math.sin(Math.PI * k(t, CARD_TAP - 0.02, CARD_TAP + 0.2)) : 0;
      const sink = chosen ? 0 : ei(k(t, CARD_TAP + 0.12 + i * 0.05, CARD_TAP + 0.55 + i * 0.05));
      const fl = chosen ? eio(k(t, FLY, OPEN)) : 0;
      const bob = Math.sin(t * 1.6 + i * 1.7) * 0.008 * clamp(rise);
      tmp.set(cen.x, TOP + 0.06, cen.z).lerp(HOVER[i], clamp(rise));
      tmp.y = lerp(TOP + 0.06, HOVER[i].y, rise) + bob - 0.22 * sink;
      tmp.z -= 0.02 * press;
      if (fl > 0) { tmp2.copy(HOVER[i]).lerp(pageCenter, fl); tmp2.y += Math.sin(Math.PI * fl) * 0.22; tmp.copy(tmp2); }
      cd.g.position.copy(tmp);
      cd.g.rotation.set((-0.12 * (1 - clamp(rise)) + 0.05) * (1 - fl), lerp(-0.25 + i * 0.25, PAGE_YAW, fl) + (1 - clamp(rise)) * 0.8 * (i - 1), (1 - clamp(rise)) * 0.3 * (i - 1));
      const sc = Math.max(0.001, lerp(0.35, 1, clamp(rise)) * (1 - sink) * (1 + 0.08 * press));
      cd.g.scale.set(sc * lerp(1, PW / CARD_W, eio(fl)), sc * lerp(1, PH / CARD_H, eio(fl)), sc);
      cd.g.visible = rise > 0.001 && sink < 0.99 && t < OPEN + 0.02;
      cd.face.material.color.setScalar(chosen ? 0.86 + 0.5 * press + 0.3 * eo(k(t, CARD_TAP, CARD_TAP + 0.3)) * (1 - fl) : 0.86 * (1 - 0.4 * eo(k(t, CARD_TAP, CARD_TAP + 0.3))));
      if (chosen) { cardGlow.position.copy(tmp).add(tmp2.set(0, 0, -0.03)); cg = (0.6 * press + 0.35 * eo(k(t, CARD_TAP, CARD_TAP + 0.25))) * (cd.g.visible ? 1 : 0) * (1 - fl * 0.5); }
    });
    cardGlow.material.opacity = cg; cardGlow.scale.setScalar(0.5);

    // ---- Beat 3: the chosen card opens into the product page on the display, which builds.
    const pop = Math.sin(Math.PI * k(t, OPEN - 0.05, OPEN + 0.35));
    pageG.scale.set(1 + 0.03 * pop, 1 + 0.03 * pop, 1);
    const boot = eo(k(t, OPEN, OPEN + 0.25));
    screen.material.color.setScalar(lerp(0.05, 0.86, boot));
    pageGlow.material.opacity = 0.18 * boot + 0.4 * Math.exp(-4 * Math.max(0, t - OPEN)) * (t > OPEN ? 1 : 0) + 0.25 * Math.exp(-3 * Math.max(0, t - CRUMB[2])) * (t > CRUMB[2] ? 1 : 0);
    const st = { boot, nav: k(t, PT.nav, PT.nav + 0.3), hero: k(t, PT.hero, PT.hero + 0.35), head: k(t, PT.head, PT.head + 0.3), tiles: PT.tiles.map((a) => k(t, a, a + 0.3)), cta: k(t, PT.cta, PT.cta + 0.3) };
    const key = [st.boot, st.nav, st.hero, st.head, ...st.tiles, st.cta].map((x) => Math.round(x * 20)).join('|');
    if (key !== pageKey) { pageKey = key; UI.redraw((c, w, h) => drawPage(c, w, h, st)); }

    // The breadcrumb over the display fills step by step.
    const cs = CRUMB.map((a) => eio(k(t, a, a + 0.4)));
    const ck = cs.map((x) => Math.round(x * 20)).join('|');
    if (ck !== crumbKey) { crumbKey = ck; crumb.redraw((c, w, h) => drawCrumb(c, w, h, cs)); }
    const ca = eo(k(t, 0.9, 1.4));
    lk.copy(camera.position); lk.y = PAGE.y + PH / 2 + 0.16;
    crumbM.position.set(PAGE.x + 0.04, PAGE.y + PH / 2 + 0.14 + (1 - ca) * -0.04, PAGE.z + 0.05);
    crumbM.lookAt(lk); crumbM.material.opacity = ca; crumbM.visible = ca > 0.01;

    // ---- The strategist.
    tip.fromArray(kf(t, tipKeys));
    const reach = clamp(Math.max(Math.sin(Math.PI * k(t, 1.05, 2.3)), Math.sin(Math.PI * k(t, 2.8, 4.1)) * 0.8));
    hip.copy(HIP0); hip.z -= 0.03 * reach; hip.y += Math.sin(t * 1.7) * 0.004 - 0.015 * reach; hip.x += Math.sin(t * 0.7) * 0.008;
    const pageLook = eio(k(t, 4.0, 4.6));
    if (t < 2.3) look.copy(TAP_PT).lerp(tmp.set(cen.x, TOP, cen.z), 0.3);
    else look.copy(HOVER[CHOSEN]).lerp(tmp.set(cen.x, TOP + 0.1, cen.z), 1 - eio(k(t, 2.3, 2.9)));
    look.lerp(tmp.copy(PAGE), pageLook);
    if (t > 7.1) look.lerp(tmp.copy(camera.position), 0.4 * eio(k(t, 7.1, 7.7)));
    const yaw = YAW + Math.atan2(look.x - hip.x, -(look.z - hip.z)) * -0.3;
    strat.pose({ t,
      hip, yaw, lean: 0.12 + 0.24 * reach - 0.04 * pageLook, look, nod: 0.12 * Math.sin(Math.PI * k(t, TAP - 0.1, TAP + 0.3)) + 0.1 * Math.sin(Math.PI * k(t, 6.5, 7.0)),
      feet: (i, out) => out.set(HIP0.x + (i ? -0.12 : 0.12), 0.085, HIP0.z + 0.04 + (i ? -0.03 : 0.04)),
      hands: (i, shp, out) => {
        if (i === 0) { dir.subVectors(tip, shp).normalize(); out.copy(tip).addScaledVector(dir, -0.085); }
        else { out.fromArray(REST_L); out.y += Math.sin(t * 1.2) * 0.003; out.addScaledVector(Y, 0.02 * pageLook); }
      },
    });
    dir.subVectors(tip, strat.hand[0].position).normalize();
    finger.position.copy(strat.hand[0].position).addScaledVector(dir, 0.045);
    finger.quaternion.setFromUnitVectors(Y, dir);

    // ---- Beat 4: the name above the path.
    const ki = back(k(t, 7.3, 7.85)), ti = back(k(t, 7.45, 8.0)), out = ei(k(t, 9.2, 9.58));
    const tx = PAGE.x + 0.12, ty = PAGE.y + PH / 2 + 0.37, tz = PAGE.z + 0.1;
    lk.copy(camera.position); lk.y = ty;
    title.position.set(tx, ty + (1 - clamp(ti)) * -0.05, tz); title.lookAt(lk);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    kicker.position.set(tx - TWd / 2 + KWd / 2 + 0.01, ty + 0.15 + (1 - clamp(ki)) * -0.04, tz); kicker.quaternion.copy(title.quaternion);
    kicker.material.opacity = clamp(ki) * (1 - out); kicker.visible = kicker.material.opacity > 0.01;

    // Dust turning in the door's light.
    for (let i = 0; i < DN; i++) {
      const s = rnd(i, 61);
      dpos[i * 3] = lerp((DL + DR) / 2, 0.6, s) + (rnd(i, 62) - 0.5) * 0.9 + Math.sin(t * 0.3 + i) * 0.05;
      dpos[i * 3 + 1] = lerp(1.6, 0.1, s) + (rnd(i, 63) - 0.5) * 0.5 + Math.sin(t * 0.4 + i * 1.3) * 0.04;
      dpos[i * 3 + 2] = lerp(WZ, 0.6, s) + (rnd(i, 64) - 0.5) * 0.4 + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 7.95 };
}
