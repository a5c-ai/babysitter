import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  resolve: {
    alias: {
      'react-native': 'react-native-web',
    },
  },
});
