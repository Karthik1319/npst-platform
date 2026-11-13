import { defineConfig } from 'vitest/config';

// jsdom provides `window`, which the event bus uses.
export default defineConfig({ test: { environment: 'jsdom' } });
