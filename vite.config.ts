import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // Correct asset paths when hosted as a GitHub Pages project site.
  base: '/Wellness-care-connect/',
  plugins: [react()],
  server: { host: '0.0.0.0' },
});
