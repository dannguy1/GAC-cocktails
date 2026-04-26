import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  server: {
    host: true,
    strictPort: true
  },
  preview: {
    host: true,
    strictPort: true
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'GAC Bartender',
        short_name: 'GAC Bar',
        description: 'Cocktail recipe assistant for Garlic & Chives bartenders',
        start_url: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#0f0a06',
        theme_color: '#c6893f',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,jpg,png,webp,svg}']
      }
    })
  ]
});
