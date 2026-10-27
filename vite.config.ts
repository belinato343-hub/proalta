import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), VitePWA({
    strategies: "generateSW",
    filename: "sw.js",
    registerType: "autoUpdate",
    injectRegister: null,
    manifest: false,
    devOptions: { enabled: false },
    includeAssets: ["manifest.json", "icons/*.png", "offline.html"],
    workbox: {
      globPatterns: ["**/*.{js,css,png,jpg,svg,woff,woff2}"],
      navigateFallback: null,
      cleanupOutdatedCaches: true,
      runtimeCaching: [
        {
          urlPattern: ({ request, url }) => request.mode === "navigate" && url.origin === self.location.origin && !/^\/~oauth(?:\/|$)/.test(url.pathname),
          handler: "NetworkFirst",
          options: {
            cacheName: "proalta-pages",
            networkTimeoutSeconds: 5,
            cacheableResponse: { statuses: [200] },
            expiration: { maxEntries: 40, maxAgeSeconds: 60 * 60 * 24 * 7 },
            precacheFallback: { fallbackURL: "/offline.html" },
          },
        },
        {
          urlPattern: ({ url }) => url.origin === self.location.origin && /^\/assets\/.+-[A-Za-z0-9_-]{8,}\.(js|css|png|jpg|svg|woff2?)$/.test(url.pathname),
          handler: "CacheFirst",
          options: { cacheName: "proalta-assets", expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 } },
        },
      ],
    },
  })].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
