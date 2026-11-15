import { defineConfig } from 'vitest/config';

// Plain types and constants: no browser needed.
export default defineConfig({ test: { environment: 'node' } });
