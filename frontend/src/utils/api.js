import axios from 'axios';
import store from '../redux/store';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('codemastery-token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor to handle token expiration (401 Unauthorized)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Ignore refresh endpoint itself to prevent infinite loop
    if (originalRequest.url.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('codemastery-refresh-token');
      if (refreshToken) {
        try {
          // Attempt a silent token refresh via Axios direct post
          const res = await axios.post('/api/auth/refresh', { refreshToken });
          if (res.data && res.data.token) {
            const newToken = res.data.token;
            const newRefreshToken = res.data.refreshToken;
            
            localStorage.setItem('codemastery-token', newToken);
            if (newRefreshToken) {
              localStorage.setItem('codemastery-refresh-token', newRefreshToken);
            }

            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            processQueue(null, newToken);
            isRefreshing = false;
            return api(originalRequest);
          }
        } catch (refreshErr) {
          processQueue(refreshErr, null);
          isRefreshing = false;
          handleSessionExpiry();
          return Promise.reject(refreshErr);
        }
      } else {
        isRefreshing = false;
        handleSessionExpiry();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

function handleSessionExpiry() {
  toast.warn('Your session has expired — please log in again. Your code has been saved locally.', {
    toastId: 'session-expiry-warning',
    autoClose: 8000,
  });
  store.dispatch(logout());
}

export default api;
