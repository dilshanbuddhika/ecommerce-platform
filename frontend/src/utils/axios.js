// ============================================
// AXIOS INSTANCE - API calls සඳහා
// ============================================
import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// ── Request Interceptor ──
// Every request එකට auto token attach කරන්න
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// ── Response Interceptor ──
// Error handling
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // 401 = Unauthorized → logout
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Redirect to login (optional)
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default API;