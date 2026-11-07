import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  site: 'https://calebfrank.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
  integrations: [react()],
});
