import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store.js";
import { Toaster } from "./components/ui/toaster.jsx";
import axios from "axios";
import { registerSW } from "virtual:pwa-register";

// ── DilMart PWA: Service Worker registration ─────────────────────────────
// Only active in production builds (vite-plugin-pwa devOptions.enabled=false).
// autoUpdate: when a new SW version is available, it updates silently on the
// next page navigation — no intrusive "update available" prompt at this stage.
if (import.meta.env.PROD) {
  registerSW({
    onRegisteredSW(swUrl, registration) {
      // SW registered — log once in production for diagnostics
      if (registration) {
        console.log("[DilMart PWA] Service worker registered:", swUrl);
      }
    },
    onRegisterError(error) {
      console.warn("[DilMart PWA] Service worker registration failed:", error);
    },
  });
}

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const currentState = store.getState();
      // Only act if the user is currently considered authenticated
      if (currentState.auth.isAuthenticated) {
        store.dispatch({ type: "auth/forceLogout" });
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <Provider store={store}>
       <App />
      <Toaster />
    </Provider>
  </BrowserRouter>
);
