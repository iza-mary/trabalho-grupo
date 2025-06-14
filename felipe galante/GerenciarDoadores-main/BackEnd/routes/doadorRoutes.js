const express = require("express");
const DoadorController = require("../controllers/doadorController");
const doadorController = require("../controllers/doadorController");

const router = express.Router();

router.get('/', DoadorController.getAll);
router.get('/:id', DoadorController.getById);
router.post('/', doadorController.create);
router.put("/:id", doadorController.update);
router.delete("/:id", doadorController.delete);
router.post("/filtrar", doadorController.getByBusca);
module.exports = router;