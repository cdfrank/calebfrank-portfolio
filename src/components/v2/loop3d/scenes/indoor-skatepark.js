// Indoor skatepark proposal lit loop, 10 s. "Year-round, even in January."
// Ann Arbor on a snowy winter night. A sawtooth-roof warehouse stands dark in the snow under a hazy moon,
// one sodium street lamp beside it. Its four bays flicker on one by one, the roll-up door rises and warm
// light spills across the snow; the camera follows it in. Inside, a skater pumps a mini ramp under the
// lights, with murals on the walls. The skater boosts the biggest air of the session, and the
// proposal's name glows on above.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { makePerson } from '../person.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const WARM = new THREE.Color(0xffc27a), GLASS_OFF = new THREE.Color(0x101827);
const BAR_ON = new THREE.Color(1.6, 1.35, 1.05), CELL_ON = new THREE.Color(1.25, 0.72, 0.28);
// Building: 16 m wide, 12 m deep, 5 m walls, four sawtooth bays rising to 7 m.
const BW = 16, BD = 12, WH = 5, DOOR_W = 4.6, DOOR_H = 3.8;
const BAY_ON = [2.3, 2.6, 2.9, 3.2];
const DOOR0 = 3.25, DOOR1 = 4.25;
const TITLE = 7.5;
// Shrinks a font until the line fits, so long lines never clip on the canvas.
const fitFont = (c, text, maxW, px, rest) => { c.font = `${rest.replace('#', px)}`; const w = c.measureText(text).width; if (w > maxW) c.font = rest.replace('#', Math.floor(px * maxW / w)); };
// Mini ramp: transitions of radius R, height H, flat bottom 2F, decks to XD.
const R = 1.6, H = 1.2, F = 0.9, TC = Math.acos((R - H) / R), XC = F + R * Math.sin(TC), XD = XC + 1.0, SC = F + R * TC;
const RZ = -1.8, LANE = -1.35;
// The session as turnaround points, one every 1.4 s, alternating walls. Two of them are airs.
const T0 = 0.2, HALF = 1.4;
const AMP = { 5: SC + 0.55, 6: SC + 1.15 };
const turn = (i) => (i % 2 === 0 ? -1 : 1) * (AMP[i] || SC - 0.22);
const AIRS = [5, 6].map((i) => T0 + i * HALF);

// Arc-length position along the ramp, as a pure function of t.
function sAt(t) {
  const i = Math.floor((t - T0) / HALF), u = (t - T0) / HALF - i;
  const a = turn(i), b = turn(i + 1);
  return a + (b - a) * (1 - Math.cos(Math.PI * u)) / 2;
}
// Ramp point, tilt and air height for an arc position.
function onRamp(s) {
  const sg = Math.sign(s) || 1, as = Math.abs(s);
  if (as <= F) return { x: s, y: 0, tilt: 0, air: 0 };
  if (as <= SC) { const a = (as - F) / R; return { x: sg * (F + R * Math.sin(a)), y: R - R * Math.cos(a), tilt: sg * a, air: 0 }; }
  const e = as - SC;
  return { x: sg * (XC + Math.cos(TC) * e), y: H + Math.sin(TC) * e, tilt: sg * (TC - 0.8 * Math.min(e / 0.9, 1)), air: e };
}

