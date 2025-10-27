import api from './api';

const authService = {
  async login(username, password) {
    const { data } = await api.post('/auth/login', { username, password });
    return data; // { success, user } ou { success:false, error }
  },

  async me() {
    const { data } = await api.get('/auth/me');
    return data; // { success, user }
  },

  async logout() {
    const { data } = await api.post('/auth/logout');
    return data; // { success: true }
  },

  async forgotPassword(email) {
    const { data } = await api.post('/auth/forgot-password', { email });
    return data; // { success: true, token? }
  },

  async resetPassword(token, new_password) {
    const { data } = await api.post('/auth/reset-password', { token, new_password });
    return data; // { success: true }
  },

  async changePassword(current_password, new_password) {
    const { data } = await api.post('/auth/change-password', { current_password, new_password });
    return data; // { success: true }
  },

  async register({ username, email, password, role }) {
    const { data } = await api.post('/auth/register', { username, email, password, role });
    return data; // { success, data }
  },
};

export default authService;