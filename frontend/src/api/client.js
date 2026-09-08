import axios from 'axios';
import useAuthStore from '../store/authStore';

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  'https://ecommerce-production-tnzc3v.laravel.cloud/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 15000,
});

// ── Request Interceptor — inject Bearer token from Zustand store ───
client.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Response Interceptor — handle 401 auto-logout ──────────────────
// Dispatches a custom event so useAutoLogout() can handle it via
// React Router without a full-page reload.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthRoute =
        window.location.pathname.includes('/login') ||
        window.location.pathname.includes('/register') ||
        window.location.pathname.includes('/forgot-password') ||
        window.location.pathname.includes('/reset-password');

      if (!isAuthRoute) {
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }
    }
    return Promise.reject(error);
  }
);

export default client;
