// Restaged scenes, batch two: GM design system, STELLA alerts, Test Drive MyWay.
import { THREE, C, k, eo, eio, back, lerp, rnd, kf, pop, at, box, cyl, sphere, torus, prism, extrude, pawn, house, car, tube, inst, dummy, face, tag, own, cursor3d } from './engine.js';
import { row } from './scenes_a.js';

const PI = Math.PI;
export const V3 = {};

// ================================================================ GM design system: three rulebooks become one
function page(S, bandMat, variant, name) {
  const g = new THREE.Group();
  g.add(box(3.6, 5, 0.18, C.white));
  const band = at(box(3.2, 1.4, 0.08, C.ink, { material: bandMat }), 0, 1.45, 0.13, g);
  if (name) at(face(S, name, { size: 0.3, mono: true, color: '#ffffff', align: 'left' }), -1.4, 0.3, 0.05, band);
  const hw = [[2.4, 0.34], [1.6, 0.26], [2.8, 0.44], [2.2, 0.3]][variant];
  at(box(hw[0], hw[1], 0.05, C.ink, { edge: false }), -1.6 + hw[0] / 2, 0.35, 0.12, g);
  [0, 1].forEach((r) => at(row([2.6, 2][r], 0, C.dim, 0.13), -1.6 + [2.6, 2][r] / 2, -0.15 - r * [0.32, 0.5, 0.26, 0.38][variant], 0.11, g));
  const btn = at(new THREE.Group(), -0.45, -1.7, 0.18, g);
  if (variant === 0) btn.add(box(2, 0.56, 0.2, C.ink));
  if (variant === 1) { btn.add(box(1.2, 0.5, 0.2, C.mid)); [-0.6, 0.6].forEach((x) => { const c = at(cyl(0.25, 0.2, C.mid), x, 0, 0, btn); c.rotation.x = PI / 2; }); }
  if (variant === 2) { btn.add(box(1.9, 0.72, 0.2, C.dim)); [-0.95, 0.95].forEach((x) => { const c = at(cyl(0.36, 0.2, C.dim), x, 0, 0, btn); c.rotation.x = PI / 2; }); }
  if (variant === 3) { btn.add(box(1.5, 0.5, 0.2, bandMat.color.getHex() === C.ink ? C.ink : C.ink, { material: bandMat })); [-0.75, 0.75].forEach((x) => { const c = at(cyl(0.25, 0.2, C.ink, { material: bandMat }), x, 0, 0, btn); c.rotation.x = PI / 2; }); }
  g.btn = btn; g.band = band;
  const w = new THREE.Group(); w.add(g); w.inner = g; return w;
}
V3['general-motors-global-design-system'] = {
  client: 'General Motors', title: "One design language across GM's brands", question: 'Same company. Why three different buttons?', result: 'One set of rules. Chevrolet, GMC and Buick each keep their voice.', warp: 1,
  acts: [[0, ''], [9, ''], [19, '']], sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-2.5, 1.1, 12.5], [0, 3.1, 0], 52], [8.8, [2.5, 1.5, 11.5], [0, 3.1, 0], 52], [9, [0, 3.2, 14.5], [0, 2.9, 0], 38], [18.8, [2.5, 3.4, 13], [0, 2.9, 0], 38], [19, [0, 2.6, 16.5], [0, 2.9, 0], 40], [25.6, [-1.5, 3.4, 18], [0, 2.9, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31);
    const inkM = own(C.ink), three = [0, 1, 2].map((i) => { const p = at(page(S, inkM, i), (i - 1) * 4.4, 2.9, 0, g1); p.rotation.y = (1 - i) * 0.22; return p; });
    S.hero('3', 'brands · 3 different buttons', 3.6, 8.7);
    const ghosts = [0, 1, 2].map((i) => at(page(S, inkM, i), (i - 1) * 4.4, 2.9, 0, g2));
    const one = at(page(S, inkM, 3), 0, 2.9, 0, g2);
    const toks = [];
    const tk = (build, from, to, t0) => { const w = at(new THREE.Group(), 0, 0, 0, g2); build(w); Object.assign(w, { from, to, t0 }); toks.push(w); };
    tk((w) => [0, 1, 2].forEach((j) => { const b = j === 0 ? box(0.5, 0.5, 0.2, C.white) : cyl(0.26, 0.2, C.white, { seg: j === 1 ? 10 : 28 }); if (j) b.rotation.x = PI / 2; at(b, (j - 1) * 0.7, 0, 0, w); }), [-6, 5.2, 1], [-0.45, 1.2, 0.3], 11.2);
    tk((w) => [0, 1, 2, 3, 4].forEach((j) => at(box(0.12, 0.5, 0.2, C.ink), (j - 2) * 0.32, 0, 0, w)), [6, 4.4, 1], [0, 2.75, 0.3], 12.6);
    tk((w) => [0, 1, 2].forEach((j) => at(box([1.6, 1.2, 0.8][j], [0.18, 0.13, 0.09][j], 0.2, C.ink), 0, 0.22 - j * 0.22, 0, w)), [-6.2, 1.5, 1], [-0.4, 3.3, 0.3], 14);
    tk((w) => [C.ink, C.mid, C.dim].forEach((c, j) => at(sphere(0.22, c), (j - 1) * 0.6, 0, 0, w)), [6.2, 1.2, 1], [0.6, 0.9, 0.3], 15.4);
    S.caption('One set of rules.', 11.2, 14.8); S.caption('Every brand builds with it.', 15, 18.8);
    const skins = [[C.ink, 'CHEVROLET'], [C.red, 'GMC'], [C.mid, 'BUICK']].map(([c, n], i) => { const p = at(page(S, own(c), 3, n), 0, 2.9, -0.01 * i, g3); return p; });
    S.hero('1', 'set of rules · 3 brands', 20.4, 26); S.burst([0, 5.2, 0.6], 21.6, 16);
    return (t) => {
      three.forEach((p, i) => { pop(p, t, 0.2 + i * 0.25, 0.6); const hit = 3.8 + i * 0.9; p.inner.btn.scale.setScalar(1 + Math.sin(k(t, hit, hit + 0.5) * PI) * 0.45); p.inner.rotation.z = Math.sin(k(t, hit, hit + 0.6) * PI * 3) * 0.04; });
      const m = eio(k(t, 9.1, 10.4));
      ghosts.forEach((p, i) => { p.visible = t < 10.5; p.position.x = lerp((i - 1) * 4.4, 0, m); p.position.z = -i * 0.05; });
      one.visible = t >= 10.4; one.inner.scale.setScalar(1 + Math.sin(k(t, 10.4, 10.8) * PI) * 0.06 + toks.reduce((s, w) => s + Math.sin(k(t, w.t0 + 1, w.t0 + 1.3) * PI) * 0.03, 0));
      toks.forEach((w) => { const p = eio(k(t, w.t0, w.t0 + 1)); w.visible = t > w.t0 && t < w.t0 + 1.15; w.position.set(lerp(w.from[0], w.to[0], p), lerp(w.from[1], w.to[1], p) + Math.sin(p * PI) * 1.2, lerp(w.from[2], w.to[2], p)); w.rotation.y = (1 - p) * 3; w.scale.setScalar(lerp(1.4, 0.8, p)); });
      skins.forEach((p, i) => { const f = eo(k(t, 19.3 + i * 0.35, 20.3 + i * 0.35)); p.position.x = lerp(0, (i - 1) * 4.3, i === 1 ? 0 : f); p.rotation.y = lerp(0, (1 - i) * 0.12, f); pop(p, t, 19.1, 0.5); p.position.y = 2.9 + (i === 1 ? Math.sin(k(t, 21.4, 21.9) * PI) * 0.4 : 0); });
    };
  },
};

