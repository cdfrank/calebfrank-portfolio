// Restaged scenes: one question, one image, one transformation. Ink sets, red held for the payoff.
import { THREE, C, k, eo, eio, back, lerp, rnd, kf, pop, at, box, cyl, sphere, torus, pawn, key3d, cursor3d, car, inst, dummy, face, own } from './engine.js';

const PI = Math.PI;
export const V = {};

// ================================================================ New York Lottery: four doors, one key
V['new-york-lottery-single-sign-on'] = {
  client: 'New York Lottery', title: 'One account for every New York Lottery door', question: 'Which password was this one?', result: '1 account across 4 experiences.', warp: 1,
  acts: [[0, ''], [9, ''], [19, '']], sets: ['ink', 'ink', 'ink'],
  cam: [[0, [-3.5, 1, 13.5], [0, 3.5, 0], 52], [8.8, [2, 1.3, 12], [0, 3.5, 0], 52], [9, [-8, 2.4, 9.5], [-2.4, 3, 0], 40], [18.8, [7, 2.2, 9.5], [2.4, 3, 0], 40], [19, [0, 0.8, 11], [0, 3.8, 0], 66], [25.6, [0, 1.6, 17], [0, 3.4, 0], 66]],
  build(S) {
    const g = S.group(0, 31), xs = [-5.7, -1.9, 1.9, 5.7], names = ['WEBSITE', 'APP', "COLLECT 'N WIN", 'SECOND CHANCE'], openAt = [10.6, 12.6, 14.6, 16.6], failAt = [2.4, 3.9, 5.4, 6.9];
    const redGlow = new THREE.MeshBasicMaterial({ color: C.red }), spill = new THREE.MeshBasicMaterial({ color: C.red, transparent: true, opacity: 0.92 });
    const doors = xs.map((x, i) => {
      const f = at(new THREE.Group(), x, 0, 0, g);
      at(box(2.9, 7.4, 0.8, C.white), 0, 3.7, -0.42, f);
      at(face(S, names[i], { size: 0.3, mono: true, weight: 700 }), 0, 6.2, 0, f);
      const glow = at(new THREE.Mesh(new THREE.PlaneGeometry(1.9, 4.8), redGlow), 0, 2.4, 0.0, f);
      const pg = new THREE.PlaneGeometry(1.9, 1); pg.translate(0, -0.5, 0);
      const light = at(new THREE.Mesh(pg, spill), 0, 0.03, 0.1, f); light.rotation.x = -PI / 2;
      const hinge = at(new THREE.Group(), -0.95, 0, 0.06, f); at(box(1.9, 4.8, 0.14, C.white), 0.95, 2.4, 0, hinge); at(sphere(0.12, C.dim), 1.65, 2.3, 0.14, hinge);
      const plate = at(box(1.3, 0.4, 0.06, C.raised), 0.95, 3.5, 0.1, hinge); at(face(S, '••••••', { size: 0.26, mono: true }), 0, 0, 0.04, plate);
      Object.assign(f, { hinge, glow, light, plate }); return f;
    });
    const me = at(pawn(C.white, 0.9), 0, 0, 5, g);
    const junk = xs.map((x, i) => { const kk = at(key3d([C.white, C.dim, C.raised, C.white][i]), 0, 0, 0, g); kk.scale.setScalar(0.6); return kk; });
    const key = at(key3d(C.red), 0, 0, 0, g);
    const stops = [[9.3, [0.5, 1.6, 5.2]]]; xs.forEach((x, i) => { stops.push([openAt[i] - 0.5, [x + 0.3, 2.3, 0.7]], [openAt[i] + 0.6, [x + 0.3, 2.3, 0.7]]); }); stops.push([18.6, [0.5, 1.6, 5.2]]);
    const N = 56, bodies = inst(new THREE.CylinderGeometry(0.07, 0.19, 0.5, 12), N, C.white), heads = inst(new THREE.SphereGeometry(0.14, 12, 10), N, C.white); g.add(bodies, heads);
    S.hero('1', 'account · 4 experiences', 21.2, 26);
    return (t) => {
      doors.forEach((f, i) => {
        pop(f, t, 0.15 + i * 0.12, 0.5); const o = eio(k(t, openAt[i], openAt[i] + 0.8));
        f.hinge.rotation.y = -o * 1.95; f.glow.visible = f.light.visible = o > 0.01; f.light.scale.y = Math.max(0.01, o * 13 + (t > 19 ? Math.sin(t * 2 + i) * 0.4 : 0));
        const sh = k(t, failAt[i] + 0.45, failAt[i] + 0.95); f.hinge.position.x = -0.95 + (sh > 0 && sh < 1 ? Math.sin(t * 60) * 0.05 : 0); f.plate.visible = t < openAt[i];
      });
      pop(me, t, 0.5, 0.5, 1); me.position.z = lerp(5, 3.4, eio(k(t, 19, 21))); me.visible = t < 21.4 && t > 0.5;
      junk.forEach((kk, i) => {
        const a = t * 1.5 + i * 1.57, orbit = [Math.cos(a) * 1.1, 1.3 + Math.sin(a * 1.6) * 0.3, 5 + Math.sin(a) * 1.1], door = [xs[i] + 0.3, 2.3, 0.7], rest = [xs[i] * 0.55 + 0.4, 0.12, 2.6 + i * 0.3];
        const go = eio(k(t, failAt[i], failAt[i] + 0.5)), drop = eo(k(t, failAt[i] + 0.95, failAt[i] + 1.5));
        const p = drop > 0 ? door.map((v, j) => lerp(v, rest[j], drop)) : orbit.map((v, j) => lerp(v, door[j], go));
        kk.position.set(p[0], p[1] + Math.sin(drop * PI) * 0.8, p[2]); kk.rotation.set(drop > 0 ? PI / 2 : a, drop > 0 ? i : a * 0.7, 0); kk.visible = t > 0.9 + i * 0.15 && t < 19;
      });
      const kp = kf(t, stops); key.visible = t > 9.3 && t < 18.9; pop(key, t, 9.3, 0.5, 0.95); key.position.set(kp[0], kp[1] + Math.sin(t * 3) * 0.08, kp[2]);
      key.rotation.y = -PI / 2 * eio(k(t, 9.6, 10.1)); key.rotation.x = openAt.reduce((s, o) => s + eio(k(t, o - 0.1, o + 0.4)) * PI / 2, 0);
      const live = t >= 19.2;
      for (let i = 0; i < N; i++) {
        const d = i % 4, st = 19.3 + rnd(i) * 3.4, p = k(t, st, st + 2.6), x0 = (rnd(i, 1) - 0.5) * 16, z0 = 8 + rnd(i, 2) * 5, x = lerp(x0, xs[d] + (rnd(i, 3) - 0.5) * 0.9, eio(p)), z = lerp(z0, -0.1, p);
        const s = live && p > 0 && p < 1 ? Math.min(1, p * 8) * Math.min(1, (1 - p) * 10) : 0.001, bob = Math.abs(Math.sin(t * 9 + i)) * 0.07;
        dummy.rotation.set(0, 0, 0); dummy.scale.setScalar(s);
        dummy.position.set(x, 0.25 + bob, z); dummy.updateMatrix(); bodies.setMatrixAt(i, dummy.matrix);
        dummy.position.set(x, 0.62 + bob, z); dummy.updateMatrix(); heads.setMatrixAt(i, dummy.matrix);
      }
      bodies.instanceMatrix.needsUpdate = heads.instanceMatrix.needsUpdate = true;
    };
  },
};

