import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
        // AdSense script'lerini cache'leme
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/pagead2\.googlesyndication\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'adsense-cache',
              expiration: {
                maxEntries: 0,
                maxAgeSeconds: 0
              }
            }
          },
          {
            urlPattern: /^https:\/\/www\.googletagservices\.com\/.*/i,
            handler: 'NetworkOnly',
            options: {
              cacheName: 'adsense-cache',
              expiration: {
                maxEntries: 0,
                maxAgeSeconds: 0
              }
            }
          }
        ]
      },
      manifest: {
        name: 'ByteSync Editor',
        short_name: 'ByteSync',
        description: 'A powerful byte editor for ASCII, Hex, Decimal, and Binary formats',
        theme_color: '#3b82f6',
        icons: [
          {
            src: 'AppIcon.iconset/icon_128x128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: 'AppIcon.iconset/icon_256x256.png',
            sizes: '256x256',
            type: 'image/png'
          },
          {
            src: 'AppIcon.iconset/icon_512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: './index.html'
      }
    }
  },
  publicDir: 'public',
  base: './', // Relative paths for assets
  server: {
    // Dev server kullanılmayacak ama yine de tanımlı olsun
    port: 3000,
    open: false
  },
  preview: {
    port: 5500,
    open: false
  }
});

