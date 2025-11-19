import api from './api';

const getAll = async () => {
  try {
    const response = await api.get('/doacoes');
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return (result.data || []).map((doacao) => ({ ...doacao }));
  } catch (error) {
    console.error(`Erro ao buscar doações ${error}`);
    throw error;
  }
};

const getByFiltred = async (filtro) => {
  try {
    const response = await api.post('/doacoes/filtrar', filtro);
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return result.data || [];
  } catch (error) {
    console.error(`Erro ao buscar doações ${error}`);
    // Fallback: tenta carregar sem filtros
    try {
      const all = await getAll();
      return all;
    } catch (fallbackErr) {
      console.error('Erro ao carregar doações sem filtro', fallbackErr);
      return [];
    }
  }
};

const getByEvento = async (eventoId, filtro = {}) => {
  try {
    const params = {
      tipo: filtro.tipo,
      data: filtro.data,
      destinatario: filtro.destinatario,
      busca: filtro.busca,
    };
    const response = await api.get(`/eventos/${eventoId}/doacoes`, { params });
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return result.data || [];
  } catch (error) {
    console.error(`Erro ao buscar doações do evento ${eventoId}:`, error);
    // Fallback: tenta filtrar sem o eventoId
    try {
      const lista = await getByFiltred(filtro);
      return lista;
    } catch (fallbackErr) {
      console.error('Erro no fallback de filtro sem evento', fallbackErr);
      return [];
    }
  }
};

const getById = async (id) => {
  try {
    const response = await api.get(`/doacoes/${id}`);
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return { ...result.data };
  } catch (error) {
    console.error(`Erro ao buscar doacao ${id}: `, error);
    throw error;
  }
};

const add = async (doacao) => {
  try {
    const doacaoData = { ...doacao };
    const response = await api.post('/doacoes', doacaoData);
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return { ...result.data };
  } catch (error) {
    console.error('Erro ao cadastrar doação', error);
    throw error;
  }
};

const update = async (doacao) => {
  try {
    const response = await api.put(`/doacoes/${doacao.id}`, doacao);
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return { ...result.data };
  } catch (error) {
    console.error(`Erro ao atualizar doação ${doacao.id}: `, error);
    throw error;
  }
};

const remove = async (id) => {
  try {
    const response = await api.delete(`/doacoes/${id}`);
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return result.message;
  } catch (error) {
    console.error(`Erro ao remover doação ${id}:`, error);
    // Propaga o erro para que o chamador possa tratar (exibir alerta, etc.)
    throw error;
  }
};

// Busca doadores por nome usando o endpoint de filtro da API de doadores
const getDoadorByName = async (nome) => {
  try {
    // O backend espera um payload com { filtros: ["termo"] }
    const response = await api.post('/doadores/filtrar', { filtros: [nome] });
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    // Garantir retorno mínimo contendo id e nome para o SelectDoador
    const lista = Array.isArray(result.data) ? result.data : [];
    return lista.map((d) => ({ id: d.id, nome: d.nome }));
  } catch (error) {
    console.error(`Erro ao buscar doador: ${error}`);
    return [];
  }
};

const doacoesService = {
  getAll,
  getById,
  update,
  add,
  remove,
  getByFiltred,
  getByEvento,
  getDoadorByName,
};

export default doacoesService;
/*
  Serviço de Doações
  - Operações de registro e consulta de doações.
*/