import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://vpsmikewolf.duckdns.org',
  base: '/silicon-children',
  build: {
    format: 'directory',
  },
});
