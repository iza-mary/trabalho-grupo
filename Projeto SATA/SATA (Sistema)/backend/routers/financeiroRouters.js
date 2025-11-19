const express = require('express');
const controller = require('../controllers/financeiroController');

const router = express.Router();

router.get('/', (req, res) => controller.getAll(req, res));
router.get('/:id', (req, res) => controller.getById(req, res));
router.post('/', (req, res) => controller.create(req, res));
router.put('/:id', (req, res) => controller.update(req, res));
router.delete('/:id', (req, res) => controller.remove(req, res));

module.exports = router;
/*
  Rotas Financeiras
  - Endpoints para entradas, saídas e relatórios locais.
  - Prefixo: `/api/financeiro`.
*/