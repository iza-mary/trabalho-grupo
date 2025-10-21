const express = require("express");
const DoacaoController = require("../controllers/doacaoController");
const router = express.Router();

router.get("/", DoacaoController.getAll);
router.post("/filtrar", DoacaoController.getByFiltred)
router.get("/:id", DoacaoController.getById);
router.post('/', DoacaoController.create);
router.put("/:id", DoacaoController.update);
router.delete("/:id", DoacaoController.delete);
module.exports = router;