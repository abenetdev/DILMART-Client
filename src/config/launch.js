/**
 * launch.js — Single source of truth for DilMart launch state.
 *
 * Control via environment variable:
 *   VITE_DILMART_LAUNCHED=false   → pre-launch mode (ComingSoon page shown)
 *   VITE_DILMART_LAUNCHED=true    → full app visible
 *
 * Since Vite bakes env vars at build time, a redeploy is required
 * after flipping the variable on Vercel.
 */

/**
 * Set to a future ISO-8601 datetime with +03:00 (Addis Ababa, EAT).
 * Change this to update the countdown target without touching any component.
 *
 * Format: "YYYY-MM-DDTHH:MM:SS+03:00"
 */
export const LAUNCH_DATE = "2026-10-01T09:00:00+03:00";

/**
 * True  → show the normal DilMart application.
 * False → show the ComingSoon page and block all public routes.
 *
 * Accepts the string "true" (case-insensitive) as truthy so that
 * Vercel / .env files behave consistently.
 */
export const IS_LAUNCHED = import.meta.env.VITE_DILMART_LAUNCHED?.toLowerCase() === "true";
