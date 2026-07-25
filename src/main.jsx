import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store.js";
import { Toaster } from "./components/ui/toaster.jsx";
import axios from "axios";

// ── Global 401 interceptor ─────────────────────────────────────────────────
// When the server returns 401 (suspended account, force-logout, or expired
// tokenVersion) clear the auth state so the user is redirected to login.
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
