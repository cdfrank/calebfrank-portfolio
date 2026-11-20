// General Motors OnStar shopping pages and cart lit loop, 10 s. "Support to lead, then the store."
// An architect's white maquette of a city on a floating plinth at dusk. A glass badge hangs over it and
// flips from Supporting role to Lead designer, then dives into the plinth: a new catalog ripples out and
// 18 shopping pages rise out of their lots as glowing screens. A plan card peels off one page into a
// chrome cart, the cart counts one and checks out, rolls off down the street, and as night falls the
// streets fill with traffic: 20,000 to 30,000 more weekly views.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, glow, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const BLUE = '#1f6fe0', NAVY = '#0a1e44', ICE = '#9cc8ff';
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const PW = 0.34, PH = 0.6, PD = 0.022;
const ROWZ = [-1.0, -0.2, 0.6];
const PAGES = [];
ROWZ.forEach((z, r) => {
  for (let c = 0; c < 6; c++) PAGES.push({ x: -1.75 + c * 0.7 + [0.18, -0.18, 0][r], z, yaw: (rnd(r * 6 + c, 3) - 0.5) * 0.22 });
});
const HERO = 15;                       // front row, right of centre: the plans page the cart comes from
PAGES[HERO].yaw = 0;
// The new catalog ripples out from the centre: nearest lots rise first.
const RISE = new Array(PAGES.length);
PAGES.map((p, i) => [i, Math.hypot(p.x, (p.z + 0.2) * 1.4)]).sort((a, b) => a[1] - b[1]).forEach(([i], n) => { RISE[i] = 3.1 + n * 0.1; });
const LANES = [-1.42, -0.6, 0.2, 1.02];
const CART = [0.8, 0, 1.2];            // where the cart lands
const SN = 80;                          // traffic streaks

