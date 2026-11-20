// Thomas Edison Center website lit loop, 10 s. "The light comes on, and the services step forward."
// A sage-green community room at dawn: an oak table, a monitor, and an Edison bulb hanging on its cord.
// The bulb flickers and catches, warm light floods the room and the morning sun climbs through the
// window, throwing mullion shadows across the plaster. A mote of light drops from the bulb into the
// website's hero, where the drawn bulb lights to match and the site lays itself out. Then its three
// service cards (adult day, vocational, families) pop out of the page in depth, spin once and land
// leaning on a ledge, each with its small brass-lit token, while the camera settles on the whole room.
import {
  THREE, k, kf, lerp, eo, eio, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip, sway,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif';
const GREEN = '#24433a', CREAM = '#f1e8d6', AMBER = '#e9a03b';
// The three services, as the old loop showed them. Colors are the site's own accents.
const SERV = [
  { n: 'Adult day', c: '#e29a34', t: '#f7dfb6' },
  { n: 'Vocational', c: '#3f8f7a', t: '#cfe6dd' },
  { n: 'Families', c: '#d26e55', t: '#f5d4c9' },
];
const LAUNCH = [4.15, 4.45, 4.75];          // each card leaves the page
const FLY = 0.85;                            // flight time
const LAND = LAUNCH.map((l) => l + FLY);
const CW = 0.56, CH = 0.7;                   // card size
const CARD_X = [-0.66, 0, 0.66], CARD_Z = 0.44, CARD_RY = [0.2, 0, -0.2];
const BX = -0.85, BZ = 0.35, PIVOT_Y = 3.0;  // the bulb's hanging point
const MON_Z = -0.35, SCR_Y = 0.98, SW = 1.76, SH = 1.08, UW = 1024, UH = 628;
const TILE = { y: 420, h: 176, w: 304, x: [32, 360, 688] };

function cardFace(s) {
  return canvasTex(448, 560, (c, w, h) => {
    c.fillStyle = '#efe6d4'; c.fillRect(0, 0, w, h);
    const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.06)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    // Token backdrop: the 3D token sits in front of this disc.
    c.fillStyle = s.t; c.beginPath(); c.arc(108, 118, 74, 0, 7); c.fill();
    c.strokeStyle = s.c; c.lineWidth = 6; c.beginPath(); c.arc(108, 118, 74, 0, 7); c.stroke();
    c.fillStyle = GREEN; c.font = `800 62px ${SANS}`; c.textBaseline = 'alphabetic'; c.fillText(s.n, 40, 312);
    c.fillStyle = s.c; c.fillRect(42, 334, 70, 7);
    c.fillStyle = 'rgba(36,67,58,0.22)';
    roundRect(c, 42, 378, 340, 16, 8); c.fill();
    roundRect(c, 42, 410, 250, 16, 8); c.fill();
    c.fillStyle = s.c; roundRect(c, 42, 466, 150, 50, 25); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.lineCap = 'round';
    c.beginPath(); c.moveTo(98, 491); c.lineTo(136, 491); c.moveTo(124, 479); c.lineTo(137, 491); c.lineTo(124, 503); c.stroke();
  });
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1b2019);
  scene.fog = new THREE.Fog(0x1b2019, 5, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(32, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const uT = { value: 0 };

  // ----------------------------------------------------------- room
  const wall = mesh(new THREE.PlaneGeometry(12, 6), std(0xffffff, { map: grainTex('#5a6a52', { size: 256, speck: 0.08, blot: 0.12, seed: 3, repeat: 3 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 1.6, -1.3); scene.add(wall);
  // Wainscot rail: a warm line that gives the wall a scale.
  const rail = mesh(new THREE.BoxGeometry(12, 0.05, 0.04), std(0x6b5236, { roughness: 0.6 }));
  rail.position.set(0, 0.62, -1.28); scene.add(rail);
  const floor = mesh(new THREE.PlaneGeometry(14, 8), std(0xffffff, { map: grainTex('#2a1e15', { size: 256, speck: 0.1, blot: 0.1, seed: 6, repeat: 6 }), roughness: 0.7 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.set(0, -0.78, 0); scene.add(floor);

  // Oak table top, grain running left to right.
  const oak = canvasTex(1024, 512, (c, w, h) => {
    c.fillStyle = '#8c6440'; c.fillRect(0, 0, w, h);
    for (let p = 0; p < 5; p++) {
      const y = p * h / 5;
      c.fillStyle = `rgb(${132 + rnd(p, 1) * 22},${94 + rnd(p, 2) * 16},${58 + rnd(p, 3) * 12})`; c.fillRect(0, y, w, h / 5);
      for (let g = 0; g < 22; g++) {
        c.strokeStyle = `rgba(60,36,18,${0.06 + rnd(g, p) * 0.12})`; c.lineWidth = 1 + rnd(g, p + 4) * 2.2;
        const gy = y + rnd(g, p + 9) * h / 5; c.beginPath(); c.moveTo(0, gy);
        for (let x = 0; x <= w; x += 48) c.lineTo(x, gy + Math.sin(x * 0.008 + g * 1.3) * 5);
        c.stroke();
      }
      c.fillStyle = 'rgba(30,18,8,0.7)'; c.fillRect(0, y, w, 2);
    }
  });
  const table = mesh(new RoundedBoxGeometry(3.8, 0.08, 1.8, 3, 0.02), std(0xffffff, { map: oak.tex, roughness: 0.5 }));
  table.position.set(0, -0.04, 0.05); scene.add(table);
  // The ledge the cards lean on.
  const ledge = mesh(new RoundedBoxGeometry(1.95, 0.035, 0.09, 2, 0.01), std(0x5a4128, { roughness: 0.55 }));
  ledge.position.set(0, 0.0175, CARD_Z + 0.09); scene.add(ledge);

  // A potted plant at the back of the table, swaying a little in the warm air.
  const pot = mesh(new THREE.CylinderGeometry(0.12, 0.095, 0.2, 28), std(0xa45a3a, { roughness: 0.85 }));
  pot.position.set(1.32, 0.1, -0.52); scene.add(pot);
  const leafG = new THREE.SphereGeometry(1, 10, 8); leafG.translate(0, 1, 0);
  const NL = 15;
  const leaves = new THREE.InstancedMesh(leafG, sway(std(0x4f7a3c, { roughness: 0.6 }), uT, 0.05), NL);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  for (let i = 0; i < NL; i++) {
    const a = (i / NL) * Math.PI * 2 + rnd(i, 1), tilt = 0.25 + rnd(i, 2) * 0.55;
    q4.setFromEuler(new THREE.Euler(Math.sin(a) * tilt, a, -Math.cos(a) * tilt, 'YXZ'));
    m4.compose(p4.set(1.32, 0.19, -0.52), q4, s4.set(0.028, 0.12 + rnd(i, 3) * 0.07, 0.055));
    leaves.setMatrixAt(i, m4);
  }
  leaves.castShadow = true; scene.add(leaves);

  // ----------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0xb8c4d8, 0x2a2218, 0.12); scene.add(hemi);
  const L = new THREE.Vector3(-0.62, 0.56, 0.56).normalize();      // toward the window
  const sunTgt = new THREE.Vector3(0.1, 0.6, -0.5);
  const sunL = new THREE.DirectionalLight(0x9fb2d0, 0.25);
  sunL.position.copy(sunTgt).addScaledVector(L, 7); sunL.target.position.copy(sunTgt);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048);
  Object.assign(sunL.shadow.camera, { left: -2.8, right: 2.8, top: 2.8, bottom: -2.8, near: 2, far: 14 });
  sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.02;
  scene.add(sunL, sunL.target);
  const rim = new THREE.DirectionalLight(0x9db8ff, 0.5); rim.position.set(2.2, 2.4, -3); scene.add(rim);
  const bulbL = new THREE.PointLight(0xffa458, 0, 0, 2); scene.add(bulbL);
  const scrL = new THREE.PointLight(0xffe6c4, 0, 2.2, 2); scrL.position.set(0, SCR_Y, MON_Z + 0.5); scene.add(scrL);

  // The window, out of shot: its mullions only exist as shadow on the plaster.
  const bars = [];
  const WW = 1.5, WH = 1.25, T = 0.06;
  [-WW / 2, -WW / 6, WW / 6, WW / 2].forEach((x) => { const g = new THREE.BoxGeometry(T, WH, T); g.translate(x, 0, 0); bars.push(g); });
  [-WH / 2, 0, WH / 2].forEach((y) => { const g = new THREE.BoxGeometry(WW, T, T); g.translate(0, y, 0); bars.push(g); });
  const gobo = new THREE.Mesh(mergeGeometries(bars), new THREE.MeshBasicMaterial({ color: 0x000000, colorWrite: false, depthWrite: false }));
  gobo.castShadow = true; gobo.receiveShadow = false;
  const patch = new THREE.Vector3(0.55, 1.35, -1.3);
  gobo.position.copy(patch).addScaledVector(L, 2.7);
  gobo.lookAt(gobo.position.clone().add(L));
  scene.add(gobo);

  // Sunbeams: three long additive cards along the light, billboarded around their own axis.
  const beamTex = canvasTex(64, 256, (c, w, h) => {
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.35, 'rgba(255,255,255,0.8)'); g.addColorStop(0.75, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, w, h);
    const s = c.createLinearGradient(0, 0, w, 0);
    s.addColorStop(0, 'rgba(0,0,0,1)'); s.addColorStop(0.5, 'rgba(0,0,0,0)'); s.addColorStop(1, 'rgba(0,0,0,1)');
    c.globalCompositeOperation = 'destination-out'; c.fillStyle = s; c.fillRect(0, 0, w, h);
  }).tex;
  const beams = [[-0.25, 0.42], [0.35, 0.3], [0.85, 0.5]].map(([dx, wd], i) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(wd, 4.2), new THREE.MeshBasicMaterial({ map: beamTex, color: 0xffd3a0, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide, fog: false }));
    const anchor = new THREE.Vector3(dx, 0.75 + i * 0.12, -0.9 + i * 0.1).addScaledVector(L, 1.6);
    m.userData.anchor = anchor; m.position.copy(anchor);
    scene.add(m);
    return m;
  });
  const bx = new THREE.Vector3(), by = new THREE.Vector3(), bz = new THREE.Vector3(), bm = new THREE.Matrix4();

  // Dust turning in the light.
  const DN = 180, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dustM = new THREE.PointsMaterial({ color: 0xffd8a8, size: 0.011, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false });
  const dust = new THREE.Points(dGeo, dustM); dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- the Edison bulb
  const pivot = new THREE.Group(); pivot.position.set(BX, PIVOT_Y, BZ); scene.add(pivot);
  const CORD = 1.38;
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, CORD, 8), std(0x1a1715, { roughness: 0.7 }), { cast: true, receive: false });
  cord.position.y = -CORD / 2; pivot.add(cord);
  const brass = std(0xb08a4a, { metalness: 1, roughness: 0.3 });
  const socket = mesh(new THREE.CylinderGeometry(0.036, 0.042, 0.11, 24), brass); socket.position.y = -CORD - 0.05; pivot.add(socket);
  const collar = mesh(new THREE.CylinderGeometry(0.046, 0.046, 0.018, 24), brass); collar.position.y = -CORD - 0.1; pivot.add(collar);
  const prof = [[0.001, 0], [0.03, 0], [0.032, -0.03], [0.058, -0.08], [0.082, -0.14], [0.088, -0.18], [0.082, -0.225], [0.062, -0.26], [0.034, -0.278], [0.001, -0.282]].map(([r, y]) => new THREE.Vector2(r, y));
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0xfff1dc, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.2, depthWrite: false, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.6, emissive: 0xff8a30, emissiveIntensity: 0 });
  const glass = new THREE.Mesh(new THREE.LatheGeometry(prof, 40), glassM);
  glass.position.y = -CORD - 0.11; glass.renderOrder = 2; pivot.add(glass);
  // The filament: a squirrel cage of loops, hot when lit.
  const fpts = [];
  for (let i = 0; i < 120; i++) {
    const s = i / 120, a = s * Math.PI * 2;
    fpts.push(new THREE.Vector3(Math.cos(a) * 0.03, -0.075 - 0.055 * (0.5 + 0.5 * Math.cos(s * Math.PI * 12)), Math.sin(a) * 0.03));
  }
  const filM = new THREE.MeshBasicMaterial({ color: 0x2a1c12, toneMapped: false });
  const fil = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fpts, true), 240, 0.0018, 5, true), filM);
  fil.position.y = -CORD - 0.11; pivot.add(fil);
  const stemM = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.07, 6), new THREE.MeshBasicMaterial({ color: 0x3a3a38 }));
  stemM.position.y = -CORD - 0.11 - 0.045; pivot.add(stemM);
  const bulbC = new THREE.Object3D(); bulbC.position.y = -CORD - 0.11 - 0.13; pivot.add(bulbC);
  const coreGlow = glow(0xffb060, 0.34, 0, 0.3); bulbC.add(coreGlow);
  const haloGlow = glow(0xff9440, 1.7, 0, 0.18); bulbC.add(haloGlow);

  // ----------------------------------------------------------- the monitor and the website
  const mon = new THREE.Group(); mon.position.set(0, 0, MON_Z); scene.add(mon);
  const alu = std(0xa8a49c, { metalness: 1, roughness: 0.32 });
  const body = mesh(new RoundedBoxGeometry(SW + 0.08, SH + 0.08, 0.05, 3, 0.025), std(0x262523, { metalness: 0.5, roughness: 0.35 }));
  body.position.y = SCR_Y; mon.add(body);
  const neck = mesh(new THREE.BoxGeometry(0.16, 0.46, 0.035), alu); neck.position.set(0, 0.24, -0.08); neck.rotation.x = -0.12; mon.add(neck);
  const foot = mesh(new RoundedBoxGeometry(0.5, 0.02, 0.32, 2, 0.008), alu); foot.position.set(0, 0.01, -0.03); mon.add(foot);
  const ui = canvasTex(UW, UH);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SH), new THREE.MeshBasicMaterial({ map: ui.tex, toneMapped: false }));
  screen.position.set(0, SCR_Y, 0.027); mon.add(screen);
  const scrGlow = glow(0xffd9a8, 2.8, 0, 0.5); scrGlow.position.set(0, SCR_Y, -0.2); scrGlow.scale.set(3.2, 2.1, 1); mon.add(scrGlow);
  // Where a canvas point on the page sits in the world.
  const onScreen = (cx, cy, out) => out.set((cx / UW - 0.5) * SW, SCR_Y + (0.5 - cy / UH) * SH, MON_Z + 0.04);

  let uiKey = '';
  const drawUI = (t) => {
    const boot = k(t, 2.45, 2.85), lit = eo(k(t, 3.0, 3.5)), lay = eo(k(t, 3.1, 3.7));
    const tiles = [0, 1, 2].map((i) => eo(k(t, 3.5 + i * 0.12, 3.9 + i * 0.12)));
    const pops = LAUNCH.map((l) => Math.exp(-5 * Math.max(0, t - l)) * (t > l ? 1 : 0));
    const live = (t > 2.4 && t < 4.1) || pops.some((p) => p > 0.02);
    const key = live ? Math.round(t * 30) : (t < 2.4 ? 'pre' : 'post');
    if (key === uiKey) return; uiKey = key;
    ui.redraw((c, w, h) => {
      c.fillStyle = '#090a09'; c.fillRect(0, 0, w, h);
      if (boot <= 0) return;
      c.globalAlpha = boot;
      c.fillStyle = '#efe6d5'; c.fillRect(0, 0, w, h);
      // Nav
      c.fillStyle = AMBER; c.beginPath(); c.arc(52, 36, 14, 0, 7); c.fill();
      c.fillStyle = GREEN; c.fillRect(47, 48, 10, 8);
      c.fillStyle = GREEN; c.font = `800 25px ${SANS}`; c.textBaseline = 'middle'; c.fillText('Thomas Edison Center', 78, 37);
      c.fillStyle = 'rgba(36,67,58,0.28)'; [600, 690, 780].forEach((x) => { roundRect(c, x, 31, 70, 12, 6); c.fill(); });
      c.fillStyle = AMBER; roundRect(c, 876, 20, 116, 34, 17); c.fill();
      // Hero
      const hx = 32, hy = 74, hw = w - 64, hh = 326;
      c.save(); roundRect(c, hx, hy, hw, hh, 22); c.clip();
      c.fillStyle = GREEN; c.fillRect(hx, hy, hw, hh);
      if (lit > 0) {
        const g = c.createRadialGradient(196, 236, 10, 196, 236, 420);
        g.addColorStop(0, `rgba(255,190,110,${0.55 * lit})`); g.addColorStop(1, 'rgba(255,190,110,0)');
        c.fillStyle = g; c.fillRect(hx, hy, hw, hh);
      }
      // The drawn bulb, lighting to match the real one.
      c.save(); c.translate(196, 226);
      c.beginPath(); c.moveTo(-24, 66); c.quadraticCurveTo(-62, 34, -62, -8); c.arc(0, -8, 62, Math.PI, 0); c.quadraticCurveTo(62, 34, 24, 66); c.closePath();
      c.fillStyle = `rgba(${lerp(46, 255, lit)},${lerp(84, 196, lit)},${lerp(72, 110, lit)},1)`; c.fill();
      c.strokeStyle = CREAM; c.lineWidth = 6; c.stroke();
      c.fillStyle = CREAM; c.fillRect(-26, 72, 52, 12); c.fillRect(-22, 90, 44, 10);
      c.strokeStyle = lit > 0.5 ? '#7a3c08' : 'rgba(241,232,214,0.6)'; c.lineWidth = 4; c.beginPath(); c.moveTo(-14, 64); c.lineTo(-14, 6); c.lineTo(-4, 20); c.lineTo(4, 4); c.lineTo(14, 20); c.lineTo(14, 64); c.stroke();
      c.restore();
      c.globalAlpha = boot * lay;
      c.fillStyle = CREAM; c.font = `800 74px ${SANS}`; c.textBaseline = 'alphabetic';
      c.fillText('Thomas Edison', 330 + (1 - lay) * 30, 196); c.fillText('Center', 330 + (1 - lay) * 40, 274);
      c.fillStyle = 'rgba(241,232,214,0.78)'; c.font = `600 29px ${SANS}`; c.fillText('Adult day and vocational services', 332 + (1 - lay) * 50, 330);
      c.fillStyle = AMBER; roundRect(c, 332, 352, 46, 8, 4); c.fill();
      c.restore();
      c.globalAlpha = 1;
      // Service tiles: each one flashes as its card leaves the page.
      SERV.forEach((s, i) => {
        const p = tiles[i]; if (p <= 0) return;
        const x = TILE.x[i], y = TILE.y + (1 - p) * 24;
        c.globalAlpha = boot * p;
        c.fillStyle = '#fbf5ea'; roundRect(c, x, y, TILE.w, TILE.h, 18); c.fill();
        if (pops[i] > 0.01) { c.strokeStyle = s.c; c.globalAlpha = boot * p * Math.min(1, pops[i] * 1.5); c.lineWidth = 8; roundRect(c, x, y, TILE.w, TILE.h, 18); c.stroke(); c.globalAlpha = boot * p; }
        c.fillStyle = s.c; c.beginPath(); c.arc(x + 50, y + 52, 26, 0, 7); c.fill();
        c.fillStyle = GREEN; c.font = `800 34px ${SANS}`; c.textBaseline = 'middle'; c.fillText(s.n, x + 26, y + 112);
        c.fillStyle = 'rgba(36,67,58,0.2)'; roundRect(c, x + 26, y + 142, 200, 10, 5); c.fill();
      });
      c.globalAlpha = 1;
    });
  };

  // ----------------------------------------------------------- the service cards and their tokens
  const tokenGlowM = (col) => std(col, { metalness: 0.6, roughness: 0.3, emissive: col, emissiveIntensity: 0.15 });
  function token(i) {
    const g = new THREE.Group();
    const col = new THREE.Color(SERV[i].c);
    if (i === 0) { // the sun of a day program
      g.add(mesh(new THREE.SphereGeometry(0.038, 24, 16), tokenGlowM(col)));
      const ray = new THREE.ConeGeometry(0.009, 0.03, 8); ray.translate(0, 0.064, 0);
      const rays = new THREE.InstancedMesh(ray, tokenGlowM(col), 8);
      for (let r = 0; r < 8; r++) { q4.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (r / 8) * Math.PI * 2); m4.compose(p4.set(0, 0, 0), q4, s4.set(1, 1, 1)); rays.setMatrixAt(r, m4); }
      rays.castShadow = true; g.add(rays);
    } else if (i === 1) { // a gear for work skills
      g.add(mesh(new THREE.TorusGeometry(0.042, 0.016, 10, 28), tokenGlowM(col)));
      const tooth = new THREE.BoxGeometry(0.02, 0.022, 0.026); tooth.translate(0, 0.062, 0);
      const teeth = new THREE.InstancedMesh(tooth, tokenGlowM(col), 8);
      for (let r = 0; r < 8; r++) { q4.setFromAxisAngle(new THREE.Vector3(0, 0, 1), (r / 8) * Math.PI * 2); m4.compose(p4.set(0, 0, 0), q4, s4.set(1, 1, 1)); teeth.setMatrixAt(r, m4); }
      teeth.castShadow = true; g.add(teeth);
    } else { // a house for families
      const hb = mesh(new THREE.BoxGeometry(0.075, 0.058, 0.04), tokenGlowM(col)); hb.position.y = -0.02; g.add(hb);
      const roof = mesh(new THREE.ConeGeometry(0.068, 0.05, 4), tokenGlowM(col)); roof.rotation.y = Math.PI / 4; roof.position.y = 0.034; g.add(roof);
    }
    return g;
  }
  const cards = SERV.map((s, i) => {
    const g = new THREE.Group();
    const slab = mesh(new RoundedBoxGeometry(CW, CH, 0.024, 2, 0.012), std(0xe9dfcb, { roughness: 0.7 }));
    g.add(slab);
    const face = new THREE.Mesh(new THREE.PlaneGeometry(CW - 0.012, CH - 0.012), std(0xd9d2c4, { map: cardFace(s).tex, roughness: 0.62 }));
    face.position.z = 0.0125; face.receiveShadow = true; g.add(face);
    const tk = token(i); tk.position.set(-CW / 2 + 108 / 448 * CW, CH / 2 - 118 / 560 * CH, 0.045); g.add(tk);
    const flash = glow(new THREE.Color(s.c), 0.9, 0, 0.3); flash.position.z = 0.05; g.add(flash);
    scene.add(g);
    return { g, tk, flash };
  });

  // The mote that carries the bulb's light into the page.
  const mote = glow(0xffc070, 0.22, 0, 0.3); scene.add(mote);
  const moteT = glow(0xff9a40, 0.5, 0, 0.2); scene.add(moteT);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-0.48, 1.47, 1.3]], [1.95, [-0.58, 1.43, 1.42], (x) => x],
    [3.1, [-0.2, 1.2, 2.75]], [4.4, [-0.05, 1.14, 3.3]],
    [7.3, [-0.12, 1.05, 3.16], (x) => x], [10, [-0.26, 1.09, 3.32], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.85, 1.42, 0.3]], [1.95, [-0.82, 1.4, 0.3], (x) => x],
    [3.1, [-0.15, 0.95, -0.2]], [4.4, [-0.05, 0.7, 0.05]],
    [7.3, [-0.08, 0.68, 0.05], (x) => x], [10, [-0.12, 0.7, 0.05], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), from = new THREE.Vector3(), to = new THREE.Vector3(), mid = new THREE.Vector3(), bw = new THREE.Vector3();
  const cold = new THREE.Color(0x9fb2d0), warm = new THREE.Color(0xffcf9c);

  function update(t) {
    uT.value = t;
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 30], [1.95, 29], [3.1, 34], [4.4, 36], [10, 35]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Bulb: a dull red pre-glow, a few stuttering flickers, then it catches and holds.
    const pre = 0.12 * eo(k(t, 0.45, 0.85));
    const on = eo(k(t, 1.05, 1.85));
    const fl = t > 0.85 && t < 1.75 ? (rnd(Math.floor(t * 20), 7) > 0.42 ? 1 : 0.2) : 1;
    const lv = clamp(Math.max(pre, on * fl));
    const hot = clamp(lv * 1.15);
    filM.color.setRGB(lerp(0.16, 1, Math.min(1, hot * 1.4)), lerp(0.1, 0.78, hot * hot), lerp(0.07, 0.42, hot * hot * hot));
    coreGlow.material.opacity = 0.95 * lv; coreGlow.scale.setScalar(0.24 + 0.12 * lv);
    haloGlow.material.opacity = 0.42 * lv * lv;
    glassM.emissiveIntensity = 0.22 * lv;
    // The bulb swings a touch, more after it catches, on a period that closes at the seam.
    const swing = 0.018 + 0.012 * Math.exp(-2 * Math.max(0, t - 1.9)) * (t > 1.9 ? 1 : 0);
    pivot.rotation.z = Math.sin(t * Math.PI * 2 / 2.5) * swing;
    pivot.rotation.x = Math.sin(t * Math.PI * 2 / 5 + 1) * 0.008;
    pivot.updateMatrixWorld();
    bulbC.getWorldPosition(bw);
    bulbL.position.copy(bw); bulbL.intensity = 1.8 * lv;

    // Morning: the sun climbs and warms through the window as the bulb catches.
    const day = eio(k(t, 1.5, 3.6));
    sunL.intensity = lerp(0.25, 2.3, day); sunL.color.copy(cold).lerp(warm, day);
    hemi.intensity = lerp(0.12, 0.4, day);
    rim.intensity = lerp(0.5, 0.85, day);
    beams.forEach((b, i) => {
      b.material.opacity = (0.05 + 0.02 * Math.sin(t * 0.9 + i * 2)) * day;
      b.position.copy(b.userData.anchor);
      by.copy(L); bz.copy(camera.position).sub(b.position); bz.addScaledVector(by, -bz.dot(by)).normalize();
      bx.crossVectors(by, bz); bm.makeBasis(bx, by, bz); b.quaternion.setFromRotationMatrix(bm);
    });
    dustM.opacity = 0.75 * day;
    for (let i = 0; i < DN; i++) {
      const a = rnd(i, 21) * 3.4 - 0.4, w = (rnd(i, 22) - 0.5) * 1.4, h = (rnd(i, 23) - 0.5) * 0.5;
      const x = 0.2 + w + L.x * a + Math.sin(t * 0.35 + i) * 0.05, y = 0.85 + h + L.y * a + Math.sin(t * 0.5 + i * 1.7) * 0.04 - ((t * 0.02 + rnd(i, 24)) % 1) * 0.1;
      dpos[i * 3] = x; dpos[i * 3 + 1] = y; dpos[i * 3 + 2] = -0.7 + L.z * a + Math.cos(t * 0.3 + i) * 0.06 + rnd(i, 25) * 0.6;
    }
    dGeo.attributes.position.needsUpdate = true;

    // A mote of the bulb's light drops into the page's hero.
    const mt = k(t, 2.35, 3.05), me = eio(mt);
    onScreen(196, 226, to);
    mid.set(lerp(bw.x, to.x, 0.5) + 0.05, Math.max(bw.y, to.y) + 0.18, lerp(bw.z, to.z, 0.5) + 0.2);
    from.copy(bw);
    const qb = (a, b2, c2, e) => (1 - e) * (1 - e) * a + 2 * (1 - e) * e * b2 + e * e * c2;
    mote.position.set(qb(from.x, mid.x, to.x, me), qb(from.y, mid.y, to.y, me), qb(from.z, mid.z, to.z, me));
    const me2 = eio(clamp(mt - 0.08));
    moteT.position.set(qb(from.x, mid.x, to.x, me2), qb(from.y, mid.y, to.y, me2), qb(from.z, mid.z, to.z, me2));
    const mv = mt > 0 && mt < 1 ? Math.sin(Math.PI * mt) : 0;
    mote.material.opacity = mv; moteT.material.opacity = 0.5 * mv;
    mote.visible = moteT.visible = mv > 0.01;

    // The page boots and lays out.
    drawUI(t);
    const sb = eo(k(t, 2.45, 2.85));
    screen.material.color.setScalar(lerp(1, 0.82, sb));
    scrGlow.material.opacity = 0.22 * sb + 0.12 * eo(k(t, 3.0, 3.5));
    scrL.intensity = 0.9 * sb;

    // Cards pop out of their tiles, spin once, arc forward and land leaning on the ledge.
    cards.forEach(({ g, tk, flash }, i) => {
      const f = k(t, LAUNCH[i], LAND[i]), e = eio(f);
      onScreen(TILE.x[i] + TILE.w / 2, TILE.y + TILE.h / 2, from);
      to.set(CARD_X[i], CH / 2 * Math.cos(0.14) + 0.02, CARD_Z);
      mid.set(lerp(from.x, to.x, 0.5) * 1.15, Math.max(from.y, to.y) + 0.32, lerp(from.z, to.z, 0.5) + 0.35);
      g.position.set(qb(from.x, mid.x, to.x, e), qb(from.y, mid.y, to.y, e), qb(from.z, mid.z, to.z, e));
      const lp = k(t, LAND[i], LAND[i] + 0.8);
      const settle = 1 - spring(lp);
      g.position.y += (f >= 1 ? -0.012 * Math.sin(Math.PI * clamp(lp * 3)) : 0);
      g.rotation.set(-0.14 + 0.28 * settle, CARD_RY[i] + (1 - eo(f)) * Math.PI * 2 * (i === 1 ? 1 : i ? -1 : 1), (1 - e) * 0.25 * (i - 1));
      g.scale.setScalar(Math.max(0.001, lerp(0.3, 1, back(clamp(f * 1.15)))));
      g.visible = f > 0;
      flash.material.opacity = 0.9 * Math.exp(-6 * Math.max(0, t - LAUNCH[i])) * (f > 0 ? 1 : 0) + 0.6 * Math.exp(-5 * Math.max(0, t - LAND[i])) * (t > LAND[i] ? 1 : 0);
      const tp = back(k(t, LAND[i] + 0.1, LAND[i] + 0.55));
      tk.scale.setScalar(Math.max(0.001, tp));
      const spinA = (1 - eo(k(t, LAND[i] + 0.1, LAND[i] + 1.1))) * Math.PI * 2;
      if (i === 2) tk.rotation.set(0, spinA + Math.sin(t * 1.2) * 0.25, 0);
      else tk.rotation.set(0, 0, -spinA - (i === 1 ? t * 0.6 : t * 0.15));
    });
  }

  return { scene, camera, update, duration: D, poster: 7.4 };
}
