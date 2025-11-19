const eventoRepository = require('../repository/eventoRepository');

class EventoController {
  async getAll(req, res) {
    try {
      const eventos = await eventoRepository.findAll();
      return res.json({ success: true, data: eventos, total: eventos.length });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async searchByTitulo(req, res) {
    try {
      const { titulo = '' } = req.query || {};
      const eventos = await eventoRepository.findByTitulo(titulo);
      return res.json({ success: true, data: eventos, total: eventos.length });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getById(req, res) {
    try {
      const { id } = req.params;
      const evento = await eventoRepository.findById(id);
      if (!evento) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }
      return res.json({ success: true, data: evento.toJSON ? evento.toJSON() : evento });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async create(req, res) {
    try {
      const payload = req.body || {};
      const created = await eventoRepository.create(payload);
      return res.status(201).json({ success: true, data: created, message: 'Evento criado com sucesso' });
    } catch (error) {
      const msg = error?.message || 'Erro ao criar evento';
      const status = /obrigatório|invalid|erro/i.test(msg) ? 400 : 500;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async update(req, res) {
    try {
      const { id } = req.params;
      const payload = req.body || {};
      const updated = await eventoRepository.update(id, payload);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }
      return res.json({ success: true, data: updated, message: 'Evento atualizado com sucesso' });
    } catch (error) {
      const msg = error?.message || 'Erro ao atualizar evento';
      const status = /obrigatório|invalid|erro/i.test(msg) ? 400 : 500;
      return res.status(status).json({ success: false, message: msg });
    }
  }

  async remove(req, res) {
    try {
      const { id } = req.params;
      const ok = await eventoRepository.remove(id);
      if (!ok) {
        return res.status(404).json({ success: false, message: 'Evento não encontrado' });
      }
      return res.json({ success: true, message: 'Evento removido com sucesso' });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDoacoes(req, res) {
    try {
      const { id } = req.params;
      const { tipo = 'todos', data = 'todos', destinatario = 'todos', busca = '' } = req.query || {};
      const doacoes = await eventoRepository.getDonationsByEventoId(id, { tipo, data, destinatario, busca });
      return res.json({ success: true, data: doacoes, total: doacoes.length });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }

  async getRelatorio(req, res) {
    try {
      const { id } = req.params;
      const { tipo = 'todos', data = 'todos', destinatario = 'todos', busca = '', format = 'json' } = req.query || {};
      const report = await eventoRepository.getReportByEventoId(id, { tipo, data, destinatario, busca });

      if (String(format).toLowerCase() === 'csv') {
        const header = ['id','data','tipo','doador','eventoId','evento','idosoId','idoso','item','qntd','valor','obs'];
        const escape = (val) => {
          const s = String(val ?? '');
          // Escapa aspas duplas e envolve em aspas caso contenha vírgula/linha nova
          const needsQuote = /[",\n\r;]/.test(s);
          const safe = s.replace(/"/g, '""');
          return needsQuote ? `"${safe}"` : safe;
        };
        const lines = [header.join(',')];
        for (const d of report.doacoes) {
          const row = [
            escape(d.id),
            escape(d.data),
            escape(d.tipo),
            escape(d.doador?.nome ?? ''),
            escape(d.eventoId ?? ''),
            escape(d.evento ?? ''),
            escape(d.idosoId ?? ''),
            escape(d.idoso ?? ''),
            escape(d.tipo === 'D' ? '' : (d.doacao?.item ?? '')),
            escape(d.tipo === 'D' ? '' : (d.doacao?.qntd ?? '')),
            escape(d.tipo === 'D' ? (d.doacao?.valor ?? '') : ''),
            escape(d.obs ?? ''),
          ];
          lines.push(row.join(','));
        }
        const csv = lines.join('\n');
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename=relatorio-evento-${id}.csv`);
        return res.status(200).send(csv);
      }

      return res.json({ success: true, data: report });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

module.exports = new EventoController();
/*
  Controlador de Eventos
  - CRUD e listagem de eventos; lida com intervalos de data e ordenação.
*/