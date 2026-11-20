// New York Lottery single sign-on lit loop, 10 s. "One account for every door."
// Four doors stand in a dark hall: the website, the app, Collect 'N Win and Second Chance, each with
// its own keypad and its own password. One by one they refuse. Gold light gathers into a single key,
// the key visits each keypad, every door swings open on the same account, and the camera pulls back
// to four lit doorways and one line: 1 account, 4 experiences.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';

const D = 10;
const NAVY = '#0f2557', GOLD = '#ffc629';
const DOORS = ['WEBSITE', 'APP', "COLLECT 'N WIN", 'SECOND CHANCE'];
const XS = [-1.56, -0.52, 0.52, 1.56];
const FAIL = [0.55, 1.05, 1.55, 2.05];       // each keypad refuses its password
const TOUCH = [4.55, 5.2, 5.85, 6.5];        // the one key unlocks each door
const TINT = [0xfff1d6, 0xffe2a0, 0xe8ffd8, 0xffd9ec];
const DW = 0.66, DH = 1.48;

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04060e);
  scene.fog = new THREE.Fog(0x04060e, 3.5, 9.5);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(36, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- hall
  const floor = mesh(new THREE.PlaneGeometry(16, 12), std(0xffffff, { map: grainTex('#0b1226', { size: 512, speck: 0.04, blot: 0.1, seed: 14, repeat: 6 }), roughness: 0.2, metalness: 0.45 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  scene.add(new THREE.HemisphereLight(0x2d4a9a, 0x04060e, 0.45));
  const top = new THREE.SpotLight(0xb9c9ff, 14, 0, 0.9, 0.8, 1.5);
  top.position.set(0, 3.6, 1.6); top.target.position.set(0, 0.6, 0);
  top.castShadow = true; top.shadow.mapSize.set(1024, 1024); top.shadow.bias = -0.0003; top.shadow.normalBias = 0.02;
  scene.add(top, top.target);

  // ----------------------------------------------------------- doors
  const frameM = std(0x1a2648, { roughness: 0.35, metalness: 0.6 });
  const doorM = std(0x14204a, { roughness: 0.4, metalness: 0.25 });
  const doors = DOORS.map((name, i) => {
    const x = XS[i], z = -Math.abs(x) * 0.28, ry = -x * 0.16;
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    // Frame
    [[-DW / 2 - 0.04, DH / 2, 0.08, DH + 0.08], [DW / 2 + 0.04, DH / 2, 0.08, DH + 0.08]].forEach(([fx, fy, fw, fh]) => { const f = mesh(new THREE.BoxGeometry(fw, fh, 0.14), frameM); f.position.set(fx, fy, 0); g.add(f); });
    const lintel = mesh(new THREE.BoxGeometry(DW + 0.16, 0.08, 0.14), frameM); lintel.position.set(0, DH + 0.04, 0); g.add(lintel);
    // The room behind: pure light, only seen once the door opens.
    const light = new THREE.Mesh(new THREE.PlaneGeometry(DW, DH), new THREE.MeshBasicMaterial({ color: TINT[i], toneMapped: false }));
    light.position.set(0, DH / 2, -0.05); g.add(light);
    const spill = new THREE.PointLight(TINT[i], 0, 3.2, 1.6); spill.position.set(0, 0.7, 0.35); g.add(spill);
    const halo = glow(TINT[i], 1.6, 0, 0.45); halo.position.set(0, DH / 2, 0.05); halo.scale.set(1.1, 2.1, 1); g.add(halo);
    // Door leaf on a hinge at its left edge.
    const hinge = new THREE.Group(); hinge.position.set(-DW / 2, 0, 0.02); g.add(hinge);
    const leaf = mesh(new THREE.BoxGeometry(DW, DH, 0.045), doorM); leaf.position.set(DW / 2, DH / 2, 0); hinge.add(leaf);
    [0.32, 0.98].forEach((py) => { const inset = mesh(new THREE.BoxGeometry(DW - 0.16, 0.5, 0.012), std(0x1c2a5c, { roughness: 0.3, metalness: 0.35 })); inset.position.set(DW / 2, py + 0.12, 0.028); hinge.add(inset); });
    const knob = mesh(new THREE.SphereGeometry(0.03, 16, 12), std(0xffc629, { metalness: 1, roughness: 0.25 })); knob.position.set(DW - 0.08, 0.78, 0.05); hinge.add(knob);
    // Sign
    const sign = label(name, { font: '800 56px Inter, system-ui, sans-serif', fg: GOLD, h: 0.12, track: 4 });
    sign.position.set(0, DH + 0.2, 0.02); g.add(sign);
    // Keypad: idle, refused, unlocked.
    const pad = canvasTex(180, 260);
    const padM = new THREE.Mesh(new THREE.PlaneGeometry(0.15, 0.217), new THREE.MeshBasicMaterial({ map: pad.tex, toneMapped: false }));
    padM.position.set(DW / 2 + 0.16, 0.95, 0.03); g.add(padM);
    const padBox = mesh(new THREE.BoxGeometry(0.17, 0.237, 0.03), std(0x0b0f1c, { roughness: 0.3, metalness: 0.5 })); padBox.position.set(DW / 2 + 0.16, 0.95, 0.012); g.add(padBox);
    const padGlow = glow(0xff3344, 0.5, 0, 0.4); padGlow.position.set(DW / 2 + 0.16, 0.95, 0.06); g.add(padGlow);
    let padState = '';
    const drawPad = (st) => {
      if (st === padState) return; padState = st;
      pad.redraw((c, w, h) => {
        c.fillStyle = st === 'no' ? '#3a0a12' : st === 'ok' ? '#2a2104' : '#0c1530'; c.fillRect(0, 0, w, h);
        c.strokeStyle = st === 'no' ? '#ff4455' : st === 'ok' ? GOLD : '#2c4a9a'; c.lineWidth = 6; roundRect(c, 6, 6, w - 12, h - 12, 16); c.stroke();
        c.fillStyle = st === 'no' ? '#ff6b78' : st === 'ok' ? GOLD : '#8fa6e8'; c.textAlign = 'center'; c.textBaseline = 'middle';
        if (st === 'ok') { c.lineWidth = 12; c.strokeStyle = GOLD; c.beginPath(); c.moveTo(56, 92); c.lineTo(82, 118); c.lineTo(128, 66); c.stroke(); }
        else { // padlock
          c.lineWidth = 10; c.strokeStyle = c.fillStyle; c.beginPath(); c.arc(w / 2, 82, 26, Math.PI, 0); c.stroke();
          roundRect(c, w / 2 - 40, 80, 80, 56, 10); c.fill();
        }
        c.font = '800 30px "JetBrains Mono", ui-monospace, monospace'; c.fillStyle = st === 'ok' ? GOLD : '#ffffff';
        c.fillText(st === 'ok' ? 'OPEN' : '••••••', w / 2, 190);
        c.font = '700 16px Inter, system-ui, sans-serif'; c.fillStyle = 'rgba(255,255,255,0.6)';
        c.fillText(st === 'no' ? 'Wrong password' : st === 'ok' ? 'Signed in' : 'Password', w / 2, 226);
      });
    };
    return { g, hinge, light, spill, halo, padM, padGlow, drawPad, x, z, ry };
  });

  // ----------------------------------------------------------- the one key
  const key = new THREE.Group();
  const gold = std(0xffc629, { metalness: 1, roughness: 0.22, emissive: 0x6a4a00, emissiveIntensity: 0.4 });
  const bow = mesh(new THREE.TorusGeometry(0.06, 0.017, 14, 40), gold); key.add(bow);
  const shaft = mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.2, 16), gold); shaft.rotation.z = Math.PI / 2; shaft.position.x = 0.16; key.add(shaft);
  [[0.21, 0.035], [0.245, 0.025]].forEach(([tx, th]) => { const tooth = mesh(new THREE.BoxGeometry(0.018, th, 0.016), gold); tooth.position.set(tx, -th / 2 - 0.008, 0); key.add(tooth); });
  const keyGlow = glow(0xffc629, 0.7, 0.8, 0.3); key.add(keyGlow);
  const keyLight = new THREE.PointLight(0xffc629, 0, 1.6, 1.6); key.add(keyLight);
  scene.add(key);
  const PN = 420, ppos = new Float32Array(PN * 3);
  const pGeo = new THREE.BufferGeometry(); pGeo.setAttribute('position', new THREE.BufferAttribute(ppos, 3));
  const motes = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffd25a, size: 0.016, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  motes.frustumCulled = false; scene.add(motes);

  // ----------------------------------------------------------- captions
  const ask = label('Which password was this one?', { font: '700 52px Inter, system-ui, sans-serif', fg: '#ffffff', bg: 'rgba(15,37,87,0.85)', h: 0.13, pad: 40 });
  scene.add(ask);
  const one = label('1 account  ·  4 experiences', { font: '800 56px Inter, system-ui, sans-serif', fg: NAVY, bg: GOLD, h: 0.15, pad: 44 });
  scene.add(one);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-1.5, 1.02, 2.5]], [2.6, [1.15, 0.98, 2.45], eio],
    [4.0, [0.0, 1.0, 2.35]], [7.1, [0.15, 0.96, 2.2], (x) => x],
    [9.2, [0.0, 1.55, 4.1]], [10, [0.0, 1.6, 4.3], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.95, 0.88, 0]], [2.6, [0.75, 0.88, 0], eio],
    [4.0, [0, 0.92, 0.5]], [7.1, [0.2, 0.9, 0.2], (x) => x],
    [9.2, [0, 0.82, 0]], [10, [0, 0.82, 0], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), a = new THREE.Vector3(), b = new THREE.Vector3(), mid = new THREE.Vector3();
  const HOVER = new THREE.Vector3(0, 1.02, 1.05);
  const padWorld = doors.map((d) => { d.g.updateMatrixWorld(); return d.padM.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0, 0.12)); });

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.01, p[1] + Math.sin(t * 1.6) * 0.006, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 36], [7.1, 36], [9.2, 40]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Act 1: each keypad refuses with a red flash and a shake.
    doors.forEach((d, i) => {
      const f = k(t, FAIL[i], FAIL[i] + 0.55), unlocked = t > TOUCH[i];
      const no = f > 0 && f < 1 && !unlocked;
      d.drawPad(unlocked ? 'ok' : no ? 'no' : 'idle');
      d.padM.position.x = DW / 2 + 0.16 + (no ? Math.sin(f * Math.PI * 9) * 0.012 * (1 - f) : 0);
      d.padGlow.material.color.set(unlocked ? 0xffc629 : 0xff3344);
      d.padGlow.material.opacity = no ? 0.9 * (1 - f) : unlocked ? 0.55 : 0;
      // Act 3: door swings open, light spills across the floor.
      const o = back(k(t, TOUCH[i] + 0.08, TOUCH[i] + 0.75));
      d.hinge.rotation.y = -o * 1.75;
      const lit = eo(k(t, TOUCH[i] + 0.05, TOUCH[i] + 0.6));
      d.spill.intensity = 5.5 * lit;
      d.halo.material.opacity = 0.55 * lit;
      d.light.material.color.setHex(TINT[i]).multiplyScalar(0.25 + 0.75 * lit);
    });
    const askP = eo(k(t, 1.3, 1.8)) * (1 - ei(k(t, 2.7, 3.1)));
    ask.position.set(lerp(-0.2, 0.5, k(t, 1.3, 3.1)), 1.98, 0.55); ask.lookAt(camera.position);
    ask.material.opacity = askP; ask.visible = askP > 0.01;

    // Act 2: gold motes gather into one key.
    const gath = k(t, 2.55, 3.55);
    for (let i = 0; i < PN; i++) {
      const th = rnd(i, 1) * Math.PI * 2, ph = Math.acos(2 * rnd(i, 2) - 1), r = 1.1 + rnd(i, 3) * 1.4;
      const e = eio(clamp(gath * 1.25 - rnd(i, 4) * 0.25));
      const sx = HOVER.x + r * Math.sin(ph) * Math.cos(th), sy = Math.max(0.05, HOVER.y + r * Math.cos(ph) * 0.6), sz = HOVER.z + r * Math.sin(ph) * Math.sin(th) * 0.6;
      const swirl = (1 - e) * 0.6;
      ppos[i * 3] = lerp(sx, HOVER.x, e) + Math.cos(t * 2 + i) * swirl * 0.1;
      ppos[i * 3 + 1] = lerp(sy, HOVER.y, e) + Math.sin(t * 2.3 + i) * swirl * 0.1;
      ppos[i * 3 + 2] = lerp(sz, HOVER.z, e);
    }
    pGeo.attributes.position.needsUpdate = true;
    motes.visible = gath > 0 && gath < 1;
    motes.material.opacity = Math.sin(Math.PI * gath);

    // Key path: hover, then visit each keypad in an arc, then return to hover.
    const born = back(k(t, 3.2, 3.75));
    key.scale.setScalar(Math.max(0.001, born));
    key.visible = t > 3.2;
    let pos = HOVER;
    const seg = TOUCH.findIndex((tt) => t < tt);
    if (t > 3.9) {
      const s = seg < 0 ? 4 : seg;
      a.copy(s === 0 ? HOVER : padWorld[s - 1]);
      b.copy(s === 4 ? HOVER : padWorld[s]);
      const t0 = s === 0 ? 3.95 : TOUCH[s - 1] + 0.12, t1 = s === 4 ? 7.3 : TOUCH[s];
      const e = eio(k(t, t0, t1));
      mid.lerpVectors(a, b, 0.5); mid.y += 0.22; mid.z += 0.25;
      pos = new THREE.Vector3(
        (1 - e) * (1 - e) * a.x + 2 * (1 - e) * e * mid.x + e * e * b.x,
        (1 - e) * (1 - e) * a.y + 2 * (1 - e) * e * mid.y + e * e * b.y,
        (1 - e) * (1 - e) * a.z + 2 * (1 - e) * e * mid.z + e * e * b.z,
      );
    }
    key.position.copy(pos).add(new THREE.Vector3(0, Math.sin(t * 2.2) * 0.012, 0));
    const turning = TOUCH.some((tt) => t > tt - 0.05 && t < tt + 0.25);
    key.rotation.set(0, Math.sin(t * 1.4) * 0.6 + (t < 3.9 ? t * 2.4 : 0), turning ? Math.PI / 2 : 0);
    keyLight.intensity = 1.6 * clamp(born);
    keyGlow.material.opacity = 0.75 + (turning ? 0.25 : 0);

    // Close: one line for all four doors.
    const o1 = back(k(t, 7.45, 8.0)), o2 = ei(k(t, 9.2, 9.6));
    one.position.set(0, 2.05, 0.35); one.lookAt(camera.position);
    one.scale.setScalar(Math.max(0.001, o1));
    one.material.opacity = clamp(o1) * (1 - o2); one.visible = o1 > 0.01;
  }

  return { scene, camera, update, duration: D, poster: 7.6 };
}
