import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';

export default defineConfig(({ mode }) => ({
  plugins: [
    tanstackStart({ server: { entry: 'server' } }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:3001', changeOrigin: true },
      '/health': { target: 'http://localhost:3001', changeOrigin: true },
      '/auth': { target: 'http://localhost:3001', changeOrigin: true },
    },
  },
  build: {
    target: 'esnext',
    minify: mode === 'production' ? 'esbuild' : false,
    sourcemap: mode !== 'production',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'vendor';
          }
          if (id.includes('@tanstack/')) {
            return 'tanstack';
          }
          if (id.includes('@radix-ui/')) {
            return 'ui';
          }
        },
      },
    },
  },
  preview: {
    port: 5173,
    host: '0.0.0.0',
  },
}));
