import { fileURLToPath, URL } from 'node:url';
import { federation } from '@module-federation/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const PORT = 4201;

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Module Federation: this app is a remote. The shell loads `./App` at runtime.
    // (Skipped in unit tests, which render the component directly.)
    mode !== 'test' &&
      federation({
        name: 'demoReactA',
        filename: 'remoteEntry.js',
        manifest: true,
        exposes: {
          './App': './src/App.tsx',
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
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  // `origin` makes asset URLs absolute, so they load from this server
  // even when the code runs inside the shell (another origin).
  server: { port: PORT, strictPort: true, origin: `http://localhost:${PORT}` },
  preview: { port: PORT, strictPort: true },
  build: { outDir: 'dist', emptyOutDir: true, target: 'esnext' },
  test: { environment: 'jsdom' },
}));
