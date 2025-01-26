// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';

export default defineConfig({
  plugins: [react()],

  // Make sure these two sections are included:
  optimizeDeps: {
    esbuildOptions: {
      // Enable esbuild polyfill plugins
      define: {
        global: 'globalThis', // or 'window'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true,
        }),
      ],
    },
  },

  build: {
    rollupOptions: {
      plugins: [
        // Enable rollup polyfills plugin
        // used during production bundling
        NodeModulesPolyfillPlugin(),
      ],
    },
  },
});
