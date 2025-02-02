import { defineConfig } from 'vite';

/** @type {import('vite').UserConfig} */
export default defineConfig({
  build: {
    minify: true,
    sourcemap: true,
    lib: {
      name: 'lib',
      entry: '/index.ts',
      formats: ['es', 'cjs'],
    },
  },
});
