// Fujifilm Instax North America website lit loop, 10 s. "From the shutter to the site."
// A pastel desk against a peach wall, late-afternoon sun pouring through a window so its mullions throw
// soft bars across everything; string lights and a few prints hang on the wall. A mint instant camera
// fires its flash and feeds a print out of the top. The print floats free, turns to camera and develops
// from dark to a sunset. It then flies into the gallery on a phone standing beside the camera and lands
// in the one empty slot; product education and Gen Z support pop out of the site as two chips, and the
// title card settles over the scene.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const MINT = 0x8fd3c1, INK = '#2b1f3a', CREAM = '#efe7da';
// Beat times.
const PRESS = 1.05, FLASH = 1.2, EJ0 = 1.4, EJ1 = 2.3, FREE = 2.35, HERO = 2.95, DEV0 = 2.9, DEV1 = 4.6;
const FLY0 = 4.7, LAND = 5.5, CHIP_A = 5.9, CHIP_B = 6.2, TITLE = 6.8;
// Photo palettes: sky top, sky mid, horizon, sun, ground.
const PAL = [
  ['#5b4b8a', '#f08a7e', '#ffc58f', '#fff1c9', '#3a3550'],
  ['#2f6f8f', '#7cc6c9', '#f3e2b3', '#fffbe8', '#2c4a3e'],
  ['#8a4f7d', '#f2a2b8', '#ffd7c2', '#fff6ea', '#4a2f45'],
  ['#3d4f8f', '#9fb3e8', '#f6c9d9', '#fff2f6', '#2e3150'],
  ['#c0584f', '#f6a165', '#ffd38a', '#fff3cf', '#4b2b26'],
  ['#4c7a5b', '#a8d5a0', '#f1edc0', '#fffde8', '#2d3b2c'],
];
const ls = (c, px) => { if ('letterSpacing' in c) c.letterSpacing = px + 'px'; };

