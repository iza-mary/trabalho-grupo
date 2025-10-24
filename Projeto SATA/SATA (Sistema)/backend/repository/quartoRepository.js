const db = require('../config/database');
const Quarto = require('../models/quartos');

// Util simples de log padronizado para operações em quartos
function formatQuartoRecord(rowOrModel) {
  const r = rowOrModel.toJSON ? rowOrModel.toJSON() : rowOrModel;
  return {
    id: r.id,
    numero: r.numero,
    capacidade: r.capacidade,
    descricao: r.descricao ?? null,
    status: r.status,
    data_cadastro: r.data_cadastro || null,
    data_atualizacao: r.data_atualizacao || null
  };
}

function logQuartoOperation(operation, payload) {
  const ts = new Date().toISOString();
  console.log(JSON.stringify({
    scope: 'quartos',
    operation,
    timestamp: ts,
    ...payload
  }));
}

class QuartoRepository {
  async findAll() {
    try {
      const [rows] = await db.execute('SELECT id, numero, capacidade, descricao, status, data_cadastro, data_atualizacao FROM quartos ORDER BY numero ASC');
      return rows.map(row => new Quarto(row));
    } catch (error) {
      console.error('Erro no repository findAll:', error);
      throw new Error(`Erro ao buscar quartos: ${error.message}`);
    }
  }

  async search(search, status) {
    try {
      const params = [];
      let whereClauses = [];

      if (search && String(search).trim().length > 0) {
        const like = `%${String(search).trim()}%`;
        whereClauses.push('(numero LIKE ? OR descricao LIKE ?)');
        params.push(like, like);
      }

      if (status && String(status).trim().length > 0) {
        whereClauses.push('status = ?');
        params.push(String(status).trim());
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
      const sql = `SELECT id, numero, capacidade, descricao, status, data_cadastro, data_atualizacao FROM quartos ${whereSql} ORDER BY numero ASC`;

      const [rows] = await db.execute(sql, params);
      return rows.map(row => new Quarto(row));
    } catch (error) {
      console.error('Erro no repository search:', error);
      throw new Error(`Erro ao buscar quartos com filtros: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const [rows] = await db.execute('SELECT id, numero, capacidade, descricao, status, data_cadastro, data_atualizacao FROM quartos WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      return new Quarto(rows[0]);
    } catch (error) {
      console.error('Erro no repository findById:', error);
      throw new Error(`Erro ao buscar quarto por ID: ${error.message}`);
    }
  }

  async findByStatus(status) {
    try {
      const [rows] = await db.execute('SELECT id, numero, capacidade, descricao, status, data_cadastro, data_atualizacao FROM quartos WHERE status = ?', [status]);
      return rows.map(row => new Quarto(row));
    } catch (error) {
      console.error('Erro no repository findByStatus:', error);
      throw new Error(`Erro ao buscar quartos por status: ${error.message}`);
    }
  }

  async create(data) {
    const { id, ...dados } = data;
    const quarto = new Quarto({
      numero: dados.numero,
      capacidade: dados.capacidade,
      descricao: dados.descricao,
      // Força status padrão na criação, ignorando qualquer valor recebido
      status: 'disponivel'
    });

    const errors = quarto.validate();
    if (errors.length > 0) {
      const errMsg = errors.join(', ');
      console.error('Validação falhou no repository create:', errMsg);
      throw new Error(errMsg);
    }

    try {
      const [result] = await db.execute(
        'INSERT INTO quartos (numero, capacidade, descricao, status) VALUES (?, ?, ?, ?)',
        [
          quarto.numero,
          quarto.capacidade,
          quarto.descricao || null,
          quarto.status
        ]
      );

      const created = await this.findById(result.insertId);
      logQuartoOperation('insert', { result: 'success', record: formatQuartoRecord(created) });
      return created;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const msg = `Já existe um quarto com número ${quarto.numero}`;
        console.error('Erro de duplicidade no repository create:', msg);
        logQuartoOperation('insert', { result: 'error', message: msg, record: formatQuartoRecord(quarto) });
        throw new Error(msg);
      }
      console.error('Erro inesperado no repository create:', error);
      logQuartoOperation('insert', { result: 'error', message: error.message, record: formatQuartoRecord(quarto) });
      throw new Error(`Erro ao inserir quarto: ${error.message}`);
    }
  }

  async update(id, data) {
    const existing = await this.findById(id);
    if (!existing) {
      const msg = 'Quarto não encontrado para atualização';
      console.error(msg);
      throw new Error(msg);
    }

    const [rows] = await db.execute(
      'SELECT id FROM quartos WHERE numero = ? AND id != ?',
      [data.numero, id]
    );
    if (rows.length > 0) {
      const msg = `Já existe um quarto com número ${data.numero}`;
      console.error('Erro de duplicidade no repository update:', msg);
      const err = new Error(msg);
      err.code = 'ER_DUP_ENTRY';
      throw err;
    }

    const novoStatus = data.status || existing.status;
    const quartoAtualizado = new Quarto({
      id,
      numero: data.numero ?? existing.numero,
      capacidade: data.capacidade ?? existing.capacidade,
      descricao: data.descricao ?? existing.descricao,
      status: novoStatus
    });

    const errors = quartoAtualizado.validate();
    if (errors.length > 0) {
      const errMsg = errors.join(', ');
      console.error('Validação falhou no repository update:', errMsg);
      throw new Error(errMsg);
    }

    try {
      await db.execute(
        'UPDATE quartos SET numero = ?, capacidade = ?, descricao = ?, status = ? WHERE id = ?',
        [
          quartoAtualizado.numero,
          quartoAtualizado.capacidade,
          quartoAtualizado.descricao || null,
          quartoAtualizado.status,
          id
        ]
      );

      const updated = await this.findById(id);
      const statusChanged = existing.status !== updated.status;
      logQuartoOperation('update', { result: 'success', record: formatQuartoRecord(updated) });
      if (statusChanged) {
        logQuartoOperation('status_change', {
          result: 'success',
          before: { id: existing.id, status: existing.status },
          after: { id: updated.id, status: updated.status },
          record: formatQuartoRecord(updated)
        });
      }
      return updated;
    } catch (error) {
      console.error('Erro no repository update:', error);
      logQuartoOperation('update', { result: 'error', message: error.message, record: formatQuartoRecord(quartoAtualizado) });
      throw new Error(`Erro ao atualizar quarto: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const existente = await this.findById(id);
      const [result] = await db.execute('DELETE FROM quartos WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        const msg = 'Quarto não encontrado para exclusão';
        console.error(msg);
        throw new Error(msg);
      }
      logQuartoOperation('delete', { result: 'success', record: formatQuartoRecord(existente) });
    } catch (error) {
      console.error('Erro no repository delete:', error);
      logQuartoOperation('delete', { result: 'error', message: error.message, id });
      throw new Error(`Erro ao excluir quarto: ${error.message}`);
    }
  }
}

module.exports = new QuartoRepository();
