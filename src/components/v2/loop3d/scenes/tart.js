// TART lit loop, 10 s. "One gateway for giving, whatever you pay with."
// A plum-dark studio with a single glowing ring: the TART gateway. It wakes facing camera with its name
// in the membrane, then turns to the flow. On the near side wait the ways to pay: a card and a bank
// (traditional) and a coin (Web3). Each in turn flies through the ring and comes out the far side as a
// heart that drops into one of three glass jars. Then everything flows at once, the jars fill with light,
// and the ring swings back to camera with the name and one line.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const PINK = 0xff3d7f, GOLD = 0xf2b84b, MINT = 0x3fd6b0, VIOLET = 0x8b6bff;
const F = 'Inter, system-ui, sans-serif', M = '"JetBrains Mono", monospace';
const C = new THREE.Vector3(0, 0.85, 0);                 // the gateway's center
const A = new THREE.Vector3(1, 0, -0.45).normalize();    // direction of flow, near side to far side
const P = new THREE.Vector3(-A.z, 0, A.x);               // across the flow, toward the camera
// Ways to pay: 0 card, 1 coin (Web3), 2 bank. Offsets across the flow.
const IN_OFF = [0.42, -0.42, 0.0];
const JAR_OFF = [0.42, 0.0, -0.42];
const HERO = [2.05, 3.05, 4.05];                         // each hero payment leaves its pad
const HFLY = 0.75;
const SN = 18, S0 = 5.1, SGAP = 0.11, SFLY = 0.55;       // the stream: everything at once
const HEART_T = 0.9;                                     // ring to jar
const JAR_CAP = 1 + SN / 3;

