// The Process page: the four-step loop from the home page, in depth, and the roles (hats) Caleb wears inside it.
// Every example comes from src/data/career.yaml or a published project; keep it that way when editing.
import React from 'react';

const STEPS = [
  { n: '01', name: 'Discover', icon: '/v2/4ff2ef6a4bc39c162f3958249ba2ecde.png', q: 'What is actually happening?',
    text: 'Ask questions before making assumptions. Watch people work, map the system, and find the problem worth solving.',
    do: ['Customer and stakeholder interviews', 'Watching people do the job today', 'Auditing what already exists', 'Mapping the system and the people in it'],
    get: ['Research synthesis', 'Journey and system maps', 'A list of hypotheses to test'] },
  { n: '02', name: 'Define', icon: '/v2/84403b71021fdc1512363ffad30ce66c.png', q: 'What are we solving, and for whom?',
    text: 'Turn what we learned into a shared problem statement and a set of decisions a team can act on.',
    do: ['Workshops that turn findings into requirements', 'Prioritizing with engineering and the business', 'Writing the business case when one is needed'],
    get: ['A problem statement everyone signs', 'Requirements and a roadmap', 'Clear decisions and owners'] },
  { n: '03', name: 'Design', icon: '/v2/30c5a2b3f648b1ba6a6e32ff60316d5c.png', q: 'What is the simplest thing that works?',
    text: 'Prototype fast, test with real people, and build the system that keeps the work consistent.',
    do: ['Rapid prototypes in Figma, Axure, or real code', 'Testing with the people who will use it', 'Interaction and conversational design', 'Components and patterns in a design system'],
    get: ['Tested flows and prototypes', 'Screens, scripts, and specs', 'A system the next team can use'] },
  { n: '04', name: 'Deliver', icon: '/v2/9ded2548d085f2b49600ec08618da5e1.png', q: 'Did it work?',
    text: 'Stay through launch. Specify the details, support engineering, and measure what happened.',
    do: ['Annotated specs and build reviews', 'Partnering with engineering, AI/ML, and operations', 'Reading real performance data after launch'],
    get: ['Shipped product', 'What to change next, backed by data', 'An updated design system'] },
];

