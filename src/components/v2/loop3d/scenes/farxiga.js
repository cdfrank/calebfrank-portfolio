// AstraZeneca Farxiga landing pages lit loop, 10 s. "A campaign page that keeps its required panel in view."
// A quiet teal gallery at first light: one tall window throws a warm shaft across a stone plinth. On the
// plinth a phone shows the campaign landing page. The page scrolls, but its pinned panel stays put, lifting
// off the glass as the content slides beneath it. Four review seals then drop one by one into a brass rail
// and light up as each review clears; the page returns to its hero, a gold ring pulses out from the phone,
// and the project's name settles beside it. Kept abstract on purpose: no product, health or efficacy copy.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const TEAL = '#1f8a8f', TEAL_HEX = 0x2fb3b0, GOLD = '#e8b45a', GOLD_HEX = 0xe8b45a, PAGE = '#ece6dc';
const DROP = [4.3, 4.85, 5.4, 5.95];            // each review seal drops into the rail
const SLOT_Y = [1.4, 1.12, 0.84, 0.56];
const APPROVE = 6.95;

// The page's scroll position in page px, deterministic in t.
const scrollAt = (t) => kf(t, [[2.0, 0], [3.9, 1180], [4.15, 1150], [6.55, 1150], [7.35, 0]]);

