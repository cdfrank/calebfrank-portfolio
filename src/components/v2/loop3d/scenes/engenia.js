// BASF Agriculture Engenia herbicide site lit loop, 10 s. "Seven sites become one, and it keeps up."
// The office corner of a steel machine shed before dawn: corrugated walls, a work lamp over the bench,
// a big wall display, and the roll-up door open on a soybean field going blue. Seven glowing microsite
// panes hang in the air around the display, each its own colour and layout. One by one they wind up,
// arc in and dock into the display as tiles of one site, which lights its hero: ONE SITE. Then the
// guidance section takes over: a fresh label sheet sweeps in from the right and presses into the page,
// the old one slides away, and the guidance steps from V1 to V2; a second sheet takes it to V3, each
// step checking off in turn. Sunrise comes through the door as the camera pulls back to the title.
// Kept to the summary idea on purpose: no product, use or safety copy.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip, skyDome, sway,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const MINT = '#9fe0c8', LEAF = '#7fd36a';
// The seven microsites: colour, where each pane hangs [x, y, z], and its own tilt.
const SITES = [
  { c: '#2f9a8a', at: [-1.45, 2.24, -0.6] },
  { c: '#d98a3a', at: [-1.72, 1.6, -0.22] },
  { c: '#4a7fd0', at: [-1.2, 1.1, 0.18] },
  { c: '#9a6ad0', at: [1.45, 2.2, -0.55] },
  { c: '#d0564e', at: [1.72, 1.56, -0.2] },
  { c: '#86b23e', at: [1.22, 1.08, 0.2] },
  { c: '#d4b23a', at: [0.05, 2.66, -0.5] },
];
const ORDER = [0, 3, 1, 4, 2, 5, 6];             // which pane leaves first; tile slot = place in this list
const DEP0 = 1.5, DEP_GAP = 0.22, FLY = 0.55;
const MERGE = DEP0 + DEP_GAP * 6 + FLY;           // last pane docks: the site comes together
const TV = [4.9, 6.5];                            // the two label updates land: V2, then V3
// The display and its canvas.
const SC = new THREE.Vector3(0, 1.75, -1.11), SW = 1.7, SHT = SW * 10 / 16, CW = 1024, CH = 640;
const toScreen = (px, py, out = new THREE.Vector3()) => out.set(SC.x + (px / CW - 0.5) * SW, SC.y - (py / CH - 0.5) * SHT, SC.z + 0.012);
// Canvas layout: seven tiles left, guidance panel right, the label slot inside it.
const TILE = (i) => { const col = i % 4, row = Math.floor(i / 4); return [32 + col * 138, 324 + row * 150, 126, 138]; };
const GP = [600, 324, 392, 288];
const SLOT = [850, 414, 120, 170];

// A label sheet: cream page, green band, rule lines, a check once it is current.
function drawDoc(c, x, y, w, h, n, fresh) {
  const s = w / 120;
  c.fillStyle = '#e6dfcc'; roundRect(c, x, y, w, h, 8 * s); c.fill();
  c.fillStyle = '#2f7d5a'; roundRect(c, x, y, w, 30 * s, 8 * s); c.fill(); c.fillRect(x, y + 16 * s, w, 14 * s);
  c.fillStyle = '#f4f1e6'; c.font = `800 ${Math.round(17 * s)}px ${MONO}`; c.textBaseline = 'middle'; c.fillText('LABEL', x + 10 * s, y + 16 * s);
  for (let j = 0; j < 7; j++) {
    c.fillStyle = j % 3 === 0 ? '#59625c' : '#9a9f96';
    roundRect(c, x + 10 * s, y + (44 + j * 16) * s, (w - 20 * s) * (0.55 + rnd(j, n * 7 + 3) * 0.45), 6 * s, 3 * s); c.fill();
  }
  if (fresh > 0) {
    c.save(); c.globalAlpha *= fresh;
    c.fillStyle = '#5fbf4a'; c.beginPath(); c.arc(x + w - 20 * s, y + h - 20 * s, 13 * s, 0, 7); c.fill();
    c.strokeStyle = '#f4f1e6'; c.lineWidth = 3.5 * s; c.lineCap = 'round'; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(x + w - 26 * s, y + h - 20 * s); c.lineTo(x + w - 21 * s, y + h - 15 * s); c.lineTo(x + w - 13 * s, y + h - 25 * s); c.stroke();
    c.restore();
  }
}

