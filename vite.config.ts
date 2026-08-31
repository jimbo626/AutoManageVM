import { defineConfig } from 'vite';

export default defineConfig({
  root: './src', // Tells Vite that index.html is located in src/
  build: {
    outDir: '../dist', // Places the built assets into AutoManageVM/dist
    emptyOutDir: true,
  },
});