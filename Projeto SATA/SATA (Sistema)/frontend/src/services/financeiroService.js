import api from './api';

const resource = '/financeiro';

export const financeiroService = {
  async list() {
    const { data } = await api.get(resource);
    return data?.data ?? [];
  },

  async getById(id) {
    const { data } = await api.get(`${resource}/${id}`);
    return data?.data ?? null;
  },

  async create(payload) {
    const { data } = await api.post(resource, payload);
    return data?.data ?? null;
  },

  async update(id, payload) {
    const { data } = await api.put(`${resource}/${id}`, payload);
    return data?.data ?? null;
  },

  async remove(id) {
    const { data } = await api.delete(`${resource}/${id}`);
    return data?.success ?? false;
  },
};

export default financeiroService;