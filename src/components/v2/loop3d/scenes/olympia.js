// Olympia Skate Shop lit loop, 10 s. "A crew of skaters wins a Nike SB account."
// A skate shop counter on a rainy Pacific Northwest night. The crew deals its pitch onto the counter
// card by card (the crew, brand, web, 3D logo); the 3D logo lifts out of its card in chrome and a
// rubber stamp slams ACCOUNT WON across the pitch. The camera rises to the shop window: the logo flies
// into the sign and lights it, the release-day line outside the rain-streaked glass moves through the
// door one by one, and the stack of shoeboxes on the counter sells down to nothing.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { makeCrowd } from '../person.js';

const D = 10;
const ORANGE = '#e8622c', TEAL = '#2f7f86', CREAM = '#f1e4cc', INK = '#17181c', GOLD = '#d9b13b';
const F = 'Inter, system-ui, sans-serif', M = '"JetBrains Mono", monospace';
const CARDS = ['The crew', 'Brand', 'Web', '3D logo'];
const SLOT = [[-0.275, -0.195], [0.275, -0.195], [-0.275, 0.195], [0.275, 0.195]];
const DEAL = [0.45, 0.8, 1.15, 1.5];             // each pitch card leaves the crew's hand
const IMPACT = 3.78;                             // the stamp lands
const ENTER = [5.5, 5.98, 6.46, 6.94, 7.42, 7.9]; // each customer reaches the door
const QZ = -3.35, DOOR = [1.65, -2.72];
const HOVER = [0.58, 0.4, 0.08];                 // where the 3D logo floats while the stamp comes down
const SOCKET = [-1.13, 1.32, -2.41];             // its place on the shop sign
// Shoebox stack: [x, row]; sold top-down, alternating columns.
const BOX = [[1.38, 2], [0.97, 2], [1.38, 1], [0.97, 1], [1.38, 0], [0.97, 0]];

