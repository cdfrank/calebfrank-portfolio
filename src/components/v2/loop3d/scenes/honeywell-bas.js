// Honeywell Building Automation site proposal lit loop, 10 s. "A phased plan, built floor by floor."
// An architect's studio high over a city at night. On a plinth over a blueprint, the proposal is
// assembled as an exploded axonometric building: each phase is a floor that drops into place and
// lights up. Phase 1, architecture: the sitemap rises as rooms. Phase 2, dashboards: a gauge sweeps
// and bars climb. Phase 3, the API marketplace: tiles pop up and outside services plug in. Phase 4,
// mobile commerce: a phone rises off the roof and a product drops into the cart. The timeline rail
// fills as each phase lands; then the whole building and the city light up and the title block appears.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, phone, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const PH = [
  { n: 'PHASE 1', t: 'Architecture', c: '#5fd3ff' },
  { n: 'PHASE 2', t: 'Dashboards', c: '#ffb547' },
  { n: 'PHASE 3', t: 'API marketplace', c: '#a092ff' },
  { n: 'PHASE 4', t: 'Mobile commerce', c: '#ff5468' },
];
const LAND = [0.55, 2.55, 4.55, 6.55];       // each floor lands
const PAY = 8.3;                              // everything lights
const FW = 1.2, FD = 0.8, FT = 0.035, GAP = 0.34, Y0 = 0.25, BX = -0.3, PLH = 0.18;
const PW = FW - 0.04, PD = FD - 0.04;         // plan plate
const fy = (i) => Y0 + i * GAP;
const TAGX = 0.74;
const MONO = '"JetBrains Mono", monospace', SANS = 'Inter, system-ui, sans-serif';
// Phase 1 sitemap: root, three sections, three pages under each [x, z, w, d, h, appear].
const TREE = [[0, -0.24, 0.2, 0.1, 0.07, 0.95]];
[-0.36, 0, 0.36].forEach((x, j) => TREE.push([x, -0.02, 0.15, 0.08, 0.05, 1.22 + j * 0.08]));
[-0.36, 0, 0.36].forEach((x, j) => [-0.12, 0, 0.12].forEach((dx, q) => TREE.push([x + dx, 0.2, 0.075, 0.07, 0.035, 1.55 + (j * 3 + q) * 0.04])));
const BARS = [0.1, 0.16, 0.12, 0.2, 0.15, 0.24, 0.19];
const TILES = [];
[-0.12, 0.12].forEach((z) => [-0.44, -0.22, 0].forEach((x) => TILES.push([x, z])));
const NODES = [[-0.95, 0.1, -0.15], [-0.8, 0.22, 0.32], [-0.36, 0.18, -0.62], [0.18, 0.24, -0.6]];
const PLUG = [0, 3, 1, 2];                    // which tile each outside service plugs into

