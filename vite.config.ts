import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/postcss';
import react from '@vitejs/plugin-react';
import site from './site.config.json';
import { defineConfig } from 'vite';
export default defineConfig({
  base: new URL(site.url).pathname,
  resolve: { alias: { '@': fileURLToPath(new URL('.', import.meta.url)) } },
  css: { postcss: { plugins: [tailwindcss()] } },
  plugins: [react(), {
    name: 'workshop-metadata',
    transformIndexHtml(html) {
      return html.replaceAll('__SITE_URL__', site.url).replaceAll('__SITE_BASE__', new URL(site.url).pathname);
    },
  }],
});
