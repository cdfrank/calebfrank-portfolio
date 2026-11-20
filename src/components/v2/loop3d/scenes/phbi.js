// Professional Home Builders Institute learning site unification lit loop, 10 s. "Four sites, one build."
// A job site at dusk: a cool blue sky over a row of finished houses, a sodium work light on a tripod,
// compacted dirt and a fresh slab. Four small standalone sites stand on the lot, each its own shape, colour
// and layout. They slide together onto the slab and merge in a puff of dust, and one timber frame rises in
// their place: ONE SITE. Five template jigs pop up on the sawhorse bench (5 TEMPLATES), and a builder in a
// hard hat works down the bench with a mallet: each tap launches that template's pages, which arc over the
// builder's head and slot into the frame's facade while the PAGES counter climbs to 16. With the last page
// in, the facade lights up, the builder rests the mallet on a shoulder and looks up at it; the title settles.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, label, roundRect, std, mesh, dip, skyDome,
} from '../kit.js';
import { makePerson } from '../person.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const SAFETY = '#ffb21a', SAFETY_H = 0xffb21a;
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const Y = V(0, 1, 0);

// ------------------------------------------------------------- timeline and layout
const MERGE = [0.85, 1.9];                         // the four sites slide together
const POOF = 1.95;                                  // they merge; the frame starts to rise
const T_TPL = [2.95, 3.45];                         // templates pop up on the bench
const STRIKE = [3.8, 4.45, 5.1, 5.75, 6.4];         // mallet hits on each template
const PER = [4, 3, 3, 3, 3];                         // pages per template: 16 in all
const FLY = 0.72;
const DONE = 7.35;                                  // the facade is complete
const FZ = -0.72;                                   // facade plane
const SLOT_W = 0.36, SLOT_H = 0.29;
const slotX = (c) => -1.2 + c * 0.4, slotY = (r) => 1.32 - r * 0.33;
const BENCH_Z = 0.32, BENCH_TOP = 0.8;
const JIG_X = (j) => 0.38 + j * 0.245;
const TPL_COL = ['#f2b134', '#2fa3a3', '#e0663a', '#4a7fd1', '#8bb04a'];
// Page n: which template, when it launches, and which facade slot it fills (in reading order).
const PAGES = [];
STRIKE.forEach((t0, j) => { for (let m = 0; m < PER[j]; m++) PAGES.push({ j, at: t0 + 0.05 + m * 0.075 }); });
PAGES.forEach((p, n) => { p.slot = n; p.land = p.at + FLY; });

const fwdOf = (yaw, out = new THREE.Vector3()) => out.set(Math.sin(yaw), 0, Math.cos(yaw));
const sideOf = (yaw, out = new THREE.Vector3()) => out.set(Math.cos(yaw), 0, -Math.sin(yaw));

// People come from the shared rig in ../person.js.

