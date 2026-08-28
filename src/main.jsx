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
// Runs in both dev and production.
// In dev: vite-plugin-pwa serves the SW at /dev-sw.js (devOptions.enabled:true)
//         so FCM getToken() can find the registration at scope "/".
// In prod: registers the compiled /sw.js bundle.
// autoUpdate: when a new SW version is ready it activates on the next navigation.
registerSW({
  onRegisteredSW(swUrl, registration) {
    if (registration) {
      console.log("[DilMart PWA] Service worker registered:", swUrl);
    }
  },
  onRegisterError(error) {
    console.warn("[DilMart PWA] Service worker registration failed:", error);
  },
});

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
