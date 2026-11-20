// General Motors Lab313 rebrand lit loop, 10 s. "One mark, pressed onto everything."
// A Detroit brick loft after dark. Two orange neon brackets draw themselves onto the wall and LAB313
// buzzes on between them. Below, a steel stamping gantry rides its rail along the workbench and presses
// the bracket mark onto three blank pieces in turn: a slide template, a tablet that wakes into the website,
// and a business card; each print blooms out from the die with a ring of orange light. The voice comes
// next: BOLD, CURIOUS and HUMAN flick on as small neon plaques under the sign. The pieces stand up into
// the display ledge, the card spins to face us, and the project's name settles in front of the bench.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const ORANGE = '#ff5a1f', ORANGE_H = 0xff5a1f, NEON_W = 0xfff0e0, SHEET = '#e6ded3', INK = '#1d1a19';
const BG = 0x0d0a0a;
const WALL_Z = -1.25, SIGN_Z = -1.17, SIGN_Y = 2.17;
const BENCH_Y = 0.9;                      // bench top surface
const LIE_Z = -0.36, LEDGE_Z = -0.1;      // where the pieces lie, and the ledge they stand up into
const RAIL_Z = -0.72, RAIL_Y = 1.24;
// The three pieces the mark is pressed onto, in order: x on the bench, size, impact time, stand-up time.
const PRESS = [2.85, 3.95, 5.0];
const PIECES = [
  { x: -0.78, w: 0.64, h: 0.36, th: 0.012, hit: PRESS[0], up: 6.55 },  // slide template
  { x: 0.02, w: 0.46, h: 0.32, th: 0.022, hit: PRESS[1], up: 6.72 },   // tablet with the website
  { x: 0.7, w: 0.3, h: 0.18, th: 0.008, hit: PRESS[2], up: 6.9 },      // business card
];
const VOICE = ['BOLD', 'CURIOUS', 'HUMAN'];
const VOICE_ON = [5.75, 6.05, 6.35];

// Neon that catches: a few stuttering blinks, then steady with a faint hum. Deterministic in t.
function flick(t, t0, seed) {
  if (t < t0) return 0;
  const u = t - t0;
  if (u > 0.42) return 0.96 + 0.04 * Math.sin(t * 7.3 + seed);
  const step = Math.floor(u * 34);
  return rnd(step, seed) < 0.25 + u * 1.8 ? 1 : 0.08;
}

// A polyline with its corners rounded by radius r, as one curve a neon tube can follow.
function roundedPath(pts, r) {
  const cp = new THREE.CurvePath();
  let prev = pts[0].clone();
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const p1 = b.clone().addScaledVector(a.clone().sub(b).normalize(), r);
    const p2 = b.clone().addScaledVector(c.clone().sub(b).normalize(), r);
    cp.add(new THREE.LineCurve3(prev, p1));
    cp.add(new THREE.QuadraticBezierCurve3(p1, b.clone(), p2));
    prev = p2;
  }
  cp.add(new THREE.LineCurve3(prev, pts[pts.length - 1].clone()));
  return cp;
}

// Old Detroit brick, tiled: 8 bricks by 12 courses per tile so the running bond wraps cleanly.
function drawBricks(c, w, h, bump) {
  const BW = 128, BH = h / 12, M = 4;
  const REDS = ['#6b2e22', '#7a3626', '#5a2820', '#83402c', '#4a221c', '#6e3a2c', '#5e2f25'];
  c.fillStyle = bump ? '#000' : '#2c2421'; c.fillRect(0, 0, w, h);
  for (let r = 0; r < 12; r++) {
    const off = (r % 2) * BW / 2;
    for (let i = -1; i <= w / BW; i++) {
      const id = r * 17 + ((i + 8) % 8);
      const x = i * BW + off, y = r * BH;
      if (bump) { const v = 150 + Math.floor(rnd(id, 3) * 90); c.fillStyle = `rgb(${v},${v},${v})`; }
      else c.fillStyle = REDS[Math.floor(rnd(id, 1) * REDS.length)];
      c.fillRect(x + M / 2, y + M / 2, BW - M, BH - M);
      if (!bump) {
        // A lighter or sooty face on some bricks.
        c.fillStyle = rnd(id, 2) > 0.6 ? 'rgba(255,220,190,0.08)' : 'rgba(0,0,0,0.18)';
        c.fillRect(x + M / 2, y + M / 2, (BW - M) * (0.4 + rnd(id, 4) * 0.6), BH - M);
      }
    }
  }
  const n = bump ? 9000 : 16000;
  for (let i = 0; i < n; i++) {
    const v = rnd(i, bump ? 41 : 42) > 0.5 ? 255 : 0;
    c.fillStyle = `rgba(${v},${v},${v},${rnd(i, 43) * (bump ? 0.35 : 0.14)})`;
    c.fillRect(rnd(i, 44) * w, rnd(i, 45) * h, 2, 2);
  }
}