// stages: which steps of the loop the hat usually shows up in (D1 Discover, D2 Define, D3 Design, D4 Deliver)
const HATS = [
  { name: 'Product manager', st: 'Now', stages: [0, 1, 3],
    when: 'When a team needs someone to own the why, the what, and the order it ships in.',
    pts: ['Lead product strategy and execution for AI customer engagement across voice, text, and digital channels.', 'Turn product vision into a roadmap with engineering, AI/ML, and operations, then design what gets built.', 'Use real-time performance data to refine conversation flows.'],
    proof: 'Product Manager, STELLA Automotive AI' },
  { name: 'Researcher', st: 'Evidence', stages: [0, 1],
    when: 'When nobody is sure what customers need, or everybody is sure and nobody has asked.',
    pts: ['Tested 13 hypotheses across 4 MyCarDrive features in 10+ customer interviews, then turned the findings into prototype changes.', 'Ran empathy research for GM Lab313 digital retail products.', 'Led research and design for the City of Raleigh website redesign.'],
    proof: 'GM Lab313 · MRM//McCann' },
  { name: 'Facilitator', st: 'Alignment', stages: [0, 1],
    when: 'When the answer lives in five departments and they need to land on one plan.',
    pts: ['Ran dealer workshops that defined requirements for chat ownership, appointment routing, and data sharing.', 'Wrote the business case for design-thinking training, won approval, attended, and taught it back to the team.'],
    proof: 'One10 Marketing for GM' },
  { name: 'Product design lead', st: 'Core', stages: [1, 2, 3],
    when: 'When a complex product has to work for real people at scale.',
    pts: ['Led UX on BASF SalesX as it grew from a pilot of 40 users to 800+ sales professionals.', 'Led product design on New York Lottery’s Digital Playslip, sign-on, and CRM programs.', 'Designed STELLA Insights end to end across desktop and mobile.'],
    links: [['BASF SalesX', '/work/basf-salesx/'], ['NY Lottery Digital Playslip', '/work/nyl-digital-playslip/']],
    proof: 'MRM//McCann · STELLA Automotive AI' },
  { name: 'Conversation designer', st: 'Voice + text', stages: [2, 3],
    when: 'When the interface is a voice or a chat window instead of a screen.',
    pts: ['Lead conversational design for STELLA’s voice and text agent, defining how it speaks and behaves with customers.', 'Refine conversation flows with live performance data.'],
    proof: 'STELLA Automotive AI' },
  { name: 'Systems designer', st: 'Scale', stages: [2, 3],
    when: 'When more than one team, or an AI agent, has to build from the same parts.',
    pts: ['Develop the STELLA design system so designers, engineers, and AI agents can all apply it.', 'Took New York Lottery from a one-page guideline to a unified Figma library, and unified Honeywell’s component guidelines.'],
    proof: 'STELLA · New York Lottery · Honeywell' },
  { name: 'Art director', st: 'Craft', stages: [2],
    when: 'When it has to look right and feel like the brand, not just work.',
    pts: ['Led visual work for TriHealth, Hancock Health, and Gleaners Food Bank.', 'Won an Indianapolis Silver ADDY and a Healthcare Advertising Bronze.', 'Brand work like the GM Lab313 rebrand.'],
    proof: 'Publicis · General Motors' },
  { name: 'Builder', st: 'Hands on', stages: [2, 3],
    when: 'When the fastest way to answer a question is to make the thing.',
    pts: ['Build working prototypes and games in Cursor with HTML, CSS, and JavaScript.', 'Designing and building Street Signal, a skate game set at real spots.'],
    links: [['See what I build for fun', '/play/']],
    proof: 'Self-initiated' },
  { name: 'Teacher', st: 'Team', stages: [3],
    when: 'When the team around the work needs to get better at it, too.',
    pts: ['Co-created UX Jam Sessions and a Figma 101 to 301 series open to every department.', 'Guest lecturer on creative strategy and branding at Ball State University, and portfolio reviewer for AAF District 6.'],
    proof: 'MRM//McCann · Ball State University' },
];

