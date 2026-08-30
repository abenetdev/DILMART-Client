import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),

    // ── DilMart PWA Foundation (Step 1) ─────────────────────────────────────
    // Uses "injectManifest" strategy so we keep full control over sw.js.
    // vite-plugin-pwa will:
    //   1. Read src/sw.js
    //   2. Replace self.__WB_MANIFEST with the versioned asset list
    //   3. Output the final sw.js to dist/
    // ────────────────────────────────────────────────────────────────────────
    VitePWA({
      // "injectManifest" = we author the SW ourselves; plugin only injects
      // the precache manifest into it. This gives us maximum control and
      // ensures we never accidentally enable features we didn't intend to.
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",

      // The compiled SW goes to the root of the build output so it can claim
      // the widest possible scope ("/").
      outDir: "dist",

      // Register the SW automatically in production builds.
      // In development (vite dev), the SW is enabled with type:"module" so
      // that the service worker is available for PWA offline caching and
      // the app shell is precacheable. This is safe because:
      //   - self.__WB_MANIFEST is [] in dev (nothing is precached)
      //   - Navigation stays NetworkFirst (always hits the dev server first)
      //   - API requests stay NetworkOnly (never cached)
      // No stale-cache risk exists in this configuration.
      registerType: "autoUpdate",
      devOptions: {
        enabled: true,
        type: "module",   // required — sw.js uses ES module imports (workbox-*)
      },

      // The manifest is embedded inside the built app by the plugin.
      // We also have a public/manifest.webmanifest for direct browser access.
      manifest: {
        name: "DilMart",
        short_name: "DilMart",
        description:
          "DilMart — Ethiopia's online marketplace. Shop thousands of products from verified vendors, track orders, and enjoy fast, secure delivery.",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "portrait",
        theme_color: "#0D9388",
        background_color: "#0D9388",
        categories: ["shopping", "lifestyle"],
        lang: "en",
        icons: [
          {
            src: "/icons/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/icons/icon-maskable-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/icons/apple-touch-icon.png",
            sizes: "180x180",
            type: "image/png",
            purpose: "any",
          },
        ],
      },

      // Workbox config passed to injectManifest mode.
      // We only configure the precache here; all runtime caching logic lives
      // in src/sw.js where it is explicit and reviewable.
      workbox: {
        // Only precache the app shell: JS chunks, CSS, and the root HTML.
        // Do NOT precache images, fonts, or API responses.
        globPatterns: ["**/*.{js,css,html}"],

        // Exclude admin and vendor asset chunks from precache if desired —
        // they are still served from the network which is fine for dashboards.
        // (Leave empty for now; all JS/CSS is part of the single-page shell.)
        globIgnores: [],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