const hex = (s) => new THREE.Color(s);
const px = (x, w) => (x / PW + 0.5) * w;
const pz = (z, h) => (z / PD + 0.5) * h;
function fitFont(c, text, weight, size, family, maxW) {
  let s = size;
  c.font = `${weight} ${s}px ${family}`;
  while (s > 10 && c.measureText(text).width > maxW) { s -= 2; c.font = `${weight} ${s}px ${family}`; }
  return s;
}
// Shared drafting base for every floor plate: faint grid, outline, corner ticks, a dimension line.
function planBase(c, w, h, col) {
  c.clearRect(0, 0, w, h);
  c.strokeStyle = col; c.globalAlpha = 0.12; c.lineWidth = 1.5;
  for (let x = 32; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
  for (let y = 32; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  c.globalAlpha = 0.55; c.lineWidth = 3; c.strokeRect(14, 14, w - 28, h - 28);
  c.globalAlpha = 0.9; c.lineWidth = 5;
  [[14, 14, 1, 1], [w - 14, 14, -1, 1], [14, h - 14, 1, -1], [w - 14, h - 14, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x + sx * 40, y); c.lineTo(x, y); c.lineTo(x, y + sy * 40); c.stroke(); });
  c.globalAlpha = 0.4; c.lineWidth = 2;
  c.beginPath(); c.moveTo(60, h - 40); c.lineTo(w - 60, h - 40); c.stroke();
  for (let x = 60; x <= w - 60; x += (w - 120) / 8) { c.beginPath(); c.moveTo(x, h - 48); c.lineTo(x, h - 32); c.stroke(); }
  c.globalAlpha = 1;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070b18);
  scene.fog = new THREE.Fog(0x0a1022, 7, 30);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the city beyond the studio window
  scene.add(skyDome([[0, '#03050c'], [0.36, '#0a1230'], [0.48, '#1d2552'], [0.52, '#2d2444'], [0.56, '#0c0e1c'], [1, '#05060a']]));
  const winTex = canvasTex(128, 256, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < 22; y++) for (let x = 0; x < 8; x++) {
      const r = rnd(x * 31 + y, 7);
      if (r > 0.45) { c.fillStyle = r > 0.85 ? 'rgba(170,205,255,0.9)' : `rgba(255,${190 + Math.floor(rnd(x, y) * 40)},130,${(0.5 + r * 0.5).toFixed(2)})`; c.fillRect(6 + x * 15, 6 + y * 11, 8, 6); }
    }
  }).tex;
  const cityM = std(0x0a0f1e, { emissive: 0xffc685, emissiveMap: winTex, emissiveIntensity: 0.4, roughness: 0.7 });
  const CN = 48;
  const city = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), cityM, CN);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3();
  for (let i = 0; i < CN; i++) {
    const x = -16 + (i / CN) * 32 + (rnd(i, 1) - 0.5) * 0.8, z = -10 - rnd(i, 2) * 12;
    m4.compose(p4.set(x, -4, z), q4.setFromAxisAngle(new THREE.Vector3(0, 1, 0), (rnd(i, 4) - 0.5) * 0.5), s4.set(0.8 + rnd(i, 3) * 1.6, 3 + rnd(i, 5) * 7 + (Math.abs(x) < 5 ? 1.5 : 0), 0.8 + rnd(i, 6) * 1.2));
    city.setMatrixAt(i, m4);
  }
  city.castShadow = false; city.receiveShadow = false; scene.add(city);
  // Out-of-focus lights between the glass and the city.
  const bokTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.55, 'rgba(255,255,255,0.55)'); g.addColorStop(0.7, 'rgba(255,255,255,0.1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const BKN = 70, bk = new Float32Array(BKN * 3), bkc = new Float32Array(BKN * 3);
  for (let i = 0; i < BKN; i++) {
    bk.set([(rnd(i, 11) - 0.5) * 14, -0.6 + rnd(i, 12) * 3.2, -6 - rnd(i, 13) * 3], i * 3);
    const warm = rnd(i, 14) > 0.35; bkc.set(warm ? [1, 0.72, 0.42] : [0.5, 0.65, 1], i * 3);
  }
  const bkGeo = new THREE.BufferGeometry(); bkGeo.setAttribute('position', new THREE.BufferAttribute(bk, 3)); bkGeo.setAttribute('color', new THREE.BufferAttribute(bkc, 3));
  const bokeh = new THREE.Points(bkGeo, new THREE.PointsMaterial({ map: bokTex, size: 0.32, vertexColors: true, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  scene.add(bokeh);
  // Window mullions and sill: they frame the city and give the dark a sense of a room.
  const mull = mergeGeometries([-3.4, -1.15, 1.15, 3.4].map((x) => new THREE.BoxGeometry(0.09, 5, 0.09).translate(x, 1.5, -4.2)).concat([new THREE.BoxGeometry(9, 0.08, 0.3).translate(0, -0.35, -4.15), new THREE.BoxGeometry(9, 0.07, 0.09).translate(0, 2.6, -4.2)]));
  scene.add(mesh(mull, std(0x0b0d14, { roughness: 0.6, metalness: 0.4 }), { cast: false }));

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x41528a, 0x0a0806, 0.32));
  const key = new THREE.SpotLight(0xdfe8ff, 0, 0, 0.55, 0.7, 1.3);
  key.position.set(-1.6, 3.6, 2.4); key.target.position.set(BX + 0.2, 0.7, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 9; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xffb070, 1.6); rim.position.set(2.5, 1.8, -3); scene.add(rim);
  const phaseL = new THREE.PointLight(0xffffff, 0, 1.5, 1.5); scene.add(phaseL);

  // ----------------------------------------------------------- table, blueprint, plinth, rail
  const table = mesh(new THREE.PlaneGeometry(10, 7), std(0xffffff, { map: grainTex('#1d1510', { size: 512, speck: 0.07, blot: 0.12, seed: 31, repeat: 4 }), roughness: 0.55 }), { cast: false });
  table.rotation.x = -Math.PI / 2; table.position.z = 0.6; scene.add(table);
  const bp = canvasTex(1024, 688, (c, w, h) => {
    c.fillStyle = '#0f2a5c'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { c.strokeStyle = x % 160 ? 'rgba(170,200,255,0.1)' : 'rgba(170,200,255,0.22)'; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += 32) { c.strokeStyle = y % 160 ? 'rgba(170,200,255,0.1)' : 'rgba(170,200,255,0.22)'; c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(220,235,255,0.55)'; c.lineWidth = 3; c.strokeRect(24, 24, w - 48, h - 48);
    c.strokeRect(w - 300, h - 140, 276, 116); c.beginPath(); c.moveTo(w - 300, h - 90); c.lineTo(w - 24, h - 90); c.moveTo(w - 160, h - 90); c.lineTo(w - 160, h - 24); c.stroke();
    c.lineWidth = 2; c.setLineDash([12, 8]); c.strokeRect(150, 120, w - 300, h - 240); c.setLineDash([]);
    c.beginPath(); c.arc(140, h - 120, 46, 0, 7); c.moveTo(140, h - 180); c.lineTo(140, h - 60); c.moveTo(80, h - 120); c.lineTo(200, h - 120); c.stroke();
  }).tex;
  const sheet = mesh(new THREE.PlaneGeometry(2.9, 1.95).rotateX(-Math.PI / 2), std(0xffffff, { map: bp, roughness: 0.85 }), { cast: false });
  sheet.position.set(BX + 0.25, 0.002, 0.05); sheet.rotation.y = 0.05; scene.add(sheet);
  const plinth = mesh(new RoundedBoxGeometry(1.9, PLH, 1.25, 3, 0.02), std(0xffffff, { map: grainTex('#25282f', { size: 256, speck: 0.1, blot: 0.1, seed: 32, repeat: 2 }), roughness: 0.75 }));
  plinth.position.set(BX + 0.15, PLH / 2, 0); scene.add(plinth);
  // Drafting props: an architect's scale and a pencil.
  const scaleR = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 3).rotateZ(Math.PI / 2), std(0x7f8590, { roughness: 0.5 }));
  scaleR.position.set(-1.45, 0.03, 0.75); scaleR.rotation.y = 0.35; scene.add(scaleR);
  const pencil = mesh(mergeGeometries([new THREE.CylinderGeometry(0.009, 0.009, 0.42, 6), new THREE.ConeGeometry(0.009, 0.04, 6).translate(0, 0.23, 0)]).rotateZ(Math.PI / 2), std(0xb98a2a, { roughness: 0.6 }));
  pencil.position.set(1.05, 0.01, 0.8); pencil.rotation.y = 0.7; scene.add(pencil);
  // Timeline rail on the plinth's front edge, the approved progress bar.
  const RAIL = 1.5, RX0 = BX + 0.15 - RAIL / 2, RZ = 0.54;
  const groove = mesh(new THREE.BoxGeometry(RAIL + 0.04, 0.006, 0.034), std(0x0b0d12, { roughness: 0.5 }), { cast: false });
  groove.position.set(RX0 + RAIL / 2, PLH + 0.002, RZ); scene.add(groove);
  const fill = new THREE.Mesh(new THREE.BoxGeometry(RAIL, 0.008, 0.016).translate(RAIL / 2, 0, 0), new THREE.MeshBasicMaterial({ color: 0xffe1b0, toneMapped: false }));
  fill.position.set(RX0, PLH + 0.004, RZ); scene.add(fill);
  const head = glow(0xffd08a, 0.3, 0.8, 0.3); scene.add(head);
  const marks = new THREE.InstancedMesh(new THREE.SphereGeometry(0.014, 12, 8), new THREE.MeshBasicMaterial({ toneMapped: false }), 4);
  for (let i = 0; i < 4; i++) { m4.makeTranslation(RX0 + RAIL * (i + 1) / 4 - 0.012, PLH + 0.012, RZ); marks.setMatrixAt(i, m4); marks.setColorAt(i, hex('#2a3048')); }
  scene.add(marks);

  // ----------------------------------------------------------- floors
  const planTex = PH.map(() => canvasTex(1024, 672));
  const floors = PH.map((ph, i) => {
    const g = new THREE.Group(); g.position.set(BX, fy(i), 0); scene.add(g);
    const slabM = std(0x101a30, { roughness: 0.18, metalness: 0.6, transparent: true, opacity: 0 });
    const slab = mesh(new RoundedBoxGeometry(FW, FT, FD, 2, 0.01), slabM); g.add(slab);
    const planM = new THREE.MeshBasicMaterial({ map: planTex[i].tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const plan = new THREE.Mesh(new THREE.PlaneGeometry(PW, PD).rotateX(-Math.PI / 2), planM); plan.position.y = FT / 2 + 0.001; g.add(plan);
    const e = 0.008, fx = FW / 2, fz = FD / 2;
    const frameGeo = mergeGeometries([
      new THREE.BoxGeometry(FW + e, e, e).translate(0, FT / 2, fz), new THREE.BoxGeometry(FW + e, e, e).translate(0, FT / 2, -fz),
      new THREE.BoxGeometry(e, e, FD + e).translate(fx, FT / 2, 0), new THREE.BoxGeometry(e, e, FD + e).translate(-fx, FT / 2, 0),
    ]);
    const frameM = new THREE.MeshBasicMaterial({ color: hex(ph.c), transparent: true, opacity: 0, toneMapped: false });
    g.add(new THREE.Mesh(frameGeo, frameM));
    return { g, slabM, planM, frameM };
  });
  // Corner guides between the plinth and each floor, and between floors.
  const COLS = 16;
  const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.005, 0.005, 1, 6).translate(0, 0.5, 0), new THREE.MeshBasicMaterial({ color: 0x8fa6d8, transparent: true, opacity: 0.55, toneMapped: false }), COLS);
  cols.frustumCulled = false; scene.add(cols);
  const CORN = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [BX + sx * (FW / 2 - 0.03), sz * (FD / 2 - 0.03)]);

  // Phase 1: the sitemap rises as rooms.
  const blocks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1).translate(0, 0.5, 0), std(0x23506a, { emissive: 0x5fd3ff, emissiveIntensity: 0.3, roughness: 0.3, metalness: 0.3 }), TREE.length);
  blocks.castShadow = true; blocks.receiveShadow = true; blocks.frustumCulled = false; floors[0].g.add(blocks);
  // Phase 2: a gauge that sweeps and bars that climb.
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.045, 1, 0.045).translate(0, 0.5, 0), std(0x6a4a1a, { emissive: 0xffb547, emissiveIntensity: 0.55, roughness: 0.35 }), BARS.length);
  bars.castShadow = true; bars.frustumCulled = false; floors[1].g.add(bars);
  const gauge = new THREE.Group(); gauge.position.set(-0.3, FT / 2 + 0.015, -0.02); floors[1].g.add(gauge);
  gauge.add(new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.009, 8, 48, Math.PI), new THREE.MeshBasicMaterial({ color: 0x3a3320, toneMapped: false })));
  class Arc extends THREE.Curve { getPoint(u, out = new THREE.Vector3()) { const a = Math.PI * (1 - u); return out.set(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.002); } }
  const arcGeo = new THREE.TubeGeometry(new Arc(), 48, 0.013, 8, false);
  gauge.add(new THREE.Mesh(arcGeo, new THREE.MeshBasicMaterial({ color: 0xffb547, toneMapped: false })));
  const needle = new THREE.Group(); needle.position.z = 0.01; gauge.add(needle);
  needle.add(mesh(new THREE.BoxGeometry(0.13, 0.008, 0.006).translate(0.065, 0, 0), std(0xf2f4f8, { roughness: 0.3, metalness: 0.4 })));
  needle.add(mesh(new THREE.SphereGeometry(0.016, 16, 10), std(0x2a2f3a, { roughness: 0.3, metalness: 0.8 })));
  // Phase 3: marketplace tiles, and outside services that plug in.
  const tiles = new THREE.InstancedMesh(new RoundedBoxGeometry(0.17, 0.035, 0.17, 2, 0.012), std(0xffffff, { roughness: 0.25, metalness: 0.2, emissive: 0x2a2060, emissiveIntensity: 0.5 }), TILES.length);
  TILES.forEach((_, i) => tiles.setColorAt(i, i === 3 ? hex('#a092ff') : hex('#2e3350')));
  tiles.castShadow = true; tiles.frustumCulled = false; floors[2].g.add(tiles);
  const nodes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.03, 1), std(0x3a3080, { emissive: 0xa092ff, emissiveIntensity: 0.9, roughness: 0.3 }), NODES.length);
  nodes.frustumCulled = false; floors[2].g.add(nodes);
  const links = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 6), new THREE.MeshBasicMaterial({ color: 0xb6abff, toneMapped: false }), NODES.length);
  links.frustumCulled = false; floors[2].g.add(links);
  const nodeGlows = NODES.map((n) => { const s = glow(0xa092ff, 0.22, 0, 0.3); s.position.set(...n); floors[2].g.add(s); return s; });
  const pulses = NODES.map(() => { const s = glow(0xe0dbff, 0.09, 0, 0.2); floors[2].g.add(s); return s; });
  const plugFrom = NODES.map((n) => new THREE.Vector3(...n));
  const plugTo = PLUG.map((ti) => new THREE.Vector3(TILES[ti][0], FT / 2 + 0.035, TILES[ti][1]));
  // Phase 4: a phone rises off the roof with the store on it.
  const ph = phone({ w: 0.74, h: 1.52 });
  ph.rotation.order = 'YXZ';
  floors[3].g.add(ph);
  const SW = 512, SH = Math.round(512 * ph.userData.sh / ph.userData.sw);
  const ui = canvasTex(SW, SH);
  ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.color.setScalar(0.85); ph.userData.screen.material.needsUpdate = true;
  const roofRing = glow(0xff5468, 0.7, 0, 0.45); roofRing.position.set(0.05, FT / 2 + 0.02, 0.04); roofRing.scale.set(0.7, 0.25, 1); floors[3].g.add(roofRing);
  const beacon = glow(0xff5468, 0.35, 0, 0.2); scene.add(beacon);

  // ----------------------------------------------------------- floor plans (canvas)
  const p3drawn = () => planTex[2].redraw((c, w, h) => {
    planBase(c, w, h, PH[2].c);
    c.strokeStyle = PH[2].c; c.lineWidth = 3; c.globalAlpha = 0.85;
    TILES.forEach(([x, z]) => { roundRect(c, px(x, w) - 52, pz(z, h) - 52, 104, 104, 14); c.stroke(); });
    c.globalAlpha = 1; c.fillStyle = PH[2].c; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 92px ${MONO}`; c.fillText('{ } API', px(0.33, w), pz(-0.06, h));
    fitFont(c, 'API marketplace', 700, 34, MONO, 300); c.globalAlpha = 0.8; c.fillText('API marketplace', px(0.33, w), pz(0.12, h));
    c.globalAlpha = 1; c.textAlign = 'left';
  });
  const p4drawn = () => planTex[3].redraw((c, w, h) => {
    planBase(c, w, h, PH[3].c);
    c.strokeStyle = PH[3].c; c.lineWidth = 3;
    c.globalAlpha = 0.8; c.beginPath(); c.arc(px(0.05, w), pz(0.04, h), 120, 0, 7); c.stroke();
    c.globalAlpha = 0.45; c.beginPath(); c.arc(px(0.05, w), pz(0.04, h), 160, 0, 7); c.stroke();
    c.globalAlpha = 0.6; [[-0.42, -0.22], [0.42, -0.22], [-0.42, 0.24], [0.42, 0.24]].forEach(([x, z]) => c.strokeRect(px(x, w) - 50, pz(z, h) - 34, 100, 68));
    c.globalAlpha = 1;
  });
  p3drawn(); p4drawn();
  let k1 = '', k2 = '', kP = '';
  const drawP1 = (t) => {
    const key = t < 0.9 ? 'a' : t > 2.15 ? 'z' : String(Math.round(t * 30));
    if (key === k1) return; k1 = key;
    planTex[0].redraw((c, w, h) => {
      planBase(c, w, h, PH[0].c);
      c.strokeStyle = PH[0].c; c.lineWidth = 4; c.lineCap = 'round';
      const seg = (x0, y0, x1, y1, a) => { const p = eo(k(t, a, a + 0.18)); if (p <= 0) return; c.beginPath(); c.moveTo(px(x0, w), pz(y0, h)); c.lineTo(px(lerp(x0, x1, p), w), pz(lerp(y0, y1, p), h)); c.stroke(); };
      seg(0, -0.19, 0, -0.12, 1.05); seg(0, -0.12, -0.36, -0.12, 1.12); seg(0, -0.12, 0.36, -0.12, 1.12);
      [-0.36, 0, 0.36].forEach((x, j) => {
        seg(x, -0.12, x, -0.06, 1.2 + j * 0.06);
        seg(x, 0.02, x, 0.1, 1.45 + j * 0.05); seg(x, 0.1, x - 0.12, 0.1, 1.5 + j * 0.05); seg(x, 0.1, x + 0.12, 0.1, 1.5 + j * 0.05);
        [-0.12, 0, 0.12].forEach((dx) => seg(x + dx, 0.1, x + dx, 0.165, 1.56 + j * 0.05));
      });
      c.lineWidth = 2.5;
      TREE.forEach(([x, z, bw, bd, , a]) => { const p = eo(k(t, a - 0.1, a + 0.15)); if (p <= 0) return; c.globalAlpha = p; c.strokeRect(px(x - bw / 2 - 0.012, w), pz(z - bd / 2 - 0.012, h), (bw + 0.024) / PW * w, (bd + 0.024) / PD * h); });
      c.globalAlpha = 1;
    });
  };
  const drawP2 = (t) => {
    const key = t < 2.9 ? 'a' : t > 4.2 ? 'z' : String(Math.round(t * 30));
    if (key === k2) return; k2 = key;
    planTex[1].redraw((c, w, h) => {
      planBase(c, w, h, PH[1].c);
      c.strokeStyle = PH[1].c; c.lineWidth = 3;
      c.globalAlpha = 0.6; c.strokeRect(px(-0.52, w), pz(-0.2, h), 0.44 / PW * w, 0.3 / PD * h);
      c.beginPath(); c.moveTo(px(0.02, w), pz(0.14, h)); c.lineTo(px(0.54, w), pz(0.14, h)); c.stroke();
      // Trend line across the back strip.
      const p = eo(k(t, 3.1, 4.1));
      c.globalAlpha = 1; c.lineWidth = 4; c.beginPath();
      for (let i = 0; i <= 40 * p; i++) { const x = -0.52 + (i / 40) * 1.04, z = -0.3 + Math.sin(i * 0.45) * 0.025 - i * 0.0012; if (i === 0) c.moveTo(px(x, w), pz(z, h)); else c.lineTo(px(x, w), pz(z, h)); }
      c.stroke();
      [0, 1, 2].forEach((q) => { const on = eo(k(t, 3.2 + q * 0.25, 3.5 + q * 0.25)); c.globalAlpha = 0.25 + 0.5 * on; c.fillStyle = PH[1].c; roundRect(c, px(-0.52 + q * 0.36, w), pz(0.22, h), 0.3 / PW * w, 0.1 / PD * h, 10); c.fill(); });
      c.globalAlpha = 1;
    });
  };
  // Phone store screen.
  const drawUI = (t) => {
    const live = t > 6.85 && t < 8.4;
    const key = live ? String(Math.round(t * 30)) : t <= 6.85 ? 'a' : 'z';
    if (key === kP) return; kP = key;
    ui.redraw((c, w, h) => {
      c.fillStyle = '#0b1020'; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(255,255,255,0.5)'; [w - 90, w - 66, w - 42].forEach((x) => { c.beginPath(); c.arc(x, 52, 6, 0, 7); c.fill(); });
      c.fillStyle = '#eef2ff'; c.textBaseline = 'middle'; fitFont(c, 'Mobile commerce', 800, 44, SANS, w - 150); c.fillText('Mobile commerce', 36, 128);
      // Cart icon, with the badge that pops when the item lands.
      const cx = w - 64, cy = 128;
      c.strokeStyle = '#eef2ff'; c.lineWidth = 5; c.lineJoin = 'round';
      c.beginPath(); c.moveTo(cx - 30, cy - 18); c.lineTo(cx - 20, cy - 18); c.lineTo(cx - 12, cy + 10); c.lineTo(cx + 22, cy + 10); c.lineTo(cx + 28, cy - 10); c.lineTo(cx - 16, cy - 10); c.stroke();
      c.fillStyle = '#eef2ff'; [cx - 8, cx + 18].forEach((x) => { c.beginPath(); c.arc(x, cy + 22, 5, 0, 7); c.fill(); });
      const badge = back(k(t, 8.05, 8.4));
      if (badge > 0) { c.fillStyle = '#e4002b'; c.beginPath(); c.arc(cx + 24, cy - 26, 15 * badge, 0, 7); c.fill(); }
      // Product card with a round thermostat-style device.
      const enter = eo(k(t, 7.0, 7.45));
      c.save(); c.globalAlpha = enter; c.translate(0, (1 - enter) * 40);
      c.fillStyle = '#151c33'; roundRect(c, 32, 190, w - 64, 470, 28); c.fill();
      const dx = w / 2, dy = 420;
      const gr = c.createLinearGradient(dx - 150, dy - 150, dx + 150, dy + 150); gr.addColorStop(0, '#ff5468'); gr.addColorStop(1, '#ffb547');
      c.strokeStyle = gr; c.lineWidth = 22; c.beginPath(); c.arc(dx, dy, 140, 0.75 * Math.PI, 0.75 * Math.PI + 1.5 * Math.PI * eo(k(t, 7.2, 7.8))); c.stroke();
      c.fillStyle = '#0b1020'; c.beginPath(); c.arc(dx, dy, 112, 0, 7); c.fill();
      const rg = c.createRadialGradient(dx, dy, 10, dx, dy, 100); rg.addColorStop(0, 'rgba(255,180,120,0.5)'); rg.addColorStop(1, 'rgba(255,180,120,0)');
      c.fillStyle = rg; c.beginPath(); c.arc(dx, dy, 100, 0, 7); c.fill();
      c.fillStyle = '#2a3456'; roundRect(c, 32, 690, 300, 28, 14); c.fill();
      c.fillStyle = '#222b48'; roundRect(c, 32, 734, 200, 24, 12); c.fill();
      c.fillStyle = '#ff5468'; roundRect(c, 32, 784, 150, 36, 18); c.fill();
      c.strokeStyle = 'rgba(238,242,255,0.35)'; c.lineWidth = 3; roundRect(c, w - 200, 780, 168, 46, 23); c.stroke();
      c.restore();
      // Add-to-cart button: pressed, and the product flies into the cart.
      const press = Math.sin(Math.PI * k(t, 7.7, 7.9));
      const bw = (w - 64) * (1 - press * 0.05), bh = 96 * (1 - press * 0.08);
      c.globalAlpha = eo(k(t, 7.2, 7.5));
      c.fillStyle = '#e4002b'; roundRect(c, w / 2 - bw / 2, 960 + (96 - bh) / 2, bw, bh, bh / 2); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 6; const bx = w / 2, by = 1008;
      c.beginPath(); c.moveTo(bx - 34, by - 16); c.lineTo(bx - 24, by - 16); c.lineTo(bx - 16, by + 10); c.lineTo(bx + 18, by + 10); c.lineTo(bx + 24, by - 8); c.lineTo(bx - 18, by - 8); c.stroke();
      c.globalAlpha = 1;
      const fly = k(t, 7.8, 8.1);
      if (fly > 0 && fly < 1) {
        const e = eio(fly), fx = lerp(dx, cx, e), fy2 = lerp(dy, cy, e) - Math.sin(Math.PI * e) * 120;
        c.fillStyle = '#ffb547'; c.beginPath(); c.arc(fx, fy2, lerp(70, 12, e), 0, 7); c.fill();
      }
    });
  };

  // ----------------------------------------------------------- phase tags and the title
  const tags = PH.map((p, i) => {
    const tex = canvasTex(620, 200, (c, w, h) => {
      c.fillStyle = 'rgba(8,12,26,0.82)'; roundRect(c, 2, 2, w - 4, h - 4, 18); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.12)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = p.c; roundRect(c, 2, 2, 12, h - 4, 6); c.fill();
      c.textBaseline = 'middle'; c.fillStyle = p.c; c.font = `700 30px ${MONO}`; if ('letterSpacing' in c) c.letterSpacing = '4px'; c.fillText(p.n, 40, 58);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = '#eef2ff'; fitFont(c, p.t, 800, 58, SANS, w - 70); c.fillText(p.t, 40, 136);
    }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.2), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
    m.position.set(TAGX, fy(i) + 0.1, 0.12); m.renderOrder = 4; scene.add(m);
    return m;
  });
  const leaders = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.0035, 0.0035, 1, 6), new THREE.MeshBasicMaterial({ toneMapped: false }), 4);
  PH.forEach((p, i) => leaders.setColorAt(i, hex(p.c)));
  leaders.frustumCulled = false; scene.add(leaders);
  const titleTex = canvasTex(1024, 300, (c, w) => {
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.shadowColor = 'rgba(0,0,0,0.7)'; c.shadowBlur = 22;
    c.fillStyle = '#ff5468'; c.font = `700 32px ${MONO}`; if ('letterSpacing' in c) c.letterSpacing = '10px'; c.fillText('HONEYWELL', w / 2, 52);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#f2f5ff'; fitFont(c, 'Building Automation', 800, 96, SANS, w - 60); c.fillText('Building Automation', w / 2, 170);
    c.fillStyle = 'rgba(242,245,255,0.72)'; c.font = `600 56px ${SANS}`; c.fillText('site proposal', w / 2, 252);
  }).tex;
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.38), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, fog: false }));
  title.renderOrder = 5; scene.add(title);

  // ----------------------------------------------------------- camera: a crane that rises with the building
  const lin = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.75, 0.62, 2.35]], [2.4, [-0.85, 0.85, 2.5], lin],
    [4.4, [-0.9, 1.15, 2.6]], [6.4, [-0.85, 1.45, 2.7]],
    [7.6, [-0.6, 1.65, 3.0]], [8.7, [-0.7, 2.2, 4.15]],
    [10, [-0.66, 2.25, 4.35], lin],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.1, 0.3, 0]], [2.4, [0.12, 0.48, 0], lin],
    [4.4, [0.15, 0.72, 0]], [6.4, [0.15, 0.98, 0]],
    [7.6, [0.0, 1.2, 0]], [8.7, [0.1, 0.92, 0]],
    [10, [0.12, 0.92, 0], lin],
  ]);
  const tgt = new THREE.Vector3(), Yax = new THREE.Vector3(0, 1, 0), dir = new THREE.Vector3(), a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), wp = new THREE.Vector3();
  const one = new THREE.Vector3(1, 1, 1);
  const railAt = (t) => kf(t, [[0.3, 0], [2.2, 0.25], [2.6, 0.25], [4.2, 0.5], [4.6, 0.5], [6.2, 0.75], [6.6, 0.75], [8.2, 1]]);
  const phaseCol = new THREE.Color(), cTmp = new THREE.Color();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.5 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 32], [7.6, 30], [8.7, 32], [10, 32]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    key.intensity = 30 * clamp(back(k(t, 0.05, 0.6)));
    const pay = eo(k(t, PAY, PAY + 0.7));
    cityM.emissiveIntensity = 0.4 + 0.55 * pay;
    bokeh.material.opacity = 0.35 + 0.15 * pay;

    // Floors drop in, settle, and light their edges; the plan glows on the plate.
    floors.forEach((f, i) => {
      const L = LAND[i];
      f.g.visible = t > L - 0.4;
      f.g.position.y = fy(i) + (1 - spring(k(t, L - 0.4, L + 0.6))) * 0.75;
      f.slabM.opacity = clamp(k(t, L - 0.4, L - 0.15));
      const flash = t > L ? Math.exp(-4 * (t - L)) : 0;
      f.frameM.opacity = clamp(0.4 * eo(k(t, L - 0.2, L)) + 0.6 * flash + 0.6 * pay);
      f.planM.opacity = clamp(0.75 * eo(k(t, L, L + 0.5)) + 0.25 * pay);
    });
    // Corner guides grow up to each floor after it lands.
    let ci = 0;
    for (let i = 0; i < 4; i++) {
      const gr = eo(k(t, LAND[i] + 0.1, LAND[i] + 0.55)), y0 = i === 0 ? PLH : fy(i - 1) + FT / 2, y1 = fy(i) - FT / 2;
      CORN.forEach(([x, z]) => { m4.compose(p4.set(x, y0, z), q4.identity(), s4.set(1, Math.max(0.001, (y1 - y0) * gr), 1)); cols.setMatrixAt(ci++, m4); });
    }
    cols.instanceMatrix.needsUpdate = true;
    // Active phase light follows the newest floor.
    const act = LAND.filter((l) => t > l - 0.2).length - 1;
    if (act >= 0) {
      phaseCol.set(PH[act].c);
      phaseL.color.copy(phaseCol);
      phaseL.position.set(BX + 0.1, floors[act].g.position.y + 0.2, 0.2);
      phaseL.intensity = 1.6 * eo(k(t, LAND[act] - 0.2, LAND[act] + 0.3)) * (1 - 0.5 * pay);
    } else phaseL.intensity = 0;

    // Phase 1: rooms rise, the sitemap draws itself.
    TREE.forEach(([x, z, bw, bd, bh, a], i) => {
      const s = Math.max(0.001, back(k(t, a, a + 0.4)));
      m4.compose(p4.set(x, FT / 2, z), q4.identity(), s4.set(bw, bh * s, bd)); blocks.setMatrixAt(i, m4);
    });
    blocks.instanceMatrix.needsUpdate = true;
    drawP1(t);

    // Phase 2: bars climb, the gauge sweeps to its mark with a little overshoot.
    BARS.forEach((bh, i) => {
      const s = Math.max(0.001, back(k(t, 2.95 + i * 0.08, 3.45 + i * 0.08)));
      m4.compose(p4.set(0.06 + i * 0.07, FT / 2, 0.1), q4.identity(), s4.set(1, bh * s, 1)); bars.setMatrixAt(i, m4);
    });
    bars.instanceMatrix.needsUpdate = true;
    const gp = 0.72 * back(k(t, 3.0, 3.9));
    needle.rotation.z = Math.PI * (1 - gp);
    arcGeo.setDrawRange(0, 6 * 8 * Math.floor(clamp(gp) * 48));
    drawP2(t);

    // Phase 3: tiles pop, services plug in along glowing links, data pulses run home.
    TILES.forEach(([x, z], i) => {
      const s = Math.max(0.001, back(k(t, 4.85 + i * 0.08, 5.3 + i * 0.08)));
      m4.compose(p4.set(x, FT / 2 + 0.0175 * s, z), q4.identity(), s4.set(s, s, s)); tiles.setMatrixAt(i, m4);
    });
    tiles.instanceMatrix.needsUpdate = true;
    NODES.forEach((n, j) => {
      const s = Math.max(0.001, back(k(t, 5.15 + j * 0.1, 5.5 + j * 0.1)));
      m4.compose(p4.set(...n), q4.setFromAxisAngle(Yax, t * 0.8 + j), s4.set(s, s, s)); nodes.setMatrixAt(j, m4);
      nodeGlows[j].material.opacity = 0.7 * clamp(s) * (0.8 + 0.2 * Math.sin(t * 3 + j));
      const g = eo(k(t, 5.35 + j * 0.1, 5.8 + j * 0.1));
      a3.copy(plugFrom[j]); b3.copy(plugTo[j]); dir.subVectors(b3, a3); const L = dir.length(); dir.normalize();
      q4.setFromUnitVectors(Yax, dir);
      m4.compose(p4.copy(a3).addScaledVector(dir, L * g / 2), q4, s4.set(1, Math.max(0.001, L * g), 1)); links.setMatrixAt(j, m4);
      const pp = ((t - 5.9) * 0.9 + j * 0.27) % 1;
      pulses[j].position.copy(a3).addScaledVector(dir, L * pp);
      pulses[j].material.opacity = t > 5.9 ? 0.9 * Math.sin(Math.PI * pp) : 0;
    });
    nodes.instanceMatrix.needsUpdate = true; links.instanceMatrix.needsUpdate = true;

    // Phase 4: the phone rises off the roof, turns to us, runs the store.
    const up = back(k(t, 6.9, 7.45));
    ph.visible = t > 6.9;
    ph.scale.setScalar(Math.max(0.001, 0.3 * up));
    ph.position.set(0.05, FT / 2 + 0.03 + 0.228 * up + Math.sin(t * 1.6) * 0.008, 0.04);
    floors[3].g.getWorldPosition(wp);
    ph.rotation.y = Math.atan2(camera.position.x - (wp.x + 0.05), camera.position.z - (wp.z + 0.04)) + (1 - eo(k(t, 6.9, 7.7))) * 0.6;
    ph.rotation.x = -0.1;
    ph.userData.sheen.position.x = Math.sin(t * 0.7) * 0.05;
    roofRing.material.opacity = 0.8 * Math.sin(Math.PI * k(t, 6.85, 7.7));
    drawUI(t);
    beacon.position.set(BX, fy(3) + 0.02, -FD / 2 + 0.05);
    beacon.material.opacity = pay * (0.55 + 0.45 * Math.sin(t * 5));

    // Tags pop beside each floor once it lands, with a leader from the floor's corner.
    tags.forEach((m, i) => {
      const s = back(k(t, LAND[i] + 0.35, LAND[i] + 0.8));
      m.visible = s > 0.01;
      m.scale.setScalar(Math.max(0.001, s));
      m.material.opacity = clamp(s);
      m.lookAt(camera.position);
      const g = eo(k(t, LAND[i] + 0.25, LAND[i] + 0.6));
      a3.set(BX + FW / 2, fy(i), FD / 2); b3.set(TAGX - 0.3, fy(i) + 0.06, 0.12);
      dir.subVectors(b3, a3); const L = dir.length(); dir.normalize();
      m4.compose(p4.copy(a3).addScaledVector(dir, L * g / 2), q4.setFromUnitVectors(Yax, dir), s4.set(1, Math.max(0.001, L * g), 1));
      leaders.setMatrixAt(i, m4);
    });
    leaders.instanceMatrix.needsUpdate = true;

    // Timeline rail fills phase by phase; each marker takes its phase color as it is reached.
    const rf = railAt(t);
    fill.scale.x = Math.max(0.001, rf);
    head.position.set(RX0 + RAIL * rf, PLH + 0.012, RZ);
    head.material.opacity = rf > 0.001 ? 0.8 : 0;
    for (let i = 0; i < 4; i++) marks.setColorAt(i, rf >= (i + 1) / 4 - 0.002 ? cTmp.set(PH[i].c) : cTmp.set('#2a3048'));
    marks.instanceColor.needsUpdate = true;

    // Payoff: the title settles beside the roof, at the head of the phase column, like a drawing's title block.
    const ti = back(k(t, PAY + 0.05, PAY + 0.65));
    title.visible = t > PAY;
    title.position.set(0.62, 1.79 - (1 - clamp(ti)) * 0.08, 0.1);
    title.lookAt(camera.position);
    title.scale.setScalar(Math.max(0.001, 0.92 + 0.08 * ti));
    title.material.opacity = clamp(k(t, PAY + 0.05, PAY + 0.45));
  }

  return { scene, camera, update, duration: D, poster: 8.9 };
}
