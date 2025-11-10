const db = require('../config/database');

const ProdutoBackupRepository = {
  async ensureTable() {
    const sql = `CREATE TABLE IF NOT EXISTS produtos_backup (
      backup_id INT(11) NOT NULL AUTO_INCREMENT,
      produto_id INT(11) NOT NULL,
      data_hora TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      quantidade INT(11) NULL,
      categoria VARCHAR(100) NULL,
      unidade_medida VARCHAR(50) NULL,
      observacao TEXT NULL,
      PRIMARY KEY (backup_id),
      KEY idx_produto_backup (produto_id, data_hora),
      CONSTRAINT fk_backup_produto FOREIGN KEY (produto_id) REFERENCES produtos(id) ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;`;
    await db.execute(sql);
  },

  async createBackup(produtoId) {
    await this.ensureTable();
    const [rows] = await db.execute(
      `SELECT quantidade, categoria, unidade_medida, observacao FROM produtos WHERE id = ? LIMIT 1`,
      [produtoId]
    );
    if (!Array.isArray(rows) || rows.length === 0) return null;
    const p = rows[0];
    const [result] = await db.execute(
      `INSERT INTO produtos_backup (produto_id, quantidade, categoria, unidade_medida, observacao) VALUES (?, ?, ?, ?, ?)`,
      [produtoId, p.quantidade ?? null, p.categoria ?? null, p.unidade_medida ?? null, p.observacao ?? null]
    );
    return result.insertId;
  }
};

module.exports = ProdutoBackupRepository;