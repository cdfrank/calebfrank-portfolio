// General Motors OnStar adapter lit loop, 10 s. "The network set; the car stayed connected."
// A maroon sedan from another decade parked on an empty lot at sundown, a cell tower on the ridge behind
// it. As the sun drops behind the hills the tower's network lights die, the car's signal bars fall away
// one by one and NETWORK SUNSET flags over the roof. The camera slips in through the driver's window:
// the driver's hand brings an adapter down under the dash, lines it up and clicks it into the port; its
// light blinks amber, then holds cyan. Back outside, the tower wakes in cyan, signal rings pour down to
// the car, the bars refill, the headlights come on, and four connected services light up over the car.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const CYAN = '#46d8ff', CYAN_H = 0x46d8ff, RED = '#ff4b3e', WARM = 0xfff0d8;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const TOWER = V(7.2, 0.7, -15.45), TOWER_H = 7.0;
const ANT = V(0.78, 1.5, -0.05);                 // the car's roof antenna
const PORT = V(-0.539, 0.64, 0.55);              // face of the diagnostic port under the dash
const INSERT = V(-0.502, 0.64, 0.55), PRE = V(-0.452, 0.646, 0.552);
const CLICK = 3.86;                              // adapter seats in the port
const BAR_OFF = [1.9, 1.6, 1.3, 1.0];            // bars die, tallest first
const BAR_ON = [5.3, 5.45, 5.6, 5.75];
const SVC_ON = [6.3, 6.55, 6.8, 7.05];

// A stylized hand of capsules: palm, four three-joint fingers and a two-joint thumb, posed per frame.
// Local frame: wrist at the origin, fingers along +Y, palm facing +Z, thumb on the +X side.
function makeHand(skin, sleeveM, cuffM) {
  const g = new THREE.Group();
  const UP = V(0, 1, 0), dv = V(0, 0, 0);
  const seg = (r, len, m = skin) => { const s = mesh(new THREE.CapsuleGeometry(r, Math.max(0.002, len), 4, 10), m); g.add(s); return s; };
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UP, dv.subVectors(b, a).normalize()); };
  const palm = mesh(new RoundedBoxGeometry(0.084, 0.096, 0.03, 3, 0.013), skin); palm.position.set(0, 0.046, 0); g.add(palm);
  const pad = mesh(new THREE.SphereGeometry(0.021, 14, 10), skin); pad.position.set(0.024, 0.024, 0.008); pad.scale.set(1, 1.35, 0.8); g.add(pad);
  seg(0.025, 0.03).position.set(0, -0.012, -0.002);
  seg(0.027, 0.2).position.set(0, -0.13, -0.004);
  seg(0.037, 0.03, cuffM).position.set(0, -0.215, -0.004);
  seg(0.043, 0.34, sleeveM).position.set(0, -0.42, -0.006);
  const SPL = [0.46, 0.3, 0.24];
  const fingers = [[0.029, 0.09, 0.078, 0.0088], [0.0095, 0.095, 0.086, 0.0092], [-0.0095, 0.091, 0.08, 0.0087], [-0.028, 0.082, 0.064, 0.0077]]
    .map(([x, y, L, r]) => ({ base: V(x, y, 0.002), L, segs: SPL.map((f, j) => seg(r * (1 - j * 0.07), L * f - r)), tip: V(0, 0, 0) }));
  const thumb = { base: V(0.036, 0.018, 0.012), segs: [seg(0.0115, 0.034), seg(0.0102, 0.026)], tip: V(0, 0, 0) };
  const a = V(0, 0, 0), b = V(0, 0, 0), d = V(0, 0, 0), d2 = V(0, 0, 0);
  const OPEN = V(0.8, 0.55, 0.15).normalize(), OPP = V(0.15, 0.6, 0.78).normalize(), IN = V(-0.6, 0.45, 0.65).normalize();
  g.userData.fingers = fingers; g.userData.thumb = thumb;
  g.userData.pose = ({ curl, opp = 0.3, tcurl = 0.2, spread = 0 }) => {
    fingers.forEach((f, i) => {
      const c = curl[i], sp = (1.5 - i) * 0.06 * (1 + spread);
      const angs = [c * 1.35, c * 3.05, c * 4.2];
      a.copy(f.base);
      f.segs.forEach((s, j) => {
        d.set(Math.sin(sp) * Math.cos(angs[j]), Math.cos(sp) * Math.cos(angs[j]), Math.sin(angs[j]));
        b.copy(a).addScaledVector(d, f.L * SPL[j]); place(s, a, b); a.copy(b);
      });
      f.tip.copy(a);
    });
    d.copy(OPEN).lerp(OPP, opp).normalize();
    d2.copy(d).lerp(IN, tcurl).normalize();
    a.copy(thumb.base); b.copy(a).addScaledVector(d, 0.045); place(thumb.segs[0], a, b);
    a.copy(b); b.copy(a).addScaledVector(d2, 0.036); place(thumb.segs[1], a, b);
    thumb.tip.copy(b);
  };
  return g;
}

