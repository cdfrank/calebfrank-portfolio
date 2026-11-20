// Tin Minnows Bearings Co. lit loop, 10 s. "Bearings in a tin you keep."
// A bait-shop counter at night: wet slate under a warm lamp, caustic light rippling on a teal wall
// where a school of minnows drifts past. A sardine-style tin with a vintage fish label sits on the
// slate. Its key turns and the lid rolls back to show eight bearings nested like fish; each one spins
// as the light reaches it. One pops out, tumbles across, slides onto the axle of a skateboard wheel
// and seats with a click, and the wheel spins up. The camera pulls back to the open tin, the wheel,
// two more collectible tins on the ledge, and the name.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
// Label palettes: the hero tin, then two collectible colorways on the ledge.
const MAIN = { bg: '#dccca3', ink: '#1c2638', trim: '#d39a34', fish: '#cf4a36', belly: '#e6b088', paper: '#dccca3', grain: '70,45,20' };
const TEALP = { bg: '#1d6461', ink: '#0c1f24', trim: '#dccca3', fish: '#dc9c34', belly: '#ecd08c', paper: '#dccca3', grain: '0,0,0' };
const NAVYP = { bg: '#1c2842', ink: '#0a1019', trim: '#cf4a36', fish: '#79c1b0', belly: '#cfe8de', paper: '#dccca3', grain: '255,255,255' };

// Tin (tin-local units, base at y 0, long side along x).
const TL = 1.0, TW = 0.62, TR = 0.12, TH = 0.15, WALL = 0.014;
const IL = TL - 2 * WALL, IW = TW - 2 * WALL, IR = TR - WALL;
const LL = IL - 0.004, LW = IW - 0.004, LID_Y = TH + 0.004;
const FLOOR = 0.05;
// Bearings: 22 mm skate bearings at this scale, a set of eight in two rows.
const BR = 0.095, BIR = 0.032, BT = 0.06, H2 = BT / 2;
const SLOTS = [];
for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) SLOTS.push([-0.33 + c * 0.22, r ? 0.125 : -0.125]);
const HERO = 7;                          // front row, right end: first uncovered, nearest the wheel
// Lid roll, measured in u = -x so the roll runs from the right end toward the left.
const ROLL0 = 1.75, ROLL1 = 4.1, S0 = -LL / 2, S1 = 0.43;
const R0 = 0.011, BB = 0.00045;          // key spindle radius, lid thickness per radian of coil
const phiOf = (len) => (-R0 + Math.sqrt(R0 * R0 + 2 * BB * Math.max(0, len))) / BB;
// Wheel on its display stand.
const WR = 0.272, WY = 0.31, SEAT_Z = 0.07;
const T_ANT = 4.7, T_GO = 4.95, T_PRE = 5.8, T_SEAT = 6.22;
const HERO_W = 9, WHEEL_W = 15;

const ls = (c, px) => { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; };
// Angle swept by a spin whose speed runs piecewise-linearly through [t, w] knots and holds the last w.
function integ(kn, t) {
  let a = 0;
  for (let i = 1; i < kn.length; i++) {
    const [t0, w0] = kn[i - 1], [t1, w1] = kn[i];
    if (t <= t0) return a;
    const te = Math.min(t, t1), p = (te - t0) / (t1 - t0);
    a += (te - t0) * (w0 + (w0 + (w1 - w0) * p)) / 2;
  }
  const [tl, wl] = kn[kn.length - 1];
  if (t > tl) a += (t - tl) * wl;
  return a;
}
function rr(p, w, h, r) {
  const x = w / 2, y = h / 2;
  p.moveTo(-x + r, -y); p.lineTo(x - r, -y); p.absarc(x - r, -y + r, r, -Math.PI / 2, 0, false);
  p.lineTo(x, y - r); p.absarc(x - r, y - r, r, 0, Math.PI / 2, false);
  p.lineTo(-x + r, y); p.absarc(-x + r, y - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(-x, -y + r); p.absarc(-x + r, -y + r, r, Math.PI, Math.PI * 1.5, false);
  return p;
}
function ringShape(w1, h1, r1, w2, h2, r2) {
  const s = rr(new THREE.Shape(), w1, h1, r1);
  s.holes.push(rr(new THREE.Path(), w2, h2, r2));
  return s;
}
// Extrude a shape upward from y 0 (shape y becomes -z).
const extrudeUp = (shape, depth) => new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 12 }).rotateX(-Math.PI / 2);

