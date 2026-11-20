// MRM UX team lit loop, 10 s. "Building the team around the work."
// A long studio worktable at night under a row of pendant lamps, a whiteboard behind it. Beat one is the
// first jam in 2019: one lamp, two designers (a veteran and a newcomer side by side), a timer running down
// and sticky notes flying onto the board as fast as they can think. Beat two keeps changing the format:
// a table card flips through 2020 to 2023, lamps come on down the table, coffee mugs arrive and new people
// in new colors join. Beat three opens the tools: Figma 101, 201 and 301 drop onto the table as steps,
// and people from every department fill the ends. Beat four pulls back on the whole lit table.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const FLOOR = -0.42;
const INK = '#1d1422', PAPER = '#f3eee5', MINT = '#5fe0c0', CORAL = '#ff7158';
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';

// People around the table: [x, z, appears at, color, size]. The first two are the 2019 jam: a veteran
// beside a newcomer. UX joins in teal and blue; groups outside UX and then every department add colors.
const FIGS = [
  [-0.2, -0.74, 0.45, 0x13a58f, 1.06],
  [0.22, -0.74, 0.62, 0x63e3c3, 0.9],
  [-0.64, -0.74, 3.8, 0x3cb8ff, 1.0],
  [0.66, -0.74, 3.95, 0x2f7fe0, 1.02],
  [-1.1, -0.74, 4.45, 0xff7158, 0.98],
  [1.1, -0.74, 4.6, 0xffc23a, 0.95],
  [-1.64, -0.22, 5.05, 0xa58bff, 1.0],
  [1.64, -0.22, 5.2, 0xff6fae, 0.97],
  [-1.64, 0.3, 6.0, 0xff9a3c, 1.03],
  [1.64, 0.3, 6.15, 0x9be15d, 0.96],
  [-1.16, 0.82, 6.3, 0xffe066, 1.0],
  [1.16, 0.82, 6.45, 0x7b8cff, 1.02],
];
// The table card: one face per stage of the story. Every line comes from the case study.
const CARD = [
  ['2019', 'UX Jam Session', 'A quick challenge, very little time'],
  ['2020', 'Coffee and collaboration', 'Sessions adapted for home'],
  ['2021', 'Toronto and New York', 'Coffee sessions expand'],
  ['2022', 'Planning group: two to four', 'Inviting groups outside UX'],
  ['2023', 'AI and designing with lists', 'UX Unplugged office hours'],
  ['101 · 201 · 301', 'Figma courses', 'Open to every department'],
  ['2019 – 2025', 'Jams, courses, and small rituals', 'Open to every department'],
];
const FLIP = [3.15, 3.75, 4.35, 4.95, 5.7, 7.95];   // card flips to the next face
const FLIP_D = 0.5;
const YEARS = ['2019', '2020', '2021', '2022', '2023', '2024', '2025'];
const YT = [0, 3.4, 4.0, 4.6, 5.2, 6.8, 7.3];       // board timeline reaches each year
const PX = [-1.2, -0.6, 0, 0.6, 1.2];                // pendant lamps
const LON = [4.4, 3.2, 0.35, 3.35, 4.55];           // when each lamp comes on
const COURSES = [['101', MINT, 0x5fe0c0], ['201', '#3cb8ff', 0x3cb8ff], ['301', '#a58bff', 0xa58bff]];
const CX = [0.0, 0.34, 0.68], CH = [0.05, 0.13, 0.21], CT = [5.75, 5.95, 6.15];
const MUGS = [[-0.52, -0.3], [0.5, -0.33], [-1.0, -0.26], [1.02, -0.3], [-1.36, 0.08], [1.34, 0.12]];
const NN = 56;

