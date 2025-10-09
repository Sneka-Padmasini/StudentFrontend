import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/', // ✅ Use '/' instead of './' to avoid routing issues on Render
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/send-email': 'http://localhost:5000', // ✅ Works only in local dev
      '/api': 'http://localhost:5000' // ✅ for OpenAI/AI chat endpoint
    },
  },
  build: {
    outDir: 'dist', // ✅ Ensure Vite outputs to 'dist'
    chunkSizeWarningLimit: 1000
  }
});
