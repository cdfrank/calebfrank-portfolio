// General Motors global design system lit loop, 10 s. "One design language across GM's brands."
// A warm daylight studio sweep, three plinths. Chevrolet, GMC and Buick each drop the same button,
// and each one answers differently. A scan reads them, and every button gives up its styling as four
// tokens that fly onto shared rule shelves: RADIUS, SPACE, TYPE, COLOR. Same rules, each brand's own
// values. Three page cards rise from the plinths as one wireframe, and the tokens skin each one in its
// brand. A blue laser lays the same grid across all three: one retail experience, three voices.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp, path,
  canvasTex, grainTex, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", ui-monospace, monospace';
const SYS = '#2f6bff';                       // the system's own color: shelves, scan, grid
const INK = '#16181c';
// Three brands, one button. Shape, weight, tracking and color are each brand's answer.
const BR = [
  { n: 'CHEVROLET', c: '#d6a33a', ink: '#141414', r: 0.026, w: 800, tr: 5, up: true, btn: 'SHOP NOW', cr: 12,
    page: { bg: '#f5f4f0', fg: '#141414', sub: '#6e6c66', tile: '#e7e2d6', hero: ['#e7b54a', '#8a6420'] } },
  { n: 'GMC', c: '#c8102e', ink: '#ffffff', r: 0.004, w: 900, tr: 1, up: true, btn: 'SHOP NOW', cr: 0,
    page: { bg: '#0d0d0e', fg: '#ffffff', sub: '#a3a3a3', tile: '#232325', hero: ['#d4193a', '#3a0610'] } },
  { n: 'BUICK', c: '#2c4a6e', ink: '#ffffff', r: 0.085, w: 500, tr: 6, up: false, btn: 'Shop now', cr: 34,
    page: { bg: '#e9eef4', fg: '#1b2a3d', sub: '#5f6e80', tile: '#d3dce7', hero: ['#4f7095', '#1b2f48'] } },
];
const ROWS = ['RADIUS', 'SPACE', 'TYPE', 'COLOR'];
const COLS = [-0.74, 0, 0.74];
const PH = 0.36;                              // plinth height
const BY = 0.62;                              // where the buttons hover
const SY = [1.74, 1.5, 1.26, 1.02];           // rule shelves, top to bottom
const SHELF_X0 = -1.32, SHELF_X1 = 0.98;
const CW = 0.58, CHh = 0.87, CY = PH + CHh / 2 + 0.012; // page cards
const peelT = (b, r) => 2.95 + r * 0.24 + b * 0.07;   // token leaves the button for its shelf
const applyT = (b, r) => 5.75 + r * 0.22 + b * 0.06;  // token leaves the shelf for its page card
const ELEM_Y = [-0.3, -0.12, 0.0, 0.2];       // where each token lands on a card (card-local y)
const laserAt = (b) => 7.05 + ((COLS[b] + 1.15) / 2.3) * 0.55;

