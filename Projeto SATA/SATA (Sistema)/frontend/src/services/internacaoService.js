import api from './api';

const internacaoService = {
  // Listar todas as internações
  async listarTodas() {
    try {
      const response = await api.get('/internacoes');
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao listar internações:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar internações');
    }
  },

  // Buscar internação por ID
  async buscarPorId(id) {
    try {
      const response = await api.get(`/internacoes/${id}`);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao buscar internação:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar internação');
    }
  },

  // Criar nova internação
  async criar(dadosInternacao) {
    try {
      const response = await api.post('/internacoes', dadosInternacao);
      return response.data.data;
    } catch (error) {
      console.error('Erro ao criar internação:', error);
      throw new Error(error.response?.data?.message || 'Erro ao criar internação');
    }
  },

  // Dar baixa na internação
  async darBaixa(id, motivoSaida) {
    try {
      const response = await api.put(`/internacoes/${id}/baixa`, {
        motivo_saida: motivoSaida
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao dar baixa na internação:', error);
      throw new Error(error.response?.data?.message || 'Erro ao dar baixa na internação');
    }
  },

  // Compatibilidade: manter método antigo chamando o novo
  async finalizar(id, motivoSaida) {
    return this.darBaixa(id, motivoSaida);
  },

  // Buscar internações ativas
  async listarAtivas() {
    try {
      const response = await api.get('/internacoes/ativas');
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar internações ativas:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar internações ativas');
    }
  },

  // Buscar quartos disponíveis
  async buscarQuartosDisponiveis() {
    try {
      const response = await api.get('/quartos/disponiveis');
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar quartos disponíveis:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar quartos disponíveis');
    }
  },

  // Buscar camas disponíveis por quarto
  async buscarCamasDisponiveis(quartoId) {
    try {
      if (!quartoId) return [];
      const response = await api.get(`/internacoes/quartos/${quartoId}/camas`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erro ao buscar camas disponíveis:', error);
      throw new Error(error.response?.data?.message || 'Erro ao buscar camas disponíveis');
    }
  }
};

export default internacaoService;
/*
  Serviço de Internações
  - Abertura/encerramento e listagem de internações.
*/