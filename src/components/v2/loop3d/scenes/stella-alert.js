// STELLA alert rework lit loop, 10 s. "Strip, tile, button: alerts that say what to do next."
// A dealership service drive at night: wet concrete, a roll-up door, a phone standing in its dock on the
// advisor's counter. Beat one: the AI voice agent finishes a service call (a live waveform over the
// phone), and its follow-ups burst out as alert cards that all look the same, four equal buttons each.
// Beat two: one card comes forward, becomes the new design and comes apart in depth into its three
// jobs: the strip says how soon, the tile says what, the button says what next. Beat three: every card
// takes the new form; actionable ones line up as a queue by urgency, informational ones settle onto the
// counter, and the top two are worked off. Beat four pulls back on the clear, ordered queue.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const NOW = '#ff5a4a', SOON = '#ffb020', LATER = '#3ddc97', INFO = '#8a9bae', CYAN = '#38e1ff', BG = 0x061113;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
// Every word on a card comes from the case study's own description of the alerts.
const CARDS = [
  { kind: 'TRANSFER', title: 'Dropped transfer', sub: 'Customer waiting', when: 'NOW', fill: 1, col: NOW, btn: 'Call back' },
  { kind: 'CALLER', title: 'Upset caller', sub: 'Needs a person', when: 'DUE SOON', fill: 0.62, col: SOON, btn: 'Call back' },
  { kind: 'CALLBACK', title: 'Call back a customer', sub: 'Follow-up from the call', when: 'HOURS LEFT', fill: 0.3, col: LATER, btn: 'Call back' },
  { kind: 'TEXT', title: 'Conversation', sub: 'Take over and reply', when: 'HOURS LEFT', fill: 0.2, col: LATER, btn: 'Reply' },
  { kind: 'HANDLED', title: 'Handled by STELLA', sub: 'Already handled', when: 'INFORMATIONAL', fill: 0, col: INFO, btn: null },
  { kind: 'NOTE', title: 'Note', sub: 'Needs nothing', when: 'INFORMATIONAL', fill: 0, col: INFO, btn: null },
];
// Where each card hangs in the cloud after the call: [x, y, z, rx, ry, rz].
const CLOUD = [
  [-0.1, 0.92, 0.38, 0.08, 0.18, -0.06], [-0.8, 1.24, -0.05, -0.12, 0.32, 0.1], [0.42, 1.3, -0.15, 0.1, -0.25, 0.08],
  [-0.84, 0.6, 0.12, 0.14, 0.28, -0.12], [0.3, 0.56, 0.22, -0.1, -0.2, 0.1], [-0.25, 1.5, -0.32, -0.08, 0.1, -0.14],
];
const CW = 1.0, CHT = 0.32, CD = 0.022;
const FOCUS = { x: -0.05, y: 0.86, z: 0.72, rx: 0, ry: 0, rz: 0, s: 1 };
const PH = [0.98, 0.82, -0.32];        // phone position
const PRESS = [6.62, 7.47];           // the top card's button is pressed
const EXIT = [6.9, 7.75];             // and the worked card leaves the queue
const SHIFT = [7.05, 7.9];            // the queue moves up

