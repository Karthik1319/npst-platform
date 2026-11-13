import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    // `@/…` points at this app's src folder (same mapping as tsconfig `paths`).
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // Fixed ports: shell 4200; remotes will use 4201, 4202, 4203.
  server: { port: 4200, strictPort: true },
  preview: { port: 4200, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true },
  test: { environment: 'jsdom' },
});
