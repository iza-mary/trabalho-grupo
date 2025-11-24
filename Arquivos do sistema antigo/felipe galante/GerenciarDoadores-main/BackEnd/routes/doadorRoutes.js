// Rotas da API de doadores: encaminham requisições para o controller
const express = require("express");
const { doadorController } = require("../di/container");

const router = express.Router();

// Lista todos os doadores
router.get('/', (req, res) => doadorController.getAll(req, res));
// Busca um doador pelo id
router.get('/:id', (req, res) => doadorController.getById(req, res));
// Cria um novo doador
router.post('/', (req, res) => doadorController.create(req, res));
// Atualiza um doador existente
router.put('/:id', (req, res) => doadorController.update(req, res));
// Remove um doador
router.delete('/:id', (req, res) => doadorController.delete(req, res));
// Filtra doadores por termos variados
router.post('/filtrar', (req, res) => doadorController.getByBusca(req, res));
module.exports = router;