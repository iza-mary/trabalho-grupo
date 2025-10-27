const db = require('../config/database');

const MovimentoEstoqueRepository = {
  async ensureTable() {
    const sql = `CREATE TABLE IF NOT EXISTS movimentos_estoque (
      id INT(11) NOT NULL AUTO_INCREMENT,
      produto_id INT(11) NOT NULL,
      data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      tipo ENUM('entrada','saida','ajuste') NOT NULL,
      quantidade INT(11) NOT NULL,
      saldo_anterior INT(11) NOT NULL,
      saldo_posterior INT(11) NOT NULL,
      responsavel_id INT(11) NULL,
      responsavel_nome VARCHAR(100) NULL,
      motivo TEXT NULL,
      observacao TEXT NULL,
      PRIMARY KEY (id),
      KEY idx_produto_data (produto_id, data_hora),
      CONSTRAINT fk_mov_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;
    await db.execute(sql);
  },

  async create(mov) {
    await this.ensureTable();
    const sql = `INSERT INTO movimentos_estoque
      (produto_id, tipo, quantidade, saldo_anterior, saldo_posterior, responsavel_id, responsavel_nome, motivo, observacao)
      VALUES (?,?,?,?,?,?,?,?,?)`;
    const params = [
      mov.produto_id,
      mov.tipo,
      mov.quantidade,
      mov.saldo_anterior,
      mov.saldo_posterior,
      mov.responsavel_id ?? null,
      mov.responsavel_nome ?? null,
      mov.motivo ?? null,
      mov.observacao ?? null,
    ];
    const [result] = await db.execute(sql, params);
    return result.insertId;
  },

  async searchPaginated({ produtoId, startDate, endDate, search, sort = 'data_hora', order = 'DESC', page = 1, pageSize = 10 }) {
    await this.ensureTable();
    const where = ['produto_id = ?'];
    const params = [produtoId];
    if (startDate) { where.push('data_hora >= ?'); params.push(startDate); }
    if (endDate) { where.push('data_hora <= ?'); params.push(endDate); }
    if (search) {
      where.push('(COALESCE(motivo, "") LIKE ? OR COALESCE(observacao, "") LIKE ? OR COALESCE(responsavel_nome, "") LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    const allowedSort = new Set(['data_hora','tipo','quantidade','saldo_anterior','saldo_posterior','responsavel_nome']);
    const sortField = allowedSort.has(String(sort)) ? String(sort) : 'data_hora';
    const sortOrder = String(order).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const offset = (Math.max(Number(page) || 1, 1) - 1) * (Math.max(Number(pageSize) || 10, 1));
    const limit = Math.max(Number(pageSize) || 10, 1);

    const baseWhere = where.length ? `WHERE ${where.join(' AND ')}` : '';
    const [rows] = await db.execute(
      `SELECT id, produto_id, data_hora, tipo, quantidade, saldo_anterior, saldo_posterior, responsavel_id, responsavel_nome, motivo, observacao
       FROM movimentos_estoque
       ${baseWhere}
       ORDER BY ${sortField} ${sortOrder}
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    const [countRows] = await db.execute(
      `SELECT COUNT(*) AS total FROM movimentos_estoque ${baseWhere}`,
      params
    );
    const total = (Array.isArray(countRows) && countRows.length) ? Number(countRows[0].total) : 0;
    return {
      data: rows,
      page: Number(page) || 1,
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit)
    };
  }
};

module.exports = MovimentoEstoqueRepository;