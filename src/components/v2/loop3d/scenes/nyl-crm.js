// New York Lottery CRM overhaul lit loop, 10 s. "Ask what people want, then write to them about it."
// A plum night studio with three stations left to right. A preference console: its pill switches slide
// on one by one, but one is left off. A newsletter assembles in the middle, block by block, from those
// choices. It folds into an envelope, the flap seals, and the envelope rides a lit track up through the
// four checkpoints of the email journey; each ring lights and its badge ticks a check as it passes. The camera pulls back to all three lit,
// and the project's name settles where the newsletter stood.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const CORAL = '#ff6a55', CORAL_HEX = 0xff6a55, LILAC = '#b49cff', LILAC_HEX = 0xb49cff, PAPER = '#e6dccb';
const TOG = [0.95, 1.35, -1, 1.75];            // when each preference switches on (the third stays off)
const BLOCKS = [2.35, 2.6, 2.85, 3.0, 3.15, 3.4]; // header, hero, three lines, button land on the sheet
const ENV_IN = 4.0, SHRINK = [4.25, 4.65], SLIDE = [4.65, 5.0], SEAL = [5.0, 5.3];
const RING_U = [0.3, 0.5, 0.7, 0.88];
const PASS = [5.95, 6.5, 7.05, 7.6];           // envelope reaches each ring
const FLY_END = 7.95;

