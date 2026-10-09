import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  plugins: [react()],
  resolve: { dedupe: ['react', 'react-dom', 'remotion', '@remotion/player'] },
  server: { host: '0.0.0.0', port: 5173, strictPort: true },
  build: { outDir: '../../dist', emptyOutDir: true, target: 'es2022' },
});
