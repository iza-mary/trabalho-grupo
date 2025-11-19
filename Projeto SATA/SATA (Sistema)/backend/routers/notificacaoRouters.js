const express = require('express');
const router = express.Router();
const notificacaoController = require('../controllers/notificacaoController');

// Rotas básicas CRUD
router.get('/', (req, res) => notificacaoController.getAll(req, res));
router.get('/recentes', (req, res) => notificacaoController.getRecentes(req, res));
router.get('/contadores', (req, res) => notificacaoController.getContadores(req, res));
router.get('/:id', (req, res) => notificacaoController.getById(req, res));
router.post('/', (req, res) => notificacaoController.create(req, res));
router.put('/:id', (req, res) => notificacaoController.update(req, res));
router.delete('/:id', (req, res) => notificacaoController.delete(req, res));

// Rotas específicas para marcar como lida
router.patch('/:id/marcar-lida', (req, res) => notificacaoController.marcarComoLida(req, res));
router.patch('/marcar-lidas', (req, res) => notificacaoController.marcarVariasComoLidas(req, res));

// Rotas para criar notificações específicas
router.post('/cadastro', (req, res) => notificacaoController.criarNotificacaoCadastro(req, res));
router.post('/estoque-baixo', (req, res) => notificacaoController.criarNotificacaoEstoqueBaixo(req, res));

module.exports = router;
/*
  Rotas de Notificações
  - Endpoints para consulta, contadores e marcação de notificações.
  - Prefixo: `/api/notificacoes`.
*/