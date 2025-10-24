const Notificacao = require('../models/notificacao');
const NotificacaoRepository = require('../repository/notificacaoRepository');

class NotificacaoController {
  async getAll(req, res) {
    try {
      const { 
        tipo, 
        prioridade, 
        lida, 
        usuario_id, 
        referencia_tipo, 
        search, 
        data_inicio, 
        data_fim,
        page = 1, 
        pageSize = 20, 
        sort = 'data_criacao', 
        order = 'DESC' 
      } = req.query;

      const filters = {
        tipo,
        prioridade,
        lida: lida !== undefined ? lida === 'true' : undefined,
        usuario_id,
        referencia_tipo,
        search,
        data_inicio,
        data_fim,
        sort,
        order
      };

      // Paginação
      const limit = parseInt(pageSize);
      const offset = (parseInt(page) - 1) * limit;
      filters.limit = limit;
      filters.offset = offset;

      const [notificacoes, total] = await Promise.all([
        NotificacaoRepository.findAll(filters),
        NotificacaoRepository.countAll(filters)
      ]);

      const totalPages = Math.ceil(total / limit);

      res.json({ 
        success: true, 
        data: notificacoes,
        pagination: {
          page: parseInt(page),
          pageSize: limit,
          total,
          totalPages
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao listar notificações', detail: err.message });
    }
  }

  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const notificacao = await NotificacaoRepository.findById(id);
      if (!notificacao) {
        return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      }
      res.json({ success: true, data: notificacao });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter notificação', detail: err.message });
    }
  }

  async create(req, res) {
    try {
      const notificacao = new Notificacao(req.body);
      const errors = notificacao.validate();
      if (errors.length) {
        return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });
      }

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
      if (!found) {
        return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      }

      const notificacao = new Notificacao({ ...found, ...req.body, id });
      const errors = notificacao.validate();
      if (errors.length) {
        return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });
      }

      const ok = await NotificacaoRepository.update(id, notificacao);
      if (!ok) {
        return res.status(500).json({ success: false, error: 'Falha ao atualizar notificação' });
      }
      
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
      if (!found) {
        return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      }

      const ok = await NotificacaoRepository.delete(id);
      if (!ok) {
        return res.status(500).json({ success: false, error: 'Falha ao deletar notificação' });
      }
      
      res.json({ success: true, message: 'Notificação deletada com sucesso' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao deletar notificação', detail: err.message });
    }
  }

  async marcarComoLida(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await NotificacaoRepository.findById(id);
      if (!found) {
        return res.status(404).json({ success: false, error: 'Notificação não encontrada' });
      }

      const ok = await NotificacaoRepository.marcarComoLida(id);
      if (!ok) {
        return res.status(500).json({ success: false, error: 'Falha ao marcar notificação como lida' });
      }
      
      const updated = await NotificacaoRepository.findById(id);
      res.json({ success: true, data: updated, message: 'Notificação marcada como lida' });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao marcar notificação como lida', detail: err.message });
    }
  }

  async marcarVariasComoLidas(req, res) {
    try {
      const { ids } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ success: false, error: 'IDs das notificações são obrigatórios' });
      }

      const ok = await NotificacaoRepository.marcarVariasComoLidas(ids);
      if (!ok) {
        return res.status(500).json({ success: false, error: 'Falha ao marcar notificações como lidas' });
      }
      
      res.json({ success: true, message: `${ids.length} notificações marcadas como lidas` });
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
      
      const [total, naoLidas] = await Promise.all([
        NotificacaoRepository.countAll({ usuario_id }),
        NotificacaoRepository.countNaoLidas(usuario_id)
      ]);

      res.json({ 
        success: true, 
        data: {
          total,
          nao_lidas: naoLidas,
          lidas: total - naoLidas
        }
      });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter contadores', detail: err.message });
    }
  }

  // Métodos para criar notificações específicas
  async criarNotificacaoCadastro(req, res) {
    try {
      const { tipo_cadastro, nome_item, usuario_id } = req.body;
      
      if (!tipo_cadastro || !nome_item) {
        return res.status(400).json({ 
          success: false, 
          error: 'tipo_cadastro e nome_item são obrigatórios' 
        });
      }

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
      
      if (!produto || !produto.nome || produto.estoque_atual === undefined || produto.estoque_minimo === undefined) {
        return res.status(400).json({ 
          success: false, 
          error: 'Dados do produto são obrigatórios (nome, estoque_atual, estoque_minimo)' 
        });
      }

      const notificacao = Notificacao.criarNotificacaoEstoqueBaixo(produto, usuario_id);
      const id = await NotificacaoRepository.create(notificacao);
      const created = await NotificacaoRepository.findById(id);
      
      res.json({ success: true, data: created });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao criar notificação de estoque baixo', detail: err.message });
    }
  }
}

module.exports = new NotificacaoController();