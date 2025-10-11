const db = require('../config/database');

class EventoRepository {
  async findAll() {
    try {
      const [rows] = await db.execute('SELECT id, titulo FROM eventos ORDER BY titulo');
      return rows || [];
    } catch (err) {
      console.error('Erro ao buscar eventos (findAll):', err.message);
      return [];
    }
  }

  async findByTitulo(titulo) {
    try {
      const like = `%${titulo}%`;
      const [rows] = await db.execute('SELECT id, titulo FROM eventos WHERE titulo LIKE ? ORDER BY titulo', [like]);
      return rows || [];
    } catch (err) {
      console.error('Erro ao buscar eventos por título (findByTitulo):', err.message);
      return [];
    }
  }
}

module.exports = new EventoRepository();