// One microsite pane: its own header colour and layout, no words.
function drawSite(c, w, h, i, col) {
  c.fillStyle = '#0d171b'; c.fillRect(0, 0, w, h);
  c.fillStyle = col; c.fillRect(0, 0, w, 30);
  c.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(c, 12, 10, 60, 10, 5); c.fill();
  for (let j = 0; j < 3; j++) { c.fillStyle = 'rgba(255,255,255,0.45)'; roundRect(c, w - 40 - j * 34, 12, 26, 6, 3); c.fill(); }
  const heroH = 60 + rnd(i, 2) * 30;
  const g = c.createLinearGradient(0, 30, w, 30 + heroH); g.addColorStop(0, col); g.addColorStop(1, '#16262b');
  c.fillStyle = g; c.fillRect(0, 30, w, heroH);
  c.fillStyle = 'rgba(255,255,255,0.8)'; roundRect(c, 16, 44, 110 + rnd(i, 3) * 60, 12, 6); c.fill();
  roundRect(c, 16, 62, 70 + rnd(i, 4) * 50, 8, 4); c.fill();
  const y0 = 40 + heroH, cols = 2 + (i % 2);
  for (let q = 0; q < cols; q++) {
    const bw = (w - 16 - cols * 10) / cols;
    c.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(c, 10 + q * (bw + 10), y0, bw, h - y0 - 12, 6); c.fill();
    c.fillStyle = col; c.globalAlpha = 0.8; roundRect(c, 18 + q * (bw + 10), y0 + 10, bw * 0.4, 8, 4); c.fill(); c.globalAlpha = 1;
    for (let r = 0; r < 3; r++) { c.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(c, 18 + q * (bw + 10), y0 + 28 + r * 13, bw * (0.5 + rnd(r + q * 3, i) * 0.4), 5, 2.5); c.fill(); }
  }
}

