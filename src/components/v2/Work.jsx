// Generated from the Claude Design board Work-j593.dc.html. The logic class is the board's own code.
import React from 'react';

class DCLogic extends React.Component {
  constructor(props) { super(props); this.state = {}; }
}

class Component extends DCLogic {
  constructor(props) {
    super(props);
    this.DATA = [[0, 0, 0, 3, 0, "Embrace 2013 microsite", "Ball State University"], [0, 0, 0, 1, 0, "Journalism program pages", "Ball State University"], [0, 0, 0, 3, 0, "President's Holiday Card", "Ball State University"], [0, 0, 0, 1, 0, "Client design internship", "Various clients"], [1, 1, 1, 0, 0, "Hunger campaign", "Gleaners Food Bank"], [1, 4, 4, 0, 0, "Glidden campaign", "Glidden"], [1, 1, 1, 0, 0, "Identity and campaigns", "Hancock Health"], [1, 0, 1, 0, 0, "Logo work", "Impact IQ and Spin Across America"], [1, 4, 4, 0, 0, "Mary Kay campaign", "Mary Kay"], [1, 1, 1, 0, 0, "ER campaign", "TriHealth"], [1, 1, 1, 0, 0, "Outdoor and print advertising", "TriHealth"], [2, 2, 2, 3, 0, "Dealer playbooks", "Chevrolet"], [2, 1, 4, 0, 0, "Poster work", "CLC and A Bicycle Built for 95,000"], [2, 2, 2, 3, 0, "Voice of Customer program", "General Motors"], [2, 2, 2, 3, 0, "InfoSource apps", "GMC, Buick, and Chevrolet"], [2, 0, 1, 0, 0, "Summit 2016 identity", "Project Lead The Way"], [2, 1, 1, 1, 0, "TriHealth.com refresh", "TriHealth"], [3, 2, 2, 1, 0, "Vehicle pages and launch sites", "Cadillac"], [3, 2, 2, 0, 0, "SEMA coffee table book", "Chevrolet"], [3, 2, 2, 0, 0, "Customer experience award programs", "General Motors"], [3, 2, 2, 0, 0, "iMR identity", "General Motors"], [3, 2, 2, 3, 0, "Mystery Shop reporting", "General Motors"], [3, 2, 2, 1, 0, "RSMS holiday card", "General Motors"], [3, 2, 2, 1, 0, "Accessories shoots and pages", "GM Accessories"], [3, 4, 4, 0, 0, "Packaging redesign", "Viral Launch"], [4, 3, 4, 0, 0, "Baker Farms identity", "Baker Farms"], [4, 2, 2, 2, 0, "E2UL sourcebook", "Cadillac"], [4, 2, 2, 0, 0, "CamaroFest and Car of the Year materials", "Chevrolet"], [4, 1, 2, 1, 0, "Jerseys for Judson", "Judson Center and Michigan State"], [4, 0, 4, 0, 0, "Karle Symposium identity", "Karle Symposium"], [4, 0, 2, 1, 0, "One10 website launch", "One10 Marketing"], [4, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 2, 0, "Fleet guide", "General Motors"], [5, 4, 4, 1, 0, "Brand standards and landing page", "Isle Royale Equipment"], [5, 4, 4, 1, 0, "Brand, web, and Nike materials", "Olympia Skate Shop"], [5, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 2, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 2, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 2, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 4, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [5, 2, 2, 4, 3, "Under NDA", "Aimia / One10"], [6, 3, 3, 3, 1, "SalesX: re-engineering a sales force", "BASF Agriculture"], [6, 3, 4, 0, 0, "Young Farmers materials", "Young Farmers of Washtenaw County"], [6, 2, 3, 2, 3, "Under NDA", "MRM//McCann"], [6, 2, 3, 3, 3, "Under NDA", "MRM//McCann"], [6, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [6, 2, 2, 3, 3, "Under NDA", "Aimia / One10"], [7, 1, 3, 3, 0, "Interactive concepts", "Abbott"], [7, 3, 3, 3, 0, "Canada Agriculture website", "BASF Agriculture"], [7, 3, 3, 3, 0, "Claims system", "BASF Agriculture"], [7, 3, 3, 2, 0, "Engenia herbicide site", "BASF Agriculture"], [7, 3, 3, 3, 0, "Unified login", "BASF Agriculture"], [7, 4, 3, 2, 0, "Pillsbury pitch", "General Mills"], [7, 0, 3, 2, 0, "Coffee & Collabs", "MRM UX team"], [8, 3, 3, 3, 0, "Partner Portal", "BASF Agriculture"], [8, 5, 3, 3, 0, "Design library", "New York Lottery"], [8, 5, 3, 3, 1, "Digital Playslip", "New York Lottery"], [8, 0, 3, 2, 0, "Learning site unification", "Professional Home Builders Institute"], [9, 3, 3, 1, 0, "Global Seeds & Traits", "BASF Agriculture"], [9, 3, 3, 1, 0, "US Crop website", "BASF Agriculture"], [9, 4, 3, 2, 0, "Instax North America website", "Fujifilm Instax"], [9, 2, 3, 0, 0, "Lab313 rebrand", "General Motors"], [9, 4, 3, 2, 0, "Cart and checkout", "Honeywell"], [9, 4, 3, 3, 0, "Design language refresh", "Honeywell"], [9, 5, 3, 1, 0, "Twelve-language website", "New York Lottery"], [9, 1, 4, 1, 0, "Thomas Edison Center website", "Thomas Edison Center"], [10, 4, 3, 2, 0, "Direct-to-consumer platform", "Fujifilm"], [10, 4, 3, 4, 0, "Chatbot and service tools", "Honeywell"], [10, 0, 3, 2, 0, "Figma 101, 201, and 301", "MRM"], [10, 0, 3, 2, 0, "Office Blind Date", "MRM"], [11, 1, 3, 1, 0, "Farxiga landing pages", "AstraZeneca"], [11, 4, 3, 2, 0, "Amazon experience review", "Fujifilm"], [11, 4, 3, 2, 0, "CRM pitch", "McDonald's"], [11, 0, 3, 4, 0, "AI and asset management vision", "MRM"], [11, 5, 3, 4, 0, "Alexa skills and Help Center", "New York Lottery"], [11, 5, 3, 2, 0, "CRM overhaul", "New York Lottery"], [11, 5, 3, 1, 0, "Live Drawing and Integrity pages", "New York Lottery"], [11, 5, 3, 2, 0, "Quick Draw rebrand", "New York Lottery"], [11, 1, 3, 3, 0, "Experience design support", "Optum"], [11, 6, 4, 2, 2, "Indoor skatepark proposal", "Self-initiated"], [11, 6, 4, 3, 2, "TART", "Self-initiated"], [11, 6, 4, 2, 2, "Tin Minnows Bearings Co.", "Self-initiated"], [11, 5, 3, 2, 0, "Marine Corps pitch", "US Marine Corps"], [12, 4, 3, 2, 0, "New business story", "Corebridge Financial"], [12, 4, 3, 2, 0, "Building Automation site proposal", "Honeywell"], [12, 4, 3, 4, 0, "Product experience proposal", "Jayco"], [12, 6, 4, 4, 2, "Design System Scanner", "Self-initiated"], [12, 6, 4, 4, 2, "Playable Figma Make games", "Self-initiated"], [12, 6, 4, 4, 2, "Portfolios Please", "Self-initiated"], [12, 6, 4, 4, 2, "Scan&Skate and SkateGO", "Self-initiated"], [12, 6, 4, 4, 2, "Shred & Dice", "Self-initiated"]];
    this.SUM = [["Campaign microsite built with the university's web and interactive team.", ["Product and UX", "Web and commerce"]], ["Program and facility pages for the Department of Journalism, with interactive maps.", ["Web and commerce"]], ["The university president's annual holiday card, recognized regionally.", ["Product and UX", "Brand and campaign"]], ["Print, mobile, web, and packaging work, plus photo shoots and client meetings.", ["Web and commerce", "Brand and campaign"]], ["Outdoor and print campaign for an Indiana food bank.", ["Brand and campaign"]], ["Student campaign that won Best of Show at the Student ADDYs.", ["Brand and campaign"]], ["A new Hancock Health identity, the diabetes campaign, and \"I Expect\" cardio advertising.", ["Brand and campaign"]], ["Identity work for regional and national clients.", ["Brand and campaign"]], ["Student campaign that won a Gold Student ADDY.", ["Brand and campaign"]], ["Regional campaign for TriHealth emergency care.", ["Brand and campaign"]], ["Outdoor boards and business press for a Cincinnati health system.", ["Brand and campaign"]], ["Interactive sales guides of 10 to 40 pages for vehicles including Camaro, Silverado, Colorado, Equinox, and Bolt EV.", ["Product and UX", "Brand and campaign"]], ["Concept and event posters.", ["Brand and campaign"]], ["CE Manager reference guide, dashboard job aids, and recruitment pieces for GM's customer experience teams.", ["Research and strategy", "Brand and campaign"]], ["Brand apps that gave dealers product and positioning knowledge they were missing.", ["Product and UX"]], ["Event logo for Project Lead The Way's national summit.", ["Brand and campaign"]], ["Home, institute, and service templates across desktop, tablet, and mobile.", ["Web and commerce"]], ["Page maintenance and launch sites for the CT6, XT5, CTS, and ATS.", ["Web and commerce"]], ["Book and cover for Chevrolet's 2016 SEMA presence.", ["Brand and campaign"]], ["Identities, certificates, and invitations for the Connections and Horizon awards.", ["Brand and campaign"]], ["Logo and identity for a turnkey retail product.", ["Brand and campaign"]], ["Voice of Customer dashboards, job aids, and an infographic that explained dealer scores.", ["Research and strategy", "Brand and campaign"]], ["An After Effects holiday card animation.", ["Product and UX"]], ["Directed Silverado and Colorado shoots and designed accessories layouts for Cadillac.", ["Web and commerce", "Brand and campaign"]], ["Packaging for ArtNaturals and Triple Thread products.", ["Brand and campaign"]], ["Logos for a family of farm and construction businesses.", ["Brand and campaign"]], ["A Cadillac sales sourcebook, walked through directly with the client.", ["Product and UX", "Brand and campaign"]], ["Event awards, clings, and posters for the Camaro community.", ["Brand and campaign"]], ["A charity campaign with posters and daily email through the GM account.", ["Web and commerce", "Brand and campaign"]], ["Logo, program, and images for a recurring scientific symposium.", ["Brand and campaign"]], ["Contributed to the new one10marketing.com when Aimia's US loyalty business became One10.", ["Web and commerce", "Brand and campaign"]], ["", []], ["The 2019 GM Fleet sales guide.", ["Product and UX", "Brand and campaign"]], ["Seasonal ordering and product pages, alongside the Isle Box brand standards.", ["Web and commerce"]], ["Brand and web proposals, digital distribution materials, and 3D logo work.", ["Web and commerce", "Brand and campaign"]], ["", []], ["", []], ["", []], ["", []], ["", []], ["", []], ["", []], ["", []], ["", []], ["One platform replaced the scattered tools a national agriculture sales team used to plan every season.", ["Product and UX", "Design systems", "Research and strategy"]], ["Sign logos and golf tournament flyers for the county golf tournament.", ["Brand and campaign"]], ["", []], ["", []], ["", []], ["", []], ["New business work that brought motion and interaction into MRM's UX practice.", ["Product and UX"]], ["New style guide, library, and documentation, delivered in a one-month design window.", ["Design systems", "Web and commerce"]], ["A claims experience for employees, customers, and partners.", ["Product and UX"]], ["Merged 7 microsites into one and kept pace with legal changes around dicamba.", ["Design systems", "Web and commerce"]], ["One sign-in across US Crop, P&SS, and Seed business segments.", ["Product and UX", "Design systems"]], ["UX strategy for a new business pitch.", ["Research and strategy"]], ["Team knowledge sharing that reached the Toronto and New York offices.", ["Leadership"]], ["Gave partners financials, orders, activity, and learning content in one place.", ["Product and UX", "Research and strategy"]], ["Took a one-page guideline to a unified Figma library.", ["Design systems"]], ["A paper form every player knows became a mobile flow that ends in a QR code at the retailer.", ["Product and UX", "Research and strategy"]], ["Merged 4 standalone sites into one, with 5 reusable templates and 16 unique pages.", ["Design systems", "Web and commerce"]], ["Extended the work to the seeds and traits portfolio on BASF's global site.", ["Web and commerce"]], ["Redesigned regional, category, and product templates with BASF's strategy team.", ["Web and commerce"]], ["Multi-phase redesign with McCann New York built around product education and Gen Z support.", ["Research and strategy", "Web and commerce"]], ["Logo, templates, website layout, voice, and direction for GM's innovation lab.", ["Brand and campaign"]], ["Shopping cart, quick cart, and bulk ordering for building technologies.", ["Web and commerce"]], ["Unified guidelines and operating procedures for system components.", ["Design systems"]], ["Design and localization guidance for translating the site into 12 languages.", ["Design systems", "Web and commerce"]], ["A website for an adult day and vocational services provider.", ["Web and commerce"]], ["A store concept for modern film buyers, planned alongside a partner agency.", ["Research and strategy", "Web and commerce"]], ["Live agent and chatbot enhancements, order management, and returns.", ["Research and strategy", "AI and games"]], ["Three courses that opened Figma to every department.", ["Leadership"]], ["Lunches that paired employees with 10 coworkers from other departments.", ["Research and strategy", "Leadership"]], ["Campaign landing experience in a regulated category.", ["Web and commerce"]], ["A review of the Fujifilm shopping experience on Amazon.", ["Research and strategy", "Web and commerce"]], ["A CRM perspective from the UX team.", ["Research and strategy", "Web and commerce"]], ["A map of how AI and a digital asset manager could generate personalized campaigns.", ["Research and strategy", "AI and games"]], ["Extended player support to voice and a rebuilt help experience.", ["Product and UX", "Web and commerce"]], ["Preference center, newsletter, and a new email strategy.", ["Web and commerce"]], ["Real-time results and a clear account of fair play and responsible gaming.", ["Web and commerce"]], ["Logo and experience work guided by qualitative research.", ["Research and strategy", "Brand and campaign"]], ["Project support on an Optum experience brief.", ["Product and UX"]], ["A proposal for a year-round skate and creative space in Ann Arbor.", ["Research and strategy"]], ["A payment gateway concept for charitable giving across traditional and Web3 payments.", ["Product and UX", "Research and strategy"]], ["Skateboard bearings in collectible tins inspired by vintage fish packaging.", ["Research and strategy", "Brand and campaign"]], ["UX team contribution to a new business pitch.", ["Research and strategy"]], ["Adapted the BASF transformation story for a financial services pitch.", ["Research and strategy"]], ["A phased plan covering architecture, dashboards, an API marketplace, and mobile commerce.", ["Design systems", "Research and strategy"]], ["Configurator, product detail, and dealer locator thinking with a quick prototype.", ["Product and UX", "Research and strategy"]], ["A small tool for inspecting design systems.", ["Design systems", "AI and games"]], ["Escape the Frame, Grinds & Gambles, Kickflip Chaos, Skateshop Empire, and UX Dungeon Crawler.", ["Product and UX", "AI and games"]], ["A game concept with character art and a pitch deck.", ["Brand and campaign", "AI and games"]], ["Skate apps built in Cursor to explore real-world spots.", ["Product and UX", "AI and games"]], ["A skateboarding roguelike built on tricks, dice, and real places.", ["AI and games"]]];
    this.LOGO = {"BASF Agriculture": "/v2/98f679b1c71070b93de1d1fd7ecd6283.png", "New York Lottery": "/v2/2a657719827a673597dea866ed30821a.png", "General Motors": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "Chevrolet": "/v2/616f543469fefd85a1353376fc536366.svg", "Cadillac": "/v2/680560a9d6e6bf1136d09c4827a90eb8.svg", "GM Accessories": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "GMC": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "Buick": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "and Chevrolet": "/v2/a1ebfa488f65be0231c2866d4c42ea3a.svg", "Honeywell": "/v2/6f26237dfd79aa9807e00c01f1ec12ce.svg", "Fujifilm": "/v2/51e33b550edc54490312bb7c959e2ff7.svg", "Fujifilm Instax": "/v2/51e33b550edc54490312bb7c959e2ff7.svg", "Optum": "/v2/5911379b2a03ea490842406df4572106.svg", "AstraZeneca": "/v2/a17a691730ee02181178232cceb44c6b.svg", "Professional Home Builders Institute": "/v2/8e1a565339eeb37f0bee1d233d6b969c.png", "MRM": "/v2/aea971e64d387348e8c1f58819d522eb.png", "MRM UX team": "/v2/aea971e64d387348e8c1f58819d522eb.png", "TriHealth": "/v2/39c0c1dfb5336632ef3402b9e049234b.png", "Hancock Health": "/v2/104aece41c14cd28c2d7fa00fc12636d.png", "Gleaners Food Bank": "/v2/2c0d05d19116480682f892cc48d5d788.png", "Project Lead The Way": "/v2/08e7857d1cec611099fc72df1e27dd4b.png", "Ball State University": "/v2/4ba5f95f3c380fe7e701778bc45b815f.png", "Judson Center and Michigan State": "/v2/36c365a88ab08a2b409c68a78d72f48b.png", "Thomas Edison Center": "/v2/0fbc3cde8c24d1bb53a51da0b5e34a3c.svg", "Young Farmers of Washtenaw County": "/v2/527b9e7472daa68c9dba3981fae522e5.png", "Isle Royale Equipment": "/v2/15d5a1242a32e7b0f3a7a10c45ad1bfa.png", "Olympia Skate Shop": "/v2/24f573f245ac9121f39fb9a262170747.png", "Karle Symposium": "/v2/6b8bce22c3851e6cd4dcb9b050ca1699.png", "GMC, Buick, and Chevrolet": "/v2/d2bd8c0a9659280cb2b441471e446366.png"};
    this.SHOT = {"SalesX: re-engineering a sales force": "/v2/2b0a49fcd7d47662999b75aa3816a1df.jpg", "Digital Playslip": "/v2/04eadf151721aaaf1005bbe69761a593.jpg"};
    this.CAPS = ["Product and UX", "Design systems", "Research and strategy", "Web and commerce", "Brand and campaign", "AI and games", "Leadership"];
    this.EMP = ['School', 'Publicis', 'Aimia and One10', 'MRM//McCann', 'On my own'];
    this.state = { sound: false };
    this.REC = props.rec;
    this.setup();
    this.recSetup();
  }
  componentWillUnmount() {
    (this.timers || []).forEach(clearTimeout);
    if (this.raf) cancelAnimationFrame(this.raf);
    if (this.cleanup) this.cleanup();
    if (this.ac) this.ac.close();
  }
  later(fn, ms) { this.timers = this.timers || []; this.timers.push(setTimeout(fn, ms)); }
  clearLater() { (this.timers || []).forEach(clearTimeout); this.timers = []; }
  rnd(n, k) { const v = Math.sin(n * 12.9898 + k * 78.233) * 43758.5453; return v - Math.floor(v); }
  years(i) { const out = []; this.DATA.forEach((d, n) => { if (d[0] === i) out.push(n); }); return out; }
  // Sound starts on the first press, so nothing plays until the viewer asks for it.
  audio() {
    if (!this.state.sound) return null;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    if (!this.ac) {
      this.ac = new AC();
      const comp = this.ac.createDynamicsCompressor(), g = this.ac.createGain();
      comp.threshold.value = -12; comp.ratio.value = 5;
      g.gain.value = 0.8;
      comp.connect(g).connect(this.ac.destination);
      this.mst = comp;
    }
    if (this.ac.state === 'suspended') this.ac.resume();
    return this.ac;
  }
  now() { const ac = this.audio(); return ac ? ac.currentTime + 0.01 : 0; }
  noise(len) {
    const ac = this.ac, size = Math.max(1, Math.floor(ac.sampleRate * len)), buf = ac.createBuffer(1, size, ac.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const n = ac.createBufferSource(); n.buffer = buf; return n;
  }
  hit(at, len, vol, type, freq, q) {
    if (!this.ac || !this.state.sound) return;
    const ac = this.ac, n = this.noise(len), f = ac.createBiquadFilter(), g = ac.createGain();
    f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    n.connect(f).connect(g).connect(this.mst); n.start(at); n.stop(at + len);
  }
  synth(freq, type, at, len, vol, to) {
    if (!this.ac || !this.state.sound) return;
    const ac = this.ac, o = ac.createOscillator(), g = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, at);
    if (to) o.frequency.exponentialRampToValueAtTime(to, at + len);
    g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(vol, at + 0.008); g.gain.exponentialRampToValueAtTime(0.001, at + len);
    o.connect(g).connect(this.mst); o.start(at); o.stop(at + len + 0.02);
  }
  boom(at, vol) { this.synth(90, 'sine', at, 0.9, vol, 32); this.hit(at, 0.8, vol * 0.7, 'lowpass', 500); }
  sndVals() {
    return {
      soundLabel: this.state.sound ? 'Sound on' : 'Sound off',
      soundOn: this.state.sound ? 'true' : 'false',
      mute: () => { if (this.ac && this.state.sound) this.ac.suspend(); else if (this.ac) this.ac.resume(); this.setState({ sound: !this.state.sound }); },
    };
  }
  who(d) { return d[4] === 3 ? 'Under NDA' : d[5]; }
  setup() {
    Object.assign(this.state, { by: 'year', sel: null, filter: 'All', q: '' });
    this.AXES = {
      year: { n: 'Year', at: 0, labels: [...Array(13).keys()].map((y) => "'" + (13 + y)) },
      who: { n: 'Employer', at: 2, labels: this.EMP },
      lane: { n: 'Industry', at: 1, labels: ['School and studio', 'Health and community', 'Automotive', 'Agriculture', 'Commerce', 'Government', 'My own'] },
      craft: { n: 'Craft', at: 3, labels: ['Print and brand', 'Web', 'Strategy and service', 'Product and UX', 'Code, AI and games'] },
    };
  }
  // Top-down columns, oldest at the bottom of each stack.
  wall(by) {
    const ax = this.AXES[by], n = ax.labels.length, W = 1120, cw = (W - 40) / n, k = Math.max(1, Math.floor((cw - 10) / 30));
    const seen = {}, pos = [];
    this.DATA.forEach((d, i) => {
      const g = d[ax.at], m = seen[g] = (seen[g] === undefined ? 0 : seen[g] + 1);
      const x0 = 20 + g * cw + (cw - Math.min(k, 99) * 30) / 2;
      pos[i] = [x0 + (m % k) * 30 + 15, 352 - Math.floor(m / k) * 30 - 15];
    });
    const labels = ax.labels.map((t, g) => {
      const c = seen[g] === undefined ? 0 : seen[g] + 1;
      return { t, n: String(c), x: ((20 + g * cw + cw / 2) / W * 100).toFixed(2) + '%', ny: ((352 - Math.ceil(c / k) * 30 - 10) / 400 * 100).toFixed(2) + '%', w: (cw / W * 100).toFixed(2) + '%' };
    });
    const counts = ax.labels.map((_, g) => (seen[g] === undefined ? 0 : seen[g] + 1));
    const top = counts.indexOf(Math.max(...counts));
    return { pos, labels, top: { t: by === 'year' ? String(2013 + top) : ax.labels[top], n: counts[top] } };
  }
  pvOf(d, n) {
    const nda = d[4] === 3, own = d[6] === 'Self-initiated', sh = this.SHOT[d[5]];
    const lg = own ? '/v2/e295297c792a99090470f555e3216f0a.png' : this.LOGO[d[6]];
    const w = (k) => (40 + Math.round(this.rnd(n, k) * 50)) + '%';
    return {
      cls: ['on', 'k' + d[3], nda ? 'nda' : sh ? 'shot' : '', own ? 'own' : '', lg ? '' : 'nologo'].join(' '),
      ac: this.ramp(d[0]),
      shot: sh || '/v2/04090179b1b33cc067ebb8191c3e6f95.png', logo: lg || '/v2/04090179b1b33cc067ebb8191c3e6f95.png',
      t: nda ? '' : d[5], client: nda ? '' : d[6], cmd: nda ? '' : '> ' + d[5].toLowerCase() + '_',
      w1: w(11), w2: w(12), w3: w(13),
      cap: nda ? 'Under NDA' : sh ? 'Screenshot' : 'Sketch, not a screenshot',
    };
  }
  ramp(y) { return 'oklch(' + (0.34 + y * 0.05).toFixed(3) + ' 0.008 80)'; }
  // Client record, ported from the live /work page: logo wall filters, sticky tools, sticky client heads, Show N more.
  recSetup() {
    Object.assign(this.state, { rq: '', rind: '', rwh: '', rcl: '', rcap: '', rview: 'client', ropen: {} });
  }
  recVals() {
    const { rq, rind, rwh, rcl, rcap, rview, ropen } = this.state, R = this.REC, W = R.W, PREVIEW = 4;
    const needle = rq.trim().toLowerCase();
    const filtering = !!(needle || rind || rwh || rcl || rcap);
    const hit = W.map((w) => (!needle || w.q.includes(needle)) && (!rind || w.ind === rind) && (!rwh || w.wh === rwh) && (!rcl || R.G[w.g].id === rcl) && (!rcap || w.caps.includes(rcap)));
    const shown = hit.filter(Boolean).length;
    const plural = (n) => n + (n === 1 ? ' project' : ' projects');
    const job = (n, note, compact) => {
      const w = W[n], g = R.G[w.g];
      return { t: w.t, s: w.s, y: w.y, note: compact ? g.name : note, href: w.href || '#rec', link: w.href ? 'on' : '', cls: 'rjob' + (w.nda ? ' nda' : ''),
        cs: w.cs ? 'on' : '', aw: w.aw ? 'on' : '', nda: w.nda ? 'on' : '',
        lsrc: g.logo ? g.logo.src : '', lcls: g.logo ? (g.logo.w ? 'logo white' : 'logo') : 'none', lname: g.name };
    };
    const groups = R.G.map((g) => {
      const rows = g.items.map((it) => { const k = it.indexOf('|'); return { n: +it.slice(0, k), note: it.slice(k + 1) }; }).filter((r) => hit[r.n]);
      const more = g.n > PREVIEW && !filtering, open = !!ropen[g.id];
      const list = more && !open ? rows.slice(0, PREVIEW) : rows;
      return { cls: 'rclient' + (rows.length ? '' : ' gone'), id: g.id, name: g.name, span: g.span, count: plural(g.n), sub: g.sub, subCls: g.sub ? 'on' : '',
        lsrc: g.logo ? g.logo.src : '', lcls: g.logo ? (g.logo.w ? 'logo white' : 'logo') : 'none', hcls: g.logo ? 'sr-only' : '',
        brands: g.brands.map((b) => ({ src: b.src, cls: b.w ? 'logo white' : 'logo' })), bcls: g.brands.length ? 'on' : '',
        jobs: list.map((r) => job(r.n, r.note, false)),
        moreCls: more ? 'on' : '', moreT: open ? 'Show fewer' : 'Show ' + (g.n - PREVIEW) + ' more', moreX: open ? 'true' : 'false',
        more: () => this.setState({ ropen: Object.assign({}, this.state.ropen, { [g.id]: !open }) }) };
    });
    const pick = (k, v) => () => this.setState({ [k]: this.state[k] === v ? '' : v });
    return {
      recIntro: W.length + ' projects for ' + R.clients + ' clients since ' + R.first + '. Pick a logo, or narrow it by what you care about.',
      rwallCls: 'rwall' + (rcl ? ' has-pick' : ''),
      rtiles: R.G.filter((g) => g.logo).map((g) => ({ src: g.logo.src, cls: g.logo.w ? 'logo white' : 'logo', n: String(g.n), label: g.name + ', ' + plural(g.n),
        pressed: rcl === g.id ? 'true' : 'false', go: pick('rcl', g.id) })),
      rq, onRq: (e) => this.setState({ rq: e.target.value || '' }),
      rinds: [{ v: '', t: 'All', sel: !rind }].concat(R.IND.map(([v, n]) => ({ v, t: v + ' (' + n + ')', sel: rind === v }))),
      rwhs: [{ v: '', t: 'All', sel: !rwh }].concat(R.WH.map(([v, n]) => ({ v, t: v + ' (' + n + ')', sel: rwh === v }))),
      onRind: (e) => this.setState({ rind: e.target.value || '' }), onRwh: (e) => this.setState({ rwh: e.target.value || '' }),
      rind, rwh,
      rviews: [['client', 'Client'], ['year', 'Year']].map(([v, t]) => ({ t, pressed: rview === v ? 'true' : 'false', go: () => this.setState({ rview: v }) })),
      rcaps: R.CAPS.map(([name, n]) => ({ t: name, n: String(n), pressed: rcap === name ? 'true' : 'false', go: pick('rcap', name) })),
      rcount: plural(shown), rclearCls: filtering ? 'on' : '',
      rclear: () => this.setState({ rq: '', rind: '', rwh: '', rcl: '', rcap: '' }),
      rclientCls: rview === 'client' ? 'on' : '', ryearCls: rview === 'year' ? 'on' : '',
      rgroups: groups,
      ryear: W.map((w, n) => n).filter((n) => hit[n]).map((n) => job(n, '', true)),
      remptyCls: shown ? '' : 'on',
    };
  }
  renderVals() { return Object.assign(this.listVals(), this.recVals()); }
  listVals() {
    const { by, sel, filter, q } = this.state;
    const DATA = this.DATA, SUM = this.SUM;
    const W = this.wall(by);
    const tiles = DATA.map((d, n) => ({
      cls: ['tile', ['', 'case', 'lab', 'nda'][d[4]], sel === n ? 'sel' : ''].join(' '),
      x: (W.pos[n][0] / 1120 * 100).toFixed(2) + '%', y: (W.pos[n][1] / 400 * 100).toFixed(2) + '%',
      c: d[4] === 3 || d[4] === 1 ? 'transparent' : d[4] === 2 ? '#111' : this.ramp(d[0]),
      dl: ((n % 9) * 0.03).toFixed(2) + 's',
      label: d[4] === 3 ? 'Under NDA, ' + (2013 + d[0]) : d[5] + ', ' + d[6] + ', ' + (2013 + d[0]),
      pick: () => { if (sel !== n) this.setState({ sel: n }); },
    }));
    const p = sel === null ? null : DATA[sel];
    const insight = {
      year: [W.top.n + ' projects in ' + W.top.t + '.', 'The busiest year. Oldest work sits at the bottom of each stack.'],
      who: [W.top.n + ' at ' + W.top.t + '.', 'The biggest chapter so far.'],
      lane: [W.top.t + ' leads with ' + W.top.n + '.', W.top.t === 'Automotive' ? 'It’s where I work now, too.' : 'The biggest industry on the record.'],
      craft: [W.top.n + ' in ' + W.top.t + '.', 'Shade is still the year. The dark ones are oldest.'],
    }[by];
    const blank = { cls: '', ac: 'transparent', shot: '/v2/04090179b1b33cc067ebb8191c3e6f95.png', logo: '/v2/04090179b1b33cc067ebb8191c3e6f95.png', t: '', client: '', cmd: '', w1: '0%', w2: '0%', w3: '0%', cap: '' };
    const needle = (q || '').trim().toLowerCase();
    const order = DATA.map((d, n) => n).sort((a, b) => DATA[b][0] - DATA[a][0] || a - b);
    const shown = order.filter((n) => {
      const d = DATA[n], nda = d[4] === 3;
      if (filter !== 'All' && (nda || !SUM[n][1].includes(filter))) return false;
      return !needle || (nda ? 'under nda ' + d[6] : d[6] + ' ' + d[5] + ' ' + SUM[n][0]).toLowerCase().includes(needle);
    });
    return {
      sorts: Object.keys(this.AXES).map((k) => ({ t: this.AXES[k].n, cls: by === k ? 'on' : '', pressed: by === k ? 'true' : 'false', go: () => this.setState({ by: k }) })),
      tiles, wlabels: W.labels,
      pv: p ? this.pvOf(p, sel) : blank,
      panelCls: p ? 'pick' : '',
      pk: p ? (2013 + p[0]) + ' · ' + this.EMP[p[2]] : 'Bit · sorted by ' + this.AXES[by].n.toLowerCase(),
      ph: p ? (p[4] === 3 ? 'Under NDA' : p[5]) : insight[0],
      pc: p ? (p[4] === 3 ? 'For ' + p[6] + '. That’s all I can say.' : p[6]) : insight[1],
      ps: p && p[4] !== 3 ? SUM[sel][0] : p ? '' : 'Point at any block.',
      caseCls: p && p[5] === 'Digital Playslip' ? 'on' : '',
      q, onQ: (e) => this.setState({ q: e.target.value || '' }),
      filters: ['All'].concat(this.CAPS).map((label) => ({ label, cls: label === filter ? 'on' : '', pressed: label === filter ? 'true' : 'false', pick: () => this.setState({ filter: label }) })),
      rows: shown.map((n) => {
        const d = DATA[n], nda = d[4] === 3;
        return { y: String(2013 + d[0]), c: nda ? 'Under NDA' : d[6], t: nda ? 'Through ' + d[6] : d[5], d: nda ? '' : SUM[n][0], rcls: nda ? 'row nda' : 'row', cs: d[4] === 1, href: d[5] === 'Digital Playslip' ? '/work/nyl-digital-playslip/' : '#wall', pick: () => this.setState({ sel: n }) };
      }),
      countLabel: shown.length + ' of ' + DATA.length + ' projects',
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
        <div className={"wrap nav"}>
          {" "}
          <a href={"/"} aria-label={"Dooane, home"}>
            <img src={"/v2/fbe450132c9926658233b780d325d119.png"} alt={"Dooane"} />
          </a>
          {" "}
          <nav className={"links"} aria-label={"Main"}>
            {" "}
            <a className={"on"} href={"/work/"}>
              {"Work"}
            </a>
            {" "}
            <a href={"/about/"}>
              {"About"}
            </a>
            {" "}
            <a href={"/#process"}>
              {"Process"}
            </a>
            {" "}
            <a href={"/play/"}>
              {"Play"}
            </a>
            {" "}
            <a href={"/#contact"}>
              {"Contact"}
            </a>
            {" "}
          </nav>
          {" "}
        </div>
        {" "}
        <header className={"wrap head"}>
          {" "}
          <h1 className={"display"} style={{"position": "relative"}}>
            {"The record."}
          </h1>
          {" "}
          <p className={"muted"} style={{"position": "relative", "maxWidth": "620px", "margin": "18px 0 0", "fontSize": "19px"}}>
            {"Every project lives here. Only the strongest get told in full."}
          </p>
          <img className={"sp"} src={"/v2/8dc45d9cf1c0ca0805c4934ada319bd6.png"} alt={""} aria-hidden={"true"} style={{"objectFit": "cover", "objectPosition": "50% 100%"}} />
          {" "}
        </header>
        {" "}
        <section className={"wrap wallsec"} id={"wall"}>
          {" "}
          <div className={"sorts"} role={"group"} aria-label={"Sort the 94 projects by"}>
            {" "}
            <span className={"sl"}>
              {"Sort by"}
            </span>
            {" "}
            {(v.sorts || []).map((o, i0) => (
              <React.Fragment key={i0}>
                <button className={`chip ${o.cls}`} onClick={o.go} aria-pressed={o.pressed}>
                  {`${o.t}`}
                </button>
              </React.Fragment>
            ))}
            {" "}
            <span className={"key"}>
              <i className={"k1"}></i>
              {"Case study "}
              <i className={"k2"}></i>
              {"My own lab "}
              <i className={"k3"}></i>
              {"Under NDA"}
            </span>
            {" "}
          </div>
          {" "}
          <div className={"wallbox"}>
            {" "}
            <div className={"wall"}>
              {" "}
              {(v.wlabels || []).map((l, i1) => (
                <React.Fragment key={i1}>
                  <span className={"wn"} style={{"left": l.x, "top": l.ny}}>
                    {`${l.n}`}
                  </span>
                  <span className={"wl"} style={{"left": l.x, "width": l.w}}>
                    {`${l.t}`}
                  </span>
                </React.Fragment>
              ))}
              {" "}
              {(v.tiles || []).map((b, i2) => (
                <React.Fragment key={i2}>
                  <button className={b.cls} style={{"left": b.x, "top": b.y, "backgroundColor": b.c, "transitionDelay": b.dl}} aria-label={b.label} onClick={b.pick} onMouseEnter={b.pick} onFocus={b.pick}></button>
                </React.Fragment>
              ))}
              {" "}
            </div>
            {" "}
            <aside className={`panel ${v.panelCls}`}>
              {" "}
              <div className={`pv ${v.pv.cls}`} style={{"--ac": v.pv.ac}} aria-hidden={"true"}>
                {" "}
                <img className={"shot"} src={v.pv.shot} alt={""} />
                {" "}
                <div className={"mk"}>
                  <div className={"bar"}></div>
                  <div className={"hero"}></div>
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
                  <div className={"cards"}>
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
                {" "}
              </div>
              {" "}
              <div className={"pbody"} aria-live={"polite"}>
                {" "}
                <img className={"bot"} src={"/v2/04090179b1b33cc067ebb8191c3e6f95.png"} alt={""} />
                {" "}
                <span className={"pk"}>
                  {`${v.pk}`}
                </span>
                {" "}
                <b>
                  {`${v.ph}`}
                </b>
                {" "}
                <span className={"pc"}>
                  {`${v.pc}`}
                </span>
                {" "}
                <span className={"ps"}>
                  {`${v.ps}`}
                </span>
                {" "}
                <a className={`btn-mini ${v.caseCls}`} href={"/work/nyl-digital-playslip/"}>
                  {"Read the case study →"}
                </a>
                {" "}
              </div>
              {" "}
            </aside>
            {" "}
          </div>
          {" "}
        </section>
        {" "}
        <main className={"wrap rec"} id={"rec"} style={{"paddingBottom": "96px"}}>
          {" "}
          <h2 className={"display rh"}>
            {"The client record."}
          </h2>
          {" "}
          <p className={"muted rintro"}>
            {`${v.recIntro}`}
          </p>
          {" "}
          <section className={v.rwallCls} aria-label={"Filter by client"}>
            {" "}
            {(v.rtiles || []).map((t, i3) => (
              <React.Fragment key={i3}>
                <button type={"button"} className={"rtile"} aria-pressed={t.pressed} aria-label={t.label} onClick={t.go}>
                  <img className={t.cls} src={t.src} alt={""} />
                  <span className={"rtc"}>
                    {`${t.n}`}
                  </span>
                </button>
              </React.Fragment>
            ))}
            {" "}
          </section>
          {" "}
          <div className={"rtools"} role={"search"}>
            {" "}
            <div className={"rrow"}>
              {" "}
              <label className={"rsearch"}>
                <span>
                  {"Search"}
                </span>
                <input type={"search"} placeholder={"Client, project, or skill"} autoComplete={"off"} value={v.rq} onChange={v.onRq} />
              </label>
              {" "}
              <label>
                <span>
                  {"Industry"}
                </span>
                <select onChange={v.onRind} value={v.rind}>
                  {(v.rinds || []).map((o, i4) => (
                    <React.Fragment key={i4}>
                      <option value={o.v}>
                        {`${o.t}`}
                      </option>
                    </React.Fragment>
                  ))}
                </select>
              </label>
              {" "}
              <label>
                <span>
                  {"Where"}
                </span>
                <select onChange={v.onRwh} value={v.rwh}>
                  {(v.rwhs || []).map((o, i5) => (
                    <React.Fragment key={i5}>
                      <option value={o.v}>
                        {`${o.t}`}
                      </option>
                    </React.Fragment>
                  ))}
                </select>
              </label>
              {" "}
              <div className={"rview"} role={"group"} aria-label={"Arrange by"}>
                <span>
                  {"Arrange by"}
                </span>
                <div>
                  {(v.rviews || []).map((v, i6) => (
                    <React.Fragment key={i6}>
                      <button type={"button"} aria-pressed={v.pressed} onClick={v.go}>
                        {`${v.t}`}
                      </button>
                    </React.Fragment>
                  ))}
                </div>
              </div>
              {" "}
            </div>
            {" "}
            <div className={"rchips"} role={"group"} aria-label={"Filter by kind of work"}>
              {" "}
              {(v.rcaps || []).map((c, i7) => (
                <React.Fragment key={i7}>
                  <button type={"button"} className={"rchip"} aria-pressed={c.pressed} onClick={c.go}>
                    {`${c.t} `}
                    <span>
                      {`${c.n}`}
                    </span>
                  </button>
                </React.Fragment>
              ))}
              {" "}
            </div>
            {" "}
          </div>
          {" "}
          <div className={"rstatus"}>
            <span aria-live={"polite"}>
              {`${v.rcount}`}
            </span>
            <button type={"button"} className={`rclear ${v.rclearCls}`} onClick={v.rclear}>
              {"Clear filters"}
            </button>
          </div>
          {" "}
          <div className={`rlist ${v.rclientCls}`}>
            {" "}
            {(v.rgroups || []).map((g, i8) => (
              <React.Fragment key={i8}>
                <section className={g.cls}>
                  {" "}
                  <header className={"rhead"}>
                    {" "}
                    <div className={"rmark"}>
                      <img className={g.lcls} src={g.lsrc} alt={""} />
                      <span className={`ltext ${g.lcls}`}>
                        {`${g.name}`}
                      </span>
                    </div>
                    {" "}
                    <h3 className={g.hcls}>
                      {`${g.name}`}
                    </h3>
                    {" "}
                    <p>
                      {`${g.span} · ${g.count}`}
                    </p>
                    {" "}
                    <p className={`rsub ${g.subCls}`}>
                      {`${g.sub}`}
                    </p>
                    {" "}
                    <div className={`rbrands ${g.bcls}`}>
                      {(g.brands || []).map((b, i9) => (
                        <React.Fragment key={i9}>
                          <img className={b.cls} src={b.src} alt={""} />
                        </React.Fragment>
                      ))}
                    </div>
                    {" "}
                  </header>
                  {" "}
                  <div className={"rwork"}>
                    {" "}
                    <ul>
                      {" "}
                      {(g.jobs || []).map((j, i10) => (
                        <React.Fragment key={i10}>
                          <li className={j.cls}>
                            {" "}
                            <div className={"rmain"}>
                              <h4>
                                {j.link ? (
                                  <>
                                    <a href={j.href}>
                                      {`${j.t}`}
                                    </a>
                                  </>
                                ) : null}
                                <span className={`tx ${j.link}`}>
                                  {`${j.t}`}
                                </span>
                              </h4>
                              <p className={"rnote"}>
                                {`${j.note}`}
                              </p>
                            </div>
                            {" "}
                            <p className={"rsum"}>
                              {`${j.s}`}
                            </p>
                            {" "}
                            <div className={"rside"}>
                              <span className={"ryr"}>
                                {`${j.y}`}
                              </span>
                              <span className={`flag case ${j.cs}`}>
                                {"Case study"}
                              </span>
                              <span className={`flag award ${j.aw}`}>
                                {"Award"}
                              </span>
                              <span className={`flag nda ${j.nda}`}>
                                {"NDA"}
                              </span>
                            </div>
                            {" "}
                          </li>
                        </React.Fragment>
                      ))}
                      {" "}
                    </ul>
                    {" "}
                    <button type={"button"} className={`rmore ${g.moreCls}`} aria-expanded={g.moreX} onClick={g.more}>
                      {`${g.moreT}`}
                    </button>
                    {" "}
                  </div>
                  {" "}
                </section>
              </React.Fragment>
            ))}
            {" "}
          </div>
          {" "}
          <ul className={`rbyyear ${v.ryearCls}`}>
            {" "}
            {(v.ryear || []).map((j, i11) => (
              <React.Fragment key={i11}>
                <li className={j.cls}>
                  {" "}
                  <span className={"rjlogo"}>
                    <img className={j.lcls} src={j.lsrc} alt={""} />
                    <span className={`ltext ${j.lcls}`}>
                      {`${j.lname}`}
                    </span>
                  </span>
                  {" "}
                  <div className={"rmain"}>
                    <h4>
                      {j.link ? (
                        <>
                          <a href={j.href}>
                            {`${j.t}`}
                          </a>
                        </>
                      ) : null}
                      <span className={`tx ${j.link}`}>
                        {`${j.t}`}
                      </span>
                    </h4>
                    <p className={"rnote"}>
                      {`${j.note}`}
                    </p>
                  </div>
                  {" "}
                  <p className={"rsum"}>
                    {`${j.s}`}
                  </p>
                  {" "}
                  <div className={"rside"}>
                    <span className={"ryr"}>
                      {`${j.y}`}
                    </span>
                    <span className={`flag case ${j.cs}`}>
                      {"Case study"}
                    </span>
                    <span className={`flag award ${j.aw}`}>
                      {"Award"}
                    </span>
                    <span className={`flag nda ${j.nda}`}>
                      {"NDA"}
                    </span>
                  </div>
                  {" "}
                </li>
              </React.Fragment>
            ))}
            {" "}
          </ul>
          {" "}
          <p className={`rempty ${v.remptyCls}`}>
            {"Nothing matches those filters. Try clearing one."}
          </p>
          {" "}
        </main>
        {" "}
      </div>
      {" "}
      </>
    );
  }
}
