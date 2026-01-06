import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: 'frontend',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  base: './', // Use relative paths for file:// protocol compatibility
  resolve: {
    alias: {
      '@': resolve(__dirname, 'frontend/src'),
    },
  },
});

