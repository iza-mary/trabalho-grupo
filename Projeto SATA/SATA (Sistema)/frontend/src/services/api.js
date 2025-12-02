import axios from 'axios';

const envBase = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
  ? import.meta.env.VITE_API_URL
  : null;
const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const isLocalhost = /^http:\/\/localhost(?::\d+)?$/i.test(origin) || /^http:\/\/127\.0\.0\.1(?::\d+)?$/i.test(origin);
const fallbackBase = isLocalhost ? 'http://localhost:3000/api' : origin.replace(/\/?$/, '') + '/api';
const base = envBase || fallbackBase;

const api = axios.create({
  baseURL: base,
  withCredentials: true
});

api.interceptors.request.use((config) => {
  try {
    const t = typeof localStorage !== 'undefined' ? localStorage.getItem('csrfToken') : null;
    if (t) {
      config.headers = config.headers || {};
      if (!config.headers['x-csrf-token']) config.headers['x-csrf-token'] = t;
    }
  } catch (e) {
    void e;
  }
  return config;
});

export default api;
/*
  Cliente HTTP (API)
  - Configura instância com baseURL, cookies e headers padrão.
  - Centraliza interceptors para tratar erros e autenticação.
*/
