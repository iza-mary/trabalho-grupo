const express = require('express');
const EventoController = require('../controllers/eventoController');
const router = express.Router();

router.get('/', EventoController.getAll);
router.get('/search', EventoController.searchByTitulo);

module.exports = router;