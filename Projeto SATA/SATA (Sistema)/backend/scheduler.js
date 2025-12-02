const cron = require('node-cron');
const eventoController = require('./controllers/eventoController');
const ProdutoRepository = require('./repository/produtoRepository');
const db = require('./config/database');

// Agenda a verificação de eventos próximos a cada 30 minutos
cron.schedule('*/30 * * * *', () => {
  try { eventoController.verificarEventosProximos(); } catch (_) {}
});

cron.schedule('*/10 * * * *', () => {
  try { ProdutoRepository.checkAndNotifyLowStock(); } catch (_) {}
});

// Agendador iniciado (silencioso)

cron.schedule('* * * * *', async () => {
  try {
    await db.execute(`DELETE FROM notificacoes WHERE id NOT IN (
      SELECT id FROM (
        SELECT id FROM notificacoes ORDER BY data_criacao DESC, id DESC LIMIT 20
      ) AS t
    )`);
  } catch (_) {}
});
