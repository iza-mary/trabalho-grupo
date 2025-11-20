import axios from 'axios';

const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const base = origin.startsWith('https://')
  ? origin.replace(/:\d+$/, '') + '/api'
  : 'http://localhost:3000/api';

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