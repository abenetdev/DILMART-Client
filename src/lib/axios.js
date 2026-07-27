import axios from "axios";

// VITE_API_URL is set in .env.production / Vercel environment variables
// Falls back to localhost for local development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// ── Request interceptor: attach token from localStorage as Bearer header ──
// This is required for cross-origin deployments (Vercel → Render) because
// Chrome incognito blocks SameSite=None third-party cookies.
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

export default axiosInstance;
export { API_URL };
