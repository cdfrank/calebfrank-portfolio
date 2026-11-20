// Shred & Dice lit loop, 10 s. "Roll it, then skate it."
// Game night: a printed city map on a dark table under one swinging pendant lamp, a pink neon die on the
// wall behind. Two orange dice tumble onto the map; a fingerboard-sized deck rides the streets to the next
// spot and lands a trick there: a kickflip over a ledge, a boardslide down a rail. The third roll comes up
// doubles, the dice flare, and the deck launches off a kicker into a tre flip. Each spot it clears lights up.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const PINK = 0xff4fb0, TEAL = 0x3fd6d0, ORANGE = '#ef6a23', AMBER = 0xffb04a;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const BW = 3.4, BD = 2.2;                                   // map board size
const NODES = [[-1.1, 0.6], [-1.1, -0.5], [0.35, -0.5], [0.35, 0.6]];
const HEAD = [Math.PI / 2, 0, -Math.PI / 2];                // board yaw on each street
const SEG = [1.1, 1.45, 1.1], CUM = [0, 1.1, 2.55], TOTAL = 3.65;
// Each ride: s (0..1 along the street) as a cubic Hermite through [t, s, ds/dt] keys, so speed never jumps.
const RIDES = [
  [[1.55, 0, 0], [2.15, 0.42, 1.0], [2.5, 0.68, 0.65], [3.0, 1, 0]],
  [[4.15, 0, 0], [4.5, 0.16, 0.8], [5.25, 0.72, 0.7], [5.6, 1, 0]],
  [[6.95, 0, 0], [7.55, 0.5636, 1.25], [8.2, 0.85, 0.5], [8.55, 1, 0]],
];
const CLEAR = [3.0, 5.6, 8.55];                             // when each spot lights
const ROLL = [[0.5, 1.45], [3.2, 4.1], [5.85, 6.8]];
const FACES = [[3, 4], [5, 2], [6, 6]];                     // the third roll is doubles
const REST = [[[1.05, 0.25], [1.38, 0.6]], [[1.12, 0.64], [1.44, 0.24]], [[0.94, 0.34], [1.22, 0.62]]];
const YAW = [[0.3, -0.5], [0.9, 0.12], [0.22, 0.48]];
const DS = 0.16;                                            // die size
const DECK_Y = 0.045, RAIL_Y = 0.1, SLIDE_Y = 0.067;

function herm(t, keys) {
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) {
    const [t0, s0, v0] = keys[i - 1], [t1, s1, v1] = keys[i];
    if (t <= t1) {
      const h = t1 - t0, u = (t - t0) / h, u2 = u * u, u3 = u2 * u;
      return (2 * u3 - 3 * u2 + 1) * s0 + (u3 - 2 * u2 + u) * h * v0 + (-2 * u3 + 3 * u2) * s1 + (u3 - u2) * h * v1;
    }
  }
  return keys[keys.length - 1][1];
}

// The deck's whole run as a pure function of t.
function boardAt(t, o) {
  let seg = -1;
  for (let i = 0; i < 3; i++) if (t >= RIDES[i][0][0]) seg = i;
  o.y = 0; o.roll = 0; o.shove = 0; o.pitch = 0; o.slide = 0;
  if (seg < 0) { o.x = NODES[0][0]; o.z = NODES[0][1]; o.yaw = HEAD[0]; o.seg = 0; o.s = 0; o.prog = 0; return o; }
  const s = herm(t, RIDES[seg]), A = NODES[seg], B = NODES[seg + 1];
  o.seg = seg; o.s = s;
  o.x = lerp(A[0], B[0], s); o.z = lerp(A[1], B[1], s);
  o.yaw = lerp(seg ? HEAD[seg - 1] : HEAD[0], HEAD[seg], eio(k(t, RIDES[seg][0][0], RIDES[seg][0][0] + 0.4)));
  o.prog = (CUM[seg] + s * SEG[seg]) / TOTAL;
  if (seg === 0) { // kickflip over the ledge
    const u = k(t, 2.15, 2.5);
    if (u > 0 && u < 1) {
      o.y = 0.15 * Math.sin(Math.PI * u);
      o.roll = Math.PI * 2 * eio(k(u, 0.08, 0.85));
      o.pitch = 0.45 * Math.sin(Math.PI * k(u, 0, 0.4));
    }
  } else if (seg === 1) { // boardslide the rail
    const on = k(s, 0.13, 0.215), off = k(s, 0.68, 0.77);
    if (s >= 0.13 && s < 0.215) o.y = lerp(0, SLIDE_Y, eo(on)) + 0.06 * Math.sin(Math.PI * on);
    else if (s >= 0.215 && s < 0.68) { o.y = SLIDE_Y; o.slide = 1; }
    else if (s >= 0.68 && s < 0.77) o.y = lerp(SLIDE_Y, 0, ei(off)) + 0.05 * Math.sin(Math.PI * off);
    o.shove = (Math.PI / 2) * eio(on) * (1 - eio(off));
    o.pitch = 0.32 * Math.sin(Math.PI * on) * (on < 1 ? 1 : 0) + 0.22 * Math.sin(Math.PI * off) * (off > 0 ? 1 : 0);
    o.roll = o.slide * (0.05 + Math.sin(t * 40) * 0.01);
  } else { // up the kicker, into a tre flip
    if (s >= 0.2727 && s < 0.5636) { const r = (s - 0.2727) / 0.2909; o.y = 0.09 * r; o.pitch = 0.274 * eo(k(r, 0, 0.15)); }
    const u = k(t, 7.55, 8.2);
    if (u > 0 && u < 1) {
      o.y = lerp(0.09, 0, u) + 0.42 * Math.sin(Math.PI * u);
      const f = eio(k(u, 0.08, 0.82));
      o.roll = Math.PI * 2 * f; o.shove = Math.PI * 2 * f;
      o.pitch = 0.274 * (1 - eo(k(u, 0, 0.35))) - 0.12 * Math.sin(Math.PI * k(u, 0.7, 1));
    }
  }
  return o;
}

