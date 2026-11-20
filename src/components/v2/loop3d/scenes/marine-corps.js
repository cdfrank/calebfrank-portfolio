// US Marine Corps pitch lit loop, 10 s. "A journey mapped for the pitch."
// A dark navy briefing room. Under one swinging pendant lamp sits a sand table: a contoured terrain model
// in a brass frame. Four gold markers rise out of the terrain and a gold route draws itself between them,
// the UX journey as a line across the ground. A stream of light travels the route; at each marker some of
// it peels away and settles, and what reaches the last marker turns scarlet and gathers into a rising
// column under a scarlet beacon. The pitch card rises behind the table with the project's own line.
// Abstract staging only: no stages named, no numbers, no claims.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const D = 10;
const SANS = 'Inter, system-ui, sans-serif', MONO = '"JetBrains Mono", monospace';
const GOLD = 0xffc23d, SCARLET = 0xd61a32;
const TW = 3.2, TD = 2.0;                       // terrain size
const WP = [[-1.25, 0.58], [-0.55, -0.12], [0.38, 0.34], [1.12, -0.42]];
const PIN_UP = [2.2, 2.55, 2.9, 3.25];
const DRAW0 = 2.55, DRAW1 = 4.3;
const N = 64, TR = 2.1;                          // travelers, seconds to run the whole route
const CARD = 7.0;
const sm = (d, r) => { const x = clamp(d / r); return x * x * (3 - 2 * x); };
const fitFont = (c, text, maxW, px, rest) => { c.font = rest.replace('#', px); const w = c.measureText(text).width; if (w > maxW) c.font = rest.replace('#', Math.floor(px * maxW / w)); };

