// Restaged scenes, batch three: BASF, OnStar, MyCarDrive, UX jams, MRM ARM, Valero.
import { THREE, C, k, eo, eio, back, lerp, rnd, kf, pop, at, box, cyl, sphere, torus, prism, pawn, bot, car, shield, check, cross, tube, arc, inst, dummy, face, tag, own } from './engine.js';
import { screen, row } from './scenes_a.js';

const PI = Math.PI;
export const V4 = {};
const ACTS = [[0, ''], [9, ''], [19, '']];

// An ink tick disc: a "done" mark that keeps red free for the payoff.
function ok(color = C.ink, mark = C.white) {
  const g = new THREE.Group(), d = cyl(0.32, 0.08, color); d.rotation.x = PI / 2; g.add(d);
  at(box(0.17, 0.07, 0.03, mark, { edge: false }), -0.1, -0.05, 0.06, g).rotation.z = -0.8; at(box(0.34, 0.07, 0.03, mark, { edge: false }), 0.05, 0.01, 0.06, g).rotation.z = 0.9;
  const w = new THREE.Group(); w.add(g); return w;
}
function bldg(i, col = C.white) {
  const g = new THREE.Group();
  if (i === 0) { at(box(2.2, 1.4, 1.6, col), 0, 0.7, 0, g); at(box(0.42, 1.4, 0.42, col), 0.6, 2, 0, g); at(prism(1, 0.5, 1.6, C.ink), -0.55, 1.4, 0, g); }
  if (i === 1) { at(box(2.3, 1.2, 1.8, col), 0, 0.6, 0, g); at(prism(2.6, 0.7, 1.9, C.ink), 0, 1.2, 0, g); at(box(0.9, 0.8, 0.06, C.dim), 0, 0.4, 0.92, g); }
  if (i === 2) { at(box(1.9, 1.4, 1.4, col), 0, 0.7, 0, g); const a = at(box(2.1, 0.12, 0.7, C.ink), 0, 1.15, 0.9, g); a.rotation.x = 0.4; at(box(0.5, 0.8, 0.06, C.ink), 0, 0.4, 0.71, g); }
  if (i === 3) { at(box(1.9, 1.3, 1.6, col), 0, 0.65, 0, g); at(prism(2.2, 0.9, 1.7, C.ink), 0, 1.3, 0, g); at(box(0.7, 0.8, 0.06, C.ink), 0, 0.4, 0.81, g); }
  const w = new THREE.Group(); w.add(g); return w;
}

