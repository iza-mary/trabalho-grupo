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
  const { data } = await api.post(`/produtos/${id}/movimentar`, payload);
  return data;
}