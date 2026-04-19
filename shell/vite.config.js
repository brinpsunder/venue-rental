import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'shell',
      remotes: {
        venues: '/mfe/venues/assets/remoteEntry.js',
        reservations: '/mfe/reservations/assets/remoteEntry.js',
      },
      shared: ['react', 'react-dom', 'react-router-dom'],
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true, rewrite: (p) => p.replace(/^\/api/, '') },
      '/mfe/venues': { target: 'http://localhost:5001', changeOrigin: true, rewrite: (p) => p.replace(/^\/mfe\/venues/, '') },
      '/mfe/reservations': { target: 'http://localhost:5002', changeOrigin: true, rewrite: (p) => p.replace(/^\/mfe\/reservations/, '') },
    },
  },
  preview: {
    port: 5173,
  },
});
