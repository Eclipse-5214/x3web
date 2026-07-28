import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// GitHub Pages serves project sites from /<repo>/, not the root — set BASE_PATH
// in CI for that. Left unset (default '/'), which is also correct for a
// custom-domain deployment later (e.g. x3.stellarskys.co), so switching to
// one just means not setting this env var, no config changes needed.
const base = process.env.BASE_PATH || '/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [
    svelte(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'X3 Web',
        short_name: 'X3 Web',
        description: 'Unofficial WebHID configurator for the Attack Shark X3 gaming mouse.',
        theme_color: '#2563eb',
        background_color: '#fafafa',
        display: 'standalone',
        // Relative rather than absolute, so these resolve correctly whether
        // served from a Pages subpath or a custom domain's root.
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
})