// The Double Diamond + Development framework Caleb defined at MRM, redrawn in the site's style.
// Coordinates follow the original artwork (x - 450, y - 100); each row is [group, anchor, x, y, labels].
const FW_ROWS = [
  ['pd', 'end', 643, 239, ['Surveys']], ['pd', 'end', 643, 270, ['User Interviews']], ['pd', 'end', 643, 300, ['Experience Mapping']],
  ['pd', 'end', 643, 331, ['Competitor Analysis']], ['pd', 'end', 643, 361, ['Formative Usability Testing']], ['pd', 'end', 643, 392, ['Ethnographic Field Studies']],
  ['pd', 'end', 643, 422, ['Stakeholder Interviews']], ['pd', 'end', 643, 453, ['Data Review']],
  ['pf', 'start', 650, 264, ['Insights']], ['pf', 'start', 650, 295, ['Opportunities']], ['pf', 'start', 650, 325, ['Prelim Solutions Architecture']],
  ['pf', 'start', 650, 356, ['Journey Mappings', 'User Stories']], ['pf', 'start', 650, 387, ['Synthesis', 'Epics']],
  ['pf', 'start', 650, 418, ['Experience Strategy']], ['pf', 'start', 650, 448, ['KPIs']],
  ['sd', 'end', 1022, 239, ['Wireframes']], ['sd', 'end', 1022, 270, ['User Flows']], ['sd', 'end', 1022, 301, ['Solutions Architecture']],
  ['sd', 'end', 1022, 333, ['Information Architecture']], ['sd', 'end', 1022, 364, ['Animation Concepts']], ['sd', 'end', 1022, 396, ['Rapid Prototyping']],
  ['sd', 'end', 1022, 427, ['UI Designs']], ['sd', 'end', 1022, 459, ['Critiques']],
  ['cv', 'start', 1028, 257, ['Prototyping']], ['cv', 'start', 1028, 287, ['Accessibility']], ['cv', 'start', 1028, 318, ['Iterative Usability Testing']],
  ['cv', 'start', 1028, 348, ['Additive Usability Testing']], ['cv', 'start', 1028, 379, ['Development Packages']], ['cv', 'start', 1028, 410, ['Design Annotations']],
  ['cv', 'start', 1028, 440, ['Design System']],
  ['dv', 'start', 1350, 222, ['Database Design']], ['dv', 'start', 1333, 256, ['Database Development', 'Production\nEnvironments']],
  ['dv', 'start', 1292, 290, ['Design Debt', 'Database Integrations']], ['dv', 'start', 1260, 324, ['Design Review', 'End Point Planning']],
  ['dv', 'start', 1255, 358, ['Technical Debt (Documentation)', 'Code Reviews']], ['dv', 'start', 1276, 392, ['Front End Development', 'CMS Page Builds']],
  ['dv', 'start', 1327, 426, ['Code Optimization']], ['dv', 'start', 1356, 460, ['QA Testing']],
  ['dv', 'start', 1586, 345, ['QA Testing']], ['dv', 'start', 1604, 390, ['Demos &\nWalkthroughs']],
  ['dv', 'start', 1775, 349, ['Product Launch', 'Tracking']],
];
const FW_BARS = [
  ['UX Content Strategy', 643, 1431, 646], ['UX Content Strategy', 1576, 1905, 646],
  ['Foundational UX Research', 456, 830, 699], ['UXR', 1017, 1205, 699], ['UXR', 1247, 1534, 699], ['Assessment (UXR)', 1576, 1763, 699], ['UXR', 1858, 1950, 699],
  ['Information Architecture', 456, 1205, 752], ['IA', 1306, 1431, 752], ['IA', 1576, 1670, 752],
  ['Product Design', 456, 1950, 804, 'red'], ['Design Systems', 456, 1950, 857, 'paper'],
];
const fx = (x) => x - 450;
const fy = (y) => y - 100;
const tw = (t) => Math.max(...t.split('\n').map((l) => l.length)) * 5.4 + 12;

function FwTag({ g, x, y, t }) {
  const lines = t.split('\n');
  const w = tw(t), h = lines.length > 1 ? 28 : 18;
  return (
    <g className={`fw-t fw-${g}`}>
      <rect x={x} y={y - h / 2} width={w} height={h} rx="3" />
      <text x={x + w / 2} y={y - (lines.length - 1) * 5}>
        {lines.map((l, i) => <tspan key={l} x={x + w / 2} dy={i ? 10 : 0}>{l}</tspan>)}
      </text>
    </g>
  );
}

