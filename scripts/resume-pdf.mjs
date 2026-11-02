// Builds the site, prints /resume/ with Chrome, and saves the PDF that the Resume page links to.
// Set CHROME to the browser's path if it isn't in the usual macOS location.
import { execFileSync, spawn } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const chrome = process.env.CHROME ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const astro = resolve('node_modules/.bin/astro');
const port = 4329;
const out = resolve('public/caleb-frank-resume.pdf');

execFileSync(astro, ['build'], { stdio: 'inherit' });
const server = spawn(astro, ['preview', '--port', String(port)], { stdio: 'ignore' });

try {
  const url = `http://localhost:${port}/resume/`;
  for (let i = 0; i < 40; i++) {
    const up = await fetch(url).then((r) => r.ok, () => false);
    if (up) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  execFileSync(chrome, ['--headless=new', '--disable-gpu', '--no-pdf-header-footer', `--print-to-pdf=${out}`, url], { stdio: 'ignore' });
  copyFileSync(out, resolve('dist/caleb-frank-resume.pdf'));
  console.log(`Saved ${out}`);
} finally {
  server.kill();
}
