import { fileURLToPath, URL } from 'node:url';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const src = (path: string) =>
  fileURLToPath(new URL(`./src/${path}`, import.meta.url));

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Module Federation: the shell is the host. Remotes are loaded at runtime
    // from their own servers; nothing of them is bundled into the shell.
    // (Skipped in unit tests, which replace remotes with a stub.)
    mode !== 'test' &&
      federation({
        name: 'shell',
        remotes: {
          demoReactA: {
            type: 'module',
            name: 'demoReactA',
            entry: 'http://localhost:4201/mf-manifest.json',
          },
        },
        shared: {
          react: { singleton: true, requiredVersion: '^19.3.1' },
          'react-dom': { singleton: true, requiredVersion: '^19.3.1' },
        },
        shareStrategy: 'loaded-first',
        dts: false,
      }),
  ],
  resolve: {
    // `@/…` points at this app's src folder (same mapping as tsconfig `paths`).
    alias: { '@': src('') },
  },
  // Fixed ports: shell 4200; remotes use 4201, 4202, 4203.
  server: { port: 4200, strictPort: true },
  preview: { port: 4200, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, target: 'esnext' },
  test: {
    environment: 'jsdom',
    alias: { 'demoReactA/App': src('test/RemoteStub.tsx') },
  },
}));
