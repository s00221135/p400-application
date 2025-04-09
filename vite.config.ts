import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // Uncomment this if you want to see the service worker in development
      // devOptions: { enabled: true },
      manifest: {
        name: 'Flatchat Household Management',
        short_name: 'Flatchat',
        start_url: '/index.html',
        scope: '/',
        display: 'standalone',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        icons: [
          {
            src: '/flatchat_logo.PNG',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/flatchat_logo.PNG',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        // Precache files and define runtime caching for navigations.
        runtimeCaching: [
          {
            urlPattern: /^https?.*\/index\.html$/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'html-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 86400 // Cache for 1 day.
              }
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true
      }
    })
  ],
  optimizeDeps: {
    include: ['aws-amplify'],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      },
      plugins: [
        NodeGlobalsPolyfillPlugin({
          process: true,
          buffer: true
        })
      ]
    }
  },
  build: {
    rollupOptions: {
      plugins: [NodeModulesPolyfillPlugin()]
    }
  }
});