// The minnow from the approved flat loop, in its own units (about 130 x 56), head left.
function fishPath(c) {
  c.beginPath();
  c.moveTo(-65, 0); c.quadraticCurveTo(-33, -28, 17, -8); c.quadraticCurveTo(33, -2, 45, 0);
  c.quadraticCurveTo(33, 2, 17, 8); c.quadraticCurveTo(-33, 28, -65, 0); c.closePath();
  c.moveTo(45, 0); c.lineTo(65, -14); c.lineTo(61, 0); c.lineTo(65, 14); c.closePath();
}
function drawFish(c, x, y, s, P) {
  c.save(); c.translate(x, y); c.scale(s, s);
  fishPath(c);
  const g = c.createLinearGradient(0, -28, 0, 28);
  g.addColorStop(0, P.fish); g.addColorStop(0.55, P.fish); g.addColorStop(1, P.belly);
  c.fillStyle = g; c.fill();
  c.save(); fishPath(c); c.clip();
  c.strokeStyle = 'rgba(0,0,0,0.16)'; c.lineWidth = 0.9;
  for (let sx = -42; sx < 46; sx += 7) for (let sy = -24; sy < 26; sy += 7) { c.beginPath(); c.arc(sx + (Math.abs(Math.round(sy / 7)) % 2) * 3.5, sy, 4, 0.3, Math.PI - 0.3); c.stroke(); }
  c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 2.2;
  c.beginPath(); c.moveTo(-50, -2); c.quadraticCurveTo(0, -6, 44, 0); c.stroke();
  c.restore();
  c.strokeStyle = P.ink; c.lineWidth = 1.6; c.lineJoin = 'round';
  fishPath(c); c.stroke();
  c.beginPath(); [-31, -15].forEach((gx) => { c.moveTo(gx, -12); c.quadraticCurveTo(gx + 6, 0, gx, 12); });
  c.moveTo(-6, -13); c.quadraticCurveTo(4, -26, 14, -9); c.stroke();
  c.fillStyle = P.paper; c.beginPath(); c.arc(-47, -4, 4.2, 0, 7); c.fill(); c.stroke();
  c.fillStyle = P.ink; c.beginPath(); c.arc(-46.4, -4, 1.9, 0, 7); c.fill();
  c.restore();
}
// The tin label: lithographed paper, double border, ribbon banner, a big minnow over waves.
function drawLabel(c, w, h, P) {
  const W = 1024, H = 624;
  c.save(); c.scale(w / W, h / H);
  c.fillStyle = P.bg; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 2400; i++) { c.fillStyle = `rgba(${P.grain},${(rnd(i, 71) * 0.08).toFixed(3)})`; c.fillRect(rnd(i, 72) * W, rnd(i, 73) * H, 2, 2); }
  c.save(); c.translate(W / 2, H * 0.53);
  for (let r = 0; r < 24; r++) {
    c.rotate(Math.PI / 12);
    c.fillStyle = r % 2 ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
    c.beginPath(); c.moveTo(0, 0); c.lineTo(700, -90); c.lineTo(700, 90); c.closePath(); c.fill();
  }
  c.restore();
  c.strokeStyle = P.trim; c.lineWidth = 16; roundRect(c, 30, 30, W - 60, H - 60, 84); c.stroke();
  c.strokeStyle = P.ink; c.lineWidth = 3; roundRect(c, 52, 52, W - 104, H - 104, 66); c.stroke();
  const bx = 220, by = 84, bw = W - 440, bh = 92;
  c.fillStyle = P.trim;
  [[bx + 12, bx - 56, bx - 34], [bx + bw - 12, bx + bw + 56, bx + bw + 34]].forEach(([a, b, m]) => {
    c.beginPath(); c.moveTo(a, by + 18); c.lineTo(b, by + 18); c.lineTo(m, by + 18 + bh / 2); c.lineTo(b, by + bh + 18); c.lineTo(a, by + bh + 18); c.closePath(); c.fill();
  });
  c.fillStyle = P.ink; roundRect(c, bx, by, bw, bh, 10); c.fill();
  c.fillStyle = P.paper; c.font = '800 60px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; ls(c, 8);
  c.fillText('TIN MINNOWS', W / 2, by + bh / 2 + 4);
  c.strokeStyle = P.trim; c.lineWidth = 5; c.lineCap = 'round';
  for (let r = 0; r < 3; r++) {
    const y = 452 + r * 22;
    c.globalAlpha = 0.85 - r * 0.25; c.beginPath();
    for (let x = 150; x <= W - 150; x += 6) { const yy = y + Math.sin(x * 0.045 + r * 1.7) * 6; if (x === 150) c.moveTo(x, yy); else c.lineTo(x, yy); }
    c.stroke();
  }
  c.globalAlpha = 1;
  drawFish(c, W / 2 + 6, 318, 3.55, P);
  c.fillStyle = P.ink; c.font = '700 40px "JetBrains Mono", monospace'; ls(c, 12);
  c.fillText('BEARINGS CO.', W / 2, 545);
  ls(c, 0); c.textAlign = 'left';
  c.restore();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x061a1e);
  scene.fog = new THREE.Fog(0x061a1e, 3.2, 10);
  scene.environment = env;
  scene.environmentIntensity = 0.5;
  const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- counter, wall, caustics
  const slate = mesh(new THREE.PlaneGeometry(9, 4.6), std(0xffffff, { map: grainTex('#161d22', { size: 512, speck: 0.08, blot: 0.12, seed: 21, repeat: 5 }), roughness: 0.32, metalness: 0.15 }), { cast: false });
  slate.rotation.x = -Math.PI / 2; slate.position.set(0, 0, 1.0); scene.add(slate);
  const wall = mesh(new THREE.PlaneGeometry(10, 4.2), std(0xffffff, { map: grainTex('#12393d', { size: 256, speck: 0.06, blot: 0.14, seed: 22, repeat: 4 }), roughness: 0.92 }), { cast: false });
  wall.position.set(0, 2.1, -1.3); scene.add(wall);
  // Tileable caustic web, two layers drifting against each other.
  const caus = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    if ('filter' in c) c.filter = 'blur(2px)';
    c.lineCap = 'round';
    for (let i = 0; i < 70; i++) {
      const x0 = rnd(i, 31) * w, y0 = rnd(i, 32) * h, len = 60 + rnd(i, 33) * 120, a = rnd(i, 34) * 6.28;
      c.strokeStyle = `rgba(255,255,255,${(0.25 + rnd(i, 35) * 0.4).toFixed(3)})`; c.lineWidth = 2 + rnd(i, 36) * 5;
      for (const ox of [-w, 0, w]) for (const oy of [-h, 0, h]) {
        c.beginPath(); c.moveTo(x0 + ox, y0 + oy);
        c.quadraticCurveTo(x0 + ox + Math.cos(a + 1) * len * 0.6, y0 + oy + Math.sin(a + 1) * len * 0.6, x0 + ox + Math.cos(a) * len, y0 + oy + Math.sin(a) * len);
        c.stroke();
      }
    }
    if ('filter' in c) c.filter = 'none';
  }).tex;
  const causLayers = [[0.2, 3, 1.3, 0.004], [0.13, 2.2, 0.95, 0.008]].map(([op, rx, ry, dz]) => {
    const tx = caus.clone(); tx.needsUpdate = true;
    tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(rx, ry);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(10, 4.2), new THREE.MeshBasicMaterial({ map: tx, color: 0x58cfc4, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, fog: false, toneMapped: false }));
    m.position.set(0, 2.1, -1.3 + dz); scene.add(m);
    return tx;
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x3d7d84, 0x0a0806, 0.35));
  const key = new THREE.SpotLight(0xffd6a2, 0, 0, 0.52, 0.6, 1.3);
  key.position.set(-1.2, 2.9, 1.5); key.target.position.set(0.1, 0.1, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 7; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6fe0e0, 1.5); rim.position.set(2.0, 1.4, -2.2); scene.add(rim);

  // ----------------------------------------------------------- the tin
  const tin = new THREE.Group(); tin.position.set(-0.32, 0, 0.02); tin.rotation.y = 0.06; scene.add(tin);
  const lacquer = std(0xb03e2e, { roughness: 0.34, metalness: 0.5 });
  const silver = std(0xbdb6a6, { metalness: 1, roughness: 0.3 });
  const gold = std(0xc9a35a, { metalness: 1, roughness: 0.3 });
  tin.add(mesh(extrudeUp(ringShape(TL, TW, TR, IL, IW, IR), TH), [silver, lacquer]));
  const liner = mesh(extrudeUp(ringShape(IL, IW, IR, IL - 0.004, IW - 0.004, IR - 0.002), TH - FLOOR), gold);
  liner.position.y = FLOOR; tin.add(liner);
  const lip = mesh(extrudeUp(ringShape(TL + 0.016, TW + 0.016, TR + 0.008, IL, IW, IR), 0.012), silver);
  lip.position.y = TH - 0.002; tin.add(lip);
  // Felt insert: eight recesses, each with a little fish printed where its bearing sits.
  const ins = canvasTex(1024, 624, (c, w, h) => {
    c.fillStyle = '#1a2335'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(255,255,255,${(rnd(i, 81) * 0.05).toFixed(3)})`; c.fillRect(rnd(i, 82) * w, rnd(i, 83) * h, 2, 2); }
    SLOTS.forEach(([x, z]) => {
      const cx = (x / IL + 0.5) * w, cy = (z / IW + 0.5) * h, r = BR / IL * w * 1.04;
      const g = c.createRadialGradient(cx, cy - r * 0.2, r * 0.2, cx, cy, r);
      g.addColorStop(0, '#0b111c'); g.addColorStop(0.85, '#111a2a'); g.addColorStop(1, '#2a3550');
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, 7); c.fill();
      c.save(); c.translate(cx, cy); c.scale(0.95, 0.95); fishPath(c); c.fillStyle = 'rgba(217,160,60,0.55)'; c.fill(); c.restore();
    });
    c.fillStyle = 'rgba(217,160,60,0.75)'; c.font = '700 26px "JetBrains Mono", monospace'; c.textAlign = 'center'; c.textBaseline = 'middle'; ls(c, 6);
    c.fillText('TIN MINNOWS  ·  BEARINGS CO.', w / 2, h / 2);
    ls(c, 0);
  }).tex;
  ins.repeat.set(1 / (IL - 0.002), 1 / (IW - 0.002)); ins.offset.set(0.5, 0.5);
  tin.add(mesh(extrudeUp(rr(new THREE.Shape(), IL - 0.002, IW - 0.002, IR - 0.001), FLOOR), [std(0xffffff, { map: ins, roughness: 0.95 }), std(0x1a2335, { roughness: 0.95 })], { cast: false }));

  // The lid: a strip mesh that rolls onto the key as a spiral, label inside, bare metal outside.
  const NX = 180;
  const lp = new Float32Array((NX + 1) * 2 * 3), luv = new Float32Array((NX + 1) * 2 * 2), lidx = [];
  for (let i = 0; i <= NX; i++) for (let j = 0; j < 2; j++) {
    const v = i * 2 + j;
    lp[v * 3] = -LL / 2 + LL * i / NX; lp[v * 3 + 1] = LID_Y; lp[v * 3 + 2] = j ? LW / 2 : -LW / 2;
    luv[v * 2] = i / NX; luv[v * 2 + 1] = 1 - j;
  }
  for (let i = 0; i < NX; i++) { const a = i * 2, b = i * 2 + 1, c = (i + 1) * 2 + 1, d = (i + 1) * 2; lidx.push(a, b, c, a, c, d); }
  const lidGeo = new THREE.BufferGeometry();
  lidGeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
  lidGeo.setAttribute('uv', new THREE.BufferAttribute(luv, 2));
  lidGeo.setIndex(lidx); lidGeo.computeVertexNormals();
  const lidAlpha = canvasTex(512, 320, (c, w, h) => { c.fillStyle = '#000'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; roundRect(c, 1, 1, w - 2, h - 2, IR / LL * w); c.fill(); }).tex;
  const lidTex = canvasTex(1024, 624, (c, w, h) => drawLabel(c, w, h, MAIN)).tex;
  const lidTop = mesh(lidGeo, std(0xffffff, { map: lidTex, alphaMap: lidAlpha, alphaTest: 0.5, roughness: 0.42, metalness: 0.3, shadowSide: THREE.DoubleSide }));
  const lidBot = mesh(lidGeo, std(0xd2c39a, { metalness: 1, roughness: 0.26, alphaMap: lidAlpha, alphaTest: 0.5, side: THREE.BackSide }), { cast: false });
  lidTop.frustumCulled = lidBot.frustumCulled = false;
  tin.add(lidTop, lidBot);
  // The key: slotted shaft holding the lid's end, a loop handle out past the back of the tin.
  const keyG = new THREE.Group(); tin.add(keyG);
  const steel = std(0xc9ccd2, { metalness: 1, roughness: 0.24 });
  const keyShaft = mesh(new THREE.CylinderGeometry(0.0075, 0.0075, 0.7, 12).rotateX(Math.PI / 2), steel); keyShaft.position.z = -0.05; keyG.add(keyShaft);
  const keyLoop = mesh(new THREE.TorusGeometry(0.04, 0.0065, 8, 32).rotateY(Math.PI / 2), steel); keyLoop.position.z = -0.44; keyG.add(keyLoop);
  const keyGlint = glow(0xfff2d8, 0.16, 0, 0.12); keyGlint.position.set(0, 0.03, -0.46); keyG.add(keyGlint);

  function rollLid(su) {
    const len = su - S0, pm = phiOf(len), R = R0 + BB * pm;
    for (let i = 0; i <= NX; i++) {
      const x0 = -LL / 2 + LL * i / NX, u = -x0;
      let X = x0, Y = LID_Y;
      if (len > 0 && u < su) {
        const ph = phiOf(len - (su - u)), r = R0 + BB * ph, a = pm - ph;
        X = -su + r * Math.sin(a); Y = LID_Y + R - r * Math.cos(a);
      }
      for (let j = 0; j < 2; j++) { const v = (i * 2 + j) * 3; lp[v] = X; lp[v + 1] = Y; }
    }
    lidGeo.attributes.position.needsUpdate = true;
    lidGeo.computeVertexNormals();
    return { pm, R };
  }

  // ----------------------------------------------------------- bearings
  const lathe = (pts, seg = 40) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const raceGeo = mergeGeometries([
    lathe([[BR - 0.013, -H2], [BR - 0.003, -H2], [BR, -H2 + 0.003], [BR, H2 - 0.003], [BR - 0.003, H2], [BR - 0.013, H2], [BR - 0.013, -H2]]),
    lathe([[BIR, -H2], [BIR + 0.012, -H2], [BIR + 0.012, H2], [BIR, H2], [BIR, -H2]]),
  ]);
  const shTop = new THREE.RingGeometry(BIR + 0.012, BR - 0.013, 48, 1).rotateX(-Math.PI / 2).translate(0, H2 - 0.005, 0);
  const shBot = new THREE.RingGeometry(BIR + 0.012, BR - 0.013, 48, 1).rotateX(Math.PI / 2).translate(0, -H2 + 0.005, 0);
  const shieldGeo = mergeGeometries([shTop, shBot]);
  // Shield print: coral with a cream minnow at twelve o'clock, so the spin reads.
  const shieldTex = canvasTex(256, 256, (c, w) => {
    c.fillStyle = '#c9452f'; c.fillRect(0, 0, w, w);
    c.translate(w / 2, w / 2);
    c.strokeStyle = 'rgba(240,226,190,0.9)'; c.lineWidth = 5;
    c.beginPath(); c.arc(0, 0, w * 0.47, 0, 7); c.stroke();
    c.beginPath(); c.arc(0, 0, w * 0.3, 0, 7); c.stroke();
    c.save(); c.translate(0, -w * 0.385); c.scale(0.55, 0.55); fishPath(c); c.fillStyle = '#efe2bf'; c.fill(); c.restore();
    [2.1, 4.2].forEach((a) => { c.fillStyle = '#efe2bf'; c.beginPath(); c.arc(Math.cos(a) * w * 0.385, Math.sin(a) * w * 0.385, 7, 0, 7); c.fill(); });
  }).tex;
  const chrome = std(0xd9dde2, { metalness: 1, roughness: 0.16 });
  const shieldM = std(0xffffff, { map: shieldTex, roughness: 0.38, metalness: 0.35 });
  const NB = SLOTS.length - 1;
  const races = new THREE.InstancedMesh(raceGeo, chrome, NB), shields = new THREE.InstancedMesh(shieldGeo, shieldM, NB);
  [races, shields].forEach((m) => { m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false; tin.add(m); });
  const heroG = new THREE.Group(); scene.add(heroG);
  heroG.add(mesh(raceGeo, chrome), mesh(shieldGeo, shieldM));
  // When the rolling lid uncovers each bearing.
  const frontX = (t) => -lerp(S0, S1, eio(k(t, ROLL0, ROLL1)));
  const REVEAL = SLOTS.map(([x]) => { let t = ROLL0; while (t < ROLL1 && frontX(t) > x - 0.04) t += 0.005; return t; });
  const spinKn = SLOTS.map((_, i) => [[REVEAL[i], 0], [REVEAL[i] + 0.6, HERO_W * (0.85 + rnd(i, 3) * 0.3)]]);
  const heroKn = [[REVEAL[HERO], 0], [REVEAL[HERO] + 0.6, HERO_W], [T_PRE, HERO_W], [T_SEAT - 0.02, 0]];
  const heroSpinEnd = integ(heroKn, T_SEAT);
  const glints = SLOTS.map(([x, z]) => { const g = glow(0xfff0d0, 0.24, 0, 0.12); g.position.set(x - 0.04, FLOOR + BT + 0.012, z - 0.05); tin.add(g); return g; });

  // ----------------------------------------------------------- wheel on its display stand
  const stand = new THREE.Group(); stand.position.set(0.72, 0, 0.1); scene.add(stand);
  const gun = std(0x23272e, { metalness: 0.8, roughness: 0.35 });
  const standGeo = mergeGeometries([
    new THREE.CylinderGeometry(0.1, 0.11, 0.03, 40).translate(0, 0.015, -0.14),
    new THREE.CylinderGeometry(0.016, 0.016, WY - 0.03, 16).translate(0, 0.03 + (WY - 0.03) / 2, -0.14),
    new THREE.CylinderGeometry(0.028, 0.028, 0.27, 20).rotateX(Math.PI / 2).translate(0, WY, -0.01),
  ]);
  stand.add(mesh(standGeo, gun));
  const spinner = new THREE.Group(); spinner.position.set(0, WY, 0); stand.add(spinner);
  // Urethane profile, counterclockwise in (r, z) so the faces point out: back face, tread, front face, bore, flange.
  const wheelGeo = lathe([[0.097, -0.1], [0.2, -0.1], [0.236, -0.094], [0.259, -0.076], [0.27, -0.045], [WR, 0], [0.27, 0.045], [0.259, 0.076], [0.236, 0.094], [0.2, 0.1], [0.097, 0.1], [0.097, 0.03], [0.042, 0.03], [0.042, -0.03], [0.097, -0.03], [0.097, -0.1]], 72).rotateX(Math.PI / 2);
  const wheel = mesh(wheelGeo, new THREE.MeshPhysicalMaterial({ color: 0xe0a238, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.3, emissive: 0x3a1c00, emissiveIntensity: 0.35 }));
  spinner.add(wheel);
  const decalTex = canvasTex(512, 512, (c, w) => {
    c.clearRect(0, 0, w, w); c.translate(w / 2, w / 2);
    const txt = 'TIN MINNOWS  ·  BEARINGS CO.  ·  ', R = w * 0.38;
    c.font = '800 30px "JetBrains Mono", monospace'; c.fillStyle = 'rgba(28,38,56,0.88)'; c.textAlign = 'center'; c.textBaseline = 'middle';
    let a = -Math.PI / 2 - 1.2;
    for (const ch of txt) { const cw = c.measureText(ch).width + 3; a += cw / 2 / R; c.save(); c.rotate(a + Math.PI / 2); c.fillText(ch, 0, -R); c.restore(); a += cw / 2 / R; }
    c.strokeStyle = 'rgba(28,38,56,0.6)'; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, w * 0.46, 0, 7); c.stroke();
  }).tex;
  const decal = new THREE.Mesh(new THREE.RingGeometry(0.105, 0.198, 64), std(0xffffff, { map: decalTex, transparent: true, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2, depthWrite: false }));
  decal.position.z = 0.1012; spinner.add(decal);
  // Seat flash: a glow and a ring wave where the bearing clicks home.
  const seatGlow = glow(0xffc35a, 0.7, 0, 0.3); scene.add(seatGlow);
  const wave = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.105, 64), new THREE.MeshBasicMaterial({ color: 0xffd27a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(wave);
  const trail = glow(0xff7a52, 0.4, 0, 0.3); scene.add(trail);

  // ----------------------------------------------------------- collectible tins on the ledge
  [[TEALP, 0x174f4c, [-1.08, 0.31, -0.98], 0.38], [NAVYP, 0x16203a, [1.42, 0.31, -0.9], -0.42]].forEach(([P, col, pos, ry]) => {
    const g = new THREE.Group(); g.position.set(...pos); g.rotation.set(-0.1, ry, 0); scene.add(g);
    g.add(mesh(new RoundedBoxGeometry(TL, TW, 0.15, 3, 0.06), std(col, { roughness: 0.34, metalness: 0.5 })));
    const face = new THREE.Mesh(new THREE.PlaneGeometry(LL, LW), std(0xffffff, { map: canvasTex(512, 312, (c, w, h) => drawLabel(c, w, h, P)).tex, alphaMap: lidAlpha, alphaTest: 0.5, roughness: 0.45, metalness: 0.25 }));
    face.position.z = 0.0755; face.receiveShadow = true; g.add(face);
  });

  // ----------------------------------------------------------- a school of minnows along the wall
  const fishShape = new THREE.Shape();
  fishShape.moveTo(-0.05, 0); fishShape.quadraticCurveTo(-0.02, 0.019, 0.028, 0.006); fishShape.lineTo(0.05, 0.017);
  fishShape.lineTo(0.044, 0); fishShape.lineTo(0.05, -0.017); fishShape.lineTo(0.028, -0.006); fishShape.quadraticCurveTo(-0.02, -0.019, -0.05, 0);
  const FN = 34;
  const school = new THREE.InstancedMesh(new THREE.ShapeGeometry(fishShape, 6), std(0xa9c7c4, { metalness: 0.7, roughness: 0.35, side: THREE.DoubleSide }), FN);
  school.frustumCulled = false; scene.add(school);
  const OFF = Array.from({ length: FN }, (_, i) => { const a = rnd(i, 91) * 6.28, r = Math.sqrt(rnd(i, 92)); return [Math.cos(a) * r * 0.85, Math.sin(a) * r * 0.32, (rnd(i, 93) - 0.5) * 0.14, 0.8 + rnd(i, 94) * 0.5]; });

  // ----------------------------------------------------------- motes in the lamp, bubbles by the wall
  const MN = 140, mpos = new Float32Array(MN * 3), BN = 50, bpos = new Float32Array(BN * 3);
  const mGeo = new THREE.BufferGeometry(); mGeo.setAttribute('position', new THREE.BufferAttribute(mpos, 3));
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3));
  const motes = new THREE.Points(mGeo, new THREE.PointsMaterial({ color: 0xffd59a, size: 0.01, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  const bubbles = new THREE.Points(bGeo, new THREE.PointsMaterial({ color: 0x9fe8e0, size: 0.016, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  motes.frustumCulled = bubbles.frustumCulled = false; scene.add(motes, bubbles);

  // ----------------------------------------------------------- the name
  const titleTex = canvasTex(1024, 410, (c, w) => {
    c.textAlign = 'center'; c.textBaseline = 'alphabetic';
    c.shadowColor = 'rgba(0,10,12,0.8)'; c.shadowBlur = 24;
    c.fillStyle = MAIN.trim; c.font = '700 30px "JetBrains Mono", monospace'; ls(c, 8); c.fillText('SELF-INITIATED', w / 2, 62);
    c.fillStyle = '#efe3c4'; c.font = '800 118px Inter, system-ui, sans-serif'; ls(c, 1); c.fillText('Tin Minnows', w / 2, 186);
    c.fillStyle = MAIN.trim; c.font = '700 60px Inter, system-ui, sans-serif'; ls(c, 6); c.fillText('BEARINGS CO.', w / 2, 272);
    c.fillStyle = 'rgba(239,227,196,0.85)'; c.font = '500 40px Inter, system-ui, sans-serif'; ls(c, 0); c.fillText('Skateboard bearings in collectible tins', w / 2, 350);
  }).tex;
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.56), new THREE.MeshBasicMaterial({ map: titleTex, transparent: true, depthWrite: false, toneMapped: false, fog: false }));
  title.renderOrder = 5; scene.add(title);

  // ----------------------------------------------------------- precomputed poses
  scene.updateMatrixWorld(true);
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const heroStart = tin.localToWorld(V(SLOTS[HERO][0], FLOOR + H2, SLOTS[HERO][1]));
  const pre = stand.localToWorld(V(0, WY, SEAT_Z + 0.17));
  const mid = heroStart.clone().add(pre).multiplyScalar(0.5).add(V(0, 0.5, 0.18));
  const qTin = tin.quaternion.clone();
  const qX = new THREE.Quaternion().setFromAxisAngle(V(1, 0, 0), Math.PI / 2);
  const qSeat = stand.quaternion.clone().multiply(qX);
  const Y = V(0, 1, 0), X = V(1, 0, 0), Z = V(0, 0, 1);
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), qc = new THREE.Quaternion();
  const m4 = new THREE.Matrix4(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(1, 1, 1), seat = new THREE.Vector3(), tmp = new THREE.Vector3();

  // ----------------------------------------------------------- camera
  const lin = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.5, 1.42, 1.38]], [1.7, [-0.36, 1.3, 1.3], lin],
    [4.0, [0.1, 1.06, 1.5]], [5.3, [0.55, 0.88, 1.7], lin],
    [6.3, [0.98, 0.56, 1.4]], [7.6, [0.6, 0.86, 2.3]],
    [10, [0.3, 1.1, 2.85], lin],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.32, 0.08, 0.02]], [1.7, [-0.3, 0.08, 0.0], lin],
    [4.0, [-0.12, 0.12, 0.0]], [5.3, [0.32, 0.34, 0.05], lin],
    [6.3, [0.7, 0.31, 0.12]], [7.6, [0.32, 0.38, -0.05]],
    [10, [0.2, 0.45, -0.1], lin],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 30], [6.3, 27], [10, 32]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Lamp snaps on; caustics drift.
    key.intensity = 24 * clamp(back(k(t, 0.1, 0.7)));
    causLayers[0].offset.set(t * 0.012, Math.sin(t * 0.4) * 0.03);
    causLayers[1].offset.set(-t * 0.009 + 0.3, t * 0.006);

    // Key: a glint, a small back-twist, then it winds the lid into a coil.
    const su = lerp(S0, S1, eio(k(t, ROLL0, ROLL1)));
    const { pm, R } = rollLid(su);
    const twist = -0.35 * Math.sin(Math.PI * k(t, 1.15, 1.85));
    keyG.position.set(-su, LID_Y + R, 0);
    keyG.rotation.z = pm + twist;
    keyGlint.material.opacity = 0.9 * Math.sin(Math.PI * k(t, 0.8, 1.5));

    // Bearings in the tin: each starts to spin as the light reaches it, with a sparkle.
    let n = 0;
    SLOTS.forEach(([x, z], i) => {
      glints[i].material.opacity = 0.9 * Math.sin(Math.PI * k(t, REVEAL[i], REVEAL[i] + 0.45));
      if (i === HERO) return;
      qa.setFromAxisAngle(Y, integ(spinKn[i], t) + rnd(i, 5) * 6.28);
      m4.compose(p4.set(x, FLOOR + H2, z), qa, s4.set(1, 1, 1));
      races.setMatrixAt(n, m4); shields.setMatrixAt(n, m4); n++;
    });
    races.instanceMatrix.needsUpdate = true; shields.instanceMatrix.needsUpdate = true;

    // The wheel: nudged back by the press, then spins up.
    const push = -0.012 * Math.sin(Math.PI * k(t, T_SEAT - 0.12, T_SEAT + 0.25));
    const wAng = integ([[T_SEAT, 0], [T_SEAT + 0.7, WHEEL_W]], t);
    spinner.position.z = push; spinner.rotation.z = -wAng;
    stand.localToWorld(seat.set(0, WY, SEAT_Z + push));

    // The hero bearing: anticipation, a tumbling arc, slides onto the axle, clicks home, rides the wheel.
    const sp = integ(heroKn, t);
    heroG.scale.set(1, 1, 1);
    if (t < T_GO) {
      const a = Math.sin(Math.PI * k(t, T_ANT, T_GO));
      heroG.position.copy(heroStart).y -= 0.006 * a;
      heroG.scale.set(1 + 0.05 * a, 1 - 0.12 * a, 1 + 0.05 * a);
      heroG.quaternion.copy(qTin).multiply(qa.setFromAxisAngle(Y, sp + rnd(HERO, 5) * 6.28));
    } else if (t < T_PRE) {
      const f = eio(k(t, T_GO, T_PRE));
      heroG.position.set(
        (1 - f) * (1 - f) * heroStart.x + 2 * (1 - f) * f * mid.x + f * f * pre.x,
        (1 - f) * (1 - f) * heroStart.y + 2 * (1 - f) * f * mid.y + f * f * pre.y,
        (1 - f) * (1 - f) * heroStart.z + 2 * (1 - f) * f * mid.z + f * f * pre.z,
      );
      heroG.quaternion.slerpQuaternions(qTin, qSeat, eio(k(t, T_GO + 0.1, T_PRE - 0.05)))
        .multiply(qb.setFromAxisAngle(X, Math.PI * 2 * f))
        .multiply(qa.setFromAxisAngle(Y, sp + rnd(HERO, 5) * 6.28));
    } else if (t < T_SEAT) {
      heroG.position.lerpVectors(pre, seat, back(k(t, T_PRE, T_SEAT)));
      heroG.quaternion.copy(qSeat).multiply(qa.setFromAxisAngle(Y, sp + rnd(HERO, 5) * 6.28));
    } else {
      heroG.position.copy(seat);
      heroG.quaternion.copy(stand.quaternion).multiply(qc.setFromAxisAngle(Z, -wAng)).multiply(qX)
        .multiply(qa.setFromAxisAngle(Y, heroSpinEnd + rnd(HERO, 5) * 6.28));
    }
    const fl = k(t, T_GO, T_PRE);
    trail.position.copy(heroG.position);
    trail.material.opacity = 0.8 * Math.sin(Math.PI * fl) * (fl > 0 && fl < 1 ? 1 : 0);
    const flash = t > T_SEAT - 0.05 ? Math.exp(-5 * (t - T_SEAT + 0.05)) : 0;
    seatGlow.position.copy(seat).add(tmp.set(0, 0, 0.04).applyQuaternion(stand.quaternion));
    seatGlow.material.opacity = 0.9 * flash;
    const wv = k(t, T_SEAT - 0.04, T_SEAT + 0.55);
    wave.position.copy(seat).add(tmp.set(0, 0, 0.035).applyQuaternion(stand.quaternion));
    wave.quaternion.copy(stand.quaternion);
    wave.scale.setScalar(1 + eo(wv) * 2.2);
    wave.material.opacity = wv > 0 && wv < 1 ? 0.8 * (1 - wv) : 0;

    // The name drops in over the pull-back.
    const tin1 = back(k(t, 7.55, 8.15));
    title.position.set(0.2, 0.8 - (1 - clamp(tin1)) * 0.06, -0.5);
    title.lookAt(camera.position);
    title.scale.setScalar(Math.max(0.001, 0.9 + 0.1 * tin1));
    title.material.opacity = clamp(k(t, 7.55, 7.95));
    title.visible = t > 7.55;

    // Minnows cross the wall once per loop.
    const cx = 2.4 - 0.48 * t, cy = 1.05 + Math.sin(t * 0.7) * 0.08;
    OFF.forEach(([ox, oy, oz, sc], i) => {
      const wob = Math.sin(t * 2 + i * 1.3);
      qa.setFromAxisAngle(Y, Math.sin(t * 9 + i * 2.1) * 0.25 + Math.PI * 0.03 * wob);
      m4.compose(p4.set(cx + ox + wob * 0.03, cy + oy + Math.sin(t * 1.4 + i) * 0.025, -1.15 + oz), qa, s4.set(sc, sc, sc));
      school.setMatrixAt(i, m4);
    });
    school.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < MN; i++) {
      mpos[i * 3] = -0.9 + rnd(i, 41) * 2.2 + Math.sin(t * 0.3 + i) * 0.1;
      mpos[i * 3 + 1] = 0.15 + rnd(i, 42) * 1.3 + Math.sin(t * 0.45 + i * 1.3) * 0.05;
      mpos[i * 3 + 2] = -0.6 + rnd(i, 43) * 1.6 + Math.cos(t * 0.27 + i) * 0.08;
    }
    mGeo.attributes.position.needsUpdate = true;
    for (let i = 0; i < BN; i++) {
      bpos[i * 3] = -2 + rnd(i, 53) * 4 + Math.sin(t * 1.3 + i) * 0.02;
      bpos[i * 3 + 1] = 0.1 + ((rnd(i, 51) * 2.6 + t * (0.06 + rnd(i, 52) * 0.06)) % 2.6);
      bpos[i * 3 + 2] = -1.22 + rnd(i, 54) * 0.2;
    }
    bGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