function corrugated(base, seed) {
  const { tex } = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) {
      const g = c.createLinearGradient(x, 0, x + 16, 0);
      g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(0.5, 'rgba(0,0,0,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0.10)');
      c.fillStyle = g; c.fillRect(x, 0, 16, h);
    }
    for (let i = 0; i < 30; i++) { c.fillStyle = `rgba(${rnd(i, seed) > 0.5 ? '90,60,40' : '0,0,0'},${rnd(i, seed + 1) * 0.12})`; c.fillRect(rnd(i, seed + 2) * w, rnd(i, seed + 3) * h, 6 + rnd(i, seed + 4) * 30, 20 + rnd(i, seed + 5) * 80); }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function makeBoard() {
  const g = new THREE.Group();
  const deck = mesh(new THREE.BoxGeometry(0.8, 0.022, 0.21), std(0x17181b, { roughness: 0.9 })); deck.position.y = 0.1; g.add(deck);
  const metal = std(0xb7bcc4, { metalness: 1, roughness: 0.3 });
  [-0.25, 0.25].forEach((x) => { const tr = mesh(new THREE.BoxGeometry(0.05, 0.035, 0.19), metal); tr.position.set(x, 0.07, 0); g.add(tr); });
  const wheels = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.028, 0.028, 0.03, 14).rotateX(Math.PI / 2), std(0xf0e6c8, { roughness: 0.5 }), 4);
  const m = new THREE.Matrix4(); [[-0.25, -0.09], [-0.25, 0.09], [0.25, -0.09], [0.25, 0.09]].forEach(([x, z], i) => { m.makeTranslation(x, 0.03, z); wheels.setMatrixAt(i, m); });
  wheels.castShadow = true; g.add(wheels);
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1220);
  scene.fog = new THREE.Fog(0x0c1626, 16, 75);
  scene.environment = env;
  scene.environmentIntensity = 0.18;
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.1, 200);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- winter night
  scene.add(skyDome([[0, '#04070f'], [0.3, '#0b1426'], [0.47, '#1d2a44'], [0.5, '#3a3a4c'], [0.53, '#0f1828'], [1, '#05080e']], 90));
  const moon = glow(0xc8d8ff, 16, 0.45, 0.12); moon.position.set(-40, 34, -60); moon.material.fog = false; scene.add(moon);
  const moonCore = glow(0xeef3ff, 3.2, 0.8, 0.35); moonCore.position.set(-39.8, 33.9, -59.8); moonCore.material.fog = false; scene.add(moonCore);
  const snowTex = grainTex('#8b9ab2', { size: 256, speck: 0.12, blot: 0.1, seed: 5, repeat: 26 });
  const ground = mesh(new THREE.PlaneGeometry(170, 170), std(0xffffff, { map: snowTex, roughness: 0.82 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  scene.add(new THREE.HemisphereLight(0x3b5585, 0x0b0f18, 0.38));
  const moonL = new THREE.DirectionalLight(0x9db6ff, 0.6); moonL.position.set(-20, 26, -12); scene.add(moonL);
  // Pines in the dark around the lot.
  const TREES = [];
  for (let i = 0; i < 26; i++) {
    const side = i % 3 === 0 ? 0 : i % 3 === 1 ? -1 : 1;
    const x = side === 0 ? (rnd(i, 1) - 0.5) * 40 : side * (12 + rnd(i, 2) * 14);
    const z = side === 0 ? -10 - rnd(i, 3) * 10 : -12 + rnd(i, 4) * 22;
    TREES.push([x, z, 1.3 + rnd(i, 5) * 1.2, 5 + rnd(i, 6) * 4]);
  }
  const coneG = new THREE.ConeGeometry(1, 1, 8); coneG.translate(0, 0.5, 0);
  const trees = new THREE.InstancedMesh(coneG, std(0x16262a, { roughness: 0.95 }), TREES.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  TREES.forEach(([x, z, r, h], i) => { m4.compose(p4.set(x, 0, z), q4.identity(), s4.set(r, h, r)); trees.setMatrixAt(i, m4); });
  scene.add(trees);
  // Sodium street lamp.
  const lamp = new THREE.Group(); lamp.position.set(-10.5, 0, 9.5); scene.add(lamp);
  const pole = mesh(new THREE.CylinderGeometry(0.07, 0.09, 6, 10), std(0x2a2d33, { roughness: 0.5, metalness: 0.6 })); pole.position.y = 3; lamp.add(pole);
  const arm = mesh(new THREE.BoxGeometry(1.2, 0.08, 0.12), std(0x2a2d33, { roughness: 0.5, metalness: 0.6 })); arm.position.set(0.55, 5.95, 0); lamp.add(arm);
  const head = mesh(new THREE.BoxGeometry(0.5, 0.12, 0.26), new THREE.MeshBasicMaterial({ color: 0xffb35c, toneMapped: false }), { cast: false }); head.position.set(1.05, 5.86, 0); lamp.add(head);
  const lampGlow = glow(0xff9d45, 3.6, 0.7, 0.3); lampGlow.position.set(1.05, 5.7, 0); lamp.add(lampGlow);
  const lampL = new THREE.PointLight(0xff9d45, 22, 13, 1.6); lampL.position.set(1.05, 5.5, 0); lamp.add(lampL);

  // ----------------------------------------------------------- the warehouse
  const metalTex = corrugated('#3b4150', 3); metalTex.repeat.set(4, 1.2);
  const wallM = std(0xffffff, { map: metalTex, roughness: 0.6, metalness: 0.35 });
  const box = (w, h, d, x, y, z, m = wallM) => { const b = mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); scene.add(b); return b; };
  const sideW = (BW - DOOR_W) / 2;
  box(sideW, WH, 0.25, -(DOOR_W / 2 + sideW / 2), WH / 2, BD / 2);
  box(sideW, WH, 0.25, DOOR_W / 2 + sideW / 2, WH / 2, BD / 2);
  box(DOOR_W, WH - DOOR_H, 0.25, 0, (WH + DOOR_H) / 2, BD / 2);
  box(0.25, WH, BD, -BW / 2, WH / 2, 0);
  box(0.25, WH, BD, BW / 2, WH / 2, 0);
  box(BW, WH, 0.25, 0, WH / 2, -BD / 2);
  const trimM = std(0xd9a441, { roughness: 0.5, metalness: 0.4 });
  box(DOOR_W + 0.3, 0.14, 0.32, 0, DOOR_H + 0.07, BD / 2, trimM);
  // Sawtooth roof: each bay slopes up to the right and ends in a tall glazed face toward +x.
  const slopeL = Math.hypot(4, 2), slopeA = Math.atan2(2, 4);
  const roofs = new THREE.InstancedMesh(new THREE.BoxGeometry(slopeL, 0.16, BD + 0.3), std(0x262b34, { roughness: 0.7, metalness: 0.3 }), 4);
  const snowCaps = new THREE.InstancedMesh(new THREE.BoxGeometry(slopeL - 0.1, 0.1, BD + 0.2), std(0xa9b8cf, { roughness: 0.9 }), 4);
  const gableG = new THREE.ShapeGeometry(new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(4, 0), new THREE.Vector2(4, 2)]));
  const gablesBack = new THREE.InstancedMesh(gableG, std(0x2f3542, { roughness: 0.7, side: THREE.DoubleSide }), 4);
  const glassM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  const gables = new THREE.InstancedMesh(gableG, glassM, 4);
  const clere = new THREE.InstancedMesh(new THREE.PlaneGeometry(BD, 2), glassM, 4);
  for (let i = 0; i < 4; i++) {
    const x0 = -BW / 2 + i * 4;
    m4.compose(p4.set(x0 + 2, WH + 1, 0), q4.setFromEuler(new THREE.Euler(0, 0, slopeA)), s4.set(1, 1, 1)); roofs.setMatrixAt(i, m4);
    m4.compose(p4.set(x0 + 2 - Math.sin(slopeA) * 0.12, WH + 1 + Math.cos(slopeA) * 0.12, 0), q4, s4); snowCaps.setMatrixAt(i, m4);
    m4.compose(p4.set(x0, WH, BD / 2 + 0.13), q4.identity(), s4); gables.setMatrixAt(i, m4);
    m4.compose(p4.set(x0, WH, -BD / 2), q4.identity(), s4); gablesBack.setMatrixAt(i, m4);
    m4.compose(p4.set(x0 + 4.02, WH + 1, 0), q4.setFromEuler(new THREE.Euler(0, Math.PI / 2, 0)), s4); clere.setMatrixAt(i, m4);
    gables.setColorAt(i, GLASS_OFF); clere.setColorAt(i, GLASS_OFF);
  }
  scene.add(roofs, snowCaps, gablesBack, gables, clere);
  // Roll-up door, just inside the opening.
  const doorTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#6d7480'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 21) { c.fillStyle = 'rgba(0,0,0,0.35)'; c.fillRect(0, y, w, 3); c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(0, y + 3, w, 2); }
  }).tex;
  const door = mesh(new THREE.BoxGeometry(DOOR_W, DOOR_H, 0.08), std(0xffffff, { map: doorTex, roughness: 0.5, metalness: 0.5 }));
  scene.add(door);
  // Warm spill across the snow when the door opens.
  const spillTex = canvasTex(128, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.beginPath(); c.moveTo(w * 0.3, 0); c.lineTo(w * 0.7, 0); c.lineTo(w, h); c.lineTo(0, h); c.closePath(); c.fill();
  }).tex;
  const spill = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: spillTex, color: 0xffb066, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  spill.rotation.x = -Math.PI / 2; spill.position.set(0, 0.03, BD / 2 + 4.5); scene.add(spill);
  const doorGlow = glow(0xffb36a, 6, 0, 0.45); doorGlow.position.set(0, 1.9, BD / 2 + 0.3); doorGlow.scale.set(6, 4.6, 1); scene.add(doorGlow);

  // ----------------------------------------------------------- inside
  const floor = mesh(new THREE.PlaneGeometry(BW - 0.25, BD - 0.25), std(0xffffff, { map: grainTex('#56544f', { size: 256, speck: 0.08, blot: 0.12, seed: 9, repeat: 5 }), roughness: 0.32, metalness: 0.1 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = 0.012; scene.add(floor);
  // Murals: big loose shapes for the creative side of the space.
  const mural = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#2a2f3d'; c.fillRect(0, 0, w, h);
    const cols = ['#ff7a3d', '#ffd166', '#3ec1b4', '#7b6cf6', '#ef476f', '#f4f1de'];
    for (let i = 0; i < 9; i++) {
      c.fillStyle = cols[i % cols.length]; c.globalAlpha = 0.85;
      const x = rnd(i, 1) * w, y = rnd(i, 2) * h, r = 60 + rnd(i, 3) * 160;
      if (i % 3 === 0) { c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
      else if (i % 3 === 1) { c.save(); c.translate(x, y); c.rotate(rnd(i, 4) * 3); roundRect(c, -r, -r * 0.3, r * 2, r * 0.6, r * 0.3); c.fill(); c.restore(); }
      else { c.lineWidth = 26; c.strokeStyle = cols[(i + 2) % cols.length]; c.beginPath(); c.moveTo(x - r, y); for (let q = 0; q < 6; q++) c.lineTo(x - r + q * r * 0.4, y + (q % 2 ? -1 : 1) * r * 0.35); c.stroke(); }
    }
    c.globalAlpha = 1;
  });
  mural.tex.wrapS = THREE.RepeatWrapping;
  const muralM = std(0xffffff, { map: mural.tex, roughness: 0.85 });
  const muralL = mesh(new THREE.PlaneGeometry(9, 3.4), muralM, { cast: false }); muralL.rotation.y = Math.PI / 2; muralL.position.set(-BW / 2 + 0.14, 2.1, -0.5); scene.add(muralL);
  const muralR = mesh(new THREE.PlaneGeometry(9, 3.4), muralM, { cast: false }); muralR.rotation.y = -Math.PI / 2; muralR.position.set(BW / 2 - 0.14, 2.1, -0.5); scene.add(muralR);
  const muralB = mesh(new THREE.PlaneGeometry(13, 1.5), std(0xffffff, { map: mural.tex, roughness: 0.85 }), { cast: false }); muralB.position.set(0, 1.75, -BD / 2 + 0.14); scene.add(muralB);
  // The mini ramp.
  const prof = new THREE.Shape();
  prof.moveTo(-XD, 0); prof.lineTo(-XD, H); prof.lineTo(-XC, H);
  prof.absarc(-F, R, R, -Math.PI / 2 - TC, -Math.PI / 2, false);
  prof.lineTo(F, 0);
  prof.absarc(F, R, R, -Math.PI / 2, -Math.PI / 2 + TC, false);
  prof.lineTo(XD, H); prof.lineTo(XD, 0); prof.closePath();
  const rampG = new THREE.ExtrudeGeometry(prof, { depth: 4.8, bevelEnabled: false, curveSegments: 40 });
  rampG.translate(0, 0, -2.4);
  const plyTex = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#9a7a52'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { c.strokeStyle = `rgba(70,45,25,${0.08 + rnd(i, 7) * 0.15})`; c.lineWidth = 1 + rnd(i, 8) * 2; const y = rnd(i, 9) * h; c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 32) c.lineTo(x, y + Math.sin(x * 0.03 + i) * 3); c.stroke(); }
    c.fillStyle = 'rgba(30,20,10,0.5)'; c.fillRect(0, 0, w, 3);
  }).tex;
  plyTex.wrapS = plyTex.wrapT = THREE.RepeatWrapping; plyTex.repeat.set(0.6, 0.6);
  const liteTex = grainTex('#2c2b2e', { size: 256, speck: 0.06, blot: 0.12, seed: 17, repeat: 0.5 });
  const ramp = mesh(rampG, [std(0xffffff, { map: plyTex, roughness: 0.75 }), std(0xffffff, { map: liteTex, roughness: 0.38, metalness: 0.15 })]);
  ramp.position.z = RZ; scene.add(ramp);
  const copeM = std(0xcfd4dc, { metalness: 1, roughness: 0.22 });
  [-1, 1].forEach((sg) => {
    const cp = mesh(new THREE.CylinderGeometry(0.04, 0.04, 4.8, 14), copeM); cp.rotation.x = Math.PI / 2; cp.position.set(sg * XC, H + 0.01, RZ); scene.add(cp);
    const rail = mesh(new THREE.CylinderGeometry(0.03, 0.03, 4.8, 10), std(0x1b1d22, { metalness: 0.7, roughness: 0.4 })); rail.rotation.x = Math.PI / 2; rail.position.set(sg * (XD - 0.08), H + 0.9, RZ); scene.add(rail);
  });
  // A concrete ledge in the foreground.
  const ledge = mesh(new THREE.BoxGeometry(2.6, 0.42, 0.5), std(0xffffff, { map: grainTex('#7a7670', { size: 128, speck: 0.15, blot: 0.15, seed: 23 }), roughness: 0.7 }));
  ledge.position.set(4.6, 0.21, 2.6); ledge.rotation.y = -0.35; scene.add(ledge);
  const ledgeEdge = mesh(new THREE.BoxGeometry(2.6, 0.04, 0.06), copeM); ledgeEdge.position.set(0, 0.22, 0.24); ledge.add(ledgeEdge);
  // Ceiling light bars, two per bay, and a glow per bay.
  const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 0.07, 9), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 8);
  for (let i = 0; i < 8; i++) { m4.makeTranslation(-BW / 2 + Math.floor(i / 2) * 4 + (i % 2 ? 2.8 : 1.2), 4.75, -0.5); bars.setMatrixAt(i, m4); bars.setColorAt(i, GLASS_OFF); }
  scene.add(bars);
  const bayGlows = [0, 1, 2, 3].map((i) => { const g = glow(0xffc27a, 3, 0, 0.4); g.position.set(-BW / 2 + i * 4 + 2, 4.6, -0.5); g.scale.set(4.5, 2.2, 1); scene.add(g); return g; });
  const key = new THREE.SpotLight(0xffd7a3, 0, 0, 1.0, 0.75, 1.2);
  key.position.set(1.4, 4.7, 1.6); key.target.position.set(0, 0.4, RZ);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 1; key.shadow.camera.far = 16; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.03;
  scene.add(key, key.target);
  const fillL = new THREE.PointLight(0xffbe78, 0, 10, 1.5); fillL.position.set(-5, 4.2, -2); scene.add(fillL);
  const fillR = new THREE.PointLight(0xffbe78, 0, 10, 1.5); fillR.position.set(5, 4.2, -2); scene.add(fillR);
  const rimIn = new THREE.DirectionalLight(0x8fb2ff, 0); rimIn.position.set(-2, 3, -8); scene.add(rimIn);

  // ----------------------------------------------------------- the sign
  const MZ = -BD / 2 + 0.2;
  const signTex = canvasTex(1024, 260, (c, w, h) => {
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(255,170,80,0.9)'; c.shadowBlur = 16;
    c.fillStyle = '#ffd59a'; c.font = `700 24px ${MONO}`; if ('letterSpacing' in c) c.letterSpacing = '8px'; c.fillText('SELF-INITIATED', w / 2, 30);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#fff1dc'; fitFont(c, 'Indoor skatepark proposal', w - 40, 74, `800 #px ${SANS}`); c.fillText('Indoor skatepark proposal', w / 2, 105);
    c.shadowBlur = 10; c.fillStyle = 'rgba(255,226,190,0.92)'; fitFont(c, 'A year-round skate and creative space in Ann Arbor', w - 40, 38, `600 #px ${SANS}`);
    c.fillText('A year-round skate and creative space in Ann Arbor', w / 2, 190);
  }).tex;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(9.2, 2.34), new THREE.MeshBasicMaterial({ map: signTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  sign.position.set(0, 4.0, MZ + 0.02); scene.add(sign);

  // ----------------------------------------------------------- skater
  const skater = new THREE.Group(); scene.add(skater);
  const yawG = new THREE.Group(); skater.add(yawG);
  yawG.add(makeBoard());
  const pants = std(0x283552, { roughness: 0.85 }), hoodie = std(0xe2582c, { roughness: 0.8 }), skin = std(0xb98767, { roughness: 0.6 });
  // The rider is the shared lit-loop person (../person.js) in a dark beanie, posed in the board's frame.
  const rider = makePerson(yawG, { skin, top: hoodie, sleeve: hoodie, fore: skin, pants, shoeM: std(0xe9e4da, { roughness: 0.7 }), hairM: std(0x1c1e24, { roughness: 0.9 }), hairCap: 0.56, chestR: 0.155, seed: 4.2 });
  const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
  const vb = new THREE.Vector3(), vc = new THREE.Vector3();
  const feet = [new THREE.Vector3(), new THREE.Vector3()], hands = [new THREE.Vector3(), new THREE.Vector3()];
  const hc = new THREE.Vector3(), top = new THREE.Vector3(), dT = new THREE.Vector3(), sh = new THREE.Vector3(), el = new THREE.Vector3(), look = new THREE.Vector3();
  const FOOT_YAW = [0.12, 0.5], FOOT_X = [0.012, 0.022], FOOT_Z = [0.04, 0.035];

  // Body mechanics: a regular stance across the board, weight that leads into each wall and lags out of it,
  // hips and shoulders that open toward the direction of travel, a pump through every transition and
  // loose arms that trail the body. Everything is a function of t, so any frame can be drawn on its own.
  const vAt = (tt) => (sAt(tt + 0.02) - sAt(tt - 0.02)) / 0.04;
  const sm = (tt, f) => (f(tt - 0.08) + 2 * f(tt) + f(tt + 0.08)) / 4;
  const shAx = new THREE.Vector3(), side = new THREE.Vector3(), up = new THREE.Vector3();
  function pose(t) {
    const s = sAt(t), r = onRamp(s);
    skater.position.set(r.x, r.y + 0.012, LANE);
    skater.rotation.set(0, 0, r.tilt);
    let yaw = 0; AIRS.forEach((ta) => { yaw += Math.PI * eio(k(t, ta - 0.38, ta + 0.04)); });
    yawG.rotation.y = yaw;
    // Velocity in the rider's own frame (flips after each 180), plus a lagged copy for follow-through.
    const flip = Math.cos(yaw);
    const v = sm(t, vAt) * flip, vLag = sm(t - 0.16, vAt) * flip;
    const dir = Math.tanh(v / 1.4), acc = clamp((v - vLag) / 0.16 / 7, -1, 1);
    const trans = clamp((Math.abs(s) - F) / 0.6) * (r.air > 0 ? 0 : 1);
    const tuck = clamp(r.air / 0.45);
    // Pump: compress down into the flat and the bottom of each wall, extend toward the lip.
    const bottom = Math.exp(-Math.pow((Math.abs(s) - F) / 0.55, 2));
    const crouch = clamp(0.24 + 0.26 * bottom + 0.16 * trans + 0.6 * tuck + 0.12 * Math.max(0, 1 - Math.abs(v) / 2.5) + 0.03 * Math.sin(t * 3.1));
    const hh = 0.88 * (1 - 0.34 * crouch);
    // Regular stance: back foot over the tail bolts, front foot over the nose bolts, angled toward the nose.
    feet[0].set(-0.25, 0.15, 0.01); feet[1].set(0.21, 0.15, 0.0);
    // Hips: lead into the wall, lag on the way out, sit back as the knees bend.
    hc.set(-0.02 + 0.06 * dir - 0.05 * acc + Math.sin(t * 2.3) * 0.012, 0.15 + hh, -0.02 - 0.09 * crouch);
    const hipYaw = 0.22 * dir;
    // Spine: forward bend grows with the crouch; it leans into travel and whips back a little on the turn.
    const fwd = 0.22 + 0.5 * crouch;
    dT.set(0.16 * dir - 0.1 * acc, Math.cos(fwd), Math.sin(fwd)).normalize();
    top.copy(hc).addScaledVector(dT, 0.5);
    // Shoulders open further than the hips.
    const shYaw = 0.42 * dir + 0.15 * acc;
    shAx.set(Math.cos(shYaw), 0, -Math.sin(shYaw));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      const lead = Math.max(0, sg * dir);
      sh.copy(top).addScaledVector(dT, -0.04).addScaledVector(shAx, sg * 0.19);
      side.copy(shAx).multiplyScalar(sg);
      // Arms hang loose, rise for balance on the walls and in the air, the leading arm reaches ahead and
      // both trail behind the body's swing.
      const raise = 0.1 * trans + 0.35 * tuck + 0.07 * Math.sin(t * 2.2 + i * 1.9) + 0.12 * lead;
      up.copy(side).multiplyScalar(0.62 + 0.25 * tuck)
        .add(vb.set(-0.22 * acc - 0.1 * dir, -0.78 + raise, 0.18 + 0.18 * lead));
      el.copy(sh).addScaledVector(up.normalize(), 0.29);
      // Elbow stays soft: the forearm bends forward and in, more so in the air.
      vb.copy(side).multiplyScalar(0.3 + 0.2 * tuck).add(vc.set(-0.15 * acc, -0.55 + raise * 1.25, 0.6 + 0.2 * lead)).normalize();
      hands[i].copy(el).addScaledVector(vb, 0.27);
    }
    // Head looks where the board is going.
    look.copy(top).add(vb.set(1.6 * dir, -0.25 - 0.3 * crouch, 1.4));
    // The rider's yaw is the hips'; lean and tilt carry the spine onto dT, and the shoulders twist past.
    const Fh = vb.set(Math.sin(hipYaw), 0, Math.cos(hipYaw)), Sh = vc.set(Math.cos(hipYaw), 0, -Math.sin(hipYaw));
    const lean = dT.dot(Fh) / dT.y, tilt = dT.dot(Sh) / dT.y;
    rider.pose({
      t, hip: hc, yaw: hipYaw, lean, tilt, twist: shYaw - hipYaw, look, kneePole: Fh.clone().addScaledVector(X, 0),
      feet: (i, o) => { o.set(feet[i].x + FOOT_X[i], 0.233, FOOT_Z[i] - 0.05); return 0.15; },
      hands: (i, shp, o) => o.copy(hands[i]),
    });
    for (let i = 0; i < 2; i++) {
      const sh2 = rider.shoe[i];
      sh2.position.set(feet[i].x + FOOT_X[i], 0.188, FOOT_Z[i]);
      sh2.rotation.set(0, FOOT_YAW[i], 0);
    }
  }

  // ----------------------------------------------------------- snow
  const SN = 1600, spos = new Float32Array(SN * 3);
  const sGeo = new THREE.BufferGeometry(); sGeo.setAttribute('position', new THREE.BufferAttribute(spos, 3));
  const flake = canvasTex(32, 32, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const snow = new THREE.Points(sGeo, new THREE.PointsMaterial({ map: flake, color: 0xdfe8ff, size: 0.09, transparent: true, opacity: 0.9, depthWrite: false }));
  snow.frustumCulled = false; scene.add(snow);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [7.5, 2.5, 26]], [2.4, [4.6, 2.2, 20], (x) => x],
    [3.6, [1.8, 2.0, 14]], [4.6, [0.3, 1.9, 7.6], (x) => x],
    [5.5, [-0.7, 1.75, 4.4]], [7.4, [-0.9, 2.0, 5.2], (x) => x],
    [10, [0.35, 2.35, 5.6], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 3.8, 4]], [2.4, [0, 3.4, 4], (x) => x],
    [3.6, [0, 2.5, 2]], [4.6, [0, 1.7, -2]],
    [5.5, [0, 1.35, RZ]], [7.4, [0, 2.0, -2.2], (x) => x],
    [10, [0, 2.4, -2.6], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), col = new THREE.Color();
  const bayLevel = (t, i) => {
    const t0 = BAY_ON[i];
    if (t < t0) return 0;
    if (t < t0 + 0.32) return rnd(Math.floor(t * 28), i + 3) > 0.45 ? 0.9 : 0.12;
    return 1;
  };

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    const inside = k(t, 5.0, 6.0);
    const sx = onRamp(sAt(t)).x;
    camera.position.set(p[0] + Math.sin(t * 0.9) * 0.03, p[1] + Math.sin(t * 1.3 + 1) * 0.02, p[2]);
    tgt.set(q[0] + sx * 0.25 * inside, q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Bays flicker on, left to right.
    let lit = 0;
    for (let i = 0; i < 4; i++) {
      const L = bayLevel(t, i); lit += L / 4;
      col.copy(GLASS_OFF).lerp(WARM, L);
      gables.setColorAt(i, col); clere.setColorAt(i, col);
      col.copy(GLASS_OFF).lerp(BAR_ON, L);
      bars.setColorAt(i * 2, col); bars.setColorAt(i * 2 + 1, col);
      bayGlows[i].material.opacity = 0.55 * L;
    }
    gables.instanceColor.needsUpdate = true; clere.instanceColor.needsUpdate = true; bars.instanceColor.needsUpdate = true;
    key.intensity = 26 * lit;
    fillL.intensity = fillR.intensity = 9 * lit;
    rimIn.intensity = 0.7 * lit;

    // The roll-up door rises with a small jolt, and the warm light pours out.
    const up = eio(k(t, DOOR0, DOOR1)) + 0.03 * Math.sin(Math.PI * k(t, DOOR0, DOOR0 + 0.2));
    door.position.set(0, DOOR_H / 2 + up * (DOOR_H - 0.2), BD / 2 - 0.2);
    spill.material.opacity = 0.55 * up * lit;
    doorGlow.material.opacity = 0.35 * up * lit * (1 - inside);

    pose(t);

    // The sign buzzes on.
    const sOn = t < TITLE ? 0 : t < TITLE + 0.3 ? (rnd(Math.floor(t * 30), 41) > 0.4 ? 0.85 : 0.2) : eo(k(t, TITLE + 0.3, TITLE + 0.6));
    sign.material.opacity = sOn;

    // Snow, falling on a fixed clock so any frame can be drawn on its own.
    for (let i = 0; i < SN; i++) {
      const sp = 0.9 + rnd(i, 51) * 0.7, y0 = rnd(i, 52) * 16;
      const y = 16 - ((y0 + t * sp) % 16);
      spos[i * 3] = (rnd(i, 53) - 0.5) * 34 + Math.sin(t * 0.8 + i) * 0.35;
      spos[i * 3 + 1] = y;
      spos[i * 3 + 2] = BD / 2 + 0.8 + rnd(i, 54) * 24 + Math.cos(t * 0.6 + i * 0.7) * 0.3;
    }
    sGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.55 };
}
