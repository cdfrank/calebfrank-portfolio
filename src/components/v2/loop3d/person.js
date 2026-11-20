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
const EYEW = new THREE.MeshStandardMaterial({ color: 0xf2eee6, roughness: 0.3, metalness: 0 });
const MOUTH = new THREE.MeshStandardMaterial({ color: 0x6e3a33, roughness: 0.55, metalness: 0 });
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

// One sphere shaped into a head: full at the cranium, narrowing through the cheeks to a chin set a touch forward.
function skull() {
  const g = new THREE.SphereGeometry(0.1, 48, 34), a = g.attributes.position;
  for (let i = 0; i < a.count; i++) {
    let x = a.getX(i) * 0.9, y = a.getY(i), z = a.getZ(i) * 0.98;
    if (y < 0) { const u = -y / 0.1; x *= 1 - 0.3 * u * u; z = z * (1 - 0.14 * u * u) + 0.014 * u; y *= 1 + 0.12 * u; } else y *= 1.04;
    a.setXYZ(i, x, y + 0.008, z - 0.004);
  }
  g.computeVertexNormals();
  return g;
}
// Head pieces in head space: +Z is where the face looks, +Y up.
function headParts(o) {
  const skin = [
    skull(),                                                           // cranium narrowing to the jaw and chin
    at(ball(0.016, 0.8, 1.15, 1.25, 18, 12), 0, -0.008, 0.094),        // nose
    at(ball(0.0075, 1, 0.8, 0.8, 12, 8), -0.009, -0.021, 0.094),        // nostrils' wings
    at(ball(0.0075, 1, 0.8, 0.8, 12, 8), 0.009, -0.021, 0.094),
    at(ball(0.022, 0.42, 1, 0.74, 18, 12), -0.088, -0.004, -0.006),     // ears
    at(ball(0.022, 0.42, 1, 0.74, 18, 12), 0.088, -0.004, -0.006),
    at(ball(0.012, 1.5, 0.7, 0.75, 16, 10), -0.034, 0.03, 0.084),       // brow ridge
    at(ball(0.012, 1.5, 0.7, 0.75, 16, 10), 0.034, 0.03, 0.084),
  ];
  // A soft closed mouth: a shallow curve of lip colour under the nose.
  const mouth = [at(new THREE.CapsuleGeometry(0.0034, 0.02, 4, 10), 0, -0.047, 0.084, 0, 0, Math.PI / 2)];
  // hairCap sets how far the hair falls at the back and sides; the front hairline stays above the brows.
  const cap = o.hairCap ?? 0.52, tilt = Math.max(0.3, Math.PI * cap - 1.1);
  const hairG = new THREE.SphereGeometry(0.106, 48, 24, 0, Math.PI * 2, 0, Math.PI * cap);
  hairG.scale(0.93, 1.05, 1.01); hairG.rotateX(-tilt); hairG.translate(0, 0.022, -0.016);
  // A little volume: soft lumps over the crown so the hair isn't a plain shell.
  const ha = hairG.attributes.position;
  for (let i = 0; i < ha.count; i++) {
    const x = ha.getX(i), y = ha.getY(i), z = ha.getZ(i), l = Math.hypot(x, y - 0.022, z + 0.016) || 1;
    const bump = 1 + 0.035 * Math.max(0, Math.sin(x * 140 + z * 60) * Math.sin(y * 90 + x * 30)) * clamp((y - 0.0) / 0.08);
    ha.setXYZ(i, x * bump, 0.022 + (y - 0.022) * bump, -0.016 + (z + 0.016) * bump);
  }
  hairG.computeVertexNormals();
  const hair = [hairG,
    at(new THREE.BoxGeometry(0.036, 0.0075, 0.012), -0.034, 0.042, 0.087, 0, 0, 0.12),   // brows
    at(new THREE.BoxGeometry(0.036, 0.0075, 0.012), 0.034, 0.042, 0.087, 0, 0, -0.12)];
  // A swept fringe at the front for short hair; a beanie-length cap keeps a clean edge.
  if (cap < 0.58) hair.push(at(ball(0.046, 1.3, 0.32, 0.62, 28, 14), 0.014, 0.07, 0.056, -0.7, 0, -0.2));
  return { skin, hair, mouth };
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
      eb.position.set(i ? 0.034 : -0.034, 0.016, 0.083).applyQuaternion(hb.quaternion).add(r.headPos);
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
  const hp = headParts(o);
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
    { key: 'mouth', bones: [B.head], geo: () => mergeGeometries(hp.mouth.map(prep)) },
    { key: 'hair', bones: [B.head], geo: () => mergeGeometries(hp.hair.map(prep)) },
    { key: 'bun', bones: [B.head], geo: () => at(ball(0.056, 1, 0.92, 1, 16, 12), 0, 0.05, -0.098) },
    // Eyes sit on their own small bones so they can blink.
    { key: 'eyeW', bones: B.eye, geo: () => ball(0.0132, 1, 0.98, 0.56, 20, 14) },
    { key: 'eye', bones: B.eye, geo: () => at(ball(0.0072, 1, 1.08, 0.5, 16, 12), 0, -0.0006, 0.0052) },
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
export function makePerson(scene, o) {
  const r = createRig(o);
  const p = r;
  p.meshes = [];
  const root = new THREE.Group(); scene.add(root);
  r.bones.forEach((b) => root.add(b));
  r.rest(); root.updateMatrixWorld(true);
  const restM = r.bones.map((b) => b.matrixWorld.clone());
  const matOf = { pants: o.pants, top: o.top, sleeve: o.sleeve, fore: o.fore, skin: o.skin, hair: o.hairM, bun: o.hairM, eye: EYE, eyeW: EYEW, mouth: MOUTH, sole: o.soleM || SOLE, hand: o.handM || o.skin, shoe: o.shoeM };

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
  const skinM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const clothM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.86 });
  const shoeM = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5 });
  const col = new THREE.Color();
  const colorOf = {
    pants: (p) => p.pants, top: (p) => p.top, sleeve: (p) => p.sleeve ?? p.top, fore: (p) => p.fore ?? p.sleeve ?? p.top,
    skin: (p) => p.skin, hand: (p) => p.skin, hair: (p) => p.hair, bun: (p) => p.hair, shoe: (p) => p.shoe,
  };
  const matOf = { skin: skinM, hand: skinM, shoe: shoeM, eye: EYE, eyeW: EYEW, mouth: MOUTH, sole: SOLE };
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
