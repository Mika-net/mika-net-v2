// @ts-check
import { defineConfig, sharpImageService } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// FE-02 — see docs/requirements/03-frontend.md
export default defineConfig({
  site: process.env.SITE_URL ?? 'https://mika-net.io',
  trailingSlash: 'always',
  build: {
    format: 'directory',
    inlineStylesheets: 'auto',
  },
  integrations: [
    mdx(),
    sitemap({
      filter: (page) => !page.includes('/404') && !page.includes('/og/'),
    }),
  ],
  markdown: {
    shikiConfig: {
      themes: { light: 'github-light', dark: 'tokyo-night' },
      defaultColor: false,
    },
  },
  image: {
    service: sharpImageService(),
  },
});
