const express = require("express");
const { doadorController } = require("../di/container");

const router = express.Router();

router.get('/', (req, res) => doadorController.getAll(req, res));
router.get('/:id', (req, res) => doadorController.getById(req, res));
router.post('/', (req, res) => doadorController.create(req, res));
router.put('/:id', (req, res) => doadorController.update(req, res));
router.delete('/:id', (req, res) => doadorController.delete(req, res));
router.post('/filtrar', (req, res) => doadorController.getByBusca(req, res));
module.exports = router;