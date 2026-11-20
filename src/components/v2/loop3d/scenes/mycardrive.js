// GM Lab313 MyCarDrive lit loop, 10 s. "Who is the customer really talking to?"
// A research room in morning light, slatted by window blinds. Thirteen hypotheses are pinned to a felt
// board under the four parts of the prototype, written down before anyone was interviewed. Testing
// stamps them one by one: seven supported, six challenged. On the desk the prototype's Dealer Messenger
// wakes: "Who am I talking to?", and the sender flickers between salesperson and call center. Red string
// runs from every miss to one card: the hardest design problem was trust.
import {
  THREE, k, kf, lerp, eo, eo5, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, phone, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const GREEN = '#1f8a4a', RED = '#c8322a', INK = '#1d232b';
const HEAD = ['OVERALL EXPERIENCE', 'BEST PRICE', 'DEALER MESSENGER', 'MYDOCS'];
const COLX = [-1.5, -0.78, 0.78, 1.5];
const ROWY = [2.14, 1.74, 1.34, 0.94];
const CW = 0.6, CH = 0.36;
// The 13 written hypotheses, by part of the prototype, and whether testing supported them.
const HYP = [
  [0, 'Customers find it intuitive and helpful', 1],
  [0, 'They trust it matches what a dealer would say', 0],
  [0, 'They feel in control of the process', 1],
  [0, 'It makes the process clearer and shows the next step', 1],
  [1, 'The pricing tool feels easy to use', 0],
  [1, 'It builds confidence in getting the best price', 1],
  [1, "The online price is the price they'll pay", 0],
  [2, "They know who they're talking to", 0],
  [2, "They're comfortable negotiating by message", 1],
  [2, 'They know they can message at any point', 0],
  [3, "They'll upload documents before visiting", 0],
  [3, 'They want control over who sees documents', 1],
  [3, 'They feel confident their data is secure', 1],
];
const CARDS = (() => { const row = [0, 0, 0, 0]; return HYP.map(([col, text, yes], i) => ({ col, text, yes, id: 'H' + (i + 1), x: COLX[col], y: ROWY[row[col]++] })); })();
const PIN = CARDS.map((_, i) => 0.35 + i * 0.12);          // pinned up, one by one
const STAMP = CARDS.map((_, i) => 2.5 + i * 0.165);       // tested, one by one
const MISSES = CARDS.map((c, i) => (c.yes ? -1 : i)).filter((i) => i >= 0);
const STRING = MISSES.map((_, j) => 7.95 + j * 0.12);
const MSG = 'Who am I talking to?';
const TALLY = [0, 2.0, 0.8, 0.52], TRUST = [0, 1.12, 0.86, 0.56];

function wrap(c, text, x, y, maxW, lh) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (c.measureText(test).width > maxW && line) { c.fillText(line, x, y); line = w; y += lh; } else line = test;
  }
  if (line) c.fillText(line, x, y);
}
// Paper index card that curls off the board a little at the bottom.
function cardGeo(w, h, curl) {
  const g = new THREE.PlaneGeometry(w, h, 1, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) { const f = (h / 2 - p.getY(i)) / h; p.setZ(i, curl * f * f); }
  g.computeVertexNormals();
  return g;
}
function cardFace(card) {
  return canvasTex(512, 308, (c, w, h) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(70,130,200,0.28)'; c.lineWidth = 2;
    for (let y = 104; y < h; y += 42) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    c.strokeStyle = 'rgba(210,70,70,0.55)'; c.beginPath(); c.moveTo(0, 66); c.lineTo(w, 66); c.stroke();
    c.textBaseline = 'alphabetic';
    c.fillStyle = '#6b7380'; c.font = `700 28px ${MONO}`; c.fillText(card.id, 26, 48);
    c.fillStyle = INK; c.font = `600 33px ${SANS}`; wrap(c, card.text, 26, 136, w - 52, 42);
    c.fillStyle = 'rgba(0,0,0,0.05)'; c.fillRect(0, h - 4, w, 4);
  });
}
function stampTex(ok) {
  return canvasTex(512, 170, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    const col = ok ? GREEN : RED;
    c.strokeStyle = col; c.lineWidth = 10; roundRect(c, 14, 14, w - 28, h - 28, 22); c.stroke();
    c.fillStyle = col; c.font = `800 62px ${SANS}`; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillText(ok ? 'SUPPORTED' : 'CHALLENGED', w / 2, h / 2 + 4);
    c.globalCompositeOperation = 'destination-out';
    for (let i = 0; i < 1100; i++) { c.fillStyle = `rgba(0,0,0,${0.3 + rnd(i, ok ? 3 : 4) * 0.7})`; const s = 1 + rnd(i, 5) * 3; c.fillRect(rnd(i, 6) * w, rnd(i, 7) * h, s, s); }
    c.globalCompositeOperation = 'source-over';
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xcfc6b6);
  scene.fog = new THREE.Fog(0xd8cfbf, 7, 18);
  scene.environment = env;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- room
  const wall = mesh(new THREE.PlaneGeometry(14, 7), std(0xffffff, { map: grainTex('#cfc8ba', { size: 256, speck: 0.06, blot: 0.05, seed: 11, repeat: 3 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 3.5, -0.005); scene.add(wall);
  const floor = mesh(new THREE.PlaneGeometry(14, 10), std(0xffffff, { map: grainTex('#8f877b', { size: 256, speck: 0.1, blot: 0.08, seed: 12, repeat: 6 }), roughness: 0.7 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, 5); scene.add(floor);
  // Felt board in a brushed frame.
  const frame = mesh(new RoundedBoxGeometry(4.1, 2.3, 0.03, 2, 0.012), std(0xb9bcc0, { metalness: 0.9, roughness: 0.35 }));
  frame.position.set(0, 1.55, 0.015); scene.add(frame);
  const board = mesh(new THREE.BoxGeometry(4.0, 2.2, 0.04), std(0xffffff, { map: grainTex('#2b333b', { size: 256, speck: 0.14, blot: 0.06, seed: 5, repeat: 4 }), roughness: 1 }));
  board.position.set(0, 1.55, 0.02); board.castShadow = false; scene.add(board);
  HEAD.forEach((txt, i) => {
    const t = canvasTex(512, 64, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = '#ece7dc'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `800 34px ${SANS}`;
      const s = Math.min(1, (w - 16) / c.measureText(txt).width);
      c.save(); c.translate(w / 2, h / 2 + 2); c.scale(s, 1); c.fillText(txt, 0, 0); c.restore();
    });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.075), std(0xffffff, { map: t.tex, transparent: true, roughness: 0.6 }));
    m.position.set(COLX[i], 2.42, 0.042); scene.add(m);
  });
  // Desk with the prototype on a stand, a notebook and a pen.
  const desk = mesh(new RoundedBoxGeometry(2.0, 0.05, 0.85, 2, 0.012), std(0xe6e1d8, { roughness: 0.45 }));
  desk.position.set(0.85, 0.45, 1.6); scene.add(desk);
  [-0.08, 1.78].forEach((x) => { const l = mesh(new THREE.BoxGeometry(0.04, 0.425, 0.72), std(0x3a3d42, { metalness: 0.6, roughness: 0.4 })); l.position.set(x, 0.2125, 1.6); scene.add(l); });
  const book = mesh(new RoundedBoxGeometry(0.42, 0.024, 0.3, 2, 0.008), std(0x2f5d62, { roughness: 0.7 }));
  book.position.set(0.12, 0.487, 1.68); book.rotation.y = 0.32; scene.add(book);
  const pen = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 12), std(0x1b1d22, { metalness: 0.5, roughness: 0.3 }));
  pen.rotation.set(0, 0.9, Math.PI / 2); pen.position.set(0.42, 0.484, 1.78); scene.add(pen);

  // ----------------------------------------------------------- light: morning sun through blinds
  scene.add(new THREE.HemisphereLight(0xf3efe6, 0x7a6d5c, 0.85));
  const blinds = canvasTex(512, 512, (c, w, h) => {
    c.fillStyle = '#000'; c.fillRect(0, 0, w, h);
    const x0 = 40, x1 = 472, y0 = 30, y1 = 482;
    for (let y = y0; y < y1; y += 34) {
      const g = c.createLinearGradient(0, y, 0, y + 24);
      g.addColorStop(0, 'rgba(255,248,236,0)'); g.addColorStop(0.25, 'rgba(255,248,236,1)'); g.addColorStop(0.8, 'rgba(255,248,236,1)'); g.addColorStop(1, 'rgba(255,248,236,0)');
      c.fillStyle = g; c.fillRect(x0, y, x1 - x0, 24);
    }
    c.fillStyle = '#000'; c.fillRect(w / 2 - 8, y0, 16, y1 - y0);
  }).tex;
  const sun = new THREE.SpotLight(0xffe2b8, 42, 0, 0.5, 0.35, 1.2);
  sun.position.set(-4.0, 3.7, 3.4); sun.target.position.set(0.3, 1.35, 0);
  sun.map = blinds;
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.near = 2; sun.shadow.camera.far = 12; sun.shadow.bias = -0.0002; sun.shadow.normalBias = 0.015;
  scene.add(sun, sun.target);
  const fill = new THREE.DirectionalLight(0xcfe0ff, 0.55); fill.position.set(3, 2, 4); scene.add(fill);

  // ----------------------------------------------------------- the 13 cards
  const cGeo = cardGeo(CW, CH, 0.025);
  const sGeo = new THREE.PlaneGeometry(0.44, 0.146);
  const stampT = [stampTex(false).tex, stampTex(true).tex];
  const cards = CARDS.map((cd, i) => {
    const g = new THREE.Group(); scene.add(g);
    const mat = std(0xffffff, { map: cardFace(cd).tex, roughness: 0.88, transparent: true, side: THREE.DoubleSide });
    const m = mesh(cGeo, mat, { cast: true, receive: true }); g.add(m);
    const sm = std(0xffffff, { map: stampT[cd.yes], transparent: true, depthWrite: false, roughness: 0.7 });
    const st = new THREE.Mesh(sGeo, sm);
    st.position.set(0.02, -0.06, 0.019); st.rotation.set(-0.09, 0, -0.1 + (rnd(i, 8) - 0.5) * 0.22); g.add(st);
    return { g, mat, sm, st, from: [cd.x + (rnd(i, 1) - 0.5) * 0.5, cd.y + 0.2 + rnd(i, 2) * 0.2, 2.6], r0: (rnd(i, 3) - 0.5) * 0.9, r1: (rnd(i, 4) - 0.5) * 0.07 };
  });
  const flashG = glow(0xffffff, 0.7, 0, 0.35); scene.add(flashG);
  const missG = glow(0xff4a3a, 0.9, 0, 0.4); missG.position.set(CARDS[7].x, CARDS[7].y, 0.09); missG.scale.set(1.0, 0.6, 1); scene.add(missG);

  // Tally card in the centre gap, and the one card the misses lead to.
  const tally = canvasTex(512, 333);
  const tallyMat = std(0xffffff, { map: tally.tex, roughness: 0.8, transparent: true, side: THREE.DoubleSide });
  const tallyG = new THREE.Group(); tallyG.add(mesh(cardGeo(TALLY[2], TALLY[3], 0.02), tallyMat)); scene.add(tallyG);
  let tKey = '';
  const drawTally = (t) => {
    const phase = t < 2.5 ? 0 : 1;
    const sup = STAMP.filter((s, i) => t > s && CARDS[i].yes).length, chal = STAMP.filter((s, i) => t > s && !CARDS[i].yes).length;
    const done = t > 4.65;
    const key = [phase, sup, chal, done].join('|');
    if (key === tKey) return; tKey = key;
    tally.redraw((c, w, h) => {
      c.fillStyle = '#1d242c'; c.fillRect(0, 0, w, h);
      c.textBaseline = 'alphabetic';
      if (!phase) {
        c.fillStyle = '#9fb0bf'; c.font = `700 22px ${MONO}`; c.fillText('WE WROTE DOWN WHAT WE BELIEVED', 32, 52);
        c.fillStyle = '#fff'; c.font = `800 150px ${SANS}`; c.fillText('13', 28, 212);
        const nw = c.measureText('13').width;
        c.font = `700 42px ${SANS}`; c.fillText('hypotheses', 44 + nw, 196);
        c.fillStyle = '#c7d0d9'; c.font = `600 26px ${SANS}`; c.fillText('Before talking to anyone', 32, 290);
      } else {
        c.fillStyle = '#9fb0bf'; c.font = `700 22px ${MONO}`; c.fillText('TESTED WITH 10+ CUSTOMERS', 32, 52);
        c.fillStyle = '#3cc274'; c.font = `800 130px ${SANS}`; c.fillText(String(sup), 32, 196);
        c.fillStyle = '#ff6a5c'; c.fillText(String(chal), 272, 196);
        c.font = `700 22px ${MONO}`; c.fillStyle = '#3cc274'; c.fillText('SUPPORTED', 36, 236); c.fillStyle = '#ff6a5c'; c.fillText('CHALLENGED', 276, 236);
        if (done) { c.fillStyle = '#e9edf1'; c.font = `700 28px ${SANS}`; c.fillText("Seven held up. Six didn't.", 32, 296); }
      }
    });
  };
  const trustT = canvasTex(512, 333, (c, w, h) => {
    c.fillStyle = '#fbfaf6'; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(200,50,42,0.9)'; c.fillRect(0, 0, w, 14);
    c.fillStyle = '#5b6370'; c.font = `700 22px ${MONO}`; c.textAlign = 'center'; c.fillText('THE HARDEST DESIGN PROBLEM WAS', w / 2, 70);
    c.fillStyle = RED; c.font = `900 128px ${SANS}`; c.fillText('TRUST', w / 2, 220);
    c.strokeStyle = RED; c.lineWidth = 8; c.lineCap = 'round'; c.beginPath();
    for (let x = 90; x <= w - 90; x += 6) { const y = 258 + Math.sin(x * 0.05) * 4; if (x === 90) c.moveTo(x, y); else c.lineTo(x, y); }
    c.stroke();
  }).tex;
  const trustMat = std(0xffffff, { map: trustT, roughness: 0.85, transparent: true, side: THREE.DoubleSide });
  const trustG = new THREE.Group(); trustG.add(mesh(cardGeo(TRUST[2], TRUST[3], 0.022), trustMat)); scene.add(trustG);
  const trustGlow = glow(0xff6a4a, 1.6, 0, 0.45); trustGlow.position.set(TRUST[0], TRUST[1], 0.035); trustGlow.scale.set(1.9, 1.3, 1); scene.add(trustGlow);
  const trustL = new THREE.PointLight(0xff6a4a, 0, 1.6, 1.8); trustL.position.set(0, 1.12, 0.45); scene.add(trustL);

  // Push pins: one instanced draw for all fifteen.
  const NP = CARDS.length + 2;
  const pins = new THREE.InstancedMesh(new THREE.SphereGeometry(0.02, 16, 12), std(0xffffff, { roughness: 0.3, metalness: 0.1 }), NP);
  const pinCol = [0xe8c547, 0xe9e6df, 0x3b7dd8, 0xe25a3c];
  for (let i = 0; i < NP; i++) pins.setColorAt(i, new THREE.Color(i === NP - 1 ? 0xd2312a : pinCol[Math.floor(rnd(i, 9) * 4)]));
  pins.castShadow = true; pins.frustumCulled = false; scene.add(pins);
  const pinAt = (x, y, h) => new THREE.Vector3(x, y + h / 2 - 0.045, 0.078);
  const PINPOS = [...CARDS.map((c) => pinAt(c.x, c.y, CH)), pinAt(TALLY[0], TALLY[1], TALLY[3]), pinAt(TRUST[0], TRUST[1], TRUST[3])];

  // Red string from every challenged card to TRUST.
  const yarn = std(0xc8202a, { roughness: 0.75 });
  const SEG = 40;
  const strings = MISSES.map((ci) => {
    const a = PINPOS[ci], b = PINPOS[NP - 1];
    const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, -0.1, 0.09));
    const geo = new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(a, mid, b), SEG, 0.0055, 6, false);
    geo.setDrawRange(0, 0);
    const m = mesh(geo, yarn, { cast: true, receive: false }); scene.add(m);
    return m;
  });

  // ----------------------------------------------------------- the prototype: Dealer Messenger
  const ph = phone({ w: 0.33, h: 0.66, d: 0.034, frame: 0xc9ccd2 });
  ph.position.set(0.72, 0.81, 1.48); ph.rotation.x = -0.22; scene.add(ph);
  const standM = std(0x2b2e33, { roughness: 0.5, metalness: 0.4 });
  const sBase = mesh(new THREE.BoxGeometry(0.28, 0.02, 0.2), standM); sBase.position.set(0.72, 0.485, 1.5); scene.add(sBase);
  const sBack = mesh(new THREE.BoxGeometry(0.22, 0.36, 0.015), standM); sBack.position.set(0.72, 0.66, 1.43); sBack.rotation.x = -0.22; scene.add(sBack);
  const sLip = mesh(new THREE.BoxGeometry(0.28, 0.03, 0.03), standM); sLip.position.set(0.72, 0.505, 1.6); scene.add(sLip);
  const UW = 440, UH = Math.round(440 * ph.userData.sh / ph.userData.sw);
  const ui = canvasTex(UW, UH);
  ph.userData.screen.material.map = ui.tex; ph.userData.screen.material.needsUpdate = true;
  const phGlow = glow(0x9cc4ff, 1.2, 0, 0.45); phGlow.position.set(0, 0, -0.06); phGlow.scale.set(0.9, 1.4, 1); ph.add(phGlow);
  const phL = new THREE.PointLight(0xaecbff, 0, 1.4, 2); phL.position.set(0.72, 0.85, 1.75); scene.add(phL);
  let uKey = '';
  const drawUI = (t) => {
    const wake = eo(k(t, 4.95, 5.3));
    const typed = Math.floor(MSG.length * k(t, 5.35, 5.95));
    const sent = back(k(t, 6.0, 6.3));
    const dots = t > 6.25;
    const who = t < 6.15 ? -1 : Math.floor((t - 6.15) / 0.36) % 2;
    const key = [wake > 0 ? 1 : 0, typed, t > 6.0 ? Math.round(sent * 20) : -1, dots ? Math.round(t * 20) : -1, who, wake < 1 ? Math.round(wake * 20) : 20].join('|');
    if (key === uKey) return; uKey = key;
    ui.redraw((c, w, h) => {
      c.fillStyle = '#05070b'; c.fillRect(0, 0, w, h);
      if (wake <= 0) return;
      c.globalAlpha = wake;
      c.fillStyle = '#f3f5f8'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, 178);
      c.fillStyle = '#e1e5ec'; c.fillRect(0, 178, w, 2);
      c.textBaseline = 'middle';
      const pulse = who >= 0 ? 0.5 + 0.5 * Math.sin(t * 9) : 0;
      c.fillStyle = `rgb(${201 + pulse * 30},${206 - pulse * 40},${216 - pulse * 50})`; c.beginPath(); c.arc(64, 112, 40, 0, 7); c.fill();
      c.fillStyle = '#4d5666'; c.font = `800 46px ${SANS}`; c.textAlign = 'center'; c.fillText('?', 64, 114); c.textAlign = 'left';
      c.fillStyle = '#151a22'; c.font = `800 32px ${SANS}`; c.fillText(who < 0 ? 'Dealer' : ['Salesperson?', 'Call center?'][who], 122, 96);
      c.fillStyle = '#7a8394'; c.font = `600 22px ${SANS}`; c.fillText('Dealer Messenger', 122, 134);
      // Sent bubble.
      if (t > 6.0) {
        const s = Math.max(0.01, sent);
        c.font = `600 30px ${SANS}`;
        const bw = c.measureText(MSG).width + 48, bx = w - 24 - bw, by = 250;
        c.save(); c.translate(w - 24, by + 36); c.scale(s, s); c.translate(-(w - 24), -(by + 36));
        c.fillStyle = '#1f6feb'; roundRect(c, bx, by, bw, 72, 30); c.fill();
        c.fillStyle = '#fff'; c.fillText(MSG, bx + 24, by + 38);
        c.restore();
        c.fillStyle = '#9aa3b2'; c.font = `600 18px ${SANS}`; c.textAlign = 'right'; c.fillText('Sent', w - 30, by + 96); c.textAlign = 'left';
      }
      // The other side is typing, and never says who it is.
      if (dots) {
        c.fillStyle = '#e3e7ee'; roundRect(c, 24, 380, 124, 64, 30); c.fill();
        for (let i = 0; i < 3; i++) { const b = Math.max(0, Math.sin(t * 9 - i * 0.9)); c.fillStyle = '#7a8394'; c.beginPath(); c.arc(56 + i * 30, 412 - b * 8, 8, 0, 7); c.fill(); }
      }
      // Input field.
      c.fillStyle = '#ffffff'; roundRect(c, 20, h - 120, w - 110, 72, 36); c.fill();
      c.strokeStyle = '#dde2ea'; c.lineWidth = 2; c.stroke();
      const draft = t < 6.0 ? MSG.slice(0, typed) : '';
      c.fillStyle = draft ? '#151a22' : '#9aa3b2'; c.font = `600 26px ${SANS}`;
      c.fillText(draft || 'Message', 46, h - 83);
      if (draft && Math.floor(t * 4) % 2) { const cw = c.measureText(draft).width; c.fillStyle = '#1f6feb'; c.fillRect(48 + cw, h - 100, 3, 34); }
      c.fillStyle = '#1f6feb'; c.beginPath(); c.arc(w - 52, h - 84, 34, 0, 7); c.fill();
      c.strokeStyle = '#fff'; c.lineWidth = 6; c.beginPath(); c.moveTo(w - 64, h - 84); c.lineTo(w - 40, h - 84); c.moveTo(w - 50, h - 96); c.lineTo(w - 40, h - 84); c.lineTo(w - 50, h - 72); c.stroke();
      c.globalAlpha = 1;
    });
  };

  // ----------------------------------------------------------- dust in the light, and the closing line
  const DN = 200, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffe2b0, size: 0.011, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);
  const cap = canvasTex(1024, 200, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(22,26,32,0.8)'; roundRect(c, 4, 4, w - 8, h - 8, 32); c.fill();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = 'rgba(255,255,255,0.86)'; c.font = `600 36px ${SANS}`; c.fillText("Trust wasn't a feature we could add at the end.", w / 2, 66);
    c.fillStyle = '#ffffff'; c.font = `800 56px ${SANS}`; c.fillText('It was the product.', w / 2, 136);
  });
  const capM = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 0.225), new THREE.MeshBasicMaterial({ map: cap.tex, transparent: true, toneMapped: false, depthWrite: false, depthTest: false }));
  capM.renderOrder = 10; scene.add(capM);

  // ----------------------------------------------------------- camera
  const lin = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.8, 1.6, 5.0]], [2.2, [-0.4, 1.56, 4.6], lin],
    [2.9, [-0.85, 1.62, 3.3]], [4.6, [0.75, 1.55, 3.25], lin],
    [5.7, [1.15, 1.0, 3.05]], [7.2, [1.0, 0.98, 2.9], lin],
    [9.0, [0.0, 1.55, 5.3]], [10, [0.0, 1.57, 5.45], lin],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.2, 1.5, 0]], [2.2, [-0.1, 1.5, 0], lin],
    [2.9, [-0.9, 1.6, 0]], [4.6, [0.9, 1.55, 0], lin],
    [5.7, [0.72, 0.86, 1.45]], [7.2, [0.74, 0.86, 1.45], lin],
    [9.0, [0, 1.3, 0.3]], [10, [0, 1.3, 0.3], lin],
  ]);
  const tgt = new THREE.Vector3();

  // A card flies in from the camera side, slaps onto the board and wobbles on its pin. Returns its fade-in.
  function placeCard(t, g, x, y, P, i, rFrom, rRest, from) {
    const fly = eo5(k(t, P, P + 0.42));
    g.position.set(lerp(from[0], x, fly), lerp(from[1], y, fly), lerp(from[2], 0.045, fly));
    const land = t - (P + 0.3);
    const wob = land > 0 ? Math.sin(land * 26) * 0.05 * Math.exp(-land * 7) : 0;
    g.rotation.set((1 - fly) * 0.5, (1 - fly) * 0.3 * (i % 2 ? 1 : -1), lerp(rFrom, rRest, spring(k(t, P, P + 0.7))) + wob);
    g.scale.setScalar(lerp(0.7, 1, fly));
    g.visible = t > P;
    return clamp((t - P) / 0.08);
  }

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.5 + 1) * 0.006, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.9, 33], [4.6, 33], [5.7, 30], [7.2, 30], [9.0, 34]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    camera.updateMatrixWorld();

    // The sun creeps: the slats slide slowly across the board.
    sun.position.set(-4.0 + t * 0.05, 3.7 - t * 0.02, 3.4);
    sun.intensity = 42 + Math.sin(t * 0.7) * 2;

    // Beat 1: thirteen cards pinned up. Beat 2: each one stamped.
    const dim = eio(k(t, 7.2, 7.7));
    let last = -1;
    cards.forEach((cd, i) => {
      const C = CARDS[i];
      const op = placeCard(t, cd.g, C.x, C.y, PIN[i], i, cd.r0, cd.r1, cd.from);
      const sp = k(t, STAMP[i], STAMP[i] + 0.09), after = t - STAMP[i];
      if (after > 0) {
        last = i;
        const jolt = Math.sin(after * 30) * 0.025 * Math.exp(-after * 9);
        cd.g.rotation.z += jolt; cd.g.position.z -= 0.006 * Math.exp(-after * 14);
      }
      cd.st.scale.setScalar(lerp(1.6, 1, ei(sp)));
      cd.st.visible = after > 0;
      const shade = C.yes ? lerp(1, 0.45, dim) : 1;
      cd.mat.opacity = op; cd.mat.color.setScalar(shade);
      cd.sm.opacity = 0.95 * ei(sp) * op; cd.sm.color.setScalar(shade);
    });
    if (last >= 0) {
      const C = CARDS[last], a = t - STAMP[last];
      flashG.position.set(C.x, C.y - 0.06, 0.1);
      flashG.material.color.set(C.yes ? 0x6dffa6 : 0xff6a5c);
      flashG.material.opacity = 0.85 * Math.exp(-a * 7);
      flashG.visible = a < 0.8;
    } else flashG.visible = false;
    const tOp = placeCard(t, tallyG, TALLY[0], TALLY[1], 1.95, 1, -0.3, 0.015, [0.1, 2.4, 2.6]);
    tallyMat.opacity = tOp;
    drawTally(t);

    // Pins pop in a beat after their card lands.
    const pinT = [...PIN, 1.95, 7.5];
    for (let i = 0; i < NP; i++) {
      const sc = back(k(t, pinT[i] + 0.22, pinT[i] + 0.42));
      const g = i < CARDS.length ? cards[i].g : i === NP - 2 ? tallyG : trustG;
      const h = i < CARDS.length ? CH : i === NP - 2 ? TALLY[3] : TRUST[3];
      g.updateMatrixWorld();
      p4.set(0, h / 2 - 0.045, 0.033).applyMatrix4(g.matrixWorld);
      m4.compose(p4, q4, s4.setScalar(Math.max(0.001, sc)));
      pins.setMatrixAt(i, m4);
    }
    pins.instanceMatrix.needsUpdate = true;

    // Beat 3: the prototype wakes. Who am I talking to?
    drawUI(t);
    const wake = eo(k(t, 4.95, 5.3));
    ph.userData.screen.material.color.setScalar(lerp(0.04, 0.92, wake));
    phGlow.material.opacity = 0.45 * wake;
    phL.intensity = 1.6 * wake;
    ph.userData.sheen.position.x = Math.sin(t * 0.5) * 0.04;
    const miss = k(t, 5.0, 5.3) * (1 - k(t, 7.0, 7.4));
    missG.material.opacity = miss * (0.45 + 0.25 * Math.sin(t * 6));
    missG.visible = miss > 0.01;

    // Beat 4: the supported cards fade back, TRUST is pinned, and red string runs to it from every miss.
    const trOp = placeCard(t, trustG, TRUST[0], TRUST[1], 7.5, 0, 0.4, -0.02, [0.0, 1.5, 2.8]);
    trustMat.opacity = trOp;
    let tied = 0;
    strings.forEach((s, j) => {
      const pr = eio(k(t, STRING[j], STRING[j] + 0.45));
      s.geometry.setDrawRange(0, Math.floor(pr * SEG) * 36);
      s.visible = pr > 0;
      if (pr >= 1) tied += Math.exp(-(t - STRING[j] - 0.45) * 6);
    });
    const tIn = clamp(back(k(t, 7.5, 8.0)));
    trustGlow.material.opacity = tIn * (0.3 + 0.5 * Math.min(1, tied));
    trustGlow.visible = t > 7.5;
    trustL.intensity = tIn * (0.8 + 1.5 * Math.min(1, tied));

    // Dust in the beam.
    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -2.2 + rnd(i, 61) * 3.4 + Math.sin(t * 0.3 + i) * 0.12 + t * 0.02;
      dpos[i * 3 + 1] = 0.6 + rnd(i, 62) * 2.2 + Math.sin(t * 0.45 + i * 1.7) * 0.05;
      dpos[i * 3 + 2] = 0.25 + rnd(i, 63) * 2.6 + Math.cos(t * 0.25 + i) * 0.1;
    }
    dGeo.attributes.position.needsUpdate = true;

    const cin = back(k(t, 8.45, 8.9)), cout = ei(k(t, 9.35, 9.6));
    capM.position.set(0, -0.3 - (1 - clamp(cin)) * 0.04, -2.0).applyMatrix4(camera.matrixWorld);
    capM.quaternion.copy(camera.quaternion);
    capM.material.opacity = clamp(cin) * (1 - cout); capM.visible = cin > 0.01 && cout < 1;
  }
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();

  return { scene, camera, update, duration: D, poster: 9.1 };
}
