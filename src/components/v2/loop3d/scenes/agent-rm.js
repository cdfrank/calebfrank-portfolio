// MRM Agent Relationship Management lit loop, 10 s. "Designing for the customer's AI."
// A warm greige infinity-cove studio. One ceramic brand pillar sends pulses across a crowd of clay
// figures, and each figure lights as a pulse reaches it. Then one customer sends out their own AI, an
// iridescent orb. Two more brands rise, the orb scans all three with a beam, chooses Brand B and says
// why. The losing pillars sink, live links join brand, AI and customer, and the ARM console rises with
// its four applications.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const FI = 'Inter, system-ui, sans-serif', FM = '"JetBrains Mono", ui-monospace, monospace';
const CORAL = 0xff5a4e, VIOLET = 0x7c5cff;
const PZ = -1.0;                                   // pillar row
const BRANDS = [
  { n: 'BRAND A', c: 0x2ec4b6, x: -1.15, h: 1.02 },
  { n: 'BRAND B', c: CORAL, x: 0, h: 1.3 },
  { n: 'BRAND C', c: 0xf5a623, x: 1.15, h: 0.94 },
];
const WAVES = [0.55, 1.0, 1.45, 1.9], WDUR = 1.45;  // brand pulses across the crowd
const SCAN = [4.35, 4.9, 5.45];                    // the AI checks A, B, C
const DECIDE = 6.0, ANSWER = 6.25;
const CUST = new THREE.Vector3(0.55, 0, 1.1);
const H1 = new THREE.Vector3(0.42, 0.86, 0.72), H2 = new THREE.Vector3(0.2, 0.95, 0.35), H3 = new THREE.Vector3(0.42, 0.84, 0.6);
const APPS = ['Discovery', 'Commerce', 'Content Creation', 'Advertising'];