function Framework() {
  const tags = [];
  FW_ROWS.forEach(([g, anchor, x0, y0, labels]) => {
    let x = fx(x0);
    labels.forEach((t) => {
      const w = tw(t);
      tags.push(<FwTag key={`${t}-${x0}-${y0}`} g={g} x={anchor === 'end' ? x - w : x} y={fy(y0)} t={t} />);
      x += w + 6;
    });
  });
  const dia = (cx) => `${fx(cx - 187)},${fy(349)} ${fx(cx)},${fy(162)} ${fx(cx + 187)},${fy(349)} ${fx(cx)},${fy(536)}`;
  return (
    <svg className="fw-svg" viewBox="0 0 1510 810" role="img" aria-labelledby="fw-title fw-desc">
      <title id="fw-title">Design framework: Double Diamond plus Development</title>
      <desc id="fw-desc">Discovery runs two diamonds: problem discovery and definition, then solution discovery and concept validation. Developer handoff leads into design and development, then early access validation and public rollout. UX content strategy, UX research, information architecture, product design, and design systems run underneath across the phases.</desc>
      <g className="fw-lines">
        <line x1={fx(1205)} y1="18" x2={fx(1205)} y2={fy(790)} className="solid" />
        <line x1={fx(1577)} y1="18" x2={fx(1577)} y2={fy(790)} />
        <line x1={fx(1765)} y1="18" x2={fx(1765)} y2={fy(790)} />
      </g>
      <g className="fw-phase">
        <text x={fx(456)} y="30">Discovery</text>
        <text x={fx(1225)} y="30">Development</text>
        <text x={fx(1596)} y="30">Validation</text>
        <text x={fx(1784)} y="30">Rollout</text>
      </g>
      <polygon className="fw-shape" points={dia(643)} />
      <polygon className="fw-shape" points={dia(1017)} />
      <polygon className="fw-shape" points={`${fx(1205)},${fy(349)} ${fx(1390)},${fy(162)} ${fx(1950)},${fy(349)} ${fx(1390)},${fy(536)}`} />
      <g className="fw-lines">
        <line x1={fx(643)} y1={fy(162)} x2={fx(643)} y2={fy(592)} />
        <line x1={fx(1017)} y1={fy(162)} x2={fx(1017)} y2={fy(592)} />
        <line x1={fx(830)} y1={fy(349)} x2={fx(830)} y2={fy(592)} />
      </g>
      {tags}
      <line className="fw-handoff-line" x1={fx(1205)} y1={fy(240)} x2={fx(1205)} y2={fy(343)} />
      <circle className="fw-handoff-dot" cx={fx(1205)} cy={fy(349)} r="6" />
      <g className="fw-handoff">
        <rect x={fx(1205) - 62} y={fy(230) - 13} width="124" height="26" rx="13" />
        <text x={fx(1205)} y={fy(230)}>Dev handoff</text>
      </g>
      <g className="fw-sub">
        {[['Problem Discovery', 550], ['Problem Definition', 737], ['Solution Discovery', 924], ['Concept Validation', 1110], ['Design & Development', 1390], ['Early Access', 1670], ['Public Availability', 1858]].map(([t, x]) => (
          <text key={t} x={fx(x)} y={fy(568)}>{t}</text>
        ))}
      </g>
      {FW_BARS.map(([t, a, b, y, tone]) => (
        <g key={`${t}-${a}`} className={`fw-bar${tone ? ` fw-bar-${tone}` : ''}`}>
          <rect x={fx(a)} y={fy(y)} width={b - a} height="38" rx="6" />
          <text x={fx((a + b) / 2)} y={fy(y) + 20}>{t}</text>
        </g>
      ))}
    </svg>
  );
}

const NAV = [['Work', '/work/'], ['About', '/about/'], ['Process', '/process/'], ['Play', '/play/'], ['Contact', '/#contact']];

