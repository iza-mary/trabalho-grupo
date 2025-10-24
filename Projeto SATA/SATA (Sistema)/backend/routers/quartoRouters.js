const express = require('express');
const quartoController = require('../controllers/quartoController');

const router = express.Router();

// Rotas CRUD para quartos
router.get('/', quartoController.getAll);
router.get('/disponiveis', quartoController.getDisponiveis);
router.get('/:id', quartoController.getById);
router.post('/', quartoController.create);
router.put('/:id', quartoController.update);
router.delete('/:id', quartoController.delete);

module.exports = router;