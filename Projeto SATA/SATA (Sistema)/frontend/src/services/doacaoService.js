import api from './api';

const normTipo = (t) => {
  const up = String(t || '').toUpperCase();
  if (up === 'D' || up === 'DINHEIRO') return 'Dinheiro';
  if (up === 'A' || up === 'ALIMENTO') return 'Alimento';
  if (up === 'O' || up === 'OUTROS' || up === 'OUTRO') return 'Outros';
  return t || '';
};

const normalizeDoacao = (d) => {
  const tipo = normTipo(d?.tipo);
  const doadorObj = d?.doador && typeof d.doador === 'object' ? d.doador : {};
  const doadorId = doadorObj?.doadorId ?? doadorObj?.id ?? d?.doadorId ?? d?.doador_id ?? null;
  const doadorNome = doadorObj?.nome ?? d?.doador_nome ?? d?.nome_doador ?? '';
  const sub = d?.doacao && typeof d.doacao === 'object' ? d.doacao : {};
  const quantidade = sub?.quantidade ?? sub?.qntd ?? d?.quantidade ?? d?.qntd;
  const unidade = sub?.unidade_medida ?? d?.unidade_medida;
  const valor = sub?.valor ?? d?.valor;
  const forma = sub?.forma_pagamento ?? d?.forma_pagamento;
  const comp = sub?.comprovante ?? d?.comprovante;
  const tipoAlim = sub?.tipo_alimento ?? d?.tipo_alimento;
  const descItem = sub?.descricao_item ?? d?.descricao_item;
  const itemBase = sub?.item ?? d?.item;
  const item = descItem ?? tipoAlim ?? itemBase ?? null;
  return {
    ...d,
    tipo,
    doador: { doadorId: doadorId, nome: doadorNome },
    evento: d?.evento ?? d?.evento_titulo ?? d?.eventoTitulo ?? '',
    doacao: {
      ...sub,
      valor: valor,
      forma_pagamento: forma,
      comprovante: comp,
      quantidade: quantidade,
      qntd: quantidade,
      unidade_medida: unidade,
      tipo_alimento: tipoAlim,
      descricao_item: descItem,
      item: item,
    },
  };
};

const getAll = async () => {
  try {
    const response = await api.get('/doacoes');
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return (result.data || []).map((doacao) => normalizeDoacao(doacao));
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
    return (result.data || []).map((d) => normalizeDoacao(d));
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
    return (result.data || []).map((d) => normalizeDoacao(d));
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
    return normalizeDoacao(result.data || {});
  } catch (error) {
    console.error(`Erro ao buscar doacao ${id}: `, error);
    throw error;
  }
};

const add = async (doacao) => {
  try {
    const doacaoData = { ...doacao };
    const response = await api.post('/doacoes', doacaoData, { timeout: 15000 });
    const result = response.data;
    if (!result.success) throw new Error(result.message || 'Erro na requisição');
    return normalizeDoacao(result.data || {});
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
    return normalizeDoacao(result.data || {});
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