// ---------------------------------------------------------------- canvas art
function pageTex(v) {
  return canvasTex(448, 824, (c, w, h) => {
    c.fillStyle = '#f5f7fb'; c.fillRect(0, 0, w, h);
    c.fillStyle = NAVY; c.fillRect(0, 0, w, 74);
    c.textBaseline = 'middle';
    c.fillStyle = '#fff'; c.font = `800 30px ${SANS}`; c.fillText('OnStar', 24, 38);
    c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = `600 18px ${SANS}`; c.textAlign = 'right'; c.fillText('Owner Center', w - 24, 38); c.textAlign = 'left';
    const g = c.createLinearGradient(0, 74, w, 280); g.addColorStop(0, BLUE); g.addColorStop(1, '#0d3f94');
    c.fillStyle = g; c.fillRect(0, 74, w, 200);
    c.fillStyle = '#fff'; c.font = `800 56px ${SANS}`; c.fillText(['Plans', 'Add-ons', 'Cart'][v], 28, 160);
    c.fillStyle = 'rgba(255,255,255,0.72)'; c.font = `600 22px ${SANS}`; c.fillText(['Subscription pricing', 'Plan details', 'Cart and checkout'][v], 30, 216);
    const bar = (x, y, bw, col = '#d5dbe6', bh = 14) => { c.fillStyle = col; roundRect(c, x, y, bw, bh, bh / 2); c.fill(); };
    if (v === 0) {
      for (let i = 0; i < 3; i++) {
        const y = 300 + i * 165;
        c.fillStyle = '#fff'; roundRect(c, 24, y, w - 48, 140, 16); c.fill();
        c.strokeStyle = i === 0 ? BLUE : '#e1e6ee'; c.lineWidth = i === 0 ? 4 : 2; c.stroke();
        c.fillStyle = i === 0 ? BLUE : '#9fb3d4'; c.fillRect(24, y + 16, 8, 108);
        bar(52, y + 26, 150 + rnd(i, 2) * 70, '#2a3346', 18);
        bar(52, y + 58, 210, '#d5dbe6'); bar(52, y + 80, 170, '#d5dbe6');
        bar(w - 168, y + 26, 70, '#2a3346', 22);
        c.fillStyle = '#5a6578'; c.font = `700 20px ${SANS}`; c.fillText('/mo', w - 92, y + 38);
        c.fillStyle = i === 0 ? BLUE : '#edf2fb'; roundRect(c, w - 196, y + 88, 150, 38, 19); c.fill();
        c.fillStyle = i === 0 ? '#fff' : BLUE; c.font = `700 18px ${SANS}`; c.textAlign = 'center'; c.fillText('Add to cart', w - 121, y + 108); c.textAlign = 'left';
      }
    } else if (v === 1) {
      for (let i = 0; i < 4; i++) {
        const x = 24 + (i % 2) * 206, y = 300 + Math.floor(i / 2) * 250;
        c.fillStyle = '#fff'; roundRect(c, x, y, 194, 226, 16); c.fill();
        c.fillStyle = ['#d8e6ff', '#ffe6d1', '#dff3e6', '#efe2ff'][i]; c.beginPath(); c.arc(x + 50, y + 52, 28, 0, 7); c.fill();
        bar(x + 20, y + 100, 130, '#2a3346', 16); bar(x + 20, y + 128, 150); bar(x + 20, y + 150, 110);
        c.fillStyle = '#edf2fb'; roundRect(c, x + 20, y + 178, 76, 32, 16); c.fill();
        c.fillStyle = BLUE; c.font = `700 17px ${SANS}`; c.textAlign = 'center'; c.fillText('Add', x + 58, y + 195); c.textAlign = 'left';
      }
    } else {
      for (let i = 0; i < 3; i++) {
        const y = 300 + i * 96;
        c.fillStyle = '#fff'; roundRect(c, 24, y, w - 48, 80, 14); c.fill();
        c.fillStyle = '#d8e6ff'; roundRect(c, 40, y + 16, 48, 48, 10); c.fill();
        bar(104, y + 22, 160 - i * 20, '#2a3346', 16); bar(104, y + 48, 110);
        bar(w - 120, y + 30, 64, '#2a3346', 18);
      }
      c.fillStyle = '#e1e6ee'; c.fillRect(24, 606, w - 48, 2);
      bar(24, 630, 120, '#5a6578', 18); bar(w - 150, 626, 102, '#0a1e44', 26);
      c.fillStyle = BLUE; roundRect(c, 24, 700, w - 48, 80, 40); c.fill();
      c.fillStyle = '#fff'; c.font = `800 30px ${SANS}`; c.textAlign = 'center'; c.fillText('Checkout', w / 2, 741); c.textAlign = 'left';
    }
  });
}
function badgeFace(lead) {
  return canvasTex(1024, 618, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#16213a'); g.addColorStop(1, '#090e1a');
    c.fillStyle = g; roundRect(c, 4, 4, w - 8, h - 8, 40); c.fill();
    c.strokeStyle = lead ? 'rgba(127,178,255,0.55)' : 'rgba(255,255,255,0.14)'; c.lineWidth = 4; c.stroke();
    c.textBaseline = 'middle';
    c.fillStyle = lead ? '#7fb2ff' : '#8a97b2'; c.font = `700 30px ${MONO}`; c.fillText('GENERAL MOTORS  ·  ONSTAR', 64, 92);
    if (!lead) {
      c.fillStyle = '#c3cad8'; c.font = `800 96px ${SANS}`; c.fillText('Supporting role', 64, 286);
      c.fillStyle = 'rgba(255,255,255,0.16)'; c.fillRect(64, 352, 180, 8);
      c.fillStyle = 'rgba(255,255,255,0.58)'; c.font = `600 42px ${SANS}`; c.fillText('Joined MRM  ·  July 2019', 64, 440);
    } else {
      c.fillStyle = '#ffffff'; c.font = `800 104px ${SANS}`; c.fillText('Lead designer', 64, 282);
      c.fillStyle = BLUE; c.fillRect(64, 352, 220, 8);
      c.fillStyle = 'rgba(255,255,255,0.86)'; c.font = `600 42px ${SANS}`; c.fillText('Shopping pages, cart and checkout', 64, 440);
      c.fillStyle = '#7fb2ff'; c.font = `600 32px ${SANS}`; c.fillText('By the end of the year', 64, 520);
    }
  });
}

