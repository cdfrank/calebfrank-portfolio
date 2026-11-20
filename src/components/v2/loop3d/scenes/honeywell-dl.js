// Honeywell design language refresh lit loop, 10 s. "Four buttons become one, then the procedure is followed."
// A drafting studio after hours: warm charcoal walls, a backlit light table glowing cool blue through its
// grid. Four mismatched buttons float over the table as specimens (a grey slab, a soft orange pill, a bare
// outline, a dark rounded block), each with its label set its own way. A scan passes over them, they fade
// back into the dark, and one specified red pill rises out of a slot in the glass. A laser draws its redlines:
// 80 across, 24 high. Then a hand with a red pen ticks through the five steps of the operating procedure
// pinned on an easel, each step lighting as it is checked. On the last tick the four ghosts at the back rise
// again, each now an exact copy of the specified button, and the title settles.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const RED = '#e4002b', RED_H = 0xe4002b, LASER = 0xff2a44;
const BGC = 0x1d1a18;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// ------------------------------------------------------------- timeline
const SCAN = [0.9, 1.9];                  // a scan line reads across the four buttons
const BACK = 2.05;                         // they fade back
const RISE = [2.35, 3.05];                 // the specified button rises
const W_LINE = [3.15, 3.65], H_LINE = [3.75, 4.15];   // redlines draw
const LOCK = 4.35;                         // the spec locks in with a pulse
const TICK = [5.35, 5.85, 6.35, 6.85, 7.35], DRAW = 0.22;
const UNIFY = 7.7;                         // the ghosts rise again as copies of the spec
const SPEC = V(-0.45, 0.33, 0.24);         // centre of the specified button
const BW = 0.8, BH = 0.24, BDp = 0.07;     // 80 x 24, as the old loop's redlines say

// The four "before" buttons: size, look, and where they float.
const OLD = [
  { x: -0.8, y: 0.5, z: -0.2, w: 0.5, h: 0.15, kind: 'slab' },
  { x: -0.74, y: 0.22, z: 0.0, w: 0.42, h: 0.2, kind: 'pill' },
  { x: -0.14, y: 0.52, z: -0.2, w: 0.52, h: 0.13, kind: 'line' },
  { x: -0.1, y: 0.24, z: 0.0, w: 0.4, h: 0.17, kind: 'dark' },
];
const GHOST_Z = -0.62;

