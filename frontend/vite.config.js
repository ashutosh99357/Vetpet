import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': '"production"'
  },
  build: {
    lib: {
      entry: 'src/sdk-entry.jsx',
      name: 'VetChatbot',
      fileName: (format) => `chatbot.${format}.js`,
      formats: ['umd']
    },
    rollupOptions: {
      // Bundle everything including React for true plug-and-play
      external: [],
    },
    cssCodeSplit: false,
    minify: true,
  }
});
