import axios from 'axios';

// Smart URL Normalizer: handles trailing slashes and missing '/api' paths automatically
const getNormalizedApiUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) {
    return 'http://localhost:5000/api';
  }

  let clean = envUrl.trim().replace(/\/+$/, '');
  if (!clean.endsWith('/api')) {
    clean = `${clean}/api`;
  }
  return clean;
};

const baseURL = getNormalizedApiUrl();

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Fast in-memory SWR Cache for GET requests
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

// Request Interceptor: Attach JWT Token securely
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response Interceptor: Auto-logout on 401 Unauthorized or Session Expiry
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      if (!isAuthPage) {
        localStorage.removeItem('spay_token');
        localStorage.removeItem('spay_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Clear cache on any state mutation
const invalidateCache = () => {
  cache.clear();
};

const originalGet = api.get;
const originalPost = api.post;
const originalPut = api.put;
const originalDelete = api.delete;

api.get = async function (url, config = {}) {
  const cacheKey = `${url}_${JSON.stringify(config.params || {})}`;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    // Return cached immediately, trigger background refresh silently
    originalGet.call(api, url, config).then((res) => {
      cache.set(cacheKey, { data: res.data, timestamp: Date.now() });
    }).catch(() => {});

    return Promise.resolve({ data: cached.data, status: 200, fromCache: true });
  }

  const res = await originalGet.call(api, url, config);
  cache.set(cacheKey, { data: res.data, timestamp: Date.now() });
  return res;
};

api.post = async function (...args) {
  invalidateCache();
  return originalPost.apply(api, args);
};

api.put = async function (...args) {
  invalidateCache();
  return originalPut.apply(api, args);
};

api.delete = async function (...args) {
  invalidateCache();
  return originalDelete.apply(api, args);
};

api.clearCache = invalidateCache;

export default api;
