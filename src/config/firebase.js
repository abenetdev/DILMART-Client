/**
 * Firebase Client Configuration — DilMart
 *
 * Initializes the Firebase Web SDK (v12, modular) and exports the
 * Messaging instance used for FCM push registration on the vendor dashboard.
 *
 * SECURITY NOTES:
 *  - These are the PUBLIC Firebase Web config values. They are safe to ship
 *    in the client bundle — they identify the Firebase project but do NOT
 *    grant administrative access. Access is controlled by Firebase Security
 *    Rules and the VAPID key.
 *  - The Firebase Admin service-account credentials (FIREBASE_PRIVATE_KEY,
 *    FIREBASE_CLIENT_EMAIL) live ONLY on the server and are NEVER exposed here.
 *
 * Required Vite environment variables (set in .env.development and
 * .env.production / Vercel environment variables):
 *
 *   VITE_FIREBASE_API_KEY
 *   VITE_FIREBASE_AUTH_DOMAIN
 *   VITE_FIREBASE_PROJECT_ID
 *   VITE_FIREBASE_STORAGE_BUCKET
 *   VITE_FIREBASE_MESSAGING_SENDER_ID
 *   VITE_FIREBASE_APP_ID
 *   VITE_FIREBASE_VAPID_KEY   ← Web Push certificate public key
 */

import { initializeApp, getApps, getApp } from "firebase/app";
import { getMessaging, isSupported }       from "firebase/messaging";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialise once — getApps() check prevents re-initialisation during HMR
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

/**
 * Returns the Firebase Messaging instance, or null if the current browser
 * does not support the Push API / service workers (e.g. Safari < 16, Firefox
 * in private mode, non-HTTPS contexts).
 *
 * Callers must handle the null case gracefully.
 *
 * @returns {Promise<import("firebase/messaging").Messaging | null>}
 */
export async function getMessagingInstance() {
  try {
    const supported = await isSupported();
    if (!supported) return null;
    return getMessaging(app);
  } catch {
    return null;
  }
}

export { app };
export const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";
