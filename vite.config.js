import { defineConfig } from 'vite';

/** @type import('vite').UserConfig */
export default defineConfig({
  build: {
    sourcemap: true,
    emptyOutDir: false,
    lib: { entry: './src/index.ts' },
    rollupOptions: {
      external: ['@nerimity/i18lite', 'solid-js', 'solid-js/web', 'html-parse-string'],
    },
  },
});
