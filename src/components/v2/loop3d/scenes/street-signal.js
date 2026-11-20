// Street Signal lit loop, 10 s. "Scan it, skate it."
// Night street, one sodium lamp and a cold blue rim. A phone scans a real ledge (its screen is a live
// view of the set), the ledge locks in as a spot, the camera whips to street level and a board grinds
// it in sparks, kickflips out, and the camera cranes up until the street reads as the spot map.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';

const D = 10;
const Y = 0xf7c61b, B = 0x2f6bff;
const LX = 3.4, LH = 0.45, LD = 0.6; // ledge
const CY = LH + 0.006, CZ = LD / 2 - 0.012; // coping line

// ------------------------------------------------------------- the board's run, as a pure function of t
const board = (t) => {
  // returns [x, y, z, pitch(z-rot), roll(x-rot), yaw(y-rot), contact]
  if (t < 5.15) {
    const p = k(t, 4.25, 5.15);
    return [lerp(-5.4, -2.35, p), 0.095, 0.95, 0, Math.sin(t * 9) * 0.015, 0.04, 0];
  }
  if (t < 5.3) { // tail press: anticipation
    const p = eo(k(t, 5.15, 5.3));
    return [lerp(-2.35, -2.2, p), 0.095 + 0.05 * p, 0.95, 0.38 * p, 0, 0.04, 0];
  }
  if (t < 5.72) { // ollie onto the coping
    const p = k(t, 5.3, 5.72);
    const y = lerp(0.145, CY + 0.06, p) + Math.sin(Math.PI * p) * 0.38;
    return [lerp(-2.2, -1.35, p), y, lerp(0.95, CZ, eo(p)), kf(p, [[0, 0.38], [0.45, -0.08], [1, 0]]), 0, lerp(0.04, 0, p), 0];
  }
  if (t < 6.95) { // 50-50 grind
    const p = k(t, 5.72, 6.95);
    return [lerp(-1.35, 1.38, 1 - Math.pow(1 - p, 1.35)), CY + 0.06, CZ, Math.sin(p * 30) * 0.008, 0.06 + Math.sin(p * 17) * 0.02, Math.sin(p * 11) * 0.015, 1];
  }
  if (t < 7.55) { // pop out, kickflip
    const p = k(t, 6.95, 7.55);
    const y = lerp(CY + 0.06, 0.095, ei(p)) + Math.sin(Math.PI * p) * 0.42;
    return [lerp(1.38, 2.6, p), y, lerp(CZ, 0.8, eo(p)), kf(p, [[0, 0.3], [0.5, 0.05], [1, 0]]), eio(k(p, 0.12, 0.78)) * Math.PI * 2, -0.08 * p, 0];
  }
  const p = k(t, 7.55, 8.6);
  const sq = Math.exp(-(t - 7.55) * 14) * 0.05;
  return [lerp(2.6, 4.9, eo(p) * 0.6 + p * 0.4), 0.095 - sq * 0.3, lerp(0.8, 1.15, p), 0, 0, -0.08 + p * 0.05, 0];
};

function makeBoard(deckTex) {
  const g = new THREE.Group();
  const deckMat = [std(0x111214, { roughness: 0.95 }), std(0xc9a46b, { roughness: 0.6 })];
  const grip = mesh(new THREE.BoxGeometry(0.62, 0.018, 0.21), std(0x0d0e10, { roughness: 1 }));
  g.add(grip);
  const bottom = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.21), std(0xffffff, { map: deckTex, roughness: 0.45 }));
  bottom.rotation.x = Math.PI / 2; bottom.position.y = -0.0095;
  g.add(bottom);
  for (const s of [-1, 1]) {
    const kick = mesh(new THREE.BoxGeometry(0.13, 0.018, 0.21), deckMat[0]);
    kick.position.set(s * 0.37, 0.022, 0); kick.rotation.z = s * 0.38;
    g.add(kick);
    const ply = mesh(new THREE.BoxGeometry(0.13, 0.006, 0.212), deckMat[1]);
    ply.position.set(s * 0.37, 0.012, 0); ply.rotation.z = s * 0.38;
    g.add(ply);
    const truck = new THREE.Group();
    const metal = std(0xb9bec6, { metalness: 1, roughness: 0.28 });
    const base = mesh(new THREE.BoxGeometry(0.06, 0.03, 0.06), metal); base.position.y = -0.024; truck.add(base);
    const hanger = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.2, 10), metal); hanger.rotation.x = Math.PI / 2; hanger.position.y = -0.05; truck.add(hanger);
    for (const w of [-1, 1]) {
      const wheel = mesh(new THREE.CylinderGeometry(0.027, 0.027, 0.032, 18), std(0xf2efe6, { roughness: 0.5 }));
      wheel.rotation.x = Math.PI / 2; wheel.position.set(0, -0.058, w * 0.105);
      truck.add(wheel);
    }
    truck.position.x = s * 0.22;
    g.add(truck);
  }
  return g;
}

