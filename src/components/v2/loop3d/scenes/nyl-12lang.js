// New York Lottery twelve-language website lit loop, 10 s. "One site, read in twelve languages."
// A subway mezzanine late at night: emerald glazed tile, terrazzo underfoot, one warm key over a lottery
// kiosk. A commuter with a backpack steps up and taps the language pill on the kiosk's web page. With each
// tap the code rolls over (EN, ES, ZH, RU, KO) and the page reflows: the headline bars stretch and shrink
// with the language, the body lines follow one after another, and a spark flies from the pill to the
// enamel band on the wall, where two tiles light for every language. The last tap is Arabic: the page
// lifts off the glass, the text slides across to the right while the picture passes beneath it to the
// left, and everything settles mirrored. The twelfth tile lights, a wave runs down the band and
// 12 LANGUAGES comes up; the commuter steps back and looks up as the mosaic name tablet above tiles
// itself in with the project's name.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { makePerson } from '../person.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const CORAL = '#ff7a52', CORAL_H = 0xff7a52, AMBER_H = 0xffc27a, INK = '#18263a', PAGE = '#e6dcc7', TERRA = '#8a3b24';
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// The languages shown, in order, and the taps that move from one to the next.
const LANGS = ['EN', 'ES', 'ZH', 'RU', 'KO', 'AR'];
const TAPS = [1.45, 2.65, 3.85, 5.05, 6.25];
const AR_TAP = 4;
// Page layout per language, from the approved flat loop: [x, y, w, h] in its 260 x 150 page units
// (page origin at 30, 22). Blocks: headline line 1, headline line 2, three body lines, button, picture.
const LAY = {
  EN: [[44, 74, 130, 9], [44, 88, 80, 9], [44, 108, 150, 4], [44, 117, 140, 4], [44, 126, 96, 4], [44, 140, 52, 13], [216, 74, 60, 52]],
  ES: [[44, 74, 158, 9], [44, 88, 124, 9], [44, 108, 160, 4], [44, 117, 156, 4], [44, 126, 132, 4], [44, 140, 52, 13], [216, 74, 60, 52]],
  ZH: [[44, 74, 96, 12], [44, 88, 0, 9], [44, 97, 128, 4], [44, 106, 116, 4], [44, 115, 60, 4], [44, 129, 52, 13], [216, 74, 60, 52]],
  RU: [[44, 74, 160, 9], [44, 88, 146, 9], [44, 108, 160, 4], [44, 117, 160, 4], [44, 126, 150, 4], [44, 140, 52, 13], [216, 74, 60, 52]],
  KO: [[44, 74, 104, 9], [44, 88, 62, 9], [44, 108, 140, 4], [44, 117, 124, 4], [44, 126, 80, 4], [44, 140, 52, 13], [216, 74, 60, 52]],
  AR: [[152, 74, 124, 9], [198, 88, 78, 9], [126, 108, 150, 4], [148, 117, 128, 4], [186, 126, 90, 4], [224, 140, 52, 13], [44, 74, 60, 52]],
};
const NB = 7;
// When each tile on the wall band lights: two on boot for English, then two per tap.
const LIT_T = [0.8, 0.95];
TAPS.forEach((tp) => LIT_T.push(tp + 0.48, tp + 0.62));
const DONE = 6.95;

