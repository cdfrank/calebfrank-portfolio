// Corebridge Financial new business story lit loop, 10 s. "Same story, new industry."
// A dark pitch room with a walnut slat wall. Four story panels stand in an arc on polished stone, tied
// together by a glowing story arc inlaid in the floor. They first tell the BASF transformation story in
// field greens and wheat gold. The header turns to the financial services pitch and the panels flip one
// by one, like dominoes, keeping the same chapter but swapping every icon for its financial twin. The
// arc is retraced in the new color through the same four chapters, then the camera pulls back to the title.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const FS = 'Inter, system-ui, sans-serif', FM = '"JetBrains Mono", monospace';
const CH = ['THE FIELD', 'THE SHIFT', 'THE PROOF', 'THE PARTNER'];
const XS = [-1.38, -0.46, 0.46, 1.38];
const FLIP = [3.55, 3.95, 4.35, 4.75];   // each panel starts its flip
const PW = 0.7, PH = 1.0, PD = 0.05, BASE = 0.16;
const AG = { bg: '#0d2016', bg2: '#173a24', ink: '#ead08a', acc: '#86c25a', line: 'rgba(234,208,138,0.28)', halo: 'rgba(134,194,90,0.28)' };
const FI = { bg: '#0a1530', bg2: '#15295a', ink: '#a9dcff', acc: '#e3c28a', line: 'rgba(169,220,255,0.26)', halo: 'rgba(90,160,255,0.3)' };
const AGC = new THREE.Color(0x9fd36a), FIC = new THREE.Color(0x7cc4ff);

