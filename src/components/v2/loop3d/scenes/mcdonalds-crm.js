// McDonald's CRM pitch lit loop, 10 s. "The loyalty loop."
// A red lacquer turntable under a warm key, like a product drop. A customer stands at the center; four
// touchpoints sit around a gold track: the app, the order, the reward and the return. A light token
// runs the loop and each touchpoint answers as it passes. Every lap is a visit, and every lap runs a
// little faster and burns the track a little brighter. On the third visit the token spirals into the
// customer, who lights up, and the counter turns over to the title.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, phone, dip,
} from '../kit.js';

const D = 10;
const FS = 'Inter, system-ui, sans-serif', FM = '"JetBrains Mono", monospace';
const GOLD = 0xffb21e, GOLDC = new THREE.Color(GOLD);
const R = 0.95, SR = 1.14, TOP = 0.12;          // track radius, station radius, platform top
const ST = ['APP', 'ORDER', 'REWARD', 'RETURN']; // clockwise from the back
const T0 = 0.7, T1 = 6.9;                       // the three laps run between these
// Cumulative angle: starts from rest and speeds up, so each visit comes round sooner than the last.
const f = (u) => u * u * (1.6 - 0.6 * u);
const theta = (t) => 6 * Math.PI * f(k(t, T0, T1));
const posOn = (a, r, y, out) => out.set(r * Math.sin(a), y, -r * Math.cos(a));

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0605);
  scene.fog = new THREE.Fog(0x0b0605, 5, 13);
  scene.environment = env;
  scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);

  // When the token reaches a given fraction of the three laps (bisection on the eased curve).
  const at = (frac) => { let lo = 0, hi = 1; for (let n = 0; n < 24; n++) { const m = (lo + hi) / 2; if (f(m) < frac) lo = m; else hi = m; } return lerp(T0, T1, (lo + hi) / 2); };
  const PASS = ST.map((_, s) => [0, 1, 2].map((n) => at((n + s / 4) / 3)).concat(s === 0 ? [T1] : []));
  const VISIT_T = [at(1 / 3), at(2 / 3)];
  const visitAt = (t) => (t < VISIT_T[0] ? 1 : t < VISIT_T[1] ? 2 : 3);

  // ----------------------------------------------------------- stage
  const floor = mesh(new THREE.PlaneGeometry(24, 24), std(0xffffff, { map: grainTex('#140a08', { size: 256, speck: 0.06, blot: 0.12, seed: 31, repeat: 9 }), roughness: 0.45, metalness: 0.15 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const back1 = glow(0x7a1c10, 9, 0.55, 0.5); back1.position.set(0, 1.2, -4.5); scene.add(back1);
  const back2 = glow(0xffa040, 4, 0.12, 0.5); back2.position.set(0, 1.0, -4.2); scene.add(back2);
  const plat = mesh(new THREE.CylinderGeometry(1.35, 1.39, TOP, 96), std(0x5a1010, { roughness: 0.3, metalness: 0.15 }));
  plat.position.y = TOP / 2; scene.add(plat);
  const inlay = mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.004, 96), std(0x1c0907, { roughness: 0.42, metalness: 0.2 }), { cast: false });
  inlay.position.y = TOP + 0.002; scene.add(inlay);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(1.372, 0.006, 6, 160), new THREE.MeshBasicMaterial({ color: GOLDC.clone().multiplyScalar(0.55), toneMapped: false }));
  edge.rotation.x = Math.PI / 2; edge.position.y = TOP - 0.012; scene.add(edge);
  // The track and its soft pool of light.
  const trackM = new THREE.MeshBasicMaterial({ color: GOLDC.clone(), toneMapped: false });
  const track = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 180), trackM);
  track.rotation.x = Math.PI / 2; track.position.y = TOP + 0.008; scene.add(track);
  const poolT = canvasTex(512, 512, (c, w) => {
    const g = c.createRadialGradient(w / 2, w / 2, 0.82 * w / 2, w / 2, w / 2, w / 2);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, w);
  }).tex;
  const pool = new THREE.Mesh(new THREE.RingGeometry(0.82 * 1.08, 1.08, 128), new THREE.MeshBasicMaterial({ map: poolT, color: GOLDC.clone(), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  pool.rotation.x = -Math.PI / 2; pool.position.y = TOP + 0.006; scene.add(pool);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x6a5a7a, 0x1a0a06, 0.35));
  const key = new THREE.SpotLight(0xffe2c0, 0, 0, 0.6, 0.7, 1.3);
  key.position.set(-1.6, 3.6, 2.2); key.target.position.set(0, 0.2, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1.5; key.shadow.camera.far = 8; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x66c8ff, 1.3); rim.position.set(0.5, 1.8, -3.2); scene.add(rim);
  const tokL = new THREE.PointLight(GOLD, 0, 1.3, 1.6); scene.add(tokL);

  // ----------------------------------------------------------- the customer
  const who = new THREE.Group(); scene.add(who);
  const skin = std(0xa89c92, { roughness: 0.55 });
  const plinth = mesh(new THREE.CylinderGeometry(0.2, 0.22, 0.06, 48), std(0x2a0f0b, { roughness: 0.35, metalness: 0.3 })); plinth.position.y = TOP + 0.03; scene.add(plinth);
  const torso = mesh(new THREE.CapsuleGeometry(0.105, 0.24, 8, 24), skin); torso.position.y = 0.405; who.add(torso);
  const head = mesh(new THREE.SphereGeometry(0.08, 32, 24), skin); head.position.y = 0.72; who.add(head);
  const heart = glow(0xffc24a, 0.2, 0, 0.3); heart.position.set(0, 0.47, 0.11); who.add(heart);
  const heartL = new THREE.PointLight(0xffb040, 0, 1.4, 1.6); heartL.position.set(0, 0.5, 0.25); scene.add(heartL);

  // ----------------------------------------------------------- the four touchpoints
  const pos = new THREE.Vector3();
  const stations = ST.map((name, s) => {
    const a = s * Math.PI / 2;
    const g = new THREE.Group(); posOn(a, SR, TOP, g.position); g.rotation.y = -a; scene.add(g);
    const pad = mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.01, 40), std(0x2a0d0a, { roughness: 0.35, metalness: 0.4 }), { cast: false }); pad.position.y = 0.005; g.add(pad);
    const flash = glow(GOLD, 0.6, 0, 0.35); flash.position.y = 0.06; flash.scale.set(0.7, 0.3, 1); g.add(flash);
    const prop = new THREE.Group(); g.add(prop);
    const lab = label(name, { font: `800 56px ${FS}`, fg: '#2a0f08', bg: '#f0dcb8', h: 0.14, pad: 32, track: 4 });
    scene.add(lab);
    return { g, prop, flash, lab, a };
  });
  // APP: a phone on a stand; its screen fills one stamp per visit.
  const ph = phone({ w: 0.21, h: 0.42, d: 0.022, r: 0.03 });
  ph.position.set(0, 0.25, 0); ph.rotation.x = -0.2; stations[0].prop.add(ph);
  const standP = mesh(new THREE.BoxGeometry(0.12, 0.1, 0.012), std(0x1d1d22, { roughness: 0.5, metalness: 0.5 })); standP.position.set(0, 0.05, -0.05); standP.rotation.x = 0.35; stations[0].prop.add(standP);
  const appT = canvasTex(330, 1000);
  ph.userData.screen.material.map = appT.tex; ph.userData.screen.material.needsUpdate = true;
  ph.userData.screen.material.color.setScalar(0.85);
  let appKey = '';
  const drawApp = (v, t) => {
    const fillP = v === 3 ? clamp(k(t, VISIT_T[1], VISIT_T[1] + 0.3)) : 1;
    const key = v + '|' + Math.round(fillP * 10);
    if (key === appKey) return; appKey = key;
    appT.redraw((c, w, h) => {
      c.fillStyle = '#1b1210'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#b3141c'; c.fillRect(0, 0, w, 170);
      c.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(c, 30, 70, 150, 22, 11); c.fill();
      c.fillStyle = 'rgba(255,255,255,0.45)'; roundRect(c, 30, 108, 100, 16, 8); c.fill();
      for (let r = 0; r < 3; r++) {
        const y = 210 + r * 180;
        c.fillStyle = '#2b1d19'; roundRect(c, 24, y, w - 48, 150, 22); c.fill();
        c.fillStyle = ['#e0a83a', '#c8502e', '#7a9a3a'][r]; roundRect(c, 42, y + 22, 106, 106, 18); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)'; roundRect(c, 166, y + 40, 120, 16, 8); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.32)'; roundRect(c, 166, y + 74, 90, 12, 6); c.fill();
      }
      // Visit stamps.
      for (let q = 0; q < 3; q++) {
        const x = w / 2 + (q - 1) * 86, y = 790, on = q < v;
        c.strokeStyle = '#ffc23a'; c.lineWidth = 6; c.beginPath(); c.arc(x, y, 32, 0, 7); c.stroke();
        if (on) { c.fillStyle = '#ffc23a'; c.globalAlpha = q === 2 ? fillP : 1; c.beginPath(); c.arc(x, y, 24, 0, 7); c.fill(); c.globalAlpha = 1; }
      }
      c.fillStyle = '#ffc23a'; roundRect(c, 40, 880, w - 80, 76, 38); c.fill();
    });
  };
  // ORDER: a paper bag and a cup.
  const kraft = std(0xa17a4c, { roughness: 0.92 });
  const bag = mesh(new THREE.BoxGeometry(0.17, 0.2, 0.11), kraft); bag.position.set(-0.05, 0.1, 0); stations[1].prop.add(bag);
  const lip = mesh(new THREE.BoxGeometry(0.17, 0.04, 0.06), kraft); lip.position.set(-0.05, 0.215, 0); lip.rotation.x = 0.15; stations[1].prop.add(lip);
  const cupM = std(0x9e1219, { roughness: 0.38 });
  const cup = mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.17, 32), cupM); cup.position.set(0.09, 0.085, 0.04); stations[1].prop.add(cup);
  const lid = mesh(new THREE.CylinderGeometry(0.054, 0.052, 0.014, 32), std(0xcfc6b6, { roughness: 0.4 })); lid.position.set(0.09, 0.177, 0.04); stations[1].prop.add(lid);
  const straw = mesh(new THREE.CylinderGeometry(0.0065, 0.0065, 0.12, 10), std(0xe2b022, { roughness: 0.4 })); straw.position.set(0.1, 0.23, 0.04); straw.rotation.z = -0.12; stations[1].prop.add(straw);
  // REWARD: a gold star.
  const starS = new THREE.Shape();
  for (let i = 0; i < 10; i++) { const r = i % 2 ? 0.052 : 0.125, a = i * Math.PI / 5; const x = Math.sin(a) * r, y = Math.cos(a) * r; if (i) starS.lineTo(x, y); else starS.moveTo(x, y); }
  starS.closePath();
  const starG = new THREE.ExtrudeGeometry(starS, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.01, bevelSegments: 3 }); starG.center();
  const star = mesh(starG, std(0xffbf3a, { metalness: 1, roughness: 0.22, emissive: 0x5a3500, emissiveIntensity: 0.35 }));
  star.position.y = 0.3; stations[2].prop.add(star);
  const starGlow = glow(0xffc24a, 0.6, 0.25, 0.35); starGlow.position.y = 0.3; stations[2].prop.add(starGlow);
  // RETURN: a circular arrow.
  const arrM = std(0xe2d1b0, { roughness: 0.35, metalness: 0.25 });
  const arrow = new THREE.Group(); arrow.position.y = 0.28; stations[3].prop.add(arrow);
  const ARC = Math.PI * 1.55;
  arrow.add(mesh(new THREE.TorusGeometry(0.1, 0.021, 12, 48, ARC), arrM));
  const tipC = mesh(new THREE.ConeGeometry(0.047, 0.08, 20), arrM);
  tipC.position.set(0.1 * Math.cos(ARC), 0.1 * Math.sin(ARC), 0); tipC.rotation.z = ARC; arrow.add(tipC);

  // ----------------------------------------------------------- the token and its trail
  const token = new THREE.Mesh(new THREE.SphereGeometry(0.036, 24, 16), new THREE.MeshBasicMaterial({ color: 0xfff0c8, toneMapped: false }));
  scene.add(token);
  const tokGlow = glow(GOLD, 0.42, 0.95, 0.3); scene.add(tokGlow);
  const TRN = 8;
  const trail = Array.from({ length: TRN }, (_, j) => { const s = glow(GOLD, 0.3 * (1 - j / TRN) + 0.06, 0, 0.35); scene.add(s); return s; });
  const BN = 110, bposA = new Float32Array(BN * 3);
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bposA, 3));
  const burst = new THREE.Points(bGeo, new THREE.PointsMaterial({ color: 0xffd27a, size: 0.026, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  burst.frustumCulled = false; scene.add(burst);
  const DIRS = Array.from({ length: BN }, (_, i) => { const th = rnd(i, 1) * Math.PI * 2, ph2 = Math.acos(2 * rnd(i, 2) - 1); return [Math.sin(ph2) * Math.cos(th), Math.abs(Math.cos(ph2)) * 0.8 + 0.1, Math.sin(ph2) * Math.sin(th), 0.5 + rnd(i, 3) * 0.6]; });

  // ----------------------------------------------------------- visit counter, then the title
  const ctrT = canvasTex(512, 256);
  const ctr = new THREE.Mesh(new THREE.PlaneGeometry(0.84, 0.42), new THREE.MeshBasicMaterial({ map: ctrT.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(ctr);
  let ctrKey = 0;
  const drawCtr = (v) => {
    if (v === ctrKey) return; ctrKey = v;
    ctrT.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(26,10,8,0.9)'; roundRect(c, 4, 4, w - 8, h - 8, 30); c.fill();
      c.strokeStyle = v === 3 ? 'rgba(255,194,74,0.95)' : 'rgba(255,194,74,0.4)'; c.lineWidth = 3; c.stroke();
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillStyle = '#ffc24a'; c.font = `700 26px ${FM}`; if ('letterSpacing' in c) c.letterSpacing = '5px';
      c.fillText('LOYALTY LOOP', w / 2, 58);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = v === 3 ? '#ffd27a' : '#f6ead6'; c.font = `800 104px ${FS}`; c.fillText('VISIT ' + v, w / 2, 160);
    });
  };
  const titleT = canvasTex(1024, 400, (c, w, h) => {
    c.fillStyle = 'rgba(26,10,8,0.92)'; roundRect(c, 4, 4, w - 8, h - 8, 36); c.fill();
    c.strokeStyle = 'rgba(255,194,74,0.8)'; c.lineWidth = 3; c.stroke();
    c.textAlign = 'center'; c.textBaseline = 'middle';
    c.fillStyle = '#ffc24a'; c.font = `700 36px ${FM}`; if ('letterSpacing' in c) c.letterSpacing = '6px';
    c.fillText("MCDONALD'S", w / 2, 74);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#f6ead6'; c.font = `800 136px ${FS}`; c.fillText('CRM pitch', w / 2, 192);
    let fs = 50; c.font = `600 ${fs}px ${FS}`;
    while (c.measureText('A CRM perspective from the UX team.').width > w - 100 && fs > 30) { fs -= 2; c.font = `600 ${fs}px ${FS}`; }
    c.fillStyle = 'rgba(246,234,214,0.78)'; c.fillText('A CRM perspective from the UX team.', w / 2, 316);
  });
  const title = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5 * 400 / 1024), new THREE.MeshBasicMaterial({ map: titleT.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(title);

  // ----------------------------------------------------------- camera: a slow orbit that tightens as the laps speed up
  const tgt = new THREE.Vector3();
  const PULL = 7.7;

  function update(t) {
    const phi = kf(t, [[0, -0.62], [3.4, -0.25, (x) => x], [6.9, 0.3], [8.4, 0.05], [10, 0.0, (x) => x]]);
    const rad = kf(t, [[0, 3.75], [3.4, 3.5, (x) => x], [6.9, 3.05], [8.4, 3.85], [10, 3.95, (x) => x]]);
    const hgt = kf(t, [[0, 2.35], [3.4, 2.0, (x) => x], [6.9, 1.55], [8.4, 1.68], [10, 1.7, (x) => x]]);
    camera.position.set(rad * Math.sin(phi), hgt + Math.sin(t * 1.3) * 0.006, rad * Math.cos(phi));
    tgt.set(0, kf(t, [[0, 0.3], [6.9, 0.42], [8.4, 0.62], [10, 0.63]]), 0); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [6.9, 35], [8.4, 39], [10, 39]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));
    key.intensity = 26 * clamp(back(k(t, 0.1, 0.75)));

    // Token: three laps, then a spiral into the customer.
    const th = theta(t), v = visitAt(t);
    const into = eio(k(t, T1, T1 + 0.45));
    const a = th + into * Math.PI * 0.9;
    posOn(a, R * (1 - into), lerp(TOP + 0.05, 0.47, into), pos);
    token.position.copy(pos); tokGlow.position.copy(pos);
    const boom = k(t, T1 + 0.45, T1 + 1.4);
    const alive = t > T0 - 0.35 && boom <= 0;
    const born = back(k(t, T0 - 0.35, T0));
    token.visible = alive; token.scale.setScalar(Math.max(0.001, born));
    tokGlow.material.opacity = alive ? 0.95 * clamp(born) : 0;
    tokL.position.copy(pos); tokL.position.y += 0.08; tokL.intensity = alive ? 2.2 * clamp(born) : 0;
    trail.forEach((s, j) => {
      const tt = t - (j + 1) * 0.04, aj = theta(tt) + eio(k(tt, T1, T1 + 0.45)) * Math.PI * 0.9, ij = eio(k(tt, T1, T1 + 0.45));
      posOn(aj, R * (1 - ij), lerp(TOP + 0.05, 0.47, ij), s.position);
      const moving = t > T0 && tt > T0 - 0.05;
      s.material.opacity = alive && moving ? 0.55 * (1 - j / TRN) * clamp((t - T0) * 3) : 0;
    });

    // Track: brighter with every lap completed; the pool breathes with the token's speed.
    const prog = th / (6 * Math.PI);
    const flare = Math.exp(-3 * Math.max(0, t - T1 - 0.45)) * (t > T1 + 0.45 ? 1 : 0);
    trackM.color.copy(GOLDC).multiplyScalar(0.3 + 0.55 * prog + 0.8 * flare);
    pool.material.color.copy(GOLDC).multiplyScalar(0.12 + 0.28 * prog + 0.5 * flare);

    // Touchpoints answer as the token passes.
    stations.forEach((S, s) => {
      let fl = 0, last = -1;
      PASS[s].forEach((tp) => { if (t >= tp) { fl = Math.max(fl, Math.exp(-4.5 * (t - tp))); last = tp; } });
      const bump = last >= 0 ? Math.sin(Math.PI * k(t, last, last + 0.42)) : 0;
      S.prop.position.y = bump * 0.05;
      S.flash.material.opacity = 0.85 * fl;
      const seen = last >= 0 ? 1 : 0;
      posOn(S.a, SR, TOP + 0.62 + bump * 0.03, S.lab.position);
      S.lab.lookAt(camera.position);
      S.lab.scale.setScalar(1 + 0.14 * fl);
      S.lab.material.opacity = (0.55 + 0.45 * Math.max(seen * 0.6, fl)) * (1 - ei(k(t, PULL, PULL + 0.4)) * 0.6);
    });
    star.rotation.y = t * 1.1 + eo(k(t, T1 + 0.45, T1 + 1.3)) * Math.PI * 4;
    starGlow.material.opacity = 0.25 + 0.5 * flare;
    arrow.rotation.y = t * 0.9 + Math.PI / 2;
    arrow.rotation.z = -t * 0.6;
    drawApp(v, t);
    ph.userData.sheen.position.x = Math.sin(t * 0.7) * 0.02;

    // Customer turns to follow the token and warms with each visit.
    const fa = theta(Math.max(T0, t - 0.25));
    // (pi - angle faces the token; after the last lap the figure turns the rest of the way to face us.)
    who.rotation.y = Math.PI - fa + eio(k(t, T1 + 0.05, T1 + 0.5)) * Math.PI + Math.sin(t * 0.8) * 0.05;
    who.position.y = Math.sin(Math.PI * k(t, T1 + 0.38, T1 + 0.75)) * 0.04;
    const warm = (v - 1) / 2 * clamp(t - T0) + flare * 1.6;
    heart.material.opacity = clamp(0.15 + 0.35 * warm);
    heart.scale.setScalar(0.18 + 0.14 * warm);
    heartL.intensity = 0.6 * warm;

    // The burst when the third visit lands.
    for (let i = 0; i < BN; i++) {
      const [dx, dy, dz, sp] = DIRS[i], e = eo(boom) * sp;
      bposA[i * 3] = dx * e * 1.1; bposA[i * 3 + 1] = 0.53 + dy * e * 0.9 - boom * boom * 0.25; bposA[i * 3 + 2] = dz * e * 1.1;
    }
    bGeo.attributes.position.needsUpdate = true;
    burst.visible = boom > 0 && boom < 1; burst.material.opacity = 1 - ei(boom);

    // Counter flips with each visit, then turns over to the title.
    const flipQ = VISIT_T.reduce((m, tv) => Math.max(m, Math.sin(Math.PI * k(t, tv - 0.12, tv + 0.12))), 0);
    const cIn = eo(k(t, 0.5, 0.95)), cOut = k(t, PULL, PULL + 0.22);
    drawCtr(v);
    ctr.position.set(0, 1.32, -0.35); ctr.lookAt(camera.position); ctr.rotateX(-ei(cOut) * Math.PI / 2);
    ctr.scale.set(1, Math.max(0.001, 1 - 0.95 * flipQ), 1);
    ctr.material.opacity = cIn * (1 - cOut); ctr.visible = cIn > 0.01 && cOut < 1;
    const tIn = back(k(t, PULL + 0.18, PULL + 0.7));
    title.position.set(0, 1.18, -0.35); title.lookAt(camera.position); title.rotateX((1 - tIn) * Math.PI / 2);
    title.material.opacity = clamp(tIn); title.visible = tIn > 0.01;
  }

  return { scene, camera, update, duration: D, poster: 7.6 };
}
