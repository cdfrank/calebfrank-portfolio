// New York Lottery Live Drawing and Integrity pages lit loop, 10 s. "Drawn live, shown fair."
// A late-night broadcast studio. Under one key light a glass air-mix drawing machine tumbles its balls
// while the LED wall behind boots to LIVE. Five balls are blown up the riser one at a time, ride the
// glass chute down and roll into the results tube, and each one lands on the wall the moment it stops.
// A verification light sweeps the row, a gold shield turns in and stamps its check (fair play,
// responsible gaming), and the camera pulls back to the whole set with the project title on the wall.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const MAG = 0xff2f8e, CYAN = 0x3fe0ff, GOLD = 0xffc629, MINT = 0x3dffb0;
const NUMS = ['07', '14', '22', '31', '45'];
const BALL_C = ['#ffc629', '#ff2f8e', '#3fe0ff', '#9b6bff', '#ff7a2f'];
const DRAW = [1.2, 1.85, 2.5, 3.15, 3.8];          // each ball leaves the mix
const BR = 0.085;                                  // ball radius
const MX = 0.78, MY = 0.94, MR = 0.42;              // drawing machine globe
const RY = 0.52, RZ = 0.35;                        // results tube axis
const TUBE_L = -1.32, ENTRY = -0.06;               // closed end and entry of the results tube
const SLOT = NUMS.map((_, i) => TUBE_L + 0.015 + BR + i * (2 * BR + 0.012));
const ROLL = SLOT.map((s) => 0.3 + (ENTRY - s) * 0.45); // roll time along the tube
const LAND = DRAW.map((d, i) => d + 1.0 + ROLL[i]);       // ball comes to rest
const SCAN = [5.75, 6.45];                         // verification sweep
const SHIELD = 6.35;                               // shield turns in
const SX = -1.06, SY = 1.12, SZ = 0.32;            // shield spot

