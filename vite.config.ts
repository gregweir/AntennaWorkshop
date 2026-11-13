/// <reference types="vitest/config" />

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */


import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/antennas/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'antenna-mark.svg', 'TartanleafLogo.jpg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'RadioBook Antenna Workshop',
        short_name: 'Antenna Workshop',
        description: 'A practical antenna design and RF exposure workbench.',
        theme_color: '#173847',
        background_color: '#F4EFE5',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          {
            src: 'pwa-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true
      }
    })
  ],
  server: {
    host: '0.0.0.0',
    port: 5174,
    strictPort: true
  },
  preview: {
    host: '0.0.0.0',
    port: 4174,
    strictPort: true
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
