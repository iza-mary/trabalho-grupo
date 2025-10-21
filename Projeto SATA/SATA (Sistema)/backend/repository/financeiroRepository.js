const db = require('../config/database');
const Financeiro = require('../models/financeiro');

class FinanceiroRepository {
  async findAll() {
    const [rows] = await db.execute(
      'SELECT id, descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, DATE_FORMAT(data, "%Y-%m-%d") AS data, observacao, created_at, updated_at FROM financeiro ORDER BY data DESC, id DESC'
    );
    return rows.map(r => new Financeiro(r));
  }

  async findById(id) {
    const [rows] = await db.execute(
      'SELECT id, descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, DATE_FORMAT(data, "%Y-%m-%d") AS data, observacao, created_at, updated_at FROM financeiro WHERE id = ?',
      [id]
    );
    if (rows.length === 0) return null;
    return new Financeiro(rows[0]);
  }

  async create(data) {
    const financeiro = new Financeiro(data);
    const errors = financeiro.validate();
    if (errors.length > 0) {
      const err = new Error(errors.join(', '));
      err.status = 400;
      throw err;
    }

    const [result] = await db.execute(
      'INSERT INTO financeiro (descricao, valor, tipo, categoria, forma_pagamento, recorrente, frequencia_recorrencia, ocorrencias_recorrencia, data, observacao) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        financeiro.descricao,
        financeiro.valor,
        financeiro.tipo,
        financeiro.categoria,
        financeiro.forma_pagamento,
        financeiro.recorrente ? 1 : 0,
        financeiro.frequencia_recorrencia || null,
        financeiro.ocorrencias_recorrencia != null ? Number(financeiro.ocorrencias_recorrencia) : null,
        financeiro.data,
        financeiro.observacao || null,
      ]
    );
    return this.findById(result.insertId);
  }

  async update(id, data) {
    const existente = await this.findById(id);
    if (!existente) return null;

    const merged = new Financeiro({
      id,
      descricao: data.descricao ?? existente.descricao,
      valor: data.valor != null ? Number(data.valor) : existente.valor,
      tipo: data.tipo ?? existente.tipo,
      categoria: data.categoria ?? existente.categoria,
      forma_pagamento: data.forma_pagamento ?? existente.forma_pagamento,
      data: data.data ?? existente.data,
      observacao: data.observacao ?? existente.observacao,
      recorrente: data.recorrente ?? existente.recorrente,
      frequencia_recorrencia: data.frequencia_recorrencia ?? existente.frequencia_recorrencia,
      ocorrencias_recorrencia: data.ocorrencias_recorrencia != null ? Number(data.ocorrencias_recorrencia) : existente.ocorrencias_recorrencia,
    });

    const errors = merged.validate();
    if (errors.length > 0) {
      const err = new Error(errors.join(', '));
      err.status = 400;
      throw err;
    }

    await db.execute(
      'UPDATE financeiro SET descricao = ?, valor = ?, tipo = ?, categoria = ?, forma_pagamento = ?, recorrente = ?, frequencia_recorrencia = ?, ocorrencias_recorrencia = ?, data = ?, observacao = ? WHERE id = ?',
      [
        merged.descricao,
        merged.valor,
        merged.tipo,
        merged.categoria,
        merged.forma_pagamento,
        merged.recorrente ? 1 : 0,
        merged.frequencia_recorrencia || null,
        merged.ocorrencias_recorrencia != null ? Number(merged.ocorrencias_recorrencia) : null,
        merged.data,
        merged.observacao || null,
        id,
      ]
    );
    return this.findById(id);
  }

  async remove(id) {
    const [result] = await db.execute('DELETE FROM financeiro WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new FinanceiroRepository();