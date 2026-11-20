// DOOANE's prepared answers about Street Signal.
// Every fact here is already public on the Street Signal case study (/work/street-signal/) or the game's own site.
// Keep it that way: no pitch numbers, funding plans, unreleased features, or day-job details.
// When a visitor asks something not covered here, DOOANE says so instead of guessing.

const CASE = '/work/street-signal/';
const PLAY = 'https://streetsignalgame.com';
const link = (label, href) => ({ label, href });
const caseLink = (label = 'Read the case study', anchor = '') => link(label, `${CASE}${anchor}`);
const playLink = link('Play Street Signal', PLAY);

// Questions that name the game, or name something only the game has.
export const mentionsStreetSignal = (q) =>
  /\bstreet ?signal\b|streetsignal|\bskate ?spotter\b|\bsignal atlas\b|\bhart plaza\b|\b(the|your|his|caleb'?s|that) (skate(boarding)? )?game\b|\bskate(boarding)? game\b/.test(q);

const answers = [
  {
    key: 'press',
    match: /\b(press|media kit|press kit|journalists?|reporters?|interview|article|write about|story)\b/,
    text: 'There’s a press kit at the end of the case study, with a short description you can copy. Press requests go through streetsignalgame.com. A founder statement isn’t published yet.',
    links: () => [caseLink('Open the press kit', '#press'), playLink],
  },
  {
    key: 'business',
    match: /\b(invest(or|ors|ment|ing)?|fund(ing|ers?|ed|raise|raising)?|money|revenue|business model|monetiz\w*|make money|pricing|sponsors?|partner(s|ship)?)\b/,
    text: 'Street Signal is a playable prototype with no revenue yet. Caleb plans to pitch it in April 2027 at Ann Arbor’s annual skateboarding art show, to players and funders in the same room. For partnering or anything about the business, email Caleb directly.',
    links: (p) => [link('Email Caleb', `mailto:${p.email}`), caseLink('See what’s next', '#next')],
  },
  {
    key: 'event',
    match: /\b(april|art show|auction|pitch|event|showcase|cabinet|arcade)\b/,
    text: 'The next big moment is April 2027: a pitch at Ann Arbor’s annual skateboarding art show, to players and funders in the same room. Before then, the game has to prove a stranger can pick it up on a phone and land an ollie and a grind without instructions.',
    links: () => [caseLink('See what’s next', '#next'), playLink],
  },
  {
    key: 'platform',
    match: /\b(download|install|app store|ios|iphone|ipad|android|phones?|mobile|desktop|pc|mac|laptop|browser|controllers?|gamepad|keyboard|touch|platforms?|devices?)\b/,
    text: 'Play it at streetsignalgame.com. It runs in a browser on a phone or a desktop, with no install, and you can use touch, keyboard or a controller.',
    links: () => [playLink, caseLink()],
  },
  {
    key: 'status',
    match: /\b(status|stage|alpha|beta|ready|finished|done|launch(ed|es|ing)?|release(d|s)?|available|out yet|coming out|when can|early access|demo|free trial|wait ?list|sign ?up)\b/,
    text: 'It’s playable today. Street Signal is a prototype that’s open now, so anyone can log in and skate it in a browser. There’s no launch date to wait for.',
    links: () => [playLink, caseLink('What’s built and what isn’t', '#ledger')],
  },
  {
    key: 'engine',
    match: /\b(unity|unreal|engines?|consoles?|xbox|playstation|ps5|nintendo|switch|steam)\b/,
    text: 'Right now it runs in a browser. The plan for later in 2027 is an engine move to Unity or Unreal for console and PC. Every map is built in one shared format, kept separate from its visual model, so the maps can move to a new engine.',
    links: () => [caseLink('See the roadmap', '#next'), caseLink('How the maps work', '#world')],
  },
  {
    key: 'roadmap',
    match: /\b(roadmap|future|next|later|plans?|upcoming|2027)\b/,
    text: 'Next up: proving that a stranger can land an ollie and lock a grind on a phone without instructions, holding frame rate on a mid-range phone, and taking one spot from scan to playable on camera. In April 2027 Caleb pitches it at Ann Arbor’s annual skateboarding art show. Later in 2027 the plan is an engine move to Unity or Unreal for console and PC.',
    links: () => [caseLink('See what’s next', '#next'), playLink],
  },
  {
    key: 'atlas',
    match: /\b(atlas|shops?|crews?|scene|who is out|drop ?in points?|night mode)\b/,
    text: 'Signal Atlas is the game’s map, and it’s a product on its own. It puts a whole skate scene in one place: spots, parks, shops and crews. Skate shops across Metro Detroit are marked verified or call first, and Ann Arbor has ten named drop-in points, from Liberty Plaza to the Diag. You can add a spot from the map and switch the whole thing to night.',
    links: () => [caseLink('See Signal Atlas', '#atlas'), playLink],
  },
  {
    key: 'scan',
    match: /\b(scan(s|ning|ned)?|lidar|photogrammetry|scaniverse|my (own )?(spot|park|city|street)|own spots?|add (a |my )?spots?|editors?|blender|model(ed|led|ing)?|trace|traced)\b/,
    text: 'A spot gets into the game one of three ways: scanned with a phone in the game, traced from a plan in the park editor, or modeled by hand (one street course was built in Blender from 27 photos). All three end in the same map format, with a fix layer you can edit in the game. The scan road works and isn’t optimized yet.',
    links: () => [caseLink('How spots are made', '#world'), playLink],
  },
  {
    key: 'world',
    match: /\b(cit(y|ies)|maps?|ann arbor|detroit|hart plaza|downtown|spots?|parks?|levels?|locations?|places?|streets?|where can i skate)\b/,
    text: 'You can skate two real downtowns today: Ann Arbor and Detroit’s Hart Plaza, each about a one-mile radius, built from USGS LiDAR and open map data. Pick a named drop-in point or tap anywhere on the map, and you’re standing on that street. There are also smaller individual spots on the spot list.',
    links: () => [caseLink('See the cities', '#world'), playLink],
  },
  {
    key: 'feel',
    match: /\b(tricks?|ollies?|grinds?|kickflips?|flips?|spins?|combos?|rails?|ledges?|stairs?|controls?|feel|physics|gameplay|score|scoring|goals?)\b/,
    text: 'Feel was measured before it was tuned. The game’s ollie peaks at 0.64 m, about twice a real one, on purpose, so a trick reads on a five-inch screen. On a phone your right thumb owns every pop: pull down and let go, and the deeper the pull, the higher the ollie. Every trick and combo is named on screen as you land it, with a running score and goals at each spot.',
    links: () => [caseLink('Try the touch idea', '#feel'), playLink],
  },
  {
    key: 'proof',
    match: /\b(tests?|testing|tested|proof|proven|unproven|evidence|metrics|results?|bugs?|honest|working|broken|playtests?)\b/,
    text: 'Every mechanic has an automated test. On the Ann Arbor street course, a scripted rider approaches each feature 49 times. Ledges are solved; round rails aren’t yet. The case study is upfront that tests prove the controls are consistent, not that the game feels good to anyone but its maker.',
    links: () => [caseLink('See the test results', '#tests'), caseLink('What’s built and what’s a thesis', '#ledger')],
  },
  {
    key: 'play',
    match: /\b(play|try|link|url|website|site|run|runs)\b/,
    text: 'Play it at streetsignalgame.com. It runs in a browser on a phone or a desktop, with no install, and you can use touch, keyboard or a controller.',
    links: () => [playLink, caseLink()],
  },
  {
    key: 'build',
    match: /\b(who (made|makes|built|builds|designed|is building)|built|build(ing)?|made|making|team|solo|alone|by himself|one person|ai|claude|agents?|studio|developer|dev|code|coding|tech|stack|three(\.?js)?|webgl|javascript|how long|fast)\b/,
    text: 'Caleb is building it himself in Ann Arbor. He carried the idea for a long time, and when he started building he directed AI the way a creative director runs a studio: specialist AI roles propose, build and check the work, and the calls stay with him. It’s a web game built with Three.js.',
    links: () => [caseLink('See the method', '#studio'), caseLink('See the pace', '#week')],
  },
  {
    key: 'taste',
    match: /\b(cut|cuts|rejected|decisions?|calls|look|style|art|colou?rs?|branding|dice|d20|changed|pivot(ed)?|mistakes?|failures?)\b/,
    text: 'The game got better every time the answer was no. A dice battle for settling spots was cut, and the highest score now holds the spot. The first three style directions came back flat and were dropped for the loud look that shipped: signal yellow, electric blue and black. An AI-built version of the Ann Arbor Skatepark was judged mostly incorrect, which led to two editors that snap a park to its evidence.',
    links: () => [caseLink('See the calls', '#no'), playLink],
  },
  {
    key: 'why',
    match: /\b(why|problem|gap|idea|vision|inspiration|inspired|purpose|point|who is it for|audience|for skaters)\b/,
    text: 'Every skate game ships somebody else’s city. Skaters already read architecture as terrain, the ledge behind the library and the three-stair at school, and no game lets you skate the place you actually skate. Street Signal’s idea: your city is the skatepark.',
    links: () => [caseLink('Read the gap', '#gap'), playLink],
  },
];

const overview = {
  key: 'overview',
  text: 'Street Signal is the skate game Caleb is building: it turns real streets and skate spots into playable maps, from a single ledge to a whole downtown. You can skate downtown Ann Arbor and Detroit’s Hart Plaza today, in a browser on a phone or a desktop. It’s his featured case study right now.',
  links: () => [caseLink(), playLink],
};

const unknown = {
  key: 'unknown',
  text: 'I don’t have a prepared answer for that part of Street Signal yet, and I’d rather not guess. The case study covers what’s built, what’s a prototype and what’s still a thesis. Caleb can answer the rest.',
  links: (p) => [caseLink(), link('Email Caleb', `mailto:${p.email}`)],
};

// Words that only name the game or ask for an overview. A question with nothing else in it gets the overview.
const filler = new Set(['a', 'an', 'and', 'about', 'are', 'can', 'caleb', 'calebs', 'do', 'does', 'explain', 'game', 'give', 'his', 'how', 'i', 'in', 'is', 'it', 'its', 'know', 'me', 'more', 'my', 'of', 'on', 'overview', 'please', 'quick', 'say', 'signal', 'skate', 'skateboarding', 'so', 'some', 'spotter', 'street', 'streetsignal', 'summary', 'tell', 'that', 'the', 'this', 'to', 'up', 'what', 'whats', 'you', 'your', 'describe', 'introduce', 's', 'work', 'works', 'all', 'everything', 'basics', 'new']);

const shape = (entry, portfolio) => ({ text: entry.text, links: entry.links(portfolio), topic: 'street-signal' });

// Answer a Street Signal question, or return null when nothing here fits (for follow-ups with no clear Street Signal hook).
export function answerStreetSignal(q, portfolio, { named = mentionsStreetSignal(q) } = {}) {
  // The game's own name says nothing about the question ("street" is not a question about streets).
  const asked = q.replace(/street ?signal|streetsignal|skate ?spotter/g, ' ');
  const hit = answers.find((a) => a.match.test(asked));
  if (hit) return shape(hit, portfolio);
  if (!named) return null;
  const rest = (q.match(/[a-z0-9]+/g) || []).filter((w) => !filler.has(w));
  return shape(rest.length ? unknown : overview, portfolio);
}

export const streetSignalUnknown = (portfolio) => shape(unknown, portfolio);
export const streetSignalOverview = (portfolio) => shape(overview, portfolio);
