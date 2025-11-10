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
      doacao_id INT(11) NULL,
      responsavel_id INT(11) NULL,
      responsavel_nome VARCHAR(100) NULL,
      motivo TEXT NULL,
      observacao TEXT NULL,
      PRIMARY KEY (id),
      KEY idx_produto_data (produto_id, data_hora),
      KEY idx_doacao (doacao_id),
      CONSTRAINT fk_mov_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;
    await db.execute(sql);

    // Garantir coluna e FK de doacao_id caso tabela já exista sem ela
    const [colCheck] = await db.execute(`
      SELECT COUNT(*) AS cnt
      FROM information_schema.columns
      WHERE table_schema = DATABASE()
        AND table_name = 'movimentos_estoque'
        AND column_name = 'doacao_id'
    `);
    const hasDoacaoId = Array.isArray(colCheck) && colCheck.length && Number(colCheck[0].cnt) > 0;
    if (!hasDoacaoId) {
      await db.execute(`ALTER TABLE movimentos_estoque ADD COLUMN doacao_id INT(11) NULL`);
      await db.execute(`ALTER TABLE movimentos_estoque ADD KEY idx_doacao (doacao_id)`);
      try {
        await db.execute(`ALTER TABLE movimentos_estoque ADD CONSTRAINT fk_mov_doacao FOREIGN KEY (doacao_id) REFERENCES doacoes(id) ON DELETE SET NULL ON UPDATE CASCADE`);
      } catch (_) { /* FK pode já existir em alguns ambientes */ }
    }

    // Garantir imutabilidade: criar triggers para bloquear UPDATE/DELETE
    try {
      const [trgUpd] = await db.execute(`
        SELECT COUNT(*) AS cnt FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'mov_estoque_prevent_update'
      `);
      if (!(Array.isArray(trgUpd) && trgUpd.length && Number(trgUpd[0].cnt) > 0)) {
        await db.execute(`
          CREATE TRIGGER mov_estoque_prevent_update BEFORE UPDATE ON movimentos_estoque
          FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Movimentos de estoque são imutáveis';
        `);
      }
    } catch (_) { /* Ignora falha de criação de trigger para não quebrar histórico */ }
    try {
      const [trgDel] = await db.execute(`
        SELECT COUNT(*) AS cnt FROM information_schema.TRIGGERS
        WHERE TRIGGER_SCHEMA = DATABASE() AND TRIGGER_NAME = 'mov_estoque_prevent_delete'
      `);
      if (!(Array.isArray(trgDel) && trgDel.length && Number(trgDel[0].cnt) > 0)) {
        await db.execute(`
          CREATE TRIGGER mov_estoque_prevent_delete BEFORE DELETE ON movimentos_estoque
          FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Movimentos de estoque são imutáveis';
        `);
      }
    } catch (_) { /* Ignora falha de criação de trigger para não quebrar histórico */ }
  },

  async create(mov) {
    await this.ensureTable();
    const sql = `INSERT INTO movimentos_estoque
      (produto_id, tipo, quantidade, saldo_anterior, saldo_posterior, doacao_id, responsavel_id, responsavel_nome, motivo, observacao)
      VALUES (?,?,?,?,?,?,?,?,?,?)`;
    const params = [
      mov.produto_id,
      mov.tipo,
      mov.quantidade,
      mov.saldo_anterior,
      mov.saldo_posterior,
      mov.doacao_id ?? null,
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