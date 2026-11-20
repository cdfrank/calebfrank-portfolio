// BASF Agriculture customer portal lit loop, 10 s. "BASF's first direct line to its customers."
// An architect's white model of the supply chain on a slate table, raked by soft window light. Crates
// hop from BASF through two partners before they reach the customer, waiting at every stop. A Partner
// Portal rises out of the model and wires BASF and its partners to the same numbers, regrouping sales
// by season. Then a beam of light arcs straight from BASF over the chain to the customer's farm, a
// phone drops onto the model, signs in once across three businesses and opens the Customer Portal.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const BLUE = '#004a96', DARK = '#00305e', GREEN = '#65ac1e', SKY = '#21a0d2', AMBER = '#f39500';
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
// The chain as a road through the model: BASF, two partners, the customer.
const ROUTE = [[-2.05, 0.12], [-1.45, -0.1], [-0.78, -0.2], [-0.12, 0.16], [0.55, 0.26], [1.18, 0.04], [1.86, -0.12]];
const NODE_T = [0, 2 / 6, 4 / 6, 1];
const NODES = [
  { name: 'BASF', bg: 'rgba(0,48,94,0.94)' },
  { name: 'PARTNER', bg: 'rgba(16,96,140,0.94)' },
  { name: 'PARTNER', bg: 'rgba(16,96,140,0.94)' },
  { name: 'CUSTOMER', bg: 'rgba(58,110,18,0.95)' },
];
// Where each node's buildings stand, behind the road.
const BLD = [[-2.12, -0.32], [-0.8, -0.58], [0.56, -0.12], [1.9, -0.5]];
// Crates: when each one leaves BASF; each leg is 0.5 s of hop and 0.32 s of waiting.
const CN = 7, C0 = 0.45, CGAP = 0.2, LEG = 0.5, WAIT = 0.32;
const TABS = ['Financials', 'Orders', 'Activity', 'Education', 'Tools'];
const MODES = ['Month', 'Season', 'Calendar', 'Year over year'];
const PANEL = new THREE.Vector3(-0.12, 0.62, -1.0);
const PHONE_AT = new THREE.Vector3(1.38, 0, 0.42);

function ribbon(pts, w, y) {
  const n = pts.length, pos = new Float32Array(n * 6), nor = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [];
  const acc = [0];
  for (let i = 1; i < n; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z));
  const L = acc[n - 1] || 1;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz * w / 2, nz = tx * w / 2;
    pos.set([pts[i].x + nx, y, pts[i].z + nz, pts[i].x - nx, y, pts[i].z - nz], i * 6);
    nor.set([0, 1, 0, 0, 1, 0], i * 6);
    uv.set([acc[i] / L, 0, acc[i] / L, 1], i * 4);
    if (i < n - 1) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
