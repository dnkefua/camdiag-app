import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';

const removeLocalReviewNotes = () => ({
  name: 'remove-local-review-notes',
  closeBundle() {
    fs.rmSync(path.resolve(__dirname, 'dist/Recommendations.md'), { force: true });
  },
});

export default defineConfig({
  plugins: [react(), removeLocalReviewNotes()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('firebase/')) return 'firebase';
          if (id.includes('@google/generative-ai')) return 'google-ai';
          if (id.includes('react-dom') || (id.includes('react/') && !id.includes('react-router'))) return 'react-vendor';
          if (id.includes('react-router')) return 'router';
          if (id.includes('framer-motion')) return 'motion';
          if (id.includes('zustand')) return 'zustand';
        },
      },
    },
    chunkSizeWarningLimit: 250,
  },
});
