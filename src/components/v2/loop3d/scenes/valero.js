// Valero digital ecosystem audit lit loop, 10 s. "What is this website for?"
// A fuel station forecourt at blue hour, wet concrete under a lit canopy. The ValeroPay+ app hovers
// at the center with its two websites on either side, each wearing a question mark. The audit runs in
// three phases on the forecourt floor: map it (lines of light from digital media and point of purchase
// to every touchpoint), ask people (six personas rise, each with the task they came for), decide (a
// hundred opportunities burst out, settle into an effort-by-value matrix, and narrow: most go to their
// own groups, a handful glow and fly into one minimum viable site).
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const TEAL = '#19b3c6', DEEP = '#0a2a44', AMBER = '#ffb81c', INK = '#0b1622';
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const PHASES = ['Map it', 'Ask people', 'Decide'];
const PH_T = [2.6, 3.85, 5.0];
const SITES = [
  { url: 'ValeroPayPlus.com', at: [-0.95, 0.98, 0.1], ry: 0.4, hue: ['#0e4f7a', '#19b3c6'] },
  { url: 'ValeroRenewableDiesel.com', at: [0.95, 0.98, 0.1], ry: -0.4, hue: ['#14513f', '#5cc28a'] },
];
const APP_AT = new THREE.Vector3(0, 1.0, -0.15);
const SOURCES = [['Digital media', -1.15], ['Point of purchase', 1.15]];
const SZ = 1.35;
const TARGETS = [[-0.95, 0.12], [0, -0.13], [0.95, 0.12]];
// The six things people came for, one per persona.
const TASKS = ['App support', 'Payments', 'Card requests', 'Promotions', 'Fuel data sheets', 'Locations'];
const PX = [-1.0, -0.6, -0.2, 0.2, 0.6, 1.0];
const GROUPS = [['App', -0.62, -0.42], ['Fleet', 0, -0.5], ['Longer-term ideas', 0.62, -0.42]];
const TN = 100;
// The handful: low effort, high value, in priority order (grid column, row; row 0 is highest value).
const HANDFUL = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1]];
const LANDH = [7.85, 7.97, 8.09, 8.21, 8.33];
const MVP_AT = new THREE.Vector3(-0.22, 0.95, 0.62);