// A chrome wire cart, every rod merged into one mesh.
function cartGeometry() {
  const R = 0.0065, parts = [];
  const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
  const seg = (a, b, r = R) => parts.push(new THREE.TubeGeometry(new THREE.LineCurve3(V(a), V(b)), 1, r, 6, false));
  const L = (a, b, p) => a.map((v, j) => lerp(v, b[j], p));
  const T = [[-0.19, 0.38, -0.14], [0.21, 0.38, -0.14], [0.21, 0.38, 0.14], [-0.19, 0.38, 0.14]];
  const B = [[-0.12, 0.15, -0.105], [0.17, 0.15, -0.105], [0.17, 0.15, 0.105], [-0.12, 0.15, 0.105]];
  for (let i = 0; i < 4; i++) {
    seg(T[i], T[(i + 1) % 4], R * 1.3); seg(B[i], B[(i + 1) % 4]); seg(T[i], B[i]);
    seg(L(T[i], B[i], 0.5), L(T[(i + 1) % 4], B[(i + 1) % 4], 0.5));
  }
  [[T[0], T[1], B[0], B[1]], [T[3], T[2], B[3], B[2]]].forEach(([t0, t1, b0, b1]) => {
    [0.2, 0.4, 0.6, 0.8].forEach((p) => seg(L(t0, t1, p), L(b0, b1, p)));
  });
  [0.33, 0.66].forEach((p) => seg(L(T[1], T[2], p), L(B[1], B[2], p)));
  [0.25, 0.5, 0.75].forEach((p) => seg(L(B[0], B[1], p), L(B[3], B[2], p)));
  seg(T[0], [-0.27, 0.48, -0.14], R * 1.3); seg(T[3], [-0.27, 0.48, 0.14], R * 1.3);
  B.forEach((b) => seg(b, [b[0], 0.05, b[2] * 0.95], R * 1.4));
  seg([-0.12, 0.05, -0.1], [0.17, 0.05, -0.1], R * 1.4); seg([-0.12, 0.05, 0.1], [0.17, 0.05, 0.1], R * 1.4);
  return mergeGeometries(parts);
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x241f3c, 6, 20);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- dusk sky and the plinth
  const dome = skyDome([[0, '#0a1230'], [0.33, '#243a78'], [0.45, '#b56a8c'], [0.495, '#ffb27a'], [0.52, '#4a3456'], [0.7, '#17152b'], [1, '#06060d']]);
  scene.add(dome);
  const sunG = glow(0xffa266, 9, 0.9, 0.18); sunG.position.set(-7, 3.8, -30); scene.add(sunG);
  const sunCore = glow(0xfff0d6, 1.8, 1, 0.32); sunCore.position.set(-7, 3.8, -29.8); scene.add(sunCore);

  const PLW = 5.4, PLD = 3.8;
  const street = canvasTex(1024, Math.round(1024 * PLD / PLW), (c, w, h) => {
    c.fillStyle = '#efebe4'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 1400; i++) { c.fillStyle = `rgba(0,0,0,${rnd(i, 21) * 0.05})`; c.fillRect(rnd(i, 22) * w, rnd(i, 23) * h, 2, 2); }
    const zy = (z) => (z + PLD / 2) / PLD * h, xx = (x) => (x + PLW / 2) / PLW * w;
    LANES.forEach((z) => {
      c.fillStyle = '#d6d1c8'; c.fillRect(0, zy(z) - 15, w, 30);
      c.strokeStyle = 'rgba(255,255,255,0.9)'; c.lineWidth = 2; c.setLineDash([14, 12]);
      c.beginPath(); c.moveTo(0, zy(z)); c.lineTo(w, zy(z)); c.stroke(); c.setLineDash([]);
    });
    [-2.32, 2.32].forEach((x) => { c.fillStyle = '#d6d1c8'; c.fillRect(xx(x) - 14, 0, 28, h); });
    c.strokeStyle = 'rgba(40,40,60,0.12)'; c.lineWidth = 2; c.strokeRect(6, 6, w - 12, h - 12);
  });
  const plinth = mesh(new RoundedBoxGeometry(PLW, 0.14, PLD, 3, 0.02), std(0xe4e0d8, { roughness: 0.9 }));
  plinth.position.y = -0.07; scene.add(plinth);
  const ground = mesh(new THREE.PlaneGeometry(PLW - 0.04, PLD - 0.04), std(0xffffff, { map: street.tex, roughness: 0.88 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; ground.position.y = 0.0005; scene.add(ground);

  // Maquette blocks around the edges: white, matte, all one draw call.
  const blocks = [];
  for (let x = -2.5; x <= 2.5; x += 0.36) for (let z = -1.75; z <= 1.75; z += 0.36) {
    if (Math.abs(x) < 2.12 && z > -1.25 && z < 0.88) continue;
    if (Math.abs(x) < 1.75 && z > 0.88) continue;
    if (LANES.some((l) => Math.abs(z - l) < 0.2) || Math.abs(Math.abs(x) - 2.32) < 0.16) continue;
    const i = blocks.length;
    if (rnd(i, 30) < 0.25) continue;
    const tall = Math.abs(x) > 2.1 && z < -1.2 && rnd(i, 31) > 0.5;
    blocks.push([x + (rnd(i, 32) - 0.5) * 0.05, z, 0.2 + rnd(i, 33) * 0.1, tall ? 0.42 + rnd(i, 34) * 0.3 : 0.04 + rnd(i, 35) * 0.22, 0.2 + rnd(i, 36) * 0.1]);
  }
  const blockGeo = new THREE.BoxGeometry(1, 1, 1); blockGeo.translate(0, 0.5, 0);
  const blockM = new THREE.InstancedMesh(blockGeo, std(0xf0ece6, { roughness: 0.92 }), blocks.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), e4 = new THREE.Euler(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  blocks.forEach(([x, z, w, h, d], i) => { m4.compose(p4.set(x, 0, z), q4.identity(), s4.set(w, h, d)); blockM.setMatrixAt(i, m4); });
  blockM.castShadow = blockM.receiveShadow = true;
  scene.add(blockM);

  // ----------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0x7d8fd0, 0x2a1f2e, 0.75); scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffa36e, 4.2);
  sun.position.set(-1.6, 1.7, -6.5); sun.target.position.set(0, 0, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -3.4, right: 3.4, top: 3.4, bottom: -3.4, near: 0.5, far: 14 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const key = new THREE.SpotLight(0xfff0e0, 0, 0, 0.36, 0.6, 1.4);
  key.position.set(1.4, 2.8, 2.9); scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6f8fff, 1.1); rim.position.set(2.6, 1.5, -2); scene.add(rim);
  const cityL = new THREE.PointLight(0x5fa0ff, 0, 4.5, 1.5); cityL.position.set(0, 0.7, -0.1); scene.add(cityL);

  // ----------------------------------------------------------- the 18 pages, each on its own lot
  const ped = new THREE.InstancedMesh(new RoundedBoxGeometry(0.44, 0.05, 0.2, 2, 0.012), std(0xe2ded6, { roughness: 0.85 }), PAGES.length);
  PAGES.forEach((p, i) => { q4.setFromEuler(e4.set(0, p.yaw, 0)); m4.compose(p4.set(p.x, 0.025, p.z), q4, s4.set(1, 1, 1)); ped.setMatrixAt(i, m4); });
  ped.castShadow = ped.receiveShadow = true; scene.add(ped);
  const bodyGeo = new RoundedBoxGeometry(PW, PH, PD, 2, 0.012); bodyGeo.translate(0, PH / 2, 0);
  const bodies = new THREE.InstancedMesh(bodyGeo, std(0x161a22, { roughness: 0.35, metalness: 0.6 }), PAGES.length);
  bodies.castShadow = true; bodies.receiveShadow = true; bodies.frustumCulled = false; scene.add(bodies);
  const scrGeo = new THREE.PlaneGeometry(PW - 0.03, PH - 0.03); scrGeo.translate(0, PH / 2, PD / 2 + 0.0015);
  const scrMats = [0, 1, 2].map((v) => new THREE.MeshBasicMaterial({ map: pageTex(v).tex, toneMapped: false }));
  const screens = scrMats.map((m) => { const s = new THREE.InstancedMesh(scrGeo, m, 6); s.frustumCulled = false; scene.add(s); return s; });
  const pglow = PAGES.map((p) => { const g = glow(0x5aa0ff, 1, 0, 0.45); g.position.set(p.x, 0.36, p.z + 0.06); g.scale.set(0.75, 1.0, 1); scene.add(g); return g; });
  // Shock rings: the badge lands and the catalog ripples out across the lots.
  const ringGeo = new THREE.RingGeometry(0.94, 1.0, 96); ringGeo.rotateX(-Math.PI / 2);
  const rings = [0, 1].map(() => { const r = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0x6fb0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false })); r.position.set(0, 0.006, -0.2); scene.add(r); return r; });
  const landG = glow(0x8cc0ff, 1.4, 0, 0.3); landG.position.set(0, 0.1, -0.2); scene.add(landG);

  // ----------------------------------------------------------- the badge: supporting role -> lead designer
  const badge = new THREE.Group(); scene.add(badge);
  const bBody = mesh(new RoundedBoxGeometry(1.0, 0.62, 0.03, 3, 0.04), new THREE.MeshPhysicalMaterial({ color: 0x0b1222, metalness: 0.4, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.08 }));
  badge.add(bBody);
  const faceGeo = new THREE.PlaneGeometry(0.97, 0.586);
  const front = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: badgeFace(false).tex, transparent: true, toneMapped: false }));
  front.position.z = 0.0165; badge.add(front);
  const backF = new THREE.Mesh(faceGeo, new THREE.MeshBasicMaterial({ map: badgeFace(true).tex, transparent: true, toneMapped: false }));
  backF.position.z = -0.0165; backF.rotation.y = Math.PI; badge.add(backF);
  const sheenT = canvasTex(512, 256, (c, w, h) => {
    c.setTransform(1, 0, -0.4, 1, 0, 0);
    const g = c.createLinearGradient(w * 0.42, 0, w * 0.6, 0);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.32)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(w * 0.42, 0, w * 0.18 + 0.4 * h, h);
  }).tex;
  const sheenM = new THREE.MeshBasicMaterial({ map: sheenT, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  [0.018, -0.018].forEach((z, i) => { const s = new THREE.Mesh(faceGeo, sheenM); s.position.z = z; if (i) s.rotation.y = Math.PI; badge.add(s); });
  const badgeG = glow(0x7fb2ff, 1.6, 0, 0.5); badgeG.position.z = -0.08; badgeG.scale.set(2.0, 1.2, 1); badge.add(badgeG);

  // ----------------------------------------------------------- catalog count
  const count = canvasTex(1024, 260);
  const countM = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.38), new THREE.MeshBasicMaterial({ map: count.tex, transparent: true, toneMapped: false, depthWrite: false }));
  countM.position.set(0, 1.0, -1.6); scene.add(countM);
  let cKey = '';
  const drawCount = (n) => {
    const key2 = String(n); if (key2 === cKey) return; cKey = key2;
    count.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      const g = c.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(6,10,24,0)'); g.addColorStop(0.2, 'rgba(6,10,24,0.6)'); g.addColorStop(0.8, 'rgba(6,10,24,0.6)'); g.addColorStop(1, 'rgba(6,10,24,0)');
      c.fillStyle = g; c.fillRect(0, 0, w, h);
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = ICE; c.font = `700 32px ${MONO}`; c.fillText('A NEW CATALOG  ·  PLANS, ADD-ONS, PRICES', w / 2, 58);
      c.fillStyle = '#fff'; c.font = `800 116px ${SANS}`; c.fillText(n >= 18 ? '18+ PAGES' : `${n} PAGES`, w / 2, 166);
    });
  };
  drawCount(0);

  // ----------------------------------------------------------- the plan card, the cart and checkout
  const planT = canvasTex(384, 224, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; roundRect(c, 3, 3, w - 6, h - 6, 22); c.fill();
    c.strokeStyle = BLUE; c.lineWidth = 6; c.stroke();
    c.fillStyle = BLUE; c.fillRect(3, 30, 12, h - 60);
    c.textBaseline = 'middle';
    c.fillStyle = '#0a1e44'; c.font = `800 40px ${SANS}`; c.fillText('Plan', 36, 52);
    c.fillStyle = '#d5dbe6'; roundRect(c, 36, 92, 200, 14, 7); c.fill(); roundRect(c, 36, 118, 150, 14, 7); c.fill();
    c.fillStyle = '#2a3346'; roundRect(c, w - 132, 36, 62, 30, 15); c.fill();
    c.fillStyle = '#5a6578'; c.font = `700 24px ${SANS}`; c.fillText('/mo', w - 64, 52);
    c.fillStyle = BLUE; roundRect(c, w - 192, h - 62, 166, 42, 21); c.fill();
    c.fillStyle = '#fff'; c.font = `700 22px ${SANS}`; c.textAlign = 'center'; c.fillText('Add to cart', w - 109, h - 40); c.textAlign = 'left';
  }).tex;
  const plan = new THREE.Mesh(new THREE.PlaneGeometry(0.27, 0.158), new THREE.MeshBasicMaterial({ map: planT, transparent: true, toneMapped: false, side: THREE.DoubleSide }));
  scene.add(plan);
  const planG = glow(0x8cc0ff, 0.6, 0, 0.35); scene.add(planG);

  const cart = new THREE.Group(); scene.add(cart);
  const chrome = std(0xdfe3ea, { metalness: 1, roughness: 0.2, envMapIntensity: 1.3 });
  cart.add(mesh(cartGeometry(), chrome));
  const grip = mesh(new THREE.CapsuleGeometry(0.016, 0.26, 6, 12), std(0x1f6fe0, { roughness: 0.35 }));
  grip.rotation.x = Math.PI / 2; grip.position.set(-0.27, 0.48, 0); cart.add(grip);
  const wheelGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.022, 20); wheelGeo.rotateX(Math.PI / 2);
  const wheelM = std(0x15171c, { roughness: 0.6 });
  const wheels = [[-0.12, -0.1], [0.17, -0.1], [-0.12, 0.1], [0.17, 0.1]].map(([x, z]) => { const w = mesh(wheelGeo, wheelM); w.position.set(x, 0.035, z); cart.add(w); return w; });
  const cartGlow = glow(0xbfe0ff, 1, 0, 0.3); scene.add(cartGlow);
  const one = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.12), new THREE.MeshBasicMaterial({ map: canvasTex(128, 128, (c, w) => {
    c.fillStyle = BLUE; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 6; c.stroke();
    c.fillStyle = '#fff'; c.font = `800 76px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('1', w / 2, w / 2 + 4);
  }).tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(one);
  const pill = canvasTex(512, 128);
  const pillM = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.12), new THREE.MeshBasicMaterial({ map: pill.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(pillM);
  let pState = -1;
  const drawPill = (on) => {
    if (on === pState) return; pState = on;
    pill.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = on ? BLUE : 'rgba(8,14,30,0.82)'; roundRect(c, 4, 4, w - 8, h - 8, (h - 8) / 2); c.fill();
      c.strokeStyle = on ? '#bcd7ff' : 'rgba(255,255,255,0.5)'; c.lineWidth = 4; c.stroke();
      c.fillStyle = '#fff'; c.font = `800 52px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Checkout', 132, h / 2 + 2);
      c.beginPath(); c.arc(76, h / 2, 30, 0, 7); c.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.18)'; c.fill();
      if (on) { c.strokeStyle = BLUE; c.lineWidth = 8; c.beginPath(); c.moveTo(62, h / 2); c.lineTo(72, h / 2 + 10); c.lineTo(91, h / 2 - 11); c.stroke(); }
    });
  };
  drawPill(0);

  // ----------------------------------------------------------- night traffic
  const streaks = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }), SN);
  const warm = new THREE.Color(0xfff0d0).multiplyScalar(1.6), red = new THREE.Color(0xff2a1a).multiplyScalar(1.4);
  for (let i = 0; i < SN; i++) streaks.setColorAt(i, (i % 2) ? red : warm);
  streaks.frustumCulled = false; scene.add(streaks);

  // ----------------------------------------------------------- outcome
  const out = canvasTex(1024, 340, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(8,14,30,0.8)'; roundRect(c, 4, 4, w - 8, h - 8, 36); c.fill();
    c.strokeStyle = 'rgba(127,178,255,0.45)'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = ICE; c.font = `700 30px ${MONO}`; c.fillText('CART, THEN TRAFFIC', w / 2, 62);
    c.fillStyle = '#fff'; c.font = `800 86px ${SANS}`; c.fillText('+20,000 to 30,000', w / 2, 158);
    c.fillStyle = 'rgba(255,255,255,0.8)'; c.font = `600 36px ${SANS}`; c.fillText('more weekly views  ·  18+ pages launched', w / 2, 256);
  });
  const outM = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.332), new THREE.MeshBasicMaterial({ map: out.tex, transparent: true, toneMapped: false, depthWrite: false, depthTest: false }));
  outM.renderOrder = 10; scene.add(outM);

  // ----------------------------------------------------------- camera
  const lin = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.35, 1.5, 2.45]], [2.45, [0.15, 1.42, 2.2], lin],
    [4.9, [-0.6, 2.2, 4.2]], [6.1, [1.32, 0.8, 2.85]],
    [7.5, [1.15, 0.84, 2.98], lin], [10, [-0.25, 2.95, 4.75]],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 1.28, 0.55]], [2.45, [0, 1.24, 0.55], lin],
    [4.9, [0, 0.48, -0.35]], [6.1, [0.6, 0.32, 0.95]],
    [7.5, [0.72, 0.3, 1.02], lin], [10, [0, 0.25, -0.35]],
  ]);
  const tgt = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), M = new THREE.Vector3();
  const hero = PAGES[HERO], PLAN0 = [hero.x, 0.05 + 0.33 + 0.015, hero.z + PD / 2 + 0.004];

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.01, p[1] + Math.sin(t * 1.5 + 1) * 0.007, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [2.45, 35], [4.9, 38], [6.1, 33], [7.5, 33], [10, 38]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    camera.updateMatrixWorld();

    // Dusk into night: the sun sinks, the sky dims, the screens take over.
    const night = eio(k(t, 6.9, 8.7));
    dome.material.color.setScalar(lerp(1, 0.24, night));
    sun.intensity = lerp(4.2, 0.2, night); hemi.intensity = lerp(0.75, 0.2, night); rim.intensity = lerp(1.1, 0.45, night);
    sunG.position.y = lerp(3.8, -2.6, night); sunCore.position.y = sunG.position.y;
    sunG.material.opacity = 0.9 * (1 - night); sunCore.material.opacity = 1 - night;
    cityL.intensity = 3.2 * night;

    // Beat 1: the badge hangs in the key light, glints, and flips to Lead designer.
    const bin = back(k(t, 0.3, 0.95)), flip = back(k(t, 1.25, 1.9)), dive = eio(k(t, 2.55, 3.05));
    badge.position.set(0, lerp(1.25 - (1 - clamp(bin)) * 0.12 + Math.sin(t * 1.3) * 0.012, 0.06, dive), lerp(0.55, -0.2, dive));
    badge.rotation.set(-dive * Math.PI / 2, flip * Math.PI + Math.sin(t * 0.9) * 0.05 * (1 - dive), 0);
    badge.scale.setScalar(Math.max(0.001, clamp(bin) * lerp(1, 0.12, dive)));
    badge.visible = t > 0.3 && dive < 0.999;
    sheenT.offset.x = t < 1.4 ? lerp(0.9, -1.0, k(t, 0.55, 1.1)) : lerp(0.9, -1.0, k(t, 1.75, 2.3));
    badgeG.material.opacity = 0.35 * clamp(bin) + 0.6 * Math.exp(-6 * Math.max(0, t - 1.85)) * (t > 1.75 ? 1 : 0);
    const flash = t > 1.8 ? Math.exp(-5 * (t - 1.8)) : 0;
    const cartBeat = k(t, 5.3, 5.9) * (1 - k(t, 7.6, 8.2));
    key.intensity = 22 * clamp(bin) * (1 - k(t, 2.5, 3.2)) + 26 * flash + 20 * cartBeat;
    key.target.position.set(lerp(0, 0.75, k(t, 4.5, 5.6)), lerp(1.25, 0.3, k(t, 2.5, 5.6)), lerp(0.55, 1.1, k(t, 4.5, 5.6)));

    // Beat 2: it lands, the catalog ripples out, and 18 pages rise from their lots.
    rings.forEach((r, i) => {
      const rp = k(t, 3.0 + i * 0.18, 3.9 + i * 0.18);
      r.scale.setScalar(0.05 + eo(rp) * 3.1); r.material.opacity = 0.85 * (1 - rp) * (rp > 0 ? 1 : 0); r.visible = rp > 0 && rp < 1;
    });
    landG.material.opacity = t > 3.0 ? 0.9 * Math.exp(-4 * (t - 3.0)) : 0;
    let risen = 0;
    const scrBright = lerp(0.8, 1.0, night);
    scrMats.forEach((m) => m.color.setScalar(scrBright));
    PAGES.forEach((pg, i) => {
      const s = back(k(t, RISE[i], RISE[i] + 0.45));
      if (t > RISE[i] + 0.12) risen++;
      q4.setFromEuler(e4.set(0, pg.yaw, 0));
      m4.compose(p4.set(pg.x, 0.05, pg.z), q4, s4.set(1, Math.max(0.001, s), 1));
      bodies.setMatrixAt(i, m4);
      screens[i % 3].setMatrixAt(Math.floor(i / 3), m4);
      const burst = t > RISE[i] ? Math.exp(-4 * (t - RISE[i])) : 0;
      pglow[i].material.opacity = (lerp(0.1, 0.5, night) + 0.6 * burst) * clamp(s);
      pglow[i].visible = s > 0.01;
    });
    bodies.instanceMatrix.needsUpdate = true;
    screens.forEach((s) => { s.instanceMatrix.needsUpdate = true; });
    drawCount(risen);
    const cin = eo(k(t, 3.05, 3.5)), cout = ei(k(t, 5.2, 5.7));
    countM.lookAt(camera.position);
    countM.material.opacity = cin * (1 - cout); countM.visible = cin > 0.01 && cout < 1;
    countM.position.y = 1.0 + (1 - cin) * 0.08;

    // Beat 3: the cart drops in, a plan card peels off the plans page into it, it counts one, checks out.
    const roll = ei(k(t, 7.45, 8.7)), rx = roll * 2.7;
    const drop = spring(k(t, 5.35, 6.05));
    cart.position.set(CART[0] + rx, (1 - drop) * 0.9, CART[2]);
    cart.rotation.set(0, lerp(-0.35, 0, eio(k(t, 7.15, 7.5))) + (1 - drop) * 0.4, (1 - drop) * 0.15);
    cart.visible = t > 5.35 && rx < 2.4;
    wheels.forEach((w) => { w.rotation.z = -rx / 0.035; });
    const speed = 3 * Math.pow(k(t, 7.45, 8.7), 2) * (rx < 2.4 ? 1 : 0);
    cartGlow.position.set(cart.position.x - 0.35, 0.06, CART[2]); cartGlow.scale.set(0.2 + speed * 0.5, 0.06, 1);
    cartGlow.material.opacity = 0.8 * clamp(speed);
    const lift = back(k(t, 5.95, 6.25)), fly = eio(k(t, 6.2, 6.75));
    A.set(PLAN0[0], PLAN0[1] + 0.03 * lift, PLAN0[2] + 0.12 * lift);
    B.set(CART[0] + 0.02, 0.24, CART[2]);
    M.set(lerp(A.x, B.x, 0.5) - 0.05, 0.8, lerp(A.z, B.z, 0.5));
    const f1 = 1 - fly;
    plan.position.set(f1 * f1 * A.x + 2 * f1 * fly * M.x + fly * fly * B.x + rx, f1 * f1 * A.y + 2 * f1 * fly * M.y + fly * fly * B.y, f1 * f1 * A.z + 2 * f1 * fly * M.z + fly * fly * B.z);
    plan.rotation.set(-fly * Math.PI / 2 + Math.sin(Math.PI * fly) * 0.4, -0.35 * fly, Math.sin(Math.PI * fly) * 0.3);
    plan.scale.setScalar(lerp(1 + 0.15 * clamp(lift), 0.85, fly));
    plan.visible = t > 5.95 && rx < 2.4;
    planG.position.copy(plan.position); planG.material.opacity = 0.9 * Math.sin(Math.PI * fly) + 0.5 * clamp(lift) * (1 - fly);
    planG.visible = plan.visible;
    const onePop = back(k(t, 6.7, 7.0)), badgeOut = ei(k(t, 7.4, 7.7));
    one.position.set(cart.position.x + 0.2, 0.55, CART[2] + 0.12); one.lookAt(camera.position);
    one.scale.setScalar(Math.max(0.001, onePop * (1 - badgeOut)));
    one.visible = onePop > 0.01 && badgeOut < 1;
    const pPop = back(k(t, 6.95, 7.25));
    drawPill(t > 7.2 ? 1 : 0);
    pillM.position.set(cart.position.x - 0.02, 0.72 + (1 - clamp(pPop)) * -0.05, CART[2]); pillM.lookAt(camera.position);
    pillM.scale.setScalar(Math.max(0.001, pPop * (1 - badgeOut)));
    pillM.material.opacity = clamp(pPop) * (1 - badgeOut); pillM.visible = pPop > 0.01 && badgeOut < 1;

    // Beat 4: night falls and the streets fill with traffic.
    for (let i = 0; i < SN; i++) {
      const lane = LANES[Math.floor(i / 20)], dir = (i % 2) ? -1 : 1, L = 5.6;
      const len = 0.14 + rnd(i, 41) * 0.18, sp = 0.9 + rnd(i, 42) * 0.8;
      const x = ((((rnd(i, 43) * L + dir * sp * t) % L) + L) % L) - L / 2;
      const edge = clamp((2.72 - Math.abs(x)) / 0.4);
      const on = clamp((t - 7.55 - rnd(i, 44) * 1.0) / 0.3);
      const sc = Math.max(0.001, len * edge * on);
      m4.compose(p4.set(x, 0.012, lane + dir * 0.055), q4.identity(), s4.set(sc, on > 0 ? 0.01 : 0.001, on > 0 ? 0.02 : 0.001));
      streaks.setMatrixAt(i, m4);
    }
    streaks.instanceMatrix.needsUpdate = true;
    streaks.visible = t > 7.5;

    const oin = back(k(t, 8.15, 8.6)), oout = ei(k(t, 9.35, 9.6));
    outM.position.set(0, 0.24 - (1 - clamp(oin)) * 0.04, -2.0).applyMatrix4(camera.matrixWorld);
    outM.quaternion.copy(camera.quaternion);
    outM.scale.setScalar(Math.max(0.001, lerp(0.92, 1, clamp(oin))));
    outM.material.opacity = clamp(oin) * (1 - oout); outM.visible = oin > 0.01 && oout < 1;
  }

  return { scene, camera, update, duration: D, poster: 8.9 };
}