// ================================================================ City of Raleigh: the mountain becomes four doors in
V['city-of-raleigh-website-redesign'] = {
  client: 'City of Raleigh', title: 'A city website built around what people came to do', question: 'Where do I rent a park shelter?', result: 'Tested with 11 residents, then presented to City Council.', warp: 1,
  acts: [[0, ''], [9, ''], [19, '']], sets: ['ink', 'ink', 'paper'],
  cam: [[0, [-1, 1.1, 15.5], [0, 5.4, 0], 58], [8.8, [3, 1.5, 13.5], [0, 5, 0], 58], [9, [0, 4.6, 20], [0, 3, 0], 35], [12.6, [0, 3.4, 15.5], [0, 2.8, 0], 35], [18.8, [-2.4, 3.2, 14.5], [0, 2.8, 0], 35], [19, [3.5, 2, 15.5], [0, 2.4, 0.5], 42], [25.6, [-1.5, 3, 18], [0, 2.6, 0], 42]],
  build(S) {
    const N = 7700, R = 6.6, H = 11, pages = inst(new THREE.BoxGeometry(0.22, 0.29, 0.012), N, C.white); pages.castShadow = false; S.root.add(pages);
    const col = new THREE.Color(), sd = new Float32Array(N * 8);
    for (let i = 0; i < N; i++) { for (let j = 0; j < 8; j++) sd[i * 8 + j] = rnd(i, j); pages.setColorAt(i, col.set([C.white, C.white, C.raised, C.dim][Math.floor(sd[i * 8 + 4] * 4)])); }
    const g1 = S.group(0, 9), walker = at(pawn(C.white, 0.9), -3.4, 0, 8.6, g1);
    S.hero('7,700', 'pages. One city website.', 3.6, 8.7);
    const g2 = S.group(9, 31), names = ['Rent a shelter', 'Water service', 'Trash', 'Parks'], tpos = [[-2.2, 3.9], [2.2, 3.9], [-2.2, 1.45], [2.2, 1.45]];
    const tiles = tpos.map(([x, y], i) => { const m = own(C.white), b = at(box(4.1, 2.2, 0.5, C.white, { material: m }), x, y, 0, g2); b.m = m; at(face(S, names[i], { size: 0.5 }), 0, 0, 0.27, b); return b; });
    const cur = at(cursor3d(), 0, 0, 1.3, g2); S.billboards.push(cur); cur.scale.setScalar(1.4);
    S.caption('Tasks first, departments second.', 14.9, 18.8); S.kicks.push(14.3);
    const res = Array.from({ length: 11 }, (_, i) => { const a = (i - 5) * 0.21; return at(pawn(C.white, 1), Math.sin(a) * 7, 0, 5.6 - Math.cos(a) * 2.6, g2); });
    S.hero('11', 'residents tested it', 20.4, 26);
    let settled = false;
    return (t) => {
      pages.visible = t < 9 || (t >= 9 && t < 12.5);
      if (t < 9) {
        pages.rotation.y = t * 0.035;
        if (t < 5 || !settled) {
          for (let i = 0; i < N; i++) {
            const o = i * 8, r = Math.sqrt(sd[o]) * R, a = sd[o + 1] * 6.283, top = (1 - r / R) * H * (0.2 + 0.8 * sd[o + 2]), st = sd[o + 3] * 3.4, p = eo(k(t, st, st + 1.2));
            dummy.position.set(Math.cos(a) * r, lerp(16 + sd[o + 6] * 8, top + 0.1, p), Math.sin(a) * r);
            dummy.rotation.set((1 - p) * 9 + sd[o + 7] * 1.4, a + (1 - p) * 6, sd[o + 5] * 1.2); dummy.scale.setScalar(p > 0 ? 1 : 0.001); dummy.updateMatrix(); pages.setMatrixAt(i, dummy.matrix);
          }
          pages.instanceMatrix.needsUpdate = true; settled = t >= 5;
        }
      } else if (pages.visible) {
        settled = false; pages.rotation.y = 0;
        for (let i = 0; i < N; i++) {
          const o = i * 8, st = 9.05 + sd[o + 3] * 1.3, p = eio(k(t, st, st + 1.5)), tp = tpos[i % 4], a = sd[o + 1] * 6.283 + t * 2.6 * (1 - p), r0 = Math.sqrt(sd[o]) * R, r = r0 * (1 - p);
          dummy.position.set(tp[0] * p + Math.cos(a) * r, lerp((1 - r0 / R) * H * (0.2 + 0.8 * sd[o + 2]), tp[1], p), Math.sin(a) * r);
          dummy.rotation.set(t * 3 + i, t * 2 + i, 0); dummy.scale.setScalar(Math.max(0.001, 1 - p * p)); dummy.updateMatrix(); pages.setMatrixAt(i, dummy.matrix);
        }
        pages.instanceMatrix.needsUpdate = true;
      } else settled = false;
      pop(walker, t, 2.6, 0.5, 1); walker.position.x = lerp(-3.4, -2.2, k(t, 3, 8.8));
      tiles.forEach((b, i) => { pop(b, t, 10.9 + i * 0.22, 0.6); const hit = i === 0 ? 14.2 : 99; b.position.z = -Math.sin(k(t, hit, hit + 0.35) * PI) * 0.5; b.m.color.set(t > hit + 0.12 ? C.red : C.white); });
      const cp = kf(t, [[13, [5.5, 0.4]], [14.1, [-1.4, 3.5]], [18.8, [-1.4, 3.5]]]); cur.visible = t > 13 && t < 19; cur.position.set(cp[0], cp[1], 1.3);
      res.forEach((p, i) => { pop(p, t, 19.2 + i * 0.16, 0.5, 1); p.position.y = t > 21 ? Math.abs(Math.sin(t * 3 + i * 0.9)) * 0.1 : 0; });
    };
  },
};

