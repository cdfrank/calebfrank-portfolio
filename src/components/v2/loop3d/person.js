// Lit loops: the shared person. One skinned mesh per figure, so a person costs a handful of draw calls
// (one per material) instead of eighteen capsules, and reads as one body: shaped chest and waist, hips,
// tapered limbs, knees and elbows, hands with fingers and a thumb, shoes with a sole and toe, and a head
// with a jaw, ears, nose, eyes, brows and hair.
//
// The skeleton math is the same one the scenes already pose (two-bone reach for arms and legs, a spine
// that leans from the hip), so a scene's choreography carries over unchanged. Pass t in pose() and the
// figure also breathes, blinks, keeps a slight head drift and counter-tilts hips and shoulders as weight
// moves between the feet. Everything is placed from the inputs of the current frame, so any t stands alone.
import { THREE, clamp, rnd } from './kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const UP = V(0, 1, 0);
const LT = 0.44, LS = 0.43, LU = 0.29, LF = 0.27;
const EYE = new THREE.MeshStandardMaterial({ color: 0x1a1410, roughness: 0.18, metalness: 0 });
const EYEW = new THREE.MeshPhysicalMaterial({ color: 0xeee6dc, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.04, metalness: 0 });
const MOUTH = new THREE.MeshStandardMaterial({ color: 0x2a1512, roughness: 0.7, metalness: 0 });
const LIPS = new THREE.MeshPhysicalMaterial({ color: 0xa5645a, roughness: 0.42, sheen: 0.3, sheenColor: new THREE.Color(0xffb4a0), metalness: 0 });
const IRIS = new THREE.MeshPhysicalMaterial({ color: 0x5a3b22, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.05, metalness: 0 });
const SOLE = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.62, metalness: 0 });

// Bones, in order. Every bone is a direct child of one root at the origin, so a bone's local transform is
// its world transform, and scenes can read or tweak p.hand[i] / p.shoe[i] as before.
const B = { pelvis: 0, chest: 1, neck: 2, head: 3, ua: [4, 5], fa: [6, 7], hand: [8, 9], th: [10, 11], sh: [12, 13], shoe: [14, 15], eye: [16, 17] };
const NB = 18;

// A smooth lofted tube along local Y through elliptical rings [y, halfWidth(x), halfDepth(z), zOffset].
// End rings shrink to a point so the ends close as domes.
// Rings are resampled on a Catmull-Rom curve (sub extra rings per gap) so profiles read as curves, not
// straight cone sections, and the seam's normals are averaged so no line shows down the back.
function smoothRings(rings, sub) {
  if (sub < 1 || rings.length < 3) return rings;
  const out = [], n = rings.length, P = (i) => rings[Math.max(0, Math.min(n - 1, i))];
  for (let i = 0; i < n - 1; i++) {
    const a = P(i - 1), b = P(i), c = P(i + 1), d = P(i + 2);
    out.push(b);
    for (let s = 1; s <= sub; s++) {
      const u = s / (sub + 1), u2 = u * u, u3 = u2 * u;
      out.push(b.map((_, j) => {
        const p0 = a[j] ?? 0, p1 = b[j] ?? 0, p2 = c[j] ?? 0, p3 = d[j] ?? 0;
        const v = 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
        return j === 0 ? v : (j < 3 ? Math.max(0.0008, v) : v);
      }));
    }
  }
  out.push(P(n - 1));
  return out;
}
function loft(rings0, seg = 30, sub = 2) {
  const rings = smoothRings(rings0, sub);
  const pos = [], idx = [];
  rings.forEach(([y, w, d, oz = 0]) => {
    for (let s = 0; s <= seg; s++) {
      const a = (s / seg) * Math.PI * 2;
      pos.push(Math.cos(a) * w, y, Math.sin(a) * d + oz);
    }
  });
  for (let r = 0; r < rings.length - 1; r++) for (let s = 0; s < seg; s++) {
    const a = r * (seg + 1) + s, b = a + seg + 1;
    idx.push(a, b, a + 1, a + 1, b, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals();
  const nr = g.attributes.normal;
  for (let r = 0; r < rings.length; r++) {
    const a = r * (seg + 1), b = a + seg;
    const x = nr.getX(a) + nr.getX(b), y = nr.getY(a) + nr.getY(b), z = nr.getZ(a) + nr.getZ(b), l = Math.hypot(x, y, z) || 1;
    nr.setXYZ(a, x / l, y / l, z / l); nr.setXYZ(b, x / l, y / l, z / l);
  }
  return g;
}
// Dome rings for the end of a loft: from (y, w, d) closing toward y + dir * h.
function dome(y, w, d, h, dir, n = 6, oz = 0) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * Math.PI / 2;
    out.push([y + dir * h * Math.sin(a), Math.max(0.0008, w * Math.cos(a)), Math.max(0.0008, d * Math.cos(a)), oz]);
  }
  return dir > 0 ? out : out.reverse();
}
// A limb from y0 to y1 (local) with a radius profile and domed ends.
function limb(profile, seg = 28) {
  const first = profile[0], last = profile[profile.length - 1];
  const rings = [...dome(first[0], first[1], first[2] ?? first[1], first[1] * 0.9, -1, 6, first[3] || 0), ...profile.map(([y, w, d, oz]) => [y, w, d ?? w, oz || 0]), ...dome(last[0], last[1], last[2] ?? last[1], last[1] * 0.9, 1, 6, last[3] || 0)];
  return loft(rings, seg);
}
// Merging needs every piece indexed (or none); RoundedBoxGeometry comes without an index.
const prep = (g) => {
  if (g.attributes.uv) g.deleteAttribute('uv');
  if (!g.index) { const n = g.attributes.position.count, ix = []; for (let i = 0; i < n; i++) ix.push(i); g.setIndex(ix); }
  return g;
};
const ball = (r, sx = 1, sy = 1, sz = 1, ws = 28, hs = 18) => new THREE.SphereGeometry(r, ws, hs).scale(sx, sy, sz);
const at = (g, x, y, z, rx = 0, ry = 0, rz = 0) => { g.rotateX(rx); g.rotateY(ry); g.rotateZ(rz); g.translate(x, y, z); return g; };
const capsule = (r, len) => new THREE.CapsuleGeometry(r, len, 4, 12);

