import axios from 'axios';

const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
const base = origin.startsWith('https://')
  ? origin.replace(/:\d+$/, '') + '/api'
  : 'http://localhost:3000/api';

const api = axios.create({
  baseURL: base,
  withCredentials: true
});

export default api;
/*
  Cliente HTTP (API)
  - Configura instância com baseURL, cookies e headers padrão.
  - Centraliza interceptors para tratar erros e autenticação.
*/