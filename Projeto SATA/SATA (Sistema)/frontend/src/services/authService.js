import api from './api';
const csrfHeader = () => {
  const t = typeof localStorage !== 'undefined' ? localStorage.getItem('csrfToken') : null;
  return t ? { 'x-csrf-token': t } : {};
};

const authService = {
  async login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    if (data?.csrf && typeof localStorage !== 'undefined') {
      try { localStorage.setItem('csrfToken', data.csrf); } catch (e) { void e; }
    }
    return data;
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data; // { success, user }
  },

  async logout() {
    const { data } = await api.post('/auth/logout', {}, { headers: csrfHeader() });
    return data;
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email }, { headers: csrfHeader() });
    return data;
  },

  async resetPassword(token, new_password) {
    const { data } = await api.post('/auth/reset-password', { token, new_password }, { headers: csrfHeader() });
    return data;
  },

  async changePassword(current_password, new_password) {
    const { data } = await api.post('/auth/change-password', { current_password, new_password }, { headers: csrfHeader() });
    return data;
  },

  async register({ username, email, password, role }) {
    const { data } = await api.post('/auth/register', { username, email, password, role }, { headers: csrfHeader() });
    return data;
  },

  async checkUnique({ username, email }) {
    const params = {};
    if (username) params.username = username;
    if (email) params.email = email;
    const { data } = await api.get('/auth/check-unique', { params });
    return data;
  },

  async listUsers(params = {}) {
    const { data } = await api.get('/users', { params });
    return data;
  },

  async adminCreateUser(payload) {
    const { data } = await api.post('/users', payload, { headers: csrfHeader() });
    return data;
  },

  async adminUpdateUser(id, payload) {
    const { data } = await api.put(`/users/${id}`, payload, { headers: csrfHeader() });
    return data;
  },

  async adminDeleteUser(id) {
    const { data } = await api.delete(`/users/${id}`, { headers: csrfHeader() });
    return data;
  },

  async adminSetStatus(id, status) {
    const { data } = await api.patch(`/users/${id}/status`, { status }, { headers: csrfHeader() });
    return data;
  },

  async resendEmailValidation(id) {
    const { data } = await api.post(`/users/${id}/resend-validation`, {}, { headers: csrfHeader() });
    return data;
  },
};

export default authService;
/*
  Serviço de Autenticação (Frontend)
  - Encapsula chamadas: login, logout, me, registro, gerenciamento de usuários.
*/