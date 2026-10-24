import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/static/frontend/' : '/',
  server: { proxy: { '/api': 'http://127.0.0.1:8000', '/admin': 'http://127.0.0.1:8000', '/static': 'http://127.0.0.1:8000', '/media': 'http://127.0.0.1:8000' } },
  build: {
    outDir: fileURLToPath(new URL('../static/frontend', import.meta.url)),
    emptyOutDir: true,
    manifest: true,
    rollupOptions: { input: fileURLToPath(new URL('./src/main.jsx', import.meta.url)) },
  },
  test: { include: ['src/tests/**/*.test.{js,jsx}'], environment: 'jsdom', setupFiles: ['./src/tests/setup.js'] },
}));
