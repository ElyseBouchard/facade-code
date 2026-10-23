import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {resolve} from 'node:path';

// Two pages: the home page (footage, then the first site's sections) and the about page.
export default defineConfig({
  plugins: [react()],
  build: {rollupOptions: {input: {main: resolve(import.meta.dirname, 'index.html'), about: resolve(import.meta.dirname, 'about/index.html')}}},
});
