import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Fast in-memory SWR Cache for GET requests
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('spay_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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