// The terrain, as one height function shared by the mesh, the map texture and the route.
function base(x, z) {
  let b = 0.06 * Math.sin(1.7 * x + 0.4) * Math.cos(2.1 * z - 0.3) + 0.04 * Math.sin(3.3 * x - 2 * z + 1)
    + 0.025 * Math.sin(5.1 * x + 4.3 * z) + 0.012 * Math.sin(9.7 * x - 7.1 * z + 2)
    + 0.13 * Math.exp(-((x - 0.62) ** 2 / 0.16 + (z + 0.1) ** 2 / 0.06))
    + 0.1 * Math.exp(-((x + 0.95) ** 2 / 0.09 + (z - 0.05) ** 2 / 0.12))
    + 0.08 * Math.exp(-((x + 0.1) ** 2 / 0.05 + (z + 0.62) ** 2 / 0.05));
  const rz = 0.28 * Math.sin(x * 1.8 + 0.6) + 0.1;
  b -= 0.07 * Math.exp(-((z - rz) ** 2) / 0.01);
  return b;
}
function hgt(x, z) {
  const w = sm(TW / 2 - Math.abs(x), 0.22) * sm(TD / 2 - Math.abs(z), 0.22);
  return 0.012 + Math.max(0, base(x, z) + 0.07) * w;
}

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x04070e);
  scene.fog = new THREE.Fog(0x04070e, 4.5, 11);
  scene.environment = env;
  scene.environmentIntensity = 0.25;
  const camera = new THREE.PerspectiveCamera(34, 16 / 10, 0.05, 40);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- room
  const floor = mesh(new THREE.PlaneGeometry(20, 14), std(0xffffff, { map: grainTex('#0b1120', { size: 256, speck: 0.05, blot: 0.1, seed: 6, repeat: 6 }), roughness: 0.25, metalness: 0.4 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.95; scene.add(floor);
  const slat = canvasTex(256, 256, (c, w, h) => {
    c.fillStyle = '#0d1528'; c.fillRect(0, 0, w, h);
    for (let x = 0; x < w; x += 32) { c.fillStyle = 'rgba(0,0,0,0.45)'; c.fillRect(x, 0, 4, h); c.fillStyle = 'rgba(120,150,210,0.06)'; c.fillRect(x + 4, 0, 2, h); }
  }).tex;
  slat.wrapS = slat.wrapT = THREE.RepeatWrapping; slat.repeat.set(10, 2);
  const wall = mesh(new THREE.PlaneGeometry(14, 5), std(0xffffff, { map: slat, roughness: 0.55, metalness: 0.2 }), { cast: false });
  wall.position.set(0, 1.4, -3.1); scene.add(wall);
  // Two tall light strips on the wall: something for the brass and the table to reflect.
  [-1.9, 1.9].forEach((x) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 3), new THREE.MeshBasicMaterial({ color: 0xffd8a8, toneMapped: false }));
    s.position.set(x, 1.3, -3.08); scene.add(s);
    const g = glow(0xffc890, 1, 0.3, 0.5); g.position.set(x, 1.3, -3.0); g.scale.set(0.7, 3.6, 1); scene.add(g);
  });
  const redLine = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 0.02), new THREE.MeshBasicMaterial({ color: SCARLET, toneMapped: false }));
  redLine.position.set(0, 0.08, -3.08); scene.add(redLine);

  // ----------------------------------------------------------- the sand table
  const walnut = std(0x1f1712, { roughness: 0.42, metalness: 0.05 });
  const top = mesh(new RoundedBoxGeometry(3.62, 0.1, 2.45, 3, 0.03), walnut); top.position.y = -0.05; scene.add(top);
  const ped = mesh(new THREE.BoxGeometry(3.2, 0.86, 2.1), std(0x10141f, { roughness: 0.5, metalness: 0.3 })); ped.position.y = -0.53; scene.add(ped);
  const brass = std(0xc9a14a, { metalness: 1, roughness: 0.3 });
  const fr = new THREE.Shape(); fr.moveTo(-TW / 2 - 0.08, -TD / 2 - 0.08); fr.lineTo(TW / 2 + 0.08, -TD / 2 - 0.08); fr.lineTo(TW / 2 + 0.08, TD / 2 + 0.08); fr.lineTo(-TW / 2 - 0.08, TD / 2 + 0.08); fr.closePath();
  const hole = new THREE.Path(); hole.moveTo(-TW / 2, -TD / 2); hole.lineTo(-TW / 2, TD / 2); hole.lineTo(TW / 2, TD / 2); hole.lineTo(TW / 2, -TD / 2); hole.closePath(); fr.holes.push(hole);
  const frameG = new THREE.ExtrudeGeometry(fr, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 2 });
  frameG.rotateX(-Math.PI / 2);
  const frame = mesh(frameG, brass); scene.add(frame);
  // Terrain mesh and its map: sand tones by height, water in the valley, contour lines and a grid.
  const tg = new THREE.PlaneGeometry(TW, TD, 200, 125); tg.rotateX(-Math.PI / 2);
  const tp = tg.attributes.position;
  for (let i = 0; i < tp.count; i++) tp.setY(i, hgt(tp.getX(i), tp.getZ(i)));
  tg.computeVertexNormals();
  const MW = 800, MH = 500;
  const map = canvasTex(MW, MH, (c, w, h) => {
    const img = c.createImageData(w, h), d = img.data;
    const lo = [96, 78, 52], hi = [178, 152, 106], water = [34, 58, 72];
    for (let py = 0; py < h; py++) for (let px = 0; px < w; px++) {
      const x = -TW / 2 + TW * (px + 0.5) / w, z = -TD / 2 + TD * (py + 0.5) / h;
      const y = hgt(x, z), b = base(x, z), f = clamp((y - 0.012) / 0.24);
      let r = lerp(lo[0], hi[0], f), g = lerp(lo[1], hi[1], f), bl = lerp(lo[2], hi[2], f);
      const wet = clamp((-b - 0.035) / 0.02);
      r = lerp(r, water[0], wet); g = lerp(g, water[1], wet); bl = lerp(bl, water[2], wet);
      const cl = (y * 50) % 1, line = cl < 0.09 || cl > 0.97;
      const idx = Math.round(y * 50) % 5 === 0;
      if (line && wet < 0.5) { const m = idx ? 0.55 : 0.75; r *= m; g *= m; bl *= m; }
      const gx = Math.abs(((x + 1.6) / 0.4) % 1 - 0.5) > 0.494, gz = Math.abs(((z + 1) / 0.4) % 1 - 0.5) > 0.492;
      if (gx || gz) { r = lerp(r, 40, 0.35); g = lerp(g, 52, 0.35); bl = lerp(bl, 80, 0.35); }
      const n = (rnd(px * 7 + py * 13, 3) - 0.5) * 14;
      const o = (py * w + px) * 4; d[o] = r + n; d[o + 1] = g + n; d[o + 2] = bl + n; d[o + 3] = 255;
    }
    c.putImageData(img, 0, 0);
  });
  const terrain = mesh(tg, std(0xffffff, { map: map.tex, roughness: 0.9 }));
  scene.add(terrain);

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x2a3d70, 0x05070c, 0.28));
  const lamp = new THREE.Group(); lamp.position.set(0.05, 2.15, 0.05); scene.add(lamp);
  const cord = mesh(new THREE.CylinderGeometry(0.006, 0.006, 2.4, 6), std(0x111318), { cast: false }); cord.position.y = 1.2; lamp.add(cord);
  const shade = mesh(new THREE.CylinderGeometry(0.07, 0.3, 0.22, 40, 1, true), std(0x16233f, { roughness: 0.4, metalness: 0.6, side: THREE.DoubleSide }), { cast: false });
  lamp.add(shade);
  const shadeRim = mesh(new THREE.TorusGeometry(0.3, 0.008, 6, 48), brass, { cast: false }); shadeRim.rotation.x = Math.PI / 2; shadeRim.position.y = -0.11; lamp.add(shadeRim);
  const bulb = new THREE.Mesh(new THREE.CircleGeometry(0.1, 32), new THREE.MeshBasicMaterial({ color: 0xfff0d8, toneMapped: false }));
  bulb.rotation.x = Math.PI / 2; bulb.position.y = -0.06; lamp.add(bulb);
  const bulbGlow = glow(0xffe2b8, 0.9, 0.8, 0.3); bulbGlow.position.y = -0.12; lamp.add(bulbGlow);
  const coneTex = canvasTex(16, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.9)'); g.addColorStop(0.5, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const coneG = new THREE.ConeGeometry(1.15, 2.1, 40, 1, true); coneG.translate(0, -1.05 - 0.1, 0);
  const beam = new THREE.Mesh(coneG, new THREE.MeshBasicMaterial({ map: coneTex, color: 0xffd9a8, transparent: true, opacity: 0.05, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  lamp.add(beam);
  const key = new THREE.SpotLight(0xffe1bb, 0, 0, 0.72, 0.6, 1.4);
  key.castShadow = true; key.shadow.mapSize.set(2048, 2048); key.shadow.camera.near = 0.5; key.shadow.camera.far = 5; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.015;
  key.target.position.set(0, 0, -0.05);
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x6f8fff, 1.1); rim.position.set(-2.5, 1.6, -3); scene.add(rim);
  const rimWarm = new THREE.DirectionalLight(0xffb07a, 0.35); rimWarm.position.set(3, 1.2, -2); scene.add(rimWarm);
  const red = new THREE.PointLight(SCARLET, 0, 1.8, 2); scene.add(red);

  // ----------------------------------------------------------- the route
  const wv = WP.map(([x, z]) => new THREE.Vector3(x, 0, z));
  const ctrl = [wv[0], new THREE.Vector3(-1.05, 0, 0.12), wv[1], new THREE.Vector3(-0.1, 0, -0.32), new THREE.Vector3(0.1, 0, 0.3), wv[2], new THREE.Vector3(0.8, 0, 0.32), new THREE.Vector3(0.95, 0, -0.1), wv[3]];
  const flat = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
  const lifted = []; for (let i = 0; i <= 260; i++) { const p = flat.getPointAt(i / 260); lifted.push(new THREE.Vector3(p.x, hgt(p.x, p.z) + 0.012, p.z)); }
  const route = new THREE.CatmullRomCurve3(lifted, false, 'centripetal');
  const SEG = 420, RAD = 8;
  const tubeG = new THREE.TubeGeometry(route, SEG, 0.0065, RAD, false);
  const tube = new THREE.Mesh(tubeG, new THREE.MeshBasicMaterial({ color: GOLD, toneMapped: false }));
  scene.add(tube);
  const haloG = new THREE.TubeGeometry(route, SEG, 0.022, RAD, false);
  const halo = new THREE.Mesh(haloG, new THREE.MeshBasicMaterial({ color: 0xffb02e, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  scene.add(halo);
  const tip = glow(0xffd27a, 0.22, 0, 0.3); scene.add(tip);
  // Samples for the travelers: position and the sideways direction at each step.
  const NS = 600, RP = [], RL = [];
  const up = new THREE.Vector3(0, 1, 0), tv = new THREE.Vector3();
  for (let i = 0; i <= NS; i++) { RP.push(route.getPointAt(i / NS)); route.getTangentAt(i / NS, tv); RL.push(new THREE.Vector3().crossVectors(tv, up).normalize()); }
  const sample = (u, outP, outL) => {
    const f = clamp(u) * NS, i = Math.min(NS - 1, Math.floor(f)), r = f - i;
    outP.lerpVectors(RP[i], RP[i + 1], r); if (outL) outL.lerpVectors(RL[i], RL[i + 1], r);
    return outP;
  };
  const UW = WP.map(([x, z]) => { let best = 0, bd = 1e9; RP.forEach((p, i) => { const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (dd < bd) { bd = dd; best = i; } }); return best / NS; });

  // ----------------------------------------------------------- markers
  const poleG = new THREE.CylinderGeometry(0.007, 0.007, 0.24, 8); poleG.translate(0, 0.12, 0);
  const poles = new THREE.InstancedMesh(poleG, brass, 4); poles.castShadow = true;
  const gem = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.026, 0), std(GOLD, { metalness: 1, roughness: 0.22, emissive: 0x7a4a00, emissiveIntensity: 0.4 }), 4); gem.castShadow = true;
  const rings = new THREE.InstancedMesh(new THREE.TorusGeometry(0.05, 0.005, 6, 40).rotateX(Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), 4);
  scene.add(poles, gem, rings);
  const pinGlows = WP.map(() => { const g = glow(0xffcf6a, 0.3, 0, 0.3); scene.add(g); return g; });
  const WY = WP.map(([x, z]) => hgt(x, z));
  // Beacon over the last marker.
  const beamTex = canvasTex(16, 256, (c, w, h) => { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,1)'); c.fillStyle = g; c.fillRect(0, 0, w, h); }).tex;
  const bG = new THREE.CylinderGeometry(0.11, 0.06, 1.1, 32, 1, true); bG.translate(0, 0.55, 0);
  const beacon = new THREE.Mesh(bG, new THREE.MeshBasicMaterial({ map: beamTex, color: 0xff3048, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  beacon.position.set(WP[3][0], WY[3], WP[3][1]); scene.add(beacon);
  const beaconGlow = glow(0xff2a40, 0.9, 0, 0.35); beaconGlow.position.set(WP[3][0], WY[3] + 0.12, WP[3][1]); scene.add(beaconGlow);

  // ----------------------------------------------------------- travelers
  // Each one starts at the first marker; most leave the route at the second or third, the rest finish.
  const TRV = [];
  for (let i = 0; i < N; i++) {
    const r = rnd(i, 7), sp = 0.85 + rnd(i, 8) * 0.3;
    const start = 3.0 + i * 0.041 + rnd(i, 9) * 0.02, dur = TR / sp;
    TRV.push({ start, dur, stop: r < 0.38 ? 1 : r < 0.66 ? 2 : 3, side: rnd(i, 10) > 0.5 ? 1 : -1, lane: (rnd(i, 11) - 0.5) * 0.035, slot: -1 });
  }
  TRV.filter((d) => d.stop === 3).sort((a, b) => a.start + a.dur - (b.start + b.dur)).forEach((d, j) => { d.slot = j; });
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.013, 10, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), N);
  dots.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  for (let i = 0; i < N; i++) dots.setColorAt(i, new THREE.Color(0, 0, 0));
  scene.add(dots);
  const gPos = new Float32Array(N * 3), gCol = new Float32Array(N * 3);
  const gGeo = new THREE.BufferGeometry(); gGeo.setAttribute('position', new THREE.BufferAttribute(gPos, 3)); gGeo.setAttribute('color', new THREE.BufferAttribute(gCol, 3));
  const soft = canvasTex(64, 64, (c, w) => { const g = c.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = g; c.fillRect(0, 0, w, w); }).tex;
  const dGlow = new THREE.Points(gGeo, new THREE.PointsMaterial({ map: soft, size: 0.075, vertexColors: true, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  dGlow.frustumCulled = false; scene.add(dGlow);
  const COOL = new THREE.Color(0.82, 0.9, 1.0), DIM = new THREE.Color(0.2, 0.25, 0.34), RED = new THREE.Color(1.0, 0.13, 0.2), GOLD_ON = new THREE.Color(1.2, 0.85, 0.3);
  // Haze in the lamp light.
  const HN = 150, hPos = new Float32Array(HN * 3);
  const hGeo = new THREE.BufferGeometry(); hGeo.setAttribute('position', new THREE.BufferAttribute(hPos, 3));
  const haze = new THREE.Points(hGeo, new THREE.PointsMaterial({ color: 0xffdcb0, size: 0.009, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }));
  haze.frustumCulled = false; scene.add(haze);

  // ----------------------------------------------------------- the pitch card
  const card = new THREE.Group(); scene.add(card);
  const cardSlab = mesh(new RoundedBoxGeometry(1.74, 0.64, 0.03, 3, 0.025), std(0x0e1730, { roughness: 0.35, metalness: 0.3 }), { cast: false });
  card.add(cardSlab);
  const cardTex = canvasTex(1024, 376, (c, w, h) => {
    c.strokeStyle = 'rgba(201,161,74,0.9)'; c.lineWidth = 3; roundRect(c, 14, 14, w - 28, h - 28, 14); c.stroke();
    c.textBaseline = 'middle';
    c.fillStyle = '#e8bf5a'; c.font = `700 30px ${MONO}`; if ('letterSpacing' in c) c.letterSpacing = '8px'; c.fillText('US MARINE CORPS', 60, 78);
    if ('letterSpacing' in c) c.letterSpacing = '0px';
    c.fillStyle = '#d61a32'; c.fillRect(60, 112, 90, 6);
    c.fillStyle = '#f4f1ea'; fitFont(c, 'Marine Corps pitch', w - 120, 96, `800 #px ${SANS}`); c.fillText('Marine Corps pitch', 56, 188);
    c.fillStyle = 'rgba(232,236,245,0.82)'; fitFont(c, 'UX team contribution to a new business pitch.', w - 120, 40, `600 #px ${SANS}`); c.fillText('UX team contribution to a new business pitch.', 60, 284);
  }).tex;
  const cardFace = new THREE.Mesh(new THREE.PlaneGeometry(1.74, 0.64), new THREE.MeshBasicMaterial({ map: cardTex, transparent: true, depthWrite: false, toneMapped: false }));
  cardFace.position.z = 0.016; card.add(cardFace);

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [-1.95, 0.4, 1.3]], [2.3, [-1.55, 0.52, 1.42], (x) => x],
    [4.6, [-0.35, 0.78, 1.8]], [6.6, [0.85, 1.05, 2.05]],
    [8.2, [0.15, 1.45, 3.0]], [10, [0.05, 1.5, 3.15], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.75, 0.08, 0.1]], [2.3, [-0.5, 0.07, 0.05], (x) => x],
    [4.6, [0.15, 0.06, -0.02]], [6.6, [0.6, 0.14, -0.22]],
    [8.2, [0.05, 0.27, -0.42]], [10, [0.0, 0.28, -0.45], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), m4 = new THREE.Matrix4(), q4 = new THREE.Quaternion(), s4 = new THREE.Vector3(), p4 = new THREE.Vector3();
  const pa = new THREE.Vector3(), la = new THREE.Vector3(), col = new THREE.Color();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 0.9) * 0.008, p[1] + Math.sin(t * 1.4 + 1) * 0.005, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.35), k(t, 9.55, 10)));

    // The lamp warms up with a stutter, then sways a little on its cord, so the shadows breathe.
    const warm = t < 0.25 ? 0.15 : t < 0.7 ? (rnd(Math.floor(t * 24), 5) > 0.35 ? 0.9 : 0.3) : 1;
    lamp.rotation.set(Math.sin(t * 0.7 + 1) * 0.025, 0, Math.sin(t * 0.9) * 0.035);
    lamp.updateMatrixWorld();
    bulb.getWorldPosition(key.position);
    key.intensity = 5.6 * warm;
    bulbGlow.material.opacity = 0.85 * warm;
    beam.material.opacity = 0.05 * warm;

    // Markers rise out of the ground with a spring, gold rings flash as the route reaches them.
    const drawn = eio(k(t, DRAW0, DRAW1));
    for (let i = 0; i < 4; i++) {
      const r = spring(k(t, PIN_UP[i], PIN_UP[i] + 0.8));
      m4.compose(p4.set(WP[i][0], WY[i] - 0.27 * (1 - r), WP[i][1]), q4.identity(), s4.set(1, 1, 1)); poles.setMatrixAt(i, m4);
      q4.setFromAxisAngle(up, t * 0.8 + i);
      m4.compose(p4.set(WP[i][0], WY[i] + 0.26 - 0.27 * (1 - r), WP[i][1]), q4, s4.set(1, 1.3, 1)); gem.setMatrixAt(i, m4);
      const hit = i === 0 ? k(t, PIN_UP[0] + 0.3, PIN_UP[0] + 0.6) : clamp((drawn - UW[i]) * 40);
      const ring = back(k(t, PIN_UP[i], PIN_UP[i] + 0.5));
      m4.compose(p4.set(WP[i][0], WY[i] + 0.004, WP[i][1]), q4.identity(), s4.setScalar(Math.max(0.001, ring * (1 + 0.15 * Math.sin(t * 3 + i))))); rings.setMatrixAt(i, m4);
      col.setRGB(0.35, 0.27, 0.12).lerp(i === 3 && t > 5 ? RED : GOLD_ON, hit);
      rings.setColorAt(i, col);
      pinGlows[i].position.set(WP[i][0], WY[i] + 0.26 - 0.27 * (1 - r), WP[i][1]);
      pinGlows[i].material.opacity = (0.25 + 0.6 * hit * Math.exp(-3 * Math.max(0, t - PIN_UP[i] - 1))) * r;
    }
    poles.instanceMatrix.needsUpdate = true; gem.instanceMatrix.needsUpdate = true; rings.instanceMatrix.needsUpdate = true; rings.instanceColor.needsUpdate = true;

    // The route draws itself across the ground.
    const cnt = Math.floor(drawn * SEG) * RAD * 6;
    tubeG.setDrawRange(0, cnt); haloG.setDrawRange(0, cnt);
    tube.visible = halo.visible = cnt > 0;
    sample(drawn, tip.position); tip.position.y += 0.01;
    tip.material.opacity = drawn > 0 && drawn < 1 ? 0.95 : 0;

    // Travelers: run the route, peel away at their marker and settle, or finish in scarlet.
    let done = 0;
    for (let i = 0; i < N; i++) {
      const d = TRV[i], a = t - d.start;
      let sc = 0;
      if (a > 0) {
        const uStop = d.stop === 3 ? 1 : UW[d.stop];
        const tStop = uStop * d.dur, u = Math.min(a / d.dur, uStop);
        sample(u, pa, la);
        pa.addScaledVector(la, d.lane + Math.sin(t * 3 + i) * 0.004); pa.y += 0.009;
        sc = back(clamp(a / 0.25));
        if (a < tStop) col.copy(COOL);
        else if (d.stop < 3) {
          const e = eo(clamp((a - tStop) / 0.7));
          pa.addScaledVector(la, d.side * (0.05 + 0.08 * rnd(i, 12)) * e);
          pa.y = hgt(pa.x, pa.z) + 0.02;
          col.copy(COOL).lerp(DIM, e);
          sc *= lerp(1, 0.75, e);
        } else {
          done++;
          const e = eo(clamp((a - tStop) / 0.55));
          const ang = d.slot * 0.95 + t * 0.9, rad = 0.075;
          p4.set(WP[3][0] + Math.cos(ang) * rad, WY[3] + 0.04 + d.slot * 0.0065, WP[3][1] + Math.sin(ang) * rad);
          pa.lerp(p4, e); pa.y += Math.sin(Math.PI * e) * 0.05;
          col.copy(COOL).lerp(RED, clamp(e * 1.6));
        }
      } else pa.set(WP[0][0], WY[0], WP[0][1]);
      m4.compose(pa, q4.identity(), s4.setScalar(Math.max(0.001, sc))); dots.setMatrixAt(i, m4);
      dots.setColorAt(i, col);
      gPos[i * 3] = pa.x; gPos[i * 3 + 1] = pa.y; gPos[i * 3 + 2] = pa.z;
      const gl = a > 0 ? 1 : 0;
      gCol[i * 3] = col.r * gl * 0.7; gCol[i * 3 + 1] = col.g * gl * 0.7; gCol[i * 3 + 2] = col.b * gl * 0.7;
    }
    dots.instanceMatrix.needsUpdate = true; dots.instanceColor.needsUpdate = true;
    gGeo.attributes.position.needsUpdate = true; gGeo.attributes.color.needsUpdate = true;

    // Beacon: scarlet light builds as the column fills.
    const fill = clamp(done / 18);
    beacon.material.opacity = 0.55 * eo(fill) * (0.9 + 0.1 * Math.sin(t * 5));
    beacon.scale.set(1, lerp(0.3, 1, eo(fill)), 1);
    beaconGlow.material.opacity = 0.7 * eo(fill);
    red.position.set(WP[3][0], WY[3] + 0.18, WP[3][1]);
    red.intensity = 1.6 * eo(fill);

    // The pitch card rises from behind the table and settles.
    const c1 = back(k(t, CARD, CARD + 0.75));
    card.position.set(0, lerp(-0.28, 0.46, c1) + Math.sin((t - CARD) * 1.1) * 0.006 * (c1 >= 1 ? 1 : 0), -1.36);
    card.lookAt(camera.position.x, lerp(card.position.y, camera.position.y, 0.4), camera.position.z);
    cardFace.material.opacity = eo(k(t, CARD + 0.2, CARD + 0.7));
    card.visible = t > CARD;

    // Haze drifting through the lamp light.
    for (let i = 0; i < HN; i++) {
      const r = Math.sqrt(rnd(i, 21)) * 0.85, a = rnd(i, 22) * 6.283 + t * 0.05, y = 0.15 + rnd(i, 23) * 1.7;
      hPos[i * 3] = lamp.position.x + Math.cos(a) * r * ((2.15 - y) / 2) + Math.sin(t * 0.3 + i) * 0.04;
      hPos[i * 3 + 1] = y + Math.sin(t * 0.4 + i * 1.3) * 0.05;
      hPos[i * 3 + 2] = lamp.position.z + Math.sin(a) * r * ((2.15 - y) / 2);
    }
    hGeo.attributes.position.needsUpdate = true;
  }

  return { scene, camera, update, duration: D, poster: 8.5 };
}
