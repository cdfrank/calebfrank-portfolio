import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://calebfrank.com',
  trailingSlash: 'ignore',
  build: { format: 'directory' },
});
