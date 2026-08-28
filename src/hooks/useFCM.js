/**
 * useFCM — Vendor FCM push-notification registration hook
 *
 * Responsibilities:
 *  1. Check whether FCM is supported in the current browser.
 *  2. Query the backend to see if this vendor already has an active token
 *     on page load (so the UI reflects the correct state without re-prompting).
 *  3. On enable: request Notification permission → get FCM token → POST to
 *     backend.
 *  4. On disable: DELETE token from backend → mark local state as disabled.
 *  5. Expose loading/error state so the UI can show appropriate feedback.
 *
 * This hook is ONLY for vendors. It must never be mounted for customers or
 * admin users — the useFCM() caller is responsible for that guard.
 *
 * The hook does NOT manage push message receipt; that is handled entirely
 * inside the service worker (sw.js).
 */

import { useState, useEffect, useCallback } from "react";
import { getToken, onMessage }               from "firebase/messaging";
import { getMessagingInstance, VAPID_KEY }   from "@/config/firebase";
import axios                                 from "@/lib/axios";

const BACKEND_URL = "/api/vendor/fcm-token";

export function useFCM() {
  const [isSupported,  setIsSupported]  = useState(false);
  const [isEnabled,    setIsEnabled]    = useState(false);   // vendor has an active token
  const [isLoading,    setIsLoading]    = useState(true);    // initial status check
  const [isRegistering, setIsRegistering] = useState(false); // enable/disable in progress
  const [error,        setError]        = useState(null);

  // ── Detect browser support ───────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const messaging = await getMessagingInstance();
      if (!cancelled) setIsSupported(!!messaging);
    })();
    return () => { cancelled = true; };
  }, []);

  // ── Check current token status from backend ──────────────────────────────
  // Runs once when the component mounts. Lets the UI reflect the real state
  // (e.g. vendor enabled notifications on a previous session) without asking
  // for permission again.
  useEffect(() => {
    if (!isSupported) {
      setIsLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        // Also check browser-level permission — if it was revoked manually,
        // treat as disabled regardless of what the backend says.
        if (Notification.permission === "denied") {
          if (!cancelled) { setIsEnabled(false); setIsLoading(false); }
          return;
        }
        const res = await axios.get(`${BACKEND_URL}/status`, { withCredentials: true });
        if (!cancelled) {
          setIsEnabled(res.data?.data?.hasActiveToken === true);
        }
      } catch {
        // Non-critical — just default to disabled
        if (!cancelled) setIsEnabled(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isSupported]);

  // ── Enable: request permission → get token → register with backend ───────
  const enable = useCallback(async () => {
    setError(null);
    setIsRegistering(true);
    try {
      const messaging = await getMessagingInstance();
      if (!messaging) {
        setError("Push notifications are not supported in this browser.");
        return false;
      }

      // Request OS-level notification permission
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notification permission was denied. Please allow notifications in your browser settings.");
        return false;
      }

      // ── Locate the existing DilMart service worker ───────────────────────
      // We REQUIRE the DilMart SW registration and pass it explicitly to
      // getToken(). This prevents Firebase from silently falling back to its
      // own /firebase-messaging-sw.js file (which does not exist in this
      // project).
      //
      // vite-plugin-pwa registers the SW asynchronously via registerSW() in
      // main.jsx. In dev it registers /dev-sw.js at scope "/"; in production
      // it registers /sw.js at scope "/". We wait up to 8 seconds for it.
      if (!("serviceWorker" in navigator)) {
        setError("Service workers are not supported in this browser.");
        return false;
      }

      // Wait for the SW to be registered at scope "/" (up to 8 s).
      // This handles the case where enable() is called before the SW has
      // finished registering (e.g. immediately after a fresh page load).
      let swRegistration = await navigator.serviceWorker.getRegistration("/");
      if (!swRegistration) {
        swRegistration = await new Promise((resolve) => {
          const deadline = setTimeout(() => resolve(null), 8000);
          navigator.serviceWorker.addEventListener("controllerchange", async () => {
            const reg = await navigator.serviceWorker.getRegistration("/");
            if (reg) { clearTimeout(deadline); resolve(reg); }
          });
          // Also poll every 500 ms in case controllerchange already fired
          const interval = setInterval(async () => {
            const reg = await navigator.serviceWorker.getRegistration("/");
            if (reg) { clearTimeout(deadline); clearInterval(interval); resolve(reg); }
          }, 500);
        });
      }

      if (!swRegistration) {
        setError(
          "DilMart service worker is not registered. " +
          "Please reload the page and try again."
        );
        return false;
      }

      // Wait for the SW to reach "activated" state before calling getToken().
      // getToken() requires the SW to be active so it can receive push events.
      if (!swRegistration.active) {
        await new Promise((resolve, reject) => {
          const sw = swRegistration.installing || swRegistration.waiting;
          if (!sw) { resolve(); return; }
          const timeout = setTimeout(() => {
            reject(new Error("Service worker activation timed out."));
          }, 10000);
          sw.addEventListener("statechange", function handler() {
            if (sw.state === "activated") {
              clearTimeout(timeout);
              sw.removeEventListener("statechange", handler);
              resolve();
            }
            if (sw.state === "redundant") {
              clearTimeout(timeout);
              sw.removeEventListener("statechange", handler);
              reject(new Error("Service worker became redundant during activation."));
            }
          });
        });
      }

      // Final check
      if (!swRegistration.active) {
        setError("DilMart service worker is not active. Please reload the page and try again.");
        return false;
      }

      // ── Get the FCM registration token ───────────────────────────────────
      // Always pass serviceWorkerRegistration explicitly — no Firebase fallback.
      const fcmToken = await getToken(messaging, {
        vapidKey:                VAPID_KEY,
        serviceWorkerRegistration: swRegistration,
      });

      if (!fcmToken) {
        setError("Could not obtain FCM token. Ensure the VAPID key is correct and try again.");
        return false;
      }

      // ── Register with backend ────────────────────────────────────────────
      // userId is taken from the JWT server-side — never from the client body
      const browser = detectBrowser();
      await axios.post(
        BACKEND_URL,
        { token: fcmToken, platform: "web", browser },
        { withCredentials: true }
      );

      setIsEnabled(true);
      return true;
    } catch (err) {
      console.error("[useFCM] enable error:", err);
      setError(err.response?.data?.message || err.message || "Failed to enable notifications.");
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  // ── Disable: deregister token from backend ───────────────────────────────
  const disable = useCallback(async () => {
    setError(null);
    setIsRegistering(true);
    try {
      const messaging = await getMessagingInstance();
      let fcmToken = null;

      if (messaging && Notification.permission === "granted") {
        try {
          // Use the existing DilMart SW explicitly — same pattern as enable()
          const swRegistration = await navigator.serviceWorker.getRegistration("/");
          if (swRegistration?.active) {
            fcmToken = await getToken(messaging, {
              vapidKey:                VAPID_KEY,
              serviceWorkerRegistration: swRegistration,
            });
          }
        } catch {
          // Cannot retrieve token — proceed with deregistration anyway.
          // The backend will soft-deactivate if we can send the token,
          // or the vendor can re-enable later to get a fresh token.
        }
      }

      if (fcmToken) {
        await axios.delete(
          BACKEND_URL,
          { data: { token: fcmToken }, withCredentials: true }
        );
      }

      setIsEnabled(false);
      return true;
    } catch (err) {
      console.error("[useFCM] disable error:", err);
      setError(err.response?.data?.message || err.message || "Failed to disable notifications.");
      return false;
    } finally {
      setIsRegistering(false);
    }
  }, []);

  return {
    isSupported,
    isEnabled,
    isLoading,
    isRegistering,
    error,
    enable,
    disable,
  };
}

// ── Utility ───────────────────────────────────────────────────────────────

function detectBrowser() {
  const ua = navigator.userAgent;
  if (ua.includes("Chrome") && !ua.includes("Edg")) return "Chrome";
  if (ua.includes("Firefox"))  return "Firefox";
  if (ua.includes("Edg"))      return "Edge";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  return "Unknown";
}