// ================================================================ BASF: the chain loses the picture; then one direct line
V4['basf-agriculture-customer-portal'] = {
  client: 'BASF Agriculture', title: "BASF's first direct line to its customers", question: 'Who bought what?', result: 'Partner Portal launched. First direct customer portal designed and built.', warp: 1, acts: ACTS, sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-10, 1.5, 8], [-1, 1.4, 0], 46], [8.8, [-2, 2.6, 13], [1.5, 1.5, 0], 46], [9, [0, 3.4, 15.5], [0, 2.7, 0], 38], [18.8, [2.5, 3.2, 14], [0, 2.7, 0], 38], [19, [1, 3.8, 16], [0, 2.2, 0], 40], [25.6, [-2.5, 3.2, 14.5], [0, 2.2, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31), xs = [-7.5, -2.5, 2.5, 7.5];
    const b1 = xs.map((x, i) => at(bldg(i), x, 0, 0, g1));
    const hops = [0, 1, 2].map((i) => { const a = arc([xs[i] + 0.9, 1.8, 0], [xs[i + 1] - 0.9, 1.8, 0], 1.6, C.mid, 0.03); g1.add(a); return a; });
    const ballM = own(C.white), ball = at(sphere(0.42, C.white, { material: ballM }), 0, 0, 0, g1);
    S.caption('Every hop, less of the picture.', 4.6, 8.7);
    const scr = at(screen(S, 7, 4.6, 'PARTNER PORTAL'), 0, 2.8, 0, g2);
    const rows = [0, 1, 2, 3].map((i) => { const r = row(6.2, 0.8 - i * 0.58); r.position.z = 0.1; scr.add(r); at(row([2.8, 2.1, 3.2, 2.4][i], 0, C.mid, 0.12), -1.5 + [0, -0.3, 0.2, -0.15][i], 0, 0.04, r); return r; });
    const ticks = rows.map((r, i) => at(ok(), 2.7, 0.8 - i * 0.58, 0.2, scr));
    const ppl = [-6.4, 6.4].map((x) => at(pawn(C.white, 1.3), x, 0, 1.6, g2));
    const lines = [-1, 1].map((s) => { const b = tube([[s * 5.9, 1.3, 1.6], [s * 3.6, 2.4, 0.1]], C.ink, 0.05); g2.add(b); return b; });
    S.caption('One shared view, both sides of the deal.', 13.4, 18.8);
    const f3 = at(bldg(0), -5.8, 0, 0, g3), mids = [-2.2, 0.6].map((x, i) => at(bldg(i + 1, C.raised), x, 0, -1.5, g3));
    const ph = at(new THREE.Group(), 5.6, 2.4, 0, g3); ph.add(box(2.4, 4.6, 0.22, C.white)); ph.rotation.y = -0.3;
    const cards = [0, 1, 2].map((i) => { const r = at(box(1.9, 0.8, 0.08, C.raised), 0, 1 - i * 1.05, 0.14, ph); at(row(0.9, 0, C.mid, 0.1), 0.3, 0.12, 0.05, r); at(row(0.5, 0, C.dim, 0.1), 0.1, -0.14, 0.05, r); return r; });
    const done = at(check(), 0.85, -1.8, 0.2, ph); done.scale.setScalar(1.5);
    const line = arc([-5, 2.9, 0], [4.6, 3, 0.3], 3.2, C.red, 0.1); g3.add(line);
    const outs = [0, 1, 2].map(() => at(sphere(0.22, C.white), 0, 0, 0, g3));
    S.hero('Direct.', 'BASF to its customers, a first', 21.4, 26); S.burst([5.6, 1, 0.6], 23.4, 18);
    return (t) => {
      b1.forEach((b, i) => pop(b, t, 0.2 + i * 0.3, 0.6));
      hops.forEach((a, i) => a.reveal(eio(k(t, 1.2 + i * 0.3, 1.8 + i * 0.3))));
      const h = kf(t, [[2, 0], [3.1, 1], [3.6, 1], [4.7, 2], [5.2, 2], [6.3, 3]], (x) => x), j = Math.min(2, Math.floor(h)), p = eio(h - j);
      ball.visible = t > 2 && t < 8.6; ball.position.copy(hops[j].point(h >= 3 ? 1 : p)); const fade = h / 3; ball.scale.setScalar(Math.max(0.05, lerp(1, 0.35, fade) - eio(k(t, 6.8, 8.3)) * 0.35)); ballM.color.setRGB(lerp(1, 0.42, fade), lerp(1, 0.4, fade), lerp(1, 0.37, fade));
      pop(scr, t, 9.2, 0.6); rows.forEach((r, i) => pop(r, t, 9.9 + i * 0.3)); ticks.forEach((c, i) => pop(c, t, 14 + i * 0.5));
      ppl.forEach((pp, i) => pop(pp, t, 10.2 + i * 0.2, 0.5, 1)); lines.forEach((b) => b.reveal(eio(k(t, 11.2, 12))));
      pop(f3, t, 19.2, 0.5); mids.forEach((b, i) => { pop(b, t, 19.3, 0.5); b.position.y = -eio(k(t, 21 + i * 0.2, 22 + i * 0.2)) * 2.6; });
      pop(ph, t, 19.6, 0.6); cards.forEach((c, i) => pop(c, t, 21.6 + i * 0.35)); pop(done, t, 23.4, 0.5, 1.5);
      line.reveal(eio(k(t, 20.2, 21.4)));
      outs.forEach((o, i) => { const q = ((t - 21.6 - i * 0.7) % 2.1) / 1.1; o.visible = t > 21.6 + i * 0.7 && q > 0 && q < 1; o.position.copy(line.point(q)); });
    };
  },
};