// A capsule from a base point along a direction, for finger segments.
function seg(r, len, base, dir) {
  const g = capsule(r, len); g.translate(0, len / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize()));
  g.translate(base.x, base.y, base.z);
  return g;
}

// A hand in hand space: origin at the palm's centre, +Y toward the fingertips, +Z the thumb side,
// palm facing palmSign * X. Fingers rest in a relaxed curl. grip (0..1) curls them further.
export function handGeometry(palmSign = 1, { grip = 0, scale = 1 } = {}) {
  const parts = [new RoundedBoxGeometry(0.03, 0.074, 0.07, 4, 0.013)];
  const zs = [0.025, 0.0085, -0.0085, -0.025], lens = [0.046, 0.05, 0.047, 0.038];
  const c1 = 0.22 + grip * 0.6, c2 = 0.5 + grip * 0.7;
  zs.forEach((z, i) => {
    const L = lens[i], r = i === 3 ? 0.0082 : 0.0092;
    const base = V(0, 0.034, z);
    const d1 = V(-Math.sin(c1) * -palmSign, Math.cos(c1), (i - 1.5) * -0.04).normalize();
    const p1 = seg(r, L * 0.55, base, d1);
    const tip = base.clone().addScaledVector(d1, L * 0.55);
    const a2 = c1 + c2;
    const d2 = V(palmSign * Math.sin(a2), Math.cos(a2), (i - 1.5) * -0.04).normalize();
    parts.push(p1, seg(r * 0.92, L * 0.42, tip, d2));
  });
  // Thumb: from the heel of the palm, out to the thumb side and across toward the palm.
  const tb = V(palmSign * 0.006, -0.018, 0.03);
  const t1 = V(palmSign * 0.35, 0.65, 0.75).normalize();
  parts.push(seg(0.0115, 0.026, tb, t1));
  const tt = tb.clone().addScaledVector(t1, 0.026);
  parts.push(seg(0.0102, 0.022, tt, V(palmSign * (0.55 + grip * 0.4), 0.8, 0.25).normalize()));
  const g = mergeGeometries(parts.map(prep));
  if (scale !== 1) g.scale(scale, scale, scale);
  return g;
}

