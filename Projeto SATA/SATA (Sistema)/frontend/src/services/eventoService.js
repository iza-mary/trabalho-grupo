import eventosService from './eventosService';

export default {
  async getAll() {
    try {
      const lista = await eventosService.getAll();
      return Array.isArray(lista) ? lista : [];
    } catch (err) {
      console.error('Erro ao obter eventos do backend:', err?.message || err);
      return [];
    }
  },
  async create(payload) {
    try {
      await eventosService.create(payload);
      return await this.getAll();
    } catch (err) {
      console.error('Erro ao criar evento (frontend):', err?.response?.data?.message || err?.message || err);
      throw err;
    }
  },
  async update(id, payload) {
    try {
      await eventosService.update(id, payload);
      return await this.getAll();
    } catch (err) {
      console.error('Erro ao atualizar evento (frontend):', err?.response?.data?.message || err?.message || err);
      throw err;
    }
  },
  async remove(id) {
    try {
      await eventosService.remove(id);
      return await this.getAll();
    } catch (err) {
      console.error('Erro ao remover evento (frontend):', err?.response?.data?.message || err?.message || err);
      throw err;
    }
  }
  ,
  async getById(id) {
    try {
      const ev = await eventosService.getById(id);
      return ev || null;
    } catch (err) {
      console.error('Erro ao obter evento por ID (frontend):', err?.response?.data?.message || err?.message || err);
      throw err;
    }
  }
};
/*
  Serviço de Evento
  - CRUD de eventos e filtros por intervalo.
*/