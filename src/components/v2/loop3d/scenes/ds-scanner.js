// Design System Scanner lit loop, 10 s. "Scan a page, get its system."
// A dark inspection bench in a violet-black lab. A web page stands on the bench as a backlit glass panel,
// its parts raised off the glass like an exploded view. A scanner carriage rides rails across it, a
// violet laser sheet raking every element; each part it reads is bracketed, and a sample lifts off and
// flies into a specimen tray: COLOR chips, TYPE tiles, BUTTONS. In the tray the two buttons disagree
// (one pill, one square) and an amber flag reads 2 BUTTON STYLES. The square one rounds into a pill, the
// flag turns mint (1 BUTTON STYLE), a streak of light carries the fix back to the page, and its square
// button rounds too.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const INK = '#24212f', CORAL = '#ff6a3d', SKY = '#6f86ff', GRAY = '#9a96a6';
const VIOLET = 0x8b5cff, AMBER = 0xffae2b, MINT = 0x3ee6a8;
const MONO = '"JetBrains Mono", monospace', SANS = 'Inter, system-ui, sans-serif';

// The page, in its own units: 1.3 x 0.9, origin at its center, +z toward the viewer.
const PW = 1.3, PH = 0.9;
const BW = 0.26, BH = 0.075; // button size
// Raised page elements: [x, y, w, h, z-lift].
const EL = {
  head: [-0.3, 0.27, 0.56, 0.07, 0.022],
  sub: [-0.39, 0.185, 0.38, 0.03, 0.016],
  hero: [0.0, -0.02, 1.12, 0.3, 0.03],
  btnA: [-0.41, -0.255, BW, BH, 0.03],
  btnB: [-0.11, -0.255, BW, BH, 0.03],
  body: [0.06, -0.36, 1.0, 0.075, 0.014],
};
// Samples the scan pulls. src: page point the sample leaves from; kind; slot in the tray.
const SAMPLES = [
  { kind: 'chip', c: INK, src: [-0.5, 0.41], slot: [-0.33, 0.27] },
  { kind: 'chip', c: CORAL, src: [-0.36, -0.2], slot: [-0.11, 0.27] },
  { kind: 'chip', c: SKY, src: [0.18, 0.0], slot: [0.11, 0.27] },
  { kind: 'chip', c: GRAY, src: [0.38, -0.36], slot: [0.33, 0.27] },
  { kind: 'type', s: 1, src: [-0.42, 0.27], slot: [-0.28, -0.03] },
  { kind: 'type', s: 0.72, src: [-0.3, 0.185], slot: [-0.04, -0.03] },
  { kind: 'type', s: 0.5, src: [0.22, -0.36], slot: [0.2, -0.03] },
  { kind: 'btn', round: true, src: [-0.41, -0.255], slot: [-0.2, -0.33] },
  { kind: 'btn', round: false, src: [-0.11, -0.255], slot: [0.16, -0.33] },
];
const FLAG = 5.15, FIX = 6.45, BACK = 7.0, PAGEFIX = 7.62;