// The bracket mark, drawn into a canvas box: the left bracket, the wordmark beside it.
function drawMark(c, x, y, s, fg, accent, word = true) {
  c.strokeStyle = accent; c.lineWidth = s * 0.09; c.lineJoin = 'miter'; c.lineCap = 'butt';
  c.beginPath(); c.moveTo(x + s * 0.32, y); c.lineTo(x, y); c.lineTo(x + 0, y + s); c.lineTo(x + s * 0.32, y + s); c.stroke();
  if (!word) return;
  c.fillStyle = fg; c.font = `800 ${Math.round(s * 0.48)}px ${MONO}`; c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = Math.round(s * 0.03) + 'px';
  c.fillText('LAB313', x + s * 0.48, y + s * 0.53);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
}

// The printed side of each piece, drawn once into its own canvas.
function drawSlide(c, w, h) {
  c.fillStyle = SHEET; c.fillRect(0, 0, w, h);
  drawMark(c, 64, 60, 110, INK, ORANGE);
  c.fillStyle = INK; roundRect(c, 64, 250, 560, 34, 17); c.fill(); roundRect(c, 64, 306, 420, 34, 17); c.fill();
  c.fillStyle = '#8a8079'; roundRect(c, 64, 392, 360, 18, 9); c.fill(); roundRect(c, 64, 428, 250, 18, 9); c.fill();
  // A photo block on the right, warm light on dark.
  const g = c.createLinearGradient(680, 60, 960, 520); g.addColorStop(0, '#2b2422'); g.addColorStop(1, '#5a2a1c');
  c.fillStyle = g; roundRect(c, 690, 60, 270, 456, 14); c.fill();
  c.strokeStyle = ORANGE; c.lineWidth = 8; c.beginPath(); c.arc(825, 290, 70, -0.6, Math.PI * 1.3); c.stroke();
  c.fillStyle = ORANGE; c.fillRect(64, h - 46, 120, 8);
}
function drawSite(c, w, h) {
  c.fillStyle = '#efe8df'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#d9d0c5'; c.fillRect(0, 0, w, 74);
  ['#c46a4a', '#d4a24a', '#7aa06a'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(40 + i * 34, 37, 11, 0, 7); c.fill(); });
  c.fillStyle = '#f7f2ea'; roundRect(c, 160, 22, w - 200, 30, 15); c.fill();
  // Hero band: the mark, white on ink.
  c.fillStyle = INK; roundRect(c, 40, 104, w - 80, 300, 14); c.fill();
  c.fillStyle = '#f5ede4'; c.font = `800 92px ${MONO}`; c.textBaseline = 'middle';
  if ('letterSpacing' in c) c.letterSpacing = '6px';
  c.fillText('[ LAB313 ]', 90, 254);
  if ('letterSpacing' in c) c.letterSpacing = '0px';
  c.fillStyle = ORANGE; c.fillRect(90, 330, 90, 8);
  c.fillStyle = '#8a8079'; roundRect(c, 40, 452, 520, 24, 12); c.fill(); roundRect(c, 40, 498, 400, 24, 12); c.fill();
  c.fillStyle = ORANGE; roundRect(c, 40, 566, 200, 56, 28); c.fill();
  for (let i = 0; i < 3; i++) { c.fillStyle = '#ddd3c7'; roundRect(c, 620 + i * 130, 452, 110, 170, 12); c.fill(); }
}
function drawCard(c, w, h) {
  c.fillStyle = SHEET; c.fillRect(0, 0, w, h);
  drawMark(c, 48, 52, 96, INK, ORANGE);
  c.fillStyle = '#7d736c'; roundRect(c, 48, 236, 260, 16, 8); c.fill(); roundRect(c, 48, 268, 190, 16, 8); c.fill();
  c.fillStyle = ORANGE; c.fillRect(0, h - 14, w, 14);
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 5.5, 12);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the loft
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#262221', { size: 256, speck: 0.12, blot: 0.12, seed: 7, repeat: 7 }), roughness: 0.42, metalness: 0.15 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const brick = canvasTex(1024, 512, (c, w, h) => drawBricks(c, w, h, false)).tex;
  const brickBump = canvasTex(512, 256, (c, w, h) => drawBricks(c, w, h, true)).tex;
  [brick, brickBump].forEach((tx) => { tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(3.8, 4.8); });
  const wall = mesh(new THREE.PlaneGeometry(7, 4.4), std(0xffffff, { map: brick, bumpMap: brickBump, bumpScale: 1.2, roughness: 0.92 }), { cast: false });
  wall.position.set(0, 2.2, WALL_Z); scene.add(wall);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x6a5d58, 0x0a0707, 0.3));
  const key = new THREE.SpotLight(0xffd9b4, 26, 0, 0.62, 0.65, 1.3);
  key.position.set(-1.1, 3.0, 1.6); key.target.position.set(0.0, 0.95, -0.35);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1.2; key.shadow.camera.far = 8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7fa4ff, 1.25); rim.position.set(2.6, 2.6, -2.2); scene.add(rim);
  const neonL = new THREE.PointLight(ORANGE_H, 0, 4.2, 1.5); neonL.position.set(0, SIGN_Y, SIGN_Z + 0.35); scene.add(neonL);
  const wordL = new THREE.PointLight(0xffe2c4, 0, 3.2, 1.6); wordL.position.set(0, SIGN_Y, SIGN_Z + 0.3); scene.add(wordL);
  const pressL = new THREE.PointLight(ORANGE_H, 0, 1.6, 1.6); scene.add(pressL);

  // ----------------------------------------------------------- the sign
  const glassM = std(0x8a8580, { roughness: 0.15, metalness: 0.1, transparent: true, opacity: 0.55 });
  const neonM = new THREE.MeshBasicMaterial({ color: ORANGE_H, toneMapped: false });
  const BR_TOP = SIGN_Y + 0.31, BR_BOT = SIGN_Y - 0.31, BR_IN = 0.64, BR_OUT = 0.86;
  const brackets = [-1, 1].map((sg) => {
    const pts = [[sg * BR_IN, BR_TOP], [sg * BR_OUT, BR_TOP], [sg * BR_OUT, BR_BOT], [sg * BR_IN, BR_BOT]].map(([x, y]) => new THREE.Vector3(x, y, SIGN_Z));
    const curve = roundedPath(pts, 0.05);
    const glassT = mesh(new THREE.TubeGeometry(curve, 120, 0.021, 10), glassM, { cast: false });
    const litG = new THREE.TubeGeometry(curve, 120, 0.024, 10);
    const lit = new THREE.Mesh(litG, neonM);
    litG.setDrawRange(0, 0);
    scene.add(glassT, lit);
    return { lit, litG, curve };
  });
  // Stand-off mounts that hold the tubes off the brick.
  const mountIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), std(0x9a9a9a, { metalness: 1, roughness: 0.35 }), 8);
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI / 2, 0, 0)), s = new THREE.Vector3(1, 1, 1);
    let i = 0;
    [-1, 1].forEach((sg) => [[BR_IN + 0.05, BR_TOP], [BR_OUT, SIGN_Y + 0.12], [BR_OUT, SIGN_Y - 0.12], [BR_IN + 0.05, BR_BOT]].forEach(([x, y]) => {
      m4.compose(new THREE.Vector3(sg * x, y, SIGN_Z - 0.04), q, s); mountIM.setMatrixAt(i++, m4);
    }));
  }
  scene.add(mountIM);
  // The wall wash behind the brackets: a soft orange halo painted from the same shape.
  const halo = (draw, color) => {
    const t = canvasTex(1024, 512, (c, w, h) => { c.clearRect(0, 0, w, h); c.shadowColor = '#fff'; c.shadowBlur = 60; c.strokeStyle = '#fff'; c.fillStyle = '#fff'; draw(c, w, h); c.shadowBlur = 120; draw(c, w, h); }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.3), new THREE.MeshBasicMaterial({ map: t, color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.position.set(0, SIGN_Y, WALL_Z + 0.01); scene.add(m); return m;
  };
  const toPx = (x, y) => [512 + (x / 2.6) * 1024, 256 - ((y - SIGN_Y) / 1.3) * 512];
  const bHalo = halo((c) => {
    c.lineWidth = 22;
    [-1, 1].forEach((sg) => { c.beginPath(); [[sg * BR_IN, BR_TOP], [sg * BR_OUT, BR_TOP], [sg * BR_OUT, BR_BOT], [sg * BR_IN, BR_BOT]].forEach(([x, y], i) => { const [px, py] = toPx(x, y); i ? c.lineTo(px, py) : c.moveTo(px, py); }); c.stroke(); });
  }, ORANGE_H);
  const wHalo = halo((c, w, h) => { c.font = `800 210px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('LAB313', w / 2, h / 2 + 8); }, 0xffd2b0);
  // The wordmark: warm white neon letters between the brackets.
  const word = canvasTex(1024, 352, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.font = `800 236px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '10px';
    c.shadowColor = '#ffb37a'; c.shadowBlur = 26; c.fillStyle = '#fff3e6'; c.fillText('LAB313', w / 2, h / 2 + 10);
    c.shadowBlur = 0; c.fillStyle = '#fffaf4'; c.fillText('LAB313', w / 2, h / 2 + 10);
  }).tex;
  const wordM = new THREE.MeshBasicMaterial({ map: word, color: 0x000000, transparent: true, toneMapped: false, depthWrite: false });
  const wordP = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.37), wordM); wordP.position.set(0, SIGN_Y, SIGN_Z + 0.01); scene.add(wordP);
  const wordGlass = new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.37), new THREE.MeshBasicMaterial({ map: word, color: 0x3a3532, transparent: true, depthWrite: false }));
  wordGlass.position.set(0, SIGN_Y, SIGN_Z + 0.005); scene.add(wordGlass);
  const signGlowL = glow(ORANGE_H, 1, 0, 0.45), signGlowR = glow(ORANGE_H, 1, 0, 0.45);
  [signGlowL, signGlowR].forEach((g, i) => { g.position.set((i ? 1 : -1) * BR_OUT, SIGN_Y, SIGN_Z + 0.06); g.scale.set(0.55, 0.95, 1); scene.add(g); });
  const tag = label('INNOVATION LAB IDENTITY', { font: `700 52px ${MONO}`, fg: '#d7c4b2', h: 0.11, pad: 10, track: 6 });
  tag.material.fog = false; tag.position.set(0, SIGN_Y - 0.45, WALL_Z + 0.01); scene.add(tag);

  // ----------------------------------------------------------- the voice plaques
  const voiceTag = label('VOICE', { font: `700 52px ${MONO}`, fg: '#a8968a', h: 0.1, pad: 8, track: 6 });
  voiceTag.material.fog = false; scene.add(voiceTag);
  const plaques = VOICE.map((w, i) => {
    const W = 360, H = 120;
    const tx = canvasTex(W, H, (c) => {
      c.clearRect(0, 0, W, H);
      c.shadowColor = ORANGE; c.shadowBlur = 14; c.strokeStyle = '#ff8a52'; c.lineWidth = 7; roundRect(c, 10, 10, W - 20, H - 20, (H - 20) / 2); c.stroke();
      c.shadowColor = '#ffb37a'; c.shadowBlur = 12; c.fillStyle = '#fff3e6'; c.font = `800 54px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '4px';
      c.fillText(w, W / 2 + 2, H / 2 + 3);
    }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.48, 0.16), new THREE.MeshBasicMaterial({ map: tx, color: 0x000000, transparent: true, toneMapped: false, depthWrite: false }));
    m.position.set((i - 1) * 0.56 + 0.12, SIGN_Y - 0.68, WALL_Z + 0.03); scene.add(m);
    const g = glow(ORANGE_H, 1, 0, 0.45); g.scale.set(0.8, 0.36, 1); g.position.copy(m.position).add(new THREE.Vector3(0, 0, -0.01)); scene.add(g);
    return { m, g };
  });
  voiceTag.position.set(plaques[0].m.position.x - 0.42, SIGN_Y - 0.68, WALL_Z + 0.02);

  // ----------------------------------------------------------- the bench
  const steelTop = std(0xffffff, { map: grainTex('#4a4644', { size: 256, speck: 0.16, blot: 0.05, seed: 13, repeat: 3 }), roughness: 0.32, metalness: 0.7 });
  const darkSteel = std(0x1c1b1c, { roughness: 0.45, metalness: 0.8 });
  const top = mesh(new RoundedBoxGeometry(2.9, 0.06, 1.12, 3, 0.012), steelTop); top.position.set(0, BENCH_Y - 0.03, -0.3); scene.add(top);
  const apron = mesh(new THREE.BoxGeometry(2.8, 0.2, 0.04), darkSteel); apron.position.set(0, BENCH_Y - 0.16, 0.24); scene.add(apron);
  const legIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, BENCH_Y - 0.06, 0.06), darkSteel, 4);
  [[-1.38, 0.2], [1.38, 0.2], [-1.38, -0.8], [1.38, -0.8]].forEach(([x, z], i) => legIM.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, (BENCH_Y - 0.06) / 2, z)));
  legIM.castShadow = true; scene.add(legIM);
  // The display ledge the pieces stand up into.
  const ledge = mesh(new RoundedBoxGeometry(2.5, 0.035, 0.06, 2, 0.008), std(0x5a3a26, { roughness: 0.5 })); ledge.position.set(0, BENCH_Y + 0.0175, LEDGE_Z); scene.add(ledge);
  const groove = mesh(new THREE.BoxGeometry(2.48, 0.002, 0.016), std(0x120c08, { roughness: 0.9 }), { cast: false }); groove.position.set(0, BENCH_Y + 0.036, LEDGE_Z); scene.add(groove);

  // The stamping gantry: a rail at the back of the bench, a carriage with a forward arm, the ram and die.
  const rail = mesh(new THREE.BoxGeometry(2.8, 0.06, 0.07), darkSteel); rail.position.set(0, RAIL_Y, RAIL_Z); scene.add(rail);
  const railStrip = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.006, 0.004), new THREE.MeshBasicMaterial({ color: ORANGE_H, toneMapped: false }));
  railStrip.position.set(0, RAIL_Y - 0.012, RAIL_Z + 0.037); scene.add(railStrip);
  [-1.4, 1.4].forEach((x) => { const p = mesh(new THREE.BoxGeometry(0.06, RAIL_Y - BENCH_Y + 0.03, 0.06), darkSteel); p.position.set(x, (RAIL_Y + BENCH_Y) / 2, RAIL_Z); scene.add(p); });
  const carriage = new THREE.Group(); scene.add(carriage);
  const yellowM = std(0xd9a21e, { roughness: 0.42, metalness: 0.35 });
  const car = mesh(new RoundedBoxGeometry(0.2, 0.13, 0.13, 3, 0.02), yellowM); car.position.set(0, RAIL_Y, RAIL_Z); carriage.add(car);
  const arm = mesh(new THREE.BoxGeometry(0.07, 0.05, Math.abs(LIE_Z - RAIL_Z) + 0.06), yellowM); arm.position.set(0, RAIL_Y + 0.02, (LIE_Z + RAIL_Z) / 2); carriage.add(arm);
  const head = mesh(new RoundedBoxGeometry(0.11, 0.08, 0.11, 2, 0.015), yellowM); head.position.set(0, RAIL_Y + 0.01, LIE_Z); carriage.add(head);
  const ramG = new THREE.CylinderGeometry(0.018, 0.018, 1, 16); ramG.translate(0, -0.5, 0);
  const ram = mesh(ramG, std(0xd8dadc, { metalness: 1, roughness: 0.2 })); ram.position.set(0, RAIL_Y - 0.03, LIE_Z); carriage.add(ram);
  const die = new THREE.Group(); carriage.add(die);
  const dieBody = mesh(new RoundedBoxGeometry(0.15, 0.06, 0.15, 2, 0.01), darkSteel); die.add(dieBody);
  const dieFace = canvasTex(256, 100, (c, w, h) => { c.fillStyle = '#1c1b1c'; c.fillRect(0, 0, w, h); drawMark(c, 30, 18, 64, '#d8d2ca', ORANGE); }).tex;
  const dieDecal = new THREE.Mesh(new THREE.PlaneGeometry(0.14, 0.055), new THREE.MeshStandardMaterial({ map: dieFace, roughness: 0.5, metalness: 0.3 }));
  dieDecal.position.z = 0.0755; die.add(dieDecal);
  const dieLip = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.004, 0.13), new THREE.MeshBasicMaterial({ color: ORANGE_H, toneMapped: false })); dieLip.position.y = -0.032; die.add(dieLip);
  const DIE_REST = BENCH_Y + 0.22;

  // ----------------------------------------------------------- the three pieces
  // Each piece is a group whose origin sits at the bottom edge of its face, face along local +Z, so it can
  // lie face-up on the bench and later swing up into the ledge.
  const prints = [];
  const makePrint = (W, H, art, blankCol) => {
    const art0 = canvasTex(W, H, art);
    const ct = canvasTex(W, H, (c) => { c.fillStyle = blankCol; c.fillRect(0, 0, W, H); });
    const p = { ct, art: art0.cv, W, H, blankCol, key: '' };
    prints.push(p);
    return ct.tex;
  };
  const sheetM = (map) => std(0xffffff, { map, roughness: 0.62 });
  const groups = PIECES.map((pc, i) => {
    const g = new THREE.Group(); scene.add(g);
    const inner = new THREE.Group(); inner.position.set(0, pc.h / 2, pc.th / 2); g.add(inner);
    if (i === 1) {
      const tab = phone({ w: pc.w, h: pc.h, d: pc.th, frame: 0x26282c, notch: false, r: 0.024 });
      inner.add(tab);
      const { sw, sh } = tab.userData;
      const map = makePrint(1024, Math.round(1024 * sh / sw), drawSite, '#050506');
      tab.userData.screen.material.map = map; tab.userData.screen.material.needsUpdate = true;
      pc.screen = tab.userData.screen;
      const sg = glow(0xffd2b0, 1, 0, 0.5); sg.scale.set(sw * 1.6, sh * 1.6, 1); sg.position.z = pc.th / 2 + 0.02; inner.add(sg); pc.sg = sg;
    } else {
      const body = mesh(new RoundedBoxGeometry(pc.w, pc.h, pc.th, 2, Math.min(0.006, pc.th / 2 - 0.001)), std(0xd6cec3, { roughness: 0.7 }));
      inner.add(body);
      const map = makePrint(i === 0 ? 1024 : 600, i === 0 ? 576 : 360, i === 0 ? drawSlide : drawCard, SHEET);
      const face = mesh(new THREE.PlaneGeometry(pc.w - 0.004, pc.h - 0.004), sheetM(map), { cast: false });
      face.position.z = pc.th / 2 + 0.0008; inner.add(face);
      if (i === 2) { const back2 = mesh(new THREE.PlaneGeometry(pc.w - 0.004, pc.h - 0.004), std(ORANGE_H, { roughness: 0.6 }), { cast: false }); back2.rotation.y = Math.PI; back2.position.z = -pc.th / 2 - 0.0008; inner.add(back2); }
    }
    pc.g = g; pc.inner = inner;
    return g;
  });
  // Print bloom: the design spreads out from where the die touched, led by a ring of orange light.
  const drawPrintAt = (p, mix) => {
    const key = String(Math.round(mix * 48)); if (key === p.key) return; p.key = key;
    p.ct.redraw((c, w, h) => {
      c.fillStyle = p.blankCol; c.fillRect(0, 0, w, h);
      if (mix <= 0) return;
      const R = Math.hypot(w, h) * 0.56 * mix;
      c.save(); c.beginPath(); c.arc(w / 2, h / 2, R, 0, 7); c.clip(); c.drawImage(p.art, 0, 0, w, h); c.restore();
      if (mix < 1) { c.strokeStyle = `rgba(255,120,60,${0.9 * (1 - mix)})`; c.lineWidth = 10 + 20 * (1 - mix); c.beginPath(); c.arc(w / 2, h / 2, R, 0, 7); c.stroke(); }
    });
  };
  const hits = PIECES.map(() => { const g = glow(ORANGE_H, 1, 0, 0.45); scene.add(g); return g; });
  const rings = PIECES.map(() => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.96, 1, 64), new THREE.MeshBasicMaterial({ color: 0xff8a52, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    r.rotation.x = -Math.PI / 2; scene.add(r); return r;
  });

  // ----------------------------------------------------------- title
  const client = label('General Motors', { font: `700 56px ${MONO}`, fg: '#ff8a52', h: 0.11, pad: 8, track: 4 });
  const title = label('Lab313 rebrand', { font: `800 72px ${SANS}`, fg: '#f6efe6', h: 0.2, pad: 10, track: 1 });
  const line = label('Logo, templates, website layout, voice, and direction for GM’s innovation lab.', { font: `600 46px ${SANS}`, fg: '#cdbfb3', h: 0.085, pad: 8, track: 0 });
  [client, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width, LWd = line.geometry.parameters.width;

  // ----------------------------------------------------------- dust
  const DN = 130, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd2b0, size: 0.01, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- choreography
  // Carriage x along the rail: parked left, a hop to each piece, parked right.
  const carX = (t) => kf(t, [
    [0, -1.25], [2.15, -1.25], [2.62, PIECES[0].x, back],
    [3.2, PIECES[0].x], [3.72, PIECES[1].x, back],
    [4.25, PIECES[1].x], [4.77, PIECES[2].x, back],
    [5.3, PIECES[2].x], [5.85, 1.25],
  ]);
  // Die height: a small lift of anticipation, a hard drop, a beat on the sheet, then a springy rise.
  const dieY = (t) => {
    let y = DIE_REST;
    PIECES.forEach((pc) => {
      const P = pc.hit, surf = BENCH_Y + pc.th + 0.03;
      const pre = Math.sin(Math.PI * k(t, P - 0.42, P - 0.17)) * 0.03;
      const drop = ei(k(t, P - 0.17, P));
      const rise = eo(k(t, P + 0.1, P + 0.42));
      if (t > P - 0.45 && t < P + 0.45) y = lerp(lerp(DIE_REST + pre, surf, drop), DIE_REST, rise);
    });
    return y;
  };
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.32, 1.8, 1.8]], [2.0, [0.18, 1.9, 1.45], L],
    [2.7, [-0.5, 1.62, 1.12]], [3.6, [-0.05, 1.58, 1.1], L], [4.7, [0.55, 1.55, 1.1], L],
    [5.5, [0.6, 1.62, 1.15]], [6.4, [0.1, 1.68, 1.35]],
    [7.7, [0.1, 1.55, 4.1]], [10, [0.04, 1.53, 4.25], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 2.12, WALL_Z]], [2.0, [0, 2.12, WALL_Z], L],
    [2.7, [-0.72, 0.95, LIE_Z]], [3.6, [-0.05, 0.95, LIE_Z], L], [4.7, [0.6, 0.95, LIE_Z], L],
    [5.5, [0.4, 1.35, -0.8]], [6.4, [0.05, 1.5, WALL_Z]],
    [7.7, [0, 1.36, -0.5]], [10, [0, 1.36, -0.5], L],
  ]);
  const tgt = new THREE.Vector3(), lk = new THREE.Vector3();
  const lieAt = (pc) => [pc.x, BENCH_Y, LIE_Z + pc.h / 2];

  function update(t) {
    // Each impact gives the camera a small knock.
    let knock = 0;
    PRESS.forEach((P) => { if (t > P) knock += Math.exp(-14 * (t - P)) * Math.sin((t - P) * 60); });
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.005, p[1] + Math.sin(t * 1.6 + 1) * 0.004 + knock * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.0, 32], [2.7, 33], [6.4, 34], [7.7, 33], [10, 32.5]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the brackets draw themselves in, then the word catches.
    brackets.forEach((b, i) => {
      const pr = eio(k(t, 0.35 + i * 0.22, 1.35 + i * 0.22));
      b.litG.setDrawRange(0, Math.floor(pr * 120) * 10 * 6);
      b.lit.visible = pr > 0.001;
    });
    const brOn = eio(k(t, 0.35, 1.57));
    const hum = 0.96 + 0.04 * Math.sin(t * 6.1);
    neonM.color.setRGB(1.0 * hum, 0.42 * hum, 0.2 * hum);
    bHalo.material.opacity = 0.32 * brOn;
    [signGlowL, signGlowR].forEach((g, i) => { g.material.opacity = 0.32 * eio(k(t, 0.6 + i * 0.22, 1.45 + i * 0.22)); });
    const w = flick(t, 1.45, 3);
    wordM.color.setScalar(w);
    wHalo.material.opacity = 0.22 * w;
    neonL.intensity = 5.5 * brOn;
    wordL.intensity = 3.2 * w;
    const tagIn = eo(k(t, 1.95, 2.45));
    tag.material.opacity = 0.9 * tagIn; tag.visible = tagIn > 0.01;

    // Beat 2: the gantry rides to each blank and presses the mark onto it.
    const cx = carX(t);
    carriage.position.x = cx;
    const dy = dieY(t);
    die.position.set(0, dy, LIE_Z);
    ram.scale.y = Math.max(0.01, RAIL_Y - 0.03 - (dy + 0.03));
    // The die squashes a touch on contact.
    let squash = 0;
    PRESS.forEach((P) => { squash = Math.max(squash, Math.sin(Math.PI * k(t, P - 0.02, P + 0.12))); });
    dieBody.scale.set(1 + 0.05 * squash, 1 - 0.12 * squash, 1 + 0.05 * squash);
    let flash = 0, flashX = 0;
    PIECES.forEach((pc, i) => {
      const f = t > pc.hit ? Math.exp(-5 * (t - pc.hit)) : 0;
      if (f > flash) { flash = f; flashX = pc.x; }
      const ph = k(t, pc.hit, pc.hit + 0.7);
      rings[i].position.set(pc.x, BENCH_Y + pc.th + 0.004, LIE_Z);
      rings[i].scale.setScalar(lerp(0.06, Math.max(pc.w, pc.h) * 0.75, eo(ph)));
      rings[i].material.opacity = t > pc.hit ? 0.8 * (1 - ph) : 0;
      rings[i].visible = t > pc.hit && ph < 1 && t < pc.up;
      hits[i].position.set(pc.x, BENCH_Y + 0.06, LIE_Z + 0.02);
      hits[i].scale.setScalar(0.25 + 0.5 * eo(ph));
      hits[i].material.opacity = 0.75 * f;
      drawPrintAt(prints[i], eo(k(t, pc.hit, pc.hit + 0.55)));
    });
    pressL.position.set(flashX, BENCH_Y + 0.15, LIE_Z + 0.1);
    pressL.intensity = 5 * flash;
    // The tablet wakes as the website lands on it.
    const wake = eo(k(t, PIECES[1].hit - 0.02, PIECES[1].hit + 0.3));
    PIECES[1].screen.material.color.setScalar(lerp(0.05, 0.82, wake));
    PIECES[1].sg.material.opacity = 0.12 * wake;

    // Beat 3: the voice plaques flick on, one after another.
    const vt = eo(k(t, 5.55, 5.9));
    voiceTag.material.opacity = 0.85 * vt; voiceTag.visible = vt > 0.01;
    plaques.forEach(({ m, g }, i) => {
      const on = flick(t, VOICE_ON[i], 11 + i);
      m.material.color.setScalar(0.1 + 0.9 * on);
      const pop = back(k(t, VOICE_ON[i], VOICE_ON[i] + 0.35));
      m.scale.setScalar(t < VOICE_ON[i] ? 0.96 : lerp(0.96, 1, clamp(pop)) + 0.05 * Math.sin(Math.PI * clamp(pop)));
      g.material.opacity = 0.26 * on + (t > VOICE_ON[i] ? 0.35 * Math.exp(-5 * (t - VOICE_ON[i])) : 0);
    });

    // Beat 4: the pieces stand up into the ledge; the card turns to face us.
    PIECES.forEach((pc, i) => {
      const u = k(t, pc.up, pc.up + 0.75), s = back(u), lift = Math.sin(Math.PI * eio(u));
      const [lx, ly, lz] = lieAt(pc);
      pc.g.position.set(lx, lerp(ly, BENCH_Y + 0.018, clamp(s)) + lift * 0.09, lerp(lz, LEDGE_Z, clamp(eio(u))));
      pc.g.rotation.set(lerp(-Math.PI / 2, -0.09, s), 0, 0);
      pc.inner.rotation.y = 0;
      if (i === 2) {
        // The card lifts off the ledge and turns a full circle to face the camera.
        const spin = eio(k(t, 7.15, 8.15));
        pc.g.position.y += 0.1 * eio(k(t, 7.15, 7.6)) + Math.sin(t * 1.4) * 0.006 * k(t, 7.6, 8.0);
        pc.inner.rotation.y = spin * Math.PI * 2;
      }
    });

    // The project's name settles in front of the bench.
    const ci = back(k(t, 7.75, 8.3)), ti = back(k(t, 7.9, 8.45)), li = eo(k(t, 8.15, 8.75)), out = ei(k(t, 9.2, 9.6));
    const tx = 0, tz = 0.62;
    lk.set(camera.position.x, 0.75, camera.position.z);
    title.position.set(tx, 0.715 + (1 - clamp(ti)) * -0.05, tz); title.lookAt(lk);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(tx - TWd / 2 + CWd / 2 + 0.01, 0.865 + (1 - clamp(ci)) * -0.04, tz); client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;
    line.position.set(tx - TWd / 2 + LWd / 2 + 0.01, 0.565 + (1 - li) * -0.025, tz); line.quaternion.copy(title.quaternion);
    line.material.opacity = li * (1 - out); line.visible = line.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.6 + rnd(i, 51) * 3.2 + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = 0.95 + rnd(i, 52) * 1.8 + Math.sin(t * 0.42 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -1.1 + rnd(i, 53) * 1.8 + Math.cos(t * 0.22 + i) * 0.06;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.75 };
}
