const express = require("express");
const router = express.Router();

const controller = require("../controllers/despesasController");

router.get("/", controller.getAll);
router.post("/", controller.create);
router.delete("/:id", controller.remove);
router.put("/:id", controller.update);
router.get("/:id", controller.getById);

module.exports = router;
