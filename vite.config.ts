import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

// `base: './'` keeps the production build portable: dist/ can be opened from any
// static host (or a sub-path) because routing is hash-based.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // Vendor code changes rarely; keeping it in its own chunks keeps app updates small.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router'],
          ui: ['@heroui/react', 'react-aria-components'],
          motion: ['motion'],
        },
      },
    },
    chunkSizeWarningLimit: 900,
  },
  server: { port: 4173, host: true },
  preview: { port: 4173 },
});
