// Honeywell chatbot and service tools lit loop, 10 s. "The bot answers, a person takes over, the return ships."
// A support desk late in the evening: felt slats on the wall, a walnut desk, a brass lamp, a roller
// conveyor running off to the right. A service agent leans back with a red mug while the assistant, a small
// teal orb by the monitor, runs the chat. The customer asks; the assistant answers with the order status and
// a parcel rolls in along the conveyor, lighting PLACED, SHIPPED and DELIVERED as it passes each post. The
// customer asks again; the orb floats over and docks in the agent's headset, which turns green, and the chat
// header flips to LIVE AGENT. The agent sets the mug down, types, and hits enter: the label printer feeds out
// a return label, the agent peels it off, presses it onto the parcel, and the parcel rolls back out the way it
// came, each post flashing red as the return passes. The chat shows the RETURN LABEL card; the title settles.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const RED = '#e4002b', RED_H = 0xe4002b, TEAL = '#3ad6c4', TEAL_H = 0x3ad6c4, GREEN = '#3ddc84', GREEN_H = 0x3ddc84;
const INK = 0x0b0e18;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// ------------------------------------------------------------- timeline
const T_LIVE = 4.35;                       // the orb docks in the headset; the agent is live
const T_ENTER = 5.2;                       // the agent hits enter: the label prints
const PRINT = [5.3, 5.95];                 // label feeds out of the printer
const GRAB = 6.0, STICK = 6.58, LET_GO = 6.78;
const BOX_IN = [1.1, 2.75], BOX_OUT = [7.2, 8.35];
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * clamp(x));
const BOX_END = 1.0;
const boxX = (t) => (t < 5 ? lerp(2.3, BOX_END, ease(k(t, BOX_IN[0], BOX_IN[1]))) : lerp(BOX_END, 2.75, ei(k(t, BOX_OUT[0], BOX_OUT[1]))));
// The three posts along the conveyor; the moment the parcel passes each is solved from its own motion, so
// the posts, the on-screen checks and the parcel stay in step.
const POST_X = [1.57, 1.375, 1.18];
const solve = (f, a, b, x) => { const up = f(b) > f(a); for (let i = 0; i < 40; i++) { const m = (a + b) / 2; if ((f(m) < x) === up) a = m; else b = m; } return (a + b) / 2; };
const CHECK = POST_X.map((x) => solve(boxX, BOX_IN[0], BOX_IN[1], x));
const RET = POST_X.map((x) => solve(boxX, BOX_OUT[0], BOX_OUT[1], x));

// The conversation, top to bottom. Heights are canvas px; words only where the old loop had them.
const MSG = [
  { at: 0.55, who: 'me', h: 96, bars: [330, 210] },
  { at: 1.2, who: 'bot', h: 268, kind: 'status', typing: 0.85 },
  { at: 3.05, who: 'me', h: 64, bars: [280] },
  { at: T_LIVE, who: 'sys', h: 40, kind: 'div' },
  { at: 4.95, who: 'agent', h: 64, bars: [300], typing: 4.55 },
  { at: 5.95, who: 'agent', h: 178, kind: 'label' },
];
const COMPOSE = [[0.12, 0.55], [2.6, 3.05]];

