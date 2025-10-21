const db = require('../confg/database');
const Quarto = require('../models/quartos');

class QuartoRepository {
  async findAll() {
    try {
      const [rows] = await db.execute('SELECT * FROM quartos ORDER BY numero ASC');
      return rows.map(row => new Quarto(row));
    } catch (error) {
      console.error('Erro no repository findAll:', error);
      throw new Error(`Erro ao buscar quartos: ${error.message}`);
    }
  }

  async findByTipo(tipo) {
    try {
      const [rows] = await db.execute('SELECT * FROM quartos WHERE tipo = ?', [tipo]);
      return rows.map(row => new Quarto(row));
    } catch (error) {
      console.error('Erro no repository findByTipo:', error);
      throw new Error(`Erro ao buscar quartos por tipo: ${error.message}`);
    }
  }

  async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM quartos WHERE id = ?', [id]);
      if (rows.length === 0) return null;
      return new Quarto(rows[0]);
    } catch (error) {
      console.error('Erro no repository findById:', error);
      throw new Error(`Erro ao buscar quarto por ID: ${error.message}`);
    }
  }

  async findByStatus(status) {
    try {
      const [rows] = await db.execute('SELECT * FROM quartos WHERE status = ?', [status]);
      return rows.map(row => new Quarto(row));
    } catch (error) {
      console.error('Erro no repository findByStatus:', error);
      throw new Error(`Erro ao buscar quartos por status: ${error.message}`);
    }
  }

  async create(data) {
   
    const { id, ...dados } = data;
    const quarto = new Quarto(dados);
    quarto.status = 'Disponível';

    const errors = quarto.validate();
    if (errors.length > 0) {
      const errMsg = errors.join(', ');
      console.error('Validação falhou no repository create:', errMsg);
      throw new Error(errMsg);
    }

    try {
      const [result] = await db.execute(
        'INSERT INTO quartos (numero, tipo, leitos, ocupacao, status, andar, observacao) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
          quarto.numero,
          quarto.tipo,
          quarto.leitos,
          quarto.ocupacao,
          quarto.status,
          quarto.andar,
          quarto.observacao || null
        ]
      );
      
      quarto.id = result.insertId;
      return quarto;
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        const msg = `Já existe um quarto com número ${quarto.numero}`;
        console.error('Erro de duplicidade no repository create:', msg);
        throw new Error(msg);
      }
      console.error('Erro inesperado no repository create:', error);
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

   
    const status = data.status || existing.status;

    const quarto = new Quarto({
      id,
      numero: data.numero,
      tipo: data.tipo,
      leitos: data.leitos,
      ocupacao: data.ocupacao !== undefined ? data.ocupacao : existing.ocupacao,
      status,
      andar: data.andar,
      observacao: data.observacao
    });

    const errors = quarto.validate();
    if (errors.length > 0) {
      const errMsg = errors.join(', ');
      console.error('Validação falhou no repository update:', errMsg);
      throw new Error(errMsg);
    }

    try {
      await db.execute(
        'UPDATE quartos SET numero = ?, tipo = ?, leitos = ?, ocupacao = ?, status = ?, andar = ?, observacao = ? WHERE id = ?',
        [
          quarto.numero,
          quarto.tipo,
          quarto.leitos,
          quarto.ocupacao,
          quarto.status,
          quarto.andar,
          quarto.observacao || null,
          id
        ]
      );

      return await this.findById(id);
    } catch (error) {
      console.error('Erro no repository update:', error);
      throw new Error(`Erro ao atualizar quarto: ${error.message}`);
    }
  }

  async delete(id) {
    try {
      const [result] = await db.execute('DELETE FROM quartos WHERE id = ?', [id]);
      if (result.affectedRows === 0) {
        const msg = 'Quarto não encontrado para exclusão';
        console.error(msg);
        throw new Error(msg);
      }
    } catch (error) {
      console.error('Erro no repository delete:', error);
      throw new Error(`Erro ao excluir quarto: ${error.message}`);
    }
  }
}

module.exports = new QuartoRepository();