// Fit a line of text into a width by stepping its size down.
function fit(c, text, weight, size, family, maxW) {
  let s = size;
  c.font = `${weight} ${s}px ${family}`;
  while (s > 18 && c.measureText(text).width > maxW) { s -= 4; c.font = `${weight} ${s}px ${family}`; }
  return s;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e0812);
  scene.fog = new THREE.Fog(0x0e0812, 4.4, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler();

  // ----------------------------------------------------------- room
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#1c1418', { size: 256, speck: 0.06, blot: 0.1, seed: 21, repeat: 7 }), roughness: 0.36, metalness: 0.25 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = FLOOR; scene.add(floor);
  const wall = mesh(new THREE.PlaneGeometry(16, 7), std(0xffffff, { map: grainTex('#2a1630', { size: 256, speck: 0.05, blot: 0.14, seed: 22, repeat: 3 }), roughness: 0.9 }), { cast: false });
  wall.position.set(0, 2.2, -1.95); scene.add(wall);
  // A warm wash on the wall behind the board, so the board separates from the dark.
  const wash = glow(0xff8a5c, 1, 0.22, 0.5); wash.position.set(0, 0.95, -1.9); wash.scale.set(6.5, 2.6, 1); scene.add(wash);
  [[-3.1, 1.2, 0xffb070], [3.2, 1.3, 0x8a7bff]].forEach(([x, y, c]) => { const g = glow(c, 1.6, 0.3, 0.45); g.position.set(x, y, -1.9); scene.add(g); });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5a4a8a, 0x120a10, 0.35));
  const key = new THREE.SpotLight(0xffe0bc, 0, 0, 0.36, 0.75, 1.3);
  key.position.set(0.3, 2.9, 1.0); key.target.position.set(0, 0.2, -0.5);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.8; key.shadow.camera.far = 6; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7f9cff, 1.1); rim.position.set(-2.4, 1.6, -2.2); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xff9a6a, 0.6); rim2.position.set(2.6, 1.2, -1.8); scene.add(rim2);
  const lampL = [-0.9, 0, 0.9].map((x) => { const l = new THREE.PointLight(0xffc48a, 0, 3.2, 1.6); l.position.set(x, 1.42, -0.1); scene.add(l); return l; });

  // ----------------------------------------------------------- the table
  const wood = canvasTex(1024, 256, (c, w, h) => {
    c.fillStyle = '#5a3a26'; c.fillRect(0, 0, w, h);
    for (let p = 0; p < 4; p++) {
      const y = p * h / 4;
      c.fillStyle = `rgb(${84 + rnd(p, 31) * 22},${54 + rnd(p, 32) * 14},${34 + rnd(p, 33) * 10})`; c.fillRect(0, y, w, h / 4);
      for (let g = 0; g < 22; g++) {
        c.strokeStyle = `rgba(28,14,8,${0.07 + rnd(g, p + 40) * 0.14})`; c.lineWidth = 1 + rnd(g, p + 41) * 2;
        c.beginPath(); const gy = y + rnd(g, p + 42) * h / 4; c.moveTo(0, gy);
        for (let x = 0; x <= w; x += 48) c.lineTo(x, gy + Math.sin(x * 0.008 + g * 1.7) * 3);
        c.stroke();
      }
      c.fillStyle = 'rgba(12,6,3,0.75)'; c.fillRect(0, y, w, 2);
    }
  });
  const table = mesh(new RoundedBoxGeometry(3.1, 0.07, 1.1, 3, 0.025), std(0xffffff, { map: wood.tex, roughness: 0.42, metalness: 0.04 }));
  table.position.set(0, -0.035, 0); scene.add(table);
  const legs = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 0.35, 0.07), std(0x2a1d16, { roughness: 0.6 }), 4);
  [[-1.45, -0.45], [1.45, -0.45], [-1.45, 0.45], [1.45, 0.45]].forEach(([x, z], i) => { m4.makeTranslation(x, FLOOR + 0.175, z); legs.setMatrixAt(i, m4); });
  legs.castShadow = true; scene.add(legs);

  // ----------------------------------------------------------- the whiteboard
  const BW = 2.9, BH = 1.05, BY = 0.85, BZ = -0.96;
  const boardTex = canvasTex(1024, 372);
  const frame = mesh(new RoundedBoxGeometry(BW + 0.07, BH + 0.07, 0.03, 2, 0.012), std(0x9a9ca4, { metalness: 0.9, roughness: 0.3 }));
  frame.position.set(0, BY, BZ - 0.02); scene.add(frame);
  const boardFace = new THREE.Mesh(new THREE.PlaneGeometry(BW, BH), std(0xffffff, { map: boardTex.tex, roughness: 0.32, emissive: 0xffffff, emissiveMap: boardTex.tex, emissiveIntensity: 0.07 }));
  boardFace.position.set(0, BY, BZ); boardFace.receiveShadow = true; scene.add(boardFace);
  const stands = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.018, 0.018, BY - FLOOR, 12), std(0x9a9ca4, { metalness: 0.9, roughness: 0.3 }), 2);
  [-1.32, 1.32].forEach((x, i) => { m4.makeTranslation(x, (BY + FLOOR) / 2, BZ - 0.05); stands.setMatrixAt(i, m4); });
  stands.castShadow = true; scene.add(stands);
  const YX = YEARS.map((_, i) => 96 + i * 139);
  let bKey = '';
  const drawBoard = (t) => {
    const yi = YT.filter((y) => t >= y).length - 1;
    const p = yi > 0 ? eo(k(t, YT[yi], YT[yi] + 0.45)) : 1;
    const key2 = yi + '|' + Math.round(p * 20);
    if (key2 === bKey) return; bKey = key2;
    boardTex.redraw((c, w, h) => {
      c.fillStyle = PAPER; c.fillRect(0, 0, w, h);
      c.fillStyle = 'rgba(40,30,50,0.09)';
      for (let x = 24; x < w; x += 32) for (let y = 104; y < 280; y += 32) c.fillRect(x, y, 2, 2);
      c.fillStyle = INK; c.font = `800 56px ${SANS}`; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '2px';
      c.fillText('UX JAM SESSION', 40, 52);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = 'rgba(29,20,34,0.5)'; c.font = `700 26px ${MONO}`; c.textAlign = 'right'; c.fillText('MRM UX TEAM', w - 40, 54); c.textAlign = 'left';
      c.fillStyle = CORAL; c.fillRect(40, 88, 120, 6);
      // Timeline of rituals along the bottom of the board.
      const ty = 324, fx = yi > 0 ? lerp(YX[yi - 1], YX[yi], p) : YX[0];
      c.fillStyle = 'rgba(29,20,34,0.14)'; roundRect(c, YX[0], ty - 34, YX[6] - YX[0], 6, 3); c.fill();
      c.fillStyle = INK; roundRect(c, YX[0], ty - 34, fx - YX[0] + 1, 6, 3); c.fill();
      c.font = `800 44px ${MONO}`; c.textAlign = 'center';
      YEARS.forEach((y, i) => {
        const on = i === yi, past = i < yi;
        if (on) {
          c.fillStyle = CORAL; roundRect(c, YX[i] - 66, ty - 6, 132, 52, 26); c.fill();
          c.fillStyle = '#fff';
        } else c.fillStyle = past ? INK : 'rgba(29,20,34,0.28)';
        c.fillText(y, YX[i], ty + 21);
        c.beginPath(); c.arc(YX[i], ty - 31, on ? 11 : 7, 0, 7); c.fillStyle = i <= yi ? (on ? CORAL : INK) : '#cfc6bb'; c.fill();
      });
      c.textAlign = 'left';
    });
  };

  // ----------------------------------------------------------- pendant lamps
  const shades = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.15, 0.14, 32, 1, true), std(0x1d1b22, { metalness: 0.75, roughness: 0.32, side: THREE.DoubleSide }), PX.length);
  const cords = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.004, 0.004, 1.4, 6), std(0x111111, { roughness: 0.6 }), PX.length);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.035, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), PX.length);
  const bulbGlow = PX.map((x) => { const g = glow(0xffc07a, 0.9, 0, 0.3); g.position.set(x, 1.56, -0.1); scene.add(g); return g; });
  PX.forEach((x, i) => {
    m4.makeTranslation(x, 1.64, -0.1); shades.setMatrixAt(i, m4);
    m4.makeTranslation(x, 2.41, -0.1); cords.setMatrixAt(i, m4);
    m4.makeTranslation(x, 1.58, -0.1); bulbs.setMatrixAt(i, m4);
    bulbs.setColorAt(i, new THREE.Color(0x221810));
  });
  scene.add(shades, cords, bulbs);

  // ----------------------------------------------------------- people
  const bodies = new THREE.InstancedMesh(new THREE.CapsuleGeometry(0.08, 0.34, 6, 16), std(0xffffff, { roughness: 0.42 }), FIGS.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.068, 24, 16), std(0xffffff, { roughness: 0.38 }), FIGS.length);
  const white = new THREE.Color(0xffffff);
  FIGS.forEach(([, , , col], i) => { const c = new THREE.Color(col); bodies.setColorAt(i, c); heads.setColorAt(i, c.clone().lerp(white, 0.3)); });
  bodies.castShadow = heads.castShadow = true; bodies.receiveShadow = heads.receiveShadow = true;
  bodies.frustumCulled = heads.frustumCulled = false;
  scene.add(bodies, heads);

  // ----------------------------------------------------------- sticky notes
  const scribble = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#fff'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,0.08)'; c.fillRect(0, 0, w, 18);
    c.strokeStyle = 'rgba(20,14,26,0.55)'; c.lineWidth = 4; c.lineCap = 'round';
    for (let r = 0; r < 3; r++) {
      c.beginPath(); let x = 18; c.moveTo(x, 44 + r * 26);
      const end = 18 + 92 * (0.55 + rnd(r, 70) * 0.45);
      while (x < end) { x += 6; c.lineTo(x, 44 + r * 26 + Math.sin(x * 0.5 + r * 2) * 3); }
      c.stroke();
    }
  }).tex;
  const notes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.12, 0.004), std(0xffffff, { map: scribble, roughness: 0.85 }), NN);
  notes.castShadow = true; notes.receiveShadow = true; notes.frustumCulled = false;
  scene.add(notes);
  // Board slots, filled from the middle outward so the cluster grows the way a jam does.
  const slots = [];
  for (let c = 0; c < 14; c++) for (let r = 0; r < 4; r++) {
    const i = c * 4 + r;
    slots.push([-1.235 + c * 0.19 + (rnd(i, 71) - 0.5) * 0.04, 0.64 + r * 0.145 + (rnd(i, 72) - 0.5) * 0.03, (rnd(i, 73) - 0.5) * 0.22]);
  }
  slots.sort((a, b) => (Math.abs(a[0]) + 0.6 * Math.abs(a[1] - 0.85)) - (Math.abs(b[0]) + 0.6 * Math.abs(b[1] - 0.85)));
  const launch = (i) => (i < 14 ? 0.95 + i * 0.15 : i < 36 ? 3.2 + (i - 14) * 0.1 : 5.5 + (i - 36) * 0.11);
  // Each note leaves from someone already at the table: ideas come from the people.
  const NOTE = Array.from({ length: NN }, (_, i) => {
    const L = launch(i);
    const avail = FIGS.map((f, j) => j).filter((j) => FIGS[j][2] < L - 0.3);
    const src = i < 14 ? i % 2 : avail[(i * 7) % avail.length];
    return { L, src, slot: slots[i] };
  });
  NOTE.forEach(({ src }, i) => notes.setColorAt(i, new THREE.Color(FIGS[src][3]).lerp(white, 0.12)));

  // ----------------------------------------------------------- coffee (2020)
  const mugGeo = new THREE.CylinderGeometry(0.045, 0.04, 0.09, 20); mugGeo.translate(0, 0.045, 0);
  const mugs = new THREE.InstancedMesh(mugGeo, std(0xffffff, { roughness: 0.3 }), MUGS.length);
  const handleGeo = new THREE.TorusGeometry(0.024, 0.007, 8, 16); handleGeo.translate(0.048, 0.048, 0);
  const handles = new THREE.InstancedMesh(handleGeo, std(0xffffff, { roughness: 0.3 }), MUGS.length);
  const coffeeGeo = new THREE.CircleGeometry(0.038, 20); coffeeGeo.rotateX(-Math.PI / 2); coffeeGeo.translate(0, 0.082, 0);
  const coffee = new THREE.InstancedMesh(coffeeGeo, std(0x2a160b, { roughness: 0.15 }), MUGS.length);
  const MUGC = [0xf3eee5, 0xff7158, 0x63e3c3, 0xf3eee5, 0xffc23a, 0xa58bff];
  MUGS.forEach((_, i) => { mugs.setColorAt(i, new THREE.Color(MUGC[i])); handles.setColorAt(i, new THREE.Color(MUGC[i])); });
  [mugs, handles, coffee].forEach((m) => { m.castShadow = true; m.frustumCulled = false; scene.add(m); });

  // ----------------------------------------------------------- the jam timer (2019)
  const timer = new THREE.Group();
  const tBody = mesh(new RoundedBoxGeometry(0.24, 0.18, 0.09, 3, 0.03), std(0xff7158, { roughness: 0.32 }));
  timer.add(tBody);
  const tFace = canvasTex(256, 256);
  const tScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.15), new THREE.MeshBasicMaterial({ map: tFace.tex, toneMapped: false }));
  tScreen.position.z = 0.0455; timer.add(tScreen);
  const tGlow = glow(0x63e3c3, 0.6, 0, 0.35); tGlow.position.z = 0.06; timer.add(tGlow);
  timer.position.set(0.4, 0.09, 0.24);
  timer.rotation.y = Math.atan2(0.0 - 0.4, 2.1 - 0.24);
  scene.add(timer);
  let tKey = '';
  const drawTimer = (t) => {
    const left = 1 - k(t, 0.8, 2.95), done = t > 2.95;
    const key2 = Math.round(left * 90) + '|' + (done ? Math.floor(t * 4) % 2 : 2);
    if (key2 === tKey) return; tKey = key2;
    tFace.redraw((c, w, h) => {
      c.fillStyle = '#140d18'; c.fillRect(0, 0, w, h);
      c.lineWidth = 22; c.lineCap = 'round';
      c.strokeStyle = 'rgba(255,255,255,0.1)'; c.beginPath(); c.arc(w / 2, h / 2, 92, 0, Math.PI * 2); c.stroke();
      if (left > 0.002) { c.strokeStyle = MINT; c.beginPath(); c.arc(w / 2, h / 2, 92, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * left); c.stroke(); }
      c.fillStyle = done && Math.floor(t * 4) % 2 === 0 ? MINT : '#fff';
      c.font = `800 62px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('JAM', w / 2, h / 2 + 4);
    });
  };

  // ----------------------------------------------------------- the table card that flips through the years
  const card = new THREE.Group();
  const cardBase = mesh(new RoundedBoxGeometry(0.5, 0.035, 0.13, 2, 0.012), std(0x2a1d16, { roughness: 0.5 }));
  cardBase.position.y = 0.0175; card.add(cardBase);
  const flipper = new THREE.Group(); flipper.position.y = 0.035 + 0.25; card.add(flipper);
  const slab = mesh(new RoundedBoxGeometry(0.8, 0.5, 0.012, 2, 0.02), std(0x17101c, { roughness: 0.35, metalness: 0.2 }));
  flipper.add(slab);
  const faces = [0, 1].map((side) => {
    const ct = canvasTex(768, 480);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.78, 0.4875), std(0xffffff, { map: ct.tex, roughness: 0.45, emissive: 0xffffff, emissiveMap: ct.tex, emissiveIntensity: 0.32, transparent: true }));
    m.position.z = side ? -0.0065 : 0.0065; m.rotation.y = side ? Math.PI : 0;
    flipper.add(m);
    return { ct, shown: -1 };
  });
  const drawFace = (f, idx) => {
    if (f.shown === idx) return; f.shown = idx;
    const [big, l1, l2] = CARD[idx];
    f.ct.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = '#1a121f'; roundRect(c, 0, 0, w, h, 26); c.fill();
      c.fillStyle = idx === 5 ? MINT : CORAL; c.fillRect(48, 54, 90, 8);
      c.fillStyle = PAPER; c.textBaseline = 'alphabetic';
      fit(c, big, 800, 176, SANS, w - 96); c.fillText(big, 44, 236);
      c.fillStyle = '#fff'; fit(c, l1, 700, 60, SANS, w - 96); c.fillText(l1, 48, 330);
      c.fillStyle = 'rgba(243,238,229,0.62)'; fit(c, l2, 600, 44, SANS, w - 96); c.fillText(l2, 48, 400);
    });
  };
  card.position.set(-0.46, 0, 0.2);
  card.rotation.y = Math.atan2(0.05 + 0.46, 2.2 - 0.2);
  scene.add(card);

  // ----------------------------------------------------------- Figma 101, 201, 301: steps that drop onto the table
  const courses = COURSES.map(([num, css, hex], i) => {
    const g = new THREE.Group();
    const plinth = mesh(new RoundedBoxGeometry(0.32, CH[i], 0.2, 2, 0.015), std(0xe9e1d3, { roughness: 0.6 }));
    plinth.position.y = CH[i] / 2; g.add(plinth);
    const tile = mesh(new RoundedBoxGeometry(0.32, 0.24, 0.025, 2, 0.012), std(0x1a1420, { roughness: 0.25, metalness: 0.3 }));
    tile.position.set(0, CH[i] + 0.12, 0.02); g.add(tile);
    const face = canvasTex(384, 288, (c, w, h) => {
      const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#221829'); gr.addColorStop(1, '#130d17');
      c.fillStyle = gr; roundRect(c, 0, 0, w, h, 20); c.fill();
      c.fillStyle = css; c.fillRect(0, 0, w, 14);
      c.fillStyle = css; c.font = `700 40px ${MONO}`; c.textBaseline = 'middle'; c.fillText('FIGMA', 26, 62);
      c.fillStyle = '#fff'; c.font = `800 150px ${SANS}`; c.fillText(num, 22, 186);
    });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.225), new THREE.MeshBasicMaterial({ map: face.tex, toneMapped: false, transparent: true }));
    fm.position.set(0, CH[i] + 0.12, 0.0335); g.add(fm);
    const halo = glow(hex, 0.9, 0, 0.4); halo.position.set(0, CH[i] + 0.12, -0.06); g.add(halo);
    const land = glow(hex, 0.7, 0, 0.35); land.position.set(0, 0.01, 0.12); land.scale.set(0.9, 0.25, 1); g.add(land);
    g.position.set(CX[i], 0, 0.04);
    g.rotation.y = Math.atan2(0.15 - CX[i], 2.2);
    scene.add(g);
    return { g, halo, land };
  });

  // ----------------------------------------------------------- dust in the lamp light
  const DN = 160, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd2a0, size: 0.01, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.1, 1.0, 2.25]], [2.9, [0.0, 0.95, 2.08], (x) => x],
    [5.4, [-0.4, 1.12, 2.55]], [7.6, [0.3, 0.88, 1.95]],
    [9.2, [0.05, 1.32, 3.35]], [10, [0.0, 1.36, 3.45], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.05, 0.44, -0.38]], [2.9, [-0.04, 0.45, -0.4], (x) => x],
    [5.4, [0.0, 0.48, -0.45]], [7.6, [0.04, 0.36, -0.1]],
    [9.2, [0.0, 0.5, -0.4]], [10, [0.0, 0.5, -0.4], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), S = new THREE.Vector3(), P = new THREE.Vector3(), M = new THREE.Vector3(), white2 = new THREE.Color(), warm = new THREE.Color(0xfff0d8), off = new THREE.Color(0x221810);
  const lv = [0, 0, 0, 0, 0];
  const figPos = (i, t) => {
    const [x, z, A, , sz] = FIGS[i];
    const p = k(t, A, A + 0.8);
    return { x, z, p, sz, show: t >= A };
  };

  function update(t) {
    const cp = camPos(t), cq = camTgt(t);
    camera.position.set(cp[0] + Math.sin(t * 1.1) * 0.008, cp[1] + Math.sin(t * 1.6 + 1) * 0.006, cp[2]);
    tgt.set(cq[0], cq[1], cq[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [5.4, 35], [7.6, 33], [9.2, 37], [10, 37]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Light: the key starts as one pool on the first jam and widens as the team grows.
    key.intensity = 30 * clamp(back(k(t, 0.25, 0.75)));
    key.angle = kf(t, [[0, 0.36], [2.9, 0.38], [5.3, 0.72], [7.8, 0.9]]);
    PX.forEach((_, i) => {
      const p = k(t, LON[i], LON[i] + 0.35);
      const flick = p > 0 && p < 1 ? (Math.sin(t * 90 + i * 3) > 0 ? 1 : 0.35) : 1;
      lv[i] = clamp(back(p)) * flick;
      bulbs.setColorAt(i, white2.copy(off).lerp(warm, clamp(lv[i])));
      bulbGlow[i].material.opacity = 0.75 * lv[i];
    });
    bulbs.instanceColor.needsUpdate = true;
    lampL[0].intensity = 1.5 * (lv[0] + lv[1]) / 2;
    lampL[1].intensity = 2.0 * lv[2];
    lampL[2].intensity = 1.5 * (lv[3] + lv[4]) / 2;

    // People: each one drops in with a spring, bobs a little, squashes when they throw a note,
    // and in the last beat the whole table does a little wave.
    for (let i = 0; i < FIGS.length; i++) {
      const { x, z, p, sz, show } = figPos(i, t);
      let sq = 0;
      for (let n = 0; n < NN; n++) if (NOTE[n].src === i) sq = Math.max(sq, Math.sin(Math.PI * k(t, NOTE[n].L - 0.12, NOTE[n].L + 0.16)));
      const hop = Math.sin(Math.PI * k(t, 8.15 + i * 0.05, 8.5 + i * 0.05));
      const s = show ? Math.max(0.001, spring(p)) * sz : 0.001;
      const yoff = (1 - eo(p)) * 0.3 + hop * 0.07;
      const rz = Math.sin(t * 1.3 + i * 1.9) * 0.035;
      const sy = s * (1 - sq * 0.1), sxz = s * (1 + sq * 0.07);
      const hb = 0.25 * sy, hh = 0.5 * sy + 0.064 * s;
      q4.setFromEuler(e4.set(0, 0, rz));
      m4.compose(p4.set(x - Math.sin(rz) * hb, FLOOR + yoff + Math.cos(rz) * hb, z), q4, s4.set(sxz, sy, sxz));
      bodies.setMatrixAt(i, m4);
      m4.compose(p4.set(x - Math.sin(rz) * hh, FLOOR + yoff + Math.cos(rz) * hh, z), q4, s4.set(s, s, s));
      heads.setMatrixAt(i, m4);
    }
    bodies.instanceMatrix.needsUpdate = true; heads.instanceMatrix.needsUpdate = true;

    // Notes: thrown from a person's hands in an arc, slapped onto the board, a wobble to settle.
    for (let i = 0; i < NN; i++) {
      const { L, src, slot } = NOTE[i];
      if (t < L) { m4.makeScale(0.0001, 0.0001, 0.0001); notes.setMatrixAt(i, m4); continue; }
      const f = k(t, L, L + 0.55), e = 1 - (1 - f) * (1 - f);
      S.set(FIGS[src][0], 0.12, FIGS[src][1] + 0.1);
      P.set(slot[0], slot[1], BZ + 0.004);
      M.set((S.x + P.x) / 2, Math.max(S.y, P.y) + 0.32, lerp(S.z, P.z, 0.5) + 0.2);
      p4.set(
        (1 - e) * (1 - e) * S.x + 2 * (1 - e) * e * M.x + e * e * P.x,
        (1 - e) * (1 - e) * S.y + 2 * (1 - e) * e * M.y + e * e * P.y,
        (1 - e) * (1 - e) * S.z + 2 * (1 - e) * e * M.z + e * e * P.z,
      );
      const settle = 1 - spring(k(t, L + 0.55, L + 1.15));
      const tum = 1 - e;
      e4.set(tum * (rnd(i, 81) - 0.5) * 3 - 0.35 * tum, tum * (rnd(i, 82) - 0.5) * 3, slot[2] + tum * 2.2 * (rnd(i, 83) - 0.5) + (f >= 1 ? settle * 0.35 : 0));
      q4.setFromEuler(e4);
      const slap = Math.sin(Math.PI * k(t, L + 0.5, L + 0.72));
      const sc = lerp(0.7, 1, e) * (1 + slap * 0.18);
      m4.compose(p4, q4, s4.set(sc, sc, sc));
      notes.setMatrixAt(i, m4);
    }
    notes.instanceMatrix.needsUpdate = true;

    // Coffee arrives with 2020.
    MUGS.forEach(([x, z], i) => {
      const p = k(t, 3.3 + i * 0.07, 4.0 + i * 0.07);
      const s = t < 3.3 + i * 0.07 ? 0.0001 : Math.max(0.0001, spring(p));
      q4.setFromEuler(e4.set(0, rnd(i, 91) * 6.28, 0));
      m4.compose(p4.set(x, (1 - eo(p)) * 0.25, z), q4, s4.set(s, s, s));
      mugs.setMatrixAt(i, m4); handles.setMatrixAt(i, m4); coffee.setMatrixAt(i, m4);
    });
    mugs.instanceMatrix.needsUpdate = handles.instanceMatrix.needsUpdate = coffee.instanceMatrix.needsUpdate = true;

    // Timer: pops on, runs down through the first jam, flashes when time is up, leaves for the courses.
    const tin = spring(k(t, 0.55, 1.25)), tout = ei(k(t, 5.2, 5.5));
    timer.scale.setScalar(Math.max(0.001, tin * (1 - tout)));
    timer.visible = t > 0.55 && t < 5.5;
    drawTimer(t);
    tGlow.material.opacity = 0.9 * Math.exp(-3 * Math.max(0, t - 2.95)) * (t > 2.95 ? 1 : 0) + 0.25 * clamp(tin) * (1 - tout);

    // Table card: rises with the first jam, flips to each new year and format.
    const cin = spring(k(t, 0.6, 1.4));
    card.scale.setScalar(Math.max(0.001, cin));
    card.position.y = (1 - eo(k(t, 0.6, 1.2))) * 0.2;
    let s = 0;
    while (s < FLIP.length && t >= FLIP[s] + FLIP_D) s++;
    const mid = s < FLIP.length && t >= FLIP[s];
    const fp = mid ? back(k(t, FLIP[s], FLIP[s] + FLIP_D)) : 0;
    flipper.rotation.y = (s + fp) * Math.PI;
    const a = s, b = mid ? s + 1 : s;
    drawFace(faces[0], a % 2 === 0 ? a : b);
    drawFace(faces[1], a % 2 === 1 ? a : b);
    flipper.position.y = 0.285 + Math.sin(Math.PI * clamp(fp)) * 0.04;

    // Courses: Figma 101, 201, 301 drop in as rising steps and light up.
    courses.forEach(({ g, halo, land }, i) => {
      const p = k(t, CT[i], CT[i] + 0.9);
      g.visible = t >= CT[i];
      g.position.y = (1 - spring(p)) * 0.7;
      g.scale.setScalar(Math.max(0.001, clamp(p * 4)));
      halo.material.opacity = 0.55 * eo(k(t, CT[i] + 0.3, CT[i] + 0.8)) * (1 + 0.15 * Math.sin(t * 3 + i));
      land.material.opacity = 0.9 * Math.exp(-5 * Math.max(0, t - CT[i] - 0.3)) * (t > CT[i] + 0.3 ? 1 : 0);
    });

    drawBoard(t);

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (rnd(i, 61) - 0.5) * 3.2 + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = 0.15 + rnd(i, 62) * 1.5 + Math.sin(t * 0.4 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -0.7 + rnd(i, 63) * 1.4 + Math.cos(t * 0.25 + i) * 0.08;
    }
    dGeo.attributes.position.needsUpdate = true;
    dust.material.opacity = 0.25 + 0.45 * clamp(k(t, 0.4, 5));
  }

  return { scene, camera, update, duration: D, poster: 9.1 };
}
