const db = require('../config/database');
const Evento = require('../models/evento');
const doacaoRepository = require('./doacaoRepository');

class EventoRepository {
  async findAll() {
    try {
      // Seleciona todos os campos para suportar UI completa
      const [rows] = await db.execute('SELECT * FROM eventos ORDER BY titulo');
      return (rows || []).map((r) => new Evento(r).toJSON());
    } catch (err) {
      console.error('Erro ao buscar eventos (findAll):', err.message);
      return [];
    }
  }

  async findByTitulo(titulo) {
    try {
      const like = `%${titulo}%`;
      const [rows] = await db.execute('SELECT * FROM eventos WHERE titulo LIKE ? ORDER BY titulo', [like]);
      return (rows || []).map((r) => new Evento(r).toJSON());
    } catch (err) {
      console.error('Erro ao buscar eventos por título (findByTitulo):', err.message);
      return [];
    }
  }

  async findById(id) {
    try {
      const [rows] = await db.execute('SELECT * FROM eventos WHERE id = ?', [id]);
      if (!rows || rows.length === 0) return null;
      return new Evento(rows[0]);
    } catch (err) {
      console.error('Erro ao buscar evento por ID (findById):', err.message);
      return null;
    }
  }

  async create(data) {
    try {
      const evento = new Evento(data);
      const errors = evento.validate();
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      const [result] = await db.execute(
        `INSERT INTO eventos (titulo, tipo, cor, data_inicio, data_fim, hora_inicio, hora_fim, local, descricao, notificar, tempo_notificacao)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evento.titulo,
          evento.tipo,
          evento.cor,
          evento.dataInicio,
          evento.dataFim,
          evento.horaInicio,
          evento.horaFim,
          evento.local,
          evento.descricao,
          evento.notificar ? 1 : 0,
          evento.tempoNotificacao,
        ],
      );
      const insertedId = result.insertId;
      return { id: insertedId, ...evento.toJSON(), id: insertedId };
    } catch (err) {
      console.error('Erro ao criar evento (create):', err.message);
      throw err;
    }
  }

  async update(id, data) {
    try {
      const evento = new Evento({ id, ...data });
      const errors = evento.validate();
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }
      const [result] = await db.execute(
        `UPDATE eventos SET titulo = ?, tipo = ?, cor = ?, data_inicio = ?, data_fim = ?, hora_inicio = ?, hora_fim = ?, local = ?, descricao = ?, notificar = ?, tempo_notificacao = ?
         WHERE id = ?`,
        [
          evento.titulo,
          evento.tipo,
          evento.cor,
          evento.dataInicio,
          evento.dataFim,
          evento.horaInicio,
          evento.horaFim,
          evento.local,
          evento.descricao,
          evento.notificar ? 1 : 0,
          evento.tempoNotificacao,
          id,
        ],
      );
      if (result.affectedRows === 0) {
        return null;
      }
      return { id, ...evento.toJSON(), id };
    } catch (err) {
      console.error('Erro ao atualizar evento (update):', err.message);
      throw err;
    }
  }

  async remove(id) {
    try {
      const [result] = await db.execute('DELETE FROM eventos WHERE id = ?', [id]);
      return result.affectedRows > 0;
    } catch (err) {
      console.error('Erro ao remover evento (remove):', err.message);
      throw err;
    }
  }

  async getDonationsByEventoId(eventoId, { tipo = 'todos', data = 'todos', destinatario = 'todos', busca = '' } = {}) {
    const list = await doacaoRepository.findByEventoId(eventoId, { tipo, data, destinatario, busca });
    return list.map((d) => d.toJSON());
  }

  async getReportByEventoId(eventoId, { tipo = 'todos', data = 'todos', destinatario = 'todos', busca = '' } = {}) {
    const evento = await this.findById(eventoId);
    if (!evento) {
      throw new Error('Evento não encontrado');
    }

    const doacoes = await this.getDonationsByEventoId(eventoId, { tipo, data, destinatario, busca });

    const resumo = {
      totalDoacoes: doacoes.length,
      totalDinheiro: 0,
      totalItens: 0,
    };

    const porTipo = {};
    const porDoador = {};

    for (const d of doacoes) {
      porTipo[d.tipo] = (porTipo[d.tipo] || 0) + 1;
      const donorName = d.doador?.nome || 'Desconhecido';
      if (!porDoador[donorName]) {
        porDoador[donorName] = { doacoes: 0, dinheiro: 0, itens: 0 };
      }
      porDoador[donorName].doacoes += 1;

      if (d.tipo === 'D') {
        const val = Number(d.doacao?.valor ?? 0);
        resumo.totalDinheiro += val;
        porDoador[donorName].dinheiro += val;
      } else {
        const qtd = Number(d.doacao?.qntd ?? 0);
        resumo.totalItens += qtd;
        porDoador[donorName].itens += qtd;
      }
    }

    return {
      evento: evento.toJSON(),
      filtros: { tipo, data, destinatario, busca },
      resumo,
      porTipo,
      porDoador,
      doacoes,
    };
  }
}

module.exports = new EventoRepository();