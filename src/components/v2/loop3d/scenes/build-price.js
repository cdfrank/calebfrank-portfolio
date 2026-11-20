// General Motors Build & Price lit loop, 10 s. "Rebuilding how people build a vehicle."
// A dark showroom turntable. First, too many choices: 212 option chips swirl over an empty stage.
// They sort themselves into three body styles; SUV is picked, and the SUV is scanned onto the
// turntable. One builder then runs model, trim, color and price, cycling through every brand, while
// the paint changes under the showroom lights. It ends on a low hero shot, headlights on.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';

const D = 10;
const BRANDS = ['CHEVROLET', 'GMC', 'BUICK', 'CADILLAC'];
const PRICES = [31200, 34950, 35400, 38425];
const STEP = [5.05, 5.75, 6.45, 7.15];          // model, trim, color, price lock in
const PAINT = [[5.9, 0x6a0a10], [6.55, 0x10285a], [7.2, 0x7d838b], [7.85, 0x4a080d]];
const CN = 212;

function suvGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.88, 0.13); s.lineTo(-0.79, 0.13);
  s.absarc(-0.57, 0.13, 0.205, Math.PI, 0, true);
  s.lineTo(0.37, 0.13);
  s.absarc(0.59, 0.13, 0.205, Math.PI, 0, true);
  s.lineTo(0.9, 0.13);
  s.quadraticCurveTo(0.95, 0.2, 0.93, 0.29);
  s.quadraticCurveTo(0.92, 0.37, 0.84, 0.385);
  s.lineTo(0.42, 0.43);
  s.quadraticCurveTo(0.3, 0.5, 0.12, 0.62);
  s.quadraticCurveTo(0.06, 0.645, -0.04, 0.645);
  s.lineTo(-0.66, 0.64);
  s.quadraticCurveTo(-0.8, 0.63, -0.86, 0.5);
  s.lineTo(-0.92, 0.4);
  s.quadraticCurveTo(-0.95, 0.24, -0.88, 0.13);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.66, bevelEnabled: true, bevelThickness: 0.07, bevelSize: 0.05, bevelSegments: 6, curveSegments: 28 });
  g.translate(0, 0, -0.33);
  return g;
}
function glassGeometry() {
  const s = new THREE.Shape();
  s.moveTo(0.33, 0.44); s.quadraticCurveTo(0.22, 0.52, 0.1, 0.6); s.lineTo(-0.62, 0.6);
  s.quadraticCurveTo(-0.74, 0.59, -0.79, 0.47); s.lineTo(0.33, 0.44);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.77, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.02, bevelSegments: 3, curveSegments: 16 });
  g.translate(0, 0, -0.385);
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x050608);
  scene.fog = new THREE.Fog(0x050608, 4, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.9;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- showroom
  const floor = mesh(new THREE.PlaneGeometry(20, 20), std(0xffffff, { map: grainTex('#0c0d11', { size: 256, speck: 0.04, blot: 0.05, seed: 2, repeat: 10 }), roughness: 0.3, metalness: 0.5 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const disc = mesh(new THREE.CylinderGeometry(1.35, 1.38, 0.05, 96), std(0x16181d, { roughness: 0.25, metalness: 0.75 }));
  disc.position.y = 0.025; scene.add(disc);
  const discRing = new THREE.Mesh(new THREE.TorusGeometry(1.37, 0.006, 8, 128), new THREE.MeshBasicMaterial({ color: 0xd8dde6, toneMapped: false }));
  discRing.rotation.x = Math.PI / 2; discRing.position.y = 0.05; scene.add(discRing);
  // Overhead light box: the long reflection that runs down a car's flanks in every showroom shot.
  const box = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.5), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, side: THREE.DoubleSide }));
  box.rotation.x = Math.PI / 2; box.position.set(0, 3.2, 0); scene.add(box);
  [-3.4, 3.4].forEach((x) => { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.08, 2.6), new THREE.MeshBasicMaterial({ color: 0xbfd0ff, toneMapped: false })); w.position.set(x, 1.3, -3.2); scene.add(w); const g = glow(0x8fb0ff, 1.2, 0.3, 0.5); g.position.copy(w.position); g.scale.set(0.6, 3.4, 1); scene.add(g); });
  scene.add(new THREE.HemisphereLight(0x8f9ab8, 0x050608, 0.3));
  const top = new THREE.SpotLight(0xffffff, 24, 0, 0.5, 0.75, 1.4);
  top.position.set(0.4, 3.4, 1.0); top.target.position.set(0, 0.3, 0);
  top.castShadow = true; top.shadow.mapSize.set(1024, 1024); top.shadow.bias = -0.0003; top.shadow.normalBias = 0.02;
  top.shadow.camera.near = 1.5; top.shadow.camera.far = 6;
  scene.add(top, top.target);
  const rimL = new THREE.DirectionalLight(0x7f9cff, 1.4); rimL.position.set(-3, 1.5, -2.5); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffc8a0, 1.0); rimR.position.set(3, 1.2, -2); scene.add(rimR);

  // ----------------------------------------------------------- the SUV
  const car = new THREE.Group();
  const spinG = new THREE.Group(); spinG.position.y = 0.05; spinG.add(car); scene.add(spinG);
  const reveal = new THREE.Plane(new THREE.Vector3(-1, 0, 0), -2);
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x6a0a10, metalness: 0.7, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.06, clippingPlanes: [reveal] });
  const body = mesh(suvGeometry(), paint); car.add(body);
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x05070b, metalness: 0.2, roughness: 0.05, clearcoat: 1, clippingPlanes: [reveal] });
  const glass = mesh(glassGeometry(), glassM); car.add(glass);
  const trimM = std(0x0d0e11, { roughness: 0.5, metalness: 0.3, clippingPlanes: [reveal] });
  const sill = mesh(new THREE.BoxGeometry(0.72, 0.05, 0.8), trimM); sill.position.set(0, 0.15, 0); car.add(sill);
  const grille = mesh(new THREE.BoxGeometry(0.03, 0.06, 0.46), std(0x0a0a0c, { roughness: 0.3, metalness: 0.8, clippingPlanes: [reveal] })); grille.position.set(0.95, 0.28, 0); car.add(grille);
  const roofRail = [-1, 1].map((sd) => { const r = mesh(new THREE.BoxGeometry(0.6, 0.018, 0.025), std(0x9aa0a8, { metalness: 1, roughness: 0.3, clippingPlanes: [reveal] })); r.position.set(-0.27, 0.665, sd * 0.3); car.add(r); return r; });
  const headM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, clippingPlanes: [reveal] });
  const tailM = new THREE.MeshBasicMaterial({ color: 0xff1a2a, toneMapped: false, clippingPlanes: [reveal] });
  const heads = [-1, 1].map((sd) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.035, 0.2), headM); h.position.set(0.935, 0.35, sd * 0.25); car.add(h); const g = glow(0xe8f0ff, 0.5, 0, 0.3); g.position.set(1.0, 0.35, sd * 0.25); car.add(g); return g; });
  [-1, 1].forEach((sd) => { const h = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.04, 0.2), tailM); h.position.set(-0.94, 0.42, sd * 0.26); car.add(h); });
  const tireM = std(0x111214, { roughness: 0.85, clippingPlanes: [reveal] }), rimM = std(0xb8bdc4, { metalness: 1, roughness: 0.25, clippingPlanes: [reveal] });
  const spokeM = std(0x2a2c31, { metalness: 0.8, roughness: 0.35, clippingPlanes: [reveal] });
  const wheels = [];
  [[-0.57, 1], [-0.57, -1], [0.59, 1], [0.59, -1]].forEach(([x, sd]) => {
    const w = new THREE.Group(); w.position.set(x, 0.17, sd * 0.36);
    const tire = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.13, 40), tireM); tire.rotation.x = Math.PI / 2; w.add(tire);
    const rim = mesh(new THREE.CylinderGeometry(0.115, 0.115, 0.135, 40), rimM); rim.rotation.x = Math.PI / 2; w.add(rim);
    for (let i = 0; i < 5; i++) { const sp = mesh(new THREE.BoxGeometry(0.2, 0.026, 0.02), spokeM); sp.rotation.z = (i / 5) * Math.PI; sp.position.z = sd * 0.07; w.add(sp); }
    const hub = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.142, 16), spokeM); hub.rotation.x = Math.PI / 2; w.add(hub);
    car.add(w); wheels.push(w);
  });
  car.scale.setScalar(1.15);
  // Scan line that draws the car onto the stage.
  const scanTex = canvasTex(128, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(120,180,255,0)'); g.addColorStop(0.5, 'rgba(150,200,255,0.3)'); g.addColorStop(1, 'rgba(120,180,255,0.05)'); c.fillStyle = g; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(220,240,255,0.95)'; c.fillRect(0, h - 3, w, 3); c.fillRect(0, 0, 3, h); c.fillRect(w - 3, 0, 3, h); }).tex;
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.85), new THREE.MeshBasicMaterial({ map: scanTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  scene.add(scan);

  // ----------------------------------------------------------- too many choices
  const chipGeo = new THREE.BoxGeometry(0.11, 0.065, 0.006);
  const chips = new THREE.InstancedMesh(chipGeo, new THREE.MeshStandardMaterial({ roughness: 0.4, metalness: 0.2, emissive: 0x222631, emissiveIntensity: 0.6 }), CN);
  const pal = [0x2b3a5c, 0x3d4f7a, 0x8a95ad, 0xc8ced9, 0x6a2a2e, 0x2f4a3a, 0x4a4f5a];
  for (let i = 0; i < CN; i++) chips.setColorAt(i, new THREE.Color(pal[Math.floor(rnd(i, 3) * pal.length)]));
  chips.frustumCulled = false; scene.add(chips);
  const lane = [[-0.95, 1.2, 0.4], [0, 1.28, 0.55], [0.95, 1.2, 0.4]];
  const tiles = ['CAR', 'SUV', 'TRUCK'].map((name, j) => {
    const l = label(name, { font: '800 60px Inter, system-ui, sans-serif', fg: '#fff', bg: 'rgba(20,24,34,0.9)', h: 0.16, pad: 54, track: 6 });
    l.position.set(...lane[j]); scene.add(l); return l;
  });
  const picked = label('SUV', { font: '800 60px Inter, system-ui, sans-serif', fg: '#0b0d12', bg: '#e9edf5', h: 0.16, pad: 54, track: 6 });
  picked.position.set(...lane[1]); scene.add(picked);
  const many = label('212 options', { font: '800 56px "JetBrains Mono", ui-monospace, monospace', fg: '#e9edf5', h: 0.22 });
  many.position.set(0, 1.78, 0.2); scene.add(many);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();

  // ----------------------------------------------------------- the one builder (HUD)
  const hud = canvasTex(560, 760);
  const hudM = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.76), new THREE.MeshBasicMaterial({ map: hud.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(hudM);
  let hKey = '';
  const drawHud = (t) => {
    const done = STEP.filter((s) => t > s).length;
    const brand = BRANDS[Math.min(3, Math.floor(k(t, 4.7, 7.9) * 4))];
    const pi = Math.min(3, Math.max(0, done - 1));
    const price = Math.round(lerp(done ? PRICES[Math.max(0, pi - 1)] : PRICES[0], PRICES[pi], eo(k(t, STEP[pi], STEP[pi] + 0.5))) / 5) * 5;
    const paintI = PAINT.filter(([pt]) => t > pt).length;
    const build = t > 8.3 ? back(k(t, 8.3, 8.6)) : 0;
    const live = STEP.some((s) => t > s && t < s + 0.55) || (t > 8.25 && t < 8.7);
    const key = [done, brand, paintI, live ? Math.round(t * 30) : 0].join('|');
    if (key === hKey) return; hKey = key;
    hud.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(12,14,20,0.84)'; roundRect(c, 4, 4, w - 8, h - 8, 28); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
      c.textBaseline = 'middle';
      c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = '700 16px Inter, system-ui, sans-serif'; c.fillText('ONE BUILDER, EVERY BRAND', 34, 46);
      c.fillStyle = '#fff'; c.font = '800 38px Inter, system-ui, sans-serif'; c.fillText(brand, 34, 90);
      BRANDS.forEach((b, i) => { c.fillStyle = b === brand ? '#fff' : 'rgba(255,255,255,0.2)'; c.fillRect(34 + i * 30, 118, 22, 4); });
      const rows = [['MODEL', 'Midsize SUV'], ['TRIM', 'Premium'], ['COLOR', ''], ['PRICE', '']];
      rows.forEach(([lab, val], i) => {
        const y = 156 + i * 104, on = done === i, set = done > i;
        c.fillStyle = on ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.04)'; roundRect(c, 26, y, w - 52, 86, 16); c.fill();
        if (on) { c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.stroke(); }
        c.fillStyle = 'rgba(255,255,255,0.5)'; c.font = '700 15px Inter, system-ui, sans-serif'; c.fillText(lab, 48, y + 26);
        if (i === 2) {
          PAINT.forEach(([, col], j) => { const sel = j === Math.max(0, paintI - 1) && paintI > 0; c.fillStyle = '#' + col.toString(16).padStart(6, '0'); c.beginPath(); c.arc(62 + j * 52, y + 58, sel ? 18 : 14, 0, 7); c.fill(); if (sel) { c.strokeStyle = '#fff'; c.lineWidth = 3; c.beginPath(); c.arc(62 + j * 52, y + 58, 23, 0, 7); c.stroke(); } });
        } else if (i === 3) {
          c.fillStyle = '#fff'; c.font = '800 32px "JetBrains Mono", ui-monospace, monospace'; c.fillText('$' + price.toLocaleString('en-US'), 48, y + 58);
        } else if (set || on) {
          c.fillStyle = set ? '#fff' : 'rgba(255,255,255,0.35)'; c.font = '700 26px Inter, system-ui, sans-serif'; c.fillText(set ? val : 'Choose…', 48, y + 58);
        }
        if (set && i < 3) { c.fillStyle = '#fff'; c.beginPath(); c.arc(w - 62, y + 43, 14, 0, 7); c.fill(); c.strokeStyle = '#0b0d12'; c.lineWidth = 4; c.beginPath(); c.moveTo(w - 69, y + 43); c.lineTo(w - 64, y + 48); c.lineTo(w - 55, y + 37); c.stroke(); }
      });
      const by = h - 112;
      c.fillStyle = build > 0 ? '#ffffff' : 'rgba(255,255,255,0.14)'; roundRect(c, 26, by, w - 52, 76, 38); c.fill();
      c.fillStyle = build > 0 ? '#0b0d12' : 'rgba(255,255,255,0.7)'; c.font = '800 26px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('BUILD IT', w / 2, by + 39); c.textAlign = 'left';
    });
  };

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.0, 1.55, 4.0]], [2.4, [0.25, 1.5, 3.75], (x) => x],
    [4.2, [1.6, 1.15, 3.1]], [7.9, [2.15, 0.95, 2.4], (x) => x],
    [9.2, [2.25, 0.42, 1.75]], [10, [2.2, 0.38, 1.6], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 1.2, 0]], [2.4, [0, 1.15, 0.1], (x) => x],
    [4.2, [0.25, 0.5, 0]], [7.9, [0.35, 0.5, 0], (x) => x],
    [9.2, [0.1, 0.42, 0]], [10, [0.1, 0.42, 0], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), c0 = new THREE.Color(), c1 = new THREE.Color();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.01, p[1] + Math.sin(t * 1.5) * 0.006, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [4.2, 32], [7.9, 30], [9.2, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Act 1: a cloud of options; Act 2: they sort into three body styles.
    const sort = k(t, 2.2, 3.4);
    for (let i = 0; i < CN; i++) {
      const a = rnd(i, 1) * Math.PI * 2 + t * (0.4 + rnd(i, 2) * 0.9) * (rnd(i, 5) > 0.5 ? 1 : -1);
      const r = 0.6 + rnd(i, 3) * 1.1, y = 0.5 + rnd(i, 4) * 1.4 + Math.sin(t * 1.3 + i) * 0.08;
      const j = i % 3, e = eio(clamp(sort * 1.3 - rnd(i, 6) * 0.3));
      p4.set(lerp(Math.cos(a) * r, lane[j][0], e), lerp(y, lane[j][1], e), lerp(Math.sin(a) * r * 0.6, lane[j][2], e));
      e4.set(t * rnd(i, 7) * 3 * (1 - e), a * (1 - e), t * rnd(i, 8) * 2 * (1 - e)); q4.setFromEuler(e4);
      const sc = Math.max(0.001, (1 - ei(k(e, 0.8, 1))) * eo(k(t, 0.1 + rnd(i, 9) * 0.6, 0.6 + rnd(i, 9) * 0.6)));
      m4.compose(p4, q4, s4.set(sc, sc, sc)); chips.setMatrixAt(i, m4);
    }
    chips.instanceMatrix.needsUpdate = true;
    chips.visible = t < 3.5;
    const mp = eo(k(t, 0.4, 0.9)) * (1 - ei(k(t, 2.1, 2.5)));
    many.material.opacity = mp; many.visible = mp > 0.01; many.lookAt(camera.position);
    const tileIn = back(k(t, 2.9, 3.3)), pick = eo(k(t, 3.45, 3.7)), tileOut = ei(k(t, 3.9, 4.4));
    tiles.forEach((l, j) => {
      l.lookAt(camera.position);
      l.scale.setScalar(Math.max(0.001, tileIn * (j === 1 ? 1 + pick * 0.15 : 1 - pick * 0.1)));
      l.material.opacity = clamp(tileIn) * (j === 1 ? 1 - pick : 1 - pick * 0.6) * (1 - tileOut);
      l.position.y = lane[j][1] + tileOut * 0.3;
      l.visible = tileIn > 0.01 && tileOut < 1;
    });
    picked.lookAt(camera.position); picked.position.y = lane[1][1] + tileOut * 0.3;
    picked.scale.setScalar(Math.max(0.001, tileIn * (1 + pick * 0.15)));
    picked.material.opacity = pick * (1 - tileOut); picked.visible = pick > 0.01 && tileOut < 1;

    // Act 3: scan the SUV onto the turntable, then spin under the builder.
    const rv = eio(k(t, 3.9, 4.9));
    spinG.rotation.y = 0.35 - t * 0.08;
    spinG.updateMatrixWorld();
    const front = lerp(-1.35, 1.35, rv);
    // The plane is in world space; the car turns, so cut along the car's own length axis.
    const ax = new THREE.Vector3(1, 0, 0).applyQuaternion(spinG.quaternion);
    reveal.normal.copy(ax).negate(); reveal.constant = front;
    scan.position.copy(ax).multiplyScalar(front); scan.position.y = 0.05 + 0.425;
    scan.rotation.set(0, spinG.rotation.y + Math.PI / 2, 0);
    scan.visible = rv > 0 && rv < 1; scan.scale.set(1, 1, 1);
    car.visible = rv > 0;

    const hin = eo(k(t, 4.6, 5.2));
    // The builder rides in the left of frame, so it stays readable as the camera moves.
    camera.updateMatrixWorld();
    hudM.position.set(-0.62 - (1 - hin) * 0.2, 0.06, -1.75).applyMatrix4(camera.matrixWorld);
    hudM.quaternion.copy(camera.quaternion);
    hudM.material.opacity = hin * (1 - ei(k(t, 8.9, 9.4))); hudM.visible = hin > 0.01;
    drawHud(t);

    // Paint changes with a quick blend at each color pick.
    let col = PAINT[0][1];
    for (let i = 0; i < PAINT.length; i++) {
      const [pt, cc] = PAINT[i];
      if (t > pt) { const prev = i ? PAINT[i - 1][1] : cc; c0.setHex(prev); c1.setHex(cc); col = c0.lerp(c1, eo(k(t, pt, pt + 0.35))).getHex(); }
    }
    paint.color.setHex(col);

    // Hero: headlights come up as the camera drops low.
    const hl = eo(k(t, 8.4, 8.9));
    heads.forEach((g) => { g.material.opacity = hl * 0.9; });
    headM.color.setScalar(0.4 + hl * 0.6);
    top.intensity = 24 + hl * 6;
  }

  return { scene, camera, update, duration: D, poster: 7.6 };
}
