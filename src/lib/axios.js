import axios from "axios";

// VITE_API_URL is set in .env.production / Vercel environment variables
// Falls back to localhost for local development
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const axiosInstance = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

export default axiosInstance;
export { API_URL };
