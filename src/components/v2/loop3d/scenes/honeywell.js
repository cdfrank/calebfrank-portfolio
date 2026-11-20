// Honeywell product selector lit loop, 10 s. "Selling a valve like a pair of sneakers."
// A product-drop stage: a ball valve lands on a lit turntable like a new sneaker. A guided selector
// asks four plain questions; each answer narrows the catalog and lights the part it decides. On the
// trim question the valve cuts away to show its ball glowing blue, then a single match is found and
// the handle turns closed with a click.
import {
  THREE, k, kf, lerp, eo, eio, ei, back, spring, rnd, clamp,
  canvasTex, grainTex, glow, roundRect, std, mesh, dip,
} from '../kit.js';

const D = 10;
const RED = 0xe4002b, BLUE = 0x2f8bff;
const FIELDS = [['Line size', '1 in'], ['End connection', 'Threaded'], ['Valve trim', 'Stainless'], ['Flow rate', 'Cv 10']];
const SET = [2.55, 3.3, 4.75, 5.55];      // when each answer locks
const MATCH = [214, 48, 12, 3, 1];          // parts left after each answer

export function build({ env }) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x030407);
  scene.fog = new THREE.Fog(0x030407, 2.6, 7.5);
  scene.environment = env;
  scene.environmentIntensity = 0.7;
  const camera = new THREE.PerspectiveCamera(30, 16 / 10, 0.02, 30);
  scene.add(camera);
  const setDip = dip(camera);

  // ----------------------------------------------------------- stage
  const floor = mesh(new THREE.PlaneGeometry(14, 14), std(0xffffff, { map: grainTex('#0b0c10', { size: 256, speck: 0.05, blot: 0.06, seed: 4, repeat: 8 }), roughness: 0.22, metalness: 0.55 }), { cast: false });
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const ped = mesh(new THREE.CylinderGeometry(0.46, 0.5, 0.16, 64), std(0x0b0c10, { roughness: 0.18, metalness: 0.6 }));
  ped.position.y = 0.08; scene.add(ped);
  const plate = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.012, 64), std(0x15171d, { roughness: 0.35, metalness: 0.8 }));
  plate.position.y = 0.166; scene.add(plate);
  const ringM = new THREE.MeshBasicMaterial({ color: RED, toneMapped: false });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.462, 0.006, 8, 96), ringM);
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.162; scene.add(ring);
  const ringGlow = glow(RED, 1.6, 0.25, 0.55); ringGlow.position.set(0, 0.17, 0); ringGlow.scale.set(1.6, 0.35, 1); scene.add(ringGlow);
  // Light strips behind the stage: they give the metal something to reflect.
  [-1.5, -0.5, 0.5, 1.5].forEach((x, i) => {
    const s = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 2.4), new THREE.MeshBasicMaterial({ color: i % 3 ? 0xcfd8ff : 0xffe2c8, toneMapped: false }));
    s.position.set(x * 1.3, 1.2, -2.6 - Math.abs(x) * 0.2); scene.add(s);
    const g = glow(i % 3 ? 0x8aa8ff : 0xffc9a0, 1.4, 0.35, 0.5); g.position.copy(s.position); g.scale.set(0.6, 3.2, 1); scene.add(g);
  });

  // ----------------------------------------------------------- lights
  scene.add(new THREE.HemisphereLight(0x8a96c0, 0x050508, 0.25));
  const key = new THREE.SpotLight(0xffffff, 0, 0, 0.42, 0.65, 1.3);
  key.position.set(-0.7, 2.6, 1.3); key.target.position.set(0, 0.3, 0);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1; key.shadow.camera.far = 5; key.shadow.bias = -0.0002; key.shadow.normalBias = 0.01;
  scene.add(key, key.target);
  const rimL = new THREE.DirectionalLight(0x5f86ff, 1.6); rimL.position.set(-2, 1.2, -2); scene.add(rimL);
  const rimR = new THREE.DirectionalLight(0xffb27a, 1.2); rimR.position.set(2.2, 0.9, -1.6); scene.add(rimR);
  const ballLight = new THREE.PointLight(BLUE, 0, 0.8, 1.6); scene.add(ballLight);

  // ----------------------------------------------------------- the valve (axis along x)
  const valve = new THREE.Group();
  const spin = new THREE.Group(); spin.add(valve); scene.add(spin);
  const cut = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
  const steel = std(0xc4c8ce, { metalness: 1, roughness: 0.28, clippingPlanes: [cut], side: THREE.DoubleSide, envMapIntensity: 1.2 });
  const inner = std(0x2a2d33, { metalness: 0.8, roughness: 0.5, side: THREE.BackSide });
  const prof = [[0.052, -0.19], [0.07, -0.18], [0.074, -0.13], [0.105, -0.085], [0.122, -0.03], [0.124, 0], [0.122, 0.03], [0.105, 0.085], [0.074, 0.13], [0.07, 0.18], [0.052, 0.19]].map(([r, y]) => new THREE.Vector2(r, y));
  const bodyGeo = new THREE.LatheGeometry(prof, 64);
  const body = mesh(bodyGeo, steel); body.rotation.z = Math.PI / 2; valve.add(body);
  const shell = new THREE.Mesh(bodyGeo, inner); shell.rotation.z = Math.PI / 2; shell.scale.setScalar(0.96); valve.add(shell);
  // Hex end connections and the pipe stubs they thread onto.
  const nutM = std(0xb9bec6, { metalness: 1, roughness: 0.34, clippingPlanes: [cut], side: THREE.DoubleSide, emissive: BLUE, emissiveIntensity: 0 });
  const nuts = [-1, 1].map((sd) => {
    const n = mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.075, 6), nutM);
    n.rotation.z = Math.PI / 2; n.position.x = sd * 0.215; valve.add(n);
    const p = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.2, 32), std(0x8c9098, { metalness: 0.9, roughness: 0.45 }));
    p.rotation.z = Math.PI / 2; p.position.x = sd * 0.34; valve.add(p);
    const bore = new THREE.Mesh(new THREE.CircleGeometry(0.04, 24), new THREE.MeshBasicMaterial({ color: 0x050506 }));
    bore.rotation.y = sd * Math.PI / 2; bore.position.x = sd * 0.4405; valve.add(bore);
    return n;
  });
  // The ball and its seats: what the trim question is really about.
  const ballM = std(0xdfe4ea, { metalness: 1, roughness: 0.12, emissive: BLUE, emissiveIntensity: 0 });
  const ball = mesh(new THREE.SphereGeometry(0.09, 48, 32), ballM); valve.add(ball);
  const boreM = new THREE.Mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.186, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0x07080a, side: THREE.DoubleSide }));
  boreM.rotation.z = Math.PI / 2; ball.add(boreM);
  [-1, 1].forEach((sd) => { const s = mesh(new THREE.TorusGeometry(0.075, 0.012, 10, 40), std(0xf2f0ea, { roughness: 0.6 })); s.rotation.y = Math.PI / 2; s.position.x = sd * 0.083; valve.add(s); });
  const ballGlow = glow(BLUE, 0.6, 0, 0.35); valve.add(ballGlow);
  // Stem, packing nut and the lever with its red grip.
  const stem = mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.12, 20), std(0xc9cdd3, { metalness: 1, roughness: 0.3 })); stem.position.y = 0.16; valve.add(stem);
  const pack = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.035, 6), std(0xb9bec6, { metalness: 1, roughness: 0.32 })); pack.position.y = 0.14; valve.add(pack);
  const lever = new THREE.Group(); lever.position.y = 0.215; valve.add(lever);
  const arm = mesh(new THREE.BoxGeometry(0.34, 0.016, 0.042), std(0xc4c8ce, { metalness: 1, roughness: 0.3 })); arm.position.x = 0.14; lever.add(arm);
  const grip = mesh(new THREE.CapsuleGeometry(0.03, 0.17, 8, 16), std(RED, { roughness: 0.38 })); grip.rotation.z = Math.PI / 2; grip.position.x = 0.23; lever.add(grip);
  const capNut = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 6), std(0xb9bec6, { metalness: 1, roughness: 0.3 })); capNut.position.y = 0.018; lever.add(capNut);
  valve.position.y = 0.17 + 0.12;

  // ----------------------------------------------------------- selector panel and the match card
  const panelTex = canvasTex(560, 720);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.72), new THREE.MeshBasicMaterial({ map: panelTex.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(panel);
  const matchTex = canvasTex(520, 300);
  const card = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.265), new THREE.MeshBasicMaterial({ map: matchTex.tex, transparent: true, toneMapped: false, depthWrite: false }));
  scene.add(card);
  matchTex.redraw((c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = 'rgba(14,18,28,0.86)'; roundRect(c, 4, 4, w - 8, h - 8, 26); c.fill();
    c.strokeStyle = 'rgba(47,139,255,0.9)'; c.lineWidth = 3; c.stroke();
    c.fillStyle = '#2f8bff'; c.beginPath(); c.arc(56, 62, 24, 0, 7); c.fill();
    c.strokeStyle = '#fff'; c.lineWidth = 5; c.beginPath(); c.moveTo(45, 62); c.lineTo(53, 71); c.lineTo(68, 52); c.stroke();
    c.fillStyle = '#fff'; c.font = '800 34px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText('Your match', 96, 62);
    c.fillStyle = 'rgba(255,255,255,0.86)'; c.font = '600 24px Inter, system-ui, sans-serif'; c.fillText('Ball valve · 1 in · stainless trim', 34, 140);
    c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = '600 20px Inter, system-ui, sans-serif'; c.fillText('Fits your system  ·  ready to quote', 34, 182);
    c.fillStyle = '#2f8bff'; roundRect(c, 34, 220, 200, 50, 25); c.fill();
    c.fillStyle = '#fff'; c.font = '700 22px Inter, system-ui, sans-serif'; c.textAlign = 'center'; c.fillText('Add to quote', 134, 246); c.textAlign = 'left';
  });

  let pKey = '';
  const drawPanel = (t) => {
    const done = SET.filter((s) => t > s).length;
    const active = done < 4 ? done : -1;
    const n = MATCH[done];
    const tick = SET.map((s) => k(t, s, s + 0.35));
    const live = tick.some((x) => x > 0 && x < 1) || (t > 1.6 && t < 2.3);
    const key = [done, live ? Math.round(t * 30) : 0].join('|');
    if (key === pKey) return; pKey = key;
    panelTex.redraw((c, w, h) => {
      c.clearRect(0, 0, w, h);
      c.fillStyle = 'rgba(12,15,22,0.82)'; roundRect(c, 4, 4, w - 8, h - 8, 28); c.fill();
      c.strokeStyle = 'rgba(255,255,255,0.14)'; c.lineWidth = 2; c.stroke();
      c.fillStyle = '#fff'; c.font = '800 34px Inter, system-ui, sans-serif'; c.textBaseline = 'middle'; c.fillText('Find your valve', 34, 56);
      c.fillStyle = 'rgba(255,255,255,0.55)'; c.font = '600 19px Inter, system-ui, sans-serif'; c.fillText('Start from the job, not a part number', 34, 92);
      FIELDS.forEach(([lab, val], i) => {
        const y = 140 + i * 112, on = i === active, set = i < done, p = eo(tick[i]);
        c.fillStyle = on ? 'rgba(47,139,255,0.16)' : 'rgba(255,255,255,0.05)'; roundRect(c, 26, y, w - 52, 92, 18); c.fill();
        if (on) { c.strokeStyle = 'rgba(47,139,255,0.95)'; c.lineWidth = 3; c.stroke(); }
        c.fillStyle = on ? '#8cbcff' : 'rgba(255,255,255,0.55)'; c.font = '700 17px Inter, system-ui, sans-serif'; c.fillText(lab.toUpperCase(), 48, y + 28);
        if (set) {
          c.globalAlpha = p; c.fillStyle = '#fff'; c.font = '700 28px Inter, system-ui, sans-serif'; c.fillText(val, 48 + (1 - p) * 20, y + 62); c.globalAlpha = 1;
          c.fillStyle = '#2f8bff'; c.beginPath(); c.arc(w - 64, y + 46, 16 * back(tick[i]), 0, 7); c.fill();
          if (tick[i] > 0.5) { c.strokeStyle = '#fff'; c.lineWidth = 4; c.beginPath(); c.moveTo(w - 72, y + 46); c.lineTo(w - 66, y + 52); c.lineTo(w - 56, y + 40); c.stroke(); }
        } else {
          c.fillStyle = 'rgba(255,255,255,0.28)'; c.font = '600 24px Inter, system-ui, sans-serif'; c.fillText(on ? 'Choose…' : '—', 48, y + 62);
        }
      });
      c.fillStyle = 'rgba(255,255,255,0.1)'; c.fillRect(26, h - 112, w - 52, 2);
      c.fillStyle = n === 1 ? '#8cbcff' : '#fff'; c.font = '800 44px Inter, system-ui, sans-serif'; c.fillText(String(n), 34, h - 62);
      const nw = c.measureText(String(n)).width;
      c.fillStyle = 'rgba(255,255,255,0.6)'; c.font = '600 20px Inter, system-ui, sans-serif'; c.fillText(n === 1 ? 'part fits' : 'parts still fit', 34 + nw + 14, h - 60);
    });
  };

  // ----------------------------------------------------------- camera
  const camPos = (t) => kf(t, [
    [0, [0.25, 0.62, 2.05]], [2.6, [0.12, 0.55, 1.85], (x) => x],
    [4.2, [0.32, 0.46, 1.18]], [6.6, [0.22, 0.43, 1.06], (x) => x],
    [8.2, [0.02, 0.6, 2.0]], [10, [-0.06, 0.64, 2.15], (x) => x],
  ]);
  const camTgt = (t) => kf(t, [
    [0, [-0.08, 0.36, 0]], [2.6, [-0.2, 0.38, 0], (x) => x],
    [4.2, [0.02, 0.31, 0]], [6.6, [0.02, 0.31, 0], (x) => x],
    [8.2, [0.0, 0.42, 0]], [10, [0.0, 0.43, 0], (x) => x],
  ]);
  const tgt = new THREE.Vector3(), cpos = new THREE.Vector3(), n = new THREE.Vector3(), ctr = new THREE.Vector3();

  function update(t) {
    const p = camPos(t), q = camTgt(t);
    camera.position.set(p[0] + Math.sin(t * 1.2) * 0.006, p[1] + Math.sin(t * 1.7 + 1) * 0.004, p[2]);
    tgt.set(q[0], q[1], q[2]); camera.lookAt(tgt);
    setDip(Math.max(1 - k(t, 0, 0.3), k(t, 9.55, 10)));

    // Drop: key light snaps on, the valve lands on the turntable with a spring.
    key.intensity = 34 * clamp(back(k(t, 0.15, 0.7)));
    const land = spring(k(t, 0.35, 1.35));
    valve.position.y = 0.29 + (1 - land) * 0.9;
    spin.rotation.y = -0.85 + t * 0.13 - eio(k(t, 3.6, 4.4)) * 0.2 + eio(k(t, 6.2, 7.0)) * 0.2;
    valve.rotation.z = (1 - land) * 0.4;

    // Panel slides in beside the stage, answers lock in turn.
    const pin = eo(k(t, 1.5, 2.2)), pout = ei(k(t, 8.6, 9.3));
    panel.position.set(-0.56 - (1 - pin) * 0.25 - pout * 0.2, 0.43, 0.18);
    panel.lookAt(camera.position.x, panel.position.y, camera.position.z);
    panel.material.opacity = pin * (1 - pout);
    panel.visible = pin > 0.01;
    drawPanel(t);

    // Connection answer: the end nuts light blue. Trim answer: cutaway reveals the ball, glowing.
    nutM.emissiveIntensity = 0.9 * Math.sin(Math.PI * k(t, 3.3, 4.2));
    const open = eio(k(t, 3.85, 4.6)) * (1 - eio(k(t, 6.25, 6.95)));
    camera.getWorldPosition(cpos); valve.getWorldPosition(ctr);
    n.set(ctr.x - cpos.x, 0, ctr.z - cpos.z).normalize();
    cut.normal.copy(n); cut.constant = -n.dot(ctr) + (1 - open) * 0.7 - open * 0.004;
    nuts.forEach((nt, i) => { nt.position.x = (i ? 1 : -1) * (0.215 + open * 0.07); });
    const trim = Math.sin(Math.PI * k(t, 4.45, 6.6));
    ballM.emissiveIntensity = 1.4 * trim;
    ballGlow.material.opacity = 0.85 * trim * open;
    ball.getWorldPosition(ballLight.position); ballLight.intensity = 1.2 * trim;
    ball.rotation.y = eio(k(t, 7.25, 7.75)) * Math.PI / 2;

    // Match: the handle turns a quarter closed, the ring flips from red to blue, the card pops.
    lever.rotation.y = -back(k(t, 7.25, 7.75)) * Math.PI / 2;
    const m = back(k(t, 7.0, 7.5)), mout = ei(k(t, 8.9, 9.4));
    card.position.set(0.46, 0.62 - (1 - m) * 0.06, 0.12);
    card.lookAt(camera.position.x, card.position.y, camera.position.z);
    card.scale.setScalar(Math.max(0.001, m * (1 - mout * 0.1)));
    card.material.opacity = clamp(m) * (1 - mout);
    card.visible = m > 0.01;
    const blue = eo(k(t, 7.25, 7.6));
    ringM.color.setRGB(lerp(0.89, 0.18, blue), lerp(0, 0.55, blue), lerp(0.17, 1, blue));
    ringGlow.material.color.copy(ringM.color);
    ringGlow.material.opacity = 0.25 + 0.5 * Math.exp(-6 * Math.max(0, t - 7.3)) * (t > 7.3 ? 1 : 0) + 0.25 * clamp(back(k(t, 0.3, 0.9))) - 0.25;
  }

  return { scene, camera, update, duration: D, poster: 5.2 };
}