const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// People come from the shared rig in ../person.js.

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06100e);
  scene.fog = new THREE.Fog(0x06100e, 5.5, 14);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the mezzanine
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#37322d', { size: 256, speck: 0.3, blot: 0.1, seed: 31, repeat: 7 }), roughness: 0.38, metalness: 0.08 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const WZ = -1.15;
  // Emerald subway tile, glazed: running bond with dark grout and a little glaze variation per tile.
  const tileTex = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#0b1513'; c.fillRect(0, 0, w, h);
    const cols = 4, rows = 8, tw = w / cols, th = h / rows;
    for (let r = 0; r < rows; r++) {
      for (let col = -1; col <= cols; col++) {
        const x = col * tw + (r % 2) * tw / 2, y = r * th, v = rnd(col * 13 + r, 3);
        const g = c.createLinearGradient(x, y, x + tw * 0.4, y + th);
        g.addColorStop(0, `rgb(${46 + v * 14},${110 + v * 18},${92 + v * 14})`);
        g.addColorStop(1, `rgb(${24 + v * 10},${70 + v * 14},${58 + v * 10})`);
        c.fillStyle = g; roundRect(c, x + 3, y + 3, tw - 6, th - 6, 6); c.fill();
      }
    }
  }).tex;
  tileTex.wrapS = tileTex.wrapT = THREE.RepeatWrapping; tileTex.repeat.set(16, 6.5);
  const wall = mesh(new THREE.PlaneGeometry(10, 3.9), std(0xffffff, { map: tileTex, roughness: 0.26, metalness: 0 }), { cast: false });
  wall.position.set(0.3, 1.95, WZ); scene.add(wall);
  const terraM = std(0x7a3420, { roughness: 0.45 });
  [0.92, 2.62].forEach((y) => { const b = mesh(new THREE.BoxGeometry(10, 0.05, 0.03), terraM, { cast: false }); b.position.set(0.3, y, WZ + 0.012); scene.add(b); });
  // Riveted steel columns either side.
  const colM = std(0x1d2a27, { metalness: 0.65, roughness: 0.42 });
  [-1.95, 2.15].forEach((x) => {
    const web = mesh(new THREE.BoxGeometry(0.05, 3.6, 0.22), colM); web.position.set(x, 1.8, -0.55); scene.add(web);
    [-0.11, 0.11].forEach((dz) => { const f = mesh(new THREE.BoxGeometry(0.22, 3.6, 0.025), colM); f.position.set(x, 1.8, -0.55 + dz); scene.add(f); });
  });
  // Fluorescent tubes overhead, just at the top edge of the wide shots.
  const tubeM = new THREE.MeshBasicMaterial({ color: 0xd8f5e6, toneMapped: false });
  [[-0.9, 2.95, -0.3], [1.2, 2.95, -0.3]].forEach(([x, y, z]) => {
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.3, 10), tubeM); tb.rotation.z = Math.PI / 2; tb.position.set(x, y, z); scene.add(tb);
    const g = glow(0xbfeedd, 1, 0.22, 0.4); g.scale.set(1.9, 0.4, 1); g.position.set(x, y - 0.03, z + 0.02); scene.add(g);
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5f9a86, 0x0c0a08, 0.36));
  const key = new THREE.SpotLight(0xffd6a4, 36, 0, 0.5, 0.75, 1.4);
  key.position.set(-1.6, 3.3, 2.3); key.target.position.set(0.25, 1.0, -0.35);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x8fe8d2, 1.5); rim.position.set(2.4, 2.4, -2.2); scene.add(rim);
  // A narrow wash on the name tablet, which only comes on at the end.
  const wash = new THREE.SpotLight(0xffe2b8, 0, 0, 0.42, 0.7, 1.3);
  wash.position.set(0.1, 3.4, 0.6); wash.target.position.set(0.12, 2.2, WZ); scene.add(wash, wash.target);

  // ----------------------------------------------------------- the kiosk
  const kiosk = new THREE.Group(); kiosk.position.set(0, 0, -0.38); scene.add(kiosk);
  const shellM = std(0x262c33, { metalness: 0.55, roughness: 0.38 });
  const ped = mesh(new RoundedBoxGeometry(0.46, 0.86, 0.3, 4, 0.04), shellM); ped.position.y = 0.43; kiosk.add(ped);
  const stripM = new THREE.MeshBasicMaterial({ color: CORAL_H, toneMapped: false });
  const strip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.018), stripM); strip.position.set(0, 0.74, 0.151); kiosk.add(strip);
  const neck = mesh(new THREE.BoxGeometry(0.12, 0.14, 0.1), shellM); neck.position.set(0, 0.92, -0.02); kiosk.add(neck);
  const SW = 1.04, SH = 0.6;
  const head = new THREE.Group(); head.position.set(0, 1.25, 0); head.rotation.x = -0.12; kiosk.add(head);
  head.add(mesh(new RoundedBoxGeometry(SW + 0.08, SH + 0.08, 0.06, 4, 0.025), shellM));
  const glass = mesh(new RoundedBoxGeometry(SW + 0.05, SH + 0.05, 0.004, 2, 0.02), std(0x040506, { roughness: 0.07, metalness: 0.3 }), { cast: false });
  glass.position.z = 0.031; head.add(glass);
  const SZ = 0.034;
  // Browser chrome and an empty page: everything on the page is its own block, raised a hair off the glass.
  const bg = canvasTex(1024, 591, (c, w, h) => {
    c.fillStyle = PAGE; c.fillRect(0, 0, w, h);
    const bar = h * 18 / 150;
    c.fillStyle = '#1e2a35'; c.fillRect(0, 0, w, bar);
    ['#ff7a52', '#e8c06a', '#6fb59a'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(46 + i * 40, bar / 2, 10, 0, 7); c.fill(); });
    c.fillStyle = '#34424f'; roundRect(c, 190, bar / 2 - 16, 470, 32, 16); c.fill();
    c.fillStyle = '#5c6b78'; roundRect(c, 214, bar / 2 - 5, 200, 10, 5); c.fill();
  });
  const screenM = new THREE.MeshBasicMaterial({ map: bg.tex, color: 0x000000, toneMapped: false });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), screenM); screen.position.z = SZ; head.add(screen);
  const screenGlow = glow(0xffd9b0, 1, 0, 0.5); screenGlow.position.z = 0.08; screenGlow.scale.set(SW * 1.9, SH * 2.0, 1); head.add(screenGlow);
  const scrL = new THREE.PointLight(0xffe2c4, 0, 2.4, 1.6); scrL.position.set(0, 0, 0.35); head.add(scrL);
  const px = (x) => (x - 30) / 260 * SW - SW / 2, py = (y) => SH / 2 - (y - 22) / 150 * SH, pu = SW / 260;

  // Page blocks. Ink headline bars, grey body lines, a coral button, a picture.
  const pill = canvasTex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; roundRect(c, 0, 0, w, h, h / 2); c.fill(); }).tex;
  const bar = canvasTex(256, 32, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#fff'; roundRect(c, 0, 0, w, h, 8); c.fill(); }).tex;
  const pic = canvasTex(256, 222, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2f6d8a'); g.addColorStop(0.62, '#e9a76a'); g.addColorStop(1, '#c4683f');
    c.fillStyle = g; roundRect(c, 0, 0, w, h, 16); c.fill();
    c.fillStyle = 'rgba(255,236,200,0.9)'; c.beginPath(); c.arc(w * 0.72, h * 0.3, 20, 0, 7); c.fill();
    c.fillStyle = '#1b3348'; c.beginPath(); c.moveTo(0, h); c.lineTo(0, h * 0.78); c.lineTo(w * 0.27, h * 0.44); c.lineTo(w * 0.45, h * 0.66);
    c.lineTo(w * 0.6, h * 0.52); c.lineTo(w, h * 0.8); c.lineTo(w, h); c.closePath(); c.fill();
  }).tex;
  const shTex = canvasTex(128, 64, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.filter = 'blur(8px)'; c.fillStyle = 'rgba(0,0,0,1)'; roundRect(c, 18, 16, w - 36, h - 32, 8); c.fill(); c.filter = 'none';
  }).tex;
  const blockCol = [INK, INK, '#7d8893', '#7d8893', '#7d8893', CORAL, '#ffffff'];
  const blocks = [], shadows = [];
  for (let j = 0; j < NB; j++) {
    const map = j === 5 ? pill : j === 6 ? pic : bar;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map, color: blockCol[j], transparent: true, toneMapped: false, depthWrite: false }));
    m.renderOrder = 4 + (j === 6 ? 0 : 1); head.add(m); blocks.push(m);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: shTex, color: 0x000000, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
    s.renderOrder = 3; head.add(s); shadows.push(s);
  }
  const BCOL = blockCol.map((c) => new THREE.Color(c));
  // The language pill: a globe and the code, which rolls over on each tap.
  const CHIP = [230, 46, 52, 17];
  const chipC = canvasTex(256, 84);
  const chip = new THREE.Mesh(new THREE.PlaneGeometry(CHIP[2] * pu, CHIP[3] * pu), new THREE.MeshBasicMaterial({ map: chipC.tex, transparent: true, toneMapped: false, depthWrite: false }));
  const CHX = px(CHIP[0] + CHIP[2] / 2), CHY = py(CHIP[1] + CHIP[3] / 2);
  chip.position.set(CHX, CHY, SZ + 0.003); chip.renderOrder = 6; head.add(chip);
  let chipKey = '';
  const drawChip = (a, b, roll, glowA) => {
    const key2 = a + b + Math.round(roll * 24) + '|' + Math.round(glowA * 8);
    if (key2 === chipKey) return; chipKey = key2;
    chipC.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = CORAL; roundRect(c, 0, 0, w, h, h / 2); c.fill();
      if (glowA > 0) { c.fillStyle = `rgba(255,236,214,${0.45 * glowA})`; roundRect(c, 0, 0, w, h, h / 2); c.fill(); }
      const gx = h * 0.58, gy = h / 2, r = h * 0.26;
      c.strokeStyle = '#fff6ee'; c.lineWidth = 4;
      c.beginPath(); c.arc(gx, gy, r, 0, 7); c.stroke();
      c.beginPath(); c.ellipse(gx, gy, r * 0.42, r, 0, 0, 7); c.stroke();
      c.beginPath(); c.moveTo(gx - r, gy); c.lineTo(gx + r, gy); c.stroke();
      c.save(); c.beginPath(); c.rect(h * 1.05, 6, w - h * 1.05 - 8, h - 12); c.clip();
      c.font = `800 46px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#fff';
      const cx = (h * 1.05 + w) / 2 - 4;
      c.globalAlpha = 1 - roll; c.fillText(a, cx, h / 2 + 3 - roll * h * 0.75);
      c.globalAlpha = roll; c.fillText(b, cx, h / 2 + 3 + (1 - roll) * h * 0.75);
      c.restore(); c.globalAlpha = 1;
    });
  };
  const ripple = new THREE.Mesh(new THREE.RingGeometry(0.03, 0.036, 48), new THREE.MeshBasicMaterial({ color: 0xffd2b8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
  ripple.position.set(CHX, CHY, SZ + 0.006); ripple.renderOrder = 7; head.add(ripple);
  // A soft band of light that wipes across the page as it reflows.
  const wipeTex = canvasTex(64, 8, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,1)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const wipe = new THREE.Mesh(new THREE.PlaneGeometry(0.16, SH * 0.86), new THREE.MeshBasicMaterial({ map: wipeTex, color: 0xffc6a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
  wipe.position.set(0, -SH * 0.06, SZ + 0.05); wipe.renderOrder = 8; head.add(wipe);
  const sheenTex = canvasTex(256, 148, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h);
    gr.addColorStop(0.28, 'rgba(255,255,255,0)'); gr.addColorStop(0.4, 'rgba(255,255,255,0.1)'); gr.addColorStop(0.46, 'rgba(255,255,255,0.02)'); gr.addColorStop(0.6, 'rgba(255,255,255,0)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
  }).tex;
  const sheen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: sheenTex, transparent: true, blending: THREE.AdditiveBlending, toneMapped: false, depthWrite: false }));
  sheen.position.z = SZ + 0.08; sheen.renderOrder = 9; head.add(sheen);

  kiosk.updateMatrixWorld(true);
  const CHIP_W = head.localToWorld(V(CHX, CHY, SZ + 0.004));
  const NRM = V(0, 0, 1).applyQuaternion(head.getWorldQuaternion(new THREE.Quaternion())).normalize();
  const SCR_C = head.localToWorld(V(0, 0, SZ));

  // ----------------------------------------------------------- the enamel band and its twelve tiles
  const BAND_Y = 1.78;
  const band = mesh(new RoundedBoxGeometry(2.36, 0.2, 0.03, 2, 0.01), std(0x0c0e10, { roughness: 0.22, metalness: 0.2 }), { cast: false });
  band.position.set(0.12, BAND_Y, WZ + 0.016); scene.add(band);
  const tileX = (j) => -0.94 + j * 0.122;
  const tiles = new THREE.InstancedMesh(new RoundedBoxGeometry(0.104, 0.104, 0.02, 2, 0.012), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 12);
  scene.add(tiles);
  for (let j = 0; j < 12; j++) { tiles.setColorAt(j, new THREE.Color(0.1, 0.11, 0.1)); tiles.setMatrixAt(j, new THREE.Matrix4().makeTranslation(-0.94 + j * 0.122, 1.78, WZ + 0.035)); }
  const tileGlows = [];
  for (let j = 0; j < 12; j++) { const g = glow(CORAL_H, 0.3, 0, 0.45); g.position.set(tileX(j), BAND_Y, WZ + 0.06); scene.add(g); tileGlows.push(g); }
  const DIM = new THREE.Color(0.1, 0.11, 0.1), LIT = new THREE.Color(1.0, 0.46, 0.28), HOT = new THREE.Color(1.0, 0.86, 0.6), tc = new THREE.Color();
  const m4 = new THREE.Matrix4(), q0 = new THREE.Quaternion(), sv = V(1, 1, 1), pv = V(0, 0, 0);
  const plaque = label('12 LANGUAGES', { font: `800 60px ${MONO}`, fg: '#f4efe4', h: 0.12, pad: 10, track: 3 });
  const PW = plaque.geometry.parameters.width;
  plaque.position.set(tileX(11) + 0.08 + PW / 2, BAND_Y, WZ + 0.034); scene.add(plaque);
  const plaqueGlow = glow(AMBER_H, 1, 0, 0.5); plaqueGlow.scale.set(PW * 1.6, 0.42, 1); plaqueGlow.position.set(plaque.position.x, BAND_Y, WZ + 0.07); scene.add(plaqueGlow);
  // The spark that carries each language from the pill up to its tiles.
  const spark = glow(0xffc8a0, 0.16, 0, 0.3); scene.add(spark);
  const sparkCore = glow(0xffffff, 0.06, 0, 0.2); scene.add(sparkCore);

  // ----------------------------------------------------------- the mosaic name tablet
  const TAB_W = 2.5, TAB_H = 0.5, CELL = 12;
  const tabC = canvasTex(1024, 205);
  const tablet = mesh(new THREE.PlaneGeometry(TAB_W, TAB_H), new THREE.MeshStandardMaterial({ map: tabC.tex, roughness: 0.5, metalness: 0 }), { cast: false });
  tablet.position.set(0.12, 2.24, WZ + 0.006); scene.add(tablet);
  let tabKey = -1;
  const drawTablet = (p) => {
    const q = Math.round(p * 40);
    if (q === tabKey) return; tabKey = q;
    tabC.redraw((c, w, h) => {
      c.fillStyle = TERRA; c.fillRect(0, 0, w, h);
      c.fillStyle = '#1c4a3c'; c.fillRect(14, 14, w - 28, h - 28);
      c.fillStyle = '#d9caa9'; c.fillRect(22, 22, w - 44, h - 44);
      const cols = Math.ceil(w / CELL), rows = Math.ceil(h / CELL);
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) {
        const v = rnd(x * 37 + y, 11);
        c.fillStyle = v > 0.5 ? `rgba(255,248,230,${(v - 0.5) * 0.22})` : `rgba(60,40,20,${(0.5 - v) * 0.16})`;
        c.fillRect(x * CELL, y * CELL, CELL, CELL);
      }
      // The words set themselves tile by tile, left to right.
      const n = (q / 40) * (cols + 8);
      c.save(); c.beginPath();
      for (let x = 0; x < cols; x++) for (let y = 0; y < rows; y++) if (x + rnd(x * 31 + y, 7) * 8 < n) c.rect(x * CELL, y * CELL, CELL, CELL);
      c.clip();
      let fs = 88; c.font = `800 ${fs}px ${SANS}`;
      const tw = c.measureText('Twelve-language website').width;
      if (tw > w - 90) { fs = Math.floor(fs * (w - 90) / tw); c.font = `800 ${fs}px ${SANS}`; }
      c.fillStyle = '#152338'; c.textAlign = 'center'; c.textBaseline = 'alphabetic';
      c.fillText('Twelve-language website', w / 2, 118);
      c.font = `700 36px ${MONO}`; c.fillStyle = TERRA; c.fillText('New York Lottery', w / 2, 170);
      c.restore();
      c.strokeStyle = 'rgba(30,24,18,0.32)'; c.lineWidth = 1.5; c.beginPath();
      for (let x = 22; x < w - 22; x += CELL) { c.moveTo(x, 22); c.lineTo(x, h - 22); }
      for (let y = 22; y < h - 22; y += CELL) { c.moveTo(22, y); c.lineTo(w - 22, y); }
      c.stroke();
    });
  };

  // ----------------------------------------------------------- the commuter
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xb07a55, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const jacket = std(0xb8862f, { roughness: 0.82 });
  const per = makePerson(scene, { skin, top: jacket, sleeve: jacket, fore: jacket, pants: std(0x23344a, { roughness: 0.85 }), shoeM: std(0xe6e1d6, { roughness: 0.6 }), hairM: std(0x8d2f2a, { roughness: 0.95 }), hairCap: 0.52, chestR: 0.15 });
  const pack = mesh(new RoundedBoxGeometry(0.27, 0.36, 0.14, 3, 0.05), std(0x2c3036, { roughness: 0.75 })); scene.add(pack);
  const flap = mesh(new RoundedBoxGeometry(0.2, 0.12, 0.03, 2, 0.012), std(0x3b4048, { roughness: 0.7 })); scene.add(flap);
  const mB = new THREE.Matrix4(), bx = V(0, 0, 0), by = V(0, 0, 0), bz = V(0, 0, 0);
  per.extra.push((hip, top, F, S, Dn) => {
    by.copy(Dn); bz.copy(F).addScaledVector(Dn, -F.dot(Dn)).normalize(); bx.crossVectors(by, bz);
    mB.makeBasis(bx, by, bz);
    pack.quaternion.setFromRotationMatrix(mB); flap.quaternion.copy(pack.quaternion);
    pack.position.copy(top).addScaledVector(Dn, -0.2).addScaledVector(bz, -0.21);
    flap.position.copy(top).addScaledVector(Dn, -0.12).addScaledVector(bz, -0.29);
  });
  const ROOT = V(0.7, 0, -0.02);
  const YAW = Math.atan2(-0.05 - ROOT.x, -0.36 - ROOT.z);
  const F0 = fwdOf(YAW), S0 = sideOf(YAW);
  // The tapping hand is whichever shoulder sits nearer the pill.
  const RH = ROOT.clone().addScaledVector(S0, -0.19).distanceTo(CHIP_W) < ROOT.clone().addScaledVector(S0, 0.19).distanceTo(CHIP_W) ? 0 : 1;
  const STEP = 0.24;
  const HOVER = CHIP_W.clone().addScaledVector(NRM, 0.13).add(V(0.02, -0.05, 0));
  const TOUCH = CHIP_W.clone().addScaledVector(NRM, 0.018);
  const BAND_C = V(0.12, 2.0, WZ);

  // How far the finger is pressed toward the glass: a little wind-up, a quick press, a soft release.
  const press = (t) => {
    let v = 0;
    for (const tp of TAPS) {
      const x = t - tp;
      if (x > -0.26 && x < 0.4) v = Math.max(v, x < 0 ? eio((x + 0.26) / 0.26) : x < 0.05 ? 1 : 1 - eo((x - 0.05) / 0.35));
    }
    return v;
  };
  const wind = (t) => { let v = 0; for (const tp of TAPS) v += Math.max(0, Math.sin(Math.PI * k(t, tp - 0.42, tp - 0.18))); return v; };

  // The page block j at time t: [x, y, w, h] in page units and how far it has lifted off the glass.
  const blk = [0, 0, 0, 0, 0];
  const blockAt = (j, t) => {
    let [x, y, w, h] = LAY[LANGS[0]][j], lift = 0;
    for (let i = 0; i < TAPS.length; i++) {
      const ar = i === AR_TAP;
      const st = TAPS[i] + 0.06 + (ar ? 0.05 : 0.035) * j, du = ar ? 0.78 : 0.42;
      const pl = k(t, st, st + du);
      if (pl <= 0) break;
      const p = back(pl), L = LAY[LANGS[i + 1]][j];
      x = lerp(x, L[0], p); y = lerp(y, L[1], p); w = lerp(w, L[2], p); h = lerp(h, L[3], p);
      lift += Math.sin(Math.PI * pl) * (ar ? 1 : 0.18);
    }
    blk[0] = x; blk[1] = y; blk[2] = Math.max(0, w); blk[3] = h; blk[4] = lift;
    return blk;
  };
  const curLang = (t) => { let i = 0; while (i < TAPS.length && t >= TAPS[i] + 0.04) i++; return i; };

  // ----------------------------------------------------------- dust in the key
  const DN = 110, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd9b0, size: 0.011, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-1.55, 1.8, 3.7]], [1.3, [-0.95, 1.58, 2.5]],
    [3.8, [-0.62, 1.5, 1.95], L], [5.45, [-0.58, 1.48, 1.86], L],
    [6.15, [-1.22, 1.4, 1.28]], [7.0, [-1.28, 1.42, 1.32], L],
    [8.3, [-0.6, 1.72, 3.55]], [10, [-0.55, 1.74, 3.72], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.2, 1.3, -0.5]], [1.3, [0.12, 1.28, -0.4]],
    [3.8, [0.08, 1.28, -0.38], L], [5.45, [0.06, 1.27, -0.38], L],
    [6.15, [0.06, 1.27, -0.38]], [7.0, [0.06, 1.28, -0.38], L],
    [8.3, [0.16, 1.52, -0.6]], [10, [0.16, 1.52, -0.6], L],
  ]);
  const camFov = (t) => kf(t, [[0, 34], [1.3, 31], [5.45, 30], [6.15, 32], [7.0, 32], [8.3, 36], [10, 36]]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), hipP = V(0, 0, 0), root = V(0, 0, 0), lookP = V(0, 0, 0), hW = V(0, 0, 0), F = V(0, 0, 0), S = V(0, 0, 0);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = camFov(t);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // ---- The kiosk wakes, then reflows on each tap.
    const bk = k(t, 0.2, 0.75);
    const boot = eo(bk) * (1 - 0.35 * (1 - bk) * Math.abs(Math.sin(bk * 23)));
    screenM.color.setScalar(0.76 * boot);
    screenGlow.material.opacity = 0.16 * boot;
    const li = curLang(t);
    const tapIdx = li - 1, sinceTap = tapIdx >= 0 ? t - TAPS[tapIdx] : 9;
    const flash = Math.exp(-sinceTap * 5) * (sinceTap >= 0 ? 1 : 0);
    scrL.intensity = (1.1 + 0.9 * flash) * boot;
    scrL.color.setRGB(1, 0.88 - 0.12 * flash, 0.77 - 0.2 * flash);
    for (let j = 0; j < NB; j++) {
      const [x, y, w, h, lift] = blockAt(j, t);
      const m = blocks[j], sh = shadows[j];
      const ww = Math.max(w * pu, 1e-4), hh = h * pu;
      m.visible = w > 0.4;
      m.position.set(px(x) + ww / 2, py(y) - hh / 2, SZ + 0.001 + j * 0.0002 + lift * (j === 6 ? 0.028 : 0.062));
      m.scale.set(ww, hh, 1);
      m.material.color.copy(BCOL[j]).multiplyScalar(boot * (1 + 0.25 * lift));
      sh.visible = m.visible && lift > 0.02;
      sh.position.set(m.position.x + 0.012 * lift, m.position.y - 0.016 * lift, SZ + 0.0008 + (j === 6 ? 0 : lift * 0.02));
      sh.scale.set(ww * 1.35 + 0.02, hh * 1.6 + 0.02, 1);
      sh.material.opacity = 0.32 * clamp(lift);
    }
    const tapP = tapIdx >= 0 ? k(t, TAPS[tapIdx] + 0.02, TAPS[tapIdx] + 0.3) : 1;
    const from = tapIdx >= 0 ? LANGS[tapIdx] : LANGS[0], to = LANGS[Math.max(0, li)];
    drawChip(tapP >= 1 ? to : from, to, eio(tapP), flash);
    const squish = press(t);
    chip.scale.set(1 - 0.05 * squish, 1 - 0.08 * squish, 1);
    const rp = tapIdx >= 0 ? k(t, TAPS[tapIdx], TAPS[tapIdx] + 0.55) : 0;
    ripple.scale.setScalar(1 + 5.5 * eo(rp)); ripple.material.opacity = 0.85 * Math.sin(Math.PI * rp) * (rp > 0 && rp < 1 ? 1 : 0);
    const wp = tapIdx >= 0 ? k(t, TAPS[tapIdx] + 0.05, TAPS[tapIdx] + (tapIdx === AR_TAP ? 0.9 : 0.55)) : 0;
    const wdir = tapIdx === AR_TAP ? 1 : -1;
    wipe.position.x = wdir * lerp(-SW * 0.46, SW * 0.46, eio(wp));
    wipe.material.opacity = 0.42 * Math.sin(Math.PI * wp) * (wp > 0 && wp < 1 ? 1 : 0);
    sheen.position.x = Math.sin(t * 0.4) * 0.04 + (camera.position.x + 0.6) * 0.05;
    stripM.color.setRGB(1, 0.48, 0.32).multiplyScalar(0.5 + 0.5 * boot + 0.6 * flash);

    // ---- Tiles on the band: two per language, then a wave down all twelve.
    for (let j = 0; j < 12; j++) {
      const lp = k(t, LIT_T[j], LIT_T[j] + 0.28), on = eo(lp);
      const wave = Math.exp(-Math.pow((t - DONE - j * 0.04) / 0.09, 2));
      tc.copy(DIM).lerp(LIT, on).lerp(HOT, wave * 0.85);
      tiles.setColorAt(j, tc);
      pv.set(tileX(j), BAND_Y, WZ + 0.035 + 0.012 * Math.sin(Math.PI * lp) + 0.008 * wave);
      sv.setScalar(1 + 0.18 * Math.sin(Math.PI * lp) + 0.1 * wave);
      tiles.setMatrixAt(j, m4.compose(pv, q0, sv));
      tileGlows[j].material.opacity = 0.42 * on + 0.5 * wave;
      tileGlows[j].scale.setScalar(0.26 + 0.12 * wave);
    }
    tiles.instanceMatrix.needsUpdate = true; if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
    const done = back(k(t, DONE + 0.1, DONE + 0.55));
    plaque.material.color.setScalar(lerp(0.22, 1, clamp(done)));
    plaque.scale.setScalar(1 + 0.04 * Math.sin(Math.PI * k(t, DONE + 0.1, DONE + 0.55)));
    plaqueGlow.material.opacity = 0.35 * clamp(done) * (0.85 + 0.15 * Math.sin(t * 3));

    // ---- The spark from the pill to its tiles.
    let sp = -1, sj = 0;
    for (let i = 0; i < 6; i++) {
      const t0 = i === 0 ? 0.42 : TAPS[i - 1] + 0.08, x = k(t, t0, t0 + 0.42);
      if (x > 0 && x < 1) { sp = x; sj = i * 2; }
    }
    spark.visible = sparkCore.visible = sp >= 0;
    spark.position.copy(CHIP_W); sparkCore.position.copy(CHIP_W);
    spark.material.opacity = sparkCore.material.opacity = 0;
    if (sp >= 0) {
      const e = eio(sp), tx = (tileX(sj) + tileX(sj + 1)) / 2;
      tmp.set(tx, BAND_Y, WZ + 0.08);
      tmp2.copy(CHIP_W).lerp(tmp, 0.5); tmp2.y += 0.35; tmp2.z += 0.25;
      spark.position.set(
        (1 - e) * (1 - e) * CHIP_W.x + 2 * (1 - e) * e * tmp2.x + e * e * tmp.x,
        (1 - e) * (1 - e) * CHIP_W.y + 2 * (1 - e) * e * tmp2.y + e * e * tmp.y,
        (1 - e) * (1 - e) * CHIP_W.z + 2 * (1 - e) * e * tmp2.z + e * e * tmp.z);
      sparkCore.position.copy(spark.position);
      const a = Math.sin(Math.PI * sp);
      spark.material.opacity = 0.9 * a; sparkCore.material.opacity = a;
    }

    // ---- The name tablet tiles itself in under its own wash of light.
    const tp = k(t, 7.35, 8.35);
    drawTablet(eio(tp));
    const fl = t > 7.2 && t < 7.55 ? (rnd(Math.floor(t * 30), 5) > 0.45 ? 1 : 0.25) : 1;
    wash.intensity = 16 * eo(k(t, 7.2, 7.6)) * fl * (1 - k(t, 9.55, 10));

    // ---- The commuter.
    const raise = eio(k(t, 0.85, 1.3)) * (1 - eio(k(t, 6.6, 7.15)));
    const pr = press(t), wd = wind(t);
    const back1 = eio(k(t, 6.95, 7.55));
    root.copy(ROOT).addScaledVector(F0, -STEP * back1);
    const yaw = YAW + 0.18 * eio(k(t, 7.0, 7.7));
    fwdOf(yaw, F); sideOf(yaw, S);
    const sway = Math.sin(t * 0.85) * 0.018 * (1 - 0.6 * raise);
    hipP.copy(root).addScaledVector(S, sway).addScaledVector(F, 0.04 * raise + 0.02 * pr);
    hipP.y = 0.93 + 0.004 * Math.sin(t * 1.7) - 0.012 * Math.sin(Math.PI * back1);
    const done2 = eio(k(t, DONE - 0.05, DONE + 0.4));
    const nod = 0.22 * Math.sin(Math.PI * k(t, DONE + 0.05, DONE + 0.45));
    // Where they look: the pill as they tap, then the headline as it reflows, then up at the wall.
    blockAt(0, t); head.localToWorld(hW.set(px(blk[0]) + blk[2] * pu * 0.5, py(blk[1]), SZ));
    lookP.copy(t < 1.0 ? SCR_C : hW);
    let g = 0; for (const tp2 of TAPS) g = Math.max(g, Math.exp(-Math.pow((t - tp2 + 0.08) / 0.22, 2)));
    lookP.lerp(CHIP_W, g * 0.85);
    lookP.lerp(BAND_C, done2);
    per.pose({ t,
      hip: hipP, yaw, lean: 0.04 + 0.08 * raise + 0.04 * pr - 0.06 * done2, look: lookP, nod,
      feet: (i, out) => {
        const sg = i ? 1 : -1;
        const st = eio(k(t, 6.95 + i * 0.2, 7.3 + i * 0.2));
        out.copy(ROOT).addScaledVector(S0, sg * 0.115).addScaledVector(F0, -STEP * st + (i === RH ? 0.03 : -0.02));
        out.y = 0.085 + 0.06 * Math.sin(Math.PI * st);
      },
      hands: (i, shp, out) => {
        const sg = i ? 1 : -1;
        tmp.copy(shp).add(tmp2.set(0, -0.52, 0)).addScaledVector(F, 0.06 + 0.04 * Math.sin(Math.PI * back1) * sg).addScaledVector(S, sg * 0.05);
        tmp.y += 0.006 * Math.sin(t * 1.3 + i);
        if (i === RH) {
          out.copy(HOVER).addScaledVector(NRM, 0.04 * wd).add(tmp2.set(Math.sin(t * 1.9) * 0.006, Math.sin(t * 2.3) * 0.006, 0));
          out.lerp(TOUCH, pr);
          out.lerp(tmp, 1 - raise);
        } else out.copy(tmp);
      },
    });

    // Dust turning slowly in the key.
    for (let i = 0; i < DN; i++) {
      const sd = rnd(i, 41);
      dpos[i * 3] = lerp(-1.3, 0.6, sd) + (rnd(i, 42) - 0.5) * 0.6 + Math.sin(t * 0.3 + i) * 0.05;
      dpos[i * 3 + 1] = lerp(2.9, 0.2, sd) + Math.sin(t * 0.37 + i * 1.3) * 0.05 + (rnd(i, 43) - 0.5) * 0.3;
      dpos[i * 3 + 2] = lerp(1.9, -0.6, sd) + (rnd(i, 44) - 0.5) * 0.6 + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
