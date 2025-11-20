const Produto = require('../models/produto');
const ProdutoRepository = require('../repository/produtoRepository');
const MovimentoEstoqueRepository = require('../repository/movimentoEstoqueRepository');

class ProdutoController {
  async getAll(req, res) {
    try {
      const { search, categoria, minPreco, maxPreco, page, pageSize, sort, order } = req.query;
      const result = await ProdutoRepository.searchPaginated({ search, categoria, minPreco, maxPreco, page, pageSize, sort, order });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao listar produtos', detail: err.message });
    }
  }

  async getById(req, res) {
    try {
      const id = Number(req.params.id);
      const produto = await ProdutoRepository.findById(id);
      if (!produto) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
      res.json({ success: true, data: produto });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter produto', detail: err.message });
    }
  }

  async create(req, res) {
    try {
      const produto = new Produto(req.body);
      const id = await ProdutoRepository.create(produto);
      const created = await ProdutoRepository.findById(id);
      res.json({ success: true, data: created });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao criar produto', detail: err.message });
    }
  }

  async update(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await ProdutoRepository.findById(id);
      if (!found) return res.status(404).json({ success: false, error: 'Produto não encontrado' });

      const produto = new Produto({ ...found, ...req.body, id });
      const errors = produto.validate?.({ forUpdate: true }) || [];
      if (errors.length) return res.status(400).json({ success: false, error: 'Dados inválidos', details: errors });

      const ok = await ProdutoRepository.update(id, produto);
      if (!ok) return res.status(500).json({ success: false, error: 'Falha ao atualizar produto' });
      const updated = await ProdutoRepository.findById(id);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao atualizar produto', detail: err.message });
    }
  }

  async delete(req, res) {
    try {
      const id = Number(req.params.id);
      const ok = await ProdutoRepository.delete(id);
      if (!ok) return res.status(404).json({ success: false, error: 'Produto não encontrado' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao excluir produto', detail: err.message });
    }
  }

  async movimentar(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await ProdutoRepository.findById(id);
      if (!found) return res.status(404).json({ success: false, error: 'Produto não encontrado' });

      const { tipo, quantidade, observacao } = req.body;
      const qty = Number(quantidade);
      if (!['entrada','saida'].includes(String(tipo))) {
        return res.status(400).json({ success: false, error: 'Tipo de operação inválido' });
      }
      if (!Number.isFinite(qty) || qty <= 0) {
        return res.status(400).json({ success: false, error: 'Quantidade inválida' });
      }

      const atual = Number(found.quantidade || 0);
      let novo = atual;
      if (tipo === 'entrada') {
        novo = atual + qty;
      } else {
        if (qty > atual) {
          return res.status(400).json({ success: false, error: 'Não é possível remover quantidade superior ao estoque atual' });
        }
        novo = atual - qty;
      }

      const fast = await ProdutoRepository.updateQuantidadeFast(id, novo);
      if (!fast.ok) return res.status(500).json({ success: false, error: 'Falha ao registrar movimentação' });
      const updated = fast.updated;

      const abaixoMinimo = Number(updated.quantidade || 0) < Number(updated.estoque_minimo || 0);
      res.json({ success: true, data: updated, abaixoMinimo });

      // Registrar movimento de estoque
      try {
        await MovimentoEstoqueRepository.create({
          produto_id: id,
          tipo,
          quantidade: qty,
          saldo_anterior: fast.prevQuantidade,
          saldo_posterior: novo,
          doacao_id: null,
          responsavel_id: req.user?.id ?? null,
          responsavel_nome: req.user?.username ?? null,
          motivo: null,
          observacao: observacao || null,
        });
      } catch (logErr) {
        // Evitar quebrar o fluxo principal por falhas de log
        console.error('Falha ao registrar movimento de estoque:', logErr.message);
      }
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao movimentar estoque', detail: err.message });
    }
  }

  async historico(req, res) {
    try {
      const id = Number(req.params.id);
      const found = await ProdutoRepository.findById(id);
      if (!found) return res.status(404).json({ success: false, error: 'Produto não encontrado' });

      const { startDate, endDate, search, sort, order, page, pageSize } = req.query;
      const result = await MovimentoEstoqueRepository.searchPaginated({
        produtoId: id,
        startDate,
        endDate,
        search,
        sort,
        order,
        page,
        pageSize,
      });
      res.json({ success: true, ...result });
    } catch (err) {
      res.status(500).json({ success: false, error: 'Erro ao obter histórico de estoque', detail: err.message });
    }
  }
}

module.exports = ProdutoController;
/*
  Controlador de Produtos
  - CRUD de produtos, validações e movimentação de estoque.
  - Integra com repositórios de produto e movimentação para registrar histórico.
*/