// ------------------------------------------------------------------ icons (drawn around 0,0 in a ~240 px box)
function leaf(c, x, y, dir, len, fill) {
  c.beginPath(); c.moveTo(x, y);
  c.quadraticCurveTo(x + dir * len * 0.45, y - len * 0.62, x + dir * len, y - len * 0.42);
  c.quadraticCurveTo(x + dir * len * 0.6, y + len * 0.04, x, y);
  c.fillStyle = fill; c.fill(); c.lineWidth = 7; c.stroke();
}
const ICONS = {
  ag: [
    (c, P) => { // sprout in a furrow
      c.beginPath(); c.moveTo(-112, 104); c.lineTo(112, 104); c.stroke();
      c.lineWidth = 6; c.beginPath(); c.moveTo(-80, 126); c.lineTo(80, 126); c.stroke(); c.lineWidth = 13;
      c.beginPath(); c.moveTo(0, 104); c.bezierCurveTo(2, 60, -8, 10, 0, -40); c.stroke();
      leaf(c, -2, 6, -1, 96, P.acc); leaf(c, 0, -34, 1, 118, P.acc);
    },
    (c, P) => { // tractor
      c.beginPath(); c.arc(-48, 52, 54, 0, 7); c.stroke(); c.beginPath(); c.arc(-48, 52, 15, 0, 7); c.fill();
      c.beginPath(); c.arc(74, 76, 30, 0, 7); c.stroke(); c.beginPath(); c.arc(74, 76, 8, 0, 7); c.fill();
      c.beginPath(); c.moveTo(-98, 4); c.lineTo(-98, -84); c.lineTo(-22, -84); c.lineTo(-12, -6); c.lineTo(104, -6); c.lineTo(108, 44); c.stroke();
      c.fillStyle = P.acc; c.fillRect(-84, -70, 52, 46);
      c.beginPath(); c.moveTo(70, -6); c.lineTo(70, -52); c.stroke();
    },
    (c, P) => { // wheat sheaf
      [-1, 0, 1].forEach((s) => {
        const bx = s * 14, by = 116, tx = s * 58, ty = s ? -64 : -96;
        c.lineWidth = 9; c.beginPath(); c.moveTo(bx, by); c.quadraticCurveTo(s * 18, 20, tx, ty); c.stroke();
        const dx = tx - s * 30, dy = ty - 20, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L, ang = Math.atan2(uy, ux);
        for (let q = 0; q < 4; q++) {
          for (const side of [-1, 1]) {
            const px = tx - ux * (q * 24 + 4) - uy * side * 13, py = ty - uy * (q * 24 + 4) + ux * side * 13;
            c.save(); c.translate(px, py); c.rotate(ang + side * 0.45); c.beginPath(); c.ellipse(0, 0, 17, 8, 0, 0, 7);
            c.fillStyle = P.acc; c.fill(); c.lineWidth = 4; c.stroke(); c.restore();
          }
        }
        c.save(); c.translate(tx + ux * 10, ty + uy * 10); c.rotate(ang); c.beginPath(); c.ellipse(0, 0, 16, 8, 0, 0, 7); c.fillStyle = P.acc; c.fill(); c.lineWidth = 4; c.stroke(); c.restore();
      });
      c.lineWidth = 13;
    },
    (c, P) => { // barn
      c.beginPath(); c.moveTo(-92, 108); c.lineTo(-92, -10); c.lineTo(0, -92); c.lineTo(92, -10); c.lineTo(92, 108); c.closePath(); c.stroke();
      c.fillStyle = P.acc; c.fillRect(-36, 34, 72, 74);
      c.lineWidth = 7; c.strokeRect(-36, 34, 72, 74); c.beginPath(); c.moveTo(-36, 34); c.lineTo(36, 108); c.moveTo(36, 34); c.lineTo(-36, 108); c.stroke();
      c.strokeRect(-18, -40, 36, 32); c.lineWidth = 13;
    },
  ],
  fi: [
    (c, P) => { // coin stack and a standing coin
      for (let j = 0; j < 4; j++) {
        const y = 92 - j * 30;
        c.fillStyle = P.bg2; c.beginPath(); c.ellipse(-30, y, 70, 22, 0, 0, 7); c.fill();
        c.lineWidth = 7; c.stroke();
      }
      c.beginPath(); c.arc(70, 40, 50, 0, 7); c.fillStyle = P.bg2; c.fill(); c.lineWidth = 11; c.stroke();
      c.strokeStyle = P.acc; c.lineWidth = 7; c.beginPath(); c.arc(70, 40, 30, 0, 7); c.stroke(); c.strokeStyle = P.ink; c.lineWidth = 13;
    },
    (c, P) => { // two-way shift
      c.beginPath(); c.moveTo(-100, -40); c.lineTo(88, -40); c.moveTo(56, -72); c.lineTo(90, -40); c.lineTo(56, -8); c.stroke();
      c.strokeStyle = P.acc; c.beginPath(); c.moveTo(100, 44); c.lineTo(-88, 44); c.moveTo(-56, 12); c.lineTo(-90, 44); c.lineTo(-56, 76); c.stroke();
      c.strokeStyle = P.ink;
    },
    (c, P) => { // rising bars with a trend line
      c.beginPath(); c.moveTo(-114, 110); c.lineTo(114, 110); c.stroke();
      const H = [52, 92, 132, 176];
      H.forEach((hh, q) => { c.fillStyle = q === 3 ? P.acc : P.ink; c.globalAlpha = q === 3 ? 1 : 0.85; c.fillRect(-96 + q * 52, 96 - hh, 36, hh); });
      c.globalAlpha = 1; c.strokeStyle = P.acc; c.lineWidth = 7; c.beginPath();
      H.forEach((hh, q) => { const x = -78 + q * 52, y = 74 - hh; if (q) c.lineTo(x, y); else c.moveTo(x, y); }); c.stroke();
      c.fillStyle = P.acc; c.beginPath(); c.arc(78, 74 - 176, 11, 0, 7); c.fill(); c.strokeStyle = P.ink; c.lineWidth = 13;
    },
    (c, P) => { // institution with columns
      c.beginPath(); c.moveTo(-108, -36); c.lineTo(0, -100); c.lineTo(108, -36); c.closePath(); c.stroke();
      c.beginPath(); c.moveTo(-100, -16); c.lineTo(100, -16); c.stroke();
      c.fillStyle = P.acc; [-72, -24, 24, 72].forEach((x) => c.fillRect(x - 11, -4, 22, 92));
      c.beginPath(); c.moveTo(-106, 100); c.lineTo(106, 100); c.moveTo(-120, 122); c.lineTo(120, 122); c.stroke();
    },
  ],
};

