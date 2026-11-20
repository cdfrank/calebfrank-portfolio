// Playable Figma Make games lit loop, 10 s. "A frame that plays."
// A frame floats on the dark dot-grid canvas, selected, with flat game art in it. The cursor hits Play:
// the flat layers push out of the frame one by one into a lit toy diorama while the camera swings
// from a flat, straight-on view into depth. A skateboard rolls the side-scroller, ollies a crate and a
// cone and kickflips a double stack while the game titles cycle on the HUD. Off the last kicker the
// board flips clean out of the frame and powerslides onto the canvas; the frame turns into the title.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const FIG = 0x0d99ff, RED = 0xf24e1e, CORAL = 0xff7262, PURPLE = 0xa259ff, SKYB = 0x1abcfe, GREEN = 0x0acf83;
const TITLES = ['ESCAPE THE FRAME', 'GRINDS & GAMBLES', 'KICKFLIP CHAOS', 'SKATESHOP EMPIRE', 'UX DUNGEON CRAWLER'];
const T0 = 1.9, TW = 1.24;                 // title cycle start and window
const FW = 2.4, FH = 1.4, FB = 0.18;       // frame width, height, bottom edge
const GY = FB + 0.12, GZ = 0.25;           // ground top and lane depth
const BX = -0.55;                          // where the board rides
const AIR = 0.56;
const JUMP = [2.95, 4.25, 5.55];           // ollie, ollie, kickflip
const HOP = [0.3, 0.32, 0.44];
const KICK = 7.0, LANDT = KICK + 0.72;     // off the kicker, out of the frame, onto the canvas
const PRESS = 1.24;                        // cursor clicks Play
const LAND_XZ = [-0.2, 1.0], REST_XZ = [0.1, 1.18];

