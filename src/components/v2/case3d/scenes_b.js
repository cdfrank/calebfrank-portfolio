import { THREE, C, k, eo, eio, back, lerp, rnd, kf, pop, show, at, box, cyl, sphere, torus, prism, extrude, pawn, bot, house, key3d, shield, check, cross, cursor3d, car, tube, arc, inst, dummy, label, tag, face, own, mat } from './engine.js';
import { screen, row, PI } from './scenes_a.js';

export const B = {};

// ================================================================ MRM UX jams
B['mrm-ux-team-ux-jam-sessions'] = {
  client: 'MRM UX team', title: 'Building the team around the work', result: 'Jams since 2019. Figma courses open to every department.',
  acts: [[0, 'THE FIRST JAM'], [10, 'OPEN TO EVERY TEAM'], [20, 'SIX YEARS OF RITUALS']],
  cam: [[0, [3, 3.4, 18], [0.6, 2.8, 0]], [9.6, [-2, 3.2, 15.5], [0.6, 2.8, 0]], [10, [-3, 4.4, 17.5], [0.6, 2.6, 0]], [19.6, [3, 3.8, 15.5], [0.8, 2.6, 0]], [20, [-7, 3.6, 15], [-3, 2.4, 0]], [29, [3, 4.8, 18], [0.6, 3, 0]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3 = S.act(2);
    at(box(8.4, 4.6, 0.3, C.raised), -1.4, 3.3, -1, g1);
    const notes = Array.from({ length: 18 }, (_, i) => { const b = at(box(0.95, 0.95, 0.06, [C.white, C.red, C.dim][i % 3]), 0, 0, 0, g1); b.to = [-4.6 + (i % 6) * 1.28 + (rnd(i) - 0.5) * 0.3, 4.7 - Math.floor(i / 6) * 1.3 + (rnd(i, 1) - 0.5) * 0.3, -0.8]; b.rz = (rnd(i, 2) - 0.5) * 0.4; return b; });
    at(cyl(1.5, 0.9, C.ink), -1.4, 0.45, 2.6, g1); const crew = [-3.4, -1.4, 0.6].map((x, i) => at(pawn(C.white, 1.1), x, 0, 2.6 + (i === 1 ? 1.7 : 0), g1));
    const yr = at(label(S, '2019', { size: 1.3 }), 5.2, 3.6, 0, g1), j1 = at(tag(S, 'DESIGN JAM 01', { size: 0.22 }), 5.2, 2.5, 0, g1);
    S.burst([-1.4, 3.4, 0], 6.8, 22);
    const scr = at(screen(S, 6.6, 4.6, 'FIGMA, FROM ZERO'), -3, 2.9, 0, g2);
    const les = [0, 1, 2, 3, 4].map((i) => { const r = row(6, 0.95 - i * 0.62); r.position.z = 0.1; scr.add(r); at(row([3, 2.4, 3.4, 2.6, 2.1][i], 0, C.mid, 0.12), -1 + [0, -0.3, 0.2, -0.2, -0.45][i], 0, 0.04, r); return at(check(), 2.6, 0.95 - i * 0.62, 0.2, scr); });
    const deps = ['STRATEGY', 'ACCOUNT', 'CREATIVE', 'TECH', 'DATA'].map((d, i) => { const g = at(new THREE.Group(), 3.8 + (i % 2) * 1.3, 0, -2.4 + i * 1.3, g2); at(box(1.2, 1 + (i % 3) * 0.5, 1.2, C.white), 0, (1 + (i % 3) * 0.5) / 2, 0, g); at(pawn(C.white, 0.7), 0, 1 + (i % 3) * 0.5, 0, g); at(tag(S, d, { size: 0.2 }), 0, 2.5 + (i % 3) * 0.5, 0, g); g.arc = arc([g.position.x, 1.9 + (i % 3) * 0.5, g.position.z], [0.3, 2.9, 0.2], 1.6, C.dim, 0.025); g2.add(g.arc); g.dots = [0, 1, 2].map(() => at(sphere(0.16, C.red), 0, 0, 0, g2)); return g; });
    S.caption('Courses open to every department', 16, 19.6);
    const stacks = Array.from({ length: 7 }, (_, i) => { const g = at(new THREE.Group(), -7.2 + i * 2.4, 0, 0, g3); at(box(1.6, 0.2, 1.6, C.ink), 0, 0.1, 0, g); g.ps = Array.from({ length: i + 2 }, (_, j) => at(sphere(0.34, j === i + 1 ? C.red : C.white), (j % 2 ? 0.2 : -0.2), 0.55 + j * 0.56, 0, g)); at(tag(S, String(2019 + i), { size: 0.24 }), 0, 0.5, 1.3, g); return g; });
    const mug = at(new THREE.Group(), -4.8, 4, 0, g3); mug.add(cyl(0.4, 0.7, C.white)); const h = at(torus(0.22, 0.06, C.ink), 0.45, 0, 0, mug);
    const note = at(box(0.8, 0.8, 0.08, C.red), 0, 5, 0, g3), cup = at(new THREE.Group(), 4.8, 6.2, 0, g3); at(cyl(0.2, 0.2, C.ink), 0, -0.5, 0, cup); at(cyl(0.08, 0.4, C.ink), 0, -0.25, 0, cup); const bowl = at(cyl(0.2, 0.6, C.red, { top: 0.45 }), 0, 0.25, 0, cup);
    S.burst([7.2, 5.2, 0], 24.4, 24); S.caption('Jams, courses, and small rituals', 26.2, 28.9);
    return (t) => {
      notes.forEach((b, i) => { const a = 1 + i * 0.3, p = eo(k(t, a, a + 0.5)); b.visible = t > a; b.position.set(lerp((rnd(i, 3) - 0.5) * 10, b.to[0], p), lerp(2 + rnd(i, 4) * 4, b.to[1], p), lerp(13, b.to[2], p)); b.rotation.set((1 - p) * 3, (1 - p) * 4, b.rz); });
      crew.forEach((c, i) => { pop(c, t, 0.3 + i * 0.2, 0.5, 1); c.position.y = Math.abs(Math.sin(t * 2.4 + i * 1.4)) * 0.12; }); pop(yr, t, 0.6); pop(j1, t, 1);
      pop(scr, t, 10.2, 0.6); les.forEach((c, i) => pop(c, t, 13 + i * 1.1));
      deps.forEach((g, i) => { pop(g, t, 10.5 + i * 0.25, 0.5); g.arc.reveal(eio(k(t, 11.4 + i * 0.2, 12.2 + i * 0.2))); g.dots.forEach((d, j) => { const q = ((t - 12.2 - i * 0.37 - j * 0.9) % 2.7) / 1.1; d.visible = t > 12.2 + i * 0.37 + j * 0.9 && q > 0 && q < 1; d.position.copy(g.arc.point(q)); }); });
      stacks.forEach((g, i) => { pop(g, t, 20.3 + i * 0.55, 0.5); g.ps.forEach((p, j) => pop(p, t, 20.6 + i * 0.55 + j * 0.08, 0.4)); });
      [[mug, 25, -4.8, 4], [note, 25.5, 0, 5.4], [cup, 26, 4.8, 6.6]].forEach(([o, a, x, y], i) => { pop(o, t, a); o.position.y = y + Math.sin(t * 1.6 + i * 2) * 0.2; o.rotation.y = t * 0.9 + i; });
    };
  },
};

// ================================================================ Test Drive MyWay
B['gm-lab313-test-drive-myway'] = {
  client: 'GM Lab313', title: 'The test drive that came to you', result: 'Live in 3 California cities with the Bolt EV in 2017.',
  acts: [[0, 'ON THEIR TIME'], [10, 'WE BRING THE CAR'], [20, 'BOLT EV, AT HOME']],
  cam: [[0, [-1.5, 3.4, 17], [0.4, 2.5, 0]], [9.6, [2.5, 3.2, 14.5], [0.6, 2.5, 0]], [10, [0, 16, 12], [0, 0, 0]], [12.4, [0, 16, 12], [0, 0, 0]], [20, [4, 3, 14], [0, 1.4, 0]], [25, [-1, 2.6, 11.5], [0.5, 1.4, 0]], [25.2, [1.5, 11, 10], [1.2, 0, 0.6]], [29, [2, 9.5, 9], [1.2, 0, 0.6]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3a = S.group(20, 25.2), g3b = S.group(25.2, 31);
    const hs = at(house(1.5), -3.8, 0, 0, g1);
    const clock = at(new THREE.Group(), -0.2, 4.4, -0.5, g1); const fc = cyl(0.9, 0.16, C.white); fc.rotation.x = PI / 2; clock.add(fc);
    const hm = at(new THREE.Group(), 0, 0, 0.12, clock), hh = at(new THREE.Group(), 0, 0, 0.12, clock); at(box(0.08, 0.7, 0.05, C.ink), 0, 0.35, 0, hm); at(box(0.1, 0.45, 0.05, C.red, { edge: false }), 0, 0.22, 0, hh);
    const ph = at(new THREE.Group(), 4.2, 2.8, 0, g1); ph.add(box(3.2, 5.4, 0.24, C.white)); ph.rotation.y = -0.25; at(face(S, 'PICK A TIME', { size: 0.26, mono: true }), 0, 2.2, 0.14, ph);
    const slots = ['FRI 6PM', 'SAT 10AM', 'SAT 2PM', 'SUN 11AM'].map((s, i) => { const m = own(C.raised), b = at(box(2.6, 0.7, 0.14, C.raised, { material: m }), 0, 1.3 - i * 0.9, 0.16, ph); b.m = m; at(face(S, s, { size: 0.26, mono: true }), 0, 0, 0.08, b); return b; });
    const booked = at(box(2.6, 0.7, 0.14, C.ink), 0, -2.2, 0.16, ph); at(face(S, 'BOOKED', { size: 0.26, mono: true, color: '#fff' }), 0, 0, 0.08, booked);
    const cur = at(cursor3d(), 0, 0, 0, g1); S.billboards.push(cur); S.burst([4.3, 3.2, 0.8], 4.2, 20); S.caption('The car comes to you', 6.2, 9.6);
    // city
    const cells = [], route = [[-7.5, 5], [-2.5, 5], [-2.5, 0], [2.5, 0], [2.5, -5], [7.5, -5]];
    for (let x = -9; x <= 9; x += 2.5) for (let z = -6.5; z <= 6.5; z += 2.5) cells.push([x + 0.25, z + 0.25]);
    const city = inst(new THREE.BoxGeometry(1.7, 1, 1.7), cells.length, C.white); g2.add(city); city.receiveShadow = true;
    cells.forEach(([x, z], i) => { dummy.position.set(x, 0, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, 0.001, 1); dummy.updateMatrix(); city.setMatrixAt(i, dummy.matrix); });
    const col = new THREE.Color(); cells.forEach((_, i) => city.setColorAt(i, col.set([C.white, C.raised, C.dim][Math.floor(rnd(i, 2) * 3)])));
    const pts = route.map(([x, z]) => [x, 0.08, z]), path = tube(pts, C.red, 0.12); g2.add(path);
    const taxi = at(car('EV', C.red), 0, 0, 0, g2); taxi.scale.setScalar(0.42);
    const pinA = at(new THREE.Group(), pts[0][0], 0, pts[0][2], g2); const ca = at(cyl(0.01, 1.2, C.ink, { top: 0.45, seg: 16 }), 0, 0.6, 0, pinA); at(tag(S, 'DEALER', { size: 0.34 }), 0, 2, 0, pinA);
    const pinB = at(new THREE.Group(), pts[5][0], 0, pts[5][2], g2); at(cyl(0.01, 1.2, C.red, { top: 0.45, seg: 16 }), 0, 0.6, 0, pinB); at(tag(S, 'YOU', { size: 0.34 }), 0, 2, 0, pinB);
    const eta = at(label(S, 'ETA 14 MIN', { size: 0.5, mono: true, bg: '#fff' }), 0, 0, 0, g2); S.burst([pts[5][0], 1.2, pts[5][2]], 18.6, 26);
    const seg = [12.6, 14, 15.4, 17, 17.8, 18.6];
    // arrival
    at(house(1.5), 3.6, 0, -1.6, g3a); const bolt = at(car('EV', C.red), 0, 0, 1, g3a); bolt.scale.setScalar(1.1);
    const trees = [-6, 8.2].map((x) => { const g = at(new THREE.Group(), x, 0, -2, g3a); at(cyl(0.14, 1, C.ink), 0, 0.5, 0, g); at(cyl(0.01, 1.9, C.raised, { top: 0, seg: 12 }), 0, 0, 0, g).visible = false; const c = at(cyl(0.9, 1.9, C.white, { top: 0.02, seg: 12 }), 0, 1.9, 0, g); return g; });
    const hi = at(label(S, 'BOLT EV', { size: 0.5, mono: true, bg: '#fff' }), -1, 3.5, 1, g3a); S.burst([0.5, 2.2, 1.5], 23.2, 22);
    const ca_ = [[112, 34], [160, 34], [160, 88], [206, 146], [204, 168], [178, 170], [168, 156], [146, 140], [128, 118], [118, 96], [108, 66]].map(([x, y]) => [(x - 157) / 16, (102 - y) / 16]);
    const cal = at(new THREE.Group(), -1.4, 0, 0.4, g3b); cal.scale.setScalar(0.8); const state = at(extrude(ca_, 0.5, C.white), 0, 0.3, 0, cal); state.rotation.x = -PI / 2;
    const pins = [[120, 92], [164, 150], [186, 166]].map(([x, y]) => { const g = at(new THREE.Group(), (x - 157) / 16, 0.55, -(102 - y) / 16, cal); at(cyl(0.01, 0.9, C.red, { top: 0.32, seg: 16 }), 0, 0.45, 0, g); at(sphere(0.3, C.red), 0, 1.05, 0, g); return g; });
    const three = at(label(S, '3 CITIES', { size: 0.8, bg: '#fff' }), 4.2, 2.2, 0, g3b), pilot = at(tag(S, 'BOLT EV PILOT · 2017', { size: 0.26 }), 4.2, 1.3, 0, g3b);
    return (t) => {
      pop(hs, t, 0.3, 0.6, 1); pop(clock, t, 0.5); hm.rotation.z = -eio(k(t, 0.6, 4)) * PI * 6; hh.rotation.z = -eio(k(t, 0.6, 4)) * PI * 0.5;
      pop(ph, t, 0.7, 0.6); slots.forEach((b, i) => { pop(b, t, 1.2 + i * 0.22); b.m.color.set(i === 1 && t > 4.2 ? C.red : C.raised); b.position.z = 0.16 - (i === 1 ? Math.sin(k(t, 4.1, 4.5) * PI) * 0.12 : 0); }); pop(booked, t, 5.2);
      const cp = kf(t, [[3, [7, 0.5, 2]], [3.9, [4.4, 3.1, 1]], [5.2, [4.4, 3.1, 1]]]); cur.visible = t > 3 && t < 5.5; cur.position.set(cp[0], cp[1], cp[2]);
      if (t >= 10 && t < 20) {
        cells.forEach(([x, z], i) => { const h = (0.3 + rnd(i) * 1.1) * back(k(t, 10.1 + rnd(i, 1) * 0.9, 10.8 + rnd(i, 1) * 0.9)); dummy.position.set(x, h / 2, z); dummy.rotation.set(0, 0, 0); dummy.scale.set(1, Math.max(0.001, h), 1); dummy.updateMatrix(); city.setMatrixAt(i, dummy.matrix); });
        city.instanceMatrix.needsUpdate = true;
        path.reveal(eio(k(t, 11, 12.4))); pop(pinA, t, 10.6); pop(pinB, t, 10.9);
        let j = 0; while (j < 4 && t > seg[j + 1]) j++;
        const p = eio(k(t, seg[j], seg[j + 1])), a = pts[j], b = pts[j + 1], x = lerp(a[0], b[0], p), z = lerp(a[2], b[2], p);
        taxi.visible = t > 12.2; taxi.position.set(x, 0.1, z); const ang = Math.atan2(-(b[2] - a[2]), b[0] - a[0]); taxi.rotation.y = ang;
        eta.position.set(x, 2.4, z); eta.set(t < 14.4 ? 'ETA 14 MIN' : t < 16.4 ? 'ETA 9 MIN' : t < 18.6 ? 'ETA 3 MIN' : 'ARRIVED'); pop(eta, t, 12.4);
        if (t > 12.4) { const q = eio(k(t, 12.4, 13.6)), o = eio(k(t, 18.4, 19.6)); S.cam = [[lerp(0, x - 2, q) + o * 2, lerp(16, 11.5, q) + o * 2, lerp(12, z + 10.5, q)], [lerp(0, x, q), lerp(0, 0.4, q), lerp(0, z, q)]]; }
      }
      const d = eo(k(t, 20.2, 23.2)); bolt.position.x = lerp(-13, 0.5, d); bolt.position.y = Math.sin(k(t, 23.1, 23.5) * PI) * 0.12; pop(hi, t, 23.4);
      pop(state, t, 25.3, 0.6); state.rotation.x = -PI / 2; pins.forEach((g, i) => { const a = 26.3 + i * 0.4, q = eo(k(t, a, a + 0.45)); g.visible = t > a; g.position.y = 0.55 + (1 - q) * 6; }); pop(three, t, 27.4); pop(pilot, t, 27.7);
    };
  },
};

// ================================================================ NYL single sign-on
B['new-york-lottery-single-sign-on'] = {
  client: 'New York Lottery', title: 'One account for every New York Lottery door', result: '1 account across 4 experiences.',
  acts: [[0, 'FOUR DOORS, FOUR LOGINS'], [10, 'ONE KEY'], [20, 'MOVING PLAYERS OVER']],
  cam: [[0, [-2, 3, 17.5], [0, 2.8, 0]], [9.6, [2.5, 3.4, 14.5], [0, 2.8, 0]], [10, [-6, 3.2, 14.5], [-1, 2.6, 0]], [19.6, [5, 3.4, 13.5], [1, 2.6, 0]], [20, [0, 19, 12], [0, 0, 0.4]], [29, [0, 16.5, 10], [0, 0, 0.4]]],
  build(S) {
    const g = S.group(0, 20), g3 = S.act(2), xs = [-5.7, -1.9, 1.9, 5.7], names = ['WEBSITE', 'APP', "COLLECT 'N WIN", 'SECOND CHANCE'];
    const doors = xs.map((x, i) => {
      const f = at(new THREE.Group(), x, 0, 0, g);
      at(box(2.5, 4.5, 0.5, C.ink), 0, 2.25, -0.3, f); const glow = at(box(1.9, 3.9, 0.04, C.red, { edge: false, material: new THREE.MeshBasicMaterial({ color: C.red }) }), 0, 2.05, -0.03, f); glow.castShadow = false;
      const hinge = at(new THREE.Group(), -0.95, 0, 0.06, f); at(box(1.9, 3.9, 0.14, C.white), 0.95, 2.05, 0, hinge); at(box(1.2, 1.2, 0.04, C.raised, { edge: false }), 0.95, 2.9, 0.08, hinge); at(sphere(0.12, C.red), 1.65, 2, 0.14, hinge);
      at(tag(S, names[i]), 0, 5, 0, f);
      const pw = at(tag(S, '••••••', { size: 0.3 }), 0, 5.8, 0, f), no = at(cross(), 1, 5.8, 0.3, f), ok = at(check(), 1.05, 4.2, 0.4, f); S.billboards.push(no, ok); no.scale.setScalar(1.2); ok.scale.setScalar(1.4);
      Object.assign(f, { hinge, pw, no, ok, glow }); return f;
    });
    const me = at(pawn(C.white, 1.3), 0, 0, 4, g);
    const junk = [0, 1, 2, 3, 4, 5].map((i) => { const kk = at(key3d([C.white, C.dim, C.mid][i % 3]), 0, 0, 0, g); kk.scale.setScalar(0.55); return kk; });
    const key = at(key3d(C.red), 0, 0, 0, g); key.scale.setScalar(0.9);
    S.caption('Which password was this one?', 5.6, 9.6); xs.forEach((x, i) => S.burst([x + 0.7, 2.2, 0.6], 11.9 + i * 2, 18));
    const stops = [[10.3, [0.6, 2, 4.4]]]; xs.forEach((x, i) => { stops.push([11.2 + i * 2, [x + 0.35, 2, 0.6]], [12.3 + i * 2, [x + 0.35, 2, 0.6]]); }); stops.push([19.4, [0.6, 2, 4.4]]);
    // act 3
    const hubM = own(C.white), hub = at(cyl(2.3, 0.4, C.white, { material: hubM }), 0, 0.2, 0, g3);
    const oneL = at(label(S, '1', { size: 2.6, billboard: false }), 0, 0.42, -0.2, g3); oneL.rotation.x = -PI / 2; const acct = at(label(S, 'ACCOUNT', { size: 0.4, mono: true, billboard: false }), 0, 0.42, 1.4, g3); acct.rotation.x = -PI / 2;
    const corners = [[-6.5, -3.6], [6.5, -3.6], [-6.5, 3.6], [6.5, 3.6]], players = [];
    corners.forEach(([x, z], i) => { at(cyl(1.7, 0.16, C.raised), x, 0.08, z, g3); const l = at(label(S, names[i], { size: 0.5, mono: true, billboard: false, bg: '#fff' }), x, 0.2, z + (z > 0 ? -2.3 : 2.3), g3); l.rotation.x = -PI / 2;
      for (let j = 0; j < 8; j++) { const a = j / 8 * 6.283, p = at(pawn(j % 3 ? C.white : C.ink, 0.6), 0, 0, 0, g3); p.from = [x + Math.cos(a) * 1, z + Math.sin(a) * 1]; p.t0 = 21.4 + j * 0.5 + i * 0.13; p.slot = players.length; players.push(p); } });
    S.burst([0, 1, 0], 26, 30); S.caption('1 account across 4 experiences', 26.4, 28.9);
    return (t) => {
      doors.forEach((f, i) => {
        pop(f, t, 0.3 + i * 0.2, 0.6); const o = 11.7 + i * 2; f.hinge.rotation.y = -eio(k(t, o, o + 0.7)) * 1.9; f.glow.visible = t > o;
        pop(f.pw, t, 1.2 + i * 0.3, 0.4, t < 9.6 ? 1 : 0); pop(f.no, t, 2.4 + i * 0.9, 0.4, t < 9.6 ? 1.2 : 0); pop(f.ok, t, o + 0.5, 0.4, 1.4);
        f.hinge.position.x = -0.95 + (t > 2.4 + i * 0.9 && t < 3 + i * 0.9 ? Math.sin(t * 50) * 0.04 : 0);
      });
      pop(me, t, 0.6, 0.5, 1);
      junk.forEach((kk, i) => { const a = t * 1.3 + i * 1.05, s = t < 9.4 ? back(k(t, 1 + i * 0.2, 1.5 + i * 0.2)) : 1 - eio(k(t, 9.4, 10.2)); kk.visible = s > 0.01 && t < 10.3; kk.scale.setScalar(0.55 * Math.max(0.01, s)); kk.position.set(Math.cos(a) * 1.5, 1.6 + Math.sin(a * 1.7 + i) * 0.5, 4 + Math.sin(a) * 1.5); kk.rotation.set(a, a * 0.7, i); });
      const kp = kf(t, stops); key.visible = t > 10.3 && t < 19.8; key.position.set(kp[0], kp[1] + Math.sin(t * 3) * 0.08, kp[2]); key.rotation.y = t > 19 ? 0 : -PI / 2 * eio(k(t, 10.6, 11.2)); key.rotation.x = Math.sin(t * 6.283) * 0.0 + xs.reduce((s, _, i) => s + eio(k(t, 11.3 + i * 2, 11.8 + i * 2)) * PI / 2, 0);
      const fill = eio(k(t, 22, 26)); hubM.color.setRGB(1, lerp(1, 0.027, fill), lerp(1, 0.027, fill)); pop(hub, t, 20.3, 0.6); pop(oneL, t, 26, 0.6); pop(acct, t, 26.2);
      players.forEach((p) => { const q = eio(k(t, p.t0, p.t0 + 1.2)), a = p.slot * 2.4, r = 0.5 + (p.slot % 4) * 0.42; p.visible = t > 20.4; const tx = Math.cos(a) * r, tz = Math.sin(a) * r; p.position.set(lerp(p.from[0], tx, q), lerp(0.16, 0.4, q) + Math.sin(q * PI) * 1.2, lerp(p.from[1], tz, q)); p.scale.setScalar(t > 25.6 ? 1 - eio(k(t, 25.6, 26.1)) + 0.001 : back(k(t, 20.4 + p.slot * 0.02, 20.9 + p.slot * 0.02))); });
    };
  },
};

// ================================================================ MRM agent relationship management
B['mrm-agent-relationship-management'] = {
  client: 'MRM', title: "Designing for the customer's AI", result: '8+ concept flows, reviewed at holding-company CEO level.',
  acts: [[0, 'BRAND TALKS TO PEOPLE'], [10, "THE CUSTOMER'S AI DECIDES"], [20, 'AGENT RELATIONSHIP MANAGEMENT']],
  cam: [[0, [-2, 3.2, 17], [0, 2.2, 0]], [9.6, [2.5, 3.6, 15], [0.3, 2.2, 0]], [10, [5, 6, 18], [-0.3, 2.2, 0]], [19.6, [0, 5, 18], [-1.4, 2.4, 0]], [20, [0, 9, 17], [0, 1.6, 0]], [29, [0, 7.5, 16], [0, 1.8, 0]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3 = S.act(2);
    const tower = (parent, x, z, name, m) => { const g = at(new THREE.Group(), x, 0, z, parent); const b = at(box(2, 3, 2, C.ink, m ? { material: m } : {}), 0, 0, 0, g); b.geometry.translate(0, 1.5, 0); g.b = b; g.l = at(tag(S, name, { size: 0.28 }), 0, 3.6, 0, g); return g; };
    const br = tower(g1, -5, 0, 'BRAND'), cust = at(pawn(C.white, 1.5), 5, 0, 0, g1); at(tag(S, 'CUSTOMER'), 5, 2.8, 0, g1);
    const msgs = [0, 1, 2, 3].map(() => { const m = at(box(1.3, 0.8, 0.1, C.white), 0, 0, 0, g1); at(row(0.7, 0, C.red, 0.12), -0.1, 0, 0.06, m); return m; }), lane = arc([-3.8, 2.4, 0], [4.2, 1.6, 0], 1.6, C.dim, 0.02); g1.add(lane);
    const b1 = at(bot(1), 2.9, 0, 1.2, g1); S.burst([2.9, 1.2, 1.2], 7.2, 20); S.caption('Until the customer sends their own AI', 7.4, 9.6);
    const ms = [own(C.ink), own(C.ink), own(C.ink)], brands = ['BRAND A', 'BRAND B', 'BRAND C'].map((n, i) => tower(g2, -6, (i - 1) * 3.4, n, ms[i]));
    const ai = at(bot(1.6), 1, 0, 0, g2), you = at(pawn(C.white, 1.3), 5.6, 0, 0, g2);
    const ask = at(label(S, 'Find me one', { size: 0.34, bg: '#111', color: '#fff' }), 4.6, 3.4, 0, g2), ans = at(label(S, 'Brand B. Here is why.', { size: 0.36, bg: '#FF2B2B' }), 2.6, 4.2, 0, g2);
    const lines = brands.map((b) => { const l = arc([0.2, 1.4, 0], [-5, 2.2, b.position.z], 1.4, C.dim, 0.03); g2.add(l); l.out = at(sphere(0.2, C.ink), 0, 0, 0, g2); l.in = at(sphere(0.2, C.red), 0, 0, 0, g2); return l; });
    const ranks = ['2', '1', '3'].map((r, i) => at(label(S, r, { size: 0.5, bg: i === 1 ? '#FF2B2B' : '#fff', round: 80 }), -6, 4.5, (i - 1) * 3.4, g2));
    S.burst([-6, 4.2, 0], 16.8, 26);
    const core = at(box(2.2, 2.2, 2.2, C.ink), 0, 1.1, 0, g3); at(tag(S, 'BRAND', { size: 0.3 }), 0, 2.9, 0, g3);
    const orbit = at(new THREE.Group(), 0, 0, 0, g3), bots = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.283, w = at(new THREE.Group(), Math.cos(a) * 4.2, 0, Math.sin(a) * 4.2, orbit); const b = bot(0.8, i % 2 ? C.white : C.raised); w.add(b); const sp = at(box(3, 0.06, 0.06, C.mid, { edge: false }), -Math.cos(a) * 2.1, 0.5, -Math.sin(a) * 2.1, orbit); sp.position.set(Math.cos(a) * 2.2, 0.5, Math.sin(a) * 2.2); sp.rotation.y = -a; const p = at(sphere(0.16, C.red), 0, 0.5, 0, orbit); p.a = a; w.pulse = p; w.b = b; const r = at(torus(0.8, 0.05), Math.cos(a) * 4.2, 0.08, Math.sin(a) * 4.2, orbit); r.rotation.x = PI / 2; w.ring = r; return w; });
    const flows = Array.from({ length: 8 }, (_, i) => { const w = at(new THREE.Group(), 0, 0, 0, g3); const c = at(box(1.3, 1.8, 0.1, C.white), 0, 0, 0, w); at(face(S, String(i + 1), { size: 0.5, color: '#FF2B2B' }), -0.3, 0.5, 0.06, c); at(row(0.9, 0, C.dim, 0.08), 0, 0, 0.06, c); at(row(0.7, 0, C.dim, 0.08), -0.1, -0.25, 0.06, c); at(row(0.8, 0, C.dim, 0.08), -0.05, -0.5, 0.06, c); S.billboards.push(c); return w; });
    S.caption('8+ concept flows', 26, 28.9); S.burst([0, 3.4, 0], 26, 26);
    return (t) => {
      pop(br, t, 0.3, 0.6); pop(cust, t, 0.6, 0.5, 1); lane.reveal(eio(k(t, 0.9, 1.5)));
      msgs.forEach((m, i) => { const q = k(t, 1.4 + i * 1.4, 2.8 + i * 1.4); m.visible = q > 0 && q < 1; m.position.copy(lane.point(q)); m.rotation.y = q * 2; });
      pop(b1, t, 7.2, 0.6, 1);
      brands.forEach((b, i) => { pop(b, t, 11.4 + i * 0.2, 0.6); if (i === 1) { const w = eio(k(t, 16.8, 17.4)); b.b.scale.y = 1 + w * 0.4; b.l.position.y = 3.6 + w * 1.2; ranks[1].position.y = 4.5 + w * 1.2; ms[1].color.set(w > 0.5 ? C.red : C.ink); } });
      pop(ai, t, 10.4, 0.6, 1); pop(you, t, 10.2, 0.5, 1); pop(ask, t, 10.9, 0.4, t < 12.8 ? 1 : 0); pop(ans, t, 17.6);
      lines.forEach((l, i) => { l.reveal(eio(k(t, 12.2 + i * 0.15, 12.8 + i * 0.15))); const o = k(t, 12.9, 13.9), b = k(t, 14.1 + i * 0.25, 15.1 + i * 0.25); l.out.visible = o > 0 && o < 1; l.out.position.copy(l.point(eio(o))); l.in.visible = b > 0 && b < 1; l.in.position.copy(l.point(1 - eio(b))); });
      ranks.forEach((r, i) => pop(r, t, 15.6 + [0.6, 0.3, 0.9][i]));
      pop(core, t, 20.3, 0.6); orbit.rotation.y = t * 0.25;
      bots.forEach((w, i) => { pop(w.b, t, 20.9 + i * 0.2, 0.5, 1); const ph = ((t - 22 - i * 0.5) % 3) / 1.2; w.pulse.visible = t > 22 + i * 0.5 && ph > 0 && ph < 1; const rr = lerp(1.2, 3.8, ph); w.pulse.position.set(Math.cos(w.pulse.a) * rr, 0.5, Math.sin(w.pulse.a) * rr); w.ring.visible = ph > 0.9 && ph < 1.5 && t > 22; w.ring.scale.setScalar(1 + (ph - 0.9) * 1.5); });
      flows.forEach((w, i) => { const a = -t * 0.3 + i / 8 * 6.283; w.position.set(Math.cos(a) * 6.4, 3 + Math.sin(t * 1.3 + i) * 0.25, Math.sin(a) * 4.4 - 1); pop(w, t, 22 + i * 0.45); });
    };
  },
};

// ================================================================ STELLA alert rework
B['stella-alert-rework'] = {
  client: 'STELLA Automotive AI', title: 'Strip, tile, button: alerts that say what to do next', result: 'Every alert says what to do next. A design study for leadership review.',
  acts: [[0, 'AFTER THE CALL'], [10, 'STRIP · TILE · BUTTON'], [20, 'WORK THE QUEUE']],
  cam: [[0, [-3, 3.4, 15], [0, 2.2, 0]], [9.6, [2.5, 3.2, 15], [0.4, 2.2, 0]], [10, [-4.5, 4, 15.5], [0, 3.1, 0]], [19.6, [3, 3.4, 13.5], [0, 3.1, 0]], [20, [4.5, 3.6, 14], [0.4, 3.1, 0]], [28.9, [-2, 3.2, 12.5], [0, 3.1, 0]]],
  build(S) {
    const g1 = S.act(0), g = S.group(10, 31);
    const dev = at(new THREE.Group(), -4, 2.6, 0, g1); dev.add(box(5.4, 3.6, 0.3, C.white)); dev.rotation.y = 0.25;
    const dot = at(cyl(0.34, 0.12, C.red), -2, 1.1, 0.2, dev); dot.rotation.x = PI / 2; at(face(S, 'AI VOICE AGENT', { size: 0.24, mono: true, align: 'left' }), -1.4, 1.1, 0.17, dev);
    const wave = Array.from({ length: 18 }, (_, i) => at(box(0.14, 1.6, 0.14, C.ink), -2.2 + i * 0.26, -0.5, 0.25, dev));
    const pile = Array.from({ length: 7 }, (_, i) => { const b = at(box(3.6, 0.7, 0.24, C.white), 0, 0, 0, g1); at(sphere(0.14, C.red), -1.5, 0, 0.14, b); at(row(1.6 + rnd(i) * 1, 0, C.mid, 0.12), 0.1, 0, 0.13, b); b.to = [3.4 + (rnd(i, 1) - 0.5) * 1.6, 0.4 + i * 0.5, (rnd(i, 2) - 0.5) * 1.6]; b.r = [(rnd(i, 3) - 0.5) * 0.5 - 1.4, (rnd(i, 4) - 0.5) * 1.2, (rnd(i, 5) - 0.5) * 0.5]; return b; });
    S.caption('Seven follow-ups. Which first?', 7.6, 9.6);
    const sm = own(C.red), strip = at(box(10.4, 0.8, 0.5, C.red, { material: sm }), 0, 5.5, 0, g), sl = at(label(S, '3 FOLLOW-UPS NEED YOU', { size: 0.34, mono: true, billboard: false, align: 'left' }), -4.9, 0, 0.27, strip);
    const slotY = [3.95, 2.45, 0.95], info = [['ADVISOR CALLBACK', 'CALL BACK', C.red, 2, 21.6], ['CONFIRM APPOINTMENT', 'CONFIRM', C.mid, 0, 24.6], ['SEND RECALL TEXT', 'TEXT', C.dim, 1, 27.6]];
    const tiles = info.map(([title, btn, col, start, done], i) => {
      const w = at(new THREE.Group(), 0, 0, 0, g); w.add(box(10.4, 1.25, 0.4, C.white)); at(box(0.3, 1.25, 0.44, col, { edge: false }), -5.05, 0, 0, w);
      at(face(S, title, { size: 0.3, mono: true, align: 'left' }), -4.6, 0.12, 0.22, w); at(face(S, ['HIGH', 'MED', 'LOW'][i] + ' PRIORITY', { size: 0.18, mono: true, weight: 500, color: '#6B655E', align: 'left' }), -4.6, -0.3, 0.22, w);
      const b = at(box(2.4, 0.76, 0.3, C.ink), 3.7, 0, 0.3, w); at(face(S, btn, { size: 0.26, mono: true, color: '#fff' }), 0, 0, 0.16, b); const ok = at(check(), 3.7, 0, 0.7, w); ok.scale.setScalar(1.6);
      Object.assign(w, { b, ok, start, done, i }); S.burst([3.7, slotY[0], 0.8], done - 0.5, 20); return w;
    });
    const cur = at(cursor3d(), 0, 0, 0, g); S.billboards.push(cur);
    const fin = at(new THREE.Group(), 0, 2.6, 0.5, g), fc = cyl(1.5, 0.3, C.white); fc.rotation.x = PI / 2; fin.add(fc); at(box(0.9, 0.24, 0.1, C.ink), -0.45, -0.25, 0.2, fin).rotation.z = -0.8; at(box(1.7, 0.24, 0.1, C.ink), 0.3, 0.1, 0.2, fin).rotation.z = 0.9;
    S.caption('Each alert says what to do next', 16, 19.6); S.burst([0, 2.6, 1], 28.4, 30);
    return (t) => {
      pop(dev, t, 0.3, 0.6); wave.forEach((b, i) => { b.scale.y = t < 5.6 ? 0.2 + Math.abs(Math.sin(t * 5 + i * 0.9) * Math.sin(t * 1.7 + i * 0.4)) * 0.9 : 0.1; }); dot.scale.setScalar(1 + (t < 5.6 ? Math.sin(t * 8) * 0.12 : 0));
      pile.forEach((b, i) => { const a = 5 + i * 0.45, q = k(t, a, a + 0.7), bo = q < 1 ? eo(q) : 1; b.visible = t > a; b.position.set(b.to[0], lerp(11, b.to[1], bo) + (q >= 1 ? Math.abs(Math.sin(k(t, a + 0.7, a + 1.1) * PI)) * 0.25 : 0), b.to[2]); b.rotation.set(b.r[0] * bo + (1 - bo) * 4, b.r[1], b.r[2] + (1 - bo) * 3); });
      strip.position.y = lerp(11, 5.5, eo(k(t, 10.2, 10.9))); const left = t < 22.1 ? 3 : t < 25.1 ? 2 : t < 28.1 ? 1 : 0;
      sl.set(left === 3 ? '3 FOLLOW-UPS NEED YOU' : left === 2 ? '2 FOLLOW-UPS NEED YOU' : left === 1 ? '1 FOLLOW-UP NEEDS YOU' : 'ALL CLEAR'); sm.color.set(left ? C.red : C.white);
      tiles.forEach((w) => {
        let y = kf(t, [[14, slotY[w.start]], [15.1, slotY[w.i]]]), slot = w.i;
        for (let j = 0; j < w.i; j++) { const tj = info[j][4] + 0.7; y = t > tj ? lerp(slotY[slot], slotY[slot - 1], eio(k(t, tj, tj + 0.6))) : y; if (t > tj) slot--; }
        const inn = eo(k(t, 11 + w.start * 0.3, 11.7 + w.start * 0.3)), away = eio(k(t, w.done, w.done + 0.7)), cross_ = Math.sin(k(t, 14, 15.1) * PI) * (w.i - w.start);
        w.visible = inn > 0 && away < 1; w.position.set(lerp(-16, 0, inn) + away * 16, y, cross_ * 0.6 + away * 2); w.rotation.set(0, away * 1.2, -away * 0.4);
        w.b.position.z = 0.3 - Math.sin(k(t, w.done - 0.55, w.done - 0.2) * PI) * 0.22; pop(w.ok, t, w.done - 0.45, 0.3, 1.6);
      });
      const cp = kf(t, [[20.2, [7, 0.4]], [20.9, [4, 3.6]], [28, [4, 3.6]]]); cur.visible = t > 20.2 && t < 28.2; cur.position.set(cp[0], cp[1] - Math.sin(k(t, 21, 21.4) * PI) * 0.1, 1.2);
      pop(fin, t, 28.3, 0.5); fin.rotation.y = (1 - back(k(t, 28.3, 28.9))) * 3;
    };
  },
};

// ================================================================ Valero audit
B['valero-digital-ecosystem-audit'] = {
  client: 'Valero', title: 'What is this website for?', result: '3-phase audit, 6 personas, findings well received by Valero.',
  acts: [[0, 'WHAT IS THIS SITE FOR?'], [10, 'THREE-PHASE AUDIT'], [20, 'SIX PERSONAS']],
  cam: [[0, [0, 3.4, 18], [0, 2.8, 0]], [9.6, [0, 3.2, 15.5], [0, 2.8, 0]], [10, [-4, 3.8, 18], [-1, 2.4, 0]], [19.6, [4, 3.8, 17], [1, 2.4, 0]], [20, [-4, 5, 17], [0, 1.8, 0]], [29, [2.5, 4.4, 15.5], [0, 1.8, 0]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3 = S.act(2);
    const sites = [-1, 1].map((s) => { const w = at(new THREE.Group(), s * 3.7, 2.9, 0, g1), sc = screen(S, 5.4, 4.2, s < 0 ? 'SITE A' : 'SITE B'); w.add(sc); w.s = s; at(box(4.8, 1.3, 0.06, C.raised, { edge: false }), 0, 0.3, 0.1, sc); const fr = at(box(4.9, 1.4, 0.04, C.red, { edge: false }), 0, 0.3, 0.07, sc); w.fr = fr; [0, 1, 2].forEach((i) => at(row([3.4, 2.6, 3][i], 0, C.dim, 0.12), -0.6 + [0, -0.4, -0.2][i], -0.75 - i * 0.3, 0.1, sc)); at(box(1.5, 0.4, 0.08, C.mid), -1.6, -1.75, 0.1, sc); return w; });
    const q = at(label(S, '?', { size: 3, color: '#FF2B2B' }), 0, 3.2, 1.6, g1); S.burst([0, 3.2, 1.8], 4.4, 26); S.caption('Two sites, one job?', 5.4, 9.6);
    const xs = [-6.5, -3.9, -1.3, 1.3, 3.9, 6.5], names = ['PUMP', 'CAR', 'FLEET', 'APP', 'CARD', 'WEB'], finds = [3, 1, 4, 2, 2, 5];
    const tps = xs.map((x, i) => {
      const g = at(new THREE.Group(), x, 0, 0, g2); at(cyl(1, 0.2, C.white), 0, 0.1, 0, g); let o;
      if (i === 0) { o = new THREE.Group(); at(box(0.8, 1.5, 0.6, C.white), 0, 0.75, 0, o); at(box(0.5, 0.4, 0.05, C.dim), 0, 1.1, 0.31, o); at(box(0.12, 0.7, 0.12, C.ink), 0.55, 0.8, 0, o); }
      if (i === 1) { o = car('EV', C.ink); o.scale.setScalar(0.42); o.rotation.y = 0.5; }
      if (i === 2) { o = car('TRUCK', C.ink); o.scale.setScalar(0.42); o.rotation.y = 0.5; }
      if (i === 3) { o = new THREE.Group(); at(box(0.8, 1.5, 0.12, C.white), 0, 0.9, 0, o); at(box(0.6, 1, 0.03, C.raised, { edge: false }), 0, 0.95, 0.07, o); }
      if (i === 4) { o = new THREE.Group(); const c = at(box(1.3, 0.8, 0.06, C.white), 0, 0.8, 0, o); at(box(1.3, 0.18, 0.03, C.ink), 0, 0.15, 0.04, c); c.rotation.x = -0.4; }
      if (i === 5) { o = new THREE.Group(); const s = at(screen(S, 1.5, 1.1), 0, 0.85, 0, o); }
      at(o, 0, 0.2, 0, g); g.o = o; at(tag(S, names[i], { size: 0.22 }), 0, 2.4, 0, g);
      g.dots = Array.from({ length: finds[i] }, (_, j) => at(sphere(0.16, C.red), (j - (finds[i] - 1) / 2) * 0.4, 3.1, 0, g)); return g;
    });
    const scan = at(torus(1.6, 0.09), 0, 1.5, 0, g2); scan.rotation.y = PI / 2;
    const phases = [0, 1, 2].map((i) => { const m = own(C.white), d = at(cyl(0.5, 0.14, C.white, { material: m }), (i - 1) * 3, 5.1, -1, g2); d.rotation.x = PI / 2; d.m = m; at(tag(S, 'PHASE ' + (i + 1), { size: 0.18 }), (i - 1) * 3, 4.3, -1, g2); return d; });
    const pl = at(box(6, 0.08, 0.08, C.ink), 0, 5.1, -1.05, g2);
    S.caption('Consumer and fleet, side by side', 17.2, 19.6);
    const who = ['DRIVER', 'COMMUTER', 'ROAD TRIP', 'FLEET MGR', 'DRIVER', 'OWNER-OP'], pers = who.map((n, i) => { const fleet = i > 2, g = at(new THREE.Group(), ((i % 3) - 1) * 3.8, 0, fleet ? -2.2 : 1.4, g3); at(box(2.4, fleet ? 1.6 : 0.6, 1.8, fleet ? C.ink : C.white), 0, (fleet ? 1.6 : 0.6) / 2, 0, g); const top = fleet ? 1.6 : 0.6; at(pawn(fleet ? C.raised : C.white, 1.1), 0, top, 0, g); at(tag(S, n, { size: 0.2 }), 0, Math.max(0.34, top * 0.5), 1.2, g); g.ok = at(check(), 0.6, top + 1.5, 0.4, g); S.billboards.push(g.ok); g.ok.scale.setScalar(1.3); return g; });
    const cons = at(tag(S, 'CONSUMER', { size: 0.3 }), -6.6, 0.6, 1.4, g3), flt = at(tag(S, 'FLEET', { size: 0.3, bg: '#111', color: '#fff' }), -6.6, 2, -2.2, g3);
    S.burst([0, 4, 0], 26.6, 30); S.caption('Findings well received by Valero', 26.6, 28.9);
    return (t) => {
      sites.forEach((w, i) => { pop(w, t, 0.3 + i * 0.4, 0.6); w.rotation.y = -w.s * (0.35 + Math.sin(t * 0.8) * 0.05); w.fr.visible = t > 2.2 + i * 0.4; });
      pop(q, t, 4.4, 0.6); q.position.y = 3.2 + Math.sin(t * 2.2) * 0.2;
      const sx = kf(t, [[11.6, -9], ...xs.flatMap((x, i) => [[12.3 + i, x], [12.8 + i, x]]), [18.6, 9.5]]); scan.position.x = sx; scan.visible = t > 11.6 && t < 18.6; scan.scale.setScalar(1 + Math.sin(t * 9) * 0.04);
      tps.forEach((g, i) => { pop(g, t, 10.4 + i * 0.18, 0.5); g.o.rotation.y = (i === 1 || i === 2 ? 0.5 : 0) + Math.sin(k(t, 12.3 + i, 13.2 + i) * PI) * 0.6; g.dots.forEach((d, j) => pop(d, t, 12.7 + i + j * 0.09, 0.35)); });
      phases.forEach((d, i) => { pop(d, t, 10.3 + i * 0.15); d.m.color.set(t > 10.6 + i * 3 ? C.red : C.white); });
      pers.forEach((g, i) => { pop(g, t, 20.3 + i * 0.35, 0.6); pop(g.ok, t, 24.6 + i * 0.3, 0.4, 1.3); }); pop(cons, t, 22.6); pop(flt, t, 22.9);
    };
  },
};