// Seal icons, drawn in a 256 px face: a cross, a balance, a stamped sheet, a diamond.
function sealFace(c, w, i, done) {
  const g = c.createRadialGradient(w * 0.38, w * 0.34, 8, w / 2, w / 2, w / 2);
  g.addColorStop(0, '#f6dc9c'); g.addColorStop(0.7, '#d29c45'); g.addColorStop(1, '#8a5f22');
  c.fillStyle = g; c.beginPath(); c.arc(w / 2, w / 2, w / 2, 0, 7); c.fill();
  c.strokeStyle = 'rgba(70,45,10,0.55)'; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 22, 0, 7); c.stroke();
  for (let j = 0; j < 48; j++) { const a = j / 48 * Math.PI * 2; c.fillStyle = 'rgba(70,45,10,0.35)'; c.beginPath(); c.arc(w / 2 + Math.cos(a) * (w / 2 - 11), w / 2 + Math.sin(a) * (w / 2 - 11), 3, 0, 7); c.fill(); }
  c.save(); c.translate(w / 2, w / 2); c.strokeStyle = '#3a270a'; c.fillStyle = '#3a270a'; c.lineWidth = 10; c.lineCap = 'round'; c.lineJoin = 'round';
  if (i === 0) { c.fillRect(-12, -46, 24, 92); c.fillRect(-46, -12, 92, 24); }
  else if (i === 1) { c.beginPath(); c.moveTo(0, -48); c.lineTo(0, 40); c.moveTo(-28, 44); c.lineTo(28, 44); c.moveTo(-50, -30); c.lineTo(50, -30); c.stroke(); [-40, 40].forEach((x) => { c.beginPath(); c.moveTo(x - 20, 6); c.quadraticCurveTo(x, 26, x + 20, 6); c.closePath(); c.fill(); c.beginPath(); c.moveTo(x, -30); c.lineTo(x - 18, 6); c.moveTo(x, -30); c.lineTo(x + 18, 6); c.lineWidth = 4; c.stroke(); c.lineWidth = 10; }); }
  else if (i === 2) { c.lineWidth = 8; roundRect(c, -36, -48, 72, 96, 8); c.stroke(); [-24, -6, 12].forEach((y) => { c.beginPath(); c.moveTo(-20, y); c.lineTo(20, y); c.stroke(); }); c.beginPath(); c.arc(22, 34, 16, 0, 7); c.fill(); }
  else { c.beginPath(); c.moveTo(0, -50); c.lineTo(44, -10); c.lineTo(0, 50); c.lineTo(-44, -10); c.closePath(); c.stroke(); c.beginPath(); c.moveTo(-44, -10); c.lineTo(44, -10); c.moveTo(-18, -10); c.lineTo(0, 50); c.lineTo(18, -10); c.lineWidth = 5; c.stroke(); }
  c.restore();
  if (done) {
    c.fillStyle = TEAL; c.beginPath(); c.arc(w - 58, w - 58, 40, 0, 7); c.fill();
    c.strokeStyle = '#f4f1ea'; c.lineWidth = 6; c.stroke();
    c.lineWidth = 11; c.lineCap = 'round'; c.lineJoin = 'round'; c.beginPath(); c.moveTo(w - 76, w - 58); c.lineTo(w - 62, w - 44); c.lineTo(w - 38, w - 72); c.stroke();
  }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071315);
  scene.fog = new THREE.Fog(0x071315, 4.5, 12);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- gallery room
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#27302e', { size: 256, speck: 0.08, blot: 0.12, seed: 23, repeat: 6 }), roughness: 0.55, metalness: 0.1 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wall = mesh(new THREE.PlaneGeometry(12, 6), std(0xffffff, { map: grainTex('#102629', { size: 256, speck: 0.05, blot: 0.12, seed: 29, repeat: 4 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 2.6, -2.3); scene.add(wall);
  // The tall window and the shaft of warm light it throws across the room.
  const WIN = new THREE.Vector3(-1.75, 1.7, -2.28);
  const win = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 2.3), new THREE.MeshBasicMaterial({ color: 0xffd9a8, toneMapped: false }));
  win.position.copy(WIN); scene.add(win);
  const WIN_COL = new THREE.Color(0xffd9a8);
  const winGlow = glow(0xffb870, 1, 0.5, 0.45); winGlow.position.copy(WIN).add(new THREE.Vector3(0, 0, 0.05)); winGlow.scale.set(1.3, 3.4, 1); scene.add(winGlow);
  const LDIR = new THREE.Vector3(2.6, -2.1, 1.3).normalize();
  const POOL = WIN.clone().addScaledVector(LDIR, WIN.y / -LDIR.y);
  const shaftTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.85)'); g.addColorStop(0.6, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const s = c.createLinearGradient(0, 0, w, 0); s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.3, 'rgba(0,0,0,0)'); s.addColorStop(0.7, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const shaftLen = WIN.distanceTo(POOL);
  const shaft = new THREE.Mesh(new THREE.PlaneGeometry(0.55, shaftLen), new THREE.MeshBasicMaterial({ map: shaftTex, color: 0xffb877, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  {
    const mid = WIN.clone().add(POOL).multiplyScalar(0.5);
    const yA = WIN.clone().sub(POOL).normalize();
    const toCam = new THREE.Vector3(0, 1.0, 3.4).sub(mid);
    const zA = toCam.sub(yA.clone().multiplyScalar(toCam.dot(yA))).normalize();
    const xA = new THREE.Vector3().crossVectors(yA, zA);
    shaft.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(xA, yA, zA));
    shaft.position.copy(mid);
  }
  scene.add(shaft);
  const poolTex = canvasTex(128, 64, (c, w, h) => { const g = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.6), new THREE.MeshBasicMaterial({ map: poolTex, color: 0xffb877, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.set(-Math.PI / 2, 0, -Math.atan2(LDIR.z, LDIR.x)); pool.position.set(POOL.x, 0.004, POOL.z); scene.add(pool);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5f8f8c, 0x0a0f0e, 0.3));
  const sun = new THREE.DirectionalLight(0xffc690, 0);
  sun.position.copy(LDIR).multiplyScalar(-5).add(new THREE.Vector3(0.2, 0.7, 0)); sun.target.position.set(0.2, 0.7, 0);
  sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
  Object.assign(sun.shadow.camera, { left: -1.8, right: 1.8, top: 1.8, bottom: -1.8, near: 1, far: 10 });
  sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);
  const fill = new THREE.SpotLight(0xd8ebe8, 9, 0, 0.7, 0.9, 1.4);
  fill.position.set(1.4, 2.2, 3.0); fill.target.position.set(0.2, 0.8, 0); scene.add(fill, fill.target);
  const rim = new THREE.DirectionalLight(TEAL_HEX, 1.3); rim.position.set(2.4, 1.6, -2.4); scene.add(rim);

  // ----------------------------------------------------------- plinth, phone and its stand
  const stone = std(0xffffff, { map: grainTex('#56675f', { size: 256, speck: 0.12, blot: 0.1, seed: 33, repeat: 2 }), roughness: 0.75 });
  const plinth = mesh(new RoundedBoxGeometry(1.4, 0.34, 0.78, 3, 0.03), stone); plinth.position.set(0.32, 0.17, 0); scene.add(plinth);
  const lip = mesh(new RoundedBoxGeometry(1.44, 0.025, 0.82, 2, 0.01), std(0x8e7a52, { metalness: 0.9, roughness: 0.35 })); lip.position.set(0.32, 0.352, 0); scene.add(lip);
  const ph = phone({ w: 0.62, h: 1.28, d: 0.05, frame: 0x24292b, r: 0.08 });
  ph.position.set(0.12, 1.0, 0.02); ph.rotation.x = -0.07; scene.add(ph);
  const standM = std(0x8e7a52, { metalness: 0.9, roughness: 0.32 });
  const stand = mesh(new THREE.BoxGeometry(0.3, 0.5, 0.012), standM); stand.position.set(0.12, 0.6, -0.08); stand.rotation.x = 0.28; scene.add(stand);
  const ledge = mesh(new THREE.BoxGeometry(0.42, 0.03, 0.08), standM); ledge.position.set(0.12, 0.38, 0.03); scene.add(ledge);
  const { sw, sh, d: pd } = ph.userData;
  const UW = Math.round(1024 * sw / sh), UH = 1024;
  const ui = canvasTex(UW, UH);
  ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.needsUpdate = true;
  const screenGlow = glow(0x9fe0dc, 1.8, 0, 0.5); screenGlow.position.z = -0.12; screenGlow.scale.set(1.3, 2.2, 1); ph.add(screenGlow);

  // The landing page: hero, content, footer. Shapes only, no copy.
  function drawPage(c, w, h, scroll, boot) {
    c.fillStyle = '#05090a'; c.fillRect(0, 0, w, h);
    if (boot <= 0) return;
    c.globalAlpha = boot;
    c.fillStyle = PAGE; c.fillRect(0, 0, w, h);
    c.save(); c.translate(0, -scroll);
    // Hero
    const hg = c.createLinearGradient(0, 0, w, 760); hg.addColorStop(0, '#0d4f55'); hg.addColorStop(0.65, '#1f7a77'); hg.addColorStop(1, '#d99a4a');
    c.fillStyle = hg; c.fillRect(0, 0, w, 760);
    c.globalAlpha = boot * 0.35;
    for (let i = 0; i < 6; i++) { c.strokeStyle = i % 2 ? '#ffe3b3' : '#bff0ea'; c.lineWidth = 3 + i; c.beginPath(); c.moveTo(-40, 520 - i * 46); c.bezierCurveTo(w * 0.3, 380 - i * 70, w * 0.7, 700 - i * 40, w + 40, 430 - i * 60); c.stroke(); }
    c.globalAlpha = boot;
    c.fillStyle = '#f4efe6'; c.font = `800 62px ${SANS}`; c.textBaseline = 'alphabetic'; c.fillText('Farxiga', 36, 250);
    c.fillStyle = 'rgba(244,239,230,0.9)'; roundRect(c, 36, 290, w - 110, 22, 11); c.fill(); roundRect(c, 36, 326, w - 170, 22, 11); c.fill();
    c.fillStyle = GOLD; roundRect(c, 36, 400, 200, 60, 30); c.fill();
    c.fillStyle = 'rgba(244,239,230,0.5)'; roundRect(c, 254, 400, 150, 60, 30); c.fill();
    // Three feature tiles
    for (let i = 0; i < 3; i++) {
      const y = 800 + i * 190;
      c.fillStyle = '#f7f3ec'; roundRect(c, 28, y, w - 56, 166, 20); c.fill();
      c.fillStyle = i === 1 ? '#d99a4a' : '#1f7a77'; c.beginPath(); c.arc(92, y + 83, 40, 0, 7); c.fill();
      c.fillStyle = '#2b3a3a'; roundRect(c, 156, y + 50, 220, 18, 9); c.fill();
      c.fillStyle = '#8a9696'; roundRect(c, 156, y + 84, w - 220, 12, 6); c.fill(); roundRect(c, 156, y + 106, w - 260, 12, 6); c.fill();
    }
    // Long text and an image block
    for (let i = 0; i < 9; i++) { c.fillStyle = '#7d8a89'; roundRect(c, 36, 1400 + i * 30, (w - 72) * (0.7 + rnd(i, 5) * 0.3), 12, 6); c.fill(); }
    const ig = c.createLinearGradient(0, 1700, w, 2000); ig.addColorStop(0, '#2c6e6c'); ig.addColorStop(1, '#e2b06a');
    c.fillStyle = ig; roundRect(c, 28, 1700, w - 56, 300, 22); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.beginPath(); c.arc(w * 0.7, 1820, 70, 0, 7); c.fill();
    for (let i = 0; i < 5; i++) { c.fillStyle = '#7d8a89'; roundRect(c, 36, 2040 + i * 30, (w - 72) * (0.6 + rnd(i, 9) * 0.4), 12, 6); c.fill(); }
    c.fillStyle = '#163235'; c.fillRect(0, 2220, w, 400);
    c.restore();
    // Status bar stays fixed at the top
    c.fillStyle = 'rgba(5,20,22,0.35)'; c.fillRect(0, 0, w, 44);
    c.fillStyle = '#f4efe6'; roundRect(c, 24, 15, 54, 14, 7); c.fill(); roundRect(c, w - 70, 15, 46, 14, 7); c.fill();
    c.globalAlpha = 1;
  }
  let uiKey = '';
  function drawUI(t) {
    const boot = eo(k(t, 0.5, 1.2)), sc = Math.round(scrollAt(t));
    const key = Math.round(boot * 30) + '|' + sc;
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => drawPage(c, w, h, sc, boot));
  }

  // The pinned panel: its own layer over the bottom of the screen, so it can lift off the glass.
  const pinTex = canvasTex(512, Math.round(512 * 0.27 / (sw - 0.004)), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#f7f2e9';
    c.beginPath(); c.moveTo(0, 18); c.arcTo(0, 0, 18, 0, 18); c.lineTo(w - 18, 0); c.arcTo(w, 0, w, 18, 18);
    c.lineTo(w, h - 74); c.arcTo(w, h, w - 74, h, 74); c.lineTo(74, h); c.arcTo(0, h, 0, h - 74, 74); c.closePath(); c.fill();
    c.fillStyle = TEAL; c.fillRect(0, 0, w, 7);
    c.fillStyle = 'rgba(31,138,143,0.18)'; roundRect(c, w / 2 - 36, 16, 72, 8, 4); c.fill();
    c.fillStyle = TEAL; c.beginPath(); c.arc(54, 66, 24, 0, 7); c.fill();
    c.fillStyle = '#f7f2e9'; c.fillRect(51, 54, 6, 6); c.fillRect(51, 64, 6, 16);
    c.fillStyle = '#25393a'; roundRect(c, 92, 56, 220, 18, 9); c.fill();
    for (let i = 0; i < 5; i++) { c.fillStyle = '#7d8a89'; roundRect(c, 32, 108 + i * 26, (w - 64) * (0.75 + rnd(i, 13) * 0.25), 10, 5); c.fill(); }
  }).tex;
  const PINH = 0.27;
  const pin = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.004, PINH), new THREE.MeshBasicMaterial({ map: pinTex, color: 0xd9d9d9, transparent: true, toneMapped: false, depthWrite: false }));
  pin.renderOrder = 2; ph.add(pin);
  const pinGlow = glow(TEAL_HEX, 1, 0, 0.45); pinGlow.scale.set(0.9, 0.5, 1); ph.add(pinGlow);
  const pinEdge = new THREE.Mesh(new THREE.PlaneGeometry(sw - 0.03, 0.006), new THREE.MeshBasicMaterial({ color: 0x5fe0d6, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  pinEdge.renderOrder = 3; ph.add(pinEdge);

  // ----------------------------------------------------------- review rail and the four seals
  const RAIL_X = 0.86;
  const rail = mesh(new RoundedBoxGeometry(0.05, 1.22, 0.04, 2, 0.015), std(0x8e7a52, { metalness: 0.95, roughness: 0.3 })); rail.position.set(RAIL_X, 0.98, -0.05); scene.add(rail);
  const railFoot = mesh(new RoundedBoxGeometry(0.22, 0.03, 0.18, 2, 0.01), std(0x8e7a52, { metalness: 0.95, roughness: 0.3 })); railFoot.position.set(RAIL_X, 0.38, -0.05); scene.add(railFoot);
  const sockets = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.108, 0.108, 0.012, 40), std(0x101a1b, { roughness: 0.4, metalness: 0.6 }), 4);
  const M4 = new THREE.Matrix4(), Q4 = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0));
  SLOT_Y.forEach((y, i) => { M4.compose(new THREE.Vector3(RAIL_X, y, -0.022), Q4, new THREE.Vector3(1, 1, 1)); sockets.setMatrixAt(i, M4); });
  sockets.castShadow = true; sockets.receiveShadow = true; scene.add(sockets);
  const goldM = std(GOLD_HEX, { metalness: 1, roughness: 0.26 });
  const seals = DROP.map((at, i) => {
    const g = new THREE.Group(); scene.add(g);
    const edge = mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.026, 48), goldM); edge.rotation.x = Math.PI / 2; g.add(edge);
    const tx = canvasTex(256, 256, (c, w) => sealFace(c, w, i, false));
    const faceM = std(0xffffff, { map: tx.tex, metalness: 0.55, roughness: 0.35, emissive: 0xffffff, emissiveMap: tx.tex, emissiveIntensity: 0 });
    const face = mesh(new THREE.CircleGeometry(0.088, 48), faceM, { cast: false }); face.position.z = 0.0135; g.add(face);
    const gl = glow(GOLD_HEX, 0.5, 0, 0.4); gl.position.z = -0.02; g.add(gl);
    return { g, tx, faceM, gl, at, i, done: false };
  });

  // ----------------------------------------------------------- the approval ring and the words
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.008, 8, 96), new THREE.MeshBasicMaterial({ color: 0xffd48a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  ring.position.set(0.12, 1.0, -0.06); scene.add(ring);
  const halo = glow(GOLD_HEX, 1, 0, 0.5); halo.position.set(0.12, 1.0, -0.12); halo.scale.set(1.4, 2.2, 1); scene.add(halo);
  const title = label('Farxiga landing pages', { font: `800 64px ${SANS}`, fg: '#f3eee4', h: 0.15, pad: 12, track: 1 });
  const client = label('AstraZeneca', { font: `700 56px ${MONO}`, fg: GOLD, h: 0.095, pad: 8, track: 3 });
  const line = label('Campaign landing experience in a regulated category.', { font: `600 44px ${SANS}`, fg: '#b9cfcb', h: 0.08, pad: 8, track: 0 });
  scene.add(title, client, line);
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width, LWd = line.geometry.parameters.width;

  // ----------------------------------------------------------- dust in the shaft
  const DN = 150, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd3a0, size: 0.012, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-1.25, 0.74, 3.5]], [2.0, [-0.5, 1.02, 3.1]],
    [4.2, [0.62, 1.06, 2.9]], [6.5, [0.95, 1.08, 3.0], (x) => x],
    [8.1, [-0.22, 1.06, 3.5]], [10, [-0.32, 1.08, 3.7], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.1, 0.94, 0]], [2.0, [0.14, 1.0, 0]],
    [4.2, [0.32, 0.98, 0]], [6.5, [0.5, 0.98, 0], (x) => x],
    [8.1, [-0.24, 0.92, 0]], [10, [-0.24, 0.92, 0], (x) => x],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.007, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 33], [2.0, 31], [6.5, 30], [8.1, 32.5], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // First light: the window brightens and the shaft fills in.
    const dawn = eo(k(t, 0.05, 1.6));
    sun.intensity = 2.5 * dawn;
    shaft.material.opacity = 0.2 * dawn * (0.9 + 0.1 * Math.sin(t * 1.3));
    pool.material.opacity = 0.42 * dawn;
    winGlow.material.opacity = 0.5 * dawn;
    win.material.color.copy(WIN_COL).multiplyScalar(lerp(0.25, 1, dawn));
    dust.material.opacity = 0.6 * dawn;

    // Screen boots, then the page scrolls under the pinned panel and comes back to the hero.
    const boot = eo(k(t, 0.5, 1.2));
    ph.userData.screen.material.color.setScalar(lerp(0.03, 0.78, boot));
    screenGlow.material.opacity = 0.2 * boot;
    ph.userData.sheen.position.x = Math.sin(t * 0.5) * 0.05;
    drawUI(t);
    const scrolling = Math.sin(Math.PI * k(t, 1.9, 4.3)), back2 = Math.sin(Math.PI * k(t, 6.45, 7.45));
    const liftP = Math.max(eio(k(t, 1.9, 2.4)) * (1 - eio(k(t, 6.9, 7.5))), 0);
    pin.position.set(0, -sh / 2 + PINH / 2 + 0.002, pd / 2 + 0.008 + liftP * 0.07);
    pin.material.opacity = boot;
    pin.scale.setScalar(1 + liftP * 0.03);
    pinEdge.position.set(0, pin.position.y + PINH / 2 * pin.scale.y - 0.003, pin.position.z + 0.001);
    pinEdge.material.opacity = 0.9 * Math.max(scrolling, back2) * boot;
    pinGlow.position.set(0, pin.position.y, pin.position.z - 0.02);
    pinGlow.material.opacity = 0.35 * liftP * boot;

    // Reviews: each seal drops into its socket with a spring, then lights and takes its check.
    seals.forEach((s) => {
      const d = spring(k(t, s.at, s.at + 0.6));
      const y = SLOT_Y[s.i];
      s.g.position.set(RAIL_X, y + (1 - d) * 1.3, 0.0 + (1 - clamp(d)) * 0.15);
      s.g.rotation.set(0, (1 - clamp(d)) * 2.4, (1 - clamp(d)) * 0.5);
      s.g.visible = t > s.at;
      const lit = k(t, s.at + 0.32, s.at + 0.5);
      const done = lit > 0;
      if (done !== s.done) { s.done = done; s.tx.redraw((c, w) => sealFace(c, w, s.i, done)); }
      const flash = done ? Math.exp(-5 * Math.max(0, t - s.at - 0.32)) : 0;
      const app = Math.exp(-3 * Math.max(0, t - APPROVE - s.i * 0.08)) * (t > APPROVE + s.i * 0.08 ? 1 : 0);
      s.faceM.emissiveIntensity = 0.12 * lit + 0.6 * flash + 0.4 * app;
      s.gl.material.opacity = 0.25 * lit + 0.7 * flash + 0.5 * app;
      s.gl.scale.setScalar(0.42 + 0.25 * flash + 0.2 * app);
    });

    // Approval: a gold ring pulses out from the phone.
    const r = k(t, APPROVE, APPROVE + 1.1);
    ring.scale.setScalar(lerp(1.15, 1.8, eo(r)));
    ring.material.opacity = 0.9 * Math.sin(Math.PI * r) * (r > 0 ? 1 : 0);
    ring.lookAt(camera.position);
    halo.material.opacity = 0.32 * Math.exp(-2.5 * Math.max(0, t - APPROVE)) * (t > APPROVE ? 1 : 0) + 0.08 * k(t, APPROVE, APPROVE + 1) * (1 - k(t, 9.2, 9.6));

    // The project's name settles beside the phone.
    const ci = back(k(t, 7.25, 7.8)), ti = back(k(t, 7.4, 7.95)), li = eo(k(t, 7.7, 8.3)), out = ei(k(t, 9.15, 9.6));
    const tx = -0.88;
    title.position.set(tx, 1.06 + (1 - clamp(ti)) * -0.06, 0.25);
    title.lookAt(camera.position.x, title.position.y, camera.position.z);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(tx - TWd / 2 + CWd / 2 + 0.01, 1.24 + (1 - clamp(ci)) * -0.05, 0.25);
    client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;
    line.position.set(tx - TWd / 2 + LWd / 2 + 0.01, 0.92 + (1 - li) * -0.03, 0.25);
    line.quaternion.copy(title.quaternion);
    line.material.opacity = li * (1 - out); line.visible = line.material.opacity > 0.01;

    // Dust turning in the shaft.
    for (let i = 0; i < DN; i++) {
      const s = rnd(i, 61), off = 0.22;
      dpos[i * 3] = lerp(WIN.x, POOL.x, s) + (rnd(i, 62) - 0.5) * off * 2 + Math.sin(t * 0.3 + i) * 0.05;
      dpos[i * 3 + 1] = lerp(WIN.y, 0.05, s) + Math.sin(t * 0.4 + i * 1.3) * 0.04 + (rnd(i, 63) - 0.5) * 0.2;
      dpos[i * 3 + 2] = lerp(WIN.z, POOL.z, s) + (rnd(i, 64) - 0.5) * off + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.2 };
}
