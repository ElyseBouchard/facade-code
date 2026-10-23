import {defineConfig} from 'vite';
import {resolve} from 'node:path';

// Two pages: the index and the about page.
export default defineConfig({
  build: {rollupOptions: {input: {main: resolve(import.meta.dirname, 'index.html'), about: resolve(import.meta.dirname, 'about/index.html')}}},
});
