// MRM AI and asset management vision lit loop, 10 s. "One asset, personalized campaigns."
// A dark glass map table at night. On the left stands the asset library, a wall of thumbnails; three
// people wait on the right, each beside an empty ad slot. One hero asset lifts out of the library and
// flies into the AI core, which ignites in crimson. Three light paths run out to the three slots, and
// each one fills with its own personalized version of the same asset as its person lights up. The
// camera pulls back to the whole map under the title.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const CRIMSON = 0xff2d55, CHAMP = 0xf3d9a4, INK = 0x07060b;
// The source asset, then the three personalized cuts of it, one per person.
const HERO = { a: '#ff9a5a', b: '#2a1030', acc: '#ffe2a8', dune: ['#7a2a3a', '#4a1630'] };
const VARS = [
  { a: '#ff7a3d', b: '#3a0f2e', acc: '#ffd27a', dune: ['#8a2c3a', '#521a34'], p: '#ff8a4c', pc: 0xff8a4c, zoom: 1.0, fx: 0.5, fy: 0.5 },
  { a: '#6fd6ff', b: '#141f48', acc: '#eaf8ff', dune: ['#2b4a8a', '#1a2a5c'], p: '#6fd6ff', pc: 0x6fd6ff, zoom: 1.5, fx: 0.42, fy: 0.5 },
  { a: '#c9ff72', b: '#173426', acc: '#f7ffe0', dune: ['#2f6a3e', '#1c4229'], p: '#b8f25e', pc: 0xb8f25e, zoom: 1.25, fx: 0.62, fy: 0.42 },
];
const LIB = new THREE.Vector3(-1.25, 0.6, -0.12), LIB_RY = 0.38;
const CORE = new THREE.Vector3(0, 0.58, 0);
const CARD_X = 1.08, CARD_Y = [0.95, 0.58, 0.21], CARD_RY = -0.34;
const HERO_CELL = [2, 1];                     // column, row in the 4 x 4 library
const OUT = [3.75, 4.35, 4.95], TRAVEL = 0.7; // each path starts, then lands TRAVEL later

// The asset itself: dusk sky, a low sun, dunes and a glass bottle standing in the light.
function drawHero(c, x, y, w, h, v, zoom = 1, fx = 0.5, fy = 0.5) {
  c.save(); c.beginPath(); c.rect(x, y, w, h); c.clip();
  const S = Math.max(w, h) * zoom, ox = x + w / 2 - S * fx, oy = y + h / 2 - S * fy;
  const g = c.createLinearGradient(0, oy, 0, oy + S); g.addColorStop(0, v.b); g.addColorStop(0.72, v.a); g.addColorStop(1, v.a);
  c.fillStyle = g; c.fillRect(x, y, w, h);
  const sx = ox + 0.66 * S, sy = oy + 0.5 * S;
  const sg = c.createRadialGradient(sx, sy, 0, sx, sy, 0.34 * S); sg.addColorStop(0, v.acc); sg.addColorStop(0.32, v.acc); sg.addColorStop(0.36, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg; c.fillRect(x, y, w, h);
  c.fillStyle = v.dune[0]; c.beginPath(); c.moveTo(ox - 10, oy + 0.66 * S); c.bezierCurveTo(ox + 0.3 * S, oy + 0.52 * S, ox + 0.55 * S, oy + 0.78 * S, ox + 1.05 * S, oy + 0.6 * S); c.lineTo(ox + 1.05 * S, oy + 1.05 * S); c.lineTo(ox - 10, oy + 1.05 * S); c.fill();
  c.fillStyle = v.dune[1]; c.beginPath(); c.moveTo(ox - 10, oy + 0.82 * S); c.bezierCurveTo(ox + 0.35 * S, oy + 0.7 * S, ox + 0.7 * S, oy + 0.92 * S, ox + 1.05 * S, oy + 0.78 * S); c.lineTo(ox + 1.05 * S, oy + 1.05 * S); c.lineTo(ox - 10, oy + 1.05 * S); c.fill();
  // The bottle: a soft glass capsule with a highlight and a long shadow.
  const bx = ox + 0.34 * S, by = oy + 0.44 * S, bw = 0.12 * S, bh = 0.3 * S;
  c.fillStyle = 'rgba(0,0,0,0.28)'; c.beginPath(); c.ellipse(bx + bw * 0.9, by + bh, bw * 1.1, bw * 0.16, 0, 0, 7); c.fill();
  const bg = c.createLinearGradient(bx, 0, bx + bw, 0); bg.addColorStop(0, 'rgba(255,255,255,0.85)'); bg.addColorStop(0.35, v.acc); bg.addColorStop(1, v.dune[1]);
  c.fillStyle = bg; roundRect(c, bx, by, bw, bh, bw * 0.45); c.fill();
  c.fillStyle = v.dune[1]; roundRect(c, bx + bw * 0.3, by - bh * 0.16, bw * 0.4, bh * 0.2, bw * 0.08); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.7)'; roundRect(c, bx + bw * 0.16, by + bh * 0.14, bw * 0.12, bh * 0.6, bw * 0.06); c.fill();
  c.restore();
}

