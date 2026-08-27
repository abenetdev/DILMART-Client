/**
 * DilMart Service Worker — Step 1 Foundation
 *
 * PURPOSE:
 *   Establish the minimal PWA service-worker architecture so the app is
 *   browser-installable. No aggressive caching. No push notifications.
 *   No background sync. Those are deferred to later steps.
 *
 * CACHING STRATEGY:
 *   - Precache: Vite-injected static shell assets only (JS, CSS, HTML).
 *               Managed automatically by vite-plugin-pwa / Workbox.
 *   - Runtime:  All navigation requests → network first, fallback to
 *               precached shell. This keeps the SPA router working offline
 *               (blank tab → shell loads → React Router renders).
 *   - API calls: NEVER cached. All requests to /api/* go straight to the
 *               network. Dynamic marketplace data (products, prices, stock,
 *               orders, user info, vendor info) must always be fresh.
 *
 * EXPLICITLY NOT CACHED (security):
 *   - /api/auth/*  — authentication tokens and session data
 *   - /api/users/* — personal user information
 *   - /api/orders  — order details and payment information
 *   - Any response containing Authorization headers
 *
 * SOCKET.IO:
 *   WebSocket upgrade requests (ws://, wss://) are never intercepted by
 *   service workers — the browser handles them natively. No special
 *   exclusion is required, but noted here for clarity.
 */

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute } from "workbox-routing";
import { NetworkFirst, NetworkOnly } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";

// ── 1. Precache static shell assets ────────────────────────────────────────
// self.__WB_MANIFEST is replaced at build time by vite-plugin-pwa with the
// list of versioned static assets (index.html, main-[hash].js, etc.).
precacheAndRoute(self.__WB_MANIFEST || []);

// Remove stale precache entries from previous SW versions
cleanupOutdatedCaches();

// ── 2. Never cache API requests ─────────────────────────────────────────────
// All /api/* requests always go to the network. If the network fails, the
// error propagates naturally to the React error handlers — we do NOT serve
// stale data for marketplace content, auth, orders, or user information.
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly()
);

// ── 3. Navigation fallback (SPA support) ────────────────────────────────────
// For navigate requests (typing a URL, refreshing, opening a new tab):
//   - Try the network first (gets the latest index.html in production)
//   - On failure, fall back to the precached index.html so the SPA shell
//     loads and React Router can render the correct route
// Admin and vendor dashboards are internal tools; they also benefit from
// the SPA fallback (they just won't have offline functionality, which is fine).
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: "dilmart-navigation",
      networkTimeoutSeconds: 3,
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
      ],
    })
  )
);

// ── 4. Static asset runtime caching ─────────────────────────────────────────
// Fonts loaded from Google Fonts CDN are fine to cache (they are immutable).
// Everything else (images, API responses) is not cached at this stage.
// Font caching will be added in a later step if needed.

// ── 5. Lifecycle — skip waiting & claim clients ──────────────────────────────
// When a new SW version is ready, take control immediately on next navigation.
// This avoids users being stuck on a stale shell across tabs.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
