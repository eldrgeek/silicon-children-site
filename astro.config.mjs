import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://siliconchildren.com',
  integrations: [sitemap()],
  build: {
    format: 'directory',
  },
});
