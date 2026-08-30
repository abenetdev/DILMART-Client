/**
 * DilMart Service Worker — PWA Foundation
 *
 * Handles:
 *   A. Static shell precaching (vite-plugin-pwa injectManifest)
 *   B. API NetworkOnly — marketplace data is never cached
 *   C. SPA navigation fallback — NetworkFirst with precached shell fallback
 *
 * Caching strategy:
 *   - self.__WB_MANIFEST entries (JS/CSS/HTML) → precached at install time
 *   - /api/*                                   → NetworkOnly (always fresh)
 *   - Navigation requests                      → NetworkFirst (3 s timeout)
 */

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute }           from "workbox-routing";
import { NetworkFirst, NetworkOnly }                from "workbox-strategies";
import { CacheableResponsePlugin }                  from "workbox-cacheable-response";

// ── 1. Precache static shell assets ───────────────────────────────────────
// self.__WB_MANIFEST is replaced at build time by vite-plugin-pwa with the
// list of versioned static assets (index.html, main-[hash].js, etc.).
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ── 2. Never cache API requests ───────────────────────────────────────────
// All marketplace data (products, orders, prices, stock, user info) must
// always come from the network to avoid serving stale content.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly()
);

// ── 3. SPA navigation fallback ────────────────────────────────────────────
// For navigate requests: try the network first so the latest index.html is
// served, fall back to the precached shell so React Router can still render
// the correct route when the user is offline.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName:             "dilmart-navigation",
      networkTimeoutSeconds: 3,
      plugins: [new CacheableResponsePlugin({ statuses: [200] })],
    })
  )
);

// ── 4. Lifecycle ──────────────────────────────────────────────────────────
// Activate the new SW immediately on install so updated precache entries
// are used on the next navigation without requiring a full browser restart.
self.addEventListener("install",  ()      => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
