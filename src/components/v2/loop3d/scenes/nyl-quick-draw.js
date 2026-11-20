// New York Lottery Quick Draw rebrand lit loop, 10 s. "Players first, then the mark, then the game."
// A designer's light table in a dark graphite studio, an architect's lamp clicked on over it. Three
// acrylic speech bubbles rise beside the table: the player interviews, the qualitative research. The
// lightbox flickers on under three vellum logo sketches, and threads of light run from every bubble to
// the one sketch the research points at. The other two slide away; the chosen sketch lifts, stands up
// and inks into a glossy Quick Draw mark. Beneath it the pick grid rises out of the glass in a wave,
// and balls drop onto the player's spots, each one lighting its number as it lands.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const YEL = '#ffd23f', MAG = '#ff3d8b', CYAN = '#33c6ff';
const BUB = [
  { c: YEL, p: [-1.0, 0.5, -0.18], ry: 0.38, t: 0.55, w: [0.82, 0.6] },
  { c: CYAN, p: [-0.74, 0.8, -0.32], ry: 0.3, t: 0.95, w: [0.7, 0.86] },
  { c: MAG, p: [-1.06, 1.1, -0.44], ry: 0.34, t: 1.35, w: [0.9, 0.5] },
];
const SK = [[-0.6, -0.02, 0.12], [0, -0.06, -0.04], [0.6, 0.0, -0.1]]; // sketch sheets: x, z, rotY
const CHOSEN = 1;
const LOGO = [0, 0.74, -0.42];
const COLS = 8, ROWS = 5, CX = 0.17, CZ = 0.14, GZ = 0.3, TOP = 0.044;
const PICKS = [4, 12, 15, 23, 30, 37];
const PICK_T = PICKS.map((_, i) => 6.35 + i * 0.27);    // ball lands
const cellPos = (n, out) => { const r = Math.floor((n - 1) / COLS), c = (n - 1) % COLS; return out.set(-COLS * CX / 2 + (c + 0.5) * CX, TOP, GZ - ROWS * CZ / 2 + (r + 0.5) * CZ); };

