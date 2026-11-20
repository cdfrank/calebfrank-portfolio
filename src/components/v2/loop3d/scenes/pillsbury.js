// General Mills Pillsbury pitch lit loop, 10 s. "Walk the baking journey, find the openings, stamp the pitch."
// A home kitchen at night: deep green tile, a long butcher-block island under four brass pendants, a
// window going blue behind. The island is laid out as the baking journey, one station per step, each
// with a brass plaque on its front. A baker walks it: taps through a recipe on a tablet (PLAN), lifts a
// tube of dough out of a grocery bag (SHOP), holds a tray of crescents while they rise and turn golden
// (BAKE), and slides a plate across to a guest whose hand reaches in and takes one (SHARE). Each pendant
// lights as she arrives, each plaque checks off as she finishes and a glowing line runs station to
// station. Three opportunity pins drop between the steps, she grabs a stamp and slams PITCH onto the
// journey folder, then looks up as the title settles over the tile.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const BLUE = '#1d4f91', INK = '#c0352b', BRASS = 0xc8a050, GOLD = '#c98a3e';
const STEPS = ['PLAN', 'SHOP', 'BAKE', 'SHARE'];
const XS = [-1.2, -0.4, 0.45, 1.2];              // station centres along the island
const TOP = 0.92;                                 // island worktop height
const PZ = -0.68;                                 // the baker's walking line behind the island
// When she arrives at each station (its pendant comes on) and when the step is done (its plaque checks).
const ARRIVE = [0.35, 2.1, 3.55, 5.1];
const DONE = [1.42, 2.95, 4.45, 6.0];
// Walks between stations: [start, end, from x, to x, strides].
const WALKS = [[1.5, 2.2, XS[0], XS[1], 1], [2.95, 3.65, XS[1], XS[2], 1], [4.5, 5.2, XS[2], XS[3], 1], [6.15, 6.95, XS[3], 0, 2]];
const PINS_X = [-0.78, 0.02, 0.8], PIN_T = [6.38, 6.53, 6.68];
const SLAM = 7.38;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);
const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));
const es = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));

// A stylized person built from capsules, posed entirely from inputs each frame (after farxiga.js).
function makePerson(scene, o) {
  const bone = (r, len, m) => { const b = mesh(new THREE.CapsuleGeometry(r, len, 4, 12), m); scene.add(b); return b; };
  const LT = 0.44, LS = 0.43, LU = 0.29, LF = 0.27;
  const p = {
    pelvis: bone(0.1, 0.12, o.pants),
    torso: bone(o.chestR, 0.3, o.top),
    neck: bone(0.042, 0.05, o.skin),
    head: mesh(new THREE.SphereGeometry(0.102, 28, 20), o.skin),
    nose: mesh(new THREE.SphereGeometry(0.018, 10, 8), o.skin),
    hair: mesh(new THREE.SphereGeometry(0.109, 28, 14, 0, Math.PI * 2, 0, Math.PI * o.hairCap), o.hairM),
    ua: [bone(0.05, 0.21, o.sleeve), bone(0.05, 0.21, o.sleeve)],
    fa: [bone(0.042, 0.2, o.fore), bone(0.042, 0.2, o.fore)],
    hand: [0, 1].map(() => { const h = mesh(new THREE.SphereGeometry(0.04, 14, 10), o.skin); h.scale.set(0.8, 1.15, 1); scene.add(h); return h; }),
    th: [bone(0.07, 0.34, o.pants), bone(0.07, 0.34, o.pants)],
    sh: [bone(0.056, 0.34, o.pants), bone(0.056, 0.34, o.pants)],
    shoe: [0, 1].map(() => { const s = mesh(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.03), o.shoeM); scene.add(s); return s; }),
    extra: [],
  };
  [p.head, p.nose, p.hair].forEach((m) => scene.add(m));
  if (o.bun) { p.bun = mesh(new THREE.SphereGeometry(0.058, 16, 12), o.hairM); scene.add(p.bun); }
  const va = V(0, 0, 0), vb = V(0, 0, 0), vc = V(0, 0, 0), vd = V(0, 0, 0);
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, vd.subVectors(b, a).normalize()); };
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.min(dv.length(), l1 + l2 - 0.001); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0), lookD = V(0, 0, 0);
  p.shoulder = [V(0, 0, 0), V(0, 0, 0)];
  p.headPos = V(0, 0, 0);
  p.pose = ({ hip, yaw, lean, feet, hands, look, nod = 0, kneePole }) => {
    fwdOf(yaw, F); sideOf(yaw, S);
    place(p.pelvis, va.copy(hip).addScaledVector(S, -0.08), vb.copy(hip).addScaledVector(S, 0.08));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      hipI.copy(hip).addScaledVector(S, sg * 0.1);
      feet(i, ank);
      pole.copy(kneePole || F).addScaledVector(S, sg * 0.08);
      ik(hipI, ank, LT, LS, pole, jnt);
      place(p.th[i], hipI, jnt); place(p.sh[i], jnt, ank);
      p.shoe[i].position.copy(ank).addScaledVector(F, 0.05); p.shoe[i].position.y = Math.max(0.038, ank.y - 0.045);
      p.shoe[i].rotation.set(0, yaw, 0);
    }
    Dn.copy(F).multiplyScalar(lean).add(Y).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    place(p.torso, va.copy(hip).addScaledVector(Dn, 0.1), top);
    for (const e of p.extra) e(hip, top, F, S, Dn);
    p.headPos.copy(top).addScaledVector(Dn, 0.16).addScaledVector(F, 0.015);
    place(p.neck, top, p.headPos);
    lookD.subVectors(look, p.headPos); lookD.y = clamp(lookD.y / Math.max(0.01, Math.hypot(lookD.x, lookD.z)), -0.9, 0.5) * Math.hypot(lookD.x, lookD.z);
    lookD.normalize(); lookD.y -= nod; lookD.normalize();
    p.headPos.addScaledVector(lookD, 0.012);
    p.head.position.copy(p.headPos);
    p.nose.position.copy(p.headPos).addScaledVector(lookD, 0.098);
    p.hair.position.copy(p.headPos).addScaledVector(lookD, -0.014).add(vb.set(0, 0.012, 0));
    p.hair.quaternion.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lookD, -0.4).normalize());
    if (p.bun) p.bun.position.copy(p.headPos).addScaledVector(lookD, -0.1).add(vb.set(0, 0.03, 0));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      const sh = p.shoulder[i].copy(top).addScaledVector(Dn, -0.04).addScaledVector(S, sg * 0.19);
      hands(i, sh, wr);
      pole.copy(Y).multiplyScalar(-1).addScaledVector(S, sg * 0.7).addScaledVector(F, -0.35);
      ik(sh, wr, LU, LF, pole, jnt);
      place(p.ua[i], sh, jnt); place(p.fa[i], jnt, wr);
      p.hand[i].position.copy(wr).addScaledVector(vb.subVectors(wr, jnt).normalize(), 0.035);
      p.hand[i].quaternion.setFromUnitVectors(Y, vb);
    }
  };
  return p;
}

