import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';
import { createThemeEndpoint } from './theme-endpoint.mjs';

/** Where published themes are stored (not in git; see .gitignore). */
const PUBLISHED = fileURLToPath(new URL('./published', import.meta.url));

/**
 * Simulated brand server on http://localhost:4204:
 * - `public/theme.css`: the portal theme (Step 9);
 * - `/themes/…`: themes published from the Branding module (Step 23,
 *   `theme-endpoint.mjs`).
 * In the real setup this is the branding module's API and static hosting.
 */
const publishEndpoint = {
  name: 'npst-theme-publish',
  configureServer(server) {
    server.middlewares.use(createThemeEndpoint(PUBLISHED));
  },
};

export default defineConfig({
  plugins: [publishEndpoint],
  server: {
    port: 4204,
    strictPort: true,
    // Let browsers re-check the theme on every load, so a change shows at once.
    headers: { 'Cache-Control': 'no-cache' },
  },
  test: { environment: 'node' },
});
