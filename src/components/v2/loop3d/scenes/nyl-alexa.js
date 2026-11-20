// New York Lottery Alexa skills and Help Center lit loop, 10 s. "Ask out loud, hear the answer."
// A walnut side table at night, a city glowing through the window behind, a warm lamp to the left.
// A player's question reaches the smart speaker: its ring wakes and sound ripples fold inward. The voice
// travels as a thread of light into a floating Help Center, which finds the answer and opens it. The
// answer flows back into the speaker, the ring pulses as it reads aloud line by line, ripples spread
// outward, and the Help Center folds away into the title.
import {
  THREE, k, kf, lerp, eo, eio, back, rnd, clamp,
  canvasTex, glow, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const FS = 'Inter, system-ui, sans-serif', FM = '"JetBrains Mono", monospace';
const CYAN = '#4fd6ff', CYANC = new THREE.Color(0x3fd0ff);
const ICOL = ['#4fd6ff', '#ffb547', '#b48cff', '#6ee39a'];
const UIW = 640, UIH = 800, PW = 0.8, PH = 1.0;
const LISTEN = [0.4, 2.3], SPEAK = [5.35, 7.8];
// Speech envelope: deterministic syllable-like flutter.
const voice = (t) => 0.5 + 0.5 * Math.abs(Math.sin(t * 11.3) * Math.sin(t * 4.1 + 0.7));

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060d);
  scene.fog = new THREE.Fog(0x080912, 3.6, 10);
  scene.environment = env;
  scene.environmentIntensity = 0.28;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- night window and city bokeh
  scene.add(skyDome([[0, '#04050c'], [0.4, '#10132c'], [0.49, '#2c1f3c'], [0.53, '#4a2c26'], [0.6, '#0b0a10'], [1, '#050507']]));
  const bokehTex = canvasTex(64, 64, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.55, 'rgba(255,255,255,0.55)'); g.addColorStop(0.75, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const BN = 150, bpos = new Float32Array(BN * 3), bcol = new Float32Array(BN * 3);
  const BC = [[1, 0.72, 0.38], [1, 0.86, 0.6], [0.6, 0.78, 1], [0.35, 0.9, 1], [1, 0.5, 0.35]];
  for (let i = 0; i < BN; i++) {
    bpos[i * 3] = (rnd(i, 1) - 0.5) * 15; bpos[i * 3 + 1] = -0.6 + Math.pow(rnd(i, 2), 1.6) * 3.6; bpos[i * 3 + 2] = -6.5 - rnd(i, 3) * 4;
    const c = BC[Math.floor(rnd(i, 4) * BC.length)], v = 0.45 + rnd(i, 5) * 0.55;
    bcol[i * 3] = c[0] * v; bcol[i * 3 + 1] = c[1] * v; bcol[i * 3 + 2] = c[2] * v;
  }
  const bGeo = new THREE.BufferGeometry();
  bGeo.setAttribute('position', new THREE.BufferAttribute(bpos, 3)); bGeo.setAttribute('color', new THREE.BufferAttribute(bcol, 3));
  const bokeh = new THREE.Points(bGeo, new THREE.PointsMaterial({ size: 0.42, map: bokehTex, vertexColors: true, transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, toneMapped: false }));
  scene.add(bokeh);
  const mullM = std(0x0a0b10, { roughness: 0.5, metalness: 0.3 });
  [-1.75, 0.25, 2.25].forEach((x) => { const m = mesh(new THREE.BoxGeometry(0.08, 5, 0.1), mullM, { cast: false }); m.position.set(x, 1.6, -2.3); scene.add(m); });
  const sill = mesh(new THREE.BoxGeometry(9, 0.07, 0.12), mullM, { cast: false }); sill.position.set(0, 1.72, -2.3); scene.add(sill);

  // ----------------------------------------------------------- the walnut side table
  const walnut = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#3a2416'; c.fillRect(0, 0, w, h);
    for (let g = 0; g < 140; g++) {
      const y = rnd(g, 1) * h, a = 0.05 + rnd(g, 2) * 0.16, dark = rnd(g, 3) > 0.4;
      c.strokeStyle = dark ? `rgba(18,9,4,${a})` : `rgba(140,90,52,${a * 0.7})`; c.lineWidth = 0.8 + rnd(g, 4) * 2.4;
      c.beginPath(); c.moveTo(0, y); for (let x = 0; x <= w; x += 48) c.lineTo(x, y + Math.sin(x * 0.006 + g) * 7 + Math.sin(x * 0.021 + g * 2) * 2); c.stroke();
    }
    for (let q = 0; q < 6; q++) { const x = rnd(q, 9) * w, y = rnd(q, 10) * h; c.strokeStyle = 'rgba(20,10,5,0.22)'; c.lineWidth = 2; for (let r = 4; r < 34; r += 6) { c.beginPath(); c.ellipse(x, y, r * 2.4, r * 0.7, 0, 0, 7); c.stroke(); } }
  });
  const table = mesh(new RoundedBoxGeometry(3.4, 0.08, 1.7, 3, 0.025), std(0xffffff, { map: walnut.tex, roughness: 0.42, metalness: 0.02 }));
  table.position.set(0, -0.04, -0.05); scene.add(table);

  // ----------------------------------------------------------- lamp (the key light lives in its shade)
  const brass = std(0xb58a4e, { metalness: 1, roughness: 0.3 });
  const lamp = new THREE.Group(); lamp.position.set(-0.98, 0, -0.42); scene.add(lamp);
  const lb = mesh(new THREE.CylinderGeometry(0.1, 0.11, 0.035, 32), brass); lb.position.y = 0.018; lamp.add(lb);
  const stem = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.6, 12), brass, { cast: false }); stem.position.y = 0.33; lamp.add(stem);
  const shade = mesh(new THREE.CylinderGeometry(0.13, 0.2, 0.25, 40, 1, true), std(0xcdae84, { roughness: 0.95, side: THREE.DoubleSide, emissive: 0xff9442, emissiveIntensity: 0.42 }), { cast: false });
  shade.position.y = 0.7; lamp.add(shade);
  const bulb = glow(0xffb469, 0.9, 0.85, 0.3); bulb.position.y = 0.62; lamp.add(bulb);
  const lampHalo = glow(0xff9a52, 2.4, 0.22, 0.5); lampHalo.position.y = 0.66; lamp.add(lampHalo);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x3a4472, 0x140c08, 0.3));
  const key = new THREE.SpotLight(0xffb978, 5.2, 0, 0.95, 0.85, 1.5);
  key.position.set(-0.94, 0.6, -0.38); key.target.position.set(0.15, 0.12, 0.1);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 0.1; key.shadow.camera.far = 4; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const moon = new THREE.DirectionalLight(0x7d93ff, 1.1); moon.position.set(1.6, 2.2, -3); scene.add(moon);
  const ringL = new THREE.PointLight(0x3fd0ff, 0, 1.3, 1.6); ringL.position.set(0, 0.42, 0.05); scene.add(ringL);
  const paneL = new THREE.PointLight(0x5fb8ff, 0, 1.6, 1.6); scene.add(paneL);

  // ----------------------------------------------------------- props: a mug and a playslip
  const mug = new THREE.Group(); mug.position.set(-0.62, 0, 0.2); mug.rotation.y = 0.5; scene.add(mug);
  const mugM = std(0x2c6a70, { roughness: 0.28 });
  const mb = mesh(new THREE.CylinderGeometry(0.056, 0.05, 0.115, 32), mugM); mb.position.y = 0.058; mug.add(mb);
  const mh = mesh(new THREE.TorusGeometry(0.032, 0.009, 10, 24), mugM); mh.position.set(0.06, 0.06, 0); mug.add(mh);
  const coffee = mesh(new THREE.CircleGeometry(0.05, 24), std(0x1a0e08, { roughness: 0.15 }), { cast: false }); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.105; mug.add(coffee);
  const slipT = canvasTex(512, 288, (c, w, h) => {
    c.fillStyle = '#e6dcc4'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#163273'; c.fillRect(0, 0, w, 52);
    c.fillStyle = '#f2c94c'; for (let s = 0; s < 5; s++) { c.beginPath(); c.arc(30 + s * 30, 26, 9, 0, 7); c.fill(); }
    c.strokeStyle = '#a55a5a'; c.lineWidth = 2;
    for (let r = 0; r < 4; r++) for (let q = 0; q < 10; q++) { c.beginPath(); c.arc(40 + q * 46, 92 + r * 50, 15, 0, 7); c.stroke(); if (rnd(r * 10 + q, 3) > 0.82) { c.fillStyle = '#1b1b1b'; c.fill(); } }
  });
  const slip = mesh(new THREE.PlaneGeometry(0.34, 0.19), std(0xffffff, { map: slipT.tex, roughness: 0.85 }), { cast: false });
  slip.rotation.set(-Math.PI / 2, 0, 0.42); slip.position.set(0.46, 0.002, 0.42); scene.add(slip);

  // ----------------------------------------------------------- the smart speaker
  const fabric = canvasTex(512, 256, (c, w, h) => {
    c.fillStyle = '#2a2c32'; c.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 3) { c.fillStyle = `rgba(255,255,255,${0.03 + rnd(y, 1) * 0.04})`; c.fillRect(0, y, w, 1); }
    for (let x = 0; x < w; x += 3) { c.fillStyle = `rgba(0,0,0,${0.08 + rnd(x, 2) * 0.08})`; c.fillRect(x, 0, 1, h); }
  }).tex;
  fabric.wrapS = fabric.wrapT = THREE.RepeatWrapping; fabric.repeat.set(4, 2);
  const spk = new THREE.Group(); scene.add(spk);
  const body = mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.32, 56), std(0xffffff, { map: fabric, roughness: 0.95 })); body.position.y = 0.18; spk.add(body);
  const foot = mesh(new THREE.CylinderGeometry(0.168, 0.16, 0.02, 56), std(0x15161a, { roughness: 0.5 })); foot.position.y = 0.01; spk.add(foot);
  const cap = mesh(new THREE.CylinderGeometry(0.168, 0.17, 0.02, 56), std(0x0d0e11, { roughness: 0.16, metalness: 0.35 })); cap.position.y = 0.35; spk.add(cap);
  [[-0.06, 0.05], [0.06, 0.05], [-0.06, -0.05], [0.06, -0.05]].forEach(([x, z]) => { const b = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.006, 16), std(0x24262c, { roughness: 0.4 }), { cast: false }); b.position.set(x, 0.362, z); spk.add(b); });
  const ringTex = canvasTex(256, 4, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, 'rgb(40,110,170)'); g.addColorStop(0.32, 'rgb(40,110,170)'); g.addColorStop(0.45, 'rgb(190,245,255)'); g.addColorStop(0.5, 'rgb(255,255,255)');
    g.addColorStop(0.55, 'rgb(190,245,255)'); g.addColorStop(0.68, 'rgb(40,110,170)'); g.addColorStop(1, 'rgb(40,110,170)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
  }).tex;
  ringTex.wrapS = THREE.RepeatWrapping;
  const ringM = new THREE.MeshBasicMaterial({ map: ringTex, color: 0xffffff, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.152, 0.0075, 10, 96), ringM);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.361; spk.add(ring);
  const ringGlow = glow(CYANC, 1, 0, 0.45); ringGlow.position.set(0, 0.37, 0); ringGlow.scale.set(0.75, 0.26, 1); spk.add(ringGlow);
  // Sound ripples: fold inward while listening, spread outward while speaking.
  const ripples = [0, 1, 2, 3].map(() => {
    const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.006, 6, 120), new THREE.MeshBasicMaterial({ color: CYANC, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending }));
    r.rotation.x = Math.PI / 2; scene.add(r); return r;
  });

  // ----------------------------------------------------------- the floating Help Center
  const pane = new THREE.Group(); pane.position.set(0.74, 0.6, -0.08); pane.rotation.y = -0.3; scene.add(pane);
  const fold = new THREE.Group(); pane.add(fold);
  const plate = mesh(new RoundedBoxGeometry(PW + 0.04, PH + 0.04, 0.014, 3, 0.02), new THREE.MeshPhysicalMaterial({ color: 0x0b1222, roughness: 0.14, metalness: 0.2, clearcoat: 1, clearcoatRoughness: 0.1, transparent: true, opacity: 0.62 }), { cast: false, receive: false });
  fold.add(plate);
  const ui = canvasTex(UIW, UIH);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(PW, PH), new THREE.MeshBasicMaterial({ map: ui.tex, transparent: true, toneMapped: false, depthWrite: false }));
  screen.material.color.setScalar(0.92); screen.position.z = 0.009; fold.add(screen);
  const paneGlow = glow(0x3a8cff, 1, 0, 0.5); paneGlow.position.z = -0.05; paneGlow.scale.set(1.5, 1.7, 1); fold.add(paneGlow);
  pane.updateMatrixWorld();
  const toW = (x, y) => pane.localToWorld(new THREE.Vector3(x, y, 0.02));
  paneL.position.copy(pane.localToWorld(new THREE.Vector3(0, 0, 0.35)));

  let uiKey = '';
  const drawUI = (t) => {
    const arr = k(t, 2.45, 3.2);
    const rows = [0, 1, 2, 3].map((j) => eo(k(t, 3.2 + j * 0.12, 3.55 + j * 0.12)));
    const hi = eo(k(t, 3.72, 3.92)), ex = eio(k(t, 3.95, 4.55)), read = k(t, SPEAK[0] + 0.05, SPEAK[1] - 0.05);
    const live = (t > 2.4 && t < 4.65) || (t > 5.3 && t < 7.85);
    const key = live ? 'L' + Math.round(t * 30) : t < 2.4 ? 'a' : t < 5.3 ? 'b' : 'c';
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(9,15,32,0.9)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
      c.strokeStyle = 'rgba(79,214,255,0.4)'; c.lineWidth = 3; c.stroke();
      c.textBaseline = 'middle';
      c.fillStyle = '#ffffff'; c.font = `800 52px ${FS}`; c.fillText('Help Center', 40, 70);
      c.fillStyle = CYAN; c.font = `700 22px ${FM}`; c.fillText('PLAYER SUPPORT', 42, 114);
      // Search field: the spoken question arrives as a waveform.
      c.fillStyle = 'rgba(255,255,255,0.08)'; roundRect(c, 32, 150, w - 64, 80, 40); c.fill();
      c.strokeStyle = arr > 0 && arr < 1 ? 'rgba(79,214,255,0.9)' : 'rgba(255,255,255,0.16)'; c.lineWidth = 3; c.stroke();
      c.fillStyle = CYAN; c.beginPath(); c.arc(78, 190, 24, 0, 7); c.fill();
      c.fillStyle = '#071322'; roundRect(c, 71, 174, 14, 24, 7); c.fill();
      c.strokeStyle = '#071322'; c.lineWidth = 3; c.beginPath(); c.arc(78, 190, 12, 0.2, Math.PI - 0.2); c.stroke(); c.beginPath(); c.moveTo(78, 202); c.lineTo(78, 208); c.stroke();
      const NB = 30, nb = Math.floor(arr * NB);
      for (let j = 0; j < nb; j++) {
        const fresh = arr < 1 && j > nb - 6;
        const a = (0.25 + 0.75 * rnd(j, 7)) * (fresh ? 0.6 + 0.4 * Math.sin(t * 22 + j * 1.7) : 1);
        const bh = 6 + 46 * a;
        c.fillStyle = fresh ? '#bff0ff' : CYAN; roundRect(c, 124 + j * 15, 190 - bh / 2, 8, bh, 4); c.fill();
      }
      // Results cascade in; the top one is the answer.
      rows.forEach((r, j) => {
        if (r <= 0) return;
        const y = 262 + j * 104, x = 32 + (1 - r) * 40;
        c.globalAlpha = r * (j === 0 ? 1 : 1 - ex);
        c.fillStyle = j === 0 ? `rgba(79,214,255,${0.06 + 0.12 * hi})` : 'rgba(255,255,255,0.05)'; roundRect(c, x, y, w - 64, 90, 18); c.fill();
        if (j === 0 && hi > 0) { c.strokeStyle = `rgba(79,214,255,${0.9 * hi})`; c.lineWidth = 3; c.stroke(); }
        c.fillStyle = ICOL[j]; roundRect(c, x + 18, y + 17, 56, 56, 14); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.78)'; roundRect(c, x + 94, y + 24, 200 + rnd(j, 3) * 180, 14, 7); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.32)'; roundRect(c, x + 94, y + 54, 140 + rnd(j, 4) * 200, 11, 5); c.fill();
        c.globalAlpha = 1;
      });
      // The top result opens into the answer, then reads out line by line.
      if (ex > 0) {
        const x = lerp(32, 24, ex), y = lerp(262, 250, ex), cw = lerp(w - 64, w - 48, ex), ch = lerp(90, 520, ex);
        c.fillStyle = '#0f1f3e'; roundRect(c, x, y, cw, ch, 22); c.fill();
        c.strokeStyle = 'rgba(79,214,255,0.85)'; c.lineWidth = 3; c.stroke();
        const ca = k(ex, 0.45, 1);
        c.save(); roundRect(c, x, y, cw, ch, 22); c.clip(); c.globalAlpha = ca;
        c.fillStyle = ICOL[0]; roundRect(c, x + 26, y + 26, 56, 56, 14); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.92)'; roundRect(c, x + 104, y + 32, 380, 20, 10); c.fill(); roundRect(c, x + 104, y + 64, 250, 20, 10); c.fill();
        // Speaker badge: three arcs that light while the answer is read aloud.
        const bx = x + cw - 62, by = y + 56, on = read > 0 && read < 1;
        c.fillStyle = on ? CYAN : 'rgba(255,255,255,0.18)'; c.beginPath(); c.arc(bx, by, 26, 0, 7); c.fill();
        c.strokeStyle = on ? '#071322' : 'rgba(255,255,255,0.6)'; c.lineWidth = 3.5;
        for (let a = 0; a < 3; a++) { c.globalAlpha = ca * (on ? 0.4 + 0.6 * (Math.sin(t * 9 - a) > 0 ? 1 : 0.3) : 1); c.beginPath(); c.arc(bx - 9, by, 6 + a * 6, -0.8, 0.8); c.stroke(); }
        c.globalAlpha = ca;
        c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 26, y + 116, cw - 52, 2);
        for (let l = 0; l < 7; l++) {
          const lw = (l === 6 ? 0.45 : 0.72 + rnd(l, 12) * 0.24) * (cw - 52), ly = y + 152 + l * 46;
          c.fillStyle = 'rgba(255,255,255,0.26)'; roundRect(c, x + 26, ly, lw, 13, 6); c.fill();
          const pr = clamp(read * 7 - l);
          if (pr > 0) { c.fillStyle = 'rgba(120,226,255,0.95)'; roundRect(c, x + 26, ly, Math.max(13, lw * pr), 13, 6); c.fill(); }
        }
        c.restore(); c.globalAlpha = 1;
      }
    });
  };

  // ----------------------------------------------------------- voice threads between speaker and Help Center
  const outCurve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0.38, 0), new THREE.Vector3(0.12, 1.0, 0.3), toW(-0.15, 0.26));
  const backCurve = new THREE.QuadraticBezierCurve3(toW(0, -0.12), new THREE.Vector3(0.28, 0.78, 0.42), new THREE.Vector3(0, 0.38, 0));
  const TS = 120, PER = 6 * 6;
  const threadM = () => new THREE.MeshBasicMaterial({ color: CYANC, transparent: true, opacity: 0, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending });
  const outT = new THREE.Mesh(new THREE.TubeGeometry(outCurve, TS, 0.0035, 6, false), threadM());
  const backT = new THREE.Mesh(new THREE.TubeGeometry(backCurve, TS, 0.0035, 6, false), threadM());
  scene.add(outT, backT);
  const PN = 110, ppos = new Float32Array(PN * 3);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const motes = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0x9fe8ff, size: 0.016, map: bokehTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  motes.frustumCulled = false; scene.add(motes);
  const tip = glow(0xbff0ff, 0.22, 0, 0.3); scene.add(tip);

  // ----------------------------------------------------------- title, revealed where the Help Center folds away
  const titleT = canvasTex(1024, 440, (c, w, h) => {
    c.fillStyle = 'rgba(9,15,32,0.9)'; roundRect(c, 4, 4, w - 8, h - 8, 36); c.fill();
    c.strokeStyle = 'rgba(79,214,255,0.55)'; c.lineWidth = 3; c.stroke();
    c.textBaseline = 'middle'; c.textAlign = 'left';
    c.fillStyle = CYAN; c.font = `700 34px ${FM}`; if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.fillText('NEW YORK LOTTERY', 64, 78);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    let fs = 100; c.font = `800 ${fs}px ${FS}`;
    while (c.measureText('Alexa skills and').width > w - 128 && fs > 60) { fs -= 2; c.font = `800 ${fs}px ${FS}`; }
    c.fillStyle = '#ffffff'; c.fillText('Alexa skills and', 62, 200); c.fillText('Help Center', 62, 318);
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 1.25 * 440 / 1024), new THREE.MeshBasicMaterial({ map: titleT.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(title);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.34, 0.5, 1.0]], [2.1, [-0.18, 0.6, 1.45], (x) => x],
    [4.1, [0.12, 0.76, 2.3]], [6.6, [-0.04, 0.7, 2.15], (x) => x],
    [8.4, [0.22, 0.8, 2.6]], [10, [0.26, 0.82, 2.72], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0, 0.32, 0]], [2.1, [0.1, 0.42, 0], (x) => x],
    [4.1, [0.4, 0.55, -0.05]], [6.6, [0.32, 0.5, -0.05], (x) => x],
    [8.4, [0.42, 0.56, -0.05]], [10, [0.42, 0.57, -0.05], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), tmp = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.0) * 0.006, p[1] + Math.sin(t * 1.4 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [4.1, 33], [10, 32]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Speaker ring: wake, listen (spinning highlight), think, speak (pulsing with the voice), rest.
    const listen = eo(k(t, LISTEN[0], LISTEN[0] + 0.3)) * (1 - eio(k(t, LISTEN[1] - 0.2, LISTEN[1] + 0.25)));
    const think = Math.sin(Math.PI * k(t, 2.3, 5.2)) * (0.5 + 0.5 * Math.sin(t * 6));
    const speak = eo(k(t, SPEAK[0], SPEAK[0] + 0.2)) * (1 - eio(k(t, SPEAK[1] - 0.1, SPEAK[1] + 0.3)));
    const level = 0.22 + 0.9 * listen + 0.28 * think + speak * (0.35 + 0.75 * voice(t));
    ringM.color.setScalar(level);
    ringTex.offset.x = listen > 0.01 ? -t * 1.4 : speak > 0.01 ? t * 0.35 : t * 0.12;
    ringGlow.material.opacity = clamp(0.12 + 0.55 * (level - 0.22));
    ringL.intensity = 1.6 * (level - 0.15);
    ripples.forEach((r, j) => {
      let rad = 0.2, op = 0, y = 0.3;
      if (listen > 0.01) {
        const ph = (((t - LISTEN[0]) / 0.75 + j / 4) % 1 + 1) % 1;
        rad = lerp(1.15, 0.18, eio(ph)); op = Math.sin(Math.PI * ph) * listen * 0.55; y = 0.3 + ph * 0.06;
      } else if (speak > 0.01) {
        const ph = (((t - SPEAK[0]) / 0.8 + j / 4) % 1 + 1) % 1;
        rad = lerp(0.18, 1.35, eo(ph)); op = (1 - ph) * speak * (0.35 + 0.4 * voice(t)); y = 0.36 - ph * 0.08;
      }
      r.scale.setScalar(rad); r.position.y = y; r.material.opacity = op; r.visible = op > 0.005;
    });

    // Help Center unfolds out of the voice thread, works, then folds away for the title.
    const open = back(k(t, 2.2, 2.75)), shut = eio(k(t, 7.95, 8.4));
    fold.scale.set(lerp(0.6, 1, clamp(open)) * (1 - 0.3 * shut), Math.max(0.001, open * (1 - shut)), 1);
    fold.position.y = Math.sin(t * 1.3) * 0.008;
    fold.visible = open > 0.01 && shut < 0.99;
    screen.material.opacity = clamp(open * 1.4) * (1 - shut);
    plate.material.opacity = 0.62 * clamp(open) * (1 - shut);
    paneGlow.material.opacity = (0.18 + 0.2 * Math.sin(Math.PI * k(t, 3.9, 4.9)) + 0.15 * speak) * clamp(open) * (1 - shut);
    paneL.intensity = (0.5 + 0.6 * Math.sin(Math.PI * k(t, 3.9, 4.9))) * clamp(open) * (1 - shut);
    drawUI(t);

    // Voice threads and the motes that ride them.
    const oDraw = eio(k(t, 1.95, 2.5)), oFade = 1 - eo(k(t, 2.9, 3.4));
    outT.geometry.setDrawRange(0, Math.floor(oDraw * TS) * PER); outT.material.opacity = 0.9 * oFade; outT.visible = oDraw > 0 && oFade > 0;
    const bDraw = eio(k(t, SPEAK[0] - 0.25, SPEAK[0] + 0.25)), bFade = 1 - eo(k(t, SPEAK[1] - 0.1, SPEAK[1] + 0.4));
    backT.geometry.setDrawRange(0, Math.floor(bDraw * TS) * PER); backT.material.opacity = 0.8 * bFade; backT.visible = bDraw > 0 && bFade > 0;
    const goOut = t < 4, flowA = goOut ? Math.sin(Math.PI * k(t, 1.9, 3.1)) : Math.sin(Math.PI * k(t, SPEAK[0] - 0.2, SPEAK[1] + 0.2));
    const cv = goOut ? outCurve : backCurve, lim = goOut ? oDraw : bDraw;
    for (let i = 0; i < PN; i++) {
      const u = Math.min(lim, ((t * (goOut ? 0.9 : 0.55) + i / PN) % 1));
      cv.getPoint(u, tmp);
      const j = 0.012 * (1 - Math.abs(u - 0.5) * 1.6);
      ppos[i * 3] = tmp.x + (rnd(i, 1) - 0.5) * j; ppos[i * 3 + 1] = tmp.y + (rnd(i, 2) - 0.5) * j; ppos[i * 3 + 2] = tmp.z + (rnd(i, 3) - 0.5) * j;
    }
    pGeo.attributes.position.needsUpdate = true;
    motes.material.opacity = 0.9 * clamp(flowA); motes.visible = flowA > 0.01;
    if (oDraw > 0 && oDraw < 1) { outCurve.getPoint(oDraw, tip.position); tip.material.opacity = 0.9; }
    else if (bDraw > 0 && bDraw < 1) { backCurve.getPoint(bDraw, tip.position); tip.material.opacity = 0.9; }
    else { tip.position.set(0, 0.38, 0); tip.material.opacity = 0; }

    // Title takes the Help Center's place.
    const ti = back(k(t, 8.25, 8.8));
    title.position.set(0.74, 0.62 + (1 - clamp(ti)) * -0.06, -0.02);
    title.lookAt(camera.position);
    title.scale.setScalar(Math.max(0.001, 0.85 + 0.15 * ti));
    title.material.opacity = clamp(ti); title.visible = ti > 0.01;

    // City lights shimmer a little.
    bokeh.material.opacity = 0.55 + 0.05 * Math.sin(t * 0.9);
  }

  return { scene, camera, update, duration: D, poster: 6.4 };
}