function deckShape() {
  const r = 0.0475, hl = 0.18 - r, s = new THREE.Shape();
  s.moveTo(-hl, -r); s.lineTo(hl, -r); s.absarc(hl, 0, r, -Math.PI / 2, Math.PI / 2, false);
  s.lineTo(-hl, r); s.absarc(-hl, 0, r, Math.PI / 2, Math.PI * 1.5, false);
  return s;
}
// Kick the nose and tail up.
function bend(g) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const ax = Math.abs(p.getX(i)); if (ax > 0.12) p.setY(i, p.getY(i) + (ax - 0.12) * 0.45); }
  p.needsUpdate = true; g.computeVertexNormals();
  return g;
}

function faceTex(v) {
  const P = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }[v];
  return canvasTex(256, 256, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 10, w / 2, h / 2, w * 0.75);
    g.addColorStop(0, '#f2742c'); g.addColorStop(1, '#c94e14');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    P.forEach(([x, y]) => {
      const cx = w / 2 + x * 66, cy = h / 2 + y * 66, r = v === 1 ? 30 : 22;
      c.fillStyle = '#1c0f0a'; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,190,140,0.25)'; c.beginPath(); c.arc(cx + r * 0.25, cy + r * 0.35, r * 0.55, 0, Math.PI); c.fill();
    });
  }).tex;
}

