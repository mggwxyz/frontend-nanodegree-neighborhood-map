import {defineConfig} from 'vite';
import {resolve} from 'path';

export default defineConfig({
  base: '/frontend-nanodegree-neighborhood-map/',
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/index.html')
      }
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern-compiler'
      }
    }
  },
  server: {
    port: 8080,
    open: true
  },
  preview: {
    port: 4173,
    open: true
  }
});
