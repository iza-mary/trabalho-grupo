const express = require('express');
const EventoController = require('../controllers/eventoController');
const router = express.Router();

router.get('/', EventoController.getAll);
router.get('/buscar', EventoController.searchByTitulo);

module.exports = router;