// ================================================================ GM Build & Price: the wall becomes one car
V['general-motors-build-price-platform-redesign'] = {
  client: 'General Motors', title: 'Rebuilding how people build a vehicle', question: 'Where do I even start?', result: 'One builder: clearer model choice, real comparison, built to scale across brands.', warp: 1,
  acts: [[0, ''], [9, ''], [19, '']], sets: ['ink', 'ink', 'paper'],
  cam: [[0, [-6, 0.7, 6.5], [1.5, 5.5, 0], 62], [8.8, [4.5, 1.1, 8], [-1, 5, 0], 62], [9, [0, 4.4, 17], [0, 1.5, 0], 35], [13.6, [1.5, 3.6, 15], [0, 1.5, 0], 35], [13.9, [0, 3.4, 15.5], [0, 1.7, 0.8], 35], [18.8, [-2, 3, 13.5], [0, 1.7, 0.8], 35], [19, [5, 1.5, 9.5], [0, 1.5, 0], 44], [25.6, [-5, 2.4, 10], [0, 1.6, 0], 44]],
  build(S) {
    const g1 = S.group(0, 9), cols = 30, rows = 22, N = cols * rows, wall = inst(new THREE.BoxGeometry(0.56, 0.36, 0.1), N, C.white); wall.castShadow = false; g1.add(wall);
    const col = new THREE.Color(); for (let i = 0; i < N; i++) wall.setColorAt(i, col.set([C.white, C.raised, C.dim, C.mid][Math.floor(rnd(i, 4) * 4)]));
    const lost = at(pawn(C.white, 0.85), 0.4, 0, 2.6, g1);
    const g2a = S.group(9, 13.8), g2b = S.group(13.8, 19), g3 = S.group(19, 31);
    const trio = ['EV', 'SUV', 'TRUCK'].map((kd, i) => { const w = at(new THREE.Group(), (i - 1) * 5, 0, 0, g2a); at(cyl(2.1, 0.25, C.raised), 0, 0.125, 0, w); const c = at(car(kd, C.white), 0, 0.25, 0, w); c.scale.setScalar(0.85); w.car = c; return w; });
    const halo = at(torus(2.35, 0.09, C.white), 0, 0.3, 0, g2a); halo.rotation.x = PI / 2;
    S.caption('Pick a model first.', 10.4, 13.6);
    const duo = [at(car('SUV', C.white), -4, 0, -0.5, g2b), at(car('TRUCK', C.white), 4, 0, -0.5, g2b)]; duo[0].rotation.y = 0.35; duo[1].rotation.y = PI - 0.35;
    const bars = []; [[2.4, 1.5], [1.2, 2.7], [2.1, 1.6]].forEach(([a, b], i) => { [[-0.24, a, a > b], [0.24, b, b > a]].forEach(([dx, h, win], s) => { const c = at(box(0.4, h, 0.4, win ? C.white : C.mid), (i - 1) * 1.15 + dx, 0, 2.4, g2b); c.geometry.translate(0, h / 2, 0); c.t0 = 14.6 + i * 0.4 + s * 0.15; bars.push(c); }); });
    S.caption('Then compare two, side by side.', 15.2, 18.8);
    at(cyl(3.3, 0.3, C.white), 0, 0.15, 0, g3); const hero = at(car('SUV', C.red), 0, 0.3, 0, g3); hero.scale.setScalar(1.3);
    [['Chevrolet', 19.6, 21.6], ['GMC', 21.6, 23.6], ['Buick', 23.6, 26]].forEach(([b, a, z]) => S.hero('One builder.', b, a, z)); S.kicks.push(19.05);
    return (t) => {
      if (t < 9) {
        for (let i = 0; i < N; i++) {
          const x = ((i % cols) - cols / 2 + 0.5) * 0.7, y = 0.4 + Math.floor(i / cols) * 0.5, a = rnd(i) * 1.6, p = back(k(t, a, a + 0.4)), chaos = eio(k(t, 2.5, 7.5)), out = eio(k(t, 8.3, 9));
          dummy.position.set(x * (1 + out * 1.5), y + out * (rnd(i, 2) - 0.2) * 8, Math.sin(t * 1.3 + i * 1.7) * 0.6 * chaos + (rnd(i, 3) - 0.5) * 3 * chaos + out * 8 * (rnd(i, 5) - 0.5));
          dummy.rotation.set(chaos * Math.sin(t + i) * 0.35, chaos * Math.cos(t * 0.8 + i) * 0.5, 0); dummy.scale.setScalar(Math.max(0.001, p)); dummy.updateMatrix(); wall.setMatrixAt(i, dummy.matrix);
        }
        wall.instanceMatrix.needsUpdate = true;
      }
      pop(lost, t, 1.4, 0.5, 1); lost.rotation.y = Math.sin(t * 1.1) * 0.8;
      trio.forEach((w, i) => { pop(w, t, 9.2 + i * 0.22); w.car.rotation.y = t * 0.6 + i; if (i === 1) w.position.y = Math.sin(k(t, 12, 12.5) * PI) * 0.5; });
      pop(halo, t, 12, 0.4);
      duo.forEach((c, i) => pop(c, t, 13.9 + i * 0.15)); bars.forEach((c) => { c.visible = t > c.t0; c.scale.y = Math.max(0.001, back(k(t, c.t0, c.t0 + 0.7))); });
      hero.rotation.y = t * 0.6; const beat = [19, 21.6, 23.6].reduce((s, b) => Math.max(s, Math.sin(k(t, b, b + 0.5) * PI)), 0); hero.position.y = 0.3 + beat * 0.4;
    };
  },
};
