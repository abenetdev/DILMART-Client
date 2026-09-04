/**
 * LaunchGuard.jsx
 *
 * Single route-level guard for DilMart's pre-launch mode.
 *
 * IS_LAUNCHED = true  → render children normally (no-op, full app)
 * IS_LAUNCHED = false → render ComingSoon for every request that lands here
 *
 * How it works in App.jsx:
 *   - The entire "/" route tree (ShoppingLayout + all sub-routes) is wrapped
 *     in ONE LaunchGuard at the layout level.
 *   - Misc public routes (/store/:slug, /privacy-policy, etc.) are also
 *     individually wrapped.
 *   - When pre-launch, LaunchGuard replaces the matched route's content with
 *     <ComingSoon />, so the URL the user typed stays in the address bar but
 *     they only see the countdown page — no redirect loop, no duplicate routes.
 *
 * What is NOT wrapped (intentionally):
 *   /auth/*            – vendors/admins must be able to log in
 *   /admin/*           – gated by CheckAuth (admin role required)
 *   /vendor/*          – gated by CheckAuth (vendor role required)
 */

import { IS_LAUNCHED } from "@/config/launch";
import ComingSoon from "@/pages/ComingSoon";

/**
 * @param {{ children: React.ReactNode }} props
 */
export default function LaunchGuard({ children }) {
  // App is live — pass through to the real page
  if (IS_LAUNCHED) return children;

  // Pre-launch — show the countdown page in place of whatever was requested
  return <ComingSoon />;
}
