const financeiroRepository = require('../repository/financeiroRepository');
const { criarNotificacao } = require("./notificacaoController");

class FinanceiroController {
  async getAll(req, res) {
    try {
      const items = await financeiroRepository.findAll();
      return res.json({ success: true, data: items.map(i => i.toJSON()), total: items.length });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const item = await financeiroRepository.findById(id);
      if (!item) return res.status(404).json({ success: false, message: 'Registro não encontrado' });
      return res.json({ success: true, data: item.toJSON() });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const criado = await financeiroRepository.create(req.body || {});
      try {
        await criarNotificacao({
            mensagem: `Novo registro financeiro do tipo "${criado.tipo}" no valor de R$ ${criado.valor} criado.`,
            tipo: 'transacao_financeira',
            referencia_id: criado.id,
            id_usuario: req.user ? req.user.id : null
        });
      } catch (notificacaoError) {
          console.error('Falha ao criar notificação para novo registro financeiro:', notificacaoError);
      }
      return res.status(201).json({ success: true, data: criado.toJSON(), message: 'Registro criado com sucesso' });
    } catch (error) {
      const status = error.status === 400 ? 400 : 500;
      return res.status(status).json({ success: false, message: error.message || 'Erro ao criar registro' });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const atualizado = await financeiroRepository.update(id, req.body || {});
      if (!atualizado) return res.status(404).json({ success: false, message: 'Registro não encontrado' });
      try {
        await criarNotificacao({
            mensagem: `O registro financeiro do tipo "${atualizado.tipo}" no valor de R$ ${atualizado.valor} foi atualizado.`,
            tipo: 'transacao_financeira',
            referencia_id: id,
            id_usuario: req.user ? req.user.id : null
        });
      } catch (notificacaoError) {
          console.error('Falha ao criar notificação para atualização de registro financeiro:', notificacaoError);
      }
      return res.json({ success: true, data: atualizado.toJSON(), message: 'Registro atualizado com sucesso' });
    } catch (error) {
      const status = error.status === 400 ? 400 : 500;
      return res.status(status).json({ success: false, message: error.message || 'Erro ao atualizar registro' });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      const ok = await financeiroRepository.remove(id);
      if (!ok) return res.status(404).json({ success: false, message: 'Registro não encontrado' });
      try {
        await criarNotificacao({
            mensagem: `O registro financeiro com ID ${id} foi removido.`,
            tipo: 'transacao_financeira',
            referencia_id: id,
            id_usuario: req.user ? req.user.id : null
        });
      } catch (notificacaoError) {
          console.error('Falha ao criar notificação para remoção de registro financeiro:', notificacaoError);
      }
      return res.json({ success: true, message: 'Registro removido com sucesso' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new FinanceiroController();
/*
  Controlador Financeiro
  - Entradas e saídas locais, com filtros e cálculo de saldos.
*/