// Small row icons for the preference console, drawn in a 64 px box centred on (x, y).
function prefIcon(c, i, x, y, col) {
  c.save(); c.translate(x, y); c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 4; c.lineCap = 'round'; c.lineJoin = 'round';
  if (i === 0) { c.beginPath(); c.arc(0, 0, 18, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, 8, 0, 7); c.fill(); }
  else if (i === 1) { [10, 0, -10].forEach((yy) => { c.beginPath(); c.ellipse(0, yy, 17, 6, 0, 0, 7); c.stroke(); }); }
  else if (i === 2) { c.beginPath(); for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4, r = j % 2 ? 7 : 19; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); }
  else { roundRect(c, -19, -12, 38, 24, 5); c.stroke(); c.beginPath(); c.setLineDash([3, 4]); c.moveTo(6, -12); c.lineTo(6, 12); c.stroke(); c.setLineDash([]); }
  c.restore();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0612);
  scene.fog = new THREE.Fog(0x0b0612, 4.5, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.4;
  const camera = new THREE.PerspectiveCamera(33, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- studio
  const floor = mesh(new THREE.PlaneGeometry(18, 14), std(0xffffff, { map: grainTex('#1c1028', { size: 256, speck: 0.05, blot: 0.12, seed: 17, repeat: 7 }), roughness: 0.24, metalness: 0.5 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const backGlow = glow(0x6a3fb8, 1, 0.32, 0.5); backGlow.position.set(0.4, 1.4, -3.5); backGlow.scale.set(9, 4.2, 1); scene.add(backGlow);
  const horizon = glow(CORAL_HEX, 1, 0.12, 0.5); horizon.position.set(0.3, 0.15, -3.2); horizon.scale.set(10, 0.9, 1); scene.add(horizon);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x8a6fc0, 0x0a0610, 0.36));
  const key = new THREE.SpotLight(0xffe2cc, 22, 0, 0.85, 0.85, 1.3);
  key.position.set(-1.0, 3.0, 2.5); key.target.position.set(0.1, 0.35, 0);
  key.castShadow = true; key.shadow.mapSize.set(1536, 1536);
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 8; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(LILAC_HEX, 1.5); rim.position.set(1.6, 1.8, -2.6); scene.add(rim);
  const carry = new THREE.PointLight(CORAL_HEX, 0, 1.8, 1.6); scene.add(carry);

  // ----------------------------------------------------------- station 1: the preference console
  const con = new THREE.Group(); con.position.set(-1.02, 0, 0.18); con.rotation.y = 0.32; scene.add(con);
  const conBody = mesh(new RoundedBoxGeometry(0.86, 0.2, 0.62, 3, 0.04), std(0x2a1a38, { roughness: 0.4, metalness: 0.35 }));
  conBody.position.y = 0.1; con.add(conBody);
  const deck = new THREE.Group(); deck.position.set(0, 0.215, 0.02); deck.rotation.x = 0.42; con.add(deck);
  const plate = mesh(new RoundedBoxGeometry(0.8, 0.03, 0.6, 3, 0.012), std(0x3a2650, { roughness: 0.3, metalness: 0.55 }));
  deck.add(plate);
  const face = canvasTex(512, 384, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 4; i++) {
      const y = 58 + i * 90;
      c.fillStyle = 'rgba(255,255,255,0.05)'; roundRect(c, 20, y - 38, w - 40, 76, 18); c.fill();
      prefIcon(c, i, 72, y, i === 2 ? 'rgba(230,220,203,0.4)' : PAPER);
      c.fillStyle = 'rgba(230,220,203,0.22)'; roundRect(c, 124, y - 6, 150 - i * 18, 12, 6); c.fill();
    }
  });
  const faceM = new THREE.Mesh(new THREE.PlaneGeometry(0.76, 0.57), new THREE.MeshBasicMaterial({ map: face.tex, transparent: true, color: 0xb8b0bc, toneMapped: false, depthWrite: false }));
  faceM.rotation.x = -Math.PI / 2; faceM.position.y = 0.0165; deck.add(faceM);
  const toggles = TOG.map((at, i) => {
    const z = -0.285 + (58 + i * 90) / 384 * 0.57;
    const trackM = std(0x4a3a5c, { roughness: 0.35, metalness: 0.2, emissive: CORAL_HEX, emissiveIntensity: 0 });
    const track = mesh(new THREE.CapsuleGeometry(0.034, 0.075, 6, 16), trackM);
    track.rotation.z = Math.PI / 2; track.scale.set(0.55, 1, 1); track.position.set(0.24, 0.022, z); deck.add(track);
    const knob = mesh(new THREE.SphereGeometry(0.031, 24, 16), std(0xefe6d8, { roughness: 0.35 }));
    knob.position.set(0.2, 0.04, z); deck.add(knob);
    const g = glow(CORAL_HEX, 0.3, 0, 0.4); g.position.set(0.24, 0.06, z); g.scale.set(0.34, 0.2, 1); deck.add(g);
    return { at, trackM, knob, g };
  });

  // ----------------------------------------------------------- station 2: the newsletter, built block by block
  const card = new THREE.Group(); scene.add(card);
  const CW = 0.6, CH = 0.86;
  const sheet = mesh(new RoundedBoxGeometry(CW, CH, 0.014, 2, 0.006), std(PAPER, { roughness: 0.85 }));
  card.add(sheet);
  const headTex = canvasTex(600, 160, (c, w, h) => {
    c.fillStyle = CORAL; c.fillRect(0, 0, w, h);
    c.fillStyle = '#2a0f0c'; c.font = `800 64px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Newsletter', 34, h / 2 + 4);
    c.fillStyle = 'rgba(42,15,12,0.55)'; c.beginPath(); c.arc(w - 54, h / 2, 22, 0, 7); c.fill();
  }).tex;
  const heroTex = canvasTex(600, 330, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#3b1d63'); g.addColorStop(1, '#a83a4a');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    for (let i = 0; i < 7; i++) {
      const x = 70 + i * 78, y = 150 + Math.sin(i * 1.7) * 60, r = 34 + rnd(i, 3) * 12;
      const b = c.createRadialGradient(x - r * 0.35, y - r * 0.35, 2, x, y, r);
      b.addColorStop(0, '#fff6ea'); b.addColorStop(0.55, i % 3 === 0 ? '#ffb36b' : i % 3 === 1 ? '#ff7a63' : '#c9b6ff'); b.addColorStop(1, 'rgba(40,10,40,0.9)');
      c.fillStyle = b; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    }
  }).tex;
  const blockGeo = (w, h) => new RoundedBoxGeometry(w, h, 0.016, 2, 0.006);
  const blocks = [
    { m: mesh(blockGeo(CW, 0.15), std(0xffffff, { map: headTex, roughness: 0.6 })), y: CH / 2 - 0.075 },
    { m: mesh(blockGeo(0.52, 0.29), std(0xffffff, { map: heroTex, roughness: 0.5 })), y: 0.08 },
    { m: mesh(blockGeo(0.5, 0.026), std(0x5a4a58, { roughness: 0.8 })), y: -0.13 },
    { m: mesh(blockGeo(0.44, 0.026), std(0x5a4a58, { roughness: 0.8 })), y: -0.18, x: -0.03 },
    { m: mesh(blockGeo(0.48, 0.026), std(0x5a4a58, { roughness: 0.8 })), y: -0.23, x: -0.01 },
    { m: mesh(new RoundedBoxGeometry(0.22, 0.07, 0.024, 3, 0.03), std(CORAL_HEX, { roughness: 0.4, emissive: CORAL_HEX, emissiveIntensity: 0.25 })), y: -0.33, x: -0.13 },
  ];
  blocks.forEach((b) => card.add(b.m));
  const cardGlow = glow(LILAC_HEX, 1, 0, 0.5); cardGlow.scale.set(1.3, 1.6, 1); scene.add(cardGlow);

  // ----------------------------------------------------------- the envelope
  const envG = new THREE.Group(); scene.add(envG);
  const EW = 0.5, EH = 0.32, ED = 0.032;
  const envTex = canvasTex(500, 320, (c, w, h) => {
    c.fillStyle = '#e2d1ba'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(90,60,40,0.22)'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(0, h); c.lineTo(w * 0.42, h * 0.48); c.moveTo(w, h); c.lineTo(w * 0.58, h * 0.48); c.stroke();
  }).tex;
  const envBody = mesh(new RoundedBoxGeometry(EW, EH, ED, 2, 0.008), std(0xffffff, { map: envTex, roughness: 0.85 }));
  envG.add(envBody);
  const flapShape = new THREE.Shape(); flapShape.moveTo(-EW / 2, 0); flapShape.lineTo(EW / 2, 0); flapShape.lineTo(0, -0.2); flapShape.closePath();
  const flapHinge = new THREE.Group(); flapHinge.position.set(0, EH / 2, ED / 2 + 0.002); envG.add(flapHinge);
  const flap = mesh(new THREE.ShapeGeometry(flapShape), std(0xd8c4a8, { roughness: 0.8, side: THREE.DoubleSide }));
  flapHinge.add(flap);
  const seal = mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.012, 28), std(CORAL_HEX, { roughness: 0.45, emissive: CORAL_HEX, emissiveIntensity: 0.3 }));
  seal.rotation.x = Math.PI / 2; seal.position.set(0, EH / 2 - 0.19, ED / 2 + 0.01); envG.add(seal);
  const envGlow = glow(CORAL_HEX, 0.7, 0, 0.35); envG.add(envGlow);
  const ENV_REST = new THREE.Vector3(0, 0.42, 0.06);

  // ----------------------------------------------------------- station 3: the email journey
  const curve = new THREE.CatmullRomCurve3([
    [0, 0.42, 0.06], [0.32, 0.6, 0.2], [0.62, 0.66, 0.04], [0.95, 0.82, -0.2], [1.24, 0.98, -0.48], [1.5, 1.1, -0.8], [1.74, 1.18, -1.15],
  ].map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  const TS = 180, RS = 8;
  const tubeGeo = new THREE.TubeGeometry(curve, TS, 0.007, RS, false);
  const track = new THREE.Mesh(tubeGeo, new THREE.MeshBasicMaterial({ color: 0x5a4a80, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false }));
  scene.add(track);
  const litGeo = new THREE.TubeGeometry(curve, TS, 0.011, RS, false);
  const lit = new THREE.Mesh(litGeo, new THREE.MeshBasicMaterial({ color: 0xff8a6e, toneMapped: false }));
  scene.add(lit);
  const IDX = litGeo.index.count;
  const zAxis = new THREE.Vector3(0, 0, 1);
  const rings = RING_U.map((u, i) => {
    const p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    const m = std(0x8f86a8, { metalness: 0.9, roughness: 0.28, emissive: CORAL_HEX, emissiveIntensity: 0 });
    const r = mesh(new THREE.TorusGeometry(0.115, 0.014, 14, 56), m);
    r.position.copy(p); r.quaternion.setFromUnitVectors(zAxis, tg); scene.add(r);
    const g = glow(CORAL_HEX, 0.55, 0, 0.4); g.position.copy(p); scene.add(g);
    // Each ring is a process checkpoint: a badge above it waits with its step number, then fills and
    // draws a check the moment the envelope passes through.
    const bt = canvasTex(160, 160);
    const badge = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.085), new THREE.MeshBasicMaterial({ map: bt.tex, transparent: true, depthWrite: false, toneMapped: false }));
    badge.position.copy(p).add(new THREE.Vector3(0, 0.175, 0)); scene.add(badge);
    return { r, m, g, p, bt, badge, key: '' };
  });
  const drawBadge = (b, i, prog) => {
    const key = prog <= 0 ? 'w' : String(Math.round(prog * 12));
    if (key === b.key) return; b.key = key;
    b.bt.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h / 2;
      if (prog <= 0) {
        c.strokeStyle = 'rgba(180,156,255,0.75)'; c.lineWidth = 7; c.beginPath(); c.arc(cx, cy, 62, 0, 7); c.stroke();
        c.fillStyle = 'rgba(236,226,255,0.8)'; c.font = `700 52px ${MONO}`; c.textAlign = 'center'; c.textBaseline = 'middle';
        c.fillText(String(i + 1), cx, cy + 3);
        return;
      }
      const fill = clamp(prog * 2);
      c.fillStyle = CORAL; c.beginPath(); c.arc(cx, cy, 30 + 38 * fill, 0, 7); c.fill();
      c.strokeStyle = 'rgba(255,214,200,0.9)'; c.lineWidth = 5; c.beginPath(); c.arc(cx, cy, 70, 0, 7); c.stroke();
      // The check draws itself: short stroke down, long stroke up.
      const d = clamp(prog * 1.6 - 0.35);
      const P = [[-30, 2], [-9, 24], [33, -22]];
      const L1 = Math.hypot(21, 22), L2 = Math.hypot(42, 46), go = d * (L1 + L2);
      c.strokeStyle = '#fff6ef'; c.lineWidth = 15; c.lineCap = 'round'; c.lineJoin = 'round';
      if (go > 0) {
        c.beginPath(); c.moveTo(cx + P[0][0], cy + P[0][1]);
        const a = Math.min(1, go / L1); c.lineTo(cx + lerp(P[0][0], P[1][0], a), cy + lerp(P[0][1], P[1][1], a));
        if (go > L1) { const b2 = (go - L1) / L2; c.lineTo(cx + lerp(P[1][0], P[2][0], b2), cy + lerp(P[1][1], P[2][1], b2)); }
        c.stroke();
      }
    });
  };

  // ----------------------------------------------------------- words
  const prefLabel = label('Preference center', { font: `800 60px ${SANS}`, fg: '#f4ece2', bg: 'rgba(26,14,36,0.8)', h: 0.13, pad: 34, track: 1 });
  const stratLabel = label('Email strategy', { font: `800 60px ${SANS}`, fg: '#f4ece2', bg: 'rgba(26,14,36,0.8)', h: 0.13, pad: 34, track: 1 });
  const title = label('CRM overhaul', { font: `800 72px ${SANS}`, fg: '#fff3ea', h: 0.22, pad: 12, track: 1 });
  const client = label('New York Lottery', { font: `700 56px ${MONO}`, fg: CORAL, h: 0.1, pad: 8, track: 3 });
  scene.add(prefLabel, stratLabel, title, client);
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width;

  // ----------------------------------------------------------- drifting confetti light
  const PN = 70, ppos = new Float32Array(PN * 3), pcol = new Float32Array(PN * 3);
  for (let i = 0; i < PN; i++) pcol.set(rnd(i, 7) > 0.5 ? [1, 0.45, 0.36] : [0.7, 0.6, 1], i * 3);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3)); pGeo.setAttribute('color', new THREE.BufferAttribute(pcol, 3));
  const dotTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.4)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const motes = new THREE.Points(pGeo, new THREE.PointsMaterial({ size: 0.05, map: dotTex, vertexColors: true, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  motes.frustumCulled = false; scene.add(motes);

  // ----------------------------------------------------------- camera: a left-to-right dolly that pulls back
  const camPos = (t) => kf(t, [
    [0, [-1.5, 0.98, 1.95]], [1.9, [-1.05, 0.95, 2.05], (x) => x],
    [2.9, [-0.2, 0.86, 2.15]], [4.6, [0.05, 0.8, 2.0], (x) => x],
    [5.6, [0.45, 0.86, 2.2]], [7.6, [1.05, 1.0, 2.15], (x) => x],
    [8.7, [0.3, 1.1, 3.75]], [10, [0.24, 1.12, 3.95], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.98, 0.24, 0.12]], [1.9, [-0.85, 0.3, 0.1], (x) => x],
    [2.9, [-0.02, 0.6, 0]], [4.6, [0.02, 0.5, 0.02], (x) => x],
    [5.6, [0.45, 0.62, -0.05]], [7.6, [1.1, 0.88, -0.45], (x) => x],
    [8.7, [0.22, 0.6, -0.25]], [10, [0.22, 0.6, -0.25], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), ep = new THREE.Vector3(), tan = new THREE.Vector3();
  const travel = (t) => kf(t, [[5.35, 0], ...PASS.map((p, i) => [p, RING_U[i]]), [FLY_END, 1]]);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.2) * 0.008, p[1] + Math.sin(t * 1.7 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 31], [2.9, 32], [7.6, 31], [8.7, 33], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Preferences: each pill slides on with a bounce; the third stays off.
    toggles.forEach(({ at, trackM, knob, g }) => {
      const s = at < 0 ? 0 : back(k(t, at, at + 0.32));
      knob.position.x = 0.2 + 0.08 * s;
      const c = clamp(s);
      trackM.color.setRGB(lerp(0.29, 0.62, c), lerp(0.23, 0.2, c), lerp(0.36, 0.16, c));
      trackM.emissiveIntensity = 0.85 * c;
      g.material.opacity = 0.55 * c + (at > 0 ? 0.5 * Math.exp(-5 * Math.max(0, t - at)) * (t > at ? 1 : 0) : 0);
    });
    const pl = eo(k(t, 0.5, 1.0));
    prefLabel.position.set(-0.98, 0.6 + (1 - pl) * 0.05, 0.2);
    prefLabel.lookAt(camera.position);
    prefLabel.material.opacity = pl * (1 - ei(k(t, 9.15, 9.6)));
    prefLabel.visible = prefLabel.material.opacity > 0.01;

    // Newsletter: the sheet stands up, the blocks drop onto it with a spring.
    const up = back(k(t, 2.05, 2.55));
    const shrink = eio(k(t, SHRINK[0], SHRINK[1])), slide = eio(k(t, SLIDE[0], SLIDE[1]));
    const cs = lerp(1, 0.34, shrink);
    const cy = lerp(lerp(0.62, ENV_REST.y + 0.33, shrink), ENV_REST.y, slide);
    card.position.set(0, cy - (1 - clamp(up)) * 0.25, lerp(0, ENV_REST.z - 0.004, shrink));
    card.rotation.set(-(1 - clamp(up)) * 0.6, Math.sin(t * 0.7) * 0.06 * (1 - shrink), 0);
    card.scale.setScalar(Math.max(0.001, cs * clamp(up * 1.2)));
    card.visible = up > 0.001 && t < SLIDE[1] + 0.05;
    blocks.forEach((b, i) => {
      const d = spring(k(t, BLOCKS[i], BLOCKS[i] + 0.55));
      b.m.position.set((b.x || 0), b.y + (1 - d) * 0.35, 0.016 + (1 - d) * 0.45);
      b.m.rotation.x = (1 - d) * -0.5;
      b.m.visible = t > BLOCKS[i];
    });
    cardGlow.position.set(0, cy, -0.08);
    cardGlow.material.opacity = 0.32 * clamp(up) * (1 - shrink);

    // Envelope: pops in under the card, the card slips in, the flap closes, the seal lands.
    const pop = back(k(t, ENV_IN, ENV_IN + 0.4));
    const u = travel(t);
    if (t < 5.35) ep.copy(ENV_REST); else curve.getPointAt(clamp(u), ep);
    curve.getTangentAt(clamp(Math.max(u, 0.001)), tan);
    const flying = t > 5.35 && t < FLY_END + 0.3;
    const lift = Math.sin(Math.PI * k(t, 5.3, 5.55)) * 0.03;
    envG.position.set(ep.x, ep.y + lift + (1 - clamp(pop)) * -0.12, ep.z);
    envG.rotation.set(flying ? -tan.y * 0.4 : 0, flying ? tan.x * 0.3 : 0, flying ? Math.sin(t * 5) * 0.04 : 0);
    const gone = ei(k(t, FLY_END - 0.15, FLY_END + 0.15));
    envG.scale.setScalar(Math.max(0.001, clamp(pop * 1.4) * (1 - gone)));
    envG.visible = t > ENV_IN && gone < 0.999;
    flapHinge.rotation.x = Math.PI * 0.72 * (1 - back(k(t, SEAL[0], SEAL[1])));
    const sl = back(k(t, SEAL[1], SEAL[1] + 0.25));
    seal.scale.setScalar(Math.max(0.001, sl)); seal.visible = sl > 0.01;
    envGlow.material.opacity = (flying ? 0.75 : 0) * (1 - gone);
    carry.position.copy(envG.position);
    carry.intensity = flying ? 1.6 * (1 - gone) : 0;

    // Journey: the track lights behind the envelope, each ring flares as it passes.
    lit.geometry.setDrawRange(0, Math.floor((IDX * clamp(u)) / 6) * 6);
    lit.visible = u > 0.002;
    const wave = k(t, 8.2, 9.0);
    rings.forEach((rg, i) => {
      const { m, g, badge } = rg;
      const hit = t > PASS[i] ? 1 : 0;
      const prog = k(t, PASS[i], PASS[i] + 0.45);
      drawBadge(rg, i, prog);
      badge.lookAt(camera.position);
      badge.scale.setScalar(prog > 0 ? 0.8 + 0.3 * back(clamp(prog * 1.6)) : 0.8);
      badge.material.opacity = eo(k(t, 5.4, 5.9)) * (1 - ei(k(t, 9.2, 9.6)));
      badge.visible = badge.material.opacity > 0.01;
      const flare = hit * Math.exp(-5 * Math.max(0, t - PASS[i]));
      const pulse = Math.max(0, Math.sin(Math.PI * clamp(wave * 4 - i * 0.6)));
      m.emissiveIntensity = hit * (0.9 + 1.4 * flare + 0.8 * pulse);
      g.material.opacity = hit * (0.35 + 0.6 * flare + 0.35 * pulse);
      g.scale.setScalar(0.5 + 0.35 * flare + 0.15 * pulse);
    });
    const sg = eo(k(t, 5.5, 6.0));
    stratLabel.position.set(1.0, 1.25 + (1 - sg) * 0.05, -0.2);
    stratLabel.lookAt(camera.position);
    stratLabel.material.opacity = sg * (1 - ei(k(t, 9.15, 9.6)));
    stratLabel.visible = stratLabel.material.opacity > 0.01;

    // The project's name settles where the newsletter stood.
    const ti = back(k(t, 8.25, 8.85)), ci = back(k(t, 8.1, 8.7)), out = ei(k(t, 9.15, 9.6));
    title.position.set(0.06, 0.66 + (1 - clamp(ti)) * -0.08, 0.1);
    title.lookAt(camera.position.x, title.position.y, camera.position.z);
    title.material.opacity = clamp(ti) * (1 - out);
    title.visible = title.material.opacity > 0.01;
    client.position.set(title.position.x - TWd / 2 + CWd / 2 + 0.02, 0.86 + (1 - clamp(ci)) * -0.06, 0.1);
    client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out);
    client.visible = client.material.opacity > 0.01;

    // Motes drift up slowly through the key light.
    for (let i = 0; i < PN; i++) {
      const y = (rnd(i, 22) * 2.2 + t * (0.05 + rnd(i, 23) * 0.05)) % 2.2;
      ppos[i * 3] = -2 + rnd(i, 21) * 4.2 + Math.sin(t * 0.4 + i) * 0.08;
      ppos[i * 3 + 1] = 0.05 + y;
      ppos[i * 3 + 2] = -1.6 + rnd(i, 24) * 2.2;
    }
    pGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.95 };
}
