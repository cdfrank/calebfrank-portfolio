import { createPlayer, webglOK } from './engine.js';
import { A } from './scenes_a.js';
import { B } from './scenes_b.js';
export const scenes = { ...A, ...B };
export { createPlayer, webglOK };
