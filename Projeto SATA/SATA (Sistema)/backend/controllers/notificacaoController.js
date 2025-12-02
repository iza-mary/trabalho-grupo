const Notificacao = require('../models/notificacao');
const NotificacaoRepository = require('../repository/notificacaoRepository');

function normalizeTipo(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t === 'evento') return 'evento_proximo';
  if (t === 'estoque') return 'estoque_baixo';
  if (t === 'financeiro') return 'transacao_financeira';
  return ['cadastro','estoque_baixo','transacao_financeira','evento_proximo'].includes(t) ? t : 'cadastro';
}

class NotificacaoController {
  async getAll(req, res) {
    try {
      const { tipo, prioridade, lida, usuario_id, referencia_tipo, search, data_inicio, data_fim, page = 1, pageSize = 20, sort = 'data_criacao', order = 'DESC' } = req.query;
      const filters = { tipo, prioridade, lida: lida !== undefined ? lida === 'true' : undefined, usuario_id, referencia_tipo, search, data_inicio, data_fim, sort, order };
      const limit = parseInt(pageSize);
      const offset = (parseInt(page) - 1) * limit;
      filters.limit = limit;
      filters.offset = offset;
      const [notificacoes, total] = await Promise.all([
        NotificacaoRepository.findAll(filters),
        NotificacaoRepository.countAll ? NotificacaoRepository.countAll(filters) : Promise.resolve((await NotificacaoRepository.findAll(filters)).length)
      ]);
      const totalPages = Math.ceil(total / limit);
      res.json({ success: true, data: notificacoes, pagination: { page: parseInt(page), pageSize: limit, total, totalPages } });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao listar notificações', detail: err.message });
    }
  }

  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const notificacao = await NotificacaoRepository.findById(id);
      if (!notificacao) return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      res.json({ success: true, data: notificacao });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter notificação', detail: err.message });
    }
  }

  async create(req, res) {
    try {
      const notificacao = new Notificacao(req.body);
      const errors = notificacao.validate();
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });
      const id = await NotificacaoRepository.create(notificacao);
      const created = await NotificacaoRepository.findById(id);
      res.json({ success: true, data: created });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao criar notificação', detail: err.message });
    }
  }

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await NotificacaoRepository.findById(id);
      if (!found) return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      const notificacao = new Notificacao({ ...found, ...req.body, id });
      const errors = notificacao.validate();
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });
      const ok = await NotificacaoRepository.update(id, notificacao);
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao atualizar notificação' });
      const updated = await NotificacaoRepository.findById(id);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar notificação', detail: err.message });
    }
  }

  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await NotificacaoRepository.findById(id);
      if (!found) return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      const ok = await NotificacaoRepository.delete(id);
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao deletar notificação' });
      res.json({ success: true, message: 'Notificação deletada com sucesso' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao deletar notificação', detail: err.message });
    }
  }

  async deletarVarias(req, res) {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: 'Lista de IDs obrigatória' });
      const ok = await NotificacaoRepository.deleteMany(ids.map(Number));
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao deletar notificações' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao deletar notificações', detail: err.message });
    }
  }

  async marcarComoLida(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await NotificacaoRepository.findById(id);
      if (!found) return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      const ok = await NotificacaoRepository.marcarComoLida(id);
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao marcar notificação como lida' });
      const updated = await NotificacaoRepository.findById(id);
      res.json({ success: true, data: updated, message: 'Notificação marcada como lida' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao marcar notificação como lida', detail: err.message });
    }
  }

  async marcarVariasComoLidas(req, res) {
    try {
      const { ids } = req.body || {};
      if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ success: false, error: 'Lista de IDs obrigatória' });
      const ok = await NotificacaoRepository.marcarVariasComoLidas(ids.map(Number));
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao marcar notificações como lidas' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao marcar notificações como lidas', detail: err.message });
    }
  }

  async getRecentes(req, res) {
    try {
      const { limite = 10, usuario_id } = req.query;
      const notificacoes = await NotificacaoRepository.findRecentes(parseInt(limite), usuario_id);
      res.json({ success: true, data: notificacoes });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter notificações recentes', detail: err.message });
    }
  }

  async getContadores(req, res) {
    try {
      const { usuario_id } = req.query;
      const total = NotificacaoRepository.countAll ? await NotificacaoRepository.countAll({ usuario_id }) : (await NotificacaoRepository.findAll({ usuario_id })).length;
      const naoLidas = NotificacaoRepository.countNaoLidas ? await NotificacaoRepository.countNaoLidas(usuario_id) : (await NotificacaoRepository.findAll({ usuario_id, lida: false })).length;
      res.json({ success: true, data: { total, nao_lidas: naoLidas, lidas: total - naoLidas } });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter contadores', detail: err.message });
    }
  }

  async criarNotificacaoCadastro(req, res) {
    try {
      const { tipo_cadastro, nome_item, usuario_id } = req.body;
      if (!tipo_cadastro || !nome_item) return res.status(400).json({ success: false, error: 'tipo_cadastro e nome_item são obrigatórios' });
      const notificacao = Notificacao.criarNotificacaoCadastro(tipo_cadastro, nome_item, usuario_id);
      const id = await NotificacaoRepository.create(notificacao);
      const created = await NotificacaoRepository.findById(id);
      res.json({ success: true, data: created });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao criar notificação de cadastro', detail: err.message });
    }
  }

  async criarNotificacaoEstoqueBaixo(req, res) {
    try {
      const { produto, usuario_id } = req.body;
      if (!produto || !produto.nome || produto.estoque_atual === undefined || produto.estoque_minimo === undefined) return res.status(400).json({ success: false, error: 'Dados do produto são obrigatórios (nome, estoque_atual, estoque_minimo)' });
      const notificacao = Notificacao.criarNotificacaoEstoqueBaixo(produto, usuario_id);
      const id = await NotificacaoRepository.create(notificacao);
      const created = await NotificacaoRepository.findById(id);
      res.json({ success: true, data: created });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao criar notificação de estoque baixo', detail: err.message });
    }
  }
}