function face(kind, i) {
  const P = kind === 'ag' ? AG : FI;
  return canvasTex(512, 732, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, P.bg2); g.addColorStop(1, P.bg);
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const r = c.createRadialGradient(w / 2, 330, 10, w / 2, 330, 250); r.addColorStop(0, P.halo); r.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = r; c.fillRect(0, 0, w, h);
    c.strokeStyle = P.line; c.lineWidth = 3; roundRect(c, 18, 18, w - 36, h - 36, 22); c.stroke();
    c.font = `700 34px ${FM}`; c.fillStyle = P.acc; c.textBaseline = 'middle'; c.fillText('0' + (i + 1), 48, 68);
    for (let d = 0; d < 4; d++) { c.fillStyle = d === i ? P.acc : P.line; c.beginPath(); c.arc(w - 132 + d * 26, 68, 7, 0, 7); c.fill(); }
    c.save(); c.translate(w / 2, 330); c.lineWidth = 13; c.lineCap = 'round'; c.lineJoin = 'round'; c.strokeStyle = P.ink; c.fillStyle = P.ink;
    ICONS[kind][i](c, P); c.restore();
    c.fillStyle = P.line; c.fillRect(48, 568, w - 96, 2);
    let fs = 62; c.font = `800 ${fs}px ${FS}`;
    while (c.measureText(CH[i]).width > w - 90 && fs > 36) { fs -= 2; c.font = `800 ${fs}px ${FS}`; }
    c.fillStyle = '#efe9dc'; c.textAlign = 'center'; c.fillText(CH[i], w / 2, 636);
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060609);
  scene.fog = new THREE.Fog(0x060609, 4.2, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(38, 16 / 10, 0.05, 50);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- room: stone floor, walnut slat wall, warm cove
  const floor = mesh(new THREE.PlaneGeometry(20, 14), std(0xffffff, { map: grainTex('#121117', { size: 256, speck: 0.06, blot: 0.1, seed: 21, repeat: 7 }), roughness: 0.26, metalness: 0.35 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wall = mesh(new THREE.PlaneGeometry(14, 5), std(0x0c0a0b, { roughness: 0.9 }), { cast: false });
  wall.position.set(0, 2.2, -2.62); scene.add(wall);
  const SN = 72;
  const slats = new THREE.InstancedMesh(new THREE.BoxGeometry(0.055, 3.4, 0.06), std(0x3a2618, { roughness: 0.55, metalness: 0.05 }), SN);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < SN; i++) { m4.makeTranslation(-4.3 + i * 0.121, 1.7, -2.52 + rnd(i, 3) * 0.01); slats.setMatrixAt(i, m4); }
  slats.receiveShadow = true; scene.add(slats);
  const cove = new THREE.Mesh(new THREE.BoxGeometry(9, 0.018, 0.02), new THREE.MeshBasicMaterial({ color: 0xffa964, toneMapped: false }));
  cove.material.color.multiplyScalar(0.7); cove.position.set(0, 0.03, -2.4); scene.add(cove);
  const coveGlow = glow(0xff9a52, 1, 0.5, 0.45); coveGlow.position.set(0, 0.25, -2.35); coveGlow.scale.set(10, 0.9, 1); scene.add(coveGlow);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x55638e, 0x0a0806, 0.32));
  const key = new THREE.SpotLight(0xfff0dc, 0, 0, 0.62, 0.75, 1.3);
  key.position.set(-1.9, 3.3, 2.7); key.target.position.set(0, 0.55, -0.1);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 9; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x86a6ff, 1.3); rim.position.set(2.2, 2.6, -3); scene.add(rim);
  const sweep = new THREE.PointLight(0x7cc4ff, 0, 2.2, 1.6); scene.add(sweep);

  // ----------------------------------------------------------- the four story panels
  const frameM = new THREE.MeshPhysicalMaterial({ color: 0x15161b, roughness: 0.3, metalness: 0.7, clearcoat: 0.6, clearcoatRoughness: 0.2 });
  const plinthM = std(0x101116, { roughness: 0.35, metalness: 0.6 });
  const panels = XS.map((x, i) => {
    const z = x * x * 0.12, ry = -x * 0.2;
    const holder = new THREE.Group(); holder.position.set(x, 0, z); holder.rotation.y = ry; scene.add(holder);
    const plinth = mesh(new RoundedBoxGeometry(PW + 0.1, 0.07, 0.24, 2, 0.015), plinthM); plinth.position.y = 0.035; holder.add(plinth);
    const stripM = new THREE.MeshBasicMaterial({ color: AGC.clone(), toneMapped: false });
    const strip = new THREE.Mesh(new THREE.BoxGeometry(PW - 0.04, 0.008, 0.008), stripM); strip.position.set(0, 0.071, 0.11); holder.add(strip);
    const stripGlow = glow(AGC, 1, 0.45, 0.4); stripGlow.position.set(0, 0.09, 0.14); stripGlow.scale.set(1.0, 0.16, 1); holder.add(stripGlow);
    const post = mesh(new THREE.BoxGeometry(0.03, BASE, 0.03), plinthM); post.position.y = BASE / 2 + 0.03; holder.add(post);
    const flip = new THREE.Group(); flip.position.y = BASE + PH / 2; holder.add(flip);
    flip.add(mesh(new RoundedBoxGeometry(PW, PH, PD, 3, 0.022), frameM));
    const mk = (kind) => {
      const tex = face(kind, i).tex;
      const m = new THREE.Mesh(new THREE.PlaneGeometry(PW - 0.034, PH - 0.034), std(0x8e8e8e, { map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.62, roughness: 0.3, metalness: 0.1 }));
      m.castShadow = false; m.receiveShadow = false; flip.add(m); return m;
    };
    const front = mk('ag'); front.position.z = PD / 2 + 0.001;
    const backF = mk('fi'); backF.position.z = -PD / 2 - 0.001; backF.rotation.y = Math.PI;
    const flare = glow(0xffffff, 1.4, 0, 0.3); flare.position.set(0, BASE + PH / 2, 0.06); holder.add(flare);
    holder.updateMatrixWorld();
    return { holder, flip, stripM, stripGlow, flare, x, z };
  });

  // ----------------------------------------------------------- the story arc in the floor
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-2.35, 0.006, 1.15),
    ...XS.map((x) => new THREE.Vector3(x, 0.006, x * x * 0.12 + 0.36)),
    new THREE.Vector3(2.35, 0.006, 1.15),
  ], false, 'centripetal');
  const SEG = 240, RAD = 6, PER = RAD * 6;
  const tubeM = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, toneMapped: false, depthWrite: false });
  const arcA = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.011, RAD, false), tubeM(AGC.clone().multiplyScalar(0.9), 1));
  const arcB = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.014, RAD, false), tubeM(FIC.clone(), 1));
  const arcHalo = new THREE.Mesh(new THREE.TubeGeometry(curve, SEG, 0.05, RAD, false), tubeM(FIC.clone(), 0.16));
  arcHalo.material.blending = THREE.AdditiveBlending;
  scene.add(arcA, arcB, arcHalo);
  const head = glow(0xffffff, 0.5, 0, 0.3); scene.add(head);
  const NODE_U = XS.map((x) => { // arc-length position of each chapter node
    let best = 0, bd = 9; const v = new THREE.Vector3();
    for (let s = 0; s <= 400; s++) { curve.getPointAt(s / 400, v); const d = Math.abs(v.x - x); if (d < bd) { bd = d; best = s / 400; } }
    return best;
  });
  const nodes = NODE_U.map((u) => { const g = glow(AGC, 0.42, 0, 0.35); curve.getPointAt(u, g.position); g.position.y = 0.03; scene.add(g); return g; });

  // ----------------------------------------------------------- header and title
  const hdrA = label('BASF TRANSFORMATION STORY', { font: `800 54px ${FS}`, fg: AG.ink, bg: 'rgba(13,32,22,0.88)', h: 0.16, pad: 44, track: 5 });
  const hdrB = label('FINANCIAL SERVICES PITCH', { font: `800 54px ${FS}`, fg: FI.ink, bg: 'rgba(10,21,48,0.9)', h: 0.16, pad: 44, track: 5 });
  scene.add(hdrA, hdrB);
  const titleT = canvasTex(1024, 300, (c, w, h) => {
    c.fillStyle = 'rgba(9,16,36,0.9)'; roundRect(c, 4, 4, w - 8, h - 8, 34); c.fill();
    c.strokeStyle = 'rgba(227,194,138,0.7)'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = FI.acc; c.font = `700 36px ${FM}`; if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.fillText('COREBRIDGE FINANCIAL', w / 2, 82);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#f4efe4'; c.font = `800 104px ${FS}`; c.fillText('New business story', w / 2, 188);
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.6 * 300 / 1024), new THREE.MeshBasicMaterial({ map: titleT.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(title);

  // ----------------------------------------------------------- dust in the key light
  const DN = 170, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe2bd, size: 0.011, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-1.8, 0.86, 2.3]], [3.0, [-1.0, 0.9, 2.7], (x) => x],
    [5.5, [0.85, 0.9, 2.85]], [7.1, [0.18, 1.12, 4.8]],
    [10, [0.0, 1.18, 5.05], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-1.2, 0.68, 0.1]], [3.0, [-0.6, 0.72, 0], (x) => x],
    [5.5, [0.55, 0.72, 0]], [7.1, [0.0, 0.88, 0]],
    [10, [0.0, 0.9, 0], (x) => x],
  ]);
  const tgt = new THREE.Vector3();
  // When each eio-eased arc draw reaches a chapter node, so the node can pulse as the light arrives.
  const kfInv = (t0, t1, u) => {
    let lo = 0, hi = 1;
    for (let n = 0; n < 20; n++) { const m = (lo + hi) / 2; if (eio(m) < u) lo = m; else hi = m; }
    return lerp(t0, t1, (lo + hi) / 2);
  };
  const NODE_TA = NODE_U.map((u) => kfInv(0.55, 2.4, u)), NODE_TB = NODE_U.map((u) => kfInv(5.35, 6.75, u));

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 38], [5.5, 37], [7.1, 35], [10, 35]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    key.intensity = 22 * clamp(back(k(t, 0.1, 0.8)));

    // Beat 1: the arc draws in field green through the four chapters.
    const a1 = eio(k(t, 0.55, 2.4));
    arcA.geometry.setDrawRange(0, Math.floor(a1 * SEG) * PER);
    arcA.visible = a1 > 0;
    arcA.material.opacity = 1 - 0.75 * eo(k(t, 5.4, 6.8));
    // Beat 3: the same arc is retraced in the new industry's blue.
    const a2 = eio(k(t, 5.35, 6.75));
    arcB.geometry.setDrawRange(0, Math.floor(a2 * SEG) * PER);
    arcHalo.geometry.setDrawRange(0, Math.floor(a2 * SEG) * PER);
    arcB.visible = arcHalo.visible = a2 > 0;
    const drawing = a1 > 0 && a1 < 1 ? a1 : a2 > 0 && a2 < 1 ? a2 : -1;
    curve.getPointAt(Math.max(0, drawing), head.position); head.position.y = 0.04;
    head.material.color.copy(a2 > 0 ? FIC : AGC);
    head.material.opacity = drawing >= 0 ? 0.95 : 0;
    nodes.forEach((n, i) => {
      const hitA = a1 >= NODE_U[i], hitB = a2 >= NODE_U[i];
      n.material.color.copy(hitB ? FIC : AGC);
      const pulse = hitB ? Math.exp(-5 * Math.max(0, t - NODE_TB[i])) : hitA ? Math.exp(-5 * Math.max(0, t - NODE_TA[i])) : 0;
      n.material.opacity = (hitA || hitB ? 0.55 : 0) + 0.45 * pulse;
      n.scale.setScalar(0.42 + 0.3 * pulse);
    });

    // Header: the BASF story turns over to the financial services pitch, then gives way to the title.
    const hA = eo(k(t, 0.6, 1.1)), hFlip = k(t, 3.2, 3.5), hB = back(k(t, 3.45, 3.9)), hOut = ei(k(t, 6.7, 7.0));
    const hx = lerp(q[0], 0, 0.35);
    hdrA.position.set(hx, 1.45, 0.36); hdrA.lookAt(camera.position); hdrA.rotateX(-ei(hFlip) * Math.PI / 2);
    hdrA.material.opacity = hA * (1 - hFlip); hdrA.visible = hA > 0.01 && hFlip < 1;
    hdrB.position.set(hx, 1.45, 0.36); hdrB.lookAt(camera.position); hdrB.rotateX((1 - hB) * Math.PI / 2);
    hdrB.material.opacity = clamp(hB) * (1 - hOut); hdrB.visible = hB > 0.01 && hOut < 1;
    const tIn = back(k(t, 7.0, 7.55));
    title.position.set(0, 1.56 - (1 - clamp(tIn)) * 0.08, 0.36); title.lookAt(camera.position);
    title.scale.setScalar(Math.max(0.001, 0.85 + 0.15 * tIn));
    title.material.opacity = clamp(tIn); title.visible = tIn > 0.01;

    // Beat 2: each panel dips, lifts and turns over, landing on its financial twin.
    let sweepI = 0, sweepS = 0;
    panels.forEach((P, i) => {
      const F = FLIP[i];
      const ant = Math.sin(Math.PI * k(t, F - 0.32, F + 0.16));   // wind-up: a small counter-turn and crouch
      const fp = k(t, F, F + 0.8), f = back(fp);
      P.flip.rotation.y = -0.16 * ant + Math.PI * f;
      P.flip.position.y = BASE + PH / 2 - 0.025 * ant + Math.sin(Math.PI * fp) * 0.11;
      const s = Math.sin(Math.PI * clamp(fp * 1.15));
      P.flare.material.opacity = 0.6 * s; P.flare.scale.set(0.5 + 0.9 * s, 1.4, 1);
      const turned = eo(k(t, F + 0.3, F + 0.55));
      P.stripM.color.copy(AGC).lerp(FIC, turned).multiplyScalar(0.8 + 0.6 * Math.exp(-4 * Math.max(0, t - F - 0.55)) * turned);
      P.stripGlow.material.color.copy(P.stripM.color);
      if (s > sweepS) { sweepS = s; sweepI = i; }
    });
    const SP = panels[sweepI];
    sweep.position.set(SP.x, 0.8, SP.z + 0.55);
    sweep.intensity = 3.2 * sweepS;

    // Dust drifting through the key.
    for (let i = 0; i < DN; i++) {
      const bx = (rnd(i, 41) - 0.5) * 4.4, by = 0.15 + rnd(i, 42) * 1.9, bz = (rnd(i, 43) - 0.3) * 2.4;
      dpos[i * 3] = bx + Math.sin(t * 0.3 + i) * 0.15 + t * 0.02;
      dpos[i * 3 + 1] = by + Math.sin(t * 0.45 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = bz + Math.cos(t * 0.27 + i) * 0.1;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 7.6 };
}