function cardFace(i) {
  return canvasTex(512, 356, (c, w, h) => {
    c.fillStyle = '#e4dccb'; c.fillRect(0, 0, w, h);
    c.fillStyle = INK; c.font = `800 62px ${F}`; c.textBaseline = 'alphabetic'; c.fillText(CARDS[i], 30, 80);
    c.fillStyle = ORANGE; c.fillRect(32, 98, 72, 8);
    const y0 = 128, ah = h - y0 - 24;
    if (i === 0) { // three decks: the crew
      [ORANGE, TEAL, GOLD].forEach((col, j) => {
        c.save(); c.translate(128 + j * 128, y0 + ah / 2); c.rotate((j - 1) * 0.16);
        c.fillStyle = 'rgba(0,0,0,0.18)'; roundRect(c, -30, -ah / 2 + 6, 68, ah, 34); c.fill();
        c.fillStyle = col; roundRect(c, -34, -ah / 2, 68, ah, 34); c.fill();
        c.fillStyle = 'rgba(23,24,28,0.85)'; c.fillRect(-34, -10, 68, 20);
        c.fillStyle = CREAM; c.beginPath(); c.arc(0, -ah / 2 + 40, 9, 0, 7); c.fill();
        c.beginPath(); c.arc(0, ah / 2 - 40, 9, 0, 7); c.fill();
        c.restore();
      });
    } else if (i === 1) { // wordmark block and the palette
      c.fillStyle = INK; roundRect(c, 30, y0, 300, ah, 16); c.fill();
      c.fillStyle = CREAM; c.font = `900 52px ${F}`; c.fillText('OLYMPIA', 50, y0 + ah / 2 + 18);
      c.fillStyle = ORANGE; c.fillRect(50, y0 + ah / 2 + 34, 120, 6);
      [ORANGE, TEAL, CREAM, GOLD].forEach((col, j) => {
        c.fillStyle = col; roundRect(c, 348 + (j % 2) * 70, y0 + Math.floor(j / 2) * ((ah + 12) / 2), 60, (ah - 12) / 2, 10); c.fill();
        c.strokeStyle = 'rgba(23,24,28,0.4)'; c.lineWidth = 2; c.stroke();
      });
    } else if (i === 2) { // the shop's website
      c.fillStyle = INK; roundRect(c, 30, y0, w - 60, ah, 14); c.fill();
      c.fillStyle = '#2a2c33'; c.fillRect(30, y0 + 30, w - 60, 2);
      ['#e8622c', '#d9b13b', '#2f7f86'].forEach((col, j) => { c.fillStyle = col; c.beginPath(); c.arc(52 + j * 22, y0 + 15, 6, 0, 7); c.fill(); });
      c.fillStyle = TEAL; roundRect(c, 46, y0 + 46, 250, ah - 64, 10); c.fill();
      c.fillStyle = 'rgba(241,228,204,0.9)'; c.font = `900 30px ${F}`; c.fillText('SKATE', 64, y0 + 96);
      c.fillStyle = ORANGE; roundRect(c, 64, y0 + ah - 66, 110, 30, 15); c.fill();
      for (let r = 0; r < 4; r++) { c.fillStyle = r ? 'rgba(241,228,204,0.35)' : CREAM; roundRect(c, 314, y0 + 52 + r * 34, r ? 120 : 140, 14, 7); c.fill(); }
    } else { // the logo as construction lines
      const cx = w / 2, cy = y0 + ah / 2, R = ah / 2 - 4;
      c.strokeStyle = 'rgba(23,24,28,0.25)'; c.lineWidth = 1.5;
      for (let g = 0; g < 9; g++) { c.beginPath(); c.moveTo(cx - R - 60 + g * 30, y0); c.lineTo(cx - R - 60 + g * 30, y0 + ah); c.stroke(); }
      c.strokeStyle = INK; c.lineWidth = 4;
      c.beginPath(); c.arc(cx, cy, R, 0, 7); c.stroke();
      c.beginPath(); c.arc(cx, cy, R * 0.68, 0, 7); c.stroke();
      c.save(); c.translate(cx, cy); c.rotate(-0.6); c.strokeStyle = ORANGE; roundRect(c, -R * 0.95, -R * 0.24, R * 1.9, R * 0.48, R * 0.24); c.stroke(); c.restore();
      c.setLineDash([6, 6]); c.strokeStyle = 'rgba(23,24,28,0.5)'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(cx - R - 30, cy); c.lineTo(cx + R + 30, cy); c.stroke(); c.setLineDash([]);
    }
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05080e);
  scene.fog = new THREE.Fog(0x05080e, 5, 15);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x4a6a96, 0x140e0a, 0.3));
  const key = new THREE.SpotLight(0xffcf9a, 12, 0, 0.78, 0.7, 1.3);   // the pendant over the counter
  key.position.set(-0.35, 1.6, -0.1); key.target.position.set(0.15, 0, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.5; key.shadow.camera.far = 4; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7fb2ff, 1.1);              // cold street light through the glass
  rim.position.set(-0.8, 1.6, -4); scene.add(rim);
  const fill = new THREE.PointLight(0xffd2a0, 1.5, 6, 1.5); fill.position.set(1.5, 1.3, 1.4); scene.add(fill);
  const spill = new THREE.PointLight(0xffa860, 0, 4, 1.4); spill.position.set(0.0, 0.25, -2.8); scene.add(spill);
  const signL = new THREE.PointLight(0xffb070, 0, 3, 1.6); signL.position.set(-0.3, 1.05, -2.15); scene.add(signL);
  const shoeL = new THREE.SpotLight(0xffe8cc, 0, 2.2, 0.45, 0.5, 1.2);
  shoeL.position.set(-0.3, 0.9, -1.85); shoeL.target.position.set(-0.3, -0.25, -2.36); scene.add(shoeL, shoeL.target);

  // ----------------------------------------------------------- shop interior: floor and counter
  const floor = mesh(new THREE.PlaneGeometry(10, 6), std(0xffffff, { map: grainTex('#2a2a2c', { size: 256, speck: 0.12, blot: 0.12, seed: 21, repeat: 6 }), roughness: 0.55, metalness: 0.1 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.95, 0.4); scene.add(floor);
  const ply = canvasTex(1024, 256, (c, w, h) => {
    c.fillStyle = '#a77d4e'; c.fillRect(0, 0, w, h);
    for (let g = 0; g < 70; g++) {
      c.strokeStyle = `rgba(70,42,20,${0.06 + rnd(g, 2) * 0.12})`; c.lineWidth = 1 + rnd(g, 3) * 3;
      const gy = rnd(g, 4) * h; c.beginPath(); c.moveTo(0, gy);
      for (let x = 0; x <= w; x += 48) c.lineTo(x, gy + Math.sin(x * 0.008 + g) * 6 + Math.sin(x * 0.03 + g * 2) * 1.5);
      c.stroke();
    }
    for (let q = 0; q < 6; q++) { const g = c.createRadialGradient(0, 0, 0, 0, 0, 1); g.addColorStop(0, 'rgba(60,34,16,0.35)'); g.addColorStop(1, 'rgba(60,34,16,0)'); c.save(); c.translate(rnd(q, 7) * w, rnd(q, 8) * h); c.scale(18, 9); c.fillStyle = g; c.fillRect(-1, -1, 2, 2); c.restore(); }
  });
  const top = mesh(new RoundedBoxGeometry(3.6, 0.06, 0.9, 2, 0.02), std(0xffffff, { map: ply.tex, roughness: 0.55 }));
  top.position.set(0, -0.03, 0); scene.add(top);
  const body = mesh(new THREE.BoxGeometry(3.5, 0.89, 0.84), std(0x1d2026, { roughness: 0.6, metalness: 0.2 }));
  body.position.set(0, -0.505, 0); scene.add(body);

  // ----------------------------------------------------------- the pitch
  const board = mesh(new RoundedBoxGeometry(1.2, 0.012, 0.86, 2, 0.005), std(0x1c1d22, { roughness: 0.45, metalness: 0.1 }));
  board.position.set(0, 0.006, 0); scene.add(board);
  const cards = CARDS.map((_, i) => {
    const g = new THREE.Group();
    g.add(mesh(new RoundedBoxGeometry(0.52, 0.006, 0.36, 2, 0.003), std(0xd8cfbd, { roughness: 0.8 })));
    const f = new THREE.Mesh(new THREE.PlaneGeometry(0.515, 0.355), std(0xffffff, { map: cardFace(i).tex, roughness: 0.72 }));
    f.rotation.x = -Math.PI / 2; f.position.y = 0.0032; f.receiveShadow = true; g.add(f);
    scene.add(g);
    return g;
  });
  // Ink left by the stamp, rotated like a hand stamp.
  const inkTex = canvasTex(820, 270, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.strokeStyle = '#d4441c'; c.lineWidth = 12; roundRect(c, 16, 16, w - 32, h - 32, 22); c.stroke();
    c.lineWidth = 4; roundRect(c, 36, 36, w - 72, h - 72, 14); c.stroke();
    c.fillStyle = '#d4441c'; c.font = `900 118px ${F}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.fillText('ACCOUNT WON', w / 2, h / 2 + 6);
    // Worn rubber: knock pixels out so the print reads as ink, not a sticker.
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 2600; i++) { c.fillStyle = `rgba(0,0,0,${0.3 + rnd(i, 3) * 0.7})`; c.fillRect(rnd(i, 1) * w, rnd(i, 2) * h, 1 + rnd(i, 4) * 3, 1 + rnd(i, 5) * 2); }
    c.globalCompositeOperation = 'source-over';
  });
  const ink = new THREE.Mesh(new THREE.PlaneGeometry(0.86, 0.283), std(0xffffff, { map: inkTex.tex, transparent: true, opacity: 0, roughness: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 }));
  ink.rotation.set(-Math.PI / 2, 0, 0.17); ink.position.set(0, 0.024, 0); ink.receiveShadow = true; scene.add(ink);

  // The stamp: rubber block, wooden handle.
  const stamp = new THREE.Group();
  const rubber = mesh(new RoundedBoxGeometry(0.66, 0.05, 0.24, 2, 0.01), std(0x6f1d12, { roughness: 0.7 })); rubber.position.y = 0.025; stamp.add(rubber);
  const blockS = mesh(new RoundedBoxGeometry(0.68, 0.07, 0.26, 2, 0.015), std(0x2a1a10, { roughness: 0.45, metalness: 0.1 })); blockS.position.y = 0.085; stamp.add(blockS);
  const wood = std(0x8a5a32, { roughness: 0.5 });
  const handle = mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 20), wood); handle.position.y = 0.22; stamp.add(handle);
  const knob = mesh(new THREE.SphereGeometry(0.075, 24, 16), wood); knob.position.y = 0.35; knob.scale.y = 0.8; stamp.add(knob);
  stamp.rotation.y = 0.17; scene.add(stamp);
  const shock = new THREE.Mesh(new THREE.RingGeometry(0.92, 1, 64), new THREE.MeshBasicMaterial({ color: 0xff8a4a, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  shock.rotation.x = -Math.PI / 2; shock.position.y = 0.03; scene.add(shock);
  const flash = glow(0xffb27a, 1.4, 0, 0.3); flash.position.set(0, 0.08, 0); scene.add(flash);

  // ----------------------------------------------------------- the 3D logo: chrome ring, orange deck across it
  const logo = new THREE.Group();
  const ringS = new THREE.Shape(); ringS.absarc(0, 0, 0.5, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absarc(0, 0, 0.34, 0, Math.PI * 2, true); ringS.holes.push(hole);
  const ringG = new THREE.ExtrudeGeometry(ringS, { depth: 0.12, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.03, bevelSegments: 3, curveSegments: 48 });
  ringG.translate(0, 0, -0.06);
  logo.add(mesh(ringG, std(0xc9ced6, { metalness: 1, roughness: 0.2, envMapIntensity: 1.4 })));
  const pill = new THREE.Shape();
  const PW = 0.48, PH = 0.12;
  pill.moveTo(-PW + PH, -PH); pill.lineTo(PW - PH, -PH); pill.absarc(PW - PH, 0, PH, -Math.PI / 2, Math.PI / 2, false);
  pill.lineTo(-PW + PH, PH); pill.absarc(-PW + PH, 0, PH, Math.PI / 2, Math.PI * 1.5, false);
  const pillG = new THREE.ExtrudeGeometry(pill, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.025, bevelSize: 0.02, bevelSegments: 3, curveSegments: 20 });
  pillG.translate(0, 0, -0.08);
  const deckM = mesh(pillG, std(0xe8622c, { metalness: 0.35, roughness: 0.28, emissive: 0x3a1004, emissiveIntensity: 0.6 }));
  deckM.rotation.z = 0.6; logo.add(deckM);
  scene.add(logo);
  const logoGlow = glow(0x7fd6e0, 0.9, 0, 0.4); scene.add(logoGlow);

  // ----------------------------------------------------------- shoeboxes on the counter (instanced)
  const boxBody = new THREE.InstancedMesh(new RoundedBoxGeometry(0.4, 0.115, 0.27, 2, 0.008), std(0xd8582a, { roughness: 0.55 }), BOX.length);
  const boxLid = new THREE.InstancedMesh(new RoundedBoxGeometry(0.41, 0.032, 0.28, 2, 0.006), std(0x1e1f24, { roughness: 0.5 }), BOX.length);
  [boxBody, boxLid].forEach((b) => { b.castShadow = true; b.receiveShadow = true; b.frustumCulled = false; scene.add(b); });

  // ----------------------------------------------------------- the storefront wall
  const wallM = std(0xffffff, { map: grainTex('#262b33', { size: 256, speck: 0.08, blot: 0.1, seed: 31, repeat: 3 }), roughness: 0.85 });
  // [x0, x1, y0, y1]: around a window x -1.5..0.9, y -0.45..0.95 and a door x 1.25..2.05.
  [[-3.4, -1.5, -0.95, 0.95], [0.9, 1.25, -0.95, 0.95], [2.05, 3.4, -0.95, 0.95], [-3.4, 3.4, 0.95, 2.4], [-1.5, 0.9, -0.95, -0.45]].forEach(([x0, x1, y0, y1]) => {
    const w = mesh(new THREE.BoxGeometry(x1 - x0, y1 - y0, 0.12), wallM, { cast: false });
    w.position.set((x0 + x1) / 2, (y0 + y1) / 2, -2.6); scene.add(w);
  });
  const ledge = mesh(new THREE.BoxGeometry(2.5, 0.04, 0.36), std(0x3a3f47, { roughness: 0.4, metalness: 0.3 }));
  ledge.position.set(-0.3, -0.45, -2.38); scene.add(ledge);
  const glassM = std(0x14222c, { transparent: true, opacity: 0.2, roughness: 0.05, metalness: 0.7, depthWrite: false });
  const win = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), glassM); win.position.set(-0.3, 0.25, -2.6); scene.add(win);
  const door = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.9), glassM); door.position.set(1.65, 0, -2.6); scene.add(door);
  const bar = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.6, 12), std(0xb9bec6, { metalness: 1, roughness: 0.3 }), { cast: false });
  bar.rotation.z = Math.PI / 2; bar.position.set(1.65, 0.0, -2.55); scene.add(bar);
  // Rain on the glass: beads and runs, scrolled by t.
  const wet = canvasTex(256, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let i = 0; i < 140; i++) { const x = rnd(i, 1) * w, y = rnd(i, 2) * h, r = 1 + rnd(i, 3) * 2.6; c.fillStyle = `rgba(190,220,255,${0.25 + rnd(i, 4) * 0.5})`; c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
    for (let i = 0; i < 26; i++) { const x = rnd(i, 5) * w, y = rnd(i, 6) * h, l = 30 + rnd(i, 7) * 110; const g = c.createLinearGradient(0, y, 0, y + l); g.addColorStop(0, 'rgba(190,220,255,0)'); g.addColorStop(1, 'rgba(190,220,255,0.55)'); c.strokeStyle = g; c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.sin(i) * 3, y + l); c.stroke(); }
  });
  wet.tex.wrapS = wet.tex.wrapT = THREE.RepeatWrapping; wet.tex.repeat.set(2.2, 1.3);
  const wetM = new THREE.MeshBasicMaterial({ map: wet.tex, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const wetW = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.4), wetM); wetW.position.set(-0.3, 0.25, -2.585); scene.add(wetW);

  // Window display: the release sneaker turning on a plinth, two decks leaning on the glass.
  const plinth = mesh(new THREE.CylinderGeometry(0.17, 0.19, 0.18, 40), std(0x101216, { roughness: 0.25, metalness: 0.5 }));
  plinth.position.set(-0.3, -0.34, -2.36); scene.add(plinth);
  const shoe = new THREE.Group();
  const soleS = new THREE.Shape();
  soleS.moveTo(-0.23, 0); soleS.lineTo(0.2, 0); soleS.quadraticCurveTo(0.265, 0, 0.265, 0.035); soleS.quadraticCurveTo(0.262, 0.06, 0.225, 0.06);
  soleS.lineTo(-0.235, 0.06); soleS.quadraticCurveTo(-0.262, 0.06, -0.262, 0.03); soleS.quadraticCurveTo(-0.262, 0, -0.23, 0);
  const soleG = new THREE.ExtrudeGeometry(soleS, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.008, bevelSegments: 2, curveSegments: 12 }); soleG.translate(0, 0, -0.08);
  shoe.add(mesh(soleG, std(0xb88450, { roughness: 0.6 })));
  const upS = new THREE.Shape();
  upS.moveTo(-0.245, 0.055); upS.lineTo(-0.25, 0.17); upS.quadraticCurveTo(-0.25, 0.235, -0.19, 0.235); upS.quadraticCurveTo(-0.12, 0.2, -0.06, 0.215);
  upS.lineTo(0.0, 0.26); upS.quadraticCurveTo(0.03, 0.27, 0.05, 0.235); upS.quadraticCurveTo(0.14, 0.15, 0.21, 0.11); upS.quadraticCurveTo(0.255, 0.09, 0.25, 0.055); upS.lineTo(-0.245, 0.055);
  const upG = new THREE.ExtrudeGeometry(upS, { depth: 0.13, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.018, bevelSegments: 3, curveSegments: 12 }); upG.translate(0, 0, -0.065);
  shoe.add(mesh(upG, std(0x3f7f86, { roughness: 0.85 })));
  const guardS = new THREE.Shape();
  guardS.moveTo(-0.248, 0.055); guardS.lineTo(-0.249, 0.105); guardS.lineTo(0.215, 0.105); guardS.quadraticCurveTo(0.255, 0.09, 0.252, 0.055); guardS.lineTo(-0.248, 0.055);
  const guardG = new THREE.ExtrudeGeometry(guardS, { depth: 0.136, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.019, bevelSegments: 3, curveSegments: 10 }); guardG.translate(0, 0, -0.068);
  shoe.add(mesh(guardG, std(0x1d2a33, { roughness: 0.6 })));
  shoe.position.set(-0.3, -0.25, -2.36); shoe.scale.setScalar(1.1); scene.add(shoe);
  const deckTex = canvasTex(128, 512, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.save(); roundRect(c, 2, 2, w - 4, h - 4, 60); c.clip();
    c.fillStyle = INK; c.fillRect(0, 0, w, h);
    [ORANGE, CREAM, TEAL].forEach((col, j) => { c.fillStyle = col; c.fillRect(0, 140 + j * 70, w, 44); });
    c.fillStyle = 'rgba(241,228,204,0.8)'; c.beginPath(); c.arc(w / 2, 420, 26, 0, 7); c.fill();
    c.restore();
  });
  const decks = new THREE.InstancedMesh(new RoundedBoxGeometry(0.2, 0.8, 0.014, 1, 0.006), std(0xffffff, { map: deckTex.tex, alphaTest: 0.5, roughness: 0.5 }), 2);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3(), e4 = new THREE.Euler();
  [[-1.25, 0.08], [0.62, -0.1]].forEach(([x, rz], i) => { q4.setFromEuler(e4.set(-0.14, 0, rz)); decks.setMatrixAt(i, m4.compose(p4.set(x, -0.04, -2.47), q4, s4.set(1, 1, 1))); });
  decks.frustumCulled = false; scene.add(decks);

  // The shop sign over the window, unlit until the logo lands in it.
  const signTex = canvasTex(1024, 160, (c, w, h) => {
    c.fillStyle = '#1b120c'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,170,100,0.35)'; c.lineWidth = 3; roundRect(c, 6, 6, w - 12, h - 12, 18); c.stroke();
    c.fillStyle = '#0c0806'; c.beginPath(); c.arc(110, h / 2, 64, 0, 7); c.fill();
    const T = 'OLYMPIA SKATE SHOP';
    let fs = 76; do { c.font = `800 ${fs}px ${F}`; } while (c.measureText(T).width > 760 && --fs > 30);
    c.textBaseline = 'middle'; c.shadowColor = 'rgba(255,140,60,0.9)'; c.shadowBlur = 18;
    c.fillStyle = '#ffe7c4'; c.fillText(T, 210, h / 2 + 2);
    c.shadowBlur = 0; c.fillStyle = ORANGE; c.fillRect(210, h - 30, 150, 6);
  });
  const signBox = mesh(new RoundedBoxGeometry(2.12, 0.38, 0.07, 2, 0.015), std(0x14161a, { metalness: 0.6, roughness: 0.4 }), { cast: false });
  signBox.position.set(-0.3, 1.32, -2.5); scene.add(signBox);
  const signFace = new THREE.Mesh(new THREE.PlaneGeometry(2.04, 0.32), new THREE.MeshBasicMaterial({ map: signTex.tex, toneMapped: false, color: 0x202020 }));
  signFace.position.set(-0.3, 1.32, -2.462); scene.add(signFace);
  const signGlow = glow(0xff9a50, 2.6, 0, 0.5); signGlow.position.set(-0.3, 1.32, -2.42); signGlow.scale.set(3.2, 0.9, 1); scene.add(signGlow);

  // ----------------------------------------------------------- outside: wet street, rain, the line
  const street = mesh(new THREE.PlaneGeometry(14, 8), std(0xffffff, { map: grainTex('#14181e', { size: 256, speck: 0.08, blot: 0.14, seed: 41, repeat: 8 }), roughness: 0.16, metalness: 0.55 }), { cast: false });
  street.rotation.x = -Math.PI / 2; street.position.set(0, -0.951, -6.7); scene.add(street);
  const facade = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#0a0d13'; c.fillRect(0, 0, w, h);
    for (let r = 0; r < 4; r++) for (let q = 0; q < 12; q++) {
      const on = rnd(r * 12 + q, 3) > 0.62;
      c.fillStyle = on ? (rnd(q, r) > 0.5 ? 'rgba(255,196,120,0.85)' : 'rgba(150,200,255,0.6)') : 'rgba(30,36,48,1)';
      c.fillRect(14 + q * 41, 28 + r * 54, 26, 32);
    }
  });
  const across = new THREE.Mesh(new THREE.PlaneGeometry(16, 8), new THREE.MeshBasicMaterial({ map: facade.tex, color: 0x9a9a9a }));
  across.position.set(0, 2.6, -10.5); scene.add(across);
  const pole = mesh(new THREE.CylinderGeometry(0.035, 0.05, 3.2, 12), std(0x1a1d22, { metalness: 0.7, roughness: 0.4 }), { cast: false });
  pole.position.set(-2.5, 0.65, -5.6); scene.add(pole);
  const lampL = new THREE.PointLight(0x8cc8ff, 6, 7, 1.5); lampL.position.set(-2.3, 2.15, -5.6); scene.add(lampL);
  const lampG = glow(0xa6d4ff, 1.3, 0.9, 0.3); lampG.position.copy(lampL.position); scene.add(lampG);
  // Its streak on the wet road: a flat additive smear running toward the camera.
  const lampR = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 3.2), new THREE.MeshBasicMaterial({ map: lampG.material.map, color: 0x8cc8ff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  lampR.rotation.x = -Math.PI / 2; lampR.position.set(-2.3, -0.945, -4.4); scene.add(lampR);
  const RN = 420, rpos = new Float32Array(RN * 6);
  const rGeo = new THREE.BufferGeometry(); rGeo.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  const rain = new THREE.LineSegments(rGeo, new THREE.LineBasicMaterial({ color: 0x9cc8ff, transparent: true, opacity: 0.38, depthWrite: false }));
  rain.frustumCulled = false; scene.add(rain);
  // The release-day line: six people in hoodies and beanies, hands in pockets, shuffling up in the rain.
  const PN = 6;
  const crowd = makeCrowd(scene, [
    { skin: 0xc68b68, top: 0x2a2f3a, pants: 0x1c1f26, hair: 0xd8582a, shoe: 0xe9e4da, chest: 0.15 },
    { skin: 0x8a5a3e, top: 0x3a2a2c, pants: 0x23262d, hair: 0x15100d, shoe: 0x1b1d20, chest: 0.146 },
    { skin: 0xe2b08e, top: 0x2f3a33, pants: 0x2a2620, hair: 0x2f7f86, shoe: 0xf2efe8, bun: true, chest: 0.138 },
    { skin: 0x5e3a28, top: 0x1f2430, pants: 0x30343c, hair: 0x0e0b0a, shoe: 0xe9e4da, chest: 0.152 },
    { skin: 0xd6a083, top: 0x3b3426, pants: 0x1c1f26, hair: 0x1b1d22, shoe: 0x1b1d20, chest: 0.144 },
    { skin: 0xa86e4a, top: 0x26303d, pants: 0x262a33, hair: 0x4a2a1a, shoe: 0xd9b13b, chest: 0.148 },
  ]);
  const WV = (x, y, z) => new THREE.Vector3(x, y, z);
  const root = WV(0, 0, 0), hipP = WV(0, 0, 0), look = WV(0, 0, 0), Fw = WV(0, 0, 0), Sw = WV(0, 0, 0), tmpv = WV(0, 0, 0);
  const GROUND = -0.95, PS = 0.94;

  // ----------------------------------------------------------- payoff card
  const endTex = canvasTex(1024, 200, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(12,14,18,0.84)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
    c.strokeStyle = 'rgba(232,98,44,0.95)'; c.lineWidth = 4; c.stroke();
    c.fillStyle = ORANGE; c.font = `700 26px ${M}`; c.textBaseline = 'middle';
    if ('letterSpacing' in c) c.letterSpacing = '4px';
    c.fillText('OLYMPIA SKATE SHOP', 52, 52);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = CREAM; c.font = `800 60px ${F}`; c.fillText('Winning a Nike SB account', 50, 128);
  });
  const endCard = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.41), new THREE.MeshBasicMaterial({ map: endTex.tex, transparent: true, opacity: 0, toneMapped: false, depthWrite: false }));
  endCard.renderOrder = 5; scene.add(endCard);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.15, 1.2, 1.55]], [2.3, [0.08, 1.08, 1.38], (x) => x],
    [3.4, [0.26, 0.92, 1.25]], [4.35, [0.2, 0.88, 1.2], (x) => x],
    [5.9, [0.78, 0.78, 2.25]], [8.4, [0.64, 0.72, 2.0], (x) => x],
    [10, [0.7, 0.8, 2.3]],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.02, 0, -0.08]], [2.3, [0.08, 0.02, -0.06], (x) => x],
    [3.4, [0.24, 0.16, -0.06]], [4.35, [0.16, 0.1, -0.04], (x) => x],
    [5.9, [0.2, 0.38, -2.2]], [8.4, [0.18, 0.4, -2.2], (x) => x],
    [10, [0.14, 0.38, -2.0]],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3();
  const bez = (p0, p1, p2, e, out) => out.set(
    (1 - e) * (1 - e) * p0.x + 2 * (1 - e) * e * p1.x + e * e * p2.x,
    (1 - e) * (1 - e) * p0.y + 2 * (1 - e) * e * p1.y + e * e * p2.y,
    (1 - e) * (1 - e) * p0.z + 2 * (1 - e) * e * p1.z + e * e * p2.z,
  );
  const lp = new THREE.Vector3();

  function update(t) {
    const di = t - IMPACT, hit = di > 0 ? Math.exp(-9 * di) : 0;
    const p = camPos(t), q = camTgt(t);
    const shake = 0.014 * hit * Math.sin(di * 70);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008 + shake, p[1] + Math.sin(t * 1.6 + 1) * 0.005 - shake * 0.6, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [3.4, 33], [4.35, 33], [5.9, 36], [10, 35]]);
    camera.updateProjectionMatrix();
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the crew deals the pitch, card by card, onto the folder.
    cards.forEach((g, i) => {
      const [sx, sz] = SLOT[i];
      const f = eio(k(t, DEAL[i], DEAL[i] + 0.55)), land = spring(k(t, DEAL[i] + 0.45, DEAL[i] + 1.0));
      a.set(sx + 0.95, 0.42, sz + 0.85); b.set(sx, 0.016, sz); mid.set(sx + 0.35, 0.5, sz + 0.3);
      bez(a, mid, b, f, g.position);
      g.position.y += (1 - land) * 0.02 * (f >= 1 ? 1 : 0) + (di > 0 ? 0.008 * hit * Math.abs(Math.sin(di * 40)) : 0);
      g.rotation.set((1 - f) * -0.5, (1 - f) * (0.9 + i * 0.15) + (rnd(i, 3) - 0.5) * 0.05, (1 - f) * 0.3);
      g.visible = t > DEAL[i];
    });

    // Beat 2: the 3D logo rises out of its card in chrome and hovers, spinning.
    const rise = eo(k(t, 2.3, 3.1)), fly = eio(k(t, 4.55, 5.6));
    const spin = kf(t, [[2.3, 0], [4.55, 5.4, (x) => x], [5.6, 4 * Math.PI, eo]]);
    a.set(SLOT[3][0], 0.02, SLOT[3][1]); b.set(HOVER[0], HOVER[1] + Math.sin(t * 2.2) * 0.012, HOVER[2]);
    lp.lerpVectors(a, b, rise);
    if (fly > 0) { a.copy(lp); b.set(...SOCKET); mid.set(-0.25, 1.55, -0.9); bez(a, mid, b, fly, lp); }
    logo.position.copy(lp);
    logo.rotation.set(lerp(-Math.PI / 2, 0, rise) * (1 - fly), spin, 0);
    logo.scale.setScalar(Math.max(0.001, lerp(0.12, 0.34, back(k(t, 2.3, 2.9))) * lerp(1, 0.84, fly)));
    logo.visible = t > 2.3;
    logoGlow.position.copy(lp); logoGlow.material.opacity = 0.55 * rise * (1 - fly * 0.6) * (t > 2.3 ? 1 : 0);

    // The stamp: comes down, winds up, slams, lifts away. The ink stays.
    stamp.position.set(0, kf(t, [[3.15, 1.4], [3.55, 0.34, eo], [3.66, 0.42, eo], [IMPACT, 0, ei], [4.02, 0, (x) => x], [4.55, 1.5, ei]]), 0);
    const sq = di > 0 ? 1 - 0.16 * Math.exp(-14 * di) * Math.cos(di * 30) : 1;
    stamp.scale.set(1 + (1 - sq) * 0.5, sq, 1 + (1 - sq) * 0.5);
    stamp.visible = t > 3.15 && t < 4.6;
    ink.material.opacity = di > 0 ? 0.92 * eo(k(t, IMPACT, IMPACT + 0.06)) : 0;
    const sw = k(t, IMPACT, IMPACT + 0.55);
    shock.scale.setScalar(0.3 + 0.9 * eo(sw)); shock.material.opacity = di > 0 ? 0.55 * (1 - sw) : 0; shock.visible = di > 0 && sw < 1;
    flash.material.opacity = 0.85 * hit;

    // Beat 3: the logo lands in the sign; the sign flickers on, the window lights up.
    const fk = k(t, 5.55, 5.95);
    const sign = t < 5.55 ? 0 : fk >= 1 ? 1 : (rnd(Math.floor(t * 16), 7) > 0.45 ? 0.35 + fk * 0.65 : 0.12);
    signFace.material.color.setScalar(lerp(0.12, 1, sign));
    signGlow.material.opacity = 0.5 * sign;
    signL.intensity = 3.2 * sign;
    const open = eo(k(t, 4.9, 5.7));
    shoeL.intensity = 9 * open; spill.intensity = 2.4 * open;
    shoe.rotation.y = 0.5 + t * 0.32;

    // The line moves up and through the door, one customer at a time: a few shuffling steps each time
    // someone goes in, then a turn and a walk to the door.
    for (let pI = 0; pI < PN; pI++) {
      let slot = pI;
      for (let j = 0; j < pI; j++) slot -= eio(k(t, ENTER[j] + 0.05, ENTER[j] + 0.5));
      const w = eio(k(t, ENTER[pI], ENTER[pI] + 0.5));
      const x0 = 0.95 - 0.6 * slot;
      const x = lerp(x0, DOOR[0], w), z = lerp(QZ, DOOR[1], w);
      const gone = w >= 0.97;
      const sc = gone ? 0 : PS * (0.95 + rnd(pI, 3) * 0.1);
      // Distance walked so far drives the step cycle.
      const dist = (pI - slot) * 0.6 + w * Math.hypot(DOOR[0] - x0, DOOR[1] - QZ);
      const moving = clamp(Math.abs(slot - Math.round(slot)) * 6 + Math.sin(Math.PI * w) * 2);
      const ph = dist / sc * Math.PI / 0.62 + pI;
      const yaw = lerp(Math.PI / 2, Math.atan2(DOOR[0] - x0, DOOR[1] - QZ), eio(clamp(w * 2)));
      Fw.set(Math.sin(yaw), 0, Math.cos(yaw)); Sw.set(Math.cos(yaw), 0, -Math.sin(yaw));
      root.set(x, GROUND, z);
      const sway = Math.sin(t * 0.9 + pI * 1.7);
      hipP.copy(root).add(tmpv.set(0, 0.93 + 0.02 * moving * Math.abs(Math.cos(ph)), 0)).addScaledVector(Sw, 0.02 * sway * (1 - moving) + 0.02 * Math.sin(ph) * moving);
      // Hunched against the rain; some watch the shop sign, some their feet.
      look.copy(hipP).addScaledVector(Fw, 2.5).add(tmpv.set(0, pI % 2 ? 0.2 : 1.1, 0)).addScaledVector(Sw, Math.sin(pI * 2.3));
      crowd.pose(pI, { t, sc, root,
        hip: hipP, yaw, lean: 0.1 + 0.06 * moving, tilt: 0.03 * sway, look, nod: 0.04,
        kneePole: tmpv.copy(hipP).addScaledVector(Fw, 1),
        feet: (f, out) => {
          const sg = f ? 1 : -1, s2 = Math.sin(ph + (f ? Math.PI : 0));
          out.copy(root).addScaledVector(Sw, sg * 0.1).addScaledVector(Fw, (f ? 0.03 : -0.03) * (1 - moving) + 0.2 * s2 * moving);
          out.y = root.y + 0.085 + 0.07 * Math.max(0, Math.cos(ph + (f ? Math.PI : 0))) * moving;
          return root.y;
        },
        hands: (h, sh, out) => {
          // Hands in the hoodie pocket, swinging out a little when they walk.
          const sg = h ? 1 : -1;
          out.copy(hipP).add(tmpv.set(0, 0.12, 0)).addScaledVector(Fw, 0.17).addScaledVector(Sw, sg * 0.05);
          const sw = Math.sin(ph + (h ? 0 : Math.PI));
          out.lerp(tmpv.copy(sh).add(WV(0, -0.5, 0)).addScaledVector(Sw, sg * 0.06).addScaledVector(Fw, 0.16 * sw), moving * 0.6);
        },
      });
    }
    crowd.commit();

    // Each sale takes a shoebox off the counter and out the door.
    BOX.forEach(([bx, row], j) => {
      const S = ENTER[j] + 0.15;
      const lift = back(k(t, S, S + 0.22)), f = eio(k(t, S + 0.12, S + 0.7));
      a.set(bx, 0.0575 + row * 0.15 + lift * 0.12, -0.26); b.set(1.55, 0.3, -2.45); mid.set((bx + 1.55) / 2, 0.85, -1.2);
      bez(a, mid, b, f, lp);
      const s = f >= 1 ? 0.0001 : 1 - 0.55 * f;
      q4.setFromEuler(e4.set(f * 0.7, (rnd(j, 2) - 0.5) * 0.08 + f * 1.4, lift * 0.05 * (1 - f)));
      boxBody.setMatrixAt(j, m4.compose(p4.copy(lp), q4, s4.setScalar(s)));
      mid.set(0, 0.07, 0).applyQuaternion(q4).multiplyScalar(s);
      boxLid.setMatrixAt(j, m4.compose(p4.copy(lp).add(mid), q4, s4.setScalar(s)));
    });
    boxBody.instanceMatrix.needsUpdate = true; boxLid.instanceMatrix.needsUpdate = true;

    // Rain falling past the window, and running down the glass.
    for (let i = 0; i < RN; i++) {
      const x = -3.2 + rnd(i, 1) * 6.4, z = -2.75 - rnd(i, 2) * 3.8, H = 3.8;
      const y = 2.6 - ((rnd(i, 3) * H + t * 3.4) % H);
      rpos.set([x, y, z, x + 0.012, y + 0.1, z], i * 6);
    }
    rGeo.attributes.position.needsUpdate = true;
    wet.tex.offset.set(0, (t * 0.035) % 1);

    // Beat 4: the line is gone, the boxes are gone; the title lands.
    const e = back(k(t, 8.5, 9.0));
    endCard.position.set(0.1, 0.6 + (1 - clamp(e)) * -0.06, -1.05);
    endCard.lookAt(camera.position);
    endCard.scale.setScalar(Math.max(0.001, 0.92 + 0.08 * e));
    endCard.material.opacity = clamp(e);
    endCard.visible = e > 0.01;
  }

  return { scene, camera, update, duration: D, poster: 6.7 };
}
