import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    fs: {
      allow: ['..']
    }
  },
  optimizeDeps: {
    exclude: ['./pkg/shadersmith.js']
  }
});
