// Generated from the Claude Design board Main-egx9.dc.html. The logic class is the board's own code.
import React from 'react';
import { LOOPS } from '../../data/hover-loops.js';

class DCLogic extends React.Component {
  constructor(props) { super(props); this.state = {}; }
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.LOGO = {"BASF Agriculture": "/v2/98f679b1c71070b93de1d1fd7ecd6283.png", "New York Lottery": "/v2/2a657719827a673597dea866ed30821a.png", "General Motors": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "Chevrolet": "/v2/616f543469fefd85a1353376fc536366.svg", "Cadillac": "/v2/680560a9d6e6bf1136d09c4827a90eb8.svg", "GM Accessories": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "GMC": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "Buick": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "and Chevrolet": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "Honeywell": "/v2/6f26237dfd79aa9807e00c01f1ec12ce.svg", "Fujifilm": "/v2/51e33b550edc54490312bb7c959e2ff7.svg", "Fujifilm Instax": "/v2/51e33b550edc54490312bb7c959e2ff7.svg", "Optum": "/v2/5911379b2a03ea490842406df4572106.svg", "AstraZeneca": "/v2/a17a691730ee02181178232cceb44c6b.svg", "Professional Home Builders Institute": "/v2/8e1a565339eeb37f0bee1d233d6b969c.png", "MRM": "/v2/aea971e64d387348e8c1f58819d522eb.png", "MRM UX team": "/v2/aea971e64d387348e8c1f58819d522eb.png", "TriHealth": "/v2/39c0c1dfb5336632ef3402b9e049234b.png", "Hancock Health": "/v2/104aece41c14cd28c2d7fa00fc12636d.png", "Gleaners Food Bank": "/v2/2c0d05d19116480682f892cc48d5d788.png", "Project Lead The Way": "/v2/08e7857d1cec611099fc72df1e27dd4b.png", "Ball State University": "/v2/4ba5f95f3c380fe7e701778bc45b815f.png", "Judson Center and Michigan State": "/v2/36c365a88ab08a2b409c68a78d72f48b.png", "Thomas Edison Center": "/v2/0fbc3cde8c24d1bb53a51da0b5e34a3c.svg", "Young Farmers of Washtenaw County": "/v2/527b9e7472daa68c9dba3981fae522e5.png", "Isle Royale Equipment": "/v2/15d5a1242a32e7b0f3a7a10c45ad1bfa.png", "Olympia Skate Shop": "/v2/24f573f245ac9121f39fb9a262170747.png", "Karle Symposium": "/v2/6b8bce22c3851e6cd4dcb9b050ca1699.png", "GMC, Buick, and Chevrolet": "/v2/d2bd8c0a9659280cb2b441471e446366.png"};
    this.SHOT = {"SalesX: re-engineering a sales force": "/v2/2b0a49fcd7d47662999b75aa3816a1df.jpg", "Digital Playslip": "/v2/04eadf151721aaaf1005bbe69761a593.jpg"};
    this.state = { step: 0, x: 'year', y: '', yaw: 0, pitch: 0, sel: null, drag: false };
    this.DATA = [[0,0,0,3,0,"Embrace 2013 microsite","Ball State University"],[0,0,0,1,0,"Journalism program pages","Ball State University"],[0,0,0,3,0,"President's Holiday Card","Ball State University"],[0,0,0,1,0,"Client design internship","Various clients"],[1,1,1,0,0,"Hunger campaign","Gleaners Food Bank"],[1,4,4,0,0,"Glidden campaign","Glidden"],[1,1,1,0,0,"Identity and campaigns","Hancock Health"],[1,0,1,0,0,"Logo work","Impact IQ and Spin Across America"],[1,4,4,0,0,"Mary Kay campaign","Mary Kay"],[1,1,1,0,0,"ER campaign","TriHealth"],[1,1,1,0,0,"Outdoor and print advertising","TriHealth"],[2,2,2,3,0,"Dealer playbooks","Chevrolet"],[2,1,4,0,0,"Poster work","CLC and A Bicycle Built for 95,000"],[2,2,2,3,0,"Voice of Customer program","General Motors"],[2,2,2,3,0,"InfoSource apps","GMC, Buick, and Chevrolet"],[2,0,1,0,0,"Summit 2016 identity","Project Lead The Way"],[2,1,1,1,0,"TriHealth.com refresh","TriHealth"],[3,2,2,1,0,"Vehicle pages and launch sites","Cadillac"],[3,2,2,0,0,"SEMA coffee table book","Chevrolet"],[3,2,2,0,0,"Customer experience award programs","General Motors"],[3,2,2,0,0,"iMR identity","General Motors"],[3,2,2,3,0,"Mystery Shop reporting","General Motors"],[3,2,2,1,0,"RSMS holiday card","General Motors"],[3,2,2,1,0,"Accessories shoots and pages","GM Accessories"],[3,4,4,0,0,"Packaging redesign","Viral Launch"],[4,3,4,0,0,"Baker Farms identity","Baker Farms"],[4,2,2,2,0,"E2UL sourcebook","Cadillac"],[4,2,2,0,0,"CamaroFest and Car of the Year materials","Chevrolet"],[4,1,2,1,0,"Jerseys for Judson","Judson Center and Michigan State"],[4,0,4,0,0,"Karle Symposium identity","Karle Symposium"],[4,0,2,1,0,"One10 website launch","One10 Marketing"],[4,2,2,3,3,"Under NDA","Aimia / One10"],[5,2,2,2,0,"Fleet guide","General Motors"],[5,4,4,1,0,"Brand standards and landing page","Isle Royale Equipment"],[5,4,4,1,0,"Brand, web, and Nike materials","Olympia Skate Shop"],[5,2,2,3,3,"Under NDA","Aimia / One10"],[5,2,2,3,3,"Under NDA","Aimia / One10"],[5,2,2,2,3,"Under NDA","Aimia / One10"],[5,2,2,2,3,"Under NDA","Aimia / One10"],[5,2,2,2,3,"Under NDA","Aimia / One10"],[5,2,2,4,3,"Under NDA","Aimia / One10"],[5,2,2,3,3,"Under NDA","Aimia / One10"],[5,2,2,3,3,"Under NDA","Aimia / One10"],[5,2,2,4,3,"Under NDA","Aimia / One10"],[6,3,3,3,1,"SalesX: re-engineering a sales force","BASF Agriculture"],[6,3,4,0,0,"Young Farmers materials","Young Farmers of Washtenaw County"],[6,2,3,2,3,"Under NDA","MRM//McCann"],[6,2,3,3,3,"Under NDA","MRM//McCann"],[6,2,2,3,3,"Under NDA","Aimia / One10"],[6,2,2,3,3,"Under NDA","Aimia / One10"],[7,1,3,3,0,"Interactive concepts","Abbott"],[7,3,3,3,0,"Canada Agriculture website","BASF Agriculture"],[7,3,3,3,0,"Claims system","BASF Agriculture"],[7,3,3,2,0,"Engenia herbicide site","BASF Agriculture"],[7,3,3,3,0,"Unified login","BASF Agriculture"],[7,4,3,2,0,"Pillsbury pitch","General Mills"],[7,0,3,2,0,"Coffee & Collabs","MRM UX team"],[8,3,3,3,0,"Partner Portal","BASF Agriculture"],[8,5,3,3,0,"Design library","New York Lottery"],[8,5,3,3,1,"Digital Playslip","New York Lottery"],[8,0,3,2,0,"Learning site unification","Professional Home Builders Institute"],[9,3,3,1,0,"Global Seeds & Traits","BASF Agriculture"],[9,3,3,1,0,"US Crop website","BASF Agriculture"],[9,4,3,2,0,"Instax North America website","Fujifilm Instax"],[9,2,3,0,0,"Lab313 rebrand","General Motors"],[9,4,3,2,0,"Cart and checkout","Honeywell"],[9,4,3,3,0,"Design language refresh","Honeywell"],[9,5,3,1,0,"Twelve-language website","New York Lottery"],[9,1,4,1,0,"Thomas Edison Center website","Thomas Edison Center"],[10,4,3,2,0,"Direct-to-consumer platform","Fujifilm"],[10,4,3,4,0,"Chatbot and service tools","Honeywell"],[10,0,3,2,0,"Figma 101, 201, and 301","MRM"],[10,0,3,2,0,"Office Blind Date","MRM"],[11,1,3,1,0,"Farxiga landing pages","AstraZeneca"],[11,4,3,2,0,"Amazon experience review","Fujifilm"],[11,4,3,2,0,"CRM pitch","McDonald's"],[11,0,3,4,0,"AI and asset management vision","MRM"],[11,5,3,4,0,"Alexa skills and Help Center","New York Lottery"],[11,5,3,2,0,"CRM overhaul","New York Lottery"],[11,5,3,1,0,"Live Drawing and Integrity pages","New York Lottery"],[11,5,3,2,0,"Quick Draw rebrand","New York Lottery"],[11,1,3,3,0,"Experience design support","Optum"],[11,6,4,2,2,"Indoor skatepark proposal","Self-initiated"],[11,6,4,3,2,"TART","Self-initiated"],[11,6,4,2,2,"Tin Minnows Bearings Co.","Self-initiated"],[11,5,3,2,0,"Marine Corps pitch","US Marine Corps"],[12,4,3,2,0,"New business story","Corebridge Financial"],[12,4,3,2,0,"Building Automation site proposal","Honeywell"],[12,4,3,4,0,"Product experience proposal","Jayco"],[12,6,4,4,2,"Design System Scanner","Self-initiated"],[12,6,4,4,2,"Playable Figma Make games","Self-initiated"],[12,6,4,4,2,"Portfolios Please","Self-initiated"],[12,6,4,4,2,"Street Signal and SkateGO","Self-initiated"],[12,6,4,4,2,"Shred & Dice","Self-initiated"]];
  }
  // Street Signal hero: the character loop on wide screens, the skate-away clip on phones. Video starts after mount so only one file loads.
  componentDidMount() {
    const mq = window.matchMedia('(max-width: 860px)');
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.ssPick = () => {
      const el = this.ssVid;
      if (!el) return;
      const src = mq.matches ? '/v2/street-signal/skate-away.mp4' : '/v2/street-signal/character-loop.mp4';
      if (el.getAttribute('src') !== src) { el.setAttribute('src', src); el.load(); }
      if (!this.state.ssPaused) el.play().catch(() => {});
    };
    this.ssMq = mq;
    mq.addEventListener('change', this.ssPick);
    if (still) this.setState({ ssPaused: true }, this.ssPick); else this.ssPick();
    // The nav is fixed; once the page scrolls it gets a solid bar so it reads over every section.
    const nav = document.querySelector('.ss>.nav');
    this.navStick = () => { if (nav) nav.classList.toggle('stuck', window.scrollY > 8); };
    window.addEventListener('scroll', this.navStick, { passive: true });
    this.navStick();
    // The board was laid out for a stage about 1650 x 1000; scale the 3D world down so it all fits the section.
    // Set on <html> so React-owned markup is never touched.
    this.srFit = () => {
      const el = document.getElementById('numbers');
      if (!el) return;
      const f = Math.min(1, el.clientWidth / 1650, el.clientHeight / 1000);
      document.documentElement.style.setProperty('--sr-fit', Math.max(0.45, f).toFixed(3));
    };
    window.addEventListener('resize', this.srFit);
    this.srFit();
  }
  ssVals() {
    return {
      ssPaused: Boolean(this.state.ssPaused),
      ssLabel: 'Street Signal animation: the lead skater, Ann Arbor streets, blue and yellow',
      ssToggle: () => {
        const el = this.ssVid, paused = !this.state.ssPaused;
        this.setState({ ssPaused: paused });
        if (!el) return;
        if (paused) el.pause(); else { if (!el.getAttribute('src')) this.ssPick(); el.play().catch(() => {}); }
      },
    };
  }
  renderVals() { return Object.assign(this.srVals(), this.ssVals()); }
  // Coded preview loops: play the picked project's loop from the top, or hold its poster frame for reduced motion.
  componentDidUpdate() {
    const el = document.querySelector('.sr .pv .lp svg.hl');
    if (!el || el.dataset.state || !el.getAnimations) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = parseFloat(el.dataset.poster || 5) * 1000;
    el.classList.add('hl-js');
    el.getAnimations({ subtree: true }).forEach((a) => { a.currentTime = still ? t : 0; if (still) a.pause(); else a.play(); });
    el.dataset.state = still ? 'rest' : 'play';
  }
  componentWillUnmount() { if (this.ssMq) this.ssMq.removeEventListener('change', this.ssPick); window.removeEventListener('scroll', this.navStick); window.removeEventListener('resize', this.srFit); }
  srVals() {
    const DATA = this.DATA;
    const AXES = {
      year: { n: 'Year', at: 0, labels: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
      who: { n: 'Employer', at: 2, labels: ['School', 'Publicis', 'Aimia and One10', 'MRM//McCann', 'On my own'] },
      lane: { n: 'Industry', at: 1, labels: ['School and studio', 'Health and community', 'Automotive', 'Agriculture', 'Commerce', 'Government', 'My own'] },
      craft: { n: 'Craft', at: 3, labels: ['Print and brand', 'Web', 'Strategy and service', 'Product and UX', 'Code, AI and games'] },
    };
    const STEPS = [
      { mode: 'mess', h: 'Thirteen years. \n A mess.', t: '94 projects, in the order it felt like they happened.', b: 'Sort it' },
      { x: 'year', y: '', h: 'Sort it by year.', t: 'The quietest years on the public record still have four projects.', b: 'Sort again' },
      { x: 'who', y: '', h: 'By who I worked for.', t: '38 at MRM//McCann. 27 at Aimia and One10. 18 outside any employer.', b: 'Sort again' },
      { x: 'craft', y: '', h: 'By what I made.', t: 'Color is time. Print and brand sit in the dark. Code, AI and games glow.', b: 'Sort again' },
      { x: 'year', y: 'lane', h: 'Two sorts at once.', t: 'Automotive owned 2016 through 2019. Then everything spread out.', b: 'One more sort' },
      { mode: 'name', h: 'By who did it.', t: '80 blocks I can show you. The 14 I can’t are holding up the name.', b: 'Mess it up again' },
    ];
    const FONT = { D: ['1110', '1001', '1001', '1001', '1001', '1110'], O: ['0110', '1001', '1001', '1001', '1001', '0110'], A: ['0110', '1001', '1111', '1001', '1001', '1001'], N: ['1001', '1101', '1011', '1001', '1001', '1001'], E: ['1111', '1000', '1110', '1000', '1000', '1111'] };
    const { step, x, y, yaw, pitch, sel, drag } = this.state;
    const custom = step < 0;
    const cur = custom ? { x, y } : STEPS[step];
    const mode = cur.mode || 'pivot';
    const fmt = (n) => n.toFixed(1);
    const rnd = (n, k) => { const s = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
    const place = (px, py, pz, ax, ay, az) => 'translate3d(' + fmt(px) + 'px,' + fmt(py) + 'px,' + fmt(pz) + 'px) rotateX(' + ax + 'deg) rotateY(' + ay + 'deg) rotateZ(' + az + 'deg)';
    let tfs, xlabels = [], ylabels = [], cam, biggest = null;
    if (mode === 'mess') {
      tfs = DATA.map((_, n) => {
        const r = 620 * Math.sqrt(rnd(n, 1));
        const th = rnd(n, 2) * Math.PI * 2;
        return place(Math.cos(th) * r, Math.sin(th) * r * 0.8, (1 - r / 620) * 340 * rnd(n, 3) + 12, Math.round(rnd(n, 4) * 300), Math.round(rnd(n, 5) * 300), Math.round(rnd(n, 6) * 300));
      });
    } else if (mode === 'name') {
      const cells = [];
      [...'DOOANE'].forEach((c, l) => FONT[c].forEach((row, r) => [...row].forEach((v, k) => { if (v === '1') cells.push([l * 5 + k, r]); })));
      cells.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
      let open = 0, hold = 0;
      tfs = DATA.map((d) => {
        if (d[4] === 3) return place((7.5 + hold++ - 14.5) * 46, 0, 0, -90, 0, 0);
        const [c, r] = cells[open++];
        return place((c - 14.5) * 46, 0, (7 - r) * 46, -90, 0, 0);
      });
    } else {
      const ax = AXES[cur.x], ay = cur.y ? AXES[cur.y] : null;
      const nx = ax.labels.length, ny = ay ? ay.labels.length : 1;
      const fp = nx > 8 || ny > 5 ? 2 : 3;
      const pitchX = fp * 46 + 30, pitchY = ay ? fp * 46 + 16 : 0;
      const counts = {};
      tfs = DATA.map((d) => {
        const cx = d[ax.at] , cy = ay ? d[ay.at] : 0;
        const k = cx + '_' + cy;
        const idx = counts[k] = (counts[k] === undefined ? 0 : counts[k] + 1);
        const ox = (cx - (nx - 1) / 2) * pitchX + (idx % fp - (fp - 1) / 2) * 46;
        const oy = (cy - (ny - 1) / 2) * pitchY + (Math.floor(idx / fp) % fp - (fp - 1) / 2) * 46;
        return place(ox, oy, Math.floor(idx / (fp * fp)) * 24, 0, 0, 0);
      });
      const edge = (ny * (pitchY || fp * 46)) / 2 + 26;
      xlabels = ax.labels.map((n, i) => ({ n, w: (pitchX - 10) + 'px', tf: 'translate3d(' + fmt((i - (nx - 1) / 2) * pitchX - (pitchX - 10) / 2) + 'px,' + edge + 'px,1px)' }));
      if (ay) ylabels = ay.labels.map((n, i) => ({ n, tf: 'translate3d(-100%,0,1px) translate3d(' + fmt(-(nx * pitchX) / 2 - 20) + 'px,' + fmt((i - (ny - 1) / 2) * pitchY - 12) + 'px,0)' }));
      const peak = Object.entries(counts).reduce((m, e) => (e[1] > m[1] ? e : m), ['', -1]);
      const [px, py] = peak[0].split('_').map(Number);
      biggest = { name: ax.labels[px] + (ay ? ', ' + ay.labels[py] : ''), n: peak[1] + 1 };
    }
    if (mode === 'name') cam = 'scale(.66) rotateX(' + (76 + pitch) + 'deg) rotateZ(' + yaw + 'deg) translate3d(0,0,-160px)';
    else if (mode === 'mess') cam = 'scale(.82) rotateX(' + (56 + pitch) + 'deg) rotateZ(' + (-24 + yaw) + 'deg)';
    else cam = 'scale(' + (cur.y ? 0.68 : cur.x === 'year' ? 0.82 : 1) + ') rotateX(' + (58 + pitch) + 'deg) rotateZ(' + (-22 + yaw) + 'deg) translate3d(0,0,-30px)';
    const picked = sel === null ? null : DATA[sel];
    const pvOf = (d, n) => {
      const nda = d[4] === 3, own = d[6] === 'Self-initiated', sh = this.SHOT[d[5]], lp = nda ? '' : LOOPS[d[5]] || '';
      const lg = own ? '/v2/e295297c792a99090470f555e3216f0a.png' : this.LOGO[d[6]];
      const w = (k) => (40 + Math.round(rnd(n, k) * 50)) + '%';
      return {
        cls: ['on', 'k' + d[3], nda ? 'nda' : sh ? 'shot' : '', own ? 'own' : '', lg ? '' : 'nologo', lp ? 'loop' : ''].join(' '),
        loop: lp,
        ac: 'oklch(' + (0.34 + d[0] * 0.05).toFixed(3) + ' 0.008 80)',
        shot: sh || '/dooane/pointing.webp', logo: lg || '/dooane/pointing.webp',
        t: nda ? '' : d[5], client: nda ? '' : d[6], cmd: nda ? '' : '> ' + d[5].toLowerCase() + '_',
        w1: w(11), w2: w(12), w3: w(13),
        cap: nda ? 'Under NDA' : lp ? 'Concept loop' : sh ? 'Screenshot' : 'Sketch, not a screenshot',
      };
    };
    const pv = picked ? pvOf(picked, sel) : { cls: '', ac: 'transparent', shot: '/dooane/pointing.webp', logo: '/dooane/pointing.webp', t: '', client: '', cmd: '', w1: '0%', w2: '0%', w3: '0%', cap: '', loop: '' };
    const types = ['', 'case', 'lab', 'nda'];
    const blocks = DATA.map((d, n) => ({
      cls: ['y' + d[0], 'd' + (n % 8), types[d[4]], sel === n ? 'sel' : ''].join(' '),
      tf: tfs[n],
      label: d[5] + ', ' + d[6] + ', ' + (2013 + d[0]),
      pick: () => { if (sel !== n) this.setState({ sel: n }); },
    }));
    const st = custom ? { h: 'Your sort.', t: 'Same 94 blocks. Ask them something else.', b: 'Back to the story' } : STEPS[step];
    return {
      cam,
      pv,
      stageCls: drag ? 'drag' : '',
      blocks,
      xlabels,
      ylabels,
      st,
      riderCls: mode === 'name' ? '' : 'off',
      crownCls: !picked && biggest ? 'on' : '',
      cardKicker: picked ? 'Project, ' + (2013 + picked[0]) : biggest ? 'Biggest pile' : '94 projects',
      pickTitle: picked ? picked[5] : biggest ? biggest.name : 'Point at any block',
      pickSub: picked ? picked[6] : biggest ? biggest.n + ' projects' : 'Each one is a real project. Drag to look around.',
      advance: () => this.setState({ step: custom ? 1 : (step + 1) % STEPS.length, sel: null, yaw: 0, pitch: 0 }),
      xopts: Object.keys(AXES).map((k) => ({
        n: AXES[k].n,
        cls: mode === 'pivot' && cur.x === k ? 'on' : '',
        go: () => this.setState({ step: -1, x: k, y: cur.y === k ? '' : (cur.y || ''), sel: null, yaw: 0, pitch: 0 }),
      })),
      yopts: [{ k: '', n: 'Nothing' }].concat(Object.keys(AXES).map((k) => ({ k, n: AXES[k].n }))).map((o) => ({
        n: o.n,
        cls: mode === 'pivot' && (cur.y || '') === o.k ? 'on' : '',
        go: () => {
          const nowX = mode === 'pivot' ? cur.x : x;
          if (o.k === nowX) return;
          this.setState({ step: -1, x: nowX, y: o.k, sel: null, yaw: 0, pitch: 0 });
        },
      })),
      down: (e) => { this.px = e.clientX; this.py = e.clientY; this.yaw0 = yaw; this.pitch0 = pitch; this.setState({ drag: true }); },
      move: (e) => {
        if (!this.state.drag) return;
        const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
        this.setState({ yaw: clamp(this.yaw0 + (e.clientX - this.px) * 0.18, -40, 40), pitch: clamp(this.pitch0 - (e.clientY - this.py) * 0.14, -14, 12) });
      },
      up: () => { if (this.state.drag) this.setState({ drag: false }); },
    };
  }
}

export default class Board extends Component {
  render() {
    const v = this.renderVals();
    return (
      <>
      {" "}
      <div className={"site"}>
        {" "}
        <div className={"o1"}>
          <section className={"hero ss"} aria-label={"Street Signal, the skate game I am building"}>
            <div className={"wrap nav"}>
              <a href={"/"} aria-label={"Dooane, home"}>
                <img src={"/v2/dooane-wordmark-white.png"} alt={"Dooane"} />
              </a>
              <nav className={"links"} aria-label={"Main"}>
                <a href={"/work/"}>{"Work"}</a>
                <a href={"/about/"}>{"About"}</a>
                <a href={"/process/"}>{"Process"}</a>
                <a href={"/play/"}>{"Play"}</a>
                <a href={"#contact"}>{"Contact"}</a>
              </nav>
            </div>
            <div className={"wrap ss-g"}>
              <div className={"ss-copy"}>
                <p className={"ss-k"}>{"In Alpha"}</p>
                <span className={"ss-tag"}>{"Real spots. Playable lines."}</span>
                <h1 className={"display ss-h"}>
                  <span>{"Street"}</span>
                  <span>{"Signal"}</span>
                </h1>
                <p className={"ss-s"}>{"A skate game I’m designing and building in Ann Arbor. Scan a real skate spot, then skate it."}</p>
                <div className={"ctas"}>
                  <a className={"btn ss-play"} href={"https://skate-spotter-teal.vercel.app"} target={"_blank"} rel={"noopener"}>
                    {"Play the prototype "}
                    <span aria-hidden={"true"}>{"→"}</span>
                  </a>
                  <a className={"btn ss-line"} href={"/work/"}>{"See the product work"}</a>
                </div>
                <p className={"ss-meta"}>{"In development · Keyboard, controller or touch"}</p>
              </div>
              <div className={"ss-media"}>
                <video ref={(el) => { this.ssVid = el; }} muted loop playsInline preload={"none"} aria-label={v.ssLabel}></video>
                <button className={"ss-pause"} onClick={v.ssToggle}>
                  {v.ssPaused ? "Play animation" : "Pause animation"}
                </button>
              </div>
            </div>
          </section>
          <section className={"who o1p"} aria-label={"Who I am"}>
            <div className={"wrap who-g"}>
              <div>
                <p className={"k"}>{"Caleb Frank · Product design lead"}</p>
                <h2 className={"display"}>
                  {"I design complex products that "}
                  <em>
                    {"ship."}
                    <img src={"/v2/drip-red.png"} alt={""} aria-hidden={"true"} />
                  </em>
                </h2>
              </div>
              <div>
                <p className={"s muted"}>{"13+ years of turning fragmented tools and ambiguous requirements into products that endure, for enterprise platforms, regulated ecosystems, and multi-brand systems."}</p>
                <div className={"ctas"}>
                  <a className={"btn btn-ink"} href={"/work/"}>
                    {"View the work "}
                    <span aria-hidden={"true"}>{"→"}</span>
                  </a>
                  <a className={"btn btn-line"} href={"/#contact"}>{"Get in touch"}</a>
                </div>
              </div>
            </div>
            <div className={"marquee"} role={"region"} aria-label={"Clients I have designed for"}>
              <div className={"marquee-track"}>
                <div className={"marquee-set"}>
                  <img src={"/v2/98f679b1c71070b93de1d1fd7ecd6283.png"} alt={"BASF"} />
                  <img className={"sq"} src={"/v2/2a657719827a673597dea866ed30821a.png"} alt={"New York Lottery"} />
                  <img className={"sq"} src={"/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg"} alt={"General Motors"} />
                  <img className={"sq"} src={"/v2/616f543469fefd85a1353376fc536366.svg"} alt={"Chevrolet"} />
                  <img className={"sq"} src={"/v2/680560a9d6e6bf1136d09c4827a90eb8.svg"} alt={"Cadillac"} />
                  <img src={"/v2/6f26237dfd79aa9807e00c01f1ec12ce.svg"} alt={"Honeywell"} />
                  <img src={"/v2/51e33b550edc54490312bb7c959e2ff7.svg"} alt={"Fujifilm"} />
                  <img src={"/v2/a17a691730ee02181178232cceb44c6b.svg"} alt={"AstraZeneca"} />
                  <img src={"/v2/5911379b2a03ea490842406df4572106.svg"} alt={"Optum"} />
                  <img src={"/v2/39c0c1dfb5336632ef3402b9e049234b.png"} alt={"TriHealth"} />
                  <img src={"/v2/104aece41c14cd28c2d7fa00fc12636d.png"} alt={"Hancock Health"} />
                  <img src={"/v2/2c0d05d19116480682f892cc48d5d788.png"} alt={"Gleaners Food Bank"} />
                </div>
                <div className={"marquee-set"} aria-hidden={"true"}>
                  <img src={"/v2/98f679b1c71070b93de1d1fd7ecd6283.png"} alt={""} />
                  <img className={"sq"} src={"/v2/2a657719827a673597dea866ed30821a.png"} alt={""} />
                  <img className={"sq"} src={"/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg"} alt={""} />
                  <img className={"sq"} src={"/v2/616f543469fefd85a1353376fc536366.svg"} alt={""} />
                  <img className={"sq"} src={"/v2/680560a9d6e6bf1136d09c4827a90eb8.svg"} alt={""} />
                  <img src={"/v2/6f26237dfd79aa9807e00c01f1ec12ce.svg"} alt={""} />
                  <img src={"/v2/51e33b550edc54490312bb7c959e2ff7.svg"} alt={""} />
                  <img src={"/v2/a17a691730ee02181178232cceb44c6b.svg"} alt={""} />
                  <img src={"/v2/5911379b2a03ea490842406df4572106.svg"} alt={""} />
                  <img src={"/v2/39c0c1dfb5336632ef3402b9e049234b.png"} alt={""} />
                  <img src={"/v2/104aece41c14cd28c2d7fa00fc12636d.png"} alt={""} />
                  <img src={"/v2/2c0d05d19116480682f892cc48d5d788.png"} alt={""} />
                </div>
              </div>
            </div>
          </section>
        </div>
        {" "}
        <section className={"sr"} id={"numbers"} aria-label={"The record, sortable"}>
          {" "}
          <div className={`stage ${v.stageCls}`} onPointerDown={v.down} onPointerMove={v.move} onPointerUp={v.up} onPointerLeave={v.up}>
            {" "}
            <div className={"scaler"}>
              {" "}
              <div className={"world"} style={{"transform": v.cam}}>
                {" "}
                <div className={"floor"}></div>
                {" "}
                {(v.xlabels || []).map((a, i1) => (
                  <React.Fragment key={i1}>
                    <div className={"lx"} style={{"width": a.w, "transform": a.tf}}>
                      {`${a.n}`}
                    </div>
                  </React.Fragment>
                ))}
                {" "}
                {(v.ylabels || []).map((a, i2) => (
                  <React.Fragment key={i2}>
                    <div className={"ly"} style={{"transform": a.tf}}>
                      {`${a.n}`}
                    </div>
                  </React.Fragment>
                ))}
                {" "}
                {(v.blocks || []).map((b, i3) => (
                  <React.Fragment key={i3}>
                    <button className={`b ${b.cls}`} style={{"transform": b.tf}} aria-label={b.label} onClick={b.pick} onMouseEnter={b.pick} onFocus={b.pick}>
                      <span className={"t"}></span>
                      <span className={"s"}></span>
                      <span className={"w"}></span>
                    </button>
                  </React.Fragment>
                ))}
                {" "}
              </div>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
          <div className={`rider ${v.riderCls}`}>
            <img src={"/dooane/thinking.webp"} alt={"DOOANE the armadillo, watching the blocks"} />
          </div>
          {" "}
          <div className={"sr-title"} aria-live={"polite"}>
            {" "}
            <h2 className={"display"} style={{"width": "544px"}}>
              {`${v.st.h}`}
            </h2>
            {" "}
            <img className={"sr-stroke"} src={"/v2/136d3302f7ab40e768b6bc8d20a027f7.png"} alt={""} />
            {" "}
            <p className={"sr-tag"}>
              {`${v.st.t}`}
            </p>
            {" "}
            <button className={"sr-btn"} onClick={v.advance}>
              {`${v.st.b}`}
            </button>
            {" "}
          </div>
          {" "}
          <aside className={"sr-card"} aria-live={"polite"}>
            {" "}
            <img className={"eyes"} src={"/v2/cd4831c05b9e3a7fa62cad7c243b617c.png"} alt={""} />
            {" "}
            <img className={`sr-crown ${v.crownCls}`} src={"/v2/010c57e814787557949928c6eeae42f7.png"} alt={""} />
            {" "}
            <div className={`pv ${v.pv.cls}`} style={{"--ac": v.pv.ac}} aria-hidden={"true"}>
              {" "}
              <img className={"shot"} src={v.pv.shot} alt={""} />
              {" "}
              <div className={"mk"}>
                <div className={"bar"}></div>
                <div className={"sr-hero"}></div>
                <div className={"notes"}>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                <div className={"ph"}>
                  <i></i>
                  <i></i>
                </div>
                <div className={"sr-cards"}>
                  <i></i>
                  <i></i>
                  <i></i>
                </div>
                <div className={"ttl"}>
                  {`${v.pv.t}`}
                </div>
                <div className={"ln"}>
                  <i style={{"width": v.pv.w1}}></i>
                  <i style={{"width": v.pv.w2}}></i>
                  <i style={{"width": v.pv.w3}}></i>
                </div>
                <div className={"term"}>
                  {`${v.pv.cmd}`}
                </div>
              </div>
              {" "}
              <img className={"logo"} src={v.pv.logo} alt={""} />
              {" "}
              <span className={"lt"}>
                {`${v.pv.client}`}
              </span>
              {" "}
              <div className={"redact"}>
                <b>
                  {"REDACTED"}
                </b>
              </div>
              {" "}
              <div className={"cap"}>
                {`${v.pv.cap}`}
              </div>
              {v.pv.loop ? <div className={"lp"} key={v.pv.t} dangerouslySetInnerHTML={{ __html: v.pv.loop }} /> : null}
              {" "}
            </div>
            {" "}
            <div className={"yr"}>
              {`${v.cardKicker}`}
            </div>
            {" "}
            <b>
              {`${v.pickTitle}`}
            </b>
            {" "}
            <span>
              {`${v.pickSub}`}
            </span>
            {" "}
          </aside>
          {" "}
          <div className={"dock"}>
            {" "}
            <fieldset className={"seg"}>
              {" "}
              <legend>
                {"Sort by"}
              </legend>
              {" "}
              {(v.xopts || []).map((o, i4) => (
                <React.Fragment key={i4}>
                  <button className={`opt ${o.cls}`} onClick={o.go}>
                    {`${o.n}`}
                  </button>
                </React.Fragment>
              ))}
              {" "}
            </fieldset>
            {" "}
            <fieldset className={"seg"}>
              {" "}
              <legend>
                {"Then by"}
              </legend>
              {" "}
              {(v.yopts || []).map((o, i5) => (
                <React.Fragment key={i5}>
                  <button className={`opt ${o.cls}`} onClick={o.go}>
                    {`${o.n}`}
                  </button>
                </React.Fragment>
              ))}
              {" "}
            </fieldset>
            {" "}
            <div className={"key"}>
              {" "}
              <span>
                <i className={"r"}></i>
                {"2013 to 2025"}
              </span>
              {" "}
              <span>
                <i className={"l"}></i>
                {"My own"}
              </span>
              {" "}
              <span>
                <i className={"n"}></i>
                {"Under NDA"}
              </span>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <section className={"wrap section"} id={"work"}>
          {" "}
          <div className={"head"}>
            {" "}
            <h2 className={"display"}>
              {"Featured "}
              <img src={"/v2/b0c84b5568018a6065f33f75c1c69ed3.png"} alt={"work"} />
            </h2>
            {" "}
            <a className={"btn btn-line"} href={"/work/"}>
              {"All 94 projects "}
              <span aria-hidden={"true"}>
                {"→"}
              </span>
            </a>
            {" "}
          </div>
          {" "}
          <div className={"cards"}>
            {" "}
            <a className={"card"} href={"/work/nyl-digital-playslip/"}>
              {" "}
              <div className={"pic"}>
                <img src={"/v2/04eadf151721aaaf1005bbe69761a593.jpg"} alt={"Digital Playslip screen with numbered steps and a running total"} />
                <span className={"badge"} aria-hidden={"true"}>
                  {"↗"}
                </span>
              </div>
              {" "}
              <div className={"body"}>
                {" "}
                <h3>
                  {"New York Lottery"}
                  <br />
                  <span className={"muted"} style={{"fontWeight": "500", "fontSize": "18px"}}>
                    {"Digital Playslip"}
                  </span>
                </h3>
                {" "}
                <p style={{"margin": "0"}}>
                  {"A paper form every player knows became a mobile flow that ends in a QR code at the retailer."}
                </p>
                {" "}
                <div className={"tags"}>
                  <span className={"tag"}>
                    {"Mobile"}
                  </span>
                  <span className={"tag"}>
                    {"Service design"}
                  </span>
                  <span className={"tag"}>
                    {"Research"}
                  </span>
                </div>
                {" "}
              </div>
              {" "}
            </a>
            {" "}
            <a className={"card"} href={"/work/"}>
              {" "}
              <div className={"pic"}>
                <img src={"/v2/2b0a49fcd7d47662999b75aa3816a1df.jpg"} alt={"Angled SalesX screens showing a territory map, customer accounts, and sales charts"} />
                <span className={"badge"} aria-hidden={"true"}>
                  {"↗"}
                </span>
              </div>
              {" "}
              <div className={"body"}>
                {" "}
                <h3>
                  {"BASF Agriculture"}
                  <br />
                  <span className={"muted"} style={{"fontWeight": "500", "fontSize": "18px"}}>
                    {"SalesX"}
                  </span>
                </h3>
                {" "}
                <p style={{"margin": "0"}}>
                  {"One platform replaced scattered tools. A pilot of 40 users grew to 800+ sales professionals."}
                </p>
                {" "}
                <div className={"tags"}>
                  <span className={"tag"}>
                    {"Enterprise UX"}
                  </span>
                  <span className={"tag"}>
                    {"Design systems"}
                  </span>
                  <span className={"tag"}>
                    {"Research"}
                  </span>
                </div>
                {" "}
              </div>
              {" "}
            </a>
            {" "}
            <a className={"card paper"} href={"/work/"} style={{"borderColor": "#E9E4DA"}}>
              {" "}
              <div className={"body"} style={{"justifyContent": "space-between", "minHeight": "340px", "padding": "28px"}}>
                {" "}
                <h3 className={"display"} style={{"fontSize": "54px", "fontWeight": "400"}}>
                  {"92 more"}
                  <br />
                  {"where that"}
                  <br />
                  {"came from."}
                </h3>
                {" "}
                <img src={"/v2/10b4e3180393c55b1689c09fab8ef833.png"} alt={""} aria-hidden={"true"} style={{"width": "130px", "alignSelf": "flex-end"}} />
                {" "}
                <p style={{"margin": "0", "fontWeight": "600"}}>
                  {"Honeywell, General Motors, Fujifilm, TriHealth, and 14 I can’t name "}
                  <span aria-hidden={"true"}>
                    {"→"}
                  </span>
                </p>
                {" "}
              </div>
              {" "}
            </a>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <section className={"paper torn"} style={{"paddingTop": "clamp(72px,8vw,120px)", "paddingBottom": "clamp(144px,14vw,192px)"}}>
          {" "}
          <div className={"wrap about-grid"}>
            {" "}
            <div>
              {" "}
              <h2 className={"display"} style={{"fontSize": "clamp(56px,7vw,104px)"}}>
                {"About"}
              </h2>
              {" "}
              <img src={"/v2/73f5db1a7934994f4a806442391f3084.png"} alt={""} aria-hidden={"true"} style={{"width": "220px", "display": "block", "margin": "-4px 0 18px"}} />
              {" "}
              <p style={{"fontSize": "20px", "lineHeight": "1.55", "maxWidth": "560px", "margin": "0 0 16px"}}>
                {"I'm Caleb, a product design leader, problem solver, and skatepark advocate based in Michigan. I lead UX strategy, research, and design systems for complex products in automotive, agriculture, government, manufacturing, and healthcare."}
              </p>
              {" "}
              <p style={{"maxWidth": "560px", "margin": "0 0 26px"}}>
                {"Outside client work, I wrote the proposal for a year-round skate and creative space in Ann Arbor."}
              </p>
              {" "}
              <div style={{"display": "flex", "gap": "12px", "flexWrap": "wrap"}}>
                {" "}
                <a className={"btn btn-red"} href={"/about/"}>
                  {"My story "}
                  <span aria-hidden={"true"}>
                    {"→"}
                  </span>
                </a>
                {" "}
                <a className={"btn btn-ink"} href={"/about/#resume"}>
                  {"Resume"}
                </a>
                {" "}
              </div>
              {" "}
            </div>
            {" "}
            <div className={"portrait"}>
              {" "}
              <img className={"ph"} src={"/v2/2184a6875a30e53a897bda2c801b97c4.png"} alt={"Halftone portrait of Caleb, smiling, in glasses"} />
              {" "}
              <img className={"mi"} src={"/dooane/spray-can.webp"} alt={""} aria-hidden={"true"} />
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <section className={"wrap section"} id={"process"}>
          {" "}
          <div className={"head"}>
            <h2 className={"display"}>
              {"Process"}
            </h2>
            <a className={"btn btn-line"} href={"/process/"}>
              {"How I work, in depth "}
              <span aria-hidden={"true"}>{"→"}</span>
            </a>
          </div>
          {" "}
          <div className={"steps"}>
            {" "}
            <div>
              {" "}
              <img src={"/v2/4ff2ef6a4bc39c162f3958249ba2ecde.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <span className={"muted"} style={{"fontSize": "14px"}}>
                {"01"}
              </span>
              {" "}
              <h3 className={"display"}>
                {"Discover"}
              </h3>
              {" "}
              <p className={"muted"} style={{"margin": "0"}}>
                {"Ask questions before making assumptions. Watch people work, map the system, and find the problem worth solving."}
              </p>
              {" "}
            </div>
            {" "}
            <div>
              {" "}
              <img src={"/v2/84403b71021fdc1512363ffad30ce66c.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <span className={"muted"} style={{"fontSize": "14px"}}>
                {"02"}
              </span>
              {" "}
              <h3 className={"display"}>
                {"Define"}
              </h3>
              {" "}
              <p className={"muted"} style={{"margin": "0"}}>
                {"Turn what we learned into a shared problem statement and a set of decisions a team can act on."}
              </p>
              {" "}
            </div>
            {" "}
            <div>
              {" "}
              <img src={"/v2/30c5a2b3f648b1ba6a6e32ff60316d5c.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <span className={"muted"} style={{"fontSize": "14px"}}>
                {"03"}
              </span>
              {" "}
              <h3 className={"display"}>
                {"Design"}
              </h3>
              {" "}
              <p className={"muted"} style={{"margin": "0"}}>
                {"Prototype fast, test with real people, and build the system that keeps the work consistent."}
              </p>
              {" "}
            </div>
            {" "}
            <div>
              {" "}
              <img src={"/v2/9ded2548d085f2b49600ec08618da5e1.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <span className={"muted"} style={{"fontSize": "14px"}}>
                {"04"}
              </span>
              {" "}
              <h3 className={"display"}>
                {"Deliver"}
              </h3>
              {" "}
              <p className={"muted"} style={{"margin": "0"}}>
                {"Stay through launch. Specify the details, support engineering, and measure what happened."}
              </p>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <section className={"band"}>
          {" "}
          <img className={"ph"} src={"/v2/a8baf29fc2a3b4d1b623cc9af0db5c57.png"} alt={"Halftone photo of a skater mid-air off a concrete ledge"} />
          {" "}
          <div className={"over"}>
            {" "}
            <div className={"wrap"} style={{"width": "100%"}}>
              {" "}
              <h2 className={"display"}>
                <span className={"plate"}>
                  {"Ideas"}
                </span>
                <br />
                <span className={"plate"}>
                  {"in motion."}
                </span>
              </h2>
              {" "}
              <img className={"stroke"} src={"/v2/73f5db1a7934994f4a806442391f3084.png"} alt={""} aria-hidden={"true"} />
              {" "}
              <a className={"btn btn-red"} href={"/play/"} style={{"marginTop": "22px"}}>
                {"See what I make for fun "}
                <span aria-hidden={"true"}>
                  {"→"}
                </span>
              </a>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <section className={"cta"} id={"contact"}>
          {" "}
          <div className={"wrap"} style={{"paddingTop": "64px", "paddingBottom": "56px"}}>
            {" "}
            <h2 className={"display"}>
              {"Let's talk."}
            </h2>
            {" "}
            <p style={{"maxWidth": "640px", "margin": "18px 0 26px", "fontSize": "20px", "fontWeight": "500"}}>
              {"Open to strategic consulting, product leadership roles, and innovative design challenges."}
            </p>
            {" "}
            <div style={{"display": "flex", "gap": "12px", "flexWrap": "wrap"}}>
              {" "}
              <a className={"btn btn-ink"} href={"mailto:info@calebfrank.com"}>
                {"info@calebfrank.com"}
              </a>
              {" "}
              <a className={"btn"} href={"https://www.linkedin.com/in/caleb-frank-96300746"} style={{"border": "1.5px solid #111"}}>
                {"LinkedIn"}
              </a>
              {" "}
            </div>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <footer className={"wrap foot muted"}>
          {" "}
          <span>
            {"Caleb Frank, Product Design Lead"}
          </span>
          {" "}
          <span>
            {"Michigan, USA"}
          </span>
          {" "}
        </footer>
        {" "}
      </div>
      {" "}
      </>
    );
  }
}