// The four connected services, as icons: safety shield, navigation arrow, remote lock, diagnostics wrench.
function drawIcon(c, w, i) {
  c.clearRect(0, 0, w, w);
  c.fillStyle = 'rgba(10,18,30,0.72)'; roundRect(c, 8, 8, w - 16, w - 16, 44); c.fill();
  c.strokeStyle = '#ffffff'; c.lineWidth = 7; roundRect(c, 8, 8, w - 16, w - 16, 44); c.stroke();
  c.save(); c.translate(w / 2, w / 2); c.scale(w / 34, w / 34);
  c.strokeStyle = '#ffffff'; c.lineWidth = 1.7; c.lineJoin = 'round'; c.lineCap = 'round';
  c.beginPath();
  if (i === 0) { c.moveTo(0, -8); c.lineTo(7, -5); c.lineTo(7, 1); c.quadraticCurveTo(7, 6, 0, 9); c.quadraticCurveTo(-7, 6, -7, 1); c.lineTo(-7, -5); c.closePath(); }
  else if (i === 1) { c.moveTo(-6, 6); c.lineTo(0, -8); c.lineTo(6, 6); c.lineTo(0, 2); c.closePath(); }
  else if (i === 2) { c.rect(-6, -2, 12, 9); c.moveTo(-3.5, -2); c.lineTo(-3.5, -5); c.quadraticCurveTo(-3.5, -8, 0, -8); c.quadraticCurveTo(3.5, -8, 3.5, -5); c.lineTo(3.5, -2); }
  else { c.moveTo(-6, 6); c.lineTo(3, -3); c.moveTo(2, -7); c.quadraticCurveTo(7, -8, 7, -3); c.lineTo(4, -3); c.lineTo(3, -4); c.lineTo(3, -7); c.closePath(); }
  c.stroke(); c.restore();
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0c1024);
  scene.fog = new THREE.Fog(0x241c32, 14, 46);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 80);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- sky, sun, hills, lot
  const skyA = skyDome([[0, '#0d1236'], [0.36, '#2c2a5e'], [0.46, '#a3506a'], [0.495, '#ffb468'], [0.52, '#5a3040'], [1, '#120e18']], 50);
  const skyB = skyDome([[0, '#05071a'], [0.38, '#121a40'], [0.47, '#3a2c58'], [0.497, '#7a3e52'], [0.52, '#1a1424'], [1, '#0a0810']], 49);
  skyB.material.transparent = true; skyB.material.opacity = 0;
  scene.add(skyA, skyB);
  const sun = glow(0xffa860, 10, 0.9, 0.18); sun.material.fog = false; scene.add(sun);
  const sunCore = glow(0xfff0d0, 2.6, 1, 0.3); sunCore.material.fog = false; scene.add(sunCore);
  const SUN_X = 1.6, SUN_Z = -25.5;
  const hillM = std(0x16121e, { roughness: 1 });
  [[-14, -24, 13, 0.32], [0, -22, 10, 0.26], [7.5, -16.5, 6, 0.3], [20, -20, 11, 0.36], [-4, -30, 16, 0.3]].forEach(([x, z, r, sy]) => {
    const h = mesh(new THREE.SphereGeometry(r, 40, 16), hillM, { cast: false }); h.scale.set(1, sy, 1); h.position.set(x, -r * sy * 0.55, z); scene.add(h);
  });
  // A tree line along the ridge, in silhouette.
  const treeIM = new THREE.InstancedMesh(new THREE.ConeGeometry(0.55, 2.2, 7), std(0x0d0c14, { roughness: 1 }), 46);
  for (let i = 0; i < 46; i++) {
    const x = -22 + i * 0.95 + rnd(i, 3) * 0.6, z = -17.5 - rnd(i, 4) * 3, s = 0.7 + rnd(i, 5) * 0.8;
    if (x > 3.5 && x < 11) { treeIM.setMatrixAt(i, new THREE.Matrix4().makeScale(0, 0, 0)); continue; }
    treeIM.setMatrixAt(i, new THREE.Matrix4().compose(V(x, 1.1 * s - 0.3, z), new THREE.Quaternion(), V(s, s, s)));
  }
  scene.add(treeIM);
  const lot = mesh(new THREE.PlaneGeometry(90, 90), std(0xffffff, { map: grainTex('#211f26', { size: 256, speck: 0.2, blot: 0.1, seed: 5, repeat: 26 }), roughness: 0.5, metalness: 0.1 }), { cast: false });
  lot.rotation.x = -Math.PI / 2; scene.add(lot);
  const lineM = std(0x8f8a80, { roughness: 0.8 });
  [-1.45, 1.45].forEach((z) => { const l = mesh(new THREE.PlaneGeometry(5.6, 0.1), lineM, { cast: false }); l.rotation.x = -Math.PI / 2; l.position.set(0.4, 0.004, z); scene.add(l); });

  // ----------------------------------------------------------- lights
  const hemi = new THREE.HemisphereLight(0x6a6290, 0x120c10, 0.42); scene.add(hemi);
  const sunL = new THREE.DirectionalLight(0xffa868, 2.6);
  sunL.position.set(-1.5, 3.2, -12); sunL.target.position.set(0, 0.4, 0);
  sunL.castShadow = true; sunL.shadow.mapSize.set(2048, 2048); sunL.shadow.bias = -0.0004; sunL.shadow.normalBias = 0.03;
  Object.assign(sunL.shadow.camera, { left: -4.5, right: 4.5, top: 4, bottom: -4, near: 2, far: 24 });
  scene.add(sunL, sunL.target);
  const moon = new THREE.DirectionalLight(0x8aa2ff, 0); moon.position.set(-6, 5, 7); scene.add(moon);
  const dome = new THREE.PointLight(0xffd6a8, 0, 2.4, 1.6); dome.position.set(-0.05, 1.32, 0.3); scene.add(dome);
  const heads = new THREE.SpotLight(0xfff1d6, 0, 0, 0.5, 0.7, 1.4); heads.position.set(-2.3, 0.66, 0); heads.target.position.set(-7, 0, 0.2); scene.add(heads, heads.target);
  const SUN_C = new THREE.Color(0xffa868), DUSK_C = new THREE.Color(0xc85a6a);

  // ----------------------------------------------------------- the car
  const paint = new THREE.MeshPhysicalMaterial({ color: 0x5c1a22, metalness: 0.45, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.12 });
  const trimM = std(0x17171b, { roughness: 0.5, metalness: 0.3 });
  const chrome = std(0xd8dade, { metalness: 1, roughness: 0.18 });
  const extrude = (pts, depth, m, bevel = 0.05) => {
    const s = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
    const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments: 8 });
    geo.translate(0, 0, -depth / 2);
    return mesh(geo, m);
  };
  const carG = new THREE.Group(); scene.add(carG);
  carG.add(extrude([[-2.26, 0.34], [-2.3, 0.58], [-2.16, 0.8], [-1.0, 0.88], [1.3, 0.9], [2.14, 0.88], [2.28, 0.7], [2.26, 0.36]], 1.72, paint));
  const glassM = new THREE.MeshPhysicalMaterial({ color: 0x0f1724, roughness: 0.05, metalness: 0.25, transparent: true, opacity: 0.6, envMapIntensity: 1.3 });
  const glassMesh = extrude([[-1.0, 0.9], [-0.36, 1.37], [0.84, 1.39], [1.34, 0.92]], 1.44, glassM, 0.04);
  glassMesh.castShadow = false; carG.add(glassMesh);
  const roof = mesh(new RoundedBoxGeometry(1.24, 0.05, 1.5, 3, 0.02), paint); roof.position.set(0.24, 1.42, 0); carG.add(roof);
  [-1, 1].forEach((sg) => {
    const pil = mesh(new THREE.BoxGeometry(0.09, 0.5, 0.04), paint); pil.position.set(0.28, 1.15, sg * 0.745); carG.add(pil);
    const strip = mesh(new THREE.BoxGeometry(2.3, 0.018, 0.012), chrome); strip.position.set(0.17, 0.93, sg * 0.77); carG.add(strip);
    const rub = mesh(new THREE.BoxGeometry(3.6, 0.05, 0.03), trimM); rub.position.set(0, 0.55, sg * 0.915); carG.add(rub);
  });
  const bumpF = mesh(new RoundedBoxGeometry(0.18, 0.2, 1.84, 3, 0.05), trimM); bumpF.position.set(-2.32, 0.42, 0); carG.add(bumpF);
  const bumpR = mesh(new RoundedBoxGeometry(0.18, 0.2, 1.84, 3, 0.05), trimM); bumpR.position.set(2.32, 0.42, 0); carG.add(bumpR);
  const grille = mesh(new THREE.BoxGeometry(0.03, 0.14, 0.82), std(0x0b0b0d, { roughness: 0.4, metalness: 0.6 })); grille.position.set(-2.33, 0.66, 0); carG.add(grille);
  const headM = new THREE.MeshBasicMaterial({ color: 0x3a3a40, toneMapped: false });
  const tailM = new THREE.MeshBasicMaterial({ color: 0x3a0c0c, toneMapped: false });
  const headGlows = [], tailGlows = [];
  [-1, 1].forEach((sg) => {
    const h = mesh(new RoundedBoxGeometry(0.04, 0.13, 0.32, 2, 0.015), headM, { cast: false }); h.position.set(-2.33, 0.67, sg * 0.62); carG.add(h);
    const tl = mesh(new RoundedBoxGeometry(0.04, 0.12, 0.34, 2, 0.015), tailM, { cast: false }); tl.position.set(2.31, 0.7, sg * 0.6); carG.add(tl);
    const hg = glow(WARM, 1, 0, 0.35); hg.position.set(-2.42, 0.67, sg * 0.62); carG.add(hg); headGlows.push(hg);
    const tg = glow(0xff3020, 0.6, 0, 0.4); tg.position.set(2.4, 0.7, sg * 0.6); carG.add(tg); tailGlows.push(tg);
  });
  const mirror = mesh(new RoundedBoxGeometry(0.12, 0.09, 0.16, 2, 0.02), paint); mirror.position.set(-0.78, 1.0, 0.95); carG.add(mirror);
  const antenna = mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.34, 6), trimM); antenna.position.set(ANT.x, 1.6, ANT.z); antenna.rotation.z = -0.25; carG.add(antenna);
  const antGlow = glow(CYAN_H, 0.35, 0, 0.4); antGlow.position.copy(ANT).add(V(0.04, 0.2, 0)); scene.add(antGlow);
  // Wheels: tires, steel rims and hubcaps.
  const tireM = std(0x111113, { roughness: 0.85 });
  const tireG = new THREE.CylinderGeometry(0.34, 0.34, 0.22, 32); tireG.rotateX(Math.PI / 2);
  const rimG = new THREE.CylinderGeometry(0.2, 0.2, 0.226, 24); rimG.rotateX(Math.PI / 2);
  const tireIM = new THREE.InstancedMesh(tireG, tireM, 4), rimIM = new THREE.InstancedMesh(rimG, chrome, 4);
  [[-1.42, 0.8], [1.42, 0.8], [-1.42, -0.8], [1.42, -0.8]].forEach(([x, z], i) => {
    const m4 = new THREE.Matrix4().makeTranslation(x, 0.34, z); tireIM.setMatrixAt(i, m4); rimIM.setMatrixAt(i, m4);
  });
  tireIM.castShadow = rimIM.castShadow = true; carG.add(tireIM, rimIM);

  // The cabin, seen from inside: floor, firewall, door card, dash, knee panel, column, wheel and seats.
  const cloth = std(0x24232a, { roughness: 0.95 }), plastic = std(0x2e2c33, { roughness: 0.62 }), carpet = std(0x18171c, { roughness: 1 });
  const box = (w, h, d, x, y, z, m) => { const b = mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); carG.add(b); return b; };
  box(2.2, 0.02, 1.6, 0.15, 0.36, 0, carpet);
  box(0.04, 0.56, 1.6, -0.97, 0.62, 0, carpet);
  const doorCard = mesh(new THREE.PlaneGeometry(1.9, 0.56), new THREE.MeshStandardMaterial({ color: 0x2a282e, roughness: 0.8, side: THREE.DoubleSide })); doorCard.position.set(0.0, 0.64, 0.83); carG.add(doorCard);
  box(0.4, 0.2, 1.56, -0.8, 0.9, 0, plastic);
  box(0.2, 0.25, 0.8, -0.65, 0.72, 0.45, plastic);
  const col = mesh(new THREE.CylinderGeometry(0.035, 0.045, 0.32, 14), plastic); col.position.set(-0.53, 0.92, 0.38); col.rotation.z = -1.03; carG.add(col);
  const wheel = mesh(new THREE.TorusGeometry(0.19, 0.017, 10, 40), std(0x1a191d, { roughness: 0.55 })); wheel.position.set(-0.4, 1.0, 0.38); wheel.rotation.y = Math.PI / 2; wheel.rotateX(-0.54); carG.add(wheel);
  const hub = mesh(new THREE.CylinderGeometry(0.06, 0.07, 0.04, 16), plastic); hub.position.set(-0.405, 1.0, 0.38); hub.rotation.z = -1.03; carG.add(hub);
  const cuIM = new THREE.InstancedMesh(new RoundedBoxGeometry(0.52, 0.12, 0.5, 3, 0.04), cloth, 2), bkIM = new THREE.InstancedMesh(new RoundedBoxGeometry(0.12, 0.62, 0.5, 3, 0.04), cloth, 2);
  [0.38, -0.38].forEach((z, i) => {
    cuIM.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0.3, 0.52, z));
    bkIM.setMatrixAt(i, new THREE.Matrix4().compose(V(0.6, 0.86, z), new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), -0.18), V(1, 1, 1)));
  });
  carG.add(cuIM, bkIM);
  // The diagnostic port under the dash: a trapezoid housing with two rows of pins.
  const portFace = canvasTex(160, 80, (c, w, h) => {
    c.fillStyle = '#0c0c0e'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#26262b'; c.beginPath(); c.moveTo(10, 10); c.lineTo(w - 10, 10); c.lineTo(w - 22, h - 10); c.lineTo(22, h - 10); c.closePath(); c.fill();
    c.fillStyle = '#b89a5a';
    for (let r = 0; r < 2; r++) for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(28 + i * 15 + r * 0, 28 + r * 24, 3.2, 0, 7); c.fill(); }
  }).tex;
  const portH = mesh(new THREE.BoxGeometry(0.016, 0.03, 0.062), std(0x0e0e10, { roughness: 0.5 })); portH.position.set(PORT.x - 0.008, PORT.y, PORT.z); carG.add(portH);
  const portP = new THREE.Mesh(new THREE.PlaneGeometry(0.058, 0.027), new THREE.MeshStandardMaterial({ map: portFace, roughness: 0.4, metalness: 0.3 }));
  portP.rotation.y = Math.PI / 2; portP.position.set(PORT.x + 0.0005, PORT.y, PORT.z); carG.add(portP);

  // ----------------------------------------------------------- the adapter and the hand that brings it
  // Adapter local frame: plug end along +Y, top along -Z, so it shares axes with the hand.
  const adapter = new THREE.Group(); scene.add(adapter);
  const adBody = mesh(new RoundedBoxGeometry(0.046, 0.07, 0.03, 3, 0.008), std(0x2b2d33, { roughness: 0.35, metalness: 0.4 })); adapter.add(adBody);
  const adNose = mesh(new THREE.BoxGeometry(0.042, 0.024, 0.018), std(0x111114, { roughness: 0.5 })); adNose.position.set(0, 0.046, 0); adapter.add(adNose);
  const adStripe = new THREE.Mesh(new THREE.BoxGeometry(0.048, 0.006, 0.031), new THREE.MeshBasicMaterial({ color: CYAN_H, toneMapped: false })); adStripe.position.set(0, -0.022, 0); adapter.add(adStripe);
  const ledM = new THREE.MeshBasicMaterial({ color: 0x000000, toneMapped: false });
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0042, 10, 8), ledM); led.position.set(0, -0.026, -0.0155); adapter.add(led);
  const ledGlow = glow(0xffb040, 0.06, 0, 0.4); ledGlow.position.set(0, -0.026, -0.02); adapter.add(ledGlow);
  const clickGlow = glow(CYAN_H, 0.12, 0, 0.45); clickGlow.position.set(PORT.x + 0.01, PORT.y, PORT.z); scene.add(clickGlow);
  const qA = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 0, 1), V(-1, 0, 0), V(0, -1, 0)));
  adapter.quaternion.copy(qA);

  const skin = new THREE.MeshPhysicalMaterial({ color: 0xa36b4c, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const hand = makeHand(skin, std(0x3b4a5c, { roughness: 0.95 }), std(0x2c3846, { roughness: 0.9 }));
  scene.add(hand);
  // The hand comes in pitched down and yawed toward the port, the arm trailing back to the driver's seat.
  // A handshake-angle right hand: fingers forward, thumb up, palm to the left. The adapter is held in a
  // key pinch, its rear half between the thumb pad on top and the side of the curled index finger.
  const qHand0 = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(V(0, 1, 0), V(-1, 0, 0), V(0, 0, 1)));
  const qH = new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), 0.25).multiply(new THREE.Quaternion().setFromAxisAngle(V(0, 0, 1), 0.22)).multiply(qHand0);
  hand.quaternion.copy(qH);
  const PINCH = { curl: [0.68, 0.8, 0.86, 0.9], opp: 0.15, tcurl: 0.45 };
  const OPENP = { curl: [0.22, 0.3, 0.38, 0.45], opp: 0.0, tcurl: 0.0, spread: 0.5 };
  const G0 = V(0.055, 0.112, 0.042);   // adapter centre in the hand's frame while pinched
  const lerpPose = (a, b, p) => ({ curl: a.curl.map((c, i) => lerp(c, b.curl[i], p)), opp: lerp(a.opp, b.opp, p), tcurl: lerp(a.tcurl, b.tcurl, p), spread: lerp(a.spread || 0, b.spread || 0, p) });

  // ----------------------------------------------------------- the tower
  const towerG = new THREE.Group(); towerG.position.copy(TOWER); scene.add(towerG);
  const steel = std(0x2a2833, { roughness: 0.6, metalness: 0.7 });
  const struts = [];
  const corner = (y, i) => { const hw = lerp(0.95, 0.24, y / TOWER_H), a = Math.PI / 4 + i * Math.PI / 2; return V(Math.cos(a) * hw * 1.414, y, Math.sin(a) * hw * 1.414); };
  for (let i = 0; i < 4; i++) struts.push([corner(0, i), corner(TOWER_H, i), 0.05]);
  const LV = 7;
  for (let l = 0; l < LV; l++) {
    const y0 = (l / LV) * TOWER_H, y1 = ((l + 1) / LV) * TOWER_H;
    for (let i = 0; i < 4; i++) {
      const j = (i + 1) % 4;
      struts.push([corner(y0, i), corner(y1, j), 0.018], [corner(y0, j), corner(y1, i), 0.018], [corner(y1, i), corner(y1, j), 0.02]);
    }
  }
  const strutIM = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), steel, struts.length);
  {
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), d = V(0, 0, 0);
    struts.forEach(([a, b, r], i) => { d.subVectors(b, a); q.setFromUnitVectors(V(0, 1, 0), d.clone().normalize()); m4.compose(a.clone().add(b).multiplyScalar(0.5), q, V(r, d.length(), r)); strutIM.setMatrixAt(i, m4); });
  }
  towerG.add(strutIM);
  const panelIM = new THREE.InstancedMesh(new THREE.BoxGeometry(0.22, 0.9, 0.08), std(0xbcbcc4, { roughness: 0.5 }), 3);
  for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3 + 0.4; panelIM.setMatrixAt(i, new THREE.Matrix4().compose(V(Math.cos(a) * 0.42, TOWER_H - 0.7, Math.sin(a) * 0.42), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -a + Math.PI / 2), V(1, 1, 1))); }
  towerG.add(panelIM);
  const beacon = glow(0xff2a20, 0.9, 0, 0.35); beacon.position.set(0, TOWER_H + 0.25, 0); towerG.add(beacon);
  // Network lights on the tower: old white status lights that die, then the new cyan ones.
  const statusOld = [0, 1, 2].map((i) => { const g = glow(WARM, 0.7, 0, 0.4); g.position.set(Math.cos(i * 2.1 + 0.4) * 0.5, TOWER_H - 0.7 + (i - 1) * 0.2, Math.sin(i * 2.1 + 0.4) * 0.5); towerG.add(g); return g; });
  const statusNew = glow(CYAN_H, 2.2, 0, 0.4); statusNew.position.set(0, TOWER_H - 0.6, 0); towerG.add(statusNew);
  [beacon, statusNew, ...statusOld].forEach((g) => { g.material.fog = false; });
  const towerTop = TOWER.clone().add(V(0, TOWER_H - 0.6, 0));
  const rings = [0, 1, 2].map(() => { const r = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 64), new THREE.MeshBasicMaterial({ color: CYAN_H, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false })); r.position.copy(towerTop); scene.add(r); return r; });
  // Packets that stream between the tower and the car's antenna.
  const ctrl = V((towerTop.x + ANT.x) / 2, Math.max(towerTop.y, ANT.y) + 1.0, (towerTop.z + ANT.z) / 2);
  const curve = new THREE.QuadraticBezierCurve3(towerTop.clone(), ctrl, ANT.clone());
  const PK = 16, pkPos = new Float32Array(PK * 3), pkCol = new Float32Array(PK * 3);
  const pkGeo = new THREE.BufferGeometry();
  pkGeo.setAttribute('position', new THREE.BufferAttribute(pkPos, 3)); pkGeo.setAttribute('color', new THREE.BufferAttribute(pkCol, 3));
  const dotTex = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.3, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const packets = new THREE.Points(pkGeo, new THREE.PointsMaterial({ map: dotTex, size: 0.42, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, fog: false }));
  packets.frustumCulled = false; scene.add(packets);
  const WARM_C = new THREE.Color(WARM), CYAN_C = new THREE.Color(CYAN_H), pk = V(0, 0, 0);

  // ----------------------------------------------------------- HUD over the car: signal bars and services
  const hudPanel = (w, h) => canvasTex(512, Math.round(512 * h / w), (c, W, H) => {
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(8,12,26,0.62)'; roundRect(c, 4, 4, W - 8, H - 8, 34); c.fill();
    c.strokeStyle = 'rgba(160,190,230,0.35)'; c.lineWidth = 3; roundRect(c, 4, 4, W - 8, H - 8, 34); c.stroke();
  }).tex;
  const barsG = new THREE.Group(); barsG.position.set(-1.3, 2.5, 0.3); scene.add(barsG);
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(1.25, 0.95), new THREE.MeshBasicMaterial({ map: hudPanel(1.25, 0.95), transparent: true, depthWrite: false, toneMapped: false })); bp.position.set(0, 0, -0.01); barsG.add(bp);
  const bars = [0, 1, 2, 3].map((i) => {
    const h = 0.12 + i * 0.1;
    const m = new THREE.Mesh(new RoundedBoxGeometry(0.11, h, 0.03, 2, 0.012), new THREE.MeshBasicMaterial({ color: 0x2a2f3a, toneMapped: false }));
    m.position.set(-0.27 + i * 0.165, -0.05 + h / 2 - 0.12, 0.02); barsG.add(m); return m;
  });
  const sunsetTag = (() => {
    const W = 760, H = 112;
    const tx = canvasTex(W, H, (c) => {
      c.clearRect(0, 0, W, H);
      c.strokeStyle = RED; c.lineWidth = 12; c.lineCap = 'round';
      c.beginPath(); c.moveTo(24, 22); c.lineTo(90, 90); c.moveTo(90, 22); c.lineTo(24, 90); c.stroke();
      c.fillStyle = RED; c.font = `800 60px ${MONO}`; c.textBaseline = 'middle'; if ('letterSpacing' in c) c.letterSpacing = '3px';
      c.fillText('NETWORK SUNSET', 118, H / 2 + 3);
    }).tex;
    return new THREE.Mesh(new THREE.PlaneGeometry(1.08, 0.16), new THREE.MeshBasicMaterial({ map: tx, transparent: true, opacity: 0, depthWrite: false, toneMapped: false }));
  })();
  sunsetTag.position.set(0, 0.28, 0.02); barsG.add(sunsetTag);
  const connTag = label('CONNECTED', { font: `800 60px ${MONO}`, fg: CYAN, h: 0.16, pad: 10, track: 3 });
  connTag.position.set(0, 0.28, 0.02); barsG.add(connTag);
  const barGlow = glow(CYAN_H, 1, 0, 0.45); barGlow.scale.set(1.3, 0.8, 1); barGlow.position.set(0, -0.08, -0.02); barsG.add(barGlow);

  const svcG = new THREE.Group(); svcG.position.set(1.55, 2.5, 0.3); scene.add(svcG);
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshBasicMaterial({ map: hudPanel(1.15, 1.15), transparent: true, depthWrite: false, toneMapped: false })); sp.position.set(0, -0.06, -0.01); svcG.add(sp);
  const svcTag = label('SERVICES', { font: `700 54px ${MONO}`, fg: '#b8c6dc', h: 0.12, pad: 8, track: 5 });
  svcTag.position.set(0, 0.42, 0.02); svcG.add(svcTag);
  const tiles = [0, 1, 2, 3].map((i) => {
    const tx = canvasTex(256, 256, (c, w) => drawIcon(c, w, i)).tex;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: tx, color: 0x3c4555, transparent: true, depthWrite: false, toneMapped: false }));
    m.position.set((i % 2 ? 1 : -1) * 0.23, i < 2 ? 0.08 : -0.36, 0.02); svcG.add(m);
    const g = glow(CYAN_H, 0.7, 0, 0.45); g.position.copy(m.position).add(V(0, 0, -0.01)); svcG.add(g);
    return { m, g };
  });
  [barsG, svcG].forEach((G) => G.traverse((o) => { if (o.material) o.material.fog = false; }));

  // ----------------------------------------------------------- title
  const client = label('General Motors', { font: `700 56px ${MONO}`, fg: CYAN, h: 0.17, pad: 8, track: 4 });
  const title = label('Keeping older cars connected', { font: `800 72px ${SANS}`, fg: '#f3f0ff', h: 0.32, pad: 10, track: 1 });
  const line = label('An adapter that brings connected services back to older vehicles after a cellular network sunset.', { font: `600 46px ${SANS}`, fg: '#c3c2dc', h: 0.13, pad: 8, track: 0 });
  [client, title, line].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width, LWd = line.geometry.parameters.width;

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-3.0, 1.35, 7.2]], [2.3, [-2.55, 1.42, 6.3], L],
    [2.85, [0.36, 1.22, 1.78]], [3.3, [0.09, 1.03, 0.66]], [4.5, [0.06, 1.02, 0.64], L],
    [5.25, [-0.7, 1.7, 3.4]], [6.2, [-2.7, 2.15, 7.1]],
    [7.7, [-3.4, 2.35, 8.3]], [10, [-3.52, 2.4, 8.55], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.0, 1.55, -1.0]], [2.3, [0.05, 1.5, -0.8], L],
    [2.85, [-0.3, 0.86, 0.4]], [3.3, [-0.54, 0.66, 0.52]], [4.5, [-0.53, 0.66, 0.53], L],
    [5.25, [3.25, 4.2, -6.0]], [6.2, [0.6, 1.95, -0.5]],
    [7.7, [-0.05, 1.85, 0]], [10, [-0.05, 1.85, 0], L],
  ]);
  const tgt = V(0, 0, 0), tmp = V(0, 0, 0), adPos = V(0, 0, 0), billboard = V(0, 0, 0);
  const startHand = V(-0.06, 0.8, 0.46), approachA = V(-0.3, 0.72, 0.58);

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    const inside = t > 3.0 && t < 4.75;
    const click = t > CLICK ? Math.exp(-16 * (t - CLICK)) * Math.sin((t - CLICK) * 70) : 0;
    camera.position.set(p[0] + Math.sin(t * 1.1) * (inside ? 0.002 : 0.008), p[1] + Math.sin(t * 1.6 + 1) * (inside ? 0.0015 : 0.005) + click * 0.0015, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    camera.fov = kf(t, [[0, 34], [2.3, 32], [3.3, 36], [4.5, 35], [5.25, 38], [6.2, 34], [10, 33]]);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // Beat 1: the sun drops behind the ridge and the old network goes with it.
    const set = eio(k(t, 0.2, 2.6));
    sun.position.set(SUN_X, lerp(2.4, -1.4, set), SUN_Z); sunCore.position.set(SUN_X, lerp(2.4, -1.4, set), SUN_Z + 0.2);
    sun.material.opacity = 0.9 * (1 - 0.5 * set); sunCore.material.opacity = 1 - 0.6 * set;
    skyB.material.opacity = eio(k(t, 0.6, 4.2));
    sunL.intensity = lerp(2.6, 0.55, eio(k(t, 0.3, 3.2)));
    sunL.color.copy(SUN_C).lerp(DUSK_C, eio(k(t, 0.3, 3.2)));
    sunL.position.set(-1.5, lerp(3.2, 1.8, set), -12);
    moon.intensity = 0.55 * eio(k(t, 1.5, 4.5));
    hemi.intensity = lerp(0.42, 0.3, eio(k(t, 0.5, 4)));
    beacon.material.opacity = 0.85 * (Math.sin(t * 5.2) > 0.2 ? 1 : 0.06);
    statusOld.forEach((g, i) => { const off = 1.55 + i * 0.14; g.material.opacity = t < off ? 0.75 * (0.85 + 0.15 * Math.sin(t * 9 + i)) : t < off + 0.18 ? 0.75 * (rnd(Math.floor(t * 30), i) > 0.5 ? 1 : 0.1) : 0; });
    const oldStream = 1 - eio(k(t, 1.0, 1.7)), newStream = eio(k(t, 4.95, 5.4));
    for (let i = 0; i < PK; i++) {
      const old = t < 3;
      const u = old ? (rnd(i, 7) + t * 0.45) % 1 : (rnd(i, 7) + t * 0.9) % 1;
      curve.getPoint(u, pk); pkPos[i * 3] = pk.x; pkPos[i * 3 + 1] = pk.y; pkPos[i * 3 + 2] = pk.z;
      const a = (old ? 0.7 * oldStream : 1.0 * newStream) * Math.sin(Math.PI * u);
      const c = old ? WARM_C : CYAN_C;
      pkCol[i * 3] = c.r * a; pkCol[i * 3 + 1] = c.g * a; pkCol[i * 3 + 2] = c.b * a;
    }
    pkGeo.attributes.position.needsUpdate = true; pkGeo.attributes.color.needsUpdate = true;
    packets.material.size = t < 3 ? 0.3 : 0.44;
    bars.forEach((b, i) => {
      const off = BAR_OFF[i], on = BAR_ON[i];
      let lit = 1, col = WARM;
      if (t > off && t < on) lit = t < off + 0.16 ? (rnd(Math.floor(t * 40), i + 3) > 0.5 ? 1 : 0) : 0;
      if (t >= on) { lit = 1; col = CYAN_H; }
      if (lit) b.material.color.setHex(col); else b.material.color.setHex(0x232733);
      const pop = t >= on ? back(k(t, on, on + 0.3)) : 1;
      b.scale.set(1, t >= on ? lerp(0.3, 1, pop) : 1, 1);
    });
    const sunsetIn = back(k(t, 2.05, 2.4)) * (1 - eio(k(t, 5.75, 6.0)));
    sunsetTag.material.opacity = clamp(sunsetIn); sunsetTag.scale.setScalar(lerp(0.85, 1, clamp(sunsetIn)) + 0.04 * Math.sin(Math.PI * k(t, 2.05, 2.4)));
    sunsetTag.visible = sunsetTag.material.opacity > 0.01;
    const connIn = back(k(t, 5.85, 6.2));
    connTag.material.opacity = clamp(connIn); connTag.scale.setScalar(lerp(0.85, 1, clamp(connIn))); connTag.visible = connIn > 0.01;
    barGlow.material.opacity = 0.35 * clamp(connIn);

    // Beat 2: inside the car, the hand brings the adapter down and clicks it into the port.
    const app = eio(k(t, 2.75, 3.45)), align = eio(k(t, 3.42, 3.66)), push = ei(k(t, 3.66, CLICK)), seat = spring(k(t, CLICK, CLICK + 0.35));
    if (t < 3.42) { adPos.copy(startHand).lerp(approachA, app); adPos.y += Math.sin(Math.PI * app) * 0.03; }
    else if (t < 3.66) { adPos.copy(approachA).lerp(PRE, align); adPos.z += Math.sin(t * 34) * 0.003 * (1 - align); }
    else if (t < CLICK) adPos.copy(PRE).lerp(INSERT, push * 1.06);
    else { adPos.copy(INSERT); adPos.x -= 0.003 * (1 - seat); }
    adapter.position.copy(adPos);
    adapter.visible = t > 2.6;
    // The grip: pinched while carrying, fingers spring open after the click, then the hand draws back.
    const rel = eo(k(t, CLICK + 0.12, CLICK + 0.45)), away = eio(k(t, CLICK + 0.35, CLICK + 1.0));
    hand.userData.pose(lerpPose(PINCH, OPENP, rel));
    hand.position.copy(adPos).sub(tmp.copy(G0).applyQuaternion(qH));
    hand.position.x += 0.2 * away; hand.position.y += 0.1 * away; hand.position.z -= 0.1 * away;
    hand.position.y += 0.004 * Math.sin(t * 2.3) * (1 - away);
    hand.visible = t > 2.72 && t < 4.72;
    // The LED: off, amber blinks while it boots, then steady cyan.
    const boot = t > CLICK + 0.05 && t < CLICK + 0.75;
    const blink = boot ? (Math.sin((t - CLICK) * 26) > 0 ? 1 : 0.1) : 0;
    if (t < CLICK + 0.05) { ledM.color.setRGB(0.05, 0.05, 0.05); ledGlow.material.opacity = 0; }
    else if (boot) { ledM.color.setRGB(1.6 * blink, 0.7 * blink, 0.1 * blink); ledGlow.material.color.setHex(0xffb040); ledGlow.material.opacity = 0.9 * blink; }
    else { ledM.color.setRGB(0.3, 1.3, 1.6); ledGlow.material.color.setHex(CYAN_H); ledGlow.material.opacity = 0.9; }
    clickGlow.material.opacity = t > CLICK ? 0.8 * Math.exp(-6 * (t - CLICK)) : 0;
    dome.intensity = 1.7 * eio(k(t, 2.5, 2.9)) * (1 - eio(k(t, 4.6, 5.2))) + 0.35 * eio(k(t, 5.6, 6.2));

    // Beat 3: the tower wakes in cyan and the signal pours down to the car.
    const wake = eo(k(t, 4.85, 5.2));
    statusNew.material.opacity = 0.9 * wake * (0.85 + 0.15 * Math.sin(t * 4));
    rings.forEach((r, i) => {
      const u = k(t, 4.95 + i * 0.35, 6.15 + i * 0.35);
      r.scale.setScalar(lerp(0.3, 3.2, eo(u)));
      r.lookAt(camera.position);
      r.material.opacity = t > 4.95 + i * 0.35 ? 0.85 * (1 - u) : 0;
      r.visible = r.material.opacity > 0.01;
    });
    antGlow.material.opacity = 0.8 * newStream * (0.7 + 0.3 * Math.sin(t * 6));
    const lights = eo(k(t, 5.85, 6.25));
    headM.color.setRGB(lerp(0.23, 1.6, lights), lerp(0.23, 1.5, lights), lerp(0.25, 1.3, lights));
    tailM.color.setRGB(lerp(0.23, 1.5, lights), lerp(0.05, 0.12, lights), lerp(0.05, 0.08, lights));
    headGlows.forEach((g) => { g.material.opacity = 0.8 * lights; g.scale.setScalar(0.9 + 0.2 * lights); });
    tailGlows.forEach((g) => { g.material.opacity = 0.6 * lights; });
    heads.intensity = 26 * lights;

    // Beat 4: the four services light up over the car, one after another.
    barsG.visible = svcG.visible = !(t > 2.9 && t < 4.72);   // off-screen while we are inside the car
    billboard.set(camera.position.x, barsG.position.y, camera.position.z);
    barsG.lookAt(billboard); svcG.lookAt(billboard.setY(svcG.position.y));
    const hudIn = eo(k(t, 0.35, 0.9));
    bp.material.opacity = hudIn; sp.material.opacity = hudIn * (0.7 + 0.3 * eo(k(t, 6.1, 6.4)));
    svcTag.material.opacity = 0.9 * hudIn;
    tiles.forEach(({ m, g }, i) => {
      const on = SVC_ON[i], u = k(t, on, on + 0.3), pop = back(u);
      const lit = t > on ? 1 : 0;
      m.material.color.setRGB(lerp(0.24, 0.85, lit), lerp(0.27, 1.0, lit), lerp(0.33, 1.1, lit));
      m.material.opacity = hudIn * (lit ? 1 : 0.55);
      m.scale.setScalar(t > on ? lerp(0.9, 1, clamp(pop)) + 0.06 * Math.sin(Math.PI * clamp(pop)) : 1);
      const burst = t > on ? Math.exp(-4 * (t - on)) : 0;
      g.material.opacity = t > on ? 0.3 + 0.55 * burst : 0;
      g.scale.setScalar(0.7 + 0.6 * burst);
    });

    // The project's name settles in the dusk above the car.
    const ci = back(k(t, 7.7, 8.25)), ti = back(k(t, 7.85, 8.4)), li = eo(k(t, 8.1, 8.7)), out = ei(k(t, 9.2, 9.6));
    const tx = 0.15, tz = 0.3;
    billboard.set(camera.position.x, 3.55, camera.position.z);
    title.position.set(tx, 3.6 + (1 - clamp(ti)) * -0.08, tz); title.lookAt(billboard);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(tx - TWd / 2 + CWd / 2 + 0.02, 3.87 + (1 - clamp(ci)) * -0.06, tz); client.quaternion.copy(title.quaternion);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;
    line.position.set(tx - TWd / 2 + LWd / 2 + 0.02, 3.35 + (1 - li) * -0.04, tz); line.quaternion.copy(title.quaternion);
    line.material.opacity = li * (1 - out); line.visible = line.material.opacity > 0.01;
  }

  return { scene, camera, update, duration: D, poster: 8.8 };
}