// Where the baker stands along the island at time t, and how much she is walking.
function walkAt(t) {
  let x = XS[0], w = 0, dir = 0, ph = 0, amp = 0;
  for (const [t0, t1, a, b, n] of WALKS) {
    if (t >= t1) { x = b; continue; }
    if (t > t0) {
      const u = (t - t0) / (t1 - t0), e = es(u);
      x = lerp(a, b, e); w = Math.sin(Math.PI * u); dir = Math.sign(b - a);
      ph = e * n * Math.PI * 2; amp = Math.abs(b - a) / n / (2 * Math.PI);
    }
    break;
  }
  return { x, w, dir, ph, amp };
}

// A brass plaque for one step: icon ring that fills, a check once done.
function drawPlaque(c, w, h, name, fill) {
  const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#d9b871'); g.addColorStop(0.5, '#b8924a'); g.addColorStop(1, '#8a6a32');
  c.fillStyle = g; roundRect(c, 0, 0, w, h, 18); c.fill();
  c.strokeStyle = 'rgba(60,40,10,0.6)'; c.lineWidth = 4; roundRect(c, 6, 6, w - 12, h - 12, 14); c.stroke();
  const cx = 72, cy = h / 2;
  c.fillStyle = '#2a2015'; c.beginPath(); c.arc(cx, cy, 44, 0, 7); c.fill();
  if (fill > 0) {
    c.strokeStyle = '#ffd88a'; c.lineWidth = 10; c.lineCap = 'round';
    c.beginPath(); c.arc(cx, cy, 36, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(fill)); c.stroke();
  }
  if (fill >= 1) {
    c.strokeStyle = '#ffe2a6'; c.lineWidth = 9; c.lineJoin = 'round';
    c.beginPath(); c.moveTo(cx - 17, cy + 1); c.lineTo(cx - 5, cy + 13); c.lineTo(cx + 18, cy - 12); c.stroke();
  }
  c.fillStyle = '#2a2015'; c.font = `800 62px ${SANS}`; c.textBaseline = 'middle'; c.fillText(name, 138, cy + 4);
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b1412);
  scene.fog = new THREE.Fog(0x0b1412, 5, 12);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 30);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), e4 = new THREE.Euler();

  // ----------------------------------------------------------- the kitchen
  const floor = mesh(new THREE.PlaneGeometry(10, 8), std(0xffffff, { map: grainTex('#33241a', { size: 256, speck: 0.08, blot: 0.12, seed: 3, repeat: 5 }), roughness: 0.45, metalness: 0.05 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 1); scene.add(floor);
  const tile = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#123430'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 8; r++) for (let q = -1; q < 5; q++) {
      const x = q * 128 + (r % 2) * 64, y = r * 64, v = rnd(r * 9 + q, 2);
      const g = c.createLinearGradient(0, y, 0, y + 64); g.addColorStop(0, `hsl(170, 38%, ${22 + v * 6}%)`); g.addColorStop(1, `hsl(170, 40%, ${16 + v * 5}%)`);
      c.fillStyle = g; roundRect(c, x + 3, y + 3, 122, 58, 8); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(c, x + 8, y + 6, 112, 8, 4); c.fill();
    }
  }).tex;
  tile.wrapS = tile.wrapT = THREE.RepeatWrapping; tile.repeat.set(12, 5);
  const wall = mesh(new THREE.PlaneGeometry(8, 3.4), std(0xffffff, { map: tile, roughness: 0.22, metalness: 0.05 }), { cast: false });
  wall.position.set(0, 1.7, -1.62); scene.add(wall);
  // The window over the back counter, night going blue outside.
  const winTex = canvasTex(256, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#0d1a36'); g.addColorStop(0.7, '#27406e'); g.addColorStop(1, '#4b5f8a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,240,210,0.9)'; c.beginPath(); c.arc(w * 0.72, h * 0.28, 14, 0, 7); c.fill();
    c.fillStyle = '#0a1220'; for (let i = 0; i < 9; i++) c.fillRect(i * 30, h * 0.78 - rnd(i, 4) * 40, 26, 80);
  }).tex;
  const win = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.05), new THREE.MeshBasicMaterial({ map: winTex, toneMapped: false, color: 0x9aa6c0 }));
  win.position.set(2.2, 1.72, -1.6); scene.add(win);
  const sashM = std(0xd8cdb4, { roughness: 0.7 });
  // Box pieces baked into one geometry so a frame or a bag costs one draw call.
  const boxes = (list) => mergeGeometries(list.map(([x, y, z, w, h, d]) => new THREE.BoxGeometry(w, h, d).translate(x, y, z)));
  scene.add(mesh(boxes([[2.2, 1.72, -1.58, 1.1, 0.05, 0.05], [2.2, 1.72, -1.58, 0.05, 1.1, 0.05], [2.2, 2.27, -1.58, 1.1, 0.06, 0.05], [2.2, 1.17, -1.58, 1.16, 0.08, 0.05], [1.67, 1.72, -1.58, 0.06, 1.12, 0.05], [2.73, 1.72, -1.58, 0.06, 1.12, 0.05]]), sashM));
  const winGlow = glow(0x6f8fd0, 1, 0.22, 0.5); winGlow.scale.set(1.8, 1.8, 1); winGlow.position.set(2.2, 1.72, -1.5); scene.add(winGlow);
  // Back counter and open shelves of jars.
  const cabM = std(0xb9ae95, { roughness: 0.7 });
  const blockTex = canvasTex(512, 128, (c, w, h) => {
    for (let i = 0; i < 16; i++) { c.fillStyle = `rgb(${150 + rnd(i, 1) * 40},${96 + rnd(i, 2) * 30},${52 + rnd(i, 3) * 20})`; c.fillRect(i * w / 16, 0, w / 16, h); c.fillStyle = 'rgba(60,30,10,0.4)'; c.fillRect(i * w / 16, 0, 1.5, h); }
    for (let i = 0; i < 1600; i++) { c.fillStyle = `rgba(60,30,10,${rnd(i, 5) * 0.12})`; c.fillRect(rnd(i, 6) * w, rnd(i, 7) * h, 1, 3 + rnd(i, 8) * 8); }
  }).tex;
  blockTex.wrapS = THREE.RepeatWrapping;
  const backBase = mesh(new THREE.BoxGeometry(6, 0.88, 0.58), cabM); backBase.position.set(0, 0.44, -1.32); scene.add(backBase);
  const backTop = mesh(new THREE.BoxGeometry(6.04, 0.05, 0.62), std(0x3a3f3c, { roughness: 0.3, metalness: 0.1 })); backTop.position.set(0, 0.905, -1.31); scene.add(backTop);
  const shelfM = std(0x6b4a2e, { roughness: 0.6 });
  scene.add(mesh(boxes([[-0.9, 1.62, -1.49, 2.6, 0.04, 0.24], [-0.9, 2.06, -1.49, 2.6, 0.04, 0.24]]), shelfM));
  const JN = 14;
  const jars = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 16), new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.1, transmission: 0, metalness: 0.1, clearcoat: 1 }), JN);
  const jc = new THREE.Color();
  for (let i = 0; i < JN; i++) {
    const row = i < 7 ? 0 : 1, x = -2.05 + (i % 7) * 0.37 + rnd(i, 3) * 0.05, s = 0.8 + rnd(i, 4) * 0.5;
    m4.compose(p4.set(x, [1.64, 2.08][row] + 0.09 * s, -1.49), q4.identity(), s4.set(1, s, 1)); jars.setMatrixAt(i, m4);
    jars.setColorAt(i, jc.setHSL([0.08, 0.1, 0.04, 0.13][i % 4], 0.45, 0.3 + rnd(i, 5) * 0.2));
  }
  jars.castShadow = true; scene.add(jars);

  // The island: butcher block top over cream cabinets.
  blockTex.repeat.set(3, 1);
  const island = mesh(new RoundedBoxGeometry(3.4, 0.06, 0.95, 2, 0.012), std(0xffffff, { map: blockTex, roughness: 0.55 }));
  island.position.set(0, TOP - 0.03, 0); scene.add(island);
  const cabFront = canvasTex(1024, 256, (c, w, h) => {
    c.fillStyle = '#c4b79b'; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 6; i++) {
      const x = 14 + i * (w - 28) / 6;
      c.strokeStyle = 'rgba(70,55,30,0.35)'; c.lineWidth = 3; roundRect(c, x + 8, 70, (w - 28) / 6 - 16, h - 84, 6); c.stroke();
      c.strokeStyle = 'rgba(255,255,255,0.18)'; roundRect(c, x + 18, 80, (w - 28) / 6 - 36, h - 104, 4); c.stroke();
    }
  }).tex;
  const cab = mesh(new THREE.BoxGeometry(3.3, 0.86, 0.85), [cabM, cabM, cabM, cabM, std(0xffffff, { map: cabFront, roughness: 0.7 }), cabM]);
  cab.position.set(0, 0.43, 0); scene.add(cab);
  const kick = mesh(new THREE.BoxGeometry(3.22, 0.08, 0.8), std(0x1e1a16, { roughness: 0.8 })); kick.position.set(0, 0.04, 0.02); scene.add(kick);

  // Plaques and the journey line along the island front.
  const PLW = 0.42, PLH = 0.16, FZ = 0.426;
  const plaques = STEPS.map((name, i) => {
    const ct = canvasTex(384, 146);
    const m = mesh(new THREE.PlaneGeometry(PLW, PLH), new THREE.MeshStandardMaterial({ map: ct.tex, emissiveMap: ct.tex, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.35, metalness: 0.6 }), { cast: false });
    m.position.set(XS[i], 0.76, FZ + 0.004); scene.add(m);
    return { ct, m, name, key: '' };
  });
  const LINE_Y = 0.64;
  const groove = mesh(new THREE.BoxGeometry(XS[3] - XS[0] + 0.04, 0.024, 0.01), std(0x2a2015, { roughness: 0.5 }), { cast: false });
  groove.position.set((XS[0] + XS[3]) / 2, LINE_Y, FZ + 0.004); scene.add(groove);
  const lineG = new THREE.BoxGeometry(1, 0.014, 0.012); lineG.translate(0.5, 0, 0);
  const lineFill = new THREE.Mesh(lineG, new THREE.MeshBasicMaterial({ color: 0xffc56a, toneMapped: false })); lineFill.position.set(XS[0], LINE_Y, FZ + 0.008); scene.add(lineFill);
  const lineHead = glow(0xffb850, 0.22, 0, 0.4); scene.add(lineHead);
  const nodes = new THREE.InstancedMesh(new THREE.CircleGeometry(0.022, 20), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), XS.length);
  nodes.frustumCulled = false; scene.add(nodes);
  const nodeC = new THREE.Color();

  // Four brass pendants, one over each station.
  const shadeG = new THREE.SphereGeometry(0.17, 28, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const brassM = std(BRASS, { metalness: 0.9, roughness: 0.3, side: THREE.DoubleSide });
  const pend = XS.map((x) => {
    const g = new THREE.Group(); g.position.set(x, 2.32, -0.08); scene.add(g);
    g.add(mesh(shadeG, brassM, { cast: false, receive: false }));
    const bulbM = new THREE.MeshBasicMaterial({ color: 0x1a1612, toneMapped: false });
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 10), bulbM); bulb.position.y = 0.0; g.add(bulb);
    const gl = glow(0xffc27a, 0.9, 0, 0.35); gl.position.y = -0.05; g.add(gl);
    const light = new THREE.PointLight(0xffc888, 0, 3.2, 1.8); light.position.y = -0.08; g.add(light);
    return { bulbM, gl, light };
  });

  scene.add(mesh(mergeGeometries(XS.map((x) => new THREE.CylinderGeometry(0.005, 0.005, 1.4, 6).translate(x, 3.17, -0.08))), std(0x111111), { cast: false }));

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x5f6a62, 0x160f0a, 0.3));
  const key = new THREE.SpotLight(0xffd6a8, 16, 0, 0.6, 0.7, 1.3);
  key.position.set(-1.9, 3.1, 2.3); key.target.position.set(0.1, 0.9, -0.3);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536); key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 1; key.shadow.camera.far = 8;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7aa0ff, 1.15); rim.position.set(2.6, 2.4, -3); scene.add(rim);

  // ----------------------------------------------------------- PLAN: a recipe on a tablet
  const tab = phone({ w: 0.34, h: 0.235, d: 0.012, frame: 0x2a2d33, notch: false, r: 0.02 });
  tab.position.set(XS[0], TOP + 0.1, -0.2); tab.rotation.x = -0.95; scene.add(tab); tab.updateMatrixWorld();
  const standM = mesh(new THREE.BoxGeometry(0.16, 0.12, 0.012), std(0x2a2d33, { roughness: 0.5, metalness: 0.6 })); standM.position.set(XS[0], TOP + 0.05, -0.27); standM.rotation.x = 0.5; scene.add(standM);
  const { sw: tsw, sh: tsh } = tab.userData;
  const tui = canvasTex(512, Math.round(512 * tsh / tsw));
  tab.userData.screen.material.map = tui.tex; tab.userData.screen.material.needsUpdate = true;
  const tabGlow = glow(0xbfd4ff, 1, 0, 0.5); tabGlow.scale.set(0.6, 0.45, 1); tabGlow.position.z = 0.03; tab.add(tabGlow);
  const TAPS = [0.92, 1.1, 1.28];
  const ROW_Y = (r) => 110 + r * 62;
  let tabKey = '';
  const drawTab = (t) => {
    const ticks = TAPS.map((tt) => eo(k(t, tt + 0.04, tt + 0.2)));
    const key2 = ticks.map((x) => Math.round(x * 12)).join(',');
    if (key2 === tabKey) return; tabKey = key2;
    tui.redraw((c, w, h) => {
      c.fillStyle = '#f2ebdd'; c.fillRect(0, 0, w, h);
      c.fillStyle = BLUE; c.fillRect(0, 0, w, 70);
      c.fillStyle = '#f2ebdd'; c.font = `800 40px ${SANS}`; c.textBaseline = 'middle'; c.fillText('PLAN', 24, 37);
      // A crescent in the corner of the recipe.
      c.fillStyle = GOLD; c.beginPath(); c.arc(w - 70, 160, 46, 0.6, Math.PI * 2 - 0.6); c.arc(w - 50, 150, 30, Math.PI * 2 - 0.9, 0.9, true); c.fill();
      for (let r = 0; r < 3; r++) {
        const y = ROW_Y(r), tk = ticks[r];
        c.strokeStyle = BLUE; c.lineWidth = 4; roundRect(c, 24, y - 18, 36, 36, 8); c.stroke();
        if (tk > 0) { c.fillStyle = BLUE; roundRect(c, 24, y - 18, 36, 36, 8); c.fill(); c.strokeStyle = '#f2ebdd'; c.lineWidth = 5; c.lineJoin = 'round'; c.beginPath(); c.moveTo(32, y); c.lineTo(32 + 8 * Math.min(1, tk * 2), y + 8 * Math.min(1, tk * 2)); if (tk > 0.5) c.lineTo(40 + 14 * (tk - 0.5) * 2, y + 8 - 18 * (tk - 0.5) * 2); c.stroke(); }
        c.fillStyle = tk > 0.5 ? 'rgba(29,79,145,0.35)' : '#3a3f4a'; roundRect(c, 78, y - 8, 200 + rnd(r, 9) * 90, 16, 8); c.fill();
      }
    });
  };

  // ----------------------------------------------------------- SHOP: a grocery bag and a tube of dough
  const kraft = std(0xffffff, { map: grainTex('#a77a4c', { size: 128, speck: 0.14, blot: 0.08, seed: 41 }), roughness: 0.92 });
  const BAG = V(XS[1] + 0.05, TOP, -0.24), BW = 0.26, BH = 0.3, BD = 0.17, BT = 0.006;
  const bag = new THREE.Group(); bag.position.copy(BAG); bag.rotation.y = -0.18; scene.add(bag);
  bag.add(mesh(boxes([[0, BT / 2, 0, BW, BT, BD], [0, BH / 2, BD / 2, BW, BH, BT], [0, BH / 2, -BD / 2, BW, BH, BT], [BW / 2, BH / 2, 0, BT, BH, BD], [-BW / 2, BH / 2, 0, BT, BH, BD]]), kraft));
  const sack = mesh(new RoundedBoxGeometry(0.13, 0.22, 0.08, 3, 0.02), std(0xcdbfa2, { roughness: 0.9 })); sack.position.set(0.05, 0.13, -0.02); sack.rotation.z = -0.1; bag.add(sack);
  const tubeTex = canvasTex(256, 128, (c, w, h) => {
    c.fillStyle = '#2a64b8'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(240,236,226,0.85)'; c.lineWidth = 9; for (let i = -4; i < 10; i++) { c.beginPath(); c.moveTo(i * 32, 0); c.lineTo(i * 32 + 60, h); c.stroke(); }
    c.fillStyle = '#f0ece2'; c.fillRect(0, h * 0.38, w, h * 0.24);
  }).tex;
  const tube = new THREE.Group(); scene.add(tube);
  const tubeB = mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.2, 24), std(0xffffff, { map: tubeTex, roughness: 0.35, metalness: 0.2 })); tube.add(tubeB);
  tube.add(mesh(mergeGeometries([-1, 1].map((s) => new THREE.CylinderGeometry(0.035, 0.035, 0.012, 24).translate(0, s * 0.104, 0))), std(0xb9bec6, { metalness: 1, roughness: 0.3 })));
  bag.updateMatrixWorld();
  const IN_BAG = bag.localToWorld(V(-0.06, 0.12, 0.01)), LIFT = V(XS[1] - 0.12, 1.42, -0.18), PLACED = V(XS[1] - 0.22, TOP + 0.1, -0.08);
  const tubeAt = (t, out) => {
    const a = es(k(t, 2.38, 2.66)), b = es(k(t, 2.66, 2.92));
    out.copy(IN_BAG).lerp(LIFT, a); out.y += Math.sin(Math.PI * a) * 0.05;
    out.lerp(PLACED, b); out.y += Math.sin(Math.PI * b) * 0.06;
    return out;
  };

  // ----------------------------------------------------------- BAKE: a tray of crescents that rise and brown
  const crescentG = new THREE.TorusGeometry(0.042, 0.02, 10, 22, Math.PI * 1.25);
  crescentG.rotateZ(-Math.PI * 0.125 - Math.PI / 2); crescentG.rotateX(-Math.PI / 2); crescentG.scale(1, 0.8, 1);
  const TRAY0 = V(XS[2], TOP + 0.008, -0.27), TRAY1 = V(XS[2], TOP + 0.008, -0.2);
  const tray = new THREE.Group(); scene.add(tray);
  tray.add(mesh(new RoundedBoxGeometry(0.44, 0.016, 0.3, 2, 0.006), std(0x8d9196, { metalness: 0.85, roughness: 0.38 })));
  const doughM = std(0xe6d6b2, { roughness: 0.65 });
  const DOUGH = new THREE.Color(0xe6d6b2), BAKED = new THREE.Color(0xc07e36);
  const rollsIM = new THREE.InstancedMesh(crescentG, doughM, 6);
  rollsIM.castShadow = true; tray.add(rollsIM);
  const ROLL_AT = [[-0.13, -0.07], [0, -0.07], [0.13, -0.07], [-0.13, 0.07], [0, 0.07], [0.13, 0.07]];
  const ovenL = new THREE.PointLight(0xff9a4a, 0, 1.4, 1.6); scene.add(ovenL);
  const ovenGlow = glow(0xff8a3a, 1, 0, 0.45); ovenGlow.scale.set(0.9, 0.5, 1); scene.add(ovenGlow);
  const steam = [0, 2, 4].map(() => { const s = glow(0xf2e6d4, 0.12, 0, 0.6); scene.add(s); return s; });

  // ----------------------------------------------------------- SHARE: a plate slides across to a guest
  const PLATE0 = V(XS[3], TOP + 0.012, -0.24), PLATE1 = V(XS[3] + 0.04, TOP + 0.012, 0.12);
  const plate = new THREE.Group(); scene.add(plate);
  plate.add(mesh(new THREE.CylinderGeometry(0.17, 0.12, 0.022, 40), std(0xd7d0c2, { roughness: 0.25, metalness: 0.05 })));
  const goldM = std(0xc07e36, { roughness: 0.55 });
  const plateRolls = new THREE.InstancedMesh(crescentG, goldM, 3);
  [[-0.06, 0.01, -0.04, 0.4], [0.06, 0.01, -0.03, -0.3], [0.0, 0.035, 0.0, 1.2]].forEach(([x, y, z, r], i) => { m4.compose(p4.set(x, y + 0.025, z), q4.setFromEuler(e4.set(0, r, 0)), s4.set(1.1, 1.1, 1.1)); plateRolls.setMatrixAt(i, m4); });
  plateRolls.castShadow = true; plate.add(plateRolls);
  const takeRoll = mesh(crescentG, goldM); takeRoll.scale.setScalar(1.1); scene.add(takeRoll);
  const TAKE_LOCAL = V(0.03, 0.04, 0.07);
  // The guest's arm reaches in from the right edge of frame.
  const gSkin = new THREE.MeshPhysicalMaterial({ color: 0x8a5a3e, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const gSleeve = std(0x7a3b4a, { roughness: 0.9 });
  const gFore = mesh(new THREE.CapsuleGeometry(0.038, 1, 4, 12), gSkin); scene.add(gFore);
  const gSleeveM = mesh(new THREE.CapsuleGeometry(0.055, 1, 4, 12), gSleeve); scene.add(gSleeveM);
  const gHand = mesh(new THREE.SphereGeometry(0.045, 14, 10), gSkin); gHand.scale.set(1.05, 0.7, 1.2); scene.add(gHand);

  // ----------------------------------------------------------- the journey folder, pins and the stamp
  const FOLD = V(0, TOP + 0.007, -0.13);
  const folder = mesh(new RoundedBoxGeometry(0.56, 0.012, 0.38, 2, 0.005), std(0xcfc3a6, { roughness: 0.8 })); folder.position.copy(FOLD); scene.add(folder);
  const cover = canvasTex(460, 320, (c, w, h) => {
    c.fillStyle = '#d6ccb2'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2a2f3a'; c.font = `800 30px ${MONO}`; c.textBaseline = 'middle'; c.fillText('BAKING JOURNEY', 26, 40);
    c.strokeStyle = 'rgba(42,47,58,0.5)'; c.lineWidth = 3; c.beginPath(); c.moveTo(60, 120); c.lineTo(w - 60, 120); c.stroke();
    for (let i = 0; i < 4; i++) { c.fillStyle = i < 4 ? BLUE : '#999'; c.beginPath(); c.arc(60 + i * (w - 120) / 3, 120, 15, 0, 7); c.fill(); }
    for (let i = 0; i < 4; i++) { c.fillStyle = 'rgba(42,47,58,0.35)'; roundRect(c, 26, 190 + i * 26, (w - 52) * (0.5 + rnd(i, 4) * 0.5), 9, 4.5); c.fill(); }
  }).tex;
  const coverM = mesh(new THREE.PlaneGeometry(0.54, 0.36), std(0xffffff, { map: cover, roughness: 0.75 }), { cast: false });
  coverM.rotation.x = -Math.PI / 2; coverM.position.copy(FOLD).add(V(0, 0.0065, 0)); scene.add(coverM);
  const inkTex = canvasTex(512, 200, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = INK; c.lineWidth = 14; roundRect(c, 12, 12, w - 24, h - 24, 22); c.stroke();
    c.fillStyle = INK; c.font = `900 128px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '10px';
    c.fillText('PITCH', w / 2 + 5, h / 2 + 6);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(0,0,0,${0.3 + rnd(i, 3) * 0.6})`; c.fillRect(rnd(i, 1) * w, rnd(i, 2) * h, 2 + rnd(i, 4) * 3, 2); }
  }).tex;
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.156), new THREE.MeshStandardMaterial({ map: inkTex, transparent: true, roughness: 0.6, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  ink.rotation.set(-Math.PI / 2, 0, 0.1); ink.position.copy(FOLD).add(V(0, 0.0075, 0.025)); scene.add(ink);
  // The stamp: a wide rubber face on a walnut block with a turned handle.
  const stamp = new THREE.Group(); scene.add(stamp);
  const rubber = mesh(new THREE.BoxGeometry(0.4, 0.016, 0.156), std(0x6e2420, { roughness: 0.7 })); rubber.position.y = 0.008; stamp.add(rubber);
  const blockM = mesh(new RoundedBoxGeometry(0.42, 0.05, 0.176, 2, 0.01), std(0x6b4128, { roughness: 0.45 })); blockM.position.y = 0.041; stamp.add(blockM);
  stamp.add(mesh(mergeGeometries([new THREE.CylinderGeometry(0.022, 0.03, 0.1, 18).translate(0, 0.116, 0), new THREE.SphereGeometry(0.042, 18, 12).translate(0, 0.18, 0)]), std(0x8a5a34, { roughness: 0.4 })));
  const KNOB = V(0, 0.18, 0);
  const STAMP_REST = V(-0.3, TOP, -0.36), STAMP_UP = V(-0.04, TOP + 0.36, -0.12), STAMP_DOWN = V(0, TOP + 0.013, -0.11);
  const stampAt = (t, out) => {
    const a = es(k(t, 6.98, 7.26)), b = ei(k(t, 7.28, SLAM)), c2 = es(k(t, 7.62, 7.9)), d2 = es(k(t, 7.9, 8.25));
    out.copy(STAMP_REST).lerp(STAMP_UP, a).lerp(STAMP_DOWN, b);
    out.lerp(STAMP_UP, c2 * 0.6).lerp(STAMP_REST, d2);
    return [0.25 * a * (1 - b) - 0.1 * c2 * (1 - d2), -0.15 * a * (1 - b)];
  };
  const puffRing = new THREE.Mesh(new THREE.RingGeometry(0.24, 0.28, 64), new THREE.MeshBasicMaterial({ color: 0xffe0b8, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  puffRing.rotation.x = -Math.PI / 2; puffRing.position.copy(FOLD).setY(TOP + 0.02); scene.add(puffRing);

  const pins = PINS_X.map((x, i) => {
    const g = new THREE.Group(); scene.add(g);
    const needle = mesh(new THREE.CylinderGeometry(0.004, 0.0015, 0.12, 8), std(0xc9ced3, { metalness: 1, roughness: 0.25 })); needle.position.y = 0.06; g.add(needle);
    const head = mesh(new THREE.SphereGeometry(0.045, 20, 14), new THREE.MeshPhysicalMaterial({ color: 0xc8352c, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.1 })); head.position.y = 0.15; g.add(head);
    const tag = label('OPPORTUNITY', { font: `800 56px ${MONO}`, fg: '#f6efe2', bg: 'rgba(32,24,18,0.88)', h: 0.13, pad: 26, track: 2 });
    tag.position.y = i === 1 ? 0.4 : 0.3; g.add(tag);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.05, 0.065, 40), new THREE.MeshBasicMaterial({ color: 0xffd28a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.set(x, TOP + 0.004, 0.3); scene.add(ring);
    return { g, tag, ring, x, t0: PIN_T[i] };
  });

  // ----------------------------------------------------------- the baker
  const skin = new THREE.MeshPhysicalMaterial({ color: 0xc98f6c, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const topM = std(0x2e4a7a, { roughness: 0.85 });
  const baker = makePerson(scene, { skin, top: topM, sleeve: topM, fore: skin, pants: std(0x2a2522, { roughness: 0.85 }), shoeM: std(0x1b1d20, { roughness: 0.5 }), hairM: std(0x3a2418, { roughness: 0.85 }), hairCap: 0.58, chestR: 0.14, bun: true });
  // Apron bib and neck strap ride on her torso.
  const apronM = std(0xd2c4a6, { roughness: 0.9, side: THREE.DoubleSide });
  const bib = mesh(new THREE.PlaneGeometry(0.2, 0.25), apronM, { cast: false }); scene.add(bib);
  const strap = mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20, Math.PI), apronM, { cast: false }); scene.add(strap);
  const mB = new THREE.Matrix4(), bx = V(0, 0, 0), by = V(0, 0, 0), bz = V(0, 0, 0);
  baker.extra.push((hip, top, F, S, Dn) => {
    bib.position.copy(top).addScaledVector(Dn, -0.17).addScaledVector(F, 0.142);
    bz.copy(F).addScaledVector(Dn, -0.1).normalize(); by.copy(Dn); bx.crossVectors(by, bz).normalize(); by.crossVectors(bz, bx);
    mB.makeBasis(bx, by, bz); bib.quaternion.setFromRotationMatrix(mB);
    strap.position.copy(top).addScaledVector(Dn, 0.02).addScaledVector(F, 0.03); strap.quaternion.setFromRotationMatrix(mB); strap.rotateX(-0.9);
  });

  // ----------------------------------------------------------- title
  const kicker = label('General Mills', { font: `700 56px ${MONO}`, fg: '#ffd28a', h: 0.1, track: 5 });
  const title = label('Pillsbury pitch', { font: `800 76px ${SANS}`, fg: '#f6efe2', h: 0.17, track: 1 });
  const line = label('UX strategy for a new business pitch', { font: `600 46px ${SANS}`, fg: '#e8d6b8', bg: 'rgba(10,22,20,0.72)', h: 0.1, pad: 24, track: 0 });
  [kicker, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });
  const FINAL = [V(-0.5, 2.0, 3.3), V(-0.62, 1.12, -0.3)];
  const finalCam = new THREE.PerspectiveCamera(38, 16 / 10, 0.05, 30);
  finalCam.position.copy(FINAL[0]); finalCam.lookAt(FINAL[1]); finalCam.updateMatrixWorld();
  const inView = (sx, sy, depth) => { const v = V(sx, sy, 0.5).unproject(finalCam).sub(finalCam.position).normalize(); return finalCam.position.clone().addScaledVector(v, depth); };
  const TPOS = inView(-0.26, 0.44, 2.5);
  const TW = title.geometry.parameters.width, KW = kicker.geometry.parameters.width, LW = line.geometry.parameters.width;

  // ----------------------------------------------------------- flour dust in the lamplight
  const DN = 130, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe2b8, size: 0.01, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-1.05, 1.64, 2.15]], [1.5, [-0.98, 1.62, 2.05], L],
    [2.2, [-0.36, 1.62, 2.15]], [2.95, [-0.31, 1.6, 2.05], L],
    [3.65, [0.42, 1.56, 1.95]], [4.5, [0.49, 1.54, 1.85], L],
    [5.2, [1.15, 1.6, 2.15]], [6.1, [1.1, 1.6, 2.05], L],
    [6.7, [0.15, 1.95, 3.3]], [7.25, [0.02, 2.2, 2.0]], [7.9, [0.0, 2.17, 1.92], L],
    [8.6, FINAL[0].toArray()], [10, FINAL[0].clone().add(V(-0.03, 0.01, 0.1)).toArray(), L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-1.15, 1.2, -0.3]], [1.5, [-1.12, 1.2, -0.3], L],
    [2.2, [-0.38, 1.22, -0.3]], [2.95, [-0.36, 1.22, -0.3], L],
    [3.65, [0.46, 1.16, -0.25]], [4.5, [0.47, 1.16, -0.25], L],
    [5.2, [1.28, 1.18, -0.1]], [6.1, [1.3, 1.18, -0.08], L],
    [6.7, [0.0, 1.05, -0.1]], [7.25, [0.0, 1.17, -0.2]], [7.9, [0.0, 1.17, -0.2], L],
    [8.6, FINAL[1].toArray()], [10, FINAL[1].toArray(), L],
  ]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), hip = V(0, 0, 0), F = V(0, 0, 0), S = V(0, 0, 0), look = V(0, 0, 0);
  const tubeP = V(0, 0, 0), stampP = V(0, 0, 0), lk = V(0, 0, 0), wr = V(0, 0, 0), el = V(0, 0, 0), dv = V(0, 0, 0), plateP = V(0, 0, 0);
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, dv.subVectors(b, a).normalize()); m.scale.set(1, 1, 1); };
  const stretch = (m, a, b, r0) => { place(m, a, b); const len = a.distanceTo(b); m.scale.set(1, (len + 2 * r0) / (1 + 2 * r0), 1); };

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    const slam = t > SLAM ? Math.exp(-12 * (t - SLAM)) : 0;
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004 - 0.012 * slam * Math.sin((t - SLAM) * 70), p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [6.1, 36], [6.7, 40], [7.25, 40], [7.9, 40], [8.6, 38], [10, 38]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Pendants come on as she arrives; plaques fill while she works and check off when done.
    pend.forEach((pd, i) => {
      const on = eo(k(t, ARRIVE[i], ARRIVE[i] + 0.35));
      const hot = i === 2 ? Math.sin(Math.PI * k(t, 3.75, 4.8)) * 0.4 : 0;
      pd.bulbM.color.setRGB(0.1 + 1.6 * on, 0.09 + (1.25 - 0.3 * hot) * on, 0.07 + (0.75 - 0.4 * hot) * on);
      pd.gl.material.opacity = 0.7 * on;
      pd.light.intensity = 1.6 * on + 0.8 * hot;
    });
    plaques.forEach((pl, i) => {
      const fill = clamp(k(t, ARRIVE[i] + 0.3, DONE[i]));
      const kk = String(Math.round(fill * 30));
      if (kk !== pl.key) { pl.key = kk; pl.ct.redraw((c, w, h) => drawPlaque(c, w, h, pl.name, fill)); }
      const pop = t > DONE[i] ? Math.exp(-4 * (t - DONE[i])) : 0;
      pl.m.material.emissiveIntensity = 0.12 * fill + 0.5 * pop;
      pl.m.scale.setScalar(1 + 0.08 * pop * Math.sin((t - DONE[i]) * 14 + 1.6));
    });
    const lineX = t < DONE[0] ? XS[0] : kf(t, [[DONE[0], XS[0]], [DONE[1], XS[1]], [DONE[2], XS[2]], [DONE[3], XS[3]]], eio);
    lineFill.scale.x = Math.max(0.001, lineX - XS[0]); lineFill.visible = lineX > XS[0] + 0.002;
    lineHead.position.set(lineX, LINE_Y, FZ + 0.03);
    lineHead.material.opacity = t > DONE[0] - 0.4 && t < DONE[3] + 0.6 ? 0.75 : 0.25 * (t > DONE[3] ? 1 : 0);
    XS.forEach((x, i) => {
      const on = t > DONE[i] ? 1 : 0, sc = 1 + 0.6 * (on ? Math.exp(-5 * (t - DONE[i])) : 0);
      m4.compose(p4.set(x, LINE_Y, FZ + 0.012), q4.identity(), s4.set(sc, sc, 1)); nodes.setMatrixAt(i, m4);
      nodes.setColorAt(i, nodeC.setRGB(0.35 + 0.85 * on, 0.26 + 0.68 * on, 0.12 + 0.2 * on));
    });
    nodes.instanceMatrix.needsUpdate = true; nodes.instanceColor.needsUpdate = true;

    // PLAN: the recipe ticks as she taps it.
    drawTab(t);
    tab.userData.screen.material.color.setScalar(0.78);
    tabGlow.material.opacity = 0.18;
    // SHOP: the tube travels from bag to counter.
    tubeAt(t, tubeP);
    tube.position.copy(tubeP);
    tube.rotation.set(0, 0, lerp(0.5, 0, es(k(t, 2.4, 2.9))));
    // BAKE: the tray slides into the warm light, the crescents rise and turn golden.
    const slide = es(k(t, 3.78, 4.08)), bake = eio(k(t, 3.9, 4.45));
    tray.position.copy(TRAY0).lerp(TRAY1, slide);
    doughM.color.copy(DOUGH).lerp(BAKED, bake);
    ROLL_AT.forEach(([x, z], i) => {
      const rise = lerp(0.78, 1, back(k(t, 3.95 + i * 0.05, 4.4 + i * 0.05)));
      m4.compose(p4.set(x, 0.008 + 0.02 * rise, z), q4.setFromEuler(e4.set(0, (rnd(i, 7) - 0.5) * 0.6 + (i % 2) * Math.PI, 0)), s4.set(rise, rise * lerp(0.85, 1.15, bake), rise));
      rollsIM.setMatrixAt(i, m4);
    });
    rollsIM.instanceMatrix.needsUpdate = true;
    const ovenOn = Math.sin(Math.PI * k(t, 3.8, 4.9));
    ovenL.position.copy(tray.position).add(tmp.set(0, 0.12, 0.05)); ovenL.intensity = 2.2 * ovenOn;
    ovenGlow.position.copy(tray.position).add(tmp.set(0, 0.04, 0.02)); ovenGlow.material.opacity = 0.45 * ovenOn;
    steam.forEach((s, j) => {
      const i = j * 2, u = ((t - 4.0) * 0.8 + j * 0.33) % 1;
      s.position.copy(tray.position).add(tmp.set(ROLL_AT[i][0] + Math.sin(t * 2 + i) * 0.02, 0.06 + u * 0.35, ROLL_AT[i][1]));
      s.scale.setScalar(0.06 + u * 0.14);
      s.material.opacity = t > 4.0 ? 0.35 * Math.sin(Math.PI * u) * (1 - k(t, 5.0, 5.6)) : 0;
    });
    // SHARE: the plate slides across; the guest takes one.
    const push = es(k(t, 5.36, 5.78));
    plate.position.copy(PLATE0).lerp(PLATE1, push); plate.rotation.y = 0.3 * push;
    plate.updateMatrixWorld();
    plateP.copy(TAKE_LOCAL); plate.localToWorld(plateP);
    const reach = es(k(t, 5.55, 5.96)), grabbed = t > 5.98, away = es(k(t, 6.0, 6.55));
    const OFF = tmp2.set(2.55, 1.45, 1.55);
    wr.copy(OFF).lerp(tmp.copy(plateP).add(V(0.0, 0.045, 0.02)), reach);
    if (grabbed) { wr.lerp(tmp.set(1.95, 1.5, 1.05), away); wr.lerp(OFF, eio(k(t, 6.45, 6.85))); }
    const showArm = t > 5.5 && t < 6.85;
    [gFore, gSleeveM, gHand].forEach((m) => { m.visible = showArm; });
    if (showArm) {
      const back2 = dv.copy(OFF).sub(wr).normalize();
      el.copy(wr).addScaledVector(back2, 0.24); el.y += 0.03;
      stretch(gFore, wr, el, 0.038);
      stretch(gSleeveM, el, tmp.copy(el).addScaledVector(dv.copy(OFF).sub(el).normalize(), 1.2), 0.055);
      gHand.position.copy(wr); gHand.lookAt(el);
    }
    if (grabbed) { takeRoll.position.copy(wr).add(tmp.set(0, -0.035, 0)); takeRoll.rotation.set(0.25 * away, 1.0, 0.2 * away); }
    else { takeRoll.position.copy(plateP); takeRoll.rotation.set(0, 0.3 * push + 1.0, 0); }
    takeRoll.visible = !grabbed || showArm;

    // Opportunity pins drop between the steps.
    pins.forEach((pn, i) => {
      const s = spring(k(t, pn.t0, pn.t0 + 0.75)), out = ei(k(t, 8.1, 8.4));
      pn.g.position.set(pn.x, TOP - 0.02 + (1 - s) * 1.8, 0.3);
      pn.g.rotation.set(0, 0, (1 - clamp(s)) * 0.3 + (t > pn.t0 + 0.2 ? 0.06 * Math.exp(-4 * (t - pn.t0 - 0.2)) * Math.sin((t - pn.t0) * 16) : 0));
      pn.g.visible = t > pn.t0;
      pn.tag.lookAt(camera.position);
      const ta = eo(k(t, pn.t0 + 0.3, pn.t0 + 0.6));
      pn.tag.material.opacity = ta * (1 - out); pn.tag.visible = ta > 0.01 && out < 0.99; pn.tag.scale.setScalar(0.7 + 0.3 * back(k(t, pn.t0 + 0.3, pn.t0 + 0.6)));
      const r = k(t, pn.t0 + 0.2, pn.t0 + 0.8);
      pn.ring.scale.setScalar(1 + 4 * eo(r)); pn.ring.material.opacity = 0.8 * (1 - r) * (r > 0 ? 1 : 0); pn.ring.visible = r > 0 && r < 1;
    });

    // PITCH: grab the stamp, wind up, slam it onto the journey folder.
    const [tilt, roll] = stampAt(t, stampP);
    stamp.position.copy(stampP); stamp.rotation.set(tilt, 0.05, roll);
    stamp.scale.set(1 + 0.06 * slam, 1 - 0.12 * slam, 1 + 0.06 * slam);
    const inked = t > SLAM ? 1 : 0;
    ink.material.opacity = inked * (1 - 0.15 * k(t, SLAM, SLAM + 1));
    ink.scale.setScalar(1 + 0.05 * slam);
    ink.visible = inked > 0;
    const pr = k(t, SLAM, SLAM + 0.7);
    puffRing.scale.setScalar(1 + 2.5 * eo(pr)); puffRing.material.opacity = 0.7 * (1 - pr) * (pr > 0 ? 1 : 0); puffRing.visible = pr > 0 && pr < 1;

    // ---- The baker.
    const wk = walkAt(t);
    const turn = wk.dir !== 0 ? clamp(wk.w * 2.2) : 0;
    const yaw = wk.dir * (Math.PI / 2) * turn;
    fwdOf(yaw, F); sideOf(yaw, S);
    const bob = 0.016 * Math.cos(wk.ph * 2) * wk.w;
    const breathe = Math.sin(t * 1.8) * 0.004;
    // Which action her hands are doing, and how fully.
    const aPlan = es(k(t, 0.45, 0.75)) * (1 - es(k(t, 1.38, 1.6)));
    const aShop = es(k(t, 2.15, 2.38)) * (1 - es(k(t, 2.92, 3.08)));
    const aBake = es(k(t, 3.62, 3.8)) * (1 - es(k(t, 4.45, 4.62)));
    const aShare = es(k(t, 5.18, 5.36)) * (1 - es(k(t, 5.8, 5.98)));
    const aStamp = es(k(t, 6.82, 6.98)) * (1 - es(k(t, 8.22, 8.4)));
    const reachL = Math.max(aPlan, aShop, aBake, aShare, aStamp);
    hip.set(wk.x + Math.sin(t * 0.9) * 0.008 * (1 - wk.w), 0.95 + bob + breathe - 0.03 * reachL, PZ);
    // Look: the work in hand, the guest, the pins, the folder, then up at us.
    if (t < 1.5) look.copy(tab.position);
    else if (t < 3.0) look.copy(t < 2.3 ? BAG : tubeP);
    else if (t < 4.5) look.copy(tray.position);
    else if (t < 6.1) look.copy(t < 5.6 ? plate.position : (showArm ? wr : plate.position));
    else if (t < 6.85) look.set(lerp(PINS_X[0], PINS_X[2], k(t, 6.4, 6.85)), TOP + 0.2, 0.3);
    else if (t < 8.3) look.copy(t < 7.0 ? STAMP_REST : FOLD);
    else look.copy(camera.position).lerp(tmp.set(0, 1.4, 1), 0.3);
    if (wk.w > 0.2) look.lerp(tmp.set(wk.x + wk.dir * 1.5, 1.5, PZ + 0.5), clamp((wk.w - 0.2) * 1.4));
    const nod = 0.25 * Math.sin(Math.PI * k(t, 8.35, 8.75)) + 0.12 * Math.sin(Math.PI * k(t, 5.95, 6.25));
    baker.pose({
      hip, yaw, lean: 0.14 + 0.16 * reachL + breathe * 2 + 0.06 * wk.w, look, nod,
      feet: (i, out) => {
        const sg = i ? 1 : -1, ph = wk.ph + i * Math.PI;
        out.set(wk.x, 0.085, PZ).addScaledVector(S, sg * 0.1).addScaledVector(F, wk.amp * Math.sin(ph) * wk.w);
        out.y += 0.09 * Math.max(0, Math.cos(ph)) * wk.w;
      },
      hands: (i, shp, out) => {
        const sg = i ? 1 : -1;
        const swing = -Math.sin(wk.ph + i * Math.PI) * wk.w;
        out.copy(shp).add(tmp.set(0, -0.5, 0)).addScaledVector(F, 0.07 + 0.14 * swing).addScaledVector(S, sg * 0.06);
        // Resting on the counter edge when nothing else is asked of this hand.
        tmp2.set(shp.x + sg * 0.05, TOP + 0.035, -0.42);
        out.lerp(tmp2, (1 - wk.w) * 0.55);
        let w = 0;
        if (aPlan > 0) {
          if (i === 0) {
            const r = t < TAPS[1] - 0.06 ? 0 : t < TAPS[2] - 0.06 ? 1 : 2;
            const press = Math.max(...TAPS.map((tt) => Math.sin(Math.PI * k(t, tt - 0.06, tt + 0.12))));
            tab.localToWorld(tmp2.set(-tsw / 2 + 0.035, tsh / 2 - (ROW_Y(r) / tui.cv.height) * tsh, 0.03 * (1 - press) + 0.012));
          } else tmp2.set(XS[0] + 0.22, TOP + 0.035, -0.4);
          w = aPlan;
        }
        if (aShop > 0) {
          if (i === 0) tmp2.copy(tubeP).add(tmp.set(0.0, 0.07 * es(k(t, 2.38, 2.5)) + 0.02, 0.03)).lerp(tmp.copy(IN_BAG).add(V(0, 0.18, 0.02)), 1 - es(k(t, 2.2, 2.38)));
          else tmp2.copy(BAG).add(tmp.set(0.12, 0.31, -0.02));
          w = aShop;
        }
        if (aBake > 0) { tmp2.copy(tray.position).add(tmp.set(sg * 0.235, 0.03, 0.02)); w = aBake; }
        if (aShare > 0) { tmp2.copy(plate.position).add(tmp.set(sg * 0.16, 0.03, -0.02)); tmp2.z = Math.min(tmp2.z, -0.2); w = aShare; }
        if (aStamp > 0) {
          if (i === 0) { stamp.updateMatrixWorld(); tmp2.copy(KNOB); stamp.localToWorld(tmp2).add(tmp.set(0, 0.03, 0)); }
          else tmp2.set(0.32, TOP + 0.035, -0.38);
          w = aStamp;
        }
        if (w > 0) out.lerp(tmp2, w);
      },
    });

    // Title over the tile once the stamp has landed.
    const ki = back(k(t, 8.35, 8.85)), ti = back(k(t, 8.5, 9.0)), li = eo(k(t, 8.7, 9.15)), out = ei(k(t, 9.25, 9.55));
    lk.copy(camera.position);
    title.position.set(TPOS.x, TPOS.y + (1 - clamp(ti)) * -0.05, TPOS.z); title.lookAt(lk);
    const right = tmp.set(1, 0, 0).applyQuaternion(title.quaternion);
    kicker.quaternion.copy(title.quaternion); line.quaternion.copy(title.quaternion);
    kicker.position.copy(title.position).addScaledVector(right, -(TW - KW) / 2).add(tmp2.set(0, 0.14 + (1 - clamp(ki)) * -0.03, 0));
    line.position.copy(title.position).addScaledVector(right, -(TW - LW) / 2).add(tmp2.set(0, -0.145 - (1 - li) * 0.03, 0));
    [[kicker, ki], [title, ti], [line, li]].forEach(([l, al]) => { l.material.opacity = clamp(al) * (1 - out); l.visible = l.material.opacity > 0.01; });

    // Flour dust turning in the lamplight.
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -1.8 + rnd(i, 51) * 3.6 + Math.sin(t * 0.3 + i) * 0.06;
      dpos[i * 3 + 1] = 1.0 + rnd(i, 52) * 1.3 + Math.sin(t * 0.4 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -0.6 + rnd(i, 53) * 1.0 + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 7.85 };
}
