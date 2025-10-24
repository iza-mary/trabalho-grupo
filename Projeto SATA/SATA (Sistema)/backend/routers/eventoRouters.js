const express = require('express');
const eventoController = require('../controllers/eventoController');

const router = express.Router();

router.get('/', eventoController.getAll);
router.get('/buscar', eventoController.searchByTitulo);
router.get('/:id', eventoController.getById);
router.get('/:id/doacoes', eventoController.getDoacoes);
router.get('/:id/relatorio', eventoController.getRelatorio);

// CRUD
router.post('/', eventoController.create);
router.put('/:id', eventoController.update);
router.delete('/:id', eventoController.remove);

module.exports = router;