function ribbon(pts, w, y) {
  const n = pts.length, pos = new Float32Array(n * 6), nor = new Float32Array(n * 6), uv = new Float32Array(n * 4), idx = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)];
    let tx = b.x - a.x, tz = b.z - a.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
    const nx = -tz * w / 2, nz = tx * w / 2;
    pos.set([pts[i].x + nx, y, pts[i].z + nz, pts[i].x - nx, y, pts[i].z - nz], i * 6);
    nor.set([0, 1, 0, 0, 1, 0], i * 6);
    uv.set([i / (n - 1), 0, i / (n - 1), 1], i * 4);
    if (i < n - 1) { const q = i * 2; idx.push(q, q + 2, q + 1, q + 1, q + 2, q + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
function caption(kicker, line, { sub = null, accent = TEAL, h = 0.12 } = {}) {
  const W = 1024, H = sub ? 236 : 168;
  const { tex } = canvasTex(W, H, (c) => {
    const fit = (txt, size, weight) => { let px = size; c.font = `${weight} ${px}px ${SANS}`; while (c.measureText(txt).width > W - 104 && px > 20) { px -= 2; c.font = `${weight} ${px}px ${SANS}`; } return px; };
    const LP = fit(line, sub ? 52 : 46, 800), lw = c.measureText(line).width;
    const SP = sub ? fit(sub, 34, 600) : 34, sw = sub ? c.measureText(sub).width : 0;
    const bw = Math.min(W - 8, Math.max(lw, sw) + 92), x0 = (W - bw) / 2;
    c.fillStyle = 'rgba(6,16,26,0.84)'; roundRect(c, x0, 4, bw, H - 8, 30); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.16)'; c.lineWidth = 2; c.stroke();
    c.fillStyle = accent; c.fillRect(x0 + 46, 30, 30, 4);
    c.font = `700 22px ${MONO}`; c.textBaseline = 'middle'; c.fillText(kicker, x0 + 88, 33);
    c.fillStyle = '#fff'; c.font = `800 ${LP}px ${SANS}`; c.fillText(line, x0 + 46, sub ? 100 : 104);
    if (sub) { c.fillStyle = 'rgba(255,255,255,0.78)'; c.font = `600 ${SP}px ${SANS}`; c.fillText(sub, x0 + 46, 170); }
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(h * W / H, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, depthTest: false }));
  m.renderOrder = 20;
  return m;
}
// A task chip: colored dot and a word, on a dark pill.
function chip(text, dot, h = 0.14) {
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = `700 56px ${SANS}`;
  const W = Math.ceil(probe.measureText(text).width) + 130, H = 112;
  const { tex } = canvasTex(W, H, (c) => {
    c.fillStyle = 'rgba(7,22,36,0.9)'; roundRect(c, 2, 2, W - 4, H - 4, 52); c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.18)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = dot; c.beginPath(); c.arc(52, H / 2, 15, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = `700 56px ${SANS}`; c.textBaseline = 'middle'; c.fillText(text, 84, H / 2 + 3);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(h * W / H, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false }));
}
// A browser window: graphite frame, glowing screen, a canvas the size of the screen.
function browser(w, h, cw = 1024) {
  const g = new THREE.Group();
  const frame = mesh(new RoundedBoxGeometry(w + 0.03, h + 0.03, 0.028, 2, 0.016), std(0x1a1f27, { roughness: 0.28, metalness: 0.7 }));
  frame.position.z = -0.016; g.add(frame);
  const ch = Math.round(cw * h / w);
  const ui = canvasTex(cw, ch);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: ui.tex, toneMapped: false }));
  g.add(screen);
  const halo = glow(0x5fd3e6, 1, 0, 0.5); halo.position.z = -0.1; halo.scale.set(w * 2.1, h * 2.1, 1); g.add(halo);
  g.userData = { ui, screen, halo, w, h };
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x10283a, 5, 17);
  scene.environment = env;
  scene.environmentIntensity = 0.22;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- blue hour, the town beyond
  scene.add(skyDome([[0, '#040a18'], [0.3, '#0b1f3c'], [0.44, '#1d5374'], [0.475, '#3f7d8f'], [0.492, '#d98a4c'], [0.5, '#3a2f30'], [0.52, '#15161b'], [1, '#07080b']]));
  const town = [];
  for (let i = 0; i < 70; i++) town.push([(i - 35) * 0.62 + (rnd(i, 1) - 0.5) * 0.3, -13 - rnd(i, 2) * 3, 0.4 + rnd(i, 3) * rnd(i, 4) * 2.6, 0.4 + rnd(i, 5) * 0.5]);
  const townM = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x0a0e15, { roughness: 0.9 }), town.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler(), c4 = new THREE.Color();
  town.forEach(([x, z, h, w], i) => { m4.compose(p4.set(x, h / 2, z), q4.identity(), s4.set(w, h, 0.5)); townM.setMatrixAt(i, m4); });
  townM.castShadow = townM.receiveShadow = false; scene.add(townM);
  const winPos = [];
  town.forEach(([x, z, h, w], i) => { for (let j = 0; j < 4; j++) if (rnd(i * 4 + j, 8) > 0.45) winPos.push(x + (rnd(i * 4 + j, 9) - 0.5) * w * 0.8, rnd(i * 4 + j, 10) * h * 0.9 + 0.05, z + 0.27); });
  const townLights = new THREE.Points(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute(winPos, 3)), new THREE.PointsMaterial({ color: 0xffc27a, size: 0.05, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  scene.add(townLights);

  // ----------------------------------------------------------- wet forecourt
  const ground = mesh(new THREE.PlaneGeometry(36, 36), std(0xffffff, { map: grainTex('#1a1e24', { size: 256, speck: 0.08, blot: 0.14, seed: 33, repeat: 18 }), roughness: 0.24, metalness: 0.4 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const paint = canvasTex(1024, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(230,232,226,0.55)';
    for (let i = 0; i < 5; i++) c.fillRect(110 + i * 200, 20, 8, h - 40);
    c.fillStyle = 'rgba(255,184,28,0.5)'; c.fillRect(0, h - 26, w, 10);
  });
  const lanes = new THREE.Mesh(new THREE.PlaneGeometry(5.6, 2.8), new THREE.MeshStandardMaterial({ map: paint.tex, transparent: true, roughness: 0.4, depthWrite: false }));
  lanes.rotation.x = -Math.PI / 2; lanes.position.set(0, 0.002, -0.2); lanes.receiveShadow = true; scene.add(lanes);

  // ----------------------------------------------------------- canopy, columns, pumps, pylon
  const canopy = mesh(new THREE.BoxGeometry(4.8, 0.24, 2.4), std(0x2a3038, { roughness: 0.45, metalness: 0.5 }));
  canopy.position.set(0, 1.75, -0.1); scene.add(canopy);
  const under = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#1d2229'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < 6; x++) for (let y = 0; y < 3; y++) {
      const cx = 90 + x * 169, cy = 90 + y * 166;
      const g = c.createRadialGradient(cx, cy, 10, cx, cy, 120); g.addColorStop(0, 'rgba(200,225,255,0.5)'); g.addColorStop(1, 'rgba(200,225,255,0)');
      c.fillStyle = g; c.fillRect(cx - 120, cy - 120, 240, 240);
      c.fillStyle = '#ffffff'; roundRect(c, cx - 50, cy - 28, 100, 56, 10); c.fill();
    }
  });
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(4.76, 2.36), new THREE.MeshBasicMaterial({ map: under.tex, toneMapped: false }));
  ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 1.628, -0.1); scene.add(ceil);
  const stripM = new THREE.MeshBasicMaterial({ color: new THREE.Color(TEAL), toneMapped: false });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(4.82, 0.06, 0.012), stripM); strip.position.set(0, 1.66, 1.104); scene.add(strip);
  const pin = new THREE.Mesh(new THREE.BoxGeometry(4.82, 0.014, 0.012), new THREE.MeshBasicMaterial({ color: new THREE.Color(AMBER), toneMapped: false }));
  pin.position.set(0, 1.71, 1.104); scene.add(pin);
  const stripGlow = glow(0x19b3c6, 1, 0.4, 0.5); stripGlow.position.set(0, 1.66, 1.16); stripGlow.scale.set(5.6, 0.5, 1); scene.add(stripGlow);
  const cols = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.07, 0.08, 1.63, 20), std(0xb9c0c8, { roughness: 0.35, metalness: 0.7 }), 4);
  [[-1.95, -0.95], [1.95, -0.95], [-1.95, 0.75], [1.95, 0.75]].forEach(([x, z], i) => { m4.compose(p4.set(x, 0.815, z), q4.identity(), s4.set(1, 1, 1)); cols.setMatrixAt(i, m4); });
  cols.castShadow = true; cols.receiveShadow = true; scene.add(cols);
  const pumpScreen = canvasTex(128, 160, (c, w, h) => {
    c.fillStyle = '#1a0f04'; c.fillRect(0, 0, w, h);
    c.fillStyle = AMBER; for (let i = 0; i < 4; i++) c.fillRect(16, 22 + i * 30, 40 + rnd(i, 70) * 56, 12);
    c.strokeStyle = 'rgba(255,184,28,0.6)'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8);
  }).tex;
  const pumpLights = [-0.95, 0.95].map((x) => {
    const island = mesh(new RoundedBoxGeometry(1.0, 0.1, 0.34, 2, 0.03), std(0x9aa2ab, { roughness: 0.6 })); island.position.set(x, 0.05, -1.0); scene.add(island);
    const body = mesh(new RoundedBoxGeometry(0.26, 0.64, 0.2, 2, 0.03), std(0xd6dbe1, { roughness: 0.35, metalness: 0.2 })); body.position.set(x, 0.42, -1.0); scene.add(body);
    const cap = mesh(new THREE.BoxGeometry(0.27, 0.06, 0.21), std(0x0f7f8e, { roughness: 0.3, emissive: 0x0f7f8e, emissiveIntensity: 0.5 })); cap.position.set(x, 0.76, -1.0); scene.add(cap);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.175), new THREE.MeshBasicMaterial({ map: pumpScreen, toneMapped: false })); scr.position.set(x, 0.55, -0.899); scene.add(scr);
    const l = new THREE.PointLight(0xffa040, 0.9, 1.6, 1.6); l.position.set(x, 0.55, -0.7); scene.add(l);
    return l;
  });
  const pylon = mesh(new THREE.BoxGeometry(0.12, 2.4, 0.12), std(0x2a3038, { roughness: 0.5, metalness: 0.5 })); pylon.position.set(-3.2, 1.2, -2.4); scene.add(pylon);
  const signTex = canvasTex(128, 192, (c, w, h) => { c.fillStyle = '#0d2c40'; c.fillRect(0, 0, w, h); c.fillStyle = TEAL; c.fillRect(0, 0, w, 54); c.fillStyle = AMBER; c.fillRect(0, 54, w, 8); c.fillStyle = 'rgba(255,255,255,0.85)'; for (let i = 0; i < 3; i++) c.fillRect(18, 86 + i * 34, w - 36, 14); }).tex;
  const sign = new THREE.Mesh(new THREE.BoxGeometry(0.72, 1.0, 0.1), new THREE.MeshBasicMaterial({ map: signTex, toneMapped: false })); sign.position.set(-3.2, 2.5, -2.4); scene.add(sign);
  const signGlow = glow(0x2fc0d0, 2.2, 0.3, 0.5); signGlow.position.set(-3.2, 2.5, -2.3); scene.add(signGlow);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x2c5a80, 0x07090c, 0.35));
  const key = new THREE.SpotLight(0xeef4ff, 0, 0, 1.05, 0.7, 1.4);
  key.position.set(0, 1.6, 0.3); key.target.position.set(0, 0, 0.55);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.3; key.shadow.camera.far = 5; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x3fb8d0, 1.0); rim.position.set(-1.5, 2.2, -4); scene.add(rim);
  const appLight = new THREE.PointLight(0x5fd3e6, 0, 1.8, 1.6); scene.add(appLight);
  const mvpLight = new THREE.PointLight(0xffc860, 0, 2.2, 1.6); scene.add(mvpLight);

  // ----------------------------------------------------------- the app at the center
  const app = phone({ w: 0.4, h: 0.82, d: 0.036, r: 0.05 });
  scene.add(app);
  const AW = Math.round(1024 * app.userData.sw / app.userData.sh);
  const appUI = canvasTex(AW, 1024, (c, w, h) => {
    c.fillStyle = '#eef3f6'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, 230); g.addColorStop(0, DEEP); g.addColorStop(1, '#0f5a78');
    c.fillStyle = g; c.fillRect(0, 0, w, 230);
    c.fillStyle = '#fff'; c.font = `800 52px ${SANS}`; c.textBaseline = 'middle'; c.fillText('ValeroPay+', 36, 130);
    c.fillStyle = AMBER; c.fillRect(36, 180, 80, 6);
    // Station finding: a little map with pins.
    c.fillStyle = '#dfe9ee'; roundRect(c, 24, 254, w - 48, 380, 24); c.fill();
    c.save(); roundRect(c, 24, 254, w - 48, 380, 24); c.clip();
    c.strokeStyle = '#ffffff'; c.lineWidth = 14;
    [[0, 360, w, 330], [0, 520, w, 560], [120, 254, 160, 634], [300, 254, 260, 634]].forEach(([a, b, d, e]) => { c.beginPath(); c.moveTo(a, b); c.lineTo(d, e); c.stroke(); });
    [[140, 340], [270, 470], [90, 560], [330, 330]].forEach(([x, y], i) => { c.fillStyle = i === 1 ? AMBER : TEAL; c.beginPath(); c.arc(x, y, 18, 0, 7); c.fill(); c.strokeStyle = '#fff'; c.lineWidth = 6; c.stroke(); });
    c.restore();
    [['Offers', AMBER], ['Payments', TEAL]].forEach(([name, col], i) => {
      const y = 662 + i * 166;
      c.fillStyle = '#fff'; roundRect(c, 24, y, w - 48, 144, 22); c.fill();
      c.fillStyle = col; roundRect(c, 48, y + 30, 56, 56, 14); c.fill();
      c.fillStyle = INK; c.font = `800 40px ${SANS}`; c.fillText(name, 124, y + 58);
      c.fillStyle = '#d7dfe6'; roundRect(c, 48, y + 104, w - 150, 14, 7); c.fill();
    });
  });
  app.userData.screen.material.map = appUI.tex; app.userData.screen.material.needsUpdate = true;
  const appGlow = glow(0x5fd3e6, 1.4, 0, 0.5); appGlow.position.z = -0.1; appGlow.scale.set(1.1, 1.8, 1); app.add(appGlow);

  // ----------------------------------------------------------- the two websites, each a question
  const qTex = canvasTex(256, 256, (c, w) => {
    c.fillStyle = AMBER; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 6, 0, 7); c.fill();
    c.fillStyle = INK; c.font = `800 170px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('?', w / 2, w / 2 + 10);
  }).tex;
  const sites = SITES.map((s, si) => {
    const b = browser(0.92, 0.58);
    b.position.set(...s.at); b.rotation.y = s.ry; scene.add(b);
    b.userData.ui.redraw((c, w, h) => {
      c.fillStyle = '#f3f5f8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#dde3ea'; c.fillRect(0, 0, w, 70);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(34 + i * 30, 35, 9, 0, 7); c.fill(); });
      c.fillStyle = '#fff'; roundRect(c, 140, 14, w - 180, 42, 21); c.fill();
      c.fillStyle = '#3b4652'; c.font = `600 26px ${SANS}`; c.textBaseline = 'middle'; c.fillText(s.url, 166, 36);
      const g = c.createLinearGradient(0, 70, w, 360); g.addColorStop(0, s.hue[0]); g.addColorStop(1, s.hue[1]);
      c.fillStyle = g; c.fillRect(0, 70, w, 290);
      c.fillStyle = 'rgba(255,255,255,0.12)'; c.beginPath(); c.arc(w * 0.78, 220, 160, 0, 7); c.fill(); c.beginPath(); c.arc(w * 0.9, 120, 90, 0, 7); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.9)'; roundRect(c, 48, 150, 420, 34, 17); c.fill(); roundRect(c, 48, 202, 300, 34, 17); c.fill();
      c.fillStyle = AMBER; roundRect(c, 48, 266, 180, 50, 25); c.fill();
      for (let i = 0; i < 3; i++) { c.fillStyle = '#fff'; roundRect(c, 32 + i * 330, 388, 300, h - 412, 18); c.fill(); c.fillStyle = '#d7dfe6'; roundRect(c, 56 + i * 330, 420, 200, 20, 10); c.fill(); roundRect(c, 56 + i * 330, 456, 150, 20, 10); c.fill(); }
    });
    const q = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshBasicMaterial({ map: qTex, transparent: true, toneMapped: false, depthWrite: false }));
    const qg = glow(0xffb81c, 0.8, 0, 0.35); q.add(qg); qg.position.z = -0.01;
    scene.add(q);
    return { b, q, qg, si };
  });

  // ----------------------------------------------------------- phase 1: the ecosystem map on the floor
  const lineM = () => new THREE.MeshBasicMaterial({ color: 0x5fe0f0, transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const LSEG = 48;
  const lines = [];
  SOURCES.forEach(([, sx], si) => TARGETS.forEach(([tx, tz], ti) => {
    const a = new THREE.Vector3(sx, 0, SZ), b = new THREE.Vector3(tx, 0, tz);
    const ctl = a.clone().lerp(b, 0.5).add(new THREE.Vector3((ti - 1) * 0.25, 0, 0.18));
    const pts = new THREE.QuadraticBezierCurve3(a, ctl, b).getPoints(LSEG);
    const m = new THREE.Mesh(ribbon(pts, 0.022, 0.006), lineM()); m.renderOrder = 2; scene.add(m);
    lines.push({ m, d: si * 0.12 + ti * 0.08 });
  }));
  const ringTex = canvasTex(256, 256, (c, w) => {
    c.strokeStyle = '#7fe8f5'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 12, 0, 7); c.stroke();
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(95,224,240,0.55)'); g.addColorStop(1, 'rgba(95,224,240,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const srcs = SOURCES.map(([name, sx]) => {
    const r = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.42), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    r.rotation.x = -Math.PI / 2; r.position.set(sx, 0.007, SZ); scene.add(r);
    const l = label(name, { font: `800 56px ${SANS}`, fg: '#fff', bg: 'rgba(10,42,68,0.92)', h: 0.15, pad: 34 });
    l.position.set(sx, 0.2, SZ + 0.05); scene.add(l);
    return { r, l };
  });
  const pillarM = new THREE.MeshBasicMaterial({ color: 0x8ff0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const pillars = TARGETS.map(([x, z], i) => {
    const top = i === 1 ? 0.58 : 0.68;
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1, 10, 1, true), pillarM);
    p.geometry.translate(0, 0.5, 0); p.position.set(x, 0, z); p.userData.top = top; scene.add(p);
    return p;
  });

  // ----------------------------------------------------------- phase 2: six personas, each with a task
  const body = new THREE.CapsuleGeometry(0.05, 0.13, 4, 12); body.translate(0, 0.115, 0);
  const pM = std(0xb9c7cf, { roughness: 0.55 });
  const bodies = new THREE.InstancedMesh(body, pM, 6), heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.043, 20, 14), pM, 6);
  bodies.castShadow = heads.castShadow = true; bodies.frustumCulled = heads.frustumCulled = false;
  scene.add(bodies, heads);
  const DOTS = [TEAL, AMBER, '#7fd06a', '#ff7a6a', '#a98bff', '#5fb0ff'];
  const PZ = (i) => 0.98 + Math.abs(PX[i]) * 0.08;
  const chips = TASKS.map((tk, i) => { const c = chip(tk, DOTS[i]); scene.add(c); return c; });
  const CHIP_Y = (i) => (i % 2 ? 0.74 : 0.52);

  // ----------------------------------------------------------- phase 3: a hundred opportunities, then a handful
  const tiles = new THREE.InstancedMesh(new RoundedBoxGeometry(0.16, 0.012, 0.1, 1, 0.004), std(0xffffff, { roughness: 0.35, metalness: 0.1 }), TN);
  tiles.castShadow = true; tiles.receiveShadow = true; tiles.frustumCulled = false;
  for (let i = 0; i < TN; i++) tiles.setColorAt(i, c4.set('#dfe7ee'));
  scene.add(tiles);
  const cellOf = (i) => (i * 37) % 100;            // scrambles which tile lands in which cell
  const cellXZ = (cell) => [-0.9 + (cell % 10) * 0.2, 0.25 + Math.floor(cell / 10) * 0.132];
  const handIdx = HANDFUL.map(([c, r]) => { const cell = r * 10 + c; for (let i = 0; i < TN; i++) if (cellOf(i) === cell) return i; return 0; });
  const rank = new Array(TN).fill(-1);
  let rr = 0; for (let i = 0; i < TN; i++) if (!handIdx.includes(i)) rank[i] = rr++;
  const handGlows = HANDFUL.map(() => { const g = glow(0xffb81c, 0.32, 0, 0.35); scene.add(g); return g; });
  const gridTex = canvasTex(1024, 683, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const x0 = 112, y0 = 52, cw = 85.3, chh = 56.3; // matches cellXZ on a 2.4 x 1.6 decal
    c.strokeStyle = 'rgba(127,232,245,0.35)'; c.lineWidth = 2;
    for (let i = 0; i <= 10; i++) { c.beginPath(); c.moveTo(x0 + i * cw, y0); c.lineTo(x0 + i * cw, y0 + 10 * chh); c.stroke(); c.beginPath(); c.moveTo(x0, y0 + i * chh); c.lineTo(x0 + 10 * cw, y0 + i * chh); c.stroke(); }
    c.fillStyle = 'rgba(255,184,28,0.16)'; c.fillRect(x0, y0, cw * 3, chh * 2);
    c.fillStyle = '#9fefff'; c.font = `800 40px ${SANS}`; c.textBaseline = 'middle';
    c.fillText('EFFORT →', x0 + 10 * cw - 230, y0 + 10 * chh + 36);
    c.save(); c.translate(x0 - 40, y0 + 10 * chh); c.rotate(-Math.PI / 2); c.fillText('VALUE →', 0, 0); c.restore();
  });
  const grid = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), new THREE.MeshBasicMaterial({ map: gridTex.tex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  grid.rotation.x = -Math.PI / 2;
  // Place the decal so the canvas cell grid (origin 112, 52 px; 85.3 x 56.3 px cells) lands on cellXZ.
  grid.position.set(-0.9 + 1.2 - (112 + 85.3 / 2) / 1024 * 2.4, 0.008, 0.25 + 0.8 - (52 + 56.3 / 2) / 683 * 1.6);
  scene.add(grid);
  const groupTags = GROUPS.map(([name, x, z]) => { const l = label(name, { font: `800 56px ${SANS}`, fg: '#fff', bg: 'rgba(40,52,66,0.92)', h: 0.13, pad: 30 }); l.position.set(x, 0.42, z + 0.16); scene.add(l); return l; });

  // ----------------------------------------------------------- the answer: one minimum viable site
  const mvp = browser(0.9, 0.6);
  mvp.position.copy(MVP_AT); mvp.rotation.y = 0.12; scene.add(mvp);
  let mKey = '';
  const drawMVP = (t) => {
    const rows = LANDH.filter((l) => t > l).length;
    const live = LANDH.some((l) => t > l && t < l + 0.35);
    const key = [rows, live ? Math.round(t * 30) : 0].join('|');
    if (key === mKey) return; mKey = key;
    mvp.userData.ui.redraw((c, w, h) => {
      c.fillStyle = '#f4f6f8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#dde3ea'; c.fillRect(0, 0, w, 70);
      ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(34 + i * 30, 35, 9, 0, 7); c.fill(); });
      c.fillStyle = '#fff'; roundRect(c, 140, 14, w - 180, 42, 21); c.fill();
      c.fillStyle = DEEP; c.fillRect(0, 70, w, 150);
      c.fillStyle = AMBER; c.fillRect(48, 196, 90, 6);
      c.fillStyle = '#fff'; c.font = `800 52px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Minimum viable site', 48, 124);
      c.fillStyle = 'rgba(255,255,255,0.75)'; c.font = `600 28px ${SANS}`; c.fillText('The basics, delivered well', 48, 172);
      for (let i = 0; i < 5; i++) {
        const y = 240 + i * 74, on = i < rows, p = on ? back(k(t, LANDH[i], LANDH[i] + 0.3)) : 0;
        c.fillStyle = on ? '#fff' : 'rgba(10,42,68,0.06)'; roundRect(c, 32, y, w - 64, 62, 14); c.fill();
        if (!on) { c.strokeStyle = 'rgba(10,42,68,0.15)'; c.setLineDash([10, 8]); c.lineWidth = 2; c.stroke(); c.setLineDash([]); continue; }
        c.fillStyle = AMBER; c.beginPath(); c.arc(70, y + 31, 20 * clamp(p, 0, 1.2), 0, 7); c.fill();
        c.fillStyle = INK; c.font = `800 26px ${MONO}`; c.textAlign = 'center'; c.fillText(String(i + 1), 70, y + 32); c.textAlign = 'left';
        c.fillStyle = '#d3dde6'; roundRect(c, 112, y + 18, (w - 220) * (0.75 - i * 0.08) * clamp(p), 12, 6); c.fill();
        c.fillStyle = '#e6ecf1'; roundRect(c, 112, y + 38, (w - 220) * (0.5 - i * 0.05) * clamp(p), 10, 5); c.fill();
      }
      c.fillStyle = TEAL; c.font = `700 24px ${SANS}`; c.textAlign = 'right'; c.fillText('Then grow over time →', w - 40, h - 18); c.textAlign = 'left';
    });
  };

  // ----------------------------------------------------------- wet-floor reflections of every bright thing
  const streakTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.globalCompositeOperation = 'destination-in';
    const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,0)'); s.addColorStop(0.5, 'rgba(0,0,0,1)'); s.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const streakGeo = new THREE.PlaneGeometry(1, 1); streakGeo.rotateX(-Math.PI / 2); streakGeo.translate(0, 0, 0.5);
  const streak = (x, z, w, len, col, o) => {
    const m = new THREE.Mesh(streakGeo, new THREE.MeshBasicMaterial({ map: streakTex, color: col, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.set(x, 0.004, z); m.scale.set(w, 1, len); m.userData.o = o; m.renderOrder = 1; scene.add(m); return m;
  };
  const streaks = [
    streak(0, 1.104, 4.4, 1.6, 0x19b3c6, 0.35),
    streak(SITES[0].at[0], SITES[0].at[2] + 0.06, 0.8, 1.2, 0xbfe9ff, 0.22),
    streak(SITES[1].at[0], SITES[1].at[2] + 0.06, 0.8, 1.2, 0xbfe9ff, 0.22),
    streak(0, -0.12, 0.38, 1.4, 0x8fe6f2, 0.25),
    streak(-0.95, -0.88, 0.2, 0.8, 0xffa040, 0.35),
    streak(0.95, -0.88, 0.2, 0.8, 0xffa040, 0.35),
    streak(MVP_AT.x, MVP_AT.z + 0.05, 0.8, 1.2, 0xffe2a8, 0.0),
  ];

  // ----------------------------------------------------------- HUD and captions (ride with the camera)
  const hud = canvasTex(1024, 112);
  const hudM = new THREE.Mesh(new THREE.PlaneGeometry(0.075 * 1024 / 112, 0.075), new THREE.MeshBasicMaterial({ map: hud.tex, transparent: true, toneMapped: false, depthWrite: false, depthTest: false }));
  hudM.renderOrder = 20; hudM.position.set(0, 0.32, -1.6); camera.add(hudM);
  let hKey = '';
  const drawHud = (t) => {
    const at = PH_T.filter((p) => t > p).length;
    const live = PH_T.some((p) => t > p && t < p + 0.35);
    const key = [at, live ? Math.round(t * 30) : 0].join('|');
    if (key === hKey) return; hKey = key;
    hud.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      const sw = (w - 40) / 3;
      PHASES.forEach((ph, i) => {
        const x = 20 + i * sw, on = i === at - 1, done = i < at - 1, p = back(k(t, PH_T[i], PH_T[i] + 0.35));
        c.fillStyle = on ? TEAL : done ? 'rgba(25,179,198,0.22)' : 'rgba(6,16,26,0.7)';
        roundRect(c, x + 6, 10, sw - 12, h - 20, 46); c.fill();
        c.strokeStyle = on || done ? TEAL : 'rgba(255,255,255,0.2)'; c.lineWidth = 3; c.stroke();
        c.fillStyle = on ? INK : '#fff'; c.font = `800 26px ${MONO}`; c.textBaseline = 'middle'; c.fillText(done ? '✓' : String(i + 1), x + 40, h / 2 + 2);
        c.font = `800 36px ${SANS}`; c.fillStyle = on ? INK : done ? '#bff3fa' : 'rgba(255,255,255,0.55)';
        c.save(); if (on) { c.translate(x + 82, h / 2 + 2); c.scale(0.9 + 0.1 * clamp(p, 0, 1.2), 0.9 + 0.1 * clamp(p, 0, 1.2)); c.fillText(ph, 0, 0); } else c.fillText(ph, x + 82, h / 2 + 2); c.restore();
      });
    });
  };
  const caps = [
    [caption('THE BRIEF', 'What is this website for?', { accent: AMBER }), 0.75, 2.6],
    [caption('THE ECOSYSTEM', 'Two sites around the ValeroPay+ app'), 2.75, 3.85],
    [caption('SIX PERSONAS', 'People arrived with a task'), 3.95, 5.0],
    [caption('OPPORTUNITIES', 'Finding 100 problems is easy'), 5.1, 6.45],
    [caption('NARROWING', 'Which handful matter, and in what order', { accent: AMBER }), 6.55, 7.65],
    [caption('RECOMMENDATION', 'A minimum viable site that delivers the basics well', { accent: AMBER }), 7.75, 8.75],
    [caption('RESULT', '3-phase audit · 6 personas', { sub: 'Findings well received by Valero stakeholders', accent: TEAL, h: 0.165 }), 8.85, 9.9],
  ];
  caps.forEach(([m]) => { camera.add(m); m.visible = false; });

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0, 0.82, 3.7]], [2.5, [0.08, 0.9, 3.2], (x) => x],
    [3.6, [0.3, 2.3, 3.9]], [4.9, [-0.15, 2.05, 3.6], (x) => x],
    [5.9, [0.1, 2.85, 3.45]], [7.1, [-0.2, 2.7, 3.35], (x) => x],
    [8.1, [0.15, 1.2, 3.05]], [10, [0.1, 1.12, 2.8], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 1.02, 0]], [2.5, [0, 1.0, 0], (x) => x],
    [3.6, [0, 0.3, 0.55]], [4.9, [0, 0.42, 0.6], (x) => x],
    [5.9, [0, 0.15, 0.85]], [7.1, [0, 0.2, 0.75], (x) => x],
    [8.1, [0, 0.98, 0.3]], [10, [0, 0.98, 0.3], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), cpos = new THREE.Vector3(), slot = new THREE.Vector3();
  const flat = new THREE.Euler(), stand = new THREE.Euler(0, 0, 0, 'YXZ'), qa = new THREE.Quaternion(), qb = new THREE.Quaternion();
  const C_BASE = new THREE.Color('#dfe7ee'), C_AMBER = new THREE.Color(AMBER), C_TEAL = new THREE.Color(TEAL), C_DIM = new THREE.Color('#4a5866');

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.009, p[1] + Math.sin(t * 1.5 + 1) * 0.006, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.5, 32], [3.6, 36], [7.1, 36], [8.1, 33], [10, 32]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    camera.updateMatrixWorld();
    camera.getWorldPosition(cpos);

    // Act 1: the canopy lights come on panel-bright, then the app and its two sites.
    const lit = clamp(k(t, 0.1, 0.8) + (t < 0.8 ? (rnd(Math.floor(t * 24), 3) - 0.5) * 0.5 : 0));
    ceil.material.color.setScalar(0.15 + 0.85 * lit);
    key.intensity = 9 * lit;
    stripM.color.set(TEAL).multiplyScalar(0.3 + 0.7 * eo(k(t, 0.4, 0.9)));
    stripGlow.material.opacity = 0.4 * eo(k(t, 0.4, 0.9));
    pumpLights.forEach((l, i) => { l.intensity = 0.9 + Math.sin(t * 3 + i) * 0.05; });

    const aOn = eo(k(t, 0.55, 1.1));
    const aMove = eio(k(t, 7.0, 7.8));
    app.position.set(lerp(APP_AT.x, 0.42, aMove), lerp(APP_AT.y, 1.12, aMove) + Math.sin(t * 1.6) * 0.012, lerp(APP_AT.z, -0.1, aMove));
    app.rotation.set(-0.04, Math.sin(t * 0.6) * 0.12 - aMove * 0.18, 0);
    app.userData.screen.material.color.setScalar(lerp(0.04, 0.95, aOn));
    app.userData.sheen.position.x = Math.sin(t * 0.7) * 0.04;
    appGlow.material.opacity = 0.4 * aOn;
    appLight.position.set(app.position.x, app.position.y, app.position.z + 0.35); appLight.intensity = 1.6 * aOn;

    const ansIn = eo(k(t, 7.15, 7.8));
    sites.forEach(({ b, q, qg, si }) => {
      const on = eo(k(t, 0.85 + si * 0.25, 1.4 + si * 0.25));
      const out = 0.55 * ansIn;
      b.position.set(SITES[si].at[0] + (si ? 1 : -1) * 0.12 * ansIn, SITES[si].at[1] + Math.sin(t * 1.3 + si * 2) * 0.01, SITES[si].at[2] - 0.15 * ansIn);
      b.userData.screen.material.color.setScalar(lerp(0.04, 0.9, on) * (1 - out));
      b.userData.halo.material.opacity = 0.18 * on * (1 - out);
      b.scale.setScalar(0.92 + 0.08 * back(k(t, 0.85 + si * 0.25, 1.4 + si * 0.25)));
      // The question rides above each site until the answer lands.
      const qa2 = back(k(t, 1.35 + si * 0.2, 1.75 + si * 0.2)), qo = (1 - ei(k(t, 7.2, 7.6))) * lerp(1, 0.65, k(t, 3.6, 4.0));
      q.position.set(b.position.x, b.position.y + 0.43 + Math.sin(t * 2.2 + si) * 0.015, b.position.z + 0.02);
      q.lookAt(cpos);
      q.scale.setScalar(Math.max(0.001, qa2 * (1 + 0.05 * Math.sin(t * 5 + si))));
      q.material.opacity = clamp(qa2) * qo; qg.material.opacity = 0.55 * clamp(qa2) * qo;
      q.visible = qa2 > 0.01 && qo > 0.01;
    });

    // Act 2a, map it: lines of light run from digital media and point of purchase to each touchpoint.
    const mapOut = 1 - eo(k(t, 5.0, 5.6));
    srcs.forEach(({ r, l }, i) => {
      const a = back(k(t, 2.6 + i * 0.12, 2.95 + i * 0.12));
      r.scale.setScalar(Math.max(0.001, a)); r.material.opacity = clamp(a) * mapOut; r.visible = a > 0.01 && mapOut > 0.01;
      l.lookAt(cpos); l.material.opacity = eo(k(t, 2.7 + i * 0.12, 3.05 + i * 0.12)) * mapOut; l.visible = l.material.opacity > 0.01;
    });
    lines.forEach(({ m, d }) => {
      const e = eio(k(t, 2.85 + d, 3.5 + d));
      m.geometry.setDrawRange(0, Math.floor(e * LSEG) * 6);
      m.visible = e > 0 && mapOut > 0.01;
      m.material.opacity = 0.85 * mapOut * (0.85 + 0.15 * Math.sin(t * 6 + d * 20));
    });
    pillars.forEach((pl, i) => {
      const e = eo(k(t, 3.4 + i * 0.08, 3.8 + i * 0.08));
      pl.scale.set(1, Math.max(0.001, e * pl.userData.top), 1);
      pl.visible = e > 0 && mapOut > 0.01;
    });
    pillarM.opacity = 0.8 * mapOut;

    // Act 2b, ask people: six personas rise, each with the task they came for.
    const sink = ei(k(t, 5.2, 5.7));
    for (let i = 0; i < 6; i++) {
      const r = spring(k(t, 3.9 + i * 0.09, 4.6 + i * 0.09));
      const sy = Math.max(0.001, r * (1 - sink));
      m4.compose(p4.set(PX[i], 0, PZ(i)), q4.identity(), s4.set(Math.max(0.001, clamp(r * 1.5) * (1 - sink)), sy, Math.max(0.001, clamp(r * 1.5) * (1 - sink))));
      bodies.setMatrixAt(i, m4);
      m4.compose(p4.set(PX[i], 0.29 * sy, PZ(i)), q4.identity(), s4.setScalar(sy));
      heads.setMatrixAt(i, m4);
      const c = chips[i], ca = back(k(t, 4.1 + i * 0.1, 4.45 + i * 0.1)), pop = k(t, 4.95 + i * 0.03, 5.15 + i * 0.03);
      c.position.set(PX[i], CHIP_Y(i) + Math.sin(t * 2 + i) * 0.01, PZ(i));
      c.lookAt(cpos);
      c.scale.setScalar(Math.max(0.001, ca * (1 + eo(pop) * 0.25)));
      c.material.opacity = clamp(ca) * (1 - pop);
      c.visible = ca > 0.01 && pop < 1;
    }
    bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
    bodies.visible = heads.visible = t > 3.85 && sink < 1;

    // The minimum viable site is placed first: the handful read its matrix to find their rows.
    const mIn = back(k(t, 7.15, 7.75));
    mvp.position.set(MVP_AT.x, MVP_AT.y - (1 - clamp(mIn)) * 0.25 + Math.sin(t * 1.4) * 0.008, MVP_AT.z);
    mvp.scale.setScalar(Math.max(0.001, 0.85 + 0.15 * mIn));
    mvp.visible = mIn > 0.01;
    mvp.updateMatrixWorld();

    // Act 3, decide: a hundred opportunities burst out, sort into the matrix, and narrow.
    const gridO = eo(k(t, 5.55, 6.0)) * (1 - eo(k(t, 7.3, 7.8)));
    grid.material.opacity = 0.9 * gridO; grid.visible = gridO > 0.01;
    const sel = eo(k(t, 6.55, 6.85));
    for (let i = 0; i < TN; i++) {
      const pi = i % 6, src = [PX[pi], CHIP_Y(pi), PZ(pi)];
      const burst = eo(k(t, 4.95 + rnd(i, 1) * 0.25, 5.55 + rnd(i, 1) * 0.25));
      const a = rnd(i, 2) * Math.PI * 2 + t * (0.5 + rnd(i, 3) * 0.6), rad = 0.35 + rnd(i, 4) * 0.85;
      const cloud = [Math.cos(a) * rad * 1.15, 0.75 + rnd(i, 5) * 0.65 + Math.sin(t * 1.7 + i) * 0.04, 0.68 + Math.sin(a) * rad * 0.5];
      const toGrid = eio(k(t, 5.6 + rnd(i, 6) * 0.35, 6.25 + rnd(i, 6) * 0.35));
      const [gx, gz] = cellXZ(cellOf(i));
      let x = lerp(lerp(src[0], cloud[0], burst), gx, toGrid);
      let y = lerp(lerp(src[1], cloud[1], burst), 0.014, toGrid);
      let z = lerp(lerp(src[2], cloud[2], burst), gz, toGrid);
      const spinA = (1 - toGrid) * burst;
      flat.set(t * rnd(i, 7) * 3 * spinA, a * spinA, t * rnd(i, 8) * 2 * spinA);
      const hi = handIdx.indexOf(i);
      let sc = burst > 0 ? clamp(burst * 2) : 0;
      if (hi >= 0) {
        // The handful: lift and glow, then fly into the site's rows in order.
        const lift = back(k(t, 6.6 + hi * 0.06, 6.95 + hi * 0.06));
        y += lift * (0.32 + hi * 0.03);
        const fly = eio(k(t, LANDH[hi] - 0.6, LANDH[hi]));
        slot.set(-0.06, 0.08 - hi * 0.087, 0.02).applyMatrix4(mvp.matrixWorld);
        const arc = Math.sin(Math.PI * fly) * 0.18;
        x = lerp(x, slot.x, fly); y = lerp(y, slot.y, fly) + arc; z = lerp(z, slot.z, fly) + arc * 0.5;
        stand.set(Math.PI / 2, mvp.rotation.y, 0);
        qa.setFromEuler(flat); qb.setFromEuler(stand); qa.slerp(qb, fly);
        sc *= 1 - ei(k(t, LANDH[hi] - 0.08, LANDH[hi]));
        tiles.setColorAt(i, c4.copy(C_BASE).lerp(C_AMBER, sel));
        const g = handGlows[hi];
        g.position.set(x, y + 0.01, z); g.material.opacity = 0.75 * sel * (sc > 0.01 ? 1 : 0); g.visible = sel > 0 && sc > 0.01;
      } else {
        // Everything else goes to its own group, stacked: app, fleet, longer-term ideas.
        const gi = rank[i] % 3, lvl = Math.floor(rank[i] / 3);
        const go = eio(k(t, 6.75 + lvl * 0.018, 7.2 + lvl * 0.018));
        const [, sx, sz] = GROUPS[gi];
        const ty = 0.006 + lvl * 0.0135;
        const arc = Math.sin(Math.PI * go) * (0.35 + lvl * 0.004);
        x = lerp(x, sx + (rnd(i, 9) - 0.5) * 0.012, go); y = lerp(y, ty, go) + arc; z = lerp(z, sz + (rnd(i, 10) - 0.5) * 0.012, go);
        flat.y += go * (rnd(i, 11) - 0.5) * 0.25;
        qa.setFromEuler(flat);
        const score = 0.5 * (1 - (cellOf(i) % 10) / 9) + 0.5 * (1 - Math.floor(cellOf(i) / 10) / 9);
        c4.copy(C_BASE).lerp(C_TEAL, toGrid * score * 0.7 * (1 - sel)).lerp(C_DIM, sel * 0.85);
        tiles.setColorAt(i, c4);
      }
      m4.compose(p4.set(x, y, z), qa, s4.setScalar(Math.max(0.001, sc)));
      tiles.setMatrixAt(i, m4);
    }
    tiles.instanceMatrix.needsUpdate = true; tiles.instanceColor.needsUpdate = true;
    tiles.visible = t > 4.9;
    groupTags.forEach((l, i) => {
      const a = eo(k(t, 7.0 + i * 0.1, 7.4 + i * 0.1)) * (1 - ei(k(t, 9.3, 9.6)));
      l.lookAt(cpos); l.material.opacity = a; l.visible = a > 0.01;
    });

    // Act 4, the answer: the minimum viable site has risen in front of the app; the handful fill it.
    drawMVP(t);
    const filled = eo(k(t, 7.85, 8.6));
    mvp.userData.screen.material.color.setScalar(lerp(0.2, 1, clamp(mIn)));
    mvp.userData.halo.material.color.set(0xffc860);
    mvp.userData.halo.material.opacity = 0.12 + 0.28 * filled;
    mvpLight.position.set(MVP_AT.x, MVP_AT.y, MVP_AT.z + 0.45); mvpLight.intensity = 2.2 * filled;
    streaks[6].userData.o = 0.32 * clamp(mIn);
    // Reflections follow what moves: the two sites and the app.
    streaks[1].position.set(sites[0].b.position.x, 0.004, sites[0].b.position.z + 0.06);
    streaks[2].position.set(sites[1].b.position.x, 0.004, sites[1].b.position.z + 0.06);
    streaks[3].position.set(app.position.x, 0.004, app.position.z + 0.03);
    streaks.forEach((s, i) => {
      s.rotation.y = Math.atan2(cpos.x - s.position.x, cpos.z - s.position.z);
      const fade = i === 0 ? 0.3 + 0.7 * eo(k(t, 0.4, 0.9)) : i === 3 ? aOn : i === 1 || i === 2 ? eo(k(t, 0.85, 1.6)) * (1 - 0.55 * ansIn) : 1;
      s.material.opacity = s.userData.o * fade;
    });

    drawHud(t);
    const ho = eo(k(t, 2.45, 2.8)) * (1 - ei(k(t, 8.6, 9.0)));
    hudM.material.opacity = ho; hudM.visible = ho > 0.01;
    caps.forEach(([m, a, b], i) => {
      const o = eo(k(t, a, a + 0.3)) * (1 - ei(k(t, b - 0.25, b)));
      m.visible = o > 0.01;
      m.material.opacity = o;
      m.position.set(0, -0.33 + (1 - o) * -0.02 + (i === caps.length - 1 ? 0.02 : 0), -1.6);
    });
  }

  return { scene, camera, update, duration: D, poster: 9.25 };
}
