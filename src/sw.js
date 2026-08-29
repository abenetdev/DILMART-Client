/**
 * DilMart Service Worker
 *
 * Combines:
 *   A. PWA foundation  — static shell precache, navigation fallback, API NetworkOnly
 *   B. FCM messaging   — background push receipt, notificationclick deep-link,
 *                        foreground duplicate prevention
 *
 * ── FCM background message flow ────────────────────────────────────────────
 *  1. FCM delivers a "push" event to this SW when the app is closed / in the
 *     background.
 *  2. The SW checks whether the DilMart vendor dashboard is currently open and
 *     visible in any client window.
 *  3. If the vendor dashboard IS open and visible → skip showing a system
 *     notification (the existing Socket.IO in-app notification handles it).
 *  4. If the vendor dashboard is NOT open/visible → show a system notification.
 *  5. When the vendor taps the notification, notificationclick opens/focuses
 *     the vendor order detail page using the orderId from the FCM data payload.
 *
 * ── Foreground duplicate-prevention logic ──────────────────────────────────
 *  "Visible" means: at least one client window whose URL contains "/vendor"
 *  AND whose visibilityState is "visible".
 *  If that condition is met we skip the system notification entirely because
 *  the existing Socket.IO path already shows the in-app bell notification.
 *
 * ── Security ────────────────────────────────────────────────────────────────
 *  - The FCM data payload contains only: type, orderId, vendorOrderId, url.
 *  - No auth tokens, customer data, or payment info is ever in the payload.
 *  - The vendor order page loads fresh data through the authenticated API.
 *  - Deep-link navigation requires the vendor to pass normal auth — the SW
 *    only redirects the browser; auth enforcement is in the React app.
 *
 * ── Caching (unchanged from Step 1) ─────────────────────────────────────────
 *  - Static shell precached by vite-plugin-pwa (self.__WB_MANIFEST)
 *  - /api/* → NetworkOnly (never cached)
 *  - Navigation → NetworkFirst (3s timeout) → precached shell fallback
 */

import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";
import { registerRoute, NavigationRoute }           from "workbox-routing";
import { NetworkFirst, NetworkOnly }                from "workbox-strategies";
import { CacheableResponsePlugin }                  from "workbox-cacheable-response";

// ── A. PWA FOUNDATION ──────────────────────────────────────────────────────

// 1. Precache static shell assets (list injected by vite-plugin-pwa at build)
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// 2. Never cache API requests — all marketplace data must always be fresh
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkOnly()
);

// 3. SPA navigation fallback
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName:             "dilmart-navigation",
      networkTimeoutSeconds: 3,
      plugins: [new CacheableResponsePlugin({ statuses: [200] })],
    })
  )
);

// 4. Lifecycle — activate immediately so new SW versions take effect on next nav
self.addEventListener("install",  ()      => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

// ── B. FCM MESSAGING ───────────────────────────────────────────────────────

/**
 * push event — fired by FCM when a new order notification is delivered.
 *
 * Strategy: ALWAYS show the system notification from the SW.
 * The page-level Socket.IO notification (in-app bell) fires independently.
 * Duplicate suppression is handled by the React app via onMessage() — when
 * the app is in the foreground, onMessage() fires and we can suppress the
 * system popup there. The SW should not try to query client visibility because
 * WindowClient.focused is unreliable across browsers and the check causes
 * notifications to be silently dropped.
 *
 * Data payload format (data-only message from fcmService.js):
 *   data.title, data.body, data.orderId, data.vendorOrderId, data.url, data.type
 */
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch {
    return;
  }

  // Fields live in payload.data (data-only) or payload.notification (notification msg).
  // fcmService.js sends BOTH so we have a fallback either way.
  const data   = payload.data         || {};
  const notif  = payload.notification || {};

  const title         = data.title         || notif.title || "\uD83C\uDF89 New Order Received";
  const body          = data.body          || notif.body  || "You have a new order waiting for confirmation.";
  const orderId       = data.orderId       || (notif.data && notif.data.orderId)       || "";
  const vendorOrderId = data.vendorOrderId || (notif.data && notif.data.vendorOrderId) || "";
  const targetUrl     = data.url           || (notif.data && notif.data.url)           ||
                        (orderId ? `/vendor/orders/${orderId}` : "/vendor/orders");

  const NOTIF_ICON = "/icons/notification.jpg";
  const BADGE_ICON = "/icons/icon-192x192.png";
  const TAG        = `new-order-${orderId || Date.now()}`;

  event.waitUntil(
    (async () => {
      // ── Duplicate guard ───────────────────────────────────────────────────
      // When webpush.notification is present in the FCM payload, Chrome may
      // have already displayed the notification before this push event fires
      // (this happens when the app is closed — the OS shows it directly).
      // Check existing notifications with the same tag; if one is already
      // shown, skip creating a duplicate.
      const existing = await self.registration.getNotifications({ tag: TAG });
      if (existing.length > 0) {
        // Notification already displayed by the browser natively — nothing to do.
        return;
      }

      // ── Show the DilMart-branded notification ─────────────────────────────
      await self.registration.showNotification(title, {
        body,
        icon:               NOTIF_ICON,
        badge:              BADGE_ICON,
        image:              NOTIF_ICON,
        tag:                TAG,
        requireInteraction: true,
        vibrate:            [200, 100, 200],
        data: {
          url:          targetUrl,
          orderId,
          vendorOrderId,
          type:         data.type || "NEW_ORDER",
        },
      });
    })()
  );
});

/**
 * notificationclick — fired when the vendor taps a DilMart system notification.
 *
 * Behaviour:
 *  1. Close the notification immediately.
 *  2. If a vendor dashboard tab is already open → focus it and navigate.
 *  3. If no tab is open → open a new tab at the order detail URL.
 *
 * The vendor must still authenticate normally — we only navigate the browser.
 * Authorization is enforced by the React app's CheckAuth component.
 */
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  // Data may come from either:
  //  • notification.data — when the browser showed it natively (app closed)
  //  • notification.data — when the SW showed it (app backgrounded)
  // Both paths store the same fields under notification.data because we set
  // data: { url, orderId, vendorOrderId, type } in both webpush.notification.data
  // and in the showNotification() call above.
  const notifData = event.notification.data || {};
  const url       = notifData.url;
  const orderId   = notifData.orderId;

  const rawUrl    = url || (orderId ? `/vendor/orders/${orderId}` : "/vendor/orders");
  const origin    = self.registration.scope.replace(/\/$/, "");
  const targetUrl = rawUrl.startsWith("http") ? rawUrl : `${origin}${rawUrl}`;

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type:                "window",
        includeUncontrolled: false,
      });

      // Look for an existing vendor dashboard tab to reuse
      const vendorTab = allClients.find((c) => c.url.includes("/vendor"));

      if (vendorTab) {
        // Focus the existing tab and navigate it to the order
        await vendorTab.focus();
        await vendorTab.navigate(targetUrl);
      } else {
        // No existing tab — open a new one
        await self.clients.openWindow(targetUrl);
      }
    })()
  );
});