// Infinity cove: floor, a quarter-round sweep and the back wall, one surface so there is no seam.
function cycGeometry() {
  const prof = [];
  for (let i = 0; i <= 6; i++) prof.push([0, 9 - i * (11.2 / 6)]);
  const R = 1.8;
  for (let i = 1; i <= 14; i++) { const a = (i / 14) * Math.PI / 2; prof.push([R - R * Math.cos(a), -2.2 - R * Math.sin(a)]); }
  for (let i = 1; i <= 4; i++) prof.push([R + i * 1.5, -4.0]);
  const pos = [], uv = [], idx = [];
  let arc = 0;
  prof.forEach(([y, z], j) => {
    if (j) arc += Math.hypot(y - prof[j - 1][0], z - prof[j - 1][1]);
    pos.push(-14, y, z, 14, y, z); uv.push(-7, arc / 2, 7, arc / 2);
  });
  for (let j = 0; j < prof.length - 1; j++) { const a = j * 2, c = a + 1, b = a + 2, d = a + 3; idx.push(a, c, b, c, d, b); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// Speech bubble whose tail tip sits at the mesh origin, so it can be placed right at the speaker.
function bubble(text, { fg, bg, h = 0.13, font = `700 54px ${FI}` }) {
  const probe = document.createElement('canvas').getContext('2d');
  probe.font = font;
  const W = Math.ceil(probe.measureText(text).width) + 84, H = 150;
  const { tex } = canvasTex(W, H, (c) => {
    c.fillStyle = bg; roundRect(c, 4, 4, W - 8, H - 42, 46); c.fill();
    c.beginPath(); c.moveTo(W - 92, H - 40); c.lineTo(W - 50, H - 4); c.lineTo(W - 56, H - 40); c.fill();
    c.font = font; c.fillStyle = fg; c.textBaseline = 'middle'; c.fillText(text, 42, (H - 38) / 2 + 4);
  });
  const geo = new THREE.PlaneGeometry((W / H) * h, h);
  geo.translate(-((W / 2 - 50) / H) * h, ((H / 2 - 4) / H) * h, 0);
  return new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, depthWrite: false, fog: false }));
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x4a423d);
  scene.fog = new THREE.Fog(0x4a423d, 6.5, 17);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- studio
  const cyc = mesh(cycGeometry(), std(0xffffff, { map: grainTex('#b5aa9e', { size: 256, speck: 0.05, blot: 0.05, seed: 7, repeat: 1 }), roughness: 0.42, metalness: 0.04 }), { cast: false });
  cyc.material.map.repeat.set(1, 1);
  scene.add(cyc);
  scene.add(new THREE.HemisphereLight(0xf6e8dc, 0x3a302a, 0.5));
  const key = new THREE.SpotLight(0xfff2e4, 46, 0, 0.6, 0.95, 1.4);
  key.position.set(-1.6, 4.6, 3.0);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.bias = -0.0002; key.shadow.normalBias = 0.02;
  key.shadow.camera.near = 2; key.shadow.camera.far = 9;
  scene.add(key, key.target);
  const rimC = new THREE.DirectionalLight(0xff8a6a, 1.3); rimC.position.set(-3, 2.2, -3); scene.add(rimC);
  const rimV = new THREE.DirectionalLight(0x8c70ff, 1.1); rimV.position.set(3.2, 1.6, -2.4); scene.add(rimV);

  // ----------------------------------------------------------- brand pillars
  const ceramic = new THREE.MeshPhysicalMaterial({ color: 0xeee7de, roughness: 0.32, clearcoat: 0.7, clearcoatRoughness: 0.18 });
  const pillars = BRANDS.map((b, i) => {
    const g = new THREE.Group(); g.position.set(b.x, 0, PZ); scene.add(g);
    const inner = new THREE.Group(); g.add(inner);
    const geo = new RoundedBoxGeometry(0.44, b.h, 0.44, 4, 0.05); geo.translate(0, b.h / 2, 0);
    inner.add(mesh(geo, ceramic));
    const slitM = new THREE.MeshBasicMaterial({ color: b.c, toneMapped: false });
    const slit = new THREE.Mesh(new THREE.BoxGeometry(0.045, b.h - 0.24, 0.012), slitM); slit.position.set(0, b.h / 2, 0.222); inner.add(slit);
    const streak = glow(b.c, 1, 0.3, 0.45); streak.scale.set(0.3, b.h * 1.05, 1); streak.position.set(0, b.h / 2, 0.25); inner.add(streak);
    const cap = glow(b.c, 0.9, 0.25, 0.4); cap.position.set(0, b.h + 0.04, 0.05); inner.add(cap);
    const bandM = new THREE.MeshBasicMaterial({ color: b.c, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.47, 0.018, 0.47), bandM); inner.add(band);
    const lab = label(b.n, { font: `800 58px ${FI}`, fg: '#ffffff', bg: 'rgba(30,24,30,0.82)', h: 0.13, pad: 34, track: 4 });
    lab.position.set(0, b.h - 0.17, 0.25); lab.material.fog = false; inner.add(lab);
    return { ...b, g, inner, slitM, streak, cap, band, bandM, lab, col: new THREE.Color(b.c) };
  });
  const bare = label('BRAND', { font: `800 58px ${FI}`, fg: '#ffffff', bg: 'rgba(30,24,30,0.82)', h: 0.13, pad: 34, track: 4 });
  bare.position.copy(pillars[1].lab.position); bare.material.fog = false; pillars[1].inner.add(bare);
  const bLight = new THREE.PointLight(CORAL, 0, 2.6, 1.6); bLight.position.set(0, 1.0, PZ + 0.4); scene.add(bLight);

  // Pulses the brand sends out across the floor.
  const rings = WAVES.map(() => {
    const m = new THREE.Mesh(new THREE.RingGeometry(0.965, 1, 96), new THREE.MeshBasicMaterial({ color: CORAL, transparent: true, depthWrite: false, toneMapped: false }));
    m.rotation.x = -Math.PI / 2; m.position.set(0, 0.006, PZ); scene.add(m);
    return m;
  });

  // ----------------------------------------------------------- the crowd and the customer
  const PEOPLE = [];
  [[1.35, 9], [1.8, 12], [2.25, 14]].forEach(([r, n], row) => {
    for (let i = 0; i < n; i++) {
      const a = lerp(-0.8, 0.8, (i + 0.5) / n) + (rnd(i, row + 1) - 0.5) * 0.07;
      const x = Math.sin(a) * r, z = PZ + Math.cos(a) * r * 0.85;
      if (Math.hypot(x - CUST.x, z - CUST.z) < 0.32) continue;
      PEOPLE.push({ x, z, d: Math.hypot(x, z - PZ), s: 0.9 + rnd(i, row + 5) * 0.22 });
    }
  });
  const bodyGeo = new THREE.CapsuleGeometry(0.055, 0.17, 4, 12); bodyGeo.translate(0, 0.14, 0);
  const headGeo = new THREE.SphereGeometry(0.048, 18, 12); headGeo.translate(0, 0.335, 0);
  const clay = std(0xffffff, { roughness: 0.78 });
  const bodies = new THREE.InstancedMesh(bodyGeo, clay, PEOPLE.length);
  const heads = new THREE.InstancedMesh(headGeo, clay, PEOPLE.length);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const CLAY = new THREE.Color(0xd6cdc2), LIT = new THREE.Color(0xff7a66), col = new THREE.Color();
  PEOPLE.forEach((p, i) => {
    m4.compose(p4.set(p.x, 0, p.z), q4.identity(), s4.setScalar(p.s));
    bodies.setMatrixAt(i, m4); heads.setMatrixAt(i, m4);
    bodies.setColorAt(i, CLAY); heads.setColorAt(i, CLAY);
  });
  bodies.castShadow = heads.castShadow = bodies.receiveShadow = heads.receiveShadow = true;
  scene.add(bodies, heads);
  const cust = new THREE.Group(); cust.position.copy(CUST); cust.scale.setScalar(1.28); scene.add(cust);
  const custM = std(0xe3dbee, { roughness: 0.6 });
  cust.add(mesh(bodyGeo, custM), mesh(headGeo, custM));

  // ----------------------------------------------------------- the customer's AI
  const orb = new THREE.Group(); scene.add(orb);
  const orbM = new THREE.MeshPhysicalMaterial({ color: 0xd2c8ff, metalness: 0.1, roughness: 0.12, iridescence: 1, iridescenceIOR: 1.5, iridescenceThicknessMinimum: 250, iridescenceThicknessMaximum: 900, clearcoat: 1, emissive: 0x5b3cff, emissiveIntensity: 0.55 });
  orb.add(mesh(new THREE.SphereGeometry(0.09, 48, 32), orbM, { receive: false }));
  const ringM = new THREE.MeshBasicMaterial({ color: 0xb7a6ff, toneMapped: false });
  const orbit1 = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.0045, 8, 72), ringM); orb.add(orbit1);
  const orbit2 = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.003, 8, 72), ringM); orb.add(orbit2);
  const orbGlow = glow(VIOLET, 0.9, 0.8, 0.35); orb.add(orbGlow);
  const orbLight = new THREE.PointLight(0x9a7cff, 0, 2.4, 1.5); orb.add(orbLight);
  const beamT = canvasTex(4, 128, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0.95)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const beamGeo = new THREE.CylinderGeometry(0.17, 0.008, 1, 24, 1, true); beamGeo.translate(0, 0.5, 0);
  const mkBeam = (c) => { const b = new THREE.Mesh(beamGeo, new THREE.MeshBasicMaterial({ color: c, map: beamT, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); scene.add(b); return b; };
  const scanBeam = mkBeam(0xa48cff), lockBeam = mkBeam(0xff7a66);

  // ----------------------------------------------------------- what they say
  const ask = bubble('Find me one', { fg: '#1e1626', bg: '#ffffff' });
  scene.add(ask);
  const why = bubble('Brand B, here is why', { fg: '#ffffff', bg: '#6a4cf0' });
  scene.add(why);

  // ----------------------------------------------------------- relationship links
  const TOPB = new THREE.Vector3(0, 1.32, PZ + 0.05), CUSTH = new THREE.Vector3(CUST.x, 0.44, CUST.z);
  const arc1 = new THREE.QuadraticBezierCurve3(TOPB.clone(), new THREE.Vector3(0.12, 1.75, -0.1), H3.clone());
  const arc2 = new THREE.QuadraticBezierCurve3(H3.clone(), new THREE.Vector3(0.62, 0.86, 0.95), CUSTH.clone());
  const AS = 80;
  const tubeOf = (curve, c) => { const m = new THREE.Mesh(new THREE.TubeGeometry(curve, AS, 0.009, 6, false), new THREE.MeshBasicMaterial({ color: c, transparent: true, toneMapped: false, depthWrite: false })); scene.add(m); return m; };
  const link1 = tubeOf(arc1, 0xff8a74), link2 = tubeOf(arc2, 0xa48cff);
  const dotT = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.6)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const FN = 64, fpos = new Float32Array(FN * 3), fcol = new Float32Array(FN * 3);
  const FLOW = Array.from({ length: FN }, (_, i) => ({ arc: i < 46 ? arc1 : arc2, dir: i < 46 ? (i % 2 ? 1 : -1) : -1, ph: rnd(i, 71), sp: 0.35 + rnd(i, 72) * 0.25 }));
  FLOW.forEach((f, i) => { col.setHex(f.arc === arc1 ? (f.dir > 0 ? 0xffb09c : 0xc7b8ff) : 0xc7b8ff); fcol.set([col.r, col.g, col.b], i * 3); });
  const fGeo = new THREE.BufferGeometry();
  fGeo.setAttribute('position', new THREE.BufferAttribute(fpos, 3)); fGeo.setAttribute('color', new THREE.BufferAttribute(fcol, 3));
  const flow = new THREE.Points(fGeo, new THREE.PointsMaterial({ size: 0.055, map: dotT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  flow.frustumCulled = false; scene.add(flow);

  // ----------------------------------------------------------- ARM console
  const con = new THREE.Group(); con.position.set(-1.02, 0.98, -0.25); con.rotation.y = 0.36; scene.add(con);
  const slab = mesh(new RoundedBoxGeometry(1.36, 0.86, 0.035, 3, 0.03), new THREE.MeshPhysicalMaterial({ color: 0x17131c, roughness: 0.18, metalness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }), { receive: false });
  con.add(slab);
  const ui = canvasTex(1024, 640);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.8125), new THREE.MeshBasicMaterial({ map: ui.tex, transparent: true, toneMapped: false }));
  screen.position.z = 0.019; con.add(screen);
  const conGlow = glow(VIOLET, 2.2, 0, 0.5); conGlow.scale.set(2.2, 1.5, 1); conGlow.position.z = -0.1; con.add(conGlow);
  const TILE = [7.65, 7.85, 8.05, 8.25];
  let uiKey = '';
  const drawUI = (t) => {
    const lit = TILE.filter((x) => t > x).length;
    const live = TILE.some((x) => t > x && t < x + 0.35) || (t > 8.35 && t < 8.8);
    const key = [lit, live ? Math.round(t * 30) : 0].join('|');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(24,19,30,0.96)'; roundRect(c, 0, 0, w, h, 34); c.fill();
      c.textBaseline = 'middle';
      c.fillStyle = '#ff5a4e'; roundRect(c, 48, 40, 118, 64, 16); c.fill();
      c.fillStyle = '#ffffff'; c.font = `800 38px ${FM}`; c.textAlign = 'center'; c.fillText('ARM', 107, 74); c.textAlign = 'left';
      c.fillStyle = '#ffffff'; c.font = `800 40px ${FI}`; c.fillText('Agent Relationship Management', 188, 74);
      APPS.forEach((name, i) => {
        const x = 48 + (i % 2) * 476, y = 140 + Math.floor(i / 2) * 186, on = i < lit, p = back(k(t, TILE[i], TILE[i] + 0.35));
        c.save(); c.translate(x + 226, y + 82); const sc = on ? 0.94 + 0.06 * p : 0.94; c.scale(sc, sc); c.translate(-(x + 226), -(y + 82));
        c.fillStyle = on ? 'rgba(124,92,255,0.22)' : 'rgba(255,255,255,0.05)'; roundRect(c, x, y, 452, 164, 26); c.fill();
        c.strokeStyle = on ? 'rgba(180,160,255,0.95)' : 'rgba(255,255,255,0.12)'; c.lineWidth = on ? 4 : 2; c.stroke();
        const ix = x + 70, iy = y + 82;
        c.fillStyle = on ? '#7c5cff' : 'rgba(255,255,255,0.14)'; c.beginPath(); c.arc(ix, iy, 38, 0, 7); c.fill();
        c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 6; c.lineCap = 'round'; c.beginPath();
        if (i === 0) { c.arc(ix - 4, iy - 4, 15, 0, 7); c.moveTo(ix + 7, iy + 7); c.lineTo(ix + 18, iy + 18); c.stroke(); }
        else if (i === 1) { c.moveTo(ix - 18, iy - 12); c.lineTo(ix - 12, iy + 10); c.lineTo(ix + 14, iy + 10); c.lineTo(ix + 18, iy - 8); c.lineTo(ix - 16, iy - 8); c.stroke(); }
        else if (i === 2) { c.moveTo(ix - 16, iy + 16); c.lineTo(ix + 14, iy - 14); c.moveTo(ix - 16, iy + 16); c.lineTo(ix - 10, iy + 4); c.stroke(); }
        else { c.moveTo(ix - 16, iy - 6); c.lineTo(ix - 4, iy - 6); c.lineTo(ix + 14, iy - 18); c.lineTo(ix + 14, iy + 18); c.lineTo(ix - 4, iy + 6); c.lineTo(ix - 16, iy + 6); c.closePath(); c.stroke(); }
        c.fillStyle = on ? '#ffffff' : 'rgba(255,255,255,0.6)'; c.font = `700 ${name.length > 12 ? 32 : 42}px ${FI}`; c.fillText(name, x + 130, y + 84);
        c.restore();
      });
      const bp = back(k(t, 8.35, 8.75));
      if (bp > 0) {
        c.save(); c.translate(48, 560); c.scale(Math.max(0.01, bp), Math.max(0.01, bp));
        c.fillStyle = '#ff5a4e'; roundRect(c, 0, -34, 420, 68, 34); c.fill();
        c.fillStyle = '#ffffff'; c.font = `800 38px ${FI}`; c.fillText('8+ concept flows', 30, 2);
        c.restore();
      }
      c.fillStyle = 'rgba(255,255,255,0.45)'; c.font = `700 28px ${FM}`; c.textAlign = 'right'; c.fillText('MRM', w - 52, 562); c.textAlign = 'left';
    });
  };

  // ----------------------------------------------------------- captions (ride on the camera)
  const CAPS = [
    ['Brand talks to people', 0.5, 2.85, 'rgba(30,24,30,0.86)'],
    ['Until the customer sends their own AI', 3.0, 4.3, 'rgba(30,24,30,0.86)'],
    ["The customer's AI decides", 4.45, 6.55, 'rgba(84,58,220,0.92)'],
    ['Agent Relationship Management', 6.95, 9.45, 'rgba(232,74,60,0.94)'],
  ].map(([text, a, b, bg]) => {
    const m = label(text, { font: `800 50px ${FI}`, fg: '#ffffff', bg, h: 0.12, pad: 38 });
    m.material.fog = false; m.renderOrder = 10; m.position.set(0, 0.44, -2); camera.add(m);
    return { m, a, b };
  });

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [1.9, 1.55, 4.3]], [2.8, [1.5, 1.42, 3.9], (x) => x],
    [3.9, [1.6, 0.98, 3.35]], [6.1, [0.95, 1.05, 3.45], (x) => x],
    [7.4, [0.3, 1.36, 4.3]], [10, [0.15, 1.38, 4.5], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 0.45, -0.3]], [2.8, [0, 0.5, -0.4], (x) => x],
    [3.9, [0.2, 0.56, -0.15]], [6.1, [0.0, 0.62, -0.45], (x) => x],
    [7.4, [-0.22, 0.7, -0.3]], [10, [-0.22, 0.7, -0.3], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), op = new THREE.Vector3(), aim = new THREE.Vector3(), dir = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const aimAt = (beam, from, to, op1) => {
    dir.subVectors(to, from); const len = dir.length();
    beam.position.copy(from); beam.quaternion.setFromUnitVectors(UP, dir.normalize()); beam.scale.set(1, len, 1);
    beam.material.opacity = op1; beam.visible = op1 > 0.01;
  };

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.8, 33], [3.9, 31], [6.1, 31], [7.4, 34], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    // The key light follows the story: crowd, then customer, then the console.
    const kt = kf(t, [[0, [0, 0.3, -0.4]], [3.2, [0, 0.3, -0.4]], [4.0, [0.35, 0.5, 0.3]], [6.6, [0.25, 0.5, 0.0]], [7.6, [-0.4, 0.6, -0.4]]]);
    key.target.position.set(kt[0], kt[1], kt[2]);

    // Beat 1: Brand B pulses; each figure lights as a ring reaches it.
    const dim = eio(k(t, 3.15, 3.9));
    const radii = WAVES.map((w0, i) => {
      const wp = k(t, w0, w0 + WDUR), r = 0.25 + eo(wp) * 2.6;
      rings[i].scale.setScalar(r); rings[i].material.opacity = (1 - wp) * 0.85; rings[i].visible = wp > 0 && wp < 1;
      return wp > 0 && wp < 1 ? r : -9;
    });
    PEOPLE.forEach((pp, i) => {
      let b = 0;
      radii.forEach((r) => { b = Math.max(b, Math.exp(-Math.pow((r - pp.d) / 0.16, 2))); });
      const heard = t > WAVES[0] + (pp.d - 0.25) / 2.6 * WDUR * 0.55 ? 0.28 : 0;
      col.copy(CLAY).lerp(LIT, Math.max(b, heard) * (1 - dim)).multiplyScalar(1 - 0.45 * dim);
      bodies.setColorAt(i, col); heads.setColorAt(i, col);
    });
    bodies.instanceColor.needsUpdate = true; heads.instanceColor.needsUpdate = true;
    const pulse = WAVES.reduce((a, w0) => a + Math.exp(-Math.pow((t - w0) / 0.12, 2)), 0);
    bLight.intensity = 1.2 + 4 * pulse * (t < 3 ? 1 : 0);

    // Pillars: A and C rise when the AI arrives, all three are scanned, B wins, A and C sink.
    const decided = eo(k(t, DECIDE, DECIDE + 0.3));
    pillars.forEach((pl, i) => {
      const rise = i === 1 ? 1 : spring(k(t, 3.45 + (i ? 0.12 : 0), 4.25 + (i ? 0.12 : 0)));
      const sink = i === 1 ? 0 : eio(k(t, 6.7, 7.3));
      pl.inner.position.y = -(1 - rise) * (pl.h + 0.5) - sink * (pl.h + 0.5);
      pl.g.visible = rise > 0.001 && sink < 0.999;
      const sp = k(t, SCAN[i], SCAN[i] + 0.5), scanning = sp > 0 && sp < 1;
      pl.band.position.y = 0.04 + eio(sp) * (pl.h - 0.06);
      pl.bandM.opacity = scanning ? Math.sin(Math.PI * sp) : 0;
      const lose = i === 1 ? 0 : decided, win = i === 1 ? decided : 0;
      const beat1 = i === 1 ? 0.7 + 0.6 * Math.min(1, pulse) * (t < 3 ? 1 : 0) : 0.7;
      const glowI = (beat1 + (scanning ? 0.6 * Math.sin(Math.PI * sp) : 0) + win * 0.6) * (1 - lose * 0.8);
      pl.slitM.color.copy(pl.col).lerp(col.setHex(0x6a625c), lose).multiplyScalar(0.6 + 0.4 * Math.min(1.4, glowI));
      pl.streak.material.opacity = 0.35 * glowI; pl.cap.material.opacity = 0.3 * glowI;
      pl.lab.quaternion.copy(camera.quaternion);
      pl.lab.material.opacity = (i === 1 ? eo(k(t, 3.45, 3.8)) : 1) * (1 - lose * 0.55);
    });
    bare.quaternion.copy(camera.quaternion);
    bare.material.opacity = 1 - eo(k(t, 3.45, 3.8)); bare.visible = t < 3.8;
    bLight.intensity += 3 * decided;

    // Beat 2: the customer's AI is born at their chest, rises, scans, chooses, answers.
    const born = back(k(t, 3.55, 4.15));
    orb.visible = t > 3.55;
    orb.scale.setScalar(Math.max(0.001, born));
    if (t < 4.3) op.copy(CUST).setY(0.32).lerp(H1, eio(k(t, 3.55, 4.25)));
    else if (t < DECIDE + 0.3) op.copy(H1).lerp(H2, eio(k(t, 4.25, 4.9)));
    else op.copy(H2).lerp(H3, eio(k(t, DECIDE + 0.3, DECIDE + 0.9)));
    const si = SCAN.findIndex((s) => t > s && t < s + 0.5);
    if (si >= 0) { const pl = pillars[si]; aim.set(pl.x, pl.h * 0.62, PZ + 0.23); dir.subVectors(aim, op).normalize(); op.addScaledVector(dir, 0.05 * Math.sin(Math.PI * k(t, SCAN[si], SCAN[si] + 0.5))); }
    orb.position.set(op.x, op.y + Math.sin(t * 2.1) * 0.018, op.z);
    orbit1.rotation.set(t * 1.3, t * 0.8, 0.4); orbit2.rotation.set(-t * 0.9 + 1, 0.3, t * 1.1);
    orbGlow.material.opacity = 0.75 + 0.15 * Math.sin(t * 5);
    orbLight.intensity = 2.2 * clamp(born);
    orbM.emissiveIntensity = 0.5 + (si >= 0 ? 0.35 : 0) + 0.3 * Math.exp(-6 * Math.max(0, t - DECIDE)) * (t > DECIDE ? 1 : 0);
    if (si >= 0) { const pl = pillars[si]; aim.set(pl.x, pl.h * 0.62, PZ + 0.23); aimAt(scanBeam, orb.position, aim, 0.55 * Math.sin(Math.PI * k(t, SCAN[si], SCAN[si] + 0.5))); }
    else scanBeam.visible = false;
    aim.set(0, pillars[1].h * 0.62, PZ + 0.23);
    aimAt(lockBeam, orb.position, aim, 0.7 * eo(k(t, DECIDE, DECIDE + 0.2)) * (1 - eo(k(t, 6.75, 7.15))));

    const ai = back(k(t, 3.35, 3.75)), ao = ei(k(t, 4.55, 4.85));
    ask.position.set(CUST.x - 0.04, 0.62, CUST.z); ask.quaternion.copy(camera.quaternion);
    ask.scale.setScalar(Math.max(0.001, ai * (1 - ao))); ask.material.opacity = clamp(ai) * (1 - ao); ask.visible = ai > 0.01 && ao < 1;
    const wi = back(k(t, ANSWER, ANSWER + 0.4)), wo = ei(k(t, 9.1, 9.4));
    why.position.set(H3.x - 0.06, H3.y + 0.2, H3.z); why.quaternion.copy(camera.quaternion);
    why.scale.setScalar(Math.max(0.001, wi * (1 - wo))); why.material.opacity = clamp(wi) * (1 - wo); why.visible = wi > 0.01 && wo < 1;

    // Beat 3: links join brand, AI and customer, with traffic both ways; the console rises.
    const l1 = eio(k(t, 6.85, 7.45)), l2 = eio(k(t, 7.1, 7.6));
    link1.geometry.setDrawRange(0, Math.floor(l1 * AS) * 36); link1.visible = l1 > 0; link1.material.opacity = 0.85;
    link2.geometry.setDrawRange(0, Math.floor(l2 * AS) * 36); link2.visible = l2 > 0; link2.material.opacity = 0.85;
    const fl = eo(k(t, 7.3, 7.8));
    FLOW.forEach((f, i) => {
      let u = (f.ph + t * f.sp) % 1; if (f.dir < 0) u = 1 - u;
      f.arc.getPoint(u, p4); fpos[i * 3] = p4.x; fpos[i * 3 + 1] = p4.y; fpos[i * 3 + 2] = p4.z;
    });
    fGeo.attributes.position.needsUpdate = true;
    flow.material.opacity = fl * (1 - ei(k(t, 9.3, 9.6))); flow.visible = fl > 0.01;
    const ci = back(k(t, 6.95, 7.55));
    con.position.y = 0.98 - (1 - clamp(ci)) * 0.28;
    con.scale.setScalar(Math.max(0.001, 0.86 + 0.14 * ci));
    con.visible = ci > 0.01;
    screen.material.opacity = clamp(ci);
    conGlow.material.opacity = 0.32 * clamp(ci);
    drawUI(t);

    CAPS.forEach(({ m, a, b }) => {
      const o = eo(k(t, a, a + 0.35)) * (1 - ei(k(t, b - 0.3, b)));
      m.material.opacity = o; m.visible = o > 0.01; m.position.y = 0.44 + (1 - eo(k(t, a, a + 0.35))) * 0.03;
    });
  }

  return { scene, camera, update, duration: D, poster: 8.6 };
}