// A small instant photo: sky, sun, a horizon and two friends, with grain and vignette.
function drawPhoto(c, x, y, w, h, seed) {
  const p = PAL[seed % PAL.length];
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const hz = y + h * (0.56 + rnd(seed, 3) * 0.08);
  const g = c.createLinearGradient(0, y, 0, hz);
  g.addColorStop(0, p[0]); g.addColorStop(0.55, p[1]); g.addColorStop(1, p[2]);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const sx = x + w * (0.3 + rnd(seed, 4) * 0.4), sy = hz - h * 0.1, sr = w * 0.12;
  const sg = c.createRadialGradient(sx, sy, 0, sx, sy, sr * 4);
  sg.addColorStop(0, 'rgba(255,245,220,0.85)'); sg.addColorStop(0.25, 'rgba(255,220,180,0.35)'); sg.addColorStop(1, 'rgba(255,200,170,0)');
  c.fillStyle = sg; c.fillRect(x, y, w, h);
  c.fillStyle = p[3]; c.beginPath(); c.arc(sx, sy, sr, 0, 7); c.fill();
  // Water or hills below the horizon, with the sun's reflection.
  c.fillStyle = p[4]; c.fillRect(x, hz, w, h);
  if (seed % 2 === 0) {
    for (let i = 0; i < 9; i++) { c.fillStyle = `rgba(255,230,190,${0.5 - i * 0.05})`; const ww = sr * (1.6 - i * 0.12); c.fillRect(sx - ww / 2, hz + 4 + i * h * 0.03, ww, h * 0.012); }
  } else {
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.beginPath(); c.moveTo(x, hz + 6);
    for (let i = 0; i <= 12; i++) c.lineTo(x + (i / 12) * w, hz - Math.sin(i * 0.9 + seed) * h * 0.04 - h * 0.02);
    c.lineTo(x + w, y + h); c.lineTo(x, y + h); c.closePath(); c.fill();
  }
  // Two friends in silhouette.
  c.fillStyle = 'rgba(20,14,28,0.92)';
  [[0.3, 1], [0.66, 0.92]].forEach(([fx, s], i) => {
    const px = x + w * (fx + (rnd(seed, 6 + i) - 0.5) * 0.1), base = y + h, hh = h * 0.32 * s;
    roundRect(c, px - w * 0.06 * s, base - hh, w * 0.12 * s, hh, w * 0.04); c.fill();
    c.beginPath(); c.arc(px, base - hh - w * 0.05 * s, w * 0.045 * s, 0, 7); c.fill();
    c.save(); c.translate(px + (i ? -1 : 1) * w * 0.05 * s, base - hh + h * 0.03); c.rotate((i ? -1 : 1) * -0.9);
    roundRect(c, -w * 0.015, -h * 0.13 * s, w * 0.03, h * 0.13 * s, w * 0.015); c.fill(); c.restore();
  });
  // Film grain and a soft vignette.
  for (let i = 0; i < (w * h) / 60; i++) { const v = rnd(i, seed + 20) > 0.5 ? 255 : 0; c.fillStyle = `rgba(${v},${v},${v},${rnd(i, seed + 21) * 0.08})`; c.fillRect(x + rnd(i, seed + 22) * w, y + rnd(i, seed + 23) * h, 1.5, 1.5); }
  const vg = c.createRadialGradient(x + w / 2, y + h / 2, w * 0.3, x + w / 2, y + h / 2, w * 0.85);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(30,10,30,0.35)');
  c.fillStyle = vg; c.fillRect(x, y, w, h);
  c.restore();
}
// A whole print (border plus photo) drawn into a canvas, for props.
function printCanvas(seed, W = 256) {
  const H = Math.round(W / 0.627);
  return canvasTex(W, H, (c, w, h) => {
    c.fillStyle = CREAM; c.fillRect(0, 0, w, h);
    const m = w * 0.074;
    drawPhoto(c, m, m * 0.95, w - m * 2, (w - m * 2) / 0.742, seed);
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x3a2730);
  scene.fog = new THREE.Fog(0x3a2730, 5, 13);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- desk and wall
  const desk = mesh(new RoundedBoxGeometry(8, 0.12, 4.3, 3, 0.03), std(0xffffff, { map: grainTex('#8d7cae', { size: 256, speck: 0.06, blot: 0.05, seed: 3, repeat: 4 }), roughness: 0.38 }));
  desk.position.set(0, -0.06, 0.25); scene.add(desk);
  const wall = mesh(new THREE.PlaneGeometry(14, 6), std(0xffffff, { map: grainTex('#c98c7c', { size: 256, speck: 0.07, blot: 0.07, seed: 11, repeat: 5 }), roughness: 0.92 }), { cast: false });
  wall.position.set(0, 2.5, -1.9); scene.add(wall);

  // ----------------------------------------------------------- light: sun through a window
  scene.add(new THREE.HemisphereLight(0xc7b3e6, 0x4a3040, 0.42));
  const SUNP = new THREE.Vector3(-3.6, 3.3, 3.4), SUNT = new THREE.Vector3(-0.1, 0.55, -0.4);
  const sun = new THREE.DirectionalLight(0xffcf9c, 2.5);
  sun.position.copy(SUNP); sun.target.position.copy(SUNT);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -5.5, right: 5.5, top: 5.5, bottom: -5.5, near: 0.5, far: 14 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02; sun.shadow.radius = 4;
  scene.add(sun, sun.target);
  // The window: an invisible screen with three-by-two panes cut out. It only writes to the shadow map,
  // so the sun lands as a lit window shape with soft mullion bars on desk, props and wall.
  const win = new THREE.Shape(); win.moveTo(-7, -7); win.lineTo(7, -7); win.lineTo(7, 7); win.lineTo(-7, 7); win.closePath();
  const WW = 4.3, WH = 3.5, BAR = 0.09;
  for (let cx = 0; cx < 3; cx++) for (let cy = 0; cy < 2; cy++) {
    const pw = (WW - BAR * 2) / 3, ph = (WH - BAR) / 2;
    const x0 = -WW / 2 + cx * (pw + BAR), y0 = -WH / 2 + cy * (ph + BAR);
    const hole = new THREE.Path(); hole.moveTo(x0, y0); hole.lineTo(x0, y0 + ph); hole.lineTo(x0 + pw, y0 + ph); hole.lineTo(x0 + pw, y0); hole.closePath();
    win.holes.push(hole);
  }
  const gobo = new THREE.Mesh(new THREE.ShapeGeometry(win), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, side: THREE.DoubleSide }));
  gobo.castShadow = true; gobo.receiveShadow = false;
  gobo.position.lerpVectors(SUNP, SUNT, 0.38); gobo.lookAt(SUNP); gobo.rotateZ(0.04);
  scene.add(gobo);
  const rim = new THREE.DirectionalLight(0xa9c4ff, 0.9); rim.position.set(3, 2.2, -3); scene.add(rim);
  const flashL = new THREE.PointLight(0xfff4e6, 0, 5, 2); scene.add(flashL);

  // Sun shafts: soft additive planes along the light, and dust turning in them.
  const dir = SUNT.clone().sub(SUNP).normalize();
  const shaftTex = canvasTex(64, 256, (c, w, h) => {
    const gx = c.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, 'rgba(255,255,255,0)'); gx.addColorStop(0.5, 'rgba(255,255,255,1)'); gx.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = gx; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in';
    const gy = c.createLinearGradient(0, 0, 0, h);
    gy.addColorStop(0, 'rgba(0,0,0,0)'); gy.addColorStop(0.3, 'rgba(0,0,0,1)'); gy.addColorStop(0.8, 'rgba(0,0,0,0.6)'); gy.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = gy; c.fillRect(0, 0, w, h);
  }).tex;
  const shafts = [[-0.9, 0.9, 0.055], [0.5, 1.2, 0.04]].map(([off, wdt, op], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wdt, 6), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffd2a0, transparent: true, opacity: op, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false, fog: false }));
    const ctr = SUNP.clone().lerp(SUNT, 0.62).add(new THREE.Vector3(off, 0.1 * i, -off * 0.6));
    const view = new THREE.Vector3(0.1, 1.1, 3).sub(ctr);
    const zAx = view.sub(dir.clone().multiplyScalar(view.dot(dir))).normalize();
    const xAx = new THREE.Vector3().crossVectors(dir, zAx).normalize();
    m.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAx, dir.clone().negate(), zAx));
    m.position.copy(ctr); m.userData.op = op;
    scene.add(m);
    return m;
  });
  const DN = 180, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd8b0, size: 0.008, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- string lights and prints on the wall
  const sag = (x) => 2.05 - 0.28 * (1 - (x / 2.8) ** 2);
  const wirePts = []; for (let i = 0; i <= 24; i++) { const x = -2.8 + (i / 24) * 5.6; wirePts.push(new THREE.Vector3(x, sag(x), -1.86)); }
  const wire = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(wirePts), 60, 0.006, 5), std(0x2a2226, { roughness: 0.6 }));
  scene.add(wire);
  const BN = 13, bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.028, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }), BN);
  const bPos = new Float32Array(BN * 3), bCol = new Float32Array(BN * 3);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < BN; i++) { const x = -2.6 + (i / (BN - 1)) * 5.2, y = sag(x) - 0.05; m4.makeTranslation(x, y, -1.84); bulbs.setMatrixAt(i, m4); bPos.set([x, y, -1.82], i * 3); }
  scene.add(bulbs);
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bPos, 3)); bGeo.setAttribute('color', new THREE.BufferAttribute(bCol, 3));
  const softDot = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const bGlow = new THREE.Points(bGeo, new THREE.PointsMaterial({ map: softDot, size: 0.34, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  bGlow.frustumCulled = false; scene.add(bGlow);
  [[-1.95, 1, -0.06], [-0.7, 3, 0.05], [0.65, 5, -0.04], [1.95, 2, 0.07]].forEach(([x, seed, rz]) => {
    const pt = printCanvas(seed, 192);
    const pm = mesh(new THREE.PlaneGeometry(0.34, 0.54), std(0xffffff, { map: pt.tex, roughness: 0.5 }), { cast: false });
    pm.position.set(x, sag(x) - 0.36, -1.875); pm.rotation.z = rz; scene.add(pm);
  });

  // ----------------------------------------------------------- props on the desk
  [[-1.75, 0.95, 0.5, 4], [1.55, 1.15, -0.4, 0], [1.9, 0.75, 0.25, 2]].forEach(([x, z, ry, seed]) => {
    const pt = printCanvas(seed, 256);
    const pm = mesh(new THREE.BoxGeometry(0.42, 0.006, 0.67), [std(0xe6ded0), std(0xe6ded0), std(0xffffff, { map: pt.tex, roughness: 0.35 }), std(0xd8d0c2), std(0xe6ded0), std(0xe6ded0)]);
    pm.position.set(x, 0.003, z); pm.rotation.y = ry; scene.add(pm);
  });

  // ----------------------------------------------------------- the instant camera
  const cam = new THREE.Group(); cam.position.set(-0.82, 0, 0.1); cam.rotation.y = 0.38; scene.add(cam);
  const BW = 0.86, BH = 0.95, BD = 0.48;
  const shell = new THREE.MeshPhysicalMaterial({ color: MINT, roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.3 });
  const body = mesh(new RoundedBoxGeometry(BW, BH, BD, 5, 0.12), shell); body.position.y = BH / 2; cam.add(body);
  const barrel = mesh(new THREE.CylinderGeometry(0.25, 0.265, 0.17, 64), new THREE.MeshPhysicalMaterial({ color: 0xa3ddcf, roughness: 0.38, clearcoat: 0.5, clearcoatRoughness: 0.3 }));
  barrel.rotation.x = Math.PI / 2; barrel.position.set(0.03, 0.42, BD / 2 + 0.085); cam.add(barrel);
  const lensRing = mesh(new THREE.TorusGeometry(0.19, 0.022, 12, 64), std(0x1b1f24, { roughness: 0.35, metalness: 0.4 }));
  lensRing.position.set(0.03, 0.42, BD / 2 + 0.178); cam.add(lensRing);
  const glass = new THREE.Mesh(new THREE.CircleGeometry(0.175, 48), new THREE.MeshPhysicalMaterial({ color: 0x0b1016, roughness: 0.05, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.03, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  // Glass and inner ring sit clear of the barrel's front cap (at +0.17) so they don't z-fight with it.
  glass.position.set(0.03, 0.42, BD / 2 + 0.176); cam.add(glass);
  const inner = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.1, 40), new THREE.MeshPhysicalMaterial({ color: 0x23384e, roughness: 0.1, metalness: 0.6, clearcoat: 1, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }));
  inner.position.set(0.03, 0.42, BD / 2 + 0.181); cam.add(inner);
  const glint = glow(0xcfe6ff, 0.16, 0.5, 0.25); glint.position.set(-0.03, 0.48, BD / 2 + 0.19); cam.add(glint);
  const flashTex = canvasTex(128, 80, (c, w, h) => {
    c.fillStyle = '#e9eef0'; c.fillRect(0, 0, w, h);
    for (let x = 4; x < w; x += 7) { c.fillStyle = 'rgba(120,140,150,0.35)'; c.fillRect(x, 0, 2, h); }
  }).tex;
  const flashM = std(0xffffff, { map: flashTex, roughness: 0.2, emissive: 0xfff2dd, emissiveMap: flashTex, emissiveIntensity: 0.05 });
  const flashWin = mesh(new RoundedBoxGeometry(0.22, 0.13, 0.03, 2, 0.02), flashM, { cast: false }); flashWin.position.set(0.24, 0.8, BD / 2 + 0.002); cam.add(flashWin);
  const vf = mesh(new RoundedBoxGeometry(0.12, 0.09, 0.03, 2, 0.015), std(0x0d1116, { roughness: 0.08, metalness: 0.3 }), { cast: false }); vf.position.set(-0.27, 0.8, BD / 2 + 0.002); cam.add(vf);
  const btn = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.04, 24), std(0x76bfae, { roughness: 0.45 }));
  btn.rotation.x = Math.PI / 2; cam.add(btn);
  const slot = mesh(new THREE.BoxGeometry(0.5, 0.012, 0.035), std(0x0c0d10, { roughness: 0.6 }), { cast: false }); slot.position.set(0, BH + 0.001, 0.04); cam.add(slot);
  const flashGlow = glow(0xfff6e8, 2.6, 0, 0.3); flashGlow.position.set(0.24, 0.8, BD / 2 + 0.06); cam.add(flashGlow);

  // ----------------------------------------------------------- the print
  const PW = 0.42, PH = 0.67, IW = 0.36, IH = 0.485, IY = PH / 2 - 0.032 - IH / 2;
  const print = new THREE.Group(); scene.add(print);
  const pBody = mesh(new THREE.BoxGeometry(PW, PH, 0.008), std(0xe6ded0, { roughness: 0.55 })); print.add(pBody);
  const heroTex = canvasTex(512, 690, (c, w, h) => drawPhoto(c, 0, 0, w, h, 0)).tex;
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), std(0xffffff, { map: heroTex, roughness: 0.22 }));
  photo.position.set(0, IY, 0.0045); photo.receiveShadow = true; print.add(photo);
  const film = new THREE.Mesh(new THREE.PlaneGeometry(IW, IH), std(0x262c2c, { roughness: 0.25, transparent: true, opacity: 1, depthWrite: false }));
  film.position.set(0, IY, 0.0052); print.add(film);
  const printGlow = glow(0xffd6b0, 1.2, 0, 0.45); printGlow.position.z = -0.08; print.add(printGlow);

  // ----------------------------------------------------------- the phone and its site
  const ph = phone({ w: 0.7, h: 1.42, d: 0.07, frame: 0xd9c9e6, r: 0.085 });
  ph.position.set(0.72, 0.76, -0.05); ph.rotation.set(-0.12, -0.32, 0, 'YXZ'); scene.add(ph);
  ph.children[0].material = new THREE.MeshPhysicalMaterial({ color: 0xd9c9e6, metalness: 0.6, roughness: 0.3, clearcoat: 0.4 });
  const standM = std(0x5e4e78, { roughness: 0.4, metalness: 0.3 });
  const stand = new THREE.Group(); stand.position.set(0.72, 0, -0.05); stand.rotation.y = -0.32; scene.add(stand);
  const sBase = mesh(new RoundedBoxGeometry(0.5, 0.04, 0.42, 2, 0.015), standM); sBase.position.set(0, 0.02, -0.05); stand.add(sBase);
  const sBack = mesh(new RoundedBoxGeometry(0.34, 0.7, 0.03, 2, 0.012), standM); sBack.position.set(0, 0.38, -0.045); sBack.rotation.x = -0.12; stand.add(sBack);
  const { sw, sh } = ph.userData;
  const UW = 480, UH = Math.round(480 * sh / sw);
  const ui = canvasTex(UW, UH);
  ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.needsUpdate = true;
  const screenGlow = glow(0xd8c4ff, 2.4, 0.22, 0.5); screenGlow.position.z = -0.15; ph.add(screenGlow);
  const GX = [28, 176, 324], GY = [168, 392], GW = 128, GHt = 204, SLOT = [1, 0];
  const VID = [240, 712], FAB = [404, UH - 92];
  const toPhone = (u, v, z = 0.06, out = new THREE.Vector3()) => out.set((u / UW - 0.5) * sw, (0.5 - v / UH) * sh, ph.userData.d / 2 + z);
  const thumb = (c, x, y, seed, w = GW) => {
    const h = w / 0.627, m = w * 0.074;
    c.fillStyle = 'rgba(60,30,70,0.18)'; c.fillRect(x + 3, y + 5, w, h);
    c.fillStyle = CREAM; c.fillRect(x, y, w, h);
    drawPhoto(c, x + m, y + m * 0.95, w - m * 2, (w - m * 2) / 0.742, seed);
  };
  let uiKey = '';
  const drawUI = (t) => {
    const landed = t > LAND, ring = k(t, LAND, LAND + 0.7);
    const pa = k(t, CHIP_A - 0.15, CHIP_A + 0.5), pb = k(t, CHIP_B - 0.15, CHIP_B + 0.5);
    const live = (ring > 0 && ring < 1) || (pa > 0 && pa < 1) || (pb > 0 && pb < 1) || (t > FLY0 && t < LAND);
    const key = [landed, live ? Math.round(t * 30) : 0].join('|');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#fbf3ee'); bg.addColorStop(1, '#efe3f4');
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      // Status bar and header: a round mark, nav bars, a menu.
      c.fillStyle = INK; c.font = `700 18px ${SANS}`; c.textBaseline = 'middle'; c.fillText('9:41', 30, 30);
      c.fillRect(w - 70, 24, 34, 13);
      const lg = c.createLinearGradient(30, 70, 76, 116); lg.addColorStop(0, '#ff9fc0'); lg.addColorStop(1, '#8fd3c1');
      c.fillStyle = lg; c.beginPath(); c.arc(54, 94, 22, 0, 7); c.fill();
      c.fillStyle = 'rgba(43,31,58,0.22)'; roundRect(c, 92, 86, 110, 16, 8); c.fill();
      c.fillStyle = INK; for (let i = 0; i < 3; i++) c.fillRect(w - 66, 84 + i * 9, 34, 4);
      c.fillStyle = 'rgba(43,31,58,0.14)'; roundRect(c, 28, 136, 150, 14, 7); c.fill();
      // The gallery, with one slot waiting.
      let i = 0;
      for (let r = 0; r < 2; r++) for (let q = 0; q < 3; q++) {
        const x = GX[q], y = GY[r];
        if (q === SLOT[0] && r === SLOT[1]) {
          if (landed) {
            const s = 1 + 0.06 * Math.sin(Math.PI * ring);
            c.save(); c.translate(x + GW / 2, y + GHt / 2); c.scale(s, s); thumb(c, -GW / 2, -GHt / 2, 0); c.restore();
            if (ring < 1) { c.strokeStyle = `rgba(255,140,180,${1 - ring})`; c.lineWidth = 6; roundRect(c, x - 14 * ring - 4, y - 14 * ring - 4, GW + 28 * ring + 8, GHt + 28 * ring + 8, 12); c.stroke(); }
          } else {
            c.setLineDash([10, 8]); c.strokeStyle = 'rgba(43,31,58,0.4)'; c.lineWidth = 3; roundRect(c, x, y, GW, GHt, 6); c.stroke(); c.setLineDash([]);
            c.fillStyle = 'rgba(43,31,58,0.35)'; c.fillRect(x + GW / 2 - 14, y + GHt / 2 - 2, 28, 4); c.fillRect(x + GW / 2 - 2, y + GHt / 2 - 14, 4, 28);
          }
        } else thumb(c, x, y, [1, 2, 3, 4, 5][i++]);
      }
      // A how-to video card, and the help button.
      const vy = 632, vh = 176;
      const vg = c.createLinearGradient(28, vy, w - 28, vy + vh); vg.addColorStop(0, '#b9a5e6'); vg.addColorStop(1, '#f5a3c0');
      c.save(); roundRect(c, 28, vy, w - 56, vh, 18); c.clip(); c.fillStyle = vg; c.fillRect(28, vy, w - 56, vh);
      c.fillStyle = 'rgba(255,255,255,0.25)'; roundRect(c, 60, vy + 40, 110, 100, 20); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.beginPath(); c.arc(115, vy + 92, 30, 0, 7); c.fill(); c.restore();
      const pp = Math.sin(Math.PI * pa);
      c.fillStyle = `rgba(255,255,255,${0.85 + 0.15 * pp})`; c.beginPath(); c.arc(VID[0] + 40, VID[1] + 8, 34 + pp * 8, 0, 7); c.fill();
      c.fillStyle = '#8a6bd1'; c.beginPath(); c.moveTo(VID[0] + 30, VID[1] - 8); c.lineTo(VID[0] + 30, VID[1] + 24); c.lineTo(VID[0] + 56, VID[1] + 8); c.closePath(); c.fill();
      c.fillStyle = 'rgba(43,31,58,0.2)'; roundRect(c, 28, vy + vh + 22, 260, 14, 7); c.fill(); roundRect(c, 28, vy + vh + 46, 180, 14, 7); c.fill();
      const fp = Math.sin(Math.PI * pb);
      c.fillStyle = 'rgba(245,120,160,0.25)'; c.beginPath(); c.arc(FAB[0], FAB[1], 44 + fp * 18, 0, 7); c.fill();
      c.fillStyle = '#f07aa2'; c.beginPath(); c.arc(FAB[0], FAB[1], 38, 0, 7); c.fill();
      c.fillStyle = '#fff'; [-13, 0, 13].forEach((dx) => { c.beginPath(); c.arc(FAB[0] + dx, FAB[1], 5, 0, 7); c.fill(); });
    });
  };

  // ----------------------------------------------------------- chips and the title card
  const chip = (text, color, w) => {
    const g = new THREE.Group(); scene.add(g);
    const slab = mesh(new RoundedBoxGeometry(w, 0.2, 0.05, 4, 0.08), new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.2 }));
    g.add(slab);
    const tx = canvasTex(Math.round(512 * w / 0.2 / 2.5), 205, (c, cw, chh) => {
      c.font = `800 84px ${SANS}`; c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; ls(c, 1);
      c.fillText(text, cw / 2, chh / 2 + 4);
    }).tex;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(w, 0.2), new THREE.MeshBasicMaterial({ map: tx, transparent: true, depthWrite: false }));
    face.position.z = 0.0255; g.add(face);
    const halo = glow(color, 1.1, 0.0, 0.5); halo.position.z = -0.06; halo.scale.set(w * 1.6, 0.6, 1); g.add(halo);
    return { g, halo };
  };
  const chipA = chip('Product education', 0xc2b0ef, 1.0);
  const chipB = chip('Gen Z support', 0xf6a9c4, 0.82);
  const card = new THREE.Group(); scene.add(card);
  const cardSlab = mesh(new RoundedBoxGeometry(1.22, 0.46, 0.03, 3, 0.03), std(0x2e2442, { roughness: 0.32, metalness: 0.2 }));
  card.add(cardSlab);
  const cardTex = canvasTex(1024, 386, (c, w, h) => {
    c.textBaseline = 'middle';
    c.fillStyle = '#8fd3c1'; c.font = `700 34px ${MONO}`; ls(c, 6); c.fillText('FUJIFILM INSTAX', 54, 74);
    c.fillStyle = '#fbf1ea'; c.font = `800 76px ${SANS}`; ls(c, 0); c.fillText('Instax North America', 50, 176); c.fillText('website', 50, 266);
    c.fillStyle = '#f6a9c4'; roundRect(c, 54, 330, 120, 8, 4); c.fill();
  }).tex;
  const cardFace = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 0.46), new THREE.MeshBasicMaterial({ map: cardTex, transparent: true, depthWrite: false, toneMapped: false }));
  cardFace.position.z = 0.0155; card.add(cardFace);

  // ----------------------------------------------------------- camera moves
  const camPos = (t) => kf(t, [
    [0, [-0.3, 1.02, 2.25]], [1.2, [-0.42, 0.98, 1.98], (x) => x],
    [2.5, [-0.4, 1.32, 2.05]], [4.5, [-0.25, 1.26, 2.12], (x) => x],
    [5.6, [0.55, 1.08, 2.8]], [6.9, [0.3, 1.18, 3.05]],
    [8.4, [0.08, 1.3, 3.7]], [10, [0.0, 1.32, 3.85], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.82, 0.52, 0.1]], [1.2, [-0.82, 0.55, 0.1], (x) => x],
    [2.5, [-0.65, 1.08, 0.3]], [4.5, [-0.5, 1.08, 0.5], (x) => x],
    [5.6, [0.62, 0.9, -0.02]], [6.9, [0.25, 0.98, 0.2]],
    [8.4, [-0.06, 1.02, 0.15]], [10, [-0.1, 1.02, 0.15], (x) => x],
  ]);

  const tgt = new THREE.Vector3(), v = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3();
  const qCam = new THREE.Quaternion(), qHero = new THREE.Quaternion(), qPh = new THREE.Quaternion(), qW = new THREE.Quaternion();
  const helper = new THREE.Object3D(), eul = new THREE.Euler();
  const HEROP = new THREE.Vector3(-0.5, 1.1, 0.55);
  const slotUV = [GX[SLOT[0]] + GW / 2, GY[SLOT[1]] + GHt / 2];
  const PSCALE = (GW / UW) * sw / PW * 0.86;
  const CHIP_A_END = new THREE.Vector3(-0.12, 1.1, 0.62), CHIP_B_END = new THREE.Vector3(0.06, 0.8, 0.74);
  const CARD_END = new THREE.Vector3(-0.42, 1.62, 0.32);
  const eyeY = (o) => o.lookAt(camera.position.x, o.position.y, camera.position.z);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Light that moves: the sun drifts a touch, the shafts breathe, the bulbs twinkle.
    sun.position.set(SUNP.x + Math.sin(t * 0.3) * 0.08, SUNP.y, SUNP.z);
    shafts.forEach((s, i) => { s.material.opacity = s.userData.op * (0.8 + 0.2 * Math.sin(t * 0.9 + i * 2)); });
    for (let i = 0; i < BN; i++) { const f = 0.75 + 0.25 * Math.sin(t * (1.3 + rnd(i, 4)) + i * 2.1); bCol[i * 3] = 1 * f; bCol[i * 3 + 1] = 0.72 * f; bCol[i * 3 + 2] = 0.42 * f; }
    bGeo.attributes.color.needsUpdate = true;
    for (let i = 0; i < DN; i++) {
      const u = rnd(i, 31), w = (rnd(i, 32) - 0.5) * 1.6, hgt = (rnd(i, 33) - 0.5) * 1.2;
      dpos[i * 3] = lerp(-2.2, 0.4, u) + w * 0.6 + Math.sin(t * 0.25 + i) * 0.08;
      dpos[i * 3 + 1] = lerp(2.2, 0.35, u) + hgt + Math.sin(t * 0.4 + i * 1.7) * 0.04;
      dpos[i * 3 + 2] = lerp(1.6, -0.6, u) + w + Math.cos(t * 0.2 + i) * 0.08;
    }
    dGeo.attributes.position.needsUpdate = true;

    // Shutter: the button dips, then the flash fires and lights the room for a beat.
    const press = Math.sin(Math.PI * k(t, PRESS - 0.1, FLASH + 0.05));
    btn.position.set(0.32, 0.6, BD / 2 + 0.02 - press * 0.014);
    const fl = t < FLASH ? 0 : Math.exp(-(t - FLASH) * 9) * (1 - Math.exp(-(t - FLASH) * 80));
    flashM.emissiveIntensity = 0.05 + 5 * fl;
    flashGlow.material.opacity = 1.2 * fl;
    flashGlow.scale.setScalar(1.6 + fl * 2.2);
    flashWin.getWorldPosition(flashL.position); flashL.position.z += 0.25;
    flashL.intensity = 26 * fl;
    glint.material.opacity = 0.35 + 0.25 * Math.sin(t * 0.8);

    // Print: fed out of the top, pops free, turns to camera and develops, then flies into the site.
    cam.updateMatrixWorld();
    qCam.copy(cam.quaternion);
    helper.position.copy(HEROP); helper.lookAt(camera.position); qHero.copy(helper.quaternion);
    qW.setFromEuler(eul.set(Math.sin(t * 1.3) * 0.05, Math.sin(t * 0.9 + 1) * 0.08, Math.sin(t * 1.1) * 0.03));
    qHero.multiply(qW);
    ph.updateMatrixWorld();
    ph.getWorldQuaternion(qPh);
    const ej = k(t, EJ0, EJ1), feed = ej + 0.012 * Math.sin(ej * Math.PI * 14) * (1 - ej); // the motor's little judder
    const yLoc = lerp(BH - PH / 2 - 0.01, BH + PH / 2 - 0.1, clamp(feed));
    const outP = cam.localToWorld(a.set(0, yLoc, 0.04));
    let scale = 1;
    if (t < FREE) {
      print.position.copy(outP); print.quaternion.copy(qCam);
    } else if (t < HERO) {
      const u = k(t, FREE, HERO), e = eio(u);
      const ant = Math.sin(Math.PI * clamp(u * 3)) * -0.025 * (u < 0.33 ? 1 : 0);
      mid.lerpVectors(outP, HEROP, 0.5); mid.y += 0.25;
      v.set(0, 0, 0)
        .addScaledVector(outP, (1 - e) * (1 - e)).addScaledVector(mid, 2 * (1 - e) * e).addScaledVector(HEROP, e * e);
      print.position.copy(v); print.position.y += ant;
      print.quaternion.slerpQuaternions(qCam, qHero, e);
    } else if (t < FLY0) {
      print.position.copy(HEROP); print.position.y += Math.sin((t - HERO) * 2.2) * 0.015;
      print.quaternion.copy(qHero);
    } else {
      const u = k(t, FLY0, LAND), e = eio(u);
      const end = ph.localToWorld(toPhone(slotUV[0], slotUV[1], 0.012, b));
      mid.lerpVectors(HEROP, end, 0.5); mid.y += 0.32; mid.z += 0.35;
      v.set(0, 0, 0).addScaledVector(HEROP, (1 - e) * (1 - e)).addScaledVector(mid, 2 * (1 - e) * e).addScaledVector(end, e * e);
      print.position.copy(v);
      print.quaternion.slerpQuaternions(qHero, qPh, eio(clamp(u * 1.25)));
      print.rotateZ(Math.sin(Math.PI * u) * 0.35);
      scale = lerp(1, PSCALE, eio(u));
    }
    print.scale.setScalar(scale);
    print.visible = t < LAND && t > EJ0 - 0.05;
    const dev = eo(k(t, DEV0, DEV1));
    film.material.opacity = 1 - dev;
    photo.material.color.setScalar(lerp(0.75, 1, dev));
    printGlow.material.opacity = 0.35 * Math.sin(Math.PI * k(t, HERO - 0.3, FLY0 + 0.3)) * (t < LAND ? 1 : 0);

    // Phone UI.
    drawUI(t);
    ph.userData.screen.material.color.setScalar(0.88);
    ph.userData.sheen.position.x = Math.sin(t * 0.6) * 0.05;
    screenGlow.material.opacity = 0.18 + 0.25 * Math.exp(-Math.max(0, t - LAND) * 3) * (t > LAND ? 1 : 0);

    // Chips pop out of the site, overshoot, settle and float.
    [[chipA, CHIP_A, VID, CHIP_A_END, 0], [chipB, CHIP_B, FAB, CHIP_B_END, 1]].forEach(([ch, t0, uv, end, i]) => {
      const u = k(t, t0, t0 + 0.65), s = back(u);
      const from = ph.localToWorld(toPhone(uv[0], uv[1], 0.04, a));
      ch.g.position.lerpVectors(from, end, eo(u));
      ch.g.position.y += Math.sin((t - t0) * 1.6 + i * 1.3) * 0.012 * (u >= 1 ? 1 : u);
      ch.g.position.z += Math.sin(Math.PI * u) * 0.12;
      ch.g.scale.setScalar(Math.max(0.001, lerp(0.15, 1, s)));
      eyeY(ch.g); ch.g.rotateZ((1 - eo(u)) * (i ? 0.5 : -0.5) + Math.sin(t * 0.9 + i) * 0.015);
      ch.g.visible = u > 0;
      ch.halo.material.opacity = 0.35 * clamp(u * 2) + 0.4 * Math.sin(Math.PI * u);
    });

    // Title card: rises in from below the frame and settles with a soft overshoot.
    const c1 = back(k(t, TITLE, TITLE + 0.7));
    card.position.set(CARD_END.x, CARD_END.y - (1 - c1) * 0.35, CARD_END.z);
    card.position.y += Math.sin((t - TITLE) * 1.2) * 0.008 * (c1 > 0.99 ? 1 : 0);
    eyeY(card); card.rotateX((1 - eo(k(t, TITLE, TITLE + 0.7))) * 0.6);
    card.scale.setScalar(Math.max(0.001, lerp(0.85, 1, c1)));
    cardFace.material.opacity = eo(k(t, TITLE + 0.05, TITLE + 0.45));
    card.visible = t > TITLE;
  }

  return { scene, camera, update, duration: D, poster: 8.0 };
}