// The unified site's hero: a dawn field with crop rows running to the horizon.
function drawHero(c, w, h) {
  const HZ = h * 0.62;
  const sky = c.createLinearGradient(0, 0, 0, HZ); sky.addColorStop(0, '#12303c'); sky.addColorStop(0.6, '#2c6a68'); sky.addColorStop(1, '#e3a55e');
  c.fillStyle = sky; c.fillRect(0, 0, w, HZ);
  const sun = c.createRadialGradient(w * 0.66, HZ, 4, w * 0.66, HZ, 120); sun.addColorStop(0, 'rgba(255,226,170,0.95)'); sun.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = sun; c.fillRect(0, 0, w, HZ);
  const gr = c.createLinearGradient(0, HZ, 0, h); gr.addColorStop(0, '#355c2c'); gr.addColorStop(1, '#1b3320');
  c.fillStyle = gr; c.fillRect(0, HZ, w, h - HZ);
  const vx = w * 0.66;
  for (let j = -14; j <= 14; j++) {
    c.strokeStyle = `rgba(140,190,90,${0.25 + 0.3 * (1 - Math.abs(j) / 14)})`; c.lineWidth = 3;
    c.beginPath(); c.moveTo(vx, HZ); c.lineTo(vx + j * 120, h); c.stroke();
  }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1220);
  scene.fog = new THREE.Fog(0x0c1426, 7, 26);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);
  const uT = { value: 0 };
  const V = (x, y, z) => new THREE.Vector3(x, y, z);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), e4 = new THREE.Euler();

  // ----------------------------------------------------------- outside: the sky and the field
  const sky = skyDome([[0, '#081028'], [0.3, '#16264e'], [0.44, '#3c4f7e'], [0.49, '#d98a52'], [0.505, '#5a3a32'], [1, '#0e0b0b']], 45);
  scene.add(sky);
  const SKY_A = new THREE.Color(0.38, 0.42, 0.62), SKY_B = new THREE.Color(1, 0.95, 0.9);
  const sunDisc = glow(0xffc27a, 7, 0, 0.2); sunDisc.material.fog = false; scene.add(sunDisc);
  const sunCore = glow(0xfff0d0, 1.6, 0, 0.35); sunCore.material.fog = false; scene.add(sunCore);
  const soil = mesh(new THREE.PlaneGeometry(60, 40), std(0xffffff, { map: grainTex('#1d1712', { size: 256, speck: 0.12, blot: 0.1, seed: 5, repeat: 14 }), roughness: 1 }), { cast: false });
  soil.rotation.x = -Math.PI / 2; soil.position.set(6, -0.005, -21.2); scene.add(soil);
  const bushG = new THREE.IcosahedronGeometry(0.16, 0); bushG.scale(1, 0.62, 1); bushG.translate(0, 0.09, 0);
  const rowsP = [];
  for (let x = -0.5; x <= 13; x += 0.42) for (let z = -2.4; z > -22; z -= 0.34) rowsP.push([x + (rnd(x * 5, z) - 0.5) * 0.08, z + (rnd(z * 3, x) - 0.5) * 0.12]);
  const soy = new THREE.InstancedMesh(bushG, sway(std(0x3f6a2e, { roughness: 0.85 }), uT, 0.12), rowsP.length);
  rowsP.forEach(([x, z], i) => { m4.compose(p4.set(x, 0, z), q4.setFromEuler(e4.set(0, rnd(i, 7) * 6, 0)), s4.setScalar(0.8 + rnd(i, 8) * 0.5)); soy.setMatrixAt(i, m4); });
  soy.receiveShadow = true; scene.add(soy);

  // ----------------------------------------------------------- the shed
  const floor = mesh(new THREE.PlaneGeometry(14, 8), std(0xffffff, { map: grainTex('#2a2e33', { size: 256, speck: 0.1, blot: 0.12, seed: 17, repeat: 7 }), roughness: 0.55, metalness: 0.12 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 2.8); scene.add(floor);
  // Corrugated steel: a drawn normal map gives the ribs real light and shade.
  const ribs = canvasTex(64, 4, (c, w, h) => {
    for (let x = 0; x < w; x++) {
      const nx = Math.sin((x / w) * Math.PI * 2) * 0.75, nz = Math.sqrt(1 - nx * nx);
      c.fillStyle = `rgb(${Math.round(128 + 127 * nx)},128,${Math.round(128 + 127 * nz)})`; c.fillRect(x, 0, 1, h);
    }
  }).tex;
  ribs.colorSpace = THREE.NoColorSpace; ribs.wrapS = ribs.wrapT = THREE.RepeatWrapping;
  const steelTex = grainTex('#46505a', { size: 256, speck: 0.08, blot: 0.16, seed: 21 });
  const DOOR = [1.35, 3.15, 2.5], WZ = -1.2;
  [[-6, DOOR[0], 0, 4.4], [DOOR[1], 7, 0, 4.4], [DOOR[0], DOOR[1], DOOR[2], 4.4]].forEach(([x0, x1, y0, y1]) => {
    const n = ribs.clone(); n.needsUpdate = true; n.repeat.set((x1 - x0) / 0.12, 1);
    const st = steelTex.clone(); st.needsUpdate = true; st.repeat.set((x1 - x0) / 3, (y1 - y0) / 3);
    const w = mesh(new THREE.PlaneGeometry(x1 - x0, y1 - y0), std(0xffffff, { map: st, normalMap: n, normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.5, metalness: 0.55 }));
    w.position.set((x0 + x1) / 2, (y0 + y1) / 2, WZ); scene.add(w);
  });
  const trimM = std(0x2b3036, { roughness: 0.45, metalness: 0.8 });
  [[DOOR[0] - 0.04, DOOR[2] / 2, 0.08, DOOR[2]], [DOOR[1] + 0.04, DOOR[2] / 2, 0.08, DOOR[2]], [(DOOR[0] + DOOR[1]) / 2, DOOR[2] + 0.04, DOOR[1] - DOOR[0] + 0.16, 0.08]]
    .forEach(([x, y, w, h]) => { const b = mesh(new THREE.BoxGeometry(w, h, 0.14), trimM); b.position.set(x, y, WZ + 0.02); scene.add(b); });
  const drum = mesh(new THREE.CylinderGeometry(0.17, 0.17, DOOR[1] - DOOR[0] + 0.1, 24), std(0x56606a, { roughness: 0.4, metalness: 0.7 }));
  drum.rotation.z = Math.PI / 2; drum.position.set((DOOR[0] + DOOR[1]) / 2, DOOR[2] + 0.2, WZ + 0.16); scene.add(drum);

  // ----------------------------------------------------------- the bench and its few honest things
  const woodM = std(0xffffff, { map: grainTex('#4a3423', { size: 256, speck: 0.1, blot: 0.14, seed: 9, repeat: 2 }), roughness: 0.55 });
  const benchTop = mesh(new RoundedBoxGeometry(2.7, 0.06, 0.6, 2, 0.012), woodM); benchTop.position.set(0, 0.87, -0.86); scene.add(benchTop);
  const legM = std(0x30353b, { roughness: 0.4, metalness: 0.8 });
  const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.84, 0.05), legM, 4);
  [[-1.28, -0.6], [1.28, -0.6], [-1.28, -1.12], [1.28, -1.12]].forEach(([x, z], i) => { m4.compose(p4.set(x, 0.42, z), q4.identity(), s4.set(1, 1, 1)); legs.setMatrixAt(i, m4); });
  legs.castShadow = legs.receiveShadow = true; scene.add(legs);
  const shelf = mesh(new THREE.BoxGeometry(2.56, 0.03, 0.5), legM); shelf.position.set(0, 0.22, -0.86); scene.add(shelf);
  const thermos = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.27, 24), std(0x2f5a4a, { roughness: 0.35, metalness: 0.6 })); thermos.position.set(-1.0, 1.035, -0.8); scene.add(thermos);
  const cap = mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.06, 24), std(0x1c1f22, { roughness: 0.5 })); cap.position.set(-1.0, 1.2, -0.8); scene.add(cap);
  const pot = mesh(new THREE.CylinderGeometry(0.075, 0.06, 0.12, 24), std(0x9a5a3a, { roughness: 0.8 })); pot.position.set(1.02, 0.96, -0.84); scene.add(pot);
  const leafG = new THREE.SphereGeometry(0.035, 10, 6); leafG.scale(1, 0.25, 1.5);
  const leaves = new THREE.InstancedMesh(leafG, std(0x4f8a34, { roughness: 0.6 }), 9);
  for (let i = 0; i < 9; i++) {
    const a = (i / 3 | 0) * 2.1 + 0.3, s = i % 3, r = 0.04 + s * 0.012;
    m4.compose(p4.set(1.02 + Math.cos(a + (s - 1) * 0.7) * r * 1.4, 1.1 + (i / 3 | 0) * 0.035 + s * 0.006, -0.84 + Math.sin(a + (s - 1) * 0.7) * r * 1.4), q4.setFromEuler(e4.set(0.3, -(a + (s - 1) * 0.7), 0)), s4.set(1, 1, 1));
    leaves.setMatrixAt(i, m4);
  }
  leaves.castShadow = true; scene.add(leaves);

  // ----------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0x3f5888, 0x0a0c10, 0.36); scene.add(hemi);
  const LAMP = V(-1.3, 2.5, 0.25), LAMP_T = V(-0.15, 1.0, -0.9);
  const lamp = new THREE.SpotLight(0xffb46c, 24, 0, 0.66, 0.6, 1.3);
  lamp.position.copy(LAMP); lamp.target.position.copy(LAMP_T);
  lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024); lamp.shadow.bias = -0.0004; lamp.shadow.normalBias = 0.02;
  lamp.shadow.camera.near = 0.5; lamp.shadow.camera.far = 7;
  scene.add(lamp, lamp.target);
  const shade = mesh(new THREE.ConeGeometry(0.15, 0.17, 28, 1, true), std(0x1e2a24, { roughness: 0.4, metalness: 0.7, side: THREE.DoubleSide }), { cast: false, receive: false });
  shade.position.copy(LAMP).addScaledVector(V(0, 0, 0).subVectors(LAMP, LAMP_T).normalize(), 0.05);
  shade.quaternion.setFromUnitVectors(V(0, 1, 0), V(0, 0, 0).subVectors(LAMP, LAMP_T).normalize()); scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 10), new THREE.MeshBasicMaterial({ color: 0xffd6a0, toneMapped: false })); bulb.position.copy(LAMP); scene.add(bulb);
  const bulbGlow = glow(0xffb46c, 0.7, 0.55, 0.35); bulbGlow.position.copy(LAMP); scene.add(bulbGlow);
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, 2, 6), std(0x111111), { cast: false }); cord.position.set(LAMP.x, LAMP.y + 1.05, LAMP.z); scene.add(cord);
  // The display spills its own colour onto the bench.
  const spill = new THREE.SpotLight(0x7fd8c8, 0, 4, 1.05, 1, 1.5);
  spill.position.set(0, 1.75, -0.95); spill.target.position.set(0, 0.7, 0.4); scene.add(spill, spill.target);
  const rim = new THREE.DirectionalLight(0x6f9cff, 1.1); rim.position.set(3, 2.6, -3); scene.add(rim);
  const RIM_A = new THREE.Color(0x6f9cff), RIM_B = new THREE.Color(0xffa860);
  // Sunrise through the roll-up door: the wall's shadow cuts the light into a long warm patch.
  const SUN_DIR = V(-3.2, -3.6, 5.2).normalize();
  const sun = new THREE.DirectionalLight(0xff9c50, 0);
  sun.target.position.set(0.8, 0, 0.6); sun.position.copy(sun.target.position).addScaledVector(SUN_DIR, -9);
  sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.03;
  Object.assign(sun.shadow.camera, { left: -3.6, right: 3.6, top: 3.6, bottom: -3.6, near: 1, far: 18 });
  scene.add(sun, sun.target);

  // ----------------------------------------------------------- the wall display
  const frame = mesh(new RoundedBoxGeometry(SW + 0.1, SHT + 0.1, 0.06, 3, 0.02), std(0x111417, { roughness: 0.35, metalness: 0.6 }));
  frame.position.set(SC.x, SC.y, SC.z - 0.035); scene.add(frame);
  const ui = canvasTex(CW, CH);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SHT), new THREE.MeshBasicMaterial({ map: ui.tex, toneMapped: false }));
  screen.position.copy(SC); scene.add(screen);
  const screenGlow = glow(0x6fd0c0, 1, 0, 0.5); screenGlow.position.set(SC.x, SC.y, SC.z - 0.06); screenGlow.scale.set(SW * 2.0, SHT * 2.2, 1); scene.add(screenGlow);
  const hero = canvasTex(CW, 236, drawHero).cv;

  let uiKey = '';
  function drawScreen(t) {
    const boot = eo(k(t, 0.35, 1.0));
    const pops = ORDER.map((_, j) => back(k(t, DEP0 + j * DEP_GAP + FLY, DEP0 + j * DEP_GAP + FLY + 0.3)));
    const merged = eo(k(t, MERGE + 0.05, MERGE + 0.55)), gp = eo(k(t, MERGE + 0.3, MERGE + 0.8));
    const ver = 1 + (t >= TV[0] ? 1 : 0) + (t >= TV[1] ? 1 : 0);
    const tvLast = ver > 1 ? TV[ver - 2] : -9;
    const swap = eio(k(t, tvLast, tvLast + 0.4)), inA = ver > 1 ? eo(k(t, tvLast - 0.02, tvLast + 0.14)) : 1;
    const chip = ver > 1 ? back(k(t, tvLast, tvLast + 0.35)) : back(k(t, MERGE + 0.5, MERGE + 0.85));
    const fill = eo(k(t, tvLast, tvLast + 0.45));
    const key = [boot, merged, gp, swap, inA, chip, fill].map((x) => Math.round(x * 24)).join(',') + '|' + pops.map((x) => Math.round(x * 20)).join(',') + '|' + ver;
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      c.globalAlpha = 1; c.fillStyle = '#05090b'; c.fillRect(0, 0, w, h);
      if (boot <= 0) return;
      c.globalAlpha = boot;
      c.fillStyle = '#0f1c21'; c.fillRect(0, 0, w, h);
      // Nav bar.
      c.fillStyle = '#0a1418'; c.fillRect(0, 0, w, 64);
      c.setLineDash([10, 8]); c.lineWidth = 2; c.strokeStyle = 'rgba(159,224,200,0.22)';
      if (merged < 1) { c.strokeRect(24, 16, 170, 32); c.strokeRect(24, 80, w - 48, 222); }
      c.setLineDash([]);
      if (merged > 0) {
        c.globalAlpha = boot * merged;
        c.fillStyle = '#eef4ee'; c.font = `800 34px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Engenia', 32, 33);
        for (let j = 0; j < 4; j++) { c.fillStyle = 'rgba(238,244,238,0.4)'; roundRect(c, w - 420 + j * 100, 26, 76, 12, 6); c.fill(); }
        // Hero: the field at dawn and the line the whole job comes down to.
        c.drawImage(hero, 0, 64 + (1 - merged) * 20);
        c.fillStyle = 'rgba(5,14,16,0.35)'; c.fillRect(0, 64, w * 0.55, 236);
        c.fillStyle = '#f2f6ef'; c.font = `900 76px ${SANS}`; c.textBaseline = 'alphabetic';
        c.fillText('ONE SITE', 40 - (1 - merged) * 40, 210);
        c.fillStyle = LEAF; roundRect(c, 42, 232, 150 * merged, 8, 4); c.fill();
        c.globalAlpha = boot;
      }
      // The seven tiles, each filled by the pane that docked there.
      ORDER.forEach((si, j) => {
        const [x, y, tw, th] = TILE(j), p = pops[j];
        if (p <= 0.001) { c.setLineDash([8, 7]); c.strokeStyle = 'rgba(159,224,200,0.25)'; c.lineWidth = 2; c.strokeRect(x + 2, y + 2, tw - 4, th - 4); c.setLineDash([]); return; }
        c.save(); c.translate(x + tw / 2, y + th / 2); c.scale(p, p);
        c.fillStyle = SITES[si].c; roundRect(c, -tw / 2, -th / 2, tw, th, 12); c.fill();
        c.fillStyle = 'rgba(8,18,20,0.35)'; roundRect(c, -tw / 2, th / 2 - 52, tw, 52, 12); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.88)'; roundRect(c, -tw / 2 + 12, -th / 2 + 14, tw * 0.5, 10, 5); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.5)'; roundRect(c, -tw / 2 + 12, th / 2 - 38, tw * 0.7, 7, 3.5); c.fill(); roundRect(c, -tw / 2 + 12, th / 2 - 24, tw * 0.45, 7, 3.5); c.fill();
        c.restore();
      });
      // Label and use guidance.
      if (gp > 0) {
        const [gx0, gy, gw, gh] = GP, gx = gx0 + (1 - gp) * 70;
        c.globalAlpha = boot * gp;
        c.fillStyle = '#132a30'; roundRect(c, gx, gy, gw, gh, 16); c.fill();
        c.strokeStyle = 'rgba(159,224,200,0.35)'; c.lineWidth = 2; roundRect(c, gx, gy, gw, gh, 16); c.stroke();
        c.fillStyle = MINT; c.font = `700 22px ${MONO}`; c.textBaseline = 'middle'; c.fillText('LABEL & USE GUIDANCE', gx + 22, gy + 34);
        // Version chip.
        const cs = clamp(chip, 0, 1.3);
        c.save(); c.translate(gx + gw - 52, gy + 34); c.scale(cs, cs);
        c.fillStyle = ver === 3 ? LEAF : '#e0a24a'; roundRect(c, -34, -20, 68, 40, 20); c.fill();
        c.fillStyle = '#0c1a1e'; c.font = `800 24px ${MONO}`; c.textAlign = 'center'; c.fillText('V' + ver, 0, 2); c.textAlign = 'left';
        c.restore();
        // Three steps: each fills and checks off as its version lands.
        const sx = (n) => gx + 46 + n * 84, sy = gy + 118;
        c.strokeStyle = 'rgba(159,224,200,0.25)'; c.lineWidth = 4; c.beginPath(); c.moveTo(sx(0), sy); c.lineTo(sx(2), sy); c.stroke();
        c.strokeStyle = LEAF; c.beginPath(); c.moveTo(sx(0), sy); c.lineTo(sx(0) + 84 * (ver - 2 + fill) * (ver > 1 ? 1 : 0), sy); c.stroke();
        for (let n = 0; n < 3; n++) {
          const done = n + 1 < ver || (n + 1 === ver), grow = n + 1 === ver ? (ver === 1 ? 1 : fill) : 1;
          c.fillStyle = done ? LEAF : '#1d3a40'; c.beginPath(); c.arc(sx(n), sy, done ? 15 + 4 * Math.sin(Math.PI * grow) * (n + 1 === ver && ver > 1 ? 1 : 0) : 15, 0, 7); c.fill();
          if (done) {
            c.strokeStyle = '#0c1a1e'; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
            c.beginPath(); c.moveTo(sx(n) - 7, sy); c.lineTo(sx(n) - 2, sy + 5); c.lineTo(sx(n) + 7, sy - 6); c.stroke();
          } else { c.strokeStyle = 'rgba(159,224,200,0.4)'; c.lineWidth = 2; c.beginPath(); c.arc(sx(n), sy, 15, 0, 7); c.stroke(); }
          c.fillStyle = done ? '#e9f2ea' : 'rgba(233,242,234,0.45)'; c.font = `700 18px ${MONO}`; c.textAlign = 'center'; c.fillText('V' + (n + 1), sx(n), sy + 36); c.textAlign = 'left';
        }
        for (let j = 0; j < 4; j++) { c.fillStyle = j === 0 ? 'rgba(233,242,234,0.7)' : 'rgba(233,242,234,0.28)'; roundRect(c, gx + 24, gy + 196 + j * 20, 196 * (0.6 + rnd(j, ver) * 0.4), 8, 4); c.fill(); }
        // The label slot: the old sheet slides away as the new one lands.
        const [lx0, ly, lw, lh] = SLOT, lx = lx0 + (gx - gx0);
        if (ver > 1 && swap < 1) { c.globalAlpha = boot * gp * (1 - swap); drawDoc(c, lx - 80 * swap, ly + 26 * swap, lw, lh, ver - 1, 0); }
        c.globalAlpha = boot * gp * inA; drawDoc(c, lx, ly, lw, lh, ver, ver > 1 ? eo(k(t, tvLast + 0.15, tvLast + 0.45)) : 0);
        c.globalAlpha = boot;
      }
    });
  }

  // ----------------------------------------------------------- the seven microsite panes
  const paneGeo = new RoundedBoxGeometry(0.48, 0.32, 0.018, 2, 0.008);
  const paneM = std(0x0c1316, { roughness: 0.18, metalness: 0.55 });
  const panes = SITES.map((s, i) => {
    const g = new THREE.Group();
    g.add(mesh(paneGeo, paneM, { receive: false }));
    const tex = canvasTex(320, 208, (c, w, h) => drawSite(c, w, h, i, s.c)).tex;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.29), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, transparent: true }));
    face.position.z = 0.0095; g.add(face);
    const halo = glow(new THREE.Color(s.c), 1, 0, 0.45); halo.scale.set(0.85, 0.6, 1); halo.position.z = -0.05; g.add(halo);
    scene.add(g);
    const j = ORDER.indexOf(i), dep = DEP0 + j * DEP_GAP;
    const home = V(...s.at), rot = [(rnd(i, 4) - 0.5) * 0.16, -s.at[0] * 0.22, (rnd(i, 5) - 0.5) * 0.14];
    const [tx, ty, tw, th] = TILE(j);
    const dock = toScreen(tx + tw / 2, ty + th / 2);
    return { g, face, halo, home, rot, dep, arr: dep + FLY, dock, sx: (tw / CW * SW) / 0.48, sy: (th / CH * SHT) / 0.32, i, col: new THREE.Color(s.c) };
  });
  const bobAt = (pn, t, out) => out.copy(pn.home).add(p4.set(Math.sin(t * 1.2 + pn.i * 1.7) * 0.012, Math.sin(t * 1.4 + pn.i) * 0.03, 0));
  const pA = V(0, 0, 0), pC = V(0, 0, 0);

  // ----------------------------------------------------------- the two label sheets
  const sheets = [0, 1].map((j) => {
    const g = new THREE.Group();
    const body = mesh(new RoundedBoxGeometry(0.3, 0.425, 0.006, 2, 0.003), std(0xcfc8b4, { roughness: 0.85 }));
    g.add(body);
    const tex = canvasTex(240, 340, (c, w, h) => { c.clearRect(0, 0, w, h); drawDoc(c, 0, 0, w, h, j + 2, 1); }).tex;
    const face = mesh(new THREE.PlaneGeometry(0.296, 0.42), std(0xffffff, { map: tex, roughness: 0.7, transparent: true, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }), { cast: false });
    face.position.z = 0.0035; g.add(face);
    const trail = glow(0xbff0c8, 1, 0, 0.4); trail.scale.set(0.7, 0.8, 1); trail.position.z = -0.04; g.add(trail);
    scene.add(g);
    return { g, trail, t0: TV[j] - 0.9 };
  });
  const SLOTW = toScreen(SLOT[0] + SLOT[2] / 2, SLOT[1] + SLOT[3] / 2);
  const HOVER = SLOTW.clone().add(V(0.22, 0.04, 0.72));
  const SHEET0 = V(2.7, 2.15, 0.9);
  const slotFlash = glow(0xc8ffd8, 1, 0, 0.45); slotFlash.position.copy(SLOTW).add(V(0, 0, 0.03)); slotFlash.scale.set(0.5, 0.6, 1); scene.add(slotFlash);

  // ----------------------------------------------------------- the merge ring
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.46, 0.48, 96), new THREE.MeshBasicMaterial({ color: 0xbff7e2, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  ring.position.set(SC.x, SC.y, SC.z + 0.03); scene.add(ring);

  // ----------------------------------------------------------- title
  const kicker = label('BASF Agriculture', { font: `700 56px ${MONO}`, fg: MINT, h: 0.11, track: 4 });
  const title = label('Engenia herbicide site', { font: `800 72px ${SANS}`, fg: '#f4efe6', h: 0.19, track: 1 });
  const line = label('7 microsites into 1', { font: `600 54px ${SANS}`, fg: '#f2c48e', bg: 'rgba(10,16,22,0.7)', h: 0.12, pad: 30 });
  [kicker, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });
  // Framed against the final camera, so the words sit in the empty floor space left of centre.
  const finalCam = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 60);
  finalCam.position.set(1.12, 1.46, 3.55); finalCam.lookAt(0.12, 1.55, -0.8); finalCam.updateMatrixWorld();
  const inView = (sx, sy, depth) => { const v = V(sx, sy, 0.5).unproject(finalCam).sub(finalCam.position).normalize(); return finalCam.position.clone().addScaledVector(v, depth); };
  const TW = title.geometry.parameters.width, KW = kicker.geometry.parameters.width, LW = line.geometry.parameters.width;
  const TPOS = inView(-0.2, -0.55, 3.0);

  // ----------------------------------------------------------- dust in the sunbeam
  const DN = 160, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffc98e, size: 0.014, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);
  const beamDir = SUN_DIR.clone();

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.62, 1.55, 4.15]], [1.45, [0.45, 1.6, 3.8], L],
    [MERGE, [0.1, 1.72, 2.95]],
    [4.3, [0.78, 1.64, 1.95]], [6.9, [0.9, 1.6, 1.72], L],
    [8.25, [1.1, 1.46, 3.5]], [10, [1.14, 1.46, 3.6], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.0, 1.66, -0.6]], [1.45, [0.0, 1.68, -0.62], L],
    [MERGE, [0.0, 1.74, -1.0]],
    [4.3, [0.42, 1.56, -1.1]], [6.9, [0.46, 1.54, -1.1], L],
    [8.25, [0.12, 1.55, -0.8]], [10, [0.12, 1.55, -0.8], L],
  ]);
  const tgt = V(0, 0, 0), lk = V(0, 0, 0), tmp = V(0, 0, 0);
  const COL = new THREE.Color();

  function update(t) {
    uT.value = t;
    const p = camPos(t), q = camTgt(t);
    const thud = TV.reduce((a, tv) => a + (t > tv ? Math.exp(-14 * (t - tv)) : 0), 0);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005 - thud * 0.006 * Math.sin(t * 60), p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 38], [MERGE, 36], [4.3, 33], [6.9, 32.5], [8.25, 36], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Sunrise: the sky lifts, the sun clears the horizon, light pours through the door.
    const rise = eio(k(t, 3.2, 8.8));
    sky.material.color.copy(SKY_A).lerp(SKY_B, rise);
    sun.intensity = 3.4 * rise;
    sun.color.setRGB(1, lerp(0.5, 0.66, rise), lerp(0.25, 0.4, rise));
    sunDisc.position.set(12, lerp(-1.6, 0.7, rise), -30); sunDisc.material.opacity = 0.85 * eo(k(t, 2.8, 6.5));
    sunCore.position.set(12, lerp(-1.6, 0.7, rise), -29.8); sunCore.material.opacity = eo(k(t, 4.2, 7.5));
    rim.color.copy(RIM_A).lerp(RIM_B, rise); rim.intensity = 1.1 + 0.5 * rise;
    hemi.intensity = 0.34 + 0.12 * rise;
    scene.fog.color.setRGB(lerp(0.047, 0.2, rise), lerp(0.078, 0.14, rise), lerp(0.15, 0.13, rise));
    lamp.intensity = 24 - 6 * rise;

    // The panes hang and breathe, then wind up and dock into the display one by one.
    const boot = eo(k(t, 0.35, 1.0));
    panes.forEach((pn) => {
      const on = eo(k(t, 0.3 + pn.i * 0.09, 0.75 + pn.i * 0.09));
      const flick = on < 1 ? 0.6 + 0.4 * Math.sin(t * 40 + pn.i * 3) : 1;
      pn.face.material.color.setScalar(lerp(0.05, 0.82, on) * flick);
      const wind = Math.sin(Math.PI * k(t, pn.dep - 0.28, pn.dep));
      const e = eio(k(t, pn.dep, pn.arr));
      if (e <= 0) {
        bobAt(pn, t, pn.g.position);
        pn.g.position.z -= 0.07 * wind; pn.g.position.y += 0.02 * wind;
        pn.g.rotation.set(pn.rot[0] + Math.sin(t * 0.8 + pn.i) * 0.03, pn.rot[1] + Math.sin(t * 0.6 + pn.i * 2) * 0.04, pn.rot[2] + Math.sin(t * 0.9 + pn.i * 2) * 0.03 - 0.06 * wind);
        pn.g.scale.setScalar(1 + 0.05 * wind);
      } else {
        bobAt(pn, pn.dep, pA);
        pC.copy(pA).add(pn.dock).multiplyScalar(0.5).add(p4.set(0, 0.32, 0.65));
        const u = 1 - e;
        pn.g.position.set(u * u * pA.x + 2 * u * e * pC.x + e * e * pn.dock.x, u * u * pA.y + 2 * u * e * pC.y + e * e * pn.dock.y, u * u * pA.z + 2 * u * e * pC.z + e * e * pn.dock.z);
        pn.g.rotation.set(pn.rot[0] * u, pn.rot[1] * u + Math.sin(Math.PI * e) * 0.5 * Math.sign(pn.home.x || 1), pn.rot[2] * u);
        pn.g.scale.set(lerp(1, pn.sx, e), lerp(1, pn.sy, e), lerp(1, 0.3, e));
      }
      pn.g.visible = t < pn.arr;
      pn.halo.material.opacity = (0.28 * on + 0.5 * Math.sin(Math.PI * e)) * (1 - 0.6 * e);
    });

    // The display: the site assembles, lights its hero, then the guidance updates.
    drawScreen(t);
    const flash = panes.reduce((a, pn) => a + (t > pn.arr ? Math.exp(-8 * (t - pn.arr)) : 0), 0);
    const mergeF = t > MERGE ? Math.exp(-3.5 * (t - MERGE)) : 0;
    const merged = eo(k(t, MERGE, MERGE + 0.6));
    screen.material.color.setScalar(lerp(0.04, 0.62, boot) + 0.1 * merged + 0.18 * Math.min(1, flash) + 0.15 * mergeF);
    screenGlow.material.opacity = 0.1 * boot + 0.12 * merged + 0.25 * Math.min(1, flash) + 0.35 * mergeF;
    spill.intensity = (2.5 * boot + 2.5 * merged + 4 * Math.min(1, flash) + 5 * mergeF + 3 * thud);
    spill.color.copy(COL.setRGB(0.5, 0.85, 0.78)).lerp(COL.setRGB(0.95, 0.85, 0.65), 0.35 * merged);
    const rp = k(t, MERGE, MERGE + 0.9);
    ring.scale.setScalar(lerp(0.4, 2.1, eo(rp)));
    ring.material.opacity = 0.85 * Math.sin(Math.PI * rp) * (rp > 0 ? 1 : 0);
    ring.visible = rp > 0 && rp < 1;

    // The label sheets: sweep in from the right, square up to camera, then press into the slot.
    sheets.forEach((sh, j) => {
      const a = eo(k(t, sh.t0, sh.t0 + 0.55)), b = ei(k(t, sh.t0 + 0.68, sh.t0 + 0.9));
      tmp.copy(SHEET0).lerp(HOVER, a); tmp.y += Math.sin(Math.PI * a) * 0.18;
      tmp.lerp(SLOTW, b);
      sh.g.position.copy(tmp);
      sh.g.position.y += (1 - b) * Math.sin(t * 2.2 + j) * 0.01 * a;
      sh.g.rotation.set(lerp(-0.5, -0.08, a) * (1 - b) + Math.sin(t * 5 + j) * 0.04 * (1 - a), lerp(-1.4, -0.05, a) * (1 - b), lerp(0.5, 0.06, a) * (1 - b));
      const sc = lerp(1, (SLOT[2] / CW * SW) / 0.3, b);
      sh.g.scale.set(sc, lerp(1, (SLOT[3] / CH * SHT) / 0.425, b), 1);
      sh.g.visible = t > sh.t0 && t < sh.t0 + 0.9;
      sh.trail.material.opacity = 0.55 * Math.sin(Math.PI * k(t, sh.t0, sh.t0 + 0.9));
    });
    slotFlash.material.opacity = 0.75 * thud + 0.35 * (t > TV[1] ? Math.exp(-2.2 * (t - TV[1])) : 0);
    slotFlash.scale.set(0.5 + 0.4 * thud, 0.6 + 0.4 * thud, 1);

    // Title: settles into the open floor while the sun comes in.
    const ki = back(k(t, 7.7, 8.25)), ti = back(k(t, 7.85, 8.4)), li = eo(k(t, 8.1, 8.7)), out = ei(k(t, 9.2, 9.55));
    lk.copy(camera.position);
    title.position.set(TPOS.x, TPOS.y + (1 - clamp(ti)) * -0.05, TPOS.z); title.lookAt(lk);
    kicker.position.copy(title.position).add(tmp.set(0, 0.17 + (1 - clamp(ki)) * -0.04, 0)); kicker.quaternion.copy(title.quaternion);
    kicker.position.addScaledVector(tmp.set(1, 0, 0).applyQuaternion(title.quaternion), -(TW - KW) / 2 + 0.01);
    line.position.copy(title.position).add(tmp.set(0, -0.19 - (1 - li) * 0.03, 0)); line.quaternion.copy(title.quaternion);
    line.position.addScaledVector(tmp.set(1, 0, 0).applyQuaternion(title.quaternion), -(TW - LW) / 2 + 0.01);
    [[kicker, ki], [title, ti], [line, li]].forEach(([l, al]) => { l.material.opacity = clamp(al) * (1 - out); l.visible = l.material.opacity > 0.01; });

    // Dust turning in the sunbeam through the door.
    for (let i = 0; i < DN; i++) {
      const dx = DOOR[0] + rnd(i, 72) * (DOOR[1] - DOOR[0]), dy = 0.1 + rnd(i, 73) * (DOOR[2] - 0.1);
      const s = rnd(i, 71) * (dy / -beamDir.y);
      dpos[i * 3] = dx + beamDir.x * s + Math.sin(t * 0.3 + i) * 0.05;
      dpos[i * 3 + 1] = dy + beamDir.y * s + 0.04 + Math.sin(t * 0.45 + i * 1.3) * 0.04;
      dpos[i * 3 + 2] = WZ + beamDir.z * s + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
    dust.material.opacity = 0.65 * rise;
  }

  return { scene, camera, update, duration: D, poster: 8.7 };
}
