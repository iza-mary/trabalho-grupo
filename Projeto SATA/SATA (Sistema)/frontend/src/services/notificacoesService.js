import api from './api';

export async function listarNotificacoes(params = {}) {
  const { data } = await api.get('/notificacoes', { params });
  return data;
}

export async function obterNotificacao(id) {
  const { data } = await api.get(`/notificacoes/${id}`);
  return data;
}

export async function criarNotificacao(payload) {
  const { data } = await api.post('/notificacoes', payload);
  return data;
}

export async function atualizarNotificacao(id, payload) {
  const { data } = await api.put(`/notificacoes/${id}`, payload);
  return data;
}

export async function deletarNotificacao(id) {
  const { data } = await api.delete(`/notificacoes/${id}`);
  return data;
}

export async function marcarComoLida(id) {
  const { data } = await api.patch(`/notificacoes/${id}/marcar-lida`);
  return data;
}

export async function marcarVariasComoLidas(ids) {
  const { data } = await api.patch('/notificacoes/marcar-lidas', { ids });
  return data;
}

export async function obterNotificacoesRecentes(limite = 10, usuario_id = null) {
  const params = { limite };
  if (usuario_id) params.usuario_id = usuario_id;
  
  const { data } = await api.get('/notificacoes/recentes', { params });
  return data;
}

export async function obterContadores(usuario_id = null) {
  const params = {};
  if (usuario_id) params.usuario_id = usuario_id;
  
  const { data } = await api.get('/notificacoes/contadores', { params });
  return data;
}

export async function criarNotificacaoCadastro(tipo_cadastro, nome_item, usuario_id = null) {
  const { data } = await api.post('/notificacoes/cadastro', {
    tipo_cadastro,
    nome_item,
    usuario_id
  });
  return data;
}

export async function criarNotificacaoEstoqueBaixo(produto, usuario_id = null) {
  const { data } = await api.post('/notificacoes/estoque-baixo', {
    produto,
    usuario_id
  });
  return data;
}
/*
  Serviço de Notificações
  - Contadores, listagem e marcação de leitura.
*/