// One brand's page card, drawn from whichever tokens have landed. st: radius, space, type, color (0..1).
function drawCard(c, w, h, B, st) {
  const M = 32, G = 16, colW = (w - 2 * M - 3 * G) / 4;
  const P = B.page;
  const mix = (a, b2, p) => { const A = parseInt(a.slice(1), 16), Bc = parseInt(b2.slice(1), 16); const ch = (s) => Math.round(lerp((A >> s) & 255, (Bc >> s) & 255, p)); return `rgb(${ch(16)},${ch(8)},${ch(0)})`; };
  const col = st.color, ty = st.type, rad = st.radius;
  const R = (px) => px * rad;
  // Before SPACE lands, every block sits a little off the grid; after, it snaps.
  const jit = (i, ax) => (1 - st.space) * (rnd(i, ax + 3) - 0.5) * 26;
  c.clearRect(0, 0, w, h);
  c.fillStyle = mix('#f3f3f1', P.bg, col); roundRect(c, 0, 0, w, h, 22); c.fill();
  c.save(); roundRect(c, 0, 0, w, h, 22); c.clip();
  const fg = mix('#9a9a9a', P.fg, col), sub = mix('#c4c4c4', P.sub, col);
  c.textBaseline = 'middle';
  // Nav
  c.fillStyle = fg;
  if (ty > 0.5) { c.font = `${B.w} 28px ${SANS}`; if ('letterSpacing' in c) c.letterSpacing = B.tr + 'px'; c.fillText(B.n, M + jit(1, 0), 40); if ('letterSpacing' in c) c.letterSpacing = '0px'; }
  else { c.fillStyle = sub; c.fillRect(M + jit(1, 0), 30, 150, 20); }
  c.fillStyle = sub; for (let i = 0; i < 3; i++) c.fillRect(w - M - 30 + jit(2, 1), 30 + i * 9, 30, 4);
  // Hero
  const hx = M + jit(3, 0), hy = 82 + jit(3, 1), hw = w - 2 * M, hh = 266;
  if (col > 0) {
    const g = c.createLinearGradient(hx, hy, hx + hw, hy + hh); g.addColorStop(0, P.hero[0]); g.addColorStop(1, P.hero[1]);
    c.globalAlpha = col; c.fillStyle = g; roundRect(c, hx, hy, hw, hh, Math.max(0.5, R(B.cr))); c.fill(); c.globalAlpha = 1;
  }
  if (col < 1) {
    c.globalAlpha = 1 - col; c.fillStyle = '#dcdcda'; roundRect(c, hx, hy, hw, hh, Math.max(0.5, R(B.cr))); c.fill();
    c.strokeStyle = '#c6c6c3'; c.lineWidth = 2; c.beginPath(); c.moveTo(hx, hy); c.lineTo(hx + hw, hy + hh); c.moveTo(hx + hw, hy); c.lineTo(hx, hy + hh); c.stroke(); c.globalAlpha = 1;
  }
  // A plain vehicle silhouette in the hero, the same for every brand.
  c.fillStyle = col > 0.5 ? 'rgba(0,0,0,0.38)' : 'rgba(0,0,0,0.08)';
  c.beginPath(); const vx = hx + hw / 2, vy = hy + hh - 64;
  c.moveTo(vx - 150, vy + 30); c.lineTo(vx - 150, vy); c.quadraticCurveTo(vx - 140, vy - 18, vx - 96, vy - 22); c.lineTo(vx - 52, vy - 58); c.lineTo(vx + 60, vy - 58); c.lineTo(vx + 104, vy - 22);
  c.quadraticCurveTo(vx + 148, vy - 18, vx + 152, vy + 4); c.lineTo(vx + 152, vy + 30); c.closePath(); c.fill();
  c.fillStyle = col > 0.5 ? 'rgba(10,10,12,0.7)' : 'rgba(0,0,0,0.12)';
  [-88, 92].forEach((dx) => { c.beginPath(); c.arc(vx + dx, vy + 30, 24, 0, 7); c.fill(); });
  // Headline
  const ly = 396 + jit(4, 1);
  if (ty > 0.5) {
    c.fillStyle = fg; c.font = `${B.w} 40px ${SANS}`; if ('letterSpacing' in c) c.letterSpacing = (B.up ? B.tr * 0.4 : B.tr * 0.25) + 'px';
    c.fillText(B.up ? 'DISCOVER VEHICLES' : 'Discover vehicles', M + jit(4, 0), ly);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = sub; c.fillRect(M + jit(5, 0), ly + 32, 200, 12);
  } else {
    c.fillStyle = sub; c.fillRect(M + jit(4, 0), ly - 14, 300, 28); c.fillRect(M + jit(5, 0), ly + 32, 200, 14);
  }
  // Model row: four tiles on the four columns.
  for (let i = 0; i < 4; i++) {
    const x = M + i * (colW + G) + jit(6 + i, 0), y = 470 + jit(6 + i, 1);
    c.fillStyle = mix('#e4e4e2', P.tile, col); roundRect(c, x, y, colW, 100, Math.max(0.5, R(B.cr * 0.6))); c.fill();
    c.fillStyle = col > 0.5 ? mix(P.tile, P.fg, 0.35) : '#cfcfcc'; c.fillRect(x + 14, y + 72, colW - 40, 10);
  }
  // The primary button: reserved for the shopping action.
  const bx = M + jit(10, 0), by = 604 + jit(10, 1), bw = colW * 2 + G, bh = 64;
  if (col > 0) { c.globalAlpha = col; c.fillStyle = B.c; roundRect(c, bx, by, bw, bh, Math.max(0.5, R(B.cr === 34 ? bh / 2 : B.cr))); c.fill(); c.globalAlpha = 1; }
  if (col < 1) { c.globalAlpha = 1 - col; c.setLineDash([8, 6]); c.strokeStyle = '#a9a9a6'; c.lineWidth = 3; roundRect(c, bx + 1.5, by + 1.5, bw - 3, bh - 3, Math.max(0.5, R(B.cr === 34 ? bh / 2 : B.cr))); c.stroke(); c.setLineDash([]); c.globalAlpha = 1; }
  c.textAlign = 'center';
  if (ty > 0.5) { c.fillStyle = col > 0.5 ? B.ink : '#8a8a87'; c.font = `${B.w} 22px ${SANS}`; if ('letterSpacing' in c) c.letterSpacing = B.tr * 0.6 + 'px'; c.fillText(B.btn, bx + bw / 2, by + bh / 2 + 1); if ('letterSpacing' in c) c.letterSpacing = '0px'; }
  else { c.fillStyle = '#b8b8b5'; c.fillRect(bx + bw / 2 - 50, by + bh / 2 - 6, 100, 12); }
  c.textAlign = 'left';
  // Secondary link beside it.
  c.fillStyle = sub; c.fillRect(bx + bw + 28 + jit(11, 0), by + bh / 2 - 4, 120, 8);
  c.fillRect(M, h - 50, w - 2 * M, 2);
  c.restore();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  const BG = 0x9c968d;
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 6.5, 14);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the studio sweep: floor curving up into a wall
  const sweepGeo = new THREE.PlaneGeometry(30, 1, 1, 48);
  {
    const pos = sweepGeo.attributes.position, Z0 = 6, ZC = -2.6, R = 2.2, LF = Z0 - ZC, LC = Math.PI * R / 2, L = LF + LC + 6;
    for (let i = 0; i < pos.count; i++) {
      const s = (pos.getY(i) + 0.5) * L; let y, z;
      if (s < LF) { y = 0; z = Z0 - s; }
      else if (s < LF + LC) { const a = (s - LF) / R; y = R * (1 - Math.cos(a)); z = ZC - R * Math.sin(a); }
      else { y = R + (s - LF - LC); z = ZC - R; }
      pos.setXYZ(i, pos.getX(i), y, z);
    }
    sweepGeo.computeVertexNormals();
  }
  const sweep = mesh(sweepGeo, std(0xffffff, { map: grainTex('#c9c3b8', { size: 256, speck: 0.06, blot: 0.05, seed: 21, repeat: 6 }), roughness: 0.62, metalness: 0 }), { cast: false });
  scene.add(sweep);

  // ----------------------------------------------------------- light: one big soft key, a cool rim
  scene.add(new THREE.HemisphereLight(0xfff6ea, 0x6b655d, 0.8));
  const key = new THREE.SpotLight(0xfff1e0, 0, 0, 0.6, 0.75, 1.2);
  key.position.set(-1.8, 4.2, 3.0); key.target.position.set(0, 0.8, 0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 2; key.shadow.camera.far = 9; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 1.3); rim.position.set(2.5, 2.6, -3); scene.add(rim);

  // ----------------------------------------------------------- plinths with brand nameplates
  const plinthM = std(0xe3ded5, { roughness: 0.55 });
  BR.forEach((B, b) => {
    const p = mesh(new RoundedBoxGeometry(0.62, PH, 0.44, 4, 0.025), plinthM); p.position.set(COLS[b], PH / 2, 0); scene.add(p);
    const led = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.008, 0.008), new THREE.MeshBasicMaterial({ color: B.c, toneMapped: false }));
    led.position.set(COLS[b], PH + 0.002, 0.212); scene.add(led);
    const plate = canvasTex(512, 112, (c, w, h) => { c.font = `700 52px ${MONO}`; c.fillStyle = '#3a3833'; c.textAlign = 'center'; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '6px'; c.fillText(B.n, w / 2, h / 2 + 3); });
    const pm = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.11), new THREE.MeshBasicMaterial({ map: plate.tex, transparent: true, depthWrite: false }));
    pm.position.set(COLS[b], 0.17, 0.2215); scene.add(pm);
  });

  // ----------------------------------------------------------- the same button, three answers
  const buttons = BR.map((B, b) => {
    const W = 0.56, H = 0.17, r = Math.min(B.r, H / 2 - 0.001);
    const s = new THREE.Shape();
    s.moveTo(-W / 2 + r, -H / 2); s.lineTo(W / 2 - r, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
    s.lineTo(W / 2, H / 2 - r); s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); s.lineTo(-W / 2 + r, H / 2);
    s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); s.lineTo(-W / 2, -H / 2 + r); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.036, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.005, bevelSegments: 3, curveSegments: 14 });
    geo.translate(0, 0, -0.018);
    const mat = new THREE.MeshPhysicalMaterial({ color: B.c, roughness: 0.32, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.08 });
    const g = new THREE.Group();
    const body = mesh(geo, mat); g.add(body);
    const face = canvasTex(512, 156, (c, w, h) => {
      c.font = `${B.w} 58px ${SANS}`; c.fillStyle = B.ink; c.textAlign = 'center'; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = B.tr * 2 + 'px';
      c.fillText(B.btn, w / 2 + B.tr, h / 2 + 3);
    });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(W, H), new THREE.MeshBasicMaterial({ map: face.tex, transparent: true, depthWrite: false, toneMapped: false }));
    fm.position.z = 0.0275; g.add(fm);
    g.name = 'button' + b;
    scene.add(g);
    return { g, mat, fm, base: new THREE.Color(B.c) };
  });
  const NEUTRAL = new THREE.Color(0xd2cec6);
  const neq = [-1, 1].map((sd) => { const l = label('≠', { font: `800 96px ${SANS}`, fg: INK, h: 0.24, pad: 8, track: 0 }); l.position.set(sd * 0.37, BY, 0.05); scene.add(l); return l; });
  const eq = [-1, 1].map((sd) => { const l = label('=', { font: `800 96px ${SANS}`, fg: SYS, h: 0.2, pad: 8, track: 0 }); l.position.set(sd * 0.37, CY, 0.06); scene.add(l); return l; });

  // ----------------------------------------------------------- rule shelves: shared by every brand
  const shelfM = std(0x26282d, { metalness: 0.55, roughness: 0.32, transparent: true });
  const ledM = new THREE.MeshBasicMaterial({ color: SYS, toneMapped: false, transparent: true });
  const shelves = ROWS.map((name, r) => {
    const g = new THREE.Group(); g.position.set((SHELF_X0 + SHELF_X1) / 2, SY[r], 0); scene.add(g);
    const slab = mesh(new RoundedBoxGeometry(SHELF_X1 - SHELF_X0, 0.035, 0.24, 2, 0.012), shelfM); g.add(slab);
    const led = new THREE.Mesh(new THREE.BoxGeometry(SHELF_X1 - SHELF_X0 - 0.04, 0.006, 0.004), ledM); led.position.set(0, 0.0, 0.122); g.add(led);
    const l = label(name, { font: `700 56px ${MONO}`, fg: '#ffffff', bg: '#1f2126', h: 0.13, pad: 26, track: 6 });
    l.position.set(SHELF_X0 + 0.22 - (SHELF_X0 + SHELF_X1) / 2, 0.0175 + 0.07, 0); g.add(l);
    if (r === 0) l.name = 'rowlabel';
    return { g, l };
  });

  // ----------------------------------------------------------- tokens: twelve chips, one atlas
  const atlas = canvasTex(1024, 1024, (c) => {
    for (let r = 0; r < 4; r++) for (let b = 0; b < 3; b++) {
      const B = BR[b], x0 = b * 256, y0 = r * 256, cx = x0 + 128, cy = y0 + 128;
      c.fillStyle = '#fbfaf7'; roundRect(c, x0 + 6, y0 + 6, 244, 244, 26); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 3; c.stroke();
      if (r === 0) { // radius: one corner, each brand's curve
        const rr = [34, 3, 92][b]; c.fillStyle = B.c;
        c.beginPath(); c.moveTo(cx - 70, cy + 70); c.lineTo(cx - 70, cy - 70 + rr); c.arcTo(cx - 70, cy - 70, cx - 70 + rr, cy - 70, rr); c.lineTo(cx + 70, cy - 70); c.lineTo(cx + 70, cy + 70); c.closePath(); c.fill();
      } else if (r === 1) { // space: the same three blocks, each brand's rhythm
        const gap = [16, 8, 26][b]; c.fillStyle = B.c;
        const hh = (150 - 2 * gap) / 3; for (let i = 0; i < 3; i++) { c.globalAlpha = 1 - i * 0.25; c.fillRect(cx - 62, cy - 75 + i * (hh + gap), 124, hh); }
        c.globalAlpha = 1; c.fillStyle = SYS; c.fillRect(cx + 74, cy - 75 + hh, 6, gap); c.fillRect(cx + 74, cy - 75 + 2 * hh + gap, 6, gap);
      } else if (r === 2) { // type: weight and tracking
        c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.font = `${B.w} 112px ${SANS}`; if ('letterSpacing' in c) c.letterSpacing = B.tr * 1.5 + 'px';
        c.fillText(B.up ? 'AA' : 'Aa', cx + B.tr, cy + 6); if ('letterSpacing' in c) c.letterSpacing = '0px'; c.textAlign = 'left';
      } else { // color
        c.fillStyle = B.c; c.beginPath(); c.arc(cx - 14, cy, 66, 0, 7); c.fill();
        c.fillStyle = B.page.bg; c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 3; c.beginPath(); c.arc(cx + 56, cy + 44, 30, 0, 7); c.fill(); c.stroke();
      }
    }
  });
  const chipM = new THREE.MeshBasicMaterial({ map: atlas.tex, transparent: true, toneMapped: false });
  const chipBody = std(0xf7f5f0, { roughness: 0.4 });
  const chips = [];
  for (let r = 0; r < 4; r++) for (let b = 0; b < 3; b++) {
    const g = new THREE.Group(); scene.add(g);
    const slab = mesh(new RoundedBoxGeometry(0.18, 0.18, 0.02, 2, 0.014), chipBody); g.add(slab);
    const fg = new THREE.PlaneGeometry(0.17, 0.17);
    const uv = fg.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, (b + uv.getX(i)) / 4, 1 - (r + 1 - uv.getY(i)) / 4);
    const face = new THREE.Mesh(fg, chipM); face.position.z = 0.0105; g.add(face);
    chips.push({ g, r, b });
  }

  // ----------------------------------------------------------- page cards: one wireframe, three brands
  const cards = BR.map((B, b) => {
    const g = new THREE.Group(); scene.add(g);
    const slab = mesh(new RoundedBoxGeometry(CW + 0.024, CHh + 0.024, 0.026, 3, 0.022), std(0x2a2c31, { metalness: 0.6, roughness: 0.3 })); g.add(slab);
    const tex = canvasTex(512, 768);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CW, CHh), new THREE.MeshBasicMaterial({ map: tex.tex, transparent: true, toneMapped: false }));
    face.position.z = 0.0135; g.add(face);
    g.name = 'card' + b;
    return { g, tex, key: '' };
  });
  const gridTex = canvasTex(256, 384, (c, w, h) => {
    const s = w / 512, M = 32 * s, G = 16 * s, colW = (w - 2 * M - 3 * G) / 4;
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(47,107,255,0.16)'; c.fillRect(M + i * (colW + G), 0, colW, h); }
    c.fillStyle = 'rgba(47,107,255,0.95)';
    for (let i = 0; i < 4; i++) { c.fillRect(M + i * (colW + G), 0, 1.5, h); c.fillRect(M + i * (colW + G) + colW - 1.5, 0, 1.5, h); }
    [82, 348, 470, 570, 604, 668].forEach((y) => { c.fillStyle = 'rgba(47,107,255,0.55)'; c.fillRect(0, y * s, w, 1.2); });
  });
  const grids = cards.map(({ g }) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(CW, CHh), new THREE.MeshBasicMaterial({ map: gridTex.tex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    m.position.z = 0.015; g.add(m); return m;
  });

  // ----------------------------------------------------------- scan / laser: the system reading and laying the grid
  const scanTex = canvasTex(128, 16, (c, w, h) => { const g = c.createLinearGradient(0, 0, w, 0); g.addColorStop(0, 'rgba(47,107,255,0)'); g.addColorStop(0.5, 'rgba(47,107,255,0.45)'); g.addColorStop(1, 'rgba(47,107,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); });
  const scan = new THREE.Group(); scene.add(scan);
  const scanSoft = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 1), new THREE.MeshBasicMaterial({ map: scanTex.tex, transparent: true, depthWrite: false, toneMapped: false }));
  const scanLine = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 1), new THREE.MeshBasicMaterial({ color: SYS, transparent: true, depthWrite: false, toneMapped: false }));
  scan.add(scanSoft, scanLine);

  // ----------------------------------------------------------- chapter card
  const chap = canvasTex(1024, 300);
  const chapM = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 0.498), new THREE.MeshBasicMaterial({ map: chap.tex, transparent: true, depthWrite: false, toneMapped: false }));
  chapM.renderOrder = 5; chapM.name = 'chapter'; scene.add(chapM);
  const CH = [
    { a: 0.7, b: 2.6, kick: 'THREE RULEBOOKS', big: 'Same button, three different answers' },
    { a: 3.05, b: 5.4, kick: 'SHARED RULES', big: 'Where a brand ends and a system begins' },
    { a: 6.85, b: 7.95, kick: 'SAME GRID', big: 'One retail experience' },
    { a: 8.05, b: 9.75, kick: 'ONE SET OF RULES', big: 'Chevrolet, GMC and Buick each keep their voice.' },
  ];
  let cKey = '';
  const drawChap = (t) => {
    const ci = CH.findIndex((s) => t >= s.a - 0.05 && t < s.b + 0.05);
    const s = CH[ci];
    const a = s ? eo(k(t, s.a, s.a + 0.3)) * (1 - ei(k(t, s.b - 0.22, s.b))) : 0;
    const key = ci + '|' + Math.round(a * 20);
    if (key === cKey) return a; cKey = key;
    chap.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      if (!s || a <= 0) return;
      c.globalAlpha = a;
      c.fillStyle = 'rgba(250,248,244,0.93)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
      c.strokeStyle = 'rgba(0,0,0,0.08)'; c.lineWidth = 2; c.stroke();
      c.textBaseline = 'middle';
      c.fillStyle = SYS; c.fillRect(48, 56, 30, 6);
      c.font = `700 36px ${MONO}`; c.fillStyle = '#5b574f'; if ('letterSpacing' in c) c.letterSpacing = '4px'; c.fillText(s.kick, 96, 60); if ('letterSpacing' in c) c.letterSpacing = '0px';
      let fs = 78; c.font = `800 ${fs}px ${SANS}`;
      const fit = () => { const words = s.big.split(' '), lines = []; let cur = ''; for (const wd of words) { const tr = cur ? cur + ' ' + wd : wd; if (cur && c.measureText(tr).width > w - 100) { lines.push(cur); cur = wd; } else cur = tr; } lines.push(cur); return lines; };
      let lines = fit();
      while ((lines.length > 2 || lines.some((ln) => c.measureText(ln).width > w - 100)) && fs > 50) { fs -= 4; c.font = `800 ${fs}px ${SANS}`; lines = fit(); }
      c.fillStyle = INK;
      const y0 = lines.length === 1 ? 180 : 142;
      lines.forEach((ln, i) => c.fillText(ln, 48 - (1 - a) * 14, y0 + i * (fs + 8)));
      c.globalAlpha = 1;
    });
    return a;
  };

  // ----------------------------------------------------------- camera
  const KT = [0, 2.4, 3.55, 5.1, 6.15, 7.35, 8.7, 10];
  const camP = path([[0.4, 0.98, 4.0], [0.12, 0.9, 3.35], [-0.4, 1.56, 4.3], [-0.26, 1.5, 4.4], [0.28, 1.05, 3.75], [0.0, 0.98, 3.5], [-0.58, 0.66, 3.6], [-0.78, 0.6, 3.8]]);
  const camT = path([[0, 0.86, 0], [0, 0.82, 0], [-0.16, 1.55, 0], [-0.14, 1.52, 0], [0, 0.95, 0], [0, 0.95, 0], [0.04, 1.0, 0], [0.06, 1.0, 0]]);
  const camU = (t) => kf(t, KT.map((x, i) => [x, i / (KT.length - 1)]), (x) => x);
  const cp = new THREE.Vector3(), ct = new THREE.Vector3(), a3 = new THREE.Vector3(), b3 = new THREE.Vector3(), m3 = new THREE.Vector3();
  const slot = (b, r, out) => out.set(COLS[b], SY[r] + 0.0175 + 0.095, 0.0);

  function update(t) {
    const u = camU(t);
    camP(u, cp); camT(u, ct);
    camera.position.set(cp.x + Math.sin(t * 1.1) * 0.008, cp.y + Math.sin(t * 1.6 + 1) * 0.005, cp.z);
    camera.lookAt(ct);
    camera.updateMatrixWorld();
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    key.intensity = 17 * clamp(back(k(t, 0.1, 0.6)));

    // Act 1: three buttons drop onto their plinths. Act 2: they give their styling away, then sink.
    buttons.forEach(({ g, mat, fm, base }, b) => {
      const land = spring(k(t, 0.35 + b * 0.25, 1.35 + b * 0.25));
      const sink = eio(k(t, 4.85 + b * 0.06, 5.4 + b * 0.06));
      g.position.set(COLS[b], BY + (1 - land) * 1.3 + Math.sin(t * 1.7 + b) * 0.01 - sink * 0.6, 0);
      g.rotation.set((1 - land) * 0.5, Math.sin(t * 0.8 + b * 1.4) * 0.28 * (1 - sink), (1 - land) * (b - 1) * 0.3);
      g.visible = t > 0.3 && sink < 1;
      const gone = (r) => eo(k(t, peelT(b, r), peelT(b, r) + 0.3));
      mat.color.copy(base).lerp(NEUTRAL, gone(3));
      mat.roughness = lerp(0.32, 0.7, gone(3));
      fm.material.opacity = 1 - gone(2);
    });
    neq.forEach((l, i) => { const p = back(k(t, 1.5 + i * 0.18, 1.9 + i * 0.18)) * (1 - ei(k(t, 2.45, 2.75))); l.scale.setScalar(Math.max(0.001, p)); l.visible = p > 0.01; l.quaternion.copy(camera.quaternion); });

    // Scan across the buttons, then the laser that lays the grid over the cards.
    const s1 = k(t, 2.7, 3.2), s2 = k(t, 7.05, 7.6);
    if (s1 > 0 && s1 < 1) { scan.visible = true; scan.position.set(lerp(-1.15, 1.15, eio(s1)), BY, 0.09); scan.scale.set(1, 0.42, 1); }
    else if (s2 > 0 && s2 < 1) { scan.visible = true; scan.position.set(lerp(-1.15, 1.15, s2), CY, 0.07); scan.scale.set(1, 1.0, 1); }
    else scan.visible = false;

    // Shelves slide in from the left; leave upward once their tokens are spent.
    shelves.forEach(({ g, l }, r) => {
      const inn = eo(k(t, 2.75 + r * 0.08, 3.3 + r * 0.08)), out = eio(k(t, 6.7 + r * 0.06, 7.2 + r * 0.06));
      g.position.set((SHELF_X0 + SHELF_X1) / 2 - (1 - inn) * 0.8, SY[r] + out * 0.9, -out * 0.3);
      g.visible = inn > 0.001 && out < 1;
      l.material.opacity = inn * (1 - out);
    });
    const shelfA = eo(k(t, 2.75, 3.3)) * (1 - eio(k(t, 6.7, 7.2)));
    shelfM.opacity = shelfA; ledM.opacity = shelfA;

    // Page cards rise from the plinths, take each token as it lands, then the grid shows they match.
    cards.forEach((cd, b) => {
      const rise = spring(k(t, 5.35 + b * 0.08, 6.25 + b * 0.08));
      cd.g.position.set(COLS[b], lerp(CY - CHh - 0.03, CY, rise) + Math.sin(t * 1.3 + b) * 0.006 * rise, 0);
      cd.g.rotation.set(0, -COLS[b] * 0.2, 0);
      cd.g.visible = rise > 0.001;
      cd.g.updateMatrixWorld();
      const st = { radius: eo(k(t, applyT(b, 0) + 0.45, applyT(b, 0) + 0.75)), space: eo(k(t, applyT(b, 1) + 0.45, applyT(b, 1) + 0.8)), type: k(t, applyT(b, 2) + 0.45, applyT(b, 2) + 0.5), color: eo(k(t, applyT(b, 3) + 0.45, applyT(b, 3) + 0.75)) };
      const ck = [st.radius, st.space, st.type, st.color].map((x) => Math.round(x * 24)).join('|');
      if (ck !== cd.key) { cd.key = ck; cd.tex.redraw((c, w, h) => drawCard(c, w, h, BR[b], st)); }
      const gp = eo(k(t, laserAt(b), laserAt(b) + 0.2)) * (1 - eo(k(t, 8.25, 8.75)));
      grids[b].material.opacity = gp; grids[b].visible = gp > 0.01;
    });
    // Tokens: peel off a button to the shelf, then fly from the shelf into the brand's page card.
    chips.forEach(({ g, r, b }) => {
      const t0 = peelT(b, r), t1 = applyT(b, r);
      const p = k(t, t0, t0 + 0.6), q = k(t, t1, t1 + 0.55);
      if (t < t0 || q >= 1) { g.visible = false; return; }
      g.visible = true;
      if (q <= 0) {
        a3.set(COLS[b], BY, 0.05); slot(b, r, b3);
        const e = eio(p);
        m3.copy(a3).lerp(b3, 0.5); m3.y += 0.12; m3.z += 0.45;
        g.position.set((1 - e) * (1 - e) * a3.x + 2 * (1 - e) * e * m3.x + e * e * b3.x, (1 - e) * (1 - e) * a3.y + 2 * (1 - e) * e * m3.y + e * e * b3.y, (1 - e) * (1 - e) * a3.z + 2 * (1 - e) * e * m3.z + e * e * b3.z);
        g.rotation.set(0, (1 - e) * Math.PI * 2, (1 - e) * 0.4);
        g.scale.setScalar(Math.max(0.001, lerp(0.25, 1, back(p))));
      } else {
        slot(b, r, a3); const cg = cards[b].g;
        b3.set(0, ELEM_Y[r], 0.03).applyMatrix4(cg.matrixWorld);
        const e = eio(q);
        m3.copy(a3).lerp(b3, 0.5); m3.z += 0.4;
        g.position.set((1 - e) * (1 - e) * a3.x + 2 * (1 - e) * e * m3.x + e * e * b3.x, (1 - e) * (1 - e) * a3.y + 2 * (1 - e) * e * m3.y + e * e * b3.y, (1 - e) * (1 - e) * a3.z + 2 * (1 - e) * e * m3.z + e * e * b3.z);
        g.rotation.set(0, e * Math.PI * 2, 0);
        g.scale.setScalar(Math.max(0.001, 1 - ei(q) * 0.8));
      }
    });

    eq.forEach((l, i) => { const p = back(k(t, 7.65 + i * 0.12, 8.0 + i * 0.12)) * (1 - ei(k(t, 9.2, 9.6))); l.scale.setScalar(Math.max(0.001, p)); l.visible = p > 0.01; l.quaternion.copy(camera.quaternion); });

    // Chapter card floats above whatever the act is about.
    const ca = drawChap(t);
    chapM.position.set(kf(t, [[2.6, 0], [2.8, -0.16], [5.4, -0.16], [5.6, 0]]), kf(t, [[2.6, 1.22], [2.8, 2.22], [5.4, 2.22], [5.6, 1.6]]), 0.12);
    chapM.quaternion.copy(camera.quaternion);
    chapM.visible = ca > 0.001;
  }

  return { scene, camera, update, duration: D, poster: 8.9 };
}