// A pencil mark on vellum: every stroke laid down three times with a little wander.
function sketch(i) {
  return canvasTex(512, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(246,244,236,0.92)'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(160,170,190,0.35)'; c.lineWidth = 1;
    for (let x = 32; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); c.beginPath(); c.moveTo(0, x); c.lineTo(w, x); c.stroke(); }
    c.lineCap = 'round'; c.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) {
      const j = (n) => (rnd(n + pass * 31, i + 5) - 0.5) * 7;
      c.strokeStyle = `rgba(38,40,52,${0.42 + pass * 0.12})`; c.lineWidth = 2.6 + pass * 0.6;
      c.save(); c.translate(w / 2 + j(1), h / 2 + j(2));
      if (i === 0) { // a ball in a starburst
        c.beginPath(); c.arc(0, 0, 92 + j(3), 0, Math.PI * 2); c.stroke();
        for (let r = 0; r < 16; r++) { const a = r / 16 * Math.PI * 2; c.beginPath(); c.moveTo(Math.cos(a) * 118, Math.sin(a) * 118); c.lineTo(Math.cos(a) * (170 + (r % 2) * 30 + j(r)), Math.sin(a) * (170 + (r % 2) * 30 + j(r + 9))); c.stroke(); }
      } else if (i === 1) { // a tile with the name: the one the research points at
        roundRect(c, -170 + j(4), -150 + j(5), 340, 300, 56); c.stroke();
        c.font = `800 92px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.strokeText('Quick', j(6), -44); c.strokeText('Draw', j(7), 56);
        c.beginPath(); c.moveTo(-120, 112); c.quadraticCurveTo(0, 138 + j(8), 120, 112); c.stroke();
      } else { // a ball with a lightning stroke
        c.beginPath(); c.arc(0, 0, 150 + j(3), 0, Math.PI * 2); c.stroke();
        c.beginPath(); c.moveTo(30, -120); c.lineTo(-50, 10); c.lineTo(10, 10); c.lineTo(-30, 120); c.lineTo(70, -20); c.lineTo(10, -20); c.closePath(); c.stroke();
      }
      c.restore();
    }
  });
}

function bubbleShape(w, h, r) {
  const s = new THREE.Shape();
  const x0 = -w / 2, y0 = -h / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x0 + w * 0.3, y0); s.lineTo(x0 + w * 0.16, y0 - h * 0.32); s.lineTo(x0 + w * 0.46, y0);
  s.lineTo(x0 + w - r, y0); s.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r);
  s.lineTo(x0 + w, y0 + h - r); s.quadraticCurveTo(x0 + w, y0 + h, x0 + w - r, y0 + h);
  s.lineTo(x0 + r, y0 + h); s.quadraticCurveTo(x0, y0 + h, x0, y0 + h - r);
  s.lineTo(x0, y0 + r); s.quadraticCurveTo(x0, y0, x0 + r, y0);
  return s;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0a0c);
  scene.fog = new THREE.Fog(0x0b0a0c, 3.2, 8);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- studio
  const wall = mesh(new THREE.PlaneGeometry(10, 5), std(0xffffff, { map: grainTex('#1a181c', { size: 256, speck: 0.06, blot: 0.1, seed: 12, repeat: 3 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 1.4, -1.7); scene.add(wall);
  const floor = mesh(new THREE.PlaneGeometry(12, 8), std(0x121114, { roughness: 0.55, metalness: 0.2 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.85; scene.add(floor);
  // Arcade colors out of focus on the far wall: the room Quick Draw plays in.
  [[-1.9, 1.6, MAG, 1.6], [-0.6, 1.95, CYAN, 1.1], [0.9, 1.75, YEL, 1.3], [2.1, 1.3, MAG, 1.0], [1.6, 2.2, CYAN, 0.9]].forEach(([x, y, c, s], i) => {
    const g = glow(new THREE.Color(c), s, 0.16 + rnd(i, 2) * 0.08, 0.5); g.position.set(x, y, -1.6); scene.add(g);
  });

  // The light table: a steel frame, a frosted top that glows from inside.
  const frame = mesh(new RoundedBoxGeometry(2.86, 0.09, 1.72, 2, 0.02), std(0x2a2b30, { metalness: 0.8, roughness: 0.35 }));
  frame.position.set(0, -0.046, 0.05); scene.add(frame);
  const apron = mesh(new THREE.BoxGeometry(2.8, 0.7, 1.6), std(0x18181b, { roughness: 0.6, metalness: 0.3 }));
  apron.position.set(0, -0.44, 0.05); scene.add(apron);
  const gridTex = canvasTex(1024, 600, (c, w, h) => {
    const g = c.createRadialGradient(w / 2, h / 2, 40, w / 2, h / 2, w * 0.62);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#8a96aa');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(70,90,130,0.25)'; c.lineWidth = 1.5;
    for (let x = 0; x < w; x += 32) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    for (let y = 0; y < h; y += 32) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
  }).tex;
  const glassM = std(0x14161b, { roughness: 0.25, metalness: 0, emissive: 0xc4d6ff, emissiveMap: gridTex, emissiveIntensity: 0 });
  const glass = mesh(new THREE.PlaneGeometry(2.62, 1.52), glassM, { cast: false });
  glass.rotation.x = -Math.PI / 2; glass.position.set(0, 0.001, 0.05); scene.add(glass);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x8a90b0, 0x1a1418, 0.22));
  // The architect's lamp: its head is the key light.
  const lampHead = new THREE.Vector3(0.62, 1.42, -0.2), lampAim = new THREE.Vector3(-0.05, 0, 0.05);
  const key = new THREE.SpotLight(0xffd6a2, 0, 0, 0.8, 0.6, 1.6);
  key.position.copy(lampHead); key.target.position.copy(lampAim);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.3; key.shadow.camera.far = 4; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const up = new THREE.PointLight(0xcfdcff, 0, 2.4, 1.8); up.position.set(0, 0.18, 0.05); scene.add(up);
  const rimM = new THREE.DirectionalLight(0xff4f9a, 0.75); rimM.position.set(-2.5, 1.6, -2.4); scene.add(rimM);
  const rimC = new THREE.DirectionalLight(0x4fd2ff, 0.6); rimC.position.set(2.6, 1.4, -2.2); scene.add(rimC);
  const logoL = new THREE.PointLight(0xff4f9a, 0, 1.6, 2); scene.add(logoL);

  // Lamp body, built back from the head to a clamp on the table edge.
  const lampM = std(0x2b2d33, { metalness: 0.7, roughness: 0.35 });
  const lamp = new THREE.Group(); scene.add(lamp);
  const lampPart = (m) => { m.castShadow = false; lamp.add(m); };
  const base = new THREE.Vector3(1.28, 0, -0.66), elbow = new THREE.Vector3(1.12, 1.15, -0.62);
  const rod = (a, b) => { const r = mesh(new THREE.CylinderGeometry(0.013, 0.013, a.distanceTo(b), 10), lampM); r.position.copy(a).add(b).multiplyScalar(0.5); r.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); lampPart(r); };
  const neckP = lampHead.clone().add(new THREE.Vector3(0.1, 0.1, -0.05));
  rod(base, elbow); rod(elbow, neckP);
  const clamp1 = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.05, 20), lampM); clamp1.position.copy(base).setY(0.025); lampPart(clamp1);
  const joint = mesh(new THREE.SphereGeometry(0.026, 16, 12), lampM); joint.position.copy(elbow); lampPart(joint);
  const shade = mesh(new THREE.ConeGeometry(0.11, 0.17, 28, 1, true), std(0x3a1f2c, { metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
  shade.position.copy(lampHead); shade.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), lampAim.clone().sub(lampHead).normalize());
  shade.translateY(0.06); lampPart(shade);
  const lampGlow = glow(0xffd09a, 0.5, 0, 0.3); lampGlow.position.copy(lampHead); scene.add(lampGlow);

  // ----------------------------------------------------------- research: the speech bubbles
  const bubbles = BUB.map((b, i) => {
    const g = new THREE.Group();
    const col = new THREE.Color(b.c);
    const geo = new THREE.ExtrudeGeometry(bubbleShape(0.42, 0.24, 0.06), { depth: 0.022, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 3, curveSegments: 10 });
    geo.translate(0, 0, -0.011);
    const body = mesh(geo, std(col, { roughness: 0.18, metalness: 0, emissive: col, emissiveIntensity: 0.2 }));
    g.add(body);
    const face = canvasTex(420, 240, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(20,18,26,0.85)'; c.font = `900 120px ${SANS}`; c.textBaseline = 'top'; c.fillText('“', 26, 6);
      c.fillStyle = 'rgba(20,18,26,0.6)';
      roundRect(c, 110, 70, 270 * b.w[0], 22, 11); c.fill();
      roundRect(c, 110, 116, 270 * b.w[1], 22, 11); c.fill();
      roundRect(c, 110, 162, 120, 22, 11); c.fill();
    });
    const fp = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.24), new THREE.MeshBasicMaterial({ map: face.tex, transparent: true, depthWrite: false }));
    fp.position.z = 0.02; g.add(fp);
    g.position.set(...b.p); g.rotation.y = b.ry;
    scene.add(g);
    // The tail tip, in world space, where this bubble's thread starts.
    g.updateMatrixWorld();
    const tip = new THREE.Vector3(-0.21 + 0.42 * 0.16, -0.12 - 0.24 * 0.32, 0).applyMatrix4(g.matrixWorld);
    return { g, tip };
  });
  const research = label('Qualitative research', { font: `700 56px ${MONO}`, fg: '#e8e6f0', h: 0.1, track: 3 });
  research.position.set(-0.5, 0.56, -0.66); research.rotation.y = 0.32; scene.add(research);

  // ----------------------------------------------------------- logo sketches on the lightbox
  const sheets = SK.map(([x, z, ry], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.5), new THREE.MeshBasicMaterial({ map: sketch(i).tex, transparent: true, toneMapped: false, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    m.rotation.set(-Math.PI / 2, 0, ry); m.position.set(x, 0.004, z); m.renderOrder = 1;
    scene.add(m);
    return m;
  });
  const ringTex = canvasTex(256, 256, (c, w) => { c.strokeStyle = '#fff'; c.lineWidth = 12; roundRect(c, 8, 8, w - 16, w - 16, 30); c.stroke(); }).tex;
  const ring = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), new THREE.MeshBasicMaterial({ map: ringTex, color: new THREE.Color(MAG), transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
  ring.rotation.x = -Math.PI / 2; ring.position.set(SK[CHOSEN][0], 0.008, SK[CHOSEN][1]); ring.renderOrder = 2; scene.add(ring);

  // Threads of light from each interview to the chosen sketch.
  const SEG = 60, RAD = 6;
  const threads = bubbles.map(({ tip }, i) => {
    const end = new THREE.Vector3(SK[CHOSEN][0] - 0.12 + i * 0.06, 0.01, SK[CHOSEN][1] + 0.1 - i * 0.08);
    const midP = tip.clone().lerp(end, 0.5).add(new THREE.Vector3(0, 0.32 - i * 0.05, 0.15));
    const curve = new THREE.CatmullRomCurve3([tip, midP, end]);
    const geo = new THREE.TubeGeometry(curve, SEG, 0.0035, RAD, false);
    const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: new THREE.Color(BUB[i].c), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
    m.geometry.setDrawRange(0, 0);
    const head = glow(new THREE.Color(BUB[i].c), 0.12, 0, 0.3);
    scene.add(m, head);
    return { m, head, curve, n: geo.index.count };
  });

  // ----------------------------------------------------------- the mark
  const logo = new THREE.Group(); scene.add(logo);
  const slabM = new THREE.MeshPhysicalMaterial({ color: 0xc8175e, roughness: 0.25, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.08 });
  const slab = mesh(new RoundedBoxGeometry(0.66, 0.66, 0.06, 4, 0.07), slabM); logo.add(slab);
  const logoTex = canvasTex(512, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.save(); roundRect(c, 0, 0, w, h, 60); c.clip();
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#7a1048'); g.addColorStop(0.55, '#d81b68'); g.addColorStop(1, '#ff5a7a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.save(); c.translate(w / 2, h * 0.47); c.rotate(-0.08);
    c.fillStyle = YEL; c.beginPath();
    for (let r = 0; r < 32; r++) { const a = r / 32 * Math.PI * 2, R = r % 2 ? 150 : 210; c.lineTo(Math.cos(a) * R, Math.sin(a) * R); }
    c.closePath(); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0, 0, 148, 0, 7); c.fill();
    c.fillStyle = '#16121c'; c.font = `900 84px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText('Quick', 0, -40); c.fillStyle = '#d81b68'; c.fillText('Draw', 0, 46);
    c.restore();
    c.fillStyle = 'rgba(255,255,255,0.88)'; c.font = `700 30px ${SANS}`; c.textAlign = 'center'; c.fillText('New York Lottery', w / 2, h - 34);
    c.restore();
  }).tex;
  const logoFace = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.62), std(0xffffff, { map: logoTex, transparent: true, roughness: 0.32, emissive: 0xffffff, emissiveMap: logoTex, emissiveIntensity: 0.22 }));
  logoFace.position.z = 0.0315; logo.add(logoFace);
  const logoGlow = glow(new THREE.Color(MAG), 1.8, 0, 0.45); logoGlow.position.z = -0.1; logo.add(logoGlow);

  // ----------------------------------------------------------- the pick grid
  const tileG = new RoundedBoxGeometry(CX - 0.018, TOP, CZ - 0.018, 2, 0.01); tileG.translate(0, TOP / 2, 0);
  const tiles = new THREE.InstancedMesh(tileG, std(0x1c1e25, { roughness: 0.28, metalness: 0.45 }), COLS * ROWS);
  tiles.castShadow = true; tiles.receiveShadow = true; scene.add(tiles);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const ov = canvasTex(1024, 528);
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(COLS * CX, ROWS * CZ), new THREE.MeshBasicMaterial({ map: ov.tex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  overlay.rotation.x = -Math.PI / 2; overlay.position.set(0, TOP + 0.0015, GZ); overlay.renderOrder = 3; scene.add(overlay);
  let ovKey = '';
  const drawOverlay = (t) => {
    const lit = PICK_T.map((p) => clamp((t - p) / 0.18));
    const key = lit.map((x) => x.toFixed(2)).join('|');
    if (key === ovKey) return; ovKey = key;
    ov.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      const cw = w / COLS, ch = h / ROWS;
      c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let n = 1; n <= COLS * ROWS; n++) {
        const r = Math.floor((n - 1) / COLS), q = (n - 1) % COLS, x = q * cw + cw / 2, y = r * ch + ch / 2;
        const pi = PICKS.indexOf(n), l = pi >= 0 ? lit[pi] : 0;
        if (l > 0) {
          c.globalAlpha = l; c.fillStyle = MAG; roundRect(c, x - cw / 2 + 12, y - ch / 2 + 11, cw - 24, ch - 22, 16); c.fill();
          c.globalAlpha = 1;
        }
        c.fillStyle = l > 0.5 ? '#fff6d8' : 'rgba(205,212,228,0.82)';
        c.font = `${l > 0.5 ? 800 : 600} 46px ${MONO}`; c.fillText(String(n), x, y + 3);
      }
    });
  };
  // The balls the player picks with.
  const balls = new THREE.InstancedMesh(new THREE.SphereGeometry(0.034, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xffd23f, roughness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, emissive: 0x6a4a00, emissiveIntensity: 0.4 }), PICKS.length);
  balls.castShadow = true; scene.add(balls);
  const pops = PICKS.map(() => { const g = glow(new THREE.Color(MAG), 0.32, 0, 0.3); scene.add(g); return g; });
  const ringPops = PICKS.map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: ringTex, color: new THREE.Color(YEL), transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); scene.add(s); return s; });

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.3, 0.98, 1.3]], [2.4, [-0.42, 0.92, 1.42], (x) => x],
    [3.5, [0.06, 1.62, 1.18]], [4.6, [0.04, 1.5, 1.32], (x) => x],
    [5.8, [0.1, 1.12, 2.35]], [8.2, [0.2, 1.06, 2.45], (x) => x],
    [10, [0.3, 1.1, 2.62], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.8, 0.78, -0.3]], [2.4, [-0.77, 0.76, -0.3], (x) => x],
    [3.5, [0, 0.02, -0.02]], [4.6, [0, 0.12, -0.06], (x) => x],
    [5.8, [-0.02, 0.44, 0.0]], [8.2, [-0.02, 0.42, 0.02], (x) => x],
    [10, [-0.08, 0.45, -0.02], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3();
  const flatQ = new THREE.Quaternion(), upQ = new THREE.Quaternion(), eul = new THREE.Euler();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.15) * 0.006, p[1] + Math.sin(t * 1.7 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 32], [2.4, 31], [3.5, 34], [5.8, 36], [10, 36]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // The lamp clicks on; later the lightbox stutters on under the sketches.
    const lampOn = clamp(back(k(t, 0.2, 0.55)));
    key.intensity = 8.5 * lampOn;
    lampGlow.material.opacity = 0.85 * clamp(lampOn);
    const boxOn = eo(k(t, 1.85, 2.35)) * (t > 1.85 && t < 2.2 ? (rnd(Math.floor(t * 24), 3) > 0.4 ? 1 : 0.35) : 1);
    glassM.emissiveIntensity = 0.5 * boxOn;
    up.intensity = 0.55 * boxOn;

    // Bubbles pop up one by one and bob; the research label fades in under the last.
    bubbles.forEach(({ g }, i) => {
      const s = back(k(t, BUB[i].t, BUB[i].t + 0.5));
      g.scale.setScalar(Math.max(0.001, s));
      g.position.set(BUB[i].p[0], BUB[i].p[1] + Math.sin(t * 1.3 + i * 2) * 0.012 - (1 - eo(k(t, BUB[i].t, BUB[i].t + 0.5))) * 0.12, BUB[i].p[2]);
      g.rotation.set(Math.sin(t * 0.9 + i) * 0.03, BUB[i].ry + Math.sin(t * 0.7 + i * 3) * 0.05, Math.sin(t * 1.1 + i) * 0.02);
      g.visible = s > 0.001;
    });
    research.material.opacity = eo(k(t, 1.65, 2.1)) * (1 - eo(k(t, 4.3, 4.8)));
    research.visible = research.material.opacity > 0.01;
    research.position.y = 0.56 - (1 - eo(k(t, 1.65, 2.1))) * 0.05;

    // Sketches lit from below; threads run to the chosen one.
    const pick = k(t, 3.85, 4.3), dim = eio(pick);
    sheets.forEach((m, i) => {
      const chosen = i === CHOSEN;
      const placed = eo(k(t, 1.75 + i * 0.12, 2.35 + i * 0.12));
      m.material.color.setScalar(lerp(0.22, 0.9, boxOn));
      if (!chosen) {
        const out = eio(k(t, 3.95, 4.6));
        m.position.set(SK[i][0] + Math.sign(SK[i][0]) * (out * 0.9 + (1 - placed) * 0.5), 0.004, SK[i][1] + out * 0.15);
        m.material.opacity = placed * (1 - dim * 0.75) * (1 - out);
        m.visible = m.material.opacity > 0.01;
      }
    });
    threads.forEach(({ m, head, curve, n }, i) => {
      const d = eio(k(t, 2.7 + i * 0.2, 3.5 + i * 0.2));
      m.geometry.setDrawRange(0, Math.floor(d * n / 3) * 3);
      const fade = 1 - eo(k(t, 4.7, 5.3));
      m.material.opacity = 0.85 * fade + 0.15 * Math.sin(Math.PI * k(t, 3.85, 4.4)) * fade;
      m.visible = d > 0 && fade > 0.01;
      curve.getPoint(d, head.position);
      head.material.opacity = d > 0 && d < 1 ? 1 : (d >= 1 ? 0.6 * fade * Math.exp(-3 * Math.max(0, t - 3.5 - i * 0.2)) : 0);
    });
    const rp = back(pick);
    ring.material.opacity = 0.9 * clamp(rp) * (1 - eo(k(t, 4.45, 4.75)));
    ring.scale.setScalar(Math.max(0.001, lerp(1.25, 1, clamp(rp))));
    ring.visible = ring.material.opacity > 0.01;

    // The chosen sketch lifts, stands up and becomes the mark.
    const lift = eio(k(t, 4.35, 5.25));
    const S = sheets[CHOSEN];
    flatQ.setFromEuler(eul.set(-Math.PI / 2, 0, SK[CHOSEN][2]));
    upQ.setFromEuler(eul.set(0, 0, 0));
    S.quaternion.slerpQuaternions(flatQ, upQ, lift);
    a.set(SK[CHOSEN][0], 0.004, SK[CHOSEN][1]); b.set(...LOGO);
    S.position.lerpVectors(a, b, lift); S.position.y += Math.sin(Math.PI * lift) * 0.18;
    S.scale.setScalar(lerp(1, 1.3, lift));
    const ink = eo(k(t, 4.95, 5.35));
    S.material.opacity = eo(k(t, 1.75, 2.3)) * (1 - ink);
    S.visible = S.material.opacity > 0.01;
    const form = back(k(t, 4.95, 5.5));
    logo.position.set(LOGO[0], LOGO[1] + Math.sin(t * 1.2) * 0.012 * form, LOGO[2]);
    logo.rotation.set(Math.sin(t * 0.8) * 0.03 * form, Math.sin(t * 0.55 + 0.6) * 0.16 * form + (1 - eo(k(t, 4.95, 5.6))) * 0.5, 0);
    logo.scale.setScalar(Math.max(0.001, form));
    logo.visible = form > 0.001;
    logoGlow.material.opacity = 0.32 * clamp(form) + 0.5 * Math.exp(-4 * Math.max(0, t - 5.0)) * (t > 5 ? 1 : 0);
    logo.getWorldPosition(logoL.position); logoL.position.z += 0.35; logoL.intensity = 0.9 * clamp(form);

    // The pick grid rises out of the glass in a wave from the mark outward.
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c, wv = Math.abs(c - 3.5) * 0.05 + r * 0.06;
      const rise = back(k(t, 5.3 + wv, 5.75 + wv));
      cellPos(i + 1, p4); p4.y = 0;
      p4.y -= (1 - clamp(rise)) * 0.02;
      m4.compose(p4, q4.identity(), s4.set(1, Math.max(0.001, rise), 1));
      tiles.setMatrixAt(i, m4);
    }
    tiles.instanceMatrix.needsUpdate = true;
    tiles.visible = t > 5.3;
    overlay.material.opacity = eo(k(t, 5.85, 6.3));
    overlay.visible = t > 5.85;
    drawOverlay(t);

    // Balls drop onto the picks: fall, land, sink into the spot as it lights.
    PICKS.forEach((n, i) => {
      const land = PICK_T[i];
      cellPos(n, a);
      const fall = k(t, land - 0.42, land), sink = eo(k(t, land + 0.05, land + 0.3));
      const y = lerp(0.95, TOP + 0.034, ei(fall)) + (t > land ? Math.abs(Math.sin((t - land) * 18)) * Math.exp(-14 * (t - land)) * 0.03 : 0);
      const sc = fall > 0 ? (1 - sink) : 0;
      const sq = Math.max(0.001, sc);
      m4.compose(p4.set(a.x, y - sink * 0.03, a.z), q4.identity(), s4.set(sq * (1 + 0.25 * sink), sq * (1 - 0.3 * sink), sq * (1 + 0.25 * sink)));
      balls.setMatrixAt(i, m4);
      const flash = t > land ? Math.exp(-4 * (t - land)) : 0;
      pops[i].position.set(a.x, TOP + 0.03, a.z);
      pops[i].material.opacity = 0.9 * flash + (t > land ? 0.28 : 0);
      pops[i].visible = t > land;
      const rr = clamp((t - land) / 0.5);
      ringPops[i].position.set(a.x, TOP + 0.02, a.z);
      ringPops[i].scale.setScalar(0.05 + rr * 0.22);
      ringPops[i].material.opacity = t > land ? 0.8 * (1 - rr) : 0;
      ringPops[i].visible = t > land && rr < 1;
    });
    balls.instanceMatrix.needsUpdate = true;
    balls.visible = t > PICK_T[0] - 0.45 && t < PICK_T[PICK_T.length - 1] + 0.35;
  }

  return { scene, camera, update, duration: D, poster: 8.3 };
}
