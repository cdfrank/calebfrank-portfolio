// Abbott interactive concepts lit loop, 10 s. "Motion you can feel, written down as a system."
// A violet cyclorama with a coral light pool. A phone stands in a dock; beside it a glass easing graph
// lights its grid and axes. A hand comes in and taps the phone: the coral card slides down the screen
// while a chrome bead rides the easing curve on the graph in step with it, drawing the curve in light as
// it goes (time across, travel up). A second tap sends both home. Then the motion becomes a system: FADE,
// SLIDE and SCALE rise as glass tokens, and each one throws a spark into the phone, where a row fades in,
// a row slides in and the button pulses; each token lights as its motion lands. The tokens settle into
// one row under MOTION SYSTEM and the project's name rises above. Kept abstract: no health or product copy.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const CORAL = '#ff7a5c', CORAL_H = 0xff7a5c, LILAC = '#b9a8ff', LILAC_H = 0xb9a8ff, BG = 0x150f26;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const PH = V(-0.62, 0.6, 0.06);                       // phone centre
const GR = V(0.29, 0.83, -0.18), GW = 0.95, GH = 0.8; // graph panel centre and size
const PLOT = { x0: -0.36, y0: -0.27, w: 0.72, h: 0.5 }; // plot area inside the panel
const TAPS = [2.25, 3.75];
const RIDE = [[2.33, 3.33, 0, 1], [3.83, 4.63, 1, 0]]; // dot rides: start, end, from x, to x
const TOK = ['FADE', 'SLIDE', 'SCALE'];
const TOK_ON = [4.75, 5.35, 5.95];                    // token rises; its spark lands 0.4 s later
const HS = 3.4;                                       // hand scale

// The easing curve, a cubic from (0,0) through (0.33,0), (0.4,1) to (1,1): soft start, quick middle, soft land.
const BZ = [[0, 0], [0.333, 0], [0.4, 1], [1, 1]];
const bez = (s, i) => { const u = 1 - s; return u * u * u * BZ[0][i] + 3 * u * u * s * BZ[1][i] + 3 * u * s * s * BZ[2][i] + s * s * s * BZ[3][i]; };

// A stylized hand of capsules: palm, four three-joint fingers and a two-joint thumb, posed per frame.
// Local frame: wrist at the origin, fingers along +Y, palm facing +Z, thumb on the +X side.
function makeHand(skin, sleeveM, cuffM) {
  const g = new THREE.Group();
  const UP = V(0, 1, 0), dv = V(0, 0, 0);
  const seg = (r, len, m = skin) => { const s = mesh(new THREE.CapsuleGeometry(r, Math.max(0.002, len), 4, 10), m); g.add(s); return s; };
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, dv.subVectors(b, a).normalize()); };
  const palm = mesh(new RoundedBoxGeometry(0.084, 0.096, 0.03, 3, 0.013), skin); palm.position.set(0, 0.046, 0); g.add(palm);
  const pad = mesh(new THREE.SphereGeometry(0.021, 14, 10), skin); pad.position.set(0.024, 0.024, 0.008); pad.scale.set(1, 1.35, 0.8); g.add(pad);
  seg(0.025, 0.03).position.set(0, -0.012, -0.002);
  seg(0.027, 0.2).position.set(0, -0.13, -0.004);
  seg(0.037, 0.03, cuffM).position.set(0, -0.215, -0.004);
  seg(0.043, 0.34, sleeveM).position.set(0, -0.42, -0.006);
  const SPL = [0.46, 0.3, 0.24];
  const fingers = [[0.029, 0.09, 0.078, 0.0088], [0.0095, 0.095, 0.086, 0.0092], [-0.0095, 0.091, 0.08, 0.0087], [-0.028, 0.082, 0.064, 0.0077]]
    .map(([x, y, L, r]) => ({ base: V(x, y, 0.002), L, segs: SPL.map((f, j) => seg(r * (1 - j * 0.07), L * f - r)), tip: V(0, 0, 0) }));
  const thumb = { base: V(0.036, 0.018, 0.012), segs: [seg(0.0115, 0.034), seg(0.0102, 0.026)], tip: V(0, 0, 0) };
  const a = V(0, 0, 0), b = V(0, 0, 0), d = V(0, 0, 0), d2 = V(0, 0, 0);
  const OPEN = V(0.8, 0.55, 0.15).normalize(), OPP = V(0.15, 0.6, 0.78).normalize(), IN = V(-0.6, 0.45, 0.65).normalize();
  g.userData.fingers = fingers; g.userData.thumb = thumb;
  g.userData.pose = ({ curl, opp = 0.3, tcurl = 0.2, spread = 0 }) => {
    fingers.forEach((f, i) => {
      const c = curl[i], sp = (1.5 - i) * 0.06 * (1 + spread);
      const angs = [c * 1.35, c * 3.05, c * 4.2];
      a.copy(f.base);
      f.segs.forEach((s, j) => {
        d.set(Math.sin(sp) * Math.cos(angs[j]), Math.cos(sp) * Math.cos(angs[j]), Math.sin(angs[j]));
        b.copy(a).addScaledVector(d, f.L * SPL[j]); place(s, a, b); a.copy(b);
      });
      f.tip.copy(a);
    });
    d.copy(OPEN).lerp(OPP, opp).normalize();
    d2.copy(d).lerp(IN, tcurl).normalize();
    a.copy(thumb.base); b.copy(a).addScaledVector(d, 0.045); place(thumb.segs[0], a, b);
    a.copy(b); b.copy(a).addScaledVector(d2, 0.036); place(thumb.segs[1], a, b);
    thumb.tip.copy(b);
  };
  return g;
}

