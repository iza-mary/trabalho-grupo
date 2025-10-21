const db = require('../config/database');

const sortableFields = new Set(['data_criacao', 'prioridade', 'tipo', 'titulo']);

const NotificacaoRepository = {
  async create(notificacao) {
    const sql = `INSERT INTO notificacoes (tipo, titulo, descricao, prioridade, lida, usuario_id, referencia_id, referencia_tipo, data_criacao)
                 VALUES (?,?,?,?,?,?,?,?,NOW())`;
    const params = [
      notificacao.tipo,
      notificacao.titulo,
      notificacao.descricao,
      notificacao.prioridade,
      notificacao.lida,
      notificacao.usuario_id,
      notificacao.referencia_id,
      notificacao.referencia_tipo
    ];
    const [result] = await db.execute(sql, params);
    return result.insertId;
  },

  async update(id, notificacao) {
    const sql = `UPDATE notificacoes SET tipo=?, titulo=?, descricao=?, prioridade=?, lida=?, usuario_id=?, referencia_id=?, referencia_tipo=? WHERE id=?`;
    const params = [
      notificacao.tipo,
      notificacao.titulo,
      notificacao.descricao,
      notificacao.prioridade,
      notificacao.lida,
      notificacao.usuario_id,
      notificacao.referencia_id,
      notificacao.referencia_tipo,
      id
    ];
    const [result] = await db.execute(sql, params);
    return result.affectedRows > 0;
  },

  async marcarComoLida(id) {
    const sql = `UPDATE notificacoes SET lida = 1, data_leitura = NOW() WHERE id = ?`;
    const [result] = await db.execute(sql, [id]);
    return result.affectedRows > 0;
  },

  async marcarVariasComoLidas(ids) {
    if (!ids || ids.length === 0) return false;
    const placeholders = ids.map(() => '?').join(',');
    const sql = `UPDATE notificacoes SET lida = 1, data_leitura = NOW() WHERE id IN (${placeholders})`;
    const [result] = await db.execute(sql, ids);
    return result.affectedRows > 0;
  },

  async delete(id) {
    const [result] = await db.execute('DELETE FROM notificacoes WHERE id=?', [id]);
    return result.affectedRows > 0;
  },

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM notificacoes WHERE id=?', [id]);
    return rows[0] || null;
  },

  async findAll(filters = {}) {
    let sql = 'SELECT * FROM notificacoes WHERE 1=1';
    const params = [];

    // Filtros
    if (filters.tipo) {
      sql += ' AND tipo = ?';
      params.push(filters.tipo);
    }

    if (filters.prioridade) {
      sql += ' AND prioridade = ?';
      params.push(filters.prioridade);
    }

    if (filters.lida !== undefined) {
      sql += ' AND lida = ?';
      params.push(filters.lida ? 1 : 0);
    }

    if (filters.usuario_id) {
      sql += ' AND usuario_id = ?';
      params.push(filters.usuario_id);
    }

    if (filters.referencia_tipo) {
      sql += ' AND referencia_tipo = ?';
      params.push(filters.referencia_tipo);
    }

    // Busca por texto
    if (filters.search) {
      sql += ' AND (titulo LIKE ? OR descricao LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    // Filtro por data
    if (filters.data_inicio) {
      sql += ' AND data_criacao >= ?';
      params.push(filters.data_inicio);
    }

    if (filters.data_fim) {
      sql += ' AND data_criacao <= ?';
      params.push(filters.data_fim);
    }

    // Ordenação
    const sort = filters.sort && sortableFields.has(filters.sort) ? filters.sort : 'data_criacao';
    const order = filters.order === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY ${sort} ${order}`;

    // Paginação
    if (filters.limit) {
      sql += ' LIMIT ?';
      params.push(parseInt(filters.limit));
      
      if (filters.offset) {
        sql += ' OFFSET ?';
        params.push(parseInt(filters.offset));
      }
    }

    const [rows] = await db.execute(sql, params);
    return rows;
  },

  async countAll(filters = {}) {
    let sql = 'SELECT COUNT(*) as total FROM notificacoes WHERE 1=1';
    const params = [];

    // Aplicar os mesmos filtros da consulta principal
    if (filters.tipo) {
      sql += ' AND tipo = ?';
      params.push(filters.tipo);
    }

    if (filters.prioridade) {
      sql += ' AND prioridade = ?';
      params.push(filters.prioridade);
    }

    if (filters.lida !== undefined) {
      sql += ' AND lida = ?';
      params.push(filters.lida ? 1 : 0);
    }

    if (filters.usuario_id) {
      sql += ' AND usuario_id = ?';
      params.push(filters.usuario_id);
    }

    if (filters.referencia_tipo) {
      sql += ' AND referencia_tipo = ?';
      params.push(filters.referencia_tipo);
    }

    if (filters.search) {
      sql += ' AND (titulo LIKE ? OR descricao LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters.data_inicio) {
      sql += ' AND data_criacao >= ?';
      params.push(filters.data_inicio);
    }

    if (filters.data_fim) {
      sql += ' AND data_criacao <= ?';
      params.push(filters.data_fim);
    }

    const [rows] = await db.execute(sql, params);
    return rows[0].total;
  },

  async countNaoLidas(usuario_id = null) {
    let sql = 'SELECT COUNT(*) as total FROM notificacoes WHERE lida = 0';
    const params = [];

    if (usuario_id) {
      sql += ' AND usuario_id = ?';
      params.push(usuario_id);
    }

    const [rows] = await db.execute(sql, params);
    return rows[0].total;
  },

  async findRecentes(limite = 10, usuario_id = null) {
    let sql = 'SELECT * FROM notificacoes WHERE 1=1';
    const params = [];

    if (usuario_id) {
      sql += ' AND usuario_id = ?';
      params.push(usuario_id);
    }

    sql += ' ORDER BY data_criacao DESC LIMIT ?';
    params.push(limite);

    const [rows] = await db.execute(sql, params);
    return rows;
  }
};

module.exports = NotificacaoRepository;