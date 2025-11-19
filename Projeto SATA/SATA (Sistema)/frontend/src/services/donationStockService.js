import api from './api';

const donationStockService = {
  async buscarSimilares(nome = '', categoria = '') {
    try {
      const { data } = await api.post('/estoque/doacoes/similares', { nome, categoria });
      if (data?.success) return Array.isArray(data?.data) ? data.data : [];
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Erro ao buscar produtos similares:', err?.response?.data?.message || err?.message || err);
      return [];
    }
  },

  async processarItem(payload) {
    try {
      const { data } = await api.post('/estoque/doacoes/processar-item', payload);
      return data;
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || err;
      console.error('Erro ao processar doação de item:', msg);
      throw err;
    }
  }
};

export default donationStockService;
/*
  Serviço de Estoque de Doações (Frontend)
  - Chamadas relacionadas a saldo e histórico de estoque de doações.
*/