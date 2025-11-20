const db = require('../config/database');
const MovimentoEstoqueRepository = require('./movimentoEstoqueRepository');

const sortableFields = new Set(['nome','preco','quantidade','data_cadastro','data_atualizacao']);

const ProdutoRepository = {
  async create(produto) {
    const sql = `INSERT INTO produtos (nome, categoria, unidade_medida, estoque_atual, estoque_minimo, observacao, descricao, preco, quantidade)
                 VALUES (?,?,?,?,?,?,?,?,?)`;
    const params = [
      produto.nome,
      produto.categoria,
      produto.unidade_medida,
      produto.estoque_atual,
      produto.estoque_minimo,
      produto.observacao,
      produto.descricao,
      produto.preco,
      produto.quantidade,
    ];
    const [result] = await db.execute(sql, params);
    return result.insertId;
  },

  async update(id, produto) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();

      // Ler registro anterior para delta e sincronização
      const [prevRows] = await conn.execute('SELECT quantidade, unidade_medida, categoria FROM produtos WHERE id=? FOR UPDATE', [id]);
      if (!Array.isArray(prevRows) || prevRows.length === 0) {
        await conn.rollback();
        conn.release();
        return false;
      }
      const prevQuantidade = Number(prevRows[0].quantidade || 0);
      const prevUnidade = prevRows[0].unidade_medida;
      const prevCategoria = prevRows[0].categoria;

      const sql = `UPDATE produtos SET nome=?, categoria=?, unidade_medida=?, estoque_atual=?, estoque_minimo=?, observacao=?, descricao=?, preco=?, quantidade=?, data_atualizacao = NOW() WHERE id=?`;
      const params = [
        produto.nome,
        produto.categoria,
        produto.unidade_medida,
        produto.estoque_atual,
        produto.estoque_minimo,
        produto.observacao,
        produto.descricao,
        produto.preco,
        produto.quantidade,
        id,
      ];
      const [result] = await conn.execute(sql, params);
      const ok = result.affectedRows > 0;

      if (!ok) {
        await conn.rollback();
        conn.release();
        return false;
      }

      // Atualizar unidade nas doações vinculadas (metadata sync) — quantidade da doação é imutável
      try {
        await conn.execute(
          `UPDATE doacaoproduto SET unidade_medida = ? WHERE produto_id = ?`,
          [produto.unidade_medida, id]
        );
      } catch (_) {}

      // Registrar movimento de ajuste se a quantidade do produto mudou
      const delta = Number(produto.quantidade || 0) - prevQuantidade;
      if (delta !== 0) {
        try {
          await MovimentoEstoqueRepository.create({
            produto_id: id,
            tipo: 'ajuste',
            quantidade: Number(delta),
            saldo_anterior: prevQuantidade,
            saldo_posterior: Number(produto.quantidade || 0),
            doacao_id: null,
            responsavel_id: null,
            responsavel_nome: null,
            motivo: 'Ajuste manual de produto',
            observacao: 'Atualização direta no cadastro do produto',
          });
        } catch (_) {}
      }

      await conn.commit();
      conn.release();
      return true;
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw err;
    }
  },

  async updateQuantidadeFast(id, novaQuantidade) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      const [prevRows] = await conn.execute('SELECT quantidade FROM produtos WHERE id=? FOR UPDATE', [id]);
      if (!Array.isArray(prevRows) || prevRows.length === 0) {
        await conn.rollback();
        conn.release();
        return { ok: false, prevQuantidade: 0, updated: null };
      }
      const prevQuantidade = Number(prevRows[0].quantidade || 0);
      const [upd] = await conn.execute('UPDATE produtos SET quantidade=?, data_atualizacao = NOW() WHERE id=?', [novaQuantidade, id]);
      const ok = upd.affectedRows > 0;
      const [updatedRows] = await conn.execute('SELECT * FROM produtos WHERE id=?', [id]);
      await conn.commit();
      conn.release();
      return { ok, prevQuantidade, updated: updatedRows[0] || null };
    } catch (err) {
      try { await conn.rollback(); } catch (_) {}
      conn.release();
      throw err;
    }
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM produtos WHERE id=?', [id]);
    return result.affectedRows > 0;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM produtos WHERE id=?', [id]);
    return rows[0] || null;
  },

  async searchPaginated({ search, categoria, minPreco, maxPreco, page = 1, pageSize = 10, sort = 'nome', order = 'ASC' }) {
    const where = [];
    const params = [];

    if (search) {
      where.push('(nome LIKE ? OR descricao LIKE ?)');
      const like = `%${search}%`;
      params.push(like, like);
    }
    if (categoria) {
      where.push('categoria = ?');
      params.push(categoria);
    }
    if (minPreco != null) {
      where.push('preco >= ?');
      params.push(Number(minPreco));
    }
    if (maxPreco != null) {
      where.push('preco <= ?');
      params.push(Number(maxPreco));
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const [[{ total }]] = await db.execute(`SELECT COUNT(*) as total FROM produtos ${whereSql}`, params);

    const validSort = sortableFields.has(sort) ? sort : 'nome';
    const validOrder = order && order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    const limit = Math.max(1, Number(pageSize));
    const offset = Math.max(0, (Math.max(1, Number(page)) - 1) * limit);

    const [rows] = await db.execute(
      `SELECT * FROM produtos ${whereSql} ORDER BY ${validSort} ${validOrder} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { data: rows, total, page: Number(page), pageSize: limit };
  }
};

module.exports = ProdutoRepository;
/*
  Repositório de Produtos
  - Persistência e consultas paginadas de produtos, atualizações e deleções.
*/