// Gable roof: a triangular prism with its ridge along x.
function roofGeo(span, rise, len, over = 0.025) {
  const s = new THREE.Shape();
  s.moveTo(-span / 2 - over, 0); s.lineTo(span / 2 + over, 0); s.lineTo(0, rise); s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: len + over * 2, bevelEnabled: false });
  g.translate(0, 0, -(len + over * 2) / 2); g.rotateY(Math.PI / 2);
  return g;
}
// Camera-anchored caption: a mono kicker over one line, on a frosted pill sized to the text.
function caption(kicker, line, { sub = null, accent = GREEN, h = 0.12 } = {}) {
  const W = 1024, H = sub ? 236 : 168;
  const { tex } = canvasTex(W, H, (c) => {
    // Shrink a line until it fits the card, so long lines never clip.
    const fit = (txt, size, weight) => { let px = size; c.font = `${weight} ${px}px ${SANS}`; while (c.measureText(txt).width > W - 104 && px > 20) { px -= 2; c.font = `${weight} ${px}px ${SANS}`; } return px; };
    const LP = fit(line, sub ? 52 : 46, 800), lw = c.measureText(line).width;
    const SP = sub ? fit(sub, 34, 600) : 34, sw = sub ? c.measureText(sub).width : 0;
    const bw = Math.min(W - 8, Math.max(lw, sw) + 92), x0 = (W - bw) / 2;
    c.fillStyle = 'rgba(8,18,32,0.82)'; roundRect(c, x0, 4, bw, H - 8, 30); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = accent; c.fillRect(x0 + 46, 30, 30, 4);
    c.font = `700 22px ${MONO}`; c.textBaseline = 'middle'; c.fillText(kicker, x0 + 88, 33);
    c.fillStyle = '#fff'; c.font = `800 ${LP}px ${SANS}`; c.fillText(line, x0 + 46, sub ? 100 : 104);
    if (sub) { c.fillStyle = 'rgba(255,255,255,0.78)'; c.font = `600 ${SP}px ${SANS}`; c.fillText(sub, x0 + 46, 170); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(h * W / H, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, depthTest: false }));
  m.renderOrder = 20;
  return m;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x4b5562, 7, 22);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- studio and table
  scene.add(skyDome([[0, '#1a222d'], [0.36, '#394657'], [0.48, '#7f8b96'], [0.5, '#a3abb0'], [0.53, '#4a5361'], [1, '#20252d']]));
  const table = mesh(new THREE.PlaneGeometry(40, 40), std(0xffffff, { map: grainTex('#343b46', { size: 256, speck: 0.06, blot: 0.08, seed: 21, repeat: 14 }), roughness: 0.55, metalness: 0.1 }), { cast: false });
  table.rotation.x = -Math.PI / 2; table.position.y = -0.14; scene.add(table);
  const foam = std(0xefebe3, { roughness: 0.92 });
  const slab = mesh(new RoundedBoxGeometry(5.4, 0.14, 2.8, 2, 0.02), foam);
  slab.position.y = -0.07; scene.add(slab);
  const plinth = mesh(new THREE.BoxGeometry(5.46, 0.018, 2.86), std(0x2a2019, { roughness: 0.6 }), { cast: false });
  plinth.position.y = -0.131; scene.add(plinth);

  // ----------------------------------------------------------- lights: window light raking the model
  scene.add(new THREE.HemisphereLight(0xa9b8cf, 0x2a2f38, 0.55));
  const cookie = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#fff8ec'; c.fillRect(20, 20, w - 40, h - 40);
    // Soft mullions: one upright and one transom, blurred so they read as window light, not stripes.
    c.shadowColor = '#000'; c.shadowBlur = 26; c.fillStyle = '#000';
    c.fillRect(w * 0.6 - 9, 0, 18, h); c.fillRect(0, h * 0.42 - 8, w, 16);
    c.shadowBlur = 0;
  });
  const key = new THREE.SpotLight(0xfff1dc, 22, 0, 0.6, 0.45, 1.0);
  key.map = cookie.tex;
  key.position.set(-3.6, 4.6, 2.6); key.target.position.set(0, 0, -0.2);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 3; key.shadow.camera.far = 11; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x9db8ff, 0.7); rim.position.set(3, 2, -2.5); scene.add(rim);
  const panelLight = new THREE.PointLight(0x5fb8ff, 0, 2.2, 1.6); scene.add(panelLight);
  const pulseLight = new THREE.PointLight(0xb8ff7a, 0, 1.6, 1.6); scene.add(pulseLight);

  // ----------------------------------------------------------- the road of the chain
  const curve = new THREE.CatmullRomCurve3(ROUTE.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const roadPts = curve.getPoints(140);
  const road = mesh(ribbon(roadPts, 0.11, 0.003), std(0xd6cdbb, { roughness: 0.85, side: THREE.DoubleSide }), { cast: false });
  scene.add(road);
  const edgeL = new THREE.Mesh(ribbon(roadPts, 0.125, 0.0015), std(0xb7ad99, { roughness: 0.9, side: THREE.DoubleSide }));
  edgeL.receiveShadow = true; scene.add(edgeL);
  const roadDist = (x, z) => roadPts.reduce((m, p) => Math.min(m, Math.hypot(p.x - x, p.z - z)), 9);
  const anchors = NODE_T.map((u) => curve.getPoint(u));
  const keepOut = (x, z, r = 0) => roadDist(x, z) < 0.2 + r
    || BLD.some(([bx, bz]) => Math.hypot(bx - x, bz - z) < 0.42 + r)
    || Math.hypot(PHONE_AT.x - x, PHONE_AT.z - z) < 0.34 + r
    || Math.abs(x) > 2.55 || Math.abs(z) > 1.25;

  // ----------------------------------------------------------- fields and trees (instanced)
  const rows = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 8) { c.fillStyle = 'rgba(60,70,40,0.22)'; c.fillRect(0, y, w, 3); }
  });
  const cells = [];
  for (let x = -2.48; x <= 2.48; x += 0.36) for (let z = -1.12; z <= 1.12; z += 0.3) {
    if (keepOut(x, z, 0.04) || rnd(x * 13, z * 7) < 0.18) continue;
    cells.push([x, z]);
  }
  const FCOL = [0x9bb07a, 0xb9c48d, 0xd8cf9a, 0x87a36a, 0xc9b98a, 0xa9bf84];
  const fields = new THREE.InstancedMesh(new THREE.BoxGeometry(0.32, 0.014, 0.26), std(0xffffff, { map: rows.tex, roughness: 0.95 }), cells.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler(), c4 = new THREE.Color();
  cells.forEach(([x, z], i) => {
    q4.identity();
    const sx = rnd(i, 4) > 0.5 ? 1 : 0.82;
    m4.compose(p4.set(x, 0.007, z), q4, s4.set(sx, 1, 1));
    fields.setMatrixAt(i, m4);
    fields.setColorAt(i, c4.setHex(FCOL[Math.floor(rnd(i, 5) * FCOL.length)]));
  });
  fields.castShadow = false; fields.receiveShadow = true; scene.add(fields);
  const treeSpots = [];
  for (let i = 0; treeSpots.length < 44 && i < 600; i++) {
    const x = (rnd(i, 31) - 0.5) * 5.0, z = (rnd(i, 32) - 0.5) * 2.5;
    if (keepOut(x, z, -0.06) || cells.some(([cx, cz]) => Math.abs(cx - x) < 0.18 && Math.abs(cz - z) < 0.15)) continue;
    treeSpots.push([x, z, 0.045 + rnd(i, 33) * 0.035]);
  }
  const trees = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), std(0xdfe4d2, { roughness: 0.85, flatShading: true }), treeSpots.length);
  treeSpots.forEach(([x, z, r], i) => { m4.compose(p4.set(x, r * 1.25, z), q4.setFromEuler(e4.set(0, rnd(i, 34) * 3, 0)), s4.set(r, r * 1.35, r)); trees.setMatrixAt(i, m4); });
  trees.castShadow = true; trees.receiveShadow = true; scene.add(trees);
  const pond = mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.008, 40), std(0x7d9fb8, { roughness: 0.08, metalness: 0.3 }), { cast: false });
  pond.scale.set(1.4, 1, 0.8); pond.position.set(2.25, 0.004, 0.62); scene.add(pond);

  // ----------------------------------------------------------- buildings: white model, one accent each
  const roofM = std(0xd2ccc1, { roughness: 0.8 });
  const winTex = canvasTex(128, 256, (c, w, h) => {
    c.fillStyle = '#f1eee8'; c.fillRect(0, 0, w, h);
    for (let y = 18; y < h - 10; y += 26) { c.fillStyle = '#2f4f72'; c.fillRect(8, y, w - 16, 12); c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(8, y, w - 16, 3); }
  }).tex;
  const hq = new THREE.Group(); hq.position.set(BLD[0][0], 0, BLD[0][1]); scene.add(hq);
  const tower = mesh(new THREE.BoxGeometry(0.28, 0.56, 0.26), std(0xffffff, { map: winTex, roughness: 0.6 })); tower.position.set(0.08, 0.28, -0.02); hq.add(tower);
  const wing = mesh(new THREE.BoxGeometry(0.62, 0.17, 0.34), foam); wing.position.set(-0.08, 0.085, 0.04); hq.add(wing);
  const crown = mesh(new THREE.BoxGeometry(0.3, 0.025, 0.28), std(BLUE, { roughness: 0.4, emissive: BLUE, emissiveIntensity: 0.25 })); crown.position.set(0.08, 0.572, -0.02); hq.add(crown);
  const dist = new THREE.Group(); dist.position.set(BLD[1][0], 0, BLD[1][1]); scene.add(dist);
  const wh = mesh(new THREE.BoxGeometry(0.54, 0.17, 0.3), foam); wh.position.y = 0.085; dist.add(wh);
  const whRoof = mesh(roofGeo(0.3, 0.08, 0.54), roofM); whRoof.position.y = 0.17; dist.add(whRoof);
  const dock = mesh(new THREE.BoxGeometry(0.42, 0.075, 0.01), std(SKY, { roughness: 0.5 })); dock.position.set(0, 0.04, 0.152); dist.add(dock);
  const shop = new THREE.Group(); shop.position.set(BLD[2][0], 0, BLD[2][1]); scene.add(shop);
  const sh = mesh(new THREE.BoxGeometry(0.32, 0.14, 0.22), foam); sh.position.y = 0.07; shop.add(sh);
  const shRoof = mesh(roofGeo(0.22, 0.07, 0.32), roofM); shRoof.position.y = 0.14; shop.add(shRoof);
  const awning = mesh(new THREE.BoxGeometry(0.3, 0.01, 0.09), std(SKY, { roughness: 0.6 })); awning.position.set(0, 0.105, 0.145); awning.rotation.x = 0.35; shop.add(awning);
  const farm = new THREE.Group(); farm.position.set(BLD[3][0], 0, BLD[3][1]); scene.add(farm);
  const house = mesh(new THREE.BoxGeometry(0.2, 0.13, 0.17), foam); house.position.set(-0.24, 0.065, 0.06); farm.add(house);
  const hRoof = mesh(roofGeo(0.17, 0.08, 0.2), roofM); hRoof.position.set(-0.24, 0.13, 0.06); farm.add(hRoof);
  const barn = mesh(new THREE.BoxGeometry(0.28, 0.17, 0.22), std(0xb8634b, { roughness: 0.8 })); barn.position.set(0.08, 0.085, -0.02); farm.add(barn);
  const bRoof = mesh(roofGeo(0.22, 0.1, 0.28), roofM); bRoof.position.set(0.08, 0.17, -0.02); farm.add(bRoof);
  const silo = mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.34, 28), std(0xe7e3da, { roughness: 0.5, metalness: 0.2 })); silo.position.set(0.32, 0.17, -0.04); farm.add(silo);
  const dome = mesh(new THREE.SphereGeometry(0.065, 28, 10, 0, Math.PI * 2, 0, Math.PI / 2), std(0xcfd4d8, { roughness: 0.35, metalness: 0.5 })); dome.position.set(0.32, 0.34, -0.04); farm.add(dome);
  const tops = [new THREE.Vector3(BLD[0][0] + 0.08, 0.6, BLD[0][1] - 0.02), new THREE.Vector3(BLD[1][0], 0.27, BLD[1][1]), new THREE.Vector3(BLD[2][0], 0.23, BLD[2][1]), new THREE.Vector3(BLD[3][0], 0.42, BLD[3][1])];

  // Node tags and the wait ripples at each stop.
  const tags = NODES.map((n, i) => {
    const l = label(n.name, { font: `800 56px ${SANS}`, fg: '#fff', bg: n.bg, h: 0.15, pad: 36, track: 4 });
    l.position.copy(tops[i]).add(new THREE.Vector3(0, i === 0 ? 0.24 : 0.3, 0.05)); scene.add(l); return l;
  });
  const ripM = (col) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const ripples = anchors.map((a) => { const r = new THREE.Mesh(new THREE.RingGeometry(0.13, 0.155, 48), ripM(0xffa21a)); r.rotation.x = -Math.PI / 2; r.position.set(a.x, 0.006, a.z); scene.add(r); return r; });
  const qTex = canvasTex(256, 256, (c, w) => {
    c.fillStyle = AMBER; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 6, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = `800 170px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, w / 2 + 10);
  }).tex;
  const qs = [0, 3].map((i) => {
    const q = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), new THREE.MeshBasicMaterial({ map: qTex, transparent: true, toneMapped: false, depthWrite: false }));
    const g = glow(0xffa21a, 0.6, 0, 0.35); q.add(g); g.position.z = -0.01;
    scene.add(q); return { q, g, at: tops[i].clone().add(new THREE.Vector3(i === 0 ? 0.32 : 0.44, i === 0 ? 0.25 : 0.31, 0.06)) };
  });

  // ----------------------------------------------------------- crates hopping down the chain
  const crateTex = canvasTex(64, 64, (c, w, h) => {
    c.fillStyle = '#c99d63'; c.fillRect(0, 0, w, h);
    c.fillStyle = BLUE; c.fillRect(0, h * 0.42, w, h * 0.16);
    c.strokeStyle = 'rgba(80,50,20,0.35)'; c.lineWidth = 2; c.strokeRect(1, 1, w - 2, h - 2);
  }).tex;
  const crates = new THREE.InstancedMesh(new RoundedBoxGeometry(0.075, 0.06, 0.075, 1, 0.008), std(0xffffff, { map: crateTex, roughness: 0.75 }), CN);
  crates.castShadow = true; crates.receiveShadow = true; crates.frustumCulled = false; scene.add(crates);
  const cp = new THREE.Vector3();
  // Where each crate settles beside the farm once it has made all three hops.
  const PILE = Array.from({ length: CN }, (_, i) => [((i % 3) - 1) * 0.085 - 0.03, 0.13 + Math.floor(i / 3) * 0.088]);
  const landAt = (i, j) => C0 + i * CGAP + j * (LEG + WAIT) - WAIT; // crate i arrives at node j (j >= 1)

  // ----------------------------------------------------------- Partner Portal: a glass monolith
  const clip = new THREE.Plane(new THREE.Vector3(0, 1, 0), -0.001);
  const panel = new THREE.Group(); panel.position.copy(PANEL); panel.rotation.y = 0.06; scene.add(panel);
  const pFrame = mesh(new RoundedBoxGeometry(1.15, 0.745, 0.035, 2, 0.02), std(0x101722, { roughness: 0.25, metalness: 0.6, clippingPlanes: [clip] }));
  pFrame.position.z = -0.02; panel.add(pFrame);
  const pTex = canvasTex(1024, 656);
  const pScreen = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.705), new THREE.MeshBasicMaterial({ map: pTex.tex, toneMapped: false, clippingPlanes: [clip] }));
  pScreen.position.z = 0.0; panel.add(pScreen);
  const pGlow = glow(0x5fb8ff, 2.2, 0, 0.5); pGlow.position.z = -0.12; pGlow.scale.set(2.2, 1.5, 1); panel.add(pGlow);
  const baseGlow = glow(0x7fc8ff, 1.2, 0, 0.4); baseGlow.position.set(PANEL.x, 0.03, PANEL.z + 0.05); baseGlow.scale.set(1.4, 0.25, 1); scene.add(baseGlow);
  const VOL = Array.from({ length: 12 }, (_, i) => 0.35 + 0.55 * (0.5 + 0.5 * Math.sin((i - 2) * 0.55)) * (0.75 + rnd(i, 41) * 0.25));
  const SAL = Array.from({ length: 12 }, (_, i) => 0.25 + 0.5 * (0.5 + 0.5 * Math.sin((i - 3) * 0.55)) * (0.7 + rnd(i, 42) * 0.3));
  const avg = (arr, g) => (arr[g * 3] + arr[g * 3 + 1] + arr[g * 3 + 2]) / 3;
  let pKey = '';
  const drawPanel = (t) => {
    const tabs = TABS.filter((_, i) => t > 3.55 + i * 0.16).length;
    const grow = eo(k(t, 3.7, 4.3)), mode = eio(k(t, 4.4, 4.95));
    const live = (t > 3.5 && t < 5.0);
    const key = [tabs, live ? Math.round(t * 30) : 0, t > 4.95 ? 1 : 0].join('|');
    if (key === pKey) return; pKey = key;
    pTex.redraw((c, w, h) => {
      c.fillStyle = '#f2f5f9'; c.fillRect(0, 0, w, h);
      c.fillStyle = DARK; c.fillRect(0, 0, w, 92);
      c.fillStyle = GREEN; c.fillRect(36, 74, 120, 5);
      c.fillStyle = '#fff'; c.font = `800 44px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Partner Portal', 36, 44);
      c.fillStyle = 'rgba(255,255,255,0.65)'; c.font = `700 20px ${MONO}`; c.textAlign = 'right'; c.fillText('BASF AGRICULTURE', w - 36, 46); c.textAlign = 'left';
      // Tabs: what partners gained, phase by phase.
      let x = 36;
      TABS.forEach((tb, i) => {
        const on = i < tabs, p = back(k(t, 3.55 + i * 0.16, 3.85 + i * 0.16));
        c.font = `700 27px ${SANS}`; const tw = c.measureText(tb).width;
        c.fillStyle = on ? DARK : '#b4bcc8'; c.fillText(tb, x, 128);
        if (on) { c.fillStyle = i === 0 ? BLUE : GREEN; c.fillRect(x, 150, tw * clamp(p), 4); }
        x += tw + 44;
      });
      // Sales, regrouped from months into the seasons a grower's business runs on.
      const bx = 30, by = 176, bw = w - 60, bh = h - by - 26;
      c.fillStyle = '#fff'; roundRect(c, bx, by, bw, bh, 18); c.fill();
      c.fillStyle = DARK; c.font = `800 32px ${SANS}`; c.fillText('Sales', bx + 28, by + 40);
      let mx = bx + 150; const chips = MODES.map((m) => { c.font = `700 22px ${SANS}`; const cw = c.measureText(m).width + 34; const r = [mx, cw]; mx += cw + 10; return r; });
      const sel = [lerp(chips[0][0], chips[1][0], mode), lerp(chips[0][1], chips[1][1], mode)];
      c.fillStyle = BLUE; roundRect(c, sel[0], by + 22, sel[1], 38, 19); c.fill();
      MODES.forEach((m, i) => { c.fillStyle = (i === 0 && mode < 0.5) || (i === 1 && mode >= 0.5) ? '#fff' : '#6a7484'; c.font = `700 22px ${SANS}`; c.fillText(m, chips[i][0] + 17, by + 42); });
      c.fillStyle = BLUE; c.fillRect(bx + bw - 250, by + 92, 18, 18); c.fillStyle = '#4a5464'; c.font = `700 20px ${SANS}`; c.fillText('Volume', bx + bw - 224, by + 102);
      c.fillStyle = GREEN; c.fillRect(bx + bw - 120, by + 92, 18, 18); c.fillStyle = '#4a5464'; c.fillText('Sales', bx + bw - 94, by + 102);
      const ax = bx + 40, aw = bw - 80, base = by + bh - 34, full = bh - 170;
      c.fillStyle = '#e3e8ef'; c.fillRect(ax, base + 2, aw, 2);
      const mSlot = aw / 12, sSlot = aw / 4, mw = mSlot * 0.3, sw = sSlot * 0.32;
      for (let i = 0; i < 12; i++) {
        const g = Math.floor(i / 3), j = i % 3;
        [[VOL, BLUE], [SAL, GREEN]].forEach(([arr, col], s) => {
          const xm = ax + i * mSlot + mSlot * 0.18 + s * mw * 1.1;
          const xs = ax + g * sSlot + sSlot * 0.15 + s * sw * 1.08 + j * sw / 3;
          const bwid = lerp(mw, sw / 3 + 0.6, mode), bhgt = full * lerp(arr[i], avg(arr, g), mode) * clamp(grow * 1.3 - i * 0.025);
          c.fillStyle = col; c.fillRect(lerp(xm, xs, mode), base - bhgt, bwid, bhgt);
        });
      }
    });
  };

  // Beams from the portal to BASF and both partners: the same numbers on both sides of the deal.
  const beamM = (col, o) => new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const SEG = 72, RAD = 8;
  const pFrom = new THREE.Vector3(PANEL.x, 0.27, PANEL.z + 0.03);
  const pBeams = [0, 1, 2].map((i) => {
    const b = tops[i].clone(); const ctl = pFrom.clone().lerp(b, 0.5); ctl.y = Math.max(pFrom.y, b.y) + 0.45 + (i === 0 ? 0.35 : 0);
    const cv = new THREE.QuadraticBezierCurve3(pFrom, ctl, b);
    const core = new THREE.Mesh(new THREE.TubeGeometry(cv, SEG, 0.006, RAD), beamM(0x9fd8ff, 0.95));
    const halo = new THREE.Mesh(new THREE.TubeGeometry(cv, SEG, 0.02, RAD), beamM(0x3a9cff, 0.28));
    const dot = glow(0xbfe6ff, 0.16, 0, 0.3);
    scene.add(core, halo, dot);
    return { cv, core, halo, dot };
  });

  // ----------------------------------------------------------- the direct line and the customer's phone
  const dFrom = tops[0].clone().add(new THREE.Vector3(0, 0.02, 0)), dTo = new THREE.Vector3(PHONE_AT.x, 0.86, PHONE_AT.z - 0.02);
  const dCurve = new THREE.QuadraticBezierCurve3(dFrom, new THREE.Vector3(-0.35, 2.05, 0.25), dTo);
  const dCore = new THREE.Mesh(new THREE.TubeGeometry(dCurve, 120, 0.009, RAD), beamM(0xe6ffd0, 1));
  const dHalo = new THREE.Mesh(new THREE.TubeGeometry(dCurve, 120, 0.032, RAD), beamM(0x7fd62a, 0.32));
  scene.add(dCore, dHalo);
  const head = glow(0xd8ff9a, 0.5, 0, 0.3); scene.add(head);
  const splash = glow(0x9cff4a, 1.2, 0, 0.45); splash.position.copy(dTo); scene.add(splash);

  const ph = phone({ w: 0.38, h: 0.78, d: 0.036, r: 0.05, notch: true });
  scene.add(ph);
  const PW = Math.round(1024 * ph.userData.sw / ph.userData.sh), PH = 1024;
  const pui = canvasTex(PW, PH);
  ph.userData.screen.material.map = pui.tex; ph.userData.screen.material.needsUpdate = true;
  const phGlow = glow(0x9cff4a, 1.3, 0, 0.5); phGlow.position.z = -0.08; phGlow.scale.set(1.0, 1.6, 1); ph.add(phGlow);
  const phStand = mesh(new THREE.BoxGeometry(0.16, 0.5, 0.01), std(0x24262b, { roughness: 0.6 }));
  phStand.geometry.translate(0, -0.25, 0); phStand.position.set(0, 0.0, -0.022); phStand.rotation.x = -0.55; ph.add(phStand);
  const SEGS = ['US Crop', 'P&SS', 'Seed'];
  const CARDS = ['Orders', 'Purchases', 'Sales figures', 'Regulations'];
  let uKey = '';
  const drawPhone = (t) => {
    const on = eo(k(t, 6.05, 6.35)), home = eio(k(t, 6.95, 7.3));
    const live = t > 6.0 && t < 7.9;
    const key = [on > 0 ? 1 : 0, live ? Math.round(t * 30) : 0, t > 7.9 ? 1 : 0].join('|');
    if (key === uKey) return; uKey = key;
    pui.redraw((c, w, h) => {
      c.fillStyle = '#04070d'; c.fillRect(0, 0, w, h);
      if (on <= 0) return;
      c.globalAlpha = on; c.textBaseline = 'middle';
      // Sign in once, for every business segment.
      c.save(); c.translate(-home * w, 0);
      const g = c.createLinearGradient(0, 0, 0, 420); g.addColorStop(0, DARK); g.addColorStop(1, BLUE);
      c.fillStyle = '#f2f5f9'; c.fillRect(0, 0, w, h); c.fillStyle = g; c.fillRect(0, 0, w, 420);
      c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = `700 24px ${MONO}`; c.fillText('BASF', 40, 120);
      c.fillStyle = '#fff'; c.font = `800 50px ${SANS}`; c.fillText('Customer', 40, 220); c.fillText('Portal', 40, 278);
      c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = `600 30px ${SANS}`; c.fillText('One sign-in', 40, 350);
      SEGS.forEach((s, i) => {
        const y = 470 + i * 116, p = back(k(t, 6.25 + i * 0.18, 6.5 + i * 0.18));
        c.fillStyle = '#fff'; roundRect(c, 30, y, w - 60, 94, 20); c.fill();
        c.fillStyle = DARK; c.font = `700 36px ${SANS}`; c.fillText(s, 60, y + 48);
        c.fillStyle = p > 0 ? GREEN : '#dfe4ea'; c.beginPath(); c.arc(w - 82, y + 47, 24 * (p > 0 ? p : 1), 0, 7); c.fill();
        if (p > 0.5) { c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(w - 93, y + 47); c.lineTo(w - 85, y + 56); c.lineTo(w - 70, y + 38); c.stroke(); }
      });
      const pr = Math.sin(Math.PI * k(t, 6.8, 7.0));
      c.fillStyle = BLUE; roundRect(c, 30 + pr * 6, 860 + pr * 4, w - 60 - pr * 12, 96 - pr * 8, 48); c.fill();
      c.fillStyle = '#fff'; c.font = `800 36px ${SANS}`; c.textAlign = 'center'; c.fillText('Sign in', w / 2, 908); c.textAlign = 'left';
      c.restore();
      if (home <= 0) { c.globalAlpha = 1; return; }
      // Home: orders, purchases, sales figures and regulations in one place.
      c.save(); c.translate((1 - home) * w, 0);
      c.fillStyle = '#f2f5f9'; c.fillRect(0, 0, w, h);
      c.fillStyle = BLUE; c.fillRect(0, 0, w, 190);
      c.fillStyle = GREEN; c.fillRect(40, 160, 90, 5);
      c.fillStyle = '#fff'; c.font = `800 44px ${SANS}`; c.fillText('Customer Portal', 40, 110);
      CARDS.forEach((name, i) => {
        const p = eo(k(t, 7.05 + i * 0.14, 7.45 + i * 0.14));
        if (p <= 0) return;
        const y = 218 + i * 196 + (1 - p) * 40;
        c.globalAlpha = on * p;
        c.fillStyle = '#fff'; roundRect(c, 26, y, w - 52, 176, 22); c.fill();
        c.fillStyle = [BLUE, SKY, GREEN, AMBER][i]; roundRect(c, 50, y + 26, 46, 46, 12); c.fill();
        c.fillStyle = DARK; c.font = `800 34px ${SANS}`; c.fillText(name, 114, y + 50);
        if (i === 0) [0.86, 0.6, 0.32].forEach((f, r) => { c.fillStyle = '#e6ebf1'; roundRect(c, 50, y + 98 + r * 24, w - 150, 12, 6); c.fill(); c.fillStyle = GREEN; roundRect(c, 50, y + 98 + r * 24, (w - 150) * f * p, 12, 6); c.fill(); });
        else if (i === 2) for (let b = 0; b < 8; b++) { const bh = 20 + 46 * (0.5 + 0.5 * Math.sin(b * 0.9 + 1)) * p; c.fillStyle = b % 2 ? GREEN : BLUE; c.fillRect(54 + b * 40, y + 158 - bh, 26, bh); }
        else { c.fillStyle = '#dfe4ea'; roundRect(c, 50, y + 100, w - 140, 14, 7); c.fill(); roundRect(c, 50, y + 128, (w - 140) * 0.6, 14, 7); c.fill(); }
      });
      c.restore();
      c.globalAlpha = 1;
    });
  };

  // ----------------------------------------------------------- captions (ride with the camera)
  const caps = [
    [caption('THE CHAIN', 'Sold through a chain of partners', { accent: AMBER }), 0.6, 2.95],
    [caption('PARTNER PORTAL', 'Transparency between BASF and its partners', { accent: SKY }), 3.25, 5.4],
    [caption('CUSTOMER PORTAL', 'BASF’s first direct line to its customers', { accent: GREEN }), 5.75, 8.35],
    [caption('RESULT', 'Partner Portal launched', { sub: 'First direct customer portal designed and built', accent: GREEN, h: 0.165 }), 8.45, 9.9],
  ];
  caps.forEach(([m]) => { camera.add(m); m.visible = false; });

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-2.3, 0.88, 1.8]], [1.3, [-1.45, 0.92, 2.05], (x) => x],
    [2.75, [0.2, 1.1, 2.6]], [3.7, [-0.75, 1.95, 3.4]],
    [5.3, [-0.6, 2.0, 3.5], (x) => x], [6.4, [0.45, 1.5, 3.2]],
    [7.95, [0.9, 1.2, 3.0], (x) => x], [9.1, [0.1, 2.9, 4.7]],
    [10, [0.05, 3.0, 4.85], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-1.85, 0.45, -0.2]], [1.3, [-0.95, 0.32, -0.2], (x) => x],
    [2.75, [0.8, 0.28, -0.15]], [3.7, [-0.7, 0.42, -0.45]],
    [5.3, [-0.55, 0.45, -0.45], (x) => x], [6.4, [0.95, 0.5, -0.1]],
    [7.95, [1.25, 0.28, 0.1], (x) => x], [9.1, [-0.05, 0.15, -0.2]],
    [10, [-0.05, 0.15, -0.2], (x) => x],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [2.75, 36], [5.3, 34], [7.95, 32], [9.1, 36], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Window light drifts across the model, so the shadows move the whole loop.
    key.position.set(lerp(-3.9, -2.9, t / D), 4.6, lerp(2.4, 2.9, t / D));

    // Act 1: crates hop down the chain and wait at every stop.
    for (let i = 0; i < CN; i++) {
      const tau = t - C0 - i * CGAP;
      let u = 0, hop = 0, sq = 0, pr = 0, fin = 0;
      if (tau > 0) {
        const j = Math.min(2, Math.floor(tau / (LEG + WAIT)));
        const lt = tau - j * (LEG + WAIT);
        pr = clamp(lt / LEG);
        u = lerp(NODE_T[j], NODE_T[j + 1], eio(pr));
        hop = Math.sin(Math.PI * pr) * 0.13;
        const since = lt - LEG; sq = since > 0 && since < 0.25 ? Math.sin(since / 0.25 * Math.PI) * (1 - since / 0.25) : 0;
        if (j === 2) fin = eio(pr); // the last hop lands on the pile, not on the road
      }
      curve.getPoint(u, cp);
      const side = (i % 3 - 1) * 0.04 * (1 - fin), queue = (i % 2) * 0.03 * (1 - fin);
      const px = cp.x - queue + PILE[i][0] * fin, pz = cp.z + side + PILE[i][1] * fin;
      const s = tau > -0.3 ? eo(k(tau, -0.3, 0)) : 0;
      const tilt = pr > 0 && pr < 1 ? Math.sin(Math.PI * 2 * pr) * 0.18 : 0;
      m4.compose(p4.set(px, 0.03 + hop, pz), q4.setFromEuler(e4.set(0, rnd(i, 51) * 0.6 - 0.3, -tilt)), s4.set(s * (1 + sq * 0.12), Math.max(0.001, s * (1 - sq * 0.16)), s * (1 + sq * 0.12)));
      crates.setMatrixAt(i, m4);
    }
    crates.instanceMatrix.needsUpdate = true;
    ripples.forEach((r, j) => {
      if (j === 0) { r.visible = false; return; }
      let last = -9;
      for (let i = 0; i < CN; i++) { const la = landAt(i, j); if (la <= t && la > last) last = la; }
      const e = k(t, last, last + 0.7);
      r.visible = last > 0 && e < 1;
      r.scale.setScalar(0.6 + eo(e) * 1.1);
      r.material.opacity = 0.9 * (1 - e) * (1 - k(t, 4.0, 4.4));
    });
    qs.forEach(({ q, g, at }, i) => {
      const a = back(k(t, 1.0 + i * 0.35, 1.4 + i * 0.35)), o = 1 - ei(k(t, 3.0, 3.4));
      q.position.copy(at); q.position.y += Math.sin(t * 2.4 + i) * 0.015;
      q.lookAt(camera.position);
      q.scale.setScalar(Math.max(0.001, a * (1 + 0.06 * Math.sin(t * 5 + i))));
      q.material.opacity = clamp(a) * o; g.material.opacity = 0.5 * clamp(a) * o;
      q.visible = a > 0.01 && o > 0.01;
    });
    tags.forEach((l, i) => {
      l.lookAt(camera.position);
      const a = eo(k(t, 0.35 + i * 0.15, 0.75 + i * 0.15));
      l.material.opacity = a; l.visible = a > 0.01;
      l.scale.setScalar(i === 3 ? 1 + 0.12 * Math.sin(Math.PI * k(t, 6.45, 6.85)) : 1);
    });

    // Act 2: the Partner Portal rises from the model and wires everyone to the same numbers.
    const rise = back(k(t, 3.25, 4.0));
    panel.position.y = lerp(-0.42, PANEL.y, rise);
    panel.visible = t > 3.2;
    drawPanel(t);
    pGlow.material.opacity = 0.32 * clamp(rise);
    baseGlow.material.opacity = 0.5 * Math.sin(Math.PI * k(t, 3.25, 4.4)) + 0.18 * clamp(rise);
    panelLight.position.set(PANEL.x, PANEL.y, PANEL.z + 0.4);
    panelLight.intensity = 2.2 * clamp(rise);
    pBeams.forEach(({ cv, core, halo, dot }, i) => {
      const r = eio(k(t, 3.9 + i * 0.14, 4.5 + i * 0.14));
      const n = Math.floor(r * SEG) * RAD * 6;
      core.geometry.setDrawRange(0, n); halo.geometry.setDrawRange(0, n);
      core.visible = halo.visible = n > 0;
      // A packet of light runs out and back: both sides of the deal see it.
      const ph2 = (t * 0.55 + i * 0.33) % 1, tri = ph2 < 0.5 ? ph2 * 2 : 2 - ph2 * 2;
      cv.getPoint(eio(tri), dot.position);
      dot.material.opacity = r >= 1 ? 0.95 : 0;
      halo.material.opacity = 0.28 * (0.75 + 0.25 * Math.sin(t * 4 + i));
    });

    // Act 3: a beam arcs straight from BASF to the customer and the phone drops onto the model.
    const beam = eio(k(t, 5.55, 6.35));
    const nB = Math.floor(beam * 120) * RAD * 6;
    dCore.geometry.setDrawRange(0, nB); dHalo.geometry.setDrawRange(0, nB);
    dCore.visible = dHalo.visible = nB > 0;
    dHalo.material.opacity = 0.32 * (0.8 + 0.2 * Math.sin(t * 5));
    // While it draws, the head leads the beam; after that, packets keep flowing BASF -> customer.
    const after = t > 6.35 ? ((t - 6.35) * 0.55) % 1 : 0;
    dCurve.getPoint(beam < 1 ? beam : after, head.position);
    const hO = beam <= 0 ? 0 : beam < 1 ? 1 : Math.sin(Math.PI * after);
    head.material.opacity = 0.95 * hO;
    pulseLight.position.copy(head.position); pulseLight.intensity = 2.4 * hO;
    const hit = k(t, 6.32, 6.9);
    splash.material.opacity = hit > 0 ? 0.9 * (1 - eo(hit)) + 0.25 : 0;
    splash.scale.setScalar(0.6 + eo(hit) * 0.9);

    // Drop: falls in, one small bounce, and the turn settles with a spring.
    const fall = ei(k(t, 5.8, 6.15)), bounce = Math.sin(Math.PI * k(t, 6.15, 6.42)) * 0.045;
    const settle = spring(k(t, 5.8, 6.7));
    const lean = -0.14;
    ph.position.set(PHONE_AT.x, 0.39 * Math.cos(lean) + 0.005 + (1 - fall) * 1.3 + bounce, PHONE_AT.z);
    ph.rotation.set(lean, -0.22 + (1 - settle) * 0.5, 0);
    ph.visible = t > 5.75;
    ph.userData.sheen.position.x = Math.sin(t * 0.7) * 0.04;
    drawPhone(t);
    ph.userData.screen.material.color.setScalar(lerp(0.05, 0.92, eo(k(t, 6.0, 6.35))));
    phGlow.material.opacity = 0.35 * eo(k(t, 6.1, 6.8));

    // Captions.
    caps.forEach(([m, a, b], i) => {
      const o = eo(k(t, a, a + 0.35)) * (1 - ei(k(t, b - 0.3, b)));
      m.visible = o > 0.01;
      m.material.opacity = o;
      m.position.set(0, -0.33 + (1 - o) * -0.02 + (i === 3 ? 0.02 : 0), -1.6);
    });
  }

  return { scene, camera, update, duration: D, poster: 8.0 };
}
