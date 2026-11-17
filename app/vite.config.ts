import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Tauri drives this dev server, so the port is fixed and the terminal is not
// cleared out from under the Rust logs.
export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: { ignored: ['**/src-tauri/**'] },
  },
});
