// Portfolios Please lit loop, 10 s. "A border booth, but for portfolios."
// A cramped inspection booth at night: olive block walls, a steel desk with a green blotter, one hanging
// lamp, rain beyond the glass and a queue waiting in it. The NEXT light calls a candidate to the window;
// their portfolio slides through the slot, falls open on its character art, and the HIRED stamp comes down
// hard enough to set the lamp swinging. The cash counter rolls from $0 to $40, the candidate hops and
// leaves. The next one steps up, opens on a stick figure, and gets DENIED. The camera pulls back to the
// booth sign, the empty window and the queue in the rain.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const MONO = '"JetBrains Mono", monospace', SANS = 'Inter, system-ui, sans-serif';
const GREEN = '#3fae5a', RED = '#c8322b', PAPER = '#d6ccb2', INKC = '#2b2f26';
const DESK = 0.78;                       // desk top height
const SPOT = [0.12, -0.05];              // where a portfolio lies on the blotter [x, z]
const SLAM = [3.3, 7.25];                // when each stamp comes down
// Per candidate: enter, slide in, open, close, slide out, exit.
const CAND = [
  { in: [0.45, 1.3], pin: [1.35, 2.0], open: [2.05, 2.45], close: [3.95, 4.25], pout: [4.25, 4.8], out: [4.45, 5.3] },
  { in: [4.85, 5.65], pin: [5.65, 6.25], open: [6.3, 6.65], close: [7.85, 8.15], pout: [8.15, 8.7], out: [8.2, 9.3] },
];

