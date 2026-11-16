import { defineConfig } from 'vitest/config';

// Runs in Node: the store falls back to memory when there is no localStorage.
export default defineConfig({ test: { environment: 'node' } });
