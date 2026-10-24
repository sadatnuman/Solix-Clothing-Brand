import axios from 'axios';
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const api = axios.create({ baseURL: API_BASE_URL, timeout: 15000, withCredentials: true });
let refreshing = null;
api.interceptors.response.use((response) => response, async (error) => {
  const request = error.config;
  const path = String(request?.url || '');
  if (error.response?.status === 401 && request && !request.__retried && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
    request.__retried = true;
    try {
      refreshing ||= api.post('/auth/refresh').finally(() => { refreshing = null; });
      await refreshing;
      return api(request);
    } catch { /* Return the original unauthorized response. */ }
  }
  return Promise.reject(error);
});
export default api;
export const imageUrl = (url) => !url ? '/images/tee.jpg' : url.startsWith('/images/') || url.startsWith('https://') ? url : `${API_BASE_URL}/${url.replace(/^\//, '')}`;
export const money = (value) => new Intl.NumberFormat('en-BD', { style: 'currency', currency: 'BDT', maximumFractionDigits: 0 }).format(Number(value || 0));
export const errorMessage = (error) => { const m = error.response?.data?.message; return Array.isArray(m) ? m.join('. ') : m || 'We could not connect. Please try again.'; };