// Three personalized ads: the same asset, cut and laid out for each person. Copy is shown as bars.
function drawAd(c, w, h, v, i) {
  c.fillStyle = '#121018'; c.fillRect(0, 0, w, h);
  const bar = (x, y, bw, a = 0.85) => { c.fillStyle = `rgba(255,255,255,${a})`; roundRect(c, x, y, bw, 14, 7); c.fill(); };
  const cta = (x, y) => { c.fillStyle = v.p; roundRect(c, x, y, 128, 40, 20); c.fill(); c.fillStyle = 'rgba(10,8,14,0.85)'; roundRect(c, x + 26, y + 15, 76, 10, 5); c.fill(); };
  if (i === 0) {
    drawHero(c, 0, 0, w, h * 0.64, v, v.zoom, v.fx, v.fy);
    bar(28, h * 0.64 + 26, 300); bar(28, h * 0.64 + 52, 210, 0.5);
    cta(w - 160, h * 0.64 + 32);
  } else if (i === 1) {
    drawHero(c, w * 0.44, 0, w * 0.56, h, v, v.zoom, v.fx, v.fy);
    c.fillStyle = v.p; c.fillRect(0, 0, 10, h);
    bar(36, 70, 170); bar(36, 100, 190); bar(36, 130, 120, 0.5); bar(36, 156, 150, 0.5);
    cta(36, h - 96);
  } else {
    drawHero(c, 0, 0, w, h, v, v.zoom, v.fx, v.fy);
    const g = c.createLinearGradient(0, h * 0.45, 0, h); g.addColorStop(0, 'rgba(10,8,14,0)'); g.addColorStop(1, 'rgba(10,8,14,0.85)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    bar(30, h - 98, 260); bar(30, h - 72, 180, 0.6);
    cta(w - 158, h - 92);
  }
  c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 4; c.strokeRect(2, 2, w - 4, h - 4);
}

// Each person as a portrait medallion: a cap, long hair, headphones. No names, just people.
function drawPerson(c, w, h, v, i) {
  const g = c.createRadialGradient(w / 2, h * 0.35, 10, w / 2, h / 2, w / 2);
  g.addColorStop(0, v.p); g.addColorStop(1, v.b);
  c.fillStyle = g; c.beginPath(); c.arc(w / 2, h / 2, w / 2, 0, 7); c.fill();
  c.save(); c.beginPath(); c.arc(w / 2, h / 2, w / 2 - 2, 0, 7); c.clip();
  const ink = 'rgba(14,10,20,0.88)';
  c.fillStyle = ink;
  if (i === 1) { c.beginPath(); c.ellipse(w / 2, h * 0.48, 62, 78, 0, 0, 7); c.fill(); }
  c.beginPath(); c.ellipse(w / 2, h * 1.02, 96, 80, 0, Math.PI, 0); c.fill();
  c.beginPath(); c.arc(w / 2, h * 0.42, 46, 0, 7); c.fill();
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(w / 2 - 12, h * 0.38, 18, 0, 7); c.fill();
  c.fillStyle = ink;
  if (i === 0) { c.beginPath(); c.arc(w / 2, h * 0.38, 50, Math.PI, 0); c.fill(); roundRect(c, w / 2 - 6, h * 0.36, 80, 14, 7); c.fill(); }
  if (i === 2) {
    c.strokeStyle = ink; c.lineWidth = 12; c.beginPath(); c.arc(w / 2, h * 0.42, 58, Math.PI * 1.05, Math.PI * 1.95); c.stroke();
    roundRect(c, w / 2 - 70, h * 0.4, 22, 40, 8); c.fill(); roundRect(c, w / 2 + 48, h * 0.4, 22, 40, 8); c.fill();
  }
  c.restore();
}

function poolTex() {
  return canvasTex(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.Fog(INK, 3.6, 9.5);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the map table
  const grid = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#0e0b13'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(243,217,164,0.035)'; c.lineWidth = 1;
    for (let x = 0; x <= w; x += 32) { c.beginPath(); c.moveTo(x + 0.5, 0); c.lineTo(x + 0.5, h); c.stroke(); c.beginPath(); c.moveTo(0, x + 0.5); c.lineTo(w, x + 0.5); c.stroke(); }
    c.strokeStyle = 'rgba(243,217,164,0.09)'; c.lineWidth = 2;
    for (let x = 0; x <= w; x += 128) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); }
    for (let i = 0; i < 26; i++) { c.fillStyle = `rgba(243,217,164,${0.08 + rnd(i, 3) * 0.12})`; c.beginPath(); c.arc(Math.round(rnd(i, 1) * 4) * 128, Math.round(rnd(i, 2) * 4) * 128, 3, 0, 7); c.fill(); }
  });
  grid.tex.wrapS = grid.tex.wrapT = THREE.RepeatWrapping; grid.tex.repeat.set(5, 4);
  const table = mesh(new THREE.PlaneGeometry(10, 8), std(0xffffff, { map: grid.tex, roughness: 0.3, metalness: 0.55 }), { cast: false });
  table.rotation.x = -Math.PI / 2; scene.add(table);
  // Far bokeh, so the dark has depth.
  [[-3.2, 1.6, -4.5, CRIMSON, 1.6], [2.8, 2.2, -5, 0x6fd6ff, 2.0], [0.6, 2.8, -6, CHAMP, 2.4], [-1.4, 0.9, -5.5, CHAMP, 1.2], [4, 0.8, -4, CRIMSON, 1.4]].forEach(([x, y, z, c, s]) => {
    const b = glow(c, s, 0.12, 0.6); b.position.set(x, y, z); b.material.fog = false; scene.add(b);
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5a4a72, 0x050308, 0.32));
  const key = new THREE.SpotLight(0xffe6d0, 34, 0, 0.62, 0.85, 1.3);
  key.position.set(-1.6, 3.4, 2.4); key.target.position.set(0, 0.35, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xf3d9a4, 1.5); rim.position.set(2.5, 1.8, -3); scene.add(rim);
  const rimB = new THREE.DirectionalLight(0x6f86ff, 0.9); rimB.position.set(-3, 1.2, -2.4); scene.add(rimB);
  const coreLight = new THREE.PointLight(CRIMSON, 0, 3, 1.6); coreLight.position.copy(CORE); scene.add(coreLight);

  // ----------------------------------------------------------- the asset library
  const libG = new THREE.Group(); libG.position.copy(LIB); libG.rotation.y = LIB_RY; scene.add(libG);
  libG.add(mesh(new RoundedBoxGeometry(1.1, 1.1, 0.05, 3, 0.02), std(0x16131c, { roughness: 0.35, metalness: 0.6 })));
  const foot = mesh(new THREE.BoxGeometry(0.46, LIB.y - 0.55, 0.22), std(0x110e16, { roughness: 0.4, metalness: 0.6 }));
  foot.position.y = -0.55 - (LIB.y - 0.55) / 2; libG.add(foot);
  const PAL = ['#ff9a5a', '#6fd6ff', '#c9ff72', '#ff5a7a', '#f3d9a4', '#8a7bff', '#ffd27a', '#3ad1b0'];
  const libTex = canvasTex(512, 512);
  const drawLib = (empty) => libTex.redraw((c, w) => {
    c.fillStyle = '#1a1620'; c.fillRect(0, 0, w, w);
    const cs = w / 4, pad = 12;
    for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) {
      const x = q * cs + pad, y = r * cs + pad, s = cs - pad * 2, i = r * 4 + q;
      if (q === HERO_CELL[0] && r === HERO_CELL[1]) {
        if (empty) { c.strokeStyle = 'rgba(255,45,85,0.85)'; c.lineWidth = 4; c.setLineDash([10, 8]); roundRect(c, x + 2, y + 2, s - 4, s - 4, 12); c.stroke(); c.setLineDash([]); }
        else { c.save(); roundRect(c, x, y, s, s, 12); c.clip(); drawHero(c, x, y, s, s, HERO); c.restore(); }
        continue;
      }
      c.save(); roundRect(c, x, y, s, s, 12); c.clip();
      const a = PAL[i % PAL.length], b = PAL[(i * 3 + 2) % PAL.length], kind = Math.floor(rnd(i, 4) * 4);
      const g = c.createLinearGradient(x, y, x + s, y + s); g.addColorStop(0, a); g.addColorStop(1, '#1a1224'); c.fillStyle = g; c.fillRect(x, y, s, s);
      c.fillStyle = b;
      if (kind === 0) { c.beginPath(); c.arc(x + s * 0.6, y + s * 0.45, s * 0.22, 0, 7); c.fill(); }
      else if (kind === 1) { c.globalAlpha = 0.8; c.beginPath(); c.moveTo(x, y + s); c.lineTo(x + s * 0.45, y + s * 0.4); c.lineTo(x + s, y + s); c.fill(); c.globalAlpha = 1; }
      else if (kind === 2) { roundRect(c, x + s * 0.38, y + s * 0.25, s * 0.24, s * 0.55, s * 0.1); c.fill(); }
      else { for (let j = 0; j < 4; j++) { c.globalAlpha = 0.25 + j * 0.15; c.fillRect(x, y + s * (0.2 + j * 0.2), s, s * 0.08); } c.globalAlpha = 1; }
      c.restore();
    }
  });
  drawLib(false);
  let libEmpty = false;
  const libFace = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), std(0xffffff, { map: libTex.tex, emissiveMap: libTex.tex, emissive: 0xffffff, emissiveIntensity: 0.42, roughness: 0.4 }));
  libFace.position.z = 0.027; libFace.receiveShadow = true; libG.add(libFace);
  const libGlow = glow(0x8a7bff, 2.2, 0.16, 0.55); libGlow.position.z = -0.2; libG.add(libGlow);

  // The hero asset as a real tile that can leave the wall.
  const heroTex = canvasTex(256, 256, (c, w, h) => { drawHero(c, 0, 0, w, h, HERO); });
  const hero = new THREE.Group(); scene.add(hero);
  hero.add(mesh(new RoundedBoxGeometry(0.2, 0.2, 0.014, 2, 0.012), std(0x221c2a, { roughness: 0.3, metalness: 0.6 })));
  const heroFace = new THREE.Mesh(new THREE.PlaneGeometry(0.19, 0.19), new THREE.MeshBasicMaterial({ map: heroTex.tex, toneMapped: false }));
  heroFace.position.z = 0.0075; hero.add(heroFace);
  const heroGlow = glow(0xffb070, 0.7, 0, 0.35); heroGlow.position.z = -0.02; hero.add(heroGlow);
  libG.updateMatrixWorld();
  const cellLocal = new THREE.Vector3(-0.375 + HERO_CELL[0] * 0.25, 0.375 - HERO_CELL[1] * 0.25, 0.04);
  const heroHome = libG.localToWorld(cellLocal.clone());
  const libN = new THREE.Vector3(0, 0, 1).applyQuaternion(libG.quaternion);
  const heroOut = heroHome.clone().addScaledVector(libN, 0.22).add(new THREE.Vector3(0, 0.04, 0));

  // ----------------------------------------------------------- the AI core
  const coreG = new THREE.Group(); coreG.position.copy(CORE); scene.add(coreG);
  const coreM = std(0x1c0d16, { roughness: 0.22, metalness: 0.75, emissive: CRIMSON, emissiveIntensity: 0.08, flatShading: true });
  const ico = mesh(new THREE.IcosahedronGeometry(0.15, 1), coreM); coreG.add(ico);
  const ringM1 = new THREE.MeshBasicMaterial({ color: CHAMP, transparent: true, opacity: 0.35, toneMapped: false });
  const ringM2 = new THREE.MeshBasicMaterial({ color: CRIMSON, transparent: true, opacity: 0.3, toneMapped: false });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.0045, 8, 96), ringM1); coreG.add(ring1);
  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.0035, 8, 96), ringM2); coreG.add(ring2);
  const shockM = new THREE.MeshBasicMaterial({ color: CRIMSON, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const shock = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.008, 8, 96), shockM); coreG.add(shock);
  const coreGlow = glow(CRIMSON, 1.2, 0.1, 0.4); coreG.add(coreGlow);
  const coreFlare = glow(0xffd6dc, 0.5, 0, 0.25); coreG.add(coreFlare);
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.8), new THREE.MeshBasicMaterial({ map: poolTex(), color: CRIMSON, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(CORE.x, 0.004, CORE.z); scene.add(pool);
  const ai = label('AI', { font: `800 64px ${SANS}`, fg: '#ffd6dc', h: 0.15, track: 6 });
  scene.add(ai);

  // ----------------------------------------------------------- slots, ads and people
  const slotTex = canvasTex(256, 192, (c, w, h) => {
    c.strokeStyle = 'rgba(243,217,164,0.9)'; c.lineWidth = 4; c.setLineDash([14, 10]); roundRect(c, 4, 4, w - 8, h - 8, 12); c.stroke();
  }).tex;
  const cards = VARS.map((v, i) => {
    const g = new THREE.Group(); g.position.set(CARD_X, CARD_Y[i], 0); g.rotation.y = CARD_RY; scene.add(g);
    const slot = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.34), new THREE.MeshBasicMaterial({ map: slotTex, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    g.add(slot);
    const card = new THREE.Group(); g.add(card);
    card.add(mesh(new RoundedBoxGeometry(0.47, 0.35, 0.018, 2, 0.01), std(0x1c1822, { roughness: 0.3, metalness: 0.55 })));
    const ad = canvasTex(512, 384, (c, w, h) => drawAd(c, w, h, v, i));
    const faceM = std(0xffffff, { map: ad.tex, emissiveMap: ad.tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.35 });
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.3375), faceM); face.position.z = 0.0095; card.add(face);
    const cGlow = glow(v.pc, 1.0, 0, 0.5); cGlow.position.z = -0.08; cGlow.scale.set(1.1, 0.85, 1); card.add(cGlow);
    // The person this cut is for.
    const pTex = canvasTex(256, 256, (c, w, h) => drawPerson(c, w, h, v, i));
    const discM = std(0xffffff, { map: pTex.tex, emissiveMap: pTex.tex, emissive: 0xffffff, emissiveIntensity: 0.12, roughness: 0.5, transparent: true });
    const disc = new THREE.Mesh(new THREE.CircleGeometry(0.1, 48), discM); disc.position.set(0.37, 0, 0.01); g.add(disc);
    const ringM = new THREE.MeshBasicMaterial({ color: 0x4a4452, toneMapped: false });
    const pr = new THREE.Mesh(new THREE.TorusGeometry(0.108, 0.006, 8, 64), ringM); pr.position.copy(disc.position); g.add(pr);
    const pGlow = glow(v.pc, 0.6, 0, 0.4); pGlow.position.set(0.37, 0, -0.03); g.add(pGlow);
    g.updateMatrixWorld();
    const target = g.localToWorld(new THREE.Vector3(0, 0, 0.02));
    return { g, slot, card, faceM, cGlow, discM, ringM, pGlow, target, col: new THREE.Color(v.pc) };
  });

  // ----------------------------------------------------------- light paths
  const pathM = (c) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const bez = (a, b, up, fwd) => new THREE.QuadraticBezierCurve3(a, a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, up, fwd)), b);
  const SEG = 64, RAD = 6;
  const inCurve = bez(heroOut, CORE, 0.32, 0.3);
  const inTube = new THREE.Mesh(new THREE.TubeGeometry(inCurve, SEG, 0.005, RAD, false), pathM(0xffc48a));
  scene.add(inTube);
  const outs = cards.map((cd, i) => {
    const curve = bez(CORE, cd.target, 0.18 - i * 0.1, 0.22);
    const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.005, RAD, false), pathM(cd.col.getHex()));
    scene.add(tube);
    const runner = new THREE.Mesh(new THREE.PlaneGeometry(0.11, 0.11), new THREE.MeshBasicMaterial({ map: heroTex.tex, color: cd.col.clone().lerp(new THREE.Color(1, 1, 1), 0.6), transparent: true, toneMapped: false, depthWrite: false }));
    scene.add(runner);
    const spark = glow(cd.col.getHex(), 0.4, 0, 0.3); scene.add(spark);
    return { curve, tube, runner, spark };
  });
  const inSpark = glow(0xffc48a, 0.45, 0, 0.3); scene.add(inSpark);
  const draw = (tube, p) => { const n = Math.floor(clamp(p) * SEG) * RAD * 6; tube.geometry.setDrawRange(0, n); tube.visible = n > 0; };

  // ----------------------------------------------------------- title
  const kicker = label('MRM', { font: `700 56px ${MONO}`, fg: '#ff8aa0', h: 0.13, track: 10 });
  const title = label('AI and asset management vision', { font: `800 72px ${SANS}`, fg: '#fbf1e2', h: 0.19, track: 1 });
  const line = label('Personalized campaigns', { font: `600 56px ${SANS}`, fg: '#f3d9a4', h: 0.14, track: 2 });
  [kicker, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });

  // ----------------------------------------------------------- dust
  const DN = 150, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xf3d9a4, size: 0.011, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.62, 0.86, 2.05]], [1.4, [-0.7, 0.82, 2.1], L],
    [3.0, [-0.18, 0.84, 2.35]], [3.6, [0.08, 0.84, 2.5]],
    [4.4, [0.45, 0.86, 2.75]], [6.3, [0.6, 0.86, 2.62], L], [8.2, [0.05, 1.12, 3.95]],
    [10, [0.0, 1.16, 4.15], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-1.1, 0.62, 0]], [1.4, [-1.12, 0.6, 0], L],
    [3.0, [-0.3, 0.6, 0]], [3.6, [0.22, 0.6, 0]],
    [4.4, [0.6, 0.6, 0]], [6.3, [0.72, 0.6, 0], L], [8.2, [0.08, 0.8, 0]],
    [10, [0.08, 0.81, 0], L],
  ]);
  const tgt = new THREE.Vector3(), tmp = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 32], [3.6, 34], [6.3, 34], [8.2, 36], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the library wall; one asset nudges in, then lifts out toward the light.
    const nudge = Math.sin(Math.PI * k(t, 0.75, 1.05)) * 0.018;
    const lift = back(k(t, 1.05, 1.7));
    const fly = eio(k(t, 1.85, 3.0));
    const gone = t > 3.0;
    const empty = t > 1.05;
    if (empty !== libEmpty) { libEmpty = empty; drawLib(empty); }
    if (fly <= 0) {
      hero.position.copy(heroHome).addScaledVector(libN, -nudge + lift * 0.22).add(tmp.set(0, lift * 0.04, 0));
      hero.quaternion.copy(libG.quaternion);
      hero.rotateY(-lift * 0.25); hero.rotateX(-lift * 0.12 + Math.sin(t * 2.4) * 0.03 * lift);
      hero.scale.setScalar(1 + lift * 0.25);
    } else {
      inCurve.getPoint(fly, hero.position);
      hero.quaternion.copy(libG.quaternion);
      hero.rotateY(-0.25 - fly * 2.6); hero.rotateX((-0.12 + Math.sin(t * 2.4) * 0.03) * (1 - fly)); hero.rotateZ(fly * 0.6);
      hero.scale.setScalar(Math.max(0.001, lerp(1.25, 0.15, ei(fly))));
    }
    hero.visible = !gone;
    heroGlow.material.opacity = 0.75 * clamp(lift) * (1 - fly * 0.5);
    draw(inTube, k(t, 1.8, 2.9));
    inTube.material.opacity = 0.9 * (1 - k(t, 3.6, 4.6) * 0.65);
    inCurve.getPoint(clamp(k(t, 1.8, 2.9)), inSpark.position);
    inSpark.material.opacity = t > 1.8 && t < 3.0 ? 0.9 : 0;
    libGlow.material.opacity = 0.16 + 0.12 * Math.sin(Math.PI * k(t, 0.6, 2.2));

    // Beat 2: the core takes the asset in and ignites.
    const ign = eo(k(t, 2.9, 3.5));
    const hit = t > 2.95 ? Math.exp(-5 * (t - 2.95)) : 0;
    coreG.position.set(CORE.x, CORE.y + Math.sin(t * 1.3) * 0.012, CORE.z);
    ico.rotation.set(t * 0.35, t * 0.5 + ign * 2, 0);
    ico.scale.setScalar(1 + 0.18 * hit * Math.sin(Math.min(1, (t - 2.95) * 3) * Math.PI * 1.5) + 0.04 * Math.sin(t * 3) * ign);
    coreM.emissiveIntensity = 0.08 + 0.9 * ign + 1.4 * hit;
    const spin = t * 0.4 + ign * 1.5 * (t - 2.9) * (t > 2.9 ? 1 : 0);
    ring1.rotation.set(1.2 + Math.sin(t * 0.5) * 0.2, spin, 0);
    ring2.rotation.set(0.5, -spin * 0.8, 0.6 + Math.sin(t * 0.4) * 0.2);
    ringM1.opacity = 0.3 + 0.55 * ign; ringM2.opacity = 0.25 + 0.6 * ign;
    const sh = k(t, 2.95, 3.75);
    shock.scale.setScalar(1 + eo(sh) * 3.2); shock.lookAt(camera.position);
    shockM.opacity = t > 2.95 ? 0.85 * (1 - sh) : 0;
    coreGlow.material.opacity = 0.1 + 0.55 * ign + 0.3 * hit;
    coreGlow.scale.setScalar(1.1 + 0.4 * ign + 0.6 * hit);
    coreFlare.material.opacity = 0.9 * hit;
    coreFlare.scale.setScalar(0.4 + 1.6 * hit);
    coreLight.intensity = 3.2 * ign + 3 * hit;
    pool.material.opacity = 0.45 * ign + 0.3 * hit;
    const aiIn = eo(k(t, 3.1, 3.6)) * (1 - ei(k(t, 6.9, 7.3)));
    ai.position.set(CORE.x, CORE.y + 0.36, CORE.z + 0.05); ai.lookAt(camera.position);
    ai.material.opacity = aiIn; ai.visible = aiIn > 0.01;

    // Beat 3: three paths, three personalized cuts, three people light up.
    cards.forEach((cd, i) => {
      const o = outs[i];
      const s0 = OUT[i], land = s0 + TRAVEL;
      const pr = eio(k(t, s0, land));
      draw(o.tube, k(t, s0, land));
      o.tube.material.opacity = 0.9 * (1 - k(t, land + 0.6, land + 1.6) * 0.6);
      o.curve.getPoint(pr, o.runner.position);
      o.runner.lookAt(camera.position);
      o.runner.scale.setScalar(Math.max(0.001, 0.6 + Math.sin(Math.PI * pr) * 0.6));
      o.runner.visible = t > s0 && t < land;
      o.spark.position.copy(o.runner.position);
      o.spark.material.opacity = o.runner.visible ? 0.9 : 0;
      const pop = back(k(t, land - 0.05, land + 0.45));
      const lit = eo(k(t, land, land + 0.5));
      const flash = t > land ? Math.exp(-5 * (t - land)) : 0;
      cd.card.scale.setScalar(Math.max(0.001, lerp(0.6, 1, pop)));
      cd.card.position.z = (1 - clamp(pop)) * 0.08;
      cd.card.rotation.y = (1 - clamp(pop)) * 0.5;
      cd.card.visible = pop > 0.01;
      cd.faceM.emissiveIntensity = 0.55 * lit + 0.6 * flash;
      cd.cGlow.material.opacity = 0.32 * lit + 0.4 * flash;
      cd.slot.material.opacity = 0.3 * (1 - clamp(pop)) + 0.08 * Math.sin(t * 3 + i) * (1 - clamp(pop));
      const pl = eo(k(t, land + 0.15, land + 0.55));
      cd.discM.emissiveIntensity = 0.12 + 0.55 * pl;
      cd.ringM.color.setHex(0x4a4452).lerp(cd.col, pl);
      cd.pGlow.material.opacity = 0.5 * pl + 0.5 * (t > land + 0.15 ? Math.exp(-5 * (t - land - 0.15)) : 0);
      cd.g.position.y = CARD_Y[i] + Math.sin(t * 1.2 + i * 1.7) * 0.008;
    });

    // Beat 4: the whole map, under the title.
    const ti = eo(k(t, 7.0, 7.6)), to = ei(k(t, 9.25, 9.6));
    const li = eo(k(t, 7.35, 7.95));
    tmp.copy(camera.position); tmp.y = 1.4;
    [[kicker, 1.62, ti], [title, 1.44, ti], [line, 1.25, li]].forEach(([l, y, a]) => {
      l.position.set(0.02, y + (1 - a) * 0.05, 0.25); l.lookAt(tmp);
      l.material.opacity = a * (1 - to); l.visible = a > 0.01;
    });

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (rnd(i, 11) - 0.5) * 4.2 + Math.sin(t * 0.3 + i) * 0.12;
      dpos[i * 3 + 1] = 0.08 + rnd(i, 12) * 1.7 + Math.sin(t * 0.45 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = (rnd(i, 13) - 0.5) * 2.4 + Math.cos(t * 0.25 + i) * 0.1;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.3 };
}
