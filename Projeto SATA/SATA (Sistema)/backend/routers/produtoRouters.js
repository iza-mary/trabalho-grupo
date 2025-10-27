const express = require('express');
const router = express.Router();
const ProdutoController = require('../controllers/produtoController');
const produtoController = new ProdutoController();

router.get('/', (req, res) => produtoController.getAll(req, res));
router.get('/:id', (req, res) => produtoController.getById(req, res));
router.post('/', (req, res) => produtoController.create(req, res));
router.put('/:id', (req, res) => produtoController.update(req, res));
router.delete('/:id', (req, res) => produtoController.delete(req, res));
router.post('/:id/movimentar', (req, res) => produtoController.movimentar(req, res));
router.get('/:id/historico', (req, res) => produtoController.historico(req, res));

module.exports = router;