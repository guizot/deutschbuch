// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output is Astro's default. We make it explicit.
// The site is fully static so it can be served by any file server
// (python3 -m http.server, nginx, ...) with minimal RAM on the RPi5.
export default defineConfig({
  output: 'static',
  site: 'http://localhost:3008',
  server: { port: 3008, host: true },
  devToolbar: { enabled: false },
  vite: {
    plugins: [tailwindcss()],
  },
});