async function criarNotificacao(data) {
  const tipo = normalizeTipo(data.tipo);
  const titulo = data.titulo || (tipo === 'estoque_baixo' ? 'Estoque baixo' : tipo === 'transacao_financeira' ? 'Transação financeira' : tipo === 'evento_proximo' ? 'Evento' : 'Cadastro');
  const descricao = data.mensagem || data.descricao || '';
  const usuario_id = data.id_usuario || data.usuario_id || null;
  const referencia_id = data.referencia_id || null;
  const referencia_tipo = data.referencia_tipo || (tipo === 'estoque_baixo' ? 'produto' : tipo === 'evento_proximo' ? 'evento' : tipo === 'transacao_financeira' ? 'financeiro' : null);
  const prioridade = data.prioridade || 'normal';
  const now = new Date();
  const twoMinAgo = new Date(now.getTime() - 2 * 60 * 1000);
  // Deduplicação: evita múltiplas notificações idênticas em curto intervalo
  try {
    const existentes = await NotificacaoRepository.findAll({ tipo, referencia_id, data_inicio: twoMinAgo.toISOString().slice(0, 19).replace('T', ' ') });
    const dup = (existentes || []).find(n => String(n.titulo) === String(titulo) && String(n.descricao) === String(descricao) && (usuario_id ? n.usuario_id === usuario_id : true));
    if (dup) {
      return { id: dup.id, tipo, titulo, descricao, prioridade, usuario_id, referencia_id, referencia_tipo };
    }
  } catch (_) {}

  const notificacao = new Notificacao({ tipo, titulo, descricao, prioridade, usuario_id, referencia_id, referencia_tipo });
  const errors = notificacao.validate();
  if (errors.length) throw new Error('Dados de notificação inválidos');
  const id = await NotificacaoRepository.create(notificacao);
  return { id, ...notificacao.toJSON() };
}

const controller = new NotificacaoController();
module.exports = controller;
module.exports.criarNotificacao = criarNotificacao;
