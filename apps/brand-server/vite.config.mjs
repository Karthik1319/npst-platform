import { defineConfig } from 'vitest/config';

/**
 * Simulated brand server: serves only `public/theme.css` at
 * http://localhost:4204/theme.css. It has no app code and no build; in the
 * real setup this is the branding module's static hosting.
 */
export default defineConfig({
  server: {
    port: 4204,
    strictPort: true,
    // Let browsers re-check the theme on every load, so a change shows at once.
    headers: { 'Cache-Control': 'no-cache' },
  },
  test: { environment: 'node' },
});