// A standalone hand mesh (for scenes that show only hands). Same orientation as handGeometry.
export function makeHand(material, palmSign = 1, opts) {
  const m = new THREE.Mesh(handGeometry(palmSign, opts), material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

// Where the eyes sit in head space (+Z is where the face looks, +Y up). The rig places the eye bones here.
const EX = 0.0312, EY = 0.012, EZ = 0.064;
const sstep = (a, b, x) => { const u = clamp((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const gauss = (d, s) => Math.exp(-(d * d) / (s * s));

// One sphere shaped into an adult head at real proportions (about 15.5 cm wide, 23 cm chin to crown):
// a flatter face plane, eye sockets, a brow ridge, cheekbones, a jaw that holds its width to the angle
// and then narrows to a chin set forward, and the back of the skull curving in to the neck.
function skull() {
  const g = new THREE.SphereGeometry(0.1, 112, 84), a = g.attributes.position;
  for (let i = 0; i < a.count; i++) {
    let x = a.getX(i) * 0.79, y = a.getY(i), z = a.getZ(i) * 0.985;
    if (y < 0) {
      const u = -y / 0.1;
      x *= 1 - 0.16 * u * u - 0.12 * Math.pow(u, 4);
      if (z < 0) z *= 1 - 0.42 * u; else z = z * (1 - 0.12 * u * u) + 0.011 * u * u;
      y *= 1 + 0.2 * u;
    } else y *= 1.05;
    if (z > 0) {
      const f = z / 0.1;
      z *= 1 - 0.13 * f * f;                                                     // a flatter face plane
      const ax = Math.abs(x);
      z -= 0.0075 * gauss(Math.hypot(ax - EX, y - EY + 0.002), 0.016) * f;       // eye sockets
      z += 0.0042 * gauss(y - 0.036, 0.011) * gauss(ax - 0.03, 0.03) * f;        // brow ridge
      x += Math.sign(x) * 0.005 * gauss(y + 0.004, 0.018) * gauss(z - 0.045, 0.025); // cheekbones
      z -= 0.004 * gauss(y + 0.03, 0.02) * gauss(ax - 0.042, 0.016) * f;         // under the cheekbones
      // Nose, sculpted into the face so it grows out of it: a narrow bridge from between the brows,
      // widening to a rounded tip and the nostrils' wings, then tucking back in above the lip.
      const yy = y + 0.008;
      const prof = yy > 0.034 ? 0 : yy > -0.016 ? 0.0035 * sstep(0.034, 0.018, yy) + 0.0172 * Math.pow(Math.max(0, 0.03 - yy) / 0.046, 1.35) : yy > -0.032 ? 0.021 * (1 - Math.pow((-0.016 - yy) / 0.016, 1.6)) : 0;
      const wid = 0.0047 + 0.0062 * sstep(0.01, -0.022, yy);
      z += prof * gauss(ax, wid) * f;
      z += 0.0068 * gauss(ax - 0.0112, 0.0062) * gauss(yy + 0.026, 0.0062) * f;     // nostrils' wings
      z += 0.0016 * gauss(ax, 0.004) * gauss(yy + 0.04, 0.005) * f;                 // philtrum
      z += 0.0035 * gauss(ax, 0.012) * gauss(yy + 0.083, 0.011) * f;                // chin
    }
    a.setXYZ(i, x, y + 0.008, z - 0.004);
  }
  g.computeVertexNormals();
  return g;
}
// The face's surface depth at (x, y), sampled from the skull, so features sit on the skin.
let faceZ = null;
function surfaceZ(x, y) {
  if (!faceZ) {
    const g = skull(), a = g.attributes.position, pts = [];
    for (let i = 0; i < a.count; i++) if (a.getZ(i) > 0.02) pts.push([a.getX(i), a.getY(i), a.getZ(i)]);
    faceZ = pts;
  }
  let best = 0, bd = 1e9;
  for (const [px, py, pz] of faceZ) { const d = (px - x) ** 2 + (py - y) ** 2; if (d < bd) { bd = d; best = pz; } }
  return best;
}
// Hair grown on the skull: the cranium pushed out a few millimetres, trimmed at a real hairline (high at
// the forehead, a little higher at the temples, down past the ears' tops at the sides, to the nape at the
// back), with fine combed grooves so it catches light in streaks. Longer cuts add a fall behind.
function hairShell(cap) {
  const len = cap < 0.56 ? 0 : cap < 0.62 ? 1 : 2;
  const front = 0.062, temple = 0.07, side = len ? -0.004 : 0.026, back = len === 0 ? -0.072 : len === 1 ? -0.1 : -0.11;
  const line = (phi) => {
    const a = Math.abs(phi) / Math.PI;
    if (a < 0.2) return front + 0.0015 * Math.cos(phi * 9) + (temple - front) * sstep(0, 0.2, a);
    if (a < 0.5) return temple + (side - temple) * sstep(0.2, 0.5, a);
    return side + (back - side) * sstep(0.5, 0.95, a);
  };
  const g = skull(), a = g.attributes.position, nr = g.attributes.normal, keep = new Uint8Array(a.count);
  for (let i = 0; i < a.count; i++) {
    const x = a.getX(i), y = a.getY(i), z = a.getZ(i), phi = Math.atan2(x, z), above = y - line(phi);
    keep[i] = above > 0 ? 1 : 0;
    const comb = 0.0011 * Math.sin(phi * 64 + y * 30) + 0.0006 * Math.sin(phi * 151 - y * 70);
    // Below the hairline the shell tucks just under the skin, so the edge is where it crosses the skin: a smooth line.
    const th = above <= 0 ? -0.0018 : (0.001 + 0.009 * sstep(0, 0.035, above)) * (1 + 0.25 * sstep(0.04, 0.1, y)) + comb * sstep(0, 0.02, above);
    a.setXYZ(i, x + nr.getX(i) * th, y + nr.getY(i) * th, z + nr.getZ(i) * th);
  }
  const ix = g.index.array, out = [];
  for (let t = 0; t < ix.length; t += 3) if (keep[ix[t]] || keep[ix[t + 1]] || keep[ix[t + 2]]) out.push(ix[t], ix[t + 1], ix[t + 2]);
  g.setIndex(out);
  g.computeVertexNormals();
  const parts = [g];
  if (len === 2) {
    // A fall of hair behind the shoulders' line: an open, tapering shell round the back and sides.
    const fall = new THREE.CylinderGeometry(0.082, 0.094, 0.2, 56, 10, true, Math.PI * 0.32, Math.PI * 1.36);
    const fa = fall.attributes.position;
    for (let i = 0; i < fa.count; i++) {
      const x = fa.getX(i), y = fa.getY(i), z = fa.getZ(i), phi = Math.atan2(x, z);
      const r = 1 + 0.012 * Math.sin(phi * 48 + y * 12);
      fa.setXYZ(i, x * 0.92 * r, y, z * r);
    }
    fall.computeVertexNormals();
    parts.push(at(fall, 0, -0.1, -0.012));
  }
  return parts;
}
// Head pieces in head space.
function headParts(o) {
  const nz = (x, y, lift = 0) => surfaceZ(x, y) + lift;
  const skin = [
    skull(),
    // Ears: thin and tall, set back and angled, their tops level with the brows.
    at(ball(0.029, 0.32, 1, 0.62, 24, 16), -0.0775, 0.0, -0.006, 0, -0.32, 0.06),
    at(ball(0.029, 0.32, 1, 0.62, 24, 16), 0.0775, 0.0, -0.006, 0, 0.32, -0.06),
  ];
  // Lips: a thinner upper lip over a fuller lower one, and the dark line where they meet.
  const lipZ = nz(0, -0.05, 0);
  const lips = [
    at(ball(0.0115, 1.85, 0.3, 0.42, 32, 14), 0, -0.0458, nz(0, -0.0458, -0.002)),
    at(ball(0.0115, 1.62, 0.42, 0.46, 32, 14), 0, -0.0545, nz(0, -0.0545, -0.0022)),
  ];
  const mouth = [at(new THREE.CapsuleGeometry(0.0009, 0.034, 4, 10), 0, -0.05, lipZ + 0.0026, 0, 0, Math.PI / 2)];
  // Brows: thin, tapered arcs of hair on the brow ridge.
  const brow = (sg) => {
    const g = new THREE.CapsuleGeometry(0.0021, 0.034, 4, 10).scale(1, 1, 0.5);
    g.rotateZ(Math.PI / 2 - sg * 0.07);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i); p.setY(i, p.getY(i) - 18 * x * x * 0.02 + 0.0015 * sg * x / 0.02); }
    g.computeVertexNormals();
    return at(g, sg * 0.032, 0.035, nz(0.032, 0.035, 0.002));
  };
  const hair = [...hairShell(o.hairCap ?? 0.52), brow(-1), brow(1)];
  return { skin, hair, mouth, lips };
}
// Eyes, in eye-bone space: the eyeball, a coloured iris with a dark pupil, and skin lids over the top and
// bottom so the opening reads as an almond, not a round button.
function eyeParts() {
  const ball0 = new THREE.SphereGeometry(0.0118, 32, 24);
  const iris = at(ball(0.0056, 1, 1, 0.32, 28, 14), 0, 0, 0.0108);
  const pupil = at(ball(0.0026, 1, 1, 0.3, 18, 10), 0, 0, 0.0122);
  const upper = new THREE.SphereGeometry(0.0125, 40, 16, 0, Math.PI * 2, 0, Math.PI * 0.43);
  upper.rotateX(-0.06);
  const lower = new THREE.SphereGeometry(0.0124, 40, 12, 0, Math.PI * 2, Math.PI * 0.64, Math.PI * 0.36);
  return { white: ball0, iris, pupil, lids: mergeGeometries([upper, lower].map(prep)) };
}

// ---------------------------------------------------------------- the rig
// Bones for one figure, posed in world space from a handful of inputs. Shared by the single skinned person
// and by the instanced crowd, so both move the same way.
function createRig(o = {}) {
  const r = { seed: o.seed ?? ((o.chestR ?? 0.15) * 997 + (o.hairCap || 0) * 131), extra: [], stretch: 0, reach: 0 };
  const bones = r.bones = [];
  for (let i = 0; i < NB; i++) bones.push(new THREE.Bone());
  r.hand = B.hand.map((i) => bones[i]);
  r.shoe = B.shoe.map((i) => bones[i]);
  r.shoe.forEach((s) => { s.rotation.order = 'YXZ'; });

  // The frame builder: Y along the bone, Z toward ref (fallback ref2 when Y and ref line up), X = Y x Z.
  const va = V(), vb = V(), vc = V(), vd = V(), ve = V();
  const mx = new THREE.Matrix4();
  const setBone = (i, pos, yAxis, ref, ref2 = UP, sc = null) => {
    const y = va.copy(yAxis).normalize();
    const blend = clamp((Math.abs(y.dot(vb.copy(ref).normalize())) - 0.55) / 0.4);
    const rr = vc.copy(ref).normalize().multiplyScalar(1 - blend).addScaledVector(ref2, blend * Math.sign(ref2.dot(ref) || 1));
    const z = vd.copy(rr).addScaledVector(y, -rr.dot(y)); if (z.lengthSq() < 1e-8) z.set(0, 0, 1).addScaledVector(y, -y.z); z.normalize();
    const x = ve.crossVectors(y, z).normalize();
    mx.makeBasis(x, y, z);
    const b = bones[i];
    b.quaternion.setFromRotationMatrix(mx);
    b.position.copy(pos);
    if (sc) b.scale.copy(sc); else b.scale.set(1, 1, 1);
  };
  const ik = (a, b, l1, l2, pole, out) => {
    const dv = vc.subVectors(b, a); const d = Math.max(0.001, Math.min(dv.length(), l1 + l2 - 0.001)); dv.normalize();
    const along = (l1 * l1 - l2 * l2 + d * d) / (2 * d), off = Math.sqrt(Math.max(0, l1 * l1 - along * along));
    const n = vb.copy(pole).addScaledVector(dv, -pole.dot(dv)); if (n.lengthSq() < 1e-8) n.set(0, 0, 1); n.normalize();
    return out.copy(a).addScaledVector(dv, along).addScaledVector(n, off);
  };
  const F = V(), S = V(), F2 = V(), S2 = V(), Dn = V(), top = V(), hipI = V(), jnt = V(), wr = V(), pole = V(), seg2 = V(), mid = V(), tmp = V(), sc = V(), hu = V();
  const anks = [V(), V()], gy = [0, 0];
  r.F = F; r.S = S; r.F2 = F2; r.S2 = S2; r.top = top; r.Dn = Dn;
  r.shoulder = [V(), V()];
  r.wrist = [V(), V()];
  r.headPos = V();
  r.lookD = V(0, 0, 1); r.look = r.lookD;

  // hip: world pelvis centre; yaw: facing; lean: forward lean of the spine; tilt: sideways lean; feet(i, out):
  // ankle target (may return the ground height under that foot); hands(i, shoulder, out): wrist target;
  // look: world point the head turns toward; nod: extra head dip; kneePole: where the knees point;
  // chestScale: wider or narrower chest; twist: how far the shoulders turn past the hips; t: time, for
  // breath, blinks, drift and weight shift.
  r.pose = ({ hip, yaw, lean = 0, tilt = 0, feet, hands: handsAt, look, nod = 0, kneePole, chestScale = 1, twist = 0, t }) => {
    const live = typeof t === 'number', seed = r.seed;
    F.set(Math.sin(yaw), 0, Math.cos(yaw)); S.set(Math.cos(yaw), 0, -Math.sin(yaw));
    F2.set(Math.sin(yaw + twist), 0, Math.cos(yaw + twist)); S2.set(Math.cos(yaw + twist), 0, -Math.sin(yaw + twist));
    // Legs first, so the hips can settle toward the planted foot.
    for (let i = 0; i < 2; i++) { const g = feet(i, anks[i]); gy[i] = typeof g === 'number' ? g : 0; }
    const shift = live ? clamp((anks[0].y - gy[0] - anks[1].y + gy[1]) * 1.6, -0.1, 0.1) : 0;   // + : left foot higher
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      hipI.copy(hip).addScaledVector(S, sg * 0.1); hipI.y += sg * shift * 0.06;
      pole.copy(kneePole || F).addScaledVector(S, sg * 0.08);
      r.stretch = Math.max(r.stretch, hipI.distanceTo(anks[i]) - (LT + LS));
      ik(hipI, anks[i], LT, LS, pole, jnt);
      setBone(B.th[i], mid.addVectors(hipI, jnt).multiplyScalar(0.5), seg2.subVectors(jnt, hipI), F, UP);
      setBone(B.sh[i], mid.addVectors(jnt, anks[i]).multiplyScalar(0.5), seg2.subVectors(anks[i], jnt), F, UP);
      const shoe = r.shoe[i];
      shoe.position.copy(anks[i]).addScaledVector(F, 0.05); shoe.position.y = Math.max(gy[i] + 0.038, anks[i].y - 0.045);
      shoe.rotation.set(0, yaw, 0); shoe.scale.set(1, 1, 1);
    }
    // Pelvis: upright, facing forward, rolled slightly by the weight shift.
    tmp.copy(UP).addScaledVector(S, shift * 0.7).normalize();
    setBone(B.pelvis, hip, tmp, F, UP);
    // Spine: lean from the hip, counter-rolled against the pelvis so the shoulders stay level.
    Dn.copy(F).multiplyScalar(lean).addScaledVector(S, tilt).add(UP).addScaledVector(S, -shift * 0.35).normalize();
    top.copy(hip).addScaledVector(Dn, 0.5);
    const br = live ? Math.sin((t / 3.7 + rnd(1, seed)) * Math.PI * 2) : 0;   // breath, about 16 a minute
    top.addScaledVector(Dn, br * 0.004);
    sc.set((1 + br * 0.012) * chestScale, 1, (1 + br * 0.022) * chestScale);
    setBone(B.chest, mid.copy(hip).addScaledVector(Dn, 0.3), Dn, F2, UP, sc);
    for (const e of r.extra) e(hip, top, F, S, Dn);
    // Head and neck, plus a slow, small drift so a held look never freezes.
    r.headPos.copy(top).addScaledVector(Dn, 0.16).addScaledVector(F2, 0.015);
    const lk = r.lookD.subVectors(look, r.headPos); const hz = Math.hypot(lk.x, lk.z);
    lk.y = clamp(lk.y / Math.max(0.01, hz), -0.9, 0.55) * hz; lk.normalize();
    if (live) { lk.x += Math.sin(t * 0.9 + seed) * 0.025; lk.z += Math.cos(t * 0.7 + seed * 2) * 0.02; lk.y += Math.sin(t * 1.1 + seed * 3) * 0.018; lk.normalize(); }
    lk.y -= nod; lk.normalize();
    setBone(B.neck, mid.addVectors(top, r.headPos).multiplyScalar(0.5), seg2.subVectors(r.headPos, top), F2, UP);
    r.headPos.addScaledVector(lk, 0.012);
    // A head tips forward on the neck when it looks down, which keeps the chin clear of the collar.
    const down = clamp(-lk.y / 0.6), hl = Math.hypot(lk.x, lk.z) || 1;
    r.headPos.x += (lk.x / hl) * 0.045 * down; r.headPos.z += (lk.z / hl) * 0.045 * down; r.headPos.y += 0.008 * down;
    hu.copy(UP).addScaledVector(lk, -lk.dot(UP)).normalize();
    setBone(B.head, r.headPos, hu, lk, UP);
    // Eyes: a blink every 3 to 4.5 seconds, each person on their own beat.
    const hb = bones[B.head];
    let bl = 1;
    if (live) { const per = 3.1 + rnd(2, seed) * 1.4, ph = (((t + rnd(3, seed) * per) % per) + per) % per / per; bl = ph < 0.035 ? 0.12 : 1; }
    for (let i = 0; i < 2; i++) {
      const eb = bones[B.eye[i]];
      eb.position.set(i ? EX : -EX, EY, EZ).applyQuaternion(hb.quaternion).add(r.headPos);
      eb.quaternion.copy(hb.quaternion); eb.scale.set(1, bl, 1);
    }
    // Arms: the shoulders shrug a touch as the hands rise above them.
    for (let i = 0; i < 2; i++) {
      const sg = i ? 1 : -1;
      const sh = r.shoulder[i].copy(top).addScaledVector(Dn, -0.04).addScaledVector(S2, sg * 0.19);
      handsAt(i, sh, wr); r.wrist[i].copy(wr);
      const lift = clamp((wr.y - sh.y + 0.05) / 0.35);
      sh.addScaledVector(Dn, lift * 0.025).addScaledVector(S2, -sg * lift * 0.012);
      pole.copy(UP).multiplyScalar(-1).addScaledVector(S2, sg * 0.7).addScaledVector(F2, -0.35);
      r.reach = Math.max(r.reach, sh.distanceTo(wr) - (LU + LF));
      ik(sh, wr, LU, LF, pole, jnt);
      setBone(B.ua[i], mid.addVectors(sh, jnt).multiplyScalar(0.5), seg2.subVectors(jnt, sh), F2, UP);
      setBone(B.fa[i], mid.addVectors(jnt, wr).multiplyScalar(0.5), seg2.subVectors(wr, jnt), F2, UP);
      const dir = seg2.subVectors(wr, jnt).normalize();
      setBone(B.hand[i], tmp.copy(wr).addScaledVector(dir, 0.035), dir, F2, UP);
    }
  };
  // A standing rest pose: the body is modelled around it.
  r.rest = () => r.pose({
    hip: V(0, 0.93, 0), yaw: 0, lean: 0.02, look: V(0, 1.6, 3),
    feet: (i, out) => out.set(i ? 0.11 : -0.11, 0.1, 0),
    hands: (i, sh, out) => out.set(i ? 0.3 : -0.3, 0.98, 0.04),
  });
  return r;
}

// ---------------------------------------------------------------- the body
// Every piece of the body in its bone's own space. key names the material slot; bones lists the bones that
// carry it (left and right for limbs); geo(k) builds the piece for bones[k]; mirror says the left and right
// pieces differ; blend = [otherBone, localY -> weight] softens the joint into a neighbour on a skinned body.
function bodyParts(o = {}) {
  const c = o.chestR ?? 0.15, d = c * 0.82, ss = o.shoeScale || 1;
  const hp = headParts(o), ep = eyeParts();
  return [
    { key: 'pants', bones: [B.pelvis], geo: () => loft([
      ...dome(-0.1, 0.13, 0.09, 0.05, -1, 4, 0.0),
      [-0.1, 0.13, 0.09, 0], [-0.05, 0.168, 0.105, -0.005], [0.02, 0.172, 0.108, -0.006], [0.07, 0.156, 0.098, 0], [0.1, 0.146, 0.092, 0.002],
      ...dome(0.1, 0.146, 0.092, 0.03, 1, 3, 0.002),
    ], 36) },
    // Chest and waist, with the shirt's hem falling over the waistband.
    { key: 'top', bones: [B.chest], blend: [B.pelvis, (y) => (y < -0.1 ? ((-0.1 - y) / 0.12) * 0.8 : 0)], geo: () => loft([
      ...dome(-0.21, 0.162, 0.106, 0.035, -1, 3, 0.004),
      [-0.21, 0.162, 0.106, 0.004], [-0.17, 0.158, Math.max(0.1, d * 0.8), 0.006], [-0.12, 0.148, d * 0.78, 0.008], [-0.02, 0.158, d * 0.86, 0.01],
      [0.07, 0.172, d * 0.94, 0.014], [0.13, 0.184, d * 0.92, 0.01], [0.175, 0.186, d * 0.8, 0.0], [0.21, 0.15, d * 0.62, -0.006],
      [0.236, 0.09, 0.07, -0.004], ...dome(0.236, 0.09, 0.07, 0.03, 1, 3, -0.004),
    ], 40) },
    // A ribbed collar round the neck.
    { key: 'top', bones: [B.chest], geo: () => at(new THREE.TorusGeometry(0.062, 0.012, 10, 36).scale(1, 0.86, 1), 0, 0.232, 0.002, Math.PI / 2 - 0.12) },
    // Deltoids: rounded caps where the arms meet the chest.
    { key: 'sleeve', bones: [B.chest], geo: () => mergeGeometries([-1, 1].map((sg) => prep(at(ball(0.056, 0.95, 0.95, 1.05, 16, 12), sg * 0.176, 0.152, -0.002)))) },
    { key: 'skin', bones: [B.neck], blend: [B.chest, (y) => (y < -0.03 ? (-0.03 - y) / 0.06 * 0.6 : 0)], geo: () => limb([[-0.07, 0.05, 0.046, -0.004], [0.0, 0.043, 0.042], [0.06, 0.044, 0.044, 0.004]], 14) },
    { key: 'skin', bones: [B.head], geo: () => mergeGeometries(hp.skin.map(prep)) },
    { key: 'eye', bones: [B.head], geo: () => mergeGeometries(hp.mouth.map(prep)) },   // the line between the lips shares the pupils' material
    { key: 'lips', bones: [B.head], geo: () => mergeGeometries(hp.lips.map(prep)) },
    { key: 'hair', bones: [B.head], geo: () => mergeGeometries(hp.hair.map(prep)) },
    { key: 'bun', bones: [B.head], geo: () => at(ball(0.05, 1, 0.9, 1, 28, 20), 0, 0.056, -0.094) },
    // Eyes sit on their own small bones so they can blink.
    { key: 'eyeW', bones: B.eye, geo: () => ep.white.clone() },
    { key: 'iris', bones: B.eye, geo: () => ep.iris.clone() },
    { key: 'eye', bones: B.eye, geo: () => ep.pupil.clone() },
    { key: 'skin', bones: B.eye, geo: () => ep.lids.clone() },
    { key: 'sleeve', bones: B.ua, geo: () => limb([[-0.14, 0.054, 0.056], [-0.09, 0.057, 0.06], [-0.03, 0.055, 0.06, 0.004], [0.04, 0.05, 0.054, 0.003], [0.1, 0.044, 0.046], [0.13, 0.042, 0.044]]) },
    { key: 'fore', bones: B.fa, blend: [B.ua, (y) => (y < -0.075 ? clamp((-0.075 - y) / 0.065) * 0.58 : 0)], geo: () => limb([[-0.13, 0.041, 0.042], [-0.09, 0.045, 0.044], [-0.04, 0.044, 0.041], [0.03, 0.036, 0.033], [0.09, 0.03, 0.026], [0.125, 0.028, 0.024]]) },
    // The palm faces the body: -X on the left hand, +X on the right.
    { key: 'hand', bones: B.hand, mirror: true, blend: [B.fa, (y) => (y < -0.028 ? clamp((-0.028 - y) / 0.02) * 0.4 : 0)], geo: (k) => handGeometry(k ? 1 : -1) },
    { key: 'pants', bones: B.th, blend: [B.pelvis, (y) => (y < -0.14 ? (-0.14 - y) / 0.1 * 0.5 : 0)], geo: () => limb([[-0.2, 0.078, 0.08], [-0.14, 0.079, 0.081, 0.004], [-0.06, 0.074, 0.076, 0.006], [0.04, 0.066, 0.067, 0.004], [0.13, 0.056, 0.057], [0.2, 0.051, 0.054, 0.006]]) },
    { key: 'pants', bones: B.sh, blend: [B.th, (y) => (y < -0.12 ? clamp((-0.12 - y) / 0.09) * 0.6 : 0)], geo: () => mergeGeometries([
      limb([[-0.2, 0.05, 0.053], [-0.14, 0.054, 0.059, -0.008], [-0.07, 0.053, 0.058, -0.01], [0.02, 0.045, 0.047, -0.004], [0.11, 0.039, 0.039], [0.17, 0.04, 0.04], [0.195, 0.043, 0.043]]),
      // A turned-up hem where the trousers break on the shoe.
      at(new THREE.TorusGeometry(0.041, 0.0065, 8, 30), 0, 0.188, 0, Math.PI / 2),
    ].map(prep)) },
    // Shoe (x across, y up, z toward the toe): sole, upper and a rounded toe.
    { key: 'shoe', bones: B.shoe, geo: () => {
      const g = mergeGeometries([
        at(new RoundedBoxGeometry(0.092, 0.07, 0.17, 5, 0.028), 0, 0.008, -0.038),
        at(ball(0.05, 0.94, 0.62, 1.28, 28, 16), 0, -0.004, 0.07),
        at(ball(0.03, 1.4, 0.55, 1.2, 20, 12), 0, 0.03, 0.02),      // tongue and laces
      ].map(prep));
      return ss !== 1 ? g.scale(ss, ss, ss) : g;
    } },
    // The sole: a lighter, wider cupsole with a rounded edge.
    { key: 'sole', bones: B.shoe, geo: () => {
      const g = at(new RoundedBoxGeometry(0.106, 0.026, 0.276, 4, 0.011), 0, -0.026, 0.004);
      return ss !== 1 ? g.scale(ss, ss, ss) : g;
    } },
  ];
}

// A stylized person. Options: skin, top, sleeve, fore, pants, shoeM, hairM (materials), hairCap (how far
// the hair comes down, 0.45 to 0.6), chestR (chest depth, about 0.14 to 0.16), bun, handM (gloves),
// shoeScale, seed. Returns { pose, extra, headPos, look, lookD, top, Dn, shoulder, wrist, hand, shoe,
// setVisible, body }.
// Skin reads as skin, not plastic: a soft, slightly oily surface with a warm sheen at grazing angles,
// standing in for light scattering under it. One per scene material, so shared skins stay shared.
const skinCache = new WeakMap();
function realSkin(m) {
  if (!m || m.isMeshPhysicalMaterial || !m.isMeshStandardMaterial) return m;
  if (!skinCache.has(m)) {
    const p = new THREE.MeshPhysicalMaterial({ color: m.color.clone(), map: m.map, roughness: 0.5, metalness: 0, sheen: 0.4, sheenRoughness: 0.55,
      sheenColor: new THREE.Color(0xffb89c), clearcoat: 0.06, clearcoatRoughness: 0.5, transparent: m.transparent, opacity: m.opacity, side: m.side });
    p.color = m.color;   // keep following the scene's skin colour if it animates it
    skinCache.set(m, p);
  }
  return skinCache.get(m);
}
export function makePerson(scene, o) {
  const r = createRig(o);
  const p = r;
  p.meshes = [];
  const root = new THREE.Group(); scene.add(root);
  r.bones.forEach((b) => root.add(b));
  r.rest(); root.updateMatrixWorld(true);
  const restM = r.bones.map((b) => b.matrixWorld.clone());
  const skinM = realSkin(o.skin);
  const matOf = { pants: o.pants, top: o.top, sleeve: o.sleeve, fore: o.fore, skin: skinM, hair: o.hairM, bun: o.hairM, eye: EYE, eyeW: EYEW, iris: IRIS, lips: LIPS, mouth: MOUTH, sole: o.soleM || SOLE, hand: o.handM && o.handM !== o.skin ? o.handM : skinM, shoe: o.shoeM };
  for (const k of ['sleeve', 'fore']) if (o[k] === o.skin) matOf[k] = skinM;

  const groups = new Map();   // material -> [geometry]
  for (const part of bodyParts(o)) {
    if (part.key === 'bun' && !o.bun) continue;
    part.bones.forEach((bi, k) => {
      const g = prep(part.geo(k));
      const n = g.attributes.position.count, ys = g.attributes.position.array;
      const si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
      for (let v = 0; v < n; v++) {
        const w2 = part.blend ? clamp(part.blend[1](ys[v * 3 + 1])) : 0;
        si[v * 4] = bi; sw[v * 4] = 1 - w2;
        si[v * 4 + 1] = part.blend ? (Array.isArray(part.blend[0]) ? part.blend[0][k] : part.blend[0]) : 0; sw[v * 4 + 1] = w2;
      }
      g.applyMatrix4(restM[bi]);
      g.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(si, 4));
      g.setAttribute('skinWeight', new THREE.Float32BufferAttribute(sw, 4));
      const m = matOf[part.key];
      if (!groups.has(m)) groups.set(m, []);
      groups.get(m).push(g);
    });
  }
  const mats = [...groups.keys()];
  const geo = mergeGeometries(mats.map((m) => mergeGeometries(groups.get(m))), true);
  const body = new THREE.SkinnedMesh(geo, mats);
  body.castShadow = body.receiveShadow = true;
  body.frustumCulled = false;
  root.add(body);
  body.bind(new THREE.Skeleton(r.bones), new THREE.Matrix4());
  p.body = body;
  p.meshes.push(body);
  p.setVisible = (v) => { body.visible = v; p.meshes.forEach((m) => { m.visible = v; }); };
  return p;
}

// A crowd of the same people, instanced: each body piece is one InstancedMesh shared by every person, so a
// whole crowd costs about fifteen draw calls. list: [{ skin, top, sleeve, fore, pants, shoe, hair, chest,
// bun }] as hex colors. pose(i, { hip, yaw, lean, tilt, feet, hands, look, nod, kneePole, sc, root, t }):
// sc scales a whole person about root (their floor point by default) for pop-ins. Fills head[i], chest[i]
// and hand[i][side] in world space. Call commit() once per frame after posing.
export function makeCrowd(scene, list) {
  const N = list.length;
  const skinM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.5, sheen: 0.4, sheenRoughness: 0.55, sheenColor: new THREE.Color(0xffb89c), clearcoat: 0.06, clearcoatRoughness: 0.5 });
  const clothM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86 });
  const shoeM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const col = new THREE.Color();
  const colorOf = {
    pants: (p) => p.pants, top: (p) => p.top, sleeve: (p) => p.sleeve ?? p.top, fore: (p) => p.fore ?? p.sleeve ?? p.top,
    skin: (p) => p.skin, hand: (p) => p.skin, hair: (p) => p.hair, bun: (p) => p.hair, shoe: (p) => p.shoe,
  };
  const matOf = { skin: skinM, hand: skinM, shoe: shoeM, eye: EYE, eyeW: EYEW, iris: IRIS, lips: LIPS, mouth: MOUTH, sole: SOLE };
  const rigs = list.map((p, i) => createRig({ seed: i * 7.31 + 1.7 }));
  // The pieces are modelled once, for an average build; each person's chest width is set per pose.
  const parts = [];
  for (const part of bodyParts({ chestR: 0.15, hairCap: 0.54 })) {
    const sets = part.mirror ? part.bones.map((b) => [b]) : [part.bones];
    sets.forEach((bones, k) => {
      const per = bones.length;
      const im = new THREE.InstancedMesh(prep(part.geo(k)), matOf[part.key] || clothM, N * per);
      im.castShadow = im.receiveShadow = true; im.frustumCulled = false;
      if (colorOf[part.key]) for (let i = 0; i < N; i++) for (let j = 0; j < per; j++) im.setColorAt(i * per + j, col.set(colorOf[part.key](list[i])));
      scene.add(im);
      parts.push({ im, bones, per, bun: part.key === 'bun' });
    });
  }
  const m4 = new THREE.Matrix4(), mxf = new THREE.Matrix4(), ms = new THREE.Matrix4(), zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const R = V(), tmp = V();
  const out = {
    N, parts, stretch: 0, reach: 0,
    head: list.map(() => V()), chest: list.map(() => V()),
    hand: list.map(() => [V(), V()]), shoulder: [V(), V()],
  };
  const hide = (i) => parts.forEach(({ im, per }) => { for (let j = 0; j < per; j++) im.setMatrixAt(i * per + j, zero); });
  out.pose = (i, { sc = 1, root = null, ...args }) => {
    const r = rigs[i];
    if (sc <= 0.002) { hide(i); out.head[i].copy(args.hip); out.chest[i].copy(args.hip); out.hand[i][0].copy(args.hip); out.hand[i][1].copy(args.hip); return; }
    const p = list[i];
    r.pose({ ...args, chestScale: (p.chest || 0.145) / 0.145 });
    out.stretch = Math.max(out.stretch, r.stretch); out.reach = Math.max(out.reach, r.reach);
    if (root) R.copy(root); else R.set(args.hip.x, 0, args.hip.z);
    // Scale about the root: T(R) S(sc) T(-R).
    mxf.makeTranslation(-R.x, -R.y, -R.z).premultiply(ms.makeScale(sc, sc, sc)).premultiply(m4.makeTranslation(R.x, R.y, R.z));
    for (const { im, bones, per, bun } of parts) {
      for (let j = 0; j < per; j++) {
        if (bun && !p.bun) { im.setMatrixAt(i * per + j, zero); continue; }
        const b = r.bones[bones[j]];
        b.updateMatrix();
        im.setMatrixAt(i * per + j, m4.multiplyMatrices(mxf, b.matrix));
      }
    }
    const xf = (v, o2) => o2.copy(v).applyMatrix4(mxf);
    xf(r.headPos, out.head[i]);
    xf(tmp.copy(r.top).addScaledVector(r.Dn, -0.12).addScaledVector(r.F, 0.14), out.chest[i]);
    for (let s = 0; s < 2; s++) { xf(r.hand[s].position, out.hand[i][s]); out.shoulder[s].copy(r.shoulder[s]); }
  };
  out.commit = () => { parts.forEach(({ im }) => { im.instanceMatrix.needsUpdate = true; }); };
  return out;
}