function coverTex(base, accent) {
  return canvasTex(512, 390, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 2500; i++) { c.fillStyle = `rgba(${rnd(i, 3) > 0.5 ? 255 : 0},${rnd(i, 3) > 0.5 ? 255 : 0},${rnd(i, 3) > 0.5 ? 255 : 0},${rnd(i, 4) * 0.06})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 2, 2); }
    c.fillStyle = accent; c.fillRect(0, 0, 26, h);
    c.fillStyle = PAPER; roundRect(c, 70, 120, 380, 120, 10); c.fill();
    c.strokeStyle = INKC; c.lineWidth = 3; roundRect(c, 82, 132, 356, 96, 6); c.stroke();
    c.fillStyle = INKC; c.font = `800 52px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '4px';
    c.fillText('PORTFOLIO', w / 2 + 8, 182);
    c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillRect(70, 300, 200, 10); c.fillRect(70, 322, 140, 10);
  });
}
// The inside: left page a candidate sheet, right page their character art.
function insideTex(good) {
  return canvasTex(512, 390, (c, w, h) => {
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(43,47,38,0.35)'; c.lineWidth = 2; c.strokeRect(14, 14, w - 28, h - 28);
    c.fillStyle = '#9d9480'; c.fillRect(34, 40, 150, 180);
    c.fillStyle = '#6e6656'; c.beginPath(); c.arc(109, 110, 40, 0, 7); c.fill(); c.beginPath(); c.ellipse(109, 220, 70, 56, 0, Math.PI, 0); c.fill();
    c.fillStyle = 'rgba(43,47,38,0.55)';
    for (let r = 0; r < 6; r++) c.fillRect(210, 52 + r * 28, 120 + rnd(r, good ? 1 : 2) * 150, 9);
    for (let r = 0; r < 4; r++) c.fillRect(34, 250 + r * 28, 300 + rnd(r, 7) * 140, 9);
  });
}
function artTex(good) {
  return canvasTex(512, 390, (c, w, h) => {
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
    if (good) {
      const CS = [['#e0a25a', '#2f6f6a'], ['#8a5a40', '#c8322b'], ['#f0c8a0', '#3b4a8a'], ['#c99a7a', '#6a8a3a']];
      CS.forEach(([skin, hat], i) => {
        const x = 30 + (i % 2) * 236, y = 24 + Math.floor(i / 2) * 180;
        c.fillStyle = ['#efe3c6', '#e3d8bd', '#e9dcc0', '#e0d4b8'][i]; c.fillRect(x, y, 216, 164);
        c.fillStyle = hat; c.beginPath(); c.ellipse(x + 108, y + 168, 74, 58, 0, Math.PI, 0); c.fill();
        c.fillStyle = skin; c.beginPath(); c.arc(x + 108, y + 84, 46, 0, 7); c.fill();
        c.fillStyle = hat; c.beginPath(); c.arc(x + 108, y + 72, 48, Math.PI * 1.05, Math.PI * 1.95); c.fill(); c.fillRect(x + 58, y + 62, 100, 12);
        c.fillStyle = '#1b1b1b'; c.beginPath(); c.arc(x + 92, y + 90, 6, 0, 7); c.arc(x + 124, y + 90, 6, 0, 7); c.fill();
        c.strokeStyle = '#1b1b1b'; c.lineWidth = 4; c.beginPath(); c.arc(x + 108, y + 104, 14, 0.2, Math.PI - 0.2); c.stroke();
      });
    } else {
      c.strokeStyle = '#2b2f26'; c.lineWidth = 6; c.lineCap = 'round';
      c.beginPath(); c.arc(256, 120, 34, 0, 7); c.moveTo(256, 154); c.lineTo(250, 260); c.moveTo(252, 190); c.lineTo(196, 214); c.moveTo(252, 190); c.lineTo(318, 170);
      c.moveTo(250, 260); c.lineTo(210, 340); c.moveTo(250, 260); c.lineTo(296, 338); c.stroke();
      c.lineWidth = 3; c.strokeStyle = 'rgba(43,47,38,0.45)';
      for (let i = 0; i < 5; i++) { c.beginPath(); c.moveTo(60 + i * 18, 60 + i * 40); for (let x = 0; x < 90; x += 10) c.lineTo(60 + i * 18 + x, 60 + i * 40 + Math.sin(x + i) * 8); c.stroke(); }
    }
  });
}
function markTex(text, col) {
  return canvasTex(512, 200, (c, w, h) => {
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 12;
    roundRect(c, 14, 14, w - 28, h - 28, 12); c.stroke();
    c.font = `900 108px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.fillText(text, w / 2, h / 2 + 6);
    // Worn rubber: knock random flecks out of the ink.
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(0,0,0,${0.3 + rnd(i, 8) * 0.7})`; c.fillRect(rnd(i, 9) * w, rnd(i, 10) * h, 1 + rnd(i, 11) * 4, 1 + rnd(i, 12) * 3); }
    c.globalCompositeOperation = 'source-over';
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x070910);
  scene.fog = new THREE.Fog(0x0b0f18, 3.2, 9);
  scene.environment = env;
  scene.environmentIntensity = 0.25;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- outside: night street in the rain
  const night = canvasTex(1024, 512, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#05070d'); g.addColorStop(0.55, '#16223a'); g.addColorStop(0.7, '#2a3550'); g.addColorStop(1, '#0a0d14');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) {
      const bx = rnd(i, 1) * w, bw = 60 + rnd(i, 2) * 120, bh = 120 + rnd(i, 3) * 200;
      c.fillStyle = '#0b0f19'; c.fillRect(bx, h * 0.7 - bh, bw, bh);
      for (let j = 0; j < 10; j++) if (rnd(i * 13 + j, 4) > 0.55) { c.fillStyle = rnd(j, i) > 0.3 ? 'rgba(255,196,120,0.75)' : 'rgba(150,190,255,0.6)'; c.fillRect(bx + 8 + rnd(j, i + 5) * (bw - 20), h * 0.7 - bh + 10 + rnd(j, i + 6) * (bh - 30), 6, 9); }
    }
  }).tex;
  const back_ = new THREE.Mesh(new THREE.PlaneGeometry(10, 5), new THREE.MeshBasicMaterial({ map: night, fog: false }));
  back_.position.set(0, 1.4, -4.2); scene.add(back_);
  [[-1.4, 1.2, -3.6, 0xffb35c, 0.8], [1.1, 1.0, -3.4, 0x7fa6ff, 0.7], [0.2, 2.1, -3.8, 0xffd59a, 1.1], [-0.4, 0.9, -3.0, 0xff6a5a, 0.5], [1.9, 1.6, -3.9, 0xffc48a, 0.9]]
    .forEach(([x, y, z, c, s]) => { const g = glow(c, s, 0.4, 0.55); g.position.set(x, y, z); scene.add(g); });
  const lampPost = glow(0xffb35c, 1.6, 0.55, 0.4); lampPost.position.set(-1.1, 2.2, -2.6); scene.add(lampPost);
  const street = mesh(new THREE.PlaneGeometry(10, 4), std(0x10141c, { roughness: 0.15, metalness: 0.5 }), { cast: false });
  street.rotation.x = -Math.PI / 2; street.position.set(0, 0.0, -2.8); scene.add(street);
  // Rain: streaks that fall through the window light.
  const RN = 140, rpos = new Float32Array(RN * 6);
  const rGeo = new THREE.BufferGeometry(); rGeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  const rain = new THREE.LineSegments(rGeo, new THREE.LineBasicMaterial({ color: 0x9fb6e0, transparent: true, opacity: 0.32, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  rain.frustumCulled = false; scene.add(rain);
  // The queue: waiting figures in the rain.
  const queueM = std(0x12161f, { roughness: 0.7 });
  const queue = [[-0.55, -2.15], [-0.85, -2.6], [-1.2, -3.0]].map(([x, z], i) => {
    const g = new THREE.Group();
    const b = mesh(new THREE.CapsuleGeometry(0.19, 0.42, 6, 16), queueM, { cast: false }); b.position.y = 0.95; g.add(b);
    const h = mesh(new THREE.SphereGeometry(0.15, 20, 14), queueM, { cast: false }); h.position.y = 1.5; g.add(h);
    if (i === 1) { const u = mesh(new THREE.ConeGeometry(0.42, 0.14, 20, 1, true), std(0x1a2030, { roughness: 0.4, side: THREE.DoubleSide }), { cast: false }); u.position.y = 1.85; g.add(u); }
    g.position.set(x, 0, z); scene.add(g);
    return g;
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5a6a8a, 0x1a140c, 0.3));
  const pivot = new THREE.Group(); pivot.position.set(0.62, 2.5, 0.12); scene.add(pivot);
  const key = new THREE.SpotLight(0xffd39a, 0, 0, 0.78, 0.55, 1.5);
  key.position.set(0, -0.96, 0); key.target.position.set(-0.55, -1.72, -0.17);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.2; key.shadow.camera.far = 3; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015;
  pivot.add(key, key.target);
  const outside = new THREE.PointLight(0x7fa6ff, 3.2, 3.4, 1.5); outside.position.set(0.5, 2.2, -2.0); scene.add(outside);
  const spill = new THREE.PointLight(0xffc98a, 0.9, 1.4, 1.6); spill.position.set(0.1, 1.35, -0.78); scene.add(spill);
  const nextL = new THREE.PointLight(0xff5a3c, 0, 1.1, 1.6); nextL.position.set(-0.85, 1.48, -0.45); scene.add(nextL);

  // ----------------------------------------------------------- booth walls and window
  const blockC = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#4b5240'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let q = 0; q < 4; q++) {
      const x = q * 128 + (r % 2) * 64, y = r * 64;
      c.fillStyle = `rgba(${rnd(r, q) > 0.5 ? 255 : 0},${rnd(r, q) > 0.5 ? 255 : 0},0,${0.03 + rnd(q, r) * 0.05})`; c.fillRect(x, y, 128, 64);
    }
    c.strokeStyle = 'rgba(20,22,16,0.55)'; c.lineWidth = 4;
    for (let r = 0; r <= 8; r++) { c.beginPath(); c.moveTo(0, r * 64); c.lineTo(w, r * 64); c.stroke(); for (let q = 0; q <= 4; q++) { const x = q * 128 + (r % 2) * 64; c.beginPath(); c.moveTo(x % w, r * 64); c.lineTo(x % w, r * 64 + 64); c.stroke(); } }
    for (let i = 0; i < 6000; i++) { c.fillStyle = `rgba(0,0,0,${rnd(i, 21) * 0.12})`; c.fillRect(rnd(i, 22) * w, rnd(i, 23) * h, 2, 2); }
  }).tex;
  const wallM = (w, h) => { const t = blockC.clone(); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 1.0, h / 1.0); t.needsUpdate = true; return std(0xffffff, { map: t, roughness: 0.92 }); };
  const WZ = -0.66, WIN = [-0.6, 0.6, 0.96, 1.7];
  const wallBox = (x0, x1, y0, y1) => { const b = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.08), wallM(x1 - x0, y1 - y0)); b.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ); scene.add(b); return b; };
  wallBox(-2.4, WIN[0], 0, 3.2); wallBox(WIN[1], 2.4, 0, 3.2);
  wallBox(WIN[0], WIN[1], 0, DESK); wallBox(WIN[0], WIN[1], 0.86, WIN[2]); wallBox(WIN[0], WIN[1], WIN[3], 3.2);
  const frameM = std(0x2a2e28, { roughness: 0.35, metalness: 0.7 });
  [[0, WIN[3] + 0.015, 1.24, 0.03], [0, WIN[2] - 0.015, 1.24, 0.03], [WIN[0] - 0.015, (WIN[2] + WIN[3]) / 2, 0.03, WIN[3] - WIN[2] + 0.06], [WIN[1] + 0.015, (WIN[2] + WIN[3]) / 2, 0.03, WIN[3] - WIN[2] + 0.06]]
    .forEach(([x, y, w, h]) => { const f = mesh(new THREE.BoxGeometry(w, h, 0.12), frameM); f.position.set(x, y, WZ + 0.01); scene.add(f); });
  const slotLip = mesh(new THREE.BoxGeometry(1.2, 0.012, 0.5), std(0x6a6e66, { roughness: 0.3, metalness: 0.9 }));
  slotLip.position.set(0, DESK - 0.006, WZ - 0.2); scene.add(slotLip);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(1.2, WIN[3] - WIN[2]), std(0x9fb4c8, { roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.14, depthWrite: false }));
  glass.position.set(0, (WIN[2] + WIN[3]) / 2, WZ - 0.02); scene.add(glass);
  const streakTex = canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, h, w, 0);
    g.addColorStop(0.35, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.16)'); g.addColorStop(0.5, 'rgba(255,255,255,0.03)'); g.addColorStop(0.62, 'rgba(255,255,255,0.08)'); g.addColorStop(0.7, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }).tex;
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(1.2, WIN[3] - WIN[2]), new THREE.MeshBasicMaterial({ map: streakTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sheen.position.copy(glass.position); sheen.position.z += 0.005; scene.add(sheen);

  // Booth sign over the window, the NEXT light, the day sheet.
  const signTex = canvasTex(1024, 256, (c, w, h) => {
    c.fillStyle = '#ddd2b4'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#8a2a22'; c.fillRect(0, 0, w, 16); c.fillRect(0, h - 16, w, 16);
    c.fillStyle = INKC; c.textAlign = 'center'; c.textBaseline = 'middle';
    // Fit the title to the box: step the size down until it clears the margins.
    if ('letterSpacing' in c) c.letterSpacing = '6px';
    let fs = 112; c.font = `900 ${fs}px ${SANS}`;
    while (c.measureText('PORTFOLIOS PLEASE').width + 17 * 6 > w - 70 && fs > 48) { fs -= 4; c.font = `900 ${fs}px ${SANS}`; }
    c.fillText('PORTFOLIOS PLEASE', w / 2, 108);
    c.font = `700 40px ${MONO}`; if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.fillStyle = '#5a5e50'; c.fillText('Self-initiated', w / 2, 200);
  }).tex;
  const signBox = mesh(new THREE.BoxGeometry(1.58, 0.415, 0.07), std(0x23261f, { roughness: 0.4, metalness: 0.6 }));
  signBox.position.set(0, 1.95, WZ + 0.06); scene.add(signBox);
  const signM = new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.375), signM); sign.position.set(0, 1.95, WZ + 0.097); scene.add(sign);
  const signGlow = glow(0xffe2b0, 1, 0, 0.5); signGlow.position.set(0, 1.95, WZ + 0.2); signGlow.scale.set(2.3, 0.7, 1); scene.add(signGlow);
  const nextTex = canvasTex(256, 112, (c, w, h) => {
    c.fillStyle = '#2a0b07'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#ff6a4a'; c.font = `800 64px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('NEXT', w / 2, h / 2 + 3);
  }).tex;
  const nextBox = mesh(new THREE.BoxGeometry(0.32, 0.15, 0.06), std(0x1c1e1a, { roughness: 0.4, metalness: 0.6 }));
  nextBox.position.set(-0.86, 1.5, WZ + 0.06); scene.add(nextBox);
  const nextM = new THREE.MeshBasicMaterial({ map: nextTex, toneMapped: false });
  const next = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.125), nextM); next.position.set(-0.86, 1.5, WZ + 0.092); scene.add(next);
  const nextGlow = glow(0xff5a3c, 0.6, 0, 0.45); nextGlow.position.set(-0.86, 1.5, WZ + 0.16); nextGlow.scale.set(0.8, 0.45, 1); scene.add(nextGlow);
  const dayTex = canvasTex(256, 320, (c, w, h) => {
    c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
    c.fillStyle = '#8a2a22'; c.fillRect(0, 0, w, 60);
    c.fillStyle = INKC; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = `800 46px ${MONO}`; c.fillText('DAY', w / 2, 140); c.font = `900 120px ${SANS}`; c.fillText('3', w / 2, 238);
    c.fillStyle = '#555'; c.beginPath(); c.arc(w / 2, 30, 9, 0, 7); c.fill();
  }).tex;
  const day = mesh(new THREE.PlaneGeometry(0.2, 0.25), std(0xffffff, { map: dayTex, roughness: 0.9 }), { cast: false });
  day.position.set(0.86, 1.42, WZ + 0.045); day.rotation.z = -0.04; scene.add(day);

  // ----------------------------------------------------------- the lamp
  const cord = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.86, 6), std(0x111111, { roughness: 0.6 }), { cast: false });
  cord.position.y = -0.43; pivot.add(cord);
  const shade = mesh(new THREE.CylinderGeometry(0.035, 0.17, 0.15, 32, 1, true), std(0x2f4a35, { roughness: 0.35, metalness: 0.7, side: THREE.DoubleSide }), { cast: false });
  shade.position.y = -0.9; pivot.add(shade);
  const shadeIn = new THREE.Mesh(new THREE.CylinderGeometry(0.033, 0.165, 0.148, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xffe2b0, side: THREE.BackSide, toneMapped: false }));
  shadeIn.position.y = -0.9; pivot.add(shadeIn);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff1d8, toneMapped: false }));
  bulb.position.y = -0.95; pivot.add(bulb);
  const bulbGlow = glow(0xffc98a, 0.7, 0, 0.35); bulbGlow.position.y = -0.98; pivot.add(bulbGlow);

  // ----------------------------------------------------------- the desk
  const deskTop = mesh(new THREE.BoxGeometry(2.6, 0.05, 1.04), std(0xffffff, { map: grainTex('#3a4136', { size: 256, speck: 0.08, blot: 0.1, seed: 41, repeat: 3 }), roughness: 0.42, metalness: 0.45 }));
  deskTop.position.set(0, DESK - 0.025, -0.12); scene.add(deskTop);
  const deskFront = mesh(new THREE.BoxGeometry(2.6, DESK - 0.05, 0.04), std(0x2c3229, { roughness: 0.5, metalness: 0.5 }));
  deskFront.position.set(0, (DESK - 0.05) / 2, 0.38); scene.add(deskFront);
  const blotter = mesh(new THREE.BoxGeometry(1.1, 0.006, 0.62), std(0xffffff, { map: grainTex('#1f3328', { size: 256, speck: 0.06, blot: 0.12, seed: 42, repeat: 2 }), roughness: 0.85 }));
  blotter.position.set(-0.05, DESK + 0.003, -0.08); scene.add(blotter);
  const strapM = std(0x3a2a1e, { roughness: 0.6 });
  [-0.6, 0.5].forEach((x) => { const s = mesh(new THREE.BoxGeometry(0.06, 0.008, 0.63), strapM); s.position.set(x, DESK + 0.004, -0.08); scene.add(s); });
  // A mug and the rule book.
  const mug = mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.11, 24), std(0xa8a08c, { roughness: 0.35 }));
  mug.position.set(-0.86, DESK + 0.055, -0.22); scene.add(mug);
  const coffee = mesh(new THREE.CircleGeometry(0.048, 24), std(0x1c120a, { roughness: 0.2 }), { cast: false });
  coffee.rotation.x = -Math.PI / 2; coffee.position.set(-0.86, DESK + 0.1, -0.22); scene.add(coffee);
  const book = mesh(new RoundedBoxGeometry(0.26, 0.05, 0.34, 2, 0.008), std(0x6a2a24, { roughness: 0.6 }));
  book.position.set(-0.86, DESK + 0.025, 0.1); book.rotation.y = 0.15; scene.add(book);

  // Stamps on a rack at the right hand: HIRED (green) and DENIED (red).
  const rack = mesh(new THREE.BoxGeometry(0.42, 0.02, 0.18), std(0x2a2e28, { roughness: 0.4, metalness: 0.7 }));
  rack.position.set(0.7, DESK + 0.01, 0.12); scene.add(rack);
  const REST = [[0.6, DESK + 0.02, 0.12], [0.8, DESK + 0.02, 0.12]];
  const stamps = [GREEN, RED].map((col, i) => {
    const g = new THREE.Group(); scene.add(g);
    const body = new THREE.Group(); g.add(body);
    const pad = mesh(new THREE.BoxGeometry(0.13, 0.012, 0.09), std(col, { roughness: 0.9 })); pad.position.y = 0.006; body.add(pad);
    const blk = mesh(new RoundedBoxGeometry(0.14, 0.04, 0.1, 2, 0.008), std(0x6b4a30, { roughness: 0.55 })); blk.position.y = 0.032; body.add(blk);
    const neck = mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.08, 16), std(0x5a3e28, { roughness: 0.5 })); neck.position.y = 0.09; body.add(neck);
    const knob = mesh(new THREE.SphereGeometry(0.042, 20, 14), std(col, { roughness: 0.3, metalness: 0.1 })); knob.position.y = 0.155; body.add(knob);
    return { g, body, col };
  });
  const tins = [GREEN, RED].map((col, i) => {
    const t = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 24), std(0x8a8e86, { roughness: 0.3, metalness: 0.9 }));
    t.position.set(0.58 + i * 0.2, DESK + 0.01, -0.15); scene.add(t);
    const ink = mesh(new THREE.CircleGeometry(0.045, 24), std(col, { roughness: 0.7 }), { cast: false });
    ink.rotation.x = -Math.PI / 2; ink.position.set(0.58 + i * 0.2, DESK + 0.021, -0.15); scene.add(ink);
    return t;
  });

  // The cash counter: a little brass till with a rolling readout.
  const till = mesh(new RoundedBoxGeometry(0.28, 0.12, 0.16, 2, 0.015), std(0x8a6a3a, { roughness: 0.3, metalness: 0.9 }));
  till.position.set(0.86, DESK + 0.06, -0.38); till.rotation.y = -0.35; scene.add(till);
  const cash = canvasTex(256, 112);
  const cashM = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.096), new THREE.MeshBasicMaterial({ map: cash.tex, toneMapped: false }));
  cashM.position.set(0, 0.012, 0.081); till.add(cashM);
  const cashGlow = glow(0x9cffb0, 0.4, 0, 0.4); cashGlow.position.set(0, 0.012, 0.12); till.add(cashGlow);
  let cashKey = '';
  const drawCash = (t) => {
    const r = eio(k(t, SLAM[0] + 0.05, SLAM[0] + 0.3));
    const key_ = r <= 0 ? 'a' : r >= 1 ? 'b' : 'r' + Math.round(r * 20);
    if (key_ === cashKey) return; cashKey = key_;
    cash.redraw((c, w, h) => {
      c.fillStyle = '#0d1a10'; c.fillRect(0, 0, w, h);
      c.save(); c.beginPath(); c.rect(0, 0, w, h); c.clip();
      c.fillStyle = '#9cffb0'; c.font = `800 72px ${MONO}`; c.textAlign = 'right'; c.textBaseline = 'middle';
      c.fillText('$0', w - 22, h / 2 + 4 - r * h);
      c.fillText('$40', w - 22, h / 2 + 4 + (1 - r) * h);
      c.restore();
    });
  };

  // ----------------------------------------------------------- portfolios
  const PFW = 0.42, PFD = 0.32;
  const folios = [['#3f6a66', '#c8a24a', true], ['#6a2f34', '#8a8a7a', false]].map(([base, accent, good], i) => {
    const g = new THREE.Group(); scene.add(g);
    const board = mesh(new THREE.BoxGeometry(PFW, 0.012, PFD), std(base, { roughness: 0.7 })); board.position.y = 0.006; g.add(board);
    const art = new THREE.Mesh(new THREE.PlaneGeometry(PFW - 0.02, PFD - 0.02), std(0xffffff, { map: artTex(good).tex, roughness: 0.85 }));
    art.rotation.x = -Math.PI / 2; art.position.y = 0.0123; art.receiveShadow = true; g.add(art);
    const mark = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.1), new THREE.MeshStandardMaterial({ map: markTex(good ? 'HIRED' : 'DENIED', good ? GREEN : RED).tex, transparent: true, opacity: 0, roughness: 0.9, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
    mark.rotation.set(-Math.PI / 2, 0, 0.18); mark.position.set(0.03, 0.0127, 0.04); mark.receiveShadow = true; g.add(mark);
    const hinge = new THREE.Group(); hinge.position.set(-PFW / 2, 0.0135, 0); g.add(hinge);
    const cover = mesh(new THREE.BoxGeometry(PFW, 0.008, PFD), std(base, { roughness: 0.7 })); cover.position.set(PFW / 2, 0.004, 0); hinge.add(cover);
    const front = new THREE.Mesh(new THREE.PlaneGeometry(PFW, PFD), std(0xffffff, { map: coverTex(base, accent).tex, roughness: 0.75 }));
    front.rotation.x = -Math.PI / 2; front.position.set(PFW / 2, 0.0085, 0); front.receiveShadow = true; hinge.add(front);
    const inside = new THREE.Mesh(new THREE.PlaneGeometry(PFW - 0.02, PFD - 0.02), std(0xffffff, { map: insideTex(good).tex, roughness: 0.85 }));
    inside.rotation.set(Math.PI / 2, 0, Math.PI); inside.position.set(PFW / 2, -0.0005, 0); hinge.add(inside);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.1, 0.13, 48), new THREE.MeshBasicMaterial({ color: good ? GREEN : RED, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(0.03, 0.016, 0.04); g.add(ring);
    const flash = glow(good ? 0x6fe08a : 0xff5040, 0.7, 0, 0.35); flash.position.set(0.03, 0.05, 0.04); g.add(flash);
    return { g, hinge, mark, ring, flash };
  });

  // ----------------------------------------------------------- candidates
  const mkCand = ({ coat, skin, hat, cap }) => {
    const g = new THREE.Group(); scene.add(g);
    const body = new THREE.Group(); g.add(body);
    const torso = mesh(new THREE.CapsuleGeometry(0.21, 0.4, 8, 20), std(coat, { roughness: 0.75 })); torso.position.y = 0.86; body.add(torso);
    const collar = mesh(new THREE.TorusGeometry(0.15, 0.04, 10, 24), std(coat, { roughness: 0.8 })); collar.rotation.x = Math.PI / 2; collar.position.y = 1.24; body.add(collar);
    const head = new THREE.Group(); head.position.y = 1.4; body.add(head);
    head.add(mesh(new THREE.SphereGeometry(0.16, 28, 20), std(skin, { roughness: 0.6 })));
    const eyeM = std(0x0a0a0a, { roughness: 0.2 });
    [-0.055, 0.055].forEach((x) => { const e = mesh(new THREE.SphereGeometry(0.018, 10, 8), eyeM, { cast: false }); e.position.set(x, 0.015, 0.148); head.add(e); });
    if (cap) {
      const top = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.07, 24), std(hat, { roughness: 0.7 })); top.position.y = 0.11; top.rotation.x = -0.12; head.add(top);
      const brim = mesh(new THREE.BoxGeometry(0.22, 0.012, 0.12), std(hat, { roughness: 0.7 })); brim.position.set(0, 0.085, 0.17); head.add(brim);
    } else {
      const beanie = mesh(new THREE.SphereGeometry(0.168, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.5), std(hat, { roughness: 0.85 })); beanie.position.y = 0.03; head.add(beanie);
      const pom = mesh(new THREE.SphereGeometry(0.045, 12, 10), std(0xe8d8b0, { roughness: 0.9 })); pom.position.y = 0.21; head.add(pom);
    }
    return { g, body, head };
  };
  const cands = [mkCand({ coat: 0xb8892f, skin: 0xc99a7a, hat: 0x2f6f6a, cap: false }), mkCand({ coat: 0x566a8a, skin: 0x8a5a40, hat: 0x5a4030, cap: true })];

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.0, 1.5, 1.8]], [1.4, [-0.06, 1.48, 1.6], L],
    [2.4, [0.26, 1.68, 1.58]], [3.4, [0.3, 1.7, 1.5], L],
    [4.6, [0.04, 1.52, 1.6]], [5.8, [-0.04, 1.5, 1.5], L],
    [6.7, [-0.26, 1.68, 1.45]], [7.6, [-0.3, 1.66, 1.36], L],
    [8.6, [0.0, 1.6, 1.7]], [10, [0.0, 1.8, 2.4], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.0, 1.24, -0.6]], [1.4, [0.0, 1.2, -0.55], L],
    [2.4, [0.05, 1.0, -0.62]], [3.4, [0.05, 1.0, -0.65], L],
    [4.6, [0.0, 1.12, -0.6]], [5.8, [0.0, 1.1, -0.6], L],
    [6.7, [0.02, 0.98, -0.6]], [7.6, [0.02, 0.97, -0.62], L],
    [8.6, [0.0, 1.2, -0.6]], [10, [0.0, 1.32, -0.55], L],
  ]);
  const tgt = new THREE.Vector3();
  const shake = (t) => SLAM.reduce((s, ts, i) => s + (t > ts ? (i ? 0.014 : 0.011) * Math.exp(-11 * (t - ts)) * Math.sin(62 * (t - ts)) : 0), 0);
  const swing = (t) => 0.018 * Math.sin(t * 1.3) + SLAM.reduce((s, ts, i) => s + (t > ts ? (i ? 0.07 : 0.055) * Math.exp(-1.6 * (t - ts)) * Math.sin(5.2 * (t - ts)) : 0), 0);

  function update(t) {
    const p = camPos(t), c = camTgt(t), sh = shake(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006 + sh * 0.5, p[1] + Math.sin(t * 1.5 + 1) * 0.004 + sh, p[2]);
    tgt.set(c[0], c[1] + sh * 0.6, c[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [3.4, 33], [4.6, 34], [7.4, 33], [8.6, 34], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Lamp: flickers on, swings when a stamp lands; the key light swings with it.
    const fl = t < 0.6 ? k(t, 0.08, 0.6) * (0.55 + 0.45 * Math.sign(Math.sin(t * 70 + 1))) : 1;
    key.intensity = 7.5 * fl;
    bulbGlow.material.opacity = 0.8 * fl;
    shadeIn.material.color.setHex(0xffe2b0).multiplyScalar(0.35 + 0.65 * fl);
    const sw = swing(t);
    pivot.rotation.z = sw; pivot.rotation.x = 0.4 * swing(t - 0.35);
    signM.color.setScalar(0.78 * clamp(k(t, 0.25, 0.7) * (t < 0.7 ? 0.6 + 0.4 * Math.sign(Math.sin(t * 55)) : 1)));
    signGlow.material.opacity = 0.14 * k(t, 0.3, 0.8);

    // NEXT: calls each candidate, and blinks for the one after at the end.
    const call = (a, b) => (t > a && t < b ? 0.6 + 0.4 * Math.sign(Math.sin((t - a) * 12)) : 0);
    const nx = Math.max(call(0.3, 1.25), call(4.5, 5.6), call(8.8, 10));
    nextM.color.setScalar(0.25 + 0.75 * nx); nextGlow.material.opacity = 0.8 * nx; nextL.intensity = 0.9 * nx;

    // Candidates step up to the glass, react, and leave.
    cands.forEach((cd, i) => {
      const C = CAND[i], ts = SLAM[i];
      const x = t < C.out[0] ? lerp(-1.5, 0, eo(k(t, C.in[0], C.in[1]))) : lerp(0, 1.7, ei(k(t, C.out[0], C.out[1])));
      const moving = (t > C.in[0] && t < C.in[1]) || (t > C.out[0] && t < C.out[1]);
      const bob = moving ? Math.abs(Math.sin(t * 13)) * 0.035 : Math.sin(t * 2 + i) * 0.004;
      const hop = i === 0 ? Math.sin(Math.PI * k(t, ts + 0.1, ts + 0.5)) * 0.1 + Math.sin(Math.PI * k(t, ts + 0.5, ts + 0.8)) * 0.04 : 0;
      const slump = i === 1 ? eo(k(t, ts + 0.15, ts + 0.7)) : 0;
      cd.g.position.set(x, bob + hop - slump * 0.04, -1.2);
      cd.body.rotation.z = moving ? Math.sin(t * 6.5) * 0.04 : 0;
      cd.head.rotation.x = slump * 0.42 - (i === 0 ? Math.sin(Math.PI * k(t, ts + 0.1, ts + 0.5)) * 0.15 : 0);
      cd.head.rotation.y = Math.sin(t * 0.9 + i * 2) * 0.12 * (1 - slump);
      cd.g.visible = t > C.in[0] && t < C.out[1];
    });
    queue.forEach((q, i) => { q.position.y = Math.sin(t * 1.7 + i * 2) * 0.006; q.rotation.y = Math.sin(t * 0.6 + i) * 0.15; });

    // Portfolios: slide in through the slot, fall open, get stamped, close, slide back out.
    folios.forEach((f, i) => {
      const C = CAND[i], ts = SLAM[i];
      const inP = eo(k(t, C.pin[0], C.pin[1])), outP = eio(k(t, C.pout[0], C.pout[1]));
      const z = lerp(lerp(-0.95, SPOT[1], inP), -0.95, outP);
      f.g.position.set(SPOT[0] + (1 - inP) * 0.02 - outP * 0.02, DESK + 0.006 + Math.sin(Math.PI * inP) * 0.004, z);
      f.g.rotation.y = (1 - inP) * 0.12 * (i ? -1 : 1) + outP * 0.08 + Math.sin(Math.PI * eo(k(t, C.pin[1] - 0.2, C.pin[1] + 0.25))) * 0.02;
      const open = eio(k(t, C.open[0], C.open[1])) * (1 - eio(k(t, C.close[0], C.close[1])));
      f.hinge.rotation.z = open * (Math.PI + 0.028) + Math.sin(Math.PI * k(t, C.open[1], C.open[1] + 0.25)) * -0.03;
      f.g.visible = t > C.pin[0] && t < C.pout[1];
      const hit = t > ts ? 1 : 0;
      f.mark.material.opacity = hit;
      f.mark.scale.setScalar(1 + 0.12 * (1 - eo(k(t, ts, ts + 0.12))));
      const rp = k(t, ts, ts + 0.45);
      f.ring.scale.setScalar(0.6 + 1.6 * eo(rp)); f.ring.material.opacity = hit * 0.7 * (1 - rp);
      f.flash.material.opacity = hit * 0.9 * Math.exp(-7 * Math.max(0, t - ts));
    });

    // Stamps: lift with anticipation, wind up, slam, squash, return.
    stamps.forEach((s, i) => {
      const ts = SLAM[i], r = REST[i];
      const tx = SPOT[0] + 0.03, tz = SPOT[1] + 0.04, top = DESK + 0.0195;
      const pos = kf(t, [
        [ts - 0.75, r], [ts - 0.4, [tx, top + 0.3, tz], eo], [ts - 0.1, [tx, top + 0.38, tz], eio],
        [ts, [tx, top, tz], ei], [ts + 0.22, [tx, top, tz]], [ts + 0.45, [tx, top + 0.24, tz], eo], [ts + 0.85, r, eio],
      ]);
      s.g.position.set(pos[0], pos[1], pos[2]);
      s.g.rotation.z = Math.sin(Math.PI * k(t, ts - 0.75, ts - 0.1)) * 0.18 * (i ? -1 : 1);
      s.g.rotation.x = Math.sin(Math.PI * k(t, ts + 0.22, ts + 0.85)) * -0.12;
      const sq = Math.exp(-14 * Math.max(0, t - ts)) * (t > ts ? 1 : 0);
      s.body.scale.set(1 + sq * 0.08, 1 - sq * 0.14, 1 + sq * 0.08);
    });

    drawCash(t);
    cashGlow.material.opacity = 0.25 + 0.6 * Math.exp(-4 * Math.max(0, t - SLAM[0] - 0.3)) * (t > SLAM[0] + 0.3 ? 1 : 0);

    // Rain falling through the street light.
    for (let i = 0; i < RN; i++) {
      const x = (rnd(i, 81) - 0.5) * 3.2, z = -0.85 - rnd(i, 82) * 2.4, sp = 3.2 + rnd(i, 83) * 1.4;
      const y = 2.6 - (((t * sp + rnd(i, 84) * 2.6) % 2.6) + 2.6) % 2.6;
      rpos[i * 6] = x; rpos[i * 6 + 1] = y; rpos[i * 6 + 2] = z;
      rpos[i * 6 + 3] = x - 0.012; rpos[i * 6 + 4] = y + 0.12; rpos[i * 6 + 5] = z;
    }
    rGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 3.66 };
}