export default function Process({ skills = {} }) {
  return (
    <div className="site">
      <section className="paper torn-b">
        <div className="wrap nav">
          <a href="/" aria-label="Dooane, home"><img src="/v2/fbe450132c9926658233b780d325d119.png" alt="Dooane" /></a>
          <nav className="links" aria-label="Main">
            {NAV.map(([t, h]) => <a key={h} className={t === 'Process' ? 'on' : undefined} aria-current={t === 'Process' ? 'page' : undefined} href={h}>{t}</a>)}
          </nav>
        </div>
        <div className="wrap intro">
          <div>
            <h1 className="display">One loop.<br />Many hats.</h1>
            <img src="/v2/73f5db1a7934994f4a806442391f3084.png" alt="" aria-hidden="true" className="stroke" />
            <p className="lede">Every project runs through the same four steps. What changes is the job I do inside them.</p>
            <p className="sub">I have been the researcher in the room, the facilitator at the whiteboard, the product manager with the roadmap, the art director on the brand, and the one in Cursor building the prototype. Here is how the loop works, and which hat shows up where.</p>
            <div className="ctas">
              <a className="btn btn-red" href="#hats">See the hats <span aria-hidden="true">↓</span></a>
              <a className="btn btn-ink" href="#loop">The loop</a>
            </div>
          </div>
          <div className="loop" aria-hidden="true">
            {STEPS.map((s) => (
              <div key={s.n} className="lp"><img src={s.icon} alt="" /><b>{s.name}</b></div>
            ))}
            <img className="lp-guy" src="/dooane/crouch.png" alt="" />
            <span className="lp-arrow">↻</span>
          </div>
        </div>
      </section>

      <section className="wrap section" id="loop">
        <div className="head">
          <h2 className="display">The loop</h2>
          <p className="muted">Four steps, in order, every time. Big projects run the loop many times; small ones run it in an afternoon.</p>
        </div>
        <ol className="steps">
          {STEPS.map((s) => (
            <li key={s.n} className="step">
              <div className="step-h">
                <img src={s.icon} alt="" aria-hidden="true" />
                <span className="n">{s.n}</span>
                <h3 className="display">{s.name}</h3>
                <p className="q">{s.q}</p>
              </div>
              <p className="step-t">{s.text}</p>
              <div className="step-l">
                <div><h4>What I do</h4><ul>{s.do.map((x) => <li key={x}>{x}</li>)}</ul></div>
                <div><h4>What you get</h4><ul>{s.get.map((x) => <li key={x}>{x}</li>)}</ul></div>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="wrap section" id="framework">
        <div className="head">
          <h2 className="display">The framework</h2>
          <p className="muted">The double diamond plus development. I defined this framework at MRM to give UX, engineering, partners, and clients one shared map of the work, from first interview to launch.</p>
        </div>
        <div className="fw-scroll" tabIndex={0} aria-label="Framework diagram, scroll sideways on small screens">
          <Framework />
        </div>
        <div className="fw-notes">
          <div><h3>Go wide, then decide</h3><p>Each diamond opens up to explore, then narrows to commit: first on the problem, then on the solution.</p></div>
          <div><h3>Certainty grows left to right</h3><p>Every step narrows the options as we learn how people respond, and we adjust along the way.</p></div>
          <div><h3>Change is cheapest early</h3><p>Big shifts belong in discovery. Once code is committed, the work is about the last 5% of optimization.</p></div>
        </div>
      </section>

      <section className="wrap section" id="hats">
        <div className="head">
          <h2 className="display">The hats</h2>
          <p className="muted">Nine roles I have actually done, with the work to back each one up.</p>
        </div>
        <div className="hats">
          {HATS.map((h, i) => (
            <article key={h.name} className="hat">
              <div className="hat-top">
                <span className="st">{h.st}</span>
                <span className="hn">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="display">{h.name}</h3>
              <p className="when">{h.when}</p>
              <ul>{h.pts.map((p) => <li key={p}>{p}</li>)}</ul>
              <div className="hat-foot">
                <span className="proof">{h.proof}</span>
                {h.links && h.links.map(([t, href]) => <a key={href} href={href}>{t} <span aria-hidden="true">→</span></a>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="head">
          <h2 className="display">Where each hat shows up</h2>
          <p className="muted">Most projects need three or four of these at once. This is where each one usually lands in the loop.</p>
        </div>
        <div className="matrix" role="table" aria-label="Which hats show up in each step of the loop">
          <div className="mx-row mx-head" role="row">
            <span role="columnheader">Hat</span>
            {STEPS.map((s) => <span key={s.n} role="columnheader">{s.name}</span>)}
          </div>
          {HATS.map((h) => (
            <div key={h.name} className="mx-row" role="row">
              <span role="rowheader">{h.name}</span>
              {STEPS.map((s, j) => (
                <span key={s.n} role="cell" className={h.stages.includes(j) ? 'on' : undefined}>
                  {h.stages.includes(j) ? <i aria-label="Yes" /> : <span className="sr">No</span>}
                </span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="wrap section">
        <div className="head"><h2 className="display">Toolkit</h2></div>
        <div className="cols">
          {Object.entries(skills).map(([k, list]) => (
            <div key={k}><h3>{k}</h3><ul>{list.map((x) => <li key={x}>{x}</li>)}</ul></div>
          ))}
        </div>
      </section>

      <section className="paper cta">
        <div className="wrap cta-in">
          <h2 className="display">Need one hat,<br />or all of them?</h2>
          <div className="ctas">
            <a className="btn btn-red" href="/work/">See the work <span aria-hidden="true">→</span></a>
            <a className="btn btn-ink" href="/#contact">Get in touch</a>
          </div>
          <img className="cta-guy" src="/dooane/cap-tip.png" alt="" aria-hidden="true" />
        </div>
      </section>
    </div>
  );
}
