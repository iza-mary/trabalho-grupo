//Arquivo Temporário
const express = require("express");
const doacaoController = require("../controllers/doacaoController.js");

const router = express.Router();

router.get('/', doacaoController.getAllByDoadorDoacao);
router.post('/', doacaoController.createDoacao);

module.exports = router;