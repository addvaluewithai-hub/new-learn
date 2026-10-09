import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  build: {
    outDir: fileURLToPath(new URL('./dist', import.meta.url)),
    lib: {
      entry: {
        index: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
        core: fileURLToPath(new URL('./src/core.ts', import.meta.url)),
      },
      formats: ['es'],
      fileName: (_format, name) => `${name}.js`,
      cssFileName: 'style',
    },
    rolldownOptions: {
      external: (id) => /^(react|react-dom|remotion|@remotion\/player)(\/|$)/.test(id),
    },
  },
});
