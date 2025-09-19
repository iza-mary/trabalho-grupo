const express = require("express");
const DoacaoController = require("../controllers/doacaoController");
const doacaoController = require("../controllers/doacaoController");
const router = express.Router();

router.get("/", DoacaoController.getAll);
router.post("/filtrar", doacaoController.getByFiltred)
router.get("/:id", DoacaoController.getById);
router.post('/', DoacaoController.create);
router.put("/:id", doacaoController.update);
router.delete("/:id", doacaoController.delete);
module.exports = router;