function mapTex() {
  const Wp = 1024, Hp = Math.round(1024 * BD / BW);
  const X = (x) => (x + BW / 2) / BW * Wp, Z = (z) => (z + BD / 2) / BD * Hp;
  return canvasTex(Wp, Hp, (c, w, h) => {
    c.fillStyle = '#10151d'; c.fillRect(0, 0, w, h);
    const vs = [-1.7, -1.1, -0.35, 0.35, 0.95, 1.7], hs = [-1.1, -0.5, 0.6, 1.1];
    for (let i = 0; i < vs.length - 1; i++) for (let j = 0; j < hs.length - 1; j++) {
      const x0 = X(vs[i]) + 14, x1 = X(vs[i + 1]) - 14, z0 = Z(hs[j]) + 14, z1 = Z(hs[j + 1]) - 14;
      const park = (i === 4 && j === 1) || (i === 4 && j === 2) || (i === 2 && j === 2);
      c.fillStyle = park ? '#16271f' : '#19202b'; roundRect(c, x0, z0, x1 - x0, z1 - z0, 10); c.fill();
      if (park) {
        for (let q = 0; q < 26; q++) { c.fillStyle = `rgba(60,120,80,${0.3 + rnd(q, i * 7 + j) * 0.3})`; c.beginPath(); c.arc(x0 + 14 + rnd(q, i + 2) * (x1 - x0 - 28), z0 + 14 + rnd(q, j + 5) * (z1 - z0 - 28), 6 + rnd(q, 9) * 8, 0, 7); c.fill(); }
      } else {
        for (let q = 0; q < 10; q++) { const bw = 24 + rnd(q, i * 5 + j) * 50, bh = 20 + rnd(q, i + j * 3) * 40; c.fillStyle = `rgba(40,50,66,${0.6 + rnd(q, 4) * 0.4})`; c.fillRect(x0 + 8 + rnd(q, i * 9 + j) * Math.max(1, x1 - x0 - bw - 16), z0 + 8 + rnd(q, j * 9 + i) * Math.max(1, z1 - z0 - bh - 16), bw, bh); }
      }
    }
    // A river cuts the top corner.
    c.fillStyle = '#0f2738'; c.beginPath(); c.moveTo(X(-1.7), Z(-0.85)); c.bezierCurveTo(X(-1.2), Z(-0.95), X(-0.6), Z(-0.78), X(-0.2), Z(-1.1)); c.lineTo(X(-1.7), Z(-1.1)); c.closePath(); c.fill();
    c.strokeStyle = '#2a3442'; c.lineCap = 'butt';
    vs.slice(1, -1).forEach((x) => { c.lineWidth = 24; c.beginPath(); c.moveTo(X(x), 0); c.lineTo(X(x), h); c.stroke(); });
    hs.slice(1, -1).forEach((z) => { c.lineWidth = 24; c.beginPath(); c.moveTo(0, Z(z)); c.lineTo(w, Z(z)); c.stroke(); });
    c.strokeStyle = 'rgba(200,210,225,0.18)'; c.lineWidth = 2; c.setLineDash([10, 12]);
    vs.slice(1, -1).forEach((x) => { c.beginPath(); c.moveTo(X(x), 0); c.lineTo(X(x), h); c.stroke(); });
    hs.slice(1, -1).forEach((z) => { c.beginPath(); c.moveTo(0, Z(z)); c.lineTo(w, Z(z)); c.stroke(); });
    // The run, printed faint: where the dice will send you.
    c.strokeStyle = 'rgba(255,176,74,0.35)'; c.lineWidth = 5; c.setLineDash([16, 14]);
    c.beginPath(); NODES.forEach(([x, z], i) => (i ? c.lineTo(X(x), Z(z)) : c.moveTo(X(x), Z(z)))); c.stroke();
    c.setLineDash([]);
    // Print border and corner ticks.
    c.strokeStyle = 'rgba(200,210,225,0.25)'; c.lineWidth = 4; c.strokeRect(10, 10, w - 20, h - 20);
  }).tex;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0810);
  scene.fog = new THREE.Fog(0x0b0810, 5, 13);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- room: table, wall, neon
  const table = mesh(new THREE.PlaneGeometry(14, 10), std(0xffffff, { map: grainTex('#1d1512', { size: 256, speck: 0.08, blot: 0.12, seed: 3, repeat: 6 }), roughness: 0.5 }), { cast: false });
  table.rotation.x = -Math.PI / 2; table.position.y = -0.04; scene.add(table);
  const wall = mesh(new THREE.PlaneGeometry(14, 6), std(0xffffff, { map: grainTex('#1c1324', { size: 256, speck: 0.1, blot: 0.14, seed: 6, repeat: 3 }), roughness: 0.9 }), { cast: false });
  wall.position.set(0, 2.9, -3.2); scene.add(wall);
  const neonM = new THREE.MeshBasicMaterial({ color: PINK, toneMapped: false, transparent: true });
  const sign = new THREE.Group(); sign.position.set(-1.35, 1.45, -3.12); scene.add(sign);
  const frameN = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.02, 8, 4), neonM); frameN.rotation.z = Math.PI / 4; sign.add(frameN);
  const pipsN = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 12, 10), neonM, 5);
  const m4 = new THREE.Matrix4();
  [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]].forEach(([x, y], i) => { m4.makeTranslation(x * 0.17, y * 0.17, 0); pipsN.setMatrixAt(i, m4); });
  sign.add(pipsN);
  const signGlow = glow(PINK, 2.6, 0.4, 0.45); signGlow.position.set(-1.35, 1.45, -3.0); scene.add(signGlow);
  // A teal neon deck beside it.
  const outer = deckShape(); const holeP = new THREE.Path();
  { const r = 0.036, hl = 0.18 - 0.0475; holeP.moveTo(-hl, -r); holeP.lineTo(hl, -r); holeP.absarc(hl, 0, r, -Math.PI / 2, Math.PI / 2, false); holeP.lineTo(-hl, r); holeP.absarc(-hl, 0, r, Math.PI / 2, Math.PI * 1.5, false); }
  outer.holes.push(holeP);
  const deckNeon = new THREE.Mesh(new THREE.ShapeGeometry(outer, 24), new THREE.MeshBasicMaterial({ color: TEAL, toneMapped: false, transparent: true }));
  deckNeon.scale.setScalar(3.2); deckNeon.rotation.z = 0.35; deckNeon.position.set(0.95, 1.7, -3.12); scene.add(deckNeon);
  const deckGlow = glow(TEAL, 2.2, 0.28, 0.45); deckGlow.position.set(0.95, 1.7, -3.0); deckGlow.scale.set(2.6, 1.3, 1); scene.add(deckGlow);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x45305e, 0x0a0806, 0.3));
  const pivot = new THREE.Group(); pivot.position.set(0.15, 3.7, 0.3); scene.add(pivot);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 1.1, 6), std(0x111111)); cord.position.y = -0.55; pivot.add(cord);
  const shade = mesh(new THREE.CylinderGeometry(0.07, 0.34, 0.28, 40, 1, true), std(0x1c1e22, { metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide }), { cast: false });
  shade.position.y = -1.24; pivot.add(shade);
  const bulb = glow(0xffd6a0, 0.7, 0.9, 0.3); bulb.position.y = -1.33; pivot.add(bulb);
  const key = new THREE.SpotLight(0xffd3a0, 30, 0, 0.62, 0.6, 1.5);
  key.position.set(0, -1.3, 0); pivot.add(key);
  key.target.position.set(0.15, 0, 0.05); scene.add(key.target);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 4.5; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015;
  const rim = new THREE.DirectionalLight(TEAL, 1.3); rim.position.set(-2.2, 1.1, -3); scene.add(rim);
  const neonL = new THREE.PointLight(PINK, 3.5, 0, 2); neonL.position.set(-1.35, 1.4, -2.7); scene.add(neonL);

  // ----------------------------------------------------------- the map board and its spots
  const slab = mesh(new THREE.BoxGeometry(BW + 0.06, 0.04, BD + 0.06), std(0x0e0f12, { roughness: 0.6 }));
  slab.position.y = -0.02; scene.add(slab);
  const mapTop = mesh(new THREE.PlaneGeometry(BW, BD), std(0xffffff, { map: mapTex(), roughness: 0.62 }), { cast: false });
  mapTop.rotation.x = -Math.PI / 2; mapTop.position.y = 0.0006; scene.add(mapTop);
  const concrete = std(0xffffff, { map: grainTex('#7a7d84', { size: 128, speck: 0.2, blot: 0.1, seed: 12 }), roughness: 0.85 });
  const ledge = mesh(new RoundedBoxGeometry(0.36, 0.06, 0.08, 2, 0.008), concrete); ledge.position.set(-1.1, 0.03, 0); scene.add(ledge);
  const coping = mesh(new THREE.BoxGeometry(0.36, 0.006, 0.012), std(0xb9bec6, { metalness: 1, roughness: 0.3 })); coping.position.set(-1.1, 0.061, 0.035); scene.add(coping);
  const chrome = std(0xc9ced6, { metalness: 1, roughness: 0.18 });
  const railBar = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.76, 12), chrome); railBar.rotation.z = Math.PI / 2; railBar.position.set(-0.45, RAIL_Y, -0.5); scene.add(railBar);
  const posts = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.005, 0.005, RAIL_Y, 8), chrome, 3);
  [-0.78, -0.45, -0.12].forEach((x, i) => { m4.makeTranslation(x, RAIL_Y / 2, -0.5); posts.setMatrixAt(i, m4); });
  posts.castShadow = true; scene.add(posts);
  const wedge = new THREE.Shape(); wedge.moveTo(0, 0); wedge.lineTo(0.32, 0); wedge.lineTo(0.32, 0.09); wedge.closePath();
  const kg = new THREE.ExtrudeGeometry(wedge, { depth: 0.2, bevelEnabled: false }); kg.rotateY(-Math.PI / 2); kg.translate(0.1, 0, 0);
  const kicker = mesh(kg, std(0x9a6e44, { roughness: 0.7 })); kicker.position.set(0.35, 0, -0.2); scene.add(kicker);
  // Spot markers: a disc, a beam of light that rises when the spot is cleared, a glow, a burst ring.
  const beamTex = canvasTex(8, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const beamGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 16, 1, true); beamGeo.translate(0, 0.3, 0);
  const spots = NODES.slice(1).map(([x, z], i) => {
    const col = i === 2 ? AMBER : TEAL;
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.006, 32), new THREE.MeshBasicMaterial({ color: 0x3a4250, toneMapped: false }));
    disc.position.set(x, 0.003, z); scene.add(disc);
    const beam = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ map: beamTex, color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
    beam.position.set(x, 0, z); scene.add(beam);
    const gl = glow(col, 0.55, 0, 0.35); gl.position.set(x, 0.03, z); scene.add(gl);
    const burst = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 48), new THREE.MeshBasicMaterial({ color: col, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    burst.rotation.x = -Math.PI / 2; burst.position.set(x, 0.006, z); scene.add(burst);
    return { disc, beam, gl, burst, col: new THREE.Color(col) };
  });
  const start = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 32), new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.5, toneMapped: false }));
  start.rotation.x = -Math.PI / 2; start.position.set(NODES[0][0], 0.004, NODES[0][1]); scene.add(start);
  // The run drawn in light behind the deck.
  const route = new THREE.CurvePath();
  NODES.reduce((a, b) => { route.add(new THREE.LineCurve3(new THREE.Vector3(a[0], 0.004, a[1]), new THREE.Vector3(b[0], 0.004, b[1]))); return b; });
  const RS = 180, RR = 6;
  const routeGeo = new THREE.TubeGeometry(route, RS, 0.008, RR, false);
  const routeMesh = new THREE.Mesh(routeGeo, new THREE.MeshBasicMaterial({ color: TEAL, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(routeMesh);
  // Table props: a face-down stack of cards, a mug.
  const backTex = canvasTex(256, 360, (c, w, h) => {
    c.fillStyle = '#2a0f22'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#ff4fb0'; c.lineWidth = 6; roundRect(c, 14, 14, w - 28, h - 28, 18); c.stroke();
    c.strokeStyle = 'rgba(255,79,176,0.4)'; c.lineWidth = 2;
    for (let i = -h; i < w + h; i += 22) { c.beginPath(); c.moveTo(i, 30); c.lineTo(i + h, h + 30); c.stroke(); }
    c.fillStyle = '#ff4fb0'; roundRect(c, w / 2 - 34, h / 2 - 34, 68, 68, 14); c.fill();
    c.fillStyle = '#2a0f22'; [[-1, -1], [1, 1], [0, 0]].forEach(([x, y]) => { c.beginPath(); c.arc(w / 2 + x * 17, h / 2 + y * 17, 7, 0, 7); c.fill(); });
  }).tex;
  const cards = mesh(new RoundedBoxGeometry(0.24, 0.045, 0.34, 2, 0.01), std(0xe9e1d2, { roughness: 0.8 }));
  cards.position.set(-2.05, -0.0175, 0.95); cards.rotation.y = 0.35; scene.add(cards);
  const cardTop = new THREE.Mesh(new THREE.PlaneGeometry(0.235, 0.335), std(0xffffff, { map: backTex, roughness: 0.6 }));
  cardTop.rotation.x = -Math.PI / 2; cardTop.position.y = 0.0232; cards.add(cardTop);
  const mug = new THREE.Group(); mug.position.set(2.15, -0.04, -0.75); scene.add(mug);
  const mugB = mesh(new THREE.CylinderGeometry(0.11, 0.1, 0.24, 28), std(0x2b2f3a, { roughness: 0.35 })); mugB.position.y = 0.12; mug.add(mugB);
  const mugH = mesh(new THREE.TorusGeometry(0.055, 0.015, 8, 20, Math.PI), std(0x2b2f3a, { roughness: 0.35 })); mugH.rotation.z = -Math.PI / 2; mugH.position.set(0.11, 0.12, 0); mug.add(mugH);

  // ----------------------------------------------------------- the dice
  const VALS = [3, 4, 1, 6, 2, 5];                          // +x, -x, +y, -y, +z, -z
  const diceMats = VALS.map((v) => { const map = faceTex(v); return new THREE.MeshPhysicalMaterial({ map, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08, emissive: 0xff6a20, emissiveMap: map, emissiveIntensity: 0 }); });
  const dieGeo = new RoundedBoxGeometry(DS, DS, DS, 4, 0.026);
  const dice = [0, 1].map(() => { const m = mesh(dieGeo, diceMats); scene.add(m); return m; });
  const UP = { 1: [0, 0, 0], 6: [Math.PI, 0, 0], 3: [0, 0, Math.PI / 2], 4: [0, 0, -Math.PI / 2], 2: [-Math.PI / 2, 0, 0], 5: [Math.PI / 2, 0, 0] };
  const qy = new THREE.Quaternion(), qf = new THREE.Quaternion(), e = new THREE.Euler();
  const QF = FACES.map((f, r) => f.map((v, d) => { qf.setFromEuler(e.set(...UP[v])); qy.setFromAxisAngle(new THREE.Vector3(0, 1, 0), YAW[r][d]); return qy.clone().multiply(qf); }));
  const Q0 = [0, 1].map((d) => new THREE.Quaternion().setFromEuler(e.set(0.5 + d, 1.2, 0.3)));
  const START0 = [[2.65, 0.7], [2.75, 0.3]];
  const AXES = ROLL.map((_, r) => [0, 1].map((d) => {
    const s = r ? REST[r - 1][d] : START0[d], en = REST[r][d];
    return new THREE.Vector3(en[1] - s[1], (rnd(r * 2 + d, 71) - 0.5) * 0.7, -(en[0] - s[0])).normalize();
  }));
  const BOUNCE = [[[0.32, 0.55, 'drop'], [0.3, 0.14], [0.22, 0.05], [0.16, 0.015]], [[0.4, 0.38], [0.28, 0.1], [0.2, 0.035], [0.12, 0.01]]];
  const bounceY = (u, kind) => {
    let a = 0;
    for (const [len, hgt, mode] of BOUNCE[kind]) {
      if (u <= a + len) { const v = (u - a) / len; return mode === 'drop' ? hgt * (1 - v * v) : hgt * 4 * v * (1 - v); }
      a += len;
    }
    return 0;
  };
  const dq = new THREE.Quaternion(), sq = new THREE.Quaternion(), rm = new THREE.Matrix4();
  const diceGlow = [0, 1].map(() => { const g = glow(0xff7a2a, 0.75, 0, 0.4); scene.add(g); return g; });
  const diceBurst = [0, 1].map(() => { const b = new THREE.Mesh(new THREE.RingGeometry(0.14, 0.17, 48), new THREE.MeshBasicMaterial({ color: 0xff8a3a, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); b.rotation.x = -Math.PI / 2; scene.add(b); return b; });
  function placeDie(t, d) {
    let r = -1;
    for (let i = 0; i < 3; i++) if (t >= ROLL[i][0]) r = i;
    const m = dice[d];
    if (r < 0) { m.visible = false; return; }
    m.visible = true;
    const u = k(t, ROLL[r][0], ROLL[r][1]);
    const s = r ? REST[r - 1][d] : START0[d], en = REST[r][d];
    const qs = r ? QF[r - 1][d] : Q0[d];
    dq.slerpQuaternions(qs, QF[r][d], eio(clamp(u * 1.15)));
    const spin = Math.PI * 2 * (r ? 2 : 3) * (1 - Math.pow(1 - u, 2.4));
    sq.setFromAxisAngle(AXES[r][d], spin);
    m.quaternion.copy(sq).multiply(dq);
    rm.makeRotationFromQuaternion(m.quaternion);
    const el = rm.elements, ext = Math.abs(el[1]) + Math.abs(el[5]) + Math.abs(el[9]);
    const p = eo(u);
    m.position.set(lerp(s[0], en[0], p), DS / 2 + (DS / 2) * 0.86 * (ext - 1) + bounceY(u, r ? 1 : 0) + (r ? 0 : (1 - p) * 0.05), lerp(s[1], en[1], p));
  }

  // ----------------------------------------------------------- the deck
  const shape = deckShape();
  const deckGeo = bend(new THREE.ExtrudeGeometry(shape, { depth: 0.008, bevelEnabled: true, bevelThickness: 0.0015, bevelSize: 0.0015, bevelSegments: 2, curveSegments: 20 }).translate(0, 0, -0.004).rotateX(-Math.PI / 2));
  const gripGeo = bend(new THREE.ShapeGeometry(shape, 20).rotateX(-Math.PI / 2).translate(0, 0.0058, 0));
  const boardRoot = new THREE.Group(); scene.add(boardRoot);
  const trick = new THREE.Group(); trick.position.y = DECK_Y; trick.rotation.order = 'YZX'; boardRoot.add(trick);
  trick.add(mesh(deckGeo, [std(PINK, { roughness: 0.45, emissive: 0x3a0a22, emissiveIntensity: 0.4 }), std(0xd2a46a, { roughness: 0.6 })]));
  trick.add(mesh(gripGeo, std(0xffffff, { map: grainTex('#121214', { size: 128, speck: 0.35, blot: 0.04, seed: 17, repeat: 2 }), roughness: 0.95, side: THREE.DoubleSide }), { cast: false }));
  const truckM = std(0xbfc4cb, { metalness: 1, roughness: 0.28 });
  [-0.11, 0.11].forEach((x) => { const tr = mesh(new THREE.BoxGeometry(0.022, 0.012, 0.084), truckM); tr.position.set(x, -0.016, 0); trick.add(tr); const bp = mesh(new THREE.BoxGeometry(0.034, 0.006, 0.042), truckM); bp.position.set(x, -0.007, 0); trick.add(bp); });
  const wheels = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 0.013, 16), std(0x8fe3d8, { roughness: 0.45 }), 4);
  const qw = new THREE.Quaternion().setFromEuler(e.set(Math.PI / 2, 0, 0)), one = new THREE.Vector3(1, 1, 1), pw = new THREE.Vector3();
  [[-0.11, -0.036], [-0.11, 0.036], [0.11, -0.036], [0.11, 0.036]].forEach(([x, z], i) => { m4.compose(pw.set(x, -0.031, z), qw, one); wheels.setMatrixAt(i, m4); });
  wheels.castShadow = true; trick.add(wheels);
  const B = {}, Bp = {};
  // Sparks off the rail, and dust puffs where the deck lands.
  const SN = 70, spos = new Float32Array(SN * 3);
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const sparks = new THREE.Points(sGeo, new THREE.PointsMaterial({ color: 0xffb860, size: 0.014, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sparks.frustumCulled = false; scene.add(sparks);
  const railGlow = glow(0xffa040, 0.3, 0, 0.3); scene.add(railGlow);
  const LANDS = [[2.5, 0], [5.32, 1], [8.2, 2]];
  const puffs = LANDS.map(() => { const g = glow(0xd8c8b8, 0.4, 0, 0.5); scene.add(g); return g; });

  // ----------------------------------------------------------- title card
  const titleTex = canvasTex(1024, 400, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(14,10,20,0.84)'; roundRect(c, 6, 6, w - 12, h - 12, 36); c.fill();
    c.strokeStyle = 'rgba(255,79,176,0.85)'; c.lineWidth = 4; c.stroke();
    c.textBaseline = 'middle';
    c.fillStyle = '#ff4fb0'; c.font = `700 30px ${MONO}`; if ('letterSpacing' in c) c.letterSpacing = '4px'; c.fillText('SELF-INITIATED', 64, 82);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#f6efe6'; c.font = `800 120px ${SANS}`; c.fillText('Shred & Dice', 58, 196);
    c.fillStyle = 'rgba(246,239,230,0.72)'; c.font = `600 42px ${SANS}`; c.fillText('Tricks, dice, and real places.', 64, 304);
  }).tex;
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.625), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, toneMapped: false, depthWrite: false, opacity: 0, fog: false }));
  title.renderOrder = 5; scene.add(title);

  // ----------------------------------------------------------- camera
  const lin = (x) => x;
  const offK = [
    [0, [0.35, 2.3, 3.1]], [1.3, [0.35, 1.75, 2.45]], [2.2, [-0.1, 1.25, 1.95]], [3.0, [-0.2, 1.3, 2.0], lin],
    [3.6, [0.4, 1.4, 2.0]], [4.1, [0.4, 1.35, 1.95], lin], [4.75, [0.1, 0.95, 1.6]], [5.6, [0.0, 1.0, 1.65], lin],
    [6.2, [0.45, 1.15, 1.7]], [6.8, [0.45, 1.05, 1.6], lin], [7.5, [-0.85, 0.5, 1.45]], [8.4, [-0.7, 0.45, 1.35], lin],
    [9.2, [0.25, 1.85, 2.95]], [10, [0.25, 1.95, 3.1], lin],
  ];
  const tgtK = [
    [0, [0.0, 0.0, 0.05]], [1.3, [0.55, 0.06, 0.4]], [2.2, [-0.6, 0.05, 0.1]], [3.0, [-0.9, 0.05, -0.3], lin],
    [3.6, [0.9, 0.06, 0.45]], [4.1, [1.0, 0.06, 0.42], lin], [4.75, [-0.6, 0.08, -0.45]], [5.6, [0.0, 0.05, -0.45], lin],
    [6.2, [1.0, 0.07, 0.5]], [6.8, [1.05, 0.07, 0.5], lin], [7.5, [0.85, 0.2, 0.3]], [8.4, [0.85, 0.15, 0.42], lin],
    [9.2, [0.15, 0.22, -0.12]], [10, [0.15, 0.22, -0.12], lin],
  ];
  const followK = [[0, 0], [1.6, 0], [2.2, 0.6], [3.0, 0.6], [3.5, 0], [4.2, 0], [4.75, 0.6], [5.6, 0.6], [6.1, 0], [7.0, 0], [7.5, 0.35], [8.4, 0.35], [9.0, 0]];
  const tgt = new THREE.Vector3(), tmp = new THREE.Vector3();

  function update(t) {
    boardAt(t, B);
    const o = kf(t, offK), q = kf(t, tgtK), w = kf(t, followK);
    tgt.set(lerp(q[0], B.x, w), lerp(q[1], 0.08 + B.y * 0.5, w), lerp(q[2], B.z, w));
    camera.position.set(tgt.x + o[0] + Math.sin(t * 1.2) * 0.008, tgt.y + o[1] + Math.sin(t * 1.7 + 1) * 0.006, tgt.z + o[2]);
    camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [7.2, 34], [7.9, 38], [8.6, 36], [10, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // The lamp sways a little, so the light and every shadow on the table breathe.
    pivot.rotation.z = Math.sin(t * 0.7) * 0.035; pivot.rotation.x = Math.sin(t * 0.53 + 1) * 0.025;
    // Neon buzzes on as the loop opens.
    const buzz = t < 0.9 ? (rnd(Math.floor(t * 24), 5) > 0.45 ? 1 : 0.25) * k(t, 0.15, 0.4) : 1;
    neonM.opacity = buzz; signGlow.material.opacity = 0.4 * buzz; neonL.intensity = 3.5 * buzz;

    // Dice.
    for (let d = 0; d < 2; d++) placeDie(t, d);
    const dbl = k(t, 6.62, 7.6), flare = t > 6.62 ? Math.exp(-3.2 * (t - 6.62)) : 0;
    diceMats.forEach((m) => { m.emissiveIntensity = 1.6 * flare + 0.12 * eo(k(t, 6.7, 7.2)); });
    dice.forEach((m, d) => {
      diceGlow[d].position.set(m.position.x, 0.03, m.position.z);
      diceGlow[d].material.opacity = 0.9 * flare + 0.2 * eo(k(t, 6.7, 7.2));
      diceBurst[d].position.set(REST[2][d][0], 0.004, REST[2][d][1]);
      diceBurst[d].visible = dbl > 0 && dbl < 1;
      diceBurst[d].scale.setScalar(1 + eo(dbl) * 3.2);
      diceBurst[d].material.opacity = 0.9 * (1 - dbl);
    });

    // The deck.
    boardRoot.position.set(B.x, B.y, B.z);
    boardRoot.rotation.y = B.yaw;
    trick.rotation.set(B.roll, B.shove, B.pitch);
    routeGeo.setDrawRange(0, Math.floor(B.prog * RS) * RR * 6);
    routeMesh.visible = B.prog > 0.002;

    // Sparks: each one was struck from the rail at an earlier moment and flies on from there.
    const slideA = t > 4.4 && t < 5.4;
    for (let i = 0; i < SN; i++) {
      const life = 0.22 + rnd(i, 81) * 0.18, age = ((t * 2.6 + rnd(i, 82)) % 1) * life;
      boardAt(t - age, Bp);
      if (!slideA || !Bp.slide) { spos[i * 3 + 1] = -5; continue; }
      const vx = -0.5 - rnd(i, 83) * 0.9, vy = 0.35 + rnd(i, 84) * 0.6, vz = (rnd(i, 85) - 0.5) * 0.8;
      spos[i * 3] = Bp.x + vx * age;
      spos[i * 3 + 1] = RAIL_Y + 0.006 + vy * age - 4.5 * age * age;
      spos[i * 3 + 2] = -0.5 + vz * age;
    }
    sGeo.attributes.position.needsUpdate = true;
    railGlow.position.set(B.x, RAIL_Y + 0.01, -0.48);
    railGlow.material.opacity = B.slide ? 0.75 + Math.sin(t * 50) * 0.2 : 0;
    LANDS.forEach(([lt], i) => {
      const p = k(t, lt, lt + 0.55);
      puffs[i].visible = p > 0 && p < 1;
      if (puffs[i].visible) { boardAt(lt, Bp); puffs[i].position.set(Bp.x, 0.03 + p * 0.04, Bp.z); puffs[i].scale.set(0.2 + eo(p) * 0.45, 0.08 + eo(p) * 0.12, 1); puffs[i].material.opacity = 0.45 * (1 - p); }
    });

    // Spots light up as each is cleared.
    spots.forEach((sp, i) => {
      const on = back(k(t, CLEAR[i], CLEAR[i] + 0.45)), b = k(t, CLEAR[i], CLEAR[i] + 0.8);
      const lit = t > CLEAR[i] ? 1 : 0;
      sp.disc.material.color.setRGB(lerp(0.23, sp.col.r, lit), lerp(0.26, sp.col.g, lit), lerp(0.31, sp.col.b, lit));
      sp.beam.visible = on > 0.001;
      sp.beam.scale.set(1, Math.max(0.001, on) * (i === 2 ? 1.5 : 1), 1);
      sp.beam.material.opacity = (0.55 + 0.15 * Math.sin(t * 3 + i)) * clamp(on);
      sp.gl.material.opacity = lit * (0.7 + 0.2 * Math.sin(t * 4 + i));
      sp.burst.visible = b > 0 && b < 1;
      sp.burst.scale.setScalar(1 + eo(b) * (i === 2 ? 4.5 : 3));
      sp.burst.material.opacity = 0.9 * (1 - b);
    });

    // Title card rises behind the board for the end of the run.
    const tc = back(k(t, 8.75, 9.3));
    title.visible = tc > 0.01;
    title.material.opacity = clamp(tc);
    title.position.set(0.1, lerp(0.12, 0.42, clamp(tc)), -1.0);
    title.scale.setScalar(Math.max(0.001, 0.85 + 0.15 * tc));
    tmp.copy(camera.position); title.lookAt(tmp);
  }

  return { scene, camera, update, duration: D, poster: 7.9 };
}