const inPos = (i, out = new THREE.Vector3()) => out.copy(C).addScaledVector(A, -1.15).addScaledVector(P, IN_OFF[i]).setY(0.64);
const jarPos = (j, out = new THREE.Vector3()) => out.copy(C).addScaledVector(A, 1.15).addScaledVector(P, JAR_OFF[j]).setY(0);

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c050a);
  scene.fog = new THREE.Fog(0x0c050a, 3.6, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- studio
  const floor = mesh(new THREE.PlaneGeometry(18, 14), std(0xffffff, { map: grainTex('#1a0c16', { size: 256, speck: 0.05, blot: 0.1, seed: 12, repeat: 8 }), roughness: 0.2, metalness: 0.5 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const backTex = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#0c050a'; c.fillRect(0, 0, w, h);
    const g = c.createRadialGradient(w * 0.52, h * 0.62, 4, w * 0.52, h * 0.62, w * 0.5);
    g.addColorStop(0, 'rgba(120,36,92,1)'); g.addColorStop(0.45, 'rgba(58,18,58,0.9)'); g.addColorStop(1, 'rgba(12,5,10,1)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  });
  const backdrop = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: backTex.tex, fog: false, depthWrite: false }));
  backdrop.position.set(1.5, 3.2, -6.5); backdrop.renderOrder = -1; scene.add(backdrop);
  // Pools of light on the glossy floor (flat additive decals).
  const poolTex = canvasTex(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const pool = (color, size, x, z, op) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: poolTex, color, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.003, z); scene.add(m); return m;
  };
  const ringPool = pool(PINK, 2.6, C.x, C.z, 0.2);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xb08ad0, 0x0a0308, 0.32));
  const key = new THREE.SpotLight(0xffe2ea, 0, 0, 0.62, 0.7, 1.3);
  key.position.set(-1.3, 3.1, 1.9); key.target.position.set(0, 0.45, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 8; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rimA = new THREE.DirectionalLight(0x7d6bff, 1.5); rimA.position.set(-2.2, 1.6, -2.6); scene.add(rimA);
  const rimB = new THREE.DirectionalLight(0xff4f8a, 1.1); rimB.position.set(2.6, 1.0, -2.0); scene.add(rimB);
  const core = new THREE.PointLight(PINK, 0, 3.2, 1.6); core.position.copy(C); scene.add(core);

  // ----------------------------------------------------------- the gateway
  const gate = new THREE.Group(); gate.position.copy(C); scene.add(gate);
  const ringM = std(0x2a1824, { metalness: 1, roughness: 0.22, envMapIntensity: 1.3 });
  gate.add(mesh(new THREE.TorusGeometry(0.53, 0.055, 28, 120), ringM));
  const bandM = new THREE.MeshBasicMaterial({ color: PINK, toneMapped: false });
  const band = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.011, 8, 120), bandM); gate.add(band);
  const swirl = canvasTex(512, 512, (c, w) => {
    c.clearRect(0, 0, w, w);
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,120,170,0.55)'); g.addColorStop(0.6, 'rgba(160,70,200,0.25)'); g.addColorStop(0.95, 'rgba(255,61,127,0.5)'); g.addColorStop(1, 'rgba(255,61,127,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
    c.translate(w / 2, w / 2);
    for (let arm = 0; arm < 5; arm++) {
      c.strokeStyle = `rgba(255,${180 + arm * 12},${220 - arm * 10},0.32)`; c.lineWidth = 6;
      c.beginPath();
      for (let s = 0; s <= 60; s++) { const r = s * 3.8, a0 = arm * Math.PI * 0.4 + s * 0.09; const x = Math.cos(a0) * r, y = Math.sin(a0) * r; s ? c.lineTo(x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  });
  const membrane = new THREE.Mesh(new THREE.CircleGeometry(0.47, 64), new THREE.MeshBasicMaterial({ map: swirl.tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  gate.add(membrane);
  const markTex = canvasTex(512, 512, (c, w) => {
    c.clearRect(0, 0, w, w);
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(255,61,127,0.9)'; c.shadowBlur = 24;
    c.fillStyle = '#ffe6ef'; c.font = `900 150px ${F}`;
    if ('letterSpacing' in c) c.letterSpacing = '10px';
    c.fillText('TART', w / 2 + 5, w / 2 - 14);
    c.shadowBlur = 0;
    if ('letterSpacing' in c) c.letterSpacing = '5px';
    c.fillStyle = 'rgba(255,214,228,0.75)'; c.font = `700 30px ${M}`; c.fillText('SELF-INITIATED', w / 2 + 3, w / 2 + 92);
  });
  const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 0.88), new THREE.MeshBasicMaterial({ map: markTex.tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  mark.position.z = 0.004; gate.add(mark);
  const gateGlow = glow(PINK, 2.2, 0, 0.45); gate.add(gateGlow);
  // Plinth under the floating ring.
  const plinth = mesh(new THREE.CylinderGeometry(0.34, 0.4, 0.07, 64), std(0x150a12, { roughness: 0.18, metalness: 0.7 }));
  plinth.position.set(C.x, 0.035, C.z); scene.add(plinth);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.37, 0.006, 6, 96), bandM);
  lip.rotation.x = Math.PI / 2; lip.position.set(C.x, 0.071, C.z); scene.add(lip);
  const beam = glow(PINK, 1, 0, 0.5); beam.position.set(C.x, 0.38, C.z); beam.scale.set(0.35, 0.8, 1); scene.add(beam);

  // ----------------------------------------------------------- the ways to pay
  const pads = [0, 1, 2].map((i) => {
    const p = inPos(i);
    const pad = mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.022, 48), std(0x1c0f19, { roughness: 0.2, metalness: 0.8 }));
    pad.position.set(p.x, 0.44, p.z); scene.add(pad);
    const g = glow([PINK, GOLD, MINT][i], 0.55, 0.25, 0.45); g.position.set(p.x, 0.42, p.z); g.scale.set(0.6, 0.2, 1); scene.add(g);
    const pl = pool([PINK, GOLD, MINT][i], 0.7, p.x, p.z, 0.16);
    return { pad, g, pl };
  });
  // Card
  const cardFace = canvasTex(512, 324, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#ff3d7f'); g.addColorStop(1, '#6a1d6e');
    c.fillStyle = g; roundRect(c, 0, 0, w, h, 30); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.08)'; c.beginPath(); c.arc(w * 0.85, h * 0.1, 200, 0, 7); c.fill();
    const cg = c.createLinearGradient(40, 110, 120, 180); cg.addColorStop(0, '#f8d78a'); cg.addColorStop(1, '#b8862f');
    c.fillStyle = cg; roundRect(c, 44, 112, 82, 64, 10); c.fill();
    c.strokeStyle = 'rgba(90,60,20,0.6)'; c.lineWidth = 2; c.strokeRect(58, 124, 54, 40);
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 5;
    for (let r = 0; r < 3; r++) { c.beginPath(); c.arc(170, 144, 14 + r * 12, -0.8, 0.8); c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,0.85)';
    for (let gI = 0; gI < 4; gI++) for (let d = 0; d < 4; d++) { c.beginPath(); c.arc(50 + gI * 104 + d * 18, 238, 5, 0, 7); c.fill(); }
  });
  const makeCard = () => {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(0.34, 0.215, 0.012, 2, 0.006), std(0x3a1030, { metalness: 0.6, roughness: 0.3 })));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.336, 0.212), std(0xffffff, { map: cardFace.tex, roughness: 0.32, metalness: 0.2, transparent: true }));
    f.position.z = 0.0065; g.add(f);
    return g;
  };
  // Coin
  const coinFace = canvasTex(256, 256, (c, w) => {
    const g = c.createRadialGradient(w * 0.4, w * 0.35, 4, w / 2, w / 2, w / 2); g.addColorStop(0, '#ffe7a6'); g.addColorStop(1, '#b77e22');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
    c.strokeStyle = 'rgba(110,70,10,0.7)'; c.lineWidth = 8; c.beginPath(); c.arc(w / 2, w / 2, w * 0.42, 0, 7); c.stroke();
    c.lineWidth = 10; c.beginPath();
    for (let s = 0; s <= 6; s++) { const a0 = Math.PI / 6 + s * Math.PI / 3, x = w / 2 + Math.cos(a0) * w * 0.26, y = w / 2 + Math.sin(a0) * w * 0.26; s ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.stroke();
    c.beginPath(); c.moveTo(w / 2, w / 2 - w * 0.26); c.lineTo(w / 2, w / 2 + w * 0.26); c.stroke();
  });
  const coinSide = std(GOLD, { metalness: 1, roughness: 0.3 }), coinCap = std(0xffffff, { map: coinFace.tex, metalness: 0.9, roughness: 0.3 });
  const makeCoin = () => { const m = mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.026, 48), [coinSide, coinCap, coinCap]); m.rotation.x = Math.PI / 2; const g = new THREE.Group(); g.add(m); return g; };
  // Bank: a little stone temple.
  const makeBank = () => {
    const g = new THREE.Group(), stone = std(0x9fc9bc, { roughness: 0.45 }), trim = std(0x2a6e5f, { roughness: 0.4, metalness: 0.3 });
    const base = mesh(new THREE.BoxGeometry(0.3, 0.03, 0.18), trim); base.position.y = -0.09; g.add(base);
    const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.02, 0.13, 14), stone, 4);
    [-0.105, -0.035, 0.035, 0.105].forEach((x, i) => cols.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, -0.01, 0.03)));
    cols.castShadow = true; g.add(cols);
    const back2 = mesh(new THREE.BoxGeometry(0.26, 0.13, 0.08), stone); back2.position.set(0, -0.01, -0.04); g.add(back2);
    const roof = mesh(new THREE.BoxGeometry(0.31, 0.025, 0.19), trim); roof.position.y = 0.068; g.add(roof);
    const ped = mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.3, 3, 1), stone);
    ped.rotation.set(-Math.PI / 2, 0, Math.PI / 2); ped.scale.set(1, 1, 0.55); ped.position.y = 0.106; g.add(ped);
    return g;
  };
  const heroes = [makeCard(), makeCoin(), makeBank()];
  heroes.forEach((h) => scene.add(h));
  const trails = [PINK, GOLD, MINT].map((c) => { const g = glow(c, 0.5, 0, 0.35); scene.add(g); return g; });
  const tagTrad = label('TRADITIONAL', { font: `700 54px ${M}`, fg: '#f4d9e6', h: 0.15, track: 4 });
  const tagWeb3 = label('WEB3', { font: `700 54px ${M}`, fg: '#ffd88a', h: 0.15, track: 4 });
  scene.add(tagTrad, tagWeb3);

  // ----------------------------------------------------------- the jars
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xf2d8ea, roughness: 0.06, metalness: 0, transparent: true, opacity: 0.2, clearcoat: 1, clearcoatRoughness: 0.05, side: THREE.DoubleSide, depthWrite: false });
  const JC = [0xff3d7f, 0xff7a5c, 0xb36bff];
  const jars = [0, 1, 2].map((j) => {
    const p = jarPos(j), g = new THREE.Group(); g.position.copy(p); scene.add(g);
    const foot = mesh(new THREE.CylinderGeometry(0.2, 0.21, 0.04, 48), std(0x1c0f19, { roughness: 0.25, metalness: 0.8 })); foot.position.y = 0.02; g.add(foot);
    const liqM = std(JC[j], { emissive: JC[j], emissiveIntensity: 0.6, roughness: 0.25, transparent: true, opacity: 0.92 });
    const lg = new THREE.CylinderGeometry(0.155, 0.155, 1, 40); lg.translate(0, 0.5, 0);
    const liq = mesh(lg, liqM, { cast: false }); liq.position.y = 0.045; g.add(liq);
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.172, 0.172, 0.46, 48, 1, true), glassM); glass.position.y = 0.27; g.add(glass);
    const rimJ = mesh(new THREE.TorusGeometry(0.172, 0.01, 8, 48), std(0xd6c2cf, { metalness: 1, roughness: 0.25 }), { cast: false }); rimJ.rotation.x = Math.PI / 2; rimJ.position.y = 0.5; g.add(rimJ);
    const top = glow(JC[j], 0.6, 0, 0.4); g.add(top);
    const pl = pool(JC[j], 1.1, p.x, p.z, 0);
    return { g, liq, liqM, top, pl };
  });

  // ----------------------------------------------------------- hearts and the stream (instanced)
  const hs = new THREE.Shape();
  hs.moveTo(0, -0.5);
  hs.bezierCurveTo(-0.15, -0.32, -0.55, -0.1, -0.55, 0.18);
  hs.bezierCurveTo(-0.55, 0.42, -0.36, 0.55, -0.22, 0.55);
  hs.bezierCurveTo(-0.1, 0.55, 0, 0.47, 0, 0.36);
  hs.bezierCurveTo(0, 0.47, 0.1, 0.55, 0.22, 0.55);
  hs.bezierCurveTo(0.36, 0.55, 0.55, 0.42, 0.55, 0.18);
  hs.bezierCurveTo(0.55, -0.1, 0.15, -0.32, 0, -0.5);
  const hg = new THREE.ExtrudeGeometry(hs, { depth: 0.22, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.08, bevelSegments: 4, curveSegments: 16 });
  hg.center(); hg.scale(0.15, 0.15, 0.15);
  const HN = 3 + SN;
  const hearts = new THREE.InstancedMesh(hg, std(PINK, { emissive: PINK, emissiveIntensity: 0.75, roughness: 0.28, metalness: 0.1 }), HN);
  hearts.castShadow = true; hearts.frustumCulled = false; scene.add(hearts);
  // Each heart: when it leaves the ring and which jar it falls into.
  const HT = [], HJ = [];
  HERO.forEach((h, i) => { HT.push(h + HFLY); HJ.push([0, 1, 2][i]); });
  for (let s = 0; s < SN; s++) { HT.push(S0 + s * SGAP + SFLY); HJ.push(s % 3); }
  const miniCards = new THREE.InstancedMesh(new RoundedBoxGeometry(0.17, 0.108, 0.008, 1, 0.004), std(0xffffff, { roughness: 0.3, metalness: 0.4, emissive: 0x200810, emissiveIntensity: 1 }), SN);
  const miniCoins = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.014, 28), std(GOLD, { metalness: 1, roughness: 0.3, emissive: 0x3a2200, emissiveIntensity: 0.8 }), SN);
  const cP = new THREE.Color(PINK), cM = new THREE.Color(MINT);
  for (let s = 0; s < SN; s++) miniCards.setColorAt(s, s % 3 === 2 ? cM : cP);
  [miniCards, miniCoins].forEach((m) => { m.castShadow = true; m.frustumCulled = false; scene.add(m); });

  // Motes drifting in the plum haze.
  const DN = 180, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const motes = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xff9cc4, size: 0.012, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  motes.frustumCulled = false; scene.add(motes);

  // ----------------------------------------------------------- the line
  const lineTex = canvasTex(1024, 220, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(24,8,20,0.8)'; roundRect(c, 4, 4, w - 8, h - 8, 34); c.fill();
    c.strokeStyle = 'rgba(255,61,127,0.85)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#ffe6ef'; c.font = `700 58px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Charitable giving across', w / 2, 76);
    c.fillStyle = '#ffb3cf'; c.fillText('traditional and Web3 payments', w / 2, 148);
  });
  const line = new THREE.Mesh(new THREE.PlaneGeometry(1.72, 0.37), new THREE.MeshBasicMaterial({ map: lineTex.tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  line.renderOrder = 5; scene.add(line);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.4, 1.2, 3.4]], [1.9, [-0.62, 1.12, 3.15], (x) => x],
    [4.9, [-0.3, 0.98, 2.75]], [7.2, [0.15, 1.32, 3.25], (x) => x],
    [8.6, [-0.42, 1.14, 3.1]], [10, [-0.48, 1.12, 2.92], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 0.92, 0]], [1.9, [-0.2, 0.76, 0.1], (x) => x],
    [4.9, [0.02, 0.72, 0]], [7.2, [0.42, 0.6, -0.3], (x) => x],
    [8.6, [0, 1.08, 0]], [10, [0, 1.1, 0], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3(), v = new THREE.Vector3();
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), e4 = new THREE.Euler();
  const bez = (p0, p1, p2, e, out) => out.set(
    (1 - e) * (1 - e) * p0.x + 2 * (1 - e) * e * p1.x + e * e * p2.x,
    (1 - e) * (1 - e) * p0.y + 2 * (1 - e) * e * p1.y + e * e * p2.y,
    (1 - e) * (1 - e) * p0.z + 2 * (1 - e) * e * p1.z + e * e * p2.z,
  );
  const thFlow = Math.atan2(-A.x, -A.z), thP = Math.atan2(P.x, P.z);
  const hide = new THREE.Vector3(0, -50, 0);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.5 + 1) * 0.006, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Pulses: every payment that reaches the ring flashes it.
    let pulse = 0;
    for (let i = 0; i < HN; i++) { const d = t - HT[i]; if (d >= 0) pulse = Math.max(pulse, (i < 3 ? 1 : 0.6) * Math.exp(-7 * d)); }

    // Beat 1: the ring wakes facing camera with its name, then turns to the flow.
    const wake = clamp(back(k(t, 0.2, 0.9)));
    key.intensity = 26 * wake;
    const face = 1 - eio(k(t, 1.35, 2.0)) + back(k(t, 7.95, 8.65));
    const thCam = Math.atan2(camera.position.x - C.x, camera.position.z - C.z);
    gate.rotation.y = lerp(thFlow, thCam, face);
    gate.position.y = C.y + Math.sin(t * 1.4) * 0.012;
    bandM.color.setHex(PINK).multiplyScalar(0.35 + 0.65 * wake + 0.6 * pulse);
    membrane.material.opacity = (0.5 + 0.4 * pulse) * wake;
    membrane.rotation.z = -t * 0.7;
    mark.material.opacity = clamp(face) * wake;
    gateGlow.material.opacity = (0.22 + 0.5 * pulse) * wake;
    gateGlow.scale.setScalar(2.0 + pulse * 0.5);
    core.intensity = (0.8 + 4 * pulse) * wake;
    ringPool.material.opacity = (0.12 + 0.2 * pulse) * wake;
    beam.material.opacity = 0.25 * wake;

    // Labels over the pads, turned to camera.
    const lab = eo(k(t, 0.9, 1.5)) * (1 - eo(k(t, 7.8, 8.4)));
    inPos(0, a); inPos(2, b); tagTrad.position.set((a.x + b.x) / 2, 0.98, (a.z + b.z) / 2);
    inPos(1, a); tagWeb3.position.set(a.x, 0.98, a.z);
    [tagTrad, tagWeb3].forEach((l) => { l.lookAt(camera.position); l.material.opacity = lab; l.visible = lab > 0.01; });

    // Beat 2: each way to pay flies through the ring in turn, then is back on its pad.
    heroes.forEach((h, i) => {
      inPos(i, a); a.y += Math.sin(t * 1.8 + i * 2) * 0.02;
      const L = HERO[i], f = eio(k(t, L, L + HFLY)), back2 = back(k(t, L + HFLY + 0.4, L + HFLY + 0.85));
      const flying = t > L && t < L + HFLY;
      mid.lerpVectors(a, C, 0.5); mid.y += 0.32;
      if (flying) bez(a, mid, C, f, h.position); else h.position.copy(a);
      const s = flying ? lerp(1, 0.25, ei(f)) : t >= L + HFLY ? Math.max(0.001, back2) : 1;
      h.scale.setScalar(s * (i === 2 ? 1.1 : 1));
      const turn = i === 1 ? t * 1.6 : Math.sin(t * 1.2 + i) * 0.35;
      h.rotation.set(i === 0 ? -0.25 : 0, thP + turn + f * Math.PI * 2, i === 0 ? Math.sin(t + i) * 0.08 : 0);
      trails[i].position.copy(h.position);
      trails[i].material.opacity = 0.9 * Math.sin(Math.PI * f) * (flying ? 1 : 0);
      // Pads flash as their payment launches, and again during the stream.
      let pf = Math.exp(-6 * Math.max(0, t - L)) * (t > L ? 1 : 0);
      for (let s2 = i; s2 < SN; s2 += 3) { const d = t - (S0 + s2 * SGAP); if (d >= 0) pf = Math.max(pf, 0.7 * Math.exp(-8 * d)); }
      pads[i].g.material.opacity = (0.25 + 0.7 * pf) * wake;
      pads[i].pl.material.opacity = (0.1 + 0.25 * pf) * wake;
    });

    // Beat 3: the stream. Cards and banks as small cards, Web3 as coins, all into the ring.
    for (let s = 0; s < SN; s++) {
      const type = s % 3, L = S0 + s * SGAP, f = eio(k(t, L, L + SFLY));
      const on = t > L && t < L + SFLY;
      inPos(type, a); a.addScaledVector(P, (rnd(s, 4) - 0.5) * 0.12);
      mid.lerpVectors(a, C, 0.5); mid.y += 0.22 + rnd(s, 6) * 0.2; mid.addScaledVector(P, (rnd(s, 5) - 0.5) * 0.3);
      bez(a, mid, C, f, v);
      const sc = on ? back(k(t, L, L + 0.18)) * lerp(1, 0.3, ei(f)) : 0;
      q4.setFromEuler(e4.set(type === 1 ? Math.PI / 2 : -0.2, thP + f * 5 + s, type === 1 ? 0 : f * 0.6));
      m4.compose(on ? v : hide, q4, s4.setScalar(Math.max(0.0001, sc)));
      if (type === 1) { miniCoins.setMatrixAt(s, m4); miniCards.setMatrixAt(s, m4.compose(hide, q4, s4.setScalar(0.0001))); }
      else { miniCards.setMatrixAt(s, m4); miniCoins.setMatrixAt(s, m4.compose(hide, q4, s4.setScalar(0.0001))); }
    }
    miniCards.instanceMatrix.needsUpdate = true; miniCoins.instanceMatrix.needsUpdate = true;

    // Hearts: out of the far side of the ring, an arc, down into a jar.
    const fill = [0, 0, 0];
    for (let i = 0; i < HN; i++) {
      const te = HT[i], j = HJ[i], f = eio(k(t, te, te + HEART_T));
      fill[j] += eo(k(t, te + HEART_T - 0.05, te + HEART_T + 0.4)) / JAR_CAP;
      const on = t > te && t < te + HEART_T;
      jarPos(j, b); b.y = 0.5;
      a.copy(C).addScaledVector(A, 0.08);
      mid.lerpVectors(a, b, 0.5); mid.y += 0.55 + rnd(i, 2) * 0.15; mid.addScaledVector(P, (rnd(i, 3) - 0.5) * 0.25);
      bez(a, mid, b, f, v);
      const sc = (i < 3 ? 1.35 : 1) * back(k(t, te, te + 0.3)) * (1 - 0.75 * ei(k(t, te + HEART_T - 0.2, te + HEART_T)));
      q4.setFromEuler(e4.set(0, thCam + Math.sin(t * 3 + i) * 0.6, Math.sin(t * 2 + i) * 0.15));
      hearts.setMatrixAt(i, m4.compose(on ? v : hide, q4, s4.setScalar(on ? Math.max(0.0001, sc) : 0.0001)));
    }
    hearts.instanceMatrix.needsUpdate = true;
    jars.forEach(({ liq, liqM, top, pl }, j) => {
      const fl = clamp(fill[j]);
      liq.scale.y = Math.max(0.001, 0.02 + fl * 0.4);
      liq.visible = fl > 0.001;
      liqM.emissiveIntensity = 0.5 + 0.6 * fl;
      top.position.y = 0.06 + fl * 0.4; top.material.opacity = 0.7 * fl;
      pl.material.opacity = 0.32 * fl;
    });

    // Beat 4: the ring faces camera again with its name; the line arrives above it.
    const e = back(k(t, 8.35, 8.9));
    v.set(camera.position.x - C.x, 0, camera.position.z - C.z).normalize();
    line.position.set(C.x + v.x * 0.3, 1.56 + (1 - clamp(e)) * -0.05, C.z + v.z * 0.3);
    line.lookAt(camera.position);
    line.scale.setScalar(Math.max(0.001, 0.94 + 0.06 * e));
    line.material.opacity = clamp(e);
    line.visible = e > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (rnd(i, 21) - 0.5) * 5 + Math.sin(t * 0.3 + i) * 0.15;
      dpos[i * 3 + 1] = 0.1 + rnd(i, 22) * 2.2 + Math.sin(t * 0.5 + i * 1.3) * 0.05 + t * 0.012;
      dpos[i * 3 + 2] = (rnd(i, 23) - 0.6) * 4 + Math.cos(t * 0.25 + i) * 0.12;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 9.1 };
}