// ================================================================ STELLA alerts: the tower of follow-ups becomes a queue
V3['stella-alert-rework'] = {
  client: 'STELLA Automotive AI', title: 'Strip, tile, button: alerts that say what to do next', question: 'Which one first?', result: 'Every alert says what to do next. A design study, not yet shipped.', warp: 1,
  acts: [[0, ''], [9, ''], [19, '']], sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-3.5, 1.1, 13], [1, 3.4, 0], 50], [8.8, [2, 1, 11], [2, 3.6, 0], 50], [9, [-3, 3, 16], [0, 2.2, 0], 40], [18.8, [2.5, 3.2, 15], [0, 2.2, 0], 40], [19, [3, 2.8, 14.5], [0.4, 2.3, 0], 40], [25.6, [-1, 3, 15.5], [0, 2.3, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g = S.group(9, 31);
    const dev = at(new THREE.Group(), -4.2, 2.4, 0, g1); dev.add(box(4.4, 2.9, 0.3, C.white)); dev.rotation.y = 0.3;
    const dot = at(cyl(0.3, 0.12, C.ink), -1.6, 0.9, 0.2, dev); dot.rotation.x = PI / 2;
    const wave = Array.from({ length: 14 }, (_, i) => at(box(0.13, 1.4, 0.13, C.ink), -1.75 + i * 0.27, -0.4, 0.22, dev));
    const N = 16, tower = Array.from({ length: N }, (_, i) => { const b = at(box(3.4, 0.36, 1.1, C.white), 0, 0, 0, g1); at(sphere(0.12, C.ink), -1.45, 0.2, 0.3, b); b.y = 0.2 + i * 0.4; b.x = 3 + Math.sin(i * 0.5) * 0.25 + i * 0.07; b.r = (rnd(i) - 0.5) * 0.5; return b; });
    const me = at(pawn(C.white, 0.8), 0.6, 0, 1.6, g1);
    S.caption('Every call leaves a follow-up.', 3.6, 8.7);
    const sm = own(C.ink), strip = at(box(10.4, 0.8, 0.5, C.ink, { material: sm }), 0, 5.5, 0, g), sl = at(face(S, '3 FOLLOW-UPS NEED YOU', { size: 0.34, mono: true, align: 'left', color: '#ffffff' }), -4.9, 0, 0.27, strip);
    const slotY = [3.95, 2.45, 0.95], info = [['ADVISOR CALLBACK', 'CALL BACK', C.ink, 2, 20.4], ['CONFIRM APPOINTMENT', 'CONFIRM', C.mid, 0, 21.9], ['SEND RECALL TEXT', 'TEXT', C.dim, 1, 23.4]];
    const tiles = info.map(([title, btn, col, start, done], i) => {
      const w = at(new THREE.Group(), 0, 0, 0, g); w.add(box(10.4, 1.25, 0.4, C.white)); at(box(0.3, 1.25, 0.44, col, { edge: false }), -5.05, 0, 0, w);
      at(face(S, title, { size: 0.32, mono: true, align: 'left' }), -4.6, 0, 0.22, w);
      const bm = own(C.ink), b = at(box(2.4, 0.76, 0.3, C.ink, { material: bm }), 3.7, 0, 0.3, w); at(face(S, btn, { size: 0.28, mono: true, color: '#ffffff' }), 0, 0, 0.16, b);
      Object.assign(w, { b, bm, start, done, i }); return w;
    });
    S.caption('Strip: what needs you.', 11.6, 14), S.caption('Tile: what happened.', 14.2, 16.4), S.caption('Button: what to do next.', 16.6, 18.8);
    const cur = at(cursor3d(), 0, 0, 0, g); S.billboards.push(cur); cur.scale.setScalar(1.3);
    const fin = at(new THREE.Group(), 0, 2.6, 0.5, g), fc = cyl(1.6, 0.3, C.red); fc.rotation.x = PI / 2; fin.add(fc); at(box(0.9, 0.26, 0.1, C.white, { edge: false }), -0.45, -0.25, 0.2, fin).rotation.z = -0.8; at(box(1.8, 0.26, 0.1, C.white, { edge: false }), 0.32, 0.12, 0.2, fin).rotation.z = 0.9;
    S.burst([0, 2.6, 1], 24.3, 22); info.forEach(([, , , , d]) => S.kicks.push(d - 0.35));
    return (t) => {
      pop(dev, t, 0.2, 0.6); wave.forEach((b, i) => { b.scale.y = t < 4 ? 0.2 + Math.abs(Math.sin(t * 5 + i * 0.9) * Math.sin(t * 1.7 + i * 0.4)) * 0.9 : 0.1; });
      tower.forEach((b, i) => { const a = 1.6 + i * 0.33, q = eo(k(t, a, a + 0.55)), lean = eio(k(t, 6.5, 8.8)) * 0.012 * i * i; b.visible = t > a; b.position.set(b.x + lean * 3, lerp(b.y + 9, b.y, q) - lean * 0.3, 0); b.rotation.set(0, b.r + (1 - q) * 2, -lean * 0.4); });
      pop(me, t, 0.6, 0.5, 1); me.rotation.y = Math.sin(t * 0.9) * 0.6;
      strip.position.y = lerp(11, 5.5, eo(k(t, 9.2, 9.9)));
      const left = t < info[0][4] ? 3 : t < info[1][4] ? 2 : t < info[2][4] ? 1 : 0;
      sl.set(left === 3 ? '3 FOLLOW-UPS NEED YOU' : left === 2 ? '2 FOLLOW-UPS NEED YOU' : left === 1 ? '1 FOLLOW-UP NEEDS YOU' : 'ALL CLEAR'); sm.color.set(left ? C.ink : C.mid);
      tiles.forEach((w) => {
        let y = kf(t, [[12.6, slotY[w.start]], [13.6, slotY[w.i]]]), slot = w.i;
        for (let j = 0; j < w.i; j++) { const tj = info[j][4] + 0.6; if (t > tj) { y = lerp(slotY[slot], slotY[slot - 1], eio(k(t, tj, tj + 0.5))); slot--; } }
        const inn = eo(k(t, 9.9 + w.start * 0.3, 10.6 + w.start * 0.3)), away = eio(k(t, w.done, w.done + 0.6)), cross = Math.sin(k(t, 12.6, 13.6) * PI) * (w.i - w.start);
        w.visible = inn > 0 && away < 1; w.position.set(lerp(-16, 0, inn) + away * 16, y, cross * 0.6 + away * 2); w.rotation.set(0, away * 1.2, -away * 0.4);
        w.b.position.z = 0.3 - Math.sin(k(t, w.done - 0.45, w.done - 0.15) * PI) * 0.22; w.bm.color.set(t > w.done - 0.35 ? C.red : C.ink);
      });
      const cp = kf(t, [[19.2, [7, 0.2]], [19.9, [4, 3.6]], [24, [4, 3.6]]]); cur.visible = t > 19.2 && t < 24; cur.position.set(cp[0], cp[1], 1.2);
      pop(fin, t, 24.2, 0.5); fin.rotation.y = (1 - back(k(t, 24.2, 24.9))) * 3;
    };
  },
};