// ================================================================ OnStar: a shelf nobody can read becomes a catalog, then traffic
V4['general-motors-onstar-shopping-pages-and-cart'] = {
  client: 'General Motors', title: "From supporting role to lead on OnStar's store", question: 'What can I actually buy here?', result: '18+ pages launched. 20,000 to 30,000 more weekly views.', warp: 1, acts: ACTS, sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-4, 1, 10.5], [0, 3, 0], 54], [8.8, [3, 1.3, 9.5], [0, 3, 0], 54], [9, [0, 5.2, 18], [0, 2.3, 0], 38], [18.8, [2.5, 4.8, 16.5], [0, 2.3, 0], 38], [19, [-1, 3.6, 15], [2, 2, 0], 40], [25.6, [4.5, 3.4, 14.5], [2.4, 2.2, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31);
    const shelf = at(new THREE.Group(), 0, 0, -1, g1);
    [0, 1, 2, 3].forEach((r) => at(box(12, 0.14, 1.4, C.white), 0, 0.9 + r * 1.55, 0, shelf));
    const boxes = []; for (let r = 0; r < 4; r++) for (let c = 0; c < 11; c++) { const b = at(box(0.8, 1, 0.8, [C.white, C.raised, C.dim][(r + c) % 3]), -5.2 + c * 1.04, 1.47 + r * 1.55, 0, shelf); boxes.push(b); }
    const me = at(pawn(C.white, 1), 0.4, 0, 3.2, g1);
    S.caption('A new catalog, and a new lead designer.', 4.4, 8.7);
    const plans = [0, 1, 2].map((i) => { const g = at(new THREE.Group(), (i - 1) * 4.2, 4.3, -2.5, g2); g.add(box(3.6, 1.8, 0.2, C.white)); const s = at(shield(C.white, 0.15), -1.2, 0, 0.2, g); s.scale.setScalar(0.42); at(row(1.4, 0, C.mid, 0.14), 0.3, 0.3, 0.12, g); at(box(1.4, 0.36, 0.1, C.ink), 0.1, -0.35, 0.12, g); return g; });
    const cards = Array.from({ length: 18 }, (_, i) => { const g = at(new THREE.Group(), ((i % 9) - 4) * 1.5, 0, 0.8 - Math.floor(i / 9) * 1.5, g2); const c = at(box(1.2, 1.6, 0.1, C.white), 0, 0.8, 0, g); at(box(1, 0.4, 0.04, i % 5 === 0 ? C.ink : C.dim, { edge: false }), 0, 0.5, 0.06, c); at(row(0.8, 0, C.mid, 0.08), -0.1, 0.05, 0.06, c); at(row(0.6, 0, C.mid, 0.08), -0.2, -0.2, 0.06, c); g.c = c; g.rotation.x = -0.25; return g; });
    S.caption('Plans you can actually compare.', 10.2, 15.2); S.hero('18+', 'pages built on the new catalog', 15.4, 18.8);
    const cart = at(new THREE.Group(), -1.2, 0, -1, g3);
    at(box(2.6, 0.12, 1.6, C.white), 0, 0.7, 0, cart); [-1.3, 1.3].forEach((x) => at(box(0.1, 1.2, 1.6, C.white), x, 1.3, 0, cart)); at(box(2.6, 1.2, 0.1, C.white), 0, 1.3, -0.8, cart);
    at(box(0.1, 0.1, 1.6, C.ink), -1.9, 2.1, 0, cart); [0.75, -0.75].forEach((z) => at(box(0.7, 0.1, 0.1, C.ink), -1.6, 2, z, cart));
    [[-0.9, 0.7], [0.9, 0.7], [-0.9, -0.7], [0.9, -0.7]].forEach(([x, z]) => { const w = at(cyl(0.3, 0.2, C.ink), x, 0.3, z, cart); w.rotation.x = PI / 2; });
    const plan = at(new THREE.Group(), 0, 0, 0, g3); plan.add(box(1.5, 1.1, 1, C.red)); const ps = at(shield(C.white, 0.1), 0, 0, 0.56, plan); ps.scale.setScalar(0.32);
    const hs = [0.6, 0.8, 1.1, 1.7, 2.6, 3.8], bars = hs.map((h, i) => { const b = at(box(0.7, h, 0.7, i === 5 ? C.red : C.ink), 2.8 + i * 0.95, 0, -1, g3); b.geometry.translate(0, h / 2, 0); return b; });
    S.hero('+20–30K', 'more weekly views', 22.6, 26); S.burst([-1.2, 1.6, -1], 21.2, 16); S.burst([7.55, 4.2, -1], 23.2, 20);
    return (t) => {
      pop(shelf, t, 0.2, 0.6, 1); boxes.forEach((b, i) => { const a = 0.4 + rnd(i) * 2.2; b.visible = t > a; b.rotation.y = Math.sin(t * 0.7 + i) * 0.12; });
      pop(me, t, 1.2, 0.5, 1); me.rotation.y = Math.sin(t * 1.3) * 0.9;
      plans.forEach((g, i) => { pop(g, t, 9.3 + i * 0.25, 0.6); g.position.y = 4.3 + Math.sin(t * 1.2 + i) * 0.1; });
      cards.forEach((g, i) => { const a = 10.4 + i * 0.28, q = eo(k(t, a, a + 0.6)); g.visible = t > a; g.c.position.y = lerp(9, 0.8, q); g.c.rotation.y = (1 - q) * 5; });
      pop(cart, t, 19.2, 0.6); cart.position.y = -Math.sin(k(t, 21.1, 21.6) * PI) * 0.25;
      const q = eio(k(t, 20.2, 21.2)); plan.visible = t > 19.5; plan.position.set(lerp(-5, -1.2, q), lerp(0.55, 1.35, q) + Math.sin(q * PI) * 2.6, -1); plan.rotation.z = -q * PI * 2; if (t < 20) pop(plan, t, 19.5);
      bars.forEach((b, i) => { b.visible = t > 21.6 + i * 0.25; b.scale.y = Math.max(0.001, back(k(t, 21.6 + i * 0.25, 22.3 + i * 0.25))); });
    };
  },
};