function ballTex(num, col) {
  return canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = col; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.18)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // The number sits on a cream disc at u = 0.25 (faces +z) and again at u = 0.75.
    [64, 192].forEach((x) => {
      c.fillStyle = '#f2ece2'; c.beginPath(); c.arc(x, h / 2, 31, 0, 7); c.fill();
      c.fillStyle = '#1a1030'; c.font = `700 30px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(num, x, h / 2 + 2);
    });
  }).tex;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07040d);
  scene.fog = new THREE.Fog(0x07040d, 4.5, 12);
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- studio
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#140b20', { size: 512, speck: 0.04, blot: 0.1, seed: 31, repeat: 6 }), roughness: 0.22, metalness: 0.5 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Light pools on the floor under the practicals.
  const poolTex = canvasTex(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.4, 'rgba(255,255,255,0.3)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const pool = (color, sx, sz, x, z, o) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), new THREE.MeshBasicMaterial({ map: poolTex, color, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(x, 0.003, z); scene.add(m); return m;
  };
  const machinePool = pool(CYAN, 1.7, 1.7, MX, 0, 0.0);
  const tubePool = pool(MAG, 2.2, 1.0, -0.67, RZ + 0.1, 0.0);

  // LED wall: the live results board, and later the project title.
  const WW = 4.4, WH = 1.3, WY = 1.95, WZ = -1.35;
  const wall = canvasTex(1024, 302);
  const wallM = new THREE.MeshBasicMaterial({ map: wall.tex, toneMapped: false, fog: false, color: 0xdedede });
  const wallMesh = new THREE.Mesh(new THREE.PlaneGeometry(WW, WH), wallM);
  wallMesh.position.set(-0.1, WY, WZ); scene.add(wallMesh);
  const bezel = mesh(new THREE.BoxGeometry(WW + 0.12, WH + 0.12, 0.08), std(0x0d0912, { roughness: 0.4, metalness: 0.6 }), { cast: false });
  bezel.position.set(-0.1, WY, WZ - 0.045); scene.add(bezel);
  const wallGlow = glow(0x8a3dff, 5.5, 0, 0.55); wallGlow.position.set(-0.1, WY, WZ - 0.1); wallGlow.scale.set(6.5, 2.4, 1); scene.add(wallGlow);
  // Vertical light bars flanking the wall: magenta and cyan, mirrored in the floor.
  [[-2.55, MAG], [-2.85, CYAN], [2.35, CYAN], [2.65, MAG]].forEach(([x, c], i) => {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 1.9), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
    b.position.set(x, 1.15, -1.25 - (i % 2) * 0.25); scene.add(b);
    const g = glow(c, 1, 0.32, 0.5); g.position.copy(b.position); g.scale.set(0.55, 2.6, 1); scene.add(g);
  });
  // Studio cans hanging above, out of focus.
  for (let i = 0; i < 5; i++) { const g = glow(0xffd9b0, 0.5, 0.5, 0.35); g.position.set(-1.8 + i * 0.9, 3.05, -0.9); scene.add(g); }

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5b3f8f, 0x07040d, 0.35));
  const key = new THREE.SpotLight(0xfff0e0, 0, 0, 0.6, 0.7, 1.4);
  key.position.set(-0.6, 3.4, 2.4); key.target.position.set(-0.15, 0.7, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 7; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rimM = new THREE.DirectionalLight(MAG, 1.5); rimM.position.set(2.5, 1.6, -2.4); scene.add(rimM);
  const rimC = new THREE.DirectionalLight(CYAN, 1.1); rimC.position.set(-2.6, 1.4, -2.2); scene.add(rimC);
  const upL = new THREE.PointLight(0x6fe6ff, 0, 1.6, 1.5); upL.position.set(MX, MY - 0.28, 0); scene.add(upL);
  const tubeL = new THREE.PointLight(0xff4fa0, 0, 1.6, 1.5); tubeL.position.set(-0.67, 0.32, RZ + 0.35); scene.add(tubeL);
  const stampL = new THREE.PointLight(MINT, 0, 1.4, 1.6); stampL.position.set(SX + 0.1, SY, SZ + 0.35); scene.add(stampL);

  // ----------------------------------------------------------- shared materials
  const glass = (o, side = THREE.FrontSide) => new THREE.MeshPhysicalMaterial({ color: 0xe8f4ff, transparent: true, opacity: o, roughness: 0.04, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.04, envMapIntensity: 1.6, depthWrite: false, side });
  const chrome = std(0xd2d4dc, { metalness: 1, roughness: 0.2, envMapIntensity: 1.3 });
  const lacquer = std(0x150f20, { roughness: 0.3, metalness: 0.5 });

  // ----------------------------------------------------------- the drawing machine
  const base = mesh(new THREE.CylinderGeometry(0.26, 0.34, 0.46, 48), lacquer); base.position.set(MX, 0.23, 0); scene.add(base);
  const baseRing = mesh(new THREE.TorusGeometry(0.265, 0.014, 10, 64), chrome); baseRing.rotation.x = Math.PI / 2; baseRing.position.set(MX, 0.46, 0); scene.add(baseRing);
  const collar = mesh(new THREE.CylinderGeometry(0.15, 0.21, 0.08, 40), chrome); collar.position.set(MX, 0.5, 0); scene.add(collar);
  const ledM = new THREE.MeshBasicMaterial({ color: MAG, toneMapped: false });
  const led = new THREE.Mesh(new THREE.TorusGeometry(0.336, 0.008, 8, 72), ledM); led.rotation.x = Math.PI / 2; led.position.set(MX, 0.06, 0); scene.add(led);
  const globeBack = new THREE.Mesh(new THREE.SphereGeometry(MR, 48, 32), glass(0.08, THREE.BackSide)); globeBack.position.set(MX, MY, 0); globeBack.renderOrder = 1; scene.add(globeBack);
  const globe = new THREE.Mesh(new THREE.SphereGeometry(MR, 48, 32), glass(0.15)); globe.position.set(MX, MY, 0); globe.renderOrder = 3; scene.add(globe);
  const eq = mesh(new THREE.TorusGeometry(MR + 0.006, 0.012, 10, 96), chrome, { cast: false }); eq.rotation.x = Math.PI / 2; eq.position.set(MX, MY, 0); scene.add(eq);
  const mer = mesh(new THREE.TorusGeometry(MR + 0.006, 0.01, 10, 96), chrome, { cast: false }); mer.position.set(MX, MY, 0); scene.add(mer);
  const globeGlow = glow(CYAN, 1.6, 0, 0.5); globeGlow.position.set(MX, MY - 0.1, -0.2); scene.add(globeGlow);
  // Mixing paddle: two arms turning twice per loop, so the seam lines up.
  const paddle = new THREE.Group(); paddle.position.set(MX, MY, 0); scene.add(paddle);
  [0, Math.PI / 2].forEach((r) => { const a = mesh(new THREE.BoxGeometry(0.7, 0.018, 0.018), chrome, { cast: false }); a.rotation.z = r; paddle.add(a); });
  const hub = mesh(new THREE.SphereGeometry(0.03, 16, 12), chrome, { cast: false }); paddle.add(hub);

  // The mix: instanced balls tumbling in the air jets.
  const MIXN = 24;
  const mixM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 });
  const mix = new THREE.InstancedMesh(new THREE.SphereGeometry(BR * 0.92, 20, 14), mixM, MIXN);
  mix.castShadow = true; mix.receiveShadow = false;
  const MIXC = ['#ffc629', '#ff2f8e', '#3fe0ff', '#9b6bff', '#ff7a2f', '#ede6da'];
  for (let j = 0; j < MIXN; j++) mix.setColorAt(j, new THREE.Color(MIXC[Math.floor(rnd(j, 41) * MIXC.length)]));
  scene.add(mix);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s1 = new THREE.Vector3(1, 1, 1), p4 = new THREE.Vector3();
  const RMAX = MR - BR - 0.025, MC = new THREE.Vector3(MX, MY, 0);

  // ----------------------------------------------------------- riser and chute
  const chuteCurve = new THREE.CatmullRomCurve3([
    [MX, MY + MR - 0.09, 0], [MX, 1.62, 0], [MX - 0.09, 1.79, 0.05], [0.47, 1.8, 0.14], [0.28, 1.45, 0.26],
    [0.16, 0.86, 0.33], [0.07, 0.565, RZ], [ENTRY, RY, RZ],
  ].map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const CHUTE_L = chuteCurve.getLength();
  const chute = new THREE.Mesh(new THREE.TubeGeometry(chuteCurve, 120, BR + 0.022, 16, false), glass(0.13, THREE.DoubleSide));
  chute.renderOrder = 4; scene.add(chute);

  // ----------------------------------------------------------- results tube on its plinth
  const plinth = mesh(new RoundedBoxGeometry(1.6, 0.3, 0.42, 3, 0.03), lacquer); plinth.position.set(-0.67, 0.15, RZ); scene.add(plinth);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.012, 0.012), ledM); strip.position.set(-0.67, 0.27, RZ + 0.212); scene.add(strip);
  [-1.15, -0.2].forEach((x) => { const s = mesh(new THREE.BoxGeometry(0.05, 0.14, 0.16), chrome); s.position.set(x, 0.36, RZ); scene.add(s); });
  const capL = mesh(new THREE.CylinderGeometry(BR + 0.03, BR + 0.03, 0.024, 32), chrome); capL.rotation.z = Math.PI / 2; capL.position.set(TUBE_L - 0.012, RY, RZ); scene.add(capL);
  const tubeLen = ENTRY - TUBE_L + 0.04;
  const rtube = new THREE.Mesh(new THREE.CylinderGeometry(BR + 0.022, BR + 0.022, tubeLen, 40, 1, true), glass(0.14, THREE.DoubleSide));
  rtube.rotation.z = Math.PI / 2; rtube.position.set(TUBE_L + tubeLen / 2, RY, RZ); rtube.renderOrder = 4; scene.add(rtube);
  const slotGlow = SLOT.map((x, i) => { const g = glow(new THREE.Color(BALL_C[i]), 0.42, 0, 0.4); g.position.set(x, 0.33, RZ + 0.2); scene.add(g); return g; });

  // ----------------------------------------------------------- the five drawn balls
  const balls = NUMS.map((n, i) => {
    const tex = ballTex(n, BALL_C[i]);
    const m = new THREE.MeshPhysicalMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.06 });
    const b = mesh(new THREE.SphereGeometry(BR, 40, 24), m);
    b.visible = false; scene.add(b);
    return b;
  });
  const bp = new THREE.Vector3();
  // Where ball i is at time t, and how it has rolled. Number faces the camera once it rests.
  function placeBall(i, t) {
    const b = balls[i], T = DRAW[i], tr = ENTRY - SLOT[i];
    b.visible = t >= T;
    if (!b.visible) return;
    let rz = 0, rx = 0;
    if (t < T + 0.3) { // blown up from the mix into the riser
      const p = eio(k(t, T, T + 0.3));
      b.position.set(MX + Math.sin(t * 40) * 0.01 * (1 - p), lerp(MY + 0.06, MY + MR - 0.09, p), 0);
      rx = (1 - p) * 5; rz = -(tr + CHUTE_L) / BR;
    } else if (t < T + 1.0) { // up and over, then down the chute
      const u = eio(k(t, T + 0.3, T + 1.0));
      chuteCurve.getPointAt(u, bp); b.position.copy(bp);
      rz = -(tr + CHUTE_L * (1 - u)) / BR;
    } else { // rolls along the results tube and knocks against its neighbour
      const p = k(t, T + 1.0, LAND[i]);
      const tau = Math.max(0, t - LAND[i]);
      const bounce = t > LAND[i] ? 0.014 * Math.exp(-9 * tau) * Math.sin(20 * tau) : 0;
      const x = lerp(ENTRY, SLOT[i], eo(p)) + Math.abs(bounce);
      b.position.set(x, RY, RZ);
      rz = -(x - SLOT[i]) / BR;
    }
    b.rotation.set(rx, 0, rz);
  }

  // ----------------------------------------------------------- verification sweep
  const sweepTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(63,224,255,0)'); g.addColorStop(0.5, 'rgba(160,250,255,0.95)'); g.addColorStop(1, 'rgba(63,224,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const v = c.createLinearGradient(0, 0, 0, h);
    v.addColorStop(0, 'rgba(0,0,0,1)'); v.addColorStop(0.2, 'rgba(0,0,0,0)'); v.addColorStop(0.8, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = v; c.fillRect(0, 0, w, h);
  }).tex;
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.5), new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sweep.position.set(0, RY, RZ); sweep.renderOrder = 6; scene.add(sweep);
  const sweepGlow = glow(CYAN, 0.6, 0, 0.4); scene.add(sweepGlow);
  const scanX = (t) => lerp(TUBE_L - 0.1, ENTRY + 0.08, eio(k(t, SCAN[0], SCAN[1])));

  // ----------------------------------------------------------- the integrity shield
  const shield = new THREE.Group(); shield.position.set(SX, SY, SZ); scene.add(shield);
  const sh = new THREE.Shape();
  sh.moveTo(0, 0.3); sh.lineTo(0.24, 0.215); sh.lineTo(0.24, 0.02);
  sh.quadraticCurveTo(0.235, -0.19, 0, -0.3); sh.quadraticCurveTo(-0.235, -0.19, -0.24, 0.02);
  sh.lineTo(-0.24, 0.215); sh.closePath();
  const shGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.016, bevelSize: 0.016, bevelSegments: 3, curveSegments: 18 });
  shGeo.translate(0, 0, -0.025);
  const goldM = std(0xd9a531, { metalness: 1, roughness: 0.26, envMapIntensity: 1.4 });
  const shBody = mesh(shGeo, goldM); shield.add(shBody);
  const inGeo = new THREE.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: false, curveSegments: 18 });
  const shFace = mesh(inGeo, std(0x1b0f3a, { roughness: 0.28, metalness: 0.35 }), { cast: false });
  shFace.scale.set(0.8, 0.8, 1); shFace.position.z = 0.038; shield.add(shFace);
  const checkM = std(MINT, { emissive: MINT, emissiveIntensity: 1.6, roughness: 0.3 });
  const barGeo = new THREE.BoxGeometry(1, 0.036, 0.03); barGeo.translate(0.5, 0, 0);
  const CK = [[-0.105, 0.0], [-0.03, -0.08], [0.12, 0.1]];
  const bars = [0, 1].map((j) => {
    const [ax, ay] = CK[j], [bx, by] = CK[j + 1];
    const b = mesh(barGeo, checkM, { cast: false });
    b.position.set(ax, ay, 0.06); b.rotation.z = Math.atan2(by - ay, bx - ax);
    b.userData.len = Math.hypot(bx - ax, by - ay) + 0.018;
    shield.add(b); return b;
  });
  const shieldHalo = glow(GOLD, 1.3, 0, 0.45); shieldHalo.position.set(SX, SY, SZ - 0.15); scene.add(shieldHalo);
  // Sparks when the check lands.
  const SPN = 56, spPos = new Float32Array(SPN * 3);
  const spGeo = new THREE.BufferGeometry(); spGeo.setAttribute('position', new THREE.BufferAttribute(spPos, 3));
  const sparks = new THREE.Points(spGeo, new THREE.PointsMaterial({ color: 0xffd36a, size: 0.024, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sparks.frustumCulled = false; scene.add(sparks);
  const SPARK_T = 7.05;

  // Card beside the shield: the integrity line.
  const cardTex = canvasTex(768, 256, (c, w, h) => {
    c.fillStyle = 'rgba(18,10,34,0.86)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
    c.strokeStyle = 'rgba(61,255,176,0.85)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#3dffb0'; c.beginPath(); c.arc(70, 92, 30, 0, 7); c.fill();
    c.strokeStyle = '#0d1a14'; c.lineWidth = 7; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(56, 92); c.lineTo(66, 103); c.lineTo(85, 80); c.stroke();
    c.fillStyle = '#f6f1ff'; c.font = `800 72px ${SANS}`; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '4px';
    c.fillText('VERIFIED', 122, 96);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = 'rgba(214,200,255,0.88)'; c.font = `600 32px ${SANS}`;
    c.fillText('Fair play  ·  Responsible gaming', 40, 188);
  });
  const card = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.333), new THREE.MeshBasicMaterial({ map: cardTex.tex, transparent: true, toneMapped: false, depthWrite: false }));
  card.renderOrder = 7; scene.add(card);

  // ----------------------------------------------------------- LED wall drawing
  const TITLE = 'Live Drawing and Integrity pages';
  let wKey = '';
  function drawWall(t) {
    const boot = eo(k(t, 0.45, 1.05));
    const landed = LAND.filter((l) => t >= l).length;
    const sx = t > SCAN[0] ? scanX(t) : -9;
    const checked = SLOT.filter((s) => sx > s).length;
    const blink = Math.floor(t * 2.2) % 2;
    const head = eio(k(t, 7.3, 7.85));
    const anim = (boot > 0 && boot < 1) || LAND.some((l) => t > l && t < l + 0.45) || (head > 0 && head < 1) || (t > SCAN[0] && t < SCAN[1] + 0.4);
    const key = [landed, checked, blink, head >= 1 ? 1 : 0, boot >= 1 ? 1 : 0, anim ? Math.round(t * 30) : 0].join('|');
    if (key === wKey) return; wKey = key;
    wall.redraw((c, w, h) => {
      const bg = c.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#1a0b30'); bg.addColorStop(1, '#090514');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      const rg = c.createRadialGradient(440, 160, 10, 440, 160, 460);
      rg.addColorStop(0, 'rgba(255,47,142,0.22)'); rg.addColorStop(1, 'rgba(255,47,142,0)');
      c.fillStyle = rg; c.fillRect(0, 0, w, h);
      c.textBaseline = 'middle';
      // LIVE tally and header
      c.fillStyle = '#ff2f5a'; roundRect(c, 40, 28, 146, 58, 29); c.fill();
      c.fillStyle = blink ? '#ffffff' : 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(74, 57, 10, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.font = `800 32px ${SANS}`; c.textAlign = 'left'; c.fillText('LIVE', 96, 59);
      if (head < 1) {
        c.save(); c.globalAlpha = 1 - head; c.translate(0, -head * 16);
        c.fillStyle = '#f2eaff'; c.font = `700 36px ${MONO}`;
        if ('letterSpacing' in c) c.letterSpacing = '6px';
        c.fillText('RESULTS', 214, 59);
        if ('letterSpacing' in c) c.letterSpacing = '0px';
        c.restore();
      }
      if (head > 0) {
        c.save(); c.globalAlpha = head; c.translate(0, (1 - head) * 16);
        let fs = 44; c.font = `800 ${fs}px ${SANS}`;
        while (c.measureText(TITLE).width > w - 214 - 40 && fs > 24) { fs -= 2; c.font = `800 ${fs}px ${SANS}`; }
        c.fillStyle = '#ffffff'; c.fillText(TITLE, 214, 59);
        c.restore();
      }
      // Five result slots
      NUMS.forEach((n, i) => {
        const cx = 442 + (i - 2) * 112, cy = 162;
        const L = LAND[i];
        if (t < L) {
          c.strokeStyle = 'rgba(255,255,255,0.2)'; c.lineWidth = 3; c.beginPath(); c.arc(cx, cy, 44, 0, 7); c.stroke();
          c.fillStyle = 'rgba(255,255,255,0.25)'; c.font = `700 30px ${MONO}`; c.textAlign = 'center'; c.fillText('--', cx, cy + 2);
          return;
        }
        const s = Math.max(0.01, back(k(t, L, L + 0.35)));
        const flash = Math.exp(-6 * (t - L));
        c.save(); c.translate(cx, cy); c.scale(s, s);
        c.fillStyle = `rgba(255,255,255,${0.35 * flash})`; c.beginPath(); c.arc(0, 0, 62, 0, 7); c.fill();
        c.fillStyle = BALL_C[i]; c.beginPath(); c.arc(0, 0, 46, 0, 7); c.fill();
        c.fillStyle = '#f2ece2'; c.beginPath(); c.arc(0, 0, 31, 0, 7); c.fill();
        c.fillStyle = '#1a1030'; c.font = `800 32px ${MONO}`; c.textAlign = 'center'; c.fillText(n, 0, 2);
        c.restore();
        if (i < checked) {
          c.fillStyle = '#3dffb0'; c.beginPath(); c.arc(cx + 34, cy - 34, 14, 0, 7); c.fill();
          c.strokeStyle = '#0b1a12'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
          c.beginPath(); c.moveTo(cx + 27, cy - 34); c.lineTo(cx + 32, cy - 29); c.lineTo(cx + 41, cy - 39); c.stroke();
        }
      });
      // Client line along the bottom.
      c.textAlign = 'left'; c.fillStyle = '#ffc629'; c.font = `700 26px ${MONO}`;
      if ('letterSpacing' in c) c.letterSpacing = '5px';
      c.fillText('NEW YORK LOTTERY', 40, 264);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(420, 262, 520, 2);
      // LED pixel pitch
      c.fillStyle = 'rgba(0,0,0,0.3)';
      for (let y = 0; y < h; y += 3) c.fillRect(0, y, w, 1);
      for (let x = 0; x < w; x += 3) c.fillRect(x, 0, 1, h);
      if (boot < 1) { c.fillStyle = `rgba(4,2,8,${1 - boot})`; c.fillRect(0, 0, w, h); }
    });
  }

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [1.34, 1.04, 1.64]], [1.1, [1.24, 1.08, 1.76], (x) => x],
    [2.6, [0.42, 1.12, 2.15]], [4.7, [-0.38, 0.86, 1.98], (x) => x],
    [5.8, [-0.58, 0.94, 1.95]], [7.1, [-0.54, 1.0, 1.8], (x) => x],
    [8.5, [-0.08, 1.28, 3.35]], [10, [0.0, 1.32, 3.55], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.72, 1.1, 0]], [1.1, [0.68, 1.12, 0], (x) => x],
    [2.6, [0.2, 0.95, 0.15]], [4.7, [-0.72, 0.62, 0.3], (x) => x],
    [5.8, [-0.68, 0.7, 0.3]], [7.1, [-0.58, 0.9, 0.3], (x) => x],
    [8.5, [-0.12, 1.0, -0.2]], [10, [-0.1, 1.02, -0.2], (x) => x],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.006, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 38], [2.6, 36], [7.1, 35], [8.5, 34], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Studio comes up: key snaps on with a little overshoot, practicals follow.
    const on = clamp(back(k(t, 0.1, 0.7)));
    key.intensity = 38 * on;
    upL.intensity = 2.4 * eo(k(t, 0.3, 0.9));
    globeGlow.material.opacity = 0.32 * eo(k(t, 0.3, 0.9));
    machinePool.material.opacity = 0.22 * eo(k(t, 0.3, 0.9));
    wallGlow.material.opacity = 0.16 * eo(k(t, 0.45, 1.05));
    ledM.color.setHex(MAG).multiplyScalar(0.25 + 0.75 * eo(k(t, 0.2, 0.8)));

    // The mix: each ball rides its own pair of air currents inside the globe.
    paddle.rotation.z = (t / D) * Math.PI * 4;
    for (let j = 0; j < MIXN; j++) {
      const a = 2.2 + rnd(j, 1) * 1.6, b = 2.0 + rnd(j, 2) * 1.8, c = 1.8 + rnd(j, 3) * 1.6;
      const x = Math.sin(t * a + rnd(j, 4) * 6.28) * 0.8 + Math.sin(t * 4.1 + j) * 0.2;
      const y = Math.sin(t * b + rnd(j, 5) * 6.28) * 0.75 + 0.15 + Math.sin(t * 3.3 + j * 2) * 0.15;
      const z = Math.sin(t * c + rnd(j, 6) * 6.28) * 0.8;
      p4.set(x, y, z).multiplyScalar(RMAX);
      if (p4.length() > RMAX) p4.setLength(RMAX);
      p4.add(MC);
      e4.set(t * (2 + rnd(j, 7) * 3), t * (1.5 + rnd(j, 8) * 2), 0);
      q4.setFromEuler(e4);
      m4.compose(p4, q4, s1); mix.setMatrixAt(j, m4);
    }
    mix.instanceMatrix.needsUpdate = true;

    // Draws: blown up, over the chute, into the results tube.
    for (let i = 0; i < NUMS.length; i++) placeBall(i, t);
    const landed = LAND.filter((l) => t >= l).length;
    tubeL.intensity = 0.35 * landed;
    tubePool.material.opacity = 0.05 * landed;
    slotGlow.forEach((g, i) => { const L = LAND[i]; g.material.opacity = t < L ? 0 : 0.55 * eo(k(t, L, L + 0.3)) + 0.6 * Math.exp(-7 * (t - L)); });
    // A pulse of light at the top of the riser each time the air blows a ball out.
    globeGlow.material.opacity += DRAW.reduce((s, d) => s + 0.35 * Math.sin(Math.PI * k(t, d, d + 0.35)), 0);

    // Verification sweep: a cold line of light reads the row, each ball answers.
    const sx = scanX(t), sOn = Math.sin(Math.PI * k(t, SCAN[0] - 0.05, SCAN[1] + 0.1));
    sweep.position.set(sx, RY, RZ + 0.002); sweep.material.opacity = sOn; sweep.visible = sOn > 0.01;
    sweep.lookAt(camera.position.x, RY, camera.position.z);
    sweepGlow.position.set(sx, RY, RZ + 0.12); sweepGlow.material.opacity = 0.7 * sOn;
    balls.forEach((b, i) => { const d = (sx - SLOT[i]) / 0.07; b.material.emissiveIntensity = sOn > 0 ? 0.9 * Math.exp(-d * d) : 0; });

    // Shield turns in, lands with a wobble, and draws its check.
    const sIn = k(t, SHIELD, SHIELD + 0.8);
    shield.visible = t > SHIELD;
    shield.position.set(SX, SY - (1 - spring(sIn)) * 0.45 + Math.sin(t * 1.6) * 0.008 * eo(k(t, 7.2, 7.8)), SZ);
    shield.rotation.y = (1 - back(k(t, SHIELD, SHIELD + 0.7))) * Math.PI * 2 + 0.3;
    shield.scale.setScalar(Math.max(0.001, eo(k(t, SHIELD, SHIELD + 0.35))));
    const c1 = eo(k(t, 6.82, 6.97)), c2 = eo(k(t, 6.95, 7.15));
    [c1, c2].forEach((c, j) => { bars[j].scale.x = Math.max(0.001, bars[j].userData.len * c); bars[j].visible = c > 0.001; });
    const stamp = t > 7.0 ? Math.exp(-4 * (t - 7.0)) : 0;
    checkM.emissiveIntensity = 1.4 + 2.2 * stamp;
    stampL.intensity = 2.6 * stamp + 0.5 * eo(k(t, 7.0, 7.4));
    shieldHalo.material.opacity = 0.32 * eo(k(t, 6.5, 7.0)) + 0.4 * stamp;

    const spT = t - SPARK_T;
    sparks.visible = spT > 0 && spT < 1.4;
    if (sparks.visible) {
      for (let i = 0; i < SPN; i++) {
        const th = rnd(i, 71) * Math.PI * 2, ph = (rnd(i, 72) - 0.5) * 2.2, sp = 0.3 + rnd(i, 73) * 0.45;
        const r = (1 - Math.exp(-3.2 * spT)) * sp;
        spPos[i * 3] = SX + Math.cos(th) * Math.cos(ph) * r;
        spPos[i * 3 + 1] = SY + Math.sin(ph) * r - 0.3 * spT * spT;
        spPos[i * 3 + 2] = SZ + 0.08 + Math.sin(th) * Math.cos(ph) * r * 0.5;
      }
      spGeo.attributes.position.needsUpdate = true;
      sparks.material.opacity = 1 - spT / 1.4;
    }

    // Integrity card slides out of the shield's light.
    const cIn = back(k(t, 7.0, 7.45));
    card.visible = t > 7.0;
    card.position.set(-0.3 - (1 - clamp(cIn)) * 0.18, SY + 0.02, SZ + 0.04);
    card.lookAt(camera.position.x, card.position.y, camera.position.z);
    card.scale.setScalar(Math.max(0.001, 0.85 + 0.15 * cIn));
    card.material.opacity = clamp(cIn);

    drawWall(t);
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