export function build({ env, renderer }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06070a);
  scene.fog = new THREE.Fog(0x06070a, 6, 19);
  scene.environment = env;
  scene.environmentIntensity = 0.22;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- set
  const asphalt = grainTex('#1d1e22', { size: 512, speck: 0.1, blot: 0.14, seed: 3, repeat: 6 });
  // Wet patches: low roughness where the blotches are, so the lamp and the sparks reflect in the street.
  const wet = grainTex('#9a9a9a', { size: 256, speck: 0.05, blot: 0.55, seed: 21, repeat: 3 });
  const ground = mesh(new THREE.PlaneGeometry(60, 60), std(0xffffff, { map: asphalt, roughness: 0.55, roughnessMap: wet, metalness: 0.05, envMapIntensity: 0.6 }), { cast: false });
  ground.rotation.x = -Math.PI / 2;
  scene.add(ground);
  // Painted curb line, worn
  const paint = canvasTex(512, 32, (c, w, h) => {
    c.fillStyle = '#f7c61b'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(20,20,22,${rnd(i, 4) * 0.7})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 1 + rnd(i, 7) * 3, 1 + rnd(i, 8) * 2); }
  }).tex;
  const line = new THREE.Mesh(new THREE.PlaneGeometry(14, 0.12), std(0xffffff, { map: paint, roughness: 0.7 }));
  line.rotation.x = -Math.PI / 2; line.position.set(0, 0.002, 1.75); line.receiveShadow = true;
  scene.add(line);

  const concrete = grainTex('#8d8a84', { size: 256, speck: 0.25, blot: 0.12, seed: 9 });
  const ledgeMat = std(0xffffff, { map: concrete, roughness: 0.88 });
  const ledge = mesh(new THREE.BoxGeometry(LX, LH, LD), ledgeMat);
  ledge.position.y = LH / 2;
  scene.add(ledge);
  const steel = std(0xc8ccd2, { metalness: 1, roughness: 0.22, envMapIntensity: 1.4 });
  const coping = mesh(new THREE.BoxGeometry(LX + 0.02, 0.035, 0.035), steel);
  coping.position.set(0, CY - 0.012, CZ + 0.006);
  scene.add(coping);

  // Buildings: dark masses with lit windows, far enough back to fall into the fog.
  const winTex = (seed) => canvasTex(128, 256, (c, w, h) => {
    c.fillStyle = '#0c0d11'; c.fillRect(0, 0, w, h);
    for (let y = 8; y < h - 8; y += 22) for (let x = 8; x < w - 8; x += 20) {
      const r = rnd(x * 13 + y, seed);
      if (r > 0.84) { c.fillStyle = r > 0.97 ? '#8fa8ff' : '#ffb766'; c.globalAlpha = 0.25 + (r - 0.84) * 4; c.fillRect(x + 2, y + 2, 8, 11); c.globalAlpha = 1; }
      else { c.fillStyle = '#121318'; c.fillRect(x + 2, y + 2, 8, 11); }
    }
  }).tex;
  const blocks = [[-7.5, -9, 4, 6.5], [-2.6, -10, 5.2, 8], [3.2, -9.4, 4.2, 5.4], [8.2, -8.5, 4.6, 7.2], [-12, -6, 4, 7], [12.5, -4, 4, 6]];
  blocks.forEach(([x, z, w, h], i) => {
    const t = winTex(i + 2);
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 2.2, h / 4);
    const m = mesh(new THREE.BoxGeometry(w, h, 3), std(0x15161b, { roughness: 0.9, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.4, map: t }), { cast: false });
    m.position.set(x, h / 2, z);
    scene.add(m);
  });

  // Street lamp
  const pole = mesh(new THREE.CylinderGeometry(0.04, 0.055, 4.2, 12), std(0x1c1e22, { metalness: 0.6, roughness: 0.5 }));
  pole.position.set(-2.9, 2.1, -1.7); scene.add(pole);
  const arm = mesh(new THREE.BoxGeometry(1.1, 0.05, 0.06), pole.material); arm.position.set(-2.4, 4.15, -1.7); scene.add(arm);
  const head = mesh(new THREE.BoxGeometry(0.42, 0.08, 0.22), std(0x1c1e22)); head.position.set(-1.9, 4.1, -1.7); scene.add(head);
  const bulb = glow(0xffb45a, 1.6, 0.95, 0.18); bulb.position.set(-1.9, 4.02, -1.7); scene.add(bulb);
  const bulbHalo = glow(0xff9a3c, 5, 0.22, 0.4); bulbHalo.position.copy(bulb.position); scene.add(bulbHalo);

  // ----------------------------------------------------------- light
  scene.add(new THREE.HemisphereLight(0x2b3a66, 0x09090b, 0.22));
  const key = new THREE.SpotLight(0xffb468, 130, 0, 0.7, 0.8, 1.6);
  key.position.set(-1.9, 4.0, -1.7);
  key.target.position.set(0.4, 0, 0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 12;
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(B, 1.8);
  rim.position.set(4, 3, -5);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x8fa6ff, 0.25);
  fill.position.set(-2, 2, 6);
  scene.add(fill);
  const spark = new THREE.PointLight(0xffc35a, 0, 2.2, 1.6);
  scene.add(spark);

  // ----------------------------------------------------------- scan
  const sweepTex = canvasTex(256, 16, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgba(247,198,27,0)'); g.addColorStop(0.82, 'rgba(247,198,27,0.22)');
    g.addColorStop(0.97, 'rgba(255,236,160,1)'); g.addColorStop(1, 'rgba(255,236,160,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }).tex;
  const sweep = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 1.5), new THREE.MeshBasicMaterial({ map: sweepTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  // The plane's gradient runs along its own x; turn it to face down the ledge with the bright edge leading.
  sweep.rotation.y = 0;
  const sweepRig = new THREE.Group(); sweepRig.add(sweep);
  sweep.position.set(-0.7, 0.75, LD / 2 + 0.03);
  sweepRig.scale.set(1, 1, 1);
  scene.add(sweepRig);
  const cut = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  // Point cloud on the ledge's visible faces and the ground around it.
  const N = 1400, pts = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    const f = rnd(i, 1), u = rnd(i, 2) - 0.5, v = rnd(i, 3);
    let x, y, z;
    if (f < 0.38) { x = u * LX; y = LH; z = (v - 0.5) * LD; }
    else if (f < 0.7) { x = u * LX; y = v * LH; z = LD / 2; }
    else if (f < 0.78) { x = (u > 0 ? 1 : -1) * LX / 2; y = v * LH; z = (rnd(i, 4) - 0.5) * LD; }
    else { x = u * (LX + 1.4); y = 0.004; z = LD / 2 + v * 1.3; }
    pts.set([x, y, z], i * 3);
  }
  const cloudGeo = new THREE.BufferGeometry(); cloudGeo.setAttribute('position', new THREE.BufferAttribute(pts, 3));
  const cloudMat = new THREE.PointsMaterial({ color: Y, size: 0.022, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, clippingPlanes: [cut], toneMapped: false });
  const cloud = new THREE.Points(cloudGeo, cloudMat);
  scene.add(cloud);
  const wire = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(LX, LH, LD)), new THREE.LineBasicMaterial({ color: Y, transparent: true, clippingPlanes: [cut], toneMapped: false }));
  wire.position.y = LH / 2;
  scene.add(wire);
  // Lock-on brackets and label
  const brackets = new THREE.Group();
  const bm = new THREE.LineBasicMaterial({ color: Y, transparent: true, toneMapped: false });
  const bx = LX / 2 + 0.14, by0 = -0.06, by1 = LH + 0.16;
  for (const [sx, sy] of [[-1, 0], [1, 0], [-1, 1], [1, 1]]) {
    const x = sx * bx, y = sy ? by1 : by0, dy = sy ? -0.2 : 0.2;
    const g = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y + dy, 0), new THREE.Vector3(x, y, 0), new THREE.Vector3(x - sx * 0.3, y, 0)]);
    brackets.add(new THREE.Line(g, bm));
  }
  brackets.position.z = LD / 2 + 0.05;
  scene.add(brackets);
  const found = label('LEDGE FOUND', { fg: '#0b0b0c', bg: '#f7c61b', h: 0.2, font: '700 60px Inter, system-ui, sans-serif', track: 4 });
  found.position.set(-1.05, LH + 0.42, LD / 2 + 0.05);
  scene.add(found);

  // Map pins: the scanned spot, then the others the map turns up.
  const pinMat = std(Y, { roughness: 0.35, metalness: 0.1, emissive: Y, emissiveIntensity: 0.35 });
  const makePin = (s = 1) => {
    const g = new THREE.Group();
    const ball = mesh(new THREE.SphereGeometry(0.11, 24, 16), pinMat); ball.position.y = 0.3; g.add(ball);
    const tip = mesh(new THREE.ConeGeometry(0.075, 0.24, 20), pinMat); tip.rotation.x = Math.PI; tip.position.y = 0.16; g.add(tip);
    const dot = mesh(new THREE.SphereGeometry(0.045, 16, 10), std(0x0b0b0c)); dot.position.set(0, 0.3, 0.075); g.add(dot);
    const halo = glow(Y, 0.9, 0.5); halo.position.y = 0.3; g.add(halo);
    g.scale.setScalar(s);
    return g;
  };
  const ringTex = canvasTex(128, 128, (c, w) => { c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 6, 0, Math.PI * 2); c.stroke(); }).tex;
  const makeRing = () => { const r = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: ringTex, color: Y, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); r.rotation.x = -Math.PI / 2; return r; };
  const pin = makePin(1); scene.add(pin);
  const ring = makeRing(); scene.add(ring);
  const others = [[-2.7, -1.5], [2.6, -1.9], [3.1, 1.9], [-2.3, 2.5]].map(([x, z]) => { const p = makePin(1.2); p.position.set(x, 0, z); scene.add(p); const r = makeRing(); r.position.set(x, 0.01, z); scene.add(r); return { p, r }; });
  // Route from the spot to the next ones: a lit line drawn on the street.
  const routePts = [new THREE.Vector3(0, 0.02, 0.9), new THREE.Vector3(0, 0.02, 1.75), new THREE.Vector3(-2.3, 0.02, 1.75), new THREE.Vector3(-2.3, 0.02, 2.5)];
  const route = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(routePts, false, 'catmullrom', 0.02), 64, 0.035, 6), new THREE.MeshBasicMaterial({ color: Y, toneMapped: false }));
  route.geometry.setDrawRange(0, 0);
  const routeCount = route.geometry.index.count;
  scene.add(route);

  // Map layer: as the camera cranes up, the street resolves into the Atlas map, a lit street grid.
  const gridTex = canvasTex(1024, 1024, (c, w) => {
    c.clearRect(0, 0, w, w);
    const step = w / 8;
    c.strokeStyle = 'rgba(120,160,255,0.55)'; c.lineWidth = 3;
    for (let i = 0; i <= 8; i++) { c.beginPath(); c.moveTo(i * step, 0); c.lineTo(i * step, w); c.stroke(); c.beginPath(); c.moveTo(0, i * step); c.lineTo(w, i * step); c.stroke(); }
    c.strokeStyle = 'rgba(120,160,255,0.18)'; c.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { if (rnd(i * 8 + j, 31) > 0.45) { c.strokeRect(i * step + 14, j * step + 14, step - 28, step - 28); } }
    // fade the edges out so the grid has no hard border
    c.globalCompositeOperation = 'destination-in';
    const g = c.createRadialGradient(w / 2, w / 2, w * 0.15, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.MeshBasicMaterial({ map: gridTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  grid.rotation.x = -Math.PI / 2; grid.position.set(0.25, 0.012, 0.6);
  scene.add(grid);
  const night = new THREE.Mesh(new THREE.PlaneGeometry(60, 60), new THREE.MeshBasicMaterial({ color: 0x05060a, transparent: true, opacity: 0, depthWrite: false }));
  night.rotation.x = -Math.PI / 2; night.position.y = 0.008;
  scene.add(night);

  // ----------------------------------------------------------- the board
  const deckTex = canvasTex(512, 172, (c, w, h) => {
    c.fillStyle = '#2f6bff'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#f7c61b'; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.55, 0); c.lineTo(w * 0.72, 0); c.lineTo(w * 0.17, h); c.fill();
    c.fillStyle = '#0b0b0c'; c.font = '700 64px Inter, system-ui, sans-serif'; c.textBaseline = 'middle';
    c.fillText('STREET SIGNAL', 34, h / 2 + 4);
  }).tex;
  const sk8 = makeBoard(deckTex);
  scene.add(sk8);
  const ghostMats = [0.32, 0.18, 0.09].map((o) => new THREE.MeshBasicMaterial({ color: 0x9fb4ff, transparent: true, opacity: o, depthWrite: false, toneMapped: false }));
  const ghosts = ghostMats.map((m) => { const g = sk8.clone(true); g.traverse((o) => { if (o.isMesh) { o.material = m; o.castShadow = false; o.receiveShadow = false; } }); scene.add(g); return g; });
  const place = (o, s) => { o.position.set(s[0], s[1], s[2]); o.rotation.set(s[4], s[5], s[3], 'XYZ'); };
  // Sparks off the coping: each spark's birth time and velocity are fixed, so any t can be drawn.
  const SN = 160, sp = new Float32Array(SN * 3), sv = [];
  for (let i = 0; i < SN; i++) sv.push({ b: 5.74 + (i / SN) * 1.18, vx: -0.6 - rnd(i, 11) * 1.6, vy: 0.5 + rnd(i, 12) * 1.7, vz: (rnd(i, 13) - 0.2) * 1.4, life: 0.22 + rnd(i, 14) * 0.3 });
  const sparkGeo = new THREE.BufferGeometry(); sparkGeo.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const sparks = new THREE.Points(sparkGeo, new THREE.PointsMaterial({ color: 0xffe2a0, size: 0.05, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sparks.frustumCulled = false;
  scene.add(sparks);
  const contactGlow = glow(0xffc35a, 0.5, 0); scene.add(contactGlow);

  // ----------------------------------------------------------- the phone, with a live viewfinder
  const ph = phone();
  ph.scale.setScalar(0.36);
  scene.add(ph);
  const rt = new THREE.WebGLRenderTarget(256, 512, { samples: 0 });
  rt.texture.colorSpace = THREE.SRGBColorSpace;
  const lens = new THREE.PerspectiveCamera(48, 0.74 / 1.52, 0.05, 40);
  scene.add(lens);
  ph.userData.screen.material.map = rt.texture;
  const hud = canvasTex(256, 512);
  const hudPlane = new THREE.Mesh(new THREE.PlaneGeometry(ph.userData.sw, ph.userData.sh), new THREE.MeshBasicMaterial({ map: hud.tex, transparent: true, toneMapped: false, depthWrite: false }));
  hudPlane.position.z = ph.userData.d / 2 + 0.0045;
  ph.add(hudPlane);
  let hudKey = '';
  const drawHud = (pct, lock) => {
    const key2 = pct + ':' + lock;
    if (key2 === hudKey) return; hudKey = key2;
    hud.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(0,0,0,0.38)'; c.fillRect(0, 0, w, 64); c.fillRect(0, h - 76, w, 76);
      c.font = '700 17px "JetBrains Mono", ui-monospace, monospace'; c.fillStyle = '#fff'; c.textBaseline = 'middle';
      c.fillText(lock ? 'SPOT SAVED' : 'SCANNING', 22, 40);
      c.textAlign = 'right'; c.fillStyle = '#f7c61b'; c.fillText(pct + '%', w - 22, 40); c.textAlign = 'left';
      c.fillStyle = 'rgba(255,255,255,0.22)'; roundRect(c, 22, h - 46, w - 44, 8, 4); c.fill();
      c.fillStyle = '#f7c61b'; roundRect(c, 22, h - 46, Math.max(8, (w - 44) * pct / 100), 8, 4); c.fill();
      c.strokeStyle = lock ? '#f7c61b' : 'rgba(255,255,255,0.85)'; c.lineWidth = 4;
      const m = 34, L = 30, x0 = m, y0 = 96, x1 = w - m, y1 = h - 110;
      [[x0, y0, 1, 1], [x1, y0, -1, 1], [x0, y1, 1, -1], [x1, y1, -1, -1]].forEach(([x, y, sx, sy]) => { c.beginPath(); c.moveTo(x, y + sy * L); c.lineTo(x, y); c.lineTo(x + sx * L, y); c.stroke(); });
      if (lock) { c.fillStyle = '#f7c61b'; roundRect(c, w / 2 - 70, h / 2 - 20, 140, 40, 20); c.fill(); c.fillStyle = '#0b0b0c'; c.textAlign = 'center'; c.font = '700 17px Inter, system-ui, sans-serif'; c.fillText('LOCKED', w / 2, h / 2 + 1); c.textAlign = 'left'; }
    });
  };

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.75, 1.42, 5.7]], [3.25, [-0.1, 1.32, 5.3], (x) => x],
    [4.15, [-3.7, 0.58, 2.75]], [5.3, [-2.7, 0.72, 2.95], (x) => x], [6.35, [-0.5, 0.78, 3.0], (x) => x], [7.25, [1.1, 0.86, 3.05], (x) => x], [8.15, [2.5, 1.15, 3.7], eo],
    [9.45, [0.4, 6.4, 7.4]], [10, [0.4, 6.7, 7.6], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.25, 0.48, 0]], [3.25, [0.3, 0.5, 0], (x) => x],
    [4.15, [-2.6, 0.32, 0.65]], [5.3, [-1.9, 0.55, 0.5], (x) => x], [6.35, [-0.05, 0.56, 0.3], (x) => x], [7.25, [1.7, 0.6, 0.5], (x) => x], [8.15, [3.0, 0.32, 0.85], eo],
    [9.45, [0.1, 0, 0.4]], [10, [0.1, 0, 0.4], (x) => x],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    // Camera, with handheld drift, a whip, and impact shake on landings.
    const p = camPos(t), q = camTgt(t);
    const drift = 0.012;
    const shake = (t > 7.55 ? Math.exp(-(t - 7.55) * 9) * 0.04 : 0) + (t > 5.72 && t < 6.3 ? Math.exp(-(t - 5.72) * 12) * 0.02 : 0);
    camera.position.set(p[0] + Math.sin(t * 1.3) * drift + Math.sin(t * 53) * shake, p[1] + Math.sin(t * 1.7 + 1) * drift + Math.cos(t * 61) * shake, p[2]);
    tgt.set(q[0], q[1], q[2]);
    camera.lookAt(tgt);
    // Lens: wider for the street-level run, tighter for the map.
    camera.fov = kf(t, [[0, 34], [3.3, 33], [4.15, 40], [8.15, 40], [9.45, 34]]);
    // Dip to black across the seam.
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Scan: sweep runs 0.5 to 2.3 s, the cloud and wire follow it, then fade once the spot locks.
    const sx = lerp(-LX / 2 - 0.35, LX / 2 + 0.35, eio(k(t, 0.5, 2.3)));
    cut.constant = sx;
    sweepRig.position.x = sx;
    sweep.material.opacity = clamp(k(t, 0.45, 0.6) * (1 - k(t, 2.2, 2.45)));
    sweepRig.visible = sweep.material.opacity > 0.01;
    const cloudA = (1 - k(t, 2.7, 3.5)) * (t > 0.45 ? 1 : 0);
    cloudMat.opacity = 0.9 * cloudA; wire.material.opacity = 0.8 * cloudA;
    cloud.visible = wire.visible = cloudA > 0.01;
    // Lock-on: brackets snap in from wide, label pops, pin drops on a spring, ring shocks out.
    const lk = back(k(t, 2.3, 2.62));
    const lockA = clamp(k(t, 2.3, 2.4) * (1 - k(t, 3.9, 4.15)));
    brackets.scale.set(lerp(1.35, 1, lk), lerp(1.6, 1, lk), 1);
    bm.opacity = lockA; brackets.visible = lockA > 0.01;
    found.material.opacity = lockA; found.visible = lockA > 0.01;
    found.scale.setScalar(Math.max(0.001, back(k(t, 2.42, 2.72))));
    const drop = spring(k(t, 2.5, 3.3));
    const pinBack = back(k(t, 8.45, 8.85));
    const pinOn = t < 4.1 ? drop : t > 8.45 ? pinBack * 1.6 : 0;
    pin.visible = pinOn > 0.001;
    pin.scale.setScalar(Math.max(0.001, t < 4.1 ? 1 - k(t, 3.85, 4.1) : pinOn));
    pin.position.set(0, (t < 4.1 ? lerp(2.2, 0, drop) : 0) + LH, 0);
    pin.rotation.y = t * 1.6;
    const shock = (t0, r) => { const s2 = k(t, t0, t0 + 0.7); r.scale.setScalar(0.2 + eo(s2) * 2.2); r.material.opacity = (1 - s2) * (s2 > 0 ? 1 : 0); r.visible = s2 > 0 && s2 < 1; };
    ring.position.set(0, LH + 0.01, 0); shock(2.95, ring);
    others.forEach(({ p: o, r }, i) => { const a = 8.75 + i * 0.16; const s2 = spring(k(t, a, a + 0.55)); o.visible = s2 > 0.001 && t < 9.98; o.scale.setScalar(Math.max(0.001, s2 * 1.2)); o.rotation.y = t * 1.6 + i; shock(a + 0.12, r); });
    const rd = k(t, 8.6, 9.5);
    route.geometry.setDrawRange(0, Math.floor(eio(rd) * routeCount / 6) * 6);
    route.visible = rd > 0;
    const mp = eio(k(t, 8.35, 9.3));
    grid.material.opacity = mp; grid.visible = mp > 0.001;
    grid.scale.setScalar(lerp(0.85, 1, mp));
    night.material.opacity = mp * 0.55; night.visible = mp > 0.001;

    // Board and its smear ghosts.
    const s = board(t);
    const riding = t > 4.25 && t < 8.6;
    sk8.visible = riding;
    place(sk8, s);
    const fast = (t > 5.28 && t < 5.7) || (t > 6.98 && t < 7.48);
    ghosts.forEach((g, i) => { g.visible = riding && fast; if (g.visible) place(g, board(t - 0.028 * (i + 1))); });
    // Sparks, contact glow and the light the grind throws on the ledge.
    const pos = sparkGeo.attributes.position;
    for (let i = 0; i < SN; i++) {
      const v = sv[i], a = t - v.b;
      if (a > 0 && a < v.life) {
        const c = board(v.b);
        pos.setXYZ(i, c[0] - 0.2 + v.vx * a, CY + v.vy * a - 4.9 * a * a, CZ + 0.02 + v.vz * a);
      } else pos.setXYZ(i, 0, -50, 0);
    }
    pos.needsUpdate = true;
    const grind = s[6] ? 1 - 0.3 * Math.abs(Math.sin(t * 40)) : 0;
    spark.intensity = grind * 9;
    spark.position.set(s[0] - 0.2, CY + 0.08, CZ + 0.15);
    contactGlow.position.set(s[0] - 0.22, CY + 0.01, CZ + 0.03);
    contactGlow.material.opacity = grind * 0.9;
    contactGlow.scale.setScalar(0.35 + 0.15 * Math.sin(t * 50));

    // Phone: rises in handheld, holds on the ledge, then drops out of frame for the whip.
    const out = ei(k(t, 3.1, 3.7));
    ph.visible = t < 3.75;
    ph.position.set(-0.78 + Math.sin(t * 1.1) * 0.01, lerp(0.55, 1.08, eo(k(t, 0, 0.9))) - out * 1.1 + Math.sin(t * 1.9) * 0.005, 4.55);
    ph.rotation.set(-0.08 + Math.sin(t * 1.5) * 0.012, 0.16 + Math.sin(t * 0.9) * 0.015, 0.04 + out * 0.4);
    ph.userData.sheen.position.x = Math.sin(t * 0.8) * 0.05;
    if (ph.visible) {
      // Live viewfinder: render the set from the phone's lens into its screen.
      ph.updateMatrixWorld();
      lens.position.copy(ph.position).add(new THREE.Vector3(0, 0.04, -0.03));
      lens.lookAt(0.2, 0.32, 0);
      const pct = Math.round(100 * eio(k(t, 0.5, 2.3)));
      drawHud(pct, t > 2.42);
      const r = renderer;
      if (r) {
        ph.visible = false; // hide the phone from its own camera
        const prev = r.getRenderTarget();
        r.setRenderTarget(rt); r.render(scene, lens); r.setRenderTarget(prev);
        ph.visible = true;
      }
    }
  }

  return { scene, camera, update, duration: D, poster: 6.2 };
}
