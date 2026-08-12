import axios from "axios";

// VITE_API_URL is set in .env.production / Vercel environment variables
// Falls back to localhost for local development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ── Request interceptor 1: attach token ───────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Request interceptor 2: block requests when offline ────────────────────
// Creates a recognisable error with code "ERR_NETWORK_OFFLINE" so
// components can distinguish "no internet" from real server errors.
axiosInstance.interceptors.request.use(
  (config) => {
    if (!navigator.onLine) {
      const err = new Error("No internet connection");
      err.code  = "ERR_NETWORK_OFFLINE";
      err.isOffline = true;
      return Promise.reject(err);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default axiosInstance;
export { API_URL };