// The five page layouts the site was rebuilt from. Shapes only: header, hero, columns, cards, fields.
function drawTemplate(c, w, h, j) {
  const col = TPL_COL[j];
  c.fillStyle = '#f1ece2'; c.fillRect(0, 0, w, h);
  c.fillStyle = col; c.fillRect(0, 0, w, h * 0.12);
  c.fillStyle = 'rgba(255,255,255,0.85)'; roundRect(c, w * 0.05, h * 0.035, w * 0.18, h * 0.05, 5); c.fill();
  const g = '#9a9286', d = '#4a443c';
  if (j === 0) { // home: hero band, three features
    c.fillStyle = col; c.globalAlpha = 0.55; c.fillRect(0, h * 0.12, w, h * 0.36); c.globalAlpha = 1;
    c.fillStyle = d; roundRect(c, w * 0.08, h * 0.22, w * 0.5, h * 0.06, 6); c.fill();
    c.fillStyle = col; roundRect(c, w * 0.08, h * 0.34, w * 0.22, h * 0.07, 10); c.fill();
    for (let i = 0; i < 3; i++) { c.fillStyle = g; roundRect(c, w * (0.06 + i * 0.31), h * 0.56, w * 0.26, h * 0.34, 8); c.fill(); }
  } else if (j === 1) { // article: title, text, side image
    c.fillStyle = d; roundRect(c, w * 0.08, h * 0.2, w * 0.6, h * 0.07, 6); c.fill();
    for (let i = 0; i < 6; i++) { c.fillStyle = g; roundRect(c, w * 0.08, h * (0.36 + i * 0.09), w * (0.5 - (i % 3) * 0.06), h * 0.035, 4); c.fill(); }
    c.fillStyle = col; c.globalAlpha = 0.6; roundRect(c, w * 0.66, h * 0.36, w * 0.28, h * 0.5, 8); c.fill(); c.globalAlpha = 1;
  } else if (j === 2) { // course list: a grid of cards
    for (let r = 0; r < 2; r++) for (let i = 0; i < 3; i++) {
      c.fillStyle = '#ffffff'; roundRect(c, w * (0.05 + i * 0.31), h * (0.2 + r * 0.38), w * 0.28, h * 0.33, 8); c.fill();
      c.fillStyle = col; c.globalAlpha = 0.6; roundRect(c, w * (0.05 + i * 0.31), h * (0.2 + r * 0.38), w * 0.28, h * 0.15, 8); c.fill(); c.globalAlpha = 1;
      c.fillStyle = g; roundRect(c, w * (0.08 + i * 0.31), h * (0.39 + r * 0.38), w * 0.18, h * 0.04, 4); c.fill();
    }
  } else if (j === 3) { // landing: image left, text right
    c.fillStyle = col; c.globalAlpha = 0.6; roundRect(c, w * 0.05, h * 0.2, w * 0.44, h * 0.68, 10); c.fill(); c.globalAlpha = 1;
    c.fillStyle = d; roundRect(c, w * 0.55, h * 0.24, w * 0.36, h * 0.07, 6); c.fill();
    for (let i = 0; i < 4; i++) { c.fillStyle = g; roundRect(c, w * 0.55, h * (0.38 + i * 0.08), w * 0.36, h * 0.035, 4); c.fill(); }
    c.fillStyle = col; roundRect(c, w * 0.55, h * 0.74, w * 0.2, h * 0.08, 10); c.fill();
  } else { // form: stacked fields and a button
    c.fillStyle = d; roundRect(c, w * 0.08, h * 0.2, w * 0.4, h * 0.06, 6); c.fill();
    for (let i = 0; i < 3; i++) { c.strokeStyle = g; c.lineWidth = 4; roundRect(c, w * 0.08, h * (0.33 + i * 0.15), w * 0.84, h * 0.1, 6); c.stroke(); }
    c.fillStyle = col; roundRect(c, w * 0.08, h * 0.8, w * 0.3, h * 0.1, 10); c.fill();
  }
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0e1830);
  scene.fog = new THREE.Fog(0x17223a, 5, 16);
  scene.environment = env;
  scene.environmentIntensity = 0.32;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 60);
  scene.add(camera);
  const setDip = dip(camera);
  const m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), p4 = new THREE.Vector3(), s4 = new THREE.Vector3(), e4 = new THREE.Euler();

  // ----------------------------------------------------------- the lot at dusk
  // Dusk: navy overhead, a band of amber right at the horizon behind the street, fog colour below it.
  scene.add(skyDome([[0, '#0b1530'], [0.3, '#1d3260'], [0.44, '#4a4f74'], [0.485, '#c9784a'], [0.5, '#2c2a3a'], [0.52, '#17223a'], [1, '#17223a']], 30));
  const ground = mesh(new THREE.PlaneGeometry(30, 30), std(0xffffff, { map: grainTex('#5a4a3a', { size: 256, speck: 0.22, blot: 0.14, seed: 61, repeat: 12 }), roughness: 0.95 }), { cast: false });
  ground.rotation.x = -Math.PI / 2; scene.add(ground);
  const slab = mesh(new THREE.BoxGeometry(1.86, 0.06, 0.8), std(0xffffff, { map: grainTex('#8d8a84', { size: 128, speck: 0.12, blot: 0.1, seed: 62, repeat: 2 }), roughness: 0.8 }));
  slab.position.set(-0.6, 0.03, -1.0); scene.add(slab);
  // A street of finished houses on the horizon, lit windows and all.
  const HN = 9;
  const houseI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), std(0x1b2234, { roughness: 0.9 }), HN);
  const roofG = new THREE.CylinderGeometry(0.62, 0.62, 1, 3); roofG.rotateZ(Math.PI / 2); roofG.rotateX(Math.PI / 2); roofG.rotateY(Math.PI / 2);
  const roofI = new THREE.InstancedMesh(roofG, std(0x141a28, { roughness: 0.9 }), HN);
  const winGlows = [];
  for (let i = 0; i < HN; i++) {
    const x = -6.5 + i * 1.7 + (rnd(i, 3) - 0.5) * 0.4, z = -6.5 - rnd(i, 4) * 0.8, w = 1.1 + rnd(i, 5) * 0.4, h = 0.8 + rnd(i, 6) * 0.4;
    m4.compose(p4.set(x, h / 2, z), q4.identity(), s4.set(w, h, 1)); houseI.setMatrixAt(i, m4);
    m4.compose(p4.set(x, h + 0.3, z), q4.identity(), s4.set(w * 0.95, 0.55, 1.05)); roofI.setMatrixAt(i, m4);
    if (rnd(i, 7) > 0.3) { const g = glow(0xffb870, 0.35, 0.55, 0.4); g.position.set(x + (rnd(i, 8) - 0.5) * w * 0.5, h * 0.55, z + 0.52); winGlows.push(g); scene.add(g); }
  }
  scene.add(houseI, roofI);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x6f86b8, 0x3a2a1e, 0.38));
  const key = new THREE.SpotLight(0xffd2a0, 36, 0, 0.62, 0.6, 1.35);
  key.position.set(-1.0, 3.4, 2.6); key.target.position.set(-0.1, 0.7, -0.4);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 2; key.shadow.camera.far = 9; key.shadow.bias = -0.0003; key.shadow.normalBias = 0.02;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7fa4ff, 1.1); rim.position.set(-1.5, 2.0, -4); scene.add(rim);
  const sunset = new THREE.DirectionalLight(0xff9a5a, 0.5); sunset.position.set(3, 0.8, -5); scene.add(sunset);
  // A tripod work light at the right: the practical that throws the warm key on the bench.
  const steel = std(0x3a3d42, { metalness: 0.7, roughness: 0.4 });
  const WL = V(2.05, 1.9, 0.9);
  const tri = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 8), steel, 4);
  [[0.35, 0], [-0.2, 0.3], [-0.2, -0.3]].forEach(([dx, dz], i) => { const a = V(WL.x + dx, 0, WL.z + dz), b = V(WL.x, 1.0, WL.z); q4.setFromUnitVectors(Y, b.clone().sub(a).normalize()); m4.compose(a.clone().add(b).multiplyScalar(0.5), q4, s4.set(1, a.distanceTo(b), 1)); tri.setMatrixAt(i, m4); });
  m4.compose(p4.set(WL.x, 1.45, WL.z), q4.identity(), s4.set(1, 0.9, 1)); tri.setMatrixAt(3, m4);
  tri.castShadow = true; scene.add(tri);
  const lampHead = mesh(new RoundedBoxGeometry(0.34, 0.24, 0.1, 2, 0.02), std(0xd8a21c, { roughness: 0.5, metalness: 0.3 }));
  lampHead.position.copy(WL); lampHead.lookAt(0.6, 0.8, 0.0); scene.add(lampHead);
  const lens = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.18), new THREE.MeshBasicMaterial({ color: 0xffe2b0, toneMapped: false }));
  lens.position.copy(WL); lens.quaternion.copy(lampHead.quaternion); lens.translateZ(0.052); scene.add(lens);
  const lensGlow = glow(0xffc070, 1.6, 0.6, 0.4); lensGlow.position.copy(lens.position); lensGlow.translateZ(0.05); scene.add(lensGlow);
  const work = new THREE.SpotLight(0xffc68a, 14, 0, 0.8, 0.7, 1.5); work.position.copy(WL); work.target.position.set(0.7, 0.8, 0.1); scene.add(work, work.target);

  // ----------------------------------------------------------- the four standalone sites
  const SITES = [
    { x: -1.6, z: -0.2, w: 0.44, h: 0.48, d: 0.32, col: '#3b6fd8', roof: 'flat' },
    { x: -1.05, z: 0.0, w: 0.4, h: 0.36, d: 0.34, col: '#c8463a', roof: 'gable' },
    { x: -0.48, z: -0.25, w: 0.28, h: 0.7, d: 0.28, col: '#3a9a5a', roof: 'flat' },
    { x: 0.05, z: -0.05, w: 0.46, h: 0.34, d: 0.32, col: '#8a5ad0', roof: 'shed' },
  ];
  const MERGE_AT = V(-0.6, 0.06, -1.0);
  const sites = SITES.map((o, i) => {
    const g = new THREE.Group(); scene.add(g);
    const c = new THREE.Color(o.col);
    const bodyM = std(c.clone().multiplyScalar(0.55), { roughness: 0.7 });
    const body = mesh(new RoundedBoxGeometry(o.w, o.h, o.d, 2, 0.015), bodyM); body.position.y = o.h / 2; g.add(body);
    let roof = null;
    if (o.roof === 'gable') { const rg = new THREE.CylinderGeometry(o.w * 0.62, o.w * 0.62, o.d + 0.04, 3); rg.rotateX(Math.PI / 2); roof = mesh(rg, std(c.clone().multiplyScalar(0.35), { roughness: 0.8 })); roof.rotation.z = Math.PI / 2; roof.position.y = o.h + o.w * 0.3; roof.scale.set(0.55, 1, 1); }
    else if (o.roof === 'shed') { roof = mesh(new THREE.BoxGeometry(o.w + 0.06, 0.03, o.d + 0.06), std(c.clone().multiplyScalar(0.35), { roughness: 0.8 })); roof.position.y = o.h + 0.06; roof.rotation.z = 0.25; }
    else { roof = mesh(new THREE.BoxGeometry(o.w + 0.04, 0.03, o.d + 0.04), std(c.clone().multiplyScalar(0.35), { roughness: 0.8 })); roof.position.y = o.h + 0.015; }
    g.add(roof);
    // Its own website on its face: a header in its colour and a layout of its own.
    const face = canvasTex(256, Math.round(256 * (o.h * 0.8) / (o.w * 0.84)), (cx, w, h) => {
      cx.fillStyle = '#ece6da'; cx.fillRect(0, 0, w, h);
      cx.fillStyle = o.col; cx.fillRect(0, 0, w, h * 0.16);
      cx.fillStyle = 'rgba(255,255,255,0.8)'; roundRect(cx, w * 0.06, h * 0.04, w * 0.3, h * 0.07, 4); cx.fill();
      cx.fillStyle = o.col; cx.globalAlpha = 0.45;
      if (i === 0) { cx.fillRect(w * 0.06, h * 0.24, w * 0.88, h * 0.3); }
      else if (i === 1) { cx.beginPath(); cx.arc(w * 0.5, h * 0.45, h * 0.18, 0, 7); cx.fill(); }
      else if (i === 2) { for (let r = 0; r < 4; r++) cx.fillRect(w * 0.1, h * (0.24 + r * 0.17), w * 0.8, h * 0.11); }
      else { cx.fillRect(w * 0.06, h * 0.24, w * 0.4, h * 0.66); }
      cx.globalAlpha = 1; cx.fillStyle = '#8a8378';
      for (let r = 0; r < 3; r++) { roundRect(cx, w * (i === 3 ? 0.52 : 0.08), h * (0.62 + r * 0.1), w * (i === 3 ? 0.4 : 0.6 - r * 0.1), h * 0.04, 3); cx.fill(); }
    });
    const faceM = new THREE.MeshStandardMaterial({ map: face.tex, emissive: 0xffffff, emissiveMap: face.tex, emissiveIntensity: 0.35, roughness: 0.6, transparent: true });
    const fm = new THREE.Mesh(new THREE.PlaneGeometry(o.w * 0.84, o.h * 0.8), faceM); fm.position.set(0, o.h * 0.48, o.d / 2 + 0.002); g.add(fm);
    return { o, g, mats: [bodyM, roof.material, faceM] };
  });
  sites.forEach((s) => s.mats.forEach((m) => { m.transparent = true; }));
  const poofs = [0, 1, 2, 3, 4, 5].map(() => { const g = glow(0xe8cfa8, 0.4, 0, 0.6); scene.add(g); return g; });
  const flash = glow(0xffe0b0, 2.2, 0, 0.4); flash.position.set(MERGE_AT.x, 0.6, MERGE_AT.z + 0.2); scene.add(flash);

  // ----------------------------------------------------------- the timber frame: every member in one batch
  const timber = std(0xffffff, { map: grainTex('#d2a46a', { size: 128, speck: 0.14, blot: 0.12, seed: 63, repeat: 1 }), roughness: 0.72 });
  const MEM = [];  // [x, y, z, sx, sy, sz, rotZ, rotY, kind, order]
  const POST_X = [-1.4, -1.0, -0.6, -0.2, 0.2];
  POST_X.forEach((x, i) => { MEM.push([x, 0.06, FZ, 0.05, 1.56, 0.07, 0, 0, 'post', i]); MEM.push([x, 0.06, -1.3, 0.05, 1.56, 0.07, 0, 0, 'post', i + 0.5]); });
  [0.175, 0.505, 0.835, 1.165, 1.495].forEach((y, i) => MEM.push([-0.6, y, FZ, 1.66, 0.045, 0.07, 0, 0, 'plate', 5 + i * 0.6]));
  MEM.push([-0.6, 1.62, FZ, 1.7, 0.05, 0.08, 0, 0, 'plate', 8]); MEM.push([-0.6, 1.62, -1.3, 1.7, 0.05, 0.08, 0, 0, 'plate', 8.3]);
  [-1.4, 0.2].forEach((x, i) => MEM.push([x, 1.62, -1.01, 0.07, 0.05, 0.66, 0, 0, 'plate', 8.6 + i * 0.2]));
  const RISE_H = 0.44, RL = Math.hypot(0.82, RISE_H), RA = Math.atan2(RISE_H, 0.82);
  [FZ, -1.3].forEach((z, i) => {
    MEM.push([-1.01, 1.645 + RISE_H / 2, z, RL, 0.05, 0.06, RA, 0, 'truss', 9.4 + i * 0.3]);
    MEM.push([-0.19, 1.645 + RISE_H / 2, z, RL, 0.05, 0.06, -RA, 0, 'truss', 9.6 + i * 0.3]);
    MEM.push([-0.6, 1.645 + RISE_H / 2, z, 0.05, RISE_H, 0.06, 0, 0, 'truss', 9.8 + i * 0.3]);
  });
  MEM.push([-0.6, 1.645 + RISE_H, -1.01, 0.06, 0.06, 0.66, 0, 0, 'truss', 10.6]);
  const frameI = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), timber, MEM.length);
  frameI.castShadow = frameI.receiveShadow = true; scene.add(frameI);
  const memT = (m) => POOF + 0.05 + m[9] * 0.075;

  // ONE SITE: a site board on the front gable.
  const signTex = (text, w, h, sub) => canvasTex(w, h, (c) => {
    c.fillStyle = '#16181c'; roundRect(c, 0, 0, w, h, 18); c.fill();
    c.fillStyle = SAFETY; roundRect(c, 8, 8, w - 16, h - 16, 12); c.fill();
    for (let i = -2; i < w / 40 + 2; i++) { c.fillStyle = '#16181c'; c.beginPath(); c.moveTo(i * 40, h - 8); c.lineTo(i * 40 + 20, h - 8); c.lineTo(i * 40 + 34, h - 22); c.lineTo(i * 40 + 14, h - 22); c.closePath(); c.fill(); }
    c.fillStyle = '#16181c'; c.font = `900 ${Math.round(h * 0.42)}px ${SANS}`; c.textBaseline = 'middle'; c.textAlign = 'center';
    if ('letterSpacing' in c) c.letterSpacing = '4px';
    c.fillText(text, w / 2, sub ? h * 0.36 : h * 0.44);
  });
  const oneSite = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.17), std(0xffffff, { map: signTex('ONE SITE', 640, 176).tex, roughness: 0.55 }));
  oneSite.castShadow = true; scene.add(oneSite);

  // ----------------------------------------------------------- the bench and the five templates
  const bench = mesh(new RoundedBoxGeometry(1.5, 0.05, 0.5, 2, 0.01), timber); bench.position.set(1.0, BENCH_TOP - 0.025, BENCH_Z); scene.add(bench);
  const horseI = new THREE.InstancedMesh(new THREE.BoxGeometry(0.05, 0.82, 0.05), timber, 8);
  [0.42, 1.58].forEach((x, a) => [-1, 1].forEach((sx, b) => [-1, 1].forEach((sz, c2) => {
    const top = V(x, BENCH_TOP - 0.06, BENCH_Z), bot = V(x + sx * 0.08, 0, BENCH_Z + sz * 0.2);
    q4.setFromUnitVectors(Y, top.clone().sub(bot).normalize()); m4.compose(top.clone().add(bot).multiplyScalar(0.5), q4, s4.set(1, top.distanceTo(bot) / 0.82, 1)); horseI.setMatrixAt(a * 4 + b * 2 + c2, m4);
  })));
  horseI.castShadow = true; scene.add(horseI);
  // The apron board on the front of the bench: 5 TEMPLATES.
  const apronG = new THREE.PlaneGeometry(0.84, 0.2); apronG.translate(0, -0.1, 0);
  const apron = new THREE.Mesh(apronG, std(0xffffff, { map: signTex('5 TEMPLATES', 840, 200).tex, roughness: 0.55 }));
  apron.position.set(0.87, BENCH_TOP - 0.05, BENCH_Z + 0.26); scene.add(apron);

  const JW = 0.2, JH = 0.155;
  const tplTex = TPL_COL.map((_, j) => canvasTex(320, 256, (c, w, h) => drawTemplate(c, w, h, j)).tex);
  const jigFrameI = new THREE.InstancedMesh(new RoundedBoxGeometry(JW + 0.03, JH + 0.03, 0.025, 2, 0.008), std(0xffffff, { roughness: 0.5, metalness: 0.1 }), 5);
  TPL_COL.forEach((col, j) => jigFrameI.setColorAt(j, new THREE.Color(col).multiplyScalar(0.8)));
  jigFrameI.castShadow = true; scene.add(jigFrameI);
  const jigFaces = tplTex.map((tex) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(JW, JH), new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.25, roughness: 0.5 })); scene.add(m); return m; });
  const jigFlash = TPL_COL.map((col) => { const g = glow(new THREE.Color(col), 0.5, 0, 0.45); scene.add(g); return g; });
  const JIG_TILT = -0.95; // leaning back toward the builder, face up to the camera

  // ----------------------------------------------------------- the pages: one instanced batch per template
  const pageG = new THREE.PlaneGeometry(SLOT_W, SLOT_H);
  const pageMats = tplTex.map((tex) => new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 0.18, roughness: 0.55, side: THREE.DoubleSide }));
  const pageI = pageMats.map((m, j) => { const im = new THREE.InstancedMesh(pageG, m, PER[j]); im.castShadow = true; im.frustumCulled = false; scene.add(im); return im; });
  const landGlows = PAGES.map(() => { const g = glow(0xffd8a0, 0.5, 0, 0.45); scene.add(g); return g; });

  // The PAGES counter: a board on a stake at the corner of the frame.
  const counter = canvasTex(400, 300);
  let counterKey = '';
  const drawCounter = (n, pulse) => {
    const key = n + '|' + Math.round(pulse * 10); if (key === counterKey) return; counterKey = key;
    counter.redraw((c, w, h) => {
      c.fillStyle = '#16181c'; roundRect(c, 0, 0, w, h, 20); c.fill();
      c.fillStyle = '#f1ece2'; roundRect(c, 10, 10, w - 20, h - 20, 14); c.fill();
      c.fillStyle = SAFETY; c.fillRect(10, 10, w - 20, 70);
      c.fillStyle = '#16181c'; c.font = `900 50px ${SANS}`; c.textBaseline = 'middle'; c.textAlign = 'center';
      if ('letterSpacing' in c) c.letterSpacing = '6px';
      c.fillText('PAGES', w / 2, 48);
      if ('letterSpacing' in c) c.letterSpacing = '0px';
      c.fillStyle = pulse > 0.05 ? `rgb(${Math.round(22 + 200 * pulse)},${Math.round(24 + 100 * pulse)},28)` : '#16181c';
      c.font = `900 ${Math.round(170 + 14 * pulse)}px ${SANS}`; c.fillText(String(n), w / 2, 190);
    });
  };
  const counterM = std(0xffffff, { map: counter.tex, roughness: 0.55, emissive: 0xffffff, emissiveMap: counter.tex, emissiveIntensity: 0.12 });
  const counterB = new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.315), counterM); counterB.castShadow = true;
  counterB.position.set(0.52, 1.25, -0.62); counterB.rotation.y = -0.35; scene.add(counterB);
  const stake = mesh(new THREE.BoxGeometry(0.04, 1.1, 0.04), timber); stake.position.set(0.52, 0.55, -0.645); scene.add(stake);

  // ----------------------------------------------------------- the builder
  const skin = new THREE.MeshPhysicalMaterial({ color: 0x8d5a3b, roughness: 0.55, sheen: 0.5, sheenColor: new THREE.Color(0xffc8a8) });
  const vestM = std(0xff7a1a, { roughness: 0.75, emissive: 0xff5a00, emissiveIntensity: 0.05 });
  const shirt = std(0x3d5f8a, { roughness: 0.9 });
  const bld = makePerson(scene, { skin, top: vestM, sleeve: shirt, fore: shirt, pants: std(0x6e5a3e, { roughness: 0.9 }), shoeM: std(0x4a3020, { roughness: 0.7 }), hairM: std(0x1a120c, { roughness: 0.9 }), hairCap: 0.5, chestR: 0.155 });
  const stripeM = std(0xdfe4ea, { roughness: 0.25, metalness: 0.4, emissive: 0x8090a0, emissiveIntensity: 0.15 });
  const stripes = [0, 1].map(() => { const m = mesh(new THREE.TorusGeometry(0.158, 0.012, 6, 28), stripeM, { cast: false }); scene.add(m); return m; });
  bld.extra.push((hip, top, F, S, Dn) => { stripes.forEach((m, i) => { m.position.copy(hip).addScaledVector(Dn, 0.22 + i * 0.12); m.quaternion.setFromUnitVectors(V(0, 0, 1), Dn); }); });
  const hatM = new THREE.MeshPhysicalMaterial({ color: 0xffc21a, roughness: 0.35, clearcoat: 0.6 });
  const hat = mesh(new THREE.SphereGeometry(0.122, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), hatM); scene.add(hat);
  const brim = mesh(new THREE.CylinderGeometry(0.15, 0.155, 0.012, 28), hatM); scene.add(brim);
  const hatRidge = mesh(new THREE.BoxGeometry(0.03, 0.02, 0.24), hatM); scene.add(hatRidge);
  // Mallet: an ash handle and a rawhide-coloured head.
  const handle = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.34, 10), std(0xc8a070, { roughness: 0.6 })); scene.add(handle);
  const headM = std(0x6a4a32, { roughness: 0.5 });
  const malletHead = mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.13, 20), headM); scene.add(malletHead);

  // ----------------------------------------------------------- title
  const title = label('Learning site unification', { font: `800 64px ${SANS}`, fg: '#f6efe4', h: 0.2, pad: 12, track: 1 });
  const client = label('Professional Home Builders Institute', { font: `700 52px ${MONO}`, fg: SAFETY, h: 0.1, pad: 8, track: 2 });
  [title, client].forEach((l) => { l.material.fog = false; scene.add(l); });
  const TWd = title.geometry.parameters.width, CWd = client.geometry.parameters.width;

  // ----------------------------------------------------------- dust in the work light
  const DN = 140, dpos = new Float32Array(DN * 3);
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dpos, 3));
  const dust = new THREE.Points(dGeo, new THREE.PointsMaterial({ color: 0xffd6a0, size: 0.012, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dust.frustumCulled = false; scene.add(dust);

  // ----------------------------------------------------------- choreography helpers
  // Where the builder stands for each strike, and the mallet's swing angle around the shoulder.
  const STAND_Z = -0.14, YAW = 0.12;
  const standX = (j) => JIG_X(j) + 0.11;
  const hipXAt = (t) => {
    let x = lerp(1.15, standX(0), eio(k(t, 2.9, 3.5)));
    for (let j = 0; j < 4; j++) x = lerp(x, standX(j + 1), eio(k(t, STRIKE[j] + 0.12, STRIKE[j] + 0.44)));
    return lerp(x, standX(4) - 0.22, eio(k(t, 7.55, 8.1)));
  };
  // Swing angle a: 0 points the mallet straight ahead, +PI/2 straight up, -PI/2 straight down.
  const A_REST = -1.5, A_READY = -0.55, A_UP = 1.2, A_HIT = -0.98, A_SHOULDER = 2.05;
  const swingAt = (t) => {
    let a = lerp(A_REST, A_READY, eio(k(t, 3.0, 3.4)));
    for (const s of STRIKE) {
      a = lerp(a, A_UP, eio(k(t, s - 0.4, s - 0.1)));
      a = lerp(a, A_HIT, ei(k(t, s - 0.1, s)));
      if (t >= s) a = A_HIT + 0.3 * Math.sin(Math.PI * k(t, s, s + 0.16)) * Math.exp(-3 * (t - s));
      a = lerp(a, A_READY, eio(k(t, s + 0.12, s + 0.35)));
    }
    a = lerp(a, A_SHOULDER, eio(k(t, 7.6, 8.25)));
    return lerp(a, A_REST, eio(k(t, 9.6, 10)));
  };
  const F = V(0, 0, 0), S = V(0, 0, 0), hip = V(0, 0, 0), look = V(0, 0, 0), piv = V(0, 0, 0), hd = V(0, 0, 0), grip = V(0, 0, 0), headP = V(0, 0, 0), tng = V(0, 0, 0), tmp = V(0, 0, 0), tmp2 = V(0, 0, 0);
  const pagePos = (p, t, out) => {
    // From the jig's face, up in an arc over the builder, into its facade slot.
    const u = eio(k(t, p.at, p.land));
    const c = p.slot % 4, r = Math.floor(p.slot / 4);
    const ax = JIG_X(p.j), ay = BENCH_TOP + 0.1, az = BENCH_Z - 0.02;
    const bx = slotX(c), by = slotY(r), bz = FZ + 0.045;
    const mx = (ax + bx) / 2, my = Math.max(ay, by) + 0.75, mz = (az + bz) / 2 + 0.1;
    out.set((1 - u) * (1 - u) * ax + 2 * (1 - u) * u * mx + u * u * bx, (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * my + u * u * by, (1 - u) * (1 - u) * az + 2 * (1 - u) * u * mz + u * u * bz);
    return u;
  };

  // ----------------------------------------------------------- camera
  const L = (x) => x;
  const camPos = (t) => kf(t, [
    [0, [-0.3, 1.45, 3.0]], [1.9, [-0.22, 1.5, 3.15]],
    [2.8, [0.2, 1.6, 3.6]], [3.6, [0.75, 1.55, 3.95]],
    [6.6, [0.85, 1.6, 4.0], L], [7.8, [0.45, 1.85, 4.45]],
    [10, [0.42, 1.87, 4.55], L],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.75, 0.45, -0.55]], [1.9, [-0.7, 0.58, -0.6]],
    [2.8, [-0.4, 1.15, -0.6]], [3.6, [0.18, 1.0, -0.3]],
    [6.6, [0.16, 1.02, -0.32], L], [7.8, [0.05, 1.2, -0.45]],
    [10, [0.03, 1.21, -0.45], L],
  ]);
  const tgt = V(0, 0, 0);
  const faceCam = (m) => { m.rotation.set(0, Math.atan2(camera.position.x - m.position.x, camera.position.z - m.position.z), 0); };

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.1) * 0.008, p[1] + Math.sin(t * 1.6 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // ---- Beat 1: four sites slide together and merge on the slab.
    sites.forEach(({ o, g, mats }, i) => {
      const m = eio(k(t, MERGE[0] + i * 0.08, MERGE[1] - 0.1 + i * 0.03));
      const squash = ei(k(t, MERGE[1] - 0.25, POOF));
      const idle = Math.sin(t * 1.7 + i * 1.3) * 0.006 * (1 - m);
      g.position.set(lerp(o.x, MERGE_AT.x + (i - 1.5) * 0.12 * (1 - squash), m), MERGE_AT.y * m + idle + 0.06 * Math.sin(Math.PI * m), lerp(o.z, MERGE_AT.z, m));
      g.rotation.y = (rnd(i, 2) - 0.5) * 0.5 * (1 - m) + Math.sin(Math.PI * m) * (i % 2 ? 0.4 : -0.4);
      g.scale.set(lerp(1, 0.4, squash), lerp(1, 0.2, squash), lerp(1, 0.4, squash));
      mats.forEach((mt) => { mt.opacity = 1 - squash; });
      g.visible = t < POOF + 0.02;
    });
    const pf = k(t, POOF - 0.05, POOF + 0.9);
    poofs.forEach((g, i) => {
      const a = i / poofs.length * Math.PI * 2;
      g.position.set(MERGE_AT.x + Math.cos(a) * (0.3 + pf * 0.7), 0.12 + pf * 0.18 + rnd(i, 9) * 0.1, MERGE_AT.z + 0.2 + Math.sin(a) * (0.2 + pf * 0.4));
      g.scale.setScalar(0.3 + pf * 0.6); g.material.opacity = t > POOF - 0.05 ? 0.5 * (1 - pf) : 0;
    });
    flash.material.opacity = t > POOF ? 0.9 * Math.exp(-6 * (t - POOF)) : 0;

    // ---- Beat 2: the frame rises member by member.
    MEM.forEach((mm, i) => {
      const [x, y, z, sx, sy, sz, rz, , kind] = mm;
      const t0 = memT(mm);
      const u = kind === 'post' ? back(k(t, t0, t0 + 0.4)) : spring(k(t, t0, t0 + 0.55));
      const uc = clamp(u);
      if (kind === 'post') { const h = Math.max(0.001, sy * u); p4.set(x, y + h / 2, z); s4.set(sx, h, sz); }
      else { p4.set(x, y + 0.5 * (1 - u), z); s4.set(sx * Math.max(0.001, uc), sy * Math.max(0.001, uc), sz * Math.max(0.001, uc)); }
      e4.set(0, 0, rz); q4.setFromEuler(e4);
      m4.compose(p4, q4, s4); frameI.setMatrixAt(i, m4);
    });
    frameI.instanceMatrix.needsUpdate = true;
    frameI.visible = t > POOF;
    const os = spring(k(t, 2.75, 3.4));
    oneSite.position.set(-0.6, 1.83 + 0.3 * (1 - clamp(os)), FZ + 0.05);
    oneSite.rotation.set(0, 0, 0.18 * (1 - os) * Math.sin(t * 9));
    oneSite.scale.setScalar(Math.max(0.001, clamp(os * 1.2)));
    oneSite.visible = t > 2.75;

    // ---- Beat 3: templates pop up on the bench.
    const flashes = [];
    for (let j = 0; j < 5; j++) {
      const up = back(k(t, T_TPL[0] + j * 0.1, T_TPL[0] + j * 0.1 + 0.4));
      const hit = t > STRIKE[j] ? Math.exp(-9 * (t - STRIKE[j])) : 0;
      flashes.push(hit);
      const sq = 1 - 0.18 * hit * Math.cos((t - STRIKE[j]) * 40) * (t > STRIKE[j] ? 1 : 0);
      p4.set(JIG_X(j), BENCH_TOP + 0.06 * clamp(up) - 0.012 * hit, BENCH_Z - 0.02);
      e4.set(JIG_TILT, 0, 0); q4.setFromEuler(e4);
      s4.set(Math.max(0.001, up), Math.max(0.001, up) * sq, Math.max(0.001, up));
      m4.compose(p4, q4, s4); jigFrameI.setMatrixAt(j, m4);
      const jf = jigFaces[j];
      jf.position.copy(p4); jf.quaternion.copy(q4); jf.scale.copy(s4); jf.translateZ(0.0135 * Math.max(0.001, up));
      jf.material.emissiveIntensity = 0.25 + 1.2 * hit;
      jf.visible = up > 0.01;
      const fl = jigFlash[j]; fl.position.set(JIG_X(j), BENCH_TOP + 0.12, BENCH_Z + 0.02); fl.material.opacity = 0.9 * hit; fl.scale.setScalar(0.3 + 0.4 * hit);
    }
    jigFrameI.instanceMatrix.needsUpdate = true;
    jigFrameI.visible = t > T_TPL[0];
    const ap = spring(k(t, 3.25, 3.8));
    apron.rotation.x = 1.5 * (1 - ap);
    apron.visible = t > 3.25;

    // ---- The pages fly from the jigs into the facade.
    const cnt = [0, 0, 0, 0, 0];
    let landed = 0, lastLand = -9;
    const glowAll = eo(k(t, DONE, DONE + 0.5)) * (1 - 0.6 * eo(k(t, DONE + 0.6, DONE + 1.6)));
    PAGES.forEach((pg, n) => {
      const u = pagePos(pg, t, p4);
      const live = t > pg.at;
      const spin = (1 - u) * (rnd(n, 11) - 0.5) * 3;
      e4.set(lerp(JIG_TILT, 0, eo(u)) + spin * 0.4, spin, (1 - u) * (rnd(n, 12) - 0.5) * 1.2);
      q4.setFromEuler(e4);
      const sc = live ? lerp(JW / SLOT_W, 1, eo(u)) : 0.0001;
      const settle = t > pg.land ? 1 + 0.08 * Math.sin((t - pg.land) * 22) * Math.exp(-8 * (t - pg.land)) : 1;
      m4.compose(p4, q4, s4.set(sc * settle, sc * settle, 1));
      pageI[pg.j].setMatrixAt(cnt[pg.j]++, m4);
      if (t >= pg.land) { landed++; lastLand = Math.max(lastLand, pg.land); }
      const lg = landGlows[n];
      lg.position.set(slotX(pg.slot % 4), slotY(Math.floor(pg.slot / 4)), FZ + 0.08);
      lg.material.opacity = t > pg.land ? 0.8 * Math.exp(-5 * (t - pg.land)) : 0;
      lg.scale.set(0.55, 0.45, 1);
      // A wave of light across the finished facade.
      if (t > DONE) { const wave = Math.exp(-Math.pow((t - DONE) * 3.2 - (pg.slot % 4) * 0.5 - Math.floor(pg.slot / 4) * 0.35, 2) * 2.5); lg.material.opacity = Math.max(lg.material.opacity, 0.45 * wave); }
    });
    pageI.forEach((im) => { im.instanceMatrix.needsUpdate = true; im.visible = t > STRIKE[0]; });
    pageMats.forEach((m) => { m.emissiveIntensity = 0.18 + 0.35 * glowAll; });
    drawCounter(landed, t > lastLand ? Math.exp(-6 * (t - lastLand)) : 0);
    counterM.emissiveIntensity = 0.12 + 0.2 * glowAll;
    const cs = back(k(t, 3.5, 3.95));
    counterB.scale.setScalar(Math.max(0.001, clamp(cs))); counterB.visible = t > 3.5;

    // ---- The builder.
    const hx = hipXAt(t);
    const yaw = YAW - 0.5 * eio(k(t, 0.4, 0.9)) * (1 - eio(k(t, 2.6, 3.1))) - 0.35 * eio(k(t, 7.7, 8.2)) * (1 - eio(k(t, 9.5, 10)));
    fwdOf(yaw, F); sideOf(yaw, S);
    const sa = swingAt(t);
    // Weight shifts into each strike, then settles; a slow breath under it all.
    let drive = 0; STRIKE.forEach((s) => { drive += Math.sin(Math.PI * k(t, s - 0.4, s + 0.25)); });
    const lean = 0.06 + 0.1 * drive + 0.02 * Math.sin(t * 1.9) - 0.08 * eio(k(t, 7.7, 8.3));
    // Side steps between strikes: lead foot then trail foot, with a dip in the hips.
    let step = 0; for (let j = 0; j < 4; j++) step += Math.sin(Math.PI * k(t, STRIKE[j] + 0.12, STRIKE[j] + 0.44));
    step += Math.sin(Math.PI * k(t, 2.9, 3.5)) + Math.sin(Math.PI * k(t, 7.55, 8.1));
    hip.set(hx, 0.92 - 0.025 * step - 0.03 * drive + 0.004 * Math.sin(t * 1.9), STAND_Z - 0.03 * drive);
    // The swing plane runs through the right shoulder; the right hand rides the grip.
    const DnTmp = tmp.copy(F).multiplyScalar(lean).add(Y).normalize();
    piv.copy(hip).addScaledVector(DnTmp, 0.46).addScaledVector(S, -0.17).addScaledVector(F, 0.06);
    hd.copy(F).multiplyScalar(Math.cos(sa)).addScaledVector(Y, Math.sin(sa));
    grip.copy(piv).addScaledVector(hd, 0.3).addScaledVector(S, 0.04);
    // Resting on the shoulder: the grip comes down in front of the chest, the head rides up behind.
    const restK = eio(k(t, 7.6, 8.25)) * (1 - eio(k(t, 9.6, 10)));
    grip.lerp(tmp2.copy(piv).addScaledVector(F, 0.2).addScaledVector(Y, -0.12).addScaledVector(S, 0.05), restK);
    headP.copy(grip).addScaledVector(hd, 0.26);
    tng.copy(F).multiplyScalar(-Math.sin(sa)).addScaledVector(Y, Math.cos(sa));
    handle.position.copy(grip).addScaledVector(hd, 0.12); handle.quaternion.setFromUnitVectors(Y, hd);
    malletHead.position.copy(headP); malletHead.quaternion.setFromUnitVectors(Y, tng);
    // Look: the merging sites, the rising frame, then each template as it is struck, then up at the build.
    look.set(-0.6, 0.4, -0.6);
    look.lerp(tmp2.set(-0.6, 1.3, -0.8), eio(k(t, 2.1, 2.7)));
    look.lerp(tmp2.set(JIG_X(0), BENCH_TOP, BENCH_Z), eio(k(t, 2.9, 3.4)));
    for (let j = 1; j < 5; j++) look.lerp(tmp2.set(JIG_X(j), BENCH_TOP, BENCH_Z), eio(k(t, STRIKE[j - 1] + 0.1, STRIKE[j - 1] + 0.35)));
    look.lerp(tmp2.set(-0.5, 1.3, FZ), eio(k(t, 6.55, 7.0)));
    const nod = 0.22 * Math.sin(Math.PI * k(t, 8.4, 8.9));
    bld.pose({ t,
      hip, yaw, lean, look, nod,
      feet: (i, out) => {
        const sg = i ? 1 : -1;
        // Each foot trails the hips, the lead foot first: the right foot leads when moving right.
        const lag = (i === 1 ? 0.0 : 0.09);
        const fx = hipXAt(t - lag);
        out.set(fx + sg * 0.13 * Math.cos(yaw), 0.09, STAND_Z + 0.03 - sg * 0.13 * Math.sin(yaw));
        // Only a foot that is travelling lifts off the ground.
        const dx = Math.abs(fx - hipXAt(t - lag - 0.06));
        out.y += Math.min(0.08, dx * 1.6);
      },
      hands: (i, sh, out) => {
        if (i === 0) { out.copy(grip).addScaledVector(hd, -0.03); return; }
        // Left hand: steadies the jig on each strike, rests on the hip between.
        out.copy(sh).addScaledVector(Y, -0.42).addScaledVector(F, 0.12).addScaledVector(S, 0.06);
        let brace = 0, j0 = 0; STRIKE.forEach((s, j) => { const b = Math.sin(Math.PI * k(t, s - 0.45, s + 0.2)); if (b > brace) { brace = b; j0 = j; } });
        out.lerp(tmp2.set(JIG_X(j0) + 0.17, BENCH_TOP + 0.05, BENCH_Z - 0.1), eio(brace));
        out.lerp(tmp2.copy(hip).addScaledVector(S, 0.2).addScaledVector(Y, 0.08).addScaledVector(F, -0.02), eio(k(t, 7.7, 8.3)));
      },
    });
    // Hard hat rides the head.
    const lk = bld.lookD, hy = Math.atan2(lk.x, lk.z), pitch = Math.asin(clamp(lk.y, -1, 1));
    e4.set(-pitch * 0.6, hy, 0, 'YXZ');
    hat.position.copy(bld.headPos).addScaledVector(Y, 0.025); hat.rotation.copy(e4);
    brim.position.copy(bld.headPos).addScaledVector(Y, 0.028); brim.rotation.copy(e4);
    hatRidge.position.copy(bld.headPos).addScaledVector(Y, 0.13); hatRidge.rotation.copy(e4);
    e4.order = 'XYZ';

    // The work light hums; the houses' windows glow steady.
    lensGlow.material.opacity = 0.55 + 0.03 * Math.sin(t * 7);

    // ---- Title.
    const ci = back(k(t, 8.2, 8.7)), ti = back(k(t, 8.35, 8.9)), out = ei(k(t, 9.25, 9.6));
    title.position.set(-0.32 + TWd / 2, 2.21 + (1 - clamp(ti)) * -0.06, -0.62);
    faceCam(title);
    title.material.opacity = clamp(ti) * (1 - out); title.visible = title.material.opacity > 0.01;
    const off = TWd / 2 - CWd / 2 - 0.01;
    client.position.set(title.position.x - off * Math.cos(title.rotation.y), 2.03 + (1 - clamp(ci)) * -0.04, title.position.z + off * Math.sin(title.rotation.y));
    client.rotation.copy(title.rotation);
    client.material.opacity = clamp(ci) * (1 - out); client.visible = client.material.opacity > 0.01;

    for (let i = 0; i < DN; i++) {
      dpos[i * 3] = -0.4 + rnd(i, 81) * 2.6 + Math.sin(t * 0.3 + i) * 0.08;
      dpos[i * 3 + 1] = 0.1 + rnd(i, 82) * 2.0 + Math.sin(t * 0.4 + i * 1.3) * 0.05;
      dpos[i * 3 + 2] = -0.6 + rnd(i, 83) * 1.6 + Math.cos(t * 0.25 + i) * 0.06;
    }
    dGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 7.8 };
}
