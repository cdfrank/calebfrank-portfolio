import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://calebfrank.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  // The old Street Signal stub lived at this address; send it to the capstone.
  redirects: { '/work/self-initiated-scan-skate-and-skatego/': '/work/street-signal/' },
  integrations: [react()],
});
