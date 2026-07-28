/**
 * GoogleSignInButton
 *
 * Uses Google Identity Services (GIS) script — no npm package needed.
 * The script is loaded once via index.html or injected here on first render.
 *
 * Props:
 *   onSuccess(idToken) — called with the raw ID token after Google returns it
 *   onError(message)   — called on any failure
 *   loading            — disables the button while parent is processing
 */

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

// Inject the GIS script once per page load
function loadGisScript() {
  if (document.getElementById("gis-script")) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.id    = "gis-script";
    script.src   = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload  = resolve;
    script.onerror = () => reject(new Error("Failed to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export default function GoogleSignInButton({ onSuccess, onError, loading = false }) {
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    loadGisScript()
      .then(() => setScriptReady(true))
      .catch(() => setScriptError(true));
  }, []);

  useEffect(() => {
    if (!scriptReady || !buttonRef.current || !window.google) return;
    if (!GOOGLE_CLIENT_ID) {
      console.error("VITE_GOOGLE_CLIENT_ID is not set in your .env file");
      return;
    }

    // Initialize GIS
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    // Render the styled Google button inside our wrapper
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme:  "outline",
      size:   "large",
      width:  buttonRef.current.offsetWidth || 360,
      text:   "continue_with",
      shape:  "rectangular",
      logo_alignment: "left",
    });
  }, [scriptReady]);

  function handleCredentialResponse(response) {
    if (response?.credential) {
      onSuccess(response.credential);
    } else {
      onError?.("Google sign-in was cancelled or failed.");
    }
  }

  if (scriptError) {
    return (
      <p className="text-sm text-center text-red-500">
        Could not load Google Sign-In. Check your connection and try again.
      </p>
    );
  }

  return (
    <div className="w-full relative">
      {/* Google renders its own button inside this div */}
      <div
        ref={buttonRef}
        className={`w-full transition-opacity ${loading || !scriptReady ? "opacity-50 pointer-events-none" : ""}`}
        aria-label="Sign in with Google"
      />

      {/* Overlay spinner while parent is processing */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/60 rounded">
          <Loader2 className="h-5 w-5 animate-spin text-gray-600" />
        </div>
      )}

      {!scriptReady && !scriptError && (
        <div className="h-11 w-full rounded border border-gray-200 flex items-center justify-center gap-2 text-sm text-gray-400 bg-white">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading Google Sign-In…
        </div>
      )}
    </div>
  );
}
