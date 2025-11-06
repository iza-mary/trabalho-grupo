const express = require("express");
const doadorController = require("../controllers/doadorController");

const router = express.Router();

router.get('/', doadorController.getAll);
router.get('/:id', doadorController.getById);
router.get('/:id/ficha', doadorController.getFicha);
router.post('/', doadorController.create);
router.put("/:id", doadorController.update);
router.delete("/:id", doadorController.delete);
router.post("/filtrar", doadorController.getByBusca);
module.exports = router;