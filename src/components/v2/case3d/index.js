import { createPlayer, webglOK } from './engine.js';
import { A } from './scenes_a.js';
import { B } from './scenes_b.js';
import { V } from './scenes_v2.js';
import { V3 } from './scenes_v3.js';
import { V4 } from './scenes_v4.js';
// The platform: every case opens on the question under the brief and ends on the fact that answers it.
const Q = {
  'basf-agriculture-customer-portal': 'Who bought what?',
  'general-motors-global-design-system': 'Same company. Why three different buttons?',
  'general-motors-onstar-shopping-pages-and-cart': 'What can I actually buy here?',
  'gm-lab313-mycardrive': 'Who am I really talking to?',
  'mrm-ux-team-ux-jam-sessions': 'Who builds the team?',
  'gm-lab313-test-drive-myway': 'What if the test drive came to me?',
  'mrm-agent-relationship-management': 'What if the customer is an AI?',
  'stella-alert-rework': 'Which one first?',
  'valero-digital-ecosystem-audit': 'What is this website for?',
};
export const scenes = { ...A, ...B };
for (const k of Object.keys(Q)) scenes[k].question = Q[k];
for (const k of Object.keys(V)) scenes[k] = V[k];
for (const k of Object.keys(V3)) scenes[k] = V3[k];
for (const k of Object.keys(V4)) scenes[k] = V4[k];
export { createPlayer, webglOK };