// ================================================================ MyCarDrive: who is on the other side of the chat
V4['gm-lab313-mycardrive'] = {
  client: 'GM Lab313', title: 'Who is the customer really talking to?', question: 'Who am I really talking to?', result: '13 hypotheses: 7 supported, 6 challenged. The hard part was trust.', warp: 1, acts: ACTS, sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-2.5, 1.6, 12], [0, 3.2, 0], 50], [8.8, [2.5, 2, 11], [0, 3.2, 0], 50], [9, [4, 5, 16], [0, 2.2, 0], 38], [18.8, [-2, 5.5, 15.5], [0, 2.2, 0], 38], [19, [-2, 2.6, 12], [0, 3, 0], 44], [25.6, [2.5, 2.4, 11], [0, 3, 0], 44]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31);
    const chat = at(new THREE.Group(), 0, 3.2, 0, g1); chat.add(box(7.2, 4.8, 0.24, C.white));
    const b1 = at(box(4, 0.8, 0.16, C.ink), 1.3, 1.3, 0.22, chat), b2 = at(box(4.2, 0.8, 0.16, C.raised), -1.2, 0.1, 0.22, chat);
    at(face(S, 'Is this price real?', { size: 0.34, color: '#ffffff' }), 0, 0, 0.1, b1); at(face(S, 'Yes, it is locked in.', { size: 0.34 }), 0, 0, 0.1, b2);
    const who = [at(pawn(C.dim, 1.6), -3, 0, -3, g1), at(pawn(C.dim, 1.6), 0, 0, -3.4, g1), at(bot(1.5, C.dim), 3, 0, -3, g1)];
    const N = 13, ok7 = new Set([0, 1, 3, 5, 6, 8, 11]);
    const cards = Array.from({ length: N }, (_, i) => { const back_ = i < 7, n = back_ ? i - 3 : i - 9.5, w = at(new THREE.Group(), n * 1.75, back_ ? 2.2 : 0, back_ ? -1.2 : 2.3, g2); const c = at(box(1.4, 2, 0.12, C.white), 0, 0, 0, w); c.geometry.translate(0, 1, 0); at(face(S, 'H' + (i + 1), { size: 0.4, mono: true }), 0, 1.4, 0.07, c); at(row(0.9, 0, C.dim, 0.1), 0, 0.8, 0.07, c); const m = at(ok7.has(i) ? ok() : cross(), 0.55, 1.95, 0.2, c); m.scale.setScalar(1.3); w.c = c; w.m = m; w.base = w.position.y; return w; });
    at(box(13, 2.2, 2.6, C.raised), 0, 1.1, -1.4, g2);
    S.hero('13', 'hypotheses, written before testing', 9.8, 14); S.hero('7 · 6', 'supported · challenged', 16.8, 18.8);
    const sh = at(new THREE.Group(), 0, 3, 0, g3); const s0 = shield(C.white, 0.3); s0.scale.setScalar(2.4); sh.add(s0); const s1 = at(shield(C.red, 0.34), 0, 0, 0, sh);
    S.hero('Trust.', 'was the hardest design problem', 21.6, 26); S.burst([0, 3, 1], 22.4, 24);
    return (t) => {
      pop(chat, t, 0.2, 0.6); pop(b1, t, 1.2); pop(b2, t, 2.2);
      who.forEach((o, i) => { const a = 4 + i * 0.6, q = eo(k(t, a, a + 0.8)); o.visible = t > a; o.position.y = lerp(-3.5, 0, q); });
      cards.forEach((w, i) => { const a = 9.2 + i * 0.12, q = eo(k(t, a, a + 0.6)); w.visible = t > a; const f = 14.2 + i * 0.18, spin = eio(k(t, f, f + 0.4)); w.position.y = w.base + (1 - q) * 8 + Math.sin(spin * PI) * 0.5; w.c.rotation.y = (1 - q) * 5 + spin * PI * 2; w.c.rotation.x = ok7.has(w.i ?? i) ? 0 : -eio(k(t, f + 0.4, f + 0.8)) * 1.25; pop(w.m, t, f + 0.35, 0.4, 1.3); });
      pop(sh, t, 19.2, 0.6); sh.rotation.y = Math.sin(t * 0.9) * 0.4 + eio(k(t, 22, 22.8)) * PI * 2; const f = eio(k(t, 20, 22.4)); s1.scale.setScalar(Math.max(0.001, f * 2.42)); s1.visible = f > 0;
    };
  },
};

