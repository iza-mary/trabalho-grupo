const db = require('../config/database');

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
    const sql = `UPDATE produtos SET nome=?, categoria=?, unidade_medida=?, estoque_atual=?, estoque_minimo=?, observacao=?, descricao=?, preco=?, quantidade=? WHERE id=?`;
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
    const [result] = await db.execute(sql, params);
    return result.affectedRows > 0;
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