// A rounded-rect slab whose corner radius can morph: fixed vertex layout for any radius, so a second
// copy at another radius works as a morph target. Caps are fans from the center (the shape is convex).
function slabAttrs(w, h, d, r, seg = 6) {
  const pts = [], nrm = [];
  const C = [[w / 2 - r, h / 2 - r], [-w / 2 + r, h / 2 - r], [-w / 2 + r, -h / 2 + r], [w / 2 - r, -h / 2 + r]];
  C.forEach(([cx, cy], c) => {
    for (let i = 0; i <= seg; i++) {
      const a = (c + i / seg) * Math.PI / 2;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); nrm.push([Math.cos(a), Math.sin(a)]);
    }
  });
  const N = pts.length, P = [], Nn = [], U = [];
  const z1 = d / 2, z0 = -d / 2;
  const v = (x, y, z, nx, ny, nz, u, vv) => { P.push(x, y, z); Nn.push(nx, ny, nz); U.push(u, vv); };
  const uv = (x, y) => [x / w + 0.5, y / h + 0.5];
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N, [ax, ay] = pts[i], [bx, by] = pts[j];
    v(0, 0, z1, 0, 0, 1, 0.5, 0.5); v(ax, ay, z1, 0, 0, 1, ...uv(ax, ay)); v(bx, by, z1, 0, 0, 1, ...uv(bx, by));
    v(0, 0, z0, 0, 0, -1, 0.5, 0.5); v(bx, by, z0, 0, 0, -1, ...uv(bx, by)); v(ax, ay, z0, 0, 0, -1, ...uv(ax, ay));
    const [anx, any] = nrm[i], [bnx, bny] = nrm[j];
    v(ax, ay, z0, anx, any, 0, 0.5, 0.04); v(bx, by, z0, bnx, bny, 0, 0.5, 0.04); v(bx, by, z1, bnx, bny, 0, 0.5, 0.04);
    v(ax, ay, z0, anx, any, 0, 0.5, 0.04); v(bx, by, z1, bnx, bny, 0, 0.5, 0.04); v(ax, ay, z1, anx, any, 0, 0.5, 0.04);
  }
  return { P: new Float32Array(P), N: new Float32Array(Nn), U: new Float32Array(U) };
}
function buttonGeo(round, morph) {
  const a = slabAttrs(BW, BH, 0.024, round ? BH / 2 : 0.006);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(a.P, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(a.N, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(a.U, 2));
  if (morph) {
    const b = slabAttrs(BW, BH, 0.024, BH / 2);
    g.morphAttributes.position = [new THREE.BufferAttribute(b.P, 3)];
    g.morphAttributes.normal = [new THREE.BufferAttribute(b.N, 3)];
  }
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x06050b);
  scene.fog = new THREE.Fog(0x06050b, 4.2, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- bench and lab
  const bench = mesh(new THREE.PlaneGeometry(12, 6), std(0xffffff, { map: grainTex('#14121c', { size: 512, speck: 0.04, blot: 0.08, seed: 31, repeat: 5 }), roughness: 0.32, metalness: 0.35 }), { cast: false });
  bench.rotation.x = -Math.PI / 2; bench.position.z = -0.5; scene.add(bench);
  const lip = mesh(new THREE.BoxGeometry(12, 0.06, 0.06), std(0x1b1924, { roughness: 0.4, metalness: 0.6 }));
  lip.position.set(0, -0.03, 1.2); scene.add(lip);
  // Back wall: a dark acoustic panel with LED strips that the glossy bench reflects.
  const wallTex = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#0c0a12'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 16) { c.fillStyle = `rgba(255,255,255,${0.015 + rnd(x, 3) * 0.02})`; c.fillRect(x, 0, 8, h); }
  }).tex;
  wallTex.wrapS = THREE.RepeatWrapping; wallTex.repeat.set(4, 1);
  const wall = mesh(new THREE.PlaneGeometry(12, 4), std(0xffffff, { map: wallTex, roughness: 0.9 }), { cast: false });
  wall.position.set(0, 2, -1.9); scene.add(wall);
  [[-2.3, 0x7a5cff, 0.9], [0, 0xffb38a, 0.55], [2.3, 0x7a5cff, 0.9]].forEach(([x, c, o]) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.018), new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
    s.position.set(x, 1.62, -1.88); scene.add(s);
    const g = glow(c, 1, 0.3 * o, 0.5); g.position.set(x, 1.62, -1.85); g.scale.set(2.4, 0.4, 1); scene.add(g);
  });
  // Out-of-focus lab lights.
  [[-2.8, 1.1, -1.7, 0x5a4cff, 0.9], [-1.2, 2.2, -1.8, 0xff8a5c, 0.7], [1.5, 2.4, -1.8, 0x7a6bff, 1.0], [2.9, 0.9, -1.7, 0x3ee6a8, 0.6], [0.4, 0.45, -1.8, 0x8b5cff, 0.8]]
    .forEach(([x, y, z, c, s]) => { const g = glow(c, s, 0.28, 0.55); g.position.set(x, y, z); scene.add(g); });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5a50a8, 0x08060c, 0.32));
  const key = new THREE.SpotLight(0xfff0e2, 0, 0, 0.62, 0.8, 1.4);
  key.position.set(-1.7, 2.7, 2.1); key.target.position.set(0, 0.55, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1; key.shadow.camera.far = 7; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7a6bff, 1.3); rim.position.set(1.6, 1.9, -2.6); scene.add(rim);
  const rim2 = new THREE.DirectionalLight(0xff8a5c, 0.5); rim2.position.set(-2.4, 1.0, -2.0); scene.add(rim2);

  // ----------------------------------------------------------- the page
  const page = new THREE.Group();
  page.position.set(-0.68, 0.72, 0); page.rotation.y = 0.2; scene.add(page);
  const pageTex = canvasTex(1024, Math.round(1024 * PH / PW), (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d7d3e0'); g.addColorStop(1, '#c4bfd0');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = INK; c.fillRect(0, 0, w, 64);
    ['#ff5f57', '#febc2e', '#28c840'].forEach((col, i) => { c.fillStyle = col; c.beginPath(); c.arc(30 + i * 26, 32, 8, 0, 7); c.fill(); });
    c.fillStyle = 'rgba(255,255,255,0.12)'; roundRect(c, 130, 18, 420, 28, 14); c.fill();
    [600, 700, 800, 900].forEach((x) => { c.fillStyle = 'rgba(255,255,255,0.35)'; roundRect(c, x, 28, 70, 8, 4); c.fill(); });
  });
  const pageM = std(0xffffff, { map: pageTex.tex, emissive: 0xffffff, emissiveMap: pageTex.tex, emissiveIntensity: 0.42, roughness: 0.3, metalness: 0.05 });
  pageM.color.setScalar(0.55);
  const pageFace = mesh(new THREE.PlaneGeometry(PW, PH), pageM, { cast: false });
  page.add(pageFace);
  const glassBack = mesh(new RoundedBoxGeometry(PW + 0.04, PH + 0.04, 0.03, 3, 0.012), std(0x101018, { roughness: 0.2, metalness: 0.6 }));
  glassBack.position.z = -0.017; page.add(glassBack);
  const foot = mesh(new THREE.BoxGeometry(0.5, 0.05, 0.22), std(0x22202a, { roughness: 0.35, metalness: 0.8 }));
  foot.position.set(0, -PH / 2 - 0.27 + 0.025, 0.0); page.add(foot);
  const post = mesh(new THREE.BoxGeometry(0.06, 0.26, 0.04), std(0x2c2a35, { roughness: 0.3, metalness: 0.85 }));
  post.position.set(0, -PH / 2 - 0.12, -0.03); page.add(post);
  const pageGlow = glow(0xc9c2ff, 2.4, 0, 0.5); pageGlow.position.z = -0.15; pageGlow.scale.set(2.4, 1.7, 1); page.add(pageGlow);

  // Raised elements.
  const inkM = std(INK, { roughness: 0.45, metalness: 0.1, emissive: 0x2a2440, emissiveIntensity: 0.4 });
  const mkBar = ([x, y, w, h, z], m) => { const b = mesh(new RoundedBoxGeometry(w, h, 0.012, 2, Math.min(0.006, h / 2.2)), m); b.position.set(x, y, z); page.add(b); return b; };
  mkBar(EL.head, inkM);
  mkBar(EL.sub, std(0x6a6578, { roughness: 0.5 }));
  const bodyM = std(0x8f8a9c, { roughness: 0.5 });
  mkBar([EL.body[0], EL.body[1] + 0.022, EL.body[2], 0.022, EL.body[4]], bodyM);
  mkBar([EL.body[0] - 0.1, EL.body[1] - 0.022, EL.body[2] - 0.2, 0.022, EL.body[4]], bodyM);
  const heroTex = canvasTex(1024, 274, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#3b3f9a'); g.addColorStop(0.6, SKY); g.addColorStop(1, '#ffb08a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,220,180,0.9)'; c.beginPath(); c.arc(w * 0.72, h * 0.42, 34, 0, 7); c.fill();
    c.fillStyle = '#2a2a64'; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.18, h * 0.45); c.lineTo(w * 0.34, h * 0.78); c.lineTo(w * 0.5, h * 0.36); c.lineTo(w * 0.7, h * 0.86); c.lineTo(w * 0.86, h * 0.55); c.lineTo(w, h * 0.8); c.lineTo(w, h); c.fill();
    c.fillStyle = '#1b1a40'; c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.25, h * 0.72); c.lineTo(w * 0.55, h * 0.95); c.lineTo(w * 0.8, h * 0.7); c.lineTo(w, h * 0.92); c.lineTo(w, h); c.fill();
  });
  const hero = mesh(new RoundedBoxGeometry(EL.hero[2], EL.hero[3], 0.014, 2, 0.006), std(0xffffff, { map: heroTex.tex, emissive: 0xffffff, emissiveMap: heroTex.tex, emissiveIntensity: 0.35, roughness: 0.35 }));
  hero.position.set(EL.hero[0], EL.hero[1], EL.hero[4]); page.add(hero);
  // Button face: coral with a light pseudo-label bar; cap UVs map it, the sides sample the coral.
  const btnTex = canvasTex(256, 74, (c, w, h) => {
    c.fillStyle = CORAL; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,240,230,0.9)'; roundRect(c, w / 2 - 48, h / 2 - 6, 96, 12, 6); c.fill();
  }).tex;
  const btnM = () => std(0xffffff, { map: btnTex, emissive: 0xff6a3d, emissiveIntensity: 0.18, roughness: 0.35, metalness: 0.05 });
  const pageBtnA = mesh(buttonGeo(true, false), btnM()); pageBtnA.position.set(EL.btnA[0], EL.btnA[1], EL.btnA[4]); page.add(pageBtnA);
  const pageBtnB = mesh(buttonGeo(false, true), btnM()); pageBtnB.position.set(EL.btnB[0], EL.btnB[1], EL.btnB[4]); page.add(pageBtnB);
  const pageBGlow = glow(AMBER, 0.5, 0, 0.4); pageBGlow.position.set(EL.btnB[0], EL.btnB[1], 0.06); pageBGlow.scale.set(0.55, 0.26, 1); page.add(pageBGlow);

  // Brackets: violet corner marks drawn at each element's own aspect.
  const brackets = Object.keys(EL).map((name) => {
    const [x, y, w, h] = EL[name];
    const bw = w + 0.05, bh = h + 0.05, px = 600, py = Math.max(60, Math.round(px * bh / bw));
    const tex = canvasTex(px, py, (c, W, H) => {
      const L = Math.min(W, H) * 0.42, s = 6;
      c.strokeStyle = '#c4adff'; c.lineWidth = s; c.lineCap = 'square';
      [[s, s, 1, 1], [W - s, s, -1, 1], [s, H - s, 1, -1], [W - s, H - s, -1, -1]].forEach(([cx, cy, dx, dy]) => {
        c.beginPath(); c.moveTo(cx + dx * L, cy); c.lineTo(cx, cy); c.lineTo(cx, cy + dy * L); c.stroke();
      });
      c.fillStyle = 'rgba(139,92,255,0.10)'; c.fillRect(0, 0, W, H);
    }).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(bw, bh), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }));
    m.position.set(x, y, 0.058); m.visible = false; page.add(m);
    return { m, x: x - w / 2, name };
  });

  // Scanner: rails top and bottom, a carriage with a laser sheet that rakes the page.
  const metal = std(0xb9bcc8, { roughness: 0.28, metalness: 1 });
  [PH / 2 + 0.06, -PH / 2 - 0.06].forEach((y) => {
    const r = mesh(new THREE.CylinderGeometry(0.009, 0.009, PW + 0.3, 16), metal); r.rotation.z = Math.PI / 2; r.position.set(0, y, 0.13); page.add(r);
    [-1, 1].forEach((s) => { const cap = mesh(new THREE.BoxGeometry(0.04, 0.05, 0.16), std(0x2a2833, { roughness: 0.3, metalness: 0.8 })); cap.position.set(s * (PW / 2 + 0.15), y, 0.075); page.add(cap); });
  });
  const carriage = new THREE.Group(); page.add(carriage);
  const bar = mesh(new THREE.BoxGeometry(0.03, PH + 0.18, 0.035), std(0x2a2833, { roughness: 0.25, metalness: 0.9 })); bar.position.z = 0.13; carriage.add(bar);
  [PH / 2 + 0.06, -PH / 2 - 0.06].forEach((y) => { const h = mesh(new THREE.BoxGeometry(0.07, 0.05, 0.06), metal); h.position.set(0, y, 0.13); carriage.add(h); });
  const emitM = new THREE.MeshBasicMaterial({ color: VIOLET, toneMapped: false });
  const emitter = new THREE.Mesh(new THREE.BoxGeometry(0.008, PH + 0.04, 0.008), emitM); emitter.position.set(0, 0, 0.11); carriage.add(emitter);
  const sheetTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(160,120,255,0.05)'); g.addColorStop(1, 'rgba(190,160,255,0.55)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }).tex;
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.075, PH), new THREE.MeshBasicMaterial({ map: sheetTex, transparent: true, opacity: 0, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  sheet.rotation.y = -Math.PI / 2; sheet.position.set(0, 0, 0.07); carriage.add(sheet);
  const line = new THREE.Mesh(new THREE.PlaneGeometry(0.006, PH), new THREE.MeshBasicMaterial({ color: 0xe8ddff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  line.position.z = 0.047; carriage.add(line);
  const bandTex = canvasTex(256, 8, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(139,92,255,0)'); g.addColorStop(0.85, 'rgba(139,92,255,0.35)'); g.addColorStop(1, 'rgba(200,180,255,0.6)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }).tex;
  const band = new THREE.Mesh(new THREE.PlaneGeometry(0.22, PH), new THREE.MeshBasicMaterial({ map: bandTex, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  band.position.set(-0.11, 0, 0.045); carriage.add(band);
  const scanGlowT = glow(VIOLET, 0.35, 0, 0.35); scanGlowT.position.set(0, PH / 2 + 0.02, 0.11); carriage.add(scanGlowT);
  const scanGlowB = glow(VIOLET, 0.35, 0, 0.35); scanGlowB.position.set(0, -PH / 2 - 0.02, 0.11); carriage.add(scanGlowB);
  const scanLight = new THREE.PointLight(VIOLET, 0, 1.1, 1.5); scanLight.position.set(0, 0.05, 0.16); carriage.add(scanLight);
  // Out across the page (eased ends, steady middle), then home again, dark, while the camera is away.
  const scanX = (t) => lerp(-PW / 2 - 0.08, PW / 2 + 0.08, (eio(k(t, 0.85, 3.15)) * 0.25 + k(t, 0.85, 3.15) * 0.75) * (1 - eio(k(t, 3.7, 4.9))));

  // ----------------------------------------------------------- the specimen tray
  const tray = new THREE.Group();
  tray.rotation.order = 'YXZ'; tray.rotation.set(-0.36, -0.2, 0);
  tray.position.set(0.74, 0.72, 0.05); scene.add(tray);
  const TW = 1.0, TH = 0.92;
  const shell = mesh(new RoundedBoxGeometry(TW + 0.06, TH + 0.06, 0.08, 3, 0.02), std(0x1c1a24, { roughness: 0.32, metalness: 0.75 }));
  shell.position.z = -0.03; tray.add(shell);
  const feltTex = canvasTex(1024, Math.round(1024 * TH / TW), (c, w, h) => {
    c.fillStyle = '#231a3a'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 9000; i++) { c.fillStyle = `rgba(${rnd(i, 2) > 0.5 ? 255 : 0},${rnd(i, 2) > 0.5 ? 255 : 0},255,${rnd(i, 4) * 0.05})`; c.fillRect(rnd(i, 5) * w, rnd(i, 6) * h, 2, 2); }
    c.font = `700 46px ${MONO}`; c.textBaseline = 'middle'; c.fillStyle = 'rgba(214,204,240,0.85)';
    if ('letterSpacing' in c) c.letterSpacing = '6px';
    ['COLOR', 'TYPE', 'BUTTONS'].forEach((s, i) => c.fillText(s, 36, 44 + i * (h / 3)));
  });
  const felt = mesh(new THREE.PlaneGeometry(TW, TH), std(0xffffff, { map: feltTex.tex, roughness: 1 }), { cast: false });
  felt.position.z = 0.011; tray.add(felt);
  [TH / 6, -TH / 6].forEach((y) => { const dv = mesh(new THREE.BoxGeometry(TW, 0.012, 0.045), std(0x2a2733, { roughness: 0.3, metalness: 0.85 })); dv.position.set(0, y, 0.03); tray.add(dv); });
  // The tray leans on a column standing on the bench.
  const standM = std(0x22202a, { roughness: 0.35, metalness: 0.8 });
  const column = mesh(new THREE.BoxGeometry(0.3, 0.62, 0.07), standM); column.position.set(0.74, 0.31, -0.12); column.rotation.y = -0.2; scene.add(column);
  const plate = mesh(new THREE.BoxGeometry(0.62, 0.035, 0.42), standM); plate.position.set(0.74, 0.018, 0.02); plate.rotation.y = -0.2; scene.add(plate);
  const trayGlow = glow(0x8b5cff, 2, 0.18, 0.5); trayGlow.position.z = -0.2; trayGlow.scale.set(1.8, 1.6, 1); tray.add(trayGlow);

  // ----------------------------------------------------------- specimens
  scene.updateMatrixWorld(true);
  const qPage = page.getWorldQuaternion(new THREE.Quaternion()), qTray = tray.getWorldQuaternion(new THREE.Quaternion());
  const tNormal = new THREE.Vector3(0, 0, 1).applyQuaternion(qTray);
  const hitAt = (x) => { for (let t = 0; t <= 3.4; t += 0.005) if (scanX(t) >= x) return t; return 3.4; };
  brackets.forEach((b) => { b.hit = hitAt(b.x); });
  const chipGeo = new RoundedBoxGeometry(0.15, 0.15, 0.022, 3, 0.02);
  const tileGeo = new RoundedBoxGeometry(0.18, 0.17, 0.02, 3, 0.02);
  let trayBtnB = null;
  const specs = SAMPLES.map((sp, i) => {
    const g = new THREE.Group(); scene.add(g);
    if (sp.kind === 'chip') {
      g.add(mesh(chipGeo, std(sp.c, { roughness: 0.22, metalness: 0.05, emissive: sp.c, emissiveIntensity: 0.12 })));
    } else if (sp.kind === 'type') {
      g.add(mesh(tileGeo, std(0x2b2838, { roughness: 0.4, metalness: 0.2 })));
      const tt = canvasTex(256, 240, (c, w, h) => {
        c.fillStyle = '#ece6f8'; c.font = `800 ${Math.round(150 * sp.s)}px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('Aa', w / 2, h / 2 + 6);
      }).tex;
      const face = new THREE.Mesh(new THREE.PlaneGeometry(0.17, 0.16), new THREE.MeshBasicMaterial({ map: tt, transparent: true, toneMapped: false, depthWrite: false }));
      face.position.z = 0.0115; g.add(face);
    } else {
      const b = mesh(buttonGeo(sp.round, !sp.round), btnM()); g.add(b);
      if (!sp.round) trayBtnB = b;
    }
    const tr = glow(sp.kind === 'chip' ? new THREE.Color(sp.c) : VIOLET, 0.42, 0, 0.3); g.add(tr);
    const src = page.localToWorld(new THREE.Vector3(sp.src[0], sp.src[1], 0.05));
    const dst = tray.localToWorld(new THREE.Vector3(sp.slot[0], sp.slot[1], 0.03));
    const hit = hitAt(sp.src[0]), t0 = hit + ({ chip: 0.25, type: 0.4, btn: 0.55 })[sp.kind], t1 = t0 + 0.95;
    const mid = src.clone().lerp(dst, 0.5); mid.y += 0.34; mid.z += 0.32;
    return { g, tr, src, dst, mid, hit, t0, t1, sp, i };
  });
  const flashA = glow(AMBER, 0.5, 0, 0.4), flashM = glow(MINT, 0.9, 0, 0.35);
  const btnSpecA = specs[7], btnSpecB = specs[8];
  scene.add(flashA, flashM);
  const flagGlowA = glow(AMBER, 0.5, 0, 0.4); scene.add(flagGlowA);
  const streak = glow(MINT, 0.32, 0, 0.3); scene.add(streak);
  const streakCore = glow(0xeafff6, 0.12, 0, 0.3); scene.add(streakCore);
  const pageFlash = glow(MINT, 0.6, 0, 0.35); pageFlash.position.set(EL.btnB[0], EL.btnB[1], 0.07); page.add(pageFlash);

  // ----------------------------------------------------------- flag badge and title
  const badgeTex = canvasTex(800, 160);
  const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 0.15), new THREE.MeshBasicMaterial({ map: badgeTex.tex, transparent: true, depthWrite: false, toneMapped: false }));
  scene.add(badge);
  const badgePos = tray.localToWorld(new THREE.Vector3(0, -TH / 2 - 0.13, 0.16));
  let badgeState = '';
  const drawBadge = (fixed) => {
    const st = fixed ? 'ok' : 'warn';
    if (st === badgeState) return; badgeState = st;
    badgeTex.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = fixed ? 'rgba(10,40,30,0.9)' : 'rgba(42,26,6,0.9)'; roundRect(c, 4, 4, w - 8, h - 8, (h - 8) / 2); c.fill();
      c.strokeStyle = fixed ? '#3ee6a8' : '#ffae2b'; c.lineWidth = 5; c.stroke();
      c.fillStyle = fixed ? '#3ee6a8' : '#ffae2b'; c.beginPath(); c.arc(80, h / 2, 42, 0, 7); c.fill();
      c.fillStyle = '#16120a'; c.strokeStyle = '#0b1a14'; c.lineWidth = 9; c.lineCap = 'round'; c.lineJoin = 'round';
      if (fixed) { c.beginPath(); c.moveTo(60, h / 2 + 2); c.lineTo(75, h / 2 + 17); c.lineTo(100, h / 2 - 14); c.stroke(); }
      else { c.font = `800 62px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('!', 80, h / 2 + 3); }
      c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillStyle = fixed ? '#d9fff0' : '#fff1d8';
      c.font = `800 52px ${MONO}`; c.fillText(fixed ? '1 BUTTON STYLE' : '2 BUTTON STYLES', 146, h / 2 + 3);
    });
  };
  const title = label('Design System Scanner', { font: `800 72px ${SANS}`, fg: '#f1ecff', h: 0.15, track: 1 });
  const client = label('Self-initiated', { font: `600 56px ${MONO}`, fg: '#b9a8ff', h: 0.085, track: 4 });
  scene.add(title, client);

  // ----------------------------------------------------------- dust in the key
  const DN = 160, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xcfc4ff, size: 0.01, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.95, 0.86, 1.7]], [0.9, [-1.02, 0.82, 1.78], L],
    [3.1, [-0.38, 0.88, 2.05]], [4.7, [0.42, 0.98, 2.15]],
    [5.6, [0.86, 0.62, 1.42]], [6.6, [0.9, 0.6, 1.32], L],
    [8.4, [0.02, 1.12, 3.9]], [10, [-0.06, 1.15, 4.05], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.82, 0.72, 0]], [0.9, [-0.9, 0.7, 0], L],
    [3.1, [-0.4, 0.66, 0]], [4.7, [0.52, 0.62, 0.05]],
    [5.6, [0.76, 0.38, 0.12]], [6.6, [0.78, 0.38, 0.12], L],
    [8.4, [0.04, 0.88, 0]], [10, [0.04, 0.89, 0], L],
  ]);
  const tgt = new THREE.Vector3(), v = new THREE.Vector3(), va = new THREE.Vector3(), vb = new THREE.Vector3(), up = new THREE.Vector3(), q = new THREE.Quaternion(), spinQ = new THREE.Quaternion(), ax = new THREE.Vector3(0.3, 1, 0.2).normalize();

  function update(t) {
    const p = camPos(t), c = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(c[0], c[1], c[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 32], [4.7, 32], [6.0, 30], [8.4, 31]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Power on: key light swells, page backlight comes up.
    key.intensity = 24 * eo(k(t, 0.05, 0.7));
    pageM.emissiveIntensity = 0.42 * eo(k(t, 0.1, 0.6));
    pageGlow.material.opacity = 0.12 * eo(k(t, 0.1, 0.6));

    // Scan: laser flickers on, the carriage rides the rails left to right, then parks.
    const flick = t < 0.85 ? k(t, 0.45, 0.85) * (0.6 + 0.4 * Math.sign(Math.sin(t * 90))) : 1;
    const lit = flick * (1 - k(t, 3.15, 3.6));
    carriage.position.x = scanX(t);
    emitM.color.setHex(VIOLET).multiplyScalar(0.25 + 0.75 * lit);
    sheet.material.opacity = 0.75 * lit; line.material.opacity = 0.95 * lit; band.material.opacity = 0.8 * lit;
    scanGlowT.material.opacity = scanGlowB.material.opacity = 0.9 * lit;
    scanLight.intensity = 2.2 * lit;

    brackets.forEach((b) => {
      const a = eo(k(t, b.hit, b.hit + 0.18)) * (1 - k(t, b.hit + 1.3, b.hit + 2.0));
      b.m.material.opacity = a; b.m.visible = a > 0.01;
      b.m.scale.setScalar(1 + (1 - eo(k(t, b.hit, b.hit + 0.25))) * 0.08);
    });

    // Samples: pop out of the page, arc across, settle into the felt with a spring.
    specs.forEach((s) => {
      const pop = back(k(t, s.hit, s.hit + 0.3));
      const e = eio(k(t, s.t0, s.t1)), land = spring(k(t, s.t1, s.t1 + 0.55));
      const lift = s.sp.kind === 'btn' ? 0.06 * eo(k(t, s.hit, s.t0)) : 0.04 * eo(k(t, s.hit, s.t0));
      const a = va.copy(s.src).add(up.set(0, 0, lift).applyQuaternion(qPage));
      const b = vb.copy(s.dst).addScaledVector(tNormal, 0.06);
      const u = 1 - e;
      s.g.position.set(
        u * u * a.x + 2 * u * e * s.mid.x + e * e * b.x,
        u * u * a.y + 2 * u * e * s.mid.y + e * e * b.y,
        u * u * a.z + 2 * u * e * s.mid.z + e * e * b.z,
      );
      if (t > s.t1) s.g.position.copy(s.dst).addScaledVector(tNormal, 0.06 * (1 - land));
      q.copy(qPage).slerp(qTray, e);
      spinQ.setFromAxisAngle(ax, Math.sin(Math.PI * e) * (0.9 + rnd(s.i, 3) * 0.6));
      s.g.quaternion.copy(q).multiply(spinQ);
      const sc = s.sp.kind === 'btn' ? 1 : clamp(pop);
      s.g.scale.setScalar(Math.max(0.001, sc * (1 + 0.12 * Math.sin(Math.PI * e))));
      s.g.visible = t > s.hit;
      s.tr.material.opacity = Math.min(1, 0.85 * Math.sin(Math.PI * clamp(e)) + 0.9 * Math.exp(-7 * Math.max(0, t - s.t1)) * (t > s.t1 ? 1 : 0) + 0.7 * Math.exp(-8 * Math.max(0, t - s.hit)) * (t > s.hit ? 1 : 0));
    });

    // Conflict: the tray's two buttons pulse amber in turn, the flag pops beneath them.
    const flag = back(k(t, FLAG, FLAG + 0.4));
    const fixP = clamp(spring(k(t, FIX, FIX + 0.7)));
    const pulse = k(t, FLAG, FLAG + 0.2) * (1 - k(t, FIX - 0.05, FIX + 0.15));
    flagGlowA.position.copy(btnSpecB.dst).addScaledVector(tNormal, 0.05);
    flagGlowA.scale.set(0.62, 0.3, 1);
    flagGlowA.material.opacity = pulse * (0.45 + 0.35 * Math.sin(t * 9));
    flashA.position.copy(btnSpecA.dst).addScaledVector(tNormal, 0.05);
    flashA.scale.set(0.62, 0.3, 1);
    flashA.material.opacity = pulse * (0.3 + 0.25 * Math.sin(t * 9 + Math.PI));
    pageBGlow.material.opacity = pulse * 0.5;

    // Fix: the square button rounds into a pill; mint flash; the flag flips over to mint.
    trayBtnB.morphTargetInfluences[0] = fixP;
    const pop2 = 1 + 0.18 * Math.sin(Math.PI * k(t, FIX, FIX + 0.45)) * (1 - k(t, FIX + 0.3, FIX + 0.45));
    if (t > FIX) btnSpecB.g.scale.set(pop2, 2 - pop2, 1);
    flashM.position.copy(btnSpecB.dst).addScaledVector(tNormal, 0.07);
    flashM.material.opacity = 0.9 * Math.exp(-5 * Math.max(0, t - FIX)) * (t > FIX ? 1 : 0);
    const flip = k(t, FIX + 0.1, FIX + 0.5);
    drawBadge(flip > 0.5);
    badge.position.copy(badgePos); badge.position.y += (1 - flag) * -0.05;
    badge.lookAt(camera.position);
    badge.scale.set(Math.max(0.001, flag) * (1 - ei(k(t, 9.0, 9.5)) * 0.1), Math.max(0.001, flag * Math.abs(Math.cos(flip * Math.PI))), 1);
    badge.material.opacity = clamp(flag) * (1 - k(t, 9.1, 9.5));
    badge.visible = t > FLAG;

    // Back to the page: a mint streak carries the fix, and the page's own button rounds.
    const sp = eio(k(t, BACK, PAGEFIX));
    const pb = page.localToWorld(v.set(EL.btnB[0], EL.btnB[1], 0.07));
    const sa = btnSpecB.dst.clone().addScaledVector(tNormal, 0.08);
    const sm = sa.clone().lerp(pb, 0.5); sm.y += 0.45; sm.z += 0.2;
    const su = 1 - sp;
    streak.position.set(su * su * sa.x + 2 * su * sp * sm.x + sp * sp * pb.x, su * su * sa.y + 2 * su * sp * sm.y + sp * sp * pb.y, su * su * sa.z + 2 * su * sp * sm.z + sp * sp * pb.z);
    streakCore.position.copy(streak.position);
    const sOn = t > BACK && t < PAGEFIX + 0.05 ? Math.sin(Math.PI * k(t, BACK, PAGEFIX + 0.05)) : 0;
    streak.material.opacity = 0.9 * sOn; streakCore.material.opacity = sOn;
    pageBtnB.morphTargetInfluences[0] = clamp(spring(k(t, PAGEFIX, PAGEFIX + 0.7)));
    const pop3 = 1 + 0.18 * Math.sin(Math.PI * k(t, PAGEFIX, PAGEFIX + 0.45));
    pageBtnB.scale.set(t > PAGEFIX ? pop3 : 1, t > PAGEFIX ? 2 - pop3 : 1, 1);
    pageFlash.material.opacity = 0.9 * Math.exp(-5 * Math.max(0, t - PAGEFIX)) * (t > PAGEFIX ? 1 : 0);

    // Title over the two-shot.
    const ti = eo(k(t, 8.0, 8.7)), to = k(t, 9.2, 9.55);
    title.position.set(0.02, 1.4 + (1 - ti) * 0.04, 0.3); client.position.set(0.02, 1.28 + (1 - ti) * 0.04, 0.3);
    title.lookAt(camera.position); client.lookAt(camera.position);
    title.material.opacity = ti * (1 - to); client.material.opacity = ti * (1 - to);
    title.visible = client.visible = ti > 0.01;

    // Dust drifting through the key.
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = (rnd(i, 71) - 0.5) * 3.6 + Math.sin(t * 0.3 + i) * 0.12;
      dpos[i * 3 + 1] = rnd(i, 72) * 1.7 + 0.05 + Math.sin(t * 0.45 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = (rnd(i, 73) - 0.4) * 1.8 + Math.cos(t * 0.25 + i) * 0.1;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.8 };
}