// Wrap an angle so it sits within half a turn of ref.
const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// A stylized person built from capsules: everything is placed in world space from a handful of inputs
// (hip centre, facing, lean, ankle targets, wrist targets, where they look), so any frame stands alone.
function makePerson(scene, o) {
  const bone = (r, len, m) => { const b = mesh(new THREE.CapsuleGeometry(r, len, 4, 12), m); scene.add(b); return b; };
  const LT = 0.44, LS = 0.43, LU = 0.29, LF = 0.27;
  const p = {
    pelvis: bone(0.1, 0.12, o.pants),
    torso: bone(o.chestR, 0.3, o.top),
    neck: bone(0.042, 0.05, o.skin),
    head: mesh(new THREE.SphereGeometry(0.102, 28, 20), o.skin),
    nose: mesh(new THREE.SphereGeometry(0.018, 10, 8), o.skin),
    hair: mesh(new THREE.SphereGeometry(0.109, 28, 14, 0, Math.PI * 2, 0, Math.PI * o.hairCap), o.hairM),
    ua: [bone(0.05, 0.21, o.sleeve), bone(0.05, 0.21, o.sleeve)],
    fa: [bone(0.042, 0.2, o.fore), bone(0.042, 0.2, o.fore)],
    hand: [0, 1].map(() => { const h = mesh(new THREE.SphereGeometry(0.04, 14, 10), o.skin); h.scale.set(0.8, 1.15, 1); scene.add(h); return h; }),
    th: [bone(0.07, 0.34, o.pants), bone(0.07, 0.34, o.pants)],
    sh: [bone(0.056, 0.34, o.pants), bone(0.056, 0.34, o.pants)],
    shoe: [0, 1].map(() => { const s = mesh(new RoundedBoxGeometry(0.1, 0.075, 0.26, 3, 0.03), o.shoeM); scene.add(s); return s; }),
    extra: [],
  };
  [p.head, p.nose, p.hair].forEach((m) => scene.add(m));
  const va = V(0, 0, 0), vb = V(0, 0, 0), vc = V(0, 0, 0), vd = V(0, 0, 0);
  const place = (m, a, b) => { m.position.addVectors(a, b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(Y, vd.subVectors(b, a).normalize()); };
  // Two-bone reach: the middle joint (knee or elbow) bends toward the pole.
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.min(dv.length(), l1 + l2 - 0.001); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)).normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hipI = V(0, 0, 0), jnt = V(0, 0, 0), wr = V(0, 0, 0), pole = V(0, 0, 0), ank = V(0, 0, 0), lookD = V(0, 0, 0);
  p.shoulder = [V(0, 0, 0), V(0, 0, 0)];
  p.headPos = V(0, 0, 0);
  p.lookD = lookD;
  p.pose = ({ hip, yaw, lean, feet, hands, look, nod = 0, kneePole }) => {
    fwdOf(yaw, F); sideOf(yaw, S);
    place(p.pelvis, va.copy(hip).addScaledVector(S, -0.08), vb.copy(hip).addScaledVector(S, 0.08));
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      hipI.copy(hip).addScaledVector(S, sg * 0.1);
      feet(i, ank);
      pole.copy(kneePole || F).addScaledVector(S, sg * 0.08);
      ik(hipI, ank, LT, LS, pole, jnt);
      place(p.th[i], hipI, jnt); place(p.sh[i], jnt, ank);
      p.shoe[i].position.copy(ank).addScaledVector(F, 0.05); p.shoe[i].position.y = Math.max(0.038, ank.y - 0.045);
      p.shoe[i].rotation.set(0, yaw, 0);
    }
    Dn.copy(F).multiplyScalar(lean).add(Y).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    place(p.torso, va.copy(hip).addScaledVector(Dn, 0.1), top);
    for (const e of p.extra) e(hip, top, F, S, Dn);
    p.headPos.copy(top).addScaledVector(Dn, 0.16).addScaledVector(F, 0.015);
    place(p.neck, top, p.headPos);
    lookD.subVectors(look, p.headPos); lookD.y = clamp(lookD.y / Math.max(0.01, Math.hypot(lookD.x, lookD.z)), -0.9, 0.5) * Math.hypot(lookD.x, lookD.z);
    lookD.normalize(); lookD.y -= nod; lookD.normalize();
    p.headPos.addScaledVector(lookD, 0.012);
    p.head.position.copy(p.headPos);
    p.nose.position.copy(p.headPos).addScaledVector(lookD, 0.098);
    p.hair.position.copy(p.headPos).addScaledVector(lookD, -0.014).add(vb.set(0, 0.012, 0));
    p.hair.quaternion.setFromUnitVectors(Y, vb.copy(Y).addScaledVector(lookD, -0.4).normalize());
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      const sh = p.shoulder[i].copy(top).addScaledVector(Dn, -0.04).addScaledVector(S, sg * 0.19);
      hands(i, sh, wr);
      pole.copy(Y).multiplyScalar(-1).addScaledVector(S, sg * 0.7).addScaledVector(F, -0.35);
      ik(sh, wr, LU, LF, pole, jnt);
      place(p.ua[i], sh, jnt); place(p.fa[i], jnt, wr);
      p.hand[i].position.copy(wr).addScaledVector(vb.subVectors(wr, jnt).normalize(), 0.035);
      p.hand[i].quaternion.setFromUnitVectors(Y, vb);
    }
  };
  return p;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(INK);
  scene.fog = new THREE.Fog(INK, 3.6, 9.5);
  scene.environment = env;
  scene.environmentIntensity = 0.3;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.03, 40);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3();

  // ----------------------------------------------------------- the room
  const floor = mesh(new THREE.PlaneGeometry(14, 14), std(0xffffff, { map: grainTex('#1a1d26', { size: 256, speck: 0.08, blot: 0.12, seed: 51, repeat: 7 }), roughness: 0.5, metalness: 0.1 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const wall = mesh(new THREE.PlaneGeometry(10, 4.5), std(0xffffff, { map: grainTex('#141927', { size: 256, speck: 0.05, blot: 0.12, seed: 52, repeat: 3 }), roughness: 0.95 }), { cast: false });
  wall.position.set(0, 1.6, -1.05); scene.add(wall);
  // Acoustic felt slats: one instanced batch, alternating depth so the lamp rakes across them.
  const SLATS = 30;
  const slatI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 1.9, 0.04), std(0x262e42, { roughness: 0.96 }), SLATS);
  for (let i = 0; i < SLATS; i++) { m4.makeTranslation(-2.3 + i * 0.16, 1.45, -1.0 + (i % 2) * 0.025); slatI.setMatrixAt(i, m4); }
  slatI.receiveShadow = true; scene.add(slatI);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x7d8fb8, 0x15110e, 0.3));
  const key = new THREE.SpotLight(0xffd6a8, 26, 0, 0.62, 0.65, 1.4);
  key.position.set(-1.1, 2.5, 1.5); key.target.position.set(0.35, 0.8, -0.05);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 1.2; key.shadow.camera.far = 6; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.015;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6fa8ff, 1.2); rim.position.set(1.2, 1.9, -2.2); scene.add(rim);
  const lampL = new THREE.PointLight(0xffb870, 2.2, 1.8, 1.6); scene.add(lampL);
  const screenL = new THREE.PointLight(0x7fd8ff, 1.4, 2.0, 1.6); screenL.position.set(0.05, 1.1, -0.05); scene.add(screenL);

  // ----------------------------------------------------------- the desk
  const walnut = std(0x5a3622, { roughness: 0.42, metalness: 0.05 });
  const desk = mesh(new RoundedBoxGeometry(1.48, 0.04, 0.74, 2, 0.012), walnut);
  desk.position.set(0.18, 0.74, -0.16); scene.add(desk);
  const legI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, 0.72, 0.66), std(0x1c1f26, { metalness: 0.6, roughness: 0.4 }), 2);
  [-0.52, 0.88].forEach((x, i) => { m4.makeTranslation(x, 0.36, -0.16); legI.setMatrixAt(i, m4); });
  legI.castShadow = legI.receiveShadow = true; scene.add(legI);

  // The monitor: a wide screen that carries the whole conversation.
  const SW = 1.0, SHh = 0.58, SCX = 0.05, SCY = 1.12, SZ = -0.36;
  const graphite = std(0x1b1d22, { metalness: 0.75, roughness: 0.35 });
  const mon = mesh(new RoundedBoxGeometry(SW + 0.04, SHh + 0.04, 0.03, 2, 0.01), graphite); mon.position.set(SCX, SCY, SZ); scene.add(mon);
  const neck = mesh(new THREE.BoxGeometry(0.06, 0.32, 0.03), graphite); neck.position.set(SCX, 0.92, SZ - 0.04); scene.add(neck);
  const foot = mesh(new RoundedBoxGeometry(0.32, 0.016, 0.2, 2, 0.006), graphite); foot.position.set(SCX, 0.768, SZ - 0.02); scene.add(foot);
  const CW = 1024, CH = Math.round(1024 * SHh / SW);
  const chat = canvasTex(CW, CH);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(SW, SHh), new THREE.MeshBasicMaterial({ map: chat.tex, color: 0xd6d6d6, toneMapped: false }));
  screen.position.set(SCX, SCY, SZ + 0.0165); scene.add(screen);
  const screenGlow = glow(0x6fc8ff, 1, 0.14, 0.5); screenGlow.scale.set(1.7, 1.0, 1); screenGlow.position.set(SCX, SCY, SZ - 0.05); scene.add(screenGlow);

  // Keyboard: a slim slab with a drawn key grid on top.
  const kb = mesh(new RoundedBoxGeometry(0.44, 0.018, 0.15, 2, 0.006), std(0x24272e, { metalness: 0.4, roughness: 0.45 }));
  kb.position.set(0.38, 0.769, 0.0); scene.add(kb);
  const keysTex = canvasTex(512, 176, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    for (let r = 0; r < 5; r++) for (let i = 0; i < 14; i++) {
      const kw = r === 4 && i > 3 && i < 10 ? 0 : 30;
      if (!kw) continue;
      c.fillStyle = '#3a3f49'; roundRect(c, 10 + i * 35.5, 10 + r * 32.5, kw, 26, 5); c.fill();
    }
    c.fillStyle = '#3a3f49'; roundRect(c, 152, 140, 205, 26, 5); c.fill();
  }).tex;
  const keys = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.135), std(0xffffff, { map: keysTex, transparent: true, roughness: 0.5 }));
  keys.rotation.x = -Math.PI / 2; keys.position.set(0.38, 0.7785, 0.0); scene.add(keys);

  // Brass desk lamp on the left: the warm practical that motivates the key.
  const brass = std(0xb8893e, { metalness: 0.9, roughness: 0.3 });
  const lampBase = mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.02, 32), brass); lampBase.position.set(-0.5, 0.77, -0.46); scene.add(lampBase);
  // Base sits behind the monitor's left corner and the arm stays outside the screen's width, so it never passes through it.
  const armA = V(-0.5, 0.78, -0.46), armB = V(-0.56, 1.22, -0.48), armC = V(-0.58, 1.36, -0.27);
  [[armA, armB], [armB, armC]].forEach(([a, b]) => { const c2 = mesh(new THREE.CylinderGeometry(0.009, 0.009, a.distanceTo(b), 10), brass); c2.position.addVectors(a, b).multiplyScalar(0.5); c2.quaternion.setFromUnitVectors(Y, b.clone().sub(a).normalize()); scene.add(c2); });
  const shade = mesh(new THREE.ConeGeometry(0.07, 0.1, 28, 1, true), new THREE.MeshStandardMaterial({ color: 0x1d4a3c, metalness: 0.5, roughness: 0.4, side: THREE.DoubleSide }));
  shade.position.copy(armC); shade.quaternion.setFromUnitVectors(Y, V(-0.45, 1, -0.3).normalize()); scene.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), new THREE.MeshBasicMaterial({ color: 0xffd9a0, toneMapped: false }));
  bulb.position.copy(armC).add(V(0.012, -0.03, 0.014)); scene.add(bulb);
  const bulbGlow = glow(0xffb870, 0.42, 0.6, 0.45); bulbGlow.position.copy(bulb.position); scene.add(bulbGlow);
  lampL.position.copy(bulb.position).add(V(0.02, -0.06, 0.03));

  // Label printer on the right of the desk.
  const PR = V(0.74, 0.76, -0.2);
  const printer = mesh(new RoundedBoxGeometry(0.19, 0.11, 0.18, 3, 0.02), std(0x2b2f37, { metalness: 0.3, roughness: 0.5 }));
  printer.position.set(PR.x, PR.y + 0.055, PR.z); scene.add(printer);
  const slot = mesh(new THREE.BoxGeometry(0.15, 0.008, 0.01), std(0x08090b, { roughness: 0.6 }), { cast: false });
  slot.position.set(PR.x, PR.y + 0.072, PR.z + 0.0905); scene.add(slot);
  const prLedM = new THREE.MeshBasicMaterial({ color: 0x222222, toneMapped: false });
  const prLed = new THREE.Mesh(new THREE.SphereGeometry(0.006, 10, 8), prLedM); prLed.position.set(PR.x + 0.065, PR.y + 0.111, PR.z + 0.06); scene.add(prLed);
  const prGlow = glow(0xff3050, 0.12, 0, 0.4); prGlow.position.copy(prLed.position); scene.add(prGlow);

  // The red mug.
  const mug = new THREE.Group(); scene.add(mug);
  const ceramic = new THREE.MeshPhysicalMaterial({ color: RED_H, roughness: 0.3, clearcoat: 0.7, clearcoatRoughness: 0.15 });
  mug.add(mesh(new THREE.CylinderGeometry(0.036, 0.033, 0.095, 28), ceramic));
  const coffee = mesh(new THREE.CircleGeometry(0.031, 24), std(0x2a170e, { roughness: 0.15 }), { cast: false }); coffee.rotation.x = -Math.PI / 2; coffee.position.y = 0.04; mug.add(coffee);
  const mHandle = mesh(new THREE.TorusGeometry(0.022, 0.007, 8, 20, Math.PI * 1.2), ceramic); mHandle.rotation.z = -Math.PI / 2 - 0.3; mHandle.position.x = 0.036; mug.add(mHandle);
  const MUG_REST = V(0.06, 0.808, 0.06);
  const S0 = sideOf(Math.PI), F0 = fwdOf(Math.PI), MUG_YAW = Math.atan2(-S0.z, S0.x);
  const L_REST = MUG_REST.clone().add(V(0.08, -0.02, 0.0));

  // ----------------------------------------------------------- the chair and the agent
  const HIP0 = V(0.38, 0.53, 0.4), YAW0 = Math.PI;
  const chairG = new THREE.Group(); chairG.position.set(HIP0.x, 0, HIP0.z + 0.02); scene.add(chairG);
  const fabric = std(0x2a3346, { roughness: 0.9 }), chrome = std(0xb9bfc8, { metalness: 1, roughness: 0.25 });
  const seat = mesh(new RoundedBoxGeometry(0.5, 0.07, 0.48, 3, 0.03), fabric); seat.position.y = 0.45; chairG.add(seat);
  const backR = mesh(new RoundedBoxGeometry(0.46, 0.5, 0.06, 3, 0.03), fabric); backR.position.set(0, 0.8, 0.26); backR.rotation.x = 0.12; chairG.add(backR);
  const post = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 14), chrome); post.position.y = 0.24; chairG.add(post);
  const base = mesh(new THREE.CylinderGeometry(0.26, 0.28, 0.03, 5), std(0x15171b, { metalness: 0.5, roughness: 0.4 })); base.position.y = 0.06; chairG.add(base);

  const skin = new THREE.MeshPhysicalMaterial({ color: 0xa8714f, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const sweater = std(0x34557a, { roughness: 0.92 });
  const agent = makePerson(scene, { skin, top: sweater, sleeve: sweater, fore: sweater, pants: std(0x23252b, { roughness: 0.85 }), shoeM: std(0x15161a, { roughness: 0.5 }), hairM: std(0x1a120d, { roughness: 0.9 }), hairCap: 0.56, chestR: 0.145 });
  // Collar: a lighter shirt peeking out of the sweater.
  const collar = mesh(new THREE.TorusGeometry(0.06, 0.016, 8, 24), std(0xdfe3ea, { roughness: 0.8 }), { cast: false }); scene.add(collar);
  agent.extra.push((hip, top, F, S, Dn) => { collar.position.copy(top).addScaledVector(Dn, 0.02); collar.quaternion.setFromUnitVectors(V(0, 0, 1), Dn); });

  // Headset: band, two cups, a boom mic and the status light that turns green when the agent is live.
  const hsM = std(0x17191d, { roughness: 0.4, metalness: 0.3 });
  const band = mesh(new THREE.TorusGeometry(0.114, 0.008, 6, 28, Math.PI), hsM, { cast: false }); scene.add(band);
  const cups = [0, 1].map(() => { const c2 = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.026, 20), hsM, { cast: false }); scene.add(c2); return c2; });
  const boom = mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 6), hsM, { cast: false }); scene.add(boom);
  const hsLedM = new THREE.MeshBasicMaterial({ color: 0x333333, toneMapped: false });
  const hsLed = new THREE.Mesh(new THREE.SphereGeometry(0.008, 10, 8), hsLedM); scene.add(hsLed);
  const hsGlow = glow(GREEN_H, 0.14, 0, 0.4); scene.add(hsGlow);
  const hsRing = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.0025, 6, 48), new THREE.MeshBasicMaterial({ color: TEAL_H, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(hsRing);

  // ----------------------------------------------------------- the assistant orb
  const orb = new THREE.Group(); scene.add(orb);
  const shell = new THREE.Mesh(new THREE.SphereGeometry(0.055, 32, 20), new THREE.MeshPhysicalMaterial({ color: 0xbfeee8, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.05, transparent: true, opacity: 0.35, depthWrite: false }));
  orb.add(shell);
  const coreM = new THREE.MeshBasicMaterial({ color: TEAL_H, toneMapped: false });
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.026, 20, 14), coreM); orb.add(core);
  const orbGlow = glow(TEAL_H, 0.3, 0.6, 0.4); orb.add(orbGlow);
  const orbL = new THREE.PointLight(TEAL_H, 0.8, 1.0, 1.8); orb.add(orbL);
  const ORB0 = V(-0.52, 1.36, -0.24);

  // ----------------------------------------------------------- the conveyor, posts and the parcel
  const CZ = 0.12, CTOP = 0.755, RR = 0.02;
  const rail = std(0x50565f, { metalness: 0.8, roughness: 0.35 });
  const railI = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.05, 0.025), rail, 2);
  [-0.13, 0.13].forEach((dz, i) => { m4.makeTranslation(1.86, CTOP - 0.012, CZ + dz); railI.setMatrixAt(i, m4); });
  railI.castShadow = railI.receiveShadow = true; scene.add(railI);
  const cLegI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.03, CTOP - 0.03, 0.03), rail, 6);
  [1.02, 1.86, 2.7].forEach((x, j) => [-0.13, 0.13].forEach((dz, i) => { m4.makeTranslation(x, (CTOP - 0.03) / 2, CZ + dz); cLegI.setMatrixAt(j * 2 + i, m4); }));
  cLegI.castShadow = true; scene.add(cLegI);
  const NR = 22;
  const rollerTex = canvasTex(64, 16, (c, w, h) => { c.fillStyle = '#8b929b'; c.fillRect(0, 0, w, h); c.fillStyle = '#5a6068'; c.fillRect(0, 0, w * 0.18, h); });
  rollerTex.tex.wrapS = THREE.RepeatWrapping; rollerTex.tex.repeat.set(3, 1);
  const rollI = new THREE.InstancedMesh(new THREE.CylinderGeometry(RR, RR, 0.25, 14), std(0xffffff, { map: rollerTex.tex, metalness: 0.85, roughness: 0.3 }), NR);
  rollI.receiveShadow = true; scene.add(rollI);
  const rollerX = (i) => 1.0 + i * 0.08;
  const rollE = new THREE.Euler(0, 0, 0, 'ZYX');
  // Posts: one instanced body, one lamp head and one glow each.
  const postI = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.016, 0.26, 12), rail, 3);
  POST_X.forEach((x, i) => { m4.makeTranslation(x, CTOP + 0.13 - 0.03, CZ - 0.2); postI.setMatrixAt(i, m4); });
  postI.castShadow = true; scene.add(postI);
  const heads = POST_X.map((x) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 20), new THREE.MeshBasicMaterial({ color: 0x1c2026, toneMapped: false }));
    m.position.set(x, CTOP + 0.24, CZ - 0.2); scene.add(m);
    const g = glow(TEAL_H, 0.3, 0, 0.4); g.position.set(x, CTOP + 0.26, CZ - 0.18); scene.add(g);
    return { m, g };
  });
  const OFF = new THREE.Color(0x1c2026), ON = new THREE.Color(TEAL_H), RET_C = new THREE.Color(RED_H), hc = new THREE.Color();

  const BW = 0.24, BH = 0.17, BD = 0.2;
  const parcel = new THREE.Group(); scene.add(parcel);
  parcel.add(mesh(new RoundedBoxGeometry(BW, BH, BD, 2, 0.01), std(0xffffff, { map: grainTex('#a87a4a', { size: 128, speck: 0.16, blot: 0.08, seed: 44 }), roughness: 0.9 })));
  const tape = mesh(new THREE.PlaneGeometry(BW + 0.002, 0.05), std(0xc9a46a, { roughness: 0.35, metalness: 0.05, transparent: true, opacity: 0.85 }), { cast: false });
  tape.rotation.x = -Math.PI / 2; tape.position.y = BH / 2 + 0.0008; parcel.add(tape);

  // The return label: drawn once, printed out of the printer and pressed onto the parcel.
  const LW = 0.13, LH = 0.085;
  const labelTex = canvasTex(416, 272, (c, w, h) => {
    c.fillStyle = '#f2efe9'; c.fillRect(0, 0, w, h);
    c.fillStyle = RED; c.fillRect(0, 0, w, 46);
    c.fillStyle = '#ffffff'; c.font = `800 30px ${MONO}`; c.textBaseline = 'middle'; c.fillText('RETURN LABEL', 18, 24);
    c.fillStyle = '#16181c';
    let x = 20; for (let i = 0; x < w - 24; i++) { const bw = 2 + Math.floor(rnd(i, 3) * 4) * 2; if (rnd(i, 4) > 0.35) c.fillRect(x, 70, bw, 120); x += bw + 3; }
    c.fillStyle = '#7a7f88'; roundRect(c, 20, 214, 220, 14, 7); c.fill(); roundRect(c, 20, 238, 150, 14, 7); c.fill();
  }).tex;
  const lab = mesh(new THREE.PlaneGeometry(LW, LH), std(0xffffff, { map: labelTex, roughness: 0.55, side: THREE.DoubleSide }), { cast: false });
  scene.add(lab);
  const labGlow = glow(0xffd0c0, 0.3, 0, 0.5); scene.add(labGlow);
  const stickRing = new THREE.Mesh(new THREE.RingGeometry(0.09, 0.096, 48), new THREE.MeshBasicMaterial({ color: 0xff6070, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false, side: THREE.DoubleSide }));
  stickRing.rotation.x = -Math.PI / 2; scene.add(stickRing);

  // ----------------------------------------------------------- the chat UI
  const circle = (c, x, y, r) => { c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); };
  const barsIn = (c, x, y, bars, col) => { c.fillStyle = col; bars.forEach((bw, j) => { roundRect(c, x, y + j * 32, bw, 14, 7); c.fill(); }); };
  function drawChat(c, w, h, s) {
    c.fillStyle = '#0e1420'; c.fillRect(0, 0, w, h);
    // Message list.
    const TOP = 108, AREA = h - 84 - TOP;
    let total = 0; const ys = [];
    MSG.forEach((m, i) => { ys.push(total); total += (m.h + 16) * s.a[i]; });
    const typY = total; total += 72 * s.typA;
    const scroll = Math.max(0, total - AREA);
    c.save(); c.beginPath(); c.rect(0, TOP, w, AREA); c.clip();
    MSG.forEach((m, i) => {
      const a = s.a[i]; if (a <= 0.001) return;
      const y = TOP + ys[i] - scroll + (1 - a) * 22;
      c.globalAlpha = a;
      if (m.who === 'me') {
        const bw = Math.max(...m.bars) + 56, x = w - 28 - bw;
        c.fillStyle = '#2a3a55'; roundRect(c, x, y, bw, m.h, 22); c.fill();
        barsIn(c, x + 28, y + 26, m.bars, '#a9bad3');
      } else if (m.kind === 'div') {
        c.fillStyle = 'rgba(61,220,132,0.35)'; c.fillRect(40, y + 19, w / 2 - 70, 2); c.fillRect(w / 2 + 30, y + 19, w / 2 - 70, 2);
        c.fillStyle = GREEN; circle(c, w / 2 - 10, y + 20, 9);
      } else if (m.kind === 'status') {
        const x = 28, bw = 560;
        c.fillStyle = '#122231'; roundRect(c, x, y, bw, m.h, 24); c.fill();
        c.strokeStyle = 'rgba(58,214,196,0.45)'; c.lineWidth = 2; roundRect(c, x + 1, y + 1, bw - 2, m.h - 2, 24); c.stroke();
        c.fillStyle = TEAL; c.font = `700 30px ${MONO}`; c.textBaseline = 'middle'; c.fillText('ORDER STATUS', x + 30, y + 42);
        ['PLACED', 'SHIPPED', 'DELIVERED'].forEach((word, r) => {
          const ry = y + 104 + r * 58, cx = x + 50, ck = s.chk[r];
          if (r < 2) { c.fillStyle = '#2c3a4c'; c.fillRect(cx - 2, ry + 18, 4, 22); c.fillStyle = TEAL; c.fillRect(cx - 2, ry + 18, 4, 22 * s.link[r]); }
          c.strokeStyle = '#4a5a70'; c.lineWidth = 3; c.beginPath(); c.arc(cx, ry, 17, 0, Math.PI * 2); c.stroke();
          if (ck > 0) {
            c.fillStyle = TEAL; circle(c, cx, ry, 18 * Math.min(1.2, ck));
            c.strokeStyle = '#0e1420'; c.lineWidth = 4.5; c.lineCap = 'round'; c.lineJoin = 'round';
            c.beginPath(); c.moveTo(cx - 8, ry + 1); c.lineTo(cx - 2, ry + 7); c.lineTo(cx + 9, ry - 6); c.stroke();
          }
          c.fillStyle = `rgba(232,237,245,${0.4 + 0.6 * clamp(ck)})`; c.font = `700 36px ${SANS}`; c.fillText(word, x + 90, ry + 2);
        });
      } else if (m.kind === 'label') {
        const x = 28, bw = 500;
        c.fillStyle = '#efece6'; roundRect(c, x, y, bw, m.h, 22); c.fill();
        c.fillStyle = RED; roundRect(c, x, y, 16, m.h, 8); c.fill(); c.fillRect(x + 8, y, 8, m.h);
        c.fillStyle = RED; c.font = `800 32px ${MONO}`; c.textBaseline = 'middle'; c.fillText('RETURN LABEL', x + 40, y + 40);
        c.fillStyle = '#16181c';
        let bx = x + 40; for (let i = 0; bx < x + bw - 120; i++) { const bwid = 2 + Math.floor(rnd(i, 3) * 4) * 2; if (rnd(i, 4) > 0.35) c.fillRect(bx, y + 74, bwid, 76); bx += bwid + 3; }
        c.fillStyle = RED; circle(c, x + bw - 62, y + 112, 30);
        c.strokeStyle = '#ffffff'; c.lineWidth = 5; c.lineCap = 'round'; c.beginPath(); c.moveTo(x + bw - 62, y + 96); c.lineTo(x + bw - 62, y + 124); c.moveTo(x + bw - 74, y + 113); c.lineTo(x + bw - 62, y + 125); c.lineTo(x + bw - 50, y + 113); c.stroke();
      } else {
        const bw = Math.max(...m.bars) + 56, x = 28;
        c.fillStyle = '#1a2a24'; roundRect(c, x, y, bw, m.h, 22); c.fill();
        c.strokeStyle = 'rgba(61,220,132,0.45)'; c.lineWidth = 2; roundRect(c, x + 1, y + 1, bw - 2, m.h - 2, 22); c.stroke();
        barsIn(c, x + 28, y + 26, m.bars, '#9fd8b8');
      }
    });
    if (s.typA > 0.001) {
      c.globalAlpha = s.typA;
      const y = TOP + typY - scroll;
      c.fillStyle = s.typWho === 'bot' ? '#122231' : '#1a2a24'; roundRect(c, 28, y, 120, 56, 24); c.fill();
      for (let d = 0; d < 3; d++) { c.fillStyle = s.typWho === 'bot' ? TEAL : GREEN; c.globalAlpha = s.typA * (d === s.dot ? 1 : 0.35); circle(c, 60 + d * 28, y + 28 - (d === s.dot ? 5 : 0), 8); }
    }
    c.restore(); c.globalAlpha = 1;
    // Header: who is answering.
    c.fillStyle = '#151d2c'; c.fillRect(0, 0, w, 92);
    c.fillStyle = 'rgba(255,255,255,0.06)'; c.fillRect(0, 91, w, 2);
    const lv = s.live;
    c.globalAlpha = 1 - lv; c.fillStyle = TEAL; circle(c, 52, 46, 28);
    c.fillStyle = '#0e1420'; roundRect(c, 38, 38, 9, 14, 4); c.fill(); roundRect(c, 57, 38, 9, 14, 4); c.fill();
    c.globalAlpha = lv; c.fillStyle = '#d9e1ec'; circle(c, 52, 46, 28);
    c.fillStyle = '#34557a'; circle(c, 52, 39, 10); c.beginPath(); c.arc(52, 70, 19, Math.PI, Math.PI * 2); c.fill();
    c.fillStyle = GREEN; circle(c, 74, 66, 9);
    c.globalAlpha = 1;
    c.save(); c.beginPath(); c.rect(90, 0, 600, 92); c.clip();
    c.font = `700 36px ${MONO}`; c.textBaseline = 'middle';
    c.fillStyle = `rgba(232,237,245,${1 - lv})`; c.fillText('ASSISTANT', 104, 47 - lv * 40);
    c.fillStyle = `rgba(232,237,245,${lv})`; c.fillText('LIVE AGENT', 104, 47 + (1 - lv) * 40);
    c.restore();
    // Composer.
    c.fillStyle = '#151d2c'; roundRect(c, 24, h - 70, w - 48, 54, 27); c.fill();
    if (s.comp > 0) { c.fillStyle = '#a9bad3'; roundRect(c, 52, h - 50, 300 * s.comp, 14, 7); c.fill(); }
    c.fillStyle = s.send > 0 ? `rgba(58,214,196,${0.4 + 0.6 * s.send})` : '#2a3448'; circle(c, w - 58, h - 43, 20);
  }
  let chatKey = '';
  const q = (x, n = 20) => Math.round(clamp(x) * n);
  function updateChat(t) {
    const a = MSG.map((m) => eo(k(t, m.at, m.at + 0.32)));
    const chk = CHECK.map((c0) => back(k(t, c0, c0 + 0.3)));
    const link = CHECK.slice(0, 2).map((c0, i) => eio(k(t, c0 + 0.05, CHECK[i + 1])));
    let typA = 0, typWho = 'bot';
    MSG.forEach((m) => { if (m.typing != null) { const v = Math.min(eo(k(t, m.typing, m.typing + 0.15)), 1 - k(t, m.at - 0.05, m.at + 0.08)); if (v > typA) { typA = v; typWho = m.who; } } });
    const dot = Math.floor(t * 7) % 3;
    let comp = 0, send = 0;
    COMPOSE.forEach(([a0, a1]) => { if (t > a0 && t < a1) comp = eio(k(t, a0, a1 - 0.08)); send = Math.max(send, Math.exp(-10 * Math.max(0, t - a1)) * (t > a1 - 0.02 ? 1 : 0)); });
    const live = eio(k(t, T_LIVE - 0.1, T_LIVE + 0.25));
    const s = { a, chk, link, typA, typWho, dot, comp, send, live };
    const key = [a.map((x) => q(x)).join(), chk.map((x) => Math.round(x * 20)).join(), link.map((x) => q(x)).join(), q(typA, 10), typA > 0 ? dot : '-', q(comp), q(send, 8), q(live)].join('|');
    if (key === chatKey) return; chatKey = key;
    chat.redraw((c, w, h) => drawChat(c, w, h, s));
  }

  // ----------------------------------------------------------- title
  const title = label('Chatbot and service tools', { font: `800 64px ${SANS}`, fg: '#eef1f6', h: 0.12, pad: 12, track: 1 });
  const client = label('Honeywell', { font: `700 56px ${MONO}`, fg: '#ff5a6e', h: 0.075, pad: 8, track: 4 });
  [title, client].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width;

  // ----------------------------------------------------------- dust in the lamp light
  const DN = 120, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd8a8, size: 0.008, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.14, 1.3, 1.02]], [2.1, [-0.08, 1.31, 1.12]],
    [3.2, [0.1, 1.4, 1.95]], [3.75, [-0.05, 1.34, 1.58]], [4.8, [-0.12, 1.3, 1.4], L],
    [5.7, [1.4, 1.38, 1.4]], [6.95, [1.5, 1.32, 1.28], L],
    [8.2, [0.48, 1.5, 2.5]], [10, [0.46, 1.52, 2.62], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [0.03, 1.12, -0.34]], [2.1, [0.06, 1.11, -0.32]],
    [3.2, [0.42, 1.0, -0.15]], [3.75, [0.2, 1.06, -0.14]], [4.8, [0.1, 1.1, -0.15], L],
    [5.7, [0.66, 0.95, -0.02]], [6.95, [0.72, 0.92, 0.02], L],
    [8.2, [0.34, 1.03, -0.2]], [10, [0.32, 1.05, -0.2], L],
  ]);
  const tgt = V(0, 0, 0);
  const faceCam = (m) => { m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), 0); };

  // ----------------------------------------------------------- choreography helpers
  const F = V(0, 0, 0), S = V(0, 0, 0), Dn = V(0, 0, 0), top = V(0, 0, 0), hip = V(0, 0, 0), look = V(0, 0, 0);
  const tmp = V(0, 0, 0), tmp2 = V(0, 0, 0), mugP = V(0, 0, 0), labP = V(0, 0, 0), parcelTop = V(0, 0, 0), ear = V(0, 0, 0), orbP = V(0, 0, 0);
  const KB = [V(0.47, 0.8, 0.02), V(0.29, 0.8, 0.02)];  // right and left typing spots
  const REST_R = V(0.66, 0.79, 0.14);
  const PR_OUT = V(PR.x, PR.y + 0.072, PR.z + 0.09);     // where the label leaves the slot
  const hsBasis = new THREE.Matrix4(), hsS = V(0, 0, 0), hsF = V(0, 0, 0);
  const qa = new THREE.Quaternion(), qb = new THREE.Quaternion(), rHandW = V(0, 0, 0), earEst = V(0, 0, 0), GRAB_OFF = V(0, 0.03, 0.035);
  const typing = (t) => Math.max(k(t, 4.42, 4.55) * (1 - k(t, 5.12, 5.2)), k(t, 7.3, 7.4) * (1 - k(t, 7.85, 7.95)));

  // Where the label is: inside the printer, feeding out, in the hand, then on the parcel.
  function labelPose(t, hand, out) {
    const feed = eo(k(t, PRINT[0], PRINT[1]));
    out.copy(PR_OUT).add(tmp2.set(0, -0.004 * feed, LH * 0.5 * feed - LH * 0.45));
    let pitch = -Math.PI / 2 + 0.25 * feed;
    if (t > GRAB) {
      const carry = eio(k(t, GRAB, STICK));
      tmp2.copy(hand).add(tmp.set(0, -0.03, 0.0));
      out.lerp(tmp2, eio(k(t, GRAB, GRAB + 0.12)));
      parcelTop.set(boxX(t), CTOP + BH + 0.0016, CZ);
      out.lerp(parcelTop, eio(k(t, STICK - 0.12, STICK + 0.06)));
      pitch = lerp(pitch, -Math.PI / 2, carry);
      if (t > STICK + 0.06) out.copy(parcelTop);
    }
    return pitch;
  }

  function update(t) {
    const p = camPos(t), qq = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.006, p[1] + Math.sin(t * 1.6 + 1) * 0.004, p[2]);
    tgt.set(qq[0], qq[1], qq[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    updateChat(t);
    const bx = boxX(t);

    // ---- The agent's body: leaning back with the mug, then leaning in once live, turning to the printer.
    const engage = eio(k(t, 3.85, 4.5)), turn = Math.sin(Math.PI * k(t, 5.35, 7.25)), settle = eio(k(t, 8.0, 8.9));
    const lean = lerp(-0.12, 0.16, engage) - 0.1 * settle * engage + 0.12 * turn + 0.012 * Math.sin(t * 2.1);
    const yaw = YAW0 - 0.38 * turn;
    hip.copy(HIP0); hip.z -= 0.03 * engage; hip.x += 0.04 * turn;
    fwdOf(yaw, F); sideOf(yaw, S);
    Dn.copy(F).multiplyScalar(lean).add(Y).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    chairG.rotation.y = -0.38 * turn * 0.6;

    // The mug: held at the chest, a sip, then set down on the desk.
    const sip = Math.sin(Math.PI * k(t, 0.85, 1.75));
    mugP.copy(top).addScaledVector(F, 0.22).addScaledVector(Y, -0.2).addScaledVector(S, 0.07);
    tmp.copy(top).addScaledVector(Dn, 0.13).addScaledVector(F, 0.11).addScaledVector(S, 0.02);
    mugP.lerp(tmp, eio(clamp(sip * 1.4)));
    const down = eio(k(t, 3.7, 4.12));
    mugP.lerp(MUG_REST, down);
    mugP.y += 0.012 * Math.sin(Math.PI * k(t, 4.0, 4.16)) * (t < 4.16 ? 1 : 0);
    mug.position.copy(mugP);
    qa.setFromAxisAngle(Y, MUG_YAW);
    qb.setFromAxisAngle(S0, -0.75 * sip * (1 - down));
    mug.quaternion.copy(qb).multiply(qa);

    // Where the right hand is, before the pose: the label needs it.
    const rHand = tmp.copy(REST_R);
    {
      const toKb = eio(k(t, 3.95, 4.42));
      rHand.lerp(KB[0], toKb);
      const tap = Math.max(0, Math.sin(t * 23)) * 0.012 * typing(t) + 0.02 * Math.sin(Math.PI * k(t, T_ENTER - 0.08, T_ENTER + 0.06));
      rHand.y += tap;
      labelPose(Math.min(t, GRAB), rHand, labP);
      rHand.lerp(tmp2.copy(labP).add(GRAB_OFF), eio(k(t, 5.35, GRAB)));
      parcelTop.set(bx, CTOP + BH + 0.05, CZ);
      rHand.lerp(parcelTop, eio(k(t, GRAB + 0.05, STICK)));
      rHand.y -= 0.028 * Math.sin(Math.PI * k(t, STICK - 0.02, LET_GO));
      rHand.lerp(KB[0], eio(k(t, LET_GO, 7.3)));
      rHand.y += Math.max(0, Math.sin(t * 21 + 1)) * 0.011 * k(t, 7.3, 7.4) * (1 - k(t, 7.85, 7.95));
      rHand.lerp(REST_R, eio(k(t, 8.0, 8.6)));
    }
    rHandW.copy(rHand);

    // The right ear, estimated from the torso before the pose, is where the orb docks.
    earEst.copy(top).addScaledVector(Dn, 0.17).addScaledVector(S, -0.11);
    // ---- The assistant orb: idles by the monitor, pulses as it answers, then docks in the headset.
    const speak = Math.exp(-6 * Math.max(0, t - 1.2)) * (t > 1.15 ? 1 : 0) + 0.5 * Math.sin(Math.PI * k(t, 0.85, 1.2));
    orbP.copy(ORB0); orbP.y += Math.sin(t * 2.0) * 0.012; orbP.x += Math.sin(t * 1.3) * 0.006;
    const fly = eio(k(t, 3.7, T_LIVE));
    if (fly > 0) {
      tmp.lerpVectors(ORB0, earEst, 0.5); tmp.y += 0.22; tmp.z += 0.12;
      const u = fly;
      orbP.set(
        (1 - u) * (1 - u) * orbP.x + 2 * (1 - u) * u * tmp.x + u * u * earEst.x,
        (1 - u) * (1 - u) * orbP.y + 2 * (1 - u) * u * tmp.y + u * u * earEst.y,
        (1 - u) * (1 - u) * orbP.z + 2 * (1 - u) * u * tmp.z + u * u * earEst.z,
      );
    }
    orb.position.copy(orbP);
    orb.scale.setScalar(lerp(1, 0.25, ei(fly)) * (1 + 0.15 * speak) * eo(k(t, 0.2, 0.7)));
    orb.visible = t < T_LIVE + 0.01;
    coreM.color.setHex(TEAL_H).multiplyScalar(1 + 0.8 * speak);
    orbGlow.material.opacity = 0.5 + 0.4 * speak + 0.2 * Math.sin(t * 3);
    orbL.intensity = 0.8 + 1.2 * speak;

    // Look: the screen, the orb as it comes over, the printer, the label, the parcel going out.
    look.set(SCX, SCY, SZ);
    if (t > 3.6 && t < 4.2) look.lerp(orbP, Math.sin(Math.PI * k(t, 3.6, 4.2)) * 0.55);
    look.lerp(PR_OUT, eio(k(t, 5.3, 5.6)) * (1 - eio(k(t, 6.0, 6.25))));
    if (t > 5.95) look.lerp(tmp2.set(bx, CTOP + BH, CZ), eio(k(t, 5.95, 6.25)) * (1 - eio(k(t, 8.0, 8.5))));
    look.lerp(tmp2.set(SCX, SCY, SZ), eio(k(t, 8.4, 8.9)));
    const nod = 0.25 * Math.sin(Math.PI * k(t, STICK, STICK + 0.4));

    agent.pose({
      hip, yaw, lean, look, nod,
      kneePole: tmp2.copy(F).add(Y),
      feet: (i, out) => { const sg = i ? 1 : -1; out.copy(HIP0).addScaledVector(F0, 0.42).addScaledVector(S0, sg * 0.13); out.y = 0.085; },
      hands: (i, sh, out) => {
        if (i === 0) { out.copy(rHandW); return; }
        // Left hand: on the mug handle, then the keyboard, then resting on the desk.
        out.copy(mugP).addScaledVector(S, 0.075).add(tmp2.set(0, -0.01, 0));
        out.lerp(KB[1], eio(k(t, 4.12, 4.45)));
        out.y += Math.max(0, Math.sin(t * 19 + 2.2)) * 0.012 * typing(t);
        out.lerp(L_REST, eio(k(t, 8.05, 8.7)));
      },
    });

    // Headset follows the head.
    const hd = agent.headPos, lk = agent.lookD;
    const hy = Math.atan2(lk.x, lk.z);
    sideOf(hy, hsS); fwdOf(hy, hsF);
    hsBasis.makeBasis(hsS, Y, hsF);
    band.position.copy(hd).add(tmp2.set(0, 0.004, 0)).addScaledVector(hsF, -0.01); band.quaternion.setFromRotationMatrix(hsBasis);
    cups.forEach((c2, i) => { const sg = i ? 1 : -1; c2.position.copy(hd).addScaledVector(hsS, sg * 0.106).addScaledVector(hsF, -0.008); c2.quaternion.setFromUnitVectors(Y, hsS); });
    ear.copy(cups[0].position);
    tmp.copy(hd).addScaledVector(hsF, 0.085).addScaledVector(Y, -0.075).addScaledVector(hsS, -0.035);
    boom.position.addVectors(ear, tmp).multiplyScalar(0.5); boom.quaternion.setFromUnitVectors(Y, tmp2.subVectors(tmp, ear).normalize()); boom.scale.y = ear.distanceTo(tmp);
    hsLed.position.copy(ear).addScaledVector(hsS, -0.016);
    const live = k(t, T_LIVE - 0.02, T_LIVE + 0.1);
    hsLedM.color.set(live > 0 ? GREEN_H : 0x333333).multiplyScalar(live > 0 ? 1.4 : 1);
    hsGlow.position.copy(hsLed.position); hsGlow.material.opacity = 0.8 * live + 0.6 * Math.exp(-5 * Math.max(0, t - T_LIVE)) * (t > T_LIVE ? 1 : 0);
    const rp = k(t, T_LIVE, T_LIVE + 0.6);
    hsRing.position.copy(ear); hsRing.lookAt(camera.position); hsRing.scale.setScalar(1 + 2.4 * eo(rp)); hsRing.material.opacity = 0.9 * Math.sin(Math.PI * rp) * (rp > 0 ? 1 : 0);

    // ---- The conveyor: rollers turn with the parcel, posts light as it passes.
    rollE.set(Math.PI / 2, 0, -bx / RR);
    q4.setFromEuler(rollE);
    for (let i = 0; i < NR; i++) {
      m4.compose(p4.set(rollerX(i), CTOP - RR, CZ), q4, s4.set(1, 1, 1));
      rollI.setMatrixAt(i, m4);
    }
    rollI.instanceMatrix.needsUpdate = true;
    const seat2 = Math.exp(-7 * Math.max(0, t - BOX_IN[1])) * (t > BOX_IN[1] ? 1 : 0);
    parcel.position.set(bx, CTOP + BH / 2 + 0.004 * Math.sin((t - BOX_IN[1]) * 18) * seat2, CZ);
    parcel.rotation.set(0, 0, 0.05 * seat2 * Math.sin((t - BOX_IN[1]) * 14));
    parcel.visible = bx < 2.6;
    heads.forEach(({ m, g }, i) => {
      const on = eo(k(t, CHECK[i] - 0.05, CHECK[i] + 0.12)), flash = t > CHECK[i] ? Math.exp(-6 * (t - CHECK[i])) : 0;
      const rflash = t > RET[i] ? Math.exp(-3.5 * (t - RET[i])) : 0, rOn = k(t, RET[i] - 0.04, RET[i] + 0.06);
      hc.copy(OFF).lerp(ON, on * 0.75 + 0.25 * flash);
      hc.lerp(RET_C, rOn * 0.85 * Math.max(0.35, rflash));
      m.material.color.copy(hc).multiplyScalar(1 + 1.5 * Math.max(flash, rflash));
      g.material.color.copy(rOn > 0 ? RET_C : ON);
      g.material.opacity = (0.35 * on + 0.6 * flash) * (1 - rOn) + rOn * (0.25 + 0.7 * rflash);
    });

    // ---- The label: printed, peeled, carried, pressed on.
    const pitch = labelPose(t, rHandW, labP);
    lab.position.copy(labP);
    lab.rotation.set(pitch, 0, 0);
    lab.visible = t > PRINT[0] - 0.05 && bx < 2.6;
    const printing = t > PRINT[0] && t < PRINT[1];
    prLedM.color.set(printing ? (Math.sin(t * 30) > 0 ? 0xff3050 : 0x401018) : (t > PRINT[1] && t < GRAB + 0.4 ? 0x3ddc84 : 0x222222));
    prGlow.material.opacity = printing ? 0.7 : (t > PRINT[1] && t < GRAB + 0.4 ? 0.5 : 0);
    prGlow.material.color.set(printing ? 0xff3050 : GREEN_H);
    printer.position.y = PR.y + 0.055 + (printing ? Math.sin(t * 60) * 0.0008 : 0);
    labGlow.position.copy(labP).add(tmp2.set(0, 0.01, 0));
    labGlow.material.opacity = 0.35 * Math.sin(Math.PI * k(t, PRINT[1] - 0.2, STICK + 0.5));
    const st = k(t, STICK + 0.04, STICK + 0.7);
    stickRing.position.set(bx, CTOP + BH + 0.004, CZ); stickRing.scale.setScalar(0.8 + 1.4 * eo(st));
    stickRing.material.opacity = 0.85 * Math.sin(Math.PI * st) * (st > 0 ? 1 : 0);

    // ---- Lamp flicker-free warmth; the screen breathes with the conversation.
    screenGlow.material.opacity = 0.12 + 0.05 * Math.sin(t * 1.7);
    key.intensity = 26;

    // ---- Title.
    const ci = back(k(t, 8.0, 8.5)), ti = back(k(t, 8.15, 8.7)), out = ei(k(t, 9.25, 9.6));
    title.position.set(SCX, 1.62 + (1 - clamp(ti)) * -0.05, -0.32);
    faceCam(title);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    client.position.set(title.position.x - (TWd / 2 - CWd / 2 - 0.01) * Math.cos(title.rotation.y), 1.73 + (1 - clamp(ci)) * -0.04, title.position.z + (TWd / 2 - CWd / 2 - 0.01) * Math.sin(title.rotation.y));
    client.rotation.copy(title.rotation);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -0.9 + rnd(i, 71) * 1.6 + Math.sin(t * 0.3 + i) * 0.06;
      dpos[i * 3 + 1] = 0.85 + rnd(i, 72) * 0.9 + Math.sin(t * 0.4 + i * 1.3) * 0.04;
      dpos[i * 3 + 2] = -0.6 + rnd(i, 73) * 1.2 + Math.cos(t * 0.25 + i) * 0.05;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 6.9 };
}
