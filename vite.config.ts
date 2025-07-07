import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'url';

export default defineConfig({
  plugins: [react()],
  root: './src/renderer',
  base: './',
  build: {
    outDir: '../../dist/renderer',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../', import.meta.url)),
      '@components': fileURLToPath(new URL('../renderer/components', import.meta.url)),
      '@utils': fileURLToPath(new URL('../renderer/utils', import.meta.url)),
      '@types': fileURLToPath(new URL('../types', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
  },
});