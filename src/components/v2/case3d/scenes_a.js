import { THREE, C, k, eo, eio, back, lerp, rnd, kf, pop, show, at, box, cyl, sphere, torus, prism, extrude, pawn, bot, house, shield, check, cross, cursor3d, car, tube, arc, inst, dummy, label, tag, face, own, mat } from './engine.js';

export const PI = Math.PI;
// a browser-like slab, origin at its centre
export function screen(S, w, h, title) {
  const g = new THREE.Group();
  g.add(box(w, h, 0.16, C.white));
  at(box(w, 0.34, 0.04, C.raised, { edge: false }), 0, h / 2 - 0.17, 0.09, g);
  for (let i = 0; i < 3; i++) at(sphere(0.06, C.dim, { edge: false }), -w / 2 + 0.25 + i * 0.22, h / 2 - 0.17, 0.12, g);
  if (title) at(face(S, title, { size: 0.3, mono: true, align: 'left' }), -w / 2 + 0.3, h / 2 - 0.72, 0.1, g);
  return g;
}
export const row = (w, y, color = C.raised, h = 0.34) => { const b = box(w, h, 0.05, color, { edge: false }); b.position.y = y; b.castShadow = false; return b; };
const building = (i) => {
  const g = new THREE.Group();
  if (i === 0) { at(box(2.2, 1.3, 1.6), 0, 0.65, 0, g); at(box(0.4, 1.2, 0.4), 0.6, 1.9, 0, g); at(box(0.44, 0.2, 0.44, C.red), 0.6, 2.6, 0, g); at(prism(1, 0.5, 1.6, C.ink), -0.55, 1.3, 0, g); }
  if (i === 1) { at(box(2.2, 1.2, 1.8, C.raised), 0, 0.6, 0, g); at(prism(2.5, 0.7, 1.9, C.ink), 0, 1.2, 0, g); at(box(0.9, 0.8, 0.06, C.dim), 0, 0.4, 0.9, g); }
  if (i === 2) { at(box(1.9, 1.4, 1.4), 0, 0.7, 0, g); const a = at(box(2.1, 0.12, 0.7, C.red), 0, 1.15, 0.9, g); a.rotation.x = 0.4; at(box(0.5, 0.8, 0.06, C.ink), 0, 0.4, 0.71, g); }
  if (i === 3) { at(box(1.9, 1.3, 1.6, C.red), 0, 0.65, 0, g); at(prism(2.2, 0.9, 1.7, C.ink), 0, 1.3, 0, g); at(box(0.7, 0.8, 0.06, C.white), 0, 0.4, 0.8, g); }
  return g;
};

export const A = {};

// ================================================================ BASF portal
A['basf-agriculture-customer-portal'] = {
  client: 'BASF Agriculture', title: "BASF's first direct line to its customers", result: 'Partner Portal launched. First direct customer portal designed and built.',
  acts: [[0, 'THE CHAIN TODAY'], [10, 'PARTNER PORTAL'], [20, 'DIRECT TO GROWERS']],
  cam: [[0, [-2.5, 3.4, 18], [0, 1.8, 0]], [9.6, [3, 4.4, 16.5], [0, 1.8, 0]], [10, [-4, 4, 15], [0, 2.4, 0]], [19.6, [4, 3.4, 13.5], [0, 2.4, 0]], [20, [3, 5, 16], [0, 1.8, 0]], [29, [-3.5, 3.4, 13.5], [0, 2, 0]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3 = S.act(2), xs = [-6, -2, 2, 6], names = ['BASF', 'DISTRIBUTOR', 'RETAILER', 'GROWER'];
    const b1 = xs.map((x, i) => at(building(i), x, 0, 0, g1));
    const t1 = xs.map((x, i) => at(tag(S, names[i]), x, 3.3, 0, g1));
    const chain = tube([[-6, 0.06, 1.3], [6, 0.06, 1.3]], C.ink, 0.05); g1.add(chain);
    const ball = at(sphere(0.34, C.red), 0, 0, 0, g1);
    const waits = [at(tag(S, 'WAIT'), -2, 4.1, 0, g1), at(tag(S, 'WAIT'), 2, 4.1, 0, g1)];
    const qs = [at(label(S, '?', { size: 1.5, color: '#FF2B2B' }), -6, 4.6, 0, g1), at(label(S, '?', { size: 1.5, color: '#FF2B2B' }), 6, 4.6, 0, g1)];
    S.caption('Who bought what? Nobody sees it all.', 8.4, 9.7);
    // act 2
    const scr = at(screen(S, 6.4, 4.4, 'PARTNER PORTAL'), 0, 2.7, 0, g2);
    const rows = [0, 1, 2, 3].map((i) => { const r = row(5.8, 0.75 - i * 0.55); r.position.z = 0.1; scr.add(r); at(row([2.6, 2, 3, 2.3][i], 0, C.mid, 0.12), -1.3 + [0, -0.3, 0.2, -0.15][i], 0, 0.04, r); return r; });
    const ticks = rows.map((r, i) => at(check(), 2.5, 0.75 - i * 0.55, 0.2, scr));
    const bar = at(box(5.8, 0.3, 0.06, C.red, { edge: false }), -2.9, -1.75, 0.12, scr); bar.geometry.translate(2.9, 0, 0);
    at(row(5.8, -1.75, C.raised, 0.3), 0, -1.75, 0.09, scr);
    at(face(S, 'REBATES', { size: 0.2, mono: true, color: '#6B655E', align: 'left' }), -2.9, -1.35, 0.1, scr);
    const ppl = [-6.2, 6.2].map((x, i) => { const p = at(pawn(C.white, 1.3), x, 0, 1.5, g2); at(tag(S, i ? 'RETAILER' : 'DISTRIBUTOR'), x, 2.4, 1.5, g2); return p; });
    const beams = [-1, 1].map((s) => { const b = tube([[s * 5.8, 1.2, 1.5], [s * 3.2, 2.4, 0.1]], C.red, 0.05); g2.add(b); return b; });
    const pc = [-6.2, 6.2].map((x) => at(check(), x + 0.6, 2, 1.9, g2)); pc.forEach((c) => S.billboards.push(c));
    S.caption('Same numbers, both sides of the deal', 17, 19.7); S.burst([-5.6, 2, 1.9], 16.6); S.burst([6.8, 2, 1.9], 16.6);
    // act 3
    at(building(0), -5.6, 0, 0, g3); at(tag(S, 'BASF'), -5.6, 3.3, 0, g3);
    const old = [-2, 0.4, 2.8].map((x) => { const b = at(box(1.3, 1, 1.3, C.raised), x, 0.5, 0.2, g3); b.geometry.translate(0, 0.5, 0); b.position.y = 0; return b; });
    const ph = at(new THREE.Group(), 5.6, 2.3, 0, g3); ph.add(box(2.3, 4.4, 0.22, C.white)); ph.rotation.y = -0.3;
    at(face(S, 'MY ORDERS', { size: 0.22, mono: true, align: 'left' }), -0.9, 1.75, 0.13, ph);
    const cards = [0, 1, 2].map((i) => { const r = at(box(1.9, 0.8, 0.08, C.raised), 0, 0.9 - i * 1, 0.14, ph); at(row(0.9, 0, C.mid, 0.1), 0.3, 0.12, 0.05, r); at(row(0.5, 0, C.dim, 0.1), 0.1, -0.14, 0.05, r); at(box(0.4, 0.4, 0.03, C.red, { edge: false }), -0.6, 0, 0.05, r); return r; });
    const done = at(check(), 0.85, -1.75, 0.2, ph); done.scale.setScalar(1.5);
    const line = arc([-5, 2.8, 0], [4.6, 2.9, 0.3], 3.2, C.red, 0.09); g3.add(line);
    const direct = at(tag(S, 'DIRECT', { bg: '#FF2B2B', size: 0.34 }), -0.2, 5.3, 0.1, g3);
    const outs = [0, 1, 2].map(() => at(sphere(0.2, C.white), 0, 0, 0, g3)), ins = [0, 1, 2].map(() => at(sphere(0.2, C.red), 0, 0, 0, g3));
    S.burst([6.3, 0.6, 0.6], 26.4); S.burst([-0.2, 4.6, 0.1], 22.5);
    return (t) => {
      b1.forEach((b, i) => { pop(b, t, 0.3 + i * 0.4); pop(t1[i], t, 0.6 + i * 0.4); });
      chain.reveal(eio(k(t, 2.2, 3.3)));
      const hop = clamp3(t), j = Math.min(2, Math.floor(hop)), p = eio(hop - j);
      ball.visible = t > 3.2 && t < 9.2; ball.position.set(lerp(xs[j], xs[j + 1], hop >= 3 ? 1 : p), 3.2 + Math.sin(Math.PI * (hop >= 3 ? 1 : p)) * 1.6 - (hop >= 3 ? k(t, 8.5, 9.1) * 2 : 0), 0); ball.scale.setScalar(lerp(1, 0.3, hop / 3));
      pop(waits[0], t, 4.6, 0.3, t < 5.4 ? 1 : 0); pop(waits[1], t, 6.5, 0.3, t < 7.3 ? 1 : 0);
      qs.forEach((q, i) => { pop(q, t, 8.3 + i * 0.3); q.position.y = 4.6 + Math.sin(t * 3 + i) * 0.12; });
      pop(scr, t, 10.2, 0.6); rows.forEach((r, i) => pop(r, t, 10.9 + i * 0.3)); ticks.forEach((c, i) => pop(c, t, 13.6 + i * 0.6));
      bar.scale.x = Math.max(0.001, eio(k(t, 13, 16)) * 0.72);
      ppl.forEach((p, i) => pop(p, t, 11.2 + i * 0.2, 0.5, 1)); beams.forEach((b) => b.reveal(eio(k(t, 12, 12.7)))); pc.forEach((c) => pop(c, t, 16.6));
      old.forEach((b, i) => { b.scale.y = lerp(1, 0.12, eio(k(t, 24.4 + i * 0.2, 25.2 + i * 0.2))); });
      pop(ph, t, 20.5, 0.6); ph.rotation.y = -0.3; cards.forEach((c, i) => pop(c, t, 22.6 + i * 0.4)); pop(done, t, 26.4, 0.5, 1.5);
      line.reveal(eio(k(t, 21.3, 22.4))); pop(direct, t, 22.5);
      outs.forEach((o, i) => { const q = ((t - 23 - i * 0.9) % 2.7) / 1.2; o.visible = t > 23 + i * 0.9 && q > 0 && q < 1; o.position.copy(line.point(q)); });
      ins.forEach((o, i) => { const q = ((t - 24.3 - i * 0.9) % 2.7) / 1.2; o.visible = t > 24.3 + i * 0.9 && q > 0 && q < 1; o.position.copy(line.point(1 - q)); });
    };
    function clamp3(t) { // 0..3 across three hops with pauses
      return kf(t, [[3.4, 0], [4.4, 1], [5.2, 1], [6.2, 2], [7.0, 2], [8.0, 3]], (x) => x);
    }
  },
};

// ================================================================ GM Build & Price
A['general-motors-build-price-platform-redesign'] = {
  client: 'General Motors', title: 'Rebuilding how people build a vehicle', result: 'Clearer model choice, real comparison, one builder that scales across brands.',
  acts: [[0, 'TOO MANY CHOICES'], [10, 'PICK, THEN COMPARE'], [20, 'ONE BUILDER, EVERY BRAND']],
  cam: [[0, [0, 3.4, 18], [0, 3.1, 0]], [9.6, [4.5, 2.6, 9], [0, 3.1, 0]], [10, [0, 4.2, 16], [0, 1.4, 0]], [14.6, [1.5, 3.6, 14.5], [0, 1.4, 0]], [15, [0, 3.6, 15.5], [0, 1.6, 0]], [19.6, [-2, 3, 13.5], [0, 1.6, 0]], [20, [3.5, 3.2, 13.5], [0, 1.8, 0]], [29, [-3, 3.6, 13], [0, 1.8, 0]]],
  build(S) {
    const g1 = S.act(0), g2a = S.group(10, 14.8), g2b = S.group(14.8, 20), g3 = S.act(2);
    const N = 212, wall = inst(new THREE.BoxGeometry(0.52, 0.34, 0.1), N, C.white); g1.add(wall);
    const col = new THREE.Color(); for (let i = 0; i < N; i++) wall.setColorAt(i, col.set([C.white, C.raised, C.dim][Math.floor(rnd(i, 4) * 3)]));
    const pick = at(box(0.7, 0.5, 0.08, C.red, { edge: false }), 0, 0, 0, g1), seq = [23, 131, 67, 190, 45, 150, 98, 171];
    const cell = (i) => [((i % 20) - 9.5) * 0.66, 0.7 + Math.floor(i / 20) * 0.48];
    const big = at(label(S, '212 OPTIONS', { size: 0.8, bg: '#fff' }), 0, 6.6, 1, g1);
    S.caption('One long page per brand', 4, 9.6);
    const kinds = ['EV', 'SUV', 'TRUCK'], names = ['CAR', 'SUV', 'TRUCK'];
    const trio = kinds.map((kd, i) => { const g = at(new THREE.Group(), (i - 1) * 5, 0, 0, g2a); at(cyl(2.1, 0.25, C.white), 0, 0.125, 0, g); const c = at(car(kd), 0, 0.25, 0, g); c.scale.setScalar(0.85); g.car = c; at(tag(S, names[i]), 0, 2.6, 0, g); return g; });
    const halo = at(torus(2.3, 0.09), 0, 0.3, 0, g2a); halo.rotation.x = PI / 2; S.burst([0, 1.2, 1], 12.6, 22);
    const duo = [at(car('SUV'), -3.9, 0, -0.5, g2b), at(car('TRUCK'), 3.9, 0, -0.5, g2b)]; duo[0].rotation.y = 0.35; duo[1].rotation.y = PI - 0.35;
    at(tag(S, 'SUV'), -3.9, 2.7, -0.5, g2b); at(tag(S, 'TRUCK'), 3.9, 2.7, -0.5, g2b);
    const specs = [['MPG', 2.4, 1.5], ['TOW', 1.2, 2.7], ['SEATS', 2.1, 1.6]], cols = [];
    specs.forEach(([lab, a, b], i) => {
      const z = 2.4, xl = -1.5 + i * 0.01 - (2 - i) * 0.0, x = (i - 1) * 1.0;
      [[x - 0.0 - 0.22, a, a > b], [x + 0.22, b, b > a]].forEach(([xx, hgt, win], s) => { const c = at(box(0.36, hgt, 0.36, win ? C.red : C.mid), xx, 0, z, g2b); c.geometry.translate(0, hgt / 2, 0); c.t0 = 15.6 + i * 0.4 + s * 0.15; cols.push(c); });
      at(tag(S, lab, { size: 0.2 }), x, 3.3, z, g2b);
    });
    S.caption('Left bar SUV, right bar truck: compare at a glance', 16.6, 19.6);
    at(cyl(3.2, 0.3, C.white), 0, 0.15, 0, g3);
    const hero = at(car('SUV'), 0, 0.3, 0, g3); hero.scale.setScalar(1.25);
    const sw = [C.ink, C.red, C.mid].map((c, i) => at(sphere(0.3, c), (i - 1) * 0.9, 0.3, 3.8, g3)), ringSel = at(torus(0.42, 0.05, C.ink), 0, 0.3, 3.8, g3); ringSel.rotation.x = PI / 2;
    const brand = at(label(S, 'CHEVROLET', { size: 0.5, mono: true, bg: '#fff' }), -3.3, 4.1, 0, g3), price = at(label(S, '$31,200', { size: 0.6, bg: '#fff' }), 3.3, 4.1, 0, g3);
    const cta = at(tag(S, 'BUILD IT', { bg: '#111', color: '#fff', size: 0.26 }), 3.3, 3.1, 0, g3);
    S.burst([0, 2.2, 1], 27.6, 24); S.burst([0, 2, 1], 23.6);
    const cuts = [[20, C.ink, 0, 'CHEVROLET', '$31,200'], [23.6, C.red, 1, 'GMC', '$34,950'], [25.6, C.mid, 2, 'BUICK', '$35,400'], [27.6, C.red, 1, 'CADILLAC', '$38,425']];
    return (t) => {
      for (let i = 0; i < N; i++) {
        const [x, y] = cell(i), a = 0.3 + rnd(i) * 2.6, p = back(k(t, a, a + 0.4)), chaos = eio(k(t, 3, 7)), out = eio(k(t, 9.1, 9.9));
        dummy.position.set(x * (1 + out * 2), y + out * (rnd(i, 2) - 0.3) * 6, Math.sin(t * 1.4 + i * 1.7) * 0.5 * chaos + (rnd(i, 3) - 0.5) * 2.4 * chaos + out * 6 * (rnd(i, 5) - 0.5));
        dummy.rotation.set(chaos * Math.sin(t + i) * 0.3, chaos * Math.cos(t * 0.8 + i) * 0.4, 0); dummy.scale.setScalar(Math.max(0.001, p)); dummy.updateMatrix(); wall.setMatrixAt(i, dummy.matrix);
      }
      wall.instanceMatrix.needsUpdate = true;
      const si = Math.floor(k(t, 3.6, 9.2) * (seq.length - 0.01)), [px, py] = cell(seq[si]); pick.visible = t > 3.6 && t < 9.1; pick.position.set(px, py, -0.4);
      pop(big, t, 3);
      trio.forEach((g, i) => { pop(g, t, 10.3 + i * 0.25); g.car.rotation.y = t * 0.6 + i; if (i === 1) g.position.y = Math.sin(k(t, 12.6, 13.1) * PI) * 0.5; });
      pop(halo, t, 12.6, 0.4);
      duo.forEach((c, i) => pop(c, t, 14.9 + i * 0.15)); cols.forEach((c) => { c.visible = t > c.t0; c.scale.y = Math.max(0.001, back(k(t, c.t0, c.t0 + 0.7))); });
      let cur = cuts[0]; cuts.forEach((c) => { if (t >= c[0]) cur = c; });
      hero.body.material.color.set(cur[1]); hero.rotation.y = t * 0.55; hero.position.y = 0.3 + Math.sin(k(t, cur[0], cur[0] + 0.5) * PI) * 0.35;
      ringSel.position.x = (cur[2] - 1) * 0.9; brand.set(cur[3]); price.set(cur[4]); pop(cta, t, 27.6);
    };
  },
};

// ================================================================ City of Raleigh
A['city-of-raleigh-website-redesign'] = {
  client: 'City of Raleigh', title: 'A city website built around what people came to do', result: 'Tested with 11 residents, then presented to City Council.',
  acts: [[0, '7,700 PAGES'], [5.3, 'THE TEAM'], [10, 'BUILT AROUND TASKS'], [20, 'TESTED, THEN COUNCIL']],
  cam: [[0, [0, 2.5, 19], [0, 3.6, 0]], [5.1, [5, 5, 13], [0, 3, 0]], [5.3, [0, 3, 13], [0, 1, 0]], [9.8, [1.5, 2.6, 11], [0, 1, 0]], [10, [0, 4, 18], [0, 3, 0]], [13, [0, 3.4, 15.5], [0, 3, 0]], [19.6, [-2.5, 3.4, 14.5], [0, 3, 0]], [20, [0, 4.4, 17], [0, 1.6, 0]], [29, [0, 5.5, 19], [0, 2.6, -1.5]]],
  build(S) {
    const g1 = S.group(0, 5.3), g2 = S.act(1), g3 = S.act(2), g4 = S.act(3), N = 7700;
    const pages = inst(new THREE.BoxGeometry(0.2, 0.26, 0.012), N, C.white); S.root.add(pages);
    const col = new THREE.Color(); for (let i = 0; i < N; i++) pages.setColorAt(i, col.set([C.white, C.white, C.raised, C.dim, C.red][Math.floor(rnd(i, 4) * (rnd(i, 9) > 0.93 ? 5 : 4))]));
    const cnt = at(label(S, '7,700 PAGES', { size: 1, bg: '#fff' }), 0, 4.2, 4.5, g1);
    const team = [-5, -3, -1, 1, 3, 5].map((x, i) => at(pawn(C.white, 1.25, i === 2), x, 0, 0, g2)), fresh = [-3, 1, 3].map((x) => at(pawn(C.raised, 1.25), x, 0, 0, g2));
    S.caption('Nearly the whole team moved on', 6.6, 8.1); S.caption('One lead held the work together', 8.3, 9.7);
    const names = ['Pay a bill', 'Report it', 'Trash day', 'Permits'], tpos = [[-2.05, 3.7], [2.05, 3.7], [-2.05, 1.35], [2.05, 1.35]];
    const tiles = tpos.map(([x, y], i) => { const m = own(C.white); const b = at(box(3.8, 2.1, 0.5, C.white, { material: m }), x, y, 0, g3); b.m = m; at(face(S, names[i], { size: 0.46 }), 0, 0, 0.27, b); return b; });
    const search = at(box(8, 0.8, 0.3, C.white), 0, 5.5, 0, g3); at(face(S, 'What do you need to do?', { size: 0.3, weight: 500, color: '#6B655E' }), -1.2, 0, 0.17, search);
    const cur = at(cursor3d(), 0, 0, 1.2, g3); S.billboards.push(cur);
    S.burst([-2.05, 3.7, 0.6], 13.5, 20); S.burst([-2.05, 1.35, 0.6], 16.7, 20); S.caption('Tasks first, departments second', 17.4, 19.7);
    const res = Array.from({ length: 11 }, (_, i) => { const a = (i - 5) * 0.2; return at(pawn(C.white, 0.9), Math.sin(a) * 6.4, 0, 4 - Math.cos(a) * 3, g4); });
    const oks = res.map((p) => at(check(), p.position.x + 0.35, 1.5, p.position.z + 0.2, g4)); oks.forEach((c) => S.billboards.push(c));
    const hall = at(new THREE.Group(), 0, 0, -3.5, g4);
    at(box(7.6, 0.4, 3, C.mid), 0, 0.2, 0, hall); at(box(7, 0.4, 2.6, C.ink), 0, 0.6, 0, hall);
    for (let i = 0; i < 6; i++) at(cyl(0.28, 3, C.white), -3 + i * 1.2, 2.3, 0.9, hall);
    at(box(7, 0.4, 2.6, C.ink), 0, 4, 0, hall); at(prism(7.4, 1.5, 2.6, C.white), 0, 4.2, 0, hall);
    const council = at(tag(S, 'CITY COUNCIL', { bg: '#FF2B2B', size: 0.4 }), 0, 6.6, -3.5, g4), eleven = at(tag(S, '11 RESIDENTS', { size: 0.3 }), 0, 2.3, 2.2, g4);
    S.burst([0, 6.2, -3], 26, 26);
    return (t) => {
      pages.visible = t < 5.3 || (t >= 10 && t < 12.9);
      if (t < 5.3) {
        for (let i = 0; i < N; i++) {
          const r = Math.sqrt(rnd(i)) * 4.2, a = rnd(i, 1) * 6.283 + t * 0.12, top = (1 - r / 4.2) * 7.2 * (0.25 + 0.75 * rnd(i, 2)), st = rnd(i, 3) * 3.2, p = eo(k(t, st, st + 1.1));
          dummy.position.set(Math.cos(a) * r, lerp(14 + rnd(i, 6) * 6, top + 0.1, p), Math.sin(a) * r);
          dummy.rotation.set((1 - p) * 9 + rnd(i, 7) * 1.4, a + (1 - p) * 6, rnd(i, 8) * 1.2); dummy.scale.setScalar(p > 0 ? 1 : 0.001); dummy.updateMatrix(); pages.setMatrixAt(i, dummy.matrix);
        }
        pages.instanceMatrix.needsUpdate = true;
      } else if (pages.visible) {
        for (let i = 0; i < N; i++) {
          const st = 10.1 + rnd(i, 3) * 1.2, p = eio(k(t, st, st + 1.3)), tp = tpos[i % 4], a = rnd(i, 1) * 6.283 + t * 2.4 * (1 - p), r = (2 + rnd(i) * 7) * (1 - p);
          dummy.position.set(tp[0] * p + Math.cos(a) * r, lerp(1 + rnd(i, 2) * 6.5, tp[1], p), Math.sin(a) * r * 0.6 + (1 - p) * 1);
          dummy.rotation.set(t * 3 + i, t * 2 + i, 0); dummy.scale.setScalar(Math.max(0.001, 1 - p * p)); dummy.updateMatrix(); pages.setMatrixAt(i, dummy.matrix);
        }
        pages.instanceMatrix.needsUpdate = true;
      }
      pop(cnt, t, 2.6);
      team.forEach((p, i) => { pop(p, t, 5.4 + i * 0.08, 0.4); if (i !== 2) { const l = 6.5 + [0, 0.3, 0, 0.6, 0.9, 1.2][i]; p.position.y = -eio(k(t, l, l + 0.6)) * 2.4; } });
      fresh.forEach((p, i) => pop(p, t, 8.3 + i * 0.3));
      tiles.forEach((b, i) => { pop(b, t, 11.5 + i * 0.22, 0.6); const hit = i === 0 ? 13.4 : i === 2 ? 16.6 : 99; b.position.z = -Math.sin(k(t, hit, hit + 0.35) * PI) * 0.5; b.m.color.set(t > hit + 0.12 && (i === 2 || t < 15.8) ? C.red : C.white); });
      pop(search, t, 10.9, 0.6);
      const cp = kf(t, [[12.4, [5, 0.5]], [13.3, [-1.6, 3.4]], [14.8, [-1.6, 3.4]], [16.5, [-1.6, 1.1]], [18, [-1.6, 1.1]]]); cur.visible = t > 12.4 && t < 18.4; cur.position.set(cp[0], cp[1], 1.3);
      res.forEach((p, i) => { pop(p, t, 20.3 + i * 0.15); pop(oks[i], t, 21.8 + i * 0.22); }); pop(eleven, t, 24);
      hall.position.y = lerp(-6.5, 0, eo(k(t, 24.4, 26))); hall.visible = t > 24.4; pop(council, t, 26);
    };
  },
};

// ================================================================ GM design system
A['general-motors-global-design-system'] = {
  client: 'General Motors', title: "One design language across GM's brands", result: 'One set of rules. Chevrolet, GMC and Buick each keep their voice.',
  acts: [[0, 'THREE RULEBOOKS'], [10, 'SHARED RULES'], [20, 'ONE RETAIL EXPERIENCE']],
  cam: [[0, [-2.5, 3.4, 18], [0, 2.6, 0]], [9.6, [2.5, 3.2, 16], [0, 2.6, 0]], [10, [3, 4, 15], [0, 2.8, 0]], [19.6, [-3, 3.2, 12.5], [0, 2.8, 0]], [20, [-4.5, 3.4, 15], [0, 2.6, 0]], [29, [4.5, 3, 13], [0, 2.6, 0]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3 = S.act(2), brands = ['CHEVROLET', 'GMC', 'BUICK'];
    const pages = brands.map((b, i) => {
      const g = at(new THREE.Group(), (i - 1) * 4.6, 2.5, 0, g1); g.add(box(3.2, 4.4, 0.16, C.white));
      at(box([2.4, 1.7, 2.1][i], [0.4, 0.26, 0.5][i], 0.05, C.ink), -0.2 + [0, -0.35, -0.15][i], 1.5, 0.1, g);
      for (let r = 0; r < 3; r++) at(row([2.5, 2, 2.3][r], 0, [C.mid, C.dim, C.mid][i], 0.14), -0.1, 0.7 - r * (0.32 + i * 0.1), 0.1, g);
      const btn = at(new THREE.Group(), -0.4, -1.4, 0.2, g); g.btn = btn;
      if (i === 0) btn.add(box(2, 0.6, 0.2, C.ink));
      if (i === 1) { btn.add(box(1.2, 0.5, 0.2, C.mid)); [-0.6, 0.6].forEach((x) => { const c = at(cyl(0.25, 0.2, C.mid), x, 0, 0, btn); c.rotation.x = PI / 2; }); }
      if (i === 2) { btn.add(box(1.9, 0.7, 0.2, C.dim)); [-0.95, 0.95].forEach((x) => { const c = at(cyl(0.35, 0.2, C.dim), x, 0, 0, btn); c.rotation.x = PI / 2; }); }
      at(tag(S, b), 0, 2.75, 0, g); return g;
    });
    const neq = [-2.3, 2.3].map((x) => at(label(S, '≠', { size: 0.7, bg: '#FF2B2B', round: 80 }), x, 2.6, 1, g1));
    S.caption('Same button, three different answers', 6, 9.6);
    const book = at(new THREE.Group(), 0, 2.9, 0, g2); book.add(box(5.2, 5.2, 0.3, C.white)); at(face(S, 'RULES', { size: 0.4, mono: true, align: 'left' }), -2.2, 2.05, 0.17, book);
    const ghosts = [-6.4, 6.4].map((x) => { const p = at(box(2.2, 3.2, 0.12, C.raised), x, 2.2, -1, g2); return p; });
    const rowsY = [1.1, 0.1, -0.9, -1.9], labs = ['RADIUS', 'SPACE', 'TYPE', 'COLOR'], toks = [];
    rowsY.forEach((y, i) => {
      at(face(S, labs[i], { size: 0.2, mono: true, color: '#6B655E', align: 'left' }), -2.2, y, 0.17, book);
      const g = new THREE.Group(); g2.add(g);
      if (i === 0) [0, 1, 2].forEach((j) => { const b = j === 0 ? box(0.6, 0.5, 0.2, C.white) : cyl(0.28, 0.2, C.white, { seg: j === 1 ? 8 : 28 }); if (j) b.rotation.x = PI / 2; at(b, j * 0.85 - 0.3, 0, 0, g); });
      if (i === 1) [0, 1, 2, 3, 4].forEach((j) => at(box(0.14, 0.5, 0.2, C.ink), j * 0.42 - 0.3, 0, 0, g));
      if (i === 2) [0, 1, 2].forEach((j) => at(box([2, 1.5, 1][j], [0.2, 0.14, 0.09][j], 0.2, C.ink), [0.5, 0.25, 0][j], 0.25 - j * 0.24, 0, g));
      if (i === 3) [C.ink, C.red, C.mid, C.dim].forEach((c, j) => at(sphere(0.24, c), j * 0.62 - 0.3, 0, 0.1, g));
      g.y = y; g.side = i % 2 ? 1 : -1; g.t0 = 11 + i * 1.6; toks.push(g);
    });
    const ok = at(check(), 2.3, 2.3, 0.3, book); ok.scale.setScalar(1.6); S.burst([2.3, 5.2, 0.4], 18, 22);
    S.caption('Four rules every brand agrees on', 16.4, 19.6);
    const pg = at(new THREE.Group(), 0, 2.8, 0, g3); pg.add(box(8.4, 5, 0.2, C.white));
    const hm = own(C.ink), heroB = at(box(7.8, 2, 0.16, C.ink, { material: hm }), 0, 1.2, 0.14, pg), bm = own(C.ink), btn = at(box(1.8, 0.5, 0.16, C.ink, { material: bm }), -2.9, -2, 0.16, pg);
    const bl = at(label(S, 'CHEVROLET', { size: 0.5, mono: true, color: '#fff', billboard: false, align: 'left' }), -3.5, 1.5, 0.24, pg);
    const cars = ['EV', 'TRUCK', 'SUV'].map((kd) => { const c = at(car(kd, C.white), 2.2, 0.35, 0.9, pg); c.scale.setScalar(0.6); c.rotation.y = -0.5; return c; });
    at(box(3.6, 0.1, 1.5, C.white), 2.2, 0.3, 0.9, pg);
    [0, 1, 2].forEach((i) => { const c = at(box(2.4, 1.3, 0.1, C.raised), (i - 1) * 2.7, -0.75, 0.14, pg); at(row(1.6, 0, C.mid, 0.12), -0.2, 0.25, 0.06, c); at(row(1.2, 0, C.dim, 0.12), -0.4, -0.05, 0.06, c); });
    const same = at(tag(S, 'SAME GRID, SAME RULES'), 1.2, -2, 0.3, pg); S.burst([0, 4, 1], 23.2, 20); S.burst([0, 4, 1], 26.2, 20);
    const skins = [[20, C.ink, 'CHEVROLET', '#fff'], [23.2, C.red, 'GMC', '#111'], [26.2, C.mid, 'BUICK', '#fff']];
    return (t) => {
      pages.forEach((p, i) => { pop(p, t, 0.4 + i * 0.4, 0.6); p.rotation.z = Math.sin(k(t, 3, 4.4) * PI * 3) * 0.05 * (i - 1 || 1); p.btn.scale.setScalar(1 + Math.sin(k(t, 5.6 + i * 0.6, 6.4 + i * 0.6) * PI) * 0.35); p.rotation.y = (1 - i) * 0.18; });
      neq.forEach((n, i) => pop(n, t, 4.6 + i * 0.4));
      pop(book, t, 10.2, 0.6); ghosts.forEach((g, i) => pop(g, t, 10.4 + i * 0.1));
      toks.forEach((g, i) => { const p = eio(k(t, g.t0, g.t0 + 1)); g.visible = t > g.t0; g.position.set(lerp(g.side * 6.4, 0, p), lerp(2.2, 2.9 + g.y, p) + Math.sin(p * PI) * 1.2, lerp(0, 0.4, p)); g.rotation.y = (1 - p) * g.side * 3; g.scale.setScalar(lerp(0.6, 1, p)); });
      pop(ok, t, 18, 0.5, 1.6);
      let sk = skins[0], si = 0; skins.forEach((s, i) => { if (t >= s[0]) { sk = s; si = i; } });
      hm.color.set(sk[1]); bm.color.set(sk[1]); bl.set(sk[2]); cars.forEach((c, i) => { c.visible = i === si; c.rotation.y = -0.5 + Math.sin(t * 0.8) * 0.2; });
      pg.rotation.y = Math.sin(k(t, sk[0] - 0.1, sk[0] + 0.5) * PI) * 0.25; pop(pg, t, 20.2, 0.6); pop(same, t, 21.4);
    };
  },
};

// ================================================================ OnStar
A['general-motors-onstar-shopping-pages-and-cart'] = {
  client: 'General Motors', title: "From supporting role to lead on OnStar's store", result: '18+ pages launched. 20,000 to 30,000 more weekly views.',
  acts: [[0, 'SUPPORT TO LEAD'], [10, 'A NEW CATALOG'], [20, 'CART, THEN TRAFFIC']],
  cam: [[0, [3, 3.2, 17], [0, 2.2, 0]], [9.6, [-2.5, 3.8, 14.5], [-0.5, 2.4, 0]], [10, [0, 5.5, 19], [0, 2.6, 0]], [19.6, [2.5, 4.6, 16.5], [0, 2.6, 0]], [20, [-3, 3.6, 15], [0, 1.8, 0]], [29, [3.5, 3.2, 13.5], [1, 2, 0]]],
  build(S) {
    const g1 = S.act(0), g2 = S.act(1), g3 = S.act(2);
    at(box(2.4, 2.4, 2.4, C.white), -2.5, 1.2, 0, g1); at(box(2.2, 1, 2.2, C.raised), 0.5, 0.5, 0, g1); at(box(2.2, 1, 2.2, C.raised), 2.9, 0.5, 0, g1);
    at(pawn(C.raised, 1.1), 0.5, 1, 0, g1); const me = at(pawn(C.white, 1.1, true), 2.9, 1, 0, g1);
    const lead = at(tag(S, 'LEAD DESIGNER', { bg: '#FF2B2B', size: 0.3 }), -2.5, 4.9, 0, g1), slot = at(torus(0.8, 0.04, C.dim), -2.5, 2.44, 0, g1); slot.rotation.x = PI / 2;
    const tl = at(box(11, 0.16, 0.4, C.ink), -5.5, 0.08, 3.2, g1); tl.geometry.translate(5.5, 0, 0);
    ['MONTH 1', 'MONTH 2', 'MONTH 3'].forEach((m, i) => at(tag(S, m, { size: 0.2 }), -5 + i * 5, 0.7, 3.2, g1));
    S.burst([-2.5, 3.6, 0], 5.5, 26); S.caption('Earned the lead within months of joining', 6.2, 9.6);
    const plans = ['SAFETY', 'CONNECTED', 'GUARDIAN'].map((p, i) => { const g = at(new THREE.Group(), (i - 1) * 4.2, 5.5, -2.5, g2); g.add(box(3.6, 1.8, 0.2, C.white)); const s = at(shield(i === 1 ? C.red : C.white, 0.15), -1.2, 0, 0.2, g); s.scale.setScalar(0.42); at(face(S, p, { size: 0.24, mono: true, align: 'left' }), -0.6, 0.3, 0.12, g); at(box(1.4, 0.36, 0.1, C.ink), 0.1, -0.35, 0.12, g); return g; });
    const cards = Array.from({ length: 18 }, (_, i) => { const g = at(new THREE.Group(), ((i % 9) - 4) * 1.5, 0, 0.8 - Math.floor(i / 9) * 1.5, g2); const c = at(box(1.2, 1.6, 0.1, C.white), 0, 0.8, 0, g); at(box(1, 0.4, 0.04, i % 5 === 0 ? C.red : C.dim, { edge: false }), 0, 0.5, 0.06, c); at(row(0.8, 0, C.mid, 0.08), -0.1, 0.05, 0.06, c); at(row(0.6, 0, C.mid, 0.08), -0.2, -0.2, 0.06, c); g.c = c; g.rotation.x = -0.25; return g; });
    const count = at(label(S, '0 PAGES', { size: 0.6, mono: true, bg: '#fff' }), 0, 3.5, -0.8, g2); S.burst([0, 3.6, -0.6], 17.8, 24);
    const cart = at(new THREE.Group(), -3.6, 0, 0, g3);
    at(box(2.6, 0.12, 1.6, C.white), 0, 0.7, 0, cart); [[-1.3, 0], [1.3, 0]].forEach(([x]) => at(box(0.1, 1.2, 1.6, C.white), x, 1.3, 0, cart)); at(box(2.6, 1.2, 0.1, C.white), 0, 1.3, -0.8, cart);
    at(box(0.1, 0.1, 1.6, C.ink), -1.9, 2.1, 0, cart); at(box(0.7, 0.1, 0.1, C.ink), -1.6, 2.0, 0.75, cart); at(box(0.7, 0.1, 0.1, C.ink), -1.6, 2.0, -0.75, cart);
    [[-0.9, 0.7], [0.9, 0.7], [-0.9, -0.7], [0.9, -0.7]].forEach(([x, z]) => { const w = at(cyl(0.3, 0.2, C.ink), x, 0.3, z, cart); w.rotation.x = PI / 2; });
    const plan = at(new THREE.Group(), 0, 0, 0, g3); plan.add(box(1.5, 1.1, 1, C.red)); const ps = at(shield(C.white, 0.1), 0, 0, 0.56, plan); ps.scale.setScalar(0.32);
    const one = at(label(S, '1', { size: 0.5, bg: '#FF2B2B', round: 80 }), -2.1, 3.1, 0.6, g3), co = at(tag(S, 'CHECKED OUT', { bg: '#FF2B2B', size: 0.34 }), -3.6, 4, 0, g3);
    const hs = [0.6, 0.8, 1.1, 1.7, 2.6, 3.8], bars = hs.map((h, i) => { const b = at(box(0.7, h, 0.7, i === 5 ? C.red : C.ink), 1.4 + i * 0.95, 0, 0, g3); b.geometry.translate(0, h / 2, 0); return b; });
    const up = at(label(S, '+20–30K', { size: 0.8, bg: '#fff' }), 3.6, 5.3, 0, g3), wk = at(tag(S, 'WEEKLY VIEWS'), 3.6, 4.5, 0, g3);
    S.burst([-3.6, 1.6, 0], 22.4, 18); S.burst([6.15, 4.2, 0], 26.6, 26);
    return (t) => {
      const p = eio(k(t, 4.2, 5.5)); me.position.set(lerp(2.9, -2.5, p), lerp(1, 2.4, p) + Math.sin(p * PI) * 2.2, 0); me.scale.setScalar(lerp(1, 1.35, p));
      pop(lead, t, 5.6); tl.scale.x = Math.max(0.001, k(t, 0.6, 5.5));
      plans.forEach((g, i) => { pop(g, t, 10.3 + i * 0.25, 0.6); g.position.y = 5.5 + Math.sin(t * 1.2 + i) * 0.1; });
      let n = 0; cards.forEach((g, i) => { const a = 12 + i * 0.33, q = eo(k(t, a, a + 0.6)); g.visible = t > a; if (t > a + 0.3) n = i + 1; g.c.position.y = lerp(9, 0.8, q); g.c.rotation.y = (1 - q) * 5; });
      count.set(n >= 18 ? '18+ PAGES' : n + ' PAGES'); pop(count, t, 12.2);
      pop(cart, t, 20.3, 0.6); cart.position.y = -Math.sin(k(t, 22.3, 22.8) * PI) * 0.25;
      const q = eio(k(t, 21.4, 22.4)); plan.visible = t > 20.6; plan.position.set(lerp(-7.4, -3.6, q), lerp(0.55, 1.35, q) + Math.sin(q * PI) * 2.6, 0); plan.rotation.z = -q * PI * 2; if (t < 21) pop(plan, t, 20.6);
      pop(one, t, 22.5); pop(co, t, 24.2);
      bars.forEach((b, i) => { b.visible = t > 24.8 + i * 0.28; b.scale.y = Math.max(0.001, back(k(t, 24.8 + i * 0.28, 25.5 + i * 0.28))); }); pop(up, t, 26.6); pop(wk, t, 24.8);
    };
  },
};

// ================================================================ MyCarDrive
A['gm-lab313-mycardrive'] = {
  client: 'GM Lab313', title: 'Who is the customer really talking to?', result: '13 hypotheses: 7 supported, 6 challenged. The hard part was trust.',
  acts: [[0, '13 HYPOTHESES'], [10, 'TESTED'], [20, 'WHO ARE THEY TALKING TO?']],
  cam: [[0, [0, 6, 16], [0, 2.4, 0]], [9.6, [-3, 4, 13], [0, 2.4, 0]], [10, [4, 5, 16], [0, 2.4, 0]], [19.6, [-2, 6, 16], [0, 2.6, 0]], [20, [-1.5, 3.4, 17.5], [1.5, 2.8, 0]], [29, [3.5, 3.2, 17], [1.7, 2.8, 0]]],
  build(S) {
    const g = S.group(0, 20), g3 = S.act(2), ok = new Set([0, 1, 3, 5, 6, 8, 11]);
    const cards = Array.from({ length: 13 }, (_, i) => {
      const back_ = i < 7, n = back_ ? i - 3 : i - 9.5, w = at(new THREE.Group(), n * 1.75, back_ ? 2.2 : 0, back_ ? -1.2 : 2.3, g);
      const c = at(box(1.4, 2, 0.12, C.white), 0, 1, 0, w); c.geometry.translate(0, 1, 0); c.position.y = 0;
      at(face(S, 'H' + (i + 1), { size: 0.4, mono: true }), 0, 1.4, 0.07, c); at(row(0.9, 0, C.dim, 0.1), 0, 0.8, 0.07, c); at(row(0.7, 0, C.dim, 0.1), -0.1, 0.5, 0.07, c);
      const m = at(ok.has(i) ? check() : cross(), 0.55, 1.95, 0.2, c); m.scale.setScalar(1.3); w.c = c; w.m = m; w.base = w.position.y; return w;
    });
    at(box(13, 2.2, 2.6, C.raised), 0, 1.1, -1.4, g);
    S.caption('Written down before a single test', 6.2, 9.6);
    const sup = at(label(S, '7 SUPPORTED', { size: 0.6, bg: '#FF2B2B' }), -3.2, 5.6, 0, g), cha = at(label(S, '6 CHALLENGED', { size: 0.6, bg: '#fff' }), 3.2, 5.6, 0, g);
    S.burst([-3.2, 5.6, 0.2], 18.4, 24);
    const scr = at(new THREE.Group(), -2.4, 3.3, 0, g3); scr.add(box(7.6, 4.8, 0.2, C.white)); at(box(9, 0.3, 2.4, C.ink), -2.4, 0.75, 1.1, g3);
    const b1 = at(box(4, 0.8, 0.16, C.ink), 1.4, 1.5, 0.2, scr), b2 = at(box(4.2, 0.8, 0.16, C.raised), -1.3, 0.4, 0.2, scr);
    at(face(S, 'Is this price real?', { size: 0.32, color: '#fff' }), 0, 0, 0.1, b1); at(face(S, 'Yes, it is locked in.', { size: 0.32 }), 0, 0, 0.1, b2);
    const who = [[at(pawn(C.raised, 0.9), -2.6, -2.15, 0.4, scr), 'DEALER'], [at(pawn(C.raised, 0.9), -0.9, -2.15, 0.4, scr), 'GM'], [at(bot(0.8), 0.8, -2.15, 0.4, scr), 'BOT']];
    const wt = who.map(([o, n]) => at(tag(S, n, { size: 0.2 }), o.position.x, -0.55, 0.5, scr));
    const qm = at(label(S, '?', { size: 1.6, color: '#FF2B2B' }), 2.6, -0.9, 0.6, scr);
    const sh = at(new THREE.Group(), 5, 3.4, 0.5, g3); const s0 = shield(C.white, 0.3); s0.scale.setScalar(1.7); sh.add(s0); const s1 = at(shield(C.red, 0.34), 0, 0, 0, sh);
    const trust = at(tag(S, 'TRUST', { size: 0.36 }), 5, 0.6, 0.5, g3); S.burst([5, 3.4, 1], 27.2, 28);
    S.caption('The hardest problem was trust', 26.6, 28.9);
    return (t) => {
      cards.forEach((w, i) => {
        const a = 0.4 + i * 0.42, q = eo(k(t, a, a + 0.7)); w.visible = t > a;
        const f = 10.5 + i * 0.6, spin = eio(k(t, f, f + 0.6));
        w.position.y = w.base + (1 - q) * 9 + Math.sin(spin * PI) * 0.6; w.c.rotation.y = (1 - q) * 6 + spin * PI * 2;
        w.c.rotation.x = ok.has(i) ? 0 : -eio(k(t, f + 0.5, f + 1)) * 1.25; pop(w.m, t, f + 0.45, 0.4, 1.3);
      });
      pop(sup, t, 18.4); pop(cha, t, 18.7);
      pop(scr, t, 20.2, 0.6); pop(b1, t, 20.8); pop(b2, t, 22); pop(qm, t, 23.2); qm.position.y = -0.9 + Math.sin(t * 3) * 0.12;
      who.forEach(([o], i) => { pop(o, t, 23.5 + i * 0.3, 0.5, 1); pop(wt[i], t, 23.7 + i * 0.3); });
      pop(sh, t, 24.2, 0.6); sh.rotation.y = Math.sin(t * 0.9) * 0.4 + eio(k(t, 26.6, 27.4)) * PI * 2; const f = eio(k(t, 24.8, 27.2)); s1.scale.setScalar(Math.max(0.001, f * 1.72)); s1.visible = f > 0; pop(trust, t, 24.6);
    };
  },
};
