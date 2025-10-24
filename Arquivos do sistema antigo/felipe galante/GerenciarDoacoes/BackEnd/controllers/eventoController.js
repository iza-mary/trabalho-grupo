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
}

module.exports = new EventoController();