function pillShape(w, h, r) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0);
  s.lineTo(x + w, y + h - r); s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2);
  s.lineTo(x + r, y + h); s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI);
  s.lineTo(x, y + r); s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5);
  return s;
}
// A pill with a soft bevelled edge, centred on its own origin, front face toward +z.
function pillGeo(w, h, d, bev = 0.012) {
  const g = new THREE.ExtrudeGeometry(pillShape(w - bev * 2, h - bev * 2, (h - bev * 2) / 2), { depth: d - bev * 2, bevelEnabled: true, bevelThickness: bev, bevelSize: bev, bevelSegments: 4, curveSegments: 20 });
  g.translate(0, 0, -(d - bev * 2) / 2);
  return g;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BGC);
  scene.fog = new THREE.Fog(BGC, 3.4, 8);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3();

  // ----------------------------------------------------------- the studio and the light table
  const floor = mesh(new THREE.PlaneGeometry(14, 14), std(0xffffff, { map: grainTex('#1f1c1a', { size: 256, speck: 0.07, blot: 0.12, seed: 81, repeat: 6 }), roughness: 0.7 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.82; scene.add(floor);
  const wall = mesh(new THREE.PlaneGeometry(10, 5), std(0xffffff, { map: grainTex('#2a2522', { size: 256, speck: 0.05, blot: 0.14, seed: 82, repeat: 3 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 1.2, -2.2); scene.add(wall);

  const TW = 2.8, TD = 1.6;
  const gridTex = canvasTex(1024, 586, (c, w, h) => {
    c.fillStyle = '#2a4258'; c.fillRect(0, 0, w, h);
    const v = c.createRadialGradient(w * 0.45, h * 0.55, 20, w * 0.45, h * 0.55, w * 0.7);
    v.addColorStop(0, 'rgba(160,210,240,0.35)'); v.addColorStop(1, 'rgba(0,0,0,0.25)');
    c.fillStyle = v; c.fillRect(0, 0, w, h);
    for (let x = 0; x <= w; x += 16) { c.fillStyle = x % 128 === 0 ? 'rgba(170,215,240,0.55)' : 'rgba(170,215,240,0.16)'; c.fillRect(x, 0, x % 128 === 0 ? 2 : 1, h); }
    for (let y = 0; y <= h; y += 16) { c.fillStyle = y % 128 === 0 ? 'rgba(170,215,240,0.55)' : 'rgba(170,215,240,0.16)'; c.fillRect(0, y, w, y % 128 === 0 ? 2 : 1); }
  }).tex;
  const tableM = new THREE.MeshStandardMaterial({ color: 0x223040, map: gridTex, emissive: 0xffffff, emissiveMap: gridTex, emissiveIntensity: 0.42, roughness: 0.22, metalness: 0.05 });
  const top = mesh(new THREE.PlaneGeometry(TW, TD), tableM, { cast: false });
  top.rotation.x = -Math.PI / 2; top.position.set(0, 0, -0.1); scene.add(top);
  const frameM = std(0x2c2f34, { metalness: 0.8, roughness: 0.32 });
  const frame = mesh(new RoundedBoxGeometry(TW + 0.08, 0.07, TD + 0.08, 2, 0.012), frameM);
  frame.position.set(0, -0.037, -0.1); scene.add(frame);
  const legI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.78, 0.06), frameM, 4);
  [[-1.3, -0.82], [1.3, -0.82], [-1.3, 0.62], [1.3, 0.62]].forEach(([x, z], i) => { m4.makeTranslation(x, -0.43, z); legI.setMatrixAt(i, m4); });
  legI.castShadow = true; scene.add(legI);
  const tableGlow = glow(0x7fc0ff, 1, 0.22, 0.5); tableGlow.scale.set(3.4, 1.2, 1); tableGlow.position.set(-0.1, 0.02, 0.1); scene.add(tableGlow);
  // The slot in the glass the specified button rises out of.
  const slotM = new THREE.MeshBasicMaterial({ color: 0x0a0d10, toneMapped: false });
  const slot = new THREE.Mesh(new THREE.PlaneGeometry(BW + 0.06, 0.035), slotM); slot.rotation.x = -Math.PI / 2; slot.position.set(SPEC.x, 0.002, SPEC.z); scene.add(slot);
  const slotGlow = glow(LASER, 1, 0, 0.45); slotGlow.scale.set(1.3, 0.25, 1); slotGlow.position.set(SPEC.x, 0.03, SPEC.z); scene.add(slotGlow);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0xb8a898, 0x101418, 0.28));
  const key = new THREE.SpotLight(0xfff0dc, 22, 0, 0.6, 0.7, 1.4);
  key.position.set(-1.3, 2.5, 1.8); key.target.position.set(-0.05, 0.25, -0.05);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1.4; key.shadow.camera.far = 6.5; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xff9a6a, 1.0); rim.position.set(1.6, 1.5, -2.0); scene.add(rim);
  const up = new THREE.PointLight(0x8fc8ff, 1.3, 2.2, 1.5); up.position.set(-0.4, 0.06, 0.05); scene.add(up);
  const lockL = new THREE.PointLight(LASER, 0, 1.2, 2); lockL.position.set(SPEC.x, SPEC.y, SPEC.z + 0.25); scene.add(lockL);

  // ----------------------------------------------------------- the four "before" buttons
  // Each one is lettered its own way: a bar that stands in for the label, set left, centred or right.
  const faceTex = (o) => canvasTex(256, Math.round(256 * o.h / o.w), (c, w, h) => {
    c.clearRect(0, 0, w, h);
    if (o.kind === 'line') { c.strokeStyle = '#d8dde4'; c.lineWidth = 5; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#d8dde4'; roundRect(c, w - 120, h / 2 - 7, 96, 14, 3); c.fill(); return; }
    if (o.kind === 'slab') { c.fillStyle = '#eef0f2'; c.fillRect(22, h / 2 - 6, 80, 12); return; }
    if (o.kind === 'pill') { c.fillStyle = '#fff4ea'; roundRect(c, w / 2 - 70, h / 2 - 11, 140, 22, 11); c.fill(); return; }
    c.fillStyle = '#ffcc4a'; c.beginPath(); c.arc(40, h / 2, 10, 0, 7); c.fill();
    c.fillStyle = '#c8ccd2'; roundRect(c, 62, h / 2 - 9, 120, 18, 9); c.fill();
  }).tex;
  const olds = OLD.map((o, i) => {
    const g = new THREE.Group(); scene.add(g);
    let body = null;
    if (o.kind === 'slab') body = mesh(new RoundedBoxGeometry(o.w, o.h, 0.05, 2, 0.004), new THREE.MeshStandardMaterial({ color: 0x8a9099, roughness: 0.5, transparent: true }));
    if (o.kind === 'pill') body = mesh(pillGeo(o.w, o.h, 0.06, 0.014), new THREE.MeshPhysicalMaterial({ color: 0xff7a3d, roughness: 0.25, clearcoat: 0.6, transparent: true, opacity: 0.75 }));
    if (o.kind === 'dark') body = mesh(new RoundedBoxGeometry(o.w, o.h, 0.06, 4, 0.03), new THREE.MeshStandardMaterial({ color: 0x24282f, roughness: 0.35, metalness: 0.4, transparent: true }));
    if (body) g.add(body);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(o.w, o.h), new THREE.MeshStandardMaterial({ map: faceTex(o), transparent: true, roughness: 0.6, depthWrite: false }));
    face.position.z = o.kind === 'line' ? 0 : (o.kind === 'slab' ? 0.026 : 0.031); g.add(face);
    const rod = mesh(new THREE.CylinderGeometry(0.006, 0.006, 1, 8), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, roughness: 0.1, transparent: true, opacity: 0.35 }), { cast: false });
    g.add(rod);
    return { o, g, body, face, rod, mats: [body && body.material, face.material, rod.material].filter(Boolean), base: [body && body.material.opacity, 1, 0.35].filter((x) => x != null) };
  });
  const beforeTag = label('BEFORE', { font: `700 52px ${MONO}`, fg: '#a8a29a', h: 0.07, pad: 8, track: 6 });
  beforeTag.position.set(-0.92, 0.7, -0.2); scene.add(beforeTag);
  // Scan line that reads across them.
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(0.012, 0.62), new THREE.MeshBasicMaterial({ color: 0x9fe0ff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(scan);
  const scanGlow = glow(0x9fe0ff, 1, 0, 0.5); scanGlow.scale.set(0.18, 0.7, 1); scene.add(scanGlow);

  // ----------------------------------------------------------- the specified button
  const spec = new THREE.Group(); scene.add(spec);
  const redM = new THREE.MeshPhysicalMaterial({ color: RED_H, roughness: 0.28, clearcoat: 0.8, clearcoatRoughness: 0.12, emissive: RED_H, emissiveIntensity: 0.06 });
  const specGeo = pillGeo(BW, BH, BDp);
  spec.add(mesh(specGeo, redM));
  const wordTex = canvasTex(1024, 308, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#ffffff'; c.font = `800 120px ${SANS}`; c.textBaseline = 'middle'; c.textAlign = 'center';
    if ('letterSpacing' in c) c.letterSpacing = '10px';
    c.fillText('BUTTON', w / 2, h / 2 + 6);
  }).tex;
  const wordGeo = new THREE.PlaneGeometry(BW, BH);
  const word = new THREE.Mesh(wordGeo, new THREE.MeshBasicMaterial({ map: wordTex, transparent: true, depthWrite: false, toneMapped: false, color: 0xe8e8e8 }));
  word.position.z = BDp / 2 + 0.002; spec.add(word);
  const specGlow = glow(LASER, 1, 0, 0.45); specGlow.scale.set(1.5, 0.6, 1); specGlow.position.z = -0.06; spec.add(specGlow);
  const lockRing = new THREE.Mesh(new THREE.RingGeometry(0.98, 1.0, 64), new THREE.MeshBasicMaterial({ color: LASER, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  lockRing.scale.set(0.45, 0.18, 1); lockRing.position.z = BDp / 2 + 0.004; spec.add(lockRing);
  const guide = label('GUIDELINE', { font: `700 52px ${MONO}`, fg: '#ff5a6e', h: 0.065, pad: 8, track: 6 });
  scene.add(guide);

  // Redlines: a handful of hot red bars in the button's plane, drawn in by a laser tip.
  // [cx, cy, length, vertical?] in spec-local units; the first two are the dimension lines.
  const LN = [
    [0, -0.21, BW, 0], [BW / 2 + 0.12, 0, BH, 1],
    [-BW / 2, -0.175, 0.07, 1], [BW / 2, -0.175, 0.07, 1],          // width extension lines
    [BW / 2 + 0.085, BH / 2, 0.07, 0], [BW / 2 + 0.085, -BH / 2, 0.07, 0], // height extension lines
    [-BW / 2, -0.21, 0.03, 1], [BW / 2, -0.21, 0.03, 1],             // end ticks
    [BW / 2 + 0.12, BH / 2, 0.03, 0], [BW / 2 + 0.12, -BH / 2, 0.03, 0],
  ];
  const lineM = new THREE.MeshBasicMaterial({ color: LASER, toneMapped: false });
  lineM.color.multiplyScalar(1.4);
  const lineI = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1), lineM, LN.length);
  lineI.position.z = BDp / 2 + 0.006; spec.add(lineI);
  const laser = glow(LASER, 0.09, 0, 0.35); laser.position.z = BDp / 2 + 0.02; spec.add(laser);
  const dimW = label('80', { font: `800 64px ${MONO}`, fg: '#ff4a5e', h: 0.075, pad: 6, track: 2 });
  const dimH = label('24', { font: `800 64px ${MONO}`, fg: '#ff4a5e', h: 0.075, pad: 6, track: 2 });
  dimW.position.set(0, -0.27, BDp / 2 + 0.008); dimH.position.set(BW / 2 + 0.2, 0, BDp / 2 + 0.008);
  spec.add(dimW, dimH);
  const specRod = mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 8), new THREE.MeshPhysicalMaterial({ color: 0xcfe6ff, roughness: 0.1, transparent: true, opacity: 0.35 }), { cast: false });
  scene.add(specRod);

  // Copies of the spec that take the ghosts' places at the end: one instanced body, one instanced word.
  const copyI = new THREE.InstancedMesh(specGeo, redM, OLD.length);
  const copyWordI = new THREE.InstancedMesh(wordGeo, word.material, OLD.length);
  copyI.castShadow = true; scene.add(copyI, copyWordI);
  const copyGlows = OLD.map(() => { const g = glow(LASER, 0.5, 0, 0.45); scene.add(g); return g; });

  // ----------------------------------------------------------- the operating procedure on its easel
  const CW = 0.72, CH = 0.92, PW = 768, PH = 984;
  const card = new THREE.Group(); card.position.set(0.8, 0.5, -0.06); card.rotation.set(-0.3, -0.22, 0, 'YXZ'); scene.add(card);
  const board = mesh(new RoundedBoxGeometry(CW + 0.04, CH + 0.04, 0.025, 2, 0.01), std(0x2a2d33, { metalness: 0.5, roughness: 0.4 }));
  board.position.z = -0.014; card.add(board);
  const clip = mesh(new RoundedBoxGeometry(0.2, 0.05, 0.03, 2, 0.008), std(0xb9bec6, { metalness: 1, roughness: 0.25 })); clip.position.set(0, CH / 2 + 0.005, 0.006); card.add(clip);
  const sheet = canvasTex(PW, PH);
  const sheetM = new THREE.MeshStandardMaterial({ map: sheet.tex, roughness: 0.85 });
  const paper = mesh(new THREE.PlaneGeometry(CW, CH), sheetM, { cast: false }); card.add(paper);
  // Easel legs and a ledge.
  const easelM = std(0x6b4a30, { roughness: 0.6 });
  const ledge = mesh(new THREE.BoxGeometry(CW + 0.1, 0.03, 0.05), easelM); ledge.position.set(0, -CH / 2 - 0.03, 0.01); card.add(ledge);
  const legE = mesh(new THREE.BoxGeometry(0.03, 0.75, 0.03), easelM); legE.position.set(0.87, 0.3, -0.36); legE.rotation.x = 0.55; scene.add(legE);

  const ROW_Y = (i) => 262 + i * 148;
  const BOX_X = 616;
  const TICK_PTS = (i) => { const y = ROW_Y(i); return [[BOX_X + 14, y + 2], [BOX_X + 27, y + 17], [BOX_X + 50, y - 16]]; };
  const tickAt = (i, u, out) => {
    const [a, b, c2] = TICK_PTS(i), s1 = 0.33;
    const p = u < s1 ? [lerp(a[0], b[0], u / s1), lerp(a[1], b[1], u / s1)] : [lerp(b[0], c2[0], (u - s1) / (1 - s1)), lerp(b[1], c2[1], (u - s1) / (1 - s1))];
    return out.set((p[0] / PW - 0.5) * CW, (0.5 - p[1] / PH) * CH, 0);
  };
  function drawSheet(c, w, h, s) {
    c.fillStyle = '#cbc3b6'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,0.05)'; for (let i = 0; i < 40; i++) c.fillRect(0, i * 25, w, 1);
    c.fillStyle = '#2a2622'; c.font = `800 44px ${MONO}`; c.textBaseline = 'middle';
    c.fillText('OPERATING', 52, 82); c.fillText('PROCEDURE', 52, 134);
    c.fillStyle = RED; c.fillRect(52, 178, w - 104, 6);
    for (let i = 0; i < 5; i++) {
      const y = ROW_Y(i), done = s.done[i], fill = s.fill[i];
      c.fillStyle = done > 0 ? `rgba(228,0,43,${0.06 * done})` : 'rgba(0,0,0,0)'; c.fillRect(36, y - 62, w - 72, 124);
      c.fillStyle = fill > 0 ? RED : 'rgba(0,0,0,0)';
      c.beginPath(); c.arc(92, y, 34 * Math.min(1.15, Math.max(fill, 0.001)), 0, 7); c.fill();
      c.strokeStyle = '#2a2622'; c.lineWidth = 4; c.beginPath(); c.arc(92, y, 34, 0, 7); c.stroke();
      c.fillStyle = fill > 0.5 ? '#ffffff' : '#2a2622'; c.font = `800 40px ${MONO}`; c.textAlign = 'center'; c.fillText(String(i + 1), 92, y + 2); c.textAlign = 'left';
      c.fillStyle = done > 0.5 ? '#3a342e' : '#8b8378';
      roundRect(c, 150, y - 26, [380, 330, 400, 300, 360][i], 18, 9); c.fill();
      roundRect(c, 150, y + 10, [250, 280, 210, 260, 230][i], 14, 7); c.fill();
      c.strokeStyle = done > 0 ? RED : '#2a2622'; c.lineWidth = 5; roundRect(c, BOX_X, y - 30, 60, 60, 10); c.stroke();
      if (s.ink[i] > 0) {
        const [a, b, c2] = TICK_PTS(i), u = s.ink[i], s1 = 0.33;
        c.strokeStyle = RED; c.lineWidth = 10; c.lineCap = 'round'; c.lineJoin = 'round';
        c.beginPath(); c.moveTo(a[0], a[1]);
        if (u < s1) c.lineTo(lerp(a[0], b[0], u / s1), lerp(a[1], b[1], u / s1));
        else { c.lineTo(b[0], b[1]); c.lineTo(lerp(b[0], c2[0], (u - s1) / (1 - s1)), lerp(b[1], c2[1], (u - s1) / (1 - s1))); }
        c.stroke();
      }
    }
  }
  let sheetKey = '';
  function updateSheet(t) {
    const ink = TICK.map((t0) => k(t, t0, t0 + DRAW));
    const done = TICK.map((t0) => eo(k(t, t0 + DRAW, t0 + DRAW + 0.25)));
    const fill = TICK.map((t0) => back(k(t, t0 + DRAW, t0 + DRAW + 0.3)));
    const key = ink.map((x) => Math.round(x * 24)).join() + '|' + done.map((x) => Math.round(x * 10)).join() + '|' + fill.map((x) => Math.round(x * 20)).join();
    if (key === sheetKey) return; sheetKey = key;
    sheet.redraw((c, w, h) => drawSheet(c, w, h, { ink, done, fill }));
  }
  // A glow on each box as it's ticked.
  const tickGlows = TICK.map((_, i) => { const g = glow(LASER, 0.16, 0, 0.4); tickAt(i, 0.5, g.position); g.position.z = 0.02; card.add(g); return g; });

  // ----------------------------------------------------------- the hand and the red pen
  // Built in the card's own frame with the pen tip at the hand group's origin, so the tip lands
  // exactly on the tick path drawn into the sheet.
  const hand = new THREE.Group(); card.add(hand);
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xd2a07e, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const sleeveM = std(0x3a4a5a, { roughness: 0.95 }), cuffM = std(0x485a6c, { roughness: 0.9 });
  const dv = V(0, 0, 0);
  const limb = (r, a, b, mat) => {
    const len = a.distanceTo(b), g = new THREE.CapsuleGeometry(r, len, 4, 12); g.translate(0, len / 2, 0);
    const m = mesh(g, mat); m.position.copy(a); m.quaternion.setFromUnitVectors(Y, dv.subVectors(b, a).normalize()); hand.add(m); return m;
  };
  const dP = V(0.32, -0.42, 0.85).normalize();
  const along = (s, x = 0, y = 0, z = 0) => dP.clone().multiplyScalar(s).add(V(x, y, z));
  const penGeo = new THREE.CylinderGeometry(0.0065, 0.0058, 0.15, 16); penGeo.translate(0, 0.075 + 0.012, 0);
  const pen = mesh(penGeo, new THREE.MeshPhysicalMaterial({ color: RED_H, roughness: 0.3, clearcoat: 0.8 })); pen.quaternion.setFromUnitVectors(Y, dP); hand.add(pen);
  const nib = mesh(new THREE.ConeGeometry(0.0058, 0.014, 14), std(0x1a1c20, { metalness: 0.7, roughness: 0.3 })); nib.position.copy(along(0.006)); nib.quaternion.setFromUnitVectors(Y, dP.clone().negate()); hand.add(nib);
  const penClip = mesh(new THREE.BoxGeometry(0.003, 0.05, 0.004), std(0xc9ced3, { metalness: 1, roughness: 0.25 })); penClip.position.copy(along(0.13, -0.006, 0.0, 0.0)); penClip.quaternion.copy(pen.quaternion); hand.add(penClip);
  const C = along(0.085, 0.03, -0.012, 0.018);
  const palm = mesh(new RoundedBoxGeometry(0.058, 0.08, 0.032, 3, 0.013), skin); palm.position.copy(C); palm.quaternion.setFromUnitVectors(Y, V(0.55, -0.55, 0.62).normalize()); hand.add(palm);
  limb(0.0085, along(0.032, -0.004, 0.009, 0.004), C.clone().add(V(-0.01, 0.026, -0.004)), skin);       // index along the pen
  limb(0.0085, along(0.034, 0.011, -0.006, -0.002), C.clone().add(V(0.004, 0.0, -0.012)), skin);       // middle under it
  limb(0.0092, along(0.042, -0.013, -0.01, 0.008), C.clone().add(V(-0.022, -0.022, 0.004)), skin);     // thumb
  limb(0.0078, C.clone().add(V(0.02, -0.03, -0.014)), C.clone().add(V(0.004, -0.044, -0.004)), skin);  // curled ring
  limb(0.0072, C.clone().add(V(0.028, -0.04, -0.01)), C.clone().add(V(0.016, -0.052, 0.0)), skin);     // curled little
  const W = C.clone().add(V(0.034, -0.04, 0.03));
  limb(0.024, C.clone().add(V(0.012, -0.014, 0.01)), W, skin);
  limb(0.036, W.clone().add(V(0.012, -0.012, 0.012)), W.clone().add(V(0.42, -0.4, 0.46)), sleeveM);
  limb(0.039, W.clone().add(V(0.006, -0.006, 0.006)), W.clone().add(V(0.022, -0.022, 0.024)), cuffM);
  const OFF = V(0.55, -0.62, 0.45);

  const tip = V(0, 0, 0), ta = V(0, 0, 0), tb = V(0, 0, 0);
  function tipAt(t, out) {
    if (t < TICK[0]) {
      const v = eio(k(t, 4.75, TICK[0] - 0.02));
      tickAt(0, 0, ta); out.copy(OFF).lerp(ta, v); out.z = lerp(0.3, 0.003, v) + 0.03 * Math.sin(Math.PI * v);
      return;
    }
    let i = 0; while (i < 4 && t >= TICK[i + 1]) i++;
    const t0 = TICK[i];
    if (t < t0 + DRAW) { tickAt(i, k(t, t0, t0 + DRAW), out); out.z = 0.002; return; }
    tickAt(i, 1, ta);
    if (i < 4) {
      tickAt(i + 1, 0, tb);
      const v = eio(k(t, t0 + DRAW + 0.02, TICK[i + 1] - 0.03));
      out.copy(ta).lerp(tb, v); out.z = 0.002 + 0.045 * Math.sin(Math.PI * k(t, t0 + DRAW, TICK[i + 1]));
      return;
    }
    const v = eio(k(t, t0 + DRAW + 0.05, 8.15));
    out.copy(ta).lerp(OFF, v); out.z = lerp(0.002, 0.3, v) + 0.03 * Math.sin(Math.PI * k(t, t0 + DRAW, t0 + DRAW + 0.15));
  }

  // ----------------------------------------------------------- title
  const title = label('Design language refresh', { font: `800 64px ${SANS}`, fg: '#f1ece6', h: 0.13, pad: 12, track: 1 });
  const client = label('Honeywell', { font: `700 56px ${MONO}`, fg: '#ff5a6e', h: 0.08, pad: 8, track: 4 });
  [title, client].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width;

  // ----------------------------------------------------------- dust over the glass
  const DN = 110, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xbfe2ff, size: 0.008, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.4, 0.95, 1.95]], [2.0, [-0.42, 0.9, 1.82]],
    [3.0, [-0.31, 0.76, 1.92]], [4.5, [-0.27, 0.72, 1.8], L],
    [5.3, [0.26, 1.02, 1.68]], [7.5, [0.3, 1.0, 1.58], L],
    [8.5, [0.05, 1.28, 2.75]], [10, [0.04, 1.3, 2.86], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.45, 0.34, -0.1]], [2.0, [-0.45, 0.34, -0.06]],
    [3.0, [-0.31, 0.3, 0.2]], [4.5, [-0.29, 0.3, 0.2], L],
    [5.3, [0.74, 0.5, -0.06]], [7.5, [0.76, 0.5, -0.06], L],
    [8.5, [0.04, 0.4, -0.2]], [10, [0.04, 0.41, -0.2], L],
  ]);
  const tgt = V(0, 0, 0);
  const faceCam = (m) => { m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), 0); };

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // ---- Beat 1: the four mismatched buttons, read by a scan, fade back into the dark.
    const sc = k(t, SCAN[0], SCAN[1]);
    const scanX = lerp(-1.15, 0.2, eio(sc));
    scan.position.set(scanX, 0.36, 0.06); scan.lookAt(camera.position.x, 0.32, camera.position.z);
    scan.material.opacity = 0.85 * Math.sin(Math.PI * sc);
    scanGlow.position.copy(scan.position); scanGlow.material.opacity = 0.45 * Math.sin(Math.PI * sc);
    olds.forEach((it, i) => {
      const { o, g } = it;
      const hit = Math.exp(-14 * Math.abs(scanX - o.x)) * Math.sin(Math.PI * sc);
      const fb = eio(k(t, BACK + i * 0.07, BACK + 0.55 + i * 0.07));
      const gone = eo(k(t, UNIFY + i * 0.12, UNIFY + 0.3 + i * 0.12));
      const bob = Math.sin(t * 1.4 + i * 1.7) * 0.008;
      g.position.set(o.x, o.y + bob - 0.07 * fb, lerp(o.z, GHOST_Z, fb));
      g.rotation.set(0.04 * Math.sin(t * 0.9 + i), (rnd(i, 4) - 0.5) * 0.3 * (1 - fb), (rnd(i, 5) - 0.5) * 0.12 * (1 - fb));
      g.scale.setScalar(lerp(1, 0.86, fb) * (1 + 0.05 * hit) * (1 - 0.6 * gone));
      it.mats.forEach((m, j) => { m.opacity = it.base[j] * lerp(1, 0.2, fb) * (1 - gone); });
      g.visible = gone < 0.99;
      it.rod.scale.y = Math.max(0.01, g.position.y - o.h / 2); it.rod.position.set(0, -o.h / 2 - it.rod.scale.y / 2, -0.01);
    });
    beforeTag.material.opacity = 1 - eo(k(t, BACK, BACK + 0.4)); beforeTag.visible = beforeTag.material.opacity > 0.01;
    faceCam(beforeTag);

    // ---- Beat 2: the specified button rises out of the glass; its redlines are drawn.
    const r = back(k(t, RISE[0], RISE[1]));
    const press = Math.sin(Math.PI * k(t, LOCK - 0.12, LOCK + 0.1)) * (t < LOCK + 0.1 ? 1 : 0);
    spec.position.set(SPEC.x, lerp(-0.2, SPEC.y, r) + Math.sin(t * 1.2) * 0.004 * clamp(r), SPEC.z - 0.02 * press);
    spec.rotation.set(lerp(0.5, 0, clamp(r)), 0.12 * (1 - clamp(r)) + 0.03 * Math.sin(t * 0.7), 0);
    spec.scale.setScalar(1 - 0.03 * press);
    spec.visible = t > RISE[0] - 0.02;
    specRod.scale.y = Math.max(0.01, spec.position.y - BH / 2); specRod.position.set(SPEC.x, specRod.scale.y / 2, SPEC.z - 0.01);
    specRod.visible = spec.visible;
    const slotOn = Math.sin(Math.PI * k(t, RISE[0] - 0.25, RISE[1] + 0.2));
    slotGlow.material.opacity = 0.7 * slotOn;
    slotM.color.setRGB(0.04 + 0.9 * slotOn, 0.05 + 0.1 * slotOn, 0.06 + 0.12 * slotOn);
    const lock = t > LOCK ? Math.exp(-3.5 * (t - LOCK)) : 0;
    redM.emissiveIntensity = 0.06 + 0.5 * lock + 0.25 * Math.exp(-4 * Math.max(0, t - TICK[4] - DRAW)) * (t > TICK[4] + DRAW ? 1 : 0);
    specGlow.material.opacity = 0.18 * clamp(r) + 0.5 * lock;
    lockL.intensity = 2.2 * lock;
    const lr = k(t, LOCK, LOCK + 0.7);
    lockRing.scale.set(0.45 + 0.5 * eo(lr), 0.16 + 0.22 * eo(lr), 1); lockRing.material.opacity = 0.9 * Math.sin(Math.PI * lr) * (lr > 0 ? 1 : 0);
    const gi = back(k(t, RISE[1] - 0.1, RISE[1] + 0.35));
    guide.position.set(SPEC.x - BW / 2 + guide.geometry.parameters.width / 2 * clamp(gi), spec.position.y + BH / 2 + 0.07, SPEC.z);
    guide.scale.setScalar(Math.max(0.001, clamp(gi)));
    guide.material.opacity = clamp(gi) * (1 - eo(k(t, 9.2, 9.5))); guide.visible = gi > 0.01;
    guide.rotation.copy(spec.rotation);

    // Redlines: the width line, then the height line, each with its extension lines and end ticks.
    const wl = eio(k(t, W_LINE[0], W_LINE[1])), hl = eio(k(t, H_LINE[0], H_LINE[1]));
    const ext = [eo(k(t, W_LINE[0] - 0.15, W_LINE[0] + 0.05)), eo(k(t, H_LINE[0] - 0.15, H_LINE[0] + 0.05))];
    const fadeL = 1 - 0.55 * eo(k(t, 5.0, 5.6));
    LN.forEach(([cx, cy, len, vert], i) => {
      let s = 1, x = cx, y = cy;
      if (i === 0) { s = wl; x = cx - (len / 2) * (1 - wl); }
      else if (i === 1) { s = hl; y = cy + (len / 2) * (1 - hl); }
      else if (i < 4) s = ext[0];
      else if (i < 6) s = ext[1];
      else if (i < 8) s = back(k(t, W_LINE[1] - 0.05, W_LINE[1] + 0.2));
      else s = back(k(t, H_LINE[1] - 0.05, H_LINE[1] + 0.2));
      const L0 = Math.max(0.0001, len * s), th = 0.005;
      m4.compose(p4.set(x, y, 0), q4.identity(), s4.set(vert ? th : L0, vert ? L0 : th, 1));
      lineI.setMatrixAt(i, m4);
    });
    lineI.instanceMatrix.needsUpdate = true;
    lineM.color.setHex(LASER).multiplyScalar(1.4 * fadeL);
    lineI.visible = t > W_LINE[0] - 0.2;
    const drawingW = t > W_LINE[0] && t < W_LINE[1], drawingH = t > H_LINE[0] && t < H_LINE[1];
    if (drawingW) laser.position.set(-BW / 2 + BW * wl, -0.21, BDp / 2 + 0.02);
    else if (drawingH) laser.position.set(BW / 2 + 0.12, BH / 2 - BH * hl, BDp / 2 + 0.02);
    laser.material.opacity = drawingW || drawingH ? 1 : 0;
    laser.scale.setScalar(0.08 + 0.02 * Math.sin(t * 60));
    const dw = back(k(t, W_LINE[1] - 0.05, W_LINE[1] + 0.3)), dh = back(k(t, H_LINE[1] - 0.05, H_LINE[1] + 0.3));
    dimW.scale.setScalar(Math.max(0.001, dw)); dimW.material.opacity = clamp(dw) * fadeL; dimW.visible = dw > 0.01;
    dimH.scale.setScalar(Math.max(0.001, dh)); dimH.material.opacity = clamp(dh) * fadeL; dimH.visible = dh > 0.01;

    // ---- Beat 3: the hand ticks through the operating procedure.
    updateSheet(t);
    tipAt(t, tip);
    hand.position.copy(tip);
    const scribble = TICK.reduce((a, t0) => a + Math.sin(Math.PI * k(t, t0, t0 + DRAW)), 0);
    hand.rotation.set(0.05 * scribble, -0.04 * scribble, 0.06 * Math.sin(t * 1.3) + 0.08 * scribble);
    hand.visible = t > 4.7 && t < 8.2;
    tickGlows.forEach((g, i) => { const a = k(t, TICK[i] + DRAW * 0.8, TICK[i] + DRAW + 0.6); g.material.opacity = 0.9 * Math.sin(Math.PI * a) * (a > 0 ? 1 : 0); g.scale.setScalar(0.12 + 0.12 * eo(a)); });

    // ---- Payoff: the four ghosts rise back as copies of the specified button.
    for (let i = 0; i < OLD.length; i++) {
      const o = OLD[i], c0 = UNIFY + 0.12 + i * 0.12;
      const u = back(k(t, c0, c0 + 0.5)), uc = clamp(u);
      const s = 0.55 * Math.max(0.001, u);
      p4.set(o.x, lerp(o.y - 0.1, o.y, uc) + Math.sin(t * 1.4 + i) * 0.005 * uc, lerp(GHOST_Z, -0.5, uc));
      q4.setFromAxisAngle(Y, 0.04 * Math.sin(t * 0.7 + i));
      m4.compose(p4, q4, s4.set(s, s, s)); copyI.setMatrixAt(i, m4);
      p4.z += (BDp / 2 + 0.002) * s; m4.compose(p4, q4, s4.set(s, s, 1)); copyWordI.setMatrixAt(i, m4);
      const gl = copyGlows[i]; gl.position.set(o.x, p4.y, p4.z - 0.05); gl.scale.set(0.9 * s / 0.55, 0.4 * s / 0.55, 1);
      gl.material.opacity = 0.8 * Math.exp(-3 * Math.max(0, t - c0 - 0.2)) * (t > c0 ? 1 : 0) * uc + 0.12 * uc;
    }
    copyI.instanceMatrix.needsUpdate = true; copyWordI.instanceMatrix.needsUpdate = true;
    copyI.visible = copyWordI.visible = t > UNIFY + 0.1;

    // The light table breathes a little brighter as the system comes together.
    tableM.emissiveIntensity = 0.4 + 0.08 * eo(k(t, UNIFY, UNIFY + 1)) + 0.05 * lock;
    up.intensity = 1.3 + 1.2 * lock;

    // ---- Title.
    const ci = back(k(t, 8.3, 8.8)), ti = back(k(t, 8.45, 9.0)), out = ei(k(t, 9.25, 9.6));
    title.position.set(-0.1, 0.95 + (1 - clamp(ti)) * -0.05, -0.75);
    faceCam(title);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    const off = TWd / 2 - CWd / 2 - 0.01;
    client.position.set(title.position.x - off * Math.cos(title.rotation.y), 1.08 + (1 - clamp(ci)) * -0.04, title.position.z + off * Math.sin(title.rotation.y));
    client.rotation.copy(title.rotation);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.3 + rnd(i, 91) * 2.6 + Math.sin(t * 0.3 + i) * 0.06;
      dpos[i * 3 + 1] = 0.05 + rnd(i, 92) * 1.0 + Math.sin(t * 0.4 + i * 1.3) * 0.04;
      dpos[i * 3 + 2] = -0.8 + rnd(i, 93) * 1.4 + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 7.6 };
}
