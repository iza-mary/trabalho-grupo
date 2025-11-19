import api from './api';

const resource = '/doadores';

const getById = async (id) => {
  try {
    const { data } = await api.get(`${resource}/${id}`);
    if (!data?.success) throw new Error(data?.message || 'Erro de requisição');
    return data.data;
  } catch (error) {
    console.error(`Erro ao buscar doador ${id}:`, error);
    throw error;
  }
};

const getFicha = async (id) => {
  try {
    const { data } = await api.get(`${resource}/${id}/ficha`);
    if (!data?.success) throw new Error(data?.message || 'Erro de requisição');
    return data.data;
  } catch (error) {
    console.error(`Erro ao buscar ficha completa do doador ${id}:`, error);
    throw error;
  }
};

const doadorService = {
  getById,
  getFicha,
};

export default doadorService;
/*
  Serviço de Doadores
  - Operações de CRUD e busca de doadores.
*/