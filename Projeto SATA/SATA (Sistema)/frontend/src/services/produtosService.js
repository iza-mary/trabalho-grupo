import api from './api';

export async function listarProdutos(params = {}) {
  const { data } = await api.get('/produtos', { params });
  return data;
}

export async function obterProduto(id) {
  const { data } = await api.get(`/produtos/${id}`);
  return data;
}

export async function criarProduto(payload) {
  const { data } = await api.post('/produtos', payload);
  return data;
}

export async function atualizarProduto(id, payload) {
  const { data } = await api.put(`/produtos/${id}`, payload);
  return data;
}

export async function deletarProduto(id) {
  const { data } = await api.delete(`/produtos/${id}`);
  return data;
}

export async function movimentarProduto(id, payload) {
  // payload: { tipo: 'entrada'|'saida', quantidade: number, observacao?: string }
  try {
    const { data } = await api.post(`/produtos/${id}/movimentar`, payload, { timeout: 5000 });
    return data;
  } catch (err) {
    const code = String(err?.code || '');
    const msg = String(err?.message || '');
    if (code === 'ECONNABORTED' || /timeout/i.test(msg)) {
      throw new Error('Tempo excedido ao movimentar estoque (5s). Tente novamente.');
    }
    throw err;
  }
}

export async function listarMovimentos(id, params = {}) {
  const { data } = await api.get(`/produtos/${id}/historico`, { params });
  return data;
}
/*
  Serviço de Produtos
  - CRUD, movimentação e histórico de estoque.
*/