// A seamless studio sweep: floor, a cove of radius R, then the back wall, as one surface.
function sweepGeometry(width, R, zWall, depth, height) {
  const prof = [];
  for (let i = 0; i <= 6; i++) prof.push([0, depth - i * (depth - (zWall + R)) / 6]);
  for (let i = 1; i <= 16; i++) { const a = (i / 16) * Math.PI / 2; prof.push([R - Math.cos(a) * R, zWall + R - Math.sin(a) * R]); }
  for (let i = 1; i <= 6; i++) prof.push([R + (i / 6) * (height - R), zWall]);
  const pos = [], uv = [], idx = [];
  let acc = 0;
  prof.forEach(([y, z], j) => {
    if (j) acc += Math.hypot(y - prof[j - 1][0], z - prof[j - 1][1]);
    [-width / 2, width / 2].forEach((x, s) => { pos.push(x, y, z); uv.push(s * width / 3, acc / 3); });
  });
  for (let j = 0; j < prof.length - 1; j++) { const a = j * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BG);
  scene.fog = new THREE.Fog(BG, 5, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- the sweep and the light
  const sweepTex = grainTex('#2a2148', { size: 256, speck: 0.07, blot: 0.12, seed: 19, repeat: 1 });
  sweepTex.repeat.set(1, 1);
  const sweep = mesh(sweepGeometry(14, 1.1, -1.5, 6, 5), std(0xffffff, { map: sweepTex, roughness: 0.34, metalness: 0.12 }), { cast: false });
  scene.add(sweep);
  const pool = glow(0xff8a6a, 1, 0.32, 0.5); pool.scale.set(4.2, 2.6, 1); pool.position.set(0.1, 1.1, -1.42); scene.add(pool);
  const pool2 = glow(0x8a6aff, 1, 0.22, 0.5); pool2.scale.set(3, 2.2, 1); pool2.position.set(-1.6, 1.4, -1.4); scene.add(pool2);

  scene.add(new THREE.HemisphereLight(0x8a7ab8, 0x120c1c, 0.32));
  const key = new THREE.SpotLight(0xfff0e6, 24, 0, 0.6, 0.7, 1.3);
  key.position.set(-1.4, 2.7, 2.2); key.target.position.set(-0.1, 0.55, -0.1);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(LILAC_H, 1.5); rim.position.set(2.2, 1.8, -2); scene.add(rim);
  const coralL = new THREE.PointLight(CORAL_H, 0, 1.8, 1.6); scene.add(coralL);

  // ----------------------------------------------------------- the phone in its dock
  const phoneG = new THREE.Group(); phoneG.position.copy(PH); phoneG.rotation.set(-0.15, -0.16, 0); scene.add(phoneG);
  const ph = phone({ w: 0.34, h: 0.7, d: 0.03, frame: 0xb8b4c8, notch: true, r: 0.05 });
  phoneG.add(ph);
  const { sw, sh, d: pd } = ph.userData;
  const UW = Math.round(1024 * sw / sh), UH = 1024;
  const ui = canvasTex(UW, UH);
  ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.needsUpdate = true;
  const scrGlow = glow(0xffb39c, 1, 0, 0.5); scrGlow.scale.set(sw * 2.2, sh * 1.8, 1); scrGlow.position.z = 0.03; phoneG.add(scrGlow);
  const dock = mesh(new RoundedBoxGeometry(0.42, 0.1, 0.22, 3, 0.03), std(0x3a3354, { roughness: 0.4, metalness: 0.3 }));
  dock.position.set(PH.x, 0.05, PH.z - 0.02); dock.rotation.y = -0.16; scene.add(dock);
  const lip = mesh(new RoundedBoxGeometry(0.36, 0.05, 0.05, 2, 0.015), std(0x4a4268, { roughness: 0.35, metalness: 0.3 }));
  lip.position.set(PH.x + 0.01, 0.12, PH.z + 0.06); lip.rotation.y = -0.16; scene.add(lip);
  // Screen pixel to phone-local point.
  const scr = (px, py, out = V(0, 0, 0)) => out.set(sw * (px / UW - 0.5), sh * (0.5 - py / UH), pd / 2 + 0.004);
  const BTN = [UW / 2, UH * 0.86], CARD_Y = 150, CARD_H = 210, TRAVEL = 330;

  function drawUI(c, w, h, s) {
    c.fillStyle = '#0b0818'; c.fillRect(0, 0, w, h);
    if (s.boot <= 0) return;
    c.globalAlpha = s.boot;
    const bg = c.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#1e1838'); bg.addColorStop(1, '#130f26');
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    // Status bar and header bars.
    c.fillStyle = 'rgba(230,224,255,0.75)'; roundRect(c, 30, 30, 70, 16, 8); c.fill(); roundRect(c, w - 90, 30, 60, 16, 8); c.fill();
    c.fillStyle = 'rgba(230,224,255,0.9)'; roundRect(c, 36, 84, 220, 26, 13); c.fill();
    c.fillStyle = 'rgba(185,168,255,0.5)'; roundRect(c, 36, 122, 150, 14, 7); c.fill();
    // Rows that the tokens bring in: one fades, one slides.
    const row = (y, a, dx, accent) => {
      if (a <= 0) return;
      c.save(); c.globalAlpha = s.boot * a; c.translate(dx, 0);
      c.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(c, 28, y, w - 56, 104, 22); c.fill();
      c.fillStyle = accent; c.beginPath(); c.arc(84, y + 52, 26, 0, 7); c.fill();
      c.fillStyle = 'rgba(236,230,255,0.85)'; roundRect(c, 128, y + 30, 200, 16, 8); c.fill();
      c.fillStyle = 'rgba(185,168,255,0.55)'; roundRect(c, 128, y + 60, 140, 12, 6); c.fill();
      c.restore();
    };
    row(560, s.fade, 0, LILAC);
    row(684, 1, s.slide, '#ffb36b');
    // The card: rides down the screen on the easing curve.
    const cy = CARD_Y + s.card * TRAVEL;
    c.globalAlpha = s.boot;
    c.save(); c.shadowColor = 'rgba(255,122,92,0.55)'; c.shadowBlur = 40;
    const cg = c.createLinearGradient(0, cy, w, cy + CARD_H); cg.addColorStop(0, '#ff8a5c'); cg.addColorStop(1, '#e8507a');
    c.fillStyle = cg; roundRect(c, 28, cy, w - 56, CARD_H, 28); c.fill(); c.restore();
    c.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(c, 56, cy + 40, 190, 22, 11); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.6)'; roundRect(c, 56, cy + 78, 260, 14, 7); c.fill(); roundRect(c, 56, cy + 104, 200, 14, 7); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)'; c.beginPath(); c.arc(w - 90, cy + 140, 34, 0, 7); c.fill();
    // The button, its tap ripple and its scale pulse.
    const [bx, by] = BTN, br = 46 * s.scale;
    if (s.ripple > 0 && s.ripple < 1) { c.strokeStyle = `rgba(255,170,140,${0.8 * (1 - s.ripple)})`; c.lineWidth = 6; c.beginPath(); c.arc(bx, by, 46 + 90 * s.ripple, 0, 7); c.stroke(); }
    c.fillStyle = s.press > 0 ? '#ffb39c' : '#f1ecff'; c.beginPath(); c.arc(bx, by, br * (1 - 0.1 * s.press), 0, 7); c.fill();
    c.strokeStyle = '#1e1838'; c.lineWidth = 6; c.lineCap = 'round';
    c.beginPath(); c.moveTo(bx - 14, by - 6 + 10 * (s.card > 0.5 ? 1 : 0)); c.lineTo(bx, by + 8 - 10 * (s.card > 0.5 ? 1 : 0)); c.lineTo(bx + 14, by - 6 + 10 * (s.card > 0.5 ? 1 : 0)); c.stroke();
    c.globalAlpha = 1;
  }

  // ----------------------------------------------------------- the easing graph
  const graphG = new THREE.Group(); graphG.position.copy(GR); graphG.rotation.y = -0.12; scene.add(graphG);
  const slab = mesh(new RoundedBoxGeometry(GW, GH, 0.025, 3, 0.02), new THREE.MeshPhysicalMaterial({ color: 0x2c2450, roughness: 0.12, metalness: 0.1, transparent: true, opacity: 0.55, clearcoat: 1, clearcoatRoughness: 0.08 }), { cast: false });
  graphG.add(slab);
  const edge = mesh(new RoundedBoxGeometry(GW + 0.02, GH + 0.02, 0.012, 3, 0.022), std(0xc9c4dc, { metalness: 1, roughness: 0.25 }));
  edge.position.z = -0.016; graphG.add(edge);
  const foot = mesh(new THREE.CylinderGeometry(0.012, 0.012, GR.y - GH / 2, 10), std(0xc9c4dc, { metalness: 1, roughness: 0.25 }));
  foot.position.set(0, -(GR.y - GH / 2) / 2 - GH / 2, -0.01); graphG.add(foot);
  const base = mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.025, 32), std(0x3a3354, { roughness: 0.4, metalness: 0.3 })); base.position.set(0, -GR.y + 0.0125, -0.01); graphG.add(base);
  const GPX = 1024, GPY = Math.round(1024 * GH / GW);
  const toPx = (x, y) => [GPX / 2 + (x / GW) * GPX, GPY / 2 - (y / GH) * GPY];
  const grid = canvasTex(GPX, GPY);
  let gridKey = '';
  const drawGrid = (gIn, axes) => {
    const key = Math.round(gIn * 20) + '|' + Math.round(axes * 30); if (key === gridKey) return; gridKey = key;
    grid.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      if (gIn <= 0) return;
      const [x0, y0] = toPx(PLOT.x0, PLOT.y0), [x1, y1] = toPx(PLOT.x0 + PLOT.w, PLOT.y0 + PLOT.h);
      c.globalAlpha = gIn;
      c.strokeStyle = 'rgba(185,168,255,0.16)'; c.lineWidth = 2;
      for (let i = 1; i < 8; i++) { const x = lerp(x0, x1, i / 8); c.beginPath(); c.moveTo(x, y0); c.lineTo(x, y1); c.stroke(); }
      for (let i = 1; i < 5; i++) { const y = lerp(y0, y1, i / 5); c.beginPath(); c.moveTo(x0, y); c.lineTo(x1, y); c.stroke(); }
      c.strokeStyle = 'rgba(230,224,255,0.85)'; c.lineWidth = 5; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(lerp(x0, x1 + 20, eo(axes)), y0); c.stroke();
      c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, lerp(y0, y1 - 20, eo(axes))); c.stroke();
      c.fillStyle = 'rgba(230,224,255,0.9)'; c.font = `700 40px ${MONO}`; c.textBaseline = 'top';
      if ('letterSpacing' in c) c.letterSpacing = '6px';
      c.fillText('EASING', x0 - 6, 34);
      c.globalAlpha = 1;
    });
  };
  const gridP = new THREE.Mesh(new THREE.PlaneGeometry(GW, GH), new THREE.MeshBasicMaterial({ map: grid.tex, transparent: true, depthWrite: false, toneMapped: false }));
  gridP.position.z = 0.014; graphG.add(gridP);
  // The curve as a tube in the panel's plane, with an arc-length lookup from time (x) to curve position.
  const plot = (s) => V(PLOT.x0 + bez(s, 0) * PLOT.w, PLOT.y0 + bez(s, 1) * PLOT.h, 0.022);
  const cpath = new THREE.CubicBezierCurve3(plot(0), V(PLOT.x0 + BZ[1][0] * PLOT.w, PLOT.y0, 0.022), V(PLOT.x0 + BZ[2][0] * PLOT.w, PLOT.y0 + PLOT.h, 0.022), plot(1));
  const SEG = 160, RAD = 8;
  const ghostG = new THREE.TubeGeometry(cpath, SEG, 0.0045, RAD), litG = new THREE.TubeGeometry(cpath, SEG, 0.0085, RAD);
  const ghost = new THREE.Mesh(ghostG, new THREE.MeshBasicMaterial({ color: 0x8a7cc8, transparent: true, opacity: 0.55, toneMapped: false }));
  const litM = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false });
  litM.color.setRGB(1.0, 0.55, 0.42);
  const lit = new THREE.Mesh(litG, litM);
  graphG.add(ghost, lit);
  const LUT = [];
  for (let i = 0; i <= 200; i++) { const p = cpath.getPointAt(i / 200); LUT.push([(p.x - PLOT.x0) / PLOT.w, (p.y - PLOT.y0) / PLOT.h, i / 200]); }
  // For a time x in [0,1], the arc-length u and the eased value y.
  const atX = (x) => {
    x = clamp(x);
    let i = 1; while (i < LUT.length - 1 && LUT[i][0] < x) i++;
    const [xa, ya, ua] = LUT[i - 1], [xb, yb, ub] = LUT[i], f = xb > xa ? (x - xa) / (xb - xa) : 0;
    return [lerp(ua, ub, f), lerp(ya, yb, f)];
  };
  const bead = mesh(new THREE.SphereGeometry(0.026, 24, 16), std(0xffffff, { metalness: 1, roughness: 0.12 }));
  graphG.add(bead);
  const beadGlow = glow(CORAL_H, 0.2, 0, 0.4); graphG.add(beadGlow);
  const guideM = new THREE.MeshBasicMaterial({ color: LILAC_H, transparent: true, opacity: 0, toneMapped: false, depthWrite: false });
  const guideV = new THREE.Mesh(new THREE.PlaneGeometry(0.004, 1), guideM), guideH = new THREE.Mesh(new THREE.PlaneGeometry(1, 0.004), guideM);
  graphG.add(guideV, guideH);

  // ----------------------------------------------------------- the motion tokens
  const tokens = TOK.map((w, i) => {
    const g = new THREE.Group(); scene.add(g);
    const body = mesh(new RoundedBoxGeometry(0.36, 0.13, 0.04, 3, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x4a3f7a, roughness: 0.2, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.1 }));
    g.add(body);
    const tx = canvasTex(512, 184, (c, W, H) => {
      c.clearRect(0, 0, W, H);
      c.fillStyle = '#f1ecff'; c.font = `800 72px ${MONO}`; c.textBaseline = 'middle';
      if ('letterSpacing' in c) c.letterSpacing = '6px';
      c.fillText(w, 150, H / 2 + 4);
    }).tex;
    const face = new THREE.Mesh(new THREE.PlaneGeometry(0.35, 0.126), new THREE.MeshBasicMaterial({ map: tx, transparent: true, toneMapped: false, depthWrite: false }));
    face.position.z = 0.0215; g.add(face);
    // A small square on each token acts out its motion.
    const icon = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.05), new THREE.MeshBasicMaterial({ color: CORAL_H, transparent: true, toneMapped: false, depthWrite: false }));
    icon.position.set(-0.12, 0, 0.023); g.add(icon);
    const lamp = new THREE.Mesh(new THREE.CircleGeometry(0.012, 20), new THREE.MeshBasicMaterial({ color: 0x3a3360, toneMapped: false }));
    lamp.position.set(0.15, 0.04, 0.023); g.add(lamp);
    const halo = glow(CORAL_H, 0.45, 0, 0.45); halo.position.z = -0.03; g.add(halo);
    const spark = glow(0xffc2a8, 0.16, 0, 0.35); scene.add(spark);
    return { g, icon, lamp, halo, spark, x: 0.28 + (i - 1) * 0.4 };
  });
  const sysTag = label('MOTION SYSTEM', { font: `700 52px ${MONO}`, fg: '#cbbfff', h: 0.085, pad: 8, track: 6 });
  const SYSW = sysTag.geometry.parameters.width;
  const bar = new THREE.Mesh(new THREE.PlaneGeometry(1.16, 0.008), new THREE.MeshBasicMaterial({ color: CORAL_H, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  scene.add(bar);

  // ----------------------------------------------------------- the hand
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc98e6c, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const hand = makeHand(skin, std(0x5a5078, { roughness: 0.95 }), std(0x473f63, { roughness: 0.9 }));
  scene.add(hand);
  const HSV = V(-HS, HS, HS);   // mirrored: a left hand, coming in from the left of the phone
  hand.scale.copy(HSV);
  const POINT = { curl: [0.05, 0.86, 0.9, 0.93], opp: 0.75, tcurl: 0.55 };
  const PRESSP = { curl: [0.14, 0.88, 0.92, 0.94], opp: 0.78, tcurl: 0.58 };
  // Orientation: the finger points right and into the screen, palm down.
  phoneG.updateMatrixWorld(true);
  const N = V(0, 0, 1).applyQuaternion(phoneG.quaternion).normalize();
  const HY = N.clone().multiplyScalar(-0.62).add(V(1, 0.12, 0)).normalize();
  const HZ = V(0, -1, 0).addScaledVector(HY, HY.y).normalize();
  const HX = V(0, 0, 0).crossVectors(HY, HZ).normalize();
  hand.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(HX, HY, HZ));
  const BTN_W = phoneG.localToWorld(scr(BTN[0], BTN[1]));
  const tipW = V(0, 0, 0), hover = V(0, 0, 0);
  const lerpPose = (a, b, p) => ({ curl: a.curl.map((c, i) => lerp(c, b.curl[i], p)), opp: lerp(a.opp, b.opp, p), tcurl: lerp(a.tcurl, b.tcurl, p) });

  // ----------------------------------------------------------- title
  const client = label('Abbott', { font: `700 56px ${MONO}`, fg: CORAL, h: 0.085, pad: 8, track: 5 });
  const title = label('Interactive concepts', { font: `800 72px ${SANS}`, fg: '#f4f0ff', h: 0.17, pad: 10, track: 1 });
  const line = label('New business work that brought motion and interaction into MRM’s UX practice.', { font: `600 46px ${SANS}`, fg: '#c8bfe6', h: 0.072, pad: 8, track: 0 });
  [client, title, line, sysTag].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width, LWd = line.geometry.parameters.width;

  // ----------------------------------------------------------- motes
  const DN = 110, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffc8b8, size: 0.009, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- state over time
  // Where the bead is in time (0..1 across the graph); the card follows the same eased value.
  const timeX = (t) => {
    for (const [a, b, x0, x1] of RIDE) if (t >= a && t <= b) return lerp(x0, x1, k(t, a, b));
    if (t < RIDE[0][0]) return 0;
    if (t < RIDE[1][0]) return 1;
    return 0;
  };
  const riding = (t) => RIDE.some(([a, b]) => t > a - 0.05 && t < b + 0.12);
  const uiState = (t) => {
    const [, y] = atX(timeX(t));
    let press = 0, ripple = -1;
    TAPS.forEach((T) => { press = Math.max(press, Math.sin(Math.PI * k(t, T - 0.02, T + 0.12))); if (t >= T && t < T + 0.6) ripple = k(t, T, T + 0.6); });
    const fade = eio(k(t, TOK_ON[0] + 0.4, TOK_ON[0] + 0.85));
    const slide = (1 - back(k(t, TOK_ON[1] + 0.4, TOK_ON[1] + 0.85))) * (UW + 20);
    const su = k(t, TOK_ON[2] + 0.4, TOK_ON[2] + 1.0);
    const scale = 1 + 0.38 * Math.max(0, Math.sin(2 * Math.PI * su)) * (1 - 0.4 * su);
    return { boot: eo(k(t, 0.45, 1.0)), card: y, press, ripple, fade, slide: t < TOK_ON[1] + 0.4 ? UW + 20 : slide, scale };
  };
  let uiKey = '';
  const drawUIAt = (t) => {
    const s = uiState(t);
    const key = [s.boot, s.card, s.press, s.ripple, s.fade, s.slide / 400, s.scale].map((v) => Math.round(v * 60)).join('|');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => drawUI(c, w, h, s));
  };

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [0.3, 1.02, 3.05]], [1.7, [0.08, 0.92, 2.6], L],
    [2.25, [-0.12, 0.85, 2.5]], [3.7, [0.06, 0.87, 2.48], L], [4.6, [0.32, 0.72, 2.4]],
    [6.4, [0.24, 0.74, 2.5], L], [7.7, [0.04, 1.02, 3.6]], [10, [0.0, 1.03, 3.72], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.0, 0.74, 0]], [1.7, [-0.04, 0.72, 0], L],
    [2.25, [-0.12, 0.7, 0]], [3.7, [-0.04, 0.7, 0], L], [4.6, [0.12, 0.46, 0]],
    [6.4, [0.08, 0.5, 0], L], [7.7, [-0.02, 0.91, 0]], [10, [-0.02, 0.91, 0], L],
  ]);
  const tgt = V(0, 0, 0), lk = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), from = V(0, 0, 0), to = V(0, 0, 0);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.005, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.25, 33], [4.6, 34], [7.7, 33], [10, 32.5]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the phone wakes; the graph lights its grid, draws its axes and a faint guide curve.
    drawUIAt(t);
    const boot = eo(k(t, 0.45, 1.0));
    ph.userData.screen.material.color.setScalar(lerp(0.04, 0.85, boot));
    scrGlow.material.opacity = 0.12 * boot;
    ph.userData.sheen.position.x = Math.sin(t * 0.5) * 0.02;
    drawGrid(eo(k(t, 0.5, 1.1)), k(t, 0.8, 1.4));
    const gh = eio(k(t, 1.15, 1.95));
    ghostG.setDrawRange(0, Math.floor(gh * SEG) * RAD * 6); ghost.visible = gh > 0.001;

    // Beat 2: tap, and the card and the bead move as one; the bead writes the curve in light.
    const x = timeX(t), [u, y] = atX(x);
    const drawn = t < RIDE[0][0] ? 0 : t < RIDE[0][1] ? u : 1;
    litG.setDrawRange(0, Math.floor(drawn * SEG) * RAD * 6); lit.visible = drawn > 0.001;
    cpath.getPointAt(u, bead.position); bead.position.z = 0.03;
    bead.visible = t > 1.5;
    bead.scale.setScalar(Math.max(0.001, back(k(t, 1.5, 1.85))));
    const moving = riding(t);
    beadGlow.position.copy(bead.position); beadGlow.position.z = 0.04;
    beadGlow.material.opacity = (moving ? 0.85 : 0.35) * clamp(k(t, 1.5, 1.9));
    beadGlow.scale.setScalar(moving ? 0.26 : 0.18);
    const gx = PLOT.x0 + x * PLOT.w, gy = PLOT.y0 + y * PLOT.h;
    guideV.position.set(gx, (PLOT.y0 + gy) / 2, 0.02); guideV.scale.y = Math.max(0.001, gy - PLOT.y0);
    guideH.position.set((PLOT.x0 + gx) / 2, gy, 0.02); guideH.scale.x = Math.max(0.001, gx - PLOT.x0);
    guideM.opacity = 0.5 * (moving ? 1 : 0.4) * clamp(k(t, 1.6, 2.0)) * (1 - k(t, 6.4, 7.0) * 0.6);
    graphG.localToWorld(coralL.position.copy(bead.position)); coralL.position.z += 0.12;
    coralL.intensity = (moving ? 1.6 : 0.4) * clamp(k(t, 1.5, 1.9));

    // The hand: in from the left, taps twice, then leaves.
    const enter = eio(k(t, 1.25, 2.0)), leave = ei(k(t, 4.05, 4.65));
    let pr = 0, near = 0;
    TAPS.forEach((T) => { near = Math.max(near, Math.min(ei(k(t, T - 0.2, T)), 1 - eo(k(t, T + 0.07, T + 0.32)))); pr = Math.max(pr, Math.sin(Math.PI * k(t, T - 0.02, T + 0.12))); });
    hand.userData.pose(lerpPose(POINT, PRESSP, pr));
    tipW.copy(hand.userData.fingers[0].tip).multiply(HSV).applyQuaternion(hand.quaternion);
    hover.copy(N).multiplyScalar(0.075 * (1 - near) + 0.026).addScaledVector(HY, -0.03 * (1 - near));
    hand.position.copy(BTN_W).sub(tipW).add(hover);
    hand.position.add(tmp.set(-1.1, -0.15, 0.55).multiplyScalar(1 - enter)).add(tmp.set(-1.0, 0.05, 0.7).multiplyScalar(leave));
    hand.position.y += Math.sin(t * 2.1) * 0.006 * (1 - near);
    hand.visible = t > 1.2 && t < 4.7;

    // Beat 3: each token rises, throws a spark into the phone, and lights when its motion lands.
    tokens.forEach((tk, i) => {
      const on = TOK_ON[i], rise = back(k(t, on, on + 0.45)), land = on + 0.4;
      const gather = eio(k(t, 6.45, 7.1));
      tk.g.position.set(tk.x, lerp(-0.08, 0.22, clamp(rise)) + (rise - clamp(rise)) * 0.2 + Math.sin(t * 1.4 + i * 1.7) * 0.006 * clamp(rise), lerp(0.02, 0.18, gather));
      tk.g.rotation.set(lerp(0.9, -0.1, clamp(rise)), -0.08 + Math.sin(t * 0.9 + i) * 0.03, 0);
      tk.g.visible = t > on - 0.02;
      // The token's own square acts out its motion while its spark is in the air.
      const demo = k(t, on + 0.15, on + 0.95);
      tk.icon.material.opacity = i === 0 ? 0.25 + 0.75 * Math.abs(Math.cos(Math.PI * demo)) : 1;
      tk.icon.position.x = -0.12 + (i === 1 ? 0.03 * Math.sin(Math.PI * 2 * demo) : 0);
      tk.icon.scale.setScalar(i === 2 ? 1 + 0.45 * Math.max(0, Math.sin(Math.PI * 2 * demo)) : 1);
      // Spark arcs from the token into the phone.
      const sp = eio(k(t, on + 0.15, land + 0.12));
      tk.g.localToWorld(from.set(-0.12, 0, 0.03));
      phoneG.localToWorld(to.copy(scr(UW / 2, i === 2 ? BTN[1] : i === 0 ? 612 : 736)));
      tmp2.lerpVectors(from, to, sp); tmp2.y += Math.sin(Math.PI * sp) * 0.35; tmp2.z += Math.sin(Math.PI * sp) * 0.15;
      tk.spark.position.copy(tmp2);
      tk.spark.material.opacity = sp > 0 && sp < 1 ? 0.95 : 0;
      tk.spark.scale.setScalar(0.12 + 0.08 * Math.sin(Math.PI * sp));
      // The lamp lights when the phone has done the motion.
      const done = t > land + 0.45;
      tk.lamp.material.color.setRGB(done ? 1.5 : 0.23, done ? 0.62 : 0.2, done ? 0.45 : 0.38);
      tk.halo.material.opacity = done ? 0.18 + 0.5 * Math.exp(-4 * (t - land - 0.45)) : 0;
    });
    // Beat 4: the three settle into one system.
    const sys = eo(k(t, 6.55, 7.05));
    sysTag.position.set(tokens[0].x - 0.18 + SYSW / 2, 0.36 + (1 - sys) * -0.02, lerp(0.02, 0.18, eio(k(t, 6.45, 7.1))));
    sysTag.material.opacity = sys; sysTag.visible = sys > 0.01;
    bar.position.set(0.28, 0.135, sysTag.position.z); bar.scale.x = Math.max(0.001, eio(k(t, 6.6, 7.2)));
    bar.material.opacity = 0.9 * sys;

    // The project's name rises above the set.
    const ci = back(k(t, 7.75, 8.3)), ti = back(k(t, 7.9, 8.45)), li = eo(k(t, 8.15, 8.75)), out = ei(k(t, 9.2, 9.6));
    const tx = -0.02, tz = 0.15;
    lk.set(camera.position.x, 1.45, camera.position.z);
    title.position.set(tx, 1.5 + (1 - clamp(ti)) * -0.04, tz); title.lookAt(lk);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(tx - TWd / 2 + CWd / 2 + 0.01, 1.635 + (1 - clamp(ci)) * -0.03, tz); client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;
    line.position.set(tx - TWd / 2 + LWd / 2 + 0.01, 1.37 + (1 - li) * -0.02, tz); line.quaternion.copy(title.quaternion);
    line.material.opacity = li * (1 - out); line.visible = line.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.6 + rnd(i, 71) * 3.2 + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = 0.1 + rnd(i, 72) * 1.7 + Math.sin(t * 0.42 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -1.2 + rnd(i, 73) * 2.0 + Math.cos(t * 0.22 + i) * 0.06;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.65 };
}