function drawIcon(c, kind, cx, cy, r) {
  c.strokeStyle = '#fff'; c.fillStyle = '#fff'; c.lineWidth = r * 0.16; c.lineCap = 'round'; c.lineJoin = 'round';
  if (kind === 'TRANSFER') {
    c.beginPath(); c.moveTo(cx - r * 0.7, cy - r * 0.3); c.lineTo(cx + r * 0.6, cy - r * 0.3); c.moveTo(cx + r * 0.3, cy - r * 0.6); c.lineTo(cx + r * 0.65, cy - r * 0.3); c.lineTo(cx + r * 0.3, cy);
    c.moveTo(cx + r * 0.7, cy + r * 0.35); c.lineTo(cx - r * 0.6, cy + r * 0.35); c.moveTo(cx - r * 0.3, cy + r * 0.05); c.lineTo(cx - r * 0.65, cy + r * 0.35); c.lineTo(cx - r * 0.3, cy + r * 0.65); c.stroke();
  } else if (kind === 'CALLER' || kind === 'TEXT') {
    c.beginPath(); roundRect(c, cx - r * 0.75, cy - r * 0.6, r * 1.5, r * 1.0, r * 0.3); c.stroke();
    c.beginPath(); c.moveTo(cx - r * 0.35, cy + r * 0.4); c.lineTo(cx - r * 0.5, cy + r * 0.75); c.lineTo(cx, cy + r * 0.4); c.stroke();
    if (kind === 'CALLER') { c.beginPath(); c.moveTo(cx, cy - r * 0.38); c.lineTo(cx, cy - r * 0.02); c.stroke(); c.beginPath(); c.arc(cx, cy + r * 0.17, r * 0.07, 0, 7); c.fill(); }
    else [-0.35, 0, 0.35].forEach((d) => { c.beginPath(); c.arc(cx + d * r, cy - r * 0.1, r * 0.09, 0, 7); c.fill(); });
  } else if (kind === 'CALLBACK') {
    c.beginPath(); c.arc(cx, cy, r * 0.62, -Math.PI * 0.35, Math.PI * 1.3); c.stroke();
    const a = -Math.PI * 0.35, ex = cx + Math.cos(a) * r * 0.62, ey = cy + Math.sin(a) * r * 0.62;
    c.beginPath(); c.moveTo(ex - r * 0.32, ey - r * 0.1); c.lineTo(ex, ey); c.lineTo(ex - r * 0.05, ey + r * 0.32); c.stroke();
  } else if (kind === 'HANDLED') {
    c.beginPath(); c.moveTo(cx - r * 0.5, cy); c.lineTo(cx - r * 0.12, cy + r * 0.38); c.lineTo(cx + r * 0.55, cy - r * 0.4); c.stroke();
  } else {
    c.beginPath(); roundRect(c, cx - r * 0.5, cy - r * 0.65, r, r * 1.3, r * 0.12); c.stroke();
    [-0.3, 0, 0.3].forEach((d) => { c.beginPath(); c.moveTo(cx - r * 0.28, cy + d * r); c.lineTo(cx + r * 0.28, cy + d * r); c.stroke(); });
  }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 3.8, 10.5);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler();

  // ----------------------------------------------------------- service drive
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#0d1517', { size: 256, speck: 0.07, blot: 0.16, seed: 31, repeat: 6 }), roughness: 0.12, metalness: 0.5 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.95; scene.add(floor);
  const lane = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 9), std(0xd9a21b, { roughness: 0.5 }));
  lane.rotation.x = -Math.PI / 2; lane.position.set(-2.3, -0.948, -1); scene.add(lane);
  const slats = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#26363b'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 32) {
      const g = c.createLinearGradient(0, y, 0, y + 32);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(0.9, 'rgba(0,0,0,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0.7)');
      c.fillStyle = g; c.fillRect(0, y, w, 32);
    }
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(0,0,0,${rnd(i, 32) * 0.12})`; c.fillRect(rnd(i, 33) * w, 0, 2 + rnd(i, 34) * 6, h); }
  });
  slats.tex.wrapS = slats.tex.wrapT = THREE.RepeatWrapping; slats.tex.repeat.set(2, 2.5);
  const door = mesh(new THREE.PlaneGeometry(4.6, 2.7), std(0xffffff, { map: slats.tex, metalness: 0.55, roughness: 0.42 }), { cast: false });
  door.position.set(0.2, 0.4, -2.4); scene.add(door);
  const wall = mesh(new THREE.PlaneGeometry(16, 6), std(0xffffff, { map: grainTex('#121b1d', { size: 256, speck: 0.05, blot: 0.12, seed: 35, repeat: 4 }), roughness: 0.9 }), { cast: false });
  wall.position.set(0, 1.5, -2.45); scene.add(wall);
  // Strip lights over the door and the service sign: practical lights the wet floor picks up.
  [-1.3, 0.2, 1.7].forEach((x) => {
    const tube = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.035, 0.035), new THREE.MeshBasicMaterial({ color: 0xdff6ff, toneMapped: false }));
    tube.position.set(x, 1.86, -2.32); scene.add(tube);
    const g = glow(0x9fe8ff, 1, 0.4, 0.5); g.position.set(x, 1.86, -2.28); g.scale.set(1.9, 0.45, 1); scene.add(g);
  });
  const sign = label('SERVICE', { font: `800 64px ${SANS}`, fg: '#c8f7ff', h: 0.24, track: 10 });
  sign.position.set(-1.75, 1.32, -2.34); scene.add(sign);
  const signGlow = glow(0x38e1ff, 1, 0.35, 0.5); signGlow.position.set(-1.75, 1.32, -2.3); signGlow.scale.set(1.8, 0.6, 1); scene.add(signGlow);
  // Tires and a cone: the shop floor at the edges of the frame.
  const tireGeo = new THREE.TorusGeometry(0.3, 0.12, 14, 36); tireGeo.rotateX(Math.PI / 2);
  const tires = new THREE.InstancedMesh(tireGeo, std(0x0f1112, { roughness: 0.78 }), 4);
  for (let i = 0; i < 4; i++) { q4.setFromEuler(e4.set((rnd(i, 36) - 0.5) * 0.05, 0, (rnd(i, 37) - 0.5) * 0.05)); m4.compose(p4.set(2.15 + (rnd(i, 38) - 0.5) * 0.05, -0.83 + i * 0.24, -1.55), q4, s4.set(1, 1, 1)); tires.setMatrixAt(i, m4); }
  tires.castShadow = true; tires.receiveShadow = true; scene.add(tires);
  const cone = mesh(new THREE.ConeGeometry(0.15, 0.5, 28), std(0xff6a1a, { roughness: 0.45 }));
  cone.position.set(-2.05, -0.68, -1.15); scene.add(cone);
  const coneBase = mesh(new THREE.BoxGeometry(0.36, 0.035, 0.36), std(0xff6a1a, { roughness: 0.5 }));
  coneBase.position.set(-2.05, -0.932, -1.15); scene.add(coneBase);
  const band = mesh(new THREE.CylinderGeometry(0.098, 0.115, 0.08, 28, 1, true), std(0xf2f2f2, { roughness: 0.3 }));
  band.position.set(-2.05, -0.66, -1.15); scene.add(band);

  // ----------------------------------------------------------- the advisor's counter
  const top = mesh(new RoundedBoxGeometry(3.0, 0.06, 1.1, 3, 0.02), std(0xffffff, { map: grainTex('#161e21', { size: 256, speck: 0.05, blot: 0.12, seed: 39, repeat: 3 }), roughness: 0.2, metalness: 0.15 }));
  top.position.set(0, -0.03, 0.1); scene.add(top);
  const body = mesh(new THREE.BoxGeometry(2.96, 0.89, 1.0), std(0x0e1517, { roughness: 0.55 }));
  body.position.set(0, -0.505, 0.08); scene.add(body);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(2.96, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: 0x38e1ff, toneMapped: false }));
  edge.position.set(0, -0.075, 0.585); scene.add(edge);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x3d6c7a, 0x060a0b, 0.4));
  const key = new THREE.SpotLight(0xf2f6ff, 0, 0, 0.62, 0.75, 1.3);
  key.position.set(-1.0, 2.9, 2.1); key.target.position.set(0.1, 0.6, 0.1);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 7; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x38e1ff, 1.3); rim.position.set(1.5, 1.8, -2.5); scene.add(rim);
  const amber = new THREE.PointLight(0xffa040, 1.2, 4, 1.6); amber.position.set(-1.8, 0.2, -1.0); scene.add(amber);
  const waveLight = new THREE.PointLight(0x38e1ff, 0, 2.6, 1.6); scene.add(waveLight);
  const urgent = new THREE.PointLight(0xff5a4a, 0, 1.8, 1.8); scene.add(urgent);

  // ----------------------------------------------------------- phone in its dock
  const ph = phone();
  ph.position.set(PH[0], PH[1], PH[2]); ph.rotation.set(-0.08, -0.3, 0, 'YXZ');
  scene.add(ph);
  const dock = mesh(new RoundedBoxGeometry(0.5, 0.06, 0.26, 2, 0.02), std(0x1c2428, { metalness: 0.7, roughness: 0.35 }));
  dock.position.set(PH[0], 0.03, PH[2] + 0.02); dock.rotation.y = -0.3; scene.add(dock);
  const SW = 448, SH = 970;
  const scr = canvasTex(SW, SH);
  ph.userData.screen.material.map = scr.tex; ph.userData.screen.material.needsUpdate = true;
  const phGlow = glow(0x38e1ff, 1, 0, 0.5); phGlow.position.set(0, 0, -0.1); phGlow.scale.set(1.6, 2.4, 1); ph.add(phGlow);
  ph.updateMatrixWorld(true);
  const PS = new THREE.Vector3(); ph.userData.screen.getWorldPosition(PS);
  // The AI voice agent's live waveform, floating just off the glass and wider than the phone.
  const WN = 33;
  const wave = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 1, 0.016), new THREE.MeshBasicMaterial({ color: 0x5fe9ff, toneMapped: false }), WN);
  wave.position.set(0, 0.08, 0.11); wave.frustumCulled = false; ph.add(wave);
  const waveGlow = glow(0x38e1ff, 1, 0, 0.45); waveGlow.position.set(0, 0.08, 0.1); waveGlow.scale.set(1.5, 0.7, 1); ph.add(waveGlow);
  ph.localToWorld(waveLight.position.set(0, 0.08, 0.35));

  let sKey = '';
  const drawScreen = (t, worked) => {
    const call = t < 1.9, newUI = t > 5.6;
    const key2 = [call ? Math.round(t * 30) : 0, newUI ? 1 : 0, worked, Math.min(6, Math.floor(k(t, 1.95, 2.4) * 6))].join('|');
    if (key2 === sKey) return; sKey = key2;
    scr.redraw((c, w, h) => {
      c.fillStyle = '#071417'; c.fillRect(0, 0, w, h);
      c.textBaseline = 'middle';
      if (call) {
        const end = t > 1.75;
        c.fillStyle = CYAN; c.font = `700 26px ${MONO}`; c.fillText('AI VOICE AGENT', 40, 120);
        c.fillStyle = '#fff'; c.font = `800 52px ${SANS}`; c.fillText('Service call', 40, 184);
        c.fillStyle = end ? 'rgba(255,255,255,0.5)' : '#3ddc97'; c.beginPath(); c.arc(50, 250, 9, 0, 7); c.fill();
        c.font = `600 28px ${SANS}`; c.fillText(end ? 'Call ended' : 'On the call', 70, 251);
        const on = eo(k(t, 0.45, 0.9)) * (1 - eio(k(t, 1.75, 1.9)));
        for (let i = 0; i < 24; i++) {
          const bh = 6 + on * 150 * Math.abs(Math.sin(t * 7.3 + i * 0.55) * Math.sin(t * 2.9 + i * 0.21 + 1)) * (0.45 + 0.55 * rnd(i, 5));
          c.fillStyle = 'rgba(95,233,255,0.9)'; roundRect(c, 44 + i * 15.5, 520 - bh / 2, 8, bh, 4); c.fill();
        }
        return;
      }
      c.fillStyle = '#fff'; c.font = `800 52px ${SANS}`; c.fillText('Alerts', 36, 96);
      if (!newUI) {
        // The prototype: rows that all look the same.
        const n = Math.min(6, Math.floor(k(t, 1.95, 2.4) * 6));
        for (let i = 0; i < 6; i++) {
          c.globalAlpha = i < 6 - n ? 1 : 0.25;
          const y = 160 + i * 128;
          c.fillStyle = '#1b2a2e'; roundRect(c, 28, y, w - 56, 108, 18); c.fill();
          c.fillStyle = 'rgba(255,255,255,0.75)'; c.fillRect(52, y + 26, 200, 14);
          for (let j = 0; j < 4; j++) { c.fillStyle = '#2f4449'; roundRect(c, 52 + j * 88, y + 62, 76, 28, 14); c.fill(); }
        }
        c.globalAlpha = 1;
        return;
      }
      // The redesign: a status summary, then the queue by urgency, each row led by its strip.
      c.fillStyle = 'rgba(255,90,74,0.18)'; roundRect(c, 28, 150, (w - 70) / 2, 92, 18); c.fill();
      c.fillStyle = 'rgba(138,155,174,0.18)'; roundRect(c, 42 + (w - 70) / 2, 150, (w - 70) / 2, 92, 18); c.fill();
      c.font = `700 24px ${SANS}`; c.fillStyle = NOW; c.fillText('Actionable', 48, 196);
      c.fillStyle = INFO; c.fillText('Informational', 62 + (w - 70) / 2, 196);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = `700 22px ${MONO}`; c.fillText('DUE SOON', 36, 296);
      let y = 326;
      for (let i = worked; i < 4; i++) {
        const cd = CARDS[i];
        c.fillStyle = '#13262a'; roundRect(c, 28, y, w - 56, 116, 18); c.fill();
        c.fillStyle = cd.col; roundRect(c, 28, y, (w - 56) * Math.max(0.2, cd.fill), 10, 5); c.fill();
        c.fillStyle = '#fff'; c.font = `700 28px ${SANS}`; c.fillText(cd.title, 52, y + 50);
        c.fillStyle = cd.col; roundRect(c, w - 168, y + 70, 128, 34, 17); c.fill();
        c.fillStyle = '#071417'; c.font = `700 20px ${SANS}`; c.textAlign = 'center'; c.fillText(cd.btn, w - 104, y + 88); c.textAlign = 'left';
        y += 134;
      }
    });
  };

  // ----------------------------------------------------------- the alert cards
  const slabGeo = new RoundedBoxGeometry(CW, CHT, CD, 3, 0.03);
  const faceGeo = new THREE.PlaneGeometry(CW - 0.02, CHT - 0.02);
  const stripGeo = new RoundedBoxGeometry(0.94, 0.05, 0.014, 2, 0.006), stripFace = new THREE.PlaneGeometry(0.94, 0.05);
  const tileGeo = new RoundedBoxGeometry(0.2, 0.2, 0.028, 2, 0.013), tileFace = new THREE.PlaneGeometry(0.19, 0.19);
  const btnGeo = new RoundedBoxGeometry(0.28, 0.085, 0.028, 2, 0.013), btnFace = new THREE.PlaneGeometry(0.28, 0.085);
  const layerM = std(0x0f1a1d, { roughness: 0.3, metalness: 0.4 });
  const basic = (map) => new THREE.MeshBasicMaterial({ map, transparent: true, toneMapped: false, depthWrite: false });
  const cards = CARDS.map((cd, i) => {
    const g = new THREE.Group(); scene.add(g);
    const slab = mesh(slabGeo, std(0x0c1416, { roughness: 0.25, metalness: 0.35 })); g.add(slab);
    // The prototype face: title and four equal buttons.
    const oldT = canvasTex(768, 246, (c, w, h) => {
      c.fillStyle = '#e8edf1'; roundRect(c, 0, 0, w, h, 22); c.fill();
      c.fillStyle = '#2a3438'; c.font = `700 46px ${SANS}`; c.textBaseline = 'middle'; c.fillText(cd.title, 30, 62);
      c.fillStyle = '#6c7a80'; c.font = `500 30px ${SANS}`; c.fillText(cd.sub, 30, 112);
      for (let j = 0; j < 4; j++) { c.fillStyle = '#c9d3da'; roundRect(c, 30 + j * 180, 164, 166, 52, 26); c.fill(); c.fillStyle = '#9aa8b0'; c.fillRect(70 + j * 180, 187, 86, 7); }
    });
    const oldF = new THREE.Mesh(faceGeo, basic(oldT.tex)); oldF.position.z = CD / 2 + 0.001; g.add(oldF);
    // The new face: body text, with room left for the strip, tile and button layers on top.
    const newT = canvasTex(768, 246, (c, w, h) => {
      c.fillStyle = '#f6f8f9'; roundRect(c, 0, 0, w, h, 22); c.fill();
      c.fillStyle = '#0f1a1d'; c.textBaseline = 'middle';
      let fs = 46; c.font = `800 ${fs}px ${SANS}`; while (c.measureText(cd.title).width > w - 214 && fs > 28) { fs -= 2; c.font = `800 ${fs}px ${SANS}`; }
      c.fillText(cd.title, 196, 98);
      c.fillStyle = '#5c6a70'; c.font = `500 30px ${SANS}`; c.fillText(cd.sub, 196, 148);
      if (cd.btn) { c.fillStyle = '#c3ccd1'; [0, 1, 2].forEach((d) => { c.beginPath(); c.arc(436 + d * 18, 196, 5, 0, 7); c.fill(); }); }
      else { c.fillStyle = '#8a9bae'; c.font = `700 22px ${MONO}`; c.fillText('INFORMATIONAL', 196, 200); }
    });
    const newF = new THREE.Mesh(faceGeo, basic(newT.tex)); newF.position.z = CD / 2 + 0.0015; g.add(newF);
    const layer = (geo, faceG, tex, x, y, d) => {
      const lg = new THREE.Group(); lg.position.set(x, y, CD / 2 + 0.008); g.add(lg);
      const base = mesh(geo, layerM); lg.add(base);
      const f = new THREE.Mesh(faceG, basic(tex)); f.position.z = d / 2 + 0.0015; lg.add(f);
      return { lg, f, base, x, y };
    };
    const stripT = canvasTex(768, 40, (c, w, h) => {
      c.fillStyle = '#20292c'; roundRect(c, 0, 0, w, h, 20); c.fill();
      if (cd.fill > 0) { c.fillStyle = cd.col; roundRect(c, 0, 0, Math.max(h, w * cd.fill), h, 20); c.fill(); }
      c.fillStyle = cd.fill > 0.5 ? '#fff' : cd.fill > 0 ? '#0f1a1d' : '#c3ccd1'; c.font = `800 26px ${MONO}`; c.textBaseline = 'middle'; c.fillText(cd.when, 18, h / 2 + 1);
    });
    const strip = layer(stripGeo, stripFace, stripT.tex, 0, CHT / 2 - 0.042, 0.014);
    const tileT = canvasTex(192, 192, (c, w, h) => {
      c.fillStyle = cd.col; roundRect(c, 0, 0, w, h, 30); c.fill();
      drawIcon(c, cd.kind, w / 2, h / 2 - 18, 46);
      c.fillStyle = 'rgba(255,255,255,0.95)'; c.font = `800 22px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(cd.kind, w / 2, h - 30);
    });
    const tile = layer(tileGeo, tileFace, tileT.tex, -0.37, -0.025, 0.028);
    let btn = null;
    if (cd.btn) {
      const btnT = canvasTex(320, 98, (c, w, h) => {
        c.fillStyle = cd.col; roundRect(c, 0, 0, w, h, h / 2); c.fill();
        c.fillStyle = cd.fill > 0.5 ? '#fff' : '#0f1a1d'; c.font = `800 40px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(cd.btn, w / 2, h / 2 + 2);
      });
      btn = layer(btnGeo, btnFace, btnT.tex, 0.33, -0.095, 0.028);
      btn.base.material = std(new THREE.Color(cd.col).multiplyScalar(0.45), { roughness: 0.3, emissive: new THREE.Color(cd.col), emissiveIntensity: 0 });
    }
    const halo = glow(new THREE.Color(cd.col), 1, 0, 0.45); halo.position.z = -0.08; halo.scale.set(1.5, 0.6, 1); g.add(halo);
    const pop = glow(new THREE.Color(cd.col), 0.5, 0, 0.3); g.add(pop);
    if (btn) pop.position.set(btn.x, btn.y, 0.1);
    return { g, oldF, newF, strip, tile, btn, halo, pop, act: !!cd.btn };
  });

  // ----------------------------------------------------------- captions
  const mk = (text, h, fg, font = `800 60px ${SANS}`) => { const m = label(text, { font, fg, h }); m.renderOrder = 5; scene.add(m); return m; };
  const capAgent = mk('AI VOICE AGENT', 0.11, CYAN, `700 56px ${MONO}`);
  const capSame = mk('Everything looked equally urgent', 0.15, '#ffffff');
  const capStrip = mk('STRIP · how soon', 0.12, NOW);
  const capTile = mk('TILE · what', 0.12, '#ffffff');
  const capBtn = mk('BUTTON · what next', 0.12, '#ffffff');
  const capAct = mk('ACTIONABLE', 0.12, '#ffffff', `700 56px ${MONO}`);
  const capInfo = mk('INFORMATIONAL', 0.1, INFO, `700 56px ${MONO}`);
  const capRes = mk('Every alert says what to do next', 0.17, '#ffffff');
  const capSub = mk('Design study for leadership review', 0.095, '#9fb3bd', `600 56px ${SANS}`);
  const show = (m, o, x, y, z) => { m.visible = o > 0.005; m.material.opacity = clamp(o); if (x !== undefined) m.position.set(x, y, z); m.lookAt(camera.position); };

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.6, 1.2, 2.95]], [1.8, [0.56, 1.17, 2.78], (x) => x],
    [2.9, [0.1, 1.15, 3.55]], [3.75, [-0.2, 1.02, 2.45]],
    [5.25, [-0.36, 0.98, 2.35], (x) => x], [6.35, [0.18, 1.12, 3.95]],
    [8.35, [0.12, 1.1, 3.8], (x) => x], [10, [0.14, 1.24, 4.35]],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.78, 0.98, -0.3]], [1.8, [0.77, 0.98, -0.3], (x) => x],
    [2.9, [-0.02, 0.9, 0.05]], [3.75, [-0.06, 0.84, 0.62]],
    [5.25, [-0.06, 0.84, 0.62], (x) => x], [6.35, [0.12, 0.88, 0.1]],
    [8.35, [0.12, 0.88, 0.1], (x) => x], [10, [0.12, 0.94, 0.05]],
  ]);
  const tgt = new THREE.Vector3(), wv = new THREE.Vector3();
  const pose = () => ({ x: 0, y: 0, z: 0, rx: 0, ry: 0, rz: 0, s: 1 });
  const mix = (a, b, p) => { for (const key2 in a) a[key2] = lerp(a[key2], b[key2], p); return a; };
  const set = (o, x, y, z, rx, ry, rz, s) => Object.assign(o, { x, y, z, rx, ry, rz, s });
  const A = pose(), B = pose();
  const CCOL = CARDS.map((cd) => new THREE.Color(cd.col));

  function update(t) {
    const cp = camPos(t), cq = camTgt(t);
    camera.position.set(cp[0] + Math.sin(t * 1.05) * 0.008, cp[1] + Math.sin(t * 1.55 + 1) * 0.006, cp[2]);
    tgt.set(cq[0], cq[1], cq[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 32], [2.9, 34], [3.75, 32], [6.35, 34], [10, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    key.intensity = 34 * clamp(back(k(t, 0.2, 0.75)));

    // The call: a live waveform off the glass, then it flattens and goes out.
    const on = eo(k(t, 0.45, 0.9)) * (1 - eio(k(t, 1.75, 2.0)));
    const gone = 1 - eio(k(t, 2.0, 2.2));
    for (let i = 0; i < WN; i++) {
      const fall = 1 - Math.abs(i - (WN - 1) / 2) / ((WN - 1) / 2) * 0.6;
      const hgt = 0.012 + on * 0.34 * fall * Math.abs(Math.sin(t * 7.3 + i * 0.55) * Math.sin(t * 2.9 + i * 0.21 + 1)) * (0.45 + 0.55 * rnd(i, 5));
      const sx = t < 0.45 ? 0.0001 : Math.max(0.0001, gone * eo(k(t, 0.45 + i * 0.008, 0.75 + i * 0.008)));
      m4.compose(p4.set(-0.5 + i * (1 / (WN - 1)), 0, 0), q4.identity(), s4.set(sx, hgt, sx));
      wave.setMatrixAt(i, m4);
    }
    wave.instanceMatrix.needsUpdate = true;
    waveGlow.material.opacity = 0.55 * on;
    waveLight.intensity = 2.2 * on + 0.4 * Math.exp(-6 * Math.max(0, t - 1.95)) * (t > 1.95 ? 1 : 0);
    phGlow.material.opacity = 0.18 + 0.2 * on;
    const worked = (t > EXIT[0] + 0.2 ? 1 : 0) + (t > EXIT[1] + 0.2 ? 1 : 0);
    drawScreen(t, worked);
    ph.userData.screen.material.color.setScalar(lerp(0.2, 0.92, eo(k(t, 0.3, 0.7))));

    // Cards
    const f2 = eio(k(t, 3.0, 3.6));
    const ex = eio(k(t, 3.75, 4.3)) * (1 - eio(k(t, 5.0, 5.35)));
    const turn = eio(k(t, 3.6, 4.2)) * (1 - eio(k(t, 5.05, 5.6)));
    cards.forEach((cd, i) => {
      const bi = 1.95 + i * 0.07, fb = k(t, bi, bi + 0.65);
      cd.g.visible = t >= bi;
      if (!cd.g.visible) return;
      const cl = CLOUD[i];
      // Out of the phone into the cloud, drifting.
      set(A, PS.x, PS.y, PS.z, 0, -0.3, 0, 0.18);
      set(B, cl[0] * 0.85 + Math.sin(t * 0.7 + i * 2) * 0.03, cl[1] + Math.sin(t * 0.9 + i) * 0.025, cl[2], cl[3] + Math.sin(t * 0.6 + i) * 0.05, cl[4] + Math.sin(t * 0.5 + i * 1.3) * 0.06, cl[5], 1);
      mix(A, B, back(fb));
      A.y += Math.sin(Math.PI * fb) * 0.15;
      // Beat two: the first card comes forward; the rest step back and dim.
      let dim = 1;
      if (i === 0) { mix(A, FOCUS, f2); A.ry += 0.62 * turn; A.y += Math.sin(t * 1.2) * 0.008 * f2; }
      else { const f2b = eio(k(t, 3.0 + i * 0.03, 3.7 + i * 0.03)); set(B, cl[0] * 1.05, cl[1] + 0.05, cl[2] - 0.75, A.rx, A.ry, A.rz, 0.85); mix(A, B, f2b); dim = 1 - 0.72 * f2b; }
      // Beat three: actionable cards form the queue by urgency; informational ones settle on the counter.
      const q = eio(k(t, 5.55 + i * 0.09, 6.3 + i * 0.09));
      if (cd.act) {
        let pos = i;
        if (i > 0) pos -= back(k(t, SHIFT[0], SHIFT[0] + 0.45));
        if (i > 1) pos -= back(k(t, SHIFT[1], SHIFT[1] + 0.45));
        set(B, -0.22, 1.32 - pos * 0.37, 0.3, 0, 0.06, 0, 1);
      } else {
        set(B, i === 4 ? 0.6 : 0.68, i === 4 ? 0.024 : 0.052, i === 4 ? 0.4 : 0.34, -Math.PI / 2 + 0.06, i === 4 ? 0.12 : -0.1, 0, 0.8);
      }
      mix(A, B, q);
      if (i > 0) dim = lerp(dim, cd.act ? 1 : 0.62, q);
      // Worked off: the button presses, the card slides out of the queue.
      let fade = 1;
      if (i < 2) {
        const e = eio(k(t, EXIT[i], EXIT[i] + 0.45));
        A.x -= e * 1.9; A.ry -= e * 0.5; A.z += e * 0.2; fade = 1 - k(t, EXIT[i] + 0.1, EXIT[i] + 0.45);
        if (t > EXIT[i] + 0.45) cd.g.visible = false;
      }
      cd.g.position.set(A.x, A.y, A.z);
      cd.g.rotation.set(A.rx, A.ry, A.rz);
      cd.g.scale.setScalar(Math.max(0.001, A.s));

      // Morph from the prototype face to strip, tile and button.
      const m0 = i === 0 ? 3.25 : 5.4 + i * 0.05;
      const mo = eo(k(t, m0, m0 + 0.35));
      cd.oldF.material.opacity = (1 - mo) * fade;
      cd.oldF.material.color.setScalar(dim);
      cd.newF.material.opacity = mo * fade;
      cd.newF.material.color.setScalar(dim);
      const layers = [cd.strip, cd.tile, cd.btn];
      layers.forEach((L, j) => {
        if (!L) return;
        const ps = back(k(t, m0 + 0.1 + j * 0.08, m0 + 0.45 + j * 0.08));
        L.lg.visible = ps > 0.001;
        L.lg.scale.setScalar(Math.max(0.001, ps));
        const lift = i === 0 ? ex : 0;
        let z = CD / 2 + 0.008 + lift * [0.1, 0.2, 0.3][j];
        if (j === 2 && i < 2) z -= 0.014 * Math.sin(Math.PI * k(t, PRESS[i] - 0.12, PRESS[i] + 0.12));
        L.lg.position.set(L.x, L.y + lift * (j === 0 ? 0.05 : 0), z);
        L.f.material.opacity = fade;
        L.f.material.color.setScalar(dim);
      });
      if (cd.btn) cd.btn.base.material.emissiveIntensity = 0.25 + (i < 2 ? 1.6 * Math.sin(Math.PI * k(t, PRESS[i] - 0.1, PRESS[i] + 0.25)) : 0);
      // Urgency halo: off while every card looks the same, on once the strip carries it.
      cd.halo.material.opacity = (cd.act ? 0.32 : 0.1) * mo * fade * dim;
      cd.pop.material.opacity = i < 2 ? 0.95 * Math.sin(Math.PI * k(t, PRESS[i] - 0.05, PRESS[i] + 0.35)) : 0;
    });

    // A coral light rides with whatever is top of the queue.
    const top0 = t < EXIT[0] + 0.2 ? 0 : t < EXIT[1] + 0.2 ? 1 : 2;
    cards[top0].g.getWorldPosition(wv);
    urgent.position.set(wv.x, wv.y, wv.z + 0.35);
    urgent.color.copy(CCOL[top0]);
    urgent.intensity = 1.6 * eo(k(t, 6.2, 6.6)) * (1 - 0.6 * Math.sin(Math.PI * k(t, EXIT[0], EXIT[0] + 0.5)) - 0.6 * Math.sin(Math.PI * k(t, EXIT[1], EXIT[1] + 0.5)));

    // Captions
    show(capAgent, eo(k(t, 0.5, 0.9)) * (1 - k(t, 1.8, 2.1)), PH[0] - 0.08, 1.72, PH[2] + 0.05);
    show(capSame, eo(k(t, 2.4, 2.75)) * (1 - k(t, 3.0, 3.25)), -0.12, 0.3, 0.62);
    const c0 = cards[0].g;
    const capIn = (a) => eo(k(t, a, a + 0.3)) * (1 - k(t, 4.95, 5.2));
    wv.set(0, CHT / 2 + 0.17, 0.1 * ex); c0.localToWorld(wv); show(capStrip, capIn(3.95), wv.x, wv.y, wv.z);
    wv.set(-0.3, -CHT / 2 - 0.12, 0.2 * ex); c0.localToWorld(wv); show(capTile, capIn(4.15), wv.x, wv.y, wv.z);
    wv.set(0.3, -CHT / 2 - 0.27, 0.3 * ex); c0.localToWorld(wv); show(capBtn, capIn(4.35), wv.x, wv.y, wv.z);
    show(capAct, eo(k(t, 6.1, 6.45)) * (1 - k(t, 8.3, 8.55)), -0.22, 1.62, 0.3);
    show(capInfo, eo(k(t, 6.3, 6.65)), 0.64, 0.24, 0.42);
    const r = back(k(t, 8.45, 8.95));
    show(capRes, clamp(r), 0.12, 1.66 + (1 - clamp(r)) * 0.06, 0.3);
    capRes.scale.setScalar(Math.max(0.001, 0.9 + 0.1 * r));
    show(capSub, eo(k(t, 8.75, 9.1)), 0.12, 1.5, 0.3);
  }

  return { scene, camera, update, duration: D, poster: 4.75 };
}
