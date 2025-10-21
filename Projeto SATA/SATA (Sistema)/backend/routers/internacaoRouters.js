const express = require('express');
const internacaoController = require('../controllers/internacaoController');

const router = express.Router();

// Rotas para internações
router.get('/', internacaoController.getAll);
router.get('/ativas', internacaoController.getAtivas);
router.get('/:id', internacaoController.getById);
router.get('/idoso/:id', internacaoController.getByUsuarioId);
router.get('/quartos/:quartoId/camas', internacaoController.getCamasDisponiveis);
router.post('/', internacaoController.create);
// Novas nomenclaturas: "dar baixa"; mantém compatibilidade com rota antiga
router.put('/:id/baixa', internacaoController.darBaixa);
router.put('/:id/finalizar', internacaoController.finalizar);

module.exports = router;