// ================================================================ Test Drive MyWay: the dealership is far; the car comes to you
V3['gm-lab313-test-drive-myway'] = {
  client: 'GM Lab313', title: 'The test drive that came to you', question: 'What if the test drive came to me?', result: 'Live in 3 California cities with the Bolt EV in 2017.', warp: 1,
  acts: [[0, ''], [9, ''], [19, '']], sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-3.5, 1.4, 9], [-1, 1.8, -12], 48], [8.8, [-1.5, 2, 7.5], [-0.5, 1.6, -12], 48], [9, [0, 16, 12], [0, 0, 0], 35], [12.4, [0, 16, 12], [0, 0, 0], 35], [19, [5, 2.6, 13], [0, 1.4, 0], 40], [21.5, [1.5, 2.2, 11.5], [0.5, 1.4, 0], 40], [21.6, [1.5, 11, 10], [1.2, 0, 0.6], 35], [25.6, [2, 9.5, 8.5], [1.2, 0, 0.6], 35]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3a = S.group(19, 21.6), g3b = S.group(21.6, 31);
    const hs = at(house(1.3), -4.6, 0, -2.5, g1), me = at(pawn(C.white, 0.9), -2.6, 0, -0.6, g1);
    at(box(2.2, 0.03, 60, C.mid, { edge: false }), 0, 0.02, -24, g1);
    const dashes = Array.from({ length: 14 }, (_, i) => at(box(0.16, 0.04, 1.4, C.white, { edge: false }), 0, 0.04, 2 - i * 4, g1));
    const lot = at(new THREE.Group(), 1.5, 0, -30, g1); at(box(6, 2.6, 3.4, C.white), 0, 1.3, 0, lot); at(box(6.6, 0.4, 3.8, C.ink), 0, 2.8, 0, lot);
    const clock = at(new THREE.Group(), 2.6, 3.6, -2, g1); const cf = cyl(1.1, 0.18, C.white); cf.rotation.x = PI / 2; clock.add(cf);
    const hm = at(new THREE.Group(), 0, 0, 0.12, clock), hh = at(new THREE.Group(), 0, 0, 0.12, clock); at(box(0.08, 0.85, 0.05, C.ink), 0, 0.42, 0, hm); at(box(0.12, 0.55, 0.05, C.ink), 0, 0.27, 0, hh);
    S.hero('Their time.', 'was the design problem', 3.6, 8.7);
    const cells = [], route = [[-7.5, 5], [-2.5, 5], [-2.5, 0], [2.5, 0], [2.5, -5], [7.5, -5]];
    for (let x = -9; x <= 9; x += 2.5) for (let z = -6.5; z <= 6.5; z += 2.5) cells.push([x + 0.25, z + 0.25]);
    const city = inst(new THREE.BoxGeometry(1.7, 1, 1.7), cells.length, C.white); g2.add(city);
    const col = new THREE.Color(); cells.forEach((_, i) => city.setColorAt(i, col.set([C.white, C.raised, C.dim][Math.floor(rnd(i, 2) * 3)])));
    const pts = route.map(([x, z]) => [x, 0.08, z]), path = tube(pts, C.ink, 0.12); g2.add(path);
    const taxi = at(car('EV', C.white), 0, 0, 0, g2); taxi.scale.setScalar(0.42);
    const pinA = at(new THREE.Group(), pts[0][0], 0, pts[0][2], g2); at(cyl(0.01, 1.2, C.ink, { top: 0.45, seg: 16 }), 0, 0.6, 0, pinA); at(tag(S, 'DEALER', { size: 0.34 }), 0, 2, 0, pinA);
    const pinB = at(new THREE.Group(), pts[5][0], 0, pts[5][2], g2); at(cyl(0.01, 1.2, C.white, { top: 0.45, seg: 16 }), 0, 0.6, 0, pinB); at(tag(S, 'YOU', { size: 0.34 }), 0, 2, 0, pinB);
    S.caption('Pick a time. We bring the car.', 9.6, 12.2);
    const seg = [12.6, 14, 15.4, 17, 17.8, 18.6];
    at(house(1.5), 3.6, 0, -1.6, g3a); const bolt = at(car('EV', C.white), 0, 0, 1, g3a); bolt.scale.setScalar(1.1); S.burst([0.5, 2.2, 1.5], 20.9, 18);
    const ca = [[112, 34], [160, 34], [160, 88], [206, 146], [204, 168], [178, 170], [168, 156], [146, 140], [128, 118], [118, 96], [108, 66]].map(([x, y]) => [(x - 157) / 16, (102 - y) / 16]);
    const cal = at(new THREE.Group(), -1.4, 0, 0.4, g3b); cal.scale.setScalar(0.8); const state = at(extrude(ca, 0.5, C.white), 0, 0.3, 0, cal); state.rotation.x = -PI / 2;
    const pins = [[120, 92], [164, 150], [186, 166]].map(([x, y]) => { const p = at(new THREE.Group(), (x - 157) / 16, 0.55, -(102 - y) / 16, cal); at(cyl(0.01, 0.9, C.red, { top: 0.32, seg: 16 }), 0, 0.45, 0, p); at(sphere(0.3, C.red), 0, 1.05, 0, p); return p; });
    S.hero('3', 'California cities · Bolt EV · 2017', 22.2, 26);
    return (t) => {
      pop(hs, t, 0.2, 0.6, 1); pop(me, t, 0.6, 0.5, 1); pop(clock, t, 1.2); hm.rotation.z = -eio(k(t, 1.4, 8.6)) * PI * 10; hh.rotation.z = -eio(k(t, 1.4, 8.6)) * PI * 0.8;
      dashes.forEach((d, i) => { d.position.z = 2 - i * 4 + ((t * 2.4) % 4); });
      if (t >= 9 && t < 19) {
        cells.forEach(([x, z], i) => { const h = (0.3 + rnd(i) * 1.1) * back(k(t, 9.1 + rnd(i, 1) * 0.9, 9.8 + rnd(i, 1) * 0.9)); dummy.position.set(x, h / 2, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, Math.max(0.001, h), 1); dummy.updateMatrix(); city.setMatrixAt(i, dummy.matrix); });
        city.instanceMatrix.needsUpdate = true;
        path.reveal(eio(k(t, 10.4, 12.2))); pop(pinA, t, 9.8); pop(pinB, t, 10.1);
        let j = 0; while (j < 4 && t > seg[j + 1]) j++;
        const p = eio(k(t, seg[j], seg[j + 1])), a = pts[j], b = pts[j + 1], x = lerp(a[0], b[0], p), z = lerp(a[2], b[2], p);
        taxi.visible = t > 12.2; taxi.position.set(x, 0.1, z); taxi.rotation.y = Math.atan2(-(b[2] - a[2]), b[0] - a[0]);
        if (t > 12.4) { const q = eio(k(t, 12.4, 13.6)), o = eio(k(t, 18.2, 19)); S.cam = [[lerp(0, x - 2, q) + o * 2, lerp(16, 11.5, q) + o * 2, lerp(12, z + 10.5, q)], [lerp(0, x, q), lerp(0, 0.4, q), lerp(0, z, q)]]; }
      }
      const d = eo(k(t, 19.1, 20.8)); bolt.position.x = lerp(-12, 0.5, d); bolt.body.material.color.set(t > 20.9 ? C.red : C.white);
      pop(state, t, 21.7, 0.6); state.rotation.x = -PI / 2;
      pins.forEach((p, i) => { const a = 22.3 + i * 0.35, q = eo(k(t, a, a + 0.45)); p.visible = t > a; p.position.y = 0.55 + (1 - q) * 6; });
    };
  },
};
