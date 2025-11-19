import api from './api';

const eventosService = {
  async getAll() {
    try {
      const res = await api.get('/eventos');
      const data = res.data;
      if (data?.success) return data.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Erro ao carregar eventos:', err?.response?.data?.message || err?.message || err);
      return [];
    }
  },

  async searchByTitulo(titulo = '') {
    try {
      const res = await api.get('/eventos/buscar', { params: { titulo } });
      const data = res.data;
      if (data?.success) return data.data || [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Erro ao buscar eventos:', err?.response?.data?.message || err?.message || err);
      return [];
    }
  },

  async create(payload) {
    try {
      const res = await api.post('/eventos', payload);
      const data = res.data;
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Falha ao criar evento');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || err;
      console.error('Erro ao criar evento:', msg);
      throw err;
    }
  },

  async update(id, payload) {
    try {
      const res = await api.put(`/eventos/${id}`, payload);
      const data = res.data;
      if (data?.success) return data.data;
      throw new Error(data?.message || 'Falha ao atualizar evento');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || err;
      console.error('Erro ao atualizar evento:', msg);
      throw err;
    }
  },

  async remove(id) {
    try {
      const res = await api.delete(`/eventos/${id}`);
      const data = res.data;
      if (data?.success) return true;
      throw new Error(data?.message || 'Falha ao remover evento');
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || err;
      console.error('Erro ao remover evento:', msg);
      throw err;
    }
  },
};

export default eventosService;
/*
  Serviço de Eventos (coleção)
  - Listagem e utilitários para eventos.
*/