// ================================================================ MRM UX jams: one wall in 2019, six years of a team
V4['mrm-ux-team-ux-jam-sessions'] = {
  client: 'MRM UX team', title: 'Building the team around the work', question: 'Who builds the team?', result: 'Jams since 2019. Figma courses open to every department.', warp: 1, acts: ACTS, sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-2, 1.4, 12], [-1.2, 3, 0], 50], [8.8, [2, 1.8, 11], [-1, 3, 0], 50], [9, [-3, 4.4, 17.5], [0.6, 2.6, 0], 38], [18.8, [3, 3.8, 15.5], [0.8, 2.6, 0], 38], [19, [-6, 3.2, 15], [-1.5, 2.4, 0], 40], [25.6, [3, 4.2, 16.5], [0.5, 2.8, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31);
    at(box(8.4, 4.6, 0.3, C.raised), -1.4, 3.3, -1, g1);
    const notes = Array.from({ length: 18 }, (_, i) => { const b = at(box(0.95, 0.95, 0.06, [C.white, C.dim, C.mid][i % 3]), 0, 0, 0, g1); b.to = [-4.6 + (i % 6) * 1.28 + (rnd(i) - 0.5) * 0.3, 4.7 - Math.floor(i / 6) * 1.3 + (rnd(i, 1) - 0.5) * 0.3, -0.8]; b.rz = (rnd(i, 2) - 0.5) * 0.4; return b; });
    at(cyl(1.5, 0.9, C.white), -1.4, 0.45, 2.6, g1); const crew = [-3.4, -1.4, 0.6].map((x, i) => at(pawn(C.white, 1.1), x, 0, 2.6 + (i === 1 ? 1.7 : 0), g1));
    S.hero('2019', 'the first design jam', 4, 8.7);
    const scr = at(screen(S, 6.6, 4.6, 'FIGMA, FROM ZERO'), -3, 2.9, 0, g2);
    const les = [0, 1, 2, 3, 4].map((i) => { const r = row(6, 0.95 - i * 0.62); r.position.z = 0.1; scr.add(r); at(row([3, 2.4, 3.4, 2.6, 2.1][i], 0, C.mid, 0.12), -1 + [0, -0.3, 0.2, -0.2, -0.45][i], 0, 0.04, r); return at(ok(), 2.6, 0.95 - i * 0.62, 0.2, scr); });
    const deps = [0, 1, 2, 3, 4].map((i) => { const g = at(new THREE.Group(), 3.8 + (i % 2) * 1.3, 0, -2.4 + i * 1.3, g2); const h = 1 + (i % 3) * 0.5; at(box(1.2, h, 1.2, C.white), 0, h / 2, 0, g); at(pawn(C.white, 0.7), 0, h, 0, g); g.arc = arc([g.position.x, h + 0.9, g.position.z], [0.3, 2.9, 0.2], 1.6, C.dim, 0.025); g2.add(g.arc); g.dots = [0, 1, 2].map(() => at(sphere(0.16, C.ink), 0, 0, 0, g2)); return g; });
    S.caption('Figma courses, open to every department.', 11, 18.8);
    const stacks = Array.from({ length: 6 }, (_, i) => { const g = at(new THREE.Group(), -6.2 + i * 2.5, 0, 0, g3); at(box(1.6, 0.2, 1.6, C.ink), 0, 0.1, 0, g); g.ps = Array.from({ length: i + 2 }, (_, j) => at(sphere(0.36, j === i + 1 ? C.red : C.white), (j % 2 ? 0.2 : -0.2), 0.56 + j * 0.58, 0, g)); return g; });
    S.hero('6', 'years of jams, courses and rituals', 21.4, 26); S.burst([6.3, 4.4, 0], 22.8, 22);
    return (t) => {
      notes.forEach((b, i) => { const a = 1 + i * 0.28, p = eo(k(t, a, a + 0.5)); b.visible = t > a; b.position.set(lerp((rnd(i, 3) - 0.5) * 10, b.to[0], p), lerp(2 + rnd(i, 4) * 4, b.to[1], p), lerp(13, b.to[2], p)); b.rotation.set((1 - p) * 3, (1 - p) * 4, b.rz); });
      crew.forEach((c, i) => { pop(c, t, 0.3 + i * 0.2, 0.5, 1); c.position.y = Math.abs(Math.sin(t * 2.4 + i * 1.4)) * 0.12; });
      pop(scr, t, 9.2, 0.6); les.forEach((c, i) => pop(c, t, 12 + i * 1.2));
      deps.forEach((g, i) => { pop(g, t, 9.6 + i * 0.25, 0.5); g.arc.reveal(eio(k(t, 10.4 + i * 0.2, 11.2 + i * 0.2))); g.dots.forEach((d, j) => { const q = ((t - 11.2 - i * 0.37 - j * 0.9) % 2.7) / 1.1; d.visible = t > 11.2 + i * 0.37 + j * 0.9 && q > 0 && q < 1; d.position.copy(g.arc.point(q)); }); });
      stacks.forEach((g, i) => { pop(g, t, 19.2 + i * 0.4, 0.5); g.ps.forEach((p, j) => pop(p, t, 19.4 + i * 0.4 + j * 0.07, 0.4)); });
    };
  },
};

// ================================================================ MRM agent relationship management: the customer sends an AI
V4['mrm-agent-relationship-management'] = {
  client: 'MRM', title: "Designing for the customer's AI", question: 'What if the customer is an AI?', result: '8+ concept flows, reviewed at holding-company CEO level.', warp: 1, acts: ACTS, sets: ['ink', 'paper', 'paper'],
  cam: [[0, [-2, 1.6, 15], [0, 2.2, 0], 44], [8.8, [2.5, 2, 13], [0.5, 2.2, 0], 44], [9, [5, 6, 18], [-0.3, 2.2, 0], 38], [18.8, [0, 5, 18], [-1.4, 2.4, 0], 38], [19, [0, 9, 17], [0, 1.6, 0], 40], [25.6, [0, 7.5, 16], [0, 1.8, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31);
    const tower = (parent, x, z, m) => { const g = at(new THREE.Group(), x, 0, z, parent); const b = at(box(2, 3, 2, C.white, m ? { material: m } : {}), 0, 0, 0, g); b.geometry.translate(0, 1.5, 0); g.b = b; return g; };
    const br = tower(g1, -5, 0), cust = at(pawn(C.white, 1.6), 5, 0, 0, g1);
    const msgs = [0, 1, 2, 3].map(() => { const m = at(box(1.3, 0.8, 0.1, C.white), 0, 0, 0, g1); at(row(0.7, 0, C.ink, 0.12), -0.1, 0, 0.06, m); return m; }), lane = arc([-3.8, 2.4, 0], [4.2, 1.6, 0], 1.6, C.mid, 0.02); g1.add(lane);
    const b1 = at(bot(1.2), 2.6, 0, 1.2, g1);
    S.caption('Until the customer sends their own AI.', 5.4, 8.7);
    const ms = [own(C.white), own(C.white), own(C.white)], brands = [0, 1, 2].map((i) => tower(g2, -6, (i - 1) * 3.4, ms[i]));
    const ai = at(bot(1.6), 1, 0, 0, g2), you = at(pawn(C.white, 1.3), 5.6, 0, 0, g2);
    const lines = brands.map((b) => { const l = arc([0.2, 1.4, 0], [-5, 2.2, b.position.z], 1.4, C.mid, 0.03); g2.add(l); l.out = at(sphere(0.2, C.ink), 0, 0, 0, g2); l.in = at(sphere(0.2, C.ink), 0, 0, 0, g2); return l; });
    S.caption('It shops, compares and decides for them.', 12.6, 18.8);
    const core = at(box(2.4, 2.4, 2.4, C.red), 0, 1.2, 0, g3);
    const orbit = at(new THREE.Group(), 0, 0, 0, g3), bots = Array.from({ length: 6 }, (_, i) => { const a = i / 6 * 6.283, w = at(new THREE.Group(), Math.cos(a) * 4.4, 0, Math.sin(a) * 4.4, orbit); w.b = at(bot(0.8, i % 2 ? C.white : C.raised), 0, 0, 0, w); const sp = at(box(2.6, 0.06, 0.06, C.mid, { edge: false }), Math.cos(a) * 2.6, 0.5, Math.sin(a) * 2.6, orbit); sp.rotation.y = -a; return w; });
    const flows = Array.from({ length: 8 }, (_, i) => { const w = at(new THREE.Group(), 0, 0, 0, g3); const c = at(box(1.3, 1.8, 0.1, C.white), 0, 0, 0, w); at(face(S, String(i + 1), { size: 0.5 }), -0.3, 0.5, 0.06, c); at(row(0.9, 0, C.dim, 0.08), 0, 0, 0.06, c); at(row(0.7, 0, C.dim, 0.08), -0.1, -0.25, 0.06, c); S.billboards.push(c); return w; });
    S.hero('8+', 'concept flows for agent-led buying', 21.6, 26); S.burst([0, 3, 0], 19.8, 22);
    return (t) => {
      pop(br, t, 0.2, 0.6); pop(cust, t, 0.5, 0.5, 1); lane.reveal(eio(k(t, 0.8, 1.4)));
      msgs.forEach((m, i) => { const q = k(t, 1.3 + i * 1, 2.5 + i * 1), stop = t > 5 && i >= 3; m.visible = q > 0 && q < (stop ? 0.62 : 1); m.position.copy(lane.point(q)); m.rotation.y = q * 2; });
      pop(b1, t, 4.6, 0.6, 1);
      brands.forEach((b, i) => { pop(b, t, 9.6 + i * 0.2, 0.6); if (i === 1) { const w = eio(k(t, 16, 16.6)); b.b.scale.y = 1 + w * 0.5; ms[1].color.set(w > 0.5 ? C.ink : C.white); } });
      pop(ai, t, 9.3, 0.6, 1); pop(you, t, 9.2, 0.5, 1);
      lines.forEach((l, i) => { l.reveal(eio(k(t, 10.6 + i * 0.15, 11.2 + i * 0.15))); const o = k(t, 11.4, 12.4), b = k(t, 12.8 + i * 0.25, 13.8 + i * 0.25); l.out.visible = o > 0 && o < 1; l.out.position.copy(l.point(eio(o))); l.in.visible = b > 0 && b < 1; l.in.position.copy(l.point(1 - eio(b))); });
      pop(core, t, 19.2, 0.6); orbit.rotation.y = t * 0.25; bots.forEach((w, i) => pop(w.b, t, 19.6 + i * 0.15, 0.5, 1));
      flows.forEach((w, i) => { const a = -t * 0.3 + i / 8 * 6.283; w.position.set(Math.cos(a) * 6.6, 3 + Math.sin(t * 1.3 + i) * 0.25, Math.sin(a) * 4.4 - 1); pop(w, t, 20.4 + i * 0.22); });
    };
  },
};

// ================================================================ Valero: two sites, one question, then six people
V4['valero-digital-ecosystem-audit'] = {
  client: 'Valero', title: 'What is this website for?', question: 'What is this website for?', result: '3-phase audit, 6 personas, findings well received by Valero stakeholders.', warp: 1, acts: ACTS, sets: ['ink', 'paper', 'paper'],
  cam: [[0, [0, 1.2, 12.5], [0, 3, 0], 52], [8.8, [0, 1.5, 10], [0, 3, 0], 52], [9, [-4, 3.8, 18], [-1, 2.4, 0], 38], [18.8, [4, 3.8, 17], [1, 2.4, 0], 38], [19, [-4, 5, 17], [0, 1.8, 0], 40], [25.6, [2.5, 4.4, 15.5], [0, 1.8, 0], 40]],
  build(S) {
    const g1 = S.group(0, 9), g2 = S.group(9, 19), g3 = S.group(19, 31);
    const sites = [-1, 1].map((s) => { const w = at(new THREE.Group(), s * 3.8, 3, 0, g1), sc = screen(S, 5.6, 4.4); w.add(sc); w.s = s; at(box(5, 1.4, 0.06, C.raised, { edge: false }), 0, 0.4, 0.1, sc); [0, 1, 2].forEach((i) => at(row([3.4, 2.6, 3][i], 0, C.dim, 0.12), -0.6 + [0, -0.4, -0.2][i], -0.7 - i * 0.3, 0.1, sc)); at(box(1.5, 0.4, 0.08, C.mid), -1.6, -1.75, 0.1, sc); return w; });
    S.hero('Two sites.', 'one job?', 4, 8.7);
    const xs = [-6.5, -3.9, -1.3, 1.3, 3.9, 6.5], finds = [3, 1, 4, 2, 2, 5];
    const tps = xs.map((x, i) => {
      const g = at(new THREE.Group(), x, 0, 0, g2); at(cyl(1, 0.2, C.white), 0, 0.1, 0, g); let o;
      if (i === 0) { o = new THREE.Group(); at(box(0.8, 1.5, 0.6, C.white), 0, 0.75, 0, o); at(box(0.5, 0.4, 0.05, C.dim), 0, 1.1, 0.31, o); at(box(0.12, 0.7, 0.12, C.ink), 0.55, 0.8, 0, o); }
      if (i === 1) { o = car('EV', C.ink); o.scale.setScalar(0.42); o.rotation.y = 0.5; }
      if (i === 2) { o = car('TRUCK', C.ink); o.scale.setScalar(0.42); o.rotation.y = 0.5; }
      if (i === 3) { o = new THREE.Group(); at(box(0.8, 1.5, 0.12, C.white), 0, 0.9, 0, o); at(box(0.6, 1, 0.03, C.raised, { edge: false }), 0, 0.95, 0.07, o); }
      if (i === 4) { o = new THREE.Group(); const c = at(box(1.3, 0.8, 0.06, C.white), 0, 0.8, 0, o); at(box(1.3, 0.18, 0.03, C.ink), 0, 0.15, 0.04, c); c.rotation.x = -0.4; }
      if (i === 5) { o = new THREE.Group(); at(screen(S, 1.5, 1.1), 0, 0.85, 0, o); }
      at(o, 0, 0.2, 0, g); g.o = o; g.dots = Array.from({ length: finds[i] }, (_, j) => at(sphere(0.16, C.ink), (j - (finds[i] - 1) / 2) * 0.4, 2.6, 0, g)); return g;
    });
    const scan = at(torus(1.6, 0.09, C.ink), 0, 1.5, 0, g2); scan.rotation.y = PI / 2;
    S.caption('Consumer and fleet, side by side.', 10, 14.6); S.hero('3', 'phase audit', 15, 18.8);
    const pers = [0, 1, 2, 3, 4, 5].map((i) => { const fleet = i > 2, g = at(new THREE.Group(), ((i % 3) - 1) * 3.8, 0, fleet ? -2.2 : 1.4, g3); const top = fleet ? 1.6 : 0.6; at(box(2.4, top, 1.8, fleet ? C.ink : C.white), 0, top / 2, 0, g); at(pawn(fleet ? C.raised : C.white, 1.1), 0, top, 0, g); g.ok = at(check(), 0.6, top + 1.5, 0.4, g); S.billboards.push(g.ok); g.ok.scale.setScalar(1.3); return g; });
    S.hero('6', 'personas · consumer and fleet', 21.4, 26); S.burst([0, 4, 0], 22.8, 24);
    return (t) => {
      sites.forEach((w, i) => { pop(w, t, 0.2 + i * 0.35, 0.6); w.rotation.y = -w.s * (0.3 + Math.sin(t * 0.8) * 0.05); w.position.x = w.s * lerp(3.8, 3, eio(k(t, 2.5, 4))); });
      const sx = kf(t, [[10.6, -9], ...xs.flatMap((x, i) => [[11.2 + i * 1.05, x], [11.7 + i * 1.05, x]]), [18, 9.5]]); scan.position.x = sx; scan.visible = t > 10.6 && t < 18;
      tps.forEach((g, i) => { pop(g, t, 9.3 + i * 0.18, 0.5); g.o.rotation.y = (i === 1 || i === 2 ? 0.5 : 0) + Math.sin(k(t, 11.2 + i * 1.05, 12 + i * 1.05) * PI) * 0.6; g.dots.forEach((d, j) => pop(d, t, 11.6 + i * 1.05 + j * 0.09, 0.35)); });
      pers.forEach((g, i) => { pop(g, t, 19.2 + i * 0.3, 0.6); pop(g.ok, t, 22.4 + i * 0.2, 0.4, 1.3); });
    };
  },
};