// Scroll distance of the level: eases in after Play, eases out once the board has left.
const V = 0.9, A0 = 2.0, A1 = 2.6, B0 = 7.3, B1 = 8.1;
function sAt(t) {
  if (t <= A0) return 0;
  if (t < A1) return V * (t - A0) * (t - A0) / (2 * (A1 - A0));
  const sA = V * (A1 - A0) / 2;
  if (t <= B0) return sA + V * (t - A1);
  const sB = sA + V * (B0 - A1);
  if (t < B1) { const d = t - B0; return sB + V * d - V * d * d / (2 * (B1 - B0)); }
  return sB + V * (B1 - B0) / 2;
}
const LANDS = [...JUMP.map((j) => j + AIR), LANDT];

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x141417);
  scene.fog = new THREE.Fog(0x141417, 6, 16);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(20, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the canvas
  const dots = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#1b1b1f'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3a3a42';
    for (let y = 16; y < h; y += 32) for (let x = 16; x < w; x += 32) { c.beginPath(); c.arc(x, y, 1.8, 0, 7); c.fill(); }
  }).tex;
  dots.wrapS = dots.wrapT = THREE.RepeatWrapping; dots.repeat.set(18, 14);
  const floor = mesh(new THREE.PlaneGeometry(18, 14), std(0xffffff, { map: dots, roughness: 0.55, metalness: 0.15 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Other frames on the canvas, far off and dim.
  const thumb = canvasTex(256, 150, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3a2a66'); g.addColorStop(1, '#a8546a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(20,14,40,0.8)'; c.fillRect(0, h * 0.78, w, h);
    for (let i = 0; i < 5; i++) { c.fillStyle = ['#ff7262', '#a259ff', '#1abcfe', '#0acf83', '#ffcd29'][i]; c.fillRect(20 + i * 46, h * 0.78 - 18 - rnd(i, 3) * 26, 26, 18 + rnd(i, 3) * 26); }
  }).tex;
  [[-2.7, 0.62, -2.6, 0.35, 0x8a6fff], [-1.15, 0.52, -3.7, 0.12, 0xff8a7a], [1.75, 0.58, -3.3, -0.15, 0x5fd0ff], [3.05, 0.72, -2.4, -0.4, 0x5fe0a8]].forEach(([x, y, z, ry, c]) => {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.7), new THREE.MeshBasicMaterial({ map: thumb, color: new THREE.Color(c).multiplyScalar(0.55), toneMapped: false }));
    p.position.set(x, y, z); p.rotation.y = ry; scene.add(p);
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x8890b8, 0x141418, 0.4));
  const key = new THREE.SpotLight(0xffe6cc, 46, 0, 0.55, 0.7, 1.4);
  key.position.set(-1.6, 3.2, 3.0); key.target.position.set(0, 0.45, 0.35);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 8; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rimP = new THREE.DirectionalLight(PURPLE, 1.4); rimP.position.set(-2.5, 1.8, -2.0); scene.add(rimP);
  const rimB = new THREE.DirectionalLight(SKYB, 1.0); rimB.position.set(2.6, 1.2, -1.8); scene.add(rimB);
  const skyL = new THREE.PointLight(0xff9a6a, 0, 2.6, 1.5); skyL.position.set(0.3, 0.95, 0.75); scene.add(skyL);

  // ----------------------------------------------------------- the frame
  const frame = new THREE.Group(); frame.position.set(0, FB + FH / 2, 0); scene.add(frame);
  const sky = canvasTex(1024, 600);
  const skyMesh = new THREE.Mesh(new THREE.PlaneGeometry(FW, FH), new THREE.MeshBasicMaterial({ map: sky.tex, toneMapped: false, color: 0xe6e6e6 }));
  frame.add(skyMesh);
  const outer = new THREE.Shape();
  outer.moveTo(-FW / 2 - 0.06, -FH / 2 - 0.06); outer.lineTo(FW / 2 + 0.06, -FH / 2 - 0.06); outer.lineTo(FW / 2 + 0.06, FH / 2 + 0.06); outer.lineTo(-FW / 2 - 0.06, FH / 2 + 0.06); outer.closePath();
  const hole = new THREE.Path();
  hole.moveTo(-FW / 2, -FH / 2); hole.lineTo(-FW / 2, FH / 2); hole.lineTo(FW / 2, FH / 2); hole.lineTo(FW / 2, -FH / 2); hole.closePath();
  outer.holes.push(hole);
  const bezelGeo = new THREE.ExtrudeGeometry(outer, { depth: 0.07, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 });
  bezelGeo.translate(0, 0, -0.03);
  const bezel = mesh(bezelGeo, std(0x2a2a30, { roughness: 0.35, metalness: 0.4 })); frame.add(bezel);
  const backing = mesh(new THREE.BoxGeometry(FW + 0.12, FH + 0.12, 0.02), std(0x111114, { roughness: 0.6 })); backing.position.z = -0.045; frame.add(backing);
  const skyGlow = glow(0xff8a5c, 1, 0, 0.55); skyGlow.position.set(0, 0, -0.2); skyGlow.scale.set(3.6, 2.4, 1); frame.add(skyGlow);
  const sunGlow = glow(0xffb070, 0.7, 0, 0.35); sunGlow.position.set(0.44, 0.08, 0.02); frame.add(sunGlow);
  const poolTex = canvasTex(128, 128, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.8)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 2.0), new THREE.MeshBasicMaterial({ map: poolTex, color: 0xff7a50, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.003, 0.7); scene.add(pool);

  // Selection: blue box with corner handles, the frame name and the Play pill.
  const sel = canvasTex(1024, 620, (c, w, h) => {
    const pad = 10;
    c.strokeStyle = '#0d99ff'; c.lineWidth = 5; c.strokeRect(pad, pad, w - pad * 2, h - pad * 2);
    [[pad, pad], [w - pad, pad], [pad, h - pad], [w - pad, h - pad]].forEach(([x, y]) => {
      c.fillStyle = '#ffffff'; c.fillRect(x - 13, y - 13, 26, 26); c.strokeStyle = '#0d99ff'; c.lineWidth = 4; c.strokeRect(x - 13, y - 13, 26, 26);
    });
  });
  const selMesh = new THREE.Mesh(new THREE.PlaneGeometry(FW + 0.06, (FW + 0.06) * 620 / 1024), new THREE.MeshBasicMaterial({ map: sel.tex, transparent: true, toneMapped: false, depthWrite: false }));
  selMesh.position.set(0, FB + FH / 2, 0.07); selMesh.renderOrder = 5; scene.add(selMesh);
  const name = label('Frame 1', { font: `600 54px ${SANS}`, fg: '#bdbdc6', pad: 8, h: 0.16, track: 0 });
  const nameW = name.geometry.parameters.width;
  name.position.set(-FW / 2 + nameW / 2 - 0.02, FB + FH + 0.13, 0.02); scene.add(name);
  const pill = new THREE.Group(); pill.position.set(FW / 2 - 0.2, FB + FH + 0.14, 0.03); scene.add(pill);
  const pillBody = mesh(new RoundedBoxGeometry(0.4, 0.15, 0.05, 3, 0.03), std(0x2c2c30, { roughness: 0.4 }), { cast: false });
  pill.add(pillBody);
  const pillFace = canvasTex(320, 120);
  const pillOn = (on) => pillFace.redraw((c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = on ? '#0d99ff' : '#2c2c30'; roundRect(c, 4, 4, w - 8, h - 8, (h - 8) / 2); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(70, 34); c.lineTo(108, 60); c.lineTo(70, 86); c.closePath(); c.fill();
    c.font = `700 46px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Play', 128, 62);
  });
  pillOn(false);
  let pillState = false;
  const pillPlane = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.15), new THREE.MeshBasicMaterial({ map: pillFace.tex, transparent: true, toneMapped: false }));
  pillPlane.position.z = 0.0265; pill.add(pillPlane);
  const pillRing = glow(FIG, 0.6, 0, 0.4); pillRing.position.z = 0.05; pill.add(pillRing);

  // Cursor: the canvas arrow, black with a white keyline.
  const arrow = new THREE.Shape();
  [[0, 0], [0, -0.2], [0.05, -0.155], [0.085, -0.235], [0.118, -0.222], [0.083, -0.143], [0.145, -0.143]].forEach(([x, y], i) => (i ? arrow.lineTo(x, y) : arrow.moveTo(x, y)));
  arrow.closePath();
  const cursor = new THREE.Group(); scene.add(cursor);
  const cBlack = mesh(new THREE.ExtrudeGeometry(arrow, { depth: 0.014, bevelEnabled: false }), std(0x101012, { roughness: 0.4 }));
  cBlack.position.z = 0.006; cursor.add(cBlack);
  const kl = new THREE.ExtrudeGeometry(arrow, { depth: 0.012, bevelEnabled: false });
  kl.scale(1.2, 1.2, 1); kl.translate(-0.012, 0.03, 0); // scaled about the tip, re-centred so the keyline is even
  const cWhite = mesh(kl, std(0xf2f2f2, { roughness: 0.5 }), { cast: false }); cursor.add(cWhite);

  // ----------------------------------------------------------- the level, layer by layer
  // Each layer lives in a group at the frame's face; squashing its z makes it flat art, and it
  // springs out to full depth one after another when the frame starts playing.
  const clipL = new THREE.Plane(new THREE.Vector3(1, 0, 0), FW / 2);   // keep x >= -FW/2
  const clipR = new THREE.Plane(new THREE.Vector3(-1, 0, 0), FW / 2);  // keep x <= FW/2
  const clips = [clipL, clipR];
  const layers = [];
  const layer = (popT) => { const g = new THREE.Group(); g.scale.z = 0.03; scene.add(g); layers.push([g, popT]); return g; };

  const groundTex = canvasTex(256, 64, (c, w, h) => {
    c.fillStyle = '#4a4366'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c9c0ee'; c.fillRect(20, h / 2 - 4, 90, 8);
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, h - 6, w, 6);
  }).tex;
  groundTex.wrapS = THREE.RepeatWrapping; groundTex.repeat.set(6, 1);
  const ground = mesh(new THREE.BoxGeometry(FW, 0.12, 0.5).translate(0, 0.06, 0.25), std(0xffffff, { map: groundTex, roughness: 0.7 }));
  ground.position.y = FB; layer(1.6).add(ground);

  const hillShape = (amp, base, seed) => {
    const s = new THREE.Shape(); s.moveTo(-FW / 2, 0);
    for (let i = 0; i <= 48; i++) { const x = -FW / 2 + (i / 48) * FW; s.lineTo(x, base + amp * (0.55 + 0.45 * Math.sin(x * 2.6 + seed) * Math.cos(x * 1.3 + seed * 2))); }
    s.lineTo(FW / 2, 0); s.closePath(); return s;
  };
  const hillA = mesh(new THREE.ExtrudeGeometry(hillShape(0.3, 0.26, 1.2), { depth: 0.05, bevelEnabled: false }), std(0x5b36a8, { roughness: 0.75 }), { cast: false });
  hillA.position.set(0, FB, 0.015); layer(1.7).add(hillA);
  const hillB = mesh(new THREE.ExtrudeGeometry(hillShape(0.18, 0.18, 3.4), { depth: 0.06, bevelEnabled: false }), std(0x2f62c8, { roughness: 0.75 }), { cast: false });
  hillB.position.set(0, FB, 0.09); layer(1.78).add(hillB);

  // Obstacles scroll in from the right and are clipped at the frame's edges.
  const crateTex = canvasTex(128, 128, (c, w, h) => {
    c.fillStyle = '#ff7262'; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#c84a3c'; c.lineWidth = 12; c.strokeRect(6, 6, w - 12, h - 12);
    c.lineWidth = 9; c.beginPath(); c.moveTo(12, 12); c.lineTo(w - 12, h - 12); c.stroke();
  }).tex;
  const crateM = std(0xffffff, { map: crateTex, roughness: 0.55, clippingPlanes: clips });
  const purpleM = std(PURPLE, { roughness: 0.45, clippingPlanes: clips });
  const coneM = std(RED, { roughness: 0.42, clippingPlanes: clips });
  const greenM = std(GREEN, { roughness: 0.5, clippingPlanes: clips });
  const crate = mesh(new RoundedBoxGeometry(0.2, 0.2, 0.2, 2, 0.015), crateM); crate.position.set(0, GY + 0.1, GZ);
  const cone = new THREE.Group(); cone.position.set(0, GY, GZ);
  const coneTop = mesh(new THREE.ConeGeometry(0.07, 0.22, 24), coneM); coneTop.position.y = 0.125; cone.add(coneTop);
  const coneBase = mesh(new THREE.BoxGeometry(0.17, 0.02, 0.17), coneM); coneBase.position.y = 0.01; cone.add(coneBase);
  const stack = new THREE.Group(); stack.position.set(0, GY, GZ);
  const s1 = mesh(new RoundedBoxGeometry(0.22, 0.2, 0.22, 2, 0.015), purpleM); s1.position.y = 0.1; stack.add(s1);
  const s2 = mesh(new RoundedBoxGeometry(0.18, 0.16, 0.18, 2, 0.015), crateM); s2.position.y = 0.28; s2.rotation.y = 0.3; stack.add(s2);
  const tri = new THREE.Shape(); tri.moveTo(-0.34, 0); tri.lineTo(0, 0); tri.lineTo(0, 0.16); tri.closePath();
  const ramp = mesh(new THREE.ExtrudeGeometry(tri, { depth: 0.3, bevelEnabled: false }).translate(0, 0, -0.15), greenM);
  ramp.position.set(0, GY, GZ);
  const OBS = [crate, cone, stack, ramp];
  const PASS = [...JUMP.map((j) => j + AIR / 2), KICK];
  const X0 = PASS.map((p) => BX + sAt(p));
  OBS.forEach((o, i) => layer(1.86 + i * 0.07).add(o));

  // ----------------------------------------------------------- the board
  const boardL = layer(1.95);
  const board = new THREE.Group(); boardL.add(board);
  const flip = new THREE.Group(); flip.position.y = 0.064; flip.rotation.order = 'YZX'; board.add(flip);
  const deckGeo = new THREE.BoxGeometry(0.44, 0.016, 0.11, 24, 1, 1);
  const dp = deckGeo.attributes.position;
  for (let i = 0; i < dp.count; i++) { const x = dp.getX(i), ax = Math.abs(x); if (ax > 0.15) dp.setY(i, dp.getY(i) + (ax - 0.15) * 0.5); const z = dp.getZ(i); if (ax > 0.17) dp.setZ(i, z * (1 - (ax - 0.17) * 1.6)); }
  deckGeo.computeVertexNormals();
  const wood = std(0xd9b37a, { roughness: 0.6 });
  const deck = mesh(deckGeo, [wood, wood, std(0x1d1d22, { roughness: 0.9 }), std(PURPLE, { roughness: 0.45 }), wood, wood]);
  flip.add(deck);
  const metal = std(0xb8bcc6, { metalness: 1, roughness: 0.32 });
  const wheelM = std(0xf2ead8, { roughness: 0.45 });
  const wheels = [];
  [-0.13, 0.13].forEach((x) => {
    const tr = mesh(new THREE.BoxGeometry(0.03, 0.022, 0.1), metal); tr.position.set(x, -0.022, 0); flip.add(tr);
    [-0.047, 0.047].forEach((z) => {
      const w = mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.022, 18), wheelM);
      w.rotation.order = 'XYZ'; w.position.set(x, -0.038, z); flip.add(w); wheels.push(w);
    });
  });
  const trail = glow(FIG, 0.5, 0, 0.35); flip.add(trail);

  // Dust when it lands on the canvas.
  const DN = 44, dPos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dPos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xc9c0ee, size: 0.02, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- the frame's art and HUD
  const TITLE = 'Playable Figma Make games';
  let sKey = '';
  function drawSky(t) {
    const m = eio(k(t, 1.45, 2.1));
    const pf = eio(k(t, 8.05, 8.55));
    const idx = clamp(Math.floor((t - T0) / TW), 0, TITLES.length - 1);
    const ti = clamp(((t - T0) - idx * TW) / 0.22);
    const score = LANDS.filter((l) => t >= l).length;
    const sc = LANDS.reduce((a, l) => (t >= l && t < l + 0.35 ? k(t, l, l + 0.35) : a), 1);
    const anim = (m > 0 && m < 1) || (pf > 0 && pf < 1) || (t > T0 && ti < 1) || sc < 1;
    const key = [idx, score, m >= 1 ? 1 : 0, pf >= 1 ? 1 : 0, anim ? Math.round(t * 30) : 0].join('|');
    if (key === sKey) return; sKey = key;
    sky.redraw((c, w, h) => {
      // Design mode: flat placeholder art. Play mode: a dusk sky.
      const g0 = c.createLinearGradient(0, 0, 0, h); g0.addColorStop(0, '#4b5268'); g0.addColorStop(1, '#6d7488');
      c.fillStyle = g0; c.fillRect(0, 0, w, h);
      c.globalAlpha = m;
      const g1 = c.createLinearGradient(0, 0, 0, h);
      g1.addColorStop(0, '#24134a'); g1.addColorStop(0.5, '#6e2c74'); g1.addColorStop(0.85, '#e0705a'); g1.addColorStop(1, '#ff9a64');
      c.fillStyle = g1; c.fillRect(0, 0, w, h);
      for (let i = 0; i < 40; i++) { c.fillStyle = `rgba(255,255,255,${0.25 + rnd(i, 5) * 0.5})`; c.fillRect(rnd(i, 1) * w, rnd(i, 2) * h * 0.45, 2, 2); }
      c.globalAlpha = 1;
      // The sun: a grey placeholder circle that warms into the sun.
      c.strokeStyle = `rgba(160,168,186,${1 - m})`; c.lineWidth = 4; c.setLineDash([12, 10]); c.beginPath(); c.arc(700, 330, 70, 0, 7); c.stroke(); c.setLineDash([]);
      c.fillStyle = `rgba(255,205,140,${m})`; c.beginPath(); c.arc(700, 330, 70, 0, 7); c.fill();
      // Clouds
      [[180, 180, 1], [560, 120, 0.8], [860, 210, 0.9]].forEach(([x, y, s]) => {
        c.fillStyle = `rgba(255,255,255,${0.16 + 0.1 * (1 - m)})`;
        roundRect(c, x - 70 * s, y - 18 * s, 140 * s, 36 * s, 18 * s); c.fill();
        roundRect(c, x - 30 * s, y - 36 * s, 80 * s, 40 * s, 20 * s); c.fill();
      });
      // HUD: game title and score.
      const hud = m * (1 - pf);
      if (hud > 0 && t > T0 - 0.1) {
        c.save(); c.globalAlpha = hud * eo(ti); c.translate(0, (1 - eo(ti)) * 18);
        c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = `800 60px ${SANS}`;
        if ('letterSpacing' in c) c.letterSpacing = '3px';
        c.fillStyle = 'rgba(20,8,40,0.55)'; c.fillText(TITLES[idx], w / 2 + 4, 84);
        c.fillStyle = '#ffffff'; c.fillText(TITLES[idx], w / 2, 80);
        if ('letterSpacing' in c) c.letterSpacing = '0px';
        c.restore();
      }
      if (m > 0) {
        c.save(); c.globalAlpha = m; c.textAlign = 'right'; c.textBaseline = 'middle';
        c.fillStyle = 'rgba(255,255,255,0.7)'; c.font = `700 22px ${MONO}`; c.fillText('SCORE', w - 40, 44);
        const pop = back(sc);
        c.translate(w - 40, 96); c.scale(0.7 + 0.3 * pop, 0.7 + 0.3 * pop);
        c.fillStyle = score >= 4 ? '#ffcd29' : '#ffffff'; c.font = `800 64px ${SANS}`; c.fillText(String(score), 0, 0);
        c.restore();
      }
      // Payoff: the frame becomes the title card.
      if (pf > 0) {
        c.fillStyle = `rgba(14,8,30,${0.38 * pf})`; c.fillRect(0, 0, w, h);
        c.save(); c.globalAlpha = pf; c.translate(0, (1 - pf) * 20);
        c.textAlign = 'center'; c.textBaseline = 'middle';
        let fs = 78; c.font = `800 ${fs}px ${SANS}`;
        while (c.measureText(TITLE).width > w - 120 && fs > 40) { fs -= 2; c.font = `800 ${fs}px ${SANS}`; }
        c.fillStyle = '#ffffff'; c.fillText(TITLE, w / 2, 236);
        c.font = `700 30px ${MONO}`; c.fillStyle = '#d9c8ff';
        if ('letterSpacing' in c) c.letterSpacing = '6px';
        c.fillText('SELF-INITIATED', w / 2, 312);
        if ('letterSpacing' in c) c.letterSpacing = '0px';
        c.restore();
      }
    });
  }

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.08, 1.0, 6.4]], [1.3, [0.1, 0.98, 6.25], (x) => x],
    [2.9, [1.55, 0.95, 2.85]], [5.3, [1.15, 0.8, 2.6], (x) => x],
    [6.6, [0.98, 0.84, 2.8]], [7.6, [0.88, 0.86, 3.3]],
    [8.6, [0.78, 1.0, 3.55]], [10, [0.68, 1.02, 3.7], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.08, 1.0, 0]], [1.3, [0.1, 0.98, 0], (x) => x],
    [2.9, [0.02, 0.62, 0.25]], [5.3, [-0.25, 0.56, 0.25], (x) => x],
    [6.6, [-0.3, 0.6, 0.35]], [7.6, [-0.18, 0.56, 0.7]],
    [8.6, [0.05, 0.52, 0.55]], [10, [0.05, 0.54, 0.5], (x) => x],
  ]);
  const tgt = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    const shake = Math.exp(-7 * Math.max(0, t - LANDT)) * (t > LANDT ? 1 : 0);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.005 + Math.sin(t * 60) * 0.006 * shake, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 20], [1.3, 20], [2.9, 36], [6.6, 35], [7.6, 35], [8.6, 38], [10, 37]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Design mode: cursor glides to Play and clicks it; selection lets go.
    const cp = kf(t, [[0, [1.7, 0.45, 0.32]], [1.12, [FW / 2 - 0.27, FB + FH + 0.12, 0.12]], [1.48, [FW / 2 - 0.25, FB + FH + 0.1, 0.12]], [2.2, [1.9, 1.15, 0.5]]]);
    const press = Math.sin(Math.PI * k(t, PRESS - 0.06, PRESS + 0.12));
    cursor.position.set(cp[0], cp[1], cp[2] - press * 0.05);
    cursor.scale.setScalar(Math.max(0.001, 1 - eo(k(t, 1.8, 2.2))) * (1 - press * 0.12));
    cursor.visible = t < 2.2;
    pill.position.z = 0.03 - press * 0.022;
    pill.scale.set(1 + press * 0.04, 1 - press * 0.08, 1);
    if ((t >= PRESS) !== pillState) { pillState = t >= PRESS; pillOn(pillState); }
    pillRing.material.opacity = t > PRESS ? 0.9 * Math.exp(-5 * (t - PRESS)) : 0;
    pillRing.scale.setScalar(0.6 + eo(k(t, PRESS, PRESS + 0.5)) * 0.8);
    const selOut = eo(k(t, 1.35, 1.75));
    selMesh.material.opacity = 1 - selOut; selMesh.visible = selOut < 1;
    selMesh.scale.setScalar(1 + selOut * 0.03);
    name.material.opacity = 1 - eo(k(t, 2.0, 2.6)); name.visible = t < 2.6;
    pill.visible = t < 2.6;
    const chromeOut = 1 - eo(k(t, 2.0, 2.6));
    pill.scale.multiplyScalar(Math.max(0.001, chromeOut));

    // The frame plays: sky lights, layers spring out to depth one after another.
    const m = eio(k(t, 1.45, 2.1));
    skyGlow.material.opacity = 0.28 * m;
    sunGlow.material.opacity = 0.55 * m;
    pool.material.opacity = 0.16 * m;
    skyL.intensity = 1.5 * m;
    layers.forEach(([g, pt]) => { g.scale.z = Math.max(0.03, lerp(0.03, 1, spring(k(t, pt, pt + 0.65)))); });
    drawSky(t);

    // Level scroll.
    const s = sAt(t);
    groundTex.offset.x = (s / FW) * groundTex.repeat.x;
    OBS.forEach((o, i) => { o.position.x = X0[i] - s; o.visible = o.position.x > -FW / 2 - 0.4 && o.position.x < FW / 2 + 0.4; });

    // Board: rides, ollies, kickflips, then leaves the frame off the kicker.
    let x = BX, y = GY, z = GZ, pitch = 0, roll = 0, yaw = 0, lift = 0;
    JUMP.forEach((J, i) => {
      const a = k(t, J, J + AIR);
      if (a > 0 && a < 1) {
        lift = HOP[i] * 4 * a * (1 - a);
        pitch = 0.4 * Math.sin(Math.PI * k(a, 0, 0.42)) - 0.12 * Math.sin(Math.PI * k(a, 0.72, 1));
        if (i === 2) roll = Math.PI * 2 * eio(k(a, 0.12, 0.78));
      }
      const l = t - (J + AIR);
      if (l > 0 && l < 0.4) lift -= 0.012 * Math.exp(-9 * l) * Math.sin(16 * l);
    });
    // Up the kicker.
    const xr = X0[3] - s, xl = BX - xr;
    if (t < KICK && xl >= -0.34 && xl <= 0) { lift = 0.16 * (1 + xl / 0.34); pitch = 0.44; }
    if (t >= KICK) {
      const a = k(t, KICK, LANDT);
      x = lerp(BX, LAND_XZ[0], a); z = lerp(GZ, LAND_XZ[1], a);
      y = lerp(GY + 0.16, 0, a * a) + 4 * 0.5 * a * (1 - a);
      lift = 0;
      pitch = 0.44 * (1 - eo(k(a, 0, 0.45))) - 0.1 * Math.sin(Math.PI * k(a, 0.75, 1));
      roll = Math.PI * 2 * eio(k(a, 0.1, 0.8));
      yaw = -0.35 * eio(a);
      if (t > LANDT) {
        const r = eo(k(t, LANDT, LANDT + 0.9));
        x = lerp(LAND_XZ[0], REST_XZ[0], r); z = lerp(LAND_XZ[1], REST_XZ[1], r); y = 0;
        yaw = -0.35 - 0.6 * spring(k(t, LANDT, LANDT + 0.9));
        const l = t - LANDT; lift = -0.014 * Math.exp(-8 * l) * Math.sin(18 * l) + 0.02 * Math.exp(-8 * l) * (l < 0.2 ? Math.sin(Math.PI * l / 0.2) : 0);
        roll = Math.PI * 2; pitch = 0;
      }
    }
    const ride = t < KICK ? Math.sin(t * 43) * 0.0012 : 0;
    board.position.set(x, y + lift + ride, z);
    board.rotation.y = yaw;
    flip.rotation.set(roll, 0, pitch);
    // Wheels roll with the ground, then spin down on the canvas.
    const dist = t < KICK ? s : sAt(KICK) + (1 - Math.exp(-1.6 * (t - KICK))) * 0.6;
    wheels.forEach((w) => { w.rotation.set(Math.PI / 2, -dist / 0.026, 0); });
    const airK = k(t, KICK, LANDT);
    trail.material.opacity = 0.6 * Math.sin(Math.PI * airK) + JUMP.reduce((a, J) => a + 0.35 * Math.sin(Math.PI * k(t, J, J + AIR)), 0);

    // Dust puff where it lands.
    const dt = t - LANDT;
    dust.visible = dt > 0 && dt < 1.0;
    if (dust.visible) {
      for (let i = 0; i < DN; i++) {
        const th = rnd(i, 21) * Math.PI * 2, sp = 0.18 + rnd(i, 22) * 0.3, r = (1 - Math.exp(-4 * dt)) * sp;
        dPos[i * 3] = LAND_XZ[0] + Math.cos(th) * r;
        dPos[i * 3 + 1] = 0.01 + (rnd(i, 23) * 0.12) * Math.sin(Math.PI * clamp(dt / 0.8));
        dPos[i * 3 + 2] = LAND_XZ[1] + Math.sin(th) * r * 0.6;
      }
      dGeo.attributes.position.needsUpdate = true;
      dust.material.opacity = 0.7 * (1 - dt);
    }
  }

  return { scene, camera, update, duration: D, poster: 8.9 };
}
