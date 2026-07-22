/**
 * Axios instance configured for the Festival Planner FastAPI backend.
 *
 * This version relies on HttpOnly cookies for authentication. 
 * `withCredentials: true` ensures cookies are sent with every request.
 */
import axios from 'axios';
import { usePlannerStore } from '../store/usePlannerStore';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // IMPORTANT for cross-origin HttpOnly cookies
});

// ---------------------------------------------------------------------------
// Response interceptor
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status: number | undefined = error.response?.status;

    // --- 429 Rate limit exceeded ---
    if (status === 429 && error.response?.data?.error === 'rate_limit_exceeded') {
      console.warn('[RateLimit] Limit exceeded:', error.response.data.message);
      usePlannerStore.getState().setUpgradeModalOpen(true);
      // Resolve gracefully so callers don't crash with an unhandled rejection.
      return Promise.resolve({
        data: {
          error: 'rate_limit_exceeded',
          message: error.response.data.message,
        },
      });
    }

    // --- 401 Unauthorized ---
    if (status === 401) {
      console.warn('[Auth] Unauthorized (401). Cookie might be expired. Redirecting to landing.');
      if (typeof window !== 'undefined' && !['/', '/login'].includes(window.location.pathname)) {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  },
);
