const express = require("express");
const DoacaoController = require("../controllers/doacaoController");
const router = express.Router();

// Versionamento simples por header para compatibilidade
router.use((req, res, next) => { res.setHeader('X-API-Version', '2'); next(); });

router.get("/", DoacaoController.getAll);
router.post("/filtrar", DoacaoController.getByFiltred)
router.get("/:id", DoacaoController.getById);
router.post('/', DoacaoController.create);
router.put("/:id", DoacaoController.update);
router.delete("/:id", DoacaoController.delete);
module.exports = router;
/*
  Rotas de Doações
  - Endpoints para registrar e consultar doações (alimentos, dinheiro, outros).
  - Prefixo: `/